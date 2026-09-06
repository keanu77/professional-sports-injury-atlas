import assert from "node:assert/strict";
import {
  scanBrandAssets,
  validateBrandAssetPolicy,
} from "../verify-brand-assets";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { loadContentCollections, runContentCheck } from "../check-content";
import {
  launchApprovalSchema,
  launchCaseAllowed,
} from "../../src/lib/patient/public-launch";
import { validateCaseForApproval } from "../../src/lib/cases/review-validation";
import {
  isPatientGuideApproved,
  patientGuides,
} from "../../src/lib/patient/guides";
import { sha256Hex } from "../../src/lib/contracts/canonical";
import { inputTreeDigest } from "./input-tree";

const approval = launchApprovalSchema.parse(
  JSON.parse(readFileSync("src/data/public-launch.v1.json", "utf8")),
);
assert.equal(
  execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim(),
  "",
  "Release requires a clean committed tree",
);
assert.equal(
  approval.inputTreeDigest,
  inputTreeDigest(),
  "Release inputs changed after artifact preparation",
);
assert.equal(
  approval.reviewPacketDigest,
  sha256Hex(
    readFileSync("docs/reviews/2026-09-06-decision-21-patient-review.md"),
  ),
  "Reviewed patient packet changed",
);
assert.ok(Date.parse(approval.recordedAt) <= Date.now(), "Future approval");
assert.ok(
  patientGuides.every(isPatientGuideApproved),
  "Patient text changed since medical review",
);
assert.deepEqual(
  runContentCheck(),
  [],
  "Existing source, clinical and D20 follow-up validation must pass",
);
assert.deepEqual(
  [
    ...validateBrandAssetPolicy(process.cwd()),
    ...scanBrandAssets(process.cwd()),
  ],
  [],
  "Photo provenance, source policy and brand checks must pass",
);
const records = loadContentCollections().cases.map((entry) => entry.record);
assert.equal(
  new Set(approval.cases.map((item) => item.id)).size,
  approval.cases.length,
  "Duplicate release case",
);
const evidence = JSON.parse(
  readFileSync(
    "docs/reviews/evidence/decision-21/playback.chrome.v1.json",
    "utf8",
  ),
);
for (const item of approval.cases) {
  const record = records.find((candidate) => candidate.id === item.id);
  assert.ok(
    record && launchCaseAllowed(record, approval),
    `Case/video binding changed: ${item.id}`,
  );
  assert.deepEqual(
    validateCaseForApproval(record),
    [],
    `Unapproved clinical core: ${item.id}`,
  );
  const guide = patientGuides.find(
    (guide) => guide.injuryCode === record.injury.code,
  );
  assert.ok(
    guide && isPatientGuideApproved(guide),
    `Missing reviewed guide: ${item.id}`,
  );
  const proof = evidence.find(
    (entry: { caseId: string; url: string }) =>
      entry.caseId === item.id && entry.url === item.videoUrl,
  );
  assert.ok(
    proof &&
      proof.status === "played" &&
      proof.after.time > proof.before.time &&
      !proof.after.paused &&
      proof.after.readyState >= 3 &&
      /字幕\/CC 已開啟|Turn off subtitles/i.test(proof.captionToggleAfter),
    `Playback/caption evidence missing: ${item.id}`,
  );
  const age = Date.now() - Date.parse(proof.checkedAt);
  assert.ok(
    age >= 0 && age < 7 * 86400000,
    `Refresh playback within 7 days: ${item.id}`,
  );
}
console.log(
  `Decision 21: ${approval.cases.length} approved native embeds; patient approval, source provenance, D20 facts, input hashes and playback passed.`,
);
