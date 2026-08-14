/** Verifies the Decision 17 B-1 rendered layered-note boundary. */

import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "parse5";

import { parseStrictJson } from "../src/lib/contracts/canonical";
import { caseSchema } from "../src/lib/contracts/case";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_BUILD_ROOT = resolve(ROOT, "dist");
const FORBIDDEN_RENDERED_TOKENS = [
  "發生了什麼",
  "畫面看得到什麼",
  "影片段落觀察",
  "data-video-timeline",
  "data-timecode",
  "segment-observations",
] as const;
const PROFESSIONAL_HEADINGS = [
  "機轉分析（觀察性）",
  "臨床限制",
  "鑑別脈絡",
  "治療與回場意涵",
] as const;

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

function textContent(node: HtmlNode): string {
  if (node.nodeName === "#text") return node.value ?? "";
  return (node.childNodes ?? []).map(textContent).join("");
}

function normalizedText(node: HtmlNode): string {
  return textContent(node).replace(/\s+/gu, " ").trim();
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

function childElements(node: HtmlNode, tagName: string): HtmlNode[] {
  return (node.childNodes ?? []).filter((child) => child.tagName === tagName);
}

function assertLayeredNotes(
  htmlPath: string,
  expectedReaderText: string | null,
): void {
  const html = regularFile(htmlPath);
  for (const token of FORBIDDEN_RENDERED_TOKENS) {
    if (html.includes(token)) {
      throw new Error(`${htmlPath} contains removed B-1 token ${token}`);
    }
  }

  const document = parse(html) as unknown as HtmlNode;
  const blocks = elementsByAttribute(document, "data-layered-notes");
  if (blocks.length !== 1) {
    throw new Error(`${htmlPath} requires exactly one layered-notes block`);
  }
  const block = blocks[0]!;
  const generalLayers = elementsByAttribute(block, "data-layer", "general");
  const professionalLayers = elementsByAttribute(
    block,
    "data-layer",
    "professional",
  );
  if (generalLayers.length !== 1 || professionalLayers.length !== 1) {
    throw new Error(`${htmlPath} requires exactly two expected note layers`);
  }

  const general = generalLayers[0]!;
  const generalHeadings = childElements(general, "h4").map(normalizedText);
  const generalParagraphs = childElements(general, "p").map(normalizedText);
  if (
    generalHeadings.length !== 1 ||
    generalHeadings[0] !== "畫面不能證明什麼" ||
    generalParagraphs.length !== 1 ||
    generalParagraphs[0] === ""
  ) {
    throw new Error(
      `${htmlPath} reader layer is not the one-item safety guard`,
    );
  }
  if (
    expectedReaderText !== null &&
    generalParagraphs[0] !== expectedReaderText.replace(/\s+/gu, " ").trim()
  ) {
    throw new Error(
      `${htmlPath} changed the approved whatVideoCannotProve text`,
    );
  }

  const professional = professionalLayers[0]!;
  const professionalHeadings = childElements(professional, "h4").map(
    normalizedText,
  );
  const professionalParagraphs = childElements(professional, "p").map(
    normalizedText,
  );
  if (
    JSON.stringify(professionalHeadings) !==
      JSON.stringify(PROFESSIONAL_HEADINGS) ||
    professionalParagraphs.length !== 4 ||
    professionalParagraphs.some((value) => value === "")
  ) {
    throw new Error(`${htmlPath} professional layer is incomplete`);
  }

  const buttons = elementsByAttribute(block, "data-layer-button");
  const buttonTokens = buttons.map((button) =>
    attr(button, "data-layer-button"),
  );
  if (
    buttons.length !== 2 ||
    buttonTokens[0] !== "general" ||
    buttonTokens[1] !== "professional" ||
    attr(buttons[0]!, "aria-controls") !== attr(general, "id") ||
    attr(buttons[1]!, "aria-controls") !== attr(professional, "id")
  ) {
    throw new Error(`${htmlPath} contains broken layered-note controls`);
  }
}

function main(): void {
  if (process.version !== "v24.14.0") {
    throw new Error(
      `Decision 17 requires Node v24.14.0; got ${process.version}`,
    );
  }
  const buildRoot = resolve(argumentValue("--root") ?? DEFAULT_BUILD_ROOT);
  const caseDirectory = resolve(ROOT, "src/content/cases");
  const caseFiles = readdirSync(caseDirectory)
    .filter((name) => name.endsWith(".json"))
    .sort();
  if (caseFiles.length !== 26) {
    throw new Error(`expected 26 case inputs, got ${caseFiles.length}`);
  }
  for (const filename of caseFiles) {
    const record = caseSchema.parse(
      parseStrictJson(regularFile(resolve(caseDirectory, filename))),
    );
    assertLayeredNotes(
      resolve(buildRoot, "cases", record.slug, "index.html"),
      record.general.whatVideoCannotProve,
    );
  }
  assertLayeredNotes(
    resolve(buildRoot, "review/fixtures/case-detail/index.html"),
    null,
  );

  const labHtml = regularFile(
    resolve(buildRoot, "review/component-lab/index.html"),
  );
  for (const token of FORBIDDEN_RENDERED_TOKENS) {
    if (labHtml.includes(token)) {
      throw new Error(`component lab contains removed B-1 token ${token}`);
    }
  }

  const scriptDirectory = resolve(buildRoot, "_astro");
  const scriptNames = readdirSync(scriptDirectory).filter((name) =>
    name.endsWith(".js"),
  );
  const staleScriptTokens = ["data-video-timeline", "setupTimeline"];
  for (const scriptName of scriptNames) {
    const source = regularFile(resolve(scriptDirectory, scriptName));
    for (const token of staleScriptTokens) {
      if (source.includes(token)) {
        throw new Error(`built script ${scriptName} contains stale ${token}`);
      }
    }
  }

  console.log(
    `Decision 17 B-1 DOM OK — ${caseFiles.length} real cases + 1 fixture; reader=1 item, professional=4 items, timelines=0`,
  );
}

main();
