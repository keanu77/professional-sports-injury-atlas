import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

const PAGE_ORIGIN = "http://127.0.0.1:4321";
const LISTING_PATHS = [
  "/leagues/nba/",
  "/leagues/nba/page/2/",
  "/leagues/nba/page/3/",
] as const;

async function expectLicensedCover(cover: Locator): Promise<void> {
  await expect(cover).toHaveAttribute(
    "data-cover-kind",
    "licensed-player-photo",
  );
  await expect(cover).toHaveAttribute("data-player-photo", /\S/u);
  await expect(cover).toHaveAttribute("data-focal-x", /^(?:0|[1-9]\d?|100)$/u);
  await expect(cover).toHaveAttribute("data-focal-y", /^(?:0|[1-9]\d?|100)$/u);

  const image = cover.locator("picture img");
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute(
    "alt",
    /球員球場資料照片；非本案例受傷當下影像/u,
  );
  const sources = cover.locator("picture source");
  await expect(sources).toHaveCount(2);
  await expect(sources.nth(0)).toHaveAttribute("type", "image/avif");
  await expect(sources.nth(1)).toHaveAttribute("type", "image/webp");

  const attribution = cover.locator("figcaption.case-cover-attribution");
  const licenseBucket = await attribution.getAttribute("data-license-bucket");
  expect(["cc-by", "cc-by-sa", "cc0"]).toContain(licenseBucket);
  await expect(attribution).toHaveAttribute(
    "data-source-revision-id",
    /^\d+$/u,
  );
  await expect(attribution.locator("[data-attribution-notices]")).toHaveCount(
    1,
  );
  await expect(attribution).toContainText(
    "球員球場資料照片；非本案例受傷當下影像",
  );
  const licenseLinks = attribution.locator(
    'a[href^="https://creativecommons.org/"]',
  );
  await expect(licenseLinks).toHaveCount(licenseBucket === "cc-by-sa" ? 2 : 1);
  expect(
    await licenseLinks.evaluateAll((links) =>
      links.every(
        (link) =>
          !(link.getAttribute("rel") ?? "").split(/\s+/u).includes("license"),
      ),
    ),
  ).toBe(true);
  const revisionLink = attribution.locator("a", {
    hasText: "Wikimedia Commons 永久說明頁",
  });
  await expect(revisionLink).toHaveCount(1);
  await expect(revisionLink).toHaveAttribute(
    "href",
    /^https:\/\/commons\.wikimedia\.org\/w\/index\.php\?.*oldid=\d+/u,
  );
  if (licenseBucket === "cc-by-sa") {
    await expect(attribution).toContainText("Adapter's License");
    await expect(attribution).toContainText("不及於頁面其他內容");
  } else {
    await expect(attribution).not.toContainText("Adapter's License：");
  }
}

async function remoteImageUrls(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const candidates: string[] = [];
    for (const image of document.querySelectorAll("img")) {
      candidates.push(image.getAttribute("src") ?? "");
      candidates.push(
        ...(image.getAttribute("srcset") ?? "")
          .split(",")
          .map((entry) => entry.trim().split(/\s+/u)[0] ?? ""),
      );
    }
    for (const source of document.querySelectorAll("picture source")) {
      candidates.push(
        ...(source.getAttribute("srcset") ?? "")
          .split(",")
          .map((entry) => entry.trim().split(/\s+/u)[0] ?? ""),
      );
    }
    for (const preload of document.querySelectorAll(
      'link[rel="preload"][as="image"]',
    )) {
      candidates.push(preload.getAttribute("href") ?? "");
      candidates.push(
        ...(preload.getAttribute("imagesrcset") ?? "")
          .split(",")
          .map((entry) => entry.trim().split(/\s+/u)[0] ?? ""),
      );
    }
    return candidates
      .filter((value) => value !== "")
      .map((value) => new URL(value, window.location.href))
      .filter((url) => url.origin !== window.location.origin)
      .map((url) => url.href);
  });
}

test.describe("licensed player-photo covers", () => {
  test("the three NBA listing pages render an exact 26-case, 21-player local-photo partition", async ({
    page,
  }) => {
    const caseIds = new Set<string>();
    const athleteNames = new Set<string>();
    const thirdPartyRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== PAGE_ORIGIN) {
        thirdPartyRequests.push(request.url());
      }
    });

    for (const path of LISTING_PATHS) {
      await page.goto(path);
      const cards = page.locator("[data-case-card]");
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
      for (let index = 0; index < count; index += 1) {
        const card = cards.nth(index);
        caseIds.add((await card.getAttribute("data-case-card"))!);
        const cover = card.locator("[data-case-thumb]");
        await expectLicensedCover(cover);
        athleteNames.add((await cover.getAttribute("data-player-photo"))!);
        await expect(cover.locator("img")).toHaveAttribute("loading", "lazy");

        const mediaLink = cover.locator(".case-card-media-link");
        const titleLink = card.locator(".case-card-title a");
        await expect(mediaLink).toHaveCount(1);
        await expect(titleLink).toHaveCount(1);
        await expect(mediaLink.locator("a, button")).toHaveCount(0);
        expect(
          await cover
            .locator("figcaption a")
            .evaluateAll((links) =>
              links.every((link) => link.querySelector("a, button") === null),
            ),
        ).toBe(true);
      }
      expect(await remoteImageUrls(page)).toEqual([]);
    }

    expect(caseIds.size).toBe(26);
    expect(athleteNames.size).toBe(21);
    expect(thirdPartyRequests).toEqual([]);
  });

  test("hero preload, eager image, facade laziness, attribution, and valid interaction boundaries agree", async ({
    page,
  }) => {
    const thirdPartyRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== PAGE_ORIGIN) {
        thirdPartyRequests.push(request.url());
      }
    });
    await page.goto("/cases/tyrese-haliburton-achilles-rupture-2025/");

    const hero = page.locator(
      '[data-editorial-case-cover][data-player-photo="Tyrese Haliburton"]',
    );
    await expectLicensedCover(hero);
    const heroImage = hero.locator("img");
    await expect(heroImage).toHaveAttribute("loading", "eager");
    await expect(heroImage).toHaveAttribute("fetchpriority", "high");
    await expect(hero.locator("figcaption")).toContainText(
      "本站版面以 CSS 裁切（改作）",
    );

    const preload = page.locator('link[rel="preload"][as="image"]');
    await expect(preload).toHaveCount(1);
    await expect(preload).toHaveAttribute("type", "image/avif");
    expect(await preload.getAttribute("imagesrcset")).toBe(
      await hero.locator('source[type="image/avif"]').getAttribute("srcset"),
    );

    const video = page.locator(
      '[data-video-embed][data-video-id="azQpbyDBktk"]',
    );
    const facade = video.locator(
      '[data-cover-presentation="facade"][data-player-photo="Tyrese Haliburton"]',
    );
    await expectLicensedCover(facade);
    await expect(facade.locator("img")).toHaveAttribute("loading", "lazy");
    const videoAction = video.locator("[data-video-load]");
    await expect(videoAction).toContainText("載入 YouTube 播放器");
    await expect(videoAction.locator("a, button, figcaption")).toHaveCount(0);
    await expect(facade.locator("figcaption a")).toHaveCount(3);
    expect(
      await facade
        .locator("figcaption a")
        .evaluateAll((links) =>
          links.every((link) => link.closest(".case-cover-media") === null),
        ),
    ).toBe(true);

    expect(await remoteImageUrls(page)).toEqual([]);
    expect(thirdPartyRequests).toEqual([]);
    await expectNoAxeViolations(page);
  });

  test("CC BY crops omit the share-alike alteration phrase while preserving the general crop disclosure", async ({
    page,
  }) => {
    await page.goto("/cases/damian-lillard-achilles-rupture-2025/");
    const hero = page.locator(
      '[data-editorial-case-cover][data-player-photo="Damian Lillard"]',
    );
    const attribution = hero.locator("figcaption");
    await expect(attribution).toContainText("CC BY 2.0");
    await expect(attribution).toContainText("本站版面以 CSS 裁切（已作變更）");
    await expect(attribution).not.toContainText("Adapter's License：");
  });

  test("2.0 titles, source notices, and license-specific templates remain visible", async ({
    page,
  }) => {
    await page.goto("/cases/anthony-edwards-ankle-sprain-2023/");
    const anthony = page.locator(
      '[data-editorial-case-cover][data-player-photo="Anthony Edwards"] figcaption',
    );
    await expect(anthony).toContainText("作品：〈MCP_35〉");
    await expect(anthony).toHaveAttribute("data-license-bucket", "cc-by-sa");
    await expect(anthony).toContainText("Adapter's License：CC BY-SA 2.0");

    await page.goto("/cases/cj-mccollum-ankle-sprain-2020/");
    const cj = page.locator(
      '[data-editorial-case-cover][data-player-photo="CJ McCollum"] figcaption',
    );
    await expect(cj).toContainText("作品：〈CJ McCollum〉");
    await expect(cj).toContainText("著作權聲明：Erik Drost");
    await expect(cj).toHaveAttribute("data-license-bucket", "cc-by");
    await expect(cj).not.toContainText("Adapter's License：");

    await page.goto("/cases/dwight-powell-achilles-rupture-2020/");
    const dwight = page.locator(
      '[data-editorial-case-cover][data-player-photo="Dwight Powell"] figcaption',
    );
    await expect(dwight).toContainText(
      "作品：〈Basketball-Länderspiel: Deutschland gegen Kanada〉",
    );
    await expect(dwight).toContainText(
      "著作權聲明：Sandro Halank, CC BY-SA 4.0",
    );
    await expect(
      dwight.locator("a", { hasText: "Personality rights warning" }),
    ).toHaveCount(1);
  });
});
