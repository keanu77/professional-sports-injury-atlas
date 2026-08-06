import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { caseSchema } from "../../src/lib/contracts/case";
import { validateCaseRecord } from "../../src/lib/contracts/cross-validation";

const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );
const recent = (): any => loadFixture("cases/valid-medical-review.json");
const classic = (): any => loadFixture("cases/valid-approved-classic.json");
const codes = (record: unknown): string[] =>
  validateCaseRecord(record).map((issue) => issue.code);

describe("caseSchema single-entry contract", () => {
  it("parses both visibly fictional valid fixtures", () => {
    expect(caseSchema.safeParse(recent()).success).toBe(true);
    expect(caseSchema.safeParse(classic()).success).toBe(true);
    expect(validateCaseRecord(recent())).toEqual([]);
    expect(validateCaseRecord(classic())).toEqual([]);
  });

  it("returns {code,path,message} issues and does not mutate input", () => {
    const record = recent();
    const frozen = JSON.stringify(record);
    const issues = validateCaseRecord({ ...record, unknownField: true });
    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues) {
      expect(typeof issue.code).toBe("string");
      expect(typeof issue.path).toBe("string");
      expect(typeof issue.message).toBe("string");
    }
    validateCaseRecord(record);
    expect(JSON.stringify(record)).toBe(frozen);
  });

  it("rejects unknown fields because every object is strict", () => {
    expect(caseSchema.safeParse({ ...recent(), extra: 1 }).success).toBe(false);
    const nested = recent();
    nested.video.extra = "x";
    expect(caseSchema.safeParse(nested).success).toBe(false);
    const review = recent();
    review.review.extra = "x";
    expect(caseSchema.safeParse(review).success).toBe(false);
  });

  it("rejects stored thumbnail URLs as unknown fields", () => {
    const record = recent();
    record.video.thumbnailUrl = "https://img.example.com/thumb.jpg";
    expect(caseSchema.safeParse(record).success).toBe(false);
  });

  it("rejects arbitrary iframe HTML in any text field", () => {
    const record = recent();
    record.general.whatHappened +=
      ' <iframe src="https://www.youtube.com/embed/fic"></iframe>';
    expect(codes(record)).toContain("iframe-forbidden");
  });

  it("rejects HTTP video and source URLs", () => {
    const httpVideo = recent();
    httpVideo.video.canonicalUrl =
      "http://www.youtube.com/watch?v=fic-alpha-001";
    httpVideo.video.fallbackUrl = httpVideo.video.canonicalUrl;
    expect(caseSchema.safeParse(httpVideo).success).toBe(false);
    const httpSource = recent();
    httpSource.sources[1].url =
      "http://comets.example.com/injury-report-fic-001";
    expect(caseSchema.safeParse(httpSource).success).toBe(false);
  });

  it("rejects any primary video content type other than in-game-injury-event", () => {
    for (const contentType of [
      "post-game-interview",
      "news-recap",
      "practice",
      "compilation",
    ]) {
      const record = recent();
      record.video.contentType = contentType;
      expect(caseSchema.safeParse(record).success).toBe(false);
    }
  });

  it("rejects malformed id, slug, and season tokens", () => {
    const badId = recent();
    badId.id = "CASE-fic-2026-1";
    expect(caseSchema.safeParse(badId).success).toBe(false);
    const badSlug = recent();
    badSlug.slug = "Fictional_Forward";
    expect(caseSchema.safeParse(badSlug).success).toBe(false);
    const badSeason = recent();
    badSeason.season = "25-26";
    expect(caseSchema.safeParse(badSeason).success).toBe(false);
  });

  it("rejects malformed calendar dates and timestamps", () => {
    const badEventDate = recent();
    badEventDate.eventDate = "2026-13-40";
    expect(codes(badEventDate)).toContain("invalid-date");
    const badTimestamp = recent();
    badTimestamp.video.embedCheckedAt = "2026-02-30T00:00:00Z";
    expect(codes(badTimestamp)).toContain("invalid-date");
  });

  it("rejects invalid segment ranges", () => {
    const reversed = recent();
    reversed.video.segments = [
      { startSeconds: 25, endSeconds: 10, observation: "Fictional reversed." },
    ];
    expect(codes(reversed)).toContain("segment-range");

    const beyond = recent();
    beyond.video.segments = [
      { startSeconds: 10, endSeconds: 500, observation: "Fictional beyond." },
    ];
    expect(codes(beyond)).toContain("segment-range");

    const overlapping = recent();
    overlapping.video.segments = [
      { startSeconds: 10, endSeconds: 25, observation: "Fictional one." },
      { startSeconds: 20, endSeconds: 30, observation: "Fictional two." },
    ];
    expect(codes(overlapping)).toContain("segment-order");

    const fractional = recent();
    fractional.video.segments = [
      { startSeconds: 10.5, endSeconds: 25, observation: "Fictional frac." },
    ];
    expect(caseSchema.safeParse(fractional).success).toBe(false);
  });

  it("rejects a selected window outside the video duration", () => {
    const record = recent();
    record.video.startSeconds = 90;
    record.video.endSeconds = 120;
    expect(codes(record)).toContain("video-window");
  });

  it("rejects duplicate source IDs within one case", () => {
    const record = recent();
    record.sources[1].id = record.sources[0].id;
    expect(codes(record)).toContain("duplicate-source-id");
  });

  it("rejects duplicate claim IDs", () => {
    const record = recent();
    record.professional.claims[1].id = record.professional.claims[0].id;
    expect(codes(record)).toContain("claim-duplicate-id");
  });

  it("rejects claims with missing evidence IDs", () => {
    const record = recent();
    record.professional.claims[0].evidenceIds = ["src-fic-001-missing"];
    expect(codes(record)).toContain("claim-evidence-missing");
  });

  it("rejects empty claim evidence lists", () => {
    const record = recent();
    record.professional.claims[0].evidenceIds = [];
    expect(caseSchema.safeParse(record).success).toBe(false);
  });

  it("rejects claim evidence that is not teaching evidence for that path", () => {
    const wrongType = recent();
    wrongType.professional.claims[0].evidenceIds = ["src-fic-001-event"];
    expect(codes(wrongType)).toContain("claim-evidence-incompatible");

    const wrongPath = recent();
    wrongPath.sources[3].supports = [
      "professional.clinicalLimitations",
      "professional.differentialContext",
      "professional.treatmentAndRtpMeaning",
    ];
    expect(codes(wrongPath)).toContain("claim-evidence-incompatible");
  });

  it("rejects field text not exactly reproduced by ordered claims", () => {
    const record = recent();
    record.professional.mechanismAnalysis += " Unlinked trailing prose.";
    expect(codes(record)).toContain("claim-field-text-mismatch");
  });

  it("rejects a professional field with no claims at all", () => {
    const record = recent();
    record.professional.claims = record.professional.claims.filter(
      (claim: any) => claim.field !== "professional.differentialContext",
    );
    expect(codes(record)).toContain("claim-field-text-mismatch");
  });

  it("rejects an aggregate evidence union mismatch", () => {
    const unused = recent();
    unused.sources.push({
      ...unused.sources[4],
      id: "src-fic-001-teach-c",
      url: "https://society.example.org/fictional-extra",
      independenceGroup: "fictional-extra-group",
    });
    unused.professional.evidenceIds = [
      "src-fic-001-teach-a",
      "src-fic-001-teach-b",
      "src-fic-001-teach-c",
    ];
    expect(codes(unused)).toContain("evidence-union-mismatch");

    const unsorted = recent();
    unsorted.professional.evidenceIds = [
      "src-fic-001-teach-b",
      "src-fic-001-teach-a",
    ];
    expect(codes(unsorted)).toContain("evidence-union-mismatch");
  });

  it("rejects incompatible source support paths per source type", () => {
    const record = recent();
    record.sources[2].supports = ["injury.confirmedDiagnosis"];
    expect(codes(record)).toContain("source-support-incompatible");
    const video = recent();
    video.sources[0].supports = ["professional.mechanismAnalysis"];
    expect(codes(video)).toContain("source-support-incompatible");
  });

  it("requires the event binding source to resolve to an event-context source", () => {
    const record = recent();
    record.video.eventBinding.eventSourceId = "src-fic-001-teach-a";
    expect(codes(record)).toContain("event-binding-source");
    const missing = recent();
    missing.video.eventBinding.eventSourceId = "src-fic-001-nowhere";
    expect(codes(missing)).toContain("event-binding-source");
  });

  it("requires the MVP fallback URL to equal the canonical URL", () => {
    const record = recent();
    record.video.fallbackUrl = "https://www.youtube.com/watch?v=fic-other-clip";
    expect(codes(record)).toContain("fallback-url-mismatch");
  });

  it("exports the required Draft 2020-12 JSON Schema shape", () => {
    const jsonSchema: any = z.toJSONSchema(caseSchema);
    expect(jsonSchema.$schema).toBe(
      "https://json-schema.org/draft/2020-12/schema",
    );
    expect(jsonSchema.type).toBe("object");
    expect(jsonSchema.additionalProperties).toBe(false);
    expect(jsonSchema.required).toContain("id");
    expect(jsonSchema.required).toContain("sourceManifestBinding");
    expect(jsonSchema.properties.video.additionalProperties).toBe(false);
  });
});
