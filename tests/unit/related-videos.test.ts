import { readdirSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { caseSchema } from "../../src/lib/contracts/case";
import { permittedCasesForMode } from "../../src/lib/cases/pagination";
import { hasPublicEmbed } from "../../src/lib/patient/featured";
import {
  allObservationClips,
  observationClips,
  type ObservationClip,
} from "../../src/lib/videos/expansion";
import {
  caseCategoryLinks,
  relatedVideosFor,
  type RelatedVideo,
} from "../../src/lib/videos/related-videos";

const clipFor = (slug: string) =>
  allObservationClips.find((clip) => clip.slug === slug)!;
const asVideo = (clip: ObservationClip): RelatedVideo => ({
  kind: "observation",
  clip,
});
const records = readdirSync("src/content/cases")
  .filter((name) => name.endsWith(".json"))
  .map((name) =>
    caseSchema.parse(
      JSON.parse(readFileSync(`src/content/cases/${name}`, "utf8")),
    ),
  );
afterEach(() => vi.unstubAllEnvs());

describe("related videos across the permitted catalog", () => {
  it("uses sport and situation within a body-part group, rather than one alphabetical top three", () => {
    const slugs = [
      "carolina-marin-indonesia-2019",
      "giannis-east-final-2021",
      "markelle-fultz-orlando-2021",
      "ronald-acuna-miami-2021",
    ];
    const results = slugs.map((slug) =>
      relatedVideosFor(
        asVideo(clipFor(slug)),
        allObservationClips.map(asVideo),
      ),
    );
    expect(
      new Set(
        results.map((matches) => matches.map((match) => match.slug).join(",")),
      ).size,
    ).toBeGreaterThan(1);
    const acuna = results.at(-1)!;
    expect(acuna[0]!.reasons).toContain("同部位：膝蓋");
    expect(acuna[0]!.reasons).toContain("同運動：棒球");
    for (let index = 0; index < slugs.length; index++) {
      expect(results[index]!.map((match) => match.slug)).not.toContain(
        slugs[index],
      );
      expect(results[index]!.length).toBeLessThanOrEqual(3);
    }
  });

  it("does not treat unclear situations as a match or recommend the same source twice", () => {
    const source = {
      ...clipFor("ronald-acuna-miami-2021"),
      slug: "unknown-source",
    };
    const other = {
      ...clipFor("chris-bassitt-2021-face"),
      slug: "unknown-other",
      sport: "網球",
    };
    expect(relatedVideosFor(asVideo(source), [asVideo(other)])).toEqual([]);
    const duplicateSource = { ...source, slug: "duplicate-source" };
    const peer = {
      ...source,
      slug: "peer",
      videoUrl: "https://youtu.be/aaaaaaaaaaa",
      videoId: "aaaaaaaaaaa",
    };
    const duplicatePeer = {
      ...peer,
      slug: "duplicate-peer",
      videoUrl: "https://www.youtube.com/watch?v=aaaaaaaaaaa&t=5",
    };
    const matches = relatedVideosFor(
      asVideo(source),
      [source, duplicateSource, peer, duplicatePeer].map(asVideo),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]!.reasons).not.toContain("同情境：其他或畫面未明");
  });

  it("can continue between core and observation pages using only public selector outputs", () => {
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "decision-21");
    const permitted = permittedCasesForMode("public", records).filter(
      hasPublicEmbed,
    );
    const candidates: RelatedVideo[] = [
      ...permitted.map((record) => ({ kind: "case" as const, record })),
      ...observationClips().map(asVideo),
    ];
    let caseToObservation = false;
    let observationToCase = false;
    for (const source of candidates) {
      const matches = relatedVideosFor(source, candidates);
      for (const match of matches) {
        expect(candidates).toContain(match.video);
        if (source.kind === "case" && match.video.kind === "observation")
          caseToObservation = true;
        if (source.kind === "observation" && match.video.kind === "case")
          observationToCase = true;
      }
    }
    expect(caseToObservation).toBe(true);
    expect(observationToCase).toBe(true);
    for (const record of permitted)
      expect(caseCategoryLinks(record).map((link) => link.kind)).toEqual([
        "body-part",
        "sport",
        "situation",
      ]);
  });
});
