import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import {
  CandidateManifestBuildError,
  G2_LAUNCH_DEFAULT_MIN_CLASSIC_ENTRIES,
  G2_LAUNCH_MIN_ENTRIES_PER_INJURY,
  G2_LAUNCH_MIN_ENTRIES_TOTAL,
  NBA_LAUNCH_CUTOFF_DATE,
  NBA_LAUNCH_MANIFEST_PERIOD,
  NBA_LAUNCH_SOURCE_POLICY_VERSION,
  NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID,
  buildCandidateManifest,
  computeCandidateManifestEntryDigest,
  digestCandidateManifest,
  isCandidateSourceManifest,
  parseCandidateManifestBytes,
  serializeCandidateManifest,
  validateCandidateManifest,
  validateG2ManifestComposition,
  validateG2ManifestCountFloor,
  type CandidateManifestBuildInput,
  type CandidateManifestCounts,
  type CandidateSourceManifestEntryV1,
  type CandidateSourceManifestV1,
  type SourceManifestCounts,
  type SourceManifestSupersedesReference,
} from "../../src/lib/research/candidate-manifest";
import {
  CANDIDATE_INJURY_CODES,
  type CandidateInjuryCode,
  type CandidateRow,
} from "../../src/lib/research/candidate-contract";
import { parseCandidateCsv } from "../../src/lib/research/csv";
import {
  MIN_PUBLIC_CASES_PER_INJURY,
  MIN_PUBLIC_CASES_TOTAL,
} from "../../src/lib/governance/release-gate";

const counts = (
  acl: number,
  ankleSprain: number,
  achillesRupture: number,
  total = acl + ankleSprain + achillesRupture,
): SourceManifestCounts => ({
  byInjury: {
    acl,
    "achilles-rupture": achillesRupture,
    "ankle-sprain": ankleSprain,
  },
  total,
});

const REPOSITORY_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const relativeBytes = (path: string): string =>
  readFileSync(`${REPOSITORY_ROOT}/${path}`, "utf8");
const CSV_PATHS: Record<CandidateInjuryCode, string> = {
  acl: "research/candidates/acl.csv",
  "ankle-sprain": "research/candidates/ankle-sprain.csv",
  "achilles-rupture": "research/candidates/achilles-rupture.csv",
};
const REAL_CSV_BYTES = Object.fromEntries(
  CANDIDATE_INJURY_CODES.map((injury) => [
    injury,
    relativeBytes(CSV_PATHS[injury]),
  ]),
) as Record<CandidateInjuryCode, string>;
const REAL_ROWS: CandidateRow[] = CANDIDATE_INJURY_CODES.flatMap((injury) =>
  parseCandidateCsv(REAL_CSV_BYTES[injury], injury),
);
const REAL_ARTIFACT_BYTES = {
  verificationArtifactBytes: relativeBytes(
    "research/verification/nba-source-verification.v1.json",
  ),
  rootAuditBytes: relativeBytes("research/reviews/root-source-audit.v1.json"),
  sourcePolicyJsonBytes: relativeBytes(
    "research/source-policy/source-policy.v2.json",
  ),
  sourcePolicyMarkdownBytes: relativeBytes("research/source-policy/nba.v2.md"),
  sourceReviewDecisionBytes: relativeBytes(
    "research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json",
  ),
} as const;

const realBuildInput = (
  overrides: Partial<CandidateManifestBuildInput> = {},
): CandidateManifestBuildInput => ({
  manifestId: NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID,
  batchType: "launch",
  period: NBA_LAUNCH_MANIFEST_PERIOD,
  sourcePolicyVersion: NBA_LAUNCH_SOURCE_POLICY_VERSION,
  cutoffDate: NBA_LAUNCH_CUTOFF_DATE,
  rows: REAL_ROWS,
  csvBytes: REAL_CSV_BYTES,
  ...REAL_ARTIFACT_BYTES,
  validationNow: "2026-08-08T00:00:00Z",
  ...overrides,
});

let cachedRealManifest: CandidateSourceManifestV1 | undefined;
const realManifest = (): CandidateSourceManifestV1 => {
  cachedRealManifest ??= buildCandidateManifest(realBuildInput());
  return structuredClone(cachedRealManifest);
};

const measuredCounts = (
  entries: readonly CandidateSourceManifestEntryV1[],
): CandidateManifestCounts => ({
  byInjury: {
    acl: entries.filter((entry) => entry.injuryCode === "acl").length,
    "ankle-sprain": entries.filter(
      (entry) => entry.injuryCode === "ankle-sprain",
    ).length,
    "achilles-rupture": entries.filter(
      (entry) => entry.injuryCode === "achilles-rupture",
    ).length,
  },
  total: entries.length,
  recent: entries.filter((entry) => !entry.isClassic).length,
  classic: entries.filter((entry) => entry.isClassic).length,
  byEmbedStatus: {
    verified: entries.filter((entry) => entry.video.embedStatus === "verified")
      .length,
    externalLinkOnly: entries.filter(
      (entry) => entry.video.embedStatus === "external-link-only",
    ).length,
  },
});

const rehashEntry = (
  entry: CandidateSourceManifestEntryV1,
): CandidateSourceManifestEntryV1 => {
  entry.entryDigest = computeCandidateManifestEntryDigest(entry);
  return entry;
};

const issueCodes = (value: unknown): string[] =>
  validateCandidateManifest(value).map((entry) => entry.code);

const buildFailureCodes = (input: CandidateManifestBuildInput): string[] => {
  try {
    buildCandidateManifest(input);
    return [];
  } catch (error) {
    if (!(error instanceof CandidateManifestBuildError)) throw error;
    return error.issues.map((entry) => entry.code);
  }
};

describe("G2 source-manifest count floor", () => {
  it("accepts the authorized 7 / 12 / 7 launch set at total 26", () => {
    expect(G2_LAUNCH_MIN_ENTRIES_PER_INJURY).toBe(7);
    expect(G2_LAUNCH_MIN_ENTRIES_TOTAL).toBe(26);
    expect(validateG2ManifestCountFloor("launch", counts(7, 12, 7))).toEqual(
      [],
    );
  });

  it("rejects an injury at 6 even when the launch total is 26", () => {
    expect(validateG2ManifestCountFloor("launch", counts(6, 13, 7))).toEqual([
      {
        code: "manifest-launch-injury-count-shortfall",
        message: "acl has 6 entries; the authorized G2 launch floor is 7",
        path: "counts.byInjury.acl",
      },
    ]);
  });

  it("rejects total 25 when every injury independently reaches 7", () => {
    expect(validateG2ManifestCountFloor("launch", counts(7, 11, 7))).toEqual([
      {
        code: "manifest-launch-total-count-shortfall",
        message: "launch has 25 entries; the authorized G2 floor is 26",
        path: "counts.total",
      },
    ]);
  });

  it("allows launch counts above both floors without an upper limit", () => {
    expect(validateG2ManifestCountFloor("launch", counts(8, 12, 7))).toEqual(
      [],
    );
  });

  it.each(["quarterly", "correction"] as const)(
    "does not apply the launch floor to a %s batch",
    (batchType) => {
      expect(validateG2ManifestCountFloor(batchType, counts(0, 0, 0))).toEqual(
        [],
      );
    },
  );

  it("retains the historical manifest floor while D21 public launch uses playable selection", () => {
    expect(MIN_PUBLIC_CASES_PER_INJURY).toBe(0);
    expect(MIN_PUBLIC_CASES_TOTAL).toBe(1);
  });
});

describe("G2 source-manifest classic composition", () => {
  it("accepts zero classic entries only for the authorized launch manifest", () => {
    expect(NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID).toBe(
      "NBA-SOURCE-2026-08-06-001",
    );
    expect(
      validateG2ManifestComposition(
        NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID,
        "launch",
        { classic: 0, recent: 26 },
      ),
    ).toEqual([]);
  });

  it("keeps the default one-classic floor for every other launch manifest", () => {
    expect(G2_LAUNCH_DEFAULT_MIN_CLASSIC_ENTRIES).toBe(1);
    expect(
      validateG2ManifestComposition("NBA-SOURCE-2026-11-01-001", "launch", {
        classic: 0,
        recent: 26,
      }),
    ).toEqual([
      {
        code: "manifest-launch-classic-count-shortfall",
        message:
          "launch NBA-SOURCE-2026-11-01-001 has 0 classic entries; the G2 launch floor is 1",
        path: "counts.classic",
      },
    ]);
  });

  it("still requires recent entries to outnumber classic entries", () => {
    expect(
      validateG2ManifestComposition(
        NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID,
        "launch",
        { classic: 13, recent: 13 },
      ),
    ).toEqual([
      {
        code: "manifest-launch-recent-not-greater-than-classic",
        message:
          "launch has 13 recent and 13 classic entries; recent entries must outnumber classic entries",
        path: "counts.recent",
      },
    ]);
  });

  it.each(["quarterly", "correction"] as const)(
    "does not apply launch composition gates to a %s batch",
    (batchType) => {
      expect(
        validateG2ManifestComposition("NBA-SOURCE-2026-11-01-001", batchType, {
          classic: 0,
          recent: 0,
        }),
      ).toEqual([]);
    },
  );
});

describe("canonical NBA authoring manifest builder", () => {
  it("builds the frozen nba-v2 launch manifest from exact source bytes", () => {
    const manifest = realManifest();

    expect(Object.keys(manifest).sort()).toEqual(
      [
        "schemaVersion",
        "manifestId",
        "batchType",
        "period",
        "sourcePolicyVersion",
        "cutoffDate",
        "generatedAt",
        "sourceReview",
        "sourceDigests",
        "counts",
        "supersedes",
        "entries",
      ].sort(),
    );
    expect(manifest).toMatchObject({
      schemaVersion: 1,
      manifestId: "NBA-SOURCE-2026-08-06-001",
      batchType: "launch",
      period: "2026-08-06",
      sourcePolicyVersion: "nba-v2",
      cutoffDate: "2016-08-06",
      generatedAt: "2026-08-07T15:31:19Z",
      sourceReview: {
        status: "approved-for-authoring",
        manifestId: "NBA-SOURCE-2026-08-06-001",
        reviewedBy: "吳易澄醫師",
        reviewedAt: "2026-08-07T15:31:19Z",
        classicProposalCandidateIds: [],
      },
      counts: {
        byInjury: { acl: 7, "ankle-sprain": 12, "achilles-rupture": 7 },
        total: 26,
        recent: 26,
        classic: 0,
        byEmbedStatus: { verified: 1, externalLinkOnly: 25 },
      },
      supersedes: [],
    });
    expect(manifest.sourceDigests).toEqual({
      aclCsvSha256: sha256Hex(REAL_CSV_BYTES.acl),
      ankleSprainCsvSha256: sha256Hex(REAL_CSV_BYTES["ankle-sprain"]),
      achillesRuptureCsvSha256: sha256Hex(REAL_CSV_BYTES["achilles-rupture"]),
      verificationArtifactSha256: sha256Hex(
        REAL_ARTIFACT_BYTES.verificationArtifactBytes,
      ),
      rootAuditSha256: sha256Hex(REAL_ARTIFACT_BYTES.rootAuditBytes),
      sourcePolicyJsonSha256: sha256Hex(
        REAL_ARTIFACT_BYTES.sourcePolicyJsonBytes,
      ),
      sourcePolicyMarkdownSha256: sha256Hex(
        REAL_ARTIFACT_BYTES.sourcePolicyMarkdownBytes,
      ),
      sourceReviewDecisionSha256: sha256Hex(
        REAL_ARTIFACT_BYTES.sourceReviewDecisionBytes,
      ),
    });
    expect(manifest.entries).toHaveLength(26);
    expect(
      manifest.entries.every(
        (entry) => entry.sourceStatus === "source-verified",
      ),
    ).toBe(true);
    expect(
      manifest.entries.every(
        (entry) =>
          entry.entryDigest === computeCandidateManifestEntryDigest(entry) &&
          entry.eventBinding.status === "passed" &&
          entry.verification.rootAuditStatus === "passed" &&
          entry.verification.resultReferences.length >= 4 &&
          entry.sourceReviewDecision.reviewedBy === "吳易澄醫師",
      ),
    ).toBe(true);
    expect(manifest.entries.map((entry) => entry.candidateId).sort()).toEqual(
      REAL_ROWS.filter((row) => row.discoveryStatus === "source-verified")
        .map((row) => row.candidateId)
        .sort(),
    );
    expect(validateCandidateManifest(manifest)).toEqual([]);
    expect(isCandidateSourceManifest(manifest)).toBe(true);
    expect(serializeCandidateManifest(manifest)).not.toMatch(
      /medicalReview|allowIndexing|indexingAuthorization|publicRelease/u,
    );
  });

  it("is byte/digest deterministic and never derives generatedAt from validationNow", () => {
    const first = buildCandidateManifest(realBuildInput());
    const laterFreshnessClock = buildCandidateManifest(
      realBuildInput({ validationNow: "2026-08-08T12:00:00Z" }),
    );

    expect(serializeCandidateManifest(laterFreshnessClock)).toBe(
      serializeCandidateManifest(first),
    );
    expect(digestCandidateManifest(laterFreshnessClock)).toBe(
      digestCandidateManifest(first),
    );
    expect(first.generatedAt).toBe("2026-08-07T15:31:19Z");
  });

  it("rejects stale verification, reviewer drift, and policy-byte drift", () => {
    expect(
      buildFailureCodes(
        realBuildInput({ validationNow: "2026-08-15T15:31:20Z" }),
      ),
    ).toContain("verification-stale");

    const driftedRows = structuredClone(REAL_ROWS);
    const reviewed = driftedRows.find(
      (row) => row.discoveryStatus === "source-verified",
    )!;
    reviewed.reviewedBy = "Different Reviewer";
    expect(buildFailureCodes(realBuildInput({ rows: driftedRows }))).toContain(
      "verification-review-identity",
    );

    expect(
      buildFailureCodes(
        realBuildInput({
          sourcePolicyMarkdownBytes: `${REAL_ARTIFACT_BYTES.sourcePolicyMarkdownBytes}\n`,
        }),
      ),
    ).toContain("manifest-source-policy");
  });

  it("rejects a noncanonical or digest-stale frozen artifact", () => {
    expect(
      buildFailureCodes(
        realBuildInput({
          rootAuditBytes: `${REAL_ARTIFACT_BYTES.rootAuditBytes}\n`,
        }),
      ),
    ).toContain("manifest-input-canonical");

    const decision = JSON.parse(
      REAL_ARTIFACT_BYTES.sourceReviewDecisionBytes,
    ) as Record<string, unknown>;
    decision.candidateSetDigest = "f".repeat(64);
    expect(
      buildFailureCodes(
        realBuildInput({
          sourceReviewDecisionBytes: canonicalJson(decision),
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "manifest-review-decision-binding",
        "verification-review-set-digest",
      ]),
    );
  });
});

describe("strict canonical manifest validation", () => {
  it("parses only strict canonical bytes and returns a typed manifest", () => {
    const manifest = realManifest();
    const bytes = serializeCandidateManifest(manifest);

    expect(parseCandidateManifestBytes(bytes)).toEqual({
      manifest,
      issues: [],
    });
    expect(parseCandidateManifestBytes(Buffer.from(bytes)).manifest).toEqual(
      manifest,
    );
    expect(parseCandidateManifestBytes(`${bytes}\n`).issues[0]?.code).toBe(
      "manifest-bytes",
    );
    expect(
      parseCandidateManifestBytes(bytes.replace("{", '{"schemaVersion":1,'))
        .issues[0]?.code,
    ).toBe("manifest-bytes");
  });

  it("rejects unknown/forbidden nested keys and all digest mismatches", () => {
    const unknown = realManifest();
    Object.assign(unknown.entries[0]!.video, { medicalReview: "approved" });
    expect(issueCodes(unknown)).toEqual(
      expect.arrayContaining(["manifest-schema", "manifest-forbidden-field"]),
    );

    const staleEntry = realManifest();
    staleEntry.entries[0]!.video.title = "Changed title";
    expect(issueCodes(staleEntry)).toContain("manifest-entry-digest");

    const staleBinding = realManifest();
    staleBinding.entries[0]!.verification.artifactDigest = "a".repeat(64);
    rehashEntry(staleBinding.entries[0]!);
    expect(issueCodes(staleBinding)).toContain("manifest-entry-binding");

    const malformed = realManifest();
    (malformed.entries[0] as unknown as { video: null }).video = null;
    expect(() => validateCandidateManifest(malformed)).not.toThrow();
    expect(issueCodes(malformed)).toContain("manifest-schema");
  });

  it("rejects non-NFC strings, non-source-verified entries, bad counts, and duplicates", () => {
    const nonNfc = realManifest();
    nonNfc.entries[0]!.video.title = "Cafe\u0301 injury event";
    rehashEntry(nonNfc.entries[0]!);
    expect(issueCodes(nonNfc)).toContain("manifest-nfc");

    const unreviewed = realManifest();
    (unreviewed.entries[0] as { sourceStatus: string }).sourceStatus =
      "source-ready";
    rehashEntry(unreviewed.entries[0]!);
    expect(issueCodes(unreviewed)).toContain("manifest-source-status");

    const badCounts = realManifest();
    badCounts.counts.total -= 1;
    expect(issueCodes(badCounts)).toContain("manifest-counts");

    const duplicate = realManifest();
    duplicate.entries[1]!.video.canonicalUrl =
      duplicate.entries[0]!.video.canonicalUrl;
    rehashEntry(duplicate.entries[1]!);
    expect(issueCodes(duplicate)).toContain("manifest-duplicate-video");

    const unsorted = realManifest();
    [unsorted.entries[0], unsorted.entries[1]] = [
      unsorted.entries[1]!,
      unsorted.entries[0]!,
    ];
    expect(issueCodes(unsorted)).toContain("manifest-entry-order");
  });

  it("keeps Decision 3 exact-batch scoped for otherwise valid launch manifests", () => {
    const otherLaunch = realManifest();
    otherLaunch.manifestId = "NBA-SOURCE-2026-11-01-001";
    otherLaunch.period = "2026-11-01";
    otherLaunch.sourceReview.manifestId = otherLaunch.manifestId;

    expect(issueCodes(otherLaunch)).toContain(
      "manifest-launch-classic-count-shortfall",
    );
  });

  it("admits an empty quarterly batch without inheriting launch gates", () => {
    const quarterly = realManifest();
    quarterly.manifestId = "NBA-SOURCE-2026-11-01-001";
    quarterly.batchType = "quarterly";
    quarterly.period = "2026-q4";
    quarterly.sourceReview.manifestId = quarterly.manifestId;
    quarterly.entries = [];
    quarterly.counts = measuredCounts([]);

    expect(validateCandidateManifest(quarterly)).toEqual([]);
  });

  it("requires exact one-to-one replacement pointers for correction batches", () => {
    const correction = realManifest();
    correction.manifestId = "NBA-SOURCE-2026-11-02-001";
    correction.batchType = "correction";
    correction.period = "2026-11-02";
    correction.sourceReview.manifestId = correction.manifestId;
    const replacement = structuredClone(correction.entries[0]!);
    const reference: SourceManifestSupersedesReference = {
      manifestId: NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID,
      candidateId: replacement.candidateId,
      entryDigest: replacement.entryDigest,
    };
    replacement.supersedes = reference;
    rehashEntry(replacement);
    correction.supersedes = [reference];
    correction.entries = [replacement];
    correction.counts = measuredCounts(correction.entries);

    expect(validateCandidateManifest(correction)).toEqual([]);

    const missingReference = structuredClone(correction);
    missingReference.supersedes = [];
    expect(issueCodes(missingReference)).toEqual(
      expect.arrayContaining([
        "manifest-supersedes",
        "manifest-correction-replacement",
      ]),
    );
  });

  it("validates the structured two-source classic exception without weakening launch rules", () => {
    const quarterly = realManifest();
    quarterly.manifestId = "NBA-SOURCE-2026-11-01-001";
    quarterly.batchType = "quarterly";
    quarterly.period = "2026-q4";
    quarterly.sourceReview.manifestId = quarterly.manifestId;
    const classic = structuredClone(quarterly.entries[0]!);
    classic.eventDate = "2015-03-01";
    classic.season = "2014-15";
    classic.isClassic = true;
    classic.classicReason = "Landmark pre-cutoff teaching case.";
    classic.classicProposedBy = {
      reviewedBy: quarterly.sourceReview.reviewedBy,
      reviewedAt: quarterly.sourceReview.reviewedAt,
      sourceReviewDecisionDigest:
        quarterly.sourceDigests.sourceReviewDecisionSha256,
    };
    classic.video.publishedAt = "2015-03-01";
    classic.eventSource.publishedAt = "2015-03-01";
    classic.diagnosisSources[0] = {
      ...classic.diagnosisSources[0],
      type: "diagnosis-secondary",
      independenceGroup: "independent-a",
      originReportId: null,
    };
    classic.diagnosisSources[1] = {
      ...classic.diagnosisSources[0],
      title: "Independent diagnosis report",
      publisher: "Independent Publisher",
      independenceGroup: "independent-b",
      url: "https://independent.example.org/diagnosis",
      publishedAt: "2015-03-02",
    };
    classic.firstPartyAvailability.status = "documented-unavailable";
    classic.firstPartyAvailability.basis =
      "Original first-party diagnosis was not available after bounded checks.";
    classic.firstPartyAvailability.archiveOrSearchChecks = [
      {
        queryOrUrl: "official archive query",
        outcome: "No original diagnosis located",
        observedAt: "2026-08-07T15:06:49Z",
      },
    ];
    rehashEntry(classic);
    quarterly.entries = [classic];
    quarterly.counts = measuredCounts(quarterly.entries);
    quarterly.sourceReview.classicProposalCandidateIds = [classic.candidateId];

    expect(validateCandidateManifest(quarterly)).toEqual([]);

    const unqualified = structuredClone(quarterly);
    unqualified.entries[0]!.diagnosisSources[1] = null;
    rehashEntry(unqualified.entries[0]!);
    expect(issueCodes(unqualified)).toContain("manifest-classic-evidence");
  });
});
