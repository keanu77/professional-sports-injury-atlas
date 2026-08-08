import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  canonicalJson,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import {
  parseSourceManifestRegistryBytes,
  validateSourceManifestRegistryAppend,
  validateSourceManifestRegistryArtifacts,
  type SourceManifestRegistryEntry,
  type SourceManifestRegistryV1,
} from "../../src/lib/contracts/source-manifest-registry";
import { canonicalSourceReviewDecisionSchema } from "../../src/lib/contracts/source-manifest-registry";
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

const REVIEW_SET_PATH =
  "research/reviews/embed-enrichment/NBA-EMBED-2026-08-08-001-review-set.v1.json";
const ORIGIN_MANIFEST_PATH =
  "research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json";
const CORRECTION_MANIFEST_PATH =
  "research/source-manifests/NBA-SOURCE-2026-08-08-001.v1.json";
const DECISION_PATH =
  "research/reviews/source-batches/NBA-SOURCE-2026-08-08-001-source-review-decision.v1.json";
const REGISTRY_PATH = "research/source-manifest-registry.v1.json";

const MANIFEST_ID = "NBA-SOURCE-2026-08-08-001";
const PERIOD = "2026-08-08";

interface ReviewCorrection {
  candidateId: string;
  supersedes: SourceManifestSupersedesReference;
  video: {
    provider: "youtube";
    contentType: "in-game-injury-event";
    canonicalUrl: string;
    title: string;
    uploaderName: string;
    uploaderProvenance: "broadcaster-rightsholder";
    channelUrl: string;
    publishedAt: string;
    accessedAt: string;
    embedStatus: "verified";
    embedCheckedAt: string;
    captionStatus: "available";
    captionCheckedAt: string;
    browserResult: string;
  };
}

interface EmbedOwnerDecision {
  status: "approved";
  reviewedBy: string;
  reviewedAt: string;
  reviewedReviewSetDigest: string;
}

interface ReviewSet {
  reviewSetId: string;
  status: "owner-approved";
  audit: { checkedBy: string; checkedAt: string };
  acceptedCorrections: ReviewCorrection[];
  rejectedLeads: Array<{ url: string }>;
  ownerDecision: EmbedOwnerDecision;
}

function read(path: string): Buffer {
  return readFileSync(resolve(path));
}

function mustManifest(path: string): CandidateSourceManifestV1 {
  const parsed = parseCandidateManifestBytes(read(path));
  if (parsed.manifest === null) {
    throw new Error(
      `${path} invalid: ${parsed.issues.map((issue) => `[${issue.code}] ${issue.path} ${issue.message}`).join("; ")}`,
    );
  }
  return parsed.manifest;
}

function parseReviewSet(): ReviewSet {
  const value = parseStrictJson(
    read(REVIEW_SET_PATH).toString("utf8"),
  ) as ReviewSet;
  if (
    value.reviewSetId !== "NBA-EMBED-2026-08-08-001" ||
    value.status !== "owner-approved" ||
    value.acceptedCorrections.length !== 3 ||
    value.rejectedLeads.length !== 13 ||
    value.ownerDecision.status !== "approved" ||
    value.ownerDecision.reviewedBy !== "吳易澄醫師" ||
    value.ownerDecision.reviewedAt !== "2026-08-08T11:52:39Z"
  ) {
    throw new Error("review-set identity/status/count drift");
  }
  const reviewedSnapshotBytes = `${JSON.stringify(
    { ...value, status: "awaiting-owner-review", ownerDecision: null },
    null,
    2,
  )}\n`;
  if (
    value.ownerDecision.reviewedReviewSetDigest !==
    sha256Hex(reviewedSnapshotBytes)
  ) {
    throw new Error("owner decision does not bind the reviewed snapshot");
  }
  return value;
}

function parseDecision() {
  const parsed = parseStrictJson(read(DECISION_PATH).toString("utf8"));
  const decision = canonicalSourceReviewDecisionSchema.safeParse(parsed);
  if (!decision.success) {
    throw new Error(`invalid correction decision: ${decision.error.message}`);
  }
  return decision.data;
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

export function buildEmbedEnrichmentCorrectionManifest(): CandidateSourceManifestV1 {
  const reviewSet = parseReviewSet();
  const reviewDigest = reviewSet.ownerDecision.reviewedReviewSetDigest;
  const decisionBytes = read(DECISION_PATH);
  const decisionDigest = sha256Hex(decisionBytes);
  const decision = parseDecision();
  const origin = mustManifest(ORIGIN_MANIFEST_PATH);

  if (
    decision.manifestId !== MANIFEST_ID ||
    decision.candidateSetDigest !== reviewDigest ||
    decision.reviewedBy !== "吳易澄醫師" ||
    decision.classicProposalCandidateIds.length !== 0
  ) {
    throw new Error("decision does not bind the exact enrichment review set");
  }

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
        correction.supersedes.entryDigest !== originEntry.entryDigest
      ) {
        throw new Error(`stale supersedes reference ${correction.candidateId}`);
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
          provenanceCheckedAt: reviewSet.audit.checkedAt,
        },
        sourceReviewDecision: {
          digest: decisionDigest,
          reviewedBy: decision.reviewedBy,
          reviewedAt: decision.reviewedAt,
        },
        verification: {
          ...originEntry.verification,
          artifactDigest: reviewDigest,
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
    .map((correction) => correction.supersedes)
    .sort(compareSupersedes);
  const manifest: CandidateSourceManifestV1 = {
    schemaVersion: 1,
    manifestId: MANIFEST_ID,
    batchType: "correction",
    period: PERIOD,
    sourcePolicyVersion: "nba-v2",
    cutoffDate: origin.cutoffDate,
    generatedAt: decision.reviewedAt,
    sourceReview: {
      status: "approved-for-authoring",
      manifestId: MANIFEST_ID,
      sourcePolicyJsonDigest: decision.sourcePolicyJsonDigest,
      sourcePolicyMarkdownDigest: decision.sourcePolicyMarkdownDigest,
      reviewedBy: decision.reviewedBy,
      reviewedAt: decision.reviewedAt,
      candidateSetDigest: decision.candidateSetDigest,
      classicProposalCandidateIds: [],
    },
    sourceDigests: {
      ...origin.sourceDigests,
      verificationArtifactSha256: reviewDigest,
      sourceReviewDecisionSha256: decisionDigest,
    },
    counts: {
      byInjury: { acl: 0, "ankle-sprain": 2, "achilles-rupture": 1 },
      total: 3,
      recent: 3,
      classic: 0,
      byEmbedStatus: { verified: 3, externalLinkOnly: 0 },
    },
    supersedes,
    entries,
  };
  const issues = validateCandidateManifest(manifest);
  if (issues.length > 0) {
    throw new Error(
      `correction manifest invalid: ${issues.map((issue) => `[${issue.code}] ${issue.path} ${issue.message}`).join("; ")}`,
    );
  }
  return manifest;
}

export function buildEmbedEnrichmentRegistry(): SourceManifestRegistryV1 {
  const observedBytes = read(REGISTRY_PATH);
  const observed = parseSourceManifestRegistryBytes(observedBytes);
  if (observed.registry === null) {
    throw new Error("current source-manifest registry is invalid");
  }
  const alreadyAppended =
    observed.registry.entries.at(-1)?.manifestId === MANIFEST_ID;
  const priorRegistry: SourceManifestRegistryV1 = alreadyAppended
    ? {
        schemaVersion: 1,
        entries: observed.registry.entries.slice(0, -1),
      }
    : observed.registry;
  const priorBytes = Buffer.from(canonicalJson(priorRegistry));
  const manifest = buildEmbedEnrichmentCorrectionManifest();
  const decisionDigest = sha256Hex(read(DECISION_PATH));
  const entry: SourceManifestRegistryEntry = {
    manifestId: MANIFEST_ID,
    manifestPath: CORRECTION_MANIFEST_PATH,
    manifestDigest: digestCandidateManifest(manifest),
    sourceReviewDecisionPath: DECISION_PATH,
    sourceReviewDecisionDigest: decisionDigest,
    sourcePolicyVersion: manifest.sourcePolicyVersion,
    batchType: manifest.batchType,
    period: manifest.period,
    createdAt: manifest.generatedAt,
    previousRegistryBytesDigest: sha256Hex(priorBytes),
    supersedes: manifest.supersedes,
  };
  const next: SourceManifestRegistryV1 = {
    schemaVersion: 1,
    entries: [...priorRegistry.entries, entry],
  };
  const appendIssues = validateSourceManifestRegistryAppend(
    priorBytes,
    next,
    sha256Hex(priorBytes),
  );
  if (appendIssues.length > 0) {
    throw new Error(
      `registry append invalid: ${appendIssues.map((issue) => `[${issue.code}] ${issue.path} ${issue.message}`).join("; ")}`,
    );
  }
  return next;
}

function artifactLoader(path: string): Uint8Array {
  return read(path);
}

function checkPublishedArtifacts(): void {
  const expectedManifest = serializeCandidateManifest(
    buildEmbedEnrichmentCorrectionManifest(),
  );
  const actualManifest = read(CORRECTION_MANIFEST_PATH).toString("utf8");
  if (actualManifest !== expectedManifest) {
    throw new Error(
      "published correction manifest bytes drifted from expected",
    );
  }
  const expectedRegistry = canonicalJson(buildEmbedEnrichmentRegistry());
  const actualRegistryBytes = read(REGISTRY_PATH);
  const actualRegistry = actualRegistryBytes.toString("utf8");
  if (actualRegistry !== expectedRegistry) {
    throw new Error("published registry bytes drifted from expected");
  }
  const parsed = parseSourceManifestRegistryBytes(actualRegistryBytes);
  if (parsed.registry === null)
    throw new Error("published registry is invalid");
  const artifactIssues = validateSourceManifestRegistryArtifacts(
    parsed.registry,
    artifactLoader,
  );
  if (artifactIssues.length > 0) {
    throw new Error(
      `registry artifacts invalid: ${artifactIssues.map((issue) => `[${issue.code}] ${issue.path} ${issue.message}`).join("; ")}`,
    );
  }
  console.log(
    `embed-enrichment correction OK manifest=${MANIFEST_ID} entries=3 digest=${sha256Hex(actualManifest)}`,
  );
}

const command = process.argv[2] ?? "--check";
if (command === "--manifest") {
  process.stdout.write(
    serializeCandidateManifest(buildEmbedEnrichmentCorrectionManifest()),
  );
} else if (command === "--registry") {
  process.stdout.write(canonicalJson(buildEmbedEnrichmentRegistry()));
} else if (command === "--summary") {
  const manifest = buildEmbedEnrichmentCorrectionManifest();
  console.log(
    canonicalJson({
      decisionDigest: sha256Hex(read(DECISION_PATH)),
      manifestDigest: digestCandidateManifest(manifest),
      entries: manifest.entries.map((entry) => ({
        candidateId: entry.candidateId,
        entryDigest: entry.entryDigest,
      })),
    }),
  );
} else if (command === "--check") {
  checkPublishedArtifacts();
} else {
  throw new Error(`unknown command ${command}`);
}
