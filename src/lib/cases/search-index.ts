/**
 * Client search index. Contains only records permitted by the public
 * selector; mechanism tags are observation taxonomy, never a diagnosis.
 */

import { effectiveVideoRendering, selectPublicCases } from "./selectors";
import { deriveVideoSourceToken, type VideoSourceToken } from "./video-source";
import type { InjuryCase } from "../contracts/case";

export interface ClientCaseIndexEntry {
  id: string;
  slug: string;
  injuryCode: string;
  sportCode: string;
  leagueCode: string;
  competitionCode: string;
  season: string;
  eventDate: string;
  athleteName: string;
  teamName: string;
  opponentName: string;
  isClassic: boolean;
  mechanismTags: string[];
  captionStatus: string;
  videoSource: VideoSourceToken;
  rendering: "embed" | "external-link";
}

export function buildClientSearchIndex(
  records: InjuryCase[],
): ClientCaseIndexEntry[] {
  return selectPublicCases(records).map((record) => ({
    id: record.id,
    slug: record.slug,
    injuryCode: record.injury.code,
    sportCode: record.sport.code,
    leagueCode: record.league.code,
    competitionCode: record.competition.code,
    season: record.season,
    eventDate: record.eventDate,
    athleteName: record.athlete.name,
    teamName: record.teamAtEvent.name,
    opponentName: record.opponent.name,
    isClassic: record.isClassic,
    mechanismTags: [...record.observedMechanismTags],
    captionStatus: record.video.captionStatus,
    videoSource: deriveVideoSourceToken(record.video),
    rendering: effectiveVideoRendering(record),
  }));
}
