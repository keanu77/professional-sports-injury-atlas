import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  sha256Hex,
  type ValidationIssue,
} from "../../src/lib/contracts/canonical";
import {
  COURSE_LINK_DECISION_DIR,
  courseLinkDecisionPathFor,
  parseCourseLinkApprovalDecisionBytes,
} from "../../src/lib/rtp/course-link-decision";
import {
  COURSE_LINKS_DATA_PATH,
  EXPECTED_COURSE_LINK_KEYS,
  evaluatePublicCourseLink,
  evaluateUpstreamPublicEligibility,
  validateProfessionalCourseLinks,
  validateRtpCourseSummaries,
} from "../../src/lib/rtp/course-links";
import { buildRtpCourseSummariesArtifact } from "../../scripts/import-rtp-catalog.ts";

const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/rtp/${rel}`, import.meta.url), "utf8"),
  );
const loadCourseLinks = (): any =>
  JSON.parse(
    readFileSync(
      new URL(`../../${COURSE_LINKS_DATA_PATH}`, import.meta.url),
      "utf8",
    ),
  );
const fixtureDecision = (): any =>
  loadFixture("course-link-decision.valid.json");

const codesOf = (issues: ValidationIssue[]): string[] =>
  issues.map((entry) => entry.code);

const POLICY_VERSION = "course-link-policy-v1";

function bakedCourses(): any[] {
  const catalog = loadFixture("rtp-catalog.valid.json");
  const catalogText = `${canonicalJson(catalog)}\n`;
  const manifestText = `${canonicalJson({
    ...loadFixture("rtp-catalog.valid.manifest.json"),
    catalogSha256: sha256Hex(catalogText),
  })}\n`;
  const result = buildRtpCourseSummariesArtifact({
    catalogBytes: new TextEncoder().encode(catalogText),
    manifestBytes: new TextEncoder().encode(manifestText),
    courseLinks: loadCourseLinks(),
  });
  expect(result.issues).toEqual([]);
  return JSON.parse(result.artifactText as string).courses;
}

const courseBySlug = (slug: string): any => {
  const course = bakedCourses().find((entry) => entry.slug === slug);
  expect(course).toBeDefined();
  return course;
};
const ankleCourse = (): any =>
  courseBySlug("ankle-sprain-rehab-return-to-sport");

function approvedAnkleScenario() {
  const decision = fixtureDecision();
  const decisionBytes = canonicalJson(decision);
  const links = loadCourseLinks();
  const link = links.links.find(
    (entry: any) => entry.key === "ankle-lateral-nonoperative",
  );
  link.linkApproval = {
    status: "approved",
    approvedPublicUrl: decision.publicUrl,
    approvedBy: decision.approvedBy,
    approvedAt: decision.approvedAt,
    approvedCatalogContentDigest: decision.catalogContentDigest,
    policyVersion: decision.linkPolicyVersion,
    decisionPath: courseLinkDecisionPathFor(decision.courseKey),
    decisionDigest: sha256Hex(decisionBytes),
  };
  return {
    link,
    decision,
    decisionBytes,
    course: ankleCourse(),
    input: {
      link,
      course: ankleCourse(),
      decisionBytes,
      decisionPath: link.linkApproval.decisionPath,
      courseLinkPolicyVersion: POLICY_VERSION,
    },
  };
}

describe("professional course links data file", () => {
  it("contains exactly the three explicit pending mappings", () => {
    const links = loadCourseLinks();
    expect(validateProfessionalCourseLinks(links)).toEqual([]);
    expect(links.links.map((entry: any) => entry.key).sort()).toEqual([
      ...EXPECTED_COURSE_LINK_KEYS,
    ]);
    const bySlug = new Map(
      links.links.map((entry: any) => [entry.key, entry]),
    ) as Map<string, any>;
    expect(bySlug.get("ankle-lateral-nonoperative")).toMatchObject({
      injuryCode: "ankle-sprain",
      catalogSlug: "ankle-sprain-rehab-return-to-sport",
      scopeNote: "急性、非手術、外側踝扭傷；不代表所有腳踝扭傷",
    });
    expect(bySlug.get("acl-primary-reconstruction")).toMatchObject({
      injuryCode: "acl",
      catalogSlug: "acl-reconstruction-rehab-return-to-sport",
      scopeNote: "成人初次、單側、單純 ACL 重建術後；不代表所有 ACL 損傷",
    });
    expect(bySlug.get("achilles-primary-repair")).toMatchObject({
      injuryCode: "achilles-rupture",
      catalogSlug: "achilles-primary-repair-rehab-return-to-sport",
      scopeNote: "成人急性中段斷裂初次手術修補後；不代表所有阿基里斯腱斷裂",
    });
    for (const entry of links.links) {
      expect(entry.linkApproval).toEqual({
        status: "pending",
        approvedPublicUrl: null,
        approvedBy: null,
        approvedAt: null,
        approvedCatalogContentDigest: null,
        policyVersion: null,
        decisionPath: null,
        decisionDigest: null,
      });
    }
  });

  it("rejects unknown fields", () => {
    const links = loadCourseLinks();
    links.links[0].surprise = true;
    expect(codesOf(validateProfessionalCourseLinks(links))).toContain(
      "course-links-schema",
    );
  });

  it("rejects duplicate mappings", () => {
    const links = loadCourseLinks();
    links.links = [...links.links, links.links[0]];
    expect(codesOf(validateProfessionalCourseLinks(links))).toContain(
      "course-links-duplicate",
    );
  });

  it("rejects a key set that differs from the three explicit mappings", () => {
    const links = loadCourseLinks();
    links.links[0].key = "some-other-course";
    expect(codesOf(validateProfessionalCourseLinks(links))).toContain(
      "course-links-key-set",
    );
  });

  it("rejects a pending mapping with a populated approval field", () => {
    const links = loadCourseLinks();
    links.links[0].linkApproval.approvedBy = "someone";
    expect(codesOf(validateProfessionalCourseLinks(links))).toContain(
      "course-links-schema",
    );
  });

  it("rejects an approved mapping with an incomplete approval", () => {
    const { link } = approvedAnkleScenario();
    const links = loadCourseLinks();
    links.links = links.links.map((entry: any) =>
      entry.key === link.key ? link : entry,
    );
    link.linkApproval.decisionDigest = null;
    expect(codesOf(validateProfessionalCourseLinks(links))).toContain(
      "course-links-schema",
    );
  });

  it("rejects an approved mapping whose decision path is not the durable per-key path", () => {
    const { link } = approvedAnkleScenario();
    const links = loadCourseLinks();
    links.links = links.links.map((entry: any) =>
      entry.key === link.key ? link : entry,
    );
    link.linkApproval.decisionPath = `${COURSE_LINK_DECISION_DIR}/other.v1.json`;
    expect(codesOf(validateProfessionalCourseLinks(links))).toContain(
      "course-links-decision-path",
    );
  });
});

describe("CourseLinkApprovalDecisionV1 parsing", () => {
  it("parses an exact canonical decision", () => {
    const bytes = canonicalJson(fixtureDecision());
    const parsed = parseCourseLinkApprovalDecisionBytes(bytes);
    expect(parsed.issues).toEqual([]);
    expect(parsed.decision).not.toBeNull();
    expect(parsed.decisionDigest).toBe(sha256Hex(bytes));
    expect(parsed.decision?.decisionType).toBe("course-link-approval");
  });

  it("rejects duplicate keys in the decision bytes", () => {
    const bytes = canonicalJson(fixtureDecision()).replace(
      '"schemaVersion":1',
      '"schemaVersion":1,"schemaVersion":1',
    );
    const parsed = parseCourseLinkApprovalDecisionBytes(bytes);
    expect(codesOf(parsed.issues)).toContain("decision-parse");
    expect(parsed.decision).toBeNull();
  });

  it("rejects unknown decision fields", () => {
    const bytes = canonicalJson({ ...fixtureDecision(), extra: 1 });
    const parsed = parseCourseLinkApprovalDecisionBytes(bytes);
    expect(codesOf(parsed.issues)).toContain("decision-schema");
    expect(parsed.decision).toBeNull();
  });

  it("rejects non-canonical decision bytes", () => {
    const bytes = `${canonicalJson(fixtureDecision())}\n`;
    const parsed = parseCourseLinkApprovalDecisionBytes(bytes);
    expect(codesOf(parsed.issues)).toContain("decision-not-canonical");
    expect(parsed.decision).toBeNull();
  });

  it.each([
    ["non-UTC approvedAt", { approvedAt: "2026-08-05T00:00:00+08:00" }],
    ["impossible approvedAt", { approvedAt: "2026-13-05T00:00:00Z" }],
    ["blank approver", { approvedBy: "   " }],
    ["non-HTTPS url", { publicUrl: "http://rtp.example.com/course" }],
    ["wrong decision type", { decisionType: "video-rights" }],
    ["wrong schema version", { schemaVersion: 2 }],
    ["malformed digest", { catalogContentDigest: "zz" }],
  ])("rejects a decision with %s", (_label, patch) => {
    const bytes = canonicalJson({ ...fixtureDecision(), ...patch });
    const parsed = parseCourseLinkApprovalDecisionBytes(bytes);
    expect(codesOf(parsed.issues)).toContain("decision-schema");
    expect(parsed.decision).toBeNull();
  });
});

describe("upstream public eligibility", () => {
  it("accepts the fully approved fixture course", () => {
    expect(evaluateUpstreamPublicEligibility(ankleCourse())).toEqual([]);
  });

  it("rejects a pending course", () => {
    const acl = courseBySlug("acl-reconstruction-rehab-return-to-sport");
    expect(codesOf(evaluateUpstreamPublicEligibility(acl))).toContain(
      "upstream-eligibility",
    );
  });

  it("rejects an approved course without indexing permission", () => {
    const course = ankleCourse();
    course.governance.allowIndexing = false;
    expect(codesOf(evaluateUpstreamPublicEligibility(course))).toContain(
      "upstream-eligibility",
    );
  });

  it("rejects an approved course with an incomplete reviewer identity", () => {
    const course = ankleCourse();
    delete course.governance.medicalReview.reviewer;
    expect(codesOf(evaluateUpstreamPublicEligibility(course))).toContain(
      "course-governance",
    );
  });

  it("rejects an approved course whose review digest is stale", () => {
    const course = ankleCourse();
    course.governance.medicalReview.approvedContentDigest = "9".repeat(64);
    expect(codesOf(evaluateUpstreamPublicEligibility(course))).toContain(
      "course-governance",
    );
  });

  it("rejects authorized indexing whose digest is stale", () => {
    const course = ankleCourse();
    course.governance.indexingAuthorization.approvedContentDigest = "9".repeat(
      64,
    );
    expect(codesOf(evaluateUpstreamPublicEligibility(course))).toContain(
      "course-governance",
    );
  });
});

describe("evaluatePublicCourseLink", () => {
  it("accepts an exact, durable, still-current decision", () => {
    const { input } = approvedAnkleScenario();
    expect(evaluatePublicCourseLink(input)).toEqual([]);
  });

  it("never qualifies on record-local fields alone", () => {
    const { input } = approvedAnkleScenario();
    expect(
      codesOf(
        evaluatePublicCourseLink({
          ...input,
          decisionBytes: null,
          decisionPath: null,
        }),
      ),
    ).toContain("cta-decision-missing");
  });

  it("rejects a pending mapping", () => {
    const { input } = approvedAnkleScenario();
    const pendingLink = loadCourseLinks().links.find(
      (entry: any) => entry.key === "ankle-lateral-nonoperative",
    );
    expect(
      codesOf(evaluatePublicCourseLink({ ...input, link: pendingLink })),
    ).toContain("cta-link-not-approved");
  });

  it("fails closed when the catalog content digest moved on", () => {
    const { input } = approvedAnkleScenario();
    input.course.contentDigest = "9".repeat(64);
    expect(codesOf(evaluatePublicCourseLink(input))).toContain(
      "cta-catalog-digest-stale",
    );
  });

  it("fails closed when the site link policy version changed", () => {
    const { input } = approvedAnkleScenario();
    expect(
      codesOf(
        evaluatePublicCourseLink({
          ...input,
          courseLinkPolicyVersion: "course-link-policy-v2",
        }),
      ),
    ).toContain("cta-policy-mismatch");
  });

  it("rejects tampered decision bytes", () => {
    const { input } = approvedAnkleScenario();
    expect(
      codesOf(
        evaluatePublicCourseLink({
          ...input,
          decisionBytes: `${input.decisionBytes}\n`,
        }),
      ),
    ).toContain("decision-not-canonical");
  });

  it("rejects decision bytes whose digest differs from the recorded digest", () => {
    const { input, decision } = approvedAnkleScenario();
    const otherBytes = canonicalJson({
      ...decision,
      approvedBy: "Someone Else",
    });
    expect(
      codesOf(
        evaluatePublicCourseLink({ ...input, decisionBytes: otherBytes }),
      ),
    ).toContain("cta-decision-digest-mismatch");
  });

  it("rejects a decision loaded from the wrong path", () => {
    const { input } = approvedAnkleScenario();
    expect(
      codesOf(
        evaluatePublicCourseLink({
          ...input,
          decisionPath: `${COURSE_LINK_DECISION_DIR}/other.v1.json`,
        }),
      ),
    ).toContain("cta-decision-path-mismatch");
  });

  it("rejects a decision for another mapping key or slug", () => {
    const { input, link } = approvedAnkleScenario();
    link.catalogSlug = "acl-reconstruction-rehab-return-to-sport";
    expect(codesOf(evaluatePublicCourseLink(input))).toContain(
      "cta-mapping-mismatch",
    );
  });

  it("rejects an approved URL that differs from the decision", () => {
    const { input, link } = approvedAnkleScenario();
    link.linkApproval.approvedPublicUrl = "https://rtp.example.com/other";
    expect(codesOf(evaluatePublicCourseLink(input))).toContain(
      "cta-decision-field-mismatch",
    );
  });

  it("rejects an approval time that differs from the decision", () => {
    const { input, link } = approvedAnkleScenario();
    link.linkApproval.approvedAt = "2026-08-05T00:00:01Z";
    expect(codesOf(evaluatePublicCourseLink(input))).toContain(
      "cta-decision-field-mismatch",
    );
  });

  it("requires upstream course approvals even with a valid URL decision", () => {
    const { input, decision } = approvedAnkleScenario();
    const acl = courseBySlug("acl-reconstruction-rehab-return-to-sport");
    // Point the whole scenario at the pending upstream course.
    const rebased = {
      ...decision,
      catalogSlug: acl.slug,
      catalogContentDigest: acl.contentDigest,
    };
    const rebasedBytes = canonicalJson(rebased);
    input.link.catalogSlug = acl.slug;
    input.link.linkApproval.approvedCatalogContentDigest = acl.contentDigest;
    input.link.linkApproval.decisionDigest = sha256Hex(rebasedBytes);
    const issues = evaluatePublicCourseLink({
      ...input,
      course: acl,
      decisionBytes: rebasedBytes,
    });
    expect(codesOf(issues)).toContain("upstream-eligibility");
  });
});

describe("validateRtpCourseSummaries", () => {
  it("accepts the baked artifact", () => {
    expect(
      validateRtpCourseSummaries({ schemaVersion: 1, courses: bakedCourses() }),
    ).toEqual([]);
  });

  it("rejects unsorted courses", () => {
    const courses = bakedCourses().reverse();
    expect(
      codesOf(validateRtpCourseSummaries({ schemaVersion: 1, courses })),
    ).toContain("course-summaries-order");
  });

  it("rejects unknown course fields", () => {
    const courses = bakedCourses();
    courses[0].units = [];
    expect(
      codesOf(validateRtpCourseSummaries({ schemaVersion: 1, courses })),
    ).toContain("course-summaries-schema");
  });
});
