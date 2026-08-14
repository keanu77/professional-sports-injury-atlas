import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { sha256Hex } from "../../src/lib/contracts/canonical";
import { DECISION_15_NON_CLEARANCE_STATEMENT } from "../../src/lib/contracts/decision-15-photo-contract";
import {
  DECISION_16_ATTRIBUTION,
  DECISION_16_CHANGE_DISCLOSURE,
  DECISION_16_POLICY_BINDING,
  DECISION_16_QUALITY_LADDER,
  DECISION_16_RENDITION_COLOR_TREATMENT,
  DECISION_16_RENDITION_CREATED_AT,
  DECISION_16_RENDITION_METADATA_TREATMENT,
  DECISION_16_RENDITION_ORIENTATION_TREATMENT,
  DECISION_16_SCOPE_ID,
  DECISION_16_SOURCE_ORIGINAL,
  validateDecision16Rendition,
  type Decision16ImageDecodeFacts,
  type Decision16RenditionRecord,
} from "../../src/lib/contracts/decision-16-rendition-contract";
import { decodeDecision16ImageWithSharp } from "../../scripts/generate-decision-16-rendition";

const SOURCE_BYTES = readFileSync(
  new URL(
    "../../src/assets/players/decision-15/trae-young.jpg",
    import.meta.url,
  ),
);
const RENDITION_BYTES = readFileSync(
  new URL(
    "../../src/assets/players/decision-16/trae-young.jpg",
    import.meta.url,
  ),
);
const SOURCE_DECODE_FACTS = await decodeDecision16ImageWithSharp(SOURCE_BYTES);
const RENDITION_DECODE_FACTS =
  await decodeDecision16ImageWithSharp(RENDITION_BYTES);

function validRecord(): Decision16RenditionRecord {
  const renditionSha256 = sha256Hex(RENDITION_BYTES);
  return {
    athleteName: "Trae Young",
    attribution: structuredClone(DECISION_16_ATTRIBUTION),
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
        byteLength: RENDITION_BYTES.byteLength,
        height: 2080,
        mimeType: "image/jpeg",
        path: "src/assets/players/decision-16/trae-young.jpg",
        sha256: renditionSha256,
        width: 2400,
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
        qualityCandidates: [
          {
            byteLength: RENDITION_BYTES.byteLength,
            quality: 95,
            sha256: renditionSha256,
          },
        ],
        qualityLadder: [...DECISION_16_QUALITY_LADDER],
        resizeOptions: {
          fit: "inside",
          kernel: "lanczos3",
          longestEdgePixels: 2400,
          withoutEnlargement: true,
        },
        selectedQuality: 95,
        tool: { name: "sharp", version: "0.35.3" },
      },
    },
    nonClearanceStatement: DECISION_15_NON_CLEARANCE_STATEMENT,
    policyBinding: structuredClone(DECISION_16_POLICY_BINDING),
    scopeId: DECISION_16_SCOPE_ID,
    sourceOriginal: structuredClone(DECISION_16_SOURCE_ORIGINAL),
    sourceOriginalRetained: true,
  };
}

function validate(
  record = validRecord(),
  renditionBytes = RENDITION_BYTES,
  renditionDecodeFacts: Decision16ImageDecodeFacts | null = RENDITION_DECODE_FACTS,
) {
  return validateDecision16Rendition({
    record,
    renditionDecodeFacts,
    renditionBytes,
    sourceDecodeFacts: SOURCE_DECODE_FACTS,
    sourceBytes: SOURCE_BYTES,
  });
}

function codes(record: Decision16RenditionRecord): string[] {
  return validate(record).issues.map((entry) => entry.code);
}

describe("Decision 16 Trae Young governed rendition", () => {
  it("accepts exact separated source and local-rendition facts", () => {
    expect(validate()).toEqual({
      issues: [],
      outcome: "eligible-governed-rendition",
      reasons: ["all-decision16-rendition-gates-pass"],
    });
    expect(SOURCE_BYTES).toHaveLength(39_619_306);
    expect(sha256Hex(SOURCE_BYTES)).toBe(
      "b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0",
    );
  });

  it("rejects source/rendition field swapping", () => {
    const record = validRecord();
    const source = record.sourceOriginal.repositoryFile;
    (record.sourceOriginal as any).repositoryFile =
      record.localRendition.repositoryFile;
    record.localRendition.repositoryFile = source;
    expect(codes(record)).toEqual(
      expect.arrayContaining([
        "decision16-source-original-facts",
        "decision16-rendition-facts",
        "decision16-source-rendition-boundary",
      ]),
    );
  });

  it("rejects missing attribution and missing change disclosure", () => {
    const record = validRecord();
    record.attribution.creditedName = "";
    record.attribution.changeDisclosureVisible = false;
    record.localRendition.changeDisclosure = "";
    expect(codes(record)).toEqual(
      expect.arrayContaining([
        "decision16-attribution",
        "decision16-change-disclosure",
      ]),
    );
  });

  it("rejects wrong source or rendition hashes", () => {
    const source = validRecord();
    (source.sourceOriginal.repositoryFile as any).sha256 = "0".repeat(64);
    expect(codes(source)).toContain("decision16-source-original-facts");

    const rendition = validRecord();
    rendition.localRendition.repositoryFile.sha256 = "0".repeat(64);
    expect(codes(rendition)).toEqual(
      expect.arrayContaining([
        "decision16-rendition-bytes",
        "decision16-quality-selection",
      ]),
    );
  });

  it("rejects wrong source or rendition dimensions", () => {
    const source = validRecord();
    (source.sourceOriginal.repositoryFile as any).width = 2400;
    expect(codes(source)).toContain("decision16-source-original-facts");

    const rendition = validRecord();
    rendition.localRendition.repositoryFile.height = 2079;
    expect(codes(rendition)).toContain("decision16-rendition-facts");
  });

  it("rejects the wrong license bucket and an invented Adapter's License", () => {
    const wrongBucket = validRecord();
    wrongBucket.attribution.license.bucket = "cc-by-sa";
    expect(codes(wrongBucket)).toContain("decision16-attribution");

    const adapter = validRecord();
    adapter.attribution.adapterLicense = {
      name: "CC BY-SA 2.0",
      scope: "crop-contribution-only",
      token: "cc-by-sa-2.0",
      url: "https://creativecommons.org/licenses/by-sa/2.0",
    };
    expect(codes(adapter)).toEqual(
      expect.arrayContaining([
        "decision16-adapter-license",
        "decision16-attribution",
      ]),
    );
  });

  it("rejects altered tool/options, crop, and missing treatment facts", () => {
    const record = validRecord();
    record.localRendition.transformation.tool.version = "0.35.2";
    record.localRendition.transformation.cropApplied = true;
    record.localRendition.transformation.metadataTreatment = "";
    expect(codes(record)).toContain("decision16-transformation");
  });

  it("freezes exact color, metadata, orientation, and creation facts", () => {
    const record = validRecord();
    record.localRendition.transformation.colorTreatment =
      "ICC discarded; CMYK output.";
    record.localRendition.transformation.metadataTreatment =
      "Copyright, creator, and rights metadata removed.";
    record.localRendition.transformation.orientationTreatment =
      "Rotated 180 degrees.";
    record.localRendition.transformation.createdAt = "2026-08-13";
    expect(codes(record)).toContain("decision16-transformation");
  });

  it("rejects missing, malformed, or byte-unbound decoder facts", () => {
    expect(validate(validRecord(), RENDITION_BYTES, null).reasons).toContain(
      "decision16-rendition-decoded-image",
    );

    const malformed = structuredClone(RENDITION_DECODE_FACTS);
    malformed.input.sha256 = "0".repeat(64);
    expect(
      validate(validRecord(), RENDITION_BYTES, malformed).reasons,
    ).toContain("decision16-rendition-decoded-image");
  });

  it("requires the exact quality ladder and highest passing candidate", () => {
    const record = validRecord();
    const selected = record.localRendition.transformation.qualityCandidates[0]!;
    record.localRendition.transformation.qualityCandidates = [
      { byteLength: 4_000_000, quality: 95, sha256: "1".repeat(64) },
      { ...selected, quality: 92 },
    ];
    record.localRendition.transformation.selectedQuality = 92;
    expect(codes(record)).toContain("decision16-quality-selection");
  });

  it("rejects an over-limit declaration and incomplete JPEG framing", () => {
    const over = validRecord();
    over.localRendition.repositoryFile.byteLength = 5_000_001;
    expect(codes(over)).toContain("decision16-rendition-facts");

    const invalidBytes = Buffer.from([0xff, 0xd8, 0x00, 0x00]);
    const record = validRecord();
    record.localRendition.repositoryFile.byteLength = invalidBytes.byteLength;
    record.localRendition.repositoryFile.sha256 = sha256Hex(invalidBytes);
    record.localRendition.transformation.qualityCandidates[0] = {
      byteLength: invalidBytes.byteLength,
      quality: 95,
      sha256: sha256Hex(invalidBytes),
    };
    expect(validate(record, invalidBytes, null).reasons).toContain(
      "decision16-rendition-bytes",
    );
  });

  it("rejects scope, policy, source-retention, and non-clearance drift", () => {
    const record = validRecord();
    record.athleteName = "Different Athlete";
    record.sourceOriginalRetained = false;
    record.nonClearanceStatement = "rights-cleared";
    (record.policyBinding as any).sourcePolicyVersion = "nba-v8";
    expect(codes(record)).toEqual(
      expect.arrayContaining([
        "decision16-scope",
        "decision16-policy-binding",
        "decision16-non-clearance",
      ]),
    );
  });
});
