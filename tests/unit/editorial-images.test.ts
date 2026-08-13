import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  caseImageFor,
  playerPhotoRegistry,
} from "../../src/lib/ui/editorial-images";
import { isDecision15PhotoSelectionV7 } from "../../src/lib/contracts/player-photo-registry-v7";
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
      playerPhotoRegistry.selections.filter(isDecision15PhotoSelectionV7),
    ).toHaveLength(14);
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

  it("resolves all fourteen Decision 15 photos with v8 and exact PD/ShareAlike modes", () => {
    const promoted = playerPhotoRegistry.selections.filter(
      isDecision15PhotoSelectionV7,
    );
    expect(promoted).toHaveLength(14);
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
