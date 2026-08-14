/** Verifies the Decision 17 B-2 contract against all built case pages. */

import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "parse5";

import { loadFollowUpCorpus } from "../src/lib/cases/follow-up-loader";
import {
  ACTUAL_RETURN_RETROSPECTIVE_COPY,
  FOLLOW_UP_BLOCK_ATTRIBUTION,
  FOLLOW_UP_EMPTY_COPY,
} from "../src/lib/cases/follow-up-presentation";
import { parseStrictJson } from "../src/lib/contracts/canonical";
import { caseSchema, type InjuryCase } from "../src/lib/contracts/case";
import {
  FOLLOW_UP_KINDS,
  FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  type CaseFollowUp,
  type FollowUpSourceTier,
} from "../src/lib/contracts/case-follow-up";
import { validateNoNbaDeepLinkReferences } from "../src/lib/governance/release-gate";
import { isNbaUrl } from "../src/lib/rights/nba-link-policy";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_BUILD_ROOT = resolve(ROOT, "dist");

interface HtmlNode {
  attrs?: Array<{ name: string; value: string }>;
  childNodes?: HtmlNode[];
  nodeName: string;
  tagName?: string;
  value?: string;
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
  if (!status.isFile() || status.isSymbolicLink()) {
    throw new Error(`${path} must be a regular non-symlink file`);
  }
  return readFileSync(path, "utf8");
}

function attr(node: HtmlNode, name: string): string | null {
  return node.attrs?.find((entry) => entry.name === name)?.value ?? null;
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

function includesAll(text: string, values: readonly string[]): boolean {
  return values.every((value) => text.includes(value));
}

function assertCasePage(
  htmlPath: string,
  record: InjuryCase,
  followUp: CaseFollowUp,
  draftDigest: string,
): { items: number; nbaCitations: number; tiers: FollowUpSourceTier[] } {
  const html = regularFile(htmlPath);
  const document = parse(html) as unknown as HtmlNode;
  const block = assertOne(
    elementsByAttribute(document, "data-follow-up-block"),
    htmlPath,
    "follow-up block",
  );
  if (attr(block, "data-follow-up-case-id") !== record.id) {
    throw new Error(`${htmlPath}: follow-up case binding is stale`);
  }
  const attribution = assertOne(
    elementsByAttribute(block, "data-follow-up-attribution"),
    htmlPath,
    "block attribution",
  );
  if (normalizedText(attribution) !== FOLLOW_UP_BLOCK_ATTRIBUTION) {
    throw new Error(`${htmlPath}: block attribution changed`);
  }
  const approvedCore = assertOne(
    elementsByAttribute(block, "data-follow-up-lineage", "approved-core"),
    htmlPath,
    "approved-core projection",
  );
  if (!normalizedText(approvedCore).includes(record.general.confirmedUpdate)) {
    throw new Error(`${htmlPath}: approved-core text changed`);
  }
  if (!normalizedText(approvedCore).includes("team-or-league-official")) {
    throw new Error(`${htmlPath}: approved-core source tier is not visible`);
  }
  assertOne(
    elementsByAttribute(block, "data-follow-up-pending"),
    htmlPath,
    "pending section",
  );
  const digest = assertOne(
    elementsByAttribute(document, "data-follow-up-draft-digest"),
    htmlPath,
    "follow-up draft digest",
  );
  if (normalizedText(digest) !== draftDigest) {
    throw new Error(`${htmlPath}: follow-up draft digest changed`);
  }

  const categories = elementsByAttribute(block, "data-follow-up-category");
  if (categories.length !== FOLLOW_UP_KINDS.length) {
    throw new Error(`${htmlPath}: expected all four follow-up categories`);
  }
  const tiers: FollowUpSourceTier[] = [];
  let nbaCitations = 0;
  for (const kind of FOLLOW_UP_KINDS) {
    const category = assertOne(
      elementsByAttribute(block, "data-follow-up-category", kind),
      htmlPath,
      `${kind} category`,
    );
    const expectedItems = followUp.categories[kind];
    if (expectedItems.length === 0) {
      const empty = assertOne(
        elementsByAttribute(category, "data-follow-up-empty"),
        htmlPath,
        `${kind} empty state`,
      );
      if (normalizedText(empty) !== FOLLOW_UP_EMPTY_COPY) {
        throw new Error(`${htmlPath}: ${kind} empty copy changed`);
      }
    } else if (elementsByAttribute(category, "data-follow-up-empty").length) {
      throw new Error(`${htmlPath}: ${kind} must not show an empty state`);
    }
    if (kind === "actual-return") {
      const disclaimer = assertOne(
        elementsByAttribute(category, "data-actual-return-disclaimer"),
        htmlPath,
        "actual-return disclaimer",
      );
      if (normalizedText(disclaimer) !== ACTUAL_RETURN_RETROSPECTIVE_COPY) {
        throw new Error(`${htmlPath}: actual-return disclaimer changed`);
      }
    }

    for (const item of expectedItems) {
      const itemNode = assertOne(
        elementsByAttribute(category, "data-follow-up-item", item.id),
        htmlPath,
        `item ${item.id}`,
      );
      if (
        attr(itemNode, "data-fact-kind") !== item.kind ||
        attr(itemNode, "data-source-tier") !== item.sourceTier ||
        attr(itemNode, "data-review-status") !== "pending-owner-signoff"
      ) {
        throw new Error(`${htmlPath}: item ${item.id} metadata changed`);
      }
      const state = assertOne(
        elementsByAttribute(
          itemNode,
          "data-follow-up-review-state",
          "pending-owner-signoff",
        ),
        htmlPath,
        `pending state ${item.id}`,
      );
      if (normalizedText(state) !== "待醫師簽核") {
        throw new Error(`${htmlPath}: item ${item.id} is not visibly pending`);
      }
      const tier = assertOne(
        elementsByAttribute(itemNode, "data-follow-up-tier-label"),
        htmlPath,
        `tier label ${item.id}`,
      );
      if (!normalizedText(tier).includes(item.sourceTier)) {
        throw new Error(`${htmlPath}: item ${item.id} tier is not visible`);
      }
      if (
        item.sourceTier === "unverified-report" &&
        !normalizedText(tier).includes("不可視為已確認")
      ) {
        throw new Error(`${htmlPath}: unverified item ${item.id} was elevated`);
      }
      const statement = assertOne(
        elementsByAttribute(itemNode, "data-follow-up-statement"),
        htmlPath,
        `statement ${item.id}`,
      );
      const reportingParty = assertOne(
        elementsByAttribute(itemNode, "data-follow-up-reporting-party"),
        htmlPath,
        `reporting party ${item.id}`,
      );
      if (
        normalizedText(statement) !== item.attributedStatement ||
        normalizedText(reportingParty) !==
          (item.source.account ?? item.source.publisher)
      ) {
        throw new Error(`${htmlPath}: item ${item.id} attribution changed`);
      }
      const citations = elementsByAttribute(
        itemNode,
        "data-citation-context",
        "follow-up",
      );
      const citation = assertOne(citations, htmlPath, `citation ${item.id}`);
      if (
        attr(citation, "data-citation-source-id") !== item.id ||
        !includesAll(normalizedText(citation), [
          item.source.title,
          item.source.publisher,
          item.source.publishedAt,
        ])
      ) {
        throw new Error(`${htmlPath}: item ${item.id} source facts changed`);
      }
      if (isNbaUrl(item.source.canonicalUrl)) {
        nbaCitations += 1;
        if (
          attr(citation, "data-link-policy") !== "nba-plain-text-citation" ||
          !normalizedText(citation).includes(item.source.canonicalUrl) ||
          descendants(citation, (node) => node.tagName === "a").length !== 0
        ) {
          throw new Error(`${htmlPath}: item ${item.id} NBA source is linked`);
        }
      } else {
        const links = descendants(
          citation,
          (node) =>
            node.tagName === "a" &&
            attr(node, "href") === item.source.canonicalUrl,
        );
        if (
          attr(citation, "data-link-policy") !== "clickable-link" ||
          links.length !== 1
        ) {
          throw new Error(`${htmlPath}: item ${item.id} direct link changed`);
        }
      }
      const dates = elementsByAttribute(itemNode, "data-follow-up-fact-date");
      if (
        (item.factDate === null && dates.length !== 0) ||
        (item.factDate !== null &&
          (dates.length !== 1 || attr(dates[0]!, "datetime") !== item.factDate))
      ) {
        throw new Error(`${htmlPath}: item ${item.id} fact date changed`);
      }
      tiers.push(item.sourceTier);
    }
  }

  const expectedCount = FOLLOW_UP_KINDS.reduce(
    (count, kind) => count + followUp.categories[kind].length,
    0,
  );
  const renderedCount = elementsByAttribute(
    block,
    "data-follow-up-item",
  ).length;
  if (renderedCount !== expectedCount) {
    throw new Error(
      `${htmlPath}: expected ${expectedCount} items, observed ${renderedCount}`,
    );
  }
  return { items: renderedCount, nbaCitations, tiers };
}

function loadCases(): InjuryCase[] {
  const directory = resolve(ROOT, "src/content/cases");
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) =>
      caseSchema.parse(parseStrictJson(regularFile(resolve(directory, name)))),
    );
}

function main(): void {
  if (process.version !== "v24.14.0") {
    throw new Error(
      `Decision 17 requires Node v24.14.0; got ${process.version}`,
    );
  }
  const buildRoot = resolve(argumentValue("--root") ?? DEFAULT_BUILD_ROOT);
  const cases = loadCases();
  const corpus = loadFollowUpCorpus(ROOT, cases, {
    expectedCaseCount: 26,
    expectedPolicyBinding: FOLLOW_UP_SOURCE_POLICY_V10_BINDING,
  });
  if (corpus.issues.length > 0 || corpus.entries.length !== 26) {
    throw new Error(
      `invalid follow-up corpus: ${corpus.issues
        .map((entry) => `${entry.code}:${entry.path}`)
        .join(", ")}`,
    );
  }
  const caseById = new Map(cases.map((record) => [record.id, record]));
  const pages: Array<{ path: string; html: string }> = [];
  let items = 0;
  let nbaCitations = 0;
  let emptyCases = 0;
  const tierCounts: Record<FollowUpSourceTier, number> = {
    "mainstream-media-report": 0,
    "team-or-league-official": 0,
    "unverified-report": 0,
  };
  for (const entry of corpus.entries) {
    const record = caseById.get(entry.sidecar.caseId);
    if (record === undefined) {
      throw new Error(`unknown follow-up case ${entry.sidecar.caseId}`);
    }
    const relativePath = `cases/${record.slug}/index.html`;
    const htmlPath = resolve(buildRoot, relativePath);
    const html = regularFile(htmlPath);
    pages.push({ path: relativePath, html });
    const result = assertCasePage(
      htmlPath,
      record,
      entry.sidecar,
      entry.draftDigest,
    );
    items += result.items;
    nbaCitations += result.nbaCitations;
    if (result.items === 0) emptyCases += 1;
    for (const tier of result.tiers) tierCounts[tier] += 1;
  }
  const nbaSinks = validateNoNbaDeepLinkReferences(pages);
  if (nbaSinks.length > 0) {
    throw new Error(
      `NBA navigation sinks: ${nbaSinks
        .map((entry) => `${entry.code}:${entry.path}`)
        .join(", ")}`,
    );
  }

  console.log(
    `Decision 17 B-2 DOM OK — cases=${cases.length} items=${items} emptyCases=${emptyCases} ` +
      `tiers=${JSON.stringify(tierCounts)} nbaFollowUpCitations=${nbaCitations} nbaNavigationSinks=0`,
  );
}

main();
