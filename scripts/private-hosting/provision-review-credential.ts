/**
 * Provision the private review HTTP credential without putting verifier bytes
 * in argv, environment variables, tracked files, stdout, stderr, or logs.
 *
 * The raw password is generated from 256 bits of system entropy and is written
 * only to the owner-authorized, mode-0600 local handoff file. Keychain receives
 * a versioned scrypt verifier through `security -i` child stdin.
 */

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  openSync,
  readSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
} from "../../src/lib/contracts/canonical.ts";
import {
  assertExactNodeRuntime,
  LAUNCHCTL_PATH,
  loadPrivateHostingConfig,
  PRIVATE_REVIEW_LAUNCHD_LABEL,
  type CommandInvocation,
  type CommandResult,
  type CommandRunner,
  type PrivateHostingConfigV1,
  systemCommandRunner,
} from "./manage-private-review-service.ts";

export const REVIEW_ACCESS_INFO_PATH =
  "/Users/ethanai/co-work/online_sportsinjury/.claude/g4-access-info.txt";
export const SECURITY_CLI_PATH = "/usr/bin/security";
export const LSOF_PATH = "/usr/sbin/lsof";
export const SCRYPT_VERIFIER_TOKEN_PREFIX = "atlas-scrypt-v1.";

const LAUNCHCTL_NOT_FOUND_STATUS = 113;
const ACCESS_INFO_ORIGIN = "http://100.114.3.93:8140";
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;
const SAFE_KEYCHAIN_TOKEN_RE = /^[A-Za-z0-9._-]+$/;
const SAFE_KEYCHAIN_FIELD_RE = /^[A-Za-z0-9._-]+$/;
const MAX_SCRYPT_MEMORY = 64 * 1024 * 1024;
const MAX_VERIFIER_TOKEN_LENGTH = 2_048;

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

export interface ReviewAccessInfoV1 {
  schemaVersion: 1;
  origin: typeof ACCESS_INFO_ORIGIN;
  username: "atlas-reviewer";
  password: string;
}

export interface TtyPort {
  readLine(prompt: string): string;
  write(message: string): void;
  close?(): void;
}

export interface CredentialProvisionDependencies {
  root?: string;
  nodeBinary?: string;
  runtimeNodeVersion?: string;
  platform?: NodeJS.Platform;
  uid?: number;
  runner?: CommandRunner;
  tty?: TtyPort;
  accessInfoPath?: string;
  randomBytes?: (size: number) => Buffer;
  deriveKey?: (
    password: string,
    salt: Buffer,
    parameters: PrivateHostingConfigV1["authentication"]["scrypt"],
  ) => Buffer;
}

export type CredentialProvisionResult =
  | { status: "cancelled" }
  | {
      status: "provisioned";
      credentialGeneration: number;
      replacedExisting: boolean;
      accessInfoPath: string;
    };

export class PrivateCredentialProvisionError extends Error {}

class AccessInfoInstalledButNotSyncedError extends Error {}

function fail(message: string): never {
  throw new PrivateCredentialProvisionError(message);
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function decodeCanonicalBase64url(value: string, byteLength: number): Buffer {
  if (!BASE64URL_RE.test(value)) fail("verifier encoding is invalid");
  const decoded = Buffer.from(value, "base64url");
  if (
    decoded.length !== byteLength ||
    decoded.toString("base64url") !== value
  ) {
    fail("verifier encoding is invalid");
  }
  return decoded;
}

function validateVerifier(value: unknown): ScryptVerifierV1 {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
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
    value.schemaVersion !== 1 ||
    value.algorithm !== "scrypt-v1" ||
    typeof value.salt !== "string" ||
    typeof value.derivedKey !== "string" ||
    value.N !== 16_384 ||
    value.r !== 8 ||
    value.p !== 1 ||
    value.keyLength !== 32 ||
    !Number.isSafeInteger(value.credentialGeneration) ||
    (value.credentialGeneration as number) < 1
  ) {
    fail("verifier schema is invalid");
  }
  decodeCanonicalBase64url(value.salt, 32);
  decodeCanonicalBase64url(value.derivedKey, 32);
  return value as unknown as ScryptVerifierV1;
}

export function encodeScryptVerifierToken(verifier: ScryptVerifierV1): string {
  const validated = validateVerifier(verifier);
  const payload = Buffer.from(canonicalJson(validated), "utf8").toString(
    "base64url",
  );
  const token = `${SCRYPT_VERIFIER_TOKEN_PREFIX}${payload}`;
  if (!SAFE_KEYCHAIN_TOKEN_RE.test(token)) {
    fail("verifier token is not safe for Keychain interactive input");
  }
  return token;
}

export function parseScryptVerifierToken(token: string): ScryptVerifierV1 {
  if (
    token.length > MAX_VERIFIER_TOKEN_LENGTH ||
    !token.startsWith(SCRYPT_VERIFIER_TOKEN_PREFIX) ||
    !SAFE_KEYCHAIN_TOKEN_RE.test(token)
  ) {
    fail("Keychain verifier token is invalid");
  }
  const payload = token.slice(SCRYPT_VERIFIER_TOKEN_PREFIX.length);
  if (!BASE64URL_RE.test(payload)) fail("Keychain verifier token is invalid");
  const decodedBytes = Buffer.from(payload, "base64url");
  if (decodedBytes.toString("base64url") !== payload) {
    fail("Keychain verifier token is invalid");
  }
  let decoded: string;
  try {
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(decodedBytes);
  } catch {
    return fail("Keychain verifier token is invalid");
  }
  let parsed: unknown;
  try {
    parsed = parseStrictJson(decoded);
  } catch {
    return fail("Keychain verifier token is invalid");
  }
  const verifier = validateVerifier(parsed);
  if (canonicalJson(verifier) !== decoded) {
    fail("Keychain verifier token is not canonical");
  }
  return verifier;
}

export function parseReviewAccessInfoBytes(
  bytes: string | Uint8Array,
): ReviewAccessInfoV1 {
  let text: string;
  try {
    text =
      typeof bytes === "string"
        ? bytes
        : new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return fail("local access information is not valid UTF-8");
  }
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch {
    return fail("local access information is not strict JSON");
  }
  if (
    !isRecord(parsed) ||
    !exactKeys(parsed, ["schemaVersion", "origin", "username", "password"]) ||
    parsed.schemaVersion !== 1 ||
    parsed.origin !== ACCESS_INFO_ORIGIN ||
    parsed.username !== "atlas-reviewer" ||
    typeof parsed.password !== "string" ||
    !BASE64URL_RE.test(parsed.password) ||
    Buffer.from(parsed.password, "base64url").length !== 32 ||
    Buffer.from(parsed.password, "base64url").toString("base64url") !==
      parsed.password
  ) {
    fail("local access information schema is invalid");
  }
  const accessInfo = parsed as unknown as ReviewAccessInfoV1;
  if (canonicalJson(accessInfo) !== text) {
    fail("local access information is not canonical");
  }
  return accessInfo;
}

class DeviceTtyPort implements TtyPort {
  private readonly descriptor: number;

  constructor() {
    const ttyPath = "/dev/tty";
    const stat = lstatSync(ttyPath);
    if (stat.isSymbolicLink() || !stat.isCharacterDevice()) {
      fail("/dev/tty is not an available terminal device");
    }
    this.descriptor = openSync(
      ttyPath,
      constants.O_RDWR | constants.O_NOFOLLOW,
    );
    if (!fstatSync(this.descriptor).isCharacterDevice()) {
      closeSync(this.descriptor);
      fail("/dev/tty changed while opening it");
    }
  }

  readLine(prompt: string): string {
    this.write(prompt);
    const bytes: number[] = [];
    const byte = Buffer.alloc(1);
    while (bytes.length <= 128) {
      const count = readSync(this.descriptor, byte, 0, 1, null);
      if (count !== 1) fail("terminal confirmation was unavailable");
      if (byte[0] === 0x0a) break;
      if (byte[0] !== 0x0d) bytes.push(byte[0] as number);
    }
    if (bytes.length > 128) fail("terminal confirmation was too long");
    return Buffer.from(bytes).toString("utf8");
  }

  write(message: string): void {
    writeSync(this.descriptor, message, null, "utf8");
  }

  close(): void {
    closeSync(this.descriptor);
  }
}

interface ExistingKeychainState {
  exists: boolean;
  token?: string;
  verifier?: ScryptVerifierV1;
}

function invoke(
  runner: CommandRunner,
  invocation: CommandInvocation,
): CommandResult {
  return runner(invocation);
}

function readExistingKeychainVerifier(
  runner: CommandRunner,
  config: PrivateHostingConfigV1,
): ExistingKeychainState {
  const result = invoke(runner, {
    executable: SECURITY_CLI_PATH,
    args: [
      "find-generic-password",
      "-a",
      config.authentication.keychainAccount,
      "-s",
      config.authentication.keychainService,
      "-w",
    ],
  });
  if (result.status === 44) return { exists: false };
  if (result.status !== 0) fail("Keychain verifier lookup failed");
  if (
    result.stdout.length > MAX_VERIFIER_TOKEN_LENGTH + 1 ||
    !result.stdout.endsWith("\n") ||
    result.stdout.slice(0, -1).includes("\n")
  ) {
    fail("Keychain verifier output is malformed");
  }
  const token = result.stdout.slice(0, -1);
  try {
    return { exists: true, token, verifier: parseScryptVerifierToken(token) };
  } catch (error) {
    if (!(error instanceof PrivateCredentialProvisionError)) throw error;
    return { exists: true, token };
  }
}

function assertSafeKeychainFields(config: PrivateHostingConfigV1): void {
  if (
    !SAFE_KEYCHAIN_FIELD_RE.test(config.authentication.keychainAccount) ||
    !SAFE_KEYCHAIN_FIELD_RE.test(config.authentication.keychainService)
  ) {
    fail("fixed Keychain identity is not safe for interactive input");
  }
}

function writeKeychainVerifier(
  runner: CommandRunner,
  config: PrivateHostingConfigV1,
  token: string,
): void {
  assertSafeKeychainFields(config);
  if (!SAFE_KEYCHAIN_TOKEN_RE.test(token)) {
    fail("verifier token is not safe for Keychain interactive input");
  }
  const command =
    `add-generic-password -a ${config.authentication.keychainAccount} ` +
    `-s ${config.authentication.keychainService} -U -w ${token}\n`;
  const result = invoke(runner, {
    executable: SECURITY_CLI_PATH,
    args: ["-i"],
    stdin: command,
    discardOutput: true,
  });
  if (result.status !== 0) fail("Keychain verifier update failed");
}

function deleteKeychainVerifier(
  runner: CommandRunner,
  config: PrivateHostingConfigV1,
): void {
  assertSafeKeychainFields(config);
  const command =
    `delete-generic-password -a ${config.authentication.keychainAccount} ` +
    `-s ${config.authentication.keychainService}\n`;
  const result = invoke(runner, {
    executable: SECURITY_CLI_PATH,
    args: ["-i"],
    stdin: command,
    discardOutput: true,
  });
  if (result.status !== 0 && result.status !== 44) {
    fail("Keychain verifier rollback failed");
  }
  if (readExistingKeychainVerifier(runner, config).exists) {
    fail("Keychain verifier remained after rollback");
  }
}

function rollbackKeychainVerifier(
  runner: CommandRunner,
  config: PrivateHostingConfigV1,
  previous: ExistingKeychainState,
): void {
  if (previous.exists) {
    if (
      previous.token === undefined ||
      previous.token.length > MAX_VERIFIER_TOKEN_LENGTH ||
      !SAFE_KEYCHAIN_TOKEN_RE.test(previous.token)
    ) {
      fail("prior Keychain verifier cannot be restored safely");
    }
    writeKeychainVerifier(runner, config, previous.token);
    verifyKeychainReadback(runner, config, previous.token);
  } else {
    deleteKeychainVerifier(runner, config);
  }
}

function verifyKeychainReadback(
  runner: CommandRunner,
  config: PrivateHostingConfigV1,
  expectedToken: string,
): void {
  const stored = readExistingKeychainVerifier(runner, config);
  if (!stored.exists || stored.token === undefined) {
    fail("Keychain verifier readback failed");
  }
  const actualBytes = Buffer.from(stored.token, "utf8");
  const expectedBytes = Buffer.from(expectedToken, "utf8");
  if (
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  ) {
    fail("Keychain verifier readback did not match");
  }
}

function stopExactServiceIfLoaded(runner: CommandRunner, uid: number): void {
  const target = `gui/${uid}/${PRIVATE_REVIEW_LAUNCHD_LABEL}`;
  const before = invoke(runner, {
    executable: LAUNCHCTL_PATH,
    args: ["print", target],
    discardOutput: true,
  });
  if (before.status === LAUNCHCTL_NOT_FOUND_STATUS) return;
  if (before.status !== 0) {
    fail("could not determine exact private service state");
  }
  const bootout = invoke(runner, {
    executable: LAUNCHCTL_PATH,
    args: ["bootout", target],
    discardOutput: true,
  });
  if (bootout.status !== 0) fail("exact private service bootout failed");
  const after = invoke(runner, {
    executable: LAUNCHCTL_PATH,
    args: ["print", target],
    discardOutput: true,
  });
  if (after.status !== LAUNCHCTL_NOT_FOUND_STATUS) {
    fail("private service remained loaded after bootout");
  }
}

function requirePrivateReviewPortClosed(runner: CommandRunner): void {
  const result = invoke(runner, {
    executable: LSOF_PATH,
    args: ["-nP", "-iTCP:8140", "-sTCP:LISTEN"],
  });
  if (result.status !== 1 || result.stdout !== "" || result.stderr !== "") {
    fail("TCP port 8140 must be closed before credential replacement");
  }
}

interface AccessInfoTargetState {
  target: string;
  parent: string;
  parentDevice: bigint;
  parentInode: bigint;
  existed: boolean;
  device?: bigint;
  inode?: bigint;
  size?: bigint;
  modifiedAt?: bigint;
  changedAt?: bigint;
  owner?: bigint;
  mode?: bigint;
  linkCount?: bigint;
}

function inspectAccessInfoTarget(
  path: string,
  uid: number,
): AccessInfoTargetState {
  if (!isAbsolute(path)) fail("local access information path must be absolute");
  const resolvedTarget = resolve(path);
  const parentPath = dirname(resolvedTarget);
  const parentStat = lstatSync(parentPath, { bigint: true });
  if (
    parentStat.isSymbolicLink() ||
    !parentStat.isDirectory() ||
    parentStat.uid !== BigInt(uid) ||
    (parentStat.mode & 0o022n) !== 0n
  ) {
    fail(
      "local access information parent is not a private user-owned directory",
    );
  }
  const parent = realpathSync.native(parentPath);
  const target = join(parent, basename(resolvedTarget));
  if (!existsSync(target)) {
    return {
      target,
      parent,
      parentDevice: parentStat.dev,
      parentInode: parentStat.ino,
      existed: false,
    };
  }
  const stat = lstatSync(target, { bigint: true });
  if (
    stat.isSymbolicLink() ||
    !stat.isFile() ||
    stat.uid !== BigInt(uid) ||
    stat.nlink !== 1n ||
    (stat.mode & 0o077n) !== 0n
  ) {
    fail("existing local access information is not a private regular file");
  }
  return {
    target,
    parent,
    parentDevice: parentStat.dev,
    parentInode: parentStat.ino,
    existed: true,
    device: stat.dev,
    inode: stat.ino,
    size: stat.size,
    modifiedAt: stat.mtimeNs,
    changedAt: stat.ctimeNs,
    owner: stat.uid,
    mode: stat.mode,
    linkCount: stat.nlink,
  };
}

interface StagedAccessInfo {
  temporary: string;
  state: AccessInfoTargetState;
}

function stageAccessInfo(
  state: AccessInfoTargetState,
  bytes: string,
): StagedAccessInfo {
  let descriptor: number | null = null;
  let temporary = "";
  for (let attempt = 0; attempt < 16; attempt += 1) {
    temporary = join(
      state.parent,
      `.g4-access-info.${process.pid}.${attempt}.tmp`,
    );
    try {
      descriptor = openSync(
        temporary,
        constants.O_WRONLY |
          constants.O_CREAT |
          constants.O_EXCL |
          constants.O_NOFOLLOW,
        0o600,
      );
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }
  if (descriptor === null) fail("could not stage local access information");
  try {
    try {
      writeFileSync(descriptor, bytes, "utf8");
      fsyncSync(descriptor);
      const stat = fstatSync(descriptor);
      if (!stat.isFile() || (stat.mode & 0o777) !== 0o600) {
        fail("staged local access information permissions are invalid");
      }
    } finally {
      closeSync(descriptor);
    }
  } catch (error) {
    if (temporary !== "" && existsSync(temporary)) unlinkSync(temporary);
    throw error;
  }
  return { temporary, state };
}

function installStagedAccessInfo(staged: StagedAccessInfo): void {
  const { state } = staged;
  const currentParent = lstatSync(state.parent, { bigint: true });
  if (
    currentParent.isSymbolicLink() ||
    !currentParent.isDirectory() ||
    currentParent.dev !== state.parentDevice ||
    currentParent.ino !== state.parentInode
  ) {
    fail("local access information parent changed before installation");
  }
  if (state.existed) {
    if (!existsSync(state.target)) {
      fail("local access information changed before replacement");
    }
    const current = lstatSync(state.target, { bigint: true });
    if (
      current.isSymbolicLink() ||
      !current.isFile() ||
      current.dev !== state.device ||
      current.ino !== state.inode ||
      // An unlinked inode can be reused immediately; an in-place edit also
      // preserves identity. Recheck the inspected metadata before replacing it.
      current.size !== state.size ||
      current.mtimeNs !== state.modifiedAt ||
      current.ctimeNs !== state.changedAt ||
      current.uid !== state.owner ||
      current.mode !== state.mode ||
      current.nlink !== state.linkCount
    ) {
      fail("local access information changed before replacement");
    }
  } else if (existsSync(state.target)) {
    fail("local access information appeared before installation");
  }
  let installed = false;
  let parentDescriptor: number | null = null;
  try {
    parentDescriptor = openSync(state.parent, constants.O_RDONLY);
    renameSync(staged.temporary, state.target);
    installed = true;
    fsyncSync(parentDescriptor);
  } catch (error) {
    if (installed) {
      throw new AccessInfoInstalledButNotSyncedError(
        "access information was installed but its directory sync failed",
        { cause: error },
      );
    }
    throw error;
  } finally {
    if (parentDescriptor !== null) {
      try {
        closeSync(parentDescriptor);
      } catch (error) {
        if (installed) {
          throw new AccessInfoInstalledButNotSyncedError(
            "access information was installed but its directory close failed",
            { cause: error },
          );
        }
        throw error;
      }
    }
  }
}

function deriveVerifier(
  password: string,
  salt: Buffer,
  config: PrivateHostingConfigV1,
  generation: number,
  deriveKey: NonNullable<CredentialProvisionDependencies["deriveKey"]>,
): ScryptVerifierV1 {
  let derivedKey: Buffer;
  try {
    derivedKey = deriveKey(password, salt, config.authentication.scrypt);
  } catch {
    return fail("credential derivation failed");
  }
  if (derivedKey.length !== config.authentication.scrypt.keyLength) {
    fail("credential derivation returned an invalid key length");
  }
  return {
    schemaVersion: 1,
    algorithm: "scrypt-v1",
    salt: salt.toString("base64url"),
    derivedKey: derivedKey.toString("base64url"),
    N: 16_384,
    r: 8,
    p: 1,
    keyLength: 32,
    credentialGeneration: generation,
  };
}

export function provisionReviewCredential(
  dependencies: CredentialProvisionDependencies = {},
): CredentialProvisionResult {
  if ((dependencies.platform ?? process.platform) !== "darwin") {
    fail("private credential provisioning is available only on macOS");
  }
  const uid = dependencies.uid ?? process.getuid?.();
  if (!Number.isSafeInteger(uid) || (uid as number) <= 0) {
    fail("a non-root local user id is required");
  }
  const root = realpathSync.native(resolve(dependencies.root ?? process.cwd()));
  const config = loadPrivateHostingConfig(root);
  const runner = dependencies.runner ?? systemCommandRunner;
  assertExactNodeRuntime(config, {
    nodeBinary: dependencies.nodeBinary,
    runtimeNodeVersion: dependencies.runtimeNodeVersion,
    runner,
  });
  const accessState = inspectAccessInfoTarget(
    dependencies.accessInfoPath ?? REVIEW_ACCESS_INFO_PATH,
    uid as number,
  );
  const existingKeychain = readExistingKeychainVerifier(runner, config);
  if (
    existingKeychain.exists &&
    (existingKeychain.token === undefined ||
      existingKeychain.token.length > MAX_VERIFIER_TOKEN_LENGTH ||
      !SAFE_KEYCHAIN_TOKEN_RE.test(existingKeychain.token))
  ) {
    fail("existing Keychain verifier cannot be rotated safely");
  }
  const replacing = existingKeychain.exists || accessState.existed;
  const ownsTty = dependencies.tty === undefined;
  const tty = dependencies.tty ?? new DeviceTtyPort();
  let staged: StagedAccessInfo | undefined;
  try {
    if (replacing) {
      const confirmation = tty.readLine(
        "Existing private-review credential state was found. Type REPLACE to rotate it: ",
      );
      if (confirmation !== "REPLACE") {
        tty.write("Credential rotation cancelled.\n");
        return { status: "cancelled" };
      }
    } else {
      tty.write("Creating the initial private-review credential.\n");
    }

    stopExactServiceIfLoaded(runner, uid as number);
    requirePrivateReviewPortClosed(runner);
    const generation = existingKeychain.verifier
      ? existingKeychain.verifier.credentialGeneration + 1
      : 1;
    if (!Number.isSafeInteger(generation)) {
      fail("credential generation counter is exhausted");
    }
    const entropy = dependencies.randomBytes ?? randomBytes;
    const passwordBytes = entropy(32);
    const salt = entropy(config.authentication.scrypt.saltBytes);
    if (passwordBytes.length !== 32 || salt.length !== 32) {
      fail("credential entropy source returned an invalid length");
    }
    const password = passwordBytes.toString("base64url");
    const deriveKey =
      dependencies.deriveKey ??
      ((candidatePassword, candidateSalt, parameters) =>
        scryptSync(candidatePassword, candidateSalt, parameters.keyLength, {
          N: parameters.N,
          r: parameters.r,
          p: parameters.p,
          maxmem: MAX_SCRYPT_MEMORY,
        }));
    const verifier = deriveVerifier(
      password,
      salt,
      config,
      generation,
      deriveKey,
    );
    const token = encodeScryptVerifierToken(verifier);
    const accessInfo = canonicalJson({
      schemaVersion: 1,
      origin: ACCESS_INFO_ORIGIN,
      username: config.authentication.username,
      password,
    } satisfies ReviewAccessInfoV1);
    parseReviewAccessInfoBytes(accessInfo);
    staged = stageAccessInfo(accessState, accessInfo);
    let keychainMutationAttempted = false;
    try {
      keychainMutationAttempted = true;
      writeKeychainVerifier(runner, config, token);
      verifyKeychainReadback(runner, config, token);
      installStagedAccessInfo(staged);
    } catch (error) {
      if (error instanceof AccessInfoInstalledButNotSyncedError) {
        staged = undefined;
        return fail(
          "credential was installed but local directory durability could not be confirmed; service remains unloaded",
        );
      }
      if (keychainMutationAttempted) {
        try {
          rollbackKeychainVerifier(runner, config, existingKeychain);
        } catch {
          return fail(
            "credential update failed and prior Keychain state could not be restored",
          );
        }
      }
      return fail(
        "credential update failed; prior Keychain state was restored",
      );
    }
    staged = undefined;
    tty.write("Private-review credential saved to the local access file.\n");
    return {
      status: "provisioned",
      credentialGeneration: generation,
      replacedExisting: replacing,
      accessInfoPath: accessState.target,
    };
  } finally {
    if (staged && existsSync(staged.temporary)) {
      unlinkSync(staged.temporary);
    }
    if (ownsTty) tty.close?.();
  }
}

export function runCredentialProvisionCli(
  argv: readonly string[],
  dependencies: CredentialProvisionDependencies = {},
): number {
  try {
    if (argv.length !== 0) {
      console.error("usage: provision-review-credential.ts");
      return 2;
    }
    const result = provisionReviewCredential(dependencies);
    if (result.status === "cancelled") {
      console.log("private-review credential provisioning cancelled");
      return 0;
    }
    console.log("private-review credential provisioning completed");
    return 0;
  } catch (error) {
    console.error(
      `private-review credential: ${error instanceof Error ? error.message : "operation failed"}`,
    );
    return 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runCredentialProvisionCli(process.argv.slice(2)));
}
