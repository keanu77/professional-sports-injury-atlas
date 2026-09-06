import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { caseSchema } from "../../src/lib/contracts/case";
import { allObservationClips } from "../../src/lib/videos/expansion";
import { videosBySport } from "../../src/lib/videos/sports";

const basketballCase = caseSchema.parse(
  JSON.parse(
    readFileSync(
      "src/content/cases/jayson-tatum-achilles-rupture-2025.json",
      "utf8",
    ),
  ),
);

describe("sport browsing coverage", () => {
  it("gives every published observation exactly one sport destination", () => {
    const groups = videosBySport([basketballCase], allObservationClips);
    expect(
      groups.flatMap((group) => group.clips.map((clip) => clip.slug)).sort(),
    ).toEqual(allObservationClips.map((clip) => clip.slug).sort());
    expect(
      groups.flatMap((group) => group.cases.map((record) => record.id)),
    ).toEqual([basketballCase.id]);
    expect(groups.every((group) => group.count > 0)).toBe(true);
  });

  it("provides cricket navigation for a clip without inventing a case or diagnosis", () => {
    const cricketClip = {
      ...allObservationClips[0]!,
      slug: "cricket-navigation-fixture",
      sport: "板球",
    };
    const groups = videosBySport([basketballCase], [cricketClip]);
    expect(groups.map((group) => group.code)).toEqual([
      "basketball",
      "cricket",
    ]);
    expect(groups.find((group) => group.code === "cricket")).toEqual({
      code: "cricket",
      label: "板球",
      count: 1,
      cases: [],
      clips: [cricketClip],
    });
  });
});
