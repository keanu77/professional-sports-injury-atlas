import { describe, expect, it } from "vitest";
import {
  matchesDiscoveryDate,
  recentTwoYearRange,
  sortDiscoveryDates,
  taipeiToday,
  validDiscoveryDate,
} from "../../src/lib/videos/discovery-time";

describe("date-only catalog discovery", () => {
  it("uses the Taiwan calendar day, including UTC midnight boundaries", () => {
    expect(taipeiToday(new Date("2026-11-17T16:00:00Z"))).toBe("2026-11-18");
    expect(taipeiToday(new Date("2026-11-17T15:59:59Z"))).toBe("2026-11-17");
  });
  it("includes both rolling two-year boundaries but excludes future and unknown events", () => {
    for (const date of ["2024-11-18", "2026-11-18"])
      expect(
        matchesDiscoveryDate(date, "recent-2y", "", "", "2026-11-18"),
      ).toBe(true);
    for (const date of ["2024-11-17", "2026-11-19", null, "2025", "2025-02-30"])
      expect(
        matchesDiscoveryDate(date, "recent-2y", "", "", "2026-11-18"),
      ).toBe(false);
    expect(recentTwoYearRange("2024-02-29")).toEqual({
      from: "2022-02-28",
      to: "2024-02-29",
    });
  });
  it("supports unknown dates and open bounds without inventing a day", () => {
    expect(matchesDiscoveryDate(null, "unknown")).toBe(true);
    expect(matchesDiscoveryDate("2025-01-01", "unknown")).toBe(false);
    expect(matchesDiscoveryDate(null, "")).toBe(true);
    expect(matchesDiscoveryDate("2025-01-01", "custom", "", "2025-01-01")).toBe(
      true,
    );
    expect(
      matchesDiscoveryDate("2025-01-01", "custom", "2025-01-02", "2025-01-01"),
    ).toBe(false);
    expect(validDiscoveryDate("2024-02-29")).toBe("2024-02-29");
    expect(validDiscoveryDate("2025-02-29")).toBe("");
  });
  it("sorts independently by event or editorial date, places unknown last and preserves ties", () => {
    const records = [
      { id: "unknown", eventDate: null, checkedAt: "2026-11-17" },
      { id: "old", eventDate: "2020-01-01", checkedAt: "2026-11-17" },
      { id: "new", eventDate: "2025-01-01", checkedAt: "2026-09-12" },
      { id: "new-tie", eventDate: "2025-01-01", checkedAt: null },
    ];
    const ids = (sort: "editorial" | "event-newest" | "updated-newest") =>
      sortDiscoveryDates(records, sort).map((row) => row.id);
    expect(ids("editorial")).toEqual(["unknown", "old", "new", "new-tie"]);
    expect(ids("event-newest")).toEqual(["new", "new-tie", "old", "unknown"]);
    expect(ids("updated-newest")).toEqual(["unknown", "old", "new", "new-tie"]);
    expect(records[0]!.id).toBe("unknown");
  });
});
