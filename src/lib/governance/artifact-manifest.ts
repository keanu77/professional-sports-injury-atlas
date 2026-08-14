/**
 * Canonical G4 private-dist manifest. It names every built byte exactly once,
 * maps it to one canonical request path, and carries enough identity and
 * indexing/header metadata for both the gateway and live verifier to fail
 * closed. The persisted manifest remains outside `dist`.
 */

import { z } from "astro/zod";
import {
  canonicalJson,
  CanonicalJsonError,
  compareCodePoints,
  isValidUtcTimestamp,
  issue,
  parseStrictJson,
  SHA256_RE,
  sha256Hex,
  type ValidationIssue,
} from "../contracts/canonical";
import { PRIVATE_REVIEW_MAX_FILE_BYTES } from "./private-review-limits";

export const PRIVATE_HTTP_HEADER_CONTRACT_ID =
  "atlas-private-review-http-headers-v1";
export const PRIVATE_HTTP_HEADER_POLICY_SHA256 =
  "bebeb04e1f2aad8020d20a25af30eb37b92fd0e70ad122acad2560cb6fab34b0";
export const REVIEW_ROBOTS_META_CONTRACT_ID = "review-noindex-meta-v1";
export const REVIEW_ROBOTS_TXT_CONTRACT_ID = "review-disallow-all-v1";
export const NOT_APPLICABLE_CONTRACT_ID = "not-applicable";
export const REVIEW_SET_BUILD_PATH = "review/review-set.json";
export const REVIEW_SET_REQUEST_PATH = "/review/review-set.json";
export const REVIEW_ROBOTS_TXT_SHA256 =
  "331ea9090db0c9f6f597bd9840fd5b171830f6e0b3ba1cb24dfa91f0c95aedc1";
export const ARTIFACT_IDENTITY_META_NAME = "atlas-artifact-identity-v1";

const sha256Lower = z.string().regex(SHA256_RE);
const gitCommit = z.string().regex(/^[0-9a-f]{40}$/);
const nonEmpty = z.string().min(1);
const sortedIdArray = z.array(nonEmpty);
const artifactByteLength = z
  .number()
  .int({ message: "must be a safe integer byte length" })
  .min(0, { message: "must be a nonnegative safe integer byte length" })
  .max(PRIVATE_REVIEW_MAX_FILE_BYTES, {
    message: `must be at most ${PRIVATE_REVIEW_MAX_FILE_BYTES} bytes`,
  });

export const artifactIdentityKinds = [
  "html-page",
  "review-set",
  "case-index-manifest",
  "case-index-shard",
  "json-document",
  "robots-txt",
  "asset",
] as const;

export const artifactIdentitySchema = z.strictObject({
  kind: z.enum(artifactIdentityKinds),
  pageIds: sortedIdArray,
  recordIds: sortedIdArray,
  digest: sha256Lower.nullable(),
  shardIds: sortedIdArray,
});
export type ArtifactIdentity = z.infer<typeof artifactIdentitySchema>;

export class ArtifactIdentityError extends Error {}

/**
 * Encodes one identity as canonical JSON wrapped in unpadded base64url. The
 * resulting token is safe in a quoted HTML meta attribute without entity
 * decoding and can be required byte-for-byte by the private manifest.
 */
export function encodeArtifactIdentity(value: ArtifactIdentity): string {
  const parsed = artifactIdentitySchema.safeParse(value);
  if (!parsed.success) {
    throw new ArtifactIdentityError(
      parsed.error.issues.map((entry) => entry.message).join("; "),
    );
  }
  for (const values of [
    parsed.data.pageIds,
    parsed.data.recordIds,
    parsed.data.shardIds,
  ]) {
    for (let index = 1; index < values.length; index += 1) {
      if (compareCodePoints(values[index - 1]!, values[index]!) >= 0) {
        throw new ArtifactIdentityError(
          "artifact identity IDs must be unique and strictly sorted",
        );
      }
    }
  }
  return Buffer.from(canonicalJson(parsed.data), "utf8").toString("base64url");
}

/** Strict inverse of `encodeArtifactIdentity()`. */
export function decodeArtifactIdentity(encoded: string): ArtifactIdentity {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) {
    throw new ArtifactIdentityError(
      "artifact identity meta must be unpadded base64url",
    );
  }
  const bytes = Buffer.from(encoded, "base64url");
  if (bytes.toString("base64url") !== encoded) {
    throw new ArtifactIdentityError(
      "artifact identity meta is not canonical base64url",
    );
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ArtifactIdentityError(
      "artifact identity meta is not valid UTF-8",
    );
  }
  let value: unknown;
  try {
    value = parseStrictJson(text);
  } catch (error) {
    throw new ArtifactIdentityError(
      error instanceof Error ? error.message : String(error),
    );
  }
  if (canonicalJson(value) !== text) {
    throw new ArtifactIdentityError(
      "artifact identity meta JSON is not canonical",
    );
  }
  const parsed = artifactIdentitySchema.safeParse(value);
  if (!parsed.success) {
    throw new ArtifactIdentityError(
      parsed.error.issues.map((entry) => entry.message).join("; "),
    );
  }
  // Reuse the encoder's sorted/unique checks and canonical projection.
  if (encodeArtifactIdentity(parsed.data) !== encoded) {
    throw new ArtifactIdentityError("artifact identity meta is not canonical");
  }
  return parsed.data;
}

export const artifactFileSchema = z.strictObject({
  buildPath: nonEmpty,
  requestPath: nonEmpty,
  sha256: sha256Lower,
  byteLength: artifactByteLength,
  contentType: nonEmpty,
  dataBearing: z.boolean(),
  identity: artifactIdentitySchema,
  robotsMetaContractId: z.enum([
    REVIEW_ROBOTS_META_CONTRACT_ID,
    NOT_APPLICABLE_CONTRACT_ID,
  ]),
  httpHeaderContractId: z.literal(PRIVATE_HTTP_HEADER_CONTRACT_ID),
  robotsTxtContractId: z.enum([
    REVIEW_ROBOTS_TXT_CONTRACT_ID,
    NOT_APPLICABLE_CONTRACT_ID,
  ]),
});
export type ArtifactFile = z.infer<typeof artifactFileSchema>;

export const artifactManifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  manifestType: z.literal("private-dist"),
  buildMode: z.literal("review"),
  buildCommit: gitCommit,
  reviewSetDigest: sha256Lower,
  reviewSetResponseSha256: sha256Lower,
  rendererTreeDigest: sha256Lower,
  headerPolicyDigest: sha256Lower,
  headerPolicyContractId: z.literal(PRIVATE_HTTP_HEADER_CONTRACT_ID),
  generatedAt: z
    .string()
    .refine(isValidUtcTimestamp, { message: "must be a valid UTC timestamp" }),
  files: z.array(artifactFileSchema).min(1),
});
export type ArtifactManifest = z.infer<typeof artifactManifestSchema>;

export const ARTIFACT_PERSISTENCE_PREFIXES: readonly string[] = [
  "review/",
  "public-release-artifacts/",
];

function isPersistedGovernanceArtifactPath(path: string): boolean {
  return (
    ARTIFACT_PERSISTENCE_PREFIXES.some((prefix) => path.startsWith(prefix)) &&
    /\.v\d+\.json$/.test(path)
  );
}

function buildPathIssues(path: string, location: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (
    path.startsWith("/") ||
    path.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(path)
  ) {
    issues.push(
      issue(
        "artifact-build-path",
        location,
        `build path ${path} must be a relative forward-slash path`,
      ),
    );
    return issues;
  }
  const segments = path.split("/");
  if (segments.some((segment) => segment === "" || segment.startsWith("."))) {
    issues.push(
      issue(
        "artifact-path-traversal",
        location,
        `build path ${path} contains an empty or traversal segment`,
      ),
    );
  }
  return issues;
}

function requestPathIssues(path: string, location: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (
    !path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("?") ||
    path.includes("#") ||
    path.includes("%") ||
    /[\u0000-\u001f\u007f]/u.test(path)
  ) {
    issues.push(
      issue(
        "artifact-request-path",
        location,
        `request path ${path} is not a canonical absolute request path`,
      ),
    );
    return issues;
  }
  if (path !== "/") {
    const segments = path.slice(1).split("/");
    const finalEmpty = segments.at(-1) === "";
    const inspected = finalEmpty ? segments.slice(0, -1) : segments;
    if (
      inspected.some((segment) => segment === "" || segment.startsWith("."))
    ) {
      issues.push(
        issue(
          "artifact-request-path",
          location,
          `request path ${path} contains an empty or traversal segment`,
        ),
      );
    }
  }
  return issues;
}

function sortedUniqueIssues(
  values: readonly string[],
  location: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (let index = 1; index < values.length; index += 1) {
    if (compareCodePoints(values[index - 1]!, values[index]!) >= 0) {
      issues.push(
        issue(
          "artifact-identity-order",
          location,
          "identity IDs must be unique and strictly sorted",
        ),
      );
      break;
    }
  }
  return issues;
}

export interface ArtifactManifestOptions {
  selfPaths?: readonly string[];
}

/** Structural and cross-field validation for an untrusted manifest object. */
export function validateArtifactManifest(
  value: unknown,
  options: ArtifactManifestOptions = {},
): ValidationIssue[] {
  const parsed = artifactManifestSchema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((zodIssue) =>
      issue(
        "artifact-manifest-schema",
        zodIssue.path.join("."),
        zodIssue.message,
      ),
    );
  }
  const manifest = parsed.data;
  const issues: ValidationIssue[] = [];
  if (manifest.headerPolicyDigest !== PRIVATE_HTTP_HEADER_POLICY_SHA256) {
    issues.push(
      issue(
        "artifact-header-policy-digest",
        "headerPolicyDigest",
        "manifest does not bind the current private HTTP header policy bytes",
      ),
    );
  }
  if (manifest.reviewSetDigest !== manifest.reviewSetResponseSha256) {
    issues.push(
      issue(
        "artifact-review-set-response",
        "reviewSetResponseSha256",
        "review-set digest and exact response SHA-256 must agree",
      ),
    );
  }
  const selfPaths = new Set(options.selfPaths ?? []);
  const buildPaths = new Set<string>();
  const requestPaths = new Set<string>();
  let reviewSetEntries = 0;
  const caseIndexManifests: ArtifactFile[] = [];
  const caseIndexShardIds: string[] = [];
  manifest.files.forEach((file, index) => {
    const location = `files[${index}]`;
    issues.push(...buildPathIssues(file.buildPath, `${location}.buildPath`));
    issues.push(
      ...requestPathIssues(file.requestPath, `${location}.requestPath`),
      ...sortedUniqueIssues(
        file.identity.pageIds,
        `${location}.identity.pageIds`,
      ),
      ...sortedUniqueIssues(
        file.identity.recordIds,
        `${location}.identity.recordIds`,
      ),
      ...sortedUniqueIssues(
        file.identity.shardIds,
        `${location}.identity.shardIds`,
      ),
    );
    if (file.requestPath !== canonicalRequestPathForBuildPath(file.buildPath)) {
      issues.push(
        issue(
          "artifact-request-alias",
          `${location}.requestPath`,
          "request path must be the canonical alias derived from buildPath",
        ),
      );
    }
    if (buildPaths.has(file.buildPath)) {
      issues.push(
        issue(
          "artifact-duplicate-build-path",
          location,
          `build path ${file.buildPath} appears more than once`,
        ),
      );
    }
    if (requestPaths.has(file.requestPath)) {
      issues.push(
        issue(
          "artifact-duplicate-request-path",
          location,
          `request path ${file.requestPath} appears more than once`,
        ),
      );
    }
    buildPaths.add(file.buildPath);
    requestPaths.add(file.requestPath);
    if (
      selfPaths.has(file.buildPath) ||
      isPersistedGovernanceArtifactPath(file.buildPath)
    ) {
      issues.push(
        issue(
          "artifact-self-reference",
          location,
          `private manifest may not include governance artifact ${file.buildPath}`,
        ),
      );
    }
    if (
      index > 0 &&
      compareCodePoints(manifest.files[index - 1]!.buildPath, file.buildPath) >=
        0
    ) {
      issues.push(
        issue(
          "artifact-order",
          location,
          "manifest files must be strictly sorted by build path",
        ),
      );
    }

    const isHtml = file.contentType === "text/html; charset=utf-8";
    const isRobots = file.buildPath === "robots.txt";
    if (
      file.robotsMetaContractId !==
      (isHtml ? REVIEW_ROBOTS_META_CONTRACT_ID : NOT_APPLICABLE_CONTRACT_ID)
    ) {
      issues.push(
        issue(
          "artifact-robots-meta-contract",
          location,
          "robots-meta contract does not match the file content type",
        ),
      );
    }
    if (
      file.robotsTxtContractId !==
      (isRobots ? REVIEW_ROBOTS_TXT_CONTRACT_ID : NOT_APPLICABLE_CONTRACT_ID)
    ) {
      issues.push(
        issue(
          "artifact-robots-txt-contract",
          location,
          "robots.txt contract does not match the build path",
        ),
      );
    }
    if (file.identity.kind === "html-page") {
      if (
        !isHtml ||
        file.identity.pageIds.length !== 1 ||
        file.identity.pageIds[0] !== file.requestPath ||
        file.identity.shardIds.length > 0
      ) {
        issues.push(
          issue(
            "artifact-identity",
            location,
            "HTML identity requires exactly its canonical request path as page ID",
          ),
        );
      }
    } else if (file.identity.kind === "case-index-manifest") {
      caseIndexManifests.push(file);
      if (
        file.contentType !== "application/json" ||
        !file.dataBearing ||
        file.identity.shardIds.length === 0 ||
        file.identity.digest === null
      ) {
        issues.push(
          issue(
            "artifact-identity",
            location,
            "case-index manifest identity requires JSON, dataBearing=true, a digest, and complete shard IDs",
          ),
        );
      }
    } else if (file.identity.kind === "case-index-shard") {
      caseIndexShardIds.push(...file.identity.shardIds);
      if (
        file.contentType !== "application/json" ||
        file.identity.shardIds.length !== 1 ||
        file.identity.recordIds.length === 0 ||
        file.identity.digest === null ||
        !file.dataBearing
      ) {
        issues.push(
          issue(
            "artifact-identity",
            location,
            "case-index shard identity requires JSON, digest, record IDs, shard IDs, and dataBearing=true",
          ),
        );
      }
    } else if (file.identity.kind === "json-document") {
      if (
        file.contentType !== "application/json" ||
        file.identity.digest === null
      ) {
        issues.push(
          issue(
            "artifact-identity",
            location,
            "JSON document identity requires application/json and a digest",
          ),
        );
      }
    } else if (file.identity.kind === "asset") {
      if (
        file.dataBearing ||
        file.identity.digest !== file.sha256 ||
        file.identity.pageIds.length > 0 ||
        file.identity.recordIds.length > 0 ||
        file.identity.shardIds.length > 0
      ) {
        issues.push(
          issue(
            "artifact-identity",
            location,
            "asset identity must be non-data-bearing and bind only its decoded digest",
          ),
        );
      }
    } else if (file.identity.kind === "robots-txt") {
      if (
        !isRobots ||
        file.dataBearing ||
        file.sha256 !== REVIEW_ROBOTS_TXT_SHA256 ||
        file.identity.digest !== REVIEW_ROBOTS_TXT_SHA256 ||
        file.identity.pageIds.length > 0 ||
        file.identity.recordIds.length > 0 ||
        file.identity.shardIds.length > 0
      ) {
        issues.push(
          issue(
            "artifact-identity",
            location,
            "robots identity must bind the exact non-data-bearing robots.txt bytes",
          ),
        );
      }
    }
    if (file.identity.kind === "review-set") {
      reviewSetEntries += 1;
      if (
        file.buildPath !== REVIEW_SET_BUILD_PATH ||
        file.requestPath !== REVIEW_SET_REQUEST_PATH ||
        file.contentType !== "application/json" ||
        file.sha256 !== manifest.reviewSetResponseSha256 ||
        file.identity.digest !== manifest.reviewSetDigest ||
        file.identity.pageIds.length > 0 ||
        file.identity.recordIds.length > 0 ||
        file.identity.shardIds.length > 0 ||
        !file.dataBearing
      ) {
        issues.push(
          issue(
            "artifact-review-set-response",
            location,
            "review-set entry does not bind the exact canonical route and bytes",
          ),
        );
      }
    }
  });
  if (reviewSetEntries !== 1) {
    issues.push(
      issue(
        "artifact-review-set-coverage",
        "files",
        "manifest must contain exactly one canonical review-set entry",
      ),
    );
  }
  if (caseIndexManifests.length > 1) {
    issues.push(
      issue(
        "artifact-case-index-coverage",
        "files",
        "manifest may contain only one case-index manifest",
      ),
    );
  }
  if (caseIndexManifests.length === 1) {
    const declared = caseIndexManifests[0]!.identity.shardIds;
    const actual = [...caseIndexShardIds].sort(compareCodePoints);
    if (
      declared.length !== actual.length ||
      declared.some((shardId, index) => shardId !== actual[index])
    ) {
      issues.push(
        issue(
          "artifact-case-index-coverage",
          "files",
          "case-index manifest shard IDs must exactly cover the shard files",
        ),
      );
    }
  } else if (caseIndexShardIds.length > 0) {
    issues.push(
      issue(
        "artifact-case-index-coverage",
        "files",
        "case-index shards require one covering case-index manifest",
      ),
    );
  }
  return issues;
}

export function validateArtifactManifestCoverage(
  manifest: ArtifactManifest,
  builtPaths: readonly string[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const manifestPaths = new Set(manifest.files.map((file) => file.buildPath));
  const built = new Set(builtPaths);
  for (const path of built) {
    if (!manifestPaths.has(path)) {
      issues.push(
        issue(
          "artifact-missing-path",
          path,
          `built file ${path} is missing from the private manifest`,
        ),
      );
    }
  }
  for (const path of manifestPaths) {
    if (!built.has(path)) {
      issues.push(
        issue(
          "artifact-extra-path",
          path,
          `manifest lists ${path} which is not a built file`,
        ),
      );
    }
  }
  return issues;
}

export interface ArtifactManifestBuildMetadata {
  buildCommit: string;
  reviewSetDigest: string;
  reviewSetResponseSha256: string;
  rendererTreeDigest: string;
  headerPolicyDigest: string;
  generatedAt: string;
}

export interface BuiltFileInput {
  path: string;
  requestPath?: string;
  bytes: Uint8Array | string;
  contentType: string;
  dataBearing?: boolean;
  identity?: ArtifactIdentity;
}

export class ArtifactManifestError extends Error {}

function builtFileByteLength(file: BuiltFileInput): number {
  const byteLength =
    typeof file.bytes === "string"
      ? Buffer.byteLength(file.bytes, "utf8")
      : file.bytes.byteLength;
  if (
    !Number.isSafeInteger(byteLength) ||
    byteLength < 0 ||
    byteLength > PRIVATE_REVIEW_MAX_FILE_BYTES
  ) {
    throw new ArtifactManifestError(
      `built file ${file.path} exceeds the ${PRIVATE_REVIEW_MAX_FILE_BYTES}-byte private-review limit`,
    );
  }
  return byteLength;
}

export function canonicalRequestPathForBuildPath(path: string): string {
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html"))
    return `/${path.slice(0, -"index.html".length)}`;
  return `/${path}`;
}

function defaultIdentity(
  path: string,
  requestPath: string,
  contentType: string,
  digest: string,
): ArtifactIdentity {
  if (path === REVIEW_SET_BUILD_PATH) {
    return {
      kind: "review-set",
      pageIds: [],
      recordIds: [],
      digest,
      shardIds: [],
    };
  }
  if (path === "robots.txt") {
    return {
      kind: "robots-txt",
      pageIds: [],
      recordIds: [],
      digest,
      shardIds: [],
    };
  }
  if (contentType === "text/html; charset=utf-8") {
    return {
      kind: "html-page",
      pageIds: [requestPath],
      recordIds: [],
      digest,
      shardIds: [],
    };
  }
  if (contentType === "application/json") {
    return {
      kind: "json-document",
      pageIds: [],
      recordIds: [],
      digest,
      shardIds: [],
    };
  }
  return {
    kind: "asset",
    pageIds: [],
    recordIds: [],
    digest,
    shardIds: [],
  };
}

/** Test/generator helper that produces the strict canonical representation. */
export function buildArtifactManifest(
  buildMode: "review",
  files: readonly BuiltFileInput[],
  metadata: ArtifactManifestBuildMetadata,
): ArtifactManifest {
  const entries = files
    .map((file): ArtifactFile => {
      const byteLength = builtFileByteLength(file);
      const digest = sha256Hex(file.bytes);
      const requestPath =
        file.requestPath ?? canonicalRequestPathForBuildPath(file.path);
      const identity =
        file.identity ??
        defaultIdentity(file.path, requestPath, file.contentType, digest);
      return {
        buildPath: file.path,
        requestPath,
        sha256: digest,
        byteLength,
        contentType: file.contentType,
        dataBearing:
          file.dataBearing ??
          (identity.kind !== "asset" && identity.kind !== "robots-txt"),
        identity,
        robotsMetaContractId:
          file.contentType === "text/html; charset=utf-8"
            ? REVIEW_ROBOTS_META_CONTRACT_ID
            : NOT_APPLICABLE_CONTRACT_ID,
        httpHeaderContractId: PRIVATE_HTTP_HEADER_CONTRACT_ID,
        robotsTxtContractId:
          file.path === "robots.txt"
            ? REVIEW_ROBOTS_TXT_CONTRACT_ID
            : NOT_APPLICABLE_CONTRACT_ID,
      };
    })
    .sort((a, b) => compareCodePoints(a.buildPath, b.buildPath));
  const manifest: ArtifactManifest = {
    schemaVersion: 1,
    manifestType: "private-dist",
    buildMode,
    ...metadata,
    headerPolicyContractId: PRIVATE_HTTP_HEADER_CONTRACT_ID,
    files: entries,
  };
  const issues = validateArtifactManifest(manifest);
  if (issues.length > 0) {
    throw new ArtifactManifestError(
      issues.map((entry) => `${entry.path}: ${entry.message}`).join("; "),
    );
  }
  return manifest;
}

export function computeArtifactManifestDigest(
  manifest: ArtifactManifest,
): string {
  return sha256Hex(canonicalJson(manifest));
}

export interface ParsedArtifactManifest {
  manifest: ArtifactManifest | null;
  manifestDigest: string;
  issues: ValidationIssue[];
}

export function parseArtifactManifestBytes(
  bytes: Uint8Array | string,
): ParsedArtifactManifest {
  const manifestDigest = sha256Hex(bytes);
  const text =
    typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      manifest: null,
      manifestDigest,
      issues: [
        issue(
          "artifact-manifest-parse",
          "",
          error instanceof CanonicalJsonError ? error.message : String(error),
        ),
      ],
    };
  }
  const issues: ValidationIssue[] = [];
  if (canonicalJson(parsed) !== text) {
    issues.push(
      issue(
        "artifact-manifest-not-canonical",
        "",
        "manifest bytes must be exact canonical JSON",
      ),
    );
  }
  issues.push(...validateArtifactManifest(parsed));
  if (issues.length > 0) return { manifest: null, manifestDigest, issues };
  return {
    manifest: artifactManifestSchema.parse(parsed),
    manifestDigest,
    issues,
  };
}
