import { describe, expect, it } from "vitest";

import {
  DECISION_17_CLINICAL_AGGREGATE_SHA256,
  DECISION_17_COVER_ASSET_LEDGER_SHA256,
  DECISION_17_PLAYER_PHOTO_REGISTRY_V8_SHA256,
  DECISION_17_VIDEO_SOURCE_MEMBERSHIP,
  validateDecision17ProtectedBoundary,
  type Decision17ProtectedBoundarySnapshot,
} from "../../src/lib/contracts/decision-17-regression-contract";

function validSnapshot(): Decision17ProtectedBoundarySnapshot {
  return {
    approvedCoreLineageMismatches: [],
    bySaCompositionFirewallActive: true,
    caseByteMismatches: [],
    caseCount: 26,
    clinicalAggregateSha256: DECISION_17_CLINICAL_AGGREGATE_SHA256,
    clinicalFileCount: 30,
    coverAssetLedgerSha256: DECISION_17_COVER_ASSET_LEDGER_SHA256,
    coverByteMismatches: [],
    coverCount: 21,
    digestDomMissingValues: [],
    nbaNavigationSinks: [],
    playerPhotoRegistryV8Sha256: DECISION_17_PLAYER_PHOTO_REGISTRY_V8_SHA256,
    unauthorizedMedicalApprovalStates: [],
    videoSourceMembership: Object.fromEntries(
      Object.entries(DECISION_17_VIDEO_SOURCE_MEMBERSHIP).map(
        ([token, values]) => [token, [...values]],
      ),
    ),
  };
}

function codes(snapshot: Decision17ProtectedBoundarySnapshot): string[] {
  return validateDecision17ProtectedBoundary(snapshot).map(
    (entry) => entry.code,
  );
}

describe("Decision 17 protected regression contract", () => {
  it("accepts the exact authorized-start protected summary", () => {
    expect(validateDecision17ProtectedBoundary(validSnapshot())).toEqual([]);
  });

  it("rejects case-byte, clinical aggregate, and owner-lineage drift", () => {
    const snapshot = validSnapshot();
    snapshot.caseByteMismatches = ["src/content/cases/fictional.json"];
    snapshot.clinicalAggregateSha256 = "0".repeat(64);
    snapshot.approvedCoreLineageMismatches = ["fictional-case"];
    expect(codes(snapshot)).toEqual(
      expect.arrayContaining([
        "decision17-clinical-freeze",
        "decision17-approved-core-lineage",
      ]),
    );
  });

  it("rejects a changed cover byte, selection ledger, or registry", () => {
    const snapshot = validSnapshot();
    snapshot.coverByteMismatches = ["src/assets/players/changed.jpg"];
    snapshot.coverAssetLedgerSha256 = "1".repeat(64);
    snapshot.playerPhotoRegistryV8Sha256 = "2".repeat(64);
    expect(codes(snapshot)).toContain("decision17-cover-freeze");
  });

  it("rejects every video-source membership drift", () => {
    for (const token of Object.keys(DECISION_17_VIDEO_SOURCE_MEMBERSHIP)) {
      const snapshot = validSnapshot();
      snapshot.videoSourceMembership[token] = [];
      expect(codes(snapshot)).toContain("decision17-video-source-partition");
    }
  });

  it("rejects a disabled CC BY-SA composition firewall", () => {
    const snapshot = validSnapshot();
    snapshot.bySaCompositionFirewallActive = false;
    expect(codes(snapshot)).toContain("decision17-by-sa-firewall");
  });

  it("rejects NBA navigation sinks and missing digest DOM values", () => {
    const snapshot = validSnapshot();
    snapshot.nbaNavigationSinks = ["anchor:https://www.nba.com/news/example"];
    snapshot.digestDomMissingValues = ["case-content-digest"];
    expect(codes(snapshot)).toEqual(
      expect.arrayContaining([
        "decision17-nba-navigation-sink",
        "decision17-digest-dom",
      ]),
    );
  });

  it("rejects any newly manufactured medical approval state", () => {
    const snapshot = validSnapshot();
    snapshot.unauthorizedMedicalApprovalStates = ["fictional-item:approved"];
    expect(codes(snapshot)).toContain(
      "decision17-unauthorized-medical-approval",
    );
  });
});
