/**
 * Strict quarterly-update contract. The structure validator checks internal
 * consistency only; it does not compare an old update against current-head
 * cases (that comparison happens in the release-transition validators).
 */

import { z } from "astro/zod";
import {
  isValidIsoDate,
  isValidUtcTimestamp,
  issue,
  SHA256_RE,
  type ValidationIssue,
} from "./canonical";
import { reviewSchema } from "./case";

export const UPDATE_STATUSES = ["draft", "medical-review", "approved"] as const;
export type UpdateStatus = (typeof UPDATE_STATUSES)[number];

const UPDATE_ID_RE = /^\d{4}-q[1-4]$/;
const nonEmpty = z.string().min(1);
const sha256Lower = z.string().regex(SHA256_RE);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const utcTimestamp = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

export const updatePeriodSchema = z.strictObject({
  year: z.number().int().min(1900).max(2999),
  quarter: z.number().int().min(1).max(4),
  startDate: isoDate,
  endDate: isoDate,
});

export const addedCaseSchema = z.strictObject({
  caseId: nonEmpty,
  currentClinicalDigest: sha256Lower,
  currentVideoSourceDigest: sha256Lower,
});

export const updatedCaseSchema = z.strictObject({
  caseId: nonEmpty,
  previousClinicalDigest: sha256Lower,
  currentClinicalDigest: sha256Lower,
  previousVideoSourceDigest: sha256Lower,
  currentVideoSourceDigest: sha256Lower,
  reason: nonEmpty,
});

export const retiredCaseSchema = z.strictObject({
  caseId: nonEmpty,
  previousClinicalDigest: sha256Lower,
  previousVideoSourceDigest: sha256Lower,
  reason: nonEmpty,
});

export const unavailableCaseSchema = z.strictObject({
  caseId: nonEmpty,
  previousClinicalDigest: sha256Lower,
  previousVideoSourceDigest: sha256Lower,
  currentClinicalDigest: sha256Lower,
  currentVideoSourceDigest: sha256Lower,
  detectedAt: utcTimestamp,
  previousEmbedStatus: z.enum([
    "verified",
    "external-link-only",
    "unavailable",
  ]),
  action: nonEmpty,
});

export const updateAuditSchema = z.strictObject({
  createdAt: utcTimestamp,
  updatedAt: utcTimestamp,
});

export const updateSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: z.string().regex(UPDATE_ID_RE),
  period: updatePeriodSchema,
  status: z.enum(UPDATE_STATUSES),
  summary: nonEmpty,
  publishedAt: utcTimestamp.nullable(),
  addedCases: z.array(addedCaseSchema),
  updatedCases: z.array(updatedCaseSchema),
  retiredCases: z.array(retiredCaseSchema),
  unavailableCases: z.array(unavailableCaseSchema),
  review: reviewSchema,
  audit: updateAuditSchema,
});
export type QuarterlyUpdate = z.infer<typeof updateSchema>;

const QUARTER_BOUNDS: Record<number, { start: string; end: string }> = {
  1: { start: "01-01", end: "03-31" },
  2: { start: "04-01", end: "06-30" },
  3: { start: "07-01", end: "09-30" },
  4: { start: "10-01", end: "12-31" },
};

/** Validates a quarterly update's internal structure. */
export function validateUpdateStructure(update: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const parsed = updateSchema.safeParse(update);
  if (!parsed.success) {
    for (const zodIssue of parsed.error.issues) {
      issues.push(
        issue("update-schema", zodIssue.path.join("."), zodIssue.message),
      );
    }
    return issues;
  }
  const value = parsed.data;

  const expectedId = `${value.period.year}-q${value.period.quarter}`;
  const bounds = QUARTER_BOUNDS[value.period.quarter]!;
  if (
    value.id !== expectedId ||
    value.period.startDate !== `${value.period.year}-${bounds.start}` ||
    value.period.endDate !== `${value.period.year}-${bounds.end}`
  ) {
    issues.push(
      issue(
        "update-id-period",
        "period",
        `update ${value.id} must match period ${expectedId} with exact quarter start/end dates`,
      ),
    );
  }

  for (const [path, dateValue] of [
    ["period.startDate", value.period.startDate],
    ["period.endDate", value.period.endDate],
  ] as const) {
    if (!isValidIsoDate(dateValue)) {
      issues.push(issue("invalid-date", path, `invalid date ${dateValue}`));
    }
  }
  const timestamps: Array<[string, string | null]> = [
    ["publishedAt", value.publishedAt],
    ["audit.createdAt", value.audit.createdAt],
    ["audit.updatedAt", value.audit.updatedAt],
    ["review.reviewedAt", value.review.reviewedAt],
  ];
  for (const transition of value.unavailableCases) {
    timestamps.push([
      `unavailableCases.${transition.caseId}.detectedAt`,
      transition.detectedAt,
    ]);
  }
  for (const [path, timestamp] of timestamps) {
    if (timestamp !== null && !isValidUtcTimestamp(timestamp)) {
      issues.push(
        issue("invalid-date", path, `invalid timestamp ${timestamp}`),
      );
    }
  }

  const seenCaseIds = new Set<string>();
  const allCaseIds = [
    ...value.addedCases.map((entry) => entry.caseId),
    ...value.updatedCases.map((entry) => entry.caseId),
    ...value.retiredCases.map((entry) => entry.caseId),
    ...value.unavailableCases.map((entry) => entry.caseId),
  ];
  for (const caseId of allCaseIds) {
    if (seenCaseIds.has(caseId)) {
      issues.push(
        issue(
          "update-duplicate-case",
          caseId,
          `case ${caseId} appears more than once across the change lists`,
        ),
      );
    }
    seenCaseIds.add(caseId);
  }

  for (const transition of value.unavailableCases) {
    if (transition.previousEmbedStatus === "unavailable") {
      issues.push(
        issue(
          "update-embed-status",
          `unavailableCases.${transition.caseId}`,
          "an unavailable transition must record the previously playable embed status",
        ),
      );
    }
  }

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
          "update-review-incomplete",
          "review",
          "an approved update requires a complete approved review with a valid digest",
        ),
      );
    }
  }

  return issues;
}
