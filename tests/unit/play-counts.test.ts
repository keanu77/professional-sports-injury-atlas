import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  recordPlay,
  popularPlays,
  WINDOW_SECONDS,
  POPULAR_INTERVAL_SECONDS,
  type PlaybackDatabase,
  type PlaybackStatement,
} from "../../src/lib/video/play-counts";
import { createPlaybackTracker } from "../../src/lib/video/playback-tracking";
import { createPlayer } from "../../src/lib/video/youtube-api-adapter";
import { createRequestLimiter } from "../../src/lib/video/play-rate-limit";
import { publicVideoIds } from "../../src/lib/videos/public-video-ids";

const videoId = "9JoITljMoU0";
const otherVideo = "5STUOgvQWgQ";
const now = 1788717600;
function database() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("migrations/0001_play_events.sql", "utf8"));
  sqlite.exec(readFileSync("migrations/0003_play_guards.sql", "utf8"));
  class Statement implements PlaybackStatement {
    values: (string | number)[] = [];
    constructor(readonly sql: string) {}
    bind(...values: (string | number)[]) {
      this.values = values;
      return this;
    }
    async all<T>() {
      return { results: sqlite.prepare(this.sql).all(...this.values) as T[] };
    }
  }
  const db: PlaybackDatabase = {
    prepare: (sql) => new Statement(sql),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = (statements as Statement[]).map((s) => ({
          results: sqlite.prepare(s.sql).all(...s.values),
        }));
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
  return { db, sqlite };
}
function request(
  body: unknown,
  headers: Record<string, string> = {},
  method = "POST",
) {
  return new Request("https://atlas.example/api/plays", {
    method,
    headers: {
      Origin: "https://atlas.example",
      "Content-Type": "application/json",
      "CF-Connecting-IP": "192.0.2.1",
      ...headers,
    },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
}
const event = (id = crypto.randomUUID(), v = videoId) => ({
  eventId: id,
  videoId: v,
});
const popularRequest = new Request("https://atlas.example/api/popular");

describe("actual-playback statistics with real SQLite queries", () => {
  it("bounds bursts separately per address and expires minute buckets", () => {
    const allow = createRequestLimiter(2);
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 1)).toBe(true);
    expect(allow("a", 2)).toBe(false);
    expect(allow("b", 2)).toBe(true);
    expect(allow("a", 60000)).toBe(true);
  });
  it("starts empty and counts duplicate/retried events only once", async () => {
    const { db, sqlite } = database();
    const ctx = { request: popularRequest, env: { PLAYBACK_DB: db } };
    expect((await (await popularPlays(ctx, now)).json()).items).toEqual([]);
    const first = event();
    for (const item of [
      first,
      first,
      event(),
      event(crypto.randomUUID(), otherVideo),
    ])
      expect(
        (await recordPlay({ request: request(item), env: ctx.env }, now - 1))
          .status,
      ).toBe(200);
    const result = await (await popularPlays(ctx, now)).json();
    expect(result.windowDays).toBe(30);
    expect(result.items).toEqual([
      { videoId: otherVideo, count: 1 },
      { videoId, count: 1 },
    ]);
    expect(
      sqlite.prepare("SELECT COUNT(*) AS n FROM play_events").get()?.n,
    ).toBe(2);
    sqlite.close();
  });
  it("uses the completed-hour 30-day window, server time, and valid IDs", async () => {
    const { db, sqlite } = database();
    const insert = sqlite.prepare("INSERT INTO play_events VALUES (?,?,?)");
    for (const time of [
      now - WINDOW_SECONDS - 1,
      now - WINDOW_SECONDS,
      now - WINDOW_SECONDS + 1,
      now,
      now + 1,
    ])
      insert.run(crypto.randomUUID(), videoId, time);
    insert.run(crypto.randomUUID(), "invalid-id!", now);
    expect(
      (
        await (
          await popularPlays(
            { request: popularRequest, env: { PLAYBACK_DB: db } },
            now,
          )
        ).json()
      ).items,
    ).toEqual([{ videoId, count: 2 }]);
    await recordPlay(
      { request: request(event()), env: { PLAYBACK_DB: db } },
      now,
    );
    expect(
      sqlite
        .prepare("SELECT COUNT(*) AS n FROM play_events WHERE played_at <= ?")
        .get(now - WINDOW_SECONDS - 1)?.n,
    ).toBe(0);
    expect(
      (
        await recordPlay(
          {
            request: request({ ...event(), playedAt: now + 100 }),
            env: { PLAYBACK_DB: db },
          },
          now,
        )
      ).status,
    ).toBe(400);
    sqlite.close();
  });
  it.each(["2026-09-06T15:00:00+08:00", "2026-09-06T23:00:00+08:00"])(
    "keeps ranks stable within %s and rolls forward at the next hour",
    async (date) => {
      const start = Date.parse(date) / 1000;
      const { db, sqlite } = database();
      const ctx = { request: popularRequest, env: { PLAYBACK_DB: db } };
      const insert = sqlite.prepare("INSERT INTO play_events VALUES (?,?,?)");
      insert.run(crypto.randomUUID(), videoId, start - WINDOW_SECONDS + 10);
      insert.run(crypto.randomUUID(), videoId, start - 10);
      for (const offset of [0, POPULAR_INTERVAL_SECONDS - 1]) {
        await recordPlay(
          {
            request: request(event(crypto.randomUUID(), otherVideo)),
            env: ctx.env,
          },
          start + offset,
        );
        const response = await popularPlays(ctx, start + offset);
        expect(response.headers.get("Cache-Control")).toBe(
          `public, max-age=${POPULAR_INTERVAL_SECONDS - offset}`,
        );
        expect(await response.json()).toEqual({
          windowDays: 30,
          generatedAt: new Date(start * 1000).toISOString(),
          items: [{ videoId, count: 2 }],
        });
      }
      // Cleanup triggered by a new play must not remove rows still in this hour's window.
      expect(
        sqlite.prepare("SELECT COUNT(*) AS n FROM play_events").get()?.n,
      ).toBe(4);
      const next = await popularPlays(ctx, start + POPULAR_INTERVAL_SECONDS);
      expect(next.headers.get("Cache-Control")).toBe("public, max-age=3600");
      expect(await next.json()).toEqual({
        windowDays: 30,
        generatedAt: new Date(
          (start + POPULAR_INTERVAL_SECONDS) * 1000,
        ).toISOString(),
        items: [
          { videoId: otherVideo, count: 2 },
          { videoId, count: 1 },
        ],
      });
      sqlite.close();
    },
  );
  it.each([
    [{}, {}, 400],
    [event(crypto.randomUUID(), "abcdefghijk"), {}, 400],
    [{ videoId, eventId: "bad" }, {}, 400],
    [event(), { Origin: "https://other.example" }, 403],
    [event(), { "Sec-Fetch-Site": "cross-site" }, 403],
    [event(), { "Content-Type": "text/plain" }, 415],
    [event(), { "Content-Type": "application/json-invalid" }, 415],
    [{ videoId, eventId: "x".repeat(1024) }, {}, 400],
  ])(
    "rejects invalid/untrusted input without touching storage",
    async (body, headers, status) => {
      expect(
        (
          await recordPlay(
            {
              request: request(body, headers as Record<string, string>),
              env: {},
            },
            now,
          )
        ).status,
      ).toBe(status);
    },
  );
  it("fails closed without binding and respects DNT/GPC", async () => {
    expect(
      (await recordPlay({ request: request(event()), env: {} }, now)).status,
    ).toBe(503);
    expect(
      (await popularPlays({ request: popularRequest, env: {} }, now)).status,
    ).toBe(503);
    expect(
      (await recordPlay({ request: request(null, {}, "GET"), env: {} }, now))
        .status,
    ).toBe(405);
    for (const header of ["DNT", "Sec-GPC"])
      expect(
        await (
          await recordPlay(
            { request: request(event(), { [header]: "1" }), env: {} },
            now,
          )
        ).json(),
      ).toEqual({ accepted: false });
  });
});

describe("shared playback abuse guard", () => {
  it("deduplicates competing new UUIDs across independent edge handlers", async () => {
    const { db, sqlite } = database();
    vi.resetModules();
    const edgeA = (await import("../../src/lib/video/play-counts")).recordPlay;
    vi.resetModules();
    const edgeB = (await import("../../src/lib/video/play-counts")).recordPlay;
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        (i % 2 ? edgeA : edgeB)(
          { request: request(event()), env: { PLAYBACK_DB: db } },
          now,
        ).then((r) => r.json()),
      ),
    );
    expect(results.filter((r) => r.accepted)).toHaveLength(1);
    expect(results.filter((r) => r.reason === "duplicate")).toHaveLength(19);
    expect(
      sqlite.prepare("SELECT COUNT(*) AS n FROM play_events").get()?.n,
    ).toBe(1);
    sqlite.close();
  });
  it("admits at the exact ten-minute boundary and allows different IPs", async () => {
    const { db, sqlite } = database();
    const play = (time: number, ip = "192.0.2.1") =>
      recordPlay(
        {
          request: request(event(), { "CF-Connecting-IP": ip }),
          env: { PLAYBACK_DB: db },
        },
        time,
      ).then((r) => r.json());
    expect(await play(now)).toMatchObject({ accepted: true });
    expect(await play(now + 599)).toEqual({
      accepted: false,
      reason: "duplicate",
    });
    expect(await play(now + 599, "192.0.2.2")).toMatchObject({
      accepted: true,
    });
    expect(await play(now + 600)).toMatchObject({ accepted: true });
    sqlite.close();
  });
  it("globally caps all attempts including duplicates at 30 per minute", async () => {
    const { db, sqlite } = database();
    const ids = [...publicVideoIds];
    const results = await Promise.all(
      Array.from({ length: 60 }, (_, i) =>
        recordPlay(
          {
            request: request(event(crypto.randomUUID(), ids[i % ids.length]!)),
            env: { PLAYBACK_DB: { ...db } },
          },
          now,
        ).then(async (r) => ({ status: r.status, ...(await r.json()) })),
      ),
    );
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(results.filter((r) => r.accepted)).toHaveLength(30);
    expect(results.filter((r) => r.reason === "rate-limit")).toHaveLength(30);
    const retry = await recordPlay(
      {
        request: request(event(crypto.randomUUID(), ids[31]!)),
        env: { PLAYBACK_DB: db },
      },
      now + 60,
    );
    expect(await retry.json()).toMatchObject({ accepted: true });
    sqlite.close();
  });
  it("charges repeated UUIDs to the shared request allowance", async () => {
    const { db, sqlite } = database();
    const repeated = event();
    for (let i = 0; i < 30; i++) {
      const response = await recordPlay(
        { request: request(repeated), env: { PLAYBACK_DB: db } },
        now,
      );
      expect(await response.json()).toMatchObject(
        i ? { accepted: false, reason: "duplicate" } : { accepted: true },
      );
    }
    const limited = await recordPlay(
      {
        request: request(event(crypto.randomUUID(), otherVideo)),
        env: { PLAYBACK_DB: db },
      },
      now,
    );
    expect(limited.status).toBe(200);
    expect(await limited.json()).toEqual({
      accepted: false,
      reason: "rate-limit",
    });
    sqlite.close();
  });
  it("rotates domain-separated keys each Taiwan day and clears rows at 48 hours", async () => {
    const { db, sqlite } = database();
    const midnight = Date.parse("2026-09-07T00:00:00+08:00") / 1000;
    const play = (time: number) =>
      recordPlay({ request: request(event()), env: { PLAYBACK_DB: db } }, time);
    expect(await (await play(midnight - 1)).json()).toMatchObject({
      accepted: true,
    });
    expect(await (await play(midnight)).json()).toMatchObject({
      accepted: true,
    });
    const rows = sqlite
      .prepare("SELECT * FROM play_attempts ORDER BY created_at")
      .all();
    expect(rows).toHaveLength(2);
    expect(rows[0]!.ip_key).not.toBe(rows[1]!.ip_key);
    expect(rows[0]!.video_key).not.toBe(rows[1]!.video_key);
    expect(rows[0]!.ip_key).not.toBe(rows[0]!.video_key);
    expect(JSON.stringify(rows)).not.toContain("192.0.2.1");
    expect(JSON.stringify(rows)).not.toContain(videoId);
    await play(midnight - 1 + 172800);
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(*) AS n FROM play_attempts WHERE created_at <= ?",
        )
        .get(midnight - 1)?.n,
    ).toBe(0);
    expect(
      sqlite.prepare("SELECT COUNT(*) AS n FROM play_events").get()?.n,
    ).toBe(3);
    sqlite.close();
  });
  it("never queries storage for DNT/GPC, and logs only bounded outcomes", async () => {
    const { db, sqlite } = database();
    const prepare = vi.spyOn(db, "prepare");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    for (const header of ["DNT", "Sec-GPC"]) {
      expect(
        await (
          await recordPlay(
            {
              request: request(event(), { [header]: "1" }),
              env: { PLAYBACK_DB: db },
            },
            now,
          )
        ).json(),
      ).toEqual({ accepted: false });
    }
    expect(prepare).not.toHaveBeenCalled();
    for (let i = 0; i < 31; i++)
      await recordPlay(
        { request: request(event()), env: { PLAYBACK_DB: db } },
        now,
      );
    await recordPlay({ request: request(event()), env: {} }, now);
    expect(
      new Set(log.mock.calls.map((call) => JSON.parse(call[0]).reason)),
    ).toEqual(new Set(["accepted", "duplicate", "rate-limit", "unavailable"]));
    for (const call of log.mock.calls)
      expect(Object.keys(JSON.parse(call[0])).sort()).toEqual([
        "event",
        "reason",
      ]);
    expect(JSON.stringify(log.mock.calls)).not.toContain(videoId);
    expect(JSON.stringify(log.mock.calls)).not.toContain("192.0.2.1");
    sqlite.close();
  });
  it("migration preserves existing play events and its generated secret on rerun", () => {
    const sqlite = new DatabaseSync(":memory:");
    sqlite.exec(readFileSync("migrations/0001_play_events.sql", "utf8"));
    sqlite
      .prepare("INSERT INTO play_events VALUES (?, ?, ?)")
      .run("old-event", videoId, now);
    const migration = readFileSync("migrations/0003_play_guards.sql", "utf8");
    sqlite.exec(migration);
    const key = sqlite
      .prepare("SELECT secret FROM play_guard_key")
      .get()?.secret;
    sqlite.exec(migration);
    expect(
      sqlite.prepare("SELECT secret FROM play_guard_key").get()?.secret,
    ).toBe(key);
    expect(sqlite.prepare("SELECT * FROM play_events").all()).toEqual([
      { event_id: "old-event", video_id: videoId, played_at: now },
    ]);
    sqlite.close();
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
describe("YouTube playing event, not player loading", () => {
  function browser(enabled = true) {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("navigator", { doNotTrack: "0" });
    vi.stubGlobal("document", {
      documentElement: {
        dataset: { playbackStatistics: enabled ? "enabled" : undefined },
      },
    });
    vi.stubGlobal("window", { setTimeout });
    return fetch;
  }
  it("ready, paused, buffering and ended never count; repeated PLAYING counts once", () => {
    const fetch = browser();
    const onPlaying = createPlaybackTracker(videoId);
    let events: any;
    class Player {
      constructor(_el: unknown, options: any) {
        events = options.events;
      }
    }
    createPlayer({ Player }, {} as HTMLIFrameElement, {
      onReady: vi.fn(),
      onError: vi.fn(),
      onPlaying,
    });
    events.onReady({});
    for (const data of [-1, 0, 2, 3, 5]) events.onStateChange({ data });
    expect(fetch).not.toHaveBeenCalled();
    events.onStateChange({ data: 1 });
    events.onStateChange({ data: 2 });
    events.onStateChange({ data: 1 });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe("/api/plays");
    expect(JSON.parse(fetch.mock.calls[0][1].body).videoId).toBe(videoId);
  });
  it("review builds and privacy preferences send nothing", () => {
    const fetch = browser(false);
    createPlaybackTracker(videoId)();
    expect(fetch).not.toHaveBeenCalled();
    browser();
    vi.stubGlobal("navigator", { doNotTrack: "1" });
    createPlaybackTracker(videoId)();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    createPlaybackTracker(videoId)();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it("retries with identical ID while separate page visits receive different IDs", async () => {
    vi.useFakeTimers();
    const fetch = browser();
    fetch.mockRejectedValueOnce(new Error("offline"));
    createPlaybackTracker(videoId)();
    await vi.advanceTimersByTimeAsync(1500);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0][1].body).toBe(fetch.mock.calls[1][1].body);
    createPlaybackTracker(videoId)();
    expect(fetch.mock.calls[2][1].body).not.toBe(fetch.mock.calls[0][1].body);
  });
});
