/**
 * UI-only video presentation metadata. The frozen case contract deliberately
 * carries source facts rather than layout, so the two governed vertical
 * Shorts are registered here without changing case JSON or any content
 * digest. Unknown and non-YouTube videos fail safely to landscape.
 */

import { parseYouTubeVideoId } from "./youtube";

export type VideoOrientation = "landscape" | "portrait";

const PORTRAIT_YOUTUBE_VIDEO_IDS = new Set([
  "FQAPZASQyX0", // Kyrie Irving, 2021
  "RDDGpqOvSdg", // LaMelo Ball, 2023
]);

export function resolveVideoOrientation(
  providerCode: string,
  canonicalUrl: string,
): VideoOrientation {
  if (providerCode !== "youtube") return "landscape";
  const videoId = parseYouTubeVideoId(canonicalUrl);
  return videoId !== null && PORTRAIT_YOUTUBE_VIDEO_IDS.has(videoId)
    ? "portrait"
    : "landscape";
}
