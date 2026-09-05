/**
 * Canonical review-set manifests. Version 1 remains a byte-stable historical
 * contract for the already approved clinical core. Active version 2 keeps
 * that core lineage intact and separately binds Decision 17 pending follow-up
 * drafts plus the exact authoring authority that permitted those drafts.
 */

import { z } from "astro/zod";
import {
  canonicalJson,
  CanonicalJsonError,
  compareCodePoints,
  isValidUtcTimestamp,
  issue,
  parseStrictJson,
  SHA256_RE,
  sha256Hex,
  type ValidationIssue,
} from "../contracts/canonical";
import { computeCaseContentDigest } from "../cases/digest";
import { computeInjuryOverviewDigest } from "../cases/injury-overview-digest";
import { computeQuarterlyUpdateDigest } from "../cases/update-digest";
import type { InjuryCase } from "../contracts/case";
import type { InjuryOverview } from "../contracts/injury-overview";
import type { QuarterlyUpdate } from "../contracts/update";
import {
  resolveSourceManifestBinding,
  type SourceManifestRegistryV1,
} from "../contracts/source-manifest-registry";

export const REVIEW_SET_V1_MANIFEST_PATH = "review/review-set.v1.json";
export const REVIEW_SET_V2_MANIFEST_PATH = "review/review-set.v2.json";
/** Active governed review-set path. There is deliberately no v1 fallback. */
export const REVIEW_SET_MANIFEST_PATH = REVIEW_SET_V2_MANIFEST_PATH;
export const REVIEW_SET_ROUTE = "/review/review-set.json";

export const DECISION_17_PLAN_PATH =
  "docs/superpowers/plans/2026-08-14-decision-17-case-filter-and-followup-notes.md" as const;
export const DECISION_17_PLAN_SHA256 =
  "845f2b6b694ace14fc65cf086c7fce95985acfb4d0f562dfaaab1f357e84078e" as const;
export const DECISION_17_AUTHORIZATION_PATH =
  "docs/decisions/2026-08-14-decision-17-case-filter-and-followup-notes-authorization.v1.json" as const;
export const DECISION_17_AUTHORIZATION_SHA256 =
  "cdb2b5838d66d50c74ac82346c06a4c1096d52422fa767e6b64d2f22c9ba8080" as const;
export const DECISION_17_EXECUTION_ROLE =
  "decision-17-case-filter-and-followup-notes" as const;
export const DECISION_17_EXECUTION_SCOPE_ID =
  "decision-17-case-filter-and-followup-notes-only" as const;
export const DECISION_17_OPENED_SCOPE_IDS = [
  "medical-content-authoring",
] as const;
export const DECISION_17_CLOSED_SCOPE_IDS = [
  "deployment",
  "external-account-mutation",
  "hosting-service-mutation",
  "indexing",
  "medical-review-decision",
  "public-release",
  "remote-repository-mutation",
] as const;

const sha256Lower = z.string().regex(SHA256_RE);
const nonEmpty = z.string().min(1);
const gitCommit = z.string().regex(/^[0-9a-f]{40}$/);

export const reviewSetCaseSchema = z.strictObject({
  caseId: nonEmpty,
  clinicalDigest: sha256Lower,
  origin: z.strictObject({
    candidateId: nonEmpty,
    manifestId: nonEmpty,
    manifestDigest: sha256Lower,
    entryDigest: sha256Lower,
    sourceReviewDecisionDigest: sha256Lower,
    sourcePolicyVersion: nonEmpty,
  }),
});

export const reviewSetManifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  manifestType: z.literal("review-set"),
  contentCommit: gitCommit,
  cases: z.array(reviewSetCaseSchema),
  sourceBatches: z.array(
    z.strictObject({
      manifestId: nonEmpty,
      manifestDigest: sha256Lower,
      sourceReviewDecisionDigest: sha256Lower,
    }),
  ),
  overviews: z.array(
    z.strictObject({ injuryCode: nonEmpty, overviewDigest: sha256Lower }),
  ),
  currentUpdate: z
    .strictObject({ updateId: nonEmpty, updateDigest: sha256Lower })
    .nullable(),
  contentAuthoritySnapshotDigest: sha256Lower,
  rendererTreeDigest: sha256Lower,
  supportingDataDigest: sha256Lower,
});
export type ReviewSetManifest = z.infer<typeof reviewSetManifestSchema>;
/** Explicit historical aliases; existing v1 consumers remain supported. */
export const reviewSetManifestV1Schema = reviewSetManifestSchema;
export type ReviewSetManifestV1 = ReviewSetManifest;

export const decision17AuthoringAuthoritySchema = z.strictObject({
  planPath: z.literal(DECISION_17_PLAN_PATH),
  planSha256: z.literal(DECISION_17_PLAN_SHA256),
  authorizationPath: z.literal(DECISION_17_AUTHORIZATION_PATH),
  authorizationSha256: z.literal(DECISION_17_AUTHORIZATION_SHA256),
  role: z.literal(DECISION_17_EXECUTION_ROLE),
  executionScopeId: z.literal(DECISION_17_EXECUTION_SCOPE_ID),
  openedScopeIds: z.tuple([z.literal("medical-content-authoring")]),
  closedScopeIds: z.tuple([
    z.literal("deployment"),
    z.literal("external-account-mutation"),
    z.literal("hosting-service-mutation"),
    z.literal("indexing"),
    z.literal("medical-review-decision"),
    z.literal("public-release"),
    z.literal("remote-repository-mutation"),
  ]),
  medicalReviewDecisionAuthorized: z.literal(false),
});
export type Decision17AuthoringAuthority = z.infer<
  typeof decision17AuthoringAuthoritySchema
>;

export const DECISION_17_AUTHORING_AUTHORITY = Object.freeze({
  planPath: DECISION_17_PLAN_PATH,
  planSha256: DECISION_17_PLAN_SHA256,
  authorizationPath: DECISION_17_AUTHORIZATION_PATH,
  authorizationSha256: DECISION_17_AUTHORIZATION_SHA256,
  role: DECISION_17_EXECUTION_ROLE,
  executionScopeId: DECISION_17_EXECUTION_SCOPE_ID,
  openedScopeIds: [...DECISION_17_OPENED_SCOPE_IDS],
  closedScopeIds: [...DECISION_17_CLOSED_SCOPE_IDS],
  medicalReviewDecisionAuthorized: false,
} satisfies Decision17AuthoringAuthority);

export const reviewSetV2CaseSchema = reviewSetCaseSchema.extend({
  approvedReview: z.strictObject({
    status: z.literal("approved"),
    reviewerName: nonEmpty,
    reviewerQualification: nonEmpty,
    reviewedAt: nonEmpty.refine(isValidUtcTimestamp, {
      message: "must be a valid UTC timestamp",
    }),
    reviewedContentDigest: sha256Lower,
  }),
  followUp: z.strictObject({
    sidecarPath: z
      .string()
      .regex(/^src\/content\/follow-ups\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/),
    draftDigest: sha256Lower,
    status: z.enum(["pending-owner-signoff", "owner-approved"]),
    sourcePolicyVersion: z.literal("nba-v10"),
  }),
});

export const reviewSetManifestV2Schema = z.strictObject({
  schemaVersion: z.literal(2),
  manifestType: z.literal("review-set"),
  contentCommit: gitCommit,
  cases: z.array(reviewSetV2CaseSchema),
  sourceBatches: z.array(
    z.strictObject({
      manifestId: nonEmpty,
      manifestDigest: sha256Lower,
      sourceReviewDecisionDigest: sha256Lower,
    }),
  ),
  overviews: z.array(
    z.strictObject({ injuryCode: nonEmpty, overviewDigest: sha256Lower }),
  ),
  currentUpdate: z
    .strictObject({ updateId: nonEmpty, updateDigest: sha256Lower })
    .nullable(),
  approvedCoreContentAuthoritySnapshotDigest: sha256Lower,
  contentAuthoritySnapshotDigest: sha256Lower,
  authoringAuthority: decision17AuthoringAuthoritySchema,
  authoringAuthoritySnapshotDigest: sha256Lower,
  rendererTreeDigest: sha256Lower,
  supportingDataDigest: sha256Lower,
});
export type ReviewSetManifestV2 = z.infer<typeof reviewSetManifestV2Schema>;
export type AnyReviewSetManifest = ReviewSetManifestV1 | ReviewSetManifestV2;

export class ReviewSetError extends Error {}

/** Canonical digest of the exact D17 authority projection stored in v2. */
export function computeDecision17AuthoringAuthoritySnapshotDigest(
  authority: Decision17AuthoringAuthority,
): string {
  const parsed = decision17AuthoringAuthoritySchema.safeParse(authority);
  if (!parsed.success) {
    throw new ReviewSetError(
      `invalid Decision 17 authoring authority: ${parsed.error.issues
        .map((entry) => `${entry.path.join(".")}: ${entry.message}`)
        .join("; ")}`,
    );
  }
  return sha256Hex(
    canonicalJson({
      schemaVersion: 1,
      digestType: "decision-17-authoring-authority-snapshot",
      authority: parsed.data,
    }),
  );
}

/**
 * V2 content authority extends, rather than rewrites, the frozen approved-core
 * authority. The full D17 authoring projection is part of this digest while
 * the historical core digest remains independently visible.
 */
export function computeReviewSetV2ContentAuthoritySnapshotDigest(
  approvedCoreContentAuthoritySnapshotDigest: string,
  authority: Decision17AuthoringAuthority,
): string {
  if (!SHA256_RE.test(approvedCoreContentAuthoritySnapshotDigest)) {
    throw new ReviewSetError(
      "approved-core content-authority snapshot must be a lowercase SHA-256 digest",
    );
  }
  const parsed = decision17AuthoringAuthoritySchema.safeParse(authority);
  if (!parsed.success) {
    throw new ReviewSetError(
      `invalid Decision 17 authoring authority: ${parsed.error.issues
        .map((entry) => `${entry.path.join(".")}: ${entry.message}`)
        .join("; ")}`,
    );
  }
  return sha256Hex(
    canonicalJson({
      schemaVersion: 2,
      digestType: "review-set-content-authority-snapshot",
      approvedCoreContentAuthoritySnapshotDigest,
      authoringAuthority: parsed.data,
    }),
  );
}

/**
 * An explicit sorted projection of only the bound spec, controller, platform
 * plan, source-discovery plans that produced a referenced batch, the active
 * authoring plan, and an authorized content-correction plan — each with its
 * document digest and any execution-decision digest required for that content
 * state. It excludes the mutable whole-file plan-binding digest and
 * hosting/photo/public roles, so operational authority cannot rewrite the
 * clinical snapshot.
 */
export interface ContentAuthorityDocument {
  role: string;
  path: string;
  documentSha256: string;
  executionDecisionSha256: string | null;
}

export function computeContentAuthoritySnapshotDigest(
  documents: readonly ContentAuthorityDocument[],
): string {
  const sorted = [...documents]
    .map((document) => ({ ...document }))
    .sort((a, b) =>
      compareCodePoints(`${a.role} ${a.path}`, `${b.role} ${b.path}`),
    );
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1]!;
    const current = sorted[i]!;
    if (previous.role === current.role && previous.path === current.path) {
      throw new ReviewSetError(
        `duplicate authority document ${current.role} ${current.path}`,
      );
    }
  }
  return sha256Hex(
    canonicalJson({
      schemaVersion: 1,
      digestType: "content-authority-snapshot",
      documents: sorted,
    }),
  );
}

export interface ReviewSetBuildInput {
  contentCommit: string;
  cases: readonly InjuryCase[];
  overviews: readonly InjuryOverview[];
  currentUpdate: QuarterlyUpdate | null;
  registry: SourceManifestRegistryV1;
  contentAuthoritySnapshotDigest: string;
  rendererTreeDigest: string;
  supportingDataDigest: string;
}

/**
 * Builds the canonical manifest. Every case origin binding is resolved
 * through the append-only registry (failing closed on stale or superseded
 * bindings) and only referenced batches enter `sourceBatches`.
 */
export function buildReviewSetManifest(
  input: ReviewSetBuildInput,
): ReviewSetManifest {
  const cases = [...input.cases]
    .sort((a, b) => compareCodePoints(a.id, b.id))
    .map((record) => {
      resolveSourceManifestBinding(
        input.registry,
        record.sourceManifestBinding,
      );
      return {
        caseId: record.id,
        clinicalDigest: computeCaseContentDigest(record),
        origin: {
          candidateId: record.sourceManifestBinding.candidateId,
          manifestId: record.sourceManifestBinding.manifestId,
          manifestDigest: record.sourceManifestBinding.manifestDigest,
          entryDigest: record.sourceManifestBinding.entryDigest,
          sourceReviewDecisionDigest:
            record.sourceManifestBinding.sourceReviewDecisionDigest,
          sourcePolicyVersion: record.sourceManifestBinding.sourcePolicyVersion,
        },
      };
    });
  const batchByManifestId = new Map<
    string,
    {
      manifestId: string;
      manifestDigest: string;
      sourceReviewDecisionDigest: string;
    }
  >();
  for (const entry of cases) {
    batchByManifestId.set(entry.origin.manifestId, {
      manifestId: entry.origin.manifestId,
      manifestDigest: entry.origin.manifestDigest,
      sourceReviewDecisionDigest: entry.origin.sourceReviewDecisionDigest,
    });
  }
  const sourceBatches = [...batchByManifestId.values()].sort((a, b) =>
    compareCodePoints(a.manifestId, b.manifestId),
  );
  const overviews = [...input.overviews]
    .sort((a, b) => compareCodePoints(a.injuryCode, b.injuryCode))
    .map((overview) => ({
      injuryCode: overview.injuryCode,
      overviewDigest: computeInjuryOverviewDigest(overview),
    }));
  return {
    schemaVersion: 1,
    manifestType: "review-set",
    contentCommit: input.contentCommit,
    cases,
    sourceBatches,
    overviews,
    currentUpdate:
      input.currentUpdate === null
        ? null
        : {
            updateId: input.currentUpdate.id,
            updateDigest: computeQuarterlyUpdateDigest(input.currentUpdate),
          },
    contentAuthoritySnapshotDigest: input.contentAuthoritySnapshotDigest,
    rendererTreeDigest: input.rendererTreeDigest,
    supportingDataDigest: input.supportingDataDigest,
  };
}

/** Explicit historical builder alias. */
export const buildReviewSetManifestV1 = buildReviewSetManifest;

export interface ReviewSetV2FollowUpBinding {
  status?: "pending-owner-signoff" | "owner-approved";
  caseId: string;
  sidecarPath: string;
  draftDigest: string;
}

export interface ReviewSetV2BuildInput extends ReviewSetBuildInput {
  followUps: readonly ReviewSetV2FollowUpBinding[];
  authoringAuthority: Decision17AuthoringAuthority;
}

/**
 * Builds active v2 while preserving the v1 clinical/source projection exactly.
 * The existing approved review and the pending follow-up are separate sibling
 * bindings; neither digest can substitute for the other.
 */
export function buildReviewSetManifestV2(
  input: ReviewSetV2BuildInput,
): ReviewSetManifestV2 {
  const v1 = buildReviewSetManifest(input);
  const followUpByCaseId = new Map<string, ReviewSetV2FollowUpBinding>();
  const sidecarPaths = new Set<string>();
  for (const followUp of input.followUps) {
    if (followUpByCaseId.has(followUp.caseId)) {
      throw new ReviewSetError(
        `duplicate follow-up binding for case ${followUp.caseId}`,
      );
    }
    if (sidecarPaths.has(followUp.sidecarPath)) {
      throw new ReviewSetError(
        `duplicate follow-up sidecar path ${followUp.sidecarPath}`,
      );
    }
    followUpByCaseId.set(followUp.caseId, followUp);
    sidecarPaths.add(followUp.sidecarPath);
  }
  if (followUpByCaseId.size !== input.cases.length) {
    throw new ReviewSetError(
      `follow-up coverage mismatch: ${followUpByCaseId.size} bindings for ${input.cases.length} cases`,
    );
  }
  const recordById = new Map(input.cases.map((record) => [record.id, record]));
  const cases = v1.cases.map((entry) => {
    const record = recordById.get(entry.caseId);
    const followUp = followUpByCaseId.get(entry.caseId);
    if (record === undefined || followUp === undefined) {
      throw new ReviewSetError(`missing v2 binding for case ${entry.caseId}`);
    }
    if (
      record.status !== "approved" ||
      record.review.status !== "approved" ||
      record.review.reviewedContentDigest !== entry.clinicalDigest
    ) {
      throw new ReviewSetError(
        `case ${entry.caseId} is not bound to its exact approved clinical digest`,
      );
    }
    followUpByCaseId.delete(entry.caseId);
    return {
      ...entry,
      approvedReview: {
        status: record.review.status,
        reviewerName: record.review.reviewerName,
        reviewerQualification: record.review.reviewerQualification,
        reviewedAt: record.review.reviewedAt,
        reviewedContentDigest: record.review.reviewedContentDigest,
      },
      followUp: {
        sidecarPath: followUp.sidecarPath,
        draftDigest: followUp.draftDigest,
        status: followUp.status ?? "pending-owner-signoff",
        sourcePolicyVersion: "nba-v10" as const,
      },
    };
  });
  if (followUpByCaseId.size > 0) {
    throw new ReviewSetError(
      `follow-up bindings contain unknown cases: ${[
        ...followUpByCaseId.keys(),
      ].join(", ")}`,
    );
  }
  const authority = decision17AuthoringAuthoritySchema.parse(
    input.authoringAuthority,
  );
  const manifest = {
    ...v1,
    schemaVersion: 2 as const,
    cases,
    approvedCoreContentAuthoritySnapshotDigest:
      v1.contentAuthoritySnapshotDigest,
    contentAuthoritySnapshotDigest:
      computeReviewSetV2ContentAuthoritySnapshotDigest(
        v1.contentAuthoritySnapshotDigest,
        authority,
      ),
    authoringAuthority: authority,
    authoringAuthoritySnapshotDigest:
      computeDecision17AuthoringAuthoritySnapshotDigest(authority),
  };
  const parsed = reviewSetManifestV2Schema.safeParse(manifest);
  if (!parsed.success) {
    throw new ReviewSetError(
      `invalid review-set v2: ${parsed.error.issues
        .map((entry) => `${entry.path.join(".")}: ${entry.message}`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

/** Canonical byte string served verbatim at the review-only route. */
export function canonicalReviewSetBytes(
  manifest: AnyReviewSetManifest,
): string {
  return canonicalJson(manifest);
}

/** The overall review-set digest printed on every review page. */
export function computeReviewSetDigest(manifest: AnyReviewSetManifest): string {
  return sha256Hex(canonicalReviewSetBytes(manifest));
}

export interface ParsedReviewSetManifest {
  manifest: ReviewSetManifest | null;
  /** SHA-256 of the exact supplied bytes, valid even on failure. */
  reviewSetDigest: string;
  issues: ValidationIssue[];
}

/** Strict duplicate-key-detected canonical-bytes parse of a manifest. */
export function parseReviewSetManifestBytes(
  bytes: Uint8Array | string,
): ParsedReviewSetManifest {
  const reviewSetDigest = sha256Hex(bytes);
  const text =
    typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      manifest: null,
      reviewSetDigest,
      issues: [
        issue(
          "review-set-parse",
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
        "review-set-not-canonical",
        "",
        "review-set bytes must be exact canonical JSON",
      ),
    );
  }
  const result = reviewSetManifestSchema.safeParse(parsed);
  if (!result.success) {
    issues.push(
      ...result.error.issues.map((zodIssue) =>
        issue("review-set-schema", zodIssue.path.join("."), zodIssue.message),
      ),
    );
  }
  if (issues.length > 0 || !result.success) {
    return { manifest: null, reviewSetDigest, issues };
  }
  const manifest = result.data;
  for (let i = 1; i < manifest.cases.length; i += 1) {
    if (
      compareCodePoints(
        manifest.cases[i - 1]!.caseId,
        manifest.cases[i]!.caseId,
      ) >= 0
    ) {
      issues.push(
        issue(
          "review-set-order",
          `cases[${i}]`,
          "review-set cases must be strictly sorted by caseId",
        ),
      );
    }
  }
  for (let i = 1; i < manifest.sourceBatches.length; i += 1) {
    if (
      compareCodePoints(
        manifest.sourceBatches[i - 1]!.manifestId,
        manifest.sourceBatches[i]!.manifestId,
      ) >= 0
    ) {
      issues.push(
        issue(
          "review-set-order",
          `sourceBatches[${i}]`,
          "review-set source batches must be strictly sorted by manifestId",
        ),
      );
    }
  }
  if (issues.length > 0) return { manifest: null, reviewSetDigest, issues };
  return { manifest, reviewSetDigest, issues };
}

/** Explicit historical parser alias. */
export const parseReviewSetManifestV1Bytes = parseReviewSetManifestBytes;

export interface ParsedReviewSetManifestV2 {
  manifest: ReviewSetManifestV2 | null;
  /** SHA-256 of the exact supplied bytes, valid even on failure. */
  reviewSetDigest: string;
  issues: ValidationIssue[];
}

/** Strict active-v2 parser; it never falls back to or upgrades v1 bytes. */
export function parseReviewSetManifestV2Bytes(
  bytes: Uint8Array | string,
): ParsedReviewSetManifestV2 {
  const reviewSetDigest = sha256Hex(bytes);
  const text =
    typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      manifest: null,
      reviewSetDigest,
      issues: [
        issue(
          "review-set-v2-parse",
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
        "review-set-v2-not-canonical",
        "",
        "review-set v2 bytes must be exact canonical JSON",
      ),
    );
  }
  const result = reviewSetManifestV2Schema.safeParse(parsed);
  if (!result.success) {
    issues.push(
      ...result.error.issues.map((zodIssue) =>
        issue(
          "review-set-v2-schema",
          zodIssue.path.join("."),
          zodIssue.message,
        ),
      ),
    );
  }
  if (issues.length > 0 || !result.success) {
    return { manifest: null, reviewSetDigest, issues };
  }
  const manifest = result.data;
  if (
    computeDecision17AuthoringAuthoritySnapshotDigest(
      manifest.authoringAuthority,
    ) !== manifest.authoringAuthoritySnapshotDigest
  ) {
    issues.push(
      issue(
        "review-set-v2-authority-digest",
        "authoringAuthoritySnapshotDigest",
        "authoring authority snapshot digest does not match its canonical projection",
      ),
    );
  }
  if (
    computeReviewSetV2ContentAuthoritySnapshotDigest(
      manifest.approvedCoreContentAuthoritySnapshotDigest,
      manifest.authoringAuthority,
    ) !== manifest.contentAuthoritySnapshotDigest
  ) {
    issues.push(
      issue(
        "review-set-v2-content-authority-digest",
        "contentAuthoritySnapshotDigest",
        "v2 content-authority snapshot must bind the approved core and exact Decision 17 authoring authority",
      ),
    );
  }
  for (let i = 1; i < manifest.cases.length; i += 1) {
    if (
      compareCodePoints(
        manifest.cases[i - 1]!.caseId,
        manifest.cases[i]!.caseId,
      ) >= 0
    ) {
      issues.push(
        issue(
          "review-set-v2-order",
          `cases[${i}]`,
          "review-set v2 cases must be strictly sorted by caseId",
        ),
      );
    }
  }
  for (let i = 1; i < manifest.sourceBatches.length; i += 1) {
    if (
      compareCodePoints(
        manifest.sourceBatches[i - 1]!.manifestId,
        manifest.sourceBatches[i]!.manifestId,
      ) >= 0
    ) {
      issues.push(
        issue(
          "review-set-v2-order",
          `sourceBatches[${i}]`,
          "review-set v2 source batches must be strictly sorted by manifestId",
        ),
      );
    }
  }
  const sidecarPaths = new Set<string>();
  for (const [index, entry] of manifest.cases.entries()) {
    if (entry.approvedReview.reviewedContentDigest !== entry.clinicalDigest) {
      issues.push(
        issue(
          "review-set-v2-approved-digest",
          `cases[${index}].approvedReview.reviewedContentDigest`,
          "approved review digest must equal the unchanged clinical digest",
        ),
      );
    }
    if (sidecarPaths.has(entry.followUp.sidecarPath)) {
      issues.push(
        issue(
          "review-set-v2-follow-up-path",
          `cases[${index}].followUp.sidecarPath`,
          "follow-up sidecar paths must be unique across review-set cases",
        ),
      );
    }
    sidecarPaths.add(entry.followUp.sidecarPath);
  }
  if (issues.length > 0) return { manifest: null, reviewSetDigest, issues };
  return { manifest, reviewSetDigest, issues };
}
