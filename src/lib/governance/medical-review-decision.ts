/**
 * Durable site-level medical-review decision. Only a hosting-specific plan
 * may create/apply it after the complete served review artifact is verified;
 * agents cannot self-sign or infer approval. Applying it copies only the
 * exact workflow fields represented in the decision, and the public gate
 * later reloads it, recomputes every digest, and compares each applied
 * reviewer/status/classic-approver field to the durable decision —
 * record-local approval fields alone are never sufficient.
 */

import { z } from "astro/zod";
import {
  canonicalJson,
  CanonicalJsonError,
  compareCodePoints,
  isValidUtcTimestamp,
  issue,
  parseStrictJson,
  SHA256_RE,
  sha256Hex,
  type ValidationIssue,
} from "../contracts/canonical";
import { computeCaseContentDigest } from "../cases/digest";
import { computeInjuryOverviewDigest } from "../cases/injury-overview-digest";
import { computeQuarterlyUpdateDigest } from "../cases/update-digest";
import type { InjuryCase } from "../contracts/case";
import type { InjuryOverview } from "../contracts/injury-overview";
import type { QuarterlyUpdate } from "../contracts/update";
import {
  REVIEW_SET_REQUEST_PATH,
  type ArtifactManifest,
} from "./artifact-manifest";
import type { AnyReviewSetManifest } from "./review-set";
import {
  validateServedArtifactReceipt,
  type ServedArtifactReceipt,
} from "./served-artifact-receipt";

const sha256Lower = z.string().regex(SHA256_RE);
const nonEmpty = z.string().min(1);
const trimmedNonEmpty = z
  .string()
  .min(1)
  .refine((value) => value === value.trim(), {
    message: "must be trimmed and non-empty",
  });
const utcTimestamp = z
  .string()
  .refine(isValidUtcTimestamp, { message: "must be a valid UTC timestamp" });

export const medicalReviewCaseDecisionSchema = z.strictObject({
  caseId: nonEmpty,
  clinicalDigest: sha256Lower,
  status: z.enum(["approved", "rejected"]),
  classicExceptionApprovedBy: trimmedNonEmpty.nullable(),
});

export const medicalReviewOverviewDecisionSchema = z.strictObject({
  injuryCode: nonEmpty,
  overviewDigest: sha256Lower,
  status: z.enum(["approved", "rejected"]),
});

export const medicalReviewDecisionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  decisionType: z.literal("site-medical-review"),
  decisionStatus: z.literal("approved"),
  reviewerName: trimmedNonEmpty,
  reviewerQualification: trimmedNonEmpty,
  reviewedAt: utcTimestamp,
  reviewSetDigest: sha256Lower,
  privateDistManifestDigest: sha256Lower,
  servedReviewArtifactReceiptDigest: sha256Lower,
  reviewSetResponseSha256: sha256Lower,
  privateUrlHash: sha256Lower,
  deploymentIdHash: sha256Lower,
  caseDecisions: z.array(medicalReviewCaseDecisionSchema),
  overviewDecisions: z.array(medicalReviewOverviewDecisionSchema),
  updateDecision: z
    .strictObject({
      updateId: nonEmpty,
      updateDigest: sha256Lower,
      status: z.literal("approved"),
    })
    .nullable(),
});
export type MedicalReviewDecisionV1 = z.infer<
  typeof medicalReviewDecisionSchema
>;

export interface ParsedMedicalReviewDecision {
  decision: MedicalReviewDecisionV1 | null;
  decisionDigest: string;
  issues: ValidationIssue[];
}

/** Strict canonical-bytes parse of a durable medical-review decision. */
export function parseMedicalReviewDecisionBytes(
  bytes: Uint8Array | string,
): ParsedMedicalReviewDecision {
  const decisionDigest = sha256Hex(bytes);
  const text =
    typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      decision: null,
      decisionDigest,
      issues: [
        issue(
          "medical-decision-parse",
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
        "medical-decision-not-canonical",
        "",
        "decision bytes must be exact canonical JSON",
      ),
    );
  }
  const result = medicalReviewDecisionSchema.safeParse(parsed);
  if (!result.success) {
    issues.push(
      ...result.error.issues.map((zodIssue) =>
        issue(
          "medical-decision-schema",
          zodIssue.path.join("."),
          zodIssue.message,
        ),
      ),
    );
  }
  if (issues.length > 0 || !result.success) {
    return { decision: null, decisionDigest, issues };
  }
  return { decision: result.data, decisionDigest, issues };
}

export interface MedicalReviewArtifactContext {
  reviewSetManifest: AnyReviewSetManifest;
  reviewSetDigest: string;
  /** Exact canonical review-set bytes served at the review-only route. */
  reviewSetBytes: Uint8Array | string;
  artifactManifest: ArtifactManifest;
  artifactManifestDigest: string;
  servedReceipt: unknown;
  servedReceiptDigest: string;
}

/**
 * medical-review-decision.v1 predates pending follow-up drafts. It may only
 * consume historical review-set v1 and must never treat a v2 pending set as
 * physician approval.
 */
export function validateMedicalReviewDecisionV1ReviewSet(
  reviewSet: AnyReviewSetManifest,
): ValidationIssue[] {
  return reviewSet.schemaVersion === 1
    ? []
    : [
        issue(
          "medical-decision-review-set-version",
          "schemaVersion",
          "medical-review-decision.v1 cannot consume review-set v2 pending follow-ups",
        ),
      ];
}

/**
 * Reloads the artifact manifest/receipt and requires complete path coverage,
 * zero byte/metadata mismatches, and matching deployment/URL/review-set
 * identities. A served artifact whose case HTML page changed while retaining
 * the correct review-set JSON must fail here.
 */
export function validateMedicalReviewDecisionArtifacts(
  decision: MedicalReviewDecisionV1,
  context: MedicalReviewArtifactContext,
): ValidationIssue[] {
  const issues = validateMedicalReviewDecisionV1ReviewSet(
    context.reviewSetManifest,
  );
  if (context.reviewSetManifest.schemaVersion !== 1) return issues;
  if (decision.reviewSetDigest !== context.reviewSetDigest) {
    issues.push(
      issue(
        "medical-decision-review-set",
        "reviewSetDigest",
        "decision does not bind the current canonical review-set digest",
      ),
    );
  }
  if (decision.reviewSetResponseSha256 !== sha256Hex(context.reviewSetBytes)) {
    issues.push(
      issue(
        "medical-decision-review-set-response",
        "reviewSetResponseSha256",
        "decision does not bind the exact served review-set response bytes",
      ),
    );
  }
  if (decision.privateDistManifestDigest !== context.artifactManifestDigest) {
    issues.push(
      issue(
        "medical-decision-manifest",
        "privateDistManifestDigest",
        "decision does not bind the exact private dist manifest digest",
      ),
    );
  }
  if (
    context.artifactManifest.reviewSetDigest !== context.reviewSetDigest ||
    context.artifactManifest.reviewSetResponseSha256 !==
      sha256Hex(context.reviewSetBytes) ||
    context.artifactManifest.rendererTreeDigest !==
      context.reviewSetManifest.rendererTreeDigest
  ) {
    issues.push(
      issue(
        "medical-decision-manifest-review-set",
        "privateDistManifestDigest",
        "private manifest does not bind the current review-set identity and exact bytes",
      ),
    );
  }
  if (
    decision.servedReviewArtifactReceiptDigest !== context.servedReceiptDigest
  ) {
    issues.push(
      issue(
        "medical-decision-receipt",
        "servedReviewArtifactReceiptDigest",
        "decision does not bind the exact served-review-artifact receipt digest",
      ),
    );
  }
  const receiptIssues = validateServedArtifactReceipt(
    context.servedReceipt,
    context.artifactManifest,
    context.artifactManifestDigest,
  );
  issues.push(...receiptIssues);
  if (receiptIssues.length === 0) {
    const receipt = context.servedReceipt as ServedArtifactReceipt;
    if (receipt.privateOriginHash !== decision.privateUrlHash) {
      issues.push(
        issue(
          "medical-decision-url",
          "privateUrlHash",
          "decision private URL hash does not match the served receipt",
        ),
      );
    }
    if (receipt.deploymentIdHash !== decision.deploymentIdHash) {
      issues.push(
        issue(
          "medical-decision-deployment",
          "deploymentIdHash",
          "decision deployment-ID hash does not match the served receipt",
        ),
      );
    }
    if (receipt.reviewSetResponseSha256 !== decision.reviewSetResponseSha256) {
      issues.push(
        issue(
          "medical-decision-review-set-response",
          "reviewSetResponseSha256",
          "receipt review-set response hash does not match the decision",
        ),
      );
    }
    const servedReviewSet = receipt.authorizedResponses.find(
      (response) => response.requestPath === REVIEW_SET_REQUEST_PATH,
    );
    if (
      servedReviewSet === undefined ||
      servedReviewSet.decodedSha256 !== decision.reviewSetResponseSha256
    ) {
      issues.push(
        issue(
          "medical-decision-review-set-response",
          REVIEW_SET_REQUEST_PATH,
          "the served review-set response bytes do not match the decision",
        ),
      );
    }
  }
  return issues;
}

/**
 * Requires the decision's explicit selections to cover the review set
 * completely and to match every applied workflow field on the current
 * records: reviewer identity/qualification/date, review digest, status, and
 * classic exception approvals.
 */
export function validateAppliedMedicalReviewDecision(
  decision: MedicalReviewDecisionV1,
  reviewSet: AnyReviewSetManifest,
  cases: readonly InjuryCase[],
  overviews: readonly InjuryOverview[],
  currentUpdate: QuarterlyUpdate | null,
): ValidationIssue[] {
  const issues = validateMedicalReviewDecisionV1ReviewSet(reviewSet);
  if (reviewSet.schemaVersion !== 1) return issues;

  const decisionCaseIds = decision.caseDecisions
    .map((entry) => entry.caseId)
    .sort(compareCodePoints);
  const reviewSetCaseIds = reviewSet.cases
    .map((entry) => entry.caseId)
    .sort(compareCodePoints);
  if (
    decisionCaseIds.length !== reviewSetCaseIds.length ||
    decisionCaseIds.some((caseId, index) => caseId !== reviewSetCaseIds[index])
  ) {
    issues.push(
      issue(
        "medical-decision-case-coverage",
        "caseDecisions",
        "decision case list must exactly cover the review-set case IDs",
      ),
    );
  }

  const caseById = new Map(cases.map((record) => [record.id, record]));
  for (const caseDecision of decision.caseDecisions) {
    const location = `caseDecisions.${caseDecision.caseId}`;
    const record = caseById.get(caseDecision.caseId);
    if (record === undefined) {
      issues.push(
        issue(
          "medical-decision-case-missing",
          location,
          "decided case is absent from the current content set",
        ),
      );
      continue;
    }
    const currentDigest = computeCaseContentDigest(record);
    if (caseDecision.clinicalDigest !== currentDigest) {
      issues.push(
        issue(
          "medical-decision-case-digest",
          location,
          "decided clinical digest does not match the current case payload",
        ),
      );
      continue;
    }
    if (caseDecision.status === "approved") {
      const review = record.review;
      if (
        record.status !== "approved" ||
        review.status !== "approved" ||
        review.reviewerName !== decision.reviewerName ||
        review.reviewerQualification !== decision.reviewerQualification ||
        review.reviewedAt !== decision.reviewedAt ||
        review.reviewedContentDigest !== caseDecision.clinicalDigest
      ) {
        issues.push(
          issue(
            "medical-decision-applied-mismatch",
            location,
            "applied case workflow fields do not exactly match the durable decision",
          ),
        );
      }
      if (
        record.classicExceptionApprovedBy !==
        caseDecision.classicExceptionApprovedBy
      ) {
        issues.push(
          issue(
            "medical-decision-classic-approver",
            location,
            "applied classic exception approver does not match the durable decision",
          ),
        );
      }
    } else if (record.status === "approved") {
      issues.push(
        issue(
          "medical-decision-applied-mismatch",
          location,
          "a case rejected by the durable decision may not remain approved",
        ),
      );
    }
  }

  const decisionOverviewCodes = decision.overviewDecisions
    .map((entry) => entry.injuryCode)
    .sort(compareCodePoints);
  const reviewSetOverviewCodes = reviewSet.overviews
    .map((entry) => entry.injuryCode)
    .sort(compareCodePoints);
  if (
    decisionOverviewCodes.length !== reviewSetOverviewCodes.length ||
    decisionOverviewCodes.some(
      (code, index) => code !== reviewSetOverviewCodes[index],
    )
  ) {
    issues.push(
      issue(
        "medical-decision-overview-coverage",
        "overviewDecisions",
        "decision overview list must exactly cover the review-set overviews",
      ),
    );
  }
  const overviewByCode = new Map(
    overviews.map((overview) => [overview.injuryCode, overview]),
  );
  for (const overviewDecision of decision.overviewDecisions) {
    const location = `overviewDecisions.${overviewDecision.injuryCode}`;
    const overview = overviewByCode.get(overviewDecision.injuryCode);
    if (overview === undefined) {
      issues.push(
        issue(
          "medical-decision-overview-missing",
          location,
          "decided overview is absent from the current content set",
        ),
      );
      continue;
    }
    const currentDigest = computeInjuryOverviewDigest(overview);
    if (overviewDecision.overviewDigest !== currentDigest) {
      issues.push(
        issue(
          "medical-decision-overview-digest",
          location,
          "decided overview digest does not match the current overview payload",
        ),
      );
      continue;
    }
    if (overviewDecision.status === "approved") {
      const review = overview.review;
      if (
        overview.status !== "approved" ||
        review.status !== "approved" ||
        review.reviewerName !== decision.reviewerName ||
        review.reviewerQualification !== decision.reviewerQualification ||
        review.reviewedAt !== decision.reviewedAt ||
        review.reviewedContentDigest !== overviewDecision.overviewDigest
      ) {
        issues.push(
          issue(
            "medical-decision-applied-mismatch",
            location,
            "applied overview workflow fields do not exactly match the durable decision",
          ),
        );
      }
    }
  }

  const reviewSetUpdate = reviewSet.currentUpdate;
  if (
    (decision.updateDecision === null) !== (reviewSetUpdate === null) ||
    (decision.updateDecision !== null &&
      reviewSetUpdate !== null &&
      (decision.updateDecision.updateId !== reviewSetUpdate.updateId ||
        decision.updateDecision.updateDigest !== reviewSetUpdate.updateDigest))
  ) {
    issues.push(
      issue(
        "medical-decision-update-binding",
        "updateDecision",
        "decision update binding must exactly match the review-set current update",
      ),
    );
  }
  if (decision.updateDecision !== null) {
    const location = `updateDecision.${decision.updateDecision.updateId}`;
    if (
      currentUpdate === null ||
      currentUpdate.id !== decision.updateDecision.updateId
    ) {
      issues.push(
        issue(
          "medical-decision-update-missing",
          location,
          "decided update is absent from the current content set",
        ),
      );
    } else {
      const currentDigest = computeQuarterlyUpdateDigest(currentUpdate);
      if (decision.updateDecision.updateDigest !== currentDigest) {
        issues.push(
          issue(
            "medical-decision-update-digest",
            location,
            "decided update digest does not match the current update payload",
          ),
        );
      } else {
        const review = currentUpdate.review;
        if (
          currentUpdate.status !== "approved" ||
          review.status !== "approved" ||
          review.reviewerName !== decision.reviewerName ||
          review.reviewerQualification !== decision.reviewerQualification ||
          review.reviewedAt !== decision.reviewedAt ||
          review.reviewedContentDigest !== currentDigest
        ) {
          issues.push(
            issue(
              "medical-decision-applied-mismatch",
              location,
              "applied update workflow fields do not exactly match the durable decision",
            ),
          );
        }
      }
    }
  }

  return issues;
}
