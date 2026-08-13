import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  loadPlayerPhotoAssets,
  readPlayerPhotoValidationInput,
  validatePlayerPhotoAssets,
  type PlayerPhotoValidationInput,
} from "../../scripts/verify-player-photo-assets";
import { canonicalJson } from "../../src/lib/contracts/canonical";
import {
  PLAYER_PHOTO_SOURCE_RISK_DISCLAIMER,
  type PlayerPhotoRegistryV3,
} from "../../src/lib/contracts/player-photo";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

function validationInput(): PlayerPhotoValidationInput {
  const input = readPlayerPhotoValidationInput(REPO_ROOT);
  return {
    ...input,
    actualImagePaths: [...input.actualImagePaths],
    assetBytesByPath: new Map(
      [...input.assetBytesByPath].map(([path, bytes]) => [
        path,
        Buffer.from(bytes),
      ]),
    ),
  };
}

function mutateRegistry(
  input: PlayerPhotoValidationInput,
  mutate: (registry: PlayerPhotoRegistryV3) => void,
): void {
  const registry = JSON.parse(input.registryBytes!) as PlayerPhotoRegistryV3;
  mutate(registry);
  input.registryBytes = canonicalJson(registry);
}

function issueCodes(input: PlayerPhotoValidationInput): string[] {
  return validatePlayerPhotoAssets(input).issues.map((entry) => entry.code);
}

function moveAssetToFallback(
  input: PlayerPhotoValidationInput,
  athleteName: string,
  caseIds?: string[],
): void {
  let localPath = "";
  mutateRegistry(input, (registry) => {
    const index = registry.assets.findIndex(
      (asset) => asset.athleteName === athleteName,
    );
    const [asset] = registry.assets.splice(index, 1);
    localPath = asset!.localFile.path;
    registry.fallbacks.push({
      athleteName,
      caseIds: caseIds ?? [...asset!.caseIds],
      reason: "no-qualified-commons-photo",
    });
    registry.fallbacks.sort((left, right) =>
      left.athleteName < right.athleteName
        ? -1
        : left.athleteName > right.athleteName
          ? 1
          : 0,
    );
  });
  input.actualImagePaths = input.actualImagePaths.filter(
    (path) => path !== localPath,
  );
  input.assetBytesByPath.delete(localPath);
}

describe("governed Commons player-photo assets", () => {
  it("fails closed when the current Decision 13 registry is missing", () => {
    const root = mkdtempSync(join(tmpdir(), "player-photo-v4-missing-"));
    try {
      expect(
        loadPlayerPhotoAssets(root).issues.map((entry) => entry.code),
      ).toContain("player-photo-v4-missing-registry");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("accepts the exact real 21-photo registry covering all 26 cases", () => {
    const result = loadPlayerPhotoAssets(REPO_ROOT);
    expect(result.issues).toEqual([]);
    expect(result.registry?.assets).toHaveLength(21);
    expect(
      result.registry?.assets.flatMap((asset) => asset.caseIds),
    ).toHaveLength(26);
    expect(result.allowedPaths).toHaveLength(42);
    expect(result.currentRegistry?.selections).toHaveLength(21);
    expect(
      result.currentRegistry?.selections.filter(
        (selection) => selection.coverKind === "commons-photo",
      ),
    ).toHaveLength(5);
    expect(
      result.currentRegistry?.selections.filter(
        (selection) => selection.coverKind === "original-svg-fallback",
      ),
    ).toHaveLength(16);
    expect(
      result.registry?.assets.filter(
        (asset) => asset.rightsAttribution.licenseBucket === "cc-by",
      ),
    ).toHaveLength(9);
    expect(
      result.registry?.assets.filter(
        (asset) => asset.rightsAttribution.licenseBucket === "cc-by-sa",
      ),
    ).toHaveLength(12);
    expect(
      result.registry?.assets.filter(
        (asset) => asset.rightsAttribution.licenseBucket === "cc0",
      ),
    ).toHaveLength(0);
    expect(
      result.registry?.assets.every(
        (asset) =>
          asset.nonEventCaption === "球員球場資料照片；非本案例受傷當下影像" &&
          asset.cropValidation.ratios.every((ratio) => ratio.faceSafe),
      ),
    ).toBe(true);
    expect(
      result.registry?.assets.filter(
        (asset) =>
          asset.sourceRiskClassification.category === "game-action-high-risk",
      ),
    ).toHaveLength(19);
    expect(
      result.registry?.assets
        .filter(
          (asset) =>
            asset.sourceRiskClassification.category === "non-event-low-risk",
        )
        .map((asset) => asset.athleteName),
    ).toEqual(["Dwight Powell", "Trae Young"]);
    expect(
      result.registry?.assets.every(
        (asset) =>
          Object.keys(asset.sourceRiskClassification).sort().join("\0") ===
            ["basis", "category", "checkedAt", "sourceRevisionPermalink"]
              .sort()
              .join("\0") &&
          asset.sourceRiskClassification.checkedAt === "2026-08-12" &&
          asset.sourceRiskClassification.basis.endsWith(
            PLAYER_PHOTO_SOURCE_RISK_DISCLAIMER,
          ) &&
          asset.sourceRiskClassification.sourceRevisionPermalink ===
            asset.rightsAttribution.sourceRevision.permalink,
      ),
    ).toBe(true);
  });

  it("rejects unversioned fallback drift from the immutable v2 projection", () => {
    const input = validationInput();
    moveAssetToFallback(input, "Anfernee Simons");
    const result = validatePlayerPhotoAssets(input);
    expect(result.issues.map((entry) => entry.code)).toContain(
      "player-photo-registry-projection",
    );
    expect(result.registry?.assets).toHaveLength(20);
    expect(result.registry?.fallbacks).toEqual([
      {
        athleteName: "Anfernee Simons",
        caseIds: ["CASE-NBAANKLE-2023-004"],
        reason: "no-qualified-commons-photo",
      },
    ]);
    expect(result.allowedPaths).toHaveLength(20);
  });

  it("rejects empty, unknown, or noncanonical fallback coverage", () => {
    const empty = validationInput();
    mutateRegistry(empty, (registry) => {
      registry.fallbacks.push({
        athleteName: "Invented Athlete",
        caseIds: [],
        reason: "no-qualified-commons-photo",
      });
    });
    expect(issueCodes(empty)).toContain("player-photo-fallback");

    const unknown = validationInput();
    mutateRegistry(unknown, (registry) => {
      registry.fallbacks.push({
        athleteName: "Invented Athlete",
        caseIds: ["CASE-NBAANKLE-2023-004"],
        reason: "no-qualified-commons-photo",
      });
    });
    expect(issueCodes(unknown)).toContain("player-photo-fallback");

    const unsorted = validationInput();
    moveAssetToFallback(unsorted, "LaMelo Ball", [
      "CASE-NBAANKLE-2025-002",
      "CASE-NBAANKLE-2023-008",
      "CASE-NBAANKLE-2022-001",
    ]);
    expect(issueCodes(unsorted)).toContain("player-photo-fallback");
  });

  it.each([
    [
      "CC BY-NC 4.0",
      "cc-by-nc-4.0",
      "https://creativecommons.org/licenses/by-nc/4.0/",
    ],
    [
      "CC BY-ND 4.0",
      "cc-by-nd-4.0",
      "https://creativecommons.org/licenses/by-nd/4.0/",
    ],
    ["Fair use", "fair-use", "https://example.invalid/fair-use"],
    [
      "All rights reserved",
      "all-rights-reserved",
      "https://example.invalid/all-rights-reserved",
    ],
    ["Unknown", "unknown-license", "https://example.invalid/unknown"],
  ])("rejects the non-free or unknown license %s", (name, token, url) => {
    const input = validationInput();
    mutateRegistry(input, (registry) => {
      registry.assets[0]!.license = { name, token, url };
    });
    expect(issueCodes(input)).toContain("player-photo-license");
  });

  it.each([
    "wrong-athlete",
    "official-headshot",
    "news-agency",
    "screenshot",
    "thumbnail",
    "footage-derived",
  ])("rejects the forbidden source classification %s", (classification) => {
    const input = validationInput();
    mutateRegistry(input, (registry) => {
      Object.assign(registry.assets[0]!, {
        sourceClassification: classification,
      });
    });
    expect(issueCodes(input)).toContain("player-photo-classification");
  });

  it("rejects mismatched athlete identity and a commercial news-agency credit", () => {
    const wrongAthlete = validationInput();
    mutateRegistry(wrongAthlete, (registry) => {
      registry.assets[0]!.athleteName = "Different Athlete";
    });
    expect(issueCodes(wrongAthlete)).toContain("player-photo-case-coverage");

    const agency = validationInput();
    mutateRegistry(agency, (registry) => {
      registry.assets[0]!.photographer = "Getty Images";
    });
    expect(issueCodes(agency)).toContain("player-photo-photographer");
  });

  it.each([
    "Anthony_Edwards_Argentina_v_Egypt_7_July_2026-069_(cropped).jpg",
    "Dwight_Powell.jpg",
    "2025_C.J._McCollum_(cropped).jpg",
  ])("rejects the frozen negative filename %s", (filename) => {
    const input = validationInput();
    mutateRegistry(input, (registry) => {
      registry.assets[0]!.originalFile.filename = filename;
    });
    expect(issueCodes(input)).toContain("player-photo-original-file");
  });

  it("rejects remote, tracked, thumbnail, or non-original Commons URLs", () => {
    const tracked = validationInput();
    mutateRegistry(tracked, (registry) => {
      registry.assets[0]!.commonsDownloadUrl += "?utm_source=test";
    });
    expect(issueCodes(tracked)).toContain("player-photo-commons-url");

    const thumbnail = validationInput();
    mutateRegistry(thumbnail, (registry) => {
      registry.assets[0]!.commonsDownloadUrl =
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/AnferneeSimons_%28cropped%29.jpg/640px-AnferneeSimons_%28cropped%29.jpg";
    });
    expect(issueCodes(thumbnail)).toContain("player-photo-commons-url");

    const external = validationInput();
    mutateRegistry(external, (registry) => {
      registry.assets[0]!.commonsDescriptionUrl =
        "https://images.example.invalid/player.jpg";
    });
    expect(issueCodes(external)).toContain("player-photo-commons-url");
  });

  it("rejects byte drift, a duplicate local path, and an unregistered image", () => {
    const drift = validationInput();
    const driftPath = drift.actualImagePaths[0]!;
    drift.assetBytesByPath.set(driftPath, Buffer.from("not a JPEG"));
    expect(issueCodes(drift)).toContain("player-photo-byte-drift");

    const duplicate = validationInput();
    mutateRegistry(duplicate, (registry) => {
      registry.assets[1]!.localFile.path = registry.assets[0]!.localFile.path;
    });
    expect(issueCodes(duplicate)).toContain("player-photo-local-file");

    const extra = validationInput();
    extra.actualImagePaths.push("src/assets/players/unregistered.jpg");
    extra.assetBytesByPath.set(
      "src/assets/players/unregistered.jpg",
      Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
    );
    expect(issueCodes(extra)).toContain("player-photo-extra-image");
  });

  it("rejects a Commons MediaInfo SHA-1 that does not match the local original bytes", () => {
    const input = validationInput();
    mutateRegistry(input, (registry) => {
      registry.assets[0]!.originalFile.mediaInfoSha1 = "0".repeat(40);
    });
    expect(issueCodes(input)).toContain("player-photo-original-file");
  });

  it("rejects missing visible attribution, unsafe crop declarations, and stale policy bindings", () => {
    const attribution = validationInput();
    mutateRegistry(attribution, (registry) => {
      registry.assets[0]!.nonEventCaption = "" as never;
    });
    expect(issueCodes(attribution)).toContain("player-photo-attribution");

    const crop = validationInput();
    mutateRegistry(crop, (registry) => {
      Object.assign(registry.assets[0]!.cropValidation.ratios[0]!, {
        faceSafe: false,
      });
    });
    expect(issueCodes(crop)).toContain("player-photo-crop");

    const binding = validationInput();
    mutateRegistry(binding, (registry) => {
      registry.assets[0]!.sourcePolicyBinding.jsonSha256 = "0".repeat(64);
    });
    expect(issueCodes(binding)).toContain("player-photo-policy-binding");
  });

  it("binds the immutable v1/v2 registries and every current Commons oldid", () => {
    const lineage = validationInput();
    lineage.previousRegistryBytes = `${lineage.previousRegistryBytes} `;
    expect(issueCodes(lineage)).toContain("player-photo-registry-lineage");

    const historical = validationInput();
    historical.historicalRegistryV1Bytes = `${historical.historicalRegistryV1Bytes} `;
    expect(issueCodes(historical)).toContain("player-photo-registry-lineage");

    const revision = validationInput();
    mutateRegistry(revision, (registry) => {
      registry.assets[0]!.rightsAttribution.sourceRevision.id += 1;
    });
    expect(issueCodes(revision)).toContain("player-photo-source-revision");

    const projection = validationInput();
    mutateRegistry(projection, (registry) => {
      registry.assets[0]!.photographer = "Rewritten photographer";
    });
    expect(issueCodes(projection)).toContain(
      "player-photo-registry-projection",
    );
  });

  it("enforces the exact source-risk audit without treating low risk as clearance", () => {
    const category = validationInput();
    mutateRegistry(category, (registry) => {
      Object.assign(registry.assets[0]!.sourceRiskClassification, {
        category: "non-event-low-risk",
      });
    });
    expect(issueCodes(category)).toContain("player-photo-source-risk");

    const checkedAt = validationInput();
    mutateRegistry(checkedAt, (registry) => {
      Object.assign(registry.assets[0]!.sourceRiskClassification, {
        checkedAt: "2026-08-11",
      });
    });
    expect(issueCodes(checkedAt)).toContain("player-photo-source-risk");

    const permalink = validationInput();
    mutateRegistry(permalink, (registry) => {
      registry.assets[0]!.sourceRiskClassification.sourceRevisionPermalink =
        "https://commons.wikimedia.org/w/index.php?title=File%3AAnferneeSimons_%28cropped%29.jpg&oldid=1";
    });
    expect(issueCodes(permalink)).toContain("player-photo-source-risk");

    const clearance = validationInput();
    mutateRegistry(clearance, (registry) => {
      registry.assets[0]!.sourceRiskClassification.basis = `Cleared for publication. ${PLAYER_PHOTO_SOURCE_RISK_DISCLAIMER}`;
    });
    expect(issueCodes(clearance)).toContain("player-photo-source-risk");

    const confirmedPermission = validationInput();
    mutateRegistry(confirmedPermission, (registry) => {
      registry.assets[0]!.sourceRiskClassification.basis = `Publication permission confirmed. ${PLAYER_PHOTO_SOURCE_RISK_DISCLAIMER}`;
    });
    expect(issueCodes(confirmedPermission)).toContain(
      "player-photo-source-risk",
    );

    const extraKey = validationInput();
    mutateRegistry(extraKey, (registry) => {
      Object.assign(registry.assets[0]!.sourceRiskClassification, {
        clearance: "approved",
      });
    });
    expect(issueCodes(extraKey)).toContain("player-photo-source-risk");
  });

  it("rejects a missing supplied 2.0 title and an unverified invented title", () => {
    const missing = validationInput();
    mutateRegistry(missing, (registry) => {
      const record = registry.assets.find(
        (asset) => asset.athleteName === "Anthony Edwards",
      )!;
      record.rightsAttribution.workTitle.text = null;
    });
    expect(issueCodes(missing)).toContain("player-photo-work-title");

    const invented = validationInput();
    mutateRegistry(invented, (registry) => {
      const record = registry.assets.find(
        (asset) => asset.athleteName === "Brandon Clarke",
      )!;
      record.rightsAttribution.workTitle.status = "supplied";
      record.rightsAttribution.workTitle.text = null;
    });
    expect(issueCodes(invented)).toContain("player-photo-work-title");

    const downgraded = validationInput();
    mutateRegistry(downgraded, (registry) => {
      const record = registry.assets.find(
        (asset) => asset.athleteName === "Anthony Edwards",
      )!;
      record.rightsAttribution.workTitle.status = "not-supplied";
      record.rightsAttribution.workTitle.text = null;
    });
    expect(issueCodes(downgraded)).toContain("player-photo-registry-digest");
  });

  it("requires explicit 4.0 notice states and retains personality warnings", () => {
    const notice = validationInput();
    mutateRegistry(notice, (registry) => {
      const record = registry.assets.find(
        (asset) => asset.athleteName === "Anfernee Simons",
      )!;
      record.rightsAttribution.copyrightNotice.url =
        record.rightsAttribution.sourceRevision.permalink;
    });
    expect(issueCodes(notice)).toContain("player-photo-rights-notice");

    const personality = validationInput();
    mutateRegistry(personality, (registry) => {
      const record = registry.assets.find(
        (asset) => asset.athleteName === "Dwight Powell",
      )!;
      record.rightsAttribution.otherPerFileNotice = {
        status: "not-supplied",
        text: null,
        url: null,
      };
    });
    expect(issueCodes(personality)).toContain("player-photo-rights-notice");

    const copyrightDowngrade = validationInput();
    mutateRegistry(copyrightDowngrade, (registry) => {
      const record = registry.assets.find(
        (asset) => asset.athleteName === "Dwight Powell",
      )!;
      record.rightsAttribution.copyrightNotice = {
        status: "not-supplied",
        text: null,
        url: null,
      };
    });
    expect(issueCodes(copyrightDowngrade)).toContain(
      "player-photo-registry-digest",
    );

    const dwight = JSON.parse(
      validationInput().registryBytes!,
    ) as PlayerPhotoRegistryV3;
    expect(
      dwight.assets.find((asset) => asset.athleteName === "Dwight Powell")!
        .rightsAttribution.workTitle,
    ).toMatchObject({
      status: "supplied",
      text: "Basketball-Länderspiel: Deutschland gegen Kanada",
    });
  });

  it("binds supplied Flickr titles to the actual supporting source URLs", () => {
    const registry = JSON.parse(
      validationInput().registryBytes!,
    ) as PlayerPhotoRegistryV3;
    expect(
      registry.assets.find((asset) => asset.athleteName === "Ja Morant")!
        .rightsAttribution.workTitle.evidenceUrl,
    ).toBe("https://www.flickr.com/photos/joeglo/51664923611/");
    expect(
      registry.assets.find((asset) => asset.athleteName === "LaMelo Ball")!
        .rightsAttribution.workTitle.evidenceUrl,
    ).toBe("https://www.flickr.com/photos/edrost88/51916059508/");

    const rewritten = validationInput();
    mutateRegistry(rewritten, (candidate) => {
      candidate.assets.find(
        (asset) => asset.athleteName === "Ja Morant",
      )!.rightsAttribution.workTitle.evidenceUrl =
        "https://commons.wikimedia.org/wiki/File:Ja_Morant_2021.jpg";
    });
    expect(issueCodes(rewritten)).toContain("player-photo-registry-digest");
  });

  it("requires a same-version adapter license only for CC BY-SA crops", () => {
    const shareAlike = validationInput();
    mutateRegistry(shareAlike, (registry) => {
      const record = registry.assets.find(
        (asset) => asset.athleteName === "Anthony Edwards",
      )!;
      record.rightsAttribution.adapterLicense = null;
    });
    expect(issueCodes(shareAlike)).toContain("player-photo-adapter-license");

    const by = validationInput();
    mutateRegistry(by, (registry) => {
      const record = registry.assets.find(
        (asset) => asset.athleteName === "CJ McCollum",
      )!;
      record.rightsAttribution.adapterLicense = { ...record.license };
    });
    expect(issueCodes(by)).toContain("player-photo-adapter-license");
  });

  it("recognizes CC0 semantics but rejects retroactive v1 license changes", () => {
    const input = validationInput();
    mutateRegistry(input, (registry) => {
      const record = registry.assets.find(
        (asset) => asset.athleteName === "CJ McCollum",
      )!;
      record.license = {
        name: "CC0 1.0",
        token: "cc0-1.0",
        url: "https://creativecommons.org/publicdomain/zero/1.0/",
      };
      record.rightsAttribution.licenseBucket = "cc0";
      record.rightsAttribution.adapterLicense = null;
    });
    const codes = issueCodes(input);
    expect(codes).toContain("player-photo-registry-projection");
    expect(codes).not.toContain("player-photo-license-bucket");
    expect(codes).not.toContain("player-photo-adapter-license");
  });
});
