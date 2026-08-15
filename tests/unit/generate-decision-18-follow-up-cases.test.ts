import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildDecision18ProjectedSidecar,
  buildDecision18ResearchRecordScaffold,
  generateDecision18CaseArtifacts,
} from "../../src/lib/cases/decision-18-follow-up-generation";
import {
  parseCaseFollowUpBytes,
  parseFollowUpResearchBytes,
  FOLLOW_UP_KINDS,
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
} from "../../src/lib/contracts/case-follow-up";
import { caseSchema } from "../../src/lib/contracts/case";
import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import type { Decision18FollowUpResearchRecord } from "../../src/lib/contracts/decision-18-follow-up-research-record";
import {
  DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS,
  DECISION_18_P0_BASELINE_PATH,
  DECISION_18_P0_BASELINE_SHA256,
  buildDecision18FollowUpBatchReceipt,
  canonicalDecision18FollowUpBatchReceiptText,
  expectedDecision18BatchResearchLedgers,
  expectedDecision18BatchSidecars,
  parseDecision18FollowUpBatchReceiptText,
} from "../../src/lib/contracts/decision-18-follow-up-batch";
import {
  runDecision18CaseGeneration,
  runDecision18ResearchScaffoldInitialization,
} from "../../scripts/generate-decision-18-follow-up-cases";

const ROOT = resolve(import.meta.dirname, "../..");
const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

function read(path: string): Buffer {
  return readFileSync(join(ROOT, path));
}

function git(root: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
  }).trim();
}

function write(root: string, path: string, text: string): void {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, text, "utf8");
}

function initializeGit(root: string): void {
  git(root, ["init", "-q"]);
  git(root, ["config", "user.name", "Decision 18 Test"]);
  git(root, ["config", "user.email", "decision18@example.invalid"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-q", "-m", "chore(test): seed inputs"]);
}

function initializeScaffoldFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "atlas-d18-scaffold-test-"));
  temporaryRoots.push(root);
  for (const directory of [
    "src/content/cases",
    "research/follow-ups/decision-17",
  ]) {
    mkdirSync(join(root, directory, ".."), { recursive: true });
    cpSync(join(ROOT, directory), join(root, directory), { recursive: true });
  }
  mkdirSync(dirname(join(root, DECISION_18_P0_BASELINE_PATH)), {
    recursive: true,
  });
  cpSync(
    join(ROOT, DECISION_18_P0_BASELINE_PATH),
    join(root, DECISION_18_P0_BASELINE_PATH),
  );
  expect(
    sha256Hex(readFileSync(join(root, DECISION_18_P0_BASELINE_PATH))),
  ).toBe(DECISION_18_P0_BASELINE_SHA256);
  initializeGit(root);
  return root;
}

function commitSyntheticAclReceipt(
  root: string,
  options: { includeOutsidePath?: boolean; subject?: string } = {},
): void {
  const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl;
  const sha256ByPath: Record<string, string> = {};
  for (const { path } of [
    ...expectedDecision18BatchResearchLedgers("acl"),
    ...expectedDecision18BatchSidecars("acl"),
  ]) {
    const text = `synthetic completed ACL artifact: ${path}\n`;
    write(root, path, text);
    sha256ByPath[path] = sha256Hex(text);
  }
  const reportText = "# Synthetic completed ACL report\n";
  write(root, definition.reportPath, reportText);
  const receipt = buildDecision18FollowUpBatchReceipt({
    batchId: "acl",
    evidenceFiles: [],
    generatedAt: "2026-08-15T10:00:00Z",
    reviewReportSha256: sha256Hex(reportText),
    sha256ByPath,
    validatedPredecessors: [],
  });
  write(
    root,
    definition.receiptPath,
    canonicalDecision18FollowUpBatchReceiptText(receipt),
  );
  if (options.includeOutsidePath) write(root, "outside.txt", "outside\n");
  git(root, ["add", "."]);
  git(root, [
    "commit",
    "-q",
    "-m",
    options.subject ?? "feat(follow-ups): complete Decision 18 ACL batch",
  ]);
}

function issueCodes(result: { issues: readonly { code: string }[] }): string[] {
  return result.issues.map(({ code }) => code);
}

function terminalEmptyRecord(): {
  caseRecord: ReturnType<typeof caseSchema.parse>;
  decision17Research: NonNullable<
    ReturnType<typeof parseFollowUpResearchBytes>["research"]
  >;
  decision17Sidecar: NonNullable<
    ReturnType<typeof parseCaseFollowUpBytes>["sidecar"]
  >;
  record: Decision18FollowUpResearchRecord;
} {
  const slug = "anfernee-simons-ankle-sprain-2023";
  const caseRecord = caseSchema.parse(
    parseStrictJson(read(`src/content/cases/${slug}.json`).toString("utf8")),
  );
  const decision17Research = parseFollowUpResearchBytes(
    read(`research/follow-ups/decision-17/${slug}.json`),
  ).research!;
  const currentSidecar = parseCaseFollowUpBytes(
    read(`src/content/follow-ups/${slug}.json`),
  ).sidecar!;
  const decision17Sidecar = buildDecision18ProjectedSidecar(
    caseRecord,
    currentSidecar,
    Object.fromEntries(
      FOLLOW_UP_KINDS.map((kind) => [
        kind,
        decision17Research.categories[kind].facts,
      ]),
    ) as Record<
      (typeof FOLLOW_UP_KINDS)[number],
      (typeof decision17Research.categories)[(typeof FOLLOW_UP_KINDS)[number]]["facts"]
    >,
    FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  );
  const record = structuredClone(
    buildDecision18ResearchRecordScaffold({
      auditCutoffDate: "2026-08-15",
      batchId: "ankle",
      caseRecord,
      decision17Research,
    }),
  );
  for (const [kindIndex, kind] of FOLLOW_UP_KINDS.entries()) {
    const audit = record.audits[kind];
    audit.rounds = [
      audit.initialQueryPlan.slice(0, 3),
      audit.initialQueryPlan.slice(3),
    ].map((slots, roundIndex) => ({
      startedAt: `2026-08-15T0${kindIndex * 2 + roundIndex}:00:00Z`,
      completedAt: `2026-08-15T0${kindIndex * 2 + roundIndex}:05:00Z`,
      operatorId: "decision-18-test",
      toolChannel: "web-search",
      queries: slots.map((slot, queryIndex) => ({
        queryId: `q-${kind}-${roundIndex + 1}-${queryIndex + 1}`,
        query: slot.suggestedQuery,
        sourceChannel: slot.sourceChannel,
        timepoint: slot.timepoint,
        timepointApplicability: "applicable",
        notApplicableReason: null,
        coveredTermConcepts: [...slot.coveredTermConcepts],
        namedPersonTerms: [],
        verificationChannel: "web-open-original-page",
        resultCode: "no-candidate",
        resultReason:
          "The issued discovery query produced no qualifying original-page candidate.",
        checkedBoundary:
          "Search results were used only as discovery leads; no snippet was used as evidence.",
      })),
      candidates: [],
      qualifiedFactChanges: [],
      rejectionOrNotFoundReasons: [
        "No qualifying original-page fact survived this round.",
      ],
      checkedBoundary:
        "The declared channels, source types, and chronology angle were checked without inference.",
    }));
    audit.emptyResultReason =
      "No qualifying original-page fact was found after complete channel, timepoint, and term coverage plus two consecutive zero-delta rounds; this does not prove the event did not occur.";
  }
  record.audits.surgery.noNamedMedicalPersonReason =
    "No opened original page named a surgeon or treating physician; the generic surgeon, doctor, and operating-physician branch was searched.";
  return { caseRecord, decision17Research, decision17Sidecar, record };
}

describe("Decision 18 per-case research generation", () => {
  it("builds only nonterminal not-run scaffolds with six channel slots per kind", () => {
    const { record } = terminalEmptyRecord();
    for (const kind of FOLLOW_UP_KINDS) {
      expect(record.audits[kind].initialQueryPlan).toHaveLength(6);
      expect(
        record.audits[kind].initialQueryPlan.map((slot) => slot.planningState),
      ).toEqual(Array(6).fill("unexecuted-at-scaffold-time"));
    }
  });

  it("replays a terminal empty case into canonical v2 and unchanged pending sidecar bytes", () => {
    const { caseRecord, decision17Research, decision17Sidecar, record } =
      terminalEmptyRecord();
    const slug = caseRecord.slug;
    const d17Bytes = read(`research/follow-ups/decision-17/${slug}.json`);
    const sidecarBytes = Buffer.from(canonicalJson(decision17Sidecar));
    const generated = generateDecision18CaseArtifacts({
      auditCutoffDate: "2026-08-15",
      batchId: "ankle",
      caseRecord,
      decision17Research,
      decision17ResearchSha256: sha256Hex(d17Bytes),
      decision17Sidecar,
      decision17SidecarSha256: sha256Hex(sidecarBytes),
      expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
      researchRecord: record,
    });

    expect(generated.issues).toEqual([]);
    expect(generated.ledger?.audits.injection.rounds).toHaveLength(2);
    expect(generated.sidecarText).toBe(sidecarBytes.toString("utf8"));
  });

  it("initializes the active ACL batch once and preserves valid partial records", () => {
    const root = initializeScaffoldFixture();

    const first = runDecision18ResearchScaffoldInitialization({
      auditCutoffDate: "2026-08-15",
      batchId: "acl",
      now: new Date("2026-08-15T12:00:00Z"),
      root,
    });
    const second = runDecision18ResearchScaffoldInitialization({
      auditCutoffDate: "2026-08-15",
      batchId: "acl",
      now: new Date("2026-08-15T12:00:00Z"),
      root,
    });

    expect(first.issues).toEqual([]);
    expect(first.createdPaths).toHaveLength(7);
    expect(second.issues).toEqual([]);
    expect(second.createdPaths).toEqual([]);
    expect(second.preservedPathCount).toBe(7);
  });

  it("blocks --init and --write when the worktree contains an outside path", () => {
    const root = initializeScaffoldFixture();
    write(root, "unrelated.txt", "not owned by the active batch\n");

    const initialized = runDecision18ResearchScaffoldInitialization({
      auditCutoffDate: "2026-08-15",
      batchId: "acl",
      now: new Date("2026-08-15T12:00:00Z"),
      root,
    });
    const written = runDecision18CaseGeneration({
      batchId: "acl",
      mode: "write",
      now: new Date("2026-08-15T12:00:00Z"),
      root,
    });
    const checked = runDecision18CaseGeneration({
      batchId: "acl",
      mode: "check",
      now: new Date("2026-08-15T12:00:00Z"),
      root,
    });

    expect(initialized.status).toBe("failed");
    expect(initialized.createdPaths).toEqual([]);
    expect(issueCodes(initialized)).toContain(
      "decision18-batch-dirty-path-outside-allowlist",
    );
    expect(written.status).toBe("failed");
    expect(issueCodes(written)).toContain(
      "decision18-batch-dirty-path-outside-allowlist",
    );
    expect(checked.status).toBe("failed");
    expect(issueCodes(checked)).toContain(
      "decision18-batch-dirty-path-outside-allowlist",
    );
    expect(
      existsSync(
        join(
          root,
          DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl.evidenceDirectory,
        ),
      ),
    ).toBe(false);
  });

  it("accepts an isolated conventional predecessor and permits active dirt in --check", () => {
    const root = initializeScaffoldFixture();
    commitSyntheticAclReceipt(root);
    const initialized = runDecision18ResearchScaffoldInitialization({
      auditCutoffDate: "2026-08-15",
      batchId: "ankle",
      now: new Date("2026-08-15T12:00:00Z"),
      root,
    });
    expect(
      initialized.status,
      JSON.stringify(initialized.issues, null, 2),
    ).toBe("initialized");
    expect(initialized.createdPaths).toHaveLength(12);

    const checked = runDecision18CaseGeneration({
      batchId: "ankle",
      mode: "check",
      now: new Date("2026-08-15T12:00:00Z"),
      root,
    });
    expect(checked.status).toBe("failed");
    for (const preflightCode of [
      "decision18-batch-dirty-path-outside-allowlist",
      "decision18-batch-completed-path-mutation",
      "decision18-batch-completed-digest-drift",
      "decision18-batch-predecessor-git",
    ]) {
      expect(issueCodes(checked)).not.toContain(preflightCode);
    }
  });

  it.each([
    {
      commit: { subject: "complete Decision 18 ACL batch" },
      expectedCode: "decision18-batch-predecessor-commit-subject",
      label: "non-conventional introduction subject",
    },
    {
      commit: { includeOutsidePath: true },
      expectedCode: "decision18-batch-commit-path-outside-allowlist",
      label: "introduction commit path leakage",
    },
  ])("rejects predecessor $label before initialization", (scenario) => {
    const root = initializeScaffoldFixture();
    commitSyntheticAclReceipt(root, scenario.commit);
    const result = runDecision18ResearchScaffoldInitialization({
      auditCutoffDate: "2026-08-15",
      batchId: "ankle",
      now: new Date("2026-08-15T12:00:00Z"),
      root,
    });
    expect(result.status).toBe("failed");
    expect(result.createdPaths).toEqual([]);
    expect(issueCodes(result)).toContain(scenario.expectedCode);
  });

  it("rejects completed predecessor digest drift before --write", () => {
    const root = initializeScaffoldFixture();
    commitSyntheticAclReceipt(root);
    const ledgerPath = expectedDecision18BatchResearchLedgers("acl")[0]!.path;
    write(root, ledgerPath, "drifted completed ledger\n");

    const result = runDecision18CaseGeneration({
      batchId: "ankle",
      mode: "write",
      now: new Date("2026-08-15T12:00:00Z"),
      root,
    });
    expect(result.status).toBe("failed");
    expect(issueCodes(result)).toEqual(
      expect.arrayContaining([
        "decision18-batch-completed-path-mutation",
        "decision18-batch-completed-digest-drift",
      ]),
    );
    const checked = runDecision18CaseGeneration({
      batchId: "ankle",
      mode: "check",
      now: new Date("2026-08-15T12:00:00Z"),
      root,
    });
    expect(issueCodes(checked)).toEqual(
      expect.arrayContaining([
        "decision18-batch-completed-path-mutation",
        "decision18-batch-completed-digest-drift",
      ]),
    );
  });

  it("rejects a coherent later commit touching completed predecessor paths", () => {
    const root = initializeScaffoldFixture();
    commitSyntheticAclReceipt(root);
    const definition = DECISION_18_FOLLOW_UP_BATCH_DEFINITIONS.acl;
    const reportText = "# Coherently rewritten completed ACL report\n";
    write(root, definition.reportPath, reportText);
    const receiptAbsolute = join(root, definition.receiptPath);
    const parsed = parseDecision18FollowUpBatchReceiptText(
      readFileSync(receiptAbsolute, "utf8"),
      {
        batchId: "acl",
        now: new Date("2026-08-15T12:00:00Z"),
        validatedPredecessors: [],
      },
    );
    expect(parsed.receipt).not.toBeNull();
    write(
      root,
      definition.receiptPath,
      canonicalDecision18FollowUpBatchReceiptText({
        ...parsed.receipt!,
        reviewReport: {
          ...parsed.receipt!.reviewReport,
          sha256: sha256Hex(reportText),
        },
      }),
    );
    git(root, ["add", "."]);
    git(root, [
      "commit",
      "-q",
      "-m",
      "fix(follow-ups): rewrite completed Decision 18 ACL batch",
    ]);

    const result = runDecision18ResearchScaffoldInitialization({
      auditCutoffDate: "2026-08-15",
      batchId: "ankle",
      now: new Date("2026-08-15T12:00:00Z"),
      root,
    });
    expect(result.status).toBe("failed");
    expect(result.createdPaths).toEqual([]);
    expect(issueCodes(result)).toContain(
      "decision18-batch-predecessor-later-mutation",
    );
    expect(issueCodes(result)).not.toContain(
      "decision18-batch-completed-digest-drift",
    );
  });
});
