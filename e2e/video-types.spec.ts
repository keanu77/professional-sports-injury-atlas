import { expect, test } from "@playwright/test";

const visibleCards = "[data-discovery-slug]:visible";

test.beforeEach(() =>
  test.skip(
    process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21",
    "Full catalogue belongs to the public launch",
  ),
);

test("combines an exact content type, a query, and the static type page", async ({
  page,
}) => {
  await page.goto("/?type=expert-analysis");
  const filter = page.getByRole("combobox", { name: "影片類型", exact: true });
  await expect(filter).toHaveValue("expert-analysis");
  const cards = page.locator(visibleCards);
  await expect(cards).not.toHaveCount(0);
  expect(
    await cards.evaluateAll((items) =>
      items.every((card) =>
        (card.getAttribute("data-content-types") ?? "")
          .split(" ")
          .includes("expert-analysis"),
      ),
    ),
  ).toBe(true);
  await page.getByRole("searchbox").fill("Drew Brees");
  await expect(cards).toHaveCount(1);
  await expect(cards).toHaveAttribute(
    "data-discovery-slug",
    "drew-brees-2020-rib",
  );
  await page.getByRole("button", { name: "清除搜尋", exact: true }).click();
  await expect(filter).toHaveValue("expert-analysis");
  await page.getByRole("button", { name: "清除類型", exact: true }).click();
  await expect(filter).toHaveValue("");
  await page.goto("/video-types/expert-analysis/");
  await expect(
    page.locator("[data-video-type-videos='expert-analysis']"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Drew Brees/ }).first(),
  ).toBeVisible();
});

test("preserves the original popularity rank after intersecting a content type", async ({
  page,
}) => {
  const breesId = "_jrPqJow81Q";
  await page.goto("/");
  const ids = await page
    .locator(
      '[data-discovery-slug][data-video-id]:not([data-content-types~="expert-analysis"])',
    )
    .evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("data-video-id")!),
    );
  expect(ids).not.toContain(breesId);
  const ordered = [...ids.slice(0, 3), breesId, ...ids.slice(3, 9)];
  await page.route("**/api/popular", (route) =>
    route.fulfill({
      json: {
        windowDays: 30,
        generatedAt: new Date().toISOString(),
        items: ordered.map((videoId, index) => ({
          videoId,
          count: 100 - index,
        })),
      },
    }),
  );
  await page.getByRole("button", { name: "本站熱門", exact: true }).click();
  await page
    .getByRole("combobox", { name: "影片類型", exact: true })
    .selectOption("expert-analysis");
  await expect(page.locator(visibleCards)).toHaveCount(1);
  await expect(page.locator("[data-popular-count]:visible")).toHaveText(
    "近 30 天播放第四名",
  );
});

test("handles invalid shared type links and maps each mobile category control to a panel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?type=not-a-real-type#video-types");
  await expect(
    page.getByRole("combobox", { name: "影片類型", exact: true }),
  ).toHaveValue("");
  const controls = page.locator("[data-home-category-select]");
  const panels = page.locator("[data-home-category-panel]");
  expect(await controls.count()).toBe(4);
  expect(await panels.count()).toBe(4);
  await page.getByRole("button", { name: "依影片類型", exact: true }).click();
  await expect(
    page.locator("[data-home-category-panel='video-types']"),
  ).toBeVisible();
  await expect(
    page.locator("[data-home-category-panel='sports']"),
  ).toBeHidden();
});

test("intersects a content type with curated mode and a Chinese query", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "影片類型", exact: true })
    .selectOption("injury-moment");
  await page.getByRole("button", { name: "精選影片", exact: true }).click();
  await page.getByRole("searchbox").fill("阿基里斯腱");
  const cards = page.locator(visibleCards);
  await expect(cards).not.toHaveCount(0);
  expect(
    await cards.evaluateAll((items) =>
      items.every((card) =>
        (card.getAttribute("data-content-types") ?? "")
          .split(" ")
          .includes("injury-moment"),
      ),
    ),
  ).toBe(true);
});

test("does not let a slow popularity response replace a newer mode or type", async ({
  page,
}) => {
  await page.goto("/");
  let release!: () => void;
  let arrived!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const arrivedAtApi = new Promise<void>((resolve) => {
    arrived = resolve;
  });
  await page.route("**/api/popular", async (route) => {
    arrived();
    await gate;
    await route.fulfill({
      json: {
        windowDays: 30,
        generatedAt: new Date().toISOString(),
        items: [{ videoId: "_jrPqJow81Q", count: 10 }],
      },
    });
  });
  await page.getByRole("button", { name: "本站熱門", exact: true }).click();
  await arrivedAtApi;
  await page
    .getByRole("combobox", { name: "影片類型", exact: true })
    .selectOption("expert-analysis");
  await page.getByRole("button", { name: "全部影片", exact: true }).click();
  release();
  const cards = page.locator(visibleCards);
  await expect(cards).not.toHaveCount(0);
  expect(
    await cards.evaluateAll((items) =>
      items.every((card) =>
        (card.getAttribute("data-content-types") ?? "")
          .split(" ")
          .includes("expert-analysis"),
      ),
    ),
  ).toBe(true);
  await expect(page.locator("[data-popular-count]:visible")).toHaveCount(0);
});

test("restores type selections through browser history while retaining existing URL state", async ({
  page,
}) => {
  await page.goto("/?source=atlas#videos-heading");
  const filter = page.getByRole("combobox", { name: "影片類型", exact: true });
  await filter.selectOption("expert-analysis");
  await filter.selectOption("injury-moment");
  expect(page.url()).toContain("source=atlas");
  expect(page.url()).toContain("type=injury-moment");
  expect(page.url()).toContain("#videos-heading");
  await page.goBack();
  await expect(filter).toHaveValue("expert-analysis");
  await page.goForward();
  await expect(filter).toHaveValue("injury-moment");
});

test("keeps static content type routes and observed segment links usable without script or eager embeds", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/video-types/expert-analysis/`);
    await expect(
      page.locator("[data-video-type-videos='expert-analysis']"),
    ).toBeVisible();
    await expect(page.locator("[data-video-type-nav] a")).toHaveCount(8);
  } finally {
    await context.close();
  }
});

test("shows reviewed segment links without pre-consent third-party playback", async ({
  page,
}) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (/youtube|ytimg|streamable/u.test(request.url()))
      externalRequests.push(request.url());
  });
  const response = await page.goto("/cases/anfernee-simons-ankle-sprain-2023/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("iframe")).toHaveCount(0);
  const segments = page.locator("[data-video-type-segments] a");
  await expect(segments).not.toHaveCount(0);
  await expect(segments.first()).toHaveAttribute("href", /[?&]t=\d+/u);
  expect(externalRequests).toEqual([]);
});
