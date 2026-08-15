/** Pure replay validation for Decision 18 exhaustive follow-up ledgers. */

import type { InjuryCase } from "../contracts/case";
import type {
  FollowUpKind,
  FollowUpResearchFact,
  FollowUpSourcePolicyBinding,
} from "../contracts/case-follow-up";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
} from "../contracts/case-follow-up";
import {
  FOLLOW_UP_RESEARCH_V2_AUTHORITY_BINDING,
  RESEARCH_V2_SOURCE_CHANNELS,
  RESEARCH_V2_TERM_CONCEPTS,
  RESEARCH_V2_TIMEPOINTS,
  followUpResearchV2Schema,
  type FollowUpResearchV2,
  type FollowUpResearchV2AuditUnit,
  type FollowUpResearchV2AuthorityBinding,
  type FollowUpResearchV2Candidate,
  type FollowUpResearchV2QualifiedFact,
  type FollowUpResearchV2Query,
  type FollowUpResearchV2SearchContext,
  type ResearchV2SourceChannel,
  type ResearchV2TermConcept,
  type ResearchV2Timepoint,
} from "../contracts/case-follow-up-research-v2";
import {
  ISO_DATE_RE,
  UTC_TIMESTAMP_RE,
  canonicalJson,
  compareCodePoints,
  issue,
  type ValidationIssue,
} from "../contracts/canonical";
import {
  computeResearchV2AngleId,
  computeResearchV2FactIdentityDigest,
  computeResearchV2FactPayloadDigest,
  computeResearchV2QualifiedSetDigest,
  computeResearchV2RoundAngleTupleDigest,
} from "./follow-up-research-v2-digest";

export interface FollowUpResearchV2ValidationOptions {
  /** Exact UTC calendar date derived from the already-validated batch receipt. */
  auditCutoffDate: string;
  expectedAuthorityBinding?: FollowUpResearchV2AuthorityBinding;
  expectedCaseId?: string;
  expectedCaseSlug?: string;
  expectedCaseClinicalDigest?: string;
  expectedPolicyBinding?: FollowUpSourcePolicyBinding;
  /** Exact D17 facts, keyed by kind, before v2-only identity fields are added. */
  expectedBaselineFacts?: Partial<
    Record<FollowUpKind, readonly FollowUpResearchFact[]>
  >;
  expectedDecision17ResearchSha256?: string;
  expectedDecision17SidecarSha256?: string;
  /** Exact case-derived search identity and permitted injury aliases. */
  expectedSearchContext?: FollowUpResearchV2SearchContext;
}

export interface FollowUpResearchV2CoverageResult {
  missingSourceChannels: ResearchV2SourceChannel[];
  missingTimepoints: ResearchV2Timepoint[];
  missingTermConcepts: ResearchV2TermConcept[];
}

export interface FollowUpResearchV2UnitValidation {
  factKind: FollowUpKind;
  /** True when every completed round is replayable and only more work remains. */
  resumeSafe: boolean;
  terminal: boolean;
  terminalRoundNumbers: [number, number] | null;
  consecutiveNoNew: number;
  coverage: FollowUpResearchV2CoverageResult;
  finalQualifiedFacts: FollowUpResearchV2QualifiedFact[];
}

export interface FollowUpResearchV2ValidationResult {
  research: FollowUpResearchV2 | null;
  issues: ValidationIssue[];
  units: Record<FollowUpKind, FollowUpResearchV2UnitValidation>;
  resumeSafe: boolean;
  terminal: boolean;
  projectedFactsByKind: Record<FollowUpKind, FollowUpResearchFact[]>;
}

const emptyProjectedFacts = (): Record<
  FollowUpKind,
  FollowUpResearchFact[]
> => ({
  treatment: [],
  surgery: [],
  injection: [],
  "actual-return": [],
});

const emptyUnitResult = (
  factKind: FollowUpKind,
): FollowUpResearchV2UnitValidation => ({
  factKind,
  resumeSafe: true,
  terminal: false,
  terminalRoundNumbers: null,
  consecutiveNoNew: 0,
  coverage: {
    missingSourceChannels: [...RESEARCH_V2_SOURCE_CHANNELS],
    missingTimepoints: [...RESEARCH_V2_TIMEPOINTS],
    missingTermConcepts: [...RESEARCH_V2_TERM_CONCEPTS[factKind]],
  },
  finalQualifiedFacts: [],
});

const emptyUnits = (): Record<
  FollowUpKind,
  FollowUpResearchV2UnitValidation
> => ({
  treatment: emptyUnitResult("treatment"),
  surgery: emptyUnitResult("surgery"),
  injection: emptyUnitResult("injection"),
  "actual-return": emptyUnitResult("actual-return"),
});

function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month! - 1 &&
    date.getUTCDate() === day
  );
}

function isRealUtcTimestamp(value: string): boolean {
  if (!UTC_TIMESTAMP_RE.test(value)) return false;
  const parsed = new Date(value);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().replace(".000Z", "Z") === value
  );
}

function sameCanonical(left: unknown, right: unknown): boolean {
  try {
    return canonicalJson(left) === canonicalJson(right);
  } catch {
    return false;
  }
}

function sameSourceIdentityAllowingFreshAccess(
  baseline: FollowUpResearchV2QualifiedFact["source"],
  reopened: FollowUpResearchV2QualifiedFact["source"],
): boolean {
  const { accessedAt: _baselineAccessedAt, ...baselineIdentity } = baseline;
  const { accessedAt: _reopenedAccessedAt, ...reopenedIdentity } = reopened;
  return sameCanonical(baselineIdentity, reopenedIdentity);
}

const ACTUAL_RETURN_PREDICTION_RE =
  /\b(?:expected|projected|target|estimated|recommended)\b|預計|預估|目標|建議|可望/iu;

const ORIGINAL_PAGE_VERIFICATION_CHANNELS = new Set([
  "web-open-original-page",
  "browser-open-original-page",
  "direct-open-original-page",
] as const);

const CONCEPT_QUERY_MATCHERS: Record<ResearchV2TermConcept, RegExp> = {
  treatment: /\btreat(?:ment|ed|ing)?\b/u,
  rehab: /\b(?:rehab|rehabilitat(?:e|ed|es|ing|ion))\b/u,
  recovery: /\brecover(?:y|ed|ing)?\b/u,
  program: /\bprogram(?:s|me|mes)?\b/u,
  management: /\bmanag(?:e|ed|es|ing|ement)\b/u,
  cleared: /\bclear(?:ed|ance)\b/u,
  progression: /\bprogress(?:ed|es|ing|ion)\b/u,
  surgery: /\bsurger(?:y|ies|ical)\b/u,
  procedure: /\bprocedur(?:e|es)\b/u,
  operated: /\boperat(?:e|ed|es|ing|ion)\b/u,
  underwent: /\b(?:underwent|undergo(?:es|ing|ne)?)\b/u,
  repair: /\brepair(?:ed|s|ing)?\b/u,
  reconstruction: /\breconstruct(?:ed|ing|ion|ive)?\b/u,
  "surgeon-name-branch":
    /\b(?:surgeon|doctor|physician|operating[\s-]+physician|orthop(?:aedic|edic))\b/u,
  injection: /\binject(?:ed|ing|ion|ions)?\b/u,
  shot: /\bshots?\b/u,
  prp: /\bprp\b/u,
  "platelet-rich-plasma": /\bplatelet[\s-]+rich[\s-]+plasma\b/u,
  cortisone: /\bcortisone\b/u,
  corticosteroid: /\bcorticosteroids?\b/u,
  needling: /\bneedl(?:e|ed|es|ing)\b/u,
  return: /\breturn\b/u,
  returned: /\breturned\b/u,
  debut: /\bdebut(?:ed|s)?\b/u,
  "first-game-back": /\bfirst[\s-]+game[\s-]+back\b/u,
  activated: /\bactivat(?:e|ed|es|ing|ion)\b/u,
  "cleared-to-play": /\bclear(?:ed|ance)?[\s-]+to[\s-]+play\b/u,
};

const INJURY_SEARCH_TERMS_BY_CODE: Readonly<Record<string, readonly string[]>> =
  Object.freeze({
    acl: Object.freeze(["ACL", "anterior cruciate ligament"]),
    "achilles-rupture": Object.freeze([
      "Achilles injury",
      "Achilles rupture",
      "ruptured Achilles",
    ]),
    "ankle-sprain": Object.freeze([
      "ankle injury",
      "ankle sprain",
      "sprained ankle",
    ]),
  });

const TIMEPOINT_QUERY_TERMS: Readonly<
  Record<ResearchV2Timepoint, readonly string[]>
> = Object.freeze({
  "injury-time": Object.freeze([
    "injury",
    "injured",
    "hurt",
    "diagnosis",
    "diagnosed",
  ]),
  "operation-announcement": Object.freeze([
    "operation",
    "surgery",
    "procedure",
    "operated",
    "underwent",
    "repair",
    "reconstruction",
  ]),
  "rehabilitation-progression": Object.freeze([
    "rehab",
    "rehabilitation",
    "recovery",
    "recovering",
    "progress",
    "progression",
    "treatment",
    "management",
  ]),
  "actual-return": Object.freeze([
    "return",
    "returned",
    "debut",
    "first game back",
    "activated",
    "cleared to play",
    "played",
    "appearance",
  ]),
});

function unique<T>(values: readonly T[]): boolean {
  return new Set(values).size === values.length;
}

function sorted<T extends string>(values: Iterable<T>): T[] {
  return [...values].sort(compareCodePoints);
}

function normalizedSearchText(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("en");
}

function firstMatchingTerm(
  normalizedQuery: string,
  terms: readonly string[],
): { index: number; term: string } | null {
  let selected: { index: number; term: string } | null = null;
  for (const term of terms) {
    const normalizedTerm = normalizedSearchText(term);
    const index = normalizedQuery.indexOf(normalizedTerm);
    if (
      index >= 0 &&
      (selected === null ||
        index < selected.index ||
        (index === selected.index &&
          compareCodePoints(normalizedTerm, selected.term) < 0))
    ) {
      selected = { index, term: normalizedTerm };
    }
  }
  return selected;
}

function seasonSearchTerms(season: string): string[] {
  const match = /^(\d{4})-(\d{2})$/u.exec(season);
  if (match === null) return [season];
  const startYear = Number(match[1]);
  const suffix = Number(match[2]);
  let endYear = Math.floor(startYear / 100) * 100 + suffix;
  if (endYear < startYear) endYear += 100;
  return [season, String(startYear), String(endYear)];
}

interface ResearchV2QueryContextMatches {
  athlete: { index: number; term: string } | null;
  injury: { index: number; term: string } | null;
  season: { index: number; term: string } | null;
  team: { index: number; term: string } | null;
  timepoint: { index: number; term: string } | null;
}

function queryContextMatches(
  query: FollowUpResearchV2Query,
  context: FollowUpResearchV2SearchContext,
): ResearchV2QueryContextMatches {
  const normalizedQuery = normalizedSearchText(query.query);
  return {
    athlete: firstMatchingTerm(normalizedQuery, [context.athleteName]),
    injury: firstMatchingTerm(normalizedQuery, context.injuryTerms),
    season: firstMatchingTerm(
      normalizedQuery,
      seasonSearchTerms(context.season),
    ),
    team: firstMatchingTerm(normalizedQuery, [context.teamAtEvent]),
    timepoint: firstMatchingTerm(
      normalizedQuery,
      TIMEPOINT_QUERY_TERMS[query.timepoint],
    ),
  };
}

/**
 * A material formulation signature ignores cosmetic suffixes and the searched
 * chronology itself. Timepoint coverage is validated independently; including
 * it here would let the four required chronology queries masquerade as four
 * search formulations even when their case-context wording is identical.
 */
export function deriveResearchV2ContextFormulationSignature(
  query: FollowUpResearchV2Query,
  context: FollowUpResearchV2SearchContext,
): string | null {
  if (query.timepointApplicability !== "applicable") return null;
  const matches = queryContextMatches(query, context);
  if (Object.values(matches).some((match) => match === null)) return null;
  return Object.entries(matches)
    .filter(([label]) => label !== "timepoint")
    .map(([label, match]) => ({
      index: match!.index,
      label,
    }))
    .sort(
      (left, right) =>
        left.index - right.index || compareCodePoints(left.label, right.label),
    )
    .map((entry) => entry.label)
    .join(">");
}

/** Exact ledger search context derived from one immutable governed case. */
export function expectedFollowUpResearchV2SearchContextForCase(
  record: Pick<InjuryCase, "athlete" | "injury" | "season" | "teamAtEvent">,
): FollowUpResearchV2SearchContext {
  const aliases = INJURY_SEARCH_TERMS_BY_CODE[record.injury.code] ?? [
    record.injury.code,
  ];
  return {
    athleteName: record.athlete.name,
    teamAtEvent: record.teamAtEvent.name,
    season: record.season,
    injuryTerms: sorted(new Set(aliases)),
  };
}

function factsSortedByItemId<T extends { itemId: string }>(
  facts: readonly T[],
): T[] {
  return [...facts].sort((left, right) =>
    compareCodePoints(left.itemId, right.itemId),
  );
}

export function projectFollowUpResearchV2Fact(
  fact: FollowUpResearchV2QualifiedFact,
): FollowUpResearchFact {
  const {
    atomicProposition: _atomicProposition,
    factIdentitySha256: _factIdentitySha256,
    ...projected
  } = fact;
  return {
    ...projected,
    source: { ...projected.source },
  };
}

function validateFact(
  fact: FollowUpResearchV2QualifiedFact,
  context: {
    caseSlug: string;
    factKind: FollowUpKind;
    auditCutoffDate: string;
    completedDate?: string;
    path: string;
  },
  issues: ValidationIssue[],
): void {
  if (fact.kind !== context.factKind) {
    issues.push(
      issue(
        "follow-up-research-v2-fact-kind",
        `${context.path}.kind`,
        `fact kind must equal audit kind ${context.factKind}`,
      ),
    );
  }
  const expectedIdentity = computeResearchV2FactIdentityDigest(
    context.caseSlug,
    fact,
  );
  if (fact.factIdentitySha256 !== expectedIdentity) {
    issues.push(
      issue(
        "follow-up-research-v2-fact-identity",
        `${context.path}.factIdentitySha256`,
        "fact identity must bind case, kind, stable proposition, and fact date",
      ),
    );
  }

  const { publishedAt, accessedAt } = fact.source;
  if (!isRealIsoDate(publishedAt) || !isRealIsoDate(accessedAt)) {
    issues.push(
      issue(
        "follow-up-research-v2-source-date-invalid",
        `${context.path}.source`,
        "source publication and access dates must be real ISO dates",
      ),
    );
  } else if (
    publishedAt > accessedAt ||
    accessedAt > context.auditCutoffDate ||
    (context.completedDate !== undefined && accessedAt > context.completedDate)
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-source-chronology",
        `${context.path}.source`,
        "publishedAt <= accessedAt <= round completion <= audit cutoff is required",
      ),
    );
  }

  if (fact.factDate !== null) {
    if (!isRealIsoDate(fact.factDate)) {
      issues.push(
        issue(
          "follow-up-research-v2-fact-date-invalid",
          `${context.path}.factDate`,
          "factDate must be a real ISO date",
        ),
      );
    } else if (
      fact.factDate > accessedAt ||
      fact.factDate > context.auditCutoffDate
    ) {
      issues.push(
        issue(
          "follow-up-research-v2-fact-date-future",
          `${context.path}.factDate`,
          "factDate must have occurred by source access and the audit cutoff",
        ),
      );
    }
  }

  if (fact.kind === "actual-return") {
    if (fact.factDate === null) {
      issues.push(
        issue(
          "follow-up-research-v2-actual-return-date",
          `${context.path}.factDate`,
          "actual-return requires a non-null occurred date",
        ),
      );
    }
    if (fact.sourceTier !== "team-or-league-official") {
      issues.push(
        issue(
          "follow-up-research-v2-actual-return-source-tier",
          `${context.path}.sourceTier`,
          "actual-return requires a team or league official participation source",
        ),
      );
    }
    if (ACTUAL_RETURN_PREDICTION_RE.test(fact.attributedStatement)) {
      issues.push(
        issue(
          "follow-up-research-v2-actual-return-prediction",
          `${context.path}.attributedStatement`,
          "actual-return must describe occurred participation, never a projection",
        ),
      );
    }
  }
}

function validateCandidateSourceChronology(
  candidate: Extract<
    FollowUpResearchV2Candidate,
    { accessStatus: "opened-original-page" }
  >,
  completedDate: string,
  cutoff: string,
  path: string,
  issues: ValidationIssue[],
): void {
  if (
    !isRealIsoDate(candidate.source.publishedAt) ||
    !isRealIsoDate(candidate.source.accessedAt) ||
    candidate.source.publishedAt > candidate.source.accessedAt ||
    candidate.source.accessedAt > completedDate ||
    completedDate > cutoff
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-candidate-chronology",
        `${path}.source`,
        "opened candidate dates must satisfy publication <= access <= round <= cutoff",
      ),
    );
  }
}

function candidateMatchesResult(
  query: FollowUpResearchV2Query,
  candidates: readonly FollowUpResearchV2Candidate[],
): boolean {
  if (query.resultCode === "no-candidate") return candidates.length === 0;
  if (query.resultCode === "not-applicable") return candidates.length === 0;
  if (candidates.length === 0) return false;
  return candidates.every(
    (candidate) => candidate.disposition === query.resultCode,
  );
}

function validateQuery(
  query: FollowUpResearchV2Query,
  factKind: FollowUpKind,
  searchContext: FollowUpResearchV2SearchContext,
  contextFormulationSignatures: Set<string>,
  path: string,
  issues: ValidationIssue[],
): void {
  const allowedConcepts = new Set<ResearchV2TermConcept>(
    RESEARCH_V2_TERM_CONCEPTS[factKind],
  );
  if (
    !unique(query.coveredTermConcepts) ||
    !sameCanonical(query.coveredTermConcepts, sorted(query.coveredTermConcepts))
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-query-concepts-not-normalized",
        `${path}.coveredTermConcepts`,
        "covered term concepts must be a unique code-point-sorted set",
      ),
    );
  }
  if (query.coveredTermConcepts.some((term) => !allowedConcepts.has(term))) {
    issues.push(
      issue(
        "follow-up-research-v2-query-concept-wrong-kind",
        `${path}.coveredTermConcepts`,
        `query concepts must belong to the ${factKind} term family`,
      ),
    );
  }
  const normalizedQuery = query.query.normalize("NFC").toLocaleLowerCase("en");
  for (const concept of query.coveredTermConcepts) {
    if (!CONCEPT_QUERY_MATCHERS[concept].test(normalizedQuery)) {
      issues.push(
        issue(
          "follow-up-research-v2-query-concept-not-in-query",
          `${path}.coveredTermConcepts`,
          `claimed concept ${concept} must occur in the exact query as an accepted term or inflection`,
        ),
      );
    }
  }
  const angleId = computeResearchV2AngleId({
    sourceChannel: query.sourceChannel,
    timepoint: query.timepoint,
    coveredTermConcepts: query.coveredTermConcepts,
  });
  if (query.angleId !== angleId) {
    issues.push(
      issue(
        "follow-up-research-v2-angle-id",
        `${path}.angleId`,
        "angleId must be derived from channel, timepoint, and normalized concepts",
      ),
    );
  }

  if (query.timepointApplicability === "not-applicable") {
    if (
      query.notApplicableReason === null ||
      query.resultCode !== "not-applicable" ||
      query.verificationChannel !== "documented-not-applicable"
    ) {
      issues.push(
        issue(
          "follow-up-research-v2-timepoint-not-applicable",
          path,
          "not-applicable timepoints require a rationale and documented-not-applicable result",
        ),
      );
    }
  } else if (
    query.notApplicableReason !== null ||
    query.resultCode === "not-applicable" ||
    query.verificationChannel === "documented-not-applicable"
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-timepoint-applicable",
        path,
        "applicable timepoints cannot use a not-applicable rationale or result",
      ),
    );
  } else {
    const contextMatches = queryContextMatches(query, searchContext);
    const missingContext = Object.entries(contextMatches)
      .filter(([, match]) => match === null)
      .map(([label]) => label);
    if (missingContext.length > 0) {
      issues.push(
        issue(
          "follow-up-research-v2-query-context-missing",
          `${path}.query`,
          `applicable query must contain athlete, injury, team, season/year, and declared timepoint terms; missing ${missingContext.join(",")}`,
        ),
      );
    } else {
      const signature = deriveResearchV2ContextFormulationSignature(
        query,
        searchContext,
      );
      if (signature !== null) contextFormulationSignatures.add(signature);
    }
  }

  for (const name of query.namedPersonTerms) {
    if (
      !normalizedQuery.includes(name.normalize("NFC").toLocaleLowerCase("en"))
    ) {
      issues.push(
        issue(
          "follow-up-research-v2-named-person-query",
          `${path}.namedPersonTerms`,
          `named person term ${JSON.stringify(name)} must occur in the exact query`,
        ),
      );
    }
  }
}

function coverageResult(
  factKind: FollowUpKind,
  channels: ReadonlySet<ResearchV2SourceChannel>,
  timepoints: ReadonlySet<ResearchV2Timepoint>,
  concepts: ReadonlySet<ResearchV2TermConcept>,
): FollowUpResearchV2CoverageResult {
  return {
    missingSourceChannels: RESEARCH_V2_SOURCE_CHANNELS.filter(
      (channel) => !channels.has(channel),
    ),
    missingTimepoints: RESEARCH_V2_TIMEPOINTS.filter(
      (timepoint) => !timepoints.has(timepoint),
    ),
    missingTermConcepts: RESEARCH_V2_TERM_CONCEPTS[factKind].filter(
      (concept) => !concepts.has(concept),
    ),
  };
}

function hasCompleteCoverage(
  coverage: FollowUpResearchV2CoverageResult,
): boolean {
  return (
    coverage.missingSourceChannels.length === 0 &&
    coverage.missingTimepoints.length === 0 &&
    coverage.missingTermConcepts.length === 0
  );
}

function validateAuditUnit(
  research: FollowUpResearchV2,
  unit: FollowUpResearchV2AuditUnit,
  options: FollowUpResearchV2ValidationOptions,
  issues: ValidationIssue[],
): FollowUpResearchV2UnitValidation {
  const factKind = unit.factKind;
  const unitPath = `audits.${factKind}`;
  const unitIssueStart = issues.length;
  const cutoff = options.auditCutoffDate;
  const seenItemIds = new Set<string>();
  const seenEvidenceIds = new Set<string>();
  const seenIdentityDigests = new Set<string>();

  for (const [index, fact] of unit.baseline.qualifiedFacts.entries()) {
    const path = `${unitPath}.baseline.qualifiedFacts.${index}`;
    validateFact(
      fact,
      {
        caseSlug: research.caseSlug,
        factKind,
        auditCutoffDate: cutoff,
        path,
      },
      issues,
    );
    if (
      seenItemIds.has(fact.itemId) ||
      seenEvidenceIds.has(fact.evidenceId) ||
      seenIdentityDigests.has(fact.factIdentitySha256)
    ) {
      issues.push(
        issue(
          "follow-up-research-v2-baseline-duplicate-fact",
          path,
          "baseline item, evidence, and atomic-fact identities must be unique",
        ),
      );
    }
    seenItemIds.add(fact.itemId);
    seenEvidenceIds.add(fact.evidenceId);
    seenIdentityDigests.add(fact.factIdentitySha256);
  }
  if (
    (unit.baseline.decision17Outcome === "source-ready" &&
      unit.baseline.qualifiedFacts.length === 0) ||
    (unit.baseline.decision17Outcome === "not-found" &&
      unit.baseline.qualifiedFacts.length !== 0)
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-baseline-outcome",
        `${unitPath}.baseline.decision17Outcome`,
        "Decision 17 source-ready requires facts and not-found requires none",
      ),
    );
  }
  let computedBaselineDigest = "";
  try {
    computedBaselineDigest = computeResearchV2QualifiedSetDigest(
      unit.baseline.qualifiedFacts,
    );
  } catch (error) {
    issues.push(
      issue(
        "follow-up-research-v2-baseline-set",
        `${unitPath}.baseline.qualifiedFacts`,
        String(error),
      ),
    );
  }
  if (unit.baseline.qualifiedSetSha256 !== computedBaselineDigest) {
    issues.push(
      issue(
        "follow-up-research-v2-baseline-set-digest",
        `${unitPath}.baseline.qualifiedSetSha256`,
        "baseline qualified-set digest is stale",
      ),
    );
  }

  const expectedBaseline = options.expectedBaselineFacts?.[factKind];
  if (expectedBaseline !== undefined) {
    const projected = factsSortedByItemId(
      unit.baseline.qualifiedFacts.map(projectFollowUpResearchV2Fact),
    );
    if (!sameCanonical(projected, factsSortedByItemId(expectedBaseline))) {
      issues.push(
        issue(
          "follow-up-research-v2-decision17-baseline-mismatch",
          `${unitPath}.baseline.qualifiedFacts`,
          "v2 starting facts must exactly project to the immutable Decision 17 facts",
        ),
      );
    }
  }

  const factState = new Map(
    unit.baseline.qualifiedFacts.map((fact) => [fact.itemId, fact] as const),
  );
  const seenQueryIds = new Set<string>();
  const seenQueryStrings = new Set<string>();
  const seenAngleIds = new Set<string>();
  const seenCandidateIds = new Set<string>();
  const coveredChannels = new Set<ResearchV2SourceChannel>();
  const coveredTimepoints = new Set<ResearchV2Timepoint>();
  const coveredConcepts = new Set<ResearchV2TermConcept>();
  const contextFormulationSignatures = new Set<string>();
  const revalidatedBaselineIds = new Set<string>();
  const discoveredMedicalPersons = new Map<
    string,
    { firstDiscoveredRound: number; name: string }
  >();
  const roundTupleDigests: string[] = [];
  let consecutiveNoNew = 0;
  let firstTerminalIndex: number | null = null;
  let terminalRoundNumbers: [number, number] | null = null;
  let anyInvalidRound = false;

  for (const [roundIndex, round] of unit.rounds.entries()) {
    const roundPath = `${unitPath}.rounds.${roundIndex}`;
    const roundIssueStart = issues.length;
    if (round.roundNumber !== roundIndex + 1) {
      issues.push(
        issue(
          "follow-up-research-v2-round-number",
          `${roundPath}.roundNumber`,
          "round numbers must be contiguous and start at one",
        ),
      );
    }
    if (
      !isRealUtcTimestamp(round.startedAt) ||
      !isRealUtcTimestamp(round.completedAt) ||
      round.startedAt > round.completedAt
    ) {
      issues.push(
        issue(
          "follow-up-research-v2-round-timestamp",
          roundPath,
          "round timestamps must be real UTC seconds with start <= completion",
        ),
      );
    }
    const previousRound = unit.rounds[roundIndex - 1];
    if (
      previousRound !== undefined &&
      isRealUtcTimestamp(previousRound.completedAt) &&
      isRealUtcTimestamp(round.startedAt) &&
      previousRound.completedAt > round.startedAt
    ) {
      issues.push(
        issue(
          "follow-up-research-v2-round-time-order",
          `${roundPath}.startedAt`,
          "rounds must be chronologically monotonic without overlapping or moving backward",
        ),
      );
    }
    const completedDate = round.completedAt.slice(0, 10);
    if (completedDate > cutoff) {
      issues.push(
        issue(
          "follow-up-research-v2-round-after-cutoff",
          `${roundPath}.completedAt`,
          "round completion cannot be after the receipt-derived audit cutoff",
        ),
      );
    }

    const factsBeforeRound = new Map(factState);
    const queryIdsThisRound = new Set(
      round.queries.map((query) => query.queryId),
    );
    const queryById = new Map(
      round.queries.map((query) => [query.queryId, query] as const),
    );
    const candidatesByQuery = new Map<string, FollowUpResearchV2Candidate[]>();
    for (const [candidateIndex, candidate] of round.candidates.entries()) {
      const candidatePath = `${roundPath}.candidates.${candidateIndex}`;
      if (seenCandidateIds.has(candidate.candidateId)) {
        issues.push(
          issue(
            "follow-up-research-v2-duplicate-candidate-id",
            `${candidatePath}.candidateId`,
            "candidate IDs must be unique within the audit unit",
          ),
        );
      }
      seenCandidateIds.add(candidate.candidateId);
      if (!queryIdsThisRound.has(candidate.queryId)) {
        issues.push(
          issue(
            "follow-up-research-v2-candidate-query-binding",
            `${candidatePath}.queryId`,
            "each candidate must bind exactly one query in the same round",
          ),
        );
      }
      const linked = candidatesByQuery.get(candidate.queryId) ?? [];
      linked.push(candidate);
      candidatesByQuery.set(candidate.queryId, linked);

      if (candidate.accessStatus === "opened-original-page") {
        const normalizedMedicalNames = candidate.namedMedicalPersons.map(
          (entry) => normalizedSearchText(entry.name),
        );
        if (!unique(normalizedMedicalNames)) {
          issues.push(
            issue(
              "follow-up-research-v2-candidate-medical-person-duplicate",
              `${candidatePath}.namedMedicalPersons`,
              "opened candidate medical-person names must be unique",
            ),
          );
        }
        if (
          factKind !== "surgery" &&
          candidate.namedMedicalPersons.length > 0
        ) {
          issues.push(
            issue(
              "follow-up-research-v2-candidate-medical-person-wrong-kind",
              `${candidatePath}.namedMedicalPersons`,
              "named surgeon/treating-physician discovery belongs only to the surgery audit",
            ),
          );
        }
        if (factKind === "surgery") {
          for (const person of candidate.namedMedicalPersons) {
            const key = normalizedSearchText(person.name);
            if (!discoveredMedicalPersons.has(key)) {
              discoveredMedicalPersons.set(key, {
                firstDiscoveredRound: round.roundNumber,
                name: person.name,
              });
            }
          }
        }
        validateCandidateSourceChronology(
          candidate,
          completedDate,
          cutoff,
          candidatePath,
          issues,
        );
        if (candidate.disposition === "rejected-with-reason") {
          if (candidate.factItemIds.length !== 0) {
            issues.push(
              issue(
                "follow-up-research-v2-rejected-candidate-fact",
                `${candidatePath}.factItemIds`,
                "a rejected candidate cannot support a retained fact",
              ),
            );
          }
        } else if (candidate.factItemIds.length === 0) {
          issues.push(
            issue(
              "follow-up-research-v2-retained-candidate-fact",
              `${candidatePath}.factItemIds`,
              "a retained/corroborating candidate must name a fact item",
            ),
          );
        }
        if (candidate.disposition === "retained-existing") {
          for (const itemId of candidate.factItemIds) {
            const existing = factsBeforeRound.get(itemId);
            if (
              existing === undefined ||
              !sameSourceIdentityAllowingFreshAccess(
                existing.source,
                candidate.source,
              ) ||
              candidate.source.accessedAt <= existing.source.accessedAt
            ) {
              issues.push(
                issue(
                  "follow-up-research-v2-retained-existing-reference",
                  `${candidatePath}.factItemIds`,
                  "retained-existing must reference a round-before fact with the same source identity and a strictly fresh access date",
                ),
              );
            }
          }
        }
      } else if (candidate.accessStatus === "unresolved-material-candidate") {
        issues.push(
          issue(
            "follow-up-research-v2-unresolved-material-candidate",
            candidatePath,
            "a material candidate with unresolved original-page access blocks exhaustion",
          ),
        );
      }
    }

    for (const [queryIndex, query] of round.queries.entries()) {
      const queryPath = `${roundPath}.queries.${queryIndex}`;
      validateQuery(
        query,
        factKind,
        research.searchContext,
        contextFormulationSignatures,
        queryPath,
        issues,
      );
      if (seenQueryIds.has(query.queryId)) {
        issues.push(
          issue(
            "follow-up-research-v2-duplicate-query-id",
            `${queryPath}.queryId`,
            "query IDs must be unique within the audit unit",
          ),
        );
      }
      if (seenQueryStrings.has(query.query)) {
        issues.push(
          issue(
            "follow-up-research-v2-duplicate-query",
            `${queryPath}.query`,
            "the exact query string cannot repeat within an audit unit",
          ),
        );
      }
      if (seenAngleIds.has(query.angleId)) {
        issues.push(
          issue(
            "follow-up-research-v2-duplicate-angle",
            `${queryPath}.angleId`,
            "the canonical angle cannot repeat within an audit unit",
          ),
        );
      }
      seenQueryIds.add(query.queryId);
      seenQueryStrings.add(query.query);
      seenAngleIds.add(query.angleId);
      coveredTimepoints.add(query.timepoint);
      if (query.timepointApplicability === "applicable") {
        coveredChannels.add(query.sourceChannel);
        for (const concept of query.coveredTermConcepts) {
          if (
            (RESEARCH_V2_TERM_CONCEPTS[factKind] as readonly string[]).includes(
              concept,
            )
          ) {
            coveredConcepts.add(concept);
          }
        }
      }
      const queryCandidates = candidatesByQuery.get(query.queryId) ?? [];
      if (!candidateMatchesResult(query, queryCandidates)) {
        issues.push(
          issue(
            "follow-up-research-v2-query-result",
            `${queryPath}.resultCode`,
            "query result code must match its linked candidate records",
          ),
        );
      }
    }

    const tupleDigest = computeResearchV2RoundAngleTupleDigest(
      round.queries.map((query) => query.angleId),
    );
    roundTupleDigests.push(tupleDigest);
    if (roundIndex > 0 && roundTupleDigests[roundIndex - 1] === tupleDigest) {
      issues.push(
        issue(
          "follow-up-research-v2-round-angle-not-distinct",
          `${roundPath}.queries`,
          "each round must use a materially different angle tuple from the preceding round",
        ),
      );
    }

    let beforeDigest = "";
    try {
      beforeDigest = computeResearchV2QualifiedSetDigest([
        ...factState.values(),
      ]);
    } catch (error) {
      issues.push(
        issue(
          "follow-up-research-v2-set-before",
          `${roundPath}.qualifiedSetBeforeSha256`,
          String(error),
        ),
      );
    }
    if (round.qualifiedSetBeforeSha256 !== beforeDigest) {
      issues.push(
        issue(
          "follow-up-research-v2-set-before-digest",
          `${roundPath}.qualifiedSetBeforeSha256`,
          "round before digest does not equal the replayed cumulative set",
        ),
      );
    }

    const deltaIds = new Set<string>();
    const addedIds: string[] = [];
    let correctedCount = 0;
    for (const [deltaIndex, delta] of round.qualifiedFactDeltas.entries()) {
      const deltaPath = `${roundPath}.qualifiedFactDeltas.${deltaIndex}`;
      if (deltaIds.has(delta.itemId)) {
        issues.push(
          issue(
            "follow-up-research-v2-duplicate-round-delta",
            `${deltaPath}.itemId`,
            "an item can change at most once in one round",
          ),
        );
        continue;
      }
      deltaIds.add(delta.itemId);
      if (delta.itemId !== delta.fact.itemId) {
        issues.push(
          issue(
            "follow-up-research-v2-delta-item-binding",
            deltaPath,
            "delta itemId must equal its full fact payload itemId",
          ),
        );
      }
      validateFact(
        delta.fact,
        {
          caseSlug: research.caseSlug,
          factKind,
          auditCutoffDate: cutoff,
          completedDate,
          path: `${deltaPath}.fact`,
        },
        issues,
      );
      const newDigest = computeResearchV2FactPayloadDigest(delta.fact);
      if (delta.newPayloadSha256 !== newDigest) {
        issues.push(
          issue(
            "follow-up-research-v2-delta-new-payload",
            `${deltaPath}.newPayloadSha256`,
            "delta new payload digest must bind the full qualified fact",
          ),
        );
      }

      const prior = factState.get(delta.itemId);
      if (delta.changeType === "added") {
        if (
          prior !== undefined ||
          delta.priorPayloadSha256 !== null ||
          delta.correctionBasis !== null
        ) {
          issues.push(
            issue(
              "follow-up-research-v2-added-semantics",
              deltaPath,
              "added facts require a new ID, null prior digest, and null correction basis",
            ),
          );
        }
        if (
          [...factState.values()].some(
            (fact) => fact.factIdentitySha256 === delta.fact.factIdentitySha256,
          )
        ) {
          issues.push(
            issue(
              "follow-up-research-v2-duplicate-atomic-fact",
              `${deltaPath}.fact.factIdentitySha256`,
              "a second source for the same proposition/date is corroboration, not a new fact",
            ),
          );
        }
        if (seenEvidenceIds.has(delta.fact.evidenceId)) {
          issues.push(
            issue(
              "follow-up-research-v2-duplicate-evidence-id",
              `${deltaPath}.fact.evidenceId`,
              "a newly added fact must introduce a unique evidence ID",
            ),
          );
        }
        seenItemIds.add(delta.fact.itemId);
        seenEvidenceIds.add(delta.fact.evidenceId);
        seenIdentityDigests.add(delta.fact.factIdentitySha256);
        addedIds.push(delta.itemId);
      } else {
        correctedCount += 1;
        const priorDigest =
          prior === undefined
            ? null
            : computeResearchV2FactPayloadDigest(prior);
        if (
          prior === undefined ||
          delta.priorPayloadSha256 !== priorDigest ||
          delta.correctionBasis === null
        ) {
          issues.push(
            issue(
              "follow-up-research-v2-corrected-semantics",
              deltaPath,
              "corrected facts require an existing stable ID, exact prior digest, and correction basis",
            ),
          );
        }
        if (
          prior !== undefined &&
          prior.factIdentitySha256 !== delta.fact.factIdentitySha256
        ) {
          issues.push(
            issue(
              "follow-up-research-v2-corrected-identity",
              `${deltaPath}.fact.factIdentitySha256`,
              "a correction must preserve atomic proposition/date identity; a material fact needs a new ID",
            ),
          );
        }
        if (priorDigest === newDigest) {
          issues.push(
            issue(
              "follow-up-research-v2-noop-correction",
              deltaPath,
              "a correction must change the qualified fact payload",
            ),
          );
        }
        if (prior !== undefined && prior.evidenceId !== delta.fact.evidenceId) {
          seenEvidenceIds.delete(prior.evidenceId);
          if (seenEvidenceIds.has(delta.fact.evidenceId)) {
            issues.push(
              issue(
                "follow-up-research-v2-duplicate-evidence-id",
                `${deltaPath}.fact.evidenceId`,
                "a corrected fact cannot adopt another retained fact's evidence ID",
              ),
            );
          }
          seenEvidenceIds.add(delta.fact.evidenceId);
        }
      }

      const supportingCandidates = round.candidates.filter(
        (candidate) =>
          candidate.accessStatus === "opened-original-page" &&
          candidate.factItemIds.length === 1 &&
          candidate.factItemIds[0] === delta.itemId &&
          candidate.disposition ===
            (delta.changeType === "added"
              ? "retained-new"
              : "retained-changed") &&
          sameCanonical(candidate.source, delta.fact.source),
      );
      if (supportingCandidates.length !== 1) {
        issues.push(
          issue(
            "follow-up-research-v2-delta-original-page",
            deltaPath,
            "every added/corrected fact must match exactly one one-item opened original-page candidate in its round",
          ),
        );
      }
      factState.set(delta.itemId, delta.fact);
    }

    const deltaByItemId = new Map(
      round.qualifiedFactDeltas.map((delta) => [delta.itemId, delta] as const),
    );
    for (const [candidateIndex, candidate] of round.candidates.entries()) {
      if (candidate.accessStatus !== "opened-original-page") continue;
      const candidatePath = `${roundPath}.candidates.${candidateIndex}`;
      if (
        candidate.disposition === "retained-new" ||
        candidate.disposition === "retained-changed"
      ) {
        const itemId = candidate.factItemIds[0];
        const delta =
          itemId === undefined ? undefined : deltaByItemId.get(itemId);
        const expectedChangeType =
          candidate.disposition === "retained-new" ? "added" : "corrected";
        if (
          candidate.factItemIds.length !== 1 ||
          delta === undefined ||
          delta.changeType !== expectedChangeType ||
          !sameCanonical(candidate.source, delta.fact.source)
        ) {
          issues.push(
            issue(
              "follow-up-research-v2-retained-candidate-delta",
              candidatePath,
              "retained-new/changed candidates must have a one-to-one source-identical delta",
            ),
          );
        }
      } else if (candidate.disposition === "corroboration") {
        for (const itemId of candidate.factItemIds) {
          if (!factState.has(itemId)) {
            issues.push(
              issue(
                "follow-up-research-v2-corroboration-reference",
                `${candidatePath}.factItemIds`,
                "corroboration must reference an existing or current-round retained fact",
              ),
            );
          }
        }
      }
    }

    if (
      round.addedQualifiedFactCount !== addedIds.length ||
      round.correctedQualifiedFactCount !== correctedCount ||
      !sameCanonical(round.newQualifiedFactIds, addedIds)
    ) {
      issues.push(
        issue(
          "follow-up-research-v2-derived-delta-counts",
          roundPath,
          "stored counts and newQualifiedFactIds must be exact ordered projections of deltas",
        ),
      );
    }

    let afterDigest = "";
    try {
      afterDigest = computeResearchV2QualifiedSetDigest([
        ...factState.values(),
      ]);
    } catch (error) {
      issues.push(
        issue(
          "follow-up-research-v2-set-after",
          `${roundPath}.qualifiedSetAfterSha256`,
          String(error),
        ),
      );
    }
    if (round.qualifiedSetAfterSha256 !== afterDigest) {
      issues.push(
        issue(
          "follow-up-research-v2-set-after-digest",
          `${roundPath}.qualifiedSetAfterSha256`,
          "round after digest does not equal the replayed cumulative set",
        ),
      );
    }
    if (
      round.qualifiedFactDeltas.length === 0 &&
      round.qualifiedSetBeforeSha256 !== round.qualifiedSetAfterSha256
    ) {
      issues.push(
        issue(
          "follow-up-research-v2-zero-round-set-change",
          roundPath,
          "a zero-new round must have equal before/after set digests",
        ),
      );
    }

    for (const candidate of round.candidates) {
      if (
        candidate.accessStatus === "opened-original-page" &&
        candidate.disposition === "retained-existing"
      ) {
        for (const itemId of candidate.factItemIds) {
          const baseline = unit.baseline.qualifiedFacts.find(
            (fact) => fact.itemId === itemId,
          );
          if (
            baseline !== undefined &&
            sameSourceIdentityAllowingFreshAccess(
              baseline.source,
              candidate.source,
            ) &&
            candidate.source.accessedAt > baseline.source.accessedAt
          ) {
            const query = queryById.get(candidate.queryId);
            if (
              query !== undefined &&
              ORIGINAL_PAGE_VERIFICATION_CHANNELS.has(
                query.verificationChannel as
                  | "web-open-original-page"
                  | "browser-open-original-page"
                  | "direct-open-original-page",
              )
            ) {
              revalidatedBaselineIds.add(itemId);
            } else {
              issues.push(
                issue(
                  "follow-up-research-v2-baseline-revalidation-channel",
                  `${roundPath}.candidates`,
                  "Decision 17 facts must be freshly reopened through a web, browser, or direct original-page verification channel",
                ),
              );
            }
          }
        }
      }
    }

    const unresolvedMaterialCandidate = round.candidates.some(
      (candidate) =>
        candidate.accessStatus === "unresolved-material-candidate" &&
        candidate.materialCandidate,
    );
    const roundValid =
      issues.length === roundIssueStart && !unresolvedMaterialCandidate;
    if (!roundValid) anyInvalidRound = true;
    if (roundValid) {
      if (round.qualifiedFactDeltas.length > 0) consecutiveNoNew = 0;
      else consecutiveNoNew += 1;
    } else {
      consecutiveNoNew = 0;
    }

    const coverage = coverageResult(
      factKind,
      coveredChannels,
      coveredTimepoints,
      coveredConcepts,
    );
    if (
      firstTerminalIndex === null &&
      roundValid &&
      consecutiveNoNew >= 2 &&
      hasCompleteCoverage(coverage)
    ) {
      firstTerminalIndex = roundIndex;
      terminalRoundNumbers = [round.roundNumber - 1, round.roundNumber];
    }
  }

  if (
    unit.baseline.qualifiedFacts.some(
      (fact) => !revalidatedBaselineIds.has(fact.itemId),
    )
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-baseline-not-revalidated",
        `${unitPath}.baseline.qualifiedFacts`,
        "each retained Decision 17 fact must be reopened and recorded as retained-existing",
      ),
    );
  }

  const coverage = coverageResult(
    factKind,
    coveredChannels,
    coveredTimepoints,
    coveredConcepts,
  );
  if (!hasCompleteCoverage(coverage)) {
    issues.push(
      issue(
        "follow-up-research-v2-coverage-incomplete",
        `${unitPath}.rounds`,
        `missing channels=${coverage.missingSourceChannels.join(",") || "none"}; timepoints=${coverage.missingTimepoints.join(",") || "none"}; concepts=${coverage.missingTermConcepts.join(",") || "none"}`,
      ),
    );
  }
  if (contextFormulationSignatures.size < 2) {
    issues.push(
      issue(
        "follow-up-research-v2-context-formulation-incomplete",
        `${unitPath}.rounds`,
        "terminal research requires at least two materially distinct athlete/team/injury/season formulations",
      ),
    );
  }

  if (factKind === "surgery" && unit.surgeonBranch !== null) {
    const derivedNames = [...discoveredMedicalPersons.values()].sort(
      (left, right) =>
        compareCodePoints(
          normalizedSearchText(left.name),
          normalizedSearchText(right.name),
        ) || compareCodePoints(left.name, right.name),
    );
    if (derivedNames.length === 0) {
      if (unit.surgeonBranch.status !== "no-surgeon-name-found") {
        issues.push(
          issue(
            "follow-up-research-v2-surgeon-branch-derived",
            `${unitPath}.surgeonBranch`,
            "the no-name branch is required when no opened surgery candidate records a surgeon or treating physician",
          ),
        );
      }
    } else {
      if (
        unit.surgeonBranch.status !== "named-surgeon-found" ||
        !sameCanonical(unit.surgeonBranch.names, derivedNames)
      ) {
        issues.push(
          issue(
            "follow-up-research-v2-surgeon-branch-derived",
            `${unitPath}.surgeonBranch`,
            "surgeonBranch names and first-discovery rounds must be the exact projection of opened surgery candidates",
          ),
        );
      }
      for (const entry of derivedNames) {
        const laterQuery = unit.rounds
          .filter((round) => round.roundNumber > entry.firstDiscoveredRound)
          .flatMap((round) => round.queries)
          .some(
            (query) =>
              query.coveredTermConcepts.includes("surgeon-name-branch") &&
              query.namedPersonTerms.some(
                (name) =>
                  normalizedSearchText(name) ===
                  normalizedSearchText(entry.name),
              ),
          );
        if (!laterQuery) {
          issues.push(
            issue(
              "follow-up-research-v2-surgeon-name-follow-up",
              `${unitPath}.surgeonBranch.names`,
              `surgeon ${entry.name} must be queried by name in a later surgery round`,
            ),
          );
        }
      }
    }
  }

  if (
    firstTerminalIndex === null ||
    terminalRoundNumbers === null ||
    anyInvalidRound
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-not-terminal",
        `${unitPath}.rounds`,
        "the audit must end with two valid zero-new rounds after complete coverage",
      ),
    );
  } else if (firstTerminalIndex !== unit.rounds.length - 1) {
    issues.push(
      issue(
        "follow-up-research-v2-trailing-round",
        `${unitPath}.rounds.${firstTerminalIndex + 1}`,
        "no round may trail the first valid terminal pair",
      ),
    );
  }

  const replayedFacts = factsSortedByItemId([...factState.values()]);
  const declaredFacts = factsSortedByItemId(unit.finalQualifiedFacts);
  if (!sameCanonical(replayedFacts, declaredFacts)) {
    issues.push(
      issue(
        "follow-up-research-v2-final-facts-mismatch",
        `${unitPath}.finalQualifiedFacts`,
        "declared final facts must equal baseline plus replayed deltas",
      ),
    );
  }
  let finalDigest = "";
  try {
    finalDigest = computeResearchV2QualifiedSetDigest(replayedFacts);
  } catch (error) {
    issues.push(
      issue(
        "follow-up-research-v2-final-set",
        `${unitPath}.finalQualifiedSetSha256`,
        String(error),
      ),
    );
  }
  if (unit.finalQualifiedSetSha256 !== finalDigest) {
    issues.push(
      issue(
        "follow-up-research-v2-final-set-digest",
        `${unitPath}.finalQualifiedSetSha256`,
        "final set digest must equal the replayed qualified set",
      ),
    );
  }
  if (
    (replayedFacts.length === 0 && unit.emptyResultReason === null) ||
    (replayedFacts.length > 0 && unit.emptyResultReason !== null)
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-empty-result-reason",
        `${unitPath}.emptyResultReason`,
        "an empty set requires a bounded reason; a non-empty set requires null",
      ),
    );
  }

  const unitHasIssues = issues.length > unitIssueStart;
  const resumableIncompleteCodes = new Set([
    "follow-up-research-v2-baseline-not-revalidated",
    "follow-up-research-v2-coverage-incomplete",
    "follow-up-research-v2-context-formulation-incomplete",
    "follow-up-research-v2-not-terminal",
  ]);
  const resumeSafe = issues
    .slice(unitIssueStart)
    .every((entry) => resumableIncompleteCodes.has(entry.code));
  return {
    factKind,
    resumeSafe,
    terminal:
      !unitHasIssues &&
      firstTerminalIndex === unit.rounds.length - 1 &&
      terminalRoundNumbers !== null,
    terminalRoundNumbers:
      !unitHasIssues && firstTerminalIndex === unit.rounds.length - 1
        ? terminalRoundNumbers
        : null,
    consecutiveNoNew,
    coverage,
    finalQualifiedFacts: replayedFacts,
  };
}

export function validateFollowUpResearchV2Record(
  value: unknown,
  options: FollowUpResearchV2ValidationOptions,
): FollowUpResearchV2ValidationResult {
  const issues: ValidationIssue[] = [];
  const units = emptyUnits();
  const projectedFactsByKind = emptyProjectedFacts();
  const parsed = followUpResearchV2Schema.safeParse(value);
  if (!parsed.success) {
    issues.push(
      ...parsed.error.issues.map((zodIssue) =>
        issue(
          "follow-up-research-v2-schema",
          zodIssue.path.join("."),
          zodIssue.message,
        ),
      ),
    );
    return {
      research: null,
      issues,
      units,
      resumeSafe: false,
      terminal: false,
      projectedFactsByKind,
    };
  }
  const research = parsed.data;

  if (!isRealIsoDate(options.auditCutoffDate)) {
    issues.push(
      issue(
        "follow-up-research-v2-cutoff-invalid",
        "auditCutoffDate",
        "the receipt-derived audit cutoff must be a real ISO calendar date",
      ),
    );
  }
  const expectedAuthority =
    options.expectedAuthorityBinding ?? FOLLOW_UP_RESEARCH_V2_AUTHORITY_BINDING;
  if (!sameCanonical(research.authorityBinding, expectedAuthority)) {
    issues.push(
      issue(
        "follow-up-research-v2-authority-binding",
        "authorityBinding",
        "ledger must bind the exact Decision 18 plan and authorization bytes",
      ),
    );
  }
  const expectedPolicy =
    options.expectedPolicyBinding ?? FOLLOW_UP_SOURCE_POLICY_V10_BINDING;
  if (!sameCanonical(research.sourcePolicyBinding, expectedPolicy)) {
    issues.push(
      issue(
        "follow-up-research-v2-policy-binding",
        "sourcePolicyBinding",
        "ledger must bind the immutable nba-v10 policy bytes",
      ),
    );
  }
  if (
    !unique(
      research.searchContext.injuryTerms.map((term) =>
        normalizedSearchText(term),
      ),
    ) ||
    !sameCanonical(
      research.searchContext.injuryTerms,
      sorted(research.searchContext.injuryTerms),
    )
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-search-context-injury-terms",
        "searchContext.injuryTerms",
        "injury aliases must be a unique code-point-sorted set",
      ),
    );
  }
  if (options.expectedSearchContext === undefined) {
    issues.push(
      issue(
        "follow-up-research-v2-search-context-expectation-missing",
        "searchContext",
        "validation requires the immutable case-derived search context",
      ),
    );
  } else if (
    !sameCanonical(research.searchContext, options.expectedSearchContext)
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-search-context-binding",
        "searchContext",
        "ledger search context must exactly bind athlete, team at event, season, and accepted injury aliases",
      ),
    );
  }
  if (
    (options.expectedCaseId !== undefined &&
      research.caseId !== options.expectedCaseId) ||
    (options.expectedCaseSlug !== undefined &&
      research.caseSlug !== options.expectedCaseSlug) ||
    (options.expectedCaseClinicalDigest !== undefined &&
      research.caseClinicalDigest !== options.expectedCaseClinicalDigest)
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-case-binding",
        "caseId",
        "case ID, slug, and clinical digest must match the immutable case",
      ),
    );
  }
  const expectedResearchPath = `research/follow-ups/decision-17/${research.caseSlug}.json`;
  const expectedSidecarPath = `src/content/follow-ups/${research.caseSlug}.json`;
  if (
    research.decision17BaselineBinding.researchPath !== expectedResearchPath ||
    research.decision17BaselineBinding.sidecarPath !== expectedSidecarPath
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-decision17-path-binding",
        "decision17BaselineBinding",
        "Decision 17 baseline paths must be derived from the exact case slug",
      ),
    );
  }
  if (
    (options.expectedDecision17ResearchSha256 !== undefined &&
      research.decision17BaselineBinding.researchSha256 !==
        options.expectedDecision17ResearchSha256) ||
    (options.expectedDecision17SidecarSha256 !== undefined &&
      research.decision17BaselineBinding.sidecarSha256 !==
        options.expectedDecision17SidecarSha256)
  ) {
    issues.push(
      issue(
        "follow-up-research-v2-decision17-digest-binding",
        "decision17BaselineBinding",
        "Decision 17 ledger and sidecar digests must match the immutable baseline bytes",
      ),
    );
  }

  const topLevelIssueCount = issues.length;

  for (const kind of FOLLOW_UP_KINDS) {
    const result = validateAuditUnit(
      research,
      research.audits[kind],
      options,
      issues,
    );
    units[kind] = result;
    projectedFactsByKind[kind] = result.finalQualifiedFacts.map(
      projectFollowUpResearchV2Fact,
    );
  }

  const issueCountBeforeGlobalUniqueness = issues.length;
  const globalItemIds = new Set<string>();
  const globalEvidenceIds = new Set<string>();
  const globalFactIdentities = new Set<string>();
  for (const kind of FOLLOW_UP_KINDS) {
    for (const [index, fact] of units[kind].finalQualifiedFacts.entries()) {
      const path = `audits.${kind}.finalQualifiedFacts.${index}`;
      if (globalItemIds.has(fact.itemId)) {
        issues.push(
          issue(
            "follow-up-research-v2-global-duplicate-item-id",
            `${path}.itemId`,
            "item IDs must be unique across all four audit units",
          ),
        );
      }
      if (globalEvidenceIds.has(fact.evidenceId)) {
        issues.push(
          issue(
            "follow-up-research-v2-global-duplicate-evidence-id",
            `${path}.evidenceId`,
            "evidence IDs must be unique across all four audit units",
          ),
        );
      }
      if (globalFactIdentities.has(fact.factIdentitySha256)) {
        issues.push(
          issue(
            "follow-up-research-v2-global-duplicate-fact-identity",
            `${path}.factIdentitySha256`,
            "atomic fact identities must be unique across all four audit units",
          ),
        );
      }
      globalItemIds.add(fact.itemId);
      globalEvidenceIds.add(fact.evidenceId);
      globalFactIdentities.add(fact.factIdentitySha256);
    }
  }

  return {
    research,
    issues,
    units,
    resumeSafe:
      topLevelIssueCount === 0 &&
      issues.length === issueCountBeforeGlobalUniqueness &&
      FOLLOW_UP_KINDS.every((kind) => units[kind].resumeSafe),
    terminal:
      issues.length === 0 &&
      FOLLOW_UP_KINDS.every((kind) => units[kind].terminal),
    projectedFactsByKind,
  };
}

/** Explicitly named derived-state surface; no stored terminal boolean exists. */
export const deriveFollowUpResearchV2TerminalState =
  validateFollowUpResearchV2Record;
