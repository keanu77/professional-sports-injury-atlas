/**
 * Site-governance contract: current policy versions and the strict shape of
 * the governance data file added in a later task. Provenance verification and
 * public-rights clearance each bind one of these versions; bumping a version
 * deliberately invalidates prior verifications until rechecked.
 */

import { z } from "astro/zod";
import { issue, type ValidationIssue } from "./canonical";

export const CURRENT_SOURCE_POLICY_VERSION = "source-policy-v1";
export const CURRENT_PUBLIC_RIGHTS_POLICY_VERSION = "public-rights-policy-v1";

export const siteGovernanceSchema = z.strictObject({
  schemaVersion: z.literal(1),
  sourcePolicyVersion: z.string().min(1),
  publicRightsPolicyVersion: z.string().min(1),
  indexingMode: z.enum(["noindex"]),
  launchCorpus: z.strictObject({
    minCasesPerInjury: z.number().int().min(1),
    minTotalCases: z.number().int().min(1),
    preferRecentOverClassic: z.boolean(),
  }),
});

export type SiteGovernance = z.infer<typeof siteGovernanceSchema>;

export function validateSiteGovernance(value: unknown): ValidationIssue[] {
  const parsed = siteGovernanceSchema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((zodIssue) =>
      issue("governance-schema", zodIssue.path.join("."), zodIssue.message),
    );
  }
  return [];
}
