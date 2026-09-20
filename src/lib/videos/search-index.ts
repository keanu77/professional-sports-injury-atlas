/** Build-time fields for cards already admitted by the page's public selectors. */
import type { InjuryCase } from "../contracts/case";
import {
  findCompetition,
  findInjury,
  findLeague,
  findSport,
} from "../contracts/taxonomy";
import type { ObservationClip } from "./expansion";
import { eventUpdateFor } from "./event-updates";
import { normalizeVideoSearch } from "./search";
import { SPORTS } from "./sports";

export function caseVideoSearchText(record: InjuryCase): string {
  return normalizeVideoSearch(
    [
      record.athlete.name,
      record.slug,
      record.sport.code,
      findSport(record.sport.code)?.labelZh,
      record.injury.code,
      findInjury(record.injury.code)?.labelZh,
      record.injury.confirmedDiagnosis,
      record.league.code,
      findLeague(record.league.code)?.labelZh,
      record.competition.code,
      findCompetition(record.competition.code)?.labelZh,
      record.season,
      record.eventDate,
      record.teamAtEvent.name,
      record.opponent.name,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function observationVideoSearchText(clip: ObservationClip): string {
  const update = eventUpdateFor(clip.slug, clip.videoUrl, clip.eventDate);
  return normalizeVideoSearch(
    [
      clip.name,
      clip.slug,
      clip.sport,
      SPORTS.find((sport) => sport.label === clip.sport)?.code,
      clip.bodyPart,
      clip.event,
      clip.eventDate,
      clip.eventYear,
      clip.nerveCategory,
      clip.observation,
      update?.injury,
    ]
      .filter(Boolean)
      .join(" "),
  );
}
