/**
 * Quarterly-update clinical digest. The payload is an explicit allowlist that
 * excludes `status`, `review`, `audit`, and nullable release metadata
 * `publishedAt`, so applying the durable medical decision cannot change the
 * reviewed digest.
 */

import { canonicalJson, sha256Hex } from "./canonical-json";
import type { QuarterlyUpdate } from "../contracts/update";

export function quarterlyUpdatePayload(update: QuarterlyUpdate): unknown {
  return {
    schemaVersion: update.schemaVersion,
    id: update.id,
    period: {
      year: update.period.year,
      quarter: update.period.quarter,
      startDate: update.period.startDate,
      endDate: update.period.endDate,
    },
    summary: update.summary,
    addedCases: update.addedCases.map((entry) => ({ ...entry })),
    updatedCases: update.updatedCases.map((entry) => ({ ...entry })),
    retiredCases: update.retiredCases.map((entry) => ({ ...entry })),
    unavailableCases: update.unavailableCases.map((entry) => ({ ...entry })),
  };
}

export function computeQuarterlyUpdateDigest(update: QuarterlyUpdate): string {
  return sha256Hex(canonicalJson(quarterlyUpdatePayload(update)));
}
