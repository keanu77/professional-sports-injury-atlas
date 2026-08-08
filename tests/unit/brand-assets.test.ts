import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
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

function writeInto(
  root: string,
  relPath: string,
  content: string | Uint8Array,
): void {
  const fullPath = join(root, relPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

function fakePng(width: number, height: number, marker: number): Buffer {
  const bytes = Buffer.alloc(33);
  Buffer.from("89504e470d0a1a0a", "hex").copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  bytes[24] = 8;
  bytes[25] = 2;
  bytes[32] = marker;
  return bytes;
}

function writeEditorialFixture(root: string): Record<string, unknown> {
  const promptNames = ["home", "acl", "ankle-sprain", "achilles-rupture"];
  for (const promptName of promptNames) {
    writeInto(
      root,
      `src/assets/heroes/provenance/${promptName}.md`,
      "Exact prompt: anonymous athlete, face not visible; no logos; no real event.\n",
    );
  }

  const assets: Array<Record<string, unknown>> = [];
  let marker = 1;
  const add = (
    path: string,
    role: string,
    injuryTheme: string | null,
    width: number,
    height: number,
  ): void => {
    const bytes = fakePng(width, height, marker);
    marker += 1;
    writeInto(root, path, bytes);
    assets.push({
      path,
      role,
      injuryTheme,
      promptRecord: `src/assets/heroes/provenance/${injuryTheme ?? "home"}.md`,
      width,
      height,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  };

  add("src/assets/heroes/home-atlas.png", "home", null, 2400, 900);
  for (const injury of ["acl", "ankle-sprain", "achilles-rupture"]) {
    add(
      `src/assets/heroes/${injury}-overview.png`,
      "injury-overview",
      injury,
      2400,
      720,
    );
    for (let variant = 1; variant <= 4; variant += 1) {
      add(
        `src/assets/heroes/${injury}-case-0${variant}.png`,
        "case-cover",
        injury,
        2400,
        960,
      );
    }
  }

  const manifest = {
    schemaVersion: 1,
    generator: "OpenAI built-in imagegen",
    generationDate: "2026-08-09",
    originality:
      "AI-generated original editorial photography; no source/broadcast photographs",
    assets,
  };
  writeInto(
    root,
    "src/assets/heroes/provenance.json",
    `${JSON.stringify(manifest)}\n`,
  );
  return manifest;
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

  it("also rejects thumbnail hosts hidden in styles or video helpers", () => {
    const root = makeRoot();
    writeInto(
      root,
      "src/styles/facade.css",
      ".facade { background-image: url(https://i.ytimg.com/vi/abc/hqdefault.jpg); }",
    );
    writeInto(
      root,
      "src/lib/video/facade.ts",
      'export const forbidden = "https://img.youtube.com/vi/abc/0.jpg";',
    );
    const observed = scanBrandAssets(root).map((entry) => entry.code);
    expect(
      observed.filter((code) => code === "brand-remote-thumbnail"),
    ).toHaveLength(2);
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

  it("accepts only an exact hash-bound editorial inventory", () => {
    const root = makeRoot();
    writeEditorialFixture(root);
    expect(scanBrandAssets(root)).toEqual([]);
  });

  it("fails closed when a provenance-listed raster is replaced", () => {
    const root = makeRoot();
    writeEditorialFixture(root);
    const target = join(root, "src/assets/heroes/acl-case-01.png");
    const tampered = readFileSync(target);
    tampered[tampered.length - 1]! ^= 1;
    writeFileSync(target, tampered);

    const observed = scanBrandAssets(root).map((entry) => entry.code);
    expect(observed).toContain("brand-editorial-provenance");
    expect(observed).toContain("brand-image-asset");
  });

  it("rejects an incomplete editorial inventory", () => {
    const root = makeRoot();
    const manifest = writeEditorialFixture(root) as {
      assets: Array<Record<string, unknown>>;
    };
    manifest.assets.pop();
    writeInto(
      root,
      "src/assets/heroes/provenance.json",
      `${JSON.stringify(manifest)}\n`,
    );

    expect(scanBrandAssets(root).map((entry) => entry.code)).toContain(
      "brand-editorial-provenance",
    );
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
