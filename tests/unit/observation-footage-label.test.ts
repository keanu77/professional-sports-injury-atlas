import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { observationFootageLabel } from "../../src/lib/videos/observation-card";

const observationCardSource = readFileSync(
  "src/components/atlas/ObservationCard.astro",
  "utf8",
);
const observationPageSource = readFileSync(
  "src/pages/videos/[slug].astro",
  "utf8",
);

describe("observation footage labels", () => {
  it("uses a neutral label when footage type is unknown", () => {
    expect(observationFootageLabel({})).toBe("傷害相關影片（片型待核）");
  });

  it.each([
    ["injury-motion", "受傷動作觀察"],
    ["aftermath", "受傷後處理與續賽"],
    ["news-analysis", "傷勢新聞與說明"],
    ["athlete-interview", "選手訪談與傷勢說明"],
  ] as const)("labels %s footage honestly", (footageKind, expected) => {
    expect(observationFootageLabel({ footageKind })).toBe(expected);
  });

  it("marks missing footage type as unknown in card and detail data attributes", () => {
    expect(observationCardSource).toContain(
      'data-observation-footage-kind={clip.footageKind ?? "unknown"}',
    );
    expect(observationPageSource).toContain(
      'data-footage-kind={clip.footageKind ?? "unknown"}',
    );
  });
});
