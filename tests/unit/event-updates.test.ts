import { describe, expect, it } from "vitest";
import {
  eventUpdates,
  eventUpdatesSchema,
  eventUpdateFor,
  formatTimelineDate,
  normalizeEventUpdateBatches,
  returnDays,
  timelineDateBounds,
} from "../../src/lib/videos/event-updates";
import additionsData from "../../src/data/videos/event-additions.v1.json";
import batch30Data from "../../src/data/videos/event-batch-30.v1.json";
import batch31Data from "../../src/data/videos/event-batch-31.v1.json";
import batch32Data from "../../src/data/videos/event-batch-32.v1.json";
import batch34Data from "../../src/data/videos/event-batch-34.v1.json";
import recent120Data from "../../src/data/videos/event-recent-120.v1.json";
import originalData from "../../src/data/videos/event-updates.v1.json";

describe("source-backed event updates", () => {
  it("retains month/year precision without inventing a recovery day", () => {
    const changed = structuredClone(eventUpdates);
    const entry = changed.entries.find(
      (item) => item.slug === "paul-george-leg-fracture-2014",
    )!;
    entry.timeline = [
      { date: "2014", title: "傷後", text: "公開回顧", sourceIndexes: [1] },
      { date: "2014-12", title: "訓練", text: "公開回顧", sourceIndexes: [1] },
      {
        date: "2015-04-05",
        title: "復賽",
        text: "公開回顧",
        sourceIndexes: [1],
      },
    ];
    delete entry.mechanism!.research;
    expect(eventUpdatesSchema.safeParse(changed).success).toBe(true);
    expect(timelineDateBounds("2024-02")).toEqual(["2024-02-01", "2024-02-29"]);
    expect(formatTimelineDate("2014")).toBe("2014 年");
    expect(formatTimelineDate("2014-12")).toBe("2014 年 12 月");
    for (const date of [
      "2014-13",
      "2014-00",
      "2014-02-30",
      "2013",
      "2099-01",
      "2099",
    ]) {
      entry.timeline[0]!.date = date;
      expect(eventUpdatesSchema.safeParse(changed).success, date).toBe(false);
    }
  });

  it("allows documented later milestones when the injury day is unknown", () => {
    const changed = structuredClone(eventUpdates);
    const entry = changed.entries.find(
      (item) => item.slug === "julie-foucher-box-jump-2015",
    )!;
    entry.timeline = [
      {
        date: "2016",
        title: "後續報導",
        text: "保留年份精度",
        sourceIndexes: [1],
      },
    ];
    expect(eventUpdatesSchema.safeParse(changed).success).toBe(true);
    expect(returnDays(entry)).toBeNull();
  });

  it("rejects uncited summaries and impossible or unordered recovery milestones", () => {
    for (const mutate of [
      (entry: (typeof eventUpdates.entries)[number]) => {
        entry.mechanism!.summary.sourceIndexes = [entry.sources.length + 1];
      },
      (entry: (typeof eventUpdates.entries)[number]) => {
        entry.timeline![0]!.sourceIndexes = [];
      },
      (entry: (typeof eventUpdates.entries)[number]) => {
        entry.timeline![0]!.date = "2025-05-11";
      },
      (entry: (typeof eventUpdates.entries)[number]) => {
        entry.timeline![2]!.date = "2025-05-12";
      },
      (entry: (typeof eventUpdates.entries)[number]) => {
        entry.timeline!.at(-1)!.date = "2099-01-01";
      },
    ]) {
      const changed = structuredClone(eventUpdates);
      mutate(
        changed.entries.find(
          (entry) => entry.slug === "jayson-tatum-achilles-rupture-2025",
        )!,
      );
      expect(eventUpdatesSchema.safeParse(changed).success).toBe(false);
    }
  });

  it("normalizes mixed batch dates and preserves an explicit entry date", () => {
    const [first, second, third] = eventUpdates.entries;
    const withoutCheckedAt = (entry: (typeof eventUpdates.entries)[number]) => {
      const { checkedAt: _checkedAt, ...oldEntry } = structuredClone(entry);
      return oldEntry;
    };
    const normalized = normalizeEventUpdateBatches([
      { checkedAt: "2026-09-01", entries: [withoutCheckedAt(first!)] },
      {
        checkedAt: "2026-09-06",
        entries: [
          withoutCheckedAt(second!),
          { ...withoutCheckedAt(third!), checkedAt: "2026-09-05" },
        ],
      },
    ]);

    expect(normalized.map((entry) => entry.checkedAt)).toEqual([
      "2026-09-01",
      "2026-09-06",
      "2026-09-05",
    ]);
  });

  it("keeps batch dates unless an entry has been checked again", () => {
    for (const batch of [
      originalData,
      additionsData,
      batch30Data,
      batch31Data,
      batch32Data,
      batch34Data,
      recent120Data,
    ]) {
      for (const entry of normalizeEventUpdateBatches([batch])) {
        const original = batch.entries.find(
          (item) => item.slug === entry.slug,
        )!;
        const explicitDate =
          "checkedAt" in original ? original.checkedAt : undefined;
        expect(entry.checkedAt, entry.slug).toBe(
          explicitDate ?? batch.checkedAt,
        );
      }
    }
  });

  it("rejects attaching a report to another injury event or video", () => {
    const entry = eventUpdates.entries[0]!;
    expect(() =>
      eventUpdateFor(
        entry.slug,
        "https://www.youtube.com/watch?v=wrong000000",
        entry.eventDate,
      ),
    ).toThrow();
    expect(() =>
      eventUpdateFor(entry.slug, entry.videoUrl, "2025-01-01"),
    ).toThrow();
  });
  it("does not invent a return interval for unknown dates", () => {
    const unknown = eventUpdates.entries.find(
      (e) => e.slug === "julie-foucher-box-jump-2015",
    )!;
    expect(returnDays(unknown)).toBeNull();
    expect(
      returnDays(
        eventUpdates.entries.find(
          (e) => e.slug === "anfernee-simons-ankle-sprain-2023",
        )!,
      ),
    ).toBe(15);
    expect(
      returnDays(
        eventUpdates.entries.find(
          (e) => e.slug === "kevin-durant-achilles-rupture-2019",
        )!,
      ),
    ).toBe(561);
  });
  it("rejects future, unsupported, reversed, and duplicate records", () => {
    for (const mutate of [
      (d: typeof eventUpdates) => {
        d.entries[0]!.returnDate = "2099-01-01";
      },
      (d: typeof eventUpdates) => {
        d.entries[0]!.eventDate = null;
      },
      (d: typeof eventUpdates) => {
        d.entries[0]!.returnDate = "1900-01-01";
      },
      (d: typeof eventUpdates) => {
        d.entries[0]!.sources = [];
      },
      (d: typeof eventUpdates) => {
        d.entries.push(d.entries[0]!);
      },
    ]) {
      const changed = structuredClone(eventUpdates);
      mutate(changed);
      expect(eventUpdatesSchema.safeParse(changed).success).toBe(false);
    }
  });

  it("validates event, return, and source dates against each entry check date", () => {
    for (const mutate of [
      (entry: (typeof eventUpdates.entries)[number]) => {
        entry.eventDate = "2026-09-02";
        entry.checkedAt = "2026-09-01";
      },
      (entry: (typeof eventUpdates.entries)[number]) => {
        entry.returnDate = "2026-09-02";
        entry.checkedAt = "2026-09-01";
      },
      (entry: (typeof eventUpdates.entries)[number]) => {
        entry.sources[0]!.publishedAt = "2026-09-02";
        entry.checkedAt = "2026-09-01";
      },
    ]) {
      const changed = structuredClone(eventUpdates);
      mutate(changed.entries[0]!);
      expect(eventUpdatesSchema.safeParse(changed).success).toBe(false);
    }
  });
});
