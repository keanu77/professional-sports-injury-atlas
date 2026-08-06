/**
 * Fail-closed public release check. Runs before any public build: it loads
 * only real production data (governance record, content collections,
 * append-only registry, release history, durable decisions, external
 * verification) and evaluates every release condition. Any issue exits
 * non-zero with deterministic messages; with the current empty content this
 * gate must fail, naming missing counts, URLs, course links, external
 * verification, and authorization.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseStrictJson } from "../src/lib/contracts/canonical";
import type { ReleaseArtifactLoader } from "../src/lib/contracts/release-history";
import { resolveBuildMode } from "../src/lib/governance/build-mode";
import {
  evaluatePublicReleaseGate,
  type LoadedDecisionBytes,
  type PublicReleaseGateInput,
} from "../src/lib/governance/release-gate";
import { SITE_GOVERNANCE_DATA_PATH } from "../src/lib/governance/site-digest";
import { videoRightsDecisionPathFor } from "../src/lib/governance/video-rights-decision";
import { REVIEW_SET_MANIFEST_PATH } from "../src/lib/governance/review-set";
import { courseLinkDecisionPathFor } from "../src/lib/rtp/course-link-decision";
import {
  COURSE_LINKS_DATA_PATH,
  RTP_COURSE_SUMMARIES_DATA_PATH,
} from "../src/lib/rtp/course-links";
import {
  loadContentCollections,
  loadRealRegistry,
  registryArtifactLoader,
  REPO_ROOT,
} from "./check-content";
import {
  currentBuildCommit,
  currentRendererTreeDigest,
} from "./generate-review-set";
import {
  scanBrandAssets,
  validateBrandAssetPolicy,
} from "./verify-brand-assets";

export const MEDICAL_REVIEW_DECISION_PATH =
  "review/medical-review-decision.v1.json";
export const PRIVATE_DIST_MANIFEST_PATH =
  "review/private-dist-manifest.v1.json";
export const SERVED_REVIEW_RECEIPT_PATH =
  "review/served-review-receipt.v1.json";
export const EXTERNAL_VERIFICATION_PATH =
  "artifacts/external-verification.v1.json";
export const RELEASE_HISTORY_PATH =
  "public-release-history/public-release-history.v1.json";

function readOptional(root: string, path: string): Uint8Array | null {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? readFileSync(fullPath) : null;
}

function loadDecision(root: string, path: string): LoadedDecisionBytes | null {
  const bytes = readOptional(root, path);
  return bytes === null ? null : { bytes, path };
}

/** Read-only immutable artifact loader from a finalized release commit. */
function releaseCommitLoader(root: string): ReleaseArtifactLoader {
  return (buildCommit: string, path: string): Uint8Array =>
    execFileSync("git", ["show", `${buildCommit}:${path}`], {
      cwd: root,
      maxBuffer: 64 * 1024 * 1024,
    });
}

export function buildGateInput(
  root: string = REPO_ROOT,
): PublicReleaseGateInput {
  const loaded = loadContentCollections(root);
  if (loaded.issues.length > 0) {
    for (const entry of loaded.issues) {
      console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
    }
    throw new Error("content collections failed to load");
  }
  const registryResult = loadRealRegistry(root);
  if (registryResult.registry === null) {
    for (const entry of registryResult.issues) {
      console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
    }
    throw new Error("the source-manifest registry failed to load");
  }
  const governance = parseStrictJson(
    readFileSync(join(root, SITE_GOVERNANCE_DATA_PATH), "utf8"),
  );
  const governanceRecord = governance as {
    indexingAuthorization?: { decisionPath?: string | null };
  };
  const decisionPath =
    governanceRecord.indexingAuthorization?.decisionPath ?? null;
  const externalVerificationBytes = readOptional(
    root,
    EXTERNAL_VERIFICATION_PATH,
  );
  const build = currentBuildCommit(root);
  return {
    now: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    governance,
    publicationDecision:
      decisionPath === null ? null : loadDecision(root, decisionPath),
    cases: loaded.cases.map((entry) => entry.record),
    overviews: loaded.overviews.map((entry) => entry.record),
    updates: loaded.updates.map((entry) => entry.record),
    registry: registryResult.registry,
    loadRegistryArtifact: registryArtifactLoader(root),
    releaseHistoryBytes: readFileSync(join(root, RELEASE_HISTORY_PATH)),
    loadReleaseArtifact: releaseCommitLoader(root),
    reviewSetBytes: readOptional(root, REVIEW_SET_MANIFEST_PATH),
    medicalReviewDecisionBytes: readOptional(
      root,
      MEDICAL_REVIEW_DECISION_PATH,
    ),
    reviewArtifactManifestBytes: readOptional(root, PRIVATE_DIST_MANIFEST_PATH),
    servedReviewReceiptBytes: readOptional(root, SERVED_REVIEW_RECEIPT_PATH),
    loadVideoRightsDecision: (caseId: string) =>
      loadDecision(root, videoRightsDecisionPathFor(caseId)),
    externalVerification:
      externalVerificationBytes === null
        ? null
        : parseStrictJson(
            Buffer.from(externalVerificationBytes).toString("utf8"),
          ),
    courseLinks: parseStrictJson(
      readFileSync(join(root, COURSE_LINKS_DATA_PATH), "utf8"),
    ),
    courseSummaries: parseStrictJson(
      readFileSync(join(root, RTP_COURSE_SUMMARIES_DATA_PATH), "utf8"),
    ),
    loadCourseLinkDecision: (courseKey: string) =>
      loadDecision(root, courseLinkDecisionPathFor(courseKey)),
    build: {
      commit: build.commit,
      dirty: build.dirty,
      rendererTreeDigest: currentRendererTreeDigest(root),
    },
    brandFindings: [
      ...validateBrandAssetPolicy(root),
      ...scanBrandAssets(root),
    ].map((entry) => entry.path),
  };
}

function main(): void {
  const mode = resolveBuildMode();
  if (mode !== "public") {
    console.error(
      `release-check FAILED — ATLAS_BUILD_MODE must be public, got ${mode}`,
    );
    process.exit(1);
  }
  const input = buildGateInput(REPO_ROOT);
  const issues = evaluatePublicReleaseGate(input);
  if (issues.length === 0) {
    console.log("release-check OK — every public release condition holds");
    return;
  }
  for (const entry of issues) {
    console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
  }
  console.error(
    `release-check FAILED with ${issues.length} issue(s); the public release gate is closed`,
  );
  process.exit(1);
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
