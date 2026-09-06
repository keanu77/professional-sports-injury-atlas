/**
 * Fail-closed public release gate. `release-check.ts` runs this before any
 * public build; with the current (empty) real content it must fail with
 * deterministic messages naming missing counts, URLs, course links, external
 * verification, and authorization. Every check is independent: a synthetic
 * fully authorized fixture proves the gate is achievable, not hard-coded to
 * fail.
 */

import { z } from "astro/zod";
import { hasPublicEmbed } from "../patient/featured";
import { parse, type DefaultTreeAdapterTypes } from "parse5";
import {
  canonicalJson,
  CanonicalJsonError,
  compareCodePoints,
  isValidUtcTimestamp,
  issue,
  parseStrictJson,
  SHA256_RE,
  sha256Hex,
  type ValidationIssue,
} from "../contracts/canonical";
import {
  computeCaseContentDigest,
  computeVideoSourceDigest,
} from "../cases/digest";
import { computeInjuryOverviewDigest } from "../cases/injury-overview-digest";
import { validateInjuryOverviewForApproval } from "../cases/injury-overview-digest";
import {
  effectiveVideoRendering,
  selectMedicallyApprovedCases,
  selectPublicCases,
} from "../cases/selectors";
import { computeQuarterlyUpdateDigest } from "../cases/update-digest";
import { INJURY_CODES, type InjuryCase } from "../contracts/case";
import {
  validateCaseCollection,
  validateCaseRecord,
  validateCaseSourceBinding,
} from "../contracts/cross-validation";
import type { InjuryOverview } from "../contracts/injury-overview";
import {
  publicReleaseHistorySchema,
  validateHistoricalReleaseSources,
  validateReleaseHistory,
  type PublicReleaseHistory,
  type PublicReleaseSnapshot,
  type ReleaseArtifactLoader,
} from "../contracts/release-history";
import {
  CURRENT_PUBLIC_RIGHTS_POLICY_VERSION,
  CURRENT_SOURCE_POLICY_VERSION,
} from "../contracts/site-governance";
import {
  validateSourceManifestRegistryArtifacts,
  type RegistryArtifactLoader,
  type SourceManifestRegistryV1,
} from "../contracts/source-manifest-registry";
import {
  validateUpdateStructure,
  type QuarterlyUpdate,
} from "../contracts/update";
import { validateHistoricalUpdates } from "../releases/history";
import {
  EXPECTED_COURSE_LINK_KEYS,
  evaluatePublicCourseLink,
  professionalCourseLinksSchema,
  rtpCourseSummariesSchema,
  type ProfessionalCourseLink,
  type RtpCourseSummary,
} from "../rtp/course-links";
import { NOINDEX_ROBOTS_META } from "./build-mode";
import { parseMedicalReviewDecisionBytes } from "./medical-review-decision";
import { isNbaUrl } from "../rights/nba-link-policy";
import {
  validateAppliedMedicalReviewDecision,
  validateMedicalReviewDecisionArtifacts,
} from "./medical-review-decision";
import { parseArtifactManifestBytes } from "./artifact-manifest";
import { parseServedArtifactReceiptBytes } from "./served-artifact-receipt";
import { parseReviewSetManifestV2Bytes } from "./review-set";
import {
  computeSiteDigest,
  validateSiteGovernanceRecord,
  siteGovernanceRecordSchema,
  type SiteCourseLinkTuple,
  type SiteDigestInput,
  type SiteGovernanceRecord,
  type SitePublicCaseTuple,
  type SiteSourceBatchTuple,
} from "./site-digest";
import { evaluateCaseVideoRightsDecision } from "./video-rights-decision";

// Decision 21: prioritize playable films; no per-injury, sport, or league quota.
export const MIN_PUBLIC_CASES_PER_INJURY = 0;
export const MIN_PUBLIC_CASES_TOTAL = 1;
export const EXTERNAL_VERIFICATION_MAX_AGE_DAYS = 7;

/* ------------------------------------------------------------------ */
/* SitePublicationDecisionV1                                          */
/* ------------------------------------------------------------------ */

const trimmedNonEmpty = z
  .string()
  .min(1)
  .refine((value) => value === value.trim(), {
    message: "must be trimmed and non-empty",
  });

export const sitePublicationDecisionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  decisionType: z.literal("site-publication"),
  publicationStatus: z.literal("authorized"),
  authorizedSiteDigest: z.string().regex(SHA256_RE),
  publicUrlHash: z.string().regex(SHA256_RE),
  allowPublic: z.literal(true),
  allowIndexing: z.literal(true),
  authorizedBy: trimmedNonEmpty,
  authorizedAt: z
    .string()
    .refine(isValidUtcTimestamp, { message: "must be a valid UTC timestamp" }),
});
export type SitePublicationDecisionV1 = z.infer<
  typeof sitePublicationDecisionSchema
>;

export interface ParsedSitePublicationDecision {
  decision: SitePublicationDecisionV1 | null;
  decisionDigest: string;
  issues: ValidationIssue[];
}

/**
 * Strict duplicate-key-detected canonical-bytes parse. Free prose, denial or
 * ambiguity, plan-execution decisions, and duplicate/unknown fields all fail
 * the strict schema.
 */
export function parseSitePublicationDecisionBytes(
  bytes: Uint8Array | string,
): ParsedSitePublicationDecision {
  const decisionDigest = sha256Hex(bytes);
  const text =
    typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    return {
      decision: null,
      decisionDigest,
      issues: [
        issue(
          "publication-decision-parse",
          "",
          error instanceof CanonicalJsonError ? error.message : String(error),
        ),
      ],
    };
  }
  const issues: ValidationIssue[] = [];
  if (canonicalJson(parsed) !== text) {
    issues.push(
      issue(
        "publication-decision-not-canonical",
        "",
        "publication-decision bytes must be exact canonical JSON",
      ),
    );
  }
  const result = sitePublicationDecisionSchema.safeParse(parsed);
  if (!result.success) {
    issues.push(
      ...result.error.issues.map((zodIssue) =>
        issue(
          "publication-decision-schema",
          zodIssue.path.join("."),
          zodIssue.message,
        ),
      ),
    );
  }
  if (issues.length > 0 || !result.success) {
    return { decision: null, decisionDigest, issues };
  }
  return { decision: result.data, decisionDigest, issues };
}

/* ------------------------------------------------------------------ */
/* External verification contract (minimal platform-side view)        */
/* ------------------------------------------------------------------ */

export const externalVerificationCaseSchema = z.strictObject({
  caseId: z.string().min(1),
  clinicalDigest: z.string().regex(SHA256_RE),
  videoSourceDigest: z.string().regex(SHA256_RE),
  externalUrlSetDigest: z.string().regex(SHA256_RE),
  checkedAt: z
    .string()
    .refine(isValidUtcTimestamp, { message: "must be a valid UTC timestamp" }),
  results: z
    .array(
      z.strictObject({
        urlHash: z.string().regex(SHA256_RE),
        status: z.enum(["ok", "failed"]),
      }),
    )
    .min(1),
});

export const externalVerificationArtifactSchema = z.strictObject({
  schemaVersion: z.literal(1),
  artifactType: z.literal("external-verification"),
  generatedAt: z
    .string()
    .refine(isValidUtcTimestamp, { message: "must be a valid UTC timestamp" }),
  cases: z.array(externalVerificationCaseSchema),
});
export type ExternalVerificationArtifact = z.infer<
  typeof externalVerificationArtifactSchema
>;

export interface ExternalUrlEntry {
  kind: string;
  sourceId: string | null;
  url: string;
  expectedIdentity: Record<string, string>;
}

export function externalUrlEntries(record: InjuryCase): ExternalUrlEntry[] {
  const entries: ExternalUrlEntry[] = [
    {
      kind: "video-canonical",
      sourceId: null,
      url: record.video.canonicalUrl,
      expectedIdentity: {
        uploaderName: record.video.uploaderName,
        uploaderProvenance: record.video.uploaderProvenance,
      },
    },
    {
      kind: "video-fallback",
      sourceId: null,
      url: record.video.fallbackUrl,
      expectedIdentity: {
        uploaderName: record.video.uploaderName,
        uploaderProvenance: record.video.uploaderProvenance,
      },
    },
    ...record.sources.map((source) => ({
      kind: `source-${source.type}`,
      sourceId: source.id,
      url: source.url,
      expectedIdentity: { title: source.title, publisher: source.publisher },
    })),
  ];
  const seen = new Set<string>();
  const deduped: ExternalUrlEntry[] = [];
  for (const entry of entries.sort((a, b) =>
    compareCodePoints(
      `${a.url} ${a.kind} ${a.sourceId ?? ""}`,
      `${b.url} ${b.kind} ${b.sourceId ?? ""}`,
    ),
  )) {
    const key = canonicalJson(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);
  }
  return deduped;
}

/**
 * Canonical sorted projection of every current externally verified URL and
 * its kind/source ID/expected identity; duplicates normalize
 * deterministically.
 */
export function computeExternalUrlSetDigest(record: InjuryCase): string {
  return sha256Hex(
    canonicalJson({
      schemaVersion: 1,
      digestType: "external-url-set",
      entries: externalUrlEntries(record),
    }),
  );
}

/** Sorted unique URL hashes the verification artifact must cover exactly. */
export function expectedExternalUrlHashes(record: InjuryCase): string[] {
  return [
    ...new Set(externalUrlEntries(record).map((entry) => sha256Hex(entry.url))),
  ].sort(compareCodePoints);
}

/* ------------------------------------------------------------------ */
/* Built-output validation (review and public)                        */
/* ------------------------------------------------------------------ */

export interface BuiltPage {
  path: string;
  html: string;
}

const ANALYTICS_RE =
  /googletagmanager|google-analytics|gtag\(|plausible\.io|umami|hotjar|clarity\.ms|segment\.com|mixpanel/i;
const IFRAME_RE = /<iframe\b[^>]*>/gi;
const PRECONNECT_RE = /rel=["']?(preconnect|dns-prefetch)/i;
const SITEMAP_FILE_RE = /(^|\/)sitemap[^/]*\.xml$/;
const CASE_EMBED_RE = /data-case-embed="([^"]*)"/g;
const IMAGE_URL_BASE = "https://atlas.invalid/";

type HtmlElement = DefaultTreeAdapterTypes.Element;
type HtmlNode = DefaultTreeAdapterTypes.Node;

function isHtmlElement(node: HtmlNode): node is HtmlElement {
  return "tagName" in node;
}

function descendantElements(node: HtmlNode): HtmlElement[] {
  if (!("childNodes" in node)) return [];
  const result: HtmlElement[] = [];
  for (const child of node.childNodes) {
    if (!isHtmlElement(child)) continue;
    result.push(child, ...descendantElements(child));
  }
  return result;
}

function htmlAttribute(element: HtmlElement, name: string): string | null {
  return element.attrs.find((entry) => entry.name === name)?.value ?? null;
}

function absoluteUrlCandidates(value: string): string[] {
  const normalized = value
    .replaceAll("\\/", "/")
    .replace(/\\u002f/giu, "/")
    .replace(/\\x2f/giu, "/");
  return (normalized.match(/(?:https?:)?\/\/[^\s"'<>\\]+/giu) ?? []).map(
    (candidate) =>
      candidate.startsWith("//") ? `https:${candidate}` : candidate,
  );
}

function jsonStringValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(jsonStringValues);
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(jsonStringValues);
}

function nbaUrlInJson(text: string): string | undefined {
  let strings: string[];
  try {
    strings = jsonStringValues(JSON.parse(text));
  } catch {
    strings = [text];
  }
  return strings
    .flatMap((value) => absoluteUrlCandidates(value))
    .find((value) => isNbaUrl(value));
}

function htmlNodeText(node: HtmlNode): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if (!("childNodes" in node)) return "";
  return node.childNodes.map((child) => htmlNodeText(child)).join("");
}

/**
 * Decision 11 P2-5: rendered output may preserve NBA.com URLs only as text.
 * Attributes cover anchors, iframes, metadata, and HTML refresh redirects;
 * JSON-LD is checked separately because its URL values are text nodes.
 * No NBA homepage is allowlisted, so the built-output gate rejects the entire
 * NBA host family until a later explicit policy and test authorize one.
 */
export function validateNoNbaDeepLinkReferences(
  pages: readonly BuiltPage[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const page of pages) {
    const document = parse(page.html);
    for (const element of descendantElements(document)) {
      for (const attribute of element.attrs) {
        const target = absoluteUrlCandidates(attribute.value).find((value) =>
          isNbaUrl(value),
        );
        if (target !== undefined) {
          issues.push(
            issue(
              "output-nba-deep-link-attribute",
              page.path,
              `${element.tagName}[${attribute.name}] must not point to NBA.com deep URL ${target}`,
            ),
          );
        }
      }
      if (element.tagName === "script") {
        const scriptText = htmlNodeText(element);
        const scriptType = (htmlAttribute(element, "type") ?? "")
          .split(";", 1)[0]
          ?.trim()
          .toLowerCase();
        const isSchema = scriptType === "application/ld+json";
        const target = isSchema
          ? nbaUrlInJson(scriptText)
          : absoluteUrlCandidates(scriptText).find((value) => isNbaUrl(value));
        if (target !== undefined) {
          issues.push(
            issue(
              isSchema
                ? "output-nba-deep-link-schema"
                : "output-nba-deep-link-script",
              page.path,
              `${isSchema ? "JSON-LD" : "inline script"} must not point to NBA.com deep URL ${target}`,
            ),
          );
        }
      }
    }
  }
  return issues;
}

function isLocalBuiltImageUrl(value: string): boolean {
  const candidate = value.trim();
  if (
    candidate === "" ||
    /[\\\u0000-\u001f\u007f]/u.test(candidate) ||
    /^[a-z][a-z0-9+.-]*:/iu.test(candidate) ||
    candidate.startsWith("//")
  ) {
    return false;
  }
  try {
    const resolved = new URL(candidate, IMAGE_URL_BASE);
    return resolved.origin === new URL(IMAGE_URL_BASE).origin;
  } catch {
    return false;
  }
}

function srcsetUrls(value: string): string[] {
  return value
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/u)[0] ?? "");
}

function reviewImageAttributes(
  document: DefaultTreeAdapterTypes.Document,
): Array<{ element: HtmlElement; attribute: string; value: string }> {
  const attributes: Array<{
    element: HtmlElement;
    attribute: string;
    value: string;
  }> = [];
  for (const element of descendantElements(document)) {
    const names: string[] = [];
    if (element.tagName === "img" || element.tagName === "source") {
      names.push("src", "srcset");
    } else if (element.tagName === "link") {
      const rel = (htmlAttribute(element, "rel") ?? "")
        .toLowerCase()
        .split(/\s+/u);
      if (
        rel.includes("preload") &&
        htmlAttribute(element, "as")?.toLowerCase() === "image"
      ) {
        names.push("href", "imagesrcset");
      }
    }
    for (const name of names) {
      const value = htmlAttribute(element, name);
      if (value !== null) attributes.push({ element, attribute: name, value });
    }
  }
  return attributes;
}

/** Review builds must load every rendered image from their own artifact. */
export function validateReviewImageReferences(
  pages: readonly BuiltPage[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const page of pages) {
    const document = parse(page.html);
    for (const { element, attribute, value } of reviewImageAttributes(
      document,
    )) {
      const candidates = attribute.endsWith("srcset")
        ? srcsetUrls(value)
        : [value];
      if (candidates.some((candidate) => !isLocalBuiltImageUrl(candidate))) {
        issues.push(
          issue(
            "review-output-nonlocal-image",
            page.path,
            `${element.tagName}[${attribute}] must reference only local built image files`,
          ),
        );
      }
    }
  }
  return issues;
}

function hasNoindexMeta(html: string): boolean {
  return (
    /<meta\b[^>]*name=["']robots["'][^>]*>/i.test(html) &&
    html.includes(NOINDEX_ROBOTS_META)
  );
}

/**
 * Review output: every HTML page noindexed; no sitemap, analytics,
 * third-party iframe, or external preconnect.
 */
export function validateReviewOutput(
  pages: readonly BuiltPage[],
  filePaths: readonly string[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [
    ...validateReviewImageReferences(pages),
    ...validateNoNbaDeepLinkReferences(pages),
  ];
  for (const page of pages) {
    if (!hasNoindexMeta(page.html)) {
      issues.push(
        issue(
          "review-output-noindex",
          page.path,
          `review page is missing the exact robots meta ${NOINDEX_ROBOTS_META}`,
        ),
      );
    }
    if (IFRAME_RE.test(page.html)) {
      issues.push(
        issue(
          "review-output-iframe",
          page.path,
          "review output must not contain a third-party iframe",
        ),
      );
    }
    IFRAME_RE.lastIndex = 0;
    if (ANALYTICS_RE.test(page.html)) {
      issues.push(
        issue(
          "review-output-analytics",
          page.path,
          "review output must not contain analytics",
        ),
      );
    }
    if (PRECONNECT_RE.test(page.html)) {
      issues.push(
        issue(
          "review-output-preconnect",
          page.path,
          "review output must not contain an external preconnect",
        ),
      );
    }
  }
  for (const path of filePaths) {
    if (SITEMAP_FILE_RE.test(path)) {
      issues.push(
        issue(
          "review-output-sitemap",
          path,
          "review output must not contain a sitemap",
        ),
      );
    }
  }
  return issues;
}

/**
 * Public output: no review-only route, no noindex inconsistency, and no
 * embedded prerecorded video whose current caption status forbids an in-site
 * embed (such a case must degrade to the clearly labeled original external
 * link).
 */
export function validatePublicOutput(
  pages: readonly BuiltPage[],
  filePaths: readonly string[],
  publicCases: readonly InjuryCase[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [...validateNoNbaDeepLinkReferences(pages)];
  const caseById = new Map(publicCases.map((record) => [record.id, record]));
  for (const path of filePaths) {
    if (
      path === "review" ||
      path.startsWith("review/") ||
      path.includes("/review/")
    ) {
      issues.push(
        issue(
          "public-output-review-route",
          path,
          "public output must not contain a review-only route",
        ),
      );
    }
  }
  for (const page of pages) {
    if (hasNoindexMeta(page.html)) {
      issues.push(
        issue(
          "public-output-noindex",
          page.path,
          "public output must not carry the review noindex meta",
        ),
      );
    }
    const iframes = page.html.match(IFRAME_RE) ?? [];
    for (const iframeTag of iframes) {
      if (!/data-case-embed="/.test(iframeTag)) {
        issues.push(
          issue(
            "public-output-unmarked-iframe",
            page.path,
            "public iframes must be case-bound video embeds",
          ),
        );
      }
    }
    for (const match of page.html.matchAll(CASE_EMBED_RE)) {
      const caseId = match[1] ?? "";
      const record = caseById.get(caseId);
      if (record === undefined) {
        issues.push(
          issue(
            "public-output-embed-unknown-case",
            page.path,
            `embedded video references unknown public case ${caseId}`,
          ),
        );
        continue;
      }
      if (effectiveVideoRendering(record) !== "embed") {
        issues.push(
          issue(
            "public-output-embed-caption",
            page.path,
            `case ${caseId} must degrade to a clearly labeled original external link instead of an embed`,
          ),
        );
      }
    }
  }
  return issues;
}

/* ------------------------------------------------------------------ */
/* The gate                                                           */
/* ------------------------------------------------------------------ */

export interface LoadedDecisionBytes {
  bytes: Uint8Array | string;
  path: string;
}

export interface PublicReleaseGateInput {
  /** Current UTC time used for freshness checks. */
  now: string;
  governance: unknown;
  publicationDecision: LoadedDecisionBytes | null;
  cases: readonly InjuryCase[];
  overviews: readonly InjuryOverview[];
  updates: readonly QuarterlyUpdate[];
  registry: SourceManifestRegistryV1;
  loadRegistryArtifact: RegistryArtifactLoader;
  /** Exact stored canonical release-history bytes. */
  releaseHistoryBytes: Uint8Array | string;
  /** Immutable release-commit artifact loader; missing loader is fatal. */
  loadReleaseArtifact: ReleaseArtifactLoader | null;
  reviewSetBytes: Uint8Array | string | null;
  medicalReviewDecisionBytes: Uint8Array | string | null;
  reviewArtifactManifestBytes: Uint8Array | string | null;
  servedReviewReceiptBytes: Uint8Array | string | null;
  loadVideoRightsDecision: (caseId: string) => LoadedDecisionBytes | null;
  externalVerification: unknown | null;
  courseLinks: unknown;
  courseSummaries: unknown;
  loadCourseLinkDecision: (courseKey: string) => LoadedDecisionBytes | null;
  build: {
    commit: string | null;
    dirty: boolean;
    rendererTreeDigest: string | null;
  };
  brandFindings: readonly string[];
}

export class GateDataError extends Error {}

function daysBetween(earlier: string, later: string): number {
  return (
    (new Date(later).getTime() - new Date(earlier).getTime()) /
    (24 * 60 * 60 * 1000)
  );
}

interface ResolvedPublicContent {
  publicCases: InjuryCase[];
  publicCaseTuples: SitePublicCaseTuple[];
  sourceBatchTuples: SiteSourceBatchTuple[];
  overviewTuples: { injuryCode: string; overviewDigest: string }[];
  currentUpdate: QuarterlyUpdate | null;
}

function resolveApprovedOverviews(
  overviews: readonly InjuryOverview[],
  issues: ValidationIssue[],
): { injuryCode: string; overviewDigest: string }[] {
  const tuples: { injuryCode: string; overviewDigest: string }[] = [];
  for (const injuryCode of INJURY_CODES) {
    const candidates = overviews.filter(
      (overview) => overview.injuryCode === injuryCode,
    );
    const approved = candidates.filter(
      (overview) =>
        overview.status === "approved" && overview.review.status === "approved",
    );
    if (approved.length !== 1) {
      issues.push(
        issue(
          "gate-overview-count",
          injuryCode,
          `launch injury ${injuryCode} has ${approved.length} approved overviews; exactly 1 is required`,
        ),
      );
      continue;
    }
    const overview = approved[0]!;
    if (candidates.some((entry) => entry !== overview)) {
      issues.push(
        issue(
          "gate-overview-extra",
          injuryCode,
          `launch injury ${injuryCode} has an overview still in draft/medical-review`,
        ),
      );
    }
    const approvalIssues = validateInjuryOverviewForApproval(overview);
    if (approvalIssues.length > 0) {
      for (const approvalIssue of approvalIssues) {
        issues.push({
          ...approvalIssue,
          path: `${injuryCode}.${approvalIssue.path}`,
        });
      }
      continue;
    }
    tuples.push({
      injuryCode,
      overviewDigest: computeInjuryOverviewDigest(overview),
    });
  }
  return tuples;
}

function resolveCurrentUpdate(
  governance: SiteGovernanceRecord,
  updates: readonly QuarterlyUpdate[],
  issues: ValidationIssue[],
): QuarterlyUpdate | null {
  if (governance.currentUpdateId === null) {
    issues.push(
      issue(
        "gate-current-update-missing",
        "currentUpdateId",
        "public release requires a resolved currentUpdateId",
      ),
    );
    return null;
  }
  const matches = updates.filter(
    (update) => update.id === governance.currentUpdateId,
  );
  if (matches.length !== 1) {
    issues.push(
      issue(
        "gate-current-update-ambiguous",
        "currentUpdateId",
        `currentUpdateId ${governance.currentUpdateId} resolves to ${matches.length} updates; exactly 1 is required`,
      ),
    );
    return null;
  }
  const update = matches[0]!;
  const structureIssues = validateUpdateStructure(update);
  if (structureIssues.length > 0) {
    issues.push(...structureIssues);
    return null;
  }
  const expectedDigest = computeQuarterlyUpdateDigest(update);
  if (
    update.status !== "approved" ||
    update.review.status !== "approved" ||
    update.review.reviewedContentDigest !== expectedDigest
  ) {
    issues.push(
      issue(
        "gate-current-update-unapproved",
        update.id,
        "the current update must be approved with a digest matching its current content",
      ),
    );
    return null;
  }
  if (update.publishedAt === null || !isValidUtcTimestamp(update.publishedAt)) {
    issues.push(
      issue(
        "gate-current-update-published-at",
        update.id,
        "the current update requires an exact valid publishedAt",
      ),
    );
    return null;
  }
  return update;
}

function checkCounts(
  publicCases: readonly InjuryCase[],
  issues: ValidationIssue[],
): void {
  if (!publicCases.some(hasPublicEmbed)) {
    issues.push(
      issue(
        "gate-embed-required",
        "cases",
        "public launch requires at least one captioned, region-permitted in-site video",
      ),
    );
  }
  if (publicCases.length < MIN_PUBLIC_CASES_TOTAL) {
    issues.push(
      issue(
        "gate-count-total",
        "",
        `the site has ${publicCases.length} public cases; at least ${MIN_PUBLIC_CASES_TOTAL} are required`,
      ),
    );
  }
}

function checkExternalVerification(
  input: PublicReleaseGateInput,
  publicCases: readonly InjuryCase[],
  issues: ValidationIssue[],
): void {
  if (input.externalVerification === null) {
    issues.push(
      issue(
        "gate-external-verification-missing",
        "artifacts/external-verification.v1.json",
        "the external verification artifact is missing; public release requires fresh external verification",
      ),
    );
    return;
  }
  const parsed = externalVerificationArtifactSchema.safeParse(
    input.externalVerification,
  );
  if (!parsed.success) {
    issues.push(
      ...parsed.error.issues.map((zodIssue) =>
        issue(
          "gate-external-verification-schema",
          zodIssue.path.join("."),
          zodIssue.message,
        ),
      ),
    );
    return;
  }
  const byCaseId = new Map(
    parsed.data.cases.map((entry) => [entry.caseId, entry]),
  );
  for (const record of publicCases) {
    const entry = byCaseId.get(record.id);
    const location = `externalVerification.${record.id}`;
    if (entry === undefined) {
      issues.push(
        issue(
          "gate-external-verification-missing-case",
          location,
          "public case has no external verification entry",
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
          "gate-external-verification-stale-digest",
          location,
          "external verification is bound to a stale clinical/video/URL-set digest",
        ),
      );
    }
    if (
      daysBetween(entry.checkedAt, input.now) >
      EXTERNAL_VERIFICATION_MAX_AGE_DAYS
    ) {
      issues.push(
        issue(
          "gate-external-verification-stale",
          location,
          `external verification is older than ${EXTERNAL_VERIFICATION_MAX_AGE_DAYS} days`,
        ),
      );
    }
    if (entry.results.some((result) => result.status !== "ok")) {
      issues.push(
        issue(
          "gate-external-verification-failed",
          location,
          "external verification recorded a failed URL check",
        ),
      );
    }
    const expectedHashes = expectedExternalUrlHashes(record);
    const actualHashes = [
      ...new Set(entry.results.map((result) => result.urlHash)),
    ].sort(compareCodePoints);
    if (
      expectedHashes.length !== actualHashes.length ||
      expectedHashes.some((hash, index) => hash !== actualHashes[index])
    ) {
      issues.push(
        issue(
          "gate-external-verification-url-set",
          location,
          "external verification does not cover the exact current external URL set",
        ),
      );
    }
  }
}

function checkCourseLinks(
  input: PublicReleaseGateInput,
  governance: SiteGovernanceRecord,
  issues: ValidationIssue[],
): SiteCourseLinkTuple[] {
  if (governance.courseLinkPolicyVersion === null) {
    issues.push(
      issue(
        "gate-course-link-policy",
        "courseLinkPolicyVersion",
        "public release requires a non-null current courseLinkPolicyVersion",
      ),
    );
    return [];
  }
  const linksParsed = professionalCourseLinksSchema.safeParse(
    input.courseLinks,
  );
  if (!linksParsed.success) {
    issues.push(
      issue(
        "gate-course-links-schema",
        "courseLinks",
        "professional course links data is malformed",
      ),
    );
    return [];
  }
  const summariesParsed = rtpCourseSummariesSchema.safeParse(
    input.courseSummaries,
  );
  if (!summariesParsed.success) {
    issues.push(
      issue(
        "gate-course-summaries-schema",
        "courseSummaries",
        "RTP course summaries data is malformed",
      ),
    );
    return [];
  }
  const linkByKey = new Map<string, ProfessionalCourseLink>(
    linksParsed.data.links.map((link) => [link.key, link]),
  );
  const courseBySlug = new Map<string, RtpCourseSummary>(
    summariesParsed.data.courses.map((course) => [course.slug, course]),
  );
  const tuples: SiteCourseLinkTuple[] = [];
  for (const courseKey of EXPECTED_COURSE_LINK_KEYS) {
    const location = `courseLinks.${courseKey}`;
    const link = linkByKey.get(courseKey);
    if (link === undefined) {
      issues.push(
        issue(
          "gate-course-link-missing",
          location,
          `course link ${courseKey} is missing an approved HTTPS course URL`,
        ),
      );
      continue;
    }
    const course = courseBySlug.get(link.catalogSlug);
    if (course === undefined) {
      issues.push(
        issue(
          "gate-course-link-catalog",
          location,
          `course link ${courseKey} does not resolve to an imported course summary`,
        ),
      );
      continue;
    }
    const loaded = input.loadCourseLinkDecision(courseKey);
    const linkIssues = evaluatePublicCourseLink({
      link,
      course,
      decisionBytes: loaded === null ? null : loaded.bytes,
      decisionPath: loaded === null ? null : loaded.path,
      courseLinkPolicyVersion: governance.courseLinkPolicyVersion,
    });
    if (linkIssues.length > 0) {
      issues.push(
        ...linkIssues.map((linkIssue) => ({
          ...linkIssue,
          path: `${location}.${linkIssue.path}`,
        })),
      );
      continue;
    }
    if (link.linkApproval.status !== "approved") continue;
    tuples.push({
      courseKey,
      approvedPublicUrl: link.linkApproval.approvedPublicUrl,
      courseGovernanceProjectionDigest: sha256Hex(
        canonicalJson({
          slug: course.slug,
          contentDigest: course.contentDigest,
          governance: course.governance,
        }),
      ),
      linkApprovalDecisionDigest: link.linkApproval.decisionDigest,
    });
  }
  return tuples;
}

function resolvePublicContent(
  input: PublicReleaseGateInput,
  governance: SiteGovernanceRecord,
  issues: ValidationIssue[],
): ResolvedPublicContent {
  issues.push(...validateCaseCollection([...input.cases]));

  // Source registry and immutable decision validation is independent of
  // public-rights selection. G4's medically approved set must remain bound to
  // active, non-superseded source artifacts even while its public set is empty.
  const medicallyApprovedCases = selectMedicallyApprovedCases([...input.cases]);
  for (const record of medicallyApprovedCases) {
    issues.push(
      ...validateCaseSourceBinding(
        record,
        input.registry,
        input.loadRegistryArtifact,
      ).map((bindingIssue) => ({
        ...bindingIssue,
        path: `${record.id}.${bindingIssue.path}`,
      })),
    );
  }

  const publicCases = selectPublicCases([...input.cases]);
  const publicCaseTuples: SitePublicCaseTuple[] = [];
  const batchTupleByKey = new Map<string, SiteSourceBatchTuple>();

  for (const record of publicCases) {
    const recordIssues = validateCaseRecord(record);
    if (recordIssues.length > 0) {
      issues.push(
        ...recordIssues.map((recordIssue) => ({
          ...recordIssue,
          path: `${record.id}.${recordIssue.path}`,
        })),
      );
    }
    const provenance = record.video.sourceProvenanceVerification;
    if (provenance.verifiedPolicyVersion !== CURRENT_SOURCE_POLICY_VERSION) {
      issues.push(
        issue(
          "gate-source-policy",
          `${record.id}.video.sourceProvenanceVerification`,
          "provenance verification must bind the current source-policy version",
        ),
      );
    }
    const loadedRights = input.loadVideoRightsDecision(record.id);
    const rightsIssues = evaluateCaseVideoRightsDecision({
      record,
      decisionBytes: loadedRights === null ? null : loadedRights.bytes,
      decisionPath: loadedRights === null ? null : loadedRights.path,
    });
    issues.push(...rightsIssues);
    publicCaseTuples.push({
      caseId: record.id,
      clinicalDigest: computeCaseContentDigest(record),
      videoSourceDigest: computeVideoSourceDigest(record),
      publicRightsDecisionDigest:
        rightsIssues.length === 0 && loadedRights !== null
          ? sha256Hex(loadedRights.bytes)
          : "0".repeat(64),
    });
    const binding = record.sourceManifestBinding;
    const key = `${binding.manifestId} ${binding.entryDigest}`;
    batchTupleByKey.set(key, {
      manifestId: binding.manifestId,
      manifestDigest: binding.manifestDigest,
      sourceReviewDecisionDigest: binding.sourceReviewDecisionDigest,
      entryDigest: binding.entryDigest,
    });
  }

  checkCounts(publicCases, issues);
  const overviewTuples = resolveApprovedOverviews(input.overviews, issues);
  const currentUpdate = resolveCurrentUpdate(governance, input.updates, issues);
  checkExternalVerification(input, publicCases, issues);

  return {
    publicCases,
    publicCaseTuples,
    sourceBatchTuples: [...batchTupleByKey.values()],
    overviewTuples,
    currentUpdate,
  };
}

interface HistoryResolution {
  history: PublicReleaseHistory | null;
  previousRelease: PublicReleaseSnapshot | null;
}

function resolveHistory(
  input: PublicReleaseGateInput,
  governance: SiteGovernanceRecord,
  issues: ValidationIssue[],
): HistoryResolution {
  const text =
    typeof input.releaseHistoryBytes === "string"
      ? input.releaseHistoryBytes
      : Buffer.from(input.releaseHistoryBytes).toString("utf8");
  let parsed: unknown;
  try {
    parsed = parseStrictJson(text);
  } catch (error) {
    issues.push(
      issue(
        "gate-history-parse",
        "public-release-history",
        error instanceof CanonicalJsonError ? error.message : String(error),
      ),
    );
    return { history: null, previousRelease: null };
  }
  if (canonicalJson(parsed) !== text) {
    issues.push(
      issue(
        "gate-history-not-canonical",
        "public-release-history",
        "stored release-history bytes are not canonical",
      ),
    );
    return { history: null, previousRelease: null };
  }
  const historyIssues = validateReleaseHistory(parsed);
  if (historyIssues.length > 0) {
    issues.push(...historyIssues);
    return { history: null, previousRelease: null };
  }
  const history = publicReleaseHistorySchema.parse(parsed);
  issues.push(...validateHistoricalUpdates(history, [...input.updates]));

  if (input.loadReleaseArtifact === null) {
    issues.push(
      issue(
        "gate-history-loader-missing",
        "public-release-history",
        "the immutable release-commit artifact loader is missing; historical source validation cannot be skipped",
      ),
    );
  } else {
    issues.push(
      ...validateHistoricalReleaseSources(
        history,
        input.registry,
        input.loadReleaseArtifact,
      ),
    );
  }

  const previousRelease =
    history.releases.length === 0
      ? null
      : (history.releases[
          history.releases.length - 1
        ] as PublicReleaseSnapshot);
  const expectedBase =
    previousRelease === null ? null : previousRelease.releaseDigest;
  if (governance.baseReleaseDigest !== expectedBase) {
    issues.push(
      issue(
        "gate-base-release-digest",
        "baseReleaseDigest",
        "frozen baseReleaseDigest does not equal the terminal release-history head",
      ),
    );
  }
  const measuredHistoryBytesDigest = sha256Hex(input.releaseHistoryBytes);
  if (governance.baseHistoryBytesDigest !== measuredHistoryBytesDigest) {
    issues.push(
      issue(
        "gate-base-history-bytes",
        "baseHistoryBytesDigest",
        "frozen baseHistoryBytesDigest does not equal the exact canonical history bytes",
      ),
    );
  }
  return { history, previousRelease };
}

function checkUpdateAgainstRelease(
  input: PublicReleaseGateInput,
  resolved: ResolvedPublicContent,
  previousRelease: PublicReleaseSnapshot | null,
  issues: ValidationIssue[],
): void {
  if (resolved.currentUpdate === null) return;
  const update = resolved.currentUpdate;
  const head = new Map(
    input.cases.map((record) => [
      record.id,
      {
        clinicalDigest: computeCaseContentDigest(record),
        videoSourceDigest: computeVideoSourceDigest(record),
      },
    ]),
  );
  const publicIds = resolved.publicCases
    .map((record) => record.id)
    .sort(compareCodePoints);
  if (previousRelease === null) {
    if (
      update.updatedCases.length > 0 ||
      update.retiredCases.length > 0 ||
      update.unavailableCases.length > 0
    ) {
      issues.push(
        issue(
          "gate-update-baseline",
          update.id,
          "the baseline update may contain only added cases",
        ),
      );
    }
    const addedIds = update.addedCases
      .map((entry) => entry.caseId)
      .sort(compareCodePoints);
    if (
      addedIds.length !== publicIds.length ||
      addedIds.some((caseId, index) => caseId !== publicIds[index])
    ) {
      issues.push(
        issue(
          "gate-update-public-set",
          update.id,
          "the current update must list exactly the public case set; it may not expose a non-public case",
        ),
      );
    }
  }
  for (const added of update.addedCases) {
    const current = head.get(added.caseId);
    const isPublic = publicIds.includes(added.caseId);
    if (
      !isPublic ||
      current === undefined ||
      added.currentClinicalDigest !== current.clinicalDigest ||
      added.currentVideoSourceDigest !== current.videoSourceDigest
    ) {
      issues.push(
        issue(
          "gate-update-added",
          `${update.id}.addedCases.${added.caseId}`,
          "an added case must be a public case whose digests match the current head",
        ),
      );
    }
  }
  if (previousRelease !== null) {
    const previousSnapshots = new Map(
      previousRelease.caseSnapshots.map((snapshot) => [
        snapshot.caseId,
        snapshot,
      ]),
    );
    for (const entry of [...update.retiredCases, ...update.unavailableCases]) {
      if (!previousSnapshots.has(entry.caseId)) {
        issues.push(
          issue(
            "gate-update-retire-unknown",
            `${update.id}.${entry.caseId}`,
            "a retired/unavailable case must exist in the last public release",
          ),
        );
      }
    }
    const listedIds = new Set(
      [
        ...update.addedCases,
        ...update.updatedCases,
        ...update.retiredCases,
        ...update.unavailableCases,
      ].map((entry) => entry.caseId),
    );
    for (const [caseId, snapshot] of previousSnapshots) {
      if (listedIds.has(caseId)) continue;
      const current = head.get(caseId);
      if (
        current === undefined ||
        current.clinicalDigest !== snapshot.clinicalDigest ||
        current.videoSourceDigest !== snapshot.videoSourceDigest
      ) {
        issues.push(
          issue(
            "gate-update-unlisted-change",
            `${update.id}.${caseId}`,
            "a prior public case whose digest changed must be listed in the current update",
          ),
        );
      }
    }
  }
}

function checkReviewSetAndMedicalDecision(
  input: PublicReleaseGateInput,
  governance: SiteGovernanceRecord,
  resolved: ResolvedPublicContent,
  issues: ValidationIssue[],
): void {
  if (input.reviewSetBytes === null) {
    issues.push(
      issue(
        "gate-review-set-missing",
        "review-set",
        "the canonical review-set manifest is missing",
      ),
    );
    return;
  }
  const parsedReviewSet = parseReviewSetManifestV2Bytes(input.reviewSetBytes);
  if (parsedReviewSet.manifest === null) {
    issues.push(...parsedReviewSet.issues);
    return;
  }
  const reviewSet = parsedReviewSet.manifest;
  if (reviewSet.authoringAuthority.closedScopeIds.includes("public-release")) {
    issues.push(
      issue(
        "gate-review-set-public-release-closed",
        "reviewSet.authoringAuthority.closedScopeIds",
        "the active Decision 17 authority explicitly keeps public-release closed",
      ),
    );
  }
  if (governance.currentReviewSetDigest !== parsedReviewSet.reviewSetDigest) {
    issues.push(
      issue(
        "gate-review-set-digest",
        "currentReviewSetDigest",
        "governance does not bind the exact canonical review-set digest",
      ),
    );
  }
  if (governance.reviewedContentCommit !== reviewSet.contentCommit) {
    issues.push(
      issue(
        "gate-reviewed-content-commit",
        "reviewedContentCommit",
        "governance reviewedContentCommit does not equal the review set's clean content commit",
      ),
    );
  }
  if (governance.publicRendererTreeDigest !== reviewSet.rendererTreeDigest) {
    issues.push(
      issue(
        "gate-renderer-reviewed",
        "publicRendererTreeDigest",
        "the authorized renderer tree digest does not equal the reviewed renderer tree digest",
      ),
    );
  }
  const currentCaseDigests = new Map(
    input.cases.map((record) => [record.id, computeCaseContentDigest(record)]),
  );
  for (const entry of reviewSet.cases) {
    if (currentCaseDigests.get(entry.caseId) !== entry.clinicalDigest) {
      issues.push(
        issue(
          "gate-review-set-stale",
          `reviewSet.cases.${entry.caseId}`,
          "the review-set case binding differs from the current case payload",
        ),
      );
    }
  }
  const reviewSetOverviews = new Map(
    reviewSet.overviews.map((entry) => [
      entry.injuryCode,
      entry.overviewDigest,
    ]),
  );
  for (const tuple of resolved.overviewTuples) {
    if (reviewSetOverviews.get(tuple.injuryCode) !== tuple.overviewDigest) {
      issues.push(
        issue(
          "gate-review-set-stale",
          `reviewSet.overviews.${tuple.injuryCode}`,
          "the review-set overview binding differs from the current overview payload",
        ),
      );
    }
  }
  if (resolved.currentUpdate !== null) {
    const expected = computeQuarterlyUpdateDigest(resolved.currentUpdate);
    if (
      reviewSet.currentUpdate === null ||
      reviewSet.currentUpdate.updateId !== resolved.currentUpdate.id ||
      reviewSet.currentUpdate.updateDigest !== expected
    ) {
      issues.push(
        issue(
          "gate-review-set-stale",
          "reviewSet.currentUpdate",
          "the review-set update binding differs from the current update payload",
        ),
      );
    }
  }

  if (input.medicalReviewDecisionBytes === null) {
    issues.push(
      issue(
        "gate-medical-decision-missing",
        "medical-review-decision",
        "the durable medical-review decision is missing",
      ),
    );
    return;
  }
  const parsedDecision = parseMedicalReviewDecisionBytes(
    input.medicalReviewDecisionBytes,
  );
  if (parsedDecision.decision === null) {
    issues.push(...parsedDecision.issues);
    return;
  }
  if (
    governance.medicalReviewDecisionDigest !== parsedDecision.decisionDigest
  ) {
    issues.push(
      issue(
        "gate-medical-decision-digest",
        "medicalReviewDecisionDigest",
        "governance does not bind the exact durable medical-review decision digest",
      ),
    );
  }
  if (
    input.reviewArtifactManifestBytes === null ||
    input.servedReviewReceiptBytes === null
  ) {
    issues.push(
      issue(
        "gate-review-artifacts-missing",
        "review-artifacts",
        "the G4-complete private-dist manifest and full served-review receipt are required",
      ),
    );
  } else {
    const parsedManifest = parseArtifactManifestBytes(
      input.reviewArtifactManifestBytes,
    );
    const parsedReceipt = parseServedArtifactReceiptBytes(
      input.servedReviewReceiptBytes,
    );
    // The strict V1 parsers reject the legacy short contracts before the
    // medical/public gate can consume them. The shared validator below then
    // requires exact authorized bytes plus the complete five-scenario denial
    // matrix and zero mismatch counters.
    if (parsedManifest.manifest === null || parsedReceipt.receipt === null) {
      issues.push(...parsedManifest.issues, ...parsedReceipt.issues);
    } else {
      issues.push(
        ...validateMedicalReviewDecisionArtifacts(parsedDecision.decision, {
          reviewSetManifest: reviewSet,
          reviewSetDigest: parsedReviewSet.reviewSetDigest,
          reviewSetBytes: input.reviewSetBytes,
          artifactManifest: parsedManifest.manifest,
          artifactManifestDigest: parsedManifest.manifestDigest,
          servedReceipt: parsedReceipt.receipt,
          servedReceiptDigest: parsedReceipt.receiptDigest,
        }),
      );
    }
  }
  const appliedDecisionIssues = validateAppliedMedicalReviewDecision(
    parsedDecision.decision,
    reviewSet,
    input.cases,
    input.overviews,
    resolved.currentUpdate,
  );
  for (const entry of appliedDecisionIssues) {
    if (
      issues.some(
        (existing) =>
          existing.code === entry.code &&
          existing.path === entry.path &&
          existing.message === entry.message,
      )
    ) {
      continue;
    }
    issues.push(entry);
  }
}

function buildSiteDigestInput(
  governance: SiteGovernanceRecord,
  resolved: ResolvedPublicContent,
  courseLinkTuples: readonly SiteCourseLinkTuple[],
  historyBytesDigest: string,
  proposed: { siteStatus: "public-approved"; allowIndexing: true },
): SiteDigestInput | null {
  if (
    governance.reviewedContentCommit === null ||
    governance.publicRendererTreeDigest === null ||
    governance.currentReviewSetDigest === null ||
    governance.medicalReviewDecisionDigest === null ||
    governance.publicSiteUrl === null ||
    governance.privacyPolicyUrl === null ||
    governance.rightsPolicyUrl === null ||
    governance.publicRightsPolicyVersion === null ||
    governance.courseLinkPolicyVersion === null ||
    resolved.currentUpdate === null ||
    resolved.currentUpdate.publishedAt === null
  ) {
    return null;
  }
  return {
    siteStatus: proposed.siteStatus,
    allowIndexing: proposed.allowIndexing,
    reviewedContentCommit: governance.reviewedContentCommit,
    publicRendererTreeDigest: governance.publicRendererTreeDigest,
    sourceBatches: resolved.sourceBatchTuples,
    reviewSetDigest: governance.currentReviewSetDigest,
    medicalReviewDecisionDigest: governance.medicalReviewDecisionDigest,
    publicCases: resolved.publicCaseTuples,
    overviews: resolved.overviewTuples,
    currentUpdate: {
      updateId: resolved.currentUpdate.id,
      updateDigest: computeQuarterlyUpdateDigest(resolved.currentUpdate),
      publishedAt: resolved.currentUpdate.publishedAt,
    },
    baseReleaseDigest: governance.baseReleaseDigest,
    baseHistoryBytesDigest: historyBytesDigest,
    courseLinks: courseLinkTuples,
    publicSiteUrl: governance.publicSiteUrl,
    privacyPolicyUrl: governance.privacyPolicyUrl,
    rightsPolicyUrl: governance.rightsPolicyUrl,
    sourcePolicyVersion: CURRENT_SOURCE_POLICY_VERSION,
    publicRightsPolicyVersion: governance.publicRightsPolicyVersion,
    courseLinkPolicyVersion: governance.courseLinkPolicyVersion,
  };
}

/**
 * Computes the candidate site digest from an in-memory proposed governance
 * projection (`siteStatus='public-approved'`, `allowIndexing=true`) without
 * mutating the active governance file. Throws when the underlying data is
 * too incomplete to bind.
 */
export function computeCandidateSiteDigest(
  input: PublicReleaseGateInput,
): string {
  const governanceParsed = siteGovernanceRecordSchema.safeParse(
    input.governance,
  );
  if (!governanceParsed.success) {
    throw new GateDataError("site-governance record is malformed");
  }
  const governance = governanceParsed.data;
  const scratch: ValidationIssue[] = [];
  const resolved = resolvePublicContent(input, governance, scratch);
  const courseLinkTuples = checkCourseLinks(input, governance, scratch);
  const digestInput = buildSiteDigestInput(
    governance,
    resolved,
    courseLinkTuples,
    sha256Hex(input.releaseHistoryBytes),
    { siteStatus: "public-approved", allowIndexing: true },
  );
  if (digestInput === null) {
    throw new GateDataError(
      "governance/content data is incomplete; the candidate site digest cannot be computed",
    );
  }
  return computeSiteDigest(digestInput);
}

function checkAuthorization(
  input: PublicReleaseGateInput,
  governance: SiteGovernanceRecord,
  candidateSiteDigest: string | null,
  issues: ValidationIssue[],
): void {
  if (governance.siteStatus !== "public-approved") {
    issues.push(
      issue(
        "gate-site-status",
        "siteStatus",
        `siteStatus is ${governance.siteStatus}; public release requires explicit public-approved authorization`,
      ),
    );
  }
  if (governance.allowIndexing !== true) {
    issues.push(
      issue(
        "gate-allow-indexing",
        "allowIndexing",
        "allowIndexing is false; public indexing has not been authorized",
      ),
    );
  }
  const authorization = governance.indexingAuthorization;
  if (
    authorization.status !== "authorized" ||
    authorization.authorizedBy === null ||
    authorization.authorizedAt === null ||
    authorization.authorizedSiteDigest === null ||
    authorization.decisionPath === null ||
    authorization.decisionDigest === null
  ) {
    issues.push(
      issue(
        "gate-indexing-authorization",
        "indexingAuthorization",
        `indexing authorization status is ${authorization.status}; a complete authorized record is required`,
      ),
    );
    return;
  }
  if (input.publicationDecision === null) {
    issues.push(
      issue(
        "gate-publication-decision-missing",
        authorization.decisionPath,
        "the strict SitePublicationDecisionV1 artifact is missing",
      ),
    );
    return;
  }
  const parsed = parseSitePublicationDecisionBytes(
    input.publicationDecision.bytes,
  );
  if (parsed.decision === null) {
    issues.push(...parsed.issues);
    return;
  }
  if (input.publicationDecision.path !== authorization.decisionPath) {
    issues.push(
      issue(
        "gate-publication-decision-path",
        authorization.decisionPath,
        "publication decision was not loaded from the bound decision path",
      ),
    );
  }
  if (parsed.decisionDigest !== authorization.decisionDigest) {
    issues.push(
      issue(
        "gate-publication-decision-digest",
        authorization.decisionPath,
        "publication decision bytes do not match the bound decision digest",
      ),
    );
  }
  const decision = parsed.decision;
  if (
    decision.authorizedBy !== authorization.authorizedBy ||
    decision.authorizedAt !== authorization.authorizedAt
  ) {
    issues.push(
      issue(
        "gate-publication-decision-identity",
        authorization.decisionPath,
        "publication decision identity/time do not match the applied authorization",
      ),
    );
  }
  if (governance.publicSiteUrl === null) {
    issues.push(
      issue(
        "gate-public-site-url",
        "publicSiteUrl",
        "public release requires a publicSiteUrl",
      ),
    );
  } else if (decision.publicUrlHash !== sha256Hex(governance.publicSiteUrl)) {
    issues.push(
      issue(
        "gate-publication-decision-url",
        "publicSiteUrl",
        "publication decision publicUrlHash does not match the approved public site URL",
      ),
    );
  }
  if (
    decision.authorizedSiteDigest !== authorization.authorizedSiteDigest ||
    candidateSiteDigest === null ||
    decision.authorizedSiteDigest !== candidateSiteDigest
  ) {
    issues.push(
      issue(
        "gate-site-digest-mismatch",
        "indexingAuthorization.authorizedSiteDigest",
        "recomputing the site digest does not exactly equal the authorized site digest",
      ),
    );
  }
}

/** The fail-closed public release gate. Empty result = releasable. */
export function evaluatePublicReleaseGate(
  input: PublicReleaseGateInput,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const governanceIssues = validateSiteGovernanceRecord(input.governance);
  if (governanceIssues.length > 0) return governanceIssues;
  const governance = siteGovernanceRecordSchema.parse(input.governance);

  for (const [field, value] of [
    ["publicSiteUrl", governance.publicSiteUrl],
    ["privacyPolicyUrl", governance.privacyPolicyUrl],
    ["rightsPolicyUrl", governance.rightsPolicyUrl],
  ] as const) {
    if (value === null) {
      issues.push(
        issue(
          "gate-url-missing",
          field,
          `public release requires a non-null ${field}`,
        ),
      );
    }
  }
  if (
    governance.publicRightsPolicyVersion !==
    CURRENT_PUBLIC_RIGHTS_POLICY_VERSION
  ) {
    issues.push(
      issue(
        "gate-rights-policy",
        "publicRightsPolicyVersion",
        `public release requires the current public-rights policy version ${CURRENT_PUBLIC_RIGHTS_POLICY_VERSION}`,
      ),
    );
  }

  issues.push(
    ...validateSourceManifestRegistryArtifacts(
      input.registry,
      input.loadRegistryArtifact,
    ),
  );

  const resolved = resolvePublicContent(input, governance, issues);
  const { previousRelease } = resolveHistory(input, governance, issues);
  checkUpdateAgainstRelease(input, resolved, previousRelease, issues);
  checkReviewSetAndMedicalDecision(input, governance, resolved, issues);
  const courseLinkTuples = checkCourseLinks(input, governance, issues);

  if (input.build.commit === null || input.build.dirty) {
    issues.push(
      issue(
        "gate-build-commit",
        "build",
        "public release requires a clean, recorded build commit",
      ),
    );
  }
  if (
    input.build.rendererTreeDigest === null ||
    governance.publicRendererTreeDigest === null ||
    input.build.rendererTreeDigest !== governance.publicRendererTreeDigest
  ) {
    issues.push(
      issue(
        "gate-renderer-tree",
        "publicRendererTreeDigest",
        "the build source-tree public-renderer digest must equal the authorized/reviewed renderer digest",
      ),
    );
  }

  for (const finding of input.brandFindings) {
    issues.push(
      issue(
        "gate-brand-asset",
        finding,
        "a league/team logo, image asset, remote thumbnail, or endorsement-style identity is present",
      ),
    );
  }

  const digestInput = buildSiteDigestInput(
    governance,
    resolved,
    courseLinkTuples,
    sha256Hex(input.releaseHistoryBytes),
    { siteStatus: "public-approved", allowIndexing: true },
  );
  const candidateSiteDigest =
    digestInput === null ? null : computeSiteDigest(digestInput);
  checkAuthorization(input, governance, candidateSiteDigest, issues);

  return issues;
}
