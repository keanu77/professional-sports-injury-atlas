import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { computeCaseContentDigest } from "../../src/lib/cases/digest";
import { buildDecision18ProjectedSidecar } from "../../src/lib/cases/decision-18-follow-up-generation";
import {
  computeResearchV2AngleId,
  computeResearchV2FactIdentityDigest,
  computeResearchV2QualifiedSetDigest,
} from "../../src/lib/cases/follow-up-research-v2-digest";
import { expectedFollowUpResearchV2SearchContextForCase } from "../../src/lib/cases/follow-up-research-v2-validation";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  followUpResearchSchema,
  type CaseFollowUp,
  type FollowUpKind,
  type FollowUpResearchFact,
} from "../../src/lib/contracts/case-follow-up";
import {
  FOLLOW_UP_RESEARCH_V2_AUTHORITY_BINDING,
  RESEARCH_V2_SOURCE_CHANNELS,
  RESEARCH_V2_TERM_CONCEPTS,
  RESEARCH_V2_TIMEPOINTS,
  type FollowUpResearchV2,
  type FollowUpResearchV2AuditUnit,
  type FollowUpResearchV2QualifiedFact,
  type FollowUpResearchV2Round,
  type ResearchV2TermConcept,
  type ResearchV2Timepoint,
} from "../../src/lib/contracts/case-follow-up-research-v2";
import { caseSchema, type InjuryCase } from "../../src/lib/contracts/case";
import {
  canonicalJson,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import {
  DECISION_18_AUTHORIZATION_PATH,
  DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS,
  DECISION_18_P0_BASELINE_PATH,
  DECISION_18_PLAN_PATH,
  buildDecision18FollowUpBatchReceipt,
  canonicalDecision18FollowUpBatchReceiptText,
  expectedDecision18BatchResearchLedgers,
  expectedDecision18BatchSidecars,
  parseDecision18FollowUpBatchReceiptText,
  type Decision18FollowUpBatchId,
  type ValidatedDecision18FollowUpBatchReceipt,
} from "../../src/lib/contracts/decision-18-follow-up-batch";
import {
  runDecision18FollowUpBatchReceiptCommand,
  selectDecision18BatchReceiptCommandChain,
  validateDecision18CompletedBatchGitState,
} from "../../scripts/generate-decision-18-follow-up-batch-receipt";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const GENERATED_AT = "2026-08-15T12:00:00Z";
const NOW = new Date("2026-08-15T12:30:00Z");

const conceptText: Record<ResearchV2TermConcept, string> = {
  treatment: "treatment",
  rehab: "rehab",
  recovery: "recovery",
  program: "program",
  management: "management",
  cleared: "cleared",
  progression: "progression",
  surgery: "surgery",
  procedure: "procedure",
  operated: "operated",
  underwent: "underwent",
  repair: "repair",
  reconstruction: "reconstruction",
  "surgeon-name-branch": "surgeon doctor operating physician",
  injection: "injection",
  shot: "shot",
  prp: "PRP",
  "platelet-rich-plasma": "platelet-rich plasma",
  cortisone: "cortisone",
  corticosteroid: "corticosteroid",
  needling: "needling",
  return: "return",
  returned: "returned",
  debut: "debut",
  "first-game-back": "first game back",
  activated: "activated",
  "cleared-to-play": "cleared to play",
};

const timepointText: Record<ResearchV2Timepoint, string> = {
  "injury-time": "injury",
  "operation-announcement": "surgery",
  "rehabilitation-progression": "rehab",
  "actual-return": "return",
};

interface P0BaselineShape {
  decision17FollowUpBaseline: {
    sidecars: Array<{ path: string; sha256: string }>;
  };
}

function copyIntoRoot(root: string, relativePath: string): void {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(ROOT, relativePath), target);
}

function git(root: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
  }).trim();
}

function buildQualifiedFacts(
  caseSlug: string,
  facts: FollowUpResearchV2QualifiedFact[] | readonly unknown[],
): FollowUpResearchV2QualifiedFact[] {
  return (facts as Array<Record<string, unknown>>).map((fact) => {
    const provisional = {
      ...fact,
      atomicProposition: fact.attributedStatement as string,
      factIdentitySha256: "0".repeat(64),
    } as FollowUpResearchV2QualifiedFact;
    provisional.factIdentitySha256 = computeResearchV2FactIdentityDigest(
      caseSlug,
      provisional,
    );
    return provisional;
  });
}

function buildRound(
  record: InjuryCase,
  kind: FollowUpKind,
  roundNumber: number,
  baselineFacts: readonly FollowUpResearchV2QualifiedFact[],
): FollowUpResearchV2Round {
  const context = expectedFollowUpResearchV2SearchContextForCase(record);
  const concepts = [...RESEARCH_V2_TERM_CONCEPTS[kind]].sort(compareCodePoints);
  const setDigest = computeResearchV2QualifiedSetDigest(baselineFacts);
  const queries: FollowUpResearchV2Round["queries"] =
    RESEARCH_V2_SOURCE_CHANNELS.map((sourceChannel, index) => {
      const timepoint =
        RESEARCH_V2_TIMEPOINTS[
          (index + roundNumber - 1) % RESEARCH_V2_TIMEPOINTS.length
        ]!;
      const contextTerms =
        roundNumber === 1
          ? [
              context.athleteName,
              context.teamAtEvent,
              context.injuryTerms[0]!,
              context.season,
              timepointText[timepoint],
            ]
          : [
              timepointText[timepoint],
              context.season,
              context.injuryTerms[0]!,
              context.teamAtEvent,
              context.athleteName,
            ];
      return {
        queryId: `${record.slug}-${kind}-r${roundNumber}-q${index + 1}`,
        query: [
          ...contextTerms,
          ...concepts.map((concept) => conceptText[concept]),
          sourceChannel,
          `round ${roundNumber} angle ${index + 1}`,
        ].join(" "),
        sourceChannel,
        timepoint,
        timepointApplicability: "applicable" as const,
        notApplicableReason: null,
        coveredTermConcepts: concepts,
        namedPersonTerms: [],
        verificationChannel: "web-open-original-page" as const,
        angleId: computeResearchV2AngleId({
          sourceChannel,
          timepoint,
          coveredTermConcepts: concepts,
        }),
        resultCode: "no-candidate" as const,
        resultReason: "No qualifying new original-page fact was found.",
        checkedBoundary:
          "Checked the controlled source channel, chronology, context, and synonym family.",
      };
    });
  const candidates: FollowUpResearchV2Round["candidates"] = [];
  if (roundNumber === 1) {
    for (const [index, fact] of baselineFacts.entries()) {
      const query = queries[index % queries.length]!;
      query.resultCode = "retained-existing";
      query.resultReason =
        "The unchanged Decision 17 original source was freshly reopened.";
      candidates.push({
        candidateId: `${record.slug}-${kind}-baseline-${index + 1}`,
        queryId: query.queryId,
        accessStatus: "opened-original-page",
        source: { ...fact.source, accessedAt: "2026-08-15" },
        disposition: "retained-existing",
        dispositionReason:
          "Fresh reopen confirmed the unchanged retained baseline fact.",
        factItemIds: [fact.itemId],
        namedMedicalPersons: [],
        materialCandidate: true,
        searchSnippetUsedAsEvidence: false,
      });
    }
  }
  return {
    roundNumber,
    startedAt: `2026-08-15T${String(8 + roundNumber).padStart(2, "0")}:00:00Z`,
    completedAt: `2026-08-15T${String(8 + roundNumber).padStart(2, "0")}:30:00Z`,
    operatorId: "codex-synthetic-receipt-fixture",
    toolChannel: "web-search",
    queries,
    candidates,
    qualifiedFactDeltas: [],
    addedQualifiedFactCount: 0,
    correctedQualifiedFactCount: 0,
    newQualifiedFactIds: [],
    qualifiedSetBeforeSha256: setDigest,
    qualifiedSetAfterSha256: setDigest,
    rejectionOrNotFoundReasons: [
      "No qualifying new fact survived the checked original-page boundary.",
    ],
    checkedBoundary:
      "All six controlled source channels were checked with recorded context formulations.",
  };
}

function buildUnit(
  record: InjuryCase,
  kind: FollowUpKind,
  d17Category: {
    outcome: "source-ready" | "not-found";
    facts: readonly unknown[];
    notFoundReason: string | null;
  },
): FollowUpResearchV2AuditUnit {
  const qualifiedFacts = buildQualifiedFacts(record.slug, d17Category.facts);
  const setDigest = computeResearchV2QualifiedSetDigest(qualifiedFacts);
  return {
    factKind: kind,
    baseline: {
      decision17Outcome: d17Category.outcome,
      qualifiedFacts,
      qualifiedSetSha256: setDigest,
    },
    rounds: [
      buildRound(record, kind, 1, qualifiedFacts),
      buildRound(record, kind, 2, qualifiedFacts),
    ],
    finalQualifiedFacts: qualifiedFacts,
    finalQualifiedSetSha256: setDigest,
    emptyResultReason:
      qualifiedFacts.length === 0
        ? (d17Category.notFoundReason ??
          "No qualifying fact survived the exhaustive synthetic boundary.")
        : null,
    surgeonBranch:
      kind === "surgery"
        ? {
            status: "no-surgeon-name-found",
            names: [],
            genericNoNameReason:
              "No reopened original page recorded a named medical person in this synthetic fixture.",
          }
        : null,
  } as FollowUpResearchV2AuditUnit;
}

function writeTerminalLedger(
  root: string,
  caseSlug: string,
  p0SidecarSha256: string,
): void {
  const casePath = `src/content/cases/${caseSlug}.json`;
  const d17Path = `research/follow-ups/decision-17/${caseSlug}.json`;
  const sidecarPath = `src/content/follow-ups/${caseSlug}.json`;
  const caseRecord = caseSchema.parse(
    parseStrictJson(readFileSync(join(root, casePath), "utf8")),
  );
  const d17Bytes = readFileSync(join(root, d17Path));
  const d17 = followUpResearchSchema.parse(
    parseStrictJson(d17Bytes.toString("utf8")),
  );
  const ledger: FollowUpResearchV2 = {
    schemaVersion: "case-follow-up-research.v2",
    caseId: caseRecord.id,
    caseSlug,
    searchContext: expectedFollowUpResearchV2SearchContextForCase(caseRecord),
    caseClinicalDigest: computeCaseContentDigest(caseRecord),
    evidenceStatus: "exhaustive-audit",
    authorityBinding: { ...FOLLOW_UP_RESEARCH_V2_AUTHORITY_BINDING },
    sourcePolicyBinding: { ...FOLLOW_UP_SOURCE_POLICY_V10_BINDING },
    decision17BaselineBinding: {
      researchSchemaVersion: "case-follow-up-research.v1",
      researchPath: d17Path,
      researchSha256: sha256Hex(d17Bytes),
      sidecarSchemaVersion: "case-follow-up.v1",
      sidecarPath,
      sidecarSha256: p0SidecarSha256,
    },
    audits: {
      treatment: buildUnit(
        caseRecord,
        "treatment",
        d17.categories.treatment,
      ) as Extract<FollowUpResearchV2AuditUnit, { factKind: "treatment" }>,
      surgery: buildUnit(
        caseRecord,
        "surgery",
        d17.categories.surgery,
      ) as Extract<FollowUpResearchV2AuditUnit, { factKind: "surgery" }>,
      injection: buildUnit(
        caseRecord,
        "injection",
        d17.categories.injection,
      ) as Extract<FollowUpResearchV2AuditUnit, { factKind: "injection" }>,
      "actual-return": buildUnit(
        caseRecord,
        "actual-return",
        d17.categories["actual-return"],
      ) as Extract<FollowUpResearchV2AuditUnit, { factKind: "actual-return" }>,
    },
  };
  const target = join(
    root,
    `research/follow-ups/decision-18/cases/${caseSlug}.json`,
  );
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, canonicalJson(ledger), "utf8");
}

function writeP0Sidecar(
  root: string,
  caseSlug: string,
  expectedSha256: string,
): void {
  const casePath = `src/content/cases/${caseSlug}.json`;
  const d17Path = `research/follow-ups/decision-17/${caseSlug}.json`;
  const sidecarPath = `src/content/follow-ups/${caseSlug}.json`;
  const caseRecord = caseSchema.parse(
    parseStrictJson(readFileSync(join(root, casePath), "utf8")),
  );
  const d17 = followUpResearchSchema.parse(
    parseStrictJson(readFileSync(join(root, d17Path), "utf8")),
  );
  const diagnosisSources = caseRecord.sources.filter((source) =>
    source.supports.includes("general.confirmedUpdate"),
  );
  expect(diagnosisSources).toHaveLength(1);
  expect(diagnosisSources[0]!.type).toBe("diagnosis-first-party");
  const shell: CaseFollowUp = {
    schemaVersion: "case-follow-up.v1",
    caseId: caseRecord.id,
    caseClinicalDigest: "0".repeat(64),
    sourcePolicyBinding: { ...FOLLOW_UP_SOURCE_POLICY_V10_BINDING },
    legacyDiagnosisProjection: {
      field: "general.confirmedUpdate",
      sourceId: diagnosisSources[0]!.id,
      sourceTier: "team-or-league-official",
    },
    categories: {
      treatment: [],
      surgery: [],
      injection: [],
      "actual-return": [],
    },
  };
  const facts = Object.fromEntries(
    FOLLOW_UP_KINDS.map((kind) => [kind, d17.categories[kind].facts]),
  ) as Record<FollowUpKind, FollowUpResearchFact[]>;
  const sidecarText = canonicalJson(
    buildDecision18ProjectedSidecar(
      caseRecord,
      shell,
      facts,
      FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
    ),
  );
  expect(sha256Hex(sidecarText)).toBe(expectedSha256);
  const target = join(root, sidecarPath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, sidecarText, "utf8");
}

function initializeAclFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "atlas-d18-receipt-"));
  for (const path of [
    DECISION_18_P0_BASELINE_PATH,
    DECISION_18_PLAN_PATH,
    DECISION_18_AUTHORIZATION_PATH,
    FOLLOW_UP_SOURCE_POLICY_V10_BINDING.jsonPath,
    FOLLOW_UP_SOURCE_POLICY_V10_BINDING.markdownPath,
  ]) {
    copyIntoRoot(root, path);
  }
  for (const caseSlug of DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl
    .membership) {
    copyIntoRoot(root, `src/content/cases/${caseSlug}.json`);
    copyIntoRoot(root, `research/follow-ups/decision-17/${caseSlug}.json`);
  }
  const p0 = parseStrictJson(
    readFileSync(join(root, DECISION_18_P0_BASELINE_PATH), "utf8"),
  ) as P0BaselineShape;
  const p0Sidecars = new Map(
    p0.decision17FollowUpBaseline.sidecars.map((entry) => [
      entry.path,
      entry.sha256,
    ]),
  );
  for (const caseSlug of DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl
    .membership) {
    writeP0Sidecar(
      root,
      caseSlug,
      p0Sidecars.get(`src/content/follow-ups/${caseSlug}.json`)!,
    );
  }
  git(root, ["init", "-q"]);
  git(root, ["config", "user.name", "Decision 18 Test"]);
  git(root, ["config", "user.email", "decision18@example.invalid"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-q", "-m", "chore(test): seed P0 inputs"]);

  for (const caseSlug of DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl
    .membership) {
    writeTerminalLedger(
      root,
      caseSlug,
      p0Sidecars.get(`src/content/follow-ups/${caseSlug}.json`)!,
    );
  }
  const report = [
    "# Synthetic Decision 18 ACL batch report",
    ...DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl.membership.map(
      (slug) => `- ${slug}`,
    ),
    `- kinds: ${FOLLOW_UP_KINDS.join(", ")}`,
  ].join("\n");
  const reportPath = join(
    root,
    DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl.reportPath,
  );
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${report}\n`, "utf8");
  const evidencePath = join(
    root,
    DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl.evidenceDirectory,
    "round-summary.v1.json",
  );
  mkdirSync(dirname(evidencePath), { recursive: true });
  writeFileSync(
    evidencePath,
    canonicalJson({ auditUnits: 28, batchId: "acl", terminal: true }),
    "utf8",
  );
  return root;
}

function codes(result: { issues: readonly { code: string }[] }): string[] {
  return result.issues.map((entry) => entry.code);
}

function syntheticReceiptChain(): Record<Decision18FollowUpBatchId, string> {
  const texts = {} as Record<Decision18FollowUpBatchId, string>;
  const predecessors: ValidatedDecision18FollowUpBatchReceipt[] = [];
  for (const [index, batchId] of [
    "acl",
    "ankle",
    "achilles",
  ].entries() as IterableIterator<[number, Decision18FollowUpBatchId]>) {
    const paths = [
      ...expectedDecision18BatchResearchLedgers(batchId),
      ...expectedDecision18BatchSidecars(batchId),
    ].map((entry) => entry.path);
    const receipt = buildDecision18FollowUpBatchReceipt({
      batchId,
      evidenceFiles: [],
      generatedAt: `2026-08-15T${String(9 + index).padStart(2, "0")}:00:00Z`,
      reviewReportSha256: sha256Hex(`${batchId}:report`),
      sha256ByPath: Object.fromEntries(
        paths.map((path) => [path, sha256Hex(path)]),
      ),
      validatedPredecessors: predecessors,
    });
    const text = canonicalDecision18FollowUpBatchReceiptText(receipt);
    texts[batchId] = text;
    predecessors.push({
      batchId,
      path: DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId].receiptPath,
      receipt,
      receiptDigest: sha256Hex(text),
    });
  }
  return texts;
}

describe("Decision 18 batch receipt generator/checker", () => {
  it("check selection can revalidate each batch in a complete three-receipt chain", () => {
    const texts = syntheticReceiptChain();
    for (const [index, batchId] of [
      "acl",
      "ankle",
      "achilles",
    ].entries() as IterableIterator<[number, Decision18FollowUpBatchId]>) {
      const selection = selectDecision18BatchReceiptCommandChain(
        texts,
        batchId,
        "check",
        NOW,
      );
      expect(selection.issues).toEqual([]);
      expect(selection.chain.completedBatchIds).toEqual([
        "acl",
        "ankle",
        "achilles",
      ]);
      expect(selection.validatedReceiptPredecessors).toHaveLength(index);
    }
    expect(
      codes(
        selectDecision18BatchReceiptCommandChain(texts, "acl", "write", NOW),
      ),
    ).toContain("decision18-batch-command-not-active");
  });

  it("writes only the active ACL receipt after 7 terminal ledgers and exact projections", () => {
    const root = initializeAclFixture();
    try {
      const result = runDecision18FollowUpBatchReceiptCommand({
        batchId: "acl",
        generatedAt: GENERATED_AT,
        mode: "write",
        now: NOW,
        root,
      });
      expect(result.status, JSON.stringify(result.issues, null, 2)).toBe(
        "written",
      );
      expect(result.issues).toEqual([]);
      expect(result.counts).toMatchObject({
        auditUnitCount: 28,
        caseCount: 7,
        evidenceFileCount: 1,
        itemCount: 16,
        ledgerCount: 7,
        sidecarCount: 7,
      });
      expect(result.counts.itemCountsByKind).toEqual({
        treatment: 5,
        surgery: 7,
        injection: 0,
        "actual-return": 4,
      });
      const receiptBytes = readFileSync(join(root, result.receiptPath), "utf8");
      expect(receiptBytes).toBe(result.receiptText);
      const parsed = parseDecision18FollowUpBatchReceiptText(receiptBytes, {
        batchId: "acl",
        now: NOW,
        validatedPredecessors: [],
      });
      expect(parsed.issues).toEqual([]);
      expect(parsed.receipt?.evidenceFiles).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("requires a committed clean candidate for --check and verifies its introduction commit", () => {
    const root = initializeAclFixture();
    try {
      const written = runDecision18FollowUpBatchReceiptCommand({
        batchId: "acl",
        generatedAt: GENERATED_AT,
        mode: "write",
        now: NOW,
        root,
      });
      expect(written.status).toBe("written");
      const uncommitted = runDecision18FollowUpBatchReceiptCommand({
        batchId: "acl",
        generatedAt: GENERATED_AT,
        mode: "check",
        now: NOW,
        root,
      });
      expect(uncommitted.status).toBe("failed");
      expect(codes(uncommitted)).toEqual(
        expect.arrayContaining([
          "decision18-batch-command-completed-worktree-dirty",
          "decision18-batch-predecessor-introduction",
        ]),
      );

      git(root, ["add", "."]);
      git(root, [
        "commit",
        "-q",
        "-m",
        "feat(follow-ups): complete Decision 18 ACL batch",
      ]);
      const checked = runDecision18FollowUpBatchReceiptCommand({
        batchId: "acl",
        generatedAt: GENERATED_AT,
        mode: "check",
        now: NOW,
        root,
      });
      expect(checked.status, JSON.stringify(checked.issues, null, 2)).toBe(
        "checked",
      );
      expect(checked.issues).toEqual([]);
      const parsed = parseDecision18FollowUpBatchReceiptText(
        readFileSync(join(root, checked.receiptPath), "utf8"),
        { batchId: "acl", now: NOW, validatedPredecessors: [] },
      );
      expect(parsed.receipt).not.toBeNull();
      expect(
        validateDecision18CompletedBatchGitState(root, [
          {
            path: checked.receiptPath,
            receipt: parsed.receipt!,
          },
        ]),
      ).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a receipt introduced by a non-conventional commit", () => {
    const root = initializeAclFixture();
    try {
      expect(
        runDecision18FollowUpBatchReceiptCommand({
          batchId: "acl",
          generatedAt: GENERATED_AT,
          mode: "write",
          now: NOW,
          root,
        }).status,
      ).toBe("written");
      git(root, ["add", "."]);
      git(root, ["commit", "-q", "-m", "complete Decision 18 ACL batch"]);

      const checked = runDecision18FollowUpBatchReceiptCommand({
        batchId: "acl",
        generatedAt: GENERATED_AT,
        mode: "check",
        now: NOW,
        root,
      });
      expect(checked.status).toBe("failed");
      expect(codes(checked)).toContain(
        "decision18-batch-predecessor-commit-subject",
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a coherent later commit that rewrites a completed batch", () => {
    const root = initializeAclFixture();
    try {
      const written = runDecision18FollowUpBatchReceiptCommand({
        batchId: "acl",
        generatedAt: GENERATED_AT,
        mode: "write",
        now: NOW,
        root,
      });
      expect(written.status).toBe("written");
      git(root, ["add", "."]);
      git(root, [
        "commit",
        "-q",
        "-m",
        "feat(follow-ups): complete Decision 18 ACL batch",
      ]);

      const reportPath = join(
        root,
        DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl.reportPath,
      );
      writeFileSync(
        reportPath,
        `${readFileSync(reportPath, "utf8").trimEnd()}\nchanged\n`,
        "utf8",
      );
      const receiptPath = join(
        root,
        DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl.receiptPath,
      );
      const parsed = parseDecision18FollowUpBatchReceiptText(
        readFileSync(receiptPath, "utf8"),
        { batchId: "acl", now: NOW, validatedPredecessors: [] },
      );
      expect(parsed.receipt).not.toBeNull();
      const rewritten = {
        ...parsed.receipt!,
        reviewReport: {
          ...parsed.receipt!.reviewReport,
          sha256: sha256Hex(readFileSync(reportPath)),
        },
      };
      writeFileSync(
        receiptPath,
        canonicalDecision18FollowUpBatchReceiptText(rewritten),
        "utf8",
      );
      git(root, ["add", "."]);
      git(root, [
        "commit",
        "-q",
        "-m",
        "fix(follow-ups): rewrite completed Decision 18 ACL batch",
      ]);

      const checked = runDecision18FollowUpBatchReceiptCommand({
        batchId: "acl",
        generatedAt: GENERATED_AT,
        mode: "check",
        now: NOW,
        root,
      });
      expect(checked.status).toBe("failed");
      expect(codes(checked)).toContain(
        "decision18-batch-predecessor-later-mutation",
      );
      expect(codes(checked)).not.toContain(
        "decision18-batch-command-receipt-mismatch",
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("refuses generation when the exact P0 baseline bytes drift", () => {
    const root = initializeAclFixture();
    try {
      const p0Path = join(root, DECISION_18_P0_BASELINE_PATH);
      writeFileSync(p0Path, `${readFileSync(p0Path, "utf8")} `, "utf8");
      const result = runDecision18FollowUpBatchReceiptCommand({
        batchId: "acl",
        generatedAt: GENERATED_AT,
        mode: "write",
        now: NOW,
        root,
      });
      expect(result.status).toBe("failed");
      expect(codes(result)).toContain("decision18-batch-p0-baseline-digest");
      expect(
        existsSync(
          join(root, DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl.receiptPath),
        ),
      ).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("refuses overwrite, nonterminal ledgers, noncanonical reports, and predecessor drift", () => {
    const root = initializeAclFixture();
    try {
      const firstLedger = join(
        root,
        "research/follow-ups/decision-18/cases/danny-green-acl-2022.json",
      );
      const ledger = parseStrictJson(
        readFileSync(firstLedger, "utf8"),
      ) as FollowUpResearchV2;
      ledger.audits.treatment.rounds.pop();
      writeFileSync(firstLedger, canonicalJson(ledger), "utf8");
      const reportPath = join(
        root,
        DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl.reportPath,
      );
      writeFileSync(reportPath, `${readFileSync(reportPath, "utf8")} `, "utf8");
      const invalid = runDecision18FollowUpBatchReceiptCommand({
        batchId: "acl",
        generatedAt: GENERATED_AT,
        mode: "write",
        now: NOW,
        root,
      });
      expect(invalid.status).toBe("failed");
      expect(codes(invalid)).toEqual(
        expect.arrayContaining([
          "decision18-batch-v2-not-terminal",
          "decision18-batch-report-not-canonical",
        ]),
      );
      expect(readFileSync(firstLedger, "utf8")).toBe(canonicalJson(ledger));
      expect(
        existsSync(
          join(root, DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl.receiptPath),
        ),
      ).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a later batch when a completed predecessor path has drifted", () => {
    const root = initializeAclFixture();
    try {
      const written = runDecision18FollowUpBatchReceiptCommand({
        batchId: "acl",
        generatedAt: GENERATED_AT,
        mode: "write",
        now: NOW,
        root,
      });
      expect(written.status).toBe("written");
      git(root, ["add", "."]);
      git(root, [
        "commit",
        "-q",
        "-m",
        "feat(follow-ups): complete Decision 18 ACL batch",
      ]);
      const completedReport = join(
        root,
        DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl.reportPath,
      );
      writeFileSync(
        completedReport,
        `${readFileSync(completedReport, "utf8").trimEnd()}\nchanged\n`,
        "utf8",
      );
      const ankle = runDecision18FollowUpBatchReceiptCommand({
        batchId: "ankle",
        generatedAt: GENERATED_AT,
        mode: "write",
        now: NOW,
        root,
      });
      expect(ankle.status).toBe("failed");
      expect(codes(ankle)).toEqual(
        expect.arrayContaining([
          "decision18-batch-completed-path-mutation",
          "decision18-batch-completed-digest-drift",
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
