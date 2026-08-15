/**
 * Decision 18's append-only exhaustive follow-up research contract.
 *
 * This schema deliberately records research evidence rather than trusting a
 * stored `exhausted` flag.  The replay validator in
 * `follow-up-research-v2-validation.ts` derives every cumulative fact set and
 * terminal state from these strict records.
 */

import { z } from "astro/zod";
import { CASE_ID_RE, HTTPS_URL_RE, SHA256_LOWER_RE, SLUG_RE } from "./case";
import {
  FOLLOW_UP_KINDS,
  followUpResearchFactSchema,
  followUpSourcePolicyBindingSchema,
} from "./case-follow-up";
import {
  DECISION_18_AUTHORIZATION_SHA256,
  DECISION_18_PLAN_SHA256,
} from "./decision-18-regression-contract";
import {
  CanonicalJsonError,
  UTC_TIMESTAMP_RE,
  canonicalJson,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "./canonical";

export const FOLLOW_UP_RESEARCH_V2_SCHEMA_VERSION =
  "case-follow-up-research.v2" as const;

export const DECISION_18_EXECUTION_ROLE =
  "decision-18-professional-notes-and-exhaustive-followups" as const;
export const DECISION_18_EXECUTION_SCOPE_ID =
  "decision-18-professional-notes-and-exhaustive-followups-only" as const;
export const DECISION_18_PLAN_PATH =
  "docs/superpowers/plans/2026-08-15-decision-18-professional-notes-and-exhaustive-followups.md" as const;
export const DECISION_18_AUTHORIZATION_PATH =
  "docs/decisions/2026-08-15-decision-18-professional-notes-and-exhaustive-followups-authorization.v1.json" as const;

export const RESEARCH_V2_SOURCE_CHANNELS = [
  "team-official-site-newsroom",
  "nba-official-news-announcements",
  "nba-official-injury-reports",
  "nba-official-game-participation",
  "press-conference-formal-statement",
  "named-mainstream-original-page",
] as const;
export type ResearchV2SourceChannel =
  (typeof RESEARCH_V2_SOURCE_CHANNELS)[number];

export const RESEARCH_V2_TIMEPOINTS = [
  "injury-time",
  "operation-announcement",
  "rehabilitation-progression",
  "actual-return",
] as const;
export type ResearchV2Timepoint = (typeof RESEARCH_V2_TIMEPOINTS)[number];

export const RESEARCH_V2_TERM_CONCEPTS = {
  treatment: [
    "treatment",
    "rehab",
    "recovery",
    "program",
    "management",
    "cleared",
    "progression",
  ],
  surgery: [
    "surgery",
    "procedure",
    "operated",
    "underwent",
    "repair",
    "reconstruction",
    "surgeon-name-branch",
  ],
  injection: [
    "injection",
    "shot",
    "prp",
    "platelet-rich-plasma",
    "cortisone",
    "corticosteroid",
    "needling",
  ],
  "actual-return": [
    "return",
    "returned",
    "debut",
    "first-game-back",
    "activated",
    "cleared-to-play",
  ],
} as const;

export type ResearchV2TermConcept =
  (typeof RESEARCH_V2_TERM_CONCEPTS)[keyof typeof RESEARCH_V2_TERM_CONCEPTS][number];

export const RESEARCH_V2_ALL_TERM_CONCEPTS = [
  ...RESEARCH_V2_TERM_CONCEPTS.treatment,
  ...RESEARCH_V2_TERM_CONCEPTS.surgery,
  ...RESEARCH_V2_TERM_CONCEPTS.injection,
  ...RESEARCH_V2_TERM_CONCEPTS["actual-return"],
] as const;

export const RESEARCH_V2_QUERY_RESULT_CODES = [
  "retained-new",
  "retained-existing",
  "corroboration",
  "retained-changed",
  "rejected-with-reason",
  "no-candidate",
  "unresolved-access",
  "not-applicable",
] as const;
export type ResearchV2QueryResultCode =
  (typeof RESEARCH_V2_QUERY_RESULT_CODES)[number];

export const RESEARCH_V2_VERIFICATION_CHANNELS = [
  "web-open-original-page",
  "browser-open-original-page",
  "direct-open-original-page",
  "documented-not-applicable",
] as const;

export const RESEARCH_V2_TOOL_CHANNELS = [
  "web-search",
  "browser",
  "direct-http",
  "manual-original-page",
] as const;

const trimmedNonEmpty = z
  .string()
  .min(1)
  .refine((value) => value === value.trim(), {
    message: "must be trimmed and non-empty",
  });
const lowerKebab = z.string().regex(SLUG_RE);
const sha256Lower = z.string().regex(SHA256_LOWER_RE);
const httpsUrl = z.string().regex(HTTPS_URL_RE);
const utcTimestamp = z.string().regex(UTC_TIMESTAMP_RE);

export const followUpResearchV2AuthorityBindingSchema = z.strictObject({
  executionRole: z.literal(DECISION_18_EXECUTION_ROLE),
  executionScopeId: z.literal(DECISION_18_EXECUTION_SCOPE_ID),
  planPath: z.literal(DECISION_18_PLAN_PATH),
  planSha256: z.literal(DECISION_18_PLAN_SHA256),
  authorizationPath: z.literal(DECISION_18_AUTHORIZATION_PATH),
  authorizationSha256: z.literal(DECISION_18_AUTHORIZATION_SHA256),
});
export type FollowUpResearchV2AuthorityBinding = z.infer<
  typeof followUpResearchV2AuthorityBindingSchema
>;

export const FOLLOW_UP_RESEARCH_V2_AUTHORITY_BINDING = Object.freeze({
  executionRole: DECISION_18_EXECUTION_ROLE,
  executionScopeId: DECISION_18_EXECUTION_SCOPE_ID,
  planPath: DECISION_18_PLAN_PATH,
  planSha256: DECISION_18_PLAN_SHA256,
  authorizationPath: DECISION_18_AUTHORIZATION_PATH,
  authorizationSha256: DECISION_18_AUTHORIZATION_SHA256,
}) satisfies FollowUpResearchV2AuthorityBinding;

export const followUpResearchV2QualifiedFactSchema =
  followUpResearchFactSchema.extend({
    /** Stable supported proposition; source/wording corrections do not edit it. */
    atomicProposition: trimmedNonEmpty,
    /** Digest of case, kind, atomic proposition, and supported fact date. */
    factIdentitySha256: sha256Lower,
  });
export type FollowUpResearchV2QualifiedFact = z.infer<
  typeof followUpResearchV2QualifiedFactSchema
>;

export const followUpResearchV2DeltaSchema = z.strictObject({
  itemId: lowerKebab,
  changeType: z.enum(["added", "corrected"]),
  priorPayloadSha256: sha256Lower.nullable(),
  newPayloadSha256: sha256Lower,
  correctionBasis: trimmedNonEmpty.nullable(),
  fact: followUpResearchV2QualifiedFactSchema,
});
export type FollowUpResearchV2Delta = z.infer<
  typeof followUpResearchV2DeltaSchema
>;

export const followUpResearchV2SearchContextSchema = z.strictObject({
  athleteName: trimmedNonEmpty,
  teamAtEvent: trimmedNonEmpty,
  season: trimmedNonEmpty,
  injuryTerms: z.array(trimmedNonEmpty).min(1),
});
export type FollowUpResearchV2SearchContext = z.infer<
  typeof followUpResearchV2SearchContextSchema
>;

export const followUpResearchV2QuerySchema = z.strictObject({
  queryId: lowerKebab,
  query: trimmedNonEmpty,
  sourceChannel: z.enum(RESEARCH_V2_SOURCE_CHANNELS),
  timepoint: z.enum(RESEARCH_V2_TIMEPOINTS),
  timepointApplicability: z.enum(["applicable", "not-applicable"]),
  notApplicableReason: trimmedNonEmpty.nullable(),
  coveredTermConcepts: z.array(z.enum(RESEARCH_V2_ALL_TERM_CONCEPTS)).min(1),
  namedPersonTerms: z.array(trimmedNonEmpty),
  verificationChannel: z.enum(RESEARCH_V2_VERIFICATION_CHANNELS),
  angleId: sha256Lower,
  resultCode: z.enum(RESEARCH_V2_QUERY_RESULT_CODES),
  resultReason: trimmedNonEmpty,
  checkedBoundary: trimmedNonEmpty,
});
export type FollowUpResearchV2Query = z.infer<
  typeof followUpResearchV2QuerySchema
>;

const retainedCandidateDisposition = z.enum([
  "retained-new",
  "retained-existing",
  "corroboration",
  "retained-changed",
  "rejected-with-reason",
]);

export const followUpResearchV2NamedMedicalPersonSchema = z.strictObject({
  name: trimmedNonEmpty,
  role: z.enum(["surgeon", "operating-physician", "treating-physician"]),
});
export type FollowUpResearchV2NamedMedicalPerson = z.infer<
  typeof followUpResearchV2NamedMedicalPersonSchema
>;

export const followUpResearchV2OpenedCandidateSchema = z.strictObject({
  candidateId: lowerKebab,
  queryId: lowerKebab,
  accessStatus: z.literal("opened-original-page"),
  source: followUpResearchFactSchema.shape.source,
  disposition: retainedCandidateDisposition,
  dispositionReason: trimmedNonEmpty,
  factItemIds: z.array(lowerKebab),
  namedMedicalPersons: z.array(followUpResearchV2NamedMedicalPersonSchema),
  materialCandidate: z.boolean(),
  searchSnippetUsedAsEvidence: z.literal(false),
});

export const followUpResearchV2UnresolvedCandidateSchema = z.strictObject({
  candidateId: lowerKebab,
  queryId: lowerKebab,
  accessStatus: z.literal("unresolved-material-candidate"),
  discoveredUrl: httpsUrl,
  titleHint: trimmedNonEmpty.nullable(),
  disposition: z.literal("unresolved-access"),
  dispositionReason: trimmedNonEmpty,
  factItemIds: z.array(lowerKebab).max(0),
  materialCandidate: z.literal(true),
  searchSnippetUsedAsEvidence: z.literal(false),
});

export const followUpResearchV2NonmaterialCandidateSchema = z.strictObject({
  candidateId: lowerKebab,
  queryId: lowerKebab,
  accessStatus: z.literal("not-opened-nonmaterial-rejection"),
  discoveredUrl: httpsUrl,
  titleHint: trimmedNonEmpty.nullable(),
  disposition: z.literal("rejected-with-reason"),
  dispositionReason: trimmedNonEmpty,
  factItemIds: z.array(lowerKebab).max(0),
  materialCandidate: z.literal(false),
  searchSnippetUsedAsEvidence: z.literal(false),
});

export const followUpResearchV2CandidateSchema = z.discriminatedUnion(
  "accessStatus",
  [
    followUpResearchV2OpenedCandidateSchema,
    followUpResearchV2UnresolvedCandidateSchema,
    followUpResearchV2NonmaterialCandidateSchema,
  ],
);
export type FollowUpResearchV2Candidate = z.infer<
  typeof followUpResearchV2CandidateSchema
>;

export const followUpResearchV2RoundSchema = z.strictObject({
  roundNumber: z.number().int().positive(),
  startedAt: utcTimestamp,
  completedAt: utcTimestamp,
  operatorId: trimmedNonEmpty,
  toolChannel: z.enum(RESEARCH_V2_TOOL_CHANNELS),
  queries: z.array(followUpResearchV2QuerySchema).min(1),
  candidates: z.array(followUpResearchV2CandidateSchema),
  qualifiedFactDeltas: z.array(followUpResearchV2DeltaSchema),
  addedQualifiedFactCount: z.number().int().nonnegative(),
  correctedQualifiedFactCount: z.number().int().nonnegative(),
  newQualifiedFactIds: z.array(lowerKebab),
  qualifiedSetBeforeSha256: sha256Lower,
  qualifiedSetAfterSha256: sha256Lower,
  rejectionOrNotFoundReasons: z.array(trimmedNonEmpty),
  checkedBoundary: trimmedNonEmpty,
});
export type FollowUpResearchV2Round = z.infer<
  typeof followUpResearchV2RoundSchema
>;

export const followUpResearchV2BaselineSchema = z.strictObject({
  decision17Outcome: z.enum(["source-ready", "not-found"]),
  qualifiedFacts: z.array(followUpResearchV2QualifiedFactSchema),
  qualifiedSetSha256: sha256Lower,
});

const namedSurgeonBranchSchema = z.strictObject({
  status: z.literal("named-surgeon-found"),
  names: z
    .array(
      z.strictObject({
        name: trimmedNonEmpty,
        firstDiscoveredRound: z.number().int().positive(),
      }),
    )
    .min(1),
  genericNoNameReason: z.null(),
});

const genericSurgeonBranchSchema = z.strictObject({
  status: z.literal("no-surgeon-name-found"),
  names: z.array(z.never()).max(0),
  genericNoNameReason: trimmedNonEmpty,
});

export const followUpResearchV2SurgeonBranchSchema = z.discriminatedUnion(
  "status",
  [namedSurgeonBranchSchema, genericSurgeonBranchSchema],
);

const auditUnitShape = {
  baseline: followUpResearchV2BaselineSchema,
  // Empty is a valid, deterministic in-progress state.  Receipts still require
  // the replay validator to derive terminal status for all four units.
  rounds: z.array(followUpResearchV2RoundSchema),
  finalQualifiedFacts: z.array(followUpResearchV2QualifiedFactSchema),
  finalQualifiedSetSha256: sha256Lower,
  emptyResultReason: trimmedNonEmpty.nullable(),
};

const treatmentAuditSchema = z.strictObject({
  factKind: z.literal("treatment"),
  ...auditUnitShape,
  surgeonBranch: z.null(),
});
const surgeryAuditSchema = z.strictObject({
  factKind: z.literal("surgery"),
  ...auditUnitShape,
  surgeonBranch: followUpResearchV2SurgeonBranchSchema,
});
const injectionAuditSchema = z.strictObject({
  factKind: z.literal("injection"),
  ...auditUnitShape,
  surgeonBranch: z.null(),
});
const actualReturnAuditSchema = z.strictObject({
  factKind: z.literal("actual-return"),
  ...auditUnitShape,
  surgeonBranch: z.null(),
});

export const followUpResearchV2AuditUnitSchema = z.discriminatedUnion(
  "factKind",
  [
    treatmentAuditSchema,
    surgeryAuditSchema,
    injectionAuditSchema,
    actualReturnAuditSchema,
  ],
);
export type FollowUpResearchV2AuditUnit = z.infer<
  typeof followUpResearchV2AuditUnitSchema
>;

export const followUpResearchV2Decision17BaselineBindingSchema = z.strictObject(
  {
    researchSchemaVersion: z.literal("case-follow-up-research.v1"),
    researchPath: trimmedNonEmpty,
    researchSha256: sha256Lower,
    sidecarSchemaVersion: z.literal("case-follow-up.v1"),
    sidecarPath: trimmedNonEmpty,
    sidecarSha256: sha256Lower,
  },
);

export const followUpResearchV2Schema = z.strictObject({
  schemaVersion: z.literal(FOLLOW_UP_RESEARCH_V2_SCHEMA_VERSION),
  caseId: z.string().regex(CASE_ID_RE),
  caseSlug: lowerKebab,
  searchContext: followUpResearchV2SearchContextSchema,
  caseClinicalDigest: sha256Lower,
  evidenceStatus: z.literal("exhaustive-audit"),
  authorityBinding: followUpResearchV2AuthorityBindingSchema,
  sourcePolicyBinding: followUpSourcePolicyBindingSchema,
  decision17BaselineBinding: followUpResearchV2Decision17BaselineBindingSchema,
  audits: z.strictObject({
    treatment: treatmentAuditSchema,
    surgery: surgeryAuditSchema,
    injection: injectionAuditSchema,
    "actual-return": actualReturnAuditSchema,
  }),
});
export type FollowUpResearchV2 = z.infer<typeof followUpResearchV2Schema>;

export interface ParsedFollowUpResearchV2 {
  research: FollowUpResearchV2 | null;
  exactBytesDigest: string;
  issues: ValidationIssue[];
}

/** Parse strict, one-line canonical JSON without performing replay checks. */
export function parseFollowUpResearchV2Bytes(
  bytes: Uint8Array | string,
): ParsedFollowUpResearchV2 {
  const exactBytesDigest = sha256Hex(bytes);
  const text =
    typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      research: null,
      exactBytesDigest,
      issues: [
        issue(
          "follow-up-research-v2-parse",
          "",
          error instanceof CanonicalJsonError ? error.message : String(error),
        ),
      ],
    };
  }

  const issues: ValidationIssue[] = [];
  if (canonicalJson(parsed) !== text) {
    issues.push(
      issue(
        "follow-up-research-v2-not-canonical",
        "",
        "Decision 18 research bytes must be exact canonical JSON",
      ),
    );
  }
  const result = followUpResearchV2Schema.safeParse(parsed);
  if (!result.success) {
    issues.push(
      ...result.error.issues.map((zodIssue) =>
        issue(
          "follow-up-research-v2-schema",
          zodIssue.path.join("."),
          zodIssue.message,
        ),
      ),
    );
  }
  return {
    research: issues.length === 0 && result.success ? result.data : null,
    exactBytesDigest,
    issues,
  };
}

/** Narrow utility for code that must reject non-v2 research values. */
export function isFollowUpResearchV2(
  value: unknown,
): value is FollowUpResearchV2 {
  return followUpResearchV2Schema.safeParse(value).success;
}

/** The complete mandatory vocabulary for one fact kind. */
export function requiredResearchV2TermConcepts(
  kind: (typeof FOLLOW_UP_KINDS)[number],
): readonly ResearchV2TermConcept[] {
  return RESEARCH_V2_TERM_CONCEPTS[kind];
}
