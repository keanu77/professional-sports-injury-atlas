import { readdirSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { caseSchema } from "../../src/lib/contracts/case";
import { selectPublicCases } from "../../src/lib/cases/selectors";
import { hasPublicEmbed } from "../../src/lib/patient/featured";
import { observationClips } from "../../src/lib/videos/expansion";
import {
  caseVideoSearchText,
  observationVideoSearchText,
} from "../../src/lib/videos/search-index";
import {
  matchesVideoSearch,
  normalizeVideoSearch,
  videoSearchTerms,
} from "../../src/lib/videos/search";

afterEach(() => vi.unstubAllEnvs());
describe("video keyword search", () => {
  it("matches case, accents and full-width characters consistently", () => {
    expect(normalizeVideoSearch("  ＫＯＢＥ　Acuña  Marín  ")).toBe(
      "kobe acuna marin",
    );
    expect(videoSearchTerms("  前十字韌帶　KNEE ")).toEqual([
      "前十字韌帶",
      "knee",
    ]);
  });
  it("requires every literal keyword and treats punctuation as separators", () => {
    const text = normalizeVideoSearch("Kobe Bryant 2013 阿基里斯腱 achilles");
    expect(matchesVideoSearch(text, videoSearchTerms("KOBE 阿基里斯腱"))).toBe(
      true,
    );
    expect(matchesVideoSearch(text, videoSearchTerms("kobe 手腕"))).toBe(false);
    expect(matchesVideoSearch(text, videoSearchTerms(".*[not-found]"))).toBe(
      false,
    );
    expect(matchesVideoSearch(text, videoSearchTerms(" \t "))).toBe(true);
  });
  it("searches the complete admitted catalogue using names and attributed injury fields", () => {
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "decision-21");
    const records = readdirSync("src/content/cases")
      .filter((name) => name.endsWith(".json"))
      .map((name) =>
        caseSchema.parse(
          JSON.parse(readFileSync(`src/content/cases/${name}`, "utf8")),
        ),
      );
    const index = [
      ...selectPublicCases(records)
        .filter(hasPublicEmbed)
        .map((record) => ({
          slug: record.slug,
          text: caseVideoSearchText(record),
        })),
      ...observationClips().map((clip) => ({
        slug: clip.slug,
        text: observationVideoSearchText(clip),
      })),
    ];
    expect(index).toHaveLength(151);
    const find = (query: string) =>
      index
        .filter((entry) =>
          matchesVideoSearch(entry.text, videoSearchTerms(query)),
        )
        .map((entry) => entry.slug);
    expect(find("大谷 棒球")).toEqual(["shohei-ohtani-world-series-2024"]);
    expect(find("ＫＯＢＥ achilles")).toEqual(["kobe-bryant-2013-achilles"]);
    expect(find("tatum")).toEqual(["jayson-tatum-achilles-rupture-2025"]);
    expect(find("acuna")).toEqual(
      expect.arrayContaining([
        "ronald-acuna-miami-2021",
        "ronald-acuna-acl-2024",
      ]),
    );
    expect(find("前十字韌帶")).toContain("carolina-marin-indonesia-2019");
    expect(find("nobody-with-this-name")).toEqual([]);
    expect(
      index.some((entry) =>
        entry.text.includes("sourceprovenanceverification"),
      ),
    ).toBe(false);
  });
});
