import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  patientGuides,
  patientGuideSchema,
  patientGuideDigest,
  isPatientGuideApproved,
  patientGuideFor,
} from "../../src/lib/patient/guides";
import {
  hasPublicEmbed,
  videoFirstCases,
} from "../../src/lib/patient/featured";
import { actualReturnSummary } from "../../src/lib/patient/actual-return";
import {
  applyFollowUpApprovals,
  followUpApprovalLedgerSchema,
} from "../../src/lib/cases/follow-up-approval-ledger";
import type { InjuryCase } from "../../src/lib/contracts/case";
import type { CaseFollowUp } from "../../src/lib/contracts/case-follow-up";
const read = (path: string) =>
  JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"));
const simons: InjuryCase = read(
  "src/content/cases/anfernee-simons-ankle-sprain-2023.json",
);

describe("patient guide publication", () => {
  it("requires current source-bound patient approval", () => {
    expect(patientGuides).toHaveLength(3);
    for (const guide of patientGuides) {
      expect(patientGuideSchema.safeParse(guide).success).toBe(true);
      expect(isPatientGuideApproved(guide)).toBe(true);
      expect(patientGuideFor(guide.injuryCode, "public")).toBe(guide);
    }
  });
  it("invalidates approval after a timing or source change", () => {
    const guide = structuredClone(patientGuides[0]!);
    guide.review = {
      status: "approved",
      reviewedBy: "Synthetic Reviewer",
      reviewedAt: "2026-09-06",
      contentDigest: patientGuideDigest(guide),
    };
    expect(isPatientGuideApproved(guide)).toBe(true);
    guide.returnRanges[0]!.value = "different time";
    expect(isPatientGuideApproved(guide)).toBe(false);
  });
  it("rejects missing evidence references", () => {
    const guide = structuredClone(patientGuides[0]!);
    guide.immediate[0]!.sourceIds = ["not-a-source"];
    expect(patientGuideSchema.safeParse(guide).success).toBe(false);
  });
});

describe("embed-first discovery", () => {
  it("requires captions and respects Taiwan restrictions", () => {
    expect(hasPublicEmbed(simons)).toBe(true);
    const blocked = structuredClone(simons);
    blocked.video.canonicalUrl = "https://www.youtube.com/watch?v=V9mtX4mE8wQ";
    expect(hasPublicEmbed(blocked)).toBe(false);
    blocked.video.canonicalUrl = simons.video.canonicalUrl;
    blocked.video.captionStatus = "unavailable";
    expect(hasPublicEmbed(blocked)).toBe(false);
    expect(videoFirstCases([blocked, simons])[0]).toBe(simons);
  });
  it("does not constrain discovery to NBA, basketball, or an injury quota", () => {
    const other = structuredClone(simons);
    other.sport.code = "football";
    other.league.code = "community-league";
    other.injury.code = "hamstring-strain";
    expect(hasPublicEmbed(other)).toBe(true);
  });
});

describe("actual participation summary", () => {
  const raw: CaseFollowUp = read(
    "src/content/follow-ups/anfernee-simons-ankle-sprain-2023.json",
  );
  const ledger = followUpApprovalLedgerSchema.parse(
    read("review/follow-up-approvals/decision-20.ledger.v1.json"),
  );
  it("shows only signed official dates and computes UTC elapsed days", () => {
    expect(actualReturnSummary(simons, raw)).toBeNull();
    const approved = applyFollowUpApprovals(raw, ledger);
    expect(actualReturnSummary(simons, approved, "2026-09-06")).toMatchObject({
      date: "2023-03-10",
      elapsedDays: 24,
    });
    expect(actualReturnSummary(simons, approved, "2023-03-01")).toBeNull();
  });
  it("suppresses stale, mismatched, or altered facts instead of inventing a date", () => {
    const approved = applyFollowUpApprovals(raw, ledger);
    approved.categories["actual-return"][0]!.factDate = "2023-03-11";
    expect(actualReturnSummary(simons, approved)).toBeNull();
    expect(actualReturnSummary(simons, undefined)).toBeNull();
    approved.caseId = "different-case";
    expect(actualReturnSummary(simons, approved)).toBeNull();
  });
});
