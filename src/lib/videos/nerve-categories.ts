import type { ObservationClip } from "./expansion";

/** Publicly named anatomy, not diagnoses inferred from footage. */
export const NERVE_CATEGORIES = [
  {
    code: "peripheral-nerve",
    label: "周邊神經損傷",
    description:
      "收錄來源明確具名單一周邊神經的案例；影片本身不能判定神經病變或損傷程度。",
  },
  {
    code: "brachial-plexus",
    label: "神經叢損傷",
    description: "獨立收錄臂神經叢案例，不與單一神經或短暫 stinger 混為一談。",
  },
] as const;

export function videosByNerveCategory(clips: readonly ObservationClip[]) {
  return NERVE_CATEGORIES.map((category) => {
    const selected = clips.filter(
      (clip) => clip.nerveCategory === category.code,
    );
    return { ...category, clips: selected, count: selected.length };
  }).filter((category) => category.count > 0);
}
