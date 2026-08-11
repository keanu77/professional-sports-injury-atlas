import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DECISION_8_REVIEWED_AT,
  DECISION_11_P0_CASE_PATH,
  NBA_EMBED_BATCH2_BASELINE,
  NBA_EMBED_BATCH2_CORRECTED_CASES,
  checkNbaEmbedBatch2ContentCorrection,
  validateDecision8CorrectedCase,
  validateDecision8Q3,
  validateDecision11P0Case,
} from "../../scripts/check-nba-embed-batch2-content-correction";
import { caseSchema, type InjuryCase } from "../../src/lib/contracts/case";
import { updateSchema } from "../../src/lib/contracts/update";

const ROOT = join(import.meta.dirname, "../..");

function baselineJson(path: string): unknown {
  return JSON.parse(
    execFileSync("git", ["show", `${NBA_EMBED_BATCH2_BASELINE}:${path}`], {
      cwd: ROOT,
      encoding: "utf8",
    }),
  );
}

function currentCase(index = 0): InjuryCase {
  const target = NBA_EMBED_BATCH2_CORRECTED_CASES[index]!;
  return caseSchema.parse(
    JSON.parse(readFileSync(join(ROOT, target.path), "utf8")),
  );
}

function baselineCase(index = 0): InjuryCase {
  return caseSchema.parse(
    baselineJson(NBA_EMBED_BATCH2_CORRECTED_CASES[index]!.path),
  );
}

describe("Decision 8 NBA embed batch 2 content correction", () => {
  it("proves four Decision 8 corrections, one Decision 11 playback remediation, and all frozen bytes", () => {
    const result = checkNbaEmbedBatch2ContentCorrection(ROOT);
    expect(result.issues).toEqual([]);
    expect(result.correctedCaseCount).toBe(4);
    expect(result.rightsRemediatedCaseCount).toBe(1);
    expect(result.unchangedCaseCount).toBe(21);
    expect(result.unchangedOverviewCount).toBe(3);
  });

  it("allows only Anthony's exact three playback-state fields and preserves the clinical digest", () => {
    const current = caseSchema.parse(
      JSON.parse(readFileSync(join(ROOT, DECISION_11_P0_CASE_PATH), "utf8")),
    );
    const baseline = caseSchema.parse(baselineJson(DECISION_11_P0_CASE_PATH));
    expect(validateDecision11P0Case(current, baseline)).toEqual([]);

    const clinicalDrift = structuredClone(current);
    clinicalDrift.general.whatHappened += " drift";
    expect(
      validateDecision11P0Case(clinicalDrift, baseline).map(
        (entry) => entry.code,
      ),
    ).toEqual(
      expect.arrayContaining([
        "decision11-p0-case-projection-drift",
        "decision11-p0-clinical-digest",
      ]),
    );

    const playbackDrift = structuredClone(current);
    playbackDrift.video.embedStatus = "verified";
    expect(
      validateDecision11P0Case(playbackDrift, baseline).map(
        (entry) => entry.code,
      ),
    ).toContain("decision11-p0-case-fact");
  });

  it.each([
    [
      "clinical wording",
      (record: InjuryCase) => (record.general.whatHappened += " drift"),
    ],
    [
      "event evidence",
      (record: InjuryCase) => {
        record.sources.find((source) => source.type === "event-context")!.url =
          "https://example.com/drift";
      },
    ],
    [
      "segment observation",
      (record: InjuryCase) =>
        (record.video.segments[0]!.observation += " drift"),
    ],
    [
      "public-rights state",
      (record: InjuryCase) => {
        record.video.publicRightsReview.status = "rejected";
      },
    ],
  ])("rejects non-allowlisted %s drift", (_label, mutate) => {
    const current = currentCase();
    mutate(current);
    const issues = validateDecision8CorrectedCase(
      current,
      baselineCase(),
      NBA_EMBED_BATCH2_CORRECTED_CASES[0],
    );
    expect(issues.map((entry) => entry.code)).toContain(
      "decision8-case-projection-drift",
    );
  });

  it("rejects a stale approval digest and an unbounded segment window", () => {
    const current = currentCase();
    current.review.reviewedContentDigest =
      NBA_EMBED_BATCH2_CORRECTED_CASES[0].oldReviewedContentDigest;
    current.video.segments[0]!.endSeconds = current.video.durationSeconds + 1;
    const codes = validateDecision8CorrectedCase(
      current,
      baselineCase(),
      NBA_EMBED_BATCH2_CORRECTED_CASES[0],
    ).map((entry) => entry.code);
    expect(codes).toContain("decision8-stale-reviewed-content-digest");
    expect(codes).toContain("decision8-video-window");
  });

  it("rejects any Q3 field outside four digest pairs and audit.updatedAt", () => {
    const q3Path = "src/content/updates/2026-q3.json";
    const current = updateSchema.parse(
      JSON.parse(readFileSync(join(ROOT, q3Path), "utf8")),
    );
    current.summary += " drift";
    current.audit.updatedAt = DECISION_8_REVIEWED_AT;
    const cases = new Map(
      NBA_EMBED_BATCH2_CORRECTED_CASES.map((target, index) => {
        const record = currentCase(index);
        return [target.caseId, record] as const;
      }),
    );
    const issues = validateDecision8Q3(
      current,
      updateSchema.parse(baselineJson(q3Path)),
      cases,
    );
    expect(issues.map((entry) => entry.code)).toContain(
      "decision8-q3-projection-drift",
    );
  });
});
