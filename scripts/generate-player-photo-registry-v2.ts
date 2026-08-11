/** Generates the append-only Decision 11 attribution-complete photo registry. */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const previousRegistryPath = "src/assets/players/player-photo-registry.v1.json";
const outputPath = "src/assets/players/player-photo-registry.v2.json";
const policyJsonPath = "research/source-policy/source-policy.v4.json";
const policyMarkdownPath = "research/source-policy/nba.v4.md";
const checkedAt = "2026-08-12";

interface AuditRow {
  alterationEvidence: string;
  commonsFileStatus: "cropped" | "no-crop-declared";
  copyrightNotice: string | null;
  disclaimerNotice: string | null;
  otherPerFileNotice: string | null;
  revisionId: number;
  revisionPermalink: string;
  revisionTimestamp: string;
  revisionTitle: string;
  titleEvidence: string;
  titleEvidenceUrl: string;
  workTitle: string | null;
}

const audits = {
  "Anfernee Simons": {
    alterationEvidence:
      "Commons history records a CropTool precise derivative (44% horizontal and 11% vertical crop); site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: null,
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 827612495,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AAnferneeSimons_%28cropped%29.jpg&oldid=827612495",
    revisionTimestamp: "2023-12-03T18:11:38Z",
    revisionTitle: "File:AnferneeSimons (cropped).jpg",
    titleEvidence:
      "No distinct title field was supplied; ObjectName mirrors the MediaWiki filename and the description is narrative metadata.",
    titleEvidenceUrl:
      "https://commons.wikimedia.org/w/index.php?title=File%3AAnferneeSimons_%28cropped%29.jpg&oldid=827612495",
    workTitle: null,
  },
  "Anthony Edwards": {
    alterationEvidence:
      "Commons history records a CropTool precise derivative (70% horizontal and 58% vertical crop); site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: null,
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1258083226,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AAnthony_Edwards_Kentavious_Caldwell-Pope_%2851734745028%29_%28cropped%29.jpg&oldid=1258083226",
    revisionTimestamp: "2026-08-07T23:17:26Z",
    revisionTitle:
      "File:Anthony Edwards Kentavious Caldwell-Pope (51734745028) (cropped).jpg",
    titleEvidence:
      "The original Flickr source linked by Commons supplies the title MCP_35.",
    titleEvidenceUrl: "https://www.flickr.com/photos/joeglo/51734745028/",
    workTitle: "MCP_35",
  },
  "Brandon Clarke": {
    alterationEvidence:
      "Commons history does not declare a crop; the linked Flickr source is currently unavailable, and site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "no-crop-declared",
    copyrightNotice: null,
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1214520256,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ABrandon_Clarke_in_2020.jpg&oldid=1214520256",
    revisionTimestamp: "2026-05-15T18:58:40Z",
    revisionTitle: "File:Brandon Clarke in 2020.jpg",
    titleEvidence:
      "No distinct title is supplied by the Commons revision, and the linked Flickr page and oEmbed endpoint are currently unavailable.",
    titleEvidenceUrl:
      "https://commons.wikimedia.org/w/index.php?title=File%3ABrandon_Clarke_in_2020.jpg&oldid=1214520256",
    workTitle: null,
  },
  "CJ McCollum": {
    alterationEvidence:
      "Commons history records a CropTool precise derivative (79% horizontal, 60% vertical, and 91% area crop); site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: "Erik Drost",
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1183315853,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ACJ_McCollum_%2851915243981%29_%28cropped%29.jpg&oldid=1183315853",
    revisionTimestamp: "2026-03-19T00:58:37Z",
    revisionTitle: "File:CJ McCollum (51915243981) (cropped).jpg",
    titleEvidence:
      "The Commons source label and linked original Flickr metadata both supply CJ McCollum.",
    titleEvidenceUrl: "https://www.flickr.com/photos/edrost88/51915243981/",
    workTitle: "CJ McCollum",
  },
  "Damian Lillard": {
    alterationEvidence:
      "Commons history records a CropTool lossless derivative (65% horizontal and vertical crop); site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: "Erik Drost",
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1164388372,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ADamian_Lillard_%282021%29_%28cropped%29.jpg&oldid=1164388372",
    revisionTimestamp: "2026-02-12T16:53:41Z",
    revisionTitle: "File:Damian Lillard (2021) (cropped).jpg",
    titleEvidence:
      "The Commons source label and linked original Flickr metadata both supply Damian Lillard.",
    titleEvidenceUrl: "https://www.flickr.com/photos/edrost88/51658684394/",
    workTitle: "Damian Lillard",
  },
  "Danny Green": {
    alterationEvidence:
      "Commons history records a recrop from the high-resolution original; site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: null,
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1223550468,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ADanny_Green_2023_Cleveland_Cavaliers_vs._New_York_Knicks.jpg&oldid=1223550468",
    revisionTimestamp: "2026-05-31T16:16:46Z",
    revisionTitle:
      "File:Danny Green 2023 Cleveland Cavaliers vs. New York Knicks.jpg",
    titleEvidence:
      "The original Flickr source linked by Commons supplies Cleveland Cavaliers vs. New York Knicks.",
    titleEvidenceUrl: "https://www.flickr.com/photos/edrost88/52977026044/",
    workTitle: "Cleveland Cavaliers vs. New York Knicks",
  },
  "Dejounte Murray": {
    alterationEvidence:
      "Commons history records two CropTool precise operations, first cropping the multiplayer original and then cropping another 5% horizontally; site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: "Erik Drost",
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 912383643,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ADejounte_Murray_2022.jpg&oldid=912383643",
    revisionTimestamp: "2024-08-19T16:17:38Z",
    revisionTitle: "File:Dejounte Murray 2022.jpg",
    titleEvidence:
      "The Commons source label and linked original Flickr metadata supply the spelling Steph Curry, LaMelo Ball, and Dejonte Murray.",
    titleEvidenceUrl: "https://www.flickr.com/photos/edrost88/51914964342/",
    workTitle: "Steph Curry, LaMelo Ball, and Dejonte Murray",
  },
  "Dwight Powell": {
    alterationEvidence:
      "Commons history contains the original upload and no declared CropTool derivative; site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "no-crop-declared",
    copyrightNotice: "Sandro Halank, CC BY-SA 4.0",
    disclaimerNotice: null,
    otherPerFileNotice: "Personality rights warning",
    revisionId: 967381398,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93021.jpg&oldid=967381398",
    revisionTimestamp: "2024-12-07T23:52:52Z",
    revisionTitle:
      "File:2023-08-09 Deutschland gegen Kanada (Basketball-Länderspiel) by Sandro Halank–021.jpg",
    titleEvidence:
      "Embedded ObjectName and ImageDescription supply Basketball-Länderspiel: Deutschland gegen Kanada.",
    titleEvidenceUrl:
      "https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93021.jpg&oldid=967381398",
    workTitle: "Basketball-Länderspiel: Deutschland gegen Kanada",
  },
  "Ja Morant": {
    alterationEvidence:
      "Commons history records a CropTool derivative (76% horizontal and 75% vertical crop); site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: null,
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1092053012,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AJa_Morant_2021.jpg&oldid=1092053012",
    revisionTimestamp: "2025-09-28T10:50:25Z",
    revisionTitle: "File:Ja Morant 2021.jpg",
    titleEvidence:
      "The original Flickr source linked by Commons supplies the title photo_42.",
    titleEvidenceUrl: "https://www.flickr.com/photos/joeglo/51664923611/",
    workTitle: "photo_42",
  },
  "Jayson Tatum": {
    alterationEvidence:
      "Commons history records a derivative crop followed by a further 9% vertical/area crop; site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: null,
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1086996816,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ACeltics_at_Wizards_2024-12-044_%28cropped_2%29.jpg&oldid=1086996816",
    revisionTimestamp: "2025-09-17T16:44:42Z",
    revisionTitle: "File:Celtics at Wizards 2024-12-044 (cropped 2).jpg",
    titleEvidence:
      "No distinct title field is supplied; ObjectName mirrors the filename and Information supplies the game description only.",
    titleEvidenceUrl:
      "https://commons.wikimedia.org/w/index.php?title=File%3ACeltics_at_Wizards_2024-12-044_%28cropped_2%29.jpg&oldid=1086996816",
    workTitle: null,
  },
  "Joe Ingles": {
    alterationEvidence:
      "Commons history records a 68% horizontal/6% vertical crop and a later revision described as cropped more; site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: null,
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 877365146,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AJoe_Ingles_Utah_%28cropped%29.jpg&oldid=877365146",
    revisionTimestamp: "2024-05-18T20:00:27Z",
    revisionTitle: "File:Joe Ingles Utah (cropped).jpg",
    titleEvidence:
      "No distinct title field is supplied; ObjectName mirrors the filename and Information supplies a description only.",
    titleEvidenceUrl:
      "https://commons.wikimedia.org/w/index.php?title=File%3AJoe_Ingles_Utah_%28cropped%29.jpg&oldid=877365146",
    workTitle: null,
  },
  "Kevin Durant": {
    alterationEvidence:
      "Commons history records a CropTool derivative (20% horizontal, 20% vertical, and 36% area crop); site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: null,
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1222154671,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AKevin_Durant%2C_Paris_2024_%28cropped%29.jpg&oldid=1222154671",
    revisionTimestamp: "2026-05-29T09:31:57Z",
    revisionTitle: "File:Kevin Durant, Paris 2024 (cropped).jpg",
    titleEvidence:
      "No distinct title field is supplied; ObjectName mirrors the filename and Information supplies a description only.",
    titleEvidenceUrl:
      "https://commons.wikimedia.org/w/index.php?title=File%3AKevin_Durant%2C_Paris_2024_%28cropped%29.jpg&oldid=1222154671",
    workTitle: null,
  },
  "Kyrie Irving": {
    alterationEvidence:
      "Commons history records a CropTool derivative (52% horizontal, 54% vertical, and 78% area crop); site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: "Erik Drost",
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1196336722,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AKyrie_Irving_%2851830909437%29_%28cropped%29.jpg&oldid=1196336722",
    revisionTimestamp: "2026-04-12T20:24:18Z",
    revisionTitle: "File:Kyrie Irving (51830909437) (cropped).jpg",
    titleEvidence:
      "The Commons source label and linked original Flickr metadata both supply Kyrie Irving.",
    titleEvidenceUrl:
      "https://commons.wikimedia.org/w/index.php?title=File%3AKyrie_Irving_%2851830909437%29_%28cropped%29.jpg&oldid=1196336722",
    workTitle: "Kyrie Irving",
  },
  "LaMelo Ball": {
    alterationEvidence:
      "Commons history records a CropTool derivative (71% horizontal and 41% vertical crop); site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: "Erik Drost",
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1130229739,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ALaMelo_Ball_%28cropped%29.jpg&oldid=1130229739",
    revisionTimestamp: "2025-12-13T07:33:56Z",
    revisionTitle: "File:LaMelo Ball (cropped).jpg",
    titleEvidence: "The linked original Flickr metadata supplies LaMelo Ball.",
    titleEvidenceUrl: "https://www.flickr.com/photos/edrost88/51916059508/",
    workTitle: "LaMelo Ball",
  },
  "LeBron James": {
    alterationEvidence:
      "Commons identifies an extraction and records a further CropTool crop (6% horizontal and 42% vertical); site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: "Erik Drost",
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1251946740,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ALeBron_James_%2851959977144%29_%28cropped2%29.jpg&oldid=1251946740",
    revisionTimestamp: "2026-07-25T16:09:07Z",
    revisionTitle: "File:LeBron James (51959977144) (cropped2).jpg",
    titleEvidence:
      "The current linked original Flickr page supplies LeBron James.",
    titleEvidenceUrl: "https://www.flickr.com/photos/edrost88/51959977144/",
    workTitle: "LeBron James",
  },
  "Markelle Fultz": {
    alterationEvidence:
      "Commons history records a Flickr transfer with no declared Commons crop; site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "no-crop-declared",
    copyrightNotice: null,
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1130452222,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AMarkelle_Fultz_%2850639078246%29.jpg&oldid=1130452222",
    revisionTimestamp: "2025-12-13T16:58:30Z",
    revisionTitle: "File:Markelle Fultz (50639078246).jpg",
    titleEvidence:
      "The Commons Information source link supplies Markelle Fultz; the original Flickr page is currently unavailable.",
    titleEvidenceUrl:
      "https://commons.wikimedia.org/w/index.php?title=File%3AMarkelle_Fultz_%2850639078246%29.jpg&oldid=1130452222",
    workTitle: "Markelle Fultz",
  },
  "Moritz Wagner": {
    alterationEvidence:
      "Commons history contains the original upload and no declared crop or extraction; site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "no-crop-declared",
    copyrightNotice: "Sandro Halank, CC BY-SA 4.0",
    disclaimerNotice: null,
    otherPerFileNotice: "Personality rights warning",
    revisionId: 967382118,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93145.jpg&oldid=967382118",
    revisionTimestamp: "2024-12-07T23:55:17Z",
    revisionTitle:
      "File:2023-08-09 Deutschland gegen Kanada (Basketball-Länderspiel) by Sandro Halank–145.jpg",
    titleEvidence:
      "Embedded ObjectName and ImageDescription supply Basketball-Länderspiel: Deutschland gegen Kanada.",
    titleEvidenceUrl:
      "https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93145.jpg&oldid=967382118",
    workTitle: "Basketball-Länderspiel: Deutschland gegen Kanada",
  },
  "Ricky Rubio": {
    alterationEvidence:
      "Commons identifies an extraction and records a CropTool crop (42% horizontal and 44% vertical); site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: "Erik Drost",
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1079717911,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ARicky_Rubio_%2851657225617%29_%28cropped%29.jpg&oldid=1079717911",
    revisionTimestamp: "2025-09-01T14:48:16Z",
    revisionTitle: "File:Ricky Rubio (51657225617) (cropped).jpg",
    titleEvidence:
      "The current linked original Flickr page supplies Ricky Rubio.",
    titleEvidenceUrl: "https://www.flickr.com/photos/edrost88/51657225617/",
    workTitle: "Ricky Rubio",
  },
  "Thomas Bryant": {
    alterationEvidence:
      "Commons history does not identify a crop and records replacement with the original Flickr image; site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "no-crop-declared",
    copyrightNotice: "ALL-PRO REELS",
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1171979953,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AThomas_Bryant_WSH_Wizards_2022.jpg&oldid=1171979953",
    revisionTimestamp: "2026-02-26T00:25:47Z",
    revisionTitle: "File:Thomas Bryant WSH Wizards 2022.jpg",
    titleEvidence:
      "The current linked original Flickr title and embedded IPTC Headline both supply Wizards vs. Clippers.",
    titleEvidenceUrl: "https://www.flickr.com/photos/joeglo/51847435367/",
    workTitle: "Wizards vs. Clippers",
  },
  "Trae Young": {
    alterationEvidence:
      "Commons identifies an extraction and records a 23% horizontal CropTool crop; site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: "Erik Drost",
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1148485505,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ATrae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg&oldid=1148485505",
    revisionTimestamp: "2026-01-16T19:13:29Z",
    revisionTitle: "File:Trae Young (2022 All-Star Weekend) (cropped).jpg",
    titleEvidence:
      "The current linked original Flickr page supplies Trae Young.",
    titleEvidenceUrl: "https://www.flickr.com/photos/edrost88/51915140944/",
    workTitle: "Trae Young",
  },
  "Tyrese Haliburton": {
    alterationEvidence:
      "Commons identifies an extraction and records a CropTool derivative (68% horizontal, 50% vertical, and 84% area crop); site rendering adds a CSS object-fit crop.",
    commonsFileStatus: "cropped",
    copyrightNotice: null,
    disclaimerNotice: null,
    otherPerFileNotice: null,
    revisionId: 1202611768,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3A1_tyrese_haliburton_2025_%28cropped_2%29.jpg&oldid=1202611768",
    revisionTimestamp: "2026-04-24T03:36:57Z",
    revisionTitle: "File:1 tyrese haliburton 2025 (cropped 2).jpg",
    titleEvidence:
      "No separately supplied title was found; MediaWiki ObjectName reproduces the filename and was not promoted into a title.",
    titleEvidenceUrl:
      "https://commons.wikimedia.org/w/index.php?title=File%3A1_tyrese_haliburton_2025_%28cropped_2%29.jpg&oldid=1202611768",
    workTitle: null,
  },
} satisfies Record<string, AuditRow>;
const auditsByAthlete: Record<string, AuditRow> = audits;

const previousRegistryBytes = readFileSync(
  resolve(root, previousRegistryPath),
  "utf8",
);
const previous = parseStrictJson(previousRegistryBytes) as {
  assets: Array<
    Record<string, unknown> & {
      athleteName: string;
      license: { name: string; token: string; url: string };
    }
  >;
  fallbacks: unknown[];
  scopeId: string;
};
const policyJsonBytes = readFileSync(resolve(root, policyJsonPath), "utf8");
const policyMarkdownBytes = readFileSync(
  resolve(root, policyMarkdownPath),
  "utf8",
);

const seen = new Set<string>();
const assets = previous.assets.map((asset) => {
  const audit = auditsByAthlete[asset.athleteName];
  if (audit === undefined) {
    throw new Error(
      `Missing Decision 11 attribution audit: ${asset.athleteName}`,
    );
  }
  seen.add(asset.athleteName);
  const licenseBucket = asset.license.token.startsWith("cc-by-sa-")
    ? "cc-by-sa"
    : asset.license.token.startsWith("cc-by-")
      ? "cc-by"
      : asset.license.token === "cc0-1.0"
        ? "cc0"
        : null;
  if (licenseBucket === null) {
    throw new Error(`Unsupported current license: ${asset.license.token}`);
  }
  const notice = (text: string | null) => ({
    status: text === null ? "not-supplied" : "supplied",
    text,
    url: text === null ? null : audit.revisionPermalink,
  });
  return {
    ...asset,
    rightsAttribution: {
      adapterLicense:
        licenseBucket === "cc-by-sa" ? { ...asset.license } : null,
      alterationState: {
        commonsFileStatus: audit.commonsFileStatus,
        evidence: audit.alterationEvidence,
        sitePresentation: "css-object-fit-cover-crop",
      },
      copyrightNotice: notice(audit.copyrightNotice),
      disclaimerNotice: notice(audit.disclaimerNotice),
      licenseBucket,
      otherPerFileNotice: notice(audit.otherPerFileNotice),
      sourceRevision: {
        checkedAt,
        id: audit.revisionId,
        permalink: audit.revisionPermalink,
        timestamp: audit.revisionTimestamp,
        title: audit.revisionTitle,
      },
      workTitle: {
        evidence: audit.titleEvidence,
        evidenceUrl: audit.titleEvidenceUrl,
        status: audit.workTitle === null ? "not-supplied" : "supplied",
        text: audit.workTitle,
      },
    },
    sourcePolicyBinding: {
      jsonPath: policyJsonPath,
      jsonSha256: sha256Hex(policyJsonBytes),
      markdownPath: policyMarkdownPath,
      markdownSha256: sha256Hex(policyMarkdownBytes),
      sourcePolicyVersion: "nba-v4",
    },
  };
});

const unexpected = Object.keys(audits).filter((name) => !seen.has(name));
if (unexpected.length > 0) {
  throw new Error(
    `Attribution audits do not match v1 athletes: ${unexpected.join(", ")}`,
  );
}

const registry = {
  assets,
  fallbacks: previous.fallbacks,
  previousRegistryBinding: {
    path: previousRegistryPath,
    schemaVersion: 1,
    sha256: sha256Hex(previousRegistryBytes),
  },
  schemaVersion: 2,
  scopeId: previous.scopeId,
};

writeFileSync(resolve(root, outputPath), canonicalJson(registry));
