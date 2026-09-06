/**
 * Deterministic case selectors. Astro components never duplicate approval
 * logic; G5 counts use only the medically approved selector and public gates
 * use only the public selector.
 */

import { isLaunchEnabled, launchCaseAllowed } from "../patient/public-launch";

import {
  hasMatchingPublicRightsClearance,
  validateCaseForApproval,
} from "./review-validation";
import type { CaseStatus, InjuryCase } from "../contracts/case";
import { findVideoProvider } from "../contracts/taxonomy";

const REVIEW_VISIBLE_STATUSES: readonly CaseStatus[] = [
  "draft",
  "source-verified",
  "medical-review",
  "approved",
];

const WORKFLOW_STATE_LABELS: Record<CaseStatus, string> = {
  draft: "草稿",
  "source-verified": "來源已驗證",
  "medical-review": "醫療審查中",
  approved: "已核准",
  rejected: "已退回",
  retired: "已下架",
};

/** Sort by eventDate descending, then slug ascending. */
function sortCases(records: InjuryCase[]): InjuryCase[] {
  return [...records].sort((a, b) => {
    if (a.eventDate !== b.eventDate) return a.eventDate < b.eventDate ? 1 : -1;
    if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1;
    return 0;
  });
}

/** Review build: draft, source-verified, medical-review, and approved cases. */
export function selectReviewCases(records: InjuryCase[]): InjuryCase[] {
  return sortCases(
    records.filter((record) => REVIEW_VISIBLE_STATUSES.includes(record.status)),
  );
}

/** Review-only label for each workflow state; never shown as a diagnosis. */
export function labelCaseWorkflowState(record: InjuryCase): string {
  return WORKFLOW_STATE_LABELS[record.status];
}

/**
 * Medically approved: approved status, confirmed diagnosis, current
 * provenance binding and matching medical digest — deliberately without
 * requiring public-rights clearance, indexing, or a public URL.
 */
export function selectMedicallyApprovedCases(
  records: InjuryCase[],
): InjuryCase[] {
  return sortCases(
    records.filter((record) => validateCaseForApproval(record).length === 0),
  );
}

/**
 * Public: medically approved plus current cleared public rights and a
 * currently playable or external-link-only video. Unavailable records are
 * excluded from public counts and case lists.
 */
export function selectPublicCases(records: InjuryCase[]): InjuryCase[] {
  return sortCases(
    records.filter(
      (record) =>
        validateCaseForApproval(record).length === 0 &&
        (isLaunchEnabled()
          ? launchCaseAllowed(record)
          : hasMatchingPublicRightsClearance(record)) &&
        (record.video.embedStatus === "verified" ||
          record.video.embedStatus === "external-link-only"),
    ),
  );
}

export function groupCasesByInjury(
  records: InjuryCase[],
): Map<string, InjuryCase[]> {
  const grouped = new Map<string, InjuryCase[]>();
  for (const record of sortCases(records)) {
    const bucket = grouped.get(record.injury.code);
    if (bucket === undefined) grouped.set(record.injury.code, [record]);
    else bucket.push(record);
  }
  return grouped;
}

/**
 * A public in-site embed requires an embed-capable provider, a verified embed,
 * and available captions; anything else degrades to the clearly labeled
 * canonical external link without excluding the case.
 */
export function effectiveVideoRendering(
  record: InjuryCase,
): "embed" | "external-link" {
  const provider = findVideoProvider(record.video.provider);
  if (
    provider !== undefined &&
    provider.canEmbed &&
    record.video.embedStatus === "verified" &&
    record.video.captionStatus === "available"
  ) {
    return "embed";
  }
  return "external-link";
}
