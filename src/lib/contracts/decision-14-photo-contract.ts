/**
 * Decision 14's pre-research, name-independent photo contract.
 *
 * Phase 0 deliberately defines the closed-world roster, numeric floors,
 * evidence shape, and pure eligibility decision before any photographer is
 * reviewed. The eventual nba-v7 policy binds the separately frozen Phase 1
 * evidence; this module is not that policy and contains no allowlist name.
 */

import {
  compareCodePoints,
  sha256Hex,
  type ValidationIssue,
} from "./canonical";

export const DECISION_14_SCOPE_ID =
  "decision-14-lowrisk-photographer-covers-only" as const;
export const DECISION_14_REVIEW_DATE = "2026-08-13" as const;

export const DECISION_14_TARGET_ATHLETES = [
  "Anfernee Simons",
  "Anthony Edwards",
  "Brandon Clarke",
  "Damian Lillard",
  "Danny Green",
  "Dejounte Murray",
  "Ja Morant",
  "Jayson Tatum",
  "Joe Ingles",
  "LaMelo Ball",
  "Markelle Fultz",
  "Moritz Wagner",
  "Ricky Rubio",
  "Thomas Bryant",
  "Trae Young",
  "Tyrese Haliburton",
] as const;

export const DECISION_14_PROTECTED_ATHLETES = [
  "CJ McCollum",
  "Dwight Powell",
  "Kevin Durant",
  "Kyrie Irving",
  "LeBron James",
] as const;

export const DECISION_14_CONDITIONAL_EVENT_OCCASIONS = [
  "all-star-game-action",
  "international-competition-action",
  "live-preseason-competition",
  "postseason-action",
  "regular-season-action",
  "regular-season-pregame-or-warm-up",
] as const;

export const DECISION_14_ALWAYS_INELIGIBLE_OCCASIONS = [
  "ambiguous-credentialed-court-context",
  "closed-practice",
  "other",
  "unknown",
  "unresolved",
] as const;

export const DECISION_14_RESIDUAL_RISK_TOKEN =
  "credentialed-access-residual-risk" as const;
export const DECISION_14_OWNER_RECORD_PATH =
  "../.claude/g2-owner-decisions.md" as const;
export const DECISION_14_OWNER_RECORD_HEADING =
  "Decision 14 — 放寬為具名低風險攝影者的賽場封面照" as const;
export const DECISION_14_EVENT_GENERIC_CAPTION =
  "賽事場合資料照片；非本案例受傷當下影像" as const;
export const DECISION_14_NON_CLEARANCE_STATEMENT =
  "Decision 14 accepts a bounded credentialed-access residual risk; no copyright, personality-rights, or public-release approval is created." as const;

export const DECISION_14_ALLOWLIST_FLOORS = Object.freeze({
  minimumHistoryYears: 3,
  minimumReuseMonths: 24,
  minimumSampleSize: 30,
  minimumSelfPublishedSportsWorks: 50,
  requiredLicenseMatchRate: 1,
  toleratedUnexplainedDeviations: 0,
});

export const DECISION_14_WASHING_SIGNAL_IDS = [
  "account-compilation-or-repost-behavior",
  "capture-time-and-location-plausibility",
  "exif-series-consistency",
  "native-resolution-patterns",
  "neighboring-event-sequence-continuity",
] as const;

export const DECISION_14_PROTECTED_COVER_BINDINGS = [
  {
    athleteName: "CJ McCollum",
    localAssetSha256:
      "5688298371c4ec218dae6f5131685f4ab511fab6d0797685146953235c8c7e45",
    selectionSha256:
      "d373185dcef5842cd687236173805e21b32de1c65fc502aa00d44c4642ccdeec",
  },
  {
    athleteName: "Dwight Powell",
    localAssetSha256:
      "d1cab51c99f25b380d05d14bd5fe4f826b51042d4c007a7d105a7240265cd211",
    selectionSha256:
      "5c824ed878a6bd974c5f40f4870b5b52c9856f5aefa26e12aa76edd5a59b3732",
  },
  {
    athleteName: "Kevin Durant",
    localAssetSha256:
      "6f18766d49193c6858d607ae26551ba6c4422eebefb535ca2805ccd8b54e956d",
    selectionSha256:
      "5b2090e72be38fe535dd2547f424d6b3195883f44b8fa3a520d48fea8450583d",
  },
  {
    athleteName: "Kyrie Irving",
    localAssetSha256:
      "4f631559835221f8276ef7b1ee09b4435a5003ad9a50614bb0c72673dec745b6",
    selectionSha256:
      "6855ed64229a83f84ee124d3fbddb471da8077dab860a1fe40f0f2c0ed5e4475",
  },
  {
    athleteName: "LeBron James",
    localAssetSha256:
      "8f5550b3acc78302a465a84b9e78f62d466e484fbfec1e3c1054e9123457680c",
    selectionSha256:
      "81303b22c82f6f7705098f4e7c0805967e194e03003c01761d98ded71382b880",
  },
] as const;

export type Decision14TargetAthlete =
  (typeof DECISION_14_TARGET_ATHLETES)[number];
export type Decision14ConditionalEventOccasion =
  (typeof DECISION_14_CONDITIONAL_EVENT_OCCASIONS)[number];
export type Decision14WashingSignalId =
  (typeof DECISION_14_WASHING_SIGNAL_IDS)[number];

export interface Decision14AccountIdentity {
  accountId: string;
  accountUrl: string;
  canonicalOriginalUrlPrefixes: string[];
  controlledByCanonicalPublicName: true;
  platform: "commons" | "flickr";
}

export interface Decision14EvidencePoint {
  basis: string;
  checkedAt: typeof DECISION_14_REVIEW_DATE;
  checkedBy: string;
  originalWorkIdsOrUrls: string[];
  sampleRule: string;
  status: "fail" | "pass" | "unresolved";
}

export interface Decision14AllowlistRecord {
  accountControlType:
    "verified-individual-owned-commons" | "verified-individual-owned-flickr";
  canonicalPublicName: string;
  checkedAt: typeof DECISION_14_REVIEW_DATE;
  checkedBy: string;
  creditedMakerIdentity: {
    canonicalName: string;
    evidenceUrls: string[];
    relationship: "same-individual-verified";
  };
  disputeSearch: {
    checkedAt: typeof DECISION_14_REVIEW_DATE;
    checkedBy: string;
    findings: "none-located";
    limitation: string;
    method: string;
    queries: string[];
    searchedUrls: string[];
  };
  evidenceParagraph: string;
  evidencePath: string;
  evidenceSha256: string;
  expectedLicenseToken: string;
  firstDatedSportsWork: { date: string; id: string; url: string };
  latestDatedSportsWork: { date: string; id: string; url: string };
  licenseHistory: {
    dateStratified: true;
    deterministicCollectionMethod: string;
    deviationReasons: string[];
    enumeratedWorkIdsOrUrls: string[];
    licenseIndependentSampling: true;
    matchingWorkCount: number;
    observedWorkCount: number;
    sampledWorks: Array<{
      exactLicenseToken: string;
      licenseEvidenceUrl: string;
      publishedAt: string;
      workIdOrUrl: string;
    }>;
    unexplainedDeviationCount: number;
  };
  photographerId: string;
  reuseChain: {
    commonsOrWikipediaPageCount: number;
    commonsOrWikipediaPageUrls: string[];
    earliestRevisionAt: string;
    fixedRevisions: Array<{ permalink: string; timestamp: string }>;
    latestRevisionAt: string;
    revisionCount: number;
    spanMonths: number;
  };
  selfPublicationProof: {
    evidenceUrls: string[];
    status: "verified";
  };
  verifiedAccounts: Decision14AccountIdentity[];
  washingChecks: Record<Decision14WashingSignalId, Decision14EvidencePoint>;
}

export interface Decision14EventPhotoRecord {
  allowlistEvidencePath: string;
  allowlistEvidenceSha256: string;
  allowlistPhotographerId: string;
  athleteName: string;
  candidateLicenseMatchesExpected: boolean;
  candidateLicenseToken: string;
  creditedMakerCanonicalName: string;
  eventCompetitionEvidence: string;
  eventDateEvidence: string;
  eventOccasion: string;
  eventOpponentEvidence: string;
  expectedLicenseToken: string;
  injuryEventRelationship:
    "different-event-verified" | "same-event" | "unresolved";
  matchedSelfPublishedAccountId: string;
  nonClearanceStatement: string;
  originalSelfUploadUrl: string;
  originalUploaderAccountId: string;
  ownerRecordHeading: string;
  ownerRecordPath: string;
  perFileChecksComplete: boolean;
  residualRiskToken: string;
  selfPublishedOriginalVerified: boolean;
}

export interface Decision14EligibilityInput {
  allowlistEvidenceBytes: string | null;
  allowlistRecord: Decision14AllowlistRecord | null;
  athleteName: string;
  eventPhoto: Decision14EventPhotoRecord | null;
  v6QualifiedNonEvent: boolean;
}

export interface Decision14EligibilityResult {
  outcome: "eligible-photo" | "retain-current-svg";
  reasons: string[];
}

export interface Decision14FrozenAllowlistPolicy {
  evidencePath: string;
  evidenceSha256: string;
  namedPhotographerAllowlist: readonly Decision14AllowlistRecord[];
}

export type Decision14PolicyBoundEligibilityInput = Omit<
  Decision14EligibilityInput,
  "allowlistRecord"
>;

const SHA256_RE = /^[a-f0-9]{64}$/u;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/u;
const HTTPS_RE = /^https:\/\/[^\s]+$/u;
const CLEARANCE_CLAIM_RE =
  /\b(?:no[- ]?risk|risk[- ]?free|rights?[- ]?cleared|fully[- ]?cleared|licensed[- ]for[- ]public[- ]use|legal(?:ly)?[- ]for[- ]public[- ]use|public[- ]release[- ](?:approved|clearance)|safe[- ]to[- ]publish|permission[- ]confirmed)\b|(?:無風險|零風險|已完全清權|已清權|合法公開使用|已獲\s*public-release\s*clearance|公開發布已核准)/iu;
const ALLOWED_LICENSE_TOKENS = new Set([
  "cc-by-2.0",
  "cc-by-3.0",
  "cc-by-4.0",
  "cc-by-sa-2.0",
  "cc-by-sa-3.0",
  "cc-by-sa-4.0",
  "cc0-1.0",
]);

function validIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validReviewEvidencePath(value: string): boolean {
  return /^docs\/reviews\/[a-zA-Z0-9_.-]+\.md$/u.test(value);
}

function contractIssue(
  code: string,
  path: string,
  message: string,
): ValidationIssue {
  return { code, message, path };
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim() === value && value !== "";
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function anniversaryYears(first: string, latest: string): number {
  const firstDate = new Date(`${first}T00:00:00Z`);
  const latestDate = new Date(`${latest}T00:00:00Z`);
  if (
    !Number.isFinite(firstDate.valueOf()) ||
    !Number.isFinite(latestDate.valueOf())
  ) {
    return -1;
  }
  let years = latestDate.getUTCFullYear() - firstDate.getUTCFullYear();
  if (
    latestDate.getUTCMonth() < firstDate.getUTCMonth() ||
    (latestDate.getUTCMonth() === firstDate.getUTCMonth() &&
      latestDate.getUTCDate() < firstDate.getUTCDate())
  ) {
    years -= 1;
  }
  return years;
}

function completeMonthsBetween(first: string, latest: string): number {
  const firstDate = new Date(first);
  const latestDate = new Date(latest);
  if (
    !Number.isFinite(firstDate.valueOf()) ||
    !Number.isFinite(latestDate.valueOf()) ||
    latestDate < firstDate
  ) {
    return -1;
  }
  let months =
    (latestDate.getUTCFullYear() - firstDate.getUTCFullYear()) * 12 +
    latestDate.getUTCMonth() -
    firstDate.getUTCMonth();
  if (latestDate.getUTCDate() < firstDate.getUTCDate()) months -= 1;
  return months;
}

function allUnique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function exactSortedSet(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  const sortedActual = [...actual].sort(compareCodePoints);
  const sortedExpected = [...expected].sort(compareCodePoints);
  return (
    allUnique(actual) &&
    sortedActual.length === sortedExpected.length &&
    sortedActual.every((value, index) => value === sortedExpected[index])
  );
}

export function containsAffirmativeClearanceClaim(value: string): boolean {
  return CLEARANCE_CLAIM_RE.test(value);
}

/** Requires a closed-world, exactly-once pass across the 16 authorized slots. */
export function validateDecision14TargetRoster(
  athleteNames: readonly string[],
): ValidationIssue[] {
  return exactSortedSet(athleteNames, DECISION_14_TARGET_ATHLETES)
    ? []
    : [
        contractIssue(
          "decision14-target-roster",
          "athleteNames",
          "discovery, adjudication, and promotion must cover exactly the fixed 16 target athletes once each",
        ),
      ];
}

/** Ensures a proposed promotion cannot escape the fixed 16-player boundary. */
export function validateDecision14PromotionAthlete(
  athleteName: string,
): ValidationIssue[] {
  return (DECISION_14_TARGET_ATHLETES as readonly string[]).includes(
    athleteName,
  )
    ? []
    : [
        contractIssue(
          "decision14-outside-target-promotion",
          "athleteName",
          "only a current Decision 13 SVG fallback athlete may be promoted",
        ),
      ];
}

/**
 * Verifies complete-subtree and local-byte digests for the five out-of-scope
 * covers. The caller computes each selection digest over canonical JSON bytes.
 */
export function validateDecision14ProtectedCovers(
  actual: ReadonlyArray<{
    athleteName: string;
    localAssetSha256: string;
    selectionSha256: string;
  }>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (
    !exactSortedSet(
      actual.map((row) => row.athleteName),
      DECISION_14_PROTECTED_ATHLETES,
    )
  ) {
    issues.push(
      contractIssue(
        "decision14-protected-roster",
        "protectedCovers",
        "the five protected Commons athletes must be present exactly once",
      ),
    );
    return issues;
  }
  const expectedByAthlete = new Map(
    DECISION_14_PROTECTED_COVER_BINDINGS.map((row) => [row.athleteName, row]),
  );
  for (const row of actual) {
    const expected = expectedByAthlete.get(
      row.athleteName as (typeof DECISION_14_PROTECTED_COVER_BINDINGS)[number]["athleteName"],
    );
    if (
      expected === undefined ||
      row.selectionSha256 !== expected.selectionSha256 ||
      row.localAssetSha256 !== expected.localAssetSha256
    ) {
      issues.push(
        contractIssue(
          "decision14-protected-cover-drift",
          `protectedCovers.${row.athleteName}`,
          "the complete v5 selection subtree and local asset bytes must remain unchanged",
        ),
      );
    }
  }
  return issues;
}

function validAccount(account: Decision14AccountIdentity): boolean {
  let hostValid = false;
  let prefixesValid = false;
  try {
    const accountUrl = new URL(account.accountUrl);
    const host = accountUrl.hostname.toLowerCase();
    const normalizedAccountPath = `${accountUrl.pathname.replace(/\/+$/u, "")}/`;
    hostValid =
      account.platform === "commons"
        ? host === "commons.wikimedia.org"
        : host === "flickr.com" || host === "www.flickr.com";
    prefixesValid = account.canonicalOriginalUrlPrefixes.every((prefix) => {
      const prefixUrl = new URL(prefix);
      const prefixHost = prefixUrl.hostname.toLowerCase();
      const normalizedPrefixPath = `${prefixUrl.pathname.replace(/\/+$/u, "")}/`;
      const validPlatformHost =
        account.platform === "commons"
          ? prefixHost === "commons.wikimedia.org"
          : prefixHost === "flickr.com" || prefixHost === "www.flickr.com";
      return (
        validPlatformHost &&
        normalizedPrefixPath === normalizedAccountPath &&
        prefixUrl.search === "" &&
        prefixUrl.hash === ""
      );
    });
  } catch {
    hostValid = false;
    prefixesValid = false;
  }
  return (
    nonEmpty(account.accountId) &&
    HTTPS_RE.test(account.accountUrl) &&
    hostValid &&
    account.canonicalOriginalUrlPrefixes.length > 0 &&
    account.canonicalOriginalUrlPrefixes.every((prefix) =>
      HTTPS_RE.test(prefix),
    ) &&
    prefixesValid &&
    account.controlledByCanonicalPublicName === true &&
    (account.platform === "commons" || account.platform === "flickr")
  );
}

function belongsToVerifiedAccount(
  value: string,
  accounts: readonly Decision14AccountIdentity[],
): boolean {
  try {
    const candidate = new URL(value);
    return accounts.some((account) =>
      account.canonicalOriginalUrlPrefixes.some((prefix) => {
        const boundary = new URL(prefix);
        const normalizedBoundaryPath = `${boundary.pathname.replace(/\/+$/u, "")}/`;
        return (
          candidate.hostname.toLowerCase() ===
            boundary.hostname.toLowerCase() &&
          `${candidate.pathname.replace(/\/+$/u, "")}/`.startsWith(
            normalizedBoundaryPath,
          )
        );
      }),
    );
  } catch {
    return false;
  }
}

function validEvidencePoint(point: Decision14EvidencePoint): boolean {
  return (
    point.status === "pass" &&
    nonEmpty(point.basis) &&
    !containsAffirmativeClearanceClaim(point.basis) &&
    point.checkedAt === DECISION_14_REVIEW_DATE &&
    nonEmpty(point.checkedBy) &&
    nonEmpty(point.sampleRule) &&
    point.originalWorkIdsOrUrls.length > 0 &&
    point.originalWorkIdsOrUrls.every(nonEmpty)
  );
}

/** Validates every allowlist floor; no unresolved signal is waivable. */
export function validateDecision14AllowlistRecord(
  record: Decision14AllowlistRecord,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (code: string, path: string, message: string) =>
    issues.push(contractIssue(code, path, message));

  if (!SLUG_RE.test(record.photographerId)) {
    add(
      "decision14-allowlist-identity",
      "photographerId",
      "photographerId must be a stable slug",
    );
  }
  const expectedPlatform =
    record.accountControlType === "verified-individual-owned-commons"
      ? "commons"
      : record.accountControlType === "verified-individual-owned-flickr"
        ? "flickr"
        : null;
  if (
    !nonEmpty(record.canonicalPublicName) ||
    !nonEmpty(record.creditedMakerIdentity.canonicalName) ||
    record.creditedMakerIdentity.canonicalName !== record.canonicalPublicName ||
    record.creditedMakerIdentity.relationship !== "same-individual-verified" ||
    record.creditedMakerIdentity.evidenceUrls.length === 0 ||
    !record.creditedMakerIdentity.evidenceUrls.every((url) =>
      HTTPS_RE.test(url),
    )
  ) {
    add(
      "decision14-allowlist-maker-identity",
      "creditedMakerIdentity",
      "the credited individual maker must be independently bound to the canonical public identity",
    );
  }
  if (
    expectedPlatform === null ||
    record.verifiedAccounts.length === 0 ||
    !allUnique(
      record.verifiedAccounts.map(
        (account) => `${account.platform}:${account.accountId}`,
      ),
    ) ||
    !record.verifiedAccounts.every(validAccount) ||
    !record.verifiedAccounts.some(
      (account) => account.platform === expectedPlatform,
    )
  ) {
    add(
      "decision14-allowlist-account-control",
      "verifiedAccounts",
      "at least one unique, verified individual-owned Commons or Flickr account is required",
    );
  }
  if (
    record.selfPublicationProof.status !== "verified" ||
    record.selfPublicationProof.evidenceUrls.length === 0 ||
    !record.selfPublicationProof.evidenceUrls.every(
      (url) =>
        HTTPS_RE.test(url) &&
        belongsToVerifiedAccount(url, record.verifiedAccounts),
    )
  ) {
    add(
      "decision14-allowlist-self-publication",
      "selfPublicationProof",
      "photographer-owned original self-publication must be independently verified",
    );
  }
  if (
    !validIsoDate(record.firstDatedSportsWork.date) ||
    !validIsoDate(record.latestDatedSportsWork.date) ||
    !nonEmpty(record.firstDatedSportsWork.id) ||
    !nonEmpty(record.latestDatedSportsWork.id) ||
    !HTTPS_RE.test(record.firstDatedSportsWork.url) ||
    !HTTPS_RE.test(record.latestDatedSportsWork.url) ||
    !belongsToVerifiedAccount(
      record.firstDatedSportsWork.url,
      record.verifiedAccounts,
    ) ||
    !belongsToVerifiedAccount(
      record.latestDatedSportsWork.url,
      record.verifiedAccounts,
    ) ||
    anniversaryYears(
      record.firstDatedSportsWork.date,
      record.latestDatedSportsWork.date,
    ) < DECISION_14_ALLOWLIST_FLOORS.minimumHistoryYears
  ) {
    add(
      "decision14-allowlist-history-floor",
      "firstDatedSportsWork/latestDatedSportsWork",
      "verified self-published sports work must span at least three full years",
    );
  }
  const history = record.licenseHistory;
  const sampledWorkIds = history.sampledWorks.map(
    (sample) => sample.workIdOrUrl,
  );
  const sampledYears = new Set(
    history.sampledWorks.map((sample) => sample.publishedAt.slice(0, 4)),
  );
  const measuredMatchingWorkCount = history.sampledWorks.filter(
    (sample) => sample.exactLicenseToken === record.expectedLicenseToken,
  ).length;
  const sampleMatchRate =
    history.sampledWorks.length === 0
      ? 0
      : measuredMatchingWorkCount / history.sampledWorks.length;
  if (
    !ALLOWED_LICENSE_TOKENS.has(record.expectedLicenseToken) ||
    !nonEmpty(history.deterministicCollectionMethod) ||
    history.enumeratedWorkIdsOrUrls.length !== history.observedWorkCount ||
    !allUnique(history.enumeratedWorkIdsOrUrls) ||
    history.enumeratedWorkIdsOrUrls.some((value) => !nonEmpty(value)) ||
    history.licenseIndependentSampling !== true ||
    history.dateStratified !== true ||
    !positiveInteger(history.observedWorkCount) ||
    history.observedWorkCount <
      DECISION_14_ALLOWLIST_FLOORS.minimumSelfPublishedSportsWorks ||
    !positiveInteger(history.matchingWorkCount) ||
    history.matchingWorkCount !== measuredMatchingWorkCount ||
    history.matchingWorkCount !== history.sampledWorks.length ||
    sampleMatchRate !== DECISION_14_ALLOWLIST_FLOORS.requiredLicenseMatchRate ||
    history.unexplainedDeviationCount !==
      DECISION_14_ALLOWLIST_FLOORS.toleratedUnexplainedDeviations ||
    !Array.isArray(history.deviationReasons) ||
    history.deviationReasons.some(
      (reason) =>
        !nonEmpty(reason) || containsAffirmativeClearanceClaim(reason),
    ) ||
    history.sampledWorks.length <
      DECISION_14_ALLOWLIST_FLOORS.minimumSampleSize ||
    history.sampledWorks.length > history.observedWorkCount ||
    sampledYears.size < DECISION_14_ALLOWLIST_FLOORS.minimumHistoryYears ||
    !allUnique(sampledWorkIds) ||
    history.sampledWorks.some(
      (sample) =>
        !nonEmpty(sample.workIdOrUrl) ||
        !history.enumeratedWorkIdsOrUrls.includes(sample.workIdOrUrl) ||
        !validIsoDate(sample.publishedAt) ||
        !HTTPS_RE.test(sample.licenseEvidenceUrl) ||
        sample.exactLicenseToken !== record.expectedLicenseToken,
    )
  ) {
    add(
      "decision14-allowlist-license-history-floor",
      "licenseHistory",
      "the enumerated corpus and deterministic sample must meet the 50/30, exact-token, zero-deviation floors",
    );
  }
  const reuse = record.reuseChain;
  const measuredReuseMonths = completeMonthsBetween(
    reuse.earliestRevisionAt,
    reuse.latestRevisionAt,
  );
  const revisionTimes = reuse.fixedRevisions
    .map((revision) => new Date(revision.timestamp))
    .filter((timestamp) => Number.isFinite(timestamp.valueOf()))
    .sort((a, b) => a.valueOf() - b.valueOf());
  const measuredEarliestRevisionAt = revisionTimes.at(0)?.toISOString();
  const measuredLatestRevisionAt = revisionTimes.at(-1)?.toISOString();
  const revisionPermalinks = reuse.fixedRevisions.map(
    (revision) => revision.permalink,
  );
  if (
    reuse.spanMonths < DECISION_14_ALLOWLIST_FLOORS.minimumReuseMonths ||
    measuredReuseMonths < DECISION_14_ALLOWLIST_FLOORS.minimumReuseMonths ||
    reuse.spanMonths !== measuredReuseMonths ||
    !positiveInteger(reuse.commonsOrWikipediaPageCount) ||
    reuse.commonsOrWikipediaPageCount !==
      reuse.commonsOrWikipediaPageUrls.length ||
    !allUnique(reuse.commonsOrWikipediaPageUrls) ||
    !reuse.commonsOrWikipediaPageUrls.every((url) =>
      /^https:\/\/(?:commons\.wikimedia\.org|[a-z-]+\.wikipedia\.org)\//u.test(
        url,
      ),
    ) ||
    !positiveInteger(reuse.revisionCount) ||
    reuse.revisionCount !== reuse.fixedRevisions.length ||
    reuse.fixedRevisions.length < 2 ||
    !allUnique(revisionPermalinks) ||
    !ISO_DATE_RE.test(reuse.earliestRevisionAt.slice(0, 10)) ||
    !ISO_DATE_RE.test(reuse.latestRevisionAt.slice(0, 10)) ||
    measuredEarliestRevisionAt !== reuse.earliestRevisionAt ||
    measuredLatestRevisionAt !== reuse.latestRevisionAt ||
    !reuse.fixedRevisions.every(
      (revision) =>
        /^https:\/\/(?:commons\.wikimedia\.org|[a-z-]+\.wikipedia\.org)\/.*(?:[?&]oldid=|\/revision\/)/u.test(
          revision.permalink,
        ) && Number.isFinite(new Date(revision.timestamp).valueOf()),
    )
  ) {
    add(
      "decision14-allowlist-reuse-floor",
      "reuseChain",
      "a fixed-revision Commons/Wikipedia reuse chain spanning at least 24 months is required",
    );
  }
  if (
    record.disputeSearch.checkedAt !== DECISION_14_REVIEW_DATE ||
    !nonEmpty(record.disputeSearch.checkedBy) ||
    record.disputeSearch.findings !== "none-located" ||
    !nonEmpty(record.disputeSearch.limitation) ||
    containsAffirmativeClearanceClaim(record.disputeSearch.limitation) ||
    !nonEmpty(record.disputeSearch.method) ||
    containsAffirmativeClearanceClaim(record.disputeSearch.method) ||
    record.disputeSearch.queries.length === 0 ||
    record.disputeSearch.queries.some((query) => !nonEmpty(query)) ||
    record.disputeSearch.searchedUrls.length === 0 ||
    record.disputeSearch.searchedUrls.some((url) => !HTTPS_RE.test(url))
  ) {
    add(
      "decision14-allowlist-dispute-search",
      "disputeSearch",
      "a dated, bounded authorship/license/takedown dispute search is required",
    );
  }
  if (
    Object.keys(record.washingChecks).sort(compareCodePoints).join("\0") !==
      [...DECISION_14_WASHING_SIGNAL_IDS].sort(compareCodePoints).join("\0") ||
    DECISION_14_WASHING_SIGNAL_IDS.some((signal) => {
      const point = record.washingChecks[signal];
      return (
        !validEvidencePoint(point) ||
        point.originalWorkIdsOrUrls.some(
          (work) =>
            !history.enumeratedWorkIdsOrUrls.includes(work) &&
            !belongsToVerifiedAccount(work, record.verifiedAccounts),
        )
      );
    })
  ) {
    add(
      "decision14-allowlist-washing-signal",
      "washingChecks",
      "all five source-series washing checks must be separately evidenced and pass",
    );
  }
  if (
    record.checkedAt !== DECISION_14_REVIEW_DATE ||
    !nonEmpty(record.checkedBy) ||
    !nonEmpty(record.evidenceParagraph) ||
    containsAffirmativeClearanceClaim(record.evidenceParagraph) ||
    !validReviewEvidencePath(record.evidencePath) ||
    !SHA256_RE.test(record.evidenceSha256)
  ) {
    add(
      "decision14-allowlist-evidence-binding",
      "evidenceParagraph/evidencePath/evidenceSha256",
      "a current written evidence paragraph and immutable governed evidence binding are required",
    );
  }
  return issues;
}

function validateEventPhoto(
  record: Decision14EventPhotoRecord,
  allowlistRecord: Decision14AllowlistRecord | null,
  allowlistEvidenceBytes: string | null,
): string[] {
  const reasons: string[] = [];
  const allowlistIssues =
    allowlistRecord === null
      ? []
      : validateDecision14AllowlistRecord(allowlistRecord);
  if (allowlistRecord === null || allowlistIssues.length > 0) {
    reasons.push("photographer-not-allowlisted");
  }
  const matchedAccount = allowlistRecord?.verifiedAccounts.find(
    (account) => account.accountId === record.matchedSelfPublishedAccountId,
  );
  if (matchedAccount === undefined) reasons.push("allowlist-account-mismatch");
  if (
    allowlistRecord === null ||
    record.allowlistPhotographerId !== allowlistRecord.photographerId
  ) {
    reasons.push("allowlist-photographer-id-mismatch");
  }
  if (
    allowlistRecord === null ||
    record.creditedMakerCanonicalName !== allowlistRecord.canonicalPublicName
  ) {
    reasons.push("credited-maker-mismatch");
  }
  if (!record.selfPublishedOriginalVerified)
    reasons.push("self-publication-unverified");
  if (!HTTPS_RE.test(record.originalSelfUploadUrl))
    reasons.push("original-self-upload-url-invalid");
  else if (
    matchedAccount === undefined ||
    !belongsToVerifiedAccount(record.originalSelfUploadUrl, [matchedAccount])
  ) {
    reasons.push("original-self-upload-account-mismatch");
  }
  if (!nonEmpty(record.matchedSelfPublishedAccountId))
    reasons.push("self-published-account-missing");
  if (
    matchedAccount === undefined ||
    record.originalUploaderAccountId !== matchedAccount.accountId
  ) {
    reasons.push("original-uploader-account-mismatch");
  }
  if (!record.perFileChecksComplete) reasons.push("per-file-checks-incomplete");
  if (
    !record.candidateLicenseMatchesExpected ||
    allowlistRecord === null ||
    record.expectedLicenseToken !== allowlistRecord.expectedLicenseToken ||
    !ALLOWED_LICENSE_TOKENS.has(allowlistRecord.expectedLicenseToken) ||
    record.candidateLicenseToken !== allowlistRecord.expectedLicenseToken
  ) {
    reasons.push("license-token-mismatch");
  }
  if (
    !(DECISION_14_CONDITIONAL_EVENT_OCCASIONS as readonly string[]).includes(
      record.eventOccasion,
    )
  ) {
    reasons.push("occasion-ineligible");
  }
  if (
    !nonEmpty(record.eventDateEvidence) ||
    !nonEmpty(record.eventOpponentEvidence) ||
    !nonEmpty(record.eventCompetitionEvidence)
  ) {
    reasons.push("event-identity-incomplete");
  }
  if (record.injuryEventRelationship !== "different-event-verified") {
    reasons.push("injury-event-relationship-ineligible");
  }
  if (record.residualRiskToken !== DECISION_14_RESIDUAL_RISK_TOKEN) {
    reasons.push("residual-risk-token-missing");
  }
  if (
    record.ownerRecordPath !== DECISION_14_OWNER_RECORD_PATH ||
    record.ownerRecordHeading !== DECISION_14_OWNER_RECORD_HEADING
  ) {
    reasons.push("owner-record-reference-missing");
  }
  if (
    record.nonClearanceStatement !== DECISION_14_NON_CLEARANCE_STATEMENT ||
    containsAffirmativeClearanceClaim(record.nonClearanceStatement)
  ) {
    reasons.push("non-clearance-statement-invalid");
  }
  if (
    !SLUG_RE.test(record.allowlistPhotographerId) ||
    !validReviewEvidencePath(record.allowlistEvidencePath) ||
    !SHA256_RE.test(record.allowlistEvidenceSha256)
  ) {
    reasons.push("allowlist-evidence-binding-invalid");
  }
  if (
    allowlistRecord === null ||
    allowlistEvidenceBytes === null ||
    record.allowlistEvidencePath !== allowlistRecord.evidencePath ||
    record.allowlistEvidenceSha256 !== allowlistRecord.evidenceSha256 ||
    sha256Hex(allowlistEvidenceBytes) !== allowlistRecord.evidenceSha256
  ) {
    reasons.push("allowlist-evidence-digest-mismatch");
  }
  return reasons;
}

/**
 * Implements the complete Phase 0 decision table:
 *
 *   v6-qualified non-event OR fully qualified named-allowlist event photo.
 *
 * Every failure retains the exact current SVG; there is no count target.
 */
export function decideDecision14PhotoEligibility(
  input: Decision14EligibilityInput,
): Decision14EligibilityResult {
  const targetIssues = validateDecision14PromotionAthlete(input.athleteName);
  if (targetIssues.length > 0) {
    return {
      outcome: "retain-current-svg",
      reasons: ["outside-fixed-target-roster"],
    };
  }
  if (input.v6QualifiedNonEvent && input.eventPhoto === null) {
    return { outcome: "eligible-photo", reasons: ["v6-qualified-non-event"] };
  }
  if (input.v6QualifiedNonEvent && input.eventPhoto !== null) {
    return {
      outcome: "retain-current-svg",
      reasons: ["occasion-branch-ambiguous"],
    };
  }
  if (
    input.eventPhoto === null ||
    input.eventPhoto.athleteName !== input.athleteName
  ) {
    return {
      outcome: "retain-current-svg",
      reasons: ["no-matching-qualified-photo"],
    };
  }
  const reasons = validateEventPhoto(
    input.eventPhoto,
    input.allowlistRecord,
    input.allowlistEvidenceBytes,
  );
  return reasons.length === 0
    ? {
        outcome: "eligible-photo",
        reasons: ["qualified-decision14-event-photo"],
      }
    : { outcome: "retain-current-svg", reasons };
}

/**
 * Joins event eligibility to the trusted immutable-policy object loaded by the
 * caller instead of trusting a separately supplied allowlist record. The
 * name-independent decision function above remains useful for testing the
 * abstract contract.
 */
export function decideDecision14PhotoEligibilityAgainstPolicy(
  input: Decision14PolicyBoundEligibilityInput,
  policy: Decision14FrozenAllowlistPolicy,
): Decision14EligibilityResult {
  if (input.v6QualifiedNonEvent || input.eventPhoto === null) {
    return decideDecision14PhotoEligibility({
      ...input,
      allowlistRecord: null,
    });
  }

  const policyRecords = policy.namedPhotographerAllowlist;
  const globalAccountIds = policyRecords.flatMap((record) =>
    record.verifiedAccounts.map(
      (account) => `${account.platform}:${account.accountId}`,
    ),
  );
  const policyInvalid =
    !validReviewEvidencePath(policy.evidencePath) ||
    !SHA256_RE.test(policy.evidenceSha256) ||
    !allUnique(policyRecords.map((record) => record.photographerId)) ||
    !allUnique(globalAccountIds) ||
    policyRecords.some(
      (record) =>
        validateDecision14AllowlistRecord(record).length > 0 ||
        record.evidencePath !== policy.evidencePath ||
        record.evidenceSha256 !== policy.evidenceSha256,
    );
  if (policyInvalid) {
    return {
      outcome: "retain-current-svg",
      reasons: ["frozen-allowlist-policy-invalid"],
    };
  }

  const evidenceMatches =
    input.allowlistEvidenceBytes !== null &&
    sha256Hex(input.allowlistEvidenceBytes) === policy.evidenceSha256;
  const event = input.eventPhoto;
  const matchingRecords = policyRecords.filter(
    (record) => record.photographerId === event.allowlistPhotographerId,
  );
  if (matchingRecords.length !== 1) {
    return {
      outcome: "retain-current-svg",
      reasons: ["photographer-not-in-frozen-policy-allowlist"],
    };
  }
  if (
    event.allowlistEvidencePath !== policy.evidencePath ||
    event.allowlistEvidenceSha256 !== policy.evidenceSha256 ||
    !evidenceMatches
  ) {
    return {
      outcome: "retain-current-svg",
      reasons: ["frozen-allowlist-evidence-mismatch"],
    };
  }

  return decideDecision14PhotoEligibility({
    ...input,
    allowlistRecord: matchingRecords[0]!,
  });
}

/** Helper shared by tests/generators for exact selection-subtree bindings. */
export function decision14SelectionSha256(
  canonicalSelectionBytes: string,
): string {
  return sha256Hex(canonicalSelectionBytes);
}
