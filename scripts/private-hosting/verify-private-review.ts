/**
 * Complete G4 live verifier for the authenticated private-review gateway.
 *
 * The verifier retains response bodies, the private origin, credentials, and
 * the raw listener identity only in memory.  The tracked receipt contains the
 * canonical per-path metadata plus hashes of the origin and deployment tuple.
 */

import { spawnSync } from "node:child_process";
import { constants } from "node:fs";
import {
  closeSync,
  existsSync,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
  writeSync,
  type Stats,
} from "node:fs";
import {
  Agent,
  request as httpRequest,
  type ClientRequest,
  type RequestOptions,
} from "node:http";
import { networkInterfaces } from "node:os";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { parse, type DefaultTreeAdapterTypes } from "parse5";

import {
  canonicalJson,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical.ts";
import {
  ARTIFACT_IDENTITY_META_NAME,
  decodeArtifactIdentity,
  PRIVATE_HTTP_HEADER_CONTRACT_ID,
  type ArtifactFile,
} from "../../src/lib/governance/artifact-manifest.ts";
import { PRIVATE_REVIEW_MAX_FILE_BYTES } from "../../src/lib/governance/private-review-limits.ts";
import {
  DISALLOW_ALL_ROBOTS_TXT,
  NOINDEX_ROBOTS_META,
} from "../../src/lib/governance/build-mode.ts";
import {
  computeAuthorizedMetadataDigest,
  computeServedArtifactReceiptDigest,
  computeUnauthorizedMetadataDigest,
  EMPTY_BODY_SHA256,
  G4_AUTHORIZATION_DECISION_SHA256,
  G4_PLAN_PATH,
  G4_PLAN_SHA256,
  parseServedArtifactReceiptBytes,
  UNAUTHORIZED_SCENARIOS,
  validateServedArtifactReceipt,
  type AuthorizedResponse,
  type ServedArtifactReceipt,
  type UnauthorizedResponse,
} from "../../src/lib/governance/served-artifact-receipt.ts";
import { assertPlanAuthorized } from "../assert-plan-authorized.ts";
import {
  parseReviewAccessInfoBytes,
  REVIEW_ACCESS_INFO_PATH,
} from "./provision-review-credential.ts";
import {
  loadPrivateReviewSnapshot,
  PRIVATE_REVIEW_NODE_VERSION,
  PRIVATE_REVIEW_PORT,
  PRIVATE_REVIEW_TAILSCALE_IPV4,
  PRIVATE_REVIEW_USERNAME,
  type LoadedPrivateReviewSnapshot,
} from "./serve-private-review.ts";

export const SERVED_REVIEW_RECEIPT_PATH =
  "review/served-review-receipt.v1.json";
export const PRIVATE_REVIEW_ORIGIN = "http://100.114.3.93:8140";
export const PRIVATE_REVIEW_LAUNCHD_LABEL =
  "tw.sportsmedicine.atlas.private-review.v1";

const TAILSCALE_CLI_PATH = "/opt/homebrew/bin/tailscale";
const LSOF_PATH = "/usr/sbin/lsof";
const PS_PATH = "/bin/ps";
const LAUNCHCTL_PATH = "/bin/launchctl";
const STTY_PATH = "/bin/stty";
const GIT_PATH = "/usr/bin/git";
const REQUEST_TIMEOUT_MS = 8_000;
const COMPLETE_RUN_TIMEOUT_MS = 180_000;
const SECONDARY_LOOPBACK_ADDRESSES = Object.freeze(["127.0.0.1", "::1"]);
const WWW_AUTHENTICATE = 'Basic realm="Private review", charset="UTF-8"';
const REQUIRED_HEADERS = Object.freeze({
  "cache-control": "private, no-store, max-age=0",
  pragma: "no-cache",
  vary: "Authorization",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
});
const FORBIDDEN_HEADERS = Object.freeze([
  "age",
  "content-encoding",
  "etag",
  "expires",
  "last-modified",
  "location",
  "server",
  "set-cookie",
  "transfer-encoding",
]);
const PASSWORD_RE = /^[A-Za-z0-9_-]+$/u;

export type PrivateHostVerifierErrorCode =
  | "authorization-invalid"
  | "artifact-invalid"
  | "credential-invalid"
  | "network-invalid"
  | "network-changed"
  | "status-mismatch"
  | "redirect-mismatch"
  | "header-mismatch"
  | "byte-mismatch"
  | "identity-mismatch"
  | "leak-detected"
  | "transport-failed"
  | "receipt-invalid"
  | "receipt-sensitive"
  | "receipt-write-failed"
  | "runtime-invalid";

/** Sanitized error: it may identify a manifest path/scenario, never a body or secret. */
export class PrivateHostVerifierError extends Error {
  readonly code: PrivateHostVerifierErrorCode;
  readonly path?: string;
  readonly scenario?: string;

  constructor(
    code: PrivateHostVerifierErrorCode,
    context: { path?: string; scenario?: string } = {},
  ) {
    const fields = [
      `private-host-verifier:${code}`,
      context.path === undefined ? "" : `path=${context.path}`,
      context.scenario === undefined ? "" : `scenario=${context.scenario}`,
    ].filter((value) => value !== "");
    super(fields.join(" "));
    this.name = "PrivateHostVerifierError";
    this.code = code;
    this.path = context.path;
    this.scenario = context.scenario;
  }
}

function fail(
  code: PrivateHostVerifierErrorCode,
  context: { path?: string; scenario?: string } = {},
): never {
  throw new PrivateHostVerifierError(code, context);
}

export interface PrivateVerifierCredential {
  username: string;
  password: string;
}

export interface PrivateVerifierRequest {
  origin: string;
  requestPath: string;
  method: "GET";
  authorization?: string;
  acceptEncoding: "identity";
  redirect: "manual";
  clientId: string;
  reuseConnection: boolean;
  maxBodyBytes: number;
}

export interface PrivateVerifierObservation {
  status: number;
  rawHeaders: string[];
  body: Buffer;
  redirected: boolean;
}

export interface PrivateListenerInspection {
  count: number;
  host: string;
  port: number;
  transport: "tcp4" | "invalid";
  pid: number;
  parentPid: number;
  uid: number;
  cwd: string;
  executable: string;
  processCommand: string;
  launchdLabel: string;
  launchdPid: number;
  launchdUid: number;
  launchdCwd: string;
  launchdExecutable: string;
  launchdProcessCommand: string;
  runtimeNodeVersion: string;
  wildcardListenerObserved: boolean;
  loopbackListenerObserved: boolean;
  lanListenerObserved: boolean;
  ipv6ListenerObserved: boolean;
  legacyListenerObserved: boolean;
}

export interface PrivateTailscaleInspection {
  backendState: string;
  selfOnline: boolean;
  selfDnsName: string;
  selfTailscaleIPs: string[];
  identityDigest: string;
  serveStateDigest: string;
  funnelStateDigest: string;
  serveAtlasPortExposed: boolean;
  funnelAtlasPortExposed: boolean;
}

export interface SecondaryOriginInspection {
  kind: "loopback" | "lan";
  address: string;
  result: "refused" | "responded" | "inconclusive";
  status: number | null;
}

export interface PrivateNetworkInspection {
  listener: PrivateListenerInspection;
  tailscale: PrivateTailscaleInspection;
  secondaryOrigins: SecondaryOriginInspection[];
  loopbackProbeCompleted: boolean;
  lanAddresses: string[];
  wildcardInspectionCompleted: boolean;
  legacyInspectionCompleted: boolean;
}

export interface PrivateHostVerifierDependencies {
  root?: string;
  readCredential: () =>
    PrivateVerifierCredential | Promise<PrivateVerifierCredential>;
  request: (
    request: PrivateVerifierRequest,
  ) => PrivateVerifierObservation | Promise<PrivateVerifierObservation>;
  closeRequests?: () => void | Promise<void>;
  inspectNetwork: () =>
    PrivateNetworkInspection | Promise<PrivateNetworkInspection>;
  now?: () => Date;
  writeReceipt: (
    targetPath: string,
    bytes: string | Uint8Array,
  ) => void | Promise<void>;
}

export interface PrivateHostVerifierResult {
  receipt: ServedArtifactReceipt;
  receiptBytes: string;
  receiptDigest: string;
}

interface VerificationContext {
  path: string;
  scenario?: string;
}

function utcSeconds(date: Date): string {
  if (!Number.isFinite(date.getTime())) fail("receipt-invalid");
  return date.toISOString().replace(/\.\d{3}Z$/u, "Z");
}

function assertCredential(
  value: PrivateVerifierCredential,
): PrivateVerifierCredential {
  if (
    value === null ||
    typeof value !== "object" ||
    value.username !== PRIVATE_REVIEW_USERNAME ||
    typeof value.password !== "string" ||
    !PASSWORD_RE.test(value.password) ||
    Buffer.from(value.password, "base64url").byteLength !== 32 ||
    Buffer.from(value.password, "base64url").toString("base64url") !==
      value.password
  ) {
    fail("credential-invalid");
  }
  return value;
}

function basicAuthorization(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}

function headerMap(
  rawHeaders: readonly string[],
  context: VerificationContext,
): Map<string, string[]> {
  if (rawHeaders.length % 2 !== 0) fail("header-mismatch", context);
  const result = new Map<string, string[]>();
  for (let index = 0; index < rawHeaders.length; index += 2) {
    const name = rawHeaders[index];
    const value = rawHeaders[index + 1];
    if (
      name === undefined ||
      value === undefined ||
      name === "" ||
      /[\u0000-\u001f\u007f]/u.test(name) ||
      /[\u0000\u000a\u000d]/u.test(value)
    ) {
      fail("header-mismatch", context);
    }
    const key = name.toLowerCase();
    const values = result.get(key) ?? [];
    values.push(value);
    result.set(key, values);
  }
  return result;
}

function exactHeader(
  headers: ReadonlyMap<string, string[]>,
  name: string,
  expected: string,
  context: VerificationContext,
): void {
  const values = headers.get(name.toLowerCase());
  if (values?.length !== 1 || values[0] !== expected) {
    fail("header-mismatch", context);
  }
}

function absentHeader(
  headers: ReadonlyMap<string, string[]>,
  name: string,
  context: VerificationContext,
): void {
  if (headers.has(name.toLowerCase())) fail("header-mismatch", context);
}

function verifyCommonHeaders(
  observation: PrivateVerifierObservation,
  context: VerificationContext,
): Map<string, string[]> {
  const headers = headerMap(observation.rawHeaders, context);
  for (const [name, value] of Object.entries(REQUIRED_HEADERS)) {
    exactHeader(headers, name, value, context);
  }
  for (const name of FORBIDDEN_HEADERS) absentHeader(headers, name, context);
  return headers;
}

type HtmlElement = DefaultTreeAdapterTypes.Element;
type HtmlNode = DefaultTreeAdapterTypes.Node;

function isHtmlElement(node: HtmlNode): node is HtmlElement {
  return "tagName" in node;
}

function childElements(node: HtmlNode): HtmlElement[] {
  return "childNodes" in node ? node.childNodes.filter(isHtmlElement) : [];
}

function descendantElements(node: HtmlNode): HtmlElement[] {
  const result: HtmlElement[] = [];
  for (const child of childElements(node)) {
    result.push(child, ...descendantElements(child));
  }
  return result;
}

function htmlAttribute(element: HtmlElement, name: string): string | null {
  return element.attrs.find((entry) => entry.name === name)?.value ?? null;
}

function verifyHtmlIdentity(
  body: Buffer,
  file: ArtifactFile,
  context: VerificationContext,
): void {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    return fail("identity-mismatch", context);
  }
  const parseErrors: string[] = [];
  const document = parse(text, {
    onParseError: (error) => parseErrors.push(error.code),
  });
  if (parseErrors.length > 0) fail("identity-mismatch", context);
  const htmlElements = childElements(document).filter(
    (element) => element.tagName === "html",
  );
  const heads =
    htmlElements.length === 1
      ? childElements(htmlElements[0]!).filter(
          (element) => element.tagName === "head",
        )
      : [];
  if (heads.length !== 1) fail("identity-mismatch", context);
  const all = descendantElements(document);
  const headElements = new Set(descendantElements(heads[0]!));
  const identities = all.filter(
    (element) =>
      element.tagName === "meta" &&
      htmlAttribute(element, "name") === ARTIFACT_IDENTITY_META_NAME,
  );
  const robots = all.filter(
    (element) =>
      element.tagName === "meta" &&
      htmlAttribute(element, "name")?.toLowerCase() === "robots",
  );
  if (
    identities.length !== 1 ||
    !headElements.has(identities[0]!) ||
    robots.length !== 1 ||
    !headElements.has(robots[0]!) ||
    htmlAttribute(robots[0]!, "content") !== NOINDEX_ROBOTS_META
  ) {
    fail("identity-mismatch", context);
  }
  const encoded = htmlAttribute(identities[0]!, "content");
  if (encoded === null) fail("identity-mismatch", context);
  try {
    if (
      canonicalJson(decodeArtifactIdentity(encoded)) !==
      canonicalJson(file.identity)
    ) {
      fail("identity-mismatch", context);
    }
  } catch (error) {
    if (error instanceof PrivateHostVerifierError) throw error;
    fail("identity-mismatch", context);
  }
}

function sortedStrings(values: readonly string[]): string[] {
  return [...values].sort(compareCodePoints);
}

function exactStrings(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const a = sortedStrings(left);
  const b = sortedStrings(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function verifyCaseIndexIdentity(
  body: Buffer,
  file: ArtifactFile,
  context: VerificationContext,
): void {
  let value: unknown;
  try {
    value = parseStrictJson(
      new TextDecoder("utf-8", { fatal: true }).decode(body),
    );
  } catch {
    return fail("identity-mismatch", context);
  }
  if (file.identity.digest !== sha256Hex(body)) {
    fail("identity-mismatch", context);
  }
  if (file.identity.kind === "case-index-shard") {
    if (!Array.isArray(value)) fail("identity-mismatch", context);
    const recordIds = value.map((entry) => {
      if (
        entry === null ||
        typeof entry !== "object" ||
        Array.isArray(entry) ||
        typeof (entry as Record<string, unknown>).id !== "string"
      ) {
        fail("identity-mismatch", context);
      }
      return (entry as Record<string, string>).id;
    });
    if (
      !exactStrings(recordIds, file.identity.recordIds) ||
      file.identity.shardIds.length !== 1 ||
      file.identity.shardIds[0] !== file.requestPath
    ) {
      fail("identity-mismatch", context);
    }
    return;
  }
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !Array.isArray((value as Record<string, unknown>).injuries)
  ) {
    fail("identity-mismatch", context);
  }
  const shardIds: string[] = [];
  for (const entry of (value as { injuries: unknown[] }).injuries) {
    if (
      entry === null ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      typeof (entry as Record<string, unknown>).injuryCode !== "string" ||
      !Number.isSafeInteger((entry as Record<string, unknown>).shardCount) ||
      ((entry as Record<string, number>).shardCount as number) < 1
    ) {
      fail("identity-mismatch", context);
    }
    const record = entry as { injuryCode: string; shardCount: number };
    for (let index = 1; index <= record.shardCount; index += 1) {
      shardIds.push(`/case-index/${record.injuryCode}/${index}.json`);
    }
  }
  if (!exactStrings(shardIds, file.identity.shardIds)) {
    fail("identity-mismatch", context);
  }
}

function verifyBodyIdentity(
  observation: PrivateVerifierObservation,
  file: ArtifactFile,
  context: VerificationContext,
): {
  shard: "passed" | "not-applicable";
  robotsMeta: "passed" | "not-applicable";
  robotsTxt: "passed" | "not-applicable";
} {
  if (file.identity.kind === "html-page") {
    verifyHtmlIdentity(observation.body, file, context);
  } else if (
    file.identity.kind === "case-index-manifest" ||
    file.identity.kind === "case-index-shard"
  ) {
    verifyCaseIndexIdentity(observation.body, file, context);
  } else if (
    file.identity.kind === "robots-txt" &&
    !observation.body.equals(Buffer.from(DISALLOW_ALL_ROBOTS_TXT, "utf8"))
  ) {
    fail("identity-mismatch", context);
  }
  return {
    shard:
      file.identity.kind === "case-index-manifest" ||
      file.identity.kind === "case-index-shard"
        ? "passed"
        : "not-applicable",
    robotsMeta:
      file.identity.kind === "html-page" ? "passed" : "not-applicable",
    robotsTxt:
      file.identity.kind === "robots-txt" ? "passed" : "not-applicable",
  };
}

function verifyAuthorizedObservation(
  observation: PrivateVerifierObservation,
  file: ArtifactFile,
  context: VerificationContext = { path: file.requestPath },
): AuthorizedResponse {
  if (observation.status !== 200) fail("status-mismatch", context);
  if (observation.redirected) fail("redirect-mismatch", context);
  const headers = verifyCommonHeaders(observation, context);
  exactHeader(headers, "content-type", file.contentType, context);
  absentHeader(headers, "www-authenticate", context);
  if (
    observation.body.byteLength !== file.byteLength ||
    sha256Hex(observation.body) !== file.sha256
  ) {
    fail("byte-mismatch", context);
  }
  const identity = verifyBodyIdentity(observation, file, context);
  exactHeader(headers, "content-length", String(file.byteLength), context);
  return {
    requestPath: file.requestPath,
    method: "GET",
    status: 200,
    redirectMode: "manual",
    redirected: false,
    contentType: file.contentType,
    decodedByteLength: observation.body.byteLength,
    decodedSha256: sha256Hex(observation.body),
    identityResult: "passed",
    shardResult: identity.shard,
    robotsMetaResult: identity.robotsMeta,
    robotsTxtResult: identity.robotsTxt,
    headerContractId: PRIVATE_HTTP_HEADER_CONTRACT_ID,
    headersResult: "passed",
    forbiddenHeadersAbsent: true,
    contentEncodingPresent: false,
    bodyKind: "manifest-artifact",
    loginDocument: false,
    denyDocument: false,
    fallbackDocument: false,
    setCookiePresent: false,
    cacheBypassObserved: false,
  };
}

function verifyUnauthorizedObservation(
  observation: PrivateVerifierObservation,
  file: ArtifactFile,
  scenario: (typeof UNAUTHORIZED_SCENARIOS)[number],
): UnauthorizedResponse {
  const context = { path: file.requestPath, scenario };
  if (observation.status !== 401) fail("status-mismatch", context);
  if (observation.redirected) fail("redirect-mismatch", context);
  if (observation.body.byteLength !== 0) fail("leak-detected", context);
  const headers = verifyCommonHeaders(observation, context);
  exactHeader(headers, "content-length", "0", context);
  exactHeader(headers, "www-authenticate", WWW_AUTHENTICATE, context);
  absentHeader(headers, "content-type", context);
  return {
    scenario,
    requestPath: file.requestPath,
    method: "GET",
    redirectMode: "manual",
    redirected: false,
    status: 401,
    contentType: null,
    bodyByteLength: 0,
    bodySha256: EMPTY_BODY_SHA256,
    wwwAuthenticateResult: "passed",
    headerContractId: PRIVATE_HTTP_HEADER_CONTRACT_ID,
    headersResult: "passed",
    forbiddenHeadersAbsent: true,
    contentEncodingPresent: false,
    setCookiePresent: false,
    cacheBypassObserved: false,
    leaks: {
      atlasIdentity: false,
      reviewSetBytes: false,
      reviewSetDigest: false,
      cardSummaries: false,
      workflowStatus: false,
      deploymentIdentity: false,
    },
  };
}

export function validatePrivateNetworkInspection(
  inspection: PrivateNetworkInspection,
  root: string,
): void {
  const listener = inspection.listener;
  const expectedTsx = join(root, "node_modules/tsx/dist/cli.mjs");
  const expectedPreflight = join(root, "node_modules/tsx/dist/preflight.cjs");
  const expectedLoader = join(root, "node_modules/tsx/dist/loader.mjs");
  const expectedServer = join(
    root,
    "scripts/private-hosting/serve-private-review.ts",
  );
  const expectedLaunchdCommand = `${listener.launchdExecutable} ${expectedTsx} ${expectedServer}`;
  const expectedListenerCommand =
    `${listener.executable} --require ${expectedPreflight} --import ` +
    `${pathToFileURL(expectedLoader).href} ${expectedServer}`;
  if (
    listener.count !== 1 ||
    listener.host !== PRIVATE_REVIEW_TAILSCALE_IPV4 ||
    listener.port !== PRIVATE_REVIEW_PORT ||
    listener.transport !== "tcp4" ||
    !Number.isSafeInteger(listener.pid) ||
    listener.pid <= 0 ||
    !Number.isSafeInteger(listener.parentPid) ||
    listener.parentPid <= 0 ||
    listener.parentPid === listener.pid ||
    !Number.isSafeInteger(listener.uid) ||
    listener.uid <= 0 ||
    listener.uid !== process.getuid?.() ||
    listener.cwd !== root ||
    !isAbsolute(listener.executable) ||
    listener.processCommand !== expectedListenerCommand ||
    listener.launchdLabel !== PRIVATE_REVIEW_LAUNCHD_LABEL ||
    listener.launchdPid !== listener.parentPid ||
    !Number.isSafeInteger(listener.launchdUid) ||
    listener.launchdUid !== listener.uid ||
    listener.launchdCwd !== root ||
    listener.launchdExecutable !== listener.executable ||
    listener.launchdProcessCommand !== expectedLaunchdCommand ||
    listener.runtimeNodeVersion !== PRIVATE_REVIEW_NODE_VERSION ||
    listener.wildcardListenerObserved ||
    listener.loopbackListenerObserved ||
    listener.lanListenerObserved ||
    listener.ipv6ListenerObserved ||
    listener.legacyListenerObserved
  ) {
    fail("network-invalid");
  }
  const tailscale = inspection.tailscale;
  const normalizedDns = tailscale.selfDnsName.endsWith(".")
    ? tailscale.selfDnsName.slice(0, -1)
    : tailscale.selfDnsName;
  if (
    tailscale.backendState !== "Running" ||
    tailscale.selfOnline !== true ||
    normalizedDns !== "mac-mini-m5.tailbc16e9.ts.net" ||
    tailscale.selfTailscaleIPs.filter(
      (address) => address === PRIVATE_REVIEW_TAILSCALE_IPV4,
    ).length !== 1 ||
    !/^[0-9a-f]{64}$/u.test(tailscale.identityDigest) ||
    !/^[0-9a-f]{64}$/u.test(tailscale.serveStateDigest) ||
    !/^[0-9a-f]{64}$/u.test(tailscale.funnelStateDigest) ||
    tailscale.serveAtlasPortExposed ||
    tailscale.funnelAtlasPortExposed
  ) {
    fail("network-invalid");
  }
  const sortedLan = sortedStrings(inspection.lanAddresses);
  if (
    !inspection.loopbackProbeCompleted ||
    !inspection.wildcardInspectionCompleted ||
    !inspection.legacyInspectionCompleted ||
    !exactStrings(sortedLan, inspection.lanAddresses) ||
    new Set(inspection.lanAddresses).size !== inspection.lanAddresses.length ||
    inspection.secondaryOrigins.length !==
      inspection.lanAddresses.length + SECONDARY_LOOPBACK_ADDRESSES.length
  ) {
    fail("network-invalid");
  }
  const expectedProbes = new Map<string, "loopback" | "lan">([
    ...SECONDARY_LOOPBACK_ADDRESSES.map(
      (address) => [address, "loopback"] as const,
    ),
    ...inspection.lanAddresses.map((address) => [address, "lan"] as const),
  ]);
  for (const probe of inspection.secondaryOrigins) {
    if (
      expectedProbes.get(probe.address) !== probe.kind ||
      probe.result !== "refused" ||
      probe.status !== null
    ) {
      fail("network-invalid");
    }
    expectedProbes.delete(probe.address);
  }
  if (expectedProbes.size !== 0) fail("network-invalid");
}

function networkIdentity(inspection: PrivateNetworkInspection): string {
  return canonicalJson({
    listener: inspection.listener,
    tailscale: inspection.tailscale,
    secondaryOrigins: [...inspection.secondaryOrigins].sort((left, right) =>
      compareCodePoints(
        `${left.kind}\0${left.address}`,
        `${right.kind}\0${right.address}`,
      ),
    ),
    loopbackProbeCompleted: inspection.loopbackProbeCompleted,
    lanAddresses: inspection.lanAddresses,
    wildcardInspectionCompleted: inspection.wildcardInspectionCompleted,
    legacyInspectionCompleted: inspection.legacyInspectionCompleted,
  });
}

export interface PrivateDeploymentHashInput {
  buildCommit: string;
  reviewSetDigest: string;
  privateDistManifestDigest: string;
  gatewayConfigurationDigest: string;
  listenerIdentity: {
    address: string;
    port: number;
    transport: "tcp4";
    pid: number;
    parentPid: number;
    uid: number;
    cwd: string;
    executable: string;
    command: string;
    launchdLabel: string;
    launchdPid: number;
    launchdUid: number;
    launchdCwd: string;
    launchdExecutable: string;
    launchdCommand: string;
  };
}

/** Hash-only deployment identity primitive; callers never persist the input tuple. */
export function computePrivateDeploymentIdHash(
  input: PrivateDeploymentHashInput,
): string {
  return sha256Hex(
    canonicalJson({
      schemaVersion: 1,
      deploymentType: "atlas-private-review",
      ...input,
    }),
  );
}

function deploymentIdHash(
  snapshot: LoadedPrivateReviewSnapshot,
  inspection: PrivateNetworkInspection,
): string {
  const listener = inspection.listener;
  return computePrivateDeploymentIdHash({
    buildCommit: snapshot.manifest.buildCommit,
    reviewSetDigest: snapshot.manifest.reviewSetDigest,
    privateDistManifestDigest: snapshot.manifestDigest,
    gatewayConfigurationDigest: snapshot.configDigest,
    listenerIdentity: {
      address: listener.host,
      port: listener.port,
      transport: "tcp4",
      pid: listener.pid,
      parentPid: listener.parentPid,
      uid: listener.uid,
      cwd: listener.cwd,
      executable: listener.executable,
      command: listener.processCommand,
      launchdLabel: listener.launchdLabel,
      launchdPid: listener.launchdPid,
      launchdUid: listener.launchdUid,
      launchdCwd: listener.launchdCwd,
      launchdExecutable: listener.launchdExecutable,
      launchdCommand: listener.launchdProcessCommand,
    },
  });
}

function requestContext(
  file: ArtifactFile,
  clientId: string,
  authorization: string | undefined,
  reuseConnection: boolean,
): PrivateVerifierRequest {
  return {
    origin: PRIVATE_REVIEW_ORIGIN,
    requestPath: file.requestPath,
    method: "GET",
    ...(authorization === undefined ? {} : { authorization }),
    acceptEncoding: "identity",
    redirect: "manual",
    clientId,
    reuseConnection,
    maxBodyBytes: Math.min(
      PRIVATE_REVIEW_MAX_FILE_BYTES,
      Math.max(file.byteLength + 1, 64 * 1024),
    ),
  };
}

async function boundedRequest(
  dependencies: PrivateHostVerifierDependencies,
  request: PrivateVerifierRequest,
  context: VerificationContext,
  deadline: number,
): Promise<PrivateVerifierObservation> {
  const remaining = deadline - Date.now();
  if (remaining <= 0) fail("transport-failed", context);
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      Promise.resolve(dependencies.request(request)),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () =>
            reject(new PrivateHostVerifierError("transport-failed", context)),
          Math.min(REQUEST_TIMEOUT_MS + 1_000, remaining),
        );
        timeout.unref();
      }),
    ]);
  } catch {
    return fail("transport-failed", context);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

async function observeUnauthorizedScenario(
  dependencies: PrivateHostVerifierDependencies,
  file: ArtifactFile,
  scenario: (typeof UNAUTHORIZED_SCENARIOS)[number],
  goodAuthorization: string,
  wrongAuthorization: string,
  deadline: number,
): Promise<UnauthorizedResponse> {
  const context = { path: file.requestPath, scenario };
  const ask = (
    clientId: string,
    authorization: string | undefined,
    reuseConnection: boolean,
  ) =>
    boundedRequest(
      dependencies,
      requestContext(file, clientId, authorization, reuseConnection),
      context,
      deadline,
    );

  if (scenario === "warm-missing-auth") {
    const clientId = `${scenario}:${file.requestPath}`;
    verifyUnauthorizedObservation(
      await ask(clientId, undefined, true),
      file,
      scenario,
    );
    return verifyUnauthorizedObservation(
      await ask(clientId, undefined, true),
      file,
      scenario,
    );
  }
  if (scenario === "credential-removed-new-client") {
    const warmClient = `credential-removed-session:${file.requestPath}`;
    verifyAuthorizedObservation(
      await ask(warmClient, goodAuthorization, true),
      file,
      context,
    );
    verifyUnauthorizedObservation(
      await ask(warmClient, undefined, true),
      file,
      scenario,
    );
    return verifyUnauthorizedObservation(
      await ask(`${scenario}:${file.requestPath}`, undefined, false),
      file,
      scenario,
    );
  }
  const authorization =
    scenario === "malformed-auth"
      ? "Basic !!!"
      : scenario === "wrong-auth"
        ? wrongAuthorization
        : undefined;
  return verifyUnauthorizedObservation(
    await ask(`${scenario}:${file.requestPath}`, authorization, false),
    file,
    scenario,
  );
}

function sortUnauthorized(
  responses: UnauthorizedResponse[],
): UnauthorizedResponse[] {
  return responses.sort((left, right) =>
    compareCodePoints(
      `${left.requestPath}\0${left.scenario}`,
      `${right.requestPath}\0${right.scenario}`,
    ),
  );
}

/**
 * Dependency-injected complete verifier. Unit tests use temp artifacts and
 * temp HTTP servers; the CLI supplies only the fixed production dependencies.
 */
export async function verifyPrivateReviewWithDependencies(
  dependencies: PrivateHostVerifierDependencies,
): Promise<PrivateHostVerifierResult> {
  let root: string;
  try {
    root = realpathSync.native(resolve(dependencies.root ?? process.cwd()));
  } catch {
    return fail("artifact-invalid");
  }
  let snapshot: LoadedPrivateReviewSnapshot;
  try {
    snapshot = await loadPrivateReviewSnapshot({
      root,
      // A live receipt may itself make the worktree dirty. The loader still
      // performs strict manifest, coverage, no-follow, header, review-set, and
      // byte checks; source reconstruction was already enforced before listen.
      validateArtifactManifestSnapshot: () => undefined,
    });
  } catch {
    return fail("artifact-invalid");
  }
  const deadline = Date.now() + COMPLETE_RUN_TIMEOUT_MS;
  let before: PrivateNetworkInspection;
  try {
    before = await dependencies.inspectNetwork();
    validatePrivateNetworkInspection(before, root);
  } catch (error) {
    if (error instanceof PrivateHostVerifierError) throw error;
    return fail("network-invalid");
  }
  let credential: PrivateVerifierCredential;
  try {
    credential = assertCredential(await dependencies.readCredential());
  } catch (error) {
    if (error instanceof PrivateHostVerifierError) throw error;
    return fail("credential-invalid");
  }
  const goodAuthorization = basicAuthorization(
    credential.username,
    credential.password,
  );
  const wrongAuthorization = basicAuthorization(
    credential.username,
    "wrong-private-review-password",
  );

  const authorizedResponses: AuthorizedResponse[] = [];
  const unauthorizedResponses: UnauthorizedResponse[] = [];
  try {
    const files = [...snapshot.manifest.files].sort((left, right) =>
      compareCodePoints(left.requestPath, right.requestPath),
    );
    for (const file of files) {
      for (const scenario of UNAUTHORIZED_SCENARIOS) {
        unauthorizedResponses.push(
          await observeUnauthorizedScenario(
            dependencies,
            file,
            scenario,
            goodAuthorization,
            wrongAuthorization,
            deadline,
          ),
        );
      }
    }
    for (const file of files) {
      const observation = await boundedRequest(
        dependencies,
        requestContext(
          file,
          `authorized:${file.requestPath}`,
          goodAuthorization,
          false,
        ),
        { path: file.requestPath },
        deadline,
      );
      authorizedResponses.push(verifyAuthorizedObservation(observation, file));
      if (file.requestPath === "/review/review-set.json") {
        const local = snapshot.entries.get(file.requestPath);
        if (
          local === undefined ||
          !observation.body.equals(local.bytes) ||
          sha256Hex(observation.body) !==
            snapshot.manifest.reviewSetResponseSha256
        ) {
          fail("byte-mismatch", { path: file.requestPath });
        }
      }
    }
  } finally {
    try {
      await dependencies.closeRequests?.();
    } catch {
      // Transport disposal is non-evidentiary; all request observations have
      // already completed or the verifier is already failing closed.
    }
  }

  let after: PrivateNetworkInspection;
  try {
    after = await dependencies.inspectNetwork();
    validatePrivateNetworkInspection(after, root);
  } catch (error) {
    if (error instanceof PrivateHostVerifierError) throw error;
    return fail("network-invalid");
  }
  if (networkIdentity(before) !== networkIdentity(after)) {
    fail("network-changed");
  }

  authorizedResponses.sort((left, right) =>
    compareCodePoints(left.requestPath, right.requestPath),
  );
  sortUnauthorized(unauthorizedResponses);
  const receipt: ServedArtifactReceipt = {
    schemaVersion: 1,
    receiptType: "served-private-review",
    privateDistManifestDigest: snapshot.manifestDigest,
    reviewSetResponseSha256: snapshot.manifest.reviewSetResponseSha256,
    privateOriginHash: sha256Hex(PRIVATE_REVIEW_ORIGIN),
    deploymentIdHash: deploymentIdHash(snapshot, before),
    checkedAt: utcSeconds((dependencies.now ?? (() => new Date()))()),
    requestMethod: "GET",
    authenticationMethod: "http-basic-scrypt-keychain-v1",
    bodyComparisonMethod: "decoded-sha256-exact",
    redirectMode: "manual",
    verifiedBy: {
      authorizationDecisionDigest: G4_AUTHORIZATION_DECISION_SHA256,
      authorizedBy: "吳易澄醫師",
      role: "atlas-private-hosting-and-review",
      executionScopeId: "g4-local-mini-tailscale-private-hosting-only",
      planPath: G4_PLAN_PATH,
      planSha256: G4_PLAN_SHA256,
    },
    manifestPathCount: snapshot.manifest.files.length,
    authorizedCheckCount: authorizedResponses.length,
    unauthorizedScenarioCount: UNAUTHORIZED_SCENARIOS.length,
    unauthorizedPathCount: snapshot.manifest.files.length,
    unauthorizedCheckCount: unauthorizedResponses.length,
    mismatchCounts: {
      access: 0,
      byte: 0,
      cache: 0,
      header: 0,
      identity: 0,
      leak: 0,
      metadata: 0,
      redirect: 0,
    },
    authorizedResponses,
    authorizedMetadataDigest:
      computeAuthorizedMetadataDigest(authorizedResponses),
    unauthorizedResponses,
    unauthorizedMetadataDigest: computeUnauthorizedMetadataDigest(
      unauthorizedResponses,
    ),
  };
  if (
    validateServedArtifactReceipt(
      receipt,
      snapshot.manifest,
      snapshot.manifestDigest,
    ).length > 0
  ) {
    fail("receipt-invalid");
  }
  const receiptBytes = canonicalJson(receipt);
  const parsedReceipt = parseServedArtifactReceiptBytes(receiptBytes);
  if (parsedReceipt.receipt === null || parsedReceipt.issues.length > 0) {
    fail("receipt-invalid");
  }
  const forbiddenValues = [
    PRIVATE_REVIEW_ORIGIN,
    credential.username,
    credential.password,
    goodAuthorization,
    before.listener.cwd,
    before.listener.executable,
    before.listener.processCommand,
    before.listener.launchdCwd,
    before.listener.launchdExecutable,
    before.listener.launchdProcessCommand,
  ];
  if (
    forbiddenValues.some(
      (value) => value !== "" && receiptBytes.includes(value),
    )
  ) {
    fail("receipt-sensitive");
  }
  try {
    await dependencies.writeReceipt(
      join(root, SERVED_REVIEW_RECEIPT_PATH),
      receiptBytes,
    );
  } catch {
    return fail("receipt-write-failed");
  }
  return {
    receipt,
    receiptBytes,
    receiptDigest: computeServedArtifactReceiptDigest(receipt),
  };
}

export interface NodeHttpTransport {
  request: (
    request: PrivateVerifierRequest,
  ) => Promise<PrivateVerifierObservation>;
  close: () => void;
}

/** Production HTTP transport; Node never follows redirects or decompresses bodies. */
export function createNodeHttpTransport(): NodeHttpTransport {
  const agents = new Map<string, Agent>();
  const transport = async (
    request: PrivateVerifierRequest,
  ): Promise<PrivateVerifierObservation> => {
    let origin: URL;
    try {
      origin = new URL(request.origin);
    } catch {
      return fail("transport-failed", {
        path: request.requestPath,
      });
    }
    if (
      origin.protocol !== "http:" ||
      origin.username !== "" ||
      origin.password !== "" ||
      origin.pathname !== "/" ||
      origin.search !== "" ||
      origin.hash !== "" ||
      !request.requestPath.startsWith("/") ||
      request.method !== "GET" ||
      request.acceptEncoding !== "identity" ||
      request.redirect !== "manual" ||
      !Number.isSafeInteger(request.maxBodyBytes) ||
      request.maxBodyBytes < 0 ||
      request.maxBodyBytes > PRIVATE_REVIEW_MAX_FILE_BYTES
    ) {
      return fail("transport-failed", { path: request.requestPath });
    }
    let agent: Agent | false;
    if (request.reuseConnection) {
      const existing = agents.get(request.clientId);
      if (existing !== undefined) agent = existing;
      else {
        agent = new Agent({
          keepAlive: true,
          maxSockets: 1,
          maxFreeSockets: 1,
        });
        agents.set(request.clientId, agent);
      }
    } else {
      agent = false;
    }
    const options: RequestOptions = {
      protocol: "http:",
      hostname: origin.hostname,
      port: origin.port === "" ? 80 : Number(origin.port),
      method: "GET",
      path: request.requestPath,
      agent,
      headers: {
        "Accept-Encoding": "identity",
        ...(request.authorization === undefined
          ? {}
          : { Authorization: request.authorization }),
      },
      setHost: true,
    };
    return new Promise<PrivateVerifierObservation>(
      (resolvePromise, rejectPromise) => {
        let settled = false;
        const rejectSanitized = (): void => {
          if (settled) return;
          settled = true;
          rejectPromise(
            new PrivateHostVerifierError("transport-failed", {
              path: request.requestPath,
            }),
          );
        };
        let outgoing: ClientRequest;
        try {
          outgoing = httpRequest(options, (response) => {
            const chunks: Buffer[] = [];
            let length = 0;
            response.on("data", (chunk: Buffer | string) => {
              if (settled) return;
              const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
              length += bytes.byteLength;
              if (length > request.maxBodyBytes) {
                response.destroy();
                outgoing.destroy();
                rejectSanitized();
                return;
              }
              chunks.push(Buffer.from(bytes));
            });
            response.once("aborted", rejectSanitized);
            response.once("error", rejectSanitized);
            response.once("end", () => {
              if (settled) return;
              settled = true;
              resolvePromise({
                status: response.statusCode ?? 0,
                rawHeaders: [...response.rawHeaders],
                body: Buffer.concat(chunks, length),
                redirected: false,
              });
            });
          });
        } catch {
          rejectSanitized();
          return;
        }
        outgoing.once("error", rejectSanitized);
        outgoing.setTimeout(REQUEST_TIMEOUT_MS, () => {
          outgoing.destroy();
          rejectSanitized();
        });
        outgoing.end();
      },
    );
  };
  return {
    request: transport,
    close: () => {
      for (const agent of agents.values()) agent.destroy();
      agents.clear();
    },
  };
}

export interface PrivateReadOnlyCommandResult {
  status: number;
  stdout: Buffer;
}

export interface PrivateReadOnlyCommandOptions {
  maxBuffer?: number;
  acceptedStatuses?: readonly number[];
}

export type PrivateReadOnlyCommandRunner = (
  executable: string,
  args: readonly string[],
  options?: PrivateReadOnlyCommandOptions,
) => PrivateReadOnlyCommandResult;

function runReadOnlyCommand(
  executable: string,
  args: readonly string[],
  options: PrivateReadOnlyCommandOptions = {},
): PrivateReadOnlyCommandResult {
  const result = spawnSync(executable, [...args], {
    encoding: "buffer",
    stdio: ["ignore", "pipe", "ignore"],
    timeout: 8_000,
    killSignal: "SIGKILL",
    maxBuffer: options.maxBuffer ?? 8 * 1024 * 1024,
  });
  const status = result.status;
  if (
    result.error !== undefined ||
    result.signal !== null ||
    status === null ||
    !(options.acceptedStatuses ?? [0]).includes(status) ||
    !Buffer.isBuffer(result.stdout)
  ) {
    fail("network-invalid");
  }
  return { status, stdout: Buffer.from(result.stdout) };
}

function oneTrimmedLine(bytes: Buffer): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return fail("network-invalid");
  }
  const value = text.trim();
  if (value === "" || value.includes("\n") || value.includes("\r")) {
    fail("network-invalid");
  }
  return value;
}

interface LsofListenerRow {
  pid: number;
  uid: number;
  command: string;
  name: string;
}

function parseLsofListeners(bytes: Buffer): LsofListenerRow[] {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return fail("network-invalid");
  }
  const rows: LsofListenerRow[] = [];
  let process: { pid: number; uid: number; command: string } | null = null;
  for (const line of text.split("\n")) {
    if (line === "") continue;
    const field = line[0];
    const value = line.slice(1);
    if (field === "p") {
      const pid = Number(value);
      if (!Number.isSafeInteger(pid) || pid <= 0) fail("network-invalid");
      process = { pid, uid: -1, command: "" };
    } else if (field === "u" && process !== null) {
      process.uid = Number(value);
    } else if (field === "c" && process !== null) {
      process.command = value;
    } else if (field === "n" && process !== null) {
      rows.push({ ...process, name: value });
    }
  }
  if (
    rows.some(
      (row) =>
        !Number.isSafeInteger(row.uid) || row.uid <= 0 || row.command === "",
    )
  ) {
    fail("network-invalid");
  }
  return rows;
}

function lsofCwd(
  pid: number,
  runCommand: PrivateReadOnlyCommandRunner,
): string {
  const result = runCommand(LSOF_PATH, [
    "-nP",
    "-a",
    "-p",
    String(pid),
    "-d",
    "cwd",
    "-Fn",
  ]);
  let names: string[];
  try {
    names = new TextDecoder("utf-8", { fatal: true })
      .decode(result.stdout)
      .split("\n")
      .filter((line) => line.startsWith("n"))
      .map((line) => line.slice(1));
  } catch {
    return fail("network-invalid");
  }
  if (names.length !== 1) fail("network-invalid");
  try {
    return realpathSync.native(names[0]!);
  } catch {
    return fail("network-invalid");
  }
}

interface ProcessInspection {
  pid: number;
  parentPid: number;
  uid: number;
  cwd: string;
  executable: string;
  command: string;
}

function positiveProcessNumber(value: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    fail("network-invalid");
  }
  return parsed;
}

function inspectProcess(
  pid: number,
  runCommand: PrivateReadOnlyCommandRunner,
): ProcessInspection {
  const executableValue = oneTrimmedLine(
    runCommand(PS_PATH, ["-ww", "-p", String(pid), "-o", "comm="]).stdout,
  );
  let executable: string;
  try {
    executable = realpathSync.native(executableValue);
  } catch {
    return fail("network-invalid");
  }
  return {
    pid,
    parentPid: positiveProcessNumber(
      oneTrimmedLine(
        runCommand(PS_PATH, ["-ww", "-p", String(pid), "-o", "ppid="]).stdout,
      ),
    ),
    uid: positiveProcessNumber(
      oneTrimmedLine(
        runCommand(PS_PATH, ["-ww", "-p", String(pid), "-o", "uid="]).stdout,
      ),
    ),
    cwd: lsofCwd(pid, runCommand),
    executable,
    command: oneTrimmedLine(
      runCommand(PS_PATH, ["-ww", "-p", String(pid), "-o", "command="]).stdout,
    ),
  };
}

function parseLaunchdPid(
  uid: number,
  runCommand: PrivateReadOnlyCommandRunner,
): number {
  const result = runCommand(LAUNCHCTL_PATH, [
    "print",
    `gui/${uid}/${PRIVATE_REVIEW_LAUNCHD_LABEL}`,
  ]);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(result.stdout);
  const matches = [...text.matchAll(/^\s*pid = (\d+)\s*$/gmu)];
  if (matches.length !== 1) fail("network-invalid");
  const pid = Number(matches[0]![1]);
  if (!Number.isSafeInteger(pid) || pid <= 0) fail("network-invalid");
  return pid;
}

export interface PrivateListenerInspectionDependencies {
  runCommand?: PrivateReadOnlyCommandRunner;
  uid?: number;
  nodeExecutable?: string;
  nodeVersion?: string;
  lanAddresses?: () => string[];
}

export function inspectPrivateListenerWithDependencies(
  dependencies: PrivateListenerInspectionDependencies = {},
): PrivateListenerInspection {
  const runCommand = dependencies.runCommand ?? runReadOnlyCommand;
  const result = runCommand(
    LSOF_PATH,
    ["-nP", "-a", "-iTCP:8140", "-sTCP:LISTEN", "-Fpcun"],
    { acceptedStatuses: [0, 1] },
  );
  const rows = result.status === 1 ? [] : parseLsofListeners(result.stdout);
  const names = rows.map((row) => row.name);
  if (rows.length !== 1) {
    return {
      count: rows.length,
      host: "",
      port: PRIVATE_REVIEW_PORT,
      transport: "invalid",
      pid: 0,
      parentPid: 0,
      uid: 0,
      cwd: "",
      executable: "",
      processCommand: "",
      launchdLabel: PRIVATE_REVIEW_LAUNCHD_LABEL,
      launchdPid: 0,
      launchdUid: 0,
      launchdCwd: "",
      launchdExecutable: "",
      launchdProcessCommand: "",
      runtimeNodeVersion: "",
      wildcardListenerObserved: names.some((name) => name.startsWith("*:")),
      loopbackListenerObserved: names.some((name) => name.startsWith("127.")),
      lanListenerObserved: false,
      ipv6ListenerObserved: names.some(
        (name) =>
          name.startsWith("[::]") ||
          (name.startsWith("*:") && name.includes("IPv6")),
      ),
      legacyListenerObserved: rows.some((row) => /python/iu.test(row.command)),
    };
  }
  const row = rows[0]!;
  const expectedName = `${PRIVATE_REVIEW_TAILSCALE_IPV4}:${PRIVATE_REVIEW_PORT}`;
  const uid = dependencies.uid ?? process.getuid?.();
  if (!Number.isSafeInteger(uid) || (uid as number) <= 0) {
    return fail("network-invalid");
  }
  let trustedNodeExecutable: string;
  try {
    trustedNodeExecutable = realpathSync.native(
      dependencies.nodeExecutable ?? process.execPath,
    );
  } catch {
    return fail("network-invalid");
  }
  const listenerProcess = inspectProcess(row.pid, runCommand);
  const launchdPid = parseLaunchdPid(uid as number, runCommand);
  const launchdProcess = inspectProcess(launchdPid, runCommand);
  if (
    row.uid !== listenerProcess.uid ||
    listenerProcess.executable !== trustedNodeExecutable ||
    launchdProcess.executable !== trustedNodeExecutable
  ) {
    fail("network-invalid");
  }
  const lanAddresses = (dependencies.lanAddresses ?? currentLanAddresses)();
  const confirmedResult = runCommand(
    LSOF_PATH,
    ["-nP", "-a", "-iTCP:8140", "-sTCP:LISTEN", "-Fpcun"],
    { acceptedStatuses: [0, 1] },
  );
  const confirmedRows =
    confirmedResult.status === 1
      ? []
      : parseLsofListeners(confirmedResult.stdout);
  if (
    confirmedRows.length !== 1 ||
    canonicalJson(confirmedRows[0]) !== canonicalJson(row) ||
    parseLaunchdPid(uid as number, runCommand) !== launchdPid
  ) {
    fail("network-invalid");
  }
  const confirmedListenerProcess = inspectProcess(row.pid, runCommand);
  const confirmedLaunchdProcess = inspectProcess(launchdPid, runCommand);
  if (
    canonicalJson(confirmedListenerProcess) !==
      canonicalJson(listenerProcess) ||
    canonicalJson(confirmedLaunchdProcess) !== canonicalJson(launchdProcess)
  ) {
    fail("network-invalid");
  }
  return {
    count: 1,
    host: row.name === expectedName ? PRIVATE_REVIEW_TAILSCALE_IPV4 : "",
    port: PRIVATE_REVIEW_PORT,
    transport: row.name === expectedName ? "tcp4" : "invalid",
    pid: row.pid,
    parentPid: listenerProcess.parentPid,
    uid: listenerProcess.uid,
    cwd: listenerProcess.cwd,
    executable: listenerProcess.executable,
    processCommand: listenerProcess.command,
    launchdLabel: PRIVATE_REVIEW_LAUNCHD_LABEL,
    launchdPid,
    launchdUid: launchdProcess.uid,
    launchdCwd: launchdProcess.cwd,
    launchdExecutable: launchdProcess.executable,
    launchdProcessCommand: launchdProcess.command,
    runtimeNodeVersion: dependencies.nodeVersion ?? process.versions.node,
    wildcardListenerObserved:
      row.name.startsWith("*:") || row.name.startsWith("0.0.0.0:"),
    loopbackListenerObserved: row.name.startsWith("127."),
    lanListenerObserved: lanAddresses.some((address) =>
      row.name.startsWith(`${address}:`),
    ),
    ipv6ListenerObserved: row.name.startsWith("[") || row.name.startsWith("::"),
    legacyListenerObserved:
      /python/iu.test(row.command) ||
      listenerProcess.command.includes(" -m http.server 8140 "),
  };
}

function currentLanAddresses(): string[] {
  return selectCurrentLanAddresses(networkInterfaces());
}

export function selectCurrentLanAddresses(
  interfaces: ReturnType<typeof networkInterfaces>,
): string[] {
  const lanInterfaces = new Set(
    Object.entries(interfaces)
      .filter(([, values]) =>
        (values ?? []).some(
          (value) =>
            value.family === "IPv4" &&
            !value.internal &&
            value.address !== PRIVATE_REVIEW_TAILSCALE_IPV4 &&
            value.address !== "0.0.0.0",
        ),
      )
      .map(([interfaceName]) => interfaceName),
  );
  const addresses: string[] = [];
  for (const [interfaceName, values] of Object.entries(interfaces)) {
    if (!lanInterfaces.has(interfaceName)) continue;
    for (const value of values ?? []) {
      if (
        !value.internal &&
        value.address !== PRIVATE_REVIEW_TAILSCALE_IPV4 &&
        value.address !== "0.0.0.0" &&
        value.address !== "::"
      ) {
        addresses.push(
          value.family === "IPv6" && value.address.startsWith("fe80:")
            ? `${value.address}%${interfaceName}`
            : value.address,
        );
      }
    }
  }
  return sortedStrings([...new Set(addresses)]);
}

function parseTailscaleState(bytes: Buffer): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = parseStrictJson(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
  } catch {
    return fail("network-invalid");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail("network-invalid");
  }
  return parsed as Record<string, unknown>;
}

function endpointUsesPrivateReviewPort(value: string): boolean {
  if (/^[0-9]+$/u.test(value)) {
    return Number(value) === PRIVATE_REVIEW_PORT;
  }
  try {
    const parsed = new URL(value.includes("://") ? value : `https://${value}`);
    return parsed.port === String(PRIVATE_REVIEW_PORT);
  } catch {
    return false;
  }
}

function tailscaleStateHasAtlasHandler(
  value: Record<string, unknown>,
  governedRoot?: string,
): boolean {
  const governedRepositoryName =
    governedRoot === undefined ? undefined : governedRoot.split("/").at(-1);
  const governedIdentifiers = new Set([
    "tw.sportsmedicine.atlas.private-review",
    PRIVATE_REVIEW_LAUNCHD_LABEL,
    ...(governedRepositoryName === undefined
      ? []
      : [governedRepositoryName, `svc:${governedRepositoryName}`]),
  ]);
  const pending: unknown[] = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (typeof current === "string") {
      if (
        governedIdentifiers.has(current) ||
        (current.includes("://") && endpointUsesPrivateReviewPort(current))
      ) {
        return true;
      }
      continue;
    }
    if (Array.isArray(current)) {
      pending.push(...current);
      continue;
    }
    if (current !== null && typeof current === "object") {
      const record = current as Record<string, unknown>;
      for (const field of ["TCP", "Web", "AllowFunnel"] as const) {
        const endpoints = record[field];
        if (endpoints === undefined) continue;
        if (
          endpoints === null ||
          typeof endpoints !== "object" ||
          Array.isArray(endpoints)
        ) {
          fail("network-invalid");
        }
        if (
          Object.keys(endpoints as Record<string, unknown>).some(
            endpointUsesPrivateReviewPort,
          )
        ) {
          return true;
        }
      }
      for (const [key, child] of Object.entries(record)) {
        if (governedIdentifiers.has(key)) return true;
        if (
          typeof child === "string" &&
          (key === "Proxy" || key === "TCPForward") &&
          endpointUsesPrivateReviewPort(child)
        ) {
          return true;
        }
        if (
          key === "Path" &&
          typeof child === "string" &&
          governedRoot !== undefined
        ) {
          if (!isAbsolute(child)) fail("network-invalid");
          let canonicalPath: string;
          try {
            canonicalPath = realpathSync.native(child);
          } catch {
            return fail("network-invalid");
          }
          if (
            canonicalPath === governedRoot ||
            canonicalPath.startsWith(
              governedRoot.endsWith(sep)
                ? governedRoot
                : `${governedRoot}${sep}`,
            ) ||
            governedRoot.startsWith(
              canonicalPath.endsWith(sep)
                ? canonicalPath
                : `${canonicalPath}${sep}`,
            )
          ) {
            return true;
          }
        }
        pending.push(child);
      }
    }
  }
  return false;
}

export function inspectTailscaleServiceStateBytes(
  bytes: Uint8Array,
  governedRoot?: string,
): { digest: string; atlasPortExposed: boolean } {
  const state = parseTailscaleState(Buffer.from(bytes));
  return {
    digest: sha256Hex(canonicalJson(state)),
    atlasPortExposed: tailscaleStateHasAtlasHandler(state, governedRoot),
  };
}

export function inspectTailscaleIdentityStateBytes(bytes: Uint8Array): {
  backendState: string;
  selfOnline: boolean;
  selfDnsName: string;
  selfTailscaleIPs: string[];
  identityDigest: string;
} {
  const parsed = parseTailscaleState(Buffer.from(bytes));
  if (
    parsed.Self === null ||
    typeof parsed.Self !== "object" ||
    Array.isArray(parsed.Self)
  ) {
    fail("network-invalid");
  }
  const self = parsed.Self as Record<string, unknown>;
  if (
    typeof parsed.BackendState !== "string" ||
    typeof self.Online !== "boolean" ||
    typeof self.DNSName !== "string" ||
    !Array.isArray(self.TailscaleIPs) ||
    self.TailscaleIPs.some((value) => typeof value !== "string")
  ) {
    fail("network-invalid");
  }
  const selfTailscaleIPs = sortedStrings(self.TailscaleIPs as string[]);
  const identity = {
    backendState: parsed.BackendState,
    selfOnline: self.Online,
    selfDnsName: self.DNSName,
    selfTailscaleIPs,
  };
  return {
    ...identity,
    identityDigest: sha256Hex(canonicalJson(identity)),
  };
}

function inspectTailscale(root: string): PrivateTailscaleInspection {
  const statusBytes = runReadOnlyCommand(TAILSCALE_CLI_PATH, [
    "status",
    "--json",
  ]).stdout;
  const identity = inspectTailscaleIdentityStateBytes(statusBytes);
  const serveBytes = runReadOnlyCommand(TAILSCALE_CLI_PATH, [
    "serve",
    "status",
    "--json",
  ]).stdout;
  const funnelBytes = runReadOnlyCommand(TAILSCALE_CLI_PATH, [
    "funnel",
    "status",
    "--json",
  ]).stdout;
  const serveState = inspectTailscaleServiceStateBytes(serveBytes, root);
  const funnelState = inspectTailscaleServiceStateBytes(funnelBytes, root);
  return {
    ...identity,
    serveStateDigest: serveState.digest,
    funnelStateDigest: funnelState.digest,
    serveAtlasPortExposed: serveState.atlasPortExposed,
    funnelAtlasPortExposed: funnelState.atlasPortExposed,
  };
}

function probeSecondaryOrigin(
  kind: "loopback" | "lan",
  address: string,
): Promise<SecondaryOriginInspection> {
  return new Promise((resolvePromise) => {
    let settled = false;
    const finish = (result: SecondaryOriginInspection): void => {
      if (settled) return;
      settled = true;
      resolvePromise(result);
    };
    let request: ClientRequest;
    try {
      request = httpRequest(
        {
          hostname: address,
          port: PRIVATE_REVIEW_PORT,
          method: "GET",
          path: "/",
          agent: false,
          headers: { "Accept-Encoding": "identity" },
        },
        (response) => {
          const status = response.statusCode ?? 0;
          response.destroy();
          finish({ kind, address, result: "responded", status });
        },
      );
    } catch {
      finish({ kind, address, result: "inconclusive", status: null });
      return;
    }
    request.once("error", (error: NodeJS.ErrnoException) => {
      finish({
        kind,
        address,
        result: error.code === "ECONNREFUSED" ? "refused" : "inconclusive",
        status: null,
      });
    });
    request.setTimeout(2_000, () => {
      request.destroy();
      finish({ kind, address, result: "inconclusive", status: null });
    });
    request.end();
  });
}

/** Read-only listener, secondary-origin, and Tailscale inspection. */
export async function inspectProductionPrivateNetwork(
  root = process.cwd(),
): Promise<PrivateNetworkInspection> {
  let realRoot: string;
  try {
    realRoot = realpathSync.native(resolve(root));
  } catch {
    return fail("network-invalid");
  }
  const listener = inspectPrivateListenerWithDependencies();
  if (listener.count === 1 && listener.cwd !== realRoot) {
    fail("network-invalid");
  }
  const tailscale = inspectTailscale(realRoot);
  const lanAddresses = currentLanAddresses();
  const secondaryOrigins = await Promise.all([
    ...SECONDARY_LOOPBACK_ADDRESSES.map((address) =>
      probeSecondaryOrigin("loopback", address),
    ),
    ...lanAddresses.map((address) => probeSecondaryOrigin("lan", address)),
  ]);
  secondaryOrigins.sort((left, right) =>
    compareCodePoints(
      `${left.kind}\0${left.address}`,
      `${right.kind}\0${right.address}`,
    ),
  );
  return {
    listener,
    tailscale,
    secondaryOrigins,
    loopbackProbeCompleted: SECONDARY_LOOPBACK_ADDRESSES.every((address) =>
      secondaryOrigins.some(
        (probe) => probe.kind === "loopback" && probe.address === address,
      ),
    ),
    lanAddresses,
    wildcardInspectionCompleted: true,
    legacyInspectionCompleted: true,
  };
}

export interface LocalCredentialReadOptions {
  expectedPath: string;
  uid?: number;
  /** Test-only race hook; production never supplies it. */
  beforeOpen?: () => void;
  /** Test-only race hook; production never supplies it. */
  afterOpen?: () => void;
  /** Test-only race hook; production never supplies it. */
  afterRead?: () => void;
}

function validCredentialStat(stat: Stats, uid: number): boolean {
  return (
    stat.isFile() &&
    !stat.isSymbolicLink() &&
    stat.nlink === 1 &&
    stat.uid === uid &&
    (stat.mode & 0o777) === 0o600 &&
    stat.size > 0 &&
    stat.size <= 4_096
  );
}

function sameStableFile(left: Stats, right: Stats): boolean {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.uid === right.uid &&
    left.nlink === right.nlink &&
    left.mode === right.mode &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs &&
    left.ctimeMs === right.ctimeMs
  );
}

function validCredentialParent(stat: Stats, uid: number): boolean {
  return (
    !stat.isSymbolicLink() &&
    stat.isDirectory() &&
    stat.uid === uid &&
    (stat.mode & 0o022) === 0
  );
}

/** Symlink/hardlink/ownership/mode/TOCTOU-safe credential file reader. */
export function readCredentialFromPrivateFile(
  path: string,
  options: LocalCredentialReadOptions,
): PrivateVerifierCredential {
  if (
    !isAbsolute(path) ||
    !isAbsolute(options.expectedPath) ||
    resolve(path) !== resolve(options.expectedPath)
  ) {
    fail("credential-invalid");
  }
  const parent = dirname(resolve(path));
  const uid = options.uid ?? process.getuid?.();
  if (uid === undefined || !Number.isSafeInteger(uid) || uid <= 0) {
    fail("credential-invalid");
  }
  let parentStat: Stats;
  try {
    parentStat = lstatSync(parent);
    if (
      !validCredentialParent(parentStat, uid) ||
      realpathSync.native(parent) !== parent
    ) {
      fail("credential-invalid");
    }
  } catch (error) {
    if (error instanceof PrivateHostVerifierError) throw error;
    return fail("credential-invalid");
  }
  let stat: Stats;
  try {
    stat = lstatSync(path);
  } catch {
    return fail("credential-invalid");
  }
  if (!validCredentialStat(stat, uid)) {
    fail("credential-invalid");
  }
  try {
    options.beforeOpen?.();
  } catch {
    return fail("credential-invalid");
  }
  let descriptor: number;
  try {
    descriptor = openSync(
      path,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
  } catch {
    return fail("credential-invalid");
  }
  try {
    try {
      options.afterOpen?.();
    } catch {
      return fail("credential-invalid");
    }
    const opened = fstatSync(descriptor);
    if (!validCredentialStat(opened, uid) || !sameStableFile(opened, stat)) {
      fail("credential-invalid");
    }
    const bytes = readFileSync(descriptor);
    try {
      options.afterRead?.();
    } catch {
      return fail("credential-invalid");
    }
    const after = fstatSync(descriptor);
    const finalPath = lstatSync(path);
    const finalParent = lstatSync(parent);
    if (
      !validCredentialStat(after, uid) ||
      !sameStableFile(after, opened) ||
      !validCredentialStat(finalPath, uid) ||
      !sameStableFile(finalPath, after) ||
      !validCredentialParent(finalParent, uid) ||
      finalParent.dev !== parentStat.dev ||
      finalParent.ino !== parentStat.ino ||
      finalParent.uid !== parentStat.uid ||
      finalParent.mode !== parentStat.mode ||
      realpathSync.native(parent) !== parent
    ) {
      fail("credential-invalid");
    }
    try {
      const access = parseReviewAccessInfoBytes(bytes);
      if (
        access.origin !== PRIVATE_REVIEW_ORIGIN ||
        access.username !== PRIVATE_REVIEW_USERNAME
      ) {
        return fail("credential-invalid");
      }
      return assertCredential({
        username: access.username,
        password: access.password,
      });
    } catch (error) {
      if (error instanceof PrivateHostVerifierError) throw error;
      return fail("credential-invalid");
    }
  } catch (error) {
    if (error instanceof PrivateHostVerifierError) throw error;
    return fail("credential-invalid");
  } finally {
    try {
      closeSync(descriptor);
    } catch {
      fail("credential-invalid");
    }
  }
}

/** Fixed local-file credential source used by bounded automation only. */
export function readFixedLocalCredential(): PrivateVerifierCredential {
  return readCredentialFromPrivateFile(REVIEW_ACCESS_INFO_PATH, {
    expectedPath: REVIEW_ACCESS_INFO_PATH,
  });
}

export interface CredentialTtyPort {
  setEcho(enabled: boolean): void;
  write(message: string): void;
  readByte(): number | null;
  close(): void;
}

class DeviceCredentialTtyPort implements CredentialTtyPort {
  private readonly descriptor: number;

  constructor() {
    const ttyPath = "/dev/tty";
    const stat = lstatSync(ttyPath);
    if (stat.isSymbolicLink() || !stat.isCharacterDevice()) {
      fail("credential-invalid");
    }
    this.descriptor = openSync(
      ttyPath,
      constants.O_RDWR | constants.O_NOFOLLOW,
    );
    if (!fstatSync(this.descriptor).isCharacterDevice()) {
      closeSync(this.descriptor);
      fail("credential-invalid");
    }
  }

  setEcho(enabled: boolean): void {
    const result = spawnSync(STTY_PATH, [enabled ? "echo" : "-echo"], {
      stdio: [this.descriptor, this.descriptor, this.descriptor],
      timeout: 5_000,
      killSignal: "SIGKILL",
    });
    if (
      result.error !== undefined ||
      result.signal !== null ||
      result.status !== 0
    ) {
      fail("credential-invalid");
    }
  }

  write(message: string): void {
    writeSync(this.descriptor, message, null, "utf8");
  }

  readByte(): number | null {
    const one = Buffer.alloc(1);
    return readSync(this.descriptor, one, 0, 1, null) === 1
      ? (one[0] as number)
      : null;
  }

  close(): void {
    closeSync(this.descriptor);
  }
}

/** DI-safe password read that always restores terminal echo before closing. */
export function readCredentialFromTtyPort(
  port: CredentialTtyPort,
): PrivateVerifierCredential {
  let echoAttempted = false;
  try {
    port.write("Private-review password: ");
    echoAttempted = true;
    port.setEcho(false);
    const bytes: number[] = [];
    while (bytes.length <= 128) {
      const byte = port.readByte();
      if (byte === null) fail("credential-invalid");
      if (byte === 0x0a) break;
      if (byte !== 0x0d) bytes.push(byte);
    }
    if (bytes.length > 128) fail("credential-invalid");
    return assertCredential({
      username: PRIVATE_REVIEW_USERNAME,
      password: Buffer.from(bytes).toString("utf8"),
    });
  } catch (error) {
    if (error instanceof PrivateHostVerifierError) throw error;
    return fail("credential-invalid");
  } finally {
    let cleanupFailed = false;
    try {
      if (echoAttempted) port.setEcho(true);
    } catch {
      cleanupFailed = true;
    }
    try {
      port.write("\n");
    } catch {
      cleanupFailed = true;
    }
    try {
      port.close();
    } catch {
      cleanupFailed = true;
    }
    if (cleanupFailed) fail("credential-invalid");
  }
}

/** Reads the password only from /dev/tty with terminal echo disabled. */
export function readCredentialFromTty(): PrivateVerifierCredential {
  let port: DeviceCredentialTtyPort;
  try {
    port = new DeviceCredentialTtyPort();
  } catch {
    return fail("credential-invalid");
  }
  return readCredentialFromTtyPort(port);
}

/** Atomic canonical receipt writer. Existing evidence is untouched until rename. */
export function writeCanonicalReceiptAtomic(
  targetPath: string,
  bytes: string | Uint8Array,
  root = process.cwd(),
): void {
  let realRoot: string;
  try {
    realRoot = realpathSync.native(resolve(root));
  } catch {
    return fail("receipt-write-failed");
  }
  const expectedTarget = join(realRoot, SERVED_REVIEW_RECEIPT_PATH);
  if (resolve(targetPath) !== expectedTarget) fail("receipt-write-failed");
  const text =
    typeof bytes === "string"
      ? bytes
      : new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const parsed = parseServedArtifactReceiptBytes(text);
  if (
    parsed.receipt === null ||
    parsed.issues.length > 0 ||
    canonicalJson(parsed.receipt) !== text
  ) {
    fail("receipt-write-failed");
  }
  const parent = dirname(expectedTarget);
  let realParent: string;
  let parentStat: Stats;
  const uid = process.getuid?.();
  if (uid === undefined || uid <= 0) fail("receipt-write-failed");
  try {
    parentStat = lstatSync(parent);
    if (
      parentStat.isSymbolicLink() ||
      !parentStat.isDirectory() ||
      parentStat.uid !== uid ||
      (parentStat.mode & 0o022) !== 0
    ) {
      fail("receipt-write-failed");
    }
    realParent = realpathSync.native(parent);
  } catch (error) {
    if (error instanceof PrivateHostVerifierError) throw error;
    return fail("receipt-write-failed");
  }
  if (realParent !== join(realRoot, "review")) fail("receipt-write-failed");
  if (existsSync(expectedTarget)) {
    const existing = lstatSync(expectedTarget);
    if (
      existing.isSymbolicLink() ||
      !existing.isFile() ||
      existing.nlink !== 1 ||
      existing.uid !== uid
    ) {
      fail("receipt-write-failed");
    }
  }
  let temporary = "";
  let descriptor: number | null = null;
  for (let attempt = 0; attempt < 32; attempt += 1) {
    temporary = join(
      realParent,
      `.served-review-receipt.${process.pid}.${attempt}.tmp`,
    );
    try {
      descriptor = openSync(
        temporary,
        constants.O_RDWR |
          constants.O_CREAT |
          constants.O_EXCL |
          constants.O_NOFOLLOW,
        0o644,
      );
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        return fail("receipt-write-failed");
      }
    }
  }
  if (descriptor === null) fail("receipt-write-failed");
  let installed = false;
  try {
    fchmodSync(descriptor, 0o644);
    const opened = fstatSync(descriptor);
    if (
      !opened.isFile() ||
      opened.nlink !== 1 ||
      opened.uid !== uid ||
      (opened.mode & 0o777) !== 0o644 ||
      opened.size !== 0
    ) {
      fail("receipt-write-failed");
    }
    writeFileSync(descriptor, text, "utf8");
    fsyncSync(descriptor);
    fchmodSync(descriptor, 0o644);
    const completed = fstatSync(descriptor);
    if (
      !completed.isFile() ||
      completed.nlink !== 1 ||
      completed.uid !== uid ||
      (completed.mode & 0o777) !== 0o644 ||
      completed.size !== Buffer.byteLength(text, "utf8")
    ) {
      fail("receipt-write-failed");
    }
    renameSync(temporary, expectedTarget);
    installed = true;
    const installedStat = lstatSync(expectedTarget);
    if (
      !installedStat.isFile() ||
      installedStat.isSymbolicLink() ||
      installedStat.dev !== completed.dev ||
      installedStat.ino !== completed.ino ||
      installedStat.uid !== uid ||
      installedStat.nlink !== 1 ||
      (installedStat.mode & 0o777) !== 0o644
    ) {
      fail("receipt-write-failed");
    }
    const parentDescriptor = openSync(realParent, constants.O_RDONLY);
    try {
      fsyncSync(parentDescriptor);
    } finally {
      closeSync(parentDescriptor);
    }
    const readback = readFileSync(expectedTarget);
    if (!readback.equals(Buffer.from(text, "utf8"))) {
      fail("receipt-write-failed");
    }
    const finalTarget = lstatSync(expectedTarget);
    const finalParent = lstatSync(realParent);
    if (
      finalTarget.dev !== installedStat.dev ||
      finalTarget.ino !== installedStat.ino ||
      finalTarget.uid !== installedStat.uid ||
      finalTarget.mode !== installedStat.mode ||
      finalTarget.nlink !== installedStat.nlink ||
      finalTarget.size !== installedStat.size ||
      finalParent.dev !== parentStat.dev ||
      finalParent.ino !== parentStat.ino ||
      finalParent.uid !== parentStat.uid ||
      finalParent.mode !== parentStat.mode
    ) {
      fail("receipt-write-failed");
    }
    closeSync(descriptor);
    descriptor = null;
  } catch (error) {
    if (error instanceof PrivateHostVerifierError) throw error;
    return fail("receipt-write-failed");
  } finally {
    if (descriptor !== null) closeSync(descriptor);
    if (!installed && temporary !== "" && existsSync(temporary)) {
      unlinkSync(temporary);
    }
  }
}

type CredentialSource = "tty" | "local-file";

export function verifierWorktreeStatusAllowsOnlyReceipt(
  bytes: Uint8Array,
): boolean {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return false;
  }
  if (text === "") return true;
  if (!text.endsWith("\0")) return false;
  const entries = text.slice(0, -1).split("\0");
  if (entries.length !== 1) return false;
  const entry = entries[0]!;
  if (
    entry.length < 4 ||
    entry[2] !== " " ||
    entry.slice(3) !== SERVED_REVIEW_RECEIPT_PATH
  ) {
    return false;
  }
  const status = entry.slice(0, 2);
  return status === "??" || (/^[ MAD][ MAD]$/u.test(status) && status !== "  ");
}

function inspectVerifierSourceHead(root: string): string {
  const runGit = (args: readonly string[], maxBuffer = 8 * 1024 * 1024) => {
    const result = spawnSync(GIT_PATH, [...args], {
      cwd: root,
      encoding: "buffer",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 8_000,
      killSignal: "SIGKILL",
      maxBuffer,
    });
    if (
      result.error !== undefined ||
      result.signal !== null ||
      result.status !== 0 ||
      !Buffer.isBuffer(result.stdout)
    ) {
      fail("artifact-invalid");
    }
    return Buffer.from(result.stdout);
  };
  const topLevel = oneTrimmedLine(
    runGit(["rev-parse", "--show-toplevel"], 16 * 1024),
  );
  let realTopLevel: string;
  try {
    realTopLevel = realpathSync.native(topLevel);
  } catch {
    return fail("artifact-invalid");
  }
  if (realTopLevel !== root) fail("artifact-invalid");
  const head = oneTrimmedLine(
    runGit(["rev-parse", "--verify", "HEAD"], 16 * 1024),
  );
  if (!/^[0-9a-f]{40}$/u.test(head)) fail("artifact-invalid");
  const status = runGit([
    "status",
    "--porcelain=v1",
    "-z",
    "--untracked-files=all",
  ]);
  if (!verifierWorktreeStatusAllowsOnlyReceipt(status)) {
    fail("artifact-invalid");
  }
  return head;
}

function parseCredentialSource(argv: readonly string[]): CredentialSource {
  if (argv.length === 0) return "tty";
  if (
    argv.length === 2 &&
    argv[0] === "--credential-source" &&
    argv[1] === "local-file"
  ) {
    return "local-file";
  }
  fail("credential-invalid");
}

export async function runPrivateVerifierCli(
  argv: readonly string[],
  root = process.cwd(),
): Promise<number> {
  let transport: NodeHttpTransport | undefined;
  try {
    const credentialSource = parseCredentialSource(argv);
    if (
      process.platform !== "darwin" ||
      process.versions.node !== PRIVATE_REVIEW_NODE_VERSION
    ) {
      fail("runtime-invalid");
    }
    let realRoot: string;
    try {
      realRoot = realpathSync.native(resolve(root));
      assertPlanAuthorized(realRoot, G4_PLAN_PATH);
    } catch {
      return fail("authorization-invalid");
    }
    const sourceHead = inspectVerifierSourceHead(realRoot);
    transport = createNodeHttpTransport();
    const result = await verifyPrivateReviewWithDependencies({
      root: realRoot,
      readCredential:
        credentialSource === "local-file"
          ? readFixedLocalCredential
          : readCredentialFromTty,
      request: transport.request,
      closeRequests: transport.close,
      inspectNetwork: () => inspectProductionPrivateNetwork(realRoot),
      now: () => new Date(),
      writeReceipt: (targetPath, receiptBytes) => {
        if (inspectVerifierSourceHead(realRoot) !== sourceHead) {
          fail("artifact-invalid");
        }
        writeCanonicalReceiptAtomic(targetPath, receiptBytes, realRoot);
      },
    });
    process.stdout.write(
      `private-review verified receipt=${result.receiptDigest} paths=${result.receipt.manifestPathCount}\n`,
    );
    return 0;
  } catch (error) {
    const safe =
      error instanceof PrivateHostVerifierError
        ? error.message
        : "private-host-verifier:runtime-invalid";
    process.stderr.write(`${safe}\n`);
    return 1;
  } finally {
    transport?.close();
  }
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  void runPrivateVerifierCli(process.argv.slice(2)).then((status) => {
    process.exitCode = status;
  });
}
