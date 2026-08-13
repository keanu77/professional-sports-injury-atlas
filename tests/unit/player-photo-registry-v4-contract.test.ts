import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import {
  PLAYER_PHOTO_POLICY_V5_JSON_PATH,
  PLAYER_PHOTO_POLICY_V5_JSON_SHA256,
  PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH,
  PLAYER_PHOTO_POLICY_V5_MARKDOWN_SHA256,
  PLAYER_PHOTO_REGISTRY_PREDECESSORS,
  PLAYER_PHOTO_REGISTRY_V4_SCOPE_ID,
  validatePlayerPhotoRegistryV4,
  type PlayerPhotoCommonsSelectionV4,
  type PlayerPhotoRegistryV4,
  type PlayerPhotoRegistryV4ValidationInput,
  type PlayerPhotoSvgFallbackSelectionV4,
} from "../../src/lib/contracts/player-photo-registry-v4";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const PHOTO_PATH =
  "src/assets/players/decision-13/anfernee-simons.png" as const;
const SVG_PATH = "src/assets/players/decision-13/dwight-powell.svg" as const;
const PHOTO_BYTES = Buffer.from(
  "89504e470d0a1a0a0000000d494844520000000100000001",
  "hex",
);
const SVG_BYTES = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480" viewBox="0 0 1200 480"><rect width="1200" height="480" fill="#10232f"/></svg>',
);

function evidence(url: string) {
  return {
    basis: "Original pages and fixed metadata agree on this fact.",
    checkedAt: "2026-08-13",
    checkedBy: "decision-13-photo-review",
    urls: [url],
  };
}

function emptyNotice() {
  return { status: "not-supplied" as const, text: null, url: null };
}

function photoSelection(): PlayerPhotoCommonsSelectionV4 {
  const descriptionUrl =
    "https://commons.wikimedia.org/wiki/File:Anfernee_Simons_portrait.png";
  const revisionPermalink =
    "https://commons.wikimedia.org/w/index.php?title=File%3AAnfernee_Simons_portrait.png&oldid=123";
  return {
    athleteName: "Anfernee Simons",
    caseIds: ["CASE-NBAANKLE-2023-004"],
    commonsDescriptionUrl: descriptionUrl,
    commonsDownloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/a/ab/Anfernee_Simons_portrait.png",
    coverKind: "commons-photo",
    cropValidation: {
      checkedAt: "2026-08-13",
      checkedBy: "decision-13-photo-review",
      ratios: [
        { aspectRatio: "5:2", subjectSafe: true },
        { aspectRatio: "16:9", subjectSafe: true },
      ],
    },
    currentCoverStatus: "current",
    identityEvidence: {
      ...evidence(revisionPermalink),
      status: "verified",
    },
    license: {
      name: "CC BY-SA 4.0",
      token: "cc-by-sa-4.0",
      url: "https://creativecommons.org/licenses/by-sa/4.0",
    },
    localFile: {
      byteLength: PHOTO_BYTES.byteLength,
      height: 1,
      mimeType: "image/png",
      path: PHOTO_PATH,
      sha256: sha256Hex(PHOTO_BYTES),
      width: 1,
    },
    occasionEvidence: {
      ...evidence(revisionPermalink),
      category: "public-event-or-fan-interaction",
    },
    photographerIdentity: {
      evidence: evidence(revisionPermalink),
      name: "Example Photographer",
    },
    photographerRiskEvidence: {
      ...evidence(revisionPermalink),
      category: "independent-public-event-low-risk",
      residualRisk:
        "Personality and public-release review remain outside this classification.",
    },
    rightsAttribution: {
      adapterLicense: {
        name: "CC BY-SA 4.0",
        token: "cc-by-sa-4.0",
        url: "https://creativecommons.org/licenses/by-sa/4.0",
      },
      alterationState: {
        disclosure: "Presentation crop from the verified original.",
        presentation: "css-object-fit-cover-crop",
      },
      copyrightNotice: emptyNotice(),
      disclaimerNotice: emptyNotice(),
      licenseBucket: "cc-by-sa",
      otherPerFileNotice: emptyNotice(),
      workTitle: {
        evidence: "No distinct title is supplied on the fixed revision.",
        evidenceUrl: revisionPermalink,
        status: "not-supplied",
        text: null,
      },
    },
    sourceRevision: {
      checkedAt: "2026-08-13",
      id: 123,
      permalink: revisionPermalink,
      timestamp: "2026-08-13T01:02:03Z",
      title: "File:Anfernee Simons portrait.png",
    },
    sourceRiskClassification: {
      category: "non-event-low-risk",
      nonClearanceStatement:
        "Low risk is not rights clearance or public-release approval.",
    },
    supersession: {
      previousLocalFilePath: "src/assets/players/anfernee-simons.jpg",
      previousLocalFileSha256:
        "2c651d636a979b4e838c28817e56ce56917d7b216fc6e59603075654a067fd7e",
      reason: "replaces-game-action-high-risk",
    },
    uploaderIdentity: {
      evidence: evidence(revisionPermalink),
      name: "Example Photographer",
      relationshipToPhotographer: "same-person-evidenced",
    },
    upstreamOriginal: {
      evidence: "The fixed Commons revision identifies no earlier source.",
      status: "not-supplied",
      url: null,
    },
  };
}

function fallbackSelection(): PlayerPhotoSvgFallbackSelectionV4 {
  return {
    athleteName: "Dwight Powell",
    caseIds: ["CASE-NBAACHILLES-2020-008"],
    coverKind: "original-svg-fallback",
    currentCoverStatus: "current",
    fallbackProvenance: {
      athleteLikeness: "none",
      copiedTeamOrLeagueMarks: "none",
      createdAt: "2026-08-13",
      createdBy: "professional-sports-injury-atlas",
      embeddedOrLinkedRaster: "none",
      externalFetches: "none",
      originalityBasis: "Original abstract geometric basketball-court artwork.",
      thirdPartyArtworkOrFonts: "none",
    },
    localFile: {
      byteLength: SVG_BYTES.byteLength,
      height: 480,
      mimeType: "image/svg+xml",
      path: SVG_PATH,
      sha256: sha256Hex(SVG_BYTES),
      width: 1200,
    },
    supersession: {
      previousLocalFilePath: "src/assets/players/dwight-powell.jpg",
      previousLocalFileSha256:
        "d1cab51c99f25b380d05d14bd5fe4f826b51042d4c007a7d105a7240265cd211",
      reason: "replaces-existing-non-event-after-revalidation",
    },
  };
}

function fixture() {
  const registry: PlayerPhotoRegistryV4 = {
    predecessorRegistryBindings: PLAYER_PHOTO_REGISTRY_PREDECESSORS.map(
      (binding) => ({ ...binding }),
    ),
    schemaVersion: 4,
    scopeId: PLAYER_PHOTO_REGISTRY_V4_SCOPE_ID,
    selections: [photoSelection(), fallbackSelection()],
    sourcePolicyBinding: {
      jsonPath: PLAYER_PHOTO_POLICY_V5_JSON_PATH,
      jsonSha256: PLAYER_PHOTO_POLICY_V5_JSON_SHA256,
      markdownPath: PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH,
      markdownSha256: PLAYER_PHOTO_POLICY_V5_MARKDOWN_SHA256,
      sourcePolicyVersion: "nba-v5",
    },
  };
  const localAssetBytesByPath = new Map<string, Uint8Array>([
    [PHOTO_PATH, PHOTO_BYTES],
    [SVG_PATH, SVG_BYTES],
  ]);
  return { localAssetBytesByPath, registry };
}

function validationInput(
  registry: PlayerPhotoRegistryV4,
  localAssetBytesByPath: ReadonlyMap<string, Uint8Array>,
  expectedRegistryBytes = canonicalJson(registry),
): PlayerPhotoRegistryV4ValidationInput {
  return {
    expectedAthleteCases: new Map([
      ["Anfernee Simons", ["CASE-NBAANKLE-2023-004"]],
      ["Dwight Powell", ["CASE-NBAACHILLES-2020-008"]],
    ]),
    expectedRegistrySha256: sha256Hex(expectedRegistryBytes),
    localAssetBytesByPath,
    policyJsonBytes: readFileSync(
      join(REPO_ROOT, PLAYER_PHOTO_POLICY_V5_JSON_PATH),
      "utf8",
    ),
    policyMarkdownBytes: readFileSync(
      join(REPO_ROOT, PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH),
      "utf8",
    ),
    predecessorRegistryBytesByPath: new Map(
      PLAYER_PHOTO_REGISTRY_PREDECESSORS.map((binding) => [
        binding.path,
        readFileSync(join(REPO_ROOT, binding.path), "utf8"),
      ]),
    ),
    registryBytes: canonicalJson(registry),
  };
}

function issueCodes(
  mutate?: (registry: PlayerPhotoRegistryV4) => void,
  mutateBytes?: (bytes: Map<string, Uint8Array>) => void,
): string[] {
  const { localAssetBytesByPath, registry } = fixture();
  const frozenBytes = canonicalJson(registry);
  mutate?.(registry);
  mutateBytes?.(localAssetBytesByPath);
  return validatePlayerPhotoRegistryV4(
    validationInput(registry, localAssetBytesByPath, frozenBytes),
  ).issues.map((entry) => entry.code);
}

describe("Decision 13 player-photo registry v4 contract", () => {
  it("accepts a mixed qualifying Commons-photo and original-SVG registry", () => {
    const { localAssetBytesByPath, registry } = fixture();
    const result = validatePlayerPhotoRegistryV4(
      validationInput(registry, localAssetBytesByPath),
    );

    expect(result.issues).toEqual([]);
    expect(
      result.registry?.selections.map((selection) => selection.coverKind),
    ).toEqual(["commons-photo", "original-svg-fallback"]);
    expect(result.registry?.selections[1]).not.toHaveProperty("license");
  });

  it("rejects predecessor drift and same-version registry drift", () => {
    const { localAssetBytesByPath, registry } = fixture();
    const input = validationInput(registry, localAssetBytesByPath);
    const v3Path = PLAYER_PHOTO_REGISTRY_PREDECESSORS[2].path;
    const drifted = new Map(input.predecessorRegistryBytesByPath);
    drifted.set(v3Path, `${drifted.get(v3Path)} `);
    expect(
      validatePlayerPhotoRegistryV4({
        ...input,
        predecessorRegistryBytesByPath: drifted,
      }).issues.map((entry) => entry.code),
    ).toContain("player-photo-v4-predecessor-drift");

    registry.selections[0]!.currentCoverStatus = "retired" as never;
    expect(
      validatePlayerPhotoRegistryV4({
        ...input,
        registryBytes: canonicalJson(registry),
      }).issues.map((entry) => entry.code),
    ).toContain("player-photo-v4-same-version-drift");
  });

  it("binds supersession path, hash, and reason to the same athlete in frozen v3", () => {
    expect(
      issueCodes((registry) => {
        registry.selections[0]!.supersession.previousLocalFileSha256 =
          "0".repeat(64);
      }),
    ).toContain("player-photo-v4-supersession");

    expect(
      issueCodes((registry) => {
        registry.selections[0]!.supersession.reason =
          "revalidates-existing-non-event";
      }),
    ).toContain("player-photo-v4-supersession");
  });

  it("rejects a high-risk current cover and missing occasion or photographer evidence", () => {
    expect(
      issueCodes((registry) => {
        Object.assign(
          (registry.selections[0] as PlayerPhotoCommonsSelectionV4)
            .sourceRiskClassification,
          { category: "game-action-high-risk" },
        );
      }),
    ).toContain("player-photo-v4-high-risk-current-cover");

    expect(
      issueCodes((registry) => {
        (
          registry.selections[0] as PlayerPhotoCommonsSelectionV4
        ).occasionEvidence.basis = "";
      }),
    ).toContain("player-photo-v4-occasion-evidence");

    expect(
      issueCodes((registry) => {
        (
          registry.selections[0] as PlayerPhotoCommonsSelectionV4
        ).photographerRiskEvidence.category = "unresolved-reject" as never;
      }),
    ).toContain("player-photo-v4-photographer-evidence");

    expect(
      issueCodes((registry) => {
        (
          registry.selections[0] as PlayerPhotoCommonsSelectionV4
        ).photographerIdentity.name = "Getty Images";
      }),
    ).toContain("player-photo-v4-photographer-evidence");
  });

  it("rejects an otherwise complete identity record whose status is not verified", () => {
    expect(
      issueCodes((registry) => {
        (
          registry.selections[0] as PlayerPhotoCommonsSelectionV4
        ).identityEvidence.status = "rejected" as never;
      }),
    ).toContain("player-photo-v4-identity-evidence");
  });

  it("rejects unsupported licenses, bucket mismatches, and invalid Adapter's Licenses", () => {
    expect(
      issueCodes((registry) => {
        (registry.selections[0] as PlayerPhotoCommonsSelectionV4).license = {
          name: "Public Domain Mark 1.0",
          token: "public-domain-mark-1.0",
          url: "https://creativecommons.org/publicdomain/mark/1.0/",
        };
      }),
    ).toContain("player-photo-v4-license");

    expect(
      issueCodes((registry) => {
        (
          registry.selections[0] as PlayerPhotoCommonsSelectionV4
        ).rightsAttribution.licenseBucket = "cc-by";
      }),
    ).toContain("player-photo-v4-license-bucket");

    expect(
      issueCodes((registry) => {
        (
          registry.selections[0] as PlayerPhotoCommonsSelectionV4
        ).rightsAttribution.adapterLicense = null;
      }),
    ).toContain("player-photo-v4-adapter-license");
  });

  it("rejects a missing title state or notice state", () => {
    expect(
      issueCodes((registry) => {
        (
          registry.selections[0] as PlayerPhotoCommonsSelectionV4
        ).rightsAttribution.workTitle.status = "missing" as never;
      }),
    ).toContain("player-photo-v4-work-title");

    expect(
      issueCodes((registry) => {
        (
          registry.selections[0] as PlayerPhotoCommonsSelectionV4
        ).rightsAttribution.copyrightNotice = {
          status: "supplied",
          text: "Retained notice",
          url: null,
        };
      }),
    ).toContain("player-photo-v4-notice-state");
  });

  it("rejects remote current-cover paths and third-party raster content in SVG", () => {
    expect(
      issueCodes((registry) => {
        (
          registry.selections[0] as PlayerPhotoCommonsSelectionV4
        ).localFile.path = "https://upload.wikimedia.org/remote.png";
      }),
    ).toContain("player-photo-v4-local-photo");

    expect(
      issueCodes(
        (registry) => {
          const fallback = registry
            .selections[1] as PlayerPhotoSvgFallbackSelectionV4;
          const unsafe = Buffer.from(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480"><image href="data:image/png;base64,AA=="/></svg>',
          );
          fallback.localFile.byteLength = unsafe.byteLength;
          fallback.localFile.sha256 = sha256Hex(unsafe);
        },
        (bytes) => {
          bytes.set(
            SVG_PATH,
            Buffer.from(
              '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480"><image href="data:image/png;base64,AA=="/></svg>',
            ),
          );
        },
      ),
    ).toContain("player-photo-v4-svg-third-party-content");
  });

  it("binds the Commons description title to the fixed revision and oldid permalink", () => {
    expect(
      issueCodes((registry) => {
        (
          registry.selections[0] as PlayerPhotoCommonsSelectionV4
        ).sourceRevision.title = "File:Different athlete.png";
      }),
    ).toContain("player-photo-v4-source-revision");
  });
});
