import { describe, expect, it } from "vitest";
import { eventUpdates } from "../../src/lib/videos/event-updates";
import {
  learningComparisonHref,
  learningFor,
  validateLearningBindings,
  videoLearning,
  videoLearningSchema,
} from "../../src/lib/videos/learning";

describe("evidence-bound teaching drafts", () => {
  it("provides twenty distinct draft packages without extending clinical approval", () => {
    expect(videoLearning.entries).toHaveLength(20);
    expect(new Set(videoLearning.entries.map((entry) => entry.slug)).size).toBe(
      20,
    );
    for (const entry of videoLearning.entries) {
      expect(entry.status).toBe("editorial-draft");
      expect(entry.clinicalApproval).toBe("pending");
      expect(entry.observationQuestions).toHaveLength(2);
      expect(entry.selfChecks).toHaveLength(2);
      expect(
        videoLearning.entries.some(
          (candidate) => candidate.slug === entry.comparison.slug,
        ),
      ).toBe(true);
    }
  });
  it("never returns an unreviewed draft to the normal public build, even with showDrafts", () => {
    const entry = videoLearning.entries[0]!;
    expect(learningFor(entry.slug, entry.videoUrl)).toBeUndefined();
    expect(
      learningFor(entry.slug, entry.videoUrl, {
        showDrafts: true,
        buildMode: "public",
      }),
    ).toBeUndefined();
    expect(
      learningFor(entry.slug, entry.videoUrl, {
        showDrafts: false,
        buildMode: "review",
      }),
    ).toBeUndefined();
    expect(
      learningFor(entry.slug, entry.videoUrl, {
        showDrafts: true,
        publicPreview: true,
      }),
    ).toBeUndefined();
    expect(
      learningFor(entry.slug, entry.videoUrl, {
        showDrafts: true,
        buildMode: "review",
      }),
    ).toEqual(entry);
    expect(
      learningFor(entry.slug, entry.videoUrl, {
        showDrafts: true,
        buildMode: "public",
        publicPreview: true,
      }),
    ).toEqual(entry);
    expect(
      learningFor("future-case", "https://example.test/video", {
        showDrafts: true,
        buildMode: "review",
      }),
    ).toBeUndefined();
  });
  it("rejects a reused slug with a different video and a comparison with the wrong video", () => {
    const entry = videoLearning.entries[0]!;
    expect(() => learningFor(entry.slug, "https://example.test/other")).toThrow(
      "binding mismatch",
    );
    const changed = structuredClone(videoLearning);
    changed.entries[0]!.comparison.videoUrl = "https://example.test/other";
    expect(() => validateLearningBindings(changed)).toThrow(
      "comparison binding mismatch",
    );
  });
  it("invalidates a draft after its source wording or reference URL changes", () => {
    const events = structuredClone(eventUpdates.entries);
    const entry = videoLearning.entries[0]!;
    const event = events.find((value) => value.slug === entry.slug)!;
    event.mechanism!.limitation += " 已修改";
    expect(() => validateLearningBindings(videoLearning, events)).toThrow(
      "review draft again",
    );
    event.mechanism!.limitation = entry.basis.find(
      (basis) => basis.field === "mechanism.limitation",
    )!.text;
    const index = event.mechanism!.summary.sourceIndexes[0]!;
    event.sources[index - 1]!.url = "https://example.test/replaced-source";
    expect(() => validateLearningBindings(videoLearning, events)).toThrow(
      "review draft again",
    );
  });
  it("requires explicit answer bases and rejects fake approvals and self-comparisons", () => {
    const changed = structuredClone(videoLearning);
    changed.entries[0]!.basis = changed.entries[0]!.basis.filter(
      (item) => item.field !== "returnSummary",
    );
    expect(videoLearningSchema.safeParse(changed).success).toBe(false);
    expect(
      videoLearningSchema.safeParse({
        ...videoLearning,
        clinicalApproval: "approved",
      }).success,
    ).toBe(false);
    const same = structuredClone(videoLearning);
    same.entries[0]!.comparison = {
      ...same.entries[0]!.comparison,
      slug: same.entries[0]!.slug,
    };
    expect(videoLearningSchema.safeParse(same).success).toBe(false);
  });
  it("links comparison cases through their actual template and retains separate event identities", () => {
    const ball = videoLearning.entries.find(
      (entry) => entry.slug === "lamelo-ball-ankle-sprain-2025",
    )!;
    expect(learningComparisonHref(ball)).toBe(
      "/cases/lamelo-ball-ankle-sprain-2023/",
    );
    const watkins = videoLearning.entries.find(
      (entry) => entry.slug === "juju-watkins-2025-knee",
    )!;
    expect(learningComparisonHref(watkins)).toBe(
      "/videos/ronald-acuna-acl-2024/",
    );
  });
});
