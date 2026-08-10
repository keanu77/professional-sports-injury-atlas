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

import { afterEach, describe, expect, it } from "vitest";

import {
  BATCH2_CORRECTION_MANIFEST_PATH,
  BATCH2_DECISION_PATH,
  BATCH2_ORIGIN_MANIFEST_PATH,
  BATCH2_REGISTRY_PATH,
  BATCH2_REVIEW_SET_PATH,
  batch2Summary,
  checkBatch2Artifacts,
} from "../../scripts/research/check-embed-batch2-correction";
import {
  canonicalJson,
  parseStrictJson,
} from "../../src/lib/contracts/canonical";

const REAL_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const FIXTURE_PATHS = [
  BATCH2_REVIEW_SET_PATH,
  BATCH2_ORIGIN_MANIFEST_PATH,
  BATCH2_CORRECTION_MANIFEST_PATH,
  BATCH2_DECISION_PATH,
  BATCH2_REGISTRY_PATH,
  "research/source-manifests/NBA-SOURCE-2026-08-08-001.v1.json",
  "research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json",
  "research/reviews/source-batches/NBA-SOURCE-2026-08-08-001-source-review-decision.v1.json",
  "research/reviews/embed-enrichment/NBA-EMBED-2026-08-08-001-review-set.v1.json",
  "docs/reviews/2026-08-10-nba-embed-batch2-playwright-stop.md",
] as const;

const cleanupRoots: string[] = [];

afterEach(() => {
  while (cleanupRoots.length > 0) {
    rmSync(cleanupRoots.pop() as string, { recursive: true, force: true });
  }
});

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "embed-batch2-correction-"));
  cleanupRoots.push(root);
  for (const path of FIXTURE_PATHS) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(REAL_ROOT, path), target);
  }
  return root;
}

function mutateJson(
  root: string,
  path: string,
  mutate: (value: any) => void,
  format: "pretty" | "canonical" = "canonical",
): void {
  const value = parseStrictJson(readFileSync(join(root, path), "utf8"));
  mutate(value);
  writeFileSync(
    join(root, path),
    format === "pretty"
      ? `${JSON.stringify(value, null, 2)}\n`
      : canonicalJson(value),
  );
}

describe("Decision 8 batch-2 correction transaction", () => {
  it("reconstructs and validates the exact frozen artifacts", () => {
    const root = fixtureRoot();

    expect(() => checkBatch2Artifacts(root)).not.toThrow();
    expect(batch2Summary(root)).toMatchObject({
      reviewedSnapshotDigest:
        "02747f8a5aca555f9f4ff04232fdb0bcc820ed039793180b7904dce290d4c867",
      sourceReviewDecisionDigest:
        "d5b934a3f450b4c3d93bdcd396dc032abe690bb11f1638095ad815e38d3c2ca7",
      manifestDigest:
        "bd1121d29e6ffda0122d920b6588e378dd2a1d011fa602689ccefa60c2bf86ff",
      registryDigest:
        "3326ec1aba88b264ef53ed1253a1b0a8abc38a6e7a246a9f642061da8a260d7a",
    });
  });

  it.each([
    [
      "wrong candidate",
      (value: any) => {
        value.acceptedCorrections[0].candidateId = "CAND-NBA-ANKLE-2023-999";
      },
    ],
    [
      "wrong video",
      (value: any) => {
        value.acceptedCorrections[0].video.canonicalUrl =
          "https://www.youtube.com/watch?v=JNoDsgkZUbc";
      },
    ],
    [
      "wrong uploader",
      (value: any) => {
        value.acceptedCorrections[0].video.uploaderName = "ESPN";
      },
    ],
    [
      "available/unavailable caption drift",
      (value: any) => {
        value.acceptedCorrections[1].video.captionStatus = "available";
      },
    ],
    [
      "wrong owner and time",
      (value: any) => {
        value.ownerDecision.reviewedBy = "Automated checker";
        value.ownerDecision.reviewedAt = "2026-08-10T11:36:09Z";
      },
    ],
    [
      "stale supersedes reference",
      (value: any) => {
        value.acceptedCorrections[2].supersedes.entryDigest = "0".repeat(64);
      },
    ],
    [
      "duplicate accepted identity",
      (value: any) => {
        value.acceptedCorrections[1].video.canonicalUrl =
          value.acceptedCorrections[0].video.canonicalUrl;
      },
    ],
    [
      "noncanonical YouTube URL",
      (value: any) => {
        value.acceptedCorrections[2].video.canonicalUrl =
          "https://www.youtube.com/shorts/zZdndTqOexc";
      },
    ],
    [
      "selection of the Haliburton alternate",
      (value: any) => {
        value.acceptedCorrections[3].video.canonicalUrl =
          "https://www.youtube.com/watch?v=JNoDsgkZUbc";
      },
    ],
  ])("rejects %s in the reviewed snapshot", (_label, mutate) => {
    const root = fixtureRoot();
    mutateJson(root, BATCH2_REVIEW_SET_PATH, mutate, "pretty");

    expect(() => checkBatch2Artifacts(root)).toThrow();
  });

  it("rejects an altered NBA.com event source in the published manifest", () => {
    const root = fixtureRoot();
    mutateJson(root, BATCH2_CORRECTION_MANIFEST_PATH, (value) => {
      value.entries[0].eventSource.url =
        "https://www.nba.com/watch/video/altered-event-source";
    });

    expect(() => checkBatch2Artifacts(root)).toThrow(
      "published batch-2 correction manifest bytes drifted",
    );
  });

  it("rejects a reordered or rewritten prior registry prefix", () => {
    const root = fixtureRoot();
    mutateJson(root, BATCH2_REGISTRY_PATH, (value) => {
      value.entries[0].period = "2026-08-05";
    });

    expect(() => checkBatch2Artifacts(root)).toThrow(
      "registry prefix was reordered, rewritten, or extended",
    );
  });

  it("rejects source-decision byte drift", () => {
    const root = fixtureRoot();
    mutateJson(root, BATCH2_DECISION_PATH, (value) => {
      value.reviewedAt = "2026-08-10T11:36:09Z";
    });

    expect(() => checkBatch2Artifacts(root)).toThrow(
      "published batch-2 source decision bytes drifted",
    );
  });
});
