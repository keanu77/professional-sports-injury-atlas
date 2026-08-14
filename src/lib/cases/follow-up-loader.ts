/**
 * Pure validation plus the read-only filesystem loader for Decision 17
 * follow-up sidecars and their bounded research ledgers.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import {
  caseFollowUpSchema,
  FOLLOW_UP_KINDS,
  FOLLOW_UP_VALIDATION_CUTOFF_DATE,
  followUpResearchSchema,
  followUpSourcePolicyBindingSchema,
  parseCaseFollowUpBytes,
  parseFollowUpResearchBytes,
  type CaseFollowUp,
  type FollowUpItem,
  type FollowUpKind,
  type FollowUpResearch,
  type FollowUpResearchFact,
  type FollowUpSourcePolicyBinding,
} from "../contracts/case-follow-up";
import {
  canonicalJson,
  compareCodePoints,
  isValidIsoDate,
  issue,
  type ValidationIssue,
} from "../contracts/canonical";
import type { InjuryCase } from "../contracts/case";
import { computeCaseContentDigest } from "./digest";
import {
  computeFollowUpDraftDigest,
  computeFollowUpItemPayloadDigest,
  followUpItemPayload,
} from "./follow-up-digest";

export const FOLLOW_UP_CONTENT_DIRECTORY = "src/content/follow-ups" as const;
export const FOLLOW_UP_RESEARCH_DIRECTORY =
  "research/follow-ups/decision-17" as const;

const ACTUAL_RETURN_PREDICTION_RE =
  /\b(?:expected|projected|target|estimated|recommended)\b|預計|預估|目標|建議|可望/u;

function sameCanonical(left: unknown, right: unknown): boolean {
  try {
    return canonicalJson(left) === canonicalJson(right);
  } catch {
    return false;
  }
}

function prefixIssues(
  prefix: string,
  issues: readonly ValidationIssue[],
): ValidationIssue[] {
  return issues.map((entry) => ({
    ...entry,
    path: entry.path === "" ? prefix : `${prefix}.${entry.path}`,
  }));
}

function categoryItems(
  sidecar: CaseFollowUp,
  kind: FollowUpKind,
): FollowUpItem[] {
  return sidecar.categories[kind];
}

function categoryFacts(
  research: FollowUpResearch,
  kind: FollowUpKind,
): FollowUpResearchFact[] {
  return research.categories[kind].facts;
}

function validateDate(
  issues: ValidationIssue[],
  value: string,
  path: string,
): void {
  if (!isValidIsoDate(value)) {
    issues.push(issue("follow-up-invalid-date", path, `invalid date ${value}`));
  }
}

function validateFactRules(
  issues: ValidationIssue[],
  fact: Pick<
    FollowUpItem,
    "kind" | "factDate" | "sourceTier" | "attributedStatement" | "source"
  >,
  path: string,
  maximumFactDate: string,
): void {
  validateDate(issues, fact.source.publishedAt, `${path}.source.publishedAt`);
  validateDate(issues, fact.source.accessedAt, `${path}.source.accessedAt`);
  if (fact.source.publishedAt > fact.source.accessedAt) {
    issues.push(
      issue(
        "follow-up-source-date-order",
        `${path}.source.publishedAt`,
        "source publication date cannot be later than its access date",
      ),
    );
  }
  if (fact.factDate !== null) {
    validateDate(issues, fact.factDate, `${path}.factDate`);
    if (
      fact.factDate > fact.source.accessedAt ||
      fact.factDate > maximumFactDate
    ) {
      issues.push(
        issue(
          "follow-up-fact-date-future",
          `${path}.factDate`,
          `fact date must not be later than source access or ${maximumFactDate}`,
        ),
      );
    }
  }
  if (fact.kind === "actual-return") {
    if (fact.factDate === null) {
      issues.push(
        issue(
          "follow-up-actual-return-date",
          `${path}.factDate`,
          "actual-return requires an occurred fact date",
        ),
      );
    }
    if (fact.sourceTier !== "team-or-league-official") {
      issues.push(
        issue(
          "follow-up-actual-return-source-tier",
          `${path}.sourceTier`,
          "actual-return requires a team-or-league-official source",
        ),
      );
    }
    if (ACTUAL_RETURN_PREDICTION_RE.test(fact.attributedStatement)) {
      issues.push(
        issue(
          "follow-up-actual-return-prediction",
          `${path}.attributedStatement`,
          "actual-return copy must be retrospective, not predictive or advisory",
        ),
      );
    }
  }
}

export interface FollowUpResearchValidationOptions {
  expectedPolicyBinding: FollowUpSourcePolicyBinding;
  maximumFactDate?: string;
}

/** Strict structural and semantic validation of one research ledger. */
export function validateFollowUpResearchRecord(
  value: unknown,
  options: FollowUpResearchValidationOptions,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const expectedPolicy = followUpSourcePolicyBindingSchema.safeParse(
    options.expectedPolicyBinding,
  );
  if (!expectedPolicy.success) {
    return expectedPolicy.error.issues.map((entry) =>
      issue("follow-up-expected-policy", entry.path.join("."), entry.message),
    );
  }
  const parsed = followUpResearchSchema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((entry) =>
      issue("follow-up-research-schema", entry.path.join("."), entry.message),
    );
  }
  const research = parsed.data;
  if (!sameCanonical(research.sourcePolicyBinding, expectedPolicy.data)) {
    issues.push(
      issue(
        "follow-up-policy-binding",
        "sourcePolicyBinding",
        "research ledger does not bind the exact current nba-v10 policy bytes",
      ),
    );
  }
  const maximumFactDate =
    options.maximumFactDate ?? FOLLOW_UP_VALIDATION_CUTOFF_DATE;
  if (!isValidIsoDate(maximumFactDate)) {
    issues.push(
      issue(
        "follow-up-invalid-date",
        "maximumFactDate",
        `invalid maximum fact date ${maximumFactDate}`,
      ),
    );
    return issues;
  }

  const evidenceIds = new Set<string>();
  const itemIds = new Set<string>();
  for (const kind of FOLLOW_UP_KINDS) {
    const audit = research.categories[kind];
    for (const [boundaryIndex, boundary] of audit.queryBoundaries.entries()) {
      validateDate(
        issues,
        boundary.performedAt,
        `categories.${kind}.queryBoundaries.${boundaryIndex}.performedAt`,
      );
    }
    for (const [factIndex, fact] of audit.facts.entries()) {
      const path = `categories.${kind}.facts.${factIndex}`;
      if (fact.kind !== kind) {
        issues.push(
          issue(
            "follow-up-kind-category",
            `${path}.kind`,
            `fact kind ${fact.kind} is stored under ${kind}`,
          ),
        );
      }
      if (evidenceIds.has(fact.evidenceId)) {
        issues.push(
          issue(
            "follow-up-research-evidence-duplicate",
            `${path}.evidenceId`,
            `duplicate research evidence ID ${fact.evidenceId}`,
          ),
        );
      }
      evidenceIds.add(fact.evidenceId);
      if (itemIds.has(fact.itemId)) {
        issues.push(
          issue(
            "follow-up-item-duplicate",
            `${path}.itemId`,
            `duplicate follow-up item ID ${fact.itemId}`,
          ),
        );
      }
      itemIds.add(fact.itemId);
      validateFactRules(issues, fact, path, maximumFactDate);
    }
  }
  return issues;
}

export interface CaseFollowUpValidationOptions {
  caseRecord: InjuryCase;
  research: FollowUpResearch;
  expectedPolicyBinding: FollowUpSourcePolicyBinding;
  maximumFactDate?: string;
}

/**
 * Validates one sidecar against its immutable case and source-ready research.
 * Every draft item must be a byte-equivalent projection of exactly one audit
 * fact, preventing unsourced additions between research and rendering.
 */
export function validateCaseFollowUpRecord(
  value: unknown,
  options: CaseFollowUpValidationOptions,
): ValidationIssue[] {
  const parsed = caseFollowUpSchema.safeParse(value);
  if (!parsed.success) {
    return parsed.error.issues.map((entry) =>
      issue("follow-up-schema", entry.path.join("."), entry.message),
    );
  }
  const sidecar = parsed.data;
  const issues = validateFollowUpResearchRecord(options.research, {
    expectedPolicyBinding: options.expectedPolicyBinding,
    maximumFactDate: options.maximumFactDate,
  }).map((entry) => ({
    ...entry,
    path: entry.path === "" ? "research" : `research.${entry.path}`,
  }));
  const maximumFactDate =
    options.maximumFactDate ?? FOLLOW_UP_VALIDATION_CUTOFF_DATE;

  if (sidecar.caseId !== options.caseRecord.id) {
    issues.push(
      issue(
        "follow-up-case-binding",
        "caseId",
        `sidecar targets ${sidecar.caseId}, not ${options.caseRecord.id}`,
      ),
    );
  }
  const clinicalDigest = computeCaseContentDigest(options.caseRecord);
  if (sidecar.caseClinicalDigest !== clinicalDigest) {
    issues.push(
      issue(
        "follow-up-clinical-digest-stale",
        "caseClinicalDigest",
        "sidecar does not bind the unchanged current case clinical digest",
      ),
    );
  }
  if (
    options.research.caseId !== options.caseRecord.id ||
    options.research.caseSlug !== options.caseRecord.slug ||
    options.research.caseClinicalDigest !== clinicalDigest
  ) {
    issues.push(
      issue(
        "follow-up-research-case-binding",
        "research",
        "research ledger does not bind the same case ID, slug, and clinical digest",
      ),
    );
  }
  if (
    !sameCanonical(sidecar.sourcePolicyBinding, options.expectedPolicyBinding)
  ) {
    issues.push(
      issue(
        "follow-up-policy-binding",
        "sourcePolicyBinding",
        "sidecar does not bind the exact current nba-v10 policy bytes",
      ),
    );
  }

  const compatibleLegacySources = options.caseRecord.sources.filter((source) =>
    source.supports.includes("general.confirmedUpdate"),
  );
  if (compatibleLegacySources.length !== 1) {
    issues.push(
      issue(
        "follow-up-legacy-source-cardinality",
        "legacyDiagnosisProjection.sourceId",
        `expected exactly one existing confirmedUpdate source, found ${compatibleLegacySources.length}`,
      ),
    );
  } else {
    const legacySource = compatibleLegacySources[0]!;
    if (
      legacySource.type !== "diagnosis-first-party" ||
      sidecar.legacyDiagnosisProjection.sourceId !== legacySource.id
    ) {
      issues.push(
        issue(
          "follow-up-legacy-source-binding",
          "legacyDiagnosisProjection.sourceId",
          "legacy diagnosis must reference the unique existing first-party confirmedUpdate source",
        ),
      );
    }
  }

  const researchByEvidenceId = new Map<string, FollowUpResearchFact>();
  for (const kind of FOLLOW_UP_KINDS) {
    for (const fact of categoryFacts(options.research, kind)) {
      if (!researchByEvidenceId.has(fact.evidenceId)) {
        researchByEvidenceId.set(fact.evidenceId, fact);
      }
    }
  }

  const seenItemIds = new Set<string>();
  const seenItemEvidenceIds = new Set<string>();
  const consumedEvidenceIds = new Set<string>();
  for (const kind of FOLLOW_UP_KINDS) {
    const items = categoryItems(sidecar, kind);
    for (let index = 1; index < items.length; index += 1) {
      if (compareCodePoints(items[index - 1]!.id, items[index]!.id) >= 0) {
        issues.push(
          issue(
            "follow-up-item-order",
            `categories.${kind}.${index}`,
            "items must be strictly sorted by stable item ID",
          ),
        );
      }
    }
    for (const [itemIndex, item] of items.entries()) {
      const path = `categories.${kind}.${itemIndex}`;
      if (item.kind !== kind) {
        issues.push(
          issue(
            "follow-up-kind-category",
            `${path}.kind`,
            `item kind ${item.kind} is stored under ${kind}`,
          ),
        );
      }
      if (seenItemIds.has(item.id)) {
        issues.push(
          issue(
            "follow-up-item-duplicate",
            `${path}.id`,
            `duplicate follow-up item ID ${item.id}`,
          ),
        );
      }
      seenItemIds.add(item.id);
      if (seenItemEvidenceIds.has(item.researchEvidenceId)) {
        issues.push(
          issue(
            "follow-up-item-evidence-duplicate",
            `${path}.researchEvidenceId`,
            `research evidence ${item.researchEvidenceId} is reused by more than one item`,
          ),
        );
      }
      seenItemEvidenceIds.add(item.researchEvidenceId);
      if (
        !sameCanonical(item.sourcePolicyBinding, options.expectedPolicyBinding)
      ) {
        issues.push(
          issue(
            "follow-up-policy-binding",
            `${path}.sourcePolicyBinding`,
            "item does not bind the exact current nba-v10 policy bytes",
          ),
        );
      }
      validateFactRules(issues, item, path, maximumFactDate);
      const payloadDigest = computeFollowUpItemPayloadDigest(item);
      if (
        item.itemPayloadDigest !== payloadDigest ||
        item.review.reviewedPayloadDigest !== payloadDigest
      ) {
        issues.push(
          issue(
            "follow-up-item-digest-stale",
            `${path}.itemPayloadDigest`,
            "item payload and pending review must bind the exact current payload digest",
          ),
        );
      }

      const fact = researchByEvidenceId.get(item.researchEvidenceId);
      if (fact === undefined) {
        issues.push(
          issue(
            "follow-up-research-evidence-missing",
            `${path}.researchEvidenceId`,
            "item has no matching source-ready research fact",
          ),
        );
      } else {
        consumedEvidenceIds.add(fact.evidenceId);
        const { finalUrl: _finalUrl, ...source } = fact.source;
        const expectedPayload = {
          id: fact.itemId,
          kind: fact.kind,
          attributedStatement: fact.attributedStatement,
          factDate: fact.factDate,
          sourceTier: fact.sourceTier,
          source,
          tierBasis: fact.tierBasis,
          researchEvidenceId: fact.evidenceId,
          sourcePolicyBinding: options.expectedPolicyBinding,
        };
        if (!sameCanonical(followUpItemPayload(item), expectedPayload)) {
          issues.push(
            issue(
              "follow-up-research-projection-mismatch",
              path,
              "item content/source fields do not exactly project the retained research fact",
            ),
          );
        }
      }
    }
  }
  for (const evidenceId of researchByEvidenceId.keys()) {
    if (!consumedEvidenceIds.has(evidenceId)) {
      issues.push(
        issue(
          "follow-up-research-fact-undrafted",
          `research.${evidenceId}`,
          "every retained source-ready fact requires one atomic pending draft",
        ),
      );
    }
  }
  return issues;
}

function listJsonFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const paths: string[] = [];
  for (const entry of readdirSync(directory).sort(compareCodePoints)) {
    if (entry.startsWith(".")) continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) paths.push(...listJsonFiles(path));
    else if (entry.endsWith(".json")) paths.push(path);
  }
  return paths;
}

export interface LoadedFollowUpEntry {
  sidecarPath: string;
  researchPath: string;
  sidecar: CaseFollowUp;
  research: FollowUpResearch;
  draftDigest: string;
}

export interface LoadedFollowUpCorpus {
  entries: LoadedFollowUpEntry[];
  issues: ValidationIssue[];
}

export interface LoadFollowUpCorpusOptions {
  expectedPolicyBinding: FollowUpSourcePolicyBinding;
  expectedCaseCount?: number;
  maximumFactDate?: string;
}

/**
 * Loads the production directories with exact one-sidecar/one-ledger coverage
 * for every supplied case. Fixtures and unrelated paths are never consulted.
 */
export function loadFollowUpCorpus(
  root: string,
  cases: readonly InjuryCase[],
  options: LoadFollowUpCorpusOptions,
): LoadedFollowUpCorpus {
  const issues: ValidationIssue[] = [];
  const entries: LoadedFollowUpEntry[] = [];
  const expectedCaseCount = options.expectedCaseCount ?? 26;
  if (cases.length !== expectedCaseCount) {
    issues.push(
      issue(
        "follow-up-case-count",
        "cases",
        `expected ${expectedCaseCount} cases, found ${cases.length}`,
      ),
    );
  }

  const sidecarFiles = listJsonFiles(join(root, FOLLOW_UP_CONTENT_DIRECTORY));
  const researchFiles = listJsonFiles(join(root, FOLLOW_UP_RESEARCH_DIRECTORY));
  const caseBySlug = new Map(cases.map((record) => [record.slug, record]));
  const sidecarBySlug = new Map<
    string,
    { path: string; value: CaseFollowUp }
  >();
  const researchBySlug = new Map<
    string,
    { path: string; value: FollowUpResearch }
  >();

  for (const path of sidecarFiles) {
    const slug = basename(path, ".json");
    const relPath = relative(root, path);
    const parsed = parseCaseFollowUpBytes(readFileSync(path));
    issues.push(...prefixIssues(relPath, parsed.issues));
    if (parsed.sidecar === null) continue;
    if (!caseBySlug.has(slug)) {
      issues.push(
        issue("follow-up-orphan-sidecar", relPath, `no case has slug ${slug}`),
      );
      continue;
    }
    if (sidecarBySlug.has(slug)) {
      issues.push(
        issue("follow-up-duplicate-sidecar", relPath, `duplicate ${slug}`),
      );
      continue;
    }
    sidecarBySlug.set(slug, { path: relPath, value: parsed.sidecar });
  }

  for (const path of researchFiles) {
    const slug = basename(path, ".json");
    const relPath = relative(root, path);
    const parsed = parseFollowUpResearchBytes(readFileSync(path));
    issues.push(...prefixIssues(relPath, parsed.issues));
    if (parsed.research === null) continue;
    if (parsed.research.caseSlug !== slug || !caseBySlug.has(slug)) {
      issues.push(
        issue(
          "follow-up-orphan-research",
          relPath,
          `research filename/case slug ${slug} is not a governed case`,
        ),
      );
      continue;
    }
    if (researchBySlug.has(slug)) {
      issues.push(
        issue("follow-up-duplicate-research", relPath, `duplicate ${slug}`),
      );
      continue;
    }
    researchBySlug.set(slug, { path: relPath, value: parsed.research });
  }

  const globalItemIds = new Set<string>();
  for (const record of [...cases].sort((a, b) =>
    compareCodePoints(a.slug, b.slug),
  )) {
    const sidecarEntry = sidecarBySlug.get(record.slug);
    const researchEntry = researchBySlug.get(record.slug);
    if (sidecarEntry === undefined) {
      issues.push(
        issue(
          "follow-up-sidecar-missing",
          `${FOLLOW_UP_CONTENT_DIRECTORY}/${record.slug}.json`,
          "case has no follow-up sidecar",
        ),
      );
    }
    if (researchEntry === undefined) {
      issues.push(
        issue(
          "follow-up-research-missing",
          `${FOLLOW_UP_RESEARCH_DIRECTORY}/${record.slug}.json`,
          "case has no bounded follow-up research ledger",
        ),
      );
    }
    if (sidecarEntry === undefined || researchEntry === undefined) continue;
    const entryIssues = validateCaseFollowUpRecord(sidecarEntry.value, {
      caseRecord: record,
      research: researchEntry.value,
      expectedPolicyBinding: options.expectedPolicyBinding,
      maximumFactDate: options.maximumFactDate,
    });
    issues.push(...prefixIssues(sidecarEntry.path, entryIssues));
    for (const kind of FOLLOW_UP_KINDS) {
      for (const item of sidecarEntry.value.categories[kind]) {
        if (globalItemIds.has(item.id)) {
          issues.push(
            issue(
              "follow-up-global-item-duplicate",
              `${sidecarEntry.path}.categories.${kind}.${item.id}`,
              `item ID ${item.id} is reused across cases`,
            ),
          );
        }
        globalItemIds.add(item.id);
      }
    }
    entries.push({
      sidecarPath: sidecarEntry.path,
      researchPath: researchEntry.path,
      sidecar: sidecarEntry.value,
      research: researchEntry.value,
      draftDigest: computeFollowUpDraftDigest(sidecarEntry.value),
    });
  }

  return { entries, issues };
}
