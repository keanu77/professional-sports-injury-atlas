/**
 * Live external-source verification runner. It loads only the production
 * case collection (which is empty until real authoring is authorized), then
 * issues bounded HTTPS requests solely to URLs already present in validated
 * case data and writes `artifacts/external-verification.v1.json`. The
 * standard review build never invokes this script, so normal builds perform
 * no network requests; with zero cases it performs none either.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { canonicalJson } from "../src/lib/contracts/canonical";
import {
  ARTIFACT_PATH,
  buildExternalVerificationArtifact,
  verifyCaseExternalSources,
  type FetchLike,
  type VerifierDependencies,
} from "../src/lib/external/verification";
import { loadContentCollections, REPO_ROOT } from "./check-content";

async function main(): Promise<number> {
  const loaded = loadContentCollections(REPO_ROOT);
  if (loaded.issues.length > 0) {
    for (const entry of loaded.issues) {
      console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
    }
    console.error("content collections failed validation; refusing to verify");
    return 1;
  }

  const deps: VerifierDependencies = {
    fetchImpl: fetch as unknown as FetchLike,
    sleep: (ms) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      }),
    now: () => new Date(),
    youtubeApiKey: process.env.YOUTUBE_API_KEY ?? null,
  };
  if (deps.youtubeApiKey === null || deps.youtubeApiKey === "") {
    console.log(
      "YOUTUBE_API_KEY not-obtained: API identity checks will be skipped",
    );
  }

  const caseResults = [];
  for (const { record } of loaded.cases) {
    console.log(`verifying external sources for ${record.id}`);
    caseResults.push(await verifyCaseExternalSources(record, deps));
  }

  const artifact = buildExternalVerificationArtifact(caseResults, new Date());
  const outputPath = join(REPO_ROOT, ARTIFACT_PATH);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${canonicalJson(artifact)}\n`);
  console.log(
    `wrote ${ARTIFACT_PATH}: ${artifact.cases.length} case(s), ` +
      `${caseResults.reduce((sum, entry) => sum + entry.results.length, 0)} URL check(s)`,
  );
  const failed = caseResults.some((entry) =>
    entry.results.some((result) => result.status !== "ok"),
  );
  if (failed) {
    console.error("at least one external URL check failed");
    return 1;
  }
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
