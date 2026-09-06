import { describe, expect, it } from "vitest";
import {
  eventUpdates,
  eventUpdatesSchema,
  eventUpdateFor,
  returnDays,
} from "../../src/lib/videos/event-updates";

describe("source-backed event updates", () => {
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
});
