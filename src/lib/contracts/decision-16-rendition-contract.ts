/** Decision 16's pure, fail-closed Trae Young local-rendition contract. */

import { createHash } from "node:crypto";

import { canonicalJson, sha256Hex, type ValidationIssue } from "./canonical";
import { DECISION_15_NON_CLEARANCE_STATEMENT } from "./decision-15-photo-contract";

export const DECISION_16_SCOPE_ID =
  "decision-16-trae-young-rendition-only" as const;
export const DECISION_16_POLICY_BINDING = Object.freeze({
  jsonPath: "research/source-policy/source-policy.v9.json",
  jsonSha256:
    "0ac3fecc04e12b88134ce97d11fbe1c742af1f21664a9c80eaf0d76ab7cfcfba",
  markdownPath: "research/source-policy/nba.v9.md",
  markdownSha256:
    "03f6a61ee6ef958cae2ae9b918d7b6a115ff0d346f63202efce8780744fbadf2",
  sourcePolicyVersion: "nba-v9",
});

export const DECISION_16_SOURCE_ORIGINAL = Object.freeze({
  repositoryFile: {
    byteLength: 39_619_306,
    height: 5504,
    mimeType: "image/jpeg",
    path: "src/assets/players/decision-15/trae-young.jpg",
    sha256: "b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0",
    width: 6351,
  },
  upstream: {
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Trae_Young_(2022_All-Star_Weekend)_(cropped).jpg",
    filename: "Trae Young (2022 All-Star Weekend) (cropped).jpg",
    mediaWikiSha1: "193bb8a75e73f878359d136f0769205a4a8693ba",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/4/42/Trae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg",
    revisionId: 1_148_485_505,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ATrae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg&oldid=1148485505",
    revisionTimestamp: "2026-01-16T19:13:29Z",
  },
  upstreamAlterationDisclosure:
    "Commons extraction and CropTool derivative; unmodified local original with site CSS presentation crop.",
});

export const DECISION_16_RENDITION_REQUIREMENTS = Object.freeze({
  exactHeight: 2080,
  exactLongestEdge: 2400,
  exactMimeType: "image/jpeg",
  exactPath: "src/assets/players/decision-16/trae-young.jpg",
  exactWidth: 2400,
  maximumByteLength: 5_000_000,
});

export const DECISION_16_QUALITY_LADDER = [95, 92, 90, 88, 85, 82, 80] as const;

export const DECISION_16_CHANGE_DISCLOSURE =
  "The 6351×5504 Commons original was downscaled without cropping and JPEG-re-encoded to 2400×2080 for this local rendition." as const;

export const DECISION_16_RENDITION_CREATED_AT = "2026-08-14" as const;
export const DECISION_16_RENDITION_COLOR_TREATMENT =
  "Embedded ICC profile retained byte-for-byte (SHA-256 2b3aa1645779a9e634744faf9b01e9102b0c9b88fd6deced7934df86b949af7e); source and rendition decode as sRGB." as const;
export const DECISION_16_RENDITION_METADATA_TREATMENT =
  "Sharp keepMetadata() retained embedded creator/rights metadata; EXIF 1a1c9581fce6d236b0d359f489fd9ba8649799c4fb6bade36b3d9801b81101e2 -> 7c4a8267208eeec90cca7f163df33bd25501085e01cb595a8b33555fdb566e57, IPTC b89f09d74b9e0d8debd12bcb62be504b717f32239f32cb2c9d37e587fe6760b9 -> b89f09d74b9e0d8debd12bcb62be504b717f32239f32cb2c9d37e587fe6760b9, XMP 390cde215fe9be8639048f70665c13480de5e140cc084650f5fae810f3751ed9 -> 390cde215fe9be8639048f70665c13480de5e140cc084650f5fae810f3751ed9." as const;
export const DECISION_16_RENDITION_ORIENTATION_TREATMENT =
  "The source has no EXIF orientation tag; no rotation or auto-orientation was applied, and Sharp keepMetadata() wrote the equivalent top-left orientation value 1 to the rendition." as const;

export const DECISION_16_SHARP_DECODE_CONTRACT = Object.freeze({
  failOn: "warning",
  name: "sharp",
  output: "raw-pixels",
  version: "0.35.3",
});

export const DECISION_16_ATTRIBUTION = Object.freeze({
  adapterLicense: null,
  changeDisclosureVisible: true,
  copyrightNotice: "Erik Drost",
  creditedName: "Erik Drost",
  fixedSourceUrl: DECISION_16_SOURCE_ORIGINAL.upstream.revisionPermalink,
  license: {
    bucket: "cc-by",
    name: "CC BY 2.0",
    token: "cc-by-2.0",
    url: "https://creativecommons.org/licenses/by/2.0",
    version: "2.0",
  },
  suppliedCopyrightNoticeVisible: true,
  suppliedTitleVisible: true,
  termsLinkVisible: true,
  upstreamAlterationDisclosureVisible: true,
  workTitle: "Trae Young",
});

export interface Decision16ImageFacts {
  byteLength: number;
  height: number;
  mimeType: string;
  path: string;
  sha256: string;
  width: number;
}

export interface Decision16QualityCandidate {
  byteLength: number;
  quality: number;
  sha256: string;
}

export interface Decision16ImageDecodeFacts {
  decoded: {
    channels: number;
    height: number;
    pixelByteLength: number;
    pixelSha256: string;
    width: number;
  };
  decoder: typeof DECISION_16_SHARP_DECODE_CONTRACT;
  input: {
    byteLength: number;
    sha256: string;
  };
}

export interface Decision16RenditionRecord {
  athleteName: string;
  attribution: {
    adapterLicense: null | {
      name: string;
      scope: string;
      token: string;
      url: string;
    };
    changeDisclosureVisible: boolean;
    copyrightNotice: string;
    creditedName: string;
    fixedSourceUrl: string;
    license: {
      bucket: string;
      name: string;
      token: string;
      url: string;
      version: string;
    };
    suppliedCopyrightNoticeVisible: boolean;
    suppliedTitleVisible: boolean;
    termsLinkVisible: boolean;
    upstreamAlterationDisclosureVisible: boolean;
    workTitle: string;
  };
  caseIds: string[];
  currentCoverStatus: "current";
  localRendition: {
    changeDisclosure: string;
    derivedFrom: {
      relationship: "exact-source-bytes";
      sourcePath: string;
      sourceSha256: string;
    };
    repositoryFile: Decision16ImageFacts;
    transformation: {
      actor: string;
      aspectRatioPreserved: boolean;
      colorTreatment: string;
      createdAt: string;
      cropApplied: boolean;
      enlarged: boolean;
      fullFrame: boolean;
      jpegOptions: {
        chromaSubsampling: string;
        mozjpeg: boolean;
        progressive: boolean;
      };
      metadataTreatment: string;
      orientationTreatment: string;
      qualityCandidates: Decision16QualityCandidate[];
      qualityLadder: number[];
      resizeOptions: {
        fit: string;
        kernel: string;
        longestEdgePixels: number;
        withoutEnlargement: boolean;
      };
      selectedQuality: number;
      tool: { name: string; version: string };
    };
  };
  nonClearanceStatement: string;
  policyBinding: typeof DECISION_16_POLICY_BINDING;
  scopeId: string;
  sourceOriginal: typeof DECISION_16_SOURCE_ORIGINAL;
  sourceOriginalRetained: boolean;
}

export interface Decision16RenditionValidationInput {
  record: Decision16RenditionRecord;
  renditionDecodeFacts: Decision16ImageDecodeFacts | null;
  renditionBytes: Uint8Array;
  sourceDecodeFacts: Decision16ImageDecodeFacts | null;
  sourceBytes: Uint8Array;
}

export interface Decision16RenditionValidationResult {
  issues: ValidationIssue[];
  outcome: "eligible-governed-rendition" | "reject-rendition";
  reasons: string[];
}

const SHA256_RE = /^[a-f0-9]{64}$/u;

function contractIssue(
  code: string,
  path: string,
  message: string,
): ValidationIssue {
  return { code, message, path };
}

function exact(actual: unknown, expected: unknown): boolean {
  try {
    return canonicalJson(actual) === canonicalJson(expected);
  } catch {
    return false;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isDecision16ImageDecodeFacts(
  value: unknown,
): value is Decision16ImageDecodeFacts {
  if (!isObject(value) || !isObject(value.decoder) || !isObject(value.input)) {
    return false;
  }
  const decoded = value.decoded;
  return (
    isObject(decoded) &&
    typeof decoded.channels === "number" &&
    typeof decoded.height === "number" &&
    typeof decoded.pixelByteLength === "number" &&
    typeof decoded.pixelSha256 === "string" &&
    typeof decoded.width === "number" &&
    typeof value.input.byteLength === "number" &&
    typeof value.input.sha256 === "string"
  );
}

export function hasDecision16RenditionRecordShape(
  value: unknown,
): value is Decision16RenditionRecord {
  if (!isObject(value)) return false;
  const localRendition = value.localRendition;
  const sourceOriginal = value.sourceOriginal;
  const attribution = value.attribution;
  if (
    !isObject(localRendition) ||
    !isObject(sourceOriginal) ||
    !isObject(sourceOriginal.repositoryFile) ||
    !isObject(attribution)
  ) {
    return false;
  }
  const transformation = localRendition.transformation;
  return (
    isObject(localRendition.derivedFrom) &&
    isObject(localRendition.repositoryFile) &&
    isObject(transformation) &&
    isObject(transformation.jpegOptions) &&
    isObject(transformation.resizeOptions) &&
    isObject(transformation.tool) &&
    Array.isArray(transformation.qualityCandidates) &&
    transformation.qualityCandidates.every(isObject) &&
    Array.isArray(transformation.qualityLadder)
  );
}

function isCompleteJpeg(bytes: Uint8Array): boolean {
  return (
    bytes.byteLength >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[bytes.byteLength - 2] === 0xff &&
    bytes[bytes.byteLength - 1] === 0xd9
  );
}

function sha1Hex(bytes: Uint8Array): string {
  return createHash("sha1").update(bytes).digest("hex");
}

function validateDecodedImageFacts(
  facts: Decision16ImageDecodeFacts | null,
  bytes: Uint8Array,
  expected: { height: number; width: number },
  label: "rendition" | "source-original",
): ValidationIssue[] {
  const path = `${label}DecodeFacts`;
  if (
    !isDecision16ImageDecodeFacts(facts) ||
    !exact(facts.decoder, DECISION_16_SHARP_DECODE_CONTRACT) ||
    facts.input.byteLength !== bytes.byteLength ||
    facts.input.sha256 !== sha256Hex(bytes) ||
    !Number.isSafeInteger(facts.decoded.width) ||
    !Number.isSafeInteger(facts.decoded.height) ||
    facts.decoded.width !== expected.width ||
    facts.decoded.height !== expected.height ||
    facts.decoded.channels !== 3 ||
    facts.decoded.pixelByteLength !==
      expected.width * expected.height * facts.decoded.channels ||
    !SHA256_RE.test(facts.decoded.pixelSha256)
  ) {
    return [
      contractIssue(
        `decision16-${label}-decoded-image`,
        path,
        `${label} bytes must successfully complete the exact Sharp warning-strict raw-pixel decode bound to their SHA-256, byte length, dimensions, channels, and decoded-pixel digest`,
      ),
    ];
  }
  return [];
}

function validateSourceOriginal(
  record: Decision16RenditionRecord,
  sourceBytes: Uint8Array,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!exact(record.sourceOriginal, DECISION_16_SOURCE_ORIGINAL)) {
    issues.push(
      contractIssue(
        "decision16-source-original-facts",
        "sourceOriginal",
        "the immutable Commons/source-original fact set must remain exact and separate",
      ),
    );
  }
  if (
    sourceBytes.byteLength !==
      DECISION_16_SOURCE_ORIGINAL.repositoryFile.byteLength ||
    sha256Hex(sourceBytes) !==
      DECISION_16_SOURCE_ORIGINAL.repositoryFile.sha256 ||
    sha1Hex(sourceBytes) !== DECISION_16_SOURCE_ORIGINAL.upstream.mediaWikiSha1
  ) {
    issues.push(
      contractIssue(
        "decision16-source-original-bytes",
        "sourceBytes",
        "source bytes must match the exact Decision 15 SHA-256, MediaWiki SHA-1, and byte length",
      ),
    );
  }
  return issues;
}

function validateRenditionFacts(
  record: Decision16RenditionRecord,
  renditionBytes: Uint8Array,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const file = record.localRendition.repositoryFile;
  if (
    file.path !== DECISION_16_RENDITION_REQUIREMENTS.exactPath ||
    file.mimeType !== DECISION_16_RENDITION_REQUIREMENTS.exactMimeType ||
    file.width !== DECISION_16_RENDITION_REQUIREMENTS.exactWidth ||
    file.height !== DECISION_16_RENDITION_REQUIREMENTS.exactHeight ||
    Math.max(file.width, file.height) !==
      DECISION_16_RENDITION_REQUIREMENTS.exactLongestEdge ||
    !Number.isSafeInteger(file.byteLength) ||
    file.byteLength <= 0 ||
    file.byteLength > DECISION_16_RENDITION_REQUIREMENTS.maximumByteLength ||
    !SHA256_RE.test(file.sha256)
  ) {
    issues.push(
      contractIssue(
        "decision16-rendition-facts",
        "localRendition.repositoryFile",
        "the rendition requires its exact path, JPEG MIME, 2400×2080 dimensions, SHA-256, and at-most-5,000,000-byte length",
      ),
    );
  }
  if (
    renditionBytes.byteLength !== file.byteLength ||
    sha256Hex(renditionBytes) !== file.sha256 ||
    !isCompleteJpeg(renditionBytes)
  ) {
    issues.push(
      contractIssue(
        "decision16-rendition-bytes",
        "renditionBytes",
        "rendition bytes must match the recorded length and SHA-256 and have complete JPEG framing",
      ),
    );
  }
  const binding = record.localRendition.derivedFrom;
  if (
    binding.relationship !== "exact-source-bytes" ||
    binding.sourcePath !== DECISION_16_SOURCE_ORIGINAL.repositoryFile.path ||
    binding.sourceSha256 !==
      DECISION_16_SOURCE_ORIGINAL.repositoryFile.sha256 ||
    file.path === DECISION_16_SOURCE_ORIGINAL.repositoryFile.path ||
    record.sourceOriginal.repositoryFile.path ===
      DECISION_16_RENDITION_REQUIREMENTS.exactPath ||
    file.path === record.sourceOriginal.repositoryFile.path ||
    file.sha256 === record.sourceOriginal.repositoryFile.sha256
  ) {
    issues.push(
      contractIssue(
        "decision16-source-rendition-boundary",
        "localRendition.derivedFrom",
        "source and rendition facts must remain distinct while binding the exact source path and SHA-256",
      ),
    );
  }
  return issues;
}

function validateTransformation(
  record: Decision16RenditionRecord,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const transformation = record.localRendition.transformation;
  if (
    transformation.actor !== "decision-16-rendition-generator" ||
    transformation.createdAt !== DECISION_16_RENDITION_CREATED_AT ||
    !exact(transformation.tool, { name: "sharp", version: "0.35.3" }) ||
    !exact(transformation.resizeOptions, {
      fit: "inside",
      kernel: "lanczos3",
      longestEdgePixels: 2400,
      withoutEnlargement: true,
    }) ||
    !exact(transformation.jpegOptions, {
      chromaSubsampling: "4:4:4",
      mozjpeg: false,
      progressive: false,
    }) ||
    transformation.aspectRatioPreserved !== true ||
    transformation.cropApplied !== false ||
    transformation.enlarged !== false ||
    transformation.fullFrame !== true ||
    transformation.colorTreatment !== DECISION_16_RENDITION_COLOR_TREATMENT ||
    transformation.metadataTreatment !==
      DECISION_16_RENDITION_METADATA_TREATMENT ||
    transformation.orientationTreatment !==
      DECISION_16_RENDITION_ORIENTATION_TREATMENT
  ) {
    issues.push(
      contractIssue(
        "decision16-transformation",
        "localRendition.transformation",
        "the exact Sharp tool/options, full-frame geometry, actor/date, and color/orientation/metadata treatments are required",
      ),
    );
  }

  const candidates = transformation.qualityCandidates;
  const ladder = transformation.qualityLadder;
  const last = candidates.at(-1);
  const validCandidateSequence =
    exact(ladder, DECISION_16_QUALITY_LADDER) &&
    candidates.length > 0 &&
    candidates.length <= ladder.length &&
    candidates.every(
      (candidate, index) =>
        candidate.quality === ladder[index] &&
        Number.isSafeInteger(candidate.byteLength) &&
        candidate.byteLength > 0 &&
        SHA256_RE.test(candidate.sha256),
    );
  if (
    !validCandidateSequence ||
    last === undefined ||
    transformation.selectedQuality !== last.quality ||
    last.byteLength !== record.localRendition.repositoryFile.byteLength ||
    last.sha256 !== record.localRendition.repositoryFile.sha256 ||
    last.byteLength > DECISION_16_RENDITION_REQUIREMENTS.maximumByteLength ||
    candidates
      .slice(0, -1)
      .some(
        (candidate) =>
          candidate.byteLength <=
          DECISION_16_RENDITION_REQUIREMENTS.maximumByteLength,
      )
  ) {
    issues.push(
      contractIssue(
        "decision16-quality-selection",
        "localRendition.transformation.qualityCandidates",
        "quality candidates must be the exact ladder prefix ending at the highest-quality candidate at or below 5,000,000 bytes",
      ),
    );
  }
  return issues;
}

function validateAttribution(
  record: Decision16RenditionRecord,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (record.attribution.adapterLicense !== null) {
    issues.push(
      contractIssue(
        "decision16-adapter-license",
        "attribution.adapterLicense",
        "the CC BY 2.0 Trae Young work must not declare an Adapter's License",
      ),
    );
  }
  if (!exact(record.attribution, DECISION_16_ATTRIBUTION)) {
    issues.push(
      contractIssue(
        "decision16-attribution",
        "attribution",
        "exact CC BY 2.0, Erik Drost credit/title/copyright, fixed source, and visibility facts are required",
      ),
    );
  }
  if (
    record.localRendition.changeDisclosure !== DECISION_16_CHANGE_DISCLOSURE ||
    record.attribution.changeDisclosureVisible !== true
  ) {
    issues.push(
      contractIssue(
        "decision16-change-disclosure",
        "localRendition.changeDisclosure",
        "the exact downscale, no-crop, JPEG-re-encode change indication must be visible",
      ),
    );
  }
  return issues;
}

export function validateDecision16Rendition(
  input: Decision16RenditionValidationInput,
): Decision16RenditionValidationResult {
  const { record } = input;
  if (!hasDecision16RenditionRecordShape(record)) {
    const schemaIssue = contractIssue(
      "decision16-schema",
      "record",
      "Decision 16 requires a complete nested rendition record before validation",
    );
    return {
      issues: [schemaIssue],
      outcome: "reject-rendition",
      reasons: [schemaIssue.code],
    };
  }
  const issues: ValidationIssue[] = [];
  if (
    record.scopeId !== DECISION_16_SCOPE_ID ||
    record.athleteName !== "Trae Young" ||
    !exact(record.caseIds, ["CASE-NBAANKLE-2021-001"]) ||
    record.currentCoverStatus !== "current" ||
    record.sourceOriginalRetained !== true
  ) {
    issues.push(
      contractIssue(
        "decision16-scope",
        "record",
        "Decision 16 is limited to the retained-source Trae Young cover and its one governed case",
      ),
    );
  }
  if (!exact(record.policyBinding, DECISION_16_POLICY_BINDING)) {
    issues.push(
      contractIssue(
        "decision16-policy-binding",
        "policyBinding",
        "the exact immutable nba-v9 Markdown and JSON bytes are required",
      ),
    );
  }
  issues.push(
    ...validateSourceOriginal(record, input.sourceBytes),
    ...validateDecodedImageFacts(
      input.sourceDecodeFacts,
      input.sourceBytes,
      DECISION_16_SOURCE_ORIGINAL.repositoryFile,
      "source-original",
    ),
    ...validateRenditionFacts(record, input.renditionBytes),
    ...validateDecodedImageFacts(
      input.renditionDecodeFacts,
      input.renditionBytes,
      {
        height: DECISION_16_RENDITION_REQUIREMENTS.exactHeight,
        width: DECISION_16_RENDITION_REQUIREMENTS.exactWidth,
      },
      "rendition",
    ),
    ...validateTransformation(record),
    ...validateAttribution(record),
  );
  if (record.nonClearanceStatement !== DECISION_15_NON_CLEARANCE_STATEMENT) {
    issues.push(
      contractIssue(
        "decision16-non-clearance",
        "nonClearanceStatement",
        "copyright attribution does not create personality, legal-use, medical, or public-release clearance",
      ),
    );
  }
  return {
    issues,
    outcome:
      issues.length === 0 ? "eligible-governed-rendition" : "reject-rendition",
    reasons:
      issues.length === 0
        ? ["all-decision16-rendition-gates-pass"]
        : [...new Set(issues.map((entry) => entry.code))],
  };
}
