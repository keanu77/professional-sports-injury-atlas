import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  computeCaseContentDigest,
  computeVideoIdentityDigest,
  computeVideoSourceDigest,
} from "../../src/lib/cases/digest";
import { buildClientSearchIndex } from "../../src/lib/cases/search-index";
import { selectPublicCases } from "../../src/lib/cases/selectors";
import { CURRENT_PUBLIC_RIGHTS_POLICY_VERSION } from "../../src/lib/contracts/site-governance";

const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );
const recent = (): any => loadFixture("cases/valid-medical-review.json");
const classic = (): any => loadFixture("cases/valid-approved-classic.json");

const publicCase = (): any => {
  const record = classic();
  record.video.publicRightsReview = {
    status: "cleared",
    reviewedBy: "Fictional Rights Reviewer",
    reviewedAt: "2026-08-05T12:00:00Z",
    reviewedVideoDigest: "0".repeat(64),
    policyVersion: CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
    termsCheckedAt: "2026-08-05T12:00:00Z",
    decisionBasis: "Fictional platform terms permit linking and embedding.",
    notes: null,
    decisionPath:
      "src/data/governance/video-rights-decisions/CASE-FIC-2014-002.v1.json",
    decisionDigest: "b".repeat(64),
  };
  record.video.sourceProvenanceVerification.reviewedVideoIdentityDigest =
    computeVideoIdentityDigest(record);
  record.review.reviewedContentDigest = computeCaseContentDigest(record);
  record.video.publicRightsReview.reviewedVideoDigest =
    computeVideoSourceDigest(record);
  return record;
};

describe("client search index", () => {
  it("contains only the records permitted by the public selector", () => {
    const records = [recent(), classic(), publicCase()];
    const index = buildClientSearchIndex(records);
    const permitted = selectPublicCases(records);
    expect(index.map((entry) => entry.slug)).toEqual(
      permitted.map((record: any) => record.slug),
    );
    expect(index).toHaveLength(1);
  });

  it("exposes registry-driven filter fields without diagnosis-labeled mechanisms", () => {
    const [entry] = buildClientSearchIndex([publicCase()]);
    expect(entry).toMatchObject({
      id: "CASE-FIC-2014-002",
      slug: "fictional-guard-beta-acl-2014",
      injuryCode: "acl",
      sportCode: "basketball",
      leagueCode: "nba",
      competitionCode: "nba-regular-season",
      season: "2013-14",
      eventDate: "2014-03-02",
      athleteName: "Fictional Guard Beta",
      teamName: "Riverport Foxes",
      opponentName: "Summit Ridge Owls",
      isClassic: true,
      rendering: "embed",
    });
    expect(entry!.mechanismTags).toEqual(["non-contact-cut"]);
  });

  it("is empty when no case is publicly eligible", () => {
    expect(buildClientSearchIndex([recent(), classic()])).toEqual([]);
  });
});
