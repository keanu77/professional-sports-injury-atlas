/**
 * `plan:resolve <role>` — prints exactly one active bound plan path for the
 * given execution role, or fails with a non-zero exit code.
 */

import { pathToFileURL } from "node:url";

import { PlanBindingError, readBinding } from "./verify-plan-binding.ts";

function fail(message: string): never {
  throw new PlanBindingError(message);
}

export function resolveActivePlan(root: string, role: string): string {
  if (typeof role !== "string" || role.trim() === "") {
    fail("a non-empty execution role is required");
  }
  const { binding } = readBinding(root);
  const active = binding.documents.filter(
    (doc) =>
      doc.documentType === "plan" &&
      doc.lifecycle === "active" &&
      doc.executionAuthorization !== null &&
      doc.executionAuthorization.role === role,
  );
  if (active.length !== 1) {
    fail(
      `expected exactly one active bound plan for role ${role}, found ${active.length}`,
    );
  }
  return (active[0] as { path: string }).path;
}

export function runResolveCli(argv: string[], root: string): number {
  try {
    if (argv.length !== 1) {
      console.error("usage: resolve-active-plan.ts <role>");
      return 2;
    }
    console.log(resolveActivePlan(root, argv[0] as string));
    return 0;
  } catch (error) {
    console.error(
      `resolve-active-plan: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(runResolveCli(process.argv.slice(2), process.cwd()));
}
