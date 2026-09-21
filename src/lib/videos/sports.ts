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
  { code: "motorcycle-racing", label: "機車競速" },
  { code: "automobile-racing", label: "賽車" },
  { code: "crossfit", label: "CrossFit" },
  { code: "surfing", label: "衝浪" },
  { code: "swimming", label: "游泳" },
  { code: "snowboarding", label: "單板滑雪" },
  { code: "beach-volleyball", label: "沙灘排球" },
  { code: "indoor-volleyball", label: "室內排球" },
  { code: "mixed-martial-arts", label: "綜合格鬥" },
  { code: "wrestling", label: "角力" },
  { code: "boxing", label: "拳擊" },
  { code: "skateboarding", label: "滑板" },
  { code: "golf", label: "高爾夫" },
  { code: "weightlifting", label: "舉重" },
  { code: "ski-jumping", label: "跳台滑雪" },
  { code: "handball", label: "手球" },
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
