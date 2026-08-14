/**
 * Fail-closed private-review HTTP gateway.
 *
 * The process binds only the configured Tailscale IPv4 address, authenticates
 * every request before examining its target, and serves an immutable in-memory
 * snapshot of the exact canonical private-dist manifest. Credentials are never
 * persisted by this module: the production verifier loader reads the versioned
 * salted scrypt record from the current user's macOS Keychain.
 */

import { spawnSync } from "node:child_process";
import { scrypt, timingSafeEqual } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  type BigIntStats,
} from "node:fs";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { isIPv4 } from "node:net";
import { extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import {
  canonicalJson,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical.ts";
import {
  parseArtifactManifestBytes,
  PRIVATE_HTTP_HEADER_CONTRACT_ID,
  PRIVATE_HTTP_HEADER_POLICY_SHA256,
  validateArtifactManifestCoverage,
  type ArtifactManifest,
} from "../../src/lib/governance/artifact-manifest.ts";
import {
  parseReviewSetManifestV2Bytes,
  REVIEW_SET_V2_MANIFEST_PATH,
} from "../../src/lib/governance/review-set.ts";
import {
  buildPrivateDistManifestFromDisk,
  currentPrivateDistSourceState,
} from "./generate-private-dist-manifest.ts";

export const PRIVATE_REVIEW_NODE_VERSION = "24.14.0";
export const PRIVATE_HOSTING_CONFIG_PATH = "ops/private-hosting.v1.json";
export const PRIVATE_REVIEW_TAILSCALE_IPV4 = "100.114.3.93";
export const PRIVATE_REVIEW_PORT = 8140;
export const PRIVATE_REVIEW_USERNAME = "atlas-reviewer";
export const PRIVATE_REVIEW_REALM = "Private review";
export const PRIVATE_REVIEW_KEYCHAIN_SERVICE =
  "tw.sportsmedicine.atlas.private-review.auth-v1";
export const PRIVATE_REVIEW_KEYCHAIN_ACCOUNT = "atlas-reviewer";
export const SCRYPT_VERIFIER_PREFIX = "atlas-scrypt-v1.";
const MAX_SCRYPT_VERIFIER_TOKEN_LENGTH = 2_048;

const PRIVATE_REVIEW_SERVICE_ID = "tw.sportsmedicine.atlas.private-review";
const PRIVATE_REVIEW_LAUNCHD_LABEL =
  "tw.sportsmedicine.atlas.private-review.v1";
const TAILSCALE_CLI_PATH = "/opt/homebrew/bin/tailscale";
const SECURITY_CLI_PATH = "/usr/bin/security";
const LAUNCHD_TEMPLATE_PATH =
  "ops/launchd/tw.sportsmedicine.atlas.private-review.plist.template";
const RENDERED_PLIST_NAME = "tw.sportsmedicine.atlas.private-review.plist";

const REQUIRED_RESPONSE_HEADERS = Object.freeze({
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Vary: "Authorization",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
});
const WWW_AUTHENTICATE = 'Basic realm="Private review", charset="UTF-8"';

const FIXED_PRIVATE_HOSTING_CONFIG = {
  schemaVersion: 1,
  serviceId: PRIVATE_REVIEW_SERVICE_ID,
  nodeVersion: PRIVATE_REVIEW_NODE_VERSION,
  bind: {
    tailscaleCliPath: TAILSCALE_CLI_PATH,
    tailscaleDnsName: "mac-mini-m5.tailbc16e9.ts.net",
    tailscaleIPv4: PRIVATE_REVIEW_TAILSCALE_IPV4,
    port: PRIVATE_REVIEW_PORT,
  },
  authentication: {
    method: "http-basic-scrypt-keychain-v1",
    username: PRIVATE_REVIEW_USERNAME,
    realm: PRIVATE_REVIEW_REALM,
    keychainService: PRIVATE_REVIEW_KEYCHAIN_SERVICE,
    keychainAccount: PRIVATE_REVIEW_KEYCHAIN_ACCOUNT,
    scrypt: {
      algorithm: "scrypt-v1",
      N: 16_384,
      r: 8,
      p: 1,
      keyLength: 32,
      saltBytes: 32,
    },
  },
  artifact: {
    distDirectory: "dist",
    manifestPath: "review/private-dist-manifest.v1.json",
    reviewSetPath: REVIEW_SET_V2_MANIFEST_PATH,
    headerPolicyPath: "ops/http-header-policy.v1.json",
  },
  launchd: {
    label: PRIVATE_REVIEW_LAUNCHD_LABEL,
    templatePath: LAUNCHD_TEMPLATE_PATH,
    localStateDirectoryName: PRIVATE_REVIEW_SERVICE_ID,
    renderedPlistName: RENDERED_PLIST_NAME,
    serverScriptPath: "scripts/private-hosting/serve-private-review.ts",
    tsxCliPath: "node_modules/tsx/dist/cli.mjs",
  },
} as const;

const FIXED_HEADER_POLICY = {
  schemaVersion: 1,
  contractId: PRIVATE_HTTP_HEADER_CONTRACT_ID,
  requiredHeaders: REQUIRED_RESPONSE_HEADERS,
  unauthorizedHeaders: { "WWW-Authenticate": WWW_AUTHENTICATE },
  forbiddenHeaders: [
    "Content-Encoding",
    "ETag",
    "Last-Modified",
    "Location",
    "Server",
    "Set-Cookie",
  ],
} as const;

export type PrivateHostingConfigV1 = typeof FIXED_PRIVATE_HOSTING_CONFIG;

export interface ScryptVerifierV1 {
  schemaVersion: 1;
  algorithm: "scrypt-v1";
  salt: string;
  derivedKey: string;
  N: 16_384;
  r: 8;
  p: 1;
  keyLength: 32;
  credentialGeneration: number;
}

export type PrivateReviewGatewayErrorCode =
  | "config-invalid"
  | "node-version-mismatch"
  | "bind-address-invalid"
  | "tailscale-unavailable"
  | "credential-unavailable"
  | "credential-invalid"
  | "header-policy-invalid"
  | "manifest-invalid"
  | "artifact-invalid"
  | "listen-failed";

/** Error text is deliberately limited to a fixed code so secrets and paths do not leak. */
export class PrivateReviewGatewayError extends Error {
  readonly code: PrivateReviewGatewayErrorCode;

  constructor(code: PrivateReviewGatewayErrorCode) {
    super(code);
    this.name = "PrivateReviewGatewayError";
    this.code = code;
  }
}

export interface CredentialVerifierQuery {
  service: typeof PRIVATE_REVIEW_KEYCHAIN_SERVICE;
  account: typeof PRIVATE_REVIEW_KEYCHAIN_ACCOUNT;
}

export interface PrivateReviewListenTarget {
  host: typeof PRIVATE_REVIEW_TAILSCALE_IPV4;
  port: typeof PRIVATE_REVIEW_PORT;
}

export interface PrivateReviewListenAddress {
  host: string;
  port: number;
}

export interface TailscaleRuntimeStatus {
  backendState: string;
  selfOnline: boolean;
  selfDnsName: string;
  selfTailscaleIPs: readonly string[];
}

export interface ArtifactValidationContext {
  root: string;
  manifest: ArtifactManifest;
  manifestBytes: Buffer;
}

export interface PrivateReviewGatewayDependencies {
  runtimeNodeVersion?: string;
  resolveTailscaleIPv4?: (
    config: PrivateHostingConfigV1,
  ) => string | Promise<string>;
  loadTailscaleStatus?: (
    config: PrivateHostingConfigV1,
  ) => TailscaleRuntimeStatus | Promise<TailscaleRuntimeStatus>;
  loadCredentialVerifier?: (
    query: CredentialVerifierQuery,
  ) => string | Uint8Array | null | Promise<string | Uint8Array | null>;
  validateArtifactManifestSnapshot?: (
    context: ArtifactValidationContext,
  ) => void | Promise<void>;
  listenServer?: (
    server: Server,
    target: PrivateReviewListenTarget,
  ) => Promise<PrivateReviewListenAddress>;
  timingSafeEqual?: (left: Uint8Array, right: Uint8Array) => boolean;
  logger?: (event: string) => void;
}

export interface StartPrivateReviewServerOptions {
  root?: string;
  configPath?: typeof PRIVATE_HOSTING_CONFIG_PATH;
  dependencies?: PrivateReviewGatewayDependencies;
}

export interface LoadPrivateReviewSnapshotOptions {
  root?: string;
  configPath?: typeof PRIVATE_HOSTING_CONFIG_PATH;
  /**
   * Omit for the production clean-source rebuild. Evidence verifiers may pass
   * an independent validator (including a no-op) and still receive all strict
   * manifest/header/review-set/no-follow/hash/coverage checks below.
   */
  validateArtifactManifestSnapshot?: PrivateReviewGatewayDependencies["validateArtifactManifestSnapshot"];
}

export interface RunningPrivateReviewServer {
  server: Server;
  address: PrivateReviewListenAddress;
  configDigest: string;
  manifestDigest: string;
  requestPaths: readonly string[];
  close: () => Promise<void>;
}

export interface PrivateReviewSnapshotEntry {
  bytes: Buffer;
  contentType: string;
}

export interface LoadedPrivateReviewSnapshot {
  root: string;
  config: PrivateHostingConfigV1;
  configDigest: string;
  manifest: ArtifactManifest;
  manifestDigest: string;
  entries: ReadonlyMap<string, PrivateReviewSnapshotEntry>;
}

type JsonRecord = Record<string, unknown>;

function fail(code: PrivateReviewGatewayErrorCode): never {
  throw new PrivateReviewGatewayError(code);
}

function decodeUtf8(
  bytes: string | Uint8Array,
  code: PrivateReviewGatewayErrorCode,
): string {
  if (typeof bytes === "string") return bytes;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return fail(code);
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: JsonRecord, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort(compareCodePoints);
  const wanted = [...expected].sort(compareCodePoints);
  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  );
}

function parseStrictValue(
  bytes: string | Uint8Array,
  code: PrivateReviewGatewayErrorCode,
): unknown {
  try {
    return parseStrictJson(decodeUtf8(bytes, code));
  } catch {
    return fail(code);
  }
}

/** Strict field/value parser shared by the production entry point and tests. */
export function parsePrivateHostingConfigBytes(
  bytes: string | Uint8Array,
): PrivateHostingConfigV1 {
  const parsed = parseStrictValue(bytes, "config-invalid");
  try {
    if (canonicalJson(parsed) !== canonicalJson(FIXED_PRIVATE_HOSTING_CONFIG)) {
      fail("config-invalid");
    }
  } catch {
    return fail("config-invalid");
  }
  return parsed as PrivateHostingConfigV1;
}

function parseHeaderPolicyBytes(bytes: Buffer): void {
  if (sha256Hex(bytes) !== PRIVATE_HTTP_HEADER_POLICY_SHA256) {
    fail("header-policy-invalid");
  }
  const parsed = parseStrictValue(bytes, "header-policy-invalid");
  try {
    if (canonicalJson(parsed) !== canonicalJson(FIXED_HEADER_POLICY)) {
      fail("header-policy-invalid");
    }
  } catch {
    fail("header-policy-invalid");
  }
}

function parseCanonicalBase64Url(
  encoded: unknown,
  byteLength: number,
): Buffer | null {
  if (
    typeof encoded !== "string" ||
    encoded === "" ||
    !/^[A-Za-z0-9_-]+$/u.test(encoded)
  ) {
    return null;
  }
  const decoded = Buffer.from(encoded, "base64url");
  if (
    decoded.byteLength !== byteLength ||
    decoded.toString("base64url") !== encoded
  ) {
    return null;
  }
  return decoded;
}

/** Parses the only verifier representation accepted from Keychain. */
export function parseScryptVerifierToken(token: string): ScryptVerifierV1 {
  if (
    token.length > MAX_SCRYPT_VERIFIER_TOKEN_LENGTH ||
    !token.startsWith(SCRYPT_VERIFIER_PREFIX)
  ) {
    return fail("credential-invalid");
  }
  const encoded = token.slice(SCRYPT_VERIFIER_PREFIX.length);
  if (encoded === "" || !/^[A-Za-z0-9_-]+$/u.test(encoded)) {
    return fail("credential-invalid");
  }
  const bytes = Buffer.from(encoded, "base64url");
  if (bytes.toString("base64url") !== encoded) {
    return fail("credential-invalid");
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return fail("credential-invalid");
  }
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
    if (canonicalJson(parsed) !== text) fail("credential-invalid");
  } catch {
    return fail("credential-invalid");
  }
  if (
    !isRecord(parsed) ||
    !exactKeys(parsed, [
      "schemaVersion",
      "algorithm",
      "salt",
      "derivedKey",
      "N",
      "r",
      "p",
      "keyLength",
      "credentialGeneration",
    ]) ||
    parsed.schemaVersion !== 1 ||
    parsed.algorithm !== "scrypt-v1" ||
    parsed.N !== 16_384 ||
    parsed.r !== 8 ||
    parsed.p !== 1 ||
    parsed.keyLength !== 32 ||
    !Number.isSafeInteger(parsed.credentialGeneration) ||
    (parsed.credentialGeneration as number) < 1 ||
    parseCanonicalBase64Url(parsed.salt, 32) === null ||
    parseCanonicalBase64Url(parsed.derivedKey, 32) === null
  ) {
    return fail("credential-invalid");
  }
  return parsed as unknown as ScryptVerifierV1;
}

export function encodeScryptVerifierToken(verifier: ScryptVerifierV1): string {
  // Reparse the result so callers cannot create a non-contract token through a cast.
  const token = `${SCRYPT_VERIFIER_PREFIX}${Buffer.from(
    canonicalJson(verifier),
    "utf8",
  ).toString("base64url")}`;
  parseScryptVerifierToken(token);
  return token;
}

function deriveScrypt(
  password: string,
  verifier: ScryptVerifierV1,
): Promise<Buffer> {
  return new Promise((resolvePromise, rejectPromise) => {
    scrypt(
      password,
      Buffer.from(verifier.salt, "base64url"),
      verifier.keyLength,
      { N: verifier.N, r: verifier.r, p: verifier.p, maxmem: 64 * 1024 * 1024 },
      (error, derivedKey) => {
        if (error !== null) rejectPromise(error);
        else resolvePromise(Buffer.from(derivedKey));
      },
    );
  });
}

/** Test/provisioning helper; the gateway itself never receives a plaintext secret at startup. */
export async function createScryptVerifierToken(
  password: string,
  salt: Uint8Array,
  credentialGeneration = 1,
): Promise<string> {
  if (
    password === "" ||
    /[\u0000-\u001f\u007f]/u.test(password) ||
    salt.byteLength !== 32 ||
    !Number.isSafeInteger(credentialGeneration) ||
    credentialGeneration < 1
  ) {
    return fail("credential-invalid");
  }
  const seed: ScryptVerifierV1 = {
    schemaVersion: 1,
    algorithm: "scrypt-v1",
    salt: Buffer.from(salt).toString("base64url"),
    derivedKey: Buffer.alloc(32).toString("base64url"),
    N: 16_384,
    r: 8,
    p: 1,
    keyLength: 32,
    credentialGeneration,
  };
  const derivedKey = await deriveScrypt(password, seed);
  return encodeScryptVerifierToken({
    ...seed,
    derivedKey: derivedKey.toString("base64url"),
  });
}

/** Rejects every address class except the one fixed tailnet identity. */
export function assertExactTailscaleBindAddress(
  address: string,
  expected: string = PRIVATE_REVIEW_TAILSCALE_IPV4,
): void {
  if (!isIPv4(address) || address !== expected) {
    fail("bind-address-invalid");
  }
  const octets = address.split(".").map(Number);
  // Tailscale IPv4 addresses are in 100.64.0.0/10. Explicitly excluding the
  // common local classes also documents that no LAN/loopback fallback exists.
  if (
    octets.length !== 4 ||
    octets[0] !== 100 ||
    octets[1]! < 64 ||
    octets[1]! > 127 ||
    address === "0.0.0.0" ||
    address.startsWith("127.") ||
    address.startsWith("10.") ||
    address.startsWith("192.168.")
  ) {
    fail("bind-address-invalid");
  }
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

function sameIdentity(left: FileIdentity, right: FileIdentity): boolean {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

function safeRelativePath(base: string, target: string): string {
  const value = relative(base, target).split(sep).join("/");
  if (
    value === "" ||
    value.startsWith("../") ||
    value.startsWith("/") ||
    value.includes("\\") ||
    value
      .split("/")
      .some(
        (segment) =>
          segment === "" ||
          segment === "." ||
          segment === ".." ||
          segment.startsWith("."),
      ) ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    fail("artifact-invalid");
  }
  return value;
}

/** One no-follow, stable file read with all parent components revalidated. */
function readStableRegularFile(
  baseDirectory: string,
  relativePath: string,
): Buffer {
  try {
    const base = resolve(baseDirectory);
    const rootStat = lstatSync(base, { bigint: true });
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      fail("artifact-invalid");
    }
    const target = join(base, ...relativePath.split("/"));
    if (safeRelativePath(base, target) !== relativePath) {
      fail("artifact-invalid");
    }
    const parentSnapshots = [
      { path: base, identity: fileIdentity(rootStat) },
      ...relativePath
        .split("/")
        .slice(0, -1)
        .map((_, index, segments) => {
          const path = join(base, ...segments.slice(0, index + 1));
          const stat = lstatSync(path, { bigint: true });
          if (stat.isSymbolicLink() || !stat.isDirectory()) {
            fail("artifact-invalid");
          }
          return { path, identity: fileIdentity(stat) };
        }),
    ];
    const before = lstatSync(target, { bigint: true });
    if (before.isSymbolicLink() || !before.isFile()) {
      fail("artifact-invalid");
    }
    const realBase = realpathSync.native(base);
    const realBefore = realpathSync.native(target);
    if (
      realBefore !== realBase &&
      !realBefore.startsWith(`${realBase}${sep}`)
    ) {
      fail("artifact-invalid");
    }
    let descriptor: number | null = null;
    try {
      descriptor = openSync(
        target,
        constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
      );
      const opened = fstatSync(descriptor, { bigint: true });
      if (
        !opened.isFile() ||
        !sameIdentity(fileIdentity(before), fileIdentity(opened))
      ) {
        fail("artifact-invalid");
      }
      const bytes = readFileSync(descriptor);
      const afterDescriptor = fstatSync(descriptor, { bigint: true });
      const afterPath = lstatSync(target, { bigint: true });
      if (
        afterPath.isSymbolicLink() ||
        !afterPath.isFile() ||
        realpathSync.native(target) !== realBefore ||
        !sameIdentity(fileIdentity(opened), fileIdentity(afterDescriptor)) ||
        !sameIdentity(fileIdentity(opened), fileIdentity(afterPath)) ||
        BigInt(bytes.byteLength) !== opened.size
      ) {
        fail("artifact-invalid");
      }
      for (const parent of parentSnapshots) {
        const current = lstatSync(parent.path, { bigint: true });
        if (
          current.isSymbolicLink() ||
          !current.isDirectory() ||
          !sameIdentity(parent.identity, fileIdentity(current))
        ) {
          fail("artifact-invalid");
        }
      }
      return Buffer.from(bytes);
    } finally {
      if (descriptor !== null) closeSync(descriptor);
    }
  } catch (error) {
    if (error instanceof PrivateReviewGatewayError) throw error;
    return fail("artifact-invalid");
  }
}

function walkDist(distDirectory: string): string[] {
  try {
    const root = resolve(distDirectory);
    const rootStat = lstatSync(root);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      fail("artifact-invalid");
    }
    const files: string[] = [];
    const visit = (directory: string): void => {
      for (const name of readdirSync(directory).sort(compareCodePoints)) {
        if (
          name.startsWith(".") ||
          name.includes("\\") ||
          /[\u0000-\u001f\u007f]/u.test(name)
        ) {
          fail("artifact-invalid");
        }
        const target = join(directory, name);
        const stat = lstatSync(target);
        if (stat.isSymbolicLink()) fail("artifact-invalid");
        if (stat.isDirectory()) visit(target);
        else if (stat.isFile()) files.push(safeRelativePath(root, target));
        else fail("artifact-invalid");
      }
    };
    visit(root);
    return files.sort(compareCodePoints);
  } catch (error) {
    if (error instanceof PrivateReviewGatewayError) throw error;
    return fail("artifact-invalid");
  }
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

function expectedContentType(buildPath: string): string {
  if (buildPath.endsWith(".gz") || buildPath.endsWith(".br")) {
    return fail("artifact-invalid");
  }
  const value = CONTENT_TYPES[extname(buildPath).toLowerCase()];
  if (value === undefined) return fail("artifact-invalid");
  return value;
}

function assertSamePaths(
  left: readonly string[],
  right: readonly string[],
): void {
  if (
    left.length !== right.length ||
    left.some((value, index) => value !== right[index])
  ) {
    fail("artifact-invalid");
  }
}

async function defaultArtifactValidator(
  context: ArtifactValidationContext,
): Promise<void> {
  try {
    const current = currentPrivateDistSourceState(context.root);
    if (current.dirty) fail("artifact-invalid");
    const rebuilt = buildPrivateDistManifestFromDisk({
      root: context.root,
      buildMode: "review",
      sourceState: { ...current, commit: context.manifest.buildCommit },
      now: new Date(context.manifest.generatedAt),
    });
    const after = currentPrivateDistSourceState(context.root);
    if (
      canonicalJson(after) !== canonicalJson(current) ||
      canonicalJson(rebuilt) !==
        decodeUtf8(context.manifestBytes, "manifest-invalid")
    ) {
      fail("artifact-invalid");
    }
  } catch (error) {
    if (error instanceof PrivateReviewGatewayError) throw error;
    fail("artifact-invalid");
  }
}

async function loadSnapshot(
  root: string,
  config: PrivateHostingConfigV1,
  configDigest: string,
  validateArtifact: NonNullable<
    PrivateReviewGatewayDependencies["validateArtifactManifestSnapshot"]
  >,
): Promise<LoadedPrivateReviewSnapshot> {
  const manifestBytes = readStableRegularFile(
    root,
    config.artifact.manifestPath,
  );
  const parsedManifest = parseArtifactManifestBytes(manifestBytes);
  if (parsedManifest.manifest === null || parsedManifest.issues.length > 0) {
    return fail("manifest-invalid");
  }
  const manifest = parsedManifest.manifest;
  try {
    await validateArtifact({ root, manifest, manifestBytes });
  } catch (error) {
    if (error instanceof PrivateReviewGatewayError) throw error;
    return fail("artifact-invalid");
  }

  const headerPolicyBytes = readStableRegularFile(
    root,
    config.artifact.headerPolicyPath,
  );
  parseHeaderPolicyBytes(headerPolicyBytes);
  if (manifest.headerPolicyDigest !== sha256Hex(headerPolicyBytes)) {
    return fail("header-policy-invalid");
  }

  const localReviewSetBytes = readStableRegularFile(
    root,
    config.artifact.reviewSetPath,
  );
  const parsedReviewSet = parseReviewSetManifestV2Bytes(localReviewSetBytes);
  if (parsedReviewSet.manifest === null || parsedReviewSet.issues.length > 0) {
    return fail("artifact-invalid");
  }
  if (
    manifest.reviewSetDigest !== parsedReviewSet.reviewSetDigest ||
    manifest.reviewSetResponseSha256 !== sha256Hex(localReviewSetBytes) ||
    manifest.rendererTreeDigest !== parsedReviewSet.manifest.rendererTreeDigest
  ) {
    return fail("artifact-invalid");
  }

  const distDirectory = join(root, config.artifact.distDirectory);
  const firstPaths = walkDist(distDirectory);
  if (validateArtifactManifestCoverage(manifest, firstPaths).length > 0) {
    return fail("artifact-invalid");
  }
  const entries = new Map<string, PrivateReviewSnapshotEntry>();
  for (const file of manifest.files) {
    if (file.contentType !== expectedContentType(file.buildPath)) {
      return fail("artifact-invalid");
    }
    const bytes = readStableRegularFile(distDirectory, file.buildPath);
    if (
      bytes.byteLength !== file.byteLength ||
      sha256Hex(bytes) !== file.sha256 ||
      entries.has(file.requestPath)
    ) {
      return fail("artifact-invalid");
    }
    entries.set(file.requestPath, {
      bytes: Buffer.from(bytes),
      contentType: file.contentType,
    });
  }
  const finalPaths = walkDist(distDirectory);
  assertSamePaths(firstPaths, finalPaths);
  if (validateArtifactManifestCoverage(manifest, finalPaths).length > 0) {
    return fail("artifact-invalid");
  }
  const servedReviewSet = entries.get("/review/review-set.json");
  if (
    servedReviewSet === undefined ||
    !servedReviewSet.bytes.equals(localReviewSetBytes) ||
    !entries.has("/") ||
    !entries.has("/robots.txt")
  ) {
    return fail("artifact-invalid");
  }
  return {
    root,
    config,
    configDigest,
    manifest,
    manifestDigest: parsedManifest.manifestDigest,
    entries,
  };
}

/**
 * Loads the complete immutable local artifact without opening a socket or
 * consulting Tailscale/Keychain. This is also the Task 5/7 verifier entrypoint.
 */
export async function loadPrivateReviewSnapshot(
  options: LoadPrivateReviewSnapshotOptions = {},
): Promise<LoadedPrivateReviewSnapshot> {
  let root: string;
  try {
    root = realpathSync.native(resolve(options.root ?? process.cwd()));
  } catch {
    return fail("config-invalid");
  }
  const configPath = options.configPath ?? PRIVATE_HOSTING_CONFIG_PATH;
  if (configPath !== PRIVATE_HOSTING_CONFIG_PATH) return fail("config-invalid");
  let configBytes: Buffer;
  try {
    configBytes = readStableRegularFile(root, configPath);
  } catch {
    return fail("config-invalid");
  }
  let config: PrivateHostingConfigV1;
  try {
    config = parsePrivateHostingConfigBytes(configBytes);
  } catch {
    return fail("config-invalid");
  }
  return loadSnapshot(
    root,
    config,
    sha256Hex(configBytes),
    options.validateArtifactManifestSnapshot ?? defaultArtifactValidator,
  );
}

function defaultResolveTailscaleIPv4(config: PrivateHostingConfigV1): string {
  const result = spawnSync(config.bind.tailscaleCliPath, ["ip", "-4"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    maxBuffer: 4096,
    timeout: 5_000,
    killSignal: "SIGKILL",
  });
  if (
    result.error !== undefined ||
    result.signal !== null ||
    result.status !== 0 ||
    typeof result.stdout !== "string"
  ) {
    return fail("tailscale-unavailable");
  }
  const values = result.stdout.split(/\r?\n/u).filter((value) => value !== "");
  if (values.length !== 1) return fail("tailscale-unavailable");
  return values[0]!;
}

function defaultLoadTailscaleStatus(
  config: PrivateHostingConfigV1,
): TailscaleRuntimeStatus {
  const result = spawnSync(config.bind.tailscaleCliPath, ["status", "--json"], {
    encoding: "buffer",
    stdio: ["ignore", "pipe", "ignore"],
    maxBuffer: 8 * 1024 * 1024,
    timeout: 5_000,
    killSignal: "SIGKILL",
  });
  if (
    result.error !== undefined ||
    result.signal !== null ||
    result.status !== 0 ||
    !Buffer.isBuffer(result.stdout)
  ) {
    return fail("tailscale-unavailable");
  }
  let parsed: unknown;
  try {
    parsed = parseStrictJson(
      new TextDecoder("utf-8", { fatal: true }).decode(result.stdout),
    );
  } catch {
    return fail("tailscale-unavailable");
  }
  if (!isRecord(parsed) || !isRecord(parsed.Self)) {
    return fail("tailscale-unavailable");
  }
  const self = parsed.Self;
  if (
    typeof parsed.BackendState !== "string" ||
    typeof self.Online !== "boolean" ||
    typeof self.DNSName !== "string" ||
    !Array.isArray(self.TailscaleIPs) ||
    self.TailscaleIPs.some((value) => typeof value !== "string")
  ) {
    return fail("tailscale-unavailable");
  }
  return {
    backendState: parsed.BackendState,
    selfOnline: self.Online,
    selfDnsName: self.DNSName,
    selfTailscaleIPs: self.TailscaleIPs as string[],
  };
}

async function assertCurrentTailscaleIdentity(
  config: PrivateHostingConfigV1,
  dependencies: PrivateReviewGatewayDependencies,
): Promise<void> {
  const resolver =
    dependencies.resolveTailscaleIPv4 ?? defaultResolveTailscaleIPv4;
  const statusLoader =
    dependencies.loadTailscaleStatus ?? defaultLoadTailscaleStatus;
  let resolvedAddress: string;
  let status: TailscaleRuntimeStatus;
  try {
    [resolvedAddress, status] = await Promise.all([
      resolver(config),
      statusLoader(config),
    ]);
  } catch (error) {
    if (error instanceof PrivateReviewGatewayError) throw error;
    return fail("tailscale-unavailable");
  }
  assertExactTailscaleBindAddress(resolvedAddress, config.bind.tailscaleIPv4);
  const normalizedDnsName = status.selfDnsName.endsWith(".")
    ? status.selfDnsName.slice(0, -1)
    : status.selfDnsName;
  if (
    status.backendState !== "Running" ||
    status.selfOnline !== true ||
    status.selfDnsName.endsWith("..") ||
    normalizedDnsName !== config.bind.tailscaleDnsName ||
    status.selfTailscaleIPs.filter(
      (address) => address === config.bind.tailscaleIPv4,
    ).length !== 1
  ) {
    return fail("tailscale-unavailable");
  }
}

function defaultLoadCredentialVerifier(
  query: CredentialVerifierQuery,
): string | null {
  const result = spawnSync(
    SECURITY_CLI_PATH,
    ["find-generic-password", "-a", query.account, "-s", query.service, "-w"],
    {
      encoding: "buffer",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 16 * 1024,
      timeout: 5_000,
      killSignal: "SIGKILL",
    },
  );
  if (
    result.error !== undefined ||
    result.signal !== null ||
    result.status !== 0 ||
    !Buffer.isBuffer(result.stdout)
  ) {
    return null;
  }
  let output = Buffer.from(result.stdout);
  if (output.at(-1) === 0x0a) {
    output = output.subarray(0, output.length - 1);
    if (output.at(-1) === 0x0d) output = output.subarray(0, output.length - 1);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(output);
  } catch {
    return null;
  }
}

function normalizeLoadedVerifier(value: string | Uint8Array | null): {
  token: string;
  verifier: ScryptVerifierV1;
} {
  if (value === null) return fail("credential-unavailable");
  const token = decodeUtf8(value, "credential-invalid");
  return { token, verifier: parseScryptVerifierToken(token) };
}

async function readVerifier(
  loader: NonNullable<
    PrivateReviewGatewayDependencies["loadCredentialVerifier"]
  >,
): Promise<{ token: string; verifier: ScryptVerifierV1 }> {
  try {
    const value = await loader({
      service: PRIVATE_REVIEW_KEYCHAIN_SERVICE,
      account: PRIVATE_REVIEW_KEYCHAIN_ACCOUNT,
    });
    return normalizeLoadedVerifier(value);
  } catch (error) {
    if (error instanceof PrivateReviewGatewayError) throw error;
    return fail("credential-unavailable");
  }
}

interface BasicCredentials {
  username: string;
  password: string;
}

function parseBasicCredentials(
  request: IncomingMessage,
): BasicCredentials | null {
  const values: string[] = [];
  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    if (request.rawHeaders[index]!.toLowerCase() === "authorization") {
      values.push(request.rawHeaders[index + 1] ?? "");
    }
  }
  if (values.length !== 1) return null;
  const match = /^Basic ([A-Za-z0-9+/]+={0,2})$/u.exec(values[0]!);
  if (match === null || match[1]!.length % 4 !== 0) return null;
  const encoded = match[1]!;
  const decoded = Buffer.from(encoded, "base64");
  if (decoded.toString("base64") !== encoded || decoded.byteLength > 2048) {
    return null;
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(decoded);
  } catch {
    return null;
  }
  const separator = text.indexOf(":");
  if (
    separator < 1 ||
    separator !== text.lastIndexOf(":") ||
    separator === text.length - 1
  ) {
    return null;
  }
  const username = text.slice(0, separator);
  const password = text.slice(separator + 1);
  if (
    /[\u0000-\u001f\u007f]/u.test(username) ||
    /[\u0000-\u001f\u007f]/u.test(password)
  ) {
    return null;
  }
  return { username, password };
}

async function authenticateRequest(
  request: IncomingMessage,
  loader: NonNullable<
    PrivateReviewGatewayDependencies["loadCredentialVerifier"]
  >,
  safeEqual: NonNullable<PrivateReviewGatewayDependencies["timingSafeEqual"]>,
): Promise<boolean> {
  // Keychain is deliberately consulted before the Authorization header and
  // before request.url. Removed or rotated credentials take effect immediately.
  let before: { token: string; verifier: ScryptVerifierV1 };
  try {
    before = await readVerifier(loader);
  } catch {
    return false;
  }
  const credentials = parseBasicCredentials(request);
  if (credentials === null) return false;
  let candidate: Buffer;
  try {
    candidate = await deriveScrypt(credentials.password, before.verifier);
  } catch {
    return false;
  }
  let after: { token: string; verifier: ScryptVerifierV1 };
  try {
    after = await readVerifier(loader);
    if (
      after.token !== before.token ||
      after.verifier.credentialGeneration !==
        before.verifier.credentialGeneration
    ) {
      return false;
    }
    const expected = Buffer.from(before.verifier.derivedKey, "base64url");
    const passwordMatches = safeEqual(candidate, expected);
    return credentials.username === PRIVATE_REVIEW_USERNAME && passwordMatches;
  } catch {
    return false;
  } finally {
    candidate.fill(0);
  }
}

function applyRequiredHeaders(response: ServerResponse): void {
  for (const [name, value] of Object.entries(REQUIRED_RESPONSE_HEADERS)) {
    response.setHeader(name, value);
  }
}

function sendEmpty(response: ServerResponse, status: number): void {
  applyRequiredHeaders(response);
  response.statusCode = status;
  response.setHeader("Content-Length", "0");
  if (status === 401) response.setHeader("WWW-Authenticate", WWW_AUTHENTICATE);
  if (status === 405) response.setHeader("Allow", "GET, HEAD");
  response.end();
}

function rawClientErrorResponse(): string {
  const headers = Object.entries(REQUIRED_RESPONSE_HEADERS)
    .map(([name, value]) => `${name}: ${value}\r\n`)
    .join("");
  return `HTTP/1.1 400 Bad Request\r\n${headers}Content-Length: 0\r\nConnection: close\r\n\r\n`;
}

function requestHandler(
  snapshot: LoadedPrivateReviewSnapshot,
  loader: NonNullable<
    PrivateReviewGatewayDependencies["loadCredentialVerifier"]
  >,
  safeEqual: NonNullable<PrivateReviewGatewayDependencies["timingSafeEqual"]>,
): (request: IncomingMessage, response: ServerResponse) => void {
  return (request, response): void => {
    void (async () => {
      const authorized = await authenticateRequest(request, loader, safeEqual);
      if (!authorized) {
        sendEmpty(response, 401);
        return;
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        sendEmpty(response, 405);
        return;
      }
      // This is the first read of request.url. Exact raw target lookup means no
      // decoding, normalization, directory indexing, query alias, or redirect.
      const target = request.url;
      const entry =
        target === undefined ? undefined : snapshot.entries.get(target);
      if (entry === undefined) {
        sendEmpty(response, 404);
        return;
      }
      applyRequiredHeaders(response);
      response.statusCode = 200;
      response.setHeader("Content-Type", entry.contentType);
      response.setHeader("Content-Length", String(entry.bytes.byteLength));
      if (request.method === "HEAD") response.end();
      else response.end(entry.bytes);
    })().catch(() => {
      if (!response.headersSent) sendEmpty(response, 500);
      else response.destroy();
    });
  };
}

function defaultListenServer(
  server: Server,
  target: PrivateReviewListenTarget,
): Promise<PrivateReviewListenAddress> {
  return new Promise((resolvePromise, rejectPromise) => {
    const onError = (): void =>
      rejectPromise(new PrivateReviewGatewayError("listen-failed"));
    server.once("error", onError);
    server.listen(
      { host: target.host, port: target.port, exclusive: true },
      () => {
        server.off("error", onError);
        const address = server.address();
        if (address === null || typeof address === "string") {
          rejectPromise(new PrivateReviewGatewayError("listen-failed"));
          return;
        }
        if (address.address !== target.host || address.port !== target.port) {
          rejectPromise(new PrivateReviewGatewayError("listen-failed"));
          return;
        }
        resolvePromise({ host: address.address, port: address.port });
      },
    );
  });
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolvePromise) => {
    if (!server.listening) {
      server.closeAllConnections();
      resolvePromise();
      return;
    }
    let settled = false;
    const finish = (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolvePromise();
    };
    const timeout = setTimeout(() => {
      server.closeAllConnections();
      finish();
    }, 1_500);
    timeout.unref();
    server.close(() => finish());
    server.closeIdleConnections();
  });
}

/** Validates every dependency and artifact before opening a listening socket. */
export async function startPrivateReviewServer(
  options: StartPrivateReviewServerOptions = {},
): Promise<RunningPrivateReviewServer> {
  const dependencies = options.dependencies ?? {};
  const logger = dependencies.logger ?? (() => undefined);
  const snapshot = await loadPrivateReviewSnapshot({
    root: options.root,
    configPath: options.configPath,
    validateArtifactManifestSnapshot:
      dependencies.validateArtifactManifestSnapshot,
  });
  const config = snapshot.config;
  if (
    (dependencies.runtimeNodeVersion ?? process.versions.node) !==
    config.nodeVersion
  ) {
    return fail("node-version-mismatch");
  }
  assertExactTailscaleBindAddress(config.bind.tailscaleIPv4);
  await assertCurrentTailscaleIdentity(config, dependencies);

  const verifierLoader =
    dependencies.loadCredentialVerifier ?? defaultLoadCredentialVerifier;
  // A valid verifier is a startup prerequisite even though it is reloaded for
  // every authorization decision to make removal/rotation immediate.
  await readVerifier(verifierLoader);
  const safeEqual = dependencies.timingSafeEqual ?? timingSafeEqual;
  const handler = requestHandler(snapshot, verifierLoader, safeEqual);
  const server = createServer(handler);
  server.on("checkContinue", handler);
  server.on("checkExpectation", handler);
  server.on("clientError", (_error, socket) => {
    if (socket.writable) socket.end(rawClientErrorResponse());
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;

  const listener = dependencies.listenServer ?? defaultListenServer;
  let address: PrivateReviewListenAddress;
  try {
    address = await listener(server, {
      host: PRIVATE_REVIEW_TAILSCALE_IPV4,
      port: PRIVATE_REVIEW_PORT,
    });
  } catch {
    await closeServer(server).catch(() => undefined);
    return fail("listen-failed");
  }
  try {
    await assertCurrentTailscaleIdentity(config, dependencies);
  } catch (error) {
    await closeServer(server);
    throw error;
  }
  try {
    logger("private-review-ready");
  } catch {
    await closeServer(server);
    return fail("listen-failed");
  }
  let closed = false;
  return {
    server,
    address,
    configDigest: snapshot.configDigest,
    manifestDigest: snapshot.manifestDigest,
    requestPaths: Object.freeze([...snapshot.entries.keys()]),
    close: async (): Promise<void> => {
      if (closed) return;
      closed = true;
      await closeServer(server);
      try {
        logger("private-review-stopped");
      } catch {
        // Lifecycle logging is non-authoritative and must never block closure.
      }
    },
  };
}

async function main(): Promise<void> {
  try {
    const running = await startPrivateReviewServer({
      dependencies: { logger: (event) => process.stdout.write(`${event}\n`) },
    });
    const stop = (): void => {
      void running.close().finally(() => process.exit(0));
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  } catch (error) {
    const code =
      error instanceof PrivateReviewGatewayError
        ? error.code
        : "startup-failed";
    process.stderr.write(`private-review-failed:${code}\n`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  void main();
}
