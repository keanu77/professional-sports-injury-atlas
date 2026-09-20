import type { ObservationClip } from "./expansion";

/** Keep card links and detail headings honest about what the footage shows. */
export function observationFootageLabel(clip: {
  footageKind?: ObservationClip["footageKind"];
}): string {
  return clip.footageKind === "news-analysis"
    ? "傷勢新聞與說明"
    : clip.footageKind === "athlete-interview"
      ? "選手訪談與傷勢說明"
      : clip.footageKind === "aftermath"
        ? "受傷後處理與續賽"
        : clip.footageKind === "injury-motion"
          ? "受傷動作觀察"
          : "傷害相關影片（片型待核）";
}

export interface ObservationCardMetadata {
  sport: string;
  bodyPart: string;
  eventYear: string;
}

/** Builds display-only card facts without inferring a diagnosis or event date. */
export function observationCardMetadata(
  clip: Pick<ObservationClip, "sport" | "bodyPart" | "eventDate" | "eventYear">,
): ObservationCardMetadata {
  return {
    sport: clip.sport,
    bodyPart: clip.bodyPart,
    eventYear: clip.eventYear ?? clip.eventDate?.slice(0, 4) ?? "日期未核定",
  };
}
