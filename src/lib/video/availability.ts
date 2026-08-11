/**
 * Current audience-region playback overrides established by the Decision 11
 * rights review. These are presentation-only safety facts: they never rewrite
 * immutable source manifests or the physician-reviewed clinical projection.
 * A listed video always fails closed to its original-platform link in both
 * review and public builds.
 */

import { parseYouTubeVideoId } from "./youtube";

export const SITE_AUDIENCE_COUNTRY_CODE = "TW" as const;

export interface VideoRegionRestriction {
  availableCountryCount: number;
  audienceCountryCode: typeof SITE_AUDIENCE_COUNTRY_CODE;
  checkedAt: string;
  evidencePath: string;
  fallbackPresentation: "external-link-only";
  playabilityStatus: "UNPLAYABLE";
  playableInEmbed: null;
  providerCode: "youtube";
  videoId: string;
}

const VIDEO_REGION_RESTRICTIONS: readonly VideoRegionRestriction[] = [
  {
    availableCountryCount: 60,
    audienceCountryCode: SITE_AUDIENCE_COUNTRY_CODE,
    checkedAt: "2026-08-11T17:29:36Z",
    evidencePath: "docs/reviews/2026-08-12-g6-rights-p0-evidence.md",
    fallbackPresentation: "external-link-only",
    playabilityStatus: "UNPLAYABLE",
    playableInEmbed: null,
    providerCode: "youtube",
    videoId: "V9mtX4mE8wQ",
  },
];

export function videoRegionRestrictionFor(
  providerCode: string,
  canonicalUrl: string,
): VideoRegionRestriction | null {
  if (providerCode !== "youtube") return null;
  const videoId = parseYouTubeVideoId(canonicalUrl);
  if (videoId === null) return null;
  return (
    VIDEO_REGION_RESTRICTIONS.find((entry) => entry.videoId === videoId) ?? null
  );
}

export function governedVideoRegionRestrictions(): readonly VideoRegionRestriction[] {
  return VIDEO_REGION_RESTRICTIONS.map((entry) => ({ ...entry }));
}
