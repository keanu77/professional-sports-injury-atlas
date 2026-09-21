import { expect, test } from "@playwright/test";
const visible = "[data-discovery-slug]:visible";
test.beforeEach(() =>
  test.skip(
    process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21",
    "Public catalogue only",
  ),
);

test("keeps social links ahead of search, exposes all mobile category controls, and paginates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.locator("[data-discovery-slug]")).toHaveCount(200);
  await expect(page.locator(visible)).toHaveCount(24);
  const geometry = await page.evaluate(() => {
    const top = (selector: string) =>
      document.querySelector(selector)!.getBoundingClientRect().top + scrollY;
    return {
      social: top('[aria-label="首頁追蹤連結"]'),
      search: top('input[type="search"]'),
      categories: top("[data-home-categories]"),
      overflow: document.documentElement.scrollWidth - innerWidth,
      buttons: [
        ...document.querySelectorAll("[data-home-category-select]"),
      ].map((x) => {
        const r = x.getBoundingClientRect();
        return { left: r.left, right: r.right };
      }),
    };
  });
  expect(geometry.social).toBeLessThan(geometry.search);
  expect(geometry.search).toBeLessThan(geometry.categories);
  expect(geometry.search).toBeLessThan(800);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.buttons).toHaveLength(4);
  for (const button of geometry.buttons) {
    expect(button.left).toBeGreaterThanOrEqual(0);
    expect(button.right).toBeLessThanOrEqual(320);
  }
  await page.getByRole("button", { name: "載入更多影片", exact: true }).click();
  await expect(page.locator(visible)).toHaveCount(48);
  await expect(page.locator("[data-discovery-page-status]")).toContainText(
    "48 / 200",
  );
  await page.getByRole("searchbox").fill("Drew Brees");
  await expect(page.locator(visible)).toHaveCount(1);
  await page
    .locator(visible)
    .getByRole("link", { name: "查看影片與解析 →", exact: true })
    .click();
  await expect(page).toHaveURL(/\/videos\/drew-brees-2020-rib\/$/);
  await expect(page.getByText("預設播放起點", { exact: true })).toBeVisible();
  await expect(page.locator("[data-video-type-segments] a")).toContainText(
    "YouTube",
  );
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("shares full search state and restores filters across history", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("Drew Brees");
  await page
    .getByRole("combobox", { name: "影片類型", exact: true })
    .selectOption("expert-analysis");
  await page
    .getByRole("combobox", { name: "運動項目", exact: true })
    .selectOption("american-football");
  await page
    .getByRole("combobox", { name: "受傷部位", exact: true })
    .selectOption("trunk");
  await expect(page.locator(visible)).toHaveCount(1);
  const shared = page.url();
  expect(new URL(shared).searchParams.get("q")).toBe("Drew Brees");
  await page.reload();
  await expect(page.getByRole("searchbox")).toHaveValue("Drew Brees");
  await expect(page.locator(visible)).toHaveCount(1);
  await page
    .getByRole("combobox", { name: "受傷部位", exact: true })
    .selectOption("ankle");
  await expect(page.locator(visible)).toHaveCount(0);
  await page.goBack();
  await expect(
    page.getByRole("combobox", { name: "受傷部位", exact: true }),
  ).toHaveValue("trunk");
  await expect(page.locator(visible)).toHaveCount(1);
  await page.getByRole("button", { name: "精選影片", exact: true }).click();
  expect(new URL(page.url()).searchParams.get("mode")).toBe("curated");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "精選影片", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("narrows a fixed type category by sport and body while keeping all static members", async ({
  page,
}) => {
  await page.goto("/video-types/injury-moment/");
  await expect(page.locator("[data-discovery-slug]")).toHaveCount(135);
  await expect(page.locator(visible)).toHaveCount(24);
  await page
    .getByRole("combobox", { name: "運動項目", exact: true })
    .selectOption("basketball");
  await page
    .getByRole("combobox", { name: "受傷部位", exact: true })
    .selectOption("ankle");
  const matches = page.locator(visible);
  expect(await matches.count()).toBeGreaterThan(0);
  expect(
    await matches.evaluateAll((items) =>
      items.every(
        (x) =>
          x.getAttribute("data-sport") === "basketball" &&
          x.getAttribute("data-body") === "ankle" &&
          x
            .getAttribute("data-content-types")!
            .split(" ")
            .includes("injury-moment"),
      ),
    ),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "受傷部位", exact: true }),
  ).toHaveValue("ankle");
  await expect(page.locator("iframe")).toHaveCount(0);
});

test("loads all remaining batches without duplicates and restores pagination after clearing query", async ({
  page,
}) => {
  await page.goto("/");
  const more = page.getByRole("button", { name: "載入更多影片", exact: true });
  for (let count = 48; count <= 192; count += 24) {
    await more.click();
    await expect(page.locator(visible)).toHaveCount(count);
  }
  await more.click();
  await expect(page.locator(visible)).toHaveCount(200);
  await expect(more).toBeHidden();
  expect(
    await page
      .locator(visible)
      .evaluateAll(
        (items) =>
          new Set(items.map((x) => x.getAttribute("data-discovery-slug"))).size,
      ),
  ).toBe(200);
  await page.getByRole("searchbox").fill("Brees");
  await page.getByRole("button", { name: "清除搜尋", exact: true }).click();
  await expect(page.locator(visible)).toHaveCount(24);
});
