import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import type {
  PlayerPhotoCommonsSelectionV5,
  PlayerPhotoSelectionV5,
  PlayerPhotoSvgFallbackSelectionV5,
} from "../src/lib/contracts/player-photo-registry-v5";
import { expectNoAxeViolations } from "./helpers/a11y";

const PAGE_ORIGIN = "http://127.0.0.1:4321";
const LISTING_PATHS = [
  "/leagues/nba/",
  "/leagues/nba/page/2/",
  "/leagues/nba/page/3/",
] as const;

const playerPhotoRegistry = JSON.parse(
  readFileSync(
    new URL(
      "../src/assets/players/player-photo-registry.v5.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { selections: PlayerPhotoSelectionV5[] };
const registrySelections = playerPhotoRegistry.selections;
const selectionByCaseId = new Map(
  registrySelections.flatMap((selection) =>
    selection.caseIds.map((caseId) => [caseId, selection] as const),
  ),
);

async function expectLicensedCover(
  cover: Locator,
  selection: PlayerPhotoCommonsSelectionV5,
): Promise<void> {
  await expect(cover).toHaveAttribute(
    "data-cover-kind",
    "licensed-player-photo",
  );
  await expect(cover).toHaveAttribute(
    "data-player-photo",
    selection.athleteName,
  );
  await expect(cover).toHaveAttribute(
    "data-focal-x",
    String(selection.focalPosition.xPercent),
  );
  await expect(cover).toHaveAttribute(
    "data-focal-y",
    String(selection.focalPosition.yPercent),
  );

  const image = cover.locator("picture img");
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("alt", `${selection.nonEventCaption}。`);
  const sources = cover.locator("picture source");
  await expect(sources).toHaveCount(2);
  await expect(sources.nth(0)).toHaveAttribute("type", "image/avif");
  await expect(sources.nth(1)).toHaveAttribute("type", "image/webp");

  const attribution = cover.locator("figcaption.case-cover-attribution");
  const licenseBucket = selection.rightsAttribution.licenseBucket;
  await expect(attribution).toHaveAttribute(
    "data-license-bucket",
    licenseBucket,
  );
  await expect(attribution).toHaveAttribute(
    "data-source-revision-id",
    String(selection.sourceRevision.id),
  );
  await expect(attribution).toHaveAttribute(
    "data-source-risk-category",
    "non-event-low-risk",
  );
  await expect(attribution.locator("[data-attribution-notices]")).toHaveCount(
    1,
  );
  await expect(attribution).toContainText(selection.nonEventCaption);
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
  const riskClassification = attribution.locator(
    "[data-source-risk-classification]",
  );
  await expect(riskClassification).toHaveCount(1);
  await expect(riskClassification).toHaveAttribute(
    "data-source-risk-checked-at",
    selection.occasionEvidence.checkedAt,
  );
  await expect(riskClassification).toContainText("來源風險分類：");
  await expect(riskClassification).toContainText(
    "非賽事場合（non-event-low-risk；低風險分類）",
  );
  await expect(
    riskClassification.locator("[data-source-risk-basis]"),
  ).toContainText(selection.occasionEvidence.basis);
  await expect(
    riskClassification.locator("[data-source-risk-no-clearance]"),
  ).toHaveText("此分類不代表著作權、肖像權或公開使用已獲放行。");
  expect(
    await riskClassification.getAttribute(
      "data-source-risk-revision-permalink",
    ),
  ).toBe(await revisionLink.getAttribute("href"));
  if (licenseBucket === "cc-by-sa") {
    await expect(attribution).toContainText("Adapter's License");
    await expect(attribution).toContainText("不及於頁面其他內容");
  } else {
    await expect(attribution).not.toContainText("Adapter's License：");
  }
}

async function expectOriginalSvgCover(
  cover: Locator,
  selection: PlayerPhotoSvgFallbackSelectionV5,
): Promise<void> {
  await expect(cover).toHaveAttribute(
    "data-cover-kind",
    "original-svg-fallback",
  );
  await expect(cover).toHaveAttribute(
    "data-original-svg-fallback",
    selection.athleteName,
  );
  await expect(cover).not.toHaveAttribute("data-player-photo", /.+/u);
  await expect(cover).toHaveAttribute(
    "data-focal-x",
    String(selection.focalPosition.xPercent),
  );
  await expect(cover).toHaveAttribute(
    "data-focal-y",
    String(selection.focalPosition.yPercent),
  );

  const image = cover.locator("img[data-local-original-svg]");
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute(
    "alt",
    `${selection.athleteName} 案例：${selection.nonEventCaption}。`,
  );
  await expect(image).toHaveAttribute("src", /\.svg$/u);
  await expect(cover.locator("picture")).toHaveCount(0);
  await expect(cover.locator("figcaption.case-cover-attribution")).toHaveCount(
    0,
  );
  const fallbackLabel = cover.locator("figcaption[data-original-svg-label]");
  await expect(fallbackLabel).toHaveText(`${selection.nonEventCaption}。`);
}

async function expectRegisteredCover(
  cover: Locator,
  selection: PlayerPhotoSelectionV5,
): Promise<void> {
  if (selection.coverKind === "commons-photo") {
    await expectLicensedCover(cover, selection);
  } else {
    await expectOriginalSvgCover(cover, selection);
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

test.describe("Decision 13 registered player covers", () => {
  test("the three NBA listing pages render the exact registry v5 26-case partition", async ({
    page,
  }) => {
    const caseIds = new Set<string>();
    const athleteNames = new Set<string>();
    const coverKindsByAthlete = new Map<string, string>();
    const coverKindsByCase = new Map<string, string>();
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
        const caseId = (await card.getAttribute("data-case-card"))!;
        const selection = selectionByCaseId.get(caseId);
        expect(
          selection,
          `missing registry v5 selection for ${caseId}`,
        ).toBeDefined();
        caseIds.add(caseId);
        const cover = card.locator("[data-case-thumb]");
        await expectRegisteredCover(cover, selection!);
        athleteNames.add(selection!.athleteName);
        const existingKind = coverKindsByAthlete.get(selection!.athleteName);
        if (existingKind !== undefined) {
          expect(selection!.coverKind).toBe(existingKind);
        }
        coverKindsByAthlete.set(selection!.athleteName, selection!.coverKind);
        coverKindsByCase.set(caseId, selection!.coverKind);
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

    expect([...caseIds].sort()).toEqual([...selectionByCaseId.keys()].sort());
    expect(caseIds.size).toBe(26);
    expect(athleteNames.size).toBe(registrySelections.length);
    expect(athleteNames.size).toBe(21);
    expect(
      [...coverKindsByAthlete.values()].filter(
        (kind) => kind === "commons-photo",
      ),
    ).toHaveLength(5);
    expect(
      [...coverKindsByAthlete.entries()]
        .filter(([, kind]) => kind === "original-svg-fallback")
        .map(([athleteName]) => athleteName),
    ).toHaveLength(16);
    expect(
      [...coverKindsByCase.values()].filter((kind) => kind === "commons-photo"),
    ).toHaveLength(7);
    expect(
      [...coverKindsByCase.values()].filter(
        (kind) => kind === "original-svg-fallback",
      ),
    ).toHaveLength(19);
    expect(thirdPartyRequests).toEqual([]);
  });

  test("photo hero preload, facade laziness, attribution, and interaction boundaries agree", async ({
    page,
  }) => {
    const thirdPartyRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== PAGE_ORIGIN) {
        thirdPartyRequests.push(request.url());
      }
    });
    const selection = selectionByCaseId.get(
      "CASE-NBAACHILLES-2019-005",
    )! as PlayerPhotoCommonsSelectionV5;
    await page.goto("/cases/kevin-durant-achilles-rupture-2019/");

    const hero = page.locator(
      '[data-editorial-case-cover][data-player-photo="Kevin Durant"]',
    );
    await expectLicensedCover(hero, selection);
    const heroImage = hero.locator("img");
    await expect(heroImage).toHaveAttribute("loading", "eager");
    await expect(heroImage).toHaveAttribute("fetchpriority", "high");
    await expect(hero.locator("figcaption")).toContainText(
      selection.rightsAttribution.alterationState.disclosure,
    );

    const preload = page.locator('link[rel="preload"][as="image"]');
    await expect(preload).toHaveCount(1);
    await expect(preload).toHaveAttribute("type", "image/avif");
    expect(await preload.getAttribute("imagesrcset")).toBe(
      await hero.locator('source[type="image/avif"]').getAttribute("srcset"),
    );

    const video = page.locator(
      '[data-video-embed][data-video-id="YcSOLHMsJYw"]',
    );
    const facade = video.locator(
      '[data-cover-presentation="facade"][data-player-photo="Kevin Durant"]',
    );
    await expectLicensedCover(facade, selection);
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

  test("an original SVG fallback remains local and carries no Creative Commons attribution", async ({
    page,
  }) => {
    await page.goto("/cases/damian-lillard-achilles-rupture-2025/");
    const hero = page.locator(
      '[data-editorial-case-cover][data-original-svg-fallback="Damian Lillard"]',
    );
    await expectOriginalSvgCover(
      hero,
      selectionByCaseId.get(
        "CASE-NBAACHILLES-2025-015",
      )! as PlayerPhotoSvgFallbackSelectionV5,
    );
    await expect(
      hero.locator('a[href^="https://creativecommons.org/"]'),
    ).toHaveCount(0);
  });

  test("current photo titles, source notices, captions, and license buckets remain visible", async ({
    page,
  }) => {
    await page.goto("/cases/kyrie-irving-ankle-sprain-2021/");
    const kyrie = page.locator(
      '[data-editorial-case-cover][data-player-photo="Kyrie Irving"] figcaption',
    );
    await expect(kyrie).toContainText("作品：〈Kyrie Irving〉");
    await expect(kyrie).toHaveAttribute("data-license-bucket", "cc-by");
    await expect(kyrie).toContainText("原作 CC BY 2.0");
    await expect(kyrie).toContainText(
      "Kyrie Irving 於 2016 冠軍遊行；非本案例受傷當下影像",
    );
    await expect(kyrie).not.toContainText("Adapter's License：");

    await page.goto("/cases/cj-mccollum-ankle-sprain-2020/");
    const cj = page.locator(
      '[data-editorial-case-cover][data-player-photo="CJ McCollum"] figcaption',
    );
    await expect(cj).toContainText("作品：〈JG9_0113〉");
    await expect(cj).toHaveAttribute("data-license-bucket", "cc-by-sa");
    await expect(cj).toContainText("Adapter's License：CC BY-SA 4.0");
    await expect(cj).toContainText(
      "C.J. McCollum 於 2025–26 華盛頓巫師媒體日；非本案例受傷當下影像",
    );

    await page.goto("/cases/lebron-james-ankle-sprain-2021/");
    const lebron = page.locator(
      '[data-editorial-case-cover][data-player-photo="LeBron James"] figcaption',
    );
    await expect(lebron).toHaveAttribute("data-license-bucket", "cc-by");
    await expect(lebron).toContainText("原作 CC BY 3.0");
    await expect(lebron).toContainText(
      "LeBron James 於《More Than a Game》紐約公開活動；非本案例受傷當下影像",
    );
    await expect(
      lebron.locator("a", { hasText: "Personality rights warning" }),
    ).toHaveCount(1);

    await page.goto("/cases/dwight-powell-achilles-rupture-2020/");
    const dwight = page.locator(
      '[data-editorial-case-cover][data-player-photo="Dwight Powell"] figcaption',
    );
    await expect(dwight).toContainText(
      "作品：〈Basketball-Länderspiel: Deutschland gegen Kanada〉",
    );
    await expect(dwight).toContainText(
      "著作權聲明：Sandro Halank, Wikimedia Commons, CC BY-SA 4.0",
    );
    await expect(
      dwight.locator("a", { hasText: "Personality rights warning" }),
    ).toHaveCount(1);
  });
});
