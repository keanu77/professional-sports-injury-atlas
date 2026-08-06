/**
 * Injury-overview clinical digest and approval validation. The payload is an
 * explicit allowlist excluding `status`, `review`, and `audit`.
 */

import { canonicalJson, sha256Hex } from "./canonical-json";
import { issue, type ValidationIssue } from "../contracts/canonical";
import {
  OVERVIEW_NARRATIVE_FIELDS,
  validateInjuryOverview,
  type InjuryOverview,
} from "../contracts/injury-overview";

export function injuryOverviewPayload(overview: InjuryOverview): unknown {
  const narrative: Record<string, string> = {};
  for (const field of OVERVIEW_NARRATIVE_FIELDS) {
    narrative[field] = overview[field];
  }
  return {
    schemaVersion: overview.schemaVersion,
    injuryCode: overview.injuryCode,
    titleZh: overview.titleZh,
    summaryZh: overview.summaryZh,
    narrative,
    claims: overview.claims.map((claim) => ({
      id: claim.id,
      field: claim.field,
      text: claim.text,
      evidenceIds: [...claim.evidenceIds],
    })),
    evidenceIds: [...overview.evidenceIds],
    sources: overview.sources.map((source) => ({
      id: source.id,
      type: source.type,
      title: source.title,
      publisher: source.publisher,
      independenceGroup: source.independenceGroup,
      originReportId: source.originReportId,
      url: source.url,
      publishedAt: source.publishedAt,
      supports: [...source.supports],
    })),
  };
}

export function computeInjuryOverviewDigest(overview: InjuryOverview): string {
  return sha256Hex(canonicalJson(injuryOverviewPayload(overview)));
}

/**
 * An approved overview requires the Task 1 structural rules plus its own
 * matching named medical-review digest.
 */
export function validateInjuryOverviewForApproval(
  overview: InjuryOverview,
): ValidationIssue[] {
  const issues = validateInjuryOverview(overview);
  if (issues.length > 0) return issues;
  if (overview.status === "approved" || overview.review.status === "approved") {
    if (
      overview.review.reviewedContentDigest !==
      computeInjuryOverviewDigest(overview)
    ) {
      issues.push(
        issue(
          "overview-review-digest-stale",
          "review.reviewedContentDigest",
          "an approved overview must bind the current overview clinical payload digest",
        ),
      );
    }
  }
  return issues;
}
