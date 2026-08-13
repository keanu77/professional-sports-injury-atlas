/** Generate the authorized-start Decision 13 cover input/output inventory. */

import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import type { PlayerPhotoRegistryV3 } from "../src/lib/contracts/player-photo";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const registryPath = "src/assets/players/player-photo-registry.v3.json";
const outputPath =
  "docs/reviews/evidence/decision-13/p0/current-cover-baseline.v1.json";
const authorizedStartCommit = "36a80b3cd41c837d68554c71085b385de1e38c40";
const expectedRegistrySha256 =
  "d91e97aa34e347375dd5ca14cf961208ae4b2c43cc8a90a01bea49f1172a3c05";

const registryBytes = readFileSync(resolve(root, registryPath));
if (sha256Hex(registryBytes) !== expectedRegistrySha256) {
  throw new Error("Decision 13 authorized-start registry bytes changed");
}
const registry = parseStrictJson(
  registryBytes.toString("utf8"),
) as PlayerPhotoRegistryV3;
if (registry.assets.length !== 21 || registry.fallbacks.length !== 0) {
  throw new Error(
    "Decision 13 authorized-start registry must contain 21 photos",
  );
}

const distAssetDirectory = resolve(root, "dist/_astro");
const distFilenames = readdirSync(distAssetDirectory).sort();
const sourceAggregateInput: string[] = [];
const outputAggregateInput: string[] = [];

const covers = registry.assets.map((asset) => {
  const sourceBytes = readFileSync(resolve(root, asset.localFile.path));
  const sourceSha256 = sha256Hex(sourceBytes);
  if (sourceSha256 !== asset.localFile.sha256) {
    throw new Error(`Registry/local source mismatch: ${asset.athleteName}`);
  }
  sourceAggregateInput.push(`${sourceSha256}  ${asset.localFile.path}\n`);

  const stem = basename(asset.localFile.path, extname(asset.localFile.path));
  const outputPrefix = `${stem}.`;
  const outputs = distFilenames
    .filter((filename) => filename.startsWith(outputPrefix))
    .map((filename) => {
      const path = `dist/_astro/${filename}`;
      const bytes = readFileSync(resolve(root, path));
      const sha256 = sha256Hex(bytes);
      outputAggregateInput.push(`${sha256}  ${path}\n`);
      return {
        byteLength: statSync(resolve(root, path)).size,
        format: extname(filename).slice(1),
        path,
        sha256,
      };
    });
  if (outputs.length === 0) {
    throw new Error(
      `No authorized-start build output for ${asset.athleteName}`,
    );
  }

  return {
    athleteName: asset.athleteName,
    caseIds: asset.caseIds,
    localInput: {
      byteLength: asset.localFile.byteLength,
      height: asset.localFile.height,
      mimeType: asset.localFile.mimeType,
      path: asset.localFile.path,
      sha256: sourceSha256,
      width: asset.localFile.width,
    },
    outputCount: outputs.length,
    outputs,
    sourceRiskCategory: asset.sourceRiskClassification.category,
  };
});

const gameActionCount = covers.filter(
  (cover) => cover.sourceRiskCategory === "game-action-high-risk",
).length;
const nonEventCount = covers.filter(
  (cover) => cover.sourceRiskCategory === "non-event-low-risk",
).length;
const outputCount = covers.reduce((sum, cover) => sum + cover.outputCount, 0);
if (gameActionCount !== 19 || nonEventCount !== 2 || outputCount !== 669) {
  throw new Error(
    `Unexpected authorized-start partition/output count: ${gameActionCount}/19 high, ${nonEventCount}/2 low, ${outputCount}/669 outputs`,
  );
}

const manifest = {
  authorizedStartCommit,
  coverCount: covers.length,
  covers,
  generatedFromReviewBuild: true,
  outputAggregateSha256: sha256Hex(outputAggregateInput.sort().join("")),
  outputCount,
  registry: {
    path: registryPath,
    sha256: expectedRegistrySha256,
  },
  riskPartition: {
    gameActionHighRisk: gameActionCount,
    nonEventLowRisk: nonEventCount,
  },
  schemaVersion: 1,
  sourceAggregateSha256: sha256Hex(sourceAggregateInput.sort().join("")),
};

mkdirSync(dirname(resolve(root, outputPath)), { recursive: true });
writeFileSync(resolve(root, outputPath), canonicalJson(manifest));
console.log(
  `Decision 13 cover baseline generated: ${covers.length} inputs, ${outputCount} outputs (${manifest.outputAggregateSha256})`,
);
