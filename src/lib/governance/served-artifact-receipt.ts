/**
 * Canonical G4 live served-review receipt. It proves the complete authorized
 * byte set and the complete five-scenario unauthorized denial matrix without
 * retaining an origin, deployment ID, credential, body, HTML, or media bytes.
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
import {
  PRIVATE_HTTP_HEADER_CONTRACT_ID,
  type ArtifactFile,
  type ArtifactManifest,
} from "./artifact-manifest";

export const EMPTY_BODY_SHA256 =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
export const G4_AUTHORIZATION_DECISION_SHA256 =
  "ab3a803acfb2ecf82145f3041b2fead5f2d1645bd526fc79e77e9617f3cc998e";
export const G4_PLAN_SHA256 =
  "981e5acae525768a4005cae288e76e66159c2823f671b95be92afc066b66fd21";
export const G4_PLAN_PATH =
  "docs/superpowers/plans/2026-08-08-atlas-private-hosting-and-review.md";
export const UNAUTHORIZED_SCENARIOS = [
  "cold-missing-auth",
  "warm-missing-auth",
  "malformed-auth",
  "wrong-auth",
  "credential-removed-new-client",
] as const;

const sha256Lower = z.string().regex(SHA256_RE);
const nonEmpty = z.string().min(1);
const pass = z.literal("passed");
const notApplicable = z.literal("not-applicable");

export const receiptVerifiedBySchema = z.strictObject({
  authorizationDecisionDigest: z.literal(G4_AUTHORIZATION_DECISION_SHA256),
  authorizedBy: z.literal("吳易澄醫師"),
  role: z.literal("atlas-private-hosting-and-review"),
  executionScopeId: z.literal("g4-local-mini-tailscale-private-hosting-only"),
  planPath: z.literal(G4_PLAN_PATH),
  planSha256: z.literal(G4_PLAN_SHA256),
});

export const authorizedResponseSchema = z.strictObject({
  requestPath: nonEmpty,
  method: z.literal("GET"),
  status: z.literal(200),
  redirectMode: z.literal("manual"),
  redirected: z.literal(false),
  contentType: nonEmpty,
  decodedByteLength: z.number().int().min(0),
  decodedSha256: sha256Lower,
  identityResult: pass,
  shardResult: z.union([pass, notApplicable]),
  robotsMetaResult: z.union([pass, notApplicable]),
  robotsTxtResult: z.union([pass, notApplicable]),
  headerContractId: z.literal(PRIVATE_HTTP_HEADER_CONTRACT_ID),
  headersResult: pass,
  forbiddenHeadersAbsent: z.literal(true),
  contentEncodingPresent: z.literal(false),
  bodyKind: z.literal("manifest-artifact"),
  loginDocument: z.literal(false),
  denyDocument: z.literal(false),
  fallbackDocument: z.literal(false),
  setCookiePresent: z.literal(false),
  cacheBypassObserved: z.literal(false),
});
export type AuthorizedResponse = z.infer<typeof authorizedResponseSchema>;

export const unauthorizedLeakSchema = z.strictObject({
  atlasIdentity: z.literal(false),
  reviewSetBytes: z.literal(false),
  reviewSetDigest: z.literal(false),
  cardSummaries: z.literal(false),
  workflowStatus: z.literal(false),
  deploymentIdentity: z.literal(false),
});

export const unauthorizedResponseSchema = z.strictObject({
  scenario: z.enum(UNAUTHORIZED_SCENARIOS),
  requestPath: nonEmpty,
  method: z.literal("GET"),
  redirectMode: z.literal("manual"),
  redirected: z.literal(false),
  status: z.literal(401),
  contentType: z.null(),
  bodyByteLength: z.literal(0),
  bodySha256: z.literal(EMPTY_BODY_SHA256),
  wwwAuthenticateResult: pass,
  headerContractId: z.literal(PRIVATE_HTTP_HEADER_CONTRACT_ID),
  headersResult: pass,
  forbiddenHeadersAbsent: z.literal(true),
  contentEncodingPresent: z.literal(false),
  setCookiePresent: z.literal(false),
  cacheBypassObserved: z.literal(false),
  leaks: unauthorizedLeakSchema,
});
export type UnauthorizedResponse = z.infer<typeof unauthorizedResponseSchema>;

export const mismatchCountsSchema = z.strictObject({
  access: z.literal(0),
  byte: z.literal(0),
  cache: z.literal(0),
  header: z.literal(0),
  identity: z.literal(0),
  leak: z.literal(0),
  metadata: z.literal(0),
  redirect: z.literal(0),
});

export const servedArtifactReceiptSchema = z.strictObject({
  schemaVersion: z.literal(1),
  receiptType: z.literal("served-private-review"),
  privateDistManifestDigest: sha256Lower,
  reviewSetResponseSha256: sha256Lower,
  privateOriginHash: sha256Lower,
  deploymentIdHash: sha256Lower,
  checkedAt: z
    .string()
    .refine(isValidUtcTimestamp, { message: "must be a valid UTC timestamp" }),
  requestMethod: z.literal("GET"),
  authenticationMethod: z.literal("http-basic-scrypt-keychain-v1"),
  bodyComparisonMethod: z.literal("decoded-sha256-exact"),
  redirectMode: z.literal("manual"),
  verifiedBy: receiptVerifiedBySchema,
  manifestPathCount: z.number().int().min(1),
  authorizedCheckCount: z.number().int().min(1),
  unauthorizedScenarioCount: z.literal(UNAUTHORIZED_SCENARIOS.length),
  unauthorizedPathCount: z.number().int().min(1),
  unauthorizedCheckCount: z.number().int().min(1),
  mismatchCounts: mismatchCountsSchema,
  authorizedResponses: z.array(authorizedResponseSchema).min(1),
  authorizedMetadataDigest: sha256Lower,
  unauthorizedResponses: z.array(unauthorizedResponseSchema).min(1),
  unauthorizedMetadataDigest: sha256Lower,
});
export type ServedArtifactReceipt = z.infer<typeof servedArtifactReceiptSchema>;

export function computeAuthorizedMetadataDigest(
  responses: readonly AuthorizedResponse[],
): string {
  return sha256Hex(
    canonicalJson({
      schemaVersion: 1,
      digestType: "authorized-response-metadata",
      responses: [...responses]
        .map((response) => ({ ...response }))
        .sort((a, b) => compareCodePoints(a.requestPath, b.requestPath)),
    }),
  );
}

function unauthorizedKey(response: {
  requestPath: string;
  scenario: string;
}): string {
  return `${response.requestPath}\0${response.scenario}`;
}

export function computeUnauthorizedMetadataDigest(
  responses: readonly UnauthorizedResponse[],
): string {
  return sha256Hex(
    canonicalJson({
      schemaVersion: 1,
      digestType: "unauthorized-response-metadata",
      responses: [...responses]
        .map((response) => ({ ...response, leaks: { ...response.leaks } }))
        .sort((a, b) =>
          compareCodePoints(unauthorizedKey(a), unauthorizedKey(b)),
        ),
    }),
  );
}

/** Backward source-name compatibility, now over the expanded authorized set. */
export const computeResponseMetadataDigest = computeAuthorizedMetadataDigest;

function expectedShardResult(file: ArtifactFile): "passed" | "not-applicable" {
  return file.identity.kind === "case-index-manifest" ||
    file.identity.kind === "case-index-shard"
    ? "passed"
    : "not-applicable";
}

function expectedRobotsMetaResult(
  file: ArtifactFile,
): "passed" | "not-applicable" {
  return file.identity.kind === "html-page" ? "passed" : "not-applicable";
}

function expectedRobotsTxtResult(
  file: ArtifactFile,
): "passed" | "not-applicable" {
  return file.identity.kind === "robots-txt" ? "passed" : "not-applicable";
}

/** Shared fail-closed validator consumed by medical review and public gates. */
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
  const receipt = parsed.data;
  const issues: ValidationIssue[] = [];
  if (receipt.privateDistManifestDigest !== manifestDigest) {
    issues.push(
      issue(
        "receipt-manifest-digest",
        "privateDistManifestDigest",
        "receipt does not bind the exact private-dist manifest digest",
      ),
    );
  }
  if (receipt.reviewSetResponseSha256 !== manifest.reviewSetResponseSha256) {
    issues.push(
      issue(
        "receipt-review-set-response",
        "reviewSetResponseSha256",
        "receipt does not bind the manifest's exact review-set response bytes",
      ),
    );
  }
  if (
    receipt.authorizedMetadataDigest !==
    computeAuthorizedMetadataDigest(receipt.authorizedResponses)
  ) {
    issues.push(
      issue(
        "receipt-authorized-metadata-digest",
        "authorizedMetadataDigest",
        "authorized metadata digest is stale",
      ),
    );
  }
  if (
    receipt.unauthorizedMetadataDigest !==
    computeUnauthorizedMetadataDigest(receipt.unauthorizedResponses)
  ) {
    issues.push(
      issue(
        "receipt-unauthorized-metadata-digest",
        "unauthorizedMetadataDigest",
        "unauthorized metadata digest is stale",
      ),
    );
  }

  const pathCount = manifest.files.length;
  const unauthorizedCount = pathCount * UNAUTHORIZED_SCENARIOS.length;
  if (
    receipt.manifestPathCount !== pathCount ||
    receipt.authorizedCheckCount !== pathCount ||
    receipt.authorizedResponses.length !== pathCount
  ) {
    issues.push(
      issue(
        "receipt-authorized-count",
        "authorizedCheckCount",
        "authorized observations must exactly cover every manifest path",
      ),
    );
  }
  if (
    receipt.unauthorizedPathCount !== pathCount ||
    receipt.unauthorizedCheckCount !== unauthorizedCount ||
    receipt.unauthorizedResponses.length !== unauthorizedCount
  ) {
    issues.push(
      issue(
        "receipt-unauthorized-count",
        "unauthorizedCheckCount",
        "unauthorized observations must cover every path under all five scenarios",
      ),
    );
  }

  const authorizedByPath = new Map<string, AuthorizedResponse>();
  receipt.authorizedResponses.forEach((response, index) => {
    const location = `authorizedResponses[${index}]`;
    if (authorizedByPath.has(response.requestPath)) {
      issues.push(
        issue(
          "receipt-authorized-duplicate",
          location,
          `authorized path ${response.requestPath} appears more than once`,
        ),
      );
    }
    authorizedByPath.set(response.requestPath, response);
    if (
      index > 0 &&
      compareCodePoints(
        receipt.authorizedResponses[index - 1]!.requestPath,
        response.requestPath,
      ) >= 0
    ) {
      issues.push(
        issue(
          "receipt-authorized-order",
          location,
          "authorized responses must be strictly sorted by request path",
        ),
      );
    }
  });
  for (const file of manifest.files) {
    const response = authorizedByPath.get(file.requestPath);
    if (response === undefined) {
      issues.push(
        issue(
          "receipt-authorized-coverage",
          file.requestPath,
          `missing authorized observation for ${file.requestPath}`,
        ),
      );
      continue;
    }
    if (
      response.contentType !== file.contentType ||
      response.decodedByteLength !== file.byteLength
    ) {
      issues.push(
        issue(
          "receipt-metadata-mismatch",
          file.requestPath,
          "served content type or decoded byte length differs from the manifest",
        ),
      );
    }
    if (response.decodedSha256 !== file.sha256) {
      issues.push(
        issue(
          "receipt-byte-mismatch",
          file.requestPath,
          "served decoded bytes differ from the private manifest",
        ),
      );
    }
    if (
      response.shardResult !== expectedShardResult(file) ||
      response.robotsMetaResult !== expectedRobotsMetaResult(file) ||
      response.robotsTxtResult !== expectedRobotsTxtResult(file)
    ) {
      issues.push(
        issue(
          "receipt-identity-mismatch",
          file.requestPath,
          "served identity/shard/robots result does not match manifest metadata",
        ),
      );
    }
  }
  for (const path of authorizedByPath.keys()) {
    if (!manifest.files.some((file) => file.requestPath === path)) {
      issues.push(
        issue(
          "receipt-authorized-extra-path",
          path,
          `authorized observation covers unknown path ${path}`,
        ),
      );
    }
  }

  const unauthorizedKeys = new Set<string>();
  receipt.unauthorizedResponses.forEach((response, index) => {
    const location = `unauthorizedResponses[${index}]`;
    const key = unauthorizedKey(response);
    if (unauthorizedKeys.has(key)) {
      issues.push(
        issue(
          "receipt-unauthorized-duplicate",
          location,
          `unauthorized observation ${key} appears more than once`,
        ),
      );
    }
    unauthorizedKeys.add(key);
    if (
      index > 0 &&
      compareCodePoints(
        unauthorizedKey(receipt.unauthorizedResponses[index - 1]!),
        key,
      ) >= 0
    ) {
      issues.push(
        issue(
          "receipt-unauthorized-order",
          location,
          "unauthorized observations must be strictly sorted by path/scenario",
        ),
      );
    }
  });
  for (const file of manifest.files) {
    for (const scenario of UNAUTHORIZED_SCENARIOS) {
      const key = unauthorizedKey({ requestPath: file.requestPath, scenario });
      if (!unauthorizedKeys.has(key)) {
        issues.push(
          issue(
            "receipt-unauthorized-coverage",
            key,
            "missing required unauthorized path/scenario observation",
          ),
        );
      }
    }
  }
  for (const response of receipt.unauthorizedResponses) {
    if (
      !manifest.files.some((file) => file.requestPath === response.requestPath)
    ) {
      issues.push(
        issue(
          "receipt-unauthorized-extra-path",
          response.requestPath,
          "unauthorized observation covers a path outside the manifest",
        ),
      );
    }
  }
  return issues;
}

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
