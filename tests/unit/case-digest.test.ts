import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { canonicalJson } from "../../src/lib/cases/canonical-json";
import {
  caseClinicalPayload,
  computeCaseContentDigest,
  computePublicRightsDecisionDigest,
  computeVideoIdentityDigest,
  computeVideoSourceDigest,
} from "../../src/lib/cases/digest";
import {
  hasMatchingApprovedReview,
  hasMatchingPublicRightsClearance,
  validateCaseForApproval,
} from "../../src/lib/cases/review-validation";
import { caseSchema } from "../../src/lib/contracts/case";
import { CURRENT_PUBLIC_RIGHTS_POLICY_VERSION } from "../../src/lib/contracts/site-governance";

const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );
const recent = (): any => loadFixture("cases/valid-medical-review.json");
const classic = (): any => loadFixture("cases/valid-approved-classic.json");

/** Rebuilds an object with reversed key insertion order, recursively. */
const reversedKeys = (value: any): any => {
  if (Array.isArray(value)) return value.map(reversedKeys);
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value).reverse()) {
      result[key] = reversedKeys(value[key]);
    }
    return result;
  }
  return value;
};

const clearRights = (record: any): any => {
  record.video.publicRightsReview = {
    status: "cleared",
    reviewedBy: "Fictional Rights Reviewer",
    reviewedAt: "2026-08-05T12:00:00Z",
    reviewedVideoDigest: computeVideoSourceDigest(record),
    policyVersion: CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
    termsCheckedAt: "2026-08-05T12:00:00Z",
    decisionBasis: "Fictional platform terms permit linking and embedding.",
    notes: null,
    decisionPath:
      "src/data/governance/video-rights-decisions/CASE-FIC-2014-002.v1.json",
    decisionDigest: "b".repeat(64),
  };
  return record;
};

describe("canonical case digests", () => {
  it("is stable across key insertion order and Unicode forms", () => {
    const record = recent();
    expect(computeCaseContentDigest(reversedKeys(record))).toBe(
      computeCaseContentDigest(record),
    );

    const composed = recent();
    composed.general.whatHappened += " café";
    const decomposed = recent();
    decomposed.general.whatHappened += " café";
    expect(computeCaseContentDigest(decomposed)).toBe(
      computeCaseContentDigest(composed),
    );
  });

  it("changes when clinical or stable video/source facts change", () => {
    const baseline = computeCaseContentDigest(recent());
    const mutations: Array<(record: any) => void> = [
      (r) => (r.general.whatIsVisible += " Changed."),
      (r) => {
        r.professional.clinicalLimitations += " Changed.";
        r.professional.claims[2].text += " Changed.";
      },
      (r) => (r.sources[1].url = "https://comets.example.org/other-report"),
      (r) => (r.sources[1].title = "Changed fictional title"),
      (r) => (r.sources[1].publisher = "Changed Fictional Publisher"),
      (r) => (r.sources[3].supports = r.sources[3].supports.slice(0, 3)),
      (r) => (r.injury.confirmedDiagnosis = "Changed fictional diagnosis"),
      (r) => (r.video.uploaderName = "Changed Fictional Uploader"),
      (r) => (r.video.uploaderProvenance = "changed-provenance"),
      (r) => (r.video.segments[0].observation = "Changed observation."),
      (r) => (r.video.segments[0].startSeconds = 11),
      (r) => (r.sourceManifestBinding.entryDigest = "c".repeat(64)),
      (r) => (r.video.eventBinding.basis = "Changed factual basis."),
    ];
    for (const mutate of mutations) {
      const record = recent();
      mutate(record);
      expect(computeCaseContentDigest(record)).not.toBe(baseline);
    }
    // sources[2].supports identical content should not change anything:
    const same = recent();
    expect(computeCaseContentDigest(same)).toBe(baseline);
  });

  it("ignores workflow, review, checker, and rights metadata", () => {
    const baselineRecent = computeCaseContentDigest(recent());
    const recentMutations: Array<(record: any) => void> = [
      (r) => (r.status = "approved"),
      (r) => {
        r.review = {
          status: "approved",
          reviewerName: "Dr. Fictional Reviewer Two",
          reviewerQualification: "Fictional Sports Medicine Physician",
          reviewedAt: "2026-08-05T00:00:00Z",
          reviewedContentDigest: "d".repeat(64),
        };
      },
      (r) => (r.video.eventBinding.checkedBy = "Someone Else Fictional"),
      (r) => (r.video.eventBinding.checkedAt = "2026-08-03T00:00:00Z"),
      (r) =>
        (r.video.sourceProvenanceVerification.verifiedBy = "Another Fictional"),
      (r) =>
        (r.video.sourceProvenanceVerification.verifiedAt =
          "2026-08-03T00:00:00Z"),
      (r) => (r.video.sourceProvenanceVerification.notes = "Workflow note."),
      (r) => (r.sources[0].accessedAt = "2026-08-04"),
      (r) => (r.video.embedStatus = "external-link-only"),
      (r) => (r.video.embedCheckedAt = "2026-08-04T00:00:00Z"),
      (r) => (r.video.captionStatus = "not-verified"),
      (r) => (r.video.captionCheckedAt = "2026-08-04T00:00:00Z"),
      (r) => clearRights(r),
      (r) => (r.audit.updatedAt = "2026-08-06T00:00:00Z"),
    ];
    for (const mutate of recentMutations) {
      const record = recent();
      mutate(record);
      expect(computeCaseContentDigest(record)).toBe(baselineRecent);
    }

    const baselineClassic = computeCaseContentDigest(classic());
    for (const mutate of [
      (r: any) => (r.classicProposedBy = "Different Fictional Curator"),
      (r: any) =>
        (r.classicExceptionApprovedBy = "Different Fictional Approver"),
    ]) {
      const record = classic();
      mutate(record);
      expect(computeCaseContentDigest(record)).toBe(baselineClassic);
    }
  });

  it("payload keeps classic reason but excludes proposer and approver identity", () => {
    const payload: any = caseClinicalPayload(classic());
    const flat = JSON.stringify(payload);
    expect(flat).toContain("Frequently cited fictional teaching example");
    expect(flat).not.toContain("Fictional Curator One");
    expect(flat).not.toContain("Dr. Fictional Reviewer Two");
    expect(flat).not.toContain("accessedAt");
  });

  it("video identity and video-source digests move with the right facts", () => {
    const identityBaseline = computeVideoIdentityDigest(recent());
    const sourceBaseline = computeVideoSourceDigest(recent());

    const urlChanged = recent();
    urlChanged.video.canonicalUrl =
      "https://www.youtube.com/watch?v=fic-alpha-x";
    urlChanged.video.fallbackUrl = urlChanged.video.canonicalUrl;
    expect(computeVideoIdentityDigest(urlChanged)).not.toBe(identityBaseline);
    expect(computeVideoSourceDigest(urlChanged)).not.toBe(sourceBaseline);

    const uploaderChanged = recent();
    uploaderChanged.video.uploaderProvenance = "unofficial-reupload";
    expect(computeVideoIdentityDigest(uploaderChanged)).not.toBe(
      identityBaseline,
    );

    const embedChanged = recent();
    embedChanged.video.embedStatus = "external-link-only";
    expect(computeVideoIdentityDigest(embedChanged)).toBe(identityBaseline);
    expect(computeVideoSourceDigest(embedChanged)).not.toBe(sourceBaseline);

    const captionDateChanged = recent();
    captionDateChanged.video.captionCheckedAt = "2026-08-04T00:00:00Z";
    expect(computeVideoIdentityDigest(captionDateChanged)).toBe(
      identityBaseline,
    );
    expect(computeVideoSourceDigest(captionDateChanged)).toBe(sourceBaseline);

    const verifierChanged = recent();
    verifierChanged.video.sourceProvenanceVerification.verifiedBy =
      "Someone Else";
    expect(computeVideoSourceDigest(verifierChanged)).toBe(sourceBaseline);

    const policyChanged = recent();
    policyChanged.video.sourceProvenanceVerification.verifiedPolicyVersion =
      "source-policy-v0";
    expect(computeVideoSourceDigest(policyChanged)).not.toBe(sourceBaseline);
  });

  it("keeps the baked fixture digests verifiable", () => {
    const record = classic();
    expect(
      record.video.sourceProvenanceVerification.reviewedVideoIdentityDigest,
    ).toBe(computeVideoIdentityDigest(record));
    expect(record.review.reviewedContentDigest).toBe(
      computeCaseContentDigest(record),
    );
    expect(hasMatchingApprovedReview(record)).toBe(true);
  });

  it("rejects an approved review with an old digest immediately", () => {
    const record = classic();
    record.review.reviewedContentDigest = "e".repeat(64);
    expect(hasMatchingApprovedReview(record)).toBe(false);
    expect(
      validateCaseForApproval(record).map((issue) => issue.code),
    ).toContain("approval-review-digest-stale");
  });

  it("invalidates provenance and rights when the video identity changes", () => {
    const record = clearRights(classic());
    expect(hasMatchingPublicRightsClearance(record)).toBe(true);

    record.video.canonicalUrl = "https://www.youtube.com/watch?v=fic-beta-x";
    record.video.fallbackUrl = record.video.canonicalUrl;
    expect(hasMatchingPublicRightsClearance(record)).toBe(false);
    expect(
      validateCaseForApproval(record).map((issue) => issue.code),
    ).toContain("approval-provenance-stale");
  });

  it("makes old provenance ineligible when only the policy version changes", () => {
    const record = classic();
    record.video.sourceProvenanceVerification.verifiedPolicyVersion =
      "source-policy-v0";
    expect(
      validateCaseForApproval(record).map((issue) => issue.code),
    ).toContain("approval-provenance-stale");
  });

  it("computes and re-validates a public rights decision digest", () => {
    const record = classic();
    const decision = {
      schemaVersion: 1,
      decisionType: "video-public-rights",
      decisionStatus: "cleared",
      caseId: record.id,
      videoSourceDigest: computeVideoSourceDigest(record),
      publicRightsPolicyVersion: CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
      termsCheckedAt: "2026-08-05T12:00:00Z",
      decisionBasis: "Fictional platform terms permit linking and embedding.",
      notes: null,
      reviewedBy: "Fictional Rights Reviewer",
      reviewedAt: "2026-08-05T12:00:00Z",
    };
    const digest = computePublicRightsDecisionDigest(
      record as any,
      decision as any,
    );
    expect(digest).toMatch(/^[0-9a-f]{64}$/);

    expect(() =>
      computePublicRightsDecisionDigest(
        record as any,
        {
          ...decision,
          caseId: "CASE-FIC-9999-001",
        } as any,
      ),
    ).toThrow();
    expect(() =>
      computePublicRightsDecisionDigest(
        record as any,
        {
          ...decision,
          videoSourceDigest: "f".repeat(64),
        } as any,
      ),
    ).toThrow();
    expect(() =>
      computePublicRightsDecisionDigest(
        record as any,
        {
          ...decision,
          publicRightsPolicyVersion: "public-rights-policy-v0",
        } as any,
      ),
    ).toThrow();
  });

  it("keeps the committed JSON Schema artifact byte-identical to regeneration", () => {
    const committed = readFileSync(
      new URL("../../schemas/injury-case.v1.schema.json", import.meta.url),
      "utf8",
    );
    expect(committed).toBe(canonicalJson(z.toJSONSchema(caseSchema)));
  });
});
