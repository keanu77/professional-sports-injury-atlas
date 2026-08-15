/** Generates or verifies the Decision 18 authorized-start protected baseline. */

import { execFileSync } from "node:child_process";
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { computeCaseContentDigest } from "../src/lib/cases/digest";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_SOURCE_TIERS,
  parseCaseFollowUpBytes,
  parseFollowUpResearchBytes,
  type FollowUpKind,
  type FollowUpSourceTier,
} from "../src/lib/contracts/case-follow-up";
import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import { caseSchema, type InjuryCase } from "../src/lib/contracts/case";
import {
  DECISION_18_AUTHORIZATION_SHA256,
  DECISION_18_AUTHORIZED_START_COMMIT,
  DECISION_18_CLINICAL_AGGREGATE_SHA256,
  DECISION_18_COVER_ASSET_LEDGER_SHA256,
  DECISION_18_PLAN_SHA256,
  DECISION_18_PLAYER_PHOTO_REGISTRY_V8_SHA256,
  DECISION_18_PRIVATE_MANIFEST_SHA256,
  DECISION_18_REVIEW_SET_V2_SHA256,
  DECISION_18_SERVED_RECEIPT_SHA256,
  DECISION_18_SOURCE_POLICY_V10_JSON_SHA256,
  DECISION_18_SOURCE_POLICY_V10_MARKDOWN_SHA256,
  validateDecision18ProtectedBoundary,
  type Decision18ProtectedBoundarySnapshot,
} from "../src/lib/contracts/decision-18-regression-contract";
import {
  DECISION_13_CLINICAL_FREEZE,
  verifyDecision13ClinicalFreeze,
} from "./verify-decision-13-clinical-freeze";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUTPUT_PATH =
  "docs/reviews/evidence/decision-18/p0/authorized-start-baseline.v1.json";
const EXPECTED_OUTPUT_SHA256 =
  "fa541c8a2c1fd476e41f0820fc40440f6d16fb2b1990cd14dc25053fef32c992";
const PLAN_PATH =
  "docs/superpowers/plans/2026-08-15-decision-18-professional-notes-and-exhaustive-followups.md";
const AUTHORIZATION_PATH =
  "docs/decisions/2026-08-15-decision-18-professional-notes-and-exhaustive-followups-authorization.v1.json";

interface RegistrySelection {
  athleteName: string;
  caseIds: string[];
  localFile: { byteLength: number; path: string; sha256: string };
}

interface RegistryV8 {
  schemaVersion: number;
  selections: RegistrySelection[];
}

interface FileBinding {
  path: string;
  sha256: string;
}

function bytes(path: string): Buffer {
  const absolute = resolve(ROOT, path);
  const status = lstatSync(absolute);
  if (!status.isFile() || status.isSymbolicLink()) {
    throw new Error(`${path} must be a regular non-symlink file`);
  }
  return readFileSync(absolute);
}

function fileBindings(paths: readonly string[]): FileBinding[] {
  return [...paths]
    .sort()
    .map((path) => ({ path, sha256: sha256Hex(bytes(path)) }));
}

function gitChangedPaths(): string[] {
  const committed = execFileSync(
    "git",
    ["diff", "--name-only", `${DECISION_18_AUTHORIZED_START_COMMIT}..HEAD`],
    { cwd: ROOT, encoding: "utf8" },
  );
  const working = execFileSync("git", ["status", "--porcelain=v1"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return Array.from(
    new Set([
      ...committed.split("\n").filter(Boolean),
      ...working
        .split("\n")
        .filter(Boolean)
        .map((line) => line.slice(3)),
    ]),
  ).sort();
}

function isClosedScopePath(path: string): boolean {
  return (
    path === "review/private-dist-manifest.v1.json" ||
    path === "review/served-review-receipt.v1.json" ||
    path === "src/data/site-governance.v1.json" ||
    path === PLAN_PATH ||
    path === AUTHORIZATION_PATH ||
    path.startsWith("dist/") ||
    path.startsWith(".github/") ||
    path.startsWith("scripts/private-hosting/") ||
    path.startsWith("public-release-artifacts/") ||
    path.startsWith("public-release-history/")
  );
}

function limitationMeaningIsSafe(record: InjuryCase): boolean {
  const text = record.professional.clinicalLimitations;
  if (record.injury.code === "acl") {
    return text.includes("影片不能取代臨床診斷");
  }
  if (record.injury.code === "ankle-sprain") {
    return (
      text.includes("畫面不能分辨") &&
      ["症狀", "觸診", "負重能力", "適當檢查"].every((token) =>
        text.includes(token),
      )
    );
  }
  return (
    record.injury.code === "achilles-rupture" &&
    text.includes("判定需要臨床評估") &&
    text.includes("影片不能確認")
  );
}

function loadCases(): Array<{ path: string; record: InjuryCase }> {
  return readdirSync(resolve(ROOT, "src/content/cases"))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const path = `src/content/cases/${name}`;
      return {
        path,
        record: caseSchema.parse(parseStrictJson(bytes(path).toString("utf8"))),
      };
    });
}

function main(): void {
  if (process.version !== "v24.14.0") {
    throw new Error(
      `Decision 18 requires Node v24.14.0; got ${process.version}`,
    );
  }
  execFileSync(
    "git",
    [
      "merge-base",
      "--is-ancestor",
      DECISION_18_AUTHORIZED_START_COMMIT,
      "HEAD",
    ],
    { cwd: ROOT },
  );
  verifyDecision13ClinicalFreeze();

  const checking = process.argv.includes("--check");
  const cases = loadCases();
  if (cases.length !== 26)
    throw new Error(`expected 26 cases, got ${cases.length}`);

  const safetyFailures: string[] = [];
  const approvedCoreLineageMismatches: string[] = [];
  const caseRows = cases.map(({ path, record }) => {
    const limitationClaims = record.professional.claims.filter(
      (claim) => claim.field === "professional.clinicalLimitations",
    );
    const sourceById = new Map(
      record.sources.map((source) => [source.id, source]),
    );
    const evidenceValid =
      limitationClaims.length > 0 &&
      limitationClaims.map((claim) => claim.text).join("\n\n") ===
        record.professional.clinicalLimitations &&
      limitationClaims.every((claim) =>
        claim.evidenceIds.every((id) => {
          const source = sourceById.get(id);
          return (
            source?.type === "teaching-evidence" &&
            source.supports.includes("professional.clinicalLimitations") &&
            record.professional.evidenceIds.includes(id)
          );
        }),
      );
    if (!limitationMeaningIsSafe(record) || !evidenceValid) {
      safetyFailures.push(record.slug);
    }
    const clinicalDigest = computeCaseContentDigest(record);
    if (
      record.status !== "approved" ||
      record.review.status !== "approved" ||
      record.review.reviewerName !== "吳易澄醫師" ||
      record.review.reviewerQualification !== "復健科專科醫師" ||
      record.review.reviewedContentDigest !== clinicalDigest
    ) {
      approvedCoreLineageMismatches.push(record.slug);
    }
    return {
      caseId: record.id,
      clinicalDigest,
      clinicalLimitations: record.professional.clinicalLimitations,
      evidenceBindingValid: evidenceValid,
      fileSha256: sha256Hex(bytes(path)),
      injuryCode: record.injury.code,
      limitationMeaningValid: limitationMeaningIsSafe(record),
      path,
      slug: record.slug,
    };
  });
  if (safetyFailures.length > 0) {
    throw new Error(
      `professional safety gate failed: ${safetyFailures.join(", ")}`,
    );
  }

  const registryPath = "src/assets/players/player-photo-registry.v8.json";
  const registryBytes = bytes(registryPath);
  const registry = parseStrictJson(
    registryBytes.toString("utf8"),
  ) as RegistryV8;
  if (registry.schemaVersion !== 8 || registry.selections.length !== 21) {
    throw new Error("expected the exact 21-selection player-photo registry v8");
  }
  const coverByteMismatches: string[] = [];
  const coverRows = registry.selections.map((selection) => {
    const content = bytes(selection.localFile.path);
    const sha256 = sha256Hex(content);
    if (
      sha256 !== selection.localFile.sha256 ||
      content.byteLength !== selection.localFile.byteLength
    ) {
      coverByteMismatches.push(selection.localFile.path);
    }
    return {
      athleteName: selection.athleteName,
      byteLength: content.byteLength,
      caseIds: selection.caseIds,
      path: selection.localFile.path,
      sha256,
    };
  });
  const coverAssetLedgerSha256 = sha256Hex(
    coverRows.map((row) => `${row.sha256}  ${row.path}\n`).join(""),
  );

  const d17Directory = "research/follow-ups/decision-17";
  const d17Paths = readdirSync(resolve(ROOT, d17Directory))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => `${d17Directory}/${name}`);
  let d17QueryCount = 0;
  for (const path of d17Paths) {
    const parsed = parseFollowUpResearchBytes(bytes(path));
    if (parsed.research === null || parsed.issues.length > 0) {
      throw new Error(`invalid Decision 17 research ledger ${path}`);
    }
    for (const kind of FOLLOW_UP_KINDS) {
      d17QueryCount += parsed.research.categories[kind].queryBoundaries.length;
    }
  }

  const itemCountsByKind = Object.fromEntries(
    FOLLOW_UP_KINDS.map((kind) => [kind, 0]),
  ) as Record<FollowUpKind, number>;
  const itemCountsByTier = Object.fromEntries(
    FOLLOW_UP_SOURCE_TIERS.map((tier) => [tier, 0]),
  ) as Record<FollowUpSourceTier, number>;
  const unauthorizedMedicalApprovalStates: string[] = [];
  const sidecarDirectory = "src/content/follow-ups";
  const sidecarPaths = readdirSync(resolve(ROOT, sidecarDirectory))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => `${sidecarDirectory}/${name}`);
  const sidecarRows = sidecarPaths.map((path) => {
    const parsed = parseCaseFollowUpBytes(bytes(path));
    if (parsed.sidecar === null || parsed.issues.length > 0) {
      throw new Error(`invalid follow-up sidecar ${path}`);
    }
    let itemCount = 0;
    for (const kind of FOLLOW_UP_KINDS) {
      for (const item of parsed.sidecar.categories[kind]) {
        itemCount += 1;
        itemCountsByKind[kind] += 1;
        itemCountsByTier[item.sourceTier] += 1;
        if (item.review.status !== "pending-owner-signoff") {
          unauthorizedMedicalApprovalStates.push(`${path}:${item.id}`);
        }
      }
    }
    return {
      caseId: parsed.sidecar.caseId,
      itemCount,
      path,
      sha256: parsed.exactBytesDigest,
    };
  });

  const immutablePaths = [
    ...DECISION_13_CLINICAL_FREEZE.map(([path]) => path),
    ...coverRows.map((row) => row.path),
    registryPath,
    PLAN_PATH,
    AUTHORIZATION_PATH,
    "docs/decisions/plan-binding.v1.json",
    "research/source-policy/nba.v10.md",
    "research/source-policy/source-policy.v10.json",
    ...d17Paths,
    "review/review-set.v1.json",
    "review/review-set.v2.json",
    "review/private-dist-manifest.v1.json",
    "review/served-review-receipt.v1.json",
    "src/data/site-governance.v1.json",
  ];
  const protectedFileBindings = fileBindings(immutablePaths);
  const governance = parseStrictJson(
    bytes("src/data/site-governance.v1.json").toString("utf8"),
  ) as { allowIndexing: boolean; siteStatus: string };
  const brandGuardSource = bytes("scripts/verify-brand-assets.ts").toString(
    "utf8",
  );
  const bySaCompositionFirewallActive = [
    "scanShareAlikeCompositeRisks",
    "player-photo pipeline references must not enter authored raster-composition code",
    "ShareAlike composites",
  ].every((token) => brandGuardSource.includes(token));

  const committedBaselineBytes = checking ? bytes(OUTPUT_PATH) : null;
  const committedBaseline = committedBaselineBytes
    ? (parseStrictJson(committedBaselineBytes.toString("utf8")) as {
        protectedFileBindings: FileBinding[];
      })
    : null;
  const expectedByPath = new Map(
    committedBaseline?.protectedFileBindings.map((entry) => [
      entry.path,
      entry.sha256,
    ]) ?? protectedFileBindings.map((entry) => [entry.path, entry.sha256]),
  );
  const protectedFileMismatches = protectedFileBindings
    .filter((entry) => expectedByPath.get(entry.path) !== entry.sha256)
    .map((entry) => entry.path);
  const decision17LedgerMismatches = protectedFileMismatches.filter((path) =>
    path.startsWith(`${d17Directory}/`),
  );
  const snapshot: Decision18ProtectedBoundarySnapshot = {
    allowIndexing: governance.allowIndexing,
    approvedCoreLineageMismatches,
    authorizedStartCommitIsAncestor: true,
    authorizationSha256: sha256Hex(bytes(AUTHORIZATION_PATH)),
    bySaCompositionFirewallActive,
    caseCount: cases.length,
    clinicalAggregateSha256: DECISION_18_CLINICAL_AGGREGATE_SHA256,
    clinicalFileCount: DECISION_13_CLINICAL_FREEZE.length,
    closedScopeMutations: gitChangedPaths().filter(isClosedScopePath),
    coverAssetLedgerSha256,
    coverByteMismatches,
    coverCount: coverRows.length,
    decision17LedgerCount: d17Paths.length,
    decision17LedgerMismatches,
    nbaNavigationSinks: [],
    nodeVersion: process.version,
    planSha256: sha256Hex(bytes(PLAN_PATH)),
    playerPhotoRegistryV8Sha256: sha256Hex(registryBytes),
    privateManifestSha256: sha256Hex(
      bytes("review/private-dist-manifest.v1.json"),
    ),
    protectedFileMismatches,
    reviewSetV2Sha256: sha256Hex(bytes("review/review-set.v2.json")),
    servedReceiptSha256: sha256Hex(
      bytes("review/served-review-receipt.v1.json"),
    ),
    sourcePolicyV10JsonSha256: sha256Hex(
      bytes("research/source-policy/source-policy.v10.json"),
    ),
    sourcePolicyV10MarkdownSha256: sha256Hex(
      bytes("research/source-policy/nba.v10.md"),
    ),
    unauthorizedMedicalApprovalStates,
  };
  const issues = validateDecision18ProtectedBoundary(snapshot);
  if (issues.length > 0) {
    throw new Error(
      `Decision 18 protected baseline failed: ${issues
        .map((entry) => `${entry.code}:${entry.path}`)
        .join(", ")}`,
    );
  }
  if (
    coverAssetLedgerSha256 !== DECISION_18_COVER_ASSET_LEDGER_SHA256 ||
    sha256Hex(registryBytes) !== DECISION_18_PLAYER_PHOTO_REGISTRY_V8_SHA256 ||
    sha256Hex(bytes(PLAN_PATH)) !== DECISION_18_PLAN_SHA256 ||
    sha256Hex(bytes(AUTHORIZATION_PATH)) !== DECISION_18_AUTHORIZATION_SHA256 ||
    snapshot.sourcePolicyV10MarkdownSha256 !==
      DECISION_18_SOURCE_POLICY_V10_MARKDOWN_SHA256 ||
    snapshot.sourcePolicyV10JsonSha256 !==
      DECISION_18_SOURCE_POLICY_V10_JSON_SHA256 ||
    snapshot.reviewSetV2Sha256 !== DECISION_18_REVIEW_SET_V2_SHA256 ||
    snapshot.privateManifestSha256 !== DECISION_18_PRIVATE_MANIFEST_SHA256 ||
    snapshot.servedReceiptSha256 !== DECISION_18_SERVED_RECEIPT_SHA256
  ) {
    throw new Error("Decision 18 fixed baseline digest mismatch");
  }
  const itemCount = Object.values(itemCountsByKind).reduce(
    (sum, count) => sum + count,
    0,
  );
  if (
    d17Paths.length !== 26 ||
    d17QueryCount !== 104 ||
    sidecarRows.length !== 26 ||
    itemCount !== 44
  ) {
    throw new Error(
      `unexpected D17 baseline ledgers=${d17Paths.length} queries=${d17QueryCount} sidecars=${sidecarRows.length} items=${itemCount}`,
    );
  }

  const baseline = {
    artifactType: "decision-18-authorized-start-baseline",
    authorizedStart: {
      authorizationPath: AUTHORIZATION_PATH,
      authorizationSha256: DECISION_18_AUTHORIZATION_SHA256,
      commit: DECISION_18_AUTHORIZED_START_COMMIT,
      nodeVersion: "v24.14.0",
      planPath: PLAN_PATH,
      planSha256: DECISION_18_PLAN_SHA256,
      scopeId: "decision-18-professional-notes-and-exhaustive-followups-only",
    },
    caseRows,
    clinicalFreeze: {
      aggregateSha256: DECISION_18_CLINICAL_AGGREGATE_SHA256,
      caseCount: 26,
      totalFileCount: 30,
    },
    coverFreeze: {
      assetLedgerSha256: coverAssetLedgerSha256,
      count: coverRows.length,
      registrySha256: sha256Hex(registryBytes),
      rows: coverRows,
    },
    decision17FollowUpBaseline: {
      itemCount,
      itemCountsByKind,
      itemCountsByTier,
      ledgerCount: d17Paths.length,
      queryBoundaryCount: d17QueryCount,
      sidecarCount: sidecarRows.length,
      sidecars: sidecarRows,
    },
    governance: {
      allowIndexing: governance.allowIndexing,
      siteStatus: governance.siteStatus,
    },
    protectedFileBindings,
    protectedSnapshot: snapshot,
    schemaVersion: 1,
  };
  const outputBytes = canonicalJson(baseline);
  if (checking) {
    if (
      committedBaselineBytes === null ||
      sha256Hex(committedBaselineBytes) !== EXPECTED_OUTPUT_SHA256 ||
      committedBaselineBytes.toString("utf8") !== outputBytes
    ) {
      throw new Error(
        "Decision 18 Phase 0 baseline bytes differ from the exact frozen artifact",
      );
    }
    console.log(
      `Decision 18 protected baseline OK — 30/30 clinical, 21/21 covers, 26 D17 ledgers, 104 queries, 44 pending items; ${sha256Hex(committedBaselineBytes)}`,
    );
    return;
  }
  const output = resolve(ROOT, OUTPUT_PATH);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, outputBytes);
  console.log(
    `Decision 18 Phase 0 baseline wrote ${OUTPUT_PATH} — ${sha256Hex(outputBytes)}`,
  );
}

main();
