/** Generates the append-only Decision 13 named-cover source policy. */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const parentJsonPath = "research/source-policy/source-policy.v4.json";
const parentMarkdownPath = "research/source-policy/nba.v4.md";
const markdownPath = "research/source-policy/nba.v5.md";
const outputPath = "research/source-policy/source-policy.v5.json";
const expectedParentJsonSha256 =
  "3320fe2051fc091aa055d5cdd8bcdacf24073c3964cac3d1a982666a2aafbf68";
const expectedParentMarkdownSha256 =
  "929ac5f125db222d8eb6e98a3a52b1778ebd28c743884c945ab917619ebd5994";

const parentJsonBytes = readFileSync(resolve(root, parentJsonPath), "utf8");
const parentMarkdownBytes = readFileSync(
  resolve(root, parentMarkdownPath),
  "utf8",
);
if (sha256Hex(parentJsonBytes) !== expectedParentJsonSha256) {
  throw new Error("Frozen nba-v4 JSON bytes changed");
}
if (sha256Hex(parentMarkdownBytes) !== expectedParentMarkdownSha256) {
  throw new Error("Frozen nba-v4 Markdown bytes changed");
}

const markdownBytes = readFileSync(resolve(root, markdownPath), "utf8");
const parent = parseStrictJson(parentJsonBytes) as Record<string, unknown>;
const parentAnnex = parent.playerStaticPhotoRules as Record<string, unknown>;
const {
  allowedSourceClassification: _legacyAllowedSourceClassification,
  ...compatibleParentAnnex
} = parentAnnex;
const parentDownloadRules = parentAnnex.downloadRules as Record<
  string,
  unknown
>;
const {
  staticJpegDownloadAllowed: _legacyStaticJpegDownloadAllowed,
  ...compatibleParentDownloadRules
} = parentDownloadRules;
const parentLicenses = parentAnnex.allowedLicenses as Array<
  Record<string, unknown>
>;

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
    sourcePolicyVersion: "nba-v4",
  },
  playerStaticPhotoRules: {
    ...compatibleParentAnnex,
    acceptedNonEventOccasions: [
      "award-ceremony",
      "documented-preseason-tune-up-warm-up-outside-live-competition",
      "press-conference",
      "public-event-or-fan-interaction",
      "verified-media-day",
    ],
    allowedLicenses: parentLicenses.filter(
      (license) => license.token !== "public-domain-mark-1.0",
    ),
    allowedMimeTypes: ["image/jpeg", "image/png"],
    allowedSourceClassifications: [
      "original-site-owned-svg-fallback",
      "wikimedia-commons-player-non-event-photo",
    ],
    compositeUseRules: {
      ccByAndCc0RequireSeparateEligibilityAndCompleteObligations: true,
      ccBySaForbiddenAsSiteComposedInput: true,
      forbiddenSiteComposedOutputs: [
        "case-card",
        "infographic",
        "og-image",
        "social-image",
      ],
      ordinaryHtmlCssPlacementIsNotSiteComposition: true,
      ordinaryResponsiveRenditionIsNotSiteComposition: true,
    },
    downloadRules: {
      ...compatibleParentDownloadRules,
      acceptedLocalMimeTypes: ["image/jpeg", "image/png"],
      runtimeRemoteFetchAllowed: false,
      staticOriginalDownloadAllowed: true,
    },
    explicitNegativeFiles: (
      parentAnnex.explicitNegativeFiles as Array<Record<string, unknown>>
    ).filter(
      (row) =>
        row.filename !==
        "Anthony_Edwards_Argentina_v_Egypt_7_July_2026-069_(cropped).jpg",
    ),
    failClosedFallback: "original-svg-fallback",
    ineligibleOccasions: [
      "all-star-game-action",
      "ambiguous-credentialed-court-context",
      "international-competition-action",
      "live-preseason-competition",
      "postseason-action",
      "regular-season-action",
      "regular-season-pregame-or-warm-up",
    ],
    nonClearanceInterpretation: {
      occasionClassificationIsRightsClearance: false,
      photographerRiskClassificationIsRightsClearance: false,
      publicReleaseApprovalCreated: false,
    },
    photographerProvenanceRules: {
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
    },
    prohibitedClassifications: [
      ...new Set([
        ...((parentAnnex.prohibitedClassifications as string[]) ?? []),
        "ambiguous-credentialed-court-context",
        "commercial-agency",
        "official-team-or-league-headshot",
        "unresolved-provenance",
      ]),
    ].sort(),
    requiredProvenanceFields: [
      ...new Set([
        ...((parentAnnex.requiredProvenanceFields as string[]) ?? []),
        "current-cover-status",
        "exact-athlete-case-mapping",
        "fixed-commons-revision",
        "occasion-category",
        "occasion-evidence",
        "original-svg-fallback-provenance",
        "photographer-identity",
        "photographer-risk-category",
        "photographer-risk-evidence",
        "supersession-reason",
        "uploader-identity",
        "upstream-original-url-state",
      ]),
    ].sort(),
    scopeId: "decision-13-named-covers-and-notice-consolidation-only",
    svgFallbackRules: {
      athleteLikenessForbidden: true,
      copiedTeamOrLeagueMarksForbidden: true,
      creativeCommonsLicenseForbidden: true,
      embeddedOrLinkedRasterForbidden: true,
      externalFetchForbidden: true,
      mimeType: "image/svg+xml",
      provenanceRequired: true,
      scriptOrForeignObjectForbidden: true,
      thirdPartyArtworkOrFontForbidden: true,
    },
  },
  sourcePolicyVersion: "nba-v5",
};

const outputBytes = canonicalJson(policy);
if (process.argv.includes("--check")) {
  if (readFileSync(resolve(root, outputPath), "utf8") !== outputBytes) {
    throw new Error("Generated nba-v5 source-policy bytes are stale");
  }
  console.log(`nba-v5 source policy OK — ${sha256Hex(outputBytes)}`);
} else if (process.argv.includes("--stdout")) {
  process.stdout.write(outputBytes);
} else {
  writeFileSync(resolve(root, outputPath), outputBytes);
}
