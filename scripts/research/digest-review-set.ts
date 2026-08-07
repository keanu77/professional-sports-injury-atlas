/** Print the exact frozen candidate review-set digest after strict validation. */

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
import { SOURCE_REVIEW_DECISION_PATH } from "./check-candidate-verification";
import { checkCandidateLedgers } from "./check-candidates";
import {
  ROOT_AUDIT_PATH,
  VERIFICATION_ARTIFACT_PATH,
} from "./verify-candidate-links";

const SOURCE_POLICY_JSON_PATH = "research/source-policy/source-policy.v2.json";
const SOURCE_POLICY_MARKDOWN_PATH = "research/source-policy/nba.v2.md";

function loadCanonical<T>(
  root: string,
  relativePath: string,
): {
  bytes: string;
  parsed: T;
} {
  const path = join(root, ...relativePath.split("/"));
  if (!existsSync(path))
    throw new Error(`required artifact is missing: ${relativePath}`);
  const bytes = readFileSync(path, "utf8");
  const parsed = parseStrictJson(bytes) as T;
  if (canonicalJson(parsed) !== bytes) {
    throw new Error(`artifact is not exact canonical JSON: ${relativePath}`);
  }
  return { bytes, parsed };
}

export function digestReviewSet(root: string = process.cwd()): string {
  const candidateCheck = checkCandidateLedgers(root);
  if (candidateCheck.issues.length > 0) {
    throw new Error(
      "research:review-set-digest refused invalid candidate ledgers",
    );
  }
  const rootAudit = loadCanonical<RootSourceAuditV1>(root, ROOT_AUDIT_PATH);
  const verification = loadCanonical<CandidateVerificationArtifactV1>(
    root,
    VERIFICATION_ARTIFACT_PATH,
  );
  if (
    serializeVerificationArtifact(verification.parsed) !== verification.bytes
  ) {
    throw new Error("verification artifact does not match its strict shape");
  }
  const sourcePolicyJsonBytes = readFileSync(
    join(root, ...SOURCE_POLICY_JSON_PATH.split("/")),
    "utf8",
  );
  const sourcePolicyMarkdownBytes = readFileSync(
    join(root, ...SOURCE_POLICY_MARKDOWN_PATH.split("/")),
    "utf8",
  );
  const decisionPath = join(root, ...SOURCE_REVIEW_DECISION_PATH.split("/"));
  const decision = existsSync(decisionPath)
    ? loadCanonical<SourceReviewDecisionV1>(root, SOURCE_REVIEW_DECISION_PATH)
        .parsed
    : undefined;
  const candidateSetDigest = computeCandidateReviewSetDigest({
    rows: candidateCheck.rows,
    rootAuditBytes: rootAudit.bytes,
    verificationBytes: verification.bytes,
    sourcePolicyJsonBytes,
    sourcePolicyMarkdownBytes,
  });
  const issues = validateCandidateVerification({
    rows: candidateCheck.rows,
    artifact: verification.parsed,
    now: new Date().toISOString().replace(/\.\d{3}Z$/u, "Z"),
    rootAudit: rootAudit.parsed,
    decision,
    policyDigests: {
      json: sha256Hex(sourcePolicyJsonBytes),
      markdown: sha256Hex(sourcePolicyMarkdownBytes),
    },
    expectedCandidateSetDigest: candidateSetDigest,
  });
  if (issues.length > 0) {
    throw new Error(
      issues
        .map((issue) => `[${issue.code}] ${issue.path} ${issue.message}`)
        .join("\n"),
    );
  }
  return candidateSetDigest;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    console.log(digestReviewSet());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
