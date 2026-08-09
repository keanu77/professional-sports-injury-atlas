/**
 * Site-governance record contract, the canonical site digest, and the
 * deterministic public-renderer/supporting-data tree digests.
 *
 * The site digest covers exactly the components listed in the platform plan
 * and excludes the indexing-authorization/publication-decision fields to
 * avoid self-reference. Changing any covered component invalidates an
 * existing `SitePublicationDecisionV1` and indexing authorization.
 */

import { z } from "astro/zod";
import {
  canonicalJson,
  compareCodePoints,
  isValidUtcTimestamp,
  issue,
  SHA256_RE,
  sha256Hex,
  type ValidationIssue,
} from "../contracts/canonical";

export const SITE_GOVERNANCE_DATA_PATH = "src/data/site-governance.v1.json";

export const SITE_STATUSES = [
  "medical-review",
  "private-approved",
  "public-approved",
] as const;
export type SiteStatus = (typeof SITE_STATUSES)[number];

const sha256Lower = z.string().regex(SHA256_RE);
const trimmedNonEmpty = z
  .string()
  .min(1)
  .refine((value) => value === value.trim(), {
    message: "must be trimmed and non-empty",
  });
const httpsUrl = z.string().regex(/^https:\/\/[^\s<>"']+$/);
const utcTimestamp = z
  .string()
  .refine(isValidUtcTimestamp, { message: "must be a valid UTC timestamp" });
const gitCommit = z.string().regex(/^[0-9a-f]{40}$/);

export const indexingAuthorizationSchema = z.strictObject({
  status: z.enum(["not-requested", "requested", "authorized", "revoked"]),
  authorizedBy: trimmedNonEmpty.nullable(),
  authorizedAt: utcTimestamp.nullable(),
  authorizedSiteDigest: sha256Lower.nullable(),
  decisionPath: trimmedNonEmpty.nullable(),
  decisionDigest: sha256Lower.nullable(),
});
export type IndexingAuthorization = z.infer<typeof indexingAuthorizationSchema>;

export const siteGovernanceRecordSchema = z.strictObject({
  schemaVersion: z.literal(1),
  siteStatus: z.enum(SITE_STATUSES),
  allowIndexing: z.boolean(),
  currentUpdateId: trimmedNonEmpty.nullable(),
  currentReviewSetDigest: sha256Lower.nullable(),
  medicalReviewDecisionDigest: sha256Lower.nullable(),
  reviewedContentCommit: gitCommit.nullable(),
  publicRendererTreeDigest: sha256Lower.nullable(),
  baseReleaseDigest: sha256Lower.nullable(),
  baseHistoryBytesDigest: sha256Lower.nullable(),
  publicSiteUrl: httpsUrl.nullable(),
  privacyPolicyUrl: httpsUrl.nullable(),
  rightsPolicyUrl: httpsUrl.nullable(),
  publicRightsPolicyVersion: trimmedNonEmpty.nullable(),
  courseLinkPolicyVersion: trimmedNonEmpty.nullable(),
  indexingAuthorization: indexingAuthorizationSchema,
});
export type SiteGovernanceRecord = z.infer<typeof siteGovernanceRecordSchema>;

/** Validates the parsed governance record shape. */
export function validateSiteGovernanceRecord(
  value: unknown,
): ValidationIssue[] {
  const parsed = siteGovernanceRecordSchema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((zodIssue) =>
      issue(
        "site-governance-schema",
        zodIssue.path.join("."),
        zodIssue.message,
      ),
    );
  }
  const issues: ValidationIssue[] = [];
  const record = parsed.data;
  if (record.allowIndexing && record.siteStatus !== "public-approved") {
    issues.push(
      issue(
        "site-governance-indexing",
        "allowIndexing",
        "allowIndexing requires siteStatus public-approved",
      ),
    );
  }
  return issues;
}

/** One public case-referenced immutable source-batch tuple. */
export interface SiteSourceBatchTuple {
  manifestId: string;
  manifestDigest: string;
  sourceReviewDecisionDigest: string;
  entryDigest: string;
}

export interface SitePublicCaseTuple {
  caseId: string;
  clinicalDigest: string;
  videoSourceDigest: string;
  publicRightsDecisionDigest: string;
}

export interface SiteOverviewTuple {
  injuryCode: string;
  overviewDigest: string;
}

export interface SiteCurrentUpdateTuple {
  updateId: string;
  updateDigest: string;
  publishedAt: string;
}

export interface SiteCourseLinkTuple {
  courseKey: string;
  approvedPublicUrl: string;
  courseGovernanceProjectionDigest: string;
  linkApprovalDecisionDigest: string;
}

/**
 * The exact canonical projection hashed into the site digest. It deliberately
 * excludes the indexing-authorization and publication-decision fields, the
 * later Git commit containing the decision, unreferenced future source
 * batches, and the not-yet-built deployment artifact digest.
 */
export interface SiteDigestInput {
  siteStatus: SiteStatus;
  allowIndexing: boolean;
  reviewedContentCommit: string;
  publicRendererTreeDigest: string;
  sourceBatches: readonly SiteSourceBatchTuple[];
  reviewSetDigest: string;
  medicalReviewDecisionDigest: string;
  publicCases: readonly SitePublicCaseTuple[];
  overviews: readonly SiteOverviewTuple[];
  currentUpdate: SiteCurrentUpdateTuple;
  baseReleaseDigest: string | null;
  baseHistoryBytesDigest: string;
  courseLinks: readonly SiteCourseLinkTuple[];
  publicSiteUrl: string;
  privacyPolicyUrl: string;
  rightsPolicyUrl: string;
  sourcePolicyVersion: string;
  publicRightsPolicyVersion: string;
  courseLinkPolicyVersion: string;
}

function sortedBy<T>(values: readonly T[], key: (value: T) => string): T[] {
  return [...values].sort((a, b) => compareCodePoints(key(a), key(b)));
}

/** Canonical SHA-256 over the explicit sorted site-digest projection. */
export function computeSiteDigest(input: SiteDigestInput): string {
  const payload = {
    schemaVersion: 1,
    digestType: "site-digest",
    siteStatus: input.siteStatus,
    allowIndexing: input.allowIndexing,
    reviewedContentCommit: input.reviewedContentCommit,
    publicRendererTreeDigest: input.publicRendererTreeDigest,
    sourceBatches: sortedBy(
      input.sourceBatches.map((tuple) => ({ ...tuple })),
      (tuple) =>
        `${tuple.manifestId} ${tuple.entryDigest} ${tuple.manifestDigest} ${tuple.sourceReviewDecisionDigest}`,
    ),
    reviewSetDigest: input.reviewSetDigest,
    medicalReviewDecisionDigest: input.medicalReviewDecisionDigest,
    publicCases: sortedBy(
      input.publicCases.map((tuple) => ({ ...tuple })),
      (tuple) => tuple.caseId,
    ),
    overviews: sortedBy(
      input.overviews.map((tuple) => ({ ...tuple })),
      (tuple) => tuple.injuryCode,
    ),
    currentUpdate: { ...input.currentUpdate },
    baseReleaseDigest: input.baseReleaseDigest,
    baseHistoryBytesDigest: input.baseHistoryBytesDigest,
    courseLinks: sortedBy(
      input.courseLinks.map((tuple) => ({ ...tuple })),
      (tuple) => tuple.courseKey,
    ),
    publicSiteUrl: input.publicSiteUrl,
    privacyPolicyUrl: input.privacyPolicyUrl,
    rightsPolicyUrl: input.rightsPolicyUrl,
    sourcePolicyVersion: input.sourcePolicyVersion,
    publicRightsPolicyVersion: input.publicRightsPolicyVersion,
    courseLinkPolicyVersion: input.courseLinkPolicyVersion,
  };
  return sha256Hex(canonicalJson(payload));
}

/* ------------------------------------------------------------------ */
/* Public renderer tree digest                                        */
/* ------------------------------------------------------------------ */

const RENDERER_CODE_RE = /^src\/.*\.(astro|ts|tsx|js|mjs|css)$/;
const RENDERER_SCRIPT_RE = /^scripts\/.*\.(ts|js|mjs)$/;

/** Exact config/lockfile paths always included when tracked. */
export const RENDERER_TREE_EXACT_PATHS: readonly string[] = [
  "package.json",
  "package-lock.json",
  "astro.config.mjs",
  "tsconfig.json",
  "vitest.config.ts",
  "playwright.config.ts",
];

/**
 * Exact-path exclusions for files that would otherwise match the include
 * globs but are bound by their dedicated clinical/site/base/decision digests.
 * Clinical content JSON, plan/decision/review manifests, generated artifacts
 * and workflow-only governance JSON never match the code globs, so no broad
 * wildcard exclusion exists or is permitted.
 */
export const RENDERER_TREE_EXCLUDED_PATHS: readonly string[] = [];

/**
 * True when a Git-tracked path belongs to the deterministic public renderer
 * tree: implementation code under `src/`, everything under `public/`, build
 * and verification scripts, plus the exact config/lockfile list.
 */
export function isRendererTreePath(path: string): boolean {
  if (RENDERER_TREE_EXCLUDED_PATHS.includes(path)) return false;
  if (path.startsWith("src/assets/players/")) return true;
  if (RENDERER_CODE_RE.test(path)) return true;
  if (path.startsWith("public/")) return true;
  if (RENDERER_SCRIPT_RE.test(path)) return true;
  return RENDERER_TREE_EXACT_PATHS.includes(path);
}

export interface TrackedFileDigest {
  path: string;
  sha256: string;
}

export class RendererTreeError extends Error {}

/**
 * Deterministic digest over the sorted tracked-path/byte-digest pairs of the
 * renderer tree. The same algorithm produces both the review-set
 * `rendererTreeDigest` and the governance `publicRendererTreeDigest`; public
 * authorization requires equality between the two.
 */
export function computeRendererTreeDigest(
  trackedFiles: readonly TrackedFileDigest[],
): string {
  const selected = trackedFiles.filter((file) => isRendererTreePath(file.path));
  const paths = new Set<string>();
  for (const file of selected) {
    if (paths.has(file.path)) {
      throw new RendererTreeError(`duplicate tracked path ${file.path}`);
    }
    if (!SHA256_RE.test(file.sha256)) {
      throw new RendererTreeError(`invalid byte digest for ${file.path}`);
    }
    paths.add(file.path);
  }
  const pairs = sortedBy(
    selected.map((file) => ({ path: file.path, sha256: file.sha256 })),
    (file) => file.path,
  );
  return sha256Hex(
    canonicalJson({
      schemaVersion: 1,
      digestType: "renderer-tree",
      files: pairs,
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Supporting-data projection digest                                  */
/* ------------------------------------------------------------------ */

export interface SupportingDataCourseProjection {
  courseKey: string;
  catalogSlug: string;
  injuryCode: string;
  scopeNote: string;
  titleZh: string;
  contentDigest: string;
}

export interface SupportingDataRegistryEntryProjection {
  manifestId: string;
  manifestPath: string;
  manifestDigest: string;
  sourceReviewDecisionPath: string;
  sourceReviewDecisionDigest: string;
  sourcePolicyVersion: string;
}

export interface SupportingDataInput {
  /** Canonical taxonomy registries (already plain data). */
  taxonomy: unknown;
  /** schemas/*.json path + byte digest pairs. */
  schemas: readonly TrackedFileDigest[];
  /** Sorted set of referenced immutable source-batch/decision/entry tuples. */
  sourceBatches: readonly SiteSourceBatchTuple[];
  /** Only the exact registry entries for referenced batches. */
  registryEntries: readonly SupportingDataRegistryEntryProjection[];
  /** Course catalog key/title/scope/content digest projection. */
  courseCatalog: readonly SupportingDataCourseProjection[];
}

/**
 * Binds taxonomy, schemas, the referenced immutable source tuples plus their
 * exact registry entries, and the course-catalog projection. Unreferenced
 * future registry entries do not enter this digest; the full registry still
 * undergoes independent append-only validation.
 */
export function computeSupportingDataDigest(
  input: SupportingDataInput,
): string {
  return sha256Hex(
    canonicalJson({
      schemaVersion: 1,
      digestType: "supporting-data",
      taxonomy: input.taxonomy,
      schemas: sortedBy(
        input.schemas.map((file) => ({ ...file })),
        (file) => file.path,
      ),
      sourceBatches: sortedBy(
        input.sourceBatches.map((tuple) => ({ ...tuple })),
        (tuple) =>
          `${tuple.manifestId} ${tuple.entryDigest} ${tuple.manifestDigest} ${tuple.sourceReviewDecisionDigest}`,
      ),
      registryEntries: sortedBy(
        input.registryEntries.map((entry) => ({ ...entry })),
        (entry) => entry.manifestId,
      ),
      courseCatalog: sortedBy(
        input.courseCatalog.map((course) => ({ ...course })),
        (course) => course.courseKey,
      ),
    }),
  );
}
