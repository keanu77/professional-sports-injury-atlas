/** Verifies Decision 17 Phase C review-digest disclosures in a review build. */

import { lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "parse5";

import { loadContentCollections } from "./check-content";
import { computeCaseContentDigest } from "../src/lib/cases/digest";
import { computeFollowUpDraftDigest } from "../src/lib/cases/follow-up-digest";
import { loadReviewFollowUpCorpus } from "../src/lib/cases/follow-up-approval-ledger";
import { permittedCasesForMode } from "../src/lib/cases/pagination";
import {
  reviewFixtureClassicCase,
  selectReviewFixtureCases,
} from "../src/data/review-fixtures";
import {
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  type CaseFollowUp,
} from "../src/lib/contracts/case-follow-up";
import { compareCodePoints } from "../src/lib/contracts/canonical";
import { computeRenderedSetDigest } from "../src/lib/routes/static-paths";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_BUILD_ROOT = resolve(ROOT, "dist");
const EXPECTED_REAL_CASES = 26;
const SUMMARY_TEXT = "審查識別與 digest";
const DIGEST_KINDS = ["case-content", "rendered-set", "follow-up"] as const;
type DigestKind = (typeof DIGEST_KINDS)[number];

interface HtmlNode {
  attrs?: Array<{ name: string; value: string }>;
  childNodes?: HtmlNode[];
  nodeName: string;
  tagName?: string;
  value?: string;
}

interface ExpectedDisclosure {
  recordId: string;
  digests: Record<DigestKind, string>;
}

interface DisclosureCounts {
  disclosures: number;
  inputs: number;
  open: number;
}

function argumentValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function regularFile(path: string): string {
  const status = lstatSync(path);
  if (status.isSymbolicLink() || !status.isFile()) {
    throw new Error(`${path} must be a regular non-symlink file`);
  }
  return readFileSync(path, "utf8");
}

function attr(node: HtmlNode, name: string): string | null {
  return node.attrs?.find((entry) => entry.name === name)?.value ?? null;
}

function hasAttr(node: HtmlNode, name: string): boolean {
  return node.attrs?.some((entry) => entry.name === name) ?? false;
}

function descendants(
  node: HtmlNode,
  predicate: (candidate: HtmlNode) => boolean,
): HtmlNode[] {
  const matches: HtmlNode[] = [];
  for (const child of node.childNodes ?? []) {
    if (predicate(child)) matches.push(child);
    matches.push(...descendants(child, predicate));
  }
  return matches;
}

function elementsByAttribute(
  node: HtmlNode,
  name: string,
  value?: string,
): HtmlNode[] {
  return descendants(node, (candidate) => {
    const candidateValue = attr(candidate, name);
    return (
      candidateValue !== null &&
      (value === undefined || candidateValue === value)
    );
  });
}

function textContent(node: HtmlNode): string {
  if (node.nodeName === "#text") return node.value ?? "";
  return (node.childNodes ?? []).map(textContent).join("");
}

function normalizedText(node: HtmlNode): string {
  return textContent(node).replace(/\s+/gu, " ").trim();
}

function assertOne(
  nodes: readonly HtmlNode[],
  path: string,
  label: string,
): HtmlNode {
  if (nodes.length !== 1) {
    throw new Error(`${path}: expected one ${label}, observed ${nodes.length}`);
  }
  return nodes[0]!;
}

function assertDisclosure(
  htmlPath: string,
  expected: ExpectedDisclosure,
): DisclosureCounts {
  const document = parse(regularFile(htmlPath)) as unknown as HtmlNode;
  const disclosure = assertOne(
    elementsByAttribute(document, "data-review-digests"),
    htmlPath,
    "data-review-digests disclosure",
  );
  if (disclosure.tagName !== "details") {
    throw new Error(`${htmlPath}: review disclosure must be native details`);
  }
  const open = hasAttr(disclosure, "open") ? 1 : 0;
  if (open !== 0) {
    throw new Error(`${htmlPath}: review disclosure must be collapsed`);
  }

  const summaries = (disclosure.childNodes ?? []).filter(
    (node) => node.tagName === "summary",
  );
  const summary = assertOne(summaries, htmlPath, "direct summary child");
  if (normalizedText(summary) !== SUMMARY_TEXT) {
    throw new Error(`${htmlPath}: review summary text changed`);
  }

  const recordId = assertOne(
    elementsByAttribute(disclosure, "data-record-id"),
    htmlPath,
    "record ID",
  );
  if (normalizedText(recordId) !== expected.recordId) {
    throw new Error(`${htmlPath}: record ID does not match its case`);
  }

  const digestInputs = elementsByAttribute(
    disclosure,
    "data-review-digest-kind",
  );
  const allDigestInputs = elementsByAttribute(
    document,
    "data-review-digest-kind",
  );
  if (
    digestInputs.length !== DIGEST_KINDS.length ||
    allDigestInputs.length !== DIGEST_KINDS.length
  ) {
    throw new Error(
      `${htmlPath}: expected exactly ${DIGEST_KINDS.length} digest inputs inside details`,
    );
  }

  const inputIds = new Set<string>();
  for (const kind of DIGEST_KINDS) {
    const input = assertOne(
      digestInputs.filter(
        (candidate) => attr(candidate, "data-review-digest-kind") === kind,
      ),
      htmlPath,
      `${kind} digest input`,
    );
    if (
      input.tagName !== "input" ||
      attr(input, "type") !== "text" ||
      !hasAttr(input, "readonly")
    ) {
      throw new Error(
        `${htmlPath}: ${kind} digest must be readonly text input`,
      );
    }
    if (attr(input, "value") !== expected.digests[kind]) {
      throw new Error(`${htmlPath}: ${kind} digest value changed`);
    }

    const inputId = attr(input, "id");
    if (inputId === null || inputId === "" || inputIds.has(inputId)) {
      throw new Error(`${htmlPath}: ${kind} digest input ID is not unique`);
    }
    inputIds.add(inputId);
    const matchingIds = descendants(
      document,
      (candidate) => attr(candidate, "id") === inputId,
    );
    if (matchingIds.length !== 1) {
      throw new Error(
        `${htmlPath}: digest input ID ${inputId} appears ${matchingIds.length} times`,
      );
    }
    const labels = descendants(
      disclosure,
      (candidate) =>
        candidate.tagName === "label" && attr(candidate, "for") === inputId,
    );
    assertOne(labels, htmlPath, `label for ${kind} digest input`);
  }

  return { disclosures: 1, inputs: digestInputs.length, open };
}

function fixtureFollowUp(): CaseFollowUp {
  const contentDigest = computeCaseContentDigest(reviewFixtureClassicCase);
  const policy = FOLLOW_UP_SOURCE_POLICY_V10_BINDING;
  return {
    schemaVersion: "case-follow-up.v1",
    caseId: reviewFixtureClassicCase.id,
    caseClinicalDigest: contentDigest,
    sourcePolicyBinding: policy,
    legacyDiagnosisProjection: {
      field: "general.confirmedUpdate",
      sourceId: "src-fic-901-first-party",
      sourceTier: "team-or-league-official",
    },
    categories: {
      treatment: [
        {
          id: "fictional-treatment-unverified-001",
          kind: "treatment",
          attributedStatement:
            "虛構報導聲稱球員使用虛構護具；此項沒有官方確認，僅供呈現未證實層級。",
          factDate: "2014-03-03",
          sourceTier: "unverified-report",
          source: {
            title:
              "虛構未證實護具消息（Fictional unverified treatment report）",
            publisher: "虛構場邊消息網（Fictional Sideline Reports）",
            account: "虛構記者帳號（Fictional Reporter Account）",
            canonicalUrl:
              "https://www.nba.com/news/fictional-unverified-treatment-901",
            publishedAt: "2014-03-03",
            accessedAt: "2026-08-14",
            medium: "web-article",
          },
          tierBasis: "虛構來源沒有球隊或聯盟的獨立確認。",
          researchEvidenceId: "fictional-unverified-treatment-evidence-001",
          sourcePolicyBinding: policy,
          itemPayloadDigest: "3".repeat(64),
          review: {
            status: "pending-owner-signoff",
            reviewedPayloadDigest: "3".repeat(64),
          },
        },
      ],
      surgery: [],
      injection: [],
      "actual-return": [
        {
          id: "fictional-actual-return-official-001",
          kind: "actual-return",
          attributedStatement: "虛構聯盟比賽紀錄記載球員已在該日實際出賽。",
          factDate: "2015-01-05",
          sourceTier: "team-or-league-official",
          source: {
            title:
              "虛構聯盟官方出賽紀錄（Fictional official participation log）",
            publisher: "虛構聯盟資料庫（Fictional League Data）",
            account: null,
            canonicalUrl:
              "https://data.fictional-league.example/games/fic-2015-01-05",
            publishedAt: "2015-01-05",
            accessedAt: "2026-08-14",
            medium: "game-or-participation-record",
          },
          tierBasis: "虛構聯盟直接控制的官方出賽紀錄。",
          researchEvidenceId: "fictional-actual-return-evidence-001",
          sourcePolicyBinding: policy,
          itemPayloadDigest: "4".repeat(64),
          review: {
            status: "pending-owner-signoff",
            reviewedPayloadDigest: "4".repeat(64),
          },
        },
      ],
    },
  };
}

function main(): void {
  if (process.version !== "v24.14.0") {
    throw new Error(
      `Decision 17 requires Node v24.14.0; got ${process.version}`,
    );
  }
  const buildRoot = resolve(argumentValue("--root") ?? DEFAULT_BUILD_ROOT);
  const loaded = loadContentCollections(ROOT);
  if (loaded.issues.length > 0) {
    throw new Error(
      `invalid case content: ${loaded.issues
        .map((entry) => `${entry.code}:${entry.path}`)
        .join(", ")}`,
    );
  }
  const records = loaded.cases.map((entry) => entry.record);
  const cases = permittedCasesForMode("review", records).sort((left, right) =>
    compareCodePoints(left.slug, right.slug),
  );
  if (
    records.length !== EXPECTED_REAL_CASES ||
    cases.length !== records.length
  ) {
    throw new Error(
      `expected ${EXPECTED_REAL_CASES} review cases, loaded=${records.length} permitted=${cases.length}`,
    );
  }

  const corpus = loadReviewFollowUpCorpus(ROOT, cases, {
    expectedCaseCount: EXPECTED_REAL_CASES,
    expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  });
  if (
    corpus.issues.length > 0 ||
    corpus.entries.length !== EXPECTED_REAL_CASES
  ) {
    throw new Error(
      `invalid follow-up corpus: ${corpus.issues
        .map((entry) => `${entry.code}:${entry.path}`)
        .join(", ")}`,
    );
  }
  const followUpByCaseId = new Map(
    corpus.entries.map((entry) => [entry.sidecar.caseId, entry] as const),
  );
  if (followUpByCaseId.size !== EXPECTED_REAL_CASES) {
    throw new Error("follow-up corpus has duplicate case IDs");
  }

  const renderedSetDigest = computeRenderedSetDigest(cases);
  let disclosures = 0;
  let inputs = 0;
  let open = 0;
  for (const record of cases) {
    const followUp = followUpByCaseId.get(record.id);
    if (followUp === undefined) {
      throw new Error(`missing follow-up digest for ${record.id}`);
    }
    const result = assertDisclosure(
      resolve(buildRoot, "cases", record.slug, "index.html"),
      {
        recordId: record.id,
        digests: {
          "case-content": computeCaseContentDigest(record),
          "rendered-set": renderedSetDigest,
          "follow-up": followUp.draftDigest,
        },
      },
    );
    disclosures += result.disclosures;
    inputs += result.inputs;
    open += result.open;
  }

  const fixtureCases = selectReviewFixtureCases("review");
  const fixture = fixtureFollowUp();
  const fixtureResult = assertDisclosure(
    resolve(buildRoot, "review", "fixtures", "case-detail", "index.html"),
    {
      recordId: reviewFixtureClassicCase.id,
      digests: {
        "case-content": computeCaseContentDigest(reviewFixtureClassicCase),
        "rendered-set": computeRenderedSetDigest(fixtureCases),
        "follow-up": computeFollowUpDraftDigest(fixture),
      },
    },
  );
  disclosures += fixtureResult.disclosures;
  inputs += fixtureResult.inputs;
  open += fixtureResult.open;

  const fixtureCasesChecked = 1;
  const casesChecked = cases.length + fixtureCasesChecked;
  if (
    disclosures !== casesChecked ||
    inputs !== casesChecked * DIGEST_KINDS.length ||
    open !== 0
  ) {
    throw new Error(
      `digest disclosure totals changed: cases=${casesChecked} disclosures=${disclosures} inputs=${inputs} open=${open}`,
    );
  }
  console.log(
    `Decision 17 C DOM OK — realCases=${cases.length} fixtureCases=${fixtureCasesChecked} ` +
      `cases=${casesChecked} disclosures=${disclosures} inputs=${inputs} open=${open}`,
  );
}

main();
