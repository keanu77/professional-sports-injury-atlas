/**
 * `plan:decision:verify` — preflight validation of a strict
 * PlanExecutionDecisionV1 JSON decision against a target plan.
 *
 * Validates schema/scope with the shared duplicate-key-detecting parser and
 * prints the measured decision SHA-256 on success. It does not require the
 * decision to be bound yet; binding happens through `plan:bind`.
 */

import { pathToFileURL } from "node:url";

import { validatePlanExecutionDecision } from "./verify-plan-binding.ts";

export { validatePlanExecutionDecision } from "./verify-plan-binding.ts";

export function runValidateDecisionCli(argv: string[], root: string): number {
  try {
    let decisionPath: string | undefined;
    let planPath: string | undefined;
    for (let i = 0; i < argv.length; i += 1) {
      const arg = argv[i];
      if (arg === "--decision" && decisionPath === undefined) {
        decisionPath = argv[i + 1];
        i += 1;
      } else if (arg === "--plan" && planPath === undefined) {
        planPath = argv[i + 1];
        i += 1;
      } else {
        console.error(
          "usage: validate-plan-execution-decision.ts --decision <decision-path> --plan <plan-path>",
        );
        return 2;
      }
    }
    if (decisionPath === undefined || planPath === undefined) {
      console.error(
        "usage: validate-plan-execution-decision.ts --decision <decision-path> --plan <plan-path>",
      );
      return 2;
    }
    const result = validatePlanExecutionDecision(root, decisionPath, planPath);
    console.log(result.sha256);
    return 0;
  } catch (error) {
    console.error(
      `validate-plan-execution-decision: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runValidateDecisionCli(process.argv.slice(2), process.cwd()));
}
