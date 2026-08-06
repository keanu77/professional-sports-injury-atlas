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
