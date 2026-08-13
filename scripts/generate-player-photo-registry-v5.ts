/** Generates the append-only Decision 13 current-cover registry correction. */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import {
  PLAYER_PHOTO_REGISTRY_V4_PATH,
  PLAYER_PHOTO_REGISTRY_V4_SHA256,
  type PlayerPhotoRegistryV4,
} from "../src/lib/contracts/player-photo-registry-v4";
import {
  PLAYER_PHOTO_POLICY_V6_JSON_PATH,
  PLAYER_PHOTO_POLICY_V6_JSON_SHA256,
  PLAYER_PHOTO_POLICY_V6_MARKDOWN_PATH,
  PLAYER_PHOTO_POLICY_V6_MARKDOWN_SHA256,
  PLAYER_PHOTO_REGISTRY_V5_PATH,
  PLAYER_PHOTO_REGISTRY_V5_PREDECESSOR,
  PLAYER_PHOTO_REGISTRY_V5_SCOPE_ID,
  type PlayerPhotoRegistryV5,
} from "../src/lib/contracts/player-photo-registry-v5";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const predecessorBytes = readFileSync(
  resolve(root, PLAYER_PHOTO_REGISTRY_V4_PATH),
  "utf8",
);
if (sha256Hex(predecessorBytes) !== PLAYER_PHOTO_REGISTRY_V4_SHA256) {
  throw new Error("Frozen player-photo registry v4 bytes changed");
}
const predecessor = parseStrictJson(predecessorBytes) as PlayerPhotoRegistryV4;

const registry: PlayerPhotoRegistryV5 = {
  predecessorRegistryBinding: { ...PLAYER_PHOTO_REGISTRY_V5_PREDECESSOR },
  schemaVersion: 5,
  scopeId: PLAYER_PHOTO_REGISTRY_V5_SCOPE_ID,
  selections: predecessor.selections,
  sourcePolicyBinding: {
    jsonPath: PLAYER_PHOTO_POLICY_V6_JSON_PATH,
    jsonSha256: PLAYER_PHOTO_POLICY_V6_JSON_SHA256,
    markdownPath: PLAYER_PHOTO_POLICY_V6_MARKDOWN_PATH,
    markdownSha256: PLAYER_PHOTO_POLICY_V6_MARKDOWN_SHA256,
    sourcePolicyVersion: "nba-v6",
  },
};
const outputBytes = canonicalJson(registry);
if (process.argv.includes("--check")) {
  if (
    readFileSync(resolve(root, PLAYER_PHOTO_REGISTRY_V5_PATH), "utf8") !==
    outputBytes
  ) {
    throw new Error("Generated player-photo registry v5 bytes are stale");
  }
  console.log(`player-photo registry v5 OK — ${sha256Hex(outputBytes)}`);
} else if (process.argv.includes("--stdout")) {
  process.stdout.write(outputBytes);
} else {
  writeFileSync(resolve(root, PLAYER_PHOTO_REGISTRY_V5_PATH), outputBytes);
}
