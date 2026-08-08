/**
 * Brand-asset verifier. Site identity remains text/CSS-geometry only with an
 * empty league/team/logo allowlist. The sole raster exception is an exact
 * path listed in the local editorial-image provenance manifest beneath
 * `src/assets/heroes/`; arbitrary assets, source intermediates, authored
 * `<img>` tags, remote thumbnails/logos, trademark-like names, and claims of
 * official partnership/authorization still fail closed.
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import {
  issue,
  parseStrictJson,
  type ValidationIssue,
} from "../src/lib/contracts/canonical";

export const BRAND_ASSET_POLICY_PATH = "src/data/brand-asset-policy.v1.json";
export const EDITORIAL_IMAGE_PROVENANCE_PATH =
  "src/assets/heroes/provenance.json";

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp|tiff?)$/i;
const EDITORIAL_RASTER_PATH_RE =
  /^src\/assets\/heroes\/[a-z0-9]+(?:-[a-z0-9]+)*\.png$/;
const EDITORIAL_ASSET_COUNT = 16;
const REQUIRED_PROMPT_REDLINE = "anonymous athlete, face not visible";
const EDITORIAL_ROLE_SET = new Set(["home", "injury-overview", "case-cover"]);
const EDITORIAL_INJURY_SET = new Set([
  "acl",
  "ankle-sprain",
  "achilles-rupture",
]);
const IMG_TAG_RE = /<img\b/i;
const REMOTE_THUMBNAIL_RE =
  /img\.youtube\.com|i\.ytimg\.com|ytimg\.com\/vi|cdn\.nba\.com|ak-static\.cms\.nba\.com|logo\.clearbit\.com/i;
const LOGO_ATTRIBUTE_RE =
  /(class|alt|src|href|id)\s*=\s*["'][^"']*logo[^"']*["']/i;
const TRADEMARK_FILENAME_RE = /logo|trademark|brandmark|crest|emblem/i;
const IMAGE_URL_VALUE_RE =
  /https?:\/\/[^\s"']+\.(png|jpe?g|gif|webp|avif|svg|ico)\b/i;
const LOGO_FIELD_RE = /(logo|thumbnail|image)(url|src|path)?$/i;
const ENDORSEMENT_RE =
  /official(ly)?\s+(partner|licens|authoriz|endors)|in\s+partnership\s+with\s+the\s+nba|官方合作|官方授權|官方夥伴|官方認證/i;

function walkFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(directory).sort()) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const fullPath = join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...walkFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

interface EditorialProvenanceResult {
  allowedPaths: Set<string>;
  issues: ValidationIssue[];
}

function readPngDimensions(bytes: Buffer): {
  width: number;
  height: number;
} | null {
  if (
    bytes.length < 24 ||
    bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
    bytes.subarray(12, 16).toString("ascii") !== "IHDR"
  ) {
    return null;
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function loadEditorialImageProvenance(root: string): EditorialProvenanceResult {
  const allowedPaths = new Set<string>();
  const issues: ValidationIssue[] = [];
  const manifestPath = join(root, EDITORIAL_IMAGE_PROVENANCE_PATH);
  if (!existsSync(manifestPath)) return { allowedPaths, issues };

  let parsed: unknown;
  try {
    parsed = parseStrictJson(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    issues.push(
      issue(
        "brand-editorial-provenance",
        EDITORIAL_IMAGE_PROVENANCE_PATH,
        error instanceof Error ? error.message : String(error),
      ),
    );
    return { allowedPaths, issues };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    issues.push(
      issue(
        "brand-editorial-provenance",
        EDITORIAL_IMAGE_PROVENANCE_PATH,
        "editorial provenance must be an object",
      ),
    );
    return { allowedPaths, issues };
  }

  const manifest = parsed as Record<string, unknown>;
  if (
    manifest["schemaVersion"] !== 1 ||
    manifest["generator"] !== "OpenAI built-in imagegen" ||
    typeof manifest["generationDate"] !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(manifest["generationDate"]) ||
    manifest["originality"] !==
      "AI-generated original editorial photography; no source/broadcast photographs" ||
    !Array.isArray(manifest["assets"])
  ) {
    issues.push(
      issue(
        "brand-editorial-provenance",
        EDITORIAL_IMAGE_PROVENANCE_PATH,
        "editorial provenance metadata is missing or invalid",
      ),
    );
    return { allowedPaths, issues };
  }

  if (manifest["assets"].length !== EDITORIAL_ASSET_COUNT) {
    issues.push(
      issue(
        "brand-editorial-provenance",
        `${EDITORIAL_IMAGE_PROVENANCE_PATH}.assets`,
        `editorial provenance must list exactly ${EDITORIAL_ASSET_COUNT} final assets`,
      ),
    );
  }

  const roleCounts = new Map<string, number>();
  const overviewCounts = new Map<string, number>();
  const caseCounts = new Map<string, number>();

  for (const [index, value] of manifest["assets"].entries()) {
    const location = `${EDITORIAL_IMAGE_PROVENANCE_PATH}.assets[${index}]`;
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      issues.push(
        issue(
          "brand-editorial-provenance",
          location,
          "editorial asset entry must be an object",
        ),
      );
      continue;
    }

    const asset = value as Record<string, unknown>;
    const path = asset["path"];
    const role = asset["role"];
    const injuryTheme = asset["injuryTheme"];
    const promptRecord = asset["promptRecord"];
    const width = asset["width"];
    const height = asset["height"];
    const sha256 = asset["sha256"];
    const injuryIsValid =
      injuryTheme === null ||
      (typeof injuryTheme === "string" &&
        EDITORIAL_INJURY_SET.has(injuryTheme));
    const promptIsValid =
      typeof promptRecord === "string" &&
      /^src\/assets\/heroes\/provenance\/(home|acl|ankle-sprain|achilles-rupture)\.md$/.test(
        promptRecord,
      );

    if (
      typeof path !== "string" ||
      !EDITORIAL_RASTER_PATH_RE.test(path) ||
      typeof role !== "string" ||
      !EDITORIAL_ROLE_SET.has(role) ||
      !injuryIsValid ||
      !promptIsValid ||
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      typeof sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(sha256) ||
      (role === "home" && injuryTheme !== null) ||
      (role !== "home" && injuryTheme === null)
    ) {
      issues.push(
        issue(
          "brand-editorial-provenance",
          location,
          "editorial asset path, role, injury theme, prompt record, dimensions, or digest is invalid",
        ),
      );
      continue;
    }

    const expectedStem =
      role === "home"
        ? "home-atlas"
        : role === "injury-overview"
          ? `${String(injuryTheme)}-overview`
          : `${String(injuryTheme)}-case-0[1-4]`;
    const expectedPath = new RegExp(
      `^src/assets/heroes/${expectedStem}\\.png$`,
    );
    const expectedPromptRecord = `src/assets/heroes/provenance/${
      role === "home" ? "home" : String(injuryTheme)
    }.md`;
    if (!expectedPath.test(path) || promptRecord !== expectedPromptRecord) {
      issues.push(
        issue(
          "brand-editorial-provenance",
          location,
          "editorial asset filename or prompt record does not match its declared role and injury theme",
        ),
      );
      continue;
    }
    const expectedWidth = 2400;
    const expectedHeight =
      role === "home" ? 900 : role === "injury-overview" ? 720 : 960;
    if (width !== expectedWidth || height !== expectedHeight) {
      issues.push(
        issue(
          "brand-editorial-provenance",
          location,
          `editorial ${role} dimensions must be ${expectedWidth}x${expectedHeight}`,
        ),
      );
      continue;
    }
    if (allowedPaths.has(path)) {
      issues.push(
        issue(
          "brand-editorial-provenance",
          `${location}.path`,
          "editorial asset paths must be unique",
        ),
      );
      continue;
    }
    const fullAssetPath = join(root, path);
    if (!existsSync(fullAssetPath)) {
      issues.push(
        issue(
          "brand-editorial-provenance",
          `${location}.path`,
          "listed editorial asset does not exist",
        ),
      );
      continue;
    }
    if (!existsSync(join(root, promptRecord))) {
      issues.push(
        issue(
          "brand-editorial-provenance",
          `${location}.promptRecord`,
          "listed editorial prompt record does not exist",
        ),
      );
      continue;
    }

    const promptText = readFileSync(join(root, promptRecord), "utf8");
    if (!promptText.includes(REQUIRED_PROMPT_REDLINE)) {
      issues.push(
        issue(
          "brand-editorial-provenance",
          `${location}.promptRecord`,
          `prompt record must contain ${JSON.stringify(REQUIRED_PROMPT_REDLINE)}`,
        ),
      );
      continue;
    }

    const bytes = readFileSync(fullAssetPath);
    const dimensions = readPngDimensions(bytes);
    if (
      dimensions === null ||
      dimensions.width !== width ||
      dimensions.height !== height
    ) {
      issues.push(
        issue(
          "brand-editorial-provenance",
          `${location}.width`,
          "actual PNG dimensions do not match the provenance record",
        ),
      );
      continue;
    }
    const actualSha256 = createHash("sha256").update(bytes).digest("hex");
    if (actualSha256 !== sha256) {
      issues.push(
        issue(
          "brand-editorial-provenance",
          `${location}.sha256`,
          "actual PNG SHA-256 does not match the provenance record",
        ),
      );
      continue;
    }

    allowedPaths.add(path);
    roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
    if (role === "injury-overview") {
      overviewCounts.set(
        String(injuryTheme),
        (overviewCounts.get(String(injuryTheme)) ?? 0) + 1,
      );
    }
    if (role === "case-cover") {
      caseCounts.set(
        String(injuryTheme),
        (caseCounts.get(String(injuryTheme)) ?? 0) + 1,
      );
    }
  }

  if (
    roleCounts.get("home") !== 1 ||
    roleCounts.get("injury-overview") !== 3 ||
    roleCounts.get("case-cover") !== 12 ||
    [...EDITORIAL_INJURY_SET].some(
      (injury) =>
        overviewCounts.get(injury) !== 1 || caseCounts.get(injury) !== 4,
    )
  ) {
    issues.push(
      issue(
        "brand-editorial-provenance",
        `${EDITORIAL_IMAGE_PROVENANCE_PATH}.assets`,
        "editorial inventory must contain one home, one overview per injury, and four case covers per injury",
      ),
    );
  }

  return { allowedPaths, issues };
}

function scanJsonValue(
  value: unknown,
  path: string,
  location: string,
  issues: ValidationIssue[],
): void {
  if (typeof value === "string") {
    if (IMAGE_URL_VALUE_RE.test(value)) {
      issues.push(
        issue(
          "brand-content-image-url",
          `${location}.${path}`,
          "content must not carry image/thumbnail URLs",
        ),
      );
    }
    if (ENDORSEMENT_RE.test(value)) {
      issues.push(
        issue(
          "brand-endorsement-claim",
          `${location}.${path}`,
          "content must not claim official partnership or authorization",
        ),
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      scanJsonValue(entry, `${path}[${index}]`, location, issues),
    );
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (LOGO_FIELD_RE.test(key) && typeof entry === "string") {
        issues.push(
          issue(
            "brand-content-logo-field",
            `${location}.${path === "" ? key : `${path}.${key}`}`,
            `content field ${key} carries a logo/image reference`,
          ),
        );
      }
      scanJsonValue(
        entry,
        path === "" ? key : `${path}.${key}`,
        location,
        issues,
      );
    }
  }
}

/** Scans the repository for brand-asset violations. */
export function scanBrandAssets(root: string): ValidationIssue[] {
  const provenance = loadEditorialImageProvenance(root);
  const issues: ValidationIssue[] = [...provenance.issues];

  for (const assetDir of ["public", "src/assets"]) {
    for (const filePath of walkFiles(join(root, assetDir))) {
      const relPath = relative(root, filePath);
      if (IMAGE_EXT_RE.test(relPath)) {
        if (provenance.allowedPaths.has(relPath)) continue;
        issues.push(
          issue(
            "brand-image-asset",
            relPath,
            "image file is not an exact provenance-listed original editorial raster",
          ),
        );
      } else if (TRADEMARK_FILENAME_RE.test(relPath)) {
        issues.push(
          issue(
            "brand-trademark-filename",
            relPath,
            "trademark-like asset filenames are forbidden",
          ),
        );
      }
    }
  }

  const templateDirs = [
    "src/pages",
    "src/layouts",
    "src/components",
    "src/scripts",
    "src/styles",
    "src/lib/video",
  ];
  for (const templateDir of templateDirs) {
    for (const filePath of walkFiles(join(root, templateDir))) {
      const relPath = relative(root, filePath);
      if (!/\.(astro|ts|tsx|js|mjs|css)$/.test(relPath)) continue;
      const text = readFileSync(filePath, "utf8");
      if (IMG_TAG_RE.test(text)) {
        issues.push(
          issue(
            "brand-img-tag",
            relPath,
            "authored templates must not contain <img> tags",
          ),
        );
      }
      if (REMOTE_THUMBNAIL_RE.test(text)) {
        issues.push(
          issue(
            "brand-remote-thumbnail",
            relPath,
            "remote thumbnail/logo sources are forbidden",
          ),
        );
      }
      if (LOGO_ATTRIBUTE_RE.test(text)) {
        issues.push(
          issue(
            "brand-logo-attribute",
            relPath,
            "logo-styled attributes/class names are forbidden",
          ),
        );
      }
      if (ENDORSEMENT_RE.test(text)) {
        issues.push(
          issue(
            "brand-endorsement-claim",
            relPath,
            "templates must not claim official partnership or authorization",
          ),
        );
      }
    }
  }

  for (const contentDir of ["src/content", "src/data"]) {
    for (const filePath of walkFiles(join(root, contentDir))) {
      const relPath = relative(root, filePath);
      if (!relPath.endsWith(".json")) continue;
      if (relPath === BRAND_ASSET_POLICY_PATH) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(filePath, "utf8"));
      } catch {
        continue;
      }
      scanJsonValue(parsed, "", relPath, issues);
    }
  }

  return issues;
}

/** Validates the declared brand-asset policy: empty allowlists, text-only. */
export function validateBrandAssetPolicy(root: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const policyPath = join(root, BRAND_ASSET_POLICY_PATH);
  if (!existsSync(policyPath)) {
    return [
      issue(
        "brand-policy-missing",
        BRAND_ASSET_POLICY_PATH,
        "the brand-asset policy file is missing",
      ),
    ];
  }
  let parsed: unknown;
  try {
    parsed = parseStrictJson(readFileSync(policyPath, "utf8"));
  } catch (error) {
    return [
      issue(
        "brand-policy-parse",
        BRAND_ASSET_POLICY_PATH,
        error instanceof Error ? error.message : String(error),
      ),
    ];
  }
  const policy = parsed as Record<string, unknown>;
  if (policy["identityPolicy"] !== "text-and-css-geometry-only") {
    issues.push(
      issue(
        "brand-policy-identity",
        BRAND_ASSET_POLICY_PATH,
        "identityPolicy must be text-and-css-geometry-only",
      ),
    );
  }
  for (const field of [
    "leagueLogoAllowlist",
    "teamLogoAllowlist",
    "imageAssetAllowlist",
  ]) {
    const value = policy[field];
    if (!Array.isArray(value) || value.length !== 0) {
      issues.push(
        issue(
          "brand-policy-allowlist",
          `${BRAND_ASSET_POLICY_PATH}.${field}`,
          `${field} must be an empty allowlist`,
        ),
      );
    }
  }
  return issues;
}

function main(): void {
  const root = process.cwd();
  const issues = [...validateBrandAssetPolicy(root), ...scanBrandAssets(root)];
  if (issues.length === 0) {
    console.log(
      "brand:verify OK — editorial rasters are provenance-listed; no arbitrary images, logos, remote thumbnails, or endorsement claims",
    );
    return;
  }
  for (const entry of issues) {
    console.error(`[${entry.code}] ${entry.path}: ${entry.message}`);
  }
  console.error(`brand:verify FAILED with ${issues.length} issue(s)`);
  process.exit(1);
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
