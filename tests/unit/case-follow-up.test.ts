import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { computeCaseContentDigest } from "../../src/lib/cases/digest";
import {
  computeFollowUpDraftDigest,
  computeFollowUpItemPayloadDigest,
} from "../../src/lib/cases/follow-up-digest";
import {
  FOLLOW_UP_CONTENT_DIRECTORY,
  FOLLOW_UP_RESEARCH_DIRECTORY,
  loadFollowUpCorpus,
  validateCaseFollowUpRecord,
  validateFollowUpResearchRecord,
} from "../../src/lib/cases/follow-up-loader";
import {
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  caseFollowUpSchema,
  parseCaseFollowUpBytes,
  parseFollowUpResearchBytes,
  type CaseFollowUp,
  type FollowUpItem,
  type FollowUpResearch,
  type FollowUpSourcePolicyBinding,
} from "../../src/lib/contracts/case-follow-up";
import type { InjuryCase } from "../../src/lib/contracts/case";
import { canonicalJson } from "../../src/lib/contracts/canonical";

const temporaryRoots: string[] = [];
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

const policy: FollowUpSourcePolicyBinding = {
  ...FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
};

function fixtureCase(): InjuryCase {
  return JSON.parse(
    readFileSync(
      new URL("../fixtures/cases/valid-medical-review.json", import.meta.url),
      "utf8",
    ),
  ) as InjuryCase;
}

function researchFixture(record: InjuryCase = fixtureCase()): FollowUpResearch {
  const empty = (kind: string) => ({
    queryBoundaries: [
      {
        query: `${record.athlete.name} ${kind}`,
        locationsChecked: ["official team and league pages"],
        performedAt: "2026-08-14",
        stoppingBoundary:
          "bounded first-party and named-outlet search complete",
      },
    ],
    outcome: "not-found" as const,
    notFoundReason: "No qualifying individually attributable report found.",
    facts: [],
  });
  return {
    schemaVersion: "case-follow-up-research.v1",
    caseId: record.id,
    caseSlug: record.slug,
    caseClinicalDigest: computeCaseContentDigest(record),
    evidenceStatus: "source-ready",
    sourcePolicyBinding: { ...policy },
    categories: {
      treatment: empty("treatment"),
      surgery: empty("surgery"),
      injection: empty("injection"),
      "actual-return": {
        queryBoundaries: [
          {
            query: `${record.athlete.name} actual return official game record`,
            locationsChecked: ["official league game record"],
            performedAt: "2026-08-14",
            stoppingBoundary: "one occurred participation record retained",
          },
        ],
        outcome: "source-ready",
        notFoundReason: null,
        facts: [
          {
            evidenceId: "evidence-fictional-return-01",
            itemId: "follow-up-fictional-return-01",
            kind: "actual-return",
            attributedStatement:
              "Metro City Comets Communications 記錄該球員已於 2026-03-03 出賽。",
            factDate: "2026-03-03",
            sourceTier: "team-or-league-official",
            tierBasis:
              "The named publisher is the team's directly controlled communications office.",
            source: {
              title: "Fictional player returns to game participation",
              publisher: "Metro City Comets Communications",
              account: null,
              canonicalUrl:
                "https://comets.example.org/official/fictional-return",
              finalUrl: "https://comets.example.org/official/fictional-return",
              publishedAt: "2026-03-04",
              accessedAt: "2026-08-14",
              medium: "game-or-participation-record",
            },
            evidenceUse: "opened-original-page",
            searchSnippetUsedAsEvidence: false,
          },
        ],
      },
    },
  };
}

function sidecarFixture(
  record: InjuryCase = fixtureCase(),
  research: FollowUpResearch = researchFixture(record),
): CaseFollowUp {
  const fact = research.categories["actual-return"].facts[0]!;
  const { finalUrl: _finalUrl, ...source } = fact.source;
  const item = {
    id: fact.itemId,
    kind: fact.kind,
    attributedStatement: fact.attributedStatement,
    factDate: fact.factDate,
    sourceTier: fact.sourceTier,
    source,
    tierBasis: fact.tierBasis,
    researchEvidenceId: fact.evidenceId,
    sourcePolicyBinding: { ...policy },
    itemPayloadDigest: "0".repeat(64),
    review: {
      status: "pending-owner-signoff" as const,
      reviewedPayloadDigest: "0".repeat(64),
    },
  } satisfies FollowUpItem;
  item.itemPayloadDigest = computeFollowUpItemPayloadDigest(item);
  item.review.reviewedPayloadDigest = item.itemPayloadDigest;
  const sourceId = record.sources.find((entry) =>
    entry.supports.includes("general.confirmedUpdate"),
  )!.id;
  return {
    schemaVersion: "case-follow-up.v1",
    caseId: record.id,
    caseClinicalDigest: computeCaseContentDigest(record),
    sourcePolicyBinding: { ...policy },
    legacyDiagnosisProjection: {
      field: "general.confirmedUpdate",
      sourceId,
      sourceTier: "team-or-league-official",
    },
    categories: {
      treatment: [],
      surgery: [],
      injection: [],
      "actual-return": [item],
    },
  };
}

function codes(issues: Array<{ code: string }>): string[] {
  return issues.map((entry) => entry.code);
}

function rebuildItemDigest(sidecar: CaseFollowUp): void {
  const item = sidecar.categories["actual-return"][0]!;
  item.itemPayloadDigest = computeFollowUpItemPayloadDigest(item);
  item.review.reviewedPayloadDigest = item.itemPayloadDigest;
}

describe("case-follow-up.v1 contract", () => {
  it("accepts a canonical pending sidecar and independently hashes item and draft", () => {
    const record = fixtureCase();
    const research = researchFixture(record);
    const sidecar = sidecarFixture(record, research);
    expect(
      validateFollowUpResearchRecord(research, {
        expectedPolicyBinding: policy,
      }),
    ).toEqual([]);
    expect(
      validateCaseFollowUpRecord(sidecar, {
        caseRecord: record,
        research,
        expectedPolicyBinding: policy,
      }),
    ).toEqual([]);

    const bytes = canonicalJson(sidecar);
    expect(parseCaseFollowUpBytes(bytes).sidecar).toEqual(sidecar);
    expect(
      parseFollowUpResearchBytes(canonicalJson(research)).research,
    ).toEqual(research);
    const before = computeFollowUpDraftDigest(sidecar);
    sidecar.categories["actual-return"][0]!.source.title += " amended";
    rebuildItemDigest(sidecar);
    expect(computeFollowUpDraftDigest(sidecar)).not.toBe(before);
  });

  it("rejects non-canonical or duplicate-key bytes", () => {
    const sidecar = sidecarFixture();
    expect(
      parseCaseFollowUpBytes(`${canonicalJson(sidecar)}\n`).sidecar,
    ).toBeNull();
    const duplicate = canonicalJson(sidecar).replace(
      '"caseId":',
      `"caseId":"${sidecar.caseId}","caseId":`,
    );
    expect(codes(parseCaseFollowUpBytes(duplicate).issues)).toContain(
      "follow-up-parse",
    );
  });

  it("rejects unknown aggregate or reviewer/approval metadata", () => {
    const sidecar: any = sidecarFixture();
    sidecar.followUpDraftDigest = "c".repeat(64);
    sidecar.categories["actual-return"][0].review.reviewerName =
      "Fictional Reviewer";
    sidecar.categories["actual-return"][0].review.approvalDigest = "d".repeat(
      64,
    );
    expect(caseFollowUpSchema.safeParse(sidecar).success).toBe(false);
    expect(
      codes(
        validateCaseFollowUpRecord(sidecar, {
          caseRecord: fixtureCase(),
          research: researchFixture(),
          expectedPolicyBinding: policy,
        }),
      ),
    ).toContain("follow-up-schema");

    const research: any = researchFixture();
    research.categories["actual-return"].facts[0].reviewerName =
      "Fictional Reviewer";
    expect(
      codes(
        validateFollowUpResearchRecord(research, {
          expectedPolicyBinding: policy,
        }),
      ),
    ).toContain("follow-up-research-schema");
  });

  it("allows no actual-return source below team-or-league-official", () => {
    for (const tier of [
      "mainstream-media-report",
      "unverified-report",
    ] as const) {
      const record = fixtureCase();
      const research = researchFixture(record);
      research.categories["actual-return"].facts[0]!.sourceTier = tier;
      const sidecar = sidecarFixture(record, research);
      expect(
        codes(
          validateCaseFollowUpRecord(sidecar, {
            caseRecord: record,
            research,
            expectedPolicyBinding: policy,
          }),
        ),
      ).toContain("follow-up-actual-return-source-tier");
    }
  });

  it("rejects future, undated, and predictive actual-return drafts", () => {
    const record = fixtureCase();
    const research = researchFixture(record);
    const fact = research.categories["actual-return"].facts[0]!;
    fact.factDate = "2026-08-15";
    fact.attributedStatement = "The team projected an expected return.";
    const sidecar = sidecarFixture(record, research);
    const issues = validateCaseFollowUpRecord(sidecar, {
      caseRecord: record,
      research,
      expectedPolicyBinding: policy,
    });
    expect(codes(issues)).toContain("follow-up-fact-date-future");
    expect(codes(issues)).toContain("follow-up-actual-return-prediction");

    research.categories["actual-return"].facts[0]!.factDate = null;
    const undated = sidecarFixture(record, research);
    expect(
      codes(
        validateCaseFollowUpRecord(undated, {
          caseRecord: record,
          research,
          expectedPolicyBinding: policy,
        }),
      ),
    ).toContain("follow-up-actual-return-date");
  });

  it("rejects stale item digests and facts not exactly projected from research", () => {
    const record = fixtureCase();
    const research = researchFixture(record);
    const sidecar = sidecarFixture(record, research);
    const item = sidecar.categories["actual-return"][0]!;
    item.attributedStatement += " Unsourced inference.";
    expect(
      codes(
        validateCaseFollowUpRecord(sidecar, {
          caseRecord: record,
          research,
          expectedPolicyBinding: policy,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "follow-up-item-digest-stale",
        "follow-up-research-projection-mismatch",
      ]),
    );
  });

  it("rejects stale case, legacy-source, and research bindings", () => {
    const record = fixtureCase();
    const research = researchFixture(record);
    const sidecar = sidecarFixture(record, research);
    sidecar.caseClinicalDigest = "e".repeat(64);
    sidecar.legacyDiagnosisProjection.sourceId = "src-does-not-exist";
    research.caseSlug = "wrong-slug";
    const result = codes(
      validateCaseFollowUpRecord(sidecar, {
        caseRecord: record,
        research,
        expectedPolicyBinding: policy,
      }),
    );
    expect(result).toEqual(
      expect.arrayContaining([
        "follow-up-clinical-digest-stale",
        "follow-up-legacy-source-binding",
        "follow-up-research-case-binding",
      ]),
    );
  });

  it("rejects any policy binding other than the exact frozen nba-v10 bytes", () => {
    const sidecar: any = sidecarFixture();
    sidecar.sourcePolicyBinding.jsonSha256 = "f".repeat(64);
    expect(
      codes(
        validateCaseFollowUpRecord(sidecar, {
          caseRecord: fixtureCase(),
          research: researchFixture(),
          expectedPolicyBinding: policy,
        }),
      ),
    ).toContain("follow-up-schema");
  });

  it("requires explicit bounded not-found audits instead of placeholders", () => {
    const research: any = researchFixture();
    research.categories.treatment.queryBoundaries = [];
    research.categories.treatment.facts = [
      research.categories["actual-return"].facts[0],
    ];
    expect(
      codes(
        validateFollowUpResearchRecord(research, {
          expectedPolicyBinding: policy,
        }),
      ),
    ).toContain("follow-up-research-schema");
  });

  it("reports independent research and sidecar semantic drift", () => {
    expect(
      codes(
        validateFollowUpResearchRecord(researchFixture(), {
          expectedPolicyBinding: {
            ...policy,
            jsonSha256: "0".repeat(64),
          } as FollowUpSourcePolicyBinding,
        }),
      ),
    ).toContain("follow-up-expected-policy");
    expect(
      codes(
        validateFollowUpResearchRecord(researchFixture(), {
          expectedPolicyBinding: policy,
          maximumFactDate: "2026-02-31",
        }),
      ),
    ).toContain("follow-up-invalid-date");

    const datedResearch = researchFixture();
    const datedFact = datedResearch.categories["actual-return"].facts[0]!;
    datedResearch.categories.treatment.queryBoundaries[0]!.performedAt =
      "2026-02-31";
    datedFact.source.publishedAt = "2026-09-01";
    datedFact.source.accessedAt = "2026-08-14";
    datedFact.factDate = "2026-09-02";
    expect(
      codes(
        validateFollowUpResearchRecord(datedResearch, {
          expectedPolicyBinding: policy,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "follow-up-invalid-date",
        "follow-up-source-date-order",
        "follow-up-fact-date-future",
      ]),
    );

    const duplicateResearch = researchFixture();
    duplicateResearch.categories.treatment = {
      queryBoundaries: duplicateResearch.categories.treatment.queryBoundaries,
      outcome: "source-ready",
      notFoundReason: null,
      facts: [
        structuredClone(
          duplicateResearch.categories["actual-return"].facts[0]!,
        ),
      ],
    };
    expect(
      codes(
        validateFollowUpResearchRecord(duplicateResearch, {
          expectedPolicyBinding: policy,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "follow-up-kind-category",
        "follow-up-research-evidence-duplicate",
        "follow-up-item-duplicate",
      ]),
    );

    const record = fixtureCase();
    const research = researchFixture(record);
    const duplicated = sidecarFixture(record, research);
    duplicated.caseId = "CASE-FIC-2014-902";
    const misplaced = structuredClone(
      duplicated.categories["actual-return"][0]!,
    );
    duplicated.categories.treatment = [
      structuredClone(misplaced),
      structuredClone(misplaced),
    ];
    expect(
      codes(
        validateCaseFollowUpRecord(duplicated, {
          caseRecord: record,
          research,
          expectedPolicyBinding: policy,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "follow-up-case-binding",
        "follow-up-item-order",
        "follow-up-kind-category",
        "follow-up-item-duplicate",
        "follow-up-item-evidence-duplicate",
      ]),
    );

    const missingEvidence = sidecarFixture(record, research);
    missingEvidence.categories["actual-return"][0]!.researchEvidenceId =
      "evidence-not-in-ledger";
    rebuildItemDigest(missingEvidence);
    expect(
      codes(
        validateCaseFollowUpRecord(missingEvidence, {
          caseRecord: record,
          research,
          expectedPolicyBinding: policy,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "follow-up-research-evidence-missing",
        "follow-up-research-fact-undrafted",
      ]),
    );

    const noLegacySource = fixtureCase();
    const noLegacyResearch = researchFixture(noLegacySource);
    const noLegacySidecar = sidecarFixture(noLegacySource, noLegacyResearch);
    noLegacySource.sources = noLegacySource.sources.map((source) => ({
      ...source,
      supports: source.supports.filter(
        (field) => field !== "general.confirmedUpdate",
      ),
    }));
    expect(
      codes(
        validateCaseFollowUpRecord(noLegacySidecar, {
          caseRecord: noLegacySource,
          research: noLegacyResearch,
          expectedPolicyBinding: policy,
        }),
      ),
    ).toContain("follow-up-legacy-source-cardinality");
  });

  it("rejects malformed, orphaned, and duplicate corpus paths", () => {
    const root = mkdtempSync(join(tmpdir(), "atlas-follow-up-paths-"));
    temporaryRoots.push(root);
    const record = fixtureCase();
    const research = researchFixture(record);
    const sidecar = sidecarFixture(record, research);
    const sidecarDirectory = join(root, FOLLOW_UP_CONTENT_DIRECTORY);
    const researchDirectory = join(root, FOLLOW_UP_RESEARCH_DIRECTORY);
    const nestedSidecars = join(sidecarDirectory, "nested");
    const nestedResearch = join(researchDirectory, "nested");
    mkdirSync(nestedSidecars, { recursive: true });
    mkdirSync(nestedResearch, { recursive: true });

    for (const path of [
      join(sidecarDirectory, `${record.slug}.json`),
      join(nestedSidecars, `${record.slug}.json`),
      join(sidecarDirectory, "orphan.json"),
    ]) {
      writeFileSync(path, canonicalJson(sidecar));
    }
    for (const path of [
      join(researchDirectory, `${record.slug}.json`),
      join(nestedResearch, `${record.slug}.json`),
      join(researchDirectory, "orphan.json"),
    ]) {
      writeFileSync(path, canonicalJson(research));
    }
    writeFileSync(join(sidecarDirectory, "broken.json"), "{}");
    writeFileSync(join(researchDirectory, "broken.json"), "{}");
    writeFileSync(join(sidecarDirectory, ".ignored.json"), "{}");
    writeFileSync(join(researchDirectory, "ignored.txt"), "ignored");

    const result = codes(
      loadFollowUpCorpus(root, [record], {
        expectedPolicyBinding: policy,
      }).issues,
    );
    expect(result).toEqual(
      expect.arrayContaining([
        "follow-up-case-count",
        "follow-up-schema",
        "follow-up-research-schema",
        "follow-up-orphan-sidecar",
        "follow-up-orphan-research",
        "follow-up-duplicate-sidecar",
        "follow-up-duplicate-research",
      ]),
    );

    const emptyRoot = mkdtempSync(join(tmpdir(), "atlas-follow-up-empty-"));
    temporaryRoots.push(emptyRoot);
    expect(
      codes(
        loadFollowUpCorpus(emptyRoot, [record], {
          expectedPolicyBinding: policy,
          expectedCaseCount: 1,
        }).issues,
      ),
    ).toEqual(
      expect.arrayContaining([
        "follow-up-sidecar-missing",
        "follow-up-research-missing",
      ]),
    );
  });

  it("loads exact one-to-one canonical sidecar and research files", () => {
    const root = mkdtempSync(join(tmpdir(), "atlas-follow-up-contract-"));
    temporaryRoots.push(root);
    const record = fixtureCase();
    const research = researchFixture(record);
    const sidecar = sidecarFixture(record, research);
    const sidecarDirectory = join(root, FOLLOW_UP_CONTENT_DIRECTORY);
    const researchDirectory = join(root, FOLLOW_UP_RESEARCH_DIRECTORY);
    mkdirSync(sidecarDirectory, { recursive: true });
    mkdirSync(researchDirectory, { recursive: true });
    writeFileSync(
      join(sidecarDirectory, `${record.slug}.json`),
      canonicalJson(sidecar),
    );
    writeFileSync(
      join(researchDirectory, `${record.slug}.json`),
      canonicalJson(research),
    );

    const loaded = loadFollowUpCorpus(root, [record], {
      expectedPolicyBinding: policy,
      expectedCaseCount: 1,
    });
    expect(loaded.issues).toEqual([]);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0]!.draftDigest).toBe(
      computeFollowUpDraftDigest(sidecar),
    );

    rmSync(join(researchDirectory, `${record.slug}.json`));
    expect(
      codes(
        loadFollowUpCorpus(root, [record], {
          expectedPolicyBinding: policy,
          expectedCaseCount: 1,
        }).issues,
      ),
    ).toContain("follow-up-research-missing");
  });
});
