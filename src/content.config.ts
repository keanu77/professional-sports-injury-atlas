/**
 * Astro content collections for cases, injury overviews, and quarterly
 * updates. Routes use `entry.id`, `getCollection()`, and `getEntry()`. The
 * three content directories stay empty (`.gitkeep` only) until real content
 * gates are authorized.
 */

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { caseSchema } from "./lib/contracts/case";
import { injuryOverviewSchema } from "./lib/contracts/injury-overview";
import { updateSchema } from "./lib/contracts/update";

const cases = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/cases" }),
  schema: caseSchema,
});

const injuries = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/injuries" }),
  schema: injuryOverviewSchema,
});

const updates = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/updates" }),
  schema: updateSchema,
});

export const collections = { cases, injuries, updates };
