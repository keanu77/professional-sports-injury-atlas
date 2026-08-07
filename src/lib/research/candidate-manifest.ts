/**
 * Shared, launch-only G2 count floor for source-manifest generation and
 * validation. Public release keeps its separate 10-per-injury / 30-total gate.
 */

import {
  canonicalJson,
  CanonicalJsonError,
  compareCodePoints,
  isValidIsoDate,
  isValidUtcTimestamp,
  issue,
  parseStrictJson,
  SHA256_RE,
  sha256Hex,
  type ValidationIssue,
} from "../contracts/canonical";
import {
  CANDIDATE_COMPETITIONS,
  CANDIDATE_INJURY_CODES,
  CANDIDATE_VIDEO_PROVIDERS,
  RECENT_CANDIDATE_CUTOFF,
  VIDEO_UPLOADER_PROVENANCES,
  type CandidateCaptionStatus,
  type CandidateCompetition,
  type CandidateEmbedStatus,
  type CandidateInjuryCode,
  type CandidateRow,
  type CandidateVideoProvider,
  type DiagnosisSourceType,
  type FirstPartyAvailabilityStatus,
  type VideoUploaderProvenance,
} from "./candidate-contract";
import {
  computeCandidateReviewSetDigest,
  serializeVerificationArtifact,
  validateCandidateVerification,
  validateRootSourceAuditAgainstRows,
  validateRootSourceAuditShape,
  validateSourceReviewDecisionShape,
  validateVerificationArtifactShape,
  type CandidateVerificationArtifactV1,
  type RootAuditArchiveCheck,
  type RootAuditLocationCheck,
  type RootSourceAuditV1,
  type SourceReviewDecisionV1,
} from "./link-verification";
import { validateCandidateSet } from "./validation";

export const SOURCE_MANIFEST_BATCH_TYPES = [
  "launch",
  "quarterly",
  "correction",
] as const;
export type SourceManifestBatchType =
  (typeof SOURCE_MANIFEST_BATCH_TYPES)[number];

/** Authorized by the 2026-08-07 G2 threshold-adjustment decision. */
export const G2_LAUNCH_MIN_ENTRIES_PER_INJURY = 7;
/** Authorized by the 2026-08-07 G2 threshold-adjustment decision. */
export const G2_LAUNCH_MIN_ENTRIES_TOTAL = 26;

/** Default launch contract retained from the original G2 plan. */
export const G2_LAUNCH_DEFAULT_MIN_CLASSIC_ENTRIES = 1;
/**
 * Decision 3 authorizes zero classics for this frozen batch only. Keeping the
 * identity explicit prevents the exception from leaking into future launches.
 */
export const NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID = "NBA-SOURCE-2026-08-06-001";

export const NBA_LAUNCH_MANIFEST_PERIOD = "2026-08-06";
export const NBA_LAUNCH_SOURCE_POLICY_VERSION = "nba-v2";
export const NBA_LAUNCH_CUTOFF_DATE = RECENT_CANDIDATE_CUTOFF;
export const NBA_LAUNCH_SOURCE_POLICY_JSON_DIGEST =
  "6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07";
export const NBA_LAUNCH_SOURCE_POLICY_MARKDOWN_DIGEST =
  "b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570";
export const NBA_LAUNCH_CANDIDATE_SET_DIGEST =
  "c217953f242492a1e84291e40c592a5fa4824edcde0434733bccb41622add8e5";
export const NBA_LAUNCH_SOURCE_REVIEW_DECISION_DIGEST =
  "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c";
export const NBA_LAUNCH_SOURCE_REVIEWED_BY = "吳易澄醫師";
export const NBA_LAUNCH_SOURCE_REVIEWED_AT = "2026-08-07T15:31:19Z";

export interface SourceManifestSupersedesReference {
  manifestId: string;
  candidateId: string;
  entryDigest: string;
}

export interface CandidateManifestSourceReview {
  status: "approved-for-authoring";
  manifestId: string;
  sourcePolicyJsonDigest: string;
  sourcePolicyMarkdownDigest: string;
  reviewedBy: string;
  reviewedAt: string;
  candidateSetDigest: string;
  classicProposalCandidateIds: string[];
}

export interface CandidateManifestSourceDigests {
  aclCsvSha256: string;
  ankleSprainCsvSha256: string;
  achillesRuptureCsvSha256: string;
  verificationArtifactSha256: string;
  rootAuditSha256: string;
  sourcePolicyJsonSha256: string;
  sourcePolicyMarkdownSha256: string;
  sourceReviewDecisionSha256: string;
}

export interface CandidateManifestCounts extends SourceManifestCounts {
  recent: number;
  classic: number;
  byEmbedStatus: {
    verified: number;
    externalLinkOnly: number;
  };
}

export interface CandidateManifestDiagnosisSource {
  type: Exclude<DiagnosisSourceType, "">;
  title: string;
  publisher: string;
  independenceGroup: string;
  originReportId: string | null;
  url: string;
  publishedAt: string;
  accessedAt: string;
}

export interface CandidateManifestEventSource {
  title: string;
  publisher: string;
  url: string;
  publishedAt: string;
  accessedAt: string;
}

export interface CandidateManifestVideo {
  provider: CandidateVideoProvider;
  contentType: "in-game-injury-event";
  canonicalUrl: string;
  title: string;
  uploaderName: string;
  uploaderProvenance: VideoUploaderProvenance;
  channelUrl: string;
  publishedAt: string;
  accessedAt: string;
  embedStatus: Extract<CandidateEmbedStatus, "verified" | "external-link-only">;
  embedCheckedAt: string;
  captionStatus: Extract<CandidateCaptionStatus, "available" | "unavailable">;
  captionCheckedAt: string;
  provenanceBasis: string;
  provenanceStatus: "verified";
  provenanceCheckedBy: string;
  provenanceCheckedAt: string;
}

export interface CandidateManifestEventBinding {
  status: "passed";
  rootAuditReference: string;
  basis: string;
}

export interface CandidateManifestFirstPartyAvailability {
  status: FirstPartyAvailabilityStatus;
  basis: string | null;
  checkedBy: string;
  checkedAt: string;
  auditReference: string;
  officialLocationsChecked: RootAuditLocationCheck[];
  archiveOrSearchChecks: RootAuditArchiveCheck[];
}

export interface CandidateManifestClassicProposal {
  reviewedBy: string;
  reviewedAt: string;
  sourceReviewDecisionDigest: string;
}

export interface CandidateManifestEntryReviewDecision {
  digest: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface CandidateManifestEntryVerification {
  artifactDigest: string;
  rootAuditDigest: string;
  rootAuditReference: string;
  rootAuditStatus: "passed";
  resultReferences: string[];
}

export interface CandidateSourceManifestEntryV1 {
  entryDigest: string;
  supersedes: SourceManifestSupersedesReference | null;
  sourceStatus: "source-verified";
  candidateId: string;
  injuryCode: CandidateInjuryCode;
  athleteDisplayName: string;
  teamAtEvent: string;
  season: string;
  eventDate: string;
  opponent: string;
  competition: CandidateCompetition;
  isClassic: boolean;
  classicReason: string | null;
  classicProposedBy: CandidateManifestClassicProposal | null;
  video: CandidateManifestVideo;
  eventBinding: CandidateManifestEventBinding;
  diagnosisClaim: string;
  diagnosisSources: [
    CandidateManifestDiagnosisSource,
    CandidateManifestDiagnosisSource | null,
  ];
  eventSource: CandidateManifestEventSource;
  firstPartyAvailability: CandidateManifestFirstPartyAvailability;
  sourceReviewDecision: CandidateManifestEntryReviewDecision;
  verification: CandidateManifestEntryVerification;
}

export interface CandidateSourceManifestV1 {
  schemaVersion: 1;
  manifestId: string;
  batchType: SourceManifestBatchType;
  period: string;
  sourcePolicyVersion: string;
  cutoffDate: string;
  generatedAt: string;
  sourceReview: CandidateManifestSourceReview;
  sourceDigests: CandidateManifestSourceDigests;
  counts: CandidateManifestCounts;
  supersedes: SourceManifestSupersedesReference[];
  entries: CandidateSourceManifestEntryV1[];
}

export interface CandidateManifestBuildInput {
  manifestId: string;
  batchType: SourceManifestBatchType;
  period: string;
  sourcePolicyVersion: string;
  cutoffDate: string;
  rows: readonly CandidateRow[];
  csvBytes: Record<CandidateInjuryCode, string>;
  verificationArtifactBytes: string;
  rootAuditBytes: string;
  sourcePolicyJsonBytes: string;
  sourcePolicyMarkdownBytes: string;
  sourceReviewDecisionBytes: string;
  validationNow: string;
  supersedes?: readonly SourceManifestSupersedesReference[];
}

export class CandidateManifestBuildError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super(`candidate manifest build failed with ${issues.length} issue(s)`);
    this.name = "CandidateManifestBuildError";
    this.issues = [...issues];
  }
}

export interface SourceManifestCounts {
  byInjury: Record<CandidateInjuryCode, number>;
  total: number;
}

export interface SourceManifestComposition {
  classic: number;
  recent: number;
}

/**
 * Enforce the initial G2 authoring-handoff floor only for the immutable launch
 * batch. Quarterly and correction batches use their own append contracts.
 */
export function validateG2ManifestCountFloor(
  batchType: SourceManifestBatchType,
  counts: SourceManifestCounts,
): ValidationIssue[] {
  if (batchType !== "launch") return [];

  const issues: ValidationIssue[] = [];
  for (const injuryCode of CANDIDATE_INJURY_CODES) {
    const count = counts.byInjury[injuryCode];
    if (count < G2_LAUNCH_MIN_ENTRIES_PER_INJURY) {
      issues.push(
        issue(
          "manifest-launch-injury-count-shortfall",
          `counts.byInjury.${injuryCode}`,
          `${injuryCode} has ${count} entries; the authorized G2 launch floor is ${G2_LAUNCH_MIN_ENTRIES_PER_INJURY}`,
        ),
      );
    }
  }
  if (counts.total < G2_LAUNCH_MIN_ENTRIES_TOTAL) {
    issues.push(
      issue(
        "manifest-launch-total-count-shortfall",
        "counts.total",
        `launch has ${counts.total} entries; the authorized G2 floor is ${G2_LAUNCH_MIN_ENTRIES_TOTAL}`,
      ),
    );
  }
  return issues;
}

/**
 * Enforce launch composition independently from the count floor. Decision 3
 * changes only classic presence for one immutable batch; recent entries must
 * continue to outnumber classic entries for every launch.
 */
export function validateG2ManifestComposition(
  manifestId: string,
  batchType: SourceManifestBatchType,
  counts: SourceManifestComposition,
): ValidationIssue[] {
  if (batchType !== "launch") return [];

  const issues: ValidationIssue[] = [];
  const minimumClassic =
    manifestId === NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID
      ? 0
      : G2_LAUNCH_DEFAULT_MIN_CLASSIC_ENTRIES;
  if (counts.classic < minimumClassic) {
    issues.push(
      issue(
        "manifest-launch-classic-count-shortfall",
        "counts.classic",
        `launch ${manifestId} has ${counts.classic} classic entries; the G2 launch floor is ${minimumClassic}`,
      ),
    );
  }
  if (counts.recent <= counts.classic) {
    issues.push(
      issue(
        "manifest-launch-recent-not-greater-than-classic",
        "counts.recent",
        `launch has ${counts.recent} recent and ${counts.classic} classic entries; recent entries must outnumber classic entries`,
      ),
    );
  }
  return issues;
}

const QUARTER_PERIOD_RE = /^\d{4}-q[1-4]$/u;
const MANIFEST_ID_RE = /^[A-Z0-9]+-SOURCE-\d{4}-\d{2}-\d{2}-\d{3}$/u;
const HTTPS_RE = /^https:\/\//u;

const TOP_LEVEL_KEYS = [
  "schemaVersion",
  "manifestId",
  "batchType",
  "period",
  "sourcePolicyVersion",
  "cutoffDate",
  "generatedAt",
  "sourceReview",
  "sourceDigests",
  "counts",
  "supersedes",
  "entries",
] as const;
const SOURCE_REVIEW_KEYS = [
  "status",
  "manifestId",
  "sourcePolicyJsonDigest",
  "sourcePolicyMarkdownDigest",
  "reviewedBy",
  "reviewedAt",
  "candidateSetDigest",
  "classicProposalCandidateIds",
] as const;
const SOURCE_DIGEST_KEYS = [
  "aclCsvSha256",
  "ankleSprainCsvSha256",
  "achillesRuptureCsvSha256",
  "verificationArtifactSha256",
  "rootAuditSha256",
  "sourcePolicyJsonSha256",
  "sourcePolicyMarkdownSha256",
  "sourceReviewDecisionSha256",
] as const;
const COUNTS_KEYS = [
  "byInjury",
  "total",
  "recent",
  "classic",
  "byEmbedStatus",
] as const;
const ENTRY_KEYS = [
  "entryDigest",
  "supersedes",
  "sourceStatus",
  "candidateId",
  "injuryCode",
  "athleteDisplayName",
  "teamAtEvent",
  "season",
  "eventDate",
  "opponent",
  "competition",
  "isClassic",
  "classicReason",
  "classicProposedBy",
  "video",
  "eventBinding",
  "diagnosisClaim",
  "diagnosisSources",
  "eventSource",
  "firstPartyAvailability",
  "sourceReviewDecision",
  "verification",
] as const;
const SUPERSEDES_KEYS = ["manifestId", "candidateId", "entryDigest"] as const;
const CLASSIC_PROPOSAL_KEYS = [
  "reviewedBy",
  "reviewedAt",
  "sourceReviewDecisionDigest",
] as const;
const VIDEO_KEYS = [
  "provider",
  "contentType",
  "canonicalUrl",
  "title",
  "uploaderName",
  "uploaderProvenance",
  "channelUrl",
  "publishedAt",
  "accessedAt",
  "embedStatus",
  "embedCheckedAt",
  "captionStatus",
  "captionCheckedAt",
  "provenanceBasis",
  "provenanceStatus",
  "provenanceCheckedBy",
  "provenanceCheckedAt",
] as const;
const EVENT_BINDING_KEYS = ["status", "rootAuditReference", "basis"] as const;
const SOURCE_KEYS = [
  "type",
  "title",
  "publisher",
  "independenceGroup",
  "originReportId",
  "url",
  "publishedAt",
  "accessedAt",
] as const;
const EVENT_SOURCE_KEYS = [
  "title",
  "publisher",
  "url",
  "publishedAt",
  "accessedAt",
] as const;
const FIRST_PARTY_KEYS = [
  "status",
  "basis",
  "checkedBy",
  "checkedAt",
  "auditReference",
  "officialLocationsChecked",
  "archiveOrSearchChecks",
] as const;
const LOCATION_CHECK_KEYS = ["url", "outcome", "observedAt"] as const;
const ARCHIVE_CHECK_KEYS = ["queryOrUrl", "outcome", "observedAt"] as const;
const ENTRY_DECISION_KEYS = ["digest", "reviewedBy", "reviewedAt"] as const;
const VERIFICATION_KEYS = [
  "artifactDigest",
  "rootAuditDigest",
  "rootAuditReference",
  "rootAuditStatus",
  "resultReferences",
] as const;
const DECISION_KEYS = [
  "schemaVersion",
  "manifestId",
  "status",
  "sourcePolicyJsonDigest",
  "sourcePolicyMarkdownDigest",
  "reviewedBy",
  "reviewedAt",
  "candidateSetDigest",
  "classicProposalCandidateIds",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function integerAtLeastZero(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  const actual = Object.keys(value).sort(compareCodePoints);
  const wanted = [...expected].sort(compareCodePoints);
  if (canonicalJson(actual) !== canonicalJson(wanted)) {
    issues.push(
      issue(
        "manifest-schema",
        path,
        `object keys must be exactly ${wanted.join(", ")}`,
      ),
    );
  }
}

function sortAndDedupeIssues(
  input: readonly ValidationIssue[],
): ValidationIssue[] {
  const unique = new Map<string, ValidationIssue>();
  for (const entry of input) {
    const key = canonicalJson(entry);
    if (!unique.has(key)) unique.set(key, entry);
  }
  return [...unique.values()].sort(
    (left, right) =>
      compareCodePoints(left.path, right.path) ||
      compareCodePoints(left.code, right.code) ||
      compareCodePoints(left.message, right.message),
  );
}

function normalizeJsonNfc<T>(value: T): T {
  if (typeof value === "string") return value.normalize("NFC") as T;
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeJsonNfc(entry)) as T;
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key.normalize("NFC"),
        normalizeJsonNfc(entry),
      ]),
    ) as T;
  }
  return value;
}

function parseCanonicalArtifact(
  bytes: string,
  path: string,
  issues: ValidationIssue[],
): unknown | null {
  let parsed: unknown;
  try {
    parsed = parseStrictJson(bytes);
  } catch (error) {
    issues.push(
      issue(
        "manifest-input-json",
        path,
        error instanceof CanonicalJsonError
          ? error.message
          : "artifact is not strict JSON",
      ),
    );
    return null;
  }
  try {
    if (canonicalJson(parsed) !== bytes) {
      issues.push(
        issue(
          "manifest-input-canonical",
          path,
          "artifact bytes must be exact compact canonical JSON",
        ),
      );
      return null;
    }
  } catch (error) {
    issues.push(
      issue(
        "manifest-input-canonical",
        path,
        error instanceof Error ? error.message : "artifact is not canonical",
      ),
    );
    return null;
  }
  return parsed;
}

function compareSupersedes(
  left: SourceManifestSupersedesReference,
  right: SourceManifestSupersedesReference,
): number {
  return (
    compareCodePoints(left.manifestId, right.manifestId) ||
    compareCodePoints(left.candidateId, right.candidateId) ||
    compareCodePoints(left.entryDigest, right.entryDigest)
  );
}

const injuryOrder = new Map(
  CANDIDATE_INJURY_CODES.map((injury, index) => [injury, index]),
);

function compareRows(left: CandidateRow, right: CandidateRow): number {
  return (
    (injuryOrder.get(left.injuryCode) ?? injuryOrder.size) -
      (injuryOrder.get(right.injuryCode) ?? injuryOrder.size) ||
    compareCodePoints(left.eventDate, right.eventDate) ||
    compareCodePoints(left.candidateId, right.candidateId)
  );
}

function compareEntries(
  left: CandidateSourceManifestEntryV1,
  right: CandidateSourceManifestEntryV1,
): number {
  return (
    (injuryOrder.get(left.injuryCode) ?? injuryOrder.size) -
      (injuryOrder.get(right.injuryCode) ?? injuryOrder.size) ||
    compareCodePoints(left.eventDate, right.eventDate) ||
    compareCodePoints(left.candidateId, right.candidateId)
  );
}

function entryPayload(
  entry: CandidateSourceManifestEntryV1,
): Omit<CandidateSourceManifestEntryV1, "entryDigest"> {
  const { entryDigest: _entryDigest, ...payload } = entry;
  return payload;
}

export function computeCandidateManifestEntryDigest(
  entry:
    | CandidateSourceManifestEntryV1
    | Omit<CandidateSourceManifestEntryV1, "entryDigest">,
): string {
  const payload = "entryDigest" in entry ? entryPayload(entry) : entry;
  return sha256Hex(canonicalJson(payload));
}

export function serializeCandidateManifest(
  manifest: CandidateSourceManifestV1,
): string {
  return canonicalJson(manifest);
}

export function digestCandidateManifest(
  manifest: CandidateSourceManifestV1,
): string {
  return sha256Hex(serializeCandidateManifest(manifest));
}

function diagnosisSource(
  type: DiagnosisSourceType,
  title: string,
  publisher: string,
  independenceGroup: string,
  originReportId: string,
  url: string,
  publishedAt: string,
  accessedAt: string,
): CandidateManifestDiagnosisSource | null {
  if (type === "") return null;
  return {
    type,
    title,
    publisher,
    independenceGroup,
    originReportId: originReportId === "" ? null : originReportId,
    url,
    publishedAt,
    accessedAt,
  };
}

function latestDeterministicTimestamp(
  rows: readonly CandidateRow[],
  verification: CandidateVerificationArtifactV1,
  audit: RootSourceAuditV1,
): string {
  const timestamps = [
    ...rows.map((row) => row.reviewedAt),
    verification.checkedAt,
    ...verification.results.map((result) => result.checkedAt),
    audit.checkedAt,
    ...audit.candidates.flatMap((candidate) => [
      candidate.checkedAt,
      candidate.firstPartyAvailability.checkedAt,
      ...candidate.firstPartyAvailability.officialLocationsChecked.map(
        (entry) => entry.observedAt,
      ),
      ...candidate.firstPartyAvailability.archiveOrSearchChecks.map(
        (entry) => entry.observedAt,
      ),
    ]),
  ].filter(isValidUtcTimestamp);
  timestamps.sort(compareCodePoints);
  return timestamps.at(-1) ?? "";
}

function validateGenericDecision(
  value: unknown,
  manifestId: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) {
    return [
      issue(
        "manifest-review-decision",
        "sourceReviewDecision",
        "source-review decision must be a plain object",
      ),
    ];
  }
  exactKeys(value, DECISION_KEYS, "sourceReviewDecision", issues);
  if (
    value.schemaVersion !== 1 ||
    value.manifestId !== manifestId ||
    value.status !== "approved-for-manifest"
  ) {
    issues.push(
      issue(
        "manifest-review-decision",
        "sourceReviewDecision",
        "source-review decision header does not match the manifest",
      ),
    );
  }
  for (const key of [
    "sourcePolicyJsonDigest",
    "sourcePolicyMarkdownDigest",
    "candidateSetDigest",
  ] as const) {
    if (typeof value[key] !== "string" || !SHA256_RE.test(value[key])) {
      issues.push(
        issue(
          "manifest-review-decision",
          `sourceReviewDecision.${key}`,
          `${key} must be a lowercase SHA-256`,
        ),
      );
    }
  }
  if (
    !nonEmptyString(value.reviewedBy) ||
    !isValidUtcTimestamp(String(value.reviewedAt ?? ""))
  ) {
    issues.push(
      issue(
        "manifest-review-decision",
        "sourceReviewDecision",
        "source-review decision requires a reviewer and UTC timestamp",
      ),
    );
  }
  if (
    !Array.isArray(value.classicProposalCandidateIds) ||
    value.classicProposalCandidateIds.some((entry) => !nonEmptyString(entry))
  ) {
    issues.push(
      issue(
        "manifest-review-decision",
        "sourceReviewDecision.classicProposalCandidateIds",
        "classic proposal IDs must be an array of non-empty strings",
      ),
    );
  } else {
    const sorted = [...value.classicProposalCandidateIds].sort(
      compareCodePoints,
    );
    if (
      new Set(value.classicProposalCandidateIds).size !==
        value.classicProposalCandidateIds.length ||
      canonicalJson(sorted) !== canonicalJson(value.classicProposalCandidateIds)
    ) {
      issues.push(
        issue(
          "manifest-review-decision",
          "sourceReviewDecision.classicProposalCandidateIds",
          "classic proposal IDs must be sorted and unique",
        ),
      );
    }
  }
  return sortAndDedupeIssues(issues);
}

function validateBuildHeader(
  input: CandidateManifestBuildInput,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!MANIFEST_ID_RE.test(input.manifestId)) {
    issues.push(
      issue(
        "manifest-header",
        "manifestId",
        "manifestId must use the immutable SOURCE date/sequence format",
      ),
    );
  }
  if (!SOURCE_MANIFEST_BATCH_TYPES.includes(input.batchType)) {
    issues.push(issue("manifest-header", "batchType", "invalid batch type"));
  }
  if (
    input.batchType === "quarterly"
      ? !QUARTER_PERIOD_RE.test(input.period)
      : !isValidIsoDate(input.period)
  ) {
    issues.push(
      issue(
        "manifest-period",
        "period",
        input.batchType === "quarterly"
          ? "quarterly period must be YYYY-qN"
          : "launch/correction period must be an ISO date",
      ),
    );
  }
  if (!nonEmptyString(input.sourcePolicyVersion)) {
    issues.push(
      issue(
        "manifest-header",
        "sourcePolicyVersion",
        "source policy version is required",
      ),
    );
  }
  if (!isValidIsoDate(input.cutoffDate)) {
    issues.push(
      issue("manifest-header", "cutoffDate", "cutoffDate must be an ISO date"),
    );
  }
  if (!isValidUtcTimestamp(input.validationNow)) {
    issues.push(
      issue(
        "manifest-build-clock",
        "validationNow",
        "validationNow must be a UTC timestamp used only for freshness checks",
      ),
    );
  }
  if (input.manifestId === NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID) {
    if (
      input.batchType !== "launch" ||
      input.period !== NBA_LAUNCH_MANIFEST_PERIOD ||
      input.sourcePolicyVersion !== NBA_LAUNCH_SOURCE_POLICY_VERSION ||
      input.cutoffDate !== NBA_LAUNCH_CUTOFF_DATE
    ) {
      issues.push(
        issue(
          "manifest-frozen-header",
          "",
          "the authorized NBA launch manifest requires the exact launch/period/nba-v2/cutoff header",
        ),
      );
    }
  }
  return issues;
}

function candidateValidationIssues(
  rows: readonly CandidateRow[],
): ValidationIssue[] {
  return validateCandidateSet([...rows]).map((entry) =>
    issue(
      entry.code,
      `rows[${entry.filename}:${entry.row}].${entry.column}`,
      entry.message,
    ),
  );
}

/**
 * Build one immutable candidate manifest entirely in memory. All byte streams
 * are treated as authority inputs; validationNow affects freshness checks only
 * and can never enter generatedAt or the serialized manifest.
 */
export function buildCandidateManifest(
  input: CandidateManifestBuildInput,
): CandidateSourceManifestV1 {
  const issues: ValidationIssue[] = [
    ...validateBuildHeader(input),
    ...candidateValidationIssues(input.rows),
  ];

  const verificationValue = parseCanonicalArtifact(
    input.verificationArtifactBytes,
    "verificationArtifactBytes",
    issues,
  );
  const rootAuditValue = parseCanonicalArtifact(
    input.rootAuditBytes,
    "rootAuditBytes",
    issues,
  );
  const policyValue = parseCanonicalArtifact(
    input.sourcePolicyJsonBytes,
    "sourcePolicyJsonBytes",
    issues,
  );
  const decisionValue = parseCanonicalArtifact(
    input.sourceReviewDecisionBytes,
    "sourceReviewDecisionBytes",
    issues,
  );

  if (verificationValue !== null) {
    issues.push(...validateVerificationArtifactShape(verificationValue));
  }
  if (rootAuditValue !== null) {
    issues.push(...validateRootSourceAuditShape(rootAuditValue));
  }
  if (decisionValue !== null) {
    issues.push(...validateGenericDecision(decisionValue, input.manifestId));
    if (input.manifestId === NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID) {
      issues.push(...validateSourceReviewDecisionShape(decisionValue));
    }
  }

  const policyJsonDigest = sha256Hex(input.sourcePolicyJsonBytes);
  const policyMarkdownDigest = sha256Hex(input.sourcePolicyMarkdownBytes);
  if (!isRecord(policyValue)) {
    issues.push(
      issue(
        "manifest-source-policy",
        "sourcePolicyJsonBytes",
        "source policy must be a canonical object",
      ),
    );
  } else {
    if (
      policyValue.schemaVersion !== 1 ||
      policyValue.sourcePolicyVersion !== input.sourcePolicyVersion ||
      policyValue.cutoffDate !== input.cutoffDate
    ) {
      issues.push(
        issue(
          "manifest-source-policy",
          "sourcePolicyJsonBytes",
          "source policy header does not match the requested manifest header",
        ),
      );
    }
    const humanDocument = policyValue.humanPolicyDocument;
    if (
      !isRecord(humanDocument) ||
      humanDocument.sha256 !== policyMarkdownDigest
    ) {
      issues.push(
        issue(
          "manifest-source-policy",
          "sourcePolicyJsonBytes.humanPolicyDocument",
          "machine policy does not bind the exact human policy bytes",
        ),
      );
    }
  }

  if (issues.length > 0) {
    throw new CandidateManifestBuildError(sortAndDedupeIssues(issues));
  }

  const verification = verificationValue as CandidateVerificationArtifactV1;
  const rootAudit = rootAuditValue as RootSourceAuditV1;
  const decision = decisionValue as unknown as SourceReviewDecisionV1;
  const expectedCandidateSetDigest = computeCandidateReviewSetDigest({
    rows: input.rows,
    rootAuditBytes: input.rootAuditBytes,
    verificationBytes: input.verificationArtifactBytes,
    sourcePolicyJsonBytes: input.sourcePolicyJsonBytes,
    sourcePolicyMarkdownBytes: input.sourcePolicyMarkdownBytes,
  });

  issues.push(
    ...validateRootSourceAuditAgainstRows(input.rows, rootAudit),
    ...validateCandidateVerification({
      rows: [...input.rows],
      artifact: verification,
      now: input.validationNow,
      rootAudit,
      decision,
      policyDigests: {
        json: policyJsonDigest,
        markdown: policyMarkdownDigest,
      },
      expectedCandidateSetDigest,
      boundVerificationDigest: sha256Hex(input.verificationArtifactBytes),
      requireRootAudit: true,
      requireReviewDecision: true,
    }),
  );

  if (
    decision.sourcePolicyJsonDigest !== policyJsonDigest ||
    decision.sourcePolicyMarkdownDigest !== policyMarkdownDigest ||
    decision.candidateSetDigest !== expectedCandidateSetDigest
  ) {
    issues.push(
      issue(
        "manifest-review-decision-binding",
        "sourceReviewDecision",
        "source-review decision does not bind current policy and candidate-set bytes",
      ),
    );
  }
  const decisionDigest = sha256Hex(input.sourceReviewDecisionBytes);
  if (
    input.manifestId === NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID &&
    (policyJsonDigest !== NBA_LAUNCH_SOURCE_POLICY_JSON_DIGEST ||
      policyMarkdownDigest !== NBA_LAUNCH_SOURCE_POLICY_MARKDOWN_DIGEST ||
      expectedCandidateSetDigest !== NBA_LAUNCH_CANDIDATE_SET_DIGEST ||
      decisionDigest !== NBA_LAUNCH_SOURCE_REVIEW_DECISION_DIGEST ||
      decision.reviewedBy !== NBA_LAUNCH_SOURCE_REVIEWED_BY ||
      decision.reviewedAt !== NBA_LAUNCH_SOURCE_REVIEWED_AT ||
      decision.classicProposalCandidateIds.length !== 0)
  ) {
    issues.push(
      issue(
        "manifest-frozen-input",
        "",
        "authorized NBA launch inputs do not match the frozen nba-v2 review decision",
      ),
    );
  }
  if (
    serializeVerificationArtifact(verification) !==
    input.verificationArtifactBytes
  ) {
    issues.push(
      issue(
        "manifest-verification-bytes",
        "verificationArtifactBytes",
        "verification artifact bytes do not match its strict serializer",
      ),
    );
  }

  const selectedRows = input.rows
    .filter((row) => row.discoveryStatus === "source-verified")
    .sort(compareRows);
  const counts: CandidateManifestCounts = {
    byInjury: {
      acl: selectedRows.filter((row) => row.injuryCode === "acl").length,
      "ankle-sprain": selectedRows.filter(
        (row) => row.injuryCode === "ankle-sprain",
      ).length,
      "achilles-rupture": selectedRows.filter(
        (row) => row.injuryCode === "achilles-rupture",
      ).length,
    },
    total: selectedRows.length,
    recent: selectedRows.filter((row) => row.isClassic === false).length,
    classic: selectedRows.filter((row) => row.isClassic === true).length,
    byEmbedStatus: {
      verified: selectedRows.filter((row) => row.embedStatus === "verified")
        .length,
      externalLinkOnly: selectedRows.filter(
        (row) => row.embedStatus === "external-link-only",
      ).length,
    },
  };
  issues.push(
    ...validateG2ManifestCountFloor(input.batchType, counts),
    ...validateG2ManifestComposition(input.manifestId, input.batchType, counts),
  );

  const supersedes = [...(input.supersedes ?? [])].sort(compareSupersedes);
  const auditById = new Map(
    rootAudit.candidates.map((candidate) => [candidate.candidateId, candidate]),
  );
  const verificationDigest = sha256Hex(input.verificationArtifactBytes);
  const rootAuditDigest = sha256Hex(input.rootAuditBytes);

  const entries: CandidateSourceManifestEntryV1[] = [];
  for (const row of selectedRows) {
    const audit = auditById.get(row.candidateId);
    if (audit === undefined) {
      issues.push(
        issue(
          "manifest-root-audit-reference",
          row.candidateId,
          "source-verified entry has no exact root-audit candidate",
        ),
      );
      continue;
    }
    const diagnosisSource1 = diagnosisSource(
      row.diagnosisSource1Type,
      row.diagnosisSource1Title,
      row.diagnosisSource1Publisher,
      row.diagnosisSource1IndependenceGroup,
      row.diagnosisSource1OriginReportId,
      row.diagnosisSource1Url,
      row.diagnosisSource1PublishedAt,
      row.diagnosisSource1AccessedAt,
    );
    const diagnosisSource2 = diagnosisSource(
      row.diagnosisSource2Type,
      row.diagnosisSource2Title,
      row.diagnosisSource2Publisher,
      row.diagnosisSource2IndependenceGroup,
      row.diagnosisSource2OriginReportId,
      row.diagnosisSource2Url,
      row.diagnosisSource2PublishedAt,
      row.diagnosisSource2AccessedAt,
    );
    if (diagnosisSource1 === null) {
      issues.push(
        issue(
          "manifest-diagnosis-source",
          row.candidateId,
          "source-verified entry requires diagnosis source 1",
        ),
      );
      continue;
    }
    const resultReferences = verification.results.flatMap((result, index) =>
      result.candidateId === row.candidateId ? [`/results/${index}`] : [],
    );
    const matchingSupersedes = supersedes.filter(
      (reference) => reference.candidateId === row.candidateId,
    );
    const isClassic = row.isClassic === true;
    const payload: Omit<CandidateSourceManifestEntryV1, "entryDigest"> = {
      supersedes:
        input.batchType === "correction" && matchingSupersedes.length === 1
          ? matchingSupersedes[0]!
          : null,
      sourceStatus: "source-verified",
      candidateId: row.candidateId,
      injuryCode: row.injuryCode,
      athleteDisplayName: row.athleteDisplayName,
      teamAtEvent: row.teamAtEvent,
      season: row.season,
      eventDate: row.eventDate,
      opponent: row.opponent,
      competition: row.competition,
      isClassic,
      classicReason: isClassic ? row.classicReason : null,
      classicProposedBy: isClassic
        ? {
            reviewedBy: decision.reviewedBy,
            reviewedAt: decision.reviewedAt,
            sourceReviewDecisionDigest: decisionDigest,
          }
        : null,
      video: {
        provider: row.videoProvider,
        contentType: "in-game-injury-event",
        canonicalUrl: row.videoCanonicalUrl,
        title: row.videoTitle,
        uploaderName: row.videoUploaderName,
        uploaderProvenance: row.videoUploaderProvenance,
        channelUrl: row.videoChannelUrl,
        publishedAt: row.videoPublishedAt,
        accessedAt: row.videoAccessedAt,
        embedStatus: row.embedStatus as CandidateManifestVideo["embedStatus"],
        embedCheckedAt: row.embedCheckedAt,
        captionStatus:
          row.captionStatus as CandidateManifestVideo["captionStatus"],
        captionCheckedAt: row.captionCheckedAt,
        provenanceBasis: row.videoProvenanceBasis,
        provenanceStatus: "verified",
        provenanceCheckedBy: row.provenanceCheckedBy,
        provenanceCheckedAt: row.provenanceCheckedAt,
      },
      eventBinding: {
        status: "passed",
        rootAuditReference: audit.auditReference,
        basis: audit.reason,
      },
      diagnosisClaim: row.diagnosisClaim,
      diagnosisSources: [diagnosisSource1, diagnosisSource2],
      eventSource: {
        title: row.eventSourceTitle,
        publisher: row.eventSourcePublisher,
        url: row.eventSourceUrl,
        publishedAt: row.eventSourcePublishedAt,
        accessedAt: row.eventSourceAccessedAt,
      },
      firstPartyAvailability: {
        status: audit.firstPartyAvailability.status,
        basis: audit.firstPartyAvailability.basis,
        checkedBy: audit.firstPartyAvailability.checkedBy,
        checkedAt: audit.firstPartyAvailability.checkedAt,
        auditReference: `${audit.auditReference}/firstPartyAvailability`,
        officialLocationsChecked:
          audit.firstPartyAvailability.officialLocationsChecked,
        archiveOrSearchChecks:
          audit.firstPartyAvailability.archiveOrSearchChecks,
      },
      sourceReviewDecision: {
        digest: decisionDigest,
        reviewedBy: decision.reviewedBy,
        reviewedAt: decision.reviewedAt,
      },
      verification: {
        artifactDigest: verificationDigest,
        rootAuditDigest,
        rootAuditReference: audit.auditReference,
        rootAuditStatus: "passed",
        resultReferences,
      },
    };
    entries.push({
      entryDigest: computeCandidateManifestEntryDigest(payload),
      ...payload,
    });
  }

  if (issues.length > 0) {
    throw new CandidateManifestBuildError(sortAndDedupeIssues(issues));
  }

  const manifest = normalizeJsonNfc<CandidateSourceManifestV1>({
    schemaVersion: 1,
    manifestId: input.manifestId,
    batchType: input.batchType,
    period: input.period,
    sourcePolicyVersion: input.sourcePolicyVersion,
    cutoffDate: input.cutoffDate,
    generatedAt: latestDeterministicTimestamp(
      selectedRows,
      verification,
      rootAudit,
    ),
    sourceReview: {
      status: "approved-for-authoring",
      manifestId: decision.manifestId,
      sourcePolicyJsonDigest: decision.sourcePolicyJsonDigest,
      sourcePolicyMarkdownDigest: decision.sourcePolicyMarkdownDigest,
      reviewedBy: decision.reviewedBy,
      reviewedAt: decision.reviewedAt,
      candidateSetDigest: decision.candidateSetDigest,
      classicProposalCandidateIds: [...decision.classicProposalCandidateIds],
    },
    sourceDigests: {
      aclCsvSha256: sha256Hex(input.csvBytes.acl),
      ankleSprainCsvSha256: sha256Hex(input.csvBytes["ankle-sprain"]),
      achillesRuptureCsvSha256: sha256Hex(input.csvBytes["achilles-rupture"]),
      verificationArtifactSha256: verificationDigest,
      rootAuditSha256: rootAuditDigest,
      sourcePolicyJsonSha256: policyJsonDigest,
      sourcePolicyMarkdownSha256: policyMarkdownDigest,
      sourceReviewDecisionSha256: decisionDigest,
    },
    counts,
    supersedes,
    entries,
  });
  const manifestIssues = validateCandidateManifest(manifest);
  if (manifestIssues.length > 0) {
    throw new CandidateManifestBuildError(manifestIssues);
  }
  return manifest;
}

function requireRecord(
  value: unknown,
  path: string,
  expectedKeys: readonly string[],
  issues: ValidationIssue[],
): Record<string, unknown> | null {
  if (!isRecord(value)) {
    issues.push(
      issue("manifest-schema", path, "value must be a plain JSON object"),
    );
    return null;
  }
  exactKeys(value, expectedKeys, path, issues);
  return value;
}

function requireStrings(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  for (const key of keys) {
    if (!nonEmptyString(value[key])) {
      issues.push(
        issue(
          "manifest-schema",
          `${path}.${key}`,
          `${key} must be a non-empty string`,
        ),
      );
    }
  }
}

function validateSupersedesReference(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): SourceManifestSupersedesReference | null {
  const record = requireRecord(value, path, SUPERSEDES_KEYS, issues);
  if (record === null) return null;
  requireStrings(record, ["manifestId", "candidateId"], path, issues);
  if (
    typeof record.entryDigest !== "string" ||
    !SHA256_RE.test(record.entryDigest)
  ) {
    issues.push(
      issue(
        "manifest-schema",
        `${path}.entryDigest`,
        "entryDigest must be a lowercase SHA-256",
      ),
    );
  }
  return record as unknown as SourceManifestSupersedesReference;
}

function validateDiagnosisSourceShape(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): CandidateManifestDiagnosisSource | null {
  const record = requireRecord(value, path, SOURCE_KEYS, issues);
  if (record === null) return null;
  requireStrings(
    record,
    ["type", "title", "publisher", "independenceGroup", "url"],
    path,
    issues,
  );
  if (
    record.type !== "diagnosis-first-party" &&
    record.type !== "diagnosis-secondary"
  ) {
    issues.push(
      issue("manifest-source", `${path}.type`, "invalid diagnosis source type"),
    );
  }
  if (
    record.originReportId !== null &&
    !nonEmptyString(record.originReportId)
  ) {
    issues.push(
      issue(
        "manifest-source",
        `${path}.originReportId`,
        "originReportId must be null or a non-empty string",
      ),
    );
  }
  if (!HTTPS_RE.test(String(record.url ?? ""))) {
    issues.push(
      issue("manifest-source", `${path}.url`, "source URL must use HTTPS"),
    );
  }
  for (const key of ["publishedAt", "accessedAt"] as const) {
    if (!isValidIsoDate(String(record[key] ?? ""))) {
      issues.push(
        issue(
          "manifest-source",
          `${path}.${key}`,
          `${key} must be an ISO date`,
        ),
      );
    }
  }
  return record as unknown as CandidateManifestDiagnosisSource;
}

function validateEventSourceShape(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): CandidateManifestEventSource | null {
  const record = requireRecord(value, path, EVENT_SOURCE_KEYS, issues);
  if (record === null) return null;
  requireStrings(record, ["title", "publisher", "url"], path, issues);
  if (!HTTPS_RE.test(String(record.url ?? ""))) {
    issues.push(
      issue("manifest-source", `${path}.url`, "event URL must use HTTPS"),
    );
  }
  for (const key of ["publishedAt", "accessedAt"] as const) {
    if (!isValidIsoDate(String(record[key] ?? ""))) {
      issues.push(
        issue(
          "manifest-source",
          `${path}.${key}`,
          `${key} must be an ISO date`,
        ),
      );
    }
  }
  return record as unknown as CandidateManifestEventSource;
}

function validateVideoShape(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): CandidateManifestVideo | null {
  const record = requireRecord(value, path, VIDEO_KEYS, issues);
  if (record === null) return null;
  requireStrings(
    record,
    [
      "provider",
      "contentType",
      "canonicalUrl",
      "title",
      "uploaderName",
      "uploaderProvenance",
      "channelUrl",
      "provenanceBasis",
      "provenanceCheckedBy",
    ],
    path,
    issues,
  );
  if (
    !CANDIDATE_VIDEO_PROVIDERS.includes(
      record.provider as CandidateVideoProvider,
    )
  ) {
    issues.push(
      issue("manifest-video", `${path}.provider`, "invalid video provider"),
    );
  }
  if (record.contentType !== "in-game-injury-event") {
    issues.push(
      issue(
        "manifest-video",
        `${path}.contentType`,
        "primary video must be the in-game injury event",
      ),
    );
  }
  if (
    !HTTPS_RE.test(String(record.canonicalUrl ?? "")) ||
    !HTTPS_RE.test(String(record.channelUrl ?? ""))
  ) {
    issues.push(
      issue(
        "manifest-video",
        path,
        "video and uploader channel URLs must use HTTPS",
      ),
    );
  }
  if (
    !VIDEO_UPLOADER_PROVENANCES.includes(
      record.uploaderProvenance as VideoUploaderProvenance,
    ) ||
    record.uploaderProvenance === "unknown" ||
    record.uploaderProvenance === "official-player"
  ) {
    issues.push(
      issue(
        "manifest-video",
        `${path}.uploaderProvenance`,
        "manifest video requires accepted league/team/rightsholder provenance",
      ),
    );
  }
  if (
    record.embedStatus !== "verified" &&
    record.embedStatus !== "external-link-only"
  ) {
    issues.push(
      issue(
        "manifest-video",
        `${path}.embedStatus`,
        "manifest video requires verified or external-link-only status",
      ),
    );
  }
  if (record.provider === "nba" && record.embedStatus === "verified") {
    issues.push(
      issue(
        "manifest-video",
        `${path}.embedStatus`,
        "NBA-hosted video is external-link-only under the frozen source policy",
      ),
    );
  }
  if (
    record.captionStatus !== "available" &&
    record.captionStatus !== "unavailable"
  ) {
    issues.push(
      issue(
        "manifest-video",
        `${path}.captionStatus`,
        "manifest video captions must have been checked",
      ),
    );
  }
  if (record.provenanceStatus !== "verified") {
    issues.push(
      issue(
        "manifest-video",
        `${path}.provenanceStatus`,
        "video provenance must be verified",
      ),
    );
  }
  for (const key of ["publishedAt", "accessedAt"] as const) {
    if (!isValidIsoDate(String(record[key] ?? ""))) {
      issues.push(
        issue("manifest-video", `${path}.${key}`, `${key} must be an ISO date`),
      );
    }
  }
  for (const key of [
    "embedCheckedAt",
    "captionCheckedAt",
    "provenanceCheckedAt",
  ] as const) {
    if (!isValidUtcTimestamp(String(record[key] ?? ""))) {
      issues.push(
        issue(
          "manifest-video",
          `${path}.${key}`,
          `${key} must be a UTC timestamp`,
        ),
      );
    }
  }
  return record as unknown as CandidateManifestVideo;
}

function validateFirstPartyShape(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): CandidateManifestFirstPartyAvailability | null {
  const record = requireRecord(value, path, FIRST_PARTY_KEYS, issues);
  if (record === null) return null;
  requireStrings(
    record,
    ["status", "checkedBy", "auditReference"],
    path,
    issues,
  );
  if (
    record.status !== "available" &&
    record.status !== "documented-unavailable" &&
    record.status !== "not-applicable"
  ) {
    issues.push(
      issue(
        "manifest-first-party",
        `${path}.status`,
        "invalid first-party availability status",
      ),
    );
  }
  if (record.basis !== null && !nonEmptyString(record.basis)) {
    issues.push(
      issue(
        "manifest-first-party",
        `${path}.basis`,
        "basis must be null or a non-empty string",
      ),
    );
  }
  if (
    record.status === "documented-unavailable"
      ? !nonEmptyString(record.basis)
      : record.basis !== null
  ) {
    issues.push(
      issue(
        "manifest-first-party",
        `${path}.basis`,
        "only documented-unavailable evidence carries a factual basis",
      ),
    );
  }
  if (!isValidUtcTimestamp(String(record.checkedAt ?? ""))) {
    issues.push(
      issue(
        "manifest-first-party",
        `${path}.checkedAt`,
        "first-party check requires a UTC timestamp",
      ),
    );
  }
  for (const [key, expectedKeys] of [
    ["officialLocationsChecked", LOCATION_CHECK_KEYS],
    ["archiveOrSearchChecks", ARCHIVE_CHECK_KEYS],
  ] as const) {
    const values = record[key];
    if (!Array.isArray(values)) {
      issues.push(
        issue(
          "manifest-first-party",
          `${path}.${key}`,
          `${key} must be an array`,
        ),
      );
      continue;
    }
    if (key === "officialLocationsChecked" && values.length === 0) {
      issues.push(
        issue(
          "manifest-first-party",
          `${path}.${key}`,
          "at least one official location check is required",
        ),
      );
    }
    if (
      key === "archiveOrSearchChecks" &&
      record.status === "documented-unavailable" &&
      values.length === 0
    ) {
      issues.push(
        issue(
          "manifest-first-party",
          `${path}.${key}`,
          "documented-unavailable evidence requires archive/search checks",
        ),
      );
    }
    values.forEach((entry, index) => {
      const entryPath = `${path}.${key}[${index}]`;
      const check = requireRecord(entry, entryPath, expectedKeys, issues);
      if (check === null) return;
      const name = key === "officialLocationsChecked" ? "url" : "queryOrUrl";
      requireStrings(check, [name, "outcome"], entryPath, issues);
      if (
        key === "officialLocationsChecked" &&
        !HTTPS_RE.test(String(check.url ?? ""))
      ) {
        issues.push(
          issue(
            "manifest-first-party",
            `${entryPath}.url`,
            "official location URL must use HTTPS",
          ),
        );
      }
      if (!isValidUtcTimestamp(String(check.observedAt ?? ""))) {
        issues.push(
          issue(
            "manifest-first-party",
            `${entryPath}.observedAt`,
            "observation time must be UTC",
          ),
        );
      }
    });
  }
  return record as unknown as CandidateManifestFirstPartyAvailability;
}

function validateEntryShape(
  value: unknown,
  index: number,
  issues: ValidationIssue[],
): CandidateSourceManifestEntryV1 | null {
  const path = `entries[${index}]`;
  const record = requireRecord(value, path, ENTRY_KEYS, issues);
  if (record === null) return null;
  requireStrings(
    record,
    [
      "entryDigest",
      "sourceStatus",
      "candidateId",
      "injuryCode",
      "athleteDisplayName",
      "teamAtEvent",
      "season",
      "eventDate",
      "opponent",
      "competition",
      "diagnosisClaim",
    ],
    path,
    issues,
  );
  if (
    typeof record.entryDigest !== "string" ||
    !SHA256_RE.test(record.entryDigest)
  ) {
    issues.push(
      issue(
        "manifest-entry-digest",
        `${path}.entryDigest`,
        "entryDigest must be a lowercase SHA-256",
      ),
    );
  }
  if (record.sourceStatus !== "source-verified") {
    issues.push(
      issue(
        "manifest-source-status",
        `${path}.sourceStatus`,
        "only source-verified entries may enter a manifest",
      ),
    );
  }
  if (
    !CANDIDATE_INJURY_CODES.includes(record.injuryCode as CandidateInjuryCode)
  ) {
    issues.push(
      issue("manifest-entry", `${path}.injuryCode`, "invalid injury code"),
    );
  }
  if (
    !CANDIDATE_COMPETITIONS.includes(record.competition as CandidateCompetition)
  ) {
    issues.push(
      issue("manifest-entry", `${path}.competition`, "invalid competition"),
    );
  }
  if (!isValidIsoDate(String(record.eventDate ?? ""))) {
    issues.push(
      issue(
        "manifest-entry",
        `${path}.eventDate`,
        "eventDate must be an ISO date",
      ),
    );
  }
  const seasonMatch = /^(\d{4})-(\d{2})$/u.exec(String(record.season ?? ""));
  if (seasonMatch === null) {
    issues.push(
      issue(
        "manifest-entry",
        `${path}.season`,
        "season must use YYYY-YY format",
      ),
    );
  } else if (isValidIsoDate(String(record.eventDate ?? ""))) {
    const startYear = Number(seasonMatch[1]);
    const endYear = startYear + 1;
    const expectedSuffix = String(endYear).slice(-2);
    const eventYear = Number(String(record.eventDate).slice(0, 4));
    if (
      seasonMatch[2] !== expectedSuffix ||
      (eventYear !== startYear && eventYear !== endYear)
    ) {
      issues.push(
        issue(
          "manifest-season",
          `${path}.season`,
          "season must contain the event year and use the next-year suffix",
        ),
      );
    }
  }
  if (typeof record.isClassic !== "boolean") {
    issues.push(
      issue("manifest-entry", `${path}.isClassic`, "isClassic must be boolean"),
    );
  }
  if (record.isClassic === true) {
    if (!nonEmptyString(record.classicReason)) {
      issues.push(
        issue(
          "manifest-classic",
          `${path}.classicReason`,
          "classic entry requires a teaching-value reason",
        ),
      );
    }
    const proposal = requireRecord(
      record.classicProposedBy,
      `${path}.classicProposedBy`,
      CLASSIC_PROPOSAL_KEYS,
      issues,
    );
    if (proposal !== null) {
      requireStrings(
        proposal,
        ["reviewedBy"],
        `${path}.classicProposedBy`,
        issues,
      );
      if (!isValidUtcTimestamp(String(proposal.reviewedAt ?? ""))) {
        issues.push(
          issue(
            "manifest-classic",
            `${path}.classicProposedBy.reviewedAt`,
            "classic proposal review time must be UTC",
          ),
        );
      }
      if (
        typeof proposal.sourceReviewDecisionDigest !== "string" ||
        !SHA256_RE.test(proposal.sourceReviewDecisionDigest)
      ) {
        issues.push(
          issue(
            "manifest-classic",
            `${path}.classicProposedBy.sourceReviewDecisionDigest`,
            "classic proposal must bind the source-review decision digest",
          ),
        );
      }
    }
  } else if (
    record.classicReason !== null ||
    record.classicProposedBy !== null
  ) {
    issues.push(
      issue(
        "manifest-classic",
        path,
        "non-classic entries require classicReason and classicProposedBy to be null",
      ),
    );
  }

  const video = validateVideoShape(record.video, `${path}.video`, issues);
  const eventBinding = requireRecord(
    record.eventBinding,
    `${path}.eventBinding`,
    EVENT_BINDING_KEYS,
    issues,
  );
  if (eventBinding !== null) {
    requireStrings(
      eventBinding,
      ["rootAuditReference", "basis"],
      `${path}.eventBinding`,
      issues,
    );
    if (eventBinding.status !== "passed") {
      issues.push(
        issue(
          "manifest-event-binding",
          `${path}.eventBinding.status`,
          "event/video identity requires a passing root audit",
        ),
      );
    }
  }
  const diagnosisValues = record.diagnosisSources;
  const diagnosisSources: [
    CandidateManifestDiagnosisSource | null,
    CandidateManifestDiagnosisSource | null,
  ] = [null, null];
  if (!Array.isArray(diagnosisValues) || diagnosisValues.length !== 2) {
    issues.push(
      issue(
        "manifest-schema",
        `${path}.diagnosisSources`,
        "diagnosisSources must be a two-slot array",
      ),
    );
  } else {
    diagnosisSources[0] = validateDiagnosisSourceShape(
      diagnosisValues[0],
      `${path}.diagnosisSources[0]`,
      issues,
    );
    diagnosisSources[1] =
      diagnosisValues[1] === null
        ? null
        : validateDiagnosisSourceShape(
            diagnosisValues[1],
            `${path}.diagnosisSources[1]`,
            issues,
          );
  }
  const eventSource = validateEventSourceShape(
    record.eventSource,
    `${path}.eventSource`,
    issues,
  );
  const firstParty = validateFirstPartyShape(
    record.firstPartyAvailability,
    `${path}.firstPartyAvailability`,
    issues,
  );
  const entryDecision = requireRecord(
    record.sourceReviewDecision,
    `${path}.sourceReviewDecision`,
    ENTRY_DECISION_KEYS,
    issues,
  );
  if (entryDecision !== null) {
    requireStrings(
      entryDecision,
      ["reviewedBy"],
      `${path}.sourceReviewDecision`,
      issues,
    );
    if (
      typeof entryDecision.digest !== "string" ||
      !SHA256_RE.test(entryDecision.digest)
    ) {
      issues.push(
        issue(
          "manifest-review",
          `${path}.sourceReviewDecision.digest`,
          "decision digest must be a lowercase SHA-256",
        ),
      );
    }
    if (!isValidUtcTimestamp(String(entryDecision.reviewedAt ?? ""))) {
      issues.push(
        issue(
          "manifest-review",
          `${path}.sourceReviewDecision.reviewedAt`,
          "review time must be UTC",
        ),
      );
    }
  }
  const verification = requireRecord(
    record.verification,
    `${path}.verification`,
    VERIFICATION_KEYS,
    issues,
  );
  if (verification !== null) {
    for (const key of ["artifactDigest", "rootAuditDigest"] as const) {
      if (
        typeof verification[key] !== "string" ||
        !SHA256_RE.test(verification[key])
      ) {
        issues.push(
          issue(
            "manifest-verification",
            `${path}.verification.${key}`,
            `${key} must be a lowercase SHA-256`,
          ),
        );
      }
    }
    requireStrings(
      verification,
      ["rootAuditReference"],
      `${path}.verification`,
      issues,
    );
    if (verification.rootAuditStatus !== "passed") {
      issues.push(
        issue(
          "manifest-verification",
          `${path}.verification.rootAuditStatus`,
          "manifest entry requires passing root audit status",
        ),
      );
    }
    if (
      !Array.isArray(verification.resultReferences) ||
      verification.resultReferences.length === 0 ||
      verification.resultReferences.some(
        (reference) =>
          typeof reference !== "string" || !/^\/results\/\d+$/u.test(reference),
      ) ||
      new Set(verification.resultReferences).size !==
        verification.resultReferences.length
    ) {
      issues.push(
        issue(
          "manifest-verification",
          `${path}.verification.resultReferences`,
          "verification result references must be non-empty unique /results/N pointers",
        ),
      );
    }
  }

  if (diagnosisSources[0] !== null && firstParty !== null) {
    const availableFirstParty = diagnosisSources.some(
      (source) => source?.type === "diagnosis-first-party",
    );
    if (availableFirstParty && firstParty.status !== "available") {
      issues.push(
        issue(
          "manifest-first-party",
          `${path}.firstPartyAvailability.status`,
          "first-party diagnosis source requires available status",
        ),
      );
    }
    if (!availableFirstParty) {
      const [first, second] = diagnosisSources;
      if (
        record.isClassic !== true ||
        firstParty.status !== "documented-unavailable" ||
        first?.type !== "diagnosis-secondary" ||
        second?.type !== "diagnosis-secondary" ||
        first.independenceGroup === second.independenceGroup ||
        (first.originReportId !== null &&
          second.originReportId !== null &&
          first.originReportId === second.originReportId)
      ) {
        issues.push(
          issue(
            "manifest-classic-evidence",
            `${path}.diagnosisSources`,
            "secondary-only diagnosis requires an approved classic with two independent sources and documented unavailable first-party evidence",
          ),
        );
      }
    }
  }

  if (
    video !== null &&
    eventSource !== null &&
    String(record.eventDate) > video.publishedAt
  ) {
    issues.push(
      issue(
        "manifest-video-date",
        `${path}.video.publishedAt`,
        "video publication cannot predate the event",
      ),
    );
  }
  if (
    video !== null &&
    isValidIsoDate(String(record.eventDate ?? "")) &&
    isValidIsoDate(video.publishedAt)
  ) {
    const eventMilliseconds = Date.parse(
      `${String(record.eventDate)}T00:00:00Z`,
    );
    const publicationMilliseconds = Date.parse(
      `${video.publishedAt}T00:00:00Z`,
    );
    const daysAfterEvent =
      (publicationMilliseconds - eventMilliseconds) / 86_400_000;
    if (daysAfterEvent > 3 && !video.title.includes(String(record.eventDate))) {
      issues.push(
        issue(
          "manifest-video-date",
          `${path}.video.publishedAt`,
          "video must be published within three days of the event or name the exact event date",
        ),
      );
    }
  }
  if (record.supersedes !== null) {
    validateSupersedesReference(
      record.supersedes,
      `${path}.supersedes`,
      issues,
    );
  }

  const candidate = record as unknown as CandidateSourceManifestEntryV1;
  try {
    if (
      typeof record.entryDigest === "string" &&
      computeCandidateManifestEntryDigest(candidate) !== record.entryDigest
    ) {
      issues.push(
        issue(
          "manifest-entry-digest",
          `${path}.entryDigest`,
          "entryDigest does not match the canonical entry payload",
        ),
      );
    }
  } catch {
    issues.push(
      issue(
        "manifest-entry-digest",
        `${path}.entryDigest`,
        "entry payload cannot be canonically hashed",
      ),
    );
  }
  if (
    video === null ||
    eventBinding === null ||
    diagnosisSources[0] === null ||
    eventSource === null ||
    firstParty === null ||
    entryDecision === null ||
    verification === null ||
    typeof record.candidateId !== "string" ||
    typeof record.injuryCode !== "string" ||
    typeof record.athleteDisplayName !== "string" ||
    typeof record.eventDate !== "string" ||
    typeof record.opponent !== "string" ||
    typeof record.competition !== "string" ||
    typeof record.isClassic !== "boolean"
  ) {
    return null;
  }
  return candidate;
}

const FORBIDDEN_MANIFEST_KEYS = new Set([
  "medicalReview",
  "medicalApproval",
  "allowIndexing",
  "indexingAuthorization",
  "publicRights",
  "publicRelease",
  "professionalAnalysis",
  "mechanismClaim",
  "prognosis",
  "returnToPlayAdvice",
  "generalSummary",
]);

function scanCanonicalSafety(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  seen: WeakSet<object> = new WeakSet(),
): void {
  if (typeof value === "string") {
    if (value !== value.normalize("NFC")) {
      issues.push(
        issue(
          "manifest-nfc",
          path,
          "all manifest strings must be NFC-normalized",
        ),
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      issues.push(
        issue("manifest-schema", path, "cyclic values are forbidden"),
      );
      return;
    }
    seen.add(value);
    value.forEach((entry, index) =>
      scanCanonicalSafety(entry, `${path}[${index}]`, issues, seen),
    );
    seen.delete(value);
    return;
  }
  if (!isRecord(value)) return;
  if (seen.has(value)) {
    issues.push(issue("manifest-schema", path, "cyclic values are forbidden"));
    return;
  }
  seen.add(value);
  for (const [key, entry] of Object.entries(value)) {
    const keyPath = path === "" ? key : `${path}.${key}`;
    if (key !== key.normalize("NFC")) {
      issues.push(
        issue(
          "manifest-nfc",
          keyPath,
          "all manifest keys must be NFC-normalized",
        ),
      );
    }
    if (FORBIDDEN_MANIFEST_KEYS.has(key)) {
      issues.push(
        issue(
          "manifest-forbidden-field",
          keyPath,
          "manifest contains a medical/public/indexing field outside source curation scope",
        ),
      );
    }
    scanCanonicalSafety(entry, keyPath, issues, seen);
  }
  seen.delete(value);
}

/** Strict shape, digest, ordering, evidence, and batch-semantics validator. */
export function validateCandidateManifest(value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  scanCanonicalSafety(value, "", issues);
  const top = requireRecord(value, "", TOP_LEVEL_KEYS, issues);
  if (top === null) return sortAndDedupeIssues(issues);

  if (top.schemaVersion !== 1) {
    issues.push(
      issue("manifest-schema", "schemaVersion", "schemaVersion must equal 1"),
    );
  }
  if (!nonEmptyString(top.manifestId) || !MANIFEST_ID_RE.test(top.manifestId)) {
    issues.push(
      issue("manifest-header", "manifestId", "invalid immutable manifest ID"),
    );
  }
  if (
    !SOURCE_MANIFEST_BATCH_TYPES.includes(
      top.batchType as SourceManifestBatchType,
    )
  ) {
    issues.push(issue("manifest-header", "batchType", "invalid batch type"));
  }
  if (!nonEmptyString(top.sourcePolicyVersion)) {
    issues.push(
      issue(
        "manifest-header",
        "sourcePolicyVersion",
        "source policy version is required",
      ),
    );
  }
  if (!isValidIsoDate(String(top.cutoffDate ?? ""))) {
    issues.push(
      issue("manifest-header", "cutoffDate", "cutoffDate must be an ISO date"),
    );
  }
  if (!isValidUtcTimestamp(String(top.generatedAt ?? ""))) {
    issues.push(
      issue(
        "manifest-header",
        "generatedAt",
        "generatedAt must be a UTC timestamp",
      ),
    );
  }
  if (
    top.batchType === "quarterly"
      ? !QUARTER_PERIOD_RE.test(String(top.period ?? ""))
      : !isValidIsoDate(String(top.period ?? ""))
  ) {
    issues.push(
      issue(
        "manifest-period",
        "period",
        top.batchType === "quarterly"
          ? "quarterly period must be YYYY-qN"
          : "launch/correction period must be an ISO date",
      ),
    );
  }

  const sourceReview = requireRecord(
    top.sourceReview,
    "sourceReview",
    SOURCE_REVIEW_KEYS,
    issues,
  );
  if (sourceReview !== null) {
    requireStrings(
      sourceReview,
      ["manifestId", "reviewedBy"],
      "sourceReview",
      issues,
    );
    if (
      sourceReview.status !== "approved-for-authoring" ||
      sourceReview.manifestId !== top.manifestId
    ) {
      issues.push(
        issue(
          "manifest-review",
          "sourceReview",
          "source review must approve this exact manifest for authoring",
        ),
      );
    }
    for (const key of [
      "sourcePolicyJsonDigest",
      "sourcePolicyMarkdownDigest",
      "candidateSetDigest",
    ] as const) {
      if (
        typeof sourceReview[key] !== "string" ||
        !SHA256_RE.test(sourceReview[key])
      ) {
        issues.push(
          issue(
            "manifest-review",
            `sourceReview.${key}`,
            `${key} must be a lowercase SHA-256`,
          ),
        );
      }
    }
    if (!isValidUtcTimestamp(String(sourceReview.reviewedAt ?? ""))) {
      issues.push(
        issue(
          "manifest-review",
          "sourceReview.reviewedAt",
          "reviewedAt must be a UTC timestamp",
        ),
      );
    }
    if (
      !Array.isArray(sourceReview.classicProposalCandidateIds) ||
      sourceReview.classicProposalCandidateIds.some(
        (entry) => !nonEmptyString(entry),
      )
    ) {
      issues.push(
        issue(
          "manifest-review",
          "sourceReview.classicProposalCandidateIds",
          "classic proposal IDs must be non-empty strings",
        ),
      );
    } else {
      const sorted = [...sourceReview.classicProposalCandidateIds].sort(
        compareCodePoints,
      );
      if (
        new Set(sourceReview.classicProposalCandidateIds).size !==
          sourceReview.classicProposalCandidateIds.length ||
        canonicalJson(sorted) !==
          canonicalJson(sourceReview.classicProposalCandidateIds)
      ) {
        issues.push(
          issue(
            "manifest-review",
            "sourceReview.classicProposalCandidateIds",
            "classic proposal IDs must be sorted and unique",
          ),
        );
      }
    }
  }

  const sourceDigests = requireRecord(
    top.sourceDigests,
    "sourceDigests",
    SOURCE_DIGEST_KEYS,
    issues,
  );
  if (sourceDigests !== null) {
    for (const key of SOURCE_DIGEST_KEYS) {
      if (
        typeof sourceDigests[key] !== "string" ||
        !SHA256_RE.test(sourceDigests[key])
      ) {
        issues.push(
          issue(
            "manifest-source-digest",
            `sourceDigests.${key}`,
            `${key} must be a lowercase SHA-256`,
          ),
        );
      }
    }
    if (
      sourceReview !== null &&
      (sourceReview.sourcePolicyJsonDigest !==
        sourceDigests.sourcePolicyJsonSha256 ||
        sourceReview.sourcePolicyMarkdownDigest !==
          sourceDigests.sourcePolicyMarkdownSha256)
    ) {
      issues.push(
        issue(
          "manifest-review-policy",
          "sourceReview",
          "source-review policy digests must equal the bound source policy bytes",
        ),
      );
    }
  }

  const countsValue = requireRecord(top.counts, "counts", COUNTS_KEYS, issues);
  let counts: CandidateManifestCounts | null = null;
  if (countsValue !== null) {
    const byInjury = requireRecord(
      countsValue.byInjury,
      "counts.byInjury",
      CANDIDATE_INJURY_CODES,
      issues,
    );
    const byEmbed = requireRecord(
      countsValue.byEmbedStatus,
      "counts.byEmbedStatus",
      ["verified", "externalLinkOnly"],
      issues,
    );
    for (const [record, keys, path] of [
      [byInjury, CANDIDATE_INJURY_CODES, "counts.byInjury"],
      [
        byEmbed,
        ["verified", "externalLinkOnly"] as const,
        "counts.byEmbedStatus",
      ],
    ] as const) {
      if (record !== null) {
        for (const key of keys) {
          if (!integerAtLeastZero(record[key])) {
            issues.push(
              issue(
                "manifest-counts",
                `${path}.${key}`,
                "count must be a non-negative integer",
              ),
            );
          }
        }
      }
    }
    for (const key of ["total", "recent", "classic"] as const) {
      if (!integerAtLeastZero(countsValue[key])) {
        issues.push(
          issue(
            "manifest-counts",
            `counts.${key}`,
            "count must be a non-negative integer",
          ),
        );
      }
    }
    if (byInjury !== null && byEmbed !== null) {
      counts = countsValue as unknown as CandidateManifestCounts;
    }
  }

  const topSupersedes: SourceManifestSupersedesReference[] = [];
  if (!Array.isArray(top.supersedes)) {
    issues.push(
      issue("manifest-schema", "supersedes", "supersedes must be an array"),
    );
  } else {
    top.supersedes.forEach((entry, index) => {
      const parsed = validateSupersedesReference(
        entry,
        `supersedes[${index}]`,
        issues,
      );
      if (parsed !== null) topSupersedes.push(parsed);
      if (
        parsed !== null &&
        index > 0 &&
        compareSupersedes(topSupersedes[topSupersedes.length - 2]!, parsed) >= 0
      ) {
        issues.push(
          issue(
            "manifest-supersedes",
            `supersedes[${index}]`,
            "supersedes references must be strictly sorted and unique",
          ),
        );
      }
    });
  }

  const entries: CandidateSourceManifestEntryV1[] = [];
  if (!Array.isArray(top.entries)) {
    issues.push(
      issue("manifest-schema", "entries", "entries must be an array"),
    );
  } else {
    top.entries.forEach((entry, index) => {
      const parsed = validateEntryShape(entry, index, issues);
      if (parsed !== null) entries.push(parsed);
    });
  }

  if (top.manifestId === NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID) {
    if (
      top.batchType !== "launch" ||
      top.period !== NBA_LAUNCH_MANIFEST_PERIOD ||
      top.sourcePolicyVersion !== NBA_LAUNCH_SOURCE_POLICY_VERSION ||
      top.cutoffDate !== NBA_LAUNCH_CUTOFF_DATE
    ) {
      issues.push(
        issue(
          "manifest-frozen-header",
          "",
          "authorized NBA launch manifest header does not match frozen inputs",
        ),
      );
    }
    if (
      top.generatedAt !== NBA_LAUNCH_SOURCE_REVIEWED_AT ||
      sourceReview === null ||
      sourceReview.sourcePolicyJsonDigest !==
        NBA_LAUNCH_SOURCE_POLICY_JSON_DIGEST ||
      sourceReview.sourcePolicyMarkdownDigest !==
        NBA_LAUNCH_SOURCE_POLICY_MARKDOWN_DIGEST ||
      sourceReview.candidateSetDigest !== NBA_LAUNCH_CANDIDATE_SET_DIGEST ||
      sourceReview.reviewedBy !== NBA_LAUNCH_SOURCE_REVIEWED_BY ||
      sourceReview.reviewedAt !== NBA_LAUNCH_SOURCE_REVIEWED_AT ||
      !Array.isArray(sourceReview.classicProposalCandidateIds) ||
      sourceReview.classicProposalCandidateIds.length !== 0 ||
      sourceDigests === null ||
      sourceDigests.sourcePolicyJsonSha256 !==
        NBA_LAUNCH_SOURCE_POLICY_JSON_DIGEST ||
      sourceDigests.sourcePolicyMarkdownSha256 !==
        NBA_LAUNCH_SOURCE_POLICY_MARKDOWN_DIGEST ||
      sourceDigests.sourceReviewDecisionSha256 !==
        NBA_LAUNCH_SOURCE_REVIEW_DECISION_DIGEST
    ) {
      issues.push(
        issue(
          "manifest-frozen-input",
          "",
          "authorized NBA launch manifest does not match frozen nba-v2 review inputs",
        ),
      );
    }
  }

  if (top.batchType === "correction") {
    if (topSupersedes.length === 0) {
      issues.push(
        issue(
          "manifest-supersedes",
          "supersedes",
          "correction batch must supersede at least one prior entry",
        ),
      );
    }
  } else if (topSupersedes.length > 0) {
    issues.push(
      issue(
        "manifest-supersedes",
        "supersedes",
        `${String(top.batchType)} batches must not supersede prior entries`,
      ),
    );
  }

  const seenCandidateIds = new Set<string>();
  const seenEventIdentities = new Set<string>();
  const seenVideoUrls = new Set<string>();
  entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    if (index > 0 && compareEntries(entries[index - 1]!, entry) >= 0) {
      issues.push(
        issue(
          "manifest-entry-order",
          path,
          "entries must use stable injury/eventDate/candidateId order",
        ),
      );
    }
    const eventIdentity = canonicalJson([
      entry.athleteDisplayName.toLocaleLowerCase("en-US"),
      entry.eventDate,
      entry.opponent.toLocaleLowerCase("en-US"),
      entry.competition,
    ]);
    for (const [set, key, code, message] of [
      [
        seenCandidateIds,
        entry.candidateId,
        "manifest-duplicate-candidate",
        "candidate ID must be unique",
      ],
      [
        seenEventIdentities,
        eventIdentity,
        "manifest-duplicate-event",
        "event identity must be unique",
      ],
      [
        seenVideoUrls,
        entry.video.canonicalUrl,
        "manifest-duplicate-video",
        "canonical video URL must be unique",
      ],
    ] as const) {
      if (set.has(key)) issues.push(issue(code, path, message));
      set.add(key);
    }
    if (isValidIsoDate(String(top.cutoffDate ?? ""))) {
      const expectedClassic = entry.eventDate < String(top.cutoffDate);
      if (entry.isClassic !== expectedClassic) {
        issues.push(
          issue(
            "manifest-classic",
            `${path}.isClassic`,
            "classic flag must agree with the frozen cutoff date",
          ),
        );
      }
    }
    if (
      sourceReview !== null &&
      (entry.sourceReviewDecision.reviewedBy !== sourceReview.reviewedBy ||
        entry.sourceReviewDecision.reviewedAt !== sourceReview.reviewedAt)
    ) {
      issues.push(
        issue(
          "manifest-review",
          `${path}.sourceReviewDecision`,
          "entry reviewer identity/date must match top-level source review",
        ),
      );
    }
    if (
      sourceDigests !== null &&
      (entry.sourceReviewDecision.digest !==
        sourceDigests.sourceReviewDecisionSha256 ||
        entry.verification.artifactDigest !==
          sourceDigests.verificationArtifactSha256 ||
        entry.verification.rootAuditDigest !== sourceDigests.rootAuditSha256)
    ) {
      issues.push(
        issue(
          "manifest-entry-binding",
          path,
          "entry decision/verification/audit digests must match top-level source digests",
        ),
      );
    }
    if (
      entry.eventBinding.rootAuditReference !==
        entry.verification.rootAuditReference ||
      entry.firstPartyAvailability.auditReference !==
        `${entry.eventBinding.rootAuditReference}/firstPartyAvailability`
    ) {
      issues.push(
        issue(
          "manifest-root-audit-reference",
          path,
          "entry event, verification, and first-party references must resolve to one root audit candidate",
        ),
      );
    }
    if (entry.isClassic && entry.classicProposedBy !== null) {
      if (
        sourceReview !== null &&
        (entry.classicProposedBy.reviewedBy !== sourceReview.reviewedBy ||
          entry.classicProposedBy.reviewedAt !== sourceReview.reviewedAt)
      ) {
        issues.push(
          issue(
            "manifest-classic",
            `${path}.classicProposedBy`,
            "classic proposal identity/date must match the named source review",
          ),
        );
      }
      if (
        sourceDigests !== null &&
        entry.classicProposedBy.sourceReviewDecisionDigest !==
          sourceDigests.sourceReviewDecisionSha256
      ) {
        issues.push(
          issue(
            "manifest-classic",
            `${path}.classicProposedBy.sourceReviewDecisionDigest`,
            "classic proposal must bind the exact source-review decision bytes",
          ),
        );
      }
    }

    const expectedRef = topSupersedes.find(
      (reference) => reference.candidateId === entry.candidateId,
    );
    if (top.batchType === "correction") {
      if (
        expectedRef === undefined ||
        entry.supersedes === null ||
        canonicalJson(expectedRef) !== canonicalJson(entry.supersedes)
      ) {
        issues.push(
          issue(
            "manifest-correction-replacement",
            `${path}.supersedes`,
            "each correction entry requires exactly one matching batch supersedes reference",
          ),
        );
      }
    } else if (entry.supersedes !== null) {
      issues.push(
        issue(
          "manifest-supersedes",
          `${path}.supersedes`,
          "launch/quarterly entries cannot supersede prior entries",
        ),
      );
    }
  });
  if (top.batchType === "correction") {
    for (const reference of topSupersedes) {
      if (
        entries.filter(
          (entry) =>
            entry.candidateId === reference.candidateId &&
            entry.supersedes !== null &&
            canonicalJson(entry.supersedes) === canonicalJson(reference),
        ).length !== 1
      ) {
        issues.push(
          issue(
            "manifest-correction-replacement",
            "entries",
            `correction reference ${reference.candidateId} requires exactly one replacement entry`,
          ),
        );
      }
    }
  }

  if (counts !== null) {
    const measured: CandidateManifestCounts = {
      byInjury: {
        acl: entries.filter((entry) => entry.injuryCode === "acl").length,
        "ankle-sprain": entries.filter(
          (entry) => entry.injuryCode === "ankle-sprain",
        ).length,
        "achilles-rupture": entries.filter(
          (entry) => entry.injuryCode === "achilles-rupture",
        ).length,
      },
      total: entries.length,
      recent: entries.filter((entry) => !entry.isClassic).length,
      classic: entries.filter((entry) => entry.isClassic).length,
      byEmbedStatus: {
        verified: entries.filter(
          (entry) => entry.video.embedStatus === "verified",
        ).length,
        externalLinkOnly: entries.filter(
          (entry) => entry.video.embedStatus === "external-link-only",
        ).length,
      },
    };
    if (canonicalJson(counts) !== canonicalJson(measured)) {
      issues.push(
        issue(
          "manifest-counts",
          "counts",
          "declared counts do not equal the canonical manifest entries",
        ),
      );
    }
    if (
      SOURCE_MANIFEST_BATCH_TYPES.includes(
        top.batchType as SourceManifestBatchType,
      )
    ) {
      issues.push(
        ...validateG2ManifestCountFloor(
          top.batchType as SourceManifestBatchType,
          counts,
        ),
        ...validateG2ManifestComposition(
          String(top.manifestId ?? ""),
          top.batchType as SourceManifestBatchType,
          counts,
        ),
      );
    }
  }

  if (
    sourceReview !== null &&
    Array.isArray(sourceReview.classicProposalCandidateIds)
  ) {
    const measuredClassicIds = entries
      .filter((entry) => entry.isClassic)
      .map((entry) => entry.candidateId)
      .sort(compareCodePoints);
    if (
      canonicalJson(measuredClassicIds) !==
      canonicalJson(sourceReview.classicProposalCandidateIds)
    ) {
      issues.push(
        issue(
          "manifest-review-classic-set",
          "sourceReview.classicProposalCandidateIds",
          "classic proposal IDs must exactly equal classic manifest entries",
        ),
      );
    }
  }

  return sortAndDedupeIssues(issues);
}

export function isCandidateSourceManifest(
  value: unknown,
): value is CandidateSourceManifestV1 {
  return validateCandidateManifest(value).length === 0;
}

export interface ParsedCandidateManifestBytes {
  manifest: CandidateSourceManifestV1 | null;
  issues: ValidationIssue[];
}

/** Duplicate-key rejecting, canonical-bytes parser for registry/checker use. */
export function parseCandidateManifestBytes(
  bytes: string | Uint8Array,
): ParsedCandidateManifestBytes {
  const text =
    typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      manifest: null,
      issues: [
        issue(
          "manifest-bytes",
          "",
          error instanceof Error
            ? error.message
            : "manifest is not strict JSON",
        ),
      ],
    };
  }
  try {
    if (canonicalJson(parsed) !== text) {
      return {
        manifest: null,
        issues: [
          issue(
            "manifest-bytes",
            "",
            "manifest bytes must be exact compact canonical JSON",
          ),
        ],
      };
    }
  } catch (error) {
    return {
      manifest: null,
      issues: [
        issue(
          "manifest-bytes",
          "",
          error instanceof Error ? error.message : "manifest is not canonical",
        ),
      ],
    };
  }
  const issues = validateCandidateManifest(parsed);
  return issues.length === 0
    ? { manifest: parsed as CandidateSourceManifestV1, issues: [] }
    : { manifest: null, issues };
}
