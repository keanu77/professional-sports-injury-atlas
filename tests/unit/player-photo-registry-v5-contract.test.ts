import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  canonicalJson,
  parseStrictJson,
} from "../../src/lib/contracts/canonical";
import { PLAYER_PHOTO_REGISTRY_V4_PATH } from "../../src/lib/contracts/player-photo-registry-v4";
import {
  PLAYER_PHOTO_POLICY_V6_GENERIC_NON_EVENT_TEXT,
  PLAYER_PHOTO_POLICY_V6_JSON_PATH,
  PLAYER_PHOTO_POLICY_V6_MARKDOWN_PATH,
  PLAYER_PHOTO_REGISTRY_V5_PATH,
  PLAYER_PHOTO_REGISTRY_V5_SHA256,
  validatePlayerPhotoRegistryV5,
  type PlayerPhotoRegistryV5ValidationInput,
} from "../../src/lib/contracts/player-photo-registry-v5";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string): string {
  return readFileSync(join(REPO_ROOT, path), "utf8");
}

function input(
  overrides: Partial<PlayerPhotoRegistryV5ValidationInput> = {},
): PlayerPhotoRegistryV5ValidationInput {
  return {
    expectedRegistrySha256: PLAYER_PHOTO_REGISTRY_V5_SHA256,
    policyJsonBytes: read(PLAYER_PHOTO_POLICY_V6_JSON_PATH),
    policyMarkdownBytes: read(PLAYER_PHOTO_POLICY_V6_MARKDOWN_PATH),
    predecessorRegistryV4Bytes: read(PLAYER_PHOTO_REGISTRY_V4_PATH),
    registryBytes: read(PLAYER_PHOTO_REGISTRY_V5_PATH),
    ...overrides,
  };
}

function mutatePolicy(
  mutate: (annex: Record<string, unknown>) => void,
): string {
  const policy = parseStrictJson(
    read(PLAYER_PHOTO_POLICY_V6_JSON_PATH),
  ) as Record<string, unknown>;
  const annex = policy.playerStaticPhotoRules as Record<string, unknown>;
  mutate(annex);
  return canonicalJson(policy);
}

describe("Decision 13 player-photo registry v5 corrective contract", () => {
  it("accepts the exact forward successor and preserves all v4 selections", () => {
    const result = validatePlayerPhotoRegistryV5(input());
    const predecessor = parseStrictJson(
      read(PLAYER_PHOTO_REGISTRY_V4_PATH),
    ) as { selections: unknown[] };

    expect(result.issues).toEqual([]);
    expect(result.registry?.selections).toHaveLength(21);
    expect(
      result.registry?.selections.flatMap((selection) => selection.caseIds),
    ).toHaveLength(26);
    expect(canonicalJson(result.registry?.selections)).toBe(
      canonicalJson(predecessor.selections),
    );
  });

  it("rejects predecessor, selection, and same-version drift", () => {
    expect(
      validatePlayerPhotoRegistryV5(
        input({
          predecessorRegistryV4Bytes: `${read(PLAYER_PHOTO_REGISTRY_V4_PATH)} `,
        }),
      ).issues.map((entry) => entry.code),
    ).toContain("player-photo-v5-predecessor-drift");

    const registry = parseStrictJson(read(PLAYER_PHOTO_REGISTRY_V5_PATH)) as {
      selections: Array<{ nonEventCaption: string }>;
    };
    registry.selections[0]!.nonEventCaption = "drift";
    const codes = validatePlayerPhotoRegistryV5(
      input({ registryBytes: canonicalJson(registry) }),
    ).issues.map((entry) => entry.code);
    expect(codes).toContain("player-photo-v5-same-version-drift");
    expect(codes).toContain("player-photo-v5-selection-drift");
  });

  it("rejects a current file retained in the explicit-negative list", () => {
    const policyJsonBytes = mutatePolicy((annex) => {
      annex.explicitNegativeFiles = [
        ...(annex.explicitNegativeFiles as unknown[]),
        {
          filename: "2025_C.J._McCollum_(cropped).jpg",
          reason: "stale-negative",
        },
      ];
    });
    expect(
      validatePlayerPhotoRegistryV5(input({ policyJsonBytes })).issues.map(
        (entry) => entry.code,
      ),
    ).toContain("player-photo-v5-current-explicit-negative");
  });

  it("rejects restoration of the obsolete court prohibition", () => {
    const policyJsonBytes = mutatePolicy((annex) => {
      annex.prohibitedClassifications = [
        ...(annex.prohibitedClassifications as string[]),
        "non-basketball-court",
      ];
    });
    expect(
      validatePlayerPhotoRegistryV5(input({ policyJsonBytes })).issues.map(
        (entry) => entry.code,
      ),
    ).toContain("player-photo-v5-obsolete-court-prohibition");
  });

  it("rejects a generic caption that falsely requires a court context", () => {
    const policyJsonBytes = mutatePolicy((annex) => {
      const attribution = annex.attributionRequirements as Record<
        string,
        unknown
      >;
      attribution.nonEventText = "球員球場資料照片；非本案例受傷當下影像";
    });
    const issues = validatePlayerPhotoRegistryV5(
      input({ policyJsonBytes }),
    ).issues;
    expect(issues.map((entry) => entry.code)).toContain(
      "player-photo-v5-generic-caption",
    );
    expect(PLAYER_PHOTO_POLICY_V6_GENERIC_NON_EVENT_TEXT).toBe(
      "非賽事場合資料照片；非本案例受傷當下影像",
    );
  });
});
