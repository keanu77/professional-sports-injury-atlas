import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

test("video collection is directly browsable without search or filters", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("[data-featured-card]:visible")).toHaveCount(5);
  await expect(page.locator('[data-atlas-stat="videos"]')).toHaveText(
    String(await page.locator("[data-featured-card]:visible").count()),
  );
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expectNoAxeViolations(page);
  await page.locator("[data-featured-card] a").first().click();
  await expect(page.locator("[data-video-load]")).toBeVisible();
});

test("case opens with video, concise care, and a separately attributed athlete return", async ({
  page,
}) => {
  await page.goto("/cases/anfernee-simons-ankle-sprain-2023/");
  await expect(page.locator("[data-video-load]")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  const guide = page.locator("[data-patient-guide]");
  await expect(guide).toContainText("先做這幾件事");
  await expect(guide).toContainText("這些狀況別等");
  await expect(guide).toContainText("大約多久能回場");
  await expect(page.locator("[data-actual-return]")).toContainText("24");
  await expect(page.locator("[data-actual-return]")).toContainText(
    "不一定是首次復出",
  );
  await expect(page.locator("[data-professional-notes]")).not.toBeVisible();
  await page.getByText("深入了解這次受傷", { exact: true }).click();
  await expect(page.locator("[data-professional-notes]")).toBeVisible();
  await expectNoAxeViolations(page);
});

test("patient content remains readable without scripts", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(
    `http://127.0.0.1:${process.env.ATLAS_E2E_PORT ?? "4321"}/cases/anfernee-simons-ankle-sprain-2023/`,
  );
  await expect(page.locator("[data-patient-guide]")).toBeVisible();
  await page.locator(".guide-sources > summary").click();
  await expect(page.locator(".guide-sources a").first()).toBeVisible();
  await context.close();
});
