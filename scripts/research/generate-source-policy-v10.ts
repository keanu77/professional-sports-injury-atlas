/** Re-derives the immutable Decision 17 follow-up-reporting source policy. */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const parentJsonPath = "research/source-policy/source-policy.v9.json";
const parentMarkdownPath = "research/source-policy/nba.v9.md";
const markdownPath = "research/source-policy/nba.v10.md";
const outputPath = "research/source-policy/source-policy.v10.json";

const expectedParentJsonSha256 =
  "0ac3fecc04e12b88134ce97d11fbe1c742af1f21664a9c80eaf0d76ab7cfcfba";
const expectedParentMarkdownSha256 =
  "03f6a61ee6ef958cae2ae9b918d7b6a115ff0d346f63202efce8780744fbadf2";
const expectedMarkdownSha256 =
  "34e05ef2b6c1f7fbfbafe9dbf5ae469394bcd3a7c6dc49b07f0468a566a5604c";
const expectedOutputSha256 =
  "9203384e5d8b551834e3de5c17a3cc2bff60f8e27416a3074897db861df9a4b3";

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
  "nba-v9 JSON",
);
const parentMarkdownBytes = readFrozen(
  parentMarkdownPath,
  expectedParentMarkdownSha256,
  "nba-v9 Markdown",
);
const markdownBytes = readFrozen(
  markdownPath,
  expectedMarkdownSha256,
  "nba-v10 Markdown",
);

const parent = asRecord(parseStrictJson(parentJsonBytes), "nba-v9 policy");
if (canonicalJson(parent) !== parentJsonBytes) {
  throw new Error("Frozen nba-v9 JSON is not canonical JSON");
}

const parentPrivacy = asRecord(
  parent.privacyAccessRules,
  "nba-v9 privacyAccessRules",
);
if (!Array.isArray(parentPrivacy.closedScopes)) {
  throw new Error("nba-v9 privacyAccessRules.closedScopes must be an array");
}
const inheritedClosedScopes = parentPrivacy.closedScopes;
if (
  inheritedClosedScopes.filter((scope) => scope === "medical-content-authoring")
    .length !== 1
) {
  throw new Error(
    "nba-v9 must close medical-content-authoring exactly once before narrow supersession",
  );
}
const retainedInheritedClosedScopes = inheritedClosedScopes.filter(
  (scope) => scope !== "medical-content-authoring",
);

const followUpReportingRules = {
  actualReturnRules: {
    allowedSourceTiers: ["team-or-league-official"],
    historicalParticipationOnly: true,
    occurrenceDateRequired: true,
    occurrenceDateMustNotBeFuture: true,
    participationEvidenceRequired:
      "official-team-or-league-participation-record",
    prohibitedCopyConcepts: [
      "expected-return",
      "projected-return",
      "target-return",
      "recommended-return",
      "forecast-return",
      "estimated-return",
      "reusable-return-timetable",
    ],
    retrospectiveStatement:
      "實際回場紀錄只描述已發生的參賽事實，不是治療時長、預後、建議或可套用的回場時間表。",
    unverifiedReportAllowed: false,
  },
  atomicItemContract: {
    aggregateDraftDigestStoredInSidecar: false,
    factKinds: ["treatment", "surgery", "injection", "actual-return"],
    itemPayloadDigestExcludes: ["itemPayloadDigest", "review"],
    itemPayloadDigestIncludes: "all-content-and-source-fields",
    oneFactPerItem: true,
    paragraphLevelCitationAllowed: false,
    prohibitedFields: [
      "approvalDigest",
      "decisionPath",
      "estimatedReturn",
      "expectedReturn",
      "forecastReturn",
      "projectedReturn",
      "recommendedReturn",
      "reviewedAt",
      "reviewerIdentity",
      "targetReturn",
    ],
    optionalFields: ["factDate"],
    requiredFields: [
      "id",
      "kind",
      "statement",
      "sourceTier",
      "sourceTitle",
      "sourcePublisherOrAccount",
      "sourceUrl",
      "sourcePublishedAt",
      "sourceAccessedAt",
      "sourceMedium",
      "sourcePolicyBinding",
      "itemPayloadDigest",
      "review",
    ],
    reviewBinding: {
      allowedKeys: ["status", "reviewedPayloadDigest"],
      reviewedPayloadDigestMustEqualItemPayloadDigest: true,
      status: "pending-owner-signoff",
    },
    sharedSourceListMaySatisfyItems: false,
    sourcePolicyVersion: "nba-v10",
  },
  attributionRules: {
    blockStatement:
      "以下內容是第三方報導的整理，不是本站醫師的診斷、評估或建議。",
    eachItemNamesReportingThirdParty: true,
    eachItemOwnSourceRequired: true,
    pendingLabel: "待醫師簽核",
    visibleItemSourceFacts: [
      "source-tier-label",
      "source-title",
      "publisher-or-account",
      "source-publication-date",
      "source-target",
    ],
  },
  createsExecutionAuthorization: false,
  existingVideoAndSourceManifestPolicyVersion: "nba-v2",
  emptyStateRules: {
    allFactKindArraysExplicitlyPresent: true,
    emptyArrayRequiredWhenNoQualifyingFact: true,
    emptyDoesNotProveNonOccurrence: true,
    exactVisibleText: "查無符合本政策且可逐條引用的紀錄；未據此推定未曾發生。",
    inferredOrTypicalCompletionAllowed: false,
  },
  executionBoundary: {
    authoringScope: "pending-follow-up-authoring-only",
    closedScopeIds: [
      "deployment",
      "external-account-mutation",
      "hosting-service-mutation",
      "indexing",
      "medical-review-decision",
      "public-release",
      "remote-repository-mutation",
    ],
    existingOwnerApprovalExtendsToNewItems: false,
    medicalContentAuthoringSupersession:
      "exact-decision-17-pending-follow-up-authoring-only",
    medicalReviewDecisionOpen: false,
    scopeId: "decision-17-case-filter-and-followup-notes-only",
  },
  legacyDiagnosisProjectionRules: {
    allowedExistingField: "general.confirmedUpdate",
    exactlyOneExistingSupportingSourceRequired: true,
    existingClinicalCoreDigestUnchanged: true,
    projectionCreatesNewApproval: false,
    sourceTierVisible: true,
  },
  noInferenceRules: {
    claimsMayBeAssembledFromIncompleteReports: false,
    prohibitedInferences: [
      "unstated-surgery",
      "unstated-injection",
      "rehabilitation-duration",
      "prognosis",
      "return-date",
      "appropriateness",
      "efficacy",
      "causation",
      "outcome",
    ],
    reportedInterventionAndSupportedDateOnly: true,
  },
  reviewAndResearchLimits: {
    itemMaximumStatus: "pending-owner-signoff",
    medicalApprovalCreated: false,
    publicProjectionOfPendingItems: "omit-or-reject",
    researcherMaximumStatus: "source-ready",
    sourceApprovalCreated: false,
  },
  sourcePageRules: {
    canonicalHttpsUrlRequired: true,
    openedOriginalPageRequired: true,
    requiredSourceFacts: [
      "canonical-url",
      "final-url",
      "publisher-or-account",
      "title",
      "publication-date",
      "access-date",
      "medium",
      "tier-basis",
      "supported-fact",
    ],
    searchResultSnippetIsEvidence: false,
    sourceWithoutPublicationDateAllowed: false,
  },
  sourcePresentationRules: {
    nbaCanonicalHosts: ["nba.com", "*.nba.com"],
    nbaFullUrlVisibleAsLiteralText: true,
    nbaNavigationSinksForbidden: [
      "anchor",
      "redirect",
      "iframe",
      "metadata-url",
      "json-ld-url",
      "script-target",
      "client-side-reconstruction",
    ],
    nonNbaHttpsDirectExternalLinkAllowed: true,
  },
  sourceTiers: [
    {
      classificationRule:
        "directly controlled team or league release/report; domain alone is insufficient without publisher identity",
      label: "球隊／聯盟官方公告",
      token: "team-or-league-official",
    },
    {
      classificationRule:
        "named mainstream outlet article or identifiable affiliated reporter article/post with preserved account and publisher facts",
      label: "主流媒體報導",
      token: "mainstream-media-report",
    },
    {
      classificationRule:
        "another report, social post, anonymous claim, or claim not independently confirmed",
      label: "未證實報導",
      token: "unverified-report",
      visuallyPromotedToConfirmed: false,
    },
  ],
} as const;

const policy = {
  ...parent,
  followUpReportingPolicyInheritance: {
    jsonPath: parentJsonPath,
    jsonSha256: sha256Hex(parentJsonBytes),
    markdownPath: parentMarkdownPath,
    markdownSha256: sha256Hex(parentMarkdownBytes),
    sourcePolicyVersion: "nba-v9",
  },
  followUpReportingRules,
  humanPolicyDocument: {
    path: markdownPath,
    sha256: sha256Hex(markdownBytes),
  },
  privacyAccessRules: {
    ...parentPrivacy,
    closedScopes: retainedInheritedClosedScopes,
  },
  sourcePolicyVersion: "nba-v10",
};

const outputBytes = canonicalJson(policy);
const outputSha256 = sha256Hex(outputBytes);
if (outputSha256 !== expectedOutputSha256) {
  throw new Error(
    "Derived nba-v10 source-policy bytes do not match the frozen digest",
  );
}

if (process.argv.includes("--check")) {
  if (readFileSync(resolve(root, outputPath), "utf8") !== outputBytes) {
    throw new Error("Generated nba-v10 source-policy bytes are stale");
  }
  console.log(`nba-v10 source policy OK — ${outputSha256}`);
} else if (process.argv.includes("--stdout")) {
  process.stdout.write(outputBytes);
} else {
  writeFileSync(resolve(root, outputPath), outputBytes, "utf8");
  console.log(`nba-v10 source policy generated — ${outputSha256}`);
}
