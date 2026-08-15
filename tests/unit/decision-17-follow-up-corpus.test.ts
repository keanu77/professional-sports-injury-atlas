import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadDecision18TransitionalFollowUpCorpus } from "../../src/lib/cases/decision-18-follow-up-corpus";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
} from "../../src/lib/contracts/case-follow-up";
import { caseSchema } from "../../src/lib/contracts/case";
import { parseStrictJson } from "../../src/lib/contracts/canonical";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function loadCases() {
  const directory = join(ROOT, "src/content/cases");
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) =>
      caseSchema.parse(
        parseStrictJson(readFileSync(join(directory, name), "utf8")),
      ),
    );
}

function loadCorpus() {
  return loadDecision18TransitionalFollowUpCorpus(ROOT, loadCases(), {
    expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  });
}

// Decision 18 superseded the Decision 17 corpus: every case now resolves through
// a completed Decision 18 batch receipt, so the Decision 17 v1 ledgers are only
// retained as historical baselines. The composition numbers below are the
// post-exhaustive-audit corpus, not the Decision 17 ones.
describe("Decision 18 real follow-up corpus", () => {
  it("binds all 26 cases to completed Decision 18 ledgers and pending sidecars", () => {
    const corpus = loadCorpus();
    expect(corpus.issues).toEqual([]);
    expect(corpus.entries).toHaveLength(26);
    expect(corpus.completedBatchIds).toEqual(["acl", "ankle", "achilles"]);
    expect(
      corpus.entries.every((entry) => entry.provenance === "decision-18-v2"),
    ).toBe(true);

    const items = corpus.entries.flatMap((entry) =>
      FOLLOW_UP_KINDS.flatMap((kind) => entry.sidecar.categories[kind]),
    );
    expect(items).toHaveLength(148);
    expect(
      Object.fromEntries(
        [
          "team-or-league-official",
          "mainstream-media-report",
          "unverified-report",
        ].map((tier) => [
          tier,
          items.filter((item) => item.sourceTier === tier).length,
        ]),
      ),
    ).toEqual({
      "team-or-league-official": 63,
      "mainstream-media-report": 81,
      "unverified-report": 4,
    });
    expect(
      Object.fromEntries(
        FOLLOW_UP_KINDS.map((kind) => [
          kind,
          items.filter((item) => item.kind === kind).length,
        ]),
      ),
    ).toEqual({
      treatment: 96,
      surgery: 28,
      injection: 0,
      "actual-return": 24,
    });

    // The exhaustive audit left no case without at least one qualifying fact;
    // Decision 17 still had three empty cases.
    expect(
      corpus.entries
        .filter(
          (entry) =>
            FOLLOW_UP_KINDS.flatMap((kind) => entry.sidecar.categories[kind])
              .length === 0,
        )
        .map((entry) => entry.caseSlug),
    ).toEqual([]);
  });

  it("keeps every retained item atomic, opened, individually sourced, and pending", () => {
    const corpus = loadCorpus();
    const items = corpus.entries.flatMap((entry) =>
      FOLLOW_UP_KINDS.flatMap((kind) => entry.sidecar.categories[kind]),
    );

    expect(
      items.every(
        (item) =>
          item.source.canonicalUrl.startsWith("https://") &&
          item.source.title.length > 0 &&
          item.source.publisher.length > 0 &&
          item.source.publishedAt.length === 10,
      ),
    ).toBe(true);

    // Decision 17 items keep their historical 2026-08-14 access date; every
    // Decision 18 addition carries its own receipt-derived 2026-08-15 date.
    expect(
      items.every((item) =>
        ["2026-08-14", "2026-08-15"].includes(item.source.accessedAt),
      ),
    ).toBe(true);

    expect(
      items.every(
        (item) =>
          item.review.status === "pending-owner-signoff" &&
          Object.keys(item.review).sort().join(",") ===
            "reviewedPayloadDigest,status",
      ),
    ).toBe(true);

    // actual-return stayed official-only and retrospective through the
    // exhaustive audit; broader sourcing never relaxed this kind.
    expect(
      items
        .filter((item) => item.kind === "actual-return")
        .every(
          (item) =>
            item.sourceTier === "team-or-league-official" &&
            item.factDate !== null &&
            item.factDate <= item.source.accessedAt,
        ),
    ).toBe(true);
  });
});
