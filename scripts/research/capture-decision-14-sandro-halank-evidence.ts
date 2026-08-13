import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const outputPath =
  "docs/reviews/evidence/decision-14/p1/sandro-halank-direct-commons-sample.v1.json";
const capturedAt = "2026-08-13T15:30:00Z";
const userAgent =
  "ProfessionalSportsInjuryAtlas-Decision14/1.0 (private medical-review research; contact via repository owner)";
const account = Object.freeze({
  accountId: "Sandro Halank",
  accountUrl: "https://commons.wikimedia.org/wiki/User:Sandro_Halank",
  canonicalPublicName: "Sandro Halank",
});
const strata = [
  { offset: "20161231235959", year: "2016" },
  { offset: "20221231235959", year: "2022" },
  { offset: "20251231235959", year: "2025" },
] as const;
const sportsTitlePattern =
  /(?:ALBA Berlin|Basketball|Bobsleigh|Championship|Darts|Dresdner SC|Dynamo Dresden|Eishockey|EuroLeague|Futsal|Gala des Dresdner Sports|Luge|Meisterschaft|Olympic|Olympia|Skeleton|Ski(?:ing|sport| jumping)?\b|Volleyball|World Cup)/iu;

interface CorpusWork {
  directUploadListingUrl: string;
  originalUrl: string;
  title: string;
  yearStratum: string;
}

function decodeHtml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/<[^>]+>/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

async function fetchText(url: string): Promise<string> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": userAgent },
      });
      if (!response.ok) {
        throw new Error(
          `${url}: HTTP ${response.status} ${response.statusText}`,
        );
      }
      const body = await response.text();
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < 6) {
        await new Promise((resolveDelay) =>
          setTimeout(resolveDelay, attempt * 1000),
        );
      }
    }
  }
  throw lastError;
}

function uploadListingUrl(offset: string): string {
  const url = new URL("https://commons.wikimedia.org/w/index.php");
  url.searchParams.set("title", "Special:ListFiles");
  url.searchParams.set("offset", offset);
  url.searchParams.set("limit", "500");
  url.searchParams.set("user", account.accountId);
  url.searchParams.set("uselang", "en");
  return url.toString();
}

function fileUrl(title: string): string {
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(title).replaceAll("%3A", ":")}`;
}

async function enumerateCorpus(): Promise<{
  corpus: CorpusWork[];
  listingEvidence: Array<{
    bodySha256: string;
    capturedFileCount: number;
    selectedSportsCount: number;
    url: string;
    year: string;
  }>;
}> {
  const corpus: CorpusWork[] = [];
  const listingEvidence = [];
  for (const stratum of strata) {
    const url = uploadListingUrl(stratum.offset);
    const body = await fetchText(url);
    const allTitles = [
      ...new Set(
        [...body.matchAll(/title="(File:[^"]+)"/gu)].map((match) =>
          decodeHtml(match[1]!),
        ),
      ),
    ];
    const sportsTitles = allTitles
      .filter((title) => sportsTitlePattern.test(title))
      .slice(0, 50);
    if (sportsTitles.length < 10) {
      throw new Error(`${stratum.year}: fewer than ten sports uploads`);
    }
    for (const title of sportsTitles) {
      corpus.push({
        directUploadListingUrl: url,
        originalUrl: fileUrl(title),
        title,
        yearStratum: stratum.year,
      });
    }
    listingEvidence.push({
      bodySha256: sha256Hex(body),
      capturedFileCount: allTitles.length,
      selectedSportsCount: sportsTitles.length,
      url,
      year: stratum.year,
    });
  }
  if (new Set(corpus.map((row) => row.title)).size !== corpus.length) {
    throw new Error("direct-upload corpus contains duplicate titles");
  }
  return { corpus, listingEvidence };
}

function selectSample(corpus: CorpusWork[]): CorpusWork[] {
  return strata.flatMap((stratum) => {
    const rows = corpus.filter((row) => row.yearStratum === stratum.year);
    return Array.from(
      { length: 10 },
      (_, index) => rows[Math.floor(((index + 0.5) * rows.length) / 10)],
    );
  }) as CorpusWork[];
}

function requiredMatch(
  body: string,
  expression: RegExp,
  label: string,
): string {
  const match = body.match(expression)?.[1];
  if (match === undefined || match === "") {
    throw new Error(`Commons response omitted ${label}`);
  }
  return decodeHtml(match);
}

function tableRows(body: string): Record<string, string> {
  return Object.fromEntries(
    [
      ...body.matchAll(
        /<tr[^>]*>\s*<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gu,
      ),
    ].map((match) => [decodeHtml(match[1]!), decodeHtml(match[2]!)] as const),
  );
}

async function inspectWork(work: CorpusWork) {
  const url = new URL(work.originalUrl);
  url.searchParams.set("uselang", "en");
  const body = await fetchText(url.toString());
  const metadata = tableRows(body);
  const revisionId = Number(
    requiredMatch(body, /"wgCurRevisionId":(\d+)/u, "fixed current revision"),
  );
  const licenseCategory = requiredMatch(
    body,
    /"wgCategories":\[[\s\S]*?"(CC-BY-SA-(?:3\.0|4\.0))"/u,
    "exact file-license category",
  );
  const exactLicenseToken = licenseCategory.toLowerCase();
  const licenseUrl = `https://creativecommons.org/licenses/by-sa/${licenseCategory.endsWith("3.0") ? "3.0" : "4.0"}/`;
  if (
    (!body.includes("Self-photographed") && !body.includes("Own work")) ||
    !body.includes("User:Sandro_Halank") ||
    !Number.isInteger(revisionId)
  ) {
    throw new Error(
      `${work.title}: direct-own account relationship unresolved`,
    );
  }
  const originalDimensionsMatch = decodeHtml(body).match(
    /Original file \(([\d,]+) × ([\d,]+) pixels/u,
  );
  const width = Number(originalDimensionsMatch?.[1]?.replaceAll(",", ""));
  const height = Number(originalDimensionsMatch?.[2]?.replaceAll(",", ""));
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error(`${work.title}: native dimensions unavailable`);
  }
  return {
    ...work,
    exactLicenseToken,
    licenseEvidenceUrl: url.toString(),
    licenseUrl,
    metadataEvidence: {
      author: metadata.Author ?? null,
      cameraManufacturer: metadata["Camera manufacturer"] ?? null,
      cameraModel: metadata["Camera model"] ?? null,
      copyrightHolder: metadata["Copyright holder"] ?? null,
      dateTimeOriginal: metadata["Date and time of data generation"] ?? null,
      focalLength: metadata["Lens focal length"] ?? null,
    },
    nativeDimensions: { height, width },
    pageBodySha256: sha256Hex(body),
    revision: {
      id: revisionId,
      permalink: `https://commons.wikimedia.org/w/index.php?title=${encodeURIComponent(work.title)}&oldid=${revisionId}`,
    },
    selfPublication: {
      accountId: account.accountId,
      authorAndUploaderRelationship: "direct-own-work-upload-by-account",
      sourceLabel: body.includes("Self-photographed")
        ? "Self-photographed"
        : "Own work",
    },
  };
}

async function main(): Promise<void> {
  const { corpus, listingEvidence } = await enumerateCorpus();
  const selected = selectSample(corpus);
  if (corpus.length < 50 || selected.length !== 30) {
    throw new Error(
      `corpus/sample floor failed ${corpus.length}/${selected.length}`,
    );
  }

  if (process.argv.includes("--check")) {
    const bytes = readFileSync(resolve(root, outputPath), "utf8");
    const parsed = parseStrictJson(bytes) as {
      account: typeof account;
      corpus: CorpusWork[];
      sample: { rows: Array<{ title: string }> };
      schemaVersion: number;
    };
    if (
      parsed.schemaVersion !== 1 ||
      canonicalJson(parsed) !== bytes ||
      JSON.stringify(parsed.account) !== JSON.stringify(account) ||
      JSON.stringify(parsed.corpus) !== JSON.stringify(corpus) ||
      parsed.sample.rows.map((row) => row.title).join("\0") !==
        selected.map((row) => row.title).join("\0")
    ) {
      throw new Error(`${outputPath}: stale or non-canonical evidence`);
    }
    console.log(
      `Decision 14 Sandro Halank evidence check passed (${corpus.length} corpus / 30 sample)`,
    );
    return;
  }

  const inspected = [];
  for (const [index, row] of selected.entries()) {
    console.log(`[${index + 1}/30] ${row.title}`);
    inspected.push(await inspectWork(row));
  }
  const result = {
    account,
    capturedAt,
    corpus,
    corpusRule:
      "Open the Commons Special:ListFiles listing bound to exact uploader account Sandro Halank at fixed year-end offsets 2016, 2022, and 2025; from each 500-row page retain in listing order up to 50 filenames matching the predeclared sports-event lexicon. The account, year strata, listing offsets, and title lexicon are fixed before any file license is read.",
    listingEvidence,
    sample: {
      licenseIndependent: true,
      rows: inspected,
      rule: "Within each fixed year stratum, preserve Special:ListFiles order and select ten indices floor((index + 0.5) * available / 10). No license, author, EXIF, resolution, or reuse field participates in selection.",
      targetSize: 30,
    },
    schemaVersion: 1,
    sportsTitlePattern: sportsTitlePattern.source,
  };
  const bytes = canonicalJson(result);
  mkdirSync(resolve(root, outputPath, ".."), { recursive: true });
  writeFileSync(resolve(root, outputPath), bytes);
  console.log(`${outputPath} ${sha256Hex(bytes)}`);
}

await main();
