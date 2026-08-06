/**
 * Pure route-builder tests. With empty real collections only the three
 * registry injury routes exist; no MLB, football, empty-league, case, or
 * update route is generated. Given one hermetic full fictional case, injury
 * overview, and baseline quarterly update, the builders produce the expected
 * case/league/update paths exactly once. Course-link presentation never
 * guesses a URL while approval is pending.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import courseLinksData from "../../src/data/professional-course-links.v1.json";
import courseSummariesData from "../../src/data/generated/rtp-course-summaries.v1.json";
import {
  reviewFixtureClassicCase,
  reviewFixtureOverview,
  reviewFixtureUpdate,
} from "../../src/data/review-fixtures";
import {
  caseRouteParams,
  CLASSIC_CASE_LABEL,
  computeRenderedSetDigest,
  confirmationStatusLabel,
  COURSE_LINK_PENDING_LABEL,
  courseLinkPresentation,
  injuryListingPages,
  injuryPageParams,
  injuryRouteParams,
  latestUpdateRef,
  leagueListingPages,
  leaguePageParams,
  leagueRouteParams,
  reviewFixtureParams,
  updateRouteParams,
} from "../../src/lib/routes/static-paths";
import {
  professionalCourseLinksSchema,
  rtpCourseSummariesSchema,
} from "../../src/lib/rtp/course-links";

const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );

describe("routes with empty real collections", () => {
  it("always generates exactly the three registry injury routes", () => {
    expect(injuryRouteParams()).toEqual([
      { injury: "acl" },
      { injury: "ankle-sprain" },
      { injury: "achilles-rupture" },
    ]);
    expect(injuryPageParams("review", [])).toEqual([]);
    const pages = injuryListingPages("review", [], "acl");
    expect(pages).toHaveLength(1);
    expect(pages[0]?.path).toBe("/injuries/acl/");
  });

  it("generates no case, league, or update route from empty entries", () => {
    expect(caseRouteParams("review", [])).toEqual([]);
    expect(leagueRouteParams("review", [])).toEqual([]);
    expect(leaguePageParams("review", [])).toEqual([]);
    expect(updateRouteParams("review", [])).toEqual([]);
    expect(latestUpdateRef("review", [], null)).toBeNull();
  });
});

describe("hermetic data-bearing route builders", () => {
  const cases = [reviewFixtureClassicCase];
  const updates = [reviewFixtureUpdate];

  it("produces the expected case path exactly once", () => {
    expect(caseRouteParams("review", cases)).toEqual([
      { slug: reviewFixtureClassicCase.slug },
    ]);
  });

  it("produces the expected league path exactly once and never MLB or football", () => {
    const leagues = leagueRouteParams("review", cases);
    expect(leagues).toEqual([{ league: "nba" }]);
    expect(leagues.map((entry) => entry.league)).not.toContain("mlb");
    const pages = leagueListingPages("review", cases, "nba");
    expect(pages).toHaveLength(1);
    expect(pages[0]?.path).toBe("/leagues/nba/");
  });

  it("produces the expected update path exactly once with the overview intact", () => {
    expect(updateRouteParams("review", updates)).toEqual([
      { quarter: reviewFixtureUpdate.id },
    ]);
    expect(reviewFixtureOverview.injuryCode).toBe("ankle-sprain");
    expect(latestUpdateRef("review", updates, null)).toEqual({
      id: "2026-q3",
      path: "/updates/2026-q3/",
    });
    expect(latestUpdateRef("review", updates, "2026-q3")).toEqual({
      id: "2026-q3",
      path: "/updates/2026-q3/",
    });
    // Public mode never guesses without an explicit approved pointer.
    expect(latestUpdateRef("public", updates, null)).toBeNull();
    expect(updateRouteParams("public", updates)).toEqual([]);
  });
});

describe("review fixture route params", () => {
  it("exposes the four fixture routes in review mode and zero in public mode", () => {
    expect(reviewFixtureParams("review")).toEqual([
      { fixture: "case-detail" },
      { fixture: "injury-overview" },
      { fixture: "league-listing" },
      { fixture: "latest-update" },
    ]);
    expect(reviewFixtureParams("public")).toEqual([]);
  });
});

describe("course-link presentation", () => {
  const links = professionalCourseLinksSchema.parse(courseLinksData);
  const summaries = rtpCourseSummariesSchema.parse(courseSummariesData);

  it("shows the exact pending label and never guesses a URL for every mapping", () => {
    expect(COURSE_LINK_PENDING_LABEL).toBe("課程連結待核准");
    for (const link of links.links) {
      const course = summaries.courses.find(
        (candidate) => candidate.slug === link.catalogSlug,
      );
      expect(course).toBeDefined();
      const presentation = courseLinkPresentation({
        link,
        course: course!,
        decisionBytes: null,
        decisionPath: null,
        courseLinkPolicyVersion: "",
      });
      expect(presentation.state).toBe("pending");
      expect(presentation.url).toBeNull();
      expect(presentation.pendingLabel).toBe("課程連結待核准");
    }
  });

  it("stays pending even when record-local fields claim approval without a decision artifact", () => {
    const link = structuredClone(links.links[0]!);
    link.linkApproval = {
      status: "approved",
      approvedPublicUrl: "https://courses.fictional-platform.example/acl",
      approvedBy: "Fictional Approver",
      approvedAt: "2026-08-05T00:00:00Z",
      approvedCatalogContentDigest: "a".repeat(64),
      policyVersion: "course-link-policy-v1",
      decisionPath: "src/data/governance/course-link-decisions/none.json",
      decisionDigest: "b".repeat(64),
    };
    const course = summaries.courses.find(
      (candidate) => candidate.slug === link.catalogSlug,
    )!;
    const presentation = courseLinkPresentation({
      link,
      course,
      decisionBytes: null,
      decisionPath: null,
      courseLinkPolicyVersion: "course-link-policy-v1",
    });
    expect(presentation.state).toBe("pending");
    expect(presentation.url).toBeNull();
  });
});

describe("labels and digests", () => {
  it("labels the diagnosis-confirmation states distinctly from workflow labels", () => {
    expect(confirmationStatusLabel("confirmed")).toBe("已確認");
    expect(confirmationStatusLabel("unconfirmed")).toBe("尚未確認");
    expect(confirmationStatusLabel("conflicted")).toBe("來源相互矛盾");
    expect(CLASSIC_CASE_LABEL).toBe("經典案例");
  });

  it("computes a deterministic rendered-set digest independent of input order", () => {
    const recordA = loadFixture("cases/valid-medical-review.json");
    const recordB = loadFixture("cases/valid-approved-classic.json");
    const forward = computeRenderedSetDigest([recordA, recordB]);
    const backward = computeRenderedSetDigest([recordB, recordA]);
    expect(forward).toBe(backward);
    expect(forward).toMatch(/^[0-9a-f]{64}$/);
    expect(computeRenderedSetDigest([])).toMatch(/^[0-9a-f]{64}$/);
    expect(computeRenderedSetDigest([recordA])).not.toBe(forward);
  });
});
