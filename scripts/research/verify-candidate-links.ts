/** Live, bounded mutation step for the canonical NBA source-verification artifact. */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
} from "../../src/lib/contracts/canonical";
import {
  LIVE_VERIFICATION_CONCURRENCY,
  serializeVerificationArtifact,
  validateCandidateVerification,
  validateRootSourceAuditAgainstRows,
  validateRootSourceAuditShape,
  verifyCandidateUrls,
  type CandidateVerificationArtifactV1,
  type RootSourceAuditV1,
  type VerificationFetch,
} from "../../src/lib/research/link-verification";
import { checkCandidateLedgers } from "./check-candidates";

export const VERIFICATION_ARTIFACT_PATH =
  "research/verification/nba-source-verification.v1.json";
export const ROOT_AUDIT_PATH = "research/reviews/root-source-audit.v1.json";

function loadOptionalRootAudit(root: string): RootSourceAuditV1 | null {
  const path = join(root, ...ROOT_AUDIT_PATH.split("/"));
  if (!existsSync(path)) return null;
  const bytes = readFileSync(path, "utf8");
  const parsed = parseStrictJson(bytes);
  if (canonicalJson(parsed) !== bytes) {
    throw new Error(`${ROOT_AUDIT_PATH} is not exact canonical JSON`);
  }
  return parsed as RootSourceAuditV1;
}

function atomicPublish(
  root: string,
  bytes: string,
  validateTemporaryBytes: (bytes: string) => void,
): void {
  const destination = join(root, ...VERIFICATION_ARTIFACT_PATH.split("/"));
  const directory = dirname(destination);
  mkdirSync(directory, { recursive: true });
  const temporary = join(
    directory,
    `.nba-source-verification.v1.${process.pid}.tmp`,
  );
  if (existsSync(temporary)) {
    throw new Error(`bounded temporary path already exists: ${temporary}`);
  }
  try {
    writeFileSync(temporary, bytes, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    validateTemporaryBytes(readFileSync(temporary, "utf8"));
    renameSync(temporary, destination);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

export async function runCandidateLinkVerifier(
  root: string = process.cwd(),
): Promise<number> {
  const candidateCheck = checkCandidateLedgers(root);
  if (candidateCheck.issues.length > 0) {
    for (const issue of candidateCheck.issues) {
      console.error(
        `[${issue.code}] ${issue.filename}:${issue.row}:${issue.column} ${issue.message.replace(/\s+/gu, " ")}`,
      );
    }
    console.error(
      "research:verify-links refused invalid candidate ledgers; run research:check first",
    );
    return 1;
  }
  const acceptedCount = candidateCheck.rows.filter(
    (row) =>
      row.discoveryStatus === "source-ready" ||
      row.discoveryStatus === "source-verified",
  ).length;
  if (acceptedCount === 0) {
    console.error("research:verify-links found no accepted candidates");
    return 1;
  }

  let rootAudit: RootSourceAuditV1 | null;
  try {
    rootAudit = loadOptionalRootAudit(root);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  if (rootAudit !== null) {
    const shapeIssues = validateRootSourceAuditShape(rootAudit);
    const rootAuditIssues =
      shapeIssues.length === 0
        ? validateRootSourceAuditAgainstRows(candidateCheck.rows, rootAudit)
        : shapeIssues;
    if (rootAuditIssues.length > 0) {
      for (const issue of rootAuditIssues) {
        console.error(`[${issue.code}] ${issue.path} ${issue.message}`);
      }
      console.error(
        "research:verify-links refused an invalid root audit before making requests",
      );
      return 1;
    }
  }

  let artifact: CandidateVerificationArtifactV1;
  try {
    artifact = await verifyCandidateUrls(candidateCheck.rows, {
      concurrency: LIVE_VERIFICATION_CONCURRENCY,
      fetch: globalThis.fetch as unknown as VerificationFetch,
      youtubeApiKey: process.env.YOUTUBE_API_KEY,
      rootAudit,
    });
  } catch {
    console.error(
      "research:verify-links encountered an unexpected bounded verification failure; prior artifact was not replaced",
    );
    return 1;
  }
  const issues = validateCandidateVerification({
    rows: candidateCheck.rows,
    artifact,
    now: artifact.checkedAt,
    rootAudit,
    requireRootAudit: rootAudit !== null,
    requireReviewDecision: false,
  });
  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`[${issue.code}] ${issue.path} ${issue.message}`);
    }
    console.error(
      `research:verify-links FAILED with ${issues.length} issue(s); prior artifact was not replaced`,
    );
    return 1;
  }

  const bytes = serializeVerificationArtifact(artifact);
  try {
    atomicPublish(root, bytes, (temporaryBytes) => {
      const parsed = parseStrictJson(
        temporaryBytes,
      ) as CandidateVerificationArtifactV1;
      if (serializeVerificationArtifact(parsed) !== temporaryBytes) {
        throw new Error(
          "temporary verification artifact is not canonical JSON",
        );
      }
      const persistedIssues = validateCandidateVerification({
        rows: candidateCheck.rows,
        artifact: parsed,
        now: parsed.checkedAt,
        rootAudit,
        requireRootAudit: rootAudit !== null,
        requireReviewDecision: false,
      });
      if (persistedIssues.length > 0) {
        throw new Error(
          `temporary verification artifact failed validation: ${persistedIssues
            .map((issue) => issue.code)
            .join(", ")}`,
        );
      }
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  console.log(
    `research:verify-links OK candidates=${acceptedCount} urls=${artifact.results.length} concurrency=${artifact.concurrency}`,
  );
  console.log(`wrote ${VERIFICATION_ARTIFACT_PATH}`);
  return 0;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(await runCandidateLinkVerifier());
}
