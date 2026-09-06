import fs from "node:fs";
import { chromium } from "@playwright/test";
const cases = fs
  .readdirSync("src/content/cases")
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync("src/content/cases/" + f)))
  .filter(
    (x) =>
      x.video.provider === "youtube" &&
      x.video.embedStatus === "verified" &&
      x.video.captionStatus === "available",
  );
const origin = process.argv[2] ?? "http://127.0.0.1:14322";
const output = process.argv[3] ?? "/tmp/atlas-live-playback.json";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
for (const record of cases) {
  const page = await browser.newPage({ locale: "zh-TW" });
  const result = {
    caseId: record.id,
    url: record.video.canonicalUrl,
    checkedAt: new Date().toISOString(),
    status: "unverified",
  };
  try {
    await page.goto(new URL("/cases/" + record.slug + "/", origin).href, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.locator("[data-video-load]").click({ timeout: 8000 });
    const iframe = page.frameLocator('iframe[src*="youtube-nocookie"]');
    await iframe.locator("video").waitFor({ timeout: 15000 });
    const frame = page
      .frames()
      .find((f) => f.url().includes("youtube-nocookie.com/embed/"));
    result.title = await frame.title();
    const before = await frame.locator("video").evaluate((v) => ({
      time: v.currentTime,
      paused: v.paused,
      readyState: v.readyState,
    }));
    result.before = before;
    await iframe
      .getByRole("button", { name: "播放影片", exact: true })
      .click({ timeout: 10000 });
    await frame.waitForFunction(
      () => {
        const v = document.querySelector("video");
        return v && !v.paused && v.currentTime > 1;
      },
      {},
      { timeout: 12000 },
    );
    result.after = await frame.locator("video").evaluate((v) => ({
      time: v.currentTime,
      paused: v.paused,
      readyState: v.readyState,
      tracks: [...v.textTracks].map((t) => ({
        language: t.language,
        label: t.label,
      })),
    }));
    result.status = "played";
    const cc = frame
      .getByRole("button", {
        name: /字幕\/CC 已關閉|Subtitles\/closed captions/i,
      })
      .first();
    const ccHandle = await cc.elementHandle({ timeout: 5000 });
    if (!ccHandle) throw new Error("Caption control missing");
    await ccHandle.click({ timeout: 5000 });
    await frame.waitForFunction(
      (button) => /已開啟|on/i.test(button.getAttribute("aria-label") ?? ""),
      ccHandle,
      { timeout: 5000 },
    );
    result.captionToggleAfter = await ccHandle.getAttribute("aria-label");
    result.captionControls = await frame.locator("button").evaluateAll((bs) =>
      bs
        .map((b) => ({
          label: b.getAttribute("aria-label"),
          title: b.getAttribute("title"),
          disabled: b.getAttribute("aria-disabled"),
        }))
        .filter((b) =>
          /字幕|caption|subtitle/i.test(
            (b.label || "") + " " + (b.title || ""),
          ),
        ),
    );
  } catch (e) {
    result.error = String(e.message).slice(0, 250);
  }
  results.push(result);
  console.log(JSON.stringify(result));
  await page.close();
}
await browser.close();
fs.writeFileSync(output, JSON.stringify(results, null, 2) + "\n");

if (results.some((r) => r.status !== "played" || r.error)) process.exitCode = 1;
