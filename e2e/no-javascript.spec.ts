/**
 * No-JavaScript spec. With scripts disabled, the static pages and the
 * data-bearing fixture routes stay completely readable: both note layers in
 * normal order, real source and timestamp anchors, the video external/failure
 * states, record IDs and digests, static listing pagination, and the
 * documented degradation notice for advanced filtering.
 */

import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test.describe("no-javascript readability", () => {
  test("home and injury pages stay readable without JavaScript", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-injury-card]")).toHaveCount(3);

    await page.goto("/injuries/acl/");
    await expect(page.locator("[data-injury-scope]")).toBeVisible();
    await expect(page.locator("[data-static-listing]")).toBeVisible();
    // The documented degradation notice ships inside <noscript>. Emulated
    // script disabling does not switch the parser's noscript handling, so
    // assert the served markup instead of computed visibility.
    const noscriptText = await page.evaluate(
      () =>
        document.querySelector("[data-case-filters] noscript")?.textContent ??
        "",
    );
    expect(noscriptText).toContain("進階複合篩選需要 JavaScript");
  });

  test("fixture case detail keeps both note layers readable in order", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");

    const general = page.locator('[data-layer="general"]');
    const professional = page.locator('[data-layer="professional"]');
    await expect(general).toBeVisible();
    await expect(professional).toBeVisible();
    await expect(general).toContainText("發生了什麼");
    await expect(general).toContainText("畫面不能證明什麼");
    await expect(professional).toContainText("機轉分析（觀察性）");

    // Normal DOM order: general notes precede professional notes.
    const order = await page.evaluate(() => {
      const generalEl = document.querySelector('[data-layer="general"]');
      const professionalEl = document.querySelector(
        '[data-layer="professional"]',
      );
      if (generalEl === null || professionalEl === null) return false;
      return Boolean(
        generalEl.compareDocumentPosition(professionalEl) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(order).toBe(true);
  });

  test("source links, timestamps, IDs, and digests render without JavaScript", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");

    // Every source entry is a normal HTTPS anchor.
    const sourceLinks = page.locator(".source-list a");
    expect(await sourceLinks.count()).toBeGreaterThan(0);
    for (const href of await sourceLinks.evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href")),
    )) {
      expect(href).toMatch(/^https:\/\//);
    }

    // Timeline entries are real timestamp anchors on the canonical URL.
    const timestampLinks = page.locator(
      "[data-video-timeline] a[data-timecode]",
    );
    expect(await timestampLinks.count()).toBeGreaterThan(0);
    for (const href of await timestampLinks.evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href")),
    )) {
      expect(href).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
      expect(href).toMatch(/[?&]t=\d+s?$/);
    }

    // Record ID and copyable 64-hex digests are server-rendered.
    await expect(page.locator("[data-record-id]")).toContainText(
      "CASE-FIC-2014-901",
    );
    const digestValues = await page
      .locator(".digest-field")
      .evaluateAll((fields) =>
        fields.map((field) => (field as HTMLInputElement).value),
      );
    expect(digestValues.length).toBeGreaterThanOrEqual(2);
    for (const value of digestValues) {
      expect(value).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  test("a real NBA source list keeps complete literal citations without NBA anchors", async ({
    page,
  }) => {
    await page.goto("/cases/damian-lillard-achilles-rupture-2025/");

    await expect(page.locator('a[href*="nba.com"]')).toHaveCount(0);
    const citations = page.locator(
      '.source-list [data-link-policy="nba-plain-text-citation"]',
    );
    await expect(citations).toHaveCount(3);
    for (let index = 0; index < (await citations.count()); index += 1) {
      const citation = citations.nth(index);
      await expect(citation.locator("[data-citation-title]")).not.toBeEmpty();
      await expect(
        citation.locator("[data-citation-publisher]"),
      ).not.toBeEmpty();
      await expect(citation.locator("[data-citation-date]")).toHaveAttribute(
        "datetime",
        /^\d{4}-\d{2}-\d{2}$/u,
      );
      await expect(citation.locator("[data-citation-url]")).toContainText(
        /^https:\/\/www\.nba\.com\//u,
      );
      await expect(citation.locator("a")).toHaveCount(0);
    }
  });

  test("photo-use deep links and complete central credits work without JavaScript", async ({
    page,
  }) => {
    await page.goto("/cases/kevin-durant-achilles-rupture-2019/");
    const creditLink = page.locator("[data-asset-credit-link]").first();
    await expect(creditLink).toBeVisible();
    await expect(creditLink).toHaveAttribute(
      "href",
      "/credits-notices/#photo-credit-1235995897",
    );

    await creditLink.click();
    await expect(page).toHaveURL(
      /\/credits-notices\/#photo-credit-1235995897$/u,
    );
    const target = page.locator("#photo-credit-1235995897");
    await expect(target).toBeVisible();
    await expect(target).toHaveAttribute("data-athlete-name", "Kevin Durant");
    const [headerBox, targetBox] = await Promise.all([
      page.locator(".site-header").boundingBox(),
      target.boundingBox(),
    ]);
    expect(headerBox).not.toBeNull();
    expect(targetBox).not.toBeNull();
    expect(targetBox!.y).toBeGreaterThanOrEqual(
      headerBox!.y + headerBox!.height,
    );
    await expect(
      target.locator('[data-credit-field="work-title"]'),
    ).toHaveAttribute("data-work-title-status", "not-supplied");
    await expect(page.locator("[data-asset-credit-row]")).toHaveCount(7);

    await page.goto("/cases/damian-lillard-achilles-rupture-2025/");
    const newCreditLink = page
      .locator(
        '[data-editorial-case-cover][data-player-photo="Damian Lillard"]',
      )
      .locator("[data-asset-credit-link]");
    await expect(newCreditLink).toHaveAttribute(
      "href",
      "/credits-notices/#photo-credit-1195923850",
    );
    await newCreditLink.click();
    await expect(page).toHaveURL(
      /\/credits-notices\/#photo-credit-1195923850$/u,
    );
    const newTarget = page.locator("#photo-credit-1195923850");
    await expect(newTarget).toHaveAttribute(
      "data-athlete-name",
      "Damian Lillard",
    );
    await expect(newTarget).toContainText(
      "Damian Lillard 於 2014 年芝加哥 63rd Street Beach 世界籃球節公開舞台；非本案例受傷當下影像",
    );
  });

  test("video states degrade to a source link or governed plain-text citation", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");

    // No YouTube iframe can exist without JavaScript.
    await expect(page.locator("iframe")).toHaveCount(0);

    // The YouTube video keeps a normal canonical source anchor.
    const sourceAnchors = page.locator("[data-video-source-link]");
    expect(await sourceAnchors.count()).toBeGreaterThan(0);
    for (const href of await sourceAnchors.evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href")),
    )) {
      expect(href).toMatch(/^https:\/\//);
    }

    // The NBA-host fixture preserves all citation facts without a link.
    const nba = page.locator("[data-video-external]");
    await expect(nba).toHaveCount(1);
    await expect(nba.locator("[data-video-source-link]")).toHaveCount(0);
    await expect(nba.locator('a[href*="nba.com"]')).toHaveCount(0);
    const citation = nba.locator("[data-video-source-citation]");
    await expect(citation).toContainText(
      "虛構官方平台片段（Fictional official platform clip）",
    );
    await expect(citation).toContainText(
      "虛構官方轉播單位（Fictional Broadcast Unit）",
    );
    await expect(citation).toContainText("2026-01-21");
    await expect(citation).toContainText(
      "https://www.nba.com/watch/fictional-demo-clip-beta",
    );
  });

  test("fixture league listing and update page render without JavaScript", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/league-listing/");
    await expect(
      page.locator("[data-static-listing] li").first(),
    ).toBeVisible();

    await page.goto("/review/fixtures/latest-update/");
    await expect(
      page.locator('[data-atlas-view="quarterly-update"]'),
    ).toBeVisible();
    await expect(page.locator("[data-latest-update-link]")).toBeVisible();
  });
});
