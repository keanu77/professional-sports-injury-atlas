import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { currentContentAuthoritySnapshotDigest } from "../../scripts/generate-review-set";
import { canonicalJson, sha256Hex } from "../../src/lib/cases/canonical-json";
import {
  computeCaseContentDigest,
  computeVideoIdentityDigest,
} from "../../src/lib/cases/digest";
import { computeInjuryOverviewDigest } from "../../src/lib/cases/injury-overview-digest";
import { computeQuarterlyUpdateDigest } from "../../src/lib/cases/update-digest";
import { EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES } from "../../src/lib/contracts/source-manifest-registry";
import {
  buildArtifactManifest,
  computeArtifactManifestDigest,
} from "../../src/lib/governance/artifact-manifest";
import {
  parseMedicalReviewDecisionBytes,
  validateAppliedMedicalReviewDecision,
  validateMedicalReviewDecisionArtifacts,
} from "../../src/lib/governance/medical-review-decision";
import {
  buildReviewSetManifest,
  canonicalReviewSetBytes,
  computeContentAuthoritySnapshotDigest,
  computeReviewSetDigest,
  parseReviewSetManifestBytes,
  ReviewSetError,
} from "../../src/lib/governance/review-set";
import { computeResponseMetadataDigest } from "../../src/lib/governance/served-artifact-receipt";

const hex = (ch: string): string => ch.repeat(64);
const COMMIT = "a".repeat(40);
const REVIEWER = "Dr. Fictional Reviewer Two";
const QUALIFICATION = "Fictional Sports Medicine Physician";
const REVIEWED_AT = "2026-08-05T00:00:00Z";

const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );

function fixtureRegistry(extraEntries: any[] = []): any {
  const manifest = loadFixture(
    "research/source-manifests/FICTIONAL-SOURCE-2026-08-06-001.v1.json",
  );
  const manifestDigest = sha256Hex(canonicalJson(manifest));
  const decision = {
    ...loadFixture(
      "research/reviews/source-batches/FICTIONAL-SOURCE-2026-08-06-001-source-review-decision.v1.json",
    ),
    manifestDigest,
  };
  return {
    schemaVersion: 1,
    entries: [
      {
        manifestId: manifest.manifestId,
        manifestPath: `research/source-manifests/${manifest.manifestId}.v1.json`,
        manifestDigest,
        sourceReviewDecisionPath: `research/reviews/source-batches/${manifest.manifestId}-source-review-decision.v1.json`,
        sourceReviewDecisionDigest: sha256Hex(canonicalJson(decision)),
        sourcePolicyVersion: manifest.sourcePolicyVersion,
        batchType: "launch",
        period: manifest.period,
        createdAt: "2026-08-06T01:00:00Z",
        previousRegistryBytesDigest: sha256Hex(
          EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
        ),
        supersedes: [],
      },
      ...extraEntries,
    ],
  };
}

function approvedFixtureCase(): any {
  const manifest = loadFixture(
    "research/source-manifests/FICTIONAL-SOURCE-2026-08-06-001.v1.json",
  );
  const manifestDigest = sha256Hex(canonicalJson(manifest));
  const decision = {
    ...loadFixture(
      "research/reviews/source-batches/FICTIONAL-SOURCE-2026-08-06-001-source-review-decision.v1.json",
    ),
    manifestDigest,
  };
  const record = loadFixture("cases/valid-medical-review.json");
  record.sourceManifestBinding.manifestDigest = manifestDigest;
  record.sourceManifestBinding.sourceReviewDecisionDigest = sha256Hex(
    canonicalJson(decision),
  );
  record.sourceManifestBinding.entryDigest = sha256Hex(
    canonicalJson(manifest.entries[0]),
  );
  record.status = "approved";
  record.video.sourceProvenanceVerification.reviewedVideoIdentityDigest =
    computeVideoIdentityDigest(record);
  record.review = {
    status: "approved",
    reviewerName: REVIEWER,
    reviewerQualification: QUALIFICATION,
    reviewedAt: REVIEWED_AT,
    reviewedContentDigest: "0".repeat(64),
  };
  record.review.reviewedContentDigest = computeCaseContentDigest(record);
  return record;
}

function approvedOverview(): any {
  const overview = loadFixture("injuries/valid-medical-review.json");
  overview.status = "approved";
  overview.review = {
    status: "approved",
    reviewerName: REVIEWER,
    reviewerQualification: QUALIFICATION,
    reviewedAt: REVIEWED_AT,
    reviewedContentDigest: "0".repeat(64),
  };
  overview.review.reviewedContentDigest = computeInjuryOverviewDigest(overview);
  return overview;
}

function approvedUpdate(record: any): any {
  const update = loadFixture("updates/valid-baseline.json");
  update.addedCases = [
    {
      caseId: record.id,
      currentClinicalDigest: computeCaseContentDigest(record),
      currentVideoSourceDigest: hex("2"),
    },
  ];
  update.status = "approved";
  update.publishedAt = "2026-08-06T11:00:00Z";
  update.review = {
    status: "approved",
    reviewerName: REVIEWER,
    reviewerQualification: QUALIFICATION,
    reviewedAt: REVIEWED_AT,
    reviewedContentDigest: "0".repeat(64),
  };
  update.review.reviewedContentDigest = computeQuarterlyUpdateDigest(update);
  return update;
}

function buildManifestFixture(extraRegistryEntries: any[] = []) {
  const record = approvedFixtureCase();
  const overview = approvedOverview();
  const update = approvedUpdate(record);
  const registry = fixtureRegistry(extraRegistryEntries);
  const manifest = buildReviewSetManifest({
    contentCommit: COMMIT,
    cases: [record],
    overviews: [overview],
    currentUpdate: update,
    registry,
    contentAuthoritySnapshotDigest: hex("3"),
    rendererTreeDigest: hex("4"),
    supportingDataDigest: hex("5"),
  });
  return { record, overview, update, registry, manifest };
}

describe("review-set manifest", () => {
  it("binds cases, origins, referenced batches, overviews, and the update", () => {
    const { record, overview, update, manifest } = buildManifestFixture();
    expect(manifest.cases).toHaveLength(1);
    expect(manifest.cases[0]).toEqual({
      caseId: record.id,
      clinicalDigest: computeCaseContentDigest(record),
      origin: {
        candidateId: record.sourceManifestBinding.candidateId,
        manifestId: record.sourceManifestBinding.manifestId,
        manifestDigest: record.sourceManifestBinding.manifestDigest,
        entryDigest: record.sourceManifestBinding.entryDigest,
        sourceReviewDecisionDigest:
          record.sourceManifestBinding.sourceReviewDecisionDigest,
        sourcePolicyVersion: record.sourceManifestBinding.sourcePolicyVersion,
      },
    });
    expect(manifest.sourceBatches).toEqual([
      {
        manifestId: record.sourceManifestBinding.manifestId,
        manifestDigest: record.sourceManifestBinding.manifestDigest,
        sourceReviewDecisionDigest:
          record.sourceManifestBinding.sourceReviewDecisionDigest,
      },
    ]);
    expect(manifest.overviews).toEqual([
      {
        injuryCode: overview.injuryCode,
        overviewDigest: computeInjuryOverviewDigest(overview),
      },
    ]);
    expect(manifest.currentUpdate).toEqual({
      updateId: update.id,
      updateDigest: computeQuarterlyUpdateDigest(update),
    });
  });

  it("never binds an unreferenced future batch", () => {
    const future = {
      manifestId: "FUTURE-SOURCE-2026-09-01-001",
      manifestPath:
        "research/source-manifests/FUTURE-SOURCE-2026-09-01-001.v1.json",
      manifestDigest: hex("6"),
      sourceReviewDecisionPath:
        "research/reviews/source-batches/FUTURE-SOURCE-2026-09-01-001-source-review-decision.v1.json",
      sourceReviewDecisionDigest: hex("7"),
      sourcePolicyVersion: "source-policy-v1",
      batchType: "quarterly",
      period: "2026-q4",
      createdAt: "2026-09-01T00:00:00Z",
      previousRegistryBytesDigest: hex("8"),
      supersedes: [],
    };
    const { manifest } = buildManifestFixture([future]);
    expect(
      manifest.sourceBatches.some(
        (batch) => batch.manifestId === future.manifestId,
      ),
    ).toBe(false);
  });

  it("round-trips exact canonical bytes and rejects tampered bytes", () => {
    const { manifest } = buildManifestFixture();
    const bytes = canonicalReviewSetBytes(manifest);
    const parsed = parseReviewSetManifestBytes(bytes);
    expect(parsed.manifest).toEqual(manifest);
    expect(parsed.reviewSetDigest).toBe(computeReviewSetDigest(manifest));

    const reformatted = parseReviewSetManifestBytes(`${bytes} `);
    expect(reformatted.manifest).toBeNull();

    const truncated = parseReviewSetManifestBytes(bytes.slice(0, -2));
    expect(truncated.manifest).toBeNull();
  });

  it("changes its digest when a bound clinical payload changes", () => {
    const first = buildManifestFixture();
    const second = buildManifestFixture();
    second.record.general.whatHappened = "Changed clinical narrative.";
    const changed = buildReviewSetManifest({
      contentCommit: COMMIT,
      cases: [second.record],
      overviews: [second.overview],
      currentUpdate: second.update,
      registry: second.registry,
      contentAuthoritySnapshotDigest: hex("3"),
      rendererTreeDigest: hex("4"),
      supportingDataDigest: hex("5"),
    });
    expect(computeReviewSetDigest(changed)).not.toBe(
      computeReviewSetDigest(first.manifest),
    );
  });
});

describe("content-authority snapshot", () => {
  const documents = [
    {
      role: "specification",
      path: "docs/superpowers/specs/spec.md",
      documentSha256: hex("1"),
      executionDecisionSha256: null,
    },
    {
      role: "plan",
      path: "docs/superpowers/plans/platform.md",
      documentSha256: hex("2"),
      executionDecisionSha256: hex("3"),
    },
  ];

  it("is order-insensitive and excludes later unrelated documents", () => {
    const digest = computeContentAuthoritySnapshotDigest(documents);
    expect(
      computeContentAuthoritySnapshotDigest([...documents].reverse()),
    ).toBe(digest);
    // A later hosting/public plan is simply never part of the projection, so
    // appending one to the plan binding cannot change a completed snapshot.
    expect(
      computeContentAuthoritySnapshotDigest([
        ...documents,
        {
          role: "plan",
          path: "docs/superpowers/plans/hosting.md",
          documentSha256: hex("4"),
          executionDecisionSha256: hex("5"),
        },
      ]),
    ).not.toBe(digest);
  });

  it("changes when a bound document digest changes and rejects duplicates", () => {
    const digest = computeContentAuthoritySnapshotDigest(documents);
    expect(
      computeContentAuthoritySnapshotDigest([
        documents[0]!,
        { ...documents[1]!, documentSha256: hex("f") },
      ]),
    ).not.toBe(digest);
    expect(() =>
      computeContentAuthoritySnapshotDigest([...documents, documents[0]!]),
    ).toThrow(ReviewSetError);
  });

  it("projects authority roles without letting G4/G6 create an authorization cycle", () => {
    const root = mkdtempSync(join(tmpdir(), "atlas-content-authority-"));
    const bindingPath = join(root, "docs/decisions/plan-binding.v1.json");
    mkdirSync(join(root, "docs/decisions"), { recursive: true });

    const plan = (
      path: string,
      role: string,
      status: "authorized" | "not-authorized" = "authorized",
      documentSha256 = hex("3"),
      decisionSha256 = hex("4"),
    ): any => ({
      documentType: "plan",
      lifecycle: "active",
      path,
      sha256: documentSha256,
      executionAuthorization: {
        status,
        role,
        decisionSha256: status === "authorized" ? decisionSha256 : null,
      },
    });
    const documents: any[] = [
      {
        documentType: "specification",
        lifecycle: "active",
        path: "docs/superpowers/specs/spec.md",
        sha256: hex("1"),
        executionAuthorization: null,
      },
      {
        documentType: "execution-controller",
        lifecycle: "active",
        path: "docs/superpowers/plans/controller.md",
        sha256: hex("2"),
        executionAuthorization: null,
      },
      plan("plans/platform-3.md", "platform-foundation"),
      plan("plans/source-4.md", "nba-injury-case-source-discovery"),
      plan("plans/authoring-5.md", "nba-injury-case-authoring"),
      plan(
        "plans/hosting-6.md",
        "atlas-private-hosting-and-review",
        "not-authorized",
      ),
    ];
    const writeBinding = (): void => {
      writeFileSync(
        bindingPath,
        canonicalJson({ schemaVersion: 1, documents }),
      );
    };

    try {
      writeBinding();
      const baseline = currentContentAuthoritySnapshotDigest(root);

      documents[5].executionAuthorization = {
        status: "authorized",
        role: "atlas-private-hosting-and-review",
        decisionSha256: hex("6"),
      };
      writeBinding();
      expect(currentContentAuthoritySnapshotDigest(root)).toBe(baseline);

      documents.push(
        plan("plans/public-7.md", "atlas-public-release", "authorized"),
        plan("plans/future-8.md", "unrelated-future", "not-authorized"),
      );
      writeBinding();
      expect(currentContentAuthoritySnapshotDigest(root)).toBe(baseline);

      documents[3].sha256 = hex("a");
      writeBinding();
      const changedSource = currentContentAuthoritySnapshotDigest(root);
      expect(changedSource).not.toBe(baseline);

      documents[3].sha256 = hex("3");
      documents[4].executionAuthorization.decisionSha256 = hex("b");
      writeBinding();
      expect(currentContentAuthoritySnapshotDigest(root)).not.toBe(baseline);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("preserves the completed real clinical authority snapshot after G4 authorization", () => {
    const root = join(import.meta.dirname, "../..");
    const frozenReviewSet = JSON.parse(
      readFileSync(join(root, "review/review-set.v1.json"), "utf8"),
    ) as { contentAuthoritySnapshotDigest: string };
    expect(currentContentAuthoritySnapshotDigest(root)).toBe(
      frozenReviewSet.contentAuthoritySnapshotDigest,
    );
  });
});

describe("medical-review decision", () => {
  function decisionFixture() {
    const { record, overview, update, manifest } = buildManifestFixture();
    const reviewSetBytes = canonicalReviewSetBytes(manifest);
    const reviewSetDigest = sha256Hex(reviewSetBytes);
    const artifactManifest = buildArtifactManifest("review", [
      {
        path: "cases/fictional-forward-alpha-ankle-sprain-2026/index.html",
        bytes: "<html>case page</html>",
        contentType: "text/html; charset=utf-8",
      },
      {
        path: "index.html",
        bytes: "<html>home</html>",
        contentType: "text/html; charset=utf-8",
      },
      {
        path: "review/review-set.json",
        bytes: reviewSetBytes,
        contentType: "application/json",
      },
    ]);
    const artifactManifestDigest =
      computeArtifactManifestDigest(artifactManifest);
    const responses = artifactManifest.files.map((file) => ({
      path: file.path,
      status: 200,
      contentType: file.contentType,
      sha256: file.sha256,
    }));
    const receipt = {
      schemaVersion: 1,
      receiptType: "served-artifact",
      artifactManifestDigest,
      urlHash: sha256Hex("https://private.example.org"),
      deploymentIdHash: sha256Hex("deployment-1"),
      checkedAt: "2026-08-05T20:00:00Z",
      bodyComparison: "exact-bytes",
      responses,
      responseMetadataDigest: computeResponseMetadataDigest(responses as any),
    };
    const decision = {
      schemaVersion: 1,
      decisionType: "site-medical-review",
      decisionStatus: "approved",
      reviewerName: REVIEWER,
      reviewerQualification: QUALIFICATION,
      reviewedAt: REVIEWED_AT,
      reviewSetDigest,
      privateDistManifestDigest: artifactManifestDigest,
      servedReviewArtifactReceiptDigest: sha256Hex(canonicalJson(receipt)),
      reviewSetResponseSha256: sha256Hex(reviewSetBytes),
      privateUrlHash: receipt.urlHash,
      deploymentIdHash: receipt.deploymentIdHash,
      caseDecisions: [
        {
          caseId: record.id,
          clinicalDigest: computeCaseContentDigest(record),
          status: "approved",
          classicExceptionApprovedBy: null,
        },
      ],
      overviewDecisions: [
        {
          injuryCode: overview.injuryCode,
          overviewDigest: computeInjuryOverviewDigest(overview),
          status: "approved",
        },
      ],
      updateDecision: {
        updateId: update.id,
        updateDigest: computeQuarterlyUpdateDigest(update),
        status: "approved",
      },
    };
    return {
      record,
      overview,
      update,
      manifest,
      reviewSetBytes,
      reviewSetDigest,
      artifactManifest,
      artifactManifestDigest,
      receipt,
      decision,
    };
  }

  function contextOf(fx: ReturnType<typeof decisionFixture>) {
    return {
      reviewSetManifest: fx.manifest,
      reviewSetDigest: fx.reviewSetDigest,
      reviewSetBytes: fx.reviewSetBytes,
      artifactManifest: fx.artifactManifest,
      artifactManifestDigest: fx.artifactManifestDigest,
      servedReceipt: fx.receipt,
      servedReceiptDigest: sha256Hex(canonicalJson(fx.receipt)),
    };
  }

  it("accepts a complete, exactly bound decision", () => {
    const fx = decisionFixture();
    const parsed = parseMedicalReviewDecisionBytes(canonicalJson(fx.decision));
    expect(parsed.decision).not.toBeNull();
    expect(
      validateMedicalReviewDecisionArtifacts(parsed.decision!, contextOf(fx)),
    ).toEqual([]);
    expect(
      validateAppliedMedicalReviewDecision(
        parsed.decision!,
        fx.manifest,
        [fx.record],
        [fx.overview],
        fx.update,
      ),
    ).toEqual([]);
  });

  it("rejects non-canonical bytes and unknown fields", () => {
    const fx = decisionFixture();
    const pretty = JSON.stringify(fx.decision, null, 2);
    expect(parseMedicalReviewDecisionBytes(pretty).decision).toBeNull();
    const extended = { ...fx.decision, selfSigned: true };
    expect(
      parseMedicalReviewDecisionBytes(canonicalJson(extended)).decision,
    ).toBeNull();
  });

  it("fails when one case HTML page changed while the review-set JSON is intact", () => {
    const fx = decisionFixture();
    const tamperedResponses = fx.receipt.responses.map((response) =>
      response.path.startsWith("cases/")
        ? { ...response, sha256: sha256Hex("tampered case page") }
        : response,
    );
    const tamperedReceipt = {
      ...fx.receipt,
      responses: tamperedResponses,
      responseMetadataDigest: computeResponseMetadataDigest(
        tamperedResponses as any,
      ),
    };
    const decision = {
      ...fx.decision,
      servedReviewArtifactReceiptDigest: sha256Hex(
        canonicalJson(tamperedReceipt),
      ),
    };
    const parsed = parseMedicalReviewDecisionBytes(canonicalJson(decision));
    const issues = validateMedicalReviewDecisionArtifacts(parsed.decision!, {
      ...contextOf(fx),
      servedReceipt: tamperedReceipt,
      servedReceiptDigest: sha256Hex(canonicalJson(tamperedReceipt)),
    });
    expect(issues.map((entry) => entry.code)).toContain(
      "receipt-byte-mismatch",
    );
  });

  it("fails on deployment/URL/review-set identity mismatches", () => {
    const fx = decisionFixture();
    const parsed = parseMedicalReviewDecisionBytes(
      canonicalJson({
        ...fx.decision,
        privateUrlHash: hex("9"),
        deploymentIdHash: hex("8"),
        reviewSetResponseSha256: hex("7"),
      }),
    );
    const issues = validateMedicalReviewDecisionArtifacts(
      parsed.decision!,
      contextOf(fx),
    );
    const observed = issues.map((entry) => entry.code);
    expect(observed).toContain("medical-decision-url");
    expect(observed).toContain("medical-decision-deployment");
    expect(observed).toContain("medical-decision-review-set-response");
  });

  it("fails when applied workflow fields drift from the durable decision", () => {
    const fx = decisionFixture();
    const parsed = parseMedicalReviewDecisionBytes(canonicalJson(fx.decision));
    fx.record.review.reviewerName = "Dr. Impersonator";
    expect(
      validateAppliedMedicalReviewDecision(
        parsed.decision!,
        fx.manifest,
        [fx.record],
        [fx.overview],
        fx.update,
      ).map((entry) => entry.code),
    ).toContain("medical-decision-applied-mismatch");
  });

  it("fails when the decision does not cover the exact review-set IDs", () => {
    const fx = decisionFixture();
    const parsed = parseMedicalReviewDecisionBytes(
      canonicalJson({ ...fx.decision, caseDecisions: [] }),
    );
    expect(
      validateAppliedMedicalReviewDecision(
        parsed.decision!,
        fx.manifest,
        [fx.record],
        [fx.overview],
        fx.update,
      ).map((entry) => entry.code),
    ).toContain("medical-decision-case-coverage");
  });
});
