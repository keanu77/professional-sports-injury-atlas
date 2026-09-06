import fs from "node:fs";
import { chromium } from "@playwright/test";
const expansion = JSON.parse(
  fs.readFileSync("src/data/videos/expansion.v1.json", "utf8"),
);
const additions = JSON.parse(
  fs.readFileSync("src/data/videos/additions.v1.json", "utf8"),
);
const curation = JSON.parse(
  fs.readFileSync("src/data/videos/curation.v1.json", "utf8"),
);
const batch30 = JSON.parse(
  fs.readFileSync("src/data/videos/batch-30.v1.json", "utf8"),
);
const origin = process.argv[2] ?? "http://127.0.0.1:14324";
const batch31 = JSON.parse(
  fs.readFileSync("src/data/videos/batch-31.v1.json", "utf8"),
);
const batch32 = JSON.parse(
  fs.readFileSync("src/data/videos/batch-32.v1.json", "utf8"),
);
const output = process.argv[3] ?? "/tmp/atlas23-playback.json";
const allItems = [
  ...expansion.cases.map((c) => ({
    ...c,
    path: `/cases/${c.slug}/`,
    startSeconds: 0,
  })),
  ...[
    ...expansion.clips,
    ...additions.clips,
    ...curation.clips,
    ...batch30.clips,
    ...batch31.clips,
    ...batch32.clips,
  ]
    .filter((c) => !curation.removedSlugs.includes(c.slug))
    .map((c) => ({
      ...c,
      path: `/videos/${c.slug}/`,
    })),
];
const items = process.argv[4]
  ? allItems.filter((item) =>
      process.argv[4] === "--batch-32"
        ? batch32.clips.some((c) => c.slug === item.slug)
        : process.argv[4] === "--batch-31"
          ? batch31.clips.some((c) => c.slug === item.slug)
          : process.argv[4] === "--batch-30"
            ? batch30.clips.some((c) => c.slug === item.slug)
            : process.argv[4] === "--curation"
              ? curation.clips.some((c) => c.slug === item.slug)
              : process.argv[4] === "--additions"
                ? additions.clips.some((c) => c.slug === item.slug)
                : item.slug === process.argv[4],
    )
  : allItems;
if (items.length === 0) throw new Error("Unknown video slug");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const item of items) {
    const page = await browser.newPage({ locale: "zh-TW" });
    const result = {
      url: item.videoUrl,
      path: item.path,
      startSeconds: item.startSeconds,
      origin,
      checkedAt: new Date().toISOString(),
      status: "unverified",
    };
    try {
      await page.goto(origin + item.path, {
        waitUntil: "networkidle",
        timeout: 20000,
      });
      if (await page.locator("iframe").count())
        throw new Error("iframe before activation");
      await page.locator("[data-video-load]").click();
      const frameLocator = page.frameLocator('iframe[src*="youtube-nocookie"]');
      await frameLocator
        .locator("video")
        .waitFor({ state: "attached", timeout: 15000 });
      const frame = page
        .frames()
        .find((f) => f.url().includes("youtube-nocookie.com/embed/"));
      const id = new URL(item.videoUrl).searchParams.get("v");
      if (!frame.url().includes(`/embed/${id}?`))
        throw new Error("Wrong video loaded");
      if (
        item.startSeconds &&
        new URL(frame.url()).searchParams.get("start") !==
          String(item.startSeconds)
      )
        throw new Error("Wrong timecode");
      result.before = await frame.locator("video").evaluate((v) => ({
        time: v.currentTime,
        paused: v.paused,
        readyState: v.readyState,
      }));
      await frameLocator
        .getByRole("button", { name: "播放影片", exact: true })
        .click({ timeout: 12000 });
      await frame.waitForFunction(
        (start) => {
          const v = document.querySelector("video");
          return (
            v && !v.paused && v.currentTime > start + 1 && v.readyState >= 3
          );
        },
        Math.max(item.startSeconds, result.before.time),
        { timeout: 20000 },
      );
      result.after = await frame.locator("video").evaluate((v) => ({
        time: v.currentTime,
        paused: v.paused,
        readyState: v.readyState,
      }));
      result.captionControls = await frame
        .locator("button")
        .evaluateAll((bs) =>
          bs
            .map((b) => b.getAttribute("aria-label"))
            .filter((label) => /字幕|caption|subtitle/i.test(label ?? "")),
        );
      result.status = "played";
    } catch (e) {
      result.error = String(e.message).slice(0, 300);
    }
    results.push(result);
    console.log(JSON.stringify(result));
    await page.close();
  }
} finally {
  await browser.close();
  fs.writeFileSync(output, JSON.stringify(results, null, 2) + "\n");
}
if (
  results.length !== items.length ||
  results.some((r) => r.status !== "played" || r.error)
)
  process.exitCode = 1;
