import { publicVideoIds } from "../videos/public-video-ids";
import { allowPopularRequest } from "./play-rate-limit";
import { guardAndRecordPlay, type PlayOutcome } from "./play-guard";

export const WINDOW_SECONDS = 30 * 24 * 60 * 60;
export const POPULAR_INTERVAL_SECONDS = 60 * 60;
const hourStart = (time: number) =>
  Math.floor(time / POPULAR_INTERVAL_SECONDS) * POPULAR_INTERVAL_SECONDS;
export const POPULAR_PLAYS =
  "SELECT video_id AS videoId, COUNT(*) AS count FROM play_events WHERE played_at >= ? AND played_at < ? GROUP BY video_id ORDER BY count DESC, video_id ASC";

// Minimal structural subset of the documented D1 binding, also usable in tests.
export interface PlaybackStatement {
  bind(...values: (string | number)[]): PlaybackStatement;
  all<T>(): Promise<{ results: T[] }>;
}
export interface PlaybackDatabase {
  prepare(sql: string): PlaybackStatement;
  batch(statements: PlaybackStatement[]): Promise<{ results: unknown[] }[]>;
}
export interface PlaybackContext {
  request: Request;
  env: { PLAYBACK_DB?: PlaybackDatabase };
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    },
  });
}

async function smallJson(request: Request): Promise<unknown> {
  if (!request.body) throw new Error("missing-body");
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 512) {
      await reader.cancel();
      throw new Error("body-too-large");
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function recordPlay(
  { request, env }: PlaybackContext,
  now = Math.floor(Date.now() / 1000),
): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method" }, 405);
  if (
    request.headers.get("Origin") !== new URL(request.url).origin ||
    request.headers.get("Sec-Fetch-Site") === "cross-site"
  )
    return json({ error: "origin" }, 403);
  if (
    request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return json({ error: "content-type" }, 415);
  let value: unknown;
  try {
    value = await smallJson(request);
  } catch {
    return json({ error: "invalid-event" }, 400);
  }
  const event = value as { videoId?: unknown; eventId?: unknown } | null;
  if (
    !event ||
    typeof event.videoId !== "string" ||
    !publicVideoIds.has(event.videoId) ||
    typeof event.eventId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      event.eventId,
    ) ||
    Object.keys(event).some((key) => !["videoId", "eventId"].includes(key))
  )
    return json({ error: "invalid-event" }, 400);
  if (
    request.headers.get("DNT") === "1" ||
    request.headers.get("Sec-GPC") === "1"
  )
    return json({ accepted: false });
  const observe = (reason: PlayOutcome | "unavailable") => {
    // Bounded labels only: no addresses, hashes, event/video IDs or exceptions.
    console.info(JSON.stringify({ event: "play-guard", reason }));
  };
  try {
    const reason = await guardAndRecordPlay(
      env.PLAYBACK_DB,
      request.headers.get("CF-Connecting-IP") ?? "",
      event.eventId,
      event.videoId,
      now,
      // Keep the entire current hourly window; cleanup must not change its rank.
      hourStart(now) - WINDOW_SECONDS - 1,
    );
    observe(reason);
    return json(
      reason === "accepted" ? { accepted: true } : { accepted: false, reason },
    );
  } catch {
    observe("unavailable");
    return json({ error: "unavailable" }, 503);
  }
}

export async function popularPlays(
  { request, env }: PlaybackContext,
  now = Math.floor(Date.now() / 1000),
): Promise<Response> {
  if (request.method !== "GET") return json({ error: "method" }, 405);
  if (
    !allowPopularRequest(
      request.headers.get("CF-Connecting-IP") ?? "unknown",
      now * 1000,
    )
  )
    return json({ error: "rate-limited" }, 429);
  if (!env.PLAYBACK_DB) return json({ error: "unavailable" }, 503);
  try {
    // Every visitor sees the same completed-hour cutoff, including cache misses.
    const cutoff = hourStart(now);
    const { results } = await env.PLAYBACK_DB.prepare(POPULAR_PLAYS)
      .bind(cutoff - WINDOW_SECONDS, cutoff)
      .all<{ videoId: string; count: number }>();
    const response = json({
      windowDays: 30,
      generatedAt: new Date(cutoff * 1000).toISOString(),
      items: results.filter((row) => publicVideoIds.has(row.videoId)),
    });
    response.headers.set(
      "Cache-Control",
      `public, max-age=${cutoff + POPULAR_INTERVAL_SECONDS - now}`,
    );
    return response;
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}
