/** Read-only exact-bijection checker for NBA source-verification artifacts. */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import {
  computeCandidateReviewSetDigest,
  serializeVerificationArtifact,
  validateCandidateVerification,
  type CandidateVerificationArtifactV1,
  type RootSourceAuditV1,
  type SourceReviewDecisionV1,
} from "../../src/lib/research/link-verification";
import { checkCandidateLedgers } from "./check-candidates";
import {
  ROOT_AUDIT_PATH,
  VERIFICATION_ARTIFACT_PATH,
} from "./verify-candidate-links";

export const SOURCE_REVIEW_DECISION_PATH =
  "research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json";
export const SOURCE_POLICY_JSON_PATH =
  "research/source-policy/source-policy.v2.json";
export const SOURCE_POLICY_MARKDOWN_PATH = "research/source-policy/nba.v2.md";

interface CanonicalArtifact<T> {
  bytes: string;
  parsed: T;
}

function loadCanonicalArtifact<T>(
  root: string,
  relativePath: string,
): CanonicalArtifact<T> {
  const absolutePath = join(root, ...relativePath.split("/"));
  if (!existsSync(absolutePath)) {
    throw new Error(`required artifact is missing: ${relativePath}`);
  }
  const bytes = readFileSync(absolutePath, "utf8");
  const parsed = parseStrictJson(bytes) as T;
  if (canonicalJson(parsed) !== bytes) {
    throw new Error(`artifact is not exact canonical JSON: ${relativePath}`);
  }
  return { bytes, parsed };
}

export function runCandidateVerificationCheck(
  root: string = process.cwd(),
): number {
  const candidateCheck = checkCandidateLedgers(root);
  if (candidateCheck.issues.length > 0) {
    for (const issue of candidateCheck.issues) {
      console.error(
        `[${issue.code}] ${issue.filename}:${issue.row}:${issue.column} ${issue.message.replace(/\s+/gu, " ")}`,
      );
    }
    console.error(
      "research:check-verification refused invalid candidate ledgers",
    );
    return 1;
  }

  try {
    const artifactFile = loadCanonicalArtifact<CandidateVerificationArtifactV1>(
      root,
      VERIFICATION_ARTIFACT_PATH,
    );
    if (
      serializeVerificationArtifact(artifactFile.parsed) !== artifactFile.bytes
    ) {
      throw new Error(
        `${VERIFICATION_ARTIFACT_PATH} does not match the strict artifact shape`,
      );
    }
    const rootAuditFile = loadCanonicalArtifact<RootSourceAuditV1>(
      root,
      ROOT_AUDIT_PATH,
    );
    const policyJsonBytes = readFileSync(
      join(root, ...SOURCE_POLICY_JSON_PATH.split("/")),
      "utf8",
    );
    const policyMarkdownBytes = readFileSync(
      join(root, ...SOURCE_POLICY_MARKDOWN_PATH.split("/")),
      "utf8",
    );
    const decisionFile = existsSync(
      join(root, ...SOURCE_REVIEW_DECISION_PATH.split("/")),
    )
      ? loadCanonicalArtifact<SourceReviewDecisionV1>(
          root,
          SOURCE_REVIEW_DECISION_PATH,
        )
      : null;
    const expectedCandidateSetDigest = computeCandidateReviewSetDigest({
      rows: candidateCheck.rows,
      rootAuditBytes: rootAuditFile.bytes,
      verificationBytes: artifactFile.bytes,
      sourcePolicyJsonBytes: policyJsonBytes,
      sourcePolicyMarkdownBytes: policyMarkdownBytes,
    });
    const issues = validateCandidateVerification({
      rows: candidateCheck.rows,
      artifact: artifactFile.parsed,
      now: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      rootAudit: rootAuditFile.parsed,
      decision: decisionFile?.parsed,
      policyDigests: {
        json: sha256Hex(policyJsonBytes),
        markdown: sha256Hex(policyMarkdownBytes),
      },
      expectedCandidateSetDigest,
    });
    if (issues.length > 0) {
      for (const issue of issues) {
        console.error(`[${issue.code}] ${issue.path} ${issue.message}`);
      }
      console.error(
        `research:check-verification FAILED with ${issues.length} issue(s)`,
      );
      return 1;
    }
    console.log(
      `research:check-verification OK candidates=${candidateCheck.auditQueue.length} urls=${artifactFile.parsed.results.length}`,
    );
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runCandidateVerificationCheck());
}
