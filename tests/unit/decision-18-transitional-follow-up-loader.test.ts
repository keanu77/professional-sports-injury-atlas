import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { computeCaseContentDigest } from "../../src/lib/cases/digest";
import {
  loadDecision18TransitionalFollowUpCorpus,
  validateDecision18CompletedReceiptProvenance,
  type Decision18CompletedReceiptGitInspection,
} from "../../src/lib/cases/decision-18-follow-up-corpus";
import {
  DECISION_18_FOLLOW_UP_RESEARCH_DIRECTORY,
  loadTransitionalFollowUpCorpus,
  validateDecision18ProjectedSidecar,
  type TransitionalBatchDefinition,
  type TransitionalCompletedBatchReceipt,
  type TransitionalFollowUpAdapters,
  type TransitionalReceiptChain,
} from "../../src/lib/cases/decision-18-transitional-follow-up-loader";
import { computeFollowUpItemPayloadDigest } from "../../src/lib/cases/follow-up-digest";
import {
  FOLLOW_UP_CONTENT_DIRECTORY,
  FOLLOW_UP_RESEARCH_DIRECTORY,
} from "../../src/lib/cases/follow-up-loader";
import { caseSchema, type InjuryCase } from "../../src/lib/contracts/case";
import {
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  type CaseFollowUp,
  type FollowUpItem,
  type FollowUpResearch,
} from "../../src/lib/contracts/case-follow-up";
import {
  canonicalJson,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "../../src/lib/contracts/canonical";
import {
  DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS,
  buildDecision18FollowUpBatchReceipt,
  canonicalDecision18FollowUpBatchReceiptText,
  expectedDecision18BatchResearchLedgers,
  expectedDecision18BatchSidecars,
  type ValidatedDecision18FollowUpBatchReceipt,
} from "../../src/lib/contracts/decision-18-follow-up-batch";

type BatchId = "first" | "second";
interface SyntheticResearchV2 {
  caseSlug: string;
}

const temporaryRoots: string[] = [];
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

function fixtureCase(index: number): InjuryCase {
  const record = JSON.parse(
    readFileSync(
      new URL("../fixtures/cases/valid-medical-review.json", import.meta.url),
      "utf8",
    ),
  ) as InjuryCase;
  record.id = `CASE-FIC-2026-10${index}`;
  record.slug = `fictional-transition-case-${index}`;
  record.athlete.name = `Fictional Transition Player ${index}`;
  record.sources = record.sources.map((source) => ({
    ...source,
    id: `${source.id}-transition-${index}`,
  }));
  return record;
}

function emptyAudit(record: InjuryCase, kind: string) {
  return {
    queryBoundaries: [
      {
        query: `${record.athlete.name} ${kind}`,
        locationsChecked: ["official team and league pages"],
        performedAt: "2026-08-14",
        stoppingBoundary: "bounded historical Decision 17 search complete",
      },
    ],
    outcome: "not-found" as const,
    notFoundReason: "No qualifying individually attributable report found.",
    facts: [],
  };
}

function historicalResearch(record: InjuryCase): FollowUpResearch {
  return {
    schemaVersion: "case-follow-up-research.v1",
    caseId: record.id,
    caseSlug: record.slug,
    caseClinicalDigest: computeCaseContentDigest(record),
    evidenceStatus: "source-ready",
    sourcePolicyBinding: { ...FOLLOW_UP_SOURCE_POLICY_V10_BINDING },
    categories: {
      treatment: emptyAudit(record, "treatment"),
      surgery: emptyAudit(record, "surgery"),
      injection: emptyAudit(record, "injection"),
      "actual-return": emptyAudit(record, "actual return"),
    },
  };
}

function sidecar(
  record: InjuryCase,
  categories: CaseFollowUp["categories"] = {
    treatment: [],
    surgery: [],
    injection: [],
    "actual-return": [],
  },
): CaseFollowUp {
  const legacySource = record.sources.find((source) =>
    source.supports.includes("general.confirmedUpdate"),
  )!;
  return {
    schemaVersion: "case-follow-up.v1",
    caseId: record.id,
    caseClinicalDigest: computeCaseContentDigest(record),
    sourcePolicyBinding: { ...FOLLOW_UP_SOURCE_POLICY_V10_BINDING },
    legacyDiagnosisProjection: {
      field: "general.confirmedUpdate",
      sourceId: legacySource.id,
      sourceTier: "team-or-league-official",
    },
    categories,
  };
}

function writeArtifact(root: string, path: string, value: unknown): string {
  const bytes = canonicalJson(value);
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), bytes);
  return sha256Hex(bytes);
}

function writeHistoricalPair(
  root: string,
  record: InjuryCase,
  research: FollowUpResearch = historicalResearch(record),
  projectedSidecar: CaseFollowUp = sidecar(record),
): void {
  writeArtifact(
    root,
    `${FOLLOW_UP_RESEARCH_DIRECTORY}/${record.slug}.json`,
    research,
  );
  writeArtifact(
    root,
    `${FOLLOW_UP_CONTENT_DIRECTORY}/${record.slug}.json`,
    projectedSidecar,
  );
}

const definitions: readonly TransitionalBatchDefinition<BatchId>[] = [
  {
    batchId: "first",
    caseSlugs: ["fictional-transition-case-1"],
    receiptPath: "research/follow-ups/decision-18/batches/first.json",
  },
  {
    batchId: "second",
    caseSlugs: ["fictional-transition-case-2"],
    receiptPath: "research/follow-ups/decision-18/batches/second.json",
  },
];

function completedReceipt(
  root: string,
  record: InjuryCase,
  batchId: BatchId = "first",
  auditCutoffDate = "2026-08-16",
): TransitionalCompletedBatchReceipt<BatchId> {
  const researchPath = `${DECISION_18_FOLLOW_UP_RESEARCH_DIRECTORY}/${record.slug}.json`;
  const sidecarPath = `${FOLLOW_UP_CONTENT_DIRECTORY}/${record.slug}.json`;
  const researchSha256 = writeArtifact(root, researchPath, {
    caseSlug: record.slug,
  });
  return {
    batchId,
    receiptPath: definitions.find(
      (definition) => definition.batchId === batchId,
    )!.receiptPath,
    receiptSha256: "a".repeat(64),
    auditCutoffDate,
    artifacts: [
      {
        caseSlug: record.slug,
        researchPath,
        researchSha256,
        sidecarPath,
        sidecarSha256: sha256Hex(readFileSync(join(root, sidecarPath))),
      },
    ],
  };
}

function adapters(
  chain: TransitionalReceiptChain<BatchId>,
  hooks: {
    contexts?: Array<{ auditCutoffDate: string; caseSlug: string }>;
    projectionIssues?: ValidationIssue[];
  } = {},
): TransitionalFollowUpAdapters<BatchId, SyntheticResearchV2> {
  return {
    batchDefinitions: definitions,
    resolveReceiptChain: () => chain,
    parseAndValidateResearchV2: (bytes, context) => {
      hooks.contexts?.push({
        auditCutoffDate: context.auditCutoffDate,
        caseSlug: context.caseRecord.slug,
      });
      return {
        research: JSON.parse(
          Buffer.from(bytes).toString("utf8"),
        ) as SyntheticResearchV2,
        issues: [],
      };
    },
    validateResearchV2Sidecar: () => hooks.projectionIssues ?? [],
  };
}

function makeRoot(): {
  cases: [InjuryCase, InjuryCase];
  root: string;
} {
  const root = mkdtempSync(join(tmpdir(), "atlas-d18-transition-"));
  temporaryRoots.push(root);
  const cases: [InjuryCase, InjuryCase] = [fixtureCase(1), fixtureCase(2)];
  cases.forEach((record) => writeHistoricalPair(root, record));
  return { root, cases };
}

function loadRepositoryCases(root: string): InjuryCase[] {
  return readdirSync(join(root, "src/content/cases"))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) =>
      caseSchema.parse(
        parseStrictJson(
          readFileSync(join(root, "src/content/cases", name), "utf8"),
        ),
      ),
    );
}

function makeConcreteRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "atlas-d18-concrete-transition-"));
  temporaryRoots.push(root);
  for (const directory of [
    "src/content/cases",
    "src/content/follow-ups",
    "research/follow-ups/decision-17",
  ]) {
    cpSync(join(ROOT, directory), join(root, directory), { recursive: true });
  }
  const baselinePath =
    "docs/reviews/evidence/decision-18/p0/authorized-start-baseline.v1.json";
  mkdirSync(join(root, baselinePath, ".."), { recursive: true });
  cpSync(join(ROOT, baselinePath), join(root, baselinePath));
  return root;
}

function load(
  root: string,
  cases: readonly InjuryCase[],
  transitionAdapters: TransitionalFollowUpAdapters<
    BatchId,
    SyntheticResearchV2
  >,
) {
  return loadTransitionalFollowUpCorpus(root, cases, {
    expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
    expectedCaseCount: 2,
    adapters: transitionAdapters,
  });
}

function codes(issues: readonly ValidationIssue[]): string[] {
  return issues.map((entry) => entry.code);
}

function completedAclProvenanceFixture(root: string): {
  git: Decision18CompletedReceiptGitInspection;
  receipt: ValidatedDecision18FollowUpBatchReceipt;
} {
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl;
  const sha256ByPath: Record<string, string> = {};
  for (const { path } of [
    ...expectedDecision18BatchResearchLedgers("acl"),
    ...expectedDecision18BatchSidecars("acl"),
  ]) {
    sha256ByPath[path] = writeArtifact(root, path, { path });
  }
  const evidencePath = `${definition.evidenceDirectory}provenance-test.json`;
  const evidenceSha256 = writeArtifact(root, evidencePath, {
    artifactType: "synthetic-provenance-test",
  });
  const reviewReportSha256 = writeArtifact(root, definition.reportPath, {
    report: "synthetic provenance test",
  });
  const receipt = buildDecision18FollowUpBatchReceipt({
    batchId: "acl",
    evidenceFiles: [{ path: evidencePath, sha256: evidenceSha256 }],
    generatedAt: "2026-08-15T12:00:00Z",
    reviewReportSha256,
    sha256ByPath,
    validatedPredecessors: [],
  });
  const receiptText = canonicalDecision18FollowUpBatchReceiptText(receipt);
  mkdirSync(join(root, definition.receiptPath, ".."), { recursive: true });
  writeFileSync(join(root, definition.receiptPath), receiptText);
  const validated: ValidatedDecision18FollowUpBatchReceipt = {
    batchId: "acl",
    path: definition.receiptPath,
    receipt,
    receiptDigest: sha256Hex(receiptText),
  };
  const git: Decision18CompletedReceiptGitInspection = {
    worktreePaths: () => [],
    introductionCommits: () => ["a".repeat(40)],
    isAncestorOfHead: () => true,
    commitSubject: () => "feat(follow-ups): complete Decision 18 ACL batch",
    commitChangedPaths: () => receipt.allowedPaths,
    laterCommitsTouchingPaths: () => [],
  };
  return { git, receipt: validated };
}

describe("Decision 18 transitional follow-up loader", () => {
  it("gates completed receipt adoption on exact bytes and immutable Git provenance", () => {
    const root = mkdtempSync(join(tmpdir(), "atlas-d18-provenance-"));
    temporaryRoots.push(root);
    const fixture = completedAclProvenanceFixture(root);
    expect(
      validateDecision18CompletedReceiptProvenance(
        root,
        [fixture.receipt],
        fixture.git,
      ),
    ).toEqual([]);

    const activeAnklePath =
      "docs/reviews/evidence/decision-18/batch-2-ankle/in-progress.research-record.v1.json";
    expect(
      validateDecision18CompletedReceiptProvenance(root, [fixture.receipt], {
        ...fixture.git,
        worktreePaths: () => [activeAnklePath],
      }),
    ).toEqual([]);

    const evidencePath = fixture.receipt.receipt.evidenceFiles[0]!.path;
    writeFileSync(join(root, evidencePath), "drifted");
    const rejected = validateDecision18CompletedReceiptProvenance(
      root,
      [fixture.receipt],
      {
        ...fixture.git,
        worktreePaths: () => [evidencePath],
        introductionCommits: () => [],
      },
    );
    expect(codes(rejected)).toEqual(
      expect.arrayContaining([
        "decision18-batch-completed-path-mutation",
        "decision18-batch-completed-digest-drift",
        "follow-up-transition-completed-introduction",
      ]),
    );
  });

  it("rejects nonconventional/out-of-allowlist introduction and later mutation", () => {
    const root = mkdtempSync(join(tmpdir(), "atlas-d18-provenance-git-"));
    temporaryRoots.push(root);
    const fixture = completedAclProvenanceFixture(root);
    const rejected = validateDecision18CompletedReceiptProvenance(
      root,
      [fixture.receipt],
      {
        ...fixture.git,
        commitSubject: () => "complete ACL batch",
        commitChangedPaths: () => [
          ...fixture.receipt.receipt.allowedPaths,
          "package.json",
        ],
        laterCommitsTouchingPaths: () => ["b".repeat(40)],
      },
    );
    expect(codes(rejected)).toEqual(
      expect.arrayContaining([
        "follow-up-transition-completed-commit-subject",
        "decision18-batch-commit-path-outside-allowlist",
        "follow-up-transition-completed-later-mutation",
      ]),
    );
  });

  it("concretely resolves the unchanged 26-case repository as D17 before the first receipt", () => {
    const cases = loadRepositoryCases(ROOT);
    const result = loadDecision18TransitionalFollowUpCorpus(ROOT, cases, {
      expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
      now: new Date("2026-08-15T12:00:00Z"),
    });

    expect(result.issues).toEqual([]);
    expect(result.entries).toHaveLength(26);
    expect(result.completedBatchIds).toEqual([]);
    expect(
      result.entries.every(
        (entry) =>
          entry.provenance === "decision-17-v1" &&
          entry.auditCutoffDate === "2026-08-14",
      ),
    ).toBe(true);
  });

  it("concretely treats a malformed present batch receipt as fatal instead of using D17", () => {
    const root = makeConcreteRoot();
    const receiptPath =
      "research/follow-ups/decision-18/batches/acl.receipt.v1.json";
    mkdirSync(join(root, receiptPath, ".."), { recursive: true });
    writeFileSync(join(root, receiptPath), "{}");
    const result = loadDecision18TransitionalFollowUpCorpus(
      root,
      loadRepositoryCases(root),
      {
        expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
        now: new Date("2026-08-15T12:00:00Z"),
      },
    );

    expect(result.entries).toEqual([]);
    expect(codes(result.issues)).toContain("decision18-batch-receipt-schema");
  });

  it("concretely rejects Decision 17 ledger byte drift against Phase 0", () => {
    const root = makeConcreteRoot();
    const ledgerPath =
      "research/follow-ups/decision-17/danny-green-acl-2022.json";
    writeFileSync(
      join(root, ledgerPath),
      `${readFileSync(join(root, ledgerPath), "utf8")}\n`,
    );
    const result = loadDecision18TransitionalFollowUpCorpus(
      root,
      loadRepositoryCases(root),
      {
        expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
        now: new Date("2026-08-15T12:00:00Z"),
      },
    );

    expect(result.entries).toEqual([]);
    expect(codes(result.issues)).toContain(
      "follow-up-transition-decision17-research-drift",
    );
  });

  it("concretely rejects any byte drift in the immutable Phase 0 baseline", () => {
    const root = makeConcreteRoot();
    const baselinePath =
      "docs/reviews/evidence/decision-18/p0/authorized-start-baseline.v1.json";
    writeFileSync(
      join(root, baselinePath),
      `${readFileSync(join(root, baselinePath), "utf8")}\n`,
    );
    const result = loadDecision18TransitionalFollowUpCorpus(
      root,
      loadRepositoryCases(root),
      {
        expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
        now: new Date("2026-08-15T12:00:00Z"),
      },
    );

    expect(result.entries).toEqual([]);
    expect(codes(result.issues)).toContain(
      "follow-up-transition-p0-baseline-digest",
    );
  });

  it("uses the exact historical ledger, sidecar, and 2026-08-14 cutoff before any completed receipt", () => {
    const { root, cases } = makeRoot();
    const result = load(
      root,
      cases,
      adapters({ completedReceipts: [], issues: [] }),
    );

    expect(result.issues).toEqual([]);
    expect(result.completedBatchIds).toEqual([]);
    expect(result.entries).toHaveLength(2);
    expect(
      result.entries.map((entry) => [
        entry.caseSlug,
        entry.provenance,
        entry.auditCutoffDate,
      ]),
    ).toEqual([
      ["fictional-transition-case-1", "decision-17-v1", "2026-08-14"],
      ["fictional-transition-case-2", "decision-17-v1", "2026-08-14"],
    ]);
  });

  it("switches a completed batch atomically to its receipt-bound v2 ledger and receipt-derived cutoff", () => {
    const { root, cases } = makeRoot();
    const contexts: Array<{ auditCutoffDate: string; caseSlug: string }> = [];
    const firstReceipt = completedReceipt(root, cases[0]);
    const result = load(
      root,
      cases,
      adapters({ completedReceipts: [firstReceipt], issues: [] }, { contexts }),
    );

    expect(result.issues).toEqual([]);
    expect(result.completedBatchIds).toEqual(["first"]);
    expect(result.entries.map((entry) => entry.provenance)).toEqual([
      "decision-18-v2",
      "decision-17-v1",
    ]);
    expect(result.entries[0]!.auditCutoffDate).toBe("2026-08-16");
    expect(result.entries[1]!.auditCutoffDate).toBe("2026-08-14");
    expect(contexts).toEqual([
      {
        auditCutoffDate: "2026-08-16",
        caseSlug: "fictional-transition-case-1",
      },
    ]);
  });

  it("fails closed on an invalid present receipt instead of falling back to Decision 17", () => {
    const { root, cases } = makeRoot();
    const result = load(
      root,
      cases,
      adapters({
        completedReceipts: [],
        issues: [
          issue(
            "decision18-batch-receipt-not-canonical",
            "acl",
            "present receipt is invalid",
          ),
        ],
      }),
    );

    expect(result.entries).toEqual([]);
    expect(result.completedBatchIds).toEqual([]);
    expect(codes(result.issues)).toContain(
      "decision18-batch-receipt-not-canonical",
    );
  });

  it("rejects a later receipt without its predecessor as noncontiguous", () => {
    const { root, cases } = makeRoot();
    const secondReceipt = completedReceipt(root, cases[1], "second");
    const result = load(
      root,
      cases,
      adapters({ completedReceipts: [secondReceipt], issues: [] }),
    );

    expect(result.entries).toEqual([]);
    expect(codes(result.issues)).toContain(
      "follow-up-transition-receipt-noncontiguous",
    );
  });

  it("rejects a partial receipt membership rather than mixing v1 and v2 within a batch", () => {
    const { root, cases } = makeRoot();
    const oneBatchDefinitions: readonly TransitionalBatchDefinition<BatchId>[] =
      [
        {
          batchId: "first",
          caseSlugs: cases.map((record) => record.slug),
          receiptPath: definitions[0]!.receiptPath,
        },
      ];
    const partialReceipt = completedReceipt(root, cases[0]);
    const transitionAdapters = adapters({
      completedReceipts: [partialReceipt],
      issues: [],
    });
    transitionAdapters.batchDefinitions = oneBatchDefinitions;
    const result = load(root, cases, transitionAdapters);

    expect(result.entries).toEqual([]);
    expect(codes(result.issues)).toContain(
      "follow-up-transition-receipt-membership",
    );
  });

  it("requires every completed receipt's exact v2 and sidecar bytes with no fallback", () => {
    const { root, cases } = makeRoot();
    const receipt = completedReceipt(root, cases[0]);
    receipt.artifacts[0]!.researchSha256 = "f".repeat(64);
    const result = load(
      root,
      cases,
      adapters({ completedReceipts: [receipt], issues: [] }),
    );

    expect(result.entries).toEqual([]);
    expect(codes(result.issues)).toContain(
      "follow-up-transition-v2-research-digest",
    );
  });

  it("fails when the v2-derived fact set does not exactly project to the sidecar", () => {
    const { root, cases } = makeRoot();
    const receipt = completedReceipt(root, cases[0]);
    const result = load(
      root,
      cases,
      adapters(
        { completedReceipts: [receipt], issues: [] },
        {
          projectionIssues: [
            issue(
              "follow-up-research-projection-mismatch",
              "categories.treatment",
              "sidecar does not project the v2 fact set",
            ),
          ],
        },
      ),
    );

    expect(result.entries).toEqual([]);
    expect(codes(result.issues)).toContain(
      "follow-up-research-projection-mismatch",
    );
  });

  it("keeps the historical D17 cutoff fixed even when newer source dates are structurally valid", () => {
    const { root, cases } = makeRoot();
    const record = cases[0];
    const research = historicalResearch(record);
    const fact = {
      evidenceId: "fictional-newer-treatment-evidence",
      itemId: "fictional-newer-treatment-item",
      kind: "treatment" as const,
      attributedStatement:
        "The fictional team reported a completed treatment event.",
      factDate: "2026-08-15",
      sourceTier: "team-or-league-official" as const,
      tierBasis: "Directly controlled fictional team source.",
      source: {
        title: "Fictional treatment update",
        publisher: "Fictional Team",
        account: null,
        canonicalUrl: "https://team.example.org/treatment",
        finalUrl: "https://team.example.org/treatment",
        publishedAt: "2026-08-15",
        accessedAt: "2026-08-15",
        medium: "press-release" as const,
      },
      evidenceUse: "opened-original-page" as const,
      searchSnippetUsedAsEvidence: false as const,
    };
    research.categories.treatment = {
      queryBoundaries: research.categories.treatment.queryBoundaries,
      outcome: "source-ready",
      notFoundReason: null,
      facts: [fact],
    };
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
      sourcePolicyBinding: { ...FOLLOW_UP_SOURCE_POLICY_V10_BINDING },
      itemPayloadDigest: "0".repeat(64),
      review: {
        status: "pending-owner-signoff" as const,
        reviewedPayloadDigest: "0".repeat(64),
      },
    } satisfies FollowUpItem;
    item.itemPayloadDigest = computeFollowUpItemPayloadDigest(item);
    item.review.reviewedPayloadDigest = item.itemPayloadDigest;
    writeHistoricalPair(
      root,
      record,
      research,
      sidecar(record, {
        treatment: [item],
        surgery: [],
        injection: [],
        "actual-return": [],
      }),
    );

    const result = load(
      root,
      cases,
      adapters({ completedReceipts: [], issues: [] }),
    );
    expect(result.entries).toEqual([]);
    expect(codes(result.issues)).toContain("follow-up-fact-date-future");
  });

  it("validates a completed D18 projection against the later receipt cutoff, never the stale D17 default", () => {
    const record = fixtureCase(1);
    const projectedFact = {
      evidenceId: "fictional-d18-treatment-evidence",
      itemId: "fictional-d18-treatment-item",
      kind: "treatment" as const,
      attributedStatement:
        "The fictional team reported a completed treatment event.",
      factDate: "2026-08-15",
      sourceTier: "team-or-league-official" as const,
      tierBasis: "Directly controlled fictional team source.",
      source: {
        title: "Fictional Decision 18 treatment update",
        publisher: "Fictional Team",
        account: null,
        canonicalUrl: "https://team.example.org/d18-treatment",
        finalUrl: "https://team.example.org/d18-treatment",
        publishedAt: "2026-08-15",
        accessedAt: "2026-08-15",
        medium: "press-release" as const,
      },
      evidenceUse: "opened-original-page" as const,
      searchSnippetUsedAsEvidence: false as const,
    };
    const { finalUrl: _finalUrl, ...source } = projectedFact.source;
    const item = {
      id: projectedFact.itemId,
      kind: projectedFact.kind,
      attributedStatement: projectedFact.attributedStatement,
      factDate: projectedFact.factDate,
      sourceTier: projectedFact.sourceTier,
      source,
      tierBasis: projectedFact.tierBasis,
      researchEvidenceId: projectedFact.evidenceId,
      sourcePolicyBinding: { ...FOLLOW_UP_SOURCE_POLICY_V10_BINDING },
      itemPayloadDigest: "0".repeat(64),
      review: {
        status: "pending-owner-signoff" as const,
        reviewedPayloadDigest: "0".repeat(64),
      },
    } satisfies FollowUpItem;
    item.itemPayloadDigest = computeFollowUpItemPayloadDigest(item);
    item.review.reviewedPayloadDigest = item.itemPayloadDigest;
    const projectedSidecar = sidecar(record, {
      treatment: [item],
      surgery: [],
      injection: [],
      "actual-return": [],
    });
    const projectedFactsByKind = {
      treatment: [projectedFact],
      surgery: [],
      injection: [],
      "actual-return": [],
    };

    expect(
      validateDecision18ProjectedSidecar(projectedSidecar, {
        auditCutoffDate: "2026-08-16",
        caseRecord: record,
        expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
        projectedFactsByKind,
      }),
    ).toEqual([]);
    expect(
      codes(
        validateDecision18ProjectedSidecar(projectedSidecar, {
          auditCutoffDate: "2026-08-14",
          caseRecord: record,
          expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
          projectedFactsByKind,
        }),
      ),
    ).toContain("follow-up-fact-date-future");
  });
});
