/**
 * UI-only video presentation metadata. The frozen case contract deliberately
 * carries source facts rather than layout, so the five governed portrait
 * videos are registered here without changing case JSON or any content
 * digest. Unknown and non-YouTube videos fail safely to landscape.
 */

import { parseYouTubeVideoId } from "./youtube";

export type VideoOrientation = "landscape" | "portrait";

const PORTRAIT_YOUTUBE_VIDEO_IDS = new Set([
  "FQAPZASQyX0", // Kyrie Irving, 2021
  "RDDGpqOvSdg", // LaMelo Ball, 2023
  "xSUKd03LJwE", // Jayson Tatum, 2025
  "zZdndTqOexc", // LaMelo Ball, 2025
  "azQpbyDBktk", // Tyrese Haliburton, 2025
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
