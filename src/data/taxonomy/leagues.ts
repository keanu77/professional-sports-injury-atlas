import type { LeagueDefinition } from "../../lib/contracts/taxonomy";

/**
 * Initial active league registry. The NBA requires the two-year `YYYY-YY`
 * season form; a later MLB entry may declare `single-year` without changing
 * display components.
 */
export const LEAGUES: readonly LeagueDefinition[] = [
  {
    code: "nba",
    sportCode: "basketball",
    labelZh: "NBA",
    seasonForm: "two-year",
  },
];
