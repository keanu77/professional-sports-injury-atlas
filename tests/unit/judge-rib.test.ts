import { describe, expect, it } from "vitest";
import {
  allObservationClips,
  judgeRib,
  judgeRibSchema,
} from "../../src/lib/videos/expansion";
import { eventUpdateFor, returnDays } from "../../src/lib/videos/event-updates";
import { publicVideoIds } from "../../src/lib/videos/public-video-ids";
import { observationVideoSearchText } from "../../src/lib/videos/search-index";
import { observationCategoryLinks } from "../../src/lib/videos/observation-guidance";

describe("Judge rib case integration", () => {
  const clip = judgeRib.clips[0]!;
  const update = eventUpdateFor(clip.slug, clip.videoUrl, clip.eventDate)!;

  it("keeps the rib event separate from Judge's existing toe event and discoverable", () => {
    expect(
      allObservationClips
        .filter((item) => item.name === "Aaron Judge")
        .map((item) => item.slug)
        .sort(),
    ).toEqual(["aaron-judge-2023-toe", "aaron-judge-2026-rib"]);
    expect(publicVideoIds.has(clip.videoId)).toBe(true);
    expect(observationVideoSearchText(clip)).toContain("肋骨");
    expect(observationVideoSearchText(clip)).toContain("aaron judge");
    expect(observationCategoryLinks(clip).map((link) => link.href)).toContain(
      "/body-parts/trunk/",
    );
    expect(observationCategoryLinks(clip).map((link) => link.href)).toContain(
      "/sports/baseball/",
    );
  });

  it("shows a documented return without converting suspected onset into a recovery duration", () => {
    expect(update.returnDate).toBe("2026-09-08");
    expect(update.eventDateCertainty).toBe("reported");
    expect(returnDays(update)).toBeNull();
    expect(returnDays({ ...update, eventDateCertainty: "confirmed" })).toBe(
      135,
    );
    expect(update.timeline!.at(-1)!.date).toBe(update.returnDate);
  });

  it("rejects reused events, mismatched video IDs, and invalid timecodes", () => {
    for (const mutate of [
      (copy: typeof judgeRib) => {
        copy.clips[0]!.eventDate = "2023-06-03";
      },
      (copy: typeof judgeRib) => {
        copy.clips[0]!.videoId = "wrong000000";
      },
      (copy: typeof judgeRib) => {
        copy.clips[0]!.startSeconds = 275;
      },
    ]) {
      const copy = structuredClone(judgeRib);
      mutate(copy);
      expect(judgeRibSchema.safeParse(copy).success).toBe(false);
    }
    expect(() =>
      eventUpdateFor(clip.slug, clip.videoUrl, "2019-09-18"),
    ).toThrow();
  });
});
