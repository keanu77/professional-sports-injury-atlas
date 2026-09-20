import { describe, expect, it } from "vitest";
import { allObservationClips } from "../../src/lib/videos/expansion";
import { observationCardMetadata } from "../../src/lib/videos/observation-card";
import {
  classifyReturnMilestone,
  eventUpdates,
} from "../../src/lib/videos/event-updates";

function update(slug: string) {
  const entry = eventUpdates.entries.find(
    (candidate) => candidate.slug === slug,
  );
  if (!entry) throw new Error(`Missing event update fixture: ${slug}`);
  return entry;
}

describe("Decision 39 observation card metadata", () => {
  it.each([
    [
      "shohei-ohtani-world-series-2024",
      { sport: "棒球", bodyPart: "肩部", eventYear: "2024" },
    ],
    [
      "chien-ming-wang-2008-foot",
      { sport: "棒球", bodyPart: "足部", eventYear: "2008" },
    ],
    [
      "julie-foucher-box-jump-2015",
      {
        sport: "CrossFit",
        bodyPart: "小腿／阿基里斯腱",
        eventYear: "日期未核定",
      },
    ],
  ])("renders fixed governed metadata for %s", (slug, expected) => {
    const clip = allObservationClips.find(
      (candidate) => candidate.slug === slug,
    );
    expect(clip).toBeDefined();
    expect(observationCardMetadata(clip!)).toEqual(expected);
  });

  it("keeps all 147 card labels non-empty and years governed", () => {
    expect(allObservationClips).toHaveLength(147);

    for (const clip of allObservationClips) {
      const metadata = observationCardMetadata(clip);
      expect(metadata.sport.trim()).not.toBe("");
      expect(metadata.bodyPart.trim()).not.toBe("");
      expect(metadata.eventYear).toMatch(/^(?:\d{4}|日期未核定)$/u);
    }
  });
});

describe("Decision 39 return milestone labels", () => {
  it.each([
    ["mitch-haniger-2017-face", "復健賽"],
    ["klay-thompson-2019-acl", "跨兩次傷害後出賽"],
    ["chien-ming-wang-2008-foot", "春訓"],
    ["john-tavares-2021-concussion", "季前賽"],
    ["shohei-ohtani-world-series-2024", "帶傷出賽"],
    ["kevin-durant-achilles-rupture-2019", "正式賽"],
    ["lamelo-ball-ankle-sprain-2023", "再次出賽"],
    ["anfernee-simons-ankle-sprain-2023", "首次出賽"],
    ["kevin-pillar-2021-face", "再次出賽"],
    ["mookie-betts-2024-hand", "再次出賽"],
  ])("classifies %s conservatively as %s", (slug, expected) => {
    expect(classifyReturnMilestone(update(slug))).toBe(expected);
  });

  it("falls back to 再次出賽 when the milestone text is uncertain", () => {
    expect(
      classifyReturnMilestone({
        slug: "uncertain-return",
        returnSummary: "已回到比賽。",
        context: "未核定這是否為首次回場。",
      }),
    ).toBe("再次出賽");
  });

  it("does not treat a generic recovery reminder as evidence of playing hurt", () => {
    expect(
      classifyReturnMilestone({
        slug: "generic-recovery-reminder",
        returnSummary: "2024-01-02 再次出賽。",
        context: "出賽不代表傷勢已痊癒。",
      }),
    ).toBe("再次出賽");
  });

  it("does not mistake the first game of a doubleheader for a first return", () => {
    expect(
      classifyReturnMilestone(update("stephen-piscotty-2015-concussion")),
    ).toBe("再次出賽");
  });
});
