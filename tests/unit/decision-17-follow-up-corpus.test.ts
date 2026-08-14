import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadFollowUpCorpus } from "../../src/lib/cases/follow-up-loader";
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

describe("Decision 17 real follow-up corpus", () => {
  it("binds all 26 cases to source-ready ledgers and pending sidecars", () => {
    const corpus = loadFollowUpCorpus(ROOT, loadCases(), {
      expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
    });
    expect(corpus.issues).toEqual([]);
    expect(corpus.entries).toHaveLength(26);

    const items = corpus.entries.flatMap((entry) =>
      FOLLOW_UP_KINDS.flatMap((kind) => entry.sidecar.categories[kind]),
    );
    expect(items).toHaveLength(44);
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
      "team-or-league-official": 29,
      "mainstream-media-report": 14,
      "unverified-report": 1,
    });
    expect(
      Object.fromEntries(
        FOLLOW_UP_KINDS.map((kind) => [
          kind,
          items.filter((item) => item.kind === kind).length,
        ]),
      ),
    ).toEqual({
      treatment: 16,
      surgery: 13,
      injection: 0,
      "actual-return": 15,
    });

    expect(
      corpus.entries
        .filter(
          (entry) =>
            FOLLOW_UP_KINDS.flatMap((kind) => entry.sidecar.categories[kind])
              .length === 0,
        )
        .map((entry) => entry.research.caseSlug),
    ).toEqual([
      "anfernee-simons-ankle-sprain-2023",
      "cj-mccollum-ankle-sprain-2020",
      "lamelo-ball-ankle-sprain-2023",
    ]);
  });

  it("keeps every retained fact atomic, opened, individually sourced, and pending", () => {
    const corpus = loadFollowUpCorpus(ROOT, loadCases(), {
      expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
    });
    const researchFacts = corpus.entries.flatMap((entry) =>
      FOLLOW_UP_KINDS.flatMap((kind) => entry.research.categories[kind].facts),
    );
    const items = corpus.entries.flatMap((entry) =>
      FOLLOW_UP_KINDS.flatMap((kind) => entry.sidecar.categories[kind]),
    );

    expect(researchFacts).toHaveLength(44);
    expect(
      corpus.entries.flatMap((entry) =>
        FOLLOW_UP_KINDS.map((kind) => entry.research.categories[kind]),
      ),
    ).toHaveLength(104);
    expect(
      researchFacts.every(
        (fact) =>
          fact.evidenceUse === "opened-original-page" &&
          fact.searchSnippetUsedAsEvidence === false &&
          fact.source.canonicalUrl.startsWith("https://") &&
          fact.source.title.length > 0 &&
          fact.source.publisher.length > 0 &&
          fact.source.publishedAt.length === 10 &&
          fact.source.accessedAt === "2026-08-14",
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
    expect(
      items
        .filter((item) => item.kind === "actual-return")
        .every(
          (item) =>
            item.sourceTier === "team-or-league-official" &&
            item.factDate !== null &&
            item.factDate <= "2026-08-14",
        ),
    ).toBe(true);
  });
});
