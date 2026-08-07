import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CASE_AUTHORING_COVERAGE_BEGIN,
  CASE_AUTHORING_COVERAGE_END,
  CASE_AUTHORING_PLAN_PATH,
  checkCaseAuthoringCoverage,
  extractCaseAuthoringCoverage,
  runCaseAuthoringCoverageCli,
  type CaseAuthoringCoverageV1,
} from "../../scripts/check-case-authoring-coverage.ts";
import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical.ts";

const REAL_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const REGISTRY_PATH = "research/source-manifest-registry.v1.json";
const MANIFEST_PATH =
  "research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json";
const DECISION_PATH =
  "research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json";
const FIXTURE_PATHS = [
  CASE_AUTHORING_PLAN_PATH,
  REGISTRY_PATH,
  MANIFEST_PATH,
  DECISION_PATH,
] as const;

const cleanupRoots: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  while (cleanupRoots.length > 0) {
    rmSync(cleanupRoots.pop() as string, { recursive: true, force: true });
  }
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "case-authoring-coverage-"));
  cleanupRoots.push(root);
  for (const path of FIXTURE_PATHS) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(REAL_ROOT, path), target);
  }
  return root;
}

function coverageFrom(root: string): CaseAuthoringCoverageV1 {
  const parsed = extractCaseAuthoringCoverage(
    readFileSync(join(root, CASE_AUTHORING_PLAN_PATH), "utf8"),
  );
  if (parsed.coverage === null) {
    throw new Error(
      `fixture coverage did not parse: ${JSON.stringify(parsed.issues)}`,
    );
  }
  return parsed.coverage;
}

function machineDocument(jsonText: string): string {
  return [
    CASE_AUTHORING_COVERAGE_BEGIN,
    "```json",
    jsonText,
    "```",
    CASE_AUTHORING_COVERAGE_END,
  ].join("\n");
}

function writeCoverage(root: string, mutate: (coverage: any) => void): void {
  const path = join(root, CASE_AUTHORING_PLAN_PATH);
  const plan = readFileSync(path, "utf8");
  const coverage = structuredClone(coverageFrom(root));
  mutate(coverage);
  const begin = plan.indexOf(CASE_AUTHORING_COVERAGE_BEGIN);
  const end = plan.indexOf(CASE_AUTHORING_COVERAGE_END);
  const replacement = machineDocument(JSON.stringify(coverage, null, 2));
  writeFileSync(
    path,
    `${plan.slice(0, begin)}${replacement}${plan.slice(end + CASE_AUTHORING_COVERAGE_END.length)}`,
  );
}

function issueCodes(root: string): string[] {
  return checkCaseAuthoringCoverage(root).issues.map((entry) => entry.code);
}

interface AppendedBatch {
  currentRegistryDigest: string;
  manifestId: string;
}

function appendLegacyBatch(
  root: string,
  batchType: "quarterly" | "correction",
): AppendedBatch {
  const registryBytes = readFileSync(join(root, REGISTRY_PATH));
  const registry = parseStrictJson(registryBytes.toString("utf8")) as any;
  const richManifest = parseStrictJson(
    readFileSync(join(root, MANIFEST_PATH), "utf8"),
  ) as any;
  const original = richManifest.entries[0];
  const correction = batchType === "correction";
  const manifestId = correction
    ? "NBA-SOURCE-2026-08-08-999"
    : "NBA-SOURCE-2026-10-01-999";
  const candidate = correction
    ? {
        candidateId: original.candidateId,
        athleteName: original.athleteDisplayName,
        teamName: original.teamAtEvent,
        opponentName: original.opponent,
        sportCode: "basketball",
        leagueCode: "nba",
        competitionCode: original.competition,
        season: original.season,
        eventDate: original.eventDate,
        injuryCode: original.injuryCode,
        confirmedDiagnosis: "Fixture corrected diagnosis",
        videoProvider: original.video.provider,
        canonicalVideoUrl: original.video.canonicalUrl,
        uploaderName: original.video.uploaderName,
        uploaderProvenance: original.video.uploaderProvenance,
        durationSeconds: 60,
        classicProposal: null,
      }
    : {
        candidateId: "CAND-NBA-ANKLE-2026-999",
        athleteName: "Fixture Guard",
        teamName: "Fixture Team",
        opponentName: "Fixture Opponent",
        sportCode: "basketball",
        leagueCode: "nba",
        competitionCode: "nba-regular-season",
        season: "2026-27",
        eventDate: "2026-10-01",
        injuryCode: "ankle-sprain",
        confirmedDiagnosis: "Fixture ankle sprain",
        videoProvider: "nba",
        canonicalVideoUrl:
          "https://www.nba.com/watch/video/fixture-quarterly-2026-999",
        uploaderName: "NBA Organization",
        uploaderProvenance: "league",
        durationSeconds: 60,
        classicProposal: null,
      };
  const manifest = {
    schemaVersion: 1,
    manifestId,
    batchType,
    period: correction ? "2026-08-08" : "2026-q4",
    sourcePolicyVersion: "nba-v2",
    entries: [candidate],
  };
  const manifestBytes = canonicalJson(manifest);
  const manifestDigest = sha256Hex(manifestBytes);
  const decision = {
    schemaVersion: 1,
    decisionType: "source-batch-review",
    manifestId,
    manifestDigest,
    decisionStatus: "approved",
    sourcePolicyVersion: "nba-v2",
    reviewedBy: "Fixture Source Reviewer",
    reviewedAt: correction ? "2026-08-08T00:00:00Z" : "2026-10-01T00:00:00Z",
    candidateDecisions: [
      {
        candidateId: candidate.candidateId,
        status: "accepted",
        classicProposal: null,
      },
    ],
  };
  const decisionBytes = canonicalJson(decision);
  const manifestPath = `research/source-manifests/${manifestId}.v1.json`;
  const decisionPath = `research/reviews/source-batches/${manifestId}-source-review-decision.v1.json`;
  const supersedes = correction
    ? [
        {
          manifestId: richManifest.manifestId,
          candidateId: original.candidateId,
          entryDigest: original.entryDigest,
        },
      ]
    : [];
  registry.entries.push({
    manifestId,
    manifestPath,
    manifestDigest,
    sourceReviewDecisionPath: decisionPath,
    sourceReviewDecisionDigest: sha256Hex(decisionBytes),
    sourcePolicyVersion: "nba-v2",
    batchType,
    period: manifest.period,
    createdAt: correction ? "2026-08-08T00:00:00Z" : "2026-10-01T00:00:00Z",
    previousRegistryBytesDigest: sha256Hex(registryBytes),
    supersedes,
  });

  for (const [path, bytes] of [
    [manifestPath, manifestBytes],
    [decisionPath, decisionBytes],
  ] as const) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
  }
  const nextRegistryBytes = canonicalJson(registry);
  writeFileSync(join(root, REGISTRY_PATH), nextRegistryBytes);
  return {
    currentRegistryDigest: sha256Hex(nextRegistryBytes),
    manifestId,
  };
}

describe("NBA case-authoring plan coverage", () => {
  it("strictly parses and validates the real 26-case launch projection", () => {
    const result = checkCaseAuthoringCoverage(REAL_ROOT);

    expect(result.issues).toEqual([]);
    expect(result.coverage?.cases).toHaveLength(26);
    expect(result.coverage?.overviews).toHaveLength(3);
    expect(result.coverage?.baselineUpdate.id).toBe("2026-q3");
    expect(result.planPath).toBe(CASE_AUTHORING_PLAN_PATH);
  });

  describe("strict marked JSON extraction", () => {
    it("rejects missing, duplicate, or reversed machine-block markers", () => {
      const validJson = JSON.stringify(coverageFrom(REAL_ROOT));
      const missing = extractCaseAuthoringCoverage(
        `\`\`\`json\n${validJson}\n\`\`\``,
      );
      expect(missing.issues.map((entry) => entry.code)).toContain(
        "coverage-markers",
      );

      const duplicate = extractCaseAuthoringCoverage(
        `${CASE_AUTHORING_COVERAGE_BEGIN}\n${machineDocument(validJson)}`,
      );
      expect(duplicate.issues.map((entry) => entry.code)).toContain(
        "coverage-markers",
      );

      const reversed = extractCaseAuthoringCoverage(
        `${CASE_AUTHORING_COVERAGE_END}\n${CASE_AUTHORING_COVERAGE_BEGIN}`,
      );
      expect(reversed.issues.map((entry) => entry.code)).toContain(
        "coverage-markers",
      );
    });

    it("rejects non-fence content, duplicate JSON keys, and trailing JSON", () => {
      expect(
        extractCaseAuthoringCoverage(
          `${CASE_AUTHORING_COVERAGE_BEGIN}\nextra\n\`\`\`json\n{}\n\`\`\`\n${CASE_AUTHORING_COVERAGE_END}`,
        ).issues.map((entry) => entry.code),
      ).toContain("coverage-fence");

      expect(
        extractCaseAuthoringCoverage(
          machineDocument('{"schemaVersion":1,"schemaVersion":1}'),
        ).issues.map((entry) => entry.code),
      ).toContain("coverage-json");

      expect(
        extractCaseAuthoringCoverage(
          machineDocument('{"schemaVersion":1} {"extra":true}'),
        ).issues.map((entry) => entry.code),
      ).toContain("coverage-json");
    });

    it("rejects unknown top-level and case keys", () => {
      const coverage: any = structuredClone(coverageFrom(REAL_ROOT));
      coverage.unexpected = true;
      expect(
        extractCaseAuthoringCoverage(
          machineDocument(JSON.stringify(coverage)),
        ).issues.map((entry) => entry.code),
      ).toContain("coverage-schema");

      delete coverage.unexpected;
      coverage.cases[0].unexpected = true;
      expect(
        extractCaseAuthoringCoverage(
          machineDocument(JSON.stringify(coverage)),
        ).issues.map((entry) => entry.code),
      ).toContain("coverage-schema");
    });
  });

  describe("one-to-one identity coverage", () => {
    it.each([
      [
        "missing",
        (coverage: any) => {
          coverage.cases.pop();
          coverage.caseCount = 25;
        },
        "coverage-missing-candidate",
      ],
      [
        "extra",
        (coverage: any) => {
          coverage.cases[0].candidateId = "CAND-NBA-ACL-2021-999";
        },
        "coverage-extra-candidate",
      ],
      [
        "duplicate",
        (coverage: any) => {
          coverage.cases[1].candidateId = coverage.cases[0].candidateId;
        },
        "coverage-duplicate",
      ],
      [
        "reordered",
        (coverage: any) => {
          [coverage.cases[0], coverage.cases[1]] = [
            coverage.cases[1],
            coverage.cases[0],
          ];
        },
        "coverage-candidate-order",
      ],
    ])("rejects %s candidate coverage", (_label, mutate, expectedCode) => {
      const root = fixtureRoot();
      writeCoverage(root, mutate);
      expect(issueCodes(root)).toContain(expectedCode);
    });

    it.each([
      [
        "entry digest",
        (coverage: any) => {
          coverage.cases[0].entryDigest = "0".repeat(64);
        },
        "coverage-entry-digest",
      ],
      [
        "case ID",
        (coverage: any) => {
          coverage.cases[0].caseId = "CASE-NBAACL-2021-999";
        },
        "coverage-case-identity",
      ],
      [
        "slug",
        (coverage: any) => {
          coverage.cases[0].slug = "wrong-acl-2021";
        },
        "coverage-slug",
      ],
      [
        "filename",
        (coverage: any) => {
          coverage.cases[0].path = "src/content/cases/wrong.json";
        },
        "coverage-case-path",
      ],
      [
        "task ID",
        (coverage: any) => {
          coverage.cases[0].taskId = "case-acl-99";
        },
        "coverage-task-id",
      ],
    ])("rejects a hand-edited %s", (_label, mutate, expectedCode) => {
      const root = fixtureRoot();
      writeCoverage(root, mutate);
      expect(issueCodes(root)).toContain(expectedCode);
    });
  });

  describe("frozen source and provenance projection", () => {
    it.each([
      [
        "identity",
        (coverage: any) => {
          coverage.cases[0].frozenIdentity.athleteDisplayName = "Drift";
        },
        "coverage-frozen-identity",
      ],
      [
        "video record",
        (coverage: any) => {
          coverage.cases[0].plannedSourceMappings.videoOriginal.manifestRecord.title =
            "Drift";
        },
        "coverage-video-record",
      ],
      [
        "diagnosis record",
        (coverage: any) => {
          coverage.cases[0].plannedSourceMappings.diagnosis[0].manifestRecord.title =
            "Drift";
        },
        "coverage-diagnosis-record",
      ],
      [
        "diagnosis index",
        (coverage: any) => {
          coverage.cases[0].plannedSourceMappings.diagnosis[0].manifestArrayIndex = 1;
        },
        "coverage-diagnosis-record",
      ],
      [
        "event record",
        (coverage: any) => {
          coverage.cases[0].plannedSourceMappings.eventContext.manifestRecord.title =
            "Drift";
        },
        "coverage-event-record",
      ],
      [
        "provenance",
        (coverage: any) => {
          coverage.cases[0].frozenProvenance.verification.artifactDigest =
            "0".repeat(64);
        },
        "coverage-frozen-provenance",
      ],
      [
        "planned source",
        (coverage: any) => {
          coverage.cases[0].plannedSourceMappings.videoOriginal.plannedCaseSource.publisher =
            "Drift";
        },
        "coverage-planned-source",
      ],
    ])("rejects drift in %s", (_label, mutate, expectedCode) => {
      const root = fixtureRoot();
      writeCoverage(root, mutate);
      expect(issueCodes(root)).toContain(expectedCode);
    });

    it.each([
      [
        "diagnosis source type",
        (coverage: any) => {
          coverage.cases[0].plannedSourceMappings.diagnosis[0].sourceType =
            "diagnosis-secondary";
        },
      ],
      [
        "diagnosis mapping basis",
        (coverage: any) => {
          coverage.cases[0].plannedSourceMappings.diagnosis[0].mappingBasis.title =
            "Drift";
        },
      ],
      [
        "video mapping basis",
        (coverage: any) => {
          coverage.cases[0].plannedSourceMappings.videoOriginal.mappingBasis.title =
            "Drift";
        },
      ],
      [
        "event mapping basis",
        (coverage: any) => {
          coverage.cases[0].plannedSourceMappings.eventContext.mappingBasis.title =
            "Drift";
        },
      ],
    ])("rejects drift in %s", (_label, mutate) => {
      const root = fixtureRoot();
      writeCoverage(root, mutate);
      expect(issueCodes(root)).toContain("coverage-source-mapping");
    });
  });

  describe("deterministic timecode verification", () => {
    it.each([
      [
        "task ID",
        (coverage: any) => {
          coverage.cases[0].timecodeVerification.taskId = "drift";
        },
      ],
      [
        "canonical video URL",
        (coverage: any) => {
          coverage.cases[0].timecodeVerification.canonicalVideoUrl =
            "https://www.nba.com/watch/video/drift";
        },
      ],
      [
        "planned duration",
        (coverage: any) => {
          coverage.cases[0].timecodeVerification.durationSeconds.plannedValue = 60;
        },
      ],
      [
        "frozen embed status",
        (coverage: any) => {
          coverage.cases[0].timecodeVerification.currentEmbedCheck.frozenStatus =
            "verified";
        },
      ],
      [
        "frozen caption timestamp",
        (coverage: any) => {
          coverage.cases[0].timecodeVerification.currentCaptionCheck.frozenCheckedAt =
            "2026-08-08T00:00:00Z";
        },
      ],
    ])("rejects %s drift", (_label, mutate) => {
      const root = fixtureRoot();
      writeCoverage(root, mutate);
      expect(issueCodes(root)).toContain("coverage-timecode-verification");
    });
  });

  describe("bound bytes and immutable registry scope", () => {
    it("rejects a stale plan binding digest", () => {
      const root = fixtureRoot();
      writeCoverage(root, (coverage) => {
        coverage.sourceBinding.manifestDigest = "0".repeat(64);
      });
      const codes = issueCodes(root);
      expect(codes).toContain("coverage-source-binding");
      expect(codes).toContain("coverage-manifest-digest");
    });

    it("rejects changed manifest and decision bytes", () => {
      const manifestRoot = fixtureRoot();
      writeFileSync(
        join(manifestRoot, MANIFEST_PATH),
        `${readFileSync(join(manifestRoot, MANIFEST_PATH), "utf8")}\n`,
      );
      expect(issueCodes(manifestRoot)).toContain("coverage-manifest-digest");

      const decisionRoot = fixtureRoot();
      writeFileSync(
        join(decisionRoot, DECISION_PATH),
        `${readFileSync(join(decisionRoot, DECISION_PATH), "utf8")}\n`,
      );
      expect(issueCodes(decisionRoot)).toContain("coverage-decision-digest");
    });

    it("keeps the exact 26-case set after a valid unreferenced quarterly append", () => {
      const root = fixtureRoot();
      const originalDigest = coverageFrom(root).sourceBinding.registryDigest;
      const appended = appendLegacyBatch(root, "quarterly");
      expect(appended.currentRegistryDigest).not.toBe(originalDigest);

      const result = checkCaseAuthoringCoverage(root);
      expect(result.issues).toEqual([]);
      expect(result.coverage?.cases).toHaveLength(26);
      expect(result.manifest?.manifestId).toBe("NBA-SOURCE-2026-08-06-001");
    });

    it("fails closed when a later correction supersedes a planned candidate", () => {
      const root = fixtureRoot();
      appendLegacyBatch(root, "correction");

      const result = checkCaseAuthoringCoverage(root);
      expect(result.issues).toEqual([
        expect.objectContaining({ code: "coverage-superseded" }),
      ]);
    });
  });

  describe("overview and baseline coverage", () => {
    it.each([
      [
        "missing overview",
        (coverage: any) => {
          coverage.overviews.pop();
        },
        "coverage-overview-count",
      ],
      [
        "duplicate overview",
        (coverage: any) => {
          coverage.overviews[1] = structuredClone(coverage.overviews[0]);
        },
        "coverage-overviews",
      ],
      [
        "overview path",
        (coverage: any) => {
          coverage.overviews[0].path = "src/content/injuries/wrong.json";
        },
        "coverage-overviews",
      ],
      [
        "baseline path",
        (coverage: any) => {
          coverage.baselineUpdate.path = "src/content/updates/wrong.json";
        },
        "coverage-baseline",
      ],
      [
        "baseline period",
        (coverage: any) => {
          coverage.baselineUpdate.period.endDate = "2026-10-01";
        },
        "coverage-baseline",
      ],
      [
        "baseline case order",
        (coverage: any) => {
          [
            coverage.baselineUpdate.plannedAddedCaseIds[0],
            coverage.baselineUpdate.plannedAddedCaseIds[1],
          ] = [
            coverage.baselineUpdate.plannedAddedCaseIds[1],
            coverage.baselineUpdate.plannedAddedCaseIds[0],
          ];
        },
        "coverage-baseline-cases",
      ],
      [
        "baseline freshness stop action",
        (coverage: any) => {
          coverage.baselineUpdate.executionFreshness.stopAction = "Drift";
        },
        "coverage-baseline-freshness",
      ],
    ])("rejects %s drift", (_label, mutate, expectedCode) => {
      const root = fixtureRoot();
      writeCoverage(root, mutate);
      expect(issueCodes(root)).toContain(expectedCode);
    });
  });

  it("returns a bounded CLI status without mutating the fixture", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    expect(runCaseAuthoringCoverageCli(REAL_ROOT)).toBe(0);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("cases=26"));

    const root = fixtureRoot();
    writeCoverage(root, (coverage) => {
      coverage.caseCount = 25;
    });
    expect(runCaseAuthoringCoverageCli(root)).toBe(1);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("case-authoring-coverage FAILED"),
    );
  });
});
