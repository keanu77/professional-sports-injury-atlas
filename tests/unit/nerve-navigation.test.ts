import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  allObservationClips,
  nerveFour,
  type ObservationClip,
} from "../../src/lib/videos/expansion";
import * as categories from "../../src/lib/videos/nerve-categories";
import { videosByBodyPart } from "../../src/lib/videos/body-parts";

const source = (path: string) => readFileSync(path, "utf8");

describe("combined nerve navigation", () => {
  it("unites the four recognized nerve clips once without changing their metadata", () => {
    expect(categories.nerveInjuryGroup).toBeTypeOf("function");
    const before = structuredClone(allObservationClips);
    const group = categories.nerveInjuryGroup(allObservationClips);
    expect(group.label).toBe("神經損傷");
    expect(group.count).toBe(4);
    expect(group.clips.map((clip) => clip.slug)).toEqual(
      nerveFour.clips.map((clip) => clip.slug),
    );
    expect(new Set(group.clips.map((clip) => clip.slug)).size).toBe(4);
    expect(allObservationClips).toEqual(before);
  });

  it("excludes unrelated clips and unrecognized nerve category values", () => {
    expect(categories.nerveInjuryGroup).toBeTypeOf("function");
    const unknown = {
      ...nerveFour.clips[0],
      nerveCategory: "unknown-nerve",
    } as unknown as ObservationClip;
    expect(
      categories.nerveInjuryGroup([
        ...allObservationClips.filter((clip) => !clip.nerveCategory),
        unknown,
      ]),
    ).toEqual({ label: "神經損傷", clips: [], count: 0 });
    expect(categories.nerveInjuryGroup([])).toEqual({
      label: "神經損傷",
      clips: [],
      count: 0,
    });
  });

  it("preserves medical subtype counts and anatomical membership", () => {
    expect(
      categories
        .videosByNerveCategory(allObservationClips)
        .map((group) => group.count),
    ).toEqual([3, 1]);
    expect(categories.nerveInjuryGroup).toBeTypeOf("function");
    const anatomy = videosByBodyPart([], allObservationClips);
    for (const clip of categories.nerveInjuryGroup(allObservationClips).clips) {
      expect(
        anatomy
          .flatMap((part) => part.clips)
          .filter((item) => item.slug === clip.slug),
      ).toEqual([clip]);
    }
    expect(anatomy.reduce((sum, part) => sum + part.count, 0)).toBe(
      allObservationClips.length,
    );
  });

  it("places the supplemental link inside BodyPartNav and removes the standalone homepage section", () => {
    const nav = source("src/components/atlas/BodyPartNav.astro");
    expect(nav).toMatch(/nerveCount\s*=\s*0/);
    expect(nav).toMatch(/nerveCurrent\s*=\s*false/);
    expect(nav).toContain("nerveCount > 0");
    expect(nav).toMatch(
      /<nav[^>]*data-body-part-nav>[\s\S]*href="\/nerve-injuries\/"[\s\S]*神經損傷[\s\S]*<\/nav>/,
    );
    expect(nav).toContain('aria-current={nerveCurrent ? "page" : undefined}');
    const home = source("src/pages/index.astro");
    expect(home).toMatch(
      /<BodyPartNav\s+parts=\{bodyParts\}\s+nerveCount=\{nerveGroup.count\}/,
    );
    expect(home).not.toMatch(/nerve-topics|神經傷害專題|videosByNerveCategory/);
    expect(home).toContain(
      "const videoCount = featured.length + clips.length;",
    );
    const part = source("src/pages/body-parts/[part].astro");
    expect(part).toContain("nerveCount={nerveCount}");
  });

  it("gates the combined route while retaining legacy medical subtype routes", () => {
    expect(existsSync("src/pages/nerve-injuries/[...index].astro")).toBe(true);
    const combined = source("src/pages/nerve-injuries/[...index].astro");
    expect(combined).toContain("if (!isLaunchEnabled()) return [];");
    expect(combined).toContain("index: undefined");
    expect(combined).toContain("nerveInjuryGroup(clips)");
    expect(combined).toContain('permittedCasesForMode("public", records)');
    expect(combined).toContain("nerveCurrent");
    expect(combined).toContain("<ObservationCard clip={clip}");
    expect(combined).toContain("<MedicalNotice");
    expect(combined).not.toContain("<iframe");
    const subtype = source("src/pages/nerve-injuries/[category].astro");
    expect(subtype).toContain('href="/nerve-injuries/"');
    expect(subtype).not.toContain("nerve-topics-heading");
    expect(subtype).toContain("videosByNerveCategory(observationClips())");
  });

  it("keeps the release browser verifier strict about the additional nerve link", () => {
    const verifier = source("scripts/public-launch/verify-browser.mjs");
    expect(verifier).toContain(
      'fs.readFileSync("src/data/videos/nerve-four.v1.json", "utf8")',
    );
    expect(verifier).toContain("nerveCount");
    expect(verifier).toContain('expectedNavigation.push("/nerve-injuries/")');
    expect(verifier).toContain("nav.locator('a[href=\"/nerve-injuries/\"]')");
  });
});
