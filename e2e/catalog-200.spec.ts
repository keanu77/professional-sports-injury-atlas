import { test, expect } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";
import selected from "../docs/reviews/2026-09-21-catalog-200/selected-cases.json";

test.beforeEach(() =>
  test.skip(
    process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21",
    "Public catalog required",
  ),
);
for (const c of selected.clips) {
  test(
    c.slug + ": sources, exact footage label and consent facade",
    async ({ page }) => {
      const external: string[] = [];
      page.on("request", (r) => {
        if (/youtube|ytimg|streamable/.test(r.url())) external.push(r.url());
      });
      await page.goto("/videos/" + c.slug + "/");
      await expect(
        page.getByRole("heading", { name: c.name, exact: true }),
      ).toBeVisible();
      await expect(page.locator("[data-footage-kind]")).toHaveAttribute(
        "data-footage-kind",
        c.footageKind,
      );
      await expect(page.locator("[data-video-embed]")).toHaveAttribute(
        "data-video-id",
        c.videoId,
      );
      await expect(page.locator("[data-video-embed]")).toHaveAttribute(
        "data-video-start",
        String(c.startSeconds),
      );
      await expect(page.locator("[data-recovery-timeline]")).toBeVisible();
      const refs = page.locator('a[href^="#event-source-"]');
      expect(await refs.count()).toBeGreaterThan(0);
      for (const ref of await refs.all())
        await expect(
          page.locator((await ref.getAttribute("href"))!),
        ).toHaveCount(1);
      await expect(page.locator("iframe")).toHaveCount(0);
      await expect(page.locator(".return-days")).toHaveCount(0);
      expect(external).toEqual([]);
    },
  );
}
test("200 unique events remain searchable", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-discovery-slug]")).toHaveCount(200);
  const slugs = await page
    .locator("[data-discovery-slug]")
    .evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("data-discovery-slug")),
    );
  expect(new Set(slugs).size).toBe(200);
  await page
    .getByRole("searchbox", { name: "搜尋球員或關鍵字" })
    .fill("Rafael Nadal");
  await expect(page.locator("[data-discovery-slug]:visible")).toHaveCount(3);
});

// Cover long athlete names, three newly populated sports, and both new anatomy routes.
for (const path of [
  "/videos/antonio-rodrigo-nogueira-2011-arm/",
  "/sports/mixed-martial-arts/",
  "/sports/surfing/",
  "/sports/wrestling/",
  "/body-parts/arm/",
  "/body-parts/hip-thigh/",
]) {
  test(path + ": accessible without horizontal overflow", async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    const expectNoOverflow = async () => {
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    };
    // The project's desktop and Pixel 7 viewports both receive a full Axe scan.
    await expectNoOverflow();
    await expectNoAxeViolations(page);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(page.locator("h1")).toBeVisible();
      await expectNoOverflow();
    }
  });
}
