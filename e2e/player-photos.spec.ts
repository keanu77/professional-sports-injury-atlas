import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import type {
  PlayerPhotoCommonsSelectionV6,
  PlayerPhotoSelectionV6,
  PlayerPhotoSvgFallbackSelectionV6,
} from "../src/lib/contracts/player-photo-registry-v6";
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
      "../src/assets/players/player-photo-registry.v6.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { selections: PlayerPhotoSelectionV6[] };
const registrySelections = playerPhotoRegistry.selections;
const commonsSelections = registrySelections.filter(
  (selection): selection is PlayerPhotoCommonsSelectionV6 =>
    selection.coverKind === "commons-photo",
);
const selectionByCaseId = new Map(
  registrySelections.flatMap((selection) =>
    selection.caseIds.map((caseId) => [caseId, selection] as const),
  ),
);
const NEW_V6_PHOTOS = [
  {
    athleteName: "Damian Lillard",
    caption:
      "Damian Lillard 於 2014 年芝加哥 63rd Street Beach 世界籃球節公開舞台；非本案例受傷當下影像",
    caseId: "CASE-NBAACHILLES-2025-015",
    creditAnchor: "photo-credit-1195923850",
    path: "/cases/damian-lillard-achilles-rupture-2025/",
  },
  {
    athleteName: "Jayson Tatum",
    caption:
      "Jayson Tatum 於 2018 NBA 全明星週末公開訪談舞台；非本案例受傷當下影像",
    caseId: "CASE-NBAACHILLES-2025-016",
    creditAnchor: "photo-credit-756925233",
    path: "/cases/jayson-tatum-achilles-rupture-2025/",
  },
] as const;
const INTERNAL_OWNER_RISK_MARKERS = [
  "credentialed-access-residual-risk",
  "Decision 14 — 放寬為具名低風險攝影者的賽場封面照",
  "../.claude/g2-owner-decisions.md",
  "Decision 14 accepts a bounded credentialed-access residual risk",
] as const;

async function expectLicensedCover(
  cover: Locator,
  selection: PlayerPhotoCommonsSelectionV6,
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
  await expect(attribution).toContainText(selection.nonEventCaption);
  await expect(attribution).toContainText(
    `攝影：${selection.photographerIdentity.name}`,
  );
  const creditLink = attribution.locator("[data-asset-credit-link]");
  await expect(creditLink).toHaveCount(1);
  await expect(creditLink).toHaveAttribute(
    "href",
    `/credits-notices/#photo-credit-${selection.sourceRevision.id}`,
  );
  await expect(creditLink).toHaveAttribute(
    "aria-label",
    `${selection.athleteName} 資料照片的完整授權與逐檔說明`,
  );
  await expect(
    attribution.locator('a[href^="https://creativecommons.org/"]'),
  ).toHaveCount(0);
  await expect(attribution.locator('a[href^="https://commons."]')).toHaveCount(
    0,
  );
}

async function expectOriginalSvgCover(
  cover: Locator,
  selection: PlayerPhotoSvgFallbackSelectionV6,
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
  selection: PlayerPhotoSelectionV6,
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

test.describe("Decision 14 registered player covers", () => {
  test("the three NBA listing pages render the exact registry v6 26-case partition", async ({
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
          `missing registry v6 selection for ${caseId}`,
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
    ).toHaveLength(7);
    expect(
      [...coverKindsByAthlete.entries()]
        .filter(([, kind]) => kind === "original-svg-fallback")
        .map(([athleteName]) => athleteName),
    ).toHaveLength(14);
    expect(
      [...coverKindsByCase.values()].filter((kind) => kind === "commons-photo"),
    ).toHaveLength(9);
    expect(
      [...coverKindsByCase.values()].filter(
        (kind) => kind === "original-svg-fallback",
      ),
    ).toHaveLength(17);
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
    )! as PlayerPhotoCommonsSelectionV6;
    await page.goto("/cases/kevin-durant-achilles-rupture-2019/");

    const hero = page.locator(
      '[data-editorial-case-cover][data-player-photo="Kevin Durant"]',
    );
    await expectLicensedCover(hero, selection);
    const heroImage = hero.locator("img");
    await expect(heroImage).toHaveAttribute("loading", "eager");
    await expect(heroImage).toHaveAttribute("fetchpriority", "high");

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
    await expect(facade.locator("figcaption a")).toHaveCount(1);
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

  test("the two new public-event covers use exact captions and central anchors without owner-risk copy", async ({
    page,
  }) => {
    const thirdPartyRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== PAGE_ORIGIN) {
        thirdPartyRequests.push(request.url());
      }
    });

    for (const fixture of NEW_V6_PHOTOS) {
      const selection = selectionByCaseId.get(
        fixture.caseId,
      ) as PlayerPhotoCommonsSelectionV6;
      expect(selection.coverKind).toBe("commons-photo");
      expect(selection.nonEventCaption).toBe(fixture.caption);

      await page.goto(fixture.path);
      const hero = page.locator(
        `[data-editorial-case-cover][data-player-photo="${fixture.athleteName}"]`,
      );
      await expectLicensedCover(hero, selection);
      await expect(hero.locator("figcaption")).toContainText(fixture.caption);
      await expect(hero.locator("[data-asset-credit-link]")).toHaveAttribute(
        "href",
        `/credits-notices/#${fixture.creditAnchor}`,
      );
      for (const marker of INTERNAL_OWNER_RISK_MARKERS) {
        await expect(page.locator("main")).not.toContainText(marker);
      }
      expect(await remoteImageUrls(page)).toEqual([]);
      await expectNoAxeViolations(page);
    }

    expect(thirdPartyRequests).toEqual([]);
  });

  test("an original SVG fallback remains local and carries no Creative Commons attribution", async ({
    page,
  }) => {
    await page.goto("/cases/anfernee-simons-ankle-sprain-2023/");
    const hero = page.locator(
      '[data-editorial-case-cover][data-original-svg-fallback="Anfernee Simons"]',
    );
    await expectOriginalSvgCover(
      hero,
      selectionByCaseId.get(
        "CASE-NBAANKLE-2023-004",
      )! as PlayerPhotoSvgFallbackSelectionV6,
    );
    await expect(
      hero.locator('a[href^="https://creativecommons.org/"]'),
    ).toHaveCount(0);
  });

  test("the central route renders all current photo titles, notices, exact links, changes, and license buckets", async ({
    page,
  }) => {
    await page.goto("/credits-notices/");
    const rows = page.locator("[data-asset-credit-row][id]");
    await expect(rows).toHaveCount(7);

    for (const selection of commonsSelections) {
      const row = page.locator(
        `#photo-credit-${selection.sourceRevision.id}[data-asset-credit-row]`,
      );
      await expect(row).toHaveAttribute(
        "data-athlete-name",
        selection.athleteName,
      );
      await expect(row).toHaveAttribute(
        "data-source-revision-id",
        String(selection.sourceRevision.id),
      );
      await expect(row).toHaveAttribute(
        "data-license-bucket",
        selection.rightsAttribution.licenseBucket,
      );
      await expect(row.locator('[data-credit-field="creator"]')).toContainText(
        selection.photographerIdentity.name,
      );

      const title = row.locator('[data-credit-field="work-title"]');
      await expect(title).toHaveAttribute(
        "data-work-title-status",
        selection.rightsAttribution.workTitle.status,
      );
      await expect(title).toContainText(
        selection.rightsAttribution.workTitle.text ?? "目前來源未提供",
      );

      const license = row.locator('[data-credit-field="license"]');
      await expect(license).toContainText(selection.license.name);
      await expect(license.locator("a")).toHaveAttribute(
        "href",
        selection.license.url,
      );
      await expect(
        row.locator('[data-credit-field="source"] a'),
      ).toHaveAttribute("href", selection.sourceRevision.permalink);
      await expect(
        row.locator('[data-credit-field="alteration"]'),
      ).toContainText(selection.rightsAttribution.alterationState.disclosure);

      for (const [field, notice] of [
        ["copyright-notice", selection.rightsAttribution.copyrightNotice],
        ["disclaimer-notice", selection.rightsAttribution.disclaimerNotice],
        ["other-notice", selection.rightsAttribution.otherPerFileNotice],
      ] as const) {
        const renderedNotice = row.locator(`[data-credit-field="${field}"]`);
        await expect(renderedNotice).toHaveAttribute(
          "data-notice-status",
          notice.status,
        );
        if (notice.status === "supplied") {
          await expect(renderedNotice).toContainText(notice.text!);
          if (notice.url !== null) {
            await expect(renderedNotice.locator("a")).toHaveAttribute(
              "href",
              notice.url,
            );
          }
        } else {
          await expect(renderedNotice).toContainText("目前來源未另行提供");
        }
      }

      const adapter = row.locator('[data-credit-field="adapter-license"]');
      if (selection.rightsAttribution.licenseBucket === "cc-by-sa") {
        await expect(adapter).toHaveCount(1);
        await expect(adapter.locator("a")).toHaveAttribute(
          "href",
          selection.rightsAttribution.adapterLicense!.url,
        );
        await expect(adapter).toContainText("不及於頁面其他內容");
      } else {
        await expect(adapter).toHaveCount(0);
      }

      const risk = row.locator('[data-credit-field="occasion-risk"]');
      await expect(risk).toContainText(selection.nonEventCaption);
      await expect(risk).toContainText(selection.occasionEvidence.basis);
      await expect(risk).toContainText(
        selection.sourceRiskClassification.nonClearanceStatement,
      );
    }

    await expect(
      page.locator(
        '[data-athlete-name="Kevin Durant"] [data-credit-field="work-title"]',
      ),
    ).toHaveAttribute("data-work-title-status", "not-supplied");
    await expect(
      page.locator(
        '[data-athlete-name="LeBron James"] [data-credit-field="work-title"]',
      ),
    ).toContainText("目前來源未提供");
    for (const fixture of NEW_V6_PHOTOS) {
      const row = page.locator(`#${fixture.creditAnchor}`);
      await expect(row).toHaveAttribute(
        "data-athlete-name",
        fixture.athleteName,
      );
      await expect(row).toContainText(fixture.caption);
      await expect(
        row.locator('[data-credit-field="adapter-license"] a'),
      ).toHaveAttribute(
        "href",
        "https://creativecommons.org/licenses/by-sa/4.0",
      );
    }
    await expect(page.locator("main")).toContainText(
      "每張照片均依逐檔證據標示實際場合",
    );
    for (const marker of INTERNAL_OWNER_RISK_MARKERS) {
      await expect(page.locator("main")).not.toContainText(marker);
    }
    await expectNoAxeViolations(page);
  });

  test("the reader-facing photo policy is conditional and omits the internal owner-risk statement", async ({
    page,
  }) => {
    await page.goto("/source-policy/");
    const photoPolicy = page.locator('[aria-labelledby="photo-heading"]');
    await expect(photoPolicy).toContainText("非賽事候選必須符合受控場合");
    await expect(photoPolicy).toContainText("賽事候選另須同時符合有限場合");
    await expect(photoPolicy).toContainText("每筆照片均依逐檔證據標示實際場合");
    for (const marker of INTERNAL_OWNER_RISK_MARKERS) {
      await expect(photoPolicy).not.toContainText(marker);
    }
    await expectNoAxeViolations(page);
  });
});
