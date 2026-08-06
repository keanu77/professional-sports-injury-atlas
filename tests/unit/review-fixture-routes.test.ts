/**
 * Review-fixture record tests: every name is visibly fictional, the records
 * are structurally valid, the NBA-host entry stays external-link-only and is
 * never requested, the review-fixture adapter accepts them in review mode
 * only, and the public selectors always reject them.
 */

import { describe, expect, it } from "vitest";
import {
  reviewFixtureCases,
  reviewFixtureClassicCase,
  reviewFixtureExternalLinkCase,
  reviewFixtureOverview,
  reviewFixtureUpdate,
  selectReviewFixtureCases,
} from "../../src/data/review-fixtures";
import {
  computeCaseContentDigest,
  computeVideoSourceDigest,
} from "../../src/lib/cases/digest";
import {
  selectMedicallyApprovedCases,
  selectPublicCases,
  selectReviewCases,
} from "../../src/lib/cases/selectors";
import {
  validateCaseCollection,
  validateCaseRecord,
} from "../../src/lib/contracts/cross-validation";
import { validateInjuryOverview } from "../../src/lib/contracts/injury-overview";
import { validateUpdateStructure } from "../../src/lib/contracts/update";

const FICTIONAL_RE = /虛構|Fictional/;

describe("review fixture records", () => {
  it("uses only visibly fictional athlete, team, uploader, and source names", () => {
    for (const record of reviewFixtureCases) {
      expect(record.athlete.name).toMatch(FICTIONAL_RE);
      expect(record.teamAtEvent.name).toMatch(FICTIONAL_RE);
      expect(record.opponent.name).toMatch(FICTIONAL_RE);
      expect(record.video.uploaderName).toMatch(FICTIONAL_RE);
      expect(record.injury.confirmedDiagnosis).toMatch(FICTIONAL_RE);
      for (const source of record.sources) {
        expect(source.title).toMatch(FICTIONAL_RE);
        expect(source.publisher).toMatch(FICTIONAL_RE);
        expect(source.url).not.toContain("example.com");
      }
    }
    expect(reviewFixtureClassicCase.review.reviewerName).toMatch(FICTIONAL_RE);
    expect(reviewFixtureOverview.titleZh).toMatch(FICTIONAL_RE);
    expect(reviewFixtureUpdate.summary).toMatch(FICTIONAL_RE);
  });

  it("passes the full record, overview, update, and collection validators", () => {
    for (const record of reviewFixtureCases) {
      expect(validateCaseRecord(record)).toEqual([]);
    }
    expect(validateCaseCollection(reviewFixtureCases)).toEqual([]);
    expect(validateInjuryOverview(reviewFixtureOverview)).toEqual([]);
    expect(validateUpdateStructure(reviewFixtureUpdate)).toEqual([]);
  });

  it("keeps the NBA-host fixture external-link-only and never embedded", () => {
    const record = reviewFixtureExternalLinkCase;
    expect(record.video.provider).toBe("nba");
    expect(new URL(record.video.canonicalUrl).hostname).toBe("www.nba.com");
    expect(record.video.embedStatus).toBe("external-link-only");
    expect(record.video.canonicalUrl).toMatch(/fictional/);
  });

  it("binds the baseline update to the exact current fixture digests", () => {
    expect(reviewFixtureUpdate.addedCases).toEqual([
      {
        caseId: reviewFixtureClassicCase.id,
        currentClinicalDigest: computeCaseContentDigest(
          reviewFixtureClassicCase,
        ),
        currentVideoSourceDigest: computeVideoSourceDigest(
          reviewFixtureClassicCase,
        ),
      },
      {
        caseId: reviewFixtureExternalLinkCase.id,
        currentClinicalDigest: computeCaseContentDigest(
          reviewFixtureExternalLinkCase,
        ),
        currentVideoSourceDigest: computeVideoSourceDigest(
          reviewFixtureExternalLinkCase,
        ),
      },
    ]);
  });

  it("is accepted by review-fixture adapters and review selectors", () => {
    expect(selectReviewFixtureCases("review")).toHaveLength(2);
    expect(selectReviewCases(reviewFixtureCases)).toHaveLength(2);
    expect(
      selectMedicallyApprovedCases(reviewFixtureCases).map(
        (record) => record.id,
      ),
    ).toEqual([reviewFixtureClassicCase.id]);
  });

  it("is always rejected by the public selectors and absent from public mode", () => {
    expect(selectPublicCases(reviewFixtureCases)).toEqual([]);
    expect(selectReviewFixtureCases("public")).toEqual([]);
    for (const record of reviewFixtureCases) {
      expect(record.video.publicRightsReview.status).toBe("not-requested");
    }
  });
});
