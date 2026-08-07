/**
 * Atlas navigation spec against the authorized 26-case review build. Covers
 * the exact 7/12/7 home counts, injury routes with reviewed overviews and
 * cases, the NBA route and absence of MLB/football routes, the
 * exact pending course-link label without a guessed URL, and the review-only
 * markers on lab/fixture routes.
 */

import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

const INJURY_CODES = ["acl", "ankle-sprain", "achilles-rupture"];
const REVIEW_COUNTS: Record<string, number> = {
  acl: 7,
  "ankle-sprain": 12,
  "achilles-rupture": 7,
};

test.describe("atlas navigation", () => {
  test("home shows the exact authorized case distribution", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-injury-card]")).toHaveCount(3);
    for (const code of INJURY_CODES) {
      await expect(page.locator(`[data-injury-card="${code}"]`)).toBeVisible();
      await expect(
        page.locator(
          `[data-injury-card="${code}"] [data-reviewed-case-count="${REVIEW_COUNTS[code]}"]`,
        ),
      ).toContainText(`${REVIEW_COUNTS[code]} reviewed cases`);
    }
    await expect(page.locator("[data-total-reviewed-count]")).toContainText(
      "26",
    );
    await expect(page.locator("[data-total-reviewed-count]")).toContainText(
      "reviewed cases",
    );
    await expectNoAxeViolations(page);
  });

  test("the three injury routes expose their real overviews and exact cases", async ({
    page,
  }) => {
    for (const code of INJURY_CODES) {
      const response = await page.goto(`/injuries/${code}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("[data-injury-scope]")).toContainText(
        `${REVIEW_COUNTS[code]} reviewed cases`,
      );
      await expect(
        page.getByRole("heading", { level: 2, name: "傷種教學總覽" }),
      ).toBeVisible();
      await expect(
        page.locator("[data-static-listing] .case-list li"),
      ).toHaveCount(REVIEW_COUNTS[code]!);
    }
    await expectNoAxeViolations(page);
  });

  test("generates NBA but no MLB, football, or unknown injury route", async ({
    page,
  }) => {
    const nba = await page.goto("/leagues/nba/");
    expect(nba?.status()).toBe(200);
    for (const path of [
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
