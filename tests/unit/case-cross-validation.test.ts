import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import {
  validateCaseApprovalPrerequisites,
  validateCaseCollection,
  validateCaseFilename,
  validateCaseRecord,
  validateCaseSourceBinding,
} from "../../src/lib/contracts/cross-validation";
import {
  EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
  type SourceManifestRegistryV1,
} from "../../src/lib/contracts/source-manifest-registry";

const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );
const recent = (): any => loadFixture("cases/valid-medical-review.json");
const classic = (): any => loadFixture("cases/valid-approved-classic.json");
const codes = (record: unknown): string[] =>
  validateCaseRecord(record).map((issue) => issue.code);
const approvalCodes = (record: any): string[] =>
  validateCaseApprovalPrerequisites(record).map((issue) => issue.code);

/**
 * Copies the visibly fictional research fixture subtree into a temporary
 * repository root so its logical paths are production-shaped, recomputing
 * every digest. Never writes into the real research/ authority directories.
 */
function bakeResearchRoot(manifest: any, decision: any) {
  const manifestBytes = canonicalJson(manifest);
  const manifestDigest = sha256Hex(manifestBytes);
  const patchedDecision = { ...decision, manifestDigest };
  const decisionBytes = canonicalJson(patchedDecision);
  const decisionDigest = sha256Hex(decisionBytes);
  const manifestPath = `research/source-manifests/${manifest.manifestId}.v1.json`;
  const decisionPath = `research/reviews/source-batches/${manifest.manifestId}-source-review-decision.v1.json`;
  const registry: SourceManifestRegistryV1 = {
    schemaVersion: 1,
    entries: [
      {
        manifestId: manifest.manifestId,
        manifestPath,
        manifestDigest,
        sourceReviewDecisionPath: decisionPath,
        sourceReviewDecisionDigest: decisionDigest,
        sourcePolicyVersion: manifest.sourcePolicyVersion,
        batchType: manifest.batchType,
        period: manifest.period,
        createdAt: "2026-08-06T01:00:00Z",
        previousRegistryBytesDigest: sha256Hex(
          EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
        ),
        supersedes: [],
      },
    ],
  };
  const root = mkdtempSync(join(tmpdir(), "atlas-research-"));
  const writeAt = (rel: string, bytes: string): void => {
    const target = join(root, rel);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  };
  writeAt(manifestPath, manifestBytes);
  writeAt(decisionPath, decisionBytes);
  writeAt("research/source-manifest-registry.v1.json", canonicalJson(registry));
  const loadFile = (rel: string): Uint8Array => readFileSync(join(root, rel));
  const entryDigestFor = (candidateId: string): string =>
    sha256Hex(
      canonicalJson(
        manifest.entries.find(
          (entry: any) => entry.candidateId === candidateId,
        ),
      ),
    );
  const bindingFor = (candidateId: string) => ({
    candidateId,
    manifestId: manifest.manifestId,
    manifestDigest,
    entryDigest: entryDigestFor(candidateId),
    sourceReviewDecisionDigest: decisionDigest,
    sourcePolicyVersion: manifest.sourcePolicyVersion,
  });
  return {
    root,
    registry,
    loadFile,
    manifestDigest,
    decisionDigest,
    bindingFor,
  };
}

const fixtureManifest = (): any =>
  loadFixture(
    "research/source-manifests/FICTIONAL-SOURCE-2026-08-06-001.v1.json",
  );
const fixtureDecision = (): any =>
  loadFixture(
    "research/reviews/source-batches/FICTIONAL-SOURCE-2026-08-06-001-source-review-decision.v1.json",
  );

const richManifest = (): any =>
  JSON.parse(
    readFileSync(
      new URL(
        "../../research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
const richRegistry = (): SourceManifestRegistryV1 =>
  JSON.parse(
    readFileSync(
      new URL(
        "../../research/source-manifest-registry.v1.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
const loadRichArtifact = (path: string): Uint8Array =>
  readFileSync(new URL(`../../${path}`, import.meta.url));

/** Maps one real rich-manifest entry onto a non-production case fixture. */
function richBoundRecord(candidateId = "CAND-NBA-ACL-2021-009"): any {
  const manifest = richManifest();
  const entry = manifest.entries.find(
    (candidate: any) => candidate.candidateId === candidateId,
  );
  if (entry === undefined) throw new Error(`missing fixture ${candidateId}`);
  const registryEntry = richRegistry().entries[0];
  const record = recent();
  record.sourceManifestBinding = {
    candidateId: entry.candidateId,
    manifestId: manifest.manifestId,
    manifestDigest: registryEntry.manifestDigest,
    entryDigest: entry.entryDigest,
    sourceReviewDecisionDigest: registryEntry.sourceReviewDecisionDigest,
    sourcePolicyVersion: manifest.sourcePolicyVersion,
  };
  record.athlete.name = entry.athleteDisplayName;
  record.teamAtEvent.name = entry.teamAtEvent;
  record.opponent.name = entry.opponent;
  record.sport.code = "basketball";
  record.league.code = "nba";
  record.competition.code = entry.competition;
  record.season = entry.season;
  record.eventDate = entry.eventDate;
  record.injury.code = entry.injuryCode;
  record.injury.confirmedDiagnosis = entry.diagnosisClaim;
  record.injury.confirmationStatus = "confirmed";
  record.observedMechanismTags = ["unclear"];
  record.isClassic = entry.isClassic;
  record.classicReason = entry.classicReason;
  record.classicProposedBy = null;
  record.classicExceptionApprovedBy = null;
  record.video.provider = entry.video.provider;
  record.video.contentType = entry.video.contentType;
  record.video.canonicalUrl = entry.video.canonicalUrl;
  record.video.fallbackUrl = entry.video.canonicalUrl;
  record.video.uploaderName = entry.video.uploaderName;
  record.video.uploaderProvenance = entry.video.uploaderProvenance;
  record.video.embedStatus = entry.video.embedStatus;
  record.video.embedCheckedAt = entry.video.embedCheckedAt;
  record.video.captionStatus = entry.video.captionStatus;
  record.video.captionCheckedAt = entry.video.captionCheckedAt;
  record.video.sourceProvenanceVerification = {
    status: entry.video.provenanceStatus,
    verifiedBy: entry.video.provenanceCheckedBy,
    verifiedAt: entry.video.provenanceCheckedAt,
    basis: entry.video.provenanceBasis,
    notes: null,
    verifiedPolicyVersion: manifest.sourcePolicyVersion,
    reviewedVideoIdentityDigest: "1".repeat(64),
  };

  const videoSource = {
    id: "src-nba-acl-2021-009-video",
    type: "video-original",
    title: entry.video.title,
    publisher: entry.video.uploaderName,
    independenceGroup: "nba-organization",
    originReportId: null,
    url: entry.video.canonicalUrl,
    publishedAt: entry.video.publishedAt,
    accessedAt: entry.video.accessedAt,
    supports: [
      "general.whatHappened",
      "general.whatIsVisible",
      "video.segmentObservation",
    ],
  };
  const diagnosisSources = entry.diagnosisSources
    .filter((source: any) => source !== null)
    .map((source: any, index: number) => ({
      id: `src-nba-acl-2021-009-diagnosis-${String(index + 1).padStart(2, "0")}`,
      ...source,
      supports: ["injury.confirmedDiagnosis", "general.confirmedUpdate"],
    }));
  const eventSource = {
    id: "src-nba-acl-2021-009-event",
    type: "event-context",
    ...entry.eventSource,
    independenceGroup: "nba-com",
    originReportId: null,
    supports: ["general.whatHappened"],
  };
  const teachingSources = record.sources.filter(
    (source: any) => source.type === "teaching-evidence",
  );
  record.sources = [
    videoSource,
    ...diagnosisSources,
    eventSource,
    ...teachingSources,
  ];
  record.video.eventBinding = {
    status: "verified",
    eventSourceId: eventSource.id,
    checkedBy: entry.video.provenanceCheckedBy,
    checkedAt: entry.video.provenanceCheckedAt,
    basis: entry.eventBinding.basis,
  };
  record.audit.sourceRecordId = entry.candidateId;
  return record;
}

function bakeRichArtifacts(
  options: {
    manifest?: any;
    decisionBytes?: string;
  } = {},
) {
  const manifest = options.manifest ?? richManifest();
  const registry = structuredClone(richRegistry());
  const manifestBytes = canonicalJson(manifest);
  const decisionPath = registry.entries[0].sourceReviewDecisionPath;
  const decisionBytes =
    options.decisionBytes ??
    readFileSync(new URL(`../../${decisionPath}`, import.meta.url), "utf8");
  registry.entries[0].manifestDigest = sha256Hex(manifestBytes);
  registry.entries[0].sourceReviewDecisionDigest = sha256Hex(decisionBytes);
  const record = richBoundRecord();
  record.sourceManifestBinding.manifestDigest =
    registry.entries[0].manifestDigest;
  record.sourceManifestBinding.sourceReviewDecisionDigest =
    registry.entries[0].sourceReviewDecisionDigest;
  const files = new Map<string, Uint8Array>([
    [registry.entries[0].manifestPath, Buffer.from(manifestBytes)],
    [decisionPath, Buffer.from(decisionBytes)],
  ]);
  const loadFile = (path: string): Uint8Array => {
    const bytes = files.get(path);
    if (bytes === undefined) throw new Error(`missing artifact ${path}`);
    return bytes;
  };
  return { manifest, registry, record, loadFile };
}

describe("registry token validation", () => {
  it("rejects unknown injury, league, competition, and mechanism tokens", () => {
    const badInjury = recent();
    badInjury.injury.code = "hamstring-strain";
    expect(codes(badInjury)).toContain("unknown-injury");
    const badLeague = recent();
    badLeague.league.code = "mlb";
    expect(codes(badLeague)).toContain("unknown-league");
    const badCompetition = recent();
    badCompetition.competition.code = "nba-summer-league";
    expect(codes(badCompetition)).toContain("unknown-competition");
    const badMechanism = recent();
    badMechanism.observedMechanismTags = ["inversion-landing", "acl-tear"];
    expect(codes(badMechanism)).toContain("unknown-mechanism");
  });

  it("rejects an unknown video provider and host/embed mismatches", () => {
    const badProvider = recent();
    badProvider.video.provider = "fictional-broadcaster";
    expect(codes(badProvider)).toContain("unknown-provider");

    const badHost = recent();
    badHost.video.canonicalUrl = "https://www.nba.com/watch/fic-alpha-001";
    badHost.video.fallbackUrl = badHost.video.canonicalUrl;
    badHost.sources[0].url = badHost.video.canonicalUrl;
    expect(codes(badHost)).toContain("video-host");

    const nbaEmbed = recent();
    nbaEmbed.video.provider = "nba";
    nbaEmbed.video.canonicalUrl = "https://www.nba.com/watch/fic-alpha-001";
    nbaEmbed.video.fallbackUrl = nbaEmbed.video.canonicalUrl;
    nbaEmbed.sources[0].url = nbaEmbed.video.canonicalUrl;
    expect(codes(nbaEmbed)).toContain("embed-status-not-allowed");
  });

  it("rejects unclear combined with another mechanism tag", () => {
    const record = recent();
    record.observedMechanismTags = ["unclear", "inversion-landing"];
    expect(codes(record)).toContain("mechanism-combination");
  });

  it("rejects mechanism tags not allowed for the case injury", () => {
    const record = recent();
    record.observedMechanismTags = ["push-off-acceleration"];
    expect(codes(record)).toContain("mechanism-injury-mismatch");
  });
});

describe("NBA cross-validation", () => {
  it("rejects NBA paired with a sport other than basketball", () => {
    const record = recent();
    record.sport.code = "baseball";
    const found = codes(record);
    expect(
      found.includes("league-sport-mismatch") ||
        found.includes("unknown-sport"),
    ).toBe(true);
  });

  it("requires the two-year season form for NBA", () => {
    const record = recent();
    record.season = "2026";
    expect(codes(record)).toContain("season-form");
  });

  it("rejects a season whose second year does not follow the first", () => {
    const record = recent();
    record.season = "2025-27";
    expect(codes(record)).toContain("season-year-sequence");
  });

  it("rejects an event date outside the declared NBA season", () => {
    const record = recent();
    record.eventDate = "2025-01-15";
    expect(codes(record)).toContain("event-date-outside-season");
  });
});

describe("classic exception rules", () => {
  it("fails a pre-cutoff case that is not marked classic, at every status", () => {
    for (const status of [
      "draft",
      "source-verified",
      "medical-review",
      "approved",
    ]) {
      const record = classic();
      record.status = status;
      record.isClassic = false;
      record.classicReason = null;
      record.classicProposedBy = null;
      record.classicExceptionApprovedBy = null;
      expect(codes(record)).toContain("classic-required");
    }
  });

  it("fails a classic without reason or proposer, at every status", () => {
    for (const status of [
      "draft",
      "source-verified",
      "medical-review",
      "approved",
    ]) {
      const noReason = classic();
      noReason.status = status;
      noReason.classicReason = null;
      expect(codes(noReason)).toContain("classic-fields");
      const noProposer = classic();
      noProposer.status = status;
      noProposer.classicProposedBy = null;
      expect(codes(noProposer)).toContain("classic-fields");
    }
  });

  it("rejects a recent case marked classic", () => {
    const record = recent();
    record.isClassic = true;
    record.classicReason = "Not actually old.";
    record.classicProposedBy = "Fictional Curator One";
    expect(codes(record)).toContain("classic-not-allowed");
  });

  it("fails an approved classic without an approver matching the reviewer", () => {
    const missing = classic();
    missing.classicExceptionApprovedBy = null;
    expect(approvalCodes(missing)).toContain("approval-classic-approver");
    const mismatch = classic();
    mismatch.classicExceptionApprovedBy = "Dr. Fictional Somebody Else";
    expect(approvalCodes(mismatch)).toContain("approval-classic-approver");
  });
});

describe("diagnosis source rules", () => {
  const stripFirstParty = (record: any): void => {
    record.sources = record.sources.filter(
      (source: any) => source.type !== "diagnosis-first-party",
    );
    record.video.eventBinding.eventSourceId = record.sources.find(
      (source: any) => source.type === "event-context",
    ).id;
  };
  const secondary = (
    record: any,
    id: string,
    group: string,
    origin: string | null,
  ) => ({
    id,
    type: "diagnosis-secondary",
    title: `Fictional secondary report ${id}`,
    publisher: `Fictional publisher ${group}`,
    independenceGroup: group,
    originReportId: origin,
    url: `https://${group}.example.net/${id}`,
    publishedAt: record.eventDate,
    accessedAt: "2026-08-01",
    supports: ["injury.confirmedDiagnosis", "general.confirmedUpdate"],
  });

  it("fails a recent approved case without a first-party diagnosis source", () => {
    const record = recent();
    record.status = "approved";
    stripFirstParty(record);
    record.sources.push(
      secondary(record, "src-fic-001-sec-a", "fictional-metro-times", null),
    );
    record.sources.push(
      secondary(record, "src-fic-001-sec-b", "fictional-national-desk", null),
    );
    expect(approvalCodes(record)).toContain("approval-diagnosis-source");
  });

  it("passes a classic with one first-party source", () => {
    expect(
      approvalCodes(classic()).filter(
        (code) => code === "approval-diagnosis-source",
      ),
    ).toEqual([]);
  });

  it("allows a classic with two independent secondary sources structurally", () => {
    const record = classic();
    stripFirstParty(record);
    record.sources.push(
      secondary(record, "src-fic-002-sec-a", "fictional-metro-times", null),
    );
    record.sources.push(
      secondary(record, "src-fic-002-sec-b", "fictional-national-desk", null),
    );
    expect(approvalCodes(record)).not.toContain("approval-diagnosis-source");
  });

  it("rejects secondary sources sharing a publisher group or syndicated origin", () => {
    const sameGroup = classic();
    stripFirstParty(sameGroup);
    sameGroup.sources.push(
      secondary(sameGroup, "src-fic-002-sec-a", "fictional-metro-times", null),
    );
    sameGroup.sources.push(
      secondary(sameGroup, "src-fic-002-sec-b", "fictional-metro-times", null),
    );
    expect(approvalCodes(sameGroup)).toContain("approval-diagnosis-source");

    const sharedOrigin = classic();
    stripFirstParty(sharedOrigin);
    sharedOrigin.sources.push(
      secondary(
        sharedOrigin,
        "src-fic-002-sec-a",
        "fictional-metro-times",
        "FIC-WIRE-001",
      ),
    );
    sharedOrigin.sources.push(
      secondary(
        sharedOrigin,
        "src-fic-002-sec-b",
        "fictional-national-desk",
        "FIC-WIRE-001",
      ),
    );
    expect(approvalCodes(sharedOrigin)).toContain("approval-diagnosis-source");
  });
});

describe("approval prerequisites", () => {
  it("fails approval with unconfirmed or conflicted diagnosis", () => {
    for (const status of ["unconfirmed", "conflicted"]) {
      const record = classic();
      record.injury.confirmationStatus = status;
      expect(approvalCodes(record)).toContain("approval-diagnosis-unconfirmed");
    }
  });

  it("fails approval with pending source provenance", () => {
    const record = classic();
    record.video.sourceProvenanceVerification = {
      status: "pending",
      verifiedBy: null,
      verifiedAt: null,
      basis: null,
      notes: null,
      verifiedPolicyVersion: null,
      reviewedVideoIdentityDigest: null,
    };
    expect(approvalCodes(record)).toContain("approval-provenance");
  });

  it("fails approval with unavailable video", () => {
    const record = classic();
    record.video.embedStatus = "unavailable";
    expect(approvalCodes(record)).toContain("approval-video-unavailable");
  });

  it("fails approval with incomplete reviewer fields or malformed digest", () => {
    const noQualification = classic();
    noQualification.review.reviewerQualification = null;
    expect(approvalCodes(noQualification)).toContain(
      "approval-review-incomplete",
    );
    const badDigest = classic();
    badDigest.review.reviewedContentDigest = "ABCDEF";
    expect(approvalCodes(badDigest)).toContain("approval-review-digest-format");
    const uppercase = classic();
    uppercase.review.reviewedContentDigest = "A".repeat(64);
    expect(approvalCodes(uppercase)).toContain("approval-review-digest-format");
  });

  it("fails approval when the event binding is not verified", () => {
    const record = classic();
    record.video.eventBinding.status = "pending";
    expect(approvalCodes(record)).toContain("approval-event-binding");
  });

  it("accepts an approved medical case with public rights not requested", () => {
    const record = classic();
    expect(record.video.publicRightsReview.status).toBe("not-requested");
    expect(approvalCodes(record)).toEqual([]);
  });
});

describe("collection-level uniqueness", () => {
  it("rejects duplicate case IDs and slugs", () => {
    const a = recent();
    const b = classic();
    b.id = a.id;
    const issues = validateCaseCollection([a, b]).map((issue) => issue.code);
    expect(issues).toContain("duplicate-case-id");

    const c = recent();
    const d = classic();
    d.slug = c.slug;
    expect(validateCaseCollection([c, d]).map((issue) => issue.code)).toContain(
      "duplicate-slug",
    );
  });

  it("rejects source IDs reused across the collection", () => {
    const a = recent();
    const b = classic();
    b.sources[3].id = "src-fic-001-teach-a";
    b.professional.claims = b.professional.claims.map((claim: any) => ({
      ...claim,
      evidenceIds: claim.evidenceIds.map((id: string) =>
        id === "src-fic-002-teach-a" ? "src-fic-001-teach-a" : id,
      ),
    }));
    b.professional.evidenceIds = ["src-fic-001-teach-a", "src-fic-002-teach-b"];
    expect(validateCaseCollection([a, b]).map((issue) => issue.code)).toContain(
      "duplicate-source-id",
    );
  });

  it("accepts the two valid fixtures together", () => {
    expect(validateCaseCollection([recent(), classic()])).toEqual([]);
  });
});

describe("filename and loader boundaries", () => {
  it("rejects a filename that does not match the slug", () => {
    const issues = validateCaseFilename("wrong-name.json", recent());
    expect(issues.map((issue) => issue.code)).toContain(
      "filename-slug-mismatch",
    );
    expect(
      validateCaseFilename(
        "fictional-forward-alpha-ankle-sprain-2026.json",
        recent(),
      ),
    ).toEqual([]);
  });

  it("rejects fixture paths in production loading", () => {
    const issues = validateCaseFilename(
      "tests/fixtures/cases/fictional-forward-alpha-ankle-sprain-2026.json",
      recent(),
    );
    expect(issues.map((issue) => issue.code)).toContain("fixture-path");
  });
});

describe("source-manifest binding cross-validation", () => {
  it("accepts a case bound to the registered rich canonical manifest", () => {
    expect(
      validateCaseSourceBinding(
        richBoundRecord(),
        richRegistry(),
        loadRichArtifact,
      ),
    ).toEqual([]);
  });

  it("fails closed on stale rich manifest, decision, and entry digests", () => {
    const manifestBytesDrift = (path: string): Uint8Array => {
      const bytes = loadRichArtifact(path);
      return path.endsWith("NBA-SOURCE-2026-08-06-001.v1.json")
        ? Buffer.concat([bytes, Buffer.from("\n")])
        : bytes;
    };
    expect(
      validateCaseSourceBinding(
        richBoundRecord(),
        richRegistry(),
        manifestBytesDrift,
      ).map((entry) => entry.code),
    ).toContain("binding-manifest-digest");

    const decisionBytesDrift = (path: string): Uint8Array => {
      const bytes = loadRichArtifact(path);
      return path.includes("source-review-decision")
        ? Buffer.concat([bytes, Buffer.from("\n")])
        : bytes;
    };
    expect(
      validateCaseSourceBinding(
        richBoundRecord(),
        richRegistry(),
        decisionBytesDrift,
      ).map((entry) => entry.code),
    ).toContain("binding-decision-digest");

    const staleDecision = richBoundRecord();
    staleDecision.sourceManifestBinding.sourceReviewDecisionDigest = "3".repeat(
      64,
    );
    expect(
      validateCaseSourceBinding(
        staleDecision,
        richRegistry(),
        loadRichArtifact,
      ).map((entry) => entry.code),
    ).toContain("binding-unresolved");

    const staleEntry = richBoundRecord();
    staleEntry.sourceManifestBinding.entryDigest = "4".repeat(64);
    expect(
      validateCaseSourceBinding(
        staleEntry,
        richRegistry(),
        loadRichArtifact,
      ).map((entry) => entry.code),
    ).toContain("binding-entry-digest");
  });

  it("rejects missing or duplicate rich candidates", () => {
    const missing = richBoundRecord();
    missing.sourceManifestBinding.candidateId = "CAND-NBA-ACL-2099-999";
    expect(
      validateCaseSourceBinding(missing, richRegistry(), loadRichArtifact).map(
        (entry) => entry.code,
      ),
    ).toContain("binding-entry-missing");

    const duplicateManifest = structuredClone(richManifest());
    duplicateManifest.entries.splice(
      1,
      0,
      structuredClone(duplicateManifest.entries[0]),
    );
    const duplicate = bakeRichArtifacts({ manifest: duplicateManifest });
    expect(
      validateCaseSourceBinding(
        duplicate.record,
        duplicate.registry,
        duplicate.loadFile,
      ).map((entry) => entry.code),
    ).toContain("binding-artifact-schema");
  });

  it("rejects rich candidate, video identity, and mapped-source drift", () => {
    const mutations: Array<(record: any) => void> = [
      (record) => {
        record.athlete.name = "Markelle Fultz Jr.";
      },
      (record) => {
        record.video.provider = "youtube";
      },
      (record) => {
        record.video.canonicalUrl = "https://www.nba.com/watch/video/drift";
      },
      (record) => {
        record.video.uploaderName = "Different Uploader";
      },
    ];
    for (const mutate of mutations) {
      const record = richBoundRecord();
      mutate(record);
      expect(
        validateCaseSourceBinding(record, richRegistry(), loadRichArtifact).map(
          (entry) => entry.code,
        ),
      ).toContain("binding-fact-drift");
    }

    for (const sourceType of [
      "video-original",
      "diagnosis-first-party",
      "event-context",
    ]) {
      const record = richBoundRecord();
      const source = record.sources.find(
        (candidate: any) => candidate.type === sourceType,
      );
      source.title = `${source.title} drift`;
      expect(
        validateCaseSourceBinding(record, richRegistry(), loadRichArtifact).map(
          (entry) => entry.code,
        ),
      ).toContain("binding-source-drift");
    }
  });

  it("rejects rich policy drift and unapproved source/review states", () => {
    const stalePolicy = richBoundRecord();
    stalePolicy.sourceManifestBinding.sourcePolicyVersion = "nba-v1";
    expect(
      validateCaseSourceBinding(
        stalePolicy,
        richRegistry(),
        loadRichArtifact,
      ).map((entry) => entry.code),
    ).toContain("binding-unresolved");

    const policyRegistry = structuredClone(richRegistry());
    policyRegistry.entries[0].sourcePolicyVersion = "nba-v3";
    const policyRecord = richBoundRecord();
    policyRecord.sourceManifestBinding.sourcePolicyVersion = "nba-v3";
    expect(
      validateCaseSourceBinding(
        policyRecord,
        policyRegistry,
        loadRichArtifact,
      ).map((entry) => entry.code),
    ).toContain("binding-artifact-schema");

    const unverifiedManifest = structuredClone(richManifest());
    unverifiedManifest.entries[0].sourceStatus = "draft";
    const unverified = bakeRichArtifacts({ manifest: unverifiedManifest });
    expect(
      validateCaseSourceBinding(
        unverified.record,
        unverified.registry,
        unverified.loadFile,
      ).map((entry) => entry.code),
    ).toContain("binding-artifact-schema");

    const unreviewedManifest = structuredClone(richManifest());
    unreviewedManifest.sourceReview.status = "pending";
    const unreviewed = bakeRichArtifacts({ manifest: unreviewedManifest });
    expect(
      validateCaseSourceBinding(
        unreviewed.record,
        unreviewed.registry,
        unreviewed.loadFile,
      ).map((entry) => entry.code),
    ).toContain("binding-artifact-schema");
  });

  it("rejects superseded origins and both registered fixture paths", () => {
    const record = richBoundRecord();
    const registry = structuredClone(richRegistry());
    const origin = registry.entries[0];
    registry.entries.push({
      manifestId: "NBA-SOURCE-2026-08-08-001",
      manifestPath:
        "research/source-manifests/NBA-SOURCE-2026-08-08-001.v1.json",
      manifestDigest: "5".repeat(64),
      sourceReviewDecisionPath:
        "research/reviews/source-batches/NBA-SOURCE-2026-08-08-001-source-review-decision.v1.json",
      sourceReviewDecisionDigest: "6".repeat(64),
      sourcePolicyVersion: "nba-v2",
      batchType: "correction",
      period: "2026-08-08",
      createdAt: "2026-08-08T00:00:00Z",
      previousRegistryBytesDigest: sha256Hex(canonicalJson(registry)),
      supersedes: [
        {
          manifestId: origin.manifestId,
          candidateId: record.sourceManifestBinding.candidateId,
          entryDigest: record.sourceManifestBinding.entryDigest,
        },
      ],
    });
    expect(
      validateCaseSourceBinding(record, registry, loadRichArtifact).map(
        (entry) => entry.code,
      ),
    ).toContain("binding-unresolved");

    for (const pathKey of [
      "manifestPath",
      "sourceReviewDecisionPath",
    ] as const) {
      const fixtureRegistry = structuredClone(richRegistry());
      fixtureRegistry.entries[0][pathKey] =
        `research/${pathKey === "manifestPath" ? "source-manifests" : "reviews/source-batches"}/tests/fixture.json`;
      expect(
        validateCaseSourceBinding(
          richBoundRecord(),
          fixtureRegistry,
          loadRichArtifact,
        ).map((entry) => entry.code),
      ).toContain("binding-fixture-path");
    }
  });

  it("returns issues, not throws, for malformed and cross-format decisions", () => {
    const malformed = bakeRichArtifacts({ decisionBytes: "{" });
    expect(() =>
      validateCaseSourceBinding(
        malformed.record,
        malformed.registry,
        malformed.loadFile,
      ),
    ).not.toThrow();
    expect(
      validateCaseSourceBinding(
        malformed.record,
        malformed.registry,
        malformed.loadFile,
      ).map((entry) => entry.code),
    ).toContain("binding-artifact-schema");

    const confused = bakeRichArtifacts({
      decisionBytes: canonicalJson(fixtureDecision()),
    });
    expect(
      validateCaseSourceBinding(
        confused.record,
        confused.registry,
        confused.loadFile,
      ).map((entry) => entry.code),
    ).toContain("binding-artifact-schema");

    const reverseConfused = bakeResearchRoot(
      fixtureManifest(),
      JSON.parse(
        readFileSync(
          new URL(
            "../../research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json",
            import.meta.url,
          ),
          "utf8",
        ),
      ),
    );
    const legacyRecord = recent();
    legacyRecord.sourceManifestBinding =
      reverseConfused.bindingFor("FIC-CAND-001");
    expect(
      validateCaseSourceBinding(
        legacyRecord,
        reverseConfused.registry,
        reverseConfused.loadFile,
      ).map((entry) => entry.code),
    ).toContain("binding-artifact-schema");
  });

  it("does not fabricate rich-manifest duration while retaining runtime bounds", () => {
    const inspected = richBoundRecord();
    inspected.video.durationSeconds = 240;
    inspected.video.startSeconds = 20;
    inspected.video.endSeconds = 45;
    inspected.video.segments = [
      { startSeconds: 22, endSeconds: 40, observation: "Visible-only test." },
    ];
    expect(
      validateCaseSourceBinding(inspected, richRegistry(), loadRichArtifact),
    ).toEqual([]);

    inspected.video.durationSeconds = 30;
    expect(codes(inspected)).toContain("video-window");

    inspected.video.durationSeconds = 240;
    inspected.video.segments = [
      { startSeconds: 10, endSeconds: 15, observation: "Outside window." },
    ];
    expect(codes(inspected)).toContain("segment-window");
  });

  it("passes both fixtures against the baked fictional research root", () => {
    const baked = bakeResearchRoot(fixtureManifest(), fixtureDecision());
    const one = recent();
    one.sourceManifestBinding = baked.bindingFor("FIC-CAND-001");
    expect(
      validateCaseSourceBinding(one, baked.registry, baked.loadFile),
    ).toEqual([]);
    const two = classic();
    two.sourceManifestBinding = baked.bindingFor("FIC-CAND-002");
    expect(
      validateCaseSourceBinding(two, baked.registry, baked.loadFile),
    ).toEqual([]);
  });

  it("verifies the committed fixture bindings are already baked correctly", () => {
    const baked = bakeResearchRoot(fixtureManifest(), fixtureDecision());
    expect(recent().sourceManifestBinding).toEqual(
      baked.bindingFor("FIC-CAND-001"),
    );
    expect(classic().sourceManifestBinding).toEqual(
      baked.bindingFor("FIC-CAND-002"),
    );
  });

  it("fails a stale or missing registry binding", () => {
    const baked = bakeResearchRoot(fixtureManifest(), fixtureDecision());
    const stale = recent();
    stale.sourceManifestBinding = {
      ...baked.bindingFor("FIC-CAND-001"),
      manifestDigest: "1".repeat(64),
    };
    expect(
      validateCaseSourceBinding(stale, baked.registry, baked.loadFile).map(
        (i) => i.code,
      ),
    ).toContain("binding-unresolved");

    const missing = recent();
    missing.sourceManifestBinding = {
      ...baked.bindingFor("FIC-CAND-001"),
      manifestId: "FICTIONAL-SOURCE-9999-01-01-001",
    };
    expect(
      validateCaseSourceBinding(missing, baked.registry, baked.loadFile).map(
        (i) => i.code,
      ),
    ).toContain("binding-unresolved");
  });

  it("fails a stale entry digest and unknown candidate", () => {
    const baked = bakeResearchRoot(fixtureManifest(), fixtureDecision());
    const stale = recent();
    stale.sourceManifestBinding = {
      ...baked.bindingFor("FIC-CAND-001"),
      entryDigest: "2".repeat(64),
    };
    expect(
      validateCaseSourceBinding(stale, baked.registry, baked.loadFile).map(
        (i) => i.code,
      ),
    ).toContain("binding-entry-digest");

    const unknown = recent();
    unknown.sourceManifestBinding = {
      ...baked.bindingFor("FIC-CAND-001"),
      candidateId: "FIC-CAND-999",
    };
    expect(
      validateCaseSourceBinding(unknown, baked.registry, baked.loadFile).map(
        (i) => i.code,
      ),
    ).toContain("binding-entry-missing");
  });

  it("fails any drift between bound candidate facts and the frozen origin entry", () => {
    const baked = bakeResearchRoot(fixtureManifest(), fixtureDecision());
    const drifted = recent();
    drifted.sourceManifestBinding = baked.bindingFor("FIC-CAND-001");
    drifted.athlete.name = "Fictional Forward Renamed";
    expect(
      validateCaseSourceBinding(drifted, baked.registry, baked.loadFile).map(
        (i) => i.code,
      ),
    ).toContain("binding-fact-drift");

    const driftedUrl = recent();
    driftedUrl.sourceManifestBinding = baked.bindingFor("FIC-CAND-001");
    driftedUrl.video.canonicalUrl =
      "https://www.youtube.com/watch?v=fic-alpha-999";
    driftedUrl.video.fallbackUrl = driftedUrl.video.canonicalUrl;
    driftedUrl.sources[0].url = driftedUrl.video.canonicalUrl;
    expect(
      validateCaseSourceBinding(driftedUrl, baked.registry, baked.loadFile).map(
        (i) => i.code,
      ),
    ).toContain("binding-fact-drift");
  });

  it("allows only a later verified-to-external embed recheck without rewriting origin artifacts", () => {
    const candidateId = "CAND-NBA-ANKLE-2023-001";
    const degraded = richBoundRecord(candidateId);
    degraded.video.embedStatus = "external-link-only";
    degraded.video.embedCheckedAt = "2026-08-11T17:29:36Z";
    expect(
      validateCaseSourceBinding(
        degraded,
        richRegistry(),
        loadRichArtifact,
      ).filter((entry) => entry.path.startsWith("video.embed")),
    ).toEqual([]);

    const staleTime = richBoundRecord(candidateId);
    staleTime.video.embedStatus = "external-link-only";
    expect(
      validateCaseSourceBinding(
        staleTime,
        richRegistry(),
        loadRichArtifact,
      ).map((entry) => [entry.code, entry.path]),
    ).toContainEqual(["binding-fact-drift", "video.embedStatus"]);

    const unavailable = richBoundRecord(candidateId);
    unavailable.video.embedStatus = "unavailable";
    unavailable.video.embedCheckedAt = "2026-08-11T17:29:36Z";
    expect(
      validateCaseSourceBinding(
        unavailable,
        richRegistry(),
        loadRichArtifact,
      ).map((entry) => [entry.code, entry.path]),
    ).toContainEqual(["binding-fact-drift", "video.embedStatus"]);
  });

  it("requires classic proposer identity to match the frozen source-review decision", () => {
    const baked = bakeResearchRoot(fixtureManifest(), fixtureDecision());
    const record = classic();
    record.sourceManifestBinding = baked.bindingFor("FIC-CAND-002");
    record.classicProposedBy = "Fictional Impostor";
    expect(
      validateCaseSourceBinding(record, baked.registry, baked.loadFile).map(
        (i) => i.code,
      ),
    ).toContain("binding-classic-proposal");
  });

  it("gates secondary-only classics on documented-unavailable first-party evidence", () => {
    const withoutFirstParty = (record: any): void => {
      record.sources = record.sources.filter(
        (source: any) => source.type !== "diagnosis-first-party",
      );
      record.sources.push(
        {
          id: "src-fic-002-sec-a",
          type: "diagnosis-secondary",
          title: "Fictional secondary report A",
          publisher: "Fictional Metro Times",
          independenceGroup: "fictional-metro-times",
          originReportId: null,
          url: "https://metro-times.example.net/fic-002-a",
          publishedAt: "2014-03-04",
          accessedAt: "2026-08-01",
          supports: ["injury.confirmedDiagnosis", "general.confirmedUpdate"],
        },
        {
          id: "src-fic-002-sec-b",
          type: "diagnosis-secondary",
          title: "Fictional secondary report B",
          publisher: "Fictional National Sports Desk",
          independenceGroup: "fictional-national-desk",
          originReportId: null,
          url: "https://national-desk.example.net/fic-002-b",
          publishedAt: "2014-03-04",
          accessedAt: "2026-08-01",
          supports: ["injury.confirmedDiagnosis", "general.confirmedUpdate"],
        },
      );
    };

    const available = bakeResearchRoot(fixtureManifest(), fixtureDecision());
    const blocked = classic();
    blocked.sourceManifestBinding = available.bindingFor("FIC-CAND-002");
    withoutFirstParty(blocked);
    expect(
      validateCaseSourceBinding(
        blocked,
        available.registry,
        available.loadFile,
      ).map((i) => i.code),
    ).toContain("binding-first-party-unavailable-required");

    const manifest = fixtureManifest();
    const decision = fixtureDecision();
    manifest.entries[1].classicProposal.firstPartyDiagnosisEvidence =
      "documented-unavailable";
    decision.candidateDecisions[1].classicProposal.firstPartyDiagnosisEvidence =
      "documented-unavailable";
    const documented = bakeResearchRoot(manifest, decision);
    const allowed = classic();
    allowed.sourceManifestBinding = documented.bindingFor("FIC-CAND-002");
    withoutFirstParty(allowed);
    expect(
      validateCaseSourceBinding(
        allowed,
        documented.registry,
        documented.loadFile,
      ),
    ).toEqual([]);
  });
});
