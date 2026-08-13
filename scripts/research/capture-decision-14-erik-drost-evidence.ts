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
const leadPath =
  "docs/reviews/evidence/decision-14/p1/commons-fixed-query-leads.v1.json";
const outputPath =
  "docs/reviews/evidence/decision-14/p1/erik-drost-original-account-sample.v1.json";
const capturedAt = "2026-08-13T14:30:00Z";
const account = Object.freeze({
  accountId: "62091376@N03",
  accountUrl: "https://www.flickr.com/photos/edrost88/",
  canonicalPublicName: "Erik Drost",
  pathAlias: "edrost88",
});
const userAgent =
  "ProfessionalSportsInjuryAtlas-Decision14/1.0 (private medical-review research; contact via repository owner)";

interface LeadSnapshot {
  athletes: Array<{
    athleteName: string;
    pages: Array<{
      artistHtml: string | null;
      dateTimeOriginal: string | null;
      fixedRevision: { permalink: string; revisionId: number };
      licenseShortName: string | null;
      title: string;
      upstreamUrls: string[];
    }>;
  }>;
}

interface CorpusWork {
  athleteNames: string[];
  commonsEvidence: Array<{
    fixedRevisionPermalink: string;
    reportedDate: string;
    revisionId: number;
    title: string;
  }>;
  derivedCaptureDate: string;
  flickrId: string;
  originalUrl: string;
}

function decodeHtml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/<[^>]+>/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function exactDate(value: string | null): string {
  const match = value?.match(/^(\d{4}-\d{2}-\d{2})/u);
  if (match === undefined || match === null) {
    throw new Error(`missing exact YYYY-MM-DD lead date: ${String(value)}`);
  }
  return match[1]!;
}

function enumerateCorpus(snapshot: LeadSnapshot): CorpusWork[] {
  const byId = new Map<string, CorpusWork>();
  for (const athlete of snapshot.athletes) {
    for (const page of athlete.pages) {
      if (!page.artistHtml?.includes("Erik Drost")) continue;
      for (const upstreamUrl of page.upstreamUrls) {
        const match = upstreamUrl.match(
          /^https:\/\/www\.flickr\.com\/photos\/edrost88\/(\d+)\/?$/u,
        );
        if (match === null) continue;
        const flickrId = match[1]!;
        const date = exactDate(page.dateTimeOriginal);
        const existing = byId.get(flickrId) ?? {
          athleteNames: [],
          commonsEvidence: [],
          derivedCaptureDate: date,
          flickrId,
          originalUrl: `https://www.flickr.com/photos/edrost88/${flickrId}/`,
        };
        // Third-party Commons crops sometimes record their crop/upload date.
        // The earliest reported date is the license-independent chronological
        // key; every conflicting value remains visible in commonsEvidence.
        existing.derivedCaptureDate =
          compareCodePoints(date, existing.derivedCaptureDate) < 0
            ? date
            : existing.derivedCaptureDate;
        if (!existing.athleteNames.includes(athlete.athleteName)) {
          existing.athleteNames.push(athlete.athleteName);
        }
        if (
          !existing.commonsEvidence.some(
            (row) => row.revisionId === page.fixedRevision.revisionId,
          )
        ) {
          existing.commonsEvidence.push({
            fixedRevisionPermalink: page.fixedRevision.permalink,
            reportedDate: date,
            revisionId: page.fixedRevision.revisionId,
            title: page.title,
          });
        }
        byId.set(flickrId, existing);
      }
    }
  }
  const rows = [...byId.values()];
  for (const row of rows) {
    row.athleteNames.sort(compareCodePoints);
    row.commonsEvidence.sort((a, b) => compareCodePoints(a.title, b.title));
  }
  return rows.sort(
    (a, b) =>
      compareCodePoints(a.derivedCaptureDate, b.derivedCaptureDate) ||
      compareCodePoints(a.flickrId, b.flickrId),
  );
}

/**
 * License-independent/date-stratified rule frozen before any Flickr license is
 * read: apportion 30 slots across observed capture years by largest remainder,
 * with at least one slot per year, then select evenly spaced stable-ID rows
 * inside each year. Only Commons capture dates and Flickr IDs are inputs.
 */
function selectSample(corpus: CorpusWork[]): {
  allocations: Array<{ available: number; selected: number; year: string }>;
  rows: CorpusWork[];
} {
  const desired = 30;
  const byYear = new Map<string, CorpusWork[]>();
  for (const row of corpus) {
    const year = row.derivedCaptureDate.slice(0, 4);
    const values = byYear.get(year) ?? [];
    values.push(row);
    byYear.set(year, values);
  }
  const years = [...byYear.keys()].sort(compareCodePoints);
  if (years.length > desired || corpus.length < desired) {
    throw new Error("corpus cannot satisfy the frozen 30-work allocation");
  }
  const remaining = desired - years.length;
  const quotas = years.map((year) => {
    const count = byYear.get(year)!.length;
    const rawExtra = (remaining * count) / corpus.length;
    return {
      available: count,
      extra: Math.floor(rawExtra),
      remainder: rawExtra - Math.floor(rawExtra),
      selected: 1 + Math.floor(rawExtra),
      year,
    };
  });
  let allocated = quotas.reduce((sum, row) => sum + row.selected, 0);
  const remainderOrder = [...quotas].sort(
    (a, b) => b.remainder - a.remainder || compareCodePoints(a.year, b.year),
  );
  for (const row of remainderOrder) {
    if (allocated >= desired) break;
    if (row.selected < row.available) {
      row.selected += 1;
      allocated += 1;
    }
  }
  if (
    allocated !== desired ||
    quotas.some((row) => row.selected > row.available)
  ) {
    throw new Error(
      `sample allocation produced ${allocated}, expected ${desired}`,
    );
  }
  const selected = quotas.flatMap((quota) => {
    const rows = byYear.get(quota.year)!;
    const indices = Array.from({ length: quota.selected }, (_, index) =>
      Math.floor(((index + 0.5) * rows.length) / quota.selected),
    );
    if (new Set(indices).size !== indices.length) {
      throw new Error(`${quota.year}: sample indices are not unique`);
    }
    return indices.map((index) => rows[index]!);
  });
  return {
    allocations: quotas.map(({ available, selected, year }) => ({
      available,
      selected,
      year,
    })),
    rows: selected.sort(
      (a, b) =>
        compareCodePoints(a.derivedCaptureDate, b.derivedCaptureDate) ||
        compareCodePoints(a.flickrId, b.flickrId),
    ),
  };
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

function requiredMatch(
  body: string,
  expression: RegExp,
  label: string,
): string {
  const value = body.match(expression)?.[1];
  if (value === undefined || value === "") {
    throw new Error(`Flickr response omitted ${label}`);
  }
  return decodeHtml(value.replaceAll("\\/", "/"));
}

function metadataTable(body: string): Record<string, string> {
  const entries = [
    ...body.matchAll(
      /<tr[^>]*>\s*<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gu,
    ),
  ].map((match) => [decodeHtml(match[1]!), decodeHtml(match[2]!)] as const);
  return Object.fromEntries(entries);
}

function licenseToken(url: string): string {
  const tokens: Record<string, string> = {
    "https://creativecommons.org/licenses/by/2.0/": "cc-by-2.0",
    "https://creativecommons.org/licenses/by-sa/2.0/": "cc-by-sa-2.0",
  };
  const token = tokens[url];
  if (token === undefined) throw new Error(`unexpected Flickr license ${url}`);
  return token;
}

async function inspectWork(work: CorpusWork) {
  const pageUrl = work.originalUrl;
  const metaUrl = `${pageUrl}meta/`;
  const sizesUrl = `${pageUrl}sizes/`;
  const [pageBody, metaBody, sizesBody] = await Promise.all([
    fetchText(pageUrl),
    fetchText(metaUrl),
    fetchText(sizesUrl),
  ]);
  const ownerNsid = requiredMatch(
    pageBody,
    /"owner":\{"pathAlias":"edrost88","username":"[^"]+","realname":"Erik Drost","displayname":"Erik Drost","nsid":"([^"]+)"/u,
    "owner NSID",
  );
  const schemaAuthor = requiredMatch(
    pageBody,
    /"author"\s*:\s*\{[\s\S]{0,500}?"name"\s*:\s*"([^"]+)"/u,
    "schema author",
  );
  const schemaLicenseUrl = requiredMatch(
    pageBody,
    /"license"\s*:\s*"(https:\/\/creativecommons\.org\/licenses\/[^"?]+\/)"/u,
    "schema license URL",
  );
  const pageCaptureTimestamp = requiredMatch(
    pageBody,
    new RegExp(
      `"dateTaken":"([^"]+)","datePosted":"[^"]+","id":"${work.flickrId}"`,
      "u",
    ),
    "capture timestamp",
  );
  const originalWidth = Number(
    requiredMatch(pageBody, /"oWidth":(\d+),"oHeight":\d+/u, "original width"),
  );
  const originalHeight = Number(
    requiredMatch(pageBody, /"oWidth":\d+,"oHeight":(\d+)/u, "original height"),
  );
  const sizeWidth = Number(
    requiredMatch(
      sizesBody,
      /(?:Original size|原本大小)[\s\S]{0,100}?\((\d+)\s*(?:&times;|×|x)\s*\d+\)/u,
      "sizes original width",
    ),
  );
  const sizeHeight = Number(
    requiredMatch(
      sizesBody,
      /(?:Original size|原本大小)[\s\S]{0,100}?\(\d+\s*(?:&times;|×|x)\s*(\d+)\)/u,
      "sizes original height",
    ),
  );
  if (
    ownerNsid !== account.accountId ||
    schemaAuthor !== account.canonicalPublicName ||
    originalWidth !== sizeWidth ||
    originalHeight !== sizeHeight
  ) {
    throw new Error(`${work.flickrId}: owner/author/native-dimension mismatch`);
  }
  const metadata = metadataTable(metaBody);
  return {
    ...work,
    exactLicenseToken: licenseToken(schemaLicenseUrl),
    flickrFacts: {
      author: schemaAuthor,
      captureTimestamp: pageCaptureTimestamp,
      licenseUrl: schemaLicenseUrl,
      ownerNsid,
      originalHeight,
      originalWidth,
      pageSha256: sha256Hex(pageBody),
    },
    metadataEvidence: {
      artist: metadata.Artist ?? null,
      cameraMake: metadata.Make ?? metadata["Camera Profiles Make"] ?? null,
      cameraModel:
        metadata.Model ??
        metadata["Camera Profiles Model"] ??
        metadata["Camera Profiles Camera Pretty Name"] ??
        null,
      copyright: metadata.Copyright ?? null,
      dateTimeOriginal: metadata["Date and Time (Original)"] ?? null,
      exifBodySha256: sha256Hex(metaBody),
      exifUrl: metaUrl,
      lens: metadata.Lens ?? metadata["Lens Model"] ?? null,
    },
    nativeSizeEvidence: {
      height: sizeHeight,
      sizesBodySha256: sha256Hex(sizesBody),
      sizesUrl,
      width: sizeWidth,
    },
  };
}

async function main(): Promise<void> {
  const snapshotBytes = readFileSync(resolve(root, leadPath), "utf8");
  const snapshot = parseStrictJson(snapshotBytes) as unknown as LeadSnapshot;
  const corpus = enumerateCorpus(snapshot);
  const sample = selectSample(corpus);
  if (corpus.length < 50 || sample.rows.length !== 30) {
    throw new Error(
      `corpus/sample floor failed: ${corpus.length}/${sample.rows.length}`,
    );
  }

  if (process.argv.includes("--check")) {
    const bytes = readFileSync(resolve(root, outputPath), "utf8");
    const parsed = parseStrictJson(bytes) as {
      account: typeof account;
      corpus: CorpusWork[];
      leadSnapshotSha256: string;
      sample: {
        allocations: typeof sample.allocations;
        rows: Array<{ flickrId: string }>;
      };
      schemaVersion: number;
    };
    if (
      parsed.schemaVersion !== 1 ||
      canonicalJson(parsed) !== bytes ||
      parsed.leadSnapshotSha256 !== sha256Hex(snapshotBytes) ||
      JSON.stringify(parsed.account) !== JSON.stringify(account) ||
      JSON.stringify(parsed.corpus) !== JSON.stringify(corpus) ||
      JSON.stringify(parsed.sample.allocations) !==
        JSON.stringify(sample.allocations) ||
      parsed.sample.rows.map((row) => row.flickrId).join("\0") !==
        sample.rows.map((row) => row.flickrId).join("\0")
    ) {
      throw new Error(`${outputPath}: stale or non-canonical evidence`);
    }
    console.log(
      `Decision 14 Erik Drost evidence check passed (${corpus.length} corpus / 30 sample)`,
    );
    return;
  }

  const inspected = [];
  for (const [index, row] of sample.rows.entries()) {
    console.log(`[${index + 1}/30] ${row.flickrId}`);
    inspected.push(await inspectWork(row));
  }
  const result = {
    account,
    capturedAt,
    corpus,
    corpusRule:
      "From the already-frozen 16-athlete fixed-query snapshot, retain each unique numeric Flickr original whose credited artist contains Erik Drost and whose upstream URL matches the exact photographer-owned /photos/edrost88/<numeric-id>/ boundary; collapse Commons crops/import duplicates by Flickr ID; sort by Commons DateTimeOriginal date then stable numeric ID. Artist, account path, date, and identity are filters; no Commons or Flickr license field is used.",
    leadSnapshotPath: leadPath,
    leadSnapshotSha256: sha256Hex(snapshotBytes),
    sample: {
      allocations: sample.allocations,
      licenseIndependent: true,
      rows: inspected,
      rule: "Before reading any Flickr license: group the enumerated corpus by UTC capture year; assign one slot per represented year; apportion the remaining slots proportional to each year's corpus size by largest remainder with year as stable tie-break; within each year sort by capture date then Flickr ID and select floor((index + 0.5) * available / quota).",
      targetSize: 30,
    },
    schemaVersion: 1,
  };
  const bytes = canonicalJson(result);
  mkdirSync(resolve(root, outputPath, ".."), { recursive: true });
  writeFileSync(resolve(root, outputPath), bytes);
  console.log(`${outputPath} ${sha256Hex(bytes)}`);
}

await main();
