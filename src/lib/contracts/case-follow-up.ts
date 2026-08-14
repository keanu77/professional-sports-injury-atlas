/**
 * Decision 17's additive, pending-only follow-up sidecar contract.
 *
 * The sidecar never carries a medical reviewer identity or an aggregate
 * digest. It binds the unchanged approved case digest, repeats one complete
 * source per atomic draft, and keeps the historical confirmed-update
 * projection as a reference to the immutable case record.
 */

import { z } from "astro/zod";
import { CASE_ID_RE, HTTPS_URL_RE, SHA256_LOWER_RE, SLUG_RE } from "./case";
import {
  CanonicalJsonError,
  ISO_DATE_RE,
  canonicalJson,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "./canonical";

export const CASE_FOLLOW_UP_SCHEMA_VERSION = "case-follow-up.v1" as const;
export const FOLLOW_UP_RESEARCH_SCHEMA_VERSION =
  "case-follow-up-research.v1" as const;
export const CURRENT_FOLLOW_UP_SOURCE_POLICY_VERSION = "nba-v10" as const;
export const FOLLOW_UP_VALIDATION_CUTOFF_DATE = "2026-08-14" as const;
export const FOLLOW_UP_SOURCE_POLICY_V10_BINDING = Object.freeze({
  sourcePolicyVersion: CURRENT_FOLLOW_UP_SOURCE_POLICY_VERSION,
  jsonPath: "research/source-policy/source-policy.v10.json",
  jsonSha256:
    "9203384e5d8b551834e3de5c17a3cc2bff60f8e27416a3074897db861df9a4b3",
  markdownPath: "research/source-policy/nba.v10.md",
  markdownSha256:
    "34e05ef2b6c1f7fbfbafe9dbf5ae469394bcd3a7c6dc49b07f0468a566a5604c",
} as const);

export const FOLLOW_UP_KINDS = [
  "treatment",
  "surgery",
  "injection",
  "actual-return",
] as const;
export type FollowUpKind = (typeof FOLLOW_UP_KINDS)[number];

export const FOLLOW_UP_SOURCE_TIERS = [
  "team-or-league-official",
  "mainstream-media-report",
  "unverified-report",
] as const;
export type FollowUpSourceTier = (typeof FOLLOW_UP_SOURCE_TIERS)[number];

export const FOLLOW_UP_MEDIA = [
  "web-article",
  "press-release",
  "game-or-participation-record",
  "social-post",
  "video",
] as const;
export type FollowUpMedium = (typeof FOLLOW_UP_MEDIA)[number];

const trimmedNonEmpty = z
  .string()
  .min(1)
  .refine((value) => value === value.trim(), {
    message: "must be trimmed and non-empty",
  });
const isoDate = z.string().regex(ISO_DATE_RE);
const httpsUrl = z.string().regex(HTTPS_URL_RE);
const sha256Lower = z.string().regex(SHA256_LOWER_RE);
const lowerKebab = z.string().regex(SLUG_RE);

export const followUpSourcePolicyBindingSchema = z.strictObject({
  sourcePolicyVersion: z.literal(CURRENT_FOLLOW_UP_SOURCE_POLICY_VERSION),
  jsonPath: z.literal(FOLLOW_UP_SOURCE_POLICY_V10_BINDING.jsonPath),
  jsonSha256: z.literal(FOLLOW_UP_SOURCE_POLICY_V10_BINDING.jsonSha256),
  markdownPath: z.literal(FOLLOW_UP_SOURCE_POLICY_V10_BINDING.markdownPath),
  markdownSha256: z.literal(FOLLOW_UP_SOURCE_POLICY_V10_BINDING.markdownSha256),
});
export type FollowUpSourcePolicyBinding = z.infer<
  typeof followUpSourcePolicyBindingSchema
>;

export const followUpSourceSchema = z.strictObject({
  title: trimmedNonEmpty,
  publisher: trimmedNonEmpty,
  account: trimmedNonEmpty.nullable(),
  canonicalUrl: httpsUrl,
  publishedAt: isoDate,
  accessedAt: isoDate,
  medium: z.enum(FOLLOW_UP_MEDIA),
});
export type FollowUpSource = z.infer<typeof followUpSourceSchema>;

export const pendingFollowUpReviewSchema = z.strictObject({
  status: z.literal("pending-owner-signoff"),
  reviewedPayloadDigest: sha256Lower,
});
export type PendingFollowUpReview = z.infer<typeof pendingFollowUpReviewSchema>;

export const followUpItemSchema = z.strictObject({
  id: lowerKebab,
  kind: z.enum(FOLLOW_UP_KINDS),
  attributedStatement: trimmedNonEmpty,
  factDate: isoDate.nullable(),
  sourceTier: z.enum(FOLLOW_UP_SOURCE_TIERS),
  source: followUpSourceSchema,
  tierBasis: trimmedNonEmpty,
  researchEvidenceId: lowerKebab,
  sourcePolicyBinding: followUpSourcePolicyBindingSchema,
  itemPayloadDigest: sha256Lower,
  review: pendingFollowUpReviewSchema,
});
export type FollowUpItem = z.infer<typeof followUpItemSchema>;

export const legacyDiagnosisProjectionSchema = z.strictObject({
  field: z.literal("general.confirmedUpdate"),
  sourceId: trimmedNonEmpty,
  sourceTier: z.literal("team-or-league-official"),
});

export const followUpCategoriesSchema = z.strictObject({
  treatment: z.array(followUpItemSchema),
  surgery: z.array(followUpItemSchema),
  injection: z.array(followUpItemSchema),
  "actual-return": z.array(followUpItemSchema),
});

export const caseFollowUpSchema = z.strictObject({
  schemaVersion: z.literal(CASE_FOLLOW_UP_SCHEMA_VERSION),
  caseId: z.string().regex(CASE_ID_RE),
  caseClinicalDigest: sha256Lower,
  sourcePolicyBinding: followUpSourcePolicyBindingSchema,
  legacyDiagnosisProjection: legacyDiagnosisProjectionSchema,
  categories: followUpCategoriesSchema,
});
export type CaseFollowUp = z.infer<typeof caseFollowUpSchema>;

export const researchFollowUpSourceSchema = followUpSourceSchema.extend({
  finalUrl: httpsUrl,
});

export const followUpResearchFactSchema = z.strictObject({
  evidenceId: lowerKebab,
  itemId: lowerKebab,
  kind: z.enum(FOLLOW_UP_KINDS),
  attributedStatement: trimmedNonEmpty,
  factDate: isoDate.nullable(),
  sourceTier: z.enum(FOLLOW_UP_SOURCE_TIERS),
  tierBasis: trimmedNonEmpty,
  source: researchFollowUpSourceSchema,
  evidenceUse: z.literal("opened-original-page"),
  searchSnippetUsedAsEvidence: z.literal(false),
});
export type FollowUpResearchFact = z.infer<typeof followUpResearchFactSchema>;

const queryBoundarySchema = z.strictObject({
  query: trimmedNonEmpty,
  locationsChecked: z.array(trimmedNonEmpty).min(1),
  performedAt: isoDate,
  stoppingBoundary: trimmedNonEmpty,
});

const sourceReadyCategoryAuditSchema = z.strictObject({
  queryBoundaries: z.array(queryBoundarySchema).min(1),
  outcome: z.literal("source-ready"),
  notFoundReason: z.null(),
  facts: z.array(followUpResearchFactSchema).min(1),
});

const notFoundCategoryAuditSchema = z.strictObject({
  queryBoundaries: z.array(queryBoundarySchema).min(1),
  outcome: z.literal("not-found"),
  notFoundReason: trimmedNonEmpty,
  facts: z.array(followUpResearchFactSchema).max(0),
});

export const followUpCategoryAuditSchema = z.discriminatedUnion("outcome", [
  sourceReadyCategoryAuditSchema,
  notFoundCategoryAuditSchema,
]);
export type FollowUpCategoryAudit = z.infer<typeof followUpCategoryAuditSchema>;

export const followUpResearchSchema = z.strictObject({
  schemaVersion: z.literal(FOLLOW_UP_RESEARCH_SCHEMA_VERSION),
  caseId: z.string().regex(CASE_ID_RE),
  caseSlug: lowerKebab,
  caseClinicalDigest: sha256Lower,
  evidenceStatus: z.literal("source-ready"),
  sourcePolicyBinding: followUpSourcePolicyBindingSchema,
  categories: z.strictObject({
    treatment: followUpCategoryAuditSchema,
    surgery: followUpCategoryAuditSchema,
    injection: followUpCategoryAuditSchema,
    "actual-return": followUpCategoryAuditSchema,
  }),
});
export type FollowUpResearch = z.infer<typeof followUpResearchSchema>;

export interface ParsedCaseFollowUp {
  sidecar: CaseFollowUp | null;
  exactBytesDigest: string;
  issues: ValidationIssue[];
}

export interface ParsedFollowUpResearch {
  research: FollowUpResearch | null;
  exactBytesDigest: string;
  issues: ValidationIssue[];
}

function parseCanonicalArtifact<T>(
  bytes: Uint8Array | string,
  schema: z.ZodType<T>,
  label: string,
): { value: T | null; exactBytesDigest: string; issues: ValidationIssue[] } {
  const exactBytesDigest = sha256Hex(bytes);
  const text =
    typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      value: null,
      exactBytesDigest,
      issues: [
        issue(
          `${label}-parse`,
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
        `${label}-not-canonical`,
        "",
        `${label} bytes must be exact canonical JSON`,
      ),
    );
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    issues.push(
      ...result.error.issues.map((zodIssue) =>
        issue(`${label}-schema`, zodIssue.path.join("."), zodIssue.message),
      ),
    );
  }
  return {
    value: issues.length === 0 && result.success ? result.data : null,
    exactBytesDigest,
    issues,
  };
}

export function parseCaseFollowUpBytes(
  bytes: Uint8Array | string,
): ParsedCaseFollowUp {
  const parsed = parseCanonicalArtifact(bytes, caseFollowUpSchema, "follow-up");
  return {
    sidecar: parsed.value,
    exactBytesDigest: parsed.exactBytesDigest,
    issues: parsed.issues,
  };
}

export function parseFollowUpResearchBytes(
  bytes: Uint8Array | string,
): ParsedFollowUpResearch {
  const parsed = parseCanonicalArtifact(
    bytes,
    followUpResearchSchema,
    "follow-up-research",
  );
  return {
    research: parsed.value,
    exactBytesDigest: parsed.exactBytesDigest,
    issues: parsed.issues,
  };
}
