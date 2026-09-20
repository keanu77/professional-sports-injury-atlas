import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

const cases = [
  [
    "fernando-alonso-2016-rib",
    "Fernando Alonso",
    "HiLO6a9crD4",
    "news-analysis",
    "2016-04-17",
  ],
  [
    "drew-brees-2020-rib",
    "Drew Brees",
    "_jrPqJow81Q",
    "news-analysis",
    "2020-12-20",
  ],
  [
    "tua-tagovailoa-2021-rib",
    "Tua Tagovailoa",
    "JckTrmIPRK8",
    "news-analysis",
    "2021-10-17",
  ],
] as const;
test.beforeEach(() => {
  test.skip(
    process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21",
    "Observation catalog must be enabled",
  );
});
for (const [slug, name, id, kind, returned] of cases) {
  test(`${name} has sourced rib content and a privacy-preserving player`, async ({
    page,
  }) => {
    await page.goto(`/videos/${slug}/`);
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(page.locator("[data-video-embed]")).toHaveAttribute(
      "data-video-id",
      id,
    );
    await expect(page.locator("[data-footage-kind]")).toHaveAttribute(
      "data-footage-kind",
      kind,
    );
    await expect(page.locator("[data-recovery-timeline]")).toContainText(
      returned,
    );
    await expect(page.locator("[data-rib-injury-care]")).toContainText("咳血");
    await expect(page.locator("iframe")).toHaveCount(0);
    if (slug === "fernando-alonso-2016-rib") {
      await expect(page.locator("[data-video-text-highlights]")).toContainText(
        "未受傷",
      );
      await expect(page.locator("[data-video-text-highlights]")).toContainText(
        "後續",
      );
    }
    if (slug === "drew-brees-2020-rib")
      await expect(page.locator(".return-days")).toHaveCount(0);
    if (slug === "tua-tagovailoa-2021-rib")
      await expect(page.locator("[data-video-text-highlights]")).toContainText(
        "早期",
      );
    await expectNoAxeViolations(page);
  });
}
test("all-video search finds each rib case and keeps Tua's concussion distinct", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "搜尋球員或關鍵字" });
  for (const [slug, name] of cases) {
    await search.fill(`${name} rib fracture`);
    await expect(page.locator("[data-discovery-slug]:visible")).toHaveCount(1);
    await expect(page.locator("[data-discovery-slug]:visible")).toHaveAttribute(
      "data-discovery-slug",
      slug,
    );
  }
  await search.fill("Tua Tagovailoa");
  await expect(page.locator("[data-discovery-slug]:visible")).toHaveCount(2);
  await search.fill("Tua 肋骨");
  await expect(page.locator("[data-discovery-slug]:visible")).toHaveCount(1);
});
test("Alonso has an automobile racing destination", async ({ page }) => {
  await page.goto("/sports/automobile-racing/");
  await expect(
    page.getByRole("link", { name: /Fernando Alonso/ }).first(),
  ).toBeVisible();
});
