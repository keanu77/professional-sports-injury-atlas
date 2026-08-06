/**
 * Durable per-case `PublicVideoRightsDecisionV1` artifact handling. The
 * public gate reloads and rehashes every decision file; record-local
 * reviewer fields alone never clear rights, and any path/byte/field mismatch
 * fails closed.
 */

import {
  canonicalJson,
  CanonicalJsonError,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "../contracts/canonical";
import {
  computeVideoSourceDigest,
  publicVideoRightsDecisionSchema,
  type PublicVideoRightsDecision,
} from "../cases/digest";
import type { InjuryCase } from "../contracts/case";
import { CURRENT_PUBLIC_RIGHTS_POLICY_VERSION } from "../contracts/site-governance";

export const VIDEO_RIGHTS_DECISION_DIR =
  "src/data/governance/video-rights-decisions";

/** Durable per-case decision path; clearances must live exactly here. */
export function videoRightsDecisionPathFor(caseId: string): string {
  return `${VIDEO_RIGHTS_DECISION_DIR}/${caseId}.v1.json`;
}

export interface ParsedVideoRightsDecision {
  decision: PublicVideoRightsDecision | null;
  /** SHA-256 of the exact decision bytes, valid even on failure. */
  decisionDigest: string;
  issues: ValidationIssue[];
}

/** Strict duplicate-key-detected canonical-bytes parse. */
export function parsePublicVideoRightsDecisionBytes(
  bytes: Uint8Array | string,
): ParsedVideoRightsDecision {
  const decisionDigest = sha256Hex(bytes);
  const text =
    typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      decision: null,
      decisionDigest,
      issues: [
        issue(
          "rights-decision-parse",
          "",
          error instanceof CanonicalJsonError ? error.message : String(error),
        ),
      ],
    };
  }
  const issues: ValidationIssue[] = [];
  if (canonicalJson(parsed) !== text) {
    issues.push(
      issue(
        "rights-decision-not-canonical",
        "",
        "rights-decision bytes must be exact canonical JSON",
      ),
    );
  }
  const result = publicVideoRightsDecisionSchema.safeParse(parsed);
  if (!result.success) {
    issues.push(
      ...result.error.issues.map((zodIssue) =>
        issue(
          "rights-decision-schema",
          zodIssue.path.join("."),
          zodIssue.message,
        ),
      ),
    );
  }
  if (issues.length > 0 || !result.success) {
    return { decision: null, decisionDigest, issues };
  }
  return { decision: result.data, decisionDigest, issues };
}

export interface CaseVideoRightsInput {
  record: InjuryCase;
  /** Freshly reloaded decision bytes; null when the artifact is absent. */
  decisionBytes: Uint8Array | string | null;
  /** Path the bytes were actually loaded from; null when absent. */
  decisionPath: string | null;
}

/**
 * Fail-closed evaluation of one case's durable rights decision against the
 * current record. An empty result means the clearance is fully bound; any
 * case/video/policy/identity/time/basis mismatch is an issue.
 */
export function evaluateCaseVideoRightsDecision(
  input: CaseVideoRightsInput,
): ValidationIssue[] {
  const { record } = input;
  const issues: ValidationIssue[] = [];
  const rights = record.video.publicRightsReview;
  const prefix = `${record.id}.video.publicRightsReview`;
  if (rights.status !== "cleared") {
    issues.push(
      issue(
        "rights-decision-not-cleared",
        `${prefix}.status`,
        "public selection requires cleared public rights",
      ),
    );
    return issues;
  }
  if (input.decisionBytes === null || input.decisionPath === null) {
    issues.push(
      issue(
        "rights-decision-missing",
        prefix,
        "record-local clearance fields alone never qualify; the durable rights decision artifact is required",
      ),
    );
    return issues;
  }
  const durablePath = videoRightsDecisionPathFor(record.id);
  if (
    input.decisionPath !== durablePath ||
    rights.decisionPath !== durablePath
  ) {
    issues.push(
      issue(
        "rights-decision-path",
        prefix,
        `rights decision must be loaded from ${durablePath}`,
      ),
    );
  }
  const parsed = parsePublicVideoRightsDecisionBytes(input.decisionBytes);
  issues.push(
    ...parsed.issues.map((entry) => ({
      ...entry,
      path: entry.path === "" ? prefix : `${prefix}.${entry.path}`,
    })),
  );
  if (parsed.decisionDigest !== rights.decisionDigest) {
    issues.push(
      issue(
        "rights-decision-digest",
        `${prefix}.decisionDigest`,
        "rights decision byte digest differs from the recorded decisionDigest",
      ),
    );
  }
  if (parsed.decision === null) return issues;
  const decision = parsed.decision;
  if (decision.caseId !== record.id) {
    issues.push(
      issue(
        "rights-decision-case",
        prefix,
        `rights decision targets ${decision.caseId}, not ${record.id}`,
      ),
    );
  }
  if (decision.videoSourceDigest !== computeVideoSourceDigest(record)) {
    issues.push(
      issue(
        "rights-decision-video-digest",
        prefix,
        "rights decision does not bind the current canonical video-source payload",
      ),
    );
  }
  if (
    decision.publicRightsPolicyVersion !==
      CURRENT_PUBLIC_RIGHTS_POLICY_VERSION ||
    rights.policyVersion !== CURRENT_PUBLIC_RIGHTS_POLICY_VERSION
  ) {
    issues.push(
      issue(
        "rights-decision-policy",
        prefix,
        "rights decision was made under a superseded public-rights policy version",
      ),
    );
  }
  const exact = (
    field: string,
    decisionValue: string | null,
    recordValue: string | null,
  ): void => {
    if (decisionValue !== recordValue) {
      issues.push(
        issue(
          "rights-decision-field-mismatch",
          `${prefix}.${field}`,
          "rights decision and record clearance fields disagree",
        ),
      );
    }
  };
  exact("reviewedBy", decision.reviewedBy, rights.reviewedBy);
  exact("reviewedAt", decision.reviewedAt, rights.reviewedAt);
  exact("termsCheckedAt", decision.termsCheckedAt, rights.termsCheckedAt);
  exact("decisionBasis", decision.decisionBasis, rights.decisionBasis);
  exact("notes", decision.notes, rights.notes);
  return issues;
}
