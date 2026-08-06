/**
 * `plan:assert-authorized <plan-path>` — the post-bind execution gate.
 *
 * Requires the plan's binding entry to be active with status `authorized` and a
 * bound decision path/digest. Every invocation re-parses the binding and
 * recomputes the plan and decision hashes; the G0 bootstrap markdown decision
 * is fully re-verified (anchored keys plus its three snapshot digests) exactly
 * like every strict JSON decision. Authorization is never inferred from the
 * presence of a plan, free text, a denial file, or an earlier gate.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  type BoundDocument,
  type ExecutionAuthorization,
  PlanBindingError,
  parsePlanHeader,
  readBinding,
  sha256Hex,
  validateDecisionForPlan,
  validateRepoRelativePath,
} from "./verify-plan-binding.ts";

function fail(message: string): never {
  throw new PlanBindingError(message);
}

export function assertPlanAuthorized(
  root: string,
  planRelPath: string,
): BoundDocument {
  validateRepoRelativePath(planRelPath, "plan path");
  const { binding } = readBinding(root);
  const entry = binding.documents.find((doc) => doc.path === planRelPath);
  if (!entry) fail(`plan ${planRelPath} is not bound`);
  if (entry.documentType !== "plan") {
    fail(
      `bound document ${planRelPath} is a ${entry.documentType}, not a plan`,
    );
  }
  if (entry.lifecycle !== "active") {
    fail(`plan ${planRelPath} is not active (lifecycle ${entry.lifecycle})`);
  }
  const authorization = entry.executionAuthorization as ExecutionAuthorization;
  if (authorization.status !== "authorized") {
    fail(
      `plan ${planRelPath} is not authorized (status ${authorization.status})`,
    );
  }
  if (
    authorization.decisionPath === null ||
    authorization.decisionSha256 === null
  ) {
    fail(
      `plan ${planRelPath} is marked authorized without a bound decision path/digest`,
    );
  }

  const planFile = join(root, planRelPath);
  if (!existsSync(planFile)) fail(`plan file ${planRelPath} is absent`);
  const planBytes = readFileSync(planFile);
  const measuredPlanSha = sha256Hex(planBytes);
  if (measuredPlanSha !== entry.sha256) {
    fail(
      `plan ${planRelPath} bytes changed since binding: bound ${entry.sha256}, measured ` +
        measuredPlanSha,
    );
  }
  const header = parsePlanHeader(planBytes.toString("utf8"), planRelPath);
  if (
    header.role !== authorization.role ||
    header.executionScopeId !== authorization.executionScopeId ||
    header.closedScopeIds.length !== authorization.closedScopeIds.length ||
    !header.closedScopeIds.every(
      (scope, i) => scope === authorization.closedScopeIds[i],
    )
  ) {
    fail(
      `plan ${planRelPath} header does not match its bound execution authorization`,
    );
  }

  const decision = validateDecisionForPlan(
    root,
    authorization.decisionPath,
    planRelPath,
  );
  if (decision.sha256 !== authorization.decisionSha256) {
    fail(
      `decision ${authorization.decisionPath} bytes changed since binding: bound ` +
        `${authorization.decisionSha256}, measured ${decision.sha256}`,
    );
  }
  return entry;
}

export function runAssertCli(argv: string[], root: string): number {
  try {
    if (argv.length !== 1) {
      console.error("usage: assert-plan-authorized.ts <plan-path>");
      return 2;
    }
    const entry = assertPlanAuthorized(root, argv[0] as string);
    const authorization =
      entry.executionAuthorization as ExecutionAuthorization;
    console.log(
      `plan ${entry.path} is authorized for role ${authorization.role} ` +
        `(scope ${authorization.executionScopeId}) by decision ${authorization.decisionPath}`,
    );
    return 0;
  } catch (error) {
    console.error(
      `assert-plan-authorized: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runAssertCli(process.argv.slice(2), process.cwd()));
}
