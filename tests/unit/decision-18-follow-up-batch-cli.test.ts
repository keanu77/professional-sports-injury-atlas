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

import { describe, expect, it } from "vitest";

import { inspectDecision18ActiveBatchProgress } from "../../scripts/decision-18-follow-up-batch";
import { buildDecision18ResearchRecordScaffold } from "../../src/lib/cases/decision-18-follow-up-generation";
import {
  followUpResearchSchema,
  type FollowUpKind,
} from "../../src/lib/contracts/case-follow-up";
import { caseSchema } from "../../src/lib/contracts/case";
import {
  canonicalJson,
  parseStrictJson,
} from "../../src/lib/contracts/canonical";
import { decision18ResearchRecordPath } from "../../src/lib/contracts/decision-18-follow-up-research-record";
import {
  DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS,
  DECISION_18_P0_BASELINE_PATH,
  type Decision18FollowUpBatchId,
} from "../../src/lib/contracts/decision-18-follow-up-batch";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function copyIntoRoot(root: string, relative: string): void {
  const target = join(root, relative);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(ROOT, relative), target);
}

function writePartialResearchRecord(
  root: string,
  batchId: Decision18FollowUpBatchId,
  caseSlug: string,
  terminalKinds: readonly FollowUpKind[],
  auditCutoffDate = "2026-08-15",
): void {
  const caseRelative = `src/content/cases/${caseSlug}.json`;
  const d17Relative = `research/follow-ups/decision-17/${caseSlug}.json`;
  const sidecarRelative = `src/content/follow-ups/${caseSlug}.json`;
  for (const relative of [caseRelative, d17Relative, sidecarRelative]) {
    copyIntoRoot(root, relative);
  }
  copyIntoRoot(root, DECISION_18_P0_BASELINE_PATH);
  const caseRecord = caseSchema.parse(
    parseStrictJson(readFileSync(join(root, caseRelative), "utf8")),
  );
  const d17Bytes = readFileSync(join(root, d17Relative));
  const d17 = followUpResearchSchema.parse(
    parseStrictJson(d17Bytes.toString("utf8")),
  );
  const record = buildDecision18ResearchRecordScaffold({
    auditCutoffDate,
    batchId,
    caseRecord,
    decision17Research: d17,
  });
  for (const [kindIndex, factKind] of terminalKinds.entries()) {
    const audit = record.audits[factKind];
    audit.rounds = [
      audit.initialQueryPlan.slice(0, 3),
      audit.initialQueryPlan.slice(3),
    ].map((slots, roundIndex) => ({
      startedAt: `2026-08-15T0${kindIndex * 2 + roundIndex}:00:00Z`,
      completedAt: `2026-08-15T0${kindIndex * 2 + roundIndex}:05:00Z`,
      operatorId: "decision-18-resume-test",
      toolChannel: "web-search",
      queries: slots.map((slot, queryIndex) => ({
        queryId: `q-${factKind}-${roundIndex + 1}-${queryIndex + 1}`,
        query: slot.suggestedQuery,
        sourceChannel: slot.sourceChannel,
        timepoint: slot.timepoint,
        timepointApplicability: "applicable" as const,
        notApplicableReason: null,
        coveredTermConcepts: [...slot.coveredTermConcepts],
        namedPersonTerms: [],
        verificationChannel: "web-open-original-page" as const,
        resultCode: "no-candidate" as const,
        resultReason: "No qualifying original-page candidate was found.",
        checkedBoundary:
          "The controlled channel, context, chronology, and synonym family were checked.",
      })),
      candidates: [],
      qualifiedFactChanges: [],
      rejectionOrNotFoundReasons: [
        "No qualifying original-page fact survived this round.",
      ],
      checkedBoundary:
        "The declared channels and chronology angle were checked without inference.",
    }));
  }
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId];
  const target = join(
    root,
    decision18ResearchRecordPath(definition.evidenceDirectory, caseSlug),
  );
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, canonicalJson(record), "utf8");
}

describe("Decision 18 automatic partial-ledger resume inspection", () => {
  it("treats absent active-batch ledgers as not started", () => {
    const root = mkdtempSync(join(tmpdir(), "atlas-d18-batch-empty-"));
    try {
      const result = inspectDecision18ActiveBatchProgress(
        root,
        "acl",
        "2026-08-15",
      );
      expect(result.issues).toEqual([]);
      expect(result.ledgerCount).toBe(0);
      expect(result.progress.totalUnitCount).toBe(28);
      expect(result.progress.nextUnit).toEqual({
        caseSlug: "danny-green-acl-2022",
        factKind: "actual-return",
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("parses existing partial record bytes and blocks malformed state", () => {
    const root = mkdtempSync(join(tmpdir(), "atlas-d18-batch-invalid-"));
    try {
      const path = join(
        root,
        "docs/reviews/evidence/decision-18/batch-1-acl/danny-green-acl-2022.research-record.v1.json",
      );
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, "{}", "utf8");

      const result = inspectDecision18ActiveBatchProgress(
        root,
        "acl",
        "2026-08-15",
      );
      expect(result.ledgerCount).toBe(1);
      expect(result.progress.nextUnit).toBeNull();
      expect(result.issues.map((entry) => entry.code)).toEqual(
        expect.arrayContaining([
          "decision18-research-record-schema",
          "decision18-batch-progress-ambiguous",
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("retains the durable cutoff across days and reports the true remaining 3/4 unit", () => {
    const root = mkdtempSync(join(tmpdir(), "atlas-d18-batch-partial-"));
    try {
      writePartialResearchRecord(
        root,
        "ankle",
        "anfernee-simons-ankle-sprain-2023",
        ["actual-return", "injection", "surgery"],
      );
      const result = inspectDecision18ActiveBatchProgress(
        root,
        "ankle",
        "2026-08-16",
      );
      expect(result.ledgerCount).toBe(1);
      expect(result.researchRecordCount).toBe(1);
      expect(result.issues).toEqual([]);
      expect(result.incompleteFindingCount).toBeGreaterThan(0);
      expect(result.auditCutoffDate).toBe("2026-08-15");
      expect(result.progress.nextUnit).toEqual({
        caseSlug: "anfernee-simons-ankle-sprain-2023",
        factKind: "treatment",
      });
      expect(result.progress.terminalUnitCount).toBe(3);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("blocks mixed audit cutoffs within one active batch", () => {
    const root = mkdtempSync(join(tmpdir(), "atlas-d18-batch-cutoffs-"));
    try {
      writePartialResearchRecord(
        root,
        "ankle",
        "anfernee-simons-ankle-sprain-2023",
        [],
        "2026-08-15",
      );
      writePartialResearchRecord(
        root,
        "ankle",
        "anthony-edwards-ankle-sprain-2023",
        [],
        "2026-08-16",
      );
      const result = inspectDecision18ActiveBatchProgress(
        root,
        "ankle",
        "2026-08-17",
      );

      expect(result.progress.nextUnit).toBeNull();
      expect(result.issues.map((entry) => entry.code)).toContain(
        "decision18-batch-record-cutoff-mixed",
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
