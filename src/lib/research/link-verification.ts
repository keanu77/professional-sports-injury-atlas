/**
 * Bounded, body-free live verification for the NBA source-discovery ledgers.
 *
 * The browser review remains authoritative for embed, caption, provenance, and
 * event identity. This module only rechecks reachability and, when an operator
 * supplies a YouTube Data API key, corroborates the stored title/uploader and
 * embeddability metadata. API keys and response/page bodies are never stored.
 */

import { isIP } from "node:net";

import {
  canonicalJson,
  isValidUtcTimestamp,
  SHA256_RE,
  sha256Hex,
} from "../contracts/canonical";
import { parseYouTubeVideoId } from "../video/youtube";
import type { CandidateEmbedStatus, CandidateRow } from "./candidate-contract";
import {
  CANDIDATE_EMBED_STATUSES,
  CANDIDATE_INJURY_CODES,
} from "./candidate-contract";

export const LIVE_VERIFICATION_CONCURRENCY = 2;
export const LIVE_VERIFICATION_MAX_CONCURRENCY = 3;
export const LIVE_VERIFICATION_TIMEOUT_MS = 15_000;
export const LIVE_VERIFICATION_ATTEMPTS = 3;
export const LIVE_VERIFICATION_MAX_REDIRECTS = 3;
export const LIVE_VERIFICATION_STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1_000;
export const LIVE_VERIFICATION_USER_AGENT =
  "ProfessionalSportsInjuryAtlas-ResearchVerifier/1.0 (+local-source-audit)";

export const VERIFICATION_URL_KINDS = [
  "diagnosis-source-1",
  "diagnosis-source-2",
  "event",
  "video",
  "video-channel",
] as const;
export type VerificationUrlKind = (typeof VERIFICATION_URL_KINDS)[number];

export type RootAuditStatus = "not-obtained" | "passed" | "failed";
export type VerificationOutcome =
  "reachable" | "removed" | "temporary-error" | "metadata-mismatch";
export type MetadataComparison = "matched" | "mismatch" | "not-obtained";
export type YouTubeApiStatus =
  | "not-applicable"
  | "not-obtained"
  | "verified"
  | "not-embeddable"
  | "private-or-deleted"
  | "mismatch"
  | "api-error";

export interface RootAuditLocationCheck {
  url: string;
  outcome: string;
  observedAt: string;
}

export interface RootAuditArchiveCheck {
  queryOrUrl: string;
  outcome: string;
  observedAt: string;
}

export interface RootAuditCandidate {
  candidateId: string;
  eventPass: boolean;
  videoPass: boolean;
  diagnosisPass: boolean;
  checkedBy: string;
  checkedAt: string;
  reason: string;
  firstPartyAvailability: {
    status: "available" | "documented-unavailable" | "not-applicable";
    basis: string | null;
    checkedBy: string;
    checkedAt: string;
    officialLocationsChecked: RootAuditLocationCheck[];
    archiveOrSearchChecks: RootAuditArchiveCheck[];
  };
  auditReference: string;
}

export interface RootSourceAuditV1 {
  schemaVersion: 1;
  manifestId: "NBA-SOURCE-2026-08-06-001";
  checkedAt: string;
  candidates: RootAuditCandidate[];
}

export interface VerificationIdentity {
  athleteDisplayName: string;
  eventDate: string;
  teamAtEvent: string;
  opponent: string;
  competition: string;
}

export interface PlannedVerificationUrl {
  candidateId: string;
  kind: VerificationUrlKind;
  canonicalUrl: string;
  urlHash: string;
  expectedTitle: string;
  expectedPublisher: string;
  expectedUploader: string;
  expectedEmbedStatus: CandidateEmbedStatus | null;
  identity: VerificationIdentity;
  rootAuditReference: string | null;
  rootAuditStatus: RootAuditStatus;
}

export interface VerificationPlan {
  acceptedSetDigest: string;
  rootAuditDigest: string | null;
  urls: PlannedVerificationUrl[];
}

export interface CandidateVerificationResult extends PlannedVerificationUrl {
  checkedAt: string;
  /** Combined page and optional YouTube API attempts; never above the URL cap. */
  attempts: number;
  finalUrl: string | null;
  statusCode: number | null;
  contentType: string | null;
  outcome: VerificationOutcome;
  errorClassification: string | null;
  metadataComparison: MetadataComparison;
  observedTitle: string | null;
  observedUploader: string | null;
  youtubeApiStatus: YouTubeApiStatus;
  youtubeEmbeddable: boolean | null;
}

export interface CandidateVerificationArtifactV1 {
  schemaVersion: 1;
  checkedAt: string;
  concurrency: number;
  acceptedSetDigest: string;
  rootAuditDigest: string | null;
  results: CandidateVerificationResult[];
}

export interface VerificationHeaders {
  get(name: string): string | null;
}

export interface VerificationResponse {
  status: number;
  url: string;
  headers: VerificationHeaders;
  body?: { cancel(): Promise<void> } | null;
  json(): Promise<unknown>;
}

export type VerificationFetch = (
  input: string,
  init?: {
    headers?: Record<string, string>;
    redirect?: "error" | "manual";
    signal?: AbortSignal;
  },
) => Promise<VerificationResponse>;

export interface VerifyUrlOptions {
  fetch: VerificationFetch;
  now?: () => string;
  sleep?: (milliseconds: number) => Promise<void>;
  youtubeApiKey?: string;
  timeoutMs?: number;
  attempts?: number;
}

export interface VerifyCandidateUrlsOptions extends VerifyUrlOptions {
  concurrency?: number;
  rootAudit?: RootSourceAuditV1 | null;
}

export interface VerificationIssue {
  code: string;
  path: string;
  message: string;
}

export interface SourceReviewDecisionV1 {
  schemaVersion: 1;
  manifestId: "NBA-SOURCE-2026-08-06-001";
  status: "approved-for-manifest";
  sourcePolicyJsonDigest: string;
  sourcePolicyMarkdownDigest: string;
  reviewedBy: string;
  reviewedAt: string;
  candidateSetDigest: string;
  classicProposalCandidateIds: string[];
}

export interface ValidateCandidateVerificationOptions {
  rows: CandidateRow[];
  artifact: CandidateVerificationArtifactV1;
  now: string;
  rootAudit: RootSourceAuditV1 | null;
  decision?: SourceReviewDecisionV1;
  policyDigests?: { json: string; markdown: string };
  expectedCandidateSetDigest?: string;
  boundVerificationDigest?: string;
  requireRootAudit?: boolean;
  requireReviewDecision?: boolean;
}

const acceptedRow = (row: CandidateRow): boolean =>
  row.discoveryStatus === "source-ready" ||
  row.discoveryStatus === "source-verified";

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

const injuryOrder = new Map(
  CANDIDATE_INJURY_CODES.map((injury, index) => [injury, index]),
);

function compareAcceptedRows(left: CandidateRow, right: CandidateRow): number {
  return (
    (injuryOrder.get(left.injuryCode) ?? injuryOrder.size) -
      (injuryOrder.get(right.injuryCode) ?? injuryOrder.size) ||
    compareText(left.eventDate, right.eventDate) ||
    compareText(left.candidateId, right.candidateId)
  );
}

function workflowFreeRow(row: CandidateRow): Record<string, unknown> {
  const {
    discoveryStatus: _discoveryStatus,
    reviewedBy: _reviewedBy,
    reviewedAt: _reviewedAt,
    csvFilename: _csvFilename,
    csvRow: _csvRow,
    expectedInjury: _expectedInjury,
    ...facts
  } = row;
  return facts;
}

export function buildAcceptedSetProjection(
  rows: readonly CandidateRow[],
): Record<string, unknown>[] {
  return rows
    .filter(acceptedRow)
    .sort(compareAcceptedRows)
    .map(workflowFreeRow);
}

function rootAuditBinding(
  candidateId: string,
  rootAudit: RootSourceAuditV1 | null | undefined,
): Pick<PlannedVerificationUrl, "rootAuditReference" | "rootAuditStatus"> {
  if (!rootAudit) {
    return { rootAuditReference: null, rootAuditStatus: "not-obtained" };
  }
  const matches = rootAudit.candidates.filter(
    (candidate) => candidate.candidateId === candidateId,
  );
  if (matches.length !== 1) {
    return { rootAuditReference: null, rootAuditStatus: "failed" };
  }
  const candidate = matches[0]!;
  return {
    rootAuditReference: candidate.auditReference,
    rootAuditStatus:
      candidate.eventPass && candidate.videoPass && candidate.diagnosisPass
        ? "passed"
        : "failed",
  };
}

function verificationIdentity(row: CandidateRow): VerificationIdentity {
  return {
    athleteDisplayName: row.athleteDisplayName,
    eventDate: row.eventDate,
    teamAtEvent: row.teamAtEvent,
    opponent: row.opponent,
    competition: row.competition,
  };
}

function plannedUrl(
  row: CandidateRow,
  rootAudit: RootSourceAuditV1 | null | undefined,
  kind: VerificationUrlKind,
  canonicalUrl: string,
  expectedTitle: string,
  expectedPublisher: string,
  expectedUploader = "",
  expectedEmbedStatus: CandidateEmbedStatus | null = null,
): PlannedVerificationUrl {
  return {
    candidateId: row.candidateId,
    kind,
    canonicalUrl,
    urlHash: sha256Hex(canonicalUrl),
    expectedTitle,
    expectedPublisher,
    expectedUploader,
    expectedEmbedStatus,
    identity: verificationIdentity(row),
    ...rootAuditBinding(row.candidateId, rootAudit),
  };
}

function plannedUrlsForRow(
  row: CandidateRow,
  rootAudit: RootSourceAuditV1 | null | undefined,
): PlannedVerificationUrl[] {
  const entries = [
    plannedUrl(
      row,
      rootAudit,
      "diagnosis-source-1",
      row.diagnosisSource1Url,
      row.diagnosisSource1Title,
      row.diagnosisSource1Publisher,
    ),
    plannedUrl(
      row,
      rootAudit,
      "event",
      row.eventSourceUrl,
      row.eventSourceTitle,
      row.eventSourcePublisher,
    ),
    plannedUrl(
      row,
      rootAudit,
      "video",
      row.videoCanonicalUrl,
      row.videoTitle,
      row.videoUploaderName,
      row.videoUploaderName,
      row.embedStatus,
    ),
    plannedUrl(
      row,
      rootAudit,
      "video-channel",
      row.videoChannelUrl,
      row.videoUploaderName,
      row.videoUploaderName,
      row.videoUploaderName,
    ),
  ];
  if (row.diagnosisSource2Url !== "") {
    entries.push(
      plannedUrl(
        row,
        rootAudit,
        "diagnosis-source-2",
        row.diagnosisSource2Url,
        row.diagnosisSource2Title,
        row.diagnosisSource2Publisher,
      ),
    );
  }
  return entries.sort(
    (left, right) =>
      compareText(left.candidateId, right.candidateId) ||
      compareText(left.kind, right.kind) ||
      compareText(left.canonicalUrl, right.canonicalUrl),
  );
}

export function buildVerificationPlan(
  rows: readonly CandidateRow[],
  rootAudit: RootSourceAuditV1 | null = null,
): VerificationPlan {
  const acceptedRows = rows.filter(acceptedRow).sort(compareAcceptedRows);
  return {
    acceptedSetDigest: sha256Hex(
      canonicalJson(buildAcceptedSetProjection(acceptedRows)),
    ),
    rootAuditDigest: rootAudit ? sha256Hex(canonicalJson(rootAudit)) : null,
    urls: acceptedRows.flatMap((row) => plannedUrlsForRow(row, rootAudit)),
  };
}

const defaultNow = (): string =>
  new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const defaultSleep = async (milliseconds: number): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
};

function normalizedComparableUrl(value: string): string {
  const parsed = new URL(value);
  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }
  return parsed.toString();
}

function sameCanonicalUrl(expected: string, observed: string): boolean {
  try {
    const expectedYouTubeId = parseYouTubeVideoId(expected);
    const observedYouTubeId = parseYouTubeVideoId(observed);
    if (expectedYouTubeId !== null || observedYouTubeId !== null) {
      return (
        expectedYouTubeId !== null &&
        observedYouTubeId !== null &&
        expectedYouTubeId === observedYouTubeId
      );
    }
    return (
      normalizedComparableUrl(expected) === normalizedComparableUrl(observed)
    );
  } catch {
    return false;
  }
}

function isPublicIpLiteral(hostname: string): boolean {
  const unwrapped = hostname.replace(/^\[|\]$/gu, "");
  const version = isIP(unwrapped);
  if (version === 0) return true;
  if (version === 4) {
    const octets = unwrapped.split(".").map(Number);
    const [first = -1, second = -1] = octets;
    return !(
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && (second === 0 || second === 168 || second === 88)) ||
      (first === 198 && (second === 18 || second === 19)) ||
      first >= 224
    );
  }
  const normalized = unwrapped.toLowerCase();
  const compatibleMatch = normalized.match(
    /^::(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/u,
  );
  if (compatibleMatch) {
    const high = Number.parseInt(compatibleMatch[1]!, 16);
    const low = Number.parseInt(compatibleMatch[2]!, 16);
    const mappedIpv4 = [high >>> 8, high & 0xff, low >>> 8, low & 0xff].join(
      ".",
    );
    return isPublicIpLiteral(mappedIpv4);
  }
  return !(
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/u.test(normalized) ||
    normalized.startsWith("ff")
  );
}

function assertAttemptBounds(attempts: number, timeoutMs: number): void {
  if (
    !Number.isInteger(attempts) ||
    attempts < 1 ||
    attempts > LIVE_VERIFICATION_ATTEMPTS
  ) {
    throw new Error(
      `attempts must be an integer between 1 and ${LIVE_VERIFICATION_ATTEMPTS}`,
    );
  }
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > LIVE_VERIFICATION_TIMEOUT_MS
  ) {
    throw new Error(
      `timeoutMs must be an integer between 1 and ${LIVE_VERIFICATION_TIMEOUT_MS}`,
    );
  }
}

function isSafeCandidateHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase().replace(/\.$/u, "");
    return (
      parsed.protocol === "https:" &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.port === "" &&
      parsed.hash === "" &&
      hostname !== "localhost" &&
      !hostname.endsWith(".localhost") &&
      !hostname.endsWith(".local") &&
      isPublicIpLiteral(hostname)
    );
  } catch {
    return false;
  }
}

function pageContentType(value: string | null): boolean {
  if (!value) return false;
  const mediaType = value.split(";", 1)[0]!.trim().toLowerCase();
  return mediaType === "text/html" || mediaType === "application/xhtml+xml";
}

function errorClass(error: unknown): "timeout" | "dns" | "network" {
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  const record = error as {
    code?: unknown;
    cause?: { code?: unknown };
    message?: unknown;
  };
  const code = String(record?.code ?? record?.cause?.code ?? "");
  const message = String(record?.message ?? "");
  if (
    ["ENOTFOUND", "EAI_AGAIN", "EAI_FAIL"].includes(code) ||
    /(?:ENOTFOUND|getaddrinfo|DNS)/i.test(message)
  ) {
    return "dns";
  }
  return "network";
}

function baseResult(
  item: PlannedVerificationUrl,
  checkedAt: string,
  attempts: number,
): CandidateVerificationResult {
  return {
    ...item,
    checkedAt,
    attempts,
    finalUrl: null,
    statusCode: null,
    contentType: null,
    outcome: "temporary-error",
    errorClassification: "network",
    metadataComparison: "not-obtained",
    observedTitle: null,
    observedUploader: null,
    youtubeApiStatus:
      item.kind === "video" && parseYouTubeVideoId(item.canonicalUrl) !== null
        ? "not-obtained"
        : "not-applicable",
    youtubeEmbeddable: null,
  };
}

interface YouTubeApiItem {
  snippet?: { title?: unknown; channelTitle?: unknown };
  status?: { embeddable?: unknown; privacyStatus?: unknown };
}

function normalizedMetadata(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ");
}

interface AttemptDeadline {
  controller: AbortController;
  promise: Promise<never>;
  clear(): void;
}

function createAttemptDeadline(timeoutMs: number): AttemptDeadline {
  const controller = new AbortController();
  let timer!: ReturnType<typeof setTimeout>;
  const promise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      const error = new Error("verification attempt timed out");
      error.name = "AbortError";
      reject(error);
    }, timeoutMs);
  });
  return {
    controller,
    promise,
    clear: () => clearTimeout(timer),
  };
}

function cancelResponseBody(response: VerificationResponse): void {
  try {
    const cancellation = response.body?.cancel();
    if (cancellation) void cancellation.catch(() => undefined);
  } catch {
    // Cancellation is best-effort after all permitted response facts are read.
  }
}

interface CandidatePageSuccess {
  ok: true;
  response: VerificationResponse;
  finalUrl: string;
}

interface CandidatePageRedirectFailure {
  ok: false;
  classification: string;
  finalUrl: string | null;
  statusCode: number;
  contentType: string | null;
}

async function fetchCandidatePage(
  item: PlannedVerificationUrl,
  options: VerifyUrlOptions,
  deadline: AttemptDeadline,
): Promise<CandidatePageSuccess | CandidatePageRedirectFailure> {
  let requestUrl = item.canonicalUrl;
  const visited = new Set<string>([requestUrl]);
  for (let redirectCount = 0; ; redirectCount += 1) {
    const fetched = await Promise.race([
      options.fetch(requestUrl, {
        headers: { "User-Agent": LIVE_VERIFICATION_USER_AGENT },
        redirect: "manual",
        signal: deadline.controller.signal,
      }),
      deadline.promise,
    ]);
    const responseUrl = fetched.url || requestUrl;
    if (fetched.status < 300 || fetched.status >= 400) {
      return { ok: true, response: fetched, finalUrl: responseUrl };
    }

    const contentType = fetched.headers.get("content-type");
    const location = fetched.headers.get("location");
    cancelResponseBody(fetched);
    if (!location) {
      return {
        ok: false,
        classification: "redirect-missing-location",
        finalUrl: responseUrl,
        statusCode: fetched.status,
        contentType,
      };
    }
    let target: string;
    try {
      target = new URL(location, requestUrl).toString();
    } catch {
      return {
        ok: false,
        classification: "redirect-invalid-location",
        finalUrl: null,
        statusCode: fetched.status,
        contentType,
      };
    }
    if (!isSafeCandidateHttpsUrl(target)) {
      return {
        ok: false,
        classification: "unsafe-redirect",
        finalUrl: target,
        statusCode: fetched.status,
        contentType,
      };
    }
    if (!sameCanonicalUrl(item.canonicalUrl, target)) {
      return {
        ok: false,
        classification: "canonical-url-drift",
        finalUrl: target,
        statusCode: fetched.status,
        contentType,
      };
    }
    if (redirectCount >= LIVE_VERIFICATION_MAX_REDIRECTS) {
      return {
        ok: false,
        classification: "too-many-redirects",
        finalUrl: target,
        statusCode: fetched.status,
        contentType,
      };
    }
    if (visited.has(target)) {
      return {
        ok: false,
        classification: "redirect-loop",
        finalUrl: target,
        statusCode: fetched.status,
        contentType,
      };
    }
    visited.add(target);
    requestUrl = target;
  }
}

function youtubeApiTemporaryError(
  result: CandidateVerificationResult,
  classification: string,
): CandidateVerificationResult {
  return {
    ...result,
    outcome: "temporary-error",
    errorClassification: classification,
    metadataComparison: "not-obtained",
    observedTitle: null,
    observedUploader: null,
    youtubeApiStatus: "api-error",
    youtubeEmbeddable: null,
  };
}

async function applyYouTubeMetadata(
  result: CandidateVerificationResult,
  item: PlannedVerificationUrl,
  options: VerifyUrlOptions,
): Promise<CandidateVerificationResult> {
  if (
    item.kind !== "video" ||
    parseYouTubeVideoId(item.canonicalUrl) === null
  ) {
    return result;
  }
  if (!options.youtubeApiKey) {
    return {
      ...result,
      youtubeApiStatus: "not-obtained",
      youtubeEmbeddable: null,
      metadataComparison: "not-obtained",
    };
  }

  const videoId = parseYouTubeVideoId(item.canonicalUrl)!;
  const apiUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  apiUrl.searchParams.set("part", "snippet,contentDetails,status");
  apiUrl.searchParams.set("id", videoId);
  apiUrl.searchParams.set("key", options.youtubeApiKey);
  const attemptsLimit = options.attempts ?? LIVE_VERIFICATION_ATTEMPTS;
  const apiAttemptsLimit = attemptsLimit - result.attempts;
  if (apiAttemptsLimit < 1) {
    return youtubeApiTemporaryError(
      result,
      "youtube-api-attempt-budget-exhausted",
    );
  }
  const timeoutMs = options.timeoutMs ?? LIVE_VERIFICATION_TIMEOUT_MS;
  const sleep = options.sleep ?? defaultSleep;
  let parsedResponse: { items?: unknown } | null = null;
  let apiAttemptsMade = 0;
  const resultWithApiAttempts = (): CandidateVerificationResult => ({
    ...result,
    attempts: result.attempts + apiAttemptsMade,
  });
  for (let attempt = 1; attempt <= apiAttemptsLimit; attempt += 1) {
    apiAttemptsMade = attempt;
    const deadline = createAttemptDeadline(timeoutMs);
    let fetched: VerificationResponse | null = null;
    let retryClassification: string | null = null;
    try {
      fetched = await Promise.race([
        options.fetch(apiUrl.toString(), {
          headers: { "User-Agent": LIVE_VERIFICATION_USER_AGENT },
          redirect: "error",
          signal: deadline.controller.signal,
        }),
        deadline.promise,
      ]);
      if (fetched.status === 429 || fetched.status >= 500) {
        cancelResponseBody(fetched);
        retryClassification = `youtube-api-http-${fetched.status}`;
      } else if (fetched.status < 200 || fetched.status >= 300) {
        cancelResponseBody(fetched);
        return youtubeApiTemporaryError(
          resultWithApiAttempts(),
          `youtube-api-http-${fetched.status}`,
        );
      } else {
        const parsed = await Promise.race([fetched.json(), deadline.promise]);
        if (!isRecord(parsed)) {
          return youtubeApiTemporaryError(
            resultWithApiAttempts(),
            "youtube-api-invalid-response",
          );
        }
        parsedResponse = parsed;
      }
    } catch (error) {
      if (fetched) cancelResponseBody(fetched);
      retryClassification = `youtube-api-${errorClass(error)}`;
    } finally {
      deadline.clear();
    }
    if (parsedResponse) break;
    if (attempt < apiAttemptsLimit) {
      await sleep(attempt * 250);
      continue;
    }
    return youtubeApiTemporaryError(
      resultWithApiAttempts(),
      retryClassification ?? "youtube-api-invalid-response",
    );
  }
  if (!parsedResponse || !Array.isArray(parsedResponse.items)) {
    return youtubeApiTemporaryError(
      resultWithApiAttempts(),
      "youtube-api-invalid-response",
    );
  }

  try {
    if (parsedResponse.items.length === 0) {
      return {
        ...resultWithApiAttempts(),
        outcome: "removed",
        errorClassification: "youtube-private-or-deleted",
        youtubeApiStatus: "private-or-deleted",
        youtubeEmbeddable: null,
      };
    }
    if (parsedResponse.items.length !== 1) {
      return youtubeApiTemporaryError(
        resultWithApiAttempts(),
        "youtube-api-invalid-response",
      );
    }
    const first = parsedResponse.items[0] as YouTubeApiItem;
    const title =
      typeof first.snippet?.title === "string" ? first.snippet.title : null;
    const uploader =
      typeof first.snippet?.channelTitle === "string"
        ? first.snippet.channelTitle
        : null;
    const embeddable =
      typeof first.status?.embeddable === "boolean"
        ? first.status.embeddable
        : null;
    const privacyStatus = first.status?.privacyStatus;
    if (
      privacyStatus !== "public" &&
      privacyStatus !== "unlisted" &&
      privacyStatus !== "private"
    ) {
      return youtubeApiTemporaryError(
        resultWithApiAttempts(),
        "youtube-api-invalid-response",
      );
    }
    if (privacyStatus === "private") {
      return {
        ...resultWithApiAttempts(),
        outcome: "removed",
        errorClassification: "youtube-private-or-deleted",
        youtubeApiStatus: "private-or-deleted",
        youtubeEmbeddable: null,
      };
    }
    if (title === null || uploader === null || embeddable === null) {
      return youtubeApiTemporaryError(
        resultWithApiAttempts(),
        "youtube-api-invalid-response",
      );
    }
    const metadataMatches =
      normalizedMetadata(title) === normalizedMetadata(item.expectedTitle) &&
      normalizedMetadata(uploader) ===
        normalizedMetadata(item.expectedUploader);
    if (!metadataMatches) {
      return {
        ...resultWithApiAttempts(),
        outcome: "metadata-mismatch",
        errorClassification: "youtube-metadata-mismatch",
        metadataComparison: "mismatch",
        observedTitle: title,
        observedUploader: uploader,
        youtubeApiStatus: "mismatch",
        youtubeEmbeddable: embeddable,
      };
    }
    if (embeddable === false) {
      if (item.expectedEmbedStatus === "external-link-only") {
        return {
          ...resultWithApiAttempts(),
          metadataComparison: "matched",
          observedTitle: title,
          observedUploader: uploader,
          youtubeApiStatus: "not-embeddable",
          youtubeEmbeddable: false,
        };
      }
      return {
        ...resultWithApiAttempts(),
        outcome: "metadata-mismatch",
        errorClassification: "youtube-not-embeddable",
        metadataComparison: "matched",
        observedTitle: title,
        observedUploader: uploader,
        youtubeApiStatus: "not-embeddable",
        youtubeEmbeddable: false,
      };
    }
    return {
      ...resultWithApiAttempts(),
      metadataComparison: "matched",
      observedTitle: title,
      observedUploader: uploader,
      youtubeApiStatus: "verified",
      youtubeEmbeddable: embeddable,
    };
  } catch {
    return youtubeApiTemporaryError(
      resultWithApiAttempts(),
      "youtube-api-invalid-response",
    );
  }
}

export async function verifyPlannedUrl(
  item: PlannedVerificationUrl,
  options: VerifyUrlOptions,
): Promise<CandidateVerificationResult> {
  const now = options.now ?? defaultNow;
  const sleep = options.sleep ?? defaultSleep;
  const attemptsLimit = options.attempts ?? LIVE_VERIFICATION_ATTEMPTS;
  const timeoutMs = options.timeoutMs ?? LIVE_VERIFICATION_TIMEOUT_MS;
  assertAttemptBounds(attemptsLimit, timeoutMs);
  if (!isSafeCandidateHttpsUrl(item.canonicalUrl)) {
    return {
      ...baseResult(item, now(), 1),
      outcome: "metadata-mismatch",
      errorClassification: item.canonicalUrl.startsWith("https://")
        ? "unsafe-candidate-url"
        : "non-https-url",
    };
  }

  for (let attempt = 1; attempt <= attemptsLimit; attempt += 1) {
    const checkedAt = now();
    const deadline = createAttemptDeadline(timeoutMs);
    try {
      const page = await fetchCandidatePage(item, options, deadline);
      if (!page.ok) {
        return {
          ...baseResult(item, checkedAt, attempt),
          finalUrl: page.finalUrl,
          statusCode: page.statusCode,
          contentType: page.contentType,
          outcome: "metadata-mismatch",
          errorClassification: page.classification,
        };
      }
      const fetched = page.response;
      const finalUrl = page.finalUrl;
      const contentType = fetched.headers.get("content-type");
      cancelResponseBody(fetched);
      const base = {
        ...baseResult(item, checkedAt, attempt),
        finalUrl,
        statusCode: fetched.status,
        contentType,
      };
      if (fetched.status === 404 || fetched.status === 410) {
        return {
          ...base,
          outcome: "removed",
          errorClassification: `http-${fetched.status}`,
        };
      }
      if (fetched.status === 429 || fetched.status >= 500) {
        if (attempt < attemptsLimit) {
          await sleep(attempt * 250);
          continue;
        }
        return {
          ...base,
          outcome: "temporary-error",
          errorClassification: `http-${fetched.status}`,
        };
      }
      if (fetched.status < 200 || fetched.status >= 400) {
        return {
          ...base,
          outcome: "metadata-mismatch",
          errorClassification: `http-${fetched.status}`,
        };
      }
      if (!sameCanonicalUrl(item.canonicalUrl, finalUrl)) {
        return {
          ...base,
          outcome: "metadata-mismatch",
          errorClassification: "canonical-url-drift",
        };
      }
      if (!pageContentType(contentType)) {
        return {
          ...base,
          outcome: "metadata-mismatch",
          errorClassification: "content-type-mismatch",
        };
      }
      const reachable: CandidateVerificationResult = {
        ...base,
        outcome: "reachable",
        errorClassification: null,
      };
      return await applyYouTubeMetadata(reachable, item, options);
    } catch (error) {
      const classification = errorClass(error);
      if (attempt < attemptsLimit) {
        await sleep(attempt * 250);
        continue;
      }
      return {
        ...baseResult(item, checkedAt, attempt),
        outcome: "temporary-error",
        errorClassification: classification,
      };
    } finally {
      deadline.clear();
    }
  }
  throw new Error("unreachable verification attempt state");
}

export async function verifyCandidateUrls(
  rows: readonly CandidateRow[],
  options: VerifyCandidateUrlsOptions,
): Promise<CandidateVerificationArtifactV1> {
  const concurrency = options.concurrency ?? LIVE_VERIFICATION_CONCURRENCY;
  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > LIVE_VERIFICATION_MAX_CONCURRENCY
  ) {
    throw new Error(
      `maximum concurrency is ${LIVE_VERIFICATION_MAX_CONCURRENCY}`,
    );
  }
  assertAttemptBounds(
    options.attempts ?? LIVE_VERIFICATION_ATTEMPTS,
    options.timeoutMs ?? LIVE_VERIFICATION_TIMEOUT_MS,
  );
  const plan = buildVerificationPlan(rows, options.rootAudit ?? null);
  const results = new Array<CandidateVerificationResult>(plan.urls.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, plan.urls.length) },
    async () => {
      for (;;) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= plan.urls.length) return;
        results[index] = await verifyPlannedUrl(plan.urls[index]!, options);
      }
    },
  );
  await Promise.all(workers);
  const now = options.now ?? defaultNow;
  const checkedAt = results.reduce(
    (latest, result) => (result.checkedAt > latest ? result.checkedAt : latest),
    results[0]?.checkedAt ?? now(),
  );
  return {
    schemaVersion: 1,
    checkedAt,
    concurrency,
    acceptedSetDigest: plan.acceptedSetDigest,
    rootAuditDigest: plan.rootAuditDigest,
    results,
  };
}

export function serializeVerificationArtifact(
  artifact: CandidateVerificationArtifactV1,
): string {
  return canonicalJson(artifact);
}

export interface CandidateReviewSetDigestInput {
  rows: readonly CandidateRow[];
  rootAuditBytes: string;
  verificationBytes: string;
  sourcePolicyJsonBytes: string;
  sourcePolicyMarkdownBytes: string;
}

/**
 * Freeze-loop digest shared by the read-only checker and the later digest CLI.
 * Exact policy/audit/verification bytes are bound alongside the workflow-free
 * accepted candidate projection.
 */
export function computeCandidateReviewSetDigest(
  input: CandidateReviewSetDigestInput,
): string {
  return sha256Hex(
    canonicalJson({
      acceptedCandidates: buildAcceptedSetProjection(input.rows),
      rootAuditBytesSha256: sha256Hex(input.rootAuditBytes),
      sourcePolicyJsonBytesSha256: sha256Hex(input.sourcePolicyJsonBytes),
      sourcePolicyMarkdownBytesSha256: sha256Hex(
        input.sourcePolicyMarkdownBytes,
      ),
      verificationBytesSha256: sha256Hex(input.verificationBytes),
    }),
  );
}

function validationIssue(
  code: string,
  path: string,
  message: string,
): VerificationIssue {
  return { code, path, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function checkExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
  issues: VerificationIssue[],
  code: string,
): void {
  const actual = Object.keys(value).sort(compareText);
  const wanted = [...expected].sort(compareText);
  if (canonicalJson(actual) !== canonicalJson(wanted)) {
    issues.push(
      validationIssue(
        code,
        path,
        `object keys must be exactly ${wanted.join(", ")}`,
      ),
    );
  }
}

const ARTIFACT_KEYS = [
  "schemaVersion",
  "checkedAt",
  "concurrency",
  "acceptedSetDigest",
  "rootAuditDigest",
  "results",
] as const;
const RESULT_KEYS = [
  "candidateId",
  "kind",
  "canonicalUrl",
  "urlHash",
  "expectedTitle",
  "expectedPublisher",
  "expectedUploader",
  "expectedEmbedStatus",
  "identity",
  "rootAuditReference",
  "rootAuditStatus",
  "checkedAt",
  "attempts",
  "finalUrl",
  "statusCode",
  "contentType",
  "outcome",
  "errorClassification",
  "metadataComparison",
  "observedTitle",
  "observedUploader",
  "youtubeApiStatus",
  "youtubeEmbeddable",
] as const;
const IDENTITY_KEYS = [
  "athleteDisplayName",
  "eventDate",
  "teamAtEvent",
  "opponent",
  "competition",
] as const;
const ROOT_AUDIT_KEYS = [
  "schemaVersion",
  "manifestId",
  "checkedAt",
  "candidates",
] as const;
const ROOT_AUDIT_CANDIDATE_KEYS = [
  "candidateId",
  "eventPass",
  "videoPass",
  "diagnosisPass",
  "checkedBy",
  "checkedAt",
  "reason",
  "firstPartyAvailability",
  "auditReference",
] as const;
const FIRST_PARTY_AVAILABILITY_KEYS = [
  "status",
  "basis",
  "checkedBy",
  "checkedAt",
  "officialLocationsChecked",
  "archiveOrSearchChecks",
] as const;
const LOCATION_CHECK_KEYS = ["url", "outcome", "observedAt"] as const;
const ARCHIVE_CHECK_KEYS = ["queryOrUrl", "outcome", "observedAt"] as const;
const DECISION_KEYS = [
  "schemaVersion",
  "manifestId",
  "status",
  "sourcePolicyJsonDigest",
  "sourcePolicyMarkdownDigest",
  "reviewedBy",
  "reviewedAt",
  "candidateSetDigest",
  "classicProposalCandidateIds",
] as const;

const nonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

export function validateVerificationArtifactShape(
  value: unknown,
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];
  if (!isRecord(value)) {
    return [
      validationIssue(
        "verification-schema",
        "artifact",
        "verification artifact must be a plain object",
      ),
    ];
  }
  checkExactKeys(
    value,
    ARTIFACT_KEYS,
    "artifact",
    issues,
    "verification-schema",
  );
  if (value.schemaVersion !== 1) {
    issues.push(
      validationIssue(
        "verification-schema",
        "schemaVersion",
        "schemaVersion must be 1",
      ),
    );
  }
  if (!isValidUtcTimestamp(String(value.checkedAt ?? ""))) {
    issues.push(
      validationIssue(
        "verification-schema",
        "checkedAt",
        "checkedAt must be a UTC timestamp without fractional seconds",
      ),
    );
  }
  if (
    !Number.isInteger(value.concurrency) ||
    Number(value.concurrency) < 1 ||
    Number(value.concurrency) > LIVE_VERIFICATION_MAX_CONCURRENCY
  ) {
    issues.push(
      validationIssue(
        "verification-schema",
        "concurrency",
        `concurrency must be an integer from 1 through ${LIVE_VERIFICATION_MAX_CONCURRENCY}`,
      ),
    );
  }
  if (
    typeof value.acceptedSetDigest !== "string" ||
    !SHA256_RE.test(value.acceptedSetDigest)
  ) {
    issues.push(
      validationIssue(
        "verification-schema",
        "acceptedSetDigest",
        "acceptedSetDigest must be a lowercase SHA-256",
      ),
    );
  }
  if (
    value.rootAuditDigest !== null &&
    (typeof value.rootAuditDigest !== "string" ||
      !SHA256_RE.test(value.rootAuditDigest))
  ) {
    issues.push(
      validationIssue(
        "verification-schema",
        "rootAuditDigest",
        "rootAuditDigest must be null or a lowercase SHA-256",
      ),
    );
  }
  if (!Array.isArray(value.results)) {
    issues.push(
      validationIssue(
        "verification-schema",
        "results",
        "results must be an array",
      ),
    );
    return dedupeAndSortIssues(issues);
  }
  value.results.forEach((candidate, index) => {
    const path = `results[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(
        validationIssue(
          "verification-schema",
          path,
          "verification result must be a plain object",
        ),
      );
      return;
    }
    checkExactKeys(candidate, RESULT_KEYS, path, issues, "verification-schema");
    if (!nonEmptyString(candidate.candidateId)) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.candidateId`,
          "candidateId is required",
        ),
      );
    }
    if (
      typeof candidate.kind !== "string" ||
      !VERIFICATION_URL_KINDS.includes(candidate.kind as VerificationUrlKind)
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.kind`,
          "kind is not a controlled verification URL kind",
        ),
      );
    }
    if (
      typeof candidate.canonicalUrl !== "string" ||
      !isSafeCandidateHttpsUrl(candidate.canonicalUrl)
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.canonicalUrl`,
          "canonicalUrl must be a safe public HTTPS URL",
        ),
      );
    }
    if (
      typeof candidate.urlHash !== "string" ||
      !SHA256_RE.test(candidate.urlHash)
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.urlHash`,
          "urlHash must be a lowercase SHA-256",
        ),
      );
    }
    for (const key of [
      "expectedTitle",
      "expectedPublisher",
      "expectedUploader",
    ] as const) {
      if (typeof candidate[key] !== "string") {
        issues.push(
          validationIssue(
            "verification-schema",
            `${path}.${key}`,
            `${key} must be a string`,
          ),
        );
      }
    }
    if (
      candidate.expectedEmbedStatus !== null &&
      (typeof candidate.expectedEmbedStatus !== "string" ||
        !CANDIDATE_EMBED_STATUSES.includes(
          candidate.expectedEmbedStatus as CandidateEmbedStatus,
        ))
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.expectedEmbedStatus`,
          "expectedEmbedStatus must be null or a controlled embed status",
        ),
      );
    }
    if (!isRecord(candidate.identity)) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.identity`,
          "identity must be a plain object",
        ),
      );
    } else {
      checkExactKeys(
        candidate.identity,
        IDENTITY_KEYS,
        `${path}.identity`,
        issues,
        "verification-schema",
      );
      for (const key of IDENTITY_KEYS) {
        if (!nonEmptyString(candidate.identity[key])) {
          issues.push(
            validationIssue(
              "verification-schema",
              `${path}.identity.${key}`,
              `${key} is required`,
            ),
          );
        }
      }
    }
    if (
      candidate.rootAuditReference !== null &&
      !nonEmptyString(candidate.rootAuditReference)
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.rootAuditReference`,
          "rootAuditReference must be null or a non-empty string",
        ),
      );
    }
    if (
      candidate.rootAuditStatus !== "not-obtained" &&
      candidate.rootAuditStatus !== "passed" &&
      candidate.rootAuditStatus !== "failed"
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.rootAuditStatus`,
          "rootAuditStatus is invalid",
        ),
      );
    }
    if (!isValidUtcTimestamp(String(candidate.checkedAt ?? ""))) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.checkedAt`,
          "checkedAt must be a valid UTC timestamp",
        ),
      );
    }
    if (
      !Number.isInteger(candidate.attempts) ||
      Number(candidate.attempts) < 1 ||
      Number(candidate.attempts) > LIVE_VERIFICATION_ATTEMPTS
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.attempts`,
          `attempts must be an integer from 1 through ${LIVE_VERIFICATION_ATTEMPTS}`,
        ),
      );
    }
    if (
      candidate.finalUrl !== null &&
      (typeof candidate.finalUrl !== "string" ||
        !candidate.finalUrl.startsWith("https://"))
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.finalUrl`,
          "finalUrl must be null or HTTPS",
        ),
      );
    }
    if (
      candidate.statusCode !== null &&
      (!Number.isInteger(candidate.statusCode) ||
        Number(candidate.statusCode) < 100 ||
        Number(candidate.statusCode) > 599)
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.statusCode`,
          "statusCode must be null or a valid integer HTTP status",
        ),
      );
    }
    for (const key of [
      "contentType",
      "errorClassification",
      "observedTitle",
      "observedUploader",
    ] as const) {
      if (candidate[key] !== null && typeof candidate[key] !== "string") {
        issues.push(
          validationIssue(
            "verification-schema",
            `${path}.${key}`,
            `${key} must be null or a string`,
          ),
        );
      }
    }
    if (
      candidate.outcome !== "reachable" &&
      candidate.outcome !== "removed" &&
      candidate.outcome !== "temporary-error" &&
      candidate.outcome !== "metadata-mismatch"
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.outcome`,
          "outcome is invalid",
        ),
      );
    }
    if (
      candidate.metadataComparison !== "matched" &&
      candidate.metadataComparison !== "mismatch" &&
      candidate.metadataComparison !== "not-obtained"
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.metadataComparison`,
          "metadataComparison is invalid",
        ),
      );
    }
    if (
      candidate.youtubeApiStatus !== "not-applicable" &&
      candidate.youtubeApiStatus !== "not-obtained" &&
      candidate.youtubeApiStatus !== "verified" &&
      candidate.youtubeApiStatus !== "not-embeddable" &&
      candidate.youtubeApiStatus !== "private-or-deleted" &&
      candidate.youtubeApiStatus !== "mismatch" &&
      candidate.youtubeApiStatus !== "api-error"
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.youtubeApiStatus`,
          "youtubeApiStatus is invalid",
        ),
      );
    }
    if (
      candidate.youtubeEmbeddable !== null &&
      typeof candidate.youtubeEmbeddable !== "boolean"
    ) {
      issues.push(
        validationIssue(
          "verification-schema",
          `${path}.youtubeEmbeddable`,
          "youtubeEmbeddable must be null or boolean",
        ),
      );
    }
  });
  return dedupeAndSortIssues(issues);
}

export function validateRootSourceAuditShape(
  value: unknown,
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];
  if (!isRecord(value)) {
    return [
      validationIssue(
        "verification-root-audit-schema",
        "rootAudit",
        "root audit must be a plain object",
      ),
    ];
  }
  checkExactKeys(
    value,
    ROOT_AUDIT_KEYS,
    "rootAudit",
    issues,
    "verification-root-audit-schema",
  );
  if (
    value.schemaVersion !== 1 ||
    value.manifestId !== "NBA-SOURCE-2026-08-06-001" ||
    !isValidUtcTimestamp(String(value.checkedAt ?? "")) ||
    !Array.isArray(value.candidates)
  ) {
    issues.push(
      validationIssue(
        "verification-root-audit-schema",
        "rootAudit",
        "root audit header is invalid",
      ),
    );
    return dedupeAndSortIssues(issues);
  }
  value.candidates.forEach((candidate, index) => {
    const path = `rootAudit.candidates[${index}]`;
    if (!isRecord(candidate)) {
      issues.push(
        validationIssue(
          "verification-root-audit-schema",
          path,
          "root-audit candidate must be a plain object",
        ),
      );
      return;
    }
    checkExactKeys(
      candidate,
      ROOT_AUDIT_CANDIDATE_KEYS,
      path,
      issues,
      "verification-root-audit-schema",
    );
    for (const key of [
      "candidateId",
      "checkedBy",
      "reason",
      "auditReference",
    ] as const) {
      if (!nonEmptyString(candidate[key])) {
        issues.push(
          validationIssue(
            "verification-root-audit-schema",
            `${path}.${key}`,
            `${key} is required`,
          ),
        );
      }
    }
    if (!isValidUtcTimestamp(String(candidate.checkedAt ?? ""))) {
      issues.push(
        validationIssue(
          "verification-root-audit-schema",
          `${path}.checkedAt`,
          "checkedAt must be a valid UTC timestamp",
        ),
      );
    }
    for (const key of ["eventPass", "videoPass", "diagnosisPass"] as const) {
      if (typeof candidate[key] !== "boolean") {
        issues.push(
          validationIssue(
            "verification-root-audit-schema",
            `${path}.${key}`,
            `${key} must be boolean`,
          ),
        );
      }
    }
    const availability = candidate.firstPartyAvailability;
    if (!isRecord(availability)) {
      issues.push(
        validationIssue(
          "verification-root-audit-schema",
          `${path}.firstPartyAvailability`,
          "firstPartyAvailability must be a plain object",
        ),
      );
      return;
    }
    checkExactKeys(
      availability,
      FIRST_PARTY_AVAILABILITY_KEYS,
      `${path}.firstPartyAvailability`,
      issues,
      "verification-root-audit-schema",
    );
    if (
      availability.status !== "available" &&
      availability.status !== "documented-unavailable" &&
      availability.status !== "not-applicable"
    ) {
      issues.push(
        validationIssue(
          "verification-root-audit-schema",
          `${path}.firstPartyAvailability.status`,
          "firstPartyAvailability status is invalid",
        ),
      );
    }
    if (availability.basis !== null && !nonEmptyString(availability.basis)) {
      issues.push(
        validationIssue(
          "verification-root-audit-schema",
          `${path}.firstPartyAvailability.basis`,
          "basis must be null or a non-empty string",
        ),
      );
    }
    if (
      availability.status === "documented-unavailable" &&
      !nonEmptyString(availability.basis)
    ) {
      issues.push(
        validationIssue(
          "verification-root-audit-schema",
          `${path}.firstPartyAvailability.basis`,
          "documented-unavailable status requires a factual basis",
        ),
      );
    }
    if (
      (availability.status === "available" ||
        availability.status === "not-applicable") &&
      availability.basis !== null
    ) {
      issues.push(
        validationIssue(
          "verification-root-audit-schema",
          `${path}.firstPartyAvailability.basis`,
          "available/not-applicable status requires basis=null",
        ),
      );
    }
    if (
      !nonEmptyString(availability.checkedBy) ||
      !isValidUtcTimestamp(String(availability.checkedAt ?? ""))
    ) {
      issues.push(
        validationIssue(
          "verification-root-audit-schema",
          `${path}.firstPartyAvailability`,
          "first-party availability requires checker and UTC timestamp",
        ),
      );
    }
    if (!Array.isArray(availability.officialLocationsChecked)) {
      issues.push(
        validationIssue(
          "verification-root-audit-schema",
          `${path}.firstPartyAvailability.officialLocationsChecked`,
          "officialLocationsChecked must be an array",
        ),
      );
    } else {
      if (availability.officialLocationsChecked.length === 0) {
        issues.push(
          validationIssue(
            "verification-root-audit-schema",
            `${path}.firstPartyAvailability.officialLocationsChecked`,
            "officialLocationsChecked must not be empty",
          ),
        );
      }
      availability.officialLocationsChecked.forEach((entry, entryIndex) => {
        const entryPath = `${path}.firstPartyAvailability.officialLocationsChecked[${entryIndex}]`;
        if (!isRecord(entry)) {
          issues.push(
            validationIssue(
              "verification-root-audit-schema",
              entryPath,
              "official location check must be a plain object",
            ),
          );
          return;
        }
        checkExactKeys(
          entry,
          LOCATION_CHECK_KEYS,
          entryPath,
          issues,
          "verification-root-audit-schema",
        );
        if (
          !nonEmptyString(entry.url) ||
          !entry.url.startsWith("https://") ||
          !nonEmptyString(entry.outcome) ||
          !isValidUtcTimestamp(String(entry.observedAt ?? ""))
        ) {
          issues.push(
            validationIssue(
              "verification-root-audit-schema",
              entryPath,
              "official location check requires HTTPS URL, outcome, and UTC observation time",
            ),
          );
        }
      });
    }
    if (!Array.isArray(availability.archiveOrSearchChecks)) {
      issues.push(
        validationIssue(
          "verification-root-audit-schema",
          `${path}.firstPartyAvailability.archiveOrSearchChecks`,
          "archiveOrSearchChecks must be an array",
        ),
      );
    } else {
      if (
        availability.status === "documented-unavailable" &&
        availability.archiveOrSearchChecks.length === 0
      ) {
        issues.push(
          validationIssue(
            "verification-root-audit-schema",
            `${path}.firstPartyAvailability.archiveOrSearchChecks`,
            "archiveOrSearchChecks must not be empty",
          ),
        );
      }
      availability.archiveOrSearchChecks.forEach((entry, entryIndex) => {
        const entryPath = `${path}.firstPartyAvailability.archiveOrSearchChecks[${entryIndex}]`;
        if (!isRecord(entry)) {
          issues.push(
            validationIssue(
              "verification-root-audit-schema",
              entryPath,
              "archive/search check must be a plain object",
            ),
          );
          return;
        }
        checkExactKeys(
          entry,
          ARCHIVE_CHECK_KEYS,
          entryPath,
          issues,
          "verification-root-audit-schema",
        );
        if (
          !nonEmptyString(entry.queryOrUrl) ||
          !nonEmptyString(entry.outcome) ||
          !isValidUtcTimestamp(String(entry.observedAt ?? ""))
        ) {
          issues.push(
            validationIssue(
              "verification-root-audit-schema",
              entryPath,
              "archive/search check requires query or URL, outcome, and UTC observation time",
            ),
          );
        }
      });
    }
  });
  return dedupeAndSortIssues(issues);
}

export function validateRootSourceAuditAgainstRows(
  rows: readonly CandidateRow[],
  audit: RootSourceAuditV1,
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];
  const acceptedRows = rows.filter(acceptedRow).sort(compareAcceptedRows);
  const rowsById = new Map(rows.map((row) => [row.candidateId, row] as const));
  const acceptedIds = new Set(acceptedRows.map((row) => row.candidateId));
  const seen = new Set<string>();
  audit.candidates.forEach((candidate, index) => {
    const path = `rootAudit.candidates[${index}]`;
    if (seen.has(candidate.candidateId)) {
      issues.push(
        validationIssue(
          "verification-root-audit-coverage",
          `${path}.candidateId`,
          "root audit contains a duplicate candidate ID",
        ),
      );
    }
    seen.add(candidate.candidateId);
    if (!rowsById.has(candidate.candidateId)) {
      issues.push(
        validationIssue(
          "verification-root-audit-coverage",
          `${path}.candidateId`,
          "root audit candidate does not exist in the current ledgers",
        ),
      );
    }
    if (
      rowsById.has(candidate.candidateId) &&
      !acceptedIds.has(candidate.candidateId)
    ) {
      issues.push(
        validationIssue(
          "verification-root-audit-coverage",
          `${path}.candidateId`,
          "root audit candidate is outside the current accepted set",
        ),
      );
    }
    const expectedReference = `/candidates/${index}`;
    if (candidate.auditReference !== expectedReference) {
      issues.push(
        validationIssue(
          "verification-root-audit-reference",
          `${path}.auditReference`,
          `auditReference must equal ${expectedReference}`,
        ),
      );
    }
  });

  const knownAuditRows = audit.candidates
    .map((candidate) => rowsById.get(candidate.candidateId))
    .filter((row): row is CandidateRow => row !== undefined);
  const stableAuditIds = [...knownAuditRows]
    .sort(compareAcceptedRows)
    .map((row) => row.candidateId);
  const actualKnownAuditIds = audit.candidates
    .filter((candidate) => rowsById.has(candidate.candidateId))
    .map((candidate) => candidate.candidateId);
  if (canonicalJson(actualKnownAuditIds) !== canonicalJson(stableAuditIds)) {
    issues.push(
      validationIssue(
        "verification-root-audit-coverage",
        "rootAudit.candidates",
        "root audit candidates must use stable injury/event/candidate order",
      ),
    );
  }

  for (const row of acceptedRows) {
    const matchingIndexes = audit.candidates.flatMap((candidate, index) =>
      candidate.candidateId === row.candidateId ? [index] : [],
    );
    if (matchingIndexes.length !== 1) {
      issues.push(
        validationIssue(
          "verification-root-audit-coverage",
          row.candidateId,
          "every accepted row requires exactly one matching root-audit candidate",
        ),
      );
      continue;
    }
    const index = matchingIndexes[0]!;
    const candidate = audit.candidates[index]!;
    const path = `rootAudit.candidates[${index}]`;
    const expectedReference = `/candidates/${index}`;
    if (
      !candidate.eventPass ||
      !candidate.videoPass ||
      !candidate.diagnosisPass
    ) {
      issues.push(
        validationIssue(
          "verification-root-audit-status",
          path,
          "an accepted row requires passing event, video, and diagnosis root audit",
        ),
      );
    }
    const hasFirstParty =
      row.diagnosisSource1Type === "diagnosis-first-party" ||
      row.diagnosisSource2Type === "diagnosis-first-party";
    const availability = candidate.firstPartyAvailability;
    if (hasFirstParty) {
      if (
        row.firstPartyAvailabilityStatus !== "available" ||
        availability.status !== "available" ||
        availability.basis !== null
      ) {
        issues.push(
          validationIssue(
            "verification-root-audit-first-party",
            `${path}.firstPartyAvailability`,
            "a row with first-party diagnosis must bind available status and null basis",
          ),
        );
      }
      continue;
    }
    const expectedAvailabilityReference = `${expectedReference}/firstPartyAvailability`;
    if (
      row.isClassic !== true ||
      row.firstPartyAvailabilityStatus !== "documented-unavailable" ||
      availability.status !== "documented-unavailable" ||
      row.firstPartyUnavailabilityBasis !== availability.basis ||
      row.firstPartyAvailabilityCheckedBy !== availability.checkedBy ||
      row.firstPartyAvailabilityCheckedAt !== availability.checkedAt ||
      row.firstPartyAvailabilityAuditRef !== expectedAvailabilityReference
    ) {
      issues.push(
        validationIssue(
          "verification-root-audit-first-party",
          `${path}.firstPartyAvailability`,
          "classic secondary-source exception does not exactly bind its structured unavailable-first-party evidence",
        ),
      );
    }
  }
  return dedupeAndSortIssues(issues);
}

export function validateSourceReviewDecisionShape(
  value: unknown,
): VerificationIssue[] {
  const issues: VerificationIssue[] = [];
  if (!isRecord(value)) {
    return [
      validationIssue(
        "verification-review-decision-schema",
        "decision",
        "source-review decision must be a plain object",
      ),
    ];
  }
  checkExactKeys(
    value,
    DECISION_KEYS,
    "decision",
    issues,
    "verification-review-decision-schema",
  );
  if (
    value.schemaVersion !== 1 ||
    value.manifestId !== "NBA-SOURCE-2026-08-06-001" ||
    value.status !== "approved-for-manifest"
  ) {
    issues.push(
      validationIssue(
        "verification-review-decision-schema",
        "decision",
        "source-review decision header is invalid",
      ),
    );
  }
  for (const key of [
    "sourcePolicyJsonDigest",
    "sourcePolicyMarkdownDigest",
    "candidateSetDigest",
  ] as const) {
    if (typeof value[key] !== "string" || !SHA256_RE.test(value[key])) {
      issues.push(
        validationIssue(
          "verification-review-decision-schema",
          `decision.${key}`,
          `${key} must be a lowercase SHA-256`,
        ),
      );
    }
  }
  if (
    !nonEmptyString(value.reviewedBy) ||
    !isValidUtcTimestamp(String(value.reviewedAt ?? ""))
  ) {
    issues.push(
      validationIssue(
        "verification-review-decision-schema",
        "decision",
        "decision requires a named reviewer and UTC review time",
      ),
    );
  }
  if (
    !Array.isArray(value.classicProposalCandidateIds) ||
    value.classicProposalCandidateIds.some(
      (candidateId) => !nonEmptyString(candidateId),
    )
  ) {
    issues.push(
      validationIssue(
        "verification-review-decision-schema",
        "decision.classicProposalCandidateIds",
        "classicProposalCandidateIds must be an array of non-empty IDs",
      ),
    );
  } else {
    const sorted = [...value.classicProposalCandidateIds].sort(compareText);
    if (
      new Set(sorted).size !== sorted.length ||
      canonicalJson(sorted) !== canonicalJson(value.classicProposalCandidateIds)
    ) {
      issues.push(
        validationIssue(
          "verification-review-decision-schema",
          "decision.classicProposalCandidateIds",
          "classicProposalCandidateIds must be sorted and unique",
        ),
      );
    }
  }
  return dedupeAndSortIssues(issues);
}

function exactResultKey(entry: PlannedVerificationUrl): string {
  return `${entry.candidateId}\u0000${entry.kind}\u0000${entry.canonicalUrl}`;
}

function kindKey(entry: PlannedVerificationUrl): string {
  return `${entry.candidateId}\u0000${entry.kind}`;
}

function bindingProjection(entry: PlannedVerificationUrl): unknown {
  return {
    candidateId: entry.candidateId,
    kind: entry.kind,
    canonicalUrl: entry.canonicalUrl,
    urlHash: entry.urlHash,
    expectedTitle: entry.expectedTitle,
    expectedPublisher: entry.expectedPublisher,
    expectedUploader: entry.expectedUploader,
    expectedEmbedStatus: entry.expectedEmbedStatus,
    identity: entry.identity,
    rootAuditReference: entry.rootAuditReference,
    rootAuditStatus: entry.rootAuditStatus,
  };
}

function timestampIsStale(value: string, now: string): boolean {
  if (!isValidUtcTimestamp(value) || !isValidUtcTimestamp(now)) return true;
  const age = Date.parse(now) - Date.parse(value);
  return age < 0 || age > LIVE_VERIFICATION_STALE_AFTER_MS;
}

function validateResultConsistency(
  entry: CandidateVerificationResult,
  path: string,
  issues: VerificationIssue[],
): void {
  const inconsistent = (message: string): void => {
    issues.push(
      validationIssue("verification-result-inconsistent", path, message),
    );
  };
  const youtubeVideo =
    entry.kind === "video" && parseYouTubeVideoId(entry.canonicalUrl) !== null;

  if (entry.outcome === "reachable") {
    if (
      entry.statusCode === null ||
      entry.statusCode < 200 ||
      entry.statusCode >= 300
    ) {
      inconsistent("a reachable result requires a final 2xx status");
    }
    if (
      entry.finalUrl === null ||
      !sameCanonicalUrl(entry.canonicalUrl, entry.finalUrl)
    ) {
      inconsistent("a reachable result requires the same canonical final URL");
    }
    if (!pageContentType(entry.contentType)) {
      inconsistent("a reachable result requires an HTML page content type");
    }
    if (entry.errorClassification !== null) {
      inconsistent("a reachable result cannot carry an error classification");
    }
    if (entry.metadataComparison === "mismatch") {
      inconsistent("a reachable result cannot carry a metadata mismatch");
    }
  } else if (entry.errorClassification === null) {
    inconsistent("a non-reachable result requires an error classification");
  }

  if (!youtubeVideo && entry.youtubeApiStatus !== "not-applicable") {
    inconsistent("non-YouTube URLs must use youtubeApiStatus=not-applicable");
  }
  if (youtubeVideo && entry.youtubeApiStatus === "not-applicable") {
    inconsistent(
      "YouTube video URLs cannot use youtubeApiStatus=not-applicable",
    );
  }
  if (
    entry.youtubeApiStatus !== "not-applicable" &&
    entry.youtubeApiStatus !== "not-obtained" &&
    entry.attempts < 2
  ) {
    inconsistent(
      "an obtained YouTube API result requires both a page and API attempt",
    );
  }

  const observedMetadataMatches =
    entry.observedTitle !== null &&
    entry.observedUploader !== null &&
    normalizedMetadata(entry.observedTitle) ===
      normalizedMetadata(entry.expectedTitle) &&
    normalizedMetadata(entry.observedUploader) ===
      normalizedMetadata(entry.expectedUploader);

  switch (entry.youtubeApiStatus) {
    case "not-applicable":
    case "not-obtained":
      if (
        entry.metadataComparison !== "not-obtained" ||
        entry.observedTitle !== null ||
        entry.observedUploader !== null ||
        entry.youtubeEmbeddable !== null
      ) {
        inconsistent(
          `${entry.youtubeApiStatus} metadata must keep all observed API fields empty`,
        );
      }
      break;
    case "api-error":
      if (
        entry.outcome !== "temporary-error" ||
        !entry.errorClassification?.startsWith("youtube-api-") ||
        entry.metadataComparison !== "not-obtained" ||
        entry.observedTitle !== null ||
        entry.observedUploader !== null ||
        entry.youtubeEmbeddable !== null
      ) {
        inconsistent(
          "YouTube API errors must be temporary and store no observed metadata",
        );
      }
      break;
    case "verified":
      if (
        entry.outcome !== "reachable" ||
        entry.metadataComparison !== "matched" ||
        !observedMetadataMatches ||
        entry.youtubeEmbeddable !== true
      ) {
        inconsistent(
          "verified YouTube metadata must match the expected identity and be embeddable",
        );
      }
      break;
    case "not-embeddable": {
      const expectedOutcome =
        entry.expectedEmbedStatus === "external-link-only"
          ? "reachable"
          : "metadata-mismatch";
      if (
        entry.outcome !== expectedOutcome ||
        entry.metadataComparison !== "matched" ||
        !observedMetadataMatches ||
        entry.youtubeEmbeddable !== false
      ) {
        inconsistent(
          "non-embeddable YouTube metadata must match identity and the manual embed policy",
        );
      }
      break;
    }
    case "private-or-deleted":
      if (
        entry.outcome !== "removed" ||
        entry.errorClassification !== "youtube-private-or-deleted" ||
        entry.metadataComparison !== "not-obtained" ||
        entry.observedTitle !== null ||
        entry.observedUploader !== null ||
        entry.youtubeEmbeddable !== null
      ) {
        inconsistent(
          "private/deleted YouTube results must be removed without stored metadata",
        );
      }
      break;
    case "mismatch":
      if (
        entry.outcome !== "metadata-mismatch" ||
        entry.errorClassification !== "youtube-metadata-mismatch" ||
        entry.metadataComparison !== "mismatch" ||
        entry.observedTitle === null ||
        entry.observedUploader === null ||
        entry.youtubeEmbeddable === null
      ) {
        inconsistent(
          "mismatched YouTube results require the bounded observed metadata fields",
        );
      }
      break;
  }
}

function dedupeAndSortIssues(issues: VerificationIssue[]): VerificationIssue[] {
  const sorted = [...issues].sort(
    (left, right) =>
      compareText(left.path, right.path) ||
      compareText(left.code, right.code) ||
      compareText(left.message, right.message),
  );
  return sorted.filter((entry, index) => {
    const prior = sorted[index - 1];
    return (
      !prior ||
      entry.code !== prior.code ||
      entry.path !== prior.path ||
      entry.message !== prior.message
    );
  });
}

export function validateCandidateVerification(
  options: ValidateCandidateVerificationOptions,
): VerificationIssue[] {
  const issues: VerificationIssue[] = [
    ...validateVerificationArtifactShape(options.artifact),
    ...(options.rootAudit
      ? validateRootSourceAuditShape(options.rootAudit)
      : []),
  ];
  if (issues.length > 0) return dedupeAndSortIssues(issues);
  if (options.rootAudit) {
    issues.push(
      ...validateRootSourceAuditAgainstRows(options.rows, options.rootAudit),
    );
  }
  if (issues.length > 0) return dedupeAndSortIssues(issues);
  const plan = buildVerificationPlan(options.rows, options.rootAudit);
  const requireRootAudit = options.requireRootAudit ?? true;
  const requireReviewDecision = options.requireReviewDecision ?? true;
  const artifact = options.artifact;
  if (artifact.schemaVersion !== 1) {
    issues.push(
      validationIssue(
        "verification-schema",
        "schemaVersion",
        "verification artifact schemaVersion must be 1",
      ),
    );
  }
  if (artifact.acceptedSetDigest !== plan.acceptedSetDigest) {
    issues.push(
      validationIssue(
        "verification-set-digest",
        "acceptedSetDigest",
        "artifact does not bind the current workflow-free accepted set",
      ),
    );
  }
  if (artifact.rootAuditDigest !== plan.rootAuditDigest) {
    issues.push(
      validationIssue(
        "verification-root-audit-mismatch",
        "rootAuditDigest",
        "artifact does not bind the current strict root audit",
      ),
    );
  }
  if (timestampIsStale(artifact.checkedAt, options.now)) {
    issues.push(
      validationIssue(
        "verification-stale",
        "checkedAt",
        "verification artifact is stale or has an invalid timestamp",
      ),
    );
  }

  const expected = new Map(
    plan.urls.map((entry) => [exactResultKey(entry), entry] as const),
  );
  const observed = new Map<string, CandidateVerificationResult>();
  const observedKinds = new Set<string>();
  artifact.results.forEach((entry, index) => {
    const path = `results[${index}]`;
    const key = exactResultKey(entry);
    if (observed.has(key) || observedKinds.has(kindKey(entry))) {
      issues.push(
        validationIssue(
          "verification-duplicate",
          path,
          "artifact contains a duplicate candidate URL kind",
        ),
      );
    }
    observed.set(key, entry);
    observedKinds.add(kindKey(entry));
    const expectedEntry = expected.get(key);
    if (!expectedEntry) {
      issues.push(
        validationIssue(
          "verification-extra",
          path,
          "artifact contains a URL outside the current accepted set",
        ),
      );
      return;
    }
    if (
      canonicalJson(bindingProjection(entry)) !==
      canonicalJson(bindingProjection(expectedEntry))
    ) {
      issues.push(
        validationIssue(
          "verification-identity-mismatch",
          path,
          "stored expected source or event identity no longer matches",
        ),
      );
    }
    if (entry.urlHash !== sha256Hex(entry.canonicalUrl)) {
      issues.push(
        validationIssue(
          "verification-url-hash",
          `${path}.urlHash`,
          "stored URL hash does not match the canonical URL",
        ),
      );
    }
    if (timestampIsStale(entry.checkedAt, options.now)) {
      issues.push(
        validationIssue(
          "verification-stale",
          `${path}.checkedAt`,
          "URL verification result is stale or has an invalid timestamp",
        ),
      );
    }
    validateResultConsistency(entry, path, issues);
    if (entry.outcome !== "reachable") {
      issues.push(
        validationIssue(
          "verification-unreachable",
          `${path}.outcome`,
          `accepted URL is ${entry.outcome}`,
        ),
      );
    }
    if (
      (requireRootAudit && expectedEntry.rootAuditStatus !== "passed") ||
      (requireRootAudit && expectedEntry.rootAuditReference === null)
    ) {
      issues.push(
        validationIssue(
          "verification-root-audit-mismatch",
          `${path}.rootAuditStatus`,
          "accepted URL lacks a matching passing root-audit reference",
        ),
      );
    }
  });
  for (const [key, entry] of expected) {
    if (!observed.has(key)) {
      issues.push(
        validationIssue(
          "verification-missing",
          `${entry.candidateId}.${entry.kind}`,
          "current accepted URL is missing from the verification artifact",
        ),
      );
    }
  }

  const verifiedRows = options.rows.filter(
    (row) => row.discoveryStatus === "source-verified",
  );
  const decision = options.decision;
  if (requireReviewDecision && verifiedRows.length > 0 && !decision) {
    issues.push(
      validationIssue(
        "verification-review-decision-required",
        "decision",
        "source-verified rows require the exact durable source-review decision",
      ),
    );
  }
  if (requireReviewDecision && verifiedRows.length > 0 && decision) {
    const decisionShapeIssues = validateSourceReviewDecisionShape(decision);
    issues.push(...decisionShapeIssues);
    if (decisionShapeIssues.length === 0) {
      for (const row of verifiedRows) {
        if (
          row.reviewedBy !== decision.reviewedBy ||
          row.reviewedAt !== decision.reviewedAt ||
          row.reviewedBy === "" ||
          row.reviewedAt === ""
        ) {
          issues.push(
            validationIssue(
              "verification-review-identity",
              row.candidateId,
              "source-verified row identity/date does not match the durable decision",
            ),
          );
        }
      }
      if (
        !options.policyDigests ||
        decision.sourcePolicyJsonDigest !== options.policyDigests.json ||
        decision.sourcePolicyMarkdownDigest !== options.policyDigests.markdown
      ) {
        issues.push(
          validationIssue(
            "verification-review-policy",
            "decision",
            "source-review decision policy digests do not match current policy bytes",
          ),
        );
      }
      if (
        !options.expectedCandidateSetDigest ||
        decision.candidateSetDigest !== options.expectedCandidateSetDigest
      ) {
        issues.push(
          validationIssue(
            "verification-review-set-digest",
            "decision.candidateSetDigest",
            "source-review decision does not bind the current candidate set digest",
          ),
        );
      }
      const expectedClassicIds = options.rows
        .filter((row) => acceptedRow(row) && row.isClassic === true)
        .map((row) => row.candidateId)
        .sort(compareText);
      if (
        canonicalJson(expectedClassicIds) !==
        canonicalJson(decision.classicProposalCandidateIds)
      ) {
        issues.push(
          validationIssue(
            "verification-review-classic-set",
            "decision.classicProposalCandidateIds",
            "decision classic proposals do not equal the current accepted classic set",
          ),
        );
      }
    }
  }
  if (
    options.boundVerificationDigest &&
    sha256Hex(serializeVerificationArtifact(artifact)) !==
      options.boundVerificationDigest
  ) {
    issues.push(
      validationIssue(
        "verification-bound-artifact-digest",
        "artifact",
        "verification artifact bytes changed after the bound decision",
      ),
    );
  }
  return dedupeAndSortIssues(issues);
}
