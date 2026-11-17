import { describe, expect, it } from "vitest";
import approval from "../../docs/reviews/2026-11-18-curry-integration/event-content-approval.json";
import metadata from "../../docs/reviews/2026-11-18-curry-integration/metadata.json";
import { loadPublicVideoInventory } from "../../scripts/lib/public-video-inventory";
import {
  allObservationClips,
  catalog200ObservationClips,
  curryThree,
  curryThreeSchema,
} from "../../src/lib/videos/expansion";
import {
  eventUpdateFor,
  eventUpdates,
  returnDays,
} from "../../src/lib/videos/event-updates";
import { contentTypesFor } from "../../src/lib/videos/content-types";
import { observationVideoSearchText } from "../../src/lib/videos/search-index";
import {
  matchesVideoSearch,
  videoSearchTerms,
} from "../../src/lib/videos/search";
import { publicVideoIds } from "../../src/lib/videos/public-video-ids";

describe("three user-reviewed Curry events", () => {
  it("adds three different videos to the preserved 200-video inventory", () => {
    expect(approval.authorizationQuote).toBe("三個事件已審核，請繼續完成");
    expect(approval.status).toBe("approved");
    expect(approval.approvedEvents.map((event) => event.id)).toEqual(
      curryThree.clips.map((clip) => clip.slug),
    );
    expect(catalog200ObservationClips).toHaveLength(193);
    expect(allObservationClips.slice(0, 193)).toEqual(
      catalog200ObservationClips,
    );
    expect(allObservationClips).toHaveLength(196);
    const inventory = loadPublicVideoInventory();
    expect(inventory).toHaveLength(203);
    expect(new Set(inventory.map((entry) => entry.slug)).size).toBe(203);
    expect(new Set(inventory.map((entry) => entry.videoUrl)).size).toBe(203);
    expect(publicVideoIds.size).toBe(202); // one existing MLB source
    expect(eventUpdates.entries).toHaveLength(203);
    for (const clip of curryThree.clips) {
      expect(inventory.find((entry) => entry.slug === clip.slug)).toMatchObject(
        { videoUrl: clip.videoUrl, path: `/videos/${clip.slug}/` },
      );
      const source = metadata.entries.find(
        (entry) => entry.videoId === clip.videoId,
      )!;
      expect(clip.sourceTitle).toBe(source.metadata.title);
      expect(clip.publisher).toBe(source.metadata.author_name);
      expect(publicVideoIds.has(clip.videoId)).toBe(true);
      expect(contentTypesFor(clip.slug, clip.videoUrl)).toHaveLength(1);
    }
  });

  it("preserves the approved dates and does not turn re-evaluation into return", () => {
    for (const clip of curryThree.clips) {
      const reviewed = approval.approvedEvents.find(
        (event) => event.id === clip.slug,
      )!;
      expect(clip.eventDate).toBe(reviewed.eventDate);
      expect(clip.returnDate).toBe(reviewed.returnDate);
      const event = eventUpdateFor(clip.slug, clip.videoUrl, clip.eventDate)!;
      expect(event.returnDate).toBe(reviewed.returnDate);
      expect(returnDays(event)).toBeNull();
      expect(event.mechanism).toBeDefined();
    }
    const knee = curryThree.clips[1]!;
    expect(
      eventUpdateFor(knee.slug, knee.videoUrl, null)?.returnMilestone,
    ).toBe("正式賽");
    expect(curryThree.clips[2]!.returnText).toContain("重新評估");
  });

  it.each(["Curry", "Steph Curry", "柯瑞", "柯里", "庫里"])(
    "finds all three separate events for %s",
    (query) => {
      expect(
        allObservationClips
          .filter((clip) =>
            matchesVideoSearch(
              observationVideoSearchText(clip),
              videoSearchTerms(query),
            ),
          )
          .map((clip) => clip.slug),
      ).toEqual(curryThree.clips.map((clip) => clip.slug));
    },
  );

  it.each([
    "duplicate",
    "wrong-video",
    "wrong-date",
    "invented-return",
    "wrong-duration",
    "missing-source",
  ])("rejects %s", (kind) => {
    const changed = structuredClone(curryThree);
    if (kind === "duplicate")
      changed.clips[1] = structuredClone(changed.clips[0]!);
    if (kind === "wrong-video")
      changed.clips[1]!.videoUrl = changed.clips[0]!.videoUrl;
    if (kind === "wrong-date") changed.clips[1]!.eventDate = "2026-04-04";
    if (kind === "invented-return") changed.clips[2]!.returnDate = "2026-11-25";
    if (kind === "wrong-duration") changed.clips[0]!.durationSeconds = 999;
    if (kind === "missing-source") changed.clips[0]!.sources = [];
    expect(curryThreeSchema.safeParse(changed).success).toBe(false);
  });
});
