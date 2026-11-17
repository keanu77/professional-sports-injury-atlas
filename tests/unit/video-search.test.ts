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
import {
  ATHLETE_SEARCH_ALIASES,
  athleteSearchAliases,
  injurySearchAliases,
  suggestAthleteQueries,
} from "../../src/lib/videos/search-aliases";

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
    expect(index).toHaveLength(203);
    const find = (query: string) =>
      index
        .filter((entry) =>
          matchesVideoSearch(entry.text, videoSearchTerms(query)),
        )
        .map((entry) => entry.slug);
    const admittedNames = [
      ...selectPublicCases(records)
        .filter(hasPublicEmbed)
        .map((record) => ({ slug: record.slug, name: record.athlete.name })),
      ...observationClips().map((clip) => ({
        slug: clip.slug,
        name: clip.name,
      })),
    ];
    expect(ATHLETE_SEARCH_ALIASES.length).toBeGreaterThanOrEqual(30);
    for (const group of ATHLETE_SEARCH_ALIASES) {
      const expected = admittedNames
        .filter(
          (entry) =>
            normalizeVideoSearch(entry.name) ===
            normalizeVideoSearch(group.name),
        )
        .map((entry) => entry.slug)
        .sort();
      expect(expected.length, group.name).toBeGreaterThan(0);
      for (const alias of group.aliases)
        expect(find(alias).sort(), `${group.name}: ${alias}`).toEqual(expected);
    }
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
    expect(find("柯比")).toEqual(find("Kobe Bryant"));
    expect(find("納達爾 2016")).toEqual(["rafael-nadal-2016-wrist"]);
    expect(find("ACL").sort()).toEqual(find("前十字韌帶").sort());
    expect(
      suggestAthleteQueries(
        "Kobee",
        index.map((entry) => entry.text),
      ),
    ).toEqual(["Kobe Bryant"]);
    expect(
      suggestAthleteQueries(
        "Kboe",
        index.map((entry) => entry.text),
      ),
    ).toEqual(["Kobe Bryant"]);
    expect(
      suggestAthleteQueries(
        "Curry",
        index.map((entry) => entry.text),
      ),
    ).toEqual([]);
    expect(
      index.some((entry) =>
        entry.text.includes("sourceprovenanceverification"),
      ),
    ).toBe(false);
  });
  it("does not attach identity aliases to partial names or infer adjacent diagnoses", () => {
    expect(athleteSearchAliases("Kobe Bryant Jr.")).toBe("");
    expect(athleteSearchAliases("Murray")).toBe("");
    expect(athleteSearchAliases("Jamal Murray")).not.toContain("Dejounte");
    expect(injurySearchAliases("左膝 ACL 撕裂")).toContain("前十字韌帶");
    expect(injurySearchAliases("左膝ACL撕裂")).toContain("前十字韌帶");
    expect(injurySearchAliases("ACL2")).not.toContain("前十字韌帶");
    expect(injurySearchAliases("左膝後十字韌帶撕裂")).toContain("pcl");
    expect(injurySearchAliases("左膝後十字韌帶撕裂")).not.toContain("acl");
    expect(injurySearchAliases("膝部疼痛")).toBe("");
    expect(injurySearchAliases("ankle sprain")).not.toContain("fracture");
    expect(
      suggestAthleteQueries("ACLL", ["acl anterior cruciate ligament"]),
    ).toEqual([]);
    expect(suggestAthleteQueries("Kobee", [])).toEqual([]);
    expect(suggestAthleteQueries("Kobe", ["kobe bryant"])).toEqual([]);
  });
});
