#!/usr/bin/env tsx

/** Read-only Decision 18 batch receipt-chain checker and resume status. */

import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildDecision18ProjectedSidecar,
  generateDecision18CaseArtifacts,
} from "../src/lib/cases/decision-18-follow-up-generation";
import {
  deriveDecision18BatchResumeProgress,
  scanDecision18FollowUpBatchReceiptChain,
  validateDecision18BatchDirtyPaths,
  type Decision18AuditUnitProgress,
  type Decision18BatchResumeProgress,
  type Decision18BatchReceiptTexts,
} from "../src/lib/cases/decision-18-follow-up-batch";
import { computeCaseContentDigest } from "../src/lib/cases/digest";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  followUpResearchSchema,
  type CaseFollowUp,
  type FollowUpResearchFact,
  type FollowUpKind,
} from "../src/lib/contracts/case-follow-up";
import { caseSchema } from "../src/lib/contracts/case";
import {
  canonicalJson,
  isValidIsoDate,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "../src/lib/contracts/canonical";
import {
  decision18ResearchRecordPath,
  parseDecision18FollowUpResearchRecordBytes,
} from "../src/lib/contracts/decision-18-follow-up-research-record";
import {
  DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS,
  DECISION_18_FOLLOW_UP_BATCH_ORDER,
  DECISION_18_P0_BASELINE_PATH,
  DECISION_18_P0_BASELINE_SHA256,
  type Decision18FollowUpBatchId,
} from "../src/lib/contracts/decision-18-follow-up-batch";
import { validateDecision18CompletedBatchGitState } from "./generate-decision-18-follow-up-batch-receipt";

const DEFAULT_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

function argumentValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function parseNow(): Date {
  const supplied = argumentValue("--now");
  const now = supplied === null ? new Date() : new Date(supplied);
  if (Number.isNaN(now.getTime())) {
    throw new Error("--now must be a valid timestamp");
  }
  return now;
}

function readReceiptTexts(root: string): Decision18BatchReceiptTexts {
  const texts: Decision18BatchReceiptTexts = {};
  for (const batchId of DECISION_18_FOLLOW_UP_BATCH_ORDER) {
    const path = resolve(
      root,
      DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId].receiptPath,
    );
    if (!existsSync(path)) continue;
    const status = lstatSync(path);
    if (!status.isFile() || status.isSymbolicLink()) {
      throw new Error(`${path} must be a regular non-symlink receipt file`);
    }
    texts[batchId] = readFileSync(path, "utf8");
  }
  return texts;
}

function nulPaths(command: string, args: readonly string[]): string[] {
  const output = execFileSync(command, args, { encoding: "utf8" });
  return output.split("\0").filter((path) => path.length > 0);
}

function worktreePaths(root: string): string[] {
  return [
    ...nulPaths("git", [
      "-C",
      root,
      "diff",
      "--name-only",
      "-z",
      "--diff-filter=ACDMRTUXB",
    ]),
    ...nulPaths("git", [
      "-C",
      root,
      "diff",
      "--cached",
      "--name-only",
      "-z",
      "--diff-filter=ACDMRTUXB",
    ]),
    ...nulPaths("git", [
      "-C",
      root,
      "ls-files",
      "--others",
      "--exclude-standard",
      "-z",
    ]),
  ].filter((path, index, all) => all.indexOf(path) === index);
}

function prefixIssues(
  prefix: string,
  issues: readonly ValidationIssue[],
): ValidationIssue[] {
  return issues.map((entry) => ({
    ...entry,
    path: entry.path === "" ? prefix : `${prefix}.${entry.path}`,
  }));
}

function ambiguousCaseProgress(
  caseSlug: string,
): Decision18AuditUnitProgress[] {
  return FOLLOW_UP_KINDS.map((factKind) => ({
    caseSlug,
    factKind,
    state: "ambiguous" as const,
  }));
}

export interface ActiveBatchProgressResult {
  auditCutoffDate: string;
  incompleteFindingCount: number;
  issues: ValidationIssue[];
  /** Compatibility alias for researchRecordCount in the stable CLI response. */
  ledgerCount: number;
  progress: Decision18BatchResumeProgress;
  researchRecordCount: number;
}

interface ResumeP0Bindings {
  caseBySlug: Map<
    string,
    { clinicalDigest: string; fileSha256: string; path: string }
  >;
  d17ResearchSha256ByPath: Map<string, string>;
  sidecarSha256ByPath: Map<string, string>;
}

function loadResumeP0Bindings(root: string): ResumeP0Bindings {
  const bytes = readFileSync(resolve(root, DECISION_18_P0_BASELINE_PATH));
  if (sha256Hex(bytes) !== DECISION_18_P0_BASELINE_SHA256) {
    throw new Error("Decision 18 P0 baseline evidence bytes drifted");
  }
  const text = bytes.toString("utf8");
  const parsed = parseStrictJson(text) as {
    caseRows: Array<{
      clinicalDigest: string;
      fileSha256: string;
      path: string;
      slug: string;
    }>;
    decision17FollowUpBaseline: {
      sidecars: Array<{ path: string; sha256: string }>;
    };
    protectedFileBindings: Array<{ path: string; sha256: string }>;
  };
  if (canonicalJson(parsed) !== text) {
    throw new Error("Decision 18 P0 baseline evidence is not canonical JSON");
  }
  return {
    caseBySlug: new Map(parsed.caseRows.map((row) => [row.slug, row])),
    d17ResearchSha256ByPath: new Map(
      parsed.protectedFileBindings
        .filter((row) =>
          row.path.startsWith("research/follow-ups/decision-17/"),
        )
        .map((row) => [row.path, row.sha256]),
    ),
    sidecarSha256ByPath: new Map(
      parsed.decision17FollowUpBaseline.sidecars.map((row) => [
        row.path,
        row.sha256,
      ]),
    ),
  };
}

function reconstructDecision17Sidecar(
  record: ReturnType<typeof caseSchema.parse>,
  facts: Record<FollowUpKind, FollowUpResearchFact[]>,
): CaseFollowUp | null {
  const sources = record.sources.filter((entry) =>
    entry.supports.includes("general.confirmedUpdate"),
  );
  if (sources.length !== 1 || sources[0]!.type !== "diagnosis-first-party") {
    return null;
  }
  const shell: CaseFollowUp = {
    schemaVersion: "case-follow-up.v1",
    caseId: record.id,
    caseClinicalDigest: "0".repeat(64),
    sourcePolicyBinding: { ...FOLLOW_UP_SOURCE_POLICY_V10_BINDING },
    legacyDiagnosisProjection: {
      field: "general.confirmedUpdate",
      sourceId: sources[0]!.id,
      sourceTier: "team-or-league-official",
    },
    categories: {
      treatment: [],
      surgery: [],
      injection: [],
      "actual-return": [],
    },
  };
  return buildDecision18ProjectedSidecar(
    record,
    shell,
    facts,
    FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  );
}

const RESUME_SAFE_INCOMPLETE_CODES = new Set([
  "follow-up-research-v2-baseline-not-revalidated",
  "follow-up-research-v2-coverage-incomplete",
  "follow-up-research-v2-context-formulation-incomplete",
  "follow-up-research-v2-not-terminal",
]);

function issueFactKind(entry: ValidationIssue): FollowUpKind | null {
  return (
    FOLLOW_UP_KINDS.find(
      (kind) =>
        entry.path === `audits.${kind}` ||
        entry.path.startsWith(`audits.${kind}.`) ||
        entry.path === `ledger.audits.${kind}` ||
        entry.path.startsWith(`ledger.audits.${kind}.`) ||
        entry.path === `sidecar.categories.${kind}` ||
        entry.path.startsWith(`sidecar.categories.${kind}.`),
    ) ?? null
  );
}

/**
 * Existing active-batch per-case research records must parse and replay safely.
 * A missing record is a not-started case; malformed or ambiguous partial bytes
 * stop resume. Terminality is derived independently for all four audit units,
 * so a 3/4-complete case resumes at its actual remaining unit.
 */
export function inspectDecision18ActiveBatchProgress(
  root: string,
  batchId: Decision18FollowUpBatchId,
  today: string,
): ActiveBatchProgressResult {
  const issues: ValidationIssue[] = [];
  const unitProgress: Decision18AuditUnitProgress[] = [];
  let incompleteFindingCount = 0;
  let researchRecordCount = 0;
  let p0Bindings: ResumeP0Bindings | null = null;
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId];

  const existingCutoffs = new Set<string>();
  for (const caseSlug of definition.membership) {
    const recordRelative = decision18ResearchRecordPath(
      definition.evidenceDirectory,
      caseSlug,
    );
    const recordPath = resolve(root, recordRelative);
    if (!existsSync(recordPath)) continue;
    researchRecordCount += 1;
    const status = lstatSync(recordPath);
    if (!status.isFile() || status.isSymbolicLink()) continue;
    const parsed = parseDecision18FollowUpResearchRecordBytes(
      readFileSync(recordPath),
    );
    if (
      parsed.record !== null &&
      parsed.record.batchId === batchId &&
      parsed.record.caseSlug === caseSlug
    ) {
      existingCutoffs.add(parsed.record.auditCutoffDate);
    }
  }
  const auditCutoffDate =
    existingCutoffs.size === 1 ? [...existingCutoffs][0]! : today;
  if (existingCutoffs.size > 1) {
    issues.push({
      code: "decision18-batch-record-cutoff-mixed",
      path: definition.evidenceDirectory,
      message: `active-batch records must share one durable audit cutoff; found ${[...existingCutoffs].sort().join(", ")}`,
    });
  }
  if (!isValidIsoDate(auditCutoffDate)) {
    issues.push({
      code: "decision18-batch-record-cutoff-date",
      path: definition.evidenceDirectory,
      message: `audit cutoff is not a real calendar date: ${auditCutoffDate}`,
    });
  } else if (auditCutoffDate > today) {
    issues.push({
      code: "decision18-batch-record-cutoff-future",
      path: definition.evidenceDirectory,
      message: `existing audit cutoff ${auditCutoffDate} is later than today ${today}`,
    });
  }
  if (issues.length > 0) {
    unitProgress.push(...ambiguousCaseProgress(definition.membership[0]!));
    const progress = deriveDecision18BatchResumeProgress(batchId, unitProgress);
    issues.push(...progress.issues);
    return {
      auditCutoffDate,
      incompleteFindingCount,
      issues,
      ledgerCount: researchRecordCount,
      progress,
      researchRecordCount,
    };
  }

  for (const caseSlug of definition.membership) {
    const recordRelative = decision18ResearchRecordPath(
      definition.evidenceDirectory,
      caseSlug,
    );
    const recordPath = resolve(root, recordRelative);
    if (!existsSync(recordPath)) continue;
    const status = lstatSync(recordPath);
    if (!status.isFile() || status.isSymbolicLink()) {
      issues.push({
        code: "decision18-batch-partial-record-file",
        path: recordRelative,
        message: "partial research record must be a regular non-symlink file",
      });
      unitProgress.push(...ambiguousCaseProgress(caseSlug));
      continue;
    }
    const parsed = parseDecision18FollowUpResearchRecordBytes(
      readFileSync(recordPath),
    );
    if (parsed.record === null) {
      issues.push(...prefixIssues(recordRelative, parsed.issues));
      unitProgress.push(...ambiguousCaseProgress(caseSlug));
      continue;
    }
    if (
      parsed.record.batchId !== batchId ||
      parsed.record.caseSlug !== caseSlug ||
      parsed.record.auditCutoffDate !== auditCutoffDate
    ) {
      issues.push({
        code: "decision18-batch-partial-record-binding",
        path: recordRelative,
        message:
          "partial research record must bind the active batch, case, and audit cutoff",
      });
      unitProgress.push(...ambiguousCaseProgress(caseSlug));
      continue;
    }

    try {
      p0Bindings ??= loadResumeP0Bindings(root);
      const caseRelative = `src/content/cases/${caseSlug}.json`;
      const d17ResearchRelative = `research/follow-ups/decision-17/${caseSlug}.json`;
      const sidecarRelative = `src/content/follow-ups/${caseSlug}.json`;
      const caseRecord = caseSchema.parse(
        parseStrictJson(readFileSync(resolve(root, caseRelative), "utf8")),
      );
      const d17ResearchBytes = readFileSync(resolve(root, d17ResearchRelative));
      const d17Research = followUpResearchSchema.parse(
        parseStrictJson(d17ResearchBytes.toString("utf8")),
      );
      const caseBytes = readFileSync(resolve(root, caseRelative));
      const p0Case = p0Bindings.caseBySlug.get(caseSlug);
      const expectedD17ResearchSha256 =
        p0Bindings.d17ResearchSha256ByPath.get(d17ResearchRelative);
      const expectedD17SidecarSha256 =
        p0Bindings.sidecarSha256ByPath.get(sidecarRelative);
      if (
        p0Case === undefined ||
        p0Case.path !== caseRelative ||
        p0Case.fileSha256 !== sha256Hex(caseBytes) ||
        p0Case.clinicalDigest !== computeCaseContentDigest(caseRecord) ||
        expectedD17ResearchSha256 === undefined ||
        expectedD17ResearchSha256 !== sha256Hex(d17ResearchBytes) ||
        expectedD17SidecarSha256 === undefined
      ) {
        throw new Error(
          `immutable P0 case/Decision 17 bindings drifted for ${caseSlug}`,
        );
      }
      const d17Facts = Object.fromEntries(
        FOLLOW_UP_KINDS.map((kind) => [
          kind,
          d17Research.categories[kind].facts,
        ]),
      ) as Record<FollowUpKind, FollowUpResearchFact[]>;
      const initialSidecar = reconstructDecision17Sidecar(caseRecord, d17Facts);
      if (
        initialSidecar === null ||
        sha256Hex(canonicalJson(initialSidecar)) !== expectedD17SidecarSha256
      ) {
        throw new Error(
          `Decision 17 facts cannot reproduce the immutable initial sidecar for ${caseSlug}`,
        );
      }
      const generated = generateDecision18CaseArtifacts({
        auditCutoffDate,
        batchId,
        caseRecord,
        decision17Research: d17Research,
        decision17ResearchSha256: expectedD17ResearchSha256,
        decision17Sidecar: initialSidecar,
        decision17SidecarSha256: expectedD17SidecarSha256,
        expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
        researchRecord: parsed.record,
      });
      incompleteFindingCount += generated.issues.length;
      const globalIssues = generated.issues.filter(
        (entry) => issueFactKind(entry) === null,
      );
      if (globalIssues.length > 0) {
        issues.push(
          {
            code: "decision18-batch-partial-record-not-resume-safe",
            path: recordRelative,
            message: "partial research record has ambiguous replay state",
          },
          ...prefixIssues(recordRelative, globalIssues),
        );
        unitProgress.push(...ambiguousCaseProgress(caseSlug));
        continue;
      }
      for (const factKind of FOLLOW_UP_KINDS) {
        const unitIssues = generated.issues.filter(
          (entry) => issueFactKind(entry) === factKind,
        );
        const resumeSafe = unitIssues.every((entry) =>
          RESUME_SAFE_INCOMPLETE_CODES.has(entry.code),
        );
        if (!resumeSafe) {
          issues.push(
            {
              code: "decision18-batch-partial-record-not-resume-safe",
              path: `${recordRelative}.audits.${factKind}`,
              message: `partial ${factKind} audit has malformed or ambiguous replay state`,
            },
            ...prefixIssues(recordRelative, unitIssues),
          );
        }
        unitProgress.push({
          caseSlug,
          factKind,
          state: !resumeSafe
            ? "ambiguous"
            : unitIssues.length === 0
              ? "terminal"
              : "nonterminal",
        });
      }
    } catch (error) {
      issues.push({
        code: "decision18-batch-partial-record-baseline",
        path: recordRelative,
        message: error instanceof Error ? error.message : String(error),
      });
      unitProgress.push(...ambiguousCaseProgress(caseSlug));
    }
  }

  const progress = deriveDecision18BatchResumeProgress(batchId, unitProgress);
  issues.push(...progress.issues);
  return {
    auditCutoffDate,
    incompleteFindingCount,
    issues,
    ledgerCount: researchRecordCount,
    progress,
    researchRecordCount,
  };
}

function main(): void {
  const root = resolve(argumentValue("--root") ?? DEFAULT_ROOT);
  const now = parseNow();
  const chain = scanDecision18FollowUpBatchReceiptChain(
    readReceiptTexts(root),
    { now },
  );
  const issues: ValidationIssue[] = [...chain.issues];
  issues.push(
    ...validateDecision18CompletedBatchGitState(
      root,
      chain.completedBatchIds.map((batchId) => chain.receipts[batchId]!),
    ),
  );

  let dirtyPaths: string[] = [];
  let resumeProgress: ActiveBatchProgressResult | null = null;
  if (process.argv.includes("--resume")) {
    dirtyPaths = worktreePaths(root);
    issues.push(
      ...validateDecision18BatchDirtyPaths({
        activeBatchId: chain.activeBatchId,
        completedBatchIds: chain.completedBatchIds,
        dirtyPaths,
      }),
    );
    if (chain.issues.length === 0 && chain.activeBatchId !== null) {
      resumeProgress = inspectDecision18ActiveBatchProgress(
        root,
        chain.activeBatchId,
        now.toISOString().slice(0, 10),
      );
      issues.push(...resumeProgress.issues);
    }
  } else if (chain.activeBatchId === null && chain.issues.length === 0) {
    dirtyPaths = worktreePaths(root);
    issues.push(
      ...validateDecision18BatchDirtyPaths({
        activeBatchId: null,
        completedBatchIds: chain.completedBatchIds,
        dirtyPaths,
      }),
    );
  }

  process.stdout.write(
    `${canonicalJson({
      activeBatchId: chain.activeBatchId,
      activeBatchAuditCutoffDate: resumeProgress?.auditCutoffDate ?? null,
      completedBatchIds: chain.completedBatchIds,
      completedCaseCount: chain.completedCaseSlugs.length,
      dirtyPaths,
      incompleteFindingCount: resumeProgress?.incompleteFindingCount ?? 0,
      issueCount: issues.length,
      issues,
      nextUnit: resumeProgress?.progress.nextUnit ?? null,
      partialLedgerCount: resumeProgress?.ledgerCount ?? 0,
      partialResearchRecordCount: resumeProgress?.researchRecordCount ?? 0,
      receiptCount: chain.completedBatchIds.length,
      status:
        issues.length > 0
          ? "blocked"
          : chain.activeBatchId === null
            ? "complete"
            : "resumable",
      terminalUnitCount: resumeProgress?.progress.terminalUnitCount ?? 0,
      totalUnitCount: resumeProgress?.progress.totalUnitCount ?? 0,
    })}\n`,
  );
  if (issues.length > 0) process.exitCode = 1;
}

if (
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
