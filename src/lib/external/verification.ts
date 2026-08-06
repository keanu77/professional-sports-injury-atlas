/**
 * Bounded external-source verifier. Every network dependency (fetch, sleep,
 * clock, API key) is injected, so unit tests never touch the live internet
 * and the standard review build performs no requests at all. The verifier
 * only issues HTTPS GET/HEAD requests to URLs already present in validated
 * case data, retries at most three times with bounded exponential backoff,
 * and treats no oEmbed/API response as a rights or embeddability approval —
 * the result feeds the fail-closed release gate, nothing more.
 */

import { sha256Hex } from "../cases/canonical-json";
import {
  computeCaseContentDigest,
  computeVideoSourceDigest,
} from "../cases/digest";
import {
  issue,
  isValidUtcTimestamp,
  type ValidationIssue,
} from "../contracts/canonical";
import type { InjuryCase } from "../contracts/case";
import {
  computeExternalUrlSetDigest,
  expectedExternalUrlHashes,
  externalUrlEntries,
  externalVerificationArtifactSchema,
  type ExternalUrlEntry,
  type ExternalVerificationArtifact,
} from "../governance/release-gate";

export const DEFAULT_CONCURRENCY = 2;
export const MAX_CONCURRENCY = 3;
export const REQUEST_TIMEOUT_MS = 15_000;
export const MAX_ATTEMPTS = 3;
export const BACKOFF_BASE_MS = 1_000;
export const BACKOFF_MAX_MS = 8_000;
export const ARTIFACT_MAX_AGE_DAYS = 7;
export const ARTIFACT_PATH = "artifacts/external-verification.v1.json";

/** Minimal structural response so tests can stub fetch deterministically. */
export interface FetchResponseLike {
  status: number;
  /** Final URL after following redirects. */
  url: string;
  text(): Promise<string>;
}

export type FetchLike = (
  url: string,
  init: {
    method: "GET" | "HEAD";
    redirect: "follow";
    signal: AbortSignal;
    headers: Record<string, string>;
  },
) => Promise<FetchResponseLike>;

export interface VerifierDependencies {
  fetchImpl: FetchLike;
  sleep: (ms: number) => Promise<void>;
  now: () => Date;
  /** Optional; when absent, YouTube API checks record `not-obtained`. */
  youtubeApiKey: string | null;
  /** Test-only override; production always uses REQUEST_TIMEOUT_MS. */
  timeoutMs?: number;
}

export interface VerifierOptions {
  /** Default 2; values above the hard maximum of 3 are rejected. */
  concurrency?: number;
}

export type UrlCheckOutcome =
  | "ok"
  | "non-https"
  | "redirected-new-canonical"
  | "http-error"
  | "identity-mismatch"
  | "not-embeddable"
  | "timeout"
  | "network-error";

export type YoutubeApiKeyState = "used" | "not-obtained" | "not-applicable";

export interface UrlCheckResult {
  url: string;
  urlHash: string;
  kind: string;
  sourceId: string | null;
  attempts: number;
  outcome: UrlCheckOutcome;
  status: "ok" | "failed";
  /** Final URL after redirects; null when the request never completed. */
  finalUrl: string | null;
  /** Whether an expected-identity comparison actually ran. */
  identityChecked: boolean;
  youtubeApiKeyState: YoutubeApiKeyState;
  detail: string;
}

export interface CaseVerificationResult {
  caseId: string;
  clinicalDigest: string;
  videoSourceDigest: string;
  externalUrlSetDigest: string;
  checkedAt: string;
  results: UrlCheckResult[];
}

const YOUTUBE_HOSTS = new Set(["www.youtube.com", "youtube.com", "youtu.be"]);
const YOUTUBE_API_ENDPOINT = "https://www.googleapis.com/youtube/v3/videos";

/** Bounded exponential backoff: base * 2^(attempt-1), capped. */
export function backoffDelayMs(attempt: number): number {
  return Math.min(BACKOFF_BASE_MS * 2 ** (attempt - 1), BACKOFF_MAX_MS);
}

function utcTimestamp(date: Date): string {
  return `${date.toISOString().slice(0, 19)}Z`;
}

function isRetryableStatus(status: number): boolean {
  return status === 429;
}

function normalizeForMatch(value: string): string {
  return value.normalize("NFC").toLowerCase();
}

interface AttemptOutcome {
  kind: "response" | "timeout" | "network-error";
  response?: FetchResponseLike;
  detail: string;
}

async function attemptFetch(
  url: string,
  method: "GET" | "HEAD",
  deps: VerifierDependencies,
): Promise<AttemptOutcome> {
  const timeoutMs = deps.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  try {
    const response = await deps.fetchImpl(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { accept: "text/html,application/json" },
    });
    return { kind: "response", response, detail: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (controller.signal.aborted || /abort/i.test(message)) {
      return { kind: "timeout", detail: `request exceeded ${timeoutMs}ms` };
    }
    return { kind: "network-error", detail: message };
  } finally {
    clearTimeout(timer);
  }
}

/** GET/HEAD with at most MAX_ATTEMPTS bounded-backoff attempts. */
async function fetchWithRetry(
  url: string,
  method: "GET" | "HEAD",
  deps: VerifierDependencies,
): Promise<{ attempts: number; outcome: AttemptOutcome }> {
  let attempts = 0;
  let last: AttemptOutcome = { kind: "network-error", detail: "not attempted" };
  while (attempts < MAX_ATTEMPTS) {
    attempts += 1;
    last = await attemptFetch(url, method, deps);
    const retryable =
      last.kind === "timeout" ||
      last.kind === "network-error" ||
      (last.kind === "response" &&
        last.response !== undefined &&
        isRetryableStatus(last.response.status));
    if (!retryable) return { attempts, outcome: last };
    if (attempts < MAX_ATTEMPTS) await deps.sleep(backoffDelayMs(attempts));
  }
  return { attempts, outcome: last };
}

function parseYouTubeIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!YOUTUBE_HOSTS.has(parsed.hostname)) return null;
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    const id = parsed.searchParams.get("v");
    return id !== null && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

interface YoutubeApiCheck {
  state: YoutubeApiKeyState;
  outcome: "ok" | "identity-mismatch" | "not-embeddable" | "http-error";
  detail: string;
}

/**
 * Optional YouTube Data API identity/embeddability check. A successful
 * response is a technical status only, never a rights approval.
 */
async function checkYoutubeApi(
  videoId: string,
  expectedUploader: string | undefined,
  deps: VerifierDependencies,
): Promise<YoutubeApiCheck> {
  if (deps.youtubeApiKey === null || deps.youtubeApiKey === "") {
    return {
      state: "not-obtained",
      outcome: "ok",
      detail: "YOUTUBE_API_KEY not obtained; API identity check skipped",
    };
  }
  const apiUrl =
    `${YOUTUBE_API_ENDPOINT}?part=snippet,status` +
    `&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(deps.youtubeApiKey)}`;
  const { outcome } = await fetchWithRetry(apiUrl, "GET", deps);
  if (outcome.kind !== "response" || outcome.response === undefined) {
    return {
      state: "used",
      outcome: "http-error",
      detail: `YouTube API request failed: ${outcome.detail}`,
    };
  }
  if (outcome.response.status !== 200) {
    return {
      state: "used",
      outcome: "http-error",
      detail: `YouTube API returned HTTP ${outcome.response.status}`,
    };
  }
  let payload: unknown;
  try {
    payload = JSON.parse(await outcome.response.text());
  } catch {
    return {
      state: "used",
      outcome: "http-error",
      detail: "YouTube API returned unparsable JSON",
    };
  }
  const items = (payload as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length !== 1) {
    return {
      state: "used",
      outcome: "http-error",
      detail: "YouTube API did not return exactly one video",
    };
  }
  const item = items[0] as {
    snippet?: { title?: unknown; channelTitle?: unknown };
    status?: { embeddable?: unknown };
  };
  if (item.status?.embeddable === false) {
    return {
      state: "used",
      outcome: "not-embeddable",
      detail: "YouTube API reports status.embeddable=false",
    };
  }
  const channelTitle = item.snippet?.channelTitle;
  if (
    expectedUploader !== undefined &&
    typeof channelTitle === "string" &&
    normalizeForMatch(channelTitle) !== normalizeForMatch(expectedUploader)
  ) {
    return {
      state: "used",
      outcome: "identity-mismatch",
      detail: `uploader mismatch: expected ${JSON.stringify(expectedUploader)}, API returned ${JSON.stringify(channelTitle)}`,
    };
  }
  return { state: "used", outcome: "ok", detail: "" };
}

/** Textual identity fields compared against the fetched body. */
const IDENTITY_BODY_FIELDS = new Set(["title", "publisher", "uploaderName"]);

function missingIdentityValues(
  body: string,
  expectedIdentity: Record<string, string>,
): string[] {
  const haystack = normalizeForMatch(body);
  const missing: string[] = [];
  for (const [field, value] of Object.entries(expectedIdentity)) {
    if (!IDENTITY_BODY_FIELDS.has(field)) continue;
    if (!haystack.includes(normalizeForMatch(value))) missing.push(field);
  }
  return missing;
}

function normalizedUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/** Verifies one already-validated external URL entry. */
export async function checkExternalUrl(
  entry: ExternalUrlEntry,
  deps: VerifierDependencies,
): Promise<UrlCheckResult> {
  const base: Omit<
    UrlCheckResult,
    | "attempts"
    | "outcome"
    | "status"
    | "finalUrl"
    | "identityChecked"
    | "detail"
  > = {
    url: entry.url,
    urlHash: sha256Hex(entry.url),
    kind: entry.kind,
    sourceId: entry.sourceId,
    youtubeApiKeyState: "not-applicable",
  };
  if (!entry.url.startsWith("https://")) {
    return {
      ...base,
      attempts: 0,
      outcome: "non-https",
      status: "failed",
      finalUrl: null,
      identityChecked: false,
      detail:
        "only HTTPS URLs already present in validated case data may be checked",
    };
  }

  const { attempts, outcome } = await fetchWithRetry(entry.url, "GET", deps);
  if (outcome.kind === "timeout") {
    return {
      ...base,
      attempts,
      outcome: "timeout",
      status: "failed",
      finalUrl: null,
      identityChecked: false,
      detail: outcome.detail,
    };
  }
  if (outcome.kind === "network-error" || outcome.response === undefined) {
    return {
      ...base,
      attempts,
      outcome: "network-error",
      status: "failed",
      finalUrl: null,
      identityChecked: false,
      detail: outcome.detail,
    };
  }
  const response = outcome.response;
  if (response.status !== 200) {
    return {
      ...base,
      attempts,
      outcome: "http-error",
      status: "failed",
      finalUrl: response.url,
      identityChecked: false,
      detail: `HTTP ${response.status}`,
    };
  }
  if (normalizedUrl(response.url) !== normalizedUrl(entry.url)) {
    return {
      ...base,
      attempts,
      outcome: "redirected-new-canonical",
      status: "failed",
      finalUrl: response.url,
      identityChecked: false,
      detail:
        `redirected to a new canonical URL ${JSON.stringify(response.url)}; ` +
        "the case record must be re-verified against the new location",
    };
  }

  const videoId = parseYouTubeIdFromUrl(entry.url);
  if (videoId !== null) {
    const api = await checkYoutubeApi(
      videoId,
      entry.expectedIdentity.uploaderName,
      deps,
    );
    if (api.outcome !== "ok") {
      return {
        ...base,
        attempts,
        outcome: api.outcome,
        status: "failed",
        finalUrl: response.url,
        identityChecked: api.state === "used",
        youtubeApiKeyState: api.state,
        detail: api.detail,
      };
    }
    return {
      ...base,
      attempts,
      outcome: "ok",
      status: "ok",
      finalUrl: response.url,
      identityChecked: api.state === "used",
      youtubeApiKeyState: api.state,
      detail: api.detail,
    };
  }

  const body = await response.text();
  const missing = missingIdentityValues(body, entry.expectedIdentity);
  if (missing.length > 0) {
    return {
      ...base,
      attempts,
      outcome: "identity-mismatch",
      status: "failed",
      finalUrl: response.url,
      identityChecked: true,
      detail: `expected identity fields not found in page: ${missing.join(", ")}`,
    };
  }
  return {
    ...base,
    attempts,
    outcome: "ok",
    status: "ok",
    finalUrl: response.url,
    identityChecked: true,
    detail: "",
  };
}

/** Small worker pool honoring the bounded concurrency contract. */
async function runPool<T, R>(
  items: readonly T[],
  worker: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const lanes = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await worker(items[index] as T);
      }
    },
  );
  await Promise.all(lanes);
  return results;
}

function resolveConcurrency(options: VerifierOptions): number {
  const requested = options.concurrency ?? DEFAULT_CONCURRENCY;
  if (
    !Number.isInteger(requested) ||
    requested < 1 ||
    requested > MAX_CONCURRENCY
  ) {
    throw new Error(
      `concurrency must be an integer between 1 and ${MAX_CONCURRENCY}`,
    );
  }
  return requested;
}

/** Verifies every current external URL of one validated case. */
export async function verifyCaseExternalSources(
  record: InjuryCase,
  deps: VerifierDependencies,
  options: VerifierOptions = {},
): Promise<CaseVerificationResult> {
  const concurrency = resolveConcurrency(options);
  const entries = externalUrlEntries(record);
  const results = await runPool(
    entries,
    (entry) => checkExternalUrl(entry, deps),
    concurrency,
  );
  return {
    caseId: record.id,
    clinicalDigest: computeCaseContentDigest(record),
    videoSourceDigest: computeVideoSourceDigest(record),
    externalUrlSetDigest: computeExternalUrlSetDigest(record),
    checkedAt: utcTimestamp(deps.now()),
    results,
  };
}

/** Projects verifier results onto the gate artifact contract. */
export function buildExternalVerificationArtifact(
  caseResults: readonly CaseVerificationResult[],
  generatedAt: Date,
): ExternalVerificationArtifact {
  const artifact: ExternalVerificationArtifact = {
    schemaVersion: 1,
    artifactType: "external-verification",
    generatedAt: utcTimestamp(generatedAt),
    cases: caseResults.map((entry) => ({
      caseId: entry.caseId,
      clinicalDigest: entry.clinicalDigest,
      videoSourceDigest: entry.videoSourceDigest,
      externalUrlSetDigest: entry.externalUrlSetDigest,
      checkedAt: entry.checkedAt,
      results: [
        ...new Map(
          entry.results.map((result) => [
            result.urlHash,
            { urlHash: result.urlHash, status: result.status },
          ]),
        ).values(),
      ].sort((a, b) => (a.urlHash < b.urlHash ? -1 : 1)),
    })),
  };
  return artifact;
}

function daysBetween(earlier: string, later: Date): number {
  return (later.getTime() - new Date(earlier).getTime()) / 86_400_000;
}

/**
 * Standalone artifact validation mirroring the release gate: schema, digest
 * binding, seven-day freshness, zero failed checks, and an exact match with
 * the current external URL set — a missing, extra, or changed URL fails even
 * when the artifact is fresh.
 */
export function validateExternalVerificationArtifact(
  artifact: unknown,
  currentCases: readonly InjuryCase[],
  now: Date,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const parsed = externalVerificationArtifactSchema.safeParse(artifact);
  if (!parsed.success) {
    return parsed.error.issues.map((zodIssue) =>
      issue(
        "external-verification-schema",
        zodIssue.path.join("."),
        zodIssue.message,
      ),
    );
  }
  if (!isValidUtcTimestamp(parsed.data.generatedAt)) {
    issues.push(
      issue(
        "external-verification-generated-at",
        "generatedAt",
        "generatedAt must be a valid UTC timestamp",
      ),
    );
  }
  const byCaseId = new Map(
    parsed.data.cases.map((entry) => [entry.caseId, entry]),
  );
  for (const record of currentCases) {
    const entry = byCaseId.get(record.id);
    const location = `cases.${record.id}`;
    if (entry === undefined) {
      issues.push(
        issue(
          "external-verification-missing-case",
          location,
          "case has no external verification entry",
        ),
      );
      continue;
    }
    if (
      entry.clinicalDigest !== computeCaseContentDigest(record) ||
      entry.videoSourceDigest !== computeVideoSourceDigest(record) ||
      entry.externalUrlSetDigest !== computeExternalUrlSetDigest(record)
    ) {
      issues.push(
        issue(
          "external-verification-stale-digest",
          location,
          "entry is bound to a stale clinical/video/URL-set digest",
        ),
      );
    }
    if (daysBetween(entry.checkedAt, now) > ARTIFACT_MAX_AGE_DAYS) {
      issues.push(
        issue(
          "external-verification-stale",
          location,
          `verification is older than ${ARTIFACT_MAX_AGE_DAYS} days`,
        ),
      );
    }
    if (entry.results.some((result) => result.status !== "ok")) {
      issues.push(
        issue(
          "external-verification-failed",
          location,
          "a URL check failed; the case is not externally verified",
        ),
      );
    }
    const expected = expectedExternalUrlHashes(record);
    const actual = [
      ...new Set(entry.results.map((result) => result.urlHash)),
    ].sort();
    if (
      expected.length !== actual.length ||
      expected.some((hash, index) => hash !== actual[index])
    ) {
      issues.push(
        issue(
          "external-verification-url-set",
          location,
          "results do not cover the exact current external URL set",
        ),
      );
    }
  }
  return issues;
}
