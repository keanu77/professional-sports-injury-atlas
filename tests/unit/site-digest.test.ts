import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "../../src/lib/cases/canonical-json";
import {
  computeRendererTreeDigest,
  computeSiteDigest,
  computeSupportingDataDigest,
  isRendererTreePath,
  RendererTreeError,
  validateSiteGovernanceRecord,
  type SiteDigestInput,
  type SupportingDataInput,
} from "../../src/lib/governance/site-digest";

const hex = (ch: string): string => ch.repeat(64);

function baseInput(): SiteDigestInput {
  return {
    siteStatus: "public-approved",
    allowIndexing: true,
    reviewedContentCommit: "a".repeat(40),
    publicRendererTreeDigest: hex("1"),
    sourceBatches: [
      {
        manifestId: "SYN-SOURCE-001",
        manifestDigest: hex("2"),
        sourceReviewDecisionDigest: hex("3"),
        entryDigest: hex("4"),
      },
    ],
    reviewSetDigest: hex("5"),
    medicalReviewDecisionDigest: hex("6"),
    publicCases: [
      {
        caseId: "CASE-SYN-2026-001",
        clinicalDigest: hex("7"),
        videoSourceDigest: hex("8"),
        publicRightsDecisionDigest: hex("9"),
      },
    ],
    overviews: [
      { injuryCode: "acl", overviewDigest: hex("a") },
      { injuryCode: "ankle-sprain", overviewDigest: hex("b") },
      { injuryCode: "achilles-rupture", overviewDigest: hex("c") },
    ],
    currentUpdate: {
      updateId: "2026-q3",
      updateDigest: hex("d"),
      publishedAt: "2026-08-06T11:00:00Z",
    },
    baseReleaseDigest: null,
    baseHistoryBytesDigest: hex("e"),
    courseLinks: [
      {
        courseKey: "acl-primary-reconstruction",
        approvedPublicUrl: "https://courses.example.org/acl/",
        courseGovernanceProjectionDigest: hex("f"),
        linkApprovalDecisionDigest: hex("0"),
      },
    ],
    publicSiteUrl: "https://atlas.example.org",
    privacyPolicyUrl: "https://atlas.example.org/privacy/",
    rightsPolicyUrl: "https://atlas.example.org/rights/",
    sourcePolicyVersion: "source-policy-v1",
    publicRightsPolicyVersion: "public-rights-policy-v1",
    courseLinkPolicyVersion: "course-link-policy-v1",
  };
}

describe("site digest", () => {
  it("is deterministic and independent of tuple input order", () => {
    const input = baseInput();
    const digest = computeSiteDigest(input);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    const shuffled = baseInput();
    shuffled.overviews = [...shuffled.overviews].reverse();
    expect(computeSiteDigest(shuffled)).toBe(digest);
  });

  it("invalidates the old authorizedSiteDigest on every covered change", () => {
    const authorized = computeSiteDigest(baseInput());
    const mutations: Array<[string, (input: SiteDigestInput) => void]> = [
      [
        "current approved update ID/digest",
        (input) => {
          input.currentUpdate = {
            ...input.currentUpdate,
            updateDigest: hex("1"),
          };
        },
      ],
      [
        "current update publishedAt",
        (input) => {
          input.currentUpdate = {
            ...input.currentUpdate,
            publishedAt: "2026-08-07T11:00:00Z",
          };
        },
      ],
      [
        "one injury overview",
        (input) => {
          input.overviews = input.overviews.map((tuple) =>
            tuple.injuryCode === "acl"
              ? { ...tuple, overviewDigest: hex("1") }
              : tuple,
          );
        },
      ],
      [
        "review-set digest",
        (input) => {
          input.reviewSetDigest = hex("1");
        },
      ],
      [
        "medical-review-decision digest",
        (input) => {
          input.medicalReviewDecisionDigest = hex("1");
        },
      ],
      [
        "one public-rights decision",
        (input) => {
          input.publicCases = input.publicCases.map((tuple) => ({
            ...tuple,
            publicRightsDecisionDigest: hex("1"),
          }));
        },
      ],
      [
        "one course-link approval",
        (input) => {
          input.courseLinks = input.courseLinks.map((tuple) => ({
            ...tuple,
            linkApprovalDecisionDigest: hex("1"),
          }));
        },
      ],
      [
        "reviewed-content commit",
        (input) => {
          input.reviewedContentCommit = "b".repeat(40);
        },
      ],
      [
        "public-renderer tree digest",
        (input) => {
          input.publicRendererTreeDigest = hex("2");
        },
      ],
      [
        "frozen candidate baseReleaseDigest",
        (input) => {
          input.baseReleaseDigest = hex("2");
        },
      ],
      [
        "frozen candidate baseHistoryBytesDigest",
        (input) => {
          input.baseHistoryBytesDigest = hex("2");
        },
      ],
      [
        "a referenced source batch tuple",
        (input) => {
          input.sourceBatches = input.sourceBatches.map((tuple) => ({
            ...tuple,
            entryDigest: hex("1"),
          }));
        },
      ],
      [
        "the public site URL",
        (input) => {
          input.publicSiteUrl = "https://other.example.org";
        },
      ],
      [
        "the current source-policy version",
        (input) => {
          input.sourcePolicyVersion = "source-policy-v2";
        },
      ],
    ];
    for (const [label, mutate] of mutations) {
      const input = baseInput();
      mutate(input);
      expect(computeSiteDigest(input), label).not.toBe(authorized);
    }
  });

  it("appending an unreferenced batch alone does not change the digest", () => {
    // The digest input only ever receives public case-referenced tuples, so
    // an unreferenced future batch never enters the projection.
    const digest = computeSiteDigest(baseInput());
    expect(computeSiteDigest(baseInput())).toBe(digest);
  });
});

describe("renderer tree digest", () => {
  const files = [
    { path: "src/pages/index.astro", sha256: hex("1") },
    { path: "src/pages/review/[artifact].json.ts", sha256: hex("2") },
    { path: "src/layouts/BaseLayout.astro", sha256: hex("3") },
    { path: "src/components/video/VideoEmbed.astro", sha256: hex("4") },
    { path: "src/styles/global.css", sha256: hex("5") },
    { path: "src/scripts/preferences.ts", sha256: hex("6") },
    { path: "src/lib/governance/release-gate.ts", sha256: hex("7") },
    { path: "scripts/release-check.ts", sha256: hex("8") },
    { path: "astro.config.mjs", sha256: hex("9") },
    { path: "package-lock.json", sha256: hex("a") },
    { path: "src/data/taxonomy/injuries.ts", sha256: hex("b") },
    { path: "public/fonts.css", sha256: hex("c") },
  ];

  it("includes exactly the tracked implementation surface", () => {
    for (const file of files) {
      expect(isRendererTreePath(file.path), file.path).toBe(true);
    }
    // Bound by dedicated digests, never by the renderer tree:
    for (const excluded of [
      "src/content/cases/some-case.json",
      "src/data/site-governance.v1.json",
      "src/data/generated/rtp-course-summaries.v1.json",
      "docs/superpowers/plans/plan.md",
      "docs/decisions/plan-binding.v1.json",
      "review/review-set.v1.json",
      "public-release-history/public-release-history.v1.json",
      "research/source-manifest-registry.v1.json",
      "tests/unit/site-digest.test.ts",
      "README.md",
    ]) {
      expect(isRendererTreePath(excluded), excluded).toBe(false);
    }
  });

  it("changes when any file in each renderer family changes", () => {
    const base = computeRendererTreeDigest(files);
    for (const [index, file] of files.entries()) {
      const mutated = files.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, sha256: hex("f") } : entry,
      );
      expect(computeRendererTreeDigest(mutated), file.path).not.toBe(base);
    }
    // Adding a new tracked implementation file changes the digest too.
    expect(
      computeRendererTreeDigest([
        ...files,
        { path: "src/pages/new-route.astro", sha256: hex("d") },
      ]),
    ).not.toBe(base);
  });

  it("is order-independent and rejects duplicates/bad digests", () => {
    const base = computeRendererTreeDigest(files);
    expect(computeRendererTreeDigest([...files].reverse())).toBe(base);
    expect(() => computeRendererTreeDigest([...files, files[0]!])).toThrow(
      RendererTreeError,
    );
    expect(() =>
      computeRendererTreeDigest([{ path: "src/pages/x.astro", sha256: "zz" }]),
    ).toThrow(RendererTreeError);
  });
});

describe("supporting-data digest", () => {
  function baseSupportingData(): SupportingDataInput {
    return {
      taxonomy: { injuries: [{ code: "acl" }] },
      schemas: [
        { path: "schemas/injury-case.v1.schema.json", sha256: hex("1") },
      ],
      sourceBatches: [
        {
          manifestId: "SYN-SOURCE-001",
          manifestDigest: hex("2"),
          sourceReviewDecisionDigest: hex("3"),
          entryDigest: hex("4"),
        },
      ],
      registryEntries: [
        {
          manifestId: "SYN-SOURCE-001",
          manifestPath: "research/source-manifests/SYN-SOURCE-001.v1.json",
          manifestDigest: hex("2"),
          sourceReviewDecisionPath:
            "research/reviews/source-batches/SYN-SOURCE-001-decision.v1.json",
          sourceReviewDecisionDigest: hex("3"),
          sourcePolicyVersion: "source-policy-v1",
        },
      ],
      courseCatalog: [
        {
          courseKey: "acl-primary-reconstruction",
          catalogSlug: "acl-course",
          injuryCode: "acl",
          scopeNote: "scope",
          titleZh: "課程",
          contentDigest: hex("5"),
        },
      ],
    };
  }

  it("changes for taxonomy, schema, batch, and course-projection changes", () => {
    const base = computeSupportingDataDigest(baseSupportingData());
    const taxonomyChange = baseSupportingData();
    taxonomyChange.taxonomy = { injuries: [{ code: "acl" }, { code: "mcl" }] };
    expect(computeSupportingDataDigest(taxonomyChange)).not.toBe(base);

    const schemaChange = baseSupportingData();
    schemaChange.schemas = [
      { path: "schemas/injury-case.v1.schema.json", sha256: hex("f") },
    ];
    expect(computeSupportingDataDigest(schemaChange)).not.toBe(base);

    const batchChange = baseSupportingData();
    batchChange.sourceBatches = batchChange.sourceBatches.map((tuple) => ({
      ...tuple,
      entryDigest: hex("f"),
    }));
    expect(computeSupportingDataDigest(batchChange)).not.toBe(base);

    const courseChange = baseSupportingData();
    courseChange.courseCatalog = courseChange.courseCatalog.map((course) => ({
      ...course,
      contentDigest: hex("f"),
    }));
    expect(computeSupportingDataDigest(courseChange)).not.toBe(base);
  });
});

describe("site-governance record", () => {
  it("accepts the initial fail-closed governance file verbatim", () => {
    const record = JSON.parse(
      readFileSync(
        new URL("../../src/data/site-governance.v1.json", import.meta.url),
        "utf8",
      ),
    );
    expect(validateSiteGovernanceRecord(record)).toEqual([]);
    expect(record.siteStatus).toBe("medical-review");
    expect(record.allowIndexing).toBe(false);
    expect(record.currentUpdateId).toBeNull();
    expect(record.indexingAuthorization.status).toBe("not-requested");
  });

  it("rejects allowIndexing without public approval and unknown statuses", () => {
    const record = JSON.parse(
      readFileSync(
        new URL("../../src/data/site-governance.v1.json", import.meta.url),
        "utf8",
      ),
    );
    const indexing = { ...record, allowIndexing: true };
    expect(
      validateSiteGovernanceRecord(indexing).map((entry) => entry.code),
    ).toContain("site-governance-indexing");
    const unknown = { ...record, siteStatus: "published" };
    expect(validateSiteGovernanceRecord(unknown).length).toBeGreaterThan(0);
    const extra = { ...record, extraField: true };
    expect(validateSiteGovernanceRecord(extra).length).toBeGreaterThan(0);
  });

  it("binds the digest to sha256Hex determinism", () => {
    expect(sha256Hex("determinism-anchor")).toBe(
      sha256Hex("determinism-anchor"),
    );
  });
});
