import type { ObservationClip } from "./expansion";

/** Keep card links and detail headings honest about what the footage shows. */
export function observationFootageLabel(
  clip: Pick<ObservationClip, "footageKind">,
): string {
  return clip.footageKind === "news-analysis"
    ? "傷勢新聞與說明"
    : clip.footageKind === "aftermath"
      ? "受傷後處理與續賽"
      : "受傷動作觀察";
}

export interface ObservationCardMetadata {
  sport: string;
  bodyPart: string;
  eventYear: string;
}

/** Builds display-only card facts without inferring a diagnosis or event date. */
export function observationCardMetadata(
  clip: Pick<ObservationClip, "sport" | "bodyPart" | "eventDate">,
): ObservationCardMetadata {
  return {
    sport: clip.sport,
    bodyPart: clip.bodyPart,
    eventYear: clip.eventDate?.slice(0, 4) ?? "日期未核定",
  };
}
