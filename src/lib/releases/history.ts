/**
 * Candidate release building and release-transition validation. Historical
 * releases validate against their own immutable snapshots; the current
 * candidate uses only the active source resolver and the digest library.
 */

import {
  computeCaseContentDigest,
  computeVideoSourceDigest,
} from "../cases/digest";
import { computeInjuryOverviewDigest } from "../cases/injury-overview-digest";
import { selectPublicCases } from "../cases/selectors";
import { computeQuarterlyUpdateDigest } from "../cases/update-digest";
import { issue, type ValidationIssue } from "../contracts/canonical";
import type { InjuryCase } from "../contracts/case";
import type { InjuryOverview } from "../contracts/injury-overview";
import {
  computePublicReleaseDigest,
  type PublicReleaseSnapshot,
  type ReleaseCaseSnapshot,
} from "../contracts/release-history";
import {
  resolveSourceManifestBinding,
  type SourceManifestRegistryV1,
} from "../contracts/source-manifest-registry";
import type { QuarterlyUpdate } from "../contracts/update";

export {
  EMPTY_PUBLIC_RELEASE_HISTORY_BYTES,
  computePublicReleaseDigest,
  publicReleaseHistorySchema,
  validateHistoricalReleaseSources,
  validateHistoryAppend,
  validateReleaseHistory,
} from "../contracts/release-history";
export type {
  PublicReleaseHistory,
  PublicReleaseSnapshot,
  ReleaseArtifactLoader,
  ReleaseCaseSnapshot,
} from "../contracts/release-history";

export interface CandidateReleaseInput {
  releaseId: string;
  releasedAt: string;
  previousRelease: PublicReleaseSnapshot | null;
  previousHistoryBytesDigest: string;
  siteDigest: string;
  sitePublicationDecisionDigest: string;
  buildCommit: string;
  publicRendererTreeDigest: string;
  deploymentArtifactDigest: string;
  servedArtifactReceiptDigest: string;
  publicUrlHash: string;
  cases: InjuryCase[];
  overviews: InjuryOverview[];
  updates: QuarterlyUpdate[];
  registry: SourceManifestRegistryV1;
}

export class CandidateReleaseError extends Error {}

/**
 * Uses only the active source resolver and copies each selected case's exact
 * validated source tuple into its immutable snapshot; refuses a superseded or
 * historical-only binding.
 */
export function buildCandidateReleaseSnapshot(
  input: CandidateReleaseInput,
): PublicReleaseSnapshot {
  const caseSnapshots: ReleaseCaseSnapshot[] = selectPublicCases(input.cases)
    .map((record) => {
      // Fail closed: a superseded origin throws SourceBindingError here.
      resolveSourceManifestBinding(
        input.registry,
        record.sourceManifestBinding,
      );
      return {
        caseId: record.id,
        clinicalDigest: computeCaseContentDigest(record),
        videoSourceDigest: computeVideoSourceDigest(record),
        candidateId: record.sourceManifestBinding.candidateId,
        manifestId: record.sourceManifestBinding.manifestId,
        manifestDigest: record.sourceManifestBinding.manifestDigest,
        entryDigest: record.sourceManifestBinding.entryDigest,
        sourceReviewDecisionDigest:
          record.sourceManifestBinding.sourceReviewDecisionDigest,
        sourcePolicyVersion: record.sourceManifestBinding.sourcePolicyVersion,
      };
    })
    .sort((a, b) => (a.caseId < b.caseId ? -1 : 1));

  const injuryOverviewSnapshots = input.overviews
    .map((overview) => ({
      injuryCode: overview.injuryCode,
      overviewDigest: computeInjuryOverviewDigest(overview),
    }))
    .sort((a, b) => (a.injuryCode < b.injuryCode ? -1 : 1));

  const updateSnapshots = input.updates
    .map((update) => {
      if (update.publishedAt === null) {
        throw new CandidateReleaseError(
          `update ${update.id} requires an exact publishedAt before public authorization`,
        );
      }
      return {
        updateId: update.id,
        updateDigest: computeQuarterlyUpdateDigest(update),
        publishedAt: update.publishedAt,
      };
    })
    .sort((a, b) => (a.updateId < b.updateId ? -1 : 1));

  const payload = {
    releaseId: input.releaseId,
    releasedAt: input.releasedAt,
    previousReleaseDigest:
      input.previousRelease === null
        ? null
        : input.previousRelease.releaseDigest,
    previousHistoryBytesDigest: input.previousHistoryBytesDigest,
    siteDigest: input.siteDigest,
    sitePublicationDecisionDigest: input.sitePublicationDecisionDigest,
    buildCommit: input.buildCommit,
    publicRendererTreeDigest: input.publicRendererTreeDigest,
    deploymentArtifactDigest: input.deploymentArtifactDigest,
    servedArtifactReceiptDigest: input.servedArtifactReceiptDigest,
    publicUrlHash: input.publicUrlHash,
    caseSnapshots,
    injuryOverviewSnapshots,
    updateSnapshots,
  };
  return { ...payload, releaseDigest: computePublicReleaseDigest(payload) };
}

interface HeadDigests {
  record: InjuryCase;
  clinicalDigest: string;
  videoSourceDigest: string;
}

/**
 * Validates the current approved update against the last immutable public
 * snapshot and the candidate release. Historical updates are checked against
 * their own recorded release snapshot, never rewritten to match current head.
 */
export function validateQuarterlyUpdateAgainstRelease(
  update: QuarterlyUpdate,
  currentCases: InjuryCase[],
  previousRelease: PublicReleaseSnapshot | null,
  candidateRelease: PublicReleaseSnapshot,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const head = new Map<string, HeadDigests>(
    currentCases.map((record) => [
      record.id,
      {
        record,
        clinicalDigest: computeCaseContentDigest(record),
        videoSourceDigest: computeVideoSourceDigest(record),
      },
    ]),
  );
  const previousSnapshots = new Map<string, ReleaseCaseSnapshot>(
    (previousRelease?.caseSnapshots ?? []).map((snapshot) => [
      snapshot.caseId,
      snapshot,
    ]),
  );
  const candidateSnapshots = new Map<string, ReleaseCaseSnapshot>(
    candidateRelease.caseSnapshots.map((snapshot) => [
      snapshot.caseId,
      snapshot,
    ]),
  );

  const expectedDigest = computeQuarterlyUpdateDigest(update);
  if (
    update.review.status === "approved" &&
    update.review.reviewedContentDigest !== expectedDigest
  ) {
    issues.push(
      issue(
        "release-update-stale",
        "review.reviewedContentDigest",
        "the approved update digest is stale against the current update content",
      ),
    );
  }
  const updateSnapshot = candidateRelease.updateSnapshots.find(
    (snapshot) => snapshot.updateId === update.id,
  );
  if (
    updateSnapshot === undefined ||
    updateSnapshot.updateDigest !== expectedDigest ||
    update.publishedAt === null ||
    updateSnapshot.publishedAt !== update.publishedAt
  ) {
    issues.push(
      issue(
        "release-update-snapshot",
        "updateSnapshots",
        "the candidate release must bind this update's exact digest and publishedAt",
      ),
    );
  }

  if (previousRelease === null) {
    if (
      update.updatedCases.length > 0 ||
      update.retiredCases.length > 0 ||
      update.unavailableCases.length > 0
    ) {
      issues.push(
        issue(
          "release-first",
          "",
          "the first release's baseline update must contain only added cases",
        ),
      );
    }
    const addedIds = update.addedCases.map((entry) => entry.caseId).sort();
    const publicIds = candidateRelease.caseSnapshots
      .map((snapshot) => snapshot.caseId)
      .sort();
    if (
      addedIds.length !== publicIds.length ||
      addedIds.some((caseId, index) => caseId !== publicIds[index])
    ) {
      issues.push(
        issue(
          "release-first",
          "addedCases",
          "the baseline update must list every public case under addedCases",
        ),
      );
    }
  }

  for (const added of update.addedCases) {
    const path = `addedCases.${added.caseId}`;
    if (previousSnapshots.has(added.caseId)) {
      issues.push(
        issue(
          "release-added",
          path,
          "added case already exists in the prior snapshot",
        ),
      );
      continue;
    }
    const current = head.get(added.caseId);
    if (
      current === undefined ||
      added.currentClinicalDigest !== current.clinicalDigest ||
      added.currentVideoSourceDigest !== current.videoSourceDigest
    ) {
      issues.push(
        issue(
          "release-added",
          path,
          "added digests must match the current head",
        ),
      );
    }
  }

  if (previousRelease !== null) {
    for (const updated of update.updatedCases) {
      const path = `updatedCases.${updated.caseId}`;
      const previous = previousSnapshots.get(updated.caseId);
      const current = head.get(updated.caseId);
      if (
        previous === undefined ||
        updated.previousClinicalDigest !== previous.clinicalDigest ||
        updated.previousVideoSourceDigest !== previous.videoSourceDigest
      ) {
        issues.push(
          issue(
            "release-updated",
            path,
            "previous digests must match the prior immutable snapshot",
          ),
        );
        continue;
      }
      if (
        current === undefined ||
        updated.currentClinicalDigest !== current.clinicalDigest ||
        updated.currentVideoSourceDigest !== current.videoSourceDigest
      ) {
        issues.push(
          issue(
            "release-updated",
            path,
            "current digests must match current head",
          ),
        );
      }
    }

    for (const retired of update.retiredCases) {
      const path = `retiredCases.${retired.caseId}`;
      const previous = previousSnapshots.get(retired.caseId);
      const current = head.get(retired.caseId);
      if (
        previous === undefined ||
        retired.previousClinicalDigest !== previous.clinicalDigest ||
        retired.previousVideoSourceDigest !== previous.videoSourceDigest
      ) {
        issues.push(
          issue(
            "release-retired",
            path,
            "previous digests must match the prior immutable snapshot",
          ),
        );
        continue;
      }
      if (
        current === undefined ||
        current.record.status !== "retired" ||
        current.clinicalDigest !== retired.previousClinicalDigest ||
        current.videoSourceDigest !== retired.previousVideoSourceDigest
      ) {
        issues.push(
          issue(
            "release-retired",
            path,
            "a retired case must remain a current retired audit record with the same digests",
          ),
        );
      }
      if (candidateSnapshots.has(retired.caseId)) {
        issues.push(
          issue(
            "release-retired",
            path,
            "a retired case must be absent from the new public case snapshot",
          ),
        );
      }
    }

    for (const unavailable of update.unavailableCases) {
      const path = `unavailableCases.${unavailable.caseId}`;
      const previous = previousSnapshots.get(unavailable.caseId);
      const current = head.get(unavailable.caseId);
      if (
        previous === undefined ||
        unavailable.previousClinicalDigest !== previous.clinicalDigest ||
        unavailable.previousVideoSourceDigest !== previous.videoSourceDigest
      ) {
        issues.push(
          issue(
            "release-unavailable",
            path,
            "previous digests must match the prior immutable snapshot",
          ),
        );
        continue;
      }
      if (
        current === undefined ||
        current.record.video.embedStatus !== "unavailable" ||
        unavailable.currentClinicalDigest !== current.clinicalDigest ||
        unavailable.currentVideoSourceDigest !== current.videoSourceDigest
      ) {
        issues.push(
          issue(
            "release-unavailable",
            path,
            "current digests must equal the current unavailable record",
          ),
        );
      }
      if (candidateSnapshots.has(unavailable.caseId)) {
        issues.push(
          issue(
            "release-unavailable",
            path,
            "an unavailable case must be absent from the new public case snapshot",
          ),
        );
      }
    }

    const listedIds = new Set(
      [
        ...update.addedCases,
        ...update.updatedCases,
        ...update.retiredCases,
        ...update.unavailableCases,
      ].map((entry) => entry.caseId),
    );
    for (const [caseId, previous] of previousSnapshots) {
      if (listedIds.has(caseId)) continue;
      const current = head.get(caseId);
      if (
        current === undefined ||
        current.clinicalDigest !== previous.clinicalDigest ||
        current.videoSourceDigest !== previous.videoSourceDigest
      ) {
        issues.push(
          issue(
            "release-head-drift",
            caseId,
            "an unchanged prior-public case whose head digest changed must be listed as updated",
          ),
        );
      }
    }
  }

  return issues;
}

/**
 * Checks each historical release's update snapshots against the immutable
 * update records; changed or missing old updates fail.
 */
export function validateHistoricalUpdates(
  history: { releases: PublicReleaseSnapshot[] },
  updates: QuarterlyUpdate[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const byId = new Map(updates.map((update) => [update.id, update]));
  for (const release of history.releases) {
    for (const snapshot of release.updateSnapshots) {
      const path = `${release.releaseId}.${snapshot.updateId}`;
      const update = byId.get(snapshot.updateId);
      if (update === undefined) {
        issues.push(
          issue(
            "release-history-update-missing",
            path,
            "a historically released update record is missing",
          ),
        );
        continue;
      }
      if (
        computeQuarterlyUpdateDigest(update) !== snapshot.updateDigest ||
        update.publishedAt !== snapshot.publishedAt
      ) {
        issues.push(
          issue(
            "release-history-update-changed",
            path,
            "a historically released update was changed after its release snapshot",
          ),
        );
      }
    }
  }
  return issues;
}
