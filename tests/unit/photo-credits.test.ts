import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type {
  PlayerPhotoCommonsSelectionV5,
  PlayerPhotoSelectionV5,
} from "../../src/lib/contracts/player-photo-registry-v5";
import {
  assetCreditAnchor,
  assetCreditHref,
  currentPhotoCredits,
  photoCreditPresentation,
} from "../../src/lib/rights/photo-credits";

const registry = JSON.parse(
  readFileSync(
    new URL(
      "../../src/assets/players/player-photo-registry.v5.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { selections: PlayerPhotoSelectionV5[] };
const commonsSelections = registry.selections.filter(
  (selection): selection is PlayerPhotoCommonsSelectionV5 =>
    selection.coverKind === "commons-photo",
);

describe("central asset credits", () => {
  it("derives five unique stable rows from the current registry", () => {
    expect(currentPhotoCredits).toHaveLength(5);
    expect(currentPhotoCredits.map(({ anchorId }) => anchorId)).toEqual(
      commonsSelections.map(({ sourceRevision }) =>
        assetCreditAnchor(sourceRevision.id),
      ),
    );
    expect(
      new Set(currentPhotoCredits.map(({ anchorId }) => anchorId)).size,
    ).toBe(5);
    expect(assetCreditHref(1235995897)).toBe(
      "/credits-notices/#photo-credit-1235995897",
    );
  });

  it("keeps Kevin Durant and LeBron James title-not-supplied states visible", () => {
    for (const athleteName of ["Kevin Durant", "LeBron James"]) {
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
    const cc0Fixture: PlayerPhotoCommonsSelectionV5 = {
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
