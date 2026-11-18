import { describe, expect, it } from "vitest";
import {
  ALLOWED_ADVISORY,
  AUTHORIZED_CANDIDATE,
  RELEASE_AUTHORIZATION_ID,
  assertAuthorizationTime,
  assertAuthorizedCandidateChanges,
  assertOnlyAcceptedAdvisory,
  loadReleaseAuthorization,
  releaseAuthorizationSchema,
} from "../../scripts/public-launch/release-authorization";

function authorization() {
  return releaseAuthorizationSchema.parse({
    schemaVersion: 1,
    id: RELEASE_AUTHORIZATION_ID,
    candidateCommit: AUTHORIZED_CANDIDATE,
    sourceCommit: "1".repeat(40),
    authorizedAt: "2026-11-18T16:00:00Z",
    expiresAt: "2026-11-19T16:00:00Z",
    approvalQuote: "允許",
    approvalQuestion:
      "Accept only this locally contained advisory and deferred current playback for the 203-video release?",
    inputTreeDigest: "a".repeat(64),
    lockSha256: "b".repeat(64),
    catalogDigest: "c".repeat(64),
    clinicalApprovalSha256: "d".repeat(64),
    playbackRegistrySha256: "e".repeat(64),
    publicVideoCount: 203,
    allowedAdvisory: ALLOWED_ADVISORY,
    deferCurrentPlayback: true,
    clinicalApprovalChanges: false,
    project: "sports-injury-atlas",
    origin: "https://injury.sportsmedicine.tw",
  });
}

function audit() {
  return {
    auditReportVersion: 2,
    vulnerabilities: {
      picomatch: {
        name: "picomatch",
        severity: "high",
        via: [
          {
            name: "picomatch",
            dependency: "picomatch",
            url: ALLOWED_ADVISORY,
            severity: "high",
          },
        ],
      },
      vite: { name: "vite", severity: "high", via: ["picomatch"] },
      vitest: { name: "vitest", severity: "high", via: ["coverage", "vite"] },
      coverage: { name: "coverage", severity: "high", via: ["vitest"] },
    },
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: 4,
        critical: 0,
        total: 4,
      },
    },
  };
}

describe("one-release owner authorization", () => {
  it("does not accept new manifest hashes as permission to change historical approvals or the pending registry", () => {
    expect(() =>
      assertAuthorizedCandidateChanges([
        "scripts/public-launch/check-release.ts",
        "docs/reviews/2026-11-19-release/authorization.json",
      ]),
    ).not.toThrow();
    for (const path of [
      "src/data/public-launch.v1.json",
      "docs/reviews/current-playback.v1.json",
      "src/content/cases/changed.json",
      "package-lock.json",
      "functions/api/plays.ts",
    ])
      expect(() => assertAuthorizedCandidateChanges([path])).toThrow();
  });
  it("requires explicit exact opt-in before reading any files", () => {
    expect(loadReleaseAuthorization("/does-not-exist", undefined)).toBeNull();
    for (const value of ["", "1", "true", "another-release"])
      expect(() => loadReleaseAuthorization("/does-not-exist", value)).toThrow(
        "Unknown release authorization",
      );
  });
  it("accepts only the fixed catalog, project, candidate and non-clinical scope", () => {
    const record = authorization();
    for (const override of [
      { candidateCommit: "2".repeat(40) },
      { publicVideoCount: 204 },
      { clinicalApprovalChanges: true },
      { project: "other" },
      { origin: "https://example.org" },
      { approvalQuote: "assumed" },
      { allowedAdvisory: "https://github.com/advisories/OTHER" },
      { extraWaiver: true },
    ])
      expect(() =>
        releaseAuthorizationSchema.parse({ ...record, ...override }),
      ).toThrow();
  });
  it("accepts its active time window and rejects future, expired and overlong windows", () => {
    const record = authorization();
    expect(() =>
      assertAuthorizationTime(record, Date.parse("2026-11-18T17:00:00Z")),
    ).not.toThrow();
    for (const now of ["2026-11-18T15:59:59Z", "2026-11-19T16:00:00Z"])
      expect(() => assertAuthorizationTime(record, Date.parse(now))).toThrow();
    expect(() =>
      assertAuthorizationTime(
        { ...record, expiresAt: "2026-11-20T16:00:00Z" },
        Date.parse("2026-11-18T17:00:00Z"),
      ),
    ).toThrow();
  });
  it("accepts transitive dependency cycles only when they reach the accepted advisory", () => {
    expect(() => assertOnlyAcceptedAdvisory(audit())).not.toThrow();
  });
  it("rejects an unrelated advisory even within an otherwise accepted dependency", () => {
    const report = audit();
    report.vulnerabilities.picomatch.via.push({
      ...report.vulnerabilities.picomatch.via[0],
      url: "https://github.com/advisories/OTHER",
    });
    expect(() => assertOnlyAcceptedAdvisory(report)).toThrow(
      "Unaccepted advisory",
    );
  });
  it("rejects critical findings and contradictory severity counts", () => {
    const report = audit();
    report.vulnerabilities.picomatch.severity = "critical";
    expect(() => assertOnlyAcceptedAdvisory(report)).toThrow();
    report.metadata.vulnerabilities.high = 3;
    report.metadata.vulnerabilities.critical = 1;
    expect(() => assertOnlyAcceptedAdvisory(report)).toThrow(
      "Critical vulnerabilities",
    );
  });
  it("rejects empty, unavailable and malformed reports", () => {
    for (const report of [
      null,
      {},
      { error: { code: "ENOTFOUND" } },
      { ...audit(), auditReportVersion: 1 },
    ])
      expect(() => assertOnlyAcceptedAdvisory(report)).toThrow();
  });
  it("rejects advisory chains with no accepted cause", () => {
    const report = audit();
    report.vulnerabilities.vite.via = ["vitest"];
    expect(() => assertOnlyAcceptedAdvisory(report)).toThrow(
      "Advisory cycle without accepted cause",
    );
  });
  it("rejects missing dependency references and empty via arrays", () => {
    const report = audit();
    report.vulnerabilities.vite.via = ["missing"];
    expect(() => assertOnlyAcceptedAdvisory(report)).toThrow(
      "Unknown advisory dependency",
    );
    report.vulnerabilities.vite.via = [];
    expect(() => assertOnlyAcceptedAdvisory(report)).toThrow(
      "Missing advisory chain",
    );
  });
});
