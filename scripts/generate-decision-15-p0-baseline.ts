/** Generates the canonical Decision 15 authorized-start baseline. */

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import {
  DECISION_13_CLINICAL_FREEZE,
  DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256,
  verifyDecision13ClinicalFreeze,
} from "./verify-decision-13-clinical-freeze";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputPath =
  "docs/reviews/evidence/decision-15/p0/current-cover-baseline.v1.json";
const authorizedStartCommit = "a184f55e6ed42dbdd7e14214f22761127927365c";

const policyBindings = [
  [
    "nba-v1",
    "f983c682d3504902ff9ae8a57cbd414e4855de2abbb3b6f2855d3532df8fed46",
    "a588b68f3468bec8d24cda9005435ecb0177cc74dbaff7d14f793ec45dcdd280",
  ],
  [
    "nba-v2",
    "b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570",
    "6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07",
  ],
  [
    "nba-v3",
    "7dc98d1146ffe701a312694512bfe513f27d3edb8ecaeeb2f933a92f9fb32ca2",
    "284a88792f281564799eeae6b62646b855072725824ef21f3cea4204a3d14270",
  ],
  [
    "nba-v4",
    "929ac5f125db222d8eb6e98a3a52b1778ebd28c743884c945ab917619ebd5994",
    "3320fe2051fc091aa055d5cdd8bcdacf24073c3964cac3d1a982666a2aafbf68",
  ],
  [
    "nba-v5",
    "a59111d915caeb7f1e8f730492e826be63ff95fb5b1feeb1576eeb75a95e6aae",
    "5f38066ce0ef0c10f0494856f90114dc403c068986b4c323cbb2ef3ebbda56ac",
  ],
  [
    "nba-v6",
    "b9a469344ff5061546619ea0ecbb5b7320965af40cde254d4939cf2e8835b0c1",
    "1e27041de184b7b6397b2cfdde225706b40696f1d4456757193baa340f4cc93c",
  ],
  [
    "nba-v7",
    "61ed88f92d80b77cd2c1410d03305215eedbb391356c073fb19fac944dea2fd1",
    "d1062c1ffa045397d13489319534acbfe24653615df5ce83aac40e40539a8b15",
  ],
  [
    "nba-v8",
    "20a9209bd523604efe3251f6ef159e6432fa9280951ea16d630ee02cc347557d",
    "30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e",
  ],
] as const;

const registryBindings = [
  [1, "770a7e6d7f13ecd0dda17a629b13f179357b9c64ebc268404a5640ad9aa08eec"],
  [2, "0fa9a14660d798b32586047eaec1a0fc14912ca8710aaccc83963ac4f9dc28d0"],
  [3, "d91e97aa34e347375dd5ca14cf961208ae4b2c43cc8a90a01bea49f1172a3c05"],
  [4, "ef7149b57ab5d08a328a0a7ed88177fc4d6a35af998bcfd95a0ec318bcf345b5"],
  [5, "26129455fe5b9297c44ac91c3be1fc1678a928cf77bd12d00695614fe5df3985"],
  [6, "16851aaa3d1dd223f20f102ef543f104a23ee61335a796f4b70cbe75d76d5cf0"],
] as const;

const protectedAthletes = [
  "CJ McCollum",
  "Damian Lillard",
  "Dwight Powell",
  "Jayson Tatum",
  "Kevin Durant",
  "Kyrie Irving",
  "LeBron James",
] as const;

const targetAthletes = [
  "Anfernee Simons",
  "Anthony Edwards",
  "Brandon Clarke",
  "Danny Green",
  "Dejounte Murray",
  "Ja Morant",
  "Joe Ingles",
  "LaMelo Ball",
  "Markelle Fultz",
  "Moritz Wagner",
  "Ricky Rubio",
  "Thomas Bryant",
  "Trae Young",
  "Tyrese Haliburton",
] as const;

const immutableInputs = [
  "docs/superpowers/plans/2026-08-13-decision-15-photo-first-covers.md",
  "docs/decisions/2026-08-13-decision-15-photo-first-covers-authorization.v1.json",
  "docs/decisions/plan-binding.v1.json",
  "docs/reviews/2026-08-13-decision-14-p2-photo-candidate-evidence.md",
  "docs/reviews/2026-08-13-decision-14-p4-final-validation.md",
  "review/review-set.v1.json",
  "review/private-dist-manifest.v1.json",
  "review/served-review-receipt.v1.json",
  "src/data/site-governance.v1.json",
  "ops/private-hosting.v1.json",
  "ops/http-header-policy.v1.json",
  "ops/launchd/tw.sportsmedicine.atlas.private-review.plist.template",
  "docs/reviews/evidence/decision-14/p0/private-service-observation.v1.json",
  "src/components/credits/PhotoCredit.astro",
  "src/lib/rights/photo-credits.ts",
  "src/lib/ui/editorial-images.ts",
  "src/pages/credits-notices.astro",
  "src/pages/source-policy.astro",
] as const;

interface RegistrySelection {
  athleteName: string;
  caseIds: string[];
  coverKind: "commons-photo" | "original-svg-fallback";
  localFile: {
    byteLength: number;
    height: number;
    mimeType: string;
    path: string;
    sha256: string;
    width: number;
  };
  sourceRevision?: { id: number };
  [key: string]: unknown;
}

interface RegistryV6 {
  schemaVersion: number;
  selections: RegistrySelection[];
}

function bytes(path: string): Buffer {
  return readFileSync(resolve(root, path));
}

function checkedDigest(path: string, expected: string): string {
  const actual = sha256Hex(bytes(path));
  if (actual !== expected) {
    throw new Error(`Frozen baseline input changed: ${path}`);
  }
  return actual;
}

function aggregate(rows: readonly { path: string; sha256: string }[]): string {
  return sha256Hex(rows.map((row) => `${row.sha256}  ${row.path}\n`).join(""));
}

function main(): void {
  if (process.version !== "v24.14.0") {
    throw new Error(
      `Decision 15 requires Node v24.14.0, got ${process.version}`,
    );
  }
  execFileSync(
    "git",
    ["merge-base", "--is-ancestor", authorizedStartCommit, "HEAD"],
    {
      cwd: root,
    },
  );
  verifyDecision13ClinicalFreeze();

  const baselineExistingPaths = [
    ...policyBindings.flatMap(([version]) => {
      const suffix = version.slice(5);
      return [
        `research/source-policy/nba.v${suffix}.md`,
        `research/source-policy/source-policy.v${suffix}.json`,
      ];
    }),
    ...registryBindings.map(
      ([schemaVersion]) =>
        `src/assets/players/player-photo-registry.v${schemaVersion}.json`,
    ),
    ...DECISION_13_CLINICAL_FREEZE.map(([path]) => path),
    ...immutableInputs,
  ];
  execFileSync(
    "git",
    [
      "diff",
      "--quiet",
      authorizedStartCommit,
      "--",
      ...new Set(baselineExistingPaths),
    ],
    { cwd: root },
  );

  const policies = policyBindings.map(
    ([version, markdownSha256, jsonSha256]) => {
      const suffix = version.slice(5);
      const markdownPath = `research/source-policy/nba.v${suffix}.md`;
      const jsonPath = `research/source-policy/source-policy.v${suffix}.json`;
      return {
        jsonPath,
        jsonSha256: checkedDigest(jsonPath, jsonSha256),
        markdownPath,
        markdownSha256: checkedDigest(markdownPath, markdownSha256),
        sourcePolicyVersion: version,
      };
    },
  );

  const registries = registryBindings.map(([schemaVersion, expected]) => {
    const path = `src/assets/players/player-photo-registry.v${schemaVersion}.json`;
    return { path, schemaVersion, sha256: checkedDigest(path, expected) };
  });

  const registry = parseStrictJson(
    bytes("src/assets/players/player-photo-registry.v6.json").toString("utf8"),
  ) as RegistryV6;
  if (registry.schemaVersion !== 6 || registry.selections.length !== 21) {
    throw new Error("Authorized-start registry v6 roster changed");
  }
  const caseIds = registry.selections.flatMap((selection) => selection.caseIds);
  if (new Set(caseIds).size !== 26) {
    throw new Error("Authorized-start registry v6 case projection changed");
  }

  const selectionRows = registry.selections.map((selection) => {
    const actualBytes = bytes(selection.localFile.path);
    const actual = {
      byteLength: actualBytes.byteLength,
      path: selection.localFile.path,
      sha256: sha256Hex(actualBytes),
    };
    if (
      actual.byteLength !== selection.localFile.byteLength ||
      actual.sha256 !== selection.localFile.sha256
    ) {
      throw new Error(`Authorized-start cover asset changed: ${actual.path}`);
    }
    return {
      asset: { ...selection.localFile },
      athleteName: selection.athleteName,
      caseIds: selection.caseIds,
      coverKind: selection.coverKind,
      selectionSha256: sha256Hex(canonicalJson(selection)),
    };
  });
  execFileSync(
    "git",
    [
      "diff",
      "--quiet",
      authorizedStartCommit,
      "--",
      ...new Set(selectionRows.map((row) => row.asset.path)),
    ],
    { cwd: root },
  );

  const protectedRows = selectionRows.filter((row) =>
    (protectedAthletes as readonly string[]).includes(row.athleteName),
  );
  const targetRows = selectionRows.filter((row) =>
    (targetAthletes as readonly string[]).includes(row.athleteName),
  );
  if (
    protectedRows.length !== 7 ||
    protectedRows.some((row) => row.coverKind !== "commons-photo") ||
    targetRows.length !== 14 ||
    targetRows.some((row) => row.coverKind !== "original-svg-fallback")
  ) {
    throw new Error("Authorized-start 7-photo/14-SVG partition changed");
  }

  const clinicalFiles = DECISION_13_CLINICAL_FREEZE.map(([path, sha256]) => ({
    path,
    sha256,
  }));
  const reviewSet = parseStrictJson(
    bytes("review/review-set.v1.json").toString("utf8"),
  ) as Record<string, unknown>;
  const manifest = parseStrictJson(
    bytes("review/private-dist-manifest.v1.json").toString("utf8"),
  ) as {
    files: unknown[];
    [key: string]: unknown;
  };
  const siteGovernance = parseStrictJson(
    bytes("src/data/site-governance.v1.json").toString("utf8"),
  ) as {
    allowIndexing: boolean;
  };
  if (siteGovernance.allowIndexing !== false) {
    throw new Error("Authorized-start noindex state changed");
  }

  const immutableFileBindings = immutableInputs.map((path) => ({
    path,
    sha256: sha256Hex(bytes(path)),
  }));
  const photoRows = registry.selections.filter(
    (selection) => selection.coverKind === "commons-photo",
  );

  const baseline = {
    authorizedStart: {
      commit: authorizedStartCommit,
      nodeVersion: "v24.14.0",
      scopeId: "decision-15-photo-first-covers-only",
    },
    clinicalFreeze: {
      aggregateSha256: DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256,
      caseCount: 26,
      files: clinicalFiles,
      injuryOverviewCount: 3,
      totalFileCount: clinicalFiles.length,
      updateCount: 1,
    },
    currentCreditBaseline: {
      count: photoRows.length,
      rows: photoRows.map((selection) => ({
        athleteName: selection.athleteName,
        sourceRevisionId: selection.sourceRevision?.id ?? null,
      })),
    },
    immutableFileBindings,
    indexingBaseline: {
      allowIndexing: false,
      siteGovernanceSha256: sha256Hex(
        bytes("src/data/site-governance.v1.json"),
      ),
    },
    policyBindings: policies,
    privateArtifactBaseline: {
      fileCount: manifest.files.length,
      manifestSha256: sha256Hex(bytes("review/private-dist-manifest.v1.json")),
      reviewSetSha256: sha256Hex(bytes("review/review-set.v1.json")),
      servedReceiptSha256: sha256Hex(
        bytes("review/served-review-receipt.v1.json"),
      ),
    },
    privateServiceBaseline: {
      bindAddress: "100.114.3.93",
      credentialAccount: "atlas-reviewer",
      label: "tw.sportsmedicine.atlas.private-review.v1",
      observationPath:
        "docs/reviews/evidence/decision-14/p0/private-service-observation.v1.json",
      observationSha256: sha256Hex(
        bytes(
          "docs/reviews/evidence/decision-14/p0/private-service-observation.v1.json",
        ),
      ),
      port: 8140,
    },
    registryBindings: registries,
    reviewSetBaseline: {
      contentCommit: reviewSet.contentCommit,
      sha256: sha256Hex(bytes("review/review-set.v1.json")),
    },
    schemaVersion: 1,
    selectionFreeze: {
      all: {
        assetLedgerSha256: aggregate(selectionRows.map((row) => row.asset)),
        caseCount: 26,
        count: 21,
        selectionAggregateSha256: sha256Hex(
          selectionRows
            .map((row) => `${row.selectionSha256}  ${row.athleteName}\n`)
            .join(""),
        ),
      },
      protectedPhotos: {
        assetLedgerSha256: aggregate(protectedRows.map((row) => row.asset)),
        caseCount: protectedRows.flatMap((row) => row.caseIds).length,
        count: protectedRows.length,
        rows: protectedRows,
      },
      selections: selectionRows,
      targetSvgs: {
        assetLedgerSha256: aggregate(targetRows.map((row) => row.asset)),
        caseCount: targetRows.flatMap((row) => row.caseIds).length,
        count: targetRows.length,
        rows: targetRows,
      },
    },
  };

  const outputBytes = canonicalJson(baseline);
  const output = resolve(root, outputPath);
  if (process.argv.includes("--check")) {
    if (readFileSync(output, "utf8") !== outputBytes) {
      throw new Error("Decision 15 Phase 0 baseline bytes are stale");
    }
    console.log(`Decision 15 Phase 0 baseline OK — ${sha256Hex(outputBytes)}`);
    return;
  }
  if (process.argv.includes("--stdout")) {
    process.stdout.write(outputBytes);
    return;
  }
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, outputBytes);
  console.log(
    `Decision 15 Phase 0 baseline wrote ${outputPath} — ${sha256Hex(outputBytes)}`,
  );
}

main();
