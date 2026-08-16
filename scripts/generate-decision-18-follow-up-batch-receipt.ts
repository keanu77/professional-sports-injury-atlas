#!/usr/bin/env tsx

/**
 * Fail-closed generator/checker for one Decision 18 batch receipt. This tool
 * never creates research, sidecar, report, or evidence content. It only binds
 * an already-terminal active batch and may atomically create its absent
 * canonical receipt.
 */

import { execFileSync } from "node:child_process";
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
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  scanDecision18FollowUpBatchReceiptChain,
  validateDecision18BatchChangedPaths,
  validateDecision18BatchDirtyPaths,
  validateDecision18CompletedBatchDigests,
  type Decision18BatchReceiptChainResult,
  type Decision18BatchReceiptTexts,
} from "../src/lib/cases/decision-18-follow-up-batch";
import { validateDecision18ProjectedSidecar } from "../src/lib/cases/decision-18-transitional-follow-up-loader";
import { computeCaseContentDigest } from "../src/lib/cases/digest";
import {
  expectedFollowUpResearchV2SearchContextForCase,
  validateFollowUpResearchV2Record,
} from "../src/lib/cases/follow-up-research-v2-validation";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  parseCaseFollowUpBytes,
  parseFollowUpResearchBytes,
  type FollowUpKind,
  type FollowUpResearchFact,
} from "../src/lib/contracts/case-follow-up";
import { parseFollowUpResearchV2Bytes } from "../src/lib/contracts/case-follow-up-research-v2";
import { caseSchema, type InjuryCase } from "../src/lib/contracts/case";
import {
  CanonicalJsonError,
  canonicalJson,
  compareCodePoints,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "../src/lib/contracts/canonical";
import {
  DECISION_18_AUTHORIZATION_PATH,
  DECISION_18_AUTHORITY_BINDING,
  DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS,
  DECISION_18_FOLLOW_UP_BATCH_ORDER,
  DECISION_18_P0_BASELINE_PATH,
  DECISION_18_P0_BASELINE_SHA256,
  DECISION_18_PLAN_PATH,
  buildDecision18FollowUpBatchReceipt,
  canonicalDecision18FollowUpBatchReceiptText,
  parseDecision18FollowUpBatchReceiptText,
  type Decision18BatchArtifactDigest,
  type Decision18FollowUpBatchId,
  type Decision18FollowUpBatchReceipt,
  type ValidatedDecision18FollowUpBatchReceipt,
} from "../src/lib/contracts/decision-18-follow-up-batch";

const DEFAULT_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const CONVENTIONAL_COMMIT_RE =
  /^(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|test)(?:\([^)]+\))?!?: .+/u;

export type Decision18BatchReceiptCommandMode = "check" | "write";

export interface Decision18BatchReceiptCommandOptions {
  batchId: Decision18FollowUpBatchId;
  generatedAt: string;
  mode: Decision18BatchReceiptCommandMode;
  now?: Date;
  root: string;
}

export interface Decision18BatchReceiptCommandCounts {
  auditUnitCount: number;
  caseCount: number;
  evidenceFileCount: number;
  itemCount: number;
  itemCountsByKind: Record<FollowUpKind, number>;
  ledgerCount: number;
  sidecarCount: number;
}

export interface Decision18BatchReceiptCommandResult {
  batchId: Decision18FollowUpBatchId;
  counts: Decision18BatchReceiptCommandCounts;
  issues: ValidationIssue[];
  mode: Decision18BatchReceiptCommandMode;
  receiptPath: string;
  receiptSha256: string | null;
  receiptText: string | null;
  status: "checked" | "failed" | "written";
}

export interface Decision18BatchReceiptCommandChainSelection {
  candidateText: string | undefined;
  chain: Decision18BatchReceiptChainResult;
  issues: ValidationIssue[];
  validatedReceiptPredecessors: ValidatedDecision18FollowUpBatchReceipt[];
}

/**
 * Write selects only the first absent batch. Check validates the full receipt
 * chain and may select any already-completed batch, including one with valid
 * later successors.
 */
export function selectDecision18BatchReceiptCommandChain(
  receiptTexts: Decision18BatchReceiptTexts,
  batchId: Decision18FollowUpBatchId,
  mode: Decision18BatchReceiptCommandMode,
  now: Date,
): Decision18BatchReceiptCommandChainSelection {
  const chain = scanDecision18FollowUpBatchReceiptChain(receiptTexts, { now });
  const issues: ValidationIssue[] = [...chain.issues];
  const candidateText = receiptTexts[batchId];
  const requestedIndex = DECISION_18_FOLLOW_UP_BATCH_ORDER.indexOf(batchId);
  const predecessorIds = DECISION_18_FOLLOW_UP_BATCH_ORDER.slice(
    0,
    requestedIndex,
  );
  const validatedReceiptPredecessors = predecessorIds
    .map((predecessorId) => chain.receipts[predecessorId])
    .filter(
      (entry): entry is ValidatedDecision18FollowUpBatchReceipt =>
        entry !== undefined,
    );
  if (mode === "write" && chain.activeBatchId !== batchId) {
    issues.push(
      issue(
        "decision18-batch-command-not-active",
        "batchId",
        `requested batch ${batchId} is not the first absent active batch`,
      ),
    );
  }
  if (mode === "check" && !chain.completedBatchIds.includes(batchId)) {
    issues.push(
      issue(
        "decision18-batch-command-not-completed",
        "batchId",
        `requested batch ${batchId} is not in the valid completed receipt chain`,
      ),
    );
  }
  return {
    candidateText,
    chain,
    issues,
    validatedReceiptPredecessors,
  };
}

interface Decision18P0Snapshot {
  caseRows: Array<{
    caseId: string;
    clinicalDigest: string;
    fileSha256: string;
    path: string;
    slug: string;
  }>;
  decision17FollowUpBaseline: {
    sidecars: Array<{
      caseId: string;
      path: string;
      sha256: string;
    }>;
  };
  protectedFileBindings: Array<{ path: string; sha256: string }>;
}

interface BatchArtifactResult {
  counts: Decision18BatchReceiptCommandCounts;
  evidenceFiles: Decision18BatchArtifactDigest[];
  issues: ValidationIssue[];
  reviewReportSha256: string | null;
  sha256ByPath: Record<string, string>;
}

function emptyCounts(
  batchId: Decision18FollowUpBatchId,
): Decision18BatchReceiptCommandCounts {
  return {
    auditUnitCount:
      DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId].membership.length * 4,
    caseCount:
      DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId].membership.length,
    evidenceFileCount: 0,
    itemCount: 0,
    itemCountsByKind: {
      treatment: 0,
      surgery: 0,
      injection: 0,
      "actual-return": 0,
    },
    ledgerCount: 0,
    sidecarCount: 0,
  };
}

function prefixedIssues(
  prefix: string,
  issues: readonly ValidationIssue[],
): ValidationIssue[] {
  return issues.map((entry) => ({
    ...entry,
    path: entry.path === "" ? prefix : `${prefix}.${entry.path}`,
  }));
}

function readRegularFile(
  root: string,
  path: string,
  issues: ValidationIssue[],
): Buffer | null {
  const absolute = resolve(root, path);
  if (!existsSync(absolute)) {
    issues.push(
      issue(
        "decision18-batch-artifact-missing",
        path,
        `required artifact is absent: ${path}`,
      ),
    );
    return null;
  }
  const status = lstatSync(absolute);
  if (!status.isFile() || status.isSymbolicLink()) {
    issues.push(
      issue(
        "decision18-batch-artifact-file",
        path,
        `artifact must be a regular non-symlink file: ${path}`,
      ),
    );
    return null;
  }
  return readFileSync(absolute);
}

function parseP0Snapshot(
  root: string,
  issues: ValidationIssue[],
): Decision18P0Snapshot | null {
  const bytes = readRegularFile(root, DECISION_18_P0_BASELINE_PATH, issues);
  if (bytes === null) return null;
  if (sha256Hex(bytes) !== DECISION_18_P0_BASELINE_SHA256) {
    issues.push(
      issue(
        "decision18-batch-p0-baseline-digest",
        DECISION_18_P0_BASELINE_PATH,
        "Decision 18 P0 baseline evidence bytes drifted",
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
          "decision18-batch-p0-baseline-canonical",
          DECISION_18_P0_BASELINE_PATH,
          "Decision 18 P0 baseline evidence must remain canonical JSON",
        ),
      );
      return null;
    }
    return parsed as Decision18P0Snapshot;
  } catch (error) {
    issues.push(
      issue(
        "decision18-batch-p0-baseline-parse",
        DECISION_18_P0_BASELINE_PATH,
        error instanceof CanonicalJsonError ? error.message : String(error),
      ),
    );
    return null;
  }
}

function validateAuthorityAndPolicyBytes(
  root: string,
  issues: ValidationIssue[],
): void {
  const expected = [
    [DECISION_18_PLAN_PATH, DECISION_18_AUTHORITY_BINDING.planSha256],
    [
      DECISION_18_AUTHORIZATION_PATH,
      DECISION_18_AUTHORITY_BINDING.authorizationSha256,
    ],
    [
      FOLLOW_UP_SOURCE_POLICY_V10_BINDING.jsonPath,
      FOLLOW_UP_SOURCE_POLICY_V10_BINDING.jsonSha256,
    ],
    [
      FOLLOW_UP_SOURCE_POLICY_V10_BINDING.markdownPath,
      FOLLOW_UP_SOURCE_POLICY_V10_BINDING.markdownSha256,
    ],
  ] as const;
  for (const [path, expectedSha256] of expected) {
    const bytes = readRegularFile(root, path, issues);
    if (bytes !== null && sha256Hex(bytes) !== expectedSha256) {
      issues.push(
        issue(
          "decision18-batch-protected-binding-drift",
          path,
          `protected authority/policy bytes drifted: ${path}`,
        ),
      );
    }
  }
}

function readReceiptTexts(root: string): Decision18BatchReceiptTexts {
  const texts: Decision18BatchReceiptTexts = {};
  for (const batchId of DECISION_18_FOLLOW_UP_BATCH_ORDER) {
    const path = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId].receiptPath;
    const absolute = resolve(root, path);
    if (existsSync(absolute)) texts[batchId] = readFileSync(absolute, "utf8");
  }
  return texts;
}

function nulPaths(command: string, args: readonly string[]): string[] {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
    .split("\0")
    .filter((path) => path.length > 0);
}

/** Returns the complete staged, unstaged, and untracked repository path set. */
export function decision18WorktreePaths(root: string): string[] {
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

function gitLines(root: string, args: readonly string[]): string[] {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function receiptBoundDigests(
  receipt: Decision18FollowUpBatchReceipt,
): Array<{ path: string; sha256: string }> {
  return [
    ...receipt.researchLedgers.map(({ path, sha256 }) => ({ path, sha256 })),
    ...receipt.sidecars.map(({ path, sha256 }) => ({ path, sha256 })),
    receipt.reviewReport,
    ...receipt.evidenceFiles,
  ];
}

export function validateDecision18CompletedBatchGitState(
  root: string,
  receipts: readonly {
    receipt: Decision18FollowUpBatchReceipt;
    path: string;
  }[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const predecessor of receipts) {
    const measured: Record<string, string> = {};
    for (const binding of receiptBoundDigests(predecessor.receipt)) {
      const bytes = readRegularFile(root, binding.path, issues);
      if (bytes !== null) measured[binding.path] = sha256Hex(bytes);
    }
    issues.push(
      ...validateDecision18CompletedBatchDigests(predecessor.receipt, measured),
    );

    let introductionCommits: string[] = [];
    try {
      introductionCommits = gitLines(root, [
        "log",
        "--diff-filter=A",
        "--format=%H",
        "--",
        predecessor.path,
      ]);
    } catch (error) {
      issues.push(
        issue(
          "decision18-batch-predecessor-git",
          predecessor.path,
          error instanceof Error ? error.message : String(error),
        ),
      );
      continue;
    }
    if (introductionCommits.length !== 1) {
      issues.push(
        issue(
          "decision18-batch-predecessor-introduction",
          predecessor.path,
          "completed predecessor receipt must have exactly one introducing commit",
        ),
      );
      continue;
    }
    const commit = introductionCommits[0]!;
    try {
      execFileSync(
        "git",
        ["-C", root, "merge-base", "--is-ancestor", commit, "HEAD"],
        { stdio: "ignore" },
      );
      const subject = execFileSync(
        "git",
        ["-C", root, "show", "-s", "--format=%s", commit],
        { encoding: "utf8" },
      ).trim();
      if (!CONVENTIONAL_COMMIT_RE.test(subject)) {
        issues.push(
          issue(
            "decision18-batch-predecessor-commit-subject",
            predecessor.path,
            "predecessor receipt-introducing commit must be conventional",
          ),
        );
      }
      const changedPaths = nulPaths("git", [
        "-C",
        root,
        "diff-tree",
        "--root",
        "--no-commit-id",
        "--name-only",
        "-r",
        "-z",
        commit,
      ]);
      issues.push(
        ...prefixedIssues(
          predecessor.path,
          validateDecision18BatchChangedPaths(
            predecessor.receipt,
            changedPaths,
          ),
        ),
      );
      // Net content difference at HEAD, not mere commit touches: a change that
      // was reverted leaves the frozen bytes intact and is not a mutation of the
      // receipt-bound artifact. A real edit still shows up here.
      const laterMutations = gitLines(root, [
        "diff",
        "--name-only",
        commit,
        "HEAD",
        "--",
        ...predecessor.receipt.allowedPaths,
      ]);
      if (laterMutations.length > 0) {
        issues.push(
          issue(
            "decision18-batch-predecessor-later-mutation",
            predecessor.path,
            "a later commit touched a completed predecessor batch path",
          ),
        );
      }
    } catch (error) {
      issues.push(
        issue(
          "decision18-batch-predecessor-git",
          predecessor.path,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
  return issues;
}

function canonicalReportIssues(
  bytes: Buffer,
  batchId: Decision18FollowUpBatchId,
): ValidationIssue[] {
  const path = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId].reportPath;
  const issues: ValidationIssue[] = [];
  let text = "";
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return [
      issue(
        "decision18-batch-report-utf8",
        path,
        "batch report must be valid UTF-8",
      ),
    ];
  }
  if (
    text.startsWith("\uFEFF") ||
    text.includes("\r") ||
    text !== text.normalize("NFC") ||
    !text.endsWith("\n") ||
    text.endsWith("\n\n") ||
    text
      .slice(0, -1)
      .split("\n")
      .some((line) => /[\t ]$/u.test(line))
  ) {
    issues.push(
      issue(
        "decision18-batch-report-not-canonical",
        path,
        "report must be NFC UTF-8 with LF endings, no trailing whitespace, and one final newline",
      ),
    );
  }
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId];
  for (const caseSlug of definition.membership) {
    if (!text.includes(caseSlug)) {
      issues.push(
        issue(
          "decision18-batch-report-case-missing",
          path,
          `report does not name batch member ${caseSlug}`,
        ),
      );
    }
  }
  for (const factKind of FOLLOW_UP_KINDS) {
    if (!text.includes(factKind)) {
      issues.push(
        issue(
          "decision18-batch-report-kind-missing",
          path,
          `report does not name fact kind ${factKind}`,
        ),
      );
    }
  }
  return issues;
}

function enumerateEvidenceFiles(
  root: string,
  batchId: Decision18FollowUpBatchId,
  issues: ValidationIssue[],
): Decision18BatchArtifactDigest[] {
  const directory =
    DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId].evidenceDirectory;
  const absoluteDirectory = resolve(root, directory);
  if (!existsSync(absoluteDirectory)) return [];
  const rootStatus = lstatSync(absoluteDirectory);
  if (!rootStatus.isDirectory() || rootStatus.isSymbolicLink()) {
    issues.push(
      issue(
        "decision18-batch-evidence-directory",
        directory,
        "evidence root must be a regular non-symlink directory",
      ),
    );
    return [];
  }
  const files: Decision18BatchArtifactDigest[] = [];
  const visit = (current: string): void => {
    for (const name of readdirSync(current).sort(compareCodePoints)) {
      const absolute = join(current, name);
      const status = lstatSync(absolute);
      const path = relative(root, absolute).split("\\").join("/");
      if (status.isSymbolicLink()) {
        issues.push(
          issue(
            "decision18-batch-evidence-symlink",
            path,
            "evidence inventory rejects symlinks",
          ),
        );
      } else if (status.isDirectory()) {
        visit(absolute);
      } else if (status.isFile()) {
        files.push({ path, sha256: sha256Hex(readFileSync(absolute)) });
      } else {
        issues.push(
          issue(
            "decision18-batch-evidence-file",
            path,
            "evidence inventory accepts regular files only",
          ),
        );
      }
    }
  };
  visit(absoluteDirectory);
  return files.sort((left, right) => compareCodePoints(left.path, right.path));
}

function mapByPath(
  rows: readonly { path: string; sha256: string }[],
): Map<string, string> {
  return new Map(rows.map((row) => [row.path, row.sha256]));
}

function validateV2DirectoryMembership(
  root: string,
  allowedSlugs: ReadonlySet<string>,
  issues: ValidationIssue[],
): void {
  const directory = resolve(root, "research/follow-ups/decision-18/cases");
  if (!existsSync(directory)) return;
  for (const name of readdirSync(directory).sort(compareCodePoints)) {
    const path = `research/follow-ups/decision-18/cases/${name}`;
    const absolute = resolve(directory, name);
    const status = lstatSync(absolute);
    const slug = name.endsWith(".json") ? name.slice(0, -5) : "";
    if (
      !status.isFile() ||
      status.isSymbolicLink() ||
      slug.length === 0 ||
      !allowedSlugs.has(slug)
    ) {
      issues.push(
        issue(
          "decision18-batch-v2-path-out-of-order",
          path,
          "v2 case directory contains a non-member, later-batch, or non-file entry",
        ),
      );
    }
  }
}

function validateBatchArtifacts(
  root: string,
  batchId: Decision18FollowUpBatchId,
  auditCutoffDate: string,
  generatedAt: string,
  completedCaseSlugs: readonly string[],
  p0: Decision18P0Snapshot,
): BatchArtifactResult {
  const issues: ValidationIssue[] = [];
  const counts = emptyCounts(batchId);
  const sha256ByPath: Record<string, string> = {};
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId];
  const p0Cases = new Map(p0.caseRows.map((row) => [row.slug, row]));
  const p0Protected = mapByPath(p0.protectedFileBindings);
  const p0Sidecars = mapByPath(p0.decision17FollowUpBaseline.sidecars);
  const globalItemIds = new Set<string>();
  const globalEvidenceIds = new Set<string>();

  validateV2DirectoryMembership(
    root,
    new Set([...completedCaseSlugs, ...definition.membership]),
    issues,
  );

  for (const caseSlug of definition.membership) {
    const casePath = `src/content/cases/${caseSlug}.json`;
    const d17Path = `research/follow-ups/decision-17/${caseSlug}.json`;
    const sidecarPath = `src/content/follow-ups/${caseSlug}.json`;
    const v2Path = `research/follow-ups/decision-18/cases/${caseSlug}.json`;
    const caseBytes = readRegularFile(root, casePath, issues);
    const d17Bytes = readRegularFile(root, d17Path, issues);
    const sidecarBytes = readRegularFile(root, sidecarPath, issues);
    const v2Bytes = readRegularFile(root, v2Path, issues);
    if (
      caseBytes === null ||
      d17Bytes === null ||
      sidecarBytes === null ||
      v2Bytes === null
    ) {
      continue;
    }

    let caseRecord: InjuryCase;
    try {
      caseRecord = caseSchema.parse(
        parseStrictJson(caseBytes.toString("utf8")),
      );
    } catch (error) {
      issues.push(
        issue(
          "decision18-batch-case-parse",
          casePath,
          error instanceof Error ? error.message : String(error),
        ),
      );
      continue;
    }
    const p0Case = p0Cases.get(caseSlug);
    if (
      p0Case === undefined ||
      p0Case.path !== casePath ||
      p0Case.caseId !== caseRecord.id ||
      p0Case.fileSha256 !== sha256Hex(caseBytes) ||
      p0Case.clinicalDigest !== computeCaseContentDigest(caseRecord)
    ) {
      issues.push(
        issue(
          "decision18-batch-case-p0-binding",
          casePath,
          "case bytes/identity/clinical digest do not match the exact P0 baseline",
        ),
      );
    }

    const expectedD17Sha256 = p0Protected.get(d17Path);
    if (
      expectedD17Sha256 === undefined ||
      expectedD17Sha256 !== sha256Hex(d17Bytes)
    ) {
      issues.push(
        issue(
          "decision18-batch-d17-p0-binding",
          d17Path,
          "Decision 17 research bytes do not match the exact P0 baseline",
        ),
      );
    }
    const expectedP0SidecarSha256 = p0Sidecars.get(sidecarPath);
    if (expectedP0SidecarSha256 === undefined) {
      issues.push(
        issue(
          "decision18-batch-sidecar-p0-binding",
          sidecarPath,
          "P0 baseline does not contain the historical sidecar binding",
        ),
      );
    }

    const d17Parsed = parseFollowUpResearchBytes(d17Bytes);
    const sidecarParsed = parseCaseFollowUpBytes(sidecarBytes);
    const v2Parsed = parseFollowUpResearchV2Bytes(v2Bytes);
    issues.push(...prefixedIssues(d17Path, d17Parsed.issues));
    issues.push(...prefixedIssues(sidecarPath, sidecarParsed.issues));
    issues.push(...prefixedIssues(v2Path, v2Parsed.issues));
    if (
      d17Parsed.research === null ||
      sidecarParsed.sidecar === null ||
      v2Parsed.research === null ||
      expectedD17Sha256 === undefined ||
      expectedP0SidecarSha256 === undefined
    ) {
      continue;
    }

    const validation = validateFollowUpResearchV2Record(v2Parsed.research, {
      auditCutoffDate,
      expectedBaselineFacts: Object.fromEntries(
        FOLLOW_UP_KINDS.map((kind) => [
          kind,
          d17Parsed.research!.categories[kind].facts,
        ]),
      ),
      expectedCaseClinicalDigest: computeCaseContentDigest(caseRecord),
      expectedCaseId: caseRecord.id,
      expectedCaseSlug: caseSlug,
      expectedDecision17ResearchSha256: expectedD17Sha256,
      expectedDecision17SidecarSha256: expectedP0SidecarSha256,
      expectedSearchContext:
        expectedFollowUpResearchV2SearchContextForCase(caseRecord),
    });
    issues.push(...prefixedIssues(v2Path, validation.issues));
    if (!validation.terminal) {
      issues.push(
        issue(
          "decision18-batch-v2-not-terminal",
          v2Path,
          "all four audit units must derive terminal before receipt generation",
        ),
      );
    }
    for (const kind of FOLLOW_UP_KINDS) {
      for (const round of v2Parsed.research.audits[kind].rounds) {
        if (Date.parse(round.completedAt) > Date.parse(generatedAt)) {
          issues.push(
            issue(
              "decision18-batch-round-after-receipt",
              `${v2Path}.audits.${kind}.rounds.${round.roundNumber}`,
              "receipt generatedAt must not predate a completed research round",
            ),
          );
        }
      }
    }
    issues.push(
      ...prefixedIssues(
        sidecarPath,
        validateDecision18ProjectedSidecar(sidecarParsed.sidecar, {
          auditCutoffDate,
          caseRecord,
          expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
          projectedFactsByKind: validation.projectedFactsByKind,
        }),
      ),
    );

    for (const kind of FOLLOW_UP_KINDS) {
      const facts: readonly FollowUpResearchFact[] =
        validation.projectedFactsByKind[kind];
      counts.itemCountsByKind[kind] += facts.length;
      counts.itemCount += facts.length;
      for (const fact of facts) {
        if (globalItemIds.has(fact.itemId)) {
          issues.push(
            issue(
              "decision18-batch-item-id-duplicate",
              v2Path,
              `item ID is duplicated across the batch: ${fact.itemId}`,
            ),
          );
        }
        if (globalEvidenceIds.has(fact.evidenceId)) {
          issues.push(
            issue(
              "decision18-batch-evidence-id-duplicate",
              v2Path,
              `evidence ID is duplicated across the batch: ${fact.evidenceId}`,
            ),
          );
        }
        globalItemIds.add(fact.itemId);
        globalEvidenceIds.add(fact.evidenceId);
      }
    }
    counts.ledgerCount += 1;
    counts.sidecarCount += 1;
    sha256ByPath[v2Path] = sha256Hex(v2Bytes);
    sha256ByPath[sidecarPath] = sha256Hex(sidecarBytes);
  }

  const reportBytes = readRegularFile(root, definition.reportPath, issues);
  let reviewReportSha256: string | null = null;
  if (reportBytes !== null) {
    issues.push(...canonicalReportIssues(reportBytes, batchId));
    reviewReportSha256 = sha256Hex(reportBytes);
  }
  const evidenceFiles = enumerateEvidenceFiles(root, batchId, issues);
  counts.evidenceFileCount = evidenceFiles.length;
  return {
    counts,
    evidenceFiles,
    issues,
    reviewReportSha256,
    sha256ByPath,
  };
}

function atomicWriteNewReceipt(root: string, path: string, text: string): void {
  const target = resolve(root, path);
  if (existsSync(target)) {
    throw new Error(`refusing to overwrite existing receipt ${path}`);
  }
  const directory = dirname(target);
  mkdirSync(directory, { recursive: true });
  const temporary = join(
    directory,
    `.${basename(target)}.${process.pid}.${Date.now()}.tmp`,
  );
  let descriptor: number | null = null;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeFileSync(descriptor, text, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    if (readFileSync(temporary, "utf8") !== text) {
      throw new Error("temporary receipt verification failed");
    }
    renameSync(temporary, target);
  } finally {
    if (descriptor !== null) closeSync(descriptor);
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

export function runDecision18FollowUpBatchReceiptCommand(
  options: Decision18BatchReceiptCommandOptions,
): Decision18BatchReceiptCommandResult {
  const root = resolve(options.root);
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[options.batchId];
  const now = options.now ?? new Date();
  const issues: ValidationIssue[] = [];
  const receiptTexts = readReceiptTexts(root);
  const selection = selectDecision18BatchReceiptCommandChain(
    receiptTexts,
    options.batchId,
    options.mode,
    now,
  );
  const { candidateText, chain, validatedReceiptPredecessors } = selection;
  issues.push(...selection.issues);
  if (options.mode === "write" && candidateText !== undefined) {
    issues.push(
      issue(
        "decision18-batch-command-receipt-exists",
        definition.receiptPath,
        "write mode refuses to overwrite an existing receipt; use --check",
      ),
    );
  }
  if (options.mode === "check" && candidateText === undefined) {
    issues.push(
      issue(
        "decision18-batch-command-receipt-missing",
        definition.receiptPath,
        "check mode requires an existing candidate receipt",
      ),
    );
  }

  let commandDirtyPaths: string[] = [];
  try {
    commandDirtyPaths = decision18WorktreePaths(root);
    issues.push(
      ...validateDecision18BatchDirtyPaths({
        activeBatchId: chain.activeBatchId,
        completedBatchIds: chain.completedBatchIds,
        dirtyPaths: commandDirtyPaths,
      }),
    );
    issues.push(
      ...validateDecision18CompletedBatchGitState(
        root,
        chain.completedBatchIds.map((batchId) => chain.receipts[batchId]!),
      ),
    );
  } catch (error) {
    issues.push(
      issue(
        "decision18-batch-command-git",
        "worktree",
        error instanceof Error ? error.message : String(error),
      ),
    );
  }

  validateAuthorityAndPolicyBytes(root, issues);
  const p0 = parseP0Snapshot(root, issues);
  const auditCutoffDate = options.generatedAt.slice(0, 10);
  const artifacts =
    p0 === null
      ? {
          counts: emptyCounts(options.batchId),
          evidenceFiles: [],
          issues: [],
          reviewReportSha256: null,
          sha256ByPath: {},
        }
      : validateBatchArtifacts(
          root,
          options.batchId,
          auditCutoffDate,
          options.generatedAt,
          chain.completedCaseSlugs,
          p0,
        );
  issues.push(...artifacts.issues);

  let receiptText: string | null = null;
  let receiptSha256: string | null = null;
  if (artifacts.reviewReportSha256 !== null) {
    try {
      const receipt = buildDecision18FollowUpBatchReceipt({
        batchId: options.batchId,
        evidenceFiles: artifacts.evidenceFiles,
        generatedAt: options.generatedAt,
        reviewReportSha256: artifacts.reviewReportSha256,
        sha256ByPath: artifacts.sha256ByPath,
        validatedPredecessors: validatedReceiptPredecessors,
      });
      receiptText = canonicalDecision18FollowUpBatchReceiptText(receipt);
      receiptSha256 = sha256Hex(receiptText);
      const parsed = parseDecision18FollowUpBatchReceiptText(receiptText, {
        batchId: options.batchId,
        now,
        validatedPredecessors: validatedReceiptPredecessors,
      });
      issues.push(...parsed.issues);
    } catch (error) {
      issues.push(
        issue(
          "decision18-batch-command-build",
          definition.receiptPath,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  if (
    options.mode === "check" &&
    candidateText !== undefined &&
    receiptText !== null &&
    candidateText !== receiptText
  ) {
    issues.push(
      issue(
        "decision18-batch-command-receipt-mismatch",
        definition.receiptPath,
        "existing receipt bytes do not equal the freshly derived canonical receipt",
      ),
    );
  }
  if (options.mode === "check" && commandDirtyPaths.length > 0) {
    issues.push(
      issue(
        "decision18-batch-command-completed-worktree-dirty",
        "worktree",
        "check mode requires a clean completed-batch worktree",
      ),
    );
  }

  if (issues.length === 0 && options.mode === "write" && receiptText !== null) {
    try {
      atomicWriteNewReceipt(root, definition.receiptPath, receiptText);
    } catch (error) {
      issues.push(
        issue(
          "decision18-batch-command-write",
          definition.receiptPath,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  return {
    batchId: options.batchId,
    counts: artifacts.counts,
    issues,
    mode: options.mode,
    receiptPath: definition.receiptPath,
    receiptSha256,
    receiptText,
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
  const generatedAt = argumentValue("--generated-at");
  const check = process.argv.includes("--check");
  const write = process.argv.includes("--write");
  if (
    batch === null ||
    !DECISION_18_FOLLOW_UP_BATCH_ORDER.includes(
      batch as Decision18FollowUpBatchId,
    ) ||
    generatedAt === null ||
    check === write
  ) {
    throw new Error(
      "usage: --batch acl|ankle|achilles (--check|--write) --generated-at <UTC> [--root <path>] [--now <UTC>]",
    );
  }
  const nowValue = argumentValue("--now");
  const now = nowValue === null ? new Date() : new Date(nowValue);
  const result = runDecision18FollowUpBatchReceiptCommand({
    batchId: batch as Decision18FollowUpBatchId,
    generatedAt,
    mode: write ? "write" : "check",
    now,
    root: argumentValue("--root") ?? DEFAULT_ROOT,
  });
  process.stdout.write(`${canonicalJson(result)}\n`);
  if (result.status === "failed") process.exitCode = 1;
}

if (
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
