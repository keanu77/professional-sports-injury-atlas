/**
 * Fail-closed Decision 17 -> Decision 18 follow-up corpus transition.
 *
 * Receipt and research-v2 semantics live in their own contracts. This module
 * owns the filesystem/provenance boundary: an absent completed-batch receipt
 * selects the immutable Decision 17 ledger, while a valid completed receipt
 * selects the receipt-bound Decision 18 ledger for the whole batch. It never
 * falls back case-by-case after a receipt or one of its bound artifacts fails.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { computeCaseContentDigest } from "./digest";
import {
  FOLLOW_UP_CONTENT_DIRECTORY,
  FOLLOW_UP_RESEARCH_DIRECTORY,
  validateCaseFollowUpRecord,
  validateFollowUpResearchRecord,
} from "./follow-up-loader";
import { computeFollowUpDraftDigest } from "./follow-up-digest";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_VALIDATION_CUTOFF_DATE,
  parseCaseFollowUpBytes,
  parseFollowUpResearchBytes,
  type CaseFollowUp,
  type FollowUpKind,
  type FollowUpResearch,
  type FollowUpResearchFact,
  type FollowUpSourcePolicyBinding,
} from "../contracts/case-follow-up";
import type { InjuryCase } from "../contracts/case";
import {
  ISO_DATE_RE,
  SHA256_RE,
  compareCodePoints,
  issue,
  sha256Hex,
  type ValidationIssue,
} from "../contracts/canonical";

export const DECISION_18_FOLLOW_UP_RESEARCH_DIRECTORY =
  "research/follow-ups/decision-18/cases" as const;

export interface TransitionalBatchDefinition<TBatchId extends string> {
  batchId: TBatchId;
  caseSlugs: readonly string[];
  receiptPath: string;
}

/** Normalized, already schema-validated receipt artifact binding. */
export interface TransitionalReceiptArtifactBinding {
  caseSlug: string;
  researchPath: string;
  researchSha256: string;
  sidecarPath: string;
  sidecarSha256: string;
}

/**
 * Receipt scanners normalize their strict receipt into this narrow shape.
 * The loader deliberately rechecks frozen membership, paths, and file bytes.
 */
export interface TransitionalCompletedBatchReceipt<TBatchId extends string> {
  batchId: TBatchId;
  receiptPath: string;
  receiptSha256: string;
  auditCutoffDate: string;
  artifacts: readonly TransitionalReceiptArtifactBinding[];
}

export interface TransitionalReceiptChain<TBatchId extends string> {
  completedReceipts: readonly TransitionalCompletedBatchReceipt<TBatchId>[];
  issues: readonly ValidationIssue[];
}

export interface ParseAndValidateResearchV2Context {
  auditCutoffDate: string;
  caseRecord: InjuryCase;
  historicalResearch: FollowUpResearch;
  historicalResearchPath: string;
  historicalResearchSha256: string;
  researchPath: string;
}

export interface ValidateResearchV2SidecarContext<TResearchV2> {
  auditCutoffDate: string;
  caseRecord: InjuryCase;
  historicalResearch: FollowUpResearch;
  research: TResearchV2;
  researchPath: string;
  sidecarPath: string;
}

export interface TransitionalFollowUpAdapters<
  TBatchId extends string,
  TResearchV2,
> {
  batchDefinitions: readonly TransitionalBatchDefinition<TBatchId>[];
  resolveReceiptChain: (root: string) => TransitionalReceiptChain<TBatchId>;
  parseAndValidateResearchV2: (
    bytes: Uint8Array,
    context: ParseAndValidateResearchV2Context,
  ) => {
    research: TResearchV2 | null;
    issues: readonly ValidationIssue[];
  };
  validateResearchV2Sidecar: (
    sidecar: CaseFollowUp,
    context: ValidateResearchV2SidecarContext<TResearchV2>,
  ) => readonly ValidationIssue[];
}

interface LoadedDecision17FollowUpEntry {
  provenance: "decision-17-v1";
  caseSlug: string;
  sidecarPath: string;
  researchPath: string;
  sidecar: CaseFollowUp;
  research: FollowUpResearch;
  auditCutoffDate: typeof FOLLOW_UP_VALIDATION_CUTOFF_DATE;
  draftDigest: string;
}

interface LoadedDecision18FollowUpEntry<TBatchId extends string, TResearchV2> {
  provenance: "decision-18-v2";
  batchId: TBatchId;
  receiptPath: string;
  receiptSha256: string;
  caseSlug: string;
  sidecarPath: string;
  researchPath: string;
  sidecar: CaseFollowUp;
  research: TResearchV2;
  historicalResearchPath: string;
  historicalResearch: FollowUpResearch;
  auditCutoffDate: string;
  draftDigest: string;
}

export type LoadedTransitionalFollowUpEntry<
  TBatchId extends string,
  TResearchV2,
> =
  | LoadedDecision17FollowUpEntry
  | LoadedDecision18FollowUpEntry<TBatchId, TResearchV2>;

export interface LoadedTransitionalFollowUpCorpus<
  TBatchId extends string,
  TResearchV2,
> {
  entries: LoadedTransitionalFollowUpEntry<TBatchId, TResearchV2>[];
  completedBatchIds: TBatchId[];
  issues: ValidationIssue[];
}

export interface LoadTransitionalFollowUpCorpusOptions<
  TBatchId extends string,
  TResearchV2,
> {
  expectedPolicyBinding: FollowUpSourcePolicyBinding;
  expectedCaseCount?: number;
  adapters: TransitionalFollowUpAdapters<TBatchId, TResearchV2>;
}

export type ProjectedFollowUpFactsByKind = Record<
  FollowUpKind,
  readonly FollowUpResearchFact[]
>;

/**
 * Reuses the unchanged case-follow-up.v1 validator against the final v2 fact
 * projection. The synthetic envelope is validation-only; no Decision 17 file
 * is rewritten and no v2 round provenance is discarded from its real ledger.
 */
export function validateDecision18ProjectedSidecar(
  sidecar: CaseFollowUp,
  options: {
    auditCutoffDate: string;
    caseRecord: InjuryCase;
    expectedPolicyBinding: FollowUpSourcePolicyBinding;
    projectedFactsByKind: ProjectedFollowUpFactsByKind;
  },
): ValidationIssue[] {
  const category = (kind: FollowUpKind) => {
    const facts = [...options.projectedFactsByKind[kind]];
    const queryBoundaries = [
      {
        query: `Decision 18 terminal research-v2 projection for ${options.caseRecord.slug} ${kind}`,
        locationsChecked: [
          "validated Decision 18 research-v2 round and candidate ledger",
        ],
        performedAt: options.auditCutoffDate,
        stoppingBoundary:
          "derived terminal two-zero state and complete required coverage",
      },
    ];
    return facts.length > 0
      ? {
          queryBoundaries,
          outcome: "source-ready" as const,
          notFoundReason: null,
          facts,
        }
      : {
          queryBoundaries,
          outcome: "not-found" as const,
          notFoundReason:
            "Terminal Decision 18 research-v2 audit retained no qualifying fact.",
          facts: [],
        };
  };
  const projection: FollowUpResearch = {
    schemaVersion: "case-follow-up-research.v1",
    caseId: options.caseRecord.id,
    caseSlug: options.caseRecord.slug,
    caseClinicalDigest: computeCaseContentDigest(options.caseRecord),
    evidenceStatus: "source-ready",
    sourcePolicyBinding: { ...options.expectedPolicyBinding },
    categories: {
      treatment: category("treatment"),
      surgery: category("surgery"),
      injection: category("injection"),
      "actual-return": category("actual-return"),
    },
  };
  return validateCaseFollowUpRecord(sidecar, {
    caseRecord: options.caseRecord,
    research: projection,
    expectedPolicyBinding: options.expectedPolicyBinding,
    maximumFactDate: options.auditCutoffDate,
  });
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

function expectedResearchV2Path(slug: string): string {
  return `${DECISION_18_FOLLOW_UP_RESEARCH_DIRECTORY}/${slug}.json`;
}

function expectedSidecarPath(slug: string): string {
  return `${FOLLOW_UP_CONTENT_DIRECTORY}/${slug}.json`;
}

function expectedResearchV1Path(slug: string): string {
  return `${FOLLOW_UP_RESEARCH_DIRECTORY}/${slug}.json`;
}

function readBoundFile(
  root: string,
  path: string,
  missingCode: string,
  issues: ValidationIssue[],
): Uint8Array | null {
  const absolutePath = join(root, path);
  if (!existsSync(absolutePath)) {
    issues.push(
      issue(missingCode, path, `required artifact ${path} is absent`),
    );
    return null;
  }
  return readFileSync(absolutePath);
}

function arraysEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function validateBatchDefinitions<TBatchId extends string>(
  cases: readonly InjuryCase[],
  definitions: readonly TransitionalBatchDefinition<TBatchId>[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const caseSlugs = new Set(cases.map((record) => record.slug));
  const seenBatchIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenReceiptPaths = new Set<string>();

  for (const [batchIndex, definition] of definitions.entries()) {
    const path = `batchDefinitions.${batchIndex}`;
    if (seenBatchIds.has(definition.batchId)) {
      issues.push(
        issue(
          "follow-up-transition-batch-duplicate",
          `${path}.batchId`,
          `duplicate batch ID ${definition.batchId}`,
        ),
      );
    }
    seenBatchIds.add(definition.batchId);
    if (seenReceiptPaths.has(definition.receiptPath)) {
      issues.push(
        issue(
          "follow-up-transition-receipt-path-duplicate",
          `${path}.receiptPath`,
          `duplicate receipt path ${definition.receiptPath}`,
        ),
      );
    }
    seenReceiptPaths.add(definition.receiptPath);
    if (definition.caseSlugs.length === 0) {
      issues.push(
        issue(
          "follow-up-transition-batch-empty",
          `${path}.caseSlugs`,
          "a governed transition batch cannot be empty",
        ),
      );
    }
    for (const [slugIndex, slug] of definition.caseSlugs.entries()) {
      const slugPath = `${path}.caseSlugs.${slugIndex}`;
      if (!caseSlugs.has(slug)) {
        issues.push(
          issue(
            "follow-up-transition-batch-unknown-case",
            slugPath,
            `batch member ${slug} is not a supplied governed case`,
          ),
        );
      }
      if (seenSlugs.has(slug)) {
        issues.push(
          issue(
            "follow-up-transition-batch-case-duplicate",
            slugPath,
            `case ${slug} occurs in more than one batch`,
          ),
        );
      }
      seenSlugs.add(slug);
    }
  }

  for (const slug of [...caseSlugs].sort(compareCodePoints)) {
    if (!seenSlugs.has(slug)) {
      issues.push(
        issue(
          "follow-up-transition-batch-case-missing",
          "batchDefinitions",
          `governed case ${slug} is absent from the batch definitions`,
        ),
      );
    }
  }
  return issues;
}

function validateCompletedReceiptPrefix<TBatchId extends string>(
  definitions: readonly TransitionalBatchDefinition<TBatchId>[],
  receipts: readonly TransitionalCompletedBatchReceipt<TBatchId>[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (receipts.length > definitions.length) {
    issues.push(
      issue(
        "follow-up-transition-receipt-count",
        "receipts",
        "completed receipt count exceeds the frozen batch count",
      ),
    );
  }

  const seenArtifactPaths = new Set<string>();
  for (const [batchIndex, receipt] of receipts.entries()) {
    const expected = definitions[batchIndex];
    const path = `receipts.${batchIndex}`;
    if (expected === undefined || receipt.batchId !== expected.batchId) {
      issues.push(
        issue(
          "follow-up-transition-receipt-noncontiguous",
          `${path}.batchId`,
          `receipt ${receipt.batchId} is not the next frozen batch`,
        ),
      );
      continue;
    }
    if (receipt.receiptPath !== expected.receiptPath) {
      issues.push(
        issue(
          "follow-up-transition-receipt-path",
          `${path}.receiptPath`,
          `receipt must use ${expected.receiptPath}`,
        ),
      );
    }
    if (!SHA256_RE.test(receipt.receiptSha256)) {
      issues.push(
        issue(
          "follow-up-transition-receipt-digest",
          `${path}.receiptSha256`,
          "receipt digest must be lowercase SHA-256",
        ),
      );
    }
    if (!ISO_DATE_RE.test(receipt.auditCutoffDate)) {
      issues.push(
        issue(
          "follow-up-transition-audit-cutoff",
          `${path}.auditCutoffDate`,
          `invalid receipt-derived cutoff ${receipt.auditCutoffDate}`,
        ),
      );
    }

    const artifactSlugs = receipt.artifacts.map(
      (artifact) => artifact.caseSlug,
    );
    if (!arraysEqual(artifactSlugs, expected.caseSlugs)) {
      issues.push(
        issue(
          "follow-up-transition-receipt-membership",
          `${path}.artifacts`,
          "receipt artifact membership/order must exactly equal the frozen batch",
        ),
      );
    }
    for (const [artifactIndex, artifact] of receipt.artifacts.entries()) {
      const artifactPath = `${path}.artifacts.${artifactIndex}`;
      const expectedResearch = expectedResearchV2Path(artifact.caseSlug);
      const expectedSidecar = expectedSidecarPath(artifact.caseSlug);
      if (
        artifact.researchPath !== expectedResearch ||
        artifact.sidecarPath !== expectedSidecar
      ) {
        issues.push(
          issue(
            "follow-up-transition-artifact-path",
            artifactPath,
            `receipt artifact paths must be ${expectedResearch} and ${expectedSidecar}`,
          ),
        );
      }
      if (
        !SHA256_RE.test(artifact.researchSha256) ||
        !SHA256_RE.test(artifact.sidecarSha256)
      ) {
        issues.push(
          issue(
            "follow-up-transition-artifact-digest",
            artifactPath,
            "receipt artifact digests must be lowercase SHA-256",
          ),
        );
      }
      for (const boundPath of [artifact.researchPath, artifact.sidecarPath]) {
        if (seenArtifactPaths.has(boundPath)) {
          issues.push(
            issue(
              "follow-up-transition-artifact-path-duplicate",
              artifactPath,
              `receipt artifact path ${boundPath} is bound more than once`,
            ),
          );
        }
        seenArtifactPaths.add(boundPath);
      }
    }
  }
  return issues;
}

function loadHistoricalResearch(
  root: string,
  record: InjuryCase,
  expectedPolicyBinding: FollowUpSourcePolicyBinding,
  issues: ValidationIssue[],
): { path: string; research: FollowUpResearch; sha256: string } | null {
  const path = expectedResearchV1Path(record.slug);
  const bytes = readBoundFile(
    root,
    path,
    "follow-up-transition-v1-research-missing",
    issues,
  );
  if (bytes === null) return null;
  const parsed = parseFollowUpResearchBytes(bytes);
  issues.push(...prefixedIssues(path, parsed.issues));
  if (parsed.research === null) return null;
  const researchIssues = validateFollowUpResearchRecord(parsed.research, {
    expectedPolicyBinding,
    maximumFactDate: FOLLOW_UP_VALIDATION_CUTOFF_DATE,
  });
  issues.push(...prefixedIssues(path, researchIssues));
  if (
    parsed.research.caseId !== record.id ||
    parsed.research.caseSlug !== record.slug
  ) {
    issues.push(
      issue(
        "follow-up-transition-v1-case-binding",
        path,
        "historical research does not bind the supplied case ID and slug",
      ),
    );
  }
  return {
    path,
    research: parsed.research,
    sha256: parsed.exactBytesDigest,
  };
}

function loadSidecar(
  root: string,
  path: string,
  issues: ValidationIssue[],
): { bytes: Uint8Array; sidecar: CaseFollowUp } | null {
  const bytes = readBoundFile(
    root,
    path,
    "follow-up-transition-sidecar-missing",
    issues,
  );
  if (bytes === null) return null;
  const parsed = parseCaseFollowUpBytes(bytes);
  issues.push(...prefixedIssues(path, parsed.issues));
  return parsed.sidecar === null ? null : { bytes, sidecar: parsed.sidecar };
}

/**
 * Loads one coherent transitional corpus. Any issue empties `entries`; callers
 * cannot accidentally render a valid prefix or silently use Decision 17 for a
 * batch whose Decision 18 receipt/artifacts are present but invalid.
 */
export function loadTransitionalFollowUpCorpus<
  TBatchId extends string,
  TResearchV2,
>(
  root: string,
  cases: readonly InjuryCase[],
  options: LoadTransitionalFollowUpCorpusOptions<TBatchId, TResearchV2>,
): LoadedTransitionalFollowUpCorpus<TBatchId, TResearchV2> {
  const issues: ValidationIssue[] = [];
  const expectedCaseCount = options.expectedCaseCount ?? 26;
  if (cases.length !== expectedCaseCount) {
    issues.push(
      issue(
        "follow-up-transition-case-count",
        "cases",
        `expected ${expectedCaseCount} cases, found ${cases.length}`,
      ),
    );
  }
  const slugSet = new Set<string>();
  const idSet = new Set<string>();
  for (const [index, record] of cases.entries()) {
    if (slugSet.has(record.slug) || idSet.has(record.id)) {
      issues.push(
        issue(
          "follow-up-transition-case-duplicate",
          `cases.${index}`,
          `duplicate governed case ID or slug ${record.id}/${record.slug}`,
        ),
      );
    }
    slugSet.add(record.slug);
    idSet.add(record.id);
  }

  issues.push(
    ...validateBatchDefinitions(cases, options.adapters.batchDefinitions),
  );
  const chain = options.adapters.resolveReceiptChain(root);
  issues.push(...prefixedIssues("receiptChain", chain.issues));
  issues.push(
    ...validateCompletedReceiptPrefix(
      options.adapters.batchDefinitions,
      chain.completedReceipts,
    ),
  );
  if (issues.length > 0) {
    return { entries: [], completedBatchIds: [], issues };
  }

  const completedBySlug = new Map<
    string,
    {
      receipt: TransitionalCompletedBatchReceipt<TBatchId>;
      artifact: TransitionalReceiptArtifactBinding;
    }
  >();
  for (const receipt of chain.completedReceipts) {
    for (const artifact of receipt.artifacts) {
      completedBySlug.set(artifact.caseSlug, { receipt, artifact });
    }
  }

  const entries: LoadedTransitionalFollowUpEntry<TBatchId, TResearchV2>[] = [];
  const globalItemIds = new Set<string>();
  for (const record of [...cases].sort((left, right) =>
    compareCodePoints(left.slug, right.slug),
  )) {
    const historical = loadHistoricalResearch(
      root,
      record,
      options.expectedPolicyBinding,
      issues,
    );
    const completed = completedBySlug.get(record.slug);
    const sidecarPath = expectedSidecarPath(record.slug);
    const sidecarResult = loadSidecar(root, sidecarPath, issues);
    if (historical === null || sidecarResult === null) continue;

    if (completed === undefined) {
      const entryIssues = validateCaseFollowUpRecord(sidecarResult.sidecar, {
        caseRecord: record,
        research: historical.research,
        expectedPolicyBinding: options.expectedPolicyBinding,
        maximumFactDate: FOLLOW_UP_VALIDATION_CUTOFF_DATE,
      });
      issues.push(...prefixedIssues(sidecarPath, entryIssues));
      entries.push({
        provenance: "decision-17-v1",
        caseSlug: record.slug,
        sidecarPath,
        researchPath: historical.path,
        sidecar: sidecarResult.sidecar,
        research: historical.research,
        auditCutoffDate: FOLLOW_UP_VALIDATION_CUTOFF_DATE,
        draftDigest: computeFollowUpDraftDigest(sidecarResult.sidecar),
      });
    } else {
      const { artifact, receipt } = completed;
      if (sha256Hex(sidecarResult.bytes) !== artifact.sidecarSha256) {
        issues.push(
          issue(
            "follow-up-transition-sidecar-digest",
            sidecarPath,
            "sidecar bytes do not match the completed batch receipt",
          ),
        );
      }
      const researchBytes = readBoundFile(
        root,
        artifact.researchPath,
        "follow-up-transition-v2-research-missing",
        issues,
      );
      if (researchBytes === null) continue;
      if (sha256Hex(researchBytes) !== artifact.researchSha256) {
        issues.push(
          issue(
            "follow-up-transition-v2-research-digest",
            artifact.researchPath,
            "research-v2 bytes do not match the completed batch receipt",
          ),
        );
      }
      const parsedV2 = options.adapters.parseAndValidateResearchV2(
        researchBytes,
        {
          auditCutoffDate: receipt.auditCutoffDate,
          caseRecord: record,
          historicalResearch: historical.research,
          historicalResearchPath: historical.path,
          historicalResearchSha256: historical.sha256,
          researchPath: artifact.researchPath,
        },
      );
      issues.push(...prefixedIssues(artifact.researchPath, parsedV2.issues));
      if (parsedV2.research === null) continue;
      issues.push(
        ...prefixedIssues(
          sidecarPath,
          options.adapters.validateResearchV2Sidecar(sidecarResult.sidecar, {
            auditCutoffDate: receipt.auditCutoffDate,
            caseRecord: record,
            historicalResearch: historical.research,
            research: parsedV2.research,
            researchPath: artifact.researchPath,
            sidecarPath,
          }),
        ),
      );
      entries.push({
        provenance: "decision-18-v2",
        batchId: receipt.batchId,
        receiptPath: receipt.receiptPath,
        receiptSha256: receipt.receiptSha256,
        caseSlug: record.slug,
        sidecarPath,
        researchPath: artifact.researchPath,
        sidecar: sidecarResult.sidecar,
        research: parsedV2.research,
        historicalResearchPath: historical.path,
        historicalResearch: historical.research,
        auditCutoffDate: receipt.auditCutoffDate,
        draftDigest: computeFollowUpDraftDigest(sidecarResult.sidecar),
      });
    }

    for (const kind of FOLLOW_UP_KINDS) {
      for (const item of sidecarResult.sidecar.categories[kind]) {
        if (globalItemIds.has(item.id)) {
          issues.push(
            issue(
              "follow-up-transition-global-item-duplicate",
              `${sidecarPath}.categories.${kind}.${item.id}`,
              `item ID ${item.id} is reused across cases`,
            ),
          );
        }
        globalItemIds.add(item.id);
      }
    }
  }

  const completedBatchIds = chain.completedReceipts.map(
    (receipt) => receipt.batchId,
  );
  return issues.length === 0
    ? { entries, completedBatchIds, issues }
    : { entries: [], completedBatchIds: [], issues };
}
