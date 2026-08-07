import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import {
  EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
  parseSourceManifestRegistryBytes,
  resolveHistoricalSourceManifestBinding,
  resolveSourceManifestBinding,
  validateSourceManifestRegistry,
  validateSourceManifestRegistryAppend,
  validateSourceManifestRegistryArtifacts,
} from "../../src/lib/contracts/source-manifest-registry";
import {
  computeCandidateManifestEntryDigest,
  parseCandidateManifestBytes,
} from "../../src/lib/research/candidate-manifest";

const hex = (ch: string): string => ch.repeat(64);
const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );
const launchManifest = (): any =>
  loadFixture(
    "research/source-manifests/FICTIONAL-SOURCE-2026-08-06-001.v1.json",
  );
const launchDecision = (): any =>
  loadFixture(
    "research/reviews/source-batches/FICTIONAL-SOURCE-2026-08-06-001-source-review-decision.v1.json",
  );
const registryCodes = (registry: unknown): string[] =>
  validateSourceManifestRegistry(registry).map((issue) => issue.code);

interface BakedBatch {
  manifestBytes: string;
  manifestDigest: string;
  decisionBytes: string;
  decisionDigest: string;
  manifestPath: string;
  decisionPath: string;
}

function bakeBatch(manifest: any, decision: any): BakedBatch {
  const manifestBytes = canonicalJson(manifest);
  const manifestDigest = sha256Hex(manifestBytes);
  const decisionBytes = canonicalJson({ ...decision, manifestDigest });
  return {
    manifestBytes,
    manifestDigest,
    decisionBytes,
    decisionDigest: sha256Hex(decisionBytes),
    manifestPath: `research/source-manifests/${manifest.manifestId}.v1.json`,
    decisionPath: `research/reviews/source-batches/${manifest.manifestId}-source-review-decision.v1.json`,
  };
}

function registryEntryFor(
  manifest: any,
  baked: BakedBatch,
  createdAt: string,
  previousBytes: string,
  supersedes: any[] = [],
): any {
  return {
    manifestId: manifest.manifestId,
    manifestPath: baked.manifestPath,
    manifestDigest: baked.manifestDigest,
    sourceReviewDecisionPath: baked.decisionPath,
    sourceReviewDecisionDigest: baked.decisionDigest,
    sourcePolicyVersion: manifest.sourcePolicyVersion,
    batchType: manifest.batchType,
    period: manifest.period,
    createdAt,
    previousRegistryBytesDigest: sha256Hex(previousBytes),
    supersedes,
  };
}

function launchScenario() {
  const manifest = launchManifest();
  const decision = launchDecision();
  const baked = bakeBatch(manifest, decision);
  const entry = registryEntryFor(
    manifest,
    baked,
    "2026-08-06T01:00:00Z",
    EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
  );
  const registry = { schemaVersion: 1, entries: [entry] };
  const files = new Map<string, string>([
    [baked.manifestPath, baked.manifestBytes],
    [baked.decisionPath, baked.decisionBytes],
  ]);
  const loadFile = (path: string): Uint8Array => {
    const bytes = files.get(path);
    if (bytes === undefined) throw new Error(`missing artifact ${path}`);
    return Buffer.from(bytes);
  };
  const bindingFor = (candidateId: string) => ({
    candidateId,
    manifestId: manifest.manifestId,
    manifestDigest: baked.manifestDigest,
    entryDigest: sha256Hex(
      canonicalJson(
        manifest.entries.find((e: any) => e.candidateId === candidateId),
      ),
    ),
    sourceReviewDecisionDigest: baked.decisionDigest,
    sourcePolicyVersion: manifest.sourcePolicyVersion,
  });
  return {
    manifest,
    decision,
    baked,
    entry,
    registry,
    files,
    loadFile,
    bindingFor,
  };
}

function quarterlyManifest(candidate: Partial<any> = {}): any {
  return {
    schemaVersion: 1,
    manifestId: "FICTIONAL-SOURCE-2026-11-01-001",
    batchType: "quarterly",
    period: "2026-q4",
    sourcePolicyVersion: "source-policy-v1",
    entries: [
      {
        candidateId: "FIC-CAND-101",
        athleteName: "Fictional Center Gamma",
        teamName: "Lakeside Herons",
        opponentName: "Canyon Peak Rams",
        sportCode: "basketball",
        leagueCode: "nba",
        competitionCode: "nba-regular-season",
        season: "2026-27",
        eventDate: "2026-10-25",
        injuryCode: "achilles-rupture",
        confirmedDiagnosis: "Right Achilles tendon rupture (fictional case)",
        videoProvider: "youtube",
        canonicalVideoUrl: "https://www.youtube.com/watch?v=fic-gamma-101",
        uploaderName: "Lakeside Herons Official",
        uploaderProvenance: "official-team-channel",
        durationSeconds: 76,
        classicProposal: null,
        ...candidate,
      },
    ],
  };
}

function quarterlyDecision(manifestId: string, candidateId: string): any {
  return {
    schemaVersion: 1,
    decisionType: "source-batch-review",
    manifestId,
    manifestDigest: hex("0"),
    decisionStatus: "approved",
    sourcePolicyVersion: "source-policy-v1",
    reviewedBy: "Fictional Screener One",
    reviewedAt: "2026-11-01T00:00:00Z",
    candidateDecisions: [
      { candidateId, status: "accepted", classicProposal: null },
    ],
  };
}

function bakeCanonicalArtifacts(
  manifest: any,
  decision: any,
  previousBytes = EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
  prefix: any[] = [],
) {
  const manifestBytes = canonicalJson(manifest);
  const decisionBytes = canonicalJson(decision);
  const baked: BakedBatch = {
    manifestBytes,
    manifestDigest: sha256Hex(manifestBytes),
    decisionBytes,
    decisionDigest: sha256Hex(decisionBytes),
    manifestPath: `research/source-manifests/${manifest.manifestId}.v1.json`,
    decisionPath: `research/reviews/source-batches/${manifest.manifestId}-source-review-decision.v1.json`,
  };
  const entry = registryEntryFor(
    manifest,
    baked,
    manifest.generatedAt,
    previousBytes,
    manifest.supersedes,
  );
  const registry = { schemaVersion: 1, entries: [...prefix, entry] };
  const files = new Map<string, string>([
    [baked.manifestPath, baked.manifestBytes],
    [baked.decisionPath, baked.decisionBytes],
  ]);
  const loadFile = (path: string): Uint8Array => {
    const bytes = files.get(path);
    if (bytes === undefined) throw new Error(`missing artifact ${path}`);
    return Buffer.from(bytes);
  };
  return { manifest, decision, baked, entry, registry, files, loadFile };
}

function canonicalScenario(candidateOverrides: Record<string, unknown> = {}) {
  const manifestId = "FICTIONAL-SOURCE-2026-11-01-002";
  const reviewedBy = "Fictional Source Reviewer";
  const reviewedAt = "2026-11-01T00:00:00Z";
  const policyJsonDigest = hex("a");
  const policyMarkdownDigest = hex("b");
  const candidateSetDigest = hex("c");
  const verificationDigest = hex("d");
  const rootAuditDigest = hex("e");
  const decision = {
    schemaVersion: 1,
    manifestId,
    status: "approved-for-manifest",
    sourcePolicyJsonDigest: policyJsonDigest,
    sourcePolicyMarkdownDigest: policyMarkdownDigest,
    reviewedBy,
    reviewedAt,
    candidateSetDigest,
    classicProposalCandidateIds: [],
  };
  const decisionDigest = sha256Hex(canonicalJson(decision));
  const payload: any = {
    supersedes: null,
    sourceStatus: "source-verified",
    candidateId: "FIC-CAND-201",
    injuryCode: "acl",
    athleteDisplayName: "Fictional Guard Delta",
    teamAtEvent: "Harbor City Owls",
    season: "2026-27",
    eventDate: "2026-10-25",
    opponent: "Lakeside Herons",
    competition: "nba-regular-season",
    isClassic: false,
    classicReason: null,
    classicProposedBy: null,
    video: {
      provider: "nba",
      contentType: "in-game-injury-event",
      canonicalUrl: "https://www.nba.com/watch/video/fic-delta-201",
      title: "Fictional Guard Delta injury event",
      uploaderName: "Fictional Basketball League",
      uploaderProvenance: "league",
      channelUrl: "https://www.nba.com/watch",
      publishedAt: "2026-10-26",
      accessedAt: "2026-10-31",
      embedStatus: "external-link-only",
      embedCheckedAt: "2026-10-31T12:00:00Z",
      captionStatus: "unavailable",
      captionCheckedAt: "2026-10-31T12:00:00Z",
      provenanceBasis: "League-hosted event video",
      provenanceStatus: "verified",
      provenanceCheckedBy: "Fictional Source Reviewer",
      provenanceCheckedAt: "2026-10-31T12:00:00Z",
    },
    eventBinding: {
      status: "passed",
      rootAuditReference: "/candidates/0",
      basis: "Event, athlete, and opponent agree across sources",
    },
    diagnosisClaim: "Left ACL tear (fictional source-contract case)",
    diagnosisSources: [
      {
        type: "diagnosis-first-party",
        title: "Fictional team injury update",
        publisher: "Harbor City Owls",
        independenceGroup: "harbor-city-owls",
        originReportId: null,
        url: "https://example.com/owls/injury-update-delta",
        publishedAt: "2026-10-26",
        accessedAt: "2026-10-31",
      },
      null,
    ],
    eventSource: {
      title: "Fictional Owls at Herons gamebook",
      publisher: "Fictional Basketball League",
      url: "https://example.com/gamebooks/owls-herons-2026-10-25",
      publishedAt: "2026-10-25",
      accessedAt: "2026-10-31",
    },
    firstPartyAvailability: {
      status: "available",
      basis: null,
      checkedBy: "Fictional Source Reviewer",
      checkedAt: "2026-10-31T12:00:00Z",
      auditReference: "/candidates/0/firstPartyAvailability",
      officialLocationsChecked: [
        {
          url: "https://example.com/owls/injury-update-delta",
          outcome: "Team diagnosis statement located",
          observedAt: "2026-10-31T12:00:00Z",
        },
      ],
      archiveOrSearchChecks: [],
    },
    sourceReviewDecision: {
      digest: decisionDigest,
      reviewedBy,
      reviewedAt,
    },
    verification: {
      artifactDigest: verificationDigest,
      rootAuditDigest,
      rootAuditReference: "/candidates/0",
      rootAuditStatus: "passed",
      resultReferences: ["/results/0"],
    },
    ...candidateOverrides,
  };
  const candidate = {
    entryDigest: computeCandidateManifestEntryDigest(payload),
    ...payload,
  };
  const manifest = {
    schemaVersion: 1,
    manifestId,
    batchType: "quarterly",
    period: "2026-q4",
    sourcePolicyVersion: "source-policy-v2",
    cutoffDate: "2016-08-06",
    generatedAt: reviewedAt,
    sourceReview: {
      status: "approved-for-authoring",
      manifestId,
      sourcePolicyJsonDigest: policyJsonDigest,
      sourcePolicyMarkdownDigest: policyMarkdownDigest,
      reviewedBy,
      reviewedAt,
      candidateSetDigest,
      classicProposalCandidateIds: [],
    },
    sourceDigests: {
      aclCsvSha256: hex("1"),
      ankleSprainCsvSha256: hex("2"),
      achillesRuptureCsvSha256: hex("3"),
      verificationArtifactSha256: verificationDigest,
      rootAuditSha256: rootAuditDigest,
      sourcePolicyJsonSha256: policyJsonDigest,
      sourcePolicyMarkdownSha256: policyMarkdownDigest,
      sourceReviewDecisionSha256: decisionDigest,
    },
    counts: {
      byInjury: { acl: 1, "ankle-sprain": 0, "achilles-rupture": 0 },
      total: 1,
      recent: 1,
      classic: 0,
      byEmbedStatus: { verified: 0, externalLinkOnly: 1 },
    },
    supersedes: [],
    entries: [candidate],
  };
  return bakeCanonicalArtifacts(manifest, decision);
}

describe("source-manifest registry contract", () => {
  it("pins the initial exact canonical bytes and accepts the committed append state", () => {
    expect(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES).toBe(
      '{"entries":[],"schemaVersion":1}',
    );
    expect(canonicalJson({ entries: [], schemaVersion: 1 })).toBe(
      EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
    );
    const committedBytes = readFileSync(
      new URL(
        "../../research/source-manifest-registry.v1.json",
        import.meta.url,
      ),
    );
    const committed = parseSourceManifestRegistryBytes(committedBytes);
    expect(committed.issues).toEqual([]);
    expect(committed.registry).not.toBeNull();

    const entries = committed.registry?.entries ?? [];
    if (entries.length === 0) {
      expect(committedBytes.toString("utf8")).toBe(
        EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
      );
    } else {
      expect(entries[0]?.previousRegistryBytesDigest).toBe(
        sha256Hex(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES),
      );
    }
  });

  it("accepts the baked fictional launch registry and artifacts", () => {
    const { registry, loadFile } = launchScenario();
    expect(validateSourceManifestRegistry(registry)).toEqual([]);
    expect(
      validateSourceManifestRegistryArtifacts(registry as any, loadFile),
    ).toEqual([]);
  });

  it("accepts a rich canonical manifest bound to the real source-review decision", () => {
    const scenario = canonicalScenario();
    expect(parseCandidateManifestBytes(scenario.baked.manifestBytes)).toEqual({
      manifest: scenario.manifest,
      issues: [],
    });
    expect(validateSourceManifestRegistry(scenario.registry)).toEqual([]);
    expect(
      validateSourceManifestRegistryArtifacts(
        scenario.registry as any,
        scenario.loadFile,
      ),
    ).toEqual([]);
  });

  it("rejects rich manifest entry payload drift even when the registry digest is rebaked", () => {
    const scenario = canonicalScenario();
    const manifest = structuredClone(scenario.manifest);
    manifest.entries[0].video.title = "Tampered title after entry digest";
    const tampered = bakeCanonicalArtifacts(manifest, scenario.decision);

    expect(
      parseCandidateManifestBytes(tampered.baked.manifestBytes).issues.map(
        (entry) => entry.code,
      ),
    ).toContain("manifest-entry-digest");
    expect(
      validateSourceManifestRegistryArtifacts(
        tampered.registry as any,
        tampered.loadFile,
      ).map((entry) => entry.code),
    ).toContain("artifact-schema");
  });

  it("rejects a rebaked real decision that is not the decision bound by the rich manifest", () => {
    const scenario = canonicalScenario();
    const decision = {
      ...scenario.decision,
      reviewedBy: "Different Source Reviewer",
    };
    const drifted = bakeCanonicalArtifacts(scenario.manifest, decision);

    expect(
      parseCandidateManifestBytes(drifted.baked.manifestBytes).issues,
    ).toEqual([]);
    expect(
      validateSourceManifestRegistryArtifacts(
        drifted.registry as any,
        drifted.loadFile,
      ).map((entry) => entry.code),
    ).toContain("artifact-mismatch");
  });

  it("matches the committed fixture registry against recomputed digests", () => {
    const { entry } = launchScenario();
    const committed = loadFixture("research/source-manifest-registry.v1.json");
    expect(committed).toEqual({ schemaVersion: 1, entries: [entry] });
    expect(validateSourceManifestRegistry(committed)).toEqual([]);
  });

  it("rejects unknown and duplicate keys via strict canonical byte parsing", () => {
    const { registry } = launchScenario();
    const unknownKey = { ...registry, extra: 1 };
    expect(registryCodes(unknownKey)).toContain("registry-schema");

    const duplicated = canonicalJson(registry).replace(
      '"schemaVersion":1}',
      '"schemaVersion":1,"schemaVersion":1}',
    );
    const parsed = parseSourceManifestRegistryBytes(Buffer.from(duplicated));
    expect(parsed.registry).toBeNull();
    expect(parsed.issues.map((issue) => issue.code)).toContain(
      "registry-bytes",
    );

    const noncanonical = parseSourceManifestRegistryBytes(
      Buffer.from(JSON.stringify(registry, null, 2)),
    );
    expect(noncanonical.registry).toBeNull();
    expect(noncanonical.issues.map((issue) => issue.code)).toContain(
      "registry-bytes",
    );
  });

  it("rejects duplicate manifest IDs, paths, and digests", () => {
    const { registry, entry } = launchScenario();
    const dupId = {
      schemaVersion: 1,
      entries: [entry, { ...entry, createdAt: "2026-11-01T00:00:00Z" }],
    };
    expect(registryCodes(dupId)).toContain("registry-duplicate");

    const second = {
      ...entry,
      manifestId: "FICTIONAL-SOURCE-2026-11-01-001",
      createdAt: "2026-11-01T00:00:00Z",
      batchType: "quarterly",
      period: "2026-q4",
      previousRegistryBytesDigest: sha256Hex(canonicalJson(registry)),
    };
    expect(
      registryCodes({ schemaVersion: 1, entries: [entry, second] }),
    ).toContain("registry-duplicate");
  });

  it("rejects paths outside the two allowed source-batch directories", () => {
    const { entry } = launchScenario();
    const badManifestPath = {
      schemaVersion: 1,
      entries: [
        {
          ...entry,
          manifestPath: "tests/fixtures/research/source-manifests/x.json",
        },
      ],
    };
    expect(registryCodes(badManifestPath)).toContain("registry-path");
    const badDecisionPath = {
      schemaVersion: 1,
      entries: [{ ...entry, sourceReviewDecisionPath: "review/decision.json" }],
    };
    expect(registryCodes(badDecisionPath)).toContain("registry-path");
  });

  it("rejects noncanonical entry ordering and malformed periods", () => {
    const { entry, registry } = launchScenario();
    const later = {
      ...entry,
      manifestId: "FICTIONAL-SOURCE-2026-11-01-001",
      manifestPath:
        "research/source-manifests/FICTIONAL-SOURCE-2026-11-01-001.v1.json",
      sourceReviewDecisionPath:
        "research/reviews/source-batches/FICTIONAL-SOURCE-2026-11-01-001-source-review-decision.v1.json",
      manifestDigest: hex("1"),
      sourceReviewDecisionDigest: hex("2"),
      batchType: "quarterly",
      period: "2026-q4",
      createdAt: "2026-11-01T00:00:00Z",
      previousRegistryBytesDigest: sha256Hex(canonicalJson(registry)),
    };
    expect(
      registryCodes({ schemaVersion: 1, entries: [later, entry] }),
    ).toContain("registry-order");

    const badQuarterPeriod = {
      schemaVersion: 1,
      entries: [{ ...later, period: "2026-11-01" }],
    };
    expect(registryCodes(badQuarterPeriod)).toContain("registry-period");
    const badLaunchPeriod = {
      schemaVersion: 1,
      entries: [{ ...entry, period: "2026-q3" }],
    };
    expect(registryCodes(badLaunchPeriod)).toContain("registry-period");
  });

  it("rejects supersedes on launch/quarterly and requires it on corrections", () => {
    const { entry, registry } = launchScenario();
    const ref = {
      manifestId: entry.manifestId,
      candidateId: "FIC-CAND-001",
      entryDigest: hex("3"),
    };
    expect(
      registryCodes({
        schemaVersion: 1,
        entries: [{ ...entry, supersedes: [ref] }],
      }),
    ).toContain("registry-supersedes");

    const correction = {
      ...entry,
      manifestId: "FICTIONAL-SOURCE-2026-09-01-001",
      manifestPath:
        "research/source-manifests/FICTIONAL-SOURCE-2026-09-01-001.v1.json",
      sourceReviewDecisionPath:
        "research/reviews/source-batches/FICTIONAL-SOURCE-2026-09-01-001-source-review-decision.v1.json",
      manifestDigest: hex("1"),
      sourceReviewDecisionDigest: hex("2"),
      batchType: "correction",
      period: "2026-09-01",
      createdAt: "2026-09-01T00:00:00Z",
      previousRegistryBytesDigest: sha256Hex(canonicalJson(registry)),
      supersedes: [],
    };
    expect(
      registryCodes({ schemaVersion: 1, entries: [entry, correction] }),
    ).toContain("registry-supersedes");

    const unresolvable = {
      ...correction,
      supersedes: [{ ...ref, manifestId: "FICTIONAL-SOURCE-9999-01-01-001" }],
    };
    expect(
      registryCodes({ schemaVersion: 1, entries: [entry, unresolvable] }),
    ).toContain("registry-supersedes");
  });

  it("rejects a prior entry superseded more than once", () => {
    const { entry, registry } = launchScenario();
    const ref = {
      manifestId: entry.manifestId,
      candidateId: "FIC-CAND-001",
      entryDigest: hex("3"),
    };
    const correctionA = {
      ...entry,
      manifestId: "FICTIONAL-SOURCE-2026-09-01-001",
      manifestPath:
        "research/source-manifests/FICTIONAL-SOURCE-2026-09-01-001.v1.json",
      sourceReviewDecisionPath:
        "research/reviews/source-batches/FICTIONAL-SOURCE-2026-09-01-001-source-review-decision.v1.json",
      manifestDigest: hex("1"),
      sourceReviewDecisionDigest: hex("2"),
      batchType: "correction",
      period: "2026-09-01",
      createdAt: "2026-09-01T00:00:00Z",
      previousRegistryBytesDigest: sha256Hex(canonicalJson(registry)),
      supersedes: [ref],
    };
    const correctionB = {
      ...correctionA,
      manifestId: "FICTIONAL-SOURCE-2026-10-01-001",
      manifestPath:
        "research/source-manifests/FICTIONAL-SOURCE-2026-10-01-001.v1.json",
      sourceReviewDecisionPath:
        "research/reviews/source-batches/FICTIONAL-SOURCE-2026-10-01-001-source-review-decision.v1.json",
      manifestDigest: hex("4"),
      sourceReviewDecisionDigest: hex("5"),
      period: "2026-10-01",
      createdAt: "2026-10-01T00:00:00Z",
      previousRegistryBytesDigest: sha256Hex(
        canonicalJson({ schemaVersion: 1, entries: [entry, correctionA] }),
      ),
    };
    expect(
      registryCodes({
        schemaVersion: 1,
        entries: [entry, correctionA, correctionB],
      }),
    ).toContain("registry-supersedes-duplicate");
  });

  describe("append-only validation", () => {
    it("accepts the first append onto the exact canonical empty bytes", () => {
      const { registry } = launchScenario();
      expect(
        validateSourceManifestRegistryAppend(
          Buffer.from(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES),
          registry as any,
          sha256Hex(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES),
        ),
      ).toEqual([]);
    });

    it("rejects a wrong trusted previous digest", () => {
      const { registry } = launchScenario();
      expect(
        validateSourceManifestRegistryAppend(
          Buffer.from(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES),
          registry as any,
          hex("9"),
        ).map((issue) => issue.code),
      ).toContain("registry-append-prev-digest");
    });

    it("requires the previous entries to remain an exact prefix", () => {
      const { manifest, registry, entry } = launchScenario();
      const prevBytes = canonicalJson(registry);
      const q = quarterlyManifest();
      const qBaked = bakeBatch(
        q,
        quarterlyDecision(q.manifestId, "FIC-CAND-101"),
      );
      const qEntry = registryEntryFor(
        q,
        qBaked,
        "2026-11-01T00:00:00Z",
        prevBytes,
      );
      const mutated = {
        schemaVersion: 1,
        entries: [
          { ...entry, sourcePolicyVersion: "source-policy-v2" },
          qEntry,
        ],
      };
      expect(
        validateSourceManifestRegistryAppend(
          Buffer.from(prevBytes),
          mutated as any,
          sha256Hex(prevBytes),
        ).map((issue) => issue.code),
      ).toContain("registry-append-prefix");

      const valid = { schemaVersion: 1, entries: [entry, qEntry] };
      expect(
        validateSourceManifestRegistryAppend(
          Buffer.from(prevBytes),
          valid as any,
          sha256Hex(prevBytes),
        ),
      ).toEqual([]);
      void manifest;
    });

    it("rejects appending more than one terminal entry or deleting entries", () => {
      const { registry, entry } = launchScenario();
      const prevBytes = canonicalJson(registry);
      const qa = quarterlyManifest();
      const qaBaked = bakeBatch(
        qa,
        quarterlyDecision(qa.manifestId, "FIC-CAND-101"),
      );
      const qaEntry = registryEntryFor(
        qa,
        qaBaked,
        "2026-11-01T00:00:00Z",
        prevBytes,
      );
      const qb = quarterlyManifest({ candidateId: "FIC-CAND-102" });
      qb.manifestId = "FICTIONAL-SOURCE-2027-02-01-001";
      qb.period = "2027-q1";
      const qbBaked = bakeBatch(
        qb,
        quarterlyDecision(qb.manifestId, "FIC-CAND-102"),
      );
      const qbEntry = registryEntryFor(
        qb,
        qbBaked,
        "2027-02-01T00:00:00Z",
        canonicalJson({ schemaVersion: 1, entries: [entry, qaEntry] }),
      );
      expect(
        validateSourceManifestRegistryAppend(
          Buffer.from(prevBytes),
          { schemaVersion: 1, entries: [entry, qaEntry, qbEntry] } as any,
          sha256Hex(prevBytes),
        ).map((issue) => issue.code),
      ).toContain("registry-append-count");

      expect(
        validateSourceManifestRegistryAppend(
          Buffer.from(prevBytes),
          { schemaVersion: 1, entries: [entry] } as any,
          sha256Hex(prevBytes),
        ).map((issue) => issue.code),
      ).toContain("registry-append-count");
    });

    it("rejects reuse of an old manifest path or digest", () => {
      const { registry, entry } = launchScenario();
      const prevBytes = canonicalJson(registry);
      const reused = {
        ...entry,
        manifestId: "FICTIONAL-SOURCE-2026-11-01-001",
        batchType: "quarterly",
        period: "2026-q4",
        createdAt: "2026-11-01T00:00:00Z",
        previousRegistryBytesDigest: sha256Hex(prevBytes),
      };
      expect(
        validateSourceManifestRegistryAppend(
          Buffer.from(prevBytes),
          { schemaVersion: 1, entries: [entry, reused] } as any,
          sha256Hex(prevBytes),
        ).map((issue) => issue.code),
      ).toContain("registry-duplicate");
    });

    it("requires the appended terminal entry to anchor the prior bytes digest", () => {
      const { registry, entry } = launchScenario();
      const prevBytes = canonicalJson(registry);
      const q = quarterlyManifest();
      const qBaked = bakeBatch(
        q,
        quarterlyDecision(q.manifestId, "FIC-CAND-101"),
      );
      const qEntry = registryEntryFor(
        q,
        qBaked,
        "2026-11-01T00:00:00Z",
        prevBytes,
      );
      const detached = { ...qEntry, previousRegistryBytesDigest: hex("8") };
      expect(
        validateSourceManifestRegistryAppend(
          Buffer.from(prevBytes),
          { schemaVersion: 1, entries: [entry, detached] } as any,
          sha256Hex(prevBytes),
        ).map((issue) => issue.code),
      ).toContain("registry-append-terminal");
    });
  });

  describe("cross-batch active-set rules", () => {
    function withQuarterly(candidate: Partial<any>) {
      const scenario = launchScenario();
      const prevBytes = canonicalJson(scenario.registry);
      const q = quarterlyManifest(candidate);
      const qBaked = bakeBatch(
        q,
        quarterlyDecision(q.manifestId, q.entries[0].candidateId),
      );
      const qEntry = registryEntryFor(
        q,
        qBaked,
        "2026-11-01T00:00:00Z",
        prevBytes,
      );
      const registry = { schemaVersion: 1, entries: [scenario.entry, qEntry] };
      scenario.files.set(qBaked.manifestPath, qBaked.manifestBytes);
      scenario.files.set(qBaked.decisionPath, qBaked.decisionBytes);
      return { scenario, registry };
    }

    it("rejects a quarterly duplicate of an existing candidate ID", () => {
      const { scenario, registry } = withQuarterly({
        candidateId: "FIC-CAND-001",
      });
      expect(
        validateSourceManifestRegistryArtifacts(
          registry as any,
          scenario.loadFile,
        ).map((issue) => issue.code),
      ).toContain("active-duplicate-candidate");
    });

    it("applies active-set duplicate checks across legacy and rich artifacts", () => {
      const legacy = launchScenario();
      const previousBytes = canonicalJson(legacy.registry);
      const canonical = canonicalScenario({ candidateId: "FIC-CAND-001" });
      const rich = bakeCanonicalArtifacts(
        canonical.manifest,
        canonical.decision,
        previousBytes,
        [legacy.entry],
      );
      const files = new Map([...legacy.files, ...rich.files]);
      const loadFile = (path: string): Uint8Array => {
        const bytes = files.get(path);
        if (bytes === undefined) throw new Error(`missing artifact ${path}`);
        return Buffer.from(bytes);
      };

      expect(validateSourceManifestRegistry(rich.registry)).toEqual([]);
      expect(
        validateSourceManifestRegistryArtifacts(
          rich.registry as any,
          loadFile,
        ).map((entry) => entry.code),
      ).toContain("active-duplicate-candidate");
    });

    it("rejects a quarterly duplicate of an existing event identity", () => {
      const original = launchManifest().entries[0];
      const { scenario, registry } = withQuarterly({
        athleteName: original.athleteName,
        opponentName: original.opponentName,
        eventDate: original.eventDate,
        competitionCode: original.competitionCode,
      });
      expect(
        validateSourceManifestRegistryArtifacts(
          registry as any,
          scenario.loadFile,
        ).map((issue) => issue.code),
      ).toContain("active-duplicate-identity");
    });

    it("rejects a quarterly duplicate of an existing canonical video URL", () => {
      const original = launchManifest().entries[0];
      const { scenario, registry } = withQuarterly({
        canonicalVideoUrl: original.canonicalVideoUrl,
      });
      expect(
        validateSourceManifestRegistryArtifacts(
          registry as any,
          scenario.loadFile,
        ).map((issue) => issue.code),
      ).toContain("active-duplicate-video-url");
    });

    it("admits an exact correction replacement that reuses the superseded identity", () => {
      const scenario = launchScenario();
      const prevBytes = canonicalJson(scenario.registry);
      const corrected = structuredClone(scenario.manifest.entries[1]);
      corrected.uploaderName = "Fictional League Classics Channel (Corrected)";
      const correctionManifest = {
        schemaVersion: 1,
        manifestId: "FICTIONAL-SOURCE-2026-09-01-001",
        batchType: "correction",
        period: "2026-09-01",
        sourcePolicyVersion: "source-policy-v1",
        entries: [corrected],
      };
      const correctionDecision = {
        schemaVersion: 1,
        decisionType: "source-batch-review",
        manifestId: correctionManifest.manifestId,
        manifestDigest: hex("0"),
        decisionStatus: "approved",
        sourcePolicyVersion: "source-policy-v1",
        reviewedBy: "Fictional Screener One",
        reviewedAt: "2026-09-01T00:00:00Z",
        candidateDecisions: [
          {
            candidateId: "FIC-CAND-002",
            status: "accepted",
            classicProposal: {
              proposedBy: "Fictional Curator One",
              firstPartyDiagnosisEvidence: "available",
            },
          },
        ],
      };
      const cBaked = bakeBatch(correctionManifest, correctionDecision);
      const supersedes = [
        {
          manifestId: scenario.manifest.manifestId,
          candidateId: "FIC-CAND-002",
          entryDigest: scenario.bindingFor("FIC-CAND-002").entryDigest,
        },
      ];
      const cEntry = registryEntryFor(
        correctionManifest,
        cBaked,
        "2026-09-01T00:00:00Z",
        prevBytes,
        supersedes,
      );
      const registry = { schemaVersion: 1, entries: [scenario.entry, cEntry] };
      scenario.files.set(cBaked.manifestPath, cBaked.manifestBytes);
      scenario.files.set(cBaked.decisionPath, cBaked.decisionBytes);
      expect(
        validateSourceManifestRegistryArtifacts(
          registry as any,
          scenario.loadFile,
        ),
      ).toEqual([]);

      const oldBinding = scenario.bindingFor("FIC-CAND-002");
      expect(() =>
        resolveSourceManifestBinding(registry as any, oldBinding as any),
      ).toThrow();
      const historical = resolveHistoricalSourceManifestBinding(
        registry as any,
        oldBinding as any,
      );
      expect(historical.superseded).toBe(true);

      const activeStill = scenario.bindingFor("FIC-CAND-001");
      expect(
        resolveSourceManifestBinding(registry as any, activeStill as any)
          .superseded,
      ).toBe(false);

      const emptyCorrection = {
        ...correctionManifest,
        entries: [] as any[],
      };
      const emptyBaked = bakeBatch(emptyCorrection, correctionDecision);
      const emptyEntry = registryEntryFor(
        emptyCorrection,
        emptyBaked,
        "2026-09-01T00:00:00Z",
        prevBytes,
        supersedes,
      );
      const emptyRegistry = {
        schemaVersion: 1,
        entries: [scenario.entry, emptyEntry],
      };
      scenario.files.set(emptyBaked.manifestPath, emptyBaked.manifestBytes);
      scenario.files.set(emptyBaked.decisionPath, emptyBaked.decisionBytes);
      expect(
        validateSourceManifestRegistryArtifacts(
          emptyRegistry as any,
          scenario.loadFile,
        ).map((issue) => issue.code),
      ).toContain("correction-replacement");
    });

    it("rejects manifest or decision digest mismatches against artifacts", () => {
      const scenario = launchScenario();
      const tamperedLoad = (path: string): Uint8Array => {
        const bytes = scenario.loadFile(path);
        if (path === scenario.baked.manifestPath) {
          const parsed = JSON.parse(Buffer.from(bytes).toString("utf8"));
          parsed.entries[0].uploaderName = "Tampered Uploader";
          return Buffer.from(canonicalJson(parsed));
        }
        return bytes;
      };
      expect(
        validateSourceManifestRegistryArtifacts(
          scenario.registry as any,
          tamperedLoad,
        ).map((issue) => issue.code),
      ).toContain("artifact-digest");

      const missingLoad = (path: string): Uint8Array => {
        if (path === scenario.baked.decisionPath) {
          throw new Error("missing decision artifact");
        }
        return scenario.loadFile(path);
      };
      expect(
        validateSourceManifestRegistryArtifacts(
          scenario.registry as any,
          missingLoad,
        ).map((issue) => issue.code),
      ).toContain("artifact-missing");
    });
  });

  describe("binding resolution", () => {
    it("resolves active bindings and rejects stale digest tuples", () => {
      const { registry, bindingFor } = launchScenario();
      const resolved = resolveSourceManifestBinding(
        registry as any,
        bindingFor("FIC-CAND-001") as any,
      );
      expect(resolved.entry.manifestId).toBe("FICTIONAL-SOURCE-2026-08-06-001");
      expect(resolved.superseded).toBe(false);

      const stale = { ...bindingFor("FIC-CAND-001"), manifestDigest: hex("9") };
      expect(() =>
        resolveSourceManifestBinding(registry as any, stale as any),
      ).toThrow();
      expect(() =>
        resolveHistoricalSourceManifestBinding(registry as any, stale as any),
      ).toThrow();

      const wrongPolicy = {
        ...bindingFor("FIC-CAND-001"),
        sourcePolicyVersion: "source-policy-v0",
      };
      expect(() =>
        resolveSourceManifestBinding(registry as any, wrongPolicy as any),
      ).toThrow();
    });
  });
});
