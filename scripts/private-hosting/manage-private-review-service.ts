/**
 * Render and manage the one authorized private-review LaunchAgent.
 *
 * The tracked template contains neither machine-local paths nor credentials.
 * This module resolves and verifies the exact Node/repository files before it
 * writes a mode-0600 plist under the current user's Application Support tree.
 * All process execution is dependency-injected so unit tests never contact the
 * real launchd service.
 */

import { spawnSync } from "node:child_process";
import {
  chmodSync,
  closeSync,
  constants,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import {
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical.ts";
import { REVIEW_SET_V2_MANIFEST_PATH } from "../../src/lib/governance/review-set.ts";

export const PRIVATE_HOSTING_CONFIG_PATH = "ops/private-hosting.v1.json";
export const PRIVATE_REVIEW_LAUNCHD_LABEL =
  "tw.sportsmedicine.atlas.private-review.v1";
export const PRIVATE_REVIEW_NODE_VERSION = "24.14.0";
export const LAUNCHCTL_PATH = "/bin/launchctl";
export const PLUTIL_PATH = "/usr/bin/plutil";

const PRIVATE_REVIEW_SERVICE_ID = "tw.sportsmedicine.atlas.private-review";
const TAILSCALE_CLI_PATH = "/opt/homebrew/bin/tailscale";
const TEMPLATE_PATH =
  "ops/launchd/tw.sportsmedicine.atlas.private-review.plist.template";
const RENDERED_PLIST_NAME = "tw.sportsmedicine.atlas.private-review.plist";

export interface PrivateHostingConfigV1 {
  schemaVersion: 1;
  serviceId: typeof PRIVATE_REVIEW_SERVICE_ID;
  nodeVersion: typeof PRIVATE_REVIEW_NODE_VERSION;
  bind: {
    tailscaleCliPath: typeof TAILSCALE_CLI_PATH;
    tailscaleDnsName: "mac-mini-m5.tailbc16e9.ts.net";
    tailscaleIPv4: "100.114.3.93";
    port: 8140;
  };
  authentication: {
    method: "http-basic-scrypt-keychain-v1";
    username: "atlas-reviewer";
    realm: "Private review";
    keychainService: "tw.sportsmedicine.atlas.private-review.auth-v1";
    keychainAccount: "atlas-reviewer";
    scrypt: {
      algorithm: "scrypt-v1";
      N: 16_384;
      r: 8;
      p: 1;
      keyLength: 32;
      saltBytes: 32;
    };
  };
  artifact: {
    distDirectory: "dist";
    manifestPath: "review/private-dist-manifest.v1.json";
    reviewSetPath: typeof REVIEW_SET_V2_MANIFEST_PATH;
    headerPolicyPath: "ops/http-header-policy.v1.json";
  };
  launchd: {
    label: typeof PRIVATE_REVIEW_LAUNCHD_LABEL;
    templatePath: typeof TEMPLATE_PATH;
    localStateDirectoryName: typeof PRIVATE_REVIEW_SERVICE_ID;
    renderedPlistName: typeof RENDERED_PLIST_NAME;
    serverScriptPath: "scripts/private-hosting/serve-private-review.ts";
    tsxCliPath: "node_modules/tsx/dist/cli.mjs";
  };
}

export interface LoadedPrivateHostingConfig {
  config: PrivateHostingConfigV1;
  bytes: Buffer;
  sha256: string;
  path: string;
}

export interface CommandInvocation {
  executable: string;
  args: readonly string[];
  stdin?: string | Buffer;
  timeoutMs?: number;
  /** Suppress both stdout and stderr at the process boundary. */
  discardOutput?: boolean;
}

export interface CommandResult {
  status: number;
  stdout: string;
  stderr: string;
}

export type CommandRunner = (invocation: CommandInvocation) => CommandResult;

export interface PrivateServiceDependencies {
  root?: string;
  homeDirectory?: string;
  nodeBinary?: string;
  runtimeNodeVersion?: string;
  platform?: NodeJS.Platform;
  uid?: number;
  runner?: CommandRunner;
}

export type PrivateServiceAction =
  "render" | "load" | "unload" | "restart" | "status";

export interface RenderedLaunchAgent {
  label: typeof PRIVATE_REVIEW_LAUNCHD_LABEL;
  path: string;
  localStateDirectory: string;
}

export class PrivateHostingConfigurationError extends Error {}

type JsonRecord = Record<string, unknown>;

function fail(message: string): never {
  throw new PrivateHostingConfigurationError(message);
}

function expectRecord(value: unknown, path: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${path} must be an object`);
  }
  return value as JsonRecord;
}

function expectExactKeys(
  value: JsonRecord,
  expected: readonly string[],
  path: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    fail(`${path} has an invalid field set`);
  }
}

function expectLiteral<T extends string | number>(
  value: unknown,
  expected: T,
  path: string,
): asserts value is T {
  if (value !== expected) fail(`${path} must equal its fixed contract value`);
}

function parseConfigValue(value: unknown): PrivateHostingConfigV1 {
  const config = expectRecord(value, "private hosting config");
  expectExactKeys(
    config,
    [
      "schemaVersion",
      "serviceId",
      "nodeVersion",
      "bind",
      "authentication",
      "artifact",
      "launchd",
    ],
    "private hosting config",
  );
  expectLiteral(config.schemaVersion, 1, "schemaVersion");
  expectLiteral(config.serviceId, PRIVATE_REVIEW_SERVICE_ID, "serviceId");
  expectLiteral(config.nodeVersion, PRIVATE_REVIEW_NODE_VERSION, "nodeVersion");

  const bind = expectRecord(config.bind, "bind");
  expectExactKeys(
    bind,
    ["tailscaleCliPath", "tailscaleDnsName", "tailscaleIPv4", "port"],
    "bind",
  );
  expectLiteral(
    bind.tailscaleCliPath,
    TAILSCALE_CLI_PATH,
    "bind.tailscaleCliPath",
  );
  expectLiteral(
    bind.tailscaleDnsName,
    "mac-mini-m5.tailbc16e9.ts.net",
    "bind.tailscaleDnsName",
  );
  expectLiteral(bind.tailscaleIPv4, "100.114.3.93", "bind.tailscaleIPv4");
  expectLiteral(bind.port, 8140, "bind.port");

  const authentication = expectRecord(config.authentication, "authentication");
  expectExactKeys(
    authentication,
    [
      "method",
      "username",
      "realm",
      "keychainService",
      "keychainAccount",
      "scrypt",
    ],
    "authentication",
  );
  expectLiteral(
    authentication.method,
    "http-basic-scrypt-keychain-v1",
    "authentication.method",
  );
  expectLiteral(
    authentication.username,
    "atlas-reviewer",
    "authentication.username",
  );
  expectLiteral(authentication.realm, "Private review", "authentication.realm");
  expectLiteral(
    authentication.keychainService,
    "tw.sportsmedicine.atlas.private-review.auth-v1",
    "authentication.keychainService",
  );
  expectLiteral(
    authentication.keychainAccount,
    "atlas-reviewer",
    "authentication.keychainAccount",
  );
  const scrypt = expectRecord(authentication.scrypt, "authentication.scrypt");
  expectExactKeys(
    scrypt,
    ["algorithm", "N", "r", "p", "keyLength", "saltBytes"],
    "authentication.scrypt",
  );
  expectLiteral(
    scrypt.algorithm,
    "scrypt-v1",
    "authentication.scrypt.algorithm",
  );
  expectLiteral(scrypt.N, 16_384, "authentication.scrypt.N");
  expectLiteral(scrypt.r, 8, "authentication.scrypt.r");
  expectLiteral(scrypt.p, 1, "authentication.scrypt.p");
  expectLiteral(scrypt.keyLength, 32, "authentication.scrypt.keyLength");
  expectLiteral(scrypt.saltBytes, 32, "authentication.scrypt.saltBytes");

  const artifact = expectRecord(config.artifact, "artifact");
  expectExactKeys(
    artifact,
    ["distDirectory", "manifestPath", "reviewSetPath", "headerPolicyPath"],
    "artifact",
  );
  expectLiteral(artifact.distDirectory, "dist", "artifact.distDirectory");
  expectLiteral(
    artifact.manifestPath,
    "review/private-dist-manifest.v1.json",
    "artifact.manifestPath",
  );
  expectLiteral(
    artifact.reviewSetPath,
    REVIEW_SET_V2_MANIFEST_PATH,
    "artifact.reviewSetPath",
  );
  expectLiteral(
    artifact.headerPolicyPath,
    "ops/http-header-policy.v1.json",
    "artifact.headerPolicyPath",
  );

  const launchd = expectRecord(config.launchd, "launchd");
  expectExactKeys(
    launchd,
    [
      "label",
      "templatePath",
      "localStateDirectoryName",
      "renderedPlistName",
      "serverScriptPath",
      "tsxCliPath",
    ],
    "launchd",
  );
  expectLiteral(launchd.label, PRIVATE_REVIEW_LAUNCHD_LABEL, "launchd.label");
  expectLiteral(launchd.templatePath, TEMPLATE_PATH, "launchd.templatePath");
  expectLiteral(
    launchd.localStateDirectoryName,
    PRIVATE_REVIEW_SERVICE_ID,
    "launchd.localStateDirectoryName",
  );
  expectLiteral(
    launchd.renderedPlistName,
    RENDERED_PLIST_NAME,
    "launchd.renderedPlistName",
  );
  expectLiteral(
    launchd.serverScriptPath,
    "scripts/private-hosting/serve-private-review.ts",
    "launchd.serverScriptPath",
  );
  expectLiteral(
    launchd.tsxCliPath,
    "node_modules/tsx/dist/cli.mjs",
    "launchd.tsxCliPath",
  );

  return config as unknown as PrivateHostingConfigV1;
}

function decodeUtf8(bytes: Uint8Array, description: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return fail(`${description} must be valid UTF-8`);
  }
}

export function parsePrivateHostingConfigBytes(
  bytes: string | Uint8Array,
): PrivateHostingConfigV1 {
  const text =
    typeof bytes === "string"
      ? bytes
      : decodeUtf8(bytes, "private hosting config");
  try {
    return parseConfigValue(parseStrictJson(text));
  } catch (error) {
    if (error instanceof PrivateHostingConfigurationError) throw error;
    fail("private hosting config is not strict JSON");
  }
}

function isContainedPath(root: string, target: string): boolean {
  const rel = relative(root, target);
  return (
    rel === "" ||
    (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
  );
}

function resolveRealRegularFile(root: string, relativePath: string): string {
  if (
    relativePath === "" ||
    isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath
      .split("/")
      .some((part) => part === "" || part === "." || part === "..")
  ) {
    fail("configured repository path is invalid");
  }
  let current = root;
  for (const component of relativePath.split("/")) {
    current = join(current, component);
    if (!existsSync(current)) {
      fail("a required private-hosting file is absent");
    }
    if (lstatSync(current).isSymbolicLink()) {
      fail("a required private-hosting path contains a symbolic link");
    }
  }
  const candidate = join(root, relativePath);
  const candidateStat = lstatSync(candidate);
  if (candidateStat.isSymbolicLink() || !candidateStat.isFile()) {
    fail("a required private-hosting path is not a real regular file");
  }
  const realCandidate = realpathSync.native(candidate);
  if (!isContainedPath(root, realCandidate)) {
    fail("a required private-hosting file escapes the repository");
  }
  return realCandidate;
}

export function loadPrivateHostingConfigDocument(
  root = process.cwd(),
): LoadedPrivateHostingConfig {
  const realRoot = realpathSync.native(resolve(root));
  const configPath = resolveRealRegularFile(
    realRoot,
    PRIVATE_HOSTING_CONFIG_PATH,
  );
  const bytes = readFileSync(configPath);
  return {
    config: parsePrivateHostingConfigBytes(bytes),
    bytes,
    sha256: sha256Hex(bytes),
    path: configPath,
  };
}

export function loadPrivateHostingConfig(
  root = process.cwd(),
): PrivateHostingConfigV1 {
  return loadPrivateHostingConfigDocument(root).config;
}

export const systemCommandRunner: CommandRunner = (invocation) => {
  const result = spawnSync(invocation.executable, [...invocation.args], {
    encoding: "utf8",
    input: invocation.stdin,
    shell: false,
    timeout: invocation.timeoutMs ?? 10_000,
    stdio: invocation.discardOutput
      ? ["pipe", "ignore", "ignore"]
      : ["pipe", "pipe", "pipe"],
  });
  if (result.error || result.status === null) {
    fail("a required local command could not be started");
  }
  return {
    status: result.status,
    stdout: invocation.discardOutput ? "" : (result.stdout ?? ""),
    stderr: invocation.discardOutput ? "" : (result.stderr ?? ""),
  };
};

export function assertExactNodeRuntime(
  config: PrivateHostingConfigV1,
  options: {
    nodeBinary?: string;
    runtimeNodeVersion?: string;
    runner?: CommandRunner;
  } = {},
): string {
  const runtimeNodeVersion =
    options.runtimeNodeVersion ?? process.versions.node;
  if (runtimeNodeVersion !== config.nodeVersion) {
    fail(`private hosting requires Node ${PRIVATE_REVIEW_NODE_VERSION}`);
  }
  const nodeBinary = options.nodeBinary ?? process.execPath;
  if (!isAbsolute(nodeBinary) || !existsSync(nodeBinary)) {
    fail("the selected Node binary must be an existing absolute path");
  }
  const nodeStat = lstatSync(nodeBinary);
  if (nodeStat.isSymbolicLink() || !nodeStat.isFile()) {
    fail("the selected Node binary must be a real regular file");
  }
  if ((nodeStat.mode & 0o111) === 0) {
    fail("the selected Node binary is not executable");
  }
  const realNodeBinary = realpathSync.native(nodeBinary);
  const result = (options.runner ?? systemCommandRunner)({
    executable: realNodeBinary,
    args: ["--version"],
  });
  if (
    result.status !== 0 ||
    result.stdout.trim() !== `v${PRIVATE_REVIEW_NODE_VERSION}`
  ) {
    fail(`selected Node binary is not Node ${PRIVATE_REVIEW_NODE_VERSION}`);
  }
  return realNodeBinary;
}

function assertDarwin(platform: NodeJS.Platform): void {
  if (platform !== "darwin") {
    fail("private service management is available only on macOS");
  }
}

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function replaceOne(
  template: string,
  placeholder: string,
  replacement: string,
): string {
  const pieces = template.split(placeholder);
  if (pieces.length !== 2) {
    fail("the LaunchAgent template has an invalid placeholder set");
  }
  return `${pieces[0]}${xmlEscape(replacement)}${pieces[1]}`;
}

function ensurePrivateStateDirectory(
  realRoot: string,
  homeDirectory: string,
  localName: string,
  uid: number,
): string {
  const realHome = realpathSync.native(resolve(homeDirectory));
  const applicationSupport = join(realHome, "Library", "Application Support");
  if (!existsSync(applicationSupport)) {
    fail("the user Application Support directory is absent");
  }
  const parentStat = lstatSync(applicationSupport);
  if (parentStat.isSymbolicLink() || !parentStat.isDirectory()) {
    fail("the user Application Support path is not a real directory");
  }
  const stateDirectory = join(applicationSupport, localName);
  if (isContainedPath(realRoot, stateDirectory)) {
    fail("local private-hosting state must remain outside the repository");
  }
  if (existsSync(stateDirectory)) {
    const stateStat = lstatSync(stateDirectory);
    if (
      stateStat.isSymbolicLink() ||
      !stateStat.isDirectory() ||
      stateStat.uid !== uid
    ) {
      fail("the private-hosting state path is not a user-owned real directory");
    }
  } else {
    mkdirSync(stateDirectory, { mode: 0o700 });
  }
  const installedState = lstatSync(stateDirectory);
  if (
    installedState.isSymbolicLink() ||
    !installedState.isDirectory() ||
    installedState.uid !== uid
  ) {
    fail("the private-hosting state directory ownership is invalid");
  }
  chmodSync(stateDirectory, 0o700);
  return realpathSync.native(stateDirectory);
}

function assertSafeLogTarget(path: string, uid: number): void {
  if (!existsSync(path)) return;
  const stat = lstatSync(path);
  if (
    stat.isSymbolicLink() ||
    !stat.isFile() ||
    stat.uid !== uid ||
    stat.nlink !== 1 ||
    (stat.mode & 0o077) !== 0
  ) {
    fail("a private service log target is not a private user-owned file");
  }
}

function fsyncDirectory(path: string): void {
  const descriptor = openSync(path, constants.O_RDONLY);
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function writeAtomicPrivateFile(target: string, contents: string): void {
  const parent = dirname(target);
  if (existsSync(target)) {
    const stat = lstatSync(target);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      fail("the rendered LaunchAgent target is not a real regular file");
    }
  }
  const temporary = join(parent, `.private-review-plist.${process.pid}.tmp`);
  let descriptor: number | null = null;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeFileSync(descriptor, contents, "utf8");
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    renameSync(temporary, target);
    chmodSync(target, 0o600);
    fsyncDirectory(parent);
  } catch (error) {
    if (descriptor !== null) closeSync(descriptor);
    if (existsSync(temporary)) unlinkSync(temporary);
    throw error;
  }
}

interface PreparedContext {
  config: PrivateHostingConfigV1;
  root: string;
  nodeBinary: string;
  runner: CommandRunner;
  uid: number;
  homeDirectory: string;
}

function prepareContext(
  dependencies: PrivateServiceDependencies,
): PreparedContext {
  assertDarwin(dependencies.platform ?? process.platform);
  const root = realpathSync.native(resolve(dependencies.root ?? process.cwd()));
  const config = loadPrivateHostingConfig(root);
  const runner = dependencies.runner ?? systemCommandRunner;
  const nodeBinary = assertExactNodeRuntime(config, {
    nodeBinary: dependencies.nodeBinary,
    runtimeNodeVersion: dependencies.runtimeNodeVersion,
    runner,
  });
  const uid = dependencies.uid ?? process.getuid?.();
  if (!Number.isSafeInteger(uid) || (uid as number) <= 0) {
    fail("a non-root local user id is required");
  }
  return {
    config,
    root,
    nodeBinary,
    runner,
    uid: uid as number,
    homeDirectory: dependencies.homeDirectory ?? homedir(),
  };
}

function renderPrepared(context: PreparedContext): RenderedLaunchAgent {
  const { config, root, nodeBinary, uid, homeDirectory } = context;
  const templatePath = resolveRealRegularFile(
    root,
    config.launchd.templatePath,
  );
  const tsxCliPath = resolveRealRegularFile(root, config.launchd.tsxCliPath);
  const serverScriptPath = resolveRealRegularFile(
    root,
    config.launchd.serverScriptPath,
  );
  const stateDirectory = ensurePrivateStateDirectory(
    root,
    homeDirectory,
    config.launchd.localStateDirectoryName,
    uid,
  );
  const stdoutLog = join(stateDirectory, "service.stdout.log");
  const stderrLog = join(stateDirectory, "service.stderr.log");
  assertSafeLogTarget(stdoutLog, uid);
  assertSafeLogTarget(stderrLog, uid);
  let rendered = readFileSync(templatePath, "utf8");
  for (const [placeholder, replacement] of [
    ["@@LABEL@@", config.launchd.label],
    ["@@NODE_BINARY@@", nodeBinary],
    ["@@TSX_CLI@@", tsxCliPath],
    ["@@SERVER_SCRIPT@@", serverScriptPath],
    ["@@REPOSITORY_ROOT@@", root],
    ["@@STDOUT_LOG@@", stdoutLog],
    ["@@STDERR_LOG@@", stderrLog],
  ] as const) {
    rendered = replaceOne(rendered, placeholder, replacement);
  }
  if (rendered.includes("@@")) {
    fail("the rendered LaunchAgent contains an unresolved placeholder");
  }
  const plistPath = join(stateDirectory, config.launchd.renderedPlistName);
  writeAtomicPrivateFile(plistPath, rendered);
  requireSuccessfulCommand(context.runner, {
    executable: PLUTIL_PATH,
    args: ["-lint", plistPath],
    discardOutput: true,
  });
  return {
    label: PRIVATE_REVIEW_LAUNCHD_LABEL,
    path: plistPath,
    localStateDirectory: stateDirectory,
  };
}

export function renderPrivateReviewLaunchAgent(
  dependencies: PrivateServiceDependencies = {},
): RenderedLaunchAgent {
  return renderPrepared(prepareContext(dependencies));
}

function requireSuccessfulCommand(
  runner: CommandRunner,
  invocation: CommandInvocation,
): CommandResult {
  const result = runner(invocation);
  if (result.status !== 0) {
    fail("private service management command failed");
  }
  return result;
}

export function runPrivateReviewServiceAction(
  action: PrivateServiceAction,
  dependencies: PrivateServiceDependencies = {},
): { rendered?: RenderedLaunchAgent; result?: CommandResult } {
  const context = prepareContext(dependencies);
  const serviceTarget = `gui/${context.uid}/${PRIVATE_REVIEW_LAUNCHD_LABEL}`;
  switch (action) {
    case "render":
      return { rendered: renderPrepared(context) };
    case "load": {
      const rendered = renderPrepared(context);
      const result = requireSuccessfulCommand(context.runner, {
        executable: LAUNCHCTL_PATH,
        args: ["bootstrap", `gui/${context.uid}`, rendered.path],
      });
      return { rendered, result };
    }
    case "unload":
      return {
        result: requireSuccessfulCommand(context.runner, {
          executable: LAUNCHCTL_PATH,
          args: ["bootout", serviceTarget],
        }),
      };
    case "restart":
      return {
        result: requireSuccessfulCommand(context.runner, {
          executable: LAUNCHCTL_PATH,
          args: ["kickstart", "-k", serviceTarget],
        }),
      };
    case "status":
      return {
        result: requireSuccessfulCommand(context.runner, {
          executable: LAUNCHCTL_PATH,
          args: ["print", serviceTarget],
        }),
      };
  }
}

export function runPrivateServiceCli(
  argv: readonly string[],
  dependencies: PrivateServiceDependencies = {},
): number {
  try {
    if (
      argv.length !== 1 ||
      !["render", "load", "unload", "restart", "status"].includes(
        argv[0] as string,
      )
    ) {
      console.error(
        "usage: manage-private-review-service.ts <render|load|unload|restart|status>",
      );
      return 2;
    }
    const action = argv[0] as PrivateServiceAction;
    const outcome = runPrivateReviewServiceAction(action, dependencies);
    if (action === "status" && outcome.result?.stdout) {
      process.stdout.write(outcome.result.stdout);
    } else {
      console.log(`private-review service action ${action} completed`);
    }
    return 0;
  } catch (error) {
    console.error(
      `private-review service: ${error instanceof Error ? error.message : "operation failed"}`,
    );
    return 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runPrivateServiceCli(process.argv.slice(2)));
}
