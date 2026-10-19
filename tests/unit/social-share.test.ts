import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { caseSchema } from "../../src/lib/contracts/case";
import { permittedCasesForMode } from "../../src/lib/cases/pagination";
import { observationClips } from "../../src/lib/videos/expansion";
import {
  detailShareCatalog,
  HOME_SHARE_IMAGE,
  shareImageForPage,
  type DetailShareCard,
} from "../../src/lib/social/catalog";
import { renderDetailShareImage } from "../../src/lib/social/render";
import { escapePangoText } from "../../src/lib/social/render-worker";

const root = resolve(import.meta.dirname, "../..");
const records = readdirSync(resolve(root, "src/content/cases"))
  .filter((name) => name.endsWith(".json"))
  .map((name) =>
    caseSchema.parse(
      JSON.parse(
        readFileSync(resolve(root, "src/content/cases", name), "utf8"),
      ),
    ),
  );

afterEach(() => vi.unstubAllEnvs());

describe("public detail share catalog", () => {
  it("produces no detail artwork in review or when the public launch is off", () => {
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "decision-21");
    expect(detailShareCatalog("review", records)).toEqual([]);
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "");
    expect(detailShareCatalog("public", records)).toEqual([]);
  });

  it("has one exact image path per permitted public case or observation", () => {
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "decision-21");
    const catalog = detailShareCatalog("public", records);
    expect(
      catalog
        .filter((entry) => entry.kind === "cases")
        .map((entry) => entry.slug),
    ).toEqual(
      permittedCasesForMode("public", records).map((record) => record.slug),
    );
    expect(
      catalog
        .filter((entry) => entry.kind === "videos")
        .map((entry) => entry.slug),
    ).toEqual(observationClips().map((clip) => clip.slug));
    expect(new Set(catalog.map((entry) => entry.image.path)).size).toBe(
      catalog.length,
    );
    for (const entry of catalog) {
      expect(shareImageForPage(entry.pagePath, catalog)).toEqual(entry.image);
      expect(entry.image.path).toBe(`/social/${entry.kind}/${entry.slug}.png`);
      expect(entry.image).toMatchObject({ width: 1200, height: 630 });
      expect(entry.image.alt).toContain(entry.title);
    }
  });

  it("does not export draft case facts or invent metadata for unknown detail slugs", () => {
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "decision-21");
    const permitted = permittedCasesForMode("public", records);
    const draft = structuredClone(permitted[0]!);
    draft.status = "draft";
    draft.slug = "private-draft-test";
    draft.athlete.name = "PRIVATE-NAME-MUST-NOT-EXPORT";
    const catalog = detailShareCatalog("public", [...records, draft]);
    expect(JSON.stringify(catalog)).not.toContain(draft.athlete.name);
    expect(shareImageForPage(`/cases/${draft.slug}/`, catalog)).toBeNull();
    expect(shareImageForPage("/videos/nonexistent-slug/", catalog)).toBeNull();
    expect(shareImageForPage("/videos/../private/", catalog)).toBeNull();
  });

  it("keeps the exact homepage screenshot and dimensions for general pages", () => {
    expect(shareImageForPage("/", [])).toEqual(HOME_SHARE_IMAGE);
    expect(shareImageForPage("/sports/basketball/", [])).toEqual(
      HOME_SHARE_IMAGE,
    );
    expect(HOME_SHARE_IMAGE).toEqual({
      path: "/social/injury-atlas-home-20260907.png",
      width: 1380,
      height: 542,
      alt: "運動傷害影片圖鑑",
    });
  });
});

describe("isolated text-only PNG rendering", () => {
  it("escapes all Pango markup delimiters and invalid XML control bytes", () => {
    expect(escapePangoText('<span foreground="red">A&B\'s</span>\u0000')).toBe(
      "&lt;span foreground=&quot;red&quot;&gt;A&amp;B&apos;s&lt;/span&gt;",
    );
  });

  it("renders distinct CJK glyphs and fits long escaped names in a 1200x630 PNG", async () => {
    const environment = [
      "FONTCONFIG_FILE",
      "FONTCONFIG_PATH",
      "XDG_CACHE_HOME",
    ].map((key) => process.env[key]);
    const card: DetailShareCard = {
      kind: "videos",
      slug: "test",
      pagePath: "/videos/test/",
      image: {
        path: "/social/videos/test.png",
        width: 1200,
        height: 630,
        alt: "測試",
      },
      title: "膝蓋",
      subtitle: "公開事件資料",
      category: "棒球 · 肋骨／胸壁 · 2019",
      label: "受傷動作觀察",
    };
    const first = await renderDetailShareImage(card, root);
    const second = await renderDetailShareImage(
      { ...card, title: "肋骨" },
      root,
    );
    expect(first.equals(second)).toBe(false);
    const long = await renderDetailShareImage(
      {
        ...card,
        title: '非常長的中文選手姓名 <player & "name"> '.repeat(6),
        subtitle: "公開事件名稱與地點以及年份資料 ".repeat(12),
      },
      root,
    );
    for (const png of [first, second, long]) {
      expect(await sharp(png).metadata()).toMatchObject({
        format: "png",
        width: 1200,
        height: 630,
      });
    }
    expect(
      ["FONTCONFIG_FILE", "FONTCONFIG_PATH", "XDG_CACHE_HOME"].map(
        (key) => process.env[key],
      ),
    ).toEqual(environment);
  });
});
