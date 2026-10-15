/**
 * Decision 17 protected-boundary contract.
 *
 * This contract deliberately summarizes only immutable inputs and fail-closed
 * safety signals. New follow-up sidecars and presentation work are additive;
 * they may never make one of these baseline mismatches non-zero.
 */

import { issue, type ValidationIssue } from "./canonical";

export const DECISION_17_CLINICAL_AGGREGATE_SHA256 =
  "bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73" as const;
export const DECISION_17_PLAYER_PHOTO_REGISTRY_V8_SHA256 =
  "43e3c2c7f2e1b5e28b5b0238de99e5ebf902c1c166a2c29fcc0473e40e1a43cd" as const;
export const DECISION_17_COVER_ASSET_LEDGER_SHA256 =
  "625b47f92ad0e4706872e92ea7c7fd92e25c4dfd21dd219feb59154571db15dd" as const;

export const DECISION_17_VIDEO_SOURCE_MEMBERSHIP = Object.freeze({
  "external-link": ["anthony-edwards-ankle-sprain-2023"],
  "nba-plain-text-citation": [
    "anthony-edwards-ankle-sprain-2025",
    "brandon-clarke-achilles-rupture-2023",
    "cj-mccollum-ankle-sprain-2020",
    "damian-lillard-achilles-rupture-2025",
    "danny-green-acl-2022",
    "dejounte-murray-achilles-rupture-2025",
    "dwight-powell-achilles-rupture-2020",
    "ja-morant-ankle-sprain-2020",
    "joe-ingles-acl-2022",
    "kevin-durant-ankle-sprain-2024",
    "kyrie-irving-acl-2025",
    "lamelo-ball-ankle-sprain-2022",
    "lebron-james-ankle-sprain-2021",
    "markelle-fultz-acl-2021",
    "moritz-wagner-acl-2024",
    "ricky-rubio-acl-2021",
    "thomas-bryant-acl-2021",
    "trae-young-ankle-sprain-2021",
  ],
  "youtube-embed": [
    "anfernee-simons-ankle-sprain-2023",
    "jayson-tatum-achilles-rupture-2025",
    "kevin-durant-achilles-rupture-2019",
    "kyrie-irving-ankle-sprain-2021",
    "lamelo-ball-ankle-sprain-2023",
    "lamelo-ball-ankle-sprain-2025",
    "tyrese-haliburton-achilles-rupture-2025",
  ],
});

export interface Decision17ProtectedBoundarySnapshot {
  approvedCoreLineageMismatches: readonly string[];
  bySaCompositionFirewallActive: boolean;
  caseByteMismatches: readonly string[];
  caseCount: number;
  clinicalAggregateSha256: string;
  clinicalFileCount: number;
  coverAssetLedgerSha256: string;
  coverByteMismatches: readonly string[];
  coverCount: number;
  digestDomMissingValues: readonly string[];
  nbaNavigationSinks: readonly string[];
  playerPhotoRegistryV8Sha256: string;
  unauthorizedMedicalApprovalStates: readonly string[];
  videoSourceMembership: Record<string, readonly string[]>;
}

function sameOrderedValues(
  actual: readonly string[] | undefined,
  expected: readonly string[],
): boolean {
  return (
    actual !== undefined &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

export function validateDecision17ProtectedBoundary(
  snapshot: Decision17ProtectedBoundarySnapshot,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (
    snapshot.caseCount !== 26 ||
    snapshot.clinicalFileCount !== 30 ||
    snapshot.clinicalAggregateSha256 !==
      DECISION_17_CLINICAL_AGGREGATE_SHA256 ||
    snapshot.caseByteMismatches.length > 0
  ) {
    issues.push(
      issue(
        "decision17-clinical-freeze",
        "clinicalFreeze",
        "the 26 case bytes and complete 30-file clinical freeze must remain exact",
      ),
    );
  }
  if (snapshot.approvedCoreLineageMismatches.length > 0) {
    issues.push(
      issue(
        "decision17-approved-core-lineage",
        "approvedCoreLineage",
        "existing owner identity and reviewed clinical-core digests must remain exact",
      ),
    );
  }
  if (
    snapshot.coverCount !== 21 ||
    snapshot.coverByteMismatches.length > 0 ||
    snapshot.coverAssetLedgerSha256 !== DECISION_17_COVER_ASSET_LEDGER_SHA256 ||
    snapshot.playerPhotoRegistryV8Sha256 !==
      DECISION_17_PLAYER_PHOTO_REGISTRY_V8_SHA256
  ) {
    issues.push(
      issue(
        "decision17-cover-freeze",
        "currentCoverFreeze",
        "all 21 current covers and registry v8 must remain byte-identical",
      ),
    );
  }
  for (const [token, expected] of Object.entries(
    DECISION_17_VIDEO_SOURCE_MEMBERSHIP,
  )) {
    if (!sameOrderedValues(snapshot.videoSourceMembership[token], expected)) {
      issues.push(
        issue(
          "decision17-video-source-partition",
          `videoSourceMembership.${token}`,
          `video-source membership for ${token} changed`,
        ),
      );
    }
  }
  if (!snapshot.bySaCompositionFirewallActive) {
    issues.push(
      issue(
        "decision17-by-sa-firewall",
        "rights.bySaCompositionFirewallActive",
        "the CC BY-SA composition firewall must remain active",
      ),
    );
  }
  if (snapshot.nbaNavigationSinks.length > 0) {
    issues.push(
      issue(
        "decision17-nba-navigation-sink",
        "nbaNavigationSinks",
        "NBA targets must not enter anchors, redirects, iframes, metadata, JSON-LD, or scripts",
      ),
    );
  }
  if (snapshot.digestDomMissingValues.length > 0) {
    issues.push(
      issue(
        "decision17-digest-dom",
        "digestDomMissingValues",
        "record and digest values must remain literal server-rendered DOM values",
      ),
    );
  }
  if (snapshot.unauthorizedMedicalApprovalStates.length > 0) {
    issues.push(
      issue(
        "decision17-unauthorized-medical-approval",
        "unauthorizedMedicalApprovalStates",
        "new follow-up material may only be pending owner signoff",
      ),
    );
  }
  return issues;
}
