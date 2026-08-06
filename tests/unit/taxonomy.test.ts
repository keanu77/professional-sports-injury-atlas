import { describe, expect, it } from "vitest";
import {
  defaultTaxonomyRegistries,
  validateTaxonomyRegistries,
} from "../../src/lib/contracts/taxonomy";

const clone = <T>(value: T): T => structuredClone(value);
const codesFor = (registries: any): string[] =>
  validateTaxonomyRegistries(registries).map((issue) => issue.code);

describe("taxonomy registries", () => {
  it("validates the default registries cleanly", () => {
    expect(validateTaxonomyRegistries(defaultTaxonomyRegistries)).toEqual([]);
    expect(validateTaxonomyRegistries()).toEqual([]);
  });

  it("contains exactly the initial active tokens", () => {
    expect(defaultTaxonomyRegistries.sports.map((s) => s.code)).toEqual([
      "basketball",
    ]);
    expect(defaultTaxonomyRegistries.leagues.map((l) => l.code)).toEqual([
      "nba",
    ]);
    expect(defaultTaxonomyRegistries.leagues[0]?.sportCode).toBe("basketball");
    expect(defaultTaxonomyRegistries.injuries.map((i) => i.code)).toEqual([
      "acl",
      "ankle-sprain",
      "achilles-rupture",
    ]);
    expect(defaultTaxonomyRegistries.competitions.map((c) => c.code)).toEqual([
      "nba-preseason",
      "nba-regular-season",
      "nba-play-in",
      "nba-playoffs",
      "nba-all-star",
    ]);
    expect(defaultTaxonomyRegistries.videoProviders.map((p) => p.code)).toEqual(
      ["youtube", "nba"],
    );
    expect(defaultTaxonomyRegistries.mechanisms.map((m) => m.code)).toEqual([
      "non-contact-cut",
      "non-contact-landing",
      "contact-at-knee",
      "hyperextension-visible",
      "inversion-landing",
      "contact-landing",
      "stepped-on-foot",
      "push-off-acceleration",
      "deceleration",
      "unclear",
    ]);
  });

  it("pins the provider host allowlists and embed capabilities", () => {
    const youtube = defaultTaxonomyRegistries.videoProviders.find(
      (p) => p.code === "youtube",
    )!;
    expect(youtube.allowedHosts).toEqual([
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
    ]);
    expect(youtube.allowedEmbedStatuses).toContain("verified");
    const nba = defaultTaxonomyRegistries.videoProviders.find(
      (p) => p.code === "nba",
    )!;
    expect(nba.allowedHosts).toEqual(["nba.com", "www.nba.com"]);
    expect(nba.allowedEmbedStatuses).toEqual([
      "external-link-only",
      "unavailable",
    ]);
    expect(nba.allowedEmbedStatuses).not.toContain("verified");
  });

  it("requires every mechanism entry to have labelZh, aliases, and allowed injuries", () => {
    for (const mechanism of defaultTaxonomyRegistries.mechanisms) {
      expect(mechanism.labelZh.length).toBeGreaterThan(0);
      expect(mechanism.searchAliases.length).toBeGreaterThan(0);
      expect(mechanism.allowedInjuries.length).toBeGreaterThan(0);
    }
  });

  it("rejects duplicate mechanism codes and search aliases", () => {
    const dupCode = clone(defaultTaxonomyRegistries) as any;
    dupCode.mechanisms.push({ ...dupCode.mechanisms[0] });
    expect(codesFor(dupCode)).toContain("taxonomy-duplicate");

    const dupAlias = clone(defaultTaxonomyRegistries) as any;
    dupAlias.mechanisms[1].searchAliases = [
      ...dupAlias.mechanisms[1].searchAliases,
      dupAlias.mechanisms[0].searchAliases[0],
    ];
    expect(codesFor(dupAlias)).toContain("taxonomy-duplicate-alias");
  });

  it("rejects diagnostic-style mechanism codes and aliases", () => {
    const diagCode = clone(defaultTaxonomyRegistries) as any;
    diagCode.mechanisms.push({
      code: "acl-tear",
      labelZh: "不合法診斷式代碼",
      searchAliases: ["fictional-alias-x"],
      allowedInjuries: ["acl"],
    });
    expect(codesFor(diagCode)).toContain("taxonomy-diagnostic-style");

    const diagAlias = clone(defaultTaxonomyRegistries) as any;
    diagAlias.mechanisms[0].searchAliases = ["ligament rupture"];
    expect(codesFor(diagAlias)).toContain("taxonomy-diagnostic-style");
  });

  it("rejects mechanisms that allow unknown injuries", () => {
    const registries = clone(defaultTaxonomyRegistries) as any;
    registries.mechanisms[0].allowedInjuries = ["acl", "hamstring-strain"];
    expect(codesFor(registries)).toContain("taxonomy-unknown-reference");
  });

  it("rejects leagues and competitions with dangling references", () => {
    const badLeague = clone(defaultTaxonomyRegistries) as any;
    badLeague.leagues.push({
      code: "fictional-league",
      sportCode: "cricket",
      labelZh: "虛構聯盟",
      seasonForm: "two-year",
    });
    expect(codesFor(badLeague)).toContain("taxonomy-unknown-reference");

    const badCompetition = clone(defaultTaxonomyRegistries) as any;
    badCompetition.competitions.push({
      code: "fictional-cup",
      leagueCode: "fictional-league",
      labelZh: "虛構盃",
    });
    expect(codesFor(badCompetition)).toContain("taxonomy-unknown-reference");
  });

  it("rejects providers that allow embedding without embed capability", () => {
    const registries = clone(defaultTaxonomyRegistries) as any;
    const nba = registries.videoProviders.find((p: any) => p.code === "nba");
    nba.allowedEmbedStatuses = [
      "verified",
      "external-link-only",
      "unavailable",
    ];
    expect(codesFor(registries)).toContain("taxonomy-embed-capability");
  });
});
