/**
 * Deterministically projects the bounded Decision 17 research seeds into
 * canonical research ledgers and independent pending-only sidecars.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  computeFollowUpItemPayloadDigest,
  computeFollowUpDraftDigest,
} from "../src/lib/cases/follow-up-digest";
import {
  FOLLOW_UP_CONTENT_DIRECTORY,
  FOLLOW_UP_RESEARCH_DIRECTORY,
  validateCaseFollowUpRecord,
} from "../src/lib/cases/follow-up-loader";
import { computeCaseContentDigest } from "../src/lib/cases/digest";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  caseFollowUpSchema,
  followUpResearchSchema,
  type CaseFollowUp,
  type FollowUpItem,
  type FollowUpKind,
  type FollowUpResearch,
  type FollowUpSourcePolicyBinding,
} from "../src/lib/contracts/case-follow-up";
import { caseSchema, type InjuryCase } from "../src/lib/contracts/case";
import {
  canonicalJson,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import { DECISION_17_FOLLOW_UP_BATCH_1 } from "./research/decision-17-follow-ups-batch1";
import { decision17FollowUpBatch2 } from "./research/decision-17-follow-ups-batch2";
import { DECISION_17_FOLLOW_UP_BATCH_3 } from "./research/decision-17-follow-ups-batch3";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK_ONLY = process.argv.includes("--check");
const EXPECTED_CASE_COUNT = 26;

interface SeedSource {
  title: string;
  publisher: string;
  account: string | null;
  canonicalUrl: string;
  finalUrl: string;
  publishedAt: string;
  accessedAt: string;
  medium:
    | "web-article"
    | "press-release"
    | "game-or-participation-record"
    | "social-post"
    | "video";
}

interface SeedFact {
  evidenceId: string;
  itemId: string;
  kind: FollowUpKind;
  attributedStatement: string;
  factDate: string | null;
  sourceTier:
    "team-or-league-official" | "mainstream-media-report" | "unverified-report";
  tierBasis: string;
  source: SeedSource;
  sourceOpened: true;
  searchSnippetUsedAsEvidence: false;
}

interface SeedCategory {
  queryBoundaries: Array<{
    query: string;
    locationsChecked: readonly string[];
    performedAt: string;
    stoppingBoundary: string;
  }>;
  outcome?: "source-ready" | "not-found";
  notFoundReason: string | null;
  facts: readonly SeedFact[];
}

interface SeedCase {
  caseSlug: string;
  caseId: string;
  evidenceStatus?: "source-ready";
  legacySourceId?: string;
  categories: Record<FollowUpKind, SeedCategory>;
}

const seeds = [
  ...DECISION_17_FOLLOW_UP_BATCH_1,
  ...decision17FollowUpBatch2,
  ...DECISION_17_FOLLOW_UP_BATCH_3,
] as unknown as SeedCase[];

function fail(message: string): never {
  throw new Error(message);
}

function currentPolicyBinding(): FollowUpSourcePolicyBinding {
  const binding = FOLLOW_UP_SOURCE_POLICY_V10_BINDING;
  const jsonSha256 = sha256Hex(readFileSync(join(REPO_ROOT, binding.jsonPath)));
  const markdownSha256 = sha256Hex(
    readFileSync(join(REPO_ROOT, binding.markdownPath)),
  );
  if (
    jsonSha256 !== binding.jsonSha256 ||
    markdownSha256 !== binding.markdownSha256
  ) {
    fail("nba-v10 policy bytes do not match the immutable follow-up binding");
  }
  return { ...binding };
}

function loadCases(): InjuryCase[] {
  const directory = join(REPO_ROOT, "src/content/cases");
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort(compareCodePoints)
    .map((name) => {
      const parsed = parseStrictJson(
        readFileSync(join(directory, name), "utf8"),
      );
      return caseSchema.parse(parsed);
    });
}

function normalizeCategory(
  seed: SeedCategory,
  kind: FollowUpKind,
): FollowUpResearch["categories"][FollowUpKind] {
  const facts = [...seed.facts]
    .sort((left, right) => compareCodePoints(left.itemId, right.itemId))
    .map((fact) => {
      if (fact.kind !== kind) {
        fail(`seed fact ${fact.itemId} is under ${kind}, not ${fact.kind}`);
      }
      if (
        fact.sourceOpened !== true ||
        fact.searchSnippetUsedAsEvidence !== false
      ) {
        fail(`seed fact ${fact.itemId} must bind an opened original page`);
      }
      return {
        evidenceId: fact.evidenceId,
        itemId: fact.itemId,
        kind: fact.kind,
        attributedStatement: fact.attributedStatement,
        factDate: fact.factDate,
        sourceTier: fact.sourceTier,
        tierBasis: fact.tierBasis,
        source: { ...fact.source },
        evidenceUse: "opened-original-page" as const,
        searchSnippetUsedAsEvidence: false as const,
      };
    });
  const derivedOutcome = facts.length === 0 ? "not-found" : "source-ready";
  if (seed.outcome !== undefined && seed.outcome !== derivedOutcome) {
    fail(
      `seed category ${kind} declares ${seed.outcome} but contains ${facts.length} facts`,
    );
  }
  if (derivedOutcome === "not-found") {
    if (seed.notFoundReason === null || seed.notFoundReason.trim() === "") {
      fail(`empty seed category ${kind} requires a not-found reason`);
    }
    return {
      queryBoundaries: seed.queryBoundaries.map((boundary) => ({
        ...boundary,
        locationsChecked: [...boundary.locationsChecked],
      })),
      outcome: "not-found",
      notFoundReason: seed.notFoundReason,
      facts: [],
    };
  }
  if (seed.notFoundReason !== null) {
    fail(`source-ready seed category ${kind} must not have a not-found reason`);
  }
  return {
    queryBoundaries: seed.queryBoundaries.map((boundary) => ({
      ...boundary,
      locationsChecked: [...boundary.locationsChecked],
    })),
    outcome: "source-ready",
    notFoundReason: null,
    facts,
  };
}

function buildResearch(
  seed: SeedCase,
  record: InjuryCase,
  policy: FollowUpSourcePolicyBinding,
): FollowUpResearch {
  const categories = Object.fromEntries(
    FOLLOW_UP_KINDS.map((kind) => [
      kind,
      normalizeCategory(seed.categories[kind], kind),
    ]),
  ) as FollowUpResearch["categories"];
  return followUpResearchSchema.parse({
    schemaVersion: "case-follow-up-research.v1",
    caseId: record.id,
    caseSlug: record.slug,
    caseClinicalDigest: computeCaseContentDigest(record),
    evidenceStatus: "source-ready",
    sourcePolicyBinding: policy,
    categories,
  });
}

function projectItem(
  fact: FollowUpResearch["categories"][FollowUpKind]["facts"][number],
  policy: FollowUpSourcePolicyBinding,
): FollowUpItem {
  const { finalUrl: _finalUrl, ...source } = fact.source;
  const item: FollowUpItem = {
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
      status: "pending-owner-signoff",
      reviewedPayloadDigest: "0".repeat(64),
    },
  };
  item.itemPayloadDigest = computeFollowUpItemPayloadDigest(item);
  item.review.reviewedPayloadDigest = item.itemPayloadDigest;
  return item;
}

function buildSidecar(
  seed: SeedCase,
  record: InjuryCase,
  research: FollowUpResearch,
  policy: FollowUpSourcePolicyBinding,
): CaseFollowUp {
  const legacySources = record.sources.filter((source) =>
    source.supports.includes("general.confirmedUpdate"),
  );
  if (legacySources.length !== 1) {
    fail(`${record.slug}: expected exactly one legacy diagnosis source`);
  }
  const legacySource = legacySources[0]!;
  if (
    seed.legacySourceId !== undefined &&
    seed.legacySourceId !== legacySource.id
  ) {
    fail(`${record.slug}: stale seed legacy source ${seed.legacySourceId}`);
  }
  const categories = Object.fromEntries(
    FOLLOW_UP_KINDS.map((kind) => [
      kind,
      research.categories[kind].facts
        .map((fact) => projectItem(fact, policy))
        .sort((left, right) => compareCodePoints(left.id, right.id)),
    ]),
  ) as CaseFollowUp["categories"];
  return caseFollowUpSchema.parse({
    schemaVersion: "case-follow-up.v1",
    caseId: record.id,
    caseClinicalDigest: computeCaseContentDigest(record),
    sourcePolicyBinding: policy,
    legacyDiagnosisProjection: {
      field: "general.confirmedUpdate",
      sourceId: legacySource.id,
      sourceTier: "team-or-league-official",
    },
    categories,
  });
}

function expectedPath(directory: string, slug: string): string {
  return join(REPO_ROOT, directory, `${slug}.json`);
}

function writeOrCheck(path: string, bytes: string): void {
  if (CHECK_ONLY) {
    if (!existsSync(path)) fail(`missing generated artifact ${path}`);
    const current = readFileSync(path, "utf8");
    if (current !== bytes) fail(`generated artifact is stale: ${path}`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
}

function ensureExactDirectoryMembership(
  directory: string,
  expectedNames: readonly string[],
): void {
  const path = join(REPO_ROOT, directory);
  if (!existsSync(path)) {
    if (CHECK_ONLY) fail(`missing generated directory ${directory}`);
    return;
  }
  const actual = readdirSync(path)
    .filter((name) => name.endsWith(".json"))
    .sort(compareCodePoints);
  if (
    canonicalJson(actual) !==
    canonicalJson([...expectedNames].sort(compareCodePoints))
  ) {
    fail(`${directory} membership differs from the 26 governed slugs`);
  }
}

function main(): void {
  const policy = currentPolicyBinding();
  const cases = loadCases();
  if (
    cases.length !== EXPECTED_CASE_COUNT ||
    seeds.length !== EXPECTED_CASE_COUNT
  ) {
    fail(
      `expected 26 cases and seeds, found ${cases.length} and ${seeds.length}`,
    );
  }
  const caseBySlug = new Map(cases.map((record) => [record.slug, record]));
  const seedSlugs = new Set<string>();
  let itemCount = 0;
  const tierCounts = new Map<string, number>([
    ["team-or-league-official", 0],
    ["mainstream-media-report", 0],
    ["unverified-report", 0],
  ]);
  const kindCounts = new Map<string, number>(
    FOLLOW_UP_KINDS.map((kind) => [kind, 0]),
  );
  let emptyCaseCount = 0;

  for (const seed of [...seeds].sort((left, right) =>
    compareCodePoints(left.caseSlug, right.caseSlug),
  )) {
    if (seedSlugs.has(seed.caseSlug)) fail(`duplicate seed ${seed.caseSlug}`);
    seedSlugs.add(seed.caseSlug);
    const record = caseBySlug.get(seed.caseSlug);
    if (record === undefined) fail(`orphan seed ${seed.caseSlug}`);
    if (record.id !== seed.caseId) fail(`${seed.caseSlug}: case ID mismatch`);
    const research = buildResearch(seed, record, policy);
    const sidecar = buildSidecar(seed, record, research, policy);
    const issues = validateCaseFollowUpRecord(sidecar, {
      caseRecord: record,
      research,
      expectedPolicyBinding: policy,
    });
    if (issues.length > 0) {
      fail(
        `${seed.caseSlug}: ${issues.map((entry) => `${entry.code}:${entry.path}`).join(", ")}`,
      );
    }
    let caseItems = 0;
    for (const kind of FOLLOW_UP_KINDS) {
      for (const item of sidecar.categories[kind]) {
        itemCount += 1;
        caseItems += 1;
        tierCounts.set(
          item.sourceTier,
          (tierCounts.get(item.sourceTier) ?? 0) + 1,
        );
        kindCounts.set(kind, (kindCounts.get(kind) ?? 0) + 1);
      }
    }
    if (caseItems === 0) emptyCaseCount += 1;
    writeOrCheck(
      expectedPath(FOLLOW_UP_RESEARCH_DIRECTORY, record.slug),
      canonicalJson(research),
    );
    writeOrCheck(
      expectedPath(FOLLOW_UP_CONTENT_DIRECTORY, record.slug),
      canonicalJson(sidecar),
    );
    // Exercise the aggregate digest while generating; it is never written back.
    computeFollowUpDraftDigest(sidecar);
  }
  for (const record of cases) {
    if (!seedSlugs.has(record.slug)) fail(`case has no seed ${record.slug}`);
  }
  const expectedNames = cases.map((record) => `${record.slug}.json`);
  ensureExactDirectoryMembership(FOLLOW_UP_CONTENT_DIRECTORY, expectedNames);
  ensureExactDirectoryMembership(FOLLOW_UP_RESEARCH_DIRECTORY, expectedNames);

  const mode = CHECK_ONLY ? "OK" : "generated";
  console.log(
    `Decision 17 follow-ups ${mode} — cases=${cases.length} items=${itemCount} emptyCases=${emptyCaseCount} ` +
      `tiers=${canonicalJson(Object.fromEntries([...tierCounts].sort()))} ` +
      `kinds=${canonicalJson(Object.fromEntries([...kindCounts].sort()))}`,
  );
}

main();
