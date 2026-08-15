/** Pure ordered-receipt, path-isolation, and deterministic-resume helpers. */

import {
  FOLLOW_UP_KINDS,
  type FollowUpKind,
} from "../contracts/case-follow-up";
import {
  compareCodePoints,
  issue,
  type ValidationIssue,
} from "../contracts/canonical";
import {
  DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS,
  DECISION_18_FOLLOW_UP_BATCH_ORDER,
  expectedDecision18BatchResearchLedgers,
  parseDecision18FollowUpBatchReceiptText,
  type Decision18FollowUpBatchId,
  type Decision18FollowUpBatchReceipt,
  type ValidatedDecision18FollowUpBatchReceipt,
} from "../contracts/decision-18-follow-up-batch";

export type Decision18BatchReceiptTexts = Partial<
  Record<Decision18FollowUpBatchId, string>
>;

export interface Decision18BatchReceiptChainOptions {
  now: Date;
}

export interface Decision18BatchReceiptChainResult {
  activeBatchId: Decision18FollowUpBatchId | null;
  auditCutoffByCaseSlug: Readonly<Record<string, string>>;
  completedBatchIds: readonly Decision18FollowUpBatchId[];
  completedCaseSlugs: readonly string[];
  issues: readonly ValidationIssue[];
  receipts: Readonly<
    Partial<
      Record<Decision18FollowUpBatchId, ValidatedDecision18FollowUpBatchReceipt>
    >
  >;
}

function prefixedIssues(
  batchId: Decision18FollowUpBatchId,
  issues: readonly ValidationIssue[],
): ValidationIssue[] {
  return issues.map((entry) => ({
    ...entry,
    path:
      entry.path === ""
        ? `batches.${batchId}`
        : `batches.${batchId}.${entry.path}`,
  }));
}

/**
 * Validates only a contiguous ACL -> ankle -> Achilles receipt prefix. A gap,
 * a later receipt after a gap, or any invalid existing receipt is fail-closed
 * and therefore has no active/resumable batch.
 */
export function scanDecision18FollowUpBatchReceiptChain(
  receiptTexts: Decision18BatchReceiptTexts,
  options: Decision18BatchReceiptChainOptions,
): Decision18BatchReceiptChainResult {
  const issues: ValidationIssue[] = [];
  const receipts: Partial<
    Record<Decision18FollowUpBatchId, ValidatedDecision18FollowUpBatchReceipt>
  > = {};
  const completedBatchIds: Decision18FollowUpBatchId[] = [];
  const completedCaseSlugs: string[] = [];
  const auditCutoffByCaseSlug: Record<string, string> = {};

  let firstAbsentBatchId: Decision18FollowUpBatchId | null = null;
  for (const batchId of DECISION_18_FOLLOW_UP_BATCH_ORDER) {
    const text = receiptTexts[batchId];
    if (text === undefined) {
      firstAbsentBatchId ??= batchId;
    } else if (firstAbsentBatchId !== null) {
      issues.push(
        issue(
          "decision18-batch-receipt-noncontiguous",
          `batches.${batchId}`,
          `receipt ${batchId} exists after absent receipt ${firstAbsentBatchId}`,
        ),
      );
    }
  }

  for (const batchId of DECISION_18_FOLLOW_UP_BATCH_ORDER) {
    const text = receiptTexts[batchId];
    if (text === undefined) break;
    const parsed = parseDecision18FollowUpBatchReceiptText(text, {
      batchId,
      now: options.now,
      validatedPredecessors: completedBatchIds.map(
        (completedBatchId) => receipts[completedBatchId]!,
      ),
    });
    if (parsed.receipt === null) {
      issues.push(...prefixedIssues(batchId, parsed.issues));
      break;
    }
    const validated: ValidatedDecision18FollowUpBatchReceipt = {
      batchId,
      path: DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId].receiptPath,
      receipt: parsed.receipt,
      receiptDigest: parsed.receiptDigest,
    };
    receipts[batchId] = validated;
    completedBatchIds.push(batchId);
    for (const caseSlug of parsed.receipt.membership) {
      completedCaseSlugs.push(caseSlug);
      auditCutoffByCaseSlug[caseSlug] = parsed.receipt.auditCutoffDate;
    }
  }

  return {
    activeBatchId: issues.length === 0 ? (firstAbsentBatchId ?? null) : null,
    auditCutoffByCaseSlug,
    completedBatchIds,
    completedCaseSlugs,
    issues,
    receipts,
  };
}

function isNormalizedRepositoryPath(path: string): boolean {
  return (
    path.length > 0 &&
    path === path.trim() &&
    !path.startsWith("/") &&
    !path.endsWith("/") &&
    !path.includes("\\") &&
    !path.split("/").some((segment) => segment === "" || segment === "..")
  );
}

/** Working batches may add bounded evidence files before a receipt exists. */
export function isDecision18BatchWorkingPathAllowed(
  batchId: Decision18FollowUpBatchId,
  path: string,
): boolean {
  if (!isNormalizedRepositoryPath(path)) return false;
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId];
  return (
    expectedDecision18BatchResearchLedgers(batchId).some(
      (entry) => entry.path === path,
    ) ||
    definition.membership.some(
      (caseSlug) => path === `src/content/follow-ups/${caseSlug}.json`,
    ) ||
    path === definition.receiptPath ||
    path === definition.reportPath ||
    path.startsWith(definition.evidenceDirectory)
  );
}

function batchOwningWorkingPath(
  path: string,
): Decision18FollowUpBatchId | null {
  return (
    DECISION_18_FOLLOW_UP_BATCH_ORDER.find((batchId) =>
      isDecision18BatchWorkingPathAllowed(batchId, path),
    ) ?? null
  );
}

function isContiguousCompletedPrefix(
  completedBatchIds: readonly Decision18FollowUpBatchId[],
): boolean {
  return completedBatchIds.every(
    (batchId, index) => batchId === DECISION_18_FOLLOW_UP_BATCH_ORDER[index],
  );
}

export interface Decision18BatchDirtyPathOptions {
  activeBatchId: Decision18FollowUpBatchId | null;
  completedBatchIds: readonly Decision18FollowUpBatchId[];
  dirtyPaths: readonly string[];
}

/**
 * Enforces clean-start semantics or the active batch's bounded worktree. Any
 * completed-batch mutation gets a dedicated immutable-input error.
 */
export function validateDecision18BatchDirtyPaths(
  options: Decision18BatchDirtyPathOptions,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isContiguousCompletedPrefix(options.completedBatchIds)) {
    issues.push(
      issue(
        "decision18-batch-completed-order",
        "completedBatchIds",
        "completed batches must be the exact contiguous ACL-to-Achilles prefix",
      ),
    );
  }
  const expectedActive =
    DECISION_18_FOLLOW_UP_BATCH_ORDER[options.completedBatchIds.length] ?? null;
  if (options.activeBatchId !== expectedActive) {
    issues.push(
      issue(
        "decision18-batch-active-order",
        "activeBatchId",
        `active batch must be ${expectedActive ?? "null after all batches"}`,
      ),
    );
  }
  if (new Set(options.dirtyPaths).size !== options.dirtyPaths.length) {
    issues.push(
      issue(
        "decision18-batch-dirty-path-duplicate",
        "dirtyPaths",
        "dirty path inventory must not contain duplicates",
      ),
    );
  }
  for (const [index, path] of options.dirtyPaths.entries()) {
    const owner = batchOwningWorkingPath(path);
    if (owner !== null && options.completedBatchIds.includes(owner)) {
      issues.push(
        issue(
          "decision18-batch-completed-path-mutation",
          `dirtyPaths.${index}`,
          `completed batch ${owner} path must remain immutable: ${path}`,
        ),
      );
    } else if (
      options.activeBatchId === null ||
      !isDecision18BatchWorkingPathAllowed(options.activeBatchId, path)
    ) {
      issues.push(
        issue(
          "decision18-batch-dirty-path-outside-allowlist",
          `dirtyPaths.${index}`,
          `dirty path is outside the active batch allowlist: ${path}`,
        ),
      );
    }
  }
  return issues;
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

/** Re-hashes completed-batch inputs read-only and reports missing/drifted data. */
export function validateDecision18CompletedBatchDigests(
  receipt: Decision18FollowUpBatchReceipt,
  measuredSha256ByPath: Readonly<Record<string, string>>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [index, expected] of receiptBoundDigests(receipt).entries()) {
    const measured = measuredSha256ByPath[expected.path];
    if (measured === undefined) {
      issues.push(
        issue(
          "decision18-batch-completed-file-missing",
          `boundFiles.${index}`,
          `completed batch file is missing: ${expected.path}`,
        ),
      );
    } else if (measured !== expected.sha256) {
      issues.push(
        issue(
          "decision18-batch-completed-digest-drift",
          `boundFiles.${index}`,
          `completed batch file digest drifted: ${expected.path}`,
        ),
      );
    }
  }
  return issues;
}

/**
 * Checks a receipt-introducing commit's path list. All ledgers, the report,
 * receipt, and declared evidence must be introduced; unchanged sidecars may
 * correctly be absent from the commit.
 */
export function validateDecision18BatchChangedPaths(
  receipt: Decision18FollowUpBatchReceipt,
  changedPaths: readonly string[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const allowed = new Set(receipt.allowedPaths);
  const changed = new Set(changedPaths);
  if (changed.size !== changedPaths.length) {
    issues.push(
      issue(
        "decision18-batch-commit-path-duplicate",
        "changedPaths",
        "commit path inventory must not contain duplicates",
      ),
    );
  }
  for (const [index, path] of changedPaths.entries()) {
    if (!isNormalizedRepositoryPath(path) || !allowed.has(path)) {
      issues.push(
        issue(
          "decision18-batch-commit-path-outside-allowlist",
          `changedPaths.${index}`,
          `commit path is outside the receipt allowlist: ${path}`,
        ),
      );
    }
  }
  const receiptPath =
    DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[receipt.batchId].receiptPath;
  const requiredPaths = [
    ...receipt.researchLedgers.map((entry) => entry.path),
    receipt.reviewReport.path,
    receiptPath,
    ...receipt.evidenceFiles.map((entry) => entry.path),
  ];
  for (const path of requiredPaths) {
    if (!changed.has(path)) {
      issues.push(
        issue(
          "decision18-batch-required-commit-path-missing",
          "changedPaths",
          `receipt-introducing commit must include ${path}`,
        ),
      );
    }
  }
  return issues;
}

export const DECISION_18_RESUME_FACT_KIND_ORDER = Object.freeze(
  [...FOLLOW_UP_KINDS].sort(compareCodePoints),
) as readonly FollowUpKind[];

export const DECISION_18_AUDIT_UNIT_STATES = [
  "terminal",
  "nonterminal",
  "ambiguous",
] as const;
export type Decision18AuditUnitState =
  (typeof DECISION_18_AUDIT_UNIT_STATES)[number];

export interface Decision18AuditUnitProgress {
  caseSlug: string;
  factKind: FollowUpKind;
  state: Decision18AuditUnitState;
}

export interface Decision18AuditUnitKey {
  caseSlug: string;
  factKind: FollowUpKind;
}

export interface Decision18BatchResumeProgress {
  issues: readonly ValidationIssue[];
  nextUnit: Decision18AuditUnitKey | null;
  terminalUnitCount: number;
  totalUnitCount: number;
}

function auditUnitKey(caseSlug: string, factKind: FollowUpKind): string {
  return `${caseSlug}\u0000${factKind}`;
}

/**
 * Missing or explicit nonterminal units are resumable. Ambiguous units stop;
 * otherwise the first code-point-lexicographic pair is returned.
 */
export function deriveDecision18BatchResumeProgress(
  batchId: Decision18FollowUpBatchId,
  progress: readonly Decision18AuditUnitProgress[],
): Decision18BatchResumeProgress {
  const issues: ValidationIssue[] = [];
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId];
  const membership = new Set(definition.membership);
  const kindSet = new Set<string>(FOLLOW_UP_KINDS);
  const stateSet = new Set<string>(DECISION_18_AUDIT_UNIT_STATES);
  const progressByKey = new Map<string, Decision18AuditUnitProgress>();
  for (const [index, entry] of progress.entries()) {
    const path = `progress.${index}`;
    if (!membership.has(entry.caseSlug)) {
      issues.push(
        issue(
          "decision18-batch-progress-case",
          `${path}.caseSlug`,
          `${entry.caseSlug} is not a member of batch ${batchId}`,
        ),
      );
    }
    if (!kindSet.has(entry.factKind)) {
      issues.push(
        issue(
          "decision18-batch-progress-kind",
          `${path}.factKind`,
          `${entry.factKind} is not a Decision 18 fact kind`,
        ),
      );
    }
    if (!stateSet.has(entry.state)) {
      issues.push(
        issue(
          "decision18-batch-progress-state",
          `${path}.state`,
          `${String(entry.state)} is not a recognized audit-unit state`,
        ),
      );
    }
    const key = auditUnitKey(entry.caseSlug, entry.factKind);
    if (progressByKey.has(key)) {
      issues.push(
        issue(
          "decision18-batch-progress-duplicate",
          path,
          `duplicate audit-unit progress for ${entry.caseSlug}/${entry.factKind}`,
        ),
      );
    } else {
      progressByKey.set(key, entry);
    }
    if (entry.state === "ambiguous") {
      issues.push(
        issue(
          "decision18-batch-progress-ambiguous",
          `${path}.state`,
          `ambiguous partial audit unit must be corrected before resume: ${entry.caseSlug}/${entry.factKind}`,
        ),
      );
    }
  }

  const expectedUnits: Decision18AuditUnitKey[] = definition.membership
    .flatMap((caseSlug) =>
      DECISION_18_RESUME_FACT_KIND_ORDER.map((factKind) => ({
        caseSlug,
        factKind,
      })),
    )
    .sort(
      (left, right) =>
        compareCodePoints(left.caseSlug, right.caseSlug) ||
        compareCodePoints(left.factKind, right.factKind),
    );
  const terminalUnitCount = expectedUnits.filter(
    (unit) =>
      progressByKey.get(auditUnitKey(unit.caseSlug, unit.factKind))?.state ===
      "terminal",
  ).length;
  const nextUnit =
    issues.length === 0
      ? (expectedUnits.find(
          (unit) =>
            progressByKey.get(auditUnitKey(unit.caseSlug, unit.factKind))
              ?.state !== "terminal",
        ) ?? null)
      : null;
  return {
    issues,
    nextUnit,
    terminalUnitCount,
    totalUnitCount: expectedUnits.length,
  };
}
