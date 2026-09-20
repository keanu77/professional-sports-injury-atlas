import { describe, expect, it } from "vitest";
import {
  allObservationClips,
  recent120,
  recent150,
  recent150Schema,
} from "../../src/lib/videos/expansion";
import {
  eventUpdateFor,
  eventUpdates,
} from "../../src/lib/videos/event-updates";
import { discoveryFor } from "../../src/lib/videos/discovery";
import { observationResourcesFor } from "../../src/lib/videos/observation-guidance";

describe("the thirty recent cases", () => {
  it("adds distinct dated cases with matching reports, citations, and discovery metadata", () => {
    expect(recent150.clips).toHaveLength(30);
    expect(allObservationClips).toHaveLength(151);
    expect(eventUpdates.entries).toHaveLength(158);
    for (const clip of recent150.clips) {
      expect(clip.footageKind, clip.slug).toBeDefined();
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

  it.each([null, "2023-09-12", "2026-09-14"])(
    "rejects an event outside the requested window: %s",
    (date) => {
      const changed = structuredClone(recent150);
      changed.clips[0]!.eventDate = date;
      expect(recent150Schema.safeParse(changed).success).toBe(false);
    },
  );

  it("rejects reuse of an existing video", () => {
    const changed = structuredClone(recent150);
    const existing = allObservationClips.find(
      (clip) => !recent150.clips.some((recent) => recent.slug === clip.slug),
    )!;
    changed.clips[0]!.videoId = existing.videoId;
    changed.clips[0]!.videoUrl = `https://youtu.be/${existing.videoId}`;
    expect(recent150Schema.safeParse(changed).success).toBe(false);
  });
  it("rejects the same event even with a distinct upload and slug", () => {
    const changed = structuredClone(recent150);
    changed.clips[1]!.name = ` ${changed.clips[0]!.name.toUpperCase()} `;
    changed.clips[1]!.eventDate = changed.clips[0]!.eventDate;
    expect(recent150Schema.safeParse(changed).success).toBe(false);
  });

  it("rejects a previously published event even when its new video is distinct", () => {
    const changed = structuredClone(recent150);
    const prior = recent120.clips[0]!;
    changed.clips[0]!.name = prior.name;
    changed.clips[0]!.eventDate = prior.eventDate;
    changed.clips[0]!.returnDate = null;
    const result = recent150Schema.safeParse(changed);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("Duplicate recent event"),
        ),
      ).toBe(true);
  });
});
