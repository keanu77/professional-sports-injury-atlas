/**
 * Canonical YouTube URL parsing and the privacy-enhanced embed URL builder.
 * Only the two canonical public forms (`youtube.com/watch?v=` and
 * `youtu.be/{id}`) are accepted; playlists, channels, HTTP, credentials,
 * explicit ports, arbitrary or look-alike hosts, malformed IDs, injected
 * query data, fragments, and pasted iframe HTML are all rejected.
 * `buildPrivacyEnhancedEmbedUrl()` is available only to the registered
 * YouTube provider, never emits autoplay, and always binds the runtime page
 * origin. This module stays free of Node-only imports so the click-to-load
 * client script can bundle it.
 */

import { VIDEO_PROVIDERS } from "../../data/taxonomy/video-providers";

export const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export const YOUTUBE_WATCH_HOSTS = ["youtube.com", "www.youtube.com"] as const;
export const YOUTUBE_SHORT_HOST = "youtu.be";
export const YOUTUBE_NOCOOKIE_EMBED_BASE =
  "https://www.youtube-nocookie.com/embed/";
export const YOUTUBE_IFRAME_API_URL = "https://www.youtube.com/iframe_api";

/**
 * Returns the 11-character video ID for a canonical YouTube URL, or `null`
 * for every other input.
 */
export function parseYouTubeVideoId(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username !== "" || url.password !== "" || url.port !== "") {
    return null;
  }
  if (url.hash !== "") return null;

  if ((YOUTUBE_WATCH_HOSTS as readonly string[]).includes(url.hostname)) {
    if (url.pathname !== "/watch") return null;
    const keys = [...url.searchParams.keys()];
    if (keys.length !== 1 || keys[0] !== "v") return null;
    const ids = url.searchParams.getAll("v");
    if (ids.length !== 1) return null;
    const id = ids[0] ?? "";
    return YOUTUBE_VIDEO_ID_RE.test(id) ? id : null;
  }

  if (url.hostname === YOUTUBE_SHORT_HOST) {
    if (url.search !== "") return null;
    const segments = url.pathname.split("/").filter((part) => part !== "");
    if (segments.length !== 1) return null;
    const id = segments[0] ?? "";
    return YOUTUBE_VIDEO_ID_RE.test(id) ? id : null;
  }

  return null;
}

/**
 * Builds the click-to-load `youtube-nocookie.com` embed URL with
 * `enablejsapi=1` and the encoded runtime page origin, and never an autoplay
 * parameter. Only the registered YouTube provider may call this.
 */
export function buildPrivacyEnhancedEmbedUrl(
  providerCode: string,
  videoId: string,
  pageOrigin: string,
): string {
  const provider = VIDEO_PROVIDERS.find(
    (candidate) => candidate.code === providerCode,
  );
  if (
    provider === undefined ||
    provider.code !== "youtube" ||
    !provider.canEmbed
  ) {
    throw new Error(
      "buildPrivacyEnhancedEmbedUrl is available only to the registered YouTube provider",
    );
  }
  if (!YOUTUBE_VIDEO_ID_RE.test(videoId)) {
    throw new Error(`invalid YouTube video ID ${JSON.stringify(videoId)}`);
  }
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(pageOrigin);
  } catch {
    throw new Error(`invalid page origin ${JSON.stringify(pageOrigin)}`);
  }
  if (
    (parsedOrigin.protocol !== "https:" && parsedOrigin.protocol !== "http:") ||
    parsedOrigin.origin !== pageOrigin
  ) {
    throw new Error(`invalid page origin ${JSON.stringify(pageOrigin)}`);
  }
  return (
    `${YOUTUBE_NOCOOKIE_EMBED_BASE}${videoId}` +
    `?enablejsapi=1&origin=${encodeURIComponent(pageOrigin)}`
  );
}

/**
 * Builds the real source timestamp URL for a canonical YouTube URL. Timeline
 * anchors keep these URLs so they work without JavaScript and whenever the
 * in-site player is absent or failed.
 */
export function buildTimestampUrl(
  canonicalUrl: string,
  startSeconds: number,
): string {
  const videoId = parseYouTubeVideoId(canonicalUrl);
  if (videoId === null) {
    throw new Error(
      `not a canonical YouTube URL: ${JSON.stringify(canonicalUrl)}`,
    );
  }
  if (!Number.isInteger(startSeconds) || startSeconds < 0) {
    throw new Error(`invalid start seconds ${String(startSeconds)}`);
  }
  return `https://www.youtube.com/watch?v=${videoId}&t=${startSeconds}s`;
}
