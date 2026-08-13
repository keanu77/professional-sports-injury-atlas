import {
  canonicalJson,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "./canonical";
import {
  PLAYER_PHOTO_REGISTRY_V4_PATH,
  PLAYER_PHOTO_REGISTRY_V4_SCOPE_ID,
  PLAYER_PHOTO_REGISTRY_V4_SHA256,
  type PlayerPhotoRegistryV4,
  type PlayerPhotoSelectionV4,
} from "./player-photo-registry-v4";

export const PLAYER_PHOTO_REGISTRY_V5_PATH =
  "src/assets/players/player-photo-registry.v5.json" as const;
export const PLAYER_PHOTO_REGISTRY_V5_SCOPE_ID =
  PLAYER_PHOTO_REGISTRY_V4_SCOPE_ID;
export const PLAYER_PHOTO_REGISTRY_V5_SHA256 =
  "26129455fe5b9297c44ac91c3be1fc1678a928cf77bd12d00695614fe5df3985" as const;
export const PLAYER_PHOTO_POLICY_V6_JSON_PATH =
  "research/source-policy/source-policy.v6.json" as const;
export const PLAYER_PHOTO_POLICY_V6_MARKDOWN_PATH =
  "research/source-policy/nba.v6.md" as const;
export const PLAYER_PHOTO_POLICY_V6_JSON_SHA256 =
  "1e27041de184b7b6397b2cfdde225706b40696f1d4456757193baa340f4cc93c" as const;
export const PLAYER_PHOTO_POLICY_V6_MARKDOWN_SHA256 =
  "b9a469344ff5061546619ea0ecbb5b7320965af40cde254d4939cf2e8835b0c1" as const;
export const PLAYER_PHOTO_POLICY_V6_GENERIC_NON_EVENT_TEXT =
  "非賽事場合資料照片；非本案例受傷當下影像" as const;

export const PLAYER_PHOTO_REGISTRY_V5_PREDECESSOR = {
  path: PLAYER_PHOTO_REGISTRY_V4_PATH,
  schemaVersion: 4,
  sha256: PLAYER_PHOTO_REGISTRY_V4_SHA256,
} as const;

export interface PlayerPhotoRegistryV5 {
  predecessorRegistryBinding: typeof PLAYER_PHOTO_REGISTRY_V5_PREDECESSOR;
  schemaVersion: 5;
  scopeId: typeof PLAYER_PHOTO_REGISTRY_V5_SCOPE_ID;
  selections: PlayerPhotoSelectionV4[];
  sourcePolicyBinding: {
    jsonPath: typeof PLAYER_PHOTO_POLICY_V6_JSON_PATH;
    jsonSha256: typeof PLAYER_PHOTO_POLICY_V6_JSON_SHA256;
    markdownPath: typeof PLAYER_PHOTO_POLICY_V6_MARKDOWN_PATH;
    markdownSha256: typeof PLAYER_PHOTO_POLICY_V6_MARKDOWN_SHA256;
    sourcePolicyVersion: "nba-v6";
  };
}

export interface PlayerPhotoRegistryV5ValidationInput {
  expectedRegistrySha256: string;
  policyJsonBytes: string;
  policyMarkdownBytes: string;
  predecessorRegistryV4Bytes: string;
  registryBytes: string;
}

export interface PlayerPhotoRegistryV5ValidationResult {
  issues: ValidationIssue[];
  registry: PlayerPhotoRegistryV5 | null;
}

const SHA256_RE = /^[a-f0-9]{64}$/u;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function exactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return (
    Object.keys(value).sort().join("\0") === [...expected].sort().join("\0")
  );
}

function normalizedCommonsFilename(value: string): string | null {
  try {
    const filename = decodeURIComponent(
      new URL(value).pathname.split("/").at(-1) ?? "",
    );
    return filename
      .replace(/^File:/iu, "")
      .replaceAll("_", " ")
      .normalize("NFC")
      .toLowerCase();
  } catch {
    return null;
  }
}

function normalizedPolicyFilename(value: unknown): string | null {
  return typeof value === "string"
    ? value
        .replace(/^File:/iu, "")
        .replaceAll("_", " ")
        .normalize("NFC")
        .toLowerCase()
    : null;
}

export function validatePlayerPhotoRegistryV5(
  input: PlayerPhotoRegistryV5ValidationInput,
): PlayerPhotoRegistryV5ValidationResult {
  const issues: ValidationIssue[] = [];
  let parsed: unknown;
  let predecessor: unknown;
  let policy: unknown;
  try {
    parsed = parseStrictJson(input.registryBytes);
    predecessor = parseStrictJson(input.predecessorRegistryV4Bytes);
    policy = parseStrictJson(input.policyJsonBytes);
  } catch (error) {
    return {
      issues: [
        issue(
          "player-photo-v5-json",
          PLAYER_PHOTO_REGISTRY_V5_PATH,
          error instanceof Error ? error.message : String(error),
        ),
      ],
      registry: null,
    };
  }

  if (canonicalJson(parsed) !== input.registryBytes) {
    issues.push(
      issue(
        "player-photo-v5-canonical",
        PLAYER_PHOTO_REGISTRY_V5_PATH,
        "registry v5 must be canonical JSON without trailing bytes",
      ),
    );
  }
  if (
    !SHA256_RE.test(input.expectedRegistrySha256) ||
    sha256Hex(input.registryBytes) !== input.expectedRegistrySha256
  ) {
    issues.push(
      issue(
        "player-photo-v5-same-version-drift",
        PLAYER_PHOTO_REGISTRY_V5_PATH,
        "registry v5 bytes do not match the frozen same-version digest",
      ),
    );
  }

  const root = asRecord(parsed);
  const predecessorRoot = asRecord(predecessor);
  if (
    root === null ||
    !exactKeys(root, [
      "predecessorRegistryBinding",
      "schemaVersion",
      "scopeId",
      "selections",
      "sourcePolicyBinding",
    ]) ||
    root.schemaVersion !== 5 ||
    root.scopeId !== PLAYER_PHOTO_REGISTRY_V5_SCOPE_ID ||
    !Array.isArray(root.selections)
  ) {
    issues.push(
      issue(
        "player-photo-v5-schema",
        PLAYER_PHOTO_REGISTRY_V5_PATH,
        "registry v5 root is missing exact schema fields",
      ),
    );
    return { issues, registry: null };
  }

  if (
    sha256Hex(input.predecessorRegistryV4Bytes) !==
      PLAYER_PHOTO_REGISTRY_V4_SHA256 ||
    canonicalJson(root.predecessorRegistryBinding) !==
      canonicalJson(PLAYER_PHOTO_REGISTRY_V5_PREDECESSOR) ||
    predecessorRoot === null ||
    predecessorRoot.schemaVersion !== 4 ||
    !Array.isArray(predecessorRoot.selections)
  ) {
    issues.push(
      issue(
        "player-photo-v5-predecessor-drift",
        `${PLAYER_PHOTO_REGISTRY_V5_PATH}.predecessorRegistryBinding`,
        "registry v5 must bind the exact immutable registry v4 bytes",
      ),
    );
  } else if (
    canonicalJson(root.selections) !== canonicalJson(predecessorRoot.selections)
  ) {
    issues.push(
      issue(
        "player-photo-v5-selection-drift",
        `${PLAYER_PHOTO_REGISTRY_V5_PATH}.selections`,
        "forward correction must preserve every registry v4 selection fact and byte binding",
      ),
    );
  }

  const expectedPolicyBinding = {
    jsonPath: PLAYER_PHOTO_POLICY_V6_JSON_PATH,
    jsonSha256: PLAYER_PHOTO_POLICY_V6_JSON_SHA256,
    markdownPath: PLAYER_PHOTO_POLICY_V6_MARKDOWN_PATH,
    markdownSha256: PLAYER_PHOTO_POLICY_V6_MARKDOWN_SHA256,
    sourcePolicyVersion: "nba-v6",
  };
  if (
    sha256Hex(input.policyJsonBytes) !== PLAYER_PHOTO_POLICY_V6_JSON_SHA256 ||
    sha256Hex(input.policyMarkdownBytes) !==
      PLAYER_PHOTO_POLICY_V6_MARKDOWN_SHA256 ||
    canonicalJson(root.sourcePolicyBinding) !==
      canonicalJson(expectedPolicyBinding)
  ) {
    issues.push(
      issue(
        "player-photo-v5-policy-binding",
        `${PLAYER_PHOTO_REGISTRY_V5_PATH}.sourcePolicyBinding`,
        "registry v5 must bind the exact immutable nba-v6 policy pair",
      ),
    );
  }

  const policyRoot = asRecord(policy);
  const annex = asRecord(policyRoot?.playerStaticPhotoRules);
  const attribution = asRecord(annex?.attributionRequirements);
  const explicitNegativeFiles = Array.isArray(annex?.explicitNegativeFiles)
    ? annex.explicitNegativeFiles
    : [];
  const explicitNegativeNames = new Set(
    explicitNegativeFiles
      .map((entry) => normalizedPolicyFilename(asRecord(entry)?.filename))
      .filter((value): value is string => value !== null),
  );
  const currentNegativeSelections = root.selections.filter((selection) => {
    const record = asRecord(selection);
    const url = record?.commonsDescriptionUrl;
    const filename =
      typeof url === "string" ? normalizedCommonsFilename(url) : null;
    return filename !== null && explicitNegativeNames.has(filename);
  });
  if (currentNegativeSelections.length > 0) {
    issues.push(
      issue(
        "player-photo-v5-current-explicit-negative",
        `${PLAYER_PHOTO_POLICY_V6_JSON_PATH}.playerStaticPhotoRules.explicitNegativeFiles`,
        "a current registry selection must never remain in the explicit-negative file list",
      ),
    );
  }

  if (
    !Array.isArray(annex?.prohibitedClassifications) ||
    annex.prohibitedClassifications.includes("non-basketball-court")
  ) {
    issues.push(
      issue(
        "player-photo-v5-obsolete-court-prohibition",
        `${PLAYER_PHOTO_POLICY_V6_JSON_PATH}.playerStaticPhotoRules.prohibitedClassifications`,
        "non-basketball-court contradicts the accepted Decision 13 non-event occasions",
      ),
    );
  }
  if (
    attribution?.nonEventText !== PLAYER_PHOTO_POLICY_V6_GENERIC_NON_EVENT_TEXT
  ) {
    issues.push(
      issue(
        "player-photo-v5-generic-caption",
        `${PLAYER_PHOTO_POLICY_V6_JSON_PATH}.playerStaticPhotoRules.attributionRequirements.nonEventText`,
        "generic policy caption must describe non-event photos without claiming a basketball-court setting",
      ),
    );
  }

  return { issues, registry: parsed as PlayerPhotoRegistryV5 };
}

export type {
  PlayerPhotoCommonsSelectionV4 as PlayerPhotoCommonsSelectionV5,
  PlayerPhotoSelectionV4 as PlayerPhotoSelectionV5,
  PlayerPhotoSvgFallbackSelectionV4 as PlayerPhotoSvgFallbackSelectionV5,
} from "./player-photo-registry-v4";
