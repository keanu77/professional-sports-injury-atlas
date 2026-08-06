/**
 * Read-only boundary around the imported RTP course catalog:
 * - the strict shape of `src/data/professional-course-links.v1.json`
 *   (three explicit mappings, approval pending until a durable decision),
 * - the strict shape of the generated
 *   `src/data/generated/rtp-course-summaries.v1.json` artifact, and
 * - the fail-closed public CTA evaluation that reloads, reparses, and
 *   rehashes the `CourseLinkApprovalDecisionV1` artifact. Record-local
 *   approval fields alone never qualify a public link.
 */

import { z } from "astro/zod";
import {
  canonicalJson,
  CanonicalJsonError,
  compareCodePoints,
  isValidIsoDate,
  isValidUtcTimestamp,
  issue,
  parseStrictJson,
  SHA256_RE,
  type ValidationIssue,
} from "../contracts/canonical";
import {
  courseLinkDecisionPathFor,
  HTTPS_URL_RE,
  parseCourseLinkApprovalDecisionBytes,
  SLUG_RE,
} from "./course-link-decision";

export const COURSE_LINKS_DATA_PATH =
  "src/data/professional-course-links.v1.json";
export const RTP_COURSE_SUMMARIES_DATA_PATH =
  "src/data/generated/rtp-course-summaries.v1.json";

/** The only course-link mappings this site defines, sorted ascending. */
export const EXPECTED_COURSE_LINK_KEYS = [
  "achilles-primary-repair",
  "acl-primary-reconstruction",
  "ankle-lateral-nonoperative",
] as const;

const slug = z.string().regex(SLUG_RE);
const sha256 = z.string().regex(SHA256_RE);
const httpsUrl = z.string().regex(HTTPS_URL_RE);
const trimmedNonEmpty = z
  .string()
  .min(1)
  .refine((value) => value === value.trim() && value.trim().length > 0, {
    message: "must be trimmed and non-empty",
  });
const utcTimestamp = z
  .string()
  .refine(isValidUtcTimestamp, { message: "must be a valid UTC timestamp" });
const isoDate = z
  .string()
  .refine(isValidIsoDate, { message: "must be a valid ISO date" });
const nonEmpty = z.string().min(1).regex(/\S/);

const pendingLinkApprovalSchema = z.strictObject({
  status: z.literal("pending"),
  approvedPublicUrl: z.null(),
  approvedBy: z.null(),
  approvedAt: z.null(),
  approvedCatalogContentDigest: z.null(),
  policyVersion: z.null(),
  decisionPath: z.null(),
  decisionDigest: z.null(),
});

const approvedLinkApprovalSchema = z.strictObject({
  status: z.literal("approved"),
  approvedPublicUrl: httpsUrl,
  approvedBy: trimmedNonEmpty,
  approvedAt: utcTimestamp,
  approvedCatalogContentDigest: sha256,
  policyVersion: trimmedNonEmpty,
  decisionPath: trimmedNonEmpty,
  decisionDigest: sha256,
});

export const courseLinkSchema = z.strictObject({
  key: slug,
  injuryCode: slug,
  catalogSlug: slug,
  scopeNote: trimmedNonEmpty,
  linkApproval: z.discriminatedUnion("status", [
    pendingLinkApprovalSchema,
    approvedLinkApprovalSchema,
  ]),
});

export const professionalCourseLinksSchema = z.strictObject({
  schemaVersion: z.literal(1),
  links: z.array(courseLinkSchema).min(1),
});

export type ProfessionalCourseLink = z.infer<typeof courseLinkSchema>;
export type ProfessionalCourseLinks = z.infer<
  typeof professionalCourseLinksSchema
>;

export function validateProfessionalCourseLinks(
  value: unknown,
): ValidationIssue[] {
  const parsed = professionalCourseLinksSchema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((zodIssue) =>
      issue("course-links-schema", zodIssue.path.join("."), zodIssue.message),
    );
  }
  const issues: ValidationIssue[] = [];
  const { links } = parsed.data;
  for (const field of ["key", "injuryCode", "catalogSlug"] as const) {
    const seen = new Set<string>();
    links.forEach((link, index) => {
      if (seen.has(link[field])) {
        issues.push(
          issue(
            "course-links-duplicate",
            `links[${index}].${field}`,
            `duplicate ${field} ${JSON.stringify(link[field])}`,
          ),
        );
      }
      seen.add(link[field]);
    });
  }
  const actualKeys = [...new Set(links.map((link) => link.key))].sort(
    compareCodePoints,
  );
  if (
    actualKeys.length !== EXPECTED_COURSE_LINK_KEYS.length ||
    actualKeys.some((key, index) => key !== EXPECTED_COURSE_LINK_KEYS[index])
  ) {
    issues.push(
      issue(
        "course-links-key-set",
        "links",
        `course-link keys must be exactly ${EXPECTED_COURSE_LINK_KEYS.join(", ")}`,
      ),
    );
  }
  links.forEach((link, index) => {
    if (
      link.linkApproval.status === "approved" &&
      link.linkApproval.decisionPath !== courseLinkDecisionPathFor(link.key)
    ) {
      issues.push(
        issue(
          "course-links-decision-path",
          `links[${index}].linkApproval.decisionPath`,
          `approved link must reference ${courseLinkDecisionPathFor(link.key)}`,
        ),
      );
    }
  });
  return issues;
}

const statementSchema = z.strictObject({
  id: nonEmpty,
  text: nonEmpty,
  referenceIds: z.array(nonEmpty).min(1),
  evidenceDataIds: z.array(nonEmpty).min(1),
});

const reviewerSchema = z.strictObject({
  id: trimmedNonEmpty,
  name: trimmedNonEmpty,
  qualification: trimmedNonEmpty,
  profileUrl: httpsUrl,
});

const sourceReviewProvenanceSchema = z.strictObject({
  algorithm: z.literal("sha256"),
  digest: sha256,
  scope: trimmedNonEmpty,
});

const medicalReviewSummarySchema = z.strictObject({
  status: z.enum(["pending", "approved", "rejected"]),
  reviewer: reviewerSchema.optional(),
  reviewedAt: nonEmpty.optional(),
  approvedContentDigest: sha256.optional(),
  sourceReviewProvenance: sourceReviewProvenanceSchema.optional(),
});

const indexingAuthorizationSummarySchema = z.strictObject({
  status: z.enum(["not-requested", "pending", "authorized", "revoked"]),
  authorizedById: trimmedNonEmpty.optional(),
  authorizedByName: trimmedNonEmpty.optional(),
  authorizedAt: nonEmpty.optional(),
  approvedContentDigest: sha256.optional(),
  note: nonEmpty.optional(),
});

const courseGovernanceSummarySchema = z.strictObject({
  medicalReview: medicalReviewSummarySchema,
  allowIndexing: z.boolean(),
  evidenceVerifiedAt: isoDate.optional(),
  indexingAuthorization: indexingAuthorizationSummarySchema,
});

const courseTaxonomySummarySchema = z.strictObject({
  primaryBodyRegion: nonEmpty,
  structures: z.array(nonEmpty).min(1),
  carePathway: z.enum(["operative", "nonoperative", "mixed"]),
  episode: z.enum(["acute", "postoperative", "other"]),
});

export const rtpCourseSummarySchema = z.strictObject({
  slug,
  contentDigest: sha256,
  titleZh: nonEmpty,
  titleEn: nonEmpty.optional(),
  subtitle: nonEmpty,
  contentUpdatedAt: isoDate,
  taxonomy: courseTaxonomySummarySchema,
  patientSummary: statementSchema,
  appliesTo: z.array(statementSchema).min(1),
  keyExclusions: z.array(statementSchema).min(1),
  returnGoal: statementSchema,
  searchAliases: z.array(nonEmpty).min(1),
  governance: courseGovernanceSummarySchema,
});

export const rtpCourseSummariesSchema = z.strictObject({
  schemaVersion: z.literal(1),
  courses: z.array(rtpCourseSummarySchema).min(1),
});

export type RtpCourseSummary = z.infer<typeof rtpCourseSummarySchema>;
export type RtpCourseSummaries = z.infer<typeof rtpCourseSummariesSchema>;

export function validateRtpCourseSummaries(value: unknown): ValidationIssue[] {
  const parsed = rtpCourseSummariesSchema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((zodIssue) =>
      issue(
        "course-summaries-schema",
        zodIssue.path.join("."),
        zodIssue.message,
      ),
    );
  }
  const issues: ValidationIssue[] = [];
  const slugs = parsed.data.courses.map((course) => course.slug);
  for (let i = 1; i < slugs.length; i += 1) {
    if (compareCodePoints(slugs[i - 1] as string, slugs[i] as string) >= 0) {
      issues.push(
        issue(
          "course-summaries-order",
          `courses[${i}].slug`,
          "courses must be sorted by slug ascending without duplicates",
        ),
      );
    }
  }
  return issues;
}

export interface ParsedRtpCourseSummaries {
  summaries: RtpCourseSummaries | null;
  issues: ValidationIssue[];
}

/** Strict, canonical-bytes-only parse of the generated summaries artifact. */
export function parseRtpCourseSummariesBytes(
  bytes: Uint8Array | string,
): ParsedRtpCourseSummaries {
  let text: string;
  if (typeof bytes === "string") {
    text = bytes;
  } else {
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return {
        summaries: null,
        issues: [
          issue("course-summaries-parse", "", "artifact bytes are not UTF-8"),
        ],
      };
    }
  }
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    const message =
      error instanceof CanonicalJsonError ? error.message : String(error);
    return {
      summaries: null,
      issues: [issue("course-summaries-parse", "", message)],
    };
  }
  const issues: ValidationIssue[] = [];
  if (canonicalJson(parsed) !== text) {
    issues.push(
      issue(
        "course-summaries-not-canonical",
        "",
        "artifact bytes must be exact canonical JSON",
      ),
    );
  }
  issues.push(...validateRtpCourseSummaries(parsed));
  if (issues.length > 0) return { summaries: null, issues };
  return { summaries: parsed as RtpCourseSummaries, issues };
}

interface GovernedCourse {
  contentDigest: string;
  governance: z.infer<typeof courseGovernanceSummarySchema>;
}

/**
 * Structural consistency of upstream governance against the current course
 * content digest. An approved review or authorization with missing identity,
 * missing time, a stale content digest, or stale source-review provenance is
 * a defect regardless of publication intent.
 */
export function validateCourseGovernanceConsistency(
  course: GovernedCourse,
  path: string,
  options: { expectedSourceDigest?: string } = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fail = (subPath: string, message: string): void => {
    issues.push(issue("course-governance", `${path}.${subPath}`, message));
  };
  const { medicalReview, allowIndexing, indexingAuthorization } =
    course.governance;
  if (medicalReview.status === "approved") {
    if (!medicalReview.reviewer) {
      fail(
        "medicalReview.reviewer",
        "approved medical review requires a complete reviewer identity",
      );
    }
    if (!medicalReview.reviewedAt) {
      fail(
        "medicalReview.reviewedAt",
        "approved medical review requires a review time",
      );
    }
    if (medicalReview.approvedContentDigest !== course.contentDigest) {
      fail(
        "medicalReview.approvedContentDigest",
        "approved medical review digest must match the current course contentDigest",
      );
    }
    if (!medicalReview.sourceReviewProvenance) {
      fail(
        "medicalReview.sourceReviewProvenance",
        "approved medical review requires source-review provenance",
      );
    } else if (
      options.expectedSourceDigest !== undefined &&
      medicalReview.sourceReviewProvenance.digest !==
        options.expectedSourceDigest
    ) {
      fail(
        "medicalReview.sourceReviewProvenance.digest",
        "source-review provenance is stale for the current source digest",
      );
    }
  }
  if (allowIndexing && indexingAuthorization.status !== "authorized") {
    fail(
      "indexingAuthorization.status",
      "allowIndexing requires an authorized indexing authorization",
    );
  }
  if (indexingAuthorization.status === "authorized") {
    if (!indexingAuthorization.authorizedById) {
      fail(
        "indexingAuthorization.authorizedById",
        "authorized indexing requires authorizedById",
      );
    }
    if (!indexingAuthorization.authorizedByName) {
      fail(
        "indexingAuthorization.authorizedByName",
        "authorized indexing requires authorizedByName",
      );
    }
    if (!indexingAuthorization.authorizedAt) {
      fail(
        "indexingAuthorization.authorizedAt",
        "authorized indexing requires authorizedAt",
      );
    }
    if (indexingAuthorization.approvedContentDigest !== course.contentDigest) {
      fail(
        "indexingAuthorization.approvedContentDigest",
        "indexing authorization digest must match the current course contentDigest",
      );
    }
  }
  return issues;
}

/**
 * Upstream public eligibility for one imported course. A URL decision never
 * substitutes for these course-content approvals.
 */
export function evaluateUpstreamPublicEligibility(
  course: RtpCourseSummary,
): ValidationIssue[] {
  const issues = validateCourseGovernanceConsistency(course, "governance");
  const fail = (path: string, message: string): void => {
    issues.push(issue("upstream-eligibility", path, message));
  };
  if (course.governance.medicalReview.status !== "approved") {
    fail(
      "governance.medicalReview.status",
      "public CTA requires an approved upstream medical review",
    );
  }
  if (course.governance.allowIndexing !== true) {
    fail(
      "governance.allowIndexing",
      "public CTA requires upstream allowIndexing",
    );
  }
  if (course.governance.indexingAuthorization.status !== "authorized") {
    fail(
      "governance.indexingAuthorization.status",
      "public CTA requires an authorized upstream indexing authorization",
    );
  }
  return issues;
}

export interface PublicCourseLinkInput {
  link: ProfessionalCourseLink;
  course: RtpCourseSummary;
  /** Freshly reloaded decision artifact bytes; null when absent. */
  decisionBytes: Uint8Array | string | null;
  /** Path the decision bytes were actually loaded from; null when absent. */
  decisionPath: string | null;
  /** The site-governance `courseLinkPolicyVersion` in force right now. */
  courseLinkPolicyVersion: string;
}

/**
 * Fail-closed public CTA evaluation. Empty result means the link may be
 * rendered publicly; any issue keeps the course link disabled/pending.
 */
export function evaluatePublicCourseLink(
  input: PublicCourseLinkInput,
): ValidationIssue[] {
  const { link, course, decisionBytes, decisionPath, courseLinkPolicyVersion } =
    input;
  const issues: ValidationIssue[] = [];
  if (link.catalogSlug !== course.slug) {
    issues.push(
      issue(
        "cta-mapping-mismatch",
        "link.catalogSlug",
        "mapping does not target the supplied course summary",
      ),
    );
  }
  if (link.linkApproval.status !== "approved") {
    issues.push(
      issue(
        "cta-link-not-approved",
        "link.linkApproval.status",
        "link approval is pending; a durable decision is required",
      ),
    );
    return issues;
  }
  const approval = link.linkApproval;
  if (decisionBytes === null || decisionPath === null) {
    issues.push(
      issue(
        "cta-decision-missing",
        "decision",
        "record-local approval fields alone never qualify; the durable decision artifact is required",
      ),
    );
    return issues;
  }
  const parsed = parseCourseLinkApprovalDecisionBytes(decisionBytes);
  issues.push(...parsed.issues);
  if (parsed.decision === null) return issues;
  const decision = parsed.decision;
  if (parsed.decisionDigest !== approval.decisionDigest) {
    issues.push(
      issue(
        "cta-decision-digest-mismatch",
        "decision",
        "decision byte digest differs from the recorded decisionDigest",
      ),
    );
  }
  const durablePath = courseLinkDecisionPathFor(link.key);
  if (decisionPath !== durablePath || approval.decisionPath !== durablePath) {
    issues.push(
      issue(
        "cta-decision-path-mismatch",
        "decision",
        `decision must be loaded from ${durablePath}`,
      ),
    );
  }
  const exact = (
    path: string,
    decisionValue: string,
    recordValue: string,
  ): void => {
    if (decisionValue !== recordValue) {
      issues.push(
        issue(
          "cta-decision-field-mismatch",
          path,
          "decision and link approval record disagree",
        ),
      );
    }
  };
  if (
    decision.courseKey !== link.key ||
    decision.injuryCode !== link.injuryCode ||
    decision.catalogSlug !== link.catalogSlug
  ) {
    issues.push(
      issue(
        "cta-mapping-mismatch",
        "decision",
        "decision does not name this exact mapping",
      ),
    );
  }
  if (
    decision.catalogContentDigest !== course.contentDigest ||
    approval.approvedCatalogContentDigest !== course.contentDigest
  ) {
    issues.push(
      issue(
        "cta-catalog-digest-stale",
        "decision.catalogContentDigest",
        "catalog content changed since approval; a new named decision is required",
      ),
    );
  }
  if (
    decision.linkPolicyVersion !== courseLinkPolicyVersion ||
    approval.policyVersion !== courseLinkPolicyVersion
  ) {
    issues.push(
      issue(
        "cta-policy-mismatch",
        "decision.linkPolicyVersion",
        "link policy version changed since approval; a new named decision is required",
      ),
    );
  }
  exact("publicUrl", decision.publicUrl, approval.approvedPublicUrl);
  exact("approvedBy", decision.approvedBy, approval.approvedBy);
  exact("approvedAt", decision.approvedAt, approval.approvedAt);
  issues.push(...evaluateUpstreamPublicEligibility(course));
  return issues;
}
