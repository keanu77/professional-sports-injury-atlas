/**
 * Data-bearing review fixture routes. The fictional review build proves the
 * production view templates: case detail with the classic label and the
 * separated diagnosis-confirmation/workflow states, the injury teaching
 * overview, the league listing, the quarterly update with the latest-update
 * link, and the LayeredNotes native button group (aria-pressed emphasis,
 * both sections always readable, stable focus, Enter/Space activation).
 * Axe runs before and after each state change and at 200% zoom reflow.
 */

import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

test.describe("data-bearing fixture routes", () => {
  test("case detail renders the classic label and separated statuses", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");
    await expect(page.locator('[data-atlas-view="case-detail"]')).toBeVisible();

    // Classic cases always show the exact label plus a readable reason.
    const classic = page.locator("[data-classic-label]");
    await expect(classic).toContainText("經典案例");
    await expect(classic).toContainText("虛構教學示範");

    // External diagnosis confirmation and the private workflow badge are
    // distinct blocks; the workflow badge labels itself as non-diagnostic.
    const confirmation = page.locator(".case-confirmation").first();
    await expect(confirmation).toContainText("診斷確認狀態（外部來源）");
    const workflowBadge = page.locator("[data-review-badge]").first();
    await expect(workflowBadge).toContainText("內部審查工作流程狀態（非診斷）");
    await expect(workflowBadge).not.toContainText("診斷確認狀態");

    // Mechanism tags stay labeled as observation, never diagnosis.
    await expect(page.locator(".mechanism-tags")).toContainText(
      "觀察分類，非診斷",
    );
    await expectNoAxeViolations(page);
  });

  test("injury overview, league listing, and update fixture routes render", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/injury-overview/");
    await expect(
      page.locator('[data-atlas-view="injury-overview"]'),
    ).toBeVisible();
    await expect(page.locator("[data-injury-overview]")).toBeVisible();
    await expectNoAxeViolations(page);

    await page.goto("/review/fixtures/league-listing/");
    await expect(
      page.locator('[data-atlas-view="league-listing"]'),
    ).toBeVisible();
    expect(
      await page.locator("[data-static-listing] li").count(),
    ).toBeGreaterThan(0);
    await expectNoAxeViolations(page);

    await page.goto("/review/fixtures/latest-update/");
    await expect(
      page.locator('[data-atlas-view="quarterly-update"]'),
    ).toBeVisible();
    await expect(page.locator("[data-latest-update-link]")).toBeVisible();
    // Update transitions expose case IDs with their clinical digests.
    await expect(
      page
        .locator("article")
        .getByText(/clinical digest/)
        .first(),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("review pages expose IDs and copyable digests", async ({ page }) => {
    await page.goto("/review/fixtures/case-detail/");
    await expect(page.locator("[data-review-digests]")).toBeVisible();
    await expect(page.locator("[data-record-id]")).toContainText(
      "CASE-FIC-2014-901",
    );
    const digestValues = await page
      .locator(".digest-field")
      .evaluateAll((fields) =>
        fields.map((field) => (field as HTMLInputElement).value),
      );
    expect(digestValues.length).toBeGreaterThanOrEqual(2);
    for (const value of digestValues) {
      expect(value).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  test("LayeredNotes is an emphasis toggle, not a fake tab interface", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");
    const notes = page.locator("[data-layered-notes]");
    const generalButton = page.getByRole("button", {
      name: "一般讀者筆記",
    });
    const professionalButton = page.getByRole("button", {
      name: "專業筆記",
    });
    const general = page.locator('[data-layer="general"]');
    const professional = page.locator('[data-layer="professional"]');

    // Native button group: two type=button controls with unique
    // aria-controls and exactly one pressed state.
    await expect(generalButton).toHaveAttribute("type", "button");
    await expect(professionalButton).toHaveAttribute("type", "button");
    const generalControls = await generalButton.getAttribute("aria-controls");
    const professionalControls =
      await professionalButton.getAttribute("aria-controls");
    expect(generalControls).not.toBeNull();
    expect(professionalControls).not.toBeNull();
    expect(generalControls).not.toBe(professionalControls);
    await expect(generalButton).toHaveAttribute("aria-pressed", "true");
    await expect(professionalButton).toHaveAttribute("aria-pressed", "false");
    await expect(notes).toHaveAttribute("data-emphasis", "general");
    await expectNoAxeViolations(page);

    // Click moves emphasis only: aria-pressed swaps, both sections remain
    // visible, and the handler never moves focus into either section.
    await professionalButton.click();
    await expect(professionalButton).toHaveAttribute("aria-pressed", "true");
    await expect(generalButton).toHaveAttribute("aria-pressed", "false");
    await expect(notes).toHaveAttribute("data-emphasis", "professional");
    await expect(general).toBeVisible();
    await expect(professional).toBeVisible();
    const focusInsideLayer = await page.evaluate(() => {
      const active = document.activeElement;
      if (active === null) return false;
      return (
        active.closest('[data-layer="general"]') !== null ||
        active.closest('[data-layer="professional"]') !== null
      );
    });
    expect(focusInsideLayer).toBe(false);
    await expectNoAxeViolations(page);

    // Normal keyboard activation with Enter and Space keeps focus stable.
    await generalButton.focus();
    await page.keyboard.press("Enter");
    await expect(generalButton).toHaveAttribute("aria-pressed", "true");
    await expect(notes).toHaveAttribute("data-emphasis", "general");
    await expect(generalButton).toBeFocused();
    await professionalButton.focus();
    await page.keyboard.press("Space");
    await expect(professionalButton).toHaveAttribute("aria-pressed", "true");
    await expect(notes).toHaveAttribute("data-emphasis", "professional");
    await expect(professionalButton).toBeFocused();
    await expect(general).toBeVisible();
    await expect(professional).toBeVisible();
  });

  test("stays accessible at 200% zoom reflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto("/review/fixtures/case-detail/");
    const overflow = await page.evaluate(() => {
      const root = document.documentElement;
      const main = document.querySelector("main");
      return {
        document: root.scrollWidth - root.clientWidth,
        main: main === null ? Number.NaN : main.scrollWidth - main.clientWidth,
      };
    });
    expect(overflow.document).toBeLessThanOrEqual(1);
    expect(overflow.main).toBeLessThanOrEqual(1);
    await expectNoAxeViolations(page);

    await page.getByRole("button", { name: "專業筆記" }).click();
    await expectNoAxeViolations(page);
  });
});
