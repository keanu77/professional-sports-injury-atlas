import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

const visibleCards = "[data-discovery-slug]:visible";
test.beforeEach(async ({ page }) => {
  test.skip(
    process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21",
    "Full catalogue belongs to the public launch",
  );
  await page.goto("/");
});

test("searches Chinese and English names, injury keywords and multiple terms", async ({
  page,
}) => {
  const input = page.getByRole("searchbox", { name: "搜尋球員或關鍵字" });
  await expect(page.locator(visibleCards)).toHaveCount(24);
  await input.fill("大谷 棒球");
  await expect(page.locator(visibleCards)).toHaveCount(1);
  await expect(page.locator(visibleCards)).toHaveAttribute(
    "data-discovery-slug",
    "shohei-ohtani-world-series-2024",
  );
  await input.fill("ＫＯＢＥ achilles");
  await expect(page.locator(visibleCards)).toHaveAttribute(
    "data-discovery-slug",
    "kobe-bryant-2013-achilles",
  );
  await input.fill("TATUM");
  await expect(page.locator(visibleCards)).toHaveAttribute(
    "data-discovery-slug",
    "jayson-tatum-achilles-rupture-2025",
  );
  await input.fill("前十字韌帶");
  expect(await page.locator(visibleCards).count()).toBeGreaterThan(5);
  await expect(
    page.locator('[data-discovery-slug="carolina-marin-indonesia-2019"]'),
  ).toBeVisible();
  await page.getByRole("button", { name: "清除搜尋", exact: true }).click();
  await expect(input).toBeFocused();
  await expect(page.locator(visibleCards)).toHaveCount(24);
  await expectNoAxeViolations(page);
});

test("keeps the query when changing scope and can expand beyond curated results", async ({
  page,
}) => {
  const input = page.getByRole("searchbox");
  await page.getByRole("button", { name: "精選影片", exact: true }).click();
  await input.fill("大谷");
  await expect(page.locator(visibleCards)).toHaveCount(0);
  await expect(page.locator("[data-discovery-status]")).toContainText(
    "精選影片中找到 0 支",
  );
  await expect(page.locator("[data-video-search-empty]")).toBeVisible();
  await page.getByRole("button", { name: "改查全部影片", exact: true }).click();
  await expect(input).toHaveValue("大谷");
  await expect(input).toBeFocused();
  await expect(page.locator(visibleCards)).toHaveCount(1);
  await input.press("Escape");
  await expect(page.locator(visibleCards)).toHaveCount(24);
  await page.getByRole("button", { name: "精選影片", exact: true }).click();
  await expect(page.locator(visibleCards)).toHaveCount(10);
});

test("handles IME composition and treats hostile input as plain text without navigation", async ({
  page,
}) => {
  const input = page.getByRole("searchbox");
  await input.dispatchEvent("compositionstart");
  await input.evaluate((node: HTMLInputElement) => {
    node.value = "大谷";
    node.dispatchEvent(
      new InputEvent("input", { bubbles: true, isComposing: true }),
    );
  });
  await expect(page.locator(visibleCards)).toHaveCount(24);
  await input.dispatchEvent("compositionend");
  await expect(page.locator(visibleCards)).toHaveCount(1);
  const url = page.url();
  await input.fill('<img src=x onerror="window.searchInjected=true">');
  await input.press("Enter");
  await expect(page.locator(visibleCards)).toHaveCount(0);
  await expect(page.locator("[data-discovery-status] img")).toHaveCount(0);
  expect(await page.evaluate(() => "searchInjected" in window)).toBe(false);
  expect(new URL(page.url()).pathname).toBe(new URL(url).pathname);
  expect(new URL(page.url()).searchParams.get("q")).toBe(
    '<img src=x onerror="window.searchInjected=true">',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("filters popular ten while retaining original ranks and latest query during a slow response", async ({
  page,
}) => {
  const ids = await page
    .locator("[data-discovery-slug][data-video-id]")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-video-id")!),
    );
  const kobe = "5KlgfpqWCkY";
  const ordered = [
    ...ids.filter((id) => id !== kobe).slice(0, 3),
    kobe,
    ...ids.filter((id) => id !== kobe).slice(3, 10),
  ];
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/popular", async (route) => {
    await gate;
    await route.fulfill({
      json: {
        windowDays: 30,
        generatedAt: new Date().toISOString(),
        items: ordered.map((videoId, index) => ({
          videoId,
          count: 100 - index,
        })),
      },
    });
  });
  await page.getByRole("button", { name: "本站熱門", exact: true }).click();
  await page.getByRole("searchbox").fill("kobe");
  release();
  await expect(page.locator(visibleCards)).toHaveCount(1);
  await expect(page.locator("[data-popular-count]:visible")).toHaveText(
    "近 30 天播放第四名",
  );
  await page.getByRole("button", { name: "清除搜尋", exact: true }).click();
  await expect(page.locator(visibleCards)).toHaveCount(10);
});

test("ignores obsolete popularity results and distinguishes API failure from no search matches", async ({
  page,
}) => {
  let release!: () => void;
  let arrived!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requestSeen = new Promise<void>((resolve) => {
    arrived = resolve;
  });
  await page.route("**/api/popular", async (route) => {
    arrived();
    await gate;
    await route.fulfill({ status: 503, body: "Unavailable" });
  });
  await page.getByRole("button", { name: "本站熱門", exact: true }).click();
  await requestSeen;
  await page.getByRole("searchbox").fill("大谷");
  await page.getByRole("button", { name: "全部影片", exact: true }).click();
  release();
  await expect(page.locator(visibleCards)).toHaveCount(1);
  await expect(page.locator("[data-discovery-status]")).toContainText(
    "全部影片中找到 1 支",
  );
  await page.getByRole("button", { name: "本站熱門", exact: true }).click();
  await expect(page.locator("[data-discovery-status]")).toContainText(
    "目前無法讀取本站熱門",
  );
  await expect(page.locator("[data-video-search-empty]")).toBeHidden();
  await page.getByRole("button", { name: "改查全部影片", exact: true }).click();
  await expect(page.locator(visibleCards)).toHaveCount(1);
});

test("keeps all videos browsable with scripts disabled", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    await expect(page.locator("[data-video-search]")).toBeHidden();
    await expect(page.locator(visibleCards)).toHaveCount(200);
    await expect(page.locator("[data-discovery-controls]")).toBeHidden();
  } finally {
    await context.close();
  }
});
