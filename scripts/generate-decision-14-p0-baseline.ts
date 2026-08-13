/**
 * Generates the canonical Decision 14 authorized-start baseline.
 *
 * This is a Phase 0 snapshot, not a current-state registry checker. Later
 * phases intentionally advance the 16 target selections and review artifacts;
 * the immutable five-cover and clinical guards live in the Decision 14
 * contract and the existing clinical-freeze checker.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

import {
  canonicalJson,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import {
  DECISION_14_PROTECTED_ATHLETES,
  DECISION_14_SCOPE_ID,
  DECISION_14_TARGET_ATHLETES,
  validateDecision14ProtectedCovers,
  validateDecision14TargetRoster,
} from "../src/lib/contracts/decision-14-photo-contract";
import {
  DECISION_13_CLINICAL_FREEZE,
  DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256,
  verifyDecision13ClinicalFreeze,
} from "./verify-decision-13-clinical-freeze";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputPath =
  "docs/reviews/evidence/decision-14/p0/current-cover-baseline.v1.json";
const authorizedStartCommit = "788b5cee297492db7b76db390fddfe64a5d37589";
const ownerRecordPath = "../.claude/g2-owner-decisions.md";
const serviceObservationPath =
  "docs/reviews/evidence/decision-14/p0/private-service-observation.v1.json";

const policyBindings = [
  {
    jsonPath: "research/source-policy/source-policy.v1.json",
    jsonSha256:
      "a588b68f3468bec8d24cda9005435ecb0177cc74dbaff7d14f793ec45dcdd280",
    markdownPath: "research/source-policy/nba.v1.md",
    markdownSha256:
      "f983c682d3504902ff9ae8a57cbd414e4855de2abbb3b6f2855d3532df8fed46",
    sourcePolicyVersion: "nba-v1",
  },
  {
    jsonPath: "research/source-policy/source-policy.v2.json",
    jsonSha256:
      "6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07",
    markdownPath: "research/source-policy/nba.v2.md",
    markdownSha256:
      "b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570",
    sourcePolicyVersion: "nba-v2",
  },
  {
    jsonPath: "research/source-policy/source-policy.v3.json",
    jsonSha256:
      "284a88792f281564799eeae6b62646b855072725824ef21f3cea4204a3d14270",
    markdownPath: "research/source-policy/nba.v3.md",
    markdownSha256:
      "7dc98d1146ffe701a312694512bfe513f27d3edb8ecaeeb2f933a92f9fb32ca2",
    sourcePolicyVersion: "nba-v3",
  },
  {
    jsonPath: "research/source-policy/source-policy.v4.json",
    jsonSha256:
      "3320fe2051fc091aa055d5cdd8bcdacf24073c3964cac3d1a982666a2aafbf68",
    markdownPath: "research/source-policy/nba.v4.md",
    markdownSha256:
      "929ac5f125db222d8eb6e98a3a52b1778ebd28c743884c945ab917619ebd5994",
    sourcePolicyVersion: "nba-v4",
  },
  {
    jsonPath: "research/source-policy/source-policy.v5.json",
    jsonSha256:
      "5f38066ce0ef0c10f0494856f90114dc403c068986b4c323cbb2ef3ebbda56ac",
    markdownPath: "research/source-policy/nba.v5.md",
    markdownSha256:
      "a59111d915caeb7f1e8f730492e826be63ff95fb5b1feeb1576eeb75a95e6aae",
    sourcePolicyVersion: "nba-v5",
  },
  {
    jsonPath: "research/source-policy/source-policy.v6.json",
    jsonSha256:
      "1e27041de184b7b6397b2cfdde225706b40696f1d4456757193baa340f4cc93c",
    markdownPath: "research/source-policy/nba.v6.md",
    markdownSha256:
      "b9a469344ff5061546619ea0ecbb5b7320965af40cde254d4939cf2e8835b0c1",
    sourcePolicyVersion: "nba-v6",
  },
] as const;

const registryBindings = [
  {
    path: "src/assets/players/player-photo-registry.v1.json",
    schemaVersion: 1,
    sha256: "770a7e6d7f13ecd0dda17a629b13f179357b9c64ebc268404a5640ad9aa08eec",
  },
  {
    path: "src/assets/players/player-photo-registry.v2.json",
    schemaVersion: 2,
    sha256: "0fa9a14660d798b32586047eaec1a0fc14912ca8710aaccc83963ac4f9dc28d0",
  },
  {
    path: "src/assets/players/player-photo-registry.v3.json",
    schemaVersion: 3,
    sha256: "d91e97aa34e347375dd5ca14cf961208ae4b2c43cc8a90a01bea49f1172a3c05",
  },
  {
    path: "src/assets/players/player-photo-registry.v4.json",
    schemaVersion: 4,
    sha256: "ef7149b57ab5d08a328a0a7ed88177fc4d6a35af998bcfd95a0ec318bcf345b5",
  },
  {
    path: "src/assets/players/player-photo-registry.v5.json",
    schemaVersion: 5,
    sha256: "26129455fe5b9297c44ac91c3be1fc1678a928cf77bd12d00695614fe5df3985",
  },
] as const;

const governedArtifacts = [
  "docs/superpowers/plans/2026-08-13-decision-14-lowrisk-photographer-covers.md",
  "docs/decisions/2026-08-13-decision-14-lowrisk-photographer-covers-authorization.v1.json",
  "docs/decisions/plan-binding.v1.json",
  "docs/reviews/2026-08-13-decision-13-p1-photo-candidate-evidence.md",
  "review/review-set.v1.json",
  "review/private-dist-manifest.v1.json",
  "review/served-review-receipt.v1.json",
  "src/data/site-governance.v1.json",
  "ops/private-hosting.v1.json",
  "ops/http-header-policy.v1.json",
  "ops/launchd/tw.sportsmedicine.atlas.private-review.plist.template",
  "docs/reviews/evidence/decision-13/notices-after/central/central-credits.v1.json",
  "docs/reviews/evidence/decision-13/notices-after/notice-inventory.v1.json",
  "src/pages/credits-notices.astro",
  "src/components/credits/PhotoCredit.astro",
  "src/components/cases/CaseCover.astro",
  "src/lib/rights/photo-credits.ts",
  "src/lib/ui/editorial-images.ts",
  "scripts/private-hosting/serve-private-review.ts",
  "scripts/private-hosting/manage-private-review-service.ts",
  "scripts/private-hosting/verify-private-review.ts",
] as const;

interface RegistryV5Selection {
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
  [key: string]: unknown;
}

interface RegistryV5 {
  schemaVersion: 5;
  selections: RegistryV5Selection[];
  [key: string]: unknown;
}

interface ReviewSetV1 {
  cases: unknown[];
  contentAuthoritySnapshotDigest: string;
  contentCommit: string;
  currentUpdate: unknown;
  overviews: unknown[];
  rendererTreeDigest: string;
  sourceBatches: unknown[];
  supportingDataDigest: string;
}

interface PrivateManifestV1 {
  buildCommit: string;
  buildMode: string;
  files: Array<{ buildPath: string; byteLength: number; sha256: string }>;
  generatedAt: string;
  headerPolicyContractId: string;
  headerPolicyDigest: string;
  rendererTreeDigest: string;
  reviewSetDigest: string;
  reviewSetResponseSha256: string;
}

interface PrivateServiceObservationV1 {
  checkedAt: string;
  keychain: {
    account: string;
    metadataPresent: boolean;
    secretRead: false;
    service: string;
  };
  launchd: {
    label: string;
    outputSha256: string;
    plistPath: string;
    program: string;
    runCount: number;
    state: "running";
    wrapperPid: number;
  };
  listener: {
    address: string;
    outputSha256: string;
    pid: number;
  };
  mutationCommandsExecuted: [];
  renderedPlist: {
    byteLength: number;
    gid: number;
    hardLinkCount: number;
    mode: "0600";
    sha256: string;
    uid: number;
  };
  schemaVersion: 1;
  tailscale: {
    backendState: "Running";
    dnsName: string;
    hostname: string;
    ipv4: string;
    online: true;
    outputSha256: string;
  };
}

function bytes(path: string): Buffer {
  return readFileSync(resolve(root, path));
}

function text(path: string): string {
  return bytes(path).toString("utf8");
}

function strict<T>(path: string): T {
  return parseStrictJson(text(path)) as T;
}

function assertSha(path: string, expected: string): void {
  const measured = sha256Hex(bytes(path));
  if (measured !== expected) {
    throw new Error(
      `${path} drifted: expected ${expected}, measured ${measured}`,
    );
  }
}

function aggregateAssetLedger(selections: RegistryV5Selection[]): string {
  return sha256Hex(
    selections
      .map(
        (selection) =>
          `${selection.localFile.sha256}  ${selection.localFile.path}\n`,
      )
      .join(""),
  );
}

for (const binding of policyBindings) {
  assertSha(binding.jsonPath, binding.jsonSha256);
  assertSha(binding.markdownPath, binding.markdownSha256);
}
for (const binding of registryBindings) assertSha(binding.path, binding.sha256);
verifyDecision13ClinicalFreeze();

const measuredHead = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
try {
  execFileSync(
    "git",
    ["merge-base", "--is-ancestor", authorizedStartCommit, measuredHead],
    { cwd: root, stdio: "ignore" },
  );
} catch {
  throw new Error(
    `Decision 14 authorized-start commit ${authorizedStartCommit} is not an ancestor of ${measuredHead}`,
  );
}

const registry = strict<RegistryV5>(registryBindings[4].path);
if (registry.schemaVersion !== 5 || registry.selections.length !== 21) {
  throw new Error("registry v5 must contain exactly 21 selections");
}
const allCaseIds = registry.selections.flatMap(
  (selection) => selection.caseIds,
);
if (allCaseIds.length !== 26 || new Set(allCaseIds).size !== 26) {
  throw new Error("registry v5 must map exactly 26 unique case IDs");
}
for (const selection of registry.selections) {
  const localBytes = bytes(selection.localFile.path);
  if (
    localBytes.byteLength !== selection.localFile.byteLength ||
    sha256Hex(localBytes) !== selection.localFile.sha256
  ) {
    throw new Error(`local asset drift at ${selection.localFile.path}`);
  }
}

const authorizedStartBoundPaths = [
  ...policyBindings.flatMap((binding) => [
    binding.jsonPath,
    binding.markdownPath,
  ]),
  ...registryBindings.map((binding) => binding.path),
  ...governedArtifacts,
  ...DECISION_13_CLINICAL_FREEZE.map(([path]) => path),
  ...registry.selections.map((selection) => selection.localFile.path),
];
try {
  execFileSync(
    "git",
    [
      "diff",
      "--quiet",
      authorizedStartCommit,
      "--",
      ...authorizedStartBoundPaths,
    ],
    { cwd: root, stdio: "ignore" },
  );
} catch {
  throw new Error(
    "an authorized-start baseline path differs from commit 788b5cee; Phase 0 cannot snapshot descendant or dirty bytes",
  );
}

const targetSelections = registry.selections.filter((selection) =>
  (DECISION_14_TARGET_ATHLETES as readonly string[]).includes(
    selection.athleteName,
  ),
);
const protectedSelections = registry.selections.filter((selection) =>
  (DECISION_14_PROTECTED_ATHLETES as readonly string[]).includes(
    selection.athleteName,
  ),
);
const targetIssues = validateDecision14TargetRoster(
  targetSelections.map((selection) => selection.athleteName),
);
if (targetIssues.length > 0) throw new Error(targetIssues[0]!.message);
if (
  targetSelections.some(
    (selection) => selection.coverKind !== "original-svg-fallback",
  ) ||
  protectedSelections.some(
    (selection) => selection.coverKind !== "commons-photo",
  )
) {
  throw new Error(
    "Decision 14 start partition must be 16 SVGs and five photos",
  );
}

const protectedBindings = protectedSelections.map((selection) => ({
  athleteName: selection.athleteName,
  localAssetSha256: sha256Hex(bytes(selection.localFile.path)),
  selectionSha256: sha256Hex(canonicalJson(selection)),
}));
const protectedIssues = validateDecision14ProtectedCovers(protectedBindings);
if (protectedIssues.length > 0) throw new Error(protectedIssues[0]!.message);

const reviewSetPath = "review/review-set.v1.json";
const privateManifestPath = "review/private-dist-manifest.v1.json";
const reviewSet = strict<ReviewSetV1>(reviewSetPath);
const privateManifest = strict<PrivateManifestV1>(privateManifestPath);
if (privateManifest.files.length !== 451) {
  throw new Error("authorized-start private manifest must contain 451 files");
}
for (const file of privateManifest.files) {
  const fileBytes = bytes(join("dist", file.buildPath));
  if (
    fileBytes.byteLength !== file.byteLength ||
    sha256Hex(fileBytes) !== file.sha256
  ) {
    throw new Error(`private manifest mismatch at ${file.buildPath}`);
  }
}
const siteGovernance = strict<{
  allowIndexing: boolean;
  indexingAuthorization: { status: string };
  siteStatus: string;
}>("src/data/site-governance.v1.json");
if (
  siteGovernance.allowIndexing !== false ||
  siteGovernance.siteStatus !== "medical-review"
) {
  throw new Error("Decision 14 baseline must remain medical-review/noindex");
}
const privateHosting = strict<{
  authentication: {
    keychainAccount: string;
    keychainService: string;
    method: string;
    username: string;
  };
  bind: { port: number; tailscaleDnsName: string; tailscaleIPv4: string };
  launchd: { label: string };
  nodeVersion: string;
  serviceId: string;
}>("ops/private-hosting.v1.json");
const serviceObservation = strict<PrivateServiceObservationV1>(
  serviceObservationPath,
);
if (
  serviceObservation.schemaVersion !== 1 ||
  serviceObservation.launchd.label !== privateHosting.launchd.label ||
  serviceObservation.launchd.state !== "running" ||
  serviceObservation.listener.address !==
    `${privateHosting.bind.tailscaleIPv4}:${privateHosting.bind.port}` ||
  serviceObservation.tailscale.backendState !== "Running" ||
  serviceObservation.tailscale.online !== true ||
  serviceObservation.tailscale.ipv4 !== privateHosting.bind.tailscaleIPv4 ||
  serviceObservation.keychain.service !==
    privateHosting.authentication.keychainService ||
  serviceObservation.keychain.account !==
    privateHosting.authentication.keychainAccount ||
  serviceObservation.keychain.metadataPresent !== true ||
  serviceObservation.keychain.secretRead !== false ||
  serviceObservation.mutationCommandsExecuted.length !== 0
) {
  throw new Error("captured Phase 0 private-service observation is invalid");
}
const noticeInventory = strict<{
  coverage: {
    desktopRoutes: number;
    phase4Assertions: Record<string, unknown>;
  };
}>("docs/reviews/evidence/decision-13/notices-after/notice-inventory.v1.json");
const centralCredits = strict<{
  rows: unknown[];
  validation: { adapterRowCount: number; titleNotSuppliedRowCount: number };
}>(
  "docs/reviews/evidence/decision-13/notices-after/central/central-credits.v1.json",
);

const selections = registry.selections.map((selection) => ({
  asset: {
    byteLength: selection.localFile.byteLength,
    height: selection.localFile.height,
    mimeType: selection.localFile.mimeType,
    path: selection.localFile.path,
    sha256: selection.localFile.sha256,
    width: selection.localFile.width,
  },
  athleteName: selection.athleteName,
  caseIds: selection.caseIds,
  coverKind: selection.coverKind,
  selection: selection,
  selectionSha256: sha256Hex(canonicalJson(selection)),
}));

const phase4Assertions = noticeInventory.coverage.phase4Assertions;
const baseline = {
  authorizedStart: {
    commit: authorizedStartCommit,
    nodeVersion: "v24.14.0",
    scopeId: DECISION_14_SCOPE_ID,
  },
  clinicalFreeze: {
    aggregateSha256: DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256,
    caseCount: 26,
    files: DECISION_13_CLINICAL_FREEZE.map(([path, sha256]) => ({
      path,
      sha256,
    })),
    injuryOverviewCount: 3,
    totalFileCount: DECISION_13_CLINICAL_FREEZE.length,
    updateCount: 1,
  },
  governedArtifactBindings: governedArtifacts.map((path) => ({
    path,
    sha256: sha256Hex(bytes(path)),
  })),
  indexingBaseline: {
    allowIndexing: siteGovernance.allowIndexing,
    indexingAuthorizationStatus: siteGovernance.indexingAuthorization.status,
    siteStatus: siteGovernance.siteStatus,
  },
  noticeArchitectureBaseline: {
    adjacentAssetCreditLinkCount: phase4Assertions.adjacentAssetCreditLinkCount,
    centralAdapterLicenseRowCount: centralCredits.validation.adapterRowCount,
    centralCreditRowCount: centralCredits.rows.length,
    centralTitleNotSuppliedRowCount:
      centralCredits.validation.titleNotSuppliedRowCount,
    compactMedicalNoticeCount: phase4Assertions.compactNoticeCount,
    footerCanonicalNoticeCount: phase4Assertions.footerCanonicalNoticeCount,
    routeCount: noticeInventory.coverage.desktopRoutes,
  },
  ownerRecordBaseline: {
    decisionHeading: "Decision 14 — 放寬為具名低風險攝影者的賽場封面照",
    path: ownerRecordPath,
    sha256: sha256Hex(readFileSync(resolve(root, ownerRecordPath))),
  },
  policyBindings,
  privateArtifactBaseline: {
    buildCommit: privateManifest.buildCommit,
    buildMode: privateManifest.buildMode,
    distFileCount: privateManifest.files.length,
    distFileLedgerSha256: sha256Hex(
      [...privateManifest.files]
        .sort((a, b) => compareCodePoints(a.buildPath, b.buildPath))
        .map((file) => `${file.sha256}  ${file.buildPath}\n`)
        .join(""),
    ),
    generatedAt: privateManifest.generatedAt,
    headerPolicyContractId: privateManifest.headerPolicyContractId,
    headerPolicyDigest: privateManifest.headerPolicyDigest,
    privateManifestSha256: sha256Hex(bytes(privateManifestPath)),
    rendererTreeDigest: privateManifest.rendererTreeDigest,
    reviewSetDigest: privateManifest.reviewSetDigest,
    reviewSetResponseSha256: privateManifest.reviewSetResponseSha256,
  },
  privateServiceBaseline: {
    authentication: {
      keychainAccount: privateHosting.authentication.keychainAccount,
      keychainService: privateHosting.authentication.keychainService,
      method: privateHosting.authentication.method,
      username: privateHosting.authentication.username,
    },
    bind: privateHosting.bind,
    launchdLabel: privateHosting.launchd.label,
    liveObservation: serviceObservation,
    nodeVersion: privateHosting.nodeVersion,
    observationPath: serviceObservationPath,
    observationSha256: sha256Hex(bytes(serviceObservationPath)),
    renderedPlist: serviceObservation.renderedPlist,
    serviceId: privateHosting.serviceId,
  },
  registryBindings,
  reviewSetBaseline: {
    caseCount: reviewSet.cases.length,
    contentAuthoritySnapshotDigest: reviewSet.contentAuthoritySnapshotDigest,
    contentCommit: reviewSet.contentCommit,
    currentUpdate: reviewSet.currentUpdate,
    overviewCount: reviewSet.overviews.length,
    rendererTreeDigest: reviewSet.rendererTreeDigest,
    reviewSetSha256: sha256Hex(bytes(reviewSetPath)),
    sourceBatchCount: reviewSet.sourceBatches.length,
    supportingDataDigest: reviewSet.supportingDataDigest,
  },
  schemaVersion: 1,
  selectionFreeze: {
    all: {
      assetLedgerSha256: aggregateAssetLedger(registry.selections),
      caseCount: allCaseIds.length,
      count: registry.selections.length,
      selectionAggregateSha256: sha256Hex(canonicalJson(registry.selections)),
    },
    digestAlgorithm:
      "SHA-256 over canonical JSON for selections; asset aggregate is SHA-256 over registry-order '<sha256>  <path>\\n' records",
    protectedCommons: {
      assetLedgerSha256: aggregateAssetLedger(protectedSelections),
      caseCount: protectedSelections.flatMap((selection) => selection.caseIds)
        .length,
      count: protectedSelections.length,
      selectionAggregateSha256: sha256Hex(canonicalJson(protectedSelections)),
    },
    selections,
    targetSvg: {
      assetLedgerSha256: aggregateAssetLedger(targetSelections),
      caseCount: targetSelections.flatMap((selection) => selection.caseIds)
        .length,
      count: targetSelections.length,
      selectionAggregateSha256: sha256Hex(canonicalJson(targetSelections)),
    },
  },
};

const outputBytes = canonicalJson(baseline);
if (process.argv.includes("--check")) {
  if (text(outputPath) !== outputBytes) {
    throw new Error("Decision 14 Phase 0 baseline bytes are stale");
  }
  console.log(
    `Decision 14 Phase 0 baseline OK — ${sha256Hex(outputBytes)} (21 selections, 26 cases, 451 dist files)`,
  );
} else if (process.argv.includes("--stdout")) {
  process.stdout.write(outputBytes);
} else {
  mkdirSync(resolve(root, "docs/reviews/evidence/decision-14/p0"), {
    recursive: true,
  });
  writeFileSync(resolve(root, outputPath), outputBytes);
  console.log(
    `wrote ${outputPath} — ${sha256Hex(outputBytes)} (21 selections, 26 cases, 451 dist files)`,
  );
}
