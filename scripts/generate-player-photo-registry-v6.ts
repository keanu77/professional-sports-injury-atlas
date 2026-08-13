/** Generates the append-only Decision 14 current-cover registry successor. */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import {
  PLAYER_PHOTO_REGISTRY_V5_PATH,
  PLAYER_PHOTO_REGISTRY_V5_SHA256,
  type PlayerPhotoRegistryV5,
} from "../src/lib/contracts/player-photo-registry-v5";
import {
  PLAYER_PHOTO_POLICY_V7_JSON_PATH,
  PLAYER_PHOTO_POLICY_V7_JSON_SHA256,
  PLAYER_PHOTO_POLICY_V7_MARKDOWN_PATH,
  PLAYER_PHOTO_POLICY_V7_MARKDOWN_SHA256,
  PLAYER_PHOTO_REGISTRY_V6_PATH,
  PLAYER_PHOTO_REGISTRY_V6_PREDECESSOR,
  PLAYER_PHOTO_REGISTRY_V6_SCOPE_ID,
  type PlayerPhotoCommonsSelectionV6,
  type PlayerPhotoRegistryV6,
} from "../src/lib/contracts/player-photo-registry-v6";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const checkedAt = "2026-08-13";
const checkedBy = "decision-14-photo-review";
const ccBySa4 = {
  name: "CC BY-SA 4.0",
  token: "cc-by-sa-4.0",
  url: "https://creativecommons.org/licenses/by-sa/4.0",
} as const;
const noNotice = { status: "not-supplied", text: null, url: null } as const;
const nonClearanceStatement =
  "Low risk is not rights clearance or public-release approval." as const;
const residualRisk =
  "Copyright authority, personality rights, and public release remain separately held for review.";

function evidence(basis: string, urls: string[]) {
  return { basis, checkedAt, checkedBy, urls };
}

const damianRevision =
  "https://commons.wikimedia.org/w/index.php?title=File%3A20140814%20World%20Basketball%20Festival%20Damian%20Lillard%20and%20Kyle%20Korver.JPG&oldid=1195923850";
const damianDescription =
  "https://commons.wikimedia.org/wiki/File:20140814_World_Basketball_Festival_Damian_Lillard_and_Kyle_Korver.JPG";
const damianUrls = [damianRevision];

const jaysonRevision =
  "https://commons.wikimedia.org/w/index.php?title=File%3A2018%20NBA%20All-Star%20Weekend%20-%20Jayson%20Tatum.jpg&oldid=756925233";
const jaysonDescription =
  "https://commons.wikimedia.org/wiki/File:2018_NBA_All-Star_Weekend_-_Jayson_Tatum.jpg";
const jaysonUrls = [jaysonRevision];

const adoptedSelections: Record<string, PlayerPhotoCommonsSelectionV6> = {
  "Damian Lillard": {
    athleteName: "Damian Lillard",
    caseIds: ["CASE-NBAACHILLES-2025-015"],
    commonsDescriptionUrl: damianDescription,
    commonsDownloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/c/c3/20140814_World_Basketball_Festival_Damian_Lillard_and_Kyle_Korver.JPG",
    coverKind: "commons-photo",
    cropValidation: {
      checkedAt,
      checkedBy,
      ratios: [
        { aspectRatio: "5:2", subjectSafe: true },
        { aspectRatio: "16:9", subjectSafe: true },
      ],
    },
    currentCoverStatus: "current",
    focalPosition: { xPercent: 28, yPercent: 35 },
    identityEvidence: {
      ...evidence(
        "The fixed Commons revision identifies Damian Lillard on the documented public stage with Kyle Korver and host Steve Bardo.",
        damianUrls,
      ),
      status: "verified",
    },
    license: { ...ccBySa4 },
    localFile: {
      byteLength: 5414375,
      height: 3456,
      mimeType: "image/jpeg",
      path: "src/assets/players/decision-14/damian-lillard.jpg",
      sha256:
        "ba8a0f23d721519e4796c89513f21a9e3c1d4fafe39f84a0192244162bb3abcf",
      width: 5184,
    },
    nonEventCaption:
      "Damian Lillard 於 2014 年芝加哥 63rd Street Beach 世界籃球節公開舞台；非本案例受傷當下影像",
    occasionEvidence: {
      ...evidence(
        "The fixed description and downloaded pixels place Lillard on the 2014 World Basketball Festival public stage at Chicago's 63rd Street Beach, outside live play, pregame, or warm-up.",
        damianUrls,
      ),
      category: "public-event-or-fan-interaction",
    },
    photographerIdentity: {
      evidence: evidence(
        "The fixed direct-own-work Commons record credits TonyTheTiger as photographer.",
        damianUrls,
      ),
      name: "TonyTheTiger",
    },
    photographerRiskEvidence: {
      ...evidence(
        "The fixed direct-own-work record binds the named photographer and uploader for a public festival stage; low-risk classification remains distinct from clearance.",
        damianUrls,
      ),
      category: "independent-public-event-low-risk",
      residualRisk,
    },
    rightsAttribution: {
      adapterLicense: { ...ccBySa4 },
      alterationState: {
        disclosure:
          "Unmodified local original with site CSS presentation crop.",
        presentation: "css-object-fit-cover-crop",
      },
      copyrightNotice: { ...noNotice },
      disclaimerNotice: { ...noNotice },
      licenseBucket: "cc-by-sa",
      otherPerFileNotice: { ...noNotice },
      workTitle: {
        evidence:
          "The fixed Commons record supplies no distinct work title beyond filename/ObjectName metadata.",
        evidenceUrl: damianRevision,
        status: "not-supplied",
        text: null,
      },
    },
    sourceRevision: {
      checkedAt,
      id: 1195923850,
      permalink: damianRevision,
      timestamp: "2026-04-12T04:32:09Z",
      title:
        "File:20140814 World Basketball Festival Damian Lillard and Kyle Korver.JPG",
    },
    sourceRiskClassification: {
      category: "non-event-low-risk",
      nonClearanceStatement,
    },
    supersession: {
      previousLocalFilePath:
        "src/assets/players/decision-13/damian-lillard.svg",
      previousLocalFileSha256:
        "a82bcb6e92ef03798745e8cb9f3458abe6cb37657d6111343a3a72e3cd89d226",
      reason: "replaces-current-svg-after-v6-non-event-qualification",
    },
    uploaderIdentity: {
      evidence: evidence(
        "The fixed Commons record names TonyTheTiger as the original uploader and declares direct own work; no uploader-only maker inference is used.",
        damianUrls,
      ),
      name: "TonyTheTiger",
      relationshipToPhotographer: "same-person-evidenced",
    },
    upstreamOriginal: {
      evidence:
        "The fixed Commons record declares direct own work and supplies no separate upstream original page.",
      status: "not-supplied",
      url: null,
    },
  },
  "Jayson Tatum": {
    athleteName: "Jayson Tatum",
    caseIds: ["CASE-NBAACHILLES-2025-016"],
    commonsDescriptionUrl: jaysonDescription,
    commonsDownloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/58/2018_NBA_All-Star_Weekend_-_Jayson_Tatum.jpg",
    coverKind: "commons-photo",
    cropValidation: {
      checkedAt,
      checkedBy,
      ratios: [
        { aspectRatio: "5:2", subjectSafe: true },
        { aspectRatio: "16:9", subjectSafe: true },
      ],
    },
    currentCoverStatus: "current",
    focalPosition: { xPercent: 30, yPercent: 35 },
    identityEvidence: {
      ...evidence(
        "The fixed Commons revision identifies Jayson Tatum in an interview at 2018 NBA All-Star Weekend.",
        jaysonUrls,
      ),
      status: "verified",
    },
    license: { ...ccBySa4 },
    localFile: {
      byteLength: 447666,
      height: 1680,
      mimeType: "image/jpeg",
      path: "src/assets/players/decision-14/jayson-tatum.jpg",
      sha256:
        "0adddc2e2918f307434e18e79c96ed7bf2e852122bea0adc0c38203584d7cb78",
      width: 2188,
    },
    nonEventCaption:
      "Jayson Tatum 於 2018 NBA 全明星週末公開訪談舞台；非本案例受傷當下影像",
    occasionEvidence: {
      ...evidence(
        "The fixed description and downloaded pixels show Tatum seated with a microphone on a fan-facing stage, with no court, play, pregame, or warm-up context.",
        jaysonUrls,
      ),
      category: "public-event-or-fan-interaction",
    },
    photographerIdentity: {
      evidence: evidence(
        "The fixed direct-own-work Commons record credits Amin Eshaiker and links the Amineshaker uploader account.",
        jaysonUrls,
      ),
      name: "Amin Eshaiker",
    },
    photographerRiskEvidence: {
      ...evidence(
        "The fixed direct-own-work record binds Amin Eshaiker to the Amineshaker uploader for a public interview stage; low-risk classification remains distinct from clearance.",
        jaysonUrls,
      ),
      category: "independent-public-event-low-risk",
      residualRisk,
    },
    rightsAttribution: {
      adapterLicense: { ...ccBySa4 },
      alterationState: {
        disclosure:
          "Source-disclosed ArcSoft Photostudio 5.5 color-balance, saturation, brightness, and contrast edits; unmodified local original with site CSS presentation crop.",
        presentation: "css-object-fit-cover-crop",
      },
      copyrightNotice: { ...noNotice },
      disclaimerNotice: { ...noNotice },
      licenseBucket: "cc-by-sa",
      otherPerFileNotice: { ...noNotice },
      workTitle: {
        evidence:
          "The fixed Commons record supplies no distinct work title beyond filename/ObjectName metadata.",
        evidenceUrl: jaysonRevision,
        status: "not-supplied",
        text: null,
      },
    },
    sourceRevision: {
      checkedAt,
      id: 756925233,
      permalink: jaysonRevision,
      timestamp: "2023-05-01T03:06:22Z",
      title: "File:2018 NBA All-Star Weekend - Jayson Tatum.jpg",
    },
    sourceRiskClassification: {
      category: "non-event-low-risk",
      nonClearanceStatement,
    },
    supersession: {
      previousLocalFilePath: "src/assets/players/decision-13/jayson-tatum.svg",
      previousLocalFileSha256:
        "793a0aeb4f815a5e2c03340613e8646e92d8aacb4290164ffea2abe701280ade",
      reason: "replaces-current-svg-after-v6-non-event-qualification",
    },
    uploaderIdentity: {
      evidence: evidence(
        "The fixed Commons record links Amin Eshaiker as author to the Amineshaker original uploader and declares direct own work; no uploader-only maker inference is used.",
        jaysonUrls,
      ),
      name: "Amineshaker",
      relationshipToPhotographer: "same-person-evidenced",
    },
    upstreamOriginal: {
      evidence:
        "The fixed Commons record declares direct own work and supplies no separate upstream original page.",
      status: "not-supplied",
      url: null,
    },
  },
};

const predecessorBytes = readFileSync(
  resolve(root, PLAYER_PHOTO_REGISTRY_V5_PATH),
  "utf8",
);
if (sha256Hex(predecessorBytes) !== PLAYER_PHOTO_REGISTRY_V5_SHA256) {
  throw new Error("Frozen player-photo registry v5 bytes changed");
}
const predecessor = parseStrictJson(predecessorBytes) as PlayerPhotoRegistryV5;

const registry: PlayerPhotoRegistryV6 = {
  predecessorRegistryBinding: { ...PLAYER_PHOTO_REGISTRY_V6_PREDECESSOR },
  schemaVersion: 6,
  scopeId: PLAYER_PHOTO_REGISTRY_V6_SCOPE_ID,
  selections: predecessor.selections.map(
    (selection) => adoptedSelections[selection.athleteName] ?? selection,
  ),
  sourcePolicyBinding: {
    jsonPath: PLAYER_PHOTO_POLICY_V7_JSON_PATH,
    jsonSha256: PLAYER_PHOTO_POLICY_V7_JSON_SHA256,
    markdownPath: PLAYER_PHOTO_POLICY_V7_MARKDOWN_PATH,
    markdownSha256: PLAYER_PHOTO_POLICY_V7_MARKDOWN_SHA256,
    sourcePolicyVersion: "nba-v7",
  },
};

const outputBytes = canonicalJson(registry);
if (process.argv.includes("--check")) {
  if (
    readFileSync(resolve(root, PLAYER_PHOTO_REGISTRY_V6_PATH), "utf8") !==
    outputBytes
  ) {
    throw new Error("Generated player-photo registry v6 bytes are stale");
  }
  console.log(`player-photo registry v6 OK — ${sha256Hex(outputBytes)}`);
} else if (process.argv.includes("--stdout")) {
  process.stdout.write(outputBytes);
} else {
  writeFileSync(resolve(root, PLAYER_PHOTO_REGISTRY_V6_PATH), outputBytes);
}
