/** Explicit, short-lived owner exception for this release only. Default gates stay intact. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "astro/zod";
import { sha256Hex } from "../../src/lib/contracts/canonical";
import { publicInventoryDigest } from "../../src/lib/videos/public-inventory";
import { loadPublicVideoInventory } from "../lib/public-video-inventory";
import { assessAudit } from "../security/check-dependencies.mjs";
import { containPicomatch } from "../security/picomatch-containment.mjs";
import { inputTreeDigest, isReleaseInputPath } from "./input-tree";
import {
  assertPlaybackSourceInputsUnchanged,
  readPlaybackEvidenceFile,
} from "./current-playback";

export const RELEASE_AUTHORIZATION_ID = "2026-11-19-owner-exception";
export const RELEASE_AUTHORIZATION_PATH =
  "docs/reviews/2026-11-19-release/authorization.json";
export const RELEASE_DEPLOYMENT_PATH =
  "docs/reviews/2026-11-19-release/deployment.json";
export const AUTHORIZED_CANDIDATE = "ab3f0484d8f4e14405d46f05d9324ec6c970c2e4";
export const ALLOWED_ADVISORY =
  "https://github.com/advisories/GHSA-fc5q-39xc-vjpf";
const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const releaseAuthorizationSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: z.literal(RELEASE_AUTHORIZATION_ID),
  candidateCommit: z.literal(AUTHORIZED_CANDIDATE),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
  authorizedAt: z.iso.datetime({ offset: true }),
  expiresAt: z.iso.datetime({ offset: true }),
  approvalQuote: z.literal("允許"),
  approvalQuestion: z.string().min(20).max(1000),
  inputTreeDigest: hash,
  lockSha256: hash,
  catalogDigest: hash,
  clinicalApprovalSha256: hash,
  playbackRegistrySha256: hash,
  publicVideoCount: z.literal(203),
  allowedAdvisory: z.literal(ALLOWED_ADVISORY),
  deferCurrentPlayback: z.literal(true),
  clinicalApprovalChanges: z.literal(false),
  project: z.literal("sports-injury-atlas"),
  origin: z.literal("https://injury.sportsmedicine.tw"),
});
export type ReleaseAuthorization = z.infer<typeof releaseAuthorizationSchema>;

export function assertAuthorizedCandidateChanges(paths: string[]) {
  const protectedEvidence = new Set([
    "src/data/public-launch.v1.json",
    "docs/reviews/current-playback.v1.json",
  ]);
  assert.ok(
    !paths.some((path) => protectedEvidence.has(path)),
    "Clinical approval or pending playback changed from the authorized candidate",
  );
  const permittedPreparation = new Set([
    "scripts/public-launch/release-authorization.ts",
    "scripts/public-launch/release-with-authorization.ts",
    "scripts/public-launch/check-release.ts",
    "scripts/public-launch/check-artifact.ts",
  ]);
  assert.ok(
    paths
      .filter(isReleaseInputPath)
      .every((path) => permittedPreparation.has(path)),
    "Application changed beyond the authorized candidate and release preparation",
  );
}

export function assertAuthorizationTime(
  authorization: ReleaseAuthorization,
  now = Date.now(),
) {
  const start = Date.parse(authorization.authorizedAt);
  const end = Date.parse(authorization.expiresAt);
  assert.ok(
    start <= now && now < end && end > start && end - start <= 86400000,
    "Release authorization is future, expired or longer than 24 hours",
  );
}

/** Every advisory leaf must be the accepted GHSA; an unrelated risk or invalid report still blocks. */
export function assertOnlyAcceptedAdvisory(report: unknown) {
  const assessment = assessAudit({
    stdout: JSON.stringify(report),
    status: 1,
    signal: null,
  });
  assert.equal(
    assessment.reason,
    "high-or-critical-vulnerabilities",
    "Exception requires a complete vulnerability audit",
  );
  assert.equal(
    assessment.counts?.critical,
    0,
    "Critical vulnerabilities are not accepted",
  );
  const entries = (
    report as {
      vulnerabilities: Record<string, { severity: string; via: unknown[] }>;
    }
  ).vulnerabilities;
  for (const [name, entry] of Object.entries(entries)) {
    assert.equal(
      entry.severity,
      "high",
      `Unexpected vulnerability severity: ${name}`,
    );
    assert.ok(
      Array.isArray(entry.via) && entry.via.length > 0,
      `Missing advisory chain: ${name}`,
    );
    for (const via of entry.via) {
      if (typeof via === "string")
        assert.ok(
          Object.hasOwn(entries, via),
          `Unknown advisory dependency: ${via}`,
        );
      else {
        assert.ok(
          via && typeof via === "object" && !Array.isArray(via),
          "Invalid advisory leaf",
        );
        const leaf = via as {
          url?: string;
          name?: string;
          dependency?: string;
          severity?: string;
        };
        assert.equal(leaf.url, ALLOWED_ADVISORY, "Unaccepted advisory");
        assert.equal(leaf.name, "picomatch");
        assert.equal(leaf.dependency, "picomatch");
        assert.equal(leaf.severity, "high");
      }
    }
  }
  const reachesAccepted = (name: string, seen = new Set<string>()): boolean => {
    if (seen.has(name)) return false;
    const next = new Set([...seen, name]);
    return entries[name].via.some(
      (via) => typeof via !== "string" || reachesAccepted(via, next),
    );
  };
  for (const name of Object.keys(entries))
    assert.ok(
      reachesAccepted(name),
      `Advisory cycle without accepted cause: ${name}`,
    );
}

export function loadReleaseAuthorization(
  root = process.cwd(),
  value = process.env.ATLAS_RELEASE_AUTHORIZATION,
): ReleaseAuthorization | null {
  if (value === undefined) return null;
  assert.equal(
    value,
    RELEASE_AUTHORIZATION_ID,
    "Unknown release authorization",
  );
  assert.ok(
    !existsSync(join(root, RELEASE_DEPLOYMENT_PATH)),
    "This release authorization has already been used",
  );
  const authorization = releaseAuthorizationSchema.parse(
    JSON.parse(
      readPlaybackEvidenceFile(
        root,
        RELEASE_AUTHORIZATION_PATH,
        65536,
      ).toString("utf8"),
    ),
  );
  assertAuthorizationTime(authorization);
  assert.equal(
    execFileSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    "",
    "Authorized release requires a clean committed tree",
  );
  assertPlaybackSourceInputsUnchanged(root, authorization.sourceCommit);
  execFileSync(
    "git",
    [
      "merge-base",
      "--is-ancestor",
      AUTHORIZED_CANDIDATE,
      authorization.sourceCommit,
    ],
    { cwd: root, stdio: "ignore" },
  );
  const changed = execFileSync(
    "git",
    ["diff", "--no-renames", "--name-only", "-z", AUTHORIZED_CANDIDATE, "HEAD"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean);
  assertAuthorizedCandidateChanges(changed);
  assert.equal(
    authorization.inputTreeDigest,
    inputTreeDigest(root),
    "Authorized release inputs changed",
  );
  const digestFile = (path: string) =>
    sha256Hex(readFileSync(join(root, path)));
  assert.equal(authorization.lockSha256, digestFile("package-lock.json"));
  assert.equal(
    authorization.clinicalApprovalSha256,
    digestFile("src/data/public-launch.v1.json"),
    "Historical clinical approval changed",
  );
  assert.equal(
    authorization.playbackRegistrySha256,
    sha256Hex(
      readPlaybackEvidenceFile(
        root,
        "docs/reviews/current-playback.v1.json",
        65536,
      ),
    ),
    "Playback registry changed",
  );
  const inventory = loadPublicVideoInventory(root);
  assert.equal(inventory.length, authorization.publicVideoCount);
  assert.equal(
    publicInventoryDigest(inventory),
    authorization.catalogDigest,
    "Authorized catalog changed",
  );
  containPicomatch(root);
  const audit = JSON.parse(
    readFileSync(
      join(root, "artifacts/dependency-security/audit.json"),
      "utf8",
    ),
  );
  const summary = JSON.parse(
    readFileSync(
      join(root, "artifacts/dependency-security/summary.json"),
      "utf8",
    ),
  );
  assert.equal(
    summary.sourceCommit,
    execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    "Audit belongs to another commit",
  );
  assert.equal(summary.sourceDirty, false);
  assert.equal(summary.lockSha256, authorization.lockSha256);
  assert.equal(
    summary.exitCode,
    1,
    "Audit must have completed with vulnerability exit status",
  );
  assert.equal(summary.signal, null);
  assert.equal(summary.passed, false, "Do not relabel the audit as passed");
  const age = Date.now() - Date.parse(summary.checkedAt);
  assert.ok(age >= 0 && age < 600000, "Refresh the audit within ten minutes");
  assertOnlyAcceptedAdvisory(audit);
  return authorization;
}
