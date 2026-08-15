#!/usr/bin/env tsx

/** Deterministically builds one active D18 batch from per-case research records. */

import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildDecision18ResearchRecordScaffold,
  buildDecision18ProjectedSidecar,
  generateDecision18CaseArtifacts,
} from "../src/lib/cases/decision-18-follow-up-generation";
import {
  scanDecision18FollowUpBatchReceiptChain,
  validateDecision18BatchDirtyPaths,
  type Decision18BatchReceiptChainResult,
} from "../src/lib/cases/decision-18-follow-up-batch";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  parseFollowUpResearchBytes,
  type CaseFollowUp,
  type FollowUpKind,
  type FollowUpResearchFact,
} from "../src/lib/contracts/case-follow-up";
import { caseSchema, type InjuryCase } from "../src/lib/contracts/case";
import {
  CanonicalJsonError,
  canonicalJson,
  compareCodePoints,
  isValidIsoDate,
  issue,
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
import {
  decision18WorktreePaths,
  validateDecision18CompletedBatchGitState,
} from "./generate-decision-18-follow-up-batch-receipt";

const DEFAULT_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

export type Decision18CaseGenerationMode = "check" | "write";
export interface Decision18CaseGenerationCommandOptions {
  batchId: Decision18FollowUpBatchId;
  mode: Decision18CaseGenerationMode;
  now?: Date;
  root: string;
}
export interface Decision18CaseGenerationCommandResult {
  auditCutoffDate: string | null;
  batchId: Decision18FollowUpBatchId;
  changedPaths: string[];
  issues: ValidationIssue[];
  ledgerCount: number;
  mode: Decision18CaseGenerationMode;
  sidecarChangeCount: number;
  status: "checked" | "failed" | "written";
}

export interface Decision18ResearchScaffoldCommandOptions {
  auditCutoffDate: string;
  batchId: Decision18FollowUpBatchId;
  now?: Date;
  root: string;
}

export interface Decision18ResearchScaffoldCommandResult {
  auditCutoffDate: string;
  batchId: Decision18FollowUpBatchId;
  createdPaths: string[];
  issues: ValidationIssue[];
  preservedPathCount: number;
  status: "failed" | "initialized";
}

interface P0Snapshot {
  caseRows: Array<{
    caseId: string;
    clinicalDigest: string;
    fileSha256: string;
    path: string;
    slug: string;
  }>;
  decision17FollowUpBaseline: {
    sidecars: Array<{ caseId: string; path: string; sha256: string }>;
  };
  protectedFileBindings: Array<{ path: string; sha256: string }>;
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

function readRegular(
  root: string,
  path: string,
  issues: ValidationIssue[],
): Buffer | null {
  const absolute = resolve(root, path);
  if (!existsSync(absolute)) {
    issues.push(
      issue(
        "decision18-generation-input-missing",
        path,
        `required input is absent: ${path}`,
      ),
    );
    return null;
  }
  const status = lstatSync(absolute);
  if (!status.isFile() || status.isSymbolicLink()) {
    issues.push(
      issue(
        "decision18-generation-input-file",
        path,
        "input must be a regular non-symlink file",
      ),
    );
    return null;
  }
  return readFileSync(absolute);
}

function loadP0(root: string, issues: ValidationIssue[]): P0Snapshot | null {
  const bytes = readRegular(root, DECISION_18_P0_BASELINE_PATH, issues);
  if (bytes === null) return null;
  if (sha256Hex(bytes) !== DECISION_18_P0_BASELINE_SHA256) {
    issues.push(
      issue(
        "decision18-generation-p0-digest",
        DECISION_18_P0_BASELINE_PATH,
        "Phase 0 baseline evidence bytes drifted",
      ),
    );
    return null;
  }
  try {
    const text = bytes.toString("utf8");
    const parsed = parseStrictJson(text);
    if (canonicalJson(parsed) !== text) {
      issues.push(
        issue(
          "decision18-generation-p0-canonical",
          DECISION_18_P0_BASELINE_PATH,
          "Phase 0 baseline evidence must remain canonical JSON",
        ),
      );
      return null;
    }
    return parsed as P0Snapshot;
  } catch (error) {
    issues.push(
      issue(
        "decision18-generation-p0-parse",
        DECISION_18_P0_BASELINE_PATH,
        error instanceof CanonicalJsonError ? error.message : String(error),
      ),
    );
    return null;
  }
}

function receiptTexts(
  root: string,
): Partial<Record<Decision18FollowUpBatchId, string>> {
  const result: Partial<Record<Decision18FollowUpBatchId, string>> = {};
  for (const batchId of DECISION_18_FOLLOW_UP_BATCH_ORDER) {
    const path = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId].receiptPath;
    const absolute = resolve(root, path);
    if (existsSync(absolute)) result[batchId] = readFileSync(absolute, "utf8");
  }
  return result;
}

/**
 * Fail closed before any scaffold or generated-output write. Active-batch
 * working paths remain resumable, while unrelated dirt and every completed
 * predecessor mutation are rejected.
 */
function validateRepositoryMutationBoundary(
  root: string,
  chain: Decision18BatchReceiptChainResult,
): ValidationIssue[] {
  try {
    return [
      ...validateDecision18BatchDirtyPaths({
        activeBatchId: chain.activeBatchId,
        completedBatchIds: chain.completedBatchIds,
        dirtyPaths: decision18WorktreePaths(root),
      }),
      ...validateDecision18CompletedBatchGitState(
        root,
        chain.completedBatchIds.map((batchId) => chain.receipts[batchId]!),
      ),
    ];
  } catch (error) {
    return [
      issue(
        "decision18-generation-git",
        "worktree",
        error instanceof Error ? error.message : String(error),
      ),
    ];
  }
}

/**
 * Creates only nonterminal, per-case research scaffolds for the active batch.
 * Existing valid records are preserved byte-for-byte so initialization is
 * safely resumable and can never erase completed rounds.
 */
export function runDecision18ResearchScaffoldInitialization(
  options: Decision18ResearchScaffoldCommandOptions,
): Decision18ResearchScaffoldCommandResult {
  const issues: ValidationIssue[] = [];
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[options.batchId];
  const now = options.now ?? new Date();
  if (
    !isValidIsoDate(options.auditCutoffDate) ||
    options.auditCutoffDate > now.toISOString().slice(0, 10)
  ) {
    issues.push(
      issue(
        "decision18-scaffold-cutoff",
        "auditCutoffDate",
        "scaffold cutoff must be a real, non-future UTC calendar date",
      ),
    );
  }
  const chain = scanDecision18FollowUpBatchReceiptChain(
    receiptTexts(options.root),
    { now },
  );
  issues.push(...chain.issues);
  issues.push(...validateRepositoryMutationBoundary(options.root, chain));
  if (chain.activeBatchId !== options.batchId) {
    issues.push(
      issue(
        "decision18-scaffold-active-batch",
        "batchId",
        `requested batch ${options.batchId} is not the active batch ${chain.activeBatchId ?? "none"}`,
      ),
    );
  }
  const p0 = loadP0(options.root, issues);
  if (p0 === null) {
    return {
      auditCutoffDate: options.auditCutoffDate,
      batchId: options.batchId,
      createdPaths: [],
      issues,
      preservedPathCount: 0,
      status: "failed",
    };
  }

  const caseRows = new Map(p0.caseRows.map((row) => [row.slug, row]));
  const protectedFiles = new Map(
    p0.protectedFileBindings.map((row) => [row.path, row.sha256]),
  );
  const pendingWrites: Array<{ path: string; text: string }> = [];
  let preservedPathCount = 0;
  for (const caseSlug of definition.membership) {
    const targetPath = decision18ResearchRecordPath(
      definition.evidenceDirectory,
      caseSlug,
    );
    const targetAbsolute = resolve(options.root, targetPath);
    if (existsSync(targetAbsolute)) {
      const parsed = parseDecision18FollowUpResearchRecordBytes(
        readFileSync(targetAbsolute),
      );
      issues.push(...prefixIssues(targetPath, parsed.issues));
      if (
        parsed.record !== null &&
        (parsed.record.batchId !== options.batchId ||
          parsed.record.caseSlug !== caseSlug ||
          parsed.record.auditCutoffDate !== options.auditCutoffDate)
      ) {
        issues.push(
          issue(
            "decision18-scaffold-existing-binding",
            targetPath,
            "existing research record binds a different batch, case, or cutoff",
          ),
        );
      } else if (parsed.record !== null) {
        preservedPathCount += 1;
      }
      continue;
    }

    const casePath = `src/content/cases/${caseSlug}.json`;
    const d17Path = `research/follow-ups/decision-17/${caseSlug}.json`;
    const caseBytes = readRegular(options.root, casePath, issues);
    const d17Bytes = readRegular(options.root, d17Path, issues);
    if (caseBytes === null || d17Bytes === null) continue;
    let caseRecord: InjuryCase | null = null;
    try {
      caseRecord = caseSchema.parse(
        parseStrictJson(caseBytes.toString("utf8")),
      );
    } catch (error) {
      issues.push(
        issue(
          "decision18-scaffold-case-parse",
          casePath,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
    const d17 = parseFollowUpResearchBytes(d17Bytes);
    issues.push(...prefixIssues(d17Path, d17.issues));
    const p0Case = caseRows.get(caseSlug);
    const expectedD17Sha = protectedFiles.get(d17Path);
    if (
      caseRecord === null ||
      d17.research === null ||
      p0Case === undefined ||
      p0Case.caseId !== caseRecord?.id ||
      p0Case.path !== casePath ||
      p0Case.fileSha256 !== sha256Hex(caseBytes) ||
      expectedD17Sha === undefined ||
      expectedD17Sha !== sha256Hex(d17Bytes)
    ) {
      issues.push(
        issue(
          "decision18-scaffold-immutable-input",
          caseSlug,
          "case or Decision 17 bytes differ from the immutable Phase 0 baseline",
        ),
      );
      continue;
    }
    pendingWrites.push({
      path: targetPath,
      text: canonicalJson(
        buildDecision18ResearchRecordScaffold({
          auditCutoffDate: options.auditCutoffDate,
          batchId: options.batchId,
          caseRecord,
          decision17Research: d17.research,
        }),
      ),
    });
  }

  if (issues.length === 0) {
    try {
      for (const entry of pendingWrites) {
        writeAtomic(options.root, entry.path, entry.text);
      }
    } catch (error) {
      issues.push(
        issue(
          "decision18-scaffold-write",
          definition.evidenceDirectory,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
  return {
    auditCutoffDate: options.auditCutoffDate,
    batchId: options.batchId,
    createdPaths:
      issues.length === 0 ? pendingWrites.map(({ path }) => path) : [],
    issues,
    preservedPathCount,
    status: issues.length === 0 ? "initialized" : "failed",
  };
}

function reconstructDecision17Sidecar(
  record: InjuryCase,
  facts: Record<FollowUpKind, FollowUpResearchFact[]>,
): CaseFollowUp | null {
  const source = record.sources.filter((entry) =>
    entry.supports.includes("general.confirmedUpdate"),
  );
  if (source.length !== 1 || source[0]!.type !== "diagnosis-first-party") {
    return null;
  }
  const shell: CaseFollowUp = {
    schemaVersion: "case-follow-up.v1",
    caseId: record.id,
    caseClinicalDigest: "0".repeat(64),
    sourcePolicyBinding: { ...FOLLOW_UP_SOURCE_POLICY_V10_BINDING },
    legacyDiagnosisProjection: {
      field: "general.confirmedUpdate",
      sourceId: source[0]!.id,
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

function writeAtomic(root: string, path: string, text: string): void {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  if (existsSync(target)) {
    const status = lstatSync(target);
    if (!status.isFile() || status.isSymbolicLink()) {
      throw new Error(`refusing non-regular output ${path}`);
    }
  }
  const temporary = `${target}.tmp-${process.pid}`;
  let descriptor: number | null = null;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeFileSync(descriptor, text, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    renameSync(temporary, target);
  } finally {
    if (descriptor !== null) closeSync(descriptor);
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

/** Build/check/write one complete active batch; no other path can be written. */
export function runDecision18CaseGeneration(
  options: Decision18CaseGenerationCommandOptions,
): Decision18CaseGenerationCommandResult {
  const issues: ValidationIssue[] = [];
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[options.batchId];
  const chain = scanDecision18FollowUpBatchReceiptChain(
    receiptTexts(options.root),
    { now: options.now ?? new Date() },
  );
  issues.push(...chain.issues);
  issues.push(...validateRepositoryMutationBoundary(options.root, chain));
  if (chain.activeBatchId !== options.batchId) {
    issues.push(
      issue(
        "decision18-generation-active-batch",
        "batchId",
        `requested batch ${options.batchId} is not the active batch ${chain.activeBatchId ?? "none"}`,
      ),
    );
  }
  const p0 = loadP0(options.root, issues);
  if (p0 === null || issues.length > 0) {
    return {
      auditCutoffDate: null,
      batchId: options.batchId,
      changedPaths: [],
      issues,
      ledgerCount: 0,
      mode: options.mode,
      sidecarChangeCount: 0,
      status: "failed",
    };
  }

  const caseRows = new Map(p0.caseRows.map((row) => [row.slug, row]));
  const protectedFiles = new Map(
    p0.protectedFileBindings.map((row) => [row.path, row.sha256]),
  );
  const initialSidecars = new Map(
    p0.decision17FollowUpBaseline.sidecars.map((row) => [row.path, row]),
  );
  const prepared: Array<{
    ledgerPath: string;
    ledgerText: string;
    sidecarPath: string;
    sidecarText: string;
  }> = [];
  const cutoffs = new Set<string>();

  const evidenceRoot = resolve(options.root, definition.evidenceDirectory);
  if (existsSync(evidenceRoot)) {
    for (const name of readdirSync(evidenceRoot)) {
      if (!name.endsWith(".research-record.v1.json")) continue;
      const slug = name.slice(0, -".research-record.v1.json".length);
      if (!definition.membership.includes(slug as never)) {
        issues.push(
          issue(
            "decision18-generation-record-extra",
            `${definition.evidenceDirectory}${name}`,
            `research record is outside batch ${options.batchId}`,
          ),
        );
      }
    }
  }

  for (const caseSlug of definition.membership) {
    const recordPath = decision18ResearchRecordPath(
      definition.evidenceDirectory,
      caseSlug,
    );
    const casePath = `src/content/cases/${caseSlug}.json`;
    const d17Path = `research/follow-ups/decision-17/${caseSlug}.json`;
    const sidecarPath = `src/content/follow-ups/${caseSlug}.json`;
    const ledgerPath = `research/follow-ups/decision-18/cases/${caseSlug}.json`;
    const recordBytes = readRegular(options.root, recordPath, issues);
    const caseBytes = readRegular(options.root, casePath, issues);
    const d17Bytes = readRegular(options.root, d17Path, issues);
    if (recordBytes === null || caseBytes === null || d17Bytes === null)
      continue;

    const parsedRecord =
      parseDecision18FollowUpResearchRecordBytes(recordBytes);
    issues.push(...prefixIssues(recordPath, parsedRecord.issues));
    const parsedD17 = parseFollowUpResearchBytes(d17Bytes);
    issues.push(...prefixIssues(d17Path, parsedD17.issues));
    let caseRecord: InjuryCase | null = null;
    try {
      caseRecord = caseSchema.parse(
        parseStrictJson(caseBytes.toString("utf8")),
      );
    } catch (error) {
      issues.push(
        issue(
          "decision18-generation-case-parse",
          casePath,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
    if (
      parsedRecord.record === null ||
      parsedD17.research === null ||
      caseRecord === null
    ) {
      continue;
    }
    cutoffs.add(parsedRecord.record.auditCutoffDate);
    const p0Case = caseRows.get(caseSlug);
    const expectedD17Sha = protectedFiles.get(d17Path);
    const p0Sidecar = initialSidecars.get(sidecarPath);
    if (
      p0Case === undefined ||
      p0Case.caseId !== caseRecord.id ||
      p0Case.path !== casePath ||
      p0Case.fileSha256 !== sha256Hex(caseBytes) ||
      expectedD17Sha === undefined ||
      expectedD17Sha !== sha256Hex(d17Bytes) ||
      p0Sidecar === undefined ||
      p0Sidecar.caseId !== caseRecord.id
    ) {
      issues.push(
        issue(
          "decision18-generation-immutable-input",
          caseSlug,
          "case or Decision 17 bytes differ from the Phase 0 baseline",
        ),
      );
      continue;
    }
    const d17Facts = Object.fromEntries(
      FOLLOW_UP_KINDS.map((kind) => [
        kind,
        parsedD17.research!.categories[kind].facts,
      ]),
    ) as Record<FollowUpKind, FollowUpResearchFact[]>;
    const initialSidecar = reconstructDecision17Sidecar(caseRecord, d17Facts);
    if (
      initialSidecar === null ||
      sha256Hex(canonicalJson(initialSidecar)) !== p0Sidecar.sha256
    ) {
      issues.push(
        issue(
          "decision18-generation-sidecar-baseline",
          sidecarPath,
          "Decision 17 facts cannot reproduce the immutable initial sidecar",
        ),
      );
      continue;
    }
    const generated = generateDecision18CaseArtifacts({
      auditCutoffDate: parsedRecord.record.auditCutoffDate,
      batchId: options.batchId,
      caseRecord,
      decision17Research: parsedD17.research,
      decision17ResearchSha256: expectedD17Sha,
      decision17Sidecar: initialSidecar,
      decision17SidecarSha256: p0Sidecar.sha256,
      expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
      researchRecord: parsedRecord.record,
    });
    issues.push(...prefixIssues(caseSlug, generated.issues));
    if (generated.ledgerText !== null && generated.sidecarText !== null) {
      prepared.push({
        ledgerPath,
        ledgerText: generated.ledgerText,
        sidecarPath,
        sidecarText: generated.sidecarText,
      });
    }
  }

  if (cutoffs.size !== 1) {
    issues.push(
      issue(
        "decision18-generation-cutoff-consistency",
        definition.evidenceDirectory,
        "every case record in one batch must use the same audit cutoff date",
      ),
    );
  }
  if (prepared.length !== definition.membership.length) {
    issues.push(
      issue(
        "decision18-generation-batch-coverage",
        options.batchId,
        `expected ${definition.membership.length} generated cases, found ${prepared.length}`,
      ),
    );
  }
  if (issues.length > 0) {
    return {
      auditCutoffDate: cutoffs.size === 1 ? [...cutoffs][0]! : null,
      batchId: options.batchId,
      changedPaths: [],
      issues,
      ledgerCount: prepared.length,
      mode: options.mode,
      sidecarChangeCount: 0,
      status: "failed",
    };
  }

  const changedPaths: string[] = [];
  let sidecarChangeCount = 0;
  for (const artifact of prepared) {
    for (const [path, text, sidecar] of [
      [artifact.ledgerPath, artifact.ledgerText, false],
      [artifact.sidecarPath, artifact.sidecarText, true],
    ] as const) {
      const absolute = resolve(options.root, path);
      const matches =
        existsSync(absolute) && readFileSync(absolute, "utf8") === text;
      if (matches) continue;
      changedPaths.push(path);
      if (sidecar) sidecarChangeCount += 1;
      if (options.mode === "check") {
        issues.push(
          issue(
            "decision18-generation-output-drift",
            path,
            "generated output is absent or differs from the research record replay",
          ),
        );
      }
    }
  }
  changedPaths.sort(compareCodePoints);
  if (options.mode === "write" && issues.length === 0) {
    try {
      for (const artifact of prepared) {
        const ledgerAbsolute = resolve(options.root, artifact.ledgerPath);
        if (
          !existsSync(ledgerAbsolute) ||
          readFileSync(ledgerAbsolute, "utf8") !== artifact.ledgerText
        ) {
          writeAtomic(options.root, artifact.ledgerPath, artifact.ledgerText);
        }
        const sidecarAbsolute = resolve(options.root, artifact.sidecarPath);
        if (
          !existsSync(sidecarAbsolute) ||
          readFileSync(sidecarAbsolute, "utf8") !== artifact.sidecarText
        ) {
          writeAtomic(options.root, artifact.sidecarPath, artifact.sidecarText);
        }
      }
    } catch (error) {
      issues.push(
        issue(
          "decision18-generation-write",
          options.batchId,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
  return {
    auditCutoffDate: [...cutoffs][0]!,
    batchId: options.batchId,
    changedPaths,
    issues,
    ledgerCount: prepared.length,
    mode: options.mode,
    sidecarChangeCount,
    status:
      issues.length > 0
        ? "failed"
        : options.mode === "write"
          ? "written"
          : "checked",
  };
}

function argumentValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function main(): void {
  const batch = argumentValue("--batch");
  if (
    batch === null ||
    !DECISION_18_FOLLOW_UP_BATCH_ORDER.includes(
      batch as Decision18FollowUpBatchId,
    )
  ) {
    throw new Error("--batch must be acl, ankle, or achilles");
  }
  const check = process.argv.includes("--check");
  const write = process.argv.includes("--write");
  const init = process.argv.includes("--init");
  if (Number(check) + Number(write) + Number(init) !== 1)
    throw new Error("choose exactly one of --init, --check, or --write");
  if (init) {
    const auditCutoffDate = argumentValue("--audit-cutoff");
    if (auditCutoffDate === null) {
      throw new Error("--init requires --audit-cutoff YYYY-MM-DD");
    }
    const result = runDecision18ResearchScaffoldInitialization({
      auditCutoffDate,
      batchId: batch as Decision18FollowUpBatchId,
      now: new Date(),
      root: resolve(argumentValue("--root") ?? DEFAULT_ROOT),
    });
    process.stdout.write(`${canonicalJson(result)}\n`);
    if (result.issues.length > 0) process.exitCode = 1;
    return;
  }
  const result = runDecision18CaseGeneration({
    batchId: batch as Decision18FollowUpBatchId,
    mode: write ? "write" : "check",
    now: new Date(),
    root: resolve(argumentValue("--root") ?? DEFAULT_ROOT),
  });
  process.stdout.write(`${canonicalJson(result)}\n`);
  if (result.issues.length > 0) process.exitCode = 1;
}

if (
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
