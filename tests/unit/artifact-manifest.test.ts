import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Hex } from "../../src/lib/cases/canonical-json";
import {
  buildArtifactManifest,
  computeArtifactManifestDigest,
  parseArtifactManifestBytes,
  validateArtifactManifest,
  validateArtifactManifestCoverage,
  type ArtifactManifest,
} from "../../src/lib/governance/artifact-manifest";
import {
  computeResponseMetadataDigest,
  parseServedArtifactReceiptBytes,
  validateServedArtifactReceipt,
  type ServedArtifactReceipt,
} from "../../src/lib/governance/served-artifact-receipt";

const hex = (ch: string): string => ch.repeat(64);

function baseManifest(): ArtifactManifest {
  return buildArtifactManifest("review", [
    {
      path: "index.html",
      bytes: "<html>home</html>",
      contentType: "text/html; charset=utf-8",
    },
    {
      path: "robots.txt",
      bytes: "User-agent: *\nDisallow: /\n",
      contentType: "text/plain; charset=utf-8",
    },
    {
      path: "review/review-set.json",
      bytes: '{"schemaVersion":1}',
      contentType: "application/json",
    },
  ]);
}

function baseReceipt(manifest: ArtifactManifest): ServedArtifactReceipt {
  const responses = manifest.files.map((file) => ({
    path: file.path,
    status: 200,
    contentType: file.contentType,
    sha256: file.sha256,
  }));
  return {
    schemaVersion: 1,
    receiptType: "served-artifact",
    artifactManifestDigest: computeArtifactManifestDigest(manifest),
    urlHash: sha256Hex("https://private.example.com"),
    deploymentIdHash: sha256Hex("deployment-1"),
    checkedAt: "2026-08-05T20:00:00Z",
    bodyComparison: "exact-bytes",
    responses,
    responseMetadataDigest: computeResponseMetadataDigest(responses),
  };
}

describe("artifact manifest", () => {
  it("builds one strict canonical sorted-path manifest", () => {
    const manifest = baseManifest();
    expect(validateArtifactManifest(manifest)).toEqual([]);
    expect(manifest.files.map((file) => file.path)).toEqual([
      "index.html",
      "review/review-set.json",
      "robots.txt",
    ]);
    const roundTrip = parseArtifactManifestBytes(canonicalJson(manifest));
    expect(roundTrip.manifest).toEqual(manifest);
    expect(roundTrip.manifestDigest).toBe(
      computeArtifactManifestDigest(manifest),
    );
  });

  it("rejects traversal, absolute, and backslash paths", () => {
    const manifest = baseManifest();
    for (const badPath of [
      "../escape.html",
      "/absolute.html",
      "a\\b.html",
      "a//b.html",
      "./dot.html",
    ]) {
      const tampered = {
        ...manifest,
        files: [
          {
            path: badPath,
            sha256: hex("1"),
            byteLength: 1,
            contentType: "text/html",
          },
        ],
      };
      expect(
        validateArtifactManifest(tampered).length,
        badPath,
      ).toBeGreaterThan(0);
    }
  });

  it("rejects duplicate and unsorted paths", () => {
    const manifest = baseManifest();
    const duplicate = {
      ...manifest,
      files: [manifest.files[0]!, manifest.files[0]!],
    };
    expect(
      validateArtifactManifest(duplicate).map((entry) => entry.code),
    ).toContain("artifact-duplicate-path");
    const unsorted = {
      ...manifest,
      files: [...manifest.files].reverse(),
    };
    expect(
      validateArtifactManifest(unsorted).map((entry) => entry.code),
    ).toContain("artifact-order");
  });

  it("rejects malformed SHA/length/content-type metadata", () => {
    const manifest = baseManifest();
    const badSha = {
      ...manifest,
      files: [{ ...manifest.files[0]!, sha256: "not-hex" }],
    };
    expect(validateArtifactManifest(badSha).length).toBeGreaterThan(0);
    const badLength = {
      ...manifest,
      files: [{ ...manifest.files[0]!, byteLength: -1 }],
    };
    expect(validateArtifactManifest(badLength).length).toBeGreaterThan(0);
    const badType = {
      ...manifest,
      files: [{ ...manifest.files[0]!, contentType: "" }],
    };
    expect(validateArtifactManifest(badType).length).toBeGreaterThan(0);
  });

  it("rejects including its own out-of-tree manifest/receipt", () => {
    const manifest = baseManifest();
    const selfReferential = {
      ...manifest,
      files: [
        {
          path: "review/private-dist-manifest.v1.json",
          sha256: hex("1"),
          byteLength: 10,
          contentType: "application/json",
        },
      ],
    };
    expect(
      validateArtifactManifest(selfReferential).map((entry) => entry.code),
    ).toContain("artifact-self-reference");
    const namedSelf = {
      ...manifest,
      files: [
        {
          path: "dist-manifest.json",
          sha256: hex("1"),
          byteLength: 10,
          contentType: "application/json",
        },
      ],
    };
    expect(
      validateArtifactManifest(namedSelf, {
        selfPaths: ["dist-manifest.json"],
      }).map((entry) => entry.code),
    ).toContain("artifact-self-reference");
    // A built review route output is a legitimate manifest entry.
    expect(validateArtifactManifest(manifest)).toEqual([]);
  });

  it("requires covering every built file exactly once", () => {
    const manifest = baseManifest();
    const paths = manifest.files.map((file) => file.path);
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

describe("served-artifact receipt", () => {
  it("accepts a complete exact-bytes receipt", () => {
    const manifest = baseManifest();
    const receipt = baseReceipt(manifest);
    expect(
      validateServedArtifactReceipt(
        receipt,
        manifest,
        computeArtifactManifestDigest(manifest),
      ),
    ).toEqual([]);
    const parsed = parseServedArtifactReceiptBytes(canonicalJson(receipt));
    expect(parsed.receipt).toEqual(receipt);
  });

  it("requires full path-set coverage", () => {
    const manifest = baseManifest();
    const receipt = baseReceipt(manifest);
    const partial = {
      ...receipt,
      responses: receipt.responses.slice(1),
      responseMetadataDigest: computeResponseMetadataDigest(
        receipt.responses.slice(1),
      ),
    };
    expect(
      validateServedArtifactReceipt(
        partial,
        manifest,
        computeArtifactManifestDigest(manifest),
      ).map((entry) => entry.code),
    ).toContain("receipt-coverage");
  });

  it("rejects a stale response-metadata digest", () => {
    const manifest = baseManifest();
    const receipt = {
      ...baseReceipt(manifest),
      responseMetadataDigest: hex("1"),
    };
    expect(
      validateServedArtifactReceipt(
        receipt,
        manifest,
        computeArtifactManifestDigest(manifest),
      ).map((entry) => entry.code),
    ).toContain("receipt-metadata-digest");
  });

  it("provider checksum mode never skips route/status/content-type checks", () => {
    const manifest = baseManifest();
    const receipt = baseReceipt(manifest);
    const responses = receipt.responses.map((response, index) =>
      index === 0
        ? { ...response, status: 404, contentType: "text/plain" }
        : response,
    );
    const checksumReceipt = {
      ...receipt,
      bodyComparison: "provider-checksum" as const,
      responses,
      responseMetadataDigest: computeResponseMetadataDigest(responses),
    };
    const observed = validateServedArtifactReceipt(
      checksumReceipt,
      manifest,
      computeArtifactManifestDigest(manifest),
    ).map((entry) => entry.code);
    expect(observed).toContain("receipt-status");
    expect(observed).toContain("receipt-content-type");
  });

  it("rejects byte mismatches and extra paths", () => {
    const manifest = baseManifest();
    const receipt = baseReceipt(manifest);
    const responses = [
      { ...receipt.responses[0]!, sha256: hex("9") },
      ...receipt.responses.slice(1),
      {
        path: "zz-extra.html",
        status: 200,
        contentType: "text/html; charset=utf-8",
        sha256: hex("2"),
      },
    ];
    const tampered = {
      ...receipt,
      responses,
      responseMetadataDigest: computeResponseMetadataDigest(responses),
    };
    const observed = validateServedArtifactReceipt(
      tampered,
      manifest,
      computeArtifactManifestDigest(manifest),
    ).map((entry) => entry.code);
    expect(observed).toContain("receipt-byte-mismatch");
    expect(observed).toContain("receipt-extra-path");
  });

  it("rejects a receipt bound to a different manifest digest", () => {
    const manifest = baseManifest();
    const receipt = baseReceipt(manifest);
    expect(
      validateServedArtifactReceipt(receipt, manifest, hex("3")).map(
        (entry) => entry.code,
      ),
    ).toContain("receipt-manifest-digest");
  });
});
