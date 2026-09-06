import type { InjuryCase } from "../contracts/case";
import type { ObservationClip } from "./expansion";

export const SPORTS = [
  { code: "basketball", label: "籃球" },
  { code: "baseball", label: "棒球" },
  { code: "cricket", label: "板球" },
  { code: "football", label: "足球" },
  { code: "tennis", label: "網球" },
  { code: "badminton", label: "羽球" },
  { code: "athletics", label: "田徑" },
  { code: "gymnastics", label: "體操" },
  { code: "figure-skating", label: "花式滑冰" },
  { code: "ice-hockey", label: "冰球" },
  { code: "rugby", label: "橄欖球" },
  { code: "american-football", label: "美式足球" },
  { code: "alpine-skiing", label: "高山滑雪" },
  { code: "cycling", label: "自行車" },
  { code: "crossfit", label: "CrossFit" },
] as const;

export function videosBySport(
  records: readonly InjuryCase[],
  clips: readonly ObservationClip[],
) {
  return SPORTS.map((sport) => {
    const cases = records.filter((record) => record.sport.code === sport.code);
    const observations = clips.filter((clip) => clip.sport === sport.label);
    return {
      ...sport,
      cases,
      clips: observations,
      count: cases.length + observations.length,
    };
  }).filter((sport) => sport.count > 0);
}
