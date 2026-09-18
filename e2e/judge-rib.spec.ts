import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

test.beforeEach(() => {
  test.skip(
    process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21",
    "Observation catalog must be enabled",
  );
});

test("Judge rib case keeps the suspected date, return milestone, and historical video distinct", async ({
  page,
}) => {
  await page.goto("/videos/aaron-judge-2026-rib/");
  await expect(
    page.getByRole("heading", { name: "Aaron Judge", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-footage-kind]")).toHaveAttribute(
    "data-footage-kind",
    "news-analysis",
  );
  await expect(page.locator("[data-video-embed]")).toHaveAttribute(
    "data-video-id",
    "-M5v2OSrnEY",
  );
  await expect(page.locator(".return-days")).toHaveCount(0);
  await expect(page.locator("[data-recovery-timeline]")).toContainText(
    "2026-09-08",
  );
  await expect(page.locator("[data-recovery-timeline]")).toContainText(
    "複查時間不等於可復賽時間",
  );
  await expect(page.locator("[data-rib-injury-care]")).toContainText("咳血");
  await expect(
    page.getByRole("link", { name: /歷史影片.*2019-09-18/ }),
  ).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expectNoAxeViolations(page);
});

test("home search separates Judge's rib and toe cases", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "搜尋球員或關鍵字" });
  await search.fill("Aaron Judge");
  await expect(page.locator("[data-discovery-slug]:visible")).toHaveCount(2);
  await search.fill("Judge 肋骨");
  await expect(page.locator("[data-discovery-slug]:visible")).toHaveCount(1);
  await expect(page.locator("[data-discovery-slug]:visible")).toHaveAttribute(
    "data-discovery-slug",
    "aaron-judge-2026-rib",
  );
});
