/**
 * Astro content collections for cases, additive pending follow-up sidecars,
 * injury overviews, and quarterly updates.
 */

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { caseSchema } from "./lib/contracts/case";
import { caseFollowUpSchema } from "./lib/contracts/case-follow-up";
import { injuryOverviewSchema } from "./lib/contracts/injury-overview";
import { updateSchema } from "./lib/contracts/update";

const cases = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/cases" }),
  schema: caseSchema,
});

const followUps = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/follow-ups" }),
  schema: caseFollowUpSchema,
});

const injuries = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/injuries" }),
  schema: injuryOverviewSchema,
});

const updates = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/updates" }),
  schema: updateSchema,
});

export const collections = { cases, followUps, injuries, updates };
