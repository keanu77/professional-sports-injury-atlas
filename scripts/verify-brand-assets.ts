/**
 * Brand-asset verifier. The site identity is text/CSS-geometry only with an
 * empty league/team/image allowlist: any image file under `public/` or
 * `src/assets/`, any `<img>`/remote thumbnail/logo source in authored
 * templates, any logo/image URL field in content, trademark-like asset
 * names, or any claim of official partnership/authorization fails. Plain
 * editorial text such as `NBA` remains allowed with the independent-site
 * disclaimer; locally packaged fonts remain allowed only through the pinned
 * `@fontsource` imports; unavoidable branding inside an official third-party
 * player is not altered or obscured.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import {
  issue,
  parseStrictJson,
  type ValidationIssue,
} from "../src/lib/contracts/canonical";

export const BRAND_ASSET_POLICY_PATH = "src/data/brand-asset-policy.v1.json";

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|svg|ico|bmp|tiff?)$/i;
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
  const issues: ValidationIssue[] = [];

  for (const assetDir of ["public", "src/assets"]) {
    for (const filePath of walkFiles(join(root, assetDir))) {
      const relPath = relative(root, filePath);
      if (IMAGE_EXT_RE.test(relPath)) {
        issues.push(
          issue(
            "brand-image-asset",
            relPath,
            "image files are forbidden; site identity is text/CSS geometry only",
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
      "brand:verify OK — no image assets, logos, remote thumbnails, or endorsement claims",
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
