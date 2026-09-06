import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  additions,
  curation,
  curationSchema,
  additionsSchema,
  expansion,
  expansionSchema,
  observationClips,
  captionsOptionalFor,
  expandedCaseAllowed,
} from "../../src/lib/videos/expansion";
import { selectPublicCases } from "../../src/lib/cases/selectors";
import { hasPublicEmbed } from "../../src/lib/patient/featured";
import { caseSchema } from "../../src/lib/contracts/case";
import { resolvePlayerPresentation } from "../../src/lib/video/player-state";
const tatum = caseSchema.parse(
  JSON.parse(
    readFileSync(
      "src/content/cases/jayson-tatum-achilles-rupture-2025.json",
      "utf8",
    ),
  ),
);
afterEach(() => vi.unstubAllEnvs());
describe("confirmed video expansion", () => {
  it("keeps the historical caption and selection policies without expansion", () => {
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "");
    expect(observationClips()).toEqual([]);
    expect(captionsOptionalFor(tatum.video.canonicalUrl)).toBe(false);
    expect(hasPublicEmbed(tatum)).toBe(false);
    expect(selectPublicCases([tatum])).toEqual([]);
  });
  it("publishes the unchanged approved case without requiring subtitles", () => {
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "decision-21");
    expect(tatum.video.captionStatus).not.toBe("available");
    expect(expandedCaseAllowed(tatum)).toBe(true);
    expect(hasPublicEmbed(tatum)).toBe(true);
    expect(selectPublicCases([tatum])).toEqual([tatum]);
    expect(observationClips()).toHaveLength(10 + curation.clips.length);
    expect(
      captionsOptionalFor("https://www.youtube.com/watch?v=unlisted000"),
    ).toBe(false);
  });
  it("rejects altered source facts and unapproved clinical records", () => {
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "decision-21");
    const changed = structuredClone(tatum);
    changed.general.confirmedUpdate = "changed";
    expect(selectPublicCases([changed])).toEqual([]);
    const pending = structuredClone(tatum);
    pending.status = "medical-review";
    expect(selectPublicCases([pending])).toEqual([]);
    const missing = structuredClone(tatum);
    missing.video.embedStatus = "unavailable";
    expect(hasPublicEmbed(missing)).toBe(false);
  });
  it("caption exception does not override unavailable or invalid providers", () => {
    const input = {
      providerCode: "youtube",
      canonicalUrl: tatum.video.canonicalUrl,
      captionStatus: "unavailable" as const,
      embedStatus: "unavailable" as const,
      displayMode: "public" as const,
      captionsOptional: true,
    };
    expect(resolvePlayerPresentation(input)).toBe("unavailable-notice");
    expect(() =>
      resolvePlayerPresentation({
        ...input,
        canonicalUrl: "https://evil.example/video",
      }),
    ).toThrow();
  });
  it("rejects duplicates, mismatched IDs, invalid timecodes and unsupported return dates", () => {
    for (const mutate of [
      (d: typeof expansion) => {
        d.clips[1]!.videoUrl = d.clips[0]!.videoUrl;
      },
      (d: typeof expansion) => {
        d.clips[0]!.videoId = "bad";
      },
      (d: typeof expansion) => {
        d.clips[0]!.startSeconds = d.clips[0]!.durationSeconds;
      },
      (d: typeof expansion) => {
        d.clips[0]!.sources = [];
      },
      (d: typeof expansion) => {
        d.clips[0]!.returnDate = "1900-01-01";
      },
    ]) {
      const changed = structuredClone(expansion);
      mutate(changed);
      expect(expansionSchema.safeParse(changed).success).toBe(false);
    }
  });
});

it("rejects additions that duplicate an existing video or imply unsupported return dates", () => {
  for (const mutate of [
    (d: typeof additions) => {
      d.clips[0]!.videoId = expansion.clips[0]!.videoId;
      d.clips[0]!.videoUrl = expansion.clips[0]!.videoUrl;
    },
    (d: typeof additions) => {
      d.clips[0]!.returnDate = "1900-01-01";
    },
    (d: typeof additions) => {
      d.clips[0]!.sources = [];
    },
  ]) {
    const changed = structuredClone(additions);
    mutate(changed);
    expect(additionsSchema.safeParse(changed).success).toBe(false);
  }
});

it("removes both anonymous clips from every public selector and rejects malformed removal scope", () => {
  vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "decision-21");
  expect(
    observationClips().some((c) =>
      curation.removedSlugs.some((s) => s === c.slug),
    ),
  ).toBe(false);
  expect(
    captionsOptionalFor("https://www.youtube.com/watch?v=tEHP_6GA6ZA"),
  ).toBe(false);
  const invalid = structuredClone(curation);
  invalid.removedSlugs[1] = invalid.removedSlugs[0]!;
  expect(curationSchema.safeParse(invalid).success).toBe(false);
  vi.unstubAllEnvs();
});
