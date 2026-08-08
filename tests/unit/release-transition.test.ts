import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Hex } from "../../src/lib/cases/canonical-json";
import {
  computeCaseContentDigest,
  computeVideoIdentityDigest,
  computeVideoSourceDigest,
} from "../../src/lib/cases/digest";
import { computeQuarterlyUpdateDigest } from "../../src/lib/cases/update-digest";
import {
  buildCandidateReleaseSnapshot,
  EMPTY_PUBLIC_RELEASE_HISTORY_BYTES,
  validateHistoricalUpdates,
  validateHistoryAppend,
  validateQuarterlyUpdateAgainstRelease,
  type CandidateReleaseInput,
} from "../../src/lib/releases/history";
import {
  CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
  CURRENT_SOURCE_POLICY_VERSION,
} from "../../src/lib/contracts/site-governance";
import {
  EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
  type SourceManifestRegistryV1,
} from "../../src/lib/contracts/source-manifest-registry";

const COMMIT = "1".repeat(40);
const hex = (ch: string): string => ch.repeat(64);
const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );

const fixtureManifest = (): any =>
  loadFixture(
    "research/source-manifests/FICTIONAL-SOURCE-2026-08-06-001.v1.json",
  );
const fixtureDecision = (): any =>
  loadFixture(
    "research/reviews/source-batches/FICTIONAL-SOURCE-2026-08-06-001-source-review-decision.v1.json",
  );

function currentSourceBatch(): {
  manifest: any;
  manifestDigest: string;
  decisionDigest: string;
} {
  const manifest = fixtureManifest();
  manifest.sourcePolicyVersion = CURRENT_SOURCE_POLICY_VERSION;
  const manifestDigest = sha256Hex(canonicalJson(manifest));
  const decision = {
    ...fixtureDecision(),
    manifestDigest,
    sourcePolicyVersion: CURRENT_SOURCE_POLICY_VERSION,
  };
  return {
    manifest,
    manifestDigest,
    decisionDigest: sha256Hex(canonicalJson(decision)),
  };
}

function launchRegistry(): SourceManifestRegistryV1 {
  const { manifest, manifestDigest, decisionDigest } = currentSourceBatch();
  return {
    schemaVersion: 1,
    entries: [
      {
        manifestId: manifest.manifestId,
        manifestPath: `research/source-manifests/${manifest.manifestId}.v1.json`,
        manifestDigest,
        sourceReviewDecisionPath: `research/reviews/source-batches/${manifest.manifestId}-source-review-decision.v1.json`,
        sourceReviewDecisionDigest: decisionDigest,
        sourcePolicyVersion: manifest.sourcePolicyVersion,
        batchType: "launch",
        period: manifest.period,
        createdAt: "2026-08-06T01:00:00Z",
        previousRegistryBytesDigest: sha256Hex(
          EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
        ),
        supersedes: [],
      },
    ],
  };
}

/** Promotes a fixture case to fully approved + rights-cleared public state. */
function makePublic(record: any): any {
  const { manifest, manifestDigest, decisionDigest } = currentSourceBatch();
  const entry = manifest.entries.find(
    (candidate: any) =>
      candidate.candidateId === record.sourceManifestBinding.candidateId,
  );
  if (entry === undefined) throw new Error("fixture source binding is missing");
  record.sourceManifestBinding.manifestDigest = manifestDigest;
  record.sourceManifestBinding.entryDigest = sha256Hex(canonicalJson(entry));
  record.sourceManifestBinding.sourceReviewDecisionDigest = decisionDigest;
  record.sourceManifestBinding.sourcePolicyVersion =
    CURRENT_SOURCE_POLICY_VERSION;
  record.video.sourceProvenanceVerification.verifiedPolicyVersion =
    CURRENT_SOURCE_POLICY_VERSION;
  record.status = "approved";
  if (record.isClassic && record.classicExceptionApprovedBy === null) {
    record.classicExceptionApprovedBy = "Dr. Fictional Reviewer Two";
  }
  record.video.publicRightsReview = {
    status: "cleared",
    reviewedBy: "Fictional Rights Reviewer",
    reviewedAt: "2026-08-05T12:00:00Z",
    reviewedVideoDigest: "0".repeat(64),
    policyVersion: CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
    termsCheckedAt: "2026-08-05T12:00:00Z",
    decisionBasis: "Fictional platform terms permit linking and embedding.",
    notes: null,
    decisionPath: `src/data/governance/video-rights-decisions/${record.id}.v1.json`,
    decisionDigest: "b".repeat(64),
  };
  record.review = {
    status: "approved",
    reviewerName: "Dr. Fictional Reviewer Two",
    reviewerQualification: "Fictional Sports Medicine Physician",
    reviewedAt: "2026-08-05T00:00:00Z",
    reviewedContentDigest: "0".repeat(64),
  };
  return finalize(record);
}

function finalize(record: any): any {
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
}

function baselineUpdate(cases: any[]): any {
  const update = loadFixture("updates/valid-baseline.json");
  update.addedCases = cases
    .map((record) => ({
      caseId: record.id,
      currentClinicalDigest: computeCaseContentDigest(record),
      currentVideoSourceDigest: computeVideoSourceDigest(record),
    }))
    .sort((a, b) => (a.caseId < b.caseId ? -1 : 1));
  update.status = "approved";
  update.publishedAt = "2026-08-06T11:00:00Z";
  update.review = {
    status: "approved",
    reviewerName: "Dr. Fictional Reviewer Two",
    reviewerQualification: "Fictional Sports Medicine Physician",
    reviewedAt: "2026-08-05T00:00:00Z",
    reviewedContentDigest: computeQuarterlyUpdateDigest(update),
  };
  return update;
}

function candidateInput(
  cases: any[],
  updates: any[],
  previousRelease: any | null,
  previousHistoryBytes: string,
  releaseId = "release-001",
): CandidateReleaseInput {
  return {
    releaseId,
    releasedAt: "2026-08-06T12:00:00Z",
    previousRelease,
    previousHistoryBytesDigest: sha256Hex(previousHistoryBytes),
    siteDigest: hex("1"),
    sitePublicationDecisionDigest: hex("2"),
    buildCommit: COMMIT,
    publicRendererTreeDigest: hex("3"),
    deploymentArtifactDigest: hex("4"),
    servedArtifactReceiptDigest: hex("5"),
    publicUrlHash: hex("6"),
    cases,
    overviews: [],
    updates,
    registry: launchRegistry(),
  } as CandidateReleaseInput;
}

function firstReleaseScenario() {
  const caseA = makePublic(loadFixture("cases/valid-approved-classic.json"));
  const caseB = makePublic(loadFixture("cases/valid-medical-review.json"));
  const cases = [caseA, caseB];
  const update = baselineUpdate(cases);
  const candidate = buildCandidateReleaseSnapshot(
    candidateInput(cases, [update], null, EMPTY_PUBLIC_RELEASE_HISTORY_BYTES),
  );
  return { caseA, caseB, cases, update, candidate };
}

describe("release transitions", () => {
  it("builds and validates an approved baseline first release", () => {
    const { cases, update, candidate } = firstReleaseScenario();
    expect(candidate.caseSnapshots.map((s) => s.caseId)).toEqual([
      "CASE-FIC-2014-002",
      "CASE-FIC-2026-001",
    ]);
    expect(candidate.previousReleaseDigest).toBeNull();
    expect(
      validateQuarterlyUpdateAgainstRelease(update, cases, null, candidate),
    ).toEqual([]);
  });

  it("fails a stale approved update digest", () => {
    const { cases, update, candidate } = firstReleaseScenario();
    update.summary += " Drifted after approval.";
    expect(
      validateQuarterlyUpdateAgainstRelease(update, cases, null, candidate).map(
        (issue) => issue.code,
      ),
    ).toContain("release-update-stale");
  });

  it("fails a wrong update digest or timestamp in the candidate release", () => {
    const { cases, update, candidate } = firstReleaseScenario();
    const wrongDigest = structuredClone(candidate);
    wrongDigest.updateSnapshots[0]!.updateDigest = hex("9");
    expect(
      validateQuarterlyUpdateAgainstRelease(
        update,
        cases,
        null,
        wrongDigest,
      ).map((issue) => issue.code),
    ).toContain("release-update-snapshot");

    const wrongTime = structuredClone(candidate);
    wrongTime.updateSnapshots[0]!.publishedAt = "2026-08-06T13:00:00Z";
    expect(
      validateQuarterlyUpdateAgainstRelease(update, cases, null, wrongTime).map(
        (issue) => issue.code,
      ),
    ).toContain("release-update-snapshot");
  });

  it("requires the baseline to list every public case as added on first release", () => {
    const { cases, update, candidate } = firstReleaseScenario();
    const missing = structuredClone(update);
    missing.addedCases = missing.addedCases.slice(0, 1);
    missing.review.reviewedContentDigest =
      computeQuarterlyUpdateDigest(missing);
    expect(
      validateQuarterlyUpdateAgainstRelease(
        missing,
        cases,
        null,
        candidate,
      ).map((issue) => issue.code),
    ).toContain("release-first");

    const nonEmptyRetired = structuredClone(update);
    nonEmptyRetired.retiredCases.push({
      caseId: "CASE-FIC-2026-009",
      previousClinicalDigest: hex("3"),
      previousVideoSourceDigest: hex("4"),
      reason: "Fictional.",
    });
    nonEmptyRetired.review.reviewedContentDigest =
      computeQuarterlyUpdateDigest(nonEmptyRetired);
    expect(
      validateQuarterlyUpdateAgainstRelease(
        nonEmptyRetired,
        cases,
        null,
        candidate,
      ).map((issue) => issue.code),
    ).toContain("release-first");
  });

  it("fails added cases whose digests do not match current head", () => {
    const { cases, update, candidate } = firstReleaseScenario();
    const drifted = structuredClone(update);
    drifted.addedCases[0]!.currentClinicalDigest = hex("9");
    drifted.review.reviewedContentDigest =
      computeQuarterlyUpdateDigest(drifted);
    expect(
      validateQuarterlyUpdateAgainstRelease(
        drifted,
        cases,
        null,
        candidate,
      ).map((issue) => issue.code),
    ).toContain("release-added");
  });

  describe("subsequent releases", () => {
    function secondReleaseScenario(
      mutateHead: (caseA: any, caseB: any) => { update2: any; cases2: any[] },
    ) {
      const first = firstReleaseScenario();
      const history1 = {
        releases: [first.candidate],
        schemaVersion: 1,
      };
      const history1Bytes = canonicalJson(history1);
      const { update2, cases2 } = mutateHead(
        structuredClone(first.caseA),
        structuredClone(first.caseB),
      );
      const candidate2 = buildCandidateReleaseSnapshot(
        candidateInput(
          cases2,
          [first.update, update2],
          first.candidate,
          history1Bytes,
          "release-002",
        ),
      );
      return { first, history1, history1Bytes, update2, cases2, candidate2 };
    }

    const emptyUpdate2 = (): any => {
      const update = loadFixture("updates/valid-baseline.json");
      update.id = "2026-q4";
      update.period = {
        year: 2026,
        quarter: 4,
        startDate: "2026-10-01",
        endDate: "2026-12-31",
      };
      update.addedCases = [];
      update.status = "approved";
      update.publishedAt = "2026-11-06T11:00:00Z";
      update.review = {
        status: "approved",
        reviewerName: "Dr. Fictional Reviewer Two",
        reviewerQualification: "Fictional Sports Medicine Physician",
        reviewedAt: "2026-11-05T00:00:00Z",
        reviewedContentDigest: "0".repeat(64),
      };
      return update;
    };

    it("validates an updated transition and rejects a mismatched pair", () => {
      const scenario = secondReleaseScenario((caseA, caseB) => {
        const previousClinical = computeCaseContentDigest(caseA);
        const previousVideo = computeVideoSourceDigest(caseA);
        caseA.general.whatIsVisible += " Refined fictional description.";
        finalize(caseA);
        const update2 = emptyUpdate2();
        update2.updatedCases = [
          {
            caseId: caseA.id,
            previousClinicalDigest: previousClinical,
            currentClinicalDigest: computeCaseContentDigest(caseA),
            previousVideoSourceDigest: previousVideo,
            currentVideoSourceDigest: computeVideoSourceDigest(caseA),
            reason: "Fictional clinical refinement after re-review.",
          },
        ];
        update2.review.reviewedContentDigest =
          computeQuarterlyUpdateDigest(update2);
        return { update2, cases2: [caseA, caseB] };
      });
      expect(
        validateQuarterlyUpdateAgainstRelease(
          scenario.update2,
          scenario.cases2,
          scenario.first.candidate,
          scenario.candidate2,
        ),
      ).toEqual([]);

      const wrongPrev = structuredClone(scenario.update2);
      wrongPrev.updatedCases[0].previousClinicalDigest = hex("9");
      wrongPrev.review.reviewedContentDigest =
        computeQuarterlyUpdateDigest(wrongPrev);
      expect(
        validateQuarterlyUpdateAgainstRelease(
          wrongPrev,
          scenario.cases2,
          scenario.first.candidate,
          scenario.candidate2,
        ).map((issue) => issue.code),
      ).toContain("release-updated");
    });

    it("fails a head change omitted from the current update", () => {
      const scenario = secondReleaseScenario((caseA, caseB) => {
        caseA.general.whatIsVisible += " Refined but unlisted.";
        finalize(caseA);
        const update2 = emptyUpdate2();
        update2.review.reviewedContentDigest =
          computeQuarterlyUpdateDigest(update2);
        return { update2, cases2: [caseA, caseB] };
      });
      expect(
        validateQuarterlyUpdateAgainstRelease(
          scenario.update2,
          scenario.cases2,
          scenario.first.candidate,
          scenario.candidate2,
        ).map((issue) => issue.code),
      ).toContain("release-head-drift");
    });

    it("validates retired and unavailable transitions against prior snapshots", () => {
      const scenario = secondReleaseScenario((caseA, caseB) => {
        const previousClinicalA = computeCaseContentDigest(caseA);
        const previousVideoA = computeVideoSourceDigest(caseA);
        caseA.status = "retired";
        const previousClinicalB = computeCaseContentDigest(caseB);
        const previousVideoB = computeVideoSourceDigest(caseB);
        caseB.video.embedStatus = "unavailable";
        finalize(caseB);
        const update2 = emptyUpdate2();
        update2.retiredCases = [
          {
            caseId: caseA.id,
            previousClinicalDigest: previousClinicalA,
            previousVideoSourceDigest: previousVideoA,
            reason: "Fictional retirement after source correction.",
          },
        ];
        update2.unavailableCases = [
          {
            caseId: caseB.id,
            previousClinicalDigest: previousClinicalB,
            previousVideoSourceDigest: previousVideoB,
            currentClinicalDigest: computeCaseContentDigest(caseB),
            currentVideoSourceDigest: computeVideoSourceDigest(caseB),
            detectedAt: "2026-11-01T00:00:00Z",
            previousEmbedStatus: "verified",
            action: "switched to clearly labeled external link",
          },
        ];
        update2.review.reviewedContentDigest =
          computeQuarterlyUpdateDigest(update2);
        return { update2, cases2: [caseA, caseB] };
      });
      expect(scenario.candidate2.caseSnapshots).toEqual([]);
      expect(
        validateQuarterlyUpdateAgainstRelease(
          scenario.update2,
          scenario.cases2,
          scenario.first.candidate,
          scenario.candidate2,
        ),
      ).toEqual([]);

      const wrongPrev = structuredClone(scenario.update2);
      wrongPrev.retiredCases[0].previousClinicalDigest = hex("9");
      wrongPrev.review.reviewedContentDigest =
        computeQuarterlyUpdateDigest(wrongPrev);
      expect(
        validateQuarterlyUpdateAgainstRelease(
          wrongPrev,
          scenario.cases2,
          scenario.first.candidate,
          scenario.candidate2,
        ).map((issue) => issue.code),
      ).toContain("release-retired");

      const wrongCurrent = structuredClone(scenario.update2);
      wrongCurrent.unavailableCases[0].currentVideoSourceDigest = hex("9");
      wrongCurrent.review.reviewedContentDigest =
        computeQuarterlyUpdateDigest(wrongCurrent);
      expect(
        validateQuarterlyUpdateAgainstRelease(
          wrongCurrent,
          scenario.cases2,
          scenario.first.candidate,
          scenario.candidate2,
        ).map((issue) => issue.code),
      ).toContain("release-unavailable");
    });

    it("rejects re-adding a case that already exists in the prior snapshot", () => {
      const scenario = secondReleaseScenario((caseA, caseB) => {
        const update2 = emptyUpdate2();
        update2.addedCases = [
          {
            caseId: caseA.id,
            currentClinicalDigest: computeCaseContentDigest(caseA),
            currentVideoSourceDigest: computeVideoSourceDigest(caseA),
          },
        ];
        update2.review.reviewedContentDigest =
          computeQuarterlyUpdateDigest(update2);
        return { update2, cases2: [caseA, caseB] };
      });
      expect(
        validateQuarterlyUpdateAgainstRelease(
          scenario.update2,
          scenario.cases2,
          scenario.first.candidate,
          scenario.candidate2,
        ).map((issue) => issue.code),
      ).toContain("release-added");
    });

    it("supports append validation of the grown history", () => {
      const scenario = secondReleaseScenario((caseA, caseB) => {
        const update2 = emptyUpdate2();
        update2.review.reviewedContentDigest =
          computeQuarterlyUpdateDigest(update2);
        return { update2, cases2: [caseA, caseB] };
      });
      const next = {
        releases: [scenario.first.candidate, scenario.candidate2],
        schemaVersion: 1,
      };
      expect(
        validateHistoryAppend(
          Buffer.from(scenario.history1Bytes),
          next as any,
          sha256Hex(scenario.history1Bytes),
        ),
      ).toEqual([]);

      const tampered = structuredClone(next) as any;
      tampered.releases[0].siteDigest = hex("9");
      expect(
        validateHistoryAppend(
          Buffer.from(scenario.history1Bytes),
          tampered,
          sha256Hex(scenario.history1Bytes),
        ).length,
      ).toBeGreaterThan(0);
    });
  });

  it("validates historical updates against their recorded snapshots", () => {
    const { update, candidate } = firstReleaseScenario();
    const history = { releases: [candidate], schemaVersion: 1 };
    expect(validateHistoricalUpdates(history as any, [update])).toEqual([]);

    const changed = structuredClone(update);
    changed.summary += " Rewritten history.";
    expect(
      validateHistoricalUpdates(history as any, [changed]).map(
        (issue) => issue.code,
      ),
    ).toContain("release-history-update-changed");

    expect(
      validateHistoricalUpdates(history as any, []).map((issue) => issue.code),
    ).toContain("release-history-update-missing");
  });

  it("refuses to build a candidate from a superseded binding", () => {
    const caseA = makePublic(loadFixture("cases/valid-approved-classic.json"));
    const registry = launchRegistry();
    const corrected: SourceManifestRegistryV1 = {
      schemaVersion: 1,
      entries: [
        ...registry.entries,
        {
          manifestId: "FICTIONAL-SOURCE-2026-09-01-001",
          manifestPath:
            "research/source-manifests/FICTIONAL-SOURCE-2026-09-01-001.v1.json",
          manifestDigest: hex("7"),
          sourceReviewDecisionPath:
            "research/reviews/source-batches/FICTIONAL-SOURCE-2026-09-01-001-source-review-decision.v1.json",
          sourceReviewDecisionDigest: hex("8"),
          sourcePolicyVersion: CURRENT_SOURCE_POLICY_VERSION,
          batchType: "correction",
          period: "2026-09-01",
          createdAt: "2026-09-01T00:00:00Z",
          previousRegistryBytesDigest: sha256Hex(canonicalJson(registry)),
          supersedes: [
            {
              manifestId: registry.entries[0]!.manifestId,
              candidateId: "FIC-CAND-002",
              entryDigest: caseA.sourceManifestBinding.entryDigest,
            },
          ],
        },
      ],
    };
    const input = candidateInput(
      [caseA],
      [baselineUpdate([caseA])],
      null,
      EMPTY_PUBLIC_RELEASE_HISTORY_BYTES,
    );
    input.registry = corrected;
    expect(() => buildCandidateReleaseSnapshot(input)).toThrow();
  });
});
