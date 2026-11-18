/** Build only; uploading is a separate explicit operation after artifact verification. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { checkDependencies } from "../security/check-dependencies.mjs";
import { containPicomatch } from "../security/picomatch-containment.mjs";
import {
  loadReleaseAuthorization,
  RELEASE_AUTHORIZATION_ID,
} from "./release-authorization";

assert.equal(process.env.ATLAS_RELEASE_AUTHORIZATION, RELEASE_AUTHORIZATION_ID);
assert.notEqual(process.env.ATLAS_PUBLIC_PREVIEW, "1");
containPicomatch();
// This retains the actual failed audit. The scoped loader rejects every other advisory/error.
checkDependencies();
const authorization = loadReleaseAuthorization();
assert.ok(authorization);
console.log(
  `Owner-authorized release ${authorization.id}: audit exception; current playback deferred; no new clinical approval.`,
);
const run = (args: string[], env = process.env) =>
  execFileSync(process.execPath, args, { stdio: "inherit", env });
run(["--import", "tsx", "scripts/public-launch/check-release.ts"]);
run(["node_modules/.bin/astro", "build"], {
  ...process.env,
  ATLAS_BUILD_MODE: "public",
  ATLAS_PUBLIC_LAUNCH: "decision-21",
});
run(["--import", "tsx", "scripts/public-launch/check-artifact.ts"]);
