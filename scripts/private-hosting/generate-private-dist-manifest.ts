import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  openSync,
  readSync,
  readdirSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
  type BigIntStats,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { parse, type DefaultTreeAdapterTypes } from "parse5";
import {
  reviewFixtureClassicCase,
  reviewFixtureOverview,
  reviewFixtureUpdate,
  selectReviewFixtureCases,
} from "../../src/data/review-fixtures";
import { computeCaseContentDigest } from "../../src/lib/cases/digest";
import { loadFollowUpCorpus } from "../../src/lib/cases/follow-up-loader";
import { computeInjuryOverviewDigest } from "../../src/lib/cases/injury-overview-digest";
import {
  buildCaseIndexManifest,
  buildCaseIndexShards,
  INDEX_SHARD_SIZE,
  LISTING_PAGE_SIZE,
  type CaseIndexEntry,
  type CaseIndexManifest,
} from "../../src/lib/cases/pagination";
import { selectMedicallyApprovedCases } from "../../src/lib/cases/selectors";
import { computeQuarterlyUpdateDigest } from "../../src/lib/cases/update-digest";
import { VIDEO_SOURCE_TOKENS } from "../../src/lib/cases/video-source";
import { validateCaseSourceBinding } from "../../src/lib/contracts/cross-validation";
import { FOLLOW_UP_SOURCE_POLICY_V10_BINDING } from "../../src/lib/contracts/case-follow-up";
import type { QuarterlyUpdate } from "../../src/lib/contracts/update";
import { defaultTaxonomyRegistries } from "../../src/lib/contracts/taxonomy";
import {
  ARTIFACT_IDENTITY_META_NAME,
  buildArtifactManifest,
  canonicalRequestPathForBuildPath,
  decodeArtifactIdentity,
  PRIVATE_HTTP_HEADER_POLICY_SHA256,
  type ArtifactIdentity,
  type ArtifactManifest,
  type BuiltFileInput,
} from "../../src/lib/governance/artifact-manifest";
import {
  canonicalJson,
  compareCodePoints,
  isValidIsoDate,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import {
  DISALLOW_ALL_ROBOTS_TXT,
  NOINDEX_ROBOTS_META,
} from "../../src/lib/governance/build-mode";
import { PRIVATE_REVIEW_MAX_FILE_BYTES } from "../../src/lib/governance/private-review-limits";
import {
  parseReviewSetManifestV2Bytes,
  REVIEW_SET_V2_MANIFEST_PATH,
  type ReviewSetManifestV2,
} from "../../src/lib/governance/review-set";
import {
  computeRenderedSetDigest,
  reviewFixtureParams,
} from "../../src/lib/routes/static-paths";
import { componentLabStaticParams } from "../../src/lib/video/player-state";
import {
  loadContentCollections,
  loadRealRegistry,
  registryArtifactLoader,
} from "../check-content";
import {
  currentContentAuthoritySnapshotDigest,
  currentRendererTreeDigest,
  currentReviewSetV2ContentAuthoritySnapshotDigest,
  currentSupportingDataDigest,
} from "../generate-review-set";

export const PRIVATE_DIST_MANIFEST_PATH =
  "review/private-dist-manifest.v1.json";

export class PrivateDistManifestError extends Error {}

const PRIVATE_REVIEW_MAX_FILE_BYTES_BIGINT = BigInt(
  PRIVATE_REVIEW_MAX_FILE_BYTES,
);

function assertPrivateReviewFileByteLength(
  relativePath: string,
  byteLength: bigint,
): void {
  if (byteLength < 0n || byteLength > PRIVATE_REVIEW_MAX_FILE_BYTES_BIGINT) {
    throw new PrivateDistManifestError(
      `private-review file ${relativePath} exceeds the ${PRIVATE_REVIEW_MAX_FILE_BYTES}-byte limit`,
    );
  }
}

export interface PrivateDistSourceState {
  commit: string;
  dirty: boolean;
  rendererTreeDigest: string;
  supportingDataDigest: string;
  approvedCoreContentAuthoritySnapshotDigest: string;
  contentAuthoritySnapshotDigest: string;
  followUps: Array<{
    caseId: string;
    sidecarPath: string;
    draftDigest: string;
    status: "pending-owner-signoff";
    sourcePolicyVersion: "nba-v10";
  }>;
  updates: Array<{
    updateId: string;
    updateDigest: string;
    recordIds: string[];
  }>;
  caseIndex: {
    manifest: CaseIndexManifest;
    shards: Array<{ buildPath: string; records: CaseIndexEntry[] }>;
  };
}

export interface BuildPrivateDistManifestOptions {
  root: string;
  buildMode: string;
  sourceState: PrivateDistSourceState;
  now?: Date;
}

function utcSeconds(date: Date): string {
  const value = date.toISOString();
  return value.replace(/\.\d{3}Z$/u, "Z");
}

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

export function contentTypeForBuildPath(buildPath: string): string {
  if (buildPath.endsWith(".gz") || buildPath.endsWith(".br")) {
    throw new PrivateDistManifestError(
      `precompressed output is forbidden: ${buildPath}`,
    );
  }
  const contentType = CONTENT_TYPES[extname(buildPath).toLowerCase()];
  if (contentType === undefined) {
    throw new PrivateDistManifestError(
      `unknown content type for build path ${buildPath}`,
    );
  }
  return contentType;
}

function safeRelativePath(root: string, target: string): string {
  const value = relative(root, target).split(sep).join("/");
  if (
    value === "" ||
    value.startsWith("../") ||
    value.startsWith("/") ||
    value.split("/").some((segment) => segment.startsWith(".")) ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    throw new PrivateDistManifestError(`unsafe dist path ${value}`);
  }
  return value;
}

/** Walks a dist tree without following any symlink or accepting special files. */
export function walkPrivateDist(distDir: string): string[] {
  const root = resolve(distDir);
  const rootStat = lstatSync(root);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new PrivateDistManifestError("dist root must be a real directory");
  }
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory).sort(compareCodePoints)) {
      if (name.startsWith(".") || /[\u0000-\u001f\u007f]/u.test(name)) {
        throw new PrivateDistManifestError(
          `dotfile/control path is forbidden: ${name}`,
        );
      }
      const target = join(directory, name);
      const stat = lstatSync(target, { bigint: true });
      if (stat.isSymbolicLink()) {
        throw new PrivateDistManifestError(`symlink is forbidden: ${target}`);
      }
      if (stat.isDirectory()) {
        visit(target);
      } else if (stat.isFile()) {
        const relativePath = safeRelativePath(root, target);
        assertPrivateReviewFileByteLength(relativePath, stat.size);
        files.push(relativePath);
      } else {
        throw new PrivateDistManifestError(
          `special dist file is forbidden: ${target}`,
        );
      }
    }
  };
  visit(root);
  return files.sort(compareCodePoints);
}

interface FileIdentity {
  dev: bigint;
  ino: bigint;
  size: bigint;
  mtimeNs: bigint;
  ctimeNs: bigint;
}

function fileIdentity(stat: BigIntStats): FileIdentity {
  return {
    dev: stat.dev,
    ino: stat.ino,
    size: stat.size,
    mtimeNs: stat.mtimeNs,
    ctimeNs: stat.ctimeNs,
  };
}

function sameFileIdentity(left: FileIdentity, right: FileIdentity): boolean {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

function readBoundedOpenedFile(
  descriptor: number,
  expectedSize: bigint,
  relativePath: string,
): Buffer {
  assertPrivateReviewFileByteLength(relativePath, expectedSize);
  const byteLength = Number(expectedSize);
  const bytes = Buffer.allocUnsafe(byteLength);
  let offset = 0;
  while (offset < byteLength) {
    const read = readSync(
      descriptor,
      bytes,
      offset,
      byteLength - offset,
      offset,
    );
    if (read === 0) {
      throw new PrivateDistManifestError(
        `snapshot target changed during bounded read: ${relativePath}`,
      );
    }
    offset += read;
  }
  const extra = Buffer.allocUnsafe(1);
  if (readSync(descriptor, extra, 0, 1, byteLength) !== 0) {
    throw new PrivateDistManifestError(
      `snapshot target exceeded its opened size during bounded read: ${relativePath}`,
    );
  }
  return bytes;
}

/**
 * Opens one file without following its final component, verifies every parent
 * remains a real directory, and requires stable fd/path identity before and
 * after the read. The returned bytes are therefore one closed snapshot, not a
 * second pathname read after the symlink-safe tree walk.
 */
function readStableRegularFile(baseDir: string, relativePath: string): Buffer {
  const root = resolve(baseDir);
  const rootStat = lstatSync(root, { bigint: true });
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new PrivateDistManifestError(
      "snapshot root must be a real directory",
    );
  }
  const target = join(root, ...relativePath.split("/"));
  if (safeRelativePath(root, target) !== relativePath) {
    throw new PrivateDistManifestError(
      `snapshot path is not canonical: ${relativePath}`,
    );
  }
  const parentSnapshots = [
    { path: root, identity: fileIdentity(rootStat) },
    ...relativePath
      .split("/")
      .slice(0, -1)
      .map((_, index, segments) => {
        const path = join(root, ...segments.slice(0, index + 1));
        const stat = lstatSync(path, { bigint: true });
        if (stat.isSymbolicLink() || !stat.isDirectory()) {
          throw new PrivateDistManifestError(
            `snapshot parent is not a real directory: ${relativePath}`,
          );
        }
        return { path, identity: fileIdentity(stat) };
      }),
  ];
  const pre = lstatSync(target, { bigint: true });
  if (pre.isSymbolicLink() || !pre.isFile()) {
    throw new PrivateDistManifestError(
      `snapshot target is not a regular file: ${relativePath}`,
    );
  }
  assertPrivateReviewFileByteLength(relativePath, pre.size);
  const rootRealPath = realpathSync.native(root);
  const beforeRealPath = realpathSync.native(target);
  if (
    beforeRealPath !== rootRealPath &&
    !beforeRealPath.startsWith(`${rootRealPath}${sep}`)
  ) {
    throw new PrivateDistManifestError(
      `snapshot target escaped its root: ${relativePath}`,
    );
  }

  let descriptor: number | null = null;
  try {
    descriptor = openSync(
      target,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    const opened = fstatSync(descriptor, { bigint: true });
    if (!opened.isFile()) {
      throw new PrivateDistManifestError(
        `snapshot descriptor is not a regular file: ${relativePath}`,
      );
    }
    assertPrivateReviewFileByteLength(relativePath, opened.size);
    const preIdentity = fileIdentity(pre);
    const openedIdentity = fileIdentity(opened);
    if (!sameFileIdentity(preIdentity, openedIdentity)) {
      throw new PrivateDistManifestError(
        `snapshot target changed before read: ${relativePath}`,
      );
    }
    const bytes = readBoundedOpenedFile(descriptor, opened.size, relativePath);
    const afterFd = fstatSync(descriptor, { bigint: true });
    const post = lstatSync(target, { bigint: true });
    if (post.isSymbolicLink() || !post.isFile()) {
      throw new PrivateDistManifestError(
        `snapshot target changed type during read: ${relativePath}`,
      );
    }
    const afterRealPath = realpathSync.native(target);
    if (
      afterRealPath !== beforeRealPath ||
      !sameFileIdentity(openedIdentity, fileIdentity(afterFd)) ||
      !sameFileIdentity(openedIdentity, fileIdentity(post)) ||
      BigInt(bytes.byteLength) !== opened.size
    ) {
      throw new PrivateDistManifestError(
        `snapshot target changed during read: ${relativePath}`,
      );
    }
    for (const parent of parentSnapshots) {
      const stat = lstatSync(parent.path, { bigint: true });
      if (
        stat.isSymbolicLink() ||
        !stat.isDirectory() ||
        !sameFileIdentity(parent.identity, fileIdentity(stat))
      ) {
        throw new PrivateDistManifestError(
          `snapshot parent changed during read: ${relativePath}`,
        );
      }
    }
    return bytes;
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
}

type HtmlElement = DefaultTreeAdapterTypes.Element;
type HtmlNode = DefaultTreeAdapterTypes.Node;

const INERT_HTML_ELEMENTS = new Set([
  "script",
  "style",
  "template",
  "noscript",
]);

function isHtmlElement(node: HtmlNode): node is HtmlElement {
  return "tagName" in node;
}

function childElements(node: HtmlNode): HtmlElement[] {
  if (!("childNodes" in node)) return [];
  return node.childNodes.filter(isHtmlElement);
}

function descendantElements(node: HtmlNode): HtmlElement[] {
  const result: HtmlElement[] = [];
  for (const child of childElements(node)) {
    result.push(child);
    if (!INERT_HTML_ELEMENTS.has(child.tagName)) {
      result.push(...descendantElements(child));
    }
  }
  return result;
}

function htmlAttribute(element: HtmlElement, name: string): string | null {
  return element.attrs.find((entry) => entry.name === name)?.value ?? null;
}

interface ParsedHtmlDocument {
  document: DefaultTreeAdapterTypes.Document;
  head: HtmlElement;
  body: HtmlElement;
}

function parseHtmlDocument(
  html: string,
  requestPath: string,
): ParsedHtmlDocument {
  const parseErrors: string[] = [];
  const document = parse(html, {
    sourceCodeLocationInfo: true,
    onParseError: (error) => parseErrors.push(error.code),
  });
  if (parseErrors.length > 0) {
    throw new PrivateDistManifestError(
      `${requestPath}: invalid HTML (${parseErrors.join(", ")})`,
    );
  }
  const htmlElements = childElements(document).filter(
    (element) => element.tagName === "html",
  );
  const headElements =
    htmlElements.length === 1
      ? childElements(htmlElements[0]!).filter(
          (element) => element.tagName === "head",
        )
      : [];
  const bodyElements =
    htmlElements.length === 1
      ? childElements(htmlElements[0]!).filter(
          (element) => element.tagName === "body",
        )
      : [];
  if (
    htmlElements.length !== 1 ||
    headElements.length !== 1 ||
    bodyElements.length !== 1 ||
    htmlElements[0]!.sourceCodeLocation == null ||
    headElements[0]!.sourceCodeLocation == null ||
    bodyElements[0]!.sourceCodeLocation == null
  ) {
    throw new PrivateDistManifestError(
      `${requestPath}: one explicit html/head/body document is required`,
    );
  }
  return {
    document,
    head: headElements[0]!,
    body: bodyElements[0]!,
  };
}

type HtmlRouteKind =
  | "home"
  | "static"
  | "case"
  | "injury"
  | "injury-page"
  | "league"
  | "update"
  | "fixture-case"
  | "fixture-injury"
  | "fixture-league"
  | "fixture-update";

interface ExpectedHtmlRoute {
  kind: HtmlRouteKind;
  recordIds: readonly string[];
  bodyRecordIds?: readonly string[];
  digest: string | null;
  scopeId?: string;
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort(compareCodePoints);
}

function assertExactIds(
  requestPath: string,
  label: string,
  actual: readonly string[],
  expected: readonly string[],
): void {
  const left = sortedUnique(actual);
  const right = sortedUnique(expected);
  if (
    left.length !== actual.length ||
    right.length !== expected.length ||
    left.length !== right.length ||
    left.some((value, index) => value !== right[index])
  ) {
    throw new PrivateDistManifestError(
      `${requestPath}: ${label} does not exactly match the expected record IDs`,
    );
  }
}

function elementsWithAttribute(root: HtmlNode, name: string): HtmlElement[] {
  return descendantElements(root).filter(
    (element) => htmlAttribute(element, name) !== null,
  );
}

function requireSingleMarker(
  body: HtmlElement,
  requestPath: string,
  name: string,
  expectedValue: string,
): HtmlElement {
  const matches = elementsWithAttribute(body, name);
  if (
    matches.length !== 1 ||
    htmlAttribute(matches[0]!, name) !== expectedValue
  ) {
    throw new PrivateDistManifestError(
      `${requestPath}: expected exactly one ${name}=${JSON.stringify(expectedValue)} body marker`,
    );
  }
  return matches[0]!;
}

function requireView(
  body: HtmlElement,
  requestPath: string,
  expectedValue: string,
): HtmlElement {
  const matches = elementsWithAttribute(body, "data-atlas-view").filter(
    (element) => htmlAttribute(element, "data-atlas-view") === expectedValue,
  );
  if (matches.length !== 1) {
    throw new PrivateDistManifestError(
      `${requestPath}: expected exactly one ${expectedValue} view`,
    );
  }
  return matches[0]!;
}

function validateListingMarkers(
  body: HtmlElement,
  requestPath: string,
  identityRecordIds: readonly string[],
  expectedBodyRecordIds: readonly string[],
): void {
  const listings = elementsWithAttribute(body, "data-static-listing");
  if (listings.length !== 1) {
    throw new PrivateDistManifestError(
      `${requestPath}: expected exactly one static listing`,
    );
  }
  const cards = elementsWithAttribute(listings[0]!, "data-case-card");
  const cardIds = cards.map((element) =>
    htmlAttribute(element, "data-case-card"),
  );
  if (cardIds.some((value) => value === null || value === "")) {
    throw new PrivateDistManifestError(
      `${requestPath}: case-card markers must contain record IDs`,
    );
  }
  assertExactIds(
    requestPath,
    "listing card markers",
    cardIds as string[],
    identityRecordIds,
  );
  if (
    cardIds.length !== expectedBodyRecordIds.length ||
    cardIds.some((caseId, index) => caseId !== expectedBodyRecordIds[index])
  ) {
    throw new PrivateDistManifestError(
      `${requestPath}: listing card order does not match the selector order`,
    );
  }
}

function validateBodyIdentity(
  body: HtmlElement,
  requestPath: string,
  identity: ArtifactIdentity,
  expected: ExpectedHtmlRoute,
): void {
  if (expected.kind === "case" || expected.kind === "fixture-case") {
    const view = requireView(body, requestPath, "case-detail");
    const caseMarker = requireSingleMarker(
      body,
      requestPath,
      "data-case-id",
      identity.recordIds[0] ?? "",
    );
    if (view !== caseMarker) {
      throw new PrivateDistManifestError(
        `${requestPath}: case identity markers must be on the primary case view`,
      );
    }
  } else if (expected.kind === "injury") {
    requireSingleMarker(
      body,
      requestPath,
      "data-injury-overview",
      expected.scopeId!,
    );
    validateListingMarkers(
      body,
      requestPath,
      identity.recordIds,
      expected.bodyRecordIds ?? expected.recordIds,
    );
  } else if (expected.kind === "injury-page") {
    if (elementsWithAttribute(body, "data-injury-overview").length !== 0) {
      throw new PrivateDistManifestError(
        `${requestPath}: paginated injury route must not repeat an overview marker`,
      );
    }
    validateListingMarkers(
      body,
      requestPath,
      identity.recordIds,
      expected.bodyRecordIds ?? expected.recordIds,
    );
  } else if (expected.kind === "league") {
    validateListingMarkers(
      body,
      requestPath,
      identity.recordIds,
      expected.bodyRecordIds ?? expected.recordIds,
    );
  } else if (expected.kind === "update" || expected.kind === "fixture-update") {
    const view = requireView(body, requestPath, "quarterly-update");
    const updateMarker = requireSingleMarker(
      body,
      requestPath,
      "data-update-id",
      expected.scopeId!,
    );
    if (view !== updateMarker) {
      throw new PrivateDistManifestError(
        `${requestPath}: update identity markers must be on the update view`,
      );
    }
    const markerIds = elementsWithAttribute(body, "data-update-case-id").map(
      (element) => htmlAttribute(element, "data-update-case-id"),
    );
    if (markerIds.some((value) => value === null || value === "")) {
      throw new PrivateDistManifestError(
        `${requestPath}: update case markers must contain record IDs`,
      );
    }
    assertExactIds(
      requestPath,
      "update case markers",
      markerIds as string[],
      identity.recordIds,
    );
  } else if (expected.kind === "fixture-injury") {
    requireView(body, requestPath, "injury-overview");
    requireSingleMarker(
      body,
      requestPath,
      "data-injury-overview",
      expected.scopeId!,
    );
  } else if (expected.kind === "fixture-league") {
    requireView(body, requestPath, "league-listing");
    validateListingMarkers(
      body,
      requestPath,
      identity.recordIds,
      expected.bodyRecordIds ?? expected.recordIds,
    );
  }
}

function extractHtmlIdentity(
  html: string,
  requestPath: string,
  reviewSet: ReviewSetManifestV2,
  expected: ExpectedHtmlRoute,
): ArtifactIdentity {
  const parsedHtml = parseHtmlDocument(html, requestPath);
  const allElements = descendantElements(parsedHtml.document);
  const headElements = new Set(descendantElements(parsedHtml.head));
  const identities = allElements.filter(
    (element) =>
      element.tagName === "meta" &&
      htmlAttribute(element, "name") === ARTIFACT_IDENTITY_META_NAME,
  );
  if (identities.length !== 1 || !headElements.has(identities[0]!)) {
    throw new PrivateDistManifestError(
      `${requestPath}: expected exactly one head-scoped artifact identity meta`,
    );
  }
  const encoded = htmlAttribute(identities[0]!, "content");
  if (encoded === null) {
    throw new PrivateDistManifestError(
      `${requestPath}: artifact identity meta has no content`,
    );
  }
  const identity = decodeArtifactIdentity(encoded);
  if (
    identity.kind !== "html-page" ||
    identity.pageIds.length !== 1 ||
    identity.pageIds[0] !== requestPath
  ) {
    throw new PrivateDistManifestError(
      `${requestPath}: page identity does not match the canonical request path`,
    );
  }
  const robots = allElements.filter(
    (element) =>
      element.tagName === "meta" &&
      htmlAttribute(element, "name")?.toLowerCase() === "robots",
  );
  if (
    robots.length !== 1 ||
    !headElements.has(robots[0]!) ||
    htmlAttribute(robots[0]!, "content") !== NOINDEX_ROBOTS_META
  ) {
    throw new PrivateDistManifestError(
      `${requestPath}: exact review robots meta is required`,
    );
  }

  if (
    !requestPath.startsWith("/review/fixtures/") &&
    expected.kind !== "update"
  ) {
    const knownCaseIds = new Set(reviewSet.cases.map((entry) => entry.caseId));
    for (const recordId of identity.recordIds) {
      if (!knownCaseIds.has(recordId)) {
        throw new PrivateDistManifestError(
          `${requestPath}: unknown identity record ${recordId}`,
        );
      }
    }
  }
  assertExactIds(
    requestPath,
    "artifact identity",
    identity.recordIds,
    expected.recordIds,
  );
  if (identity.digest !== expected.digest) {
    throw new PrivateDistManifestError(
      `${requestPath}: artifact identity digest does not match the route contract`,
    );
  }
  validateBodyIdentity(parsedHtml.body, requestPath, identity, expected);
  return identity;
}

interface CaseIndexIdentityResult {
  identities: Map<string, ArtifactIdentity>;
  records: CaseIndexRouteRecord[];
}

interface CaseIndexRouteRecord {
  id: string;
  slug: string;
  injuryCode: string;
  leagueCode: string;
  eventDate: string;
}

function integer(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort(compareCodePoints);
  const canonical = [...expected].sort(compareCodePoints);
  return (
    actual.length === canonical.length &&
    actual.every((key, index) => key === canonical[index])
  );
}

const CASE_INDEX_RECORD_KEYS = [
  "athleteName",
  "classicReason",
  "competitionCode",
  "confirmationStatus",
  "eventDate",
  "eventYear",
  "id",
  "injuryCode",
  "isClassic",
  "leagueCode",
  "mechanismTags",
  "opponentName",
  "season",
  "slug",
  "sportCode",
  "teamName",
  "videoSource",
  "workflowStatus",
] as const;

interface CaseIndexShardDescriptor {
  buildPath: string;
  injuryCode: string;
  shardIndex: number;
  entryCount: number;
}

function extractCaseIndexIdentities(
  bytesByPath: Map<string, Uint8Array>,
  reviewSet: ReviewSetManifestV2,
  expectedCaseIndex: PrivateDistSourceState["caseIndex"],
): CaseIndexIdentityResult {
  const manifestPath = "case-index/manifest.json";
  const manifestBytes = bytesByPath.get(manifestPath);
  const shardBuildPaths = [...bytesByPath.keys()]
    .filter((path) => path.startsWith("case-index/") && path !== manifestPath)
    .sort(compareCodePoints);
  if (manifestBytes === undefined) {
    throw new PrivateDistManifestError(
      "case-index shard coverage requires manifest.json",
    );
  }

  let manifestValue: unknown;
  try {
    manifestValue = parseStrictJson(
      Buffer.from(manifestBytes).toString("utf8"),
    );
  } catch (error) {
    throw new PrivateDistManifestError(
      `invalid case-index manifest: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (
    typeof manifestValue !== "object" ||
    manifestValue === null ||
    Array.isArray(manifestValue)
  ) {
    throw new PrivateDistManifestError("invalid case-index manifest payload");
  }
  const candidate = manifestValue as Record<string, unknown>;
  if (
    !hasExactKeys(candidate, [
      "schemaVersion",
      "mode",
      "shardSize",
      "totalEntries",
      "injuries",
    ]) ||
    candidate.schemaVersion !== 1 ||
    candidate.mode !== "review" ||
    candidate.shardSize !== INDEX_SHARD_SIZE ||
    !integer(candidate.totalEntries) ||
    !Array.isArray(candidate.injuries)
  ) {
    throw new PrivateDistManifestError("invalid case-index manifest fields");
  }
  if (canonicalJson(candidate) !== canonicalJson(expectedCaseIndex.manifest)) {
    throw new PrivateDistManifestError(
      "case-index manifest differs from the strict source projection",
    );
  }

  const declaredBuildPaths: string[] = [];
  const declaredShards: CaseIndexShardDescriptor[] = [];
  const expectedCounts = new Map<string, number>();
  let declaredTotalEntries = 0;
  for (const rawEntry of candidate.injuries) {
    if (
      typeof rawEntry !== "object" ||
      rawEntry === null ||
      Array.isArray(rawEntry)
    ) {
      throw new PrivateDistManifestError("invalid case-index injury entry");
    }
    const entry = rawEntry as Record<string, unknown>;
    if (
      !hasExactKeys(entry, ["injuryCode", "entryCount", "shardCount"]) ||
      typeof entry.injuryCode !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(entry.injuryCode) ||
      !integer(entry.entryCount) ||
      !integer(entry.shardCount)
    ) {
      throw new PrivateDistManifestError("invalid case-index injury fields");
    }
    if (expectedCounts.has(entry.injuryCode)) {
      throw new PrivateDistManifestError("duplicate case-index injury entry");
    }
    expectedCounts.set(entry.injuryCode, entry.entryCount as number);
    declaredTotalEntries += entry.entryCount as number;
    if (
      (entry.shardCount as number) !==
      Math.ceil((entry.entryCount as number) / (candidate.shardSize as number))
    ) {
      throw new PrivateDistManifestError(
        `case-index shardCount mismatch for ${entry.injuryCode}`,
      );
    }
    for (let index = 1; index <= (entry.shardCount as number); index += 1) {
      const buildPath = `case-index/${entry.injuryCode}/${index}.json`;
      declaredBuildPaths.push(buildPath);
      declaredShards.push({
        buildPath,
        injuryCode: entry.injuryCode,
        shardIndex: index,
        entryCount: entry.entryCount as number,
      });
    }
  }
  if (declaredTotalEntries !== candidate.totalEntries) {
    throw new PrivateDistManifestError(
      "case-index declared counts do not match totalEntries",
    );
  }
  const reviewInjuryCodes = reviewSet.overviews
    .map((entry) => entry.injuryCode)
    .sort(compareCodePoints);
  const declaredInjuryCodes = [...expectedCounts.keys()].sort(
    compareCodePoints,
  );
  if (
    reviewInjuryCodes.length !== declaredInjuryCodes.length ||
    reviewInjuryCodes.some(
      (injuryCode, index) => injuryCode !== declaredInjuryCodes[index],
    )
  ) {
    throw new PrivateDistManifestError(
      "case-index injury coverage differs from the review-set overviews",
    );
  }
  declaredBuildPaths.sort(compareCodePoints);
  if (
    declaredBuildPaths.length !== shardBuildPaths.length ||
    declaredBuildPaths.some((path, index) => path !== shardBuildPaths[index])
  ) {
    throw new PrivateDistManifestError(
      "case-index shard coverage differs from the manifest payload",
    );
  }

  const identities = new Map<string, ArtifactIdentity>();
  const records: CaseIndexRouteRecord[] = [];
  const allIds = new Set<string>();
  const allSlugs = new Set<string>();
  const actualCounts = new Map<string, number>();
  const recordsByInjury = new Map<string, CaseIndexRouteRecord[]>();
  const expectedShards = new Map(
    expectedCaseIndex.shards.map((shard) => [shard.buildPath, shard.records]),
  );
  for (const descriptor of declaredShards.sort(
    (left, right) =>
      compareCodePoints(left.injuryCode, right.injuryCode) ||
      left.shardIndex - right.shardIndex,
  )) {
    const { buildPath } = descriptor;
    let payload: unknown;
    try {
      payload = parseStrictJson(
        Buffer.from(bytesByPath.get(buildPath)!).toString("utf8"),
      );
    } catch (error) {
      throw new PrivateDistManifestError(
        `invalid case-index shard ${buildPath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (!Array.isArray(payload)) {
      throw new PrivateDistManifestError(
        `case-index shard ${buildPath} is not an array`,
      );
    }
    const expectedShardLength = Math.min(
      INDEX_SHARD_SIZE,
      descriptor.entryCount - (descriptor.shardIndex - 1) * INDEX_SHARD_SIZE,
    );
    if (payload.length !== expectedShardLength) {
      throw new PrivateDistManifestError(
        `case-index shard ${buildPath} does not match the canonical partition`,
      );
    }
    const ids: string[] = [];
    for (const rawRecord of payload) {
      if (
        typeof rawRecord !== "object" ||
        rawRecord === null ||
        Array.isArray(rawRecord) ||
        !hasExactKeys(
          rawRecord as Record<string, unknown>,
          CASE_INDEX_RECORD_KEYS,
        ) ||
        typeof (rawRecord as Record<string, unknown>).id !== "string" ||
        typeof (rawRecord as Record<string, unknown>).slug !== "string" ||
        typeof (rawRecord as Record<string, unknown>).injuryCode !== "string" ||
        typeof (rawRecord as Record<string, unknown>).leagueCode !== "string" ||
        typeof (rawRecord as Record<string, unknown>).eventDate !== "string"
      ) {
        throw new PrivateDistManifestError(
          `case-index shard ${buildPath} contains an invalid record`,
        );
      }
      const id = (rawRecord as { id: string }).id;
      const slug = (rawRecord as { slug: string }).slug;
      const leagueCode = (rawRecord as { leagueCode: string }).leagueCode;
      const eventDate = (rawRecord as { eventDate: string }).eventDate;
      const stringFields = [
        "athleteName",
        "competitionCode",
        "confirmationStatus",
        "id",
        "injuryCode",
        "leagueCode",
        "opponentName",
        "season",
        "slug",
        "sportCode",
        "teamName",
        "videoSource",
        "workflowStatus",
      ] as const;
      if (
        stringFields.some(
          (field) =>
            typeof (rawRecord as Record<string, unknown>)[field] !== "string" ||
            (rawRecord as Record<string, unknown>)[field] === "",
        ) ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug) ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(leagueCode) ||
        !isValidIsoDate(eventDate) ||
        (rawRecord as Record<string, unknown>)["eventYear"] !==
          Number.parseInt(eventDate.slice(0, 4), 10) ||
        typeof (rawRecord as Record<string, unknown>)["isClassic"] !==
          "boolean" ||
        !(
          (rawRecord as Record<string, unknown>)["classicReason"] === null ||
          typeof (rawRecord as Record<string, unknown>)["classicReason"] ===
            "string"
        ) ||
        !Array.isArray(
          (rawRecord as Record<string, unknown>)["mechanismTags"],
        ) ||
        (
          (rawRecord as Record<string, unknown>)["mechanismTags"] as unknown[]
        ).some((tag) => typeof tag !== "string" || tag === "") ||
        !VIDEO_SOURCE_TOKENS.includes(
          (rawRecord as Record<string, unknown>)[
            "videoSource"
          ] as (typeof VIDEO_SOURCE_TOKENS)[number],
        )
      ) {
        throw new PrivateDistManifestError(
          `case-index record ${id} has invalid route fields`,
        );
      }
      const payloadInjuryCode = (rawRecord as Record<string, unknown>)[
        "injuryCode"
      ];
      const injuryCode = buildPath.split("/")[1]!;
      if (
        typeof payloadInjuryCode !== "string" ||
        payloadInjuryCode !== injuryCode
      ) {
        throw new PrivateDistManifestError(
          `case-index record ${id} does not match shard injuryCode`,
        );
      }
      if (allIds.has(id)) {
        throw new PrivateDistManifestError(`duplicate case-index record ${id}`);
      }
      if (allSlugs.has(slug)) {
        throw new PrivateDistManifestError(`duplicate case-index slug ${slug}`);
      }
      allIds.add(id);
      allSlugs.add(slug);
      ids.push(id);
      const routeRecord = {
        id,
        slug,
        injuryCode: (rawRecord as { injuryCode: string }).injuryCode,
        leagueCode,
        eventDate,
      };
      records.push(routeRecord);
      const orderedInjuryRecords = recordsByInjury.get(injuryCode);
      if (orderedInjuryRecords === undefined) {
        recordsByInjury.set(injuryCode, [routeRecord]);
      } else {
        orderedInjuryRecords.push(routeRecord);
      }
    }
    const expectedPayload = expectedShards.get(buildPath);
    if (
      expectedPayload === undefined ||
      canonicalJson(payload) !== canonicalJson(expectedPayload)
    ) {
      throw new PrivateDistManifestError(
        `case-index shard ${buildPath} differs from the strict source projection`,
      );
    }
    ids.sort(compareCodePoints);
    const injuryCode = buildPath.split("/")[1]!;
    actualCounts.set(
      injuryCode,
      (actualCounts.get(injuryCode) ?? 0) + ids.length,
    );
    const requestPath = canonicalRequestPathForBuildPath(buildPath);
    const digest = sha256Hex(bytesByPath.get(buildPath)!);
    identities.set(buildPath, {
      kind: "case-index-shard",
      pageIds: [],
      recordIds: ids,
      digest,
      shardIds: [requestPath],
    });
  }
  for (const [injuryCode, count] of expectedCounts) {
    if ((actualCounts.get(injuryCode) ?? 0) !== count) {
      throw new PrivateDistManifestError(
        `case-index coverage count mismatch for ${injuryCode}`,
      );
    }
    const observedOrder = recordsByInjury.get(injuryCode) ?? [];
    const expectedOrder = selectorOrderedRecords(observedOrder);
    if (
      observedOrder.length !== expectedOrder.length ||
      observedOrder.some(
        (record, index) => record.id !== expectedOrder[index]!.id,
      )
    ) {
      throw new PrivateDistManifestError(
        `case-index shard order is not canonical for ${injuryCode}`,
      );
    }
  }
  if (allIds.size !== candidate.totalEntries) {
    throw new PrivateDistManifestError("case-index total coverage mismatch");
  }
  const expectedReviewIds = reviewSet.cases
    .map((entry) => entry.caseId)
    .sort(compareCodePoints);
  const observedIds = [...allIds].sort(compareCodePoints);
  if (
    expectedReviewIds.length !== observedIds.length ||
    expectedReviewIds.some((id, index) => id !== observedIds[index])
  ) {
    throw new PrivateDistManifestError(
      "case-index record coverage differs from the review set",
    );
  }
  identities.set(manifestPath, {
    kind: "case-index-manifest",
    pageIds: [],
    recordIds: [],
    digest: sha256Hex(manifestBytes),
    shardIds: declaredBuildPaths.map(canonicalRequestPathForBuildPath),
  });
  records.sort((a, b) => compareCodePoints(a.id, b.id));
  return { identities, records };
}

function renderedSubsetDigest(
  recordIds: readonly string[],
  clinicalDigestById: ReadonlyMap<string, string>,
): string {
  const cases = sortedUnique(recordIds).map((caseId) => {
    const clinicalDigest = clinicalDigestById.get(caseId);
    if (clinicalDigest === undefined) {
      throw new PrivateDistManifestError(
        `cannot render digest for unknown case-index record ${caseId}`,
      );
    }
    return { caseId, clinicalDigest };
  });
  return sha256Hex(canonicalJson({ schemaVersion: 1, cases }));
}

function selectorOrderedRecords(
  records: readonly CaseIndexRouteRecord[],
): CaseIndexRouteRecord[] {
  return [...records].sort((left, right) => {
    if (left.eventDate !== right.eventDate) {
      return left.eventDate < right.eventDate ? 1 : -1;
    }
    return compareCodePoints(left.slug, right.slug);
  });
}

function quarterlyUpdateRecordIds(update: QuarterlyUpdate): string[] {
  return sortedUnique([
    ...update.addedCases.map((entry) => entry.caseId),
    ...update.updatedCases.map((entry) => entry.caseId),
    ...update.retiredCases.map((entry) => entry.caseId),
    ...update.unavailableCases.map((entry) => entry.caseId),
  ]);
}

function fixtureUpdateRecordIds(): string[] {
  return quarterlyUpdateRecordIds(reviewFixtureUpdate);
}

function buildExpectedHtmlRoutes(
  reviewSet: ReviewSetManifestV2,
  caseIndexRecords: readonly CaseIndexRouteRecord[],
  updates: PrivateDistSourceState["updates"],
): Map<string, ExpectedHtmlRoute> {
  const expected = new Map<string, ExpectedHtmlRoute>();
  const add = (path: string, route: ExpectedHtmlRoute): void => {
    if (expected.has(path)) {
      throw new PrivateDistManifestError(
        `duplicate derived HTML route contract ${path}`,
      );
    }
    expected.set(path, {
      ...route,
      recordIds: sortedUnique(route.recordIds),
    });
  };
  const clinicalDigestById = new Map(
    reviewSet.cases.map((entry) => [entry.caseId, entry.clinicalDigest]),
  );
  const allCaseIds = reviewSet.cases.map((entry) => entry.caseId);
  add("/", {
    kind: "home",
    recordIds: allCaseIds,
    digest: renderedSubsetDigest(allCaseIds, clinicalDigestById),
  });
  for (const path of ["/about/", "/credits-notices/", "/source-policy/"]) {
    add(path, { kind: "static", recordIds: [], digest: null });
  }
  for (const { lab } of componentLabStaticParams("review")) {
    add(`/review/${lab}/`, {
      kind: "static",
      recordIds: [],
      digest: null,
    });
  }

  for (const record of caseIndexRecords) {
    const clinicalDigest = clinicalDigestById.get(record.id);
    if (clinicalDigest === undefined) {
      throw new PrivateDistManifestError(
        `case route ${record.slug} is outside the review set`,
      );
    }
    add(`/cases/${record.slug}/`, {
      kind: "case",
      recordIds: [record.id],
      digest: clinicalDigest,
      scopeId: record.slug,
    });
  }

  const orderedRecords = selectorOrderedRecords(caseIndexRecords);
  for (const overview of reviewSet.overviews) {
    const injuryRecords = orderedRecords.filter(
      (record) => record.injuryCode === overview.injuryCode,
    );
    const pageCount = Math.max(
      1,
      Math.ceil(injuryRecords.length / LISTING_PAGE_SIZE),
    );
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const pageRecords = injuryRecords.slice(
        (pageNumber - 1) * LISTING_PAGE_SIZE,
        pageNumber * LISTING_PAGE_SIZE,
      );
      const recordIds = pageRecords.map((record) => record.id);
      add(
        pageNumber === 1
          ? `/injuries/${overview.injuryCode}/`
          : `/injuries/${overview.injuryCode}/page/${pageNumber}/`,
        {
          kind: pageNumber === 1 ? "injury" : "injury-page",
          recordIds,
          bodyRecordIds: recordIds,
          digest:
            pageNumber === 1
              ? overview.overviewDigest
              : renderedSubsetDigest(recordIds, clinicalDigestById),
          scopeId: overview.injuryCode,
        },
      );
    }
  }

  const leagueCodes = sortedUnique(
    caseIndexRecords.map((record) => record.leagueCode),
  );
  for (const leagueCode of leagueCodes) {
    const leagueRecords = orderedRecords.filter(
      (record) => record.leagueCode === leagueCode,
    );
    const pageCount = Math.max(
      1,
      Math.ceil(leagueRecords.length / LISTING_PAGE_SIZE),
    );
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const recordIds = leagueRecords
        .slice(
          (pageNumber - 1) * LISTING_PAGE_SIZE,
          pageNumber * LISTING_PAGE_SIZE,
        )
        .map((record) => record.id);
      add(
        pageNumber === 1
          ? `/leagues/${leagueCode}/`
          : `/leagues/${leagueCode}/page/${pageNumber}/`,
        {
          kind: "league",
          recordIds,
          bodyRecordIds: recordIds,
          digest: renderedSubsetDigest(recordIds, clinicalDigestById),
          scopeId: leagueCode,
        },
      );
    }
  }

  const updateIds = new Set<string>();
  for (const update of updates) {
    if (
      !/^\d{4}-q[1-4]$/u.test(update.updateId) ||
      updateIds.has(update.updateId)
    ) {
      throw new PrivateDistManifestError(
        `invalid or duplicate source update ${update.updateId}`,
      );
    }
    updateIds.add(update.updateId);
    add(`/updates/${update.updateId}/`, {
      kind: "update",
      recordIds: update.recordIds,
      digest: update.updateDigest,
      scopeId: update.updateId,
    });
  }
  const expectedCurrentUpdate = updates.length === 1 ? updates[0]! : null;
  if (
    (reviewSet.currentUpdate === null) !== (expectedCurrentUpdate === null) ||
    (reviewSet.currentUpdate !== null &&
      expectedCurrentUpdate !== null &&
      (reviewSet.currentUpdate.updateId !== expectedCurrentUpdate.updateId ||
        reviewSet.currentUpdate.updateDigest !==
          expectedCurrentUpdate.updateDigest))
  ) {
    throw new PrivateDistManifestError(
      "review-set current update does not match the strict source update",
    );
  }

  const fixtureCases = selectReviewFixtureCases("review");
  const fixtureContracts: Readonly<Record<string, ExpectedHtmlRoute>> = {
    "case-detail": {
      kind: "fixture-case",
      recordIds: [reviewFixtureClassicCase.id],
      digest: computeCaseContentDigest(reviewFixtureClassicCase),
    },
    "injury-overview": {
      kind: "fixture-injury",
      recordIds: [],
      digest: computeInjuryOverviewDigest(reviewFixtureOverview),
      scopeId: reviewFixtureOverview.injuryCode,
    },
    "league-listing": {
      kind: "fixture-league",
      recordIds: fixtureCases.map((record) => record.id),
      bodyRecordIds: fixtureCases.map((record) => record.id),
      digest: computeRenderedSetDigest(fixtureCases),
    },
    "latest-update": {
      kind: "fixture-update",
      recordIds: fixtureUpdateRecordIds(),
      digest: computeQuarterlyUpdateDigest(reviewFixtureUpdate),
      scopeId: reviewFixtureUpdate.id,
    },
  };
  for (const { fixture } of reviewFixtureParams("review")) {
    const contract = fixtureContracts[fixture];
    if (contract === undefined) {
      throw new PrivateDistManifestError(
        `missing derived review fixture contract ${fixture}`,
      );
    }
    add(`/review/fixtures/${fixture}/`, contract);
  }
  return expected;
}

function validateDerivedBuildCoverage(
  paths: readonly string[],
  expectedHtmlRoutes: ReadonlyMap<string, ExpectedHtmlRoute>,
): void {
  const actualHtmlRoutes = paths
    .filter((path) => path.endsWith(".html"))
    .map(canonicalRequestPathForBuildPath)
    .sort(compareCodePoints);
  const expectedRoutes = [...expectedHtmlRoutes.keys()].sort(compareCodePoints);
  if (
    actualHtmlRoutes.length !== expectedRoutes.length ||
    actualHtmlRoutes.some((path, index) => path !== expectedRoutes[index])
  ) {
    const actualSet = new Set(actualHtmlRoutes);
    const expectedSet = new Set(expectedRoutes);
    const missing = expectedRoutes.filter((path) => !actualSet.has(path));
    const unexpected = actualHtmlRoutes.filter(
      (path) => !expectedSet.has(path),
    );
    throw new PrivateDistManifestError(
      `derived HTML route coverage mismatch (missing=${JSON.stringify(missing)}, unexpected=${JSON.stringify(unexpected)})`,
    );
  }
  for (const requiredPath of [
    "robots.txt",
    "review/review-set.json",
    "case-index/manifest.json",
  ]) {
    if (!paths.includes(requiredPath)) {
      throw new PrivateDistManifestError(
        `required private-dist output is missing: ${requiredPath}`,
      );
    }
  }
}

function assertStableDistPaths(
  expected: readonly string[],
  actual: readonly string[],
): void {
  if (
    expected.length !== actual.length ||
    expected.some((path, index) => path !== actual[index])
  ) {
    throw new PrivateDistManifestError(
      "dist path set changed while the private manifest snapshot was read",
    );
  }
}

function readExactReviewSet(
  root: string,
  distDir: string,
): {
  manifest: ReviewSetManifestV2;
  bytes: string;
  digest: string;
} {
  const localBytes = readStableRegularFile(
    root,
    REVIEW_SET_V2_MANIFEST_PATH,
  ).toString("utf8");
  const builtBytes = readStableRegularFile(
    distDir,
    "review/review-set.json",
  ).toString("utf8");
  if (builtBytes !== localBytes) {
    throw new PrivateDistManifestError(
      "built review-set response differs from the canonical local bytes",
    );
  }
  const parsed = parseReviewSetManifestV2Bytes(localBytes);
  if (parsed.manifest === null) {
    throw new PrivateDistManifestError(
      "canonical review-set bytes are invalid",
    );
  }
  return {
    manifest: parsed.manifest,
    bytes: localBytes,
    digest: parsed.reviewSetDigest,
  };
}

function assertExactFollowUpBindings(
  reviewSet: ReviewSetManifestV2,
  sourceFollowUps: PrivateDistSourceState["followUps"],
): void {
  const expected = [...sourceFollowUps].sort((left, right) =>
    compareCodePoints(left.caseId, right.caseId),
  );
  for (let index = 1; index < expected.length; index += 1) {
    if (expected[index - 1]!.caseId === expected[index]!.caseId) {
      throw new PrivateDistManifestError(
        `duplicate source follow-up binding for ${expected[index]!.caseId}`,
      );
    }
  }
  const actual = reviewSet.cases.map((entry) => ({
    caseId: entry.caseId,
    sidecarPath: entry.followUp.sidecarPath,
    draftDigest: entry.followUp.draftDigest,
    status: entry.followUp.status,
    sourcePolicyVersion: entry.followUp.sourcePolicyVersion,
  }));
  if (
    expected.length !== reviewSet.cases.length ||
    canonicalJson(actual) !== canonicalJson(expected)
  ) {
    throw new PrivateDistManifestError(
      "review-set follow-up bindings do not match the validated source sidecars",
    );
  }
}

export function buildPrivateDistManifestFromDisk(
  options: BuildPrivateDistManifestOptions,
): ArtifactManifest {
  const root = resolve(options.root);
  if (options.buildMode !== "review") {
    throw new PrivateDistManifestError(
      "private manifest requires a review build",
    );
  }
  if (options.sourceState.dirty) {
    throw new PrivateDistManifestError(
      "private manifest requires a clean source commit",
    );
  }
  if (!/^[0-9a-f]{40}$/.test(options.sourceState.commit)) {
    throw new PrivateDistManifestError("invalid source commit");
  }
  const distDir = join(root, "dist");
  const reviewSet = readExactReviewSet(root, distDir);
  if (
    options.sourceState.rendererTreeDigest !==
    reviewSet.manifest.rendererTreeDigest
  ) {
    throw new PrivateDistManifestError(
      "renderer digest does not match the review set",
    );
  }
  if (
    options.sourceState.supportingDataDigest !==
    reviewSet.manifest.supportingDataDigest
  ) {
    throw new PrivateDistManifestError(
      "supporting-data digest does not match the review set",
    );
  }
  if (
    options.sourceState.approvedCoreContentAuthoritySnapshotDigest !==
    reviewSet.manifest.approvedCoreContentAuthoritySnapshotDigest
  ) {
    throw new PrivateDistManifestError(
      "approved-core content-authority digest does not match the review set",
    );
  }
  if (
    options.sourceState.contentAuthoritySnapshotDigest !==
    reviewSet.manifest.contentAuthoritySnapshotDigest
  ) {
    throw new PrivateDistManifestError(
      "content-authority digest does not match the review set",
    );
  }
  assertExactFollowUpBindings(
    reviewSet.manifest,
    options.sourceState.followUps,
  );
  const headerPolicyBytes = readStableRegularFile(
    root,
    "ops/http-header-policy.v1.json",
  );
  if (sha256Hex(headerPolicyBytes) !== PRIVATE_HTTP_HEADER_POLICY_SHA256) {
    throw new PrivateDistManifestError(
      "header policy bytes do not match the current contract",
    );
  }

  const paths = walkPrivateDist(distDir);
  const bytesByPath = new Map(
    paths.map((path) => [path, readStableRegularFile(distDir, path)] as const),
  );
  assertStableDistPaths(paths, walkPrivateDist(distDir));
  const caseIndex = extractCaseIndexIdentities(
    bytesByPath,
    reviewSet.manifest,
    options.sourceState.caseIndex,
  );
  const expectedHtmlRoutes = buildExpectedHtmlRoutes(
    reviewSet.manifest,
    caseIndex.records,
    options.sourceState.updates,
  );
  validateDerivedBuildCoverage(paths, expectedHtmlRoutes);
  const files: BuiltFileInput[] = paths.map((path) => {
    const bytes = bytesByPath.get(path)!;
    const contentType = contentTypeForBuildPath(path);
    const requestPath = canonicalRequestPathForBuildPath(path);
    let identity: ArtifactIdentity | undefined;
    let dataBearing = false;
    if (contentType === "text/html; charset=utf-8") {
      identity = extractHtmlIdentity(
        Buffer.from(bytes).toString("utf8"),
        requestPath,
        reviewSet.manifest,
        expectedHtmlRoutes.get(requestPath)!,
      );
      dataBearing = identity.recordIds.length > 0 || identity.digest !== null;
    } else if (path === "robots.txt") {
      if (Buffer.from(bytes).toString("utf8") !== DISALLOW_ALL_ROBOTS_TXT) {
        throw new PrivateDistManifestError(
          "robots.txt does not match the exact review deny-all body",
        );
      }
    } else if (path === "review/review-set.json") {
      dataBearing = true;
    } else if (caseIndex.identities.has(path)) {
      identity = caseIndex.identities.get(path)!;
      dataBearing = true;
    } else if (contentType === "application/json") {
      throw new PrivateDistManifestError(
        `unexpected JSON output has no governed payload contract: ${path}`,
      );
    }
    return {
      path,
      requestPath,
      bytes,
      contentType,
      dataBearing,
      identity,
    };
  });
  const manifest = buildArtifactManifest("review", files, {
    buildCommit: options.sourceState.commit,
    reviewSetDigest: reviewSet.digest,
    reviewSetResponseSha256: sha256Hex(reviewSet.bytes),
    rendererTreeDigest: reviewSet.manifest.rendererTreeDigest,
    headerPolicyDigest: PRIVATE_HTTP_HEADER_POLICY_SHA256,
    generatedAt: utcSeconds(options.now ?? new Date()),
  });
  assertStableDistPaths(paths, walkPrivateDist(distDir));
  return manifest;
}

/** Recomputes the complete clean source projection used by production consumers. */
export function currentPrivateDistSourceState(
  root: string,
): PrivateDistSourceState {
  const git = (...args: string[]): string =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const commitBefore = git("rev-parse", "HEAD");
  if (git("status", "--porcelain") !== "") {
    throw new PrivateDistManifestError(
      "private manifest requires a clean source commit",
    );
  }
  const loaded = loadContentCollections(root);
  if (loaded.issues.length > 0) {
    throw new PrivateDistManifestError(
      `strict source content is invalid: ${loaded.issues
        .map((entry) => `${entry.path}: ${entry.message}`)
        .join("; ")}`,
    );
  }
  const registryResult = loadRealRegistry(root);
  if (registryResult.registry === null || registryResult.issues.length > 0) {
    throw new PrivateDistManifestError(
      `source registry is invalid: ${registryResult.issues
        .map((entry) => `${entry.path}: ${entry.message}`)
        .join("; ")}`,
    );
  }
  const cases = loaded.cases.map((entry) => entry.record);
  const medicallyApprovedCases = selectMedicallyApprovedCases(cases);
  if (medicallyApprovedCases.length !== cases.length) {
    throw new PrivateDistManifestError(
      "strict source cases differ from the medically approved review-set projection",
    );
  }
  const sourceBindingIssues = medicallyApprovedCases.flatMap((record) =>
    validateCaseSourceBinding(
      record,
      registryResult.registry!,
      registryArtifactLoader(root),
    ).map((entry) => `${record.id}.${entry.path}: ${entry.message}`),
  );
  if (sourceBindingIssues.length > 0) {
    throw new PrivateDistManifestError(
      `strict source bindings are invalid: ${sourceBindingIssues.join("; ")}`,
    );
  }
  const followUpCorpus = loadFollowUpCorpus(root, medicallyApprovedCases, {
    expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
    expectedCaseCount: 26,
  });
  if (
    followUpCorpus.issues.length > 0 ||
    followUpCorpus.entries.length !== medicallyApprovedCases.length
  ) {
    throw new PrivateDistManifestError(
      `strict follow-up source corpus is invalid: ${[
        ...followUpCorpus.issues.map(
          (entry) => `${entry.path}: ${entry.message}`,
        ),
        ...(followUpCorpus.entries.length === medicallyApprovedCases.length
          ? []
          : [
              `expected ${medicallyApprovedCases.length} validated sidecars, found ${followUpCorpus.entries.length}`,
            ]),
      ].join("; ")}`,
    );
  }
  const approvedCoreContentAuthoritySnapshotDigest =
    currentContentAuthoritySnapshotDigest(root);
  const contentAuthoritySnapshotDigest =
    currentReviewSetV2ContentAuthoritySnapshotDigest(root);
  const sourceCaseIndexShards = buildCaseIndexShards(
    "review",
    medicallyApprovedCases,
  );
  const state: PrivateDistSourceState = {
    commit: commitBefore,
    dirty: false,
    rendererTreeDigest: currentRendererTreeDigest(root),
    supportingDataDigest: currentSupportingDataDigest(
      root,
      registryResult.registry,
      medicallyApprovedCases,
    ),
    approvedCoreContentAuthoritySnapshotDigest,
    contentAuthoritySnapshotDigest,
    followUps: followUpCorpus.entries
      .map((entry) => ({
        caseId: entry.sidecar.caseId,
        sidecarPath: entry.sidecarPath,
        draftDigest: entry.draftDigest,
        status: "pending-owner-signoff" as const,
        sourcePolicyVersion: "nba-v10" as const,
      }))
      .sort((left, right) => compareCodePoints(left.caseId, right.caseId)),
    updates: loaded.updates
      .map(({ record }) => ({
        updateId: record.id,
        updateDigest: computeQuarterlyUpdateDigest(record),
        recordIds: quarterlyUpdateRecordIds(record),
      }))
      .sort((left, right) => compareCodePoints(left.updateId, right.updateId)),
    caseIndex: {
      manifest: buildCaseIndexManifest(
        "review",
        medicallyApprovedCases,
        defaultTaxonomyRegistries.injuries.map((injury) => injury.code),
      ),
      shards: [...sourceCaseIndexShards.entries()]
        .flatMap(([injuryCode, shards]) =>
          shards.map((records, index) => ({
            buildPath: `case-index/${injuryCode}/${index + 1}.json`,
            records,
          })),
        )
        .sort((left, right) =>
          compareCodePoints(left.buildPath, right.buildPath),
        ),
    },
  };
  const commitAfter = git("rev-parse", "HEAD");
  const statusAfter = git("status", "--porcelain");
  state.dirty = commitAfter !== commitBefore || statusAfter !== "";
  return {
    ...state,
    commit: commitAfter,
  };
}

export function writePrivateDistManifest(
  root: string,
  manifest: ArtifactManifest,
): void {
  const target = join(root, PRIVATE_DIST_MANIFEST_PATH);
  const parent = dirname(target);
  const parentStat = lstatSync(parent);
  if (parentStat.isSymbolicLink() || !parentStat.isDirectory()) {
    throw new PrivateDistManifestError(
      "private manifest parent must be a real directory",
    );
  }
  if (existsSync(target)) {
    const targetStat = lstatSync(target);
    if (targetStat.isSymbolicLink() || !targetStat.isFile()) {
      throw new PrivateDistManifestError(
        "private manifest target must be a regular file",
      );
    }
  }
  const temporary = join(parent, `.private-dist-manifest.${process.pid}.tmp`);
  let descriptor: number | null = null;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeFileSync(descriptor, canonicalJson(manifest), "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    renameSync(temporary, target);
  } catch (error) {
    if (descriptor !== null) closeSync(descriptor);
    if (existsSync(temporary)) unlinkSync(temporary);
    throw error;
  }
}

function main(): void {
  const root = process.cwd();
  try {
    const sourceStateBefore = currentPrivateDistSourceState(root);
    const manifest = buildPrivateDistManifestFromDisk({
      root,
      buildMode: process.env.ATLAS_BUILD_MODE ?? "review",
      sourceState: sourceStateBefore,
    });
    const sourceStateAfter = currentPrivateDistSourceState(root);
    if (canonicalJson(sourceStateAfter) !== canonicalJson(sourceStateBefore)) {
      throw new PrivateDistManifestError(
        "source state changed while generating the private manifest",
      );
    }
    // The production command writes only the canonical out-of-tree artifact.
    writePrivateDistManifest(root, manifest);
    console.log(
      `private:manifest files=${manifest.files.length} digest=${sha256Hex(canonicalJson(manifest))}`,
    );
  } catch (error) {
    console.error(
      `private:manifest FAILED — ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
