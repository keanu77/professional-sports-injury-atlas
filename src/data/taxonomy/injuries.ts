import type { InjuryDefinition } from "../../lib/contracts/taxonomy";

/** Initial launch injury registry. */
export const INJURIES: readonly InjuryDefinition[] = [
  { code: "acl", labelZh: "前十字韌帶損傷" },
  { code: "ankle-sprain", labelZh: "踝關節扭傷" },
  { code: "achilles-rupture", labelZh: "阿基里斯腱斷裂" },
];
