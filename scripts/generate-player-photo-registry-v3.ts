/** Generates the append-only Decision 11 source-risk photo registry. */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import {
  PLAYER_PHOTO_SOURCE_RISK_CHECKED_AT,
  PLAYER_PHOTO_SOURCE_RISK_DISCLAIMER,
  type PlayerPhotoRegistryV2,
  type PlayerPhotoSourceRiskCategory,
} from "../src/lib/contracts/player-photo";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const previousRegistryPath = "src/assets/players/player-photo-registry.v2.json";
const outputPath = "src/assets/players/player-photo-registry.v3.json";
const expectedPreviousRegistrySha256 =
  "0fa9a14660d798b32586047eaec1a0fc14912ca8710aaccc83963ac4f9dc28d0";

interface RiskAuditRow {
  basis: string;
  category: PlayerPhotoSourceRiskCategory;
  sourceRevisionPermalink: string;
}

const riskAudits = {
  "Anfernee Simons": {
    basis:
      "The fixed Commons revision identifies a Portland-Sacramento regular-season game and a pregame warm-up inside that NBA event; it is not preseason-only context and remains fail-closed Flickr-washing risk.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AAnferneeSimons_%28cropped%29.jpg&oldid=827612495",
  },
  "Anthony Edwards": {
    basis:
      "The fixed Commons revision identifies the December 1, 2021 Minnesota-at-Washington NBA game and depicts Edwards in official game uniform on court.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AAnthony_Edwards_Kentavious_Caldwell-Pope_%2851734745028%29_%28cropped%29.jpg&oldid=1258083226",
  },
  "Brandon Clarke": {
    basis:
      "The fixed Commons revision says the photograph was made during the February 9, 2020 Memphis-at-Washington basketball game inside Capital One Arena.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ABrandon_Clarke_in_2020.jpg&oldid=1214520256",
  },
  "CJ McCollum": {
    basis:
      "The fixed Commons revision places the photograph at the 2022 NBA All-Star event and categorizes the depicted moment as a jump shot with ball and official uniform.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ACJ_McCollum_%2851915243981%29_%28cropped%29.jpg&oldid=1183315853",
  },
  "Damian Lillard": {
    basis:
      "The fixed Commons revision identifies the November 3, 2021 Portland-at-Cleveland NBA game and depicts Lillard in official game uniform.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ADamian_Lillard_%282021%29_%28cropped%29.jpg&oldid=1164388372",
  },
  "Danny Green": {
    basis:
      "The fixed Commons revision identifies the April 26, 2023 New York-at-Cleveland NBA event and depicts Green in official game uniform on court.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ADanny_Green_2023_Cleveland_Cavaliers_vs._New_York_Knicks.jpg&oldid=1223550468",
  },
  "Dejounte Murray": {
    basis:
      "The fixed Commons revision places the photograph at the 2022 NBA All-Star event and depicts Murray in official All-Star game uniform on court.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ADejounte_Murray_2022.jpg&oldid=912383643",
  },
  "Dwight Powell": {
    basis:
      "The fixed Commons revision identifies a national-team preparation match, while the image depicts Powell in pregame warm-up clothing rather than live game action; this is lower-risk warm-up context.",
    category: "non-event-low-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93021.jpg&oldid=967381398",
  },
  "Ja Morant": {
    basis:
      "The fixed Commons revision identifies the November 5, 2021 Washington-Memphis NBA game and depicts Morant in official game uniform on court.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AJa_Morant_2021.jpg&oldid=1092053012",
  },
  "Jayson Tatum": {
    basis:
      "The fixed Commons revision identifies Boston's 112-98 game at Washington on December 15, 2024 and depicts Tatum in official game uniform.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ACeltics_at_Wizards_2024-12-044_%28cropped_2%29.jpg&oldid=1086996816",
  },
  "Joe Ingles": {
    basis:
      "The fixed Commons revision identifies Utah at Portland on October 7, 2018; the image depicts Ingles in official game uniform with another on-court player, and no source evidence establishes a warm-up or other non-event setting.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AJoe_Ingles_Utah_%28cropped%29.jpg&oldid=877365146",
  },
  "Kevin Durant": {
    basis:
      "The fixed Commons revision places Durant in United States national-team competition at the Paris 2024 Olympic Games, an accredited game-event context.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AKevin_Durant%2C_Paris_2024_%28cropped%29.jpg&oldid=1222154671",
  },
  "Kyrie Irving": {
    basis:
      "The fixed Commons revision identifies the January 17, 2022 Brooklyn-at-Cleveland NBA game and depicts Irving in team event apparel on court.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AKyrie_Irving_%2851830909437%29_%28cropped%29.jpg&oldid=1196336722",
  },
  "LaMelo Ball": {
    basis:
      "The fixed Commons revision explicitly identifies the 2022 NBA All-Star Game and depicts Ball in official game uniform with the basketball.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ALaMelo_Ball_%28cropped%29.jpg&oldid=1130229739",
  },
  "LeBron James": {
    basis:
      "The fixed Commons revision identifies the March 21, 2022 Lakers-at-Cleveland NBA game and depicts James in official game uniform with the basketball.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ALeBron_James_%2851959977144%29_%28cropped2%29.jpg&oldid=1251946740",
  },
  "Markelle Fultz": {
    basis:
      "The fixed Commons revision identifies the December 3, 2019 Washington-Orlando NBA game and depicts Fultz in official game uniform on court.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AMarkelle_Fultz_%2850639078246%29.jpg&oldid=1130452222",
  },
  "Moritz Wagner": {
    basis:
      "The fixed Commons revision identifies the scored Germany-Canada preparation match, and the image depicts Wagner in official national-team uniform during live play rather than warm-up.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93145.jpg&oldid=967382118",
  },
  "Ricky Rubio": {
    basis:
      "The fixed Commons revision identifies the November 3, 2021 Portland-at-Cleveland NBA game; although photographed before tip-off, it is a regular-season event rather than preseason context.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ARicky_Rubio_%2851657225617%29_%28cropped%29.jpg&oldid=1079717911",
  },
  "Thomas Bryant": {
    basis:
      "The fixed Commons revision identifies the January 25, 2022 Clippers-at-Washington NBA game and depicts Bryant in official team event apparel on court.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AThomas_Bryant_WSH_Wizards_2022.jpg&oldid=1171979953",
  },
  "Trae Young": {
    basis:
      "The fixed Commons revision identifies the public-facing 2022 NBA All-Star Weekend on February 19 rather than the February 20 All-Star Game; this is lower-risk public-event context.",
    category: "non-event-low-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ATrae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg&oldid=1148485505",
  },
  "Tyrese Haliburton": {
    basis:
      "The fixed Commons revision identifies the March 28, 2025 Indiana-at-Washington NBA setting and depicts Haliburton in official game uniform on court.",
    category: "game-action-high-risk",
    sourceRevisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3A1_tyrese_haliburton_2025_%28cropped_2%29.jpg&oldid=1202611768",
  },
} satisfies Record<string, RiskAuditRow>;

const previousRegistryBytes = readFileSync(
  resolve(root, previousRegistryPath),
  "utf8",
);
if (sha256Hex(previousRegistryBytes) !== expectedPreviousRegistrySha256) {
  throw new Error("Frozen player-photo registry v2 bytes changed");
}
const previous = parseStrictJson(
  previousRegistryBytes,
) as PlayerPhotoRegistryV2;

const seen = new Set<string>();
const assets = previous.assets.map((asset) => {
  const audit = riskAudits[asset.athleteName as keyof typeof riskAudits];
  if (audit === undefined) {
    throw new Error(
      `Missing Decision 11 source-risk audit: ${asset.athleteName}`,
    );
  }
  if (
    audit.sourceRevisionPermalink !==
    asset.rightsAttribution.sourceRevision.permalink
  ) {
    throw new Error(
      `Source-risk oldid does not match the frozen v2 rights record: ${asset.athleteName}`,
    );
  }
  seen.add(asset.athleteName);
  return {
    ...asset,
    sourceRiskClassification: {
      basis: `${audit.basis} ${PLAYER_PHOTO_SOURCE_RISK_DISCLAIMER}`,
      category: audit.category,
      checkedAt: PLAYER_PHOTO_SOURCE_RISK_CHECKED_AT,
      sourceRevisionPermalink: audit.sourceRevisionPermalink,
    },
  };
});

const unexpected = Object.keys(riskAudits).filter((name) => !seen.has(name));
if (unexpected.length > 0) {
  throw new Error(
    `Source-risk audits do not match v2 athletes: ${unexpected.join(", ")}`,
  );
}

const registry = {
  assets,
  fallbacks: previous.fallbacks,
  previousRegistryBinding: {
    path: previousRegistryPath,
    schemaVersion: 2,
    sha256: sha256Hex(previousRegistryBytes),
  },
  schemaVersion: 3,
  scopeId: previous.scopeId,
};
const outputBytes = canonicalJson(registry);

if (process.argv.includes("--check")) {
  if (readFileSync(resolve(root, outputPath), "utf8") !== outputBytes) {
    throw new Error("Generated player-photo registry v3 bytes are stale");
  }
  console.log(`player-photo registry v3 OK — ${sha256Hex(outputBytes)}`);
} else if (process.argv.includes("--stdout")) {
  process.stdout.write(outputBytes);
} else {
  writeFileSync(resolve(root, outputPath), outputBytes);
}
