/**
 * Append-only public-release history contract. Each finalized release is an
 * immutable hash-chained snapshot; initial platform data is the canonical
 * empty history, never a fabricated release.
 */

import { z } from "astro/zod";
import {
  canonicalJson,
  CanonicalJsonError,
  isValidUtcTimestamp,
  issue,
  parseStrictJson,
  SHA256_RE,
  sha256Hex,
  type ValidationIssue,
} from "./canonical";
import {
  resolveHistoricalSourceManifestBinding,
  sourceBatchManifestSchema,
  type SourceManifestRegistryV1,
} from "./source-manifest-registry";

export const EMPTY_PUBLIC_RELEASE_HISTORY_BYTES =
  '{"releases":[],"schemaVersion":1}';

const nonEmpty = z.string().min(1);
const sha256Lower = z.string().regex(SHA256_RE);
const utcTimestamp = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
const gitCommit = z.string().regex(/^[0-9a-f]{40}$/);

export const releaseCaseSnapshotSchema = z.strictObject({
  caseId: nonEmpty,
  clinicalDigest: sha256Lower,
  videoSourceDigest: sha256Lower,
  candidateId: nonEmpty,
  manifestId: nonEmpty,
  manifestDigest: sha256Lower,
  entryDigest: sha256Lower,
  sourceReviewDecisionDigest: sha256Lower,
  sourcePolicyVersion: nonEmpty,
});
export type ReleaseCaseSnapshot = z.infer<typeof releaseCaseSnapshotSchema>;

export const releaseOverviewSnapshotSchema = z.strictObject({
  injuryCode: nonEmpty,
  overviewDigest: sha256Lower,
});
export type ReleaseOverviewSnapshot = z.infer<
  typeof releaseOverviewSnapshotSchema
>;

export const releaseUpdateSnapshotSchema = z.strictObject({
  updateId: nonEmpty,
  updateDigest: sha256Lower,
  publishedAt: utcTimestamp,
});
export type ReleaseUpdateSnapshot = z.infer<typeof releaseUpdateSnapshotSchema>;

export const publicReleaseSnapshotSchema = z.strictObject({
  releaseId: nonEmpty,
  releasedAt: utcTimestamp,
  previousReleaseDigest: sha256Lower.nullable(),
  previousHistoryBytesDigest: sha256Lower,
  siteDigest: sha256Lower,
  sitePublicationDecisionDigest: sha256Lower,
  buildCommit: gitCommit,
  publicRendererTreeDigest: sha256Lower,
  deploymentArtifactDigest: sha256Lower,
  servedArtifactReceiptDigest: sha256Lower,
  publicUrlHash: sha256Lower,
  caseSnapshots: z.array(releaseCaseSnapshotSchema),
  injuryOverviewSnapshots: z.array(releaseOverviewSnapshotSchema),
  updateSnapshots: z.array(releaseUpdateSnapshotSchema),
  releaseDigest: sha256Lower,
});
export type PublicReleaseSnapshot = z.infer<typeof publicReleaseSnapshotSchema>;

export const publicReleaseHistorySchema = z.strictObject({
  schemaVersion: z.literal(1),
  releases: z.array(publicReleaseSnapshotSchema),
});
export type PublicReleaseHistory = z.infer<typeof publicReleaseHistorySchema>;

export type ReleaseArtifactLoader = (
  buildCommit: string,
  path: string,
) => Uint8Array;

/**
 * Hashes the canonical release payload with only its own `releaseDigest`
 * field omitted.
 */
export function computePublicReleaseDigest(
  release: Omit<PublicReleaseSnapshot, "releaseDigest"> &
    Partial<Pick<PublicReleaseSnapshot, "releaseDigest">>,
): string {
  const { releaseDigest: _omitted, ...payload } = release;
  return sha256Hex(canonicalJson(payload));
}

function isSorted<T>(values: readonly T[], key: (value: T) => string): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (key(values[i - 1] as T) >= key(values[i] as T)) return false;
  }
  return true;
}

/** Verifies internal schema and hash-chain consistency of a history object. */
export function validateReleaseHistory(history: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const parsed = publicReleaseHistorySchema.safeParse(history);
  if (!parsed.success) {
    for (const zodIssue of parsed.error.issues) {
      issues.push(
        issue("history-schema", zodIssue.path.join("."), zodIssue.message),
      );
    }
    return issues;
  }
  const releases = parsed.data.releases;

  const releaseIds = new Set<string>();
  releases.forEach((release, index) => {
    const path = `releases[${index}]`;
    if (releaseIds.has(release.releaseId)) {
      issues.push(
        issue(
          "history-duplicate",
          path,
          `duplicate release ID ${release.releaseId}`,
        ),
      );
    }
    releaseIds.add(release.releaseId);

    if (!isValidUtcTimestamp(release.releasedAt)) {
      issues.push(
        issue("history-schema", `${path}.releasedAt`, "invalid timestamp"),
      );
    }

    const updateIds = new Set<string>();
    for (const snapshot of release.updateSnapshots) {
      if (updateIds.has(snapshot.updateId)) {
        issues.push(
          issue(
            "history-duplicate",
            `${path}.updateSnapshots`,
            `duplicate update ID ${snapshot.updateId}`,
          ),
        );
      }
      updateIds.add(snapshot.updateId);
    }
    if (!isSorted(release.caseSnapshots, (snapshot) => snapshot.caseId)) {
      issues.push(
        issue(
          "history-order",
          `${path}.caseSnapshots`,
          "case snapshots must be sorted by caseId",
        ),
      );
    }
    if (
      !isSorted(
        release.injuryOverviewSnapshots,
        (snapshot) => snapshot.injuryCode,
      )
    ) {
      issues.push(
        issue(
          "history-order",
          `${path}.injuryOverviewSnapshots`,
          "overview snapshots must be sorted by injuryCode",
        ),
      );
    }
    if (!isSorted(release.updateSnapshots, (snapshot) => snapshot.updateId)) {
      issues.push(
        issue(
          "history-order",
          `${path}.updateSnapshots`,
          "update snapshots must be sorted by updateId",
        ),
      );
    }

    if (index === 0) {
      if (release.previousReleaseDigest !== null) {
        issues.push(
          issue(
            "history-first-release",
            `${path}.previousReleaseDigest`,
            "the first release has no predecessor",
          ),
        );
      }
      if (
        release.previousHistoryBytesDigest !==
        sha256Hex(EMPTY_PUBLIC_RELEASE_HISTORY_BYTES)
      ) {
        issues.push(
          issue(
            "history-first-release",
            `${path}.previousHistoryBytesDigest`,
            "the first release must anchor the canonical empty-history bytes digest",
          ),
        );
      }
    } else {
      const previous = releases[index - 1] as PublicReleaseSnapshot;
      if (release.previousReleaseDigest !== previous.releaseDigest) {
        issues.push(
          issue(
            "history-chain",
            `${path}.previousReleaseDigest`,
            "release must point to the exact previous releaseDigest",
          ),
        );
      }
    }

    const measured = computePublicReleaseDigest(release);
    if (measured !== release.releaseDigest) {
      issues.push(
        issue(
          "history-digest",
          `${path}.releaseDigest`,
          "stored releaseDigest does not match the canonical release payload",
        ),
      );
    }
  });

  return issues;
}

/**
 * Proves append-only continuity against exact canonical bytes loaded from the
 * prior finalized release commit or anchored handoff.
 */
export function validateHistoryAppend(
  previousCanonicalBytes: Uint8Array,
  nextHistory: PublicReleaseHistory,
  expectedPreviousBytesDigest: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const measured = sha256Hex(previousCanonicalBytes);
  if (measured !== expectedPreviousBytesDigest) {
    issues.push(
      issue(
        "history-append-prev-digest",
        "",
        `previous history bytes hash ${measured} does not equal the trusted digest ${expectedPreviousBytesDigest}`,
      ),
    );
    return issues;
  }
  let previousParsed: unknown;
  try {
    previousParsed = parseStrictJson(
      Buffer.from(previousCanonicalBytes).toString("utf8"),
    );
  } catch (error) {
    issues.push(
      issue(
        "history-append-prev-digest",
        "",
        error instanceof CanonicalJsonError
          ? error.message
          : "previous history bytes are not strict JSON",
      ),
    );
    return issues;
  }
  if (
    canonicalJson(previousParsed) !==
    Buffer.from(previousCanonicalBytes).toString("utf8")
  ) {
    issues.push(
      issue(
        "history-append-prev-digest",
        "",
        "previous history bytes are not canonical",
      ),
    );
    return issues;
  }
  const previousIssues = validateReleaseHistory(previousParsed);
  if (previousIssues.length > 0) return [...issues, ...previousIssues];
  const nextIssues = validateReleaseHistory(nextHistory);
  if (nextIssues.length > 0) return [...issues, ...nextIssues];

  const previousHistory = previousParsed as PublicReleaseHistory;
  const previousReleases = previousHistory.releases;
  const nextReleases = nextHistory.releases;
  if (nextReleases.length !== previousReleases.length + 1) {
    issues.push(
      issue(
        "history-append-count",
        "releases",
        `exactly one release must be appended (${previousReleases.length} -> ${nextReleases.length})`,
      ),
    );
    return issues;
  }
  for (let i = 0; i < previousReleases.length; i += 1) {
    if (canonicalJson(previousReleases[i]) !== canonicalJson(nextReleases[i])) {
      issues.push(
        issue(
          "history-append-prefix",
          `releases[${i}]`,
          "existing release objects must remain byte-for-byte immutable",
        ),
      );
    }
  }
  if (issues.length > 0) return issues;

  const terminal = nextReleases[
    nextReleases.length - 1
  ] as PublicReleaseSnapshot;
  const previousHead =
    previousReleases.length === 0
      ? null
      : (previousReleases[previousReleases.length - 1] as PublicReleaseSnapshot)
          .releaseDigest;
  if (terminal.previousReleaseDigest !== previousHead) {
    issues.push(
      issue(
        "history-append-predecessor",
        "releases",
        "the appended release must point to the old terminal releaseDigest",
      ),
    );
  }
  if (terminal.previousHistoryBytesDigest !== expectedPreviousBytesDigest) {
    issues.push(
      issue(
        "history-append-predecessor",
        "releases",
        "the appended release must anchor the exact prior history-file bytes digest",
      ),
    );
  }
  return issues;
}

/**
 * Validates every stored snapshot's immutable source tuple against the
 * append-only registry and read-only release-commit artifacts. Never reads a
 * current case and calls only the historical resolver.
 */
export function validateHistoricalReleaseSources(
  history: PublicReleaseHistory,
  registry: SourceManifestRegistryV1,
  loadArtifactAtCommit: ReleaseArtifactLoader,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const release of history.releases) {
    for (const snapshot of release.caseSnapshots) {
      const path = `${release.releaseId}.${snapshot.caseId}`;
      let resolved;
      try {
        resolved = resolveHistoricalSourceManifestBinding(registry, {
          candidateId: snapshot.candidateId,
          manifestId: snapshot.manifestId,
          manifestDigest: snapshot.manifestDigest,
          entryDigest: snapshot.entryDigest,
          sourceReviewDecisionDigest: snapshot.sourceReviewDecisionDigest,
          sourcePolicyVersion: snapshot.sourcePolicyVersion,
        });
      } catch (error) {
        issues.push(
          issue(
            "history-source-resolve",
            path,
            error instanceof Error
              ? error.message
              : "snapshot source tuple did not resolve",
          ),
        );
        continue;
      }
      const entry = resolved.entry;

      let manifestBytes: Uint8Array;
      let decisionBytes: Uint8Array;
      try {
        manifestBytes = loadArtifactAtCommit(
          release.buildCommit,
          entry.manifestPath,
        );
        decisionBytes = loadArtifactAtCommit(
          release.buildCommit,
          entry.sourceReviewDecisionPath,
        );
      } catch {
        issues.push(
          issue(
            "history-source-artifact",
            path,
            "immutable release-commit artifacts are missing",
          ),
        );
        continue;
      }
      if (sha256Hex(manifestBytes) !== snapshot.manifestDigest) {
        issues.push(
          issue(
            "history-source-digest",
            path,
            "manifest bytes at the release commit do not match the stored digest",
          ),
        );
        continue;
      }
      if (sha256Hex(decisionBytes) !== snapshot.sourceReviewDecisionDigest) {
        issues.push(
          issue(
            "history-source-digest",
            path,
            "decision bytes at the release commit do not match the stored digest",
          ),
        );
        continue;
      }
      let manifestParsed;
      try {
        manifestParsed = sourceBatchManifestSchema.safeParse(
          parseStrictJson(Buffer.from(manifestBytes).toString("utf8")),
        );
      } catch {
        issues.push(
          issue(
            "history-source-artifact",
            path,
            "manifest bytes are not strict JSON",
          ),
        );
        continue;
      }
      if (!manifestParsed.success) {
        issues.push(
          issue("history-source-artifact", path, "manifest shape is invalid"),
        );
        continue;
      }
      const candidate = manifestParsed.data.entries.find(
        (candidateEntry) => candidateEntry.candidateId === snapshot.candidateId,
      );
      if (candidate === undefined) {
        issues.push(
          issue(
            "history-source-resolve",
            path,
            "snapshot candidate is absent from the release-time manifest",
          ),
        );
        continue;
      }
      if (sha256Hex(canonicalJson(candidate)) !== snapshot.entryDigest) {
        issues.push(
          issue(
            "history-source-digest",
            path,
            "release-time entry digest does not match the stored snapshot",
          ),
        );
      }
    }
  }
  return issues;
}
