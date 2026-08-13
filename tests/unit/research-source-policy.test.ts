import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  CANDIDATE_CAPTION_STATUSES,
  CANDIDATE_COMPETITIONS,
  CANDIDATE_DIAGNOSIS_STATUSES,
  CANDIDATE_DISCOVERY_STATUSES,
  CANDIDATE_EMBED_STATUSES,
  CANDIDATE_INJURY_CODES,
  CANDIDATE_VIDEO_CONTENT_TYPES,
  CANDIDATE_VIDEO_PROVIDERS,
  DIAGNOSIS_SOURCE_TYPES,
  FIRST_PARTY_AVAILABILITY_STATUSES,
  PROVENANCE_CHECK_STATUSES,
  RECENT_CANDIDATE_CUTOFF,
  VIDEO_UPLOADER_PROVENANCES,
} from "../../src/lib/research/candidate-contract";
import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/cases/canonical-json";

const V1_JSON_POLICY_PATH =
  "research/source-policy/source-policy.v1.json" as const;
const V1_MARKDOWN_POLICY_PATH = "research/source-policy/nba.v1.md" as const;
const JSON_POLICY_PATH =
  "research/source-policy/source-policy.v2.json" as const;
const MARKDOWN_POLICY_PATH = "research/source-policy/nba.v2.md" as const;
const V3_JSON_POLICY_PATH =
  "research/source-policy/source-policy.v3.json" as const;
const V3_MARKDOWN_POLICY_PATH = "research/source-policy/nba.v3.md" as const;
const V4_JSON_POLICY_PATH =
  "research/source-policy/source-policy.v4.json" as const;
const V4_MARKDOWN_POLICY_PATH = "research/source-policy/nba.v4.md" as const;
const V5_JSON_POLICY_PATH =
  "research/source-policy/source-policy.v5.json" as const;
const V5_MARKDOWN_POLICY_PATH = "research/source-policy/nba.v5.md" as const;
const V2_DATE_RULE_PARAGRAPH =
  "For the primary video's event-date identity check, `video_published_at` must fall within the inclusive window from `event_date` through `event_date + 3 days`, or the video title must contain `event_date`. This window is asymmetric: publication before `event_date` is ineligible.";

const EXPECTED_ROOT_KEYS = [
  "captionRules",
  "controlledTokens",
  "cutoffDate",
  "decisionTable",
  "diagnosisRules",
  "eventVideoRules",
  "humanPolicyDocument",
  "mediaHandlingRules",
  "officialReferences",
  "privacyAccessRules",
  "schemaVersion",
  "sourcePageRules",
  "sourcePolicyVersion",
  "uploaderProviderRules",
  "versionChangeRules",
  "workflowRules",
] as const;

const EXPECTED_CONTROLLED_TOKENS = {
  candidateCaptionStatus: ["not-verified", "available", "unavailable"],
  candidateCompetition: [
    "nba-preseason",
    "nba-regular-season",
    "nba-play-in",
    "nba-playoffs",
    "nba-all-star",
  ],
  candidateDiagnosisStatus: ["unconfirmed", "confirmed", "conflicted"],
  candidateDiscoveryStatus: [
    "discovered",
    "needs-source",
    "source-ready",
    "source-verified",
    "excluded",
  ],
  candidateEmbedStatus: [
    "unchecked",
    "verified",
    "external-link-only",
    "unavailable",
  ],
  candidateInjuryCode: ["acl", "ankle-sprain", "achilles-rupture"],
  candidateVideoContentType: ["in-game-injury-event"],
  candidateVideoProvider: ["youtube", "nba"],
  diagnosisSourceType: ["", "diagnosis-first-party", "diagnosis-secondary"],
  firstPartyAvailabilityStatus: [
    "available",
    "documented-unavailable",
    "not-applicable",
  ],
  provenanceCheckStatus: ["pending", "verified", "rejected"],
  videoUploaderProvenance: [
    "league",
    "team",
    "broadcaster-rightsholder",
    "official-player",
    "unknown",
  ],
} as const;

const EXPECTED_PLAN_REFERENCE_URLS = [
  "https://official.nba.com/nba-injury-report-2025-26-season/",
  "https://www.nba.com/termsofuse",
  "https://support.google.com/youtube/answer/171780",
  "https://developers.google.com/youtube/player_parameters",
  "https://developers.google.com/youtube/iframe_api_reference",
  "https://developers.google.com/youtube/terms/developer-policies",
  "https://developers.google.com/youtube/v3/docs/videos/list",
] as const;

const YOUTUBE_HELP_PLAN_URL =
  "https://support.google.com/youtube/answer/171780";
const YOUTUBE_HELP_CANONICAL_URL = `${YOUTUBE_HELP_PLAN_URL}?hl=en`;
const REFERENCE_URLS_WITHOUT_OBSERVED_CANONICAL = new Set([
  "https://official.nba.com/nba-injury-report-2025-26-season/",
  "https://www.nba.com/termsofuse",
]);

const EXPECTED_OFFICIAL_REFERENCES = [
  {
    accessedAt: "2026-08-06",
    declaredCanonicalUrl: null,
    finalUrl: "https://official.nba.com/nba-injury-report-2025-26-season/",
    key: "nba-official-injury-reports",
    planUrl: "https://official.nba.com/nba-injury-report-2025-26-season/",
    publisher: "NBA Official",
    title: "NBA Injury Report: 2025-26 Season | NBA Official",
  },
  {
    accessedAt: "2026-08-06",
    declaredCanonicalUrl: null,
    finalUrl: "https://www.nba.com/termsofuse",
    key: "nba-terms-of-use",
    planUrl: "https://www.nba.com/termsofuse",
    publisher: "NBA.com",
    title: "Terms of Use | NBA.com",
  },
  {
    accessedAt: "2026-08-06",
    declaredCanonicalUrl: YOUTUBE_HELP_CANONICAL_URL,
    finalUrl: YOUTUBE_HELP_PLAN_URL,
    key: "youtube-privacy-enhanced-embedding",
    planUrl: YOUTUBE_HELP_PLAN_URL,
    publisher: "YouTube Help",
    title: "Embed videos & playlists - YouTube Help",
  },
  {
    accessedAt: "2026-08-06",
    declaredCanonicalUrl:
      "https://developers.google.com/youtube/player_parameters",
    finalUrl: "https://developers.google.com/youtube/player_parameters",
    key: "youtube-player-parameters",
    planUrl: "https://developers.google.com/youtube/player_parameters",
    publisher: "Google for Developers (YouTube)",
    title:
      "YouTube Embedded Players and Player Parameters | YouTube IFrame Player API | Google for Developers",
  },
  {
    accessedAt: "2026-08-06",
    declaredCanonicalUrl:
      "https://developers.google.com/youtube/iframe_api_reference",
    finalUrl: "https://developers.google.com/youtube/iframe_api_reference",
    key: "youtube-iframe-api",
    planUrl: "https://developers.google.com/youtube/iframe_api_reference",
    publisher: "Google for Developers (YouTube)",
    title:
      "YouTube Player API Reference for iframe Embeds | YouTube IFrame Player API | Google for Developers",
  },
  {
    accessedAt: "2026-08-06",
    declaredCanonicalUrl:
      "https://developers.google.com/youtube/terms/developer-policies",
    finalUrl: "https://developers.google.com/youtube/terms/developer-policies",
    key: "youtube-developer-policies",
    planUrl: "https://developers.google.com/youtube/terms/developer-policies",
    publisher: "Google for Developers (YouTube)",
    title: "YouTube API Services - Developer Policies | Google for Developers",
  },
  {
    accessedAt: "2026-08-06",
    declaredCanonicalUrl:
      "https://developers.google.com/youtube/v3/docs/videos/list",
    finalUrl: "https://developers.google.com/youtube/v3/docs/videos/list",
    key: "youtube-videos-api",
    planUrl: "https://developers.google.com/youtube/v3/docs/videos/list",
    publisher: "Google for Developers (YouTube)",
    title: "Videos: list | YouTube Data API | Google for Developers",
  },
] as const;

const EXPECTED_UPLOADER_DECISIONS = [
  { provenance: "league", action: "accepted" },
  { provenance: "team", action: "accepted" },
  { provenance: "broadcaster-rightsholder", action: "accepted" },
  {
    provenance: "official-player",
    action: "requires-separate-documented-authority",
  },
  {
    provenance: "unknown",
    action: "requires-separate-documented-authority",
  },
  { provenance: "fan-compilation-repost", action: "excluded" },
] as const;

const EXPECTED_DECISION_TABLE = [
  {
    condition:
      "First-party diagnosis + accepted original uploader + verified embed",
    candidateAction: "eligible for source review",
  },
  {
    condition: "First-party diagnosis + accepted uploader + embed disabled",
    candidateAction: "eligible as external-link-only",
  },
  {
    condition:
      "Classic + two independent explicit secondary diagnoses + accepted video",
    candidateAction: "eligible for classic exception review",
  },
  {
    condition: "Diagnosis based only on video/commentary",
    candidateAction: "needs-source or excluded",
  },
  {
    condition: "Fan/compilation/repost uploader",
    candidateAction: "excluded",
  },
  {
    condition:
      "Official recap/interview/practice/warm-up/rehab clip rather than the in-game injury event",
    candidateAction: "excluded as primary video",
  },
  {
    condition: "Source conflict",
    candidateAction: "conflicted; not source-verified",
  },
  {
    condition: "Video deleted but audit sources remain",
    candidateAction: "unavailable; not counted in manifest",
  },
  {
    condition: "Search snippet only",
    candidateAction: "not a source",
  },
] as const;

// Immutable version-to-bytes bindings. Changing any literal requires a new
// version and the complete downstream policy cycle.
const EXPECTED_V1_JSON_SHA256 =
  "a588b68f3468bec8d24cda9005435ecb0177cc74dbaff7d14f793ec45dcdd280";
const EXPECTED_V1_MARKDOWN_SHA256 =
  "f983c682d3504902ff9ae8a57cbd414e4855de2abbb3b6f2855d3532df8fed46";
const EXPECTED_JSON_SHA256 =
  "6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07";
const EXPECTED_MARKDOWN_SHA256 =
  "b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570";
const EXPECTED_V3_JSON_SHA256 =
  "284a88792f281564799eeae6b62646b855072725824ef21f3cea4204a3d14270";
const EXPECTED_V3_MARKDOWN_SHA256 =
  "7dc98d1146ffe701a312694512bfe513f27d3edb8ecaeeb2f933a92f9fb32ca2";
const EXPECTED_V4_JSON_SHA256 =
  "3320fe2051fc091aa055d5cdd8bcdacf24073c3964cac3d1a982666a2aafbf68";
const EXPECTED_V4_MARKDOWN_SHA256 =
  "929ac5f125db222d8eb6e98a3a52b1778ebd28c743884c945ab917619ebd5994";
const EXPECTED_V5_JSON_SHA256 =
  "5f38066ce0ef0c10f0494856f90114dc403c068986b4c323cbb2ef3ebbda56ac";
const EXPECTED_V5_MARKDOWN_SHA256 =
  "a59111d915caeb7f1e8f730492e826be63ff95fb5b1feeb1576eeb75a95e6aae";

const FROZEN_POLICY_BY_VERSION = Object.freeze({
  "nba-v1": Object.freeze({
    jsonPath: V1_JSON_POLICY_PATH,
    jsonSha256: EXPECTED_V1_JSON_SHA256,
    markdownPath: V1_MARKDOWN_POLICY_PATH,
    markdownSha256: EXPECTED_V1_MARKDOWN_SHA256,
  }),
  "nba-v2": Object.freeze({
    jsonPath: JSON_POLICY_PATH,
    jsonSha256: EXPECTED_JSON_SHA256,
    markdownPath: MARKDOWN_POLICY_PATH,
    markdownSha256: EXPECTED_MARKDOWN_SHA256,
  }),
  "nba-v3": Object.freeze({
    jsonPath: V3_JSON_POLICY_PATH,
    jsonSha256: EXPECTED_V3_JSON_SHA256,
    markdownPath: V3_MARKDOWN_POLICY_PATH,
    markdownSha256: EXPECTED_V3_MARKDOWN_SHA256,
  }),
  "nba-v4": Object.freeze({
    jsonPath: V4_JSON_POLICY_PATH,
    jsonSha256: EXPECTED_V4_JSON_SHA256,
    markdownPath: V4_MARKDOWN_POLICY_PATH,
    markdownSha256: EXPECTED_V4_MARKDOWN_SHA256,
  }),
  "nba-v5": Object.freeze({
    jsonPath: V5_JSON_POLICY_PATH,
    jsonSha256: EXPECTED_V5_JSON_SHA256,
    markdownPath: V5_MARKDOWN_POLICY_PATH,
    markdownSha256: EXPECTED_V5_MARKDOWN_SHA256,
  }),
});

type FrozenPolicyVersion = keyof typeof FROZEN_POLICY_BY_VERSION;

function readPolicyFile(
  path:
    | typeof V1_JSON_POLICY_PATH
    | typeof V1_MARKDOWN_POLICY_PATH
    | typeof JSON_POLICY_PATH
    | typeof MARKDOWN_POLICY_PATH
    | typeof V3_JSON_POLICY_PATH
    | typeof V3_MARKDOWN_POLICY_PATH
    | typeof V4_JSON_POLICY_PATH
    | typeof V4_MARKDOWN_POLICY_PATH
    | typeof V5_JSON_POLICY_PATH
    | typeof V5_MARKDOWN_POLICY_PATH,
): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

function asRecord(value: unknown, label = "value"): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function asRecordArray(
  value: unknown,
  label: string,
): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((entry, index) => asRecord(entry, `${label}[${index}]`));
}

function parseCanonicalPolicy(jsonBytes = readPolicyFile(JSON_POLICY_PATH)) {
  const parsed = asRecord(parseStrictJson(jsonBytes), "source policy");
  if (canonicalJson(parsed) !== jsonBytes) {
    throw new Error("source policy JSON is not canonical JSON");
  }
  return parsed;
}

function verifyFrozenPolicyBytes(
  jsonBytes: string,
  markdownBytes: string,
): {
  sourcePolicyVersion: FrozenPolicyVersion;
  jsonSha256: string;
  markdownSha256: string;
} {
  const policy = parseCanonicalPolicy(jsonBytes);
  const sourcePolicyVersion = policy.sourcePolicyVersion;
  if (typeof sourcePolicyVersion !== "string") {
    throw new Error("source policy has no declared sourcePolicyVersion");
  }
  if (!(sourcePolicyVersion in FROZEN_POLICY_BY_VERSION)) {
    throw new Error(
      `unregistered source-policy version ${sourcePolicyVersion}`,
    );
  }

  const frozen =
    FROZEN_POLICY_BY_VERSION[sourcePolicyVersion as FrozenPolicyVersion];
  const jsonSha256 = sha256Hex(jsonBytes);
  const markdownSha256 = sha256Hex(markdownBytes);
  if (
    frozen.jsonSha256 !== jsonSha256 ||
    frozen.markdownSha256 !== markdownSha256
  ) {
    throw new Error(`same-version content drift for ${sourcePolicyVersion}`);
  }

  const humanPolicy = asRecord(
    policy.humanPolicyDocument,
    "humanPolicyDocument",
  );
  if (
    humanPolicy.path !== frozen.markdownPath ||
    humanPolicy.sha256 !== markdownSha256
  ) {
    throw new Error("human policy path/digest does not match its exact bytes");
  }

  return {
    sourcePolicyVersion: sourcePolicyVersion as FrozenPolicyVersion,
    jsonSha256,
    markdownSha256,
  };
}

function markdownTable(
  markdown: string,
  heading: string,
): Array<[string, string]> {
  const afterHeading = markdown.split(`${heading}\n`)[1];
  if (afterHeading === undefined) throw new Error(`missing ${heading}`);
  const section = afterHeading.split(/\n## /u)[0] ?? "";
  return section
    .split("\n")
    .filter((line) => /^\s*\|/u.test(line))
    .filter((line) => !/^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/u.test(line))
    .map((line) => {
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim());
      if (cells.length !== 2) {
        throw new Error(`${heading} must contain exactly two columns`);
      }
      return [cells[0] as string, cells[1] as string];
    });
}

describe("NBA source-policy nba-v2 contract", () => {
  it("is strict canonical JSON with the exact later-consumer root, version, and cutoff", () => {
    const bytes = readPolicyFile(JSON_POLICY_PATH);
    const policy = parseCanonicalPolicy(bytes);

    expect(Object.keys(policy)).toEqual(EXPECTED_ROOT_KEYS);
    expect(bytes.endsWith("\n")).toBe(false);
    expect(policy.schemaVersion).toBe(1);
    expect(policy.sourcePolicyVersion).toBe("nba-v2");
    expect(policy.cutoffDate).toBe("2016-08-06");
    expect(policy.cutoffDate).toBe(RECENT_CANDIDATE_CUTOFF);
  });

  it("carries every controlled token exactly and stays synchronized with the ledger contract", () => {
    const policy = parseCanonicalPolicy();
    expect(policy.controlledTokens).toEqual(EXPECTED_CONTROLLED_TOKENS);

    expect(CANDIDATE_CAPTION_STATUSES).toEqual(
      EXPECTED_CONTROLLED_TOKENS.candidateCaptionStatus,
    );
    expect(CANDIDATE_COMPETITIONS).toEqual(
      EXPECTED_CONTROLLED_TOKENS.candidateCompetition,
    );
    expect(CANDIDATE_DIAGNOSIS_STATUSES).toEqual(
      EXPECTED_CONTROLLED_TOKENS.candidateDiagnosisStatus,
    );
    expect(CANDIDATE_DISCOVERY_STATUSES).toEqual(
      EXPECTED_CONTROLLED_TOKENS.candidateDiscoveryStatus,
    );
    expect(CANDIDATE_EMBED_STATUSES).toEqual(
      EXPECTED_CONTROLLED_TOKENS.candidateEmbedStatus,
    );
    expect(CANDIDATE_INJURY_CODES).toEqual(
      EXPECTED_CONTROLLED_TOKENS.candidateInjuryCode,
    );
    expect(CANDIDATE_VIDEO_CONTENT_TYPES).toEqual(
      EXPECTED_CONTROLLED_TOKENS.candidateVideoContentType,
    );
    expect(CANDIDATE_VIDEO_PROVIDERS).toEqual(
      EXPECTED_CONTROLLED_TOKENS.candidateVideoProvider,
    );
    expect(DIAGNOSIS_SOURCE_TYPES).toEqual(
      EXPECTED_CONTROLLED_TOKENS.diagnosisSourceType,
    );
    expect(FIRST_PARTY_AVAILABILITY_STATUSES).toEqual(
      EXPECTED_CONTROLLED_TOKENS.firstPartyAvailabilityStatus,
    );
    expect(PROVENANCE_CHECK_STATUSES).toEqual(
      EXPECTED_CONTROLLED_TOKENS.provenanceCheckStatus,
    );
    expect(VIDEO_UPLOADER_PROVENANCES).toEqual(
      EXPECTED_CONTROLLED_TOKENS.videoUploaderProvenance,
    );
  });

  it("records the exact seven opened plan URLs with canonical metadata and access date", () => {
    const policy = parseCanonicalPolicy();
    const references = asRecordArray(
      policy.officialReferences,
      "officialReferences",
    );
    expect(references).toHaveLength(7);
    expect(references.map(({ planUrl }) => planUrl)).toEqual(
      EXPECTED_PLAN_REFERENCE_URLS,
    );
    expect(references).toEqual(EXPECTED_OFFICIAL_REFERENCES);
    expect(new Set(references.map(({ key }) => key)).size).toBe(7);

    for (const reference of references) {
      expect(Object.keys(reference).sort()).toEqual([
        "accessedAt",
        "declaredCanonicalUrl",
        "finalUrl",
        "key",
        "planUrl",
        "publisher",
        "title",
      ]);
      expect(reference.accessedAt).toBe("2026-08-06");
      expect(reference.key).toEqual(expect.stringMatching(/^[a-z0-9-]+$/u));
      expect(reference.publisher).toEqual(expect.stringMatching(/\S/u));
      expect(reference.title).toEqual(expect.stringMatching(/\S/u));
      expect(reference.finalUrl).toEqual(expect.stringMatching(/^https:\/\//u));

      if (reference.planUrl === YOUTUBE_HELP_PLAN_URL) {
        expect(reference.declaredCanonicalUrl).toBe(YOUTUBE_HELP_CANONICAL_URL);
      } else if (
        REFERENCE_URLS_WITHOUT_OBSERVED_CANONICAL.has(
          reference.planUrl as string,
        )
      ) {
        expect(reference.finalUrl).toBe(reference.planUrl);
        expect(reference.declaredCanonicalUrl).toBeNull();
      } else {
        expect(reference.finalUrl).toBe(reference.planUrl);
        expect(reference.declaredCanonicalUrl).toBe(reference.planUrl);
      }
    }
  });

  it("fixes the first-party diagnosis hierarchy and independent classic exception", () => {
    const rules = asRecord(parseCanonicalPolicy().diagnosisRules);
    expect(rules).toEqual({
      classicException: {
        firstPartyRuleAppliesWhenAvailable: true,
        originReportIdMayBeEmpty: true,
        requiredAuditFacts: [
          "official-locations-searched",
          "attempted-canonical-or-archived-urls",
          "observed-http-or-search-outcome",
          "checked-by",
          "checked-at",
          "exact-candidate-audit-reference",
        ],
        requiredFirstPartyAvailabilityStatus: "documented-unavailable",
        requiredMinimumExplicitSecondarySources: 2,
        requiresDifferentIndependenceGroups: true,
        requiresExactCandidateAuditReference: true,
        requiresNoSharedNonEmptyOriginReportId: true,
        requiresNamedCheckerAndDate: true,
        status: "proposal-requiring-named-approval",
      },
      conflictAction: "conflicted-not-source-verified",
      diagnosisClaim: {
        addedGradeAllowed: false,
        addedPrognosisAllowed: false,
        format: "brief-factual-paraphrase",
      },
      acceptedFirstPartySourceTypes: [
        "league",
        "team",
        "official-injury-report",
        "official-press-release",
        "other-first-party",
      ],
      injuryReportClaimLimits: [
        "written-diagnosis-only",
        "no-unwritten-grade",
        "no-unwritten-imaging",
        "no-unwritten-surgery",
        "no-unwritten-rehabilitation-length",
        "no-unwritten-return-date",
      ],
      recentCandidateMinimumExplicitFirstPartySources: 1,
      sameIndependenceGroupIsIndependent: false,
      sameNonEmptyOriginReportIdIsIndependent: false,
      searchResultSnippetIsEvidence: false,
      videoOrCommentaryConfirmsDiagnosis: false,
    });
  });

  it("limits launch video to the same in-game injury event and excludes substitute clip types", () => {
    const rules = asRecord(parseCanonicalPolicy().eventVideoRules);
    expect(rules).toEqual({
      canonicalUrlRule: "original-platform-page-without-tracking-parameters",
      eventIdentityDoesNotConfirmDiagnosis: true,
      eventIdentityEvidenceMustAgree: [
        "event-source",
        "video-title-or-context",
        "root-audit",
      ],
      eventIdentityMustMatch: [
        "athlete",
        "event-date",
        "opponent",
        "competition",
      ],
      excludedPrimaryContent: [
        "official-interview",
        "news-recap",
        "analysis-package",
        "practice",
        "warm-up",
        "rehabilitation",
        "return-footage",
        "compilation",
      ],
      launchPrimaryContentTypes: ["in-game-injury-event"],
      primaryVideoEventDateRule: {
        titleContainsEventDateAlternative: true,
        videoPublishedAtWindow: {
          endOffsetDays: 3,
          inclusive: true,
          startOffsetDays: 0,
        },
      },
    });
  });

  it("fixes uploader acceptance, original-platform URLs, and provider/embed boundaries", () => {
    const rules = asRecord(parseCanonicalPolicy().uploaderProviderRules);
    expect(rules).toEqual({
      newProviderRequiresPolicyRevisionAndTest: true,
      oEmbedProvesEmbeddabilityOrRights: false,
      provenanceVerifiedMeans:
        "uploader-rightsholder-provenance-passed-source-policy-only",
      providerRules: [
        {
          allowedEmbedStatuses: [
            "verified",
            "external-link-only",
            "unavailable",
          ],
          provider: "youtube",
          verifiedEmbedRequiresManualPrivacyEnhancedCheck: true,
        },
        {
          allowedEmbedStatuses: ["external-link-only", "unavailable"],
          provider: "nba",
          verifiedEmbedAllowed: false,
        },
      ],
      requiredProvenanceFacts: [
        "original-platform-url",
        "channel-url",
        "uploader-name",
        "publication-date",
        "access-date",
        "provenance-token",
        "factual-provenance-basis",
      ],
      technicalEmbeddabilityProvesRights: false,
      uploaderAcceptance: EXPECTED_UPLOADER_DECISIONS,
      youtubeApiProvesCopyrightPermissionOrRegionalAvailability: false,
    });
  });

  it("requires captions while preserving the external-link accessibility fallback", () => {
    expect(parseCanonicalPolicy().captionRules).toEqual({
      checkOriginalPlatformControlRequired: true,
      notVerifiedCanReachSourceReady: false,
      siteWrittenSummaryRequired: true,
      transcriptCopiedOrStored: false,
      unavailableCanReachAuthoring: true,
      unavailablePublicBehavior: "clearly-labeled-original-external-link",
    });
  });

  it("forbids downloads and screenshots and fixes click-to-load, noindex, and permission boundaries", () => {
    expect(parseCanonicalPolicy().mediaHandlingRules).toEqual({
      downloadAllowed: false,
      downloadIntoRepository: false,
      permittedStoredFacts: [
        "short-factual-paraphrase",
        "page-title",
        "publisher-name",
        "date",
        "canonical-url",
        "uploader-provenance",
        "verification-outcome",
      ],
      platformMediaMayBePlacedBehindPaidViewingGate: false,
      playerBrandingOrUploaderIdentityMayBeObscured: false,
      prohibitedStoredMedia: [
        "video",
        "audio",
        "screenshot",
        "thumbnail",
        "transcript",
        "article-body",
        "copyrighted-media",
      ],
      reproductionOrReuploadAllowed: false,
      screenshotCaptureOrStorage: false,
    });
    expect(parseCanonicalPolicy().privacyAccessRules).toEqual({
      atlasControlsNotOfficialReferenceQuotations: [
        "click-to-load",
        "no-screenshot",
        "noindex-is-not-privacy",
      ],
      authorizedScope: "nba-source-discovery-only",
      autoplay: false,
      clickToLoad: true,
      closedScopes: [
        "medical-content-authoring",
        "private-hosting",
        "public-release",
        "deployment",
        "indexing",
      ],
      noPreClickThirdPartyPlayerRequest: true,
      noindexIsAccessControl: false,
      noindexIsPrivacy: false,
      privateReviewRequiresHostingLayerAccessControl: true,
      privateReviewRequiresUnauthorizedRequestTesting: true,
      sourceVerifiedDoesNotMean: [
        "medically-reviewed",
        "publicly-releasable",
        "legally-licensed",
        "private",
        "safe-to-index",
      ],
      sourceVerifiedMeans: "ready-for-case-authoring-only",
      technicalEmbeddingIsLegalPermission: false,
      youtubePrivacyEnhancedHost: "www.youtube-nocookie.com",
    });
  });

  it("stops researchers at source-ready and reserves promotion for the named content owner", () => {
    expect(parseCanonicalPolicy().workflowRules).toEqual({
      agentMayInventReviewIdentity: false,
      agentMayPromoteToSourceVerified: false,
      researcherMaximumStatus: "source-ready",
      sourceReadyRequiresAllSourceFieldsPass: true,
      sourceVerifiedPromotionRequires: [
        "root-audit-pass",
        "named-content-owner",
        "durable-source-review-decision",
        "frozen-candidate-set-digest",
        "both-policy-digests",
      ],
    });
    const markdown = readPolicyFile(MARKDOWN_POLICY_PATH);
    expect(markdown).toMatch(/Researchers and agents stop at `source-ready`/u);
    expect(markdown).toMatch(
      /Only the named content owner may promote a root-audited row to `source-verified`/u,
    );
    expect(markdown).toMatch(
      /No researcher or agent may invent that identity/u,
    );
  });

  it("requires every included diagnosis, event, and video source original page to be opened", () => {
    expect(parseCanonicalPolicy().sourcePageRules).toEqual({
      appliesTo: ["diagnosis-source", "event-source", "video-source"],
      everyIncludedSourcePageMustBeOpened: true,
      requiredMetadata: ["canonical-url", "publisher", "access-date"],
      searchResultSnippetMaySubstituteForOpenedPage: false,
      sourceUrlDateOrDiagnosisFabricationAllowed: false,
      unresolvedFactsRemainUnresolved: true,
    });
    const markdown = readPolicyFile(MARKDOWN_POLICY_PATH);
    expect(markdown).toMatch(
      /Every included diagnosis, event, and video source page must be opened on its original page/u,
    );
    expect(markdown).toMatch(/canonical URL, publisher, and access date/u);
    expect(markdown).toMatch(
      /No worker invents a source, URL, date, or diagnosis/u,
    );
    expect(markdown).toMatch(
      /Unavailable information remains explicitly unresolved or is recorded as not found/u,
    );
  });

  it("contains exactly the nine authorized candidate decisions in JSON and Markdown", () => {
    const policy = parseCanonicalPolicy();
    expect(policy.decisionTable).toEqual(EXPECTED_DECISION_TABLE);
    expect(EXPECTED_DECISION_TABLE).toHaveLength(9);

    const table = markdownTable(
      readPolicyFile(MARKDOWN_POLICY_PATH),
      "## Candidate decision table",
    );
    expect(table).toEqual([
      ["Condition", "Candidate action"],
      ...EXPECTED_DECISION_TABLE.map(
        ({ condition, candidateAction }): [string, string] => [
          condition,
          candidateAction,
        ],
      ),
    ]);
  });

  it("states the required human diagnosis, event, uploader, and media boundaries", () => {
    const markdown = readPolicyFile(MARKDOWN_POLICY_PATH);
    expect(markdown).toContain("`nba-v2`");
    expect(markdown).toContain("`2016-08-06`");
    expect(markdown).toContain(V2_DATE_RULE_PARAGRAPH);
    for (const url of EXPECTED_PLAN_REFERENCE_URLS) {
      expect(markdown).toContain(url);
    }
    expect(markdown).toMatch(/first-party source is required/iu);
    expect(markdown).toMatch(/two explicit secondary diagnosis sources/iu);
    expect(markdown).toMatch(/different normalized `independence_group`/iu);
    expect(markdown).toMatch(/same non-empty `origin_report_id`/iu);
    expect(markdown).toMatch(/same athlete's injury event/iu);
    expect(markdown).toMatch(
      /event identity only and never establishes a diagnosis/iu,
    );
    expect(markdown).toMatch(/official interviews, recaps/iu);

    const uploaderSection = markdown.split(
      "## Provider and uploader acceptance",
    )[1];
    expect(uploaderSection).toBeDefined();
    expect(uploaderSection).toContain("`league`");
    expect(uploaderSection).toContain("`team`");
    expect(uploaderSection).toContain("`broadcaster-rightsholder`");
    expect(uploaderSection).toContain("`official-player`");
    expect(uploaderSection).toContain("`unknown`");
    expect(uploaderSection).toMatch(/fan, compilation, (?:edit, )?or repost/iu);

    expect(markdown).toMatch(/No worker downloads/iu);
    expect(markdown).toMatch(/No screenshot or custom thumbnail/iu);
    expect(markdown).toMatch(
      /privacy-enhanced `youtube-nocookie\.com` player/iu,
    );
    expect(markdown).toMatch(/click-to-load behavior without autoplay/iu);
    expect(markdown).toMatch(
      /`noindex` is an indexing directive, not privacy/iu,
    );
    expect(markdown).toMatch(/Technical embedding is not legal permission/iu);
  });

  it("preserves every nba-v1 JSON rule and Markdown byte outside the authorized v2 deltas", () => {
    const v1Policy = parseCanonicalPolicy(readPolicyFile(V1_JSON_POLICY_PATH));
    const v2Policy = parseCanonicalPolicy();
    const v2EventRules = asRecord(v2Policy.eventVideoRules);
    const { primaryVideoEventDateRule, ...unchangedEventRules } = v2EventRules;

    expect(primaryVideoEventDateRule).toEqual({
      titleContainsEventDateAlternative: true,
      videoPublishedAtWindow: {
        endOffsetDays: 3,
        inclusive: true,
        startOffsetDays: 0,
      },
    });
    expect({
      ...v2Policy,
      eventVideoRules: unchangedEventRules,
      humanPolicyDocument: v1Policy.humanPolicyDocument,
      sourcePolicyVersion: "nba-v1",
    }).toEqual(v1Policy);

    const normalizedV2Markdown = readPolicyFile(MARKDOWN_POLICY_PATH)
      .replace(`${V2_DATE_RULE_PARAGRAPH}\n\n`, "")
      .replaceAll("`nba-v2`", "`nba-v1`")
      .replaceAll("source-policy.v2.json", "source-policy.v1.json");
    expect(normalizedV2Markdown).toBe(readPolicyFile(V1_MARKDOWN_POLICY_PATH));
  });

  it("binds the exact human-policy path and digest into canonical JSON", () => {
    const policy = parseCanonicalPolicy();
    expect(policy.humanPolicyDocument).toEqual({
      path: MARKDOWN_POLICY_PATH,
      sha256: EXPECTED_MARKDOWN_SHA256,
    });
    expect(sha256Hex(readPolicyFile(MARKDOWN_POLICY_PATH))).toBe(
      EXPECTED_MARKDOWN_SHA256,
    );
  });

  it("requires a new version and full verifier/review-set/decision/manifest cycle for change", () => {
    expect(parseCanonicalPolicy().versionChangeRules).toEqual({
      immutableForSourcePolicyVersion: true,
      policyChangeRequires: [
        "new-source-policy-version",
        "complete-verifier-cycle",
        "complete-root-audit-cycle",
        "complete-review-set-cycle",
        "complete-decision-cycle",
        "complete-manifest-cycle",
      ],
      sameVersionContentDriftAction: "reject",
    });
    const markdown = readPolicyFile(MARKDOWN_POLICY_PATH);
    expect(markdown).toMatch(/immutable for `nba-v2`/iu);
    expect(markdown).toMatch(
      /new source-policy version and a complete link-verifier, root-audit, candidate-set digest, named source-review decision, and manifest cycle/iu,
    );
  });

  it("maps the declared version one-to-one to one exact immutable SHA-256 pair", () => {
    expect(Object.keys(FROZEN_POLICY_BY_VERSION)).toEqual([
      "nba-v1",
      "nba-v2",
      "nba-v3",
      "nba-v4",
      "nba-v5",
    ]);
    const pairs = Object.values(FROZEN_POLICY_BY_VERSION).map(
      ({ jsonSha256, markdownSha256 }) => `${jsonSha256}:${markdownSha256}`,
    );
    expect(new Set(pairs).size).toBe(pairs.length);

    for (const [sourcePolicyVersion, frozen] of Object.entries(
      FROZEN_POLICY_BY_VERSION,
    )) {
      const jsonBytes = readPolicyFile(frozen.jsonPath);
      const markdownBytes = readPolicyFile(frozen.markdownPath);
      expect(sha256Hex(jsonBytes)).toBe(frozen.jsonSha256);
      expect(sha256Hex(markdownBytes)).toBe(frozen.markdownSha256);
      expect(verifyFrozenPolicyBytes(jsonBytes, markdownBytes)).toEqual({
        sourcePolicyVersion,
        jsonSha256: frozen.jsonSha256,
        markdownSha256: frozen.markdownSha256,
      });
    }
  });

  it("rejects canonical JSON or human-policy drift under the same version", () => {
    const jsonBytes = readPolicyFile(JSON_POLICY_PATH);
    const markdownBytes = readPolicyFile(MARKDOWN_POLICY_PATH);
    const policy = parseCanonicalPolicy(jsonBytes);

    expect(() =>
      verifyFrozenPolicyBytes(
        canonicalJson({ ...policy, cutoffDate: "2016-08-07" }),
        markdownBytes,
      ),
    ).toThrow(/same-version content drift for nba-v2/);
    expect(() =>
      verifyFrozenPolicyBytes(jsonBytes, `${markdownBytes}<!-- drift -->\n`),
    ).toThrow(/same-version content drift for nba-v2/);
    expect(() =>
      verifyFrozenPolicyBytes(`${jsonBytes}\n`, markdownBytes),
    ).toThrow(/not canonical JSON/);
  });

  it("rejects an unregistered replacement version until its complete cycle is frozen", () => {
    const jsonBytes = readPolicyFile(JSON_POLICY_PATH);
    const markdownBytes = readPolicyFile(MARKDOWN_POLICY_PATH);
    const policy = parseCanonicalPolicy(jsonBytes);
    expect(() =>
      verifyFrozenPolicyBytes(
        canonicalJson({ ...policy, sourcePolicyVersion: "nba-v6" }),
        markdownBytes,
      ),
    ).toThrow(/unregistered source-policy version nba-v6/);
  });
});

describe("NBA source-policy nba-v3 static-player-photo annex", () => {
  it("is canonical, immutable, and inherits every nba-v2 clinical/video rule unchanged", () => {
    const v2 = parseCanonicalPolicy(readPolicyFile(JSON_POLICY_PATH));
    const v3Bytes = readPolicyFile(V3_JSON_POLICY_PATH);
    const v3 = parseCanonicalPolicy(v3Bytes);
    const {
      clinicalVideoPolicyInheritance,
      playerStaticPhotoRules,
      ...v3WithoutAnnex
    } = v3;

    expect(v3Bytes.endsWith("\n")).toBe(false);
    expect(v3.sourcePolicyVersion).toBe("nba-v3");
    expect(clinicalVideoPolicyInheritance).toEqual({
      jsonPath: JSON_POLICY_PATH,
      jsonSha256: EXPECTED_JSON_SHA256,
      markdownPath: MARKDOWN_POLICY_PATH,
      markdownSha256: EXPECTED_MARKDOWN_SHA256,
      sourcePolicyVersion: "nba-v2",
    });
    expect({
      ...v3WithoutAnnex,
      humanPolicyDocument: v2.humanPolicyDocument,
      sourcePolicyVersion: "nba-v2",
      versionChangeRules: v2.versionChangeRules,
    }).toEqual(v2);
    expect(playerStaticPhotoRules).toBeDefined();
  });

  it("permits only exact free-license pairs and a local original Commons JPEG", () => {
    const v3 = parseCanonicalPolicy(readPolicyFile(V3_JSON_POLICY_PATH));
    const annex = asRecord(v3.playerStaticPhotoRules, "playerStaticPhotoRules");
    expect(annex.scopeId).toBe("decision-7-commons-player-photo-covers-only");
    expect(annex.allowedMimeTypes).toEqual(["image/jpeg"]);
    expect(annex.allowedSourceClassification).toBe(
      "wikimedia-commons-player-basketball-court-photo",
    );
    expect(annex.allowedLicenses).toEqual([
      {
        name: "CC BY 2.0",
        token: "cc-by-2.0",
        url: "https://creativecommons.org/licenses/by/2.0",
      },
      {
        name: "CC BY 3.0",
        token: "cc-by-3.0",
        url: "https://creativecommons.org/licenses/by/3.0",
      },
      {
        name: "CC BY 4.0",
        token: "cc-by-4.0",
        url: "https://creativecommons.org/licenses/by/4.0",
      },
      {
        name: "CC BY-SA 2.0",
        token: "cc-by-sa-2.0",
        url: "https://creativecommons.org/licenses/by-sa/2.0",
      },
      {
        name: "CC BY-SA 3.0",
        token: "cc-by-sa-3.0",
        url: "https://creativecommons.org/licenses/by-sa/3.0",
      },
      {
        name: "CC BY-SA 4.0",
        token: "cc-by-sa-4.0",
        url: "https://creativecommons.org/licenses/by-sa/4.0",
      },
      {
        name: "CC0 1.0",
        token: "cc0-1.0",
        url: "https://creativecommons.org/publicdomain/zero/1.0/",
      },
      {
        name: "Public Domain Mark 1.0",
        token: "public-domain-mark-1.0",
        url: "https://creativecommons.org/publicdomain/mark/1.0/",
      },
    ]);
    expect(annex.downloadRules).toEqual({
      descriptionHost: "commons.wikimedia.org",
      originalDownloadHost: "upload.wikimedia.org",
      originalPathMustExclude: "/thumb/",
      repositoryDirectory: "src/assets/players/",
      runtimeRemoteFetchAllowed: false,
      staticJpegDownloadAllowed: true,
    });
    expect(v3.mediaHandlingRules).toEqual(
      parseCanonicalPolicy(readPolicyFile(JSON_POLICY_PATH)).mediaHandlingRules,
    );
  });

  it("fails closed for every non-free or forbidden source class", () => {
    const annex = asRecord(
      parseCanonicalPolicy(readPolicyFile(V3_JSON_POLICY_PATH))
        .playerStaticPhotoRules,
    );
    expect(annex.prohibitedClassifications).toEqual([
      "all-rights-reserved",
      "cc-nc",
      "cc-nd",
      "fair-use",
      "footage-derived",
      "news-agency",
      "non-basketball-court",
      "official-headshot",
      "screenshot",
      "thumbnail",
      "unknown-license",
      "wrong-athlete",
    ]);
    expect(annex.failClosedFallback).toBe(
      "existing-governed-injury-theme-cover",
    );
    expect(annex.explicitNegativeFiles).toEqual([
      {
        filename: "2025_C.J._McCollum_(cropped).jpg",
        reason: "official-media-day-portrait",
      },
      {
        filename:
          "Anthony_Edwards_Argentina_v_Egypt_7_July_2026-069_(cropped).jpg",
        reason: "non-basketball-court-fifa-event-photo",
      },
      {
        filename: "Dwight_Powell.jpg",
        reason: "official-team-photo-shoot",
      },
    ]);
  });

  it("requires complete visible attribution, crop review, and scope-specific future cycles", () => {
    const policy = parseCanonicalPolicy(readPolicyFile(V3_JSON_POLICY_PATH));
    const annex = asRecord(policy.playerStaticPhotoRules);
    expect(annex.attributionRequirements).toEqual({
      alterationTextForCcBySaCrop: "改作自原作",
      commonsDescriptionLinkVisible: true,
      exactLicenseNameAndTermsLinkVisible: true,
      nonEventText: "球員球場資料照片；非本案例受傷當下影像",
      photographerVisible: true,
    });
    expect(annex.cropRules).toEqual({
      focalPositionRequired: true,
      presentationCropRatios: ["5:2", "16:9"],
      storedJpegModificationAllowed: false,
    });
    expect(policy.versionChangeRules).toEqual({
      clinicalVideoPolicyChangeRequires: [
        "new-source-policy-version",
        "complete-verifier-cycle",
        "complete-root-audit-cycle",
        "complete-review-set-cycle",
        "complete-decision-cycle",
        "complete-manifest-cycle",
      ],
      immutableForSourcePolicyVersion: true,
      playerStaticPhotoAnnexChangeRequires: [
        "new-source-policy-version",
        "complete-photo-license-provenance-verification",
        "renderer-review-set-refresh",
        "private-dist-manifest-refresh",
      ],
      sameVersionContentDriftAction: "reject",
    });
    expect(policy.humanPolicyDocument).toEqual({
      path: V3_MARKDOWN_POLICY_PATH,
      sha256: EXPECTED_V3_MARKDOWN_SHA256,
    });
    expect(readPolicyFile(V3_MARKDOWN_POLICY_PATH)).toContain(
      "球員球場資料照片；非本案例受傷當下影像",
    );
    expect(readPolicyFile(V3_MARKDOWN_POLICY_PATH)).toContain("改作自原作");
  });
});

describe("NBA source-policy nba-v4 Decision 11 attribution addendum", () => {
  it("is canonical, immutable, and changes only the inherited photo attribution controls", () => {
    const v3 = parseCanonicalPolicy(readPolicyFile(V3_JSON_POLICY_PATH));
    const v4Bytes = readPolicyFile(V4_JSON_POLICY_PATH);
    const v4 = parseCanonicalPolicy(v4Bytes);
    const inheritance = asRecord(v4.playerStaticPhotoPolicyInheritance);

    expect(v4Bytes.endsWith("\n")).toBe(false);
    expect(v4.sourcePolicyVersion).toBe("nba-v4");
    expect(inheritance).toEqual({
      jsonPath: V3_JSON_POLICY_PATH,
      jsonSha256: EXPECTED_V3_JSON_SHA256,
      markdownPath: V3_MARKDOWN_POLICY_PATH,
      markdownSha256: EXPECTED_V3_MARKDOWN_SHA256,
      sourcePolicyVersion: "nba-v3",
    });

    const {
      humanPolicyDocument: _v4Human,
      playerStaticPhotoPolicyInheritance: _v4Inheritance,
      playerStaticPhotoRules: _v4PhotoRules,
      sourcePolicyVersion: _v4Version,
      ...v4Unchanged
    } = v4;
    const {
      humanPolicyDocument: _v3Human,
      playerStaticPhotoRules: _v3PhotoRules,
      sourcePolicyVersion: _v3Version,
      ...v3Unchanged
    } = v3;
    expect(v4Unchanged).toEqual(v3Unchanged);

    const v3Photo = asRecord(v3.playerStaticPhotoRules);
    const v4Photo = asRecord(v4.playerStaticPhotoRules);
    const {
      attributionRequirements: _v4Attribution,
      requiredProvenanceFields: _v4Fields,
      ...v4PhotoUnchanged
    } = v4Photo;
    const {
      attributionRequirements: _v3Attribution,
      requiredProvenanceFields: _v3Fields,
      ...v3PhotoUnchanged
    } = v3Photo;
    expect(v4PhotoUnchanged).toEqual(v3PhotoUnchanged);
  });

  it("requires license buckets, revision permalinks, exact notice states, and compatible adapter licenses", () => {
    const policy = parseCanonicalPolicy(readPolicyFile(V4_JSON_POLICY_PATH));
    const annex = asRecord(policy.playerStaticPhotoRules);
    expect(annex.attributionRequirements).toEqual({
      adapterLicenseLimitedToCropContribution: true,
      adapterLicenseSameVersionRequiredForCcBySaCrop: true,
      commonsRevisionPermalinkVisible: true,
      copyrightNoticeRetentionStateRequired: true,
      disclaimerNoticeRetentionStateRequired: true,
      exactLicenseNameAndTermsLinkVisible: true,
      licenseBuckets: ["cc-by", "cc-by-sa", "cc0"],
      nonEventText: "球員球場資料照片；非本案例受傷當下影像",
      otherPerFileNoticeRetentionStateRequired: true,
      photographerVisible: true,
      suppliedCopyrightNoticeVisible: true,
      suppliedOtherPerFileNoticeVisible: true,
      suppliedTitleVisibleForLicenseVersion: "2.0",
      titleSupplyStateRequired: true,
      unscopedDocumentLicenseRelationForbidden: true,
    });
    expect(annex.requiredProvenanceFields).toEqual(
      [
        ...(asRecord(
          parseCanonicalPolicy(readPolicyFile(V3_JSON_POLICY_PATH))
            .playerStaticPhotoRules,
        ).requiredProvenanceFields as string[]),
        "adapter-license",
        "commons-revision-id",
        "commons-revision-permalink",
        "commons-revision-timestamp",
        "copyright-notice-state",
        "disclaimer-notice-state",
        "license-bucket",
        "other-per-file-notice-state",
        "source-alteration-state",
        "title-supply-state",
        "work-title",
      ].sort(),
    );
    expect(policy.humanPolicyDocument).toEqual({
      path: V4_MARKDOWN_POLICY_PATH,
      sha256: EXPECTED_V4_MARKDOWN_SHA256,
    });
    const markdown = readPolicyFile(V4_MARKDOWN_POLICY_PATH);
    expect(markdown).toContain("Adapter's License");
    expect(markdown).toContain("does not license the surrounding page");
    expect(markdown).toContain("`not-supplied` with `null`");
    expect(markdown).toContain('unscoped `rel="license"`');
  });
});

describe("NBA source-policy nba-v5 Decision 13 named-cover addendum", () => {
  it("is canonical, immutable, and binds the exact immutable nba-v4 pair", () => {
    const bytes = readPolicyFile(V5_JSON_POLICY_PATH);
    const policy = parseCanonicalPolicy(bytes);

    expect(bytes.endsWith("\n")).toBe(false);
    expect(policy.sourcePolicyVersion).toBe("nba-v5");
    expect(policy.playerStaticPhotoPolicyInheritance).toEqual({
      jsonPath: V4_JSON_POLICY_PATH,
      jsonSha256: EXPECTED_V4_JSON_SHA256,
      markdownPath: V4_MARKDOWN_POLICY_PATH,
      markdownSha256: EXPECTED_V4_MARKDOWN_SHA256,
      sourcePolicyVersion: "nba-v4",
    });
    expect(policy.humanPolicyDocument).toEqual({
      path: V5_MARKDOWN_POLICY_PATH,
      sha256: EXPECTED_V5_MARKDOWN_SHA256,
    });
    expect(
      verifyFrozenPolicyBytes(bytes, readPolicyFile(V5_MARKDOWN_POLICY_PATH)),
    ).toEqual({
      sourcePolicyVersion: "nba-v5",
      jsonSha256: EXPECTED_V5_JSON_SHA256,
      markdownSha256: EXPECTED_V5_MARKDOWN_SHA256,
    });
  });

  it("has one fail-closed photo-rule field set and does not retain the superseded singular classification", () => {
    const v4 = parseCanonicalPolicy(readPolicyFile(V4_JSON_POLICY_PATH));
    const v5 = parseCanonicalPolicy(readPolicyFile(V5_JSON_POLICY_PATH));
    const v4Annex = asRecord(v4.playerStaticPhotoRules);
    const v5Annex = asRecord(v5.playerStaticPhotoRules);

    expect(Object.keys(v5Annex).sort()).toEqual(
      [
        "acceptedNonEventOccasions",
        "allowedLicenses",
        "allowedMimeTypes",
        "allowedSourceClassifications",
        "attributionRequirements",
        "compositeUseRules",
        "cropRules",
        "downloadRules",
        "explicitNegativeFiles",
        "failClosedFallback",
        "ineligibleOccasions",
        "nonClearanceInterpretation",
        "photographerProvenanceRules",
        "prohibitedClassifications",
        "requiredProvenanceFields",
        "scopeId",
        "svgFallbackRules",
      ].sort(),
    );
    expect(v5Annex).not.toHaveProperty("allowedSourceClassification");

    const {
      allowedLicenses: _v5Licenses,
      allowedMimeTypes: _v5Mimes,
      allowedSourceClassifications: _v5Sources,
      acceptedNonEventOccasions: _v5Occasions,
      compositeUseRules: _v5Composite,
      downloadRules: _v5Downloads,
      explicitNegativeFiles: _v5NegativeFiles,
      failClosedFallback: _v5Fallback,
      ineligibleOccasions: _v5Ineligible,
      nonClearanceInterpretation: _v5NonClearance,
      photographerProvenanceRules: _v5Photographer,
      prohibitedClassifications: _v5Prohibited,
      requiredProvenanceFields: _v5Fields,
      scopeId: _v5Scope,
      svgFallbackRules: _v5Svg,
      ...v5Compatible
    } = v5Annex;
    const {
      allowedLicenses: _v4Licenses,
      allowedMimeTypes: _v4Mimes,
      allowedSourceClassification: _v4Source,
      downloadRules: _v4Downloads,
      explicitNegativeFiles: _v4NegativeFiles,
      failClosedFallback: _v4Fallback,
      prohibitedClassifications: _v4Prohibited,
      requiredProvenanceFields: _v4Fields,
      scopeId: _v4Scope,
      ...v4Compatible
    } = v4Annex;
    expect(v5Compatible).toEqual(v4Compatible);
  });

  it("separates accepted occasions from photographer risk and rejects unresolved provenance", () => {
    const annex = asRecord(
      parseCanonicalPolicy(readPolicyFile(V5_JSON_POLICY_PATH))
        .playerStaticPhotoRules,
    );
    expect(annex.acceptedNonEventOccasions).toEqual([
      "award-ceremony",
      "documented-preseason-tune-up-warm-up-outside-live-competition",
      "press-conference",
      "public-event-or-fan-interaction",
      "verified-media-day",
    ]);
    expect(annex.ineligibleOccasions).toEqual([
      "all-star-game-action",
      "ambiguous-credentialed-court-context",
      "international-competition-action",
      "live-preseason-competition",
      "postseason-action",
      "regular-season-action",
      "regular-season-pregame-or-warm-up",
    ]);
    expect(annex.photographerProvenanceRules).toEqual({
      acceptedCurrentPhotoCategories: [
        "credentialed-media-residual-risk",
        "independent-public-event-low-risk",
      ],
      categories: [
        "credentialed-media-residual-risk",
        "independent-public-event-low-risk",
        "unresolved-reject",
      ],
      commonsOrFlickrUploaderNameProvesAuthority: false,
      occasionAndPhotographerRiskRecordedSeparately: true,
      unresolvedRejectEligibleAsCurrentPhoto: false,
      verifiedLicenseChainRequired: true,
    });
    expect(annex.nonClearanceInterpretation).toEqual({
      occasionClassificationIsRightsClearance: false,
      photographerRiskClassificationIsRightsClearance: false,
      publicReleaseApprovalCreated: false,
    });
  });

  it("keeps BY, BY-SA, and CC0 exact while excluding Public Domain Mark and BY-SA composites", () => {
    const annex = asRecord(
      parseCanonicalPolicy(readPolicyFile(V5_JSON_POLICY_PATH))
        .playerStaticPhotoRules,
    );
    const licenseTokens = asRecordArray(
      annex.allowedLicenses,
      "allowedLicenses",
    ).map((license) => license.token);
    expect(licenseTokens).toEqual([
      "cc-by-2.0",
      "cc-by-3.0",
      "cc-by-4.0",
      "cc-by-sa-2.0",
      "cc-by-sa-3.0",
      "cc-by-sa-4.0",
      "cc0-1.0",
    ]);
    expect(licenseTokens).not.toContain("public-domain-mark-1.0");
    expect(annex.allowedMimeTypes).toEqual(["image/jpeg", "image/png"]);
    expect(annex.downloadRules).toMatchObject({
      acceptedLocalMimeTypes: ["image/jpeg", "image/png"],
      runtimeRemoteFetchAllowed: false,
      staticOriginalDownloadAllowed: true,
    });
    expect(annex.downloadRules).not.toHaveProperty("staticJpegDownloadAllowed");
    expect(annex.compositeUseRules).toMatchObject({
      ccBySaForbiddenAsSiteComposedInput: true,
      ordinaryHtmlCssPlacementIsNotSiteComposition: true,
      ordinaryResponsiveRenditionIsNotSiteComposition: true,
    });
    expect(annex.failClosedFallback).toBe("original-svg-fallback");
    expect(annex.explicitNegativeFiles).toEqual([
      {
        filename: "2025_C.J._McCollum_(cropped).jpg",
        reason: "official-media-day-portrait",
      },
      {
        filename: "Dwight_Powell.jpg",
        reason: "official-team-photo-shoot",
      },
    ]);
  });

  it("preserves the v4 attribution semantics and requires local original SVG provenance", () => {
    const v4Annex = asRecord(
      parseCanonicalPolicy(readPolicyFile(V4_JSON_POLICY_PATH))
        .playerStaticPhotoRules,
    );
    const v5Annex = asRecord(
      parseCanonicalPolicy(readPolicyFile(V5_JSON_POLICY_PATH))
        .playerStaticPhotoRules,
    );
    expect(v5Annex.attributionRequirements).toEqual(
      v4Annex.attributionRequirements,
    );
    expect(v5Annex.svgFallbackRules).toEqual({
      athleteLikenessForbidden: true,
      copiedTeamOrLeagueMarksForbidden: true,
      creativeCommonsLicenseForbidden: true,
      embeddedOrLinkedRasterForbidden: true,
      externalFetchForbidden: true,
      mimeType: "image/svg+xml",
      provenanceRequired: true,
      scriptOrForeignObjectForbidden: true,
      thirdPartyArtworkOrFontForbidden: true,
    });

    const markdown = readPolicyFile(V5_MARKDOWN_POLICY_PATH);
    expect(markdown).toContain("Low risk is not public-use clearance");
    expect(markdown).toContain("official team or league headshot");
    expect(markdown).toContain("must never be inputs to site-composed OG");
    expect(markdown).toContain("without inventing a Creative Commons license");
  });
});
