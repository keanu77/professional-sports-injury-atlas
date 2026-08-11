import { describe, expect, it } from "vitest";

import {
  checkNbaPlainTextCitations,
  nbaUrlsInRedirectArtifact,
} from "../../scripts/verify-review-artifact";
import type { InjuryCase } from "../../src/lib/contracts/case";

const URL = "https://www.nba.com/watch/video/duplicate-facts";
const sources = [
  {
    id: "source-video",
    type: "video-original",
    title: "Duplicate facts",
    publisher: "NBA.com",
    publishedAt: "2026-01-01",
    url: URL,
  },
  {
    id: "source-event",
    type: "event-context",
    title: "Duplicate facts",
    publisher: "NBA.com",
    publishedAt: "2026-01-01",
    url: URL,
  },
] as const;

const record = {
  id: "CASE-FIC-2026-001",
  slug: "duplicate-citation-fixture",
  sources,
  video: { canonicalUrl: "https://www.youtube.com/watch?v=fixture" },
} as unknown as InjuryCase;

function citation(source: (typeof sources)[number]): string {
  return `<li><span data-link-policy="nba-plain-text-citation" data-citation-context="source-list" data-citation-source-id="${source.id}">${source.title}｜${source.publisher}｜${source.publishedAt}｜URL：${source.url}（${source.type}）</span></li>`;
}

function validate(body: string): string[] {
  return checkNbaPlainTextCitations(
    "/unused",
    [
      {
        path: `cases/${record.slug}/index.html`,
        html: `<!doctype html><html><head></head><body><ul>${body}</ul></body></html>`,
      },
    ],
    [record],
  ).issues.map((entry) => entry.code);
}

describe("Decision 11 built NBA citation identity", () => {
  it("accepts duplicate visible facts only when both source IDs and types exist", () => {
    expect(validate(sources.map(citation).join(""))).toEqual([]);
  });

  it("rejects a missing duplicate-facts row instead of reusing the other row", () => {
    const codes = validate(citation(sources[0]));
    expect(codes).toContain("review-nba-source-citation-count");
    expect(codes).toContain("review-nba-source-citation-missing");
  });

  it("rejects duplicate IDs and a type that does not match the governed row", () => {
    const altered = citation(sources[0]).replace(
      'source-video">Duplicate facts',
      'source-event">Duplicate facts',
    );
    const codes = validate(`${citation(sources[1])}${altered}`);
    expect(codes).toContain("review-nba-source-citation-identity");
    expect(codes).toContain("review-nba-source-citation-missing");
  });
});

describe("Decision 11 redirect artifact scanning", () => {
  it.each([
    "https://www.nba.com/",
    "//www.nba.com/watch/video/example",
    String.raw`https:\/\/www.nba.com\/watch\/video\/example`,
    String.raw`https:\u002F\u002Fwww.nba.com\u002Fnews\u002Fexample`,
  ])("rejects direct and escaped NBA redirect targets: %s", (target) => {
    expect(nbaUrlsInRedirectArtifact(`destination=${target}`)).toHaveLength(1);
  });

  it("does not overmatch spoofed or unrelated redirect targets", () => {
    expect(
      nbaUrlsInRedirectArtifact(
        "https://nba.com.example.org/x https://www.youtube.com/watch?v=x",
      ),
    ).toEqual([]);
  });
});
