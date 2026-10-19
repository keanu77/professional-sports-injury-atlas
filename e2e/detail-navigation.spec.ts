import { expect, test } from "@playwright/test";

const PUBLIC_LAUNCH = process.env.ATLAS_PUBLIC_LAUNCH === "decision-21";

test("non-launch review details omit category routes that are not generated", async ({
  page,
}) => {
  test.skip(
    PUBLIC_LAUNCH,
    "This assertion targets the non-launch review artifact",
  );
  await page.goto("/cases/anfernee-simons-ankle-sprain-2023/");
  await expect(page.locator("[data-catalog-return]")).toHaveAttribute(
    "href",
    "/#videos-heading",
  );
  await expect(
    page.locator(".detail-navigation a[href^='/body-parts/']"),
  ).toHaveCount(0);
  await expect(page.locator(".detail-categories")).toHaveCount(0);
});

test("core, observation and expanded pages link only to sections they render", async ({
  page,
}) => {
  test.skip(!PUBLIC_LAUNCH, "Observation routes belong to the public launch");
  for (const path of [
    "/cases/anfernee-simons-ankle-sprain-2023/",
    "/videos/markelle-fultz-orlando-2021/",
    "/videos/aaron-judge-2026-rib/",
  ]) {
    await page.goto(path);
    await expect(page.locator("[data-catalog-return]")).toHaveAttribute(
      "href",
      "/#videos-heading",
    );
    await expect(
      page.getByRole("navigation", { name: "麵包屑", exact: true }),
    ).toBeVisible();
    const sections = page.locator("[data-detail-contents] a");
    expect(await sections.count()).toBeGreaterThan(4);
    for (const link of await sections.all()) {
      const target = await link.getAttribute("href");
      expect(target).toMatch(/^#[a-z0-9-]+$/u);
      await expect(page.locator(target!)).toHaveCount(1);
    }
    for (const kind of ["body-part", "sport", "situation"]) {
      await expect(
        page.locator(`[data-category-kind="${kind}"] a`),
      ).toBeVisible();
    }
    const related = page.locator("[data-related-slug]");
    expect(await related.count()).toBeGreaterThan(0);
    expect(await related.count()).toBeLessThanOrEqual(3);
    await expect(
      related.first().locator("[data-related-reason]"),
    ).not.toBeEmpty();
  }
  await page.goto("/cases/anfernee-simons-ankle-sprain-2023/");
  await page.locator('[data-detail-contents] a[href="#case-sources"]').click();
  await expect(page.locator("#case-sources")).toHaveAttribute("open", "");
  await expect(page.locator("#sources-heading")).toBeVisible();
});

test("return link restores the clicked catalog and ignores stale or external context", async ({
  page,
}) => {
  test.skip(!PUBLIC_LAUNCH, "Observation routes belong to the public launch");
  await page.goto("/sports/baseball/?q=Acuna");
  const link = page.locator(
    '[data-video-discovery] h3 a[href="/videos/ronald-acuna-miami-2021/"]',
  );
  await link.click();
  await expect(page.locator("[data-catalog-return]")).toHaveAttribute(
    "href",
    "/sports/baseball/?q=Acuna#videos-heading",
  );
  await page.locator("[data-catalog-return]").click();
  await expect(page).toHaveURL(
    /\/sports\/baseball\/\?q=Acuna#videos-heading$/u,
  );
  await page.goto("/videos/aaron-judge-2026-rib/");
  await expect(page.locator("[data-catalog-return]")).toHaveAttribute(
    "href",
    "/#videos-heading",
  );
  await page.evaluate(() =>
    sessionStorage.setItem(
      "sport-injury-catalog-return",
      JSON.stringify({ detailPath: location.pathname, href: "//example.com/" }),
    ),
  );
  await page.reload();
  await expect(page.locator("[data-catalog-return]")).toHaveAttribute(
    "href",
    "/#videos-heading",
  );
});
