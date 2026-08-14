/** Generates the append-only Decision 16 player-photo registry successor. */

import { lstatSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import { DECISION_16_SCOPE_ID } from "../src/lib/contracts/decision-16-rendition-contract";
import {
  PLAYER_PHOTO_DECISION_16_SUPERSESSION,
  PLAYER_PHOTO_POLICY_V9_BINDING,
  PLAYER_PHOTO_REGISTRY_V8_PATH,
  PLAYER_PHOTO_REGISTRY_V8_PREDECESSOR,
  PLAYER_PHOTO_REGISTRY_V8_SHA256,
  validatePlayerPhotoRegistryV8,
  type PlayerPhotoDecision16CropValidationV8,
  type PlayerPhotoDecision16SelectionV8,
  type PlayerPhotoRegistryV8,
  type PlayerPhotoSelectionV8,
} from "../src/lib/contracts/player-photo-registry-v8";
import {
  PLAYER_PHOTO_REGISTRY_V7_OWNER_ACCEPTED_RESIDUAL_RISKS,
  PLAYER_PHOTO_REGISTRY_V7_PHASE_EVIDENCE,
  isDecision15PhotoSelectionV7,
  type PlayerPhotoRegistryV7,
} from "../src/lib/contracts/player-photo-registry-v7";
import { generateDecision16RenditionArtifact } from "./generate-decision-16-rendition";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const REQUIRED_NODE_VERSION = "v24.14.0";

function readRegularFile(path: string): Buffer {
  const absolutePath = resolve(ROOT, path);
  const status = lstatSync(absolutePath);
  if (!status.isFile() || status.isSymbolicLink()) {
    throw new Error(`${path} must be a regular non-symlink file`);
  }
  return readFileSync(absolutePath);
}

function expectedAthleteCases(): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const casesDirectory = resolve(ROOT, "src/content/cases");
  for (const filename of readdirSync(casesDirectory).sort()) {
    if (!filename.endsWith(".json")) continue;
    const record = JSON.parse(
      readFileSync(join(casesDirectory, filename), "utf8"),
    ) as { athlete: { name: string }; id: string };
    const ids = result.get(record.athlete.name) ?? [];
    ids.push(record.id);
    result.set(record.athlete.name, ids);
  }
  for (const ids of result.values()) ids.sort();
  return result;
}

async function generateRegistry(): Promise<string> {
  if (process.version !== REQUIRED_NODE_VERSION) {
    throw new Error(
      `Player-photo registry v8 generation requires Node ${REQUIRED_NODE_VERSION}; received ${process.version}`,
    );
  }
  const predecessorBytes = readRegularFile(
    PLAYER_PHOTO_REGISTRY_V8_PREDECESSOR.path,
  ).toString("utf8");
  if (
    sha256Hex(predecessorBytes) !== PLAYER_PHOTO_REGISTRY_V8_PREDECESSOR.sha256
  ) {
    throw new Error("Frozen player-photo registry v7 bytes changed");
  }
  const predecessor = parseStrictJson(
    predecessorBytes,
  ) as PlayerPhotoRegistryV7;
  const predecessorTrae = predecessor.selections.find(
    (selection) => selection.athleteName === "Trae Young",
  );
  if (
    predecessorTrae === undefined ||
    !isDecision15PhotoSelectionV7(predecessorTrae)
  ) {
    throw new Error("Registry v7 lacks the exact Decision 15 Trae selection");
  }

  const generated = await generateDecision16RenditionArtifact();
  const committedRendition = readRegularFile(
    generated.record.localRendition.repositoryFile.path,
  );
  if (!committedRendition.equals(generated.renditionBytes)) {
    throw new Error(
      "Committed Decision 16 rendition differs from exact regeneration",
    );
  }

  const cropValidation: PlayerPhotoDecision16CropValidationV8 = {
    adapterLicense: null,
    checkedAt: "2026-08-14",
    checkedBy: "decision-16-rendition-review",
    focalPosition: { xPercent: 50, yPercent: 35 },
    localFileIsGovernedRendition: true,
    localFileIsUnmodifiedOriginal: false,
    presentation: "css-object-fit-cover-crop",
    ratios: [
      { aspectRatio: "5:2", subjectSafe: true },
      { aspectRatio: "16:9", subjectSafe: true },
    ],
    sourceOriginalRetained: true,
  };
  const {
    cropValidation: _previousCropValidation,
    localFile: _previousLocalFile,
    supersession: _previousSupersession,
    ...stableTrae
  } = predecessorTrae;
  const traeSelection: PlayerPhotoDecision16SelectionV8 = {
    ...stableTrae,
    cropValidation,
    decision16Rendition: generated.record,
    localFile: generated.record.localRendition.repositoryFile,
    supersession: PLAYER_PHOTO_DECISION_16_SUPERSESSION,
  };

  const selections: PlayerPhotoSelectionV8[] = predecessor.selections.map(
    (selection) =>
      selection.athleteName === "Trae Young" ? traeSelection : selection,
  );
  const registry: PlayerPhotoRegistryV8 = {
    nonClearanceStatement: predecessor.nonClearanceStatement,
    ownerAcceptedResidualRisks: [
      ...PLAYER_PHOTO_REGISTRY_V7_OWNER_ACCEPTED_RESIDUAL_RISKS,
    ],
    phaseEvidenceBindings: PLAYER_PHOTO_REGISTRY_V7_PHASE_EVIDENCE,
    predecessorRegistryBinding: PLAYER_PHOTO_REGISTRY_V8_PREDECESSOR,
    schemaVersion: 8,
    scopeId: DECISION_16_SCOPE_ID,
    selections,
    sourcePolicyBinding: PLAYER_PHOTO_POLICY_V9_BINDING,
  };
  const outputBytes = canonicalJson(registry);
  const localAssetBytesByPath = new Map(
    selections.map((selection) => [
      selection.localFile.path,
      readRegularFile(selection.localFile.path),
    ]),
  );
  const result = validatePlayerPhotoRegistryV8({
    expectedAthleteCases: expectedAthleteCases(),
    expectedRegistrySha256: sha256Hex(outputBytes),
    localAssetBytesByPath,
    phase1EvidenceBytes: readRegularFile(
      PLAYER_PHOTO_REGISTRY_V7_PHASE_EVIDENCE.phase1.path,
    ).toString("utf8"),
    phase2EvidenceBytes: readRegularFile(
      PLAYER_PHOTO_REGISTRY_V7_PHASE_EVIDENCE.phase2.path,
    ).toString("utf8"),
    policyJsonBytes: readRegularFile(
      PLAYER_PHOTO_POLICY_V9_BINDING.jsonPath,
    ).toString("utf8"),
    policyMarkdownBytes: readRegularFile(
      PLAYER_PHOTO_POLICY_V9_BINDING.markdownPath,
    ).toString("utf8"),
    predecessorRegistryBytes: predecessorBytes,
    renditionDecodeFacts: generated.renditionDecodeFacts,
    registryBytes: outputBytes,
    sourceDecodeFacts: generated.sourceDecodeFacts,
    sourceOriginalBytes: readRegularFile(
      generated.record.sourceOriginal.repositoryFile.path,
    ),
  });
  if (result.issues.length > 0) {
    throw new Error(
      `Generated player-photo registry v8 failed its contract: ${result.issues
        .map((entry) => entry.code)
        .join(", ")}`,
    );
  }
  return outputBytes;
}

const outputBytes = await generateRegistry();
const outputPath = resolve(ROOT, PLAYER_PHOTO_REGISTRY_V8_PATH);
const outputSha256 = sha256Hex(outputBytes);
if (process.argv.includes("--check")) {
  const committed = readRegularFile(PLAYER_PHOTO_REGISTRY_V8_PATH).toString(
    "utf8",
  );
  if (committed !== outputBytes) {
    throw new Error("Generated player-photo registry v8 bytes are stale");
  }
  if (outputSha256 !== PLAYER_PHOTO_REGISTRY_V8_SHA256) {
    throw new Error(
      `Player-photo registry v8 digest constant is stale: ${outputSha256}`,
    );
  }
  console.log(`player-photo registry v8 OK — ${outputSha256}`);
} else {
  try {
    const status = lstatSync(outputPath);
    if (!status.isFile() || status.isSymbolicLink()) {
      throw new Error("Registry v8 output must be a regular non-symlink file");
    }
    if (readFileSync(outputPath, "utf8") !== outputBytes) {
      throw new Error(
        "Existing registry v8 differs from exact generation and will not be overwritten",
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    writeFileSync(outputPath, outputBytes, { flag: "wx" });
  }
  console.log(`player-photo registry v8 generated — ${outputSha256}`);
}
