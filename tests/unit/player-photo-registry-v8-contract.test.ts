import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import {
  DECISION_16_CHANGE_DISCLOSURE,
  DECISION_16_RENDITION_REQUIREMENTS,
  DECISION_16_SOURCE_ORIGINAL,
  type Decision16ImageDecodeFacts,
} from "../../src/lib/contracts/decision-16-rendition-contract";
import { decodeDecision16ImageWithSharp } from "../../scripts/generate-decision-16-rendition";
import {
  PLAYER_PHOTO_DECISION_16_SUPERSESSION,
  PLAYER_PHOTO_POLICY_V9_BINDING,
  PLAYER_PHOTO_REGISTRY_V8_PATH,
  PLAYER_PHOTO_REGISTRY_V8_PREDECESSOR,
  PLAYER_PHOTO_REGISTRY_V8_SHA256,
  isDecision16RenditionSelectionV8,
  validatePlayerPhotoRegistryV8,
  type PlayerPhotoDecision16SelectionV8,
  type PlayerPhotoRegistryV8,
  type PlayerPhotoRegistryV8ValidationInput,
} from "../../src/lib/contracts/player-photo-registry-v8";
import {
  PLAYER_PHOTO_REGISTRY_V7_PHASE_EVIDENCE,
  type PlayerPhotoRegistryV7,
} from "../../src/lib/contracts/player-photo-registry-v7";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

const REGISTRY_BYTES = read(PLAYER_PHOTO_REGISTRY_V8_PATH);
const PREDECESSOR_BYTES = read(PLAYER_PHOTO_REGISTRY_V8_PREDECESSOR.path);
const SOURCE_BYTES = readFileSync(
  join(ROOT, DECISION_16_SOURCE_ORIGINAL.repositoryFile.path),
);
const RENDITION_BYTES = readFileSync(
  join(ROOT, DECISION_16_RENDITION_REQUIREMENTS.exactPath),
);
const SOURCE_DECODE_FACTS = await decodeDecision16ImageWithSharp(SOURCE_BYTES);
const RENDITION_DECODE_FACTS =
  await decodeDecision16ImageWithSharp(RENDITION_BYTES);
const REGISTRY = parseStrictJson(REGISTRY_BYTES) as PlayerPhotoRegistryV8;
const PREDECESSOR = parseStrictJson(PREDECESSOR_BYTES) as PlayerPhotoRegistryV7;

const EXPECTED_ATHLETE_CASES = new Map<string, string[]>();
for (const filename of readdirSync(join(ROOT, "src/content/cases")).sort()) {
  if (!filename.endsWith(".json")) continue;
  const record = JSON.parse(
    readFileSync(join(ROOT, "src/content/cases", filename), "utf8"),
  ) as { athlete: { name: string }; id: string };
  const ids = EXPECTED_ATHLETE_CASES.get(record.athlete.name) ?? [];
  ids.push(record.id);
  EXPECTED_ATHLETE_CASES.set(record.athlete.name, ids);
}
for (const ids of EXPECTED_ATHLETE_CASES.values()) ids.sort();

const LOCAL_ASSET_BYTES = new Map(
  REGISTRY.selections.map((selection) => [
    selection.localFile.path,
    readFileSync(join(ROOT, selection.localFile.path)),
  ]),
);

function validationInput(): PlayerPhotoRegistryV8ValidationInput {
  return {
    expectedAthleteCases: EXPECTED_ATHLETE_CASES,
    expectedRegistrySha256: PLAYER_PHOTO_REGISTRY_V8_SHA256,
    localAssetBytesByPath: new Map(LOCAL_ASSET_BYTES),
    phase1EvidenceBytes: read(
      PLAYER_PHOTO_REGISTRY_V7_PHASE_EVIDENCE.phase1.path,
    ),
    phase2EvidenceBytes: read(
      PLAYER_PHOTO_REGISTRY_V7_PHASE_EVIDENCE.phase2.path,
    ),
    policyJsonBytes: read(PLAYER_PHOTO_POLICY_V9_BINDING.jsonPath),
    policyMarkdownBytes: read(PLAYER_PHOTO_POLICY_V9_BINDING.markdownPath),
    predecessorRegistryBytes: PREDECESSOR_BYTES,
    renditionDecodeFacts: structuredClone(RENDITION_DECODE_FACTS),
    registryBytes: REGISTRY_BYTES,
    sourceDecodeFacts: structuredClone(SOURCE_DECODE_FACTS),
    sourceOriginalBytes: SOURCE_BYTES,
  };
}

function mutate(
  input: PlayerPhotoRegistryV8ValidationInput,
  callback: (registry: PlayerPhotoRegistryV8) => void,
): void {
  const registry = parseStrictJson(
    input.registryBytes,
  ) as PlayerPhotoRegistryV8;
  callback(registry);
  input.registryBytes = canonicalJson(registry);
  input.expectedRegistrySha256 = sha256Hex(input.registryBytes);
}

function mutableTrae(registry: PlayerPhotoRegistryV8): Record<string, any> {
  const selection = registry.selections.find(
    ({ athleteName }) => athleteName === "Trae Young",
  );
  if (selection === undefined || !isDecision16RenditionSelectionV8(selection)) {
    throw new Error("invalid Decision 16 fixture");
  }
  return selection as unknown as Record<string, any>;
}

function codes(input: PlayerPhotoRegistryV8ValidationInput): string[] {
  return validatePlayerPhotoRegistryV8(input).issues.map((entry) => entry.code);
}

function truncateBeforeStartOfScan(bytes: Buffer): Buffer {
  let offset = 2;
  while (offset + 3 < bytes.byteLength) {
    const markerStart = offset;
    if (bytes[offset] !== 0xff) {
      throw new Error("invalid JPEG marker sequence in test fixture");
    }
    while (offset < bytes.byteLength && bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xda) {
      return Buffer.concat([
        bytes.subarray(0, markerStart),
        Buffer.from([0xff, 0xd9]),
      ]);
    }
    if (
      marker === 0x01 ||
      (marker !== undefined && marker >= 0xd0 && marker <= 0xd8)
    ) {
      continue;
    }
    const length = (bytes[offset]! << 8) | bytes[offset + 1]!;
    if (length < 2 || offset + length > bytes.byteLength) {
      throw new Error("invalid JPEG segment in test fixture");
    }
    offset += length;
  }
  throw new Error("JPEG test fixture has no start-of-scan marker");
}

describe("Decision 16 player-photo registry v8 contract", () => {
  it("accepts the exact one-rendition successor and freezes its output facts", () => {
    const result = validatePlayerPhotoRegistryV8(validationInput());
    expect(result.issues).toEqual([]);
    expect(result.registry?.schemaVersion).toBe(8);
    expect(result.registry?.selections).toHaveLength(21);
    expect(
      result.registry?.selections.flatMap((selection) => selection.caseIds),
    ).toHaveLength(26);

    const renditions = result.registry?.selections.filter(
      isDecision16RenditionSelectionV8,
    );
    expect(renditions).toHaveLength(1);
    const trae = renditions?.[0] as PlayerPhotoDecision16SelectionV8;
    expect(trae.athleteName).toBe("Trae Young");
    expect(trae.localFile).toEqual({
      byteLength: 2_390_278,
      height: 2080,
      mimeType: "image/jpeg",
      path: DECISION_16_RENDITION_REQUIREMENTS.exactPath,
      sha256:
        "0c7a77e45d05648b8e52e6db692086e240e883639e8a8617f36d44f70061fcaf",
      width: 2400,
    });
    expect(
      trae.decision16Rendition.localRendition.transformation.selectedQuality,
    ).toBe(95);
    expect(
      trae.decision16Rendition.localRendition.transformation.qualityCandidates,
    ).toEqual([
      {
        byteLength: 2_390_278,
        quality: 95,
        sha256:
          "0c7a77e45d05648b8e52e6db692086e240e883639e8a8617f36d44f70061fcaf",
      },
    ]);
    expect(trae.decision16Rendition.sourceOriginal).toEqual(
      DECISION_16_SOURCE_ORIGINAL,
    );
    expect(trae.supersession).toEqual(PLAYER_PHOTO_DECISION_16_SUPERSESSION);
    expect(trae.cropValidation).toMatchObject({
      localFileIsGovernedRendition: true,
      localFileIsUnmodifiedOriginal: false,
      sourceOriginalRetained: true,
    });
  });

  it("preserves all other 20 v7 selection subtrees exactly", () => {
    const previousByAthlete = new Map(
      PREDECESSOR.selections.map((selection) => [
        selection.athleteName,
        selection,
      ]),
    );
    const unchanged = REGISTRY.selections.filter(
      ({ athleteName }) => athleteName !== "Trae Young",
    );
    expect(unchanged).toHaveLength(20);
    expect(
      unchanged.every(
        (selection) =>
          canonicalJson(selection) ===
          canonicalJson(previousByAthlete.get(selection.athleteName)),
      ),
    ).toBe(true);
    expect(
      unchanged.reduce(
        (total, selection) => total + selection.localFile.byteLength,
        0,
      ),
    ).toBe(59_392_940);

    const input = validationInput();
    mutate(input, (registry) => {
      registry.selections.find(
        ({ athleteName }) => athleteName === "LeBron James",
      )!.focalPosition.yPercent += 1;
    });
    expect(codes(input)).toContain("player-photo-v8-non-trae-selection-drift");
  });

  it("binds exact registry v7, nba-v9, phase evidence, and canonical v8 bytes", () => {
    const sameVersion = validationInput();
    sameVersion.expectedRegistrySha256 = "0".repeat(64);
    expect(codes(sameVersion)).toContain("player-photo-v8-same-version-drift");

    const canonical = validationInput();
    canonical.registryBytes += "\n";
    expect(codes(canonical)).toEqual(
      expect.arrayContaining([
        "player-photo-v8-canonical-json",
        "player-photo-v8-same-version-drift",
      ]),
    );

    const predecessor = validationInput();
    predecessor.predecessorRegistryBytes += "\n";
    expect(codes(predecessor)).toContain("player-photo-v8-predecessor-drift");

    const policy = validationInput();
    policy.policyMarkdownBytes += "\n";
    expect(codes(policy)).toContain("player-photo-v8-policy-binding");

    const evidence = validationInput();
    evidence.phase2EvidenceBytes += "\n";
    expect(codes(evidence)).toContain("player-photo-v8-phase-evidence-binding");
  });

  it("keeps upstream-original and local-rendition facts separate", () => {
    const sourceFacts = validationInput();
    mutate(sourceFacts, (registry) => {
      const trae = mutableTrae(registry);
      trae.decision16Rendition.sourceOriginal.repositoryFile.width = 2400;
      trae.decision16Rendition.sourceOriginal.repositoryFile.height = 2080;
      trae.decision16Rendition.sourceOriginal.repositoryFile.byteLength = 2_390_278;
    });
    expect(codes(sourceFacts)).toContain(
      "player-photo-v8-decision16-source-original-facts",
    );

    const sourceBinding = validationInput();
    mutate(sourceBinding, (registry) => {
      mutableTrae(
        registry,
      ).decision16Rendition.localRendition.derivedFrom.sourceSha256 =
        "0".repeat(64);
    });
    expect(codes(sourceBinding)).toContain(
      "player-photo-v8-decision16-source-rendition-boundary",
    );
  });

  it("freezes exact rendition treatment facts", () => {
    const input = validationInput();
    mutate(input, (registry) => {
      const transformation = mutableTrae(registry).decision16Rendition
        .localRendition.transformation as Record<string, unknown>;
      transformation.colorTreatment = "ICC discarded; CMYK output.";
      transformation.metadataTreatment =
        "Copyright, creator, and rights metadata removed.";
      transformation.orientationTreatment = "Rotated 180 degrees.";
      transformation.createdAt = "2026-08-13";
    });
    expect(codes(input)).toContain("player-photo-v8-decision16-transformation");
  });

  it("returns fail-closed schema issues for a malformed nested D16 record", () => {
    const input = validationInput();
    mutate(input, (registry) => {
      const selection = registry.selections.find(
        ({ athleteName }) => athleteName === "Trae Young",
      ) as unknown as Record<string, unknown>;
      selection.decision16Rendition = null;
    });
    expect(() => validatePlayerPhotoRegistryV8(input)).not.toThrow();
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        "player-photo-v8-schema",
        "player-photo-v8-decision16-scope",
      ]),
    );
  });

  it("rejects malformed or byte-unbound decoder facts", () => {
    const malformed = validationInput();
    malformed.renditionDecodeFacts = {
      decoded: null,
    } as unknown as Decision16ImageDecodeFacts;
    expect(codes(malformed)).toContain(
      "player-photo-v8-decision16-rendition-decoded-image",
    );

    const unbound = validationInput();
    unbound.renditionDecodeFacts!.input.sha256 = "0".repeat(64);
    expect(codes(unbound)).toContain(
      "player-photo-v8-decision16-rendition-decoded-image",
    );
  });

  it("rejects source or rendition byte drift and verifies decoded dimensions", () => {
    const source = validationInput();
    const changedSource = Buffer.from(source.sourceOriginalBytes);
    changedSource[Math.floor(changedSource.byteLength / 2)]! ^= 1;
    source.sourceOriginalBytes = changedSource;
    expect(codes(source)).toContain(
      "player-photo-v8-decision16-source-original-bytes",
    );

    const rendition = validationInput();
    const renditionPath = DECISION_16_RENDITION_REQUIREMENTS.exactPath;
    const changedRendition = Buffer.from(
      rendition.localAssetBytesByPath.get(renditionPath)!,
    );
    changedRendition[Math.floor(changedRendition.byteLength / 2)]! ^= 1;
    rendition.localAssetBytesByPath = new Map(
      rendition.localAssetBytesByPath,
    ).set(renditionPath, changedRendition);
    expect(codes(rendition)).toEqual(
      expect.arrayContaining([
        "player-photo-v8-decision16-rendition-bytes",
        "player-photo-v8-local-byte-drift",
      ]),
    );

    expect(createHash("sha1").update(SOURCE_BYTES).digest("hex")).toBe(
      DECISION_16_SOURCE_ORIGINAL.upstream.mediaWikiSha1,
    );
  });

  it("rejects a scan-less JPEG even when framing, facts, and hashes agree", async () => {
    const truncated = truncateBeforeStartOfScan(RENDITION_BYTES);
    await expect(decodeDecision16ImageWithSharp(truncated)).rejects.toThrow();

    const input = validationInput();
    mutate(input, (registry) => {
      const trae = mutableTrae(registry);
      const sha256 = sha256Hex(truncated);
      for (const facts of [
        trae.localFile,
        trae.decision16Rendition.localRendition.repositoryFile,
        trae.decision16Rendition.localRendition.transformation
          .qualityCandidates[0],
      ]) {
        facts.byteLength = truncated.byteLength;
        facts.sha256 = sha256;
      }
    });
    input.localAssetBytesByPath = new Map(input.localAssetBytesByPath).set(
      DECISION_16_RENDITION_REQUIREMENTS.exactPath,
      truncated,
    );
    input.renditionDecodeFacts = null;
    expect(codes(input)).toContain(
      "player-photo-v8-decision16-rendition-decoded-image",
    );
  });

  it("requires distinct visible upstream and local change disclosures", () => {
    const input = validationInput();
    mutate(input, (registry) => {
      mutableTrae(
        registry,
      ).decision16Rendition.localRendition.changeDisclosure = "";
    });
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        "player-photo-v8-trae-projection",
        "player-photo-v8-decision16-change-disclosure",
      ]),
    );

    const exact = REGISTRY.selections.find(isDecision16RenditionSelectionV8)!;
    expect(exact.rightsAttribution.alterationState.disclosure).toBe(
      DECISION_16_SOURCE_ORIGINAL.upstreamAlterationDisclosure,
    );
    expect(exact.decision16Rendition.localRendition.changeDisclosure).toBe(
      DECISION_16_CHANGE_DISCLOSURE,
    );
    expect(exact.rightsAttribution.alterationState.disclosure).not.toBe(
      exact.decision16Rendition.localRendition.changeDisclosure,
    );
  });

  it("keeps Trae CC BY 2.0 without an invented Adapter's License", () => {
    const input = validationInput();
    mutate(input, (registry) => {
      mutableTrae(registry).decision16Rendition.attribution.adapterLicense = {
        name: "CC BY-SA 4.0",
        scope: "invented",
        token: "cc-by-sa-4.0",
        url: "https://creativecommons.org/licenses/by-sa/4.0",
      };
    });
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        "player-photo-v8-decision16-adapter-license",
        "player-photo-v8-decision16-attribution",
      ]),
    );

    const exact = REGISTRY.selections.find(isDecision16RenditionSelectionV8)!;
    expect(exact.license).toEqual({
      name: "CC BY 2.0",
      token: "cc-by-2.0",
      url: "https://creativecommons.org/licenses/by/2.0",
    });
    expect(exact.rightsAttribution.adapterLicense).toBeNull();
    expect(exact.decision16Rendition.attribution.adapterLicense).toBeNull();
  });

  it("retains the exact 8/12/1 rights partition and all 26 case mappings", () => {
    const counts = new Map<string, number>();
    for (const selection of REGISTRY.selections) {
      const bucket = selection.rightsAttribution.licenseBucket;
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }
    expect(Object.fromEntries(counts)).toEqual({
      "cc-by": 8,
      "cc-by-sa": 12,
      "public-domain": 1,
    });

    const input = validationInput();
    mutate(input, (registry) => {
      mutableTrae(registry).caseIds = [];
    });
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        "player-photo-v8-trae-projection",
        "player-photo-v8-case-mapping",
      ]),
    );
  });
});
