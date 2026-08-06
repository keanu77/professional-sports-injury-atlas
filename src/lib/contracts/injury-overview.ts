/**
 * Strict injury-overview contract. Every narrative field is reproduced exactly
 * by ordered atomic claims with compatible teaching-evidence sources, and the
 * overview explicitly forbids individualized instructions, week-by-week
 * prescriptions, dosage/progression tables, and copied RTP course units.
 */

import { z } from "astro/zod";
import { issue, SHA256_RE, type ValidationIssue } from "./canonical";
import { reviewSchema, validateAtomicClaims } from "./case";
import {
  defaultTaxonomyRegistries,
  findInjury,
  type TaxonomyRegistries,
} from "./taxonomy";
import { UPDATE_STATUSES } from "./update";

export const OVERVIEW_NARRATIVE_FIELDS = [
  "scope",
  "basicAnatomyAndDefinition",
  "commonObservedMechanisms",
  "whatVideoCannotProve",
  "diagnosisContext",
  "treatmentContext",
  "rtpContext",
] as const;
export type OverviewNarrativeField = (typeof OVERVIEW_NARRATIVE_FIELDS)[number];

const nonEmpty = z.string().min(1);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const utcTimestamp = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

export const overviewClaimSchema = z.strictObject({
  id: nonEmpty,
  field: z.enum(OVERVIEW_NARRATIVE_FIELDS),
  text: nonEmpty,
  evidenceIds: z.array(nonEmpty).min(1),
});

export const overviewSourceSchema = z.strictObject({
  id: nonEmpty,
  type: z.literal("teaching-evidence"),
  title: nonEmpty,
  publisher: nonEmpty,
  independenceGroup: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  originReportId: nonEmpty.nullable(),
  url: z.string().regex(/^https:\/\/[^\s<>"']+$/),
  publishedAt: isoDate,
  accessedAt: isoDate,
  supports: z.array(z.enum(OVERVIEW_NARRATIVE_FIELDS)).min(1),
});

export const injuryOverviewSchema = z.strictObject({
  schemaVersion: z.literal(1),
  injuryCode: nonEmpty,
  status: z.enum(UPDATE_STATUSES),
  titleZh: nonEmpty,
  summaryZh: nonEmpty,
  scope: nonEmpty,
  basicAnatomyAndDefinition: nonEmpty,
  commonObservedMechanisms: nonEmpty,
  whatVideoCannotProve: nonEmpty,
  diagnosisContext: nonEmpty,
  treatmentContext: nonEmpty,
  rtpContext: nonEmpty,
  claims: z.array(overviewClaimSchema).min(1),
  evidenceIds: z.array(nonEmpty).min(1),
  sources: z.array(overviewSourceSchema).min(1),
  review: reviewSchema,
  audit: z.strictObject({
    createdAt: utcTimestamp,
    updatedAt: utcTimestamp,
  }),
});
export type InjuryOverview = z.infer<typeof injuryOverviewSchema>;

/**
 * Heuristic for prescription-like content: week-by-week progressions, set/rep
 * dosage tables, and similar copied program structure are never allowed in an
 * overview.
 */
const PRESCRIPTION_PATTERNS: readonly RegExp[] = [
  /week\s*\d+\s*[:：\-–]/i,
  /第\s*[0-9０-９]+\s*週/,
  /\d+\s*sets?\s*[x×]\s*\d+\s*reps?/i,
  /\d+\s*組\s*[x×]?\s*\d+\s*下/,
  /\|\s*week\s*\d*\s*\|/i,
  /phase\s*\d+\s*[:：].*(sets|reps|dosage)/i,
];

export function containsPrescriptionLikeContent(text: string): boolean {
  return PRESCRIPTION_PATTERNS.some((pattern) => pattern.test(text));
}

/** Validates one injury overview record. */
export function validateInjuryOverview(
  record: unknown,
  registries: TaxonomyRegistries = defaultTaxonomyRegistries,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const parsed = injuryOverviewSchema.safeParse(record);
  if (!parsed.success) {
    for (const zodIssue of parsed.error.issues) {
      issues.push(
        issue("overview-schema", zodIssue.path.join("."), zodIssue.message),
      );
    }
    return issues;
  }
  const value = parsed.data;

  if (findInjury(value.injuryCode, registries) === undefined) {
    issues.push(
      issue(
        "unknown-injury",
        "injuryCode",
        `overview targets unsupported injury ${value.injuryCode}`,
      ),
    );
  }

  for (const field of OVERVIEW_NARRATIVE_FIELDS) {
    if (containsPrescriptionLikeContent(value[field])) {
      issues.push(
        issue(
          "overview-prescription",
          field,
          "overview content must not contain prescription-like progression tables or dosage",
        ),
      );
    }
  }
  for (const claim of value.claims) {
    if (containsPrescriptionLikeContent(claim.text)) {
      issues.push(
        issue(
          "overview-prescription",
          `claims.${claim.id}`,
          "claim text must not contain prescription-like content",
        ),
      );
    }
  }

  issues.push(
    ...validateAtomicClaims({
      fields: new Map(
        OVERVIEW_NARRATIVE_FIELDS.map((field) => [field, value[field]]),
      ),
      claims: value.claims,
      sources: value.sources,
      aggregateEvidenceIds: value.evidenceIds,
      allowedSourceTypes: ["teaching-evidence"],
      pathPrefix: "overview",
    }),
  );

  if (value.status === "approved" || value.review.status === "approved") {
    const review = value.review;
    if (
      review.status !== "approved" ||
      review.reviewerName === null ||
      review.reviewerQualification === null ||
      review.reviewedAt === null ||
      review.reviewedContentDigest === null ||
      !SHA256_RE.test(review.reviewedContentDigest)
    ) {
      issues.push(
        issue(
          "overview-review-incomplete",
          "review",
          "an approved overview requires a complete approved review with a valid digest",
        ),
      );
    }
  }

  return issues;
}
