import { describe, expect, it } from "vitest";
import {
  allObservationClips,
  recent120,
  recent120Schema,
} from "../../src/lib/videos/expansion";
import {
  classifyReturnMilestone,
  eventUpdateFor,
  eventUpdates,
} from "../../src/lib/videos/event-updates";
import { discoveryFor } from "../../src/lib/videos/discovery";
import { observationResourcesFor } from "../../src/lib/videos/observation-guidance";

describe("the nineteen recent cases", () => {
  it("distinguishes postoperative return from the earlier Finals appearance", () => {
    const entry = eventUpdates.entries.find(
      (e) => e.slug === "kristaps-porzingis-retinaculum-2024",
    )!;
    expect(classifyReturnMilestone(entry)).toBe("術後出賽");
    expect(entry.returnDate).toBe("2024-11-25");
    expect(entry.timeline!.some((event) => event.date === "2024-06-17")).toBe(
      true,
    );
  });
  it("adds distinct dated cases with matching reports, citations, and discovery metadata", () => {
    expect(recent120.clips).toHaveLength(19);
    expect(allObservationClips).toHaveLength(147);
    expect(eventUpdates.entries).toHaveLength(154);
    for (const clip of recent120.clips) {
      const update = eventUpdateFor(clip.slug, clip.videoUrl, clip.eventDate)!;
      expect(update, clip.slug).toBeDefined();
      expect(update.returnDate, clip.slug).toBe(clip.returnDate);
      expect(update.returnSummary, clip.slug).toBe(clip.returnText);
      expect(update.mechanism?.steps, clip.slug).toHaveLength(3);
      expect(update.timeline!.length, clip.slug).toBeGreaterThanOrEqual(2);
      expect(update.sources.length, clip.slug).toBeGreaterThanOrEqual(2);
      expect(
        observationResourcesFor(clip.slug).length,
        clip.slug,
      ).toBeGreaterThan(0);
      expect(discoveryFor(clip.slug).slug).toBe(clip.slug);
    }
  });

  it.each([null, "2023-09-11", "2026-09-13"])(
    "rejects an event outside the requested window: %s",
    (date) => {
      const changed = structuredClone(recent120);
      changed.clips[0]!.eventDate = date;
      expect(recent120Schema.safeParse(changed).success).toBe(false);
    },
  );

  it("rejects reuse of an existing video", () => {
    const changed = structuredClone(recent120);
    const existing = allObservationClips.find(
      (clip) => !recent120.clips.some((recent) => recent.slug === clip.slug),
    )!;
    changed.clips[0]!.videoId = existing.videoId;
    changed.clips[0]!.videoUrl = `https://youtu.be/${existing.videoId}`;
    expect(recent120Schema.safeParse(changed).success).toBe(false);
  });
  it("rejects the same event even with a distinct upload and slug", () => {
    const changed = structuredClone(recent120);
    changed.clips[1]!.name = ` ${changed.clips[0]!.name.toUpperCase()} `;
    changed.clips[1]!.eventDate = changed.clips[0]!.eventDate;
    expect(recent120Schema.safeParse(changed).success).toBe(false);
  });
});
