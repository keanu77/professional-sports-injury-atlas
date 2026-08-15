/** Verifies Decision 18's 26/26 professional clinical-limitations gate. */

import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "parse5";

import { parseStrictJson } from "../src/lib/contracts/canonical";
import { caseSchema, type InjuryCase } from "../src/lib/contracts/case";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PROFESSIONAL_HEADINGS = [
  "機轉分析（觀察性）",
  "臨床限制",
  "鑑別脈絡",
  "治療與回場意涵",
] as const;

interface HtmlNode {
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

function directElements(node: HtmlNode, tagName: string): HtmlNode[] {
  return (node.childNodes ?? []).filter((child) => child.tagName === tagName);
}

function hasRequiredLimitationMeaning(record: InjuryCase): boolean {
  const text = record.professional.clinicalLimitations;
  if (record.injury.code === "acl") {
    return text.includes("影片不能取代臨床診斷");
  }
  if (record.injury.code === "ankle-sprain") {
    return (
      text.includes("畫面不能分辨") &&
      ["症狀", "觸診", "負重能力", "適當檢查"].every((token) =>
        text.includes(token),
      )
    );
  }
  if (record.injury.code === "achilles-rupture") {
    return text.includes("判定需要臨床評估") && text.includes("影片不能確認");
  }
  return false;
}

function assertEvidenceBinding(record: InjuryCase): void {
  const field = "professional.clinicalLimitations";
  const claims = record.professional.claims.filter(
    (claim) => claim.field === field,
  );
  if (
    claims.length === 0 ||
    claims.map((claim) => claim.text).join("\n\n") !==
      record.professional.clinicalLimitations
  ) {
    throw new Error(
      `${record.slug} clinical limitation claim is not source-equal`,
    );
  }
  const sourceById = new Map(
    record.sources.map((source) => [source.id, source]),
  );
  for (const claim of claims) {
    for (const evidenceId of claim.evidenceIds) {
      const source = sourceById.get(evidenceId);
      if (
        source === undefined ||
        source.type !== "teaching-evidence" ||
        !source.supports.includes(field) ||
        !record.professional.evidenceIds.includes(evidenceId)
      ) {
        throw new Error(
          `${record.slug} clinical limitation lacks a valid teaching-evidence binding`,
        );
      }
    }
  }
}

function assertRenderedProfessionalNotes(
  record: InjuryCase,
  buildRoot: string,
): void {
  const htmlPath = resolve(buildRoot, "cases", record.slug, "index.html");
  const document = parse(regularFile(htmlPath)) as unknown as HtmlNode;
  const professionalSections = descendants(
    document,
    (candidate) =>
      candidate.tagName === "section" &&
      directElements(candidate, "h3").some(
        (heading) => normalizedText(heading) === "專業筆記",
      ),
  );
  if (professionalSections.length !== 1) {
    throw new Error(
      `${record.slug} must render exactly one professional-note section`,
    );
  }
  const section = professionalSections[0]!;
  const headings = directElements(section, "h4").map(normalizedText);
  const paragraphs = directElements(section, "p").map(normalizedText);
  const expectedParagraphs = [
    record.professional.mechanismAnalysis,
    record.professional.clinicalLimitations,
    record.professional.differentialContext,
    record.professional.treatmentAndRtpMeaning,
  ].map((value) => value.replace(/\s+/gu, " ").trim());
  if (
    JSON.stringify(headings) !== JSON.stringify(PROFESSIONAL_HEADINGS) ||
    JSON.stringify(paragraphs) !== JSON.stringify(expectedParagraphs) ||
    paragraphs.some((value) => value.length === 0)
  ) {
    throw new Error(
      `${record.slug} rendered professional notes are incomplete`,
    );
  }
}

function main(): void {
  if (process.version !== "v24.14.0") {
    throw new Error(
      `Decision 18 requires Node v24.14.0; got ${process.version}`,
    );
  }
  const buildRoot = argumentValue("--root");
  if (buildRoot === null) {
    throw new Error("--root must identify a temporary review build");
  }
  const caseDirectory = resolve(ROOT, "src/content/cases");
  const files = readdirSync(caseDirectory)
    .filter((name) => name.endsWith(".json"))
    .sort();
  if (files.length !== 26) {
    throw new Error(`expected 26 case files, got ${files.length}`);
  }
  const injuryCounts: Record<string, number> = {};
  for (const file of files) {
    const record = caseSchema.parse(
      parseStrictJson(regularFile(resolve(caseDirectory, file))),
    );
    if (!hasRequiredLimitationMeaning(record)) {
      throw new Error(
        `${record.slug} lacks the required clinical-limitation meaning`,
      );
    }
    assertEvidenceBinding(record);
    assertRenderedProfessionalNotes(record, resolve(buildRoot));
    injuryCounts[record.injury.code] =
      (injuryCounts[record.injury.code] ?? 0) + 1;
  }
  if (
    injuryCounts.acl !== 7 ||
    injuryCounts["ankle-sprain"] !== 12 ||
    injuryCounts["achilles-rupture"] !== 7
  ) {
    throw new Error(
      `unexpected injury distribution ${JSON.stringify(injuryCounts)}`,
    );
  }
  console.log(
    "Decision 18 professional safety OK — 26/26 source-equal rendered clinical limitations; ACL 7, ankle 12, Achilles 7; teaching-evidence bindings 26/26",
  );
}

main();
