/**
 * Pagination and index-shard tests. A 240-case synthetic fictional
 * collection must produce 12-card listing pages and 100-entry deferred
 * shards with every permitted case present exactly once and a bounded first
 * page; review shards expose diagnosis confirmation and workflow status as
 * separate fields while public shards never contain workflow status.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildCaseIndexEntry,
  buildCaseIndexManifest,
  buildCaseIndexShards,
  buildListingPagePaths,
  deriveEventYear,
  INDEX_SHARD_SIZE,
  LISTING_PAGE_SIZE,
  paginateItems,
  permittedCasesForMode,
  RELATED_CASES_LIMIT,
  relatedCases,
} from "../../src/lib/cases/pagination";
import {
  computeCaseContentDigest,
  computeVideoIdentityDigest,
  computeVideoSourceDigest,
} from "../../src/lib/cases/digest";
import {
  CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
  CURRENT_SOURCE_POLICY_VERSION,
} from "../../src/lib/contracts/site-governance";

const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );

const finalize = (record: any): any => {
  record.video.sourceProvenanceVerification.reviewedVideoIdentityDigest =
    computeVideoIdentityDigest(record);
  if (record.review.status === "approved") {
    record.review.reviewedContentDigest = computeCaseContentDigest(record);
  }
  if (record.video.publicRightsReview.status === "cleared") {
    record.video.publicRightsReview.reviewedVideoDigest =
      computeVideoSourceDigest(record);
  }
  return record;
};

const publicCase = (): any => {
  const record = loadFixture("cases/valid-approved-classic.json");
  record.sourceManifestBinding.sourcePolicyVersion =
    CURRENT_SOURCE_POLICY_VERSION;
  record.video.sourceProvenanceVerification.verifiedPolicyVersion =
    CURRENT_SOURCE_POLICY_VERSION;
  record.video.publicRightsReview = {
    status: "cleared",
    reviewedBy: "Fictional Rights Reviewer",
    reviewedAt: "2026-08-05T12:00:00Z",
    reviewedVideoDigest: "0".repeat(64),
    policyVersion: CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
    termsCheckedAt: "2026-08-05T12:00:00Z",
    decisionBasis: "Fictional platform terms permit linking and embedding.",
    notes: null,
    decisionPath:
      "src/data/governance/video-rights-decisions/CASE-FIC-2014-002.v1.json",
    decisionDigest: "b".repeat(64),
  };
  return finalize(record);
};

/** 240 fictional in-review clones with unique IDs and slugs. */
function syntheticCollection(count: number): any[] {
  const base = loadFixture("cases/valid-medical-review.json");
  const records: any[] = [];
  for (let index = 0; index < count; index += 1) {
    const clone = structuredClone(base);
    const serial = String(index + 1).padStart(3, "0");
    clone.id = `CASE-SYN-2026-${serial}`;
    clone.slug = `fictional-synthetic-case-${serial}`;
    records.push(clone);
  }
  return records;
}

describe("deriveEventYear", () => {
  it("derives the year and rejects malformed dates", () => {
    expect(deriveEventYear("2014-03-02")).toBe(2014);
    expect(() => deriveEventYear("March 2, 2014")).toThrow(/invalid/);
  });
});

describe("paginateItems", () => {
  it("chunks items in order and validates the page size", () => {
    expect(paginateItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(paginateItems([], 12)).toEqual([]);
    expect(() => paginateItems([1], 0)).toThrow(/page size/);
  });
});

describe("buildListingPagePaths", () => {
  it("uses the exact 12-card page size with canonical page 1 and /page/{n}/", () => {
    expect(LISTING_PAGE_SIZE).toBe(12);
    const pages = buildListingPagePaths("/injuries/acl/", 240);
    expect(pages).toHaveLength(20);
    expect(pages[0]).toEqual({
      pageNumber: 1,
      isCanonical: true,
      path: "/injuries/acl/",
      previousPath: null,
      nextPath: "/injuries/acl/page/2/",
    });
    expect(pages[1]).toEqual({
      pageNumber: 2,
      isCanonical: false,
      path: "/injuries/acl/page/2/",
      previousPath: "/injuries/acl/",
      nextPath: "/injuries/acl/page/3/",
    });
    expect(pages[19]?.nextPath).toBeNull();
    expect(pages[19]?.previousPath).toBe("/injuries/acl/page/19/");
  });

  it("keeps a single canonical page for empty listings and validates inputs", () => {
    const empty = buildListingPagePaths("/injuries/acl/", 0);
    expect(empty).toHaveLength(1);
    expect(empty[0]?.isCanonical).toBe(true);
    expect(empty[0]?.nextPath).toBeNull();
    expect(() => buildListingPagePaths("injuries/acl/", 1)).toThrow(/base/);
    expect(() => buildListingPagePaths("/injuries/acl/", -1)).toThrow(/total/);
  });
});

describe("240-case synthetic collection", () => {
  const records = syntheticCollection(240);

  it("produces 12-card HTML pages with every permitted case exactly once", () => {
    const permitted = permittedCasesForMode("review", records);
    expect(permitted).toHaveLength(240);
    const pages = paginateItems(permitted, LISTING_PAGE_SIZE);
    expect(pages).toHaveLength(20);
    for (const page of pages) {
      expect(page.length).toBeLessThanOrEqual(LISTING_PAGE_SIZE);
    }
    // The first page DOM stays bounded at 12 cards.
    expect(pages[0]).toHaveLength(12);
    const seen = new Set(pages.flat().map((record: any) => record.id));
    expect(seen.size).toBe(240);
  });

  it("produces 100-entry shards with every permitted case exactly once", () => {
    expect(INDEX_SHARD_SIZE).toBe(100);
    const shards = buildCaseIndexShards("review", records);
    const ankleShards = shards.get("ankle-sprain") ?? [];
    expect(ankleShards.map((shard) => shard.length)).toEqual([100, 100, 40]);
    const ids = ankleShards.flat().map((entry) => entry.id);
    expect(new Set(ids).size).toBe(240);
    expect(ids).toHaveLength(240);
  });

  it("summarizes shard counts in the minimal manifest", () => {
    const manifest = buildCaseIndexManifest("review", records, [
      "acl",
      "ankle-sprain",
      "achilles-rupture",
    ]);
    expect(manifest).toEqual({
      schemaVersion: 1,
      mode: "review",
      shardSize: 100,
      totalEntries: 240,
      injuries: [
        { injuryCode: "acl", entryCount: 0, shardCount: 0 },
        { injuryCode: "ankle-sprain", entryCount: 240, shardCount: 3 },
        { injuryCode: "achilles-rupture", entryCount: 0, shardCount: 0 },
      ],
    });
  });
});

describe("index entry fields", () => {
  it("keeps review entries minimal with separate confirmation and workflow fields", () => {
    const record = loadFixture("cases/valid-medical-review.json");
    const entry = buildCaseIndexEntry(record, "review");
    expect(Object.keys(entry).sort()).toEqual(
      [
        "athleteName",
        "classicReason",
        "competitionCode",
        "confirmationStatus",
        "eventDate",
        "eventYear",
        "id",
        "injuryCode",
        "isClassic",
        "leagueCode",
        "mechanismTags",
        "opponentName",
        "season",
        "slug",
        "sportCode",
        "teamName",
        "workflowStatus",
      ].sort(),
    );
    expect(entry.eventYear).toBe(2026);
    expect(entry.season).toBe("2025-26");
    expect(entry.confirmationStatus).toBe("confirmed");
    expect(entry.workflowStatus).toBe("medical-review");
    expect(entry.confirmationStatus).not.toBe(entry.workflowStatus);
  });

  it("never exposes workflow status in public entries or shards", () => {
    const record = publicCase();
    const entry = buildCaseIndexEntry(record, "public");
    expect("workflowStatus" in entry).toBe(false);

    const reviewOnly = loadFixture("cases/valid-medical-review.json");
    const shards = buildCaseIndexShards("public", [record, reviewOnly]);
    const aclEntries = (shards.get("acl") ?? []).flat();
    expect(aclEntries).toHaveLength(1);
    expect(aclEntries[0]?.id).toBe(record.id);
    expect(shards.has("ankle-sprain")).toBe(false);
    for (const shardEntry of aclEntries) {
      expect("workflowStatus" in shardEntry).toBe(false);
    }
  });
});

describe("relatedCases", () => {
  it("caps same-injury related cases at 3 and excludes the case itself", () => {
    expect(RELATED_CASES_LIMIT).toBe(3);
    const records = syntheticCollection(6);
    const permitted = permittedCasesForMode("review", records);
    const related = relatedCases(permitted[0], permitted);
    expect(related).toHaveLength(3);
    expect(related.map((record: any) => record.id)).not.toContain(
      permitted[0].id,
    );
    expect(() => relatedCases(permitted[0], permitted, -1)).toThrow(/limit/);
  });
});
