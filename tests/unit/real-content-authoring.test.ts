import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  checkCaseAuthoringCoverage,
  type CaseAuthoringCoverageV1,
} from "../../scripts/check-case-authoring-coverage";
import {
  loadRealRegistry,
  registryArtifactLoader,
} from "../../scripts/check-content";
import {
  validateCaseCollection,
  validateCaseFilename,
  validateCaseRecord,
  validateCaseSourceBinding,
} from "../../src/lib/contracts/cross-validation";
import { caseSchema, type InjuryCase } from "../../src/lib/contracts/case";
import { caseRouteParams } from "../../src/lib/routes/static-paths";

const ROOT = join(import.meta.dirname, "../..");

const AUTHORED_TASKS = [
  "case-acl-01",
  "case-acl-02",
  "case-acl-03",
  "case-acl-04",
  "case-acl-05",
  "case-acl-06",
  "case-acl-07",
  "case-ankle-01",
  "case-ankle-02",
  "case-ankle-03",
  "case-ankle-04",
  "case-ankle-05",
  "case-ankle-06",
  "case-ankle-07",
  "case-ankle-08",
  "case-ankle-09",
  "case-ankle-10",
  "case-ankle-11",
  "case-ankle-12",
  "case-achilles-01",
  "case-achilles-02",
  "case-achilles-03",
  "case-achilles-04",
  "case-achilles-05",
  "case-achilles-06",
  "case-achilles-07",
] as const;

const AUTHORIZED_CORRECTIONS = new Map([
  [
    "CAND-NBA-ACHILLES-2019-005",
    {
      entryDigest:
        "f22491e605eb1767e67ed96ca93086c7112ebf966679e41b8facb8d4d20537ed",
      videoUrl: "https://www.youtube.com/watch?v=YcSOLHMsJYw",
    },
  ],
  [
    "CAND-NBA-ANKLE-2021-002",
    {
      entryDigest:
        "6cc42a1e4591fad875bd9b490e9ecf5c314d63af031d938e8209fb345d315180",
      videoUrl: "https://www.youtube.com/watch?v=FQAPZASQyX0",
    },
  ],
  [
    "CAND-NBA-ANKLE-2023-008",
    {
      entryDigest:
        "9d80dc156b44ae0d107c1a34f9cc3a2340ba258f4180426190c7e9b56cef9b69",
      videoUrl: "https://www.youtube.com/watch?v=RDDGpqOvSdg",
    },
  ],
] as const);

function loadCoverage(): CaseAuthoringCoverageV1 {
  const result = checkCaseAuthoringCoverage(ROOT);
  expect(result.issues).toEqual([]);
  expect(result.coverage).not.toBeNull();
  return result.coverage!;
}

function loadAuthoredCases(coverage: CaseAuthoringCoverageV1): InjuryCase[] {
  return AUTHORED_TASKS.map((taskId) => {
    const planned = coverage.cases.find((entry) => entry.taskId === taskId);
    expect(planned, `missing planned task ${taskId}`).toBeDefined();
    const absolutePath = join(ROOT, planned!.path);
    expect(existsSync(absolutePath), `missing case file ${planned!.path}`).toBe(
      true,
    );
    const record = caseSchema.parse(
      JSON.parse(readFileSync(absolutePath, "utf8")),
    );
    expect(record.id).toBe(planned!.caseId);
    expect(record.slug).toBe(planned!.slug);
    expect(record.sourceManifestBinding.candidateId).toBe(planned!.candidateId);
    const correction = AUTHORIZED_CORRECTIONS.get(planned!.candidateId);
    expect(record.sourceManifestBinding.entryDigest).toBe(
      correction?.entryDigest ?? planned!.entryDigest,
    );
    if (correction !== undefined) {
      expect(record.sourceManifestBinding.manifestId).toBe(
        "NBA-SOURCE-2026-08-08-001",
      );
      expect(record.video.provider).toBe("youtube");
      expect(record.video.embedStatus).toBe("verified");
      expect(record.video.canonicalUrl).toBe(correction.videoUrl);
    }
    expect(validateCaseRecord(record)).toEqual([]);
    expect(validateCaseFilename(planned!.path, record)).toEqual([]);
    return record;
  });
}

describe("authorized real NBA case authoring", () => {
  it("materializes the exact authorized plan coverage with valid bindings and routes", () => {
    const coverage = loadCoverage();
    const records = loadAuthoredCases(coverage);
    const registryResult = loadRealRegistry(ROOT);
    expect(registryResult.issues).toEqual([]);
    expect(registryResult.registry).not.toBeNull();

    for (const record of records) {
      expect(
        validateCaseSourceBinding(
          record,
          registryResult.registry!,
          registryArtifactLoader(ROOT),
        ),
      ).toEqual([]);
      expect(record.status).toBe("medical-review");
      expect(record.review).toEqual({
        status: "in-review",
        reviewerName: null,
        reviewerQualification: null,
        reviewedAt: null,
        reviewedContentDigest: null,
      });
      expect(record.video.publicRightsReview.status).toBe("not-requested");
    }

    expect(validateCaseCollection(records)).toEqual([]);
    const routes = caseRouteParams("review", records);
    expect(routes).toHaveLength(records.length);
    expect(new Set(routes.map((route) => route.slug))).toEqual(
      new Set(records.map((record) => record.slug)),
    );
  });
});
