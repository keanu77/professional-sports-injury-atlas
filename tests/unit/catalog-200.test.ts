import { describe, expect, it } from "vitest";
import selected from "../../docs/reviews/2026-09-21-catalog-200/selected-cases.json";
import baseline from "../../docs/reviews/2026-09-21-catalog-200/baseline-before-integration.json";
import repairs from "../../docs/reviews/2026-10-10-source-video-health/source-repairs.json";
import resourceData from "../../src/data/videos/observation-resources.v1.json";
import catalog200EventData from "../../src/data/videos/event-catalog-200.v1.json";
import { discoveryFor } from "../../src/lib/videos/discovery";
import {
  allObservationClips,
  catalog200,
  catalog200Schema,
} from "../../src/lib/videos/expansion";
import {
  eventUpdateFor,
  eventUpdates,
  catalog200EventSchema,
  returnDays,
} from "../../src/lib/videos/event-updates";
import { publicVideoIds } from "../../src/lib/videos/public-video-ids";
import { videosBySport } from "../../src/lib/videos/sports";
import { videosByBodyPart } from "../../src/lib/videos/body-parts";
import {
  observationCategoryLinks,
  observationResourcesFor,
} from "../../src/lib/videos/observation-guidance";
import { nerveInjuryGroup } from "../../src/lib/videos/nerve-categories";

// Keep the original review evidence immutable. Apply only the separately
// documented citation maintenance before comparing every other field exactly.
function withRepairedCitations<
  T extends { sources: Array<{ title: string; url: string }> },
>(original: T): T {
  const item = structuredClone(original);
  const indexMap = new Map<number, number>();
  item.sources = original.sources.flatMap((source) => {
    const repair = repairs.repairedUrls.find((r) => r.oldUrl === source.url);
    if (repair?.action === "consolidate") return [];
    return [
      {
        ...source,
        ...(repair ? { url: repair.newUrl } : {}),
        ...(repair?.newTitle ? { title: repair.newTitle } : {}),
      },
    ];
  });
  original.sources.forEach((source, index) => {
    const repair = repairs.repairedUrls.find((r) => r.oldUrl === source.url);
    indexMap.set(
      index + 1,
      item.sources.findIndex((s) => s.url === (repair?.newUrl ?? source.url)) +
        1,
    );
  });
  const remap = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === "sourceIndexes" && Array.isArray(child)) {
        Reflect.set(value, key, [
          ...new Set(child.map((i) => indexMap.get(i))),
        ]);
      } else remap(child);
    }
  };
  remap(item);
  return item;
}

describe("catalog 200 sourced expansion", () => {
  it("preserves prior events and admits the selected 42 once", () => {
    expect(catalog200.clips).toEqual(selected.clips.map(withRepairedCitations));
    expect(catalog200.clips).toHaveLength(42);
    expect(allObservationClips).toHaveLength(193);
    expect(eventUpdates.entries).toHaveLength(200);
    expect(publicVideoIds.size).toBe(199);
    expect(new Set(allObservationClips.map((c) => c.slug)).size).toBe(193);
    expect(new Set(catalog200.clips.map((c) => c.videoId)).size).toBe(42);
    expect(nerveInjuryGroup(allObservationClips).count).toBe(4);
    const added = new Set(selected.clips.map((c) => c.slug));
    expect(baseline.clips).toHaveLength(151);
    expect(baseline.eventEntries).toHaveLength(158);
    expect(allObservationClips.filter((c) => !added.has(c.slug))).toEqual(
      baseline.clips.map(withRepairedCitations),
    );
    expect(eventUpdates.entries.filter((e) => !added.has(e.slug))).toEqual(
      baseline.eventEntries.map(withRepairedCitations),
    );
  });
  it("binds every source timeline to its clip and preserves unknown recovery", () => {
    for (const clip of catalog200.clips) {
      const expected = selected.eventEntries.find((e) => e.slug === clip.slug)!;
      const entry = eventUpdateFor(clip.slug, clip.videoUrl, clip.eventDate)!;
      expect(entry).toEqual(withRepairedCitations(expected));
      expect(returnDays(entry)).toBeNull();
      expect(clip.startSeconds).toBeLessThan(clip.durationSeconds);
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const row of entry.timeline ?? [])
        for (const i of row.sourceIndexes)
          expect(entry.sources[i - 1]).toBeDefined();
      expect(observationResourcesFor(clip.slug).length).toBeGreaterThan(0);
      expect(observationCategoryLinks(clip).length).toBe(3);
    }
  });
  it("provides the sourced mechanism required by every public detail page", () => {
    const entries = catalog200.clips.map((clip) =>
      eventUpdateFor(clip.slug, clip.videoUrl, clip.eventDate)!,
    );
    expect(
      entries.filter((entry) => !entry.mechanism).map((entry) => entry.slug),
    ).toEqual([]);
    for (const entry of entries) {
      const mechanism = entry.mechanism!;
      for (const report of [mechanism.summary, mechanism.explanation]) {
        expect(report.text.trim().length, entry.slug).toBeGreaterThan(0);
        expect(report.sourceIndexes.length, entry.slug).toBeGreaterThan(0);
        for (const index of report.sourceIndexes) {
          expect(Number.isInteger(index), entry.slug).toBe(true);
          expect(index, entry.slug).toBeGreaterThan(0);
          expect(entry.sources[index - 1], entry.slug).toBeDefined();
        }
      }
    }
  });
  it.each(["mechanism", "timeline"] as const)(
    "rejects a catalog-200 batch missing its required %s",
    (field) => {
      expect(catalog200EventSchema.safeParse(catalog200EventData).success).toBe(
        true,
      );
      const changed = structuredClone(catalog200EventData);
      const entry = changed.entries.find((item) => "mechanism" in item)!;
      Reflect.deleteProperty(entry, field);
      expect(catalog200EventSchema.safeParse(changed).success).toBe(false);
    },
  );
  it("routes every new event to one sport and one anatomical group", () => {
    expect(videosBySport([], allObservationClips)).toHaveLength(30);
    expect(videosByBodyPart([], allObservationClips)).toHaveLength(14);
    const expected = catalog200.clips.map((c) => c.slug).sort();
    expect(
      videosBySport([], catalog200.clips)
        .flatMap((g) => g.clips.map((c) => c.slug))
        .sort(),
    ).toEqual(expected);
    expect(
      videosByBodyPart([], catalog200.clips)
        .flatMap((g) => g.clips.map((c) => c.slug))
        .sort(),
    ).toEqual(expected);
  });
  it("uses each reviewed route, resource and visible situation exactly", () => {
    const routes = [
      ["nathan-florence-2023-t12-fracture", "trunk", "surfing"],
      ["billy-kemper-2020-pelvis-knee", "pelvis", "surfing"],
      ["missy-franklin-2016-shoulder", "shoulder", "swimming"],
      ["gabriel-medina-2025-pectoral-tendon", "trunk", "surfing"],
      ["jj-watt-2019-pectoral", "trunk", "american-football"],
      ["zoey-clark-2023-disc-nerve", "trunk", "athletics"],
      ["chloe-kim-2026-shoulder", "shoulder", "snowboarding"],
      ["adam-peaty-2022-foot", "foot", "swimming"],
      ["kerri-walsh-jennings-2015-shoulder", "shoulder", "beach-volleyball"],
      ["rafael-nadal-2022-abdominal", "trunk", "tennis"],
      ["jordyn-poulter-2022-knee", "knee", "indoor-volleyball"],
      ["paula-badosa-2023-spinal-stress-fracture", "trunk", "tennis"],
      ["rafael-nadal-2022-rib-stress-fracture", "trunk", "tennis"],
      ["jake-wightman-2023-foot", "foot", "athletics"],
      ["karsten-warholm-2022-hamstring", "posterior-thigh", "athletics"],
      ["molly-seidel-2024-patella", "knee", "athletics"],
      ["jamahal-hill-2021-elbow", "elbow", "mixed-martial-arts"],
      ["antonio-rodrigo-nogueira-2011-arm", "arm", "mixed-martial-arts"],
      ["tim-sylvia-2004-arm", "arm", "mixed-martial-arts"],
      ["ronaldo-jacare-souza-2021-humerus", "arm", "mixed-martial-arts"],
      ["tom-aspinall-2022-knee", "knee", "mixed-martial-arts"],
      ["jordan-burroughs-2013-ankle", "ankle", "wrestling"],
      ["jofra-archer-2020-elbow-stress-fracture", "elbow", "cricket"],
      ["manny-pacquiao-2015-shoulder", "shoulder", "boxing"],
      ["sky-brown-2024-shoulder", "shoulder", "skateboarding"],
      ["tony-hawk-2022-femur", "hip-thigh", "skateboarding"],
      ["helen-maroulis-2018-concussion", "head-neck", "wrestling"],
      ["tiger-woods-2008-tibial-stress-fractures", "calf-achilles", "golf"],
      ["mirabai-chanu-2023-hip", "hip-thigh", "weightlifting"],
      ["annemiek-van-vleuten-2022-elbow", "elbow", "cycling"],
      ["daniel-andre-tande-2021-clavicle", "shoulder", "ski-jumping"],
      ["egan-bernal-2022-training-crash", "trunk", "cycling"],
      ["connor-fields-2021-brain-hemorrhage", "head-neck", "cycling"],
      ["novak-djokovic-2017-elbow", "elbow", "tennis"],
      ["kei-nishikori-2017-wrist", "wrist", "tennis"],
      ["bianca-andreescu-2023-ankle", "ankle", "tennis"],
      ["juan-martin-del-potro-2017-wrist-contusion", "wrist", "tennis"],
      ["rafael-nadal-2016-wrist", "wrist", "tennis"],
      ["nikola-karabatic-2020-acl", "knee", "handball"],
      ["kelly-slater-2017-foot", "foot", "surfing"],
      ["sally-fitzgibbons-2015-eardrum", "head-neck", "surfing"],
      ["emma-raducanu-2022-2023-wrists", "wrist", "tennis"],
    ] as const;
    for (const [slug, body, sport] of routes) {
      const clip = catalog200.clips.find((c) => c.slug === slug)!;
      const links = observationCategoryLinks(clip);
      expect(links.find((l) => l.kind === "body-part")!.href).toBe(
        "/body-parts/" + body + "/",
      );
      expect(links.find((l) => l.kind === "sport")!.href).toBe(
        "/sports/" + sport + "/",
      );
      const expected = selected.resourceEntries[slug];
      expect((resourceData.entries as Record<string, unknown>)[slug]).toEqual(
        expected,
      );
      const registry = resourceData.resources as Record<
        string,
        { url: string }
      >;
      expect(observationResourcesFor(slug).map((r) => r.url)).toEqual(
        expected.resources.map((key) => registry[key]!.url),
      );
      const situation =
        selected.discoveryEntries.find((e) => e.slug === slug)?.situation ??
        "unclear";
      expect(discoveryFor(slug).situation).toBe(situation);
      expect(discoveryFor(slug).curatedRank).toBeUndefined();
    }
  });
  it("does not turn review metadata into clinical or public approval", () => {
    expect(selected.scope).toBe("candidate-source-verified-not-owned-playback");
    expect(selected.ownedHttpsPlaybackVerified).toBe(false);
    expect(selected.acceptedForPublication).toBe(0);
    expect(
      catalog200.clips.find((c) => c.slug === "zoey-clark-2023-disc-nerve")!
        .nerveCategory,
    ).toBeUndefined();
    expect(
      catalog200.clips.find((c) => c.slug === "jake-wightman-2023-foot")!
        .eventDate,
    ).toBeNull();
    for (const clip of catalog200.clips) {
      expect(clip.observation).not.toMatch(
        /schema|主流程|待主流程|計入|只計一例|草稿|startSeconds|durationSeconds/,
      );
    }
  });
  it("rejects wrong video bindings, duplicate selections, missing citations and invalid offsets", () => {
    for (const mutate of [
      (v: typeof catalog200) => {
        v.clips[0]!.videoUrl = "https://www.youtube.com/watch?v=abcdefghijk";
      },
      (v: typeof catalog200) => {
        v.clips[0]!.videoId = "abcdefghijk";
        v.clips[0]!.videoUrl = "https://www.youtube.com/watch?v=abcdefghijk";
      },
      (v: typeof catalog200) => {
        v.clips[1] = v.clips[0]!;
      },
      (v: typeof catalog200) => {
        v.clips[0]!.eventYear = "2024";
      },
      (v: typeof catalog200) => {
        v.clips[0]!.eventDate = "2023-01-15";
      },
      (v: typeof catalog200) => {
        v.clips[0]!.startSeconds += 1;
      },
      (v: typeof catalog200) => {
        v.clips[0]!.durationSeconds -= 1;
      },
      (v: typeof catalog200) => {
        v.clips[0]!.publisher = "Different publisher";
      },
      (v: typeof catalog200) => {
        v.clips[0]!.sourceTitle = "Different title";
      },
      (v: typeof catalog200) => {
        v.clips[0]!.footageKind = "news-analysis";
      },
      (v: typeof catalog200) => {
        v.clips[0]!.startSeconds = v.clips[0]!.durationSeconds;
      },
      (v: typeof catalog200) => {
        v.clips[0]!.sources = [];
      },
      (v: typeof catalog200) => {
        v.clips[0]!.returnDate = "1900-01-01";
      },
    ]) {
      const copy = structuredClone(catalog200);
      mutate(copy);
      expect(catalog200Schema.safeParse(copy).success).toBe(false);
    }
  });
});
