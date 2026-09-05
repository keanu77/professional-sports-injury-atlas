/**
 * Fail closed if any Decision 13 approved clinical input changes by one byte.
 *
 * The frozen set is intentionally explicit: 26 approved cases, three injury
 * overviews, and the current quarterly update at the authorized start commit.
 * Notice and cover work may change presentation code, but never these bytes.
 */

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { sha256Hex } from "../src/lib/contracts/canonical";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

export const DECISION_13_CLINICAL_FREEZE = [
  [
    "src/content/cases/anfernee-simons-ankle-sprain-2023.json",
    "ad0867eb761b1022349b672611cba9bff2591a670a441851b46baeb376fd655c",
  ],
  [
    "src/content/cases/anthony-edwards-ankle-sprain-2023.json",
    "c3658572ab987ba166550afe54b76cf916bcaac9228c7eb08a4b86a962662623",
  ],
  [
    "src/content/cases/anthony-edwards-ankle-sprain-2025.json",
    "d9bd03d8ec6c74c4c8c2a6a802156051ca3a5c999ef87e9cc5f09036d3fe20ed",
  ],
  [
    "src/content/cases/brandon-clarke-achilles-rupture-2023.json",
    "c06df42c4470b2e13a517b2aab82d1cbe91aec9b487318c6c6f6419150e46168",
  ],
  [
    "src/content/cases/cj-mccollum-ankle-sprain-2020.json",
    "1ecae81a15f6134cfb6f7bc7e8a8a1d79f193126d20196042f8d2bd6d9c409b6",
  ],
  [
    "src/content/cases/damian-lillard-achilles-rupture-2025.json",
    "8ce887e115f8dba7225f541cf10b5c7bbccb72d17f55bb8fdae2165c6053d805",
  ],
  [
    "src/content/cases/danny-green-acl-2022.json",
    "7b30db5ab896ab00c6f81efdda1a835aba2111eed78d97e20089628a81d5a9f9",
  ],
  [
    "src/content/cases/dejounte-murray-achilles-rupture-2025.json",
    "745ec2361c8e3d5a23160628ed1a01a0b5a5706ba0dc208aa6c72bea0df5a7a5",
  ],
  [
    "src/content/cases/dwight-powell-achilles-rupture-2020.json",
    "347d8e149e499eee9f3f627efa079fd6d1e0c0392973dc98052a510d67539996",
  ],
  [
    "src/content/cases/ja-morant-ankle-sprain-2020.json",
    "72f3679b0f5ba91fb65a30b63194e916b65640a6abdbfb04b5a701d43f17742c",
  ],
  [
    "src/content/cases/jayson-tatum-achilles-rupture-2025.json",
    "92f41beb8e9819f97319c273e6899140c9453957a1ede8c63f456772d6a55c47",
  ],
  [
    "src/content/cases/joe-ingles-acl-2022.json",
    "298dc63f859030836e163fe1343e6b9efab1637b4bcd506159ecde0a9b020383",
  ],
  [
    "src/content/cases/kevin-durant-achilles-rupture-2019.json",
    "85fad7db7ee71658e74833a9f6220c6c614d3024f0bc6c24f11c6a84cd0d7824",
  ],
  [
    "src/content/cases/kevin-durant-ankle-sprain-2024.json",
    "2403c1427a7796f6c2c1f506ffb7930d657a93b7baeab73b9fcd2854f961f05e",
  ],
  [
    "src/content/cases/kyrie-irving-acl-2025.json",
    "d67fd06108d8994d7d923e1c0de9bd4e2522bda29da3e59b32c7452d39fe868d",
  ],
  [
    "src/content/cases/kyrie-irving-ankle-sprain-2021.json",
    "0589174cf2b6235cb16c15c6cee0f56da92bc1f60f06ca5b4df4ad09680344e6",
  ],
  [
    "src/content/cases/lamelo-ball-ankle-sprain-2022.json",
    "c40c4dfc1c663f4477491731ea2b9af885f4a4070ba4d67aefb3823a22aee9d5",
  ],
  [
    "src/content/cases/lamelo-ball-ankle-sprain-2023.json",
    "0b594716f6eab358a0d9fc297655c8274ee409bebad4d4ec34d9b43deaf1744d",
  ],
  [
    "src/content/cases/lamelo-ball-ankle-sprain-2025.json",
    "9f787d71fb6b06e14eb14e9d1bf1fea8025fe5ab9720f9f3717533e1de8a75f6",
  ],
  [
    "src/content/cases/lebron-james-ankle-sprain-2021.json",
    "e8316dd3bb58ababfaa6fe19c05d75aaac7934918deb5fc82118d86cff62e2ac",
  ],
  [
    "src/content/cases/markelle-fultz-acl-2021.json",
    "d210dec9e1a0fd59d36a58648e0c3dcb7dc1f8df9ceaf119951e2abf05d762f0",
  ],
  [
    "src/content/cases/moritz-wagner-acl-2024.json",
    "43f58a0b7f3965a0da031be9ef9275ba0c89713c35543e000a9071a8ed34f12b",
  ],
  [
    "src/content/cases/ricky-rubio-acl-2021.json",
    "270e2589d16d757d515dd4285dd9d6ea0688d0e7291e039e462bc0c0dba5cc7d",
  ],
  [
    "src/content/cases/thomas-bryant-acl-2021.json",
    "a0e6b53e0ca73cbb5e0f116693b889aaa9d7d3e84730116a10d67dc57bb3fb72",
  ],
  [
    "src/content/cases/trae-young-ankle-sprain-2021.json",
    "831f40ca5cf659e98b0d2d44bf1a24cda5c56cd4dedb7e37f72d6209cb9e63bf",
  ],
  [
    "src/content/cases/tyrese-haliburton-achilles-rupture-2025.json",
    "f56deb443ed9456e0a7afa655d349f827815b5fe677012da6fcc4cc5357873cb",
  ],
  [
    "src/content/injuries/achilles-rupture.json",
    "0ad61708cc2116a668bfc9c19ead49dbd5476453812a8c3216d0229201017138",
  ],
  [
    "src/content/injuries/acl.json",
    "577dd0c5de31ad8084d4e9045decc8d488f8c8f310d00ca5d599eddde9f86903",
  ],
  [
    "src/content/injuries/ankle-sprain.json",
    "9d3a9c7f6d7a01684ea488cf75dee7b6cc6e085750907ca9d0563c5cf8103e5b",
  ],
  [
    "src/content/updates/2026-q3.json",
    "ddf04e5aee0cac066d245534f0d004107cd4aafb0dc792f16032244ee8a30021",
  ],
] as const;

export const DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256 =
  "bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73";

function actualClinicalPaths(): string[] {
  return [
    ...readdirSync(resolve(root, "src/content/cases"))
      .filter((name) => name.endsWith(".json"))
      .map((name) => `src/content/cases/${name}`),
    ...readdirSync(resolve(root, "src/content/injuries"))
      .filter((name) => name.endsWith(".json"))
      .map((name) => `src/content/injuries/${name}`),
    ...readdirSync(resolve(root, "src/content/updates"))
      .filter((name) => name.endsWith(".json"))
      .map((name) => `src/content/updates/${name}`),
  ].sort();
}

export function verifyDecision13ClinicalFreeze(): void {
  const expectedPaths = DECISION_13_CLINICAL_FREEZE.map(([path]) => path);
  const actualPaths = actualClinicalPaths();
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error(
      `Decision 13 clinical input set changed: expected ${expectedPaths.length}, got ${actualPaths.length}`,
    );
  }

  const digestInput: string[] = [];
  for (const [path, expectedSha256] of DECISION_13_CLINICAL_FREEZE) {
    const actualSha256 = sha256Hex(readFileSync(resolve(root, path)));
    if (actualSha256 !== expectedSha256) {
      throw new Error(
        `Decision 13 clinical byte drift at ${path}: expected ${expectedSha256}, got ${actualSha256}`,
      );
    }
    digestInput.push(`${actualSha256}  ${path}\n`);
  }
  const aggregate = sha256Hex(digestInput.join(""));
  if (aggregate !== DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256) {
    throw new Error(
      `Decision 13 clinical aggregate drift: expected ${DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256}, got ${aggregate}`,
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  verifyDecision13ClinicalFreeze();
  console.log(
    `Decision 13 clinical freeze verified: ${DECISION_13_CLINICAL_FREEZE.length}/30 files (${DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256})`,
  );
}
