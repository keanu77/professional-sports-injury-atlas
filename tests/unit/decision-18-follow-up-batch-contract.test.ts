import { describe, expect, it } from "vitest";

import {
  deriveDecision18BatchResumeProgress,
  scanDecision18FollowUpBatchReceiptChain,
  validateDecision18BatchChangedPaths,
  validateDecision18BatchDirtyPaths,
  validateDecision18CompletedBatchDigests,
  type Decision18AuditUnitProgress,
  type Decision18BatchReceiptTexts,
} from "../../src/lib/cases/decision-18-follow-up-batch";
import { FOLLOW_UP_SOURCE_POLICY_V10_BINDING } from "../../src/lib/contracts/case-follow-up";
import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import {
  DECISION_18_AUTHORITY_BINDING,
  DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS,
  DECISION_18_FOLLOW_UP_BATCH_MEMBERSHIP,
  DECISION_18_FOLLOW_UP_BATCH_ORDER,
  DECISION_18_FOLLOW_UP_BATCH_RECEIPT_SCHEMA_VERSION,
  buildDecision18FollowUpBatchReceipt,
  canonicalDecision18FollowUpBatchReceiptText,
  decision18FollowUpBatchReceiptSchema,
  expectedDecision18BatchAllowedPaths,
  expectedDecision18BatchResearchLedgers,
  expectedDecision18BatchSidecars,
  parseDecision18FollowUpBatchReceiptText,
  type Decision18FollowUpBatchId,
  type Decision18FollowUpBatchReceipt,
  type ValidatedDecision18FollowUpBatchReceipt,
} from "../../src/lib/contracts/decision-18-follow-up-batch";

const NOW = new Date("2026-08-15T12:00:00.000Z");
const GENERATED_AT = "2026-08-15T11:00:00Z";

function digest(label: string): string {
  return sha256Hex(label);
}

function makeReceipt(
  batchId: Decision18FollowUpBatchId,
  predecessors: readonly ValidatedDecision18FollowUpBatchReceipt[],
  overrides: Partial<Decision18FollowUpBatchReceipt> = {},
): Decision18FollowUpBatchReceipt {
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId];
  const evidenceFiles = [
    {
      path: `${definition.evidenceDirectory}round-summary.v1.json`,
      sha256: digest(`${batchId}:evidence`),
    },
  ];
  return {
    schemaVersion: DECISION_18_FOLLOW_UP_BATCH_RECEIPT_SCHEMA_VERSION,
    decisionId: "decision-18",
    batchId,
    sequenceNumber: definition.sequenceNumber,
    generatedAt: GENERATED_AT,
    auditCutoffDate: "2026-08-15",
    authorityBinding: { ...DECISION_18_AUTHORITY_BINDING },
    sourcePolicyBinding: { ...FOLLOW_UP_SOURCE_POLICY_V10_BINDING },
    membership: [...definition.membership],
    auditUnitCount: definition.membership.length * 4,
    predecessorReceipts: predecessors.map((entry) => ({
      batchId: entry.batchId,
      path: entry.path,
      sha256: entry.receiptDigest,
    })),
    researchLedgers: expectedDecision18BatchResearchLedgers(batchId).map(
      (entry) => ({ ...entry, sha256: digest(entry.path) }),
    ),
    sidecars: expectedDecision18BatchSidecars(batchId).map((entry) => ({
      ...entry,
      sha256: digest(entry.path),
    })),
    reviewReport: {
      path: definition.reportPath,
      sha256: digest(definition.reportPath),
    },
    evidenceFiles,
    allowedPaths: expectedDecision18BatchAllowedPaths(
      batchId,
      evidenceFiles.map((entry) => entry.path),
    ),
    ...overrides,
  };
}

function asValidated(
  receipt: Decision18FollowUpBatchReceipt,
): ValidatedDecision18FollowUpBatchReceipt {
  const text = canonicalDecision18FollowUpBatchReceiptText(receipt);
  return {
    batchId: receipt.batchId,
    path: DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[receipt.batchId].receiptPath,
    receipt,
    receiptDigest: sha256Hex(text),
  };
}

function makeCompleteChain(): {
  receipts: [
    Decision18FollowUpBatchReceipt,
    Decision18FollowUpBatchReceipt,
    Decision18FollowUpBatchReceipt,
  ];
  texts: Required<Decision18BatchReceiptTexts>;
} {
  const acl = makeReceipt("acl", []);
  const validatedAcl = asValidated(acl);
  const ankle = makeReceipt("ankle", [validatedAcl]);
  const validatedAnkle = asValidated(ankle);
  const achilles = makeReceipt("achilles", [validatedAcl, validatedAnkle]);
  return {
    receipts: [acl, ankle, achilles],
    texts: {
      acl: canonicalJson(acl),
      ankle: canonicalJson(ankle),
      achilles: canonicalJson(achilles),
    },
  };
}

function issueCodes(issues: readonly { code: string }[]): string[] {
  return issues.map((entry) => entry.code);
}

describe("Decision 18 batch receipt contract", () => {
  it("freezes exact ordered, disjoint 7/12/7 membership", () => {
    expect(DECISION_18_FOLLOW_UP_BATCH_ORDER).toEqual([
      "acl",
      "ankle",
      "achilles",
    ]);
    expect(
      DECISION_18_FOLLOW_UP_BATCH_ORDER.map(
        (batchId) => DECISION_18_FOLLOW_UP_BATCH_MEMBERSHIP[batchId].length,
      ),
    ).toEqual([7, 12, 7]);
    const allCases = DECISION_18_FOLLOW_UP_BATCH_ORDER.flatMap(
      (batchId) => DECISION_18_FOLLOW_UP_BATCH_MEMBERSHIP[batchId],
    );
    expect(allCases).toHaveLength(26);
    expect(new Set(allCases)).toHaveLength(26);
    expect(DECISION_18_FOLLOW_UP_BATCH_MEMBERSHIP.acl).toEqual([
      "danny-green-acl-2022",
      "joe-ingles-acl-2022",
      "kyrie-irving-acl-2025",
      "markelle-fultz-acl-2021",
      "moritz-wagner-acl-2024",
      "ricky-rubio-acl-2021",
      "thomas-bryant-acl-2021",
    ]);
    expect(DECISION_18_FOLLOW_UP_BATCH_MEMBERSHIP.ankle).toEqual([
      "anfernee-simons-ankle-sprain-2023",
      "anthony-edwards-ankle-sprain-2023",
      "anthony-edwards-ankle-sprain-2025",
      "cj-mccollum-ankle-sprain-2020",
      "ja-morant-ankle-sprain-2020",
      "kevin-durant-ankle-sprain-2024",
      "kyrie-irving-ankle-sprain-2021",
      "lamelo-ball-ankle-sprain-2022",
      "lamelo-ball-ankle-sprain-2023",
      "lamelo-ball-ankle-sprain-2025",
      "lebron-james-ankle-sprain-2021",
      "trae-young-ankle-sprain-2021",
    ]);
    expect(DECISION_18_FOLLOW_UP_BATCH_MEMBERSHIP.achilles).toEqual([
      "brandon-clarke-achilles-rupture-2023",
      "damian-lillard-achilles-rupture-2025",
      "dejounte-murray-achilles-rupture-2025",
      "dwight-powell-achilles-rupture-2020",
      "jayson-tatum-achilles-rupture-2025",
      "kevin-durant-achilles-rupture-2019",
      "tyrese-haliburton-achilles-rupture-2025",
    ]);
  });

  it("accepts canonical receipts with exact inventory and all predecessor digests", () => {
    const { texts } = makeCompleteChain();
    const result = scanDecision18FollowUpBatchReceiptChain(texts, { now: NOW });
    expect(result.issues).toEqual([]);
    expect(result.completedBatchIds).toEqual(["acl", "ankle", "achilles"]);
    expect(result.completedCaseSlugs).toHaveLength(26);
    expect(result.activeBatchId).toBeNull();
    expect(new Set(Object.values(result.auditCutoffByCaseSlug))).toEqual(
      new Set(["2026-08-15"]),
    );
  });

  it("builds a deterministic receipt from measured batch paths without writing", () => {
    const expectedPaths = [
      ...expectedDecision18BatchResearchLedgers("acl"),
      ...expectedDecision18BatchSidecars("acl"),
    ].map((entry) => entry.path);
    const receipt = buildDecision18FollowUpBatchReceipt({
      batchId: "acl",
      evidenceFiles: [],
      generatedAt: GENERATED_AT,
      reviewReportSha256: digest("acl-report"),
      sha256ByPath: Object.fromEntries(
        expectedPaths.map((path) => [path, digest(path)]),
      ),
      validatedPredecessors: [],
    });
    expect(receipt.auditCutoffDate).toBe("2026-08-15");
    expect(receipt.membership).toEqual(
      DECISION_18_FOLLOW_UP_BATCH_MEMBERSHIP.acl,
    );
    expect(receipt.allowedPaths).toEqual(
      expectedDecision18BatchAllowedPaths("acl", []),
    );
    expect(() =>
      buildDecision18FollowUpBatchReceipt({
        batchId: "acl",
        evidenceFiles: [],
        generatedAt: GENERATED_AT,
        reviewReportSha256: digest("acl-report"),
        sha256ByPath: {},
        validatedPredecessors: [],
      }),
    ).toThrow(/missing or invalid SHA-256/u);
  });

  it("requires exact canonical receipt bytes", () => {
    const receipt = makeReceipt("acl", []);
    const parsed = parseDecision18FollowUpBatchReceiptText(
      `${canonicalJson(receipt)}\n`,
      { batchId: "acl", now: NOW, validatedPredecessors: [] },
    );
    expect(parsed.receipt).toBeNull();
    expect(issueCodes(parsed.issues)).toContain(
      "decision18-batch-receipt-not-canonical",
    );
  });

  it("rejects a future generatedAt or independently supplied cutoff", () => {
    const future = makeReceipt("acl", [], {
      generatedAt: "2026-08-16T00:00:00Z",
      auditCutoffDate: "2026-08-16",
    });
    const futureResult = parseDecision18FollowUpBatchReceiptText(
      canonicalJson(future),
      { batchId: "acl", now: NOW, validatedPredecessors: [] },
    );
    expect(issueCodes(futureResult.issues)).toContain(
      "decision18-batch-generated-at-future",
    );

    const mismatched = makeReceipt("acl", [], {
      auditCutoffDate: "2026-08-14",
    });
    const cutoffResult = parseDecision18FollowUpBatchReceiptText(
      canonicalJson(mismatched),
      { batchId: "acl", now: NOW, validatedPredecessors: [] },
    );
    expect(issueCodes(cutoffResult.issues)).toContain(
      "decision18-batch-audit-cutoff",
    );
  });

  it("rejects missing, noncontiguous, and digest-drifted predecessors", () => {
    const { receipts, texts } = makeCompleteChain();
    const missingAcl = scanDecision18FollowUpBatchReceiptChain(
      { ankle: texts.ankle },
      { now: NOW },
    );
    expect(missingAcl.activeBatchId).toBeNull();
    expect(issueCodes(missingAcl.issues)).toContain(
      "decision18-batch-receipt-noncontiguous",
    );

    const brokenAnkle = {
      ...receipts[1],
      predecessorReceipts: [
        {
          ...receipts[1].predecessorReceipts[0]!,
          sha256: "0".repeat(64),
        },
      ],
    } satisfies Decision18FollowUpBatchReceipt;
    const brokenChain = scanDecision18FollowUpBatchReceiptChain(
      { acl: texts.acl, ankle: canonicalJson(brokenAnkle) },
      { now: NOW },
    );
    expect(brokenChain.completedBatchIds).toEqual(["acl"]);
    expect(brokenChain.activeBatchId).toBeNull();
    expect(issueCodes(brokenChain.issues)).toContain(
      "decision18-batch-predecessor-binding",
    );

    const acl = makeReceipt("acl", []);
    const validatedAcl = asValidated(acl);
    const backdatedAnkle = makeReceipt("ankle", [validatedAcl], {
      generatedAt: "2026-08-15T10:00:00Z",
    });
    const backdated = parseDecision18FollowUpBatchReceiptText(
      canonicalJson(backdatedAnkle),
      {
        batchId: "ankle",
        now: NOW,
        validatedPredecessors: [validatedAcl],
      },
    );
    expect(issueCodes(backdated.issues)).toContain(
      "decision18-batch-predecessor-time-order",
    );
  });

  it("selects the first absent receipt only when the chain is valid", () => {
    const { texts } = makeCompleteChain();
    expect(
      scanDecision18FollowUpBatchReceiptChain({}, { now: NOW }).activeBatchId,
    ).toBe("acl");
    expect(
      scanDecision18FollowUpBatchReceiptChain({ acl: texts.acl }, { now: NOW })
        .activeBatchId,
    ).toBe("ankle");
    expect(
      scanDecision18FollowUpBatchReceiptChain(
        { acl: texts.acl, ankle: texts.ankle },
        { now: NOW },
      ).activeBatchId,
    ).toBe("achilles");
  });

  it("rejects membership, file inventory, and allowed-path drift", () => {
    const base = makeReceipt("acl", []);
    const changed = {
      ...base,
      membership: base.membership.slice(1),
      researchLedgers: base.researchLedgers.slice(1),
      allowedPaths: base.allowedPaths.slice(1),
    } satisfies Decision18FollowUpBatchReceipt;
    const parsed = parseDecision18FollowUpBatchReceiptText(
      canonicalJson(changed),
      { batchId: "acl", now: NOW, validatedPredecessors: [] },
    );
    expect(issueCodes(parsed.issues)).toEqual(
      expect.arrayContaining([
        "decision18-batch-membership",
        "decision18-batch-file-inventory",
        "decision18-batch-allowed-path-inventory",
      ]),
    );

    const structural = decision18FollowUpBatchReceiptSchema.safeParse({
      ...base,
      allowedPaths: [...base.allowedPaths, "../outside.json"],
    });
    expect(structural.success).toBe(false);
  });

  it("bounds evidence paths to one batch directory", () => {
    const base = makeReceipt("acl", []);
    const evidenceFiles = [
      {
        path: "docs/reviews/evidence/decision-18/batch-2-ankle/foreign.json",
        sha256: digest("foreign"),
      },
    ];
    const changed = {
      ...base,
      evidenceFiles,
      allowedPaths: expectedDecision18BatchAllowedPaths(
        "acl",
        evidenceFiles.map((entry) => entry.path),
      ),
    } satisfies Decision18FollowUpBatchReceipt;
    const parsed = parseDecision18FollowUpBatchReceiptText(
      canonicalJson(changed),
      { batchId: "acl", now: NOW, validatedPredecessors: [] },
    );
    expect(issueCodes(parsed.issues)).toContain(
      "decision18-batch-evidence-inventory",
    );
  });
});

describe("Decision 18 batch immutability and deterministic resume", () => {
  it("allows clean start and active-batch-only dirty paths", () => {
    expect(
      validateDecision18BatchDirtyPaths({
        activeBatchId: "acl",
        completedBatchIds: [],
        dirtyPaths: [],
      }),
    ).toEqual([]);
    expect(
      validateDecision18BatchDirtyPaths({
        activeBatchId: "acl",
        completedBatchIds: [],
        dirtyPaths: [
          "research/follow-ups/decision-18/cases/danny-green-acl-2022.json",
          "docs/reviews/evidence/decision-18/batch-1-acl/query-log.json",
        ],
      }),
    ).toEqual([]);
  });

  it("rejects dirty paths outside the active batch and any completed-batch rewrite", () => {
    const outside = validateDecision18BatchDirtyPaths({
      activeBatchId: "acl",
      completedBatchIds: [],
      dirtyPaths: ["package.json"],
    });
    expect(issueCodes(outside)).toContain(
      "decision18-batch-dirty-path-outside-allowlist",
    );

    const completed = validateDecision18BatchDirtyPaths({
      activeBatchId: "ankle",
      completedBatchIds: ["acl"],
      dirtyPaths: [
        "research/follow-ups/decision-18/cases/danny-green-acl-2022.json",
      ],
    });
    expect(issueCodes(completed)).toContain(
      "decision18-batch-completed-path-mutation",
    );

    const repeated =
      "research/follow-ups/decision-18/cases/danny-green-acl-2022.json";
    const malformedState = validateDecision18BatchDirtyPaths({
      activeBatchId: "acl",
      completedBatchIds: ["ankle"],
      dirtyPaths: [repeated, repeated],
    });
    expect(issueCodes(malformedState)).toEqual(
      expect.arrayContaining([
        "decision18-batch-completed-order",
        "decision18-batch-active-order",
        "decision18-batch-dirty-path-duplicate",
      ]),
    );
  });

  it("re-hashes every completed receipt-bound file", () => {
    const receipt = makeReceipt("acl", []);
    const measured = Object.fromEntries(
      [
        ...receipt.researchLedgers,
        ...receipt.sidecars,
        receipt.reviewReport,
        ...receipt.evidenceFiles,
      ].map((entry) => [entry.path, entry.sha256]),
    );
    expect(validateDecision18CompletedBatchDigests(receipt, measured)).toEqual(
      [],
    );
    measured[receipt.researchLedgers[0]!.path] = "f".repeat(64);
    expect(
      issueCodes(validateDecision18CompletedBatchDigests(receipt, measured)),
    ).toContain("decision18-batch-completed-digest-drift");
    delete measured[receipt.reviewReport.path];
    expect(
      issueCodes(validateDecision18CompletedBatchDigests(receipt, measured)),
    ).toContain("decision18-batch-completed-file-missing");
  });

  it("enforces the receipt commit path allowlist and required inventory", () => {
    const receipt = makeReceipt("acl", []);
    const required = [
      ...receipt.researchLedgers.map((entry) => entry.path),
      receipt.reviewReport.path,
      DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl.receiptPath,
      ...receipt.evidenceFiles.map((entry) => entry.path),
    ];
    expect(validateDecision18BatchChangedPaths(receipt, required)).toEqual([]);
    const invalid = validateDecision18BatchChangedPaths(receipt, [
      ...required.slice(1),
      "package.json",
      "package.json",
    ]);
    expect(issueCodes(invalid)).toEqual(
      expect.arrayContaining([
        "decision18-batch-commit-path-outside-allowlist",
        "decision18-batch-commit-path-duplicate",
        "decision18-batch-required-commit-path-missing",
      ]),
    );
  });

  it("resumes at the lexicographically first missing/nonterminal unit", () => {
    const empty = deriveDecision18BatchResumeProgress("acl", []);
    expect(empty.issues).toEqual([]);
    expect(empty.totalUnitCount).toBe(28);
    expect(empty.nextUnit).toEqual({
      caseSlug: "danny-green-acl-2022",
      factKind: "actual-return",
    });

    const progress: Decision18AuditUnitProgress[] = [
      {
        caseSlug: "danny-green-acl-2022",
        factKind: "actual-return",
        state: "terminal",
      },
      {
        caseSlug: "danny-green-acl-2022",
        factKind: "injection",
        state: "nonterminal",
      },
      {
        caseSlug: "danny-green-acl-2022",
        factKind: "surgery",
        state: "terminal",
      },
    ];
    const resumed = deriveDecision18BatchResumeProgress("acl", progress);
    expect(resumed.terminalUnitCount).toBe(2);
    expect(resumed.nextUnit).toEqual({
      caseSlug: "danny-green-acl-2022",
      factKind: "injection",
    });
  });

  it("returns complete only when all batch units are terminal", () => {
    const progress = DECISION_18_FOLLOW_UP_BATCH_MEMBERSHIP.acl.flatMap(
      (caseSlug) =>
        (["actual-return", "injection", "surgery", "treatment"] as const).map(
          (factKind) => ({
            caseSlug,
            factKind,
            state: "terminal" as const,
          }),
        ),
    );
    const result = deriveDecision18BatchResumeProgress("acl", progress);
    expect(result.issues).toEqual([]);
    expect(result.terminalUnitCount).toBe(28);
    expect(result.nextUnit).toBeNull();
  });

  it("stops on ambiguous, duplicate, or foreign audit-unit progress", () => {
    const invalid: Decision18AuditUnitProgress[] = [
      {
        caseSlug: "danny-green-acl-2022",
        factKind: "actual-return",
        state: "ambiguous",
      },
      {
        caseSlug: "danny-green-acl-2022",
        factKind: "actual-return",
        state: "terminal",
      },
      {
        caseSlug: "anfernee-simons-ankle-sprain-2023",
        factKind: "surgery",
        state: "nonterminal",
      },
    ];
    const result = deriveDecision18BatchResumeProgress("acl", invalid);
    expect(result.nextUnit).toBeNull();
    expect(issueCodes(result.issues)).toEqual(
      expect.arrayContaining([
        "decision18-batch-progress-ambiguous",
        "decision18-batch-progress-duplicate",
        "decision18-batch-progress-case",
      ]),
    );

    const invalidState = deriveDecision18BatchResumeProgress("acl", [
      {
        caseSlug: "danny-green-acl-2022",
        factKind: "surgery",
        state: "complete",
      } as unknown as Decision18AuditUnitProgress,
    ]);
    expect(issueCodes(invalidState.issues)).toContain(
      "decision18-batch-progress-state",
    );

    const invalidKind = deriveDecision18BatchResumeProgress("acl", [
      {
        caseSlug: "danny-green-acl-2022",
        factKind: "prognosis",
        state: "nonterminal",
      } as unknown as Decision18AuditUnitProgress,
    ]);
    expect(issueCodes(invalidKind.issues)).toContain(
      "decision18-batch-progress-kind",
    );
  });
});
