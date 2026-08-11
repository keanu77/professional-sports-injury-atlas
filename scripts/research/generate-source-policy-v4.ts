/**
 * Generates the immutable Decision 11 player-photo attribution policy while
 * preserving every nba-v3 rule outside the bounded attribution annex change.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const parentJsonPath = "research/source-policy/source-policy.v3.json";
const parentMarkdownPath = "research/source-policy/nba.v3.md";
const markdownPath = "research/source-policy/nba.v4.md";
const outputPath = "research/source-policy/source-policy.v4.json";

const parentJsonBytes = readFileSync(resolve(root, parentJsonPath), "utf8");
const parentMarkdownBytes = readFileSync(
  resolve(root, parentMarkdownPath),
  "utf8",
);
const markdownBytes = readFileSync(resolve(root, markdownPath), "utf8");
const parent = parseStrictJson(parentJsonBytes) as Record<string, unknown>;
const parentAnnex = parent.playerStaticPhotoRules as Record<string, unknown>;

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
    sourcePolicyVersion: "nba-v3",
  },
  playerStaticPhotoRules: {
    ...parentAnnex,
    attributionRequirements: {
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
    },
    requiredProvenanceFields: [
      ...((parentAnnex.requiredProvenanceFields as string[]) ?? []),
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
  },
  sourcePolicyVersion: "nba-v4",
};

writeFileSync(resolve(root, outputPath), canonicalJson(policy));
