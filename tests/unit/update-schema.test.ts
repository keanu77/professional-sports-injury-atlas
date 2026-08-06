import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { updateSchema } from "../../src/lib/contracts/update";
import { validateUpdateStructure } from "../../src/lib/contracts/update";

const baseline = (): any =>
  JSON.parse(
    readFileSync(
      new URL("../fixtures/updates/valid-baseline.json", import.meta.url),
      "utf8",
    ),
  );
const codes = (update: unknown): string[] =>
  validateUpdateStructure(update).map((issue) => issue.code);

describe("quarterly update contract", () => {
  it("parses the valid baseline fixture", () => {
    expect(updateSchema.safeParse(baseline()).success).toBe(true);
    expect(validateUpdateStructure(baseline())).toEqual([]);
  });

  it("rejects unknown fields because the schema is strict", () => {
    expect(updateSchema.safeParse({ ...baseline(), extra: 1 }).success).toBe(
      false,
    );
    const nested = baseline();
    nested.period.extra = 1;
    expect(updateSchema.safeParse(nested).success).toBe(false);
  });

  it("rejects a malformed update ID and non-matching period", () => {
    const badId = baseline();
    badId.id = "2026-quarter-3";
    expect(updateSchema.safeParse(badId).success).toBe(false);

    const wrongQuarter = baseline();
    wrongQuarter.period.quarter = 2;
    expect(codes(wrongQuarter)).toContain("update-id-period");

    const wrongYear = baseline();
    wrongYear.period.year = 2025;
    expect(codes(wrongYear)).toContain("update-id-period");

    const wrongDates = baseline();
    wrongDates.period.startDate = "2026-06-01";
    expect(codes(wrongDates)).toContain("update-id-period");

    const wrongEnd = baseline();
    wrongEnd.period.endDate = "2026-12-31";
    expect(codes(wrongEnd)).toContain("update-id-period");
  });

  it("rejects duplicate case references across the four lists", () => {
    const dupWithin = baseline();
    dupWithin.addedCases.push({ ...dupWithin.addedCases[0] });
    expect(codes(dupWithin)).toContain("update-duplicate-case");

    const dupAcross = baseline();
    dupAcross.retiredCases.push({
      caseId: dupAcross.addedCases[0].caseId,
      previousClinicalDigest: "1".repeat(64),
      previousVideoSourceDigest: "2".repeat(64),
      reason: "Fictional duplicate transition.",
    });
    expect(codes(dupAcross)).toContain("update-duplicate-case");
  });

  it("rejects missing or empty case references", () => {
    const empty = baseline();
    empty.addedCases[0].caseId = "";
    expect(updateSchema.safeParse(empty).success).toBe(false);
  });

  it("rejects an incorrect unavailable-state record", () => {
    const record = baseline();
    record.unavailableCases.push({
      caseId: "CASE-FIC-2026-003",
      previousClinicalDigest: "1".repeat(64),
      previousVideoSourceDigest: "2".repeat(64),
      currentClinicalDigest: "1".repeat(64),
      currentVideoSourceDigest: "3".repeat(64),
      detectedAt: "2026-08-01T00:00:00Z",
      previousEmbedStatus: "unavailable",
      action: "switched to clearly labeled external link",
    });
    expect(codes(record)).toContain("update-embed-status");
  });

  it("accepts a well-formed unavailable transition", () => {
    const record = baseline();
    record.unavailableCases.push({
      caseId: "CASE-FIC-2026-003",
      previousClinicalDigest: "1".repeat(64),
      previousVideoSourceDigest: "2".repeat(64),
      currentClinicalDigest: "1".repeat(64),
      currentVideoSourceDigest: "3".repeat(64),
      detectedAt: "2026-08-01T00:00:00Z",
      previousEmbedStatus: "verified",
      action: "switched to clearly labeled external link",
    });
    expect(validateUpdateStructure(record)).toEqual([]);
  });

  it("stores separate clinical and video digests per transition", () => {
    const record = baseline();
    record.updatedCases.push({
      caseId: "CASE-FIC-2026-004",
      previousClinicalDigest: "1".repeat(64),
      currentClinicalDigest: "1".repeat(64),
      previousVideoSourceDigest: "2".repeat(64),
      currentVideoSourceDigest: "3".repeat(64),
      reason: "Fictional caption recheck changed only the video-source digest.",
    });
    expect(validateUpdateStructure(record)).toEqual([]);
    const missingPair = baseline();
    missingPair.updatedCases.push({
      caseId: "CASE-FIC-2026-004",
      previousClinicalDigest: "1".repeat(64),
      currentClinicalDigest: "1".repeat(64),
      reason: "Missing video digests.",
    });
    expect(updateSchema.safeParse(missingPair).success).toBe(false);
  });

  it("rejects malformed or incomplete approved review fields", () => {
    const incomplete = baseline();
    incomplete.status = "approved";
    incomplete.review = {
      status: "approved",
      reviewerName: "Dr. Fictional Reviewer Two",
      reviewerQualification: null,
      reviewedAt: "2026-08-05T00:00:00Z",
      reviewedContentDigest: "4".repeat(64),
    };
    expect(codes(incomplete)).toContain("update-review-incomplete");

    const malformed = baseline();
    malformed.status = "approved";
    malformed.review = {
      status: "approved",
      reviewerName: "Dr. Fictional Reviewer Two",
      reviewerQualification: "Fictional Sports Medicine Physician",
      reviewedAt: "2026-08-05T00:00:00Z",
      reviewedContentDigest: "not-a-digest",
    };
    expect(codes(malformed)).toContain("update-schema");

    const statusMismatch = baseline();
    statusMismatch.status = "approved";
    expect(codes(statusMismatch)).toContain("update-review-incomplete");
  });

  it("treats publishedAt as nullable review metadata with strict UTC form", () => {
    const draft = baseline();
    expect(draft.publishedAt).toBeNull();
    const published = baseline();
    published.publishedAt = "2026-10-01T00:00:00Z";
    expect(validateUpdateStructure(published)).toEqual([]);
    const malformed = baseline();
    malformed.publishedAt = "2026-10-01";
    expect(updateSchema.safeParse(malformed).success).toBe(false);
    const impossible = baseline();
    impossible.publishedAt = "2026-02-30T00:00:00Z";
    expect(codes(impossible)).toContain("invalid-date");
  });

  it("rejects unknown status tokens", () => {
    const record = baseline();
    record.status = "published";
    expect(updateSchema.safeParse(record).success).toBe(false);
  });
});
