import { describe, expect, it } from "vitest";

import {
  DECISION_18_AUTHORIZATION_SHA256,
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
} from "../../src/lib/contracts/decision-18-regression-contract";

function validSnapshot(): Decision18ProtectedBoundarySnapshot {
  return {
    allowIndexing: false,
    approvedCoreLineageMismatches: [],
    authorizedStartCommitIsAncestor: true,
    authorizationSha256: DECISION_18_AUTHORIZATION_SHA256,
    bySaCompositionFirewallActive: true,
    caseCount: 26,
    clinicalAggregateSha256: DECISION_18_CLINICAL_AGGREGATE_SHA256,
    clinicalFileCount: 30,
    closedScopeMutations: [],
    coverAssetLedgerSha256: DECISION_18_COVER_ASSET_LEDGER_SHA256,
    coverByteMismatches: [],
    coverCount: 21,
    decision17LedgerCount: 26,
    decision17LedgerMismatches: [],
    nbaNavigationSinks: [],
    nodeVersion: "v24.14.0",
    planSha256: DECISION_18_PLAN_SHA256,
    playerPhotoRegistryV8Sha256: DECISION_18_PLAYER_PHOTO_REGISTRY_V8_SHA256,
    privateManifestSha256: DECISION_18_PRIVATE_MANIFEST_SHA256,
    protectedFileMismatches: [],
    reviewSetV2Sha256: DECISION_18_REVIEW_SET_V2_SHA256,
    servedReceiptSha256: DECISION_18_SERVED_RECEIPT_SHA256,
    sourcePolicyV10JsonSha256: DECISION_18_SOURCE_POLICY_V10_JSON_SHA256,
    sourcePolicyV10MarkdownSha256:
      DECISION_18_SOURCE_POLICY_V10_MARKDOWN_SHA256,
    unauthorizedMedicalApprovalStates: [],
  };
}

function codes(snapshot: Decision18ProtectedBoundarySnapshot): string[] {
  return validateDecision18ProtectedBoundary(snapshot).map(
    (entry) => entry.code,
  );
}

describe("Decision 18 protected regression contract", () => {
  it("accepts the exact authorized protected baseline", () => {
    expect(validateDecision18ProtectedBoundary(validSnapshot())).toEqual([]);
  });

  it("rejects authorization, runtime, plan, or decision drift", () => {
    const snapshot = validSnapshot();
    snapshot.authorizedStartCommitIsAncestor = false;
    snapshot.nodeVersion = "v22.0.0";
    snapshot.planSha256 = "0".repeat(64);
    snapshot.authorizationSha256 = "1".repeat(64);
    expect(codes(snapshot)).toContain("decision18-authorized-start");
  });

  it("rejects clinical bytes and approved-core owner lineage drift", () => {
    const snapshot = validSnapshot();
    snapshot.protectedFileMismatches = ["src/content/cases/fictional.json"];
    snapshot.approvedCoreLineageMismatches = ["fictional-case"];
    expect(codes(snapshot)).toEqual(
      expect.arrayContaining([
        "decision18-clinical-freeze",
        "decision18-approved-core-lineage",
      ]),
    );
  });

  it("rejects cover, registry, v10, or Decision 17 ledger drift", () => {
    const snapshot = validSnapshot();
    snapshot.coverByteMismatches = ["src/assets/players/changed.jpg"];
    snapshot.sourcePolicyV10JsonSha256 = "2".repeat(64);
    snapshot.decision17LedgerMismatches = [
      "research/follow-ups/decision-17/changed.json",
    ];
    expect(codes(snapshot)).toEqual(
      expect.arrayContaining([
        "decision18-cover-freeze",
        "decision18-source-policy-v10-freeze",
        "decision18-decision17-ledger-freeze",
      ]),
    );
  });

  it("rejects review-set v2, private manifest, or served receipt drift", () => {
    const snapshot = validSnapshot();
    snapshot.privateManifestSha256 = "3".repeat(64);
    expect(codes(snapshot)).toContain("decision18-private-artifact-freeze");
  });

  it("rejects indexing, NBA sinks, medical approval, and closed scopes", () => {
    const snapshot = validSnapshot();
    snapshot.allowIndexing = true;
    snapshot.nbaNavigationSinks = ["anchor:https://www.nba.com/example"];
    snapshot.unauthorizedMedicalApprovalStates = ["item:approved"];
    snapshot.closedScopeMutations = ["review/private-dist-manifest.v1.json"];
    expect(codes(snapshot)).toEqual(
      expect.arrayContaining([
        "decision18-indexing-open",
        "decision18-nba-navigation-sink",
        "decision18-unauthorized-medical-approval",
        "decision18-closed-scope-mutation",
      ]),
    );
  });

  it("rejects a disabled CC BY-SA composition firewall", () => {
    const snapshot = validSnapshot();
    snapshot.bySaCompositionFirewallActive = false;
    expect(codes(snapshot)).toContain("decision18-by-sa-firewall");
  });
});
