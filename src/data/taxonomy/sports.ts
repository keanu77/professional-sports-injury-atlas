import type { SportDefinition } from "../../lib/contracts/taxonomy";

/** Initial active sport registry. Adding a sport is an explicit registry change. */
export const SPORTS: readonly SportDefinition[] = [
  { code: "basketball", labelZh: "籃球" },
];
