import "./prepare-quality-review";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { validateSemanticReviewReceipt } from "../src/lib/videos/quality-review";

const review = JSON.parse(
  readFileSync("docs/reviews/2026-11-18-followup/semantic-review.json", "utf8"),
);
// The import above rebuilds this queue from the current catalog, never from a stale export.
const queue = JSON.parse(
  readFileSync("output/site-quality-validation/content-review.json", "utf8"),
);
const claims = new Map<string, any>(
  queue.entries.flatMap((entry: any) =>
    entry.claims.map((claim: any) => [claim.id, claim]),
  ),
);
const seen = new Set<string>();
for (const item of review.current) {
  assert.ok(!seen.has(item.receipt.claimId), "Duplicate current receipt");
  seen.add(item.receipt.claimId);
  const claim = claims.get(item.receipt.claimId);
  assert.ok(claim, "Claim is no longer in the current catalog");
  validateSemanticReviewReceipt(item.receipt, claim, {
    evidence: item.evidenceText,
    allowedReviewerIds: new Set(["codex-source-assistant"]),
    now: new Date().toISOString(),
  });
  assert.deepEqual(item.claim, claim, "Snapshot differs from current claim");
  const evidence = JSON.parse(item.evidenceText);
  assert.equal(evidence.claimId, claim.id);
  assert.deepEqual(
    evidence.sources.map((source: any) => source.id),
    claim.citations.map((source: any) => source.id),
  );
  assert.deepEqual(
    evidence.sources.map((source: any) => source.url),
    claim.citations.map((source: any) => source.url),
  );
}
for (const item of review.supersededCorrections) {
  validateSemanticReviewReceipt(item.receipt, item.claim, {
    evidence: item.evidenceText,
    allowedReviewerIds: new Set(["codex-source-assistant"]),
    now: new Date().toISOString(),
  });
  assert.equal(item.receipt.decision, "needs-correction");
  assert.notEqual(
    claims.get(item.receipt.claimId)?.digest,
    item.claim.digest,
    "Correction has not changed the old binding",
  );
}
assert.equal(review.summary.currentClaims, review.current.length);
for (const decision of ["supported", "unverifiable"]) {
  assert.equal(
    review.summary[decision],
    review.current.filter((item: any) => item.receipt.decision === decision)
      .length,
  );
}
console.log(
  JSON.stringify(
    { ...review.summary, receiptBindings: "valid", clinicalApproval: false },
    null,
    2,
  ),
);
