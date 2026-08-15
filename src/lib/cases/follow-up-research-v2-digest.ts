/** Canonical identity, payload, set, and search-angle digests for D18. */

import type { FollowUpKind } from "../contracts/case-follow-up";
import {
  type FollowUpResearchV2QualifiedFact,
  type ResearchV2SourceChannel,
  type ResearchV2TermConcept,
  type ResearchV2Timepoint,
} from "../contracts/case-follow-up-research-v2";
import {
  canonicalJson,
  compareCodePoints,
  sha256Hex,
} from "../contracts/canonical";

export interface ResearchV2FactIdentityPayload {
  caseSlug: string;
  kind: FollowUpKind;
  atomicProposition: string;
  factDate: string | null;
}

export function researchV2FactIdentityPayload(
  caseSlug: string,
  fact: Pick<
    FollowUpResearchV2QualifiedFact,
    "kind" | "atomicProposition" | "factDate"
  >,
): ResearchV2FactIdentityPayload {
  return {
    caseSlug,
    kind: fact.kind,
    atomicProposition: fact.atomicProposition,
    factDate: fact.factDate,
  };
}

export function computeResearchV2FactIdentityDigest(
  caseSlug: string,
  fact: Pick<
    FollowUpResearchV2QualifiedFact,
    "kind" | "atomicProposition" | "factDate"
  >,
): string {
  return sha256Hex(
    canonicalJson(researchV2FactIdentityPayload(caseSlug, fact)),
  );
}

/**
 * Bind the complete research fact, including its stable identity digest.
 * Round/open timestamps intentionally live outside this payload so reopening
 * an unchanged baseline source cannot manufacture a correction.
 */
export function computeResearchV2FactPayloadDigest(
  fact: FollowUpResearchV2QualifiedFact,
): string {
  return sha256Hex(canonicalJson(fact));
}

export interface ResearchV2QualifiedSetEntry {
  itemId: string;
  payloadSha256: string;
}

export function researchV2QualifiedSetPayload(
  facts: readonly FollowUpResearchV2QualifiedFact[],
): ResearchV2QualifiedSetEntry[] {
  const seen = new Set<string>();
  const entries = facts.map((fact) => {
    if (seen.has(fact.itemId)) {
      throw new Error(`duplicate qualified fact itemId: ${fact.itemId}`);
    }
    seen.add(fact.itemId);
    return {
      itemId: fact.itemId,
      payloadSha256: computeResearchV2FactPayloadDigest(fact),
    };
  });
  return entries.sort((left, right) =>
    compareCodePoints(left.itemId, right.itemId),
  );
}

export function computeResearchV2QualifiedSetDigest(
  facts: readonly FollowUpResearchV2QualifiedFact[],
): string {
  return sha256Hex(canonicalJson(researchV2QualifiedSetPayload(facts)));
}

export interface ResearchV2AngleInput {
  sourceChannel: ResearchV2SourceChannel;
  timepoint: ResearchV2Timepoint;
  coveredTermConcepts: readonly ResearchV2TermConcept[];
}

/**
 * Query wording is provenance, not angle identity.  Angle identity is the
 * canonical source/timepoint/normalized-concept-set tuple required by D18.
 */
export function computeResearchV2AngleId(input: ResearchV2AngleInput): string {
  const normalizedConcepts = [...new Set(input.coveredTermConcepts)].sort(
    compareCodePoints,
  );
  return sha256Hex(
    canonicalJson({
      sourceChannel: input.sourceChannel,
      timepoint: input.timepoint,
      coveredTermConcepts: normalizedConcepts,
    }),
  );
}

export function computeResearchV2RoundAngleTupleDigest(
  angleIds: readonly string[],
): string {
  return sha256Hex(canonicalJson([...angleIds].sort(compareCodePoints)));
}
