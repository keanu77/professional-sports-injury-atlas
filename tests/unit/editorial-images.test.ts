import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  caseImageFor,
  currentPlayerPhotoAssetProjection,
  playerPhotoRegistry,
} from "../../src/lib/ui/editorial-images";
import {
  isDecision15PhotoSelectionV7,
  type PlayerPhotoDecision15SelectionV7,
} from "../../src/lib/contracts/player-photo-registry-v7";
import {
  isDecision16RenditionSelectionV8,
  type PlayerPhotoSelectionV8,
} from "../../src/lib/contracts/player-photo-registry-v8";
import {
  caseHeroWidthsFor,
  caseThumbWidthsFor,
} from "../../src/lib/ui/image-renditions";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

interface CaseIdentity {
  athlete: { name: string };
  id: string;
  injury: { code: string };
}

function isUnchangedDecision15Selection(
  selection: PlayerPhotoSelectionV8,
): selection is PlayerPhotoDecision15SelectionV7 {
  if (isDecision16RenditionSelectionV8(selection)) return false;
  return isDecision15PhotoSelectionV7(selection);
}

const cases = readdirSync(join(REPO_ROOT, "src/content/cases"))
  .filter((filename) => filename.endsWith(".json"))
  .map(
    (filename) =>
      JSON.parse(
        readFileSync(join(REPO_ROOT, "src/content/cases", filename), "utf8"),
      ) as CaseIdentity,
  );

describe("case editorial image resolver", () => {
  it("resolves all 26 governed cases to 21 athlete-matched local named covers", () => {
    const resolved = cases.map((record) => ({
      athleteName: record.athlete.name,
      caseId: record.id,
      selection: caseImageFor(
        record.injury.code,
        record.id,
        record.athlete.name,
      ),
    }));

    expect(resolved).toHaveLength(26);
    expect(
      resolved.every(
        ({ athleteName, selection }) =>
          selection.kind !== "injury-theme" &&
          selection.athleteName === athleteName &&
          selection.nonEventCaption.includes("非本案例受傷當下影像"),
      ),
    ).toBe(true);
    expect(
      new Set(
        resolved.map(({ selection }) =>
          selection.kind !== "injury-theme"
            ? selection.athleteName
            : "fallback",
        ),
      ).size,
    ).toBe(21);
    expect(playerPhotoRegistry.selections).toHaveLength(21);
    expect(
      playerPhotoRegistry.selections.filter(
        (selection) => selection.coverKind === "commons-photo",
      ),
    ).toHaveLength(21);
    expect(
      resolved.filter(
        ({ selection }) => selection.kind === "licensed-player-photo",
      ),
    ).toHaveLength(26);
    expect(
      playerPhotoRegistry.selections.every(
        (selection) =>
          isDecision16RenditionSelectionV8(selection) ||
          isDecision15PhotoSelectionV7(selection) ||
          (selection.sourceRiskClassification.category ===
            "non-event-low-risk" &&
            selection.sourceRiskClassification.nonClearanceStatement ===
              "Low risk is not rights clearance or public-release approval."),
      ),
    ).toBe(true);
    expect(
      Object.fromEntries(
        playerPhotoRegistry.selections.map((selection) => [
          selection.athleteName,
          selection.nonEventCaption,
        ]),
      ),
    ).toMatchObject({
      "CJ McCollum":
        "C.J. McCollum 於 2025–26 華盛頓巫師媒體日；非本案例受傷當下影像",
      "Dwight Powell":
        "Dwight Powell 於德國—加拿大熱身賽賽前暖身；非本案例受傷當下影像",
      "Kevin Durant":
        "Kevin Durant 於 2023 DC Open 公開訪談；非本案例受傷當下影像",
      "Kyrie Irving": "Kyrie Irving 於 2016 冠軍遊行；非本案例受傷當下影像",
      "LeBron James":
        "LeBron James 於《More Than a Game》紐約公開活動；非本案例受傷當下影像",
    });
    expect(
      playerPhotoRegistry.selections.filter(
        (selection) =>
          isDecision16RenditionSelectionV8(selection) ||
          isDecision15PhotoSelectionV7(selection),
      ),
    ).toHaveLength(14);
    expect(
      playerPhotoRegistry.selections.filter(isDecision16RenditionSelectionV8),
    ).toHaveLength(1);
  });

  it("preserves both Decision 14 public-event photos with exact facts", () => {
    const expected = [
      {
        athleteName: "Damian Lillard",
        caption:
          "Damian Lillard 於 2014 年芝加哥 63rd Street Beach 世界籃球節公開舞台；非本案例受傷當下影像",
        caseId: "CASE-NBAACHILLES-2025-015",
        focalPosition: { xPercent: 28, yPercent: 35 },
        revisionId: 1195923850,
      },
      {
        athleteName: "Jayson Tatum",
        caption:
          "Jayson Tatum 於 2018 NBA 全明星週末公開訪談舞台；非本案例受傷當下影像",
        caseId: "CASE-NBAACHILLES-2025-016",
        focalPosition: { xPercent: 30, yPercent: 35 },
        revisionId: 756925233,
      },
    ] as const;

    for (const fixture of expected) {
      const registrySelection = playerPhotoRegistry.selections.find(
        ({ athleteName }) => athleteName === fixture.athleteName,
      );
      expect(registrySelection?.coverKind).toBe("commons-photo");
      if (
        registrySelection === undefined ||
        isDecision16RenditionSelectionV8(registrySelection) ||
        isDecision15PhotoSelectionV7(registrySelection)
      ) {
        continue;
      }
      expect(registrySelection.nonEventCaption).toBe(fixture.caption);
      expect(registrySelection.focalPosition).toEqual(fixture.focalPosition);
      expect(registrySelection.sourceRevision.id).toBe(fixture.revisionId);
      expect(registrySelection.occasionEvidence.category).toBe(
        "public-event-or-fan-interaction",
      );
      expect(registrySelection.photographerRiskEvidence.category).toBe(
        "independent-public-event-low-risk",
      );
      expect("eventPhoto" in registrySelection).toBe(false);

      const resolved = caseImageFor(
        "achilles-rupture",
        fixture.caseId,
        fixture.athleteName,
      );
      expect(resolved.kind).toBe("licensed-player-photo");
      if (resolved.kind !== "licensed-player-photo") continue;
      expect(resolved.nonEventCaption).toBe(fixture.caption);
      expect(resolved.focalPosition).toEqual(fixture.focalPosition);
      expect(resolved.attribution.sourceRevision.id).toBe(fixture.revisionId);
      expect(resolved.attribution.sourceRiskCategory).toBe(
        "non-event-low-risk",
      );
      expect(resolved.attribution.policyVersion).toBe("nba-v7");
    }
  });

  it("resolves the thirteen unchanged Decision 15 photos with v8 and exact PD/ShareAlike modes", () => {
    const promoted = playerPhotoRegistry.selections.filter(
      isUnchangedDecision15Selection,
    );
    expect(promoted).toHaveLength(13);
    expect(
      promoted.filter(
        (selection) =>
          selection.rightsAttribution.licenseBucket === "cc-by-sa" &&
          selection.usePolicy.mode === "placement-rendition-only",
      ),
    ).toHaveLength(7);

    for (const registrySelection of promoted) {
      const resolved = caseImageFor(
        "acl",
        registrySelection.caseIds[0]!,
        registrySelection.athleteName,
      );
      expect(resolved.kind).toBe("licensed-player-photo");
      if (resolved.kind !== "licensed-player-photo") continue;
      expect(resolved.attribution.policyVersion).toBe("nba-v8");
      expect(resolved.attribution.sourceRiskCategory).toBeNull();
      expect(resolved.attribution.usePolicyMode).toBe(
        registrySelection.usePolicy.mode,
      );
      expect(resolved.attribution.photographer).toBe(
        registrySelection.photographerIdentity.name,
      );
    }

    const murray = promoted.find(
      ({ athleteName }) => athleteName === "Dejounte Murray",
    )!;
    expect(murray.license).toBeNull();
    expect(murray.rightsAttribution.licenseBucket).toBe("public-domain");
    expect(murray.usePolicy.mode).toBe("public-domain-placement");
  });

  it("resolves Trae through the Decision 16 rendition before the compatible Decision 15 guard", () => {
    const trae = playerPhotoRegistry.selections.find(
      ({ athleteName }) => athleteName === "Trae Young",
    );
    expect(trae).toBeDefined();
    expect(isDecision16RenditionSelectionV8(trae!)).toBe(true);
    expect(trae).toHaveProperty("decision15Evidence");
    if (trae === undefined || !isDecision16RenditionSelectionV8(trae)) return;

    expect(trae.localFile).toEqual({
      byteLength: 2_390_278,
      height: 2080,
      mimeType: "image/jpeg",
      path: "src/assets/players/decision-16/trae-young.jpg",
      sha256:
        "0c7a77e45d05648b8e52e6db692086e240e883639e8a8617f36d44f70061fcaf",
      width: 2400,
    });
    expect(trae.license).toEqual({
      name: "CC BY 2.0",
      token: "cc-by-2.0",
      url: "https://creativecommons.org/licenses/by/2.0",
    });
    expect(trae.photographerIdentity.name).toBe("Erik Drost");
    expect(trae.rightsAttribution.adapterLicense).toBeNull();
    expect(trae.rightsAttribution.alterationState.disclosure).toBe(
      "Commons extraction and CropTool derivative; unmodified local original with site CSS presentation crop.",
    );
    expect(trae.decision16Rendition.localRendition.changeDisclosure).toBe(
      "The 6351×5504 Commons original was downscaled without cropping and JPEG-re-encoded to 2400×2080 for this local rendition.",
    );

    const resolved = caseImageFor(
      "ankle-sprain",
      "CASE-NBAANKLE-2021-001",
      "Trae Young",
    );
    expect(resolved.kind).toBe("licensed-player-photo");
    if (resolved.kind !== "licensed-player-photo") return;
    expect(String(resolved.image)).toBe(
      "/src/assets/players/decision-16/trae-young.jpg",
    );
    expect(resolved.attribution).toMatchObject({
      license: trae.license,
      localRenditionChangeDisclosure:
        trae.decision16Rendition.localRendition.changeDisclosure,
      nonClearanceStatement: trae.decision16Rendition.nonClearanceStatement,
      photographer: "Erik Drost",
      policyVersion: "nba-v9",
      sourceRiskCategory: null,
      upstreamAlterationDisclosure:
        trae.rightsAttribution.alterationState.disclosure,
      usePolicyMode: "ordinary-attributed-placement",
    });
  });

  it("projects all 21 registry assets one-to-one with no extra, swapped, or historical Trae import", () => {
    const registryPaths = playerPhotoRegistry.selections
      .map(({ localFile }) => localFile.path)
      .sort();
    const projectionPaths = Object.keys(
      currentPlayerPhotoAssetProjection,
    ).sort();
    const importedPaths = Object.values(currentPlayerPhotoAssetProjection).map(
      String,
    );

    expect(registryPaths).toHaveLength(21);
    expect(new Set(registryPaths).size).toBe(21);
    expect(projectionPaths).toEqual(registryPaths);
    expect(new Set(importedPaths).size).toBe(21);
    for (const localPath of registryPaths) {
      expect(String(currentPlayerPhotoAssetProjection[localPath])).toBe(
        `/${localPath}`,
      );
    }

    const currentTraePath = "src/assets/players/decision-16/trae-young.jpg";
    const historicalTraePaths = [
      "src/assets/players/trae-young.jpg",
      "src/assets/players/decision-15/trae-young.jpg",
    ] as const;
    expect(String(currentPlayerPhotoAssetProjection[currentTraePath])).toBe(
      `/${currentTraePath}`,
    );
    for (const historicalPath of historicalTraePaths) {
      expect(currentPlayerPhotoAssetProjection).not.toHaveProperty(
        historicalPath,
      );
      expect(importedPaths).not.toContain(`/${historicalPath}`);
    }

    const resolverSource = readFileSync(
      join(REPO_ROOT, "src/lib/ui/editorial-images.ts"),
      "utf8",
    );
    expect(resolverSource).toContain(
      'import traeYoungCover from "../../assets/players/decision-16/trae-young.jpg";',
    );
    expect(resolverSource).not.toMatch(
      /from "\.\.\/\.\.\/assets\/players\/(?:decision-15\/)?trae-young\.jpg"/u,
    );
    expect(resolverSource).not.toContain("import.meta.glob");
  });

  it("fails closed when a registered case omits or mismatches its athlete", () => {
    const record = cases[0]!;
    expect(() => caseImageFor(record.injury.code, record.id)).toThrow(
      /missing athlete/u,
    );
    expect(() =>
      caseImageFor(record.injury.code, record.id, "Different Athlete"),
    ).toThrow(/athlete mismatch/u);
  });

  it("retains the stable injury-theme fallback for an unregistered fixture", () => {
    const first = caseImageFor("acl", "CASE-FIXTURE-UNKNOWN");
    const second = caseImageFor("acl", "CASE-FIXTURE-UNKNOWN");
    expect(first.kind).toBe("injury-theme");
    expect(second).toEqual(first);
    expect(first.variant).toBeGreaterThanOrEqual(1);
    expect(first.variant).toBeLessThanOrEqual(4);
  });

  it("never asks Astro to upscale a narrow player photo", () => {
    expect(caseHeroWidthsFor(968)).toEqual([480, 768, 960, 968]);
    expect(caseHeroWidthsFor(1195)).toEqual([480, 768, 960, 1195]);
    expect(caseHeroWidthsFor(2063)).toEqual([480, 768, 960, 1536]);
    expect(caseThumbWidthsFor(700)).toEqual([360, 560, 700]);
    expect(caseHeroWidthsFor(320)).toEqual([320]);
  });
});
