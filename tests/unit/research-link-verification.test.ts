import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import {
  CANDIDATE_INJURY_CODES,
  type CandidateRow,
} from "../../src/lib/research/candidate-contract";
import { parseCandidateCsv } from "../../src/lib/research/csv";
import { parseYouTubeVideoId } from "../../src/lib/video/youtube";
import {
  LIVE_VERIFICATION_ATTEMPTS,
  LIVE_VERIFICATION_CONCURRENCY,
  LIVE_VERIFICATION_MAX_CONCURRENCY,
  LIVE_VERIFICATION_MAX_REDIRECTS,
  LIVE_VERIFICATION_TIMEOUT_MS,
  buildVerificationPlan,
  computeCandidateReviewSetDigest,
  serializeVerificationArtifact,
  validateCandidateVerification,
  verifyCandidateUrls,
  verifyPlannedUrl,
  type CandidateVerificationArtifactV1,
  type RootSourceAuditV1,
  type VerificationFetch,
  type VerificationIssue,
  type VerificationResponse,
} from "../../src/lib/research/link-verification";
import { runCandidateVerificationCheck } from "../../scripts/research/check-candidate-verification";
import { checkCandidateLedgers } from "../../scripts/research/check-candidates";
import {
  ROOT_AUDIT_PATH,
  VERIFICATION_ARTIFACT_PATH,
  runCandidateLinkVerifier,
} from "../../scripts/research/verify-candidate-links";

const fixtureText = readFileSync(
  new URL("../fixtures/research/valid-candidates.csv", import.meta.url),
  "utf8",
);

const NOW = "2026-08-07T12:00:00Z";
const POLICY_JSON_DIGEST = "1".repeat(64);
const POLICY_MARKDOWN_DIGEST = "2".repeat(64);
const CANDIDATE_SET_DIGEST = "3".repeat(64);
const TEST_INJURY_ORDER = new Map(
  CANDIDATE_INJURY_CODES.map((injury, index) => [injury, index]),
);
const REPOSITORY_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CANDIDATE_PATHS = [
  "research/candidates/acl.csv",
  "research/candidates/ankle-sprain.csv",
  "research/candidates/achilles-rupture.csv",
] as const;
const POLICY_PATHS = [
  "research/source-policy/source-policy.v1.json",
  "research/source-policy/nba.v1.md",
] as const;

function absolutePath(root: string, relativePath: string): string {
  return join(root, ...relativePath.split("/"));
}

function writeRelativeFile(
  root: string,
  relativePath: string,
  bytes: string,
): void {
  const path = absolutePath(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes, "utf8");
}

function copyRepositoryFile(root: string, relativePath: string): void {
  writeRelativeFile(
    root,
    relativePath,
    readFileSync(absolutePath(REPOSITORY_ROOT, relativePath), "utf8"),
  );
}

const fixtureRows = (): CandidateRow[] => parseCandidateCsv(fixtureText, "acl");

const recentRow = (overrides: Partial<CandidateRow> = {}): CandidateRow => ({
  ...fixtureRows()[0]!,
  ...overrides,
});

const anotherRecentRow = (
  overrides: Partial<CandidateRow> = {},
): CandidateRow =>
  recentRow({
    candidateId: "CAND-NBA-ACL-2024-099",
    athleteDisplayName: "Jordan Example",
    eventDate: "2024-12-20",
    season: "2024-25",
    opponent: "Summit Owls",
    videoCanonicalUrl: "https://www.youtube.com/watch?v=AclCase0099",
    videoTitle:
      "Jordan Example injury event vs. Summit Owls 2024-12-20 NBA regular season",
    diagnosisSource1Title: "Jordan Example ACL diagnosis, team release",
    diagnosisSource1Url: "https://team.example.org/releases/jordan-example-acl",
    eventSourceTitle: "Jordan Example vs. Summit Owls 2024-12-20 game report",
    eventSourceUrl: "https://league.example.org/games/2024-12-20-comets-owls",
    csvRow: 4,
    ...overrides,
  });

const headers = (
  contentType = "text/html; charset=utf-8",
  location: string | null = null,
) => ({
  get(name: string): string | null {
    if (name.toLowerCase() === "content-type") return contentType;
    if (name.toLowerCase() === "location") return location;
    return null;
  },
});

const response = (
  url: string,
  status = 200,
  contentType = "text/html; charset=utf-8",
  jsonValue: unknown = {},
  location: string | null = null,
): VerificationResponse => ({
  status,
  url,
  headers: headers(contentType, location),
  json: async () => jsonValue,
});

const firstPlanItem = () => {
  const plan = buildVerificationPlan([recentRow()]);
  const item = plan.urls.find((entry) => entry.kind === "event");
  if (!item) throw new Error("event verification item missing");
  return item;
};

const rootAudit = (rows: CandidateRow[]): RootSourceAuditV1 => ({
  schemaVersion: 1,
  manifestId: "NBA-SOURCE-2026-08-06-001",
  checkedAt: NOW,
  candidates: [...rows]
    .filter(
      (row) =>
        row.discoveryStatus === "source-ready" ||
        row.discoveryStatus === "source-verified",
    )
    .sort(
      (left, right) =>
        (TEST_INJURY_ORDER.get(left.injuryCode) ?? TEST_INJURY_ORDER.size) -
          (TEST_INJURY_ORDER.get(right.injuryCode) ?? TEST_INJURY_ORDER.size) ||
        left.eventDate.localeCompare(right.eventDate) ||
        left.candidateId.localeCompare(right.candidateId),
    )
    .map((row, index) => ({
      candidateId: row.candidateId,
      eventPass: true,
      videoPass: true,
      diagnosisPass: true,
      checkedBy: "Root Source Auditor",
      checkedAt: NOW,
      reason: "All source identities and accepted hierarchy passed.",
      firstPartyAvailability: {
        status: "available",
        basis: null,
        checkedBy: "Root Source Auditor",
        checkedAt: NOW,
        officialLocationsChecked: [
          {
            url: row.diagnosisSource1Url,
            outcome: "first-party diagnosis page opened",
            observedAt: NOW,
          },
        ],
        archiveOrSearchChecks: [],
      },
      auditReference: `/candidates/${index}`,
    })),
});

const successfulArtifact = (
  rows: CandidateRow[],
  audit: RootSourceAuditV1 | null = null,
): CandidateVerificationArtifactV1 => {
  const plan = buildVerificationPlan(rows, audit);
  return {
    schemaVersion: 1,
    checkedAt: NOW,
    concurrency: LIVE_VERIFICATION_CONCURRENCY,
    acceptedSetDigest: plan.acceptedSetDigest,
    rootAuditDigest: plan.rootAuditDigest,
    results: plan.urls.map((entry) => {
      const youtubeVideo =
        entry.kind === "video" &&
        parseYouTubeVideoId(entry.canonicalUrl) !== null;
      return {
        ...entry,
        checkedAt: NOW,
        attempts: youtubeVideo ? 2 : 1,
        finalUrl: entry.canonicalUrl,
        statusCode: 200,
        contentType: "text/html; charset=utf-8",
        outcome: "reachable",
        errorClassification: null,
        metadataComparison: youtubeVideo ? "matched" : "not-obtained",
        observedTitle: youtubeVideo ? entry.expectedTitle : null,
        observedUploader: youtubeVideo ? entry.expectedUploader : null,
        youtubeApiStatus: youtubeVideo ? "verified" : "not-applicable",
        youtubeEmbeddable: youtubeVideo ? true : null,
      };
    }),
  };
};

const issueCodes = (issues: VerificationIssue[]): string[] =>
  issues.map((entry) => entry.code);

describe("bounded live link checks", () => {
  it("pins concurrency, timeout, and retry bounds", () => {
    expect(LIVE_VERIFICATION_CONCURRENCY).toBe(2);
    expect(LIVE_VERIFICATION_MAX_CONCURRENCY).toBe(3);
    expect(LIVE_VERIFICATION_TIMEOUT_MS).toBe(15_000);
    expect(LIVE_VERIFICATION_ATTEMPTS).toBe(3);
    expect(LIVE_VERIFICATION_MAX_REDIRECTS).toBe(3);
  });

  it("accepts a reachable 200 and a same-canonical redirect", async () => {
    const item = firstPlanItem();
    const exact = await verifyPlannedUrl(item, {
      fetch: vi.fn(async () => response(item.canonicalUrl)),
      now: () => NOW,
      sleep: async () => undefined,
    });
    expect(exact).toMatchObject({
      outcome: "reachable",
      statusCode: 200,
      errorClassification: null,
      finalUrl: item.canonicalUrl,
    });

    const trailingSlash = `${item.canonicalUrl}/`;
    const redirectFetch: VerificationFetch = vi.fn(async (input, init) => {
      expect(init?.redirect).toBe("manual");
      expect(init?.headers).toEqual({
        "User-Agent":
          "ProfessionalSportsInjuryAtlas-ResearchVerifier/1.0 (+local-source-audit)",
      });
      return String(input) === item.canonicalUrl
        ? response(
            item.canonicalUrl,
            301,
            "text/html; charset=utf-8",
            {},
            trailingSlash,
          )
        : response(trailingSlash);
    });
    const redirected = await verifyPlannedUrl(item, {
      fetch: redirectFetch,
      now: () => NOW,
      sleep: async () => undefined,
    });
    expect(redirected).toMatchObject({
      outcome: "reachable",
      finalUrl: trailingSlash,
      errorClassification: null,
    });
    expect(redirectFetch).toHaveBeenCalledTimes(2);
  });

  it.each([404, 410])(
    "classifies HTTP %i as confirmed removal",
    async (status) => {
      const item = firstPlanItem();
      const result = await verifyPlannedUrl(item, {
        fetch: vi.fn(async () => response(item.canonicalUrl, status)),
        now: () => NOW,
        sleep: async () => undefined,
      });
      expect(result).toMatchObject({
        outcome: "removed",
        errorClassification: `http-${status}`,
        attempts: 1,
      });
    },
  );

  it("retries 429 and succeeds without exceeding three attempts", async () => {
    const item = firstPlanItem();
    let call = 0;
    const fetch = vi.fn(async () => {
      call += 1;
      return response(item.canonicalUrl, call < 3 ? 429 : 200);
    });
    const result = await verifyPlannedUrl(item, {
      fetch,
      now: () => NOW,
      sleep: async () => undefined,
    });
    expect(result).toMatchObject({
      outcome: "reachable",
      attempts: 3,
      errorClassification: null,
    });
    expect(fetch).toHaveBeenCalledTimes(3);

    const persistentFetch = vi.fn(async () => response(item.canonicalUrl, 429));
    const persistent = await verifyPlannedUrl(item, {
      fetch: persistentFetch,
      now: () => NOW,
      sleep: async () => undefined,
    });
    expect(persistent).toMatchObject({
      outcome: "temporary-error",
      errorClassification: "http-429",
      attempts: 3,
    });
    expect(persistentFetch).toHaveBeenCalledTimes(3);
  });

  it("distinguishes timeout and DNS failures as temporary", async () => {
    const item = firstPlanItem();
    const timeout = new Error("aborted");
    timeout.name = "AbortError";
    const timeoutResult = await verifyPlannedUrl(item, {
      fetch: vi.fn(async () => {
        throw timeout;
      }),
      now: () => NOW,
      sleep: async () => undefined,
    });
    expect(timeoutResult).toMatchObject({
      outcome: "temporary-error",
      errorClassification: "timeout",
      attempts: 3,
    });

    const dns = Object.assign(new Error("getaddrinfo ENOTFOUND"), {
      code: "ENOTFOUND",
    });
    const dnsResult = await verifyPlannedUrl(item, {
      fetch: vi.fn(async () => {
        throw dns;
      }),
      now: () => NOW,
      sleep: async () => undefined,
    });
    expect(dnsResult).toMatchObject({
      outcome: "temporary-error",
      errorClassification: "dns",
      attempts: 3,
    });
  });

  it("enforces a hard deadline and rejects unbounded overrides", async () => {
    const item = firstPlanItem();
    const neverSettles = vi.fn(
      async () =>
        await new Promise<VerificationResponse>(() => {
          // The deadline must resolve the verifier even if fetch ignores abort.
        }),
    );
    const result = await verifyPlannedUrl(item, {
      fetch: neverSettles,
      now: () => NOW,
      sleep: async () => undefined,
      attempts: 1,
      timeoutMs: 1,
    });
    expect(result).toMatchObject({
      outcome: "temporary-error",
      errorClassification: "timeout",
      attempts: 1,
    });

    await expect(
      verifyPlannedUrl(item, {
        fetch: neverSettles,
        attempts: 1,
        timeoutMs: LIVE_VERIFICATION_TIMEOUT_MS + 1,
      }),
    ).rejects.toThrow(/timeoutMs must be an integer/i);
    await expect(
      verifyPlannedUrl(item, {
        fetch: neverSettles,
        attempts: 1.5,
      }),
    ).rejects.toThrow(/attempts must be an integer/i);
  });

  it("rejects non-page content and canonical URL drift", async () => {
    const item = firstPlanItem();
    const contentType = await verifyPlannedUrl(item, {
      fetch: vi.fn(async () =>
        response(item.canonicalUrl, 200, "application/octet-stream"),
      ),
      now: () => NOW,
      sleep: async () => undefined,
    });
    expect(contentType).toMatchObject({
      outcome: "metadata-mismatch",
      errorClassification: "content-type-mismatch",
    });

    const drift = await verifyPlannedUrl(item, {
      fetch: vi.fn(async () =>
        response("https://league.example.org/unrelated-event"),
      ),
      now: () => NOW,
      sleep: async () => undefined,
    });
    expect(drift).toMatchObject({
      outcome: "metadata-mismatch",
      errorClassification: "canonical-url-drift",
    });
  });

  it("refuses unsafe candidate URLs before calling fetch", async () => {
    const item = firstPlanItem();
    const unsafeUrls = [
      "http://league.example.org/event",
      "https://localhost./event",
      "https://127.0.0.1/event",
      "https://[::ffff:7f00:1]/event",
      "https://user@league.example.org/event",
      "https://league.example.org:444/event",
      "https://league.example.org/event#fragment",
    ];
    for (const canonicalUrl of unsafeUrls) {
      const fetch = vi.fn(async () => response(canonicalUrl));
      const result = await verifyPlannedUrl(
        { ...item, canonicalUrl },
        {
          fetch,
          now: () => NOW,
          sleep: async () => undefined,
        },
      );
      expect(result).toMatchObject({
        outcome: "metadata-mismatch",
      });
      expect(fetch).not.toHaveBeenCalled();
    }
  });

  it("records a missing YouTube API key without inferring failure", async () => {
    const item = buildVerificationPlan([recentRow()]).urls.find(
      (entry) => entry.kind === "video",
    )!;
    const fetch = vi.fn(async () => response(item.canonicalUrl));
    const result = await verifyPlannedUrl(item, {
      fetch,
      now: () => NOW,
      sleep: async () => undefined,
      youtubeApiKey: undefined,
    });
    expect(result).toMatchObject({
      outcome: "reachable",
      youtubeApiStatus: "not-obtained",
      youtubeEmbeddable: null,
      metadataComparison: "not-obtained",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shares one three-attempt budget across the YouTube page and API", async () => {
    const item = buildVerificationPlan([recentRow()]).urls.find(
      (entry) => entry.kind === "video",
    )!;
    const fetch = vi.fn(async (input, init) => {
      const url = new URL(String(input));
      if (url.hostname === "www.googleapis.com") {
        expect(url.pathname).toBe("/youtube/v3/videos");
        expect(url.searchParams.get("part")).toBe(
          "snippet,contentDetails,status",
        );
        expect(init?.redirect).toBe("error");
        return response(url.origin + url.pathname, 429, "application/json");
      }
      return response(item.canonicalUrl);
    });
    const result = await verifyPlannedUrl(item, {
      fetch,
      now: () => NOW,
      sleep: async () => undefined,
      youtubeApiKey: "test-key-never-serialized",
    });
    expect(result).toMatchObject({
      outcome: "temporary-error",
      errorClassification: "youtube-api-http-429",
      youtubeApiStatus: "api-error",
      attempts: 3,
    });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(result)).not.toContain("test-key-never-serialized");
  });

  it("flags non-embeddable, private/deleted, and mismatched YouTube metadata", async () => {
    const item = buildVerificationPlan([recentRow()]).urls.find(
      (entry) => entry.kind === "video",
    )!;
    const pageThenApi = (apiValue: unknown): VerificationFetch =>
      vi.fn(async (input) =>
        String(input).startsWith("https://www.googleapis.com/")
          ? response(
              "https://www.googleapis.com/youtube/v3/videos",
              200,
              "application/json",
              apiValue,
            )
          : response(item.canonicalUrl),
      );

    const nonEmbeddable = await verifyPlannedUrl(item, {
      fetch: pageThenApi({
        items: [
          {
            snippet: {
              title: item.expectedTitle,
              channelTitle: item.expectedUploader,
            },
            status: { embeddable: false, privacyStatus: "public" },
          },
        ],
      }),
      now: () => NOW,
      sleep: async () => undefined,
      youtubeApiKey: "test-key-never-serialized",
    });
    expect(nonEmbeddable).toMatchObject({
      outcome: "metadata-mismatch",
      youtubeApiStatus: "not-embeddable",
      youtubeEmbeddable: false,
    });

    const unavailable = await verifyPlannedUrl(item, {
      fetch: pageThenApi({ items: [] }),
      now: () => NOW,
      sleep: async () => undefined,
      youtubeApiKey: "test-key-never-serialized",
    });
    expect(unavailable).toMatchObject({
      outcome: "removed",
      youtubeApiStatus: "private-or-deleted",
    });

    const mismatch = await verifyPlannedUrl(item, {
      fetch: pageThenApi({
        items: [
          {
            snippet: { title: "Wrong title", channelTitle: "Unknown uploader" },
            status: { embeddable: true, privacyStatus: "public" },
          },
        ],
      }),
      now: () => NOW,
      sleep: async () => undefined,
      youtubeApiKey: "test-key-never-serialized",
    });
    expect(mismatch).toMatchObject({
      outcome: "metadata-mismatch",
      youtubeApiStatus: "mismatch",
      metadataComparison: "mismatch",
    });
    expect(JSON.stringify(mismatch)).not.toContain("test-key-never-serialized");
  });

  it("accepts API non-embeddability when the manual result is external-link-only", async () => {
    const item = buildVerificationPlan([
      recentRow({ embedStatus: "external-link-only" }),
    ]).urls.find((entry) => entry.kind === "video")!;
    const fetch: VerificationFetch = vi.fn(async (input) =>
      String(input).startsWith("https://www.googleapis.com/")
        ? response(
            "https://www.googleapis.com/youtube/v3/videos",
            200,
            "application/json",
            {
              items: [
                {
                  snippet: {
                    title: item.expectedTitle,
                    channelTitle: item.expectedUploader,
                  },
                  status: { embeddable: false, privacyStatus: "public" },
                },
              ],
            },
          )
        : response(item.canonicalUrl),
    );
    const result = await verifyPlannedUrl(item, {
      fetch,
      now: () => NOW,
      sleep: async () => undefined,
      youtubeApiKey: "test-key-never-serialized",
    });
    expect(result).toMatchObject({
      outcome: "reachable",
      errorClassification: null,
      youtubeApiStatus: "not-embeddable",
      youtubeEmbeddable: false,
    });
  });

  it("uses at most two workers by default and rejects an unsafe override", async () => {
    const rows = [recentRow(), anotherRecentRow()];
    let active = 0;
    let maximumActive = 0;
    const fetch: VerificationFetch = vi.fn(async (input) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await Promise.resolve();
      active -= 1;
      return response(String(input));
    });
    const artifact = await verifyCandidateUrls(rows, {
      fetch,
      now: () => NOW,
      sleep: async () => undefined,
      youtubeApiKey: undefined,
    });
    expect(artifact.concurrency).toBe(2);
    expect(maximumActive).toBeLessThanOrEqual(2);

    await expect(
      verifyCandidateUrls(rows, {
        fetch,
        now: () => NOW,
        sleep: async () => undefined,
        concurrency: 4,
      }),
    ).rejects.toThrow(/maximum concurrency/i);
  });
});

describe("pure exact-bijection verification", () => {
  it("accepts exact current coverage and rejects stale checks", () => {
    const rows = [recentRow()];
    const audit = rootAudit(rows);
    const artifact = successfulArtifact(rows, audit);
    expect(
      validateCandidateVerification({
        rows,
        artifact,
        now: NOW,
        rootAudit: audit,
      }),
    ).toEqual([]);

    const staleArtifact = {
      ...artifact,
      checkedAt: "2026-07-20T12:00:00Z",
    };
    const staleArtifactIssues = validateCandidateVerification({
      rows,
      artifact: staleArtifact,
      now: NOW,
      rootAudit: audit,
    });
    expect(issueCodes(staleArtifactIssues)).toContain("verification-stale");
    expect(staleArtifactIssues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "checkedAt" })]),
    );

    const staleResult = {
      ...artifact,
      results: artifact.results.map((entry, index) =>
        index === 0 ? { ...entry, checkedAt: "2026-07-20T12:00:00Z" } : entry,
      ),
    };
    const staleResultIssues = validateCandidateVerification({
      rows,
      artifact: staleResult,
      now: NOW,
      rootAudit: audit,
    });
    expect(issueCodes(staleResultIssues)).toContain("verification-stale");
    expect(staleResultIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "results[0].checkedAt" }),
      ]),
    );
  });

  it("rejects changed URL, newly accepted row, and extra now-excluded row", () => {
    const original = [recentRow()];
    const audit = rootAudit(original);
    const artifact = successfulArtifact(original, audit);
    const changedUrl = [
      recentRow({
        eventSourceUrl: "https://league.example.org/games/corrected-event",
      }),
    ];
    expect(
      issueCodes(
        validateCandidateVerification({
          rows: changedUrl,
          artifact,
          now: NOW,
          rootAudit: rootAudit(changedUrl),
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "verification-set-digest",
        "verification-missing",
        "verification-extra",
      ]),
    );

    const added = [recentRow(), anotherRecentRow()];
    expect(
      issueCodes(
        validateCandidateVerification({
          rows: added,
          artifact,
          now: NOW,
          rootAudit: rootAudit(added),
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "verification-set-digest",
        "verification-missing",
      ]),
    );

    const excluded = [
      recentRow({
        discoveryStatus: "excluded",
        exclusionReason: "source removed",
      }),
    ];
    expect(
      issueCodes(
        validateCandidateVerification({
          rows: excluded,
          artifact,
          now: NOW,
          rootAudit: null,
        }),
      ),
    ).toEqual(
      expect.arrayContaining(["verification-set-digest", "verification-extra"]),
    );
  });

  it("rejects changed expected identity, duplicate and missing URL kinds", () => {
    const rows = [recentRow()];
    const audit = rootAudit(rows);
    const artifact = successfulArtifact(rows, audit);
    const changedIdentity = [recentRow({ opponent: "Different Opponent" })];
    expect(
      issueCodes(
        validateCandidateVerification({
          rows: changedIdentity,
          artifact,
          now: NOW,
          rootAudit: rootAudit(changedIdentity),
        }),
      ),
    ).toContain("verification-identity-mismatch");

    const duplicate = {
      ...artifact,
      results: [...artifact.results, artifact.results[0]!],
    };
    expect(
      issueCodes(
        validateCandidateVerification({
          rows,
          artifact: duplicate,
          now: NOW,
          rootAudit: audit,
        }),
      ),
    ).toContain("verification-duplicate");

    const missing = {
      ...artifact,
      results: artifact.results.filter((entry) => entry.kind !== "event"),
    };
    expect(
      issueCodes(
        validateCandidateVerification({
          rows,
          artifact: missing,
          now: NOW,
          rootAudit: audit,
        }),
      ),
    ).toContain("verification-missing");
  });

  it("requires exact root-audit status/reference/digest", () => {
    const rows = [recentRow()];
    const audit = rootAudit(rows);
    const artifact = successfulArtifact(rows, audit);
    const failedAudit: RootSourceAuditV1 = {
      ...audit,
      candidates: audit.candidates.map((entry) => ({
        ...entry,
        eventPass: false,
        reason: "Event identity failed.",
      })),
    };
    expect(
      issueCodes(
        validateCandidateVerification({
          rows,
          artifact,
          now: NOW,
          rootAudit: failedAudit,
        }),
      ),
    ).toContain("verification-root-audit-status");

    const wrongReference: RootSourceAuditV1 = {
      ...audit,
      candidates: audit.candidates.map((entry) => ({
        ...entry,
        auditReference: "/candidates/99",
      })),
    };
    expect(
      issueCodes(
        validateCandidateVerification({
          rows,
          artifact,
          now: NOW,
          rootAudit: wrongReference,
        }),
      ),
    ).toContain("verification-root-audit-reference");

    const changedAuditBytes: RootSourceAuditV1 = {
      ...audit,
      checkedAt: "2026-08-07T11:59:59Z",
    };
    expect(
      issueCodes(
        validateCandidateVerification({
          rows,
          artifact,
          now: NOW,
          rootAudit: changedAuditBytes,
        }),
      ),
    ).toContain("verification-root-audit-mismatch");
  });

  it("rejects a root-audit entry for a non-accepted ledger row", () => {
    const accepted = recentRow();
    const notAccepted = anotherRecentRow({
      discoveryStatus: "needs-source",
    });
    const rows = [accepted, notAccepted];
    const audit = rootAudit([accepted]);
    const extraAuditCandidate = rootAudit([
      anotherRecentRow({ discoveryStatus: "source-ready" }),
    ]).candidates[0]!;
    audit.candidates.push({
      ...extraAuditCandidate,
      auditReference: "/candidates/1",
    });
    const artifact = successfulArtifact(rows, audit);

    expect(
      issueCodes(
        validateCandidateVerification({
          rows,
          artifact,
          now: NOW,
          rootAudit: audit,
        }),
      ),
    ).toContain("verification-root-audit-coverage");
  });

  it("excludes workflow fields from the accepted-set projection but requires the durable decision", () => {
    const sourceReady = [recentRow()];
    const audit = rootAudit(sourceReady);
    const artifact = successfulArtifact(sourceReady, audit);
    const promoted = [
      recentRow({
        discoveryStatus: "source-verified",
        reviewedBy: "Named Content Owner",
        reviewedAt: NOW,
      }),
    ];
    expect(buildVerificationPlan(sourceReady, audit).acceptedSetDigest).toBe(
      buildVerificationPlan(promoted, audit).acceptedSetDigest,
    );

    expect(
      issueCodes(
        validateCandidateVerification({
          rows: promoted,
          artifact,
          now: NOW,
          rootAudit: audit,
        }),
      ),
    ).toContain("verification-review-decision-required");

    const decision = {
      schemaVersion: 1 as const,
      manifestId: "NBA-SOURCE-2026-08-06-001" as const,
      status: "approved-for-manifest" as const,
      sourcePolicyJsonDigest: POLICY_JSON_DIGEST,
      sourcePolicyMarkdownDigest: POLICY_MARKDOWN_DIGEST,
      reviewedBy: "Named Content Owner",
      reviewedAt: NOW,
      candidateSetDigest: CANDIDATE_SET_DIGEST,
      classicProposalCandidateIds: [] as string[],
    };
    const boundVerificationDigest = sha256Hex(
      serializeVerificationArtifact(artifact),
    );
    expect(
      validateCandidateVerification({
        rows: promoted,
        artifact,
        now: NOW,
        rootAudit: audit,
        decision,
        policyDigests: {
          json: POLICY_JSON_DIGEST,
          markdown: POLICY_MARKDOWN_DIGEST,
        },
        expectedCandidateSetDigest: CANDIDATE_SET_DIGEST,
        boundVerificationDigest,
      }),
    ).toEqual([]);
  });

  it("binds real artifact and policy bytes through the review-set digest", () => {
    const sourceReady = [recentRow()];
    const promoted = [
      recentRow({
        discoveryStatus: "source-verified",
        reviewedBy: "Named Content Owner",
        reviewedAt: NOW,
      }),
    ];
    const audit = rootAudit(sourceReady);
    const artifact = successfulArtifact(sourceReady, audit);
    const rootAuditBytes = canonicalJson(audit);
    const sourcePolicyJsonBytes = '{"schemaVersion":1}';
    const sourcePolicyMarkdownBytes = "# Frozen source policy\n";
    const decisionDigest = computeCandidateReviewSetDigest({
      rows: sourceReady,
      rootAuditBytes,
      verificationBytes: serializeVerificationArtifact(artifact),
      sourcePolicyJsonBytes,
      sourcePolicyMarkdownBytes,
    });
    const decision = {
      schemaVersion: 1 as const,
      manifestId: "NBA-SOURCE-2026-08-06-001" as const,
      status: "approved-for-manifest" as const,
      sourcePolicyJsonDigest: sha256Hex(sourcePolicyJsonBytes),
      sourcePolicyMarkdownDigest: sha256Hex(sourcePolicyMarkdownBytes),
      reviewedBy: "Named Content Owner",
      reviewedAt: NOW,
      candidateSetDigest: decisionDigest,
      classicProposalCandidateIds: [] as string[],
    };
    const policyDigests = {
      json: sha256Hex(sourcePolicyJsonBytes),
      markdown: sha256Hex(sourcePolicyMarkdownBytes),
    };
    expect(
      validateCandidateVerification({
        rows: promoted,
        artifact,
        now: NOW,
        rootAudit: audit,
        decision,
        policyDigests,
        expectedCandidateSetDigest: decisionDigest,
      }),
    ).toEqual([]);

    const changedArtifact = {
      ...artifact,
      results: artifact.results.map((entry, index) =>
        index === 0 ? { ...entry, contentType: "text/html" } : entry,
      ),
    };
    const changedDigest = computeCandidateReviewSetDigest({
      rows: promoted,
      rootAuditBytes,
      verificationBytes: serializeVerificationArtifact(changedArtifact),
      sourcePolicyJsonBytes,
      sourcePolicyMarkdownBytes,
    });
    expect(
      issueCodes(
        validateCandidateVerification({
          rows: promoted,
          artifact: changedArtifact,
          now: NOW,
          rootAudit: audit,
          decision,
          policyDigests,
          expectedCandidateSetDigest: changedDigest,
        }),
      ),
    ).toContain("verification-review-set-digest");

    expect(
      issueCodes(
        validateCandidateVerification({
          rows: promoted,
          artifact,
          now: NOW,
          rootAudit: audit,
          decision,
          policyDigests: { ...policyDigests, json: "f".repeat(64) },
          expectedCandidateSetDigest: decisionDigest,
        }),
      ),
    ).toContain("verification-review-policy");
  });

  it("rejects direct promotion and artifact-byte drift after a bound decision", () => {
    const promoted = [
      recentRow({
        discoveryStatus: "source-verified",
        reviewedBy: "",
        reviewedAt: "",
      }),
    ];
    const audit = rootAudit(promoted);
    const artifact = successfulArtifact(promoted, audit);
    const decision = {
      schemaVersion: 1 as const,
      manifestId: "NBA-SOURCE-2026-08-06-001" as const,
      status: "approved-for-manifest" as const,
      sourcePolicyJsonDigest: POLICY_JSON_DIGEST,
      sourcePolicyMarkdownDigest: POLICY_MARKDOWN_DIGEST,
      reviewedBy: "Named Content Owner",
      reviewedAt: NOW,
      candidateSetDigest: CANDIDATE_SET_DIGEST,
      classicProposalCandidateIds: [] as string[],
    };
    const issues = validateCandidateVerification({
      rows: promoted,
      artifact,
      now: NOW,
      rootAudit: audit,
      decision,
      policyDigests: {
        json: POLICY_JSON_DIGEST,
        markdown: POLICY_MARKDOWN_DIGEST,
      },
      expectedCandidateSetDigest: CANDIDATE_SET_DIGEST,
      boundVerificationDigest: "f".repeat(64),
    });
    expect(issueCodes(issues)).toEqual(
      expect.arrayContaining([
        "verification-review-identity",
        "verification-bound-artifact-digest",
      ]),
    );
  });

  it("serializes canonical bytes and never stores response bodies", () => {
    const artifact = successfulArtifact([recentRow()], null);
    const serialized = serializeVerificationArtifact(artifact);
    expect(serialized.endsWith("\n")).toBe(false);
    expect(JSON.parse(serialized)).toEqual(artifact);
    expect(serialized).not.toMatch(
      /articleBody|responseBody|transcript|thumbnail/i,
    );
  });

  it("rejects unknown artifact/result keys instead of digesting hidden data", () => {
    const rows = [recentRow()];
    const audit = rootAudit(rows);
    const artifact = successfulArtifact(rows, audit);
    const unknownTopLevel = { ...artifact, hidden: "not-authority" };
    expect(
      issueCodes(
        validateCandidateVerification({
          rows,
          artifact: unknownTopLevel as CandidateVerificationArtifactV1,
          now: NOW,
          rootAudit: audit,
        }),
      ),
    ).toContain("verification-schema");

    const unknownResult = {
      ...artifact,
      results: artifact.results.map((entry, index) =>
        index === 0 ? { ...entry, responseBody: "forbidden" } : entry,
      ),
    };
    expect(
      issueCodes(
        validateCandidateVerification({
          rows,
          artifact: unknownResult as CandidateVerificationArtifactV1,
          now: NOW,
          rootAudit: audit,
        }),
      ),
    ).toContain("verification-schema");
  });

  it("rejects internally contradictory reachable results", () => {
    const rows = [recentRow()];
    const audit = rootAudit(rows);
    const artifact = successfulArtifact(rows, audit);
    const mutations = [
      { statusCode: 404 },
      { finalUrl: "https://league.example.org/unrelated" },
      { contentType: "application/octet-stream" },
      { errorClassification: "http-404" },
      { metadataComparison: "mismatch" as const },
      { youtubeApiStatus: "private-or-deleted" as const },
    ];
    for (const mutation of mutations) {
      const contradictory = {
        ...artifact,
        results: artifact.results.map((entry, index) =>
          index === 0 ? { ...entry, ...mutation } : entry,
        ),
      };
      expect(
        issueCodes(
          validateCandidateVerification({
            rows,
            artifact: contradictory,
            now: NOW,
            rootAudit: audit,
          }),
        ),
      ).toContain("verification-result-inconsistent");
    }
  });

  it("rejects non-exact decisions and a mismatched classic proposal set", () => {
    const promoted = [
      recentRow({
        discoveryStatus: "source-verified",
        reviewedBy: "Named Content Owner",
        reviewedAt: NOW,
      }),
    ];
    const audit = rootAudit(promoted);
    const artifact = successfulArtifact(promoted, audit);
    const decision = {
      schemaVersion: 1 as const,
      manifestId: "NBA-SOURCE-2026-08-06-001" as const,
      status: "approved-for-manifest" as const,
      sourcePolicyJsonDigest: POLICY_JSON_DIGEST,
      sourcePolicyMarkdownDigest: POLICY_MARKDOWN_DIGEST,
      reviewedBy: "Named Content Owner",
      reviewedAt: NOW,
      candidateSetDigest: CANDIDATE_SET_DIGEST,
      classicProposalCandidateIds: ["CAND-NBA-ACL-2012-999"],
      extra: "not-allowed",
    };
    expect(
      issueCodes(
        validateCandidateVerification({
          rows: promoted,
          artifact,
          now: NOW,
          rootAudit: audit,
          decision,
          policyDigests: {
            json: POLICY_JSON_DIGEST,
            markdown: POLICY_MARKDOWN_DIGEST,
          },
          expectedCandidateSetDigest: CANDIDATE_SET_DIGEST,
        }),
      ),
    ).toContain("verification-review-decision-schema");

    const exactShapeWrongClassics = { ...decision };
    delete (exactShapeWrongClassics as { extra?: string }).extra;
    expect(
      issueCodes(
        validateCandidateVerification({
          rows: promoted,
          artifact,
          now: NOW,
          rootAudit: audit,
          decision: exactShapeWrongClassics,
          policyDigests: {
            json: POLICY_JSON_DIGEST,
            markdown: POLICY_MARKDOWN_DIGEST,
          },
          expectedCandidateSetDigest: CANDIDATE_SET_DIGEST,
        }),
      ),
    ).toContain("verification-review-classic-set");
  });
});

describe("mocked verifier and checker scripts", () => {
  it("validates temp bytes, preserves prior artifacts, and keeps the checker read-only", async () => {
    const temporaryRoot = mkdtempSync(
      join(tmpdir(), "nba-source-verifier-test-"),
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    vi.stubEnv("YOUTUBE_API_KEY", "");
    try {
      for (const path of [...CANDIDATE_PATHS, ...POLICY_PATHS]) {
        copyRepositoryFile(temporaryRoot, path);
      }
      const originalCandidateBytes = new Map(
        CANDIDATE_PATHS.map((path) => [
          path,
          readFileSync(absolutePath(temporaryRoot, path), "utf8"),
        ]),
      );
      const reachableFetch = vi.fn(async (input: string) =>
        response(String(input)),
      );
      vi.stubGlobal("fetch", reachableFetch);

      expect(await runCandidateLinkVerifier(temporaryRoot)).toBe(0);
      const artifactPath = absolutePath(
        temporaryRoot,
        VERIFICATION_ARTIFACT_PATH,
      );
      expect(existsSync(artifactPath)).toBe(true);
      expect(existsSync(absolutePath(temporaryRoot, ROOT_AUDIT_PATH))).toBe(
        false,
      );
      for (const [path, bytes] of originalCandidateBytes) {
        expect(readFileSync(absolutePath(temporaryRoot, path), "utf8")).toBe(
          bytes,
        );
      }

      const priorArtifact = readFileSync(artifactPath, "utf8");
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: string) => response(String(input), 404)),
      );
      expect(await runCandidateLinkVerifier(temporaryRoot)).toBe(1);
      expect(readFileSync(artifactPath, "utf8")).toBe(priorArtifact);

      const candidateCheck = checkCandidateLedgers(temporaryRoot);
      expect(candidateCheck.issues).toEqual([]);
      const validAudit = rootAudit(candidateCheck.rows);
      writeRelativeFile(
        temporaryRoot,
        ROOT_AUDIT_PATH,
        canonicalJson({ ...validAudit, candidates: "invalid" }),
      );
      const preflightFetch = vi.fn(async (input: string) =>
        response(String(input)),
      );
      vi.stubGlobal("fetch", preflightFetch);
      expect(await runCandidateLinkVerifier(temporaryRoot)).toBe(1);
      expect(preflightFetch).not.toHaveBeenCalled();
      expect(readFileSync(artifactPath, "utf8")).toBe(priorArtifact);

      writeRelativeFile(
        temporaryRoot,
        ROOT_AUDIT_PATH,
        canonicalJson(validAudit),
      );
      const finalFetch = vi.fn(async (input: string) =>
        response(String(input)),
      );
      vi.stubGlobal("fetch", finalFetch);
      expect(await runCandidateLinkVerifier(temporaryRoot)).toBe(0);

      const finalArtifact = readFileSync(artifactPath, "utf8");
      const finalRootAudit = readFileSync(
        absolutePath(temporaryRoot, ROOT_AUDIT_PATH),
        "utf8",
      );
      expect(runCandidateVerificationCheck(temporaryRoot)).toBe(0);
      expect(readFileSync(artifactPath, "utf8")).toBe(finalArtifact);
      expect(
        readFileSync(absolutePath(temporaryRoot, ROOT_AUDIT_PATH), "utf8"),
      ).toBe(finalRootAudit);
      for (const [path, bytes] of originalCandidateBytes) {
        expect(readFileSync(absolutePath(temporaryRoot, path), "utf8")).toBe(
          bytes,
        );
      }
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
      logSpy.mockRestore();
      errorSpy.mockRestore();
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });
});
