import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
const origin = process.argv[2];
if (
  !/^https:\/\/[a-z0-9-]+\.sports-injury-atlas\.pages\.dev$/.test(origin ?? "")
)
  throw Error("An owned HTTPS preview origin is required");
const dir = path.dirname(fileURLToPath(import.meta.url));
const all = JSON.parse(
  fs.readFileSync(path.join(dir, "playback-refresh-manifest.json"), "utf8"),
);
const filter = process.argv[3];
const selected =
  filter === "--sample"
    ? all.slice(0, 3)
    : filter
      ? all.filter((x) => x.path.includes(filter))
      : all;
const output = path.join(
  dir,
  filter === "--sample"
    ? "playback-sample.json"
    : filter
      ? "playback-retry.json"
      : "playback-all.json",
);
const cases = fs
  .readdirSync("src/content/cases")
  .filter((x) => x.endsWith(".json"))
  .map((x) => JSON.parse(fs.readFileSync("src/content/cases/" + x, "utf8")));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = filter
  ? []
  : fs.existsSync(output)
    ? JSON.parse(fs.readFileSync(output, "utf8")).filter(
        (r) => r.status === "played",
      )
    : [];
const items = selected.filter((x) => !results.some((r) => r.url === x.url));
const started = Date.now();
const save = () =>
  fs.writeFileSync(output, JSON.stringify(results, null, 2) + "\n");
async function verify(item) {
  const began = Date.now();
  const context = await browser.newContext({
    locale: "zh-TW",
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  const result = {
    url: item.url,
    path: item.path,
    origin,
    startSeconds: item.startSeconds,
    checkedAt: new Date().toISOString(),
    status: "unverified",
    telemetry: "POST /api/plays intercepted; media requests unmodified",
  };
  if (item.captionRequired)
    result.caseId = cases.find((c) => item.path === `/cases/${c.slug}/`)?.id;
  let frame;
  try {
    await page.route("**/api/plays", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 202,
            contentType: "application/json",
            body: '{"recorded":false}',
          })
        : route.continue(),
    );
    const response = await page.goto(origin + item.path, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (response.status() !== 200)
      throw Error(`Page HTTP ${response.status()}`);
    if (await page.locator("iframe").count())
      throw Error("iframe before activation");
    await page.locator("[data-video-load]").click({ timeout: 15000 });
    const iframe = page.locator("[data-video-stage] iframe");
    await iframe.waitFor({ state: "attached", timeout: 10000 });
    const src = await iframe.getAttribute("src");
    result.embedUrl = src;
    if (item.provider === "youtube") {
      const expected = new URL(item.url).searchParams.get("v");
      if (new URL(src).pathname !== `/embed/${expected}`)
        throw Error("Wrong video loaded");
      if (
        item.startSeconds &&
        new URL(src).searchParams.get("start") !== String(item.startSeconds)
      )
        throw Error("Wrong timecode");
    } else if (!src.includes("/m/zack-kelly-leaves-with-injury"))
      throw Error("Wrong MLB embed");
    frame = await iframe.elementHandle().then((h) => h.contentFrame());
    await frame
      .locator("video")
      .first()
      .waitFor({ state: "attached", timeout: 20000 });
    const video = frame.locator("video").first();
    result.before = await video.evaluate((v) => ({
      time: v.currentTime,
      paused: v.paused,
      readyState: v.readyState,
    }));
    if (result.before.paused) {
      const names = await frame
        .getByRole("button")
        .evaluateAll((bs) =>
          bs
            .filter((b) => b.getBoundingClientRect().width > 0)
            .map((b) => b.getAttribute("aria-label") ?? b.textContent),
        );
      result.playControls = names;
      const name = names.find((n) =>
        /^(播放影片|Play video|Play|播放)$/i.test(n?.trim() ?? ""),
      );
      if (item.provider === "youtube")
        await frame
          .getByRole("button", { name: /^(播放影片|Play video)$/i })
          .first()
          .click({ timeout: 12000 });
      else if (item.provider === "mlb")
        await frame.locator("#play-overlay").click({ timeout: 12000 });
      else if (name)
        await frame
          .getByRole("button", { name, exact: true })
          .first()
          .click({ timeout: 12000 });
      else await video.click({ timeout: 10000 });
    }
    await frame.waitForFunction(
      (start) => {
        const v = document.querySelector("video");
        return v && !v.paused && v.currentTime > start + 1 && v.readyState >= 3;
      },
      Math.max(item.startSeconds, result.before.time),
      { timeout: 25000 },
    );
    result.after = await video.evaluate((v) => ({
      time: v.currentTime,
      paused: v.paused,
      readyState: v.readyState,
    }));
    result.captionControls = await frame
      .locator("button")
      .evaluateAll((bs) =>
        bs
          .map((b) => b.getAttribute("aria-label"))
          .filter((s) => /字幕|caption|subtitle/i.test(s ?? "")),
      );
    if (item.captionRequired) {
      const cc = frame
        .getByRole("button", { name: /字幕|caption|subtitle/i })
        .first();
      const label = await cc.getAttribute("aria-label", { timeout: 8000 });
      if (!/字幕\/CC 已開啟|Turn off subtitles/i.test(label ?? ""))
        await cc.click({ timeout: 5000 });
      await frame.waitForFunction(
        () =>
          [...document.querySelectorAll("button")].some((b) =>
            /字幕\/CC 已開啟|Turn off subtitles/i.test(
              b.getAttribute("aria-label") ?? "",
            ),
          ),
        null,
        { timeout: 8000 },
      );
      result.captionToggleAfter = await cc.getAttribute("aria-label");
    }
    result.status = "played";
  } catch (e) {
    result.error = e.message.slice(0, 650);
    result.pageStatus = await page
      .locator("[data-video-status]")
      .allTextContents()
      .catch(() => []);
    result.frameText = await frame
      ?.locator("body")
      .innerText({ timeout: 2000 })
      .catch(() => undefined);
    await page
      .screenshot({
        path: path.join(
          dir,
          `failed-${item.path.split("/").filter(Boolean).at(-1)}.png`,
        ),
      })
      .catch(() => {});
  } finally {
    result.elapsedSeconds = (Date.now() - began) / 1000;
    results.push(result);
    save();
    console.log(
      JSON.stringify({
        done: results.length,
        total: items.length,
        path: item.path,
        status: result.status,
        seconds: result.elapsedSeconds,
        error: result.error,
      }),
    );
    await context.close();
  }
}
try {
  let index = 0;
  const workers = filter === "--sample" ? 1 : 4;
  await Promise.all(
    Array.from({ length: Math.min(workers, items.length) }, async () => {
      while (index < items.length) {
        const item = items[index++];
        await verify(item);
      }
    }),
  );
} finally {
  save();
  await browser.close();
}
console.log(
  JSON.stringify({
    total: results.length,
    played: results.filter((x) => x.status === "played").length,
    seconds: (Date.now() - started) / 1000,
    output,
  }),
);
if (results.some((x) => x.status !== "played")) process.exitCode = 1;
