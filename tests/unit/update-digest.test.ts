import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeQuarterlyUpdateDigest } from "../../src/lib/cases/update-digest";

const baseline = (): any =>
  JSON.parse(
    readFileSync(
      new URL("../fixtures/updates/valid-baseline.json", import.meta.url),
      "utf8",
    ),
  );

describe("quarterly update digest", () => {
  it("changes with the change lists, summary, and transition digests", () => {
    const base = computeQuarterlyUpdateDigest(baseline());
    const mutations: Array<(update: any) => void> = [
      (u) => (u.summary += " Changed."),
      (u) => (u.addedCases[0].currentClinicalDigest = "1".repeat(64)),
      (u) => (u.addedCases[1].currentVideoSourceDigest = "2".repeat(64)),
      (u) => u.addedCases.pop(),
      (u) =>
        u.retiredCases.push({
          caseId: "CASE-FIC-2026-009",
          previousClinicalDigest: "3".repeat(64),
          previousVideoSourceDigest: "4".repeat(64),
          reason: "Fictional retirement.",
        }),
      (u) =>
        u.updatedCases.push({
          caseId: "CASE-FIC-2026-008",
          previousClinicalDigest: "3".repeat(64),
          currentClinicalDigest: "5".repeat(64),
          previousVideoSourceDigest: "4".repeat(64),
          currentVideoSourceDigest: "6".repeat(64),
          reason: "Fictional caption recheck.",
        }),
    ];
    for (const mutate of mutations) {
      const update = baseline();
      mutate(update);
      expect(computeQuarterlyUpdateDigest(update)).not.toBe(base);
    }
  });

  it("ignores status, review, audit, and nullable publishedAt", () => {
    const base = computeQuarterlyUpdateDigest(baseline());
    const mutations: Array<(update: any) => void> = [
      (u) => (u.status = "approved"),
      (u) =>
        (u.review = {
          status: "approved",
          reviewerName: "Dr. Fictional Reviewer Two",
          reviewerQualification: "Fictional Sports Medicine Physician",
          reviewedAt: "2026-08-05T00:00:00Z",
          reviewedContentDigest: "7".repeat(64),
        }),
      (u) => (u.audit.updatedAt = "2026-08-06T00:00:00Z"),
      (u) => (u.publishedAt = "2026-10-01T00:00:00Z"),
    ];
    for (const mutate of mutations) {
      const update = baseline();
      mutate(update);
      expect(computeQuarterlyUpdateDigest(update)).toBe(base);
    }
  });
});
