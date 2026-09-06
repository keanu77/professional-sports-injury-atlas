import type { InjuryCase } from "../contracts/case";
import { resolvePlayerPresentation } from "../video/player-state";
import { videoRegionRestrictionFor } from "../video/availability";

/** Uses public playback policy even in preview: no misleading play badges. */
export function hasPublicEmbed(record: InjuryCase): boolean {
  return (
    videoRegionRestrictionFor(
      record.video.provider,
      record.video.canonicalUrl,
    ) === null &&
    resolvePlayerPresentation({
      providerCode: record.video.provider,
      canonicalUrl: record.video.canonicalUrl,
      embedStatus: record.video.embedStatus,
      captionStatus: record.video.captionStatus,
      displayMode: "public",
    }) === "click-to-load"
  );
}
export function videoFirstCases(records: readonly InjuryCase[]): InjuryCase[] {
  return [...records].sort(
    (a, b) =>
      Number(hasPublicEmbed(b)) - Number(hasPublicEmbed(a)) ||
      b.eventDate.localeCompare(a.eventDate) ||
      a.slug.localeCompare(b.slug),
  );
}
