import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

test.beforeEach(() =>
  test.skip(
    process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21",
    "Public catalogue only",
  ),
);

test("A2 artwork loads with a modern format and leaves discovery reachable on narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const art = page.locator(".home-hero-image");
  await expect(art).toHaveAttribute("alt", "");
  await expect(art).toHaveAttribute("fetchpriority", "high");
  await expect
    .poll(() =>
      art.evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
    )
    .toBe(true);
  const imageUrl = await art.evaluate(
    (img: HTMLImageElement) => img.currentSrc,
  );
  expect(imageUrl).toMatch(/\.(avif|webp)$/);
  const response = await page.request.get(imageUrl);
  expect(response.ok()).toBe(true);
  expect((await response.body()).length).toBeLessThan(400_000);
  await expect(page.locator(".home-hero-caption")).toContainText(
    "非實際賽事畫面",
  );
  const geometry = await page.evaluate(() => {
    const top = (s: string) =>
      document.querySelector(s)!.getBoundingClientRect().top + scrollY;
    return {
      social: top('[aria-label="首頁追蹤連結"]'),
      title: top("h1"),
      search: top('input[type="search"]'),
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  expect(geometry.social).toBeLessThan(geometry.title);
  expect(geometry.search).toBeLessThan(675);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  await page.getByRole("link", { name: "開始找影片", exact: true }).click();
  await expect(page).toHaveURL(/#videos-heading$/);
  await expect(page.getByRole("link", { name: /看受傷瞬間/ })).toHaveAttribute(
    "href",
    "/video-types/injury-moment/",
  );
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("collapsed mobile facets remain visible as removable selections and restore from history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    "/?q=Drew+Brees&type=expert-analysis&sport=american-football&body=trunk",
  );
  const toggle = page.locator("[data-advanced-toggle]");
  const facets = page.locator("[data-advanced-filters]");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(facets).toBeHidden();
  await expect(page.locator("[data-discovery-slug]:visible")).toHaveCount(1);
  await expect(page.locator("[data-sport-clear]")).toBeVisible();
  await expect(page.locator("[data-body-clear]")).toBeVisible();
  await expect(toggle).toHaveAccessibleName("更多篩選（已選 2 項）");
  await page.locator("[data-body-clear]").click();
  await expect(toggle).toBeFocused();
  expect(new URL(page.url()).searchParams.has("body")).toBe(false);
  await page.goBack();
  await expect(page.locator("[data-body-clear]")).toBeVisible();
  await expect(facets).toBeHidden();
  await toggle.click();
  await expect(
    page.getByRole("combobox", { name: "受傷部位", exact: true }),
  ).toHaveValue("trunk");
  await toggle.click();
  await page.locator("[data-sport-clear]").click();
  await expect(toggle).toBeFocused();
  expect(new URL(page.url()).searchParams.has("sport")).toBe(false);
  await page.reload();
  await expect(page.locator("[data-body-clear]")).toBeVisible();
  await expect(page.locator("[data-sport-clear]")).toBeHidden();
  await expect(facets).toBeHidden();
});

test("resizing between mobile and desktop keeps keyboard focus on a visible control", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.locator("[data-advanced-toggle]");
  const sport = page.locator("[data-sport-filter]");
  await toggle.focus();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(toggle).toBeHidden();
  await expect(sport).toBeVisible();
  await expect(sport).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(sport).toBeHidden();
  await expect(toggle).toBeFocused();
});

test("hero and discovery remain usable with enlarged text in both themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  const increase = page.getByRole("button", { name: "放大字級", exact: true });
  for (let step = 0; step < 3; step += 1) await increase.click();
  await expect(page.locator("html")).toHaveAttribute("data-font-scale", "1.5");
  for (let theme = 0; theme < 2; theme += 1) {
    await expect(
      page.getByRole("link", { name: "開始找影片", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("searchbox")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
    const overlaps = await page.evaluate(() => {
      const caption = document
        .querySelector(".home-hero-caption")!
        .getBoundingClientRect();
      const actions = document
        .querySelector(".home-hero-actions")!
        .getBoundingClientRect();
      return (
        caption.top < actions.bottom &&
        caption.right > actions.left &&
        caption.left < actions.right
      );
    });
    expect(overlaps).toBe(false);
    await expectNoAxeViolations(page);
    if (theme === 0) await page.locator("[data-theme-toggle]").click();
  }
  await page.setViewportSize({ width: 1024, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
});
