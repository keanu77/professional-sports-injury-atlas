/**
 * Generates the canonical review-set manifest for a clean, real G3 content
 * commit. During foundation work there is no real authored content, so this
 * script refuses to fabricate a manifest; a synthetic fixture in the unit
 * tests proves the contract instead.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseStrictJson, sha256Hex } from "../src/lib/contracts/canonical";
import { defaultTaxonomyRegistries } from "../src/lib/contracts/taxonomy";
import {
  buildReviewSetManifest,
  canonicalReviewSetBytes,
  computeContentAuthoritySnapshotDigest,
  computeReviewSetDigest,
  REVIEW_SET_MANIFEST_PATH,
  type ContentAuthorityDocument,
} from "../src/lib/governance/review-set";
import {
  computeRendererTreeDigest,
  computeSupportingDataDigest,
  type SiteSourceBatchTuple,
  type SupportingDataRegistryEntryProjection,
  type TrackedFileDigest,
} from "../src/lib/governance/site-digest";
import type { SourceManifestRegistryV1 } from "../src/lib/contracts/source-manifest-registry";
import type { InjuryCase } from "../src/lib/contracts/case";
import { selectMedicallyApprovedCases } from "../src/lib/cases/selectors";
import { validateCaseSourceBinding } from "../src/lib/contracts/cross-validation";
import {
  loadContentCollections,
  loadRealRegistry,
  registryArtifactLoader,
  REPO_ROOT,
} from "./check-content";
import { parseRtpCourseSummariesBytes } from "../src/lib/rtp/course-links";
import {
  professionalCourseLinksSchema,
  COURSE_LINKS_DATA_PATH,
  RTP_COURSE_SUMMARIES_DATA_PATH,
} from "../src/lib/rtp/course-links";

function git(root: string, args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

/** Current HEAD commit plus dirty state. */
export function currentBuildCommit(root: string = REPO_ROOT): {
  commit: string | null;
  dirty: boolean;
} {
  try {
    const commit = git(root, ["rev-parse", "HEAD"]);
    const status = git(root, ["status", "--porcelain"]);
    return { commit, dirty: status !== "" };
  } catch {
    return { commit: null, dirty: true };
  }
}

/** Hashes every Git-tracked file for the renderer-tree digest. */
export function trackedFileDigests(
  root: string = REPO_ROOT,
): TrackedFileDigest[] {
  const paths = git(root, ["ls-files", "-z"]).split("\0").filter(Boolean);
  return paths.map((path) => ({
    path,
    sha256: sha256Hex(readFileSync(join(root, path))),
  }));
}

/** Renderer-tree digest of the current working tree's tracked files. */
export function currentRendererTreeDigest(root: string = REPO_ROOT): string {
  return computeRendererTreeDigest(trackedFileDigests(root));
}

/** Supporting-data digest of taxonomy, schemas, referenced batches, catalog. */
export function currentSupportingDataDigest(
  root: string,
  registry: SourceManifestRegistryV1,
  cases: readonly InjuryCase[],
): string {
  const referencedManifestIds = new Set(
    cases.map((record) => record.sourceManifestBinding.manifestId),
  );
  const sourceBatches: SiteSourceBatchTuple[] = cases.map((record) => ({
    manifestId: record.sourceManifestBinding.manifestId,
    manifestDigest: record.sourceManifestBinding.manifestDigest,
    sourceReviewDecisionDigest:
      record.sourceManifestBinding.sourceReviewDecisionDigest,
    entryDigest: record.sourceManifestBinding.entryDigest,
  }));
  const registryEntries: SupportingDataRegistryEntryProjection[] =
    registry.entries
      .filter((entry) => referencedManifestIds.has(entry.manifestId))
      .map((entry) => ({
        manifestId: entry.manifestId,
        manifestPath: entry.manifestPath,
        manifestDigest: entry.manifestDigest,
        sourceReviewDecisionPath: entry.sourceReviewDecisionPath,
        sourceReviewDecisionDigest: entry.sourceReviewDecisionDigest,
        sourcePolicyVersion: entry.sourcePolicyVersion,
      }));
  const schemasDir = join(root, "schemas");
  const schemas: TrackedFileDigest[] = existsSync(schemasDir)
    ? git(root, ["ls-files", "-z", "schemas"])
        .split("\0")
        .filter(Boolean)
        .map((path) => ({
          path,
          sha256: sha256Hex(readFileSync(join(root, path))),
        }))
    : [];
  const linksParsed = professionalCourseLinksSchema.parse(
    parseStrictJson(readFileSync(join(root, COURSE_LINKS_DATA_PATH), "utf8")),
  );
  const summariesParsed = parseRtpCourseSummariesBytes(
    readFileSync(join(root, RTP_COURSE_SUMMARIES_DATA_PATH), "utf8"),
  );
  const contentDigestBySlug = new Map(
    (summariesParsed.summaries?.courses ?? []).map((course) => [
      course.slug,
      course.contentDigest,
    ]),
  );
  const titleBySlug = new Map(
    (summariesParsed.summaries?.courses ?? []).map((course) => [
      course.slug,
      course.titleZh,
    ]),
  );
  return computeSupportingDataDigest({
    taxonomy: JSON.parse(JSON.stringify(defaultTaxonomyRegistries)),
    schemas,
    sourceBatches,
    registryEntries,
    courseCatalog: linksParsed.links.map((link) => ({
      courseKey: link.key,
      catalogSlug: link.catalogSlug,
      injuryCode: link.injuryCode,
      scopeNote: link.scopeNote,
      titleZh: titleBySlug.get(link.catalogSlug) ?? "",
      contentDigest:
        contentDigestBySlug.get(link.catalogSlug) ?? "0".repeat(64),
    })),
  });
}

const CONTENT_AUTHORITY_PLAN_ROLES = new Set([
  "platform-foundation",
  "nba-injury-case-source-discovery",
  "nba-injury-case-authoring",
]);

/**
 * Content-authority snapshot from the plan binding: only the bound spec,
 * controller, platform foundation, active source discovery, and active
 * authoring roles (with their execution-decision digests). The mutable
 * whole-file binding and operational hosting/public roles are excluded.
 */
export function currentContentAuthoritySnapshotDigest(
  root: string = REPO_ROOT,
): string {
  const bindingPath = join(root, "docs/decisions/plan-binding.v1.json");
  const binding = parseStrictJson(readFileSync(bindingPath, "utf8")) as {
    documents: Array<{
      documentType: string;
      lifecycle: string;
      path: string;
      sha256: string;
      executionAuthorization: {
        status: string;
        role: string;
        decisionSha256: string | null;
      } | null;
    }>;
  };
  const documents: ContentAuthorityDocument[] = [];
  for (const document of binding.documents) {
    if (document.lifecycle !== "active") continue;
    if (
      document.documentType === "specification" ||
      document.documentType === "execution-controller"
    ) {
      documents.push({
        role: document.documentType,
        path: document.path,
        documentSha256: document.sha256,
        executionDecisionSha256: null,
      });
      continue;
    }
    const authorization = document.executionAuthorization;
    if (
      document.documentType === "plan" &&
      authorization !== null &&
      authorization.status === "authorized" &&
      CONTENT_AUTHORITY_PLAN_ROLES.has(authorization.role)
    ) {
      documents.push({
        // Keep the established digest projection stable; the execution role
        // selects eligible plans, while `plan` remains the canonical document
        // role already frozen into completed review-set snapshots.
        role: "plan",
        path: document.path,
        documentSha256: document.sha256,
        executionDecisionSha256: authorization.decisionSha256,
      });
    }
  }
  return computeContentAuthoritySnapshotDigest(documents);
}

function main(): void {
  const root = REPO_ROOT;
  const build = currentBuildCommit(root);
  if (build.commit === null || build.dirty) {
    console.error(
      "review-set:generate FAILED — the working tree must be a clean content commit",
    );
    process.exit(1);
  }
  const loaded = loadContentCollections(root);
  if (loaded.issues.length > 0) {
    for (const entry of loaded.issues) {
      console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
    }
    process.exit(1);
  }
  if (loaded.cases.length === 0) {
    console.error(
      "review-set:generate FAILED — refusing to fabricate a review-set manifest before real content authoring (G3); a synthetic fixture proves the contract in unit tests",
    );
    process.exit(1);
  }
  const registryResult = loadRealRegistry(root);
  if (registryResult.registry === null) {
    for (const entry of registryResult.issues) {
      console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
    }
    process.exit(1);
  }
  const cases = loaded.cases.map((entry) => entry.record);
  const medicallyApprovedCases = selectMedicallyApprovedCases(cases);
  if (medicallyApprovedCases.length !== cases.length) {
    const selectedIds = new Set(
      medicallyApprovedCases.map((record) => record.id),
    );
    for (const record of cases) {
      if (!selectedIds.has(record.id)) {
        console.error(
          `review-set:generate FAILED — ${record.id} is outside the current medically approved projection`,
        );
      }
    }
    process.exit(1);
  }
  const sourceBindingIssues = medicallyApprovedCases.flatMap((record) =>
    validateCaseSourceBinding(
      record,
      registryResult.registry!,
      registryArtifactLoader(root),
    ).map((entry) => ({
      ...entry,
      path: `${record.id}.${entry.path}`,
    })),
  );
  if (sourceBindingIssues.length > 0) {
    for (const entry of sourceBindingIssues) {
      console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
    }
    process.exit(1);
  }
  const updates = loaded.updates.map((entry) => entry.record);
  const manifest = buildReviewSetManifest({
    contentCommit: build.commit,
    cases: medicallyApprovedCases,
    overviews: loaded.overviews.map((entry) => entry.record),
    currentUpdate: updates.length === 1 ? updates[0]! : null,
    registry: registryResult.registry,
    contentAuthoritySnapshotDigest: currentContentAuthoritySnapshotDigest(root),
    rendererTreeDigest: currentRendererTreeDigest(root),
    supportingDataDigest: currentSupportingDataDigest(
      root,
      registryResult.registry,
      medicallyApprovedCases,
    ),
  });
  const bytes = canonicalReviewSetBytes(manifest);
  const target = join(root, REVIEW_SET_MANIFEST_PATH);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
  console.log(
    `review-set:generate wrote ${REVIEW_SET_MANIFEST_PATH} digest=${computeReviewSetDigest(manifest)}`,
  );
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
