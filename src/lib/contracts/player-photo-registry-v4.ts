import {
  canonicalJson,
  compareCodePoints,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "./canonical";

export const PLAYER_PHOTO_REGISTRY_V4_PATH =
  "src/assets/players/player-photo-registry.v4.json" as const;
export const PLAYER_PHOTO_REGISTRY_V4_SCOPE_ID =
  "decision-13-named-covers-and-notice-consolidation-only" as const;
export const PLAYER_PHOTO_REGISTRY_V4_SHA256 =
  "ef7149b57ab5d08a328a0a7ed88177fc4d6a35af998bcfd95a0ec318bcf345b5" as const;
export const PLAYER_PHOTO_POLICY_V5_JSON_PATH =
  "research/source-policy/source-policy.v5.json" as const;
export const PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH =
  "research/source-policy/nba.v5.md" as const;
export const PLAYER_PHOTO_POLICY_V5_JSON_SHA256 =
  "5f38066ce0ef0c10f0494856f90114dc403c068986b4c323cbb2ef3ebbda56ac" as const;
export const PLAYER_PHOTO_POLICY_V5_MARKDOWN_SHA256 =
  "a59111d915caeb7f1e8f730492e826be63ff95fb5b1feeb1576eeb75a95e6aae" as const;

export const PLAYER_PHOTO_REGISTRY_PREDECESSORS = [
  {
    path: "src/assets/players/player-photo-registry.v1.json",
    schemaVersion: 1,
    sha256: "770a7e6d7f13ecd0dda17a629b13f179357b9c64ebc268404a5640ad9aa08eec",
  },
  {
    path: "src/assets/players/player-photo-registry.v2.json",
    schemaVersion: 2,
    sha256: "0fa9a14660d798b32586047eaec1a0fc14912ca8710aaccc83963ac4f9dc28d0",
  },
  {
    path: "src/assets/players/player-photo-registry.v3.json",
    schemaVersion: 3,
    sha256: "d91e97aa34e347375dd5ca14cf961208ae4b2c43cc8a90a01bea49f1172a3c05",
  },
] as const;

export const PLAYER_PHOTO_ACCEPTED_OCCASIONS = [
  "award-ceremony",
  "documented-preseason-tune-up-warm-up-outside-live-competition",
  "press-conference",
  "public-event-or-fan-interaction",
  "verified-media-day",
] as const;

export const PLAYER_PHOTO_ACCEPTED_PHOTOGRAPHER_RISKS = [
  "credentialed-media-residual-risk",
  "independent-public-event-low-risk",
] as const;

export type PlayerPhotoOccasion =
  (typeof PLAYER_PHOTO_ACCEPTED_OCCASIONS)[number];
export type PlayerPhotoPhotographerRisk =
  (typeof PLAYER_PHOTO_ACCEPTED_PHOTOGRAPHER_RISKS)[number];
export type PlayerPhotoLicenseBucketV4 = "cc-by" | "cc-by-sa" | "cc0";

export interface PlayerPhotoLicenseV4 {
  name: string;
  token: string;
  url: string;
}

export interface PlayerPhotoNoticeV4 {
  status: "not-supplied" | "supplied";
  text: string | null;
  url: string | null;
}

export interface PlayerPhotoEvidenceV4 {
  basis: string;
  checkedAt: string;
  checkedBy: string;
  urls: string[];
}

export interface PlayerPhotoCommonSelectionV4 {
  athleteName: string;
  caseIds: string[];
  currentCoverStatus: "current";
  focalPosition: {
    xPercent: number;
    yPercent: number;
  };
  nonEventCaption: string;
  supersession: {
    previousLocalFilePath: string;
    previousLocalFileSha256: string;
    reason:
      | "replaces-existing-non-event-after-revalidation"
      | "replaces-game-action-high-risk"
      | "revalidates-existing-non-event";
  };
}

export interface PlayerPhotoCommonsSelectionV4 extends PlayerPhotoCommonSelectionV4 {
  coverKind: "commons-photo";
  commonsDescriptionUrl: string;
  commonsDownloadUrl: string;
  cropValidation: {
    checkedAt: string;
    checkedBy: string;
    ratios: Array<{
      aspectRatio: "5:2" | "16:9";
      subjectSafe: true;
    }>;
  };
  identityEvidence: PlayerPhotoEvidenceV4 & { status: "verified" };
  license: PlayerPhotoLicenseV4;
  localFile: {
    byteLength: number;
    height: number;
    mimeType: "image/jpeg" | "image/png";
    path: string;
    sha256: string;
    width: number;
  };
  occasionEvidence: PlayerPhotoEvidenceV4 & {
    category: PlayerPhotoOccasion;
  };
  photographerIdentity: {
    evidence: PlayerPhotoEvidenceV4;
    name: string;
  };
  photographerRiskEvidence: PlayerPhotoEvidenceV4 & {
    category: PlayerPhotoPhotographerRisk;
    residualRisk: string;
  };
  rightsAttribution: {
    adapterLicense: PlayerPhotoLicenseV4 | null;
    alterationState: {
      disclosure: string;
      presentation: "css-object-fit-cover-crop" | "uncropped";
    };
    copyrightNotice: PlayerPhotoNoticeV4;
    disclaimerNotice: PlayerPhotoNoticeV4;
    licenseBucket: PlayerPhotoLicenseBucketV4;
    otherPerFileNotice: PlayerPhotoNoticeV4;
    workTitle: {
      evidence: string;
      evidenceUrl: string;
      status: "not-supplied" | "supplied";
      text: string | null;
    };
  };
  sourceRevision: {
    checkedAt: string;
    id: number;
    permalink: string;
    timestamp: string;
    title: string;
  };
  sourceRiskClassification: {
    category: "non-event-low-risk";
    nonClearanceStatement: "Low risk is not rights clearance or public-release approval.";
  };
  uploaderIdentity: {
    evidence: PlayerPhotoEvidenceV4;
    name: string;
    relationshipToPhotographer:
      | "authorized-transfer-evidenced"
      | "platform-import-evidenced"
      | "same-person-evidenced";
  };
  upstreamOriginal: {
    evidence: string;
    status: "not-supplied" | "verified";
    url: string | null;
  };
}

export interface PlayerPhotoSvgFallbackSelectionV4 extends PlayerPhotoCommonSelectionV4 {
  coverKind: "original-svg-fallback";
  fallbackProvenance: {
    athleteLikeness: "none";
    copiedTeamOrLeagueMarks: "none";
    createdAt: string;
    createdBy: "professional-sports-injury-atlas";
    embeddedOrLinkedRaster: "none";
    externalFetches: "none";
    originalityBasis: string;
    thirdPartyArtworkOrFonts: "none";
  };
  localFile: {
    byteLength: number;
    height: number;
    mimeType: "image/svg+xml";
    path: string;
    sha256: string;
    width: number;
  };
}

export type PlayerPhotoSelectionV4 =
  PlayerPhotoCommonsSelectionV4 | PlayerPhotoSvgFallbackSelectionV4;

export interface PlayerPhotoRegistryV4 {
  predecessorRegistryBindings: Array<{
    path: string;
    schemaVersion: number;
    sha256: string;
  }>;
  schemaVersion: 4;
  scopeId: typeof PLAYER_PHOTO_REGISTRY_V4_SCOPE_ID;
  selections: PlayerPhotoSelectionV4[];
  sourcePolicyBinding: {
    jsonPath: typeof PLAYER_PHOTO_POLICY_V5_JSON_PATH;
    jsonSha256: typeof PLAYER_PHOTO_POLICY_V5_JSON_SHA256;
    markdownPath: typeof PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH;
    markdownSha256: typeof PLAYER_PHOTO_POLICY_V5_MARKDOWN_SHA256;
    sourcePolicyVersion: "nba-v5";
  };
}

export interface PlayerPhotoRegistryV4ValidationInput {
  expectedAthleteCases?: ReadonlyMap<string, readonly string[]>;
  expectedRegistrySha256: string;
  localAssetBytesByPath: ReadonlyMap<string, Uint8Array>;
  policyJsonBytes: string;
  policyMarkdownBytes: string;
  predecessorRegistryBytesByPath: ReadonlyMap<string, string>;
  registryBytes: string;
}

export interface PlayerPhotoRegistryV4ValidationResult {
  issues: ValidationIssue[];
  registry: PlayerPhotoRegistryV4 | null;
}

const SHA256_RE = /^[a-f0-9]{64}$/u;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/u;
const UTC_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u;
const LOCAL_PHOTO_PATH_RE =
  /^src\/assets\/players\/decision-13\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png)$/u;
const LOCAL_SVG_PATH_RE =
  /^src\/assets\/players\/decision-13\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/u;
const CLEARANCE_CLAIM_RE =
  /\b(?:cleared|approved for publication|safe to publish|permission confirmed|rights clearance)\b|(?:已放行|核准發布|可安全發布|授權完成)/iu;
const COMMERCIAL_AGENCY_RE =
  /(?:^|\b)(?:AP|Associated Press|Getty(?: Images)?|Reuters|Shutterstock|USA Today)(?:\b|$)/iu;
const SVG_FORBIDDEN_RE =
  /<(?:foreignObject|image|script|style|text|use)\b|(?:href|xlink:href)\s*=|data\s*:\s*image|https?:\/\/|@font-face|url\s*\(\s*["']?(?!#)/iu;

const SUPPORTED_LICENSES = [
  ["CC BY 2.0", "cc-by-2.0", "https://creativecommons.org/licenses/by/2.0"],
  ["CC BY 3.0", "cc-by-3.0", "https://creativecommons.org/licenses/by/3.0"],
  ["CC BY 4.0", "cc-by-4.0", "https://creativecommons.org/licenses/by/4.0"],
  [
    "CC BY-SA 2.0",
    "cc-by-sa-2.0",
    "https://creativecommons.org/licenses/by-sa/2.0",
  ],
  [
    "CC BY-SA 3.0",
    "cc-by-sa-3.0",
    "https://creativecommons.org/licenses/by-sa/3.0",
  ],
  [
    "CC BY-SA 4.0",
    "cc-by-sa-4.0",
    "https://creativecommons.org/licenses/by-sa/4.0",
  ],
  ["CC0 1.0", "cc0-1.0", "https://creativecommons.org/publicdomain/zero/1.0/"],
] as const;
const SUPPORTED_LICENSE_KEYS = new Set(
  SUPPORTED_LICENSES.map((row) => row.join("\0")),
);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return (
    Object.keys(value).sort(compareCodePoints).join("\0") ===
    [...expected].sort(compareCodePoints).join("\0")
  );
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() === value && value !== "";
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function safeHttpsUrl(value: unknown, host?: string): URL | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.username === "" &&
      url.password === "" &&
      url.hash === "" &&
      (host === undefined || url.hostname === host)
      ? url
      : null;
  } catch {
    return null;
  }
}

function validEvidence(value: unknown): boolean {
  const evidence = asRecord(value);
  return (
    evidence !== null &&
    hasExactKeys(evidence, ["basis", "checkedAt", "checkedBy", "urls"]) &&
    nonEmptyString(evidence.basis) &&
    !CLEARANCE_CLAIM_RE.test(evidence.basis) &&
    nonEmptyString(evidence.checkedBy) &&
    typeof evidence.checkedAt === "string" &&
    ISO_DATE_RE.test(evidence.checkedAt) &&
    Array.isArray(evidence.urls) &&
    evidence.urls.length > 0 &&
    evidence.urls.every((url) => safeHttpsUrl(url) !== null)
  );
}

function validNotice(value: unknown, revisionPermalink: unknown): boolean {
  const notice = asRecord(value);
  if (notice === null || !hasExactKeys(notice, ["status", "text", "url"])) {
    return false;
  }
  return notice.status === "not-supplied"
    ? notice.text === null && notice.url === null
    : notice.status === "supplied" &&
        nonEmptyString(notice.text) &&
        notice.url === revisionPermalink;
}

function licenseKey(value: unknown): string | null {
  const license = asRecord(value);
  return license !== null && hasExactKeys(license, ["name", "token", "url"])
    ? [license.name, license.token, license.url].join("\0")
    : null;
}

function expectedBucket(token: unknown): PlayerPhotoLicenseBucketV4 | null {
  if (typeof token !== "string") return null;
  if (token.startsWith("cc-by-sa-")) return "cc-by-sa";
  if (token.startsWith("cc-by-")) return "cc-by";
  return token === "cc0-1.0" ? "cc0" : null;
}

function imageDimensions(
  bytes: Uint8Array,
  mimeType: unknown,
): { height: number; width: number } | null {
  const buffer = Buffer.from(bytes);
  if (mimeType === "image/png") {
    const signature = "89504e470d0a1a0a";
    if (
      buffer.length < 24 ||
      buffer.subarray(0, 8).toString("hex") !== signature ||
      buffer.subarray(12, 16).toString("ascii") !== "IHDR"
    ) {
      return null;
    }
    return { height: buffer.readUInt32BE(20), width: buffer.readUInt32BE(16) };
  }
  if (mimeType === "image/svg+xml") {
    const text = buffer.toString("utf8");
    const root = text.match(/<svg\b[^>]*>/iu)?.[0];
    const width = root?.match(/\bwidth=["'](\d+)["']/iu)?.[1];
    const height = root?.match(/\bheight=["'](\d+)["']/iu)?.[1];
    return width !== undefined && height !== undefined
      ? { height: Number(height), width: Number(width) }
      : null;
  }
  if (
    mimeType !== "image/jpeg" ||
    buffer.length < 4 ||
    buffer[0] !== 0xff ||
    buffer[1] !== 0xd8
  ) {
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

function svgContainsForbiddenContent(bytes: Uint8Array): boolean {
  const svg = Buffer.from(bytes)
    .toString("utf8")
    .replace(
      /\sxmlns(?::[a-z0-9_-]+)?=["']http:\/\/www\.w3\.org\/[A-Za-z0-9/._-]+["']/giu,
      "",
    );
  return SVG_FORBIDDEN_RE.test(svg);
}

function svgHasNamespacedDefinitionIds(
  bytes: Uint8Array,
  localPath: string,
): boolean {
  const slug = localPath.match(/\/([a-z0-9]+(?:-[a-z0-9]+)*)\.svg$/u)?.[1];
  if (slug === undefined) return false;
  const svg = Buffer.from(bytes).toString("utf8");
  const ids = [...svg.matchAll(/\bid=["']([^"']+)["']/giu)].map(
    (match) => match[1]!,
  );
  const references = [...svg.matchAll(/url\(\s*#([^)\s]+)\s*\)/giu)].map(
    (match) => match[1]!,
  );
  const idSet = new Set(ids);
  return (
    idSet.size === ids.length &&
    ids.every((id) => id.startsWith(`d13-${slug}-`)) &&
    references.every((reference) => idSet.has(reference))
  );
}

function validateLocalFile(
  value: unknown,
  kind: "commons-photo" | "original-svg-fallback",
  bytesByPath: ReadonlyMap<string, Uint8Array>,
): boolean {
  const file = asRecord(value);
  if (
    file === null ||
    !hasExactKeys(file, [
      "byteLength",
      "height",
      "mimeType",
      "path",
      "sha256",
      "width",
    ]) ||
    !positiveInteger(file.byteLength) ||
    !positiveInteger(file.height) ||
    !positiveInteger(file.width) ||
    typeof file.path !== "string" ||
    typeof file.sha256 !== "string" ||
    !SHA256_RE.test(file.sha256)
  ) {
    return false;
  }
  const pathValid =
    kind === "commons-photo"
      ? LOCAL_PHOTO_PATH_RE.test(file.path) &&
        (file.mimeType === "image/jpeg" || file.mimeType === "image/png")
      : LOCAL_SVG_PATH_RE.test(file.path) && file.mimeType === "image/svg+xml";
  const bytes = bytesByPath.get(file.path);
  const dimensions =
    bytes === undefined ? null : imageDimensions(bytes, file.mimeType);
  return (
    pathValid &&
    bytes !== undefined &&
    bytes.byteLength === file.byteLength &&
    sha256Hex(bytes) === file.sha256 &&
    dimensions?.width === file.width &&
    dimensions.height === file.height
  );
}

export function validatePlayerPhotoRegistryV4(
  input: PlayerPhotoRegistryV4ValidationInput,
): PlayerPhotoRegistryV4ValidationResult {
  const issues: ValidationIssue[] = [];
  let parsed: unknown;
  try {
    parsed = parseStrictJson(input.registryBytes);
  } catch (error) {
    return {
      issues: [
        issue(
          "player-photo-v4-json",
          PLAYER_PHOTO_REGISTRY_V4_PATH,
          error instanceof Error ? error.message : String(error),
        ),
      ],
      registry: null,
    };
  }
  if (canonicalJson(parsed) !== input.registryBytes) {
    issues.push(
      issue(
        "player-photo-v4-canonical",
        PLAYER_PHOTO_REGISTRY_V4_PATH,
        "registry v4 must be canonical JSON without trailing bytes",
      ),
    );
  }
  if (
    !SHA256_RE.test(input.expectedRegistrySha256) ||
    sha256Hex(input.registryBytes) !== input.expectedRegistrySha256
  ) {
    issues.push(
      issue(
        "player-photo-v4-same-version-drift",
        PLAYER_PHOTO_REGISTRY_V4_PATH,
        "registry v4 bytes do not match the frozen same-version digest",
      ),
    );
  }

  const root = asRecord(parsed);
  if (
    root === null ||
    !hasExactKeys(root, [
      "predecessorRegistryBindings",
      "schemaVersion",
      "scopeId",
      "selections",
      "sourcePolicyBinding",
    ]) ||
    root.schemaVersion !== 4 ||
    root.scopeId !== PLAYER_PHOTO_REGISTRY_V4_SCOPE_ID ||
    !Array.isArray(root.predecessorRegistryBindings) ||
    !Array.isArray(root.selections)
  ) {
    issues.push(
      issue(
        "player-photo-v4-schema",
        PLAYER_PHOTO_REGISTRY_V4_PATH,
        "registry v4 root is missing exact schema fields",
      ),
    );
    return { issues, registry: null };
  }

  if (
    canonicalJson(root.predecessorRegistryBindings) !==
    canonicalJson(PLAYER_PHOTO_REGISTRY_PREDECESSORS)
  ) {
    issues.push(
      issue(
        "player-photo-v4-predecessor-drift",
        `${PLAYER_PHOTO_REGISTRY_V4_PATH}.predecessorRegistryBindings`,
        "registry v4 must bind the exact v1, v2, and v3 predecessor bytes",
      ),
    );
  }
  const predecessorV3ByAthlete = new Map<
    string,
    { category: unknown; path: unknown; sha256: unknown }
  >();
  for (const binding of PLAYER_PHOTO_REGISTRY_PREDECESSORS) {
    const bytes = input.predecessorRegistryBytesByPath.get(binding.path);
    if (bytes === undefined || sha256Hex(bytes) !== binding.sha256) {
      issues.push(
        issue(
          "player-photo-v4-predecessor-drift",
          binding.path,
          `frozen registry v${binding.schemaVersion} bytes drifted`,
        ),
      );
    }
    if (binding.schemaVersion === 3 && bytes !== undefined) {
      try {
        const v3 = asRecord(parseStrictJson(bytes));
        const assets = Array.isArray(v3?.assets) ? v3.assets : [];
        for (const unknownAsset of assets) {
          const asset = asRecord(unknownAsset);
          const localFile = asRecord(asset?.localFile);
          const sourceRisk = asRecord(asset?.sourceRiskClassification);
          if (nonEmptyString(asset?.athleteName)) {
            predecessorV3ByAthlete.set(asset.athleteName, {
              category: sourceRisk?.category,
              path: localFile?.path,
              sha256: localFile?.sha256,
            });
          }
        }
      } catch {
        issues.push(
          issue(
            "player-photo-v4-predecessor-drift",
            binding.path,
            "frozen registry v3 must remain strict JSON for supersession binding",
          ),
        );
      }
    }
  }

  const expectedPolicyBinding = {
    jsonPath: PLAYER_PHOTO_POLICY_V5_JSON_PATH,
    jsonSha256: PLAYER_PHOTO_POLICY_V5_JSON_SHA256,
    markdownPath: PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH,
    markdownSha256: PLAYER_PHOTO_POLICY_V5_MARKDOWN_SHA256,
    sourcePolicyVersion: "nba-v5",
  };
  if (
    sha256Hex(input.policyJsonBytes) !== PLAYER_PHOTO_POLICY_V5_JSON_SHA256 ||
    sha256Hex(input.policyMarkdownBytes) !==
      PLAYER_PHOTO_POLICY_V5_MARKDOWN_SHA256 ||
    canonicalJson(root.sourcePolicyBinding) !==
      canonicalJson(expectedPolicyBinding)
  ) {
    issues.push(
      issue(
        "player-photo-v4-policy-binding",
        `${PLAYER_PHOTO_REGISTRY_V4_PATH}.sourcePolicyBinding`,
        "registry v4 must bind the exact immutable nba-v5 policy pair",
      ),
    );
  }

  const seenAthletes = new Set<string>();
  const seenCases = new Set<string>();
  const seenPaths = new Set<string>();
  let priorAthlete = "";
  for (const [index, unknownSelection] of root.selections.entries()) {
    const location = `${PLAYER_PHOTO_REGISTRY_V4_PATH}.selections[${index}]`;
    const selection = asRecord(unknownSelection);
    if (selection === null) {
      issues.push(
        issue(
          "player-photo-v4-selection-schema",
          location,
          "selection must be an object",
        ),
      );
      continue;
    }
    const kind = selection.coverKind;
    const commonKeys = [
      "athleteName",
      "caseIds",
      "coverKind",
      "currentCoverStatus",
      "focalPosition",
      "localFile",
      "nonEventCaption",
      "supersession",
    ];
    const expectedKeys =
      kind === "commons-photo"
        ? [
            ...commonKeys,
            "commonsDescriptionUrl",
            "commonsDownloadUrl",
            "cropValidation",
            "identityEvidence",
            "license",
            "occasionEvidence",
            "photographerIdentity",
            "photographerRiskEvidence",
            "rightsAttribution",
            "sourceRevision",
            "sourceRiskClassification",
            "uploaderIdentity",
            "upstreamOriginal",
          ]
        : kind === "original-svg-fallback"
          ? [...commonKeys, "fallbackProvenance"]
          : [];
    if (expectedKeys.length === 0 || !hasExactKeys(selection, expectedKeys)) {
      issues.push(
        issue(
          "player-photo-v4-selection-schema",
          location,
          "selection must be an exact Commons-photo or original-SVG record",
        ),
      );
      continue;
    }

    const athleteName = selection.athleteName;
    const caseIds = selection.caseIds;
    if (
      !nonEmptyString(athleteName) ||
      seenAthletes.has(athleteName) ||
      (priorAthlete !== "" &&
        compareCodePoints(priorAthlete, athleteName) >= 0) ||
      !Array.isArray(caseIds) ||
      caseIds.length === 0 ||
      !caseIds.every(nonEmptyString) ||
      new Set(caseIds).size !== caseIds.length ||
      caseIds.join("\0") !== [...caseIds].sort(compareCodePoints).join("\0") ||
      caseIds.some((caseId) => seenCases.has(caseId))
    ) {
      issues.push(
        issue(
          "player-photo-v4-case-mapping",
          location,
          "athlete and case mappings must be unique, non-empty, and code-point sorted",
        ),
      );
    } else {
      seenAthletes.add(athleteName);
      for (const caseId of caseIds) seenCases.add(caseId);
      priorAthlete = athleteName;
      const expectedCases = input.expectedAthleteCases?.get(athleteName);
      if (
        expectedCases !== undefined &&
        canonicalJson(caseIds) !==
          canonicalJson([...expectedCases].sort(compareCodePoints))
      ) {
        issues.push(
          issue(
            "player-photo-v4-case-mapping",
            `${location}.caseIds`,
            "case IDs do not match the frozen athlete mapping",
          ),
        );
      }
    }
    if (
      input.expectedAthleteCases !== undefined &&
      !input.expectedAthleteCases.has(String(athleteName))
    ) {
      issues.push(
        issue(
          "player-photo-v4-case-mapping",
          `${location}.athleteName`,
          "athlete is absent from the frozen case mapping",
        ),
      );
    }
    if (selection.currentCoverStatus !== "current") {
      issues.push(
        issue(
          "player-photo-v4-current-cover",
          `${location}.currentCoverStatus`,
          "every registry v4 selection must be the current cover",
        ),
      );
    }
    const focalPosition = asRecord(selection.focalPosition);
    if (
      focalPosition === null ||
      !hasExactKeys(focalPosition, ["xPercent", "yPercent"]) ||
      typeof focalPosition.xPercent !== "number" ||
      typeof focalPosition.yPercent !== "number" ||
      focalPosition.xPercent < 0 ||
      focalPosition.xPercent > 100 ||
      focalPosition.yPercent < 0 ||
      focalPosition.yPercent > 100 ||
      !nonEmptyString(selection.nonEventCaption)
    ) {
      issues.push(
        issue(
          "player-photo-v4-presentation",
          location,
          "current cover must carry safe focal coordinates and a non-event caption",
        ),
      );
    }

    const supersession = asRecord(selection.supersession);
    const predecessor = nonEmptyString(athleteName)
      ? predecessorV3ByAthlete.get(athleteName)
      : undefined;
    const expectedSupersessionReasons =
      predecessor?.category === "game-action-high-risk"
        ? ["replaces-game-action-high-risk"]
        : predecessor?.category === "non-event-low-risk"
          ? [
              "replaces-existing-non-event-after-revalidation",
              "revalidates-existing-non-event",
            ]
          : [];
    if (
      supersession === null ||
      !hasExactKeys(supersession, [
        "previousLocalFilePath",
        "previousLocalFileSha256",
        "reason",
      ]) ||
      !nonEmptyString(supersession.previousLocalFilePath) ||
      typeof supersession.previousLocalFileSha256 !== "string" ||
      !SHA256_RE.test(supersession.previousLocalFileSha256) ||
      ![
        "replaces-existing-non-event-after-revalidation",
        "replaces-game-action-high-risk",
        "revalidates-existing-non-event",
      ].includes(String(supersession.reason)) ||
      predecessor === undefined ||
      supersession.previousLocalFilePath !== predecessor.path ||
      supersession.previousLocalFileSha256 !== predecessor.sha256 ||
      !expectedSupersessionReasons.includes(String(supersession.reason))
    ) {
      issues.push(
        issue(
          "player-photo-v4-supersession",
          `${location}.supersession`,
          "selection must retain the exact superseded local cover and reason",
        ),
      );
    }

    const localFile = asRecord(selection.localFile);
    if (
      !validateLocalFile(
        selection.localFile,
        kind as "commons-photo" | "original-svg-fallback",
        input.localAssetBytesByPath,
      )
    ) {
      issues.push(
        issue(
          kind === "original-svg-fallback"
            ? "player-photo-v4-svg-bytes"
            : "player-photo-v4-local-photo",
          `${location}.localFile`,
          "current cover must bind safe verified local bytes and dimensions",
        ),
      );
    }
    if (typeof localFile?.path === "string") {
      if (seenPaths.has(localFile.path)) {
        issues.push(
          issue(
            "player-photo-v4-local-path",
            `${location}.localFile.path`,
            "local current-cover paths must be unique",
          ),
        );
      }
      seenPaths.add(localFile.path);
    }

    if (kind === "original-svg-fallback") {
      const provenance = asRecord(selection.fallbackProvenance);
      if (
        provenance === null ||
        !hasExactKeys(provenance, [
          "athleteLikeness",
          "copiedTeamOrLeagueMarks",
          "createdAt",
          "createdBy",
          "embeddedOrLinkedRaster",
          "externalFetches",
          "originalityBasis",
          "thirdPartyArtworkOrFonts",
        ]) ||
        provenance.athleteLikeness !== "none" ||
        provenance.copiedTeamOrLeagueMarks !== "none" ||
        provenance.createdBy !== "professional-sports-injury-atlas" ||
        typeof provenance.createdAt !== "string" ||
        !ISO_DATE_RE.test(provenance.createdAt) ||
        provenance.embeddedOrLinkedRaster !== "none" ||
        provenance.externalFetches !== "none" ||
        !nonEmptyString(provenance.originalityBasis) ||
        provenance.thirdPartyArtworkOrFonts !== "none"
      ) {
        issues.push(
          issue(
            "player-photo-v4-svg-provenance",
            `${location}.fallbackProvenance`,
            "SVG fallback must carry exact site-owned, no-third-party provenance",
          ),
        );
      }
      const svgBytes =
        typeof localFile?.path === "string"
          ? input.localAssetBytesByPath.get(localFile.path)
          : undefined;
      if (svgBytes === undefined || svgContainsForbiddenContent(svgBytes)) {
        issues.push(
          issue(
            "player-photo-v4-svg-third-party-content",
            `${location}.localFile.path`,
            "SVG fallback contains a linked/embedded raster, external fetch, script, text/font, use, style, or foreign object",
          ),
        );
      }
      if (
        svgBytes === undefined ||
        typeof localFile?.path !== "string" ||
        !svgHasNamespacedDefinitionIds(svgBytes, localFile.path)
      ) {
        issues.push(
          issue(
            "player-photo-v4-svg-definition-id",
            `${location}.localFile.path`,
            "inline SVG definition IDs must use the asset slug namespace and all local fragment references must resolve",
          ),
        );
      }
      continue;
    }

    const descriptionUrl = safeHttpsUrl(
      selection.commonsDescriptionUrl,
      "commons.wikimedia.org",
    );
    const downloadUrl = safeHttpsUrl(
      selection.commonsDownloadUrl,
      "upload.wikimedia.org",
    );
    if (
      descriptionUrl === null ||
      !descriptionUrl.pathname.startsWith("/wiki/File:") ||
      descriptionUrl.search !== "" ||
      downloadUrl === null ||
      !downloadUrl.pathname.startsWith("/wikipedia/commons/") ||
      downloadUrl.pathname.includes("/thumb/") ||
      downloadUrl.search !== ""
    ) {
      issues.push(
        issue(
          "player-photo-v4-source-url",
          location,
          "source URLs must be fixed Commons metadata and original-download URLs",
        ),
      );
    }

    const revision = asRecord(selection.sourceRevision);
    const revisionPermalink = safeHttpsUrl(
      revision?.permalink,
      "commons.wikimedia.org",
    );
    const descriptionTitle =
      descriptionUrl === null
        ? null
        : decodeURIComponent(
            descriptionUrl.pathname.slice("/wiki/".length),
          ).replaceAll("_", " ");
    const permalinkTitle = revisionPermalink?.searchParams
      .get("title")
      ?.replaceAll("_", " ");
    const permalinkKeys =
      revisionPermalink === null
        ? []
        : [...revisionPermalink.searchParams.keys()].sort(compareCodePoints);
    if (
      revision === null ||
      !hasExactKeys(revision, [
        "checkedAt",
        "id",
        "permalink",
        "timestamp",
        "title",
      ]) ||
      typeof revision.checkedAt !== "string" ||
      !ISO_DATE_RE.test(revision.checkedAt) ||
      !positiveInteger(revision.id) ||
      revisionPermalink === null ||
      revisionPermalink.pathname !== "/w/index.php" ||
      revisionPermalink.searchParams.get("oldid") !== String(revision.id) ||
      permalinkKeys.join("\0") !== "oldid\0title" ||
      !nonEmptyString(revision.timestamp) ||
      !UTC_TIMESTAMP_RE.test(revision.timestamp) ||
      !nonEmptyString(revision.title) ||
      !revision.title.startsWith("File:") ||
      revision.title.replaceAll("_", " ") !== descriptionTitle ||
      revision.title.replaceAll("_", " ") !== permalinkTitle
    ) {
      issues.push(
        issue(
          "player-photo-v4-source-revision",
          `${location}.sourceRevision`,
          "photo must bind a complete fixed Commons revision",
        ),
      );
    }

    const upstream = asRecord(selection.upstreamOriginal);
    if (
      upstream === null ||
      !hasExactKeys(upstream, ["evidence", "status", "url"]) ||
      !nonEmptyString(upstream.evidence) ||
      (upstream.status === "not-supplied"
        ? upstream.url !== null
        : upstream.status !== "verified" || safeHttpsUrl(upstream.url) === null)
    ) {
      issues.push(
        issue(
          "player-photo-v4-upstream",
          `${location}.upstreamOriginal`,
          "upstream original must retain a verified URL or an evidence-backed not-supplied state",
        ),
      );
    }

    const identity = asRecord(selection.identityEvidence);
    const occasion = asRecord(selection.occasionEvidence);
    const photographerIdentity = asRecord(selection.photographerIdentity);
    const photographerRisk = asRecord(selection.photographerRiskEvidence);
    const uploader = asRecord(selection.uploaderIdentity);
    const { status: _identityStatus, ...identityEvidence } = identity ?? {};
    if (
      identity === null ||
      !hasExactKeys(identity, [
        "basis",
        "checkedAt",
        "checkedBy",
        "status",
        "urls",
      ]) ||
      identity.status !== "verified" ||
      !validEvidence(identityEvidence)
    ) {
      issues.push(
        issue(
          "player-photo-v4-identity-evidence",
          `${location}.identityEvidence`,
          "accepted photo needs complete verified athlete-identity evidence",
        ),
      );
    }
    const { category: _occasionCategory, ...occasionEvidence } = occasion ?? {};
    if (
      occasion === null ||
      !hasExactKeys(occasion, [
        "basis",
        "category",
        "checkedAt",
        "checkedBy",
        "urls",
      ]) ||
      !PLAYER_PHOTO_ACCEPTED_OCCASIONS.includes(
        occasion.category as PlayerPhotoOccasion,
      ) ||
      !validEvidence(occasionEvidence)
    ) {
      issues.push(
        issue(
          "player-photo-v4-occasion-evidence",
          `${location}.occasionEvidence`,
          "current photo must have evidence for an accepted non-event occasion",
        ),
      );
    }
    if (
      photographerIdentity === null ||
      !hasExactKeys(photographerIdentity, ["evidence", "name"]) ||
      !nonEmptyString(photographerIdentity.name) ||
      COMMERCIAL_AGENCY_RE.test(photographerIdentity.name) ||
      !validEvidence(photographerIdentity.evidence)
    ) {
      issues.push(
        issue(
          "player-photo-v4-photographer-evidence",
          `${location}.photographerIdentity`,
          "current photo must bind an evidence-backed photographer identity",
        ),
      );
    }
    const {
      category: _riskCategory,
      residualRisk: _residual,
      ...riskEvidence
    } = photographerRisk ?? {};
    if (
      photographerRisk === null ||
      !hasExactKeys(photographerRisk, [
        "basis",
        "category",
        "checkedAt",
        "checkedBy",
        "residualRisk",
        "urls",
      ]) ||
      !PLAYER_PHOTO_ACCEPTED_PHOTOGRAPHER_RISKS.includes(
        photographerRisk.category as PlayerPhotoPhotographerRisk,
      ) ||
      !nonEmptyString(photographerRisk.residualRisk) ||
      CLEARANCE_CLAIM_RE.test(photographerRisk.residualRisk) ||
      !validEvidence(riskEvidence)
    ) {
      issues.push(
        issue(
          "player-photo-v4-photographer-evidence",
          `${location}.photographerRiskEvidence`,
          "current photo must separately retain accepted photographer/provenance risk evidence",
        ),
      );
    }
    if (
      uploader === null ||
      !hasExactKeys(uploader, [
        "evidence",
        "name",
        "relationshipToPhotographer",
      ]) ||
      !nonEmptyString(uploader.name) ||
      COMMERCIAL_AGENCY_RE.test(uploader.name) ||
      ![
        "authorized-transfer-evidenced",
        "platform-import-evidenced",
        "same-person-evidenced",
      ].includes(String(uploader.relationshipToPhotographer)) ||
      !validEvidence(uploader.evidence)
    ) {
      issues.push(
        issue(
          "player-photo-v4-uploader-evidence",
          `${location}.uploaderIdentity`,
          "uploader identity and its evidenced relationship to the photographer are required",
        ),
      );
    }

    const risk = asRecord(selection.sourceRiskClassification);
    if (
      risk === null ||
      !hasExactKeys(risk, ["category", "nonClearanceStatement"]) ||
      risk.category !== "non-event-low-risk" ||
      risk.nonClearanceStatement !==
        "Low risk is not rights clearance or public-release approval."
    ) {
      issues.push(
        issue(
          "player-photo-v4-high-risk-current-cover",
          `${location}.sourceRiskClassification`,
          "game-action, unresolved, or clearance-claiming photos cannot be current covers",
        ),
      );
    }

    const license = asRecord(selection.license);
    const key = licenseKey(license);
    if (key === null || !SUPPORTED_LICENSE_KEYS.has(key)) {
      issues.push(
        issue(
          "player-photo-v4-license",
          `${location}.license`,
          "photo license is unsupported or does not match an exact versioned pair",
        ),
      );
    }
    const rights = asRecord(selection.rightsAttribution);
    if (
      rights === null ||
      !hasExactKeys(rights, [
        "adapterLicense",
        "alterationState",
        "copyrightNotice",
        "disclaimerNotice",
        "licenseBucket",
        "otherPerFileNotice",
        "workTitle",
      ])
    ) {
      issues.push(
        issue(
          "player-photo-v4-rights-schema",
          `${location}.rightsAttribution`,
          "photo must retain the exact v4 rights-attribution semantics",
        ),
      );
      continue;
    }
    const bucket = expectedBucket(license?.token);
    if (bucket === null || rights.licenseBucket !== bucket) {
      issues.push(
        issue(
          "player-photo-v4-license-bucket",
          `${location}.rightsAttribution.licenseBucket`,
          "license bucket must match the exact BY, BY-SA, or CC0 token",
        ),
      );
    }
    if (
      bucket === "cc-by-sa"
        ? licenseKey(rights.adapterLicense) !== key
        : rights.adapterLicense !== null
    ) {
      issues.push(
        issue(
          "player-photo-v4-adapter-license",
          `${location}.rightsAttribution.adapterLicense`,
          "only BY-SA crops require the same exact linked Adapter's License",
        ),
      );
    }
    const title = asRecord(rights.workTitle);
    if (
      title === null ||
      !hasExactKeys(title, ["evidence", "evidenceUrl", "status", "text"]) ||
      !nonEmptyString(title.evidence) ||
      safeHttpsUrl(title.evidenceUrl) === null ||
      (title.status === "not-supplied"
        ? title.text !== null
        : title.status !== "supplied" || !nonEmptyString(title.text))
    ) {
      issues.push(
        issue(
          "player-photo-v4-work-title",
          `${location}.rightsAttribution.workTitle`,
          "work title must be supplied or explicitly evidence-backed as not supplied",
        ),
      );
    }
    if (
      !validNotice(rights.copyrightNotice, revision?.permalink) ||
      !validNotice(rights.disclaimerNotice, revision?.permalink) ||
      !validNotice(rights.otherPerFileNotice, revision?.permalink)
    ) {
      issues.push(
        issue(
          "player-photo-v4-notice-state",
          `${location}.rightsAttribution`,
          "each copyright, disclaimer, and per-file notice needs an exact retention state",
        ),
      );
    }
    const alteration = asRecord(rights.alterationState);
    if (
      alteration === null ||
      !hasExactKeys(alteration, ["disclosure", "presentation"]) ||
      !nonEmptyString(alteration.disclosure) ||
      (alteration.presentation !== "css-object-fit-cover-crop" &&
        alteration.presentation !== "uncropped")
    ) {
      issues.push(
        issue(
          "player-photo-v4-alteration",
          `${location}.rightsAttribution.alterationState`,
          "alteration and presentation-crop state must remain explicit",
        ),
      );
    }
    const crop = asRecord(selection.cropValidation);
    const ratios = Array.isArray(crop?.ratios) ? crop.ratios.map(asRecord) : [];
    if (
      crop === null ||
      !hasExactKeys(crop, ["checkedAt", "checkedBy", "ratios"]) ||
      typeof crop.checkedAt !== "string" ||
      !ISO_DATE_RE.test(crop.checkedAt) ||
      !nonEmptyString(crop.checkedBy) ||
      ratios.length !== 2 ||
      ratios[0]?.aspectRatio !== "5:2" ||
      ratios[0]?.subjectSafe !== true ||
      ratios[1]?.aspectRatio !== "16:9" ||
      ratios[1]?.subjectSafe !== true
    ) {
      issues.push(
        issue(
          "player-photo-v4-crop",
          `${location}.cropValidation`,
          "both current-cover crop ratios need named subject-safe checks",
        ),
      );
    }
  }

  if (input.expectedAthleteCases !== undefined) {
    const expectedAthletes = [...input.expectedAthleteCases.keys()];
    const expectedCases = expectedAthletes.flatMap((athlete) => [
      ...(input.expectedAthleteCases?.get(athlete) ?? []),
    ]);
    if (
      expectedAthletes.some((athlete) => !seenAthletes.has(athlete)) ||
      expectedCases.some((caseId) => !seenCases.has(caseId)) ||
      seenAthletes.size !== expectedAthletes.length ||
      seenCases.size !== expectedCases.length
    ) {
      issues.push(
        issue(
          "player-photo-v4-case-partition",
          `${PLAYER_PHOTO_REGISTRY_V4_PATH}.selections`,
          "selections must exactly partition the frozen athlete/case mapping",
        ),
      );
    }
  }

  return { issues, registry: parsed as PlayerPhotoRegistryV4 };
}
