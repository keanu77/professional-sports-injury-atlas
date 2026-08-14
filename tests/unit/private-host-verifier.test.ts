import { spawnSync } from "node:child_process";
import {
  chmodSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo, Socket } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  canonicalJson,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import {
  ARTIFACT_IDENTITY_META_NAME,
  buildArtifactManifest,
  computeArtifactManifestDigest,
  encodeArtifactIdentity,
  PRIVATE_HTTP_HEADER_POLICY_SHA256,
  type ArtifactFile,
  type ArtifactIdentity,
  type ArtifactManifest,
  type BuiltFileInput,
} from "../../src/lib/governance/artifact-manifest";
import {
  DISALLOW_ALL_ROBOTS_TXT,
  NOINDEX_ROBOTS_META,
} from "../../src/lib/governance/build-mode";
import { PRIVATE_REVIEW_MAX_FILE_BYTES } from "../../src/lib/governance/private-review-limits";
import {
  parseServedArtifactReceiptBytes,
  UNAUTHORIZED_SCENARIOS,
  validateServedArtifactReceipt,
} from "../../src/lib/governance/served-artifact-receipt";
import {
  computePrivateDeploymentIdHash,
  createNodeHttpTransport,
  inspectPrivateListenerWithDependencies,
  inspectTailscaleIdentityStateBytes,
  inspectTailscaleServiceStateBytes,
  PrivateHostVerifierError,
  readCredentialFromPrivateFile,
  readCredentialFromTtyPort,
  selectCurrentLanAddresses,
  verifyPrivateReviewWithDependencies,
  validatePrivateNetworkInspection,
  verifierWorktreeStatusAllowsOnlyReceipt,
  writeCanonicalReceiptAtomic,
  type CredentialTtyPort,
  type PrivateHostVerifierDependencies,
  type PrivateDeploymentHashInput,
  type PrivateNetworkInspection,
  type PrivateReadOnlyCommandRunner,
  type PrivateVerifierObservation,
  type PrivateVerifierRequest,
} from "../../scripts/private-hosting/verify-private-review";

const PROJECT_ROOT = resolve(import.meta.dirname, "../..");
const CONFIG_BYTES = readFileSync(
  join(PROJECT_ROOT, "ops/private-hosting.v1.json"),
);
const HEADER_POLICY_BYTES = readFileSync(
  join(PROJECT_ROOT, "ops/http-header-policy.v1.json"),
);
const REVIEW_SET_BYTES = readFileSync(
  join(PROJECT_ROOT, "review/review-set.v1.json"),
);
const PASSWORD = "jCuJoA3rI4nXhCTpKnDdlSN_w9zWW91TAudloOOwTeM";
const ORIGIN = "http://100.114.3.93:8140";
const EXPECTED_AUTHORIZATION = `Basic ${Buffer.from(
  `atlas-reviewer:${PASSWORD}`,
  "utf8",
).toString("base64")}`;
const WRONG_AUTHORIZATION = `Basic ${Buffer.from(
  "atlas-reviewer:wrong-private-review-password",
  "utf8",
).toString("base64")}`;
const REQUIRED_HEADERS = [
  ["Cache-Control", "private, no-store, max-age=0"],
  ["Pragma", "no-cache"],
  ["Vary", "Authorization"],
  ["X-Content-Type-Options", "nosniff"],
  ["X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex"],
] as const;
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

interface VerifierFixture {
  root: string;
  manifest: ArtifactManifest;
  manifestDigest: string;
  filesByRequestPath: Map<string, { file: ArtifactFile; bytes: Buffer }>;
}

interface CredentialFileFixture {
  root: string;
  path: string;
  bytes: string;
  uid: number;
}

function write(
  root: string,
  relativePath: string,
  bytes: string | Uint8Array,
  mode = 0o600,
): string {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes, { mode });
  chmodSync(target, mode);
  return target;
}

function credentialFileFixture(): CredentialFileFixture {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "atlas-credential-")));
  roots.push(root);
  chmodSync(root, 0o700);
  const directory = join(root, "private");
  mkdirSync(directory, { mode: 0o700 });
  chmodSync(directory, 0o700);
  const path = join(directory, "g4-access-info.txt");
  const bytes = canonicalJson({
    schemaVersion: 1,
    origin: ORIGIN,
    username: "atlas-reviewer",
    password: PASSWORD,
  });
  writeFileSync(path, bytes, { mode: 0o600 });
  chmodSync(path, 0o600);
  return {
    root,
    path,
    bytes,
    uid: process.getuid?.() ?? 501,
  };
}

function html(identity: ArtifactIdentity, body: string): string {
  return (
    "<!doctype html><html><head>" +
    `<meta name="robots" content="${NOINDEX_ROBOTS_META}">` +
    `<meta name="${ARTIFACT_IDENTITY_META_NAME}" content="${encodeArtifactIdentity(identity)}">` +
    `<title>Sports Medicine Atlas</title></head><body>${body}</body></html>`
  );
}

function verifierFixture(): VerifierFixture {
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), "atlas-private-verifier-")),
  );
  roots.push(root);
  const homeIdentity: ArtifactIdentity = {
    kind: "html-page",
    pageIds: ["/"],
    recordIds: [],
    digest: "a".repeat(64),
    shardIds: [],
  };
  const caseIdentity: ArtifactIdentity = {
    kind: "html-page",
    pageIds: ["/cases/test-case/"],
    recordIds: ["CASE-NBAACL-2025-021"],
    digest: "b".repeat(64),
    shardIds: [],
  };
  const shardPath = "/case-index/acl/1.json";
  const caseIndexManifestBytes = canonicalJson({
    schemaVersion: 1,
    mode: "review",
    shardSize: 100,
    totalEntries: 1,
    injuries: [{ injuryCode: "acl", entryCount: 1, shardCount: 1 }],
  });
  const shardBytes = canonicalJson([
    {
      id: "CASE-NBAACL-2025-021",
      slug: "test-case",
      injuryCode: "acl",
      sportCode: "basketball",
      leagueCode: "nba",
      competitionCode: "nba-regular-season",
      season: "2024-25",
      eventYear: 2025,
      eventDate: "2025-03-03",
      athleteName: "Test Athlete",
      teamName: "Test Team",
      opponentName: "Test Opponent",
      isClassic: false,
      classicReason: null,
      mechanismTags: ["unclear"],
      confirmationStatus: "confirmed",
      workflowStatus: "approved",
    },
  ]);
  const files: BuiltFileInput[] = [
    {
      path: "index.html",
      bytes: html(homeIdentity, "Atlas private review home"),
      contentType: "text/html; charset=utf-8",
      identity: homeIdentity,
    },
    {
      path: "cases/test-case/index.html",
      bytes: html(caseIdentity, "One exact case page"),
      contentType: "text/html; charset=utf-8",
      identity: caseIdentity,
    },
    {
      path: "case-index/manifest.json",
      bytes: caseIndexManifestBytes,
      contentType: "application/json",
      dataBearing: true,
      identity: {
        kind: "case-index-manifest",
        pageIds: [],
        recordIds: [],
        digest: sha256Hex(caseIndexManifestBytes),
        shardIds: [shardPath],
      },
    },
    {
      path: "case-index/acl/1.json",
      bytes: shardBytes,
      contentType: "application/json",
      dataBearing: true,
      identity: {
        kind: "case-index-shard",
        pageIds: [],
        recordIds: ["CASE-NBAACL-2025-021"],
        digest: sha256Hex(shardBytes),
        shardIds: [shardPath],
      },
    },
    {
      path: "review/review-set.json",
      bytes: REVIEW_SET_BYTES,
      contentType: "application/json",
    },
    {
      path: "robots.txt",
      bytes: DISALLOW_ALL_ROBOTS_TXT,
      contentType: "text/plain; charset=utf-8",
    },
    {
      path: "_astro/app.css",
      bytes: "body{color:#111827}",
      contentType: "text/css; charset=utf-8",
    },
  ];
  const reviewSet = parseStrictJson(REVIEW_SET_BYTES.toString("utf8")) as {
    rendererTreeDigest: string;
  };
  const manifest = buildArtifactManifest("review", files, {
    buildCommit: "f".repeat(40),
    reviewSetDigest: sha256Hex(REVIEW_SET_BYTES),
    reviewSetResponseSha256: sha256Hex(REVIEW_SET_BYTES),
    rendererTreeDigest: reviewSet.rendererTreeDigest,
    headerPolicyDigest: PRIVATE_HTTP_HEADER_POLICY_SHA256,
    generatedAt: "2026-08-08T15:00:00Z",
  });
  write(root, "ops/private-hosting.v1.json", CONFIG_BYTES);
  write(root, "ops/http-header-policy.v1.json", HEADER_POLICY_BYTES);
  write(root, "runtime/node", "synthetic-node\n", 0o755);
  write(root, "node_modules/tsx/dist/cli.mjs", "export {};\n", 0o755);
  write(
    root,
    "scripts/private-hosting/serve-private-review.ts",
    "export {};\n",
  );
  write(root, "review/review-set.v1.json", REVIEW_SET_BYTES);
  write(root, "review/private-dist-manifest.v1.json", canonicalJson(manifest));
  for (const input of files) write(root, `dist/${input.path}`, input.bytes);
  const inputByBuildPath = new Map(files.map((file) => [file.path, file]));
  const filesByRequestPath = new Map(
    manifest.files.map((file) => [
      file.requestPath,
      {
        file,
        bytes: Buffer.from(inputByBuildPath.get(file.buildPath)!.bytes),
      },
    ]),
  );
  return {
    root,
    manifest,
    manifestDigest: computeArtifactManifestDigest(manifest),
    filesByRequestPath,
  };
}

function rawHeaders(
  status: number,
  file: ArtifactFile | undefined,
  bodyLength: number,
): string[] {
  const headers: string[] = REQUIRED_HEADERS.flatMap(([name, value]) => [
    name,
    value,
  ]);
  headers.push("Content-Length", String(bodyLength));
  if (status === 401) {
    headers.push(
      "WWW-Authenticate",
      'Basic realm="Private review", charset="UTF-8"',
    );
  }
  if (file !== undefined) headers.push("Content-Type", file.contentType);
  return headers;
}

function baselineObservation(
  fixture: VerifierFixture,
  request: PrivateVerifierRequest,
): PrivateVerifierObservation {
  const entry = fixture.filesByRequestPath.get(request.requestPath);
  if (request.authorization !== EXPECTED_AUTHORIZATION || entry === undefined) {
    return {
      status: 401,
      rawHeaders: rawHeaders(401, undefined, 0),
      body: Buffer.alloc(0),
      redirected: false,
    };
  }
  return {
    status: 200,
    rawHeaders: rawHeaders(200, entry.file, entry.bytes.byteLength),
    body: Buffer.from(entry.bytes),
    redirected: false,
  };
}

function cloneObservation(
  observation: PrivateVerifierObservation,
): PrivateVerifierObservation {
  return {
    ...observation,
    rawHeaders: [...observation.rawHeaders],
    body: Buffer.from(observation.body),
  };
}

function baselineNetwork(fixture: VerifierFixture): PrivateNetworkInspection {
  const executable = join(fixture.root, "runtime/node");
  return {
    listener: {
      count: 1,
      host: "100.114.3.93",
      port: 8140,
      transport: "tcp4",
      pid: 42_002,
      parentPid: 42_001,
      uid: process.getuid?.() ?? 501,
      cwd: fixture.root,
      executable,
      processCommand:
        `${executable} --require ` +
        `${fixture.root}/node_modules/tsx/dist/preflight.cjs --import ` +
        `file://${fixture.root}/node_modules/tsx/dist/loader.mjs ` +
        `${fixture.root}/scripts/private-hosting/serve-private-review.ts`,
      launchdLabel: "tw.sportsmedicine.atlas.private-review.v1",
      launchdPid: 42_001,
      launchdUid: process.getuid?.() ?? 501,
      launchdCwd: fixture.root,
      launchdExecutable: executable,
      launchdProcessCommand:
        `${executable} ` +
        `${fixture.root}/node_modules/tsx/dist/cli.mjs ` +
        `${fixture.root}/scripts/private-hosting/serve-private-review.ts`,
      runtimeNodeVersion: "24.14.0",
      wildcardListenerObserved: false,
      loopbackListenerObserved: false,
      lanListenerObserved: false,
      ipv6ListenerObserved: false,
      legacyListenerObserved: false,
    },
    tailscale: {
      backendState: "Running",
      selfOnline: true,
      selfDnsName: "mac-mini-m5.tailbc16e9.ts.net.",
      selfTailscaleIPs: ["100.114.3.93", "fd7a:115c:a1e0::1"],
      identityDigest: sha256Hex("synthetic-tailscale-identity"),
      serveStateDigest: sha256Hex("synthetic-serve-state"),
      funnelStateDigest: sha256Hex("synthetic-funnel-state"),
      serveAtlasPortExposed: false,
      funnelAtlasPortExposed: false,
    },
    secondaryOrigins: [
      {
        kind: "loopback",
        address: "127.0.0.1",
        result: "refused",
        status: null,
      },
      {
        kind: "loopback",
        address: "::1",
        result: "refused",
        status: null,
      },
      {
        kind: "lan",
        address: "192.168.50.10",
        result: "refused",
        status: null,
      },
    ],
    loopbackProbeCompleted: true,
    lanAddresses: ["192.168.50.10"],
    wildcardInspectionCompleted: true,
    legacyInspectionCompleted: true,
  };
}

interface ListenerRunnerOverrides {
  firstLsof?: string;
  secondLsof?: string;
  childParentPid?: number;
  childUid?: number;
  childCommand?: string;
  secondChildCommand?: string;
  launchdCommand?: string;
  launchctlOutput?: string;
}

function listenerRunner(
  fixture: VerifierFixture,
  overrides: ListenerRunnerOverrides = {},
): PrivateReadOnlyCommandRunner {
  const uid = process.getuid?.() ?? 501;
  const nodeExecutable = join(fixture.root, "runtime/node");
  const childPid = 42_002;
  const launchdPid = 42_001;
  const defaultLsof =
    `p${childPid}\n` +
    `cnode\n` +
    `u${uid}\n` +
    "f18\n" +
    "n100.114.3.93:8140\n";
  const defaultChildCommand =
    `${nodeExecutable} --require ` +
    `${fixture.root}/node_modules/tsx/dist/preflight.cjs --import ` +
    `file://${fixture.root}/node_modules/tsx/dist/loader.mjs ` +
    `${fixture.root}/scripts/private-hosting/serve-private-review.ts`;
  const defaultLaunchdCommand =
    `${nodeExecutable} ${fixture.root}/node_modules/tsx/dist/cli.mjs ` +
    `${fixture.root}/scripts/private-hosting/serve-private-review.ts`;
  let portReads = 0;
  let childCommandReads = 0;
  return (executable, args) => {
    if (executable === "/usr/sbin/lsof" && args.includes("-iTCP:8140")) {
      const stdout =
        portReads++ === 0
          ? (overrides.firstLsof ?? defaultLsof)
          : (overrides.secondLsof ?? overrides.firstLsof ?? defaultLsof);
      return { status: stdout === "" ? 1 : 0, stdout: Buffer.from(stdout) };
    }
    if (executable === "/usr/sbin/lsof" && args.includes("cwd")) {
      return { status: 0, stdout: Buffer.from(`n${fixture.root}\n`) };
    }
    if (executable === "/bin/launchctl") {
      return {
        status: 0,
        stdout: Buffer.from(
          overrides.launchctlOutput ?? `\tpid = ${launchdPid}\n`,
        ),
      };
    }
    if (executable === "/bin/ps") {
      const pid = Number(args[2]);
      const field = args[4];
      if (field === "comm=") {
        return { status: 0, stdout: Buffer.from(`${nodeExecutable}\n`) };
      }
      if (field === "ppid=") {
        return {
          status: 0,
          stdout: Buffer.from(
            `${pid === childPid ? (overrides.childParentPid ?? launchdPid) : 1}\n`,
          ),
        };
      }
      if (field === "uid=") {
        return {
          status: 0,
          stdout: Buffer.from(
            `${pid === childPid ? (overrides.childUid ?? uid) : uid}\n`,
          ),
        };
      }
      if (field === "command=") {
        if (pid === childPid) {
          const command =
            childCommandReads++ === 0
              ? (overrides.childCommand ?? defaultChildCommand)
              : (overrides.secondChildCommand ??
                overrides.childCommand ??
                defaultChildCommand);
          return { status: 0, stdout: Buffer.from(`${command}\n`) };
        }
        return {
          status: 0,
          stdout: Buffer.from(
            `${overrides.launchdCommand ?? defaultLaunchdCommand}\n`,
          ),
        };
      }
    }
    throw new Error(`unexpected read-only command: ${executable}`);
  };
}

type ObservationMutator = (
  request: PrivateVerifierRequest,
  observation: PrivateVerifierObservation,
) => PrivateVerifierObservation;

interface VerifierHarness {
  dependencies: PrivateHostVerifierDependencies;
  requests: PrivateVerifierRequest[];
  writes: { targetPath: string; bytes: Buffer }[];
  inspections: PrivateNetworkInspection[];
  credentialReads: { count: number };
}

function harness(
  fixture: VerifierFixture,
  options: {
    mutateObservation?: ObservationMutator;
    credential?: { username: string; password: string };
    credentialError?: Error;
    requestError?: Error;
    network?: PrivateNetworkInspection[];
    writeError?: Error;
  } = {},
): VerifierHarness {
  const requests: PrivateVerifierRequest[] = [];
  const writes: { targetPath: string; bytes: Buffer }[] = [];
  const credentialReads = { count: 0 };
  const inspections = options.network ?? [
    baselineNetwork(fixture),
    baselineNetwork(fixture),
  ];
  let inspectionIndex = 0;
  return {
    requests,
    writes,
    inspections,
    credentialReads,
    dependencies: {
      root: fixture.root,
      readCredential: () => {
        credentialReads.count += 1;
        if (options.credentialError) throw options.credentialError;
        return (
          options.credential ?? {
            username: "atlas-reviewer",
            password: PASSWORD,
          }
        );
      },
      request: async (request) => {
        requests.push({ ...request });
        if (options.requestError) throw options.requestError;
        const observation = baselineObservation(fixture, request);
        return options.mutateObservation
          ? options.mutateObservation(request, cloneObservation(observation))
          : observation;
      },
      inspectNetwork: async () =>
        structuredClone(
          inspections[Math.min(inspectionIndex++, inspections.length - 1)]!,
        ),
      now: () => new Date("2026-08-08T15:30:00Z"),
      writeReceipt: async (targetPath, bytes) => {
        if (options.writeError) throw options.writeError;
        writes.push({ targetPath, bytes: Buffer.from(bytes) });
      },
    },
  };
}

function headerIndex(raw: readonly string[], name: string): number {
  for (let index = 0; index < raw.length; index += 2) {
    if (raw[index]?.toLowerCase() === name.toLowerCase()) return index;
  }
  return -1;
}

function replaceHeader(
  observation: PrivateVerifierObservation,
  name: string,
  value: string,
): PrivateVerifierObservation {
  const headers = [...observation.rawHeaders];
  const index = headerIndex(headers, name);
  if (index >= 0) headers[index + 1] = value;
  else headers.push(name, value);
  return { ...observation, rawHeaders: headers };
}

function removeHeader(
  observation: PrivateVerifierObservation,
  name: string,
): PrivateVerifierObservation {
  const headers: string[] = [];
  for (let index = 0; index < observation.rawHeaders.length; index += 2) {
    if (observation.rawHeaders[index]?.toLowerCase() !== name.toLowerCase()) {
      headers.push(
        observation.rawHeaders[index]!,
        observation.rawHeaders[index + 1]!,
      );
    }
  }
  return { ...observation, rawHeaders: headers };
}

function temporaryFiles(directory: string): string[] {
  return readdirSync(directory).filter((name) => name.endsWith(".tmp"));
}

function installFixtureManifest(
  fixture: VerifierFixture,
  manifest: ArtifactManifest,
): void {
  write(
    fixture.root,
    "review/private-dist-manifest.v1.json",
    canonicalJson(manifest),
  );
  fixture.manifest = manifest;
  fixture.manifestDigest = computeArtifactManifestDigest(manifest);
  for (const file of manifest.files) {
    const entry = fixture.filesByRequestPath.get(file.requestPath);
    if (entry) entry.file = file;
  }
}

function installFixtureResponseBytes(
  fixture: VerifierFixture,
  requestPath: string,
  bytes: Uint8Array | string,
): void {
  const manifest = structuredClone(fixture.manifest);
  const file = manifest.files.find(
    (candidate) => candidate.requestPath === requestPath,
  );
  if (!file) throw new Error(`missing synthetic path ${requestPath}`);
  const body = Buffer.from(bytes);
  file.byteLength = body.byteLength;
  file.sha256 = sha256Hex(body);
  write(fixture.root, `dist/${file.buildPath}`, body);
  fixture.filesByRequestPath.set(requestPath, { file, bytes: body });
  installFixtureManifest(fixture, manifest);
}

async function verifierFailure(
  state: VerifierHarness,
  expectedCodes: string | readonly string[],
): Promise<PrivateHostVerifierError> {
  try {
    await verifyPrivateReviewWithDependencies(state.dependencies);
  } catch (error) {
    expect(error).toBeInstanceOf(PrivateHostVerifierError);
    const verifierError = error as PrivateHostVerifierError;
    expect(
      typeof expectedCodes === "string" ? [expectedCodes] : [...expectedCodes],
    ).toContain(verifierError.code);
    expect(state.writes).toEqual([]);
    return verifierError;
  }
  throw new Error("expected private verifier to fail");
}

describe("private live host verifier", () => {
  it("verifies the identical complete authorized set and five-scenario denial matrix", async () => {
    const fixture = verifierFixture();
    const state = harness(fixture);
    const result = await verifyPrivateReviewWithDependencies(
      state.dependencies,
    );
    expect(result.receipt.manifestPathCount).toBe(
      fixture.manifest.files.length,
    );
    expect(result.receipt.authorizedResponses).toHaveLength(
      fixture.manifest.files.length,
    );
    expect(result.receipt.unauthorizedResponses).toHaveLength(
      fixture.manifest.files.length * UNAUTHORIZED_SCENARIOS.length,
    );
    expect(
      result.receipt.authorizedResponses.map((entry) => entry.requestPath),
    ).toEqual(
      fixture.manifest.files
        .map((file) => file.requestPath)
        .sort(compareCodePoints),
    );
    expect(
      result.receipt.unauthorizedResponses.map(
        (entry) => `${entry.requestPath}\0${entry.scenario}`,
      ),
    ).toEqual(
      fixture.manifest.files
        .flatMap((file) =>
          UNAUTHORIZED_SCENARIOS.map(
            (scenario) => `${file.requestPath}\0${scenario}`,
          ),
        )
        .sort(compareCodePoints),
    );
    expect(
      validateServedArtifactReceipt(
        result.receipt,
        fixture.manifest,
        fixture.manifestDigest,
      ),
    ).toEqual([]);
    expect(result.receiptBytes).toBe(canonicalJson(result.receipt));
    expect(result.receiptDigest).toBe(sha256Hex(result.receiptBytes));
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0]?.bytes.toString("utf8")).toBe(result.receiptBytes);

    for (const request of state.requests) {
      expect(request.origin).toBe(ORIGIN);
      expect(request.method).toBe("GET");
      expect(request.acceptEncoding).toBe("identity");
      expect(request.redirect).toBe("manual");
      expect(request.maxBodyBytes).toBeGreaterThan(0);
      expect(fixture.filesByRequestPath.has(request.requestPath)).toBe(true);
    }
    for (const file of fixture.manifest.files) {
      const path = file.requestPath;
      const exactRequests = (clientId: string): PrivateVerifierRequest[] =>
        state.requests.filter((request) => request.clientId === clientId);
      const accessShapes = (clientId: string) =>
        exactRequests(clientId).map((request) => [
          request.authorization,
          request.reuseConnection,
          Object.hasOwn(request, "authorization"),
        ]);
      expect(accessShapes(`authorized:${path}`)).toEqual([
        [EXPECTED_AUTHORIZATION, false, true],
      ]);
      expect(accessShapes(`cold-missing-auth:${path}`)).toEqual([
        [undefined, false, false],
      ]);
      expect(accessShapes(`warm-missing-auth:${path}`)).toEqual([
        [undefined, true, false],
        [undefined, true, false],
      ]);
      expect(accessShapes(`malformed-auth:${path}`)).toEqual([
        ["Basic !!!", false, true],
      ]);
      expect(accessShapes(`wrong-auth:${path}`)).toEqual([
        [WRONG_AUTHORIZATION, false, true],
      ]);
      expect(accessShapes(`credential-removed-session:${path}`)).toEqual([
        [EXPECTED_AUTHORIZATION, true, true],
        [undefined, true, false],
      ]);
      expect(accessShapes(`credential-removed-new-client:${path}`)).toEqual([
        [undefined, false, false],
      ]);
    }
    expect(state.requests).toHaveLength(fixture.manifest.files.length * 9);
    expect(state.credentialReads.count).toBe(1);
    expect(state.inspections).toHaveLength(2);
  });

  it("uses the production transport with manual redirects, identity encoding, and isolated fresh clients", async () => {
    const requests: {
      url: string | undefined;
      acceptEncoding: string | undefined;
      authorization: string | undefined;
      socket: Socket;
    }[] = [];
    const server = createServer((request, response) => {
      requests.push({
        url: request.url,
        acceptEncoding: request.headers["accept-encoding"],
        authorization: request.headers.authorization,
        socket: request.socket,
      });
      response.statusCode = 302;
      response.setHeader("Location", "/must-not-follow");
      response.setHeader("Content-Length", "0");
      response.end();
    });
    await new Promise<void>((resolveListen, rejectListen) => {
      const failListen = (error: Error): void => rejectListen(error);
      server.once("error", failListen);
      server.listen(0, "127.0.0.1", () => {
        server.off("error", failListen);
        resolveListen();
      });
    });
    const address = server.address() as AddressInfo;
    const transport = createNodeHttpTransport();
    const request = (
      authorization: string | undefined,
      clientId: string,
      reuseConnection: boolean,
    ): Promise<PrivateVerifierObservation> =>
      transport.request({
        origin: `http://127.0.0.1:${address.port}`,
        requestPath: "/redirect-source",
        method: "GET",
        authorization,
        acceptEncoding: "identity",
        redirect: "manual",
        clientId,
        reuseConnection,
        maxBodyBytes: 4_096,
      });
    try {
      const observations = [
        await request("Basic c3ludGhldGljOnNlY3JldA==", "warm", true),
        await request(undefined, "warm", true),
        await request(undefined, "fresh", false),
      ];
      expect(observations.map((observation) => observation.status)).toEqual([
        302, 302, 302,
      ]);
      expect(observations.map((observation) => observation.redirected)).toEqual(
        [false, false, false],
      );
      expect(
        observations.map((observation) => observation.body.byteLength),
      ).toEqual([0, 0, 0]);
      expect(requests.map((entry) => entry.url)).toEqual([
        "/redirect-source",
        "/redirect-source",
        "/redirect-source",
      ]);
      expect(requests.map((entry) => entry.acceptEncoding)).toEqual([
        "identity",
        "identity",
        "identity",
      ]);
      expect(requests.map((entry) => entry.authorization)).toEqual([
        "Basic c3ludGhldGljOnNlY3JldA==",
        undefined,
        undefined,
      ]);
      expect(requests[0]?.socket).toBe(requests[1]?.socket);
      expect(requests[2]?.socket).not.toBe(requests[1]?.socket);
      expect(requests).toHaveLength(3);
      for (const observation of observations) {
        expect(
          headerIndex(observation.rawHeaders, "Location"),
        ).toBeGreaterThanOrEqual(0);
      }
    } finally {
      transport.close();
      await new Promise<void>((resolveClose, rejectClose) => {
        server.close((error) =>
          error === undefined ? resolveClose() : rejectClose(error),
        );
      });
    }
  });

  it("keeps the production transport ceiling at the shared 32 MiB boundary", async () => {
    const bodyBoundary = 64 * 1024;
    const requestPaths: string[] = [];
    const server = createServer((request, response) => {
      requestPaths.push(request.url ?? "");
      const body =
        request.url === "/body-exact"
          ? Buffer.alloc(bodyBoundary, 0x61)
          : request.url === "/body-over"
            ? Buffer.alloc(bodyBoundary + 1, 0x62)
            : Buffer.alloc(0);
      response.statusCode = 200;
      response.setHeader("Content-Length", String(body.byteLength));
      response.end(body);
    });
    await new Promise<void>((resolveListen, rejectListen) => {
      const failListen = (error: Error): void => rejectListen(error);
      server.once("error", failListen);
      server.listen(0, "127.0.0.1", () => {
        server.off("error", failListen);
        resolveListen();
      });
    });
    const address = server.address() as AddressInfo;
    const transport = createNodeHttpTransport();
    const baseRequest: Omit<PrivateVerifierRequest, "maxBodyBytes"> = {
      origin: `http://127.0.0.1:${address.port}`,
      requestPath: "/boundary",
      method: "GET",
      acceptEncoding: "identity",
      redirect: "manual",
      clientId: "boundary",
      reuseConnection: false,
    };
    try {
      const accepted = await transport.request({
        ...baseRequest,
        maxBodyBytes: PRIVATE_REVIEW_MAX_FILE_BYTES,
      });
      expect(accepted.status).toBe(200);
      await expect(
        transport.request({
          ...baseRequest,
          maxBodyBytes: PRIVATE_REVIEW_MAX_FILE_BYTES + 1,
        }),
      ).rejects.toMatchObject({ code: "transport-failed" });
      const exactBody = await transport.request({
        ...baseRequest,
        requestPath: "/body-exact",
        maxBodyBytes: bodyBoundary,
      });
      expect(exactBody.body.byteLength).toBe(bodyBoundary);
      await expect(
        transport.request({
          ...baseRequest,
          requestPath: "/body-over",
          maxBodyBytes: bodyBoundary,
        }),
      ).rejects.toMatchObject({ code: "transport-failed" });
      expect(requestPaths).toEqual(["/boundary", "/body-exact", "/body-over"]);
    } finally {
      transport.close();
      await new Promise<void>((resolveClose, rejectClose) => {
        server.close((error) =>
          error === undefined ? resolveClose() : rejectClose(error),
        );
      });
    }
  });

  it("keeps raw origin, credentials, bodies, and deployment tuple out of canonical receipt bytes", async () => {
    const fixture = verifierFixture();
    const state = harness(fixture);
    const result = await verifyPrivateReviewWithDependencies(
      state.dependencies,
    );
    const parsed = parseServedArtifactReceiptBytes(result.receiptBytes);
    expect(parsed.issues).toEqual([]);
    expect(parsed.receipt).toEqual(result.receipt);
    for (const forbidden of [
      ORIGIN,
      PASSWORD,
      EXPECTED_AUTHORIZATION,
      "Atlas private review home",
      "One exact case page",
      '"processCommand":',
      '"privateOrigin":',
      '"deploymentId":',
      '"body"',
    ]) {
      expect(result.receiptBytes).not.toContain(forbidden);
    }
    expect(result.receipt.privateOriginHash).toBe(sha256Hex(ORIGIN));

    expect(
      parseServedArtifactReceiptBytes(JSON.stringify(result.receipt, null, 2))
        .receipt,
    ).toBeNull();
    for (const rawField of [
      { privateOrigin: ORIGIN },
      { password: PASSWORD },
      { authorization: EXPECTED_AUTHORIZATION },
      { body: "<html>private</html>" },
      { deploymentId: "raw-deployment" },
    ]) {
      expect(
        parseServedArtifactReceiptBytes(
          canonicalJson({ ...result.receipt, ...rawField }),
        ).receipt,
      ).toBeNull();
    }
  });

  it("rejects omitted, duplicated, reordered, and incomplete path/scenario metadata", async () => {
    const fixture = verifierFixture();
    const result = await verifyPrivateReviewWithDependencies(
      harness(fixture).dependencies,
    );

    const omitted = structuredClone(result.receipt);
    omitted.authorizedResponses.pop();
    expect(
      validateServedArtifactReceipt(
        omitted,
        fixture.manifest,
        fixture.manifestDigest,
      ).map((issue) => issue.code),
    ).toContain("receipt-authorized-count");

    const duplicated = structuredClone(result.receipt);
    duplicated.authorizedResponses[1] = structuredClone(
      duplicated.authorizedResponses[0]!,
    );
    expect(
      validateServedArtifactReceipt(
        duplicated,
        fixture.manifest,
        fixture.manifestDigest,
      ).map((issue) => issue.code),
    ).toContain("receipt-authorized-duplicate");

    const reorderedAuthorized = structuredClone(result.receipt);
    reorderedAuthorized.authorizedResponses.reverse();
    expect(
      validateServedArtifactReceipt(
        reorderedAuthorized,
        fixture.manifest,
        fixture.manifestDigest,
      ).map((issue) => issue.code),
    ).toContain("receipt-authorized-order");

    const reordered = structuredClone(result.receipt);
    reordered.unauthorizedResponses.reverse();
    expect(
      validateServedArtifactReceipt(
        reordered,
        fixture.manifest,
        fixture.manifestDigest,
      ).map((issue) => issue.code),
    ).toContain("receipt-unauthorized-order");

    const duplicatedScenario = structuredClone(result.receipt);
    duplicatedScenario.unauthorizedResponses[1] = structuredClone(
      duplicatedScenario.unauthorizedResponses[0]!,
    );
    expect(
      validateServedArtifactReceipt(
        duplicatedScenario,
        fixture.manifest,
        fixture.manifestDigest,
      ).map((issue) => issue.code),
    ).toContain("receipt-unauthorized-duplicate");

    const missingScenario = structuredClone(result.receipt);
    missingScenario.unauthorizedResponses =
      missingScenario.unauthorizedResponses.filter(
        (entry) => entry.scenario !== "credential-removed-new-client",
      );
    expect(
      validateServedArtifactReceipt(
        missingScenario,
        fixture.manifest,
        fixture.manifestDigest,
      ).map((issue) => issue.code),
    ).toContain("receipt-unauthorized-count");
  });

  it("fails closed on every unexpected authorized or unauthorized status and redirect", async () => {
    for (const status of [200, 302, 403, 404]) {
      const fixture = verifierFixture();
      let changed = false;
      const state = harness(fixture, {
        mutateObservation(request, observation) {
          if (!changed && request.authorization !== EXPECTED_AUTHORIZATION) {
            changed = true;
            return {
              ...observation,
              status,
              redirected: status === 302,
              rawHeaders:
                status === 302
                  ? [...observation.rawHeaders, "Location", "/login"]
                  : observation.rawHeaders,
            };
          }
          return observation;
        },
      });
      const error = await verifierFailure(state, "status-mismatch");
      expect(error.path).toBeTruthy();
      expect(error.scenario).toBeTruthy();
    }

    for (const authorized of [false, true]) {
      const redirectFixture = verifierFixture();
      let redirected = false;
      const redirectState = harness(redirectFixture, {
        mutateObservation(request, observation) {
          if (
            !redirected &&
            (request.authorization === EXPECTED_AUTHORIZATION) === authorized
          ) {
            redirected = true;
            return { ...observation, redirected: true };
          }
          return observation;
        },
      });
      await verifierFailure(redirectState, "redirect-mismatch");
    }

    const fixture = verifierFixture();
    let changed = false;
    const state = harness(fixture, {
      mutateObservation(request, observation) {
        if (!changed && request.authorization === EXPECTED_AUTHORIZATION) {
          changed = true;
          return { ...observation, status: 404 };
        }
        return observation;
      },
    });
    await verifierFailure(state, "status-mismatch");
  });

  it("detects cache bypass for every missing, malformed, wrong, warm, and removed credential path", async () => {
    for (const scenario of UNAUTHORIZED_SCENARIOS) {
      const fixture = verifierFixture();
      let changed = false;
      const state = harness(fixture, {
        mutateObservation(request, observation) {
          if (
            !changed &&
            request.clientId.includes(scenario) &&
            request.authorization !== EXPECTED_AUTHORIZATION
          ) {
            changed = true;
            const entry = fixture.filesByRequestPath.get(request.requestPath)!;
            return {
              status: 200,
              rawHeaders: rawHeaders(200, entry.file, entry.bytes.byteLength),
              body: Buffer.from(entry.bytes),
              redirected: false,
            };
          }
          return observation;
        },
      });
      const error = await verifierFailure(state, "status-mismatch");
      expect(error.scenario).toBe(scenario);
    }
  });

  it("rejects missing, duplicated, wrong, cacheable, cookie, compression, and forbidden headers", async () => {
    const mutations: Array<{
      name: string;
      mutate: (
        observation: PrivateVerifierObservation,
      ) => PrivateVerifierObservation;
    }> = [
      ...REQUIRED_HEADERS.flatMap(([name, value]) => [
        {
          name: `missing required ${name}`,
          mutate: (observation: PrivateVerifierObservation) =>
            removeHeader(observation, name),
        },
        {
          name: `duplicate required ${name}`,
          mutate: (observation: PrivateVerifierObservation) => ({
            ...observation,
            rawHeaders: [...observation.rawHeaders, name, value],
          }),
        },
      ]),
      {
        name: "cacheable response",
        mutate: (observation) =>
          replaceHeader(observation, "Cache-Control", "public, max-age=600"),
      },
      {
        name: "cookie",
        mutate: (observation) =>
          replaceHeader(observation, "Set-Cookie", "session=private"),
      },
      {
        name: "compression",
        mutate: (observation) =>
          replaceHeader(observation, "Content-Encoding", "gzip"),
      },
      ...[
        "Age",
        "ETag",
        "Expires",
        "Last-Modified",
        "Location",
        "Server",
        "Transfer-Encoding",
      ].map((name) => ({
        name: `forbidden ${name}`,
        mutate: (observation: PrivateVerifierObservation) =>
          replaceHeader(observation, name, "forbidden"),
      })),
    ];
    for (const mutation of mutations) {
      const fixture = verifierFixture();
      let changed = false;
      const state = harness(fixture, {
        mutateObservation(request, observation) {
          if (!changed && request.authorization === EXPECTED_AUTHORIZATION) {
            changed = true;
            return mutation.mutate(observation);
          }
          return observation;
        },
      });
      await verifierFailure(state, "header-mismatch");
    }

    for (const mutation of [
      (observation: PrivateVerifierObservation) =>
        removeHeader(observation, "WWW-Authenticate"),
      (observation: PrivateVerifierObservation) => ({
        ...observation,
        rawHeaders: [
          ...observation.rawHeaders,
          "WWW-Authenticate",
          'Basic realm="Private review", charset="UTF-8"',
        ],
      }),
      (observation: PrivateVerifierObservation) =>
        replaceHeader(observation, "WWW-Authenticate", 'Basic realm="Login"'),
    ]) {
      const fixture = verifierFixture();
      let changed = false;
      const state = harness(fixture, {
        mutateObservation(request, observation) {
          if (!changed && request.authorization !== EXPECTED_AUTHORIZATION) {
            changed = true;
            return mutation(observation);
          }
          return observation;
        },
      });
      await verifierFailure(state, "header-mismatch");
    }
  });

  it("rejects wrong content type, length, truncation, hash, and a changed single HTML page", async () => {
    const cases: Array<{
      name: string;
      mutate: (
        observation: PrivateVerifierObservation,
      ) => PrivateVerifierObservation;
      codes: readonly string[];
    }> = [
      {
        name: "missing content type",
        mutate: (observation) => removeHeader(observation, "Content-Type"),
        codes: ["header-mismatch"],
      },
      {
        name: "duplicate content type",
        mutate: (observation) => ({
          ...observation,
          rawHeaders: [
            ...observation.rawHeaders,
            "Content-Type",
            "text/html; charset=utf-8",
          ],
        }),
        codes: ["header-mismatch"],
      },
      {
        name: "wrong content type",
        mutate: (observation) =>
          replaceHeader(
            observation,
            "Content-Type",
            "application/octet-stream",
          ),
        codes: ["header-mismatch"],
      },
      {
        name: "missing content length",
        mutate: (observation) => removeHeader(observation, "Content-Length"),
        codes: ["header-mismatch"],
      },
      {
        name: "duplicate content length",
        mutate: (observation) => ({
          ...observation,
          rawHeaders: [
            ...observation.rawHeaders,
            "Content-Length",
            String(observation.body.byteLength),
          ],
        }),
        codes: ["header-mismatch"],
      },
      {
        name: "wrong content length",
        mutate: (observation) =>
          replaceHeader(observation, "Content-Length", "999999"),
        codes: ["header-mismatch", "byte-mismatch"],
      },
      {
        name: "truncated body",
        mutate: (observation) => ({
          ...observation,
          body: Buffer.from(observation.body).subarray(0, 2),
        }),
        codes: ["byte-mismatch"],
      },
      {
        name: "same-length changed body",
        mutate: (observation) => {
          const body = Buffer.from(observation.body);
          body[0] = body[0] === 0x7b ? 0x5b : 0x7b;
          return { ...observation, body };
        },
        codes: ["byte-mismatch"],
      },
    ];
    for (const testCase of cases) {
      const fixture = verifierFixture();
      let changed = false;
      const state = harness(fixture, {
        mutateObservation(request, observation) {
          if (!changed && request.authorization === EXPECTED_AUTHORIZATION) {
            changed = true;
            return testCase.mutate(observation);
          }
          return observation;
        },
      });
      await verifierFailure(state, testCase.codes);
    }

    const fixture = verifierFixture();
    const state = harness(fixture, {
      mutateObservation(request, observation) {
        if (
          request.authorization === EXPECTED_AUTHORIZATION &&
          request.requestPath === "/cases/test-case/"
        ) {
          const changed = Buffer.from(observation.body);
          changed[changed.length - 15] ^= 1;
          return { ...observation, body: changed };
        }
        return observation;
      },
    });
    const error = await verifierFailure(state, "byte-mismatch");
    expect(error.path).toBe("/cases/test-case/");
  });

  it("rejects wrong HTML identity, shard identity, robots policy, login, deny, and fallback bodies", async () => {
    const cases = [
      {
        path: "/",
        replacement: Buffer.from(
          html(
            {
              kind: "html-page",
              pageIds: ["/wrong/"],
              recordIds: [],
              digest: "a".repeat(64),
              shardIds: [],
            },
            "Atlas private review home",
          ),
        ),
      },
      {
        path: "/case-index/acl/1.json",
        replacement: Buffer.from(canonicalJson([{ id: "WRONG-CASE" }])),
      },
      { path: "/robots.txt", replacement: Buffer.from("Allow: /\n") },
      {
        path: "/",
        replacement: Buffer.from("<html><title>Sign in</title>Login</html>"),
      },
      {
        path: "/",
        replacement: Buffer.from("<html><title>Access denied</title></html>"),
      },
      {
        path: "/cases/test-case/",
        replacement: Buffer.from(
          "<html><title>Sports Medicine Atlas</title>fallback</html>",
        ),
      },
    ];
    for (const testCase of cases) {
      const fixture = verifierFixture();
      const state = harness(fixture, {
        mutateObservation(request, observation) {
          if (
            request.authorization === EXPECTED_AUTHORIZATION &&
            request.requestPath === testCase.path
          ) {
            return replaceHeader(
              { ...observation, body: Buffer.from(testCase.replacement) },
              "Content-Length",
              String(testCase.replacement.byteLength),
            );
          }
          return observation;
        },
      });
      await verifierFailure(state, ["byte-mismatch", "identity-mismatch"]);
    }
  });

  it("independently rejects manifest/body identity, shard, and robots-meta disagreements after byte equality", async () => {
    for (const mutate of [
      (fixture: VerifierFixture) => {
        const manifest = structuredClone(fixture.manifest);
        const file = manifest.files.find(
          (candidate) => candidate.requestPath === "/cases/test-case/",
        )!;
        file.identity.recordIds = ["CASE-WRONG-IDENTITY"];
        installFixtureManifest(fixture, manifest);
      },
      (fixture: VerifierFixture) => {
        const manifest = structuredClone(fixture.manifest);
        const file = manifest.files.find(
          (candidate) => candidate.requestPath === "/case-index/acl/1.json",
        )!;
        file.identity.recordIds = ["CASE-WRONG-SHARD"];
        installFixtureManifest(fixture, manifest);
      },
      (fixture: VerifierFixture) => {
        const entry = fixture.filesByRequestPath.get("/")!;
        const withoutRobots = entry.bytes
          .toString("utf8")
          .replace(`<meta name="robots" content="${NOINDEX_ROBOTS_META}">`, "");
        installFixtureResponseBytes(fixture, "/", withoutRobots);
      },
    ]) {
      const fixture = verifierFixture();
      mutate(fixture);
      await verifierFailure(harness(fixture), [
        "identity-mismatch",
        "snapshot-invalid",
      ]);
    }
  });

  it("detects unauthorized body leaks without retaining leaked bytes", async () => {
    const leakBodies = [
      `<meta name="${ARTIFACT_IDENTITY_META_NAME}" content="private">`,
      REVIEW_SET_BYTES.toString("utf8"),
      sha256Hex(REVIEW_SET_BYTES),
      "One exact case page",
      '"workflowStatus":"approved"',
      "local-deployment-id",
    ];
    for (const leakBody of leakBodies) {
      const fixture = verifierFixture();
      let changed = false;
      const state = harness(fixture, {
        mutateObservation(request, observation) {
          if (!changed && request.authorization !== EXPECTED_AUTHORIZATION) {
            changed = true;
            const body = Buffer.from(leakBody);
            return replaceHeader(
              { ...observation, body },
              "Content-Length",
              String(body.byteLength),
            );
          }
          return observation;
        },
      });
      const error = await verifierFailure(state, "leak-detected");
      expect(error.message).not.toContain(leakBody);
    }
  });

  it("rejects missing, wildcard, loopback, LAN, IPv6, legacy, or mismatched listener identity", async () => {
    const mutations: Array<(network: PrivateNetworkInspection) => void> = [
      (network) => {
        network.listener.count = 0;
      },
      (network) => {
        network.listener.count = 2;
      },
      (network) => {
        network.listener.host = "0.0.0.0";
      },
      (network) => {
        network.listener.host = "127.0.0.1";
      },
      (network) => {
        network.listener.host = "192.168.50.10";
      },
      (network) => {
        network.listener.transport = "invalid";
      },
      (network) => {
        network.listener.pid = 0;
      },
      (network) => {
        network.listener.parentPid = network.listener.pid;
      },
      (network) => {
        network.listener.uid += 1;
      },
      (network) => {
        network.listener.cwd = "/tmp/wrong-repository";
      },
      (network) => {
        network.listener.executable = "/usr/bin/python3";
      },
      (network) => {
        network.listener.processCommand =
          "python3 -m http.server 8140 --bind 0.0.0.0";
      },
      (network) => {
        network.listener.launchdLabel = "wrong.private.service";
      },
      (network) => {
        network.listener.launchdPid += 1;
      },
      (network) => {
        network.listener.launchdUid += 1;
      },
      (network) => {
        network.listener.launchdCwd = "/tmp/wrong-launchd-cwd";
      },
      (network) => {
        network.listener.launchdExecutable += "-wrong";
      },
      (network) => {
        network.listener.launchdProcessCommand += " --wrong";
      },
      (network) => {
        network.listener.runtimeNodeVersion = "22.0.0";
      },
      ...(
        [
          "wildcardListenerObserved",
          "loopbackListenerObserved",
          "lanListenerObserved",
          "ipv6ListenerObserved",
          "legacyListenerObserved",
        ] as const
      ).map((field) => (network: PrivateNetworkInspection) => {
        network.listener[field] = true;
      }),
    ];
    for (const mutate of mutations) {
      const fixture = verifierFixture();
      const invalid = baselineNetwork(fixture);
      mutate(invalid);
      const state = harness(fixture, { network: [invalid, invalid] });
      await verifierFailure(state, "network-invalid");
      expect(state.requests).toEqual([]);
    }
  });

  it("parses and rechecks the real macOS tsx parent/child listener topology", () => {
    const fixture = verifierFixture();
    const inspect = (overrides: ListenerRunnerOverrides = {}) =>
      inspectPrivateListenerWithDependencies({
        runCommand: listenerRunner(fixture, overrides),
        uid: process.getuid?.() ?? 501,
        nodeExecutable: join(fixture.root, "runtime/node"),
        nodeVersion: "24.14.0",
        lanAddresses: () => ["192.168.50.10"],
      });

    const listener = inspect();
    expect(listener).toEqual(baselineNetwork(fixture).listener);
    validatePrivateNetworkInspection(
      { ...baselineNetwork(fixture), listener },
      fixture.root,
    );

    const wrongParent = inspect({ childParentPid: 1 });
    expect(() =>
      validatePrivateNetworkInspection(
        { ...baselineNetwork(fixture), listener: wrongParent },
        fixture.root,
      ),
    ).toThrow("private-host-verifier:network-invalid");

    const parentCommandInChild =
      `${join(fixture.root, "runtime/node")} ` +
      `${fixture.root}/node_modules/tsx/dist/cli.mjs ` +
      `${fixture.root}/scripts/private-hosting/serve-private-review.ts`;
    const wrongCommand = inspect({ childCommand: parentCommandInChild });
    expect(() =>
      validatePrivateNetworkInspection(
        { ...baselineNetwork(fixture), listener: wrongCommand },
        fixture.root,
      ),
    ).toThrow("private-host-verifier:network-invalid");

    expect(() =>
      inspect({ childUid: (process.getuid?.() ?? 501) + 1 }),
    ).toThrow("private-host-verifier:network-invalid");
    expect(() =>
      inspect({ launchctlOutput: "\tpid = 42001\n\tpid = 42003\n" }),
    ).toThrow("private-host-verifier:network-invalid");
    expect(() =>
      inspect({
        secondLsof:
          `p42003\ncnode\nu${process.getuid?.() ?? 501}\n` +
          "f18\nn100.114.3.93:8140\n",
      }),
    ).toThrow("private-host-verifier:network-invalid");
    expect(() =>
      inspect({ secondChildCommand: `${parentCommandInChild} --drifted` }),
    ).toThrow("private-host-verifier:network-invalid");
  });

  it("selects both address families only from active non-Tailscale LAN interfaces", () => {
    const interfaces = {
      en1: [
        {
          address: "192.168.50.175",
          family: "IPv4",
          internal: false,
        },
        {
          address: "fe80::1234",
          family: "IPv6",
          internal: false,
        },
      ],
      utun0: [
        {
          address: "100.114.3.93",
          family: "IPv4",
          internal: false,
        },
        {
          address: "fd7a:115c:a1e0::1",
          family: "IPv6",
          internal: false,
        },
      ],
      awdl0: [
        {
          address: "fe80::9999",
          family: "IPv6",
          internal: false,
        },
      ],
      lo0: [
        { address: "127.0.0.1", family: "IPv4", internal: true },
        { address: "::1", family: "IPv6", internal: true },
      ],
    } as unknown as Parameters<typeof selectCurrentLanAddresses>[0];
    expect(selectCurrentLanAddresses(interfaces)).toEqual([
      "192.168.50.175",
      "fe80::1234%en1",
    ]);
  });

  it("binds every build and exact socket/process listener field into the deployment hash", () => {
    const input: PrivateDeploymentHashInput = {
      buildCommit: "a".repeat(40),
      reviewSetDigest: "b".repeat(64),
      privateDistManifestDigest: "c".repeat(64),
      gatewayConfigurationDigest: "d".repeat(64),
      listenerIdentity: {
        address: "100.114.3.93",
        port: 8140,
        transport: "tcp4",
        pid: 42_002,
        parentPid: 42_001,
        uid: process.getuid?.() ?? 501,
        cwd: "/private/atlas",
        executable: "/private/node-24.14.0/bin/node",
        command:
          "/private/node-24.14.0/bin/node --require /private/atlas/node_modules/tsx/dist/preflight.cjs --import file:///private/atlas/node_modules/tsx/dist/loader.mjs /private/atlas/scripts/private-hosting/serve-private-review.ts",
        launchdLabel: "tw.sportsmedicine.atlas.private-review.v1",
        launchdPid: 42_001,
        launchdUid: process.getuid?.() ?? 501,
        launchdCwd: "/private/atlas",
        launchdExecutable: "/private/node-24.14.0/bin/node",
        launchdCommand:
          "/private/node-24.14.0/bin/node /private/atlas/node_modules/tsx/dist/cli.mjs /private/atlas/scripts/private-hosting/serve-private-review.ts",
      },
    };
    const baseline = computePrivateDeploymentIdHash(input);
    expect(baseline).toMatch(/^[0-9a-f]{64}$/u);
    const mutations: Array<(value: PrivateDeploymentHashInput) => void> = [
      (value) => {
        value.buildCommit = "e".repeat(40);
      },
      (value) => {
        value.reviewSetDigest = "e".repeat(64);
      },
      (value) => {
        value.privateDistManifestDigest = "e".repeat(64);
      },
      (value) => {
        value.gatewayConfigurationDigest = "e".repeat(64);
      },
      (value) => {
        value.listenerIdentity.address = "100.114.3.94";
      },
      (value) => {
        value.listenerIdentity.port = 8141;
      },
      (value) => {
        value.listenerIdentity.transport = "changed-transport" as "tcp4";
      },
      (value) => {
        value.listenerIdentity.pid += 1;
      },
      (value) => {
        value.listenerIdentity.parentPid += 1;
      },
      (value) => {
        value.listenerIdentity.uid += 1;
      },
      (value) => {
        value.listenerIdentity.cwd += "/changed";
      },
      (value) => {
        value.listenerIdentity.executable += "-changed";
      },
      (value) => {
        value.listenerIdentity.command += " --changed";
      },
      (value) => {
        value.listenerIdentity.launchdLabel += ".changed";
      },
      (value) => {
        value.listenerIdentity.launchdPid += 1;
      },
      (value) => {
        value.listenerIdentity.launchdUid += 1;
      },
      (value) => {
        value.listenerIdentity.launchdCwd += "/changed";
      },
      (value) => {
        value.listenerIdentity.launchdExecutable += "-changed";
      },
      (value) => {
        value.listenerIdentity.launchdCommand += " --changed";
      },
    ];
    const changed = mutations.map((mutate) => {
      const value = structuredClone(input);
      mutate(value);
      return computePrivateDeploymentIdHash(value);
    });
    expect(changed).toHaveLength(19);
    expect(changed.every((digest) => digest !== baseline)).toBe(true);
    expect(new Set(changed).size).toBe(changed.length);
  });

  it("rejects Tailscale identity, Serve/Funnel exposure, omitted probes, inconclusive probes, and second origins", async () => {
    const mutations: Array<(network: PrivateNetworkInspection) => void> = [
      (network) => {
        network.tailscale.backendState = "Stopped";
      },
      (network) => {
        network.tailscale.selfOnline = false;
      },
      (network) => {
        network.tailscale.selfDnsName = "wrong-mini.tail.test.";
      },
      (network) => {
        network.tailscale.selfTailscaleIPs = ["100.100.100.100"];
      },
      (network) => {
        network.tailscale.identityDigest = "not-a-digest";
      },
      (network) => {
        network.tailscale.serveAtlasPortExposed = true;
      },
      (network) => {
        network.tailscale.funnelAtlasPortExposed = true;
      },
      (network) => {
        network.loopbackProbeCompleted = false;
      },
      (network) => {
        network.wildcardInspectionCompleted = false;
      },
      (network) => {
        network.legacyInspectionCompleted = false;
      },
      (network) => {
        network.secondaryOrigins = network.secondaryOrigins.filter(
          (entry) => entry.kind !== "loopback",
        );
      },
      (network) => {
        network.secondaryOrigins[0]!.result = "inconclusive";
      },
      (network) => {
        network.secondaryOrigins[0]!.result = "responded";
        network.secondaryOrigins[0]!.status = 200;
      },
      (network) => {
        network.secondaryOrigins = network.secondaryOrigins.filter(
          (entry) => entry.kind !== "lan",
        );
      },
    ];
    for (const mutate of mutations) {
      const fixture = verifierFixture();
      const invalid = baselineNetwork(fixture);
      mutate(invalid);
      await verifierFailure(
        harness(fixture, { network: [invalid, invalid] }),
        "network-invalid",
      );
    }
  });

  it("strictly parses and canonically hashes Tailscale Serve/Funnel state", () => {
    const identity = inspectTailscaleIdentityStateBytes(
      Buffer.from(
        '{"Self":{"TailscaleIPs":["fd7a::1","100.114.3.93"],"DNSName":"mac-mini-m5.tailbc16e9.ts.net.","Online":true},"BackendState":"Running","Peer":{}}',
      ),
    );
    expect(identity).toEqual({
      backendState: "Running",
      selfOnline: true,
      selfDnsName: "mac-mini-m5.tailbc16e9.ts.net.",
      selfTailscaleIPs: ["100.114.3.93", "fd7a::1"],
      identityDigest: sha256Hex(
        canonicalJson({
          backendState: "Running",
          selfOnline: true,
          selfDnsName: "mac-mini-m5.tailbc16e9.ts.net.",
          selfTailscaleIPs: ["100.114.3.93", "fd7a::1"],
        }),
      ),
    });
    for (const invalidIdentity of [
      "{}",
      '{"Self":[],"BackendState":"Running"}',
      '{"Self":{"Online":"yes","DNSName":"mini","TailscaleIPs":[]},"BackendState":"Running"}',
      '{"Self":{"Online":true,"DNSName":"mini","TailscaleIPs":[]},"BackendState":"Running","BackendState":"Stopped"}',
    ]) {
      expect(() =>
        inspectTailscaleIdentityStateBytes(Buffer.from(invalidIdentity)),
      ).toThrow("private-host-verifier:network-invalid");
    }

    const first = Buffer.from(
      '{"TCP":{"443":{"HTTPS":true}},"Web":{"mini.test:443":{"Handlers":{"/":{"Proxy":"http://127.0.0.1:9000"}}}}}',
    );
    const reordered = Buffer.from(
      '{"Web":{"mini.test:443":{"Handlers":{"/":{"Proxy":"http://127.0.0.1:9000"}}}},"TCP":{"443":{"HTTPS":true}}}',
    );
    const firstInspection = inspectTailscaleServiceStateBytes(first);
    expect(firstInspection).toEqual({
      digest: sha256Hex(
        canonicalJson({
          TCP: { "443": { HTTPS: true } },
          Web: {
            "mini.test:443": {
              Handlers: { "/": { Proxy: "http://127.0.0.1:9000" } },
            },
          },
        }),
      ),
      atlasPortExposed: false,
    });
    expect(inspectTailscaleServiceStateBytes(reordered)).toEqual(
      firstInspection,
    );
    expect(
      inspectTailscaleServiceStateBytes(
        Buffer.from(
          '{"Web":{"atlas-news.test:18140":{"Handlers":{"/sportsmedicine":{"Text":"private-review notes"}}}}}',
        ),
      ).atlasPortExposed,
    ).toBe(false);

    for (const exposed of [
      '{"TCP":{"8140":{"HTTPS":true}}}',
      '{"Web":{"mini.test:8140":{"Handlers":{}}}}',
      '{"Web":{"mini.test:443":{"Handlers":{"/":{"Proxy":"http://100.114.3.93:8140"}}}}}',
      '{"Web":{"mini.test:443":{"Handlers":{"/":{"Proxy":"localhost:8140"}}}}}',
      '{"Foreground":{"TCP":{"443":{"TCPForward":"127.0.0.1:8140"}}}}',
      '{"service":"tw.sportsmedicine.atlas.private-review.v1"}',
      '{"Services":{"svc:review":{"TCP":{"8140":{"HTTPS":true}}}}}',
    ]) {
      expect(
        inspectTailscaleServiceStateBytes(Buffer.from(exposed))
          .atlasPortExposed,
      ).toBe(true);
    }
    const pathFixture = verifierFixture();
    const aliasRoot = realpathSync(mkdtempSync(join(tmpdir(), "atlas-alias-")));
    roots.push(aliasRoot);
    const alias = join(aliasRoot, "repository-alias");
    symlinkSync(pathFixture.root, alias);
    for (const servedPath of [
      join(pathFixture.root, "dist"),
      join(alias, "dist"),
      dirname(pathFixture.root),
    ]) {
      expect(
        inspectTailscaleServiceStateBytes(
          Buffer.from(
            `{"Web":{"mini.test:443":{"Handlers":{"/":{"Path":"${servedPath}"}}}}}`,
          ),
          pathFixture.root,
        ).atlasPortExposed,
      ).toBe(true);
    }

    for (const invalid of [
      Buffer.alloc(0),
      Buffer.from("[]"),
      Buffer.from('{"TCP":{},"TCP":{}}'),
      Buffer.from('{"TCP":'),
      Buffer.from([0xff]),
    ]) {
      expect(() => inspectTailscaleServiceStateBytes(invalid)).toThrow(
        "private-host-verifier:network-invalid",
      );
    }
  });

  it("detects any listener, Tailscale identity, Serve, or Funnel drift across one run", async () => {
    const mutations: Array<(network: PrivateNetworkInspection) => void> = [
      (network) => {
        network.listener.pid += 1;
        network.listener.launchdPid += 1;
      },
      (network) => {
        network.listener.processCommand += " --changed";
      },
      (network) => {
        network.tailscale.identityDigest = sha256Hex("changed-identity");
      },
      (network) => {
        network.tailscale.serveStateDigest = sha256Hex("changed-serve");
      },
      (network) => {
        network.tailscale.funnelStateDigest = sha256Hex("changed-funnel");
      },
    ];
    for (const mutate of mutations) {
      const fixture = verifierFixture();
      const before = baselineNetwork(fixture);
      const after = structuredClone(before);
      mutate(after);
      await verifierFailure(harness(fixture, { network: [before, after] }), [
        "network-changed",
        "network-invalid",
      ]);
    }
  });

  it("rejects invalid credentials and sanitizes credential, transport, and writer failures", async () => {
    for (const credential of [
      { username: "wrong-reviewer", password: PASSWORD },
      { username: "atlas-reviewer", password: "" },
      { username: "atlas-reviewer", password: "bad\nsecret" },
    ]) {
      const fixture = verifierFixture();
      await verifierFailure(
        harness(fixture, { credential }),
        "credential-invalid",
      );
    }

    for (const [kind, state, expectedCode] of [
      [
        "credential",
        harness(verifierFixture(), {
          credentialError: new Error(`${PASSWORD} ${ORIGIN}`),
        }),
        "credential-invalid",
      ],
      [
        "transport",
        harness(verifierFixture(), {
          requestError: new Error(`${PASSWORD} ${ORIGIN} <html>secret</html>`),
        }),
        "transport-failed",
      ],
      [
        "writer",
        harness(verifierFixture(), {
          writeError: new Error(`${PASSWORD} ${ORIGIN}`),
        }),
        "receipt-write-failed",
      ],
    ] as const) {
      const error = await verifierFailure(state, expectedCode);
      expect(error.message, kind).not.toContain(PASSWORD);
      expect(error.message, kind).not.toContain(ORIGIN);
      expect(error.message, kind).not.toContain("<html>");
    }
  });

  it("retains the exact path and scenario on transport, raw-header, and warm-preflight failures", async () => {
    const transportFixture = verifierFixture();
    const transportState = harness(transportFixture);
    const successfulRequest = transportState.dependencies.request;
    transportState.dependencies.request = (request) => {
      if (
        request.clientId.startsWith("credential-removed-session:") &&
        request.authorization === EXPECTED_AUTHORIZATION
      ) {
        transportState.requests.push({ ...request });
        throw new PrivateHostVerifierError("transport-failed", {
          path: "/wrong-path",
        });
      }
      return successfulRequest(request);
    };
    const transportError = await verifierFailure(
      transportState,
      "transport-failed",
    );
    expect(transportError.path).toBe(
      transportState.requests.at(-1)?.requestPath,
    );
    expect(transportError.scenario).toBe("credential-removed-new-client");

    const headerFixture = verifierFixture();
    const headerState = harness(headerFixture, {
      mutateObservation(request, observation) {
        if (request.clientId.startsWith("cold-missing-auth:")) {
          observation.rawHeaders = ["Odd-Header-Without-A-Value"];
        }
        return observation;
      },
    });
    const headerError = await verifierFailure(headerState, "header-mismatch");
    expect(headerError.path).toBe(headerState.requests[0]?.requestPath);
    expect(headerError.scenario).toBe("cold-missing-auth");

    const warmFixture = verifierFixture();
    const warmState = harness(warmFixture, {
      mutateObservation(request, observation) {
        if (
          request.clientId.startsWith("credential-removed-session:") &&
          request.authorization === EXPECTED_AUTHORIZATION
        ) {
          observation.status = 404;
        }
        return observation;
      },
    });
    const warmError = await verifierFailure(warmState, "status-mismatch");
    expect(warmError.path).toBe(warmState.requests.at(-1)?.requestPath);
    expect(warmError.scenario).toBe("credential-removed-new-client");
  });

  it("reads credentials only from an exact owner-only regular file and detects metadata races", () => {
    const accepted = credentialFileFixture();
    expect(
      readCredentialFromPrivateFile(accepted.path, {
        expectedPath: accepted.path,
        uid: accepted.uid,
      }),
    ).toEqual({ username: "atlas-reviewer", password: PASSWORD });

    const reject = (
      prepare: (fixture: CredentialFileFixture) => void,
    ): void => {
      const fixture = credentialFileFixture();
      prepare(fixture);
      expect(() =>
        readCredentialFromPrivateFile(fixture.path, {
          expectedPath: fixture.path,
          uid: fixture.uid,
        }),
      ).toThrowError(expect.objectContaining({ code: "credential-invalid" }));
    };
    reject((fixture) => chmodSync(fixture.path, 0o644));
    reject((fixture) => chmodSync(dirname(fixture.path), 0o777));
    reject((fixture) =>
      linkSync(fixture.path, join(fixture.root, "second-hard-link")),
    );
    reject((fixture) => {
      const regular = `${fixture.path}.regular`;
      renameSync(fixture.path, regular);
      symlinkSync(regular, fixture.path);
    });
    reject((fixture) => writeFileSync(fixture.path, "not canonical JSON"));

    const wrongPath = credentialFileFixture();
    expect(() =>
      readCredentialFromPrivateFile(wrongPath.path, {
        expectedPath: `${wrongPath.path}.different`,
        uid: wrongPath.uid,
      }),
    ).toThrowError(expect.objectContaining({ code: "credential-invalid" }));
    expect(() =>
      readCredentialFromPrivateFile(wrongPath.path, {
        expectedPath: wrongPath.path,
        uid: wrongPath.uid + 1,
      }),
    ).toThrowError(expect.objectContaining({ code: "credential-invalid" }));

    const raced = credentialFileFixture();
    expect(() =>
      readCredentialFromPrivateFile(raced.path, {
        expectedPath: raced.path,
        uid: raced.uid,
        beforeOpen: () => {
          renameSync(raced.path, `${raced.path}.original`);
          writeFileSync(raced.path, raced.bytes, { mode: 0o600 });
          chmodSync(raced.path, 0o600);
        },
      }),
    ).toThrowError(expect.objectContaining({ code: "credential-invalid" }));

    const fifoRace = credentialFileFixture();
    expect(() =>
      readCredentialFromPrivateFile(fifoRace.path, {
        expectedPath: fifoRace.path,
        uid: fifoRace.uid,
        beforeOpen: () => {
          renameSync(fifoRace.path, `${fifoRace.path}.original`);
          const result = spawnSync("/usr/bin/mkfifo", [fifoRace.path]);
          if (result.status !== 0) throw new Error("mkfifo failed");
        },
      }),
    ).toThrow(expect.objectContaining({ code: "credential-invalid" }));

    for (const hook of ["afterOpen", "afterRead"] as const) {
      const chmodRace = credentialFileFixture();
      expect(() =>
        readCredentialFromPrivateFile(chmodRace.path, {
          expectedPath: chmodRace.path,
          uid: chmodRace.uid,
          [hook]: () => chmodSync(chmodRace.path, 0o644),
        }),
      ).toThrow(expect.objectContaining({ code: "credential-invalid" }));

      const hardlinkRace = credentialFileFixture();
      expect(() =>
        readCredentialFromPrivateFile(hardlinkRace.path, {
          expectedPath: hardlinkRace.path,
          uid: hardlinkRace.uid,
          [hook]: () =>
            linkSync(
              hardlinkRace.path,
              join(hardlinkRace.root, `${hook}-hard-link`),
            ),
        }),
      ).toThrow(expect.objectContaining({ code: "credential-invalid" }));
    }

    const parentRace = credentialFileFixture();
    expect(() =>
      readCredentialFromPrivateFile(parentRace.path, {
        expectedPath: parentRace.path,
        uid: parentRace.uid,
        afterRead: () => {
          const directory = dirname(parentRace.path);
          renameSync(directory, `${directory}.original`);
          mkdirSync(directory, { mode: 0o700 });
        },
      }),
    ).toThrow(expect.objectContaining({ code: "credential-invalid" }));
  });

  it("disables TTY echo, never writes the password, and restores echo on success or failure", () => {
    const fakePort = (
      input: Iterable<number>,
      options: {
        failDisable?: boolean;
        failRead?: boolean;
        failRestore?: boolean;
      } = {},
    ): {
      port: CredentialTtyPort;
      echo: boolean[];
      writes: string[];
      closed: { value: boolean };
    } => {
      const bytes = [...input];
      const echo: boolean[] = [];
      const writes: string[] = [];
      const closed = { value: false };
      return {
        echo,
        writes,
        closed,
        port: {
          setEcho(enabled) {
            echo.push(enabled);
            if (!enabled && options.failDisable) throw new Error(PASSWORD);
            if (enabled && options.failRestore) throw new Error(PASSWORD);
          },
          write(message) {
            writes.push(message);
          },
          readByte() {
            if (options.failRead) throw new Error(PASSWORD);
            return bytes.shift() ?? null;
          },
          close() {
            closed.value = true;
          },
        },
      };
    };

    const success = fakePort(Buffer.from(`${PASSWORD}\n`, "utf8"));
    expect(readCredentialFromTtyPort(success.port)).toEqual({
      username: "atlas-reviewer",
      password: PASSWORD,
    });
    expect(success.echo).toEqual([false, true]);
    expect(success.writes).toEqual(["Private-review password: ", "\n"]);
    expect(success.writes.join("")).not.toContain(PASSWORD);
    expect(success.closed.value).toBe(true);

    const failedRead = fakePort([], { failRead: true });
    expect(() => readCredentialFromTtyPort(failedRead.port)).toThrowError(
      expect.objectContaining({
        code: "credential-invalid",
        message: expect.not.stringContaining(PASSWORD),
      }),
    );
    expect(failedRead.echo).toEqual([false, true]);
    expect(failedRead.writes).toEqual(["Private-review password: ", "\n"]);
    expect(failedRead.closed.value).toBe(true);

    const failedDisable = fakePort([], { failDisable: true });
    expect(() => readCredentialFromTtyPort(failedDisable.port)).toThrowError(
      expect.objectContaining({
        code: "credential-invalid",
        message: expect.not.stringContaining(PASSWORD),
      }),
    );
    expect(failedDisable.echo).toEqual([false, true]);
    expect(failedDisable.writes).toEqual(["Private-review password: ", "\n"]);
    expect(failedDisable.closed.value).toBe(true);

    const failedRestore = fakePort(Buffer.from(`${PASSWORD}\n`, "utf8"), {
      failRestore: true,
    });
    expect(() => readCredentialFromTtyPort(failedRestore.port)).toThrowError(
      expect.objectContaining({
        code: "credential-invalid",
        message: expect.not.stringContaining(PASSWORD),
      }),
    );
    expect(failedRestore.echo).toEqual([false, true]);
    expect(failedRestore.writes).toEqual(["Private-review password: ", "\n"]);
    expect(failedRestore.closed.value).toBe(true);
  });

  it("atomically writes only canonical success bytes and rejects symlink or special receipt targets", async () => {
    const fixture = verifierFixture();
    const result = await verifyPrivateReviewWithDependencies(
      harness(fixture).dependencies,
    );
    const target = join(fixture.root, "review/served-review-receipt.v1.json");
    writeCanonicalReceiptAtomic(target, result.receiptBytes, fixture.root);
    expect(readFileSync(target, "utf8")).toBe(result.receiptBytes);
    expect(lstatSync(target).mode & 0o777).toBe(0o644);
    expect(temporaryFiles(join(fixture.root, "review"))).toEqual([]);

    writeFileSync(target, canonicalJson({ old: true }));
    chmodSync(target, 0o600);
    writeCanonicalReceiptAtomic(target, result.receiptBytes, fixture.root);
    expect(readFileSync(target, "utf8")).toBe(result.receiptBytes);
    expect(lstatSync(target).mode & 0o777).toBe(0o644);
    const stableReceipt = readFileSync(target, "utf8");

    expect(() =>
      writeCanonicalReceiptAtomic(
        target,
        JSON.stringify(result.receipt, null, 2),
        fixture.root,
      ),
    ).toThrowError(PrivateHostVerifierError);
    expect(readFileSync(target, "utf8")).toBe(stableReceipt);
    expect(temporaryFiles(join(fixture.root, "review"))).toEqual([]);
    const wrongTarget = join(fixture.root, "served-review-receipt.v1.json");
    expect(() =>
      writeCanonicalReceiptAtomic(
        wrongTarget,
        result.receiptBytes,
        fixture.root,
      ),
    ).toThrowError(PrivateHostVerifierError);
    expect(readFileSync(target, "utf8")).toBe(stableReceipt);
    expect(() => lstatSync(wrongTarget)).toThrow();

    rmSync(target);
    const outside = join(fixture.root, "outside-receipt");
    writeFileSync(outside, "preserve-me");
    symlinkSync(outside, target);
    expect(() =>
      writeCanonicalReceiptAtomic(target, result.receiptBytes, fixture.root),
    ).toThrowError(expect.objectContaining({ code: "receipt-write-failed" }));
    expect(readFileSync(outside, "utf8")).toBe("preserve-me");

    rmSync(target);
    mkdirSync(target);
    expect(() =>
      writeCanonicalReceiptAtomic(target, result.receiptBytes, fixture.root),
    ).toThrowError(expect.objectContaining({ code: "receipt-write-failed" }));
  });

  it("allows no worktree change except the fixed served-receipt path", () => {
    const receipt = "review/served-review-receipt.v1.json";
    for (const allowed of [
      "",
      `?? ${receipt}\0`,
      ` M ${receipt}\0`,
      `M  ${receipt}\0`,
      `MM ${receipt}\0`,
    ]) {
      expect(
        verifierWorktreeStatusAllowsOnlyReceipt(Buffer.from(allowed)),
      ).toBe(true);
    }
    for (const rejected of [
      `?? scripts/private-hosting/verify-private-review.ts\0`,
      `?? ${receipt}\0?? another-file\0`,
      `R  ${receipt}\0review/old-receipt.json\0`,
      `UU ${receipt}\0`,
      `!! ${receipt}\0`,
      `?? ${receipt}`,
      `?? ${receipt}\n\0`,
    ]) {
      expect(
        verifierWorktreeStatusAllowsOnlyReceipt(Buffer.from(rejected)),
      ).toBe(false);
    }
    expect(verifierWorktreeStatusAllowsOnlyReceipt(Buffer.from([0xff]))).toBe(
      false,
    );
  });
});
