/**
 * Verifies the built review artifact in `dist/`: every HTML page carries the
 * exact noindex robots meta, robots.txt disallows everything, and no
 * YouTube iframe, analytics, sitemap, or external preconnect exists. The
 * deployment-neutral header policy file is checked structurally; actual HTTP
 * access/header delivery is explicitly reported as not-verified until a
 * hosting plan sends a real request — it is never called a pass here.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import {
  issue,
  parseStrictJson,
  type ValidationIssue,
} from "../src/lib/contracts/canonical";
import {
  DISALLOW_ALL_ROBOTS_TXT,
  REVIEW_X_ROBOTS_TAG,
} from "../src/lib/governance/build-mode";
import {
  validateReviewOutput,
  type BuiltPage,
} from "../src/lib/governance/release-gate";

export const HTTP_HEADER_POLICY_PATH = "ops/http-header-policy.v1.json";

export function walkDist(distDir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(distDir).sort()) {
    const fullPath = join(distDir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...walkDist(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

export function loadBuiltOutput(distDir: string): {
  pages: BuiltPage[];
  files: string[];
} {
  const files = walkDist(distDir).map((fullPath) =>
    relative(distDir, fullPath),
  );
  const pages: BuiltPage[] = files
    .filter((path) => path.endsWith(".html"))
    .map((path) => ({
      path,
      html: readFileSync(join(distDir, path), "utf8"),
    }));
  return { pages, files };
}

export function checkHeaderPolicy(root: string): ValidationIssue[] {
  const policyPath = join(root, HTTP_HEADER_POLICY_PATH);
  if (!existsSync(policyPath)) {
    return [
      issue(
        "header-policy-missing",
        HTTP_HEADER_POLICY_PATH,
        "the deployment-neutral HTTP header policy file is missing",
      ),
    ];
  }
  const parsed = parseStrictJson(readFileSync(policyPath, "utf8")) as {
    schemaVersion?: unknown;
    review?: Record<string, unknown>;
  };
  const issues: ValidationIssue[] = [];
  if (parsed.schemaVersion !== 1) {
    issues.push(
      issue(
        "header-policy-schema",
        HTTP_HEADER_POLICY_PATH,
        "header policy schemaVersion must be 1",
      ),
    );
  }
  if (parsed.review?.["X-Robots-Tag"] !== REVIEW_X_ROBOTS_TAG) {
    issues.push(
      issue(
        "header-policy-x-robots-tag",
        HTTP_HEADER_POLICY_PATH,
        `review X-Robots-Tag must be exactly "${REVIEW_X_ROBOTS_TAG}"`,
      ),
    );
  }
  return issues;
}

function main(): void {
  const root = process.cwd();
  const distDir = join(root, "dist");
  if (!existsSync(distDir)) {
    console.error(
      "verify:review-artifact FAILED — dist/ is missing; run npm run build:review first",
    );
    process.exit(1);
  }
  const { pages, files } = loadBuiltOutput(distDir);
  const issues: ValidationIssue[] = [];

  issues.push(...validateReviewOutput(pages, files));

  for (const page of pages) {
    if (/youtube(-nocookie)?\.com\/embed/i.test(page.html)) {
      issues.push(
        issue(
          "review-output-youtube-embed",
          page.path,
          "review output must not contain a YouTube embed URL",
        ),
      );
    }
  }

  const robotsPath = join(distDir, "robots.txt");
  if (!existsSync(robotsPath)) {
    issues.push(
      issue("review-robots-missing", "robots.txt", "robots.txt is missing"),
    );
  } else if (readFileSync(robotsPath, "utf8") !== DISALLOW_ALL_ROBOTS_TXT) {
    issues.push(
      issue(
        "review-robots-body",
        "robots.txt",
        "review robots.txt must be exactly `User-agent: *` + `Disallow: /`",
      ),
    );
  }

  issues.push(...checkHeaderPolicy(root));

  const casePages = files.filter(
    (path) => path.startsWith("cases/") && path.endsWith(".html"),
  );
  console.log(
    `verify:review-artifact pages=${pages.length} casePages=${casePages.length}` +
      (casePages.length === 0 ? " (no case data)" : ""),
  );

  if (issues.length > 0) {
    for (const entry of issues) {
      console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
    }
    console.error(
      `verify:review-artifact FAILED with ${issues.length} issue(s)`,
    );
    process.exit(1);
  }

  console.log(
    "Static review artifact checks OK: noindex meta on every page; no sitemap/analytics/iframe/preconnect.",
  );
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
