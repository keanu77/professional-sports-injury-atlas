/**
 * Atlas navigation spec against the empty-collection review build. Covers
 * the three home injury cards with the transparent `0 reviewed cases` state,
 * the always-present injury routes with scope/course information and no
 * fabricated cases, the absence of MLB/football/empty league routes, the
 * exact pending course-link label without a guessed URL, and the review-only
 * markers on lab/fixture routes.
 */

import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

const INJURY_CODES = ["acl", "ankle-sprain", "achilles-rupture"];

test.describe("atlas navigation", () => {
  test("home shows the three injury cards with a transparent zero state", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-injury-card]")).toHaveCount(3);
    for (const code of INJURY_CODES) {
      await expect(page.locator(`[data-injury-card="${code}"]`)).toBeVisible();
      await expect(
        page.locator(
          `[data-injury-card="${code}"] [data-reviewed-case-count="0"]`,
        ),
      ).toContainText("0 reviewed cases");
    }
    await expect(page.locator("[data-total-reviewed-count]")).toContainText(
      "0",
    );
    await expect(page.locator("[data-total-reviewed-count]")).toContainText(
      "reviewed cases",
    );
    await expectNoAxeViolations(page);
  });

  test("the three injury routes exist with scope info and no fake cases", async ({
    page,
  }) => {
    for (const code of INJURY_CODES) {
      const response = await page.goto(`/injuries/${code}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("[data-injury-scope]")).toContainText(
        "0 reviewed cases",
      );
      // Transparent teaching-overview state instead of fabricated clinical copy.
      await expect(
        page.getByText("傷種教學待審查", { exact: false }).first(),
      ).toBeVisible();
      // The empty listing states plainly that no reviewed case exists.
      await expect(
        page
          .locator("[data-static-listing] [data-empty-state]")
          .getByText("目前沒有已審查的案例"),
      ).toBeVisible();
      // No case card renders anywhere on the page.
      await expect(page.locator(".case-list li")).toHaveCount(0);
    }
    await expectNoAxeViolations(page);
  });

  test("no MLB, football, or empty league route is generated", async ({
    page,
  }) => {
    for (const path of [
      "/leagues/nba/",
      "/leagues/mlb/",
      "/sports/football/",
      "/injuries/hamstring-strain/",
    ]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
    }
  });

  test("course cards show the exact pending label and never guess a URL", async ({
    page,
  }) => {
    await page.goto("/injuries/acl/");
    const courseCard = page.locator("[data-course-key]").first();
    await expect(courseCard).toBeVisible();
    await expect(courseCard.locator("[data-course-link-pending]")).toHaveText(
      "課程連結待核准",
    );
    // A pending card contains no outbound course anchor at all.
    await expect(courseCard.locator("a")).toHaveCount(0);
  });

  test("review lab and fixture routes are marked as review-only", async ({
    page,
  }) => {
    await page.goto("/review/component-lab/");
    await expect(
      page.getByRole("heading", { level: 1, name: /審查專用/ }),
    ).toBeVisible();

    await page.goto("/review/fixtures/case-detail/");
    await expect(page.locator("[data-review-only-marker]")).toBeVisible();
    await expect(page.locator("[data-review-only-marker]")).toContainText(
      "Review-only fixture",
    );
  });
});
