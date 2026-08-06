/**
 * Digest-bound review and rights validation. `validateCaseForApproval()` is
 * the only approval validator used by selectors or release gates.
 */

import {
  computeCaseContentDigest,
  computeVideoIdentityDigest,
  computeVideoSourceDigest,
} from "./digest";
import { issue, type ValidationIssue } from "../contracts/canonical";
import type { InjuryCase } from "../contracts/case";
import { validateCaseApprovalPrerequisites } from "../contracts/cross-validation";
import {
  CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
  CURRENT_SOURCE_POLICY_VERSION,
} from "../contracts/site-governance";

/**
 * True only when the review is approved with named reviewer fields and a
 * digest matching the current case clinical payload.
 */
export function hasMatchingApprovedReview(record: InjuryCase): boolean {
  const review = record.review;
  return (
    review.status === "approved" &&
    review.reviewerName !== null &&
    review.reviewerQualification !== null &&
    review.reviewedAt !== null &&
    review.reviewedContentDigest === computeCaseContentDigest(record)
  );
}

/**
 * True only when public rights are cleared under the current policy version
 * with a digest matching the current canonical video-source payload.
 */
export function hasMatchingPublicRightsClearance(record: InjuryCase): boolean {
  const rights = record.video.publicRightsReview;
  return (
    rights.status === "cleared" &&
    rights.reviewedBy !== null &&
    rights.reviewedAt !== null &&
    rights.termsCheckedAt !== null &&
    rights.decisionBasis !== null &&
    rights.decisionPath !== null &&
    rights.decisionDigest !== null &&
    rights.policyVersion === CURRENT_PUBLIC_RIGHTS_POLICY_VERSION &&
    rights.reviewedVideoDigest === computeVideoSourceDigest(record)
  );
}

/** True when verified provenance is current for policy and video identity. */
export function hasCurrentProvenanceVerification(record: InjuryCase): boolean {
  const provenance = record.video.sourceProvenanceVerification;
  return (
    provenance.status === "verified" &&
    provenance.verifiedPolicyVersion === CURRENT_SOURCE_POLICY_VERSION &&
    provenance.reviewedVideoIdentityDigest ===
      computeVideoIdentityDigest(record)
  );
}

/**
 * Combines the Task 1 approval prerequisites with the digest-currency rules:
 * matching approved review digest and policy/identity-current provenance.
 * Public-rights clearance is deliberately not required here.
 */
export function validateCaseForApproval(record: InjuryCase): ValidationIssue[] {
  const issues = validateCaseApprovalPrerequisites(record);
  if (record.status !== "approved") {
    issues.push(
      issue(
        "approval-status",
        "status",
        "only status='approved' cases are medically approved",
      ),
    );
  }
  if (!hasMatchingApprovedReview(record)) {
    issues.push(
      issue(
        "approval-review-digest-stale",
        "review.reviewedContentDigest",
        "an approved review must bind the current case clinical payload digest",
      ),
    );
  }
  if (!hasCurrentProvenanceVerification(record)) {
    issues.push(
      issue(
        "approval-provenance-stale",
        "video.sourceProvenanceVerification",
        "provenance verification must bind the current source-policy version and video-identity digest",
      ),
    );
  }
  return issues;
}
