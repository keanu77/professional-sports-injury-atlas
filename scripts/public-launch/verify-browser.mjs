import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const origin = process.argv[2] ?? "http://127.0.0.1:14322";
const receipt = JSON.parse(
  fs.readFileSync("artifacts/public-launch-receipt.v1.json", "utf8"),
);
const updates = JSON.parse(
  fs.readFileSync("src/data/videos/event-updates.v1.json", "utf8"),
);
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
      ...receipt.cases.map((record) => `/cases/${record.slug}/`),
      ...(receipt.clips ?? []).map((clip) => `/videos/${clip.slug}/`),
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
      const covers = page.locator("[data-video-thumbnail]");
      const part = receipt.bodyParts.find(
        (p) => path === `/body-parts/${p.code}/`,
      );
      if (path === "/" || part) {
        assert.equal(
          await covers.count(),
          part ? part.count : receipt.cases.length + receipt.clips.length,
        );
        const nav = page.locator("[data-body-part-nav]");
        assert.deepEqual(
          await nav
            .locator("a")
            .evaluateAll((links) => links.map((a) => a.getAttribute("href"))),
          receipt.bodyParts.map((p) => `/body-parts/${p.code}/`),
        );
        if (part) {
          assert.equal(
            await nav.locator('[aria-current="page"]').getAttribute("href"),
            path,
          );
          assert.deepEqual(
            (
              await page
                .locator("[data-body-part-videos] [data-featured-card] a")
                .evaluateAll((links) => [
                  ...new Set(links.map((a) => a.getAttribute("href"))),
                ])
            ).sort(),
            [...part.paths].sort(),
          );
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
        await report.locator("summary").click();
        assert.equal(await report.locator("li").count(), update.sources.length);
        assert.equal(await report.locator('a[href*="nba.com"]').count(), 0);
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
        assert.ok(
          (await page.locator('main a[href^="/injuries/"]').count()) > 0,
        );
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
        1,
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
  await page.locator("[data-body-part-nav] a").first().click();
  assert.ok(await page.locator("[data-body-part-videos]").isVisible());
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
