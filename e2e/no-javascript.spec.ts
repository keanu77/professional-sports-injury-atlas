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

  test("video click-to-load and external states degrade to plain links", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");

    // No YouTube iframe can exist without JavaScript.
    await expect(page.locator("iframe")).toHaveCount(0);

    // Every rendered video block keeps a normal canonical source anchor.
    const sourceAnchors = page.locator("[data-video-source-link]");
    expect(await sourceAnchors.count()).toBeGreaterThan(0);
    for (const href of await sourceAnchors.evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href")),
    )) {
      expect(href).toMatch(/^https:\/\//);
    }

    // The registered NBA-host fixture renders external-link-only UI.
    await expect(page.locator("[data-video-external]")).toHaveCount(1);
    await expect(
      page.locator("[data-video-external] [data-video-source-link]"),
    ).toContainText("外部連結");
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
