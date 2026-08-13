import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  caseImageFor,
  playerPhotoRegistry,
} from "../../src/lib/ui/editorial-images";
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
    ).toHaveLength(5);
    expect(
      playerPhotoRegistry.selections.filter(
        (selection) => selection.coverKind === "original-svg-fallback",
      ),
    ).toHaveLength(16);
    expect(
      playerPhotoRegistry.selections
        .filter((selection) => selection.coverKind === "commons-photo")
        .every(
          (selection) =>
            selection.sourceRiskClassification.category ===
              "non-event-low-risk" &&
            selection.sourceRiskClassification.nonClearanceStatement ===
              "Low risk is not rights clearance or public-release approval.",
        ),
    ).toBe(true);
    expect(
      playerPhotoRegistry.selections
        .filter((selection) => selection.coverKind === "original-svg-fallback")
        .every(
          (selection) =>
            selection.nonEventCaption ===
            "本站原創抽象運動醫學封面；非球員照片，亦非本案例受傷當下影像",
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
