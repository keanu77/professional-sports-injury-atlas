/**
 * Core plan-binding governance library and `plan:verify` CLI.
 *
 * The binding file `docs/decisions/plan-binding.v1.json` is canonical compact
 * JSON (object keys sorted by Unicode code point, no insignificant whitespace,
 * NFC-normalized strings, exactly one trailing newline). This module owns the
 * shared primitives (canonical JSON, SHA-256, strict duplicate-key-detecting
 * JSON parsing, plan header parsing, binding structure validation, decision
 * validation) that every other plan-binding script imports.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const BINDING_PATH = "docs/decisions/plan-binding.v1.json";
export const BOOTSTRAP_DECISION_PATH =
  "docs/decisions/2026-08-06-atlas-bootstrap.md";
export const SPEC_PATH =
  "docs/superpowers/specs/2026-08-06-professional-sports-injury-video-atlas-design.md";
export const CONTROLLER_PATH =
  "docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-execution-index.md";
export const PLATFORM_PLAN_PATH =
  "docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-platform-foundation.md";

export const CONTROLLED_DIRECTORIES = [
  "docs/superpowers/specs",
  "docs/superpowers/plans",
  "docs/decisions",
] as const;

export type DocumentType =
  "specification" | "execution-controller" | "plan" | "decision";
export type Lifecycle = "active" | "superseded";
export type AuthorizationStatus =
  "authorized" | "not-authorized" | "superseded";

export interface ExecutionAuthorization {
  closedScopeIds: string[];
  decisionPath: string | null;
  decisionSha256: string | null;
  executionScopeId: string;
  role: string;
  status: AuthorizationStatus;
}

export interface BoundDocument {
  boundAt: string;
  documentType: DocumentType;
  executionAuthorization: ExecutionAuthorization | null;
  lifecycle: Lifecycle;
  path: string;
  sha256: string;
}

export interface PlanBinding {
  documents: BoundDocument[];
  schemaVersion: 1;
}

export interface PlanHeader {
  role: string;
  executionScopeId: string;
  /** Sorted by Unicode code point. */
  closedScopeIds: string[];
}

export interface DecisionValidationResult {
  sha256: string;
  bytes: Buffer;
}

export class PlanBindingError extends Error {}

function fail(message: string): never {
  throw new PlanBindingError(message);
}

const SHA256_RE = /^[0-9a-f]{64}$/;
const UTC_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function compareCodePoints(a: string, b: string): number {
  const aPoints = [...a];
  const bPoints = [...b];
  const length = Math.min(aPoints.length, bPoints.length);
  for (let i = 0; i < length; i += 1) {
    const diff =
      (aPoints[i] as string).codePointAt(0)! -
      (bPoints[i] as string).codePointAt(0)!;
    if (diff !== 0) return diff;
  }
  return aPoints.length - bPoints.length;
}

function serializeCanonical(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value.normalize("NFC"));
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      fail("canonical JSON supports finite numbers only");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(serializeCanonical).join(",")}]`;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).map((key) => key.normalize("NFC"));
    if (new Set(keys).size !== keys.length)
      fail("canonical JSON object has NFC-colliding keys");
    keys.sort(compareCodePoints);
    const members = keys.map(
      (key) =>
        `${JSON.stringify(key)}:${serializeCanonical((record as Record<string, unknown>)[key])}`,
    );
    return `{${members.join(",")}}`;
  }
  fail(`canonical JSON cannot serialize a ${typeof value}`);
}

/** Canonical compact JSON text: sorted keys, NFC strings, one trailing newline. */
export function canonicalJsonText(value: unknown): string {
  return `${serializeCanonical(value)}\n`;
}

/** Strict JSON parser that rejects duplicate object keys and trailing content. */
export function parseStrictJson(text: string): unknown {
  let index = 0;

  const error = (message: string): never =>
    fail(`strict JSON parse error at offset ${index}: ${message}`);

  const skipWhitespace = (): void => {
    while (index < text.length) {
      const ch = text[index];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") index += 1;
      else break;
    }
  };

  const parseLiteral = <T>(literal: string, value: T): T => {
    if (text.startsWith(literal, index)) {
      index += literal.length;
      return value;
    }
    return error(`invalid literal, expected ${literal}`);
  };

  const parseNumber = (): number => {
    const numberRe = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
    numberRe.lastIndex = index;
    const match = numberRe.exec(text);
    if (!match || match[0].length === 0) return error("invalid number");
    index += match[0].length;
    return Number(match[0]);
  };

  const parseString = (): string => {
    if (text[index] !== '"') return error("expected string");
    index += 1;
    let result = "";
    while (true) {
      if (index >= text.length) return error("unterminated string");
      const ch = text[index] as string;
      const code = ch.charCodeAt(0);
      if (ch === '"') {
        index += 1;
        return result;
      }
      if (ch === "\\") {
        index += 1;
        const escape = text[index];
        if (escape === undefined) return error("unterminated escape");
        index += 1;
        switch (escape) {
          case '"':
            result += '"';
            break;
          case "\\":
            result += "\\";
            break;
          case "/":
            result += "/";
            break;
          case "b":
            result += "\b";
            break;
          case "f":
            result += "\f";
            break;
          case "n":
            result += "\n";
            break;
          case "r":
            result += "\r";
            break;
          case "t":
            result += "\t";
            break;
          case "u": {
            const hex = text.slice(index, index + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex))
              return error("invalid unicode escape");
            index += 4;
            result += String.fromCharCode(Number.parseInt(hex, 16));
            break;
          }
          default:
            return error(`invalid escape \\${escape}`);
        }
        continue;
      }
      if (code < 0x20) return error("unescaped control character in string");
      result += ch;
      index += 1;
    }
  };

  const parseArray = (): unknown[] => {
    index += 1; // consume '['
    const result: unknown[] = [];
    skipWhitespace();
    if (text[index] === "]") {
      index += 1;
      return result;
    }
    while (true) {
      result.push(parseValue());
      skipWhitespace();
      if (text[index] === ",") {
        index += 1;
        continue;
      }
      if (text[index] === "]") {
        index += 1;
        return result;
      }
      return error('expected "," or "]" in array');
    }
  };

  const parseObject = (): Record<string, unknown> => {
    index += 1; // consume '{'
    const result: Record<string, unknown> = Object.create(null) as Record<
      string,
      unknown
    >;
    const seenKeys = new Set<string>();
    skipWhitespace();
    if (text[index] === "}") {
      index += 1;
      return result;
    }
    while (true) {
      skipWhitespace();
      const key = parseString();
      if (seenKeys.has(key))
        return error(`duplicate object key ${JSON.stringify(key)}`);
      seenKeys.add(key);
      skipWhitespace();
      if (text[index] !== ":") return error('expected ":" after object key');
      index += 1;
      result[key] = parseValue();
      skipWhitespace();
      if (text[index] === ",") {
        index += 1;
        continue;
      }
      if (text[index] === "}") {
        index += 1;
        return result;
      }
      return error('expected "," or "}" in object');
    }
  };

  const parseValue = (): unknown => {
    skipWhitespace();
    const ch = text[index];
    if (ch === undefined) return error("unexpected end of input");
    if (ch === "{") return parseObject();
    if (ch === "[") return parseArray();
    if (ch === '"') return parseString();
    if (ch === "t") return parseLiteral("true", true);
    if (ch === "f") return parseLiteral("false", false);
    if (ch === "n") return parseLiteral("null", null);
    if (ch === "-" || (ch >= "0" && ch <= "9")) return parseNumber();
    return error(`unexpected character ${JSON.stringify(ch)}`);
  };

  const value = parseValue();
  skipWhitespace();
  if (index !== text.length) error("trailing content after JSON value");
  return value;
}

export function isValidUtcTimestamp(value: string): boolean {
  if (!UTC_TIMESTAMP_RE.test(value)) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString() === value.replace("Z", ".000Z");
}

export function validateRepoRelativePath(
  value: unknown,
  label: string,
): string {
  if (typeof value !== "string" || value.length === 0) {
    fail(`${label} must be a non-empty repository-relative path`);
  }
  if (value.includes("\\")) fail(`${label} must use "/" separators: ${value}`);
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) {
    fail(`${label} must be repository-relative, not absolute: ${value}`);
  }
  for (const segment of value.split("/")) {
    if (segment === "" || segment === "." || segment === "..") {
      fail(`${label} contains an invalid path segment: ${value}`);
    }
  }
  return value;
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

// ---------------------------------------------------------------------------
// Plan header parsing
// ---------------------------------------------------------------------------

const PLAN_HEADER_LINE_RE =
  /^- Execution role: `([^`]+)`; execution scope ID: `([^`]+)`; required closed scope IDs: (.+)\.$/;

/**
 * Parses the single authoritative "Scope and authority" header line of a plan:
 * role, execution scope ID, and the required closed scope IDs (returned sorted
 * by Unicode code point).
 */
export function parsePlanHeader(
  planText: string,
  planPath: string,
): PlanHeader {
  const matches: RegExpExecArray[] = [];
  for (const line of planText.split("\n")) {
    const match = PLAN_HEADER_LINE_RE.exec(line);
    if (match) matches.push(match);
  }
  if (matches.length !== 1) {
    fail(
      `plan ${planPath} must declare exactly one execution-role header line, found ${matches.length}`,
    );
  }
  const [, role, executionScopeId, closedScopesRaw] = matches[0] as unknown as [
    string,
    string,
    string,
    string,
  ];
  const closedScopeIds = closedScopesRaw.split(", ").map((part) => {
    const scopeMatch = /^`([^`]+)`$/.exec(part);
    if (!scopeMatch)
      fail(
        `plan ${planPath} has a malformed closed scope declaration: ${part}`,
      );
    return scopeMatch[1] as string;
  });
  if (closedScopeIds.length === 0)
    fail(`plan ${planPath} declares no closed scope IDs`);
  if (new Set(closedScopeIds).size !== closedScopeIds.length) {
    fail(`plan ${planPath} declares duplicate closed scope IDs`);
  }
  return {
    role,
    executionScopeId,
    closedScopeIds: [...closedScopeIds].sort(compareCodePoints),
  };
}

// ---------------------------------------------------------------------------
// Binding structure validation and reading
// ---------------------------------------------------------------------------

function assertPlainObject(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function assertExactKeys(
  record: Record<string, unknown>,
  expectedKeys: readonly string[],
  label: string,
): void {
  const actual = Object.keys(record).sort(compareCodePoints);
  const expected = [...expectedKeys].sort(compareCodePoints);
  if (!arraysEqual(actual, expected)) {
    fail(
      `${label} must have exactly the keys [${expected.join(", ")}], got [${actual.join(", ")}]`,
    );
  }
}

const DOCUMENT_TYPES: readonly DocumentType[] = [
  "specification",
  "execution-controller",
  "plan",
  "decision",
];
const LIFECYCLES: readonly Lifecycle[] = ["active", "superseded"];
const AUTHORIZATION_STATUSES: readonly AuthorizationStatus[] = [
  "authorized",
  "not-authorized",
  "superseded",
];

function validateExecutionAuthorization(
  value: unknown,
  label: string,
): ExecutionAuthorization {
  const record = assertPlainObject(value, label);
  assertExactKeys(
    record,
    [
      "closedScopeIds",
      "decisionPath",
      "decisionSha256",
      "executionScopeId",
      "role",
      "status",
    ],
    label,
  );
  const {
    closedScopeIds,
    decisionPath,
    decisionSha256,
    executionScopeId,
    role,
    status,
  } = record;
  if (!Array.isArray(closedScopeIds) || closedScopeIds.length === 0) {
    fail(`${label}.closedScopeIds must be a non-empty array`);
  }
  for (const scope of closedScopeIds) {
    if (typeof scope !== "string" || scope.length === 0) {
      fail(`${label}.closedScopeIds entries must be non-empty strings`);
    }
  }
  const scopes = closedScopeIds as string[];
  for (let i = 1; i < scopes.length; i += 1) {
    if (compareCodePoints(scopes[i - 1] as string, scopes[i] as string) >= 0) {
      fail(
        `${label}.closedScopeIds must be strictly sorted by Unicode code point`,
      );
    }
  }
  if (typeof role !== "string" || role.trim() === "")
    fail(`${label}.role must be non-empty`);
  if (typeof executionScopeId !== "string" || executionScopeId.trim() === "") {
    fail(`${label}.executionScopeId must be non-empty`);
  }
  if (!AUTHORIZATION_STATUSES.includes(status as AuthorizationStatus)) {
    fail(`${label}.status must be one of ${AUTHORIZATION_STATUSES.join(", ")}`);
  }
  const typedStatus = status as AuthorizationStatus;
  if (typedStatus === "authorized") {
    validateRepoRelativePath(decisionPath, `${label}.decisionPath`);
    if (typeof decisionSha256 !== "string" || !SHA256_RE.test(decisionSha256)) {
      fail(`${label}.decisionSha256 must be a 64-hex SHA-256 digest`);
    }
  } else if (typedStatus === "not-authorized") {
    if (decisionPath !== null || decisionSha256 !== null) {
      fail(
        `${label} with status not-authorized must have null decisionPath and decisionSha256`,
      );
    }
  } else {
    // superseded: a formerly authorized entry keeps its decision reference.
    if ((decisionPath === null) !== (decisionSha256 === null)) {
      fail(`${label} must set decisionPath and decisionSha256 together`);
    }
    if (decisionPath !== null) {
      validateRepoRelativePath(decisionPath, `${label}.decisionPath`);
      if (
        typeof decisionSha256 !== "string" ||
        !SHA256_RE.test(decisionSha256)
      ) {
        fail(`${label}.decisionSha256 must be a 64-hex SHA-256 digest`);
      }
    }
  }
  return {
    closedScopeIds: scopes,
    decisionPath: decisionPath as string | null,
    decisionSha256: decisionSha256 as string | null,
    executionScopeId,
    role,
    status: typedStatus,
  };
}

export function validateBindingStructure(value: unknown): PlanBinding {
  const record = assertPlainObject(value, "plan binding");
  assertExactKeys(record, ["documents", "schemaVersion"], "plan binding");
  if (record["schemaVersion"] !== 1)
    fail("plan binding schemaVersion must be exactly 1");
  if (!Array.isArray(record["documents"]))
    fail("plan binding documents must be an array");

  const documents: BoundDocument[] = [];
  const seenPaths = new Set<string>();
  const activePlansPerRole = new Map<string, number>();

  (record["documents"] as unknown[]).forEach((entry, position) => {
    const label = `plan binding documents[${position}]`;
    const doc = assertPlainObject(entry, label);
    assertExactKeys(
      doc,
      [
        "boundAt",
        "documentType",
        "executionAuthorization",
        "lifecycle",
        "path",
        "sha256",
      ],
      label,
    );
    const boundAt = doc["boundAt"];
    if (typeof boundAt !== "string" || !isValidUtcTimestamp(boundAt)) {
      fail(
        `${label}.boundAt must be a UTC ISO-8601 timestamp (YYYY-MM-DDTHH:MM:SSZ)`,
      );
    }
    const documentType = doc["documentType"];
    if (!DOCUMENT_TYPES.includes(documentType as DocumentType)) {
      fail(`${label}.documentType must be one of ${DOCUMENT_TYPES.join(", ")}`);
    }
    const lifecycle = doc["lifecycle"];
    if (!LIFECYCLES.includes(lifecycle as Lifecycle)) {
      fail(`${label}.lifecycle must be one of ${LIFECYCLES.join(", ")}`);
    }
    const path = validateRepoRelativePath(doc["path"], `${label}.path`);
    if (seenPaths.has(path))
      fail(`plan binding contains duplicate document path ${path}`);
    seenPaths.add(path);
    const sha256 = doc["sha256"];
    if (typeof sha256 !== "string" || !SHA256_RE.test(sha256)) {
      fail(`${label}.sha256 must be a 64-hex SHA-256 digest`);
    }

    let executionAuthorization: ExecutionAuthorization | null = null;
    if (documentType === "plan") {
      executionAuthorization = validateExecutionAuthorization(
        doc["executionAuthorization"],
        `${label}.executionAuthorization`,
      );
      const supersededLifecycle = lifecycle === "superseded";
      const supersededStatus = executionAuthorization.status === "superseded";
      if (supersededLifecycle !== supersededStatus) {
        fail(
          `${label} lifecycle and executionAuthorization.status disagree about superseding`,
        );
      }
      if (lifecycle === "active") {
        const role = executionAuthorization.role;
        const count = (activePlansPerRole.get(role) ?? 0) + 1;
        activePlansPerRole.set(role, count);
        if (count > 1)
          fail(`plan binding has more than one active plan for role ${role}`);
      }
    } else if (doc["executionAuthorization"] !== null) {
      fail(
        `${label}.executionAuthorization must be null for a ${String(documentType)} document`,
      );
    }

    documents.push({
      boundAt,
      documentType: documentType as DocumentType,
      executionAuthorization,
      lifecycle: lifecycle as Lifecycle,
      path,
      sha256,
    });
  });

  return { documents, schemaVersion: 1 };
}

export interface LoadedBinding {
  binding: PlanBinding;
  bytes: Buffer;
}

/**
 * Reads, strictly parses, structurally validates, and canonical-byte-verifies
 * the binding file. Re-canonicalization must reproduce the exact stored bytes.
 */
export function readBinding(root: string): LoadedBinding {
  const file = join(root, BINDING_PATH);
  if (!existsSync(file)) fail(`missing plan binding file ${BINDING_PATH}`);
  const bytes = readFileSync(file);
  const text = bytes.toString("utf8");
  const parsed = parseStrictJson(text);
  const binding = validateBindingStructure(parsed);
  if (canonicalJsonText(parsed) !== text) {
    fail(
      `${BINDING_PATH} is not canonical: re-canonicalization changes its bytes`,
    );
  }
  return { binding, bytes };
}

// ---------------------------------------------------------------------------
// Decision validation (bootstrap markdown special case and strict JSON V1)
// ---------------------------------------------------------------------------

const BOOTSTRAP_CLOSED_SCOPE_KEYS = [
  "sourceDiscoveryExecutionStatus",
  "medicalAuthoringExecutionStatus",
  "hostingExecutionStatus",
  "publicReleaseExecutionStatus",
  "deploymentExecutionStatus",
] as const;

/**
 * Fully re-validates the G0 bootstrap markdown decision: unique anchored keys
 * with exact values, and its three recorded SHA-256 digests recomputed against
 * the current in-repo snapshot bytes of the spec, execution controller, and
 * platform plan. The non-Git parent workspace is never required.
 */
export function validateBootstrapDecision(
  root: string,
): DecisionValidationResult {
  const file = join(root, BOOTSTRAP_DECISION_PATH);
  if (!existsSync(file))
    fail(`missing bootstrap decision file ${BOOTSTRAP_DECISION_PATH}`);
  const bytes = readFileSync(file);
  const lines = bytes.toString("utf8").split("\n");

  const requireAnchored = (key: string, pattern: RegExp): string => {
    const hits = lines.filter((line) => line.startsWith(`${key}:`));
    if (hits.length !== 1) {
      fail(
        `bootstrap decision must contain exactly one anchored ${key} line, found ${hits.length}`,
      );
    }
    const match = pattern.exec(hits[0] as string);
    if (!match) fail(`bootstrap decision anchored line for ${key} is invalid`);
    return (match[1] ?? hits[0]) as string;
  };

  requireAnchored("decisionSchemaVersion", /^decisionSchemaVersion: 1$/);
  requireAnchored("redTeamSpecStatus", /^redTeamSpecStatus: confirmed$/);
  requireAnchored("g0ExecutionStatus", /^g0ExecutionStatus: authorized$/);
  requireAnchored(
    "authorizedScope",
    /^authorizedScope: local-git-and-platform-foundation-only$/,
  );
  requireAnchored(
    "authorizedBy",
    /^authorizedBy: \S(?:[^\u0000-\u001f\u007f]*\S)?$/,
  );
  const authorizedAt = requireAnchored(
    "authorizedAt",
    /^authorizedAt: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)$/,
  );
  if (!isValidUtcTimestamp(authorizedAt)) {
    fail("bootstrap decision authorizedAt is not a valid UTC timestamp");
  }
  for (const closedKey of BOOTSTRAP_CLOSED_SCOPE_KEYS) {
    requireAnchored(closedKey, new RegExp(`^${closedKey}: not-authorized$`));
  }
  const recordedSpecSha = requireAnchored(
    "specSha256",
    /^specSha256: ([0-9a-f]{64})$/,
  );
  const recordedControllerSha = requireAnchored(
    "executionIndexSha256",
    /^executionIndexSha256: ([0-9a-f]{64})$/,
  );
  const recordedPlatformSha = requireAnchored(
    "platformPlanSha256",
    /^platformPlanSha256: ([0-9a-f]{64})$/,
  );

  const checkSnapshot = (
    relPath: string,
    recorded: string,
    label: string,
  ): void => {
    const snapshotFile = join(root, relPath);
    if (!existsSync(snapshotFile)) {
      fail(
        `bootstrap decision references ${label} snapshot ${relPath}, which is absent`,
      );
    }
    const measured = sha256Hex(readFileSync(snapshotFile));
    if (measured !== recorded) {
      fail(
        `bootstrap decision ${label} digest mismatch for ${relPath}: recorded ${recorded}, measured ${measured}`,
      );
    }
  };
  checkSnapshot(SPEC_PATH, recordedSpecSha, "specification");
  checkSnapshot(CONTROLLER_PATH, recordedControllerSha, "execution controller");
  checkSnapshot(PLATFORM_PLAN_PATH, recordedPlatformSha, "platform plan");

  return { sha256: sha256Hex(bytes), bytes };
}

const DECISION_KEYS = [
  "authorizedAt",
  "authorizedBy",
  "closedScopeIds",
  "decisionType",
  "executionScopeId",
  "executionStatus",
  "planPath",
  "planSha256",
  "role",
  "schemaVersion",
] as const;

/**
 * Strictly validates a PlanExecutionDecisionV1 JSON decision against the
 * current bytes and declared header of the plan at `planRelPath`. Does not
 * require the decision to be bound yet.
 */
export function validatePlanExecutionDecision(
  root: string,
  decisionRelPath: string,
  planRelPath: string,
): DecisionValidationResult {
  validateRepoRelativePath(decisionRelPath, "decision path");
  validateRepoRelativePath(planRelPath, "plan path");
  const decisionFile = join(root, decisionRelPath);
  if (!existsSync(decisionFile))
    fail(`missing decision file ${decisionRelPath}`);
  const bytes = readFileSync(decisionFile);
  const parsed = parseStrictJson(bytes.toString("utf8"));
  const record = assertPlainObject(parsed, `decision ${decisionRelPath}`);
  assertExactKeys(record, DECISION_KEYS, `decision ${decisionRelPath}`);

  if (record["schemaVersion"] !== 1) {
    fail(`decision ${decisionRelPath} schemaVersion must be exactly 1`);
  }
  if (record["decisionType"] !== "plan-execution") {
    fail(
      `decision ${decisionRelPath} decisionType must be exactly 'plan-execution'`,
    );
  }
  if (record["executionStatus"] !== "authorized") {
    fail(
      `decision ${decisionRelPath} executionStatus must be exactly 'authorized'; ` +
        `denial or ambiguous status never authorizes execution`,
    );
  }
  if (record["planPath"] !== planRelPath) {
    fail(
      `decision ${decisionRelPath} planPath ${JSON.stringify(record["planPath"])} does not match ` +
        `the target plan ${planRelPath}`,
    );
  }

  const planFile = join(root, planRelPath);
  if (!existsSync(planFile)) fail(`missing plan file ${planRelPath}`);
  const planBytes = readFileSync(planFile);
  const planSha256 = record["planSha256"];
  if (typeof planSha256 !== "string" || !SHA256_RE.test(planSha256)) {
    fail(
      `decision ${decisionRelPath} planSha256 must be a 64-hex SHA-256 digest`,
    );
  }
  const measuredPlanSha = sha256Hex(planBytes);
  if (planSha256 !== measuredPlanSha) {
    fail(
      `decision ${decisionRelPath} planSha256 ${planSha256} does not match current plan bytes ` +
        `${measuredPlanSha}`,
    );
  }

  const header = parsePlanHeader(planBytes.toString("utf8"), planRelPath);
  if (record["role"] !== header.role) {
    fail(
      `decision ${decisionRelPath} role ${JSON.stringify(record["role"])} does not match plan ` +
        `header role ${header.role}`,
    );
  }
  if (record["executionScopeId"] !== header.executionScopeId) {
    fail(
      `decision ${decisionRelPath} executionScopeId ${JSON.stringify(record["executionScopeId"])} ` +
        `does not match plan header scope ${header.executionScopeId}`,
    );
  }
  const closedScopeIds = record["closedScopeIds"];
  if (
    !Array.isArray(closedScopeIds) ||
    closedScopeIds.some((scope) => typeof scope !== "string") ||
    !arraysEqual(closedScopeIds as string[], header.closedScopeIds)
  ) {
    fail(
      `decision ${decisionRelPath} closedScopeIds must be exactly the sorted plan-declared list ` +
        `[${header.closedScopeIds.join(", ")}]`,
    );
  }
  const authorizedBy = record["authorizedBy"];
  if (
    typeof authorizedBy !== "string" ||
    authorizedBy.trim().length === 0 ||
    authorizedBy !== authorizedBy.trim()
  ) {
    fail(
      `decision ${decisionRelPath} authorizedBy must be a trimmed non-empty identity`,
    );
  }
  const authorizedAt = record["authorizedAt"];
  if (typeof authorizedAt !== "string" || !isValidUtcTimestamp(authorizedAt)) {
    fail(
      `decision ${decisionRelPath} authorizedAt must be a UTC YYYY-MM-DDTHH:MM:SSZ timestamp`,
    );
  }

  return { sha256: sha256Hex(bytes), bytes };
}

/**
 * Dispatches decision validation. The G0 bootstrap markdown decision is the
 * only markdown decision that may ever authorize a plan, and it may authorize
 * only the platform foundation plan; every other authorization must be a
 * strict PlanExecutionDecisionV1 JSON document.
 */
export function validateDecisionForPlan(
  root: string,
  decisionRelPath: string,
  planRelPath: string,
): DecisionValidationResult {
  if (decisionRelPath === BOOTSTRAP_DECISION_PATH) {
    if (planRelPath !== PLATFORM_PLAN_PATH) {
      fail(
        "the G0 bootstrap markdown decision may authorize only the platform foundation plan " +
          `(${PLATFORM_PLAN_PATH}), not ${planRelPath}`,
      );
    }
    return validateBootstrapDecision(root);
  }
  if (decisionRelPath.endsWith(".md")) {
    fail(
      `decision ${decisionRelPath}: only the G0 bootstrap decision may be markdown; every later ` +
        "authorization must be a strict PlanExecutionDecisionV1 JSON document",
    );
  }
  return validatePlanExecutionDecision(root, decisionRelPath, planRelPath);
}

// ---------------------------------------------------------------------------
// Full binding verification
// ---------------------------------------------------------------------------

function listControlledFiles(root: string): string[] {
  const results: string[] = [];
  const walk = (relDir: string): void => {
    const absDir = join(root, relDir);
    if (!existsSync(absDir)) return;
    for (const name of readdirSync(absDir).sort(compareCodePoints)) {
      if (name.startsWith(".")) continue; // OS metadata and atomic temp files
      const relPath = `${relDir}/${name}`;
      if (relPath === BINDING_PATH) continue;
      const stats = statSync(join(root, relDir, name));
      if (stats.isDirectory()) walk(relPath);
      else if (stats.isFile()) results.push(relPath);
    }
  };
  for (const dir of CONTROLLED_DIRECTORIES) walk(dir);
  return results;
}

/**
 * Verifies the whole binding: canonical bytes, structure, per-entry snapshot
 * digests, exhaustive one-to-one coverage of every controlled document, one
 * active plan per role, plan-header consistency, and full re-validation of
 * every active authorized plan's bound decision.
 */
export function verifyPlanBinding(root: string): PlanBinding {
  const { binding } = readBinding(root);

  const boundPaths = new Set<string>();
  for (const doc of binding.documents) {
    if (doc.path === BINDING_PATH)
      fail("the plan binding file must not bind itself");
    if (!CONTROLLED_DIRECTORIES.some((dir) => doc.path.startsWith(`${dir}/`))) {
      fail(
        `bound document ${doc.path} is outside the controlled authority directories`,
      );
    }
    boundPaths.add(doc.path);
    const file = join(root, doc.path);
    if (!existsSync(file))
      fail(`bound document ${doc.path} is absent from the repository`);
    const measured = sha256Hex(readFileSync(file));
    if (measured !== doc.sha256) {
      fail(
        `bound document ${doc.path} has changed: bound ${doc.sha256}, measured ${measured}`,
      );
    }
  }

  for (const controlledPath of listControlledFiles(root)) {
    if (!boundPaths.has(controlledPath)) {
      fail(`controlled document ${controlledPath} exists but is not bound`);
    }
  }

  for (const doc of binding.documents) {
    if (doc.documentType !== "plan" || doc.lifecycle !== "active") continue;
    const authorization = doc.executionAuthorization as ExecutionAuthorization;
    const header = parsePlanHeader(
      readFileSync(join(root, doc.path)).toString("utf8"),
      doc.path,
    );
    if (
      header.role !== authorization.role ||
      header.executionScopeId !== authorization.executionScopeId ||
      !arraysEqual(header.closedScopeIds, authorization.closedScopeIds)
    ) {
      fail(
        `plan ${doc.path} header does not match its bound execution authorization`,
      );
    }
    if (authorization.status === "authorized") {
      const decision = validateDecisionForPlan(
        root,
        authorization.decisionPath as string,
        doc.path,
      );
      if (decision.sha256 !== authorization.decisionSha256) {
        fail(
          `decision ${authorization.decisionPath} for plan ${doc.path} has changed: bound ` +
            `${authorization.decisionSha256}, measured ${decision.sha256}`,
        );
      }
    }
  }

  return binding;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export function runVerifyCli(argv: string[], root: string): number {
  try {
    if (argv.length !== 0) {
      console.error("usage: verify-plan-binding.ts (no arguments)");
      return 2;
    }
    const binding = verifyPlanBinding(root);
    console.log(
      `plan binding verified: ${binding.documents.length} bound documents`,
    );
    return 0;
  } catch (error) {
    console.error(
      `verify-plan-binding: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runVerifyCli(process.argv.slice(2), process.cwd()));
}
