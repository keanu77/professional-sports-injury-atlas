import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/cases/canonical-json";
import {
  computeCaseContentDigest,
  computeVideoIdentityDigest,
  computeVideoSourceDigest,
} from "../../src/lib/cases/digest";
import { computeInjuryOverviewDigest } from "../../src/lib/cases/injury-overview-digest";
import { computeQuarterlyUpdateDigest } from "../../src/lib/cases/update-digest";
import { INJURY_CODES } from "../../src/lib/contracts/case";
import { EMPTY_PUBLIC_RELEASE_HISTORY_BYTES } from "../../src/lib/contracts/release-history";
import {
  CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
  CURRENT_SOURCE_POLICY_VERSION,
} from "../../src/lib/contracts/site-governance";
import { EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES } from "../../src/lib/contracts/source-manifest-registry";
import {
  buildArtifactManifest,
  computeArtifactManifestDigest,
  PRIVATE_HTTP_HEADER_CONTRACT_ID,
  PRIVATE_HTTP_HEADER_POLICY_SHA256,
  type ArtifactManifest,
} from "../../src/lib/governance/artifact-manifest";
import {
  computeCandidateSiteDigest,
  computeExternalUrlSetDigest,
  evaluatePublicReleaseGate,
  parseSitePublicationDecisionBytes,
  validatePublicOutput,
  type LoadedDecisionBytes,
  type PublicReleaseGateInput,
} from "../../src/lib/governance/release-gate";
import {
  buildReviewSetManifest,
  buildReviewSetManifestV2,
  canonicalReviewSetBytes,
  computeContentAuthoritySnapshotDigest,
  DECISION_17_AUTHORING_AUTHORITY,
} from "../../src/lib/governance/review-set";
import {
  computeAuthorizedMetadataDigest,
  computeUnauthorizedMetadataDigest,
  EMPTY_BODY_SHA256,
  G4_AUTHORIZATION_DECISION_SHA256,
  G4_PLAN_PATH,
  G4_PLAN_SHA256,
  UNAUTHORIZED_SCENARIOS,
} from "../../src/lib/governance/served-artifact-receipt";
import { computeRendererTreeDigest } from "../../src/lib/governance/site-digest";
import { videoRightsDecisionPathFor } from "../../src/lib/governance/video-rights-decision";
import { courseLinkDecisionPathFor } from "../../src/lib/rtp/course-link-decision";
import { EXPECTED_COURSE_LINK_KEYS } from "../../src/lib/rtp/course-links";

const NOW = "2026-08-06T12:00:00Z";
const CONTENT_COMMIT = "a".repeat(40);
const REVIEWER = "Dr. Synthetic Reviewer";
const QUALIFICATION = "Synthetic Sports Medicine Physician";
const REVIEWED_AT = "2026-08-05T00:00:00Z";
const COURSE_POLICY = "course-link-policy-v1";
const PUBLIC_URL = "https://atlas.example.org";
const DECISION_PATH = "docs/decisions/2026-08-06-site-publication.v1.json";
const MANIFEST_ID = "SYN-SOURCE-2026-08-06-001";
const MANIFEST_PATH = `research/source-manifests/${MANIFEST_ID}.v1.json`;
const DECISION_ARTIFACT_PATH = `research/reviews/source-batches/${MANIFEST_ID}-source-review-decision.v1.json`;

function servedReceiptFixture(manifest: ArtifactManifest): any {
  const authorizedResponses = manifest.files
    .map((file) => ({
      requestPath: file.requestPath,
      method: "GET",
      status: 200,
      redirectMode: "manual",
      redirected: false,
      contentType: file.contentType,
      decodedByteLength: file.byteLength,
      decodedSha256: file.sha256,
      identityResult: "passed",
      shardResult: ["case-index-manifest", "case-index-shard"].includes(
        file.identity.kind,
      )
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
    }))
    .sort((a, b) => (a.requestPath < b.requestPath ? -1 : 1));
  const unauthorizedResponses = manifest.files
    .flatMap((file) =>
      UNAUTHORIZED_SCENARIOS.map((scenario) => ({
        scenario,
        requestPath: file.requestPath,
        method: "GET",
        redirectMode: "manual",
        redirected: false,
        status: 401,
        contentType: null,
        bodyByteLength: 0,
        bodySha256: EMPTY_BODY_SHA256,
        wwwAuthenticateResult: "passed",
        headerContractId: PRIVATE_HTTP_HEADER_CONTRACT_ID,
        headersResult: "passed",
        forbiddenHeadersAbsent: true,
        contentEncodingPresent: false,
        setCookiePresent: false,
        cacheBypassObserved: false,
        leaks: {
          atlasIdentity: false,
          reviewSetBytes: false,
          reviewSetDigest: false,
          cardSummaries: false,
          workflowStatus: false,
          deploymentIdentity: false,
        },
      })),
    )
    .sort((a, b) =>
      `${a.requestPath}\0${a.scenario}` < `${b.requestPath}\0${b.scenario}`
        ? -1
        : 1,
    );
  return {
    schemaVersion: 1,
    receiptType: "served-private-review",
    privateDistManifestDigest: computeArtifactManifestDigest(manifest),
    reviewSetResponseSha256: manifest.reviewSetResponseSha256,
    privateOriginHash: sha256Hex("http://private-review.invalid"),
    deploymentIdHash: sha256Hex("synthetic-deployment-1"),
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
    authorizedMetadataDigest: computeAuthorizedMetadataDigest(
      authorizedResponses as any,
    ),
    unauthorizedResponses,
    unauthorizedMetadataDigest: computeUnauthorizedMetadataDigest(
      unauthorizedResponses as any,
    ),
  };
}

const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );

const pad = (index: number): string => String(index + 1).padStart(3, "0");

const DIAGNOSES: Record<string, string> = {
  acl: "Synthetic anterior cruciate ligament tear (fictional case)",
  "ankle-sprain": "Synthetic lateral ankle sprain (fictional case)",
  "achilles-rupture": "Synthetic Achilles tendon rupture (fictional case)",
};

function syntheticCase(index: number): any {
  const record = loadFixture("cases/valid-medical-review.json");
  const id = `CASE-SYN-2026-${pad(index)}`;
  const injuryCode = INJURY_CODES[index % INJURY_CODES.length]!;
  const candidateId = `SYN-CAND-${pad(index)}`;
  const url = `https://www.youtube.com/watch?v=syn-${pad(index)}`;
  record.id = id;
  record.slug = `syn-case-${pad(index)}`;
  record.athlete.name = `Synthetic Athlete ${pad(index)}`;
  record.eventDate = `2026-01-${String((index % 28) + 1).padStart(2, "0")}`;
  record.injury.code = injuryCode;
  record.injury.confirmedDiagnosis = DIAGNOSES[injuryCode]!;
  record.observedMechanismTags = ["non-contact-landing"];
  record.video.canonicalUrl = url;
  record.video.fallbackUrl = url;
  record.sourceManifestBinding.candidateId = candidateId;
  record.sourceManifestBinding.manifestId = MANIFEST_ID;
  record.sourceManifestBinding.sourcePolicyVersion =
    CURRENT_SOURCE_POLICY_VERSION;
  record.audit.sourceRecordId = candidateId;
  record.video.eventBinding.eventSourceId = `src-syn-${pad(index)}-event`;
  record.video.sourceProvenanceVerification.verifiedPolicyVersion =
    CURRENT_SOURCE_POLICY_VERSION;
  for (const source of record.sources) {
    source.id = source.id.replace("src-fic-001", `src-syn-${pad(index)}`);
    source.url = `${source.url}-syn-${pad(index)}`;
  }
  record.sources[0].url = url;
  for (const claim of record.professional.claims) {
    claim.id = claim.id.replace("claim-fic-001", `claim-syn-${pad(index)}`);
    claim.evidenceIds = claim.evidenceIds.map((evidenceId: string) =>
      evidenceId.replace("src-fic-001", `src-syn-${pad(index)}`),
    );
  }
  record.professional.evidenceIds = record.professional.evidenceIds.map(
    (evidenceId: string) =>
      evidenceId.replace("src-fic-001", `src-syn-${pad(index)}`),
  );
  return record;
}

function manifestEntryFor(record: any): any {
  return {
    candidateId: record.sourceManifestBinding.candidateId,
    athleteName: record.athlete.name,
    teamName: record.teamAtEvent.name,
    opponentName: record.opponent.name,
    sportCode: record.sport.code,
    leagueCode: record.league.code,
    competitionCode: record.competition.code,
    season: record.season,
    eventDate: record.eventDate,
    injuryCode: record.injury.code,
    confirmedDiagnosis: record.injury.confirmedDiagnosis,
    videoProvider: record.video.provider,
    canonicalVideoUrl: record.video.canonicalUrl,
    uploaderName: record.video.uploaderName,
    uploaderProvenance: record.video.uploaderProvenance,
    durationSeconds: record.video.durationSeconds,
    classicProposal: null,
  };
}

function syntheticOverview(injuryCode: string): any {
  const overview = loadFixture("injuries/valid-medical-review.json");
  overview.injuryCode = injuryCode;
  overview.status = "approved";
  for (const claim of overview.claims) {
    claim.id = `${injuryCode}-${claim.id}`;
    claim.evidenceIds = claim.evidenceIds.map(
      (evidenceId: string) => `${injuryCode}-${evidenceId}`,
    );
  }
  overview.evidenceIds = overview.evidenceIds.map(
    (evidenceId: string) => `${injuryCode}-${evidenceId}`,
  );
  for (const source of overview.sources) {
    source.id = `${injuryCode}-${source.id}`;
  }
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

const statement = (id: string): any => ({
  id,
  text: `Synthetic statement ${id}.`,
  referenceIds: ["R1"],
  evidenceDataIds: ["E1"],
});

function syntheticCourse(slug: string, contentDigest: string): any {
  return {
    slug,
    contentDigest,
    titleZh: `合成課程 ${slug}`,
    subtitle: "Synthetic subtitle",
    contentUpdatedAt: "2026-08-01",
    taxonomy: {
      primaryBodyRegion: "lower-limb",
      structures: ["synthetic-structure"],
      carePathway: "operative",
      episode: "postoperative",
    },
    patientSummary: statement("TOPIC-SUMMARY"),
    appliesTo: [statement("TOPIC-APPLIES-01")],
    keyExclusions: [statement("TOPIC-EXCLUSION-01")],
    returnGoal: statement("TOPIC-RETURN-GOAL"),
    searchAliases: ["synthetic"],
    governance: {
      medicalReview: {
        status: "approved",
        reviewer: {
          id: "rev-1",
          name: "Dr. Synthetic Upstream",
          qualification: "MD",
          profileUrl: "https://example.org/reviewer",
        },
        reviewedAt: "2026-08-01",
        approvedContentDigest: contentDigest,
        sourceReviewProvenance: {
          algorithm: "sha256",
          digest: "e".repeat(64),
          scope: "full-catalog",
        },
      },
      allowIndexing: true,
      evidenceVerifiedAt: "2026-08-01",
      indexingAuthorization: {
        status: "authorized",
        authorizedById: "auth-1",
        authorizedByName: "Synthetic Owner",
        authorizedAt: "2026-08-01",
        approvedContentDigest: contentDigest,
      },
    },
  };
}

export interface Fixture {
  governance: any;
  publicationDecision: LoadedDecisionBytes | null;
  cases: any[];
  overviews: any[];
  update: any;
  registry: any;
  registryArtifacts: Map<string, string>;
  historyBytes: string;
  loadReleaseArtifact: ((commit: string, path: string) => Uint8Array) | null;
  reviewSetBytes: string | null;
  medicalDecisionBytes: string | null;
  manifestBytes: string | null;
  receiptBytes: string | null;
  rightsDecisions: Map<string, LoadedDecisionBytes>;
  externalVerification: any;
  courseLinks: any;
  courseSummaries: any;
  courseDecisions: Map<string, LoadedDecisionBytes>;
  build: {
    commit: string | null;
    dirty: boolean;
    rendererTreeDigest: string | null;
  };
  brandFindings: string[];
}

function gateInput(fx: Fixture): PublicReleaseGateInput {
  return {
    now: NOW,
    governance: fx.governance,
    publicationDecision: fx.publicationDecision,
    cases: fx.cases,
    overviews: fx.overviews,
    updates: [fx.update],
    registry: fx.registry,
    loadRegistryArtifact: (path: string) => {
      const bytes = fx.registryArtifacts.get(path);
      if (bytes === undefined) throw new Error(`missing artifact ${path}`);
      return Buffer.from(bytes, "utf8");
    },
    releaseHistoryBytes: fx.historyBytes,
    loadReleaseArtifact: fx.loadReleaseArtifact,
    reviewSetBytes: fx.reviewSetBytes,
    medicalReviewDecisionBytes: fx.medicalDecisionBytes,
    reviewArtifactManifestBytes: fx.manifestBytes,
    servedReviewReceiptBytes: fx.receiptBytes,
    loadVideoRightsDecision: (caseId: string) =>
      fx.rightsDecisions.get(caseId) ?? null,
    externalVerification: fx.externalVerification,
    courseLinks: fx.courseLinks,
    courseSummaries: fx.courseSummaries,
    loadCourseLinkDecision: (courseKey: string) =>
      fx.courseDecisions.get(courseKey) ?? null,
    build: fx.build,
    brandFindings: fx.brandFindings,
  };
}

function computeExternalEntries(record: any): any {
  const urls = new Set<string>([
    record.video.canonicalUrl,
    record.video.fallbackUrl,
    ...record.sources.map((source: any) => source.url),
  ]);
  return {
    caseId: record.id,
    clinicalDigest: computeCaseContentDigest(record),
    videoSourceDigest: computeVideoSourceDigest(record),
    externalUrlSetDigest: "0".repeat(64),
    checkedAt: "2026-08-06T00:00:00Z",
    results: [...urls]
      .map((url) => ({ urlHash: sha256Hex(url), status: "ok" as const }))
      .sort((a, b) => (a.urlHash < b.urlHash ? -1 : 1)),
  };
}

/** Re-signs the current update review digest after a deliberate mutation. */
function resignUpdate(update: any): void {
  update.review.reviewedContentDigest = computeQuarterlyUpdateDigest(update);
}

/**
 * Builds a complete synthetic active-v2 fixture. Its historical clinical
 * core is approved, while each Decision 17 follow-up remains pending and the
 * active authority deliberately keeps medical-review-decision/public-release
 * closed. All names and events are visibly fictional.
 */
export function buildAuthorizedFixture(): Fixture {
  const cases = Array.from({ length: 30 }, (_, index) => syntheticCase(index));

  const manifest = {
    schemaVersion: 1,
    manifestId: MANIFEST_ID,
    batchType: "launch",
    period: "2026-08-06",
    sourcePolicyVersion: CURRENT_SOURCE_POLICY_VERSION,
    entries: cases.map(manifestEntryFor),
  };
  const manifestBytesText = canonicalJson(manifest);
  const manifestDigest = sha256Hex(manifestBytesText);
  const sourceDecision = {
    schemaVersion: 1,
    decisionType: "source-batch-review",
    manifestId: MANIFEST_ID,
    manifestDigest,
    decisionStatus: "approved",
    sourcePolicyVersion: CURRENT_SOURCE_POLICY_VERSION,
    reviewedBy: "Synthetic Screener",
    reviewedAt: "2026-08-06T00:00:00Z",
    candidateDecisions: manifest.entries.map((entry) => ({
      candidateId: entry.candidateId,
      status: "accepted",
      classicProposal: null,
    })),
  };
  const sourceDecisionBytesText = canonicalJson(sourceDecision);
  const sourceDecisionDigest = sha256Hex(sourceDecisionBytesText);

  const registry: any = {
    schemaVersion: 1,
    entries: [
      {
        manifestId: MANIFEST_ID,
        manifestPath: MANIFEST_PATH,
        manifestDigest,
        sourceReviewDecisionPath: DECISION_ARTIFACT_PATH,
        sourceReviewDecisionDigest: sourceDecisionDigest,
        sourcePolicyVersion: CURRENT_SOURCE_POLICY_VERSION,
        batchType: "launch",
        period: "2026-08-06",
        createdAt: "2026-08-06T01:00:00Z",
        previousRegistryBytesDigest: sha256Hex(
          EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
        ),
        supersedes: [],
      },
    ],
  };
  const registryArtifacts = new Map<string, string>([
    [MANIFEST_PATH, manifestBytesText],
    [DECISION_ARTIFACT_PATH, sourceDecisionBytesText],
  ]);

  const rightsDecisions = new Map<string, LoadedDecisionBytes>();
  for (const [index, record] of cases.entries()) {
    const entryDigest = sha256Hex(canonicalJson(manifest.entries[index]));
    record.sourceManifestBinding.manifestDigest = manifestDigest;
    record.sourceManifestBinding.sourceReviewDecisionDigest =
      sourceDecisionDigest;
    record.sourceManifestBinding.entryDigest = entryDigest;

    record.video.sourceProvenanceVerification.reviewedVideoIdentityDigest =
      computeVideoIdentityDigest(record);
    const videoSourceDigest = computeVideoSourceDigest(record);
    const rightsDecision = {
      schemaVersion: 1,
      decisionType: "video-public-rights",
      decisionStatus: "cleared",
      caseId: record.id,
      videoSourceDigest,
      publicRightsPolicyVersion: CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
      termsCheckedAt: "2026-08-05T12:00:00Z",
      decisionBasis:
        "Synthetic platform terms permit linking and privacy-enhanced embedding.",
      notes: null,
      reviewedBy: "Synthetic Rights Reviewer",
      reviewedAt: "2026-08-05T12:00:00Z",
    };
    const rightsBytes = canonicalJson(rightsDecision);
    const rightsPath = videoRightsDecisionPathFor(record.id);
    rightsDecisions.set(record.id, { bytes: rightsBytes, path: rightsPath });
    record.video.publicRightsReview = {
      status: "cleared",
      reviewedBy: rightsDecision.reviewedBy,
      reviewedAt: rightsDecision.reviewedAt,
      reviewedVideoDigest: videoSourceDigest,
      policyVersion: CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
      termsCheckedAt: rightsDecision.termsCheckedAt,
      decisionBasis: rightsDecision.decisionBasis,
      notes: null,
      decisionPath: rightsPath,
      decisionDigest: sha256Hex(rightsBytes),
    };
    record.status = "approved";
    record.review = {
      status: "approved",
      reviewerName: REVIEWER,
      reviewerQualification: QUALIFICATION,
      reviewedAt: REVIEWED_AT,
      reviewedContentDigest: computeCaseContentDigest(record),
    };
  }

  const overviews = INJURY_CODES.map((injuryCode) =>
    syntheticOverview(injuryCode),
  );

  const update = loadFixture("updates/valid-baseline.json");
  update.status = "approved";
  update.publishedAt = "2026-08-06T11:00:00Z";
  update.addedCases = cases
    .map((record) => ({
      caseId: record.id,
      currentClinicalDigest: computeCaseContentDigest(record),
      currentVideoSourceDigest: computeVideoSourceDigest(record),
    }))
    .sort((a, b) => (a.caseId < b.caseId ? -1 : 1));
  update.review = {
    status: "approved",
    reviewerName: REVIEWER,
    reviewerQualification: QUALIFICATION,
    reviewedAt: REVIEWED_AT,
    reviewedContentDigest: "0".repeat(64),
  };
  resignUpdate(update);

  const externalVerification = {
    schemaVersion: 1,
    artifactType: "external-verification",
    generatedAt: "2026-08-06T00:00:00Z",
    cases: cases.map((record) => computeExternalEntries(record)),
  };

  const courseKeyMeta: Record<string, { injuryCode: string; slug: string }> = {
    "achilles-primary-repair": {
      injuryCode: "achilles-rupture",
      slug: "achilles-primary-repair-rehab",
    },
    "acl-primary-reconstruction": {
      injuryCode: "acl",
      slug: "acl-reconstruction-rehab",
    },
    "ankle-lateral-nonoperative": {
      injuryCode: "ankle-sprain",
      slug: "ankle-lateral-nonoperative-rehab",
    },
  };
  const courseDecisions = new Map<string, LoadedDecisionBytes>();
  const links: any[] = [];
  const courses: any[] = [];
  for (const courseKey of EXPECTED_COURSE_LINK_KEYS) {
    const meta = courseKeyMeta[courseKey]!;
    const contentDigest = sha256Hex(`synthetic-content-${courseKey}`);
    const course = syntheticCourse(meta.slug, contentDigest);
    courses.push(course);
    const linkDecision = {
      schemaVersion: 1,
      decisionType: "course-link-approval",
      courseKey,
      injuryCode: meta.injuryCode,
      catalogSlug: meta.slug,
      catalogContentDigest: contentDigest,
      publicUrl: `https://courses.example.org/${meta.slug}/`,
      linkPolicyVersion: COURSE_POLICY,
      approvedBy: "Synthetic Course Approver",
      approvedAt: "2026-08-05T10:00:00Z",
    };
    const linkDecisionBytes = canonicalJson(linkDecision);
    const decisionPath = courseLinkDecisionPathFor(courseKey);
    courseDecisions.set(courseKey, {
      bytes: linkDecisionBytes,
      path: decisionPath,
    });
    links.push({
      key: courseKey,
      injuryCode: meta.injuryCode,
      catalogSlug: meta.slug,
      scopeNote: "Synthetic scope note for the professional CTA.",
      linkApproval: {
        status: "approved",
        approvedPublicUrl: linkDecision.publicUrl,
        approvedBy: linkDecision.approvedBy,
        approvedAt: linkDecision.approvedAt,
        approvedCatalogContentDigest: contentDigest,
        policyVersion: COURSE_POLICY,
        decisionPath,
        decisionDigest: sha256Hex(linkDecisionBytes),
      },
    });
  }
  courses.sort((a, b) => (a.slug < b.slug ? -1 : 1));
  const courseLinks = { schemaVersion: 1, links };
  const courseSummaries = { schemaVersion: 1, courses };

  const rendererTreeDigest = computeRendererTreeDigest([
    { path: "src/pages/index.astro", sha256: sha256Hex("page") },
    { path: "src/layouts/BaseLayout.astro", sha256: sha256Hex("layout") },
    { path: "package.json", sha256: sha256Hex("pkg") },
  ]);
  const supportingDataDigest = sha256Hex("synthetic-supporting-data");
  const authorityDigest = computeContentAuthoritySnapshotDigest([
    {
      role: "specification",
      path: "docs/superpowers/specs/synthetic.md",
      documentSha256: sha256Hex("spec"),
      executionDecisionSha256: null,
    },
  ]);

  const reviewSet = buildReviewSetManifestV2({
    contentCommit: CONTENT_COMMIT,
    cases,
    overviews,
    currentUpdate: update,
    registry,
    contentAuthoritySnapshotDigest: authorityDigest,
    rendererTreeDigest,
    supportingDataDigest,
    followUps: cases.map((record) => ({
      caseId: record.id,
      sidecarPath: `src/content/follow-ups/${record.slug}.json`,
      draftDigest: sha256Hex(`synthetic-pending-follow-up-${record.id}`),
    })),
    authoringAuthority: DECISION_17_AUTHORING_AUTHORITY,
  });
  const reviewSetBytes = canonicalReviewSetBytes(reviewSet);
  const reviewSetDigest = sha256Hex(reviewSetBytes);

  const artifactManifest = buildArtifactManifest(
    "review",
    [
      {
        path: "index.html",
        bytes: "<html>synthetic home</html>",
        contentType: "text/html; charset=utf-8",
      },
      {
        path: "cases/syn-case-001/index.html",
        bytes: "<html>synthetic case</html>",
        contentType: "text/html; charset=utf-8",
      },
      {
        path: "review/review-set.json",
        bytes: reviewSetBytes,
        contentType: "application/json",
      },
    ],
    {
      buildCommit: CONTENT_COMMIT,
      reviewSetDigest,
      reviewSetResponseSha256: reviewSetDigest,
      rendererTreeDigest,
      headerPolicyDigest: PRIVATE_HTTP_HEADER_POLICY_SHA256,
      generatedAt: "2026-08-08T14:00:00Z",
    },
  );
  const manifestBytes = canonicalJson(artifactManifest);
  const artifactManifestDigest =
    computeArtifactManifestDigest(artifactManifest);
  const receipt = servedReceiptFixture(artifactManifest);
  const receiptBytes = canonicalJson(receipt);

  const medicalDecision = {
    schemaVersion: 1,
    decisionType: "site-medical-review",
    decisionStatus: "approved",
    reviewerName: REVIEWER,
    reviewerQualification: QUALIFICATION,
    reviewedAt: REVIEWED_AT,
    reviewSetDigest,
    privateDistManifestDigest: artifactManifestDigest,
    servedReviewArtifactReceiptDigest: sha256Hex(receiptBytes),
    reviewSetResponseSha256: sha256Hex(reviewSetBytes),
    privateUrlHash: receipt.privateOriginHash,
    deploymentIdHash: receipt.deploymentIdHash,
    caseDecisions: cases
      .map((record) => ({
        caseId: record.id,
        clinicalDigest: computeCaseContentDigest(record),
        status: "approved",
        classicExceptionApprovedBy: record.classicExceptionApprovedBy,
      }))
      .sort((a, b) => (a.caseId < b.caseId ? -1 : 1)),
    overviewDecisions: overviews.map((overview) => ({
      injuryCode: overview.injuryCode,
      overviewDigest: computeInjuryOverviewDigest(overview),
      status: "approved",
    })),
    updateDecision: {
      updateId: update.id,
      updateDigest: computeQuarterlyUpdateDigest(update),
      status: "approved",
    },
  };
  const medicalDecisionBytes = canonicalJson(medicalDecision);

  const governance: any = {
    schemaVersion: 1,
    siteStatus: "public-approved",
    allowIndexing: true,
    currentUpdateId: update.id,
    currentReviewSetDigest: reviewSetDigest,
    medicalReviewDecisionDigest: sha256Hex(medicalDecisionBytes),
    reviewedContentCommit: CONTENT_COMMIT,
    publicRendererTreeDigest: rendererTreeDigest,
    baseReleaseDigest: null,
    baseHistoryBytesDigest: sha256Hex(EMPTY_PUBLIC_RELEASE_HISTORY_BYTES),
    publicSiteUrl: PUBLIC_URL,
    privacyPolicyUrl: `${PUBLIC_URL}/privacy/`,
    rightsPolicyUrl: `${PUBLIC_URL}/rights/`,
    publicRightsPolicyVersion: CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
    courseLinkPolicyVersion: COURSE_POLICY,
    indexingAuthorization: {
      status: "not-requested",
      authorizedBy: null,
      authorizedAt: null,
      authorizedSiteDigest: null,
      decisionPath: null,
      decisionDigest: null,
    },
  };

  const fx: Fixture = {
    governance,
    publicationDecision: null,
    cases,
    overviews,
    update,
    registry,
    registryArtifacts,
    historyBytes: EMPTY_PUBLIC_RELEASE_HISTORY_BYTES,
    loadReleaseArtifact: () => {
      throw new Error("no historical releases exist");
    },
    reviewSetBytes,
    medicalDecisionBytes,
    manifestBytes,
    receiptBytes,
    rightsDecisions,
    externalVerification,
    courseLinks,
    courseSummaries,
    courseDecisions,
    build: { commit: CONTENT_COMMIT, dirty: false, rendererTreeDigest },
    brandFindings: [],
  };

  // Fill the per-case external URL-set digests using the gate's own
  // computation via the candidate digest resolution below is not needed; the
  // gate recomputes them, so bind the actual values here.
  for (const entry of fx.externalVerification.cases) {
    const record = cases.find((candidate) => candidate.id === entry.caseId)!;
    entry.externalUrlSetDigest = computeExternalUrlSetDigest(record);
  }

  // Compute the candidate site digest from the proposed projection, then
  // create the publication decision and apply the authorization atomically.
  const siteDigest = computeCandidateSiteDigest(gateInput(fx));
  const publicationDecision = {
    schemaVersion: 1,
    decisionType: "site-publication",
    publicationStatus: "authorized",
    authorizedSiteDigest: siteDigest,
    publicUrlHash: sha256Hex(PUBLIC_URL),
    allowPublic: true,
    allowIndexing: true,
    authorizedBy: "Synthetic Site Owner",
    authorizedAt: "2026-08-06T10:00:00Z",
  };
  const publicationDecisionBytes = canonicalJson(publicationDecision);
  fx.publicationDecision = {
    bytes: publicationDecisionBytes,
    path: DECISION_PATH,
  };
  fx.governance.indexingAuthorization = {
    status: "authorized",
    authorizedBy: publicationDecision.authorizedBy,
    authorizedAt: publicationDecision.authorizedAt,
    authorizedSiteDigest: siteDigest,
    decisionPath: DECISION_PATH,
    decisionDigest: sha256Hex(publicationDecisionBytes),
  };
  return fx;
}

function codes(issues: Array<{ code: string }>): Set<string> {
  return new Set(issues.map((entry) => entry.code));
}

/** Rebuild the publication decision + bound authorization after a mutation. */
function resignPublicationDecision(
  fx: Fixture,
  mutate: (decision: any) => void,
): void {
  const decision = parseStrictJson(
    fx.publicationDecision!.bytes as string,
  ) as any;
  mutate(decision);
  const bytes = canonicalJson(decision);
  fx.publicationDecision = { bytes, path: fx.publicationDecision!.path };
  fx.governance.indexingAuthorization.decisionDigest = sha256Hex(bytes);
  fx.governance.indexingAuthorization.authorizedSiteDigest =
    decision.authorizedSiteDigest;
}

describe("public release gate: achievable authorization", () => {
  it("fails closed for active pending v2 despite otherwise complete authorization", () => {
    const fx = buildAuthorizedFixture();
    const observed = codes(evaluatePublicReleaseGate(gateInput(fx)));
    expect([...observed].sort()).toEqual([
      "gate-review-set-public-release-closed",
      "medical-decision-review-set-version",
    ]);
  });

  it("fails on the real empty content with deterministic messages", () => {
    const fx = buildAuthorizedFixture();
    const initialGovernance = JSON.parse(
      readFileSync(
        new URL("../../src/data/site-governance.v1.json", import.meta.url),
        "utf8",
      ),
    );
    const pendingLinks = {
      schemaVersion: 1,
      links: fx.courseLinks.links.map((link: any) => ({
        ...link,
        linkApproval: {
          status: "pending",
          approvedPublicUrl: null,
          approvedBy: null,
          approvedAt: null,
          approvedCatalogContentDigest: null,
          policyVersion: null,
          decisionPath: null,
          decisionDigest: null,
        },
      })),
    };
    const issues = evaluatePublicReleaseGate({
      ...gateInput(fx),
      governance: initialGovernance,
      publicationDecision: null,
      cases: [],
      overviews: [],
      updates: [],
      registry: { schemaVersion: 1, entries: [] },
      reviewSetBytes: null,
      medicalReviewDecisionBytes: null,
      reviewArtifactManifestBytes: null,
      servedReviewReceiptBytes: null,
      externalVerification: null,
      courseLinks: pendingLinks,
      build: { commit: null, dirty: true, rendererTreeDigest: null },
    });
    const observed = codes(issues);
    // counts, URLs, course links, external verification, authorization
    expect(observed).toContain("gate-count-total");
    expect(observed).toContain("gate-url-missing");
    expect(observed).toContain("gate-course-link-policy");
    expect(observed).toContain("gate-external-verification-missing");
    expect(observed).toContain("gate-site-status");
    expect(observed).toContain("gate-allow-indexing");
    expect(observed).toContain("gate-indexing-authorization");
    expect(observed).toContain("gate-current-update-missing");
    expect(observed).toContain("gate-review-set-missing");
  });
});

describe("public release gate: negative conditions", () => {
  it("1. rejects a siteStatus that is not explicitly public-approved", () => {
    const fx = buildAuthorizedFixture();
    fx.governance.siteStatus = "private-approved";
    fx.governance.allowIndexing = false;
    const observed = codes(evaluatePublicReleaseGate(gateInput(fx)));
    expect(observed).toContain("gate-site-status");
    expect(observed).toContain("gate-allow-indexing");
  });

  it("1b. rejects allowIndexing=false even when public-approved", () => {
    const fx = buildAuthorizedFixture();
    fx.governance.allowIndexing = false;
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-allow-indexing",
    );
  });

  it("2a. rejects a missing publication decision", () => {
    const fx = buildAuthorizedFixture();
    fx.publicationDecision = null;
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-publication-decision-missing",
    );
  });

  it("2b. rejects free prose instead of a strict decision", () => {
    const fx = buildAuthorizedFixture();
    fx.publicationDecision = {
      bytes: "I approve publishing this site. — Someone",
      path: DECISION_PATH,
    };
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "publication-decision-parse",
    );
  });

  it("2c. rejects duplicate keys and unknown fields", () => {
    const duplicate = parseSitePublicationDecisionBytes(
      '{"allowIndexing":true,"allowIndexing":true}',
    );
    expect(duplicate.decision).toBeNull();
    const fx = buildAuthorizedFixture();
    const decision = parseStrictJson(
      fx.publicationDecision!.bytes as string,
    ) as any;
    decision.extraField = "unknown";
    const bytes = canonicalJson(decision);
    fx.publicationDecision = { bytes, path: DECISION_PATH };
    fx.governance.indexingAuthorization.decisionDigest = sha256Hex(bytes);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "publication-decision-schema",
    );
  });

  it("2d. rejects a decision whose booleans are not literally true", () => {
    const parsed = parseSitePublicationDecisionBytes(
      canonicalJson({
        schemaVersion: 1,
        decisionType: "site-publication",
        publicationStatus: "authorized",
        authorizedSiteDigest: "a".repeat(64),
        publicUrlHash: "b".repeat(64),
        allowPublic: true,
        allowIndexing: false,
        authorizedBy: "Synthetic Site Owner",
        authorizedAt: "2026-08-06T10:00:00Z",
      }),
    );
    expect(parsed.decision).toBeNull();
  });

  it("2e. rejects a site-digest mismatch against the decision", () => {
    const fx = buildAuthorizedFixture();
    resignPublicationDecision(fx, (decision) => {
      decision.authorizedSiteDigest = "f".repeat(64);
    });
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-site-digest-mismatch",
    );
  });

  it("2f. rejects a URL-hash/identity/time mismatch", () => {
    const fx = buildAuthorizedFixture();
    fx.governance.indexingAuthorization.authorizedBy = "Someone Else";
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-publication-decision-identity",
    );

    const fx2 = buildAuthorizedFixture();
    fx2.governance.publicSiteUrl = "https://other.example.org";
    expect(codes(evaluatePublicReleaseGate(gateInput(fx2)))).toContain(
      "gate-publication-decision-url",
    );
  });

  it("2g. rejects a decision-byte digest mismatch", () => {
    const fx = buildAuthorizedFixture();
    fx.governance.indexingAuthorization.decisionDigest = "f".repeat(64);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-publication-decision-digest",
    );
  });

  it("3. rejects an empty launch collection", () => {
    const fx = buildAuthorizedFixture();
    fx.cases = [];
    fx.update.addedCases = [];
    resignUpdate(fx.update);
    const observed = codes(evaluatePublicReleaseGate(gateInput(fx)));
    expect(observed).toContain("gate-count-total");
  });

  it("4a. rejects a missing or duplicated approved overview", () => {
    const fx = buildAuthorizedFixture();
    fx.overviews.pop();
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-overview-count",
    );

    const fx2 = buildAuthorizedFixture();
    fx2.overviews.push(JSON.parse(JSON.stringify(fx2.overviews[0])));
    expect(codes(evaluatePublicReleaseGate(gateInput(fx2)))).toContain(
      "gate-overview-count",
    );
  });

  it("4b. rejects an overview still in medical review beside the approved one", () => {
    const fx = buildAuthorizedFixture();
    const draft = JSON.parse(JSON.stringify(fx.overviews[0]));
    draft.status = "medical-review";
    draft.review.status = "in-review";
    fx.overviews.push(draft);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-overview-extra",
    );
  });

  it("4c. rejects an overview digest mismatch", () => {
    const fx = buildAuthorizedFixture();
    const overview = fx.overviews[0];
    overview.scope = "Changed synthetic scope after approval.";
    overview.claims[0].text = overview.scope;
    const issues = evaluatePublicReleaseGate(gateInput(fx));
    expect(codes(issues)).toContain("overview-review-digest-stale");
  });

  it("5. rejects a draft record exposed through the public manifest", () => {
    const fx = buildAuthorizedFixture();
    const draft = syntheticCase(30);
    draft.status = "draft";
    fx.cases.push(draft);
    fx.update.addedCases.push({
      caseId: draft.id,
      currentClinicalDigest: computeCaseContentDigest(draft),
      currentVideoSourceDigest: computeVideoSourceDigest(draft),
    });
    fx.update.addedCases.sort((a: any, b: any) =>
      a.caseId < b.caseId ? -1 : 1,
    );
    resignUpdate(fx.update);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-update-public-set",
    );
  });

  it("6a. rejects a missing, legacy-v1, or tampered review-set manifest", () => {
    const fx = buildAuthorizedFixture();
    fx.reviewSetBytes = null;
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-review-set-missing",
    );

    const fx2 = buildAuthorizedFixture();
    const tampered = parseStrictJson(fx2.reviewSetBytes as string) as any;
    tampered.cases[0].clinicalDigest = "f".repeat(64);
    tampered.cases[0].approvedReview.reviewedContentDigest = "f".repeat(64);
    fx2.reviewSetBytes = canonicalJson(tampered);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx2)))).toContain(
      "gate-review-set-digest",
    );

    const fx3 = buildAuthorizedFixture();
    const activeV2 = parseStrictJson(fx3.reviewSetBytes as string) as any;
    const legacyV1 = buildReviewSetManifest({
      contentCommit: activeV2.contentCommit,
      cases: fx3.cases,
      overviews: fx3.overviews,
      currentUpdate: fx3.update,
      registry: fx3.registry,
      contentAuthoritySnapshotDigest:
        activeV2.approvedCoreContentAuthoritySnapshotDigest,
      rendererTreeDigest: activeV2.rendererTreeDigest,
      supportingDataDigest: activeV2.supportingDataDigest,
    });
    fx3.reviewSetBytes = canonicalJson(legacyV1);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx3)))).toContain(
      "review-set-v2-schema",
    );
  });

  it("6b. rejects a missing durable medical-review decision", () => {
    const fx = buildAuthorizedFixture();
    fx.medicalDecisionBytes = null;
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-medical-decision-missing",
    );
  });

  it("6c. refuses to apply medical-review-decision.v1 to pending v2", () => {
    const fx = buildAuthorizedFixture();
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "medical-decision-review-set-version",
    );
  });

  it("7a. rejects an origin manifest binding digest mismatch", () => {
    const fx = buildAuthorizedFixture();
    fx.cases[0].sourceManifestBinding.entryDigest = "e".repeat(64);
    fx.cases[0].review.reviewedContentDigest = computeCaseContentDigest(
      fx.cases[0],
    );
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "binding-entry-digest",
    );
  });

  it("7b. rejects a modified old registry prefix", () => {
    const fx = buildAuthorizedFixture();
    fx.registry.entries[0].manifestDigest = "d".repeat(64);
    const observed = codes(evaluatePublicReleaseGate(gateInput(fx)));
    expect(observed).toContain("artifact-digest");
    expect(observed).toContain("binding-unresolved");
  });

  it("7c. rejects an untracked superseding correction", () => {
    const fx = buildAuthorizedFixture();
    fx.registry.entries.push({
      manifestId: "SYN-CORRECTION-2026-08-07-001",
      manifestPath:
        "research/source-manifests/SYN-CORRECTION-2026-08-07-001.v1.json",
      manifestDigest: "1".repeat(64),
      sourceReviewDecisionPath:
        "research/reviews/source-batches/SYN-CORRECTION-2026-08-07-001-source-review-decision.v1.json",
      sourceReviewDecisionDigest: "2".repeat(64),
      sourcePolicyVersion: CURRENT_SOURCE_POLICY_VERSION,
      batchType: "correction",
      period: "2026-08-07",
      createdAt: "2026-08-07T00:00:00Z",
      previousRegistryBytesDigest: "3".repeat(64),
      supersedes: [
        {
          manifestId: MANIFEST_ID,
          candidateId: "SYN-CAND-001",
          entryDigest: fx.cases[0].sourceManifestBinding.entryDigest,
        },
      ],
    });
    const issues = evaluatePublicReleaseGate(gateInput(fx));
    expect(issues.some((entry) => entry.message.includes("superseded"))).toBe(
      true,
    );
  });

  it("7d. validates active source binding for medically approved cases even when they are not public", () => {
    const fx = buildAuthorizedFixture();
    fx.cases[0].video.publicRightsReview = {
      status: "not-requested",
      reviewedBy: null,
      reviewedAt: null,
      reviewedVideoDigest: null,
      policyVersion: null,
      termsCheckedAt: null,
      decisionBasis: null,
      notes: null,
      decisionPath: null,
      decisionDigest: null,
    };
    fx.registry.entries.push({
      manifestId: "SYN-CORRECTION-2026-08-07-001",
      manifestPath:
        "research/source-manifests/SYN-CORRECTION-2026-08-07-001.v1.json",
      manifestDigest: "1".repeat(64),
      sourceReviewDecisionPath:
        "research/reviews/source-batches/SYN-CORRECTION-2026-08-07-001-source-review-decision.v1.json",
      sourceReviewDecisionDigest: "2".repeat(64),
      sourcePolicyVersion: CURRENT_SOURCE_POLICY_VERSION,
      batchType: "correction",
      period: "2026-08-07",
      createdAt: "2026-08-07T00:00:00Z",
      previousRegistryBytesDigest: "3".repeat(64),
      supersedes: [
        {
          manifestId: MANIFEST_ID,
          candidateId: "SYN-CAND-001",
          entryDigest: fx.cases[0].sourceManifestBinding.entryDigest,
        },
      ],
    });

    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "binding-unresolved",
    );
  });

  it("8a. rejects provenance verified under a non-current policy version", () => {
    const fx = buildAuthorizedFixture();
    fx.cases[0].video.sourceProvenanceVerification.verifiedPolicyVersion =
      "source-policy-v0";
    const observed = codes(evaluatePublicReleaseGate(gateInput(fx)));
    expect(observed).toContain("gate-update-public-set");
  });

  it("8b. rejects stale/failed/mismatched external verification", () => {
    const fx = buildAuthorizedFixture();
    fx.externalVerification.cases[0].checkedAt = "2026-07-20T00:00:00Z";
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-external-verification-stale",
    );

    const fx2 = buildAuthorizedFixture();
    fx2.externalVerification.cases[0].results[0].status = "failed";
    expect(codes(evaluatePublicReleaseGate(gateInput(fx2)))).toContain(
      "gate-external-verification-failed",
    );

    const fx3 = buildAuthorizedFixture();
    fx3.externalVerification.cases[0].clinicalDigest = "a".repeat(64);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx3)))).toContain(
      "gate-external-verification-stale-digest",
    );

    const fx4 = buildAuthorizedFixture();
    fx4.externalVerification.cases[0].results.pop();
    expect(codes(evaluatePublicReleaseGate(gateInput(fx4)))).toContain(
      "gate-external-verification-url-set",
    );
  });

  it("8c. rejects a missing/tampered/mismatched per-case rights decision", () => {
    const fx = buildAuthorizedFixture();
    fx.rightsDecisions.delete(fx.cases[0].id);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "rights-decision-missing",
    );

    const fx2 = buildAuthorizedFixture();
    const caseId = fx2.cases[0].id;
    const loaded = fx2.rightsDecisions.get(caseId)!;
    const decision = parseStrictJson(loaded.bytes as string) as any;
    decision.reviewedBy = "Tampered Reviewer";
    fx2.rightsDecisions.set(caseId, {
      bytes: canonicalJson(decision),
      path: loaded.path,
    });
    const observed = codes(evaluatePublicReleaseGate(gateInput(fx2)));
    expect(observed).toContain("rights-decision-digest");
    expect(observed).toContain("rights-decision-field-mismatch");

    const fx3 = buildAuthorizedFixture();
    const caseId3 = fx3.cases[0].id;
    const loaded3 = fx3.rightsDecisions.get(caseId3)!;
    fx3.rightsDecisions.set(caseId3, {
      bytes: loaded3.bytes,
      path: videoRightsDecisionPathFor("CASE-SYN-2026-999"),
    });
    expect(codes(evaluatePublicReleaseGate(gateInput(fx3)))).toContain(
      "rights-decision-path",
    );
  });

  it("9a. rejects an absent or ambiguous currentUpdateId", () => {
    const fx = buildAuthorizedFixture();
    fx.governance.currentUpdateId = null;
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-current-update-missing",
    );
  });

  it("9b. rejects a stale update digest or null publishedAt", () => {
    const fx = buildAuthorizedFixture();
    fx.update.summary = "Changed after approval.";
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-current-update-unapproved",
    );

    const fx2 = buildAuthorizedFixture();
    fx2.update.publishedAt = null;
    expect(codes(evaluatePublicReleaseGate(gateInput(fx2)))).toContain(
      "gate-current-update-published-at",
    );
  });

  it("10a. rejects wrong frozen bases and tampered history", () => {
    const fx = buildAuthorizedFixture();
    fx.governance.baseHistoryBytesDigest = "b".repeat(64);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-base-history-bytes",
    );

    const fx2 = buildAuthorizedFixture();
    fx2.governance.baseReleaseDigest = "c".repeat(64);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx2)))).toContain(
      "gate-base-release-digest",
    );

    const fx3 = buildAuthorizedFixture();
    fx3.historyBytes = '{"releases":[{"bogus":true}],"schemaVersion":1}';
    expect(codes(evaluatePublicReleaseGate(gateInput(fx3)))).toContain(
      "history-schema",
    );
  });

  it("10b. rejects a dirty build commit or renderer digest drift", () => {
    const fx = buildAuthorizedFixture();
    fx.build.dirty = true;
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-build-commit",
    );

    const fx2 = buildAuthorizedFixture();
    fx2.build.rendererTreeDigest = "c".repeat(64);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx2)))).toContain(
      "gate-renderer-tree",
    );
  });

  it("10c. treats a missing historical-source loader as fatal", () => {
    const fx = buildAuthorizedFixture();
    fx.loadReleaseArtifact = null;
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-history-loader-missing",
    );
  });

  it("11a. rejects a null courseLinkPolicyVersion and pending links", () => {
    const fx = buildAuthorizedFixture();
    fx.governance.courseLinkPolicyVersion = null;
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-course-link-policy",
    );

    const fx2 = buildAuthorizedFixture();
    fx2.courseLinks.links[0].linkApproval = {
      status: "pending",
      approvedPublicUrl: null,
      approvedBy: null,
      approvedAt: null,
      approvedCatalogContentDigest: null,
      policyVersion: null,
      decisionPath: null,
      decisionDigest: null,
    };
    expect(codes(evaluatePublicReleaseGate(gateInput(fx2)))).toContain(
      "cta-link-not-approved",
    );

    const fx3 = buildAuthorizedFixture();
    fx3.courseDecisions.delete(EXPECTED_COURSE_LINK_KEYS[0]!);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx3)))).toContain(
      "cta-decision-missing",
    );
  });

  it("11b. rejects missing public/privacy/rights URLs", () => {
    for (const field of [
      "publicSiteUrl",
      "privacyPolicyUrl",
      "rightsPolicyUrl",
    ]) {
      const fx = buildAuthorizedFixture();
      fx.governance[field] = null;
      expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
        "gate-url-missing",
      );
    }
  });

  it("14. rejects a baseline update that retires an unknown case", () => {
    const fx = buildAuthorizedFixture();
    fx.update.retiredCases.push({
      caseId: "CASE-SYN-1999-999",
      previousClinicalDigest: "a".repeat(64),
      previousVideoSourceDigest: "b".repeat(64),
      reason: "synthetic retirement",
    });
    resignUpdate(fx.update);
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-update-baseline",
    );
  });

  it("15. rejects any brand-asset finding", () => {
    const fx = buildAuthorizedFixture();
    fx.brandFindings = ["public/nba-logo.png"];
    expect(codes(evaluatePublicReleaseGate(gateInput(fx)))).toContain(
      "gate-brand-asset",
    );
  });

  it("16. rejects a public embed of a caption-unverified video", () => {
    const fx = buildAuthorizedFixture();
    const record = fx.cases[0];
    record.video.captionStatus = "not-verified";
    // Re-sign so the case remains public with an external-link rendering.
    record.video.sourceProvenanceVerification.reviewedVideoIdentityDigest =
      computeVideoIdentityDigest(record);
    const videoSourceDigest = computeVideoSourceDigest(record);
    record.video.publicRightsReview.reviewedVideoDigest = videoSourceDigest;
    record.review.reviewedContentDigest = computeCaseContentDigest(record);
    const pages = [
      {
        path: `cases/${record.slug}/index.html`,
        html: `<html><body><div data-case-embed="${record.id}"><iframe data-case-embed="${record.id}" src="https://www.youtube-nocookie.com/embed/x"></iframe></div></body></html>`,
      },
    ];
    const issues = validatePublicOutput(pages, [], [record]);
    expect(codes(issues)).toContain("public-output-embed-caption");
  });
});
