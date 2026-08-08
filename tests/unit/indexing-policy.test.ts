import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ALLOW_ALL_ROBOTS_TXT,
  BuildModeError,
  DISALLOW_ALL_ROBOTS_TXT,
  NOINDEX_ROBOTS_META,
  resolveBuildMode,
  REVIEW_X_ROBOTS_TAG,
  robotsMetaContent,
  robotsTxtBody,
} from "../../src/lib/governance/build-mode";
import {
  validatePublicOutput,
  validateReviewOutput,
} from "../../src/lib/governance/release-gate";

const reviewPage = (extra = ""): { path: string; html: string } => ({
  path: "index.html",
  html: `<!doctype html><html><head><meta name="robots" content="${NOINDEX_ROBOTS_META}"/><title>t</title></head><body>${extra}</body></html>`,
});

const initialGovernance = JSON.parse(
  readFileSync(
    new URL("../../src/data/site-governance.v1.json", import.meta.url),
    "utf8",
  ),
);

describe("build mode", () => {
  it("defaults an absent ATLAS_BUILD_MODE to review", () => {
    expect(resolveBuildMode(undefined)).toBe("review");
  });

  it("accepts only review and public", () => {
    expect(resolveBuildMode("review")).toBe("review");
    expect(resolveBuildMode("public")).toBe("public");
  });

  it("throws on any other value", () => {
    for (const invalid of ["", "prod", "REVIEW", "Public", "staging"]) {
      expect(() => resolveBuildMode(invalid)).toThrow(BuildModeError);
    }
  });

  it("emits the exact noindex meta in review mode and none in public", () => {
    expect(robotsMetaContent("review")).toBe(
      "noindex,nofollow,noarchive,nosnippet,noimageindex",
    );
    expect(robotsMetaContent("public")).toBeNull();
  });
});

describe("robots.txt policy", () => {
  it("review mode always disallows everything", () => {
    expect(robotsTxtBody("review", initialGovernance)).toBe(
      DISALLOW_ALL_ROBOTS_TXT,
    );
    expect(robotsTxtBody("review", null)).toBe(DISALLOW_ALL_ROBOTS_TXT);
    expect(DISALLOW_ALL_ROBOTS_TXT).toBe("User-agent: *\nDisallow: /\n");
  });

  it("public mode fails closed without full authorization", () => {
    expect(robotsTxtBody("public", initialGovernance)).toBe(
      DISALLOW_ALL_ROBOTS_TXT,
    );
    expect(robotsTxtBody("public", null)).toBe(DISALLOW_ALL_ROBOTS_TXT);
    expect(
      robotsTxtBody("public", {
        siteStatus: "public-approved",
        allowIndexing: true,
        indexingAuthorization: { status: "not-requested" },
      }),
    ).toBe(DISALLOW_ALL_ROBOTS_TXT);
  });

  it("public mode allows crawling only when explicitly authorized", () => {
    expect(
      robotsTxtBody("public", {
        siteStatus: "public-approved",
        allowIndexing: true,
        indexingAuthorization: { status: "authorized" },
      }),
    ).toBe(ALLOW_ALL_ROBOTS_TXT);
  });

  it("the ops header policy declares the exact review X-Robots-Tag", () => {
    const policy = JSON.parse(
      readFileSync(
        new URL("../../ops/http-header-policy.v1.json", import.meta.url),
        "utf8",
      ),
    );
    expect(policy).toEqual({
      schemaVersion: 1,
      contractId: "atlas-private-review-http-headers-v1",
      requiredHeaders: {
        "Cache-Control": "private, no-store, max-age=0",
        Pragma: "no-cache",
        Vary: "Authorization",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
      },
      unauthorizedHeaders: {
        "WWW-Authenticate": 'Basic realm="Private review", charset="UTF-8"',
      },
      forbiddenHeaders: [
        "Content-Encoding",
        "ETag",
        "Last-Modified",
        "Location",
        "Server",
        "Set-Cookie",
      ],
    });
    expect(policy.requiredHeaders["X-Robots-Tag"]).toBe(REVIEW_X_ROBOTS_TAG);
    expect(policy).not.toHaveProperty("verified");
  });
});

describe("review output policy (condition 13)", () => {
  it("accepts a noindexed page without iframes/analytics/preconnect", () => {
    expect(validateReviewOutput([reviewPage()], ["index.html"])).toEqual([]);
  });

  it("rejects a page missing the exact noindex meta", () => {
    const page = {
      path: "index.html",
      html: "<!doctype html><html><head><title>t</title></head><body></body></html>",
    };
    expect(
      validateReviewOutput([page], ["index.html"]).map((entry) => entry.code),
    ).toContain("review-output-noindex");
  });

  it("rejects sitemap files in review output", () => {
    expect(
      validateReviewOutput(
        [reviewPage()],
        ["index.html", "sitemap-index.xml"],
      ).map((entry) => entry.code),
    ).toContain("review-output-sitemap");
  });

  it("rejects analytics in review output", () => {
    expect(
      validateReviewOutput(
        [
          reviewPage(
            '<script src="https://www.googletagmanager.com/gtag.js"></script>',
          ),
        ],
        ["index.html"],
      ).map((entry) => entry.code),
    ).toContain("review-output-analytics");
  });

  it("rejects third-party iframes in review output", () => {
    expect(
      validateReviewOutput(
        [reviewPage('<iframe src="https://www.youtube.com/embed/x"></iframe>')],
        ["index.html"],
      ).map((entry) => entry.code),
    ).toContain("review-output-iframe");
  });

  it("rejects external preconnects in review output", () => {
    const page = {
      path: "index.html",
      html: `<!doctype html><html><head><meta name="robots" content="${NOINDEX_ROBOTS_META}"/><link rel="preconnect" href="https://cdn.example.org"/></head><body></body></html>`,
    };
    expect(
      validateReviewOutput([page], ["index.html"]).map((entry) => entry.code),
    ).toContain("review-output-preconnect");
  });
});

describe("public output policy (condition 12)", () => {
  const publicPage = {
    path: "index.html",
    html: "<!doctype html><html><head><title>t</title></head><body></body></html>",
  };

  it("accepts a clean public page set", () => {
    expect(validatePublicOutput([publicPage], ["index.html"], [])).toEqual([]);
  });

  it("rejects a review-only route in public output", () => {
    expect(
      validatePublicOutput(
        [publicPage],
        ["index.html", "review/review-set.json"],
        [],
      ).map((entry) => entry.code),
    ).toContain("public-output-review-route");
  });

  it("rejects noindex inconsistency in public output", () => {
    expect(
      validatePublicOutput([reviewPage()], ["index.html"], []).map(
        (entry) => entry.code,
      ),
    ).toContain("public-output-noindex");
  });

  it("rejects unmarked iframes and unknown case embeds", () => {
    const page = {
      path: "cases/x/index.html",
      html: '<html><head></head><body><iframe src="https://example.org"></iframe><span data-case-embed="CASE-UNKNOWN"></span></body></html>',
    };
    const observed = validatePublicOutput(
      [page],
      ["cases/x/index.html"],
      [],
    ).map((entry) => entry.code);
    expect(observed).toContain("public-output-unmarked-iframe");
    expect(observed).toContain("public-output-embed-unknown-case");
  });
});
