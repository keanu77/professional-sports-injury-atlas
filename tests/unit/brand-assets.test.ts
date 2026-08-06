import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  scanBrandAssets,
  validateBrandAssetPolicy,
} from "../../scripts/verify-brand-assets";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

const tempRoots: string[] = [];

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "brand-assets-"));
  tempRoots.push(root);
  return root;
}

function writeInto(root: string, relPath: string, content: string): void {
  const fullPath = join(root, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

afterEach(() => {
  while (tempRoots.length > 0) {
    rmSync(tempRoots.pop()!, { recursive: true, force: true });
  }
});

describe("brand-asset scan", () => {
  it("accepts a clean text-only tree with plain editorial league names", () => {
    const root = makeRoot();
    writeInto(
      root,
      "src/pages/index.astro",
      "<main><h1>NBA 傷害案例</h1><p>本站為獨立教學網站，與 NBA 無任何關聯。</p></main>",
    );
    writeInto(root, "src/content/cases/.gitkeep", "");
    expect(scanBrandAssets(root)).toEqual([]);
  });

  it("fails on any image file under public/ or src/assets/", () => {
    const root = makeRoot();
    writeInto(root, "public/hero.png", "fake-png");
    writeInto(root, "src/assets/team.svg", "<svg/>");
    const observed = scanBrandAssets(root).map((entry) => entry.code);
    expect(
      observed.filter((code) => code === "brand-image-asset"),
    ).toHaveLength(2);
  });

  it("fails on <img> tags and remote thumbnails in authored templates", () => {
    const root = makeRoot();
    writeInto(
      root,
      "src/components/Card.astro",
      '<img src="https://i.ytimg.com/vi/abc/hqdefault.jpg" />',
    );
    const observed = scanBrandAssets(root).map((entry) => entry.code);
    expect(observed).toContain("brand-img-tag");
    expect(observed).toContain("brand-remote-thumbnail");
  });

  it("fails on trademark-like asset names and logo class names", () => {
    const root = makeRoot();
    writeInto(root, "public/nba-logo.webmanifest", "{}");
    writeInto(
      root,
      "src/layouts/Header.astro",
      '<div class="team-logo">Metro City</div>',
    );
    const observed = scanBrandAssets(root).map((entry) => entry.code);
    expect(observed).toContain("brand-trademark-filename");
    expect(observed).toContain("brand-logo-attribute");
  });

  it("fails on logo/image URL fields inside content", () => {
    const root = makeRoot();
    writeInto(
      root,
      "src/content/cases/some-case.json",
      JSON.stringify({
        title: "case",
        teamLogoUrl: "https://cdn.example.org/logo-asset",
      }),
    );
    writeInto(
      root,
      "src/data/extra.json",
      JSON.stringify({ hero: "https://cdn.example.org/hero.png" }),
    );
    const observed = scanBrandAssets(root).map((entry) => entry.code);
    expect(observed).toContain("brand-content-logo-field");
    expect(observed).toContain("brand-content-image-url");
  });

  it("fails on claims of official partnership or authorization", () => {
    const root = makeRoot();
    writeInto(
      root,
      "src/pages/about.astro",
      "<p>We are an official partner of the league.</p>",
    );
    writeInto(
      root,
      "src/content/updates/2026-q3.json",
      JSON.stringify({ summary: "本站為官方合作夥伴。" }),
    );
    const observed = scanBrandAssets(root).map((entry) => entry.code);
    expect(
      observed.filter((code) => code === "brand-endorsement-claim").length,
    ).toBeGreaterThanOrEqual(2);
  });
});

describe("brand-asset policy", () => {
  it("accepts the repository policy: text-only with empty allowlists", () => {
    expect(validateBrandAssetPolicy(REPO_ROOT)).toEqual([]);
  });

  it("the real repository tree carries no brand-asset violations", () => {
    expect(scanBrandAssets(REPO_ROOT)).toEqual([]);
  });

  it("rejects a policy with a non-empty allowlist", () => {
    const root = makeRoot();
    writeInto(
      root,
      "src/data/brand-asset-policy.v1.json",
      JSON.stringify({
        schemaVersion: 1,
        identityPolicy: "text-and-css-geometry-only",
        leagueLogoAllowlist: ["nba"],
        teamLogoAllowlist: [],
        imageAssetAllowlist: [],
      }),
    );
    expect(validateBrandAssetPolicy(root).map((entry) => entry.code)).toContain(
      "brand-policy-allowlist",
    );
  });

  it("rejects a missing policy file", () => {
    const root = makeRoot();
    expect(validateBrandAssetPolicy(root).map((entry) => entry.code)).toContain(
      "brand-policy-missing",
    );
  });
});
