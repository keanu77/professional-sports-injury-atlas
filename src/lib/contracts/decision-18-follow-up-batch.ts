/**
 * Decision 18's immutable batch membership and canonical completion-receipt
 * contract. Research ledgers remain owned by the research-v2 contract; this
 * module only binds their paths and exact bytes into an ordered batch chain.
 */

import { z } from "astro/zod";

import {
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  followUpSourcePolicyBindingSchema,
} from "./case-follow-up";
import {
  CanonicalJsonError,
  ISO_DATE_RE,
  SHA256_RE,
  UTC_TIMESTAMP_RE,
  canonicalJson,
  compareCodePoints,
  isValidIsoDate,
  isValidUtcTimestamp,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "./canonical";
import {
  DECISION_18_AUTHORIZATION_SHA256,
  DECISION_18_PLAN_SHA256,
} from "./decision-18-regression-contract";

export const DECISION_18_FOLLOW_UP_BATCH_RECEIPT_SCHEMA_VERSION =
  "decision-18-follow-up-batch-receipt.v1" as const;
export const DECISION_18_FOLLOW_UP_BATCH_ORDER = [
  "acl",
  "ankle",
  "achilles",
] as const;
export type Decision18FollowUpBatchId =
  (typeof DECISION_18_FOLLOW_UP_BATCH_ORDER)[number];

export const DECISION_18_FOLLOW_UP_BATCH_MEMBERSHIP = Object.freeze({
  acl: Object.freeze([
    "danny-green-acl-2022",
    "joe-ingles-acl-2022",
    "kyrie-irving-acl-2025",
    "markelle-fultz-acl-2021",
    "moritz-wagner-acl-2024",
    "ricky-rubio-acl-2021",
    "thomas-bryant-acl-2021",
  ]),
  ankle: Object.freeze([
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
  ]),
  achilles: Object.freeze([
    "brandon-clarke-achilles-rupture-2023",
    "damian-lillard-achilles-rupture-2025",
    "dejounte-murray-achilles-rupture-2025",
    "dwight-powell-achilles-rupture-2020",
    "jayson-tatum-achilles-rupture-2025",
    "kevin-durant-achilles-rupture-2019",
    "tyrese-haliburton-achilles-rupture-2025",
  ]),
} as const);

export const DECISION_18_PLAN_PATH =
  "docs/superpowers/plans/2026-08-15-decision-18-professional-notes-and-exhaustive-followups.md" as const;
export const DECISION_18_AUTHORIZATION_PATH =
  "docs/decisions/2026-08-15-decision-18-professional-notes-and-exhaustive-followups-authorization.v1.json" as const;
export const DECISION_18_P0_BASELINE_PATH =
  "docs/reviews/evidence/decision-18/p0/authorized-start-baseline.v1.json" as const;
export const DECISION_18_P0_BASELINE_SHA256 =
  "fa541c8a2c1fd476e41f0820fc40440f6d16fb2b1990cd14dc25053fef32c992" as const;

export interface Decision18FollowUpBatchDefinition {
  readonly batchId: Decision18FollowUpBatchId;
  readonly evidenceDirectory: string;
  readonly membership: readonly string[];
  readonly phase: 3 | 4 | 5;
  readonly receiptPath: string;
  readonly reportPath: string;
  readonly sequenceNumber: 1 | 2 | 3;
}

export const DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS = Object.freeze({
  acl: Object.freeze({
    batchId: "acl",
    evidenceDirectory: "docs/reviews/evidence/decision-18/batch-1-acl/",
    membership: DECISION_18_FOLLOW_UP_BATCH_MEMBERSHIP.acl,
    phase: 3,
    receiptPath: "research/follow-ups/decision-18/batches/acl.receipt.v1.json",
    reportPath:
      "docs/reviews/2026-08-15-decision-18-p3-acl-exhaustive-followups.md",
    sequenceNumber: 1,
  }),
  ankle: Object.freeze({
    batchId: "ankle",
    evidenceDirectory: "docs/reviews/evidence/decision-18/batch-2-ankle/",
    membership: DECISION_18_FOLLOW_UP_BATCH_MEMBERSHIP.ankle,
    phase: 4,
    receiptPath:
      "research/follow-ups/decision-18/batches/ankle.receipt.v1.json",
    reportPath:
      "docs/reviews/2026-08-15-decision-18-p4-ankle-exhaustive-followups.md",
    sequenceNumber: 2,
  }),
  achilles: Object.freeze({
    batchId: "achilles",
    evidenceDirectory: "docs/reviews/evidence/decision-18/batch-3-achilles/",
    membership: DECISION_18_FOLLOW_UP_BATCH_MEMBERSHIP.achilles,
    phase: 5,
    receiptPath:
      "research/follow-ups/decision-18/batches/achilles.receipt.v1.json",
    reportPath:
      "docs/reviews/2026-08-15-decision-18-p5-achilles-exhaustive-followups.md",
    sequenceNumber: 3,
  }),
} satisfies Record<
  Decision18FollowUpBatchId,
  Decision18FollowUpBatchDefinition
>);

const trimmedNonEmpty = z
  .string()
  .min(1)
  .refine((value) => value === value.trim(), {
    message: "must be trimmed and non-empty",
  });
const sha256Lower = z.string().regex(SHA256_RE);
const utcTimestamp = z.string().regex(UTC_TIMESTAMP_RE);
const isoDate = z.string().regex(ISO_DATE_RE);

const repositoryPath = trimmedNonEmpty.refine(
  (value) =>
    !value.startsWith("/") &&
    !value.endsWith("/") &&
    !value.includes("\\") &&
    !value.split("/").some((segment) => segment === "" || segment === ".."),
  { message: "must be a normalized repository-relative file path" },
);

const batchFileDigestSchema = z.strictObject({
  caseSlug: trimmedNonEmpty,
  path: repositoryPath,
  sha256: sha256Lower,
});
export type Decision18BatchFileDigest = z.infer<typeof batchFileDigestSchema>;

const artifactDigestSchema = z.strictObject({
  path: repositoryPath,
  sha256: sha256Lower,
});
export type Decision18BatchArtifactDigest = z.infer<
  typeof artifactDigestSchema
>;

const predecessorReceiptSchema = z.strictObject({
  batchId: z.enum(DECISION_18_FOLLOW_UP_BATCH_ORDER),
  path: repositoryPath,
  sha256: sha256Lower,
});
export type Decision18PredecessorReceipt = z.infer<
  typeof predecessorReceiptSchema
>;

const decision18AuthorityBindingSchema = z.strictObject({
  planPath: z.literal(DECISION_18_PLAN_PATH),
  planSha256: z.literal(DECISION_18_PLAN_SHA256),
  authorizationPath: z.literal(DECISION_18_AUTHORIZATION_PATH),
  authorizationSha256: z.literal(DECISION_18_AUTHORIZATION_SHA256),
});

export const DECISION_18_AUTHORITY_BINDING = Object.freeze({
  planPath: DECISION_18_PLAN_PATH,
  planSha256: DECISION_18_PLAN_SHA256,
  authorizationPath: DECISION_18_AUTHORIZATION_PATH,
  authorizationSha256: DECISION_18_AUTHORIZATION_SHA256,
} as const);

export const decision18FollowUpBatchReceiptSchema = z.strictObject({
  schemaVersion: z.literal(DECISION_18_FOLLOW_UP_BATCH_RECEIPT_SCHEMA_VERSION),
  decisionId: z.literal("decision-18"),
  batchId: z.enum(DECISION_18_FOLLOW_UP_BATCH_ORDER),
  sequenceNumber: z.number().int().min(1).max(3),
  generatedAt: utcTimestamp,
  auditCutoffDate: isoDate,
  authorityBinding: decision18AuthorityBindingSchema,
  sourcePolicyBinding: followUpSourcePolicyBindingSchema,
  membership: z.array(trimmedNonEmpty),
  auditUnitCount: z.number().int().positive(),
  predecessorReceipts: z.array(predecessorReceiptSchema),
  researchLedgers: z.array(batchFileDigestSchema),
  sidecars: z.array(batchFileDigestSchema),
  reviewReport: artifactDigestSchema,
  evidenceFiles: z.array(artifactDigestSchema),
  allowedPaths: z.array(repositoryPath),
});
export type Decision18FollowUpBatchReceipt = z.infer<
  typeof decision18FollowUpBatchReceiptSchema
>;

export interface ValidatedDecision18FollowUpBatchReceipt {
  batchId: Decision18FollowUpBatchId;
  path: string;
  receipt: Decision18FollowUpBatchReceipt;
  receiptDigest: string;
}

function sameOrderedValues(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function exactCanonical(left: unknown, right: unknown): boolean {
  try {
    return canonicalJson(left) === canonicalJson(right);
  } catch {
    return false;
  }
}

function orderedUnique(values: readonly string[]): boolean {
  return (
    new Set(values).size === values.length &&
    values.every(
      (value, index) =>
        index === 0 ||
        compareCodePoints(values[index - 1] as string, value) < 0,
    )
  );
}

function expectedCaseArtifacts(
  definition: Decision18FollowUpBatchDefinition,
  directory: string,
): Array<{ caseSlug: string; path: string }> {
  return definition.membership.map((caseSlug) => ({
    caseSlug,
    path: `${directory}/${caseSlug}.json`,
  }));
}

export function expectedDecision18BatchResearchLedgers(
  batchId: Decision18FollowUpBatchId,
): Array<{ caseSlug: string; path: string }> {
  return expectedCaseArtifacts(
    DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId],
    "research/follow-ups/decision-18/cases",
  );
}

export function expectedDecision18BatchSidecars(
  batchId: Decision18FollowUpBatchId,
): Array<{ caseSlug: string; path: string }> {
  return expectedCaseArtifacts(
    DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId],
    "src/content/follow-ups",
  );
}

export function expectedDecision18BatchCoreAllowedPaths(
  batchId: Decision18FollowUpBatchId,
): string[] {
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[batchId];
  return [
    ...expectedDecision18BatchResearchLedgers(batchId).map(
      (entry) => entry.path,
    ),
    ...expectedDecision18BatchSidecars(batchId).map((entry) => entry.path),
    definition.receiptPath,
    definition.reportPath,
  ].sort(compareCodePoints);
}

export function expectedDecision18BatchAllowedPaths(
  batchId: Decision18FollowUpBatchId,
  evidencePaths: readonly string[],
): string[] {
  return [
    ...expectedDecision18BatchCoreAllowedPaths(batchId),
    ...evidencePaths,
  ].sort(compareCodePoints);
}

function validateExactFileDigestList(
  issues: ValidationIssue[],
  actual: readonly Decision18BatchFileDigest[],
  expected: readonly { caseSlug: string; path: string }[],
  path: "researchLedgers" | "sidecars",
): void {
  if (
    actual.length !== expected.length ||
    actual.some(
      (entry, index) =>
        entry.caseSlug !== expected[index]?.caseSlug ||
        entry.path !== expected[index]?.path,
    )
  ) {
    issues.push(
      issue(
        "decision18-batch-file-inventory",
        path,
        `${path} must name every frozen batch member exactly once in membership order`,
      ),
    );
  }
}

function validNowInstant(now: Date): boolean {
  return !Number.isNaN(now.getTime());
}

export interface Decision18BatchReceiptValidationOptions {
  batchId: Decision18FollowUpBatchId;
  now: Date;
  validatedPredecessors: readonly ValidatedDecision18FollowUpBatchReceipt[];
}

/** Semantic validation after the strict receipt schema has parsed. */
export function validateDecision18FollowUpBatchReceipt(
  receipt: Decision18FollowUpBatchReceipt,
  options: Decision18BatchReceiptValidationOptions,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[options.batchId];
  const batchIndex = DECISION_18_FOLLOW_UP_BATCH_ORDER.indexOf(options.batchId);
  if (receipt.batchId !== options.batchId) {
    issues.push(
      issue(
        "decision18-batch-id",
        "batchId",
        `receipt at ${definition.receiptPath} must identify batch ${options.batchId}`,
      ),
    );
  }
  if (receipt.sequenceNumber !== definition.sequenceNumber) {
    issues.push(
      issue(
        "decision18-batch-sequence",
        "sequenceNumber",
        `batch ${options.batchId} must use sequence ${definition.sequenceNumber}`,
      ),
    );
  }
  if (!sameOrderedValues(receipt.membership, definition.membership)) {
    issues.push(
      issue(
        "decision18-batch-membership",
        "membership",
        `batch ${options.batchId} must retain its exact frozen membership and order`,
      ),
    );
  }
  if (receipt.auditUnitCount !== definition.membership.length * 4) {
    issues.push(
      issue(
        "decision18-batch-audit-unit-count",
        "auditUnitCount",
        `batch ${options.batchId} requires exactly ${definition.membership.length * 4} audit units`,
      ),
    );
  }
  if (!isValidUtcTimestamp(receipt.generatedAt)) {
    issues.push(
      issue(
        "decision18-batch-generated-at",
        "generatedAt",
        "generatedAt must be a real second-precision UTC timestamp",
      ),
    );
  } else if (
    !validNowInstant(options.now) ||
    Date.parse(receipt.generatedAt) > options.now.getTime()
  ) {
    issues.push(
      issue(
        "decision18-batch-generated-at-future",
        "generatedAt",
        "generatedAt must not be later than the verifier's current time",
      ),
    );
  }
  if (
    !isValidIsoDate(receipt.auditCutoffDate) ||
    receipt.auditCutoffDate !== receipt.generatedAt.slice(0, 10)
  ) {
    issues.push(
      issue(
        "decision18-batch-audit-cutoff",
        "auditCutoffDate",
        "auditCutoffDate must be derived from generatedAt's UTC calendar date",
      ),
    );
  }
  if (
    !exactCanonical(receipt.authorityBinding, DECISION_18_AUTHORITY_BINDING)
  ) {
    issues.push(
      issue(
        "decision18-batch-authority-binding",
        "authorityBinding",
        "receipt must bind the exact authorized Decision 18 plan and decision bytes",
      ),
    );
  }
  if (
    !exactCanonical(
      receipt.sourcePolicyBinding,
      FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
    )
  ) {
    issues.push(
      issue(
        "decision18-batch-source-policy-binding",
        "sourcePolicyBinding",
        "receipt must bind the exact immutable nba-v10 policy bytes",
      ),
    );
  }

  const expectedPredecessorIds = DECISION_18_FOLLOW_UP_BATCH_ORDER.slice(
    0,
    batchIndex,
  );
  if (
    options.validatedPredecessors.length !== expectedPredecessorIds.length ||
    options.validatedPredecessors.some(
      (entry, index) => entry.batchId !== expectedPredecessorIds[index],
    )
  ) {
    issues.push(
      issue(
        "decision18-batch-predecessor-state",
        "predecessorReceipts",
        `batch ${options.batchId} requires every earlier validated receipt in order`,
      ),
    );
  } else {
    const expectedPredecessors = options.validatedPredecessors.map((entry) => ({
      batchId: entry.batchId,
      path: entry.path,
      sha256: entry.receiptDigest,
    }));
    if (!exactCanonical(receipt.predecessorReceipts, expectedPredecessors)) {
      issues.push(
        issue(
          "decision18-batch-predecessor-binding",
          "predecessorReceipts",
          `batch ${options.batchId} must bind every earlier receipt's exact path and digest`,
        ),
      );
    }
    if (
      options.validatedPredecessors.some(
        (entry) => entry.receipt.generatedAt > receipt.generatedAt,
      )
    ) {
      issues.push(
        issue(
          "decision18-batch-predecessor-time-order",
          "generatedAt",
          `batch ${options.batchId} cannot predate one of its completed predecessors`,
        ),
      );
    }
  }

  validateExactFileDigestList(
    issues,
    receipt.researchLedgers,
    expectedDecision18BatchResearchLedgers(options.batchId),
    "researchLedgers",
  );
  validateExactFileDigestList(
    issues,
    receipt.sidecars,
    expectedDecision18BatchSidecars(options.batchId),
    "sidecars",
  );
  if (receipt.reviewReport.path !== definition.reportPath) {
    issues.push(
      issue(
        "decision18-batch-report-path",
        "reviewReport.path",
        `batch ${options.batchId} report path must be ${definition.reportPath}`,
      ),
    );
  }

  const evidencePaths = receipt.evidenceFiles.map((entry) => entry.path);
  if (
    !orderedUnique(evidencePaths) ||
    evidencePaths.some(
      (path) =>
        !path.startsWith(definition.evidenceDirectory) ||
        path === definition.evidenceDirectory.slice(0, -1),
    )
  ) {
    issues.push(
      issue(
        "decision18-batch-evidence-inventory",
        "evidenceFiles",
        `evidence files must be unique, ordered, and bounded below ${definition.evidenceDirectory}`,
      ),
    );
  }
  const expectedAllowedPaths = expectedDecision18BatchAllowedPaths(
    options.batchId,
    evidencePaths,
  );
  if (!sameOrderedValues(receipt.allowedPaths, expectedAllowedPaths)) {
    issues.push(
      issue(
        "decision18-batch-allowed-path-inventory",
        "allowedPaths",
        "allowedPaths must exactly equal the canonical batch ledger, sidecar, receipt, report, and evidence inventory",
      ),
    );
  }
  return issues;
}

export interface ParsedDecision18FollowUpBatchReceipt {
  receipt: Decision18FollowUpBatchReceipt | null;
  receiptDigest: string;
  issues: ValidationIssue[];
}

/** Strict duplicate-key-detected canonical parse plus semantic validation. */
export function parseDecision18FollowUpBatchReceiptText(
  text: string,
  options: Decision18BatchReceiptValidationOptions,
): ParsedDecision18FollowUpBatchReceipt {
  const receiptDigest = sha256Hex(text);
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      receipt: null,
      receiptDigest,
      issues: [
        issue(
          "decision18-batch-receipt-parse",
          "",
          error instanceof CanonicalJsonError ? error.message : String(error),
        ),
      ],
    };
  }
  const issues: ValidationIssue[] = [];
  if (canonicalJson(parsed) !== text) {
    issues.push(
      issue(
        "decision18-batch-receipt-not-canonical",
        "",
        "batch receipt bytes must be exact canonical JSON",
      ),
    );
  }
  const structural = decision18FollowUpBatchReceiptSchema.safeParse(parsed);
  if (!structural.success) {
    issues.push(
      ...structural.error.issues.map((entry) =>
        issue(
          "decision18-batch-receipt-schema",
          entry.path.join("."),
          entry.message,
        ),
      ),
    );
  } else {
    issues.push(
      ...validateDecision18FollowUpBatchReceipt(structural.data, options),
    );
  }
  return {
    receipt: issues.length === 0 && structural.success ? structural.data : null,
    receiptDigest,
    issues,
  };
}

export function canonicalDecision18FollowUpBatchReceiptText(
  receipt: Decision18FollowUpBatchReceipt,
): string {
  return canonicalJson(receipt);
}

export interface BuildDecision18FollowUpBatchReceiptInput {
  batchId: Decision18FollowUpBatchId;
  evidenceFiles: readonly Decision18BatchArtifactDigest[];
  generatedAt: string;
  reviewReportSha256: string;
  sha256ByPath: Readonly<Record<string, string>>;
  validatedPredecessors: readonly ValidatedDecision18FollowUpBatchReceipt[];
}

function requiredSha256(
  sha256ByPath: Readonly<Record<string, string>>,
  path: string,
): string {
  const digest = sha256ByPath[path];
  if (digest === undefined || !SHA256_RE.test(digest)) {
    throw new Error(`missing or invalid SHA-256 for ${path}`);
  }
  return digest;
}

/**
 * Deterministically assembles receipt bytes from already validated research
 * outputs. The caller must prove v2 terminal status before invoking a writer;
 * this factory deliberately performs no filesystem mutation.
 */
export function buildDecision18FollowUpBatchReceipt(
  input: BuildDecision18FollowUpBatchReceiptInput,
): Decision18FollowUpBatchReceipt {
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS[input.batchId];
  const evidenceFiles = [...input.evidenceFiles].sort((left, right) =>
    compareCodePoints(left.path, right.path),
  );
  return {
    schemaVersion: DECISION_18_FOLLOW_UP_BATCH_RECEIPT_SCHEMA_VERSION,
    decisionId: "decision-18",
    batchId: input.batchId,
    sequenceNumber: definition.sequenceNumber,
    generatedAt: input.generatedAt,
    auditCutoffDate: input.generatedAt.slice(0, 10),
    authorityBinding: { ...DECISION_18_AUTHORITY_BINDING },
    sourcePolicyBinding: { ...FOLLOW_UP_SOURCE_POLICY_V10_BINDING },
    membership: [...definition.membership],
    auditUnitCount: definition.membership.length * 4,
    predecessorReceipts: input.validatedPredecessors.map((entry) => ({
      batchId: entry.batchId,
      path: entry.path,
      sha256: entry.receiptDigest,
    })),
    researchLedgers: expectedDecision18BatchResearchLedgers(input.batchId).map(
      (entry) => ({
        ...entry,
        sha256: requiredSha256(input.sha256ByPath, entry.path),
      }),
    ),
    sidecars: expectedDecision18BatchSidecars(input.batchId).map((entry) => ({
      ...entry,
      sha256: requiredSha256(input.sha256ByPath, entry.path),
    })),
    reviewReport: {
      path: definition.reportPath,
      sha256: input.reviewReportSha256,
    },
    evidenceFiles,
    allowedPaths: expectedDecision18BatchAllowedPaths(
      input.batchId,
      evidenceFiles.map((entry) => entry.path),
    ),
  };
}
