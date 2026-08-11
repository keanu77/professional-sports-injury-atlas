/**
 * Verifies the built review artifact in `dist/`: every HTML page carries the
 * exact noindex robots meta, robots.txt disallows everything, and no
 * YouTube iframe, analytics, sitemap, external preconnect, or nonlocal image
 * reference exists. The
 * deployment-neutral header policy file is checked structurally; actual HTTP
 * access/header delivery is explicitly reported as not-verified until a
 * hosting plan sends a real request — it is never called a pass here.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { parse, type DefaultTreeAdapterTypes } from "parse5";
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
import { caseSchema, type InjuryCase } from "../src/lib/contracts/case";
import { isNbaUrl } from "../src/lib/rights/nba-link-policy";

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

type HtmlElement = DefaultTreeAdapterTypes.Element;
type HtmlNode = DefaultTreeAdapterTypes.Node;

function isHtmlElement(node: HtmlNode): node is HtmlElement {
  return "tagName" in node;
}

function descendantElements(node: HtmlNode): HtmlElement[] {
  if (!("childNodes" in node)) return [];
  const result: HtmlElement[] = [];
  for (const child of node.childNodes) {
    if (!isHtmlElement(child)) continue;
    result.push(child, ...descendantElements(child));
  }
  return result;
}

function htmlAttribute(element: HtmlElement, name: string): string | null {
  return element.attrs.find((entry) => entry.name === name)?.value ?? null;
}

function htmlNodeText(node: HtmlNode): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if (!("childNodes" in node)) return "";
  return node.childNodes.map((child) => htmlNodeText(child)).join("");
}

function normalizedText(node: HtmlNode): string {
  return htmlNodeText(node).replace(/\s+/gu, " ").trim();
}

function loadCaseRecords(root: string): InjuryCase[] {
  const directory = join(root, "src/content/cases");
  return readdirSync(directory)
    .filter((path) => path.endsWith(".json"))
    .sort()
    .map((path) =>
      caseSchema.parse(JSON.parse(readFileSync(join(directory, path), "utf8"))),
    );
}

function containsCitationFacts(
  text: string,
  source: Pick<
    InjuryCase["sources"][number],
    "publisher" | "publishedAt" | "title" | "type" | "url"
  >,
  includeType = false,
): boolean {
  return [
    source.title,
    source.publisher,
    source.publishedAt,
    source.url,
    ...(includeType ? [`（${source.type}）`] : []),
  ].every((value) => text.includes(value));
}

export function checkNbaPlainTextCitations(
  root: string,
  pages: readonly BuiltPage[],
  records?: readonly InjuryCase[],
): {
  issues: ValidationIssue[];
  sourceRows: number;
  videoSources: number;
} {
  const issues: ValidationIssue[] = [];
  const pageByPath = new Map(pages.map((page) => [page.path, page]));
  let sourceRows = 0;
  let videoSources = 0;

  for (const record of records ?? loadCaseRecords(root)) {
    const path = `cases/${record.slug}/index.html`;
    const page = pageByPath.get(path);
    if (page === undefined) {
      issues.push(
        issue(
          "review-nba-citation-page-missing",
          path,
          `review output is missing the case page for ${record.id}`,
        ),
      );
      continue;
    }
    const elements = descendantElements(parse(page.html));
    const citations = elements.filter(
      (element) =>
        htmlAttribute(element, "data-link-policy") ===
          "nba-plain-text-citation" &&
        htmlAttribute(element, "data-citation-context") === "source-list",
    );
    const expectedSources = record.sources.filter((candidate) =>
      isNbaUrl(candidate.url),
    );
    sourceRows += expectedSources.length;
    const citationBySourceId = new Map<string, HtmlElement>();
    for (const citation of citations) {
      const sourceId = htmlAttribute(citation, "data-citation-source-id");
      if (sourceId === null || citationBySourceId.has(sourceId)) {
        issues.push(
          issue(
            "review-nba-source-citation-identity",
            path,
            "every NBA source-list citation must carry one unique governed source ID",
          ),
        );
      } else {
        citationBySourceId.set(sourceId, citation);
      }
    }
    if (citations.length !== expectedSources.length) {
      issues.push(
        issue(
          "review-nba-source-citation-count",
          path,
          `expected ${expectedSources.length} NBA source-list citation rows, observed ${citations.length}`,
        ),
      );
    }

    const expectedSourceIds = new Set(
      expectedSources.map((source) => source.id),
    );
    for (const source of expectedSources) {
      const citation = citationBySourceId.get(source.id);
      if (
        citation === undefined ||
        !containsCitationFacts(normalizedText(citation), source, true)
      ) {
        issues.push(
          issue(
            "review-nba-source-citation-missing",
            path,
            `${source.id} must retain its exact type, publisher, title, date, and literal NBA.com URL as one plain-text citation`,
          ),
        );
      }
    }
    for (const sourceId of citationBySourceId.keys()) {
      if (!expectedSourceIds.has(sourceId)) {
        issues.push(
          issue(
            "review-nba-source-citation-extra",
            path,
            `unexpected NBA source-list citation ${sourceId}`,
          ),
        );
      }
    }

    if (isNbaUrl(record.video.canonicalUrl)) {
      videoSources += 1;
      const source = record.sources.find(
        (candidate) =>
          candidate.type === "video-original" &&
          candidate.url === record.video.canonicalUrl,
      );
      const videoCitations = elements.filter(
        (element) =>
          htmlAttribute(element, "data-video-source-citation") !== null,
      );
      if (
        source === undefined ||
        !videoCitations.some((element) =>
          containsCitationFacts(normalizedText(element), source),
        )
      ) {
        issues.push(
          issue(
            "review-nba-video-citation-missing",
            path,
            `${record.id} must render its governed video source as a complete plain-text citation`,
          ),
        );
      }
    }
  }

  if (records === undefined && videoSources !== 18) {
    issues.push(
      issue(
        "review-nba-video-citation-count",
        "src/content/cases",
        `Decision 11 binds exactly 18 NBA.com canonical video sources; observed ${videoSources}`,
      ),
    );
  }
  if (records === undefined && sourceRows !== 69) {
    issues.push(
      issue(
        "review-nba-source-citation-total",
        "src/content/cases",
        `the audited P2-5 corpus binds exactly 69 NBA.com source rows; observed ${sourceRows}`,
      ),
    );
  }

  return { issues, sourceRows, videoSources };
}

export function checkNbaDeepLinkRedirectArtifacts(
  distDir: string,
  files: readonly string[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const redirectFileRe = /(^|\/)(?:_redirects|redirects?\.json)$/iu;
  for (const path of files.filter((candidate) =>
    redirectFileRe.test(candidate),
  )) {
    const text = readFileSync(join(distDir, path), "utf8");
    for (const candidate of nbaUrlsInRedirectArtifact(text)) {
      issues.push(
        issue(
          "review-nba-deep-link-redirect",
          path,
          `redirect artifact must not point to NBA.com URL ${candidate}`,
        ),
      );
    }
  }
  return issues;
}

export function nbaUrlsInRedirectArtifact(text: string): string[] {
  const normalized = text
    .replaceAll("\\/", "/")
    .replace(/\\u002f/giu, "/")
    .replace(/\\x2f/giu, "/");
  const matches = normalized.match(/(?:https?:)?\/\/[^\s"'<>\\]+/giu) ?? [];
  return matches
    .map((candidate) =>
      candidate.startsWith("//") ? `https:${candidate}` : candidate,
    )
    .filter(isNbaUrl);
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
    contractId?: unknown;
    requiredHeaders?: Record<string, unknown>;
    unauthorizedHeaders?: Record<string, unknown>;
    forbiddenHeaders?: unknown;
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
  if (
    parsed.contractId !== "atlas-private-review-http-headers-v1" ||
    parsed.requiredHeaders?.["X-Robots-Tag"] !== REVIEW_X_ROBOTS_TAG
  ) {
    issues.push(
      issue(
        "header-policy-x-robots-tag",
        HTTP_HEADER_POLICY_PATH,
        `review X-Robots-Tag must be exactly "${REVIEW_X_ROBOTS_TAG}"`,
      ),
    );
  }
  if (
    parsed.requiredHeaders?.["Cache-Control"] !==
      "private, no-store, max-age=0" ||
    parsed.requiredHeaders?.Pragma !== "no-cache" ||
    parsed.requiredHeaders?.Vary !== "Authorization" ||
    parsed.requiredHeaders?.["X-Content-Type-Options"] !== "nosniff" ||
    parsed.unauthorizedHeaders?.["WWW-Authenticate"] !==
      'Basic realm="Private review", charset="UTF-8"' ||
    JSON.stringify(parsed.forbiddenHeaders) !==
      JSON.stringify([
        "Content-Encoding",
        "ETag",
        "Last-Modified",
        "Location",
        "Server",
        "Set-Cookie",
      ])
  ) {
    issues.push(
      issue(
        "header-policy-private-contract",
        HTTP_HEADER_POLICY_PATH,
        "private review cache, auth, security, and forbidden-header contract is incomplete",
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
  const nbaCitations = checkNbaPlainTextCitations(root, pages);
  issues.push(...nbaCitations.issues);
  issues.push(...checkNbaDeepLinkRedirectArtifacts(distDir, files));

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
  console.log(
    `Decision 11 NBA citations: videoSources=${nbaCitations.videoSources} sourceRows=${nbaCitations.sourceRows}`,
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
    "Static review artifact checks OK: noindex meta on every page; no sitemap/analytics/iframe/preconnect/nonlocal images.",
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
