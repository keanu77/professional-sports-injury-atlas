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
import { computeCaseContentDigest } from "../../src/lib/cases/digest";
import { hasMatchingApprovedReview } from "../../src/lib/cases/review-validation";
import {
  selectMedicallyApprovedCases,
  selectPublicCases,
} from "../../src/lib/cases/selectors";
import { caseSchema, type InjuryCase } from "../../src/lib/contracts/case";
import { CURRENT_SOURCE_POLICY_VERSION } from "../../src/lib/contracts/site-governance";
import {
  MIN_PUBLIC_CASES_PER_INJURY,
  MIN_PUBLIC_CASES_TOTAL,
} from "../../src/lib/governance/release-gate";
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

const AUTHORIZED_CORRECTIONS: ReadonlyMap<
  string,
  {
    manifestId: string;
    entryDigest: string;
    videoUrl: string;
    captionStatus: "available" | "unavailable";
    reviewedAt: string;
  }
> = new Map([
  [
    "CAND-NBA-ACHILLES-2019-005",
    {
      manifestId: "NBA-SOURCE-2026-08-08-001",
      entryDigest:
        "f22491e605eb1767e67ed96ca93086c7112ebf966679e41b8facb8d4d20537ed",
      videoUrl: "https://www.youtube.com/watch?v=YcSOLHMsJYw",
      captionStatus: "available",
      reviewedAt: "2026-08-08T11:52:39Z",
    },
  ],
  [
    "CAND-NBA-ANKLE-2021-002",
    {
      manifestId: "NBA-SOURCE-2026-08-08-001",
      entryDigest:
        "6cc42a1e4591fad875bd9b490e9ecf5c314d63af031d938e8209fb345d315180",
      videoUrl: "https://www.youtube.com/watch?v=FQAPZASQyX0",
      captionStatus: "available",
      reviewedAt: "2026-08-08T11:52:39Z",
    },
  ],
  [
    "CAND-NBA-ANKLE-2023-008",
    {
      manifestId: "NBA-SOURCE-2026-08-08-001",
      entryDigest:
        "9d80dc156b44ae0d107c1a34f9cc3a2340ba258f4180426190c7e9b56cef9b69",
      videoUrl: "https://www.youtube.com/watch?v=RDDGpqOvSdg",
      captionStatus: "available",
      reviewedAt: "2026-08-08T11:52:39Z",
    },
  ],
  [
    "CAND-NBA-ANKLE-2023-004",
    {
      manifestId: "NBA-SOURCE-2026-08-10-001",
      entryDigest:
        "739d6b2d68a10614e8a09af958868c46e7179dabe98e5cafdd2653c9d0603f49",
      videoUrl: "https://www.youtube.com/watch?v=8TIJGIRP634",
      captionStatus: "available",
      reviewedAt: "2026-08-10T11:36:08Z",
    },
  ],
  [
    "CAND-NBA-ANKLE-2025-002",
    {
      manifestId: "NBA-SOURCE-2026-08-10-001",
      entryDigest:
        "24f6651056db5d64fe7735fb9e9403c3075399ca1c9923a5fe702d9755ee4488",
      videoUrl: "https://www.youtube.com/watch?v=zZdndTqOexc",
      captionStatus: "available",
      reviewedAt: "2026-08-10T11:36:08Z",
    },
  ],
  [
    "CAND-NBA-ACHILLES-2025-016",
    {
      manifestId: "NBA-SOURCE-2026-08-10-001",
      entryDigest:
        "fa494db9042435914774946b0524a3c51d5249ca57c88dbb777bb83b3bc2d71a",
      videoUrl: "https://www.youtube.com/watch?v=xSUKd03LJwE",
      captionStatus: "unavailable",
      reviewedAt: "2026-08-10T11:36:08Z",
    },
  ],
  [
    "CAND-NBA-ACHILLES-2025-017",
    {
      manifestId: "NBA-SOURCE-2026-08-10-001",
      entryDigest:
        "848910fc37f9aa8270f879730a13c5d32c9e674cc790feb2d68a52d598f80e94",
      videoUrl: "https://www.youtube.com/watch?v=azQpbyDBktk",
      captionStatus: "unavailable",
      reviewedAt: "2026-08-10T11:36:08Z",
    },
  ],
]);

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
        correction.manifestId,
      );
      expect(record.video.provider).toBe("youtube");
      expect(record.video.embedStatus).toBe("verified");
      expect(record.video.canonicalUrl).toBe(correction.videoUrl);
      expect(record.video.captionStatus).toBe(correction.captionStatus);
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
      expect(record.sourceManifestBinding.sourcePolicyVersion).toBe("nba-v2");
      expect(
        record.video.sourceProvenanceVerification.verifiedPolicyVersion,
      ).toBe("nba-v2");
      expect(
        validateCaseSourceBinding(
          record,
          registryResult.registry!,
          registryArtifactLoader(ROOT),
        ),
      ).toEqual([]);
      expect(record.status).toBe("approved");
      expect(record.review).toEqual({
        status: "approved",
        reviewerName: "吳易澄醫師",
        reviewerQualification: "復健科專科醫師",
        reviewedAt:
          AUTHORIZED_CORRECTIONS.get(record.sourceManifestBinding.candidateId)
            ?.reviewedAt ?? "2026-08-08T11:52:39Z",
        reviewedContentDigest: computeCaseContentDigest(record),
      });
      expect(hasMatchingApprovedReview(record)).toBe(true);
      expect(record.video.publicRightsReview.status).toBe("not-requested");
    }

    expect(validateCaseCollection(records)).toEqual([]);
    const routes = caseRouteParams("review", records);
    expect(routes).toHaveLength(records.length);
    expect(new Set(routes.map((route) => route.slug))).toEqual(
      new Set(records.map((record) => record.slug)),
    );
  });

  it("selects the exact 26-case medical projection without opening public readiness", () => {
    const records = loadAuthoredCases(loadCoverage());
    const medicallyApproved = selectMedicallyApprovedCases(records);
    expect(medicallyApproved).toHaveLength(26);
    expect(CURRENT_SOURCE_POLICY_VERSION).toBe("nba-v2");
    expect(
      Object.fromEntries(
        ["acl", "ankle-sprain", "achilles-rupture"].map((injuryCode) => [
          injuryCode,
          medicallyApproved.filter(
            (record) => record.injury.code === injuryCode,
          ).length,
        ]),
      ),
    ).toEqual({ acl: 7, "ankle-sprain": 12, "achilles-rupture": 7 });

    expect(selectPublicCases(records)).toEqual([]);
    expect(MIN_PUBLIC_CASES_PER_INJURY).toBe(10);
    expect(MIN_PUBLIC_CASES_TOTAL).toBe(30);
    expect(medicallyApproved).toHaveLength(26);
    expect(medicallyApproved.length).toBeLessThan(MIN_PUBLIC_CASES_TOTAL);
  });
});
