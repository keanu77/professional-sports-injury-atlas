/**
 * Strict, offline generator/checker for the Decision 8 embed correction.
 *
 * The owner-approved review set and the two earlier source batches are frozen
 * by exact byte digests. `--write` deterministically emits only the canonical
 * source decision, correction manifest, and one-entry registry append;
 * `--check` reconstructs all three and rejects any byte drift.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import {
  canonicalSourceReviewDecisionSchema,
  parseSourceManifestRegistryBytes,
  validateSourceManifestRegistryAppend,
  validateSourceManifestRegistryArtifacts,
  type SourceManifestRegistryEntry,
  type SourceManifestRegistryV1,
} from "../../src/lib/contracts/source-manifest-registry";
import {
  computeCandidateManifestEntryDigest,
  digestCandidateManifest,
  parseCandidateManifestBytes,
  serializeCandidateManifest,
  validateCandidateManifest,
  type CandidateSourceManifestEntryV1,
  type CandidateSourceManifestV1,
  type SourceManifestSupersedesReference,
} from "../../src/lib/research/candidate-manifest";
import { parseYouTubeVideoId } from "../../src/lib/video/youtube";

export const BATCH2_REVIEW_SET_PATH =
  "research/reviews/embed-enrichment/NBA-EMBED-2026-08-10-001-review-set.v1.json";
export const BATCH2_ORIGIN_MANIFEST_PATH =
  "research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json";
export const BATCH2_CORRECTION_MANIFEST_PATH =
  "research/source-manifests/NBA-SOURCE-2026-08-10-001.v1.json";
export const BATCH2_DECISION_PATH =
  "research/reviews/source-batches/NBA-SOURCE-2026-08-10-001-source-review-decision.v1.json";
export const BATCH2_REGISTRY_PATH = "research/source-manifest-registry.v1.json";

const PREVIOUS_REVIEW_SET_PATH =
  "research/reviews/embed-enrichment/NBA-EMBED-2026-08-08-001-review-set.v1.json";
const PLAYWRIGHT_RECORD_PATH =
  "docs/reviews/2026-08-10-nba-embed-batch2-playwright-stop.md";
const LEAD_PACKAGE_PATH =
  "/Users/ethanai/co-work/online_sportsinjury/.claude/external-leads/embed-hunt-round2.json";

export const BATCH2_MANIFEST_ID = "NBA-SOURCE-2026-08-10-001";
const BATCH2_REVIEW_SET_ID = "NBA-EMBED-2026-08-10-001";
const BATCH2_PERIOD = "2026-08-10";
const ORIGIN_MANIFEST_ID = "NBA-SOURCE-2026-08-06-001";
const EXPECTED_OWNER = "吳易澄醫師";
const EXPECTED_OWNER_REVIEWED_AT = "2026-08-10T11:36:08Z";
const EXPECTED_REVIEWED_SNAPSHOT_DIGEST =
  "02747f8a5aca555f9f4ff04232fdb0bcc820ed039793180b7904dce290d4c867";
const EXPECTED_REFROZEN_REVIEW_SET_DIGEST =
  "cb28edb95666acfe4c084c3e40813c66685d56f73ca5393031870c77a027ce43";
const EXPECTED_ORIGIN_MANIFEST_DIGEST =
  "8beedf3fcc0c7c498bf08ffb2fbc671759e7a61ed4e04f09afab579b6a86eb4d";
const EXPECTED_PREVIOUS_CORRECTION_MANIFEST_DIGEST =
  "4a25692e27115b6ec16818a64dd6e85778360e4f00e2b3f6a288b4ca5f0ed0bc";
const EXPECTED_PREVIOUS_REVIEW_SET_DIGEST =
  "9971d3161b72f19c7d19bb504cd65d226e2d3a54c65ecd9a2d81e10fff388a3e";
const EXPECTED_PREVIOUS_REGISTRY_BYTES_DIGEST =
  "d34caee309f0f13d6403c9bcb3f85c781fd6ad4661cdfb54e881542683d65d32";
const EXPECTED_PLAYWRIGHT_RECORD_DIGEST =
  "9b35c30764c984ca71522c9191274ebcd2e555a49a82c8f5eb0de39d3592b0f4";
const EXPECTED_LEAD_PACKAGE_DIGEST =
  "9f743a5eeb7e669a3038287ee55608136f11fb2d3d44b608daf53442a2db8dd5";

interface ReviewCorrection {
  candidateId: string;
  casePath: string;
  supersedes: SourceManifestSupersedesReference;
  eventIdentity: {
    athlete: string;
    eventDate: string;
    opponent: string;
    competition: string;
  };
  video: {
    provider: "youtube";
    contentType: "in-game-injury-event";
    canonicalUrl: string;
    title: string;
    titleIdentityNote: string | null;
    uploaderName: string;
    uploaderProvenance: "broadcaster-rightsholder";
    channelUrl: string;
    publishedAt: string;
    accessedAt: string;
    durationSeconds: number;
    embedStatus: "verified";
    embedCheckedAt: string;
    captionStatus: "available" | "unavailable";
    captionCheckedAt: string;
    privacyEnhancedPlayer: string;
    browserResult: string;
  };
}

interface Batch2ReviewSet {
  schemaVersion: 1;
  reviewSetId: string;
  status: "owner-approved";
  createdAt: string;
  sourcePolicyVersion: string;
  sourcePolicyDigests: { json: string; markdown: string };
  originManifest: {
    manifestId: string;
    manifestDigest: string;
    manifestPath: string;
  };
  evidence: {
    playwrightRecordPath: string;
    playwrightRecordDigest: string;
    leadPackagePath: string;
    leadPackageDigest: string;
  };
  audit: {
    checkedBy: string;
    checkedAt: string;
    browserRegion: string;
    acceptedVideoCount: number;
    acceptedCandidateCount: number;
    nonSelectedAlternateCount: number;
    mediaDownloadedOrCopied: boolean;
    thumbnailDownloadedOrCopied: boolean;
    transcriptDownloadedOrCopied: boolean;
    captionTextDownloadedOrCopied: boolean;
    audioDownloadedOrCopied: boolean;
    videoDownloadedOrCopied: boolean;
    method: string[];
  };
  acceptedCorrections: ReviewCorrection[];
  nonSelectedAlternates: Array<{
    candidateId: string;
    url: string;
    observedTitle: string;
    observedUploader: string;
    observedPublishedAt: string;
    observedDurationSeconds: number;
    embedStatus: "verified";
    embedCheckedAt: string;
    captionStatus: "unavailable";
    captionCheckedAt: string;
    reasonCode: string;
    reason: string;
  }>;
  ownerDecision: {
    status: "approved";
    reviewedBy: string;
    reviewedAt: string;
    reviewedReviewSetDigest: string;
  };
}

const EXPECTED_CORRECTIONS = [
  {
    candidateId: "CAND-NBA-ANKLE-2023-004",
    casePath: "src/content/cases/anfernee-simons-ankle-sprain-2023.json",
    entryDigest:
      "41c20c51b043257c9a516c7197e000343e26328dea5a161f0083da3b21b3c0c9",
    athlete: "Anfernee Simons",
    eventDate: "2023-02-14",
    opponent: "Washington Wizards",
    competition: "nba-regular-season",
    videoId: "8TIJGIRP634",
    title:
      "Anfernee Simons helped to locker room after suffering leg injury | NBA on ESPN",
    uploaderName: "NBA on ESPN",
    channelUrl: "https://www.youtube.com/@nbaonespn",
    durationSeconds: 86,
    checkedAt: "2026-08-10T10:55:07Z",
    captionStatus: "available",
  },
  {
    candidateId: "CAND-NBA-ACHILLES-2025-016",
    casePath: "src/content/cases/jayson-tatum-achilles-rupture-2025.json",
    entryDigest:
      "d9b0468b2b683bed03141a48b8d839fd751d923eb49ca6a98afca713174bc171",
    athlete: "Jayson Tatum",
    eventDate: "2025-05-12",
    opponent: "New York Knicks",
    competition: "nba-playoffs",
    videoId: "xSUKd03LJwE",
    title: "Jayson Tatum left Game 4 after suffering a non-contact injury",
    uploaderName: "NBA on ESPN",
    channelUrl: "https://www.youtube.com/@nbaonespn",
    durationSeconds: 22,
    checkedAt: "2026-08-10T10:56:27Z",
    captionStatus: "unavailable",
  },
  {
    candidateId: "CAND-NBA-ANKLE-2025-002",
    casePath: "src/content/cases/lamelo-ball-ankle-sprain-2025.json",
    entryDigest:
      "5318b193e5a43baa31fc29c82c47d6ff392cc9e07c0badfde951e577b51f22a8",
    athlete: "LaMelo Ball",
    eventDate: "2025-01-27",
    opponent: "Los Angeles Lakers",
    competition: "nba-regular-season",
    videoId: "zZdndTqOexc",
    title:
      "LaMelo Ball would go into the locker room after noticeably limping on court.",
    uploaderName: "NBA on ESPN",
    channelUrl: "https://www.youtube.com/@nbaonespn",
    durationSeconds: 47,
    checkedAt: "2026-08-10T10:57:32Z",
    captionStatus: "available",
  },
  {
    candidateId: "CAND-NBA-ACHILLES-2025-017",
    casePath: "src/content/cases/tyrese-haliburton-achilles-rupture-2025.json",
    entryDigest:
      "9341384e98fde6234074002d29eb97f0ca990f8899890ad4dcfecaf9f4ee0c56",
    athlete: "Tyrese Haliburton",
    eventDate: "2025-06-22",
    opponent: "Oklahoma City Thunder",
    competition: "nba-playoffs",
    videoId: "azQpbyDBktk",
    title: "The moment Tyrese Haliburton suffered an injury in Game 7",
    uploaderName: "ESPN",
    channelUrl: "https://www.youtube.com/@espn",
    durationSeconds: 52,
    checkedAt: "2026-08-10T10:58:41Z",
    captionStatus: "unavailable",
  },
] as const;

function pathAt(root: string, path: string): string {
  return isAbsolute(path) ? path : resolve(root, path);
}

function read(root: string, path: string): Buffer {
  return readFileSync(pathAt(root, path));
}

function fileDigest(root: string, path: string): string {
  return sha256Hex(read(root, path));
}

function mustManifest(root: string, path: string): CandidateSourceManifestV1 {
  const parsed = parseCandidateManifestBytes(read(root, path));
  if (parsed.manifest === null) {
    throw new Error(
      `${path} invalid: ${parsed.issues
        .map((entry) => `[${entry.code}] ${entry.path} ${entry.message}`)
        .join("; ")}`,
    );
  }
  return parsed.manifest;
}

function reviewedSnapshotBytes(value: Batch2ReviewSet): string {
  return `${JSON.stringify(
    { ...value, status: "awaiting-owner-review", ownerDecision: null },
    null,
    2,
  )}\n`;
}

function expectedCorrectionProjection(
  correction: ReviewCorrection,
): Record<string, unknown> {
  return {
    candidateId: correction.candidateId,
    casePath: correction.casePath,
    entryDigest: correction.supersedes.entryDigest,
    athlete: correction.eventIdentity.athlete,
    eventDate: correction.eventIdentity.eventDate,
    opponent: correction.eventIdentity.opponent,
    competition: correction.eventIdentity.competition,
    videoId: parseYouTubeVideoId(correction.video.canonicalUrl),
    title: correction.video.title,
    uploaderName: correction.video.uploaderName,
    channelUrl: correction.video.channelUrl,
    durationSeconds: correction.video.durationSeconds,
    checkedAt: correction.video.embedCheckedAt,
    captionStatus: correction.video.captionStatus,
  };
}

export function parseBatch2ReviewSet(
  root: string = process.cwd(),
): Batch2ReviewSet {
  const bytes = read(root, BATCH2_REVIEW_SET_PATH);
  if (sha256Hex(bytes) !== EXPECTED_REFROZEN_REVIEW_SET_DIGEST) {
    throw new Error("owner-approved batch-2 review-set bytes drifted");
  }
  const value = parseStrictJson(bytes.toString("utf8")) as Batch2ReviewSet;
  if (`${JSON.stringify(value, null, 2)}\n` !== bytes.toString("utf8")) {
    throw new Error("batch-2 review set is not exact pretty-printed JSON");
  }
  if (
    value.schemaVersion !== 1 ||
    value.reviewSetId !== BATCH2_REVIEW_SET_ID ||
    value.status !== "owner-approved" ||
    value.createdAt !== "2026-08-10T11:00:23Z" ||
    value.sourcePolicyVersion !== "nba-v2"
  ) {
    throw new Error("batch-2 review-set identity/status drift");
  }
  if (
    value.ownerDecision.status !== "approved" ||
    value.ownerDecision.reviewedBy !== EXPECTED_OWNER ||
    value.ownerDecision.reviewedAt !== EXPECTED_OWNER_REVIEWED_AT ||
    value.ownerDecision.reviewedReviewSetDigest !==
      EXPECTED_REVIEWED_SNAPSHOT_DIGEST ||
    sha256Hex(reviewedSnapshotBytes(value)) !==
      EXPECTED_REVIEWED_SNAPSHOT_DIGEST
  ) {
    throw new Error("owner decision does not bind the exact reviewed snapshot");
  }
  if (
    value.originManifest.manifestId !== ORIGIN_MANIFEST_ID ||
    value.originManifest.manifestPath !== BATCH2_ORIGIN_MANIFEST_PATH ||
    value.originManifest.manifestDigest !== EXPECTED_ORIGIN_MANIFEST_DIGEST ||
    fileDigest(root, BATCH2_ORIGIN_MANIFEST_PATH) !==
      EXPECTED_ORIGIN_MANIFEST_DIGEST
  ) {
    throw new Error("immutable origin-manifest binding drift");
  }
  if (
    fileDigest(
      root,
      "research/source-manifests/NBA-SOURCE-2026-08-08-001.v1.json",
    ) !== EXPECTED_PREVIOUS_CORRECTION_MANIFEST_DIGEST ||
    fileDigest(root, PREVIOUS_REVIEW_SET_PATH) !==
      EXPECTED_PREVIOUS_REVIEW_SET_DIGEST
  ) {
    throw new Error("prior correction artifacts are not byte-immutable");
  }
  if (
    value.evidence.playwrightRecordPath !== PLAYWRIGHT_RECORD_PATH ||
    value.evidence.playwrightRecordDigest !==
      EXPECTED_PLAYWRIGHT_RECORD_DIGEST ||
    fileDigest(root, PLAYWRIGHT_RECORD_PATH) !==
      EXPECTED_PLAYWRIGHT_RECORD_DIGEST ||
    value.evidence.leadPackagePath !== LEAD_PACKAGE_PATH ||
    value.evidence.leadPackageDigest !== EXPECTED_LEAD_PACKAGE_DIGEST ||
    fileDigest(root, LEAD_PACKAGE_PATH) !== EXPECTED_LEAD_PACKAGE_DIGEST
  ) {
    throw new Error("frozen local evidence binding drift");
  }
  if (
    value.audit.checkedBy !== "Codex embed batch 2 Playwright auditor" ||
    value.audit.checkedAt !== "2026-08-10T11:00:23Z" ||
    value.audit.browserRegion !== "TW" ||
    value.audit.acceptedVideoCount !== 4 ||
    value.audit.acceptedCandidateCount !== 4 ||
    value.audit.nonSelectedAlternateCount !== 1 ||
    value.audit.mediaDownloadedOrCopied !== false ||
    value.audit.thumbnailDownloadedOrCopied !== false ||
    value.audit.transcriptDownloadedOrCopied !== false ||
    value.audit.captionTextDownloadedOrCopied !== false ||
    value.audit.audioDownloadedOrCopied !== false ||
    value.audit.videoDownloadedOrCopied !== false
  ) {
    throw new Error("batch-2 audit counts or no-copy facts drift");
  }
  if (
    value.acceptedCorrections.length !== EXPECTED_CORRECTIONS.length ||
    canonicalJson(
      value.acceptedCorrections.map(expectedCorrectionProjection),
    ) !== canonicalJson(EXPECTED_CORRECTIONS)
  ) {
    throw new Error("batch-2 candidate/video/uploader/caption facts drift");
  }
  value.acceptedCorrections.forEach((correction, index) => {
    const expected = EXPECTED_CORRECTIONS[index];
    if (
      expected === undefined ||
      correction.supersedes.manifestId !== ORIGIN_MANIFEST_ID ||
      correction.supersedes.candidateId !== correction.candidateId ||
      correction.video.provider !== "youtube" ||
      correction.video.contentType !== "in-game-injury-event" ||
      correction.video.canonicalUrl !==
        `https://www.youtube.com/watch?v=${expected.videoId}` ||
      correction.video.privacyEnhancedPlayer !==
        `https://www.youtube-nocookie.com/embed/${expected.videoId}` ||
      correction.video.uploaderProvenance !== "broadcaster-rightsholder" ||
      correction.video.publishedAt !== expected.eventDate ||
      correction.video.accessedAt !== "2026-08-10" ||
      correction.video.embedStatus !== "verified" ||
      correction.video.captionCheckedAt !== expected.checkedAt ||
      correction.video.titleIdentityNote !== null ||
      correction.video.browserResult.length === 0
    ) {
      throw new Error(`acceptedCorrections[${index}] exact facts drift`);
    }
  });
  const alternate = value.nonSelectedAlternates[0];
  if (
    value.nonSelectedAlternates.length !== 1 ||
    alternate === undefined ||
    alternate.candidateId !== "CAND-NBA-ACHILLES-2025-017" ||
    alternate.url !== "https://www.youtube.com/watch?v=JNoDsgkZUbc" ||
    alternate.observedUploader !== "NBA on ESPN" ||
    alternate.observedPublishedAt !== "2025-06-22" ||
    alternate.observedDurationSeconds !== 30 ||
    alternate.embedStatus !== "verified" ||
    alternate.embedCheckedAt !== "2026-08-10T11:00:23Z" ||
    alternate.captionStatus !== "unavailable" ||
    alternate.captionCheckedAt !== "2026-08-10T11:00:23Z" ||
    alternate.reasonCode !== "owner-selected-closer-injury-moment"
  ) {
    throw new Error("the exact non-selected Haliburton alternate drifted");
  }
  const allUrls = [
    ...value.acceptedCorrections.map((entry) => entry.video.canonicalUrl),
    alternate.url,
  ];
  if (new Set(allUrls).size !== 5) {
    throw new Error(
      "accepted and non-selected video identities must be unique",
    );
  }
  return value;
}

function buildDecisionBytes(reviewSet: Batch2ReviewSet): string {
  return canonicalJson({
    candidateSetDigest: reviewSet.ownerDecision.reviewedReviewSetDigest,
    classicProposalCandidateIds: [],
    manifestId: BATCH2_MANIFEST_ID,
    reviewedAt: reviewSet.ownerDecision.reviewedAt,
    reviewedBy: reviewSet.ownerDecision.reviewedBy,
    schemaVersion: 1,
    sourcePolicyJsonDigest: reviewSet.sourcePolicyDigests.json,
    sourcePolicyMarkdownDigest: reviewSet.sourcePolicyDigests.markdown,
    status: "approved-for-manifest",
  });
}

function compareEntries(
  left: CandidateSourceManifestEntryV1,
  right: CandidateSourceManifestEntryV1,
): number {
  const injuryOrder = new Map([
    ["acl", 0],
    ["ankle-sprain", 1],
    ["achilles-rupture", 2],
  ]);
  return (
    (injuryOrder.get(left.injuryCode) ?? 3) -
      (injuryOrder.get(right.injuryCode) ?? 3) ||
    compareCodePoints(left.eventDate, right.eventDate) ||
    compareCodePoints(left.candidateId, right.candidateId)
  );
}

function compareSupersedes(
  left: SourceManifestSupersedesReference,
  right: SourceManifestSupersedesReference,
): number {
  return (
    compareCodePoints(left.manifestId, right.manifestId) ||
    compareCodePoints(left.candidateId, right.candidateId) ||
    compareCodePoints(left.entryDigest, right.entryDigest)
  );
}

export function buildBatch2CorrectionManifest(
  root: string = process.cwd(),
): CandidateSourceManifestV1 {
  const reviewSet = parseBatch2ReviewSet(root);
  const decisionBytes = buildDecisionBytes(reviewSet);
  const decisionDigest = sha256Hex(decisionBytes);
  const decisionResult = canonicalSourceReviewDecisionSchema.safeParse(
    parseStrictJson(decisionBytes),
  );
  if (!decisionResult.success) {
    throw new Error(
      `generated source decision invalid: ${decisionResult.error.message}`,
    );
  }
  const decision = decisionResult.data;
  const origin = mustManifest(root, BATCH2_ORIGIN_MANIFEST_PATH);
  const originById = new Map(
    origin.entries.map((entry) => [entry.candidateId, entry]),
  );
  const entries = reviewSet.acceptedCorrections
    .map((correction, index): CandidateSourceManifestEntryV1 => {
      const originEntry = originById.get(correction.candidateId);
      if (originEntry === undefined) {
        throw new Error(`missing origin entry ${correction.candidateId}`);
      }
      if (
        correction.supersedes.manifestId !== origin.manifestId ||
        correction.supersedes.candidateId !== originEntry.candidateId ||
        correction.supersedes.entryDigest !== originEntry.entryDigest ||
        correction.eventIdentity.athlete !== originEntry.athleteDisplayName ||
        correction.eventIdentity.eventDate !== originEntry.eventDate ||
        correction.eventIdentity.opponent !== originEntry.opponent ||
        correction.eventIdentity.competition !== originEntry.competition
      ) {
        throw new Error(`stale origin link ${correction.candidateId}`);
      }
      const { entryDigest: _entryDigest, ...originPayload } = originEntry;
      const payload: Omit<CandidateSourceManifestEntryV1, "entryDigest"> = {
        ...originPayload,
        supersedes: correction.supersedes,
        video: {
          provider: correction.video.provider,
          contentType: correction.video.contentType,
          canonicalUrl: correction.video.canonicalUrl,
          title: correction.video.title,
          uploaderName: correction.video.uploaderName,
          uploaderProvenance: correction.video.uploaderProvenance,
          channelUrl: correction.video.channelUrl,
          publishedAt: correction.video.publishedAt,
          accessedAt: correction.video.accessedAt,
          embedStatus: correction.video.embedStatus,
          embedCheckedAt: correction.video.embedCheckedAt,
          captionStatus: correction.video.captionStatus,
          captionCheckedAt: correction.video.captionCheckedAt,
          provenanceBasis: correction.video.browserResult,
          provenanceStatus: "verified",
          provenanceCheckedBy: reviewSet.audit.checkedBy,
          provenanceCheckedAt: correction.video.embedCheckedAt,
        },
        sourceReviewDecision: {
          digest: decisionDigest,
          reviewedBy: decision.reviewedBy,
          reviewedAt: decision.reviewedAt,
        },
        verification: {
          ...originEntry.verification,
          artifactDigest: reviewSet.ownerDecision.reviewedReviewSetDigest,
          resultReferences: [`/results/${index}`],
        },
      };
      return {
        entryDigest: computeCandidateManifestEntryDigest(payload),
        ...payload,
      };
    })
    .sort(compareEntries);
  const supersedes = reviewSet.acceptedCorrections
    .map((entry) => entry.supersedes)
    .sort(compareSupersedes);
  const manifest: CandidateSourceManifestV1 = {
    schemaVersion: 1,
    manifestId: BATCH2_MANIFEST_ID,
    batchType: "correction",
    period: BATCH2_PERIOD,
    sourcePolicyVersion: "nba-v2",
    cutoffDate: origin.cutoffDate,
    generatedAt: decision.reviewedAt,
    sourceReview: {
      status: "approved-for-authoring",
      manifestId: BATCH2_MANIFEST_ID,
      sourcePolicyJsonDigest: decision.sourcePolicyJsonDigest,
      sourcePolicyMarkdownDigest: decision.sourcePolicyMarkdownDigest,
      reviewedBy: decision.reviewedBy,
      reviewedAt: decision.reviewedAt,
      candidateSetDigest: decision.candidateSetDigest,
      classicProposalCandidateIds: [],
    },
    sourceDigests: {
      ...origin.sourceDigests,
      verificationArtifactSha256:
        reviewSet.ownerDecision.reviewedReviewSetDigest,
      sourceReviewDecisionSha256: decisionDigest,
    },
    counts: {
      byInjury: { acl: 0, "ankle-sprain": 2, "achilles-rupture": 2 },
      total: 4,
      recent: 4,
      classic: 0,
      byEmbedStatus: { verified: 4, externalLinkOnly: 0 },
    },
    supersedes,
    entries,
  };
  const issues = validateCandidateManifest(manifest);
  if (issues.length > 0) {
    throw new Error(
      `batch-2 correction manifest invalid: ${issues
        .map((entry) => `[${entry.code}] ${entry.path} ${entry.message}`)
        .join("; ")}`,
    );
  }
  for (const entry of manifest.entries) {
    const originEntry = originById.get(entry.candidateId);
    if (
      originEntry === undefined ||
      canonicalJson(entry.eventSource) !==
        canonicalJson(originEntry.eventSource)
    ) {
      throw new Error(`event source changed for ${entry.candidateId}`);
    }
  }
  return manifest;
}

function priorRegistryBytes(root: string): Buffer {
  const observedBytes = read(root, BATCH2_REGISTRY_PATH);
  const parsed = parseSourceManifestRegistryBytes(observedBytes);
  if (parsed.registry === null) {
    throw new Error("source-manifest registry is invalid");
  }
  const alreadyAppended =
    parsed.registry.entries.at(-1)?.manifestId === BATCH2_MANIFEST_ID;
  const priorBytes = alreadyAppended
    ? Buffer.from(
        canonicalJson({
          entries: parsed.registry.entries.slice(0, -1),
          schemaVersion: 1,
        }),
      )
    : observedBytes;
  if (sha256Hex(priorBytes) !== EXPECTED_PREVIOUS_REGISTRY_BYTES_DIGEST) {
    throw new Error("registry prefix was reordered, rewritten, or extended");
  }
  return priorBytes;
}

export function buildBatch2Registry(
  root: string = process.cwd(),
): SourceManifestRegistryV1 {
  const priorBytes = priorRegistryBytes(root);
  const parsedPrior = parseSourceManifestRegistryBytes(priorBytes);
  if (
    parsedPrior.registry === null ||
    parsedPrior.registry.entries.length !== 2
  ) {
    throw new Error("trusted registry prefix must contain exactly two entries");
  }
  const reviewSet = parseBatch2ReviewSet(root);
  const decisionBytes = buildDecisionBytes(reviewSet);
  const manifest = buildBatch2CorrectionManifest(root);
  const entry: SourceManifestRegistryEntry = {
    manifestId: BATCH2_MANIFEST_ID,
    manifestPath: BATCH2_CORRECTION_MANIFEST_PATH,
    manifestDigest: digestCandidateManifest(manifest),
    sourceReviewDecisionPath: BATCH2_DECISION_PATH,
    sourceReviewDecisionDigest: sha256Hex(decisionBytes),
    sourcePolicyVersion: manifest.sourcePolicyVersion,
    batchType: manifest.batchType,
    period: manifest.period,
    createdAt: manifest.generatedAt,
    previousRegistryBytesDigest: EXPECTED_PREVIOUS_REGISTRY_BYTES_DIGEST,
    supersedes: manifest.supersedes,
  };
  const next: SourceManifestRegistryV1 = {
    schemaVersion: 1,
    entries: [...parsedPrior.registry.entries, entry],
  };
  const appendIssues = validateSourceManifestRegistryAppend(
    priorBytes,
    next,
    EXPECTED_PREVIOUS_REGISTRY_BYTES_DIGEST,
  );
  if (appendIssues.length > 0) {
    throw new Error(
      `registry append invalid: ${appendIssues
        .map((item) => `[${item.code}] ${item.path} ${item.message}`)
        .join("; ")}`,
    );
  }
  return next;
}

export function writeBatch2Artifacts(root: string = process.cwd()): void {
  const reviewSet = parseBatch2ReviewSet(root);
  const decisionBytes = buildDecisionBytes(reviewSet);
  const manifestBytes = serializeCandidateManifest(
    buildBatch2CorrectionManifest(root),
  );
  const registryBytes = canonicalJson(buildBatch2Registry(root));
  writeFileSync(pathAt(root, BATCH2_DECISION_PATH), decisionBytes);
  writeFileSync(pathAt(root, BATCH2_CORRECTION_MANIFEST_PATH), manifestBytes);
  writeFileSync(pathAt(root, BATCH2_REGISTRY_PATH), registryBytes);
}

export function checkBatch2Artifacts(root: string = process.cwd()): void {
  const reviewSet = parseBatch2ReviewSet(root);
  const expectedDecision = buildDecisionBytes(reviewSet);
  const actualDecision = read(root, BATCH2_DECISION_PATH).toString("utf8");
  if (actualDecision !== expectedDecision) {
    throw new Error("published batch-2 source decision bytes drifted");
  }
  const decisionResult = canonicalSourceReviewDecisionSchema.safeParse(
    parseStrictJson(actualDecision),
  );
  if (!decisionResult.success) {
    throw new Error(
      `published source decision invalid: ${decisionResult.error.message}`,
    );
  }
  const expectedManifest = serializeCandidateManifest(
    buildBatch2CorrectionManifest(root),
  );
  const actualManifest = read(root, BATCH2_CORRECTION_MANIFEST_PATH).toString(
    "utf8",
  );
  if (actualManifest !== expectedManifest) {
    throw new Error("published batch-2 correction manifest bytes drifted");
  }
  const expectedRegistry = canonicalJson(buildBatch2Registry(root));
  const actualRegistryBytes = read(root, BATCH2_REGISTRY_PATH);
  if (actualRegistryBytes.toString("utf8") !== expectedRegistry) {
    throw new Error("published registry bytes drifted from exact append");
  }
  const parsedRegistry = parseSourceManifestRegistryBytes(actualRegistryBytes);
  if (parsedRegistry.registry === null) {
    throw new Error("published registry is invalid");
  }
  const artifactIssues = validateSourceManifestRegistryArtifacts(
    parsedRegistry.registry,
    (path) => read(root, path),
  );
  if (artifactIssues.length > 0) {
    throw new Error(
      `registered artifacts invalid: ${artifactIssues
        .map((item) => `[${item.code}] ${item.path} ${item.message}`)
        .join("; ")}`,
    );
  }
}

export function batch2Summary(root: string = process.cwd()): unknown {
  const reviewSet = parseBatch2ReviewSet(root);
  const decisionDigest = sha256Hex(buildDecisionBytes(reviewSet));
  const manifest = buildBatch2CorrectionManifest(root);
  const registry = buildBatch2Registry(root);
  return {
    reviewSetDigest: fileDigest(root, BATCH2_REVIEW_SET_PATH),
    reviewedSnapshotDigest: reviewSet.ownerDecision.reviewedReviewSetDigest,
    sourceReviewDecisionDigest: decisionDigest,
    manifestDigest: digestCandidateManifest(manifest),
    registryDigest: sha256Hex(canonicalJson(registry)),
    entries: manifest.entries.map((entry) => ({
      candidateId: entry.candidateId,
      entryDigest: entry.entryDigest,
      canonicalUrl: entry.video.canonicalUrl,
      captionStatus: entry.video.captionStatus,
    })),
  };
}

function runCli(): void {
  const command = process.argv[2] ?? "--check";
  if (command === "--write") {
    writeBatch2Artifacts();
    checkBatch2Artifacts();
  } else if (command === "--check") {
    checkBatch2Artifacts();
  } else if (command === "--manifest") {
    process.stdout.write(
      serializeCandidateManifest(buildBatch2CorrectionManifest()),
    );
    return;
  } else if (command === "--registry") {
    process.stdout.write(canonicalJson(buildBatch2Registry()));
    return;
  } else if (command === "--summary") {
    process.stdout.write(canonicalJson(batch2Summary()));
    return;
  } else {
    throw new Error(`unknown command ${command}`);
  }
  const summary = batch2Summary() as {
    manifestDigest: string;
    registryDigest: string;
  };
  console.log(
    `embed batch-2 correction OK manifest=${BATCH2_MANIFEST_ID} entries=4 manifestDigest=${summary.manifestDigest} registryDigest=${summary.registryDigest}`,
  );
}

if (
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runCli();
}
