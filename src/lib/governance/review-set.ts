/**
 * Canonical review-set manifest: the frozen inventory a medical reviewer
 * signs. It binds every review case ID/full clinical digest with its frozen
 * origin source-entry binding, the sorted unique set of referenced immutable
 * source-batch manifest/decision digests validated through the append-only
 * registry, the three injury-overview digests, the current update, the clean
 * pre-review content commit, a stable content-authority snapshot digest, a
 * renderer-tree digest, and a supporting-data digest. It never binds a
 * mutable singular all-time manifest or an unreferenced future batch.
 */

import { z } from "astro/zod";
import {
  canonicalJson,
  CanonicalJsonError,
  compareCodePoints,
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

export const REVIEW_SET_MANIFEST_PATH = "review/review-set.v1.json";
export const REVIEW_SET_ROUTE = "/review/review-set.json";

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

export class ReviewSetError extends Error {}

/**
 * An explicit sorted projection of only the bound spec, controller, platform
 * plan, source-discovery plans that produced a referenced batch, and the
 * active authoring plan — each with its document digest and any
 * execution-decision digest required to reach G3. It excludes the mutable
 * whole-file plan-binding digest and all future hosting/public roles, so
 * appending a later operational plan neither rewrites history nor invalidates
 * a completed clinical review.
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

/** Canonical byte string served verbatim at the review-only route. */
export function canonicalReviewSetBytes(manifest: ReviewSetManifest): string {
  return canonicalJson(manifest);
}

/** The overall review-set digest printed on every review page. */
export function computeReviewSetDigest(manifest: ReviewSetManifest): string {
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
