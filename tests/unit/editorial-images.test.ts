import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  caseImageFor,
  playerPhotoRegistry,
} from "../../src/lib/ui/editorial-images";
import { PLAYER_PHOTO_SOURCE_RISK_DISCLAIMER } from "../../src/lib/contracts/player-photo";
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
  it("resolves all 26 governed cases to 21 athlete-matched local photos", () => {
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
          selection.kind === "licensed-player-photo" &&
          selection.athleteName === athleteName &&
          selection.attribution.nonEventCaption ===
            "球員球場資料照片；非本案例受傷當下影像",
      ),
    ).toBe(true);
    expect(
      new Set(
        resolved.map(({ selection }) =>
          selection.kind === "licensed-player-photo"
            ? selection.athleteName
            : "fallback",
        ),
      ).size,
    ).toBe(21);
    expect(playerPhotoRegistry.assets).toHaveLength(21);
    expect(
      playerPhotoRegistry.assets.filter(
        (asset) =>
          asset.sourceRiskClassification.category === "game-action-high-risk",
      ),
    ).toHaveLength(19);
    expect(
      playerPhotoRegistry.assets
        .filter(
          (asset) =>
            asset.sourceRiskClassification.category === "non-event-low-risk",
        )
        .map((asset) => asset.athleteName),
    ).toEqual(["Dwight Powell", "Trae Young"]);
    expect(
      playerPhotoRegistry.assets.every(
        (asset) =>
          asset.sourceRiskClassification.checkedAt === "2026-08-12" &&
          asset.sourceRiskClassification.basis.endsWith(
            PLAYER_PHOTO_SOURCE_RISK_DISCLAIMER,
          ) &&
          asset.sourceRiskClassification.sourceRevisionPermalink ===
            asset.rightsAttribution.sourceRevision.permalink,
      ),
    ).toBe(true);
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
