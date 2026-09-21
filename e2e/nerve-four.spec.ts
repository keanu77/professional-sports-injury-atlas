import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

const cases = [
  ["jaylon-smith-2016-peroneal-nerve", "Jaylon Smith", "news-analysis"],
  ["zack-kelly-2023-ulnar-nerve", "Zack Kelly", "injury-motion"],
  ["ryan-crouser-2024-ulnar-nerve", "Ryan Crouser", "athlete-interview"],
  ["rob-horne-2018-brachial-plexus", "Rob Horne", "athlete-interview"],
] as const;
test.beforeEach(() =>
  test.skip(
    process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21",
    "Public observation catalog must be enabled",
  ),
);

for (const [slug, name, kind] of cases) {
  test(`${name}: sources, footage labels and consent facade`, async ({
    page,
  }) => {
    const external: string[] = [];
    page.on("request", (request) => {
      if (/youtube|ytimg|streamable/.test(request.url()))
        external.push(request.url());
    });
    await page.goto(`/videos/${slug}/`);
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(page.locator("[data-footage-kind]")).toHaveAttribute(
      "data-footage-kind",
      kind,
    );
    await expect(page.locator("[data-recovery-timeline]")).toBeVisible();
    const mechanism = page.locator(`[data-event-mechanism="${slug}"]`);
    await expect(mechanism).toBeVisible();
    await expect(mechanism.locator(".limitation")).toContainText(
      "影片分析的限制",
    );
    const citations = mechanism.locator('a[href^="#event-source-"]');
    expect(await citations.count()).toBeGreaterThan(0);
    for (const citation of await citations.all()) {
      const target = await citation.getAttribute("href");
      expect(target).toMatch(new RegExp(`^#event-source-${slug}-[1-9]\\d*$`));
      await expect(page.locator(target!)).toHaveCount(1);
    }
    await citations.first().click();
    await expect(
      page.locator((await citations.first().getAttribute("href"))!),
    ).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(external).toEqual([]);
    if (kind === "athlete-interview")
      await expect(page.locator(".return-days")).toHaveCount(0);
    await expectNoAxeViolations(page);
  });
}

test("named nerve search finds all four and keeps plexus separate", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "搜尋球員或關鍵字" });
  for (const [slug, name] of cases) {
    await search.fill(name);
    await expect(page.locator("[data-discovery-slug]:visible")).toHaveCount(1);
    await expect(page.locator("[data-discovery-slug]:visible")).toHaveAttribute(
      "data-discovery-slug",
      slug,
    );
  }
  await search.fill("ulnar nerve");
  await expect(page.locator("[data-discovery-slug]:visible")).toHaveCount(2);
  await search.fill("brachial plexus");
  await expect(page.locator("[data-discovery-slug]:visible")).toHaveCount(1);
  await page.goto("/nerve-injuries/peripheral-nerve/");
  await expect(page.getByRole("link", { name: "← 神經損傷" })).toHaveAttribute(
    "href",
    "/nerve-injuries/",
  );
  await expect(page.locator("[data-nerve-category] > li")).toHaveCount(3);
  await expect(page.getByRole("link", { name: /神經叢損傷/ })).toBeVisible();
  await page.goto("/nerve-injuries/brachial-plexus/");
  await expect(page.locator("[data-nerve-category] > li")).toHaveCount(1);
  await expect(page.locator("[data-nerve-category]")).toContainText(
    "Rob Horne",
  );
  await expectNoAxeViolations(page);
});

test("one nerve entry opens all four cases and preserves anatomical navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "依受傷部位", exact: true }).click();
  const nav = page.getByRole("navigation", { name: "依受傷部位看影片" });
  const anatomicalLinks = await nav
    .locator('a[href^="/body-parts/"]')
    .evaluateAll((links) =>
      links.map((link) => ({
        href: link.getAttribute("href"),
        text: link.textContent,
      })),
    );
  await expect(page.getByRole("heading", { name: "神經傷害專題" })).toHaveCount(
    0,
  );
  const nerveLink = nav.getByRole("link", { name: "神經損傷 4 支影片" });
  await expect(nerveLink).toHaveCount(1);
  await nerveLink.click();
  await expect(page).toHaveURL(/\/nerve-injuries\/$/);
  await expect(
    page.getByRole("heading", { name: "神經損傷案例影片" }),
  ).toBeVisible();
  await expect(nav.locator('[aria-current="page"]')).toHaveAttribute(
    "href",
    "/nerve-injuries/",
  );
  expect(
    await nav.locator('a[href^="/body-parts/"]').evaluateAll((links) =>
      links.map((link) => ({
        href: link.getAttribute("href"),
        text: link.textContent,
      })),
    ),
  ).toEqual(anatomicalLinks);
  await expect(page.locator("[data-nerve-videos] > li")).toHaveCount(4);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expectNoAxeViolations(page);
  for (const [slug, name] of cases) {
    await page
      .locator(`[data-nerve-videos] h3 a[href="/videos/${slug}/"]`)
      .click();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await page.goto("/nerve-injuries/");
  }
  for (const part of anatomicalLinks) {
    await page.goto(part.href!);
    await expect(
      nav.getByRole("link", { name: "神經損傷 4 支影片" }),
    ).toBeVisible();
    await expect(nav.locator('[aria-current="page"]')).toHaveAttribute(
      "href",
      part.href!,
    );
  }
});

test("Kelly loads only the allowlisted iframe after consent, without YouTube telemetry", async ({
  page,
}) => {
  const unexpected: string[] = [];
  page.on("request", (request) => {
    if (/youtube|ytimg|\/api\/.*play/.test(request.url()))
      unexpected.push(request.url());
  });
  // This verifies our integration only, NOT remote playback or embed availability.
  await page.route("https://streamable.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>Embed integration fixture</title>",
    }),
  );
  await page.goto("/videos/zack-kelly-2023-ulnar-nerve/");
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.getByRole("button", { name: /載入 MLB 官方影片/ }).click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    "https://streamable.com/m/zack-kelly-leaves-with-injury?partnerId=web_video-playback-page_video-share",
  );
  await expect(page.locator(".clip-source a")).toHaveAttribute(
    "href",
    "https://www.mlb.com/redsox/video/zack-kelly-leaves-with-injury",
  );
  expect(unexpected).toEqual([]);
});
