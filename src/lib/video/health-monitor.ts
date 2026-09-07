import { parseYouTubeVideoId } from "./youtube";

export type HealthReason =
  | "ok"
  | "http-error"
  | "network-error"
  | "invalid-response"
  | "response-too-large"
  | "youtube-api-key-unavailable";

export interface AvailabilityResult {
  status: "available" | "unavailable" | "indeterminate";
  httpStatus: number | null;
  reason: HealthReason;
}

export interface EmbedCapabilityResult {
  status: "embeddable" | "not-embeddable" | "not-checked" | "indeterminate";
  basis: "youtube-data-api" | "youtube-api-key-unavailable";
  httpStatus: number | null;
  reason: HealthReason;
}

export interface PublicVideoHealthInput {
  slug: string;
  videoUrl: string;
  sourceUrls: readonly string[];
}

export interface PublicVideoHealthResult {
  slug: string;
  videoId: string;
  sourceAvailability: Array<{ url: string; result: AvailabilityResult }>;
  youtubeMetadata: AvailabilityResult;
  embedCapability: EmbedCapabilityResult;
}

export interface PublicVideoHealthArtifact {
  schemaVersion: 1;
  scope: "public-video-source-health";
  checkedAt: string;
  summary: {
    videos: number;
    sourceUrls: number;
    unavailableSources: number;
    unavailableMetadata: number;
    notEmbeddable: number;
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
}

const unavailable = (
  reason: Exclude<HealthReason, "ok" | "youtube-api-key-unavailable">,
  httpStatus: number | null,
): AvailabilityResult => ({ status: "unavailable", httpStatus, reason });

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
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      return { text: "", tooLarge: true };
    }
    text += decoder.decode(value, { stream: true });
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

  const request = async (url: URL): Promise<Response> =>
    limited(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetchImpl(url, {
          headers: { Accept: "application/json,text/html;q=0.8,*/*;q=0.1" },
          redirect: "follow",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    });

  const checkSource = async (raw: string): Promise<AvailabilityResult> => {
    const url = publicHttpsUrl(raw);
    if (!url) return unavailable("invalid-response", null);
    try {
      const response = await request(url);
      await response.body?.cancel();
      return response.ok
        ? { status: "available", httpStatus: response.status, reason: "ok" }
        : unavailable("http-error", response.status);
    } catch {
      return {
        status: "indeterminate",
        httpStatus: null,
        reason: "network-error",
      };
    }
  };

  const checkMetadata = async (
    videoUrl: string,
  ): Promise<AvailabilityResult> => {
    const endpoint = new URL("https://www.youtube.com/oembed");
    endpoint.searchParams.set("url", videoUrl);
    endpoint.searchParams.set("format", "json");
    try {
      const response = await request(endpoint);
      if (!response.ok) return unavailable("http-error", response.status);
      const body = await readBounded(response, maxBodyBytes);
      if (body.tooLarge)
        return unavailable("response-too-large", response.status);
      try {
        const value = JSON.parse(body.text) as unknown;
        if (!value || typeof value !== "object" || Array.isArray(value))
          return unavailable("invalid-response", response.status);
      } catch {
        return unavailable("invalid-response", response.status);
      }
      return { status: "available", httpStatus: response.status, reason: "ok" };
    } catch {
      return {
        status: "indeterminate",
        httpStatus: null,
        reason: "network-error",
      };
    }
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
        reason: "youtube-api-key-unavailable",
      };
    const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
    endpoint.searchParams.set("part", "status");
    endpoint.searchParams.set("id", videoId);
    endpoint.searchParams.set("key", key);
    try {
      const response = await request(endpoint);
      if (!response.ok)
        return {
          status: "indeterminate",
          basis: "youtube-data-api",
          httpStatus: response.status,
          reason: "http-error",
        };
      const body = await readBounded(response, maxBodyBytes);
      if (body.tooLarge)
        return {
          status: "indeterminate",
          basis: "youtube-data-api",
          httpStatus: response.status,
          reason: "response-too-large",
        };
      let embeddable: unknown;
      try {
        const value = JSON.parse(body.text) as {
          items?: Array<{ status?: { embeddable?: unknown } }>;
        };
        embeddable = value.items?.[0]?.status?.embeddable;
      } catch {
        embeddable = undefined;
      }
      if (typeof embeddable !== "boolean")
        return {
          status: "indeterminate",
          basis: "youtube-data-api",
          httpStatus: response.status,
          reason: "invalid-response",
        };
      return {
        status: embeddable ? "embeddable" : "not-embeddable",
        basis: "youtube-data-api",
        httpStatus: response.status,
        reason: "ok",
      };
    } catch {
      return {
        status: "indeterminate",
        basis: "youtube-data-api",
        httpStatus: null,
        reason: "network-error",
      };
    }
  };

  const uniqueSources = [...new Set(inputs.flatMap((item) => item.sourceUrls))];
  const sourceResults = new Map(
    await Promise.all(
      uniqueSources.map(async (url) => [url, await checkSource(url)] as const),
    ),
  );
  const videos = await Promise.all(
    inputs.map(async (item) => {
      const videoId = parseYouTubeVideoId(item.videoUrl);
      if (!videoId) throw new Error(`Invalid governed video URL: ${item.slug}`);
      const [youtubeMetadata, embedCapability] = await Promise.all([
        checkMetadata(item.videoUrl),
        checkEmbed(videoId),
      ]);
      return {
        slug: item.slug,
        videoId,
        sourceAvailability: item.sourceUrls.map((url) => ({
          url,
          result: sourceResults.get(url)!,
        })),
        youtubeMetadata,
        embedCapability,
      };
    }),
  );
  return {
    schemaVersion: 1,
    scope: "public-video-source-health",
    checkedAt: now().toISOString(),
    summary: {
      videos: videos.length,
      sourceUrls: uniqueSources.length,
      unavailableSources: [...sourceResults.values()].filter(
        (result) => result.status !== "available",
      ).length,
      unavailableMetadata: videos.filter(
        (item) => item.youtubeMetadata.status !== "available",
      ).length,
      notEmbeddable: videos.filter(
        (item) => item.embedCapability.status === "not-embeddable",
      ).length,
      embedChecksSkipped: videos.filter(
        (item) => item.embedCapability.status === "not-checked",
      ).length,
    },
    videos,
  };
}
