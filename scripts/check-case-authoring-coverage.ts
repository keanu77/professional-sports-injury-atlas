/**
 * Read-only checker for the authorized NBA G3 authoring plan's immutable
 * launch-manifest projection. This checker deliberately validates planning
 * coverage only: case, overview, and update content files need not exist yet.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { z } from "astro/zod";

import {
  PROFESSIONAL_SUPPORT_PATHS,
  SLUG_RE,
  SOURCE_SUPPORT_COMPATIBILITY,
  sourceSchema,
  type CaseSource,
} from "../src/lib/contracts/case";
import {
  canonicalJson,
  issue,
  parseStrictJson,
  SHA256_RE,
  sha256Hex,
  type ValidationIssue,
} from "../src/lib/contracts/canonical";
import {
  type SourceManifestRegistryEntry,
  type SourceManifestRegistryV1,
} from "../src/lib/contracts/source-manifest-registry";
import {
  parseCandidateManifestBytes,
  type CandidateSourceManifestEntryV1,
  type CandidateSourceManifestV1,
} from "../src/lib/research/candidate-manifest";
import {
  checkSourceManifestRegistry,
  SOURCE_MANIFEST_REGISTRY_PATH,
} from "./research/check-source-manifest-registry";

export const CASE_AUTHORING_PLAN_PATH =
  "docs/superpowers/plans/2026-08-08-nba-injury-case-authoring.md";
export const CASE_AUTHORING_COVERAGE_BEGIN =
  "<!-- BEGIN NBA_CASE_AUTHORING_COVERAGE_V1 -->";
export const CASE_AUTHORING_COVERAGE_END =
  "<!-- END NBA_CASE_AUTHORING_COVERAGE_V1 -->";

const EXPECTED_CASE_COUNT = 26;
const EXPECTED_OVERVIEW_COUNT = 3;
const TARGET_MANIFEST_ID = "NBA-SOURCE-2026-08-06-001";
const TARGET_MANIFEST_PATH =
  "research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json";
const TARGET_DECISION_PATH =
  "research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json";

const AUTHORIZED_CORRECTION_ENTRIES = [
  {
    manifestId: "NBA-SOURCE-2026-08-08-001",
    manifestPath: "research/source-manifests/NBA-SOURCE-2026-08-08-001.v1.json",
    manifestDigest:
      "4a25692e27115b6ec16818a64dd6e85778360e4f00e2b3f6a288b4ca5f0ed0bc",
    sourceReviewDecisionPath:
      "research/reviews/source-batches/NBA-SOURCE-2026-08-08-001-source-review-decision.v1.json",
    sourceReviewDecisionDigest:
      "dd08a891325f384621f61af9dd14084de579a9b5b86ce2cccecff893827d8464",
    sourcePolicyVersion: "nba-v2",
    batchType: "correction",
    period: "2026-08-08",
    createdAt: "2026-08-08T11:33:30Z",
    previousRegistryBytesDigest:
      "0e1b0279eabc5c0dccee52cf498242242acd3c38801056b4a213369bb4b3fc30",
    supersedes: [
      {
        manifestId: TARGET_MANIFEST_ID,
        candidateId: "CAND-NBA-ACHILLES-2019-005",
        entryDigest:
          "d718b475799a1ca3e38a1daeb7c8133ca4c8a93b710d37a315a943d19f4e3d21",
      },
      {
        manifestId: TARGET_MANIFEST_ID,
        candidateId: "CAND-NBA-ANKLE-2021-002",
        entryDigest:
          "0a89a3fef7d984f32fe7b8ef22b983b305f9c74a6f5bb6f83c1963e4fe115e11",
      },
      {
        manifestId: TARGET_MANIFEST_ID,
        candidateId: "CAND-NBA-ANKLE-2023-008",
        entryDigest:
          "cd2cfe1c8e310969f80f2b5379eb34345f113a9e8e43c1cb00f4f09f52481276",
      },
    ],
  },
  {
    manifestId: "NBA-SOURCE-2026-08-10-001",
    manifestPath: "research/source-manifests/NBA-SOURCE-2026-08-10-001.v1.json",
    manifestDigest:
      "bd1121d29e6ffda0122d920b6588e378dd2a1d011fa602689ccefa60c2bf86ff",
    sourceReviewDecisionPath:
      "research/reviews/source-batches/NBA-SOURCE-2026-08-10-001-source-review-decision.v1.json",
    sourceReviewDecisionDigest:
      "d5b934a3f450b4c3d93bdcd396dc032abe690bb11f1638095ad815e38d3c2ca7",
    sourcePolicyVersion: "nba-v2",
    batchType: "correction",
    period: "2026-08-10",
    createdAt: "2026-08-10T11:36:08Z",
    previousRegistryBytesDigest:
      "d34caee309f0f13d6403c9bcb3f85c781fd6ad4661cdfb54e881542683d65d32",
    supersedes: [
      {
        manifestId: TARGET_MANIFEST_ID,
        candidateId: "CAND-NBA-ACHILLES-2025-016",
        entryDigest:
          "d9b0468b2b683bed03141a48b8d839fd751d923eb49ca6a98afca713174bc171",
      },
      {
        manifestId: TARGET_MANIFEST_ID,
        candidateId: "CAND-NBA-ACHILLES-2025-017",
        entryDigest:
          "9341384e98fde6234074002d29eb97f0ca990f8899890ad4dcfecaf9f4ee0c56",
      },
      {
        manifestId: TARGET_MANIFEST_ID,
        candidateId: "CAND-NBA-ANKLE-2023-004",
        entryDigest:
          "41c20c51b043257c9a516c7197e000343e26328dea5a161f0083da3b21b3c0c9",
      },
      {
        manifestId: TARGET_MANIFEST_ID,
        candidateId: "CAND-NBA-ANKLE-2025-002",
        entryDigest:
          "5318b193e5a43baa31fc29c82c47d6ff392cc9e07c0badfde951e577b51f22a8",
      },
    ],
  },
] as const;

const EXPECTED_SOURCE_BINDING = {
  task5Commit: "e26d24c6288c73df8733f0aaf9e60177c778e965",
  manifestId: TARGET_MANIFEST_ID,
  manifestPath: TARGET_MANIFEST_PATH,
  manifestDigest:
    "8beedf3fcc0c7c498bf08ffb2fbc671759e7a61ed4e04f09afab579b6a86eb4d",
  sourceReviewDecisionPath: TARGET_DECISION_PATH,
  sourceReviewDecisionDigest:
    "cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c",
  sourcePolicyVersion: "nba-v2",
  registryPath: SOURCE_MANIFEST_REGISTRY_PATH,
  registryDigest:
    "0e1b0279eabc5c0dccee52cf498242242acd3c38801056b4a213369bb4b3fc30",
  previousRegistryBytesDigest:
    "eaf741c591ae9eb798b55a703ddadfeec7c803b91b3199272a7ccd39e56160c1",
  caseIdConvention: {
    acl: "CASE-NBAACL-<event year>-<candidate suffix>",
    "ankle-sprain": "CASE-NBAANKLE-<event year>-<candidate suffix>",
    "achilles-rupture": "CASE-NBAACHILLES-<event year>-<candidate suffix>",
  },
} as const;

const EXPECTED_REVIEW = {
  status: "in-review",
  reviewerName: null,
  reviewerQualification: null,
  reviewedAt: null,
  reviewedContentDigest: null,
} as const;

const EXPECTED_CASE_REVIEW_TARGET = {
  caseStatus: "medical-review",
  review: EXPECTED_REVIEW,
  publicRightsReview: {
    status: "not-requested",
    reviewedBy: null,
    reviewedAt: null,
    reviewedVideoDigest: null,
    policyVersion: null,
    termsCheckedAt: null,
    decisionBasis: null,
    notes: null,
    decisionPath: null,
    decisionDigest: null,
  },
} as const;

const EXPECTED_OVERVIEW_REVIEW_TARGET = {
  status: "medical-review",
  review: EXPECTED_REVIEW,
} as const;

const EXPECTED_BASELINE_REVIEW_TARGET = {
  status: "medical-review",
  publishedAt: null,
  review: EXPECTED_REVIEW,
} as const;

const EXPECTED_OVERVIEWS = [
  {
    injuryCode: "acl",
    taskId: "overview-acl",
    path: "src/content/injuries/acl.json",
  },
  {
    injuryCode: "ankle-sprain",
    taskId: "overview-ankle-sprain",
    path: "src/content/injuries/ankle-sprain.json",
  },
  {
    injuryCode: "achilles-rupture",
    taskId: "overview-achilles-rupture",
    path: "src/content/injuries/achilles-rupture.json",
  },
] as const;

const EXPECTED_BASELINE = {
  taskId: "baseline-update-2026-q3",
  id: "2026-q3",
  path: "src/content/updates/2026-q3.json",
  period: {
    year: 2026,
    quarter: 3,
    startDate: "2026-07-01",
    endDate: "2026-09-30",
  },
} as const;

const EXPECTED_BASELINE_EXECUTION_FRESHNESS = {
  latestAuthorizedStartDate: "2026-09-30",
  stopAction:
    "If authorized execution begins after 2026-09-30, stop; create, authorize, and bind a replacement current-quarter authoring plan before editing content.",
} as const;

const EXPECTED_VIDEO_MAPPING_BASIS = {
  title: "exact manifest.video.title",
  publisher: "exact manifest.video.uploaderName",
  independenceGroup:
    "deterministic lower-kebab of exact manifest.video.uploaderName",
  originReportId:
    "planned null because the frozen video record declares no originReportId",
  url: "exact manifest.video.canonicalUrl",
  publishedAt: "exact manifest.video.publishedAt",
  accessedAt: "exact manifest.video.accessedAt",
  supports: "contract-compatible planned assignment for video-original",
} as const;

const EXPECTED_DIAGNOSIS_MAPPING_BASIS = {
  title: "exact manifest diagnosis-source title",
  publisher: "exact manifest diagnosis-source publisher",
  independenceGroup: "exact manifest diagnosis-source independenceGroup",
  originReportId: "exact manifest diagnosis-source originReportId",
  url: "exact manifest diagnosis-source URL",
  publishedAt: "exact manifest diagnosis-source publishedAt",
  accessedAt: "exact manifest diagnosis-source accessedAt",
  supports: "contract-compatible planned assignment for diagnosis source type",
} as const;

const EXPECTED_EVENT_MAPPING_BASIS = {
  title: "exact manifest.eventSource.title",
  publisher: "exact manifest.eventSource.publisher",
  independenceGroup:
    "deterministic lower-kebab of exact manifest.eventSource.publisher",
  originReportId:
    "planned null because the frozen event source declares no originReportId",
  url: "exact manifest.eventSource.url",
  publishedAt: "exact manifest.eventSource.publishedAt",
  accessedAt: "exact manifest.eventSource.accessedAt",
  supports: "contract-compatible planned assignment for event-context",
} as const;

const nonEmpty = z.string().min(1);
const sha256Lower = z.string().regex(SHA256_RE);
const caseId = z.string().regex(/^CASE-[A-Z0-9]+-[0-9]{4}-[0-9]{3}$/u);
const slug = z.string().regex(SLUG_RE);

const sourceBindingSchema = z.strictObject({
  task5Commit: z.string().regex(/^[0-9a-f]{40}$/u),
  manifestId: nonEmpty,
  manifestPath: nonEmpty,
  manifestDigest: sha256Lower,
  sourceReviewDecisionPath: nonEmpty,
  sourceReviewDecisionDigest: sha256Lower,
  sourcePolicyVersion: nonEmpty,
  registryPath: nonEmpty,
  registryDigest: sha256Lower,
  previousRegistryBytesDigest: sha256Lower,
  caseIdConvention: z.strictObject({
    acl: nonEmpty,
    "ankle-sprain": nonEmpty,
    "achilles-rupture": nonEmpty,
  }),
});

const frozenIdentitySchema = z.strictObject({
  athleteDisplayName: nonEmpty,
  teamAtEvent: nonEmpty,
  opponent: nonEmpty,
  season: nonEmpty,
  eventDate: nonEmpty,
  competition: nonEmpty,
  isClassic: z.boolean(),
  classicReason: nonEmpty.nullable(),
  classicProposedBy: z.unknown().nullable(),
  sourceStatus: nonEmpty,
  supersedes: z.unknown().nullable(),
});

const mappedSourceBaseSchema = {
  plannedSourceId: nonEmpty,
  manifestRecord: z.unknown(),
  plannedCaseSource: sourceSchema,
} as const;

const mappingBasisSchema = z.strictObject({
  title: nonEmpty,
  publisher: nonEmpty,
  independenceGroup: nonEmpty,
  originReportId: nonEmpty,
  url: nonEmpty,
  publishedAt: nonEmpty,
  accessedAt: nonEmpty,
  supports: nonEmpty,
});

const videoMappingSchema = z.strictObject({
  ...mappedSourceBaseSchema,
  sourceType: z.literal("video-original"),
  mappingStatus: z.literal("planned-authoring-mapping-not-frozen-fact"),
  mappingBasis: mappingBasisSchema,
});

const diagnosisMappingSchema = z.strictObject({
  ...mappedSourceBaseSchema,
  sourceType: z.enum(["diagnosis-first-party", "diagnosis-secondary"]),
  manifestArrayIndex: z.number().int().min(0).max(1),
  mappingStatus: z.literal("planned-authoring-mapping-from-frozen-record"),
  mappingBasis: mappingBasisSchema,
});

const eventMappingSchema = z.strictObject({
  ...mappedSourceBaseSchema,
  sourceType: z.literal("event-context"),
  mappingStatus: z.literal("planned-authoring-mapping-not-frozen-fact"),
  mappingBasis: mappingBasisSchema,
});

const teachingMappingSchema = z.strictObject({
  mappingStatus: z.literal(
    "future-authorized-research-required-no-frozen-record",
  ),
  plannedSourceIdPrefix: nonEmpty,
  sourceType: z.literal("teaching-evidence"),
  allowedSupports: z.array(z.enum(PROFESSIONAL_SUPPORT_PATHS)),
  constraint: nonEmpty,
});

const plannedDurationSchema = z.strictObject({
  plannedValue: z.number().int().min(1).nullable(),
  requiredDerivation: nonEmpty,
  constraints: z.array(nonEmpty).min(1),
});

const plannedBoundSchema = z.strictObject({
  plannedValue: z.number().int().min(0).nullable(),
  requiredDerivation: nonEmpty,
  constraints: z.array(nonEmpty).min(1),
});

const plannedSegmentsSchema = z.strictObject({
  plannedValue: z
    .array(
      z.strictObject({
        startSeconds: z.number().int().min(0),
        endSeconds: z.number().int().min(0),
        observation: nonEmpty,
      }),
    )
    .nullable(),
  requiredDerivation: nonEmpty,
  constraints: z.array(nonEmpty).min(1),
});

const timecodeVerificationSchema = z.strictObject({
  taskId: nonEmpty,
  canonicalVideoUrl: nonEmpty,
  durationSeconds: plannedDurationSchema,
  startSeconds: plannedBoundSchema,
  endSeconds: plannedBoundSchema,
  orderedSegments: plannedSegmentsSchema,
  currentEmbedCheck: z.strictObject({
    taskId: nonEmpty,
    frozenStatus: z.enum(["verified", "external-link-only"]),
    frozenCheckedAt: nonEmpty,
    requiredAction: nonEmpty,
  }),
  currentCaptionCheck: z.strictObject({
    taskId: nonEmpty,
    frozenStatus: z.enum(["available", "unavailable"]),
    frozenCheckedAt: nonEmpty,
    requiredAction: nonEmpty,
  }),
  immutableG2Constraint: nonEmpty,
});

const coverageCaseSchema = z.strictObject({
  taskId: nonEmpty,
  candidateId: nonEmpty,
  caseId,
  slug,
  path: nonEmpty,
  entryDigest: sha256Lower,
  injuryCode: z.enum(["acl", "ankle-sprain", "achilles-rupture"]),
  frozenIdentity: frozenIdentitySchema,
  plannedSourceMappings: z.strictObject({
    videoOriginal: videoMappingSchema,
    diagnosis: z.array(diagnosisMappingSchema).min(1).max(2),
    eventContext: eventMappingSchema,
    teachingEvidenceIdPrefix: nonEmpty,
    teachingEvidence: teachingMappingSchema,
  }),
  frozenProvenance: z.unknown(),
  authoringSections: z.array(nonEmpty).min(1),
  timecodeVerification: timecodeVerificationSchema,
  testOrder: z.array(z.unknown()).min(1),
  reviewTarget: z.unknown(),
});

const overviewSchema = z.strictObject({
  injuryCode: z.enum(["acl", "ankle-sprain", "achilles-rupture"]),
  taskId: nonEmpty,
  path: nonEmpty,
  reviewTarget: z.unknown(),
});

const baselineSchema = z.strictObject({
  taskId: nonEmpty,
  id: nonEmpty,
  path: nonEmpty,
  period: z.strictObject({
    year: z.number().int(),
    quarter: z.number().int(),
    startDate: nonEmpty,
    endDate: nonEmpty,
  }),
  plannedAddedCaseIds: z.array(caseId),
  executionFreshness: z.strictObject({
    latestAuthorizedStartDate: nonEmpty,
    stopAction: nonEmpty,
  }),
  reviewTarget: z.unknown(),
});

const caseAuthoringCoverageSchema = z.strictObject({
  schemaVersion: z.literal(1),
  coverageType: z.literal("nba-case-authoring-plan"),
  sourceBinding: sourceBindingSchema,
  caseCount: z.number().int().min(0),
  cases: z.array(coverageCaseSchema),
  overviewCount: z.number().int().min(0),
  overviews: z.array(overviewSchema),
  baselineUpdate: baselineSchema,
});

export type CaseAuthoringCoverageV1 = z.infer<
  typeof caseAuthoringCoverageSchema
>;

export interface ParsedCaseAuthoringCoverage {
  coverage: CaseAuthoringCoverageV1 | null;
  issues: ValidationIssue[];
}

export interface CaseAuthoringCoverageCheckResult {
  planPath: string;
  coverage: CaseAuthoringCoverageV1 | null;
  manifest: CandidateSourceManifestV1 | null;
  issues: ValidationIssue[];
}

function countOccurrences(text: string, needle: string): number {
  let count = 0;
  let offset = 0;
  while (true) {
    const found = text.indexOf(needle, offset);
    if (found === -1) return count;
    count += 1;
    offset = found + needle.length;
  }
}

/** Extract only the single fenced JSON value between the plan's exact markers. */
export function extractCaseAuthoringCoverage(
  planText: string,
): ParsedCaseAuthoringCoverage {
  const beginCount = countOccurrences(planText, CASE_AUTHORING_COVERAGE_BEGIN);
  const endCount = countOccurrences(planText, CASE_AUTHORING_COVERAGE_END);
  if (beginCount !== 1 || endCount !== 1) {
    return {
      coverage: null,
      issues: [
        issue(
          "coverage-markers",
          CASE_AUTHORING_PLAN_PATH,
          `expected exactly one begin and one end marker; observed ${beginCount}/${endCount}`,
        ),
      ],
    };
  }

  const begin = planText.indexOf(CASE_AUTHORING_COVERAGE_BEGIN);
  const end = planText.indexOf(CASE_AUTHORING_COVERAGE_END);
  if (begin >= end) {
    return {
      coverage: null,
      issues: [
        issue(
          "coverage-markers",
          CASE_AUTHORING_PLAN_PATH,
          "coverage end marker must follow the begin marker",
        ),
      ],
    };
  }

  const marked = planText
    .slice(begin + CASE_AUTHORING_COVERAGE_BEGIN.length, end)
    .trim();
  const openFence = "```json\n";
  const closeFence = "\n```";
  if (!marked.startsWith(openFence) || !marked.endsWith(closeFence)) {
    return {
      coverage: null,
      issues: [
        issue(
          "coverage-fence",
          CASE_AUTHORING_PLAN_PATH,
          "marked content must contain only one JSON code fence",
        ),
      ],
    };
  }

  const jsonText = marked.slice(openFence.length, -closeFence.length);
  let parsed: unknown;
  try {
    parsed = parseStrictJson(jsonText);
  } catch (error) {
    return {
      coverage: null,
      issues: [
        issue(
          "coverage-json",
          CASE_AUTHORING_PLAN_PATH,
          error instanceof Error ? error.message : String(error),
        ),
      ],
    };
  }

  const shaped = caseAuthoringCoverageSchema.safeParse(parsed);
  if (!shaped.success) {
    return {
      coverage: null,
      issues: shaped.error.issues.map((entry) =>
        issue("coverage-schema", entry.path.join("."), entry.message),
      ),
    };
  }
  return { coverage: shaped.data, issues: [] };
}

function sameValue(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function addMismatch(
  issues: ValidationIssue[],
  code: string,
  path: string,
  message: string,
  actual: unknown,
  expected: unknown,
): void {
  if (!sameValue(actual, expected)) {
    issues.push(issue(code, path, message));
  }
}

function duplicateValues(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function validateUnique(
  issues: ValidationIssue[],
  label: string,
  values: readonly string[],
): void {
  for (const duplicate of duplicateValues(values)) {
    issues.push(
      issue(
        "coverage-duplicate",
        `cases.${label}`,
        `duplicate ${label} ${duplicate}`,
      ),
    );
  }
  if (new Set(values).size !== EXPECTED_CASE_COUNT) {
    issues.push(
      issue(
        "coverage-unique-count",
        `cases.${label}`,
        `${label} must contain exactly ${EXPECTED_CASE_COUNT} unique values`,
      ),
    );
  }
}

function lowerKebab(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}+/gu, "")
    .replace(/[\u2018\u2019']/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

function pickFrozenIdentity(
  entry: CandidateSourceManifestEntryV1,
): Record<string, unknown> {
  return {
    athleteDisplayName: entry.athleteDisplayName,
    teamAtEvent: entry.teamAtEvent,
    opponent: entry.opponent,
    season: entry.season,
    eventDate: entry.eventDate,
    competition: entry.competition,
    isClassic: entry.isClassic,
    classicReason: entry.classicReason,
    classicProposedBy: entry.classicProposedBy,
    sourceStatus: entry.sourceStatus,
    supersedes: entry.supersedes,
  };
}

function pickFrozenProvenance(
  entry: CandidateSourceManifestEntryV1,
): Record<string, unknown> {
  return {
    eventBinding: entry.eventBinding,
    firstPartyAvailability: entry.firstPartyAvailability,
    sourceReviewDecision: entry.sourceReviewDecision,
    verification: entry.verification,
  };
}

function expectedVideoSource(
  entry: CandidateSourceManifestEntryV1,
  id: string,
): CaseSource {
  return {
    id,
    type: "video-original",
    title: entry.video.title,
    publisher: entry.video.uploaderName,
    independenceGroup: lowerKebab(entry.video.uploaderName),
    originReportId: null,
    url: entry.video.canonicalUrl,
    publishedAt: entry.video.publishedAt,
    accessedAt: entry.video.accessedAt,
    supports: [...SOURCE_SUPPORT_COMPATIBILITY["video-original"]],
  };
}

function expectedDiagnosisSource(
  entry: CandidateSourceManifestEntryV1,
  index: number,
  id: string,
): CaseSource | null {
  const source = entry.diagnosisSources[index];
  if (source === null || source === undefined) return null;
  return {
    id,
    type: source.type,
    title: source.title,
    publisher: source.publisher,
    independenceGroup: source.independenceGroup,
    originReportId: source.originReportId,
    url: source.url,
    publishedAt: source.publishedAt,
    accessedAt: source.accessedAt,
    supports: [...SOURCE_SUPPORT_COMPATIBILITY[source.type]],
  };
}

function expectedEventSource(
  entry: CandidateSourceManifestEntryV1,
  id: string,
): CaseSource {
  return {
    id,
    type: "event-context",
    title: entry.eventSource.title,
    publisher: entry.eventSource.publisher,
    independenceGroup: lowerKebab(entry.eventSource.publisher),
    originReportId: null,
    url: entry.eventSource.url,
    publishedAt: entry.eventSource.publishedAt,
    accessedAt: entry.eventSource.accessedAt,
    supports: [...SOURCE_SUPPORT_COMPATIBILITY["event-context"]],
  };
}

function expectedTimecodeVerification(
  taskId: string,
  entry: CandidateSourceManifestEntryV1,
): z.infer<typeof timecodeVerificationSchema> {
  return {
    taskId: `${taskId}-timecode-verification`,
    canonicalVideoUrl: entry.video.canonicalUrl,
    durationSeconds: {
      plannedValue: null,
      requiredDerivation:
        "inspect the original-platform video during separately authorized authoring",
      constraints: [
        "integer >= 1",
        "must not be derived or fabricated from frozen manifest metadata",
      ],
    },
    startSeconds: {
      plannedValue: null,
      requiredDerivation:
        "select the bounded event start during the same authorized original-video inspection",
      constraints: [
        "integer >= 0",
        "must be < endSeconds",
        "must be <= durationSeconds",
      ],
    },
    endSeconds: {
      plannedValue: null,
      requiredDerivation:
        "select the bounded event end during the same authorized original-video inspection",
      constraints: [
        "integer >= 0",
        "must be > startSeconds",
        "must be <= durationSeconds",
      ],
    },
    orderedSegments: {
      plannedValue: null,
      requiredDerivation:
        "record ordered visible-only observations from the authorized original-video inspection",
      constraints: [
        "each segment startSeconds < endSeconds",
        "each segment lies within the selected video window and duration",
        "segments are ordered and non-overlapping",
        "observations do not diagnose or infer unwritten medical facts",
      ],
    },
    currentEmbedCheck: {
      taskId: `${taskId}-embed-current-check`,
      frozenStatus: entry.video.embedStatus,
      frozenCheckedAt: entry.video.embedCheckedAt,
      requiredAction:
        "recheck current original-platform behavior during authorized authoring and preserve contract fallback behavior without rewriting G2 artifacts",
    },
    currentCaptionCheck: {
      taskId: `${taskId}-caption-current-check`,
      frozenStatus: entry.video.captionStatus,
      frozenCheckedAt: entry.video.captionCheckedAt,
      requiredAction:
        "recheck the current original-platform caption control during authorized authoring; do not copy/store a transcript or rewrite G2 artifacts",
    },
    immutableG2Constraint:
      "Duration/window/segment and current behavior findings belong only to the future case record/tests; never modify the frozen manifest, verifier artifact, root audit, source-review decision, or registry.",
  };
}

function expectedCaseIdentity(candidateId: string): {
  caseId: string;
  injuryCode: "acl" | "ankle-sprain" | "achilles-rupture";
  year: string;
} | null {
  const match = /^CAND-NBA-(ACL|ANKLE|ACHILLES)-([0-9]{4})-([0-9]{3})$/u.exec(
    candidateId,
  );
  if (match === null) return null;
  const injury = match[1] as "ACL" | "ANKLE" | "ACHILLES";
  const values = {
    ACL: { caseToken: "NBAACL", injuryCode: "acl" },
    ANKLE: { caseToken: "NBAANKLE", injuryCode: "ankle-sprain" },
    ACHILLES: {
      caseToken: "NBAACHILLES",
      injuryCode: "achilles-rupture",
    },
  } as const;
  return {
    caseId: `CASE-${values[injury].caseToken}-${match[2]}-${match[3]}`,
    injuryCode: values[injury].injuryCode,
    year: match[2] as string,
  };
}

/**
 * Pure one-to-one validator. The registry and rich manifest must already have
 * passed their canonical artifact validators before this function is called.
 */
export function validateCaseAuthoringCoverage(
  coverage: CaseAuthoringCoverageV1,
  registry: SourceManifestRegistryV1,
  manifest: CandidateSourceManifestV1,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  addMismatch(
    issues,
    "coverage-source-binding",
    "sourceBinding",
    "source binding must equal the immutable Task 5 launch binding",
    coverage.sourceBinding,
    EXPECTED_SOURCE_BINDING,
  );

  const targetIndex = registry.entries.findIndex(
    (entry) => entry.manifestId === TARGET_MANIFEST_ID,
  );
  const target = registry.entries[targetIndex];
  if (targetIndex < 0 || target === undefined) {
    issues.push(
      issue(
        "coverage-registry-target",
        "sourceBinding.manifestId",
        `registered target ${TARGET_MANIFEST_ID} is missing`,
      ),
    );
    return issues;
  }

  const registryProjection = {
    manifestId: target.manifestId,
    manifestPath: target.manifestPath,
    manifestDigest: target.manifestDigest,
    sourceReviewDecisionPath: target.sourceReviewDecisionPath,
    sourceReviewDecisionDigest: target.sourceReviewDecisionDigest,
    sourcePolicyVersion: target.sourcePolicyVersion,
    previousRegistryBytesDigest: target.previousRegistryBytesDigest,
  };
  const coverageRegistryProjection = {
    manifestId: coverage.sourceBinding.manifestId,
    manifestPath: coverage.sourceBinding.manifestPath,
    manifestDigest: coverage.sourceBinding.manifestDigest,
    sourceReviewDecisionPath: coverage.sourceBinding.sourceReviewDecisionPath,
    sourceReviewDecisionDigest:
      coverage.sourceBinding.sourceReviewDecisionDigest,
    sourcePolicyVersion: coverage.sourceBinding.sourcePolicyVersion,
    previousRegistryBytesDigest:
      coverage.sourceBinding.previousRegistryBytesDigest,
  };
  addMismatch(
    issues,
    "coverage-registry-binding",
    "sourceBinding",
    "source binding does not match the registered launch entry",
    coverageRegistryProjection,
    registryProjection,
  );

  const prefixDigest = sha256Hex(
    canonicalJson({
      entries: registry.entries.slice(0, targetIndex + 1),
      schemaVersion: 1,
    }),
  );
  if (coverage.sourceBinding.registryDigest !== prefixDigest) {
    issues.push(
      issue(
        "coverage-registry-prefix-digest",
        "sourceBinding.registryDigest",
        `bound launch-registry prefix hashes to ${prefixDigest}`,
      ),
    );
  }

  const targetCandidates = new Set(
    manifest.entries.map((entry) => entry.candidateId),
  );
  for (const later of registry.entries.slice(targetIndex + 1)) {
    const isAuthorizedCorrection = AUTHORIZED_CORRECTION_ENTRIES.some(
      (authorized) => canonicalJson(later) === canonicalJson(authorized),
    );
    for (const reference of later.supersedes) {
      if (
        reference.manifestId === TARGET_MANIFEST_ID &&
        targetCandidates.has(reference.candidateId) &&
        !isAuthorizedCorrection
      ) {
        issues.push(
          issue(
            "coverage-superseded",
            `registry.${later.manifestId}.supersedes`,
            `${reference.candidateId} is superseded; this immutable plan requires explicit replacement authorization`,
          ),
        );
      }
    }
  }

  if (
    manifest.manifestId !== TARGET_MANIFEST_ID ||
    manifest.batchType !== "launch" ||
    manifest.period !== "2026-08-06" ||
    manifest.sourcePolicyVersion !== EXPECTED_SOURCE_BINDING.sourcePolicyVersion
  ) {
    issues.push(
      issue(
        "coverage-manifest-header",
        "sourceBinding",
        "resolved manifest header is not the immutable NBA launch batch",
      ),
    );
  }

  if (
    coverage.caseCount !== EXPECTED_CASE_COUNT ||
    coverage.cases.length !== EXPECTED_CASE_COUNT ||
    manifest.entries.length !== EXPECTED_CASE_COUNT
  ) {
    issues.push(
      issue(
        "coverage-case-count",
        "cases",
        `coverage, cases, and target manifest must each contain exactly ${EXPECTED_CASE_COUNT} entries`,
      ),
    );
  }

  for (const [label, values] of [
    ["candidateId", coverage.cases.map((entry) => entry.candidateId)],
    ["taskId", coverage.cases.map((entry) => entry.taskId)],
    ["caseId", coverage.cases.map((entry) => entry.caseId)],
    ["slug", coverage.cases.map((entry) => entry.slug)],
    ["path", coverage.cases.map((entry) => entry.path)],
  ] as const) {
    validateUnique(issues, label, values);
  }

  const coverageCandidateIds = coverage.cases.map((entry) => entry.candidateId);
  const manifestCandidateIds = manifest.entries.map(
    (entry) => entry.candidateId,
  );
  addMismatch(
    issues,
    "coverage-candidate-order",
    "cases.candidateId",
    "coverage candidates must preserve the exact target-manifest order",
    coverageCandidateIds,
    manifestCandidateIds,
  );
  const coverageCandidates = new Set(coverageCandidateIds);
  for (const candidateId of manifestCandidateIds) {
    if (!coverageCandidates.has(candidateId)) {
      issues.push(
        issue(
          "coverage-missing-candidate",
          "cases",
          `manifest candidate ${candidateId} is missing from coverage`,
        ),
      );
    }
  }
  const manifestCandidates = new Set(manifestCandidateIds);
  for (const candidateId of coverageCandidateIds) {
    if (!manifestCandidates.has(candidateId)) {
      issues.push(
        issue(
          "coverage-extra-candidate",
          "cases",
          `coverage candidate ${candidateId} is absent from the target manifest`,
        ),
      );
    }
  }

  const manifestByCandidate = new Map(
    manifest.entries.map((entry) => [entry.candidateId, entry]),
  );
  const taskCounters = new Map<string, number>();
  const plannedSourceIds: string[] = [];
  const teachingPrefixes: string[] = [];

  coverage.cases.forEach((planned, index) => {
    const entry = manifestByCandidate.get(planned.candidateId);
    if (entry === undefined) return;
    const path = `cases[${index}]`;

    if (planned.entryDigest !== entry.entryDigest) {
      issues.push(
        issue(
          "coverage-entry-digest",
          `${path}.entryDigest`,
          "planned entry digest does not match the rich manifest entry",
        ),
      );
    }
    addMismatch(
      issues,
      "coverage-frozen-identity",
      `${path}.frozenIdentity`,
      "frozen identity projection differs from the rich manifest",
      planned.frozenIdentity,
      pickFrozenIdentity(entry),
    );
    addMismatch(
      issues,
      "coverage-video-record",
      `${path}.plannedSourceMappings.videoOriginal.manifestRecord`,
      "video manifestRecord differs from the rich manifest",
      planned.plannedSourceMappings.videoOriginal.manifestRecord,
      entry.video,
    );

    const expectedDiagnosisRecords = entry.diagnosisSources.flatMap(
      (record, manifestArrayIndex) =>
        record === null ? [] : [{ manifestArrayIndex, manifestRecord: record }],
    );
    const plannedDiagnosisRecords = planned.plannedSourceMappings.diagnosis.map(
      (mapping) => ({
        manifestArrayIndex: mapping.manifestArrayIndex,
        manifestRecord: mapping.manifestRecord,
      }),
    );
    addMismatch(
      issues,
      "coverage-diagnosis-record",
      `${path}.plannedSourceMappings.diagnosis`,
      "diagnosis records or manifest indexes differ from the rich manifest",
      plannedDiagnosisRecords,
      expectedDiagnosisRecords,
    );
    addMismatch(
      issues,
      "coverage-event-record",
      `${path}.plannedSourceMappings.eventContext.manifestRecord`,
      "event manifestRecord differs from the rich manifest",
      planned.plannedSourceMappings.eventContext.manifestRecord,
      entry.eventSource,
    );
    addMismatch(
      issues,
      "coverage-frozen-provenance",
      `${path}.frozenProvenance`,
      "frozen provenance projection differs from the rich manifest",
      planned.frozenProvenance,
      pickFrozenProvenance(entry),
    );

    const identity = expectedCaseIdentity(planned.candidateId);
    if (identity === null) {
      issues.push(
        issue(
          "coverage-candidate-id",
          `${path}.candidateId`,
          "candidate ID does not follow the immutable NBA namespace",
        ),
      );
      return;
    }
    if (
      planned.caseId !== identity.caseId ||
      planned.injuryCode !== identity.injuryCode ||
      entry.injuryCode !== identity.injuryCode ||
      entry.eventDate.slice(0, 4) !== identity.year
    ) {
      issues.push(
        issue(
          "coverage-case-identity",
          path,
          "case ID, injury code, event year, and candidate suffix must agree",
        ),
      );
    }
    const expectedSlug = `${lowerKebab(entry.athleteDisplayName)}-${entry.injuryCode}-${identity.year}`;
    if (planned.slug !== expectedSlug) {
      issues.push(
        issue(
          "coverage-slug",
          `${path}.slug`,
          `slug must equal ${expectedSlug}`,
        ),
      );
    }
    if (planned.path !== `src/content/cases/${planned.slug}.json`) {
      issues.push(
        issue(
          "coverage-case-path",
          `${path}.path`,
          "case filename must equal the planned slug plus .json",
        ),
      );
    }

    const taskCount = (taskCounters.get(entry.injuryCode) ?? 0) + 1;
    taskCounters.set(entry.injuryCode, taskCount);
    const taskLabel =
      entry.injuryCode === "ankle-sprain"
        ? "ankle"
        : entry.injuryCode === "achilles-rupture"
          ? "achilles"
          : "acl";
    const expectedTaskId = `case-${taskLabel}-${String(taskCount).padStart(2, "0")}`;
    if (planned.taskId !== expectedTaskId) {
      issues.push(
        issue(
          "coverage-task-id",
          `${path}.taskId`,
          `task ID must equal ${expectedTaskId}`,
        ),
      );
    }
    addMismatch(
      issues,
      "coverage-timecode-verification",
      `${path}.timecodeVerification`,
      "timecode verification must equal the deterministic task and frozen-video projection",
      planned.timecodeVerification,
      expectedTimecodeVerification(expectedTaskId, entry),
    );

    const sourcePrefix = `${planned.candidateId.toLowerCase().replace(/^cand-/u, "src-")}-`;
    const videoId = `${sourcePrefix}video`;
    const eventId = `${sourcePrefix}event`;
    const teachingPrefix = `${sourcePrefix}teaching-`;
    plannedSourceIds.push(videoId, eventId);
    teachingPrefixes.push(teachingPrefix);

    const videoMapping = planned.plannedSourceMappings.videoOriginal;
    addMismatch(
      issues,
      "coverage-source-mapping",
      `${path}.plannedSourceMappings.videoOriginal`,
      "video source type or mapping basis differs from the deterministic projection",
      {
        sourceType: videoMapping.sourceType,
        mappingBasis: videoMapping.mappingBasis,
      },
      {
        sourceType: "video-original",
        mappingBasis: EXPECTED_VIDEO_MAPPING_BASIS,
      },
    );
    if (videoMapping.plannedSourceId !== videoId) {
      issues.push(
        issue(
          "coverage-source-id",
          `${path}.plannedSourceMappings.videoOriginal.plannedSourceId`,
          `video source ID must equal ${videoId}`,
        ),
      );
    }
    addMismatch(
      issues,
      "coverage-planned-source",
      `${path}.plannedSourceMappings.videoOriginal.plannedCaseSource`,
      "planned video source is not the deterministic manifest projection",
      videoMapping.plannedCaseSource,
      expectedVideoSource(entry, videoId),
    );

    planned.plannedSourceMappings.diagnosis.forEach((mapping) => {
      const diagnosisId = `${sourcePrefix}diagnosis-${String(mapping.manifestArrayIndex + 1).padStart(2, "0")}`;
      plannedSourceIds.push(diagnosisId);
      if (mapping.plannedSourceId !== diagnosisId) {
        issues.push(
          issue(
            "coverage-source-id",
            `${path}.plannedSourceMappings.diagnosis`,
            `diagnosis source ID must equal ${diagnosisId}`,
          ),
        );
      }
      const expected = expectedDiagnosisSource(
        entry,
        mapping.manifestArrayIndex,
        diagnosisId,
      );
      const manifestDiagnosis =
        entry.diagnosisSources[mapping.manifestArrayIndex];
      if (
        manifestDiagnosis === null ||
        manifestDiagnosis === undefined ||
        mapping.sourceType !== manifestDiagnosis.type ||
        !sameValue(mapping.mappingBasis, EXPECTED_DIAGNOSIS_MAPPING_BASIS)
      ) {
        issues.push(
          issue(
            "coverage-source-mapping",
            `${path}.plannedSourceMappings.diagnosis`,
            "diagnosis source type or mapping basis differs from the indexed manifest source",
          ),
        );
      }
      if (expected === null) {
        issues.push(
          issue(
            "coverage-diagnosis-record",
            `${path}.plannedSourceMappings.diagnosis`,
            "diagnosis mapping points to a null or absent manifest record",
          ),
        );
      } else {
        addMismatch(
          issues,
          "coverage-planned-source",
          `${path}.plannedSourceMappings.diagnosis.plannedCaseSource`,
          "planned diagnosis source is not the deterministic manifest projection",
          mapping.plannedCaseSource,
          expected,
        );
      }
    });

    const eventMapping = planned.plannedSourceMappings.eventContext;
    addMismatch(
      issues,
      "coverage-source-mapping",
      `${path}.plannedSourceMappings.eventContext`,
      "event source type or mapping basis differs from the deterministic projection",
      {
        sourceType: eventMapping.sourceType,
        mappingBasis: eventMapping.mappingBasis,
      },
      {
        sourceType: "event-context",
        mappingBasis: EXPECTED_EVENT_MAPPING_BASIS,
      },
    );
    if (eventMapping.plannedSourceId !== eventId) {
      issues.push(
        issue(
          "coverage-source-id",
          `${path}.plannedSourceMappings.eventContext.plannedSourceId`,
          `event source ID must equal ${eventId}`,
        ),
      );
    }
    addMismatch(
      issues,
      "coverage-planned-source",
      `${path}.plannedSourceMappings.eventContext.plannedCaseSource`,
      "planned event source is not the deterministic manifest projection",
      eventMapping.plannedCaseSource,
      expectedEventSource(entry, eventId),
    );

    if (
      planned.plannedSourceMappings.teachingEvidenceIdPrefix !==
        teachingPrefix ||
      planned.plannedSourceMappings.teachingEvidence.plannedSourceIdPrefix !==
        teachingPrefix ||
      !sameValue(
        planned.plannedSourceMappings.teachingEvidence.allowedSupports,
        PROFESSIONAL_SUPPORT_PATHS,
      )
    ) {
      issues.push(
        issue(
          "coverage-teaching-source",
          `${path}.plannedSourceMappings.teachingEvidence`,
          "teaching source prefix/supports do not match the deterministic plan",
        ),
      );
    }

    addMismatch(
      issues,
      "coverage-review-target",
      `${path}.reviewTarget`,
      "case review target must remain unapproved and unnamed",
      planned.reviewTarget,
      EXPECTED_CASE_REVIEW_TARGET,
    );
  });

  for (const duplicate of duplicateValues(plannedSourceIds)) {
    issues.push(
      issue(
        "coverage-duplicate-source-id",
        "cases.plannedSourceMappings",
        `planned source ID ${duplicate} is not globally unique`,
      ),
    );
  }
  for (const duplicate of duplicateValues(teachingPrefixes)) {
    issues.push(
      issue(
        "coverage-duplicate-source-id",
        "cases.plannedSourceMappings.teachingEvidenceIdPrefix",
        `teaching source prefix ${duplicate} is not globally unique`,
      ),
    );
  }

  if (
    coverage.overviewCount !== EXPECTED_OVERVIEW_COUNT ||
    coverage.overviews.length !== EXPECTED_OVERVIEW_COUNT
  ) {
    issues.push(
      issue(
        "coverage-overview-count",
        "overviews",
        `coverage must contain exactly ${EXPECTED_OVERVIEW_COUNT} overviews`,
      ),
    );
  }
  addMismatch(
    issues,
    "coverage-overviews",
    "overviews",
    "overview injury/task/path mapping must equal the frozen three-entry list",
    coverage.overviews.map(({ injuryCode, taskId, path }) => ({
      injuryCode,
      taskId,
      path,
    })),
    EXPECTED_OVERVIEWS,
  );
  coverage.overviews.forEach((overview, index) => {
    addMismatch(
      issues,
      "coverage-review-target",
      `overviews[${index}].reviewTarget`,
      "overview review target must remain unapproved and unnamed",
      overview.reviewTarget,
      EXPECTED_OVERVIEW_REVIEW_TARGET,
    );
  });

  const baseline = coverage.baselineUpdate;
  addMismatch(
    issues,
    "coverage-baseline",
    "baselineUpdate",
    "baseline identity, path, or period differs from the frozen Q3 target",
    {
      taskId: baseline.taskId,
      id: baseline.id,
      path: baseline.path,
      period: baseline.period,
    },
    EXPECTED_BASELINE,
  );
  addMismatch(
    issues,
    "coverage-baseline-cases",
    "baselineUpdate.plannedAddedCaseIds",
    "baseline case IDs must equal all 26 planned case IDs in plan order",
    baseline.plannedAddedCaseIds,
    coverage.cases.map((entry) => entry.caseId),
  );
  addMismatch(
    issues,
    "coverage-baseline-freshness",
    "baselineUpdate.executionFreshness",
    "Q3 authoring date and stop action must remain exactly frozen",
    baseline.executionFreshness,
    EXPECTED_BASELINE_EXECUTION_FRESHNESS,
  );
  addMismatch(
    issues,
    "coverage-review-target",
    "baselineUpdate.reviewTarget",
    "baseline review target must remain unpublished, unapproved, and unnamed",
    baseline.reviewTarget,
    EXPECTED_BASELINE_REVIEW_TARGET,
  );

  return issues;
}

function missingFileIssue(path: string, error: unknown): ValidationIssue {
  return issue(
    "coverage-artifact-missing",
    path,
    error instanceof Error ? error.message : String(error),
  );
}

/** Load and validate the real plan and its exact registered launch artifacts. */
export function checkCaseAuthoringCoverage(
  root: string = process.cwd(),
): CaseAuthoringCoverageCheckResult {
  const planPath = CASE_AUTHORING_PLAN_PATH;
  let planText: string;
  try {
    planText = readFileSync(join(root, planPath), "utf8");
  } catch (error) {
    return {
      planPath,
      coverage: null,
      manifest: null,
      issues: [missingFileIssue(planPath, error)],
    };
  }

  const extracted = extractCaseAuthoringCoverage(planText);
  if (extracted.coverage === null) {
    return {
      planPath,
      coverage: null,
      manifest: null,
      issues: extracted.issues,
    };
  }
  const coverage = extracted.coverage;
  const issues = [...extracted.issues];

  const registryResult = checkSourceManifestRegistry(root);
  issues.push(...registryResult.issues);
  const registry = registryResult.registry;
  if (registry === null) {
    return { planPath, coverage, manifest: null, issues };
  }

  const targetEntries = registry.entries.filter(
    (entry) => entry.manifestId === TARGET_MANIFEST_ID,
  );
  if (targetEntries.length !== 1) {
    issues.push(
      issue(
        "coverage-registry-target",
        TARGET_MANIFEST_ID,
        `expected exactly one registered target entry; observed ${targetEntries.length}`,
      ),
    );
    return { planPath, coverage, manifest: null, issues };
  }
  const target = targetEntries[0] as SourceManifestRegistryEntry;

  let manifestBytes: Buffer;
  try {
    manifestBytes = readFileSync(join(root, TARGET_MANIFEST_PATH));
  } catch (error) {
    issues.push(missingFileIssue(TARGET_MANIFEST_PATH, error));
    return { planPath, coverage, manifest: null, issues };
  }
  if (
    sha256Hex(manifestBytes) !== target.manifestDigest ||
    sha256Hex(manifestBytes) !== coverage.sourceBinding.manifestDigest
  ) {
    issues.push(
      issue(
        "coverage-manifest-digest",
        TARGET_MANIFEST_PATH,
        "manifest bytes do not match both registry and plan digests",
      ),
    );
  }

  let decisionBytes: Buffer;
  try {
    decisionBytes = readFileSync(join(root, TARGET_DECISION_PATH));
  } catch (error) {
    issues.push(missingFileIssue(TARGET_DECISION_PATH, error));
    return { planPath, coverage, manifest: null, issues };
  }
  if (
    sha256Hex(decisionBytes) !== target.sourceReviewDecisionDigest ||
    sha256Hex(decisionBytes) !==
      coverage.sourceBinding.sourceReviewDecisionDigest
  ) {
    issues.push(
      issue(
        "coverage-decision-digest",
        TARGET_DECISION_PATH,
        "source-review decision bytes do not match both registry and plan digests",
      ),
    );
  }

  const parsedManifest = parseCandidateManifestBytes(manifestBytes);
  if (parsedManifest.manifest === null) {
    issues.push(
      ...parsedManifest.issues.map((entry) => ({
        ...entry,
        code: "coverage-manifest-parse",
        path:
          entry.path === ""
            ? TARGET_MANIFEST_PATH
            : `${TARGET_MANIFEST_PATH}.${entry.path}`,
      })),
    );
    return { planPath, coverage, manifest: null, issues };
  }

  issues.push(
    ...validateCaseAuthoringCoverage(
      coverage,
      registry,
      parsedManifest.manifest,
    ),
  );
  return {
    planPath,
    coverage,
    manifest: parsedManifest.manifest,
    issues,
  };
}

export function runCaseAuthoringCoverageCli(
  root: string = process.cwd(),
): number {
  const result = checkCaseAuthoringCoverage(root);
  if (result.issues.length > 0 || result.coverage === null) {
    for (const entry of result.issues) {
      console.error(`[${entry.code}] ${entry.path} ${entry.message}`);
    }
    console.error(
      `case-authoring-coverage FAILED with ${result.issues.length} issue(s)`,
    );
    return 1;
  }
  console.log(
    `case-authoring-coverage OK cases=${result.coverage.cases.length} ` +
      `overviews=${result.coverage.overviews.length} ` +
      `baseline=${result.coverage.baselineUpdate.id} ` +
      `manifest=${result.coverage.sourceBinding.manifestId}`,
  );
  return 0;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runCaseAuthoringCoverageCli());
}
