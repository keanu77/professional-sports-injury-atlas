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
  DECISION_15_PROTECTED_ATHLETES,
  DECISION_15_TARGET_ATHLETES,
} from "../../src/lib/contracts/decision-15-photo-contract";
import {
  PLAYER_PHOTO_POLICY_V8_BINDING,
  PLAYER_PHOTO_REGISTRY_V7_OWNER_ACCEPTED_RESIDUAL_RISKS,
  PLAYER_PHOTO_REGISTRY_V7_PATH,
  PLAYER_PHOTO_REGISTRY_V7_PHASE_EVIDENCE,
  PLAYER_PHOTO_REGISTRY_V7_PREDECESSOR,
  PLAYER_PHOTO_REGISTRY_V7_SHA256,
  isDecision15PhotoSelectionV7,
  validatePlayerPhotoRegistryV7,
  type PlayerPhotoRegistryV7,
  type PlayerPhotoRegistryV7ValidationInput,
} from "../../src/lib/contracts/player-photo-registry-v7";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function validationInput(): PlayerPhotoRegistryV7ValidationInput {
  const expectedAthleteCases = new Map<string, string[]>();
  for (const filename of readdirSync(join(ROOT, "src/content/cases")).sort()) {
    if (!filename.endsWith(".json")) continue;
    const record = JSON.parse(
      readFileSync(join(ROOT, "src/content/cases", filename), "utf8"),
    ) as { athlete: { name: string }; id: string };
    const ids = expectedAthleteCases.get(record.athlete.name) ?? [];
    ids.push(record.id);
    expectedAthleteCases.set(record.athlete.name, ids);
  }
  for (const ids of expectedAthleteCases.values()) ids.sort();

  const registry = parseStrictJson(
    read(PLAYER_PHOTO_REGISTRY_V7_PATH),
  ) as PlayerPhotoRegistryV7;
  return {
    expectedAthleteCases,
    expectedRegistrySha256: PLAYER_PHOTO_REGISTRY_V7_SHA256,
    localAssetBytesByPath: new Map(
      registry.selections.map((selection) => [
        selection.localFile.path,
        readFileSync(join(ROOT, selection.localFile.path)),
      ]),
    ),
    phase1EvidenceBytes: read(
      PLAYER_PHOTO_REGISTRY_V7_PHASE_EVIDENCE.phase1.path,
    ),
    phase2EvidenceBytes: read(
      PLAYER_PHOTO_REGISTRY_V7_PHASE_EVIDENCE.phase2.path,
    ),
    policyJsonBytes: read(PLAYER_PHOTO_POLICY_V8_BINDING.jsonPath),
    policyMarkdownBytes: read(PLAYER_PHOTO_POLICY_V8_BINDING.markdownPath),
    predecessorRegistryBytes: read(PLAYER_PHOTO_REGISTRY_V7_PREDECESSOR.path),
    registryBytes: read(PLAYER_PHOTO_REGISTRY_V7_PATH),
  };
}

function mutate(
  input: PlayerPhotoRegistryV7ValidationInput,
  callback: (registry: PlayerPhotoRegistryV7) => void,
): void {
  const registry = parseStrictJson(
    input.registryBytes,
  ) as PlayerPhotoRegistryV7;
  callback(registry);
  input.registryBytes = canonicalJson(registry);
  input.expectedRegistrySha256 = sha256Hex(input.registryBytes);
}

function codes(input: PlayerPhotoRegistryV7ValidationInput): string[] {
  return validatePlayerPhotoRegistryV7(input).issues.map((entry) => entry.code);
}

describe("Decision 15 player-photo registry v7 contract", () => {
  it("accepts the exact 21-photo successor and final rights partition", () => {
    const result = validatePlayerPhotoRegistryV7(validationInput());
    expect(result.issues).toEqual([]);
    expect(result.registry?.schemaVersion).toBe(7);
    expect(result.registry?.selections).toHaveLength(21);
    expect(
      result.registry?.selections.flatMap((selection) => selection.caseIds),
    ).toHaveLength(26);
    expect(
      result.registry?.selections.filter(isDecision15PhotoSelectionV7),
    ).toHaveLength(14);
    expect(
      result.registry?.selections.filter((selection) =>
        (DECISION_15_PROTECTED_ATHLETES as readonly string[]).includes(
          selection.athleteName,
        ),
      ),
    ).toHaveLength(7);
    expect(
      result.registry?.selections.filter(
        (selection) => selection.rightsAttribution.licenseBucket === "cc-by",
      ),
    ).toHaveLength(8);
    expect(
      result.registry?.selections.filter(
        (selection) => selection.rightsAttribution.licenseBucket === "cc-by-sa",
      ),
    ).toHaveLength(12);
    expect(
      result.registry?.selections.filter(
        (selection) =>
          isDecision15PhotoSelectionV7(selection) &&
          selection.rightsAttribution.licenseBucket === "public-domain",
      ),
    ).toHaveLength(1);
  });

  it("binds exact v6, nba-v8, and both frozen phase evidence byte sets", () => {
    const sameVersion = validationInput();
    sameVersion.expectedRegistrySha256 = "0".repeat(64);
    expect(codes(sameVersion)).toContain("player-photo-v7-same-version-drift");

    const predecessor = validationInput();
    predecessor.predecessorRegistryBytes += "\n";
    expect(codes(predecessor)).toContain("player-photo-v7-predecessor-drift");

    const policy = validationInput();
    policy.policyMarkdownBytes += "\n";
    expect(codes(policy)).toContain("player-photo-v7-policy-binding");

    const evidence = validationInput();
    evidence.phase1EvidenceBytes += "\n";
    expect(codes(evidence)).toContain("player-photo-v7-phase-evidence-binding");
  });

  it("preserves all seven v6 selection subtrees and their local bytes", () => {
    const input = validationInput();
    mutate(input, (registry) => {
      registry.selections.find(
        ({ athleteName }) => athleteName === "CJ McCollum",
      )!.focalPosition.yPercent = 36;
    });
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        "player-photo-v7-decision15-protected-cover-drift",
        "player-photo-v7-protected-selection-drift",
      ]),
    );

    const bytes = validationInput();
    const path = "src/assets/players/decision-13/lebron-james.jpg";
    const changed = Buffer.from(bytes.localAssetBytesByPath.get(path)!);
    changed[0]! ^= 1;
    bytes.localAssetBytesByPath = new Map(bytes.localAssetBytesByPath).set(
      path,
      changed,
    );
    expect(codes(bytes)).toContain("player-photo-v7-local-byte-drift");
  });

  it("rejects ARR, missing markers, wrong events, and incomplete target mapping", () => {
    const input = validationInput();
    mutate(input, (registry) => {
      const selection = registry.selections.find(
        ({ athleteName }) => athleteName === "Trae Young",
      )!;
      if (!isDecision15PhotoSelectionV7(selection)) throw new Error("fixture");
      selection.decision15Evidence.rightsMarker.markerStatus =
        "all-rights-reserved";
      selection.decision15Evidence.injuryEventRelationships[0]!.status =
        "same-governed-injury-event";
      selection.caseIds = [];
      selection.decision15Evidence.caseIds = [];
    });
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        "player-photo-v7-decision15-athlete-case-mapping",
        "player-photo-v7-decision15-different-injury-event",
        "player-photo-v7-decision15-explicit-rights-marker",
        "player-photo-v7-case-mapping",
      ]),
    );
  });

  it("keeps seven BY-SA targets placement-only with same-version crop licenses", () => {
    const registry = parseStrictJson(
      validationInput().registryBytes,
    ) as PlayerPhotoRegistryV7;
    const bySaTargets = registry.selections.filter(
      (selection) =>
        isDecision15PhotoSelectionV7(selection) &&
        selection.rightsAttribution.licenseBucket === "cc-by-sa",
    );
    expect(
      bySaTargets.map((selection) => selection.athleteName).sort(),
    ).toEqual(
      [
        "Anfernee Simons",
        "Anthony Edwards",
        "Joe Ingles",
        "Markelle Fultz",
        "Moritz Wagner",
        "Thomas Bryant",
        "Tyrese Haliburton",
      ].sort(),
    );
    expect(
      bySaTargets.every(
        (selection) =>
          isDecision15PhotoSelectionV7(selection) &&
          selection.usePolicy.mode === "placement-rendition-only" &&
          selection.cropValidation.adapterLicense?.token ===
            selection.license?.token,
      ),
    ).toBe(true);

    const input = validationInput();
    mutate(input, (changed) => {
      const selection = changed.selections.find(
        ({ athleteName }) => athleteName === "Thomas Bryant",
      )!;
      if (!isDecision15PhotoSelectionV7(selection)) throw new Error("fixture");
      selection.usePolicy = { mode: "ordinary-attributed-placement" };
      selection.cropValidation.adapterLicense = null;
      selection.decision15Evidence.crop.adapterLicense = null;
    });
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        "player-photo-v7-decision15-adapter-license",
        "player-photo-v7-by-sa-firewall",
      ]),
    );
  });

  it("binds every rendered attribution field to the frozen Decision 15 evidence", () => {
    const input = validationInput();
    mutate(input, (registry) => {
      const selection = registry.selections.find(
        ({ athleteName }) => athleteName === "Ja Morant",
      )!;
      if (!isDecision15PhotoSelectionV7(selection)) throw new Error("fixture");
      selection.photographerIdentity.name = "Unfrozen credit";
      selection.rightsAttribution.workTitle.text = "Unfrozen title";
      selection.rightsAttribution.alterationState.disclosure =
        "Unfrozen alteration";
    });
    expect(codes(input)).toContain("player-photo-v7-projection");
  });

  it("preserves the Navy public-domain marker without CC0 or a license version", () => {
    const registry = parseStrictJson(
      validationInput().registryBytes,
    ) as PlayerPhotoRegistryV7;
    const murray = registry.selections.find(
      ({ athleteName }) => athleteName === "Dejounte Murray",
    )!;
    if (!isDecision15PhotoSelectionV7(murray)) throw new Error("fixture");
    expect(murray.license).toBeNull();
    expect(murray.decision15Evidence.rightsMarker).toMatchObject({
      licenseName: null,
      licenseVersion: null,
      rightsBucket: "public-domain",
      token: "PD-USGov-Military-Navy",
    });
    expect(murray.photographerIdentity.name).toBe(
      "U.S. Navy photo by Mass Communication Specialist 2nd Class Shayla D. Hamilton/Released",
    );

    const input = validationInput();
    mutate(input, (changed) => {
      const selection = changed.selections.find(
        ({ athleteName }) => athleteName === "Dejounte Murray",
      )!;
      if (!isDecision15PhotoSelectionV7(selection)) throw new Error("fixture");
      selection.decision15Evidence.rightsMarker.licenseName = "CC0 1.0";
      selection.decision15Evidence.rightsMarker.licenseVersion = "1.0";
    });
    expect(codes(input)).toContain(
      "player-photo-v7-decision15-public-domain-marker",
    );
  });

  it("retains the exact owner risk acceptance and all 14 target names", () => {
    const registry = parseStrictJson(
      validationInput().registryBytes,
    ) as PlayerPhotoRegistryV7;
    expect(registry.ownerAcceptedResidualRisks).toEqual(
      PLAYER_PHOTO_REGISTRY_V7_OWNER_ACCEPTED_RESIDUAL_RISKS,
    );
    expect(
      registry.selections
        .filter(isDecision15PhotoSelectionV7)
        .map((selection) => selection.athleteName),
    ).toEqual(expect.arrayContaining([...DECISION_15_TARGET_ATHLETES]));
  });
});
