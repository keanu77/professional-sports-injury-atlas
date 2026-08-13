/** Generate the reproducible Decision 13 Phase 2 current-cover evidence set. */

import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parse, type DefaultTreeAdapterMap } from "parse5";
import sharp from "sharp";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import { scanShareAlikeCompositeRisks } from "./verify-brand-assets";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const registryPath = "src/assets/players/player-photo-registry.v4.json";
const baselinePath =
  "docs/reviews/evidence/decision-13/p0/current-cover-baseline.v1.json";
const outputPath =
  "docs/reviews/evidence/decision-13/p2/current-cover-evidence.v1.json";
const resolverPath = "src/lib/ui/editorial-images.ts";
const compositeGuardPath = "scripts/verify-brand-assets.ts";
const compositeGuardTestPath = "tests/unit/brand-assets.test.ts";
const verificationDate = "2026-08-13";
const currentRenderSourcePathRe =
  /^src\/(?:components|layouts|lib\/ui|pages)\//u;
const currentPipelineReferenceRe =
  /(?:player-photo-registry|assets\/players|editorial-images|CaseCover)/u;
const historicalRegistryReferenceRe = /player-photo-registry\.v[123]\.json/u;
const historicalAssetReferenceRe =
  /assets\/players\/(?!decision-13\/|player-photo-registry\.v4\.json)/u;

interface LocalFileRecord {
  byteLength: number;
  height: number;
  mimeType: string;
  path: string;
  sha256: string;
  width: number;
}

interface SelectionRecord {
  athleteName: string;
  caseIds: string[];
  coverKind: "commons-photo" | "original-svg-fallback";
  localFile: LocalFileRecord;
  rightsAttribution?: { licenseBucket?: string };
  sourceRiskClassification?: { category?: string };
}

interface RegistryRecord {
  schemaVersion: number;
  selections: SelectionRecord[];
}

interface BaselineCoverRecord {
  athleteName: string;
  localInput: { path: string; sha256: string };
  outputs: Array<{ path: string; sha256: string }>;
  sourceRiskCategory: string;
}

interface BaselineRecord {
  covers: BaselineCoverRecord[];
  registry: { path: string; sha256: string };
}

function walkFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function attributes(
  node: DefaultTreeAdapterMap["node"],
): ReadonlyMap<string, string> {
  const attrs = "attrs" in node ? node.attrs : undefined;
  return new Map(attrs?.map((attribute) => [attribute.name, attribute.value]));
}

function findElement(
  node: DefaultTreeAdapterMap["node"],
  predicate: (attrs: ReadonlyMap<string, string>) => boolean,
): DefaultTreeAdapterMap["element"] | null {
  if ("tagName" in node && predicate(attributes(node))) return node;
  const children = "childNodes" in node ? node.childNodes : [];
  for (const child of children) {
    const match = findElement(child, predicate);
    if (match !== null) return match;
  }
  return null;
}

function collectElements(
  node: DefaultTreeAdapterMap["node"],
  predicate: (attrs: ReadonlyMap<string, string>) => boolean,
  matches: DefaultTreeAdapterMap["element"][] = [],
): DefaultTreeAdapterMap["element"][] {
  if ("tagName" in node && predicate(attributes(node))) matches.push(node);
  const children = "childNodes" in node ? node.childNodes : [];
  for (const child of children) collectElements(child, predicate, matches);
  return matches;
}

const registryBytes = readFileSync(resolve(root, registryPath), "utf8");
const registry = parseStrictJson(registryBytes) as RegistryRecord;
if (registry.schemaVersion !== 4 || registry.selections.length !== 21) {
  throw new Error("Decision 13 evidence requires the 21-selection registry v4");
}

const baselineBytes = readFileSync(resolve(root, baselinePath), "utf8");
const baseline = parseStrictJson(baselineBytes) as BaselineRecord;
const startingHighRisk = baseline.covers.filter(
  (cover) => cover.sourceRiskCategory === "game-action-high-risk",
);
if (startingHighRisk.length !== 19) {
  throw new Error(
    "Decision 13 baseline no longer contains exactly 19 high-risk covers",
  );
}

const distFiles = walkFiles(resolve(root, "dist"));
const distHashes = new Map(
  distFiles.map((path) => [
    sha256Hex(readFileSync(path)),
    relative(root, path),
  ]),
);
const forbiddenSourceIntersections = startingHighRisk
  .filter((cover) => distHashes.has(cover.localInput.sha256))
  .map((cover) => ({
    athleteName: cover.athleteName,
    currentPath: distHashes.get(cover.localInput.sha256),
    sha256: cover.localInput.sha256,
  }));
const forbiddenOutputIntersections = startingHighRisk.flatMap((cover) =>
  cover.outputs
    .filter((output) => distHashes.has(output.sha256))
    .map((output) => ({
      athleteName: cover.athleteName,
      baselinePath: output.path,
      currentPath: distHashes.get(output.sha256),
      sha256: output.sha256,
    })),
);
if (
  forbiddenSourceIntersections.length !== 0 ||
  forbiddenOutputIntersections.length !== 0
) {
  throw new Error(
    "A current build output still matches a starting high-risk cover byte",
  );
}

const currentSelections = await Promise.all(
  registry.selections.map(async (selection) => {
    const sourceBytes = readFileSync(resolve(root, selection.localFile.path));
    if (
      sourceBytes.byteLength !== selection.localFile.byteLength ||
      sha256Hex(sourceBytes) !== selection.localFile.sha256
    ) {
      throw new Error(
        `Current local bytes drifted for ${selection.athleteName}`,
      );
    }
    const stem = basename(
      selection.localFile.path,
      extname(selection.localFile.path),
    );
    const outputPaths = distFiles
      .filter(
        (path) =>
          dirname(path) === resolve(root, "dist/_astro") &&
          basename(path).startsWith(`${stem}.`),
      )
      .sort();
    const outputs = await Promise.all(
      outputPaths.map(async (path) => {
        const metadata = await sharp(path).metadata();
        if (
          metadata.width === undefined ||
          metadata.height === undefined ||
          metadata.format === undefined
        ) {
          throw new Error(
            `Missing output dimensions for ${relative(root, path)}`,
          );
        }
        return {
          byteLength: statSync(path).size,
          format: metadata.format,
          height: metadata.height,
          path: relative(root, path),
          renditionKind:
            selection.coverKind === "commons-photo"
              ? "ordinary-astro-resize-or-format"
              : "raw-site-owned-svg-copy",
          sha256: sha256Hex(readFileSync(path)),
          width: metadata.width,
        };
      }),
    );
    if (outputs.length === 0) {
      throw new Error(
        `No current review-build output for ${selection.athleteName}`,
      );
    }
    return {
      athleteName: selection.athleteName,
      caseIds: selection.caseIds,
      coverKind: selection.coverKind,
      licenseBucket: selection.rightsAttribution?.licenseBucket ?? null,
      localInput: selection.localFile,
      outputCount: outputs.length,
      outputs,
      sourceRiskCategory:
        selection.sourceRiskClassification?.category ?? "original-svg-fallback",
    };
  }),
);

const cases = readdirSync(resolve(root, "src/content/cases"))
  .filter((filename) => filename.endsWith(".json"))
  .map((filename) =>
    parseStrictJson(
      readFileSync(resolve(root, "src/content/cases", filename), "utf8"),
    ),
  ) as Array<{
  athlete: { name: string };
  id: string;
  slug: string;
}>;
const selectionByCaseId = new Map(
  registry.selections.flatMap((selection) =>
    selection.caseIds.map((caseId) => [caseId, selection] as const),
  ),
);
const routeProof = cases
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((record) => {
    const selection = selectionByCaseId.get(record.id);
    if (
      selection === undefined ||
      selection.athleteName !== record.athlete.name
    ) {
      throw new Error(`Registry/case mapping mismatch for ${record.id}`);
    }
    const path = `dist/cases/${record.slug}/index.html`;
    const document = parse(readFileSync(resolve(root, path), "utf8"));
    const figure = findElement(
      document,
      (attrs) => attrs.get("data-editorial-case-cover") === record.id,
    );
    if (figure === null)
      throw new Error(`Missing governed hero for ${record.id}`);
    const figureAttrs = attributes(figure);
    const expectedRenderedKind =
      selection.coverKind === "commons-photo"
        ? "licensed-player-photo"
        : "original-svg-fallback";
    const renderedKind = figureAttrs.get("data-cover-kind");
    const renderedAthlete = figureAttrs.get("data-player-photo") ?? null;
    if (
      renderedKind !== expectedRenderedKind ||
      (selection.coverKind === "commons-photo" &&
        renderedAthlete !== selection.athleteName) ||
      (selection.coverKind === "original-svg-fallback" &&
        renderedAthlete !== null)
    ) {
      throw new Error(`Wrong current cover rendered for ${record.id}`);
    }
    const image = findElement(figure, (attrs) => attrs.has("src"));
    const imageSource =
      image === null ? null : (attributes(image).get("src") ?? null);
    const localSvgImage = findElement(figure, (attrs) =>
      attrs.has("data-local-original-svg"),
    );
    const localRenderValid =
      selection.coverKind === "commons-photo"
        ? imageSource !== null &&
          imageSource.startsWith("/_astro/") &&
          !/^https?:|^\/\//u.test(imageSource)
        : localSvgImage !== null &&
          "tagName" in localSvgImage &&
          localSvgImage.tagName === "img" &&
          imageSource !== null &&
          imageSource.startsWith("/_astro/") &&
          imageSource.endsWith(".svg");
    if (!localRenderValid) {
      throw new Error(
        `Current cover is not a local build asset for ${record.id}`,
      );
    }
    return {
      athleteName: record.athlete.name,
      caseId: record.id,
      imageSource,
      localOriginalSvgAsset: localSvgImage !== null,
      registryCoverKind: selection.coverKind,
      renderedCoverKind: renderedKind,
      route: `/cases/${record.slug}/`,
    };
  });

if (routeProof.length !== 26 || selectionByCaseId.size !== 26) {
  throw new Error("Decision 13 must retain exactly 26 governed case routes");
}

const htmlFiles = distFiles.filter((path) => path.endsWith(".html"));
let localSvgImageInstanceCount = 0;
let inlineSvgInstanceCount = 0;
const invalidLocalSvgAssets: string[] = [];
for (const htmlPath of htmlFiles) {
  const document = parse(readFileSync(htmlPath, "utf8"));
  const localSvgElements = collectElements(document, (attrs) =>
    attrs.has("data-local-original-svg"),
  );
  for (const element of localSvgElements) {
    const attrs = attributes(element);
    const src = attrs.get("src") ?? "";
    if (element.tagName === "svg") inlineSvgInstanceCount += 1;
    if (
      element.tagName !== "img" ||
      !src.startsWith("/_astro/") ||
      !src.endsWith(".svg")
    ) {
      invalidLocalSvgAssets.push(
        `${relative(root, htmlPath)}:${element.tagName}:${src}`,
      );
    } else {
      localSvgImageInstanceCount += 1;
    }
  }
}
if (
  localSvgImageInstanceCount < 16 ||
  inlineSvgInstanceCount !== 0 ||
  invalidLocalSvgAssets.length !== 0
) {
  throw new Error(
    `Original SVG fallbacks are not isolated local image assets: ${invalidLocalSvgAssets.join(", ")}`,
  );
}

const resolverBytes = readFileSync(resolve(root, resolverPath), "utf8");
if (
  !resolverBytes.includes("player-photo-registry.v4.json") ||
  resolverBytes.includes("player-photo-registry.v3.json")
) {
  throw new Error(
    "Current resolver must consume registry v4 and not registry v3",
  );
}

const currentRenderSourceFiles = walkFiles(resolve(root, "src"))
  .map((path) => ({ path, relativePath: relative(root, path) }))
  .filter(
    ({ relativePath }) =>
      currentRenderSourcePathRe.test(relativePath) &&
      /\.(?:astro|js|mjs|ts|tsx)$/u.test(relativePath),
  );
const sourceConsumerTrace = currentRenderSourceFiles
  .map(({ path, relativePath }) => {
    const bytes = readFileSync(path);
    const text = bytes.toString("utf8");
    return {
      currentDecision13AssetReference: text.includes(
        "assets/players/decision-13/",
      ),
      currentRegistryV4Reference: text.includes(
        "player-photo-registry.v4.json",
      ),
      historicalAssetReference: historicalAssetReferenceRe.test(text),
      historicalRegistryReference: historicalRegistryReferenceRe.test(text),
      path: relativePath,
      pipelineReference: currentPipelineReferenceRe.test(text),
      sha256: sha256Hex(bytes),
    };
  })
  .filter((entry) => entry.pipelineReference)
  .sort((left, right) => left.path.localeCompare(right.path));
const historicalCurrentReferences = sourceConsumerTrace.filter(
  (entry) =>
    entry.historicalAssetReference || entry.historicalRegistryReference,
);
if (historicalCurrentReferences.length !== 0) {
  throw new Error(
    `Current render source references historical player-photo inputs: ${historicalCurrentReferences.map((entry) => entry.path).join(", ")}`,
  );
}

const photos = currentSelections.filter(
  (selection) => selection.coverKind === "commons-photo",
);
const fallbacks = currentSelections.filter(
  (selection) => selection.coverKind === "original-svg-fallback",
);
const bySaLocalPaths = currentSelections
  .filter((selection) => selection.licenseBucket === "cc-by-sa")
  .map((selection) => selection.localInput.path)
  .sort();
if (
  photos.length !== 5 ||
  fallbacks.length !== 16 ||
  photos.some(
    (selection) => selection.sourceRiskCategory !== "non-event-low-risk",
  ) ||
  bySaLocalPaths.length !== 3
) {
  throw new Error("Unexpected current cover or license partition");
}

const compositeGuardIssues = scanShareAlikeCompositeRisks(root);
if (compositeGuardIssues.length !== 0) {
  throw new Error(
    `ShareAlike composite guard reported ${compositeGuardIssues.length} issue(s): ${compositeGuardIssues.map((entry) => `${entry.code}:${entry.path}`).join(", ")}`,
  );
}
const compositeGuardBytes = readFileSync(resolve(root, compositeGuardPath));
const compositeGuardTestBytes = readFileSync(
  resolve(root, compositeGuardTestPath),
);

const evidence = {
  baseline: {
    evidencePath: baselinePath,
    evidenceSha256: sha256Hex(baselineBytes),
    highRiskCoverCount: startingHighRisk.length,
    registry: baseline.registry,
  },
  compositeAudit: {
    bySaCurrentPhotoCount: bySaLocalPaths.length,
    bySaLocalPaths,
    guardCommand: "npm run brand:verify",
    guardIssueCount: compositeGuardIssues.length,
    guardSource: {
      path: compositeGuardPath,
      sha256: sha256Hex(compositeGuardBytes),
    },
    guardTests: {
      controlledForbiddenFixtures: [
        "historical-current-render-reference",
        "player-photo-raster-composition",
        "player-photo-social-metadata",
        "unreviewed-production-consumer",
        "composite-like-raster",
        "composite-generator-script",
        "direct-composition-dependency",
      ],
      path: compositeGuardTestPath,
      sha256: sha256Hex(compositeGuardTestBytes),
    },
    permittedUse: "ordinary-html-css-placement-and-astro-renditions-only",
  },
  current: {
    caseCount: routeProof.length,
    fallbackCount: fallbacks.length,
    gameActionHighRiskCount: 0,
    photoCount: photos.length,
    registryPath,
    registrySha256: sha256Hex(registryBytes),
    resolverPath,
    selections: currentSelections,
  },
  forbiddenHistoricalBuildIntersections: {
    outputCount: forbiddenOutputIntersections.length,
    outputs: forbiddenOutputIntersections,
    sourceCount: forbiddenSourceIntersections.length,
    sources: forbiddenSourceIntersections,
  },
  generatedFromReviewBuild: true,
  routeProof,
  schemaVersion: 1,
  sourceConsumerAudit: {
    historicalCurrentReferenceCount: historicalCurrentReferences.length,
    productionRenderTrace: sourceConsumerTrace,
  },
  svgDomIsolationAudit: {
    htmlFileCount: htmlFiles.length,
    inlineSvgInstanceCount,
    invalidLocalAssetCount: invalidLocalSvgAssets.length,
    invalidLocalAssets: invalidLocalSvgAssets,
    localSvgImageInstanceCount,
    renderMode: "local-svg-img-with-css-object-fit-cover",
  },
  verificationDate,
};

mkdirSync(dirname(resolve(root, outputPath)), { recursive: true });
writeFileSync(resolve(root, outputPath), canonicalJson(evidence));
console.log(
  `Decision 13 cover replacement evidenced: ${photos.length} photos, ${fallbacks.length} SVG fallbacks, ${routeProof.length} routes, zero prohibited high-risk byte intersections`,
);
