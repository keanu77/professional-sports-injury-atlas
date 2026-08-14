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
import { FOLLOW_UP_SOURCE_POLICY_V10_BINDING } from "../src/lib/contracts/case-follow-up";
import { loadFollowUpCorpus } from "../src/lib/cases/follow-up-loader";
import { defaultTaxonomyRegistries } from "../src/lib/contracts/taxonomy";
import {
  buildReviewSetManifestV2,
  canonicalReviewSetBytes,
  computeContentAuthoritySnapshotDigest,
  computeReviewSetV2ContentAuthoritySnapshotDigest,
  computeReviewSetDigest,
  DECISION_17_AUTHORIZATION_PATH,
  DECISION_17_AUTHORIZATION_SHA256,
  DECISION_17_AUTHORING_AUTHORITY,
  DECISION_17_CLOSED_SCOPE_IDS,
  DECISION_17_EXECUTION_ROLE,
  DECISION_17_EXECUTION_SCOPE_ID,
  DECISION_17_PLAN_PATH,
  DECISION_17_PLAN_SHA256,
  REVIEW_SET_MANIFEST_PATH,
  REVIEW_SET_V1_MANIFEST_PATH,
  type ContentAuthorityDocument,
  type Decision17AuthoringAuthority,
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

export const EXPECTED_REVIEW_SET_V1_SHA256 =
  "99f637a0f2195614ff84b9afbdafb236039efcadb4eb7510e66af43f855f58da" as const;
const EXPECTED_CASE_COUNT = 26;

/** Historical v1 is immutable evidence and is never rewritten by this tool. */
export function assertHistoricalReviewSetV1Unchanged(
  root: string = REPO_ROOT,
): void {
  const path = join(root, REVIEW_SET_V1_MANIFEST_PATH);
  if (!existsSync(path)) {
    throw new Error(
      `historical review set is missing: ${REVIEW_SET_V1_MANIFEST_PATH}`,
    );
  }
  const digest = sha256Hex(readFileSync(path));
  if (digest !== EXPECTED_REVIEW_SET_V1_SHA256) {
    throw new Error(
      `historical ${REVIEW_SET_V1_MANIFEST_PATH} changed: expected ${EXPECTED_REVIEW_SET_V1_SHA256}, found ${digest}`,
    );
  }
}

/**
 * Reloads the bound plan and strict authorization bytes before v2 generation.
 * The opened authoring scope is an explicit D17 projection; the seven closed
 * scopes, including medical-review-decision, must match the owner decision.
 */
export function currentDecision17AuthoringAuthority(
  root: string = REPO_ROOT,
): Decision17AuthoringAuthority {
  const planDigest = sha256Hex(readFileSync(join(root, DECISION_17_PLAN_PATH)));
  const authorizationBytes = readFileSync(
    join(root, DECISION_17_AUTHORIZATION_PATH),
  );
  const authorizationDigest = sha256Hex(authorizationBytes);
  if (planDigest !== DECISION_17_PLAN_SHA256) {
    throw new Error(
      `Decision 17 plan digest mismatch: expected ${DECISION_17_PLAN_SHA256}, found ${planDigest}`,
    );
  }
  if (authorizationDigest !== DECISION_17_AUTHORIZATION_SHA256) {
    throw new Error(
      `Decision 17 authorization digest mismatch: expected ${DECISION_17_AUTHORIZATION_SHA256}, found ${authorizationDigest}`,
    );
  }
  const authorization = parseStrictJson(
    authorizationBytes.toString("utf8"),
  ) as {
    executionStatus?: unknown;
    planPath?: unknown;
    planSha256?: unknown;
    role?: unknown;
    executionScopeId?: unknown;
    closedScopeIds?: unknown;
  };
  if (
    authorization.executionStatus !== "authorized" ||
    authorization.planPath !== DECISION_17_PLAN_PATH ||
    authorization.planSha256 !== DECISION_17_PLAN_SHA256 ||
    authorization.role !== DECISION_17_EXECUTION_ROLE ||
    authorization.executionScopeId !== DECISION_17_EXECUTION_SCOPE_ID ||
    JSON.stringify(authorization.closedScopeIds) !==
      JSON.stringify(DECISION_17_CLOSED_SCOPE_IDS)
  ) {
    throw new Error(
      "Decision 17 authorization does not match the exact authorized role, execution scope, plan, and seven closed scopes",
    );
  }
  const binding = parseStrictJson(
    readFileSync(join(root, "docs/decisions/plan-binding.v1.json"), "utf8"),
  ) as {
    documents?: Array<{
      documentType?: unknown;
      lifecycle?: unknown;
      path?: unknown;
      sha256?: unknown;
      executionAuthorization?: {
        status?: unknown;
        role?: unknown;
        executionScopeId?: unknown;
        decisionPath?: unknown;
        decisionSha256?: unknown;
        closedScopeIds?: unknown;
      } | null;
    }>;
  };
  const documents = Array.isArray(binding.documents) ? binding.documents : [];
  const planBindings = documents.filter(
    (document) => document.path === DECISION_17_PLAN_PATH,
  );
  const decisionBindings = documents.filter(
    (document) => document.path === DECISION_17_AUTHORIZATION_PATH,
  );
  const boundPlan = planBindings[0];
  const boundDecision = decisionBindings[0];
  const execution = boundPlan?.executionAuthorization;
  if (
    planBindings.length !== 1 ||
    decisionBindings.length !== 1 ||
    boundPlan?.documentType !== "plan" ||
    boundPlan.lifecycle !== "active" ||
    boundPlan.sha256 !== DECISION_17_PLAN_SHA256 ||
    execution === null ||
    execution === undefined ||
    execution.status !== "authorized" ||
    execution.role !== DECISION_17_EXECUTION_ROLE ||
    execution.executionScopeId !== DECISION_17_EXECUTION_SCOPE_ID ||
    execution.decisionPath !== DECISION_17_AUTHORIZATION_PATH ||
    execution.decisionSha256 !== DECISION_17_AUTHORIZATION_SHA256 ||
    JSON.stringify(execution.closedScopeIds) !==
      JSON.stringify(DECISION_17_CLOSED_SCOPE_IDS) ||
    boundDecision?.documentType !== "decision" ||
    boundDecision.lifecycle !== "active" ||
    boundDecision.sha256 !== DECISION_17_AUTHORIZATION_SHA256
  ) {
    throw new Error(
      "Decision 17 plan-binding entry is not the exact active authorized plan/decision pair",
    );
  }
  return {
    ...DECISION_17_AUTHORING_AUTHORITY,
    openedScopeIds: [...DECISION_17_AUTHORING_AUTHORITY.openedScopeIds],
    closedScopeIds: [...DECISION_17_AUTHORING_AUTHORITY.closedScopeIds],
  };
}

/** Full v2 authority digest recomputed from current bound repository bytes. */
export function currentReviewSetV2ContentAuthoritySnapshotDigest(
  root: string = REPO_ROOT,
): string {
  return computeReviewSetV2ContentAuthoritySnapshotDigest(
    currentContentAuthoritySnapshotDigest(root),
    currentDecision17AuthoringAuthority(root),
  );
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
  "nba-embed-batch2-correction",
]);

/**
 * Content-authority snapshot from the plan binding: only the bound spec,
 * controller, platform foundation, active source discovery, active authoring,
 * and authorized content-correction roles (with their execution-decision
 * digests). The mutable whole-file binding and operational hosting, photo,
 * and public roles are excluded.
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
  try {
    assertHistoricalReviewSetV1Unchanged(root);
  } catch (error) {
    console.error(`review-set:generate FAILED — ${String(error)}`);
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
  if (cases.length !== EXPECTED_CASE_COUNT) {
    console.error(
      `review-set:generate FAILED — expected exactly ${EXPECTED_CASE_COUNT} governed cases, found ${cases.length}`,
    );
    process.exit(1);
  }
  const medicallyApprovedCases = selectMedicallyApprovedCases(cases);
  if (
    medicallyApprovedCases.length !== EXPECTED_CASE_COUNT ||
    medicallyApprovedCases.length !== cases.length
  ) {
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
  const followUpCorpus = loadFollowUpCorpus(root, medicallyApprovedCases, {
    expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
    expectedCaseCount: EXPECTED_CASE_COUNT,
  });
  if (
    followUpCorpus.issues.length > 0 ||
    followUpCorpus.entries.length !== EXPECTED_CASE_COUNT
  ) {
    for (const entry of followUpCorpus.issues) {
      console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
    }
    if (followUpCorpus.entries.length !== EXPECTED_CASE_COUNT) {
      console.error(
        `review-set:generate FAILED — expected ${EXPECTED_CASE_COUNT} validated follow-up sidecars, found ${followUpCorpus.entries.length}`,
      );
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
  let authoringAuthority: Decision17AuthoringAuthority;
  try {
    authoringAuthority = currentDecision17AuthoringAuthority(root);
  } catch (error) {
    console.error(`review-set:generate FAILED — ${String(error)}`);
    process.exit(1);
  }
  const manifest = buildReviewSetManifestV2({
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
    followUps: followUpCorpus.entries.map((entry) => ({
      caseId: entry.sidecar.caseId,
      sidecarPath: entry.sidecarPath,
      draftDigest: entry.draftDigest,
    })),
    authoringAuthority,
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
