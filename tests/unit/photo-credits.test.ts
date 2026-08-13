import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type {
  PlayerPhotoCommonsSelectionV6,
  PlayerPhotoSelectionV6,
} from "../../src/lib/contracts/player-photo-registry-v6";
import {
  assetCreditAnchor,
  assetCreditHref,
  currentPhotoCredits,
  photoCreditPresentation,
} from "../../src/lib/rights/photo-credits";

const registry = JSON.parse(
  readFileSync(
    new URL(
      "../../src/assets/players/player-photo-registry.v6.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { selections: PlayerPhotoSelectionV6[] };
const commonsSelections = registry.selections.filter(
  (selection): selection is PlayerPhotoCommonsSelectionV6 =>
    selection.coverKind === "commons-photo",
);

describe("central asset credits", () => {
  it("derives seven unique stable rows from the current registry", () => {
    expect(currentPhotoCredits).toHaveLength(7);
    expect(currentPhotoCredits.map(({ anchorId }) => anchorId)).toEqual(
      commonsSelections.map(({ sourceRevision }) =>
        assetCreditAnchor(sourceRevision.id),
      ),
    );
    expect(
      new Set(currentPhotoCredits.map(({ anchorId }) => anchorId)).size,
    ).toBe(7);
    expect(assetCreditHref(1235995897)).toBe(
      "/credits-notices/#photo-credit-1235995897",
    );
    expect(assetCreditHref(1195923850)).toBe(
      "/credits-notices/#photo-credit-1195923850",
    );
    expect(assetCreditHref(756925233)).toBe(
      "/credits-notices/#photo-credit-756925233",
    );
  });

  it("keeps every title-not-supplied state visible", () => {
    for (const athleteName of [
      "Damian Lillard",
      "Jayson Tatum",
      "Kevin Durant",
      "LeBron James",
    ]) {
      const credit = currentPhotoCredits.find(
        ({ selection }) => selection.athleteName === athleteName,
      );
      expect(credit).toBeDefined();
      expect(credit!.selection.rightsAttribution.workTitle.status).toBe(
        "not-supplied",
      );
      expect(credit!.workTitleText).toBeNull();
    }
  });

  it("derives the two new exact caption, anchor, and BY-SA rows without owner-risk claims", () => {
    const expected = [
      {
        anchorId: "photo-credit-1195923850",
        athleteName: "Damian Lillard",
        caption:
          "Damian Lillard 於 2014 年芝加哥 63rd Street Beach 世界籃球節公開舞台；非本案例受傷當下影像",
      },
      {
        anchorId: "photo-credit-756925233",
        athleteName: "Jayson Tatum",
        caption:
          "Jayson Tatum 於 2018 NBA 全明星週末公開訪談舞台；非本案例受傷當下影像",
      },
    ] as const;

    for (const fixture of expected) {
      const credit = currentPhotoCredits.find(
        ({ selection }) => selection.athleteName === fixture.athleteName,
      );
      expect(credit?.anchorId).toBe(fixture.anchorId);
      expect(credit?.selection.nonEventCaption).toBe(fixture.caption);
      expect(credit?.selection.license.token).toBe("cc-by-sa-4.0");
      expect(credit?.selection.rightsAttribution.adapterLicense?.token).toBe(
        "cc-by-sa-4.0",
      );
      expect(credit?.selection.rightsAttribution.workTitle.status).toBe(
        "not-supplied",
      );
      expect(JSON.stringify(credit)).not.toContain(
        "credentialed-access-residual-risk",
      );
      expect(JSON.stringify(credit)).not.toContain(
        "Decision 14 — 放寬為具名低風險攝影者的賽場封面照",
      );
      expect(JSON.stringify(credit)).not.toContain(
        "../.claude/g2-owner-decisions.md",
      );
      expect(JSON.stringify(credit)).not.toContain(
        "Decision 14 accepts a bounded credentialed-access residual risk",
      );
    }
  });

  it("keeps CC BY and CC BY-SA presentation templates distinct", () => {
    const by = photoCreditPresentation(
      commonsSelections.find(
        ({ athleteName }) => athleteName === "Kyrie Irving",
      )!,
    );
    const bySa = photoCreditPresentation(
      commonsSelections.find(
        ({ athleteName }) => athleteName === "CJ McCollum",
      )!,
    );

    expect(by.bucketLabel).toBe("姓名標示（CC BY）");
    expect(by.selection.rightsAttribution.adapterLicense).toBeNull();
    expect(bySa.bucketLabel).toBe("姓名標示—相同方式分享（CC BY-SA）");
    expect(bySa.selection.rightsAttribution.adapterLicense).not.toBeNull();
  });

  it("uses a distinct CC0 template without an Adapter's License", () => {
    const base = commonsSelections.find(
      ({ athleteName }) => athleteName === "Kyrie Irving",
    )!;
    const cc0Fixture: PlayerPhotoCommonsSelectionV6 = {
      ...base,
      athleteName: "CC0 Template Fixture",
      license: {
        name: "CC0 1.0",
        token: "cc0-1.0",
        url: "https://creativecommons.org/publicdomain/zero/1.0/",
      },
      rightsAttribution: {
        ...base.rightsAttribution,
        adapterLicense: null,
        licenseBucket: "cc0",
      },
      sourceRevision: { ...base.sourceRevision, id: 999_999_999 },
    };

    const credit = photoCreditPresentation(cc0Fixture);
    expect(credit.creatorLabel).toBe("創作者");
    expect(credit.bucketLabel).toBe("公眾領域貢獻（CC0）");
    expect(credit.selection.rightsAttribution.adapterLicense).toBeNull();
  });

  it("fails closed when an adapter license disagrees with its bucket", () => {
    const base = commonsSelections.find(
      ({ athleteName }) => athleteName === "CJ McCollum",
    )!;
    expect(() =>
      photoCreditPresentation({
        ...base,
        rightsAttribution: {
          ...base.rightsAttribution,
          adapterLicense: null,
        },
      }),
    ).toThrow("missing its Adapter's License");
  });
});
