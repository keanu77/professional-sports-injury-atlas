import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { PlayerPhotoCommonsSelectionV6 } from "../../src/lib/contracts/player-photo-registry-v6";
import { isDecision15PhotoSelectionV7 } from "../../src/lib/contracts/player-photo-registry-v7";
import {
  isDecision16RenditionSelectionV8,
  type PlayerPhotoSelectionV8,
} from "../../src/lib/contracts/player-photo-registry-v8";
import {
  assetCreditAnchor,
  assetCreditHref,
  currentPhotoCredits,
  photoCreditPresentation,
} from "../../src/lib/rights/photo-credits";

const registry = JSON.parse(
  readFileSync(
    new URL(
      "../../src/assets/players/player-photo-registry.v8.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { selections: PlayerPhotoSelectionV8[] };
const commonsSelections = registry.selections;

describe("central asset credits", () => {
  it("derives 21 unique stable rows from the current registry", () => {
    expect(currentPhotoCredits).toHaveLength(21);
    expect(currentPhotoCredits.map(({ anchorId }) => anchorId)).toEqual(
      commonsSelections.map(({ sourceRevision }) =>
        assetCreditAnchor(sourceRevision.id),
      ),
    );
    expect(
      new Set(currentPhotoCredits.map(({ anchorId }) => anchorId)).size,
    ).toBe(21);
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

  it("presents Trae's exact upstream credit and local rendition change as separate Decision 16 facts", () => {
    const selection = commonsSelections.find(
      ({ athleteName }) => athleteName === "Trae Young",
    );
    expect(selection).toBeDefined();
    expect(isDecision16RenditionSelectionV8(selection!)).toBe(true);
    expect(selection).toHaveProperty("decision15Evidence");
    if (
      selection === undefined ||
      !isDecision16RenditionSelectionV8(selection)
    ) {
      return;
    }

    const credit = photoCreditPresentation(selection);
    expect(credit).toMatchObject({
      anchorId: "photo-credit-1148485505",
      bucketLabel: "姓名標示（CC BY）",
      creditText: "Erik Drost",
      license: {
        isPublicDomain: false,
        name: "CC BY 2.0",
        token: "cc-by-2.0",
        url: "https://creativecommons.org/licenses/by/2.0",
      },
      localRenditionChangeDisclosure:
        "The 6351×5504 Commons original was downscaled without cropping and JPEG-re-encoded to 2400×2080 for this local rendition.",
      nonClearanceStatement:
        "Creative Commons and public-domain status address copyright only; no personality, portrait, publicity, privacy, endorsement, venue, league, team, contract, medical, legal-use, or public-release clearance is created.",
      policyVersion: "nba-v9",
      upstreamAlterationDisclosure:
        "Commons extraction and CropTool derivative; unmodified local original with site CSS presentation crop.",
      workTitleEvidenceUrl:
        "https://commons.wikimedia.org/w/index.php?title=File%3ATrae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg&oldid=1148485505",
      workTitleText: "Trae Young",
    });
    expect(credit.notices.copyright).toEqual({
      sourceUrl:
        "https://commons.wikimedia.org/w/index.php?title=File%3ATrae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg&oldid=1148485505",
      status: "supplied",
      text: "Erik Drost",
    });
    expect(credit.selection.nonEventCaption).toBe(
      "Trae Young 於 2022-02-19 NBA 全明星週末；非本案例受傷當下影像",
    );
    expect(credit.selection.rightsAttribution.adapterLicense).toBeNull();

    const componentSource = readFileSync(
      new URL(
        "../../src/components/credits/PhotoCredit.astro",
        import.meta.url,
      ),
      "utf8",
    );
    expect(componentSource).toContain('data-credit-field="alteration"');
    expect(componentSource).toContain("data-alteration-scope={");
    expect(componentSource).toContain('"upstream-source-original"');
    expect(componentSource).toContain(
      'data-credit-field="local-rendition-change"',
    );
    expect(componentSource).toContain(
      'data-alteration-scope="local-rendition"',
    );
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
      expect(credit?.license.token).toBe("cc-by-sa-4.0");
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

  it("keeps Murray public domain separate from CC0 and preserves the Navy credit", () => {
    const selection = commonsSelections.find(
      ({ athleteName }) => athleteName === "Dejounte Murray",
    )!;
    expect(isDecision16RenditionSelectionV8(selection)).toBe(false);
    if (isDecision16RenditionSelectionV8(selection)) return;
    expect(isDecision15PhotoSelectionV7(selection)).toBe(true);
    const credit = photoCreditPresentation(selection);
    expect(credit.bucketLabel).toBe("公有領域（美國政府作品標示）");
    expect(credit.license).toEqual({
      isPublicDomain: true,
      name: "Public domain — PD-USGov-Military-Navy, a work of the United States Navy.",
      token: "PD-USGov-Military-Navy",
      url: "https://www.dvidshub.net/image/5148235/dejounte-murray-tours-metc",
    });
    expect(credit.creditText).toBe(
      "U.S. Navy photo by Mass Communication Specialist 2nd Class Shayla D. Hamilton/Released",
    );
    expect(credit.selection.license).toBeNull();
    expect(credit.license.name).not.toContain("CC0");
  });

  it("uses a distinct CC0 template without an Adapter's License", () => {
    const base = commonsSelections.find(
      ({ athleteName }) => athleteName === "Kyrie Irving",
    )! as PlayerPhotoCommonsSelectionV6;
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
    expect(credit.creatorLabel).toBe("署名");
    expect(credit.bucketLabel).toBe("公眾領域貢獻（CC0）");
    expect(credit.selection.rightsAttribution.adapterLicense).toBeNull();
  });

  it("fails closed when an adapter license disagrees with its bucket", () => {
    const base = commonsSelections.find(
      ({ athleteName }) => athleteName === "CJ McCollum",
    )! as PlayerPhotoCommonsSelectionV6;
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
