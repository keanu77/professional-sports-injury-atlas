import { describe, expect, it } from "vitest";
import {
  externalUrlPresentationFor,
  isNbaDeepUrl,
  isNbaHost,
  isNbaUrl,
} from "../../src/lib/rights/nba-link-policy";

describe("Decision 11 NBA link presentation policy", () => {
  it.each(["nba.com", "www.nba.com", "official.nba.com", "WWW.NBA.COM."])(
    "recognizes the NBA host family: %s",
    (hostname) => {
      expect(isNbaHost(hostname)).toBe(true);
    },
  );

  it.each([
    "nba.com.example.org",
    "notnba.com",
    "example.org",
    "nba.example.org",
  ])("does not overmatch another host: %s", (hostname) => {
    expect(isNbaHost(hostname)).toBe(false);
  });

  it.each([
    "https://www.nba.com/watch/video/example",
    "https://nba.com/news/example",
    "https://official.nba.com/injury-report/",
    "https://www.nba.com/?ref=atlas",
    "https://www.nba.com/#watch",
  ])("classifies NBA deep targets: %s", (url) => {
    expect(isNbaUrl(url)).toBe(true);
    expect(isNbaDeepUrl(url)).toBe(true);
    expect(externalUrlPresentationFor(url)).toBe("nba-plain-text-citation");
  });

  it("keeps even an NBA homepage fail closed until explicitly allowlisted", () => {
    expect(isNbaDeepUrl("https://www.nba.com/")).toBe(false);
    expect(externalUrlPresentationFor("https://www.nba.com/")).toBe(
      "nba-plain-text-citation",
    );
  });

  it.each([
    "https://www.youtube.com/watch?v=abc",
    "https://commons.wikimedia.org/wiki/File:Player.jpg",
  ])("leaves non-NBA values outside the NBA rule: %s", (url) => {
    expect(isNbaUrl(url)).toBe(false);
    expect(isNbaDeepUrl(url)).toBe(false);
    expect(externalUrlPresentationFor(url)).toBe("clickable-link");
  });

  it.each([
    "not a URL",
    "//www.nba.com/watch/video/example",
    "http://example.org/source",
    "https://user:secret@example.org/source",
  ])("keeps invalid or non-HTTPS values non-clickable: %s", (url) => {
    expect(externalUrlPresentationFor(url)).toBe("invalid-plain-text-citation");
  });
});
