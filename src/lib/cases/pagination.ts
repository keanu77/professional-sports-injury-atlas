/**
 * Build-time listing pagination and deferred case-index shard building.
 * Listing pages hold exactly 12 cards; `/injuries/{x}/` and `/leagues/{x}/`
 * are the canonical page 1 and additional pages live under `/page/{n}/`.
 * Index shards hold at most 100 selector-permitted minimal entries; review
 * shards carry diagnosis confirmation and private workflow status as two
 * separate controlled fields, and public shards never expose workflow status.
 */

import {
  groupCasesByInjury,
  labelCaseWorkflowState,
  selectPublicCases,
  selectReviewCases,
} from "./selectors";
import type { InjuryCase } from "../contracts/case";
import type { BuildMode } from "../governance/build-mode";

export const LISTING_PAGE_SIZE = 12;
export const INDEX_SHARD_SIZE = 100;
export const RELATED_CASES_LIMIT = 3;

/**
 * Minimal selector-permitted index entry: card facts only, no medical prose
 * beyond the card summary fields and no arbitrary HTML. `eventYear` is
 * derived from `eventDate`; `season` keeps its canonical registry form.
 * `workflowStatus` exists only in review-build entries.
 */
export interface CaseIndexEntry {
  id: string;
  slug: string;
  injuryCode: string;
  sportCode: string;
  leagueCode: string;
  competitionCode: string;
  season: string;
  eventYear: number;
  eventDate: string;
  athleteName: string;
  teamName: string;
  opponentName: string;
  isClassic: boolean;
  classicReason: string | null;
  mechanismTags: string[];
  confirmationStatus: string;
  workflowStatus?: string;
}

export interface CaseIndexManifest {
  schemaVersion: 1;
  mode: BuildMode;
  shardSize: number;
  totalEntries: number;
  injuries: Array<{
    injuryCode: string;
    entryCount: number;
    shardCount: number;
  }>;
}

/** Derives the numeric event year from a canonical `YYYY-MM-DD` event date. */
export function deriveEventYear(eventDate: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    throw new Error(`invalid event date ${JSON.stringify(eventDate)}`);
  }
  return Number.parseInt(eventDate.slice(0, 4), 10);
}

/** The one permitted selector per build mode; no route duplicates this rule. */
export function permittedCasesForMode(
  mode: BuildMode,
  records: InjuryCase[],
): InjuryCase[] {
  return mode === "review"
    ? selectReviewCases(records)
    : selectPublicCases(records);
}

/**
 * Builds one minimal index entry. Review mode adds the private workflow
 * status as a separate field; public mode never includes it, and public
 * callers must pass records already selected by `selectPublicCases()`.
 */
export function buildCaseIndexEntry(
  record: InjuryCase,
  mode: BuildMode,
): CaseIndexEntry {
  const entry: CaseIndexEntry = {
    id: record.id,
    slug: record.slug,
    injuryCode: record.injury.code,
    sportCode: record.sport.code,
    leagueCode: record.league.code,
    competitionCode: record.competition.code,
    season: record.season,
    eventYear: deriveEventYear(record.eventDate),
    eventDate: record.eventDate,
    athleteName: record.athlete.name,
    teamName: record.teamAtEvent.name,
    opponentName: record.opponent.name,
    isClassic: record.isClassic,
    classicReason: record.classicReason,
    mechanismTags: [...record.observedMechanismTags],
    confirmationStatus: record.injury.confirmationStatus,
  };
  if (mode === "review") {
    entry.workflowStatus = record.status;
  }
  return entry;
}

/** Review-only visible label for a workflow status token. */
export function workflowStatusLabel(record: InjuryCase): string {
  return labelCaseWorkflowState(record);
}

/** Splits items into fixed-size chunks, preserving order. */
export function paginateItems<T>(items: readonly T[], pageSize: number): T[][] {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error(`invalid page size ${String(pageSize)}`);
  }
  const pages: T[][] = [];
  for (let start = 0; start < items.length; start += pageSize) {
    pages.push(items.slice(start, start + pageSize));
  }
  return pages;
}

export interface ListingPagePath {
  pageNumber: number;
  /** Page 1 renders at the canonical base path, not under /page/1/. */
  isCanonical: boolean;
  path: string;
  previousPath: string | null;
  nextPath: string | null;
}

/**
 * Canonical listing paths for one base path: page 1 at `${basePath}` and
 * pages 2+ at `${basePath}page/{n}/`, each with semantic previous/next hrefs.
 */
export function buildListingPagePaths(
  basePath: string,
  totalItems: number,
  pageSize: number = LISTING_PAGE_SIZE,
): ListingPagePath[] {
  if (!basePath.startsWith("/") || !basePath.endsWith("/")) {
    throw new Error(`base path must start and end with "/": ${basePath}`);
  }
  if (!Number.isInteger(totalItems) || totalItems < 0) {
    throw new Error(`invalid total items ${String(totalItems)}`);
  }
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const pathFor = (pageNumber: number): string =>
    pageNumber === 1 ? basePath : `${basePath}page/${pageNumber}/`;
  const paths: ListingPagePath[] = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    paths.push({
      pageNumber,
      isCanonical: pageNumber === 1,
      path: pathFor(pageNumber),
      previousPath: pageNumber === 1 ? null : pathFor(pageNumber - 1),
      nextPath: pageNumber === pageCount ? null : pathFor(pageNumber + 1),
    });
  }
  return paths;
}

/**
 * Deferred index shards for one build mode, grouped by injury code, each
 * shard holding at most 100 entries with every permitted case exactly once.
 */
export function buildCaseIndexShards(
  mode: BuildMode,
  records: InjuryCase[],
): Map<string, CaseIndexEntry[][]> {
  const shards = new Map<string, CaseIndexEntry[][]>();
  const grouped = groupCasesByInjury(permittedCasesForMode(mode, records));
  for (const [injuryCode, group] of grouped) {
    shards.set(
      injuryCode,
      paginateItems(
        group.map((record) => buildCaseIndexEntry(record, mode)),
        INDEX_SHARD_SIZE,
      ),
    );
  }
  return shards;
}

/** Minimal manifest the client loads once, before any shard request. */
export function buildCaseIndexManifest(
  mode: BuildMode,
  records: InjuryCase[],
  injuryCodes: readonly string[],
): CaseIndexManifest {
  const shards = buildCaseIndexShards(mode, records);
  const injuries = injuryCodes.map((injuryCode) => {
    const injuryShards = shards.get(injuryCode) ?? [];
    const entryCount = injuryShards.reduce(
      (total, shard) => total + shard.length,
      0,
    );
    return { injuryCode, entryCount, shardCount: injuryShards.length };
  });
  return {
    schemaVersion: 1,
    mode,
    shardSize: INDEX_SHARD_SIZE,
    totalEntries: injuries.reduce(
      (total, entry) => total + entry.entryCount,
      0,
    ),
    injuries,
  };
}

/**
 * Related cases for a case detail page: other permitted cases with the same
 * injury code, in selector order, capped at 3.
 */
export function relatedCases(
  record: InjuryCase,
  permittedRecords: InjuryCase[],
  limit: number = RELATED_CASES_LIMIT,
): InjuryCase[] {
  if (!Number.isInteger(limit) || limit < 0) {
    throw new Error(`invalid related-case limit ${String(limit)}`);
  }
  return permittedRecords
    .filter(
      (candidate) =>
        candidate.id !== record.id &&
        candidate.injury.code === record.injury.code,
    )
    .slice(0, limit);
}
