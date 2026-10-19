/**
 * No-JavaScript spec. With scripts disabled, the static pages and the
 * data-bearing fixture routes stay completely readable: the professional
 * notes, real source anchors, video external/failure states, record IDs and
 * digests, static listing pagination, and the documented degradation notice
 * for advanced filtering.
 */

import { expect, test } from "@playwright/test";

const REMOVED_READER_LABEL = ["一般讀者", "筆記"].join("");
const REMOVED_LAYER_BLOCK = `[${["data", "layered", "notes"].join("-")}]`;
const REMOVED_LAYER_ATTRIBUTE = `[${["data", "layer"].join("-")}]`;
const REMOVED_LAYER_BUTTON = `[${["data", "layer", "button"].join("-")}]`;

test.use({ javaScriptEnabled: false });

test.describe("no-javascript readability", () => {
  test("home and injury pages stay readable without JavaScript", async ({
    page,
  }) => {
    await page.goto("/");
    const catalog = page.locator("[data-discovery-grid]");
    await expect(catalog).toBeVisible();
    const cards = catalog.locator("[data-discovery-slug]");
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.last()).toBeVisible();
    await expect(catalog.locator("[data-discovery-slug][hidden]")).toHaveCount(
      0,
    );
    await expect(page.locator("[data-video-search]")).toBeHidden();
    await expect(page.locator("[data-discovery-pagination]")).toBeHidden();
    await expect(page.locator("[data-injury-card]")).toHaveCount(0);
    await expect(page.locator("iframe")).toHaveCount(0);
    const detailLink = cards.first().locator("h3 a");
    await expect(detailLink).toHaveAttribute("href", /^\/(?:cases|videos)\//u);

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

  test("category catalogues expose every static card without search scripts", async ({
    page,
  }) => {
    test.skip(
      process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21",
      "Public catalogue only",
    );
    for (const path of [
      "/body-parts/knee/",
      "/sports/baseball/",
      "/situations/ball-impact/",
      "/video-types/injury-moment/",
    ]) {
      await page.goto(path);
      const cards = page.locator("[data-discovery-slug]");
      expect(await cards.count()).toBeGreaterThan(0);
      await expect(cards.last()).toBeVisible();
      await expect(page.locator("[data-discovery-slug][hidden]")).toHaveCount(
        0,
      );
      await expect(page.locator("[data-video-search]")).toBeHidden();
      await expect(
        page.getByRole("link", { name: /← 全部影片/u }),
      ).toBeVisible();
    }
  });

  test("fixture case detail keeps the single complete professional-note view readable", async ({
    page,
  }) => {
    await page.goto("/review/fixtures/case-detail/");

    const professional = page.locator("[data-professional-notes]");
    await expect(professional).toHaveCount(1);
    await expect(professional).toBeVisible();
    await expect(professional.locator(":scope > h3")).toHaveText("專業筆記");
    await expect(professional.locator("h4")).toHaveText([
      "機轉分析（觀察性）",
      "臨床限制",
      "鑑別脈絡",
      "治療與回場意涵",
    ]);
    await expect(professional).toContainText("機轉分析（觀察性）");
    await expect(
      page.getByText(REMOVED_READER_LABEL, { exact: true }),
    ).toHaveCount(0);
    await expect(page.locator(REMOVED_LAYER_BLOCK)).toHaveCount(0);
    await expect(page.locator(REMOVED_LAYER_ATTRIBUTE)).toHaveCount(0);
    await expect(page.locator(REMOVED_LAYER_BUTTON)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /筆記/u })).toHaveCount(0);
  });

  test("source links, IDs, and digests render without JavaScript", async ({
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

    await expect(page.locator("[data-video-timeline]")).toHaveCount(0);

    // The native disclosure starts closed and opens without JavaScript.
    const disclosure = page.locator("details[data-review-digests]");
    const summary = disclosure.locator("summary");
    await expect(disclosure).not.toHaveAttribute("open", "");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(disclosure).toHaveAttribute("open", "");

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
    await expect(page.locator(".digest-field").first()).toBeVisible();
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
    await expect(page.locator("[data-asset-credit-row]")).toHaveCount(21);

    await page.goto("/cases/damian-lillard-achilles-rupture-2025/");
    const newCreditLink = page
      .locator(
        '.case-video [data-cover-presentation="facade"][data-player-photo="Damian Lillard"]',
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

    await page.goto("/cases/dejounte-murray-achilles-rupture-2025/");
    const publicDomainCreditLink = page
      .locator(
        '.case-video [data-cover-presentation="facade"][data-player-photo="Dejounte Murray"]',
      )
      .locator("[data-asset-credit-link]");
    await expect(publicDomainCreditLink).toHaveAttribute(
      "href",
      "/credits-notices/#photo-credit-1199576196",
    );
    await publicDomainCreditLink.click();
    await expect(page).toHaveURL(
      /\/credits-notices\/#photo-credit-1199576196$/u,
    );
    const publicDomainTarget = page.locator("#photo-credit-1199576196");
    await expect(publicDomainTarget).toHaveAttribute(
      "data-athlete-name",
      "Dejounte Murray",
    );
    await expect(publicDomainTarget).toHaveAttribute(
      "data-license-bucket",
      "public-domain",
    );
    await expect(
      publicDomainTarget.locator('[data-credit-field="license"]'),
    ).toContainText("PD-USGov-Military-Navy");
    await expect(publicDomainTarget).toContainText(
      "U.S. Navy photo by Mass Communication Specialist 2nd Class Shayla D. Hamilton/Released",
    );
    await expect(
      publicDomainTarget.locator(
        'a[href^="https://creativecommons.org/licenses/"], a[href*="creativecommons.org/publicdomain/zero"]',
      ),
    ).toHaveCount(0);
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
