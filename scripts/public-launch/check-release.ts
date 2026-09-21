import {
  allObservationClips,
  recent120,
  recent150,
  expansion,
  expandedCaseAllowed,
} from "../../src/lib/videos/expansion";
import assert from "node:assert/strict";
import {
  scanBrandAssets,
  validateBrandAssetPolicy,
} from "../verify-brand-assets";
import { existsSync, readFileSync } from "node:fs";
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
process.env.ATLAS_PUBLIC_LAUNCH = "decision-21";
for (const item of [...approval.cases, ...expansion.cases]) {
  const record = records.find((candidate) => candidate.id === item.id);
  assert.ok(
    record &&
      (launchCaseAllowed(record, approval) || expandedCaseAllowed(record)),
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
  if (expansion.cases.some((c) => c.id === item.id)) continue;
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

const additional = JSON.parse(
  readFileSync(
    "docs/reviews/evidence/decision-23/playback.preview.v1.json",
    "utf8",
  ),
);
const additionsProof = JSON.parse(
  readFileSync(
    "docs/reviews/evidence/decision-27/playback.preview.json",
    "utf8",
  ),
);
const curationProof = JSON.parse(
  readFileSync(
    "docs/reviews/evidence/decision-28/playback.preview.json",
    "utf8",
  ),
);
const batch30Proof = JSON.parse(
  readFileSync(
    "docs/reviews/evidence/decision-30/playback.preview.json",
    "utf8",
  ),
);
const batch31Proof = JSON.parse(
  readFileSync(
    "docs/reviews/evidence/decision-31/playback.preview.json",
    "utf8",
  ),
);
const batch32Proof = JSON.parse(
  readFileSync(
    "docs/reviews/evidence/decision-32/playback.preview.json",
    "utf8",
  ),
);
const batch34Proof = JSON.parse(
  readFileSync(
    "docs/reviews/evidence/decision-34/playback.preview.json",
    "utf8",
  ),
);
const recent120Proof = JSON.parse(
  readFileSync(
    "docs/reviews/2026-09-12-recent-120/playback.preview.json",
    "utf8",
  ),
);
const recent150Proof = JSON.parse(
  readFileSync(
    "docs/reviews/2026-09-13-recent-150/playback.preview.json",
    "utf8",
  ),
);
const judgeRibProofPath =
  "docs/reviews/2026-09-18-judge-rib/playback.preview.json";
const judgeRibProof = existsSync(judgeRibProofPath)
  ? JSON.parse(readFileSync(judgeRibProofPath, "utf8"))
  : [];
const ribFractureProofPath =
  "docs/reviews/2026-09-20-rib-fracture/playback.preview.json";
const ribFractureProof = existsSync(ribFractureProofPath)
  ? JSON.parse(readFileSync(ribFractureProofPath, "utf8"))
  : [];
const nerveFourProofPath =
  "docs/reviews/2026-09-21-nerve-four/playback.preview.json";
const nerveFourProof = existsSync(nerveFourProofPath)
  ? JSON.parse(readFileSync(nerveFourProofPath, "utf8"))
  : [];
const catalog200ProofPath =
  "docs/reviews/2026-09-21-catalog-200/playback.preview.json";
const catalog200Proof = existsSync(catalog200ProofPath)
  ? JSON.parse(readFileSync(catalog200ProofPath, "utf8"))
  : [];
for (const item of [...expansion.cases, ...allObservationClips]) {
  const proof = [
    ...additional,
    ...additionsProof,
    ...curationProof,
    ...batch30Proof,
    ...batch31Proof,
    ...batch32Proof,
    ...batch34Proof,
    ...recent120Proof,
    ...recent150Proof,
    ...judgeRibProof,
    ...ribFractureProof,
    ...nerveFourProof,
    ...catalog200Proof,
  ].find((p: { url: string }) => p.url === item.videoUrl);
  assert.ok(
    proof &&
      proof.status === "played" &&
      !proof.error &&
      proof.after.time > proof.before.time &&
      !proof.after.paused &&
      proof.after.readyState >= 3,
    `New playback missing: ${item.videoUrl}`,
  );
  const playbackOrigin = new URL(proof.origin);
  assert.ok(
    playbackOrigin.protocol === "https:" &&
      (playbackOrigin.hostname === "sports-injury-atlas.pages.dev" ||
        playbackOrigin.hostname.endsWith(".sports-injury-atlas.pages.dev")),
    "New playback must be verified on the owned HTTPS site or preview",
  );
  assert.equal(
    proof.path,
    `${"startSeconds" in item ? "/videos/" : "/cases/"}${item.slug}/`,
  );
  const age = Date.now() - Date.parse(proof.checkedAt);
  assert.ok(
    age >= 0 && age < 7 * 86400000,
    `Refresh new playback: ${item.videoUrl}`,
  );
  if ("startSeconds" in item)
    assert.ok(
      proof.after.time >= item.startSeconds,
      `Playback before selected segment: ${item.videoUrl}`,
    );
}
console.log(
  `Video expansions: ${expansion.cases.length + allObservationClips.length} additional videos (${recent120.clips.length + recent150.clips.length} recent cases); source records preserved.`,
);

// All displayed events require an independently checked source summary bound to the exact video.
const { eventUpdates, eventUpdateFor } =
  await import("../../src/lib/videos/event-updates");
const selectedEvents = [
  ...records
    .filter((r) =>
      [...approval.cases, ...expansion.cases].some((c) => c.id === r.id),
    )
    .map((r) => ({
      slug: r.slug,
      videoUrl: r.video.canonicalUrl,
      eventDate: r.eventDate,
    })),
  ...allObservationClips,
];
assert.deepEqual(
  eventUpdates.entries.map((e) => e.slug).sort(),
  selectedEvents.map((e) => e.slug).sort(),
  "Event update coverage mismatch",
);
for (const item of selectedEvents)
  assert.ok(
    eventUpdateFor(item.slug, item.videoUrl, item.eventDate),
    `Missing sourced event update: ${item.slug}`,
  );
console.log(
  `Source reporting: ${selectedEvents.length} event bindings validated; original clinical approvals unchanged.`,
);

const { videoContentTypes, contentTypeEntryFor } =
  await import("../../src/lib/videos/content-types");
assert.equal(
  videoContentTypes.status,
  "reviewed",
  "Video types remain a draft",
);
assert.deepEqual(
  videoContentTypes.entries.map((entry) => entry.slug).sort(),
  selectedEvents.map((entry) => entry.slug).sort(),
  "Video content-type coverage mismatch",
);
for (const item of selectedEvents) {
  const entry = contentTypeEntryFor(item.slug, item.videoUrl);
  assert.ok(entry, `Missing exact video content-type binding: ${item.slug}`);
  assert.ok(
    Date.parse(entry.reviewedAt) <= Date.now(),
    `Future content review: ${item.slug}`,
  );
  for (const reference of entry.evidenceRefs) {
    const [file, pointer] = reference.split("#");
    assert.ok(
      pointer && reference.split("#").length === 2,
      `Content evidence must identify an exact row: ${reference}`,
    );
    assert.ok(
      file.startsWith("docs/reviews/") &&
        !file.includes("..") &&
        existsSync(file),
      `Missing content evidence: ${reference}`,
    );
    if (pointer) {
      assert.ok(
        pointer.startsWith("/"),
        `Invalid content evidence pointer: ${reference}`,
      );
      let evidence: unknown = JSON.parse(readFileSync(file, "utf8"));
      for (const part of pointer.slice(1).split("/")) {
        const key = part.replace(/~1/g, "/").replace(/~0/g, "~");
        assert.ok(
          evidence !== null &&
            typeof evidence === "object" &&
            Object.hasOwn(evidence, key),
          `Unresolved content evidence: ${reference}`,
        );
        evidence = (evidence as Record<string, unknown>)[key];
      }
      const binding = evidence as {
        slug?: string;
        videoUrl?: string;
        tags?: string[];
        segments?: unknown[];
      };
      assert.equal(
        binding.slug,
        item.slug,
        `Content evidence slug mismatch: ${reference}`,
      );
      assert.equal(
        binding.videoUrl,
        item.videoUrl,
        `Content evidence URL mismatch: ${reference}`,
      );
      assert.deepEqual(
        binding.tags,
        entry.tags,
        `Content labels differ from reviewed evidence: ${reference}`,
      );
      assert.deepEqual(
        binding.segments ?? [],
        entry.segments ?? [],
        `Content segments differ from reviewed evidence: ${reference}`,
      );
    }
  }
}
console.log(
  `Video content types: ${selectedEvents.length} reviewed exact video bindings validated.`,
);
