import type { CompetitionDefinition } from "../../lib/contracts/taxonomy";

/** Initial active competition registry, all scoped to the NBA league. */
export const COMPETITIONS: readonly CompetitionDefinition[] = [
  { code: "nba-preseason", leagueCode: "nba", labelZh: "NBA 熱身賽" },
  { code: "nba-regular-season", leagueCode: "nba", labelZh: "NBA 例行賽" },
  { code: "nba-play-in", leagueCode: "nba", labelZh: "NBA 附加賽" },
  { code: "nba-playoffs", leagueCode: "nba", labelZh: "NBA 季後賽" },
  { code: "nba-all-star", leagueCode: "nba", labelZh: "NBA 明星賽" },
];
