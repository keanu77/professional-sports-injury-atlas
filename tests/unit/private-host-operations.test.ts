import { scryptSync } from "node:crypto";
import {
  chmodSync,
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
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import { REVIEW_SET_V2_MANIFEST_PATH } from "../../src/lib/governance/review-set";
import {
  LAUNCHCTL_PATH,
  loadPrivateHostingConfigDocument,
  parsePrivateHostingConfigBytes,
  PLUTIL_PATH,
  PRIVATE_REVIEW_LAUNCHD_LABEL,
  renderPrivateReviewLaunchAgent,
  runPrivateReviewServiceAction,
  type CommandInvocation,
  type CommandResult,
  type CommandRunner,
  type PrivateServiceDependencies,
} from "../../scripts/private-hosting/manage-private-review-service";
import {
  encodeScryptVerifierToken,
  LSOF_PATH,
  parseReviewAccessInfoBytes,
  parseScryptVerifierToken,
  provisionReviewCredential,
  SECURITY_CLI_PATH,
  type CredentialProvisionDependencies,
  type ReviewAccessInfoV1,
  type TtyPort,
} from "../../scripts/private-hosting/provision-review-credential";
import { parseScryptVerifierToken as parseGatewayVerifierToken } from "../../scripts/private-hosting/serve-private-review";

const PROJECT_ROOT = resolve(import.meta.dirname, "../..");
const CONFIG_BYTES = readFileSync(
  join(PROJECT_ROOT, "ops/private-hosting.v1.json"),
);
const PLIST_TEMPLATE_BYTES = readFileSync(
  join(
    PROJECT_ROOT,
    "ops/launchd/tw.sportsmedicine.atlas.private-review.plist.template",
  ),
);
const TEST_UID = process.getuid?.() ?? 501;
const ACCESS_ORIGIN = "http://100.114.3.93:8140";
const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

interface OperationsFixture {
  scratch: string;
  root: string;
  home: string;
  nodeBinary: string;
  accessPath: string;
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

function operationsFixture(): OperationsFixture {
  const scratch = mkdtempSync(join(tmpdir(), "atlas-private-operations-"));
  roots.push(scratch);
  const root = join(scratch, "repository");
  const home = join(scratch, "home");
  mkdirSync(root, { recursive: true });
  mkdirSync(join(home, "Library", "Application Support"), {
    recursive: true,
    mode: 0o700,
  });
  write(root, "ops/private-hosting.v1.json", CONFIG_BYTES);
  write(
    root,
    "ops/launchd/tw.sportsmedicine.atlas.private-review.plist.template",
    PLIST_TEMPLATE_BYTES,
  );
  write(
    root,
    "scripts/private-hosting/serve-private-review.ts",
    "export {};\n",
  );
  write(root, "node_modules/tsx/dist/cli.mjs", "export {};\n", 0o755);
  const nodeBinary = realpathSync(
    write(root, "runtime/node", "node-fixture\n", 0o755),
  );
  const accessParent = join(scratch, "access");
  mkdirSync(accessParent, { mode: 0o700 });
  chmodSync(accessParent, 0o700);
  return {
    scratch,
    root,
    home,
    nodeBinary,
    accessPath: join(accessParent, "g4-access-info.txt"),
  };
}

interface RecordedInvocation extends CommandInvocation {
  args: readonly string[];
}

function commandResult(status = 0, stdout = "", stderr = ""): CommandResult {
  return { status, stdout, stderr };
}

function managerDependencies(
  fixture: OperationsFixture,
  calls: RecordedInvocation[],
  override?: (invocation: CommandInvocation) => CommandResult | undefined,
): PrivateServiceDependencies {
  const runner: CommandRunner = (invocation) => {
    calls.push({ ...invocation, args: [...invocation.args] });
    const overridden = override?.(invocation);
    if (overridden) return overridden;
    if (
      invocation.executable === fixture.nodeBinary &&
      invocation.args.length === 1 &&
      invocation.args[0] === "--version"
    ) {
      return commandResult(0, "v24.14.0\n");
    }
    if (invocation.executable === PLUTIL_PATH) return commandResult();
    if (invocation.executable === LAUNCHCTL_PATH) return commandResult();
    throw new Error("unexpected synthetic manager command");
  };
  return {
    root: fixture.root,
    homeDirectory: fixture.home,
    nodeBinary: fixture.nodeBinary,
    runtimeNodeVersion: "24.14.0",
    platform: "darwin",
    uid: TEST_UID,
    runner,
  };
}

function verifierToken(generation = 1, saltByte = 3, keyByte = 7): string {
  return encodeScryptVerifierToken({
    schemaVersion: 1,
    algorithm: "scrypt-v1",
    salt: Buffer.alloc(32, saltByte).toString("base64url"),
    derivedKey: Buffer.alloc(32, keyByte).toString("base64url"),
    N: 16_384,
    r: 8,
    p: 1,
    keyLength: 32,
    credentialGeneration: generation,
  });
}

function accessInfo(passwordByte: number): string {
  return canonicalJson({
    schemaVersion: 1,
    origin: ACCESS_ORIGIN,
    username: "atlas-reviewer",
    password: Buffer.alloc(32, passwordByte).toString("base64url"),
  } satisfies ReviewAccessInfoV1);
}

interface SyntheticCredentialState {
  token: string | null;
  serviceLoaded: boolean;
  portClosed: boolean;
  calls: RecordedInvocation[];
  afterFirstUpdatedRead?: () => void;
}

function credentialRunner(
  fixture: OperationsFixture,
  state: SyntheticCredentialState,
): CommandRunner {
  let updateCount = 0;
  let readHookCalled = false;
  return (invocation) => {
    state.calls.push({ ...invocation, args: [...invocation.args] });
    if (
      invocation.executable === fixture.nodeBinary &&
      invocation.args.length === 1 &&
      invocation.args[0] === "--version"
    ) {
      return commandResult(0, "v24.14.0\n");
    }
    if (
      invocation.executable === SECURITY_CLI_PATH &&
      invocation.args[0] === "find-generic-password"
    ) {
      if (updateCount > 0 && !readHookCalled) {
        readHookCalled = true;
        state.afterFirstUpdatedRead?.();
      }
      return state.token === null
        ? commandResult(44)
        : commandResult(0, `${state.token}\n`);
    }
    if (
      invocation.executable === SECURITY_CLI_PATH &&
      invocation.args.length === 1 &&
      invocation.args[0] === "-i"
    ) {
      const input = String(invocation.stdin ?? "");
      if (input.startsWith("delete-generic-password ")) {
        state.token = null;
        return commandResult();
      }
      const match = / -w ([A-Za-z0-9._-]+)\n$/u.exec(input);
      if (!match) throw new Error("synthetic Keychain input was malformed");
      state.token = match[1] as string;
      updateCount += 1;
      return commandResult();
    }
    if (
      invocation.executable === LAUNCHCTL_PATH &&
      invocation.args[0] === "print"
    ) {
      return state.serviceLoaded ? commandResult() : commandResult(113);
    }
    if (
      invocation.executable === LAUNCHCTL_PATH &&
      invocation.args[0] === "bootout"
    ) {
      state.serviceLoaded = false;
      return commandResult();
    }
    if (invocation.executable === LSOF_PATH) {
      return state.portClosed ? commandResult(1) : commandResult();
    }
    throw new Error("unexpected synthetic credential command");
  };
}

function tty(confirmation = "REPLACE"): {
  port: TtyPort;
  messages: string[];
  prompts: string[];
} {
  const messages: string[] = [];
  const prompts: string[] = [];
  return {
    messages,
    prompts,
    port: {
      readLine(prompt) {
        prompts.push(prompt);
        return confirmation;
      },
      write(message) {
        messages.push(message);
      },
    },
  };
}

function credentialDependencies(
  fixture: OperationsFixture,
  state: SyntheticCredentialState,
  terminal: TtyPort,
): CredentialProvisionDependencies {
  let entropyCall = 0;
  return {
    root: fixture.root,
    nodeBinary: fixture.nodeBinary,
    runtimeNodeVersion: "24.14.0",
    platform: "darwin",
    uid: TEST_UID,
    runner: credentialRunner(fixture, state),
    tty: terminal,
    accessInfoPath: fixture.accessPath,
    randomBytes(size) {
      entropyCall += 1;
      return Buffer.alloc(size, 20 + entropyCall);
    },
    deriveKey(_password, _salt, parameters) {
      return Buffer.alloc(parameters.keyLength, 99);
    },
  };
}

describe("private-hosting operations", () => {
  it("strictly parses the fixed config and hashes its exact tracked bytes", () => {
    const fixture = operationsFixture();
    expect(parsePrivateHostingConfigBytes(CONFIG_BYTES)).toMatchObject({
      nodeVersion: "24.14.0",
      artifact: { reviewSetPath: REVIEW_SET_V2_MANIFEST_PATH },
      launchd: { label: PRIVATE_REVIEW_LAUNCHD_LABEL },
    });
    const loaded = loadPrivateHostingConfigDocument(fixture.root);
    expect(loaded.bytes.equals(CONFIG_BYTES)).toBe(true);
    expect(loaded.sha256).toBe(sha256Hex(CONFIG_BYTES));

    const duplicate = CONFIG_BYTES.toString("utf8").replace(
      '"schemaVersion": 1,',
      '"schemaVersion": 1,\n  "schemaVersion": 1,',
    );
    expect(() => parsePrivateHostingConfigBytes(duplicate)).toThrow(
      /strict JSON/u,
    );
    const unknown = JSON.parse(CONFIG_BYTES.toString("utf8")) as Record<
      string,
      unknown
    >;
    unknown.testBypass = true;
    expect(() =>
      parsePrivateHostingConfigBytes(JSON.stringify(unknown)),
    ).toThrow(/invalid field set/u);
    expect(() =>
      parsePrivateHostingConfigBytes(
        CONFIG_BYTES.toString("utf8").replace(
          PRIVATE_REVIEW_LAUNCHD_LABEL,
          "tw.sportsmedicine.atlas.private-review.other",
        ),
      ),
    ).toThrow(/fixed contract value/u);
    expect(() =>
      parsePrivateHostingConfigBytes(
        CONFIG_BYTES.toString("utf8").replace(
          REVIEW_SET_V2_MANIFEST_PATH,
          "review/review-set.v1.json",
        ),
      ),
    ).toThrow(/fixed contract value/u);
  });

  it("rejects the wrong platform, runtime, executable, and Node binary version", () => {
    const fixture = operationsFixture();
    const calls: RecordedInvocation[] = [];
    const base = managerDependencies(fixture, calls);
    expect(() =>
      renderPrivateReviewLaunchAgent({ ...base, platform: "linux" }),
    ).toThrow(/only on macOS/u);
    expect(() =>
      renderPrivateReviewLaunchAgent({
        ...base,
        runtimeNodeVersion: "22.0.0",
      }),
    ).toThrow(/requires Node 24\.14\.0/u);
    chmodSync(fixture.nodeBinary, 0o600);
    expect(() => renderPrivateReviewLaunchAgent(base)).toThrow(
      /not executable/u,
    );
    chmodSync(fixture.nodeBinary, 0o755);
    const wrongVersion = managerDependencies(fixture, calls, (invocation) =>
      invocation.executable === fixture.nodeBinary
        ? commandResult(0, "v24.13.0\n")
        : undefined,
    );
    expect(() => renderPrivateReviewLaunchAgent(wrongVersion)).toThrow(
      /not Node 24\.14\.0/u,
    );
  });

  it("renders a private atomic plist outside the repository and lints it", () => {
    const fixture = operationsFixture();
    const calls: RecordedInvocation[] = [];
    const rendered = renderPrivateReviewLaunchAgent(
      managerDependencies(fixture, calls),
    );
    const realRoot = realpathSync(fixture.root);
    const realHome = realpathSync(fixture.home);
    expect(rendered.path.startsWith(realHome)).toBe(true);
    expect(rendered.path.startsWith(realRoot)).toBe(false);
    expect(lstatSync(rendered.localStateDirectory).mode & 0o777).toBe(0o700);
    expect(lstatSync(rendered.path).mode & 0o777).toBe(0o600);
    const plist = readFileSync(rendered.path, "utf8");
    expect(plist).toContain(`<string>${PRIVATE_REVIEW_LAUNCHD_LABEL}</string>`);
    expect(plist).toContain(`<string>${realRoot}</string>`);
    expect(plist).toContain("<key>KeepAlive</key>\n    <false />");
    expect(plist).toContain(
      "<key>StandardInPath</key>\n    <string>/dev/null</string>",
    );
    expect(plist).not.toContain("@@");
    expect(
      calls.some(
        (call) =>
          call.executable === PLUTIL_PATH &&
          call.args[0] === "-lint" &&
          call.args[1] === rendered.path &&
          call.discardOutput === true,
      ),
    ).toBe(true);
    expect(
      readdirSync(rendered.localStateDirectory).filter((name) =>
        name.endsWith(".tmp"),
      ),
    ).toEqual([]);
  });

  it("uses only the exact launchd label and lints before bootstrap", () => {
    const fixture = operationsFixture();
    const calls: RecordedInvocation[] = [];
    const dependencies = managerDependencies(fixture, calls);
    const loaded = runPrivateReviewServiceAction("load", dependencies);
    runPrivateReviewServiceAction("unload", dependencies);
    runPrivateReviewServiceAction("restart", dependencies);
    runPrivateReviewServiceAction("status", dependencies);
    const launchCalls = calls.filter(
      (call) => call.executable === LAUNCHCTL_PATH,
    );
    expect(launchCalls.map((call) => call.args)).toEqual([
      ["bootstrap", `gui/${TEST_UID}`, loaded.rendered?.path],
      ["bootout", `gui/${TEST_UID}/${PRIVATE_REVIEW_LAUNCHD_LABEL}`],
      ["kickstart", "-k", `gui/${TEST_UID}/${PRIVATE_REVIEW_LAUNCHD_LABEL}`],
      ["print", `gui/${TEST_UID}/${PRIVATE_REVIEW_LAUNCHD_LABEL}`],
    ]);
    expect(
      calls.findIndex((call) => call.executable === PLUTIL_PATH),
    ).toBeLessThan(
      calls.findIndex(
        (call) =>
          call.executable === LAUNCHCTL_PATH && call.args[0] === "bootstrap",
      ),
    );

    const failedCalls: RecordedInvocation[] = [];
    const failed = managerDependencies(fixture, failedCalls, (invocation) =>
      invocation.executable === PLUTIL_PATH ? commandResult(1) : undefined,
    );
    expect(() => runPrivateReviewServiceAction("load", failed)).toThrow(
      /management command failed/u,
    );
    expect(failedCalls.some((call) => call.executable === LAUNCHCTL_PATH)).toBe(
      false,
    );
  });

  it("rejects symlinked state, unsafe logs, and mismatched state ownership", () => {
    const stateName = "tw.sportsmedicine.atlas.private-review";

    const symlinkFixture = operationsFixture();
    const outside = join(symlinkFixture.scratch, "outside-state");
    mkdirSync(outside);
    symlinkSync(
      outside,
      join(symlinkFixture.home, "Library", "Application Support", stateName),
    );
    expect(() =>
      renderPrivateReviewLaunchAgent(managerDependencies(symlinkFixture, [])),
    ).toThrow(/not a user-owned real directory/u);

    const logFixture = operationsFixture();
    const first = renderPrivateReviewLaunchAgent(
      managerDependencies(logFixture, []),
    );
    writeFileSync(join(first.localStateDirectory, "service.stdout.log"), "");
    chmodSync(join(first.localStateDirectory, "service.stdout.log"), 0o644);
    expect(() =>
      renderPrivateReviewLaunchAgent(managerDependencies(logFixture, [])),
    ).toThrow(/log target/u);

    const ownerFixture = operationsFixture();
    expect(() =>
      renderPrivateReviewLaunchAgent({
        ...managerDependencies(ownerFixture, []),
        uid: TEST_UID + 1,
      }),
    ).toThrow(/ownership/u);
  });

  it("first-provisions canonical mode-0600 access data with a stdin-only verifier", () => {
    const fixture = operationsFixture();
    const terminal = tty();
    const state: SyntheticCredentialState = {
      token: null,
      serviceLoaded: false,
      portClosed: true,
      calls: [],
    };
    const provisionDependencies = credentialDependencies(
      fixture,
      state,
      terminal.port,
    );
    provisionDependencies.deriveKey = (password, salt, parameters) =>
      scryptSync(password, salt, parameters.keyLength, {
        N: parameters.N,
        r: parameters.r,
        p: parameters.p,
        maxmem: 64 * 1024 * 1024,
      });
    const result = provisionReviewCredential(provisionDependencies);
    expect(result).toMatchObject({
      status: "provisioned",
      credentialGeneration: 1,
      replacedExisting: false,
    });
    const accessBytes = readFileSync(fixture.accessPath);
    const parsed = parseReviewAccessInfoBytes(accessBytes);
    expect(accessBytes.toString("utf8")).toBe(canonicalJson(parsed));
    expect(lstatSync(fixture.accessPath).mode & 0o777).toBe(0o600);
    expect(state.token).not.toBeNull();
    expect(parseScryptVerifierToken(state.token as string)).toMatchObject({
      credentialGeneration: 1,
      N: 16_384,
      r: 8,
      p: 1,
    });
    const gatewayVerifier = parseGatewayVerifierToken(state.token as string);
    const derivedKey = scryptSync(
      parsed.password,
      Buffer.from(gatewayVerifier.salt, "base64url"),
      gatewayVerifier.keyLength,
      {
        N: gatewayVerifier.N,
        r: gatewayVerifier.r,
        p: gatewayVerifier.p,
        maxmem: 64 * 1024 * 1024,
      },
    );
    expect(derivedKey.toString("base64url")).toBe(gatewayVerifier.derivedKey);
    const updates = state.calls.filter(
      (call) => call.executable === SECURITY_CLI_PATH && call.args[0] === "-i",
    );
    expect(updates).toHaveLength(1);
    expect(updates[0]?.args).toEqual(["-i"]);
    expect(updates[0]?.discardOutput).toBe(true);
    expect(String(updates[0]?.stdin)).toContain(state.token as string);
    expect(String(updates[0]?.stdin)).not.toContain(parsed.password);
    for (const call of state.calls) {
      const argv = call.args.join(" ");
      expect(argv).not.toContain(parsed.password);
      expect(argv).not.toContain(state.token as string);
    }
    expect(terminal.messages.join(" ")).not.toContain(parsed.password);
    expect(terminal.messages.join(" ")).not.toContain(state.token as string);
  });

  it("requires the exact REPLACE confirmation before any rotation side effect", () => {
    const fixture = operationsFixture();
    const originalAccess = accessInfo(4);
    writeFileSync(fixture.accessPath, originalAccess, { mode: 0o600 });
    chmodSync(fixture.accessPath, 0o600);
    const originalToken = verifierToken(1);
    const state: SyntheticCredentialState = {
      token: originalToken,
      serviceLoaded: true,
      portClosed: true,
      calls: [],
    };
    const terminal = tty("not-approved");
    expect(
      provisionReviewCredential(
        credentialDependencies(fixture, state, terminal.port),
      ),
    ).toEqual({ status: "cancelled" });
    expect(terminal.prompts).toHaveLength(1);
    expect(terminal.prompts[0]).toContain("REPLACE");
    expect(state.token).toBe(originalToken);
    expect(readFileSync(fixture.accessPath, "utf8")).toBe(originalAccess);
    expect(
      state.calls.some(
        (call) =>
          call.executable === LAUNCHCTL_PATH || call.executable === LSOF_PATH,
      ),
    ).toBe(false);
    expect(
      state.calls.some(
        (call) =>
          call.executable === SECURITY_CLI_PATH && call.args[0] === "-i",
      ),
    ).toBe(false);
  });

  it("boots out only the exact service, proves port closure, and rotates generations", () => {
    const fixture = operationsFixture();
    writeFileSync(fixture.accessPath, accessInfo(5), { mode: 0o600 });
    chmodSync(fixture.accessPath, 0o600);
    const state: SyntheticCredentialState = {
      token: verifierToken(1),
      serviceLoaded: true,
      portClosed: true,
      calls: [],
    };
    const result = provisionReviewCredential(
      credentialDependencies(fixture, state, tty().port),
    );
    expect(result).toMatchObject({
      status: "provisioned",
      credentialGeneration: 2,
      replacedExisting: true,
    });
    expect(state.serviceLoaded).toBe(false);
    expect(
      parseScryptVerifierToken(state.token as string).credentialGeneration,
    ).toBe(2);
    expect(
      state.calls.find(
        (call) =>
          call.executable === LAUNCHCTL_PATH && call.args[0] === "bootout",
      )?.args,
    ).toEqual(["bootout", `gui/${TEST_UID}/${PRIVATE_REVIEW_LAUNCHD_LABEL}`]);
    expect(
      state.calls.find((call) => call.executable === LSOF_PATH)?.args,
    ).toEqual(["-nP", "-iTCP:8140", "-sTCP:LISTEN"]);
    const bootoutIndex = state.calls.findIndex(
      (call) =>
        call.executable === LAUNCHCTL_PATH && call.args[0] === "bootout",
    );
    const lsofIndex = state.calls.findIndex(
      (call) => call.executable === LSOF_PATH,
    );
    const updateIndex = state.calls.findIndex(
      (call) => call.executable === SECURITY_CLI_PATH && call.args[0] === "-i",
    );
    expect(bootoutIndex).toBeLessThan(lsofIndex);
    expect(lsofIndex).toBeLessThan(updateIndex);
  });

  it("leaves Keychain and access data unchanged when port 8140 remains open", () => {
    const fixture = operationsFixture();
    const oldAccess = accessInfo(6);
    writeFileSync(fixture.accessPath, oldAccess, { mode: 0o600 });
    chmodSync(fixture.accessPath, 0o600);
    const oldToken = verifierToken(1);
    const state: SyntheticCredentialState = {
      token: oldToken,
      serviceLoaded: true,
      portClosed: false,
      calls: [],
    };
    expect(() =>
      provisionReviewCredential(
        credentialDependencies(fixture, state, tty().port),
      ),
    ).toThrow(/port 8140 must be closed/u);
    expect(state.serviceLoaded).toBe(false);
    expect(state.token).toBe(oldToken);
    expect(readFileSync(fixture.accessPath, "utf8")).toBe(oldAccess);
    expect(
      state.calls.some(
        (call) =>
          call.executable === SECURITY_CLI_PATH && call.args[0] === "-i",
      ),
    ).toBe(false);
  });

  it("restores the prior Keychain verifier if access-file replacement races", () => {
    const fixture = operationsFixture();
    const originalAccess = accessInfo(8);
    const heldOriginal = `${fixture.accessPath}.before-race`;
    writeFileSync(fixture.accessPath, originalAccess, { mode: 0o600 });
    chmodSync(fixture.accessPath, 0o600);
    const oldToken = verifierToken(4);
    const state: SyntheticCredentialState = {
      token: oldToken,
      serviceLoaded: true,
      portClosed: true,
      calls: [],
      afterFirstUpdatedRead() {
        // Keep the original inode allocated: unlink + recreate can reuse it
        // immediately on Linux and fails to simulate a distinct replacement.
        renameSync(fixture.accessPath, heldOriginal);
        writeFileSync(fixture.accessPath, "racing replacement", {
          mode: 0o600,
        });
        chmodSync(fixture.accessPath, 0o600);
      },
    };
    expect(() =>
      provisionReviewCredential(
        credentialDependencies(fixture, state, tty().port),
      ),
    ).toThrow(/prior Keychain state was restored/u);
    expect(lstatSync(fixture.accessPath).ino).not.toBe(
      lstatSync(heldOriginal).ino,
    );
    expect(state.token).toBe(oldToken);
    expect(readFileSync(fixture.accessPath, "utf8")).toBe("racing replacement");
    expect(readFileSync(heldOriginal, "utf8")).toBe(originalAccess);
    const updateInputs = state.calls
      .filter(
        (call) =>
          call.executable === SECURITY_CLI_PATH && call.args[0] === "-i",
      )
      .map((call) => String(call.stdin));
    expect(updateInputs).toHaveLength(2);
    expect(updateInputs[1]).toContain(oldToken);
    expect(updateInputs.every((input) => SAFE_STDIN_RE.test(input))).toBe(true);
  });

  it("deletes a newly created Keychain item if first access-file install races", () => {
    const fixture = operationsFixture();
    const state: SyntheticCredentialState = {
      token: null,
      serviceLoaded: false,
      portClosed: true,
      calls: [],
      afterFirstUpdatedRead() {
        writeFileSync(fixture.accessPath, "racing replacement", {
          mode: 0o600,
        });
        chmodSync(fixture.accessPath, 0o600);
      },
    };
    expect(() =>
      provisionReviewCredential(
        credentialDependencies(fixture, state, tty().port),
      ),
    ).toThrow(/prior Keychain state was restored/u);
    expect(state.token).toBeNull();
    expect(
      state.calls.some(
        (call) =>
          call.executable === SECURITY_CLI_PATH &&
          String(call.stdin).startsWith("delete-generic-password "),
      ),
    ).toBe(true);
  });

  it("rejects symlink, permissive mode, and ownership mismatches before provisioning", () => {
    const symlinkFixture = operationsFixture();
    const symlinkTarget = join(symlinkFixture.scratch, "access-target");
    writeFileSync(symlinkTarget, accessInfo(1), { mode: 0o600 });
    symlinkSync(symlinkTarget, symlinkFixture.accessPath);
    const symlinkState: SyntheticCredentialState = {
      token: null,
      serviceLoaded: false,
      portClosed: true,
      calls: [],
    };
    expect(() =>
      provisionReviewCredential(
        credentialDependencies(symlinkFixture, symlinkState, tty().port),
      ),
    ).toThrow(/not a private regular file/u);

    const modeFixture = operationsFixture();
    writeFileSync(modeFixture.accessPath, accessInfo(2), { mode: 0o644 });
    chmodSync(modeFixture.accessPath, 0o644);
    const modeState: SyntheticCredentialState = {
      token: null,
      serviceLoaded: false,
      portClosed: true,
      calls: [],
    };
    expect(() =>
      provisionReviewCredential(
        credentialDependencies(modeFixture, modeState, tty().port),
      ),
    ).toThrow(/not a private regular file/u);

    const ownerFixture = operationsFixture();
    const ownerState: SyntheticCredentialState = {
      token: null,
      serviceLoaded: false,
      portClosed: true,
      calls: [],
    };
    expect(() =>
      provisionReviewCredential({
        ...credentialDependencies(ownerFixture, ownerState, tty().port),
        uid: TEST_UID + 1,
      }),
    ).toThrow(/parent is not a private user-owned directory/u);
  });
});

const SAFE_STDIN_RE =
  /^(?:add-generic-password -a atlas-reviewer -s tw\.sportsmedicine\.atlas\.private-review\.auth-v1 -U -w [A-Za-z0-9._-]+|delete-generic-password -a atlas-reviewer -s tw\.sportsmedicine\.atlas\.private-review\.auth-v1)\n$/u;
