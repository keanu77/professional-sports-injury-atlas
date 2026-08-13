/**
 * Fail-closed verifier for the Decision 7 Wikimedia Commons player-photo
 * inventory. It validates canonical provenance, the exact 26-case athlete
 * partition, free-license pairs, Commons-only URLs, original JPEG bytes,
 * human crop declarations, Decision 11 attribution/source-risk facts,
 * append-only v1→v2→v3 registry lineage, and both immutable nba-v4 policy
 * digests.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  canonicalJson,
  compareCodePoints,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "../src/lib/contracts/canonical";
import {
  HISTORICAL_PLAYER_PHOTO_REGISTRY_V1_PATH,
  PLAYER_PHOTO_NON_EVENT_CAPTION,
  PLAYER_PHOTO_POLICY_JSON_PATH,
  PLAYER_PHOTO_POLICY_MARKDOWN_PATH,
  PLAYER_PHOTO_POLICY_VERSION,
  PLAYER_PHOTO_REGISTRY_PATH,
  PLAYER_PHOTO_SCOPE_ID,
  PLAYER_PHOTO_SOURCE_CLASSIFICATION,
  PLAYER_PHOTO_SOURCE_RISK_CHECKED_AT,
  PLAYER_PHOTO_SOURCE_RISK_DISCLAIMER,
  PREVIOUS_PLAYER_PHOTO_REGISTRY_PATH,
  type PlayerPhotoLicenseBucket,
  type PlayerPhotoRegistryV3,
} from "../src/lib/contracts/player-photo";
import {
  PLAYER_PHOTO_POLICY_V5_JSON_PATH,
  PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH,
  PLAYER_PHOTO_REGISTRY_PREDECESSORS,
  PLAYER_PHOTO_REGISTRY_V4_PATH,
  PLAYER_PHOTO_REGISTRY_V4_SHA256,
  validatePlayerPhotoRegistryV4,
  type PlayerPhotoRegistryV4,
} from "../src/lib/contracts/player-photo-registry-v4";

const EXPECTED_ATHLETE_COUNT = 21;
const EXPECTED_CASE_COUNT = 26;
const EXPECTED_DOWNLOAD_DATE = "2026-08-09";
const EXPECTED_RIGHTS_CHECK_DATE = "2026-08-12";
const EXPECTED_CHECKER = "atlas-commons-player-photo-covers";
const EXPECTED_CURRENT_REGISTRY_SHA256 =
  "d91e97aa34e347375dd5ca14cf961208ae4b2c43cc8a90a01bea49f1172a3c05";
const EXPECTED_PREVIOUS_REGISTRY_SHA256 =
  "0fa9a14660d798b32586047eaec1a0fc14912ca8710aaccc83963ac4f9dc28d0";
const EXPECTED_HISTORICAL_REGISTRY_V1_SHA256 =
  "770a7e6d7f13ecd0dda17a629b13f179357b9c64ebc268404a5640ad9aa08eec";
const SHA256_RE = /^[a-f0-9]{64}$/u;
const SHA1_RE = /^[a-f0-9]{40}$/u;
const SAFE_LOCAL_PATH_RE =
  /^src\/assets\/players\/[a-z0-9]+(?:-[a-z0-9]+)*\.jpg$/u;
const IMAGE_FILE_RE = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|tiff?|webp)$/iu;
const NEWS_AGENCY_RE =
  /(?:^|\b)(?:AP|Associated Press|Getty|Reuters|USA Today)(?:\b|$)/iu;
const ALLOWED_RESTRICTIONS = new Set(["personality"]);
const EXPECTED_LOW_RISK_ATHLETES = new Set(["Dwight Powell", "Trae Young"]);
const CLEARANCE_CLAIM_RE =
  /\b(?:cleared|clearance granted|approved for publication|safe to publish|licensed for publication|publication permission confirmed|permission (?:is )?(?:confirmed|granted)|authorized for (?:publication|public use))\b|(?:已放行|授權完成|核准發布|可安全發布|已獲授權|允許公開使用)/iu;

interface CaseIdentity {
  athleteName: string;
  caseId: string;
}

export interface PlayerPhotoValidationInput {
  actualImagePaths: string[];
  assetBytesByPath: Map<string, Buffer>;
  cases: CaseIdentity[];
  historicalRegistryV1Bytes: string | null;
  policyJsonBytes: string | null;
  policyMarkdownBytes: string | null;
  previousRegistryBytes: string | null;
  registryBytes: string | null;
}

export interface PlayerPhotoAssetLoadResult {
  allowedPaths: string[];
  issues: ValidationIssue[];
  registry: PlayerPhotoRegistryV3 | null;
  currentRegistry?: PlayerPhotoRegistryV4 | null;
}

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
    [...Object.keys(value)].sort(compareCodePoints).join("\0") ===
    [...expected].sort(compareCodePoints).join("\0")
  );
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() === value && value !== "";
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function exactStringArray(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function readJpegDimensions(bytes: Buffer): {
  height: number;
  width: number;
} | null {
  if (
    bytes.length < 4 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes.at(-2) !== 0xff ||
    bytes.at(-1) !== 0xd9
  ) {
    return null;
  }
  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;
    const marker = bytes[offset]!;
    offset += 1;
    if (marker === 0xd8 || marker === 0x01) continue;
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > bytes.length) return null;
    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
    if (startOfFrameMarkers.has(marker)) {
      if (segmentLength < 7) return null;
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
      };
    }
    offset += segmentLength;
  }
  return null;
}

function walkFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const paths: string[] = [];
  for (const entry of readdirSync(directory).sort(compareCodePoints)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) paths.push(...walkFiles(path));
    else paths.push(path);
  }
  return paths;
}

export function readPlayerPhotoValidationInput(
  root: string,
): PlayerPhotoValidationInput {
  const playerDirectory = join(root, "src/assets/players");
  const allPlayerFiles = walkFiles(playerDirectory).map((path) =>
    relative(root, path),
  );
  const actualImagePaths = allPlayerFiles.filter((path) =>
    IMAGE_FILE_RE.test(path),
  );
  const assetBytesByPath = new Map<string, Buffer>();
  for (const path of actualImagePaths) {
    assetBytesByPath.set(path, readFileSync(join(root, path)));
  }
  const cases: CaseIdentity[] = [];
  const caseDirectory = join(root, "src/content/cases");
  if (existsSync(caseDirectory)) {
    for (const filename of readdirSync(caseDirectory).sort(compareCodePoints)) {
      if (!filename.endsWith(".json")) continue;
      try {
        const value = JSON.parse(
          readFileSync(join(caseDirectory, filename), "utf8"),
        ) as { athlete?: { name?: unknown }; id?: unknown };
        if (
          typeof value.id !== "string" ||
          typeof value.athlete?.name !== "string"
        ) {
          continue;
        }
        cases.push({ athleteName: value.athlete.name, caseId: value.id });
      } catch {
        // The clinical content checker owns malformed case JSON diagnostics.
      }
    }
  }
  return {
    actualImagePaths,
    assetBytesByPath,
    cases,
    historicalRegistryV1Bytes: existsSync(
      join(root, HISTORICAL_PLAYER_PHOTO_REGISTRY_V1_PATH),
    )
      ? readFileSync(
          join(root, HISTORICAL_PLAYER_PHOTO_REGISTRY_V1_PATH),
          "utf8",
        )
      : null,
    policyJsonBytes: existsSync(join(root, PLAYER_PHOTO_POLICY_JSON_PATH))
      ? readFileSync(join(root, PLAYER_PHOTO_POLICY_JSON_PATH), "utf8")
      : null,
    policyMarkdownBytes: existsSync(
      join(root, PLAYER_PHOTO_POLICY_MARKDOWN_PATH),
    )
      ? readFileSync(join(root, PLAYER_PHOTO_POLICY_MARKDOWN_PATH), "utf8")
      : null,
    previousRegistryBytes: existsSync(
      join(root, PREVIOUS_PLAYER_PHOTO_REGISTRY_PATH),
    )
      ? readFileSync(join(root, PREVIOUS_PLAYER_PHOTO_REGISTRY_PATH), "utf8")
      : null,
    registryBytes: existsSync(join(root, PLAYER_PHOTO_REGISTRY_PATH))
      ? readFileSync(join(root, PLAYER_PHOTO_REGISTRY_PATH), "utf8")
      : null,
  };
}

function safeHttpsUrl(value: unknown, host: string): URL | null {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" &&
      parsed.hostname === host &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.hash === ""
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function safeEvidenceUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" &&
      (parsed.hostname === "commons.wikimedia.org" ||
        parsed.hostname === "www.flickr.com") &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.hash === ""
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function expectedLicenseBucket(
  token: unknown,
): PlayerPhotoLicenseBucket | null {
  if (typeof token !== "string") return null;
  if (token.startsWith("cc-by-sa-")) return "cc-by-sa";
  if (token.startsWith("cc-by-")) return "cc-by";
  if (token === "cc0-1.0") return "cc0";
  return null;
}

function validNotice(value: unknown, revisionPermalink: unknown): boolean {
  const notice = asRecord(value);
  if (notice === null || !hasExactKeys(notice, ["status", "text", "url"])) {
    return false;
  }
  if (notice.status === "not-supplied") {
    return notice.text === null && notice.url === null;
  }
  return (
    notice.status === "supplied" &&
    nonEmptyString(notice.text) &&
    notice.url === revisionPermalink
  );
}

function normalizedCommonsTitle(value: string): string {
  return value.replaceAll("_", " ");
}

function projectV1CompatibleAsset(
  value: unknown,
  removeRightsAttribution: boolean,
): unknown {
  const record = asRecord(value);
  if (record === null) return value;
  return Object.fromEntries(
    Object.entries(record).filter(
      ([key]) =>
        key !== "sourcePolicyBinding" &&
        (!removeRightsAttribution || key !== "rightsAttribution"),
    ),
  );
}

function projectV2CompatibleAsset(value: unknown): unknown {
  const record = asRecord(value);
  if (record === null) return value;
  return Object.fromEntries(
    Object.entries(record).filter(
      ([key]) => key !== "sourceRiskClassification",
    ),
  );
}

export function validatePlayerPhotoAssets(
  input: PlayerPhotoValidationInput,
): PlayerPhotoAssetLoadResult {
  const issues: ValidationIssue[] = [];
  const allowedPaths = new Set<string>();
  if (input.registryBytes === null) {
    return {
      allowedPaths: [],
      issues: [
        issue(
          "player-photo-registry-missing",
          PLAYER_PHOTO_REGISTRY_PATH,
          "the governed player-photo registry is missing",
        ),
      ],
      registry: null,
    };
  }
  if (input.policyJsonBytes === null || input.policyMarkdownBytes === null) {
    return {
      allowedPaths: [],
      issues: [
        issue(
          "player-photo-policy-missing",
          PLAYER_PHOTO_REGISTRY_PATH,
          "the nba-v4 source-policy bytes are missing",
        ),
      ],
      registry: null,
    };
  }
  if (
    input.previousRegistryBytes === null ||
    input.historicalRegistryV1Bytes === null
  ) {
    return {
      allowedPaths: [],
      issues: [
        issue(
          "player-photo-registry-lineage",
          PLAYER_PHOTO_REGISTRY_PATH,
          "an immutable v1/v2 player-photo lineage registry is missing",
        ),
      ],
      registry: null,
    };
  }

  let parsed: unknown;
  try {
    parsed = parseStrictJson(input.registryBytes);
  } catch (error) {
    return {
      allowedPaths: [],
      issues: [
        issue(
          "player-photo-registry-json",
          PLAYER_PHOTO_REGISTRY_PATH,
          error instanceof Error ? error.message : String(error),
        ),
      ],
      registry: null,
    };
  }
  if (canonicalJson(parsed) !== input.registryBytes) {
    issues.push(
      issue(
        "player-photo-registry-canonical",
        PLAYER_PHOTO_REGISTRY_PATH,
        "player-photo registry must be canonical JSON without a trailing newline",
      ),
    );
  }
  if (sha256Hex(input.registryBytes) !== EXPECTED_CURRENT_REGISTRY_SHA256) {
    issues.push(
      issue(
        "player-photo-registry-digest",
        PLAYER_PHOTO_REGISTRY_PATH,
        "the immutable Decision 11 registry v3 bytes do not match the audited digest",
      ),
    );
  }
  const registryRecord = asRecord(parsed);
  if (
    registryRecord === null ||
    !hasExactKeys(registryRecord, [
      "assets",
      "fallbacks",
      "previousRegistryBinding",
      "schemaVersion",
      "scopeId",
    ]) ||
    registryRecord.schemaVersion !== 3 ||
    registryRecord.scopeId !== PLAYER_PHOTO_SCOPE_ID ||
    !Array.isArray(registryRecord.assets) ||
    !Array.isArray(registryRecord.fallbacks)
  ) {
    issues.push(
      issue(
        "player-photo-registry-schema",
        PLAYER_PHOTO_REGISTRY_PATH,
        "player-photo registry root is missing exact schema fields",
      ),
    );
    return { allowedPaths: [], issues, registry: null };
  }
  const registry = parsed as PlayerPhotoRegistryV3;
  const previousRegistrySha256 = sha256Hex(input.previousRegistryBytes);
  const historicalRegistryV1Sha256 = sha256Hex(input.historicalRegistryV1Bytes);
  let previousRegistryRecord: Record<string, unknown> | null = null;
  try {
    const previousParsed = parseStrictJson(input.previousRegistryBytes);
    previousRegistryRecord = asRecord(previousParsed);
    if (
      previousRegistrySha256 !== EXPECTED_PREVIOUS_REGISTRY_SHA256 ||
      canonicalJson(previousParsed) !== input.previousRegistryBytes ||
      previousRegistryRecord === null ||
      !hasExactKeys(previousRegistryRecord, [
        "assets",
        "fallbacks",
        "previousRegistryBinding",
        "schemaVersion",
        "scopeId",
      ]) ||
      previousRegistryRecord.schemaVersion !== 2 ||
      previousRegistryRecord.scopeId !== PLAYER_PHOTO_SCOPE_ID ||
      !Array.isArray(previousRegistryRecord.assets) ||
      !Array.isArray(previousRegistryRecord.fallbacks)
    ) {
      issues.push(
        issue(
          "player-photo-registry-lineage",
          PREVIOUS_PLAYER_PHOTO_REGISTRY_PATH,
          "the previous registry v2 bytes must match the frozen canonical digest and schema",
        ),
      );
      previousRegistryRecord = null;
    }
  } catch {
    issues.push(
      issue(
        "player-photo-registry-lineage",
        PREVIOUS_PLAYER_PHOTO_REGISTRY_PATH,
        "the previous registry v2 must remain valid canonical JSON",
      ),
    );
  }

  let historicalRegistryV1Record: Record<string, unknown> | null = null;
  try {
    const historicalParsed = parseStrictJson(input.historicalRegistryV1Bytes);
    historicalRegistryV1Record = asRecord(historicalParsed);
    if (
      historicalRegistryV1Sha256 !== EXPECTED_HISTORICAL_REGISTRY_V1_SHA256 ||
      canonicalJson(historicalParsed) !== input.historicalRegistryV1Bytes ||
      historicalRegistryV1Record === null ||
      !hasExactKeys(historicalRegistryV1Record, [
        "assets",
        "fallbacks",
        "schemaVersion",
        "scopeId",
      ]) ||
      historicalRegistryV1Record.schemaVersion !== 1 ||
      historicalRegistryV1Record.scopeId !== PLAYER_PHOTO_SCOPE_ID ||
      !Array.isArray(historicalRegistryV1Record.assets) ||
      !Array.isArray(historicalRegistryV1Record.fallbacks)
    ) {
      issues.push(
        issue(
          "player-photo-registry-lineage",
          HISTORICAL_PLAYER_PHOTO_REGISTRY_V1_PATH,
          "the historical registry v1 bytes must match the frozen canonical digest and schema",
        ),
      );
      historicalRegistryV1Record = null;
    }
  } catch {
    issues.push(
      issue(
        "player-photo-registry-lineage",
        HISTORICAL_PLAYER_PHOTO_REGISTRY_V1_PATH,
        "the historical registry v1 must remain valid canonical JSON",
      ),
    );
  }

  const previousRegistryBinding = asRecord(
    registryRecord.previousRegistryBinding,
  );
  if (
    previousRegistryBinding === null ||
    !hasExactKeys(previousRegistryBinding, [
      "path",
      "schemaVersion",
      "sha256",
    ]) ||
    previousRegistryBinding.path !== PREVIOUS_PLAYER_PHOTO_REGISTRY_PATH ||
    previousRegistryBinding.schemaVersion !== 2 ||
    previousRegistryBinding.sha256 !== EXPECTED_PREVIOUS_REGISTRY_SHA256 ||
    previousRegistryBinding.sha256 !== previousRegistrySha256
  ) {
    issues.push(
      issue(
        "player-photo-registry-lineage",
        `${PLAYER_PHOTO_REGISTRY_PATH}.previousRegistryBinding`,
        "registry v3 must bind the exact immutable registry v2 bytes",
      ),
    );
  }

  const historicalRegistryBinding = asRecord(
    previousRegistryRecord?.previousRegistryBinding,
  );
  if (
    historicalRegistryBinding === null ||
    !hasExactKeys(historicalRegistryBinding, [
      "path",
      "schemaVersion",
      "sha256",
    ]) ||
    historicalRegistryBinding.path !==
      HISTORICAL_PLAYER_PHOTO_REGISTRY_V1_PATH ||
    historicalRegistryBinding.schemaVersion !== 1 ||
    historicalRegistryBinding.sha256 !==
      EXPECTED_HISTORICAL_REGISTRY_V1_SHA256 ||
    historicalRegistryBinding.sha256 !== historicalRegistryV1Sha256
  ) {
    issues.push(
      issue(
        "player-photo-registry-lineage",
        `${PREVIOUS_PLAYER_PHOTO_REGISTRY_PATH}.previousRegistryBinding`,
        "registry v2 must bind the exact immutable registry v1 bytes",
      ),
    );
  }

  if (previousRegistryRecord !== null) {
    const previousAssets = previousRegistryRecord.assets as unknown[];
    const previousFallbacks = previousRegistryRecord.fallbacks as unknown[];
    const currentProjection = registryRecord.assets.map((asset) =>
      projectV2CompatibleAsset(asset),
    );
    if (
      canonicalJson(currentProjection) !== canonicalJson(previousAssets) ||
      canonicalJson(registryRecord.fallbacks) !==
        canonicalJson(previousFallbacks)
    ) {
      issues.push(
        issue(
          "player-photo-registry-projection",
          PLAYER_PHOTO_REGISTRY_PATH,
          "registry v3 may only add sourceRiskClassification; every v2 asset and fallback fact must project byte-for-byte",
        ),
      );
    }
  }
  if (previousRegistryRecord !== null && historicalRegistryV1Record !== null) {
    const historicalAssets = historicalRegistryV1Record.assets as unknown[];
    const previousAssets = previousRegistryRecord.assets as unknown[];
    const historicalProjection = historicalAssets.map((asset) =>
      projectV1CompatibleAsset(asset, false),
    );
    const previousProjection = previousAssets.map((asset) =>
      projectV1CompatibleAsset(asset, true),
    );
    if (
      canonicalJson(previousProjection) !==
        canonicalJson(historicalProjection) ||
      canonicalJson(previousRegistryRecord.fallbacks) !==
        canonicalJson(historicalRegistryV1Record.fallbacks)
    ) {
      issues.push(
        issue(
          "player-photo-registry-projection",
          PREVIOUS_PLAYER_PHOTO_REGISTRY_PATH,
          "registry v2 may only add rights attribution and replace the source-policy binding; every v1 asset and fallback fact must project byte-for-byte",
        ),
      );
    }
  }

  let policy: Record<string, unknown> | null = null;
  try {
    policy = asRecord(parseStrictJson(input.policyJsonBytes));
  } catch {
    policy = null;
  }
  const annex = asRecord(policy?.playerStaticPhotoRules);
  const licenseRows = Array.isArray(annex?.allowedLicenses)
    ? annex.allowedLicenses.map(asRecord).filter((row) => row !== null)
    : [];
  const licensePairs = new Set(
    licenseRows.map(
      (row) => `${String(row.token)}\0${String(row.name)}\0${String(row.url)}`,
    ),
  );
  const negativeFilenames = new Set(
    Array.isArray(annex?.explicitNegativeFiles)
      ? annex.explicitNegativeFiles
          .map(asRecord)
          .filter((row) => row !== null)
          .map((row) => String(row.filename).toLocaleLowerCase("en-US"))
      : [],
  );
  const attributionRequirements = asRecord(annex?.attributionRequirements);
  const expectedAttributionRequirements = {
    adapterLicenseLimitedToCropContribution: true,
    adapterLicenseSameVersionRequiredForCcBySaCrop: true,
    commonsRevisionPermalinkVisible: true,
    copyrightNoticeRetentionStateRequired: true,
    disclaimerNoticeRetentionStateRequired: true,
    exactLicenseNameAndTermsLinkVisible: true,
    licenseBuckets: ["cc-by", "cc-by-sa", "cc0"],
    nonEventText: PLAYER_PHOTO_NON_EVENT_CAPTION,
    otherPerFileNoticeRetentionStateRequired: true,
    photographerVisible: true,
    suppliedCopyrightNoticeVisible: true,
    suppliedOtherPerFileNoticeVisible: true,
    suppliedTitleVisibleForLicenseVersion: "2.0",
    titleSupplyStateRequired: true,
    unscopedDocumentLicenseRelationForbidden: true,
  };
  if (
    policy?.sourcePolicyVersion !== PLAYER_PHOTO_POLICY_VERSION ||
    annex?.scopeId !== PLAYER_PHOTO_SCOPE_ID ||
    licensePairs.size === 0 ||
    negativeFilenames.size !== 3 ||
    attributionRequirements === null ||
    canonicalJson(attributionRequirements) !==
      canonicalJson(expectedAttributionRequirements)
  ) {
    issues.push(
      issue(
        "player-photo-policy",
        PLAYER_PHOTO_POLICY_JSON_PATH,
        "nba-v4 player-static-photo attribution annex is missing or invalid",
      ),
    );
  }
  const expectedPolicyBinding = {
    jsonPath: PLAYER_PHOTO_POLICY_JSON_PATH,
    jsonSha256: sha256Hex(input.policyJsonBytes),
    markdownPath: PLAYER_PHOTO_POLICY_MARKDOWN_PATH,
    markdownSha256: sha256Hex(input.policyMarkdownBytes),
    sourcePolicyVersion: PLAYER_PHOTO_POLICY_VERSION,
  };

  const casesById = new Map(input.cases.map((entry) => [entry.caseId, entry]));
  const expectedCasesByAthlete = new Map<string, string[]>();
  for (const entry of input.cases) {
    const caseIds = expectedCasesByAthlete.get(entry.athleteName) ?? [];
    caseIds.push(entry.caseId);
    expectedCasesByAthlete.set(entry.athleteName, caseIds);
  }
  for (const caseIds of expectedCasesByAthlete.values()) {
    caseIds.sort(compareCodePoints);
  }
  const expectedAthleteNames = [...expectedCasesByAthlete.keys()].sort(
    compareCodePoints,
  );
  const coveredCases = new Set<string>();
  const coveredAthletes = new Set<string>();
  const seenPaths = new Set<string>();
  const athleteOrder: string[] = [];
  const fallbackOrder: string[] = [];
  let highRiskCount = 0;
  let lowRiskCount = 0;

  if (
    expectedAthleteNames.length !== EXPECTED_ATHLETE_COUNT ||
    registry.assets.length + registry.fallbacks.length !==
      EXPECTED_ATHLETE_COUNT
  ) {
    issues.push(
      issue(
        "player-photo-athlete-partition",
        PLAYER_PHOTO_REGISTRY_PATH,
        `photo and fallback records must partition exactly ${EXPECTED_ATHLETE_COUNT} case athletes`,
      ),
    );
  }

  for (const [index, unknownAsset] of registry.assets.entries()) {
    const location = `${PLAYER_PHOTO_REGISTRY_PATH}.assets[${index}]`;
    const asset = asRecord(unknownAsset);
    if (
      asset === null ||
      !hasExactKeys(asset, [
        "alterationDisclosure",
        "athleteName",
        "caseIds",
        "commonsDescriptionUrl",
        "commonsDownloadUrl",
        "commonsRestrictions",
        "cropValidation",
        "downloadDate",
        "focalPosition",
        "identityEvidence",
        "license",
        "localFile",
        "nonEventCaption",
        "originalFile",
        "photographer",
        "rightsAttribution",
        "sourceClassification",
        "sourcePolicyBinding",
        "sourceRiskClassification",
      ])
    ) {
      issues.push(
        issue(
          "player-photo-record-schema",
          location,
          "player-photo record must contain the exact provenance fields",
        ),
      );
      continue;
    }
    const athleteName = asset.athleteName;
    athleteOrder.push(String(athleteName));
    if (
      !nonEmptyString(athleteName) ||
      !expectedCasesByAthlete.has(athleteName) ||
      coveredAthletes.has(athleteName)
    ) {
      issues.push(
        issue(
          "player-photo-athlete",
          `${location}.athleteName`,
          "athlete name must be an exact unique case athlete",
        ),
      );
    } else {
      coveredAthletes.add(athleteName);
    }
    if (
      !Array.isArray(asset.caseIds) ||
      asset.caseIds.length === 0 ||
      !asset.caseIds.every(nonEmptyString)
    ) {
      issues.push(
        issue(
          "player-photo-case-coverage",
          `${location}.caseIds`,
          "photo record must cover at least one exact case ID",
        ),
      );
    } else {
      const caseIds = asset.caseIds;
      const expectedCaseIds = nonEmptyString(athleteName)
        ? (expectedCasesByAthlete.get(athleteName) ?? [])
        : [];
      if (
        [...caseIds].sort(compareCodePoints).join("\0") !==
          caseIds.join("\0") ||
        new Set(caseIds).size !== caseIds.length ||
        !exactStringArray(caseIds, expectedCaseIds)
      ) {
        issues.push(
          issue(
            "player-photo-case-coverage",
            `${location}.caseIds`,
            "case IDs must exactly match the athlete's unique Unicode-code-point-sorted cases",
          ),
        );
      }
      for (const caseId of caseIds) {
        const caseIdentity = casesById.get(caseId);
        if (
          caseIdentity === undefined ||
          caseIdentity.athleteName !== athleteName ||
          coveredCases.has(caseId)
        ) {
          issues.push(
            issue(
              "player-photo-case-coverage",
              `${location}.caseIds`,
              `case ${caseId} is unknown, multiply covered, or belongs to another athlete`,
            ),
          );
        } else {
          coveredCases.add(caseId);
        }
      }
    }

    const localFile = asRecord(asset.localFile);
    const originalFile = asRecord(asset.originalFile);
    const localPath = localFile?.path;
    let localBytes: Buffer | undefined;
    if (
      localFile === null ||
      !hasExactKeys(localFile, [
        "byteLength",
        "height",
        "mimeType",
        "path",
        "sha256",
        "width",
      ]) ||
      typeof localPath !== "string" ||
      !SAFE_LOCAL_PATH_RE.test(localPath) ||
      seenPaths.has(localPath)
    ) {
      issues.push(
        issue(
          "player-photo-local-file",
          `${location}.localFile`,
          "local file metadata or unique safe path is invalid",
        ),
      );
    } else {
      seenPaths.add(localPath);
      const playerRoot = resolve("src/assets/players");
      const resolvedPath = resolve(localPath);
      if (!resolvedPath.startsWith(`${playerRoot}${sep}`)) {
        issues.push(
          issue(
            "player-photo-path-traversal",
            `${location}.localFile.path`,
            "local photo path escapes the governed player directory",
          ),
        );
      }
      localBytes = input.assetBytesByPath.get(localPath);
      const dimensions =
        localBytes === undefined ? null : readJpegDimensions(localBytes);
      const actualSha256 =
        localBytes === undefined
          ? null
          : createHash("sha256").update(localBytes).digest("hex");
      if (
        localBytes === undefined ||
        dimensions === null ||
        localFile.mimeType !== "image/jpeg" ||
        !positiveInteger(localFile.width) ||
        !positiveInteger(localFile.height) ||
        !positiveInteger(localFile.byteLength) ||
        typeof localFile.sha256 !== "string" ||
        !SHA256_RE.test(localFile.sha256) ||
        dimensions.width !== localFile.width ||
        dimensions.height !== localFile.height ||
        localBytes.length !== localFile.byteLength ||
        actualSha256 !== localFile.sha256
      ) {
        issues.push(
          issue(
            "player-photo-byte-drift",
            `${location}.localFile`,
            "local JPEG bytes, dimensions, length, or SHA-256 drifted",
          ),
        );
      } else {
        allowedPaths.add(localPath);
      }
    }
    if (
      originalFile === null ||
      !hasExactKeys(originalFile, [
        "filename",
        "height",
        "mediaInfoSha1",
        "mimeType",
        "width",
      ]) ||
      !nonEmptyString(originalFile.filename) ||
      basename(originalFile.filename) !== originalFile.filename ||
      !originalFile.filename.toLocaleLowerCase("en-US").endsWith(".jpg") ||
      negativeFilenames.has(originalFile.filename.toLocaleLowerCase("en-US")) ||
      originalFile.mimeType !== "image/jpeg" ||
      !positiveInteger(originalFile.width) ||
      !positiveInteger(originalFile.height) ||
      typeof originalFile.mediaInfoSha1 !== "string" ||
      !SHA1_RE.test(originalFile.mediaInfoSha1) ||
      localBytes === undefined ||
      createHash("sha1").update(localBytes).digest("hex") !==
        originalFile.mediaInfoSha1 ||
      originalFile.width !== localFile?.width ||
      originalFile.height !== localFile?.height
    ) {
      issues.push(
        issue(
          "player-photo-original-file",
          `${location}.originalFile`,
          "original Commons filename, MIME, dimensions, SHA-1, or negative-file check failed",
        ),
      );
    }

    const descriptionUrl = safeHttpsUrl(
      asset.commonsDescriptionUrl,
      "commons.wikimedia.org",
    );
    const downloadUrl = safeHttpsUrl(
      asset.commonsDownloadUrl,
      "upload.wikimedia.org",
    );
    if (
      descriptionUrl === null ||
      descriptionUrl.search !== "" ||
      !descriptionUrl.pathname.startsWith("/wiki/File:") ||
      downloadUrl === null ||
      downloadUrl.search !== "" ||
      !downloadUrl.pathname.startsWith("/wikipedia/commons/") ||
      downloadUrl.pathname.includes("/thumb/") ||
      !downloadUrl.pathname.toLocaleLowerCase("en-US").endsWith(".jpg") ||
      (originalFile !== null &&
        decodeURIComponent(downloadUrl.pathname.split("/").at(-1) ?? "") !==
          originalFile.filename)
    ) {
      issues.push(
        issue(
          "player-photo-commons-url",
          location,
          "description/download URL must be an exact original Wikimedia Commons JPEG URL",
        ),
      );
    }

    const license = asRecord(asset.license);
    const licenseKey =
      license === null
        ? ""
        : `${String(license.token)}\0${String(license.name)}\0${String(license.url)}`;
    if (
      license === null ||
      !hasExactKeys(license, ["name", "token", "url"]) ||
      !licensePairs.has(licenseKey)
    ) {
      issues.push(
        issue(
          "player-photo-license",
          `${location}.license`,
          "license token, exact name, and terms URL are not an approved free-license pair",
        ),
      );
    }
    if (
      !nonEmptyString(asset.photographer) ||
      NEWS_AGENCY_RE.test(String(asset.photographer))
    ) {
      issues.push(
        issue(
          "player-photo-photographer",
          `${location}.photographer`,
          "photographer is missing or classified as a prohibited news agency",
        ),
      );
    }
    if (asset.sourceClassification !== PLAYER_PHOTO_SOURCE_CLASSIFICATION) {
      issues.push(
        issue(
          "player-photo-classification",
          `${location}.sourceClassification`,
          "source is not an approved Wikimedia Commons basketball-court photograph",
        ),
      );
    }
    if (
      asset.downloadDate !== EXPECTED_DOWNLOAD_DATE ||
      asset.nonEventCaption !== PLAYER_PHOTO_NON_EVENT_CAPTION ||
      !nonEmptyString(asset.alterationDisclosure) ||
      (typeof license?.token === "string" &&
        license.token.startsWith("cc-by-sa-") &&
        !asset.alterationDisclosure.includes("改作自原作"))
    ) {
      issues.push(
        issue(
          "player-photo-attribution",
          location,
          "download date, visible non-event caption, or alteration disclosure is invalid",
        ),
      );
    }
    if (
      !Array.isArray(asset.commonsRestrictions) ||
      asset.commonsRestrictions.some(
        (value) =>
          typeof value !== "string" || !ALLOWED_RESTRICTIONS.has(value),
      ) ||
      new Set(asset.commonsRestrictions).size !==
        asset.commonsRestrictions.length
    ) {
      issues.push(
        issue(
          "player-photo-restrictions",
          `${location}.commonsRestrictions`,
          "Commons restrictions must be an explicit unique controlled-token array",
        ),
      );
    }

    const rights = asRecord(asset.rightsAttribution);
    if (
      rights === null ||
      !hasExactKeys(rights, [
        "adapterLicense",
        "alterationState",
        "copyrightNotice",
        "disclaimerNotice",
        "licenseBucket",
        "otherPerFileNotice",
        "sourceRevision",
        "workTitle",
      ])
    ) {
      issues.push(
        issue(
          "player-photo-rights-schema",
          `${location}.rightsAttribution`,
          "Decision 11 rights attribution must contain the exact version-aware fields",
        ),
      );
    } else {
      const sourceRevision = asRecord(rights.sourceRevision);
      const revisionPermalink = safeHttpsUrl(
        sourceRevision?.permalink,
        "commons.wikimedia.org",
      );
      const revisionTitle = sourceRevision?.title;
      const descriptionTitle =
        descriptionUrl === null
          ? null
          : normalizedCommonsTitle(
              decodeURIComponent(
                descriptionUrl.pathname.slice("/wiki/".length),
              ),
            );
      const permalinkTitle = revisionPermalink?.searchParams.get("title");
      const permalinkKeys =
        revisionPermalink === null
          ? []
          : [...revisionPermalink.searchParams.keys()].sort(compareCodePoints);
      if (
        sourceRevision === null ||
        !hasExactKeys(sourceRevision, [
          "checkedAt",
          "id",
          "permalink",
          "timestamp",
          "title",
        ]) ||
        sourceRevision.checkedAt !== EXPECTED_RIGHTS_CHECK_DATE ||
        !positiveInteger(sourceRevision.id) ||
        !nonEmptyString(sourceRevision.timestamp) ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u.test(
          sourceRevision.timestamp,
        ) ||
        !nonEmptyString(revisionTitle) ||
        !revisionTitle.startsWith("File:") ||
        descriptionTitle !== revisionTitle ||
        revisionPermalink === null ||
        revisionPermalink.pathname !== "/w/index.php" ||
        revisionPermalink.hash !== "" ||
        permalinkKeys.join("\0") !== "oldid\0title" ||
        normalizedCommonsTitle(permalinkTitle ?? "") !== revisionTitle ||
        revisionPermalink.searchParams.get("oldid") !==
          String(sourceRevision.id)
      ) {
        issues.push(
          issue(
            "player-photo-source-revision",
            `${location}.rightsAttribution.sourceRevision`,
            "current Commons revision ID, timestamp, title, checked date, and oldid permalink must agree",
          ),
        );
      }

      const workTitle = asRecord(rights.workTitle);
      if (
        workTitle === null ||
        !hasExactKeys(workTitle, [
          "evidence",
          "evidenceUrl",
          "status",
          "text",
        ]) ||
        !nonEmptyString(workTitle.evidence) ||
        safeEvidenceUrl(workTitle.evidenceUrl) === null ||
        (workTitle.status === "supplied"
          ? !nonEmptyString(workTitle.text)
          : workTitle.status !== "not-supplied" || workTitle.text !== null)
      ) {
        issues.push(
          issue(
            "player-photo-work-title",
            `${location}.rightsAttribution.workTitle`,
            "work title must preserve a verified supplied value or an explicit evidence-backed null state",
          ),
        );
      }

      const expectedBucket = expectedLicenseBucket(license?.token);
      if (expectedBucket === null || rights.licenseBucket !== expectedBucket) {
        issues.push(
          issue(
            "player-photo-license-bucket",
            `${location}.rightsAttribution.licenseBucket`,
            "license bucket must agree with the exact CC BY, CC BY-SA, or CC0 token",
          ),
        );
      }

      const adapterLicense = asRecord(rights.adapterLicense);
      if (
        expectedBucket === "cc-by-sa"
          ? adapterLicense === null ||
            !hasExactKeys(adapterLicense, ["name", "token", "url"]) ||
            canonicalJson(adapterLicense) !== canonicalJson(license)
          : rights.adapterLicense !== null
      ) {
        issues.push(
          issue(
            "player-photo-adapter-license",
            `${location}.rightsAttribution.adapterLicense`,
            "every CC BY-SA crop needs the same-version linked Adapter's License, while CC BY and CC0 prohibit one",
          ),
        );
      }

      if (
        !validNotice(rights.copyrightNotice, sourceRevision?.permalink) ||
        !validNotice(rights.disclaimerNotice, sourceRevision?.permalink) ||
        !validNotice(rights.otherPerFileNotice, sourceRevision?.permalink)
      ) {
        issues.push(
          issue(
            "player-photo-rights-notice",
            `${location}.rightsAttribution`,
            "copyright, disclaimer, and per-file notice states must retain exact supplied text or explicit nulls",
          ),
        );
      }
      const otherNotice = asRecord(rights.otherPerFileNotice);
      const hasPersonalityRestriction = Array.isArray(asset.commonsRestrictions)
        ? asset.commonsRestrictions.includes("personality")
        : false;
      if (
        hasPersonalityRestriction
          ? otherNotice?.status !== "supplied" ||
            otherNotice.text !== "Personality rights warning"
          : otherNotice?.status !== "not-supplied"
      ) {
        issues.push(
          issue(
            "player-photo-rights-notice",
            `${location}.rightsAttribution.otherPerFileNotice`,
            "the retained per-file notice must agree with the Commons personality restriction",
          ),
        );
      }

      const alterationState = asRecord(rights.alterationState);
      if (
        alterationState === null ||
        !hasExactKeys(alterationState, [
          "commonsFileStatus",
          "evidence",
          "sitePresentation",
        ]) ||
        (alterationState.commonsFileStatus !== "cropped" &&
          alterationState.commonsFileStatus !== "no-crop-declared") ||
        !nonEmptyString(alterationState.evidence) ||
        alterationState.sitePresentation !== "css-object-fit-cover-crop"
      ) {
        issues.push(
          issue(
            "player-photo-alteration-state",
            `${location}.rightsAttribution.alterationState`,
            "Commons alteration evidence and the site's CSS crop state are required",
          ),
        );
      }
    }

    const sourceRisk = asRecord(asset.sourceRiskClassification);
    const sourceRiskBasis = sourceRisk?.basis;
    const sourceRiskBasisPrefix =
      typeof sourceRiskBasis === "string" &&
      sourceRiskBasis.endsWith(PLAYER_PHOTO_SOURCE_RISK_DISCLAIMER)
        ? sourceRiskBasis
            .slice(0, -PLAYER_PHOTO_SOURCE_RISK_DISCLAIMER.length)
            .trim()
        : "";
    const expectedRiskCategory = EXPECTED_LOW_RISK_ATHLETES.has(
      String(athleteName),
    )
      ? "non-event-low-risk"
      : "game-action-high-risk";
    const rightsSourceRevision = asRecord(rights?.sourceRevision);
    if (
      sourceRisk === null ||
      !hasExactKeys(sourceRisk, [
        "basis",
        "category",
        "checkedAt",
        "sourceRevisionPermalink",
      ]) ||
      sourceRisk.category !== expectedRiskCategory ||
      sourceRisk.checkedAt !== PLAYER_PHOTO_SOURCE_RISK_CHECKED_AT ||
      !nonEmptyString(sourceRiskBasisPrefix) ||
      CLEARANCE_CLAIM_RE.test(sourceRiskBasisPrefix) ||
      sourceRisk.sourceRevisionPermalink !== rightsSourceRevision?.permalink
    ) {
      issues.push(
        issue(
          "player-photo-source-risk",
          `${location}.sourceRiskClassification`,
          "source-risk classification must use the exact athlete category, audit date, non-clearance basis, and bound Commons oldid; low risk is not rights clearance or publication approval",
        ),
      );
    }
    if (sourceRisk?.category === "game-action-high-risk") {
      highRiskCount += 1;
    } else if (sourceRisk?.category === "non-event-low-risk") {
      lowRiskCount += 1;
    }

    const identity = asRecord(asset.identityEvidence);
    if (
      identity === null ||
      !hasExactKeys(identity, [
        "basis",
        "checkedAt",
        "checkedBy",
        "status",
        "url",
      ]) ||
      identity.status !== "verified" ||
      !nonEmptyString(identity.basis) ||
      identity.checkedAt !== EXPECTED_DOWNLOAD_DATE ||
      identity.checkedBy !== EXPECTED_CHECKER ||
      identity.url !== asset.commonsDescriptionUrl
    ) {
      issues.push(
        issue(
          "player-photo-identity",
          `${location}.identityEvidence`,
          "named/date-bound athlete identity evidence is missing or invalid",
        ),
      );
    }
    const focal = asRecord(asset.focalPosition);
    const crop = asRecord(asset.cropValidation);
    const ratios = Array.isArray(crop?.ratios) ? crop.ratios.map(asRecord) : [];
    if (
      focal === null ||
      !hasExactKeys(focal, ["xPercent", "yPercent"]) ||
      typeof focal.xPercent !== "number" ||
      typeof focal.yPercent !== "number" ||
      focal.xPercent < 0 ||
      focal.xPercent > 100 ||
      focal.yPercent < 0 ||
      focal.yPercent > 100 ||
      crop === null ||
      !hasExactKeys(crop, ["checkedAt", "checkedBy", "ratios"]) ||
      crop.checkedAt !== EXPECTED_DOWNLOAD_DATE ||
      crop.checkedBy !== EXPECTED_CHECKER ||
      ratios.length !== 2 ||
      ratios[0]?.aspectRatio !== "5:2" ||
      ratios[0]?.faceSafe !== true ||
      ratios[1]?.aspectRatio !== "16:9" ||
      ratios[1]?.faceSafe !== true
    ) {
      issues.push(
        issue(
          "player-photo-crop",
          location,
          "focal position and exact 5:2/16:9 face-safe visual checks are required",
        ),
      );
    }
    if (
      canonicalJson(asset.sourcePolicyBinding) !==
      canonicalJson(expectedPolicyBinding)
    ) {
      issues.push(
        issue(
          "player-photo-policy-binding",
          `${location}.sourcePolicyBinding`,
          "record does not bind the exact nba-v4 JSON and Markdown bytes",
        ),
      );
    }
  }

  if (
    athleteOrder.join("\0") !==
    [...athleteOrder].sort(compareCodePoints).join("\0")
  ) {
    issues.push(
      issue(
        "player-photo-order",
        `${PLAYER_PHOTO_REGISTRY_PATH}.assets`,
        "photo records must be Unicode-code-point sorted by athlete name",
      ),
    );
  }
  if (highRiskCount !== 19 || lowRiskCount !== 2) {
    issues.push(
      issue(
        "player-photo-source-risk",
        `${PLAYER_PHOTO_REGISTRY_PATH}.assets`,
        "the audited Decision 11 registry partition must remain exactly 19 game-action-high-risk and 2 non-event-low-risk records; neither category is publication clearance",
      ),
    );
  }

  for (const [index, unknownFallback] of registry.fallbacks.entries()) {
    const location = `${PLAYER_PHOTO_REGISTRY_PATH}.fallbacks[${index}]`;
    const fallback = asRecord(unknownFallback);
    const athleteName = fallback?.athleteName;
    fallbackOrder.push(String(athleteName));
    if (
      fallback === null ||
      !hasExactKeys(fallback, ["athleteName", "caseIds", "reason"]) ||
      !nonEmptyString(athleteName) ||
      !expectedCasesByAthlete.has(athleteName) ||
      fallback.reason !== "no-qualified-commons-photo" ||
      !Array.isArray(fallback.caseIds) ||
      fallback.caseIds.length === 0 ||
      !fallback.caseIds.every(nonEmptyString) ||
      coveredAthletes.has(athleteName)
    ) {
      issues.push(
        issue(
          "player-photo-fallback",
          location,
          "fallback must be an explicit unique known athlete with non-empty case IDs",
        ),
      );
      continue;
    }
    coveredAthletes.add(athleteName);
    const caseIds = fallback.caseIds;
    const expectedCaseIds = expectedCasesByAthlete.get(athleteName)!;
    if (
      [...caseIds].sort(compareCodePoints).join("\0") !== caseIds.join("\0") ||
      new Set(caseIds).size !== caseIds.length ||
      !exactStringArray(caseIds, expectedCaseIds)
    ) {
      issues.push(
        issue(
          "player-photo-fallback",
          `${location}.caseIds`,
          "fallback case IDs must exactly match the athlete's unique Unicode-code-point-sorted cases",
        ),
      );
    }
    for (const caseId of caseIds) {
      const caseIdentity = casesById.get(caseId);
      if (
        caseIdentity === undefined ||
        caseIdentity.athleteName !== athleteName ||
        coveredCases.has(caseId)
      ) {
        issues.push(
          issue(
            "player-photo-fallback",
            `${location}.caseIds`,
            `fallback case ${caseId} is unknown, mismatched, or multiply covered`,
          ),
        );
      } else {
        coveredCases.add(caseId);
      }
    }
  }

  if (
    fallbackOrder.join("\0") !==
    [...fallbackOrder].sort(compareCodePoints).join("\0")
  ) {
    issues.push(
      issue(
        "player-photo-fallback-order",
        `${PLAYER_PHOTO_REGISTRY_PATH}.fallbacks`,
        "fallback records must be Unicode-code-point sorted by athlete name",
      ),
    );
  }

  if (
    input.cases.length !== EXPECTED_CASE_COUNT ||
    casesById.size !== EXPECTED_CASE_COUNT ||
    coveredCases.size !== input.cases.length ||
    input.cases.some((entry) => !coveredCases.has(entry.caseId))
  ) {
    issues.push(
      issue(
        "player-photo-case-partition",
        PLAYER_PHOTO_REGISTRY_PATH,
        `photo and fallback records must exactly partition all ${EXPECTED_CASE_COUNT} cases`,
      ),
    );
  }
  if (
    coveredAthletes.size !== expectedAthleteNames.length ||
    expectedAthleteNames.some(
      (athleteName) => !coveredAthletes.has(athleteName),
    )
  ) {
    issues.push(
      issue(
        "player-photo-athlete-partition",
        PLAYER_PHOTO_REGISTRY_PATH,
        `photo and fallback records must exactly partition all ${EXPECTED_ATHLETE_COUNT} case athletes`,
      ),
    );
  }

  const actualImages = new Set(input.actualImagePaths);
  for (const path of actualImages) {
    if (!seenPaths.has(path)) {
      issues.push(
        issue(
          "player-photo-extra-image",
          path,
          "image is not listed in the governed player-photo registry",
        ),
      );
    }
  }
  for (const path of seenPaths) {
    if (!actualImages.has(path)) {
      issues.push(
        issue(
          "player-photo-missing-image",
          path,
          "registry-listed player photo is missing",
        ),
      );
    }
  }

  return {
    allowedPaths: [...allowedPaths].sort(compareCodePoints),
    issues,
    registry,
  };
}

export function loadPlayerPhotoAssets(
  root: string,
): PlayerPhotoAssetLoadResult {
  const historicalInput = readPlayerPhotoValidationInput(root);
  historicalInput.actualImagePaths = historicalInput.actualImagePaths.filter(
    (path) => !path.startsWith("src/assets/players/decision-13/"),
  );
  const historical = validatePlayerPhotoAssets(historicalInput);
  const registryV4Path = join(root, PLAYER_PHOTO_REGISTRY_V4_PATH);
  if (!existsSync(registryV4Path)) {
    return {
      ...historical,
      issues: [
        ...historical.issues,
        issue(
          "player-photo-v4-missing-registry",
          PLAYER_PHOTO_REGISTRY_V4_PATH,
          "current Decision 13 registry v4 is missing",
        ),
      ],
      currentRegistry: null,
    };
  }

  const caseDirectory = join(root, "src/content/cases");
  const expectedAthleteCases = new Map<string, string[]>();
  for (const filename of readdirSync(caseDirectory).sort(compareCodePoints)) {
    if (!filename.endsWith(".json")) continue;
    const value = JSON.parse(
      readFileSync(join(caseDirectory, filename), "utf8"),
    ) as {
      athlete: { name: string };
      id: string;
    };
    const ids = expectedAthleteCases.get(value.athlete.name) ?? [];
    ids.push(value.id);
    expectedAthleteCases.set(value.athlete.name, ids);
  }
  for (const ids of expectedAthleteCases.values()) ids.sort(compareCodePoints);

  const localAssetBytesByPath = new Map<string, Uint8Array>();
  for (const path of walkFiles(join(root, "src/assets/players/decision-13"))) {
    localAssetBytesByPath.set(relative(root, path), readFileSync(path));
  }
  const current = validatePlayerPhotoRegistryV4({
    expectedAthleteCases,
    expectedRegistrySha256: PLAYER_PHOTO_REGISTRY_V4_SHA256,
    localAssetBytesByPath,
    policyJsonBytes: readFileSync(
      join(root, PLAYER_PHOTO_POLICY_V5_JSON_PATH),
      "utf8",
    ),
    policyMarkdownBytes: readFileSync(
      join(root, PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH),
      "utf8",
    ),
    predecessorRegistryBytesByPath: new Map(
      PLAYER_PHOTO_REGISTRY_PREDECESSORS.map((binding) => [
        binding.path,
        readFileSync(join(root, binding.path), "utf8"),
      ]),
    ),
    registryBytes: readFileSync(registryV4Path, "utf8"),
  });
  const currentPaths =
    current.registry?.selections.map((selection) => selection.localFile.path) ??
    [];
  const trackedCurrentPaths = new Set(localAssetBytesByPath.keys());
  const currentPathSet = new Set(currentPaths);
  const inventoryIssues = [
    ...[...trackedCurrentPaths]
      .filter((path) => !currentPathSet.has(path))
      .map((path) =>
        issue(
          "player-photo-v4-extra-image",
          path,
          "Decision 13 asset is not a current registry v4 selection",
        ),
      ),
    ...currentPaths
      .filter((path) => !trackedCurrentPaths.has(path))
      .map((path) =>
        issue(
          "player-photo-v4-missing-image",
          path,
          "current registry v4 selection is missing its local asset",
        ),
      ),
  ];
  return {
    allowedPaths: [
      ...new Set([...historical.allowedPaths, ...currentPaths]),
    ].sort(compareCodePoints),
    issues: [...historical.issues, ...current.issues, ...inventoryIssues],
    registry: historical.registry,
    currentRegistry: current.registry,
  };
}

function main(): void {
  const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
  const result = loadPlayerPhotoAssets(root);
  if (result.issues.length > 0) {
    for (const entry of result.issues) {
      console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
    }
    process.exit(1);
  }
  console.log(
    "player-photo assets OK — current registry v4 selects 5 Commons photos and 16 original SVG fallbacks covering 26 cases; frozen v3 assets remain historical-only",
  );
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
