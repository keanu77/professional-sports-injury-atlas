import { describe, expect, it } from "vitest";
import {
  allObservationClips,
  ribFractureThree,
  ribFractureThreeSchema,
} from "../../src/lib/videos/expansion";
import {
  eventUpdateFor,
  eventUpdates,
  returnDays,
} from "../../src/lib/videos/event-updates";
import { publicVideoIds } from "../../src/lib/videos/public-video-ids";
import { observationVideoSearchText } from "../../src/lib/videos/search-index";
import {
  observationCategoryLinks,
  observationResourcesFor,
} from "../../src/lib/videos/observation-guidance";

const selections = [
  [
    "fernando-alonso-2016-rib",
    "HiLO6a9crD4",
    "news-analysis",
    "automobile-racing",
    "2016-04-17",
  ],
  [
    "drew-brees-2020-rib",
    "_jrPqJow81Q",
    "news-analysis",
    "american-football",
    "2020-12-20",
  ],
  [
    "tua-tagovailoa-2021-rib",
    "JckTrmIPRK8",
    "news-analysis",
    "american-football",
    "2021-10-17",
  ],
] as const;

describe("three rib fracture observation cases", () => {
  it("uses the approved Alonso news replacement without presenting early reassurance as a diagnosis", () => {
    const clip = ribFractureThree.clips.find(
      (c) => c.slug === "fernando-alonso-2016-rib",
    )!;
    expect(clip.publisher).toBe("Times Of India");
    expect(clip.observation).toContain("2016-03-21");
    expect(clip.observation).toContain("未受傷");
    expect(clip.observation).toContain("後續");
    expect(publicVideoIds.has("x45fLUTHCuk")).toBe(false);
    expect(
      clip.sources.some(
        (s) => s.url === "https://www.youtube.com/watch?v=x45fLUTHCuk",
      ),
    ).toBe(true);
    const rejected = structuredClone(ribFractureThree);
    rejected.clips[0]!.videoId = "x45fLUTHCuk";
    rejected.clips[0]!.videoUrl = "https://www.youtube.com/watch?v=x45fLUTHCuk";
    expect(ribFractureThreeSchema.safeParse(rejected).success).toBe(false);
  });
  it("rejects duplicate selections, mismatched URLs and invalid timecodes", () => {
    for (const mutate of [
      (copy: typeof ribFractureThree) => {
        copy.clips[1] = { ...copy.clips[0]! };
      },
      (copy: typeof ribFractureThree) => {
        copy.clips[0]!.videoUrl = "https://www.youtube.com/watch?v=JckTrmIPRK8";
      },
      (copy: typeof ribFractureThree) => {
        copy.clips[0]!.startSeconds = copy.clips[0]!.durationSeconds;
      },
      (copy: typeof ribFractureThree) => {
        copy.clips[0]!.returnDate = "2015-01-01";
      },
      (copy: typeof ribFractureThree) => {
        copy.clips.pop();
      },
    ]) {
      const copy = structuredClone(ribFractureThree);
      mutate(copy);
      expect(ribFractureThreeSchema.safeParse(copy).success).toBe(false);
    }
  });
  it.each(selections)(
    "integrates %s without conflating diagnosis and video",
    (slug, id, kind, sport, returnDate) => {
      const clip = allObservationClips.find((c) => c.slug === slug);
      expect(clip).toBeDefined();
      expect(clip!.videoId).toBe(id);
      expect(clip!.footageKind).toBe(kind);
      expect(clip!.captionStatus).toBe("not-verified");
      expect(publicVideoIds.has(id)).toBe(true);
      expect(observationVideoSearchText(clip!)).toContain("rib fracture");
      expect(observationVideoSearchText(clip!)).toContain("肋骨");
      expect(observationCategoryLinks(clip!).map((x) => x.href)).toContain(
        `/sports/${sport}/`,
      );
      expect(observationCategoryLinks(clip!).map((x) => x.href)).toContain(
        "/body-parts/trunk/",
      );
      expect(observationResourcesFor(slug).length).toBeGreaterThan(0);
      const update = eventUpdateFor(slug, clip!.videoUrl, clip!.eventDate)!;
      expect(update.returnDate).toBe(returnDate);
      expect(update.timeline!.length).toBeGreaterThanOrEqual(3);
      expect(update.timeline!.at(-1)!.date).toBe(returnDate);
      for (const report of [
        update.mechanism!.summary,
        update.mechanism!.explanation,
        ...update.timeline!,
      ]) {
        expect(report.sourceIndexes.length).toBeGreaterThan(0);
        for (const index of report.sourceIndexes)
          expect(update.sources[index - 1]?.url).toMatch(/^https:/);
      }
    },
  );

  it("adds exactly three cases and preserves Tua's different injuries", () => {
    expect(allObservationClips).toHaveLength(193);
    expect(eventUpdates.entries).toHaveLength(200);
    expect(
      allObservationClips
        .filter((c) => c.name === "Tua Tagovailoa")
        .map((c) => c.slug)
        .sort(),
    ).toEqual(["tua-tagovailoa-2021-rib", "tua-tagovailoa-2024-concussion"]);
  });

  it("does not turn Brees's multiple injury dates into a precise healing duration", () => {
    const clip = allObservationClips.find(
      (c) => c.slug === "drew-brees-2020-rib",
    );
    expect(clip).toBeDefined();
    const update = eventUpdateFor(clip!.slug, clip!.videoUrl, clip!.eventDate)!;
    expect(update.eventDateCertainty).toBe("reported");
    expect(returnDays(update)).toBeNull();
    expect(update.timeline!.map((t) => t.date)).toContain("2020-11-08");
    expect(update.timeline!.map((t) => t.date)).toContain("2020-11-15");
  });
});
