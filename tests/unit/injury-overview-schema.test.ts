import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  injuryOverviewSchema,
  validateInjuryOverview,
} from "../../src/lib/contracts/injury-overview";
import { injuryRouteParams } from "../../src/lib/routes/static-paths";

const ROOT = join(import.meta.dirname, "../..");

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
const codes = (record: unknown): string[] =>
  validateInjuryOverview(record).map((issue) => issue.code);

describe("injury overview contract", () => {
  it("materializes the three authorized real overviews and routes exactly", () => {
    const expected = ["achilles-rupture", "acl", "ankle-sprain"];
    const directory = join(ROOT, "src/content/injuries");
    expect(
      readdirSync(directory)
        .filter((name) => name.endsWith(".json"))
        .sort(),
    ).toEqual(expected.map((code) => `${code}.json`).sort());
    for (const injuryCode of expected) {
      const record = JSON.parse(
        readFileSync(join(directory, `${injuryCode}.json`), "utf8"),
      );
      expect(record.injuryCode).toBe(injuryCode);
      expect(validateInjuryOverview(record)).toEqual([]);
      expect(record.status).toBe("medical-review");
      expect(record.review).toEqual({
        status: "in-review",
        reviewerName: null,
        reviewerQualification: null,
        reviewedAt: null,
        reviewedContentDigest: null,
      });
    }
    expect(
      injuryRouteParams().sort((a, b) => a.injury.localeCompare(b.injury)),
    ).toEqual(
      expected
        .map((injury) => ({ injury }))
        .sort((a, b) => a.injury.localeCompare(b.injury)),
    );
  });

  it("parses the valid fictional fixture", () => {
    expect(injuryOverviewSchema.safeParse(overview()).success).toBe(true);
    expect(validateInjuryOverview(overview())).toEqual([]);
  });

  it("rejects unknown fields because the schema is strict", () => {
    expect(
      injuryOverviewSchema.safeParse({ ...overview(), extra: 1 }).success,
    ).toBe(false);
    const nested = overview();
    nested.review.extra = 1;
    expect(injuryOverviewSchema.safeParse(nested).success).toBe(false);
  });

  it("rejects an unsupported injury code", () => {
    const record = overview();
    record.injuryCode = "hamstring-strain";
    expect(codes(record)).toContain("unknown-injury");
  });

  it("rejects unlinked prose outside the exact claim concatenation", () => {
    const record = overview();
    record.scope += " Unlinked trailing sentence.";
    expect(codes(record)).toContain("claim-field-text-mismatch");
  });

  it("rejects incomplete evidence and evidence-union drift", () => {
    const missing = overview();
    missing.claims[0].evidenceIds = ["ov-src-missing"];
    expect(codes(missing)).toContain("claim-evidence-missing");

    const union = overview();
    union.evidenceIds = ["ov-src-a"];
    expect(codes(union)).toContain("evidence-union-mismatch");
  });

  it("rejects copied prescription-like progression content", () => {
    const weekly = overview();
    weekly.rtpContext =
      "Week 1: rest and ice. Week 2: begin jogging. Week 3: return to play.";
    weekly.claims[6].text = weekly.rtpContext;
    expect(codes(weekly)).toContain("overview-prescription");

    const dosage = overview();
    dosage.treatmentContext = "Perform 3 sets x 12 reps of calf raises daily.";
    dosage.claims[5].text = dosage.treatmentContext;
    expect(codes(dosage)).toContain("overview-prescription");
  });

  it("rejects approved status with missing review fields or malformed digest", () => {
    const missingFields = overview();
    missingFields.status = "approved";
    expect(codes(missingFields)).toContain("overview-review-incomplete");

    const malformed = overview();
    malformed.status = "approved";
    malformed.review = {
      status: "approved",
      reviewerName: "Dr. Fictional Reviewer Two",
      reviewerQualification: "Fictional Sports Medicine Physician",
      reviewedAt: "2026-08-05T00:00:00Z",
      reviewedContentDigest: "not-a-digest",
    };
    expect(codes(malformed)).toContain("overview-schema");
  });

  it("uses the same three status tokens as updates", () => {
    for (const status of ["draft", "medical-review", "approved"]) {
      const record = overview();
      record.status = status;
      expect(injuryOverviewSchema.safeParse(record).success).toBe(true);
    }
    const record = overview();
    record.status = "published";
    expect(injuryOverviewSchema.safeParse(record).success).toBe(false);
  });

  it("requires claims to reference teaching-evidence sources supporting the field", () => {
    const record = overview();
    record.sources[0].supports = record.sources[0].supports.filter(
      (path: string) => path !== "scope",
    );
    expect(codes(record)).toContain("claim-evidence-incompatible");
  });
});
