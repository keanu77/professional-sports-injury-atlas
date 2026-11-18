import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const auditArgs = [
  "audit",
  "--json",
  "--audit-level=high",
  "--package-lock-only",
  "--include=dev",
  "--include=optional",
  "--include=peer",
];

// A command or registry failure must never be reported as zero vulnerabilities.
export function assessAudit(result) {
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    /* rejected below */
  }
  const counts = report?.metadata?.vulnerabilities;
  const keys = ["info", "low", "moderate", "high", "critical", "total"];
  const levels = keys.slice(0, -1);
  const entries = report?.vulnerabilities;
  const validEntries =
    entries &&
    typeof entries === "object" &&
    !Array.isArray(entries) &&
    Object.entries(entries).every(
      ([name, entry]) =>
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        entry.name === name &&
        levels.includes(entry.severity),
    );
  const valid = Boolean(
    report?.auditReportVersion === 2 &&
    !report.error &&
    validEntries &&
    keys.every((key) => Number.isInteger(counts?.[key]) && counts[key] >= 0) &&
    counts.total ===
      keys.slice(0, -1).reduce((sum, key) => sum + counts[key], 0) &&
    Object.keys(entries).length === counts.total &&
    levels.every(
      (level) =>
        counts[level] ===
        Object.values(entries).filter((entry) => entry.severity === level)
          .length,
    ),
  );
  const blocked = !valid || counts.high > 0 || counts.critical > 0;
  const passed =
    valid && !blocked && result.status === 0 && !result.error && !result.signal;
  return {
    passed,
    reason: !valid
      ? "invalid-or-unavailable-audit"
      : blocked
        ? "high-or-critical-vulnerabilities"
        : !passed
          ? "audit-command-failed"
          : "audit-passed",
    counts: valid ? counts : null,
  };
}

export function checkDependencies(root = process.cwd()) {
  const output = resolve(root, "artifacts/dependency-security");
  mkdirSync(output, { recursive: true });
  const result = spawnSync("npm", auditArgs, {
    cwd: root,
    encoding: "utf8",
    timeout: 60_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  writeFileSync(resolve(output, "audit.json"), result.stdout || "");
  const assessment = assessAudit(result);
  const summary = {
    schemaVersion: 1,
    checkedAt: new Date().toISOString(),
    sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    sourceDirty:
      execFileSync("git", ["status", "--porcelain"], {
        cwd: root,
        encoding: "utf8",
      }).trim().length > 0,
    lockSha256: createHash("sha256")
      .update(readFileSync(resolve(root, "package-lock.json")))
      .digest("hex"),
    command: ["npm", ...auditArgs],
    exitCode: result.status,
    signal: result.signal,
    ...assessment,
    scope:
      "lockfile-dependency-audit; not runtime reachability or a patch receipt",
  };
  writeFileSync(
    resolve(output, "summary.json"),
    JSON.stringify(summary, null, 2) + "\n",
  );
  console.log(JSON.stringify(summary, null, 2));
  return assessment.passed ? 0 : 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  process.exitCode = checkDependencies();
}
