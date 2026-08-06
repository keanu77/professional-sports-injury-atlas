import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  computeInjuryOverviewDigest,
  validateInjuryOverviewForApproval,
} from "../../src/lib/cases/injury-overview-digest";

const overview = (): any =>
  JSON.parse(
    readFileSync(
      new URL(
        "../fixtures/injuries/valid-medical-review.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );

const approvedOverview = (): any => {
  const record = overview();
  record.status = "approved";
  record.review = {
    status: "approved",
    reviewerName: "Dr. Fictional Reviewer Two",
    reviewerQualification: "Fictional Sports Medicine Physician",
    reviewedAt: "2026-08-05T00:00:00Z",
    reviewedContentDigest: computeInjuryOverviewDigest(record),
  };
  return record;
};

describe("injury overview digest", () => {
  it("changes with teaching text, claims, sources, and supports", () => {
    const base = computeInjuryOverviewDigest(overview());
    const mutations: Array<(record: any) => void> = [
      (r) => {
        r.scope += " Changed.";
        r.claims[0].text += " Changed.";
      },
      (r) => (r.claims[1].evidenceIds = ["ov-src-b"]),
      (r) => (r.sources[0].title = "Changed fictional title"),
      (r) => (r.sources[0].supports = r.sources[0].supports.slice(0, 5)),
      (r) => (r.sources[1].url = "https://society.example.org/other"),
    ];
    for (const mutate of mutations) {
      const record = overview();
      mutate(record);
      expect(computeInjuryOverviewDigest(record)).not.toBe(base);
    }
  });

  it("ignores status, review, and audit fields", () => {
    const base = computeInjuryOverviewDigest(overview());
    const approved = approvedOverview();
    expect(computeInjuryOverviewDigest(approved)).toBe(base);
    const audited = overview();
    audited.audit.updatedAt = "2026-08-06T00:00:00Z";
    expect(computeInjuryOverviewDigest(audited)).toBe(base);
  });

  it("approves only a matching named medical-review digest", () => {
    expect(validateInjuryOverviewForApproval(approvedOverview())).toEqual([]);

    const stale = approvedOverview();
    stale.scope += " Drifted.";
    stale.claims[0].text += " Drifted.";
    expect(
      validateInjuryOverviewForApproval(stale).map((issue) => issue.code),
    ).toContain("overview-review-digest-stale");

    const incomplete = approvedOverview();
    incomplete.review.reviewerQualification = null;
    expect(
      validateInjuryOverviewForApproval(incomplete).map((issue) => issue.code),
    ).toContain("overview-review-incomplete");
  });
});
