import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

const PUBLIC_LAUNCH = process.env.ATLAS_PUBLIC_LAUNCH === "decision-21";

test.describe("Decision 39 compact mobile discovery", () => {
  test("shows one category at a time on mobile and all categories on desktop", async ({
    page,
  }) => {
    test.skip(
      !PUBLIC_LAUNCH,
      "Three category routes belong to the public launch",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator('[data-atlas-stat="videos"]')).toHaveText("151");
    await expect(page.locator("[data-featured-card]")).toHaveCount(151);

    const categoryControls = page.locator("[data-home-category-controls]");
    await expect(categoryControls).toBeVisible();
    const bodyPartButton = page.getByRole("button", { name: "依受傷部位" });
    const sportButton = page.getByRole("button", { name: "依運動項目" });
    const situationButton = page.getByRole("button", { name: "依受傷情境" });
    await expect(bodyPartButton).toHaveAttribute("aria-expanded", "true");
    await expect(sportButton).toHaveAttribute("aria-expanded", "false");
    await expect(situationButton).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#home-category-body-parts")).toBeVisible();
    await expect(page.locator("#home-category-sports")).toBeHidden();
    await expect(page.locator("#home-category-situations")).toBeHidden();

    await sportButton.focus();
    await page.keyboard.press("Enter");
    await expect(sportButton).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#home-category-body-parts")).toBeHidden();
    await expect(page.locator("#home-category-sports")).toBeVisible();
    await expect(page.locator("#home-category-situations")).toBeHidden();
    await expectNoAxeViolations(page);

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(categoryControls).toBeHidden();
    await expect(page.locator("#home-category-body-parts")).toBeVisible();
    await expect(page.locator("#home-category-sports")).toBeVisible();
    await expect(page.locator("#home-category-situations")).toBeVisible();
  });

  test("keeps the 320px 150% header compact while all controls remain reachable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.addInitScript(() => {
      window.localStorage.setItem("atlas-font-scale", "1.5");
    });
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute(
      "data-font-scale",
      "1.5",
    );
    const header = page.locator(".site-header");
    const closedBox = await header.boundingBox();
    expect(closedBox).not.toBeNull();
    expect(closedBox!.height).toBeLessThanOrEqual(112);
    await expect(page.locator(".site-identity-link")).toBeVisible();
    await expect(page.getByRole("button", { name: "主選單" })).toBeVisible();
    await expect(page.getByRole("button", { name: "深色模式" })).toBeVisible();
    await expect(page.getByRole("button", { name: "縮小字級" })).toBeVisible();
    await expect(page.getByRole("button", { name: "放大字級" })).toBeVisible();

    await page.getByRole("button", { name: "主選單" }).click();
    await expect(
      page.getByRole("link", { name: "提供影片／資料修正" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /製作者.*吳易澄醫師/u }),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await expectNoAxeViolations(page);
  });

  test("offers a direct keyboard-accessible jump to the video collection", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const cta = page.getByRole("link", { name: "直接看全部影片" });
    await expect(cta).toHaveAttribute("href", "#videos-heading");
    await cta.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#videos-heading$/u);
    await expect(page.locator("#videos-heading")).toBeInViewport();
  });

  test("reveals and scrolls to hashed categories on load, hash change, and return links", async ({
    page,
  }) => {
    test.skip(
      !PUBLIC_LAUNCH,
      "Three category routes belong to the public launch",
    );
    await page.setViewportSize({ width: 390, height: 844 });

    const expectCategory = async (
      name: "依受傷部位" | "依運動項目" | "依受傷情境",
      panel: "body-parts" | "sports" | "situations",
    ) => {
      await expect(page.getByRole("button", { name })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await expect(page.locator(`#home-category-${panel}`)).toBeVisible();
      await expect(page.locator(`#${panel}`)).toBeInViewport();
    };

    await page.goto("/#situations");
    await expectCategory("依受傷情境", "situations");

    await page.evaluate(() => {
      window.location.hash = "sports";
    });
    await expect(page).toHaveURL(/#sports$/u);
    await expectCategory("依運動項目", "sports");

    await page.evaluate(() => {
      window.location.hash = "body-parts";
    });
    await expect(page).toHaveURL(/#body-parts$/u);
    await expectCategory("依受傷部位", "body-parts");

    await page.goto("/sports/baseball/");
    await page.getByRole("link", { name: "← 全部影片" }).click();
    await expect(page).toHaveURL(/\/#sports$/u);
    await expectCategory("依運動項目", "sports");

    await page.goto("/situations/ball-impact/");
    await page.getByRole("link", { name: "← 全部影片" }).click();
    await expect(page).toHaveURL(/\/#situations$/u);
    await expectCategory("依受傷情境", "situations");
  });
});

test("home category routes remain available without JavaScript", async ({
  browser,
}) => {
  test.skip(
    !PUBLIC_LAUNCH,
    "Three category routes belong to the public launch",
  );
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${process.env.ATLAS_E2E_PORT ?? "4321"}/`);
  await expect(page.locator("[data-home-category-controls]")).toBeHidden();
  await expect(page.locator("#home-category-body-parts")).toBeVisible();
  await expect(page.locator("#home-category-sports")).toBeVisible();
  await expect(page.locator("#home-category-situations")).toBeVisible();
  await expect(
    page.locator("#home-category-body-parts a").first(),
  ).toHaveAttribute("href", /^\/body-parts\//u);
  await expect(page.locator("#home-category-sports a").first()).toHaveAttribute(
    "href",
    /^\/sports\//u,
  );
  await expect(
    page.locator("#home-category-situations a").first(),
  ).toHaveAttribute("href", /^\/situations\//u);
  await context.close();
});

test("mobile contribution and author links remain tabbable without JavaScript", async ({
  browser,
  browserName,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${process.env.ATLAS_E2E_PORT ?? "4321"}/`);

  const contribution = page.getByRole("link", {
    name: "提供影片／資料修正",
  });
  const author = page.getByRole("link", {
    name: /製作者.*吳易澄醫師/u,
  });
  await expect(contribution).toBeVisible();
  await expect(contribution).toHaveAttribute("href", "/contribute/?page=%2F");
  await expect(author).toBeVisible();
  await expect(author).toHaveAttribute("href", "https://sportsmedicine.tw/");

  await page.locator(".site-identity-link").focus();
  const tabKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
  for (let index = 0; index < 5; index += 1) await page.keyboard.press(tabKey);
  await expect(contribution).toBeFocused();
  await page.keyboard.press(tabKey);
  await expect(author).toBeFocused();
  await context.close();
});

test("observation cards expose concise governed metadata on home and category pages", async ({
  page,
}) => {
  test.skip(!PUBLIC_LAUNCH, "Observation routes belong to the public launch");
  for (const path of [
    "/",
    "/body-parts/head-neck/",
    "/sports/baseball/",
    "/situations/ball-impact/",
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const cards = page.locator(".observation-card");
    expect(await cards.count()).toBeGreaterThan(0);
    for (let index = 0; index < (await cards.count()); index += 1) {
      const metadata = cards.nth(index).locator("[data-observation-metadata]");
      await expect(metadata).toBeVisible();
      await expect(
        metadata.locator("[data-observation-sport]"),
      ).not.toBeEmpty();
      await expect(
        metadata.locator("[data-observation-body-part]"),
      ).not.toBeEmpty();
      await expect(
        metadata.locator("[data-observation-event-year]"),
      ).toHaveText(/^(?:\d{4}|日期未核定)$/u);
    }
  }
});

test("return-day callouts name the governed milestone beside the day count", async ({
  page,
}) => {
  test.skip(!PUBLIC_LAUNCH, "Observation routes belong to the public launch");
  for (const [slug, label] of [
    ["mitch-haniger-2017-face", "里程碑：復健賽"],
    ["chien-ming-wang-2008-foot", "里程碑：春訓"],
    ["john-tavares-2021-concussion", "里程碑：季前賽"],
    ["shohei-ohtani-world-series-2024", "里程碑：帶傷出賽"],
  ]) {
    await page.goto(`/videos/${slug}/`);
    const callout = page.locator(".return-days");
    await expect(callout).toContainText("天");
    await expect(callout.locator("strong")).not.toBeEmpty();
    await expect(callout.locator("[data-return-milestone]")).toHaveText(label);
  }
});
