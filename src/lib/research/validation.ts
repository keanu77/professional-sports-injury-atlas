/** Pure, deterministic validation for NBA source-discovery candidates. */

import {
  compareCodePoints,
  isValidIsoDate,
  isValidUtcTimestamp,
} from "../contracts/canonical";
import { parseYouTubeVideoId } from "../video/youtube";
import {
  CANDIDATE_CAPTION_STATUSES,
  CANDIDATE_COMPETITIONS,
  CANDIDATE_CSV_COLUMNS,
  CANDIDATE_DIAGNOSIS_STATUSES,
  CANDIDATE_DISCOVERY_STATUSES,
  CANDIDATE_EMBED_STATUSES,
  CANDIDATE_INJURY_CODES,
  CANDIDATE_VIDEO_CONTENT_TYPES,
  CANDIDATE_VIDEO_PROVIDERS,
  DIAGNOSIS_SOURCE_TYPES,
  FIRST_PARTY_AVAILABILITY_STATUSES,
  PROVENANCE_CHECK_STATUSES,
  RECENT_CANDIDATE_CUTOFF,
  VIDEO_UPLOADER_PROVENANCES,
  type CandidateCsvColumn,
  type CandidateRow,
  type ValidationIssue,
} from "./candidate-contract";

const CANDIDATE_ID_RE =
  /^CAND-NBA-(ACL|ANKLE|ACHILLES)-((?:19|20)[0-9]{2})-([0-9]{3})$/;
const SEASON_RE = /^(19|20)[0-9]{2}-[0-9]{2}$/;
const HTTPS_URL_RE = /^https:\/\/[^\s<>"']+$/;
const JSON_POINTER_RE = /^(?:#)?(?:\/(?:[^~/]|~[01])*)+$/;
const TRACKING_PARAMETER_RE = /^(?:utm_.+|si|feature|fbclid|gclid)$/i;
const MILLISECONDS_PER_DAY = 86_400_000;
const PRIMARY_VIDEO_EVENT_DATE_WINDOW_DAYS = 3;

const ID_INJURY_TOKEN: Record<string, string> = {
  acl: "ACL",
  "ankle-sprain": "ANKLE",
  "achilles-rupture": "ACHILLES",
};

const ACCEPTED_UPLOADER_PROVENANCE = new Set([
  "league",
  "team",
  "broadcaster-rightsholder",
]);

const columnOrder = new Map<string, number>(
  CANDIDATE_CSV_COLUMNS.map((column, index) => [column, index]),
);

const issueOrder = (left: ValidationIssue, right: ValidationIssue): number =>
  compareCodePoints(left.filename, right.filename) ||
  left.row - right.row ||
  (columnOrder.get(left.column) ?? CANDIDATE_CSV_COLUMNS.length) -
    (columnOrder.get(right.column) ?? CANDIDATE_CSV_COLUMNS.length) ||
  compareCodePoints(left.column, right.column) ||
  compareCodePoints(left.code, right.code) ||
  compareCodePoints(left.message, right.message);

function sortAndDedupe(issues: ValidationIssue[]): ValidationIssue[] {
  const sorted = [...issues].sort(issueOrder);
  return sorted.filter(
    (entry, index) =>
      index === 0 ||
      entry.filename !== sorted[index - 1]!.filename ||
      entry.row !== sorted[index - 1]!.row ||
      entry.column !== sorted[index - 1]!.column ||
      entry.code !== sorted[index - 1]!.code ||
      entry.message !== sorted[index - 1]!.message,
  );
}

const candidateIssue = (
  row: CandidateRow,
  column: CandidateCsvColumn,
  code: string,
  message: string,
): ValidationIssue => ({
  filename: row.csvFilename,
  row: row.csvRow,
  column,
  code,
  message,
});

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

function checkEnum(
  issues: ValidationIssue[],
  row: CandidateRow,
  column: CandidateCsvColumn,
  value: unknown,
  accepted: readonly string[],
): void {
  if (typeof value !== "string" || !accepted.includes(value)) {
    issues.push(
      candidateIssue(
        row,
        column,
        "invalid-enum",
        `${column} must be one of ${accepted
          .map((entry) => JSON.stringify(entry))
          .join(", ")}`,
      ),
    );
  }
}

function checkOptionalEnum(
  issues: ValidationIssue[],
  row: CandidateRow,
  column: CandidateCsvColumn,
  value: unknown,
  accepted: readonly string[],
): void {
  if (value === "") return;
  checkEnum(issues, row, column, value, accepted);
}

const REQUIRED_CORE_FIELDS: ReadonlyArray<
  readonly [keyof CandidateRow, CandidateCsvColumn]
> = [
  ["candidateId", "candidate_id"],
  ["injuryCode", "injury_code"],
  ["athleteDisplayName", "athlete_display_name"],
  ["teamAtEvent", "team_at_event"],
  ["season", "season"],
  ["eventDate", "event_date"],
  ["opponent", "opponent"],
  ["competition", "competition"],
  ["isClassic", "is_classic"],
  ["discoveryStatus", "discovery_status"],
  ["checkedAt", "checked_at"],
];

const ISO_DATE_FIELDS: ReadonlyArray<
  readonly [keyof CandidateRow, CandidateCsvColumn]
> = [
  ["eventDate", "event_date"],
  ["videoPublishedAt", "video_published_at"],
  ["videoAccessedAt", "video_accessed_at"],
  ["diagnosisSource1PublishedAt", "diagnosis_source_1_published_at"],
  ["diagnosisSource1AccessedAt", "diagnosis_source_1_accessed_at"],
  ["diagnosisSource2PublishedAt", "diagnosis_source_2_published_at"],
  ["diagnosisSource2AccessedAt", "diagnosis_source_2_accessed_at"],
  ["eventSourcePublishedAt", "event_source_published_at"],
  ["eventSourceAccessedAt", "event_source_accessed_at"],
];

const UTC_TIMESTAMP_FIELDS: ReadonlyArray<
  readonly [keyof CandidateRow, CandidateCsvColumn]
> = [
  ["embedCheckedAt", "embed_checked_at"],
  ["captionCheckedAt", "caption_checked_at"],
  ["provenanceCheckedAt", "provenance_checked_at"],
  ["firstPartyAvailabilityCheckedAt", "first_party_availability_checked_at"],
  ["checkedAt", "checked_at"],
  ["reviewedAt", "reviewed_at"],
];

const URL_FIELDS: ReadonlyArray<
  readonly [keyof CandidateRow, CandidateCsvColumn]
> = [
  ["videoCanonicalUrl", "video_canonical_url"],
  ["videoChannelUrl", "video_channel_url"],
  ["diagnosisSource1Url", "diagnosis_source_1_url"],
  ["diagnosisSource2Url", "diagnosis_source_2_url"],
  ["eventSourceUrl", "event_source_url"],
];

interface DiagnosisSourceView {
  type: string;
  title: string;
  publisher: string;
  independenceGroup: string;
  originReportId: string;
  url: string;
  publishedAt: string;
  accessedAt: string;
  columns: {
    type: CandidateCsvColumn;
    title: CandidateCsvColumn;
    publisher: CandidateCsvColumn;
    independenceGroup: CandidateCsvColumn;
    originReportId: CandidateCsvColumn;
    url: CandidateCsvColumn;
    publishedAt: CandidateCsvColumn;
    accessedAt: CandidateCsvColumn;
  };
}

function diagnosisSource(
  row: CandidateRow,
  source: 1 | 2,
): DiagnosisSourceView {
  if (source === 1) {
    return {
      type: row.diagnosisSource1Type,
      title: row.diagnosisSource1Title,
      publisher: row.diagnosisSource1Publisher,
      independenceGroup: row.diagnosisSource1IndependenceGroup,
      originReportId: row.diagnosisSource1OriginReportId,
      url: row.diagnosisSource1Url,
      publishedAt: row.diagnosisSource1PublishedAt,
      accessedAt: row.diagnosisSource1AccessedAt,
      columns: {
        type: "diagnosis_source_1_type",
        title: "diagnosis_source_1_title",
        publisher: "diagnosis_source_1_publisher",
        independenceGroup: "diagnosis_source_1_independence_group",
        originReportId: "diagnosis_source_1_origin_report_id",
        url: "diagnosis_source_1_url",
        publishedAt: "diagnosis_source_1_published_at",
        accessedAt: "diagnosis_source_1_accessed_at",
      },
    };
  }
  return {
    type: row.diagnosisSource2Type,
    title: row.diagnosisSource2Title,
    publisher: row.diagnosisSource2Publisher,
    independenceGroup: row.diagnosisSource2IndependenceGroup,
    originReportId: row.diagnosisSource2OriginReportId,
    url: row.diagnosisSource2Url,
    publishedAt: row.diagnosisSource2PublishedAt,
    accessedAt: row.diagnosisSource2AccessedAt,
    columns: {
      type: "diagnosis_source_2_type",
      title: "diagnosis_source_2_title",
      publisher: "diagnosis_source_2_publisher",
      independenceGroup: "diagnosis_source_2_independence_group",
      originReportId: "diagnosis_source_2_origin_report_id",
      url: "diagnosis_source_2_url",
      publishedAt: "diagnosis_source_2_published_at",
      accessedAt: "diagnosis_source_2_accessed_at",
    },
  };
}

function sourceHasAnyValue(source: DiagnosisSourceView): boolean {
  return [
    source.type,
    source.title,
    source.publisher,
    source.independenceGroup,
    source.originReportId,
    source.url,
    source.publishedAt,
    source.accessedAt,
  ].some(nonEmpty);
}

function requireCompleteSource(
  issues: ValidationIssue[],
  row: CandidateRow,
  source: DiagnosisSourceView,
): void {
  const fields: ReadonlyArray<readonly [string, CandidateCsvColumn]> = [
    [source.type, source.columns.type],
    [source.title, source.columns.title],
    [source.publisher, source.columns.publisher],
    [source.independenceGroup, source.columns.independenceGroup],
    [source.url, source.columns.url],
    [source.publishedAt, source.columns.publishedAt],
    [source.accessedAt, source.columns.accessedAt],
  ];
  for (const [value, column] of fields) {
    if (!nonEmpty(value)) {
      issues.push(
        candidateIssue(
          row,
          column,
          "required-field",
          `${column} is required for a populated diagnosis source`,
        ),
      );
    }
  }
}

function validHttpsUrl(value: string): "valid" | "scheme" | "invalid" {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "invalid";
  }
  if (parsed.protocol !== "https:") return "scheme";
  if (
    !HTTPS_URL_RE.test(value) ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.port !== "" ||
    parsed.hash !== ""
  ) {
    return "invalid";
  }
  return "valid";
}

function seasonMatchesEvent(season: string, eventDate: string): boolean {
  if (!SEASON_RE.test(season) || !isValidIsoDate(eventDate)) return false;
  const startYear = Number.parseInt(season.slice(0, 4), 10);
  const nextYear = startYear + 1;
  if (Number.parseInt(season.slice(5), 10) !== nextYear % 100) return false;

  let lower = `${startYear.toString().padStart(4, "0")}-07-01`;
  let upper = `${nextYear.toString().padStart(4, "0")}-06-30`;
  // The suspended 2019-20 NBA season resumed in the bubble and its Finals
  // were explicitly bounded through 2020-10-13.
  if (season === "2019-20") upper = "2020-10-13";
  // The delayed 2020-21 Finals ended in July 2021.
  if (season === "2020-21") {
    lower = "2020-12-01";
    upper = "2021-07-31";
  }
  return eventDate >= lower && eventDate <= upper;
}

function normalizeIdentity(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeAthleteEventKey(value: string): string {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

function identityContains(text: string, expected: string): boolean {
  const normalizedExpected = normalizeIdentity(expected);
  return (
    normalizedExpected !== "" &&
    ` ${normalizeIdentity(text)} `.includes(` ${normalizedExpected} `)
  );
}

function primaryVideoPublishedWithinEventDateWindow(
  eventDate: string,
  videoPublishedAt: string,
): boolean {
  if (!isValidIsoDate(eventDate) || !isValidIsoDate(videoPublishedAt)) {
    return false;
  }
  const daysAfterEvent =
    (Date.parse(`${videoPublishedAt}T00:00:00Z`) -
      Date.parse(`${eventDate}T00:00:00Z`)) /
    MILLISECONDS_PER_DAY;
  return (
    daysAfterEvent >= 0 &&
    daysAfterEvent <= PRIMARY_VIDEO_EVENT_DATE_WINDOW_DAYS
  );
}

function normalizeGroup(value: string): string {
  return normalizeIdentity(value);
}

function isValidAvailabilityPointer(value: string): boolean {
  return (
    JSON_POINTER_RE.test(value) &&
    value.replace(/^#/, "").endsWith("/firstPartyAvailability")
  );
}

function validateDiagnosisSources(
  issues: ValidationIssue[],
  row: CandidateRow,
  sourceReady: boolean,
): void {
  const source1 = diagnosisSource(row, 1);
  const source2 = diagnosisSource(row, 2);
  for (const source of [source1, source2]) {
    if (source.type === "" && sourceHasAnyValue(source)) {
      issues.push(
        candidateIssue(
          row,
          source.columns.type,
          "diagnosis-source-type-required",
          `${source.columns.type} is required when source metadata is present`,
        ),
      );
    }
    if (source.type !== "" || sourceHasAnyValue(source)) {
      requireCompleteSource(issues, row, source);
    }
  }

  if (!sourceReady) return;
  if (source1.type === "") {
    issues.push(
      candidateIssue(
        row,
        source1.columns.type,
        "required-field",
        "source-ready candidates require diagnosis source 1",
      ),
    );
  }

  const sources = [source1, source2];
  const hasFirstParty = sources.some(
    (source) => source.type === "diagnosis-first-party",
  );
  const classic = row.isClassic === true;

  if (!classic && !hasFirstParty) {
    issues.push(
      candidateIssue(
        row,
        "diagnosis_source_1_type",
        "recent-first-party-required",
        "a recent source-ready candidate requires a first-party diagnosis source",
      ),
    );
  }

  if (hasFirstParty) {
    if (row.firstPartyAvailabilityStatus !== "available") {
      issues.push(
        candidateIssue(
          row,
          "first_party_availability_status",
          "first-party-availability-mismatch",
          "a candidate with a first-party diagnosis source must record availability as available",
        ),
      );
    }
    return;
  }

  if (!classic) return;
  if (source1.type !== "diagnosis-secondary") {
    issues.push(
      candidateIssue(
        row,
        source1.columns.type,
        "classic-secondary-source-1-required",
        "a classic exception without first-party diagnosis requires secondary source 1",
      ),
    );
  }
  if (source2.type !== "diagnosis-secondary") {
    issues.push(
      candidateIssue(
        row,
        source2.columns.type,
        "classic-secondary-source-2-required",
        "a classic exception without first-party diagnosis requires secondary source 2",
      ),
    );
  }

  if (
    nonEmpty(source1.independenceGroup) &&
    nonEmpty(source2.independenceGroup) &&
    normalizeGroup(source1.independenceGroup) ===
      normalizeGroup(source2.independenceGroup)
  ) {
    issues.push(
      candidateIssue(
        row,
        source2.columns.independenceGroup,
        "diagnosis-source-not-independent",
        "classic secondary sources must have distinct normalized independence groups",
      ),
    );
  }
  if (
    nonEmpty(source1.originReportId) &&
    nonEmpty(source2.originReportId) &&
    normalizeGroup(source1.originReportId) ===
      normalizeGroup(source2.originReportId)
  ) {
    issues.push(
      candidateIssue(
        row,
        source2.columns.originReportId,
        "diagnosis-source-syndicated",
        "classic secondary sources cannot share an origin report ID",
      ),
    );
  }

  if (
    row.firstPartyAvailabilityStatus !== "documented-unavailable" ||
    !nonEmpty(row.firstPartyUnavailabilityBasis) ||
    !nonEmpty(row.firstPartyAvailabilityCheckedBy) ||
    !nonEmpty(row.firstPartyAvailabilityCheckedAt)
  ) {
    issues.push(
      candidateIssue(
        row,
        "first_party_unavailability_basis",
        "first-party-unavailability-required",
        "a classic secondary-source exception requires status, factual basis, named checker, and check time",
      ),
    );
  }
  if (!isValidAvailabilityPointer(row.firstPartyAvailabilityAuditRef)) {
    issues.push(
      candidateIssue(
        row,
        "first_party_availability_audit_ref",
        "first-party-audit-ref-invalid",
        "a classic secondary-source exception requires a JSON Pointer ending in /firstPartyAvailability",
      ),
    );
  }
}

const SOURCE_READY_REQUIRED_FIELDS: ReadonlyArray<
  readonly [keyof CandidateRow, CandidateCsvColumn]
> = [
  ["videoCanonicalUrl", "video_canonical_url"],
  ["videoProvider", "video_provider"],
  ["videoContentType", "video_content_type"],
  ["videoTitle", "video_title"],
  ["videoUploaderName", "video_uploader_name"],
  ["videoUploaderProvenance", "video_uploader_provenance"],
  ["videoChannelUrl", "video_channel_url"],
  ["videoPublishedAt", "video_published_at"],
  ["videoAccessedAt", "video_accessed_at"],
  ["embedStatus", "embed_status"],
  ["embedCheckedAt", "embed_checked_at"],
  ["captionStatus", "caption_status"],
  ["captionCheckedAt", "caption_checked_at"],
  ["videoProvenanceBasis", "video_provenance_basis"],
  ["provenanceCheckStatus", "provenance_check_status"],
  ["provenanceCheckedAt", "provenance_checked_at"],
  ["diagnosisStatus", "diagnosis_status"],
  ["diagnosisClaim", "diagnosis_claim"],
  ["firstPartyAvailabilityStatus", "first_party_availability_status"],
  ["firstPartyAvailabilityCheckedAt", "first_party_availability_checked_at"],
  ["eventSourceTitle", "event_source_title"],
  ["eventSourcePublisher", "event_source_publisher"],
  ["eventSourceUrl", "event_source_url"],
  ["eventSourcePublishedAt", "event_source_published_at"],
  ["eventSourceAccessedAt", "event_source_accessed_at"],
];

function validateSourceReady(
  issues: ValidationIssue[],
  row: CandidateRow,
): void {
  for (const [property, column] of SOURCE_READY_REQUIRED_FIELDS) {
    if (!nonEmpty(row[property])) {
      issues.push(
        candidateIssue(
          row,
          column,
          "required-field",
          `${column} is required for source-ready candidates`,
        ),
      );
    }
  }

  if (row.videoContentType !== "in-game-injury-event") {
    issues.push(
      candidateIssue(
        row,
        "video_content_type",
        "source-ready-video-content-type",
        "source-ready video content must be the in-game injury event",
      ),
    );
  }
  const videoDateMatches =
    identityContains(row.videoTitle, row.eventDate) ||
    primaryVideoPublishedWithinEventDateWindow(
      row.eventDate,
      row.videoPublishedAt,
    );
  const eventDateMatches =
    identityContains(row.eventSourceTitle, row.eventDate) ||
    row.eventSourcePublishedAt === row.eventDate;
  if (
    !identityContains(row.videoTitle, row.athleteDisplayName) ||
    !videoDateMatches ||
    !identityContains(row.eventSourceTitle, row.athleteDisplayName) ||
    !eventDateMatches
  ) {
    issues.push(
      candidateIssue(
        row,
        "video_title",
        "event-video-identity-mismatch",
        "video and event source metadata must identify the recorded athlete and event date",
      ),
    );
  }

  if (
    row.provenanceCheckStatus !== "verified" ||
    !ACCEPTED_UPLOADER_PROVENANCE.has(row.videoUploaderProvenance)
  ) {
    issues.push(
      candidateIssue(
        row,
        "provenance_check_status",
        "source-ready-provenance",
        "source-ready candidates require verified league, team, or broadcaster/rightsholder provenance",
      ),
    );
  }
  if (nonEmpty(row.videoChannelUrl)) {
    try {
      const hostname = new URL(row.videoChannelUrl).hostname;
      const providerMatches =
        (row.videoProvider === "youtube" &&
          (hostname === "youtube.com" || hostname === "www.youtube.com")) ||
        (row.videoProvider === "nba" &&
          (hostname === "nba.com" || hostname === "www.nba.com"));
      if (!providerMatches) {
        issues.push(
          candidateIssue(
            row,
            "video_channel_url",
            "video-channel-provider-mismatch",
            "uploader channel URL must be on the selected original video provider",
          ),
        );
      }
    } catch {
      // The general invalid-url issue remains the canonical parse diagnostic.
    }
  }
  if (
    !nonEmpty(row.provenanceCheckedBy) ||
    !nonEmpty(row.firstPartyAvailabilityCheckedBy)
  ) {
    issues.push(
      candidateIssue(
        row,
        "provenance_checked_by",
        "source-ready-checker",
        "source-ready provenance and first-party availability checks require named checkers",
      ),
    );
  }
  if (
    row.embedStatus !== "verified" &&
    row.embedStatus !== "external-link-only"
  ) {
    issues.push(
      candidateIssue(
        row,
        "embed_status",
        "source-ready-embed",
        "source-ready candidates require a verified embed or accepted external link",
      ),
    );
  }
  if (
    row.captionStatus !== "available" &&
    row.captionStatus !== "unavailable"
  ) {
    issues.push(
      candidateIssue(
        row,
        "caption_status",
        "source-ready-caption",
        "source-ready candidates require captions to be checked",
      ),
    );
  }
  if (row.diagnosisStatus !== "confirmed") {
    issues.push(
      candidateIssue(
        row,
        "diagnosis_status",
        "source-ready-diagnosis",
        "source-ready candidates require a non-conflicted confirmed diagnosis",
      ),
    );
  }
}

/** Validate one candidate without reading files, following links, or mutating it. */
export function validateCandidateRow(row: CandidateRow): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [property, column] of REQUIRED_CORE_FIELDS) {
    if (!nonEmpty(row[property]) && typeof row[property] !== "boolean") {
      issues.push(
        candidateIssue(row, column, "required-field", `${column} is required`),
      );
    }
  }

  checkEnum(issues, row, "injury_code", row.injuryCode, CANDIDATE_INJURY_CODES);
  checkEnum(
    issues,
    row,
    "competition",
    row.competition,
    CANDIDATE_COMPETITIONS,
  );
  checkOptionalEnum(
    issues,
    row,
    "video_provider",
    row.videoProvider,
    CANDIDATE_VIDEO_PROVIDERS,
  );
  checkOptionalEnum(
    issues,
    row,
    "video_content_type",
    row.videoContentType,
    CANDIDATE_VIDEO_CONTENT_TYPES,
  );
  checkOptionalEnum(
    issues,
    row,
    "video_uploader_provenance",
    row.videoUploaderProvenance,
    VIDEO_UPLOADER_PROVENANCES,
  );
  checkOptionalEnum(
    issues,
    row,
    "embed_status",
    row.embedStatus,
    CANDIDATE_EMBED_STATUSES,
  );
  checkOptionalEnum(
    issues,
    row,
    "caption_status",
    row.captionStatus,
    CANDIDATE_CAPTION_STATUSES,
  );
  checkOptionalEnum(
    issues,
    row,
    "provenance_check_status",
    row.provenanceCheckStatus,
    PROVENANCE_CHECK_STATUSES,
  );
  checkOptionalEnum(
    issues,
    row,
    "diagnosis_status",
    row.diagnosisStatus,
    CANDIDATE_DIAGNOSIS_STATUSES,
  );
  checkOptionalEnum(
    issues,
    row,
    "first_party_availability_status",
    row.firstPartyAvailabilityStatus,
    FIRST_PARTY_AVAILABILITY_STATUSES,
  );
  checkEnum(
    issues,
    row,
    "diagnosis_source_1_type",
    row.diagnosisSource1Type,
    DIAGNOSIS_SOURCE_TYPES,
  );
  checkEnum(
    issues,
    row,
    "diagnosis_source_2_type",
    row.diagnosisSource2Type,
    DIAGNOSIS_SOURCE_TYPES,
  );
  checkEnum(
    issues,
    row,
    "discovery_status",
    row.discoveryStatus,
    CANDIDATE_DISCOVERY_STATUSES,
  );

  if (typeof row.isClassic !== "boolean") {
    issues.push(
      candidateIssue(
        row,
        "is_classic",
        "invalid-boolean",
        "is_classic must be exactly true or false",
      ),
    );
  }

  const idMatch = CANDIDATE_ID_RE.exec(row.candidateId);
  if (idMatch === null) {
    issues.push(
      candidateIssue(
        row,
        "candidate_id",
        "invalid-candidate-id",
        "candidate ID must match CAND-NBA-{ACL|ANKLE|ACHILLES}-YYYY-NNN",
      ),
    );
  } else {
    const [, injuryToken, idYear] = idMatch;
    if (injuryToken !== ID_INJURY_TOKEN[row.injuryCode]) {
      issues.push(
        candidateIssue(
          row,
          "candidate_id",
          "candidate-id-injury-mismatch",
          "candidate ID injury token does not match injury_code",
        ),
      );
    }
    if (
      /^(19|20)[0-9]{2}/.test(row.eventDate) &&
      idYear !== row.eventDate.slice(0, 4)
    ) {
      issues.push(
        candidateIssue(
          row,
          "candidate_id",
          "candidate-id-year-mismatch",
          "candidate ID year does not match event_date year",
        ),
      );
    }
  }
  if (row.injuryCode !== row.expectedInjury) {
    issues.push(
      candidateIssue(
        row,
        "injury_code",
        "candidate-injury-file-mismatch",
        `injury_code must match the ${row.expectedInjury} ledger`,
      ),
    );
  }

  for (const [property, column] of ISO_DATE_FIELDS) {
    const value = row[property];
    if (nonEmpty(value) && !isValidIsoDate(value)) {
      issues.push(
        candidateIssue(
          row,
          column,
          "invalid-date",
          `${column} must be a real YYYY-MM-DD date`,
        ),
      );
    }
  }
  for (const [property, column] of UTC_TIMESTAMP_FIELDS) {
    const value = row[property];
    if (nonEmpty(value) && !isValidUtcTimestamp(value)) {
      issues.push(
        candidateIssue(
          row,
          column,
          "invalid-date",
          `${column} must be a real UTC YYYY-MM-DDTHH:MM:SSZ timestamp`,
        ),
      );
    }
  }

  if (!SEASON_RE.test(row.season)) {
    issues.push(
      candidateIssue(
        row,
        "season",
        "invalid-season",
        "season must match YYYY-YY with a 19xx or 20xx start year",
      ),
    );
  } else if (
    isValidIsoDate(row.eventDate) &&
    !seasonMatchesEvent(row.season, row.eventDate)
  ) {
    issues.push(
      candidateIssue(
        row,
        "season",
        "season-event-mismatch",
        "event_date falls outside the declared NBA season",
      ),
    );
  }

  for (const [property, column] of URL_FIELDS) {
    const value = row[property];
    if (!nonEmpty(value)) continue;
    const outcome = validHttpsUrl(value);
    if (outcome === "scheme") {
      issues.push(
        candidateIssue(
          row,
          column,
          "invalid-url-scheme",
          `${column} must use HTTPS`,
        ),
      );
    } else if (outcome === "invalid") {
      issues.push(
        candidateIssue(
          row,
          column,
          "invalid-url",
          `${column} must be a canonical HTTPS URL without credentials, port, fragment, markup, or whitespace`,
        ),
      );
    }
  }

  if (nonEmpty(row.videoCanonicalUrl)) {
    try {
      const parsed = new URL(row.videoCanonicalUrl);
      if (
        [...parsed.searchParams.keys()].some((key) =>
          TRACKING_PARAMETER_RE.test(key),
        )
      ) {
        issues.push(
          candidateIssue(
            row,
            "video_canonical_url",
            "video-url-tracking-parameters",
            "canonical video URL must not contain tracking parameters",
          ),
        );
      }
    } catch {
      // The general invalid-url issue above is the canonical parse diagnostic.
    }
    if (
      row.videoProvider === "youtube" &&
      parseYouTubeVideoId(row.videoCanonicalUrl) === null
    ) {
      issues.push(
        candidateIssue(
          row,
          "video_canonical_url",
          "video-url-noncanonical",
          "YouTube video URL must be a canonical watch or youtu.be URL with one 11-character ID",
        ),
      );
    }
    if (row.videoProvider === "nba") {
      try {
        const parsed = new URL(row.videoCanonicalUrl);
        if (
          parsed.protocol !== "https:" ||
          (parsed.hostname !== "nba.com" && parsed.hostname !== "www.nba.com")
        ) {
          issues.push(
            candidateIssue(
              row,
              "video_canonical_url",
              "video-provider-url-mismatch",
              "NBA video URLs must use nba.com",
            ),
          );
        }
      } catch {
        // The general URL issue above is the canonical diagnostic.
      }
    }
  }
  if (row.embedStatus === "verified" && row.videoProvider !== "youtube") {
    issues.push(
      candidateIssue(
        row,
        "embed_status",
        "embed-provider-mismatch",
        "only YouTube candidates may have verified embed status",
      ),
    );
  }

  if (typeof row.isClassic === "boolean") {
    if (isValidIsoDate(row.eventDate)) {
      const beforeCutoff = row.eventDate < RECENT_CANDIDATE_CUTOFF;
      if (row.isClassic !== beforeCutoff) {
        issues.push(
          candidateIssue(
            row,
            "is_classic",
            "classic-date-mismatch",
            `is_classic must be ${String(beforeCutoff)} for cutoff ${RECENT_CANDIDATE_CUTOFF}`,
          ),
        );
      }
    }
    if (row.isClassic && !nonEmpty(row.classicReason)) {
      issues.push(
        candidateIssue(
          row,
          "classic_reason",
          "classic-reason-required",
          "classic candidates require a factual curation reason",
        ),
      );
    }
    if (!row.isClassic && nonEmpty(row.classicReason)) {
      issues.push(
        candidateIssue(
          row,
          "classic_reason",
          "classic-reason-unexpected",
          "recent candidates must leave classic_reason blank",
        ),
      );
    }
  }

  if (row.discoveryStatus === "excluded") {
    if (!nonEmpty(row.exclusionReason)) {
      issues.push(
        candidateIssue(
          row,
          "exclusion_reason",
          "excluded-reason-required",
          "excluded candidates require an exclusion reason",
        ),
      );
    }
  } else if (nonEmpty(row.exclusionReason)) {
    issues.push(
      candidateIssue(
        row,
        "exclusion_reason",
        "exclusion-reason-unexpected",
        "non-excluded candidates must leave exclusion_reason blank",
      ),
    );
  }

  if (
    row.firstPartyAvailabilityStatus === "not-applicable" &&
    row.discoveryStatus !== "excluded" &&
    row.diagnosisStatus !== "unconfirmed"
  ) {
    issues.push(
      candidateIssue(
        row,
        "first_party_availability_status",
        "first-party-not-applicable-invalid",
        "not-applicable is permitted only for excluded or unconfirmed candidates",
      ),
    );
  }
  if (
    row.firstPartyAvailabilityStatus === "available" &&
    (nonEmpty(row.firstPartyUnavailabilityBasis) ||
      nonEmpty(row.firstPartyAvailabilityAuditRef))
  ) {
    issues.push(
      candidateIssue(
        row,
        "first_party_unavailability_basis",
        "first-party-unavailability-unexpected",
        "available first-party status must not carry unavailability basis or audit reference",
      ),
    );
  }

  const sourceReady =
    row.discoveryStatus === "source-ready" ||
    row.discoveryStatus === "source-verified";
  validateDiagnosisSources(issues, row, sourceReady);
  if (sourceReady) validateSourceReady(issues, row);

  if (row.discoveryStatus === "source-verified") {
    if (!nonEmpty(row.reviewedBy) || !nonEmpty(row.reviewedAt)) {
      issues.push(
        candidateIssue(
          row,
          "reviewed_by",
          "source-verified-reviewer",
          "source-verified candidates require the named source reviewer and review timestamp",
        ),
      );
    }
  } else if (nonEmpty(row.reviewedBy) || nonEmpty(row.reviewedAt)) {
    issues.push(
      candidateIssue(
        row,
        "reviewed_by",
        "reviewer-unexpected",
        "review fields are reserved for source-verified candidates",
      ),
    );
  }

  return sortAndDedupe(issues);
}

function eventKey(row: CandidateRow): string {
  return [
    normalizeAthleteEventKey(row.athleteDisplayName),
    row.eventDate,
    row.injuryCode,
  ].join("|");
}

function canonicalVideoKey(row: CandidateRow): string | null {
  if (!nonEmpty(row.videoCanonicalUrl)) return null;
  if (row.videoProvider === "youtube") {
    const id = parseYouTubeVideoId(row.videoCanonicalUrl);
    return id === null ? null : `youtube:${id}`;
  }
  if (
    row.videoProvider !== "nba" ||
    validHttpsUrl(row.videoCanonicalUrl) !== "valid"
  ) {
    return null;
  }
  try {
    const parsed = new URL(row.videoCanonicalUrl);
    parsed.hostname = parsed.hostname.toLocaleLowerCase("en-US");
    parsed.searchParams.sort();
    if (parsed.pathname !== "/")
      parsed.pathname = parsed.pathname.replace(/\/$/, "");
    return `nba:${parsed.toString()}`;
  } catch {
    return null;
  }
}

const rowLocationOrder = (left: CandidateRow, right: CandidateRow): number =>
  compareCodePoints(left.csvFilename, right.csvFilename) ||
  left.csvRow - right.csvRow;

function duplicateIssues(
  rows: CandidateRow[],
  keyOf: (row: CandidateRow) => string | null,
  column: CandidateCsvColumn,
  code: string,
  message: string,
  differentEventOnly = false,
): ValidationIssue[] {
  const groups = new Map<string, CandidateRow[]>();
  for (const row of rows) {
    const key = keyOf(row);
    if (key === null || key === "") continue;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  const issues: ValidationIssue[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const ordered = [...group].sort(rowLocationOrder);
    const first = ordered[0]!;
    for (const duplicate of ordered.slice(1)) {
      if (differentEventOnly && eventKey(duplicate) === eventKey(first))
        continue;
      issues.push(candidateIssue(duplicate, column, code, message));
    }
  }
  return issues;
}

/** Validate row rules plus cross-ledger candidate/event/video uniqueness. */
export function validateCandidateSet(rows: CandidateRow[]): ValidationIssue[] {
  const issues = rows.flatMap((row) => validateCandidateRow(row));
  issues.push(
    ...duplicateIssues(
      rows,
      (row) => row.candidateId,
      "candidate_id",
      "duplicate-candidate-id",
      "candidate ID must be unique across all injury ledgers",
    ),
    ...duplicateIssues(
      rows,
      (row) => eventKey(row),
      "event_date",
      "duplicate-event",
      "normalized athlete, event date, and injury identify a duplicate event",
    ),
    ...duplicateIssues(
      rows,
      canonicalVideoKey,
      "video_canonical_url",
      "duplicate-video-url",
      "one canonical video URL cannot be assigned to different events",
      true,
    ),
  );
  return sortAndDedupe(issues);
}
