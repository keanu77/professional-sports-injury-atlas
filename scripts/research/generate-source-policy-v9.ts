/** Re-derives the immutable Decision 16 governed-rendition source policy. */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const parentJsonPath = "research/source-policy/source-policy.v8.json";
const parentMarkdownPath = "research/source-policy/nba.v8.md";
const markdownPath = "research/source-policy/nba.v9.md";
const outputPath = "research/source-policy/source-policy.v9.json";

const expectedParentJsonSha256 =
  "30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e";
const expectedParentMarkdownSha256 =
  "20a9209bd523604efe3251f6ef159e6432fa9280951ea16d630ee02cc347557d";
const expectedMarkdownSha256 =
  "03f6a61ee6ef958cae2ae9b918d7b6a115ff0d346f63202efce8780744fbadf2";
const expectedOutputSha256 =
  "0ac3fecc04e12b88134ce97d11fbe1c742af1f21664a9c80eaf0d76ab7cfcfba";

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
  "nba-v8 JSON",
);
const parentMarkdownBytes = readFrozen(
  parentMarkdownPath,
  expectedParentMarkdownSha256,
  "nba-v8 Markdown",
);
const markdownBytes = readFrozen(
  markdownPath,
  expectedMarkdownSha256,
  "nba-v9 Markdown",
);

const parent = asRecord(parseStrictJson(parentJsonBytes), "nba-v8 policy");
if (canonicalJson(parent) !== parentJsonBytes) {
  throw new Error("Frozen nba-v8 JSON is not canonical JSON");
}
const parentPhotoRules = asRecord(
  parent.playerStaticPhotoRules,
  "nba-v8 playerStaticPhotoRules",
);

const governedLocalRenditionRules = {
  attributionAndChangeRules: {
    adapterLicenseForCcByForbidden: true,
    exactCopyrightNotice: "Erik Drost",
    exactCreditedName: "Erik Drost",
    exactLicense: {
      name: "CC BY 2.0",
      token: "cc-by-2.0",
      url: "https://creativecommons.org/licenses/by/2.0",
    },
    exactWorkTitle: "Trae Young",
    fixedSourceLinkVisible: true,
    renditionChangeDisclosureVisible: true,
    upstreamAndRenditionAlterationsSeparatelyVisible: true,
  },
  createsExecutionAuthorization: false,
  factSeparationRules: {
    localRenditionFactsMayPopulateUpstreamFields: false,
    sourceOriginalAndLocalRenditionRecordsRequired: true,
    sourceOriginalFactsMayBeRewrittenAsRenditionFacts: false,
    sourceOriginalRetainedByteIdentical: true,
  },
  generalStoredJpegModificationAllowed: false,
  localRendition: {
    exactHeight: 2080,
    exactLongestEdge: 2400,
    exactMimeType: "image/jpeg",
    exactPath: "src/assets/players/decision-16/trae-young.jpg",
    exactWidth: 2400,
    maximumByteLength: 5000000,
  },
  requiredLocalRenditionFacts: [
    "aspect-ratio-and-no-crop-state",
    "byte-length",
    "change-disclosure",
    "color-treatment",
    "creation-actor",
    "creation-date",
    "decoded-dimensions",
    "metadata-treatment",
    "mime-type",
    "orientation-treatment",
    "path",
    "quality-ladder-and-selection",
    "sha256",
    "source-path-and-sha256-binding",
    "transformation-options",
    "transformation-tool-and-version",
  ],
  requiredSourceOriginalFacts: [
    "byte-length",
    "commons-description-url",
    "commons-original-file-url",
    "commons-revision-id",
    "commons-revision-permalink",
    "commons-revision-timestamp",
    "decoded-dimensions",
    "mediawiki-sha1",
    "mime-type",
    "repository-path",
    "repository-sha256",
    "upstream-alteration-disclosure",
  ],
  scope: {
    athleteName: "Trae Young",
    caseIds: ["CASE-NBAANKLE-2021-001"],
    scopeId: "decision-16-trae-young-rendition-only",
  },
  sourceOriginal: {
    byteLength: 39619306,
    commonsDescriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Trae_Young_(2022_All-Star_Weekend)_(cropped).jpg",
    commonsOriginalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/4/42/Trae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg",
    commonsRevisionId: 1148485505,
    commonsRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ATrae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg&oldid=1148485505",
    commonsRevisionTimestamp: "2026-01-16T19:13:29Z",
    height: 5504,
    mediaWikiSha1: "193bb8a75e73f878359d136f0769205a4a8693ba",
    mimeType: "image/jpeg",
    repositoryPath: "src/assets/players/decision-15/trae-young.jpg",
    repositorySha256:
      "b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0",
    upstreamAlterationDisclosure:
      "Commons extraction and CropTool derivative; unmodified local original with site CSS presentation crop.",
    width: 6351,
  },
  transformationRules: {
    cropAllowed: false,
    deterministicOptionsRequired: true,
    enlargeAllowed: false,
    fullFrameRequired: true,
    highestPassingQualityRequired: true,
    integerRoundingOfAspectRatioAllowed: true,
    metadataColorOrientationInventoryRequired: true,
    qualityLadderRequired: true,
    sourceBytesBindingRequired: true,
  },
} as const;

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
    sourcePolicyVersion: "nba-v8",
  },
  playerStaticPhotoRules: {
    ...parentPhotoRules,
    governedLocalRenditionRules,
  },
  sourcePolicyVersion: "nba-v9",
};

const outputBytes = canonicalJson(policy);
const outputSha256 = sha256Hex(outputBytes);
if (outputSha256 !== expectedOutputSha256) {
  throw new Error(
    "Derived nba-v9 source-policy bytes do not match the frozen digest",
  );
}

if (process.argv.includes("--check")) {
  if (readFileSync(resolve(root, outputPath), "utf8") !== outputBytes) {
    throw new Error("Generated nba-v9 source-policy bytes are stale");
  }
  console.log(`nba-v9 source policy OK — ${outputSha256}`);
} else if (process.argv.includes("--stdout")) {
  process.stdout.write(outputBytes);
} else {
  writeFileSync(resolve(root, outputPath), outputBytes, "utf8");
  console.log(`nba-v9 source policy generated — ${outputSha256}`);
}
