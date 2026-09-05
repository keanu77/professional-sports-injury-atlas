import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  EXPECTED_REVIEW_SET_V1_SHA256,
  assertHistoricalReviewSetV1Unchanged,
  currentContentAuthoritySnapshotDigest,
  currentDecision17AuthoringAuthority,
  currentReviewSetV2ContentAuthoritySnapshotDigest,
} from "../../scripts/generate-review-set";
import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import {
  computeCaseContentDigest,
  computeVideoIdentityDigest,
} from "../../src/lib/cases/digest";
import { EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES } from "../../src/lib/contracts/source-manifest-registry";
import { validateMedicalReviewDecisionV1ReviewSet } from "../../src/lib/governance/medical-review-decision";
import {
  buildReviewSetManifest,
  buildReviewSetManifestV2,
  canonicalReviewSetBytes,
  computeDecision17AuthoringAuthoritySnapshotDigest,
  computeReviewSetV2ContentAuthoritySnapshotDigest,
  DECISION_17_AUTHORIZATION_PATH,
  DECISION_17_AUTHORING_AUTHORITY,
  DECISION_17_PLAN_PATH,
  parseReviewSetManifestBytes,
  parseReviewSetManifestV2Bytes,
  REVIEW_SET_MANIFEST_PATH,
  REVIEW_SET_V1_MANIFEST_PATH,
  REVIEW_SET_V2_MANIFEST_PATH,
  ReviewSetError,
} from "../../src/lib/governance/review-set";
import { getStaticPaths } from "../../src/pages/review/[artifact].json";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const COMMIT = "a".repeat(40);
const hex = (character: string): string => character.repeat(64);

const loadFixture = (relativePath: string): any =>
  JSON.parse(
    readFileSync(
      new URL(`../fixtures/${relativePath}`, import.meta.url),
      "utf8",
    ),
  );

function approvedCaseAndRegistry(): { record: any; registry: any } {
  const sourceManifest = loadFixture(
    "research/source-manifests/FICTIONAL-SOURCE-2026-08-06-001.v1.json",
  );
  const manifestDigest = sha256Hex(canonicalJson(sourceManifest));
  const sourceDecision = {
    ...loadFixture(
      "research/reviews/source-batches/FICTIONAL-SOURCE-2026-08-06-001-source-review-decision.v1.json",
    ),
    manifestDigest,
  };
  const record = loadFixture("cases/valid-medical-review.json");
  record.sourceManifestBinding.manifestDigest = manifestDigest;
  record.sourceManifestBinding.sourceReviewDecisionDigest = sha256Hex(
    canonicalJson(sourceDecision),
  );
  record.sourceManifestBinding.entryDigest = sha256Hex(
    canonicalJson(sourceManifest.entries[0]),
  );
  record.status = "approved";
  record.video.sourceProvenanceVerification.reviewedVideoIdentityDigest =
    computeVideoIdentityDigest(record);
  record.review = {
    status: "approved",
    reviewerName: "Dr. Fictional Owner",
    reviewerQualification: "Fictional Sports Medicine Physician",
    reviewedAt: "2026-08-05T00:00:00Z",
    reviewedContentDigest: "0".repeat(64),
  };
  record.review.reviewedContentDigest = computeCaseContentDigest(record);
  const registry = {
    schemaVersion: 1,
    entries: [
      {
        manifestId: sourceManifest.manifestId,
        manifestPath: `research/source-manifests/${sourceManifest.manifestId}.v1.json`,
        manifestDigest,
        sourceReviewDecisionPath: `research/reviews/source-batches/${sourceManifest.manifestId}-source-review-decision.v1.json`,
        sourceReviewDecisionDigest: sha256Hex(canonicalJson(sourceDecision)),
        sourcePolicyVersion: sourceManifest.sourcePolicyVersion,
        batchType: "launch",
        period: sourceManifest.period,
        createdAt: "2026-08-06T01:00:00Z",
        previousRegistryBytesDigest: sha256Hex(
          EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
        ),
        supersedes: [],
      },
    ],
  };
  return { record, registry };
}

function v2Fixture() {
  const { record, registry } = approvedCaseAndRegistry();
  const manifest = buildReviewSetManifestV2({
    contentCommit: COMMIT,
    cases: [record],
    overviews: [],
    currentUpdate: null,
    registry,
    contentAuthoritySnapshotDigest: hex("3"),
    rendererTreeDigest: hex("4"),
    supportingDataDigest: hex("5"),
    followUps: [
      {
        caseId: record.id,
        sidecarPath: `src/content/follow-ups/${record.slug}.json`,
        draftDigest: hex("6"),
      },
    ],
    authoringAuthority: {
      ...DECISION_17_AUTHORING_AUTHORITY,
      openedScopeIds: [...DECISION_17_AUTHORING_AUTHORITY.openedScopeIds],
      closedScopeIds: [...DECISION_17_AUTHORING_AUTHORITY.closedScopeIds],
    },
  });
  return { manifest, record, registry };
}

afterEach(() => {
  delete process.env.ATLAS_REVIEW_SET_MANIFEST;
  delete process.env.ATLAS_BUILD_MODE;
});

describe("review-set v2 active contract", () => {
  it("binds unchanged approved review and pending follow-up as distinct lineages", () => {
    const { manifest, record } = v2Fixture();

    expect(REVIEW_SET_MANIFEST_PATH).toBe(REVIEW_SET_V2_MANIFEST_PATH);
    expect(REVIEW_SET_V1_MANIFEST_PATH).toBe("review/review-set.v1.json");
    expect(manifest.cases[0]!.clinicalDigest).toBe(
      computeCaseContentDigest(record),
    );
    expect(manifest.cases[0]!.approvedReview).toEqual(record.review);
    expect(manifest.cases[0]!.followUp).toEqual({
      sidecarPath: `src/content/follow-ups/${record.slug}.json`,
      draftDigest: hex("6"),
      status: "pending-owner-signoff",
      sourcePolicyVersion: "nba-v10",
    });
    expect(manifest.authoringAuthority.medicalReviewDecisionAuthorized).toBe(
      false,
    );
    expect(manifest.authoringAuthority.closedScopeIds).toContain(
      "medical-review-decision",
    );
    expect(manifest.authoringAuthoritySnapshotDigest).toBe(
      computeDecision17AuthoringAuthoritySnapshotDigest(
        manifest.authoringAuthority,
      ),
    );
    expect(manifest.approvedCoreContentAuthoritySnapshotDigest).toBe(hex("3"));
    expect(manifest.contentAuthoritySnapshotDigest).toBe(
      computeReviewSetV2ContentAuthoritySnapshotDigest(
        hex("3"),
        manifest.authoringAuthority,
      ),
    );
    expect(manifest.contentAuthoritySnapshotDigest).not.toBe(
      manifest.approvedCoreContentAuthoritySnapshotDigest,
    );
  });

  it("strictly dispatches canonical v1 and v2 without fallback", () => {
    const { manifest, record, registry } = v2Fixture();
    const v2Bytes = canonicalReviewSetBytes(manifest);
    expect(parseReviewSetManifestV2Bytes(v2Bytes).manifest).toEqual(manifest);
    expect(parseReviewSetManifestBytes(v2Bytes).manifest).toBeNull();
    expect(parseReviewSetManifestV2Bytes(`${v2Bytes} `).manifest).toBeNull();

    const v1 = buildReviewSetManifest({
      contentCommit: COMMIT,
      cases: [record],
      overviews: [],
      currentUpdate: null,
      registry,
      contentAuthoritySnapshotDigest: hex("3"),
      rendererTreeDigest: hex("4"),
      supportingDataDigest: hex("5"),
    });
    const v1Bytes = canonicalReviewSetBytes(v1);
    expect(parseReviewSetManifestBytes(v1Bytes).manifest).toEqual(v1);
    expect(parseReviewSetManifestV2Bytes(v1Bytes).manifest).toBeNull();
  });

  it("rejects authority-digest drift and incomplete follow-up coverage", () => {
    const { manifest, record, registry } = v2Fixture();
    const tampered = {
      ...manifest,
      authoringAuthoritySnapshotDigest: hex("f"),
    };
    expect(
      parseReviewSetManifestV2Bytes(canonicalJson(tampered)).issues.map(
        (entry) => entry.code,
      ),
    ).toContain("review-set-v2-authority-digest");
    expect(
      parseReviewSetManifestV2Bytes(
        canonicalJson({
          ...manifest,
          contentAuthoritySnapshotDigest: hex("e"),
        }),
      ).issues.map((entry) => entry.code),
    ).toContain("review-set-v2-content-authority-digest");

    expect(() =>
      buildReviewSetManifestV2({
        contentCommit: COMMIT,
        cases: [record],
        overviews: [],
        currentUpdate: null,
        registry,
        contentAuthoritySnapshotDigest: hex("3"),
        rendererTreeDigest: hex("4"),
        supportingDataDigest: hex("5"),
        followUps: [],
        authoringAuthority: DECISION_17_AUTHORING_AUTHORITY,
      }),
    ).toThrow(ReviewSetError);
  });

  it("keeps historical v1 bytes frozen and reloads exact D17 authority bytes", () => {
    assertHistoricalReviewSetV1Unchanged(PROJECT_ROOT);
    expect(
      sha256Hex(readFileSync(join(PROJECT_ROOT, REVIEW_SET_V1_MANIFEST_PATH))),
    ).toBe(EXPECTED_REVIEW_SET_V1_SHA256);
    expect(currentDecision17AuthoringAuthority(PROJECT_ROOT)).toEqual(
      DECISION_17_AUTHORING_AUTHORITY,
    );
    expect(currentReviewSetV2ContentAuthoritySnapshotDigest(PROJECT_ROOT)).toBe(
      computeReviewSetV2ContentAuthoritySnapshotDigest(
        currentContentAuthoritySnapshotDigest(PROJECT_ROOT),
        DECISION_17_AUTHORING_AUTHORITY,
      ),
    );
  });

  it("requires the exact active plan-binding pair before declaring authoring authority", () => {
    const root = mkdtempSync(join(tmpdir(), "atlas-review-authority-"));
    try {
      for (const relativePath of [
        DECISION_17_PLAN_PATH,
        DECISION_17_AUTHORIZATION_PATH,
        "docs/decisions/plan-binding.v1.json",
      ]) {
        mkdirSync(dirname(join(root, relativePath)), { recursive: true });
      }
      writeFileSync(
        join(root, DECISION_17_PLAN_PATH),
        readFileSync(join(PROJECT_ROOT, DECISION_17_PLAN_PATH)),
      );
      writeFileSync(
        join(root, DECISION_17_AUTHORIZATION_PATH),
        readFileSync(join(PROJECT_ROOT, DECISION_17_AUTHORIZATION_PATH)),
      );
      writeFileSync(
        join(root, "docs/decisions/plan-binding.v1.json"),
        canonicalJson({ documents: [], schemaVersion: 1 }),
      );
      expect(() => currentDecision17AuthoringAuthority(root)).toThrow(
        /plan-binding/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects invalid approved timestamps and cross-case sidecar reuse", () => {
    const { manifest } = v2Fixture();
    const invalidTimestamp = {
      ...manifest,
      cases: [
        {
          ...manifest.cases[0]!,
          approvedReview: {
            ...manifest.cases[0]!.approvedReview,
            reviewedAt: "not-a-timestamp",
          },
        },
      ],
    };
    expect(
      parseReviewSetManifestV2Bytes(canonicalJson(invalidTimestamp)).issues.map(
        (entry) => entry.code,
      ),
    ).toContain("review-set-v2-schema");

    const duplicatePath = {
      ...manifest,
      cases: [
        manifest.cases[0]!,
        { ...manifest.cases[0]!, caseId: `${manifest.cases[0]!.caseId}-Z` },
      ],
    };
    expect(
      parseReviewSetManifestV2Bytes(canonicalJson(duplicatePath)).issues.map(
        (entry) => entry.code,
      ),
    ).toContain("review-set-v2-follow-up-path");
  });

  it("makes medical-review-decision.v1 fail closed on pending v2", () => {
    const { manifest } = v2Fixture();
    expect(
      validateMedicalReviewDecisionV1ReviewSet(manifest).map(
        (entry) => entry.code,
      ),
    ).toEqual(["medical-decision-review-set-version"]);
  });

  it("requires an env-supplied route fixture to be v2", () => {
    const root = mkdtempSync(join(tmpdir(), "atlas-review-set-v2-route-"));
    try {
      const { manifest, record, registry } = v2Fixture();
      const fixturePath = join(root, "review-set.json");
      process.env.ATLAS_BUILD_MODE = "review";
      process.env.ATLAS_REVIEW_SET_MANIFEST = fixturePath;
      expect(() => getStaticPaths()).toThrow(/missing/);
      writeFileSync(fixturePath, canonicalReviewSetBytes(manifest));
      expect(getStaticPaths()[0]!.props.body).toBe(
        canonicalReviewSetBytes(manifest),
      );

      const v1 = buildReviewSetManifest({
        contentCommit: COMMIT,
        cases: [record],
        overviews: [],
        currentUpdate: null,
        registry,
        contentAuthoritySnapshotDigest: hex("3"),
        rendererTreeDigest: hex("4"),
        supportingDataDigest: hex("5"),
      });
      writeFileSync(fixturePath, canonicalReviewSetBytes(v1));
      expect(() => getStaticPaths()).toThrow(/invalid/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
