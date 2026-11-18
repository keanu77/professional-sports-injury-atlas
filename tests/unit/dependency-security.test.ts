import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { assessAudit } from "../../scripts/security/check-dependencies.mjs";

function result(high = 0, critical = 0, status = 0) {
  return {
    status,
    signal: null,
    stdout: JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: Object.fromEntries(
        Array.from({ length: high + critical }, (_, i) => [
          `dependency-${i}`,
          { name: `dependency-${i}`, severity: i < high ? "high" : "critical" },
        ]),
      ),
      metadata: {
        vulnerabilities: {
          info: 0,
          low: 0,
          moderate: 0,
          high,
          critical,
          total: high + critical,
        },
      },
    }),
  };
}
describe("dependency audit fails closed", () => {
  it("accepts a complete successful audit", () =>
    expect(assessAudit(result()).passed).toBe(true));
  it.each([
    [1, 0],
    [0, 1],
    [16, 0],
  ])("blocks high %s / critical %s even with status 0", (h, c) => {
    expect(assessAudit(result(h, c)).passed).toBe(false);
  });
  it("rejects malformed, missing and registry-error reports", () => {
    for (const stdout of [
      "",
      "bad",
      "{}",
      JSON.stringify({ error: { code: "ENOTFOUND" } }),
      JSON.stringify({ metadata: { vulnerabilities: {} } }),
      JSON.stringify({
        auditReportVersion: 2,
        metadata: { vulnerabilities: {} },
      }),
    ]) {
      expect(assessAudit({ status: 0, stdout }).passed).toBe(false);
    }
  });
  it("rejects contradictory totals", () => {
    const r = result();
    const j = JSON.parse(r.stdout);
    j.metadata.vulnerabilities.total = 1;
    expect(assessAudit({ ...r, stdout: JSON.stringify(j) }).passed).toBe(false);
  });
  it("rejects high entries hidden by incorrect low metadata", () => {
    const r = result(1);
    const j = JSON.parse(r.stdout);
    j.metadata.vulnerabilities.high = 0;
    j.metadata.vulnerabilities.low = 1;
    expect(assessAudit({ ...r, stdout: JSON.stringify(j) }).passed).toBe(false);
  });
  it("rejects null entries, mismatched names and unknown severities", () => {
    for (const entry of [
      null,
      { name: "different", severity: "low" },
      { name: "dependency-0", severity: "unknown" },
    ]) {
      const r = result(1);
      const j = JSON.parse(r.stdout);
      j.vulnerabilities["dependency-0"] = entry;
      j.metadata.vulnerabilities.high = 0;
      j.metadata.vulnerabilities.low = 1;
      expect(assessAudit({ ...r, stdout: JSON.stringify(j) }).passed).toBe(
        false,
      );
    }
  });
  it("rejects process failure and timeout even with zero counts", () => {
    expect(assessAudit(result(0, 0, 1)).passed).toBe(false);
    expect(assessAudit({ ...result(), signal: "SIGTERM" }).passed).toBe(false);
    expect(
      assessAudit({ ...result(), error: new Error("timeout") }).passed,
    ).toBe(false);
  });
  it("requires the security gate before either release flow", () => {
    const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));
    for (const name of ["release:public", "release:legacy"])
      expect(scripts[name].startsWith("npm run security:check && ")).toBe(true);
    expect(
      scripts["deploy:public"].startsWith("npm run release:public && "),
    ).toBe(true);
  });
});
