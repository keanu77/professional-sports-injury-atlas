/**
 * Browser tests for the privacy-enhanced click-to-load video on the
 * review-only component lab. All YouTube/Google routes are intercepted with a
 * deterministic local stub; any unmocked YouTube-family request fails the
 * test. Covers: zero YouTube artifacts before the click, JS-disabled source
 * and timestamp anchors, the single validated `youtube-nocookie.com` iframe
 * with one official `YT.Player` over the same element, `seekTo()` timeline
 * enhancement, API-failure fallback to the real timestamp URLs with focus
 * return, external-link-only and unavailable states, caption-state labeling,
 * and the public caption gate. Every ID and name in the fixture is fictional.
 */

import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/a11y";

const LAB_PATH = "/review/component-lab/";
const FICTIONAL_ID = "fIcTiOnAl01";
const WATCH_URL = `https://www.youtube.com/watch?v=${FICTIONAL_ID}`;
const IFRAME_API_URL = "https://www.youtube.com/iframe_api";
const PAGE_ORIGIN = "http://127.0.0.1:4321";
const GOVERNED_YOUTUBE_CASES = [
  {
    slug: "anthony-edwards-ankle-sprain-2023",
    videoId: "V9mtX4mE8wQ",
    orientation: "landscape",
    injuryCode: "ankle-sprain",
    injuryLabel: "踝關節扭傷",
    athleteName: "Anthony Edwards",
  },
  {
    slug: "kevin-durant-achilles-rupture-2019",
    videoId: "YcSOLHMsJYw",
    orientation: "landscape",
    injuryCode: "achilles-rupture",
    injuryLabel: "阿基里斯腱斷裂",
    athleteName: "Kevin Durant",
  },
  {
    slug: "kyrie-irving-ankle-sprain-2021",
    videoId: "FQAPZASQyX0",
    orientation: "portrait",
    injuryCode: "ankle-sprain",
    injuryLabel: "踝關節扭傷",
    athleteName: "Kyrie Irving",
  },
  {
    slug: "lamelo-ball-ankle-sprain-2023",
    videoId: "RDDGpqOvSdg",
    orientation: "portrait",
    injuryCode: "ankle-sprain",
    injuryLabel: "踝關節扭傷",
    athleteName: "LaMelo Ball",
  },
] as const;
const GOVERNED_NBA_CASE = {
  slug: "damian-lillard-achilles-rupture-2025",
  canonicalUrl:
    "https://www.nba.com/watch/video/damian-lillard-lower-left-leg-injury-exits-1st-quarter-game-4-pacers",
  injuryCode: "achilles-rupture",
  injuryLabel: "阿基里斯腱斷裂",
  athleteName: "Damian Lillard",
} as const;

const YOUTUBE_FAMILY_RE =
  /(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be|ytimg\.com|ggpht\.com|googlevideo\.com|doubleclick\.net|google-analytics\.com|googletagmanager\.com|googlesyndication\.com)$/;

interface StubState {
  players: Array<{
    tagName: string;
    src: string;
    optionKeys: string[];
    eventKeys: string[];
    sameElement: boolean;
  }>;
  seeks: Array<[number, boolean]>;
}

const STUB_API_JS = `(() => {
  window.__stub = { players: [], seeks: [] };
  window.YT = {
    Player: function (element, options) {
      const stub = window.__stub;
      const events = (options && options.events) || {};
      stub.players.push({
        tagName: element && element.tagName,
        src: (element && element.src) || "",
        optionKeys: Object.keys(options || {}),
        eventKeys: Object.keys(events),
        sameElement: element === document.querySelector("iframe"),
      });
      this.seekTo = (seconds, allowSeekAhead) => {
        stub.seeks.push([seconds, allowSeekAhead]);
      };
      if (typeof events.onReady === "function") {
        const self = this;
        setTimeout(() => events.onReady({ target: self }), 0);
      }
    },
  };
  if (typeof window.onYouTubeIframeAPIReady === "function") {
    window.onYouTubeIframeAPIReady();
  }
})();`;

const STUB_EMBED_HTML = `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8" />
<title>本機測試用替身播放器（stub embed）</title></head>
<body><p>deterministic local stub embed</p></body></html>`;

const STUB_WATCH_HTML = `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8" />
<title>本機測試用替身原始頁（stub watch page）</title></head>
<body><p>deterministic local stub watch page</p></body></html>`;

interface StubLog {
  /** Every YouTube-family request URL, mocked or not. */
  youtubeRequests: string[];
  /** YouTube-family requests that had no deterministic local stub. */
  unmocked: string[];
}

async function stubYouTubeRoutes(
  page: Page,
  options: { failApi?: boolean; serveWatchPages?: boolean } = {},
): Promise<StubLog> {
  const log: StubLog = { youtubeRequests: [], unmocked: [] };
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (!YOUTUBE_FAMILY_RE.test(url.hostname)) {
      await route.fallback();
      return;
    }
    log.youtubeRequests.push(url.href);
    if (url.href === IFRAME_API_URL) {
      if (options.failApi === true) {
        await route.abort("failed");
        return;
      }
      await route.fulfill({
        contentType: "application/javascript",
        body: STUB_API_JS,
      });
      return;
    }
    if (
      url.hostname === "www.youtube-nocookie.com" &&
      url.pathname.startsWith("/embed/")
    ) {
      await route.fulfill({ contentType: "text/html", body: STUB_EMBED_HTML });
      return;
    }
    if (
      options.serveWatchPages === true &&
      url.hostname === "www.youtube.com" &&
      url.pathname === "/watch"
    ) {
      await route.fulfill({ contentType: "text/html", body: STUB_WATCH_HTML });
      return;
    }
    log.unmocked.push(url.href);
    await route.abort("failed");
  });
  return log;
}

function reviewCard(page: Page) {
  return page.locator(
    '[data-video-embed][data-video-scope="lab-embed-review"]',
  );
}

async function expectLocalResponsiveCover(
  cover: Locator,
  expected: { athleteName?: string; injuryLabel?: string } = {},
): Promise<void> {
  const picture = cover.locator("picture");
  const image = picture.locator("img");
  await expect(picture).toHaveCount(1);
  await expect(image).toBeVisible();
  if (expected.athleteName === undefined) {
    await expect(cover).toHaveAttribute("data-cover-kind", "injury-theme");
    await expect(image).toHaveAttribute(
      "alt",
      new RegExp(
        `${expected.injuryLabel ?? "原創"}.*匿名運動員面孔不可見.*不代表任何特定球員`,
      ),
    );
  } else {
    await expect(cover).toHaveAttribute(
      "data-cover-kind",
      "licensed-player-photo",
    );
    await expect(cover).toHaveAttribute(
      "data-player-photo",
      expected.athleteName,
    );
    await expect(image).toHaveAttribute(
      "alt",
      new RegExp(
        `${expected.athleteName}.*球員球場資料照片.*非本案例受傷當下影像`,
      ),
    );
    const attribution = cover.locator("figcaption.case-cover-attribution");
    await expect(attribution).toContainText("攝影：");
    await expect(attribution).toContainText(
      "球員球場資料照片；非本案例受傷當下影像",
    );
    await expect(
      attribution.locator('a[href^="https://creativecommons.org/"]'),
    ).toHaveCount(1);
    await expect(
      attribution.locator(
        'a[href^="https://commons.wikimedia.org/wiki/File:"]',
      ),
    ).toHaveCount(1);
  }

  await expect(cover).toHaveAttribute("data-focal-x", /^(?:0|[1-9]\d?|100)$/u);
  await expect(cover).toHaveAttribute("data-focal-y", /^(?:0|[1-9]\d?|100)$/u);

  const sources = picture.locator("source");
  await expect(sources).toHaveCount(2);
  const sourceData = await sources.evaluateAll((elements) =>
    elements.map((element) => ({
      type: element.getAttribute("type"),
      srcset: element.getAttribute("srcset") ?? "",
    })),
  );
  expect(sourceData.map(({ type }) => type)).toEqual([
    "image/avif",
    "image/webp",
  ]);
  let expectedWidths: number[] | null = null;
  for (const source of sourceData) {
    expect(source.srcset).toContain(" 480w");
    const widths: number[] = [];
    for (const candidate of source.srcset.split(",")) {
      const [url, widthDescriptor] = candidate.trim().split(/\s+/);
      expect(new URL(url, PAGE_ORIGIN).origin).toBe(PAGE_ORIGIN);
      widths.push(Number.parseInt(widthDescriptor!, 10));
    }
    expect(widths).toEqual([...widths].sort((a, b) => a - b));
    expect(widths.length).toBeGreaterThanOrEqual(3);
    if (expectedWidths === null) expectedWidths = widths;
    else expect(widths).toEqual(expectedWidths);
  }
  const currentSrc = await image.evaluate(
    (element) => (element as HTMLImageElement).currentSrc,
  );
  expect(new URL(currentSrc, PAGE_ORIGIN).origin).toBe(PAGE_ORIGIN);
}

async function readStub(page: Page): Promise<StubState> {
  const state = await page.evaluate(
    () => (window as unknown as { __stub?: StubState }).__stub,
  );
  expect(state).toBeDefined();
  return state as StubState;
}

async function loadReviewPlayer(page: Page): Promise<void> {
  await reviewCard(page).locator("[data-video-load]").click();
  await expect(reviewCard(page)).toHaveAttribute("data-video-state", "ready");
}

test.describe("component lab before enhancement", () => {
  test("initial DOM and network log contain no YouTube artifacts", async ({
    page,
  }) => {
    const log = await stubYouTubeRoutes(page);
    await page.goto(LAB_PATH);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "元件實驗室",
    );

    expect(log.youtubeRequests).toEqual([]);
    expect(log.unmocked).toEqual([]);

    await expect(page.locator("iframe")).toHaveCount(0);
    expect(await page.locator("img").count()).toBeGreaterThan(0);
    await expect(page.locator("link[rel='preconnect']")).toHaveCount(0);
    await expect(page.locator("link[rel='dns-prefetch']")).toHaveCount(0);
    await expect(page.locator("[autoplay]")).toHaveCount(0);
    const html = await page.content();
    expect(html).not.toContain("ytimg");
    expect(html).not.toContain("youtube-nocookie");
    expect(html).not.toContain("autoplay");

    const facade = reviewCard(page).locator("[data-video-facade]");
    await expectLocalResponsiveCover(facade.locator("[data-case-cover]"));
    await expect(facade.locator("[data-video-load]")).toContainText(
      "載入 YouTube 播放器",
    );
    await expect(facade).toContainText("點擊後才會連線至 YouTube");

    const sourceLink = reviewCard(page).locator("[data-video-source-link]");
    await expect(sourceLink).toHaveAttribute("href", WATCH_URL);
    const timeline = page.locator(
      '[data-video-timeline][data-video-scope="lab-embed-review"]',
    );
    await expect(timeline.locator("a[data-timecode]")).toHaveCount(2);
    await expect(timeline.locator("a[data-timecode]").first()).toHaveAttribute(
      "href",
      `${WATCH_URL}&t=12s`,
    );

    await expectNoAxeViolations(page);

    await page.getByRole("button", { name: "深色模式" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expectNoAxeViolations(page);
  });

  test("every photo facade uses a responsive local picture with descriptive alt text", async ({
    page,
  }) => {
    await stubYouTubeRoutes(page);
    await page.goto(LAB_PATH);

    const cards = page.locator(".case-video");
    const covers = cards.locator("[data-case-cover]");
    const count = await cards.count();
    await expect(covers).toHaveCount(count);
    for (let index = 0; index < count; index += 1) {
      await expectLocalResponsiveCover(covers.nth(index));
    }
  });
});

test.describe("governed case facades", () => {
  test("all four YouTube cases use one local photo facade and make zero pre-click requests", async ({
    page,
  }) => {
    const log = await stubYouTubeRoutes(page);
    const thirdPartyRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== PAGE_ORIGIN) {
        thirdPartyRequests.push(request.url());
      }
    });

    for (const entry of GOVERNED_YOUTUBE_CASES) {
      await page.goto(`/cases/${entry.slug}/`);
      const card = page.locator(
        `[data-video-embed][data-video-id="${entry.videoId}"]`,
      );
      await expect(card).toHaveAttribute(
        "data-video-orientation",
        entry.orientation,
      );
      const cover = card.locator("[data-video-facade] [data-case-cover]");
      await expect(cover).toHaveAttribute("data-case-cover", entry.injuryCode);
      await expectLocalResponsiveCover(cover, {
        athleteName: entry.athleteName,
        injuryLabel: entry.injuryLabel,
      });
      await expect(
        cover.locator(`[data-cover-illustration="${entry.injuryCode}"]`),
      ).toHaveCount(1);
      await expect(card.locator("[data-video-load]")).toContainText(
        "載入 YouTube 播放器",
      );
      await expect(page.locator("[data-case-cover]")).toHaveCount(2);
      await expect(page.locator("iframe")).toHaveCount(0);
      expect(await page.locator("img").count()).toBeGreaterThanOrEqual(2);
      expect(log.youtubeRequests).toEqual([]);
      expect(thirdPartyRequests).toEqual([]);
    }
  });

  test("both Shorts load at 9:16 while landscape remains 16:9", async ({
    page,
  }) => {
    const log = await stubYouTubeRoutes(page);
    const geometryCases = [
      ...GOVERNED_YOUTUBE_CASES.filter(
        (entry) => entry.orientation === "portrait",
      ),
      GOVERNED_YOUTUBE_CASES.find(
        (entry) => entry.slug === "kevin-durant-achilles-rupture-2019",
      )!,
    ];

    for (const entry of geometryCases) {
      await page.goto(`/cases/${entry.slug}/`);
      const card = page.locator(
        `[data-video-embed][data-video-id="${entry.videoId}"]`,
      );
      await card.locator("[data-video-load]").click();
      await expect(card).toHaveAttribute("data-video-state", "ready");

      const iframe = card.locator("iframe");
      await expect(iframe).toHaveCount(1);
      const box = await iframe.boundingBox();
      expect(box).not.toBeNull();
      if (entry.orientation === "portrait") {
        expect(Math.abs(box!.height / box!.width - 16 / 9)).toBeLessThan(0.02);
        expect(box!.width).toBeLessThanOrEqual(385);
        const stageBox = await card.locator("[data-video-stage]").boundingBox();
        expect(stageBox).not.toBeNull();
        const centerOffset = Math.abs(
          box!.x + box!.width / 2 - (stageBox!.x + stageBox!.width / 2),
        );
        expect(centerOffset).toBeLessThanOrEqual(2);
      } else {
        expect(Math.abs(box!.width / box!.height - 16 / 9)).toBeLessThan(0.02);
      }
    }
    expect(log.unmocked).toEqual([]);
  });

  test("a real NBA case uses its governed local-photo external facade with zero third-party requests", async ({
    page,
  }) => {
    const log = await stubYouTubeRoutes(page);
    const thirdPartyRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== PAGE_ORIGIN) {
        thirdPartyRequests.push(request.url());
      }
    });

    await page.goto(`/cases/${GOVERNED_NBA_CASE.slug}/`);
    const card = page.locator("[data-video-external]");
    const link = card.locator("[data-video-source-link]");
    await expect(link).toHaveAttribute("href", GOVERNED_NBA_CASE.canonicalUrl);
    await expect(link).toContainText("於 NBA.com 觀看");
    const cover = card.locator("[data-case-cover]");
    await expect(cover).toHaveAttribute(
      "data-case-cover",
      GOVERNED_NBA_CASE.injuryCode,
    );
    await expectLocalResponsiveCover(cover, {
      athleteName: GOVERNED_NBA_CASE.athleteName,
      injuryLabel: GOVERNED_NBA_CASE.injuryLabel,
    });
    await expect(link.locator("a, button, [data-case-cover]")).toHaveCount(0);
    await expect(
      cover.locator(
        `[data-cover-illustration="${GOVERNED_NBA_CASE.injuryCode}"]`,
      ),
    ).toHaveCount(1);
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(await page.locator("img").count()).toBeGreaterThanOrEqual(2);
    expect(log.youtubeRequests).toEqual([]);
    expect(thirdPartyRequests).toEqual([]);
  });
});

test.describe("component lab without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("source and timestamp anchors still work as normal links", async ({
    page,
  }) => {
    await stubYouTubeRoutes(page, { serveWatchPages: true });
    await page.goto(LAB_PATH);

    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(
      reviewCard(page).locator("[data-video-source-link]"),
    ).toHaveAttribute("href", WATCH_URL);

    const anchor = page
      .locator('[data-video-timeline][data-video-scope="lab-embed-review"]')
      .locator("a[data-timecode]")
      .first();
    await expect(anchor).toHaveAttribute("href", `${WATCH_URL}&t=12s`);
    await anchor.click();
    await expect(page).toHaveURL(`${WATCH_URL}&t=12s`);
  });
});

test.describe("click-to-load player", () => {
  test("first click creates one validated no-cookie iframe and one player", async ({
    page,
  }) => {
    const log = await stubYouTubeRoutes(page);
    await page.goto(LAB_PATH);
    expect(log.youtubeRequests).toEqual([]);

    const card = reviewCard(page);
    await card.locator("[data-video-load]").click();

    const iframe = page.locator("iframe");
    await expect(iframe).toHaveCount(1);
    const iframeHandle = await iframe.elementHandle();
    expect(iframeHandle).not.toBeNull();

    const src = await iframe.getAttribute("src");
    expect(src).not.toBeNull();
    const parsed = new URL(src as string);
    expect(parsed.origin).toBe("https://www.youtube-nocookie.com");
    expect(parsed.pathname).toBe(`/embed/${FICTIONAL_ID}`);
    expect([...parsed.searchParams.keys()]).toEqual(["enablejsapi", "origin"]);
    expect(parsed.searchParams.get("enablejsapi")).toBe("1");
    expect(parsed.searchParams.get("origin")).toBe(PAGE_ORIGIN);
    expect(src).not.toContain("autoplay");

    await expect(iframe).toHaveAttribute("loading", "lazy");
    await expect(iframe).toHaveAttribute(
      "referrerpolicy",
      "strict-origin-when-cross-origin",
    );
    const title = await iframe.getAttribute("title");
    expect(title).toContain("虛構示範受傷片段");
    const allow = (await iframe.getAttribute("allow")) ?? "";
    expect(allow).not.toContain("autoplay");

    await expect(card).toHaveAttribute("data-video-state", "ready");
    const stub = await readStub(page);
    expect(stub.players).toHaveLength(1);
    const player = stub.players[0]!;
    expect(player.tagName).toBe("IFRAME");
    expect(player.optionKeys).toEqual(["events"]);
    expect(player.optionKeys).not.toContain("host");
    expect(player.eventKeys.sort()).toEqual(["onError", "onReady"]);
    expect(player.sameElement).toBe(true);
    expect(new URL(player.src).hostname).toBe("www.youtube-nocookie.com");

    // After API readiness the same element is still attached and still points
    // at the no-cookie host.
    const stillSame = await page.evaluate(
      (el) => el.isConnected && el === document.querySelector("iframe"),
      iframeHandle!,
    );
    expect(stillSame).toBe(true);
    const readyHost = await page.evaluate(
      (el) => new URL((el as HTMLIFrameElement).src).hostname,
      iframeHandle!,
    );
    expect(readyHost).toBe("www.youtube-nocookie.com");
    await expect(iframe).toHaveCount(1);

    // Only the deterministic stub routes were requested; nothing unmocked.
    expect(log.unmocked).toEqual([]);
    expect(
      log.youtubeRequests.every(
        (entry) =>
          entry === IFRAME_API_URL ||
          entry.startsWith(
            `https://www.youtube-nocookie.com/embed/${FICTIONAL_ID}`,
          ),
      ),
    ).toBe(true);

    await expectNoAxeViolations(page);
  });

  test("timeline seeks through the same ready player without navigation", async ({
    page,
  }) => {
    const log = await stubYouTubeRoutes(page);
    await page.goto(LAB_PATH);
    await loadReviewPlayer(page);
    const iframeHandle = await page.locator("iframe").elementHandle();

    const timeline = page.locator(
      '[data-video-timeline][data-video-scope="lab-embed-review"]',
    );
    await timeline.locator("a[data-timecode]").first().click();
    await expect(page).toHaveURL(new RegExp(`${LAB_PATH}$`));
    await expect
      .poll(async () => (await readStub(page)).seeks)
      .toEqual([[12, true]]);

    await timeline.locator("a[data-timecode]").nth(1).click();
    await expect
      .poll(async () => (await readStub(page)).seeks)
      .toEqual([
        [12, true],
        [45, true],
      ]);

    const stub = await readStub(page);
    expect(stub.players).toHaveLength(1);
    const stillSame = await page.evaluate(
      (el) => el.isConnected && el === document.querySelector("iframe"),
      iframeHandle!,
    );
    expect(stillSame).toBe(true);
    expect(log.unmocked).toEqual([]);
  });

  test("API load failure removes the iframe, returns focus, and keeps real links", async ({
    page,
  }) => {
    await stubYouTubeRoutes(page, { failApi: true, serveWatchPages: true });
    await page.goto(LAB_PATH);

    const card = reviewCard(page);
    const button = card.locator("[data-video-load]");
    await button.click();

    await expect(card).toHaveAttribute("data-video-state", "failed");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(button).toBeVisible();
    await expect(button).toBeFocused();
    await expect(card.locator("[data-video-failure]")).toBeVisible();
    await expectNoAxeViolations(page);

    // The browser follows the original timestamp URL.
    await page
      .locator('[data-video-timeline][data-video-scope="lab-embed-review"]')
      .locator("a[data-timecode]")
      .first()
      .click();
    await expect(page).toHaveURL(`${WATCH_URL}&t=12s`);
  });
});

test.describe("non-embedded states and caption policy", () => {
  test("external-link-only renders a source link and no blank player", async ({
    page,
  }) => {
    const log = await stubYouTubeRoutes(page);
    await page.goto(LAB_PATH);

    const external = page
      .locator("section", {
        has: page.locator("#lab-external-heading"),
      })
      .locator(".case-video");
    await expect(external).toHaveAttribute("data-video-external", "");
    await expect(external.locator("[data-video-source-link]")).toHaveAttribute(
      "href",
      "https://www.nba.com/watch/fictional-demo-clip",
    );
    await expectLocalResponsiveCover(external.locator("[data-case-cover]"));
    await expect(
      external.locator(
        "[data-video-source-link] a, [data-video-source-link] button",
      ),
    ).toHaveCount(0);
    await expect(external.locator("[data-video-source-link]")).toContainText(
      "於 NBA.com 觀看",
    );
    await expect(external.locator("[data-video-source-link]")).toContainText(
      "外部連結",
    );
    await expect(external.locator("[data-video-load]")).toHaveCount(0);
    await expect(external.locator("[data-video-stage]")).toHaveCount(0);
    await expect(external.locator("iframe")).toHaveCount(0);
    expect(log.youtubeRequests).toEqual([]);
  });

  test("unavailable renders a clear notice and no player", async ({ page }) => {
    await stubYouTubeRoutes(page);
    await page.goto(LAB_PATH);

    const unavailable = page.locator("[data-video-unavailable]");
    await expect(unavailable).toHaveCount(1);
    await expect(
      unavailable.locator("[data-video-unavailable-notice]"),
    ).toContainText("原始影片目前無法取得");
    await expect(unavailable.locator("[data-video-load]")).toHaveCount(0);
    await expect(unavailable.locator("[data-video-stage]")).toHaveCount(0);
    await expect(unavailable.locator("iframe")).toHaveCount(0);
    await expect(unavailable.locator("a")).toHaveCount(0);
  });

  test("caption states are visibly labeled and gate the public player", async ({
    page,
  }) => {
    await stubYouTubeRoutes(page);
    await page.goto(LAB_PATH);

    await expect(
      page.locator('[data-caption-status="not-verified"]').first(),
    ).toContainText("字幕：尚未驗證");
    await expect(
      page.locator('[data-caption-status="available"]'),
    ).toContainText("字幕：原始平台提供");
    await expect(
      page.locator('[data-caption-status="unavailable"]'),
    ).toContainText("字幕：原始影片未提供字幕");

    // Public mode: captions available -> in-site click-to-load allowed.
    const publicEmbeddable = page.locator(
      '[data-video-embed][data-video-scope="lab-embed-public"]',
    );
    await expect(publicEmbeddable.locator("[data-video-load]")).toHaveCount(1);

    // Public mode: captions unavailable -> labeled external link, no player.
    const degraded = page
      .locator("section", { has: page.locator("#lab-public-degraded-heading") })
      .locator(".case-video");
    await expect(degraded).toHaveAttribute("data-video-external", "");
    await expect(degraded.locator("[data-video-load]")).toHaveCount(0);
    await expect(degraded.locator("iframe")).toHaveCount(0);
    await expect(degraded.locator("[data-caption-warning]")).toContainText(
      "不在本站內嵌播放",
    );
    await expect(degraded.locator("[data-video-source-link]")).toHaveAttribute(
      "href",
      WATCH_URL,
    );

    // Review mode still shows the technical state plus the visible warning.
    const review = reviewCard(page);
    await expect(review.locator("[data-review-state]")).toContainText(
      "embedStatus=verified",
    );
    await expect(review.locator("[data-caption-warning]")).toBeVisible();
  });
});
