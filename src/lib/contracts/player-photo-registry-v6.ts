import {
  canonicalJson,
  compareCodePoints,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "./canonical";
import {
  DECISION_14_OWNER_RECORD_HEADING,
  DECISION_14_OWNER_RECORD_PATH,
  DECISION_14_PROTECTED_ATHLETES,
  DECISION_14_RESIDUAL_RISK_TOKEN,
  DECISION_14_SCOPE_ID,
  validateDecision14ProtectedCovers,
} from "./decision-14-photo-contract";
import {
  PLAYER_PHOTO_POLICY_V5_JSON_PATH,
  PLAYER_PHOTO_POLICY_V5_JSON_SHA256,
  PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH,
  PLAYER_PHOTO_POLICY_V5_MARKDOWN_SHA256,
  PLAYER_PHOTO_REGISTRY_PREDECESSORS,
  PLAYER_PHOTO_REGISTRY_V4_SCOPE_ID,
  validatePlayerPhotoRegistryV4,
  type PlayerPhotoCommonSelectionV4,
  type PlayerPhotoCommonsSelectionV4,
  type PlayerPhotoRegistryV4,
  type PlayerPhotoSvgFallbackSelectionV4,
} from "./player-photo-registry-v4";
import {
  PLAYER_PHOTO_POLICY_V6_JSON_PATH,
  PLAYER_PHOTO_POLICY_V6_JSON_SHA256,
  PLAYER_PHOTO_POLICY_V6_MARKDOWN_PATH,
  PLAYER_PHOTO_POLICY_V6_MARKDOWN_SHA256,
  PLAYER_PHOTO_REGISTRY_V5_PATH,
  PLAYER_PHOTO_REGISTRY_V5_SHA256,
} from "./player-photo-registry-v5";

export const PLAYER_PHOTO_REGISTRY_V6_PATH =
  "src/assets/players/player-photo-registry.v6.json" as const;
export const PLAYER_PHOTO_REGISTRY_V6_SCOPE_ID = DECISION_14_SCOPE_ID;
export const PLAYER_PHOTO_REGISTRY_V6_SHA256 =
  "16851aaa3d1dd223f20f102ef543f104a23ee61335a796f4b70cbe75d76d5cf0" as const;
export const PLAYER_PHOTO_POLICY_V7_JSON_PATH =
  "research/source-policy/source-policy.v7.json" as const;
export const PLAYER_PHOTO_POLICY_V7_MARKDOWN_PATH =
  "research/source-policy/nba.v7.md" as const;
export const PLAYER_PHOTO_POLICY_V7_JSON_SHA256 =
  "d1062c1ffa045397d13489319534acbfe24653615df5ce83aac40e40539a8b15" as const;
export const PLAYER_PHOTO_POLICY_V7_MARKDOWN_SHA256 =
  "61ed88f92d80b77cd2c1410d03305215eedbb391356c073fb19fac944dea2fd1" as const;

export const PLAYER_PHOTO_REGISTRY_V6_PREDECESSOR = {
  path: PLAYER_PHOTO_REGISTRY_V5_PATH,
  schemaVersion: 5,
  sha256: PLAYER_PHOTO_REGISTRY_V5_SHA256,
} as const;

export const PLAYER_PHOTO_REGISTRY_V6_ADOPTED_ATHLETES = [
  "Damian Lillard",
  "Jayson Tatum",
] as const;

export type PlayerPhotoSupersessionReasonV6 =
  | PlayerPhotoCommonSelectionV4["supersession"]["reason"]
  | "replaces-current-svg-after-v6-non-event-qualification";

export type PlayerPhotoCommonsSelectionV6 = Omit<
  PlayerPhotoCommonsSelectionV4,
  "supersession"
> & {
  supersession: Omit<PlayerPhotoCommonSelectionV4["supersession"], "reason"> & {
    reason: PlayerPhotoSupersessionReasonV6;
  };
};

export type PlayerPhotoSvgFallbackSelectionV6 = Omit<
  PlayerPhotoSvgFallbackSelectionV4,
  "supersession"
> & {
  supersession: Omit<PlayerPhotoCommonSelectionV4["supersession"], "reason"> & {
    reason: PlayerPhotoSupersessionReasonV6;
  };
};

export type PlayerPhotoSelectionV6 =
  PlayerPhotoCommonsSelectionV6 | PlayerPhotoSvgFallbackSelectionV6;

export interface PlayerPhotoRegistryV6 {
  predecessorRegistryBinding: typeof PLAYER_PHOTO_REGISTRY_V6_PREDECESSOR;
  schemaVersion: 6;
  scopeId: typeof PLAYER_PHOTO_REGISTRY_V6_SCOPE_ID;
  selections: PlayerPhotoSelectionV6[];
  sourcePolicyBinding: {
    jsonPath: typeof PLAYER_PHOTO_POLICY_V7_JSON_PATH;
    jsonSha256: typeof PLAYER_PHOTO_POLICY_V7_JSON_SHA256;
    markdownPath: typeof PLAYER_PHOTO_POLICY_V7_MARKDOWN_PATH;
    markdownSha256: typeof PLAYER_PHOTO_POLICY_V7_MARKDOWN_SHA256;
    sourcePolicyVersion: "nba-v7";
  };
}

export interface PlayerPhotoRegistryV6ValidationInput {
  expectedAthleteCases: ReadonlyMap<string, readonly string[]>;
  expectedRegistrySha256: string;
  localAssetBytesByPath: ReadonlyMap<string, Uint8Array>;
  policyJsonBytes: string;
  policyMarkdownBytes: string;
  policyV5JsonBytes: string;
  policyV5MarkdownBytes: string;
  predecessorRegistryBytesByPath: ReadonlyMap<string, string>;
  predecessorRegistryV5Bytes: string;
  registryBytes: string;
}

export interface PlayerPhotoRegistryV6ValidationResult {
  issues: ValidationIssue[];
  registry: PlayerPhotoRegistryV6 | null;
}

const EXPECTED_SOURCE_POLICY_BINDING = {
  jsonPath: PLAYER_PHOTO_POLICY_V7_JSON_PATH,
  jsonSha256: PLAYER_PHOTO_POLICY_V7_JSON_SHA256,
  markdownPath: PLAYER_PHOTO_POLICY_V7_MARKDOWN_PATH,
  markdownSha256: PLAYER_PHOTO_POLICY_V7_MARKDOWN_SHA256,
  sourcePolicyVersion: "nba-v7",
} as const;

const EXPECTED_ADOPTED_FACTS = {
  "Damian Lillard": {
    caption:
      "Damian Lillard 於 2014 年芝加哥 63rd Street Beach 世界籃球節公開舞台；非本案例受傷當下影像",
    caseIds: ["CASE-NBAACHILLES-2025-015"],
    downloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/c/c3/20140814_World_Basketball_Festival_Damian_Lillard_and_Kyle_Korver.JPG",
    focalPosition: { xPercent: 28, yPercent: 35 },
    localFile: {
      byteLength: 5414375,
      height: 3456,
      mimeType: "image/jpeg",
      path: "src/assets/players/decision-14/damian-lillard.jpg",
      sha256:
        "ba8a0f23d721519e4796c89513f21a9e3c1d4fafe39f84a0192244162bb3abcf",
      width: 5184,
    },
    photographerName: "TonyTheTiger",
    revision: {
      id: 1195923850,
      timestamp: "2026-04-12T04:32:09Z",
      title:
        "File:20140814 World Basketball Festival Damian Lillard and Kyle Korver.JPG",
    },
    uploaderName: "TonyTheTiger",
  },
  "Jayson Tatum": {
    caption:
      "Jayson Tatum 於 2018 NBA 全明星週末公開訪談舞台；非本案例受傷當下影像",
    caseIds: ["CASE-NBAACHILLES-2025-016"],
    downloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/58/2018_NBA_All-Star_Weekend_-_Jayson_Tatum.jpg",
    focalPosition: { xPercent: 30, yPercent: 35 },
    localFile: {
      byteLength: 447666,
      height: 1680,
      mimeType: "image/jpeg",
      path: "src/assets/players/decision-14/jayson-tatum.jpg",
      sha256:
        "0adddc2e2918f307434e18e79c96ed7bf2e852122bea0adc0c38203584d7cb78",
      width: 2188,
    },
    photographerName: "Amin Eshaiker",
    revision: {
      id: 756925233,
      timestamp: "2023-05-01T03:06:22Z",
      title: "File:2018 NBA All-Star Weekend - Jayson Tatum.jpg",
    },
    uploaderName: "Amineshaker",
  },
} as const;

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
    Object.keys(value).sort(compareCodePoints).join("\0") ===
    [...expected].sort(compareCodePoints).join("\0")
  );
}

function jpegDimensions(bytes: Uint8Array): {
  height: number;
  width: number;
} | null {
  const buffer = Buffer.from(bytes);
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }
  const markers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);
  let offset = 2;
  while (offset + 4 <= buffer.length) {
    while (offset < buffer.length && buffer[offset] !== 0xff) offset += 1;
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === undefined || marker === 0xd9 || marker === 0xda) break;
    if (marker === 0xd8 || marker === 0x01) continue;
    if (offset + 2 > buffer.length) return null;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) return null;
    if (markers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += length;
  }
  return null;
}

function verifyAdoptedLocalFile(
  selection: PlayerPhotoCommonsSelectionV6,
  bytesByPath: ReadonlyMap<string, Uint8Array>,
): boolean {
  const bytes = bytesByPath.get(selection.localFile.path);
  const dimensions = bytes === undefined ? null : jpegDimensions(bytes);
  return (
    bytes !== undefined &&
    bytes.byteLength === selection.localFile.byteLength &&
    sha256Hex(bytes) === selection.localFile.sha256 &&
    dimensions?.width === selection.localFile.width &&
    dimensions.height === selection.localFile.height
  );
}

function addProjectionIssues(
  input: PlayerPhotoRegistryV6ValidationInput,
  selections: PlayerPhotoSelectionV6[],
  predecessorSelectionsByAthlete: ReadonlyMap<string, PlayerPhotoSelectionV6>,
  issues: ValidationIssue[],
): void {
  const syntheticAssetBytes = new Map(input.localAssetBytesByPath);
  const syntheticSelections = selections.map((selection) => {
    if (
      !(
        PLAYER_PHOTO_REGISTRY_V6_ADOPTED_ATHLETES as readonly string[]
      ).includes(selection.athleteName)
    ) {
      return selection;
    }
    const predecessor = predecessorSelectionsByAthlete.get(
      selection.athleteName,
    );
    const sourceBytes = syntheticAssetBytes.get(selection.localFile.path);
    const slug = selection.athleteName.toLowerCase().replaceAll(" ", "-");
    const syntheticPath = `src/assets/players/decision-13/d14-${slug}.jpg`;
    if (sourceBytes !== undefined) {
      syntheticAssetBytes.set(syntheticPath, sourceBytes);
    }
    return {
      ...selection,
      localFile: { ...selection.localFile, path: syntheticPath },
      supersession: predecessor?.supersession ?? selection.supersession,
    };
  });
  const syntheticRegistry: PlayerPhotoRegistryV4 = {
    predecessorRegistryBindings: [...PLAYER_PHOTO_REGISTRY_PREDECESSORS],
    schemaVersion: 4,
    scopeId: PLAYER_PHOTO_REGISTRY_V4_SCOPE_ID,
    selections: syntheticSelections as PlayerPhotoRegistryV4["selections"],
    sourcePolicyBinding: {
      jsonPath: PLAYER_PHOTO_POLICY_V5_JSON_PATH,
      jsonSha256: PLAYER_PHOTO_POLICY_V5_JSON_SHA256,
      markdownPath: PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH,
      markdownSha256: PLAYER_PHOTO_POLICY_V5_MARKDOWN_SHA256,
      sourcePolicyVersion: "nba-v5",
    },
  };
  const syntheticBytes = canonicalJson(syntheticRegistry);
  const result = validatePlayerPhotoRegistryV4({
    expectedAthleteCases: input.expectedAthleteCases,
    expectedRegistrySha256: sha256Hex(syntheticBytes),
    localAssetBytesByPath: syntheticAssetBytes,
    policyJsonBytes: input.policyV5JsonBytes,
    policyMarkdownBytes: input.policyV5MarkdownBytes,
    predecessorRegistryBytesByPath: input.predecessorRegistryBytesByPath,
    registryBytes: syntheticBytes,
  });
  for (const entry of result.issues) {
    issues.push(
      issue(
        `player-photo-v6-projection-${entry.code}`,
        entry.path.replaceAll(
          "player-photo-registry.v4",
          "player-photo-registry.v6",
        ),
        `v6 full-selection projection failed: ${entry.message}`,
      ),
    );
  }
}

export function validatePlayerPhotoRegistryV6(
  input: PlayerPhotoRegistryV6ValidationInput,
): PlayerPhotoRegistryV6ValidationResult {
  const issues: ValidationIssue[] = [];
  let parsed: unknown;
  let predecessorParsed: unknown;
  let policyParsed: unknown;
  try {
    parsed = parseStrictJson(input.registryBytes);
    predecessorParsed = parseStrictJson(input.predecessorRegistryV5Bytes);
    policyParsed = parseStrictJson(input.policyJsonBytes);
  } catch (error) {
    return {
      issues: [
        issue(
          "player-photo-v6-json",
          PLAYER_PHOTO_REGISTRY_V6_PATH,
          error instanceof Error ? error.message : String(error),
        ),
      ],
      registry: null,
    };
  }

  if (canonicalJson(parsed) !== input.registryBytes) {
    issues.push(
      issue(
        "player-photo-v6-canonical",
        PLAYER_PHOTO_REGISTRY_V6_PATH,
        "registry v6 must be canonical JSON without trailing bytes",
      ),
    );
  }
  if (
    !SHA256_RE.test(input.expectedRegistrySha256) ||
    sha256Hex(input.registryBytes) !== input.expectedRegistrySha256
  ) {
    issues.push(
      issue(
        "player-photo-v6-same-version-drift",
        PLAYER_PHOTO_REGISTRY_V6_PATH,
        "registry v6 bytes do not match the frozen same-version digest",
      ),
    );
  }

  const root = asRecord(parsed);
  const predecessorRoot = asRecord(predecessorParsed);
  if (
    root === null ||
    !exactKeys(root, [
      "predecessorRegistryBinding",
      "schemaVersion",
      "scopeId",
      "selections",
      "sourcePolicyBinding",
    ]) ||
    root.schemaVersion !== 6 ||
    root.scopeId !== PLAYER_PHOTO_REGISTRY_V6_SCOPE_ID ||
    !Array.isArray(root.selections)
  ) {
    issues.push(
      issue(
        "player-photo-v6-schema",
        PLAYER_PHOTO_REGISTRY_V6_PATH,
        "registry v6 root is missing exact Decision 14 schema fields",
      ),
    );
    return { issues, registry: null };
  }

  if (
    sha256Hex(input.predecessorRegistryV5Bytes) !==
      PLAYER_PHOTO_REGISTRY_V5_SHA256 ||
    canonicalJson(root.predecessorRegistryBinding) !==
      canonicalJson(PLAYER_PHOTO_REGISTRY_V6_PREDECESSOR) ||
    predecessorRoot === null ||
    predecessorRoot.schemaVersion !== 5 ||
    !Array.isArray(predecessorRoot.selections)
  ) {
    issues.push(
      issue(
        "player-photo-v6-predecessor-drift",
        `${PLAYER_PHOTO_REGISTRY_V6_PATH}.predecessorRegistryBinding`,
        "registry v6 must bind the exact immutable registry v5 bytes",
      ),
    );
    return { issues, registry: parsed as PlayerPhotoRegistryV6 };
  }

  if (
    sha256Hex(input.policyJsonBytes) !== PLAYER_PHOTO_POLICY_V7_JSON_SHA256 ||
    sha256Hex(input.policyMarkdownBytes) !==
      PLAYER_PHOTO_POLICY_V7_MARKDOWN_SHA256 ||
    canonicalJson(root.sourcePolicyBinding) !==
      canonicalJson(EXPECTED_SOURCE_POLICY_BINDING)
  ) {
    issues.push(
      issue(
        "player-photo-v6-policy-binding",
        `${PLAYER_PHOTO_REGISTRY_V6_PATH}.sourcePolicyBinding`,
        "registry v6 must bind the exact immutable nba-v7 policy pair",
      ),
    );
  }
  const policyRoot = asRecord(policyParsed);
  const inheritance = asRecord(policyRoot?.playerStaticPhotoPolicyInheritance);
  const annex = asRecord(policyRoot?.playerStaticPhotoRules);
  const exception = asRecord(annex?.decision14NamedPhotographerEventException);
  if (
    policyRoot?.sourcePolicyVersion !== "nba-v7" ||
    canonicalJson(inheritance) !==
      canonicalJson({
        jsonPath: PLAYER_PHOTO_POLICY_V6_JSON_PATH,
        jsonSha256: PLAYER_PHOTO_POLICY_V6_JSON_SHA256,
        markdownPath: PLAYER_PHOTO_POLICY_V6_MARKDOWN_PATH,
        markdownSha256: PLAYER_PHOTO_POLICY_V6_MARKDOWN_SHA256,
        sourcePolicyVersion: "nba-v6",
      }) ||
    exception?.status !== "empty-fail-closed" ||
    exception.photographerCount !== 0 ||
    !Array.isArray(exception.namedPhotographerAllowlist) ||
    exception.namedPhotographerAllowlist.length !== 0
  ) {
    issues.push(
      issue(
        "player-photo-v6-v7-contract",
        PLAYER_PHOTO_POLICY_V7_JSON_PATH,
        "nba-v7 must inherit exact v6 and keep the frozen named event allowlist empty",
      ),
    );
  }

  const selections = root.selections as PlayerPhotoSelectionV6[];
  const predecessorSelections =
    predecessorRoot.selections as PlayerPhotoSelectionV6[];
  const predecessorByAthlete = new Map(
    predecessorSelections.map((selection) => [
      selection.athleteName,
      selection,
    ]),
  );
  const changedAthletes: string[] = [];
  for (const selection of selections) {
    const predecessor = predecessorByAthlete.get(selection.athleteName);
    if (
      predecessor === undefined ||
      canonicalJson(selection) !== canonicalJson(predecessor)
    ) {
      changedAthletes.push(selection.athleteName);
    }
  }
  if (
    canonicalJson(changedAthletes.sort(compareCodePoints)) !==
      canonicalJson([...PLAYER_PHOTO_REGISTRY_V6_ADOPTED_ATHLETES]) ||
    selections.length !== 21 ||
    selections.filter((selection) => selection.coverKind === "commons-photo")
      .length !== 7 ||
    selections.filter(
      (selection) => selection.coverKind === "original-svg-fallback",
    ).length !== 14 ||
    new Set(selections.flatMap((selection) => selection.caseIds)).size !== 26
  ) {
    issues.push(
      issue(
        "player-photo-v6-bounded-delta",
        `${PLAYER_PHOTO_REGISTRY_V6_PATH}.selections`,
        "only Damian Lillard and Jayson Tatum may change; v6 must remain 21 athletes, 26 cases, 7 photos, and 14 SVGs",
      ),
    );
  }

  const protectedRows = selections
    .filter((selection) =>
      (DECISION_14_PROTECTED_ATHLETES as readonly string[]).includes(
        selection.athleteName,
      ),
    )
    .map((selection) => ({
      athleteName: selection.athleteName,
      localAssetSha256: selection.localFile.sha256,
      selectionSha256: sha256Hex(canonicalJson(selection)),
    }));
  issues.push(...validateDecision14ProtectedCovers(protectedRows));

  for (const athleteName of PLAYER_PHOTO_REGISTRY_V6_ADOPTED_ATHLETES) {
    const selection = selections.find(
      (entry) => entry.athleteName === athleteName,
    );
    const predecessor = predecessorByAthlete.get(athleteName);
    const expected = EXPECTED_ADOPTED_FACTS[athleteName];
    const location = `${PLAYER_PHOTO_REGISTRY_V6_PATH}.selections.${athleteName}`;
    const selectionBytes = canonicalJson(selection ?? null);
    if (
      selectionBytes.includes(DECISION_14_RESIDUAL_RISK_TOKEN) ||
      selectionBytes.includes(DECISION_14_OWNER_RECORD_PATH) ||
      selectionBytes.includes(DECISION_14_OWNER_RECORD_HEADING) ||
      (selection !== undefined &&
        Object.prototype.hasOwnProperty.call(selection, "eventPhoto"))
    ) {
      issues.push(
        issue(
          "player-photo-v6-event-branch-confusion",
          location,
          "inherited-v6 non-event selections must not synthesize v7 event-exception or owner-risk fields",
        ),
      );
    }
    if (
      selection?.coverKind !== "commons-photo" ||
      predecessor?.coverKind !== "original-svg-fallback" ||
      canonicalJson(selection.caseIds) !== canonicalJson(expected.caseIds) ||
      selection.nonEventCaption !== expected.caption ||
      canonicalJson(selection.focalPosition) !==
        canonicalJson(expected.focalPosition) ||
      selection.commonsDownloadUrl !== expected.downloadUrl ||
      canonicalJson(selection.localFile) !==
        canonicalJson(expected.localFile) ||
      selection.photographerIdentity.name !== expected.photographerName ||
      selection.uploaderIdentity.name !== expected.uploaderName ||
      selection.uploaderIdentity.relationshipToPhotographer !==
        "same-person-evidenced" ||
      selection.sourceRevision.id !== expected.revision.id ||
      selection.sourceRevision.timestamp !== expected.revision.timestamp ||
      selection.sourceRevision.title !== expected.revision.title ||
      selection.occasionEvidence.category !==
        "public-event-or-fan-interaction" ||
      selection.photographerRiskEvidence.category !==
        "independent-public-event-low-risk" ||
      selection.sourceRiskClassification.category !== "non-event-low-risk" ||
      selection.license.token !== "cc-by-sa-4.0" ||
      selection.rightsAttribution.licenseBucket !== "cc-by-sa" ||
      selection.rightsAttribution.adapterLicense?.token !== "cc-by-sa-4.0" ||
      selection.rightsAttribution.workTitle.status !== "not-supplied" ||
      selection.rightsAttribution.workTitle.text !== null ||
      selection.rightsAttribution.copyrightNotice.status !== "not-supplied" ||
      selection.rightsAttribution.disclaimerNotice.status !== "not-supplied" ||
      selection.rightsAttribution.otherPerFileNotice.status !==
        "not-supplied" ||
      selection.upstreamOriginal.status !== "not-supplied" ||
      selection.upstreamOriginal.url !== null ||
      selection.supersession.previousLocalFilePath !==
        predecessor.localFile.path ||
      selection.supersession.previousLocalFileSha256 !==
        predecessor.localFile.sha256 ||
      selection.supersession.reason !==
        "replaces-current-svg-after-v6-non-event-qualification" ||
      !verifyAdoptedLocalFile(selection, input.localAssetBytesByPath)
    ) {
      issues.push(
        issue(
          "player-photo-v6-adopted-selection",
          location,
          "adopted photo must match every frozen Phase 2 fact, exact predecessor SVG, and verified local original",
        ),
      );
      continue;
    }
  }

  addProjectionIssues(input, selections, predecessorByAthlete, issues);
  return { issues, registry: parsed as PlayerPhotoRegistryV6 };
}
