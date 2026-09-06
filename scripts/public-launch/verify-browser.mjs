import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const origin = process.argv[2] ?? "http://127.0.0.1:14322";
const receipt = JSON.parse(
  fs.readFileSync("artifacts/public-launch-receipt.v1.json", "utf8"),
);
assert.ok(receipt.sports?.length, "Missing sport classification receipt");
const videoPaths = [
  ...receipt.cases.map((record) => `/cases/${record.slug}/`),
  ...(receipt.clips ?? []).map((clip) => `/videos/${clip.slug}/`),
];
assert.deepEqual(
  receipt.sports.flatMap((sport) => sport.paths).sort(),
  [...videoPaths].sort(),
  "Each video must appear in exactly one sport",
);
for (const sport of receipt.sports)
  assert.equal(sport.count, sport.paths.length, `Sport count: ${sport.code}`);
const updates = JSON.parse(
  fs.readFileSync("src/data/videos/event-updates.v1.json", "utf8"),
);
updates.entries.push(
  ...JSON.parse(
    fs.readFileSync("src/data/videos/event-additions.v1.json", "utf8"),
  ).entries,
);
updates.entries.push(
  ...JSON.parse(
    fs.readFileSync("src/data/videos/event-batch-30.v1.json", "utf8"),
  ).entries,
);
const batch30 = JSON.parse(
  fs.readFileSync("src/data/videos/batch-30.v1.json", "utf8"),
);
updates.entries.push(
  ...JSON.parse(
    fs.readFileSync("src/data/videos/event-batch-31.v1.json", "utf8"),
  ).entries,
);
const batch31 = JSON.parse(
  fs.readFileSync("src/data/videos/batch-31.v1.json", "utf8"),
);
updates.entries.push(
  ...JSON.parse(
    fs.readFileSync("src/data/videos/event-batch-32.v1.json", "utf8"),
  ).entries,
);
const batch32 = JSON.parse(
  fs.readFileSync("src/data/videos/batch-32.v1.json", "utf8"),
);
const curation = JSON.parse(
  fs.readFileSync("src/data/videos/curation.v1.json", "utf8"),
);
for (const slug of curation.removedSlugs)
  assert.equal(
    (await fetch(`${origin}/videos/${slug}/`)).status,
    404,
    `Removed video still served: ${slug}`,
  );
const policyPages = {
  "/source-policy/": "影片來源與資料查核",
  "/credits-notices/": "影片與圖片使用說明",
  "/privacy/": "隱私與播放設定",
  "/about/": "認識影片圖鑑",
};
const live = origin.startsWith("https:");
let matchedPages = 0;
for (const file of receipt.files.filter(
  (file) =>
    file.path.endsWith(".html") ||
    file.path.endsWith(".json") ||
    file.path === "robots.txt",
)) {
  const path =
    file.path === "404.html"
      ? "/404.html"
      : "/" + file.path.replace(/index\.html$/, "");
  const response = await fetch(origin + path);
  assert.ok(
    response.ok || (path === "/404.html" && response.status === 404),
    `HTTP ${response.status}: ${path}`,
  );
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    file.digest,
    `Served bytes differ: ${path}`,
  );
  if (live)
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  matchedPages++;
}
assert.equal(
  (await fetch(origin + "/review/fixtures/case-detail/")).status,
  404,
);
assert.equal(
  (await fetch(origin + "/a-page-that-does-not-exist/")).status,
  404,
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const viewport of [
    { width: 320, height: 780 },
    { width: 390, height: 844 },
    { width: 1440, height: 1000 },
  ]) {
    const context = await browser.newContext({ viewport, locale: "zh-TW" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    const external = [];
    page.on("request", (request) => {
      if (!request.url().startsWith(origin)) external.push(request.url());
    });
    for (const path of [
      "/",
      ...receipt.bodyParts.map((part) => `/body-parts/${part.code}/`),
      ...receipt.sports.map((sport) => `/sports/${sport.code}/`),
      ...videoPaths,
      ...Object.keys(policyPages),
    ]) {
      await page.goto(origin + path, { waitUntil: "networkidle" });
      if (viewport.width === 320)
        await page.evaluate(
          () => (document.documentElement.style.fontSize = "150%"),
        );
      assert.equal(await page.locator("iframe").count(), 0);
      assert.equal(await page.getByRole("searchbox").count(), 0);
      assert.equal(await page.getByRole("combobox").count(), 0);
      assert.ok(
        await page
          .getByRole("link", { name: "返回吳易澄醫師網站", exact: true })
          .isVisible(),
      );
      assert.equal(
        await page.locator('.site-nav a[href^="/injuries/"]').count(),
        0,
      );
      for (const [href, title] of Object.entries(policyPages))
        assert.ok(
          await page
            .locator(`footer a[href="${href}"]`)
            .filter({ hasText: title })
            .isVisible(),
        );
      assert.ok(
        !(await page.locator("footer").innerText()).includes("照片署名"),
      );
      const covers = page.locator("[data-video-thumbnail]");
      const part = receipt.bodyParts.find(
        (p) => path === `/body-parts/${p.code}/`,
      );
      const sport = receipt.sports.find((s) => path === `/sports/${s.code}/`);
      const group = part ?? sport;
      if (path === "/" || group) {
        assert.equal(
          await covers.count(),
          group ? group.count : videoPaths.length,
        );
        for (const [kind, groups, current] of [
          ["body-part", receipt.bodyParts, part],
          ["sport", receipt.sports, sport],
        ]) {
          if (path !== "/" && !current) continue;
          const nav = page.locator(`[data-${kind}-nav]`);
          const route = kind === "sport" ? "sports" : "body-parts";
          assert.deepEqual(
            await nav
              .locator("a")
              .evaluateAll((links) => links.map((a) => a.getAttribute("href"))),
            groups.map((item) => `/${route}/${item.code}/`),
            `Classification navigation: ${path}`,
          );
          assert.equal(
            await nav.locator('[aria-current="page"]').count(),
            current ? 1 : 0,
          );
          if (current)
            assert.equal(
              await nav.locator('[aria-current="page"]').getAttribute("href"),
              path,
            );
          for (const item of groups) {
            const link = nav.locator(`a[href="/${route}/${item.code}/"]`);
            assert.ok((await link.innerText()).includes(item.label));
            assert.equal(
              await link.locator("span").innerText(),
              `${item.count} 支影片`,
            );
          }
        }
        const cards = page.locator(
          path === "/"
            ? "[data-featured-videos] [data-featured-card]"
            : `[data-${sport ? "sport" : "body-part"}-videos] [data-featured-card]`,
        );
        assert.equal(
          await cards.count(),
          group ? group.count : videoPaths.length,
        );
        assert.deepEqual(
          (
            await cards.evaluateAll((items) =>
              items.map((item) =>
                item.querySelector("a")?.getAttribute("href"),
              ),
            )
          ).sort(),
          [...(group ? group.paths : videoPaths)].sort(),
          `Classification video membership: ${path}`,
        );
      } else if (policyPages[path]) {
        assert.equal(await page.locator("h1").innerText(), policyPages[path]);
        if (path === "/credits-notices/") {
          const historical = page.locator("details.historical-credits");
          assert.equal(await historical.count(), 1);
          await historical.locator("summary").click();
          assert.ok(await page.locator("#photo-credits-heading").isVisible());
        }
      } else {
        assert.equal(
          await page
            .locator("[data-video-facade] [data-video-thumbnail]")
            .count(),
          1,
        );
        assert.equal(await page.locator("[data-video-load]").count(), 1);
        const update = updates.entries.find((e) =>
          path.endsWith(`/${e.slug}/`),
        );
        assert.ok(update, `Missing update binding: ${path}`);
        const report = page.locator(`[data-event-follow-up="${update.slug}"]`);
        assert.ok(await report.isVisible());
        assert.ok((await report.innerText()).includes(update.injury));
        assert.ok((await report.innerText()).includes(update.returnSummary));
        const headClip = [
          ...curation.clips,
          ...batch30.clips,
          ...batch31.clips,
          ...batch32.clips,
        ].find((c) => c.slug === update.slug && c.bodyPart === "頭頸部");
        if (headClip) {
          const care = page.locator("[data-head-injury-care]");
          assert.ok(await care.isVisible());
          assert.ok((await care.innerText()).includes("不得當天回場"));
          assert.equal(
            await care
              .locator(
                'a[href="https://www.cdc.gov/heads-up/response/index.html"]',
              )
              .count(),
            1,
          );
        }

        await report.locator("summary").click();
        assert.equal(await report.locator("li").count(), update.sources.length);
        const nbaLinks = await report.locator("a[href]").evaluateAll(
          (links) =>
            links.filter((link) => {
              const host = new URL(link.href).hostname;
              return host === "nba.com" || host.endsWith(".nba.com");
            }).length,
        );
        assert.equal(nbaLinks, 0);
      }
      for (const cover of await covers.all()) {
        await cover.scrollIntoViewIfNeeded();
        await cover.locator("img").evaluate((img) => img.decode());
        assert.ok(
          await cover.locator("img").evaluate((img) => img.naturalWidth >= 320),
        );
      }
      await page.evaluate(() => scrollTo(0, 0));
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `Overflow: ${path}`,
      );
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        axe.violations.map((v) => v.id),
        [],
        `Accessibility: ${path}`,
      );
      if (path === "/") {
        for (const [key, count] of Object.entries({
          "body-parts": receipt.bodyParts.length,
          videos: videoPaths.length,
          sports: receipt.sports.length,
        }))
          assert.equal(
            await page.locator(`[data-atlas-stat="${key}"]`).innerText(),
            String(count),
          );
        assert.equal(await page.locator(".more-cases").count(), 0);
        assert.equal(
          await page.locator("[data-featured-card]:visible").count(),
          receipt.cases.length + (receipt.clips ?? []).length,
        );
        assert.equal(await page.getByRole("searchbox").count(), 0);
        assert.equal(await page.getByRole("combobox").count(), 0);
        assert.equal(
          await page
            .getByRole("heading", { name: "先看影片", exact: true })
            .count(),
          0,
        );
        assert.equal(await page.locator("#videos-heading").count(), 1);
        await page.screenshot({
          path: `/tmp/atlas-public-${viewport.width}.png`,
          fullPage: true,
        });
      }
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(external, [], "Third-party requests before activation");
    results.push({
      viewport,
      pages:
        receipt.cases.length +
        (receipt.clips ?? []).length +
        receipt.bodyParts.length +
        receipt.sports.length +
        1 +
        Object.keys(policyPages).length,
      accessibility: "passed",
      externalBeforeActivation: 0,
    });
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${origin}/cases/${receipt.cases[0].slug}/`);
  assert.ok(
    await page
      .getByRole("heading", { name: "先做這幾件事", exact: true })
      .isVisible(),
  );
  assert.equal(await page.locator("[data-video-load]:visible").count(), 0);
  assert.ok(await page.locator("[data-video-source-link]").isVisible());
  await page.goto(origin + "/");
  assert.equal(
    await page.locator('[data-atlas-stat="videos"]').innerText(),
    String(videoPaths.length),
  );
  await page.locator("[data-body-part-nav] a").first().click();
  assert.ok(await page.locator("[data-body-part-videos]").isVisible());
  for (const sport of receipt.sports) {
    await page.goto(origin + "/");
    await page
      .locator(`[data-sport-nav] a[href="/sports/${sport.code}/"]`)
      .click();
    assert.equal(new URL(page.url()).pathname, `/sports/${sport.code}/`);
    assert.ok(
      await page.locator(`[data-sport-videos="${sport.code}"]`).isVisible(),
    );
    await page.locator('a[href="/#sports"]').click();
    assert.equal(new URL(page.url()).hash, "#sports");
    assert.ok(await page.locator("[data-sport-nav]").isVisible());
  }
  for (const [path, title] of Object.entries(policyPages)) {
    await page.goto(origin + "/");
    await page.locator(`footer a[href="${path}"]`).click();
    assert.equal(await page.locator("h1").innerText(), title);
  }
  await context.close();
  const result = {
    checkedAt: new Date().toISOString(),
    origin,
    commit: receipt.commit,
    matchedPages,
    noJavaScript: "passed",
    results,
  };
  fs.writeFileSync(
    "/tmp/atlas-public-browser.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
