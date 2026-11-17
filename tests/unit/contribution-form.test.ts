import { describe, expect, it } from "vitest";
import {
  CONTRIBUTION_DRAFT_TTL_MS,
  contributionErrors,
  parseContributionDraft,
  type ContributionFields,
} from "../../src/lib/video/contribution-form";

const fields: ContributionFields = {
  type: "video",
  url: "",
  note: "",
  sources: "",
};
const now = Date.UTC(2026, 10, 18);
const draft = {
  ...fields,
  note: "查核公開影片",
  version: 1,
  scope: "",
  savedAt: now - 1000,
  deliveryUncertain: false,
};

describe("contribution field guidance", () => {
  it("identifies all invalid correction fields together", () => {
    expect(
      contributionErrors({
        ...fields,
        type: "correction",
        url: "bad URL",
        note: "太短",
        sources: "not a URL",
      }),
    ).toEqual({
      url: "請填寫有效的公開網址。",
      note: "請提供至少 5 個字的修正說明。",
      sources: "參考來源請填寫有效的公開網址，每行一個，最多 3 個。",
    });
  });
  it("requires substantive content but permits a valid source alone", () => {
    expect(contributionErrors({ ...fields, note: " \n　" })).toHaveProperty(
      "note",
    );
    expect(
      contributionErrors({ ...fields, sources: "https://example.org/report" }),
    ).toEqual({});
  });
  it("requires a reference link even with explanatory text", () => {
    expect(
      contributionErrors({ ...fields, type: "reference", note: "文章推薦" }),
    ).toHaveProperty("url");
    expect(
      contributionErrors({
        ...fields,
        type: "reference",
        sources: "https://doi.org/10.1234/example",
      }),
    ).toEqual({});
  });
  it("rejects extra or private source URLs", () => {
    expect(
      contributionErrors({
        ...fields,
        sources: Array(4).fill("https://example.org").join("\n"),
      }),
    ).toHaveProperty("sources");
    expect(
      contributionErrors({ ...fields, url: "http://127.0.0.1/internal" }),
    ).toHaveProperty("url");
  });
});

describe("bounded same-tab draft restoration", () => {
  it("restores only matching recent content and preserves uncertain delivery", () => {
    const saved = { ...draft, deliveryUncertain: true };
    expect(parseContributionDraft(JSON.stringify(saved), "", now)).toEqual(
      saved,
    );
    expect(
      parseContributionDraft(
        JSON.stringify(saved),
        "https://injury.sportsmedicine.tw/",
        now,
      ),
    ).toBeNull();
  });
  it.each([
    { savedAt: now - CONTRIBUTION_DRAFT_TTL_MS },
    { savedAt: now + 1 },
    { savedAt: "yesterday" },
    { version: 2 },
    { type: 'video"]' },
    { deliveryUncertain: "false" },
    { note: "x".repeat(2001) },
    { url: "x".repeat(2049) },
    { sources: "x".repeat(3001) },
    { note: "secret\u0000" },
    { turnstileToken: "do-not-store" },
    { website: "honeypot" },
    { email: "do-not-store@example.org" },
  ])("rejects expired, malformed or extra fields %#", (change) => {
    expect(
      parseContributionDraft(JSON.stringify({ ...draft, ...change }), "", now),
    ).toBeNull();
  });
  it.each([null, "", "invalid", "null", "[]", "x".repeat(30001)])(
    "ignores invalid storage %#",
    (raw) => {
      expect(parseContributionDraft(raw, "", now)).toBeNull();
    },
  );
});
