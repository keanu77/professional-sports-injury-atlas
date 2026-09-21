import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

test("video collection is directly browsable before using optional search", async ({
  page,
}) => {
  await page.goto("/");
  const expectedCount =
    process.env.ATLAS_PUBLIC_LAUNCH === "decision-21" ? 200 : 5;
  await expect(page.locator("[data-featured-card]:visible")).toHaveCount(
    Math.min(24, expectedCount),
  );
  await expect(page.locator('[data-atlas-stat="videos"]')).toHaveText(
    String(await page.locator("[data-featured-card]").count()),
  );
  await expect(
    page.getByRole("searchbox", { name: "搜尋球員或關鍵字" }),
  ).toBeVisible();
  if (process.env.ATLAS_PUBLIC_LAUNCH === "decision-21") {
    const typeFilter = page.getByRole("combobox", {
      name: "影片類型",
      exact: true,
    });
    await expect(typeFilter).toBeVisible();
    await expect(typeFilter).toHaveValue("");
  } else {
    await expect(page.getByRole("combobox")).toHaveCount(0);
  }
  await expectNoAxeViolations(page);
  await page.locator("[data-featured-card]:visible a").first().click();
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
  const actualReturn = page.locator("[data-actual-return]");
  if (process.env.ATLAS_PUBLIC_LAUNCH === "decision-21") {
    await expect(actualReturn).toContainText("距受傷 15 天");
    await expect(actualReturn).toContainText("里程碑：首次出賽");
    await expect(actualReturn).toContainText("3 月 10 日是再次復出");
  } else {
    await expect(actualReturn).toContainText("24");
    await expect(actualReturn).toContainText("不一定是首次復出");
  }
  await expect(page.locator("[data-professional-notes]")).not.toBeVisible();
  await page
    .getByText(
      process.env.ATLAS_PUBLIC_LAUNCH === "decision-21"
        ? "原始事件紀錄與詳細說明"
        : "深入了解這次受傷",
      { exact: true },
    )
    .click();
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
