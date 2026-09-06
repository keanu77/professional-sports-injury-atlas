import type { ObservationClip } from "./expansion";

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
