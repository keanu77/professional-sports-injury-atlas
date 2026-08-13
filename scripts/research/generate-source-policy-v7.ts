/** Generates the append-only Decision 14 named-photographer event policy. */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import {
  DECISION_14_ALLOWLIST_FLOORS,
  DECISION_14_ALWAYS_INELIGIBLE_OCCASIONS,
  DECISION_14_CONDITIONAL_EVENT_OCCASIONS,
  DECISION_14_EVENT_GENERIC_CAPTION,
  DECISION_14_NON_CLEARANCE_STATEMENT,
  DECISION_14_OWNER_RECORD_HEADING,
  DECISION_14_OWNER_RECORD_PATH,
  DECISION_14_PROTECTED_ATHLETES,
  DECISION_14_RESIDUAL_RISK_TOKEN,
  DECISION_14_REVIEW_DATE,
  DECISION_14_SCOPE_ID,
  DECISION_14_TARGET_ATHLETES,
  DECISION_14_WASHING_SIGNAL_IDS,
} from "../../src/lib/contracts/decision-14-photo-contract";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const parentJsonPath = "research/source-policy/source-policy.v6.json";
const parentMarkdownPath = "research/source-policy/nba.v6.md";
const markdownPath = "research/source-policy/nba.v7.md";
const outputPath = "research/source-policy/source-policy.v7.json";
const evidencePath =
  "docs/reviews/2026-08-13-decision-14-p1-photographer-allowlist-evidence.md";
const expectedParentJsonSha256 =
  "1e27041de184b7b6397b2cfdde225706b40696f1d4456757193baa340f4cc93c";
const expectedParentMarkdownSha256 =
  "b9a469344ff5061546619ea0ecbb5b7320965af40cde254d4939cf2e8835b0c1";
const expectedEvidenceSha256 =
  "593919e471180fe3cb9845236f4758b1ccfd305b599fbe59b4f841060637f18e";
const evidenceFirstCommit = "52b0608a36960bcc09d7ef8ec7b60816267f7b9e";

const parentJsonBytes = readFileSync(resolve(root, parentJsonPath), "utf8");
const parentMarkdownBytes = readFileSync(
  resolve(root, parentMarkdownPath),
  "utf8",
);
const evidenceBytes = readFileSync(resolve(root, evidencePath), "utf8");

if (sha256Hex(parentJsonBytes) !== expectedParentJsonSha256) {
  throw new Error("Frozen nba-v6 JSON bytes changed");
}
if (sha256Hex(parentMarkdownBytes) !== expectedParentMarkdownSha256) {
  throw new Error("Frozen nba-v6 Markdown bytes changed");
}
if (sha256Hex(evidenceBytes) !== expectedEvidenceSha256) {
  throw new Error("Frozen Decision 14 Phase 1 evidence bytes changed");
}

const markdownBytes = readFileSync(resolve(root, markdownPath), "utf8");
const parent = parseStrictJson(parentJsonBytes) as Record<string, unknown>;
const parentAnnex = parent.playerStaticPhotoRules as Record<string, unknown>;
const parentAttribution = parentAnnex.attributionRequirements as Record<
  string,
  unknown
>;

const requiredAllowlistFields = [
  "accountControlType",
  "canonicalPublicName",
  "checkedAt",
  "checkedBy",
  "creditedMakerIdentity",
  "disputeSearch",
  "evidenceParagraph",
  "evidencePath",
  "evidenceSha256",
  "expectedLicenseToken",
  "firstDatedSportsWork",
  "latestDatedSportsWork",
  "licenseHistory",
  "photographerId",
  "reuseChain",
  "selfPublicationProof",
  "verifiedAccounts",
  "washingChecks",
] as const;

const requiredEventPhotoFields = [
  "allowlistEvidencePath",
  "allowlistEvidenceSha256",
  "allowlistPhotographerId",
  "athleteName",
  "candidateLicenseMatchesExpected",
  "candidateLicenseToken",
  "creditedMakerCanonicalName",
  "eventCompetitionEvidence",
  "eventDateEvidence",
  "eventOccasion",
  "eventOpponentEvidence",
  "expectedLicenseToken",
  "injuryEventRelationship",
  "matchedSelfPublishedAccountId",
  "nonClearanceStatement",
  "originalSelfUploadUrl",
  "originalUploaderAccountId",
  "ownerRecordHeading",
  "ownerRecordPath",
  "perFileChecksComplete",
  "residualRiskToken",
  "selfPublishedOriginalVerified",
] as const;

const namedPhotographerAllowlist: unknown[] = [];

const eventException = {
  accountControlTypes: [
    "verified-individual-owned-commons",
    "verified-individual-owned-flickr",
  ],
  allowlistEvidenceBinding: {
    committedBeforePolicy: true,
    evidenceFirstCommit,
    path: evidencePath,
    sha256: expectedEvidenceSha256,
  },
  allowlistRecordContract: {
    numericFloors: DECISION_14_ALLOWLIST_FLOORS,
    requiredFields: requiredAllowlistFields,
    unresolvedRequiredFieldEligible: false,
    uploaderNameAloneProvesMakerOrAuthority: false,
  },
  alwaysIneligibleOccasions: DECISION_14_ALWAYS_INELIGIBLE_OCCASIONS,
  conditionalEventOccasions: DECISION_14_CONDITIONAL_EVENT_OCCASIONS,
  decisionTable: [
    {
      branch: "inherited-v6-non-event",
      ifAll: ["v6-qualified-non-event", "event-photo-record-absent"],
      outcome: "eligible-photo",
    },
    {
      branch: "named-photographer-event",
      ifAll: [
        "finite-conditional-event-occasion",
        "fixed-16-target-athlete",
        "exact-named-allowlist-entry",
        "credited-maker-canonical-name-match",
        "exact-verified-self-published-account-match",
        "verified-photographer-owned-original",
        "original-uploader-account-match",
        "complete-independent-per-file-checks",
        "candidate-license-token-equals-history-token",
        "complete-event-date-opponent-competition-evidence",
        "different-injury-event-verified",
        "immutable-allowlist-evidence-path-and-digest-match",
        DECISION_14_RESIDUAL_RISK_TOKEN,
        "exact-decision-14-owner-reference",
        "fixed-non-clearance-statement",
      ],
      outcome: "eligible-photo",
    },
    {
      branch: "ambiguous-dual-branch",
      ifAll: ["v6-qualified-non-event", "event-photo-record-present"],
      outcome: "original-svg-fallback",
    },
    {
      branch: "fail-closed",
      otherwise: true,
      outcome: "original-svg-fallback",
    },
  ],
  emptyAllowlistEffect:
    "no event photo can satisfy the exact named allowlist join; inherited v6 non-event review remains available",
  eligibilityExpression:
    "(v6-qualified non-event photo) OR (factual event occasion AND exact photographer allowlist match AND verified photographer-owned self-published original AND complete per-file checks AND exact candidate/history license-token match AND different injury event verified AND credentialed-access-residual-risk marker AND exact Decision 14 owner reference)",
  eventCaption: DECISION_14_EVENT_GENERIC_CAPTION,
  namedPhotographerAllowlist,
  nonClearanceStatement: DECISION_14_NON_CLEARANCE_STATEMENT,
  ownerResidualRiskReference: {
    heading: DECISION_14_OWNER_RECORD_HEADING,
    path: DECISION_14_OWNER_RECORD_PATH,
    requiredRiskToken: DECISION_14_RESIDUAL_RISK_TOKEN,
  },
  perEventPhotoContract: {
    assetSpecificOccasionCaptionRequired: true,
    adapterLicenseLimitedToCropContribution: true,
    adapterLicenseSameVersionRequiredForCcBySaCrop: true,
    occasionAndPhotographerRiskRecordedSeparately: true,
    requiredFields: requiredEventPhotoFields,
    sameInjuryEventEligible: false,
    unresolvedInjuryEventRelationshipEligible: false,
  },
  photographerCount: namedPhotographerAllowlist.length,
  protectedAthletes: DECISION_14_PROTECTED_ATHLETES,
  reviewDate: DECISION_14_REVIEW_DATE,
  sourceClassification: "wikimedia-commons-player-allowlisted-event-photo",
  status: "empty-fail-closed",
  successorRequiredFor: [
    "add-photographer",
    "remove-photographer",
    "new-event-occasion",
    "weaker-numeric-floor",
    "allowlist-evidence-change",
    "same-version-policy-change",
  ],
  targetAthletes: DECISION_14_TARGET_ATHLETES,
  washingSignalContract: {
    allowedRequiredStatus: "pass",
    commonsThumbnailCanEstablishOriginalSeriesFacts: false,
    requiredEvidenceFields: [
      "basis",
      "checkedAt",
      "checkedBy",
      "originalWorkIdsOrUrls",
      "sampleRule",
      "status",
    ],
    requiredSignals: DECISION_14_WASHING_SIGNAL_IDS,
    thirdPartyDerivativeCanEstablishOriginalSeriesFacts: false,
  },
};

const policy = {
  ...parent,
  humanPolicyDocument: {
    path: markdownPath,
    sha256: sha256Hex(markdownBytes),
  },
  playerStaticPhotoPolicyInheritance: {
    jsonPath: parentJsonPath,
    jsonSha256: sha256Hex(parentJsonBytes),
    markdownPath: parentMarkdownPath,
    markdownSha256: sha256Hex(parentMarkdownBytes),
    sourcePolicyVersion: "nba-v6",
  },
  playerStaticPhotoRules: {
    ...parentAnnex,
    attributionRequirements: {
      ...parentAttribution,
      eventText: DECISION_14_EVENT_GENERIC_CAPTION,
    },
    conditionallyAllowedSourceClassifications: [
      eventException.sourceClassification,
    ],
    decision14NamedPhotographerEventException: eventException,
    scopeId: DECISION_14_SCOPE_ID,
  },
  sourcePolicyVersion: "nba-v7",
};

const outputBytes = canonicalJson(policy);
if (process.argv.includes("--check")) {
  if (readFileSync(resolve(root, outputPath), "utf8") !== outputBytes) {
    throw new Error("Generated nba-v7 source-policy bytes are stale");
  }
  console.log(`nba-v7 source policy OK — ${sha256Hex(outputBytes)}`);
} else if (process.argv.includes("--stdout")) {
  process.stdout.write(outputBytes);
} else {
  writeFileSync(resolve(root, outputPath), outputBytes, "utf8");
}
