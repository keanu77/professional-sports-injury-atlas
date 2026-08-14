import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { buildCaseIndexEntry } from "../../src/lib/cases/pagination";
import {
  deriveVideoSourceToken,
  VIDEO_SOURCE_LABELS,
  VIDEO_SOURCE_TOKENS,
} from "../../src/lib/cases/video-source";
import { caseSchema, type InjuryCase } from "../../src/lib/contracts/case";
import { DECISION_17_VIDEO_SOURCE_MEMBERSHIP } from "../../src/lib/contracts/decision-17-regression-contract";

function video(
  overrides: Partial<InjuryCase["video"]> = {},
): InjuryCase["video"] {
  const base = caseSchema.parse(
    JSON.parse(
      readFileSync(
        new URL("../fixtures/cases/valid-medical-review.json", import.meta.url),
        "utf8",
      ),
    ),
  ).video;
  return { ...base, ...overrides };
}

function realCases(): InjuryCase[] {
  const directory = new URL("../../src/content/cases/", import.meta.url);
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) =>
      caseSchema.parse(
        JSON.parse(readFileSync(new URL(name, directory), "utf8")),
      ),
    );
}

describe("Decision 17 video-source derivation", () => {
  it("exposes the exact controlled tokens and visible labels", () => {
    expect(VIDEO_SOURCE_TOKENS).toEqual([
      "youtube-embed",
      "nba-plain-text-citation",
      "external-link",
    ]);
    expect(VIDEO_SOURCE_LABELS).toEqual({
      "youtube-embed": "站內 YouTube 嵌入",
      "nba-plain-text-citation": "NBA 官網純文字引註",
      "external-link": "外部連結",
    });
  });

  it("classifies fictional YouTube embed, NBA citation, and external link facts", () => {
    expect(deriveVideoSourceToken(video())).toBe("youtube-embed");
    expect(
      deriveVideoSourceToken(
        video({
          provider: "nba",
          canonicalUrl: "https://www.nba.com/watch/video/fictional",
          embedStatus: "external-link-only",
        }),
      ),
    ).toBe("nba-plain-text-citation");
    expect(
      deriveVideoSourceToken(video({ embedStatus: "external-link-only" })),
    ).toBe("external-link");
  });

  it("fails closed on unknown or mismatched combinations", () => {
    expect(() =>
      deriveVideoSourceToken(video({ provider: "unknown-provider" })),
    ).toThrow(/unexpected/);
    expect(() =>
      deriveVideoSourceToken(
        video({ canonicalUrl: "https://example.com/fictional" }),
      ),
    ).toThrow(/unexpected/);
    expect(() =>
      deriveVideoSourceToken(video({ embedStatus: "unavailable" })),
    ).toThrow(/unclassified/);
    expect(() =>
      deriveVideoSourceToken(
        video({
          provider: "youtube",
          canonicalUrl: "https://www.nba.com/watch/video/fictional",
        }),
      ),
    ).toThrow(/unexpected|requires/);
  });

  it("reproduces the exact real 7/18/1 membership", () => {
    const membership: Record<string, string[]> = Object.fromEntries(
      VIDEO_SOURCE_TOKENS.map((token) => [token, []]),
    );
    for (const record of realCases()) {
      membership[deriveVideoSourceToken(record.video)]!.push(record.slug);
    }
    expect(membership).toEqual(DECISION_17_VIDEO_SOURCE_MEMBERSHIP);
  });

  it("puts only the NBA token, never an NBA URL, in all 18 NBA index rows", () => {
    const entries = realCases().map((record) =>
      buildCaseIndexEntry(record, "review"),
    );
    const nbaEntries = entries.filter(
      (entry) => entry.videoSource === "nba-plain-text-citation",
    );
    expect(nbaEntries).toHaveLength(18);
    expect(JSON.stringify(nbaEntries)).not.toMatch(/nba\.com/iu);
    expect(nbaEntries.every((entry) => !Object.hasOwn(entry, "url"))).toBe(
      true,
    );
  });
});
