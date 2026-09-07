/**
 * Brand-asset verifier. Site identity remains text/CSS-geometry only with an
 * empty league/team/logo allowlist. Raster exceptions are limited to two
 * exact governed inventories, plus Decision 25 local video covers: generated injury-theme images beneath
 * `src/assets/heroes/` and licensed Commons player photos beneath
 * `src/assets/players/`. Arbitrary assets, source intermediates, authored
 * `<img>` tags, remote thumbnails/logos, trademark-like names, and claims of
 * official partnership/authorization still fail closed.
 */

import { loadVideoThumbnails } from "./verify-video-thumbnails";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import {
  issue,
  parseStrictJson,
  type ValidationIssue,
} from "../src/lib/contracts/canonical";
import { loadPlayerPhotoAssets } from "./verify-player-photo-assets";

export const BRAND_ASSET_POLICY_PATH = "src/data/brand-asset-policy.v1.json";
export const EDITORIAL_IMAGE_PROVENANCE_PATH =
  "src/assets/heroes/provenance.json";

// User-approved text/CSS homepage screenshot. See docs/reviews/2026-09-07-share-preview.md.
export const SITE_SHARE_SCREENSHOT_PATH =
  "public/social/injury-atlas-home-20260907.png";
const SITE_SHARE_SCREENSHOT_SHA256 =
  "d5ac4db08b672fc4065b66a83cb65d77b4fa7d7a51c8cb2c5cdb589f5e9d2c30";
export function isApprovedSiteShareScreenshot(root: string): boolean {
  const path = join(root, SITE_SHARE_SCREENSHOT_PATH);
  return (
    existsSync(path) &&
    createHash("sha256").update(readFileSync(path)).digest("hex") ===
      SITE_SHARE_SCREENSHOT_SHA256
  );
}

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
const COMPOSITE_ASSET_FILENAME_RE =
  /(?:^|[-_.])(?:og|open-graph|social|share|infographic|composite)(?:[-_.]|$)/i;
const PLAYER_PHOTO_PIPELINE_RE =
  /(?:src\/assets\/players|assets\/players|player-photo-registry|editorial-images|CaseCover)/;
const RASTER_COMPOSITION_CALL_RE =
  /(?:\.composite\s*\(|\bcreateCanvas\s*\(|\bdrawImage\s*\(|\bfillText\s*\(|\bsatori\s*\(|\bImageResponse\s*\(|\bnew\s+Resvg\s*\()/;
const PLAYER_SOCIAL_META_RE =
  /(?:og:image|twitter:image)[\s\S]{0,400}(?:player-photo|assets\/players)|(?:player-photo|assets\/players)[\s\S]{0,400}(?:og:image|twitter:image)/i;
const CURRENT_RENDER_SOURCE_RE = /^src\/(?:components|layouts|lib\/ui|pages)\//;
const HISTORICAL_PLAYER_REGISTRY_REFERENCE_RE =
  /player-photo-registry\.v[1-7]\.json/;
const HISTORICAL_PLAYER_ASSET_REFERENCE_RE =
  /assets\/players\/(?!decision-(?:13|14|15|16)\/|player-photo-registry\.v8\.json)/;
const PLAYER_ASSET_STRING_LITERAL_RE =
  /(["'`])([^"'`\r\n]*assets\/players\/[^"'`\r\n]*)\1/gu;
const CURRENT_DECISION_15_PLAYER_ASSET_REFERENCES = new Set([
  "assets/players/decision-15/anfernee-simons.jpg",
  "assets/players/decision-15/anthony-edwards.jpg",
  "assets/players/decision-15/brandon-clarke.jpg",
  "assets/players/decision-15/danny-green.jpg",
  "assets/players/decision-15/dejounte-murray.jpg",
  "assets/players/decision-15/ja-morant.jpg",
  "assets/players/decision-15/joe-ingles.jpg",
  "assets/players/decision-15/lamelo-ball.jpg",
  "assets/players/decision-15/markelle-fultz.jpg",
  "assets/players/decision-15/moritz-wagner.jpg",
  "assets/players/decision-15/ricky-rubio.jpg",
  "assets/players/decision-15/thomas-bryant.jpg",
  "assets/players/decision-15/tyrese-haliburton.jpg",
]);
const CURRENT_DECISION_16_TRAE_ASSET_REFERENCE =
  "assets/players/decision-16/trae-young.jpg";
const SUPERSEDED_TRAE_ASSET_REFERENCE_FRAGMENTS = [
  "assets/players/trae-young.jpg",
  "assets/players/decision-13/trae-young.svg",
  "assets/players/decision-15/trae-young.jpg",
] as const;
const DIRECT_COMPOSITION_PACKAGES = new Set([
  "@resvg/resvg-js",
  "@vercel/og",
  "canvas",
  "satori",
  "sharp",
]);
const APPROVED_PLAYER_PHOTO_PRODUCTION_CONSUMERS = new Set([
  "src/components/atlas/CaseCard.astro",
  "src/components/atlas/EditorialHero.astro",
  "src/components/atlas/EmptyState.astro",
  "src/components/atlas/InjuryCard.astro",
  "src/components/cases/CaseCover.astro",
  "src/components/cases/CaseVideo.astro",
  // Decision 13 Phase 4 approved a text-only, registry-derived central
  // attribution surface. These consumers expose rights metadata and never
  // compose, export, or select player-photo pixels.
  "src/components/credits/PhotoCredit.astro",
  // Decision 13 Phase 0 reviewed this pure schema/verifier module. The
  // composition checks below still apply if it ever gains rendering code.
  "src/lib/contracts/decision-15-photo-contract.ts",
  // Decision 16 Phase 0 reviewed this pure dual-fact rendition contract. It
  // validates provenance/attribution bytes and cannot render or compose pixels.
  "src/lib/contracts/decision-16-rendition-contract.ts",
  "src/lib/contracts/player-photo-registry-v4.ts",
  "src/lib/contracts/player-photo-registry-v5.ts",
  "src/lib/contracts/player-photo-registry-v6.ts",
  "src/lib/contracts/player-photo-registry-v7.ts",
  "src/lib/contracts/player-photo-registry-v8.ts",
  "src/lib/contracts/player-photo.ts",
  "src/lib/governance/site-digest.ts",
  "src/lib/rights/photo-credits.ts",
  "src/lib/ui/editorial-images.ts",
  "src/pages/cases/[slug].astro",
  "src/pages/index.astro",
  "src/pages/injuries/[injury].astro",
]);

function referencesHistoricalCurrentCover(text: string): boolean {
  if (
    HISTORICAL_PLAYER_REGISTRY_REFERENCE_RE.test(text) ||
    HISTORICAL_PLAYER_ASSET_REFERENCE_RE.test(text) ||
    SUPERSEDED_TRAE_ASSET_REFERENCE_FRAGMENTS.some((reference) =>
      text.includes(reference),
    )
  ) {
    return true;
  }

  for (const match of text.matchAll(PLAYER_ASSET_STRING_LITERAL_RE)) {
    const literal = match[2]!;
    const assetStart = literal.indexOf("assets/players/");
    const reference = literal.slice(assetStart);
    if (
      (reference.startsWith("assets/players/decision-15/") &&
        !CURRENT_DECISION_15_PLAYER_ASSET_REFERENCES.has(reference)) ||
      (reference.startsWith("assets/players/decision-16/") &&
        reference !== CURRENT_DECISION_16_TRAE_ASSET_REFERENCE)
    ) {
      return true;
    }
  }

  return false;
}

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

/**
 * Fail-closed ShareAlike composite guard. The governed player JPEGs may flow
 * through Astro's ordinary Picture resize/crop encoder, but no authored code
 * may combine that pipeline with canvas/SVG/raster composition or feed it to
 * social-image metadata. A newly tracked OG/social/composite raster or direct
 * composition dependency also requires a fresh rights audit before it enters
 * the governed inventory.
 */
export function scanShareAlikeCompositeRisks(root: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const assetDir of ["public", "src/assets"]) {
    for (const filePath of walkFiles(join(root, assetDir))) {
      const relPath = relative(root, filePath);
      if (
        IMAGE_EXT_RE.test(relPath) &&
        COMPOSITE_ASSET_FILENAME_RE.test(relPath) &&
        !(
          relPath === SITE_SHARE_SCREENSHOT_PATH &&
          isApprovedSiteShareScreenshot(root)
        )
      ) {
        issues.push(
          issue(
            "brand-sharealike-composite-asset",
            relPath,
            "OG/social/share/composite rasters require a fresh rights audit and must not contain governed player photos",
          ),
        );
      }
    }
  }

  for (const codeDir of ["src", "scripts"]) {
    for (const filePath of walkFiles(join(root, codeDir))) {
      const relPath = relative(root, filePath);
      if (
        relPath === "scripts/verify-brand-assets.ts" ||
        !/\.(astro|ts|tsx|js|mjs|css)$/.test(relPath)
      ) {
        continue;
      }
      const text = readFileSync(filePath, "utf8");
      if (
        CURRENT_RENDER_SOURCE_RE.test(relPath) &&
        referencesHistoricalCurrentCover(text)
      ) {
        issues.push(
          issue(
            "brand-current-cover-historical-reference",
            relPath,
            "current render code must consume only registry v8 and its exact current named-cover assets; v1-v7 registries and superseded Trae assets are historical-only",
          ),
        );
      }
      if (
        codeDir === "src" &&
        PLAYER_PHOTO_PIPELINE_RE.test(text) &&
        !APPROVED_PLAYER_PHOTO_PRODUCTION_CONSUMERS.has(relPath)
      ) {
        issues.push(
          issue(
            "brand-sharealike-new-consumer",
            relPath,
            "new player-photo production consumers require a fresh rights audit before they can produce cards, social images, or other outputs",
          ),
        );
      }
      if (
        PLAYER_PHOTO_PIPELINE_RE.test(text) &&
        RASTER_COMPOSITION_CALL_RE.test(text)
      ) {
        issues.push(
          issue(
            "brand-sharealike-composite-code",
            relPath,
            "player-photo pipeline references must not enter authored raster-composition code",
          ),
        );
      }
      if (PLAYER_SOCIAL_META_RE.test(text)) {
        issues.push(
          issue(
            "brand-sharealike-social-meta",
            relPath,
            "OG/Twitter image metadata must not resolve from the governed player-photo pipeline",
          ),
        );
      }
    }
  }

  const packagePath = join(root, "package.json");
  if (existsSync(packagePath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as {
        dependencies?: Record<string, unknown>;
        devDependencies?: Record<string, unknown>;
        scripts?: Record<string, unknown>;
      };
      for (const section of [
        packageJson.dependencies ?? {},
        packageJson.devDependencies ?? {},
      ]) {
        for (const packageName of Object.keys(section)) {
          if (DIRECT_COMPOSITION_PACKAGES.has(packageName)) {
            issues.push(
              issue(
                "brand-sharealike-composite-dependency",
                `package.json.${packageName}`,
                "a direct raster-composition dependency requires a fresh rights audit before use with governed photos",
              ),
            );
          }
        }
      }
      for (const [scriptName, command] of Object.entries(
        packageJson.scripts ?? {},
      )) {
        if (
          /(?:^|:)(?:og|social|share|composite)(?::|$)/i.test(scriptName) &&
          typeof command === "string" &&
          !/verify|check|audit/i.test(command)
        ) {
          issues.push(
            issue(
              "brand-sharealike-composite-script",
              `package.json.scripts.${scriptName}`,
              "an OG/social/composite generator requires a fresh rights audit and an explicit non-SA input contract",
            ),
          );
        }
      }
    } catch {
      // Other project checks own malformed package.json diagnostics.
    }
  }

  return issues;
}

/** Scans the repository for brand-asset violations. */
export function scanBrandAssets(root: string): ValidationIssue[] {
  const provenance = loadEditorialImageProvenance(root);
  const playerDirectory = join(root, "src/assets/players");
  const playerPhotos = existsSync(playerDirectory)
    ? loadPlayerPhotoAssets(root)
    : { allowedPaths: [], issues: [] };
  const videoThumbnails = loadVideoThumbnails(root);
  const governedPaths = new Set([
    ...(isApprovedSiteShareScreenshot(root)
      ? [SITE_SHARE_SCREENSHOT_PATH]
      : []),
    ...videoThumbnails.allowedPaths,
    ...provenance.allowedPaths,
    ...playerPhotos.allowedPaths,
  ]);
  const issues: ValidationIssue[] = [
    ...videoThumbnails.issues,
    ...provenance.issues,
    ...playerPhotos.issues,
    ...scanShareAlikeCompositeRisks(root),
  ];

  for (const assetDir of ["public", "src/assets"]) {
    for (const filePath of walkFiles(join(root, assetDir))) {
      const relPath = relative(root, filePath);
      if (IMAGE_EXT_RE.test(relPath)) {
        if (governedPaths.has(relPath)) continue;
        issues.push(
          issue(
            "brand-image-asset",
            relPath,
            "image file is not listed in an exact governed raster inventory",
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
      "brand:verify OK — generated and licensed rasters are provenance-listed; no arbitrary images, logos, remote thumbnails, ShareAlike composites, or endorsement claims",
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
