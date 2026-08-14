/** Exhaustive Decision 17 video-source classification for case indexes. */

import type { InjuryCase } from "../contracts/case";
import { findVideoProvider } from "../contracts/taxonomy";
import { isNbaHost } from "../rights/nba-link-policy";

export const VIDEO_SOURCE_TOKENS = [
  "youtube-embed",
  "nba-plain-text-citation",
  "external-link",
] as const;
export type VideoSourceToken = (typeof VIDEO_SOURCE_TOKENS)[number];

export const VIDEO_SOURCE_LABELS: Record<VideoSourceToken, string> = {
  "youtube-embed": "站內 YouTube 嵌入",
  "nba-plain-text-citation": "NBA 官網純文字引註",
  "external-link": "外部連結",
};

type VideoFacts = Pick<
  InjuryCase["video"],
  "provider" | "canonicalUrl" | "embedStatus"
>;

function normalizedHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/u, "");
}

function providerAcceptsHost(
  allowedHosts: readonly string[],
  hostname: string,
): boolean {
  const actual = normalizedHost(hostname);
  return allowedHosts.some((allowed) => actual === normalizedHost(allowed));
}

/**
 * NBA host detection precedes the generic external-link-only branch. Unknown
 * providers, provider/host mismatches, and unclassified states throw instead
 * of silently entering a misleading bucket.
 */
export function deriveVideoSourceToken(video: VideoFacts): VideoSourceToken {
  let url: URL;
  try {
    url = new URL(video.canonicalUrl);
  } catch {
    throw new Error("video source classification requires a canonical URL");
  }
  const provider = findVideoProvider(video.provider);
  if (
    provider === undefined ||
    !providerAcceptsHost(provider.allowedHosts, url.hostname) ||
    !provider.allowedEmbedStatuses.includes(video.embedStatus)
  ) {
    throw new Error(
      `unexpected video provider/host/status: ${video.provider}/${url.hostname}/${video.embedStatus}`,
    );
  }
  if (isNbaHost(url.hostname)) {
    if (provider.code !== "nba") {
      throw new Error("NBA video host requires the governed NBA provider");
    }
    return "nba-plain-text-citation";
  }
  if (provider.code === "youtube" && video.embedStatus === "verified") {
    return "youtube-embed";
  }
  if (video.embedStatus === "external-link-only") return "external-link";
  throw new Error(
    `unclassified video provider/host/status: ${video.provider}/${url.hostname}/${video.embedStatus}`,
  );
}
