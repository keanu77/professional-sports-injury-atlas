/**
 * Pure filter-engine tests over fictional in-memory index entries. Every
 * dimension from the plan is covered: athlete/team keyword, derived event
 * year, season, year+season independently and together, sport, league,
 * injury, controlled mechanism codes and aliases, classic,
 * diagnosis-confirmation status, private workflow status (each independently
 * and together, with distinct meanings), compound filters, reset, and zero
 * results.
 */

import { describe, expect, it } from "vitest";
import type { CaseIndexEntry } from "../../src/lib/cases/pagination";
import {
  applyCaseFilters,
  emptyFilterState,
  isEmptyFilterState,
  neededInjuryCodes,
  parseFilterQuery,
  resolveMechanismToken,
  serializeFilterQuery,
  type CaseFilterState,
} from "../../src/scripts/case-filters";

function makeEntry(overrides: Partial<CaseIndexEntry>): CaseIndexEntry {
  return {
    id: "CASE-FIC-2026-001",
    slug: "fictional-forward-alpha",
    injuryCode: "ankle-sprain",
    sportCode: "basketball",
    leagueCode: "nba",
    competitionCode: "nba-regular-season",
    season: "2025-26",
    eventYear: 2026,
    eventDate: "2026-01-15",
    athleteName: "Fictional Forward Alpha",
    teamName: "Fictional Metro Comets",
    opponentName: "Fictional Harbor Gulls",
    isClassic: false,
    classicReason: null,
    mechanismTags: ["inversion-landing"],
    videoSource: "youtube-embed",
    confirmationStatus: "confirmed",
    workflowStatus: "medical-review",
    ...overrides,
  };
}

const alphaAnkle = makeEntry({});
const betaClassicAcl = makeEntry({
  id: "CASE-FIC-2014-002",
  slug: "fictional-guard-beta",
  injuryCode: "acl",
  season: "2013-14",
  eventYear: 2014,
  eventDate: "2014-03-02",
  athleteName: "Fictional Guard Beta",
  teamName: "Fictional Riverport Foxes",
  opponentName: "Fictional Summit Owls",
  isClassic: true,
  classicReason: "Fictional classic teaching example.",
  mechanismTags: ["non-contact-cut"],
  videoSource: "nba-plain-text-citation",
  confirmationStatus: "confirmed",
  workflowStatus: "approved",
});
const gammaUnconfirmed = makeEntry({
  id: "CASE-FIC-2026-003",
  slug: "fictional-center-gamma",
  injuryCode: "achilles-rupture",
  season: "2025-26",
  eventYear: 2026,
  eventDate: "2026-02-01",
  athleteName: "Fictional Center Gamma",
  teamName: "Fictional Coast Sharks",
  opponentName: "Fictional Valley Hawks",
  mechanismTags: ["push-off-acceleration"],
  videoSource: "external-link",
  confirmationStatus: "unconfirmed",
  workflowStatus: "draft",
});
const entries = [alphaAnkle, betaClassicAcl, gammaUnconfirmed];

const withState = (overrides: Partial<CaseFilterState>): CaseFilterState => ({
  ...emptyFilterState(),
  ...overrides,
});

describe("applyCaseFilters", () => {
  it("matches athlete and team keywords case-insensitively", () => {
    expect(
      applyCaseFilters(entries, withState({ keyword: "guard beta" })),
    ).toEqual([betaClassicAcl]);
    expect(
      applyCaseFilters(entries, withState({ keyword: "metro comets" })),
    ).toEqual([alphaAnkle]);
    expect(
      applyCaseFilters(entries, withState({ keyword: "valley hawks" })),
    ).toEqual([gammaUnconfirmed]);
  });

  it("filters by derived event year and by season independently", () => {
    expect(applyCaseFilters(entries, withState({ eventYear: 2014 }))).toEqual([
      betaClassicAcl,
    ]);
    expect(applyCaseFilters(entries, withState({ season: "2025-26" }))).toEqual(
      [alphaAnkle, gammaUnconfirmed],
    );
  });

  it("combines event year and season", () => {
    expect(
      applyCaseFilters(
        entries,
        withState({ eventYear: 2026, season: "2025-26" }),
      ),
    ).toEqual([alphaAnkle, gammaUnconfirmed]);
    expect(
      applyCaseFilters(
        entries,
        withState({ eventYear: 2014, season: "2025-26" }),
      ),
    ).toEqual([]);
  });

  it("filters by sport, league, and injury", () => {
    expect(
      applyCaseFilters(entries, withState({ sport: "basketball" })),
    ).toHaveLength(3);
    expect(applyCaseFilters(entries, withState({ sport: "handball" }))).toEqual(
      [],
    );
    expect(
      applyCaseFilters(entries, withState({ league: "nba" })),
    ).toHaveLength(3);
    expect(applyCaseFilters(entries, withState({ league: "mlb" }))).toEqual([]);
    expect(applyCaseFilters(entries, withState({ injury: "acl" }))).toEqual([
      betaClassicAcl,
    ]);
  });

  it("filters by controlled mechanism codes and registered aliases", () => {
    expect(
      applyCaseFilters(entries, withState({ mechanism: "non-contact-cut" })),
    ).toEqual([betaClassicAcl]);
    expect(applyCaseFilters(entries, withState({ mechanism: "變向" }))).toEqual(
      [betaClassicAcl],
    );
    expect(applyCaseFilters(entries, withState({ mechanism: "翻船" }))).toEqual(
      [alphaAnkle],
    );
    expect(
      applyCaseFilters(entries, withState({ mechanism: "not-a-mechanism" })),
    ).toEqual([]);
  });

  it("filters classic cases only", () => {
    expect(applyCaseFilters(entries, withState({ classicOnly: true }))).toEqual(
      [betaClassicAcl],
    );
  });

  it("filters by the controlled video-source token", () => {
    expect(
      applyCaseFilters(entries, withState({ videoSource: "youtube-embed" })),
    ).toEqual([alphaAnkle]);
    expect(
      applyCaseFilters(
        entries,
        withState({ videoSource: "nba-plain-text-citation" }),
      ),
    ).toEqual([betaClassicAcl]);
    expect(
      applyCaseFilters(entries, withState({ videoSource: "external-link" })),
    ).toEqual([gammaUnconfirmed]);
    expect(
      applyCaseFilters(entries, withState({ videoSource: "not-a-source" })),
    ).toEqual([]);
  });

  it("filters the two status dimensions independently and together", () => {
    expect(
      applyCaseFilters(
        entries,
        withState({ confirmationStatus: "unconfirmed" }),
      ),
    ).toEqual([gammaUnconfirmed]);
    expect(
      applyCaseFilters(entries, withState({ workflowStatus: "approved" })),
    ).toEqual([betaClassicAcl]);
    expect(
      applyCaseFilters(
        entries,
        withState({
          confirmationStatus: "confirmed",
          workflowStatus: "medical-review",
        }),
      ),
    ).toEqual([alphaAnkle]);
  });

  it("never substitutes one status meaning for the other", () => {
    // A confirmed-diagnosis case in medical-review workflow must not match a
    // workflow filter of "confirmed" nor a confirmation filter of
    // "medical-review".
    expect(
      applyCaseFilters(
        [alphaAnkle],
        withState({ workflowStatus: "confirmed" }),
      ),
    ).toEqual([]);
    expect(
      applyCaseFilters(
        [alphaAnkle],
        withState({ confirmationStatus: "medical-review" }),
      ),
    ).toEqual([]);
  });

  it("applies compound filters across dimensions", () => {
    const compound = withState({
      keyword: "fictional",
      eventYear: 2014,
      season: "2013-14",
      sport: "basketball",
      league: "nba",
      injury: "acl",
      mechanism: "cutting",
      videoSource: "nba-plain-text-citation",
      classicOnly: true,
      confirmationStatus: "confirmed",
      workflowStatus: "approved",
    });
    expect(applyCaseFilters(entries, compound)).toEqual([betaClassicAcl]);
  });

  it("returns everything for the reset (empty) state and supports zero results", () => {
    expect(applyCaseFilters(entries, emptyFilterState())).toHaveLength(3);
    expect(isEmptyFilterState(emptyFilterState())).toBe(true);
    const zero = applyCaseFilters(
      entries,
      withState({ keyword: "no such athlete anywhere" }),
    );
    expect(zero).toEqual([]);
  });

  it("public entries without workflowStatus never match a workflow filter", () => {
    const publicEntry = makeEntry({});
    delete publicEntry.workflowStatus;
    expect(
      applyCaseFilters(
        [publicEntry],
        withState({ workflowStatus: "approved" }),
      ),
    ).toEqual([]);
    expect(applyCaseFilters([publicEntry], emptyFilterState())).toEqual([
      publicEntry,
    ]);
  });
});

describe("resolveMechanismToken", () => {
  it("resolves codes, aliases, and rejects unknown or empty tokens", () => {
    expect(resolveMechanismToken("inversion-landing")).toBe(
      "inversion-landing",
    );
    expect(resolveMechanismToken("Landing")).toBe("non-contact-landing");
    expect(resolveMechanismToken("內翻")).toBe("inversion-landing");
    expect(resolveMechanismToken("")).toBeNull();
    expect(resolveMechanismToken("mystery")).toBeNull();
  });
});

describe("filter query serialization", () => {
  it("round-trips a full state through the query string", () => {
    const state = withState({
      keyword: "beta",
      eventYear: 2014,
      season: "2013-14",
      sport: "basketball",
      league: "nba",
      injury: "acl",
      mechanism: "non-contact-cut",
      videoSource: "nba-plain-text-citation",
      classicOnly: true,
      confirmationStatus: "confirmed",
      workflowStatus: "approved",
    });
    const query = serializeFilterQuery(state);
    expect(query).toBe(
      "?keyword=beta&year=2014&season=2013-14&sport=basketball&league=nba&injury=acl&mechanism=non-contact-cut&videoSource=nba-plain-text-citation&classic=1&confirmation=confirmed&workflow=approved",
    );
    expect(parseFilterQuery(query)).toEqual(state);
  });

  it("serializes the empty state to an empty string and parses invalid years away", () => {
    expect(serializeFilterQuery(emptyFilterState())).toBe("");
    expect(parseFilterQuery("")).toEqual(emptyFilterState());
    expect(parseFilterQuery("?year=abcd").eventYear).toBeNull();
  });
});

describe("neededInjuryCodes", () => {
  const manifest = {
    schemaVersion: 1 as const,
    mode: "review" as const,
    shardSize: 100,
    totalEntries: 3,
    injuries: [
      { injuryCode: "acl", entryCount: 1, shardCount: 1 },
      { injuryCode: "ankle-sprain", entryCount: 2, shardCount: 1 },
      { injuryCode: "achilles-rupture", entryCount: 0, shardCount: 0 },
    ],
  };

  it("returns only the filtered injury when set, and all listed shards otherwise", () => {
    expect(neededInjuryCodes(withState({ injury: "acl" }), manifest)).toEqual([
      "acl",
    ]);
    expect(neededInjuryCodes(emptyFilterState(), manifest)).toEqual([
      "acl",
      "ankle-sprain",
    ]);
    expect(
      neededInjuryCodes(withState({ injury: "achilles-rupture" }), manifest),
    ).toEqual([]);
  });
});
