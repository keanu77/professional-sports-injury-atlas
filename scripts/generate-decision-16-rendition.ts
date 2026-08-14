/** Generates the immutable Decision 16 Trae Young local rendition. */

import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import sharp, { type Metadata } from "sharp";

import { sha256Hex } from "../src/lib/contracts/canonical";
import { DECISION_15_NON_CLEARANCE_STATEMENT } from "../src/lib/contracts/decision-15-photo-contract";
import {
  DECISION_16_ATTRIBUTION,
  DECISION_16_CHANGE_DISCLOSURE,
  DECISION_16_POLICY_BINDING,
  DECISION_16_QUALITY_LADDER,
  DECISION_16_RENDITION_COLOR_TREATMENT,
  DECISION_16_RENDITION_CREATED_AT,
  DECISION_16_RENDITION_METADATA_TREATMENT,
  DECISION_16_RENDITION_ORIENTATION_TREATMENT,
  DECISION_16_RENDITION_REQUIREMENTS,
  DECISION_16_SHARP_DECODE_CONTRACT,
  DECISION_16_SCOPE_ID,
  DECISION_16_SOURCE_ORIGINAL,
  validateDecision16Rendition,
  type Decision16ImageDecodeFacts,
  type Decision16QualityCandidate,
  type Decision16RenditionRecord,
} from "../src/lib/contracts/decision-16-rendition-contract";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const REQUIRED_NODE_VERSION = "v24.14.0";
const REQUIRED_SHARP_VERSION = "0.35.3";
const CREATOR_NOTICE = "Erik Drost";

interface MetadataInventory {
  colorSpace: string;
  density: number | undefined;
  exifSha256: string;
  height: number;
  iccSha256: string;
  iptcSha256: string;
  orientation: number | undefined;
  width: number;
  xmpSha256: string;
}

export interface Decision16GeneratedRendition {
  record: Decision16RenditionRecord;
  renditionDecodeFacts: Decision16ImageDecodeFacts;
  renditionBytes: Buffer;
  renditionMetadata: MetadataInventory;
  sourceDecodeFacts: Decision16ImageDecodeFacts;
  sourceMetadata: MetadataInventory;
}

function assertRuntime(): void {
  if (process.version !== REQUIRED_NODE_VERSION) {
    throw new Error(
      `Decision 16 rendition generation requires Node ${REQUIRED_NODE_VERSION}; received ${process.version}`,
    );
  }
  if (sharp.versions.sharp !== REQUIRED_SHARP_VERSION) {
    throw new Error(
      `Decision 16 rendition generation requires Sharp ${REQUIRED_SHARP_VERSION}; received ${sharp.versions.sharp ?? "unknown"}`,
    );
  }
}

function sha1Hex(bytes: Uint8Array): string {
  return createHash("sha1").update(bytes).digest("hex");
}

export async function decodeDecision16ImageWithSharp(
  bytes: Uint8Array,
): Promise<Decision16ImageDecodeFacts> {
  assertRuntime();
  const { data, info } = await sharp(bytes, { failOn: "warning" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.format !== "raw" || info.size !== data.byteLength) {
    throw new Error(
      "Sharp did not emit a complete Decision 16 raw-pixel decode",
    );
  }
  return {
    decoded: {
      channels: info.channels,
      height: info.height,
      pixelByteLength: data.byteLength,
      pixelSha256: sha256Hex(data),
      width: info.width,
    },
    decoder: DECISION_16_SHARP_DECODE_CONTRACT,
    input: {
      byteLength: bytes.byteLength,
      sha256: sha256Hex(bytes),
    },
  };
}

function requiredBlock(
  metadata: Metadata,
  key: "exif" | "icc" | "iptc" | "xmp",
): Buffer {
  const block = metadata[key];
  if (block === undefined || block.byteLength === 0) {
    throw new Error(`Decision 16 ${key.toUpperCase()} metadata is missing`);
  }
  return block;
}

function inventoryMetadata(metadata: Metadata): MetadataInventory {
  if (
    metadata.format !== "jpeg" ||
    metadata.width === undefined ||
    metadata.height === undefined ||
    metadata.space === undefined
  ) {
    throw new Error(
      "Decision 16 requires a decoded JPEG with known geometry and color space",
    );
  }

  return {
    colorSpace: metadata.space,
    density: metadata.density,
    exifSha256: sha256Hex(requiredBlock(metadata, "exif")),
    height: metadata.height,
    iccSha256: sha256Hex(requiredBlock(metadata, "icc")),
    iptcSha256: sha256Hex(requiredBlock(metadata, "iptc")),
    orientation: metadata.orientation,
    width: metadata.width,
    xmpSha256: sha256Hex(requiredBlock(metadata, "xmp")),
  };
}

function includesCreator(
  metadata: Metadata,
  key: "exif" | "iptc" | "xmp",
): boolean {
  return requiredBlock(metadata, key).includes(Buffer.from(CREATOR_NOTICE));
}

function assertCompleteJpeg(bytes: Uint8Array, label: string): void {
  if (
    bytes.byteLength < 4 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes[bytes.byteLength - 2] !== 0xff ||
    bytes[bytes.byteLength - 1] !== 0xd9
  ) {
    throw new Error(`${label} does not have complete JPEG framing`);
  }
}

function assertRegularSource(path: string): void {
  const status = lstatSync(path);
  if (!status.isFile() || status.isSymbolicLink()) {
    throw new Error("Decision 16 source must be a regular non-symlink file");
  }
}

async function renderCandidate(
  sourceBytes: Buffer,
  quality: number,
): Promise<Buffer> {
  const { data, info } = await sharp(sourceBytes, { failOn: "error" })
    .resize({
      fit: "inside",
      height: DECISION_16_RENDITION_REQUIREMENTS.exactLongestEdge,
      kernel: "lanczos3",
      width: DECISION_16_RENDITION_REQUIREMENTS.exactLongestEdge,
      withoutEnlargement: true,
    })
    .keepMetadata()
    .jpeg({
      chromaSubsampling: "4:4:4",
      mozjpeg: false,
      progressive: false,
      quality,
    })
    .toBuffer({ resolveWithObject: true });

  if (
    info.format !== "jpeg" ||
    info.width !== DECISION_16_RENDITION_REQUIREMENTS.exactWidth ||
    info.height !== DECISION_16_RENDITION_REQUIREMENTS.exactHeight ||
    info.size !== data.byteLength
  ) {
    throw new Error(
      `Sharp emitted unexpected Decision 16 candidate facts at quality ${quality}`,
    );
  }
  assertCompleteJpeg(data, `Decision 16 candidate quality ${quality}`);
  return data;
}

export async function generateDecision16RenditionArtifact(): Promise<Decision16GeneratedRendition> {
  assertRuntime();
  const sourcePath = resolve(
    ROOT,
    DECISION_16_SOURCE_ORIGINAL.repositoryFile.path,
  );
  assertRegularSource(sourcePath);
  const sourceBytes = readFileSync(sourcePath);
  if (
    sourceBytes.byteLength !==
      DECISION_16_SOURCE_ORIGINAL.repositoryFile.byteLength ||
    sha256Hex(sourceBytes) !==
      DECISION_16_SOURCE_ORIGINAL.repositoryFile.sha256 ||
    sha1Hex(sourceBytes) !== DECISION_16_SOURCE_ORIGINAL.upstream.mediaWikiSha1
  ) {
    throw new Error(
      "Decision 16 source bytes differ from the frozen byte length, SHA-256, or MediaWiki SHA-1",
    );
  }
  assertCompleteJpeg(sourceBytes, "Decision 16 source");

  const sourceDecoded = await sharp(sourceBytes, {
    failOn: "error",
  }).metadata();
  const sourceMetadata = inventoryMetadata(sourceDecoded);
  if (
    sourceMetadata.width !== DECISION_16_SOURCE_ORIGINAL.repositoryFile.width ||
    sourceMetadata.height !==
      DECISION_16_SOURCE_ORIGINAL.repositoryFile.height ||
    sourceMetadata.orientation !== undefined ||
    sourceMetadata.colorSpace !== "srgb" ||
    !includesCreator(sourceDecoded, "exif") ||
    !includesCreator(sourceDecoded, "iptc") ||
    !includesCreator(sourceDecoded, "xmp")
  ) {
    throw new Error(
      "Decision 16 source geometry, orientation, color space, or embedded creator metadata drifted",
    );
  }

  const qualityCandidates: Decision16QualityCandidate[] = [];
  let renditionBytes: Buffer | undefined;
  for (const quality of DECISION_16_QUALITY_LADDER) {
    const candidate = await renderCandidate(sourceBytes, quality);
    qualityCandidates.push({
      byteLength: candidate.byteLength,
      quality,
      sha256: sha256Hex(candidate),
    });
    if (
      candidate.byteLength <=
      DECISION_16_RENDITION_REQUIREMENTS.maximumByteLength
    ) {
      renditionBytes = candidate;
      break;
    }
  }
  if (renditionBytes === undefined) {
    throw new Error(
      "No Decision 16 quality candidate meets the 5,000,000-byte ceiling",
    );
  }

  const renditionDecoded = await sharp(renditionBytes, {
    failOn: "error",
  }).metadata();
  const renditionMetadata = inventoryMetadata(renditionDecoded);
  if (
    renditionMetadata.width !== DECISION_16_RENDITION_REQUIREMENTS.exactWidth ||
    renditionMetadata.height !==
      DECISION_16_RENDITION_REQUIREMENTS.exactHeight ||
    renditionMetadata.orientation !== 1 ||
    renditionMetadata.colorSpace !== sourceMetadata.colorSpace ||
    renditionMetadata.iccSha256 !== sourceMetadata.iccSha256 ||
    !includesCreator(renditionDecoded, "exif") ||
    !includesCreator(renditionDecoded, "iptc") ||
    !includesCreator(renditionDecoded, "xmp")
  ) {
    throw new Error(
      "Decision 16 rendition geometry, orientation, color profile, or embedded creator metadata is invalid",
    );
  }

  const observedColorTreatment = `Embedded ICC profile retained byte-for-byte (SHA-256 ${sourceMetadata.iccSha256}); source and rendition decode as sRGB.`;
  const observedMetadataTreatment = `Sharp keepMetadata() retained embedded creator/rights metadata; EXIF ${sourceMetadata.exifSha256} -> ${renditionMetadata.exifSha256}, IPTC ${sourceMetadata.iptcSha256} -> ${renditionMetadata.iptcSha256}, XMP ${sourceMetadata.xmpSha256} -> ${renditionMetadata.xmpSha256}.`;
  const observedOrientationTreatment =
    "The source has no EXIF orientation tag; no rotation or auto-orientation was applied, and Sharp keepMetadata() wrote the equivalent top-left orientation value 1 to the rendition.";
  if (
    observedColorTreatment !== DECISION_16_RENDITION_COLOR_TREATMENT ||
    observedMetadataTreatment !== DECISION_16_RENDITION_METADATA_TREATMENT ||
    observedOrientationTreatment !== DECISION_16_RENDITION_ORIENTATION_TREATMENT
  ) {
    throw new Error(
      "Decision 16 decoded color/orientation/metadata facts differ from the frozen treatment record",
    );
  }

  const sourceDecodeFacts = await decodeDecision16ImageWithSharp(sourceBytes);
  const renditionDecodeFacts =
    await decodeDecision16ImageWithSharp(renditionBytes);

  const selectedQuality = qualityCandidates.at(-1)!.quality;
  const record: Decision16RenditionRecord = {
    athleteName: "Trae Young",
    attribution: DECISION_16_ATTRIBUTION,
    caseIds: ["CASE-NBAANKLE-2021-001"],
    currentCoverStatus: "current",
    localRendition: {
      changeDisclosure: DECISION_16_CHANGE_DISCLOSURE,
      derivedFrom: {
        relationship: "exact-source-bytes",
        sourcePath: DECISION_16_SOURCE_ORIGINAL.repositoryFile.path,
        sourceSha256: DECISION_16_SOURCE_ORIGINAL.repositoryFile.sha256,
      },
      repositoryFile: {
        byteLength: renditionBytes.byteLength,
        height: DECISION_16_RENDITION_REQUIREMENTS.exactHeight,
        mimeType: DECISION_16_RENDITION_REQUIREMENTS.exactMimeType,
        path: DECISION_16_RENDITION_REQUIREMENTS.exactPath,
        sha256: sha256Hex(renditionBytes),
        width: DECISION_16_RENDITION_REQUIREMENTS.exactWidth,
      },
      transformation: {
        actor: "decision-16-rendition-generator",
        aspectRatioPreserved: true,
        colorTreatment: DECISION_16_RENDITION_COLOR_TREATMENT,
        createdAt: DECISION_16_RENDITION_CREATED_AT,
        cropApplied: false,
        enlarged: false,
        fullFrame: true,
        jpegOptions: {
          chromaSubsampling: "4:4:4",
          mozjpeg: false,
          progressive: false,
        },
        metadataTreatment: DECISION_16_RENDITION_METADATA_TREATMENT,
        orientationTreatment: DECISION_16_RENDITION_ORIENTATION_TREATMENT,
        qualityCandidates,
        qualityLadder: [...DECISION_16_QUALITY_LADDER],
        resizeOptions: {
          fit: "inside",
          kernel: "lanczos3",
          longestEdgePixels: 2400,
          withoutEnlargement: true,
        },
        selectedQuality,
        tool: { name: "sharp", version: REQUIRED_SHARP_VERSION },
      },
    },
    nonClearanceStatement: DECISION_15_NON_CLEARANCE_STATEMENT,
    policyBinding: DECISION_16_POLICY_BINDING,
    scopeId: DECISION_16_SCOPE_ID,
    sourceOriginal: DECISION_16_SOURCE_ORIGINAL,
    sourceOriginalRetained: true,
  };

  const validation = validateDecision16Rendition({
    record,
    renditionDecodeFacts,
    renditionBytes,
    sourceDecodeFacts,
    sourceBytes,
  });
  if (validation.issues.length > 0) {
    throw new Error(
      `Generated Decision 16 rendition record failed its contract: ${validation.issues
        .map((entry) => entry.code)
        .join(", ")}`,
    );
  }

  return {
    record,
    renditionBytes,
    renditionDecodeFacts,
    renditionMetadata,
    sourceDecodeFacts,
    sourceMetadata,
  };
}

async function main(): Promise<void> {
  const generated = await generateDecision16RenditionArtifact();
  const outputPath = resolve(
    ROOT,
    DECISION_16_RENDITION_REQUIREMENTS.exactPath,
  );
  const checkOnly = process.argv.includes("--check");
  let committed: Buffer | undefined;
  try {
    const status = lstatSync(outputPath);
    if (!status.isFile() || status.isSymbolicLink()) {
      throw new Error("Decision 16 output must be a regular non-symlink file");
    }
    committed = readFileSync(outputPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  if (committed !== undefined) {
    if (!committed.equals(generated.renditionBytes)) {
      throw new Error(
        "Committed Decision 16 rendition differs from exact regeneration; append-only asset will not be overwritten",
      );
    }
  } else if (checkOnly) {
    throw new Error("Committed Decision 16 rendition is missing");
  } else {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, generated.renditionBytes, { flag: "wx" });
  }

  const file = generated.record.localRendition.repositoryFile;
  const candidates =
    generated.record.localRendition.transformation.qualityCandidates
      .map((entry) => `q${entry.quality}=${entry.byteLength}:${entry.sha256}`)
      .join(",");
  console.log(
    `Decision 16 rendition ${checkOnly ? "OK" : "generated"} — ${file.width}x${file.height}, ${file.byteLength} bytes, q${generated.record.localRendition.transformation.selectedQuality}, sha256=${file.sha256}, candidates=[${candidates}]`,
  );
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main();
}
