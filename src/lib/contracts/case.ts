/**
 * Strict single-entry injury-case contract. Zod (via `astro/zod`) handles the
 * per-record structure; pure TypeScript validators in `cross-validation.ts`
 * handle cross-field and cross-case rules.
 */

import { z } from "astro/zod";
import { compareCodePoints, issue, type ValidationIssue } from "./canonical";

export const CASE_STATUSES = [
  "draft",
  "source-verified",
  "medical-review",
  "approved",
  "rejected",
  "retired",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CONFIRMATION_STATUSES = [
  "unconfirmed",
  "confirmed",
  "conflicted",
] as const;
export type ConfirmationStatus = (typeof CONFIRMATION_STATUSES)[number];

export const REVIEW_STATUSES = [
  "not-requested",
  "in-review",
  "approved",
  "changes-requested",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const EMBED_STATUSES = [
  "verified",
  "external-link-only",
  "unavailable",
] as const;

export const CAPTION_STATUSES = [
  "available",
  "unavailable",
  "not-verified",
] as const;
export type CaptionStatus = (typeof CAPTION_STATUSES)[number];

export const VIDEO_CONTENT_TYPES = ["in-game-injury-event"] as const;
export type VideoContentType = (typeof VIDEO_CONTENT_TYPES)[number];

export const PROVENANCE_STATUSES = ["pending", "verified", "rejected"] as const;
export type ProvenanceStatus = (typeof PROVENANCE_STATUSES)[number];

export const PUBLIC_RIGHTS_STATUSES = [
  "not-requested",
  "cleared",
  "rejected",
] as const;
export type PublicRightsStatus = (typeof PUBLIC_RIGHTS_STATUSES)[number];

export const INJURY_CODES = [
  "acl",
  "ankle-sprain",
  "achilles-rupture",
] as const;
export type InjuryCode = (typeof INJURY_CODES)[number];

export const SOURCE_TYPES = [
  "diagnosis-first-party",
  "diagnosis-secondary",
  "video-original",
  "event-context",
  "teaching-evidence",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const SOURCE_SUPPORT_PATHS = [
  "general.whatHappened",
  "injury.confirmedDiagnosis",
  "general.whatIsVisible",
  "general.confirmedUpdate",
  "professional.mechanismAnalysis",
  "professional.clinicalLimitations",
  "professional.differentialContext",
  "professional.treatmentAndRtpMeaning",
  "video.segmentObservation",
] as const;
export type SourceSupportPath = (typeof SOURCE_SUPPORT_PATHS)[number];

export const PROFESSIONAL_SUPPORT_PATHS = [
  "professional.mechanismAnalysis",
  "professional.clinicalLimitations",
  "professional.differentialContext",
  "professional.treatmentAndRtpMeaning",
] as const;
export type ProfessionalSupportPath =
  (typeof PROFESSIONAL_SUPPORT_PATHS)[number];

/** Exact source-type to support-path compatibility. */
export const SOURCE_SUPPORT_COMPATIBILITY: Record<
  SourceType,
  readonly SourceSupportPath[]
> = {
  "video-original": [
    "general.whatHappened",
    "general.whatIsVisible",
    "video.segmentObservation",
  ],
  "diagnosis-first-party": [
    "injury.confirmedDiagnosis",
    "general.confirmedUpdate",
  ],
  "diagnosis-secondary": [
    "injury.confirmedDiagnosis",
    "general.confirmedUpdate",
  ],
  "event-context": ["general.whatHappened"],
  "teaching-evidence": PROFESSIONAL_SUPPORT_PATHS,
};

export const CASE_ID_RE = /^CASE-[A-Z0-9]+-[0-9]{4}-[0-9]{3}$/;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SEASON_RE = /^(19|20)[0-9]{2}(-[0-9]{2})?$/;
export const HTTPS_URL_RE = /^https:\/\/[^\s<>"']+$/;
export const SHA256_LOWER_RE = /^[0-9a-f]{64}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

/** Events on/after this date are normal recent cases; earlier requires classic. */
export const RECENT_EVENT_CUTOFF = "2016-08-06";

const nonEmpty = z.string().min(1);
const isoDate = z.string().regex(ISO_DATE_PATTERN);
const utcTimestamp = z.string().regex(UTC_PATTERN);
const httpsUrl = z.string().regex(HTTPS_URL_RE);
const sha256Lower = z.string().regex(SHA256_LOWER_RE);
const lowerKebab = z.string().regex(SLUG_RE);

export const sourceManifestBindingSchema = z.strictObject({
  candidateId: nonEmpty,
  manifestId: nonEmpty,
  manifestDigest: sha256Lower,
  entryDigest: sha256Lower,
  sourceReviewDecisionDigest: sha256Lower,
  sourcePolicyVersion: nonEmpty,
});
export type SourceManifestBinding = z.infer<typeof sourceManifestBindingSchema>;

export const claimSchema = z.strictObject({
  id: nonEmpty,
  field: z.enum(PROFESSIONAL_SUPPORT_PATHS),
  text: nonEmpty,
  evidenceIds: z.array(nonEmpty).min(1),
});
export type CaseClaim = z.infer<typeof claimSchema>;

export const sourceSchema = z.strictObject({
  id: nonEmpty,
  type: z.enum(SOURCE_TYPES),
  title: nonEmpty,
  publisher: nonEmpty,
  independenceGroup: lowerKebab,
  originReportId: nonEmpty.nullable(),
  url: httpsUrl,
  publishedAt: isoDate,
  accessedAt: isoDate,
  supports: z.array(z.enum(SOURCE_SUPPORT_PATHS)).min(1),
});
export type CaseSource = z.infer<typeof sourceSchema>;

export const reviewSchema = z.strictObject({
  status: z.enum(REVIEW_STATUSES),
  reviewerName: nonEmpty.nullable(),
  reviewerQualification: nonEmpty.nullable(),
  reviewedAt: utcTimestamp.nullable(),
  reviewedContentDigest: sha256Lower.nullable(),
});
export type CaseReview = z.infer<typeof reviewSchema>;

export const eventBindingSchema = z.strictObject({
  status: z.enum(PROVENANCE_STATUSES),
  eventSourceId: nonEmpty.nullable(),
  checkedBy: nonEmpty.nullable(),
  checkedAt: utcTimestamp.nullable(),
  basis: nonEmpty.nullable(),
});
export type EventBinding = z.infer<typeof eventBindingSchema>;

export const sourceProvenanceVerificationSchema = z.strictObject({
  status: z.enum(PROVENANCE_STATUSES),
  verifiedBy: nonEmpty.nullable(),
  verifiedAt: utcTimestamp.nullable(),
  basis: nonEmpty.nullable(),
  notes: nonEmpty.nullable(),
  verifiedPolicyVersion: nonEmpty.nullable(),
  reviewedVideoIdentityDigest: sha256Lower.nullable(),
});
export type SourceProvenanceVerification = z.infer<
  typeof sourceProvenanceVerificationSchema
>;

export const publicRightsReviewSchema = z.strictObject({
  status: z.enum(PUBLIC_RIGHTS_STATUSES),
  reviewedBy: nonEmpty.nullable(),
  reviewedAt: utcTimestamp.nullable(),
  reviewedVideoDigest: sha256Lower.nullable(),
  policyVersion: nonEmpty.nullable(),
  termsCheckedAt: utcTimestamp.nullable(),
  decisionBasis: nonEmpty.nullable(),
  notes: nonEmpty.nullable(),
  decisionPath: nonEmpty.nullable(),
  decisionDigest: sha256Lower.nullable(),
});
export type PublicRightsReview = z.infer<typeof publicRightsReviewSchema>;

export const segmentSchema = z.strictObject({
  startSeconds: z.number().int().min(0),
  endSeconds: z.number().int().min(0),
  observation: nonEmpty,
});
export type VideoSegment = z.infer<typeof segmentSchema>;

export const videoSchema = z.strictObject({
  provider: nonEmpty,
  contentType: z.enum(VIDEO_CONTENT_TYPES),
  eventBinding: eventBindingSchema,
  canonicalUrl: httpsUrl,
  uploaderName: nonEmpty,
  uploaderProvenance: nonEmpty,
  embedStatus: z.enum(EMBED_STATUSES),
  embedCheckedAt: utcTimestamp,
  durationSeconds: z.number().int().min(1),
  startSeconds: z.number().int().min(0),
  endSeconds: z.number().int().min(0),
  fallbackUrl: httpsUrl,
  sourceProvenanceVerification: sourceProvenanceVerificationSchema,
  captionStatus: z.enum(CAPTION_STATUSES),
  captionCheckedAt: utcTimestamp,
  publicRightsReview: publicRightsReviewSchema,
  segments: z.array(segmentSchema),
});
export type CaseVideo = z.infer<typeof videoSchema>;

export const generalSchema = z.strictObject({
  whatHappened: nonEmpty,
  whatIsVisible: nonEmpty,
  whatVideoCannotProve: nonEmpty,
  confirmedUpdate: nonEmpty,
});
export type CaseGeneral = z.infer<typeof generalSchema>;

export const professionalSchema = z.strictObject({
  mechanismAnalysis: nonEmpty,
  clinicalLimitations: nonEmpty,
  differentialContext: nonEmpty,
  treatmentAndRtpMeaning: nonEmpty,
  claims: z.array(claimSchema).min(1),
  evidenceIds: z.array(nonEmpty).min(1),
  rtpCourseKey: nonEmpty.nullable(),
});
export type CaseProfessional = z.infer<typeof professionalSchema>;

export const auditSchema = z.strictObject({
  createdAt: utcTimestamp,
  updatedAt: utcTimestamp,
  sourceRecordId: nonEmpty,
});
export type CaseAudit = z.infer<typeof auditSchema>;

export const caseSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: z.string().regex(CASE_ID_RE),
  slug: lowerKebab,
  status: z.enum(CASE_STATUSES),
  sourceManifestBinding: sourceManifestBindingSchema,
  sport: z.strictObject({ code: nonEmpty }),
  league: z.strictObject({ code: nonEmpty }),
  competition: z.strictObject({ code: nonEmpty }),
  athlete: z.strictObject({ name: nonEmpty }),
  teamAtEvent: z.strictObject({ name: nonEmpty }),
  season: z.string().regex(SEASON_RE),
  eventDate: isoDate,
  opponent: z.strictObject({ name: nonEmpty }),
  injury: z.strictObject({
    code: nonEmpty,
    confirmedDiagnosis: nonEmpty,
    confirmationStatus: z.enum(CONFIRMATION_STATUSES),
  }),
  observedMechanismTags: z.array(nonEmpty).min(1),
  isClassic: z.boolean(),
  classicReason: nonEmpty.nullable(),
  classicProposedBy: nonEmpty.nullable(),
  classicExceptionApprovedBy: nonEmpty.nullable(),
  video: videoSchema,
  general: generalSchema,
  professional: professionalSchema,
  sources: z.array(sourceSchema).min(1),
  review: reviewSchema,
  audit: auditSchema,
});
export type InjuryCase = z.infer<typeof caseSchema>;

export interface AtomicClaimLike {
  id: string;
  field: string;
  text: string;
  evidenceIds: string[];
}

export interface AtomicSourceLike {
  id: string;
  type: string;
  supports: string[];
}

export interface AtomicClaimContract {
  /** Field path -> exact field text that the ordered claims must reproduce. */
  fields: ReadonlyMap<string, string>;
  claims: readonly AtomicClaimLike[];
  sources: readonly AtomicSourceLike[];
  aggregateEvidenceIds: readonly string[];
  /** Source types allowed to support these fields (usually teaching-evidence). */
  allowedSourceTypes: readonly string[];
  pathPrefix: string;
}

/**
 * Shared atomic-evidence engine: claims are stored in render order, joining a
 * field's ordered claim texts with a blank line must exactly reproduce the
 * field text, every claim needs compatible supporting evidence, and the
 * aggregate evidence list must equal the sorted unique union of all claim
 * evidence IDs.
 */
export function validateAtomicClaims(
  contract: AtomicClaimContract,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { fields, claims, sources, aggregateEvidenceIds, pathPrefix } =
    contract;
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  const seenClaimIds = new Set<string>();
  for (const claim of claims) {
    const path = `${pathPrefix}.claims.${claim.id}`;
    if (seenClaimIds.has(claim.id)) {
      issues.push(
        issue("claim-duplicate-id", path, `duplicate claim ID ${claim.id}`),
      );
    }
    seenClaimIds.add(claim.id);
    if (!fields.has(claim.field)) {
      issues.push(
        issue(
          "claim-field-unknown",
          path,
          `unknown claim field ${claim.field}`,
        ),
      );
      continue;
    }
    for (const evidenceId of claim.evidenceIds) {
      const source = sourceById.get(evidenceId);
      if (source === undefined) {
        issues.push(
          issue(
            "claim-evidence-missing",
            path,
            `claim evidence ${evidenceId} does not resolve to a source`,
          ),
        );
        continue;
      }
      if (
        !contract.allowedSourceTypes.includes(source.type) ||
        !source.supports.includes(claim.field)
      ) {
        issues.push(
          issue(
            "claim-evidence-incompatible",
            path,
            `source ${evidenceId} does not support ${claim.field}`,
          ),
        );
      }
    }
  }

  for (const [field, text] of fields) {
    const ordered = claims.filter((claim) => claim.field === field);
    const joined = ordered.map((claim) => claim.text).join("\n\n");
    if (joined !== text) {
      issues.push(
        issue(
          "claim-field-text-mismatch",
          `${pathPrefix}.${field}`,
          "joining the ordered claim texts with a blank line must exactly reproduce the field text",
        ),
      );
    }
  }

  const union = [...new Set(claims.flatMap((claim) => claim.evidenceIds))].sort(
    compareCodePoints,
  );
  const aggregate = [...aggregateEvidenceIds];
  const matches =
    union.length === aggregate.length &&
    union.every((value, index) => value === aggregate[index]);
  if (!matches) {
    issues.push(
      issue(
        "evidence-union-mismatch",
        `${pathPrefix}.evidenceIds`,
        "aggregate evidence IDs must exactly equal the sorted unique union of claim evidence IDs",
      ),
    );
  }

  return issues;
}
