/**
 * Shared, launch-only G2 count floor for source-manifest generation and
 * validation. Public release keeps its separate 10-per-injury / 30-total gate.
 */

import { issue, type ValidationIssue } from "../contracts/canonical";
import {
  CANDIDATE_INJURY_CODES,
  type CandidateInjuryCode,
} from "./candidate-contract";

export const SOURCE_MANIFEST_BATCH_TYPES = [
  "launch",
  "quarterly",
  "correction",
] as const;
export type SourceManifestBatchType =
  (typeof SOURCE_MANIFEST_BATCH_TYPES)[number];

/** Authorized by the 2026-08-07 G2 threshold-adjustment decision. */
export const G2_LAUNCH_MIN_ENTRIES_PER_INJURY = 7;
/** Authorized by the 2026-08-07 G2 threshold-adjustment decision. */
export const G2_LAUNCH_MIN_ENTRIES_TOTAL = 26;

/** Default launch contract retained from the original G2 plan. */
export const G2_LAUNCH_DEFAULT_MIN_CLASSIC_ENTRIES = 1;
/**
 * Decision 3 authorizes zero classics for this frozen batch only. Keeping the
 * identity explicit prevents the exception from leaking into future launches.
 */
export const NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID = "NBA-SOURCE-2026-08-06-001";

export interface SourceManifestCounts {
  byInjury: Record<CandidateInjuryCode, number>;
  total: number;
}

export interface SourceManifestComposition {
  classic: number;
  recent: number;
}

/**
 * Enforce the initial G2 authoring-handoff floor only for the immutable launch
 * batch. Quarterly and correction batches use their own append contracts.
 */
export function validateG2ManifestCountFloor(
  batchType: SourceManifestBatchType,
  counts: SourceManifestCounts,
): ValidationIssue[] {
  if (batchType !== "launch") return [];

  const issues: ValidationIssue[] = [];
  for (const injuryCode of CANDIDATE_INJURY_CODES) {
    const count = counts.byInjury[injuryCode];
    if (count < G2_LAUNCH_MIN_ENTRIES_PER_INJURY) {
      issues.push(
        issue(
          "manifest-launch-injury-count-shortfall",
          `counts.byInjury.${injuryCode}`,
          `${injuryCode} has ${count} entries; the authorized G2 launch floor is ${G2_LAUNCH_MIN_ENTRIES_PER_INJURY}`,
        ),
      );
    }
  }
  if (counts.total < G2_LAUNCH_MIN_ENTRIES_TOTAL) {
    issues.push(
      issue(
        "manifest-launch-total-count-shortfall",
        "counts.total",
        `launch has ${counts.total} entries; the authorized G2 floor is ${G2_LAUNCH_MIN_ENTRIES_TOTAL}`,
      ),
    );
  }
  return issues;
}

/**
 * Enforce launch composition independently from the count floor. Decision 3
 * changes only classic presence for one immutable batch; recent entries must
 * continue to outnumber classic entries for every launch.
 */
export function validateG2ManifestComposition(
  manifestId: string,
  batchType: SourceManifestBatchType,
  counts: SourceManifestComposition,
): ValidationIssue[] {
  if (batchType !== "launch") return [];

  const issues: ValidationIssue[] = [];
  const minimumClassic =
    manifestId === NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID
      ? 0
      : G2_LAUNCH_DEFAULT_MIN_CLASSIC_ENTRIES;
  if (counts.classic < minimumClassic) {
    issues.push(
      issue(
        "manifest-launch-classic-count-shortfall",
        "counts.classic",
        `launch ${manifestId} has ${counts.classic} classic entries; the G2 launch floor is ${minimumClassic}`,
      ),
    );
  }
  if (counts.recent <= counts.classic) {
    issues.push(
      issue(
        "manifest-launch-recent-not-greater-than-classic",
        "counts.recent",
        `launch has ${counts.recent} recent and ${counts.classic} classic entries; recent entries must outnumber classic entries`,
      ),
    );
  }
  return issues;
}
