/**
 * Read-only importer for the parent workspace's normalized RTP catalog.
 *
 * Pipeline: exact-byte SHA-256 against `manifest.catalogSha256` -> strict
 * duplicate-key parse -> canonical-byte check -> full validation against the
 * pinned upstream `rtp-catalog.v1` schema -> schemaVersion/counts/sourceDigest
 * and governance cross-field rules -> select the three mapped slugs -> write
 * only `src/data/generated/rtp-course-summaries.v1.json` as canonical JSON.
 * The parent workspace is never written.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "astro/zod";
import {
  canonicalJson,
  CanonicalJsonError,
  compareCodePoints,
  issue,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "../src/lib/contracts/canonical";
import {
  RTP_COURSE_SUMMARIES_DATA_PATH,
  validateCourseGovernanceConsistency,
  validateProfessionalCourseLinks,
  validateRtpCourseSummaries,
  professionalCourseLinksSchema,
  COURSE_LINKS_DATA_PATH,
  type RtpCourseSummary,
} from "../src/lib/rtp/course-links";

export const RTP_CATALOG_DEFAULT_PATH = "../artifacts/rtp/rtp-catalog.v1.json";
export const RTP_MANIFEST_DEFAULT_PATH =
  "../artifacts/rtp/rtp-catalog.v1.manifest.json";

/* ------------------------------------------------------------------ */
/* Pinned upstream rtp-catalog.v1 schema (mirrors schemas/rtp-catalog. */
/* v1.schema.json in the parent workspace).                           */
/* ------------------------------------------------------------------ */

const NON_EMPTY_RE = /\S/;
const TRIMMED_RE =
  /^(?![\s\S]*[\u0000-\u001F\u007F])\S(?:[\s\S]*\S)?(?![\s\S])/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?![\s\S])/;
const IDENTIFIER_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]*(?![\s\S])/;
const UNIT_ID_RE = /^U[1-9][0-9]*(?![\s\S])/;
const STATEMENT_ID_RE =
  /^(?:TOPIC-SUMMARY|TOPIC-APPLIES-(?:0[1-9]|[1-9][0-9]+)|TOPIC-EXCLUSION-(?:0[1-9]|[1-9][0-9]+)|TOPIC-REDFLAG-(?:0[1-9]|[1-9][0-9]+)|TOPIC-RETURN-GOAL|TOPIC-DIRECT-ANSWER|FAQ-(?:0[1-9]|[1-9][0-9]+)-ANSWER|U[1-9][0-9]*-(?:GOAL|BEFORE|PROGRESS|HOLD|CLINICAL|MONITOR)-(?:0[1-9]|[1-9][0-9]+)|U[1-9][0-9]*-PATIENT-(?:OVERVIEW|NOTICE-(?:0[1-9]|[1-9][0-9]+)|PARTICIPATE-(?:0[1-9]|[1-9][0-9]+)|CONTACT-(?:0[1-9]|[1-9][0-9]+)|TAKE-HOME))(?![\s\S])/;
const DATE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}(?![\s\S])/;
const DATE_TIME_RE =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?(?:Z|[+-][0-9]{2}:[0-9]{2})(?![\s\S])/;
const HTTPS_URI_RE =
  /^https:\/\/(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)(?:\.(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?))*(?::(?:[1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?(?:\/[^\s\u0000-\u001F\u007F?#]*)*(?:\?[^\s\u0000-\u001F\u007F#]*)?(?:#[^\s\u0000-\u001F\u007F]*)?(?![\s\S])/;
const SHA256_RE = /^[0-9a-f]{64}(?![\s\S])/;
const CJK_RE = /[㐀-䶿一-鿿]/;

const nonEmptyString = z.string().min(1).regex(NON_EMPTY_RE);
const trimmedNonEmptyString = z.string().min(1).regex(TRIMMED_RE);
const upstreamSlug = z.string().regex(SLUG_RE);
const identifier = z.string().regex(IDENTIFIER_RE);
const unitId = z.string().regex(UNIT_ID_RE);
const statementId = z.string().regex(STATEMENT_ID_RE);
const isoDate = z.string().regex(DATE_RE);
const dateTime = z.string().regex(DATE_TIME_RE);
const httpsUri = z.string().regex(HTTPS_URI_RE);
const sha256 = z.string().regex(SHA256_RE);
const taxonomyLabel = trimmedNonEmptyString.refine(
  (value) => value !== "unsure",
  { message: 'taxonomy label must not be "unsure"' },
);

const uniqueItems = { message: "array items must be unique" };
const unique = <T extends z.ZodTypeAny>(schema: z.ZodArray<T>) =>
  schema.refine(
    (values) => new Set(values as unknown[]).size === values.length,
    uniqueItems,
  );

const reviewStatus = z.enum([
  "draft",
  "medical-review",
  "approved",
  "rejected",
]);
const medicalReviewStatus = z.enum(["pending", "approved", "rejected"]);
const bodyRegion = z.enum([
  "foot-ankle",
  "knee",
  "hip-groin",
  "thigh",
  "elbow",
  "shoulder",
  "spine",
  "other",
]);

const countsSchema = z.strictObject({
  topics: z.number().int().min(0),
  units: z.number().int().min(0),
  evidenceReferences: z.number().int().min(0),
  evidenceData: z.number().int().min(0),
  videos: z.number().int().min(0),
});

const statementSchema = z.strictObject({
  id: statementId,
  text: nonEmptyString,
  referenceIds: unique(z.array(identifier).min(1)),
  evidenceDataIds: unique(z.array(identifier).min(1)),
});

const schemaEntitySchema = z.strictObject({
  nameZh: trimmedNonEmptyString.regex(CJK_RE),
  nameEn: trimmedNonEmptyString.optional(),
});

const schemaEntitiesSchema = z
  .strictObject({
    condition: schemaEntitySchema.optional(),
    procedure: schemaEntitySchema.optional(),
  })
  .refine(
    (value) => value.condition !== undefined || value.procedure !== undefined,
    {
      message: "schemaEntities requires condition or procedure",
    },
  );

const taxonomySchema = z.strictObject({
  primaryBodyRegion: bodyRegion,
  secondaryBodyRegions: unique(z.array(bodyRegion)),
  structures: unique(z.array(taxonomyLabel).min(1)),
  carePathway: z.enum(["operative", "nonoperative", "mixed"]),
  episode: z.enum(["acute", "postoperative", "other"]),
  sportContexts: unique(
    z.array(z.enum(["daily", "running", "field-court", "throwing"])).min(1),
  ),
});

const patientGuideSchema = z.strictObject({
  overview: statementSchema,
  whatYouMayNotice: z.array(statementSchema).min(1),
  howYouCanParticipate: z.array(statementSchema).min(1),
  contactCareTeamIf: z.array(statementSchema).min(1),
  takeHomeMessage: statementSchema,
});

const unitSchema = z.strictObject({
  id: unitId,
  order: z.number().int().min(1),
  titleZh: nonEmptyString,
  titleEn: nonEmptyString.optional(),
  timingContext: nonEmptyString.optional(),
  patientGuide: patientGuideSchema,
  goals: z.array(statementSchema).min(1),
  beforeStart: z.array(statementSchema).min(1),
  progressWhen: z.array(statementSchema).min(1),
  holdRegressOrSeekCare: z.array(statementSchema).min(1),
  clinicalActions: z.array(statementSchema).min(1),
  monitoring: z.array(statementSchema).min(1),
  evidenceDataIds: unique(z.array(identifier).min(1)),
  referenceIds: unique(z.array(identifier).min(1)),
  videoIds: unique(z.array(identifier)),
  medicalReviewStatus: reviewStatus,
});

const evidenceReferenceSchema = z.strictObject({
  id: identifier,
  title: nonEmptyString,
  citation: nonEmptyString,
  year: z.union([z.number().int(), nonEmptyString]),
  type: nonEmptyString,
  authority: nonEmptyString,
  url: httpsUri,
  doi: nonEmptyString.optional(),
  medicalReviewStatus: reviewStatus,
});

const evidenceDatumSchema = z.strictObject({
  id: identifier,
  unitIds: unique(z.array(unitId).min(1)),
  claimIds: unique(z.array(statementId).min(1)),
  metric: nonEmptyString,
  value: nonEmptyString,
  application: nonEmptyString,
  limitation: nonEmptyString,
  evidenceKind: z.enum([
    "decision-threshold",
    "protocol-restriction",
    "protocol-example",
    "prognostic-context",
    "outcome-statistic",
    "descriptive-load",
  ]),
  authorityLevel: z.enum([
    "guideline",
    "formal-consensus",
    "systematic-review",
    "primary-study",
    "institutional-protocol",
    "clinical-viewpoint",
  ]),
  decisionRole: z.enum([
    "required-with-context",
    "supporting-criterion",
    "context-only",
  ]),
  population: nonEmptyString,
  doNotUseAlone: z.literal(true),
  referenceIds: unique(z.array(identifier).min(1)),
  sourceLocator: nonEmptyString,
});

const schemaMetadataSchema = z.strictObject({
  name: nonEmptyString,
  description: nonEmptyString,
  thumbnailUrls: unique(z.array(httpsUri).min(1)),
  uploadDate: isoDate,
  embedUrl: httpsUri,
  duration: nonEmptyString.optional(),
});

const videoSchema = z.strictObject({
  id: identifier,
  provider: nonEmptyString,
  url: httpsUri,
  title: nonEmptyString,
  sourceName: nonEmptyString,
  unitIds: unique(z.array(unitId).min(1)),
  whyIncluded: nonEmptyString,
  watchFor: z.array(nonEmptyString).min(1),
  limitations: z.array(nonEmptyString).min(1),
  reviewStatus,
  schemaMetadata: schemaMetadataSchema.optional(),
});

const faqSchema = z.strictObject({
  id: identifier,
  question: nonEmptyString,
  answer: statementSchema,
  reviewStatus,
});

const themeSchema = z.strictObject({
  key: z.enum([
    "ankle-teal",
    "hamstring-coral",
    "acl-cyan",
    "adductor-burgundy",
    "achilles-titanium",
    "meniscus-violet",
    "ucl-blue",
  ]),
  accent: nonEmptyString,
  accentStrong: nonEmptyString,
  accentSoft: nonEmptyString,
  onAccent: nonEmptyString,
  focusRing: nonEmptyString,
  controlBorder: nonEmptyString,
  subtitle: nonEmptyString.optional(),
});

const seoSchema = z.strictObject({
  title: nonEmptyString,
  description: nonEmptyString,
  directAnswer: statementSchema,
});

const reviewerSchema = z.strictObject({
  id: nonEmptyString,
  name: nonEmptyString,
  qualification: nonEmptyString,
  profileUrl: httpsUri,
});

const sourceReviewProvenanceSchema = z.strictObject({
  algorithm: z.literal("sha256"),
  digest: sha256,
  scope: nonEmptyString,
});

const medicalReviewSchema = z.strictObject({
  status: medicalReviewStatus,
  reviewer: reviewerSchema.optional(),
  reviewedAt: dateTime.optional(),
  approvedContentDigest: sha256.optional(),
  sourceReviewProvenance: sourceReviewProvenanceSchema.optional(),
});

const indexingAuthorizationSchema = z.strictObject({
  status: z.enum(["not-requested", "pending", "authorized", "revoked"]),
  authorizedById: nonEmptyString.optional(),
  authorizedByName: nonEmptyString.optional(),
  authorizedAt: dateTime.optional(),
  approvedContentDigest: sha256.optional(),
  note: nonEmptyString.optional(),
});

const governanceSchema = z.strictObject({
  medicalReview: medicalReviewSchema,
  allowIndexing: z.boolean(),
  evidenceVerifiedAt: isoDate.optional(),
  indexingAuthorization: indexingAuthorizationSchema,
});

const topicSchema = z.strictObject({
  slug: upstreamSlug,
  contentDigest: sha256,
  titleZh: nonEmptyString,
  titleEn: nonEmptyString.optional(),
  subtitle: nonEmptyString,
  framework: nonEmptyString.optional(),
  expectedUnitCount: z.number().int().min(1),
  contentUpdatedAt: isoDate,
  datePublished: isoDate.optional(),
  taxonomy: taxonomySchema,
  schemaEntities: schemaEntitiesSchema,
  patientSummary: statementSchema,
  appliesTo: z.array(statementSchema).min(1),
  keyExclusions: z.array(statementSchema).min(1),
  redFlags: z.array(statementSchema).min(1),
  returnGoal: statementSchema,
  units: z.array(unitSchema).min(1),
  evidenceReferences: z.array(evidenceReferenceSchema).min(1),
  evidenceData: z.array(evidenceDatumSchema).min(1),
  videos: z.array(videoSchema),
  faqs: z.array(faqSchema).min(1),
  searchAliases: unique(z.array(taxonomyLabel).min(1)),
  relatedRehabSlugs: unique(z.array(upstreamSlug)),
  displayOrder: z.number().int(),
  theme: themeSchema,
  seo: seoSchema,
  governance: governanceSchema,
});

export const rtpCatalogSchema = z.strictObject({
  schemaVersion: z.literal(1),
  generatorVersion: nonEmptyString,
  generatedAt: dateTime,
  sourceDigest: sha256,
  counts: countsSchema,
  topics: z.array(topicSchema).min(1),
});

export const rtpCatalogManifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  generatorVersion: nonEmptyString,
  generatedAt: dateTime,
  counts: countsSchema,
  sourceDigest: sha256,
  catalogSha256: sha256,
});

type RtpCatalog = z.infer<typeof rtpCatalogSchema>;
type RtpTopic = z.infer<typeof topicSchema>;

/* ------------------------------------------------------------------ */
/* Import pipeline                                                    */
/* ------------------------------------------------------------------ */

const zodIssues = (code: string, error: z.ZodError): ValidationIssue[] =>
  error.issues.map((zodIssue) =>
    issue(code, zodIssue.path.join("."), zodIssue.message),
  );

function decodeStrict(
  bytes: Uint8Array,
  code: string,
): { text: string | null; issues: ValidationIssue[] } {
  try {
    return {
      text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      issues: [],
    };
  } catch {
    return { text: null, issues: [issue(code, "", "bytes are not UTF-8")] };
  }
}

function computedCounts(catalog: RtpCatalog) {
  return {
    topics: catalog.topics.length,
    units: catalog.topics.reduce((sum, topic) => sum + topic.units.length, 0),
    evidenceReferences: catalog.topics.reduce(
      (sum, topic) => sum + topic.evidenceReferences.length,
      0,
    ),
    evidenceData: catalog.topics.reduce(
      (sum, topic) => sum + topic.evidenceData.length,
      0,
    ),
    videos: catalog.topics.reduce((sum, topic) => sum + topic.videos.length, 0),
  };
}

const countsEqual = (
  a: z.infer<typeof countsSchema>,
  b: z.infer<typeof countsSchema>,
): boolean =>
  a.topics === b.topics &&
  a.units === b.units &&
  a.evidenceReferences === b.evidenceReferences &&
  a.evidenceData === b.evidenceData &&
  a.videos === b.videos;

const copyStatement = (statement: {
  id: string;
  text: string;
  referenceIds: string[];
  evidenceDataIds: string[];
}) => ({
  id: statement.id,
  text: statement.text,
  referenceIds: [...statement.referenceIds],
  evidenceDataIds: [...statement.evidenceDataIds],
});

/** Copies exactly the whitelisted output fields for one upstream topic. */
function summarizeTopic(topic: RtpTopic): RtpCourseSummary {
  const { medicalReview, indexingAuthorization } = topic.governance;
  return {
    slug: topic.slug,
    contentDigest: topic.contentDigest,
    titleZh: topic.titleZh,
    ...(topic.titleEn !== undefined && { titleEn: topic.titleEn }),
    subtitle: topic.subtitle,
    contentUpdatedAt: topic.contentUpdatedAt,
    taxonomy: {
      primaryBodyRegion: topic.taxonomy.primaryBodyRegion,
      structures: [...topic.taxonomy.structures],
      carePathway: topic.taxonomy.carePathway,
      episode: topic.taxonomy.episode,
    },
    patientSummary: copyStatement(topic.patientSummary),
    appliesTo: topic.appliesTo.map(copyStatement),
    keyExclusions: topic.keyExclusions.map(copyStatement),
    returnGoal: copyStatement(topic.returnGoal),
    searchAliases: [...topic.searchAliases],
    governance: {
      medicalReview: {
        status: medicalReview.status,
        ...(medicalReview.reviewer !== undefined && {
          reviewer: {
            id: medicalReview.reviewer.id,
            name: medicalReview.reviewer.name,
            qualification: medicalReview.reviewer.qualification,
            profileUrl: medicalReview.reviewer.profileUrl,
          },
        }),
        ...(medicalReview.reviewedAt !== undefined && {
          reviewedAt: medicalReview.reviewedAt,
        }),
        ...(medicalReview.approvedContentDigest !== undefined && {
          approvedContentDigest: medicalReview.approvedContentDigest,
        }),
        ...(medicalReview.sourceReviewProvenance !== undefined && {
          sourceReviewProvenance: {
            algorithm: medicalReview.sourceReviewProvenance.algorithm,
            digest: medicalReview.sourceReviewProvenance.digest,
            scope: medicalReview.sourceReviewProvenance.scope,
          },
        }),
      },
      allowIndexing: topic.governance.allowIndexing,
      ...(topic.governance.evidenceVerifiedAt !== undefined && {
        evidenceVerifiedAt: topic.governance.evidenceVerifiedAt,
      }),
      indexingAuthorization: {
        status: indexingAuthorization.status,
        ...(indexingAuthorization.authorizedById !== undefined && {
          authorizedById: indexingAuthorization.authorizedById,
        }),
        ...(indexingAuthorization.authorizedByName !== undefined && {
          authorizedByName: indexingAuthorization.authorizedByName,
        }),
        ...(indexingAuthorization.authorizedAt !== undefined && {
          authorizedAt: indexingAuthorization.authorizedAt,
        }),
        ...(indexingAuthorization.approvedContentDigest !== undefined && {
          approvedContentDigest: indexingAuthorization.approvedContentDigest,
        }),
        ...(indexingAuthorization.note !== undefined && {
          note: indexingAuthorization.note,
        }),
      },
    },
  };
}

export interface BuildInputs {
  catalogBytes: Uint8Array;
  manifestBytes: Uint8Array;
  courseLinks: unknown;
}

export interface BuildResult {
  issues: ValidationIssue[];
  /** Exact canonical bytes for the generated artifact, or null on failure. */
  artifactText: string | null;
}

export function buildRtpCourseSummariesArtifact(
  inputs: BuildInputs,
): BuildResult {
  const issues: ValidationIssue[] = [];
  const fail = (): BuildResult => ({ issues, artifactText: null });

  const manifestDecoded = decodeStrict(inputs.manifestBytes, "manifest-parse");
  if (manifestDecoded.text === null) {
    issues.push(...manifestDecoded.issues);
    return fail();
  }
  let manifestValue: unknown;
  try {
    manifestValue = parseStrictJson(manifestDecoded.text);
  } catch (error) {
    issues.push(
      issue(
        "manifest-parse",
        "",
        error instanceof CanonicalJsonError ? error.message : String(error),
      ),
    );
    return fail();
  }
  const manifestParsed = rtpCatalogManifestSchema.safeParse(manifestValue);
  if (!manifestParsed.success) {
    issues.push(...zodIssues("manifest-schema", manifestParsed.error));
    return fail();
  }
  const manifest = manifestParsed.data;

  // Exact-byte digest gate: the catalog is parsed only after this matches.
  const actualSha256 = sha256Hex(inputs.catalogBytes);
  if (actualSha256 !== manifest.catalogSha256) {
    issues.push(
      issue(
        "catalog-sha256-mismatch",
        "catalogSha256",
        `catalog bytes hash to ${actualSha256} but the manifest pins ${manifest.catalogSha256}`,
      ),
    );
    return fail();
  }

  const catalogDecoded = decodeStrict(inputs.catalogBytes, "catalog-parse");
  if (catalogDecoded.text === null) {
    issues.push(...catalogDecoded.issues);
    return fail();
  }
  let catalogValue: unknown;
  try {
    catalogValue = parseStrictJson(catalogDecoded.text);
  } catch (error) {
    issues.push(
      issue(
        "catalog-parse",
        "",
        error instanceof CanonicalJsonError ? error.message : String(error),
      ),
    );
    return fail();
  }
  // Upstream artifacts are canonical JSON followed by exactly one newline.
  if (`${canonicalJson(catalogValue)}\n` !== catalogDecoded.text) {
    issues.push(
      issue(
        "catalog-not-canonical",
        "",
        "catalog bytes must be canonical JSON plus a single trailing newline",
      ),
    );
    return fail();
  }

  const catalogParsed = rtpCatalogSchema.safeParse(catalogValue);
  if (!catalogParsed.success) {
    issues.push(...zodIssues("catalog-schema", catalogParsed.error));
    return fail();
  }
  const catalog = catalogParsed.data;

  if (catalog.sourceDigest !== manifest.sourceDigest) {
    issues.push(
      issue(
        "catalog-source-digest-mismatch",
        "sourceDigest",
        "catalog sourceDigest differs from the manifest sourceDigest",
      ),
    );
  }
  if (
    catalog.generatorVersion !== manifest.generatorVersion ||
    catalog.generatedAt !== manifest.generatedAt
  ) {
    issues.push(
      issue(
        "catalog-consistency",
        "generatedAt",
        "catalog generator metadata differs from the manifest",
      ),
    );
  }
  const actualCounts = computedCounts(catalog);
  if (
    !countsEqual(actualCounts, catalog.counts) ||
    !countsEqual(catalog.counts, manifest.counts)
  ) {
    issues.push(
      issue(
        "catalog-counts-mismatch",
        "counts",
        "catalog counts, manifest counts, and actual topic counts must all agree",
      ),
    );
  }

  const topicsBySlug = new Map<string, RtpTopic>();
  catalog.topics.forEach((topic, index) => {
    if (topicsBySlug.has(topic.slug)) {
      issues.push(
        issue(
          "catalog-duplicate-slug",
          `topics[${index}].slug`,
          `duplicate topic slug ${JSON.stringify(topic.slug)}`,
        ),
      );
    }
    topicsBySlug.set(topic.slug, topic);
    issues.push(
      ...validateCourseGovernanceConsistency(topic, `topics[${index}]`, {
        expectedSourceDigest: catalog.sourceDigest,
      }),
    );
  });

  const linkIssues = validateProfessionalCourseLinks(inputs.courseLinks);
  issues.push(...linkIssues);
  if (issues.length > 0) return fail();

  const links = professionalCourseLinksSchema.parse(inputs.courseLinks).links;
  const selected: RtpTopic[] = [];
  for (const link of links) {
    const topic = topicsBySlug.get(link.catalogSlug);
    if (topic === undefined) {
      issues.push(
        issue(
          "course-link-topic-missing",
          `links.${link.key}`,
          `catalog has no topic ${JSON.stringify(link.catalogSlug)}`,
        ),
      );
      continue;
    }
    selected.push(topic);
  }
  if (issues.length > 0) return fail();

  const artifact = {
    schemaVersion: 1,
    courses: selected
      .map(summarizeTopic)
      .sort((a, b) => compareCodePoints(a.slug, b.slug)),
  };
  const artifactIssues = validateRtpCourseSummaries(artifact);
  if (artifactIssues.length > 0) {
    issues.push(...artifactIssues);
    return fail();
  }
  return { issues, artifactText: canonicalJson(artifact) };
}

/* ------------------------------------------------------------------ */
/* Filesystem entry points                                            */
/* ------------------------------------------------------------------ */

export interface ResolvedOutputPath {
  outputPath: string | null;
  issues: ValidationIssue[];
}

/** The importer may only write inside the atlas project root. */
export function resolveOutputPathWithinProject(
  projectRoot: string,
  outputRelPath: string,
): ResolvedOutputPath {
  const root = resolve(projectRoot);
  const resolved = isAbsolute(outputRelPath)
    ? resolve(outputRelPath)
    : resolve(root, outputRelPath);
  if (resolved !== root && !resolved.startsWith(`${root}${sep}`)) {
    return {
      outputPath: null,
      issues: [
        issue(
          "output-path-outside-project",
          "outputPath",
          `refusing to write ${resolved} outside the atlas project root`,
        ),
      ],
    };
  }
  return { outputPath: resolved, issues: [] };
}

export interface ImportOptions {
  projectRoot: string;
  catalogPath?: string;
  manifestPath?: string;
  outputRelPath?: string;
}

export interface ImportResult {
  issues: ValidationIssue[];
  outputPath: string | null;
}

export function runRtpImport(options: ImportOptions): ImportResult {
  const root = resolve(options.projectRoot);
  const resolved = resolveOutputPathWithinProject(
    root,
    options.outputRelPath ?? RTP_COURSE_SUMMARIES_DATA_PATH,
  );
  if (resolved.outputPath === null) {
    return { issues: resolved.issues, outputPath: null };
  }
  const readInput = (
    path: string,
    label: string,
  ): { bytes: Uint8Array | null; issues: ValidationIssue[] } => {
    try {
      return { bytes: readFileSync(resolve(root, path)), issues: [] };
    } catch (error) {
      return {
        bytes: null,
        issues: [issue("input-read", label, String(error))],
      };
    }
  };
  const catalogRead = readInput(
    options.catalogPath ?? RTP_CATALOG_DEFAULT_PATH,
    "catalog",
  );
  const manifestRead = readInput(
    options.manifestPath ?? RTP_MANIFEST_DEFAULT_PATH,
    "manifest",
  );
  const linksRead = readInput(COURSE_LINKS_DATA_PATH, "courseLinks");
  const readIssues = [
    ...catalogRead.issues,
    ...manifestRead.issues,
    ...linksRead.issues,
  ];
  if (
    catalogRead.bytes === null ||
    manifestRead.bytes === null ||
    linksRead.bytes === null
  ) {
    return { issues: readIssues, outputPath: null };
  }
  let courseLinks: unknown;
  try {
    courseLinks = parseStrictJson(
      new TextDecoder("utf-8", { fatal: true }).decode(linksRead.bytes),
    );
  } catch (error) {
    return {
      issues: [
        issue(
          "course-links-schema",
          COURSE_LINKS_DATA_PATH,
          error instanceof CanonicalJsonError ? error.message : String(error),
        ),
      ],
      outputPath: null,
    };
  }
  const build = buildRtpCourseSummariesArtifact({
    catalogBytes: catalogRead.bytes,
    manifestBytes: manifestRead.bytes,
    courseLinks,
  });
  if (build.artifactText === null) {
    return { issues: build.issues, outputPath: null };
  }
  mkdirSync(dirname(resolved.outputPath), { recursive: true });
  writeFileSync(resolved.outputPath, build.artifactText);
  return { issues: build.issues, outputPath: resolved.outputPath };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = runRtpImport({ projectRoot: process.cwd() });
  if (result.issues.length > 0 || result.outputPath === null) {
    for (const entry of result.issues) {
      console.error(`${entry.code} ${entry.path}: ${entry.message}`);
    }
    process.exit(1);
  }
  console.log(`wrote ${result.outputPath}`);
}
