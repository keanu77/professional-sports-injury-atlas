import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  canonicalJson,
  sha256Hex,
  type ValidationIssue,
} from "../../src/lib/contracts/canonical";
import {
  parseRtpCourseSummariesBytes,
  RTP_COURSE_SUMMARIES_DATA_PATH,
} from "../../src/lib/rtp/course-links";
import {
  buildRtpCourseSummariesArtifact,
  resolveOutputPathWithinProject,
  runRtpImport,
} from "../../scripts/import-rtp-catalog.ts";

const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/rtp/${rel}`, import.meta.url), "utf8"),
  );
const fixtureCatalog = (): any => loadFixture("rtp-catalog.valid.json");
const fixtureManifest = (): any =>
  loadFixture("rtp-catalog.valid.manifest.json");
const loadCourseLinks = (): any =>
  JSON.parse(
    readFileSync(
      new URL(
        "../../src/data/professional-course-links.v1.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );

const EXPECTED_SLUGS = [
  "achilles-primary-repair-rehab-return-to-sport",
  "acl-reconstruction-rehab-return-to-sport",
  "ankle-sprain-rehab-return-to-sport",
];

interface Baked {
  catalogBytes: Uint8Array;
  manifestBytes: Uint8Array;
}

/** Upstream artifacts are canonical JSON followed by exactly one newline. */
function bake(catalogValue: unknown, manifestValue: any): Baked {
  const catalogText = `${canonicalJson(catalogValue)}\n`;
  const manifestText = `${canonicalJson({
    ...manifestValue,
    catalogSha256: sha256Hex(catalogText),
  })}\n`;
  return {
    catalogBytes: new TextEncoder().encode(catalogText),
    manifestBytes: new TextEncoder().encode(manifestText),
  };
}

const codesOf = (issues: ValidationIssue[]): string[] =>
  issues.map((entry) => entry.code);

function buildValid() {
  const { catalogBytes, manifestBytes } = bake(
    fixtureCatalog(),
    fixtureManifest(),
  );
  return buildRtpCourseSummariesArtifact({
    catalogBytes,
    manifestBytes,
    courseLinks: loadCourseLinks(),
  });
}

const ankleTopicOf = (catalog: any): any =>
  catalog.topics.find(
    (topic: any) => topic.slug === "ankle-sprain-rehab-return-to-sport",
  );

const tempRoots: string[] = [];
afterEach(() => {
  while (tempRoots.length > 0) {
    rmSync(tempRoots.pop() as string, { recursive: true, force: true });
  }
});

function makeProjectRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "rtp-import-"));
  tempRoots.push(root);
  const { catalogBytes, manifestBytes } = bake(
    fixtureCatalog(),
    fixtureManifest(),
  );
  mkdirSync(join(root, "inputs"), { recursive: true });
  mkdirSync(join(root, "src/data"), { recursive: true });
  writeFileSync(join(root, "inputs/rtp-catalog.v1.json"), catalogBytes);
  writeFileSync(
    join(root, "inputs/rtp-catalog.v1.manifest.json"),
    manifestBytes,
  );
  writeFileSync(
    join(root, "src/data/professional-course-links.v1.json"),
    `${JSON.stringify(loadCourseLinks(), null, 2)}\n`,
  );
  return root;
}

describe("buildRtpCourseSummariesArtifact", () => {
  it("builds the three mapped summaries from a matching catalog/manifest pair", () => {
    const result = buildValid();
    expect(result.issues).toEqual([]);
    expect(result.artifactText).not.toBeNull();
    const parsed = parseRtpCourseSummariesBytes(result.artifactText as string);
    expect(parsed.issues).toEqual([]);
    expect(
      (parsed.summaries as any).courses.map((course: any) => course.slug),
    ).toEqual(EXPECTED_SLUGS);
  });

  it("emits exact canonical bytes for the artifact", () => {
    const result = buildValid();
    const text = result.artifactText as string;
    expect(text).toBe(canonicalJson(JSON.parse(text)));
  });

  it("rejects a wrong catalog SHA-256 before parsing the catalog", () => {
    const { catalogBytes, manifestBytes } = bake(
      fixtureCatalog(),
      fixtureManifest(),
    );
    // Not JSON at all: if the importer parsed before digest comparison this
    // scenario would surface a parse issue instead of the digest issue.
    void catalogBytes;
    const result = buildRtpCourseSummariesArtifact({
      catalogBytes: new TextEncoder().encode("this is not json\n"),
      manifestBytes,
      courseLinks: loadCourseLinks(),
    });
    expect(codesOf(result.issues)).toContain("catalog-sha256-mismatch");
    expect(codesOf(result.issues)).not.toContain("catalog-parse");
    expect(result.artifactText).toBeNull();
  });

  it("rejects non-canonical catalog bytes even when the digest matches", () => {
    const catalogText = `${canonicalJson(fixtureCatalog())}\n\n`;
    const manifestText = `${canonicalJson({
      ...fixtureManifest(),
      catalogSha256: sha256Hex(catalogText),
    })}\n`;
    const result = buildRtpCourseSummariesArtifact({
      catalogBytes: new TextEncoder().encode(catalogText),
      manifestBytes: new TextEncoder().encode(manifestText),
      courseLinks: loadCourseLinks(),
    });
    expect(codesOf(result.issues)).toContain("catalog-not-canonical");
    expect(result.artifactText).toBeNull();
  });

  it("rejects catalog bytes with duplicate object keys", () => {
    const catalogText = `${canonicalJson(fixtureCatalog())}\n`.replace(
      '"schemaVersion":1',
      '"schemaVersion":1,"schemaVersion":1',
    );
    const manifestText = `${canonicalJson({
      ...fixtureManifest(),
      catalogSha256: sha256Hex(catalogText),
    })}\n`;
    const result = buildRtpCourseSummariesArtifact({
      catalogBytes: new TextEncoder().encode(catalogText),
      manifestBytes: new TextEncoder().encode(manifestText),
      courseLinks: loadCourseLinks(),
    });
    expect(codesOf(result.issues)).toContain("catalog-parse");
    expect(result.artifactText).toBeNull();
  });

  it("rejects a manifest whose sourceDigest no longer matches the catalog", () => {
    const manifest = fixtureManifest();
    manifest.sourceDigest = "f".repeat(64);
    const { catalogBytes, manifestBytes } = bake(fixtureCatalog(), manifest);
    const result = buildRtpCourseSummariesArtifact({
      catalogBytes,
      manifestBytes,
      courseLinks: loadCourseLinks(),
    });
    expect(codesOf(result.issues)).toContain("catalog-source-digest-mismatch");
    expect(result.artifactText).toBeNull();
  });

  it("rejects manifest counts that disagree with the catalog", () => {
    const manifest = fixtureManifest();
    manifest.counts = { ...manifest.counts, topics: 4 };
    const { catalogBytes, manifestBytes } = bake(fixtureCatalog(), manifest);
    const result = buildRtpCourseSummariesArtifact({
      catalogBytes,
      manifestBytes,
      courseLinks: loadCourseLinks(),
    });
    expect(codesOf(result.issues)).toContain("catalog-counts-mismatch");
    expect(result.artifactText).toBeNull();
  });

  it("rejects catalog counts that disagree with the actual topics", () => {
    const catalog = fixtureCatalog();
    catalog.counts = { ...catalog.counts, units: 99 };
    const manifest = fixtureManifest();
    manifest.counts = { ...manifest.counts, units: 99 };
    const { catalogBytes, manifestBytes } = bake(catalog, manifest);
    const result = buildRtpCourseSummariesArtifact({
      catalogBytes,
      manifestBytes,
      courseLinks: loadCourseLinks(),
    });
    expect(codesOf(result.issues)).toContain("catalog-counts-mismatch");
    expect(result.artifactText).toBeNull();
  });

  it("rejects a catalog that lost a mapped topic", () => {
    const catalog = fixtureCatalog();
    catalog.topics = catalog.topics.filter(
      (topic: any) => topic.slug !== "ankle-sprain-rehab-return-to-sport",
    );
    catalog.counts = {
      ...catalog.counts,
      topics: 2,
      units: 2,
      evidenceReferences: 2,
      evidenceData: 2,
    };
    const manifest = { ...fixtureManifest(), counts: catalog.counts };
    const { catalogBytes, manifestBytes } = bake(catalog, manifest);
    const result = buildRtpCourseSummariesArtifact({
      catalogBytes,
      manifestBytes,
      courseLinks: loadCourseLinks(),
    });
    expect(codesOf(result.issues)).toContain("course-link-topic-missing");
    expect(result.artifactText).toBeNull();
  });

  it("rejects duplicate course-link mappings", () => {
    const links = loadCourseLinks();
    links.links = [...links.links, links.links[0]];
    const { catalogBytes, manifestBytes } = bake(
      fixtureCatalog(),
      fixtureManifest(),
    );
    const result = buildRtpCourseSummariesArtifact({
      catalogBytes,
      manifestBytes,
      courseLinks: links,
    });
    expect(codesOf(result.issues)).toContain("course-links-duplicate");
    expect(result.artifactText).toBeNull();
  });

  it("rejects a schema-invalid catalog", () => {
    const catalog = fixtureCatalog();
    delete ankleTopicOf(catalog).returnGoal;
    const { catalogBytes, manifestBytes } = bake(catalog, fixtureManifest());
    const result = buildRtpCourseSummariesArtifact({
      catalogBytes,
      manifestBytes,
      courseLinks: loadCourseLinks(),
    });
    expect(codesOf(result.issues)).toContain("catalog-schema");
    expect(result.artifactText).toBeNull();
  });
});

describe("upstream governance cross-field rules", () => {
  const failsGovernance = (mutate: (catalog: any) => void): string[] => {
    const catalog = fixtureCatalog();
    mutate(catalog);
    const { catalogBytes, manifestBytes } = bake(catalog, fixtureManifest());
    const result = buildRtpCourseSummariesArtifact({
      catalogBytes,
      manifestBytes,
      courseLinks: loadCourseLinks(),
    });
    expect(result.artifactText).toBeNull();
    return codesOf(result.issues);
  };

  it("rejects an approved medical review with a missing reviewer identity", () => {
    expect(
      failsGovernance((catalog) => {
        delete ankleTopicOf(catalog).governance.medicalReview.reviewer;
      }),
    ).toContain("course-governance");
  });

  it("rejects an approved medical review with a missing review time", () => {
    expect(
      failsGovernance((catalog) => {
        delete ankleTopicOf(catalog).governance.medicalReview.reviewedAt;
      }),
    ).toContain("course-governance");
  });

  it("rejects an approved medical review whose digest is not the current content digest", () => {
    expect(
      failsGovernance((catalog) => {
        ankleTopicOf(catalog).governance.medicalReview.approvedContentDigest =
          "9".repeat(64);
      }),
    ).toContain("course-governance");
  });

  it("rejects an approved medical review with stale source-review provenance", () => {
    expect(
      failsGovernance((catalog) => {
        ankleTopicOf(
          catalog,
        ).governance.medicalReview.sourceReviewProvenance.digest = "9".repeat(
          64,
        );
      }),
    ).toContain("course-governance");
  });

  it("rejects an approved medical review with missing provenance", () => {
    expect(
      failsGovernance((catalog) => {
        delete ankleTopicOf(catalog).governance.medicalReview
          .sourceReviewProvenance;
      }),
    ).toContain("course-governance");
  });

  it("rejects authorized indexing with a missing authorization time", () => {
    expect(
      failsGovernance((catalog) => {
        delete ankleTopicOf(catalog).governance.indexingAuthorization
          .authorizedAt;
      }),
    ).toContain("course-governance");
  });

  it("rejects authorized indexing whose digest is not the current content digest", () => {
    expect(
      failsGovernance((catalog) => {
        ankleTopicOf(
          catalog,
        ).governance.indexingAuthorization.approvedContentDigest = "9".repeat(
          64,
        );
      }),
    ).toContain("course-governance");
  });

  it("rejects allowIndexing without an authorized indexing authorization", () => {
    expect(
      failsGovernance((catalog) => {
        const topic = catalog.topics.find(
          (entry: any) =>
            entry.slug === "acl-reconstruction-rehab-return-to-sport",
        );
        topic.governance.allowIndexing = true;
      }),
    ).toContain("course-governance");
  });
});

describe("summary whitelist", () => {
  const coursesOf = (): any[] => {
    const result = buildValid();
    expect(result.issues).toEqual([]);
    return JSON.parse(result.artifactText as string).courses;
  };

  it("keeps a pending upstream course pending in the summary", () => {
    const acl = coursesOf().find(
      (course) => course.slug === "acl-reconstruction-rehab-return-to-sport",
    );
    expect(acl.governance.medicalReview).toEqual({ status: "pending" });
    expect(acl.governance.indexingAuthorization).toEqual({
      status: "not-requested",
    });
    expect(acl.governance.allowIndexing).toBe(false);
  });

  it("emits exactly the whitelisted course fields", () => {
    const ankle = coursesOf().find(
      (course) => course.slug === "ankle-sprain-rehab-return-to-sport",
    );
    expect(Object.keys(ankle).sort()).toEqual([
      "appliesTo",
      "contentDigest",
      "contentUpdatedAt",
      "governance",
      "keyExclusions",
      "patientSummary",
      "returnGoal",
      "searchAliases",
      "slug",
      "subtitle",
      "taxonomy",
      "titleEn",
      "titleZh",
    ]);
    expect(Object.keys(ankle.taxonomy).sort()).toEqual([
      "carePathway",
      "episode",
      "primaryBodyRegion",
      "structures",
    ]);
    expect(Object.keys(ankle.patientSummary).sort()).toEqual([
      "evidenceDataIds",
      "id",
      "referenceIds",
      "text",
    ]);
    expect(Object.keys(ankle.governance).sort()).toEqual([
      "allowIndexing",
      "evidenceVerifiedAt",
      "indexingAuthorization",
      "medicalReview",
    ]);
    expect(Object.keys(ankle.governance.medicalReview).sort()).toEqual([
      "approvedContentDigest",
      "reviewedAt",
      "reviewer",
      "sourceReviewProvenance",
      "status",
    ]);
    expect(Object.keys(ankle.governance.indexingAuthorization).sort()).toEqual([
      "approvedContentDigest",
      "authorizedAt",
      "authorizedById",
      "authorizedByName",
      "note",
      "status",
    ]);
  });

  it("never imports units, videos, prescriptions, or source evidence", () => {
    const result = buildValid();
    const text = result.artifactText as string;
    for (const banned of [
      '"units"',
      '"videos"',
      '"evidenceData"',
      '"evidenceReferences"',
      '"faqs"',
      '"clinicalActions"',
      '"redFlags"',
      '"seo"',
      '"theme"',
    ]) {
      expect(text).not.toContain(banned);
    }
  });
});

describe("output path containment", () => {
  it("refuses any output path outside the atlas project", () => {
    const root = makeProjectRoot();
    for (const attempt of [
      "../escape.json",
      "src/../../escape.json",
      "/tmp/escape.json",
    ]) {
      expect(
        codesOf(resolveOutputPathWithinProject(root, attempt).issues),
      ).toContain("output-path-outside-project");
    }
  });

  it("accepts the fixed generated artifact path", () => {
    const root = makeProjectRoot();
    const resolved = resolveOutputPathWithinProject(
      root,
      RTP_COURSE_SUMMARIES_DATA_PATH,
    );
    expect(resolved.issues).toEqual([]);
    expect(resolved.outputPath).toBe(
      join(root, RTP_COURSE_SUMMARIES_DATA_PATH),
    );
  });

  it("runRtpImport refuses to write outside the project root", () => {
    const root = makeProjectRoot();
    const result = runRtpImport({
      projectRoot: root,
      catalogPath: "inputs/rtp-catalog.v1.json",
      manifestPath: "inputs/rtp-catalog.v1.manifest.json",
      outputRelPath: "../rtp-escape.json",
    });
    expect(codesOf(result.issues)).toContain("output-path-outside-project");
    expect(existsSync(join(root, "..", "rtp-escape.json"))).toBe(false);
  });
});

describe("runRtpImport", () => {
  it("writes only the generated summaries artifact with canonical bytes", () => {
    const root = makeProjectRoot();
    const result = runRtpImport({
      projectRoot: root,
      catalogPath: "inputs/rtp-catalog.v1.json",
      manifestPath: "inputs/rtp-catalog.v1.manifest.json",
    });
    expect(result.issues).toEqual([]);
    expect(result.outputPath).toBe(join(root, RTP_COURSE_SUMMARIES_DATA_PATH));
    const written = readFileSync(result.outputPath as string, "utf8");
    const build = buildValid();
    expect(written).toBe(build.artifactText);
  });

  it("does not modify the catalog or manifest inputs", () => {
    const root = makeProjectRoot();
    const catalogBefore = readFileSync(
      join(root, "inputs/rtp-catalog.v1.json"),
    );
    runRtpImport({
      projectRoot: root,
      catalogPath: "inputs/rtp-catalog.v1.json",
      manifestPath: "inputs/rtp-catalog.v1.manifest.json",
    });
    const catalogAfter = readFileSync(join(root, "inputs/rtp-catalog.v1.json"));
    expect(Buffer.compare(catalogBefore, catalogAfter)).toBe(0);
  });
});

describe("committed generated artifact", () => {
  it("is exact canonical bytes and keeps every course pending", () => {
    const committed = readFileSync(
      new URL(`../../${RTP_COURSE_SUMMARIES_DATA_PATH}`, import.meta.url),
      "utf8",
    );
    const parsed = parseRtpCourseSummariesBytes(committed);
    expect(parsed.issues).toEqual([]);
    const courses = (parsed.summaries as any).courses;
    expect(courses.map((course: any) => course.slug)).toEqual(EXPECTED_SLUGS);
    for (const course of courses) {
      expect(course.governance.medicalReview.status).toBe("pending");
      expect(course.governance.indexingAuthorization.status).toBe(
        "not-requested",
      );
      expect(course.governance.allowIndexing).toBe(false);
    }
  });
});
