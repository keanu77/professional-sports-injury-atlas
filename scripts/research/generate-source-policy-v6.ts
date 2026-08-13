/** Generates the append-only Decision 13 photo-policy consistency correction. */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const parentJsonPath = "research/source-policy/source-policy.v5.json";
const parentMarkdownPath = "research/source-policy/nba.v5.md";
const markdownPath = "research/source-policy/nba.v6.md";
const outputPath = "research/source-policy/source-policy.v6.json";
const expectedParentJsonSha256 =
  "5f38066ce0ef0c10f0494856f90114dc403c068986b4c323cbb2ef3ebbda56ac";
const expectedParentMarkdownSha256 =
  "a59111d915caeb7f1e8f730492e826be63ff95fb5b1feeb1576eeb75a95e6aae";

const parentJsonBytes = readFileSync(resolve(root, parentJsonPath), "utf8");
const parentMarkdownBytes = readFileSync(
  resolve(root, parentMarkdownPath),
  "utf8",
);
if (sha256Hex(parentJsonBytes) !== expectedParentJsonSha256) {
  throw new Error("Frozen nba-v5 JSON bytes changed");
}
if (sha256Hex(parentMarkdownBytes) !== expectedParentMarkdownSha256) {
  throw new Error("Frozen nba-v5 Markdown bytes changed");
}

const markdownBytes = readFileSync(resolve(root, markdownPath), "utf8");
const parent = parseStrictJson(parentJsonBytes) as Record<string, unknown>;
const parentAnnex = parent.playerStaticPhotoRules as Record<string, unknown>;
const parentAttribution = parentAnnex.attributionRequirements as Record<
  string,
  unknown
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
    sourcePolicyVersion: "nba-v5",
  },
  playerStaticPhotoRules: {
    ...parentAnnex,
    attributionRequirements: {
      ...parentAttribution,
      nonEventText: "非賽事場合資料照片；非本案例受傷當下影像",
    },
    explicitNegativeFiles: (
      parentAnnex.explicitNegativeFiles as Array<Record<string, unknown>>
    ).filter((row) => row.filename !== "2025_C.J._McCollum_(cropped).jpg"),
    prohibitedClassifications: (
      parentAnnex.prohibitedClassifications as string[]
    ).filter((token) => token !== "non-basketball-court"),
  },
  sourcePolicyVersion: "nba-v6",
};

const outputBytes = canonicalJson(policy);
if (process.argv.includes("--check")) {
  if (readFileSync(resolve(root, outputPath), "utf8") !== outputBytes) {
    throw new Error("Generated nba-v6 source-policy bytes are stale");
  }
  console.log(`nba-v6 source policy OK — ${sha256Hex(outputBytes)}`);
} else if (process.argv.includes("--stdout")) {
  process.stdout.write(outputBytes);
} else {
  writeFileSync(resolve(root, outputPath), outputBytes, "utf8");
}
