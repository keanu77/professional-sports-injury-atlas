/**
 * Decision 18 protected-boundary contract.
 *
 * The mutable presentation, Decision 18 research ledgers, pending sidecars,
 * and future review-set v3 are intentionally outside this snapshot. The
 * fields below cover only bytes and states that Decision 18 may never change.
 */

import { issue, type ValidationIssue } from "./canonical";

export const DECISION_18_AUTHORIZED_START_COMMIT =
  "a41ec0372a189734d4827e4f01db25234f71dad0" as const;
export const DECISION_18_PLAN_SHA256 =
  "e088f891838fdb9e05e554309af35f50ae9ab4b9b4b9db357918f8db6b818c04" as const;
export const DECISION_18_AUTHORIZATION_SHA256 =
  "f618de27bc7e556072371bab8f2ec3eadef88f829af7e1349c997060201ac452" as const;
export const DECISION_18_CLINICAL_AGGREGATE_SHA256 =
  "bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73" as const;
export const DECISION_18_COVER_ASSET_LEDGER_SHA256 =
  "625b47f92ad0e4706872e92ea7c7fd92e25c4dfd21dd219feb59154571db15dd" as const;
export const DECISION_18_PLAYER_PHOTO_REGISTRY_V8_SHA256 =
  "908ccc9c1d9aeee56c907a476701c8875914af5090614c36271a76447057084a" as const;
export const DECISION_18_SOURCE_POLICY_V10_MARKDOWN_SHA256 =
  "34e05ef2b6c1f7fbfbafe9dbf5ae469394bcd3a7c6dc49b07f0468a566a5604c" as const;
export const DECISION_18_SOURCE_POLICY_V10_JSON_SHA256 =
  "9203384e5d8b551834e3de5c17a3cc2bff60f8e27416a3074897db861df9a4b3" as const;
export const DECISION_18_REVIEW_SET_V2_SHA256 =
  "0962e04a3bc6a844518829ea462454384dbc6232198779bce0a303b211892b55" as const;
export const DECISION_18_PRIVATE_MANIFEST_SHA256 =
  "45be696caa0e7127ed70066db895285f1d0c300ebfcea0e4f50d097f638cc5d5" as const;
export const DECISION_18_SERVED_RECEIPT_SHA256 =
  "7a6cc42cbd63a29130e51db891051dddc35b73a886cf65bfaaf5ff9538a5e2e0" as const;

export interface Decision18ProtectedBoundarySnapshot {
  allowIndexing: boolean;
  approvedCoreLineageMismatches: readonly string[];
  authorizedStartCommitIsAncestor: boolean;
  authorizationSha256: string;
  bySaCompositionFirewallActive: boolean;
  caseCount: number;
  clinicalAggregateSha256: string;
  clinicalFileCount: number;
  closedScopeMutations: readonly string[];
  coverAssetLedgerSha256: string;
  coverByteMismatches: readonly string[];
  coverCount: number;
  decision17LedgerCount: number;
  decision17LedgerMismatches: readonly string[];
  nbaNavigationSinks: readonly string[];
  nodeVersion: string;
  planSha256: string;
  playerPhotoRegistryV8Sha256: string;
  privateManifestSha256: string;
  protectedFileMismatches: readonly string[];
  reviewSetV2Sha256: string;
  servedReceiptSha256: string;
  sourcePolicyV10JsonSha256: string;
  sourcePolicyV10MarkdownSha256: string;
  unauthorizedMedicalApprovalStates: readonly string[];
}

export function validateDecision18ProtectedBoundary(
  snapshot: Decision18ProtectedBoundarySnapshot,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (
    !snapshot.authorizedStartCommitIsAncestor ||
    snapshot.nodeVersion !== "v24.14.0" ||
    snapshot.planSha256 !== DECISION_18_PLAN_SHA256 ||
    snapshot.authorizationSha256 !== DECISION_18_AUTHORIZATION_SHA256
  ) {
    issues.push(
      issue(
        "decision18-authorized-start",
        "authorizedStart",
        "the exact authorized start, Node runtime, plan, and decision must remain bound",
      ),
    );
  }
  if (
    snapshot.caseCount !== 26 ||
    snapshot.clinicalFileCount !== 30 ||
    snapshot.clinicalAggregateSha256 !==
      DECISION_18_CLINICAL_AGGREGATE_SHA256 ||
    snapshot.protectedFileMismatches.length > 0
  ) {
    issues.push(
      issue(
        "decision18-clinical-freeze",
        "clinicalFreeze",
        "all 26 cases and the complete 30-file clinical freeze must remain byte-identical",
      ),
    );
  }
  if (snapshot.approvedCoreLineageMismatches.length > 0) {
    issues.push(
      issue(
        "decision18-approved-core-lineage",
        "approvedCoreLineage",
        "existing owner review identity and approved clinical digests must remain exact",
      ),
    );
  }
  if (
    snapshot.coverCount !== 21 ||
    snapshot.coverByteMismatches.length > 0 ||
    snapshot.coverAssetLedgerSha256 !== DECISION_18_COVER_ASSET_LEDGER_SHA256 ||
    snapshot.playerPhotoRegistryV8Sha256 !==
      DECISION_18_PLAYER_PHOTO_REGISTRY_V8_SHA256
  ) {
    issues.push(
      issue(
        "decision18-cover-freeze",
        "currentCoverFreeze",
        "all 21 covers and player-photo registry v8 must remain byte-identical",
      ),
    );
  }
  if (
    snapshot.sourcePolicyV10MarkdownSha256 !==
      DECISION_18_SOURCE_POLICY_V10_MARKDOWN_SHA256 ||
    snapshot.sourcePolicyV10JsonSha256 !==
      DECISION_18_SOURCE_POLICY_V10_JSON_SHA256
  ) {
    issues.push(
      issue(
        "decision18-source-policy-v10-freeze",
        "sourcePolicyV10",
        "the immutable nba-v10 Markdown and JSON bytes must remain exact",
      ),
    );
  }
  if (
    snapshot.decision17LedgerCount !== 26 ||
    snapshot.decision17LedgerMismatches.length > 0
  ) {
    issues.push(
      issue(
        "decision18-decision17-ledger-freeze",
        "decision17Ledgers",
        "all 26 historical Decision 17 research ledgers must remain byte-identical",
      ),
    );
  }
  if (
    snapshot.reviewSetV2Sha256 !== DECISION_18_REVIEW_SET_V2_SHA256 ||
    snapshot.privateManifestSha256 !== DECISION_18_PRIVATE_MANIFEST_SHA256 ||
    snapshot.servedReceiptSha256 !== DECISION_18_SERVED_RECEIPT_SHA256
  ) {
    issues.push(
      issue(
        "decision18-private-artifact-freeze",
        "privateArtifacts",
        "review-set v2, private manifest, and served receipt must remain byte-identical",
      ),
    );
  }
  if (snapshot.allowIndexing) {
    issues.push(
      issue(
        "decision18-indexing-open",
        "allowIndexing",
        "Decision 18 must keep indexing disabled",
      ),
    );
  }
  if (!snapshot.bySaCompositionFirewallActive) {
    issues.push(
      issue(
        "decision18-by-sa-firewall",
        "rights.bySaCompositionFirewallActive",
        "the CC BY-SA composition firewall must remain active",
      ),
    );
  }
  if (snapshot.nbaNavigationSinks.length > 0) {
    issues.push(
      issue(
        "decision18-nba-navigation-sink",
        "nbaNavigationSinks",
        "NBA citations must remain literal text with zero navigation sink",
      ),
    );
  }
  if (snapshot.unauthorizedMedicalApprovalStates.length > 0) {
    issues.push(
      issue(
        "decision18-unauthorized-medical-approval",
        "unauthorizedMedicalApprovalStates",
        "all follow-up items must remain pending owner signoff",
      ),
    );
  }
  if (snapshot.closedScopeMutations.length > 0) {
    issues.push(
      issue(
        "decision18-closed-scope-mutation",
        "closedScopeMutations",
        "deployment, hosting, public, indexing, review-decision, and remote scopes remain closed",
      ),
    );
  }
  return issues;
}
