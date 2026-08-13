/** Generates the append-only Decision 13 current-cover registry v4. */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import {
  PLAYER_PHOTO_POLICY_V5_JSON_PATH,
  PLAYER_PHOTO_POLICY_V5_JSON_SHA256,
  PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH,
  PLAYER_PHOTO_POLICY_V5_MARKDOWN_SHA256,
  PLAYER_PHOTO_REGISTRY_PREDECESSORS,
  PLAYER_PHOTO_REGISTRY_V4_PATH,
  PLAYER_PHOTO_REGISTRY_V4_SCOPE_ID,
  type PlayerPhotoCommonsSelectionV4,
  type PlayerPhotoRegistryV4,
  type PlayerPhotoSvgFallbackSelectionV4,
} from "../src/lib/contracts/player-photo-registry-v4";
import type { PlayerPhotoRegistryV3 } from "../src/lib/contracts/player-photo";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const v3Path = PLAYER_PHOTO_REGISTRY_PREDECESSORS[2].path;
const v3Bytes = readFileSync(resolve(root, v3Path), "utf8");
if (sha256Hex(v3Bytes) !== PLAYER_PHOTO_REGISTRY_PREDECESSORS[2].sha256) {
  throw new Error("Frozen player-photo registry v3 bytes changed");
}
const v3 = parseStrictJson(v3Bytes) as PlayerPhotoRegistryV3;
const v3ByAthlete = new Map(
  v3.assets.map((asset) => [asset.athleteName, asset]),
);

const checkedAt = "2026-08-13";
const checkedBy = "decision-13-photo-review";
const svgCaption =
  "本站原創抽象運動醫學封面；非球員照片，亦非本案例受傷當下影像";
const emptyNotice = { status: "not-supplied" as const, text: null, url: null };

function evidence(basis: string, urls: string[]) {
  return { basis, checkedAt, checkedBy, urls };
}

interface PhotoSource {
  athleteName: string;
  commonsDescriptionUrl: string;
  commonsDownloadUrl: string;
  focalPosition: { xPercent: number; yPercent: number };
  license: { name: string; token: string; url: string };
  localFile: {
    byteLength: number;
    height: number;
    path: string;
    sha256: string;
    width: number;
  };
  nonEventCaption: string;
  occasion: PlayerPhotoCommonsSelectionV4["occasionEvidence"]["category"];
  occasionBasis: string;
  photographerName: string;
  photographerRisk: PlayerPhotoCommonsSelectionV4["photographerRiskEvidence"]["category"];
  photographerRiskBasis: string;
  revision: PlayerPhotoCommonsSelectionV4["sourceRevision"];
  uploaderName: string;
  uploaderRelationship: PlayerPhotoCommonsSelectionV4["uploaderIdentity"]["relationshipToPhotographer"];
  upstream: PlayerPhotoCommonsSelectionV4["upstreamOriginal"];
  workTitle: PlayerPhotoCommonsSelectionV4["rightsAttribution"]["workTitle"];
  copyrightNotice?: { status: "supplied"; text: string; url: string };
  otherPerFileNotice?: { status: "supplied"; text: string; url: string };
  commonsCrop: boolean;
}

const photos: PhotoSource[] = [
  {
    athleteName: "CJ McCollum",
    commonsDescriptionUrl:
      "https://commons.wikimedia.org/wiki/File:2025_C.J._McCollum_(cropped).jpg",
    commonsDownloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/7/73/2025_C.J._McCollum_%28cropped%29.jpg",
    focalPosition: { xPercent: 50, yPercent: 35 },
    license: {
      name: "CC BY-SA 4.0",
      token: "cc-by-sa-4.0",
      url: "https://creativecommons.org/licenses/by-sa/4.0",
    },
    localFile: {
      byteLength: 1287680,
      height: 1513,
      path: "src/assets/players/decision-13/cj-mccollum.jpg",
      sha256:
        "5688298371c4ec218dae6f5131685f4ab511fab6d0797685146953235c8c7e45",
      width: 1138,
    },
    nonEventCaption:
      "C.J. McCollum 於 2025–26 華盛頓巫師媒體日；非本案例受傷當下影像",
    occasion: "verified-media-day",
    occasionBasis:
      "The upstream description expressly identifies the Washington Wizards 2025-26 media day rather than game, practice, or pregame context.",
    photographerName: "All-Pro Reels (Joe Glorioso)",
    photographerRisk: "credentialed-media-residual-risk",
    photographerRiskBasis:
      "The Commons import, original Flickr page, and All-Pro Reels author page resolve the named professional-media chain; credentialed-media residual risk remains explicit.",
    revision: {
      checkedAt,
      id: 1130690368,
      permalink:
        "https://commons.wikimedia.org/w/index.php?title=File%3A2025_C.J._McCollum_%28cropped%29.jpg&oldid=1130690368",
      timestamp: "2025-12-14T01:22:53Z",
      title: "File:2025 C.J. McCollum (cropped).jpg",
    },
    uploaderName: "Ooligan",
    uploaderRelationship: "platform-import-evidenced",
    upstream: {
      evidence:
        "The fixed Commons revision links the original All-Pro Reels Flickr work and the original page remained available at review.",
      status: "verified",
      url: "https://www.flickr.com/photos/10457902@N08/54840990136/",
    },
    workTitle: {
      evidence: "The original Flickr page supplies the title JG9_0113.",
      evidenceUrl: "https://www.flickr.com/photos/10457902@N08/54840990136/",
      status: "supplied",
      text: "JG9_0113",
    },
    commonsCrop: true,
  },
  {
    athleteName: "Dwight Powell",
    commonsDescriptionUrl:
      "https://commons.wikimedia.org/wiki/File:2023-08-09_Deutschland_gegen_Kanada_(Basketball-L%C3%A4nderspiel)_by_Sandro_Halank%E2%80%93021.jpg",
    commonsDownloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/8/8b/2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93021.jpg",
    focalPosition: { xPercent: 50, yPercent: 0 },
    license: {
      name: "CC BY-SA 4.0",
      token: "cc-by-sa-4.0",
      url: "https://creativecommons.org/licenses/by-sa/4.0",
    },
    localFile: {
      byteLength: 2398388,
      height: 2827,
      path: "src/assets/players/decision-13/dwight-powell.jpg",
      sha256:
        "d1cab51c99f25b380d05d14bd5fe4f826b51042d4c007a7d105a7240265cd211",
      width: 2192,
    },
    nonEventCaption:
      "Dwight Powell 於德國—加拿大熱身賽賽前暖身；非本案例受傷當下影像",
    occasion: "documented-preseason-tune-up-warm-up-outside-live-competition",
    occasionBasis:
      "The preparation-match file depicts Powell in warm-up clothing outside live possession or defensive action.",
    photographerName: "Sandro Halank",
    photographerRisk: "credentialed-media-residual-risk",
    photographerRiskBasis:
      "The self-photographed Commons record verifies Sandro Halank's author and uploader chain while sports-event credentialed-context risk remains explicit.",
    revision: {
      checkedAt,
      id: 967381398,
      permalink:
        "https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93021.jpg&oldid=967381398",
      timestamp: "2024-12-07T23:52:52Z",
      title:
        "File:2023-08-09 Deutschland gegen Kanada (Basketball-Länderspiel) by Sandro Halank–021.jpg",
    },
    uploaderName: "Sandro Halank",
    uploaderRelationship: "same-person-evidenced",
    upstream: {
      evidence:
        "The fixed Commons record declares direct own work and supplies no separate upstream original page.",
      status: "not-supplied",
      url: null,
    },
    workTitle: {
      evidence:
        "Embedded ObjectName and ImageDescription supply Basketball-Länderspiel: Deutschland gegen Kanada.",
      evidenceUrl:
        "https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93021.jpg&oldid=967381398",
      status: "supplied",
      text: "Basketball-Länderspiel: Deutschland gegen Kanada",
    },
    copyrightNotice: {
      status: "supplied",
      text: "Sandro Halank, Wikimedia Commons, CC BY-SA 4.0",
      url: "https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93021.jpg&oldid=967381398",
    },
    otherPerFileNotice: {
      status: "supplied",
      text: "Personality rights warning",
      url: "https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93021.jpg&oldid=967381398",
    },
    commonsCrop: false,
  },
  {
    athleteName: "Kevin Durant",
    commonsDescriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Kevin_Durant_and_Frances_Tiafoe_(2023_DC_Open)_01_(cropped).jpg",
    commonsDownloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/23/Kevin_Durant_and_Frances_Tiafoe_%282023_DC_Open%29_01_%28cropped%29.jpg",
    focalPosition: { xPercent: 30, yPercent: 12 },
    license: {
      name: "CC BY-SA 4.0",
      token: "cc-by-sa-4.0",
      url: "https://creativecommons.org/licenses/by-sa/4.0",
    },
    localFile: {
      byteLength: 2322054,
      height: 2496,
      path: "src/assets/players/decision-13/kevin-durant.jpg",
      sha256:
        "6f18766d49193c6858d607ae26551ba6c4422eebefb535ca2805ccd8b54e956d",
      width: 2141,
    },
    nonEventCaption:
      "Kevin Durant 於 2023 DC Open 公開訪談；非本案例受傷當下影像",
    occasion: "public-event-or-fan-interaction",
    occasionBasis:
      "The description records Durant in a public post-match tennis interview at the 2023 DC Open, not basketball action.",
    photographerName: "Hameltion",
    photographerRisk: "credentialed-media-residual-risk",
    photographerRiskBasis:
      "The parent Commons file is verified direct own work by Hameltion; event-access residual risk remains explicit.",
    revision: {
      checkedAt,
      id: 1235995897,
      permalink:
        "https://commons.wikimedia.org/w/index.php?title=File%3AKevin_Durant_and_Frances_Tiafoe_%282023_DC_Open%29_01_%28cropped%29.jpg&oldid=1235995897",
      timestamp: "2026-06-22T05:11:15Z",
      title:
        "File:Kevin Durant and Frances Tiafoe (2023 DC Open) 01 (cropped).jpg",
    },
    uploaderName: "Hameltion",
    uploaderRelationship: "same-person-evidenced",
    upstream: {
      evidence:
        "The cropped file binds its direct-own-work Commons parent at fixed revision 1136034235.",
      status: "verified",
      url: "https://commons.wikimedia.org/wiki/File:Kevin_Durant_and_Frances_Tiafoe_(2023_DC_Open)_01.jpg",
    },
    workTitle: {
      evidence:
        "The fixed Commons record supplies no distinct work title beyond filename/ObjectName metadata.",
      evidenceUrl:
        "https://commons.wikimedia.org/w/index.php?title=File%3AKevin_Durant_and_Frances_Tiafoe_%282023_DC_Open%29_01_%28cropped%29.jpg&oldid=1235995897",
      status: "not-supplied",
      text: null,
    },
    commonsCrop: true,
  },
  {
    athleteName: "Kyrie Irving",
    commonsDescriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Kyrie_Irving_during_the_2016_NBA_Champions_victory_parade.jpg",
    commonsDownloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/6b/Kyrie_Irving_during_the_2016_NBA_Champions_victory_parade.jpg",
    focalPosition: { xPercent: 57, yPercent: 28 },
    license: {
      name: "CC BY 2.0",
      token: "cc-by-2.0",
      url: "https://creativecommons.org/licenses/by/2.0",
    },
    localFile: {
      byteLength: 7867079,
      height: 4000,
      path: "src/assets/players/decision-13/kyrie-irving.jpg",
      sha256:
        "4f631559835221f8276ef7b1ee09b4435a5003ad9a50614bb0c72673dec745b6",
      width: 6000,
    },
    nonEventCaption: "Kyrie Irving 於 2016 冠軍遊行；非本案例受傷當下影像",
    occasion: "public-event-or-fan-interaction",
    occasionBasis:
      "The original and Commons pages identify the 2016 NBA champions' public victory parade rather than game play.",
    photographerName: "Erik Drost",
    photographerRisk: "independent-public-event-low-risk",
    photographerRiskBasis:
      "The named independent photographer, original Flickr page, and Commons review form a verified license chain.",
    revision: {
      checkedAt,
      id: 1126274545,
      permalink:
        "https://commons.wikimedia.org/w/index.php?title=File%3AKyrie_Irving_during_the_2016_NBA_Champions_victory_parade.jpg&oldid=1126274545",
      timestamp: "2025-12-05T22:23:19Z",
      title:
        "File:Kyrie Irving during the 2016 NBA Champions victory parade.jpg",
    },
    uploaderName: "Pofka",
    uploaderRelationship: "platform-import-evidenced",
    upstream: {
      evidence:
        "The fixed Commons record links the Flickr original and records the matching Flickr license review.",
      status: "verified",
      url: "https://www.flickr.com/photos/edrost88/27235940294/",
    },
    workTitle: {
      evidence: "The original Flickr page supplies Kyrie Irving.",
      evidenceUrl: "https://www.flickr.com/photos/edrost88/27235940294/",
      status: "supplied",
      text: "Kyrie Irving",
    },
    commonsCrop: false,
  },
  {
    athleteName: "LeBron James",
    commonsDescriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Lebron_James_NYC_2010_Shankbone.jpg",
    commonsDownloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/8/80/Lebron_James_NYC_2010_Shankbone.jpg",
    focalPosition: { xPercent: 50, yPercent: 30 },
    license: {
      name: "CC BY 3.0",
      token: "cc-by-3.0",
      url: "https://creativecommons.org/licenses/by/3.0",
    },
    localFile: {
      byteLength: 2550116,
      height: 2504,
      path: "src/assets/players/decision-13/lebron-james.jpg",
      sha256:
        "8f5550b3acc78302a465a84b9e78f62d466e484fbfec1e3c1054e9123457680c",
      width: 2003,
    },
    nonEventCaption:
      "LeBron James 於《More Than a Game》紐約公開活動；非本案例受傷當下影像",
    occasion: "public-event-or-fan-interaction",
    occasionBasis:
      "The description places James at a New York public appearance discussing More Than a Game rather than basketball action.",
    photographerName: "David Shankbone",
    photographerRisk: "independent-public-event-low-risk",
    photographerRiskBasis:
      "The Commons record is verified direct own work by the identified independent photographer.",
    revision: {
      checkedAt,
      id: 1012365035,
      permalink:
        "https://commons.wikimedia.org/w/index.php?title=File%3ALebron_James_NYC_2010_Shankbone.jpg&oldid=1012365035",
      timestamp: "2025-03-21T22:50:50Z",
      title: "File:Lebron James NYC 2010 Shankbone.jpg",
    },
    uploaderName: "David Shankbone",
    uploaderRelationship: "same-person-evidenced",
    upstream: {
      evidence:
        "The fixed Commons record declares direct own work; no separate available upstream page establishes additional facts.",
      status: "not-supplied",
      url: null,
    },
    workTitle: {
      evidence:
        "The fixed Commons record supplies no distinct work title beyond filename/ObjectName metadata.",
      evidenceUrl:
        "https://commons.wikimedia.org/w/index.php?title=File%3ALebron_James_NYC_2010_Shankbone.jpg&oldid=1012365035",
      status: "not-supplied",
      text: null,
    },
    otherPerFileNotice: {
      status: "supplied",
      text: "Personality rights warning",
      url: "https://commons.wikimedia.org/w/index.php?title=File%3ALebron_James_NYC_2010_Shankbone.jpg&oldid=1012365035",
    },
    commonsCrop: false,
  },
];

const photoByAthlete = new Map(
  photos.map((photo) => [photo.athleteName, photo]),
);
const selections = v3.assets.map(
  (
    previous,
  ): PlayerPhotoCommonsSelectionV4 | PlayerPhotoSvgFallbackSelectionV4 => {
    const common = {
      athleteName: previous.athleteName,
      caseIds: previous.caseIds,
      currentCoverStatus: "current" as const,
      supersession: {
        previousLocalFilePath: previous.localFile.path,
        previousLocalFileSha256: previous.localFile.sha256,
        reason:
          previous.sourceRiskClassification.category === "game-action-high-risk"
            ? ("replaces-game-action-high-risk" as const)
            : previous.athleteName === "Dwight Powell"
              ? ("revalidates-existing-non-event" as const)
              : ("replaces-existing-non-event-after-revalidation" as const),
      },
    };
    const photo = photoByAthlete.get(previous.athleteName);
    if (photo === undefined) {
      const slug = previous.localFile.path
        .split("/")
        .at(-1)!
        .replace(/\.jpg$/u, "");
      const path = `src/assets/players/decision-13/${slug}.svg`;
      const bytes = readFileSync(resolve(root, path));
      return {
        ...common,
        coverKind: "original-svg-fallback",
        focalPosition: { xPercent: 50, yPercent: 50 },
        nonEventCaption: svgCaption,
        fallbackProvenance: {
          athleteLikeness: "none",
          copiedTeamOrLeagueMarks: "none",
          createdAt: checkedAt,
          createdBy: "professional-sports-injury-atlas",
          embeddedOrLinkedRaster: "none",
          externalFetches: "none",
          originalityBasis:
            "Original site-owned abstract vector artwork; no player likeness, team/league marks, text, fonts, external media, or third-party source material.",
          thirdPartyArtworkOrFonts: "none",
        },
        localFile: {
          byteLength: bytes.byteLength,
          height: 900,
          mimeType: "image/svg+xml",
          path,
          sha256: sha256Hex(bytes),
          width: 1600,
        },
      };
    }
    const sourceUrls = [
      photo.revision.permalink,
      ...(photo.upstream.url === null ? [] : [photo.upstream.url]),
    ];
    const bucket = photo.license.token.startsWith("cc-by-sa-")
      ? ("cc-by-sa" as const)
      : photo.license.token.startsWith("cc-by-")
        ? ("cc-by" as const)
        : ("cc0" as const);
    return {
      ...common,
      coverKind: "commons-photo",
      commonsDescriptionUrl: photo.commonsDescriptionUrl,
      commonsDownloadUrl: photo.commonsDownloadUrl,
      cropValidation: {
        checkedAt,
        checkedBy,
        ratios: [
          { aspectRatio: "5:2", subjectSafe: true },
          { aspectRatio: "16:9", subjectSafe: true },
        ],
      },
      focalPosition: photo.focalPosition,
      identityEvidence: {
        ...evidence(
          `The fixed source pages identify ${photo.athleteName} as the depicted athlete.`,
          sourceUrls,
        ),
        status: "verified",
      },
      license: photo.license,
      localFile: { ...photo.localFile, mimeType: "image/jpeg" },
      nonEventCaption: photo.nonEventCaption,
      occasionEvidence: {
        ...evidence(photo.occasionBasis, sourceUrls),
        category: photo.occasion,
      },
      photographerIdentity: {
        evidence: evidence(
          `The fixed source chain identifies ${photo.photographerName} as photographer.`,
          sourceUrls,
        ),
        name: photo.photographerName,
      },
      photographerRiskEvidence: {
        ...evidence(photo.photographerRiskBasis, sourceUrls),
        category: photo.photographerRisk,
        residualRisk:
          "Copyright authority, personality rights, and public release remain separately held for review.",
      },
      rightsAttribution: {
        adapterLicense: bucket === "cc-by-sa" ? { ...photo.license } : null,
        alterationState: {
          disclosure: photo.commonsCrop
            ? "Commons derivative crop plus site CSS presentation crop."
            : "Unmodified local original with site CSS presentation crop.",
          presentation: "css-object-fit-cover-crop",
        },
        copyrightNotice: photo.copyrightNotice ?? emptyNotice,
        disclaimerNotice: emptyNotice,
        licenseBucket: bucket,
        otherPerFileNotice: photo.otherPerFileNotice ?? emptyNotice,
        workTitle: photo.workTitle,
      },
      sourceRevision: photo.revision,
      sourceRiskClassification: {
        category: "non-event-low-risk",
        nonClearanceStatement:
          "Low risk is not rights clearance or public-release approval.",
      },
      uploaderIdentity: {
        evidence: evidence(
          `The fixed source chain identifies ${photo.uploaderName} as Commons uploader and documents the stated relationship.`,
          sourceUrls,
        ),
        name: photo.uploaderName,
        relationshipToPhotographer: photo.uploaderRelationship,
      },
      upstreamOriginal: photo.upstream,
    };
  },
);

const registry: PlayerPhotoRegistryV4 = {
  predecessorRegistryBindings: PLAYER_PHOTO_REGISTRY_PREDECESSORS.map(
    (binding) => ({ ...binding }),
  ),
  schemaVersion: 4,
  scopeId: PLAYER_PHOTO_REGISTRY_V4_SCOPE_ID,
  selections,
  sourcePolicyBinding: {
    jsonPath: PLAYER_PHOTO_POLICY_V5_JSON_PATH,
    jsonSha256: PLAYER_PHOTO_POLICY_V5_JSON_SHA256,
    markdownPath: PLAYER_PHOTO_POLICY_V5_MARKDOWN_PATH,
    markdownSha256: PLAYER_PHOTO_POLICY_V5_MARKDOWN_SHA256,
    sourcePolicyVersion: "nba-v5",
  },
};
const outputBytes = canonicalJson(registry);
if (process.argv.includes("--check")) {
  if (
    readFileSync(resolve(root, PLAYER_PHOTO_REGISTRY_V4_PATH), "utf8") !==
    outputBytes
  )
    throw new Error("Generated player-photo registry v4 bytes are stale");
  console.log(`player-photo registry v4 OK — ${sha256Hex(outputBytes)}`);
} else if (process.argv.includes("--stdout")) process.stdout.write(outputBytes);
else writeFileSync(resolve(root, PLAYER_PHOTO_REGISTRY_V4_PATH), outputBytes);
