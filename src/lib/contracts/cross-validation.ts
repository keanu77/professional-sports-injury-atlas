/**
 * Cross-field and cross-case validators for the injury-case contract. All
 * validators collect deterministic `{code, path, message}` issues and never
 * mutate their input.
 */

import {
  isValidIsoDate,
  isValidUtcTimestamp,
  issue,
  parseStrictJson,
  SHA256_RE,
  sha256Hex,
  canonicalJson,
  type ValidationIssue,
} from "./canonical";
import {
  caseSchema,
  RECENT_EVENT_CUTOFF,
  SOURCE_SUPPORT_COMPATIBILITY,
  validateAtomicClaims,
  type CaseSource,
  type InjuryCase,
} from "./case";
import {
  defaultTaxonomyRegistries,
  findCompetition,
  findInjury,
  findLeague,
  findMechanism,
  findSport,
  findVideoProvider,
  type TaxonomyRegistries,
} from "./taxonomy";
import {
  resolveSourceManifestBinding,
  sourceBatchManifestSchema,
  sourceReviewDecisionSchema,
  type RegistryArtifactLoader,
  type SourceCandidateEntry,
  type SourceManifestRegistryV1,
  type SourceReviewDecision,
} from "./source-manifest-registry";

const TWO_YEAR_SEASON_RE = /^(19|20)\d{2}-\d{2}$/;

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function seasonWindow(season: string): { start: string; end: string } {
  const startYear = Number.parseInt(season.slice(0, 4), 10);
  return { start: `${startYear}-07-01`, end: `${startYear + 1}-06-30` };
}

/** Validates one case record: strict schema plus record-level rules. */
export function validateCaseRecord(
  record: unknown,
  registries: TaxonomyRegistries = defaultTaxonomyRegistries,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const parsed = caseSchema.safeParse(record);
  if (!parsed.success) {
    for (const zodIssue of parsed.error.issues) {
      issues.push(issue("schema", zodIssue.path.join("."), zodIssue.message));
    }
    return issues;
  }
  const value = parsed.data;

  if (/<iframe/i.test(JSON.stringify(record))) {
    issues.push(
      issue(
        "iframe-forbidden",
        "",
        "arbitrary iframe HTML is forbidden anywhere in a case record",
      ),
    );
  }

  const dateChecks: Array<[string, string, boolean]> = [
    ["eventDate", value.eventDate, true],
    ["video.embedCheckedAt", value.video.embedCheckedAt, false],
    ["video.captionCheckedAt", value.video.captionCheckedAt, false],
    ["audit.createdAt", value.audit.createdAt, false],
    ["audit.updatedAt", value.audit.updatedAt, false],
  ];
  for (const source of value.sources) {
    dateChecks.push([
      `sources.${source.id}.publishedAt`,
      source.publishedAt,
      true,
    ]);
    dateChecks.push([
      `sources.${source.id}.accessedAt`,
      source.accessedAt,
      true,
    ]);
  }
  if (value.video.eventBinding.checkedAt !== null) {
    dateChecks.push([
      "video.eventBinding.checkedAt",
      value.video.eventBinding.checkedAt,
      false,
    ]);
  }
  if (value.video.sourceProvenanceVerification.verifiedAt !== null) {
    dateChecks.push([
      "video.sourceProvenanceVerification.verifiedAt",
      value.video.sourceProvenanceVerification.verifiedAt,
      false,
    ]);
  }
  if (value.review.reviewedAt !== null) {
    dateChecks.push(["review.reviewedAt", value.review.reviewedAt, false]);
  }
  for (const [path, dateValue, isDate] of dateChecks) {
    const valid = isDate
      ? isValidIsoDate(dateValue)
      : isValidUtcTimestamp(dateValue);
    if (!valid) {
      issues.push(
        issue("invalid-date", path, `invalid date value ${dateValue}`),
      );
    }
  }

  const sport = findSport(value.sport.code, registries);
  if (sport === undefined) {
    issues.push(
      issue("unknown-sport", "sport.code", `unknown sport ${value.sport.code}`),
    );
  }
  const league = findLeague(value.league.code, registries);
  if (league === undefined) {
    issues.push(
      issue(
        "unknown-league",
        "league.code",
        `unknown league ${value.league.code}`,
      ),
    );
  } else if (league.sportCode !== value.sport.code) {
    issues.push(
      issue(
        "league-sport-mismatch",
        "league.code",
        `league ${league.code} belongs to sport ${league.sportCode}, not ${value.sport.code}`,
      ),
    );
  }
  const competition = findCompetition(value.competition.code, registries);
  if (competition === undefined) {
    issues.push(
      issue(
        "unknown-competition",
        "competition.code",
        `unknown competition ${value.competition.code}`,
      ),
    );
  } else if (league !== undefined && competition.leagueCode !== league.code) {
    issues.push(
      issue(
        "competition-league-mismatch",
        "competition.code",
        `competition ${competition.code} belongs to league ${competition.leagueCode}`,
      ),
    );
  }
  if (findInjury(value.injury.code, registries) === undefined) {
    issues.push(
      issue(
        "unknown-injury",
        "injury.code",
        `unknown injury ${value.injury.code}`,
      ),
    );
  }

  const mechanisms = value.observedMechanismTags;
  for (const tag of mechanisms) {
    const mechanism = findMechanism(tag, registries);
    if (mechanism === undefined) {
      issues.push(
        issue(
          "unknown-mechanism",
          "observedMechanismTags",
          `unknown mechanism tag ${tag}`,
        ),
      );
      continue;
    }
    if (!mechanism.allowedInjuries.includes(value.injury.code)) {
      issues.push(
        issue(
          "mechanism-injury-mismatch",
          "observedMechanismTags",
          `mechanism ${tag} is not allowed for injury ${value.injury.code}`,
        ),
      );
    }
  }
  if (new Set(mechanisms).size !== mechanisms.length) {
    issues.push(
      issue(
        "mechanism-combination",
        "observedMechanismTags",
        "mechanism tags must be unique",
      ),
    );
  }
  if (mechanisms.includes("unclear") && mechanisms.length > 1) {
    issues.push(
      issue(
        "mechanism-combination",
        "observedMechanismTags",
        "unclear cannot be combined with another mechanism tag",
      ),
    );
  }

  if (league !== undefined && league.seasonForm === "two-year") {
    if (!TWO_YEAR_SEASON_RE.test(value.season)) {
      issues.push(
        issue(
          "season-form",
          "season",
          `league ${league.code} requires the two-year YYYY-YY season form`,
        ),
      );
    } else {
      const startYear = Number.parseInt(value.season.slice(0, 4), 10);
      const secondPart = value.season.slice(5);
      const expected = String((startYear + 1) % 100).padStart(2, "0");
      if (secondPart !== expected) {
        issues.push(
          issue(
            "season-year-sequence",
            "season",
            `season second year must be ${expected}`,
          ),
        );
      } else if (isValidIsoDate(value.eventDate)) {
        const window = seasonWindow(value.season);
        if (value.eventDate < window.start || value.eventDate > window.end) {
          issues.push(
            issue(
              "event-date-outside-season",
              "eventDate",
              `event date ${value.eventDate} is outside season ${value.season}`,
            ),
          );
        }
      }
    }
  }

  const isRecent = value.eventDate >= RECENT_EVENT_CUTOFF;
  if (!isRecent) {
    if (!value.isClassic) {
      issues.push(
        issue(
          "classic-required",
          "isClassic",
          `events before ${RECENT_EVENT_CUTOFF} require isClassic=true`,
        ),
      );
    }
  } else if (value.isClassic) {
    issues.push(
      issue(
        "classic-not-allowed",
        "isClassic",
        "recent events must not be marked classic",
      ),
    );
  }
  if (value.isClassic) {
    if (value.classicReason === null || value.classicReason.trim() === "") {
      issues.push(
        issue("classic-fields", "classicReason", "classic requires a reason"),
      );
    }
    if (
      value.classicProposedBy === null ||
      value.classicProposedBy.trim() === ""
    ) {
      issues.push(
        issue(
          "classic-fields",
          "classicProposedBy",
          "classic requires a proposer from initial authoring",
        ),
      );
    }
  } else {
    if (
      value.classicReason !== null ||
      value.classicProposedBy !== null ||
      value.classicExceptionApprovedBy !== null
    ) {
      issues.push(
        issue(
          "classic-fields",
          "classicReason",
          "non-classic cases must keep classic fields null",
        ),
      );
    }
  }

  const provider = findVideoProvider(value.video.provider, registries);
  if (provider === undefined) {
    issues.push(
      issue(
        "unknown-provider",
        "video.provider",
        `unknown video provider ${value.video.provider}`,
      ),
    );
  } else {
    const host = hostOf(value.video.canonicalUrl);
    if (host === null || !provider.allowedHosts.includes(host)) {
      issues.push(
        issue(
          "video-host",
          "video.canonicalUrl",
          `host ${host ?? "?"} is not allowed for provider ${provider.code}`,
        ),
      );
    }
    if (!provider.allowedEmbedStatuses.includes(value.video.embedStatus)) {
      issues.push(
        issue(
          "embed-status-not-allowed",
          "video.embedStatus",
          `provider ${provider.code} does not allow embed status ${value.video.embedStatus}`,
        ),
      );
    }
  }
  if (value.video.fallbackUrl !== value.video.canonicalUrl) {
    issues.push(
      issue(
        "fallback-url-mismatch",
        "video.fallbackUrl",
        "the MVP fallback URL must equal the same canonical original platform page",
      ),
    );
  }
  const { durationSeconds, startSeconds, endSeconds } = value.video;
  if (!(startSeconds < endSeconds && endSeconds <= durationSeconds)) {
    issues.push(
      issue(
        "video-window",
        "video.startSeconds",
        "selected window must satisfy 0 <= start < end <= durationSeconds",
      ),
    );
  }
  value.video.segments.forEach((segment, index) => {
    const path = `video.segments[${index}]`;
    if (!(
      segment.startSeconds < segment.endSeconds &&
      segment.endSeconds <= durationSeconds
    )) {
      issues.push(
        issue(
          "segment-range",
          path,
          "segment must satisfy 0 <= start < end <= durationSeconds",
        ),
      );
    }
    if (index > 0) {
      const previous = value.video.segments[index - 1]!;
      if (segment.startSeconds < previous.endSeconds) {
        issues.push(
          issue(
            "segment-order",
            path,
            "segments must be ordered and non-overlapping",
          ),
        );
      }
    }
  });

  const sourceIds = new Set<string>();
  for (const source of value.sources) {
    const path = `sources.${source.id}`;
    if (sourceIds.has(source.id)) {
      issues.push(
        issue("duplicate-source-id", path, `duplicate source ID ${source.id}`),
      );
    }
    sourceIds.add(source.id);
    const allowed = SOURCE_SUPPORT_COMPATIBILITY[source.type];
    for (const support of source.supports) {
      if (!allowed.includes(support)) {
        issues.push(
          issue(
            "source-support-incompatible",
            path,
            `source type ${source.type} may not support ${support}`,
          ),
        );
      }
    }
  }

  const binding = value.video.eventBinding;
  if (binding.eventSourceId !== null) {
    const target = value.sources.find(
      (source) => source.id === binding.eventSourceId,
    );
    if (target === undefined || target.type !== "event-context") {
      issues.push(
        issue(
          "event-binding-source",
          "video.eventBinding.eventSourceId",
          "eventSourceId must resolve to an event-context source",
        ),
      );
    }
  }

  issues.push(
    ...validateAtomicClaims({
      fields: new Map([
        [
          "professional.mechanismAnalysis",
          value.professional.mechanismAnalysis,
        ],
        [
          "professional.clinicalLimitations",
          value.professional.clinicalLimitations,
        ],
        [
          "professional.differentialContext",
          value.professional.differentialContext,
        ],
        [
          "professional.treatmentAndRtpMeaning",
          value.professional.treatmentAndRtpMeaning,
        ],
      ]),
      claims: value.professional.claims,
      sources: value.sources,
      aggregateEvidenceIds: value.professional.evidenceIds,
      allowedSourceTypes: ["teaching-evidence"],
      pathPrefix: "professional",
    }),
  );

  if (value.review.status === "approved") {
    if (
      value.review.reviewerName === null ||
      value.review.reviewerQualification === null ||
      value.review.reviewedAt === null ||
      value.review.reviewedContentDigest === null
    ) {
      issues.push(
        issue(
          "review-incomplete",
          "review",
          "an approved review requires reviewer, qualification, date, and digest",
        ),
      );
    }
  }

  return issues;
}

/** Record-local diagnosis-source rule shared by the approval prerequisites. */
function diagnosisSourceIssues(record: InjuryCase): ValidationIssue[] {
  const firstParty = record.sources.filter(
    (source) => source.type === "diagnosis-first-party",
  );
  if (firstParty.length > 0) return [];
  if (!record.isClassic) {
    return [
      issue(
        "approval-diagnosis-source",
        "sources",
        "a recent approved case requires at least one diagnosis-first-party source",
      ),
    ];
  }
  const secondary = record.sources.filter(
    (source) => source.type === "diagnosis-secondary",
  );
  const groups = new Set(secondary.map((source) => source.independenceGroup));
  const origins = secondary
    .map((source) => source.originReportId)
    .filter((origin): origin is string => origin !== null);
  const sharedOrigin = new Set(origins).size !== origins.length;
  if (secondary.length < 2 || groups.size < 2 || sharedOrigin) {
    return [
      issue(
        "approval-diagnosis-source",
        "sources",
        "a classic without a first-party source requires at least two independent diagnosis-secondary sources",
      ),
    ];
  }
  return [];
}

/**
 * Approval prerequisites for a single record: everything an approved medical
 * case must satisfy other than the digest match implemented with the digest
 * library. Public-rights clearance is deliberately not required here.
 */
export function validateCaseApprovalPrerequisites(
  record: InjuryCase,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (record.injury.confirmationStatus !== "confirmed") {
    issues.push(
      issue(
        "approval-diagnosis-unconfirmed",
        "injury.confirmationStatus",
        "approved/public selection requires a confirmed diagnosis",
      ),
    );
  }

  const provenance = record.video.sourceProvenanceVerification;
  if (
    provenance.status !== "verified" ||
    provenance.verifiedBy === null ||
    provenance.verifiedAt === null ||
    provenance.basis === null ||
    provenance.verifiedPolicyVersion === null ||
    provenance.reviewedVideoIdentityDigest === null
  ) {
    issues.push(
      issue(
        "approval-provenance",
        "video.sourceProvenanceVerification",
        "approval requires verified source provenance with named verifier, date, basis, policy version, and identity digest",
      ),
    );
  }

  if (record.video.embedStatus === "unavailable") {
    issues.push(
      issue(
        "approval-video-unavailable",
        "video.embedStatus",
        "an unavailable video cannot be approved",
      ),
    );
  }

  const eventBinding = record.video.eventBinding;
  if (
    eventBinding.status !== "verified" ||
    eventBinding.eventSourceId === null ||
    eventBinding.checkedBy === null ||
    eventBinding.checkedAt === null ||
    eventBinding.basis === null
  ) {
    issues.push(
      issue(
        "approval-event-binding",
        "video.eventBinding",
        "approval requires a verified event binding with source, checker, date, and basis",
      ),
    );
  }

  const review = record.review;
  if (
    review.status !== "approved" ||
    review.reviewerName === null ||
    review.reviewerQualification === null ||
    review.reviewedAt === null
  ) {
    issues.push(
      issue(
        "approval-review-incomplete",
        "review",
        "approval requires an approved review with named reviewer, qualification, and date",
      ),
    );
  }
  if (
    review.reviewedContentDigest === null ||
    !SHA256_RE.test(review.reviewedContentDigest)
  ) {
    issues.push(
      issue(
        "approval-review-digest-format",
        "review.reviewedContentDigest",
        "approval requires a 64-character lowercase hex review digest",
      ),
    );
  }

  if (record.isClassic) {
    if (
      record.classicExceptionApprovedBy === null ||
      record.classicExceptionApprovedBy.trim() === "" ||
      record.classicExceptionApprovedBy !== review.reviewerName
    ) {
      issues.push(
        issue(
          "approval-classic-approver",
          "classicExceptionApprovedBy",
          "an approved classic requires an exception approver equal to the medical reviewer",
        ),
      );
    }
  }

  issues.push(...diagnosisSourceIssues(record));

  return issues;
}

/** Cross-case rules: IDs, slugs, source IDs, and claim IDs are globally unique. */
export function validateCaseCollection(
  records: InjuryCase[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Map<string, string>();
  const slugs = new Map<string, string>();
  const sourceIds = new Map<string, string>();
  const claimIds = new Map<string, string>();
  for (const record of records) {
    if (ids.has(record.id)) {
      issues.push(
        issue("duplicate-case-id", record.id, `duplicate case ID ${record.id}`),
      );
    }
    ids.set(record.id, record.slug);
    if (slugs.has(record.slug)) {
      issues.push(
        issue("duplicate-slug", record.slug, `duplicate slug ${record.slug}`),
      );
    }
    slugs.set(record.slug, record.id);
    for (const source of record.sources) {
      const owner = sourceIds.get(source.id);
      if (owner !== undefined && owner !== record.id) {
        issues.push(
          issue(
            "duplicate-source-id",
            `${record.id}.sources.${source.id}`,
            `source ID ${source.id} is reused across cases`,
          ),
        );
      }
      sourceIds.set(source.id, owner ?? record.id);
    }
    for (const claim of record.professional.claims) {
      const owner = claimIds.get(claim.id);
      if (owner !== undefined && owner !== record.id) {
        issues.push(
          issue(
            "duplicate-claim-id",
            `${record.id}.claims.${claim.id}`,
            `claim ID ${claim.id} is reused across cases`,
          ),
        );
      }
      claimIds.set(claim.id, owner ?? record.id);
    }
  }
  return issues;
}

/**
 * Content-filename rule: every filename is exactly `{slug}.json`, and
 * production loaders reject fixture paths and test-only adapters.
 */
export function validateCaseFilename(
  filePath: string,
  record: InjuryCase,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const segments = filePath.split("/");
  if (
    segments.some(
      (segment) =>
        segment === "fixtures" ||
        segment === "tests" ||
        segment === "__mocks__",
    )
  ) {
    issues.push(
      issue(
        "fixture-path",
        filePath,
        "production loaders reject fixture paths and test-only adapters",
      ),
    );
  }
  const fileName = segments[segments.length - 1] ?? "";
  if (fileName !== `${record.slug}.json`) {
    issues.push(
      issue(
        "filename-slug-mismatch",
        filePath,
        `content filename must be exactly ${record.slug}.json`,
      ),
    );
  }
  return issues;
}

const BOUND_FACTS: Array<
  [
    string,
    (record: InjuryCase) => unknown,
    (entry: SourceCandidateEntry) => unknown,
  ]
> = [
  ["athlete.name", (r) => r.athlete.name, (e) => e.athleteName],
  ["teamAtEvent.name", (r) => r.teamAtEvent.name, (e) => e.teamName],
  ["opponent.name", (r) => r.opponent.name, (e) => e.opponentName],
  ["sport.code", (r) => r.sport.code, (e) => e.sportCode],
  ["league.code", (r) => r.league.code, (e) => e.leagueCode],
  ["competition.code", (r) => r.competition.code, (e) => e.competitionCode],
  ["season", (r) => r.season, (e) => e.season],
  ["eventDate", (r) => r.eventDate, (e) => e.eventDate],
  ["injury.code", (r) => r.injury.code, (e) => e.injuryCode],
  [
    "injury.confirmedDiagnosis",
    (r) => r.injury.confirmedDiagnosis,
    (e) => e.confirmedDiagnosis,
  ],
  ["video.provider", (r) => r.video.provider, (e) => e.videoProvider],
  [
    "video.canonicalUrl",
    (r) => r.video.canonicalUrl,
    (e) => e.canonicalVideoUrl,
  ],
  ["video.uploaderName", (r) => r.video.uploaderName, (e) => e.uploaderName],
  [
    "video.uploaderProvenance",
    (r) => r.video.uploaderProvenance,
    (e) => e.uploaderProvenance,
  ],
  [
    "video.durationSeconds",
    (r) => r.video.durationSeconds,
    (e) => e.durationSeconds,
  ],
];

function classicBindingIssues(
  record: InjuryCase,
  entry: SourceCandidateEntry,
  decision: SourceReviewDecision,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const candidateDecision = decision.candidateDecisions.find(
    (candidate) => candidate.candidateId === entry.candidateId,
  );
  if (
    candidateDecision === undefined ||
    candidateDecision.status !== "accepted"
  ) {
    issues.push(
      issue(
        "binding-candidate-not-accepted",
        "sourceManifestBinding.candidateId",
        "the bound candidate is not accepted by the frozen source-review decision",
      ),
    );
    return issues;
  }
  if (!record.isClassic) return issues;
  const proposal = entry.classicProposal;
  const decidedProposal = candidateDecision.classicProposal;
  if (
    proposal === null ||
    decidedProposal === null ||
    proposal.proposedBy !== record.classicProposedBy ||
    decidedProposal.proposedBy !== record.classicProposedBy
  ) {
    issues.push(
      issue(
        "binding-classic-proposal",
        "classicProposedBy",
        "classic proposer identity/list membership must match the frozen source-review decision",
      ),
    );
    return issues;
  }
  const hasFirstParty = record.sources.some(
    (source: CaseSource) => source.type === "diagnosis-first-party",
  );
  if (
    !hasFirstParty &&
    decidedProposal.firstPartyDiagnosisEvidence !== "documented-unavailable"
  ) {
    issues.push(
      issue(
        "binding-first-party-unavailable-required",
        "sources",
        "a secondary-only classic requires structured documented-unavailable first-party evidence in the bound source audit",
      ),
    );
  }
  return issues;
}

/**
 * Loads the immutable origin batch artifacts through the append-only registry,
 * requires all digests to match, and compares the case's bound facts to the
 * frozen origin entry.
 */
export function validateCaseSourceBinding(
  record: InjuryCase,
  registry: SourceManifestRegistryV1,
  loadFile: RegistryArtifactLoader,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const binding = record.sourceManifestBinding;

  let resolved;
  try {
    resolved = resolveSourceManifestBinding(registry, binding);
  } catch (error) {
    issues.push(
      issue(
        "binding-unresolved",
        "sourceManifestBinding",
        error instanceof Error ? error.message : "binding did not resolve",
      ),
    );
    return issues;
  }

  const entry = resolved.entry;
  if (
    entry.manifestPath
      .split("/")
      .some((segment) => segment === "fixtures" || segment === "tests")
  ) {
    issues.push(
      issue(
        "binding-fixture-path",
        entry.manifestPath,
        "production bindings must not reference fixture paths",
      ),
    );
    return issues;
  }

  let manifestBytes: Uint8Array;
  let decisionBytes: Uint8Array;
  try {
    manifestBytes = loadFile(entry.manifestPath);
    decisionBytes = loadFile(entry.sourceReviewDecisionPath);
  } catch {
    issues.push(
      issue(
        "binding-artifact-missing",
        entry.manifestPath,
        "immutable batch artifacts are missing at the registered paths",
      ),
    );
    return issues;
  }
  if (sha256Hex(manifestBytes) !== binding.manifestDigest) {
    issues.push(
      issue(
        "binding-manifest-digest",
        entry.manifestPath,
        "manifest bytes do not match the bound manifest digest",
      ),
    );
    return issues;
  }
  if (sha256Hex(decisionBytes) !== binding.sourceReviewDecisionDigest) {
    issues.push(
      issue(
        "binding-decision-digest",
        entry.sourceReviewDecisionPath,
        "decision bytes do not match the bound decision digest",
      ),
    );
    return issues;
  }

  const manifestParsed = sourceBatchManifestSchema.safeParse(
    parseStrictJson(Buffer.from(manifestBytes).toString("utf8")),
  );
  const decisionParsed = sourceReviewDecisionSchema.safeParse(
    parseStrictJson(Buffer.from(decisionBytes).toString("utf8")),
  );
  if (!manifestParsed.success || !decisionParsed.success) {
    issues.push(
      issue(
        "binding-artifact-schema",
        entry.manifestPath,
        "immutable batch artifacts have an invalid shape",
      ),
    );
    return issues;
  }

  const candidate = manifestParsed.data.entries.find(
    (candidateEntry) => candidateEntry.candidateId === binding.candidateId,
  );
  if (candidate === undefined) {
    issues.push(
      issue(
        "binding-entry-missing",
        "sourceManifestBinding.candidateId",
        `candidate ${binding.candidateId} is absent from the bound manifest`,
      ),
    );
    return issues;
  }
  if (sha256Hex(canonicalJson(candidate)) !== binding.entryDigest) {
    issues.push(
      issue(
        "binding-entry-digest",
        "sourceManifestBinding.entryDigest",
        "the frozen origin entry does not match the bound canonical entry digest",
      ),
    );
    return issues;
  }
  if (record.audit.sourceRecordId !== binding.candidateId) {
    issues.push(
      issue(
        "binding-fact-drift",
        "audit.sourceRecordId",
        "audit.sourceRecordId must equal the bound candidate ID",
      ),
    );
  }

  for (const [path, fromRecord, fromEntry] of BOUND_FACTS) {
    const recordValue = fromRecord(record);
    const entryValue = fromEntry(candidate);
    if (recordValue !== entryValue) {
      issues.push(
        issue(
          "binding-fact-drift",
          path,
          `case value ${String(recordValue)} drifted from frozen origin value ${String(entryValue)}`,
        ),
      );
    }
  }

  issues.push(...classicBindingIssues(record, candidate, decisionParsed.data));

  return issues;
}
