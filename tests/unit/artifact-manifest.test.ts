import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Hex } from "../../src/lib/cases/canonical-json";
import {
  buildArtifactManifest,
  computeArtifactManifestDigest,
  parseArtifactManifestBytes,
  PRIVATE_HTTP_HEADER_CONTRACT_ID,
  PRIVATE_HTTP_HEADER_POLICY_SHA256,
  validateArtifactManifest,
  validateArtifactManifestCoverage,
  type ArtifactManifest,
} from "../../src/lib/governance/artifact-manifest";
import { PRIVATE_REVIEW_MAX_FILE_BYTES } from "../../src/lib/governance/private-review-limits";
import {
  computeAuthorizedMetadataDigest,
  computeUnauthorizedMetadataDigest,
  EMPTY_BODY_SHA256,
  G4_AUTHORIZATION_DECISION_SHA256,
  G4_PLAN_PATH,
  G4_PLAN_SHA256,
  parseServedArtifactReceiptBytes,
  UNAUTHORIZED_SCENARIOS,
  validateServedArtifactReceipt,
  type AuthorizedResponse,
  type ServedArtifactReceipt,
  type UnauthorizedResponse,
} from "../../src/lib/governance/served-artifact-receipt";

const hex = (ch: string): string => ch.repeat(64);
const REVIEW_SET_BYTES = '{"manifestType":"review-set","schemaVersion":1}\n';

function baseManifest(): ArtifactManifest {
  const reviewSetDigest = sha256Hex(REVIEW_SET_BYTES);
  return buildArtifactManifest(
    "review",
    [
      {
        path: "index.html",
        bytes:
          '<html><meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex"></html>',
        contentType: "text/html; charset=utf-8",
      },
      {
        path: "robots.txt",
        bytes: "User-agent: *\nDisallow: /\n",
        contentType: "text/plain; charset=utf-8",
      },
      {
        path: "review/review-set.json",
        bytes: REVIEW_SET_BYTES,
        contentType: "application/json",
      },
    ],
    {
      buildCommit: "a".repeat(40),
      reviewSetDigest,
      reviewSetResponseSha256: reviewSetDigest,
      rendererTreeDigest: hex("b"),
      headerPolicyDigest: PRIVATE_HTTP_HEADER_POLICY_SHA256,
      generatedAt: "2026-08-08T14:00:00Z",
    },
  );
}

function authorizedFor(manifest: ArtifactManifest): AuthorizedResponse[] {
  return manifest.files.map((file) => ({
    requestPath: file.requestPath,
    method: "GET",
    status: 200,
    redirectMode: "manual",
    redirected: false,
    contentType: file.contentType,
    decodedByteLength: file.byteLength,
    decodedSha256: file.sha256,
    identityResult: "passed",
    shardResult:
      file.identity.kind === "case-index-manifest" ||
      file.identity.kind === "case-index-shard"
        ? "passed"
        : "not-applicable",
    robotsMetaResult:
      file.identity.kind === "html-page" ? "passed" : "not-applicable",
    robotsTxtResult:
      file.identity.kind === "robots-txt" ? "passed" : "not-applicable",
    headerContractId: PRIVATE_HTTP_HEADER_CONTRACT_ID,
    headersResult: "passed",
    forbiddenHeadersAbsent: true,
    contentEncodingPresent: false,
    bodyKind: "manifest-artifact",
    loginDocument: false,
    denyDocument: false,
    fallbackDocument: false,
    setCookiePresent: false,
    cacheBypassObserved: false,
  }));
}

function unauthorizedFor(manifest: ArtifactManifest): UnauthorizedResponse[] {
  return manifest.files
    .flatMap((file) =>
      UNAUTHORIZED_SCENARIOS.map((scenario): UnauthorizedResponse => ({
        scenario,
        requestPath: file.requestPath,
        method: "GET" as const,
        redirectMode: "manual" as const,
        redirected: false as const,
        status: 401 as const,
        contentType: null,
        bodyByteLength: 0 as const,
        bodySha256: EMPTY_BODY_SHA256 as typeof EMPTY_BODY_SHA256,
        wwwAuthenticateResult: "passed" as const,
        headerContractId: PRIVATE_HTTP_HEADER_CONTRACT_ID,
        headersResult: "passed" as const,
        forbiddenHeadersAbsent: true as const,
        contentEncodingPresent: false as const,
        setCookiePresent: false as const,
        cacheBypassObserved: false as const,
        leaks: {
          atlasIdentity: false as const,
          reviewSetBytes: false as const,
          reviewSetDigest: false as const,
          cardSummaries: false as const,
          workflowStatus: false as const,
          deploymentIdentity: false as const,
        },
      })),
    )
    .sort((a, b) =>
      `${a.requestPath}\0${a.scenario}` < `${b.requestPath}\0${b.scenario}`
        ? -1
        : 1,
    );
}

export function baseReceipt(manifest: ArtifactManifest): ServedArtifactReceipt {
  const authorizedResponses = authorizedFor(manifest);
  const unauthorizedResponses = unauthorizedFor(manifest);
  return {
    schemaVersion: 1,
    receiptType: "served-private-review",
    privateDistManifestDigest: computeArtifactManifestDigest(manifest),
    reviewSetResponseSha256: manifest.reviewSetResponseSha256,
    privateOriginHash: sha256Hex("http://private-review.invalid"),
    deploymentIdHash: sha256Hex("local-deployment-id"),
    checkedAt: "2026-08-08T14:30:00Z",
    requestMethod: "GET",
    authenticationMethod: "http-basic-scrypt-keychain-v1",
    bodyComparisonMethod: "decoded-sha256-exact",
    redirectMode: "manual",
    verifiedBy: {
      authorizationDecisionDigest: G4_AUTHORIZATION_DECISION_SHA256,
      authorizedBy: "吳易澄醫師",
      role: "atlas-private-hosting-and-review",
      executionScopeId: "g4-local-mini-tailscale-private-hosting-only",
      planPath: G4_PLAN_PATH,
      planSha256: G4_PLAN_SHA256,
    },
    manifestPathCount: manifest.files.length,
    authorizedCheckCount: authorizedResponses.length,
    unauthorizedScenarioCount: UNAUTHORIZED_SCENARIOS.length,
    unauthorizedPathCount: manifest.files.length,
    unauthorizedCheckCount: unauthorizedResponses.length,
    mismatchCounts: {
      access: 0,
      byte: 0,
      cache: 0,
      header: 0,
      identity: 0,
      leak: 0,
      metadata: 0,
      redirect: 0,
    },
    authorizedResponses,
    authorizedMetadataDigest:
      computeAuthorizedMetadataDigest(authorizedResponses),
    unauthorizedResponses,
    unauthorizedMetadataDigest: computeUnauthorizedMetadataDigest(
      unauthorizedResponses,
    ),
  };
}

describe("private-dist manifest", () => {
  it("rejects the legacy short manifest contract", () => {
    const legacy = {
      schemaVersion: 1,
      manifestType: "built-artifact",
      buildMode: "review",
      files: [
        {
          path: "index.html",
          sha256: hex("1"),
          byteLength: 1,
          contentType: "text/html; charset=utf-8",
        },
      ],
    };
    expect(validateArtifactManifest(legacy).length).toBeGreaterThan(0);
  });

  it("round-trips the complete strict canonical contract", () => {
    const manifest = baseManifest();
    expect(validateArtifactManifest(manifest)).toEqual([]);
    expect(manifest.files.map((file) => file.buildPath)).toEqual([
      "index.html",
      "review/review-set.json",
      "robots.txt",
    ]);
    expect(manifest.files.map((file) => file.requestPath)).toEqual([
      "/",
      "/review/review-set.json",
      "/robots.txt",
    ]);
    const parsed = parseArtifactManifestBytes(canonicalJson(manifest));
    expect(parsed.manifest).toEqual(manifest);
    expect(parsed.manifestDigest).toBe(computeArtifactManifestDigest(manifest));
  });

  it("accepts the exact private-review byte ceiling and rejects unsafe or oversized declarations", () => {
    const boundary = structuredClone(baseManifest()) as any;
    boundary.files[0].byteLength = PRIVATE_REVIEW_MAX_FILE_BYTES;
    expect(validateArtifactManifest(boundary)).toEqual([]);

    const oversized = structuredClone(boundary) as any;
    oversized.files[0].byteLength = PRIVATE_REVIEW_MAX_FILE_BYTES + 1;
    const oversizedIssues = validateArtifactManifest(oversized);
    expect(oversizedIssues).toContainEqual({
      code: "artifact-manifest-schema",
      path: "files.0.byteLength",
      message: `must be at most ${PRIVATE_REVIEW_MAX_FILE_BYTES} bytes`,
    });
    expect(parseArtifactManifestBytes(canonicalJson(oversized))).toMatchObject({
      manifest: null,
      issues: [
        {
          code: "artifact-manifest-schema",
          path: "files.0.byteLength",
          message: `must be at most ${PRIVATE_REVIEW_MAX_FILE_BYTES} bytes`,
        },
      ],
    });

    for (const invalidByteLength of [1.5, Number.MAX_SAFE_INTEGER + 1]) {
      const invalid = structuredClone(boundary) as any;
      invalid.files[0].byteLength = invalidByteLength;
      expect(validateArtifactManifest(invalid).length).toBeGreaterThan(0);
    }

    const fakeOversizedBytes = {
      byteLength: PRIVATE_REVIEW_MAX_FILE_BYTES + 1,
    } as unknown as Uint8Array;
    const metadata = baseManifest();
    expect(() =>
      buildArtifactManifest(
        "review",
        [
          {
            path: "_astro/oversized.jpg",
            bytes: fakeOversizedBytes,
            contentType: "image/jpeg",
          },
        ],
        {
          buildCommit: metadata.buildCommit,
          reviewSetDigest: metadata.reviewSetDigest,
          reviewSetResponseSha256: metadata.reviewSetResponseSha256,
          rendererTreeDigest: metadata.rendererTreeDigest,
          headerPolicyDigest: metadata.headerPolicyDigest,
          generatedAt: metadata.generatedAt,
        },
      ),
    ).toThrow(
      `built file _astro/oversized.jpg exceeds the ${PRIVATE_REVIEW_MAX_FILE_BYTES}-byte private-review limit`,
    );
  });

  it("rejects noncanonical and duplicate-key manifest bytes", () => {
    const manifest = baseManifest();
    expect(
      parseArtifactManifestBytes(JSON.stringify(manifest, null, 2)).manifest,
    ).toBeNull();
    expect(
      parseArtifactManifestBytes('{"schemaVersion":1,"schemaVersion":1}')
        .manifest,
    ).toBeNull();
  });

  it("requires every top-level and nested manifest field", () => {
    const manifest = baseManifest();
    for (const mutate of [
      (value: any) => delete value.buildCommit,
      (value: any) => delete value.reviewSetResponseSha256,
      (value: any) => delete value.files[0].requestPath,
      (value: any) => delete value.files[0].identity.recordIds,
      (value: any) => delete value.files[0].httpHeaderContractId,
    ]) {
      const missing = structuredClone(manifest) as any;
      mutate(missing);
      expect(validateArtifactManifest(missing).length).toBeGreaterThan(0);
    }
  });

  it("rejects traversal, dotfiles, controls, alternate slashes, and arbitrary aliases", () => {
    const manifest = baseManifest();
    for (const badPath of [
      "../escape.html",
      "/absolute.html",
      "a\\b.html",
      "a//b.html",
      ".secret",
      "a/.hidden/file",
      "bad\0name",
    ]) {
      const tampered = structuredClone(manifest) as any;
      tampered.files[0].buildPath = badPath;
      expect(
        validateArtifactManifest(tampered).length,
        badPath,
      ).toBeGreaterThan(0);
    }
    const wrongAlias = structuredClone(manifest) as any;
    wrongAlias.files[0].requestPath = "/wrong/";
    expect(
      validateArtifactManifest(wrongAlias).map((entry) => entry.code),
    ).toContain("artifact-request-alias");
  });

  it("rejects duplicate/unsorted build paths and request aliases", () => {
    const manifest = baseManifest();
    const duplicate = structuredClone(manifest) as any;
    duplicate.files[1] = structuredClone(duplicate.files[0]);
    const duplicateCodes = validateArtifactManifest(duplicate).map(
      (entry) => entry.code,
    );
    expect(duplicateCodes).toContain("artifact-duplicate-build-path");
    expect(duplicateCodes).toContain("artifact-duplicate-request-path");

    const unsorted = { ...manifest, files: [...manifest.files].reverse() };
    expect(
      validateArtifactManifest(unsorted).map((entry) => entry.code),
    ).toContain("artifact-order");
  });

  it("rejects stale policy/review-set bytes and wrong identities/contracts", () => {
    const manifest = baseManifest();
    for (const mutate of [
      (value: any) => (value.headerPolicyDigest = hex("1")),
      (value: any) => (value.reviewSetResponseSha256 = hex("2")),
      (value: any) => (value.files[0].identity.pageIds = ["/wrong"]),
      (value: any) => (value.files[0].robotsMetaContractId = "not-applicable"),
      (value: any) => (value.files[1].contentType = "text/html; charset=utf-8"),
      (value: any) => (value.files[2].sha256 = hex("3")),
    ]) {
      const tampered = structuredClone(manifest) as any;
      mutate(tampered);
      expect(validateArtifactManifest(tampered).length).toBeGreaterThan(0);
    }
  });

  it("rejects malformed metadata, raw fields, and governance self-reference", () => {
    const manifest = baseManifest();
    for (const mutate of [
      (value: any) => (value.files[0].sha256 = "not-hex"),
      (value: any) => (value.files[0].byteLength = -1),
      (value: any) => (value.files[0].contentType = ""),
      (value: any) => (value.privateOrigin = "http://secret"),
    ]) {
      const tampered = structuredClone(manifest) as any;
      mutate(tampered);
      expect(validateArtifactManifest(tampered).length).toBeGreaterThan(0);
    }
    const self = structuredClone(manifest) as any;
    self.files[0].buildPath = "review/private-dist-manifest.v1.json";
    self.files[0].requestPath = "/review/private-dist-manifest.v1.json";
    expect(validateArtifactManifest(self).map((entry) => entry.code)).toContain(
      "artifact-self-reference",
    );
  });

  it("requires sorted, exact case-index manifest/shard identity coverage", () => {
    const reviewSetDigest = sha256Hex(REVIEW_SET_BYTES);
    const indexBytes = '{"shards":["shard-a","shard-b"]}';
    const shardABytes = '{"id":"shard-a","records":["CASE-A"]}';
    const shardBBytes = '{"id":"shard-b","records":["CASE-B"]}';
    const manifest = buildArtifactManifest(
      "review",
      [
        {
          path: "case-index/index.json",
          bytes: indexBytes,
          contentType: "application/json",
          dataBearing: true,
          identity: {
            kind: "case-index-manifest",
            pageIds: [],
            recordIds: [],
            digest: sha256Hex(indexBytes),
            shardIds: ["shard-a", "shard-b"],
          },
        },
        {
          path: "case-index/shard-a.json",
          bytes: shardABytes,
          contentType: "application/json",
          dataBearing: true,
          identity: {
            kind: "case-index-shard",
            pageIds: [],
            recordIds: ["CASE-A"],
            digest: sha256Hex(shardABytes),
            shardIds: ["shard-a"],
          },
        },
        {
          path: "case-index/shard-b.json",
          bytes: shardBBytes,
          contentType: "application/json",
          dataBearing: true,
          identity: {
            kind: "case-index-shard",
            pageIds: [],
            recordIds: ["CASE-B"],
            digest: sha256Hex(shardBBytes),
            shardIds: ["shard-b"],
          },
        },
        {
          path: "review/review-set.json",
          bytes: REVIEW_SET_BYTES,
          contentType: "application/json",
        },
      ],
      {
        buildCommit: "a".repeat(40),
        reviewSetDigest,
        reviewSetResponseSha256: reviewSetDigest,
        rendererTreeDigest: hex("b"),
        headerPolicyDigest: PRIVATE_HTTP_HEADER_POLICY_SHA256,
        generatedAt: "2026-08-08T14:00:00Z",
      },
    );
    expect(validateArtifactManifest(manifest)).toEqual([]);

    for (const mutate of [
      (value: any) =>
        (value.files.find(
          (file: any) => file.identity.kind === "case-index-manifest",
        ).identity.shardIds = ["shard-b", "shard-a"]),
      (value: any) =>
        (value.files.find(
          (file: any) => file.identity.kind === "case-index-manifest",
        ).identity.shardIds = ["shard-a", "shard-c"]),
      (value: any) =>
        (value.files.find(
          (file: any) => file.identity.kind === "case-index-shard",
        ).identity.shardIds = ["shard-a", "shard-extra"]),
      (value: any) =>
        (value.files.find(
          (file: any) => file.identity.kind === "case-index-shard",
        ).dataBearing = false),
    ]) {
      const tampered = structuredClone(manifest) as any;
      mutate(tampered);
      expect(validateArtifactManifest(tampered).length).toBeGreaterThan(0);
    }

    const staticHtml = structuredClone(baseManifest()) as any;
    staticHtml.files.find(
      (file: any) => file.identity.kind === "html-page",
    ).dataBearing = false;
    expect(validateArtifactManifest(staticHtml)).toEqual([]);
  });

  it("requires exact built-file coverage", () => {
    const manifest = baseManifest();
    const paths = manifest.files.map((file) => file.buildPath);
    expect(validateArtifactManifestCoverage(manifest, paths)).toEqual([]);
    expect(
      validateArtifactManifestCoverage(manifest, [
        ...paths,
        "extra/unlisted.html",
      ]).map((entry) => entry.code),
    ).toContain("artifact-missing-path");
    expect(
      validateArtifactManifestCoverage(manifest, paths.slice(1)).map(
        (entry) => entry.code,
      ),
    ).toContain("artifact-extra-path");
  });
});

describe("served-review receipt", () => {
  it("rejects the legacy short receipt contract", () => {
    const manifest = baseManifest();
    const legacy = {
      schemaVersion: 1,
      receiptType: "served-artifact",
      artifactManifestDigest: computeArtifactManifestDigest(manifest),
      urlHash: hex("1"),
      deploymentIdHash: hex("2"),
      checkedAt: "2026-08-08T14:00:00Z",
      bodyComparison: "exact-bytes",
      responses: [],
      responseMetadataDigest: hex("3"),
    };
    expect(parseServedArtifactReceiptBytes(canonicalJson(legacy)).receipt).toBe(
      null,
    );
  });

  it("accepts complete authorized bytes and the complete five-scenario denial matrix", () => {
    const manifest = baseManifest();
    const receipt = baseReceipt(manifest);
    expect(
      validateServedArtifactReceipt(
        receipt,
        manifest,
        computeArtifactManifestDigest(manifest),
      ),
    ).toEqual([]);
    expect(receipt.authorizedResponses).toHaveLength(manifest.files.length);
    expect(receipt.unauthorizedResponses).toHaveLength(
      manifest.files.length * UNAUTHORIZED_SCENARIOS.length,
    );
    expect(
      parseServedArtifactReceiptBytes(canonicalJson(receipt)).receipt,
    ).toEqual(receipt);
  });

  it("rejects noncanonical/duplicate-key receipt bytes and all missing fields", () => {
    const receipt = baseReceipt(baseManifest());
    expect(
      parseServedArtifactReceiptBytes(JSON.stringify(receipt, null, 2)).receipt,
    ).toBeNull();
    expect(
      parseServedArtifactReceiptBytes('{"schemaVersion":1,"schemaVersion":1}')
        .receipt,
    ).toBeNull();

    for (const mutate of [
      (value: any) => delete value.requestMethod,
      (value: any) => delete value.verifiedBy.planSha256,
      (value: any) => delete value.authorizedResponses[0].redirected,
      (value: any) =>
        delete value.unauthorizedResponses[0].leaks.workflowStatus,
      (value: any) => (value.bodyComparisonMethod = "provider-checksum"),
      (value: any) => (value.bodyComparison = "provider-checksum"),
    ]) {
      const invalid = structuredClone(receipt) as any;
      mutate(invalid);
      expect(
        parseServedArtifactReceiptBytes(canonicalJson(invalid)).receipt,
      ).toBeNull();
    }
  });

  it("rejects partial, duplicate, reordered, or stale metadata sets", () => {
    const manifest = baseManifest();
    const receipt = baseReceipt(manifest);

    const partial = structuredClone(receipt) as any;
    partial.unauthorizedResponses.pop();
    partial.unauthorizedCheckCount -= 1;
    partial.unauthorizedMetadataDigest = computeUnauthorizedMetadataDigest(
      partial.unauthorizedResponses,
    );
    const partialCodes = validateServedArtifactReceipt(
      partial,
      manifest,
      computeArtifactManifestDigest(manifest),
    ).map((entry) => entry.code);
    expect(partialCodes).toContain("receipt-unauthorized-count");
    expect(partialCodes).toContain("receipt-unauthorized-coverage");

    const duplicated = structuredClone(receipt) as any;
    duplicated.authorizedResponses[1] = structuredClone(
      duplicated.authorizedResponses[0],
    );
    duplicated.authorizedMetadataDigest = computeAuthorizedMetadataDigest(
      duplicated.authorizedResponses,
    );
    expect(
      validateServedArtifactReceipt(
        duplicated,
        manifest,
        computeArtifactManifestDigest(manifest),
      ).map((entry) => entry.code),
    ).toContain("receipt-authorized-duplicate");

    const reordered = structuredClone(receipt) as any;
    reordered.unauthorizedResponses.reverse();
    reordered.unauthorizedMetadataDigest = computeUnauthorizedMetadataDigest(
      reordered.unauthorizedResponses,
    );
    expect(
      validateServedArtifactReceipt(
        reordered,
        manifest,
        computeArtifactManifestDigest(manifest),
      ).map((entry) => entry.code),
    ).toContain("receipt-unauthorized-order");

    const stale = { ...receipt, authorizedMetadataDigest: hex("9") };
    expect(
      validateServedArtifactReceipt(
        stale,
        manifest,
        computeArtifactManifestDigest(manifest),
      ).map((entry) => entry.code),
    ).toContain("receipt-authorized-metadata-digest");
  });

  it("rejects byte, metadata, identity, and review-set mismatches", () => {
    const manifest = baseManifest();
    for (const mutate of [
      (value: any) => (value.authorizedResponses[0].decodedSha256 = hex("1")),
      (value: any) => (value.authorizedResponses[0].decodedByteLength += 1),
      (value: any) =>
        (value.authorizedResponses[0].robotsMetaResult = "not-applicable"),
      (value: any) => (value.reviewSetResponseSha256 = hex("2")),
    ]) {
      const receipt = structuredClone(baseReceipt(manifest)) as any;
      mutate(receipt);
      receipt.authorizedMetadataDigest = computeAuthorizedMetadataDigest(
        receipt.authorizedResponses,
      );
      expect(
        validateServedArtifactReceipt(
          receipt,
          manifest,
          computeArtifactManifestDigest(manifest),
        ).length,
      ).toBeGreaterThan(0);
    }
  });

  it("strictly rejects redirects, cookies, cache bypass, compression, leaks, mismatches, and raw sensitive fields", () => {
    const manifest = baseManifest();
    for (const mutate of [
      (value: any) => (value.authorizedResponses[0].redirected = true),
      (value: any) => (value.unauthorizedResponses[0].setCookiePresent = true),
      (value: any) =>
        (value.unauthorizedResponses[0].cacheBypassObserved = true),
      (value: any) =>
        (value.authorizedResponses[0].contentEncodingPresent = true),
      (value: any) =>
        (value.unauthorizedResponses[0].leaks.atlasIdentity = true),
      (value: any) => (value.mismatchCounts.access = 1),
      (value: any) => (value.privateOrigin = "http://private-review.invalid"),
      (value: any) => (value.authorization = "Basic secret"),
      (value: any) => (value.body = "<html>private</html>"),
      (value: any) => (value.deploymentId = "raw-id"),
    ]) {
      const receipt = structuredClone(baseReceipt(manifest)) as any;
      mutate(receipt);
      expect(
        parseServedArtifactReceiptBytes(canonicalJson(receipt)).receipt,
      ).toBeNull();
    }
  });
});
