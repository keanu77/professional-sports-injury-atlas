import { afterEach, describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import {
  CONTENT_TYPES,
  contentTypeEntries,
  contentTypeGroups,
  contentTypesFor,
  videoContentTypesSchema,
  videosByContentType,
} from "../../src/lib/videos/content-types";
import { observationClips } from "../../src/lib/videos/expansion";
import { caseSchema } from "../../src/lib/contracts/case";
import { selectPublicCases } from "../../src/lib/cases/selectors";
import {
  hasPublicEmbed,
  videoFirstCases,
} from "../../src/lib/patient/featured";

afterEach(() => vi.unstubAllEnvs());

describe("video content type registry", () => {
  it("returns labels only for the exact reviewed source URL", () => {
    const entry = contentTypeEntries.find(
      (candidate) => candidate.slug === "drew-brees-2020-rib",
    )!;
    expect(
      contentTypesFor(entry.slug, entry.videoUrl).map((type) => type.id),
    ).toEqual(expect.arrayContaining(["injury-moment", "expert-analysis"]));
    expect(
      contentTypesFor(
        entry.slug,
        "https://www.youtube.com/watch?v=wrong-url00",
      ),
    ).toEqual([]);
  });

  it("keeps every multi-label group deduplicated", () => {
    const groups = videosByContentType(contentTypeEntries);
    expect(CONTENT_TYPES).toHaveLength(8);
    for (const group of groups) {
      expect(new Set(group.entries.map((entry) => entry.slug)).size).toBe(
        group.entries.length,
      );
      expect(group.entries.length).toBeGreaterThan(0);
    }
  });

  it("groups the actual cards by exact source binding without inferring from legacy footage kinds", () => {
    const clips = observationClips();
    const groups = contentTypeGroups([], clips);
    for (const group of groups) {
      expect(group.count).toBe(group.cases.length + group.clips.length);
      expect(new Set(group.clips.map((clip) => clip.slug)).size).toBe(
        group.clips.length,
      );
      for (const clip of group.clips)
        expect(
          contentTypesFor(clip.slug, clip.videoUrl).map((type) => type.id),
        ).toContain(group.id);
    }
  });

  it("covers every published card once with its exact source binding", () => {
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "decision-21");
    const records = readdirSync("src/content/cases")
      .filter((name) => name.endsWith(".json"))
      .map((name) =>
        caseSchema.parse(
          JSON.parse(readFileSync(`src/content/cases/${name}`, "utf8")),
        ),
      );
    const cards = [
      ...videoFirstCases(selectPublicCases(records))
        .filter(hasPublicEmbed)
        .map((record) => ({
          slug: record.slug,
          videoUrl: record.video.canonicalUrl,
        })),
      ...observationClips().map((clip) => ({
        slug: clip.slug,
        videoUrl: clip.videoUrl,
      })),
    ];
    expect(contentTypeEntries).toHaveLength(cards.length);
    expect(new Set(contentTypeEntries.map((entry) => entry.slug)).size).toBe(
      cards.length,
    );
    for (const card of cards)
      expect(
        contentTypesFor(card.slug, card.videoUrl).length,
        card.slug,
      ).toBeGreaterThan(0);
  });

  it("keeps all eight browse counts equal to their exact reviewed entries", () => {
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "decision-21");
    const records = readdirSync("src/content/cases")
      .filter((name) => name.endsWith(".json"))
      .map((name) =>
        caseSchema.parse(
          JSON.parse(readFileSync(`src/content/cases/${name}`, "utf8")),
        ),
      );
    const groups = contentTypeGroups(
      videoFirstCases(selectPublicCases(records)).filter(hasPublicEmbed),
      observationClips(),
    );
    expect(groups).toHaveLength(8);
    for (const group of groups) {
      expect(group.count).toBe(
        videosByContentType().find((type) => type.id === group.id)!.entries
          .length,
      );
    }
  });

  it("rejects unknown, repeated, and duplicate source bindings", () => {
    const base = {
      schemaVersion: 1,
      status: "draft",
      entries: [
        {
          slug: "known-video",
          videoUrl: "https://www.youtube.com/watch?v=8TIJGIRP634",
          tags: ["injury-moment"],
          reviewedAt: "2026-09-21T07:53:21.354Z",
          evidenceRefs: ["review://entry"],
          reviewNote: "畫面有可確認的運動事件。",
        },
      ],
    };
    for (const changed of [
      {
        ...base,
        entries: [{ ...base.entries[0]!, tags: ["unknown-type"] }],
      },
      {
        ...base,
        entries: [
          { ...base.entries[0]!, tags: ["injury-moment", "injury-moment"] },
        ],
      },
      { ...base, entries: [base.entries[0]!, { ...base.entries[0]! }] },
    ])
      expect(videoContentTypesSchema.safeParse(changed).success).toBe(false);
  });
});
