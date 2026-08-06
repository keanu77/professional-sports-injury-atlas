/**
 * Exact, lossless-enough contract for the NBA source-discovery ledgers.
 *
 * CSV parsing is deliberately separate from validation: a malformed semantic
 * value remains inert data and receives a deterministic validation issue. No
 * field is interpreted as markup, a spreadsheet formula, or an executable URL.
 */

export const RECENT_CANDIDATE_CUTOFF = "2016-08-06";

export const CANDIDATE_INJURY_CODES = [
  "acl",
  "ankle-sprain",
  "achilles-rupture",
] as const;
export type CandidateInjuryCode = (typeof CANDIDATE_INJURY_CODES)[number];

export const CANDIDATE_EMBED_STATUSES = [
  "unchecked",
  "verified",
  "external-link-only",
  "unavailable",
] as const;
export type CandidateEmbedStatus = (typeof CANDIDATE_EMBED_STATUSES)[number];

export const CANDIDATE_CAPTION_STATUSES = [
  "not-verified",
  "available",
  "unavailable",
] as const;
export type CandidateCaptionStatus =
  (typeof CANDIDATE_CAPTION_STATUSES)[number];

export const CANDIDATE_VIDEO_PROVIDERS = ["youtube", "nba"] as const;
export type CandidateVideoProvider = (typeof CANDIDATE_VIDEO_PROVIDERS)[number];

export const CANDIDATE_VIDEO_CONTENT_TYPES = ["in-game-injury-event"] as const;
export type CandidateVideoContentType =
  (typeof CANDIDATE_VIDEO_CONTENT_TYPES)[number];

export const CANDIDATE_COMPETITIONS = [
  "nba-preseason",
  "nba-regular-season",
  "nba-play-in",
  "nba-playoffs",
  "nba-all-star",
] as const;
export type CandidateCompetition = (typeof CANDIDATE_COMPETITIONS)[number];

export const CANDIDATE_DIAGNOSIS_STATUSES = [
  "unconfirmed",
  "confirmed",
  "conflicted",
] as const;
export type CandidateDiagnosisStatus =
  (typeof CANDIDATE_DIAGNOSIS_STATUSES)[number];

export const FIRST_PARTY_AVAILABILITY_STATUSES = [
  "available",
  "documented-unavailable",
  "not-applicable",
] as const;
export type FirstPartyAvailabilityStatus =
  (typeof FIRST_PARTY_AVAILABILITY_STATUSES)[number];

export const CANDIDATE_DISCOVERY_STATUSES = [
  "discovered",
  "needs-source",
  "source-ready",
  "source-verified",
  "excluded",
] as const;
export type CandidateDiscoveryStatus =
  (typeof CANDIDATE_DISCOVERY_STATUSES)[number];

export const DIAGNOSIS_SOURCE_TYPES = [
  "",
  "diagnosis-first-party",
  "diagnosis-secondary",
] as const;
export type DiagnosisSourceType = (typeof DIAGNOSIS_SOURCE_TYPES)[number];

export const VIDEO_UPLOADER_PROVENANCES = [
  "league",
  "team",
  "broadcaster-rightsholder",
  "official-player",
  "unknown",
] as const;
export type VideoUploaderProvenance =
  (typeof VIDEO_UPLOADER_PROVENANCES)[number];

export const PROVENANCE_CHECK_STATUSES = [
  "pending",
  "verified",
  "rejected",
] as const;
export type ProvenanceCheckStatus = (typeof PROVENANCE_CHECK_STATUSES)[number];

/** The only accepted ledger header, including order. */
export const CANDIDATE_CSV_COLUMNS = [
  "candidate_id",
  "injury_code",
  "athlete_display_name",
  "team_at_event",
  "season",
  "event_date",
  "opponent",
  "competition",
  "is_classic",
  "classic_reason",
  "video_provider",
  "video_content_type",
  "video_canonical_url",
  "video_title",
  "video_uploader_name",
  "video_uploader_provenance",
  "video_channel_url",
  "video_published_at",
  "video_accessed_at",
  "embed_status",
  "embed_checked_at",
  "caption_status",
  "caption_checked_at",
  "video_provenance_basis",
  "provenance_check_status",
  "provenance_checked_by",
  "provenance_checked_at",
  "diagnosis_status",
  "diagnosis_claim",
  "first_party_availability_status",
  "first_party_unavailability_basis",
  "first_party_availability_checked_by",
  "first_party_availability_checked_at",
  "first_party_availability_audit_ref",
  "diagnosis_source_1_type",
  "diagnosis_source_1_title",
  "diagnosis_source_1_publisher",
  "diagnosis_source_1_independence_group",
  "diagnosis_source_1_origin_report_id",
  "diagnosis_source_1_url",
  "diagnosis_source_1_published_at",
  "diagnosis_source_1_accessed_at",
  "diagnosis_source_2_type",
  "diagnosis_source_2_title",
  "diagnosis_source_2_publisher",
  "diagnosis_source_2_independence_group",
  "diagnosis_source_2_origin_report_id",
  "diagnosis_source_2_url",
  "diagnosis_source_2_published_at",
  "diagnosis_source_2_accessed_at",
  "event_source_title",
  "event_source_publisher",
  "event_source_url",
  "event_source_published_at",
  "event_source_accessed_at",
  "discovery_status",
  "exclusion_reason",
  "checked_at",
  "reviewed_by",
  "reviewed_at",
] as const;
export type CandidateCsvColumn = (typeof CANDIDATE_CSV_COLUMNS)[number];

/** Camel-case row keys corresponding one-to-one with CANDIDATE_CSV_COLUMNS. */
export const CANDIDATE_ROW_PROPERTIES = [
  "candidateId",
  "injuryCode",
  "athleteDisplayName",
  "teamAtEvent",
  "season",
  "eventDate",
  "opponent",
  "competition",
  "isClassic",
  "classicReason",
  "videoProvider",
  "videoContentType",
  "videoCanonicalUrl",
  "videoTitle",
  "videoUploaderName",
  "videoUploaderProvenance",
  "videoChannelUrl",
  "videoPublishedAt",
  "videoAccessedAt",
  "embedStatus",
  "embedCheckedAt",
  "captionStatus",
  "captionCheckedAt",
  "videoProvenanceBasis",
  "provenanceCheckStatus",
  "provenanceCheckedBy",
  "provenanceCheckedAt",
  "diagnosisStatus",
  "diagnosisClaim",
  "firstPartyAvailabilityStatus",
  "firstPartyUnavailabilityBasis",
  "firstPartyAvailabilityCheckedBy",
  "firstPartyAvailabilityCheckedAt",
  "firstPartyAvailabilityAuditRef",
  "diagnosisSource1Type",
  "diagnosisSource1Title",
  "diagnosisSource1Publisher",
  "diagnosisSource1IndependenceGroup",
  "diagnosisSource1OriginReportId",
  "diagnosisSource1Url",
  "diagnosisSource1PublishedAt",
  "diagnosisSource1AccessedAt",
  "diagnosisSource2Type",
  "diagnosisSource2Title",
  "diagnosisSource2Publisher",
  "diagnosisSource2IndependenceGroup",
  "diagnosisSource2OriginReportId",
  "diagnosisSource2Url",
  "diagnosisSource2PublishedAt",
  "diagnosisSource2AccessedAt",
  "eventSourceTitle",
  "eventSourcePublisher",
  "eventSourceUrl",
  "eventSourcePublishedAt",
  "eventSourceAccessedAt",
  "discoveryStatus",
  "exclusionReason",
  "checkedAt",
  "reviewedBy",
  "reviewedAt",
] as const;

export type CandidateRowProperty = (typeof CANDIDATE_ROW_PROPERTIES)[number];

export const CANDIDATE_COLUMN_TO_PROPERTY = Object.freeze(
  Object.fromEntries(
    CANDIDATE_CSV_COLUMNS.map((column, index) => [
      column,
      CANDIDATE_ROW_PROPERTIES[index],
    ]),
  ) as Record<CandidateCsvColumn, CandidateRowProperty>,
);

/**
 * Parser output. Invalid semantic input is retained as an inert string so the
 * pure validator can report every problem in one deterministic pass.
 */
export interface CandidateRow {
  candidateId: string;
  injuryCode: CandidateInjuryCode;
  athleteDisplayName: string;
  teamAtEvent: string;
  season: string;
  eventDate: string;
  opponent: string;
  competition: CandidateCompetition;
  isClassic: boolean | string;
  classicReason: string;
  videoProvider: CandidateVideoProvider;
  videoContentType: CandidateVideoContentType;
  videoCanonicalUrl: string;
  videoTitle: string;
  videoUploaderName: string;
  videoUploaderProvenance: VideoUploaderProvenance;
  videoChannelUrl: string;
  videoPublishedAt: string;
  videoAccessedAt: string;
  embedStatus: CandidateEmbedStatus;
  embedCheckedAt: string;
  captionStatus: CandidateCaptionStatus;
  captionCheckedAt: string;
  videoProvenanceBasis: string;
  provenanceCheckStatus: ProvenanceCheckStatus;
  provenanceCheckedBy: string;
  provenanceCheckedAt: string;
  diagnosisStatus: CandidateDiagnosisStatus;
  diagnosisClaim: string;
  firstPartyAvailabilityStatus: FirstPartyAvailabilityStatus;
  firstPartyUnavailabilityBasis: string;
  firstPartyAvailabilityCheckedBy: string;
  firstPartyAvailabilityCheckedAt: string;
  firstPartyAvailabilityAuditRef: string;
  diagnosisSource1Type: DiagnosisSourceType;
  diagnosisSource1Title: string;
  diagnosisSource1Publisher: string;
  diagnosisSource1IndependenceGroup: string;
  diagnosisSource1OriginReportId: string;
  diagnosisSource1Url: string;
  diagnosisSource1PublishedAt: string;
  diagnosisSource1AccessedAt: string;
  diagnosisSource2Type: DiagnosisSourceType;
  diagnosisSource2Title: string;
  diagnosisSource2Publisher: string;
  diagnosisSource2IndependenceGroup: string;
  diagnosisSource2OriginReportId: string;
  diagnosisSource2Url: string;
  diagnosisSource2PublishedAt: string;
  diagnosisSource2AccessedAt: string;
  eventSourceTitle: string;
  eventSourcePublisher: string;
  eventSourceUrl: string;
  eventSourcePublishedAt: string;
  eventSourceAccessedAt: string;
  discoveryStatus: CandidateDiscoveryStatus;
  exclusionReason: string;
  checkedAt: string;
  reviewedBy: string;
  reviewedAt: string;

  /** Parser provenance used only for diagnostics and ledger scoping. */
  csvFilename: string;
  csvRow: number;
  expectedInjury: CandidateInjuryCode;
}

/** Every parser/validator error carries the required stable CSV location. */
export interface ValidationIssue {
  filename: string;
  row: number;
  column: string;
  code: string;
  message: string;
}
