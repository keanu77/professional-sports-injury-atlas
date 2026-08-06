/**
 * `CourseLinkApprovalDecisionV1`: the only artifact that can turn a
 * professional-course mapping into a public CTA. It is a strict,
 * duplicate-key-detected canonical JSON file stored at
 * `src/data/governance/course-link-decisions/<course-key>.v1.json`; any byte
 * that is not exact canonical JSON fails closed.
 */

import { z } from "astro/zod";
import {
  canonicalJson,
  CanonicalJsonError,
  isValidUtcTimestamp,
  issue,
  parseStrictJson,
  SHA256_RE,
  sha256Hex,
  type ValidationIssue,
} from "../contracts/canonical";

export const COURSE_LINK_DECISION_DIR =
  "src/data/governance/course-link-decisions";

/** Durable per-key decision path; approvals must live exactly here. */
export function courseLinkDecisionPathFor(courseKey: string): string {
  return `${COURSE_LINK_DECISION_DIR}/${courseKey}.v1.json`;
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const HTTPS_URL_RE = /^https:\/\/[^\s<>"']+$/;

const trimmedNonEmpty = z
  .string()
  .min(1)
  .refine((value) => value === value.trim() && value.trim().length > 0, {
    message: "must be trimmed and non-empty",
  });

export const courseLinkApprovalDecisionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  decisionType: z.literal("course-link-approval"),
  courseKey: z.string().regex(SLUG_RE),
  injuryCode: z.string().regex(SLUG_RE),
  catalogSlug: z.string().regex(SLUG_RE),
  catalogContentDigest: z.string().regex(SHA256_RE),
  publicUrl: z.string().regex(HTTPS_URL_RE),
  linkPolicyVersion: trimmedNonEmpty,
  approvedBy: trimmedNonEmpty,
  approvedAt: z
    .string()
    .refine(isValidUtcTimestamp, { message: "must be a valid UTC timestamp" }),
});

export type CourseLinkApprovalDecisionV1 = z.infer<
  typeof courseLinkApprovalDecisionSchema
>;

export interface ParsedCourseLinkDecision {
  /** Non-null only when the bytes are a fully valid canonical decision. */
  decision: CourseLinkApprovalDecisionV1 | null;
  /** SHA-256 of the exact decision bytes, valid even on failure. */
  decisionDigest: string;
  issues: ValidationIssue[];
}

/**
 * Reparses and rehashes decision bytes. Fails closed on malformed JSON,
 * duplicate keys, unknown or missing fields, non-canonical bytes, blank
 * approver, non-HTTPS URLs, and malformed times.
 */
export function parseCourseLinkApprovalDecisionBytes(
  bytes: Uint8Array | string,
): ParsedCourseLinkDecision {
  const decisionDigest = sha256Hex(bytes);
  const issues: ValidationIssue[] = [];
  let text: string;
  if (typeof bytes === "string") {
    text = bytes;
  } else {
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      return {
        decision: null,
        decisionDigest,
        issues: [issue("decision-parse", "", "decision bytes are not UTF-8")],
      };
    }
  }
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    const message =
      error instanceof CanonicalJsonError ? error.message : String(error);
    issues.push(issue("decision-parse", "", message));
    return { decision: null, decisionDigest, issues };
  }
  if (canonicalJson(parsed) !== text) {
    issues.push(
      issue(
        "decision-not-canonical",
        "",
        "decision bytes must be exact canonical JSON",
      ),
    );
  }
  const result = courseLinkApprovalDecisionSchema.safeParse(parsed);
  if (!result.success) {
    issues.push(
      ...result.error.issues.map((zodIssue) =>
        issue("decision-schema", zodIssue.path.join("."), zodIssue.message),
      ),
    );
  }
  if (issues.length > 0 || !result.success) {
    return { decision: null, decisionDigest, issues };
  }
  return { decision: result.data, decisionDigest, issues };
}
