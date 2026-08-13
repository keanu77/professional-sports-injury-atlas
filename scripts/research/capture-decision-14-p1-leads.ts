import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import { DECISION_14_TARGET_ATHLETES } from "../../src/lib/contracts/decision-14-photo-contract";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const outputPath =
  "docs/reviews/evidence/decision-14/p1/commons-fixed-query-leads.v1.json";
const apiUrl = "https://commons.wikimedia.org/w/api.php";
const capturedAt = "2026-08-13T13:40:00Z";
const userAgent =
  "ProfessionalSportsInjuryAtlas-Decision14/1.0 (private medical-review research; contact via repository owner)";

const queryTemplates = [
  'Commons API namespace 6: intitle:"<athlete>"',
  'site:commons.wikimedia.org/wiki/File "<athlete>" "media day"',
  'site:commons.wikimedia.org/wiki/File "<athlete>" "press conference"',
  'site:commons.wikimedia.org/wiki/File "<athlete>" (parade OR award OR fan OR "public event")',
  'site:commons.wikimedia.org/wiki/File "<athlete>" (preseason OR warm-up OR warmup)',
  'site:flickr.com/photos "<athlete>" ("media day" OR parade OR "public event" OR game OR warm-up)',
] as const;

interface SearchResponse {
  continue?: { sroffset: number };
  query?: {
    search: Array<{ pageid: number; title: string }>;
    searchinfo: { totalhits: number };
  };
}

interface PageResponse {
  query?: {
    pages: Array<{
      fullurl: string;
      imageinfo?: Array<{
        extmetadata?: Record<string, { value?: string }>;
        height: number;
        mime: string;
        sha1: string;
        size: number;
        timestamp: string;
        url: string;
        user: string;
        width: number;
      }>;
      pageid: number;
      lastrevid: number;
      revisions?: Array<{
        revid: number;
        timestamp: string;
        user: string;
      }>;
      title: string;
    }>;
  };
}

function textValue(
  extmetadata: Record<string, { value?: string }> | undefined,
  key: string,
): string | null {
  const value = extmetadata?.[key]?.value;
  return typeof value === "string" && value !== "" ? value : null;
}

function externalUrls(...values: Array<string | null>): string[] {
  const found = values.flatMap((value) =>
    value === null
      ? []
      : [...value.matchAll(/https?:\/\/[^\s"'<>]+/gu)].map((match) =>
          match[0]!.replace(/&amp;/gu, "&"),
        ),
  );
  return [...new Set(found)].sort(compareCodePoints);
}

async function getJson<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(apiUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": userAgent },
      });
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfterSeconds = Number(
            response.headers.get("retry-after") ?? "5",
          );
          await new Promise((resolveDelay) =>
            setTimeout(
              resolveDelay,
              Math.max(5, retryAfterSeconds, attempt * 2) * 1000,
            ),
          );
        }
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const json = (await response.json()) as T;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 750));
      return json;
    } catch (error) {
      lastError = error;
      if (attempt < 8) {
        await new Promise((resolveDelay) =>
          setTimeout(resolveDelay, attempt * 500),
        );
      }
    }
  }
  throw lastError;
}

async function searchAthlete(athleteName: string) {
  const searchQuery = `intitle:"${athleteName}"`;
  const rows: Array<{ pageid: number; title: string }> = [];
  let totalHits: number | null = null;
  let offset: number | undefined;
  do {
    const response = await getJson<SearchResponse>({
      action: "query",
      format: "json",
      formatversion: "2",
      list: "search",
      origin: "*",
      srlimit: "500",
      srnamespace: "6",
      sroffset: String(offset ?? 0),
      srsearch: searchQuery,
    });
    if (response.query === undefined) {
      throw new Error(`Commons search omitted query for ${athleteName}`);
    }
    totalHits ??= response.query.searchinfo.totalhits;
    rows.push(...response.query.search);
    offset = response.continue?.sroffset;
  } while (offset !== undefined);
  if (totalHits !== rows.length) {
    throw new Error(
      `${athleteName}: Commons totalhits ${totalHits} != captured ${rows.length}`,
    );
  }

  const pages = [];
  for (let index = 0; index < rows.length; index += 50) {
    const batch = rows.slice(index, index + 50);
    const response = await getJson<PageResponse>({
      action: "query",
      format: "json",
      formatversion: "2",
      iiextmetadatafilter:
        "Artist|Attribution|Categories|Copyrighted|Credit|DateTimeOriginal|ImageDescription|LicenseShortName|LicenseUrl|Restrictions|Source|UsageTerms",
      iiprop: "url|size|sha1|mime|extmetadata|timestamp|user|commonmetadata",
      inprop: "url",
      origin: "*",
      pageids: batch.map((row) => row.pageid).join("|"),
      prop: "info|imageinfo|revisions",
      rvprop: "ids|timestamp|user",
    });
    if (response.query === undefined) {
      throw new Error(`Commons page query omitted result for ${athleteName}`);
    }
    for (const page of response.query.pages) {
      const image = page.imageinfo?.[0];
      const revision = page.revisions?.[0];
      if (
        image === undefined ||
        !Number.isInteger(page.lastrevid) ||
        revision === undefined ||
        revision.revid !== page.lastrevid
      ) {
        throw new Error(
          `${page.title}: missing image or matching current revision facts`,
        );
      }
      const metadata = image.extmetadata;
      const artistHtml = textValue(metadata, "Artist");
      const attributionHtml = textValue(metadata, "Attribution");
      const creditHtml = textValue(metadata, "Credit");
      const sourceHtml = textValue(metadata, "Source");
      pages.push({
        artistHtml,
        attributionHtml,
        categories: textValue(metadata, "Categories"),
        commonsCurrentOriginal: {
          byteLength: image.size,
          height: image.height,
          mimeType: image.mime,
          sha1: image.sha1,
          timestamp: image.timestamp,
          url: image.url,
          width: image.width,
        },
        commonsDescriptionUrl: page.fullurl,
        commonsUploader: image.user,
        copyrightStatus: textValue(metadata, "Copyrighted"),
        creditHtml,
        dateTimeOriginal: textValue(metadata, "DateTimeOriginal"),
        fixedRevision: {
          permalink: `https://commons.wikimedia.org/w/index.php?title=${encodeURIComponent(page.title)}&oldid=${page.lastrevid}`,
          revisionId: page.lastrevid,
          timestamp: revision.timestamp,
          user: revision.user,
        },
        imageDescriptionHtml: textValue(metadata, "ImageDescription"),
        licenseShortName: textValue(metadata, "LicenseShortName"),
        licenseUrl: textValue(metadata, "LicenseUrl"),
        pageId: page.pageid,
        restrictions: textValue(metadata, "Restrictions"),
        sourceHtml,
        title: page.title,
        upstreamUrls: externalUrls(
          artistHtml,
          attributionHtml,
          creditHtml,
          sourceHtml,
        ),
        usageTerms: textValue(metadata, "UsageTerms"),
      });
    }
  }
  pages.sort((a, b) => compareCodePoints(a.title, b.title));
  return {
    athleteName,
    commonsApi: {
      apiUrl,
      capturedCount: pages.length,
      namespace: 6,
      query: searchQuery,
      totalHits,
    },
    instantiatedQueries: queryTemplates.map((template) =>
      template.replaceAll("<athlete>", athleteName),
    ),
    pages,
  };
}

async function main(): Promise<void> {
  if (process.argv.includes("--check")) {
    const bytes = readFileSync(resolve(root, outputPath), "utf8");
    const parsed = parseStrictJson(bytes) as {
      athletes: Array<{
        athleteName: string;
        commonsApi: { capturedCount: number; totalHits: number };
        pages: unknown[];
      }>;
      queryTemplates: string[];
      schemaVersion: number;
    };
    if (
      parsed.schemaVersion !== 1 ||
      canonicalJson(parsed) !== bytes ||
      parsed.queryTemplates.join("\0") !== queryTemplates.join("\0") ||
      parsed.athletes.map((row) => row.athleteName).join("\0") !==
        DECISION_14_TARGET_ATHLETES.join("\0") ||
      parsed.athletes.some(
        (row) =>
          row.pages.length !== row.commonsApi.capturedCount ||
          row.pages.length !== row.commonsApi.totalHits,
      )
    ) {
      throw new Error("Decision 14 Phase 1 lead snapshot is invalid");
    }
    console.log(
      `Decision 14 Phase 1 lead snapshot OK — ${sha256Hex(bytes)} (${parsed.athletes.length}/16 athletes)`,
    );
    return;
  }

  const athletes = [];
  for (const athleteName of DECISION_14_TARGET_ATHLETES) {
    athletes.push(await searchAthlete(athleteName));
  }
  const snapshot = {
    athletes,
    capturedAt,
    evidenceRole:
      "fixed-query lead discovery only; no candidate adoption or allowlist finding",
    queryTemplates,
    schemaVersion: 1,
    scopeId: "decision-14-fixed-16-photographer-lead-discovery",
  };
  const bytes = canonicalJson(snapshot);
  mkdirSync(resolve(root, "docs/reviews/evidence/decision-14/p1"), {
    recursive: true,
  });
  writeFileSync(resolve(root, outputPath), bytes);
  console.log(
    `wrote ${outputPath} — ${sha256Hex(bytes)} (${athletes.length}/16 athletes, ${athletes.reduce((sum, row) => sum + row.pages.length, 0)} Commons rows)`,
  );
}

await main();
