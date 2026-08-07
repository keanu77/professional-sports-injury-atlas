import { describe, expect, it } from "vitest";

import {
  G2_LAUNCH_DEFAULT_MIN_CLASSIC_ENTRIES,
  G2_LAUNCH_MIN_ENTRIES_PER_INJURY,
  G2_LAUNCH_MIN_ENTRIES_TOTAL,
  NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID,
  validateG2ManifestComposition,
  validateG2ManifestCountFloor,
  type SourceManifestCounts,
} from "../../src/lib/research/candidate-manifest";
import {
  MIN_PUBLIC_CASES_PER_INJURY,
  MIN_PUBLIC_CASES_TOTAL,
} from "../../src/lib/governance/release-gate";

const counts = (
  acl: number,
  ankleSprain: number,
  achillesRupture: number,
  total = acl + ankleSprain + achillesRupture,
): SourceManifestCounts => ({
  byInjury: {
    acl,
    "achilles-rupture": achillesRupture,
    "ankle-sprain": ankleSprain,
  },
  total,
});

describe("G2 source-manifest count floor", () => {
  it("accepts the authorized 7 / 12 / 7 launch set at total 26", () => {
    expect(G2_LAUNCH_MIN_ENTRIES_PER_INJURY).toBe(7);
    expect(G2_LAUNCH_MIN_ENTRIES_TOTAL).toBe(26);
    expect(validateG2ManifestCountFloor("launch", counts(7, 12, 7))).toEqual(
      [],
    );
  });

  it("rejects an injury at 6 even when the launch total is 26", () => {
    expect(validateG2ManifestCountFloor("launch", counts(6, 13, 7))).toEqual([
      {
        code: "manifest-launch-injury-count-shortfall",
        message: "acl has 6 entries; the authorized G2 launch floor is 7",
        path: "counts.byInjury.acl",
      },
    ]);
  });

  it("rejects total 25 when every injury independently reaches 7", () => {
    expect(validateG2ManifestCountFloor("launch", counts(7, 11, 7))).toEqual([
      {
        code: "manifest-launch-total-count-shortfall",
        message: "launch has 25 entries; the authorized G2 floor is 26",
        path: "counts.total",
      },
    ]);
  });

  it("allows launch counts above both floors without an upper limit", () => {
    expect(validateG2ManifestCountFloor("launch", counts(8, 12, 7))).toEqual(
      [],
    );
  });

  it.each(["quarterly", "correction"] as const)(
    "does not apply the launch floor to a %s batch",
    (batchType) => {
      expect(validateG2ManifestCountFloor(batchType, counts(0, 0, 0))).toEqual(
        [],
      );
    },
  );

  it("does not lower the separate public-release corpus gate", () => {
    expect(MIN_PUBLIC_CASES_PER_INJURY).toBe(10);
    expect(MIN_PUBLIC_CASES_TOTAL).toBe(30);
  });
});

describe("G2 source-manifest classic composition", () => {
  it("accepts zero classic entries only for the authorized launch manifest", () => {
    expect(NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID).toBe(
      "NBA-SOURCE-2026-08-06-001",
    );
    expect(
      validateG2ManifestComposition(
        NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID,
        "launch",
        { classic: 0, recent: 26 },
      ),
    ).toEqual([]);
  });

  it("keeps the default one-classic floor for every other launch manifest", () => {
    expect(G2_LAUNCH_DEFAULT_MIN_CLASSIC_ENTRIES).toBe(1);
    expect(
      validateG2ManifestComposition("NBA-SOURCE-2026-11-01-001", "launch", {
        classic: 0,
        recent: 26,
      }),
    ).toEqual([
      {
        code: "manifest-launch-classic-count-shortfall",
        message:
          "launch NBA-SOURCE-2026-11-01-001 has 0 classic entries; the G2 launch floor is 1",
        path: "counts.classic",
      },
    ]);
  });

  it("still requires recent entries to outnumber classic entries", () => {
    expect(
      validateG2ManifestComposition(
        NBA_LAUNCH_ZERO_CLASSIC_MANIFEST_ID,
        "launch",
        { classic: 13, recent: 13 },
      ),
    ).toEqual([
      {
        code: "manifest-launch-recent-not-greater-than-classic",
        message:
          "launch has 13 recent and 13 classic entries; recent entries must outnumber classic entries",
        path: "counts.recent",
      },
    ]);
  });

  it.each(["quarterly", "correction"] as const)(
    "does not apply launch composition gates to a %s batch",
    (batchType) => {
      expect(
        validateG2ManifestComposition("NBA-SOURCE-2026-11-01-001", batchType, {
          classic: 0,
          recent: 0,
        }),
      ).toEqual([]);
    },
  );
});
