import { describe, expect, it } from "vitest";
import {
  computeResearchV2AngleId,
  computeResearchV2FactIdentityDigest,
  computeResearchV2FactPayloadDigest,
  computeResearchV2QualifiedSetDigest,
} from "../../src/lib/cases/follow-up-research-v2-digest";
import {
  projectFollowUpResearchV2Fact,
  validateFollowUpResearchV2Record,
} from "../../src/lib/cases/follow-up-research-v2-validation";
import {
  FOLLOW_UP_RESEARCH_V2_AUTHORITY_BINDING,
  RESEARCH_V2_SOURCE_CHANNELS,
  RESEARCH_V2_TERM_CONCEPTS,
  RESEARCH_V2_TIMEPOINTS,
  parseFollowUpResearchV2Bytes,
  type FollowUpResearchV2,
  type FollowUpResearchV2AuditUnit,
  type FollowUpResearchV2QualifiedFact,
  type FollowUpResearchV2Round,
  type FollowUpResearchV2SearchContext,
  type ResearchV2TermConcept,
} from "../../src/lib/contracts/case-follow-up-research-v2";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  type FollowUpKind,
} from "../../src/lib/contracts/case-follow-up";
import {
  canonicalJson,
  compareCodePoints,
} from "../../src/lib/contracts/canonical";

const CUTOFF = "2026-08-15";
const CASE_SLUG = "fictional-player-acl-2025";
const EMPTY_SET_SHA = computeResearchV2QualifiedSetDigest([]);
const SEARCH_CONTEXT: FollowUpResearchV2SearchContext = {
  athleteName: "Fictional Player",
  teamAtEvent: "Test Team",
  season: "2024-25",
  injuryTerms: ["ACL", "anterior cruciate ligament"],
};

const conceptText: Record<ResearchV2TermConcept, string> = {
  treatment: "treatment",
  rehab: "rehab",
  recovery: "recovery",
  program: "program",
  management: "management",
  cleared: "cleared",
  progression: "progression",
  surgery: "surgery",
  procedure: "procedure",
  operated: "operated",
  underwent: "underwent",
  repair: "repair",
  reconstruction: "reconstruction",
  "surgeon-name-branch": "surgeon doctor operating physician",
  injection: "injection",
  shot: "shot",
  prp: "PRP",
  "platelet-rich-plasma": "platelet-rich plasma",
  cortisone: "cortisone",
  corticosteroid: "corticosteroid",
  needling: "needling",
  return: "return",
  returned: "returned",
  debut: "debut",
  "first-game-back": "first game back",
  activated: "activated",
  "cleared-to-play": "cleared to play",
};

function buildRound(
  kind: FollowUpKind,
  roundNumber: number,
): FollowUpResearchV2Round {
  const concepts = [...RESEARCH_V2_TERM_CONCEPTS[kind]].sort(compareCodePoints);
  const queries = RESEARCH_V2_SOURCE_CHANNELS.map((sourceChannel, index) => {
    const timepoint =
      RESEARCH_V2_TIMEPOINTS[
        (index + roundNumber - 1) % RESEARCH_V2_TIMEPOINTS.length
      ]!;
    const contextTerms =
      roundNumber % 2 === 1
        ? ["Fictional Player", "Test Team", "ACL injury 2025", timepoint]
        : [timepoint, "2025", "Test Team", "Fictional Player", "ACL injury"];
    const query = [
      ...contextTerms,
      ...concepts.map((concept) => conceptText[concept]),
      sourceChannel,
      `round ${roundNumber} angle ${index + 1}`,
    ].join(" ");
    return {
      queryId: `query-${kind}-${roundNumber}-${index + 1}`,
      query,
      sourceChannel,
      timepoint,
      timepointApplicability: "applicable" as const,
      notApplicableReason: null,
      coveredTermConcepts: concepts,
      namedPersonTerms: [],
      verificationChannel: "web-open-original-page" as const,
      angleId: computeResearchV2AngleId({
        sourceChannel,
        timepoint,
        coveredTermConcepts: concepts,
      }),
      resultCode: "no-candidate" as const,
      resultReason: "No qualifying original-page candidate was found.",
      checkedBoundary:
        "Checked the named channel and exact chronology/term angle through its original-page results.",
    };
  });
  return {
    roundNumber,
    startedAt: `2026-08-15T${String(8 + roundNumber).padStart(2, "0")}:00:00Z`,
    completedAt: `2026-08-15T${String(8 + roundNumber).padStart(2, "0")}:30:00Z`,
    operatorId: "codex-synthetic-fixture",
    toolChannel: "web-search",
    queries,
    candidates: [],
    qualifiedFactDeltas: [],
    addedQualifiedFactCount: 0,
    correctedQualifiedFactCount: 0,
    newQualifiedFactIds: [],
    qualifiedSetBeforeSha256: EMPTY_SET_SHA,
    qualifiedSetAfterSha256: EMPTY_SET_SHA,
    rejectionOrNotFoundReasons: [
      "The recorded original-page boundary yielded no qualifying new fact.",
    ],
    checkedBoundary:
      "All six controlled source channels were checked with the recorded query angles.",
  };
}

function buildUnit(
  kind: FollowUpKind,
  roundCount = 2,
): FollowUpResearchV2AuditUnit {
  return {
    factKind: kind,
    baseline: {
      decision17Outcome: "not-found",
      qualifiedFacts: [],
      qualifiedSetSha256: EMPTY_SET_SHA,
    },
    rounds: Array.from({ length: roundCount }, (_, index) =>
      buildRound(kind, index + 1),
    ),
    finalQualifiedFacts: [],
    finalQualifiedSetSha256: EMPTY_SET_SHA,
    emptyResultReason:
      "No qualifying fact survived the complete synthetic search boundary; absence is not proof of non-occurrence.",
    surgeonBranch:
      kind === "surgery"
        ? {
            status: "no-surgeon-name-found",
            names: [],
            genericNoNameReason:
              "No original page named a surgeon, so the generic surgeon/doctor branch was recorded.",
          }
        : null,
  } as FollowUpResearchV2AuditUnit;
}

function buildLedger(): FollowUpResearchV2 {
  return {
    schemaVersion: "case-follow-up-research.v2",
    caseId: "CASE-TEST-2025-001",
    caseSlug: CASE_SLUG,
    searchContext: structuredClone(SEARCH_CONTEXT),
    caseClinicalDigest: "1".repeat(64),
    evidenceStatus: "exhaustive-audit",
    authorityBinding: { ...FOLLOW_UP_RESEARCH_V2_AUTHORITY_BINDING },
    sourcePolicyBinding: { ...FOLLOW_UP_SOURCE_POLICY_V10_BINDING },
    decision17BaselineBinding: {
      researchSchemaVersion: "case-follow-up-research.v1",
      researchPath: `research/follow-ups/decision-17/${CASE_SLUG}.json`,
      researchSha256: "2".repeat(64),
      sidecarSchemaVersion: "case-follow-up.v1",
      sidecarPath: `src/content/follow-ups/${CASE_SLUG}.json`,
      sidecarSha256: "3".repeat(64),
    },
    audits: {
      treatment: buildUnit("treatment") as Extract<
        FollowUpResearchV2AuditUnit,
        { factKind: "treatment" }
      >,
      surgery: buildUnit("surgery") as Extract<
        FollowUpResearchV2AuditUnit,
        { factKind: "surgery" }
      >,
      injection: buildUnit("injection") as Extract<
        FollowUpResearchV2AuditUnit,
        { factKind: "injection" }
      >,
      "actual-return": buildUnit("actual-return") as Extract<
        FollowUpResearchV2AuditUnit,
        { factKind: "actual-return" }
      >,
    },
  };
}

function makeFact(
  kind: FollowUpKind,
  itemId = `follow-up-fictional-${kind}-01`,
  evidenceId = `evidence-fictional-${kind}-01`,
): FollowUpResearchV2QualifiedFact {
  const fact = {
    evidenceId,
    itemId,
    kind,
    attributedStatement:
      kind === "actual-return"
        ? "Test Team's official game record states that the athlete played on 2026-08-01."
        : `Named Outlet reported the supported ${kind} detail.`,
    factDate: kind === "actual-return" ? "2026-08-01" : "2026-07-20",
    sourceTier:
      kind === "actual-return"
        ? ("team-or-league-official" as const)
        : ("mainstream-media-report" as const),
    tierBasis:
      kind === "actual-return"
        ? "The team-controlled game record directly records occurred participation."
        : "The opened original page is a named mainstream report.",
    source: {
      title: `Synthetic ${kind} original report`,
      publisher: kind === "actual-return" ? "Test Team" : "Named Outlet",
      account: "Named Reporter",
      canonicalUrl: `https://example.org/${kind}/original-report`,
      finalUrl: `https://example.org/${kind}/original-report`,
      publishedAt: "2026-08-02",
      accessedAt: "2026-08-14",
      medium:
        kind === "actual-return"
          ? ("game-or-participation-record" as const)
          : ("web-article" as const),
    },
    evidenceUse: "opened-original-page" as const,
    searchSnippetUsedAsEvidence: false as const,
    atomicProposition: `The athlete has one supported ${kind} fact.`,
    factIdentitySha256: "0".repeat(64),
  } satisfies FollowUpResearchV2QualifiedFact;
  fact.factIdentitySha256 = computeResearchV2FactIdentityDigest(
    CASE_SLUG,
    fact,
  );
  return fact;
}

function replayUnit(unit: FollowUpResearchV2AuditUnit): void {
  const state = new Map(
    unit.baseline.qualifiedFacts.map((fact) => [fact.itemId, fact] as const),
  );
  unit.baseline.qualifiedSetSha256 = computeResearchV2QualifiedSetDigest([
    ...state.values(),
  ]);
  for (const round of unit.rounds) {
    round.qualifiedSetBeforeSha256 = computeResearchV2QualifiedSetDigest([
      ...state.values(),
    ]);
    for (const delta of round.qualifiedFactDeltas) {
      state.set(delta.itemId, delta.fact);
    }
    round.addedQualifiedFactCount = round.qualifiedFactDeltas.filter(
      (delta) => delta.changeType === "added",
    ).length;
    round.correctedQualifiedFactCount = round.qualifiedFactDeltas.filter(
      (delta) => delta.changeType === "corrected",
    ).length;
    round.newQualifiedFactIds = round.qualifiedFactDeltas
      .filter((delta) => delta.changeType === "added")
      .map((delta) => delta.itemId);
    round.qualifiedSetAfterSha256 = computeResearchV2QualifiedSetDigest([
      ...state.values(),
    ]);
  }
  unit.finalQualifiedFacts = [...state.values()].sort((left, right) =>
    compareCodePoints(left.itemId, right.itemId),
  );
  unit.finalQualifiedSetSha256 = computeResearchV2QualifiedSetDigest(
    unit.finalQualifiedFacts,
  );
  unit.emptyResultReason = unit.finalQualifiedFacts.length
    ? null
    : "No qualifying fact survived the complete synthetic search boundary; absence is not proof of non-occurrence.";
}

function retainAddedFact(
  unit: FollowUpResearchV2AuditUnit,
  roundIndex: number,
  fact: FollowUpResearchV2QualifiedFact,
): void {
  const round = unit.rounds[roundIndex]!;
  const query = round.queries[0]!;
  query.resultCode = "retained-new";
  query.resultReason = "The opened original page supported one new fact.";
  round.candidates.push({
    candidateId: `candidate-${unit.factKind}-${round.roundNumber}-new`,
    queryId: query.queryId,
    accessStatus: "opened-original-page",
    source: { ...fact.source },
    disposition: "retained-new",
    dispositionReason: "The original page supports the retained atomic fact.",
    factItemIds: [fact.itemId],
    materialCandidate: true,
    namedMedicalPersons: [],
    searchSnippetUsedAsEvidence: false,
  });
  round.qualifiedFactDeltas.push({
    itemId: fact.itemId,
    changeType: "added",
    priorPayloadSha256: null,
    newPayloadSha256: computeResearchV2FactPayloadDigest(fact),
    correctionBasis: null,
    fact,
  });
  replayUnit(unit);
}

function revalidateBaselineWithFreshAccess(
  unit: FollowUpResearchV2AuditUnit,
  fact: FollowUpResearchV2QualifiedFact,
): void {
  unit.baseline.decision17Outcome = "source-ready";
  unit.baseline.qualifiedFacts = [fact];
  const query = unit.rounds[0]!.queries[1]!;
  query.resultCode = "retained-existing";
  query.resultReason = "The unchanged Decision 17 source was freshly reopened.";
  unit.rounds[0]!.candidates.push({
    candidateId: `candidate-${unit.factKind}-1-revalidated`,
    queryId: query.queryId,
    accessStatus: "opened-original-page",
    source: { ...fact.source, accessedAt: CUTOFF },
    disposition: "retained-existing",
    dispositionReason:
      "Fresh reopen confirmed unchanged source identity without rewriting the baseline payload.",
    factItemIds: [fact.itemId],
    materialCandidate: true,
    namedMedicalPersons: [],
    searchSnippetUsedAsEvidence: false,
  });
  replayUnit(unit);
}

function codes(value: FollowUpResearchV2): string[] {
  return validateFollowUpResearchV2Record(value, {
    auditCutoffDate: CUTOFF,
    expectedSearchContext: SEARCH_CONTEXT,
  }).issues.map((entry) => entry.code);
}

describe("case-follow-up-research.v2 exhaustive replay", () => {
  it("accepts canonical bytes and derives four terminal two-zero units", () => {
    const ledger = buildLedger();
    const result = validateFollowUpResearchV2Record(ledger, {
      auditCutoffDate: CUTOFF,
      expectedSearchContext: SEARCH_CONTEXT,
    });
    expect(result.issues).toEqual([]);
    expect(result.terminal).toBe(true);
    expect(result.resumeSafe).toBe(true);
    expect(
      FOLLOW_UP_KINDS.map((kind) => result.units[kind].terminalRoundNumbers),
    ).toEqual([
      [1, 2],
      [1, 2],
      [1, 2],
      [1, 2],
    ]);

    const bytes = canonicalJson(ledger);
    expect(parseFollowUpResearchV2Bytes(bytes).research).toEqual(ledger);
    expect(parseFollowUpResearchV2Bytes(`${bytes}\n`).research).toBeNull();
  });

  it("parses an empty-round partial ledger as resume-safe but nonterminal", () => {
    const ledger = buildLedger();
    ledger.audits.treatment.rounds = [];
    const result = validateFollowUpResearchV2Record(ledger, {
      auditCutoffDate: CUTOFF,
      expectedSearchContext: SEARCH_CONTEXT,
    });
    expect(result.terminal).toBe(false);
    expect(result.resumeSafe).toBe(true);
    expect(result.units.treatment.resumeSafe).toBe(true);
    expect(result.units.treatment.terminal).toBe(false);
  });

  it("fails closed without an immutable expected search context", () => {
    const result = validateFollowUpResearchV2Record(buildLedger(), {
      auditCutoffDate: CUTOFF,
    });
    expect(result.terminal).toBe(false);
    expect(result.issues.map((entry) => entry.code)).toContain(
      "follow-up-research-v2-search-context-expectation-missing",
    );
  });

  it("rejects ledger search-context drift from the governed case", () => {
    const ledger = buildLedger();
    ledger.searchContext.teamAtEvent = "Another Team";
    expect(codes(ledger)).toEqual(
      expect.arrayContaining([
        "follow-up-research-v2-search-context-binding",
        "follow-up-research-v2-query-context-missing",
      ]),
    );
  });

  it.each([
    ["athlete", "Fictional Player", "Unbound Player"],
    ["team", "Test Team", "Unbound Team"],
    ["injury", "ACL injury", "unrelated condition"],
    ["season", "2025", "unknown-season"],
    ["timepoint", "operation-announcement", "unbound chronology"],
  ])(
    "rejects an applicable query missing its %s context",
    (_component, token, replacement) => {
      const ledger = buildLedger();
      const query = ledger.audits.treatment.rounds[0]!.queries[1]!;
      query.query = query.query.replace(token, replacement);
      expect(codes(ledger)).toContain(
        "follow-up-research-v2-query-context-missing",
      );
    },
  );

  it("does not treat cosmetic suffix changes as a second context formulation", () => {
    const ledger = buildLedger();
    for (const query of ledger.audits.treatment.rounds[1]!.queries) {
      query.query = query.query.replace(
        `${query.timepoint} 2025 Test Team Fictional Player ACL injury`,
        `Fictional Player Test Team ACL injury 2025 ${query.timepoint}`,
      );
    }
    expect(codes(ledger)).toContain(
      "follow-up-research-v2-context-formulation-incomplete",
    );
  });

  it("counts a not-applicable query only for its timepoint", () => {
    const missingChannel = buildLedger();
    for (const round of missingChannel.audits.injection.rounds) {
      const query = round.queries.find(
        (entry) => entry.sourceChannel === "named-mainstream-original-page",
      )!;
      query.timepointApplicability = "not-applicable";
      query.notApplicableReason =
        "This synthetic chronology is logically inapplicable.";
      query.verificationChannel = "documented-not-applicable";
      query.resultCode = "not-applicable";
    }
    expect(codes(missingChannel)).toContain(
      "follow-up-research-v2-coverage-incomplete",
    );

    const missingConcept = buildLedger();
    for (const round of missingConcept.audits.injection.rounds) {
      for (const [index, query] of round.queries.entries()) {
        if (index === 0) {
          query.timepointApplicability = "not-applicable";
          query.notApplicableReason =
            "This synthetic chronology is logically inapplicable.";
          query.verificationChannel = "documented-not-applicable";
          query.resultCode = "not-applicable";
        } else {
          query.coveredTermConcepts = query.coveredTermConcepts.filter(
            (concept) => concept !== "needling",
          );
          query.query = query.query.replace("needling", "");
          query.angleId = computeResearchV2AngleId(query);
        }
      }
    }
    expect(codes(missingConcept)).toContain(
      "follow-up-research-v2-coverage-incomplete",
    );
  });

  it("allows a fresh baseline reopen without changing historical accessedAt", () => {
    const ledger = buildLedger();
    const fact = makeFact("treatment");
    revalidateBaselineWithFreshAccess(ledger.audits.treatment, fact);
    const result = validateFollowUpResearchV2Record(ledger, {
      auditCutoffDate: CUTOFF,
      expectedSearchContext: SEARCH_CONTEXT,
      expectedBaselineFacts: {
        treatment: [projectFollowUpResearchV2Fact(fact)],
      },
    });
    expect(result.issues).toEqual([]);
    expect(result.terminal).toBe(true);
    expect(
      result.units.treatment.finalQualifiedFacts[0]!.source.accessedAt,
    ).toBe("2026-08-14");
  });

  it("requires two zero rounds after an added fact", () => {
    const ledger = buildLedger();
    ledger.audits.treatment.rounds.push(buildRound("treatment", 3));
    retainAddedFact(ledger.audits.treatment, 0, makeFact("treatment"));
    const result = validateFollowUpResearchV2Record(ledger, {
      auditCutoffDate: CUTOFF,
      expectedSearchContext: SEARCH_CONTEXT,
    });
    expect(result.issues).toEqual([]);
    expect(result.units.treatment.terminalRoundNumbers).toEqual([2, 3]);
  });

  it("requires two zero rounds after a corrected payload and preserves identity", () => {
    const ledger = buildLedger();
    ledger.audits.treatment.rounds.push(buildRound("treatment", 3));
    const original = makeFact("treatment");
    revalidateBaselineWithFreshAccess(ledger.audits.treatment, original);
    const corrected = structuredClone(original);
    corrected.attributedStatement =
      "Named Outlet corrected the wording of the same supported treatment detail.";
    corrected.source.accessedAt = CUTOFF;
    const round = ledger.audits.treatment.rounds[0]!;
    const query = round.queries[0]!;
    query.resultCode = "retained-changed";
    query.resultReason =
      "The opened page supports a genuine wording correction.";
    round.candidates.push({
      candidateId: "candidate-treatment-1-corrected",
      queryId: query.queryId,
      accessStatus: "opened-original-page",
      source: { ...corrected.source },
      disposition: "retained-changed",
      dispositionReason: "Original-page metadata supports the correction.",
      factItemIds: [corrected.itemId],
      materialCandidate: true,
      namedMedicalPersons: [],
      searchSnippetUsedAsEvidence: false,
    });
    round.qualifiedFactDeltas.push({
      itemId: corrected.itemId,
      changeType: "corrected",
      priorPayloadSha256: computeResearchV2FactPayloadDigest(original),
      newPayloadSha256: computeResearchV2FactPayloadDigest(corrected),
      correctionBasis:
        "The same atomic proposition/date retained its ID while supported wording changed.",
      fact: corrected,
    });
    replayUnit(ledger.audits.treatment);
    const result = validateFollowUpResearchV2Record(ledger, {
      auditCutoffDate: CUTOFF,
      expectedSearchContext: SEARCH_CONTEXT,
    });
    expect(result.issues).toEqual([]);
    expect(result.units.treatment.terminalRoundNumbers).toEqual([2, 3]);
  });

  it.each([
    [
      "one-zero",
      (ledger: FollowUpResearchV2) => ledger.audits.treatment.rounds.pop(),
    ],
    [
      "zero-new",
      (ledger: FollowUpResearchV2) =>
        retainAddedFact(ledger.audits.treatment, 1, makeFact("treatment")),
    ],
    [
      "new-zero",
      (ledger: FollowUpResearchV2) =>
        retainAddedFact(ledger.audits.treatment, 0, makeFact("treatment")),
    ],
  ])("rejects a nonterminal %s sequence", (_name, mutate) => {
    const ledger = buildLedger();
    mutate(ledger);
    expect(codes(ledger)).toContain("follow-up-research-v2-not-terminal");
  });

  it("rejects duplicate exact queries and canonical angles", () => {
    const ledger = buildLedger();
    ledger.audits.injection.rounds[1]!.queries[0] = structuredClone(
      ledger.audits.injection.rounds[0]!.queries[0]!,
    );
    expect(codes(ledger)).toEqual(
      expect.arrayContaining([
        "follow-up-research-v2-duplicate-query-id",
        "follow-up-research-v2-duplicate-query",
        "follow-up-research-v2-duplicate-angle",
      ]),
    );
  });

  it("rejects claimed synonym concepts absent from the exact query", () => {
    const ledger = buildLedger();
    ledger.audits.injection.rounds[0]!.queries[0]!.query =
      ledger.audits.injection.rounds[0]!.queries[0]!.query.replace("PRP", "");
    expect(codes(ledger)).toContain(
      "follow-up-research-v2-query-concept-not-in-query",
    );
  });

  it("rejects missing source, timepoint, and injection-term coverage", () => {
    const ledger = buildLedger();
    for (const round of ledger.audits.injection.rounds) {
      for (const query of round.queries) {
        query.coveredTermConcepts = query.coveredTermConcepts.filter(
          (concept) => concept !== "needling",
        );
        query.angleId = computeResearchV2AngleId(query);
        if (query.sourceChannel === "named-mainstream-original-page") {
          query.sourceChannel = "team-official-site-newsroom";
          query.angleId = computeResearchV2AngleId(query);
        }
        if (query.timepoint === "actual-return") {
          query.timepoint = "injury-time";
          query.angleId = computeResearchV2AngleId(query);
        }
      }
    }
    expect(codes(ledger)).toContain(
      "follow-up-research-v2-coverage-incomplete",
    );
  });

  it("rejects an unresolved material original-page candidate", () => {
    const ledger = buildLedger();
    const round = ledger.audits.surgery.rounds[0]!;
    const query = round.queries[0]!;
    query.resultCode = "unresolved-access";
    query.resultReason = "The material original candidate could not be opened.";
    round.candidates.push({
      candidateId: "candidate-surgery-1-unresolved",
      queryId: query.queryId,
      accessStatus: "unresolved-material-candidate",
      discoveredUrl: "https://example.org/material-candidate",
      titleHint: "Potential original surgery report",
      disposition: "unresolved-access",
      dispositionReason: "Original page access remained unresolved.",
      factItemIds: [],
      materialCandidate: true,
      searchSnippetUsedAsEvidence: false,
    });
    const result = validateFollowUpResearchV2Record(ledger, {
      auditCutoffDate: CUTOFF,
      expectedSearchContext: SEARCH_CONTEXT,
    });
    expect(result.terminal).toBe(false);
    expect(result.resumeSafe).toBe(false);
    expect(result.units.surgery.terminal).toBe(false);
  });

  it.each(["retained-existing", "corroboration"] as const)(
    "rejects %s candidates that reference an unknown fact ID",
    (disposition) => {
      const ledger = buildLedger();
      const round = ledger.audits.treatment.rounds[0]!;
      const query = round.queries[0]!;
      const fact = makeFact("treatment");
      query.resultCode = disposition;
      query.resultReason = "Synthetic referential-integrity adversarial row.";
      round.candidates.push({
        candidateId: `candidate-treatment-unknown-${disposition}`,
        queryId: query.queryId,
        accessStatus: "opened-original-page",
        source: { ...fact.source },
        disposition,
        dispositionReason: "This candidate intentionally names an unknown ID.",
        factItemIds: ["follow-up-unknown-treatment-01"],
        materialCandidate: true,
        namedMedicalPersons: [],
        searchSnippetUsedAsEvidence: false,
      });
      expect(codes(ledger)).toContain(
        disposition === "retained-existing"
          ? "follow-up-research-v2-retained-existing-reference"
          : "follow-up-research-v2-corroboration-reference",
      );
    },
  );

  it("rejects a retained-new candidate without its one-to-one delta", () => {
    const ledger = buildLedger();
    const round = ledger.audits.treatment.rounds[0]!;
    const query = round.queries[0]!;
    const fact = makeFact("treatment");
    query.resultCode = "retained-new";
    query.resultReason = "Synthetic hidden retained candidate.";
    round.candidates.push({
      candidateId: "candidate-treatment-hidden-new",
      queryId: query.queryId,
      accessStatus: "opened-original-page",
      source: { ...fact.source },
      disposition: "retained-new",
      dispositionReason: "No matching delta is intentionally present.",
      factItemIds: [fact.itemId],
      materialCandidate: true,
      namedMedicalPersons: [],
      searchSnippetUsedAsEvidence: false,
    });
    expect(codes(ledger)).toContain(
      "follow-up-research-v2-retained-candidate-delta",
    );
  });

  it("rejects a hidden retained candidate behind a different query result", () => {
    const ledger = buildLedger();
    ledger.audits.treatment.rounds.push(buildRound("treatment", 3));
    retainAddedFact(ledger.audits.treatment, 0, makeFact("treatment"));
    ledger.audits.treatment.rounds[0]!.queries[0]!.resultCode =
      "rejected-with-reason";
    expect(codes(ledger)).toContain("follow-up-research-v2-query-result");
  });

  it("requires baseline revalidation to use a retained-existing query result", () => {
    const ledger = buildLedger();
    const fact = makeFact("treatment");
    revalidateBaselineWithFreshAccess(ledger.audits.treatment, fact);
    ledger.audits.treatment.rounds[0]!.queries[1]!.resultCode = "corroboration";
    expect(codes(ledger)).toContain("follow-up-research-v2-query-result");
  });

  it("rejects retained-existing source-identity substitution", () => {
    const ledger = buildLedger();
    const fact = makeFact("treatment");
    revalidateBaselineWithFreshAccess(ledger.audits.treatment, fact);
    const candidate = ledger.audits.treatment.rounds[0]!.candidates[0]!;
    if (candidate.accessStatus !== "opened-original-page") {
      throw new Error("expected opened candidate");
    }
    candidate.source.title = "A different source identity";
    expect(codes(ledger)).toContain(
      "follow-up-research-v2-retained-existing-reference",
    );
  });

  it("rejects a baseline candidate whose access date is not strictly fresh", () => {
    const ledger = buildLedger();
    const fact = makeFact("treatment");
    revalidateBaselineWithFreshAccess(ledger.audits.treatment, fact);
    const candidate = ledger.audits.treatment.rounds[0]!.candidates[0]!;
    if (candidate.accessStatus !== "opened-original-page") {
      throw new Error("expected opened candidate");
    }
    candidate.source.accessedAt = fact.source.accessedAt;
    expect(codes(ledger)).toEqual(
      expect.arrayContaining([
        "follow-up-research-v2-retained-existing-reference",
        "follow-up-research-v2-baseline-not-revalidated",
      ]),
    );
  });

  it("rejects a non-original-page channel as baseline revalidation", () => {
    const ledger = buildLedger();
    const fact = makeFact("treatment");
    revalidateBaselineWithFreshAccess(ledger.audits.treatment, fact);
    ledger.audits.treatment.rounds[0]!.queries[1]!.verificationChannel =
      "documented-not-applicable";
    expect(codes(ledger)).toEqual(
      expect.arrayContaining([
        "follow-up-research-v2-baseline-revalidation-channel",
        "follow-up-research-v2-baseline-not-revalidated",
      ]),
    );
  });

  it("rejects duplicate candidate support or a multi-item retained delta", () => {
    const duplicate = buildLedger();
    duplicate.audits.treatment.rounds.push(buildRound("treatment", 3));
    retainAddedFact(duplicate.audits.treatment, 0, makeFact("treatment"));
    const original = duplicate.audits.treatment.rounds[0]!.candidates[0]!;
    duplicate.audits.treatment.rounds[0]!.candidates.push({
      ...structuredClone(original),
      candidateId: "candidate-treatment-duplicate-support",
    });
    expect(codes(duplicate)).toContain(
      "follow-up-research-v2-delta-original-page",
    );

    const multiple = buildLedger();
    multiple.audits.treatment.rounds.push(buildRound("treatment", 3));
    retainAddedFact(multiple.audits.treatment, 0, makeFact("treatment"));
    multiple.audits.treatment.rounds[0]!.candidates[0]!.factItemIds.push(
      "follow-up-unrelated-treatment-02",
    );
    expect(codes(multiple)).toEqual(
      expect.arrayContaining([
        "follow-up-research-v2-delta-original-page",
        "follow-up-research-v2-retained-candidate-delta",
      ]),
    );
  });

  it("rejects local-baseline verification and tooling at the schema boundary", () => {
    const ledger = buildLedger();
    (
      ledger.audits.treatment.rounds[0]!.queries[0] as unknown as {
        verificationChannel: string;
      }
    ).verificationChannel = "local-baseline-revalidation";
    (
      ledger.audits.treatment.rounds[0] as unknown as { toolChannel: string }
    ).toolChannel = "local-baseline-revalidation";
    expect(codes(ledger)).toContain("follow-up-research-v2-schema");
  });

  it("rejects non-monotonic round chronology", () => {
    const ledger = buildLedger();
    ledger.audits.treatment.rounds[1]!.startedAt = "2026-08-15T08:00:00Z";
    expect(codes(ledger)).toContain("follow-up-research-v2-round-time-order");
  });

  it("derives the surgery name branch from opened candidates", () => {
    const ledger = buildLedger();
    ledger.audits.surgery.rounds.push(buildRound("surgery", 3));
    retainAddedFact(ledger.audits.surgery, 0, makeFact("surgery"));
    const candidate = ledger.audits.surgery.rounds[0]!.candidates[0]!;
    if (candidate.accessStatus !== "opened-original-page") {
      throw new Error("expected opened candidate");
    }
    candidate.namedMedicalPersons = [{ name: "Dr. Example", role: "surgeon" }];
    expect(codes(ledger)).toEqual(
      expect.arrayContaining([
        "follow-up-research-v2-surgeon-branch-derived",
        "follow-up-research-v2-surgeon-name-follow-up",
      ]),
    );

    ledger.audits.surgery.surgeonBranch = {
      status: "named-surgeon-found",
      names: [{ name: "Dr. Example", firstDiscoveredRound: 1 }],
      genericNoNameReason: null,
    };
    const laterQuery = ledger.audits.surgery.rounds[1]!.queries[0]!;
    laterQuery.query = `${laterQuery.query} Dr. Example`;
    laterQuery.namedPersonTerms = ["Dr. Example"];
    expect(codes(ledger)).toEqual([]);
  });

  it("rejects snippet evidence at the strict schema boundary", () => {
    const ledger = buildLedger();
    ledger.audits.treatment.rounds.push(buildRound("treatment", 3));
    retainAddedFact(ledger.audits.treatment, 0, makeFact("treatment"));
    (
      ledger.audits.treatment.rounds[0]!.candidates[0] as any
    ).searchSnippetUsedAsEvidence = true;
    expect(codes(ledger)).toContain("follow-up-research-v2-schema");
  });

  it("rejects set-digest drift and a final undeclared fact", () => {
    const digestDrift = buildLedger();
    digestDrift.audits.treatment.rounds[0]!.qualifiedSetAfterSha256 =
      "f".repeat(64);
    expect(codes(digestDrift)).toContain(
      "follow-up-research-v2-set-after-digest",
    );

    const undeclared = buildLedger();
    undeclared.audits.treatment.finalQualifiedFacts = [makeFact("treatment")];
    undeclared.audits.treatment.finalQualifiedSetSha256 =
      computeResearchV2QualifiedSetDigest(
        undeclared.audits.treatment.finalQualifiedFacts,
      );
    undeclared.audits.treatment.emptyResultReason = null;
    expect(codes(undeclared)).toContain(
      "follow-up-research-v2-final-facts-mismatch",
    );
  });

  it("rejects a trailing round after the first terminal pair", () => {
    const ledger = buildLedger();
    ledger.audits.treatment.rounds.push(buildRound("treatment", 3));
    replayUnit(ledger.audits.treatment);
    expect(codes(ledger)).toContain("follow-up-research-v2-trailing-round");
  });

  it("rejects predictive actual-return wording despite official tier/date", () => {
    const ledger = buildLedger();
    ledger.audits["actual-return"].rounds.push(buildRound("actual-return", 3));
    const fact = makeFact("actual-return");
    fact.attributedStatement =
      "Test Team projected an expected return on 2026-08-01.";
    retainAddedFact(ledger.audits["actual-return"], 0, fact);
    expect(codes(ledger)).toContain(
      "follow-up-research-v2-actual-return-prediction",
    );
  });

  it("rejects duplicate item/evidence IDs across audit units", () => {
    const ledger = buildLedger();
    ledger.audits.treatment.rounds.push(buildRound("treatment", 3));
    ledger.audits.surgery.rounds.push(buildRound("surgery", 3));
    retainAddedFact(
      ledger.audits.treatment,
      0,
      makeFact("treatment", "follow-up-shared-01", "evidence-shared-01"),
    );
    retainAddedFact(
      ledger.audits.surgery,
      0,
      makeFact("surgery", "follow-up-shared-01", "evidence-shared-01"),
    );
    expect(codes(ledger)).toEqual(
      expect.arrayContaining([
        "follow-up-research-v2-global-duplicate-item-id",
        "follow-up-research-v2-global-duplicate-evidence-id",
      ]),
    );
  });
});
