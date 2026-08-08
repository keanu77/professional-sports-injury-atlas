import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  canonicalJson,
  compareCodePoints,
  isValidUtcTimestamp,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";

const REVIEW_SET_PATH =
  "research/reviews/embed-enrichment/NBA-EMBED-2026-08-08-001-review-set.v1.json";
const ORIGIN_MANIFEST_PATH =
  "research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json";
const POLICY_JSON_PATH = "research/source-policy/source-policy.v2.json";
const POLICY_MARKDOWN_PATH = "research/source-policy/nba.v2.md";

const EXPECTED_ACCEPTED_URLS = [
  "https://www.youtube.com/watch?v=FQAPZASQyX0",
  "https://www.youtube.com/watch?v=RDDGpqOvSdg",
  "https://www.youtube.com/watch?v=YcSOLHMsJYw",
] as const;

const EXPECTED_REJECTED_URLS = [
  "https://www.youtube.com/watch?v=A5BGIpDmeGk",
  "https://www.youtube.com/watch?v=JOpERGK_bb8",
  "https://www.youtube.com/watch?v=T_6Ohfxg_v0",
  "https://www.youtube.com/watch?v=VJWLhVLWzsY",
  "https://www.youtube.com/watch?v=_hkttbPdMs8",
  "https://www.youtube.com/watch?v=ceJdvaxH9k4",
  "https://www.youtube.com/watch?v=dmYCjHWlJms",
  "https://www.youtube.com/watch?v=kmG_HO0IhFY",
  "https://www.youtube.com/watch?v=qZKTS532beA",
  "https://www.youtube.com/watch?v=rL0oKG7tgK0",
  "https://www.youtube.com/watch?v=sCsQz1-oV8Y",
  "https://www.youtube.com/watch?v=sooh3Zd_36s",
  "https://www.youtube.com/watch?v=tJto_hyevFU",
] as const;

const TOP_LEVEL_KEYS = [
  "acceptedCorrections",
  "audit",
  "createdAt",
  "originManifest",
  "ownerDecision",
  "rejectedLeads",
  "reviewSetId",
  "schemaVersion",
  "sourcePolicyDigests",
  "sourcePolicyVersion",
  "status",
] as const;

const OWNER_DECISION_KEYS = [
  "reviewedAt",
  "reviewedBy",
  "reviewedReviewSetDigest",
  "status",
] as const;

const EXPECTED_OWNER = "吳易澄醫師";
const EXPECTED_OWNER_REVIEWED_AT = "2026-08-08T11:52:39Z";
const EXPECTED_REVIEWED_REVIEW_SET_DIGEST =
  "282f8f545bc74d38142d3a177287b6c7a82e7e8759451ea967f7b5f2435cd8aa";
const EXPECTED_REFROZEN_REVIEW_SET_DIGEST =
  "9971d3161b72f19c7d19bb504cd65d226e2d3a54c65ecd9a2d81e10fff388a3e";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, path: string): UnknownRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
  return value as UnknownRecord;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value;
}

function exactKeys(
  value: UnknownRecord,
  expected: readonly string[],
  path: string,
) {
  const actual = Object.keys(value).sort(compareCodePoints);
  const sortedExpected = [...expected].sort(compareCodePoints);
  if (canonicalJson(actual) !== canonicalJson(sortedExpected)) {
    throw new Error(`${path} has unexpected keys`);
  }
}

function fileDigest(path: string): string {
  return sha256Hex(readFileSync(resolve(path)));
}

/**
 * Reconstructs the exact pretty-printed bytes presented for owner review.
 * The approved artifact can therefore carry a durable decision without
 * changing the digest already bound by the append-only correction batch.
 */
function reviewedSnapshotBytes(value: UnknownRecord): string {
  return `${JSON.stringify(
    { ...value, status: "awaiting-owner-review", ownerDecision: null },
    null,
    2,
  )}\n`;
}

const bytes = readFileSync(resolve(REVIEW_SET_PATH));
const parsed = record(parseStrictJson(bytes.toString("utf8")), REVIEW_SET_PATH);
exactKeys(parsed, TOP_LEVEL_KEYS, REVIEW_SET_PATH);

if (parsed.schemaVersion !== 1) throw new Error("schemaVersion must be 1");
if (parsed.reviewSetId !== "NBA-EMBED-2026-08-08-001") {
  throw new Error("unexpected reviewSetId");
}
if (parsed.status !== "owner-approved") {
  throw new Error("review set must be owner-approved");
}
if (
  typeof parsed.createdAt !== "string" ||
  !isValidUtcTimestamp(parsed.createdAt)
) {
  throw new Error("createdAt must be a valid UTC timestamp");
}
if (parsed.sourcePolicyVersion !== "nba-v2") {
  throw new Error("sourcePolicyVersion must be nba-v2");
}
const policyDigests = record(parsed.sourcePolicyDigests, "sourcePolicyDigests");
if (policyDigests.json !== fileDigest(POLICY_JSON_PATH)) {
  throw new Error("source policy JSON digest drift");
}
if (policyDigests.markdown !== fileDigest(POLICY_MARKDOWN_PATH)) {
  throw new Error("source policy Markdown digest drift");
}

const origin = record(parsed.originManifest, "originManifest");
if (origin.manifestId !== "NBA-SOURCE-2026-08-06-001") {
  throw new Error("unexpected origin manifest ID");
}
if (origin.manifestPath !== ORIGIN_MANIFEST_PATH) {
  throw new Error("unexpected origin manifest path");
}
if (origin.manifestDigest !== fileDigest(ORIGIN_MANIFEST_PATH)) {
  throw new Error("origin manifest digest drift");
}

const audit = record(parsed.audit, "audit");
if (
  audit.leadCount !== 16 ||
  audit.acceptedVideoCount !== 3 ||
  audit.acceptedCandidateCount !== 3 ||
  audit.mediaDownloadedOrCopied !== false ||
  audit.browserRegion !== "TW"
) {
  throw new Error("audit counts or browser/no-download facts drifted");
}

if (!Array.isArray(parsed.acceptedCorrections)) {
  throw new Error("acceptedCorrections must be an array");
}
if (!Array.isArray(parsed.rejectedLeads)) {
  throw new Error("rejectedLeads must be an array");
}
if (
  parsed.acceptedCorrections.length !== 3 ||
  parsed.rejectedLeads.length !== 13
) {
  throw new Error(
    "review set must contain exactly 3 accepted and 13 rejected videos",
  );
}

const acceptedUrls = parsed.acceptedCorrections
  .map((value, index) => {
    const correction = record(value, `acceptedCorrections[${index}]`);
    const supersedes = record(
      correction.supersedes,
      `acceptedCorrections[${index}].supersedes`,
    );
    const video = record(
      correction.video,
      `acceptedCorrections[${index}].video`,
    );
    const candidateId = string(
      correction.candidateId,
      `acceptedCorrections[${index}].candidateId`,
    );
    if (
      supersedes.manifestId !== "NBA-SOURCE-2026-08-06-001" ||
      supersedes.candidateId !== candidateId ||
      typeof supersedes.entryDigest !== "string" ||
      !/^[0-9a-f]{64}$/u.test(supersedes.entryDigest)
    ) {
      throw new Error(
        `acceptedCorrections[${index}] has an invalid supersedes reference`,
      );
    }
    if (
      video.provider !== "youtube" ||
      video.contentType !== "in-game-injury-event" ||
      video.embedStatus !== "verified" ||
      video.captionStatus !== "available" ||
      video.uploaderName !== "ESPN" ||
      video.uploaderProvenance !== "broadcaster-rightsholder"
    ) {
      throw new Error(
        `acceptedCorrections[${index}] has invalid video governance facts`,
      );
    }
    return string(
      video.canonicalUrl,
      `acceptedCorrections[${index}].video.canonicalUrl`,
    );
  })
  .sort(compareCodePoints);

const rejectedUrls = parsed.rejectedLeads
  .map((value, index) => {
    const rejected = record(value, `rejectedLeads[${index}]`);
    string(rejected.reasonCode, `rejectedLeads[${index}].reasonCode`);
    string(rejected.reason, `rejectedLeads[${index}].reason`);
    return string(rejected.url, `rejectedLeads[${index}].url`);
  })
  .sort(compareCodePoints);

if (
  canonicalJson(acceptedUrls) !==
  canonicalJson([...EXPECTED_ACCEPTED_URLS].sort(compareCodePoints))
) {
  throw new Error("accepted URL set drift");
}
if (
  canonicalJson(rejectedUrls) !==
  canonicalJson([...EXPECTED_REJECTED_URLS].sort(compareCodePoints))
) {
  throw new Error("rejected URL set drift");
}
if (new Set([...acceptedUrls, ...rejectedUrls]).size !== 16) {
  throw new Error(
    "all 16 lead URLs must be unique across the final disposition",
  );
}

const ownerDecision = record(parsed.ownerDecision, "ownerDecision");
exactKeys(ownerDecision, OWNER_DECISION_KEYS, "ownerDecision");
if (
  ownerDecision.status !== "approved" ||
  ownerDecision.reviewedBy !== EXPECTED_OWNER ||
  ownerDecision.reviewedAt !== EXPECTED_OWNER_REVIEWED_AT ||
  !isValidUtcTimestamp(ownerDecision.reviewedAt as string)
) {
  throw new Error("ownerDecision identity, status, or timestamp drifted");
}
if (
  typeof ownerDecision.reviewedReviewSetDigest !== "string" ||
  !/^[0-9a-f]{64}$/u.test(ownerDecision.reviewedReviewSetDigest) ||
  ownerDecision.reviewedReviewSetDigest !== EXPECTED_REVIEWED_REVIEW_SET_DIGEST
) {
  throw new Error("ownerDecision reviewedReviewSetDigest is invalid");
}
const reconstructedReviewedDigest = sha256Hex(reviewedSnapshotBytes(parsed));
if (ownerDecision.reviewedReviewSetDigest !== reconstructedReviewedDigest) {
  throw new Error(
    "ownerDecision does not bind the exact awaiting-owner-review bytes",
  );
}
const refrozenDigest = sha256Hex(bytes);
if (refrozenDigest !== EXPECTED_REFROZEN_REVIEW_SET_DIGEST) {
  throw new Error("owner-approved review-set bytes drifted after re-freeze");
}

console.log(
  `embed-enrichment review set OK accepted=3 rejected=13 reviewedDigest=${reconstructedReviewedDigest} refrozenDigest=${refrozenDigest}`,
);
