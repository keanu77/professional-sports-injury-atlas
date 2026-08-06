/**
 * Mocked-network external verification tests. Every fetch/sleep/clock is a
 * deterministic stub; no test opens a live connection. Covers HTTP 200,
 * redirect to a new canonical URL, 404, 429 with bounded retry, timeout,
 * DNS/network failure, the missing YouTube API key, embeddable=false,
 * title/uploader mismatch, stale artifacts, and a fresh artifact whose
 * current URL set drifted by one missing/extra/changed URL.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "../../src/lib/cases/canonical-json";
import type { InjuryCase } from "../../src/lib/contracts/case";
import {
  ARTIFACT_MAX_AGE_DAYS,
  BACKOFF_BASE_MS,
  BACKOFF_MAX_MS,
  backoffDelayMs,
  buildExternalVerificationArtifact,
  checkExternalUrl,
  MAX_ATTEMPTS,
  MAX_CONCURRENCY,
  REQUEST_TIMEOUT_MS,
  validateExternalVerificationArtifact,
  verifyCaseExternalSources,
  type FetchLike,
  type FetchResponseLike,
  type VerifierDependencies,
} from "../../src/lib/external/verification";
import {
  expectedExternalUrlHashes,
  externalUrlEntries,
} from "../../src/lib/governance/release-gate";

const loadFixture = (rel: string): any =>
  JSON.parse(
    readFileSync(new URL(`../fixtures/${rel}`, import.meta.url), "utf8"),
  );

const classicCase = (): InjuryCase =>
  loadFixture("cases/valid-approved-classic.json");

const NOW = new Date("2026-08-06T12:00:00Z");

interface StubResponder {
  (url: string): FetchResponseLike | "network-error" | "hang";
}

function response(
  status: number,
  finalUrl: string,
  body = "",
): FetchResponseLike {
  return { status, url: finalUrl, text: () => Promise.resolve(body) };
}

/** Body that satisfies every textual expected-identity value of a case. */
function identityBodyFor(record: InjuryCase, url: string): string {
  const parts: string[] = [];
  for (const entry of externalUrlEntries(record)) {
    if (entry.url !== url) continue;
    for (const [field, value] of Object.entries(entry.expectedIdentity)) {
      if (field === "uploaderProvenance") continue;
      parts.push(value);
    }
  }
  return `<html><body>${parts.join(" | ")}</body></html>`;
}

function makeDeps(
  responder: StubResponder,
  overrides: Partial<VerifierDependencies> = {},
): { deps: VerifierDependencies; sleeps: number[]; requested: string[] } {
  const sleeps: number[] = [];
  const requested: string[] = [];
  const fetchImpl: FetchLike = (url, init) => {
    requested.push(url);
    const outcome = responder(url);
    if (outcome === "network-error") {
      return Promise.reject(new Error("getaddrinfo ENOTFOUND"));
    }
    if (outcome === "hang") {
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          reject(new Error("The operation was aborted"));
        });
      });
    }
    return Promise.resolve(outcome);
  };
  const deps: VerifierDependencies = {
    fetchImpl,
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
    now: () => NOW,
    youtubeApiKey: null,
    ...overrides,
  };
  return { deps, sleeps, requested };
}

/** Responder serving every URL of the case with HTTP 200 and identity body. */
function healthyResponder(record: InjuryCase): StubResponder {
  return (url) => {
    if (url.startsWith("https://www.googleapis.com/")) {
      return response(
        200,
        url,
        JSON.stringify({
          items: [
            {
              snippet: {
                title: "fictional clip",
                channelTitle: record.video.uploaderName,
              },
              status: { embeddable: true },
            },
          ],
        }),
      );
    }
    return response(200, url, identityBodyFor(record, url));
  };
}

describe("bounded verifier configuration", () => {
  it("caps the backoff and enforces the concurrency maximum", async () => {
    expect(backoffDelayMs(1)).toBe(BACKOFF_BASE_MS);
    expect(backoffDelayMs(2)).toBe(BACKOFF_BASE_MS * 2);
    expect(backoffDelayMs(10)).toBe(BACKOFF_MAX_MS);
    expect(REQUEST_TIMEOUT_MS).toBe(15_000);
    expect(MAX_ATTEMPTS).toBe(3);
    expect(MAX_CONCURRENCY).toBe(3);

    const record = classicCase();
    const { deps } = makeDeps(healthyResponder(record));
    await expect(
      verifyCaseExternalSources(record, deps, { concurrency: 4 }),
    ).rejects.toThrow(/concurrency/);
    await expect(
      verifyCaseExternalSources(record, deps, { concurrency: 0 }),
    ).rejects.toThrow(/concurrency/);
  });

  it("refuses non-HTTPS URLs without issuing a request", async () => {
    const { deps, requested } = makeDeps(() => response(200, "unused"));
    const result = await checkExternalUrl(
      {
        kind: "source-event-context",
        sourceId: "src-http",
        url: "http://insecure.example.org/report",
        expectedIdentity: { title: "t", publisher: "p" },
      },
      deps,
    );
    expect(result.status).toBe("failed");
    expect(result.outcome).toBe("non-https");
    expect(requested).toEqual([]);
  });
});

describe("URL check outcomes", () => {
  const entry = {
    kind: "source-event-context",
    sourceId: "src-fic-002-event",
    url: "https://league.example.org/games/fic-2014-03-02",
    expectedIdentity: {
      title: "Fictional Game Report",
      publisher: "Fictional League",
    },
  };

  it("passes HTTP 200 with a matching identity body", async () => {
    const { deps } = makeDeps((url) =>
      response(200, url, "Fictional Game Report — Fictional League"),
    );
    const result = await checkExternalUrl(entry, deps);
    expect(result.status).toBe("ok");
    expect(result.outcome).toBe("ok");
    expect(result.attempts).toBe(1);
    expect(result.identityChecked).toBe(true);
    expect(result.urlHash).toBe(sha256Hex(entry.url));
  });

  it("fails a redirect to a new canonical URL", async () => {
    const { deps } = makeDeps(() =>
      response(
        200,
        "https://league.example.org/archive/fic-2014-03-02",
        "Fictional Game Report Fictional League",
      ),
    );
    const result = await checkExternalUrl(entry, deps);
    expect(result.status).toBe("failed");
    expect(result.outcome).toBe("redirected-new-canonical");
    expect(result.finalUrl).toBe(
      "https://league.example.org/archive/fic-2014-03-02",
    );
  });

  it("fails HTTP 404 without retrying", async () => {
    const { deps, sleeps } = makeDeps((url) => response(404, url));
    const result = await checkExternalUrl(entry, deps);
    expect(result.status).toBe("failed");
    expect(result.outcome).toBe("http-error");
    expect(result.attempts).toBe(1);
    expect(sleeps).toEqual([]);
  });

  it("retries HTTP 429 with bounded exponential backoff, then succeeds", async () => {
    let calls = 0;
    const { deps, sleeps } = makeDeps((url) => {
      calls += 1;
      return calls < 3
        ? response(429, url)
        : response(200, url, "Fictional Game Report Fictional League");
    });
    const result = await checkExternalUrl(entry, deps);
    expect(result.status).toBe("ok");
    expect(result.attempts).toBe(3);
    expect(sleeps).toEqual([backoffDelayMs(1), backoffDelayMs(2)]);
  });

  it("fails after exhausting retries on a timeout", async () => {
    const { deps } = makeDeps(() => "hang");
    const result = await checkExternalUrl(entry, { ...deps, timeoutMs: 20 });
    expect(result.status).toBe("failed");
    expect(result.outcome).toBe("timeout");
    expect(result.attempts).toBe(MAX_ATTEMPTS);
  });

  it("fails after exhausting retries on a DNS/network error", async () => {
    const { deps, sleeps } = makeDeps(() => "network-error");
    const result = await checkExternalUrl(entry, deps);
    expect(result.status).toBe("failed");
    expect(result.outcome).toBe("network-error");
    expect(result.attempts).toBe(MAX_ATTEMPTS);
    expect(sleeps).toHaveLength(MAX_ATTEMPTS - 1);
  });

  it("fails a title/publisher identity mismatch on a source page", async () => {
    const { deps } = makeDeps((url) =>
      response(200, url, "Some entirely different page"),
    );
    const result = await checkExternalUrl(entry, deps);
    expect(result.status).toBe("failed");
    expect(result.outcome).toBe("identity-mismatch");
    expect(result.detail).toContain("title");
  });
});

describe("YouTube API adapter", () => {
  const videoEntry = {
    kind: "video-canonical",
    sourceId: null,
    url: "https://www.youtube.com/watch?v=fIcTiOnAl22",
    expectedIdentity: {
      uploaderName: "Fictional League Archive",
      uploaderProvenance: "official-league-channel",
    },
  };

  it("records not-obtained without a key and still checks reachability", async () => {
    const { deps, requested } = makeDeps((url) => response(200, url, ""));
    const result = await checkExternalUrl(videoEntry, deps);
    expect(result.status).toBe("ok");
    expect(result.youtubeApiKeyState).toBe("not-obtained");
    expect(result.identityChecked).toBe(false);
    expect(requested.filter((url) => url.includes("googleapis.com"))).toEqual(
      [],
    );
  });

  it("fails when the API reports status.embeddable=false", async () => {
    const { deps } = makeDeps((url) =>
      url.includes("googleapis.com")
        ? response(
            200,
            url,
            JSON.stringify({
              items: [
                {
                  snippet: {
                    title: "clip",
                    channelTitle: "Fictional League Archive",
                  },
                  status: { embeddable: false },
                },
              ],
            }),
          )
        : response(200, url, ""),
    );
    const result = await checkExternalUrl(videoEntry, {
      ...deps,
      youtubeApiKey: "test-key",
    });
    expect(result.status).toBe("failed");
    expect(result.outcome).toBe("not-embeddable");
    expect(result.youtubeApiKeyState).toBe("used");
  });

  it("fails an uploader identity mismatch from the API", async () => {
    const { deps } = makeDeps((url) =>
      url.includes("googleapis.com")
        ? response(
            200,
            url,
            JSON.stringify({
              items: [
                {
                  snippet: { title: "clip", channelTitle: "Somebody Else" },
                  status: { embeddable: true },
                },
              ],
            }),
          )
        : response(200, url, ""),
    );
    const result = await checkExternalUrl(videoEntry, {
      ...deps,
      youtubeApiKey: "test-key",
    });
    expect(result.status).toBe("failed");
    expect(result.outcome).toBe("identity-mismatch");
    expect(result.detail).toContain("Somebody Else");
  });
});

describe("case verification and artifact validation", () => {
  it("covers the exact URL set of a case and builds a valid artifact", async () => {
    const record = classicCase();
    const { deps } = makeDeps(healthyResponder(record));
    const caseResult = await verifyCaseExternalSources(record, deps);
    expect(caseResult.caseId).toBe(record.id);
    expect(caseResult.results.every((entry) => entry.status === "ok")).toBe(
      true,
    );

    const artifact = buildExternalVerificationArtifact([caseResult], NOW);
    const artifactHashes = artifact.cases[0]!.results.map(
      (entry) => entry.urlHash,
    ).sort();
    expect(artifactHashes).toEqual(expectedExternalUrlHashes(record));
    expect(
      validateExternalVerificationArtifact(artifact, [record], NOW),
    ).toEqual([]);
  });

  it("rejects results older than seven days", async () => {
    const record = classicCase();
    const { deps } = makeDeps(healthyResponder(record));
    const caseResult = await verifyCaseExternalSources(record, deps);
    const artifact = buildExternalVerificationArtifact([caseResult], NOW);
    const later = new Date(
      NOW.getTime() + (ARTIFACT_MAX_AGE_DAYS + 1) * 86_400_000,
    );
    const issues = validateExternalVerificationArtifact(
      artifact,
      [record],
      later,
    );
    expect(issues.map((entry) => entry.code)).toContain(
      "external-verification-stale",
    );
  });

  it("rejects a fresh artifact whose current URL set drifted", async () => {
    const record = classicCase();
    const { deps } = makeDeps(healthyResponder(record));
    const caseResult = await verifyCaseExternalSources(record, deps);
    const artifact = buildExternalVerificationArtifact([caseResult], NOW);

    // Changed URL: the case gained a different fallback after verification.
    const changed: InjuryCase = classicCase();
    changed.video.fallbackUrl = "https://www.youtube.com/watch?v=fic-beta-999";
    const changedIssues = validateExternalVerificationArtifact(
      artifact,
      [changed],
      NOW,
    ).map((entry) => entry.code);
    expect(changedIssues).toContain("external-verification-url-set");
    expect(changedIssues).toContain("external-verification-stale-digest");

    // Missing URL result: one recorded check dropped from the artifact.
    const truncated = buildExternalVerificationArtifact([caseResult], NOW);
    truncated.cases[0]!.results = truncated.cases[0]!.results.slice(1);
    expect(
      validateExternalVerificationArtifact(truncated, [record], NOW).map(
        (entry) => entry.code,
      ),
    ).toContain("external-verification-url-set");

    // Extra URL result: the artifact claims a URL the case does not have.
    const extra = buildExternalVerificationArtifact([caseResult], NOW);
    extra.cases[0]!.results = [
      ...extra.cases[0]!.results,
      { urlHash: sha256Hex("https://unrelated.example.org/"), status: "ok" },
    ];
    expect(
      validateExternalVerificationArtifact(extra, [record], NOW).map(
        (entry) => entry.code,
      ),
    ).toContain("external-verification-url-set");
  });

  it("rejects a recorded failed check and a missing case entry", async () => {
    const record = classicCase();
    const { deps } = makeDeps(healthyResponder(record));
    const caseResult = await verifyCaseExternalSources(record, deps);
    const artifact = buildExternalVerificationArtifact([caseResult], NOW);
    artifact.cases[0]!.results[0] = {
      ...artifact.cases[0]!.results[0]!,
      status: "failed",
    };
    expect(
      validateExternalVerificationArtifact(artifact, [record], NOW).map(
        (entry) => entry.code,
      ),
    ).toContain("external-verification-failed");

    const empty = buildExternalVerificationArtifact([], NOW);
    expect(
      validateExternalVerificationArtifact(empty, [record], NOW).map(
        (entry) => entry.code,
      ),
    ).toContain("external-verification-missing-case");
  });

  it("honors the concurrency bound while checking a full case", async () => {
    const record = classicCase();
    let inFlight = 0;
    let peak = 0;
    const responder = healthyResponder(record);
    const { deps } = makeDeps((url) => responder(url));
    const boundedFetch: FetchLike = async (url, init) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      const result = await deps.fetchImpl(url, init);
      inFlight -= 1;
      return result;
    };
    await verifyCaseExternalSources(
      record,
      { ...deps, fetchImpl: boundedFetch },
      { concurrency: 2 },
    );
    expect(peak).toBeLessThanOrEqual(2);
  });
});
