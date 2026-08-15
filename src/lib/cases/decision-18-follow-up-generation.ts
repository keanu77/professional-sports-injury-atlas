/** Pure replay/build step from reviewed research records to governed artifacts. */

import { computeCaseContentDigest } from "./digest";
import {
  computeFollowUpItemPayloadDigest,
  computeFollowUpDraftDigest,
} from "./follow-up-digest";
import {
  computeResearchV2AngleId,
  computeResearchV2FactIdentityDigest,
  computeResearchV2FactPayloadDigest,
  computeResearchV2QualifiedSetDigest,
} from "./follow-up-research-v2-digest";
import {
  expectedFollowUpResearchV2SearchContextForCase,
  validateFollowUpResearchV2Record,
} from "./follow-up-research-v2-validation";
import { validateCaseFollowUpRecord } from "./follow-up-loader";
import { validateDecision18ProjectedSidecar } from "./decision-18-transitional-follow-up-loader";
import type { InjuryCase } from "../contracts/case";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_VALIDATION_CUTOFF_DATE,
  type CaseFollowUp,
  type FollowUpItem,
  type FollowUpKind,
  type FollowUpResearch,
  type FollowUpResearchFact,
  type FollowUpSourcePolicyBinding,
} from "../contracts/case-follow-up";
import {
  FOLLOW_UP_RESEARCH_V2_AUTHORITY_BINDING,
  RESEARCH_V2_SOURCE_CHANNELS,
  RESEARCH_V2_TERM_CONCEPTS,
  RESEARCH_V2_TIMEPOINTS,
  type FollowUpResearchV2,
  type FollowUpResearchV2AuditUnit,
  type FollowUpResearchV2QualifiedFact,
  type FollowUpResearchV2Round,
  type ResearchV2TermConcept,
} from "../contracts/case-follow-up-research-v2";
import {
  DECISION_18_FOLLOW_UP_RESEARCH_RECORD_SCHEMA_VERSION,
  type Decision18FollowUpResearchRecord,
} from "../contracts/decision-18-follow-up-research-record";
import {
  canonicalJson,
  compareCodePoints,
  issue,
  type ValidationIssue,
} from "../contracts/canonical";
import type { Decision18FollowUpBatchId } from "../contracts/decision-18-follow-up-batch";

const QUERY_CONCEPT_TEXT: Record<ResearchV2TermConcept, string> = {
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

const QUERY_TIMEPOINT_TEXT = {
  "injury-time": "injury",
  "operation-announcement": "surgery",
  "rehabilitation-progression": "rehab",
  "actual-return": "return",
} as const;

const QUERY_SOURCE_TEXT = {
  "team-official-site-newsroom": "official team newsroom",
  "nba-official-news-announcements": "site:nba.com/news official announcement",
  "nba-official-injury-reports": "site:official.nba.com injury report",
  "nba-official-game-participation": "site:nba.com/game box score",
  "press-conference-formal-statement": "press conference official statement",
  "named-mainstream-original-page":
    "Associated Press ESPN Reuters original report",
} as const;

/**
 * Creates not-run query slots only. It copies D17 wording as the baseline
 * identity and never records a candidate/result or claims exhaustion.
 */
export function buildDecision18ResearchRecordScaffold(options: {
  auditCutoffDate: string;
  batchId: Decision18FollowUpBatchId;
  caseRecord: InjuryCase;
  decision17Research: FollowUpResearch;
}): Decision18FollowUpResearchRecord {
  const context = expectedFollowUpResearchV2SearchContextForCase(
    options.caseRecord,
  );
  const audit = (factKind: FollowUpKind) => {
    const concepts = [...RESEARCH_V2_TERM_CONCEPTS[factKind]].sort(
      compareCodePoints,
    );
    const initialQueryPlan = Array.from(
      { length: RESEARCH_V2_SOURCE_CHANNELS.length },
      (_, index) => {
        const sourceChannel =
          RESEARCH_V2_SOURCE_CHANNELS[
            index % RESEARCH_V2_SOURCE_CHANNELS.length
          ]!;
        const timepoint =
          RESEARCH_V2_TIMEPOINTS[index % RESEARCH_V2_TIMEPOINTS.length]!;
        const contextTerms =
          index < 3
            ? [
                context.athleteName,
                context.teamAtEvent,
                context.injuryTerms[0]!,
                context.season,
                QUERY_TIMEPOINT_TEXT[timepoint],
              ]
            : [
                QUERY_TIMEPOINT_TEXT[timepoint],
                context.season,
                context.injuryTerms[0]!,
                context.teamAtEvent,
                context.athleteName,
              ];
        return {
          planSlotId: `plan-${factKind}-${index + 1}`,
          suggestedQuery: [
            ...contextTerms,
            ...concepts.map((concept) => QUERY_CONCEPT_TEXT[concept]),
            QUERY_SOURCE_TEXT[sourceChannel],
          ].join(" "),
          sourceChannel,
          timepoint,
          coveredTermConcepts: concepts,
          requiredVerification: "open-original-page" as const,
          planningState: "unexecuted-at-scaffold-time" as const,
        };
      },
    );
    const d17Audit = options.decision17Research.categories[factKind];
    return {
      factKind,
      baselineFactIdentities: d17Audit.facts
        .map((fact) => ({
          itemId: fact.itemId,
          atomicProposition: fact.attributedStatement,
        }))
        .sort((left, right) => compareCodePoints(left.itemId, right.itemId)),
      initialQueryPlan,
      rounds: [],
      emptyResultReason:
        d17Audit.facts.length === 0
          ? (d17Audit.notFoundReason ??
            "Decision 18 exhaustive research has not started; no absence claim is made.")
          : null,
    };
  };
  return {
    schemaVersion: DECISION_18_FOLLOW_UP_RESEARCH_RECORD_SCHEMA_VERSION,
    batchId: options.batchId,
    caseSlug: options.caseRecord.slug,
    auditCutoffDate: options.auditCutoffDate,
    audits: {
      treatment: audit(
        "treatment",
      ) as Decision18FollowUpResearchRecord["audits"]["treatment"],
      surgery: {
        ...audit("surgery"),
        factKind: "surgery",
        noNamedMedicalPersonReason:
          "Decision 18 surgeon or treating-physician name search has not started.",
      },
      injection: audit(
        "injection",
      ) as Decision18FollowUpResearchRecord["audits"]["injection"],
      "actual-return": audit(
        "actual-return",
      ) as Decision18FollowUpResearchRecord["audits"]["actual-return"],
    },
  };
}

export interface Decision18CaseGenerationOptions {
  auditCutoffDate: string;
  batchId: Decision18FollowUpBatchId;
  caseRecord: InjuryCase;
  decision17Research: FollowUpResearch;
  decision17ResearchSha256: string;
  decision17Sidecar: CaseFollowUp;
  decision17SidecarSha256: string;
  expectedPolicyBinding: FollowUpSourcePolicyBinding;
  researchRecord: Decision18FollowUpResearchRecord;
}

export interface Decision18CaseGenerationResult {
  draftDigest: string | null;
  issues: ValidationIssue[];
  ledger: FollowUpResearchV2 | null;
  ledgerText: string | null;
  sidecar: CaseFollowUp | null;
  sidecarText: string | null;
}

function prefixedIssues(
  prefix: string,
  issues: readonly ValidationIssue[],
): ValidationIssue[] {
  return issues.map((entry) => ({
    ...entry,
    path: entry.path === "" ? prefix : `${prefix}.${entry.path}`,
  }));
}

function factsByKind(
  research: FollowUpResearch,
): Record<FollowUpKind, readonly FollowUpResearchFact[]> {
  return {
    treatment: research.categories.treatment.facts,
    surgery: research.categories.surgery.facts,
    injection: research.categories.injection.facts,
    "actual-return": research.categories["actual-return"].facts,
  };
}

function enrichFact(
  caseSlug: string,
  fact: Omit<FollowUpResearchV2QualifiedFact, "factIdentitySha256">,
): FollowUpResearchV2QualifiedFact {
  return {
    ...fact,
    source: { ...fact.source },
    factIdentitySha256: computeResearchV2FactIdentityDigest(caseSlug, fact),
  };
}

function buildBaselineFacts(
  caseSlug: string,
  factKind: FollowUpKind,
  decision17Facts: readonly FollowUpResearchFact[],
  identities: readonly { itemId: string; atomicProposition: string }[],
  issues: ValidationIssue[],
): FollowUpResearchV2QualifiedFact[] {
  const sortedFacts = [...decision17Facts].sort((left, right) =>
    compareCodePoints(left.itemId, right.itemId),
  );
  const sortedIdentities = [...identities].sort((left, right) =>
    compareCodePoints(left.itemId, right.itemId),
  );
  if (
    sortedFacts.length !== sortedIdentities.length ||
    sortedFacts.some(
      (fact, index) => fact.itemId !== sortedIdentities[index]?.itemId,
    )
  ) {
    issues.push(
      issue(
        "decision18-generation-baseline-identity-coverage",
        `audits.${factKind}.baselineFactIdentities`,
        "every immutable Decision 17 fact requires exactly one explicit atomic proposition",
      ),
    );
    return [];
  }
  return sortedFacts.map((fact, index) =>
    enrichFact(caseSlug, {
      ...fact,
      source: { ...fact.source },
      atomicProposition: sortedIdentities[index]!.atomicProposition,
    }),
  );
}

function deriveSurgeonBranch(
  rounds: readonly FollowUpResearchV2Round[],
  noNameReason: string,
): Extract<
  FollowUpResearchV2AuditUnit,
  { factKind: "surgery" }
>["surgeonBranch"] {
  const discovered = new Map<
    string,
    { name: string; firstDiscoveredRound: number }
  >();
  for (const round of rounds) {
    for (const candidate of round.candidates) {
      if (candidate.accessStatus !== "opened-original-page") continue;
      for (const person of candidate.namedMedicalPersons) {
        const key = person.name.normalize("NFC").toLocaleLowerCase("en");
        if (!discovered.has(key)) {
          discovered.set(key, {
            name: person.name,
            firstDiscoveredRound: round.roundNumber,
          });
        }
      }
    }
  }
  const names = [...discovered.values()].sort((left, right) =>
    compareCodePoints(
      left.name.normalize("NFC").toLocaleLowerCase("en"),
      right.name.normalize("NFC").toLocaleLowerCase("en"),
    ),
  );
  return names.length === 0
    ? {
        status: "no-surgeon-name-found",
        names: [],
        genericNoNameReason: noNameReason,
      }
    : {
        status: "named-surgeon-found",
        names,
        genericNoNameReason: null,
      };
}

function buildAuditUnit(
  caseSlug: string,
  factKind: FollowUpKind,
  decision17: FollowUpResearch,
  researchRecord: Decision18FollowUpResearchRecord,
  issues: ValidationIssue[],
): FollowUpResearchV2AuditUnit {
  const sourceAudit = researchRecord.audits[factKind];
  const baselineFacts = buildBaselineFacts(
    caseSlug,
    factKind,
    decision17.categories[factKind].facts,
    sourceAudit.baselineFactIdentities,
    issues,
  );
  const state = new Map(
    baselineFacts.map((fact) => [fact.itemId, fact] as const),
  );
  const rounds: FollowUpResearchV2Round[] = sourceAudit.rounds.map(
    (sourceRound, roundIndex) => {
      const before = computeResearchV2QualifiedSetDigest([...state.values()]);
      const deltas = sourceRound.qualifiedFactChanges.map((change) => {
        const fact = enrichFact(caseSlug, change.fact);
        const prior = state.get(fact.itemId);
        const delta = {
          itemId: fact.itemId,
          changeType: change.changeType,
          priorPayloadSha256:
            change.changeType === "corrected" && prior !== undefined
              ? computeResearchV2FactPayloadDigest(prior)
              : null,
          newPayloadSha256: computeResearchV2FactPayloadDigest(fact),
          correctionBasis: change.correctionBasis,
          fact,
        };
        state.set(fact.itemId, fact);
        return delta;
      });
      const addedIds = deltas
        .filter((delta) => delta.changeType === "added")
        .map((delta) => delta.itemId);
      return {
        roundNumber: roundIndex + 1,
        startedAt: sourceRound.startedAt,
        completedAt: sourceRound.completedAt,
        operatorId: sourceRound.operatorId,
        toolChannel: sourceRound.toolChannel,
        queries: sourceRound.queries.map((query) => ({
          ...query,
          coveredTermConcepts: [...query.coveredTermConcepts],
          namedPersonTerms: [...query.namedPersonTerms],
          angleId: computeResearchV2AngleId(query),
        })),
        candidates: structuredClone(sourceRound.candidates),
        qualifiedFactDeltas: deltas,
        addedQualifiedFactCount: addedIds.length,
        correctedQualifiedFactCount: deltas.length - addedIds.length,
        newQualifiedFactIds: addedIds,
        qualifiedSetBeforeSha256: before,
        qualifiedSetAfterSha256: computeResearchV2QualifiedSetDigest([
          ...state.values(),
        ]),
        rejectionOrNotFoundReasons: [...sourceRound.rejectionOrNotFoundReasons],
        checkedBoundary: sourceRound.checkedBoundary,
      } satisfies FollowUpResearchV2Round;
    },
  );
  const finalFacts = [...state.values()].sort((left, right) =>
    compareCodePoints(left.itemId, right.itemId),
  );
  const common = {
    factKind,
    baseline: {
      decision17Outcome: decision17.categories[factKind].outcome,
      qualifiedFacts: baselineFacts,
      qualifiedSetSha256: computeResearchV2QualifiedSetDigest(baselineFacts),
    },
    rounds,
    finalQualifiedFacts: finalFacts,
    finalQualifiedSetSha256: computeResearchV2QualifiedSetDigest(finalFacts),
    emptyResultReason: sourceAudit.emptyResultReason,
  };
  if (factKind === "surgery") {
    return {
      ...common,
      factKind,
      surgeonBranch: deriveSurgeonBranch(
        rounds,
        researchRecord.audits.surgery.noNamedMedicalPersonReason,
      ),
    } as Extract<FollowUpResearchV2AuditUnit, { factKind: "surgery" }>;
  }
  return { ...common, factKind, surgeonBranch: null } as Exclude<
    FollowUpResearchV2AuditUnit,
    { factKind: "surgery" }
  >;
}

/** Exact pending sidecar projection from a replay-validated final fact set. */
export function buildDecision18ProjectedSidecar(
  caseRecord: InjuryCase,
  decision17Sidecar: CaseFollowUp,
  projectedFactsByKind: Record<FollowUpKind, FollowUpResearchFact[]>,
  policy: FollowUpSourcePolicyBinding,
): CaseFollowUp {
  const categories = Object.fromEntries(
    FOLLOW_UP_KINDS.map((kind) => [
      kind,
      projectedFactsByKind[kind].map((fact) => {
        const { finalUrl: _finalUrl, ...source } = fact.source;
        const item = {
          id: fact.itemId,
          kind: fact.kind,
          attributedStatement: fact.attributedStatement,
          factDate: fact.factDate,
          sourceTier: fact.sourceTier,
          source,
          tierBasis: fact.tierBasis,
          researchEvidenceId: fact.evidenceId,
          sourcePolicyBinding: { ...policy },
          itemPayloadDigest: "0".repeat(64),
          review: {
            status: "pending-owner-signoff" as const,
            reviewedPayloadDigest: "0".repeat(64),
          },
        } satisfies FollowUpItem;
        item.itemPayloadDigest = computeFollowUpItemPayloadDigest(item);
        item.review.reviewedPayloadDigest = item.itemPayloadDigest;
        return item;
      }),
    ]),
  ) as CaseFollowUp["categories"];
  return {
    schemaVersion: "case-follow-up.v1",
    caseId: caseRecord.id,
    caseClinicalDigest: computeCaseContentDigest(caseRecord),
    sourcePolicyBinding: { ...policy },
    legacyDiagnosisProjection: {
      ...decision17Sidecar.legacyDiagnosisProjection,
    },
    categories,
  };
}

/** Builds canonical v2 ledger and v1 sidecar bytes without writing files. */
export function generateDecision18CaseArtifacts(
  options: Decision18CaseGenerationOptions,
): Decision18CaseGenerationResult {
  const issues: ValidationIssue[] = [];
  if (
    options.researchRecord.caseSlug !== options.caseRecord.slug ||
    options.researchRecord.batchId !== options.batchId ||
    options.researchRecord.auditCutoffDate !== options.auditCutoffDate
  ) {
    issues.push(
      issue(
        "decision18-generation-record-binding",
        "researchRecord",
        "research record must bind the requested batch, case slug, and cutoff",
      ),
    );
  }
  issues.push(
    ...prefixedIssues(
      "decision17Sidecar",
      validateCaseFollowUpRecord(options.decision17Sidecar, {
        caseRecord: options.caseRecord,
        research: options.decision17Research,
        expectedPolicyBinding: options.expectedPolicyBinding,
        maximumFactDate: FOLLOW_UP_VALIDATION_CUTOFF_DATE,
      }),
    ),
  );

  let audits: FollowUpResearchV2["audits"];
  try {
    audits = {
      treatment: buildAuditUnit(
        options.caseRecord.slug,
        "treatment",
        options.decision17Research,
        options.researchRecord,
        issues,
      ) as FollowUpResearchV2["audits"]["treatment"],
      surgery: buildAuditUnit(
        options.caseRecord.slug,
        "surgery",
        options.decision17Research,
        options.researchRecord,
        issues,
      ) as FollowUpResearchV2["audits"]["surgery"],
      injection: buildAuditUnit(
        options.caseRecord.slug,
        "injection",
        options.decision17Research,
        options.researchRecord,
        issues,
      ) as FollowUpResearchV2["audits"]["injection"],
      "actual-return": buildAuditUnit(
        options.caseRecord.slug,
        "actual-return",
        options.decision17Research,
        options.researchRecord,
        issues,
      ) as FollowUpResearchV2["audits"]["actual-return"],
    };
  } catch (error) {
    issues.push(
      issue(
        "decision18-generation-replay",
        "audits",
        error instanceof Error ? error.message : String(error),
      ),
    );
    return {
      draftDigest: null,
      issues,
      ledger: null,
      ledgerText: null,
      sidecar: null,
      sidecarText: null,
    };
  }
  const ledger: FollowUpResearchV2 = {
    schemaVersion: "case-follow-up-research.v2",
    caseId: options.caseRecord.id,
    caseSlug: options.caseRecord.slug,
    searchContext: expectedFollowUpResearchV2SearchContextForCase(
      options.caseRecord,
    ),
    caseClinicalDigest: computeCaseContentDigest(options.caseRecord),
    evidenceStatus: "exhaustive-audit",
    authorityBinding: { ...FOLLOW_UP_RESEARCH_V2_AUTHORITY_BINDING },
    sourcePolicyBinding: { ...options.expectedPolicyBinding },
    decision17BaselineBinding: {
      researchSchemaVersion: "case-follow-up-research.v1",
      researchPath: `research/follow-ups/decision-17/${options.caseRecord.slug}.json`,
      researchSha256: options.decision17ResearchSha256,
      sidecarSchemaVersion: "case-follow-up.v1",
      sidecarPath: `src/content/follow-ups/${options.caseRecord.slug}.json`,
      sidecarSha256: options.decision17SidecarSha256,
    },
    audits,
  };
  const validation = validateFollowUpResearchV2Record(ledger, {
    auditCutoffDate: options.auditCutoffDate,
    expectedBaselineFacts: factsByKind(options.decision17Research),
    expectedCaseClinicalDigest: computeCaseContentDigest(options.caseRecord),
    expectedCaseId: options.caseRecord.id,
    expectedCaseSlug: options.caseRecord.slug,
    expectedDecision17ResearchSha256: options.decision17ResearchSha256,
    expectedDecision17SidecarSha256: options.decision17SidecarSha256,
    expectedPolicyBinding: options.expectedPolicyBinding,
    expectedSearchContext: expectedFollowUpResearchV2SearchContextForCase(
      options.caseRecord,
    ),
  });
  issues.push(...prefixedIssues("ledger", validation.issues));
  const sidecar = buildDecision18ProjectedSidecar(
    options.caseRecord,
    options.decision17Sidecar,
    validation.projectedFactsByKind,
    options.expectedPolicyBinding,
  );
  issues.push(
    ...prefixedIssues(
      "sidecar",
      validateDecision18ProjectedSidecar(sidecar, {
        auditCutoffDate: options.auditCutoffDate,
        caseRecord: options.caseRecord,
        expectedPolicyBinding: options.expectedPolicyBinding,
        projectedFactsByKind: validation.projectedFactsByKind,
      }),
    ),
  );
  if (issues.length > 0 || !validation.terminal) {
    return {
      draftDigest: null,
      issues,
      ledger: null,
      ledgerText: null,
      sidecar: null,
      sidecarText: null,
    };
  }
  return {
    draftDigest: computeFollowUpDraftDigest(sidecar),
    issues,
    ledger,
    ledgerText: canonicalJson(ledger),
    sidecar,
    sidecarText: canonicalJson(sidecar),
  };
}
