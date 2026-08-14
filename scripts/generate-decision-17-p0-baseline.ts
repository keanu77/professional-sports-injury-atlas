/** Generates the canonical Decision 17 authorized-start protected baseline. */

import { execFileSync } from "node:child_process";
import {
  existsSync,
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
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import { caseSchema, type InjuryCase } from "../src/lib/contracts/case";
import {
  DECISION_17_COVER_ASSET_LEDGER_SHA256,
  DECISION_17_VIDEO_SOURCE_MEMBERSHIP,
  validateDecision17ProtectedBoundary,
  type Decision17ProtectedBoundarySnapshot,
} from "../src/lib/contracts/decision-17-regression-contract";
import { isNbaHost } from "../src/lib/rights/nba-link-policy";
import {
  DECISION_13_CLINICAL_FREEZE,
  DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256,
  verifyDecision13ClinicalFreeze,
} from "./verify-decision-13-clinical-freeze";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUTPUT_PATH =
  "docs/reviews/evidence/decision-17/p0/authorized-start-baseline.v1.json";
const AUTHORIZED_START_COMMIT = "02a43bbe9c880bcdb48596c912c81fe8a3a8f3ca";
const REQUIRED_NODE_VERSION = "v24.14.0";

const immutablePaths = [
  "docs/superpowers/plans/2026-08-14-decision-17-case-filter-and-followup-notes.md",
  "docs/decisions/2026-08-14-decision-17-case-filter-and-followup-notes-authorization.v1.json",
  "docs/decisions/plan-binding.v1.json",
  "docs/reviews/2026-08-14-decision-16-p3-final-validation.md",
  "review/review-set.v1.json",
  "review/private-dist-manifest.v1.json",
  "review/served-review-receipt.v1.json",
  "src/data/site-governance.v1.json",
  "src/lib/cases/digest.ts",
  "src/lib/cases/pagination.ts",
  "src/lib/cases/search-index.ts",
  "src/lib/cases/selectors.ts",
  "src/lib/routes/static-paths.ts",
  "src/lib/rights/nba-link-policy.ts",
  "src/components/atlas/CaseFilters.astro",
  "src/components/cases/CaseTimeline.astro",
  "src/components/cases/CaseVideo.astro",
  "src/components/cases/LayeredNotes.astro",
  "src/components/citations/ExternalSourceCitation.astro",
  "src/pages/cases/[slug].astro",
  "src/pages/review/fixtures/[fixture].astro",
  "src/scripts/case-filters.ts",
  "src/scripts/layered-notes.ts",
  "src/scripts/video-player.ts",
  "src/lib/governance/review-set.ts",
  "src/lib/governance/medical-review-decision.ts",
  "scripts/generate-review-set.ts",
  "scripts/private-hosting/generate-private-dist-manifest.ts",
  "scripts/private-hosting/serve-private-review.ts",
  "scripts/private-hosting/verify-private-review.ts",
  "scripts/verify-review-artifact.ts",
  "scripts/verify-brand-assets.ts",
] as const;

const immutableGovernancePaths = new Set<string>([
  "docs/superpowers/plans/2026-08-14-decision-17-case-filter-and-followup-notes.md",
  "docs/decisions/2026-08-14-decision-17-case-filter-and-followup-notes-authorization.v1.json",
  "docs/decisions/plan-binding.v1.json",
  "docs/reviews/2026-08-14-decision-16-p3-final-validation.md",
  "review/review-set.v1.json",
  "review/served-review-receipt.v1.json",
  "src/data/site-governance.v1.json",
  "src/lib/cases/digest.ts",
]);

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
}

interface RegistryV8 {
  schemaVersion: number;
  selections: RegistrySelection[];
}

interface PrivateManifest {
  buildCommit: string;
  files: unknown[];
}

type VideoSourceToken = keyof typeof DECISION_17_VIDEO_SOURCE_MEMBERSHIP;

function bytes(path: string): Buffer {
  const absolute = resolve(ROOT, path);
  const status = lstatSync(absolute);
  if (!status.isFile() || status.isSymbolicLink()) {
    throw new Error(`${path} must be a regular non-symlink file`);
  }
  return readFileSync(absolute);
}

function deriveVideoSource(record: InjuryCase): VideoSourceToken {
  const url = new URL(record.video.canonicalUrl);
  if (isNbaHost(url.hostname)) return "nba-plain-text-citation";
  if (
    record.video.provider === "youtube" &&
    record.video.embedStatus === "verified"
  ) {
    return "youtube-embed";
  }
  if (record.video.embedStatus === "external-link-only") {
    return "external-link";
  }
  throw new Error(
    `Unexpected video provider/host/status for ${record.slug}: ${record.video.provider}/${url.hostname}/${record.video.embedStatus}`,
  );
}

function loadCases(): Array<{
  filename: string;
  path: string;
  rawBytes: Buffer;
  record: InjuryCase;
}> {
  return readdirSync(resolve(ROOT, "src/content/cases"))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((filename) => {
      const path = `src/content/cases/${filename}`;
      const rawBytes = bytes(path);
      const record = caseSchema.parse(
        parseStrictJson(rawBytes.toString("utf8")),
      );
      return { filename, path, rawBytes, record };
    });
}

function main(): void {
  if (process.version !== REQUIRED_NODE_VERSION) {
    throw new Error(
      `Decision 17 requires Node ${REQUIRED_NODE_VERSION}; received ${process.version}`,
    );
  }
  execFileSync(
    "git",
    ["merge-base", "--is-ancestor", AUTHORIZED_START_COMMIT, "HEAD"],
    { cwd: ROOT },
  );
  verifyDecision13ClinicalFreeze();

  const checking = process.argv.includes("--check");
  const followUpDirectory = resolve(ROOT, "src/content/follow-ups");
  if (!checking && existsSync(followUpDirectory)) {
    const inherited = readdirSync(followUpDirectory).filter((name) =>
      name.endsWith(".json"),
    );
    if (inherited.length > 0) {
      throw new Error(
        `Decision 17 authorized start unexpectedly inherited ${inherited.length} follow-up sidecars`,
      );
    }
  }

  const expectedCaseSha = new Map<string, string>(
    DECISION_13_CLINICAL_FREEZE.filter(([path]) =>
      path.startsWith("src/content/cases/"),
    ).map(([path, sha256]) => [path, sha256]),
  );
  const cases = loadCases();
  const caseByteMismatches: string[] = [];
  const approvedCoreLineageMismatches: string[] = [];
  const videoSourceMembership: Record<VideoSourceToken, string[]> = {
    "external-link": [],
    "nba-plain-text-citation": [],
    "youtube-embed": [],
  };
  const caseRows = cases.map(({ path, rawBytes, record }) => {
    const fileSha256 = sha256Hex(rawBytes);
    if (expectedCaseSha.get(path) !== fileSha256) {
      caseByteMismatches.push(path);
    }
    const clinicalCoreDigest = computeCaseContentDigest(record);
    if (
      record.status !== "approved" ||
      record.review.status !== "approved" ||
      record.review.reviewerName !== "吳易澄醫師" ||
      record.review.reviewerQualification !== "復健科專科醫師" ||
      record.review.reviewedContentDigest !== clinicalCoreDigest
    ) {
      approvedCoreLineageMismatches.push(record.slug);
    }
    const videoSource = deriveVideoSource(record);
    videoSourceMembership[videoSource].push(record.slug);
    const legacySources = record.sources.filter((source) =>
      source.supports.includes("general.confirmedUpdate"),
    );
    if (legacySources.length !== 1) {
      throw new Error(
        `${record.slug} must have exactly one confirmedUpdate source`,
      );
    }
    const legacySource = legacySources[0]!;
    return {
      caseId: record.id,
      clinicalCoreDigest,
      eventDate: record.eventDate,
      fileByteLength: rawBytes.byteLength,
      fileSha256,
      legacyDiagnosisSource: {
        id: legacySource.id,
        publishedAt: legacySource.publishedAt,
        publisher: legacySource.publisher,
        title: legacySource.title,
        url: legacySource.url,
      },
      path,
      review: {
        reviewedAt: record.review.reviewedAt,
        reviewedContentDigest: record.review.reviewedContentDigest,
        reviewerName: record.review.reviewerName,
        reviewerQualification: record.review.reviewerQualification,
        status: record.review.status,
      },
      slug: record.slug,
      videoSource,
    };
  });

  const registryPath = "src/assets/players/player-photo-registry.v8.json";
  const registryBytes = bytes(registryPath);
  const registry = parseStrictJson(
    registryBytes.toString("utf8"),
  ) as RegistryV8;
  if (registry.schemaVersion !== 8 || registry.selections.length !== 21) {
    throw new Error("Decision 17 requires the exact 21-selection registry v8");
  }
  const coverByteMismatches: string[] = [];
  const coverRows = registry.selections.map((selection) => {
    const assetBytes = bytes(selection.localFile.path);
    const actualSha256 = sha256Hex(assetBytes);
    if (
      actualSha256 !== selection.localFile.sha256 ||
      assetBytes.byteLength !== selection.localFile.byteLength
    ) {
      coverByteMismatches.push(selection.localFile.path);
    }
    return {
      athleteName: selection.athleteName,
      byteLength: assetBytes.byteLength,
      caseIds: selection.caseIds,
      path: selection.localFile.path,
      sha256: actualSha256,
    };
  });
  const coverAssetLedgerSha256 = sha256Hex(
    coverRows.map((row) => `${row.sha256}  ${row.path}\n`).join(""),
  );
  if (coverAssetLedgerSha256 !== DECISION_17_COVER_ASSET_LEDGER_SHA256) {
    coverByteMismatches.push("cover-asset-ledger");
  }

  const casePageSource = bytes("src/pages/cases/[slug].astro").toString("utf8");
  const digestDomMissingValues = [
    "data-review-digests",
    "data-record-id",
    "contentDigest",
    "renderedSetDigest",
  ].filter((token) => !casePageSource.includes(token));
  const brandGuardSource = bytes("scripts/verify-brand-assets.ts").toString(
    "utf8",
  );
  const bySaCompositionFirewallActive = [
    "scanShareAlikeCompositeRisks",
    "player-photo pipeline references must not enter authored raster-composition code",
    "ShareAlike composites",
  ].every((token) => brandGuardSource.includes(token));

  const protectedSnapshot: Decision17ProtectedBoundarySnapshot = {
    approvedCoreLineageMismatches,
    bySaCompositionFirewallActive,
    caseByteMismatches,
    caseCount: cases.length,
    clinicalAggregateSha256: DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256,
    clinicalFileCount: DECISION_13_CLINICAL_FREEZE.length,
    coverAssetLedgerSha256,
    coverByteMismatches,
    coverCount: coverRows.length,
    digestDomMissingValues,
    nbaNavigationSinks: [],
    playerPhotoRegistryV8Sha256: sha256Hex(registryBytes),
    unauthorizedMedicalApprovalStates: [],
    videoSourceMembership,
  };
  const boundaryIssues = validateDecision17ProtectedBoundary(protectedSnapshot);
  if (boundaryIssues.length > 0) {
    throw new Error(
      `Decision 17 protected baseline failed: ${boundaryIssues
        .map((entry) => entry.code)
        .join(", ")}`,
    );
  }

  const policyBindings = Array.from({ length: 9 }, (_, index) => {
    const version = index + 1;
    const markdownPath = `research/source-policy/nba.v${version}.md`;
    const jsonPath = `research/source-policy/source-policy.v${version}.json`;
    return {
      jsonPath,
      jsonSha256: sha256Hex(bytes(jsonPath)),
      markdownPath,
      markdownSha256: sha256Hex(bytes(markdownPath)),
      sourcePolicyVersion: `nba-v${version}`,
    };
  });
  const registryBindings = Array.from({ length: 8 }, (_, index) => {
    const schemaVersion = index + 1;
    const path = `src/assets/players/player-photo-registry.v${schemaVersion}.json`;
    return { path, schemaVersion, sha256: sha256Hex(bytes(path)) };
  });
  // Phase 0 records the broad starting inventory once. Later phase checks
  // read only the protected governance subset so authorized presentation
  // work may delete or replace a baseline UI file without weakening the
  // immutable projection.
  const immutableFileBindings = immutablePaths
    .filter((path) => !checking || immutableGovernancePaths.has(path))
    .map((path) => ({
      path,
      sha256: sha256Hex(bytes(path)),
    }));
  const manifestBytes = bytes("review/private-dist-manifest.v1.json");
  const manifest = parseStrictJson(
    manifestBytes.toString("utf8"),
  ) as PrivateManifest;
  const governanceBytes = bytes("src/data/site-governance.v1.json");
  const governance = parseStrictJson(governanceBytes.toString("utf8")) as {
    allowIndexing: boolean;
    siteStatus: string;
  };
  if (
    governance.allowIndexing !== false ||
    governance.siteStatus !== "medical-review"
  ) {
    throw new Error("Decision 17 private/noindex baseline changed");
  }

  const baseline = {
    artifactBaseline: {
      manifestBuildCommit: manifest.buildCommit,
      manifestFileCount: manifest.files.length,
      privateManifestSha256: sha256Hex(manifestBytes),
      reviewSetV1Sha256: sha256Hex(bytes("review/review-set.v1.json")),
      servedReceiptSha256: sha256Hex(
        bytes("review/served-review-receipt.v1.json"),
      ),
    },
    authorizedStart: {
      commit: AUTHORIZED_START_COMMIT,
      nodeVersion: REQUIRED_NODE_VERSION,
      scopeId: "decision-17-case-filter-and-followup-notes-only",
    },
    caseRows,
    clinicalFreeze: {
      aggregateSha256: DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256,
      caseCount: 26,
      files: DECISION_13_CLINICAL_FREEZE.map(([path, sha256]) => ({
        path,
        sha256,
      })),
      injuryOverviewCount: 3,
      totalFileCount: 30,
      updateCount: 1,
    },
    currentCoverFreeze: {
      assetLedgerSha256: coverAssetLedgerSha256,
      caseCount: coverRows.flatMap((row) => row.caseIds).length,
      count: coverRows.length,
      registrySha256: sha256Hex(registryBytes),
      rows: coverRows,
    },
    decision16KnownFailure: {
      correctionAttemptedByDecision17: false,
      evidencePath:
        "docs/reviews/2026-08-14-decision-16-p3-final-validation.md",
      evidenceSha256: sha256Hex(
        bytes("docs/reviews/2026-08-14-decision-16-p3-final-validation.md"),
      ),
      localFileCredentialOutcome: "transport-failed",
      ttyCredentialOutcome: "credential-invalid",
    },
    followUpBaseline: {
      inheritedSidecarCount: 0,
      inheritedSidecars: [],
    },
    immutableFileBindings,
    indexingBaseline: {
      allowIndexing: false,
      siteGovernanceSha256: sha256Hex(governanceBytes),
      siteStatus: governance.siteStatus,
    },
    policyBindings,
    protectedSnapshot,
    registryBindings,
    schemaVersion: 1,
  };
  const outputBytes = canonicalJson(baseline);
  const output = resolve(ROOT, OUTPUT_PATH);
  if (checking) {
    const committedBytes = readFileSync(output, "utf8");
    const committed = parseStrictJson(committedBytes) as typeof baseline;
    const protectedProjection = (value: typeof baseline) => ({
      authorizedStart: value.authorizedStart,
      caseRows: value.caseRows,
      clinicalFreeze: value.clinicalFreeze,
      currentCoverFreeze: value.currentCoverFreeze,
      decision16KnownFailure: value.decision16KnownFailure,
      immutableFileBindings: value.immutableFileBindings.filter((entry) =>
        immutableGovernancePaths.has(entry.path),
      ),
      indexingBaseline: value.indexingBaseline,
      policyBindings: value.policyBindings,
      protectedSnapshot: value.protectedSnapshot,
      registryBindings: value.registryBindings,
      schemaVersion: value.schemaVersion,
    });
    if (
      canonicalJson(protectedProjection(committed)) !==
      canonicalJson(protectedProjection(baseline))
    ) {
      throw new Error("Decision 17 protected baseline inputs changed");
    }
    console.log(
      `Decision 17 protected baseline OK — ${sha256Hex(committedBytes)}`,
    );
    return;
  }
  if (process.argv.includes("--stdout")) {
    process.stdout.write(outputBytes);
    return;
  }
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, outputBytes);
  console.log(
    `Decision 17 Phase 0 baseline wrote ${OUTPUT_PATH} — ${sha256Hex(outputBytes)}`,
  );
}

main();
