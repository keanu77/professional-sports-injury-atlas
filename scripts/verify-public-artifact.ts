/**
 * Verifies a built public artifact in `dist/`: no review-only route, no
 * noindex inconsistency, and no embedded video whose caption status forbids
 * an in-site embed. This runs only after `release-check.ts` has passed and a
 * public build exists. HTTP delivery is still reported as not-verified until
 * a hosting plan sends a real request.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { issue, type ValidationIssue } from "../src/lib/contracts/canonical";
import { selectPublicCases } from "../src/lib/cases/selectors";
import { resolveBuildMode } from "../src/lib/governance/build-mode";
import { validatePublicOutput } from "../src/lib/governance/release-gate";
import { loadContentCollections, REPO_ROOT } from "./check-content";
import {
  checkNbaDeepLinkRedirectArtifacts,
  checkNbaPlainTextCitations,
  loadBuiltOutput,
  readBoundedArtifactText,
} from "./verify-review-artifact";

function main(): void {
  const mode = resolveBuildMode();
  if (mode !== "public") {
    console.error(
      `verify:public-artifact FAILED — ATLAS_BUILD_MODE must be public, got ${mode}`,
    );
    process.exit(1);
  }
  const root = REPO_ROOT;
  const distDir = join(root, "dist");
  if (!existsSync(distDir)) {
    console.error(
      "verify:public-artifact FAILED — dist/ is missing; run the public build first",
    );
    process.exit(1);
  }
  const { pages, files, artifactFileFacts, artifactFileIssues } =
    loadBuiltOutput(distDir);
  const loaded = loadContentCollections(root);
  const issues: ValidationIssue[] = [...loaded.issues, ...artifactFileIssues];
  const publicCases = selectPublicCases(
    loaded.cases.map((entry) => entry.record),
  );

  issues.push(...validatePublicOutput(pages, files, publicCases));
  issues.push(...checkNbaDeepLinkRedirectArtifacts(distDir, artifactFileFacts));
  const nbaCitations = checkNbaPlainTextCitations(root, pages, publicCases);
  issues.push(...nbaCitations.issues);

  const robotsFile = artifactFileFacts.find(
    (file) => file.path === "robots.txt",
  );
  if (robotsFile === undefined) {
    issues.push(
      issue("public-robots-missing", "robots.txt", "robots.txt is missing"),
    );
  } else {
    const read = readBoundedArtifactText(distDir, robotsFile);
    issues.push(...read.issues);
    if (read.text !== null && !read.text.startsWith("User-agent: *")) {
      issues.push(
        issue(
          "public-robots-body",
          "robots.txt",
          "public robots.txt must declare an explicit User-agent policy",
        ),
      );
    }
  }

  console.log(
    `verify:public-artifact pages=${pages.length} publicCases=${publicCases.length}`,
  );
  console.log(
    `Decision 11 NBA citations: videoSources=${nbaCitations.videoSources} sourceRows=${nbaCitations.sourceRows}`,
  );
  if (issues.length > 0) {
    for (const entry of issues) {
      console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
    }
    console.error(
      `verify:public-artifact FAILED with ${issues.length} issue(s)`,
    );
    process.exit(1);
  }
  console.log("Static public artifact checks OK.");
  console.log(
    "HTTP access/header delivery: not-verified — no hosting request has been made; this is not a pass for header delivery.",
  );
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
