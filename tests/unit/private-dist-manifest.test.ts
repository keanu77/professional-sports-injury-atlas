import {
  mkdirSync,
  mkdtempSync,
  lstatSync,
  readFileSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  reviewFixtureClassicCase,
  reviewFixtureOverview,
  reviewFixtureUpdate,
  selectReviewFixtureCases,
} from "../../src/data/review-fixtures";
import { computeCaseContentDigest } from "../../src/lib/cases/digest";
import { computeInjuryOverviewDigest } from "../../src/lib/cases/injury-overview-digest";
import { LISTING_PAGE_SIZE } from "../../src/lib/cases/pagination";
import { computeQuarterlyUpdateDigest } from "../../src/lib/cases/update-digest";
import type { VideoSourceToken } from "../../src/lib/cases/video-source";
import {
  ARTIFACT_IDENTITY_META_NAME,
  canonicalRequestPathForBuildPath,
  encodeArtifactIdentity,
  parseArtifactManifestBytes,
  PRIVATE_HTTP_HEADER_POLICY_SHA256,
  type ArtifactIdentity,
} from "../../src/lib/governance/artifact-manifest";
import {
  canonicalJson,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
} from "../../src/lib/contracts/canonical";
import {
  NOINDEX_ROBOTS_META,
  DISALLOW_ALL_ROBOTS_TXT,
} from "../../src/lib/governance/build-mode";
import { PRIVATE_REVIEW_MAX_FILE_BYTES } from "../../src/lib/governance/private-review-limits";
import {
  parseReviewSetManifestBytes,
  type ReviewSetManifest,
} from "../../src/lib/governance/review-set";
import { computeRenderedSetDigest } from "../../src/lib/routes/static-paths";
import {
  buildPrivateDistManifestFromDisk,
  contentTypeForBuildPath,
  walkPrivateDist,
  writePrivateDistManifest,
} from "../../scripts/private-hosting/generate-private-dist-manifest";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function write(root: string, path: string, bytes: string | Uint8Array): void {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
}

function html(identity: ArtifactIdentity, body = "fixture"): string {
  return (
    '<!doctype html><html lang="en"><head>' +
    `<meta name="robots" content="${NOINDEX_ROBOTS_META}">` +
    `<meta name="${ARTIFACT_IDENTITY_META_NAME}" content="${encodeArtifactIdentity(identity)}">` +
    `<title>fixture</title></head><body>${body}</body></html>`
  );
}

interface FixtureRecord {
  id: string;
  slug: string;
  injuryCode: string;
  sportCode: string;
  leagueCode: string;
  competitionCode: string;
  season: string;
  eventYear: number;
  eventDate: string;
  athleteName: string;
  teamName: string;
  opponentName: string;
  isClassic: boolean;
  classicReason: string | null;
  mechanismTags: string[];
  confirmationStatus: string;
  videoSource: VideoSourceToken;
  workflowStatus: string;
}

interface Fixture {
  root: string;
  reviewSet: ReviewSetManifest;
  reviewSetBytes: string;
  caseIds: string[];
  records: FixtureRecord[];
  sourceCaseIndex: {
    manifest: any;
    shards: Array<{ buildPath: string; records: FixtureRecord[] }>;
  };
}

function homeDigestFor(reviewSet: ReviewSetManifest): string {
  const cases = reviewSet.cases
    .map((entry) => ({
      caseId: entry.caseId,
      clinicalDigest: entry.clinicalDigest,
    }))
    .sort((a, b) => compareCodePoints(a.caseId, b.caseId));
  return sha256Hex(canonicalJson({ schemaVersion: 1, cases }));
}

function subsetDigestFor(
  reviewSet: ReviewSetManifest,
  recordIds: readonly string[],
): string {
  const digestById = new Map(
    reviewSet.cases.map((entry) => [entry.caseId, entry.clinicalDigest]),
  );
  const cases = [...recordIds]
    .sort(compareCodePoints)
    .map((caseId) => ({ caseId, clinicalDigest: digestById.get(caseId)! }));
  return sha256Hex(canonicalJson({ schemaVersion: 1, cases }));
}

function ordered(records: readonly FixtureRecord[]): FixtureRecord[] {
  return [...records].sort((left, right) => {
    if (left.eventDate !== right.eventDate) {
      return left.eventDate < right.eventDate ? 1 : -1;
    }
    return compareCodePoints(left.slug, right.slug);
  });
}

function cardMarkers(records: readonly FixtureRecord[]): string {
  return records
    .map((record) => `<article data-case-card="${record.id}"></article>`)
    .join("");
}

function fixtureUpdateIds(): string[] {
  return [
    ...new Set([
      ...reviewFixtureUpdate.addedCases.map((entry) => entry.caseId),
      ...reviewFixtureUpdate.updatedCases.map((entry) => entry.caseId),
      ...reviewFixtureUpdate.retiredCases.map((entry) => entry.caseId),
      ...reviewFixtureUpdate.unavailableCases.map((entry) => entry.caseId),
    ]),
  ].sort(compareCodePoints);
}

function writeHtmlFixtureRoutes(
  root: string,
  reviewSet: ReviewSetManifest,
  records: readonly FixtureRecord[],
): void {
  const writeRoute = (
    buildPath: string,
    identity: ArtifactIdentity,
    body = "fixture",
  ): void => write(root, `dist/${buildPath}`, html(identity, body));
  const identity = (
    pageId: string,
    recordIds: readonly string[],
    digest: string | null,
  ): ArtifactIdentity => ({
    kind: "html-page",
    pageIds: [pageId],
    recordIds: [...recordIds].sort(compareCodePoints),
    digest,
    shardIds: [],
  });
  const caseDigestById = new Map(
    reviewSet.cases.map((entry) => [entry.caseId, entry.clinicalDigest]),
  );
  const caseIds = reviewSet.cases.map((entry) => entry.caseId);
  writeRoute("index.html", identity("/", caseIds, homeDigestFor(reviewSet)));
  for (const [path, pageId] of [
    ["about/index.html", "/about/"],
    ["credits-notices/index.html", "/credits-notices/"],
    ["source-policy/index.html", "/source-policy/"],
    ["review/component-lab/index.html", "/review/component-lab/"],
  ] as const) {
    writeRoute(path, identity(pageId, [], null));
  }
  for (const record of records) {
    const pageId = `/cases/${record.slug}/`;
    writeRoute(
      `cases/${record.slug}/index.html`,
      identity(pageId, [record.id], caseDigestById.get(record.id)!),
      `<article data-atlas-view="case-detail" data-case-id="${record.id}"></article>`,
    );
  }

  const selectorRecords = ordered(records);
  for (const overview of reviewSet.overviews) {
    const injuryRecords = selectorRecords.filter(
      (record) => record.injuryCode === overview.injuryCode,
    );
    const pageCount = Math.max(
      1,
      Math.ceil(injuryRecords.length / LISTING_PAGE_SIZE),
    );
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const pageRecords = injuryRecords.slice(
        (pageNumber - 1) * LISTING_PAGE_SIZE,
        pageNumber * LISTING_PAGE_SIZE,
      );
      const pageId =
        pageNumber === 1
          ? `/injuries/${overview.injuryCode}/`
          : `/injuries/${overview.injuryCode}/page/${pageNumber}/`;
      const buildPath = `${pageId.slice(1)}index.html`;
      writeRoute(
        buildPath,
        identity(
          pageId,
          pageRecords.map((record) => record.id),
          pageNumber === 1
            ? overview.overviewDigest
            : subsetDigestFor(
                reviewSet,
                pageRecords.map((record) => record.id),
              ),
        ),
        `${
          pageNumber === 1
            ? `<section data-injury-overview="${overview.injuryCode}"></section>`
            : ""
        }<section data-static-listing>${cardMarkers(pageRecords)}</section>`,
      );
    }
  }

  for (const leagueCode of [
    ...new Set(records.map((record) => record.leagueCode)),
  ].sort(compareCodePoints)) {
    const leagueRecords = selectorRecords.filter(
      (record) => record.leagueCode === leagueCode,
    );
    const pageCount = Math.max(
      1,
      Math.ceil(leagueRecords.length / LISTING_PAGE_SIZE),
    );
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const pageRecords = leagueRecords.slice(
        (pageNumber - 1) * LISTING_PAGE_SIZE,
        pageNumber * LISTING_PAGE_SIZE,
      );
      const pageId =
        pageNumber === 1
          ? `/leagues/${leagueCode}/`
          : `/leagues/${leagueCode}/page/${pageNumber}/`;
      writeRoute(
        `${pageId.slice(1)}index.html`,
        identity(
          pageId,
          pageRecords.map((record) => record.id),
          subsetDigestFor(
            reviewSet,
            pageRecords.map((record) => record.id),
          ),
        ),
        `<section data-static-listing>${cardMarkers(pageRecords)}</section>`,
      );
    }
  }

  if (reviewSet.currentUpdate !== null) {
    const updateIds = records.slice(0, 3).map((record) => record.id);
    const pageId = `/updates/${reviewSet.currentUpdate.updateId}/`;
    writeRoute(
      `${pageId.slice(1)}index.html`,
      identity(pageId, updateIds, reviewSet.currentUpdate.updateDigest),
      `<article data-atlas-view="quarterly-update" data-update-id="${reviewSet.currentUpdate.updateId}">${updateIds
        .map((caseId) => `<li data-update-case-id="${caseId}"></li>`)
        .join("")}</article>`,
    );
  }

  const fixtureCases = selectReviewFixtureCases("review");
  const fixtureCaseIds = fixtureCases
    .map((record) => record.id)
    .sort(compareCodePoints);
  writeRoute(
    "review/fixtures/case-detail/index.html",
    identity(
      "/review/fixtures/case-detail/",
      [reviewFixtureClassicCase.id],
      computeCaseContentDigest(reviewFixtureClassicCase),
    ),
    `<article data-atlas-view="case-detail" data-case-id="${reviewFixtureClassicCase.id}"></article>`,
  );
  writeRoute(
    "review/fixtures/injury-overview/index.html",
    identity(
      "/review/fixtures/injury-overview/",
      [],
      computeInjuryOverviewDigest(reviewFixtureOverview),
    ),
    `<article data-atlas-view="injury-overview"><section data-injury-overview="${reviewFixtureOverview.injuryCode}"></section></article>`,
  );
  writeRoute(
    "review/fixtures/league-listing/index.html",
    identity(
      "/review/fixtures/league-listing/",
      fixtureCaseIds,
      computeRenderedSetDigest(fixtureCases),
    ),
    `<article data-atlas-view="league-listing"><section data-static-listing>${fixtureCaseIds
      .map((caseId) => `<article data-case-card="${caseId}"></article>`)
      .join("")}</section></article>`,
  );
  const updateIds = fixtureUpdateIds();
  writeRoute(
    "review/fixtures/latest-update/index.html",
    identity(
      "/review/fixtures/latest-update/",
      updateIds,
      computeQuarterlyUpdateDigest(reviewFixtureUpdate),
    ),
    `<article data-atlas-view="quarterly-update" data-update-id="${reviewFixtureUpdate.id}">${updateIds
      .map((caseId) => `<li data-update-case-id="${caseId}"></li>`)
      .join("")}</article>`,
  );
}

function fixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), "atlas-private-dist-"));
  roots.push(root);
  const reviewSetBytes = readFileSync(
    new URL("../../review/review-set.v1.json", import.meta.url),
    "utf8",
  );
  const parsed = parseReviewSetManifestBytes(reviewSetBytes);
  if (parsed.manifest === null) throw new Error("real review set is invalid");
  const reviewSet = parsed.manifest;
  const caseIds = reviewSet.cases
    .map((entry) => entry.caseId)
    .sort(compareCodePoints);
  const injuryCodes = reviewSet.overviews
    .map((entry) => entry.injuryCode)
    .sort(compareCodePoints);
  const records = caseIds.map((id, index): FixtureRecord => ({
    id,
    slug: `fixture-case-${String(index + 1).padStart(2, "0")}`,
    injuryCode: injuryCodes[index % injuryCodes.length]!,
    sportCode: "basketball",
    leagueCode: "nba",
    competitionCode: "nba-regular-season",
    season: "2025-26",
    eventYear: 2026,
    eventDate: `2026-07-${String(index + 1).padStart(2, "0")}`,
    athleteName: `Fixture Athlete ${index + 1}`,
    teamName: "Fixture Team",
    opponentName: "Fixture Opponent",
    isClassic: false,
    classicReason: null,
    mechanismTags: ["unclear"],
    confirmationStatus: "confirmed",
    videoSource: "youtube-embed",
    workflowStatus: "approved",
  }));

  write(root, "review/review-set.v1.json", reviewSetBytes);
  write(
    root,
    "ops/http-header-policy.v1.json",
    readFileSync(
      new URL("../../ops/http-header-policy.v1.json", import.meta.url),
    ),
  );
  writeHtmlFixtureRoutes(root, reviewSet, records);
  write(root, "dist/review/review-set.json", reviewSetBytes);

  const injuries = injuryCodes.map((injuryCode) => {
    const shard = ordered(records).filter(
      (record) => record.injuryCode === injuryCode,
    );
    if (shard.length > 0) {
      write(
        root,
        `dist/case-index/${injuryCode}/1.json`,
        JSON.stringify(shard),
      );
    }
    return {
      injuryCode,
      entryCount: shard.length,
      shardCount: shard.length > 0 ? 1 : 0,
    };
  });
  const caseIndexManifest = {
    schemaVersion: 1,
    mode: "review",
    shardSize: 100,
    totalEntries: caseIds.length,
    injuries,
  };
  write(
    root,
    "dist/case-index/manifest.json",
    JSON.stringify(caseIndexManifest),
  );
  write(root, "dist/robots.txt", DISALLOW_ALL_ROBOTS_TXT);
  write(root, "dist/_astro/site.css", "body{color:#111}");
  write(root, "dist/_astro/font.woff2", new Uint8Array([0, 1, 2, 3]));
  expect(canonicalRequestPathForBuildPath("case-index/acl/1.json")).toBe(
    "/case-index/acl/1.json",
  );
  return {
    root,
    reviewSet,
    reviewSetBytes,
    caseIds,
    records,
    sourceCaseIndex: {
      manifest: caseIndexManifest,
      shards: injuryCodes
        .map((injuryCode) => ({
          buildPath: `case-index/${injuryCode}/1.json`,
          records: ordered(records).filter(
            (record) => record.injuryCode === injuryCode,
          ),
        }))
        .filter((shard) => shard.records.length > 0),
    },
  };
}

function fixtureSourceState(fx: Fixture) {
  return {
    commit: "a".repeat(40),
    dirty: false,
    rendererTreeDigest: fx.reviewSet.rendererTreeDigest,
    supportingDataDigest: fx.reviewSet.supportingDataDigest,
    contentAuthoritySnapshotDigest: fx.reviewSet.contentAuthoritySnapshotDigest,
    updates:
      fx.reviewSet.currentUpdate === null
        ? []
        : [
            {
              updateId: fx.reviewSet.currentUpdate.updateId,
              updateDigest: fx.reviewSet.currentUpdate.updateDigest,
              recordIds: fx.records.slice(0, 3).map((record) => record.id),
            },
          ],
    caseIndex: {
      manifest: structuredClone(fx.sourceCaseIndex.manifest),
      shards: structuredClone(fx.sourceCaseIndex.shards),
    },
  };
}

function generate(fx: Fixture, overrides: Record<string, unknown> = {}) {
  return buildPrivateDistManifestFromDisk({
    root: fx.root,
    buildMode: "review",
    sourceState: fixtureSourceState(fx),
    now: new Date("2026-08-08T15:00:00Z"),
    ...overrides,
  });
}

describe("private dist manifest generation", () => {
  it("walks every real file and emits deterministic canonical path, type, and identity metadata", () => {
    const fx = fixture();
    const first = generate(fx);
    const second = generate(fx);
    expect(second).toEqual(first);
    expect(first.generatedAt).toBe("2026-08-08T15:00:00Z");
    expect(first.headerPolicyDigest).toBe(PRIVATE_HTTP_HEADER_POLICY_SHA256);
    expect(first.files.map((entry) => entry.buildPath)).toEqual(
      [...first.files.map((entry) => entry.buildPath)].sort(compareCodePoints),
    );
    expect(first.files.map((entry) => entry.buildPath)).toEqual(
      walkPrivateDist(join(fx.root, "dist")),
    );
    expect(
      first.files.find((entry) => entry.buildPath === "index.html")
        ?.requestPath,
    ).toBe("/");
    const firstRecord = fx.records[0]!;
    expect(
      first.files.find(
        (entry) => entry.buildPath === `cases/${firstRecord.slug}/index.html`,
      )?.requestPath,
    ).toBe(`/cases/${firstRecord.slug}/`);
    expect(
      first.files.find((entry) => entry.buildPath === "_astro/site.css")
        ?.identity.kind,
    ).toBe("asset");
    expect(
      first.files.find(
        (entry) => entry.buildPath === "case-index/manifest.json",
      )?.identity.shardIds,
    ).toEqual(
      fx.reviewSet.overviews
        .map((entry) => `/case-index/${entry.injuryCode}/1.json`)
        .sort(compareCodePoints),
    );
    const firstInjuryCode = fx.reviewSet.overviews[0]!.injuryCode;
    expect(
      first.files.find(
        (entry) => entry.buildPath === `case-index/${firstInjuryCode}/1.json`,
      )?.identity.recordIds,
    ).toEqual(
      fx.records
        .filter((record) => record.injuryCode === firstInjuryCode)
        .map((record) => record.id)
        .sort(compareCodePoints),
    );

    const bytes = canonicalJson(first);
    expect(canonicalJson(parseStrictJson(bytes))).toBe(bytes);
    expect(parseArtifactManifestBytes(bytes).manifest).toEqual(first);
  });

  it("accepts an exact 32 MiB sparse asset and rejects one byte more before snapshot reading", () => {
    const fx = fixture();
    const buildPath = "_astro/private-review-boundary.jpg";
    const target = join(fx.root, "dist", buildPath);
    writeFileSync(target, "");
    truncateSync(target, PRIVATE_REVIEW_MAX_FILE_BYTES);

    const manifest = generate(fx);
    expect(
      manifest.files.find((file) => file.buildPath === buildPath)?.byteLength,
    ).toBe(PRIVATE_REVIEW_MAX_FILE_BYTES);

    truncateSync(target, PRIVATE_REVIEW_MAX_FILE_BYTES + 1);
    const stableError = `private-review file ${buildPath} exceeds the ${PRIVATE_REVIEW_MAX_FILE_BYTES}-byte limit`;
    expect(() => walkPrivateDist(join(fx.root, "dist"))).toThrow(stableError);
    expect(() => generate(fx)).toThrow(stableError);
    expect(lstatSync(target).size).toBe(PRIVATE_REVIEW_MAX_FILE_BYTES + 1);
  });

  it("maps the complete supported content-type set and refuses unknown/precompressed output", () => {
    expect(contentTypeForBuildPath("a.html")).toBe("text/html; charset=utf-8");
    expect(contentTypeForBuildPath("a.json")).toBe("application/json");
    expect(contentTypeForBuildPath("a.js")).toBe(
      "text/javascript; charset=utf-8",
    );
    expect(contentTypeForBuildPath("a.css")).toBe("text/css; charset=utf-8");
    expect(contentTypeForBuildPath("a.txt")).toBe("text/plain; charset=utf-8");
    expect(contentTypeForBuildPath("a.svg")).toBe("image/svg+xml");
    expect(contentTypeForBuildPath("a.png")).toBe("image/png");
    expect(contentTypeForBuildPath("a.jpg")).toBe("image/jpeg");
    expect(contentTypeForBuildPath("a.webp")).toBe("image/webp");
    expect(contentTypeForBuildPath("a.avif")).toBe("image/avif");
    expect(contentTypeForBuildPath("a.woff")).toBe("font/woff");
    expect(contentTypeForBuildPath("a.woff2")).toBe("font/woff2");
    expect(() => contentTypeForBuildPath("a.bin")).toThrow(/content type/i);
    expect(() => contentTypeForBuildPath("a.js.gz")).toThrow(/compressed/i);
  });

  it("requires exactly one canonical identity and exact review robots meta on every HTML page", () => {
    const fx = fixture();
    const target = join(fx.root, "dist/index.html");
    const original = readFileSync(target, "utf8");

    writeFileSync(
      target,
      original.replace(
        new RegExp(`<meta name="${ARTIFACT_IDENTITY_META_NAME}"[^>]*>`),
        "",
      ),
    );
    expect(() => generate(fx)).toThrow(/artifact identity/i);

    const identityTag = original.match(/<meta[^>]+identity[^>]+>/)![0];
    writeFileSync(
      target,
      original.replace(identityTag, `<!--${identityTag}-->`),
    );
    expect(() => generate(fx)).toThrow(/artifact identity/i);

    writeFileSync(target, original.replace("</head>", `${identityTag}</head>`));
    expect(() => generate(fx)).toThrow(/artifact identity/i);

    writeFileSync(
      target,
      original.replace(NOINDEX_ROBOTS_META, "index,follow"),
    );
    expect(() => generate(fx)).toThrow(/robots meta/i);

    writeFileSync(
      target,
      html({
        kind: "html-page",
        pageIds: ["/wrong/"],
        recordIds: fx.caseIds,
        digest: sha256Hex(fx.reviewSetBytes),
        shardIds: [],
      }),
    );
    expect(() => generate(fx)).toThrow(/page identity/i);

    writeFileSync(
      target,
      html({
        kind: "html-page",
        pageIds: ["/"],
        recordIds: ["CASE-UNKNOWN"],
        digest: sha256Hex(fx.reviewSetBytes),
        shardIds: [],
      }),
    );
    expect(() => generate(fx)).toThrow(/unknown identity record/i);

    const caseRecord = fx.records[0]!;
    const caseTarget = join(
      fx.root,
      `dist/cases/${caseRecord.slug}/index.html`,
    );
    writeFileSync(
      target,
      html({
        kind: "html-page",
        pageIds: ["/"],
        recordIds: fx.caseIds,
        digest: homeDigestFor(fx.reviewSet),
        shardIds: [],
      }),
    );
    writeFileSync(
      caseTarget,
      html(
        {
          kind: "html-page",
          pageIds: [`/cases/${caseRecord.slug}/`],
          recordIds: [caseRecord.id],
          digest: fx.reviewSet.cases.find(
            (entry) => entry.caseId !== caseRecord.id,
          )!.clinicalDigest,
          shardIds: [],
        },
        `<article data-atlas-view="case-detail" data-case-id="${caseRecord.id}"></article>`,
      ),
    );
    expect(() => generate(fx)).toThrow(/identity digest/i);
  });

  it("cross-checks real body markers and ignores inert spoof text", () => {
    const fx = fixture();
    const record = fx.records[0]!;
    const target = join(fx.root, `dist/cases/${record.slug}/index.html`);
    const original = readFileSync(target, "utf8");
    const inertSpoofs =
      `<!--<span data-case-id="SPOOF-COMMENT"></span>-->` +
      `<script>"<span data-case-id='SPOOF-SCRIPT'></span>"</script>` +
      `<style>.x{content:"<span data-case-id='SPOOF-STYLE'>"}</style>` +
      `<template><span data-case-id="SPOOF-TEMPLATE"></span></template>` +
      `<noscript><span data-case-id="SPOOF-NOSCRIPT"></span></noscript>`;
    writeFileSync(target, original.replace("<body>", `<body>${inertSpoofs}`));
    expect(() => generate(fx)).not.toThrow();

    writeFileSync(
      target,
      original.replace(
        "</body>",
        `<span data-case-id="${record.id}"></span></body>`,
      ),
    );
    expect(() => generate(fx)).toThrow(/exactly one data-case-id/i);

    writeFileSync(
      target,
      original.replace(`data-case-id="${record.id}"`, 'data-case-id="WRONG"'),
    );
    expect(() => generate(fx)).toThrow(/data-case-id/i);

    writeFileSync(target, original);
    const leagueTarget = join(fx.root, "dist/leagues/nba/index.html");
    const leagueHtml = readFileSync(leagueTarget, "utf8");
    writeFileSync(
      leagueTarget,
      leagueHtml.replace(/data-case-card="[^"]+"/u, 'data-case-card="WRONG"'),
    );
    expect(() => generate(fx)).toThrow(/listing card markers/i);

    const cardTags = [
      ...leagueHtml.matchAll(/<article data-case-card="[^"]+"><\/article>/gu),
    ].map((match) => match[0]);
    writeFileSync(
      leagueTarget,
      leagueHtml.replace(cardTags.join(""), [...cardTags].reverse().join("")),
    );
    expect(() => generate(fx)).toThrow(/card order/i);
  });

  it("binds a real update meta and body to the strict source update IDs", () => {
    const fx = fixture();
    const update = fx.reviewSet.currentUpdate!;
    const replacementIds = fx.records
      .slice(3, 6)
      .map((record) => record.id)
      .sort(compareCodePoints);
    const pageId = `/updates/${update.updateId}/`;
    write(
      fx.root,
      `dist/updates/${update.updateId}/index.html`,
      html(
        {
          kind: "html-page",
          pageIds: [pageId],
          recordIds: replacementIds,
          digest: update.updateDigest,
          shardIds: [],
        },
        `<article data-atlas-view="quarterly-update" data-update-id="${update.updateId}">${replacementIds
          .map((caseId) => `<li data-update-case-id="${caseId}"></li>`)
          .join("")}</article>`,
      ),
    );
    expect(() => generate(fx)).toThrow(/artifact identity/i);
  });

  it("requires every derived HTML and case-index route and rejects unexpected HTML", () => {
    const fx = fixture();
    const casePath = join(
      fx.root,
      `dist/cases/${fx.records[0]!.slug}/index.html`,
    );
    const caseBytes = readFileSync(casePath);
    rmSync(casePath);
    expect(() => generate(fx)).toThrow(/route coverage.*missing/i);

    writeFileSync(casePath, caseBytes);
    const manifestPath = join(fx.root, "dist/case-index/manifest.json");
    const manifestBytes = readFileSync(manifestPath);
    rmSync(manifestPath);
    expect(() => generate(fx)).toThrow(/requires manifest/i);

    writeFileSync(manifestPath, manifestBytes);
    write(
      fx.root,
      "dist/unexpected/index.html",
      html({
        kind: "html-page",
        pageIds: ["/unexpected/"],
        recordIds: [],
        digest: null,
        shardIds: [],
      }),
    );
    expect(() => generate(fx)).toThrow(/route coverage.*unexpected/i);
  });

  it("extracts JSON identities and rejects incomplete, duplicate, or stale shard coverage", () => {
    const fx = fixture();
    const injuryCode = fx.reviewSet.overviews[0]!.injuryCode;
    const injuryRecords = ordered(fx.records).filter(
      (record) => record.injuryCode === injuryCode,
    );
    const shardPath = join(fx.root, `dist/case-index/${injuryCode}/1.json`);
    writeFileSync(shardPath, JSON.stringify(injuryRecords.slice(0, 1)));
    expect(() => generate(fx)).toThrow(/case-index.*(coverage|partition)/i);

    writeFileSync(
      shardPath,
      JSON.stringify([
        injuryRecords[0],
        injuryRecords[0],
        ...injuryRecords.slice(2),
      ]),
    );
    expect(() => generate(fx)).toThrow(/duplicate.*record/i);

    writeFileSync(shardPath, JSON.stringify(injuryRecords));
    write(
      fx.root,
      `dist/case-index/${injuryCode}/2.json`,
      JSON.stringify([injuryRecords[0]]),
    );
    expect(() => generate(fx)).toThrow(/shard.*coverage/i);

    rmSync(join(fx.root, `dist/case-index/${injuryCode}/2.json`));
    const manifestPath = join(fx.root, "dist/case-index/manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.shardSize = 1;
    writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(() => generate(fx)).toThrow(/manifest fields|shardCount|shardSize/i);

    manifest.shardSize = 100;
    manifest.mode = "public";
    writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(() => generate(fx)).toThrow(/manifest fields/i);

    manifest.mode = "review";
    writeFileSync(manifestPath, JSON.stringify(manifest));
    writeFileSync(
      shardPath,
      JSON.stringify(
        injuryRecords.map((record) => ({
          ...record,
          injuryCode: "wrong-injury",
        })),
      ),
    );
    expect(() => generate(fx)).toThrow(/shard injuryCode/i);

    writeFileSync(shardPath, JSON.stringify(injuryRecords));
    const withSecret = structuredClone(injuryRecords);
    (withSecret[0] as any).secret = "must never be manifested";
    writeFileSync(shardPath, JSON.stringify(withSecret));
    expect(() => generate(fx)).toThrow(/invalid record/i);

    const changedSourceFact = structuredClone(injuryRecords);
    changedSourceFact[0]!.athleteName = "Wrong athlete";
    writeFileSync(shardPath, JSON.stringify(changedSourceFact));
    expect(() => generate(fx)).toThrow(/strict source projection/i);

    writeFileSync(shardPath, JSON.stringify([...injuryRecords].reverse()));
    expect(() => generate(fx)).toThrow(/strict source projection|shard order/i);
  });

  it("rejects symlinks, dotfiles, unknown output, and includes ordinary extra files instead of ignoring them", () => {
    const fx = fixture();
    write(fx.root, "dist/extra.txt", "extra");
    expect(
      generate(fx).files.some((entry) => entry.buildPath === "extra.txt"),
    ).toBe(true);

    symlinkSync(
      join(fx.root, "dist/robots.txt"),
      join(fx.root, "dist/linked.txt"),
    );
    expect(() => walkPrivateDist(join(fx.root, "dist"))).toThrow(/symlink/i);
    rmSync(join(fx.root, "dist/linked.txt"));

    mkdirSync(join(fx.root, "outside-dir"));
    symlinkSync(join(fx.root, "outside-dir"), join(fx.root, "dist/linked-dir"));
    expect(() => walkPrivateDist(join(fx.root, "dist"))).toThrow(/symlink/i);
    rmSync(join(fx.root, "dist/linked-dir"));

    const fifoPath = join(fx.root, "dist/special.txt");
    execFileSync("/usr/bin/mkfifo", [fifoPath]);
    expect(() => walkPrivateDist(join(fx.root, "dist"))).toThrow(/special/i);
    rmSync(fifoPath);

    write(fx.root, "dist/.secret", "no");
    expect(() => walkPrivateDist(join(fx.root, "dist"))).toThrow(/dotfile/i);
    rmSync(join(fx.root, "dist/.secret"));

    write(fx.root, "dist/unknown.bin", "no");
    expect(() => generate(fx)).toThrow(/content type/i);
    rmSync(join(fx.root, "dist/unknown.bin"));

    write(fx.root, "dist/extra.json", "{}");
    expect(() => generate(fx)).toThrow(/unexpected JSON/i);
    write(fx.root, "dist/extra.json", '{"secret":1,"secret":2}');
    expect(() => generate(fx)).toThrow(/unexpected JSON/i);
  });

  it("fails closed on dirty/public/stale renderer, policy, or review-set inputs", () => {
    const fx = fixture();
    expect(() =>
      generate(fx, {
        sourceState: {
          ...fixtureSourceState(fx),
          dirty: true,
        },
      }),
    ).toThrow(/clean/i);
    expect(() => generate(fx, { buildMode: "public" })).toThrow(/review/i);
    expect(() =>
      generate(fx, {
        sourceState: {
          ...fixtureSourceState(fx),
          rendererTreeDigest: "f".repeat(64),
        },
      }),
    ).toThrow(/renderer/i);

    expect(() =>
      generate(fx, {
        sourceState: {
          ...fixtureSourceState(fx),
          supportingDataDigest: "f".repeat(64),
        },
      }),
    ).toThrow(/supporting-data/i);

    expect(() =>
      generate(fx, {
        sourceState: {
          ...fixtureSourceState(fx),
          contentAuthoritySnapshotDigest: "f".repeat(64),
        },
      }),
    ).toThrow(/content-authority/i);

    write(fx.root, "ops/http-header-policy.v1.json", "{}\n");
    expect(() => generate(fx)).toThrow(/header policy/i);

    write(
      fx.root,
      "ops/http-header-policy.v1.json",
      readFileSync(
        new URL("../../ops/http-header-policy.v1.json", import.meta.url),
      ),
    );
    write(fx.root, "dist/review/review-set.json", `${fx.reviewSetBytes}\n`);
    expect(() => generate(fx)).toThrow(/review-set response/i);
  });

  it("writes only canonical bytes atomically and refuses a symlink target", () => {
    const fx = fixture();
    const manifest = generate(fx);
    const target = join(fx.root, "review/private-dist-manifest.v1.json");
    writePrivateDistManifest(fx.root, manifest);
    expect(readFileSync(target, "utf8")).toBe(canonicalJson(manifest));
    expect(lstatSync(target).isFile()).toBe(true);

    rmSync(target);
    const outside = join(fx.root, "outside-manifest.json");
    writeFileSync(outside, "preserve");
    symlinkSync(outside, target);
    expect(() => writePrivateDistManifest(fx.root, manifest)).toThrow(
      /regular file/i,
    );
    expect(readFileSync(outside, "utf8")).toBe("preserve");
  });
});
