/** Read-only exact-input checker for the canonical NBA authoring manifest. */

import { existsSync, lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  canonicalJson,
  issue,
  sha256Hex,
  type ValidationIssue,
} from "../../src/lib/contracts/canonical";
import {
  CandidateManifestBuildError,
  parseCandidateManifestBytes,
  type CandidateSourceManifestV1,
} from "../../src/lib/research/candidate-manifest";
import {
  MANIFEST_PATH,
  REGISTRY_LOCK_PATH,
  buildExpectedCandidateManifest,
} from "./generate-candidate-manifest";
import { checkSourceManifestRegistry } from "./check-source-manifest-registry";
import { SOURCE_REVIEW_DECISION_PATH } from "./check-candidate-verification";

export interface CandidateManifestCheckResult {
  manifest: CandidateSourceManifestV1 | null;
  digest: string | null;
  issues: ValidationIssue[];
}

const forbiddenAuthorityField =
  /"(?:medicalReview|allowIndexing|indexingAuthorization|publicRightsApproval|publicReleaseStatus)"\s*:/u;

/** Check exact bytes, current frozen inputs, and the registered artifact link. */
export function checkCandidateManifest(
  root: string = process.cwd(),
  validationNow?: string,
): CandidateManifestCheckResult {
  const issues: ValidationIssue[] = [];
  const lockPath = join(root, ...REGISTRY_LOCK_PATH.split("/"));
  if (existsSync(lockPath)) {
    let digest = "unreadable";
    try {
      digest = sha256Hex(readFileSync(lockPath));
    } catch {
      // The retained path itself is sufficient to fail closed.
    }
    return {
      manifest: null,
      digest: null,
      issues: [
        issue(
          "manifest-transaction-lock",
          REGISTRY_LOCK_PATH,
          `retained registry transaction lock requires operator inspection (sha256=${digest})`,
        ),
      ],
    };
  }

  const path = join(root, ...MANIFEST_PATH.split("/"));
  if (!existsSync(path)) {
    return {
      manifest: null,
      digest: null,
      issues: [issue("manifest-missing", MANIFEST_PATH, "manifest is missing")],
    };
  }
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    return {
      manifest: null,
      digest: null,
      issues: [
        issue(
          "manifest-path",
          MANIFEST_PATH,
          "manifest must be a regular non-symlink file",
        ),
      ],
    };
  }

  const bytes = readFileSync(path);
  const parsed = parseCandidateManifestBytes(bytes);
  issues.push(...parsed.issues);
  if (parsed.manifest === null) {
    return { manifest: null, digest: null, issues };
  }
  const manifest = parsed.manifest;
  const digest = sha256Hex(bytes);
  if (forbiddenAuthorityField.test(bytes.toString("utf8"))) {
    issues.push(
      issue(
        "manifest-forbidden-field",
        MANIFEST_PATH,
        "manifest contains a medical/public/indexing authorization field",
      ),
    );
  }

  try {
    const expected = buildExpectedCandidateManifest(root, validationNow);
    if (!bytes.equals(expected.bytes)) {
      issues.push(
        issue(
          "manifest-input-drift",
          MANIFEST_PATH,
          `manifest bytes differ from current frozen inputs (stored ${digest}, expected ${expected.digest})`,
        ),
      );
    }
  } catch (error) {
    if (error instanceof CandidateManifestBuildError) {
      issues.push(...error.issues);
    } else {
      issues.push(
        issue(
          "manifest-recompute",
          MANIFEST_PATH,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  const registry = checkSourceManifestRegistry(root);
  issues.push(...registry.issues);
  const entry = registry.registry?.entries.find(
    (candidate) => candidate.manifestId === manifest.manifestId,
  );
  if (entry === undefined) {
    issues.push(
      issue(
        "manifest-unregistered",
        MANIFEST_PATH,
        `manifest ${manifest.manifestId} is not registered`,
      ),
    );
  } else {
    const expectedEntry = {
      manifestId: manifest.manifestId,
      manifestPath: MANIFEST_PATH,
      manifestDigest: digest,
      sourceReviewDecisionPath: SOURCE_REVIEW_DECISION_PATH,
      sourceReviewDecisionDigest:
        manifest.sourceDigests.sourceReviewDecisionSha256,
      sourcePolicyVersion: manifest.sourcePolicyVersion,
      batchType: manifest.batchType,
      period: manifest.period,
      createdAt: manifest.generatedAt,
      previousRegistryBytesDigest: entry.previousRegistryBytesDigest,
      supersedes: manifest.supersedes,
    };
    if (canonicalJson(entry) !== canonicalJson(expectedEntry)) {
      issues.push(
        issue(
          "manifest-registry-mismatch",
          MANIFEST_PATH,
          "registered entry does not match the canonical manifest/digests",
        ),
      );
    }
  }

  return { manifest, digest, issues };
}

export function runCandidateManifestCheck(
  root: string = process.cwd(),
): number {
  const result = checkCandidateManifest(root);
  if (
    result.issues.length > 0 ||
    result.manifest === null ||
    result.digest === null
  ) {
    for (const entry of result.issues) {
      console.error(`[${entry.code}] ${entry.path} ${entry.message}`);
    }
    console.error(
      `research:check-manifest FAILED with ${result.issues.length} issue(s)`,
    );
    return 1;
  }
  console.log(
    `research:check-manifest OK manifest=${result.manifest.manifestId} entries=${result.manifest.entries.length} digest=${result.digest}`,
  );
  return 0;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runCandidateManifestCheck());
}
