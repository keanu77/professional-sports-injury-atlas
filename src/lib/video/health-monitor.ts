import { parseFragment, type DefaultTreeAdapterMap } from "parse5";
import { parseYouTubeVideoId } from "./youtube";
import {
  observationCanonicalUrlFor,
  observationEmbedFor,
} from "../videos/observation-provider";

export const HEALTH_USER_AGENT =
  "SportsInjuryAtlasHealth/1.0 (+https://github.com/keanu77/professional-sports-injury-atlas)";

export type HealthReason =
  | "ok"
  | "not-found"
  | "gone"
  | "access-denied"
  | "access-challenge"
  | "rate-limited"
  | "server-error"
  | "http-error"
  | "timeout"
  | "network-error"
  | "invalid-url"
  | "invalid-response"
  | "response-too-large"
  | "youtube-api-key-unavailable"
  | "non-youtube-provider";

interface ProbeResult {
  httpStatus: number | null;
  reason: HealthReason;
  /** Query strings, credentials and fragments are never retained. */
  finalUrl: string | null;
  attempts: number;
}

export interface AvailabilityResult extends ProbeResult {
  status: "available" | "unavailable" | "indeterminate";
}

export interface EmbedCapabilityResult extends ProbeResult {
  status: "embeddable" | "not-embeddable" | "not-checked" | "indeterminate";
  basis:
    "youtube-data-api" | "youtube-api-key-unavailable" | "non-youtube-provider";
}

export interface PublicVideoHealthInput {
  slug: string;
  provider?: "youtube" | "mlb";
  videoUrl: string;
  sourceUrls: readonly string[];
}

export interface PublicVideoHealthResult {
  slug: string;
  provider: "youtube" | "mlb";
  videoId: string;
  sourceAvailability: Array<{ url: string; result: AvailabilityResult }>;
  /** Legacy name: for MLB this is canonical-page HTTP availability only. */
  youtubeMetadata: AvailabilityResult;
  metadataBasis: "youtube-oembed" | "provider-page";
  /** Public oEmbed markup is useful without a key, but is not a playback test. */
  embedMarkup: {
    status: "present" | "absent" | "indeterminate" | "not-checked";
    basis: "youtube-oembed" | "non-youtube-provider";
  };
  embedCapability: EmbedCapabilityResult;
}

export interface PublicVideoHealthArtifact {
  schemaVersion: 2;
  scope: "public-video-source-health";
  checkedAt: string;
  requestUserAgent: string;
  playbackVerification: "not-performed";
  overallStatus: "healthy" | "degraded" | "failed";
  summary: {
    videos: number;
    sourceUrls: number;
    unavailableSources: number;
    indeterminateSources: number;
    sourceReasons: Partial<Record<HealthReason, number>>;
    unavailableMetadata: number;
    indeterminateMetadata: number;
    embedMarkupPresent: number;
    notEmbeddable: number;
    embedChecksCompleted: number;
    embedChecksIndeterminate: number;
    embedChecksSkipped: number;
  };
  videos: PublicVideoHealthResult[];
}

export interface HealthMonitorOptions {
  fetchImpl?: typeof fetch;
  now?: () => Date;
  youtubeApiKey?: string | null;
  timeoutMs?: number;
  maxBodyBytes?: number;
  concurrency?: number;
  /** Only transient network/timeout/server errors are retried, at most once. */
  retryDelayMs?: number;
}

function createLimiter(limit: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  return async <T>(job: () => Promise<T>): Promise<T> => {
    if (active >= limit)
      await new Promise<void>((resolve) => {
        queue.push(resolve);
      });
    active++;
    try {
      return await job();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}

async function readBounded(
  response: Response,
  maxBytes: number,
): Promise<{ text: string; tooLarge: boolean }> {
  const reader = response.body?.getReader();
  if (!reader) return { text: "", tooLarge: false };
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) return { text: text + decoder.decode(), tooLarge: false };
    const remaining = maxBytes - bytes;
    bytes += value.byteLength;
    text += decoder.decode(value.subarray(0, remaining), { stream: true });
    if (bytes > maxBytes) {
      await reader.cancel();
      return { text: text + decoder.decode(), tooLarge: true };
    }
  }
}

function publicHttpsUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.hostname === "localhost" ||
      /^(?:127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1\]?$)/.test(url.hostname)
    )
      return null;
    return url;
  } catch {
    return null;
  }
}

function redactUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

function httpReason(status: number): HealthReason {
  if (status === 404) return "not-found";
  if (status === 410) return "gone";
  if ([401, 403, 451].includes(status)) return "access-denied";
  if (status === 429) return "rate-limited";
  if (status === 408) return "timeout";
  if (status >= 500) return "server-error";
  return status >= 200 && status < 300 ? "ok" : "http-error";
}

const availability = (probe: ProbeResult): AvailabilityResult => ({
  ...probe,
  status:
    probe.reason === "ok"
      ? "available"
      : ["not-found", "gone", "invalid-url"].includes(probe.reason)
        ? "unavailable"
        : "indeterminate",
});

function hasYouTubeEmbed(html: unknown, videoId: string): boolean {
  if (typeof html !== "string") return false;
  const visit = (node: DefaultTreeAdapterMap["node"]): boolean => {
    if ("tagName" in node && node.tagName === "iframe") {
      const src = node.attrs.find((attr) => attr.name === "src")?.value;
      try {
        const url = new URL(src ?? "");
        if (
          url.protocol === "https:" &&
          ["www.youtube.com", "www.youtube-nocookie.com"].includes(
            url.hostname,
          ) &&
          !url.username &&
          !url.password &&
          !url.port &&
          url.pathname === `/embed/${videoId}`
        )
          return true;
      } catch {
        /* Not valid YouTube iframe markup. */
      }
    }
    return "childNodes" in node && node.childNodes.some(visit);
  };
  return visit(parseFragment(html));
}

/** The CLI keeps confirmed failures distinct from incomplete verification. */
export function healthExitCode(artifact: PublicVideoHealthArtifact): number {
  return artifact.overallStatus === "failed"
    ? 1
    : artifact.overallStatus === "degraded"
      ? 2
      : 0;
}

export async function monitorPublicVideos(
  inputs: readonly PublicVideoHealthInput[],
  options: HealthMonitorOptions = {},
): Promise<PublicVideoHealthArtifact> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());
  const timeoutMs = options.timeoutMs ?? 8_000;
  const maxBodyBytes = options.maxBodyBytes ?? 65_536;
  const concurrency = Math.max(1, Math.min(8, options.concurrency ?? 4));
  const limited = createLimiter(concurrency);

  const probe = async (
    url: URL,
    json: boolean,
  ): Promise<ProbeResult & { text: string }> => {
    for (let attempts = 1; ; attempts++) {
      const result = await limited(async () => {
        const controller = new AbortController();
        let httpStatus: number | null = null;
        let finalUrl: string | null = null;
        let timer: ReturnType<typeof setTimeout>;
        try {
          // The deadline and concurrency slot cover headers AND body consumption.
          return await Promise.race([
            (async () => {
              const response = await fetchImpl(url, {
                headers: {
                  Accept: json ? "application/json" : "text/html,*/*;q=0.1",
                  "User-Agent": HEALTH_USER_AGENT,
                },
                redirect: "follow",
                signal: controller.signal,
              });
              httpStatus = response.status;
              finalUrl = redactUrl(response.url || url.href);
              let reason = httpReason(response.status);
              if (response.headers.get("cf-mitigated") === "challenge")
                reason = "access-challenge";
              if (reason !== "ok") {
                await response.body?.cancel();
                return { httpStatus, finalUrl, reason, attempts, text: "" };
              }
              const body = await readBounded(response, maxBodyBytes);
              // Inspect only a bounded prefix for explicit challenge/error titles.
              // HTTP availability alone does not verify the article's claims.
              const title = /<title[^>]*>([^<]*)<\/title>/i
                .exec(body.text)?.[1]
                ?.trim();
              if (
                title &&
                /^(?:just a moment(?:\.\.\.)?|access denied|robot challenge|attention required!?\s*\|\s*cloudflare|this website is unavailable in your location\b)/i.test(
                  title,
                )
              )
                reason = "access-challenge";
              else if (json && body.tooLarge) reason = "response-too-large";
              return {
                httpStatus,
                finalUrl,
                reason,
                attempts,
                text: body.text,
              };
            })(),
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => {
                controller.abort();
                reject(new Error("probe-timeout"));
              }, timeoutMs);
            }),
          ]);
        } catch {
          return {
            httpStatus,
            finalUrl,
            reason: controller.signal.aborted
              ? ("timeout" as const)
              : ("network-error" as const),
            attempts,
            text: "",
          };
        } finally {
          clearTimeout(timer!);
        }
      });
      if (
        attempts >= 2 ||
        !["network-error", "timeout", "server-error"].includes(result.reason)
      )
        return result;
      await new Promise((resolve) =>
        setTimeout(resolve, options.retryDelayMs ?? 250),
      );
    }
  };

  const checkSource = async (raw: string): Promise<AvailabilityResult> => {
    const url = publicHttpsUrl(raw);
    if (!url)
      return availability({
        reason: "invalid-url",
        httpStatus: null,
        finalUrl: null,
        attempts: 0,
      });
    const { text: _text, ...result } = await probe(url, false);
    return availability(result);
  };

  const checkMetadata = async (videoUrl: string, videoId: string) => {
    const endpoint = new URL("https://www.youtube.com/oembed");
    endpoint.searchParams.set("url", videoUrl);
    endpoint.searchParams.set("format", "json");
    const { text, ...result } = await probe(endpoint, true);
    let markup: PublicVideoHealthResult["embedMarkup"]["status"] =
      "indeterminate";
    if (result.reason === "ok") {
      try {
        const value = JSON.parse(text);
        if (
          !value ||
          value.type !== "video" ||
          value.provider_name !== "YouTube" ||
          typeof value.title !== "string" ||
          !value.title.trim()
        )
          result.reason = "invalid-response";
        else
          markup = hasYouTubeEmbed(value.html, videoId) ? "present" : "absent";
      } catch {
        result.reason = "invalid-response";
      }
    }
    return {
      youtubeMetadata: availability(result),
      embedMarkup: { status: markup, basis: "youtube-oembed" as const },
    };
  };

  const checkEmbed = async (
    videoId: string,
  ): Promise<EmbedCapabilityResult> => {
    const key = options.youtubeApiKey?.trim() ?? "";
    if (!key)
      return {
        status: "not-checked",
        basis: "youtube-api-key-unavailable",
        httpStatus: null,
        finalUrl: null,
        attempts: 0,
        reason: "youtube-api-key-unavailable",
      };
    const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
    endpoint.searchParams.set("part", "status");
    endpoint.searchParams.set("id", videoId);
    endpoint.searchParams.set("key", key);
    const { text, ...result } = await probe(endpoint, true);
    let embeddable: unknown;
    if (result.reason === "ok") {
      try {
        const value = JSON.parse(text);
        embeddable = value.items?.find(
          (item: { id?: string }) => item.id === videoId,
        )?.status?.embeddable;
      } catch {
        /* Invalid JSON remains indeterminate. */
      }
      if (typeof embeddable !== "boolean") result.reason = "invalid-response";
    }
    return {
      ...result,
      status:
        result.reason !== "ok"
          ? "indeterminate"
          : embeddable
            ? "embeddable"
            : "not-embeddable",
      basis: "youtube-data-api",
    };
  };

  const uniqueSources = [...new Set(inputs.flatMap((item) => item.sourceUrls))];
  const sourceResults = new Map(
    await Promise.all(
      uniqueSources.map(async (url) => [url, await checkSource(url)] as const),
    ),
  );
  const videos = await Promise.all(
    inputs.map(async (item): Promise<PublicVideoHealthResult> => {
      const provider = item.provider ?? "youtube";
      const videoId =
        provider === "youtube"
          ? parseYouTubeVideoId(item.videoUrl)
          : (new URL(item.videoUrl).pathname
              .split("/")
              .filter(Boolean)
              .at(-1) ?? null);
      if (
        !videoId ||
        (provider === "mlb" &&
          (observationEmbedFor("mlb", videoId) === null ||
            observationCanonicalUrlFor("mlb", videoId) !== item.videoUrl))
      )
        throw new Error(`Invalid governed video URL: ${item.slug}`);
      const [metadata, embedCapability] = await Promise.all([
        provider === "youtube"
          ? checkMetadata(item.videoUrl, videoId)
          : Promise.resolve({
              youtubeMetadata: await checkSource(item.videoUrl),
              embedMarkup: {
                status: "not-checked" as const,
                basis: "non-youtube-provider" as const,
              },
            }),
        provider === "youtube"
          ? checkEmbed(videoId)
          : Promise.resolve<EmbedCapabilityResult>({
              status: "not-checked",
              basis: "non-youtube-provider",
              httpStatus: null,
              finalUrl: null,
              attempts: 0,
              reason: "non-youtube-provider",
            }),
      ]);
      return {
        slug: item.slug,
        provider,
        videoId,
        sourceAvailability: item.sourceUrls.map((url) => ({
          url,
          result: sourceResults.get(url)!,
        })),
        ...metadata,
        metadataBasis:
          provider === "youtube" ? "youtube-oembed" : "provider-page",
        embedCapability,
      };
    }),
  );
  const sourceReasons: PublicVideoHealthArtifact["summary"]["sourceReasons"] =
    {};
  for (const result of sourceResults.values())
    sourceReasons[result.reason] = (sourceReasons[result.reason] ?? 0) + 1;
  const summary = {
    videos: videos.length,
    sourceUrls: uniqueSources.length,
    unavailableSources: [...sourceResults.values()].filter(
      (r) => r.status === "unavailable",
    ).length,
    indeterminateSources: [...sourceResults.values()].filter(
      (r) => r.status === "indeterminate",
    ).length,
    sourceReasons,
    unavailableMetadata: videos.filter(
      (v) => v.youtubeMetadata.status === "unavailable",
    ).length,
    indeterminateMetadata: videos.filter(
      (v) => v.youtubeMetadata.status === "indeterminate",
    ).length,
    embedMarkupPresent: videos.filter((v) => v.embedMarkup.status === "present")
      .length,
    notEmbeddable: videos.filter(
      (v) => v.embedCapability.status === "not-embeddable",
    ).length,
    embedChecksCompleted: videos.filter((v) =>
      ["embeddable", "not-embeddable"].includes(v.embedCapability.status),
    ).length,
    embedChecksIndeterminate: videos.filter(
      (v) => v.embedCapability.status === "indeterminate",
    ).length,
    embedChecksSkipped: videos.filter(
      (v) => v.embedCapability.status === "not-checked",
    ).length,
  };
  return {
    schemaVersion: 2,
    scope: "public-video-source-health",
    checkedAt: now().toISOString(),
    requestUserAgent: HEALTH_USER_AGENT,
    playbackVerification: "not-performed",
    overallStatus:
      summary.unavailableSources ||
      summary.unavailableMetadata ||
      summary.notEmbeddable
        ? "failed"
        : summary.indeterminateSources ||
            summary.indeterminateMetadata ||
            summary.embedChecksIndeterminate ||
            summary.embedChecksSkipped ||
            videos.some((v) => v.embedMarkup.status === "absent")
          ? "degraded"
          : "healthy",
    summary,
    videos,
  };
}
