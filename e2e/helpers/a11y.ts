/**
 * Shared Axe accessibility helper. Every layout/navigation/video spec calls
 * this after each meaningful interactive state change; any WCAG A/AA
 * violation fails the test. Task 6/7 specs reuse this helper as-is.
 */

import { AxeBuilder } from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Runs an Axe WCAG A/AA scan and fails on any violation. */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const violationSummaries = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact ?? "unknown"}): ` +
      violation.nodes.map((node) => node.target.join(" ")).join("; "),
  );
  expect(violationSummaries).toEqual([]);
}
