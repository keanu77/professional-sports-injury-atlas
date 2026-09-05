/** Concrete Decision 18 receipt/v2 adapter for the transitional corpus loader. */

import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { computeCaseContentDigest } from "./digest";
import {
  scanDecision18FollowUpBatchReceiptChain,
  validateDecision18BatchChangedPaths,
  validateDecision18BatchDirtyPaths,
  validateDecision18CompletedBatchDigests,
} from "./decision-18-follow-up-batch";
import {
  loadTransitionalFollowUpCorpus,
  validateDecision18ProjectedSidecar,
  type LoadedTransitionalFollowUpCorpus,
  type TransitionalCompletedBatchReceipt,
  type TransitionalFollowUpAdapters,
} from "./decision-18-transitional-follow-up-loader";
import {
  expectedFollowUpResearchV2SearchContextForCase,
  validateFollowUpResearchV2Record,
  type FollowUpResearchV2ValidationResult,
} from "./follow-up-research-v2-validation";
import type { InjuryCase } from "../contracts/case";
import {
  type FollowUpKind,
  type FollowUpResearch,
  type FollowUpResearchFact,
  type FollowUpSourcePolicyBinding,
} from "../contracts/case-follow-up";
import {
  parseFollowUpResearchV2Bytes,
  type FollowUpResearchV2,
} from "../contracts/case-follow-up-research-v2";
import {
  canonicalJson,
  compareCodePoints,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "../contracts/canonical";
import {
  DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS,
  DECISION_18_FOLLOW_UP_BATCH_ORDER,
  type Decision18FollowUpBatchId,
  type ValidatedDecision18FollowUpBatchReceipt,
} from "../contracts/decision-18-follow-up-batch";

export const DECISION_18_P0_AUTHORIZED_BASELINE_PATH =
  "docs/reviews/evidence/decision-18/p0/authorized-start-baseline.v1.json" as const;
export const DECISION_18_P0_AUTHORIZED_BASELINE_SHA256 =
  "fa541c8a2c1fd476e41f0820fc40440f6d16fb2b1990cd14dc25053fef32c992" as const;

export interface LoadDecision18TransitionalFollowUpCorpusOptions {
  expectedPolicyBinding: FollowUpSourcePolicyBinding;
  expectedCaseCount?: number;
  /** Injectable only so isolated temp-root tests need not own a real Git repo. */
  gitInspection?: Decision18CompletedReceiptGitInspection;
  now?: Date;
}

export interface Decision18CompletedReceiptGitInspection {
  commitChangedPaths: (root: string, commit: string) => readonly string[];
  commitSubject: (root: string, commit: string) => string;
  introductionCommits: (root: string, receiptPath: string) => readonly string[];
  isAncestorOfHead: (root: string, commit: string) => boolean;
  laterCommitsTouchingPaths: (
    root: string,
    commit: string,
    paths: readonly string[],
  ) => readonly string[];
  worktreePaths: (root: string) => readonly string[];
}

type Decision18TransitionalCorpus = LoadedTransitionalFollowUpCorpus<
  Decision18FollowUpBatchId,
  FollowUpResearchV2
>;

interface Decision17BaselineResult {
  issues: ValidationIssue[];
  researchSha256BySlug: ReadonlyMap<string, string>;
  sidecarSha256BySlug: ReadonlyMap<string, string>;
}

const CONVENTIONAL_COMMIT_RE =
  /^(?:build|chore|ci|docs|feat|fix|perf|refactor|revert|test)(?:\([^)]+\))?!?: .+/u;

function nulGitPaths(root: string, args: readonly string[]): string[] {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
    .split("\0")
    .filter((path) => path.length > 0);
}

function gitLines(root: string, args: readonly string[]): string[] {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

const NODE_GIT_INSPECTION: Decision18CompletedReceiptGitInspection = {
  worktreePaths: (root) =>
    [
      ...nulGitPaths(root, [
        "diff",
        "--name-only",
        "-z",
        "--diff-filter=ACDMRTUXB",
      ]),
      ...nulGitPaths(root, [
        "diff",
        "--cached",
        "--name-only",
        "-z",
        "--diff-filter=ACDMRTUXB",
      ]),
      ...nulGitPaths(root, [
        "ls-files",
        "--others",
        "--exclude-standard",
        "-z",
      ]),
    ].filter((path, index, all) => all.indexOf(path) === index),
  introductionCommits: (root, receiptPath) =>
    gitLines(root, [
      "log",
      "--diff-filter=A",
      "--format=%H",
      "--",
      receiptPath,
    ]),
  isAncestorOfHead: (root, commit) => {
    try {
      execFileSync(
        "git",
        ["-C", root, "merge-base", "--is-ancestor", commit, "HEAD"],
        { stdio: ["ignore", "pipe", "pipe"] },
      );
      return true;
    } catch {
      return false;
    }
  },
  commitSubject: (root, commit) =>
    execFileSync("git", ["-C", root, "show", "-s", "--format=%s", commit], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim(),
  commitChangedPaths: (root, commit) =>
    nulGitPaths(root, [
      "diff-tree",
      "--root",
      "--no-commit-id",
      "--name-only",
      "-r",
      "-z",
      commit,
    ]),
  // Net content difference at HEAD rather than commit touches: a change that
  // was reverted leaves the receipt-bound bytes intact, so it is not a mutation.
  // A real edit still surfaces here.
  laterCommitsTouchingPaths: (root, commit, paths) =>
    gitLines(root, ["diff", "--name-only", commit, "HEAD", "--", ...paths]),
};

function prefixIssues(
  prefix: string,
  issues: readonly ValidationIssue[],
): ValidationIssue[] {
  return issues.map((entry) => ({
    ...entry,
    path: entry.path === "" ? prefix : `${prefix}.${entry.path}`,
  }));
}

function readCompletedBoundFile(
  root: string,
  path: string,
  issues: ValidationIssue[],
): Buffer | null {
  const absolute = join(root, path);
  if (!existsSync(absolute)) {
    issues.push(
      issue(
        "follow-up-transition-completed-file-missing",
        path,
        `completed receipt-bound artifact is absent: ${path}`,
      ),
    );
    return null;
  }
  const status = lstatSync(absolute);
  if (!status.isFile() || status.isSymbolicLink()) {
    issues.push(
      issue(
        "follow-up-transition-completed-file-type",
        path,
        `completed receipt-bound artifact must be a regular non-symlink file: ${path}`,
      ),
    );
    return null;
  }
  return readFileSync(absolute);
}

/**
 * Production gate for adopting completed receipts. This is intentionally
 * stronger than schema validity: current bytes, receipt-chain bytes, bounded
 * active-batch dirt, and the unique immutable receipt-introducing commit must
 * all agree. First-absent active-batch paths may be in progress; completed and
 * unrelated paths may not be dirty.
 */
export function validateDecision18CompletedReceiptProvenance(
  root: string,
  receipts: readonly ValidatedDecision18FollowUpBatchReceipt[],
  git: Decision18CompletedReceiptGitInspection = NODE_GIT_INSPECTION,
): ValidationIssue[] {
  if (receipts.length === 0) return [];
  const issues: ValidationIssue[] = [];
  try {
    const dirtyPaths = git.worktreePaths(root);
    const completedBatchIds = receipts.map((entry) => entry.batchId);
    const activeBatchId =
      DECISION_18_FOLLOW_UP_BATCH_ORDER[completedBatchIds.length] ?? null;
    issues.push(
      ...prefixIssues(
        "worktree",
        validateDecision18BatchDirtyPaths({
          activeBatchId,
          completedBatchIds,
          dirtyPaths,
        }),
      ),
    );
  } catch (error) {
    issues.push(
      issue(
        "follow-up-transition-completed-git",
        "worktree",
        error instanceof Error ? error.message : String(error),
      ),
    );
  }

  for (const [receiptIndex, validated] of receipts.entries()) {
    const prefix = `receipts.${receiptIndex}`;
    const measured: Record<string, string> = {};
    const bound = [
      ...validated.receipt.researchLedgers,
      ...validated.receipt.sidecars,
      validated.receipt.reviewReport,
      ...validated.receipt.evidenceFiles,
    ];
    for (const binding of bound) {
      const bytes = readCompletedBoundFile(root, binding.path, issues);
      if (bytes !== null) measured[binding.path] = sha256Hex(bytes);
    }
    issues.push(
      ...prefixIssues(
        prefix,
        validateDecision18CompletedBatchDigests(validated.receipt, measured),
      ),
    );

    const receiptBytes = readCompletedBoundFile(root, validated.path, issues);
    if (
      receiptBytes !== null &&
      sha256Hex(receiptBytes) !== validated.receiptDigest
    ) {
      issues.push(
        issue(
          "follow-up-transition-completed-receipt-digest",
          validated.path,
          "completed receipt bytes differ from the validated receipt-chain digest",
        ),
      );
    }
    for (const predecessor of validated.receipt.predecessorReceipts) {
      const actual = receipts.find(
        (candidate) => candidate.batchId === predecessor.batchId,
      );
      if (
        actual === undefined ||
        actual.path !== predecessor.path ||
        actual.receiptDigest !== predecessor.sha256
      ) {
        issues.push(
          issue(
            "follow-up-transition-completed-receipt-chain",
            validated.path,
            `receipt predecessor binding is not the revalidated chain entry for ${predecessor.batchId}`,
          ),
        );
      }
    }

    try {
      const introductions = git.introductionCommits(root, validated.path);
      if (introductions.length !== 1) {
        issues.push(
          issue(
            "follow-up-transition-completed-introduction",
            validated.path,
            "completed receipt must have exactly one reachable introducing commit",
          ),
        );
        continue;
      }
      const commit = introductions[0]!;
      if (!git.isAncestorOfHead(root, commit)) {
        issues.push(
          issue(
            "follow-up-transition-completed-unreachable",
            validated.path,
            "receipt-introducing commit must be an ancestor of HEAD",
          ),
        );
      }
      if (!CONVENTIONAL_COMMIT_RE.test(git.commitSubject(root, commit))) {
        issues.push(
          issue(
            "follow-up-transition-completed-commit-subject",
            validated.path,
            "receipt-introducing commit must use a conventional subject",
          ),
        );
      }
      issues.push(
        ...prefixIssues(
          prefix,
          validateDecision18BatchChangedPaths(
            validated.receipt,
            git.commitChangedPaths(root, commit),
          ),
        ),
      );
      if (
        git.laterCommitsTouchingPaths(
          root,
          commit,
          validated.receipt.allowedPaths,
        ).length > 0
      ) {
        issues.push(
          issue(
            "follow-up-transition-completed-later-mutation",
            validated.path,
            "HEAD differs from the receipt-introducing commit on a completed allowlisted path",
          ),
        );
      }
    } catch (error) {
      issues.push(
        issue(
          "follow-up-transition-completed-git",
          validated.path,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
  return issues;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Resolves the immutable pre-batch sidecar hashes from the committed Phase 0
 * evidence. Current sidecar bytes cannot serve this purpose after a batch has
 * legitimately updated them.
 */
function loadDecision17Baseline(
  root: string,
  cases: readonly InjuryCase[],
): Decision17BaselineResult {
  const issues: ValidationIssue[] = [];
  const path = DECISION_18_P0_AUTHORIZED_BASELINE_PATH;
  const absolutePath = join(root, path);
  if (!existsSync(absolutePath)) {
    return {
      researchSha256BySlug: new Map(),
      sidecarSha256BySlug: new Map(),
      issues: [
        issue(
          "follow-up-transition-p0-baseline-missing",
          path,
          "the immutable Decision 18 Phase 0 baseline evidence is absent",
        ),
      ],
    };
  }

  const baselineBytes = readFileSync(absolutePath);
  if (sha256Hex(baselineBytes) !== DECISION_18_P0_AUTHORIZED_BASELINE_SHA256) {
    return {
      researchSha256BySlug: new Map(),
      sidecarSha256BySlug: new Map(),
      issues: [
        issue(
          "follow-up-transition-p0-baseline-digest",
          path,
          "the Decision 18 Phase 0 baseline bytes differ from the frozen authorized artifact",
        ),
      ],
    };
  }
  const text = baselineBytes.toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      researchSha256BySlug: new Map(),
      sidecarSha256BySlug: new Map(),
      issues: [
        issue("follow-up-transition-p0-baseline-parse", path, String(error)),
      ],
    };
  }
  if (canonicalJson(parsed) !== text) {
    issues.push(
      issue(
        "follow-up-transition-p0-baseline-not-canonical",
        path,
        "the Phase 0 baseline must retain exact canonical JSON bytes",
      ),
    );
  }
  const rootRecord = asRecord(parsed);
  const followUpBaseline = asRecord(rootRecord?.decision17FollowUpBaseline);
  const rows = followUpBaseline?.sidecars;
  if (
    rootRecord?.artifactType !== "decision-18-authorized-start-baseline" ||
    rootRecord.schemaVersion !== 1 ||
    !Array.isArray(rows)
  ) {
    issues.push(
      issue(
        "follow-up-transition-p0-baseline-shape",
        path,
        "the Phase 0 evidence does not expose the frozen Decision 17 sidecars",
      ),
    );
    return {
      researchSha256BySlug: new Map(),
      sidecarSha256BySlug: new Map(),
      issues,
    };
  }

  const caseBySlug = new Map(cases.map((record) => [record.slug, record]));
  const sidecarSha256BySlug = new Map<string, string>();
  for (const [index, value] of rows.entries()) {
    const row = asRecord(value);
    const rowPath = `${path}.decision17FollowUpBaseline.sidecars.${index}`;
    const sidecarPath = typeof row?.path === "string" ? row.path : "";
    const slug = basename(sidecarPath, ".json");
    const record = caseBySlug.get(slug);
    if (
      record === undefined ||
      sidecarPath !== `src/content/follow-ups/${slug}.json` ||
      row?.caseId !== record.id ||
      typeof row.sha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(row.sha256) ||
      sidecarSha256BySlug.has(slug)
    ) {
      issues.push(
        issue(
          "follow-up-transition-p0-sidecar-binding",
          rowPath,
          "baseline sidecar row must uniquely bind a governed slug, case ID, path, and SHA-256",
        ),
      );
      continue;
    }
    sidecarSha256BySlug.set(slug, row.sha256);
  }
  const expectedSlugs = [...caseBySlug.keys()].sort(compareCodePoints);
  const actualSlugs = [...sidecarSha256BySlug.keys()].sort(compareCodePoints);
  if (
    rows.length !== cases.length ||
    expectedSlugs.length !== actualSlugs.length ||
    expectedSlugs.some((slug, index) => slug !== actualSlugs[index])
  ) {
    issues.push(
      issue(
        "follow-up-transition-p0-sidecar-coverage",
        `${path}.decision17FollowUpBaseline.sidecars`,
        "the Phase 0 baseline must cover every supplied governed case exactly once",
      ),
    );
  }

  const researchSha256BySlug = new Map<string, string>();
  const protectedFiles = rootRecord.protectedFileBindings;
  if (!Array.isArray(protectedFiles)) {
    issues.push(
      issue(
        "follow-up-transition-p0-protected-bindings",
        `${path}.protectedFileBindings`,
        "the Phase 0 evidence must expose immutable Decision 17 ledger hashes",
      ),
    );
  } else {
    for (const [index, value] of protectedFiles.entries()) {
      const row = asRecord(value);
      if (
        typeof row?.path !== "string" ||
        !row.path.startsWith("research/follow-ups/decision-17/")
      ) {
        continue;
      }
      const slug = basename(row.path, ".json");
      const record = caseBySlug.get(slug);
      if (
        record === undefined ||
        row.path !== `research/follow-ups/decision-17/${slug}.json` ||
        typeof row.sha256 !== "string" ||
        !/^[0-9a-f]{64}$/.test(row.sha256) ||
        researchSha256BySlug.has(slug)
      ) {
        issues.push(
          issue(
            "follow-up-transition-p0-research-binding",
            `${path}.protectedFileBindings.${index}`,
            "Decision 17 ledger binding must uniquely match a governed slug and SHA-256",
          ),
        );
        continue;
      }
      researchSha256BySlug.set(slug, row.sha256);
    }
    const actualResearchSlugs = [...researchSha256BySlug.keys()].sort(
      compareCodePoints,
    );
    if (
      actualResearchSlugs.length !== expectedSlugs.length ||
      expectedSlugs.some((slug, index) => slug !== actualResearchSlugs[index])
    ) {
      issues.push(
        issue(
          "follow-up-transition-p0-research-coverage",
          `${path}.protectedFileBindings`,
          "the Phase 0 protected bindings must cover every Decision 17 ledger exactly once",
        ),
      );
    }
  }
  return { researchSha256BySlug, sidecarSha256BySlug, issues };
}

function validateCurrentDecision17ResearchDigests(
  root: string,
  cases: readonly InjuryCase[],
  baseline: Decision17BaselineResult,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const record of cases) {
    const path = `research/follow-ups/decision-17/${record.slug}.json`;
    const expected = baseline.researchSha256BySlug.get(record.slug);
    if (!existsSync(join(root, path))) continue;
    if (
      expected === undefined ||
      sha256Hex(readFileSync(join(root, path))) !== expected
    ) {
      issues.push(
        issue(
          "follow-up-transition-decision17-research-drift",
          path,
          "Decision 17 research bytes differ from the immutable Phase 0 binding",
        ),
      );
    }
  }
  return issues;
}

function baselineFactsByKind(
  research: FollowUpResearch,
): Record<FollowUpKind, readonly FollowUpResearchFact[]> {
  return {
    treatment: research.categories.treatment.facts,
    surgery: research.categories.surgery.facts,
    injection: research.categories.injection.facts,
    "actual-return": research.categories["actual-return"].facts,
  };
}

function createDecision18Adapters(
  root: string,
  now: Date,
  policy: FollowUpSourcePolicyBinding,
  baseline: Decision17BaselineResult,
  cases: readonly InjuryCase[],
  gitInspection: Decision18CompletedReceiptGitInspection | undefined,
): TransitionalFollowUpAdapters<Decision18FollowUpBatchId, FollowUpResearchV2> {
  const validations = new WeakMap<
    FollowUpResearchV2,
    FollowUpResearchV2ValidationResult
  >();
  return {
    batchDefinitions: DECISION_18_FOLLOW_UP_BATCH_ORDER.map((batchId) => ({
      batchId,
      caseSlugs: DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId].membership,
      receiptPath: DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId].receiptPath,
    })),
    resolveReceiptChain: () => {
      const receiptTexts: Partial<Record<Decision18FollowUpBatchId, string>> =
        {};
      for (const batchId of DECISION_18_FOLLOW_UP_BATCH_ORDER) {
        const path =
          DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId].receiptPath;
        const absolutePath = join(root, path);
        if (existsSync(absolutePath)) {
          receiptTexts[batchId] = readFileSync(absolutePath, "utf8");
        }
      }
      const chain = scanDecision18FollowUpBatchReceiptChain(receiptTexts, {
        now,
      });
      const validatedReceipts = chain.completedBatchIds.map(
        (batchId) => chain.receipts[batchId]!,
      );
      const completedReceipts: TransitionalCompletedBatchReceipt<Decision18FollowUpBatchId>[] =
        [];
      for (const batchId of chain.completedBatchIds) {
        const validated = chain.receipts[batchId]!;
        completedReceipts.push({
          batchId,
          receiptPath: validated.path,
          receiptSha256: validated.receiptDigest,
          auditCutoffDate: validated.receipt.auditCutoffDate,
          artifacts: validated.receipt.researchLedgers.map(
            (researchEntry, index) => {
              const sidecarEntry = validated.receipt.sidecars[index]!;
              return {
                caseSlug: researchEntry.caseSlug,
                researchPath: researchEntry.path,
                researchSha256: researchEntry.sha256,
                sidecarPath: sidecarEntry.path,
                sidecarSha256: sidecarEntry.sha256,
              };
            },
          ),
        });
      }
      return {
        completedReceipts,
        issues: [
          ...baseline.issues,
          ...validateCurrentDecision17ResearchDigests(root, cases, baseline),
          ...chain.issues,
          ...(chain.issues.length === 0
            ? validateDecision18CompletedReceiptProvenance(
                root,
                validatedReceipts,
                gitInspection,
              )
            : []),
        ],
      };
    },
    parseAndValidateResearchV2: (bytes, context) => {
      const parsed = parseFollowUpResearchV2Bytes(bytes);
      if (parsed.research === null) {
        return { research: null, issues: parsed.issues };
      }
      const expectedSidecarSha256 = baseline.sidecarSha256BySlug.get(
        context.caseRecord.slug,
      );
      const expectedResearchSha256 = baseline.researchSha256BySlug.get(
        context.caseRecord.slug,
      );
      const missingBaselineIssue =
        expectedSidecarSha256 === undefined ||
        expectedResearchSha256 === undefined
          ? [
              issue(
                "follow-up-transition-p0-sidecar-digest-missing",
                context.caseRecord.slug,
                "no immutable Decision 17 sidecar digest exists for this case",
              ),
            ]
          : [];
      const validation = validateFollowUpResearchV2Record(parsed.research, {
        auditCutoffDate: context.auditCutoffDate,
        expectedCaseId: context.caseRecord.id,
        expectedCaseSlug: context.caseRecord.slug,
        expectedCaseClinicalDigest: computeCaseContentDigest(
          context.caseRecord,
        ),
        expectedPolicyBinding: policy,
        expectedBaselineFacts: baselineFactsByKind(context.historicalResearch),
        expectedDecision17ResearchSha256: expectedResearchSha256,
        expectedDecision17SidecarSha256: expectedSidecarSha256,
        expectedSearchContext: expectedFollowUpResearchV2SearchContextForCase(
          context.caseRecord,
        ),
      });
      validations.set(parsed.research, validation);
      return {
        research:
          parsed.issues.length === 0 &&
          missingBaselineIssue.length === 0 &&
          validation.issues.length === 0 &&
          validation.terminal
            ? parsed.research
            : null,
        issues: [
          ...parsed.issues,
          ...missingBaselineIssue,
          ...validation.issues,
        ],
      };
    },
    validateResearchV2Sidecar: (sidecar, context) => {
      const validation = validations.get(context.research);
      if (validation === undefined || !validation.terminal) {
        return [
          issue(
            "follow-up-transition-v2-validation-state",
            context.researchPath,
            "sidecar projection requires the same terminal replay validation",
          ),
        ];
      }
      return validateDecision18ProjectedSidecar(sidecar, {
        auditCutoffDate: context.auditCutoffDate,
        caseRecord: context.caseRecord,
        expectedPolicyBinding: policy,
        projectedFactsByKind: validation.projectedFactsByKind,
      });
    },
  };
}

/**
 * Production Decision 18 transitional loader. Before any receipt, all 26
 * entries remain exact D17 v1 pairs. Each valid contiguous receipt switches
 * its complete frozen batch to terminal v2; any error returns zero entries.
 */
export function loadDecision18TransitionalFollowUpCorpus(
  root: string,
  cases: readonly InjuryCase[],
  options: LoadDecision18TransitionalFollowUpCorpusOptions,
): Decision18TransitionalCorpus {
  const baseline = loadDecision17Baseline(root, cases);
  return loadTransitionalFollowUpCorpus(root, cases, {
    expectedPolicyBinding: options.expectedPolicyBinding,
    expectedCaseCount: options.expectedCaseCount,
    adapters: createDecision18Adapters(
      root,
      options.now ?? new Date(),
      options.expectedPolicyBinding,
      baseline,
      cases,
      options.gitInspection,
    ),
  });
}
