/**
 * Served-artifact receipt: proof that a hosting provider actually served the
 * exact built artifact. A receipt must cover the complete manifest path set
 * with a canonical response-metadata digest. Provider checksum mode may
 * replace the body-byte comparison only — never route, status, content-type,
 * or deployment/URL identity checks.
 */

import { z } from "astro/zod";
import {
  canonicalJson,
  CanonicalJsonError,
  compareCodePoints,
  isValidUtcTimestamp,
  issue,
  parseStrictJson,
  SHA256_RE,
  sha256Hex,
  type ValidationIssue,
} from "../contracts/canonical";
import type { ArtifactManifest } from "./artifact-manifest";

const sha256Lower = z.string().regex(SHA256_RE);
const nonEmpty = z.string().min(1);

export const servedResponseSchema = z.strictObject({
  path: nonEmpty,
  status: z.number().int().min(100).max(599),
  contentType: nonEmpty,
  sha256: sha256Lower,
});
export type ServedResponse = z.infer<typeof servedResponseSchema>;

export const servedArtifactReceiptSchema = z.strictObject({
  schemaVersion: z.literal(1),
  receiptType: z.literal("served-artifact"),
  artifactManifestDigest: sha256Lower,
  urlHash: sha256Lower,
  deploymentIdHash: sha256Lower,
  checkedAt: z
    .string()
    .refine(isValidUtcTimestamp, { message: "must be a valid UTC timestamp" }),
  bodyComparison: z.enum(["exact-bytes", "provider-checksum"]),
  responses: z.array(servedResponseSchema).min(1),
  responseMetadataDigest: sha256Lower,
});
export type ServedArtifactReceipt = z.infer<typeof servedArtifactReceiptSchema>;

/** Canonical digest over the sorted response-metadata array. */
export function computeResponseMetadataDigest(
  responses: readonly ServedResponse[],
): string {
  return sha256Hex(
    canonicalJson({
      schemaVersion: 1,
      digestType: "served-response-metadata",
      responses: [...responses]
        .map((response) => ({ ...response }))
        .sort((a, b) => compareCodePoints(a.path, b.path)),
    }),
  );
}

/**
 * Validates a receipt against the manifest it claims to prove. Every check
 * here is mandatory in both body-comparison modes.
 */
export function validateServedArtifactReceipt(
  value: unknown,
  manifest: ArtifactManifest,
  manifestDigest: string,
): ValidationIssue[] {
  const parsed = servedArtifactReceiptSchema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((zodIssue) =>
      issue("receipt-schema", zodIssue.path.join("."), zodIssue.message),
    );
  }
  const issues: ValidationIssue[] = [];
  const receipt = parsed.data;
  if (receipt.artifactManifestDigest !== manifestDigest) {
    issues.push(
      issue(
        "receipt-manifest-digest",
        "artifactManifestDigest",
        "receipt does not bind the exact artifact-manifest digest",
      ),
    );
  }
  if (
    receipt.responseMetadataDigest !==
    computeResponseMetadataDigest(receipt.responses)
  ) {
    issues.push(
      issue(
        "receipt-metadata-digest",
        "responseMetadataDigest",
        "stored response-metadata digest does not match the canonical responses",
      ),
    );
  }
  const responseByPath = new Map<string, ServedResponse>();
  receipt.responses.forEach((response, index) => {
    const location = `responses[${index}]`;
    if (responseByPath.has(response.path)) {
      issues.push(
        issue(
          "receipt-duplicate-path",
          location,
          `response path ${response.path} appears more than once`,
        ),
      );
    }
    responseByPath.set(response.path, response);
    if (index > 0) {
      const previous = receipt.responses[index - 1]!;
      if (compareCodePoints(previous.path, response.path) >= 0) {
        issues.push(
          issue(
            "receipt-order",
            location,
            "receipt responses must be strictly sorted by path",
          ),
        );
      }
    }
  });
  for (const file of manifest.files) {
    const response = responseByPath.get(file.path);
    if (response === undefined) {
      issues.push(
        issue(
          "receipt-coverage",
          file.path,
          `receipt does not cover manifest path ${file.path}`,
        ),
      );
      continue;
    }
    if (response.status !== 200) {
      issues.push(
        issue(
          "receipt-status",
          file.path,
          `served response status ${response.status} is not 200`,
        ),
      );
    }
    if (response.contentType !== file.contentType) {
      issues.push(
        issue(
          "receipt-content-type",
          file.path,
          "served content-type does not match the artifact manifest",
        ),
      );
    }
    // Body comparison: the served byte digest must equal the manifest digest
    // whether it was measured from downloaded bytes or a provider checksum.
    if (response.sha256 !== file.sha256) {
      issues.push(
        issue(
          "receipt-byte-mismatch",
          file.path,
          "served bytes do not match the built artifact bytes",
        ),
      );
    }
  }
  for (const path of responseByPath.keys()) {
    if (!manifest.files.some((file) => file.path === path)) {
      issues.push(
        issue(
          "receipt-extra-path",
          path,
          `receipt covers ${path} which is not in the artifact manifest`,
        ),
      );
    }
  }
  return issues;
}

/** Canonical byte digest of a receipt object. */
export function computeServedArtifactReceiptDigest(
  receipt: ServedArtifactReceipt,
): string {
  return sha256Hex(canonicalJson(receipt));
}

export interface ParsedServedArtifactReceipt {
  receipt: ServedArtifactReceipt | null;
  receiptDigest: string;
  issues: ValidationIssue[];
}

/** Strict canonical-bytes parse of a persisted receipt artifact. */
export function parseServedArtifactReceiptBytes(
  bytes: Uint8Array | string,
): ParsedServedArtifactReceipt {
  const receiptDigest = sha256Hex(bytes);
  const text =
    typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      receipt: null,
      receiptDigest,
      issues: [
        issue(
          "receipt-parse",
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
        "receipt-not-canonical",
        "",
        "receipt bytes must be exact canonical JSON",
      ),
    );
  }
  const result = servedArtifactReceiptSchema.safeParse(parsed);
  if (!result.success) {
    issues.push(
      ...result.error.issues.map((zodIssue) =>
        issue("receipt-schema", zodIssue.path.join("."), zodIssue.message),
      ),
    );
  }
  if (issues.length > 0 || !result.success) {
    return { receipt: null, receiptDigest, issues };
  }
  return { receipt: result.data, receiptDigest, issues };
}
