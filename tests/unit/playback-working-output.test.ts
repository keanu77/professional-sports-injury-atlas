import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ownedPlaybackOrigin,
  selectCurrentPlaybackEvidence,
  type CurrentPlaybackReceipt,
} from "../../src/lib/video/playback-evidence";

const gitignore = readFileSync(".gitignore", "utf8");
const originalArgv = process.argv;
const originalExitCode = process.exitCode;
const roots: string[] = [];
const origin = "https://review.sports-injury-atlas.pages.dev";
const catalogDigest = "b".repeat(64);
const inventory = ["first", "second"].map((slug) => ({
  slug,
  path: `/videos/${slug}/`,
  videoUrl: `https://www.youtube.com/watch?v=${slug}`,
  provider: "youtube",
  startSeconds: 0,
  captionRequired: false,
}));

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "playback-output-test-"));
  roots.push(root);
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  writeFileSync(join(root, ".gitignore"), gitignore);
  git("init", "-b", "main");
  git("config", "user.name", "Playback fixture");
  git("config", "user.email", "fixture@example.org");
  git("add", ".gitignore");
  git("commit", "-m", "Fixture");
  const sourceCommit = git("rev-parse", "HEAD");
  const output = join(root, "artifacts/playback-current.json");
  mkdirSync(join(root, "artifacts"));
  const receipts: CurrentPlaybackReceipt[] = inventory.map((item) => ({
    url: item.videoUrl,
    path: item.path,
    origin,
    startSeconds: 0,
    sourceCommit,
    sourceDirty: false,
    deploymentCommit: sourceCommit,
    catalogDigest,
    checkedAt: new Date(Date.now() - 60_000).toISOString(),
    status: "played",
    before: { time: 0, paused: true, readyState: 3 },
    after: { time: 2, paused: false, readyState: 4 },
  }));
  const save = (rows = receipts) => writeFileSync(output, JSON.stringify(rows));
  save();
  return { root, git, sourceCommit, output, receipts, save };
}

async function runRestrictedResume(f: ReturnType<typeof fixture>) {
  vi.resetModules();
  const page = {
    // A failed retry must stay failed; no network or browser is used.
    route: vi.fn().mockRejectedValue(new Error("fixture playback failure")),
    close: vi.fn(),
  };
  const browser = { newPage: vi.fn().mockResolvedValue(page), close: vi.fn() };
  vi.doMock("@playwright/test", () => ({
    chromium: { launch: vi.fn().mockResolvedValue(browser) },
  }));
  vi.doMock("node:child_process", () => ({
    execFileSync: (_command: string, args: string[]) => f.git(...args),
  }));
  vi.doMock("tsx/esm/api", () => ({
    tsImport: async (specifier: string) => {
      if (specifier.endsWith("public-video-inventory.ts"))
        return { loadPublicVideoInventory: () => inventory };
      if (specifier.endsWith("public-inventory.ts"))
        return { publicInventoryDigest: () => catalogDigest };
      if (specifier.endsWith("observation-provider.ts"))
        return { observationEmbedFor: () => null };
      if (specifier.endsWith("current-playback.ts"))
        return { assertPlaybackSourceInputsUnchanged: () => undefined };
      if (specifier.endsWith("playback-evidence.ts"))
        return { ownedPlaybackOrigin, selectCurrentPlaybackEvidence };
      throw new Error(`Unexpected import: ${specifier}`);
    },
  }));
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ commit: f.sourceCommit }),
    }),
  );
  process.argv = [
    process.execPath,
    "verify-expansion-playback.mjs",
    origin,
    f.output,
    "first",
    "--resume",
  ];
  process.exitCode = undefined;
  const modulePath =
    "../../scripts/public-launch/verify-expansion-playback.mjs";
  await import(modulePath);
  return {
    browser,
    rows: JSON.parse(
      readFileSync(f.output, "utf8"),
    ) as CurrentPlaybackReceipt[],
  };
}

afterEach(() => {
  process.argv = originalArgv;
  process.exitCode = originalExitCode;
  vi.unstubAllGlobals();
  vi.doUnmock("@playwright/test");
  vi.doUnmock("node:child_process");
  vi.doUnmock("tsx/esm/api");
  vi.resetModules();
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

describe("playback working receipts and resume", () => {
  it("keeps the default output ignored and a subsequent run clean", () => {
    const f = fixture();
    expect(f.git("check-ignore", "artifacts/playback-current.json")).toBe(
      "artifacts/playback-current.json",
    );
    expect(f.git("status", "--porcelain")).toBe("");
    writeFileSync(join(f.root, "artifacts/custom-playback.json"), "[]");
    expect(f.git("status", "--porcelain")).not.toBe("");
  });

  it("runs a filtered resume without deleting other paths or replaying valid evidence", async () => {
    const f = fixture();
    const { browser, rows } = await runRestrictedResume(f);
    expect(rows).toEqual(f.receipts);
    expect(browser.newPage).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
    expect(f.git("status", "--porcelain")).toBe("");
  });

  it("preserves a newer failure, retries that item and records a failed retry without hiding it", async () => {
    const f = fixture();
    const failed = {
      ...f.receipts[0]!,
      checkedAt: new Date(Date.now() - 30_000).toISOString(),
      status: "unverified",
      error: "previous attempt failed",
    };
    f.save([...f.receipts, failed]);
    const { browser, rows } = await runRestrictedResume(f);
    expect(browser.newPage).toHaveBeenCalledOnce();
    expect(rows.slice(0, 3)).toEqual([...f.receipts, failed]);
    expect(rows).toHaveLength(4);
    expect(rows[3]).toMatchObject({
      path: inventory[0]!.path,
      sourceDirty: false,
      status: "unverified",
      error: "fixture playback failure",
    });
    expect(process.exitCode).toBe(1);
    expect(
      selectCurrentPlaybackEvidence(
        rows,
        {
          ...inventory[0]!,
          origin,
          sourceCommit: f.sourceCommit,
          catalogDigest,
        },
        new Date(),
      ).reasons,
    ).toContain("latest-attempt-not-played");
  });
});
