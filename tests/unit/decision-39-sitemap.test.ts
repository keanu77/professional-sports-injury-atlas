import { describe, expect, it } from "vitest";
import {
  publicSitemapPathnames,
  renderPublicSitemap,
} from "../../src/lib/governance/sitemap";

describe("Decision 39 public sitemap", () => {
  const builtPages = [
    "",
    "about",
    "404",
    "videos/example",
    "review/component-lab",
    "case-index/acl/1.json",
    "robots.txt",
  ];

  it("keeps generated HTML pages and excludes 404, review, and data routes", () => {
    expect(publicSitemapPathnames(builtPages)).toEqual([
      "/",
      "/about/",
      "/videos/example/",
    ]);
  });

  it("renders stable canonical URLs as XML", () => {
    const xml = renderPublicSitemap(
      ["/videos/example/", "/"],
      "https://injury.sportsmedicine.tw",
    );
    expect(xml).toContain("<loc>https://injury.sportsmedicine.tw/</loc>");
    expect(xml).toContain(
      "<loc>https://injury.sportsmedicine.tw/videos/example/</loc>",
    );
    expect(xml).not.toContain("lastmod");
  });
});
