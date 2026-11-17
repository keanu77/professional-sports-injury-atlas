import { expect, test } from "@playwright/test";

test.beforeEach(() =>
  test.skip(
    process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21",
    "Public catalogue only",
  ),
);
const cards = "[data-discovery-slug]:visible";

test("finds Chinese aliases and offers an explicit typo suggestion without rewriting the query", async ({
  page,
}) => {
  await page.goto("/?q=柯比");
  await expect(page.locator(cards)).toHaveCount(1);
  await expect(page.locator(cards)).toHaveAttribute(
    "data-discovery-slug",
    "kobe-bryant-2013-achilles",
  );
  await page.getByRole("searchbox").fill("Kobee");
  await expect(page.locator(cards)).toHaveCount(0);
  await expect(page.getByRole("searchbox")).toHaveValue("Kobee");
  await page
    .locator("[data-search-suggestions]")
    .getByRole("button", { name: "Kobe Bryant", exact: true })
    .click();
  await expect(page.getByRole("searchbox")).toHaveValue("Kobe Bryant");
  await expect(page.locator(cards)).toHaveCount(1);
});

test("shares a custom date range and content sorting, restores history and displays unknown dates explicitly", async ({
  page,
}) => {
  await page.goto(
    "/?period=custom&from=2024-11-18&to=2026-11-18&sort=updated-newest",
  );
  const resultDates = await page.locator(cards).evaluateAll((nodes) =>
    nodes.map((node) => ({
      event: node.getAttribute("data-event-date")!,
      updated: node.getAttribute("data-content-checked-at")!,
    })),
  );
  expect(resultDates.length).toBeGreaterThan(0);
  expect(
    resultDates.every(
      (date) => date.event >= "2024-11-18" && date.event <= "2026-11-18",
    ),
  ).toBe(true);
  expect(resultDates.map((date) => date.updated)).toEqual(
    resultDates
      .map((date) => date.updated)
      .sort()
      .reverse(),
  );
  const toggle = page.locator("[data-advanced-toggle]");
  if (await toggle.isVisible()) await toggle.click();
  await expect(
    page.getByLabel("開始日期（含當日）", { exact: true }),
  ).toHaveValue("2024-11-18");
  await page
    .getByLabel("事件日期範圍", { exact: true })
    .selectOption("unknown");
  await expect(page.locator(cards).first()).toContainText("確切日期不詳");
  expect(
    await page
      .locator(cards)
      .evaluateAll((nodes) =>
        nodes.every((node) => !node.getAttribute("data-event-date")),
      ),
  ).toBe(true);
  await page.goBack();
  await expect(page.getByLabel("事件日期範圍", { exact: true })).toHaveValue(
    "custom",
  );
  await expect(page.getByLabel("排序", { exact: true })).toHaveValue(
    "updated-newest",
  );
  await page.reload();
  await expect(page.getByLabel("事件日期範圍", { exact: true })).toHaveValue(
    "custom",
  );
});

test("anchors rolling dates to the Taiwan day and keeps dates when navigating to a case and back", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-17T16:05:00Z"));
  await page.goto("/?period=recent-2y&sort=event-newest");
  await expect(page.locator("[data-date-help]")).toContainText(
    "2024-11-18 至 2026-11-18",
  );
  const dates = await page
    .locator(cards)
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-event-date")!),
    );
  expect(dates).toEqual([...dates].sort().reverse());
  expect(
    dates.every((date) => date >= "2024-11-18" && date <= "2026-11-18"),
  ).toBe(true);
  const firstLink = page.locator(cards).first().locator("h3 a");
  await firstLink.click();
  await page.goBack();
  await expect(page).toHaveURL(/period=recent-2y/);
  await expect(page.locator(cards)).toHaveCount(dates.length);
});

test("keeps new date controls within a 320px viewport and reports reversed ranges", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/?period=custom&from=2026-11-18&to=2024-11-18");
  await page.getByRole("button", { name: /更多篩選/ }).click();
  await expect(page.locator("[data-date-error]")).toContainText(
    "開始日期不能晚於結束日期",
  );
  await expect(page.locator(cards)).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: /移除事件日期/ }).click();
  await expect(page.locator(cards)).toHaveCount(24);
  await expect(page.locator("[data-date-error]")).toBeHidden();
});
