/**
 * Pure static-route builders for the injury atlas. The three injury routes
 * always exist (registry-driven); case, league, and update routes derive only
 * from actual selector-permitted entries, so an empty collection produces no
 * fabricated route and no empty league route. Review-only fixture routes
 * exist solely in review builds and always disappear in public mode.
 */

import {
  buildListingPagePaths,
  LISTING_PAGE_SIZE,
  permittedCasesForMode,
  type ListingPagePath,
} from "../cases/pagination";
import { computeCaseContentDigest } from "../cases/digest";
import { canonicalJson, sha256Hex } from "../cases/canonical-json";
import { groupCasesByInjury } from "../cases/selectors";
import { INJURIES } from "../../data/taxonomy/injuries";
import type { ConfirmationStatus, InjuryCase } from "../contracts/case";
import type { QuarterlyUpdate } from "../contracts/update";
import type { BuildMode } from "../governance/build-mode";
import { evaluatePublicCourseLink } from "../rtp/course-links";
import type { PublicCourseLinkInput } from "../rtp/course-links";

/** Exact pending label; a pending course card never guesses a URL. */
export const COURSE_LINK_PENDING_LABEL = "課程連結待核准";

/** Exact classic label rendered on classic case cards and details. */
export const CLASSIC_CASE_LABEL = "經典案例";

const CONFIRMATION_STATUS_LABELS: Record<ConfirmationStatus, string> = {
  unconfirmed: "尚未確認",
  confirmed: "已確認",
  conflicted: "來源相互矛盾",
};

/** External diagnosis-confirmation label; never a workflow state. */
export function confirmationStatusLabel(status: ConfirmationStatus): string {
  return CONFIRMATION_STATUS_LABELS[status];
}

/** The three registry injury routes always exist, even with zero cases. */
export function injuryRouteParams(): Array<{ injury: string }> {
  return INJURIES.map((injury) => ({ injury: injury.code }));
}

/** Listing pagination for one injury; page 1 is the canonical injury route. */
export function injuryListingPages(
  mode: BuildMode,
  records: InjuryCase[],
  injuryCode: string,
): ListingPagePath[] {
  const grouped = groupCasesByInjury(permittedCasesForMode(mode, records));
  const total = grouped.get(injuryCode)?.length ?? 0;
  return buildListingPagePaths(`/injuries/${injuryCode}/`, total);
}

/** Extra static pages (2+) for every injury listing. */
export function injuryPageParams(
  mode: BuildMode,
  records: InjuryCase[],
): Array<{ injury: string; page: string }> {
  const params: Array<{ injury: string; page: string }> = [];
  for (const { injury } of injuryRouteParams()) {
    for (const page of injuryListingPages(mode, records, injury)) {
      if (!page.isCanonical) {
        params.push({ injury, page: String(page.pageNumber) });
      }
    }
  }
  return params;
}

/** One case route per permitted case, exactly once. */
export function caseRouteParams(
  mode: BuildMode,
  records: InjuryCase[],
): Array<{ slug: string }> {
  return permittedCasesForMode(mode, records).map((record) => ({
    slug: record.slug,
  }));
}

/** League routes derive only from actual entries: no empty league route. */
export function leagueRouteParams(
  mode: BuildMode,
  records: InjuryCase[],
): Array<{ league: string }> {
  const leagues = new Set<string>();
  for (const record of permittedCasesForMode(mode, records)) {
    leagues.add(record.league.code);
  }
  return [...leagues].sort().map((league) => ({ league }));
}

/** Listing pagination for one league; page 1 is the canonical league route. */
export function leagueListingPages(
  mode: BuildMode,
  records: InjuryCase[],
  leagueCode: string,
): ListingPagePath[] {
  const total = permittedCasesForMode(mode, records).filter(
    (record) => record.league.code === leagueCode,
  ).length;
  return buildListingPagePaths(`/leagues/${leagueCode}/`, total);
}

/** Extra static pages (2+) for every generated league listing. */
export function leaguePageParams(
  mode: BuildMode,
  records: InjuryCase[],
): Array<{ league: string; page: string }> {
  const params: Array<{ league: string; page: string }> = [];
  for (const { league } of leagueRouteParams(mode, records)) {
    for (const page of leagueListingPages(mode, records, league)) {
      if (!page.isCanonical) {
        params.push({ league, page: String(page.pageNumber) });
      }
    }
  }
  return params;
}

/**
 * Update routes derive only from actual update entries. Review mode renders
 * every authored update; public mode renders only approved updates that
 * carry an exact publishedAt.
 */
export function updateRouteParams(
  mode: BuildMode,
  updates: QuarterlyUpdate[],
): Array<{ quarter: string }> {
  const visible =
    mode === "review"
      ? updates
      : updates.filter(
          (update) =>
            update.status === "approved" && update.publishedAt !== null,
        );
  return [...visible]
    .sort((a, b) => (a.id < b.id ? 1 : -1))
    .map((update) => ({ quarter: update.id }));
}

/**
 * The single latest-update pointer used by the home page. An explicit
 * governance `currentUpdateId` wins; review mode may otherwise fall back to
 * the newest visible update, and public mode never guesses.
 */
export function latestUpdateRef(
  mode: BuildMode,
  updates: QuarterlyUpdate[],
  currentUpdateId: string | null,
): { id: string; path: string } | null {
  const visibleIds = updateRouteParams(mode, updates).map(
    (entry) => entry.quarter,
  );
  if (currentUpdateId !== null && visibleIds.includes(currentUpdateId)) {
    return { id: currentUpdateId, path: `/updates/${currentUpdateId}/` };
  }
  if (mode === "review" && visibleIds.length > 0) {
    const newest = visibleIds[0] as string;
    return { id: newest, path: `/updates/${newest}/` };
  }
  return null;
}

/** The review-only fixture routes, rendered with production view components. */
export const REVIEW_FIXTURE_NAMES = [
  "case-detail",
  "injury-overview",
  "league-listing",
  "latest-update",
] as const;
export type ReviewFixtureName = (typeof REVIEW_FIXTURE_NAMES)[number];

/** Review mode exposes the four fixture routes; public mode exposes zero. */
export function reviewFixtureParams(
  mode: BuildMode,
): Array<{ fixture: ReviewFixtureName }> {
  if (mode !== "review") return [];
  return REVIEW_FIXTURE_NAMES.map((fixture) => ({ fixture }));
}

export interface CourseLinkPresentation {
  state: "approved" | "pending";
  /** Non-null only for a fully evaluated approved link. */
  url: string | null;
  pendingLabel: string;
}

/**
 * Fail-closed course-link presentation: a URL renders only when the durable
 * decision evaluation passes completely; every other state shows the exact
 * pending label and never guesses a URL.
 */
export function courseLinkPresentation(
  input: PublicCourseLinkInput,
): CourseLinkPresentation {
  const issues = evaluatePublicCourseLink(input);
  if (issues.length === 0 && input.link.linkApproval.status === "approved") {
    return {
      state: "approved",
      url: input.link.linkApproval.approvedPublicUrl,
      pendingLabel: COURSE_LINK_PENDING_LABEL,
    };
  }
  return {
    state: "pending",
    url: null,
    pendingLabel: COURSE_LINK_PENDING_LABEL,
  };
}

/**
 * Deterministic digest over the rendered review set: sorted case ID and
 * per-case clinical digest tuples. Review pages display it next to each
 * record's own content digest.
 */
export function computeRenderedSetDigest(records: InjuryCase[]): string {
  const tuples = records
    .map((record) => ({
      caseId: record.id,
      clinicalDigest: computeCaseContentDigest(record),
    }))
    .sort((a, b) => (a.caseId < b.caseId ? -1 : 1));
  return sha256Hex(canonicalJson({ schemaVersion: 1, cases: tuples }));
}

/** Listing page size re-exported for route templates. */
export { LISTING_PAGE_SIZE };
