/**
 * Progressive filtering spec. The initial page load must never fetch a
 * case-index shard; only the first filter interaction loads the manifest
 * and the three one-page injury shards for the real 26-case corpus. Filter state round-trips
 * through the query string via `history.replaceState`, result counts are
 * announced through the `aria-live` status region, and a single reset action
 * restores the complete static listing.
 */

import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

function trackCaseIndexRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/case-index/")) urls.push(request.url());
  });
  return urls;
}

test.describe("progressive case filtering", () => {
  test("initial page load fetches no case-index manifest or shard", async ({
    page,
  }) => {
    const indexRequests = trackCaseIndexRequests(page);
    await page.goto("/injuries/acl/");
    await expect(page.locator("[data-case-filters]")).toBeVisible();
    expect(indexRequests).toEqual([]);
  });

  test("first interaction loads the manifest and exact real shards", async ({
    page,
  }) => {
    const indexRequests = trackCaseIndexRequests(page);
    await page.goto("/injuries/acl/");

    await page.getByLabel("球員或球隊關鍵字").fill("虛構");
    const status = page.locator("[data-filter-status]");
    await expect(status).toHaveText(/符合條件的案例共 0 筆/);

    // The manifest and each real one-page injury shard load exactly once.
    expect(
      indexRequests.filter((url) => url.endsWith("/case-index/manifest.json")),
    ).toHaveLength(1);
    expect(
      indexRequests
        .filter((url) => /\/\d+\.json$/.test(url))
        .map((url) => new URL(url).pathname)
        .sort(),
    ).toEqual([
      "/case-index/achilles-rupture/1.json",
      "/case-index/acl/1.json",
      "/case-index/ankle-sprain/1.json",
    ]);

    // The status region is a polite live region.
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(page.locator("[data-static-listing]")).toBeHidden();
    await expectNoAxeViolations(page);
  });

  test("compound filter state updates the query string via replaceState", async ({
    page,
  }) => {
    await page.goto("/injuries/acl/");
    await page.getByLabel("球員或球隊關鍵字").fill("虛構球員");
    await page.getByLabel("只看經典案例").check();
    await page.getByLabel("事件年份").fill("2024");

    await expect(page.locator("[data-filter-status]")).toHaveText(
      /符合條件的案例共 0 筆/,
    );
    await expect(page).toHaveURL(/keyword=/);
    await expect(page).toHaveURL(/classic=1/);
    await expect(page).toHaveURL(/year=2024/);
    // replaceState keeps the path canonical; no navigation happened.
    expect(new URL(page.url()).pathname).toBe("/injuries/acl/");
  });

  test("prefills the form from an existing query string", async ({ page }) => {
    await page.goto(
      "/injuries/acl/?keyword=%E8%99%9B%E6%A7%8B&videoSource=external-link&classic=1",
    );
    await expect(page.getByLabel("球員或球隊關鍵字")).toHaveValue("虛構");
    await expect(page.getByLabel("影片來源")).toHaveValue("external-link");
    await expect(page.getByLabel("只看經典案例")).toBeChecked();
  });

  test("reproduces the exact 7/18/1 video-source partition", async ({
    page,
  }) => {
    await page.goto("/injuries/acl/");
    const source = page.getByLabel("影片來源");
    const status = page.locator("[data-filter-status]");

    await source.selectOption("youtube-embed");
    await expect(status).toHaveText(/符合條件的案例共 7 筆/);

    await source.selectOption("nba-plain-text-citation");
    await expect(status).toHaveText(/符合條件的案例共 18 筆/);

    await source.selectOption("external-link");
    await expect(status).toHaveText(/符合條件的案例共 1 筆/);
    await expect(
      page.locator("[data-filter-results] a", {
        hasText: "Anthony Edwards",
      }),
    ).toHaveCount(1);
    await expect(page).toHaveURL(/videoSource=external-link/);
  });

  test("composes video source with the existing injury dimension", async ({
    page,
  }) => {
    await page.goto("/injuries/acl/");
    await page.getByLabel("傷種").selectOption("acl");
    await page.getByLabel("影片來源").selectOption("nba-plain-text-citation");
    await expect(page.locator("[data-filter-status]")).toHaveText(
      /符合條件的案例共 7 筆/,
    );
  });

  test("one reset action restores the static listing and clears the query", async ({
    page,
  }) => {
    await page.goto("/injuries/acl/");
    await page.getByLabel("球員或球隊關鍵字").fill("虛構");
    await expect(page.locator("[data-static-listing]")).toBeHidden();

    await page.getByRole("button", { name: "重設全部篩選" }).click();
    await expect(page.locator("[data-static-listing]")).toBeVisible();
    await expect(page.locator("[data-filter-status]")).toHaveText(
      /已重設全部篩選/,
    );
    await expect(page.getByLabel("球員或球隊關鍵字")).toHaveValue("");
    expect(new URL(page.url()).search).toBe("");
    await expectNoAxeViolations(page);
  });

  test("the two status filters carry distinct diagnosis and workflow labels", async ({
    page,
  }) => {
    await page.goto("/injuries/acl/");
    await expect(page.getByLabel("診斷確認狀態（外部來源）")).toBeVisible();
    await expect(
      page.getByLabel("內部審查工作流程狀態（非診斷）"),
    ).toBeVisible();
  });
});
