import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import {
  EMPTY_PUBLIC_RELEASE_HISTORY_BYTES,
  computePublicReleaseDigest,
  validateHistoricalReleaseSources,
  validateHistoryAppend,
  validateReleaseHistory,
} from "../../src/lib/contracts/release-history";
import {
  EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
  resolveHistoricalSourceManifestBinding,
  resolveSourceManifestBinding,
} from "../../src/lib/contracts/source-manifest-registry";

const hex = (ch: string): string => ch.repeat(64);
const COMMIT_A = "1".repeat(40);
const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );
const codes = (history: unknown): string[] =>
  validateReleaseHistory(history).map((issue) => issue.code);

interface BatchInput {
  manifest: any;
  decision: any;
  createdAt: string;
  supersedes?: any[];
}

/** Bakes fictional research batches into a temp root with recomputed digests. */
function bakeBatches(batches: BatchInput[]) {
  const root = mkdtempSync(join(tmpdir(), "atlas-history-"));
  const writeAt = (rel: string, bytes: string): void => {
    const target = join(root, rel);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  };
  const entries: any[] = [];
  const digests = new Map<
    string,
    {
      manifestDigest: string;
      decisionDigest: string;
      entryDigests: Map<string, string>;
    }
  >();
  let previousBytes = EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES;
  for (const batch of batches) {
    const manifestBytes = canonicalJson(batch.manifest);
    const manifestDigest = sha256Hex(manifestBytes);
    const decisionBytes = canonicalJson({ ...batch.decision, manifestDigest });
    const decisionDigest = sha256Hex(decisionBytes);
    const manifestPath = `research/source-manifests/${batch.manifest.manifestId}.v1.json`;
    const decisionPath = `research/reviews/source-batches/${batch.manifest.manifestId}-source-review-decision.v1.json`;
    writeAt(manifestPath, manifestBytes);
    writeAt(decisionPath, decisionBytes);
    entries.push({
      manifestId: batch.manifest.manifestId,
      manifestPath,
      manifestDigest,
      sourceReviewDecisionPath: decisionPath,
      sourceReviewDecisionDigest: decisionDigest,
      sourcePolicyVersion: batch.manifest.sourcePolicyVersion,
      batchType: batch.manifest.batchType,
      period: batch.manifest.period,
      createdAt: batch.createdAt,
      previousRegistryBytesDigest: sha256Hex(previousBytes),
      supersedes: batch.supersedes ?? [],
    });
    previousBytes = canonicalJson({ entries: [...entries], schemaVersion: 1 });
    const entryDigests = new Map<string, string>();
    for (const entry of batch.manifest.entries) {
      entryDigests.set(entry.candidateId, sha256Hex(canonicalJson(entry)));
    }
    digests.set(batch.manifest.manifestId, {
      manifestDigest,
      decisionDigest,
      entryDigests,
    });
  }
  const registry = { schemaVersion: 1, entries };
  writeAt("research/source-manifest-registry.v1.json", canonicalJson(registry));
  const bindingFor = (manifestId: string, candidateId: string) => {
    const batch = digests.get(manifestId)!;
    return {
      candidateId,
      manifestId,
      manifestDigest: batch.manifestDigest,
      entryDigest: batch.entryDigests.get(candidateId)!,
      sourceReviewDecisionDigest: batch.decisionDigest,
      sourcePolicyVersion: "source-policy-v1",
    };
  };
  const loadAtCommit = (commit: string, path: string): Uint8Array => {
    if (commit !== COMMIT_A) throw new Error(`unknown commit ${commit}`);
    return readFileSync(join(root, path));
  };
  return { root, registry, bindingFor, loadAtCommit };
}

function makeRelease(
  overrides: Record<string, unknown>,
  previous: any | null,
  previousHistoryBytes: string,
): any {
  const base: any = {
    releaseId: "release-001",
    releasedAt: "2026-08-06T12:00:00Z",
    previousReleaseDigest: previous ? previous.releaseDigest : null,
    previousHistoryBytesDigest: sha256Hex(previousHistoryBytes),
    siteDigest: hex("1"),
    sitePublicationDecisionDigest: hex("2"),
    buildCommit: COMMIT_A,
    publicRendererTreeDigest: hex("3"),
    deploymentArtifactDigest: hex("4"),
    servedArtifactReceiptDigest: hex("5"),
    publicUrlHash: hex("6"),
    caseSnapshots: [],
    injuryOverviewSnapshots: [],
    updateSnapshots: [
      {
        updateId: "2026-q3",
        updateDigest: hex("7"),
        publishedAt: "2026-08-06T11:00:00Z",
      },
    ],
    ...overrides,
  };
  return { ...base, releaseDigest: computePublicReleaseDigest(base) };
}

describe("public release history contract", () => {
  it("fixes the canonical empty-history bytes and committed artifact", () => {
    expect(EMPTY_PUBLIC_RELEASE_HISTORY_BYTES).toBe(
      '{"releases":[],"schemaVersion":1}',
    );
    const committed = readFileSync(
      new URL(
        "../../public-release-history/public-release-history.v1.json",
        import.meta.url,
      ),
      "utf8",
    );
    expect(committed).toBe(EMPTY_PUBLIC_RELEASE_HISTORY_BYTES);
  });

  it("validates the empty history and a well-formed first release", () => {
    expect(validateReleaseHistory({ releases: [], schemaVersion: 1 })).toEqual(
      [],
    );
    const release = makeRelease({}, null, EMPTY_PUBLIC_RELEASE_HISTORY_BYTES);
    expect(
      validateReleaseHistory({ releases: [release], schemaVersion: 1 }),
    ).toEqual([]);
  });

  it("rejects a nonempty first-release predecessor", () => {
    const release = makeRelease(
      { previousReleaseDigest: hex("9") },
      null,
      EMPTY_PUBLIC_RELEASE_HISTORY_BYTES,
    );
    expect(codes({ releases: [release], schemaVersion: 1 })).toContain(
      "history-first-release",
    );
  });

  it("rejects chain gaps and duplicate release or update IDs", () => {
    const first = makeRelease({}, null, EMPTY_PUBLIC_RELEASE_HISTORY_BYTES);
    const firstHistoryBytes = canonicalJson({
      releases: [first],
      schemaVersion: 1,
    });
    const second = makeRelease(
      {
        releaseId: "release-002",
        releasedAt: "2026-11-06T12:00:00Z",
        previousReleaseDigest: hex("d"),
      },
      null,
      firstHistoryBytes,
    );
    expect(codes({ releases: [first, second], schemaVersion: 1 })).toContain(
      "history-chain",
    );

    const dupId = makeRelease(
      {
        releaseId: "release-001",
        releasedAt: "2026-11-06T12:00:00Z",
        previousReleaseDigest: first.releaseDigest,
      },
      first,
      firstHistoryBytes,
    );
    expect(codes({ releases: [first, dupId], schemaVersion: 1 })).toContain(
      "history-duplicate",
    );

    const dupUpdate = makeRelease(
      {
        updateSnapshots: [
          {
            updateId: "2026-q3",
            updateDigest: hex("7"),
            publishedAt: "2026-08-06T11:00:00Z",
          },
          {
            updateId: "2026-q3",
            updateDigest: hex("8"),
            publishedAt: "2026-08-06T11:00:00Z",
          },
        ],
      },
      null,
      EMPTY_PUBLIC_RELEASE_HISTORY_BYTES,
    );
    expect(codes({ releases: [dupUpdate], schemaVersion: 1 })).toContain(
      "history-duplicate",
    );
  });

  it("rejects tampered snapshot digests and changed historical entries", () => {
    const release = makeRelease({}, null, EMPTY_PUBLIC_RELEASE_HISTORY_BYTES);
    const tampered = structuredClone(release);
    tampered.updateSnapshots[0].updateDigest = hex("e");
    expect(codes({ releases: [tampered], schemaVersion: 1 })).toContain(
      "history-digest",
    );
    const changed = structuredClone(release);
    changed.siteDigest = hex("f");
    expect(codes({ releases: [changed], schemaVersion: 1 })).toContain(
      "history-digest",
    );
  });

  it("rejects missing or malformed publication and artifact digests", () => {
    const badCommit = makeRelease(
      { buildCommit: "not-a-commit" },
      null,
      EMPTY_PUBLIC_RELEASE_HISTORY_BYTES,
    );
    expect(codes({ releases: [badCommit], schemaVersion: 1 })).toContain(
      "history-schema",
    );
    const release: any = makeRelease(
      {},
      null,
      EMPTY_PUBLIC_RELEASE_HISTORY_BYTES,
    );
    delete release.servedArtifactReceiptDigest;
    expect(codes({ releases: [release], schemaVersion: 1 })).toContain(
      "history-schema",
    );
    const badUrl = makeRelease(
      { publicUrlHash: "https://example.org" },
      null,
      EMPTY_PUBLIC_RELEASE_HISTORY_BYTES,
    );
    expect(codes({ releases: [badUrl], schemaVersion: 1 })).toContain(
      "history-schema",
    );
  });

  it("requires sorted snapshot lists", () => {
    const release = makeRelease(
      {
        caseSnapshots: [
          {
            caseId: "CASE-FIC-2026-001",
            clinicalDigest: hex("a"),
            videoSourceDigest: hex("b"),
            candidateId: "FIC-CAND-001",
            manifestId: "FICTIONAL-SOURCE-2026-08-06-001",
            manifestDigest: hex("c"),
            entryDigest: hex("d"),
            sourceReviewDecisionDigest: hex("e"),
            sourcePolicyVersion: "source-policy-v1",
          },
          {
            caseId: "CASE-FIC-2014-002",
            clinicalDigest: hex("a"),
            videoSourceDigest: hex("b"),
            candidateId: "FIC-CAND-002",
            manifestId: "FICTIONAL-SOURCE-2026-08-06-001",
            manifestDigest: hex("c"),
            entryDigest: hex("d"),
            sourceReviewDecisionDigest: hex("e"),
            sourcePolicyVersion: "source-policy-v1",
          },
        ],
      },
      null,
      EMPTY_PUBLIC_RELEASE_HISTORY_BYTES,
    );
    expect(codes({ releases: [release], schemaVersion: 1 })).toContain(
      "history-order",
    );
  });

  describe("append-only continuity", () => {
    const first = makeRelease({}, null, EMPTY_PUBLIC_RELEASE_HISTORY_BYTES);
    const firstHistory = { releases: [first], schemaVersion: 1 };
    const firstBytes = canonicalJson(firstHistory);
    const second = makeRelease(
      {
        releaseId: "release-002",
        releasedAt: "2026-11-06T12:00:00Z",
      },
      first,
      firstBytes,
    );

    it("accepts appending exactly one release with the exact prior bytes", () => {
      const next = { releases: [first, second], schemaVersion: 1 };
      expect(
        validateHistoryAppend(
          Buffer.from(firstBytes),
          next as any,
          sha256Hex(firstBytes),
        ),
      ).toEqual([]);
    });

    it("rejects changed prior bytes and wrong anchored digests", () => {
      const next = { releases: [first, second], schemaVersion: 1 };
      expect(
        validateHistoryAppend(
          Buffer.from(firstBytes),
          next as any,
          hex("9"),
        ).map((issue) => issue.code),
      ).toContain("history-append-prev-digest");

      const mutatedPrior = structuredClone(firstHistory) as any;
      mutatedPrior.releases[0].siteDigest = hex("f");
      const mutatedBytes = canonicalJson(mutatedPrior);
      expect(
        validateHistoryAppend(
          Buffer.from(mutatedBytes),
          next as any,
          sha256Hex(firstBytes),
        ).map((issue) => issue.code),
      ).toContain("history-append-prev-digest");
    });

    it("rejects multi-entry appends, replacement, removal, and reordering", () => {
      const third = makeRelease(
        { releaseId: "release-003", releasedAt: "2027-02-06T12:00:00Z" },
        second,
        canonicalJson({ releases: [first, second], schemaVersion: 1 }),
      );
      expect(
        validateHistoryAppend(
          Buffer.from(firstBytes),
          { releases: [first, second, third], schemaVersion: 1 } as any,
          sha256Hex(firstBytes),
        ).map((issue) => issue.code),
      ).toContain("history-append-count");

      const replaced = structuredClone(first);
      replaced.siteDigest = hex("f");
      replaced.releaseDigest = computePublicReleaseDigest(replaced);
      const replacedSecond = makeRelease(
        { releaseId: "release-002", releasedAt: "2026-11-06T12:00:00Z" },
        replaced,
        canonicalJson({ releases: [replaced], schemaVersion: 1 }),
      );
      expect(
        validateHistoryAppend(
          Buffer.from(firstBytes),
          { releases: [replaced, replacedSecond], schemaVersion: 1 } as any,
          sha256Hex(firstBytes),
        ).map((issue) => issue.code),
      ).toContain("history-append-prefix");

      const removalCodes = validateHistoryAppend(
        Buffer.from(firstBytes),
        { releases: [second], schemaVersion: 1 } as any,
        sha256Hex(firstBytes),
      ).map((issue) => issue.code);
      expect(
        removalCodes.includes("history-append-count") ||
          removalCodes.includes("history-first-release"),
      ).toBe(true);
    });

    it("rejects predecessor/base mismatch on the appended terminal entry", () => {
      const detached = makeRelease(
        {
          releaseId: "release-002",
          releasedAt: "2026-11-06T12:00:00Z",
          previousReleaseDigest: hex("9"),
          previousHistoryBytesDigest: sha256Hex(firstBytes),
        },
        null,
        firstBytes,
      );
      const detachedCodes = validateHistoryAppend(
        Buffer.from(firstBytes),
        { releases: [first, detached], schemaVersion: 1 } as any,
        sha256Hex(firstBytes),
      ).map((issue) => issue.code);
      expect(
        detachedCodes.includes("history-append-predecessor") ||
          detachedCodes.includes("history-chain"),
      ).toBe(true);

      const wrongBase = makeRelease(
        {
          releaseId: "release-002",
          releasedAt: "2026-11-06T12:00:00Z",
          previousHistoryBytesDigest: hex("8"),
        },
        first,
        firstBytes,
      );
      expect(
        validateHistoryAppend(
          Buffer.from(firstBytes),
          { releases: [first, wrongBase], schemaVersion: 1 } as any,
          sha256Hex(firstBytes),
        ).map((issue) => issue.code),
      ).toContain("history-append-predecessor");
    });
  });

  describe("historical release sources across corrections", () => {
    const launchManifest = (): any =>
      loadFixture(
        "research/source-manifests/FICTIONAL-SOURCE-2026-08-06-001.v1.json",
      );
    const launchDecision = (): any =>
      loadFixture(
        "research/reviews/source-batches/FICTIONAL-SOURCE-2026-08-06-001-source-review-decision.v1.json",
      );

    function correctionScenario() {
      const manifest1 = launchManifest();
      const decision1 = launchDecision();
      const corrected = structuredClone(manifest1.entries[1]);
      corrected.uploaderName = "Fictional League Classics Channel (Corrected)";
      const manifest2 = {
        schemaVersion: 1,
        manifestId: "FICTIONAL-SOURCE-2026-09-01-001",
        batchType: "correction",
        period: "2026-09-01",
        sourcePolicyVersion: "source-policy-v1",
        entries: [corrected],
      };
      const decision2 = {
        schemaVersion: 1,
        decisionType: "source-batch-review",
        manifestId: manifest2.manifestId,
        manifestDigest: hex("0"),
        decisionStatus: "approved",
        sourcePolicyVersion: "source-policy-v1",
        reviewedBy: "Fictional Screener One",
        reviewedAt: "2026-09-01T00:00:00Z",
        candidateDecisions: [
          {
            candidateId: "FIC-CAND-002",
            status: "accepted",
            classicProposal: {
              proposedBy: "Fictional Curator One",
              firstPartyDiagnosisEvidence: "available",
            },
          },
        ],
      };
      const entry1Digest = sha256Hex(canonicalJson(manifest1.entries[1]));
      const baked = bakeBatches([
        {
          manifest: manifest1,
          decision: decision1,
          createdAt: "2026-08-06T01:00:00Z",
        },
        {
          manifest: manifest2,
          decision: decision2,
          createdAt: "2026-09-01T01:00:00Z",
          supersedes: [
            {
              manifestId: manifest1.manifestId,
              candidateId: "FIC-CAND-002",
              entryDigest: entry1Digest,
            },
          ],
        },
      ]);
      const oldBinding = baked.bindingFor(manifest1.manifestId, "FIC-CAND-002");
      const releaseA = makeRelease(
        {
          caseSnapshots: [
            {
              caseId: "CASE-FIC-2014-002",
              clinicalDigest: hex("a"),
              videoSourceDigest: hex("b"),
              ...oldBinding,
            },
          ],
        },
        null,
        EMPTY_PUBLIC_RELEASE_HISTORY_BYTES,
      );
      const history = { releases: [releaseA], schemaVersion: 1 };
      return { baked, oldBinding, history };
    }

    it("rejects the old binding currently while historical release-A still validates", () => {
      const { baked, oldBinding, history } = correctionScenario();
      expect(() =>
        resolveSourceManifestBinding(baked.registry as any, oldBinding as any),
      ).toThrow();
      const historical = resolveHistoricalSourceManifestBinding(
        baked.registry as any,
        oldBinding as any,
      );
      expect(historical.superseded).toBe(true);
      expect(
        validateHistoricalReleaseSources(
          history as any,
          baked.registry as any,
          baked.loadAtCommit,
        ),
      ).toEqual([]);
    });

    it("fails missing or tampered release-commit artifacts", () => {
      const { baked, history } = correctionScenario();
      const missing = (commit: string, path: string): Uint8Array => {
        if (path.includes("source-review-decision")) {
          throw new Error("missing decision at commit");
        }
        return baked.loadAtCommit(commit, path);
      };
      expect(
        validateHistoricalReleaseSources(
          history as any,
          baked.registry as any,
          missing,
        ).map((issue) => issue.code),
      ).toContain("history-source-artifact");

      const tampered = (commit: string, path: string): Uint8Array => {
        const bytes = baked.loadAtCommit(commit, path);
        if (
          path.startsWith(
            "research/source-manifests/FICTIONAL-SOURCE-2026-08-06",
          )
        ) {
          const parsed = JSON.parse(Buffer.from(bytes).toString("utf8"));
          parsed.entries[1].uploaderName = "Tampered Uploader";
          return Buffer.from(canonicalJson(parsed));
        }
        return bytes;
      };
      expect(
        validateHistoricalReleaseSources(
          history as any,
          baked.registry as any,
          tampered,
        ).map((issue) => issue.code),
      ).toContain("history-source-digest");
    });

    it("fails a snapshot whose source tuple no longer matches any registry entry", () => {
      const { baked, history } = correctionScenario();
      const forged = structuredClone(history) as any;
      forged.releases[0].caseSnapshots[0].manifestDigest = hex("9");
      forged.releases[0].releaseDigest = computePublicReleaseDigest(
        forged.releases[0],
      );
      expect(
        validateHistoricalReleaseSources(
          forged,
          baked.registry as any,
          baked.loadAtCommit,
        ).map((issue) => issue.code),
      ).toContain("history-source-resolve");
    });
  });
});
