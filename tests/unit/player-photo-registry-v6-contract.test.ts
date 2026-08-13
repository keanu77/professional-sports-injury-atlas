import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import {
  PLAYER_PHOTO_POLICY_V5_JSON_PATH,
  PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH,
  PLAYER_PHOTO_REGISTRY_PREDECESSORS,
} from "../../src/lib/contracts/player-photo-registry-v4";
import { PLAYER_PHOTO_REGISTRY_V5_PATH } from "../../src/lib/contracts/player-photo-registry-v5";
import {
  PLAYER_PHOTO_POLICY_V7_JSON_PATH,
  PLAYER_PHOTO_POLICY_V7_MARKDOWN_PATH,
  PLAYER_PHOTO_REGISTRY_V6_PATH,
  PLAYER_PHOTO_REGISTRY_V6_SHA256,
  validatePlayerPhotoRegistryV6,
  type PlayerPhotoRegistryV6,
  type PlayerPhotoRegistryV6ValidationInput,
} from "../../src/lib/contracts/player-photo-registry-v6";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function input(): PlayerPhotoRegistryV6ValidationInput {
  const expectedAthleteCases = new Map<string, string[]>();
  for (const filename of readdirSync(join(ROOT, "src/content/cases")).sort()) {
    if (!filename.endsWith(".json")) continue;
    const record = JSON.parse(
      readFileSync(join(ROOT, "src/content/cases", filename), "utf8"),
    ) as { athlete: { name: string }; id: string };
    const ids = expectedAthleteCases.get(record.athlete.name) ?? [];
    ids.push(record.id);
    expectedAthleteCases.set(record.athlete.name, ids);
  }
  for (const ids of expectedAthleteCases.values()) ids.sort();

  const registry = parseStrictJson(
    read(PLAYER_PHOTO_REGISTRY_V6_PATH),
  ) as PlayerPhotoRegistryV6;
  const predecessor = parseStrictJson(
    read(PLAYER_PHOTO_REGISTRY_V5_PATH),
  ) as PlayerPhotoRegistryV6;
  const assetPaths = new Set([
    ...registry.selections.map((selection) => selection.localFile.path),
    ...predecessor.selections.map((selection) => selection.localFile.path),
  ]);
  return {
    expectedAthleteCases,
    expectedRegistrySha256: PLAYER_PHOTO_REGISTRY_V6_SHA256,
    localAssetBytesByPath: new Map(
      [...assetPaths].map((path) => [path, readFileSync(join(ROOT, path))]),
    ),
    policyJsonBytes: read(PLAYER_PHOTO_POLICY_V7_JSON_PATH),
    policyMarkdownBytes: read(PLAYER_PHOTO_POLICY_V7_MARKDOWN_PATH),
    policyV5JsonBytes: read(PLAYER_PHOTO_POLICY_V5_JSON_PATH),
    policyV5MarkdownBytes: read(PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH),
    predecessorRegistryBytesByPath: new Map(
      PLAYER_PHOTO_REGISTRY_PREDECESSORS.map((binding) => [
        binding.path,
        read(binding.path),
      ]),
    ),
    predecessorRegistryV5Bytes: read(PLAYER_PHOTO_REGISTRY_V5_PATH),
    registryBytes: read(PLAYER_PHOTO_REGISTRY_V6_PATH),
  };
}

function mutate(
  validationInput: PlayerPhotoRegistryV6ValidationInput,
  callback: (registry: PlayerPhotoRegistryV6) => void,
): void {
  const registry = parseStrictJson(
    validationInput.registryBytes,
  ) as PlayerPhotoRegistryV6;
  callback(registry);
  validationInput.registryBytes = canonicalJson(registry);
  validationInput.expectedRegistrySha256 = sha256Hex(
    validationInput.registryBytes,
  );
}

function codes(validationInput: PlayerPhotoRegistryV6ValidationInput) {
  return validatePlayerPhotoRegistryV6(validationInput).issues.map(
    (entry) => entry.code,
  );
}

describe("Decision 14 player-photo registry v6 contract", () => {
  it("accepts the exact successor with two bounded adoptions", () => {
    const result = validatePlayerPhotoRegistryV6(input());
    expect(result.issues).toEqual([]);
    expect(result.registry?.schemaVersion).toBe(6);
    expect(
      result.registry?.selections.filter(
        (selection) => selection.coverKind === "commons-photo",
      ),
    ).toHaveLength(7);
    expect(
      result.registry?.selections.filter(
        (selection) => selection.coverKind === "original-svg-fallback",
      ),
    ).toHaveLength(14);
  });

  it("rejects same-version, predecessor, and v7 policy drift", () => {
    const digestDrift = input();
    digestDrift.expectedRegistrySha256 = "0".repeat(64);
    expect(codes(digestDrift)).toContain("player-photo-v6-same-version-drift");

    const predecessorDrift = input();
    predecessorDrift.predecessorRegistryV5Bytes += "\n";
    expect(codes(predecessorDrift)).toContain(
      "player-photo-v6-predecessor-drift",
    );

    const policyDrift = input();
    policyDrift.policyMarkdownBytes += "\n";
    expect(codes(policyDrift)).toContain("player-photo-v6-policy-binding");
  });

  it("rejects any third athlete delta from immutable v5", () => {
    const validationInput = input();
    mutate(validationInput, (registry) => {
      registry.selections.find(
        ({ athleteName }) => athleteName === "Anfernee Simons",
      )!.focalPosition.xPercent = 49;
    });
    expect(codes(validationInput)).toContain("player-photo-v6-bounded-delta");
  });

  it("rejects incomplete BY-SA attribution and event-branch laundering", () => {
    const validationInput = input();
    mutate(validationInput, (registry) => {
      const selection = registry.selections.find(
        ({ athleteName }) => athleteName === "Damian Lillard",
      )!;
      if (selection.coverKind !== "commons-photo") throw new Error("fixture");
      selection.rightsAttribution.adapterLicense = null;
      Object.assign(selection, {
        eventPhoto: {
          ownerRecordPath: "../.claude/g2-owner-decisions.md",
          residualRiskToken: "credentialed-access-residual-risk",
        },
      });
    });
    const observed = codes(validationInput);
    expect(observed).toContain("player-photo-v6-adopted-selection");
    expect(observed).toContain("player-photo-v6-event-branch-confusion");
    expect(observed).toContain(
      "player-photo-v6-projection-player-photo-v4-selection-schema",
    );
  });

  it("rejects local-byte drift for an adopted original", () => {
    const validationInput = input();
    const path = "src/assets/players/decision-14/jayson-tatum.jpg";
    const bytes = Buffer.from(validationInput.localAssetBytesByPath.get(path)!);
    bytes[bytes.length - 1]! ^= 1;
    validationInput.localAssetBytesByPath = new Map(
      validationInput.localAssetBytesByPath,
    ).set(path, bytes);
    const observed = codes(validationInput);
    expect(observed).toContain("player-photo-v6-adopted-selection");
    expect(observed).toContain(
      "player-photo-v6-projection-player-photo-v4-local-photo",
    );
  });
});
