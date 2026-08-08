import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  computeCaseContentDigest,
  computeVideoIdentityDigest,
  computeVideoSourceDigest,
} from "../../src/lib/cases/digest";
import {
  effectiveVideoRendering,
  groupCasesByInjury,
  labelCaseWorkflowState,
  selectMedicallyApprovedCases,
  selectPublicCases,
  selectReviewCases,
} from "../../src/lib/cases/selectors";
import { hasCurrentProvenanceVerification } from "../../src/lib/cases/review-validation";
import {
  CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
  CURRENT_SOURCE_POLICY_VERSION,
} from "../../src/lib/contracts/site-governance";

const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );
const withCurrentSourcePolicy = (record: any): any => {
  record.sourceManifestBinding.sourcePolicyVersion =
    CURRENT_SOURCE_POLICY_VERSION;
  record.video.sourceProvenanceVerification.verifiedPolicyVersion =
    CURRENT_SOURCE_POLICY_VERSION;
  return record;
};
const recent = (): any =>
  withCurrentSourcePolicy(loadFixture("cases/valid-medical-review.json"));
const classic = (): any =>
  withCurrentSourcePolicy(loadFixture("cases/valid-approved-classic.json"));

/** Recomputes the digests that bind provenance and (if approved) review. */
const finalize = (record: any): any => {
  record.video.sourceProvenanceVerification.reviewedVideoIdentityDigest =
    computeVideoIdentityDigest(record);
  if (record.review.status === "approved") {
    record.review.reviewedContentDigest = computeCaseContentDigest(record);
  }
  if (record.video.publicRightsReview.status === "cleared") {
    record.video.publicRightsReview.reviewedVideoDigest =
      computeVideoSourceDigest(record);
  }
  return record;
};

const publicCase = (mutate?: (record: any) => void): any => {
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
  if (mutate) mutate(record);
  return finalize(record);
};

describe("deterministic case selectors", () => {
  it("review selector includes draft through approved and labels each state", () => {
    const draft = recent();
    draft.status = "draft";
    const sourceVerified = recent();
    sourceVerified.status = "source-verified";
    const inReview = recent();
    const approved = classic();
    const rejected = recent();
    rejected.status = "rejected";
    const retired = recent();
    retired.status = "retired";

    const selected = selectReviewCases([
      draft,
      sourceVerified,
      inReview,
      approved,
      rejected,
      retired,
    ]);
    expect(selected).toHaveLength(4);
    expect(selected.map((record: any) => record.status)).not.toContain(
      "rejected",
    );
    expect(selected.map((record: any) => record.status)).not.toContain(
      "retired",
    );

    const labels = new Set(
      ["draft", "source-verified", "medical-review", "approved"].map(
        (status) => {
          const record = recent();
          record.status = status;
          return labelCaseWorkflowState(record);
        },
      ),
    );
    expect(labels.size).toBe(4);
  });

  it("medically approved selector requires digest-current approval but not rights", () => {
    const approved = classic();
    const inReview = recent();
    const selected = selectMedicallyApprovedCases([approved, inReview]);
    expect(selected.map((record: any) => record.id)).toEqual([approved.id]);
    expect(approved.video.publicRightsReview.status).toBe("not-requested");

    const staleDigest = classic();
    staleDigest.review.reviewedContentDigest = "e".repeat(64);
    expect(selectMedicallyApprovedCases([staleDigest])).toEqual([]);

    const stalePolicy = classic();
    stalePolicy.video.sourceProvenanceVerification.verifiedPolicyVersion =
      "source-policy-v0";
    expect(selectMedicallyApprovedCases([stalePolicy])).toEqual([]);

    const unconfirmed = classic();
    unconfirmed.injury.confirmationStatus = "conflicted";
    expect(selectMedicallyApprovedCases([unconfirmed])).toEqual([]);
  });

  it("admits only exact nba-v2 binding/provenance agreement with a current identity digest", () => {
    const current = classic();
    current.sourceManifestBinding.sourcePolicyVersion = "nba-v2";
    current.video.sourceProvenanceVerification.verifiedPolicyVersion = "nba-v2";
    finalize(current);
    expect(hasCurrentProvenanceVerification(current)).toBe(true);
    expect(selectMedicallyApprovedCases([current])).toEqual([current]);
    expect(CURRENT_SOURCE_POLICY_VERSION).toBe("nba-v2");

    for (const policyVersion of [
      "source-policy-v1",
      "nba-v1",
      "unknown-policy",
    ]) {
      const stale = finalize(classic());
      stale.sourceManifestBinding.sourcePolicyVersion = policyVersion;
      stale.video.sourceProvenanceVerification.verifiedPolicyVersion =
        policyVersion;
      expect(hasCurrentProvenanceVerification(stale)).toBe(false);
      expect(selectMedicallyApprovedCases([stale])).toEqual([]);
    }

    const mismatched = finalize(classic());
    mismatched.sourceManifestBinding.sourcePolicyVersion = "nba-v2";
    mismatched.video.sourceProvenanceVerification.verifiedPolicyVersion =
      "nba-v1";
    expect(hasCurrentProvenanceVerification(mismatched)).toBe(false);
    expect(selectMedicallyApprovedCases([mismatched])).toEqual([]);

    const staleIdentity = finalize(classic());
    staleIdentity.video.sourceProvenanceVerification.reviewedVideoIdentityDigest =
      "f".repeat(64);
    expect(hasCurrentProvenanceVerification(staleIdentity)).toBe(false);
    expect(selectMedicallyApprovedCases([staleIdentity])).toEqual([]);
  });

  it("public selector additionally requires current cleared rights", () => {
    const approvedOnly = classic();
    const cleared = publicCase();
    expect(selectMedicallyApprovedCases([approvedOnly, cleared])).toHaveLength(
      2,
    );
    const publicSelected = selectPublicCases([approvedOnly, cleared, recent()]);
    expect(publicSelected).toHaveLength(1);
    expect(publicSelected[0]!.video.publicRightsReview.status).toBe("cleared");

    const wrongPolicy = publicCase((record) => {
      record.video.publicRightsReview.policyVersion = "public-rights-policy-v0";
    });
    expect(selectPublicCases([wrongPolicy])).toEqual([]);

    const staleVideoDigest = publicCase();
    staleVideoDigest.video.publicRightsReview.reviewedVideoDigest = "f".repeat(
      64,
    );
    expect(selectPublicCases([staleVideoDigest])).toEqual([]);
  });

  it("caption degradation changes rendering, not public eligibility", () => {
    const notVerified = publicCase((record) => {
      record.video.captionStatus = "not-verified";
    });
    expect(selectPublicCases([notVerified])).toHaveLength(1);
    expect(effectiveVideoRendering(notVerified)).toBe("external-link");

    const available = publicCase();
    expect(effectiveVideoRendering(available)).toBe("embed");

    const externalOnly = publicCase((record) => {
      record.video.embedStatus = "external-link-only";
    });
    expect(selectPublicCases([externalOnly])).toHaveLength(1);
    expect(effectiveVideoRendering(externalOnly)).toBe("external-link");
  });

  it("excludes unavailable records from public counts", () => {
    const unavailable = publicCase((record) => {
      record.video.embedStatus = "unavailable";
    });
    expect(selectPublicCases([unavailable])).toEqual([]);
    const retired = publicCase((record) => {
      record.status = "retired";
    });
    expect(selectPublicCases([retired])).toEqual([]);
  });

  it("sorts by eventDate descending then slug ascending", () => {
    const a = publicCase((record) => {
      record.slug = "fictional-a";
    });
    const b = publicCase((record) => {
      record.slug = "fictional-b";
    });
    const later = publicCase((record) => {
      record.slug = "fictional-later";
      record.eventDate = "2014-04-01";
      record.season = "2013-14";
    });
    expect(
      selectPublicCases([b, later, a]).map((record: any) => record.slug),
    ).toEqual(["fictional-later", "fictional-a", "fictional-b"]);
  });

  it("groups cases by injury code", () => {
    const grouped = groupCasesByInjury([recent(), classic()]);
    expect([...grouped.keys()].sort()).toEqual(["acl", "ankle-sprain"]);
    expect(grouped.get("acl")).toHaveLength(1);
  });
});
