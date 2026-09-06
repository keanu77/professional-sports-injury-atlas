import type { InjuryCase } from "../contracts/case";
import type { CaseFollowUp } from "../contracts/case-follow-up";
import { computeCaseContentDigest } from "../cases/digest";
import { computeFollowUpItemPayloadDigest } from "../cases/follow-up-digest";

/** Project only digest-bound, approved official participation facts. Never infer first return. */
export function actualReturnSummary(
  record: InjuryCase,
  followUp: CaseFollowUp | undefined,
  today = new Date().toISOString().slice(0, 10),
) {
  if (
    !followUp ||
    followUp.caseId !== record.id ||
    followUp.caseClinicalDigest !== computeCaseContentDigest(record)
  )
    return null;
  const items = followUp.categories["actual-return"]
    .filter(
      (item) =>
        item.kind === "actual-return" &&
        item.sourceTier === "team-or-league-official" &&
        item.review.status === "owner-approved" &&
        item.factDate !== null &&
        item.factDate >= record.eventDate &&
        item.factDate <= today &&
        item.itemPayloadDigest === computeFollowUpItemPayloadDigest(item) &&
        item.review.reviewedPayloadDigest === item.itemPayloadDigest,
    )
    .sort(
      (a, b) =>
        a.factDate!.localeCompare(b.factDate!) || a.id.localeCompare(b.id),
    );
  const item = items[0];
  if (!item?.factDate) return null;
  const elapsedDays =
    (Date.parse(item.factDate + "T00:00:00Z") -
      Date.parse(record.eventDate + "T00:00:00Z")) /
    86400000;
  if (!Number.isInteger(elapsedDays) || elapsedDays < 0) return null;
  return {
    date: item.factDate,
    elapsedDays,
    statement: item.attributedStatement,
    source: item.source,
  };
}
