import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyFollowUpApprovals,
  followUpApprovalLedgerSchema,
  followUpAdoptionReceiptSchema,
  FOLLOW_UP_APPROVAL_LEDGER_PATH,
  FOLLOW_UP_ADOPTION_RECEIPT_PATH,
  followUpReviewStatus,
  loadReviewFollowUpCorpus,
} from "../../src/lib/cases/follow-up-approval-ledger";
import {
  computeFollowUpDraftDigest,
  computeFollowUpItemPayloadDigest,
  followUpItemPayload,
} from "../../src/lib/cases/follow-up-digest";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  type CaseFollowUp,
} from "../../src/lib/contracts/case-follow-up";

const root = process.cwd();
const read = (path: string) =>
  JSON.parse(readFileSync(join(root, path), "utf8"));
const ledger = followUpApprovalLedgerSchema.parse(
  read(FOLLOW_UP_APPROVAL_LEDGER_PATH),
);
const sidecars: CaseFollowUp[] = readdirSync(
  join(root, "src/content/follow-ups"),
)
  .filter((p) => p.endsWith(".json"))
  .map((p) => read(`src/content/follow-ups/${p}`));
const allItems = (sidecar: CaseFollowUp) =>
  FOLLOW_UP_KINDS.flatMap((kind) => sidecar.categories[kind]);

describe("Decision 20 approval ledger", () => {
  it("approves precisely 148 inherited items without mutating frozen sidecars, facts, sources, tiers or ordering", () => {
    const before = JSON.stringify(sidecars);
    const projected = sidecars.map((sidecar) =>
      applyFollowUpApprovals(sidecar, ledger),
    );
    expect(projected.flatMap(allItems)).toHaveLength(148);
    expect(
      projected
        .flatMap(allItems)
        .every((item) => item.review.status === "owner-approved"),
    ).toBe(true);
    expect(projected.flatMap(allItems).map(followUpItemPayload)).toEqual(
      sidecars.flatMap(allItems).map(followUpItemPayload),
    );
    expect(JSON.stringify(sidecars)).toBe(before);
    for (const [index, projectedSidecar] of projected.entries()) {
      expect(computeFollowUpDraftDigest(projectedSidecar)).not.toBe(
        computeFollowUpDraftDigest(sidecars[index]!),
      );
      expect(followUpReviewStatus(projectedSidecar)).toBe("owner-approved");
    }
    expect(
      projected
        .flatMap(allItems)
        .filter((item) => item.sourceTier === "unverified-report"),
    ).toHaveLength(4);
  });

  it.each(["wording", "source", "date", "tier", "new-id", "other-case"])(
    "does not carry approval across %s changes",
    (change) => {
      const sidecar = structuredClone(sidecars[0]!);
      const item = allItems(sidecar)[0]!;
      if (change === "wording") item.attributedStatement += " changed";
      if (change === "source")
        item.source.canonicalUrl = "https://example.invalid/changed";
      if (change === "date") item.factDate = "2026-08-16";
      if (change === "tier") item.sourceTier = "unverified-report";
      if (change === "new-id") item.id += "-new";
      if (change === "other-case") sidecar.caseId += "-other";
      item.itemPayloadDigest = computeFollowUpItemPayloadDigest(item);
      // Even an already approved review stamp cannot override a missing ledger match.
      item.review = {
        status: "owner-approved",
        reviewedPayloadDigest: item.itemPayloadDigest,
        approvedByDecision: "decision-20",
        approvedAt: "2026-08-16",
      };
      const projected = applyFollowUpApprovals(sidecar, ledger);
      expect(allItems(projected)[0]!.review.status).toBe(
        "pending-owner-signoff",
      );
      expect(followUpReviewStatus(projected)).toBe("pending-owner-signoff");
    },
  );

  it("rejects duplicate entries, altered authority, wrong counts and predecessor replacement", () => {
    const duplicate = structuredClone(ledger);
    duplicate.entries[1] = duplicate.entries[0]!;
    expect(followUpApprovalLedgerSchema.safeParse(duplicate).success).toBe(
      false,
    );
    expect(
      followUpApprovalLedgerSchema.safeParse({
        ...ledger,
        entries: ledger.entries.slice(1),
      }).success,
    ).toBe(false);
    expect(
      followUpApprovalLedgerSchema.safeParse({
        ...ledger,
        authorityBinding: {
          ...ledger.authorityBinding,
          authorizationSha256: "0".repeat(64),
        },
      }).success,
    ).toBe(false);
    const receipt = read(FOLLOW_UP_ADOPTION_RECEIPT_PATH);
    receipt.predecessors[0].sha256 = "0".repeat(64);
    expect(followUpAdoptionReceiptSchema.safeParse(receipt).success).toBe(
      false,
    );
  });

  it("keeps both review artifacts outside every D18 frozen allowlist", () => {
    for (const batch of ["acl", "ankle", "achilles"]) {
      const receipt = read(
        `research/follow-ups/decision-18/batches/${batch}.receipt.v1.json`,
      );
      expect(receipt.allowedPaths).not.toContain(
        FOLLOW_UP_APPROVAL_LEDGER_PATH,
      );
      expect(receipt.allowedPaths).not.toContain(
        FOLLOW_UP_ADOPTION_RECEIPT_PATH,
      );
    }
  });

  it("loads the committed corpus through D18 provenance and D20 authority into the effective review state", () => {
    const cases = readdirSync(join(root, "src/content/cases"))
      .filter((p) => p.endsWith(".json"))
      .map((p) => read(`src/content/cases/${p}`));
    const corpus = loadReviewFollowUpCorpus(root, cases, {
      expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
    });
    expect(corpus.issues).toEqual([]);
    expect(corpus.entries).toHaveLength(26);
    expect(
      corpus.entries
        .flatMap((entry) => allItems(entry.sidecar))
        .filter((item) => item.review.status === "owner-approved"),
    ).toHaveLength(148);
  });
});
