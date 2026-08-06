/**
 * Exports the injury-case Zod schema as a canonical Draft 2020-12 JSON Schema
 * artifact. The committed artifact must be byte-identical to regeneration;
 * there is no second handwritten schema.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "astro/zod";
import { canonicalJson } from "../src/lib/cases/canonical-json";
import { caseSchema } from "../src/lib/contracts/case";

export const CASE_SCHEMA_ARTIFACT_PATH = "schemas/injury-case.v1.schema.json";

export function renderCaseJsonSchema(): string {
  return canonicalJson(z.toJSONSchema(caseSchema));
}

export function writeCaseJsonSchema(root: string): string {
  const target = join(root, CASE_SCHEMA_ARTIFACT_PATH);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, renderCaseJsonSchema());
  return target;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const target = writeCaseJsonSchema(process.cwd());
  console.log(`wrote ${target}`);
}
