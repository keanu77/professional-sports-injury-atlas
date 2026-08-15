/** Strict, per-case authoring input for reproducible Decision 18 generation. */

import { z } from "astro/zod";

import {
  followUpResearchV2CandidateSchema,
  followUpResearchV2QualifiedFactSchema,
  followUpResearchV2QuerySchema,
  followUpResearchV2RoundSchema,
} from "./case-follow-up-research-v2";
import { FOLLOW_UP_KINDS } from "./case-follow-up";
import { SLUG_RE } from "./case";
import {
  CanonicalJsonError,
  ISO_DATE_RE,
  canonicalJson,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "./canonical";
import { DECISION_18_FOLLOW_UP_BATCH_ORDER } from "./decision-18-follow-up-batch";

export const DECISION_18_FOLLOW_UP_RESEARCH_RECORD_SCHEMA_VERSION =
  "decision-18-follow-up-research-record.v1" as const;

const trimmedNonEmpty = z
  .string()
  .min(1)
  .refine((value) => value === value.trim(), {
    message: "must be trimmed and non-empty",
  });
const lowerKebab = z.string().regex(SLUG_RE);

export const decision18ResearchQueryPlanSlotSchema = z.strictObject({
  planSlotId: lowerKebab,
  suggestedQuery: trimmedNonEmpty,
  sourceChannel: followUpResearchV2QuerySchema.shape.sourceChannel,
  timepoint: followUpResearchV2QuerySchema.shape.timepoint,
  coveredTermConcepts: followUpResearchV2QuerySchema.shape.coveredTermConcepts,
  requiredVerification: z.literal("open-original-page"),
  planningState: z.literal("unexecuted-at-scaffold-time"),
});

export const decision18BaselineFactIdentityRecordSchema = z.strictObject({
  itemId: lowerKebab,
  atomicProposition: trimmedNonEmpty,
});

export const decision18QualifiedFactInputSchema =
  followUpResearchV2QualifiedFactSchema.omit({
    factIdentitySha256: true,
  });

export const decision18ResearchQueryInputSchema =
  followUpResearchV2QuerySchema.omit({ angleId: true });

const addedChangeSchema = z.strictObject({
  changeType: z.literal("added"),
  correctionBasis: z.null(),
  fact: decision18QualifiedFactInputSchema,
});
const correctedChangeSchema = z.strictObject({
  changeType: z.literal("corrected"),
  correctionBasis: trimmedNonEmpty,
  fact: decision18QualifiedFactInputSchema,
});
export const decision18QualifiedFactChangeInputSchema = z.discriminatedUnion(
  "changeType",
  [addedChangeSchema, correctedChangeSchema],
);

export const decision18ResearchRoundInputSchema = z.strictObject({
  startedAt: followUpResearchV2RoundSchema.shape.startedAt,
  completedAt: followUpResearchV2RoundSchema.shape.completedAt,
  operatorId: followUpResearchV2RoundSchema.shape.operatorId,
  toolChannel: followUpResearchV2RoundSchema.shape.toolChannel,
  queries: z.array(decision18ResearchQueryInputSchema).min(1),
  candidates: z.array(followUpResearchV2CandidateSchema),
  qualifiedFactChanges: z.array(decision18QualifiedFactChangeInputSchema),
  rejectionOrNotFoundReasons:
    followUpResearchV2RoundSchema.shape.rejectionOrNotFoundReasons,
  checkedBoundary: followUpResearchV2RoundSchema.shape.checkedBoundary,
});

const auditInputShape = {
  baselineFactIdentities: z.array(decision18BaselineFactIdentityRecordSchema),
  initialQueryPlan: z.array(decision18ResearchQueryPlanSlotSchema).min(6),
  rounds: z.array(decision18ResearchRoundInputSchema),
  emptyResultReason: trimmedNonEmpty.nullable(),
};

const treatmentAuditInputSchema = z.strictObject({
  factKind: z.literal("treatment"),
  ...auditInputShape,
});
const surgeryAuditInputSchema = z.strictObject({
  factKind: z.literal("surgery"),
  ...auditInputShape,
  noNamedMedicalPersonReason: trimmedNonEmpty,
});
const injectionAuditInputSchema = z.strictObject({
  factKind: z.literal("injection"),
  ...auditInputShape,
});
const actualReturnAuditInputSchema = z.strictObject({
  factKind: z.literal("actual-return"),
  ...auditInputShape,
});

export const decision18FollowUpResearchRecordSchema = z.strictObject({
  schemaVersion: z.literal(
    DECISION_18_FOLLOW_UP_RESEARCH_RECORD_SCHEMA_VERSION,
  ),
  batchId: z.enum(DECISION_18_FOLLOW_UP_BATCH_ORDER),
  caseSlug: lowerKebab,
  auditCutoffDate: z.string().regex(ISO_DATE_RE),
  audits: z.strictObject({
    treatment: treatmentAuditInputSchema,
    surgery: surgeryAuditInputSchema,
    injection: injectionAuditInputSchema,
    "actual-return": actualReturnAuditInputSchema,
  }),
});
export type Decision18FollowUpResearchRecord = z.infer<
  typeof decision18FollowUpResearchRecordSchema
>;
export type Decision18ResearchRoundInput = z.infer<
  typeof decision18ResearchRoundInputSchema
>;
export type Decision18QualifiedFactInput = z.infer<
  typeof decision18QualifiedFactInputSchema
>;

export interface ParsedDecision18FollowUpResearchRecord {
  record: Decision18FollowUpResearchRecord | null;
  exactBytesDigest: string;
  issues: ValidationIssue[];
}

/** Duplicate-key-detected, exact canonical parser for one per-case record. */
export function parseDecision18FollowUpResearchRecordBytes(
  bytes: Uint8Array | string,
): ParsedDecision18FollowUpResearchRecord {
  const exactBytesDigest = sha256Hex(bytes);
  const text =
    typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      record: null,
      exactBytesDigest,
      issues: [
        issue(
          "decision18-research-record-parse",
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
        "decision18-research-record-not-canonical",
        "",
        "research record bytes must be exact canonical JSON",
      ),
    );
  }
  const result = decision18FollowUpResearchRecordSchema.safeParse(parsed);
  if (!result.success) {
    issues.push(
      ...result.error.issues.map((entry) =>
        issue(
          "decision18-research-record-schema",
          entry.path.join("."),
          entry.message,
        ),
      ),
    );
  }
  return {
    record: issues.length === 0 && result.success ? result.data : null,
    exactBytesDigest,
    issues,
  };
}

export function decision18ResearchRecordPath(
  evidenceDirectory: string,
  caseSlug: string,
): string {
  return `${evidenceDirectory}${caseSlug}.research-record.v1.json`;
}

export const DECISION_18_RESEARCH_RECORD_FACT_KINDS = FOLLOW_UP_KINDS;
