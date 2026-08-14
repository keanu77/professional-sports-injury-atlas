/**
 * Verifies the built review artifact in `dist/`: every HTML page carries the
 * exact noindex robots meta, robots.txt disallows everything, and no
 * YouTube iframe, analytics, sitemap, external preconnect, or nonlocal image
 * reference exists. The
 * deployment-neutral header policy file is checked structurally; actual HTTP
 * access/header delivery is explicitly reported as not-verified until a
 * hosting plan sends a real request — it is never called a pass here.
 */

import { constants } from "node:fs";
import {
  closeSync,
  existsSync,
  fstatSync,
  lstatSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  type BigIntStats,
} from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parse, type DefaultTreeAdapterTypes } from "parse5";
import {
  compareCodePoints,
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
import { PRIVATE_REVIEW_MAX_FILE_BYTES } from "../src/lib/governance/private-review-limits";

export const HTTP_HEADER_POLICY_PATH = "ops/http-header-policy.v1.json";

export interface ReviewArtifactFileFact {
  /** POSIX-style path relative to dist/. */
  path: string;
  byteLength: number;
  /** Present on facts captured from disk; omitted only by pure size fixtures. */
  scanIdentity?: ReviewArtifactFsIdentity;
  parentDirectories?: readonly ReviewArtifactDirectoryFact[];
}

export interface ReviewArtifactFsIdentity {
  dev: bigint;
  ino: bigint;
  size: bigint;
  mtimeNs: bigint;
  ctimeNs: bigint;
}

export interface ReviewArtifactDirectoryFact {
  /** POSIX-style path relative to dist/; empty string is the dist root. */
  path: string;
  scanIdentity: ReviewArtifactFsIdentity;
}

export interface ReviewArtifactFileScan {
  directories: ReviewArtifactDirectoryFact[];
  files: ReviewArtifactFileFact[];
  issues: ValidationIssue[];
}

function distBuildPath(path: string): string {
  return path.length === 0 ? "dist" : `dist/${path}`;
}

function sortIssues(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.sort(
    (left, right) =>
      compareCodePoints(left.path, right.path) ||
      compareCodePoints(left.code, right.code) ||
      compareCodePoints(left.message, right.message),
  );
}

function dedupeIssues(issues: readonly ValidationIssue[]): ValidationIssue[] {
  const seen = new Set<string>();
  return issues.filter((entry) => {
    const key = `${entry.code}\0${entry.path}\0${entry.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fsIdentity(metadata: BigIntStats): ReviewArtifactFsIdentity {
  return {
    dev: metadata.dev,
    ino: metadata.ino,
    size: metadata.size,
    mtimeNs: metadata.mtimeNs,
    ctimeNs: metadata.ctimeNs,
  };
}

function sameFsIdentity(
  left: ReviewArtifactFsIdentity,
  right: ReviewArtifactFsIdentity,
): boolean {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

/**
 * Inspects the artifact tree without following symlinks or reading file bodies.
 * Only regular files are admitted to the returned file ledger.
 */
export function scanReviewArtifactFiles(
  distDir: string,
): ReviewArtifactFileScan {
  const directories: ReviewArtifactDirectoryFact[] = [];
  const files: ReviewArtifactFileFact[] = [];
  const issues: ValidationIssue[] = [];

  const inspectDirectory = (
    directory: string,
    pathParts: string[],
    expectedIdentity: ReviewArtifactFsIdentity,
    parentDirectories: readonly ReviewArtifactDirectoryFact[],
  ): void => {
    const relativeDirectory = pathParts.join("/");
    let entries: string[];
    try {
      entries = readdirSync(directory).sort(compareCodePoints);
    } catch (error) {
      issues.push(
        issue(
          "review-artifact-directory-unreadable",
          distBuildPath(relativeDirectory),
          `artifact directory metadata could not be read: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
      return;
    }

    for (const entry of entries) {
      const fullPath = join(directory, entry);
      const entryParts = [...pathParts, entry];
      const relativePath = entryParts.join("/");
      let metadata;
      try {
        metadata = lstatSync(fullPath, { bigint: true });
      } catch (error) {
        issues.push(
          issue(
            "review-artifact-metadata-unreadable",
            distBuildPath(relativePath),
            `artifact entry metadata could not be read: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
        continue;
      }

      if (metadata.isSymbolicLink()) {
        issues.push(
          issue(
            "review-artifact-symlink",
            distBuildPath(relativePath),
            "artifact entries must not be symbolic links",
          ),
        );
      } else if (metadata.isDirectory()) {
        const directoryFact = {
          path: relativePath,
          scanIdentity: fsIdentity(metadata),
        };
        directories.push(directoryFact);
        inspectDirectory(fullPath, entryParts, directoryFact.scanIdentity, [
          ...parentDirectories,
          directoryFact,
        ]);
      } else if (metadata.isFile()) {
        files.push({
          path: relativePath,
          byteLength: Number(metadata.size),
          scanIdentity: fsIdentity(metadata),
          parentDirectories: [...parentDirectories],
        });
      } else {
        issues.push(
          issue(
            "review-artifact-non-regular-file",
            distBuildPath(relativePath),
            "artifact entries must be regular files or directories",
          ),
        );
      }
    }

    try {
      const after = lstatSync(directory, { bigint: true });
      if (
        after.isSymbolicLink() ||
        !after.isDirectory() ||
        !sameFsIdentity(expectedIdentity, fsIdentity(after))
      ) {
        issues.push(
          issue(
            "review-artifact-directory-changed",
            distBuildPath(relativeDirectory),
            "artifact directory changed while its metadata snapshot was captured",
          ),
        );
      }
    } catch {
      issues.push(
        issue(
          "review-artifact-directory-changed",
          distBuildPath(relativeDirectory),
          "artifact directory changed while its metadata snapshot was captured",
        ),
      );
    }
  };

  let rootMetadata;
  try {
    rootMetadata = lstatSync(distDir, { bigint: true });
  } catch (error) {
    return {
      directories,
      files,
      issues: [
        issue(
          "review-artifact-root-unreadable",
          "dist",
          `artifact root metadata could not be read: ${error instanceof Error ? error.message : String(error)}`,
        ),
      ],
    };
  }
  if (rootMetadata.isSymbolicLink()) {
    issues.push(
      issue(
        "review-artifact-root-symlink",
        "dist",
        "artifact root must not be a symbolic link",
      ),
    );
  } else if (!rootMetadata.isDirectory()) {
    issues.push(
      issue(
        "review-artifact-root-not-directory",
        "dist",
        "artifact root must be a directory",
      ),
    );
  } else {
    const rootDirectory = {
      path: "",
      scanIdentity: fsIdentity(rootMetadata),
    };
    directories.push(rootDirectory);
    inspectDirectory(distDir, [], rootDirectory.scanIdentity, [rootDirectory]);
  }

  directories.sort((left, right) => compareCodePoints(left.path, right.path));
  files.sort((left, right) => compareCodePoints(left.path, right.path));
  return { directories, files, issues: sortIssues(issues) };
}

/** Pure per-file boundary check used by the standard artifact verifier. */
export function checkReviewArtifactFileSizes(
  files: readonly ReviewArtifactFileFact[],
): ValidationIssue[] {
  return files
    .filter((file) => file.byteLength > PRIVATE_REVIEW_MAX_FILE_BYTES)
    .sort((left, right) => compareCodePoints(left.path, right.path))
    .map((file) =>
      issue(
        "review-artifact-file-size-limit",
        distBuildPath(file.path),
        `artifact file is oversized: observed ${file.byteLength} bytes; configured limit ${PRIVATE_REVIEW_MAX_FILE_BYTES} bytes`,
      ),
    );
}

export interface BoundedArtifactTextRead {
  text: string | null;
  issues: ValidationIssue[];
}

function assertScannedParentDirectories(
  distDir: string,
  parents: readonly ReviewArtifactDirectoryFact[],
): void {
  for (const parent of parents) {
    const target =
      parent.path === "" ? distDir : join(distDir, ...parent.path.split("/"));
    const metadata = lstatSync(target, { bigint: true });
    if (
      metadata.isSymbolicLink() ||
      !metadata.isDirectory() ||
      !sameFsIdentity(parent.scanIdentity, fsIdentity(metadata))
    ) {
      throw new Error("artifact parent directory changed after scan");
    }
  }
}

/**
 * Revalidates and reads one already-scanned regular file without following its
 * final path component. The fixed-size buffer and one-byte probe ensure a file
 * that grows after the metadata scan is rejected without an unbounded read.
 */
export function readBoundedArtifactText(
  distDir: string,
  file: ReviewArtifactFileFact,
): BoundedArtifactTextRead {
  if (file.byteLength > PRIVATE_REVIEW_MAX_FILE_BYTES) {
    return { text: null, issues: [] };
  }
  let descriptor: number | null = null;
  try {
    if (
      file.scanIdentity === undefined ||
      file.parentDirectories === undefined
    ) {
      throw new Error("artifact file is missing its scan identity");
    }
    assertScannedParentDirectories(distDir, file.parentDirectories);
    const target = join(distDir, ...file.path.split("/"));
    const before = lstatSync(target, { bigint: true });
    if (
      before.isSymbolicLink() ||
      !before.isFile() ||
      before.size !== BigInt(file.byteLength) ||
      !sameFsIdentity(file.scanIdentity, fsIdentity(before))
    ) {
      throw new Error("artifact file metadata changed after scan");
    }
    descriptor = openSync(
      target,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    const opened = fstatSync(descriptor, { bigint: true });
    if (
      !opened.isFile() ||
      !sameFsIdentity(file.scanIdentity, fsIdentity(opened)) ||
      opened.dev !== before.dev ||
      opened.ino !== before.ino ||
      opened.size !== before.size ||
      opened.mtimeNs !== before.mtimeNs ||
      opened.ctimeNs !== before.ctimeNs ||
      opened.size > BigInt(PRIVATE_REVIEW_MAX_FILE_BYTES)
    ) {
      throw new Error("artifact file changed before bounded read");
    }
    const bytes = Buffer.allocUnsafe(file.byteLength);
    let offset = 0;
    while (offset < bytes.byteLength) {
      const count = readSync(
        descriptor,
        bytes,
        offset,
        bytes.byteLength - offset,
        offset,
      );
      if (count === 0) {
        throw new Error("artifact file shortened during bounded read");
      }
      offset += count;
    }
    const extra = Buffer.allocUnsafe(1);
    if (readSync(descriptor, extra, 0, 1, bytes.byteLength) !== 0) {
      throw new Error("artifact file grew during bounded read");
    }
    const afterDescriptor = fstatSync(descriptor, { bigint: true });
    const afterPath = lstatSync(target, { bigint: true });
    if (
      afterPath.isSymbolicLink() ||
      !afterPath.isFile() ||
      afterDescriptor.dev !== opened.dev ||
      afterDescriptor.ino !== opened.ino ||
      afterDescriptor.size !== opened.size ||
      afterDescriptor.mtimeNs !== opened.mtimeNs ||
      afterDescriptor.ctimeNs !== opened.ctimeNs ||
      afterPath.dev !== opened.dev ||
      afterPath.ino !== opened.ino ||
      afterPath.size !== opened.size ||
      afterPath.mtimeNs !== opened.mtimeNs ||
      afterPath.ctimeNs !== opened.ctimeNs
    ) {
      throw new Error("artifact file changed during bounded read");
    }
    assertScannedParentDirectories(distDir, file.parentDirectories);
    return { text: bytes.toString("utf8"), issues: [] };
  } catch {
    return {
      text: null,
      issues: [
        issue(
          "review-artifact-bounded-read",
          distBuildPath(file.path),
          "artifact file could not be read as the same bounded regular file recorded by the metadata scan",
        ),
      ],
    };
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
}

export interface LoadBuiltOutputOptions {
  /** Deterministic test hook; the production CLI never supplies it. */
  afterScan?: (scan: ReviewArtifactFileScan) => void;
}

export function loadBuiltOutput(
  distDir: string,
  options: LoadBuiltOutputOptions = {},
): {
  pages: BuiltPage[];
  files: string[];
  artifactScan: ReviewArtifactFileScan;
  artifactFileFacts: ReviewArtifactFileFact[];
  artifactFileIssues: ValidationIssue[];
} {
  const scanned = scanReviewArtifactFiles(distDir);
  options.afterScan?.(scanned);
  const files = scanned.files.map((file) => file.path);
  const artifactFileIssues = sortIssues([
    ...scanned.issues,
    ...checkReviewArtifactFileSizes(scanned.files),
  ]);
  const pages: BuiltPage[] = [];
  for (const file of scanned.files.filter((entry) =>
    entry.path.endsWith(".html"),
  )) {
    const read = readBoundedArtifactText(distDir, file);
    artifactFileIssues.push(...read.issues);
    if (read.text !== null) pages.push({ path: file.path, html: read.text });
  }
  return {
    pages,
    files,
    artifactScan: scanned,
    artifactFileFacts: scanned.files,
    artifactFileIssues: sortIssues(artifactFileIssues),
  };
}

function scansHaveSameIdentity(
  before: ReviewArtifactFileScan,
  after: ReviewArtifactFileScan,
): boolean {
  if (
    before.directories.length !== after.directories.length ||
    before.files.length !== after.files.length
  ) {
    return false;
  }
  const sameDirectories = before.directories.every((directory, index) => {
    const candidate = after.directories[index];
    return (
      candidate !== undefined &&
      directory.path === candidate.path &&
      sameFsIdentity(directory.scanIdentity, candidate.scanIdentity)
    );
  });
  if (!sameDirectories) return false;
  return before.files.every((file, index) => {
    const candidate = after.files[index];
    return (
      candidate !== undefined &&
      file.path === candidate.path &&
      file.byteLength === candidate.byteLength &&
      file.scanIdentity !== undefined &&
      candidate.scanIdentity !== undefined &&
      sameFsIdentity(file.scanIdentity, candidate.scanIdentity)
    );
  });
}

export function checkReviewArtifactScanStability(
  before: ReviewArtifactFileScan,
  after: ReviewArtifactFileScan,
): ValidationIssue[] {
  if (scansHaveSameIdentity(before, after)) return [];
  return [
    issue(
      "review-artifact-snapshot-changed",
      "dist",
      "artifact file or directory identities changed during verification",
    ),
  ];
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
  files: readonly ReviewArtifactFileFact[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const redirectFileRe = /(^|\/)(?:_redirects|redirects?\.json)$/iu;
  for (const file of files.filter((candidate) =>
    redirectFileRe.test(candidate.path),
  )) {
    const read = readBoundedArtifactText(distDir, file);
    issues.push(...read.issues);
    if (read.text === null) continue;
    for (const candidate of nbaUrlsInRedirectArtifact(read.text)) {
      issues.push(
        issue(
          "review-nba-deep-link-redirect",
          file.path,
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

export interface ReviewArtifactVerificationIo {
  log: (message: string) => void;
  error: (message: string) => void;
}

const consoleIo: ReviewArtifactVerificationIo = {
  log: (message) => console.log(message),
  error: (message) => console.error(message),
};

/** Runs the exact standard verifier logic and returns its CLI exit code. */
export function runReviewArtifactVerification(
  root = process.cwd(),
  distDir = join(root, "dist"),
  io: ReviewArtifactVerificationIo = consoleIo,
  loadOptions: LoadBuiltOutputOptions = {},
): number {
  if (!existsSync(distDir)) {
    io.error(
      "verify:review-artifact FAILED — dist/ is missing; run npm run build:review first",
    );
    return 1;
  }
  const { pages, files, artifactScan, artifactFileFacts, artifactFileIssues } =
    loadBuiltOutput(distDir, loadOptions);
  const issues: ValidationIssue[] = [];

  issues.push(...artifactFileIssues);
  issues.push(...validateReviewOutput(pages, files));
  const nbaCitations = checkNbaPlainTextCitations(root, pages);
  issues.push(...nbaCitations.issues);
  issues.push(...checkNbaDeepLinkRedirectArtifacts(distDir, artifactFileFacts));

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

  const robotsFile = artifactFileFacts.find(
    (file) => file.path === "robots.txt",
  );
  if (robotsFile === undefined) {
    issues.push(
      issue("review-robots-missing", "robots.txt", "robots.txt is missing"),
    );
  } else {
    const read = readBoundedArtifactText(distDir, robotsFile);
    issues.push(...read.issues);
    if (read.text !== null && read.text !== DISALLOW_ALL_ROBOTS_TXT) {
      issues.push(
        issue(
          "review-robots-body",
          "robots.txt",
          "review robots.txt must be exactly `User-agent: *` + `Disallow: /`",
        ),
      );
    }
  }

  issues.push(...checkHeaderPolicy(root));

  const finalScan = scanReviewArtifactFiles(distDir);
  issues.push(
    ...finalScan.issues,
    ...checkReviewArtifactFileSizes(finalScan.files),
    ...checkReviewArtifactScanStability(artifactScan, finalScan),
  );

  const casePages = files.filter(
    (path) => path.startsWith("cases/") && path.endsWith(".html"),
  );
  io.log(
    `verify:review-artifact pages=${pages.length} casePages=${casePages.length}` +
      (casePages.length === 0 ? " (no case data)" : ""),
  );
  io.log(
    `Decision 16 artifact size guard: files=${artifactFileFacts.length} limit=${PRIVATE_REVIEW_MAX_FILE_BYTES} bytes`,
  );
  io.log(
    `Decision 11 NBA citations: videoSources=${nbaCitations.videoSources} sourceRows=${nbaCitations.sourceRows}`,
  );

  const reportedIssues = dedupeIssues(issues);
  if (reportedIssues.length > 0) {
    for (const entry of reportedIssues) {
      io.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
    }
    io.error(
      `verify:review-artifact FAILED with ${reportedIssues.length} issue(s)`,
    );
    return 1;
  }

  io.log(
    "Static review artifact checks OK: noindex meta on every page; no sitemap/analytics/iframe/preconnect/nonlocal images.",
  );
  io.log(
    "HTTP access/header delivery: not-verified — no hosting request has been made; this is not a pass for header delivery.",
  );
  return 0;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exitCode = runReviewArtifactVerification();
}
