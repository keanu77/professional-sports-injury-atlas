/** Independent digests for Decision 17 pending follow-up drafts. */

import { canonicalJson, sha256Hex } from "../contracts/canonical";
import type { CaseFollowUp, FollowUpItem } from "../contracts/case-follow-up";

export type FollowUpItemPayload = Omit<
  FollowUpItem,
  "itemPayloadDigest" | "review"
>;

/** Explicit payload projection; review metadata and the digest itself stay out. */
export function followUpItemPayload(item: FollowUpItem): FollowUpItemPayload {
  return {
    id: item.id,
    kind: item.kind,
    attributedStatement: item.attributedStatement,
    factDate: item.factDate,
    sourceTier: item.sourceTier,
    source: { ...item.source },
    tierBasis: item.tierBasis,
    researchEvidenceId: item.researchEvidenceId,
    sourcePolicyBinding: { ...item.sourcePolicyBinding },
  };
}

export function computeFollowUpItemPayloadDigest(item: FollowUpItem): string {
  return sha256Hex(canonicalJson(followUpItemPayload(item)));
}

/**
 * Aggregate draft digest over the complete strict sidecar. The aggregate is
 * deliberately not stored in the sidecar, so this cannot be self-referential.
 */
export function computeFollowUpDraftDigest(sidecar: CaseFollowUp): string {
  return sha256Hex(canonicalJson(sidecar));
}
