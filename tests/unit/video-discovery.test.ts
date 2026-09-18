import { readdirSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { caseSchema } from "../../src/lib/contracts/case";
import { selectPublicCases } from "../../src/lib/cases/selectors";
import { hasPublicEmbed } from "../../src/lib/patient/featured";
import { observationClips } from "../../src/lib/videos/expansion";
import {
  discovery,
  discoveryFor,
  discoverySchema,
  videosBySituation,
} from "../../src/lib/videos/discovery";
import { eventUpdateFor } from "../../src/lib/videos/event-updates";
import { videosBySport } from "../../src/lib/videos/sports";
import { readPopularVideos } from "../../src/scripts/video-discovery";

const records = readdirSync("src/content/cases")
  .filter((name) => name.endsWith(".json"))
  .map((name) =>
    caseSchema.parse(
      JSON.parse(readFileSync(`src/content/cases/${name}`, "utf8")),
    ),
  );
afterEach(() => vi.unstubAllEnvs());
describe("public discovery editorial coverage", () => {
  it("classifies every currently published video exactly once, without excluded or unreviewed extras", () => {
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "decision-21");
    const cases = selectPublicCases(records).filter(hasPublicEmbed);
    const clips = observationClips();
    const groups = videosBySituation(cases, clips);
    const published = [...cases, ...clips].map((item) => item.slug).sort();
    expect(discovery.videos.map((item) => item.slug).sort()).toEqual(published);
    expect(
      groups
        .flatMap((group) =>
          [...group.cases, ...group.clips].map((item) => item.slug),
        )
        .sort(),
    ).toEqual(published);
    expect(groups.reduce((sum, group) => sum + group.count, 0)).toBe(151);
    expect(groups).toHaveLength(7);
    const curated = discovery.videos
      .filter((item) => item.curatedRank)
      .sort((a, b) => a.curatedRank! - b.curatedRank!);
    expect(curated.map((item) => item.curatedRank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    const curatedSlugs = new Set(curated.map((item) => item.slug));
    expect(
      videosBySport(
        cases.filter((record) => curatedSlugs.has(record.slug)),
        clips.filter((clip) => curatedSlugs.has(clip.slug)),
      ),
    ).toHaveLength(8);
    for (const item of curated) {
      // Editorial choices can include both approved core cases and observations.
      const clip = clips.find((record) => record.slug === item.slug);
      const coreCase = cases.find((record) => record.slug === item.slug);
      const update = eventUpdateFor(
        item.slug,
        clip?.videoUrl ?? coreCase!.video.canonicalUrl,
        clip?.eventDate ?? coreCase!.eventDate,
      );
      expect(update?.sources.length, item.slug).toBeGreaterThanOrEqual(2);
      expect(update?.returnDate, item.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(update?.mechanism?.limitation, item.slug).toBeTruthy();
    }
  });
  it("keeps ambiguous and future observations out of inferred movement categories", () => {
    expect(discoveryFor("jayson-tatum-achilles-rupture-2025").situation).toBe(
      "unclear",
    );
    expect(discoveryFor("future-video")).toEqual({
      slug: "future-video",
      situation: "unclear",
    });
  });
  it("rejects duplicate identities and contradictory editorial order", () => {
    const duplicate = structuredClone(discovery);
    duplicate.videos.push(duplicate.videos[0]!);
    expect(discoverySchema.safeParse(duplicate).success).toBe(false);
    const ranks = structuredClone(discovery);
    const curated = ranks.videos.filter((item) => item.curatedRank);
    curated[1]!.curatedRank = curated[0]!.curatedRank;
    expect(discoverySchema.safeParse(ranks).success).toBe(false);
  });
});

describe("real popularity response handling", () => {
  const a = "9JoITljMoU0";
  const b = "8rQjyuPU_gM";
  const known = new Set([a, b]);
  const response = (items: unknown[]) => ({
    windowDays: 30,
    generatedAt: "2026-09-06T12:00:00Z",
    items,
  });
  it("ranks valid known playback counts and discards videos removed from the catalog", () => {
    expect(
      readPopularVideos(
        response([
          { videoId: a, count: 2 },
          { videoId: "2UZJNvs7G_o", count: 50 },
          { videoId: b, count: 4 },
        ]),
        known,
      ),
    ).toEqual([
      { videoId: b, count: 4 },
      { videoId: a, count: 2 },
    ]);
    expect(readPopularVideos(response([]), known)).toEqual([]);
  });
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "100", null])(
    "rejects a fabricated or invalid count %s",
    (count) => {
      expect(() =>
        readPopularVideos(response([{ videoId: a, count }]), known),
      ).toThrow();
    },
  );
  it("rejects wrong windows, malformed IDs, duplicate IDs, and invalid dates", () => {
    for (const payload of [
      null,
      {},
      { ...response([]), windowDays: 7 },
      { ...response([]), generatedAt: "unknown" },
      response([{ videoId: "<script>", count: 1 }]),
      response([
        { videoId: a, count: 1 },
        { videoId: a, count: 2 },
      ]),
    ]) {
      expect(() => readPopularVideos(payload, known)).toThrow();
    }
  });
});
