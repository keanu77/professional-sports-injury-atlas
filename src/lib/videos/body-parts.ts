import type { InjuryCase } from "../contracts/case";
import type { ObservationClip } from "./expansion";

/** Browsing by anatomical location never assigns a diagnosis to an observation. */
export const BODY_PARTS = [
  { code: "shoulder", label: "肩部" },
  { code: "ankle", label: "腳踝" },
  { code: "calf-achilles", label: "小腿與阿基里斯腱" },
  { code: "knee", label: "膝蓋" },
  { code: "posterior-thigh", label: "大腿後側" },
] as const;
export type BodyPartCode = (typeof BODY_PARTS)[number]["code"];
const injuryParts: Record<string, BodyPartCode> = {
  "ankle-sprain": "ankle",
  "achilles-rupture": "calf-achilles",
  acl: "knee",
};
const observationParts: Record<string, BodyPartCode> = {
  肩部: "shoulder",
  腳踝: "ankle",
  "小腿／阿基里斯腱": "calf-achilles",
  膝部: "knee",
  大腿後側: "posterior-thigh",
};
export function videosByBodyPart(
  records: readonly InjuryCase[],
  clips: readonly ObservationClip[],
) {
  return BODY_PARTS.map((part) => {
    const cases = records.filter(
      (record) => injuryParts[record.injury.code] === part.code,
    );
    const observations = clips.filter(
      (clip) => observationParts[clip.bodyPart] === part.code,
    );
    return {
      ...part,
      cases,
      clips: observations,
      count: cases.length + observations.length,
    };
  }).filter((part) => part.count > 0);
}
