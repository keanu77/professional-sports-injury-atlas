/** Generates the canonical Decision 16 authorized-start and oversized-artifact baseline. */

import { execFileSync } from "node:child_process";
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  compareCodePoints,
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
  "docs/reviews/evidence/decision-16/p0/authorized-start-baseline.v1.json";
const authorizedStartCommit = "518b8a5ea64a769cd39750f17433472a2381cd59";
const artifactLimitBytes = 32 * 1024 * 1024;

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
  [7, "77a146729b95802fbe978bc8a4360ed54929121936a04454afe49998ea93b0c4"],
] as const;

const immutableInputs = [
  "docs/superpowers/plans/2026-08-14-decision-16-trae-young-rendition.md",
  "docs/decisions/2026-08-14-decision-16-trae-young-rendition-authorization.v1.json",
  "docs/decisions/plan-binding.v1.json",
  "docs/reviews/2026-08-13-decision-15-p1-frozen-candidate-readjudication.md",
  "docs/reviews/2026-08-13-decision-15-p3-photo-adoption-and-registry-v7.md",
  "docs/reviews/2026-08-13-decision-15-p4-final-validation.md",
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
  "scripts/private-hosting/verify-private-review.ts",
  "scripts/private-hosting/generate-private-dist-manifest.ts",
  "scripts/verify-review-artifact.ts",
  "src/lib/governance/artifact-manifest.ts",
] as const;

interface RegistrySelection {
  athleteName: string;
  caseIds: string[];
  localFile: {
    byteLength: number;
    height: number;
    mimeType: string;
    path: string;
    sha256: string;
    width: number;
  };
  [key: string]: unknown;
}

interface RegistryV7 {
  schemaVersion: number;
  selections: RegistrySelection[];
}

interface ManifestFile {
  buildPath: string;
  byteLength: number;
  requestPath: string;
  sha256: string;
}

interface PrivateManifest {
  buildCommit: string;
  files: ManifestFile[];
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

function walkRegularFiles(baseDir: string): string[] {
  const resolvedBase = resolve(baseDir);
  const baseStat = lstatSync(resolvedBase);
  if (baseStat.isSymbolicLink() || !baseStat.isDirectory()) {
    throw new Error("dist must be a real directory");
  }
  const results: string[] = [];
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory).sort(compareCodePoints)) {
      const target = join(directory, name);
      const stat = lstatSync(target);
      if (stat.isSymbolicLink()) {
        throw new Error(`dist symlink is forbidden: ${target}`);
      }
      if (stat.isDirectory()) visit(target);
      else if (stat.isFile()) {
        const path = relative(resolvedBase, target).split(sep).join("/");
        if (path === "" || path.startsWith("../")) {
          throw new Error(`unsafe dist path: ${path}`);
        }
        results.push(path);
      } else {
        throw new Error(`dist special file is forbidden: ${target}`);
      }
    }
  };
  visit(resolvedBase);
  return results.sort(compareCodePoints);
}

function assertStaticOversizeCause(
  manifest: PrivateManifest,
  verifierSource: string,
): void {
  const requiredSourceTokens = [
    "const MAX_RESPONSE_BYTES = 32 * 1024 * 1024;",
    "maxBodyBytes: Math.min(",
    "MAX_RESPONSE_BYTES,",
    "if (length > request.maxBodyBytes)",
    'new PrivateHostVerifierError("transport-failed"',
  ];
  if (requiredSourceTokens.some((token) => !verifierSource.includes(token))) {
    throw new Error("private verifier oversize failure path changed");
  }
  const offenders = manifest.files.filter(
    (file) => file.byteLength > artifactLimitBytes,
  );
  if (
    offenders.length !== 1 ||
    offenders[0]!.buildPath !== "_astro/trae-young.jGOFOMcP.jpg" ||
    offenders[0]!.byteLength !== 39_619_306 ||
    offenders[0]!.sha256 !==
      "b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0"
  ) {
    throw new Error("authorized-start oversized manifest fact changed");
  }
}

function main(): void {
  if (process.version !== "v24.14.0") {
    throw new Error(
      `Decision 16 requires Node v24.14.0, got ${process.version}`,
    );
  }
  execFileSync(
    "git",
    ["merge-base", "--is-ancestor", authorizedStartCommit, "HEAD"],
    { cwd: root },
  );
  verifyDecision13ClinicalFreeze();

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
    bytes("src/assets/players/player-photo-registry.v7.json").toString("utf8"),
  ) as RegistryV7;
  if (registry.schemaVersion !== 7 || registry.selections.length !== 21) {
    throw new Error("authorized-start registry v7 roster changed");
  }
  const caseIds = registry.selections.flatMap((selection) => selection.caseIds);
  if (caseIds.length !== 26 || new Set(caseIds).size !== 26) {
    throw new Error("authorized-start registry v7 case projection changed");
  }

  const selectionRows = registry.selections.map((selection) => {
    const localBytes = bytes(selection.localFile.path);
    if (
      localBytes.byteLength !== selection.localFile.byteLength ||
      sha256Hex(localBytes) !== selection.localFile.sha256
    ) {
      throw new Error(
        `authorized-start cover asset changed: ${selection.localFile.path}`,
      );
    }
    return {
      asset: { ...selection.localFile },
      athleteName: selection.athleteName,
      caseIds: selection.caseIds,
      selectionSha256: sha256Hex(canonicalJson(selection)),
    };
  });
  const trae = selectionRows.filter((row) => row.athleteName === "Trae Young");
  const protectedRows = selectionRows.filter(
    (row) => row.athleteName !== "Trae Young",
  );
  if (
    trae.length !== 1 ||
    protectedRows.length !== 20 ||
    trae[0]!.asset.path !== "src/assets/players/decision-15/trae-young.jpg" ||
    trae[0]!.asset.byteLength !== 39_619_306 ||
    trae[0]!.asset.width !== 6_351 ||
    trae[0]!.asset.height !== 5_504 ||
    trae[0]!.asset.sha256 !==
      "b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0"
  ) {
    throw new Error("authorized-start Trae source partition changed");
  }

  const manifestBytes = bytes("review/private-dist-manifest.v1.json");
  const manifest = parseStrictJson(
    manifestBytes.toString("utf8"),
  ) as PrivateManifest;
  if (manifest.files.length !== 918) {
    throw new Error("authorized-start private manifest file count changed");
  }
  const verifierSource = bytes(
    "scripts/private-hosting/verify-private-review.ts",
  ).toString("utf8");
  assertStaticOversizeCause(manifest, verifierSource);

  const distDir = resolve(root, "dist");
  const distPaths = walkRegularFiles(distDir);
  if (distPaths.length !== manifest.files.length) {
    throw new Error("authorized-start dist/manifest path count mismatch");
  }
  const manifestByPath = new Map(
    manifest.files.map((file) => [file.buildPath, file]),
  );
  const sizeLedger = distPaths
    .map((path) => {
      const localBytes = readFileSync(join(distDir, ...path.split("/")));
      const entry = manifestByPath.get(path);
      const sha256 = sha256Hex(localBytes);
      if (
        entry === undefined ||
        entry.byteLength !== localBytes.byteLength ||
        entry.sha256 !== sha256
      ) {
        throw new Error(
          `authorized-start dist/manifest byte mismatch: ${path}`,
        );
      }
      return { byteLength: localBytes.byteLength, path, sha256 };
    })
    .sort(
      (left, right) =>
        right.byteLength - left.byteLength ||
        compareCodePoints(left.path, right.path),
    );
  const oversized = sizeLedger.filter(
    (file) => file.byteLength > artifactLimitBytes,
  );
  if (
    oversized.length !== 1 ||
    oversized[0]!.path !== "_astro/trae-young.jGOFOMcP.jpg"
  ) {
    throw new Error("authorized-start dist oversized ledger changed");
  }

  const siteGovernance = parseStrictJson(
    bytes("src/data/site-governance.v1.json").toString("utf8"),
  ) as { allowIndexing: boolean; siteStatus: string };
  if (
    siteGovernance.allowIndexing !== false ||
    siteGovernance.siteStatus !== "medical-review"
  ) {
    throw new Error("authorized-start private/noindex state changed");
  }

  const clinicalFiles = DECISION_13_CLINICAL_FREEZE.map(([path, sha256]) => ({
    path,
    sha256,
  }));
  const immutableFileBindings = immutableInputs.map((path) => ({
    path,
    sha256: sha256Hex(bytes(path)),
  }));
  const baseline = {
    authorizedStart: {
      commit: authorizedStartCommit,
      nodeVersion: "v24.14.0",
      scopeId: "decision-16-trae-young-rendition-only",
    },
    clinicalFreeze: {
      aggregateSha256: DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256,
      caseCount: 26,
      files: clinicalFiles,
      injuryOverviewCount: 3,
      totalFileCount: clinicalFiles.length,
      updateCount: 1,
    },
    currentCoverFreeze: {
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
      protectedOther20: {
        assetLedgerSha256: aggregate(protectedRows.map((row) => row.asset)),
        caseCount: protectedRows.flatMap((row) => row.caseIds).length,
        count: protectedRows.length,
        rows: protectedRows,
        selectionAggregateSha256: sha256Hex(
          protectedRows
            .map((row) => `${row.selectionSha256}  ${row.athleteName}\n`)
            .join(""),
        ),
      },
      selections: selectionRows,
      traeYoungSourceOriginal: {
        mediaWikiSha1: "193bb8a75e73f878359d136f0769205a4a8693ba",
        row: trae[0],
      },
    },
    immutableFileBindings,
    indexingBaseline: {
      allowIndexing: false,
      siteGovernanceSha256: sha256Hex(
        bytes("src/data/site-governance.v1.json"),
      ),
      siteStatus: "medical-review",
    },
    oversizedArtifactBaseline: {
      artifactLimitBytes,
      artifactLimitExpression: "32 * 1024 * 1024",
      buildPathSizeLedgerSha256: sha256Hex(
        [...sizeLedger]
          .sort((left, right) => compareCodePoints(left.path, right.path))
          .map((row) => `${row.byteLength}  ${row.path}\n`)
          .join(""),
      ),
      distFileCount: sizeLedger.length,
      distLedgerSha256: sha256Hex(
        sizeLedger
          .map((row) => `${row.byteLength}  ${row.sha256}  ${row.path}\n`)
          .join(""),
      ),
      filesAtOrBelowLimit: sizeLedger.length - oversized.length,
      largestBelowLimit: sizeLedger
        .filter((file) => file.byteLength <= artifactLimitBytes)
        .slice(0, 10),
      oversized,
      oversizedCount: oversized.length,
      sizeLedger,
      sortOrder: "byteLength-desc-then-buildPath-code-point",
      totalByteLength: sizeLedger.reduce(
        (total, file) => total + file.byteLength,
        0,
      ),
    },
    persistedDecision15Failure: {
      causalProof: {
        clampExpression:
          "Math.min(MAX_RESPONSE_BYTES, Math.max(file.byteLength + 1, 64 * 1024))",
        manifestOffenderByteLength: 39_619_306,
        manifestOffenderExcessBytes: 39_619_306 - artifactLimitBytes,
        manifestOffenderPath: "_astro/trae-young.jGOFOMcP.jpg",
        responseOverflowCondition: "length > request.maxBodyBytes",
        verifierLimitBytes: artifactLimitBytes,
      },
      evidencePath:
        "docs/reviews/2026-08-13-decision-15-p4-final-validation.md",
      evidenceSha256:
        "500cb250833d72230c6fee3e4021474c62eabd3d4245191e0f8a40e6f07bd85f",
      exactPersistedToken: "transport-failed",
      fullerStderrClaimedFrozen: false,
      liveVerifierRerunInPhase0: false,
    },
    policyBindings: policies,
    privateArtifactBaseline: {
      buildCommit: manifest.buildCommit,
      fileCount: manifest.files.length,
      manifestSha256: sha256Hex(manifestBytes),
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
    schemaVersion: 1,
    verifierAndArtifactCodeBindings: immutableFileBindings.filter((entry) =>
      [
        "scripts/private-hosting/verify-private-review.ts",
        "scripts/private-hosting/generate-private-dist-manifest.ts",
        "scripts/verify-review-artifact.ts",
        "src/lib/governance/artifact-manifest.ts",
      ].includes(entry.path),
    ),
  };

  const outputBytes = canonicalJson(baseline);
  const output = resolve(root, outputPath);
  if (process.argv.includes("--check")) {
    if (readFileSync(output, "utf8") !== outputBytes) {
      throw new Error("Decision 16 Phase 0 baseline bytes are stale");
    }
    console.log(`Decision 16 Phase 0 baseline OK — ${sha256Hex(outputBytes)}`);
    return;
  }
  if (process.argv.includes("--stdout")) {
    process.stdout.write(outputBytes);
    return;
  }
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, outputBytes);
  console.log(
    `Decision 16 Phase 0 baseline wrote ${outputPath} — ${sha256Hex(outputBytes)}`,
  );
}

main();
