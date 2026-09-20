import { describe, expect, it } from "vitest";
import { BODY_PARTS } from "../../src/lib/videos/body-parts";
import { SITUATIONS, discoveryFor } from "../../src/lib/videos/discovery";
import { allObservationClips } from "../../src/lib/videos/expansion";
import {
  observationCategoryLinks,
  observationResourcesFor,
  relatedObservationClips,
} from "../../src/lib/videos/observation-guidance";
import { SPORTS } from "../../src/lib/videos/sports";
import { NERVE_CATEGORIES } from "../../src/lib/videos/nerve-categories";

const featuredSlugs = allObservationClips
  .filter((clip) => discoveryFor(clip.slug).curatedRank !== undefined)
  .map((clip) => clip.slug)
  .sort();

describe("Decision 39 observation guidance", () => {
  it("preserves featured resources while covering all observations", () => {
    expect(featuredSlugs).toEqual([
      "anthony-richardson-2023-shoulder",
      "antoine-dupont-world-cup-2023",
      "carolina-marin-indonesia-2019",
      "chris-bassitt-2021-face",
      "dominic-thiem-2021-wrist",
      "kobe-bryant-2013-achilles",
      "lindsey-vonn-schladming-2013",
      "mohamed-salah-final-2018",
      "ronald-acuna-miami-2021",
      "zverev-roland-garros-2022",
    ]);

    const resources = new Map(
      featuredSlugs.map((slug) => [slug, observationResourcesFor(slug)]),
    );
    expect(resources.get("ronald-acuna-miami-2021")).toEqual([
      expect.objectContaining({
        kind: "article",
        url: expect.stringContaining("2020-03-10-"),
      }),
    ]);
    expect(resources.get("zverev-roland-garros-2022")).toHaveLength(2);
    expect(resources.get("chris-bassitt-2021-face")).toEqual([
      expect.objectContaining({ kind: "topic-overview" }),
    ]);
    expect(resources.get("antoine-dupont-world-cup-2023")).toEqual([
      expect.objectContaining({ kind: "topic-overview" }),
    ]);

    for (const [slug, links] of resources) {
      expect(links.length, slug).toBeGreaterThanOrEqual(1);
      expect(links.length, slug).toBeLessThanOrEqual(3);
      for (const link of links) {
        expect(link.url).toMatch(/^https:\/\/sportsmedicine\.tw\/content\//u);
      }
    }
    expect(observationResourcesFor("kevin-pillar-2021-face")).toEqual([
      expect.objectContaining({ kind: "topic-overview" }),
    ]);
    for (const clip of allObservationClips) {
      const links = observationResourcesFor(clip.slug);
      expect(links.length, clip.slug).toBeGreaterThanOrEqual(1);
      expect(links.length, clip.slug).toBeLessThanOrEqual(3);
      expect(new Set(links.map((link) => link.url)).size).toBe(links.length);
    }
    expect(observationResourcesFor("not-a-real-video")).toEqual([]);
  });

  it("selects at most three deterministic related videos without self-links", () => {
    expect(allObservationClips).toHaveLength(151);
    for (const clip of allObservationClips) {
      const related = relatedObservationClips(clip, allObservationClips);
      expect(related.length, clip.slug).toBeGreaterThan(0);
      expect(related.length, clip.slug).toBeLessThanOrEqual(3);
      expect(related.map((candidate) => candidate.slug)).not.toContain(
        clip.slug,
      );
      expect(related.map((candidate) => candidate.slug)).toEqual(
        relatedObservationClips(clip, allObservationClips).map(
          (candidate) => candidate.slug,
        ),
      );
      for (const candidate of related) {
        expect(
          candidate.bodyPart === clip.bodyPart ||
            discoveryFor(candidate.slug).situation ===
              discoveryFor(clip.slug).situation ||
            candidate.sport === clip.sport,
        ).toBe(true);
      }
    }
  });

  it("orders same-body-part matches ahead of situation and sport matches", () => {
    const clip = allObservationClips.find(
      (candidate) => candidate.slug === "ronald-acuna-miami-2021",
    )!;
    const related = relatedObservationClips(clip, allObservationClips);
    const priorities = related.map((candidate) =>
      candidate.bodyPart === clip.bodyPart
        ? 0
        : discoveryFor(candidate.slug).situation ===
            discoveryFor(clip.slug).situation
          ? 1
          : 2,
    );
    expect(priorities).toEqual([...priorities].sort());
  });

  it("returns the three base routes and an optional named nerve category", () => {
    const validRoutes = new Set([
      ...BODY_PARTS.map((item) => `/body-parts/${item.code}/`),
      ...SPORTS.map((item) => `/sports/${item.code}/`),
      ...SITUATIONS.map((item) => `/situations/${item.code}/`),
      ...NERVE_CATEGORIES.map((item) => `/nerve-injuries/${item.code}/`),
    ]);
    for (const clip of allObservationClips) {
      const links = observationCategoryLinks(clip);
      expect(links).toHaveLength(clip.nerveCategory ? 4 : 3);
      expect(new Set(links.map((link) => link.kind))).toEqual(
        new Set([
          "body-part",
          "sport",
          "situation",
          ...(clip.nerveCategory ? ["nerve"] : []),
        ]),
      );
      for (const link of links) expect(validRoutes.has(link.href)).toBe(true);
    }
  });
});
