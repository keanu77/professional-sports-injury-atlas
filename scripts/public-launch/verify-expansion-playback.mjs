import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";
import { tsImport } from "tsx/esm/api";

const { loadPublicVideoInventory } = await tsImport(
  "../lib/public-video-inventory.ts",
  import.meta.url,
);
const { publicInventoryDigest } = await tsImport(
  "../../src/lib/videos/public-inventory.ts",
  import.meta.url,
);
const { observationEmbedFor } = await tsImport(
  "../../src/lib/videos/observation-provider.ts",
  import.meta.url,
);
const { assertPlaybackSourceInputsUnchanged } = await tsImport(
  "./current-playback.ts",
  import.meta.url,
);
const { ownedPlaybackOrigin, selectCurrentPlaybackEvidence } = await tsImport(
  "../../src/lib/video/playback-evidence.ts",
  import.meta.url,
);
const allItems = loadPublicVideoInventory();
const catalogDigest = publicInventoryDigest(allItems);
if (process.argv.includes("--inventory")) {
  console.log(
    JSON.stringify(
      { catalogDigest, videos: allItems.length, items: allItems },
      null,
      2,
    ),
  );
  process.exit(0);
}
const origin = process.argv[2] ?? "http://127.0.0.1:14324";
const output = process.argv[3] ?? "artifacts/playback-current.json";
const options = process.argv.slice(4);
const sourceIndex = options.indexOf("--source-commit");
const requestedSource = sourceIndex === -1 ? null : options[sourceIndex + 1];
if (sourceIndex !== -1 && !/^[a-f0-9]{40}$/.test(requestedSource ?? ""))
  throw new Error("--source-commit requires a complete commit SHA");
const filters = options.filter(
  (arg, index) =>
    arg !== "--resume" &&
    (sourceIndex === -1 ||
      (index !== sourceIndex && index !== sourceIndex + 1)),
);
if (filters.length > 1)
  throw new Error("Specify at most one video or batch filter");
const filter = filters[0];
const batch = filter?.startsWith("--") ? filter.slice(2) : null;
let batchSlugs;
if (batch) {
  const batchNames = new Set([
    "additions",
    "curation",
    "batch-30",
    "batch-31",
    "batch-32",
    "batch-34",
    "recent-120",
    "recent-150",
    "judge-rib",
    "rib-fracture-three",
    "nerve-four",
    "catalog-200",
  ]);
  if (!batchNames.has(batch)) throw new Error("Unknown video batch");
  batchSlugs = new Set(
    JSON.parse(
      fs.readFileSync(`src/data/videos/${batch}.v1.json`, "utf8"),
    ).clips.map((clip) => clip.slug),
  );
}
const items = allItems.filter(
  (item) =>
    !filter || (batchSlugs ? batchSlugs.has(item.slug) : item.slug === filter),
);
if (items.length === 0) throw new Error("Unknown video slug");
const sourceCommit =
  requestedSource ??
  execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
if (requestedSource)
  assertPlaybackSourceInputsUnchanged(process.cwd(), requestedSource);
const sourceDirty =
  execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()
    .length > 0;
let deploymentCommit = null;
try {
  const versionResponse = await fetch(new URL("/version.json", origin), {
    signal: AbortSignal.timeout(8000),
    redirect: "error",
  });
  if (versionResponse.ok) {
    const version = await versionResponse.json();
    if (/^[a-f0-9]{40}$/.test(version.commit ?? ""))
      deploymentCommit = version.commit;
  }
} catch {
  /* Kept unknown; such a receipt cannot satisfy the release selector. */
}

const previous =
  process.argv.includes("--resume") && fs.existsSync(output)
    ? JSON.parse(fs.readFileSync(output, "utf8"))
    : [];
// Keep the complete working history when a slug/batch restricts this run.
// Selection determines which requested items can be skipped; it must not erase
// other paths or newer failed attempts from the receipt file.
const results = [...previous];
const completed = new Map(
  !sourceDirty &&
    deploymentCommit === sourceCommit &&
    ownedPlaybackOrigin(origin)
    ? items.flatMap((item) => {
        const { receipt } = selectCurrentPlaybackEvidence(
          previous,
          {
            videoUrl: item.videoUrl,
            path: item.path,
            origin,
            startSeconds: item.startSeconds,
            sourceCommit,
            catalogDigest,
            captionRequired: item.captionRequired,
          },
          new Date(),
        );
        return receipt ? [[item.path, receipt]] : [];
      })
    : [],
);
fs.mkdirSync(path.dirname(output), { recursive: true });
const save = () =>
  fs.writeFileSync(output, JSON.stringify(results, null, 2) + "\n");
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const item of items) {
    if (completed.has(item.path)) continue;
    const page = await browser.newPage({ locale: "zh-TW" });
    const result = {
      url: item.videoUrl,
      path: item.path,
      provider: item.provider,
      startSeconds: item.startSeconds,
      origin,
      sourceCommit,
      sourceDirty,
      deploymentCommit,
      catalogDigest,
      checkedAt: new Date().toISOString(),
      status: "unverified",
      telemetry: "POST /api/plays intercepted; media requests unmodified",
    };
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
        timeout: 20000,
      });
      if (response?.status() !== 200) throw new Error("Page not available");
      if (await page.locator("iframe").count())
        throw new Error("iframe before activation");
      await page.locator("[data-video-load]").click();
      const iframe = page.locator("[data-video-stage] iframe");
      await iframe.waitFor({ state: "attached", timeout: 15000 });
      const src = await iframe.getAttribute("src");
      result.embedUrl = src;
      if (item.provider === "youtube") {
        const expected = new URL(item.videoUrl).searchParams.get("v");
        if (
          new URL(src).hostname !== "www.youtube-nocookie.com" ||
          new URL(src).pathname !== `/embed/${expected}`
        )
          throw new Error("Wrong video loaded");
        if (
          item.startSeconds &&
          new URL(src).searchParams.get("start") !== String(item.startSeconds)
        )
          throw new Error("Wrong timecode");
      } else {
        const id = new URL(item.videoUrl).pathname.split("/").at(-1);
        if (src !== observationEmbedFor(item.provider, id)?.src)
          throw new Error("Wrong provider embed");
      }
      const frame = await iframe
        .elementHandle()
        .then((handle) => handle.contentFrame());
      if (!frame) throw new Error("Missing player frame");
      const video = frame.locator("video").first();
      await video.waitFor({ state: "attached", timeout: 20000 });
      result.before = await video.evaluate((v) => ({
        time: v.currentTime,
        paused: v.paused,
        readyState: v.readyState,
      }));
      if (result.before.paused) {
        if (item.provider === "youtube")
          await frame
            .getByRole("button", { name: /^(播放影片|Play video)$/i })
            .first()
            .click({ timeout: 12000 });
        else await frame.locator("#play-overlay").click({ timeout: 12000 });
      }
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
      result.after = await video.evaluate((v) => ({
        time: v.currentTime,
        paused: v.paused,
        readyState: v.readyState,
      }));
      result.captionControls = await frame
        .locator("button")
        .evaluateAll((buttons) =>
          buttons
            .map((button) => button.getAttribute("aria-label"))
            .filter((label) => /字幕|caption|subtitle/i.test(label ?? "")),
        );
      if (item.captionRequired) {
        const caption = frame
          .getByRole("button", { name: /字幕|caption|subtitle/i })
          .first();
        const label = await caption.getAttribute("aria-label", {
          timeout: 8000,
        });
        if (!/字幕\/CC 已開啟|Turn off subtitles/i.test(label ?? ""))
          await caption.click({ timeout: 5000 });
        await frame.waitForFunction(
          () =>
            [...document.querySelectorAll("button")].some((button) =>
              /字幕\/CC 已開啟|Turn off subtitles/i.test(
                button.getAttribute("aria-label") ?? "",
              ),
            ),
          null,
          { timeout: 8000 },
        );
        result.captionsEnabled = true;
      }
      result.status = "played";
    } catch (error) {
      result.error = String(error.message).slice(0, 300);
    }
    results.push(result);
    completed.set(item.path, result);
    save();
    console.log(JSON.stringify({ path: result.path, status: result.status }));
    await page.close();
  }
} finally {
  await browser.close();
  save();
}
if (
  completed.size !== items.length ||
  [...completed.values()].some(
    (receipt) => receipt.status !== "played" || receipt.error,
  )
)
  process.exitCode = 1;
