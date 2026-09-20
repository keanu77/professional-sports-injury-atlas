import { describe, expect, it } from "vitest";
import {
  allObservationClips,
  nerveFour,
  nerveFourSchema,
} from "../../src/lib/videos/expansion";
import {
  eventUpdateFor,
  eventUpdates,
  returnDays,
} from "../../src/lib/videos/event-updates";
import { publicVideoIds } from "../../src/lib/videos/public-video-ids";
import { observationVideoSearchText } from "../../src/lib/videos/search-index";
import { videosByNerveCategory } from "../../src/lib/videos/nerve-categories";
import {
  observationCategoryLinks,
  observationResourcesFor,
} from "../../src/lib/videos/observation-guidance";

describe("four named nerve cases", () => {
  it("admits exactly the selected four, preserving the previous catalog", () => {
    expect(nerveFour.clips.map((c) => c.slug)).toEqual([
      "jaylon-smith-2016-peroneal-nerve",
      "zack-kelly-2023-ulnar-nerve",
      "ryan-crouser-2024-ulnar-nerve",
      "rob-horne-2018-brachial-plexus",
    ]);
    expect(allObservationClips).toHaveLength(151);
    expect(eventUpdates.entries).toHaveLength(158);
    expect(publicVideoIds.size).toBe(157);
    expect(publicVideoIds.has("zack-kelly-leaves-with-injury")).toBe(false);
  });
  it("keeps nerve and plexus browsing distinct", () => {
    const groups = videosByNerveCategory(nerveFour.clips);
    expect(groups.map((g) => [g.code, g.count])).toEqual([
      ["peripheral-nerve", 3],
      ["brachial-plexus", 1],
    ]);
    for (const clip of nerveFour.clips) {
      expect(
        observationCategoryLinks(clip).some(
          (l) => l.href === `/nerve-injuries/${clip.nerveCategory}/`,
        ),
      ).toBe(true);
      expect(observationResourcesFor(clip.slug).length).toBeGreaterThan(0);
      expect(observationVideoSearchText(clip)).toContain(
        clip.nerveCategory === "brachial-plexus"
          ? "brachial plexus"
          : clip.slug.includes("smith")
            ? "peroneal nerve"
            : "ulnar nerve",
      );
      const update = eventUpdateFor(clip.slug, clip.videoUrl, clip.eventDate)!;
      expect(update).toBeDefined();
      expect(update.timeline!.length).toBeGreaterThanOrEqual(2);
      expect(update.checkedAt).toBe("2026-09-20");
    }
  });
  it("does not invent exact onset or recovery for Crouser or Horne", () => {
    for (const name of ["ryan-crouser", "rob-horne"]) {
      const clip = nerveFour.clips.find((c) => c.slug.startsWith(name))!;
      expect(clip.footageKind).toBe("athlete-interview");
      expect(clip.returnDate).toBeNull();
      expect(
        returnDays(eventUpdateFor(clip.slug, clip.videoUrl, clip.eventDate)!),
      ).toBeNull();
    }
    expect(
      nerveFour.clips.find((c) => c.name === "Ryan Crouser")!.eventDate,
    ).toBeNull();
  });
  it("rejects changed selections, duplicate events and invalid offsets", () => {
    for (const mutate of [
      (v: typeof nerveFour) => {
        v.clips[1]!.videoUrl = "https://evil.example/embed";
      },
      (v: typeof nerveFour) => {
        v.clips[3]!.nerveCategory = "peripheral-nerve";
      },
      (v: typeof nerveFour) => {
        v.clips[0]!.startSeconds = v.clips[0]!.durationSeconds;
      },
      (v: typeof nerveFour) => {
        v.clips[1] = v.clips[0]!;
      },
      (v: typeof nerveFour) => {
        v.clips[1]!.provider = "youtube";
      },
    ]) {
      const copy = structuredClone(nerveFour);
      mutate(copy);
      expect(nerveFourSchema.safeParse(copy).success).toBe(false);
    }
  });
});
