/**
 * Local Lighthouse gate. Starts `astro preview` on 127.0.0.1, launches the
 * Playwright Chromium executable through chrome-launcher, asserts each
 * fixture/atlas route's page identity (so a fallback or 404 can never pass),
 * runs mobile Lighthouse against the home page, the three injury routes, one
 * real governed case route and the quarterly-update fixture, writes
 * `artifacts/lighthouse-review.json`, and exits nonzero when any
 * Accessibility score drops below 0.95 or any LCP exceeds 2500 ms. This is a
 * supplement to keyboard/screen-reader/manual medical review, never a
 * replacement, and it deploys nothing.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import { INJURIES } from "../src/data/taxonomy/injuries";

const HOST = "127.0.0.1";
const PORT = 4331;
const BASE_URL = `http://${HOST}:${PORT}`;
const MIN_ACCESSIBILITY_SCORE = 0.95;
const MAX_LCP_MS = 2500;
const ARTIFACT_PATH = "artifacts/lighthouse-review.json";

interface RouteTarget {
  path: string;
  /** Marker that must appear in the served HTML before measuring. */
  identityMarker: string;
}

function routeTargets(): RouteTarget[] {
  return [
    { path: "/", identityMarker: "data-total-reviewed-count" },
    ...INJURIES.map((injury) => ({
      path: `/injuries/${injury.code}/`,
      identityMarker: `>${injury.labelZh}</h1>`,
    })),
    {
      path: "/cases/anthony-edwards-ankle-sprain-2023/",
      identityMarker: 'data-atlas-view="case-detail"',
    },
    {
      path: "/review/fixtures/latest-update/",
      identityMarker: 'data-atlas-view="quarterly-update"',
    },
  ];
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError = "not attempted";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status === 200) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
  }
  throw new Error(`preview server did not become ready: ${lastError}`);
}

async function main(): Promise<number> {
  let preview: ChildProcess | null = null;
  let chrome: chromeLauncher.LaunchedChrome | null = null;
  try {
    preview = spawn(
      join("node_modules", ".bin", "astro"),
      ["preview", "--host", HOST, "--port", String(PORT)],
      { stdio: "ignore", detached: true },
    );
    await waitForServer(`${BASE_URL}/`, 60_000);

    const targets = routeTargets();
    for (const target of targets) {
      const response = await fetch(`${BASE_URL}${target.path}`);
      if (response.status !== 200) {
        throw new Error(
          `route ${target.path} returned HTTP ${response.status}`,
        );
      }
      const html = await response.text();
      if (!html.includes(target.identityMarker)) {
        throw new Error(
          `route ${target.path} is missing its expected atlas page identity ` +
            `marker ${JSON.stringify(target.identityMarker)}; refusing to measure a fallback page`,
        );
      }
    }

    chrome = await chromeLauncher.launch({
      chromePath: chromium.executablePath(),
      chromeFlags: ["--headless=new", "--no-first-run", "--disable-gpu"],
    });

    const results = [];
    let failed = false;
    for (const target of targets) {
      const run = await lighthouse(`${BASE_URL}${target.path}`, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: ["performance", "accessibility"],
      });
      if (run === undefined) {
        throw new Error(`lighthouse returned no result for ${target.path}`);
      }
      const accessibility = run.lhr.categories.accessibility?.score ?? 0;
      const lcpMs =
        run.lhr.audits["largest-contentful-paint"]?.numericValue ??
        Number.POSITIVE_INFINITY;
      const pass =
        accessibility >= MIN_ACCESSIBILITY_SCORE && lcpMs <= MAX_LCP_MS;
      if (!pass) failed = true;
      results.push({
        path: target.path,
        accessibilityScore: accessibility,
        largestContentfulPaintMs: Math.round(lcpMs),
        pass,
      });
      console.log(
        `${pass ? "PASS" : "FAIL"} ${target.path} ` +
          `a11y=${accessibility.toFixed(2)} lcp=${Math.round(lcpMs)}ms`,
      );
    }

    mkdirSync("artifacts", { recursive: true });
    writeFileSync(
      ARTIFACT_PATH,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          artifactType: "lighthouse-review",
          thresholds: {
            minAccessibilityScore: MIN_ACCESSIBILITY_SCORE,
            maxLargestContentfulPaintMs: MAX_LCP_MS,
          },
          results,
        },
        null,
        2,
      )}\n`,
    );
    if (failed) {
      console.error(
        `at least one route missed the Accessibility ${MIN_ACCESSIBILITY_SCORE} / LCP ${MAX_LCP_MS}ms budget`,
      );
      return 1;
    }
    return 0;
  } finally {
    if (chrome !== null) await chrome.kill();
    if (preview?.pid !== undefined) {
      try {
        process.kill(-preview.pid, "SIGTERM");
      } catch {
        preview.kill("SIGTERM");
      }
    }
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
