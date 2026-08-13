/** Re-derives the immutable Decision 15 photo-first source policy. */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const parentJsonPath = "research/source-policy/source-policy.v7.json";
const parentMarkdownPath = "research/source-policy/nba.v7.md";
const markdownPath = "research/source-policy/nba.v8.md";
const outputPath = "research/source-policy/source-policy.v8.json";
const candidateLedgerPath =
  "docs/reviews/2026-08-13-decision-14-p2-photo-candidate-evidence.md";

const expectedParentJsonSha256 =
  "d1062c1ffa045397d13489319534acbfe24653615df5ce83aac40e40539a8b15";
const expectedParentMarkdownSha256 =
  "61ed88f92d80b77cd2c1410d03305215eedbb391356c073fb19fac944dea2fd1";
const expectedMarkdownSha256 =
  "20a9209bd523604efe3251f6ef159e6432fa9280951ea16d630ee02cc347557d";
const expectedCandidateLedgerSha256 =
  "b5a1f207323125170c96a03f63f8643694d70fad4f01e42dd33d1ec1f73fd00b";
const expectedOutputSha256 =
  "30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e";

function readFrozen(
  path: string,
  expectedSha256: string,
  label: string,
): string {
  const bytes = readFileSync(resolve(root, path), "utf8");
  if (sha256Hex(bytes) !== expectedSha256) {
    throw new Error(`Frozen ${label} bytes changed`);
  }
  return bytes;
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

const parentJsonBytes = readFrozen(
  parentJsonPath,
  expectedParentJsonSha256,
  "nba-v7 JSON",
);
const parentMarkdownBytes = readFrozen(
  parentMarkdownPath,
  expectedParentMarkdownSha256,
  "nba-v7 Markdown",
);
const markdownBytes = readFrozen(
  markdownPath,
  expectedMarkdownSha256,
  "nba-v8 Markdown",
);
readFrozen(
  candidateLedgerPath,
  expectedCandidateLedgerSha256,
  "Decision 14 Phase 2 candidate ledger",
);

const parent = asRecord(parseStrictJson(parentJsonBytes), "nba-v7 policy");
if (canonicalJson(parent) !== parentJsonBytes) {
  throw new Error("Frozen nba-v7 JSON is not canonical JSON");
}
const parentAnnex = asRecord(
  parent.playerStaticPhotoRules,
  "nba-v7 playerStaticPhotoRules",
);
const parentAttribution = asRecord(
  parentAnnex.attributionRequirements,
  "nba-v7 attributionRequirements",
);
const parentDownload = asRecord(
  parentAnnex.downloadRules,
  "nba-v7 downloadRules",
);
const parentNonClearance = asRecord(
  parentAnnex.nonClearanceInterpretation,
  "nba-v7 nonClearanceInterpretation",
);

const {
  acceptedNonEventOccasions: _acceptedNonEventOccasions,
  attributionRequirements: _attributionRequirements,
  conditionallyAllowedSourceClassifications:
    _conditionallyAllowedSourceClassifications,
  decision14NamedPhotographerEventException:
    _decision14NamedPhotographerEventException,
  downloadRules: _downloadRules,
  explicitNegativeFiles: _explicitNegativeFiles,
  ineligibleOccasions: _ineligibleOccasions,
  nonClearanceInterpretation: _nonClearanceInterpretation,
  photographerProvenanceRules: _photographerProvenanceRules,
  prohibitedClassifications: _prohibitedClassifications,
  requiredProvenanceFields: _requiredProvenanceFields,
  scopeId: _scopeId,
  ...retainedAnnex
} = parentAnnex;

const {
  commonsRevisionPermalinkVisible: _commonsRevisionPermalinkVisible,
  eventText: _eventText,
  exactLicenseNameAndTermsLinkVisible: _exactLicenseNameAndTermsLinkVisible,
  licenseBuckets: _licenseBuckets,
  nonEventText: _nonEventText,
  photographerVisible: _photographerVisible,
  ...retainedAttribution
} = parentAttribution;

const {
  descriptionHost: _descriptionHost,
  originalDownloadHost: _originalDownloadHost,
  originalPathMustExclude: _originalPathMustExclude,
  ...retainedDownload
} = parentDownload;

const decision15PhotoFirstPolicy = {
  createsExecutionAuthorization: false,
  decisionDate: "2026-08-13",
  differentInjuryEventRule: {
    eligibleStatus: "different-from-governed-injury-event-verified",
    sameInjuryEventEligible: false,
    unresolvedRelationshipEligible: false,
  },
  eligibilityExpression:
    "exact athlete/case mapping AND explicit supported CC or PD/US-government marker on the exact Commons/Flickr work page AND exact applicable rights facts and obligations AND fixed source observation AND original binary facts AND different-from-governed-injury-event verified",
  executionBoundary: {
    authorizationArtifactSuppliedInThisCycle: false,
    closedScopeIds: [
      "deployment",
      "external-account-mutation",
      "hosting-service-mutation",
      "indexing",
      "medical-content-authoring",
      "medical-review-decision",
      "public-release",
      "remote-repository-mutation",
    ],
    laterStrictPlanExecutionDecisionRequired: true,
    phaseExecutionAuthorized: false,
  },
  frozenDecision14CandidateLedger: {
    path: candidateLedgerPath,
    reAdjudicateBeforeSupplementalSearch: true,
    sha256: expectedCandidateLedgerSha256,
  },
  owner: "吳易澄醫師",
  ownerResidualRiskAcceptance: {
    acceptanceIsRightsClearance: false,
    acceptedAfterExplicitNotice: true,
    acceptedBy: "吳易澄醫師",
    risks: [
      {
        id: "credentialed-photographer-license-invalid-ab-initio-flickr-washing",
        text: "持證攝影記者授權自始無效的風險（Flickr-washing）：持證記者與聯盟或媒體有契約，若無權授權，其標示的 CC 授權自始無效，下游使用者不因善意而免責",
      },
      {
        id: "closed-practice-venue-rule-risk",
        text: "封閉練習場地規範風險：封閉練習照片可能違反球隊或場地的拍攝規範",
      },
      {
        id: "untraceable-licensor-identity-risk",
        text: "授權人身分無法追溯的風險：帳號持有者未必是拍攝者，連授權人是誰都無法主張",
      },
    ],
  },
  photoFirstGoal: {
    athleteCoverSlotCount: 21,
    preference: "player-photo",
    svgFallbackAllowedOnlyWhen:
      "no candidate with an explicit supported CC or PD marker clears every retained gate after frozen-evidence re-adjudication and any authorized supplemental search",
  },
  removedDecision14Gates: [
    "occasion-eligibility-restriction",
    "named-photographer-allowlist",
    "photographer-identity-proof",
    "account-control-proof",
    "photographer-owned-self-publication",
    "licensing-authority-verification",
    "washing-signal-detection",
    "dispute-search",
    "ambiguous-credentialed-court-automatic-rejection",
  ],
  retainedGateIds: [
    "exact-athlete-and-case-mapping",
    "explicit-supported-cc-or-public-domain-marker",
    "exact-license-version-link-and-obligations-for-cc",
    "exact-public-domain-status-statement-and-source",
    "fixed-source-observation",
    "original-binary-facts",
    "different-from-governed-injury-event",
    "personality-rights-non-clearance",
    "cc-by-sa-site-composition-firewall",
    "closed-execution-scopes",
  ],
  reviewDate: "2026-08-13",
  sourcePlatforms: ["wikimedia-commons", "flickr"],
  status: "active-eligibility-contract-execution-not-authorized",
};

const sourceEvidenceRules = {
  flickr: {
    canonicalFrozenEvidenceRequired: true,
    evidenceFields: [
      "photo-id",
      "page-url",
      "observed-at",
      "observed-by",
      "displayed-rights-marker",
      "rights-link-or-statement-source",
      "displayed-credit-title-and-notices",
      "original-download-identity",
      "evidence-path",
      "evidence-sha256",
    ],
    frozenObservationMayBeCalledSourceNativeRevision: false,
    sourceNativeImmutableRevisionAvailable: false,
  },
  immutableEvidenceRequiredBeforeAdoption: true,
  originalBinaryFactsRequired: [
    "original-filename-or-platform-asset-id",
    "original-mime-type",
    "original-dimensions",
    "original-download-url-or-retrieval-identity",
    "download-date",
    "local-path",
    "local-byte-length",
    "local-dimensions",
    "local-sha256",
  ],
  wikimediaCommons: {
    fixedRevisionRequired: true,
    requiredFields: [
      "description-url",
      "revision-id",
      "revision-permalink",
      "revision-timestamp",
      "original-file-url",
    ],
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
    sourcePolicyVersion: "nba-v7",
  },
  playerStaticPhotoRules: {
    ...retainedAnnex,
    allowedSourceClassifications: [
      "original-site-owned-svg-fallback",
      "wikimedia-commons-player-photo-explicit-cc",
      "wikimedia-commons-player-photo-explicit-public-domain",
      "flickr-player-photo-explicit-cc",
      "flickr-player-photo-explicit-public-domain",
    ],
    attributionRequirements: {
      ...retainedAttribution,
      applicableRightsBuckets: ["cc-by", "cc-by-sa", "cc0", "public-domain"],
      creditedNameAsDisplayedVisible: true,
      exactLicenseNameAndTermsLinkVisibleForCc: true,
      fixedSourceEvidenceReferenceVisible: true,
      photoText: "球員資料照片；非本案例受傷當下影像",
      publicDomainStatusAndSourceVisible: true,
    },
    decision15PhotoFirstPolicy,
    displayedSourceFactsRules: {
      accountControlProofRequired: false,
      displayedMakerUploaderAndAccountStringsRecordedExactly: true,
      displayedStringsProveIdentityOwnershipOrAuthority: false,
      licensingAuthorityVerificationRequired: false,
      photographerIdentityProofRequired: false,
      photographerOwnedSelfPublishedOriginalRequired: false,
      upstreamOriginalRequiredToProveAuthority: false,
    },
    downloadRules: {
      ...retainedDownload,
      originalBinaryRequired: true,
      sourcePageHosts: [
        "commons.wikimedia.org",
        "www.flickr.com",
        "flickr.com",
      ],
      thumbnailOrScreenshotMayServeAsOriginal: false,
    },
    explicitNegativeFiles: [],
    injuryEventRelationshipRules: {
      eligibleStatus: "different-from-governed-injury-event-verified",
      evidenceRequired: true,
      sameOrUnresolvedOutcome: "original-svg-fallback",
    },
    nonClearanceInterpretation: {
      ...parentNonClearance,
      ccCoversPersonalityOrPortraitRights: false,
      displayedMarkerProvesLicensingAuthority: false,
      pdCoversPersonalityOrPortraitRights: false,
      photoAdoptionCreatesPersonalityOrPortraitRights: false,
    },
    occasionRules: {
      eligibilityGate: false,
      factualOccasionMayBeRecorded: true,
      mayNotRejectFor: [
        "all-star",
        "ambiguous-credentialed-court-context",
        "closed-practice",
        "international-competition",
        "other",
        "postseason",
        "pregame",
        "preseason",
        "regular-season-action",
        "unknown",
        "unresolved",
        "warm-up",
      ],
    },
    prohibitedClassifications: [
      "all-rights-reserved",
      "cc-nc",
      "cc-nd",
      "fair-use",
      "no-explicit-rights-marker",
      "rights-marker-does-not-identify-exact-work",
      "screenshot-only",
      "thumbnail-only",
      "unknown-license",
      "wrong-athlete",
    ],
    publicDomainRules: {
      acceptedMarkerKinds: [
        "creative-commons-public-domain-mark-1.0",
        "platform-public-domain-statement",
        "united-states-government-work-statement",
      ],
      acceptedUnitedStatesGovernmentTokenPattern: "^PD-USGov(?:-.+)?$",
      attributionConditionMayBeInvented: false,
      bucket: "public-domain",
      copyrightRiskRelativeToCcWithUnverifiedAuthority: "lower",
      exactDisplayedStatementLinkAndSourceRequired: true,
      licenseNameOrVersionMayBeInvented: false,
      personalityOrPortraitRightsCreated: false,
      suppliedCreditAndNoticeFactsRetained: true,
    },
    requiredProvenanceFields: [
      "adapter-license-when-applicable",
      "alteration-disclosure",
      "athlete-identity",
      "case-ids",
      "credited-name-as-displayed",
      "current-cover-status",
      "different-injury-event-evidence",
      "download-date",
      "exact-athlete-case-mapping",
      "explicit-rights-marker",
      "fixed-source-observation",
      "focal-position",
      "local-byte-length",
      "local-dimensions",
      "local-path",
      "local-sha256",
      "original-binary-identity",
      "original-dimensions",
      "original-filename-or-platform-asset-id",
      "original-mime-type",
      "original-svg-fallback-provenance",
      "rights-bucket",
      "rights-marker-link-or-statement-source",
      "rights-marker-name",
      "rights-marker-token",
      "source-alteration-state",
      "source-page-url",
      "source-platform",
      "source-policy-json-digest",
      "source-policy-markdown-digest",
      "supersession-reason",
      "supplied-copyright-notice-state",
      "supplied-disclaimer-notice-state",
      "supplied-other-notice-state",
      "title-supply-state",
      "work-title",
    ],
    rightsMarkerRules: {
      allRightsReservedEligible: false,
      explicitMarkerRequired: true,
      markerMustIdentifyExactWork: true,
      missingMarkerEligible: false,
      supportedCcTokens: [
        "cc-by-2.0",
        "cc-by-3.0",
        "cc-by-4.0",
        "cc-by-sa-2.0",
        "cc-by-sa-3.0",
        "cc-by-sa-4.0",
        "cc0-1.0",
      ],
      unknownOrAmbiguousMarkerEligible: false,
    },
    scopeId: "decision-15-photo-first-covers-only",
    sourceEvidenceRules,
  },
  sourcePolicyVersion: "nba-v8",
};

const outputBytes = canonicalJson(policy);
if (sha256Hex(outputBytes) !== expectedOutputSha256) {
  throw new Error(
    "Derived nba-v8 source-policy bytes do not match the frozen digest",
  );
}

if (process.argv.includes("--check")) {
  if (readFileSync(resolve(root, outputPath), "utf8") !== outputBytes) {
    throw new Error("Generated nba-v8 source-policy bytes are stale");
  }
  console.log(`nba-v8 source policy OK — ${sha256Hex(outputBytes)}`);
} else if (process.argv.includes("--stdout")) {
  process.stdout.write(outputBytes);
} else {
  writeFileSync(resolve(root, outputPath), outputBytes, "utf8");
}
