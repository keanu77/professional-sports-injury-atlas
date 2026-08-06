/**
 * `plan:bind` — the only append/update path for docs/decisions/plan-binding.v1.json.
 *
 * Usage:
 *   bind-authority-document.ts --type specification|execution-controller|decision <path>
 *   bind-authority-document.ts <plan-path> --status not-authorized \
 *     [--role X --scope Y --closed-scopes a,b,c]
 *   bind-authority-document.ts <plan-path> --status authorized --decision <decision-path>
 *
 * Plan registration parses the plan's own "Scope and authority" header; any CLI
 * role/scope/closed-scope arguments must match the header exactly. Authorization
 * re-validates the user decision, hashes its bytes, rereads them immediately
 * before writing, and atomically (temp file + rename) writes the decision
 * binding together with the plan's `authorized` transition. Binding a new plan
 * for an existing role supersedes the old entry in the same atomic write.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  BINDING_PATH,
  type BoundDocument,
  type DocumentType,
  type PlanBinding,
  PlanBindingError,
  canonicalJsonText,
  compareCodePoints,
  parsePlanHeader,
  readBinding,
  sha256Hex,
  validateBindingStructure,
  validateDecisionForPlan,
  validateRepoRelativePath,
} from "./verify-plan-binding.ts";

function fail(message: string): never {
  throw new PlanBindingError(message);
}

/** Current UTC time as YYYY-MM-DDTHH:MM:SSZ. */
export function nowUtcTimestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function loadBindingOrEmpty(root: string): PlanBinding {
  if (!existsSync(join(root, BINDING_PATH))) {
    return { documents: [], schemaVersion: 1 };
  }
  return readBinding(root).binding;
}

/**
 * Atomically writes the binding as canonical compact JSON bytes: the payload is
 * fully re-validated, written to a temp file in the same directory, then
 * renamed over the binding path so a failure never leaves a half-applied file.
 */
export function writeBindingAtomic(root: string, binding: PlanBinding): Buffer {
  const validated = validateBindingStructure(
    JSON.parse(JSON.stringify(binding)),
  );
  const bytes = Buffer.from(canonicalJsonText(validated), "utf8");
  const target = join(root, BINDING_PATH);
  mkdirSync(dirname(target), { recursive: true });
  const temp = join(
    dirname(target),
    `.plan-binding.v1.json.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  writeFileSync(temp, bytes);
  try {
    renameSync(temp, target);
  } catch (error) {
    try {
      unlinkSync(temp);
    } catch {
      // best effort cleanup; the temp name is dot-prefixed and never scanned
    }
    throw error;
  }
  return bytes;
}

/** Appends a non-executable authority document (spec, controller, or decision). */
export function bindNonPlanDocument(
  root: string,
  relPath: string,
  documentType: Exclude<DocumentType, "plan">,
  options: { now?: string } = {},
): BoundDocument {
  validateRepoRelativePath(relPath, "document path");
  const file = join(root, relPath);
  if (!existsSync(file)) fail(`missing document file ${relPath}`);
  const binding = loadBindingOrEmpty(root);
  if (binding.documents.some((doc) => doc.path === relPath)) {
    fail(`document ${relPath} is already bound`);
  }
  const entry: BoundDocument = {
    boundAt: options.now ?? nowUtcTimestamp(),
    documentType,
    executionAuthorization: null,
    lifecycle: "active",
    path: relPath,
    sha256: sha256Hex(readFileSync(file)),
  };
  binding.documents.push(entry);
  writeBindingAtomic(root, binding);
  return entry;
}

export interface BindPlanOptions {
  role?: string;
  executionScopeId?: string;
  closedScopeIds?: string[];
  now?: string;
}

/**
 * Appends a plan entry with `status: 'not-authorized'`. Role, scope, and closed
 * scopes come from the plan's own header; explicit options must match it. Any
 * existing active entry for the same role is marked superseded (lifecycle and
 * status) in the same atomic write, so exactly one active entry exists per role.
 */
export function bindPlanDocument(
  root: string,
  planRelPath: string,
  options: BindPlanOptions = {},
): BoundDocument {
  validateRepoRelativePath(planRelPath, "plan path");
  const file = join(root, planRelPath);
  if (!existsSync(file)) fail(`missing plan file ${planRelPath}`);
  const planBytes = readFileSync(file);
  const header = parsePlanHeader(planBytes.toString("utf8"), planRelPath);

  if (options.role !== undefined && options.role !== header.role) {
    fail(
      `--role ${options.role} does not match the plan header role ${header.role}`,
    );
  }
  if (
    options.executionScopeId !== undefined &&
    options.executionScopeId !== header.executionScopeId
  ) {
    fail(
      `--scope ${options.executionScopeId} does not match the plan header scope ` +
        header.executionScopeId,
    );
  }
  if (options.closedScopeIds !== undefined) {
    const provided = [...options.closedScopeIds].sort(compareCodePoints);
    const declared = header.closedScopeIds;
    const matches =
      provided.length === declared.length &&
      provided.every((scope, i) => scope === declared[i]);
    if (!matches) {
      fail(
        `--closed-scopes [${provided.join(", ")}] does not match the plan header declaration ` +
          `[${declared.join(", ")}]`,
      );
    }
  }

  const binding = loadBindingOrEmpty(root);
  if (binding.documents.some((doc) => doc.path === planRelPath)) {
    fail(`plan ${planRelPath} is already bound`);
  }
  for (const doc of binding.documents) {
    if (
      doc.documentType === "plan" &&
      doc.lifecycle === "active" &&
      doc.executionAuthorization !== null &&
      doc.executionAuthorization.role === header.role
    ) {
      doc.lifecycle = "superseded";
      doc.executionAuthorization.status = "superseded";
    }
  }
  const entry: BoundDocument = {
    boundAt: options.now ?? nowUtcTimestamp(),
    documentType: "plan",
    executionAuthorization: {
      closedScopeIds: header.closedScopeIds,
      decisionPath: null,
      decisionSha256: null,
      executionScopeId: header.executionScopeId,
      role: header.role,
      status: "not-authorized",
    },
    lifecycle: "active",
    path: planRelPath,
    sha256: sha256Hex(planBytes),
  };
  binding.documents.push(entry);
  writeBindingAtomic(root, binding);
  return entry;
}

export interface AuthorizePlanOptions {
  now?: string;
  /** Test hook executed after validation and before the reread/write step. */
  beforeWrite?: () => void;
}

/**
 * Transitions a bound plan to `authorized` on the strength of a user decision.
 * The decision is fully re-validated (strict PlanExecutionDecisionV1, or the G0
 * bootstrap markdown special case), its bytes are hashed, reread immediately
 * before writing (any change aborts without modifying the binding), and the
 * decision binding plus the plan's authorized transition are written atomically.
 */
export function authorizePlan(
  root: string,
  planRelPath: string,
  decisionRelPath: string,
  options: AuthorizePlanOptions = {},
): BoundDocument {
  validateRepoRelativePath(planRelPath, "plan path");
  validateRepoRelativePath(decisionRelPath, "decision path");
  const { binding } = readBinding(root);
  const entry = binding.documents.find((doc) => doc.path === planRelPath);
  if (!entry)
    fail(`plan ${planRelPath} is not bound; bind it before authorizing it`);
  if (entry.documentType !== "plan") {
    fail(
      `bound document ${planRelPath} is a ${entry.documentType}, not a plan`,
    );
  }
  if (entry.lifecycle !== "active") fail(`plan ${planRelPath} is superseded`);
  const authorization = entry.executionAuthorization;
  if (authorization === null)
    fail(`plan ${planRelPath} has no execution authorization record`);
  if (authorization.status === "authorized")
    fail(`plan ${planRelPath} is already authorized`);
  if (authorization.status !== "not-authorized") {
    fail(
      `plan ${planRelPath} has status ${authorization.status} and cannot be authorized`,
    );
  }

  const planFile = join(root, planRelPath);
  if (!existsSync(planFile)) fail(`missing plan file ${planRelPath}`);
  const measuredPlanSha = sha256Hex(readFileSync(planFile));
  if (measuredPlanSha !== entry.sha256) {
    fail(
      `plan ${planRelPath} bytes changed since binding (bound ${entry.sha256}, measured ` +
        `${measuredPlanSha}); rebind the plan before authorizing it`,
    );
  }

  const validated = validateDecisionForPlan(root, decisionRelPath, planRelPath);

  options.beforeWrite?.();

  const reread = readFileSync(join(root, decisionRelPath));
  if (!reread.equals(validated.bytes)) {
    fail(
      `decision ${decisionRelPath} changed between validation and binding; aborting without ` +
        "modifying the binding",
    );
  }

  const existingDecisionEntry = binding.documents.find(
    (doc) => doc.path === decisionRelPath,
  );
  if (existingDecisionEntry) {
    if (existingDecisionEntry.documentType !== "decision") {
      fail(`bound document ${decisionRelPath} is not a decision`);
    }
    if (existingDecisionEntry.sha256 !== validated.sha256) {
      fail(
        `decision ${decisionRelPath} is already bound with digest ${existingDecisionEntry.sha256}, ` +
          `which does not match its current bytes ${validated.sha256}`,
      );
    }
  } else {
    binding.documents.push({
      boundAt: options.now ?? nowUtcTimestamp(),
      documentType: "decision",
      executionAuthorization: null,
      lifecycle: "active",
      path: decisionRelPath,
      sha256: validated.sha256,
    });
  }
  authorization.status = "authorized";
  authorization.decisionPath = decisionRelPath;
  authorization.decisionSha256 = validated.sha256;
  writeBindingAtomic(root, binding);
  return entry;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface CliArguments {
  positionals: string[];
  options: Map<string, string>;
}

function parseArguments(argv: string[]): CliArguments {
  const positionals: string[] = [];
  const options = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] as string;
    if (arg.startsWith("--")) {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        fail(`option ${arg} requires a value`);
      }
      if (options.has(arg)) fail(`duplicate option ${arg}`);
      options.set(arg, value);
      i += 1;
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, options };
}

const USAGE = [
  "usage:",
  "  bind-authority-document.ts --type specification|execution-controller|decision <path>",
  "  bind-authority-document.ts <plan-path> --status not-authorized \\",
  "    [--role X --scope Y --closed-scopes a,b,c]",
  "  bind-authority-document.ts <plan-path> --status authorized --decision <decision-path>",
].join("\n");

export function runBindCli(argv: string[], root: string): number {
  try {
    const { positionals, options } = parseArguments(argv);
    if (positionals.length !== 1) {
      console.error(USAGE);
      return 2;
    }
    const documentPath = positionals[0] as string;
    const allowed = new Set([
      "--type",
      "--status",
      "--role",
      "--scope",
      "--closed-scopes",
      "--decision",
    ]);
    for (const key of options.keys()) {
      if (!allowed.has(key)) fail(`unknown option ${key}`);
    }

    const type = options.get("--type");
    if (type !== undefined) {
      if (
        type !== "specification" &&
        type !== "execution-controller" &&
        type !== "decision"
      ) {
        fail(
          `--type must be specification, execution-controller, or decision (plans use --status)`,
        );
      }
      if (options.size > 1) fail("--type cannot be combined with plan options");
      const entry = bindNonPlanDocument(root, documentPath, type);
      console.log(
        `bound ${entry.documentType} ${entry.path} (${entry.sha256})`,
      );
      return 0;
    }

    const status = options.get("--status");
    if (status === "authorized") {
      const decisionPath = options.get("--decision");
      if (decisionPath === undefined) {
        fail(
          "authorization requires --decision <decision-path>; a plan is never marked authorized " +
            "without a bound user decision",
        );
      }
      if (
        options.has("--role") ||
        options.has("--scope") ||
        options.has("--closed-scopes")
      ) {
        fail(
          "--role/--scope/--closed-scopes apply only to --status not-authorized registration",
        );
      }
      const entry = authorizePlan(root, documentPath, decisionPath);
      console.log(
        `authorized plan ${entry.path} via decision ` +
          `${entry.executionAuthorization?.decisionPath} ` +
          `(${entry.executionAuthorization?.decisionSha256})`,
      );
      return 0;
    }
    if (status === undefined || status === "not-authorized") {
      if (options.has("--decision")) {
        fail("--decision applies only to --status authorized");
      }
      const closedScopesRaw = options.get("--closed-scopes");
      const entry = bindPlanDocument(root, documentPath, {
        role: options.get("--role"),
        executionScopeId: options.get("--scope"),
        closedScopeIds: closedScopesRaw
          ?.split(",")
          .map((scope) => scope.trim()),
      });
      console.log(
        `bound plan ${entry.path} for role ${entry.executionAuthorization?.role} ` +
          `(status not-authorized)`,
      );
      return 0;
    }
    fail(`--status must be not-authorized or authorized, got ${status}`);
  } catch (error) {
    console.error(
      `bind-authority-document: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runBindCli(process.argv.slice(2), process.cwd()));
}
