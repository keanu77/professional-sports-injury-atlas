/**
 * Canonical per-case digests. `caseClinicalPayload` is an explicit allowlist:
 * workflow status, medical review, checker identities/dates, public-rights
 * review, audit fields, and embed/caption check state are excluded, while
 * stable video/source facts and clinical content are included.
 */

import { z } from "astro/zod";
import { canonicalJson, sha256Hex } from "./canonical-json";
import { SHA256_RE } from "../contracts/canonical";
import type { InjuryCase } from "../contracts/case";
import { CURRENT_PUBLIC_RIGHTS_POLICY_VERSION } from "../contracts/site-governance";

export interface VideoIdentityPayload {
  caseId: string;
  candidateId: string;
  provider: string;
  contentType: string;
  eventBinding: {
    status: string;
    eventSourceId: string | null;
    basis: string | null;
  };
  canonicalUrl: string;
  fallbackUrl: string;
  uploaderName: string;
  uploaderProvenance: string;
  durationSeconds: number;
  startSeconds: number;
  endSeconds: number;
}

export interface CaseClinicalPayload {
  schemaVersion: number;
  binding: { manifestId: string; candidateId: string; entryDigest: string };
  identity: Record<string, string>;
  injury: Record<string, string>;
  observedMechanismTags: string[];
  isClassic: boolean;
  classicReason: string | null;
  video: Record<string, unknown>;
  general: Record<string, string>;
  professional: Record<string, unknown>;
  sources: Array<Record<string, unknown>>;
}

/**
 * Covers case/candidate identity, provider, content type, event-binding
 * facts, canonical/fallback URLs, uploader identity/provenance, and the
 * duration/window — but excludes the provenance-verification object.
 */
export function videoIdentityPayload(record: InjuryCase): VideoIdentityPayload {
  return {
    caseId: record.id,
    candidateId: record.sourceManifestBinding.candidateId,
    provider: record.video.provider,
    contentType: record.video.contentType,
    eventBinding: {
      status: record.video.eventBinding.status,
      eventSourceId: record.video.eventBinding.eventSourceId,
      basis: record.video.eventBinding.basis,
    },
    canonicalUrl: record.video.canonicalUrl,
    fallbackUrl: record.video.fallbackUrl,
    uploaderName: record.video.uploaderName,
    uploaderProvenance: record.video.uploaderProvenance,
    durationSeconds: record.video.durationSeconds,
    startSeconds: record.video.startSeconds,
    endSeconds: record.video.endSeconds,
  };
}

export function computeVideoIdentityDigest(record: InjuryCase): string {
  return sha256Hex(canonicalJson(videoIdentityPayload(record)));
}

export function caseClinicalPayload(record: InjuryCase): CaseClinicalPayload {
  return {
    schemaVersion: record.schemaVersion,
    binding: {
      manifestId: record.sourceManifestBinding.manifestId,
      candidateId: record.sourceManifestBinding.candidateId,
      entryDigest: record.sourceManifestBinding.entryDigest,
    },
    identity: {
      id: record.id,
      slug: record.slug,
      sportCode: record.sport.code,
      leagueCode: record.league.code,
      competitionCode: record.competition.code,
      athleteName: record.athlete.name,
      teamAtEventName: record.teamAtEvent.name,
      opponentName: record.opponent.name,
      season: record.season,
      eventDate: record.eventDate,
    },
    injury: {
      code: record.injury.code,
      confirmedDiagnosis: record.injury.confirmedDiagnosis,
      confirmationStatus: record.injury.confirmationStatus,
    },
    observedMechanismTags: [...record.observedMechanismTags],
    isClassic: record.isClassic,
    classicReason: record.classicReason,
    video: {
      provider: record.video.provider,
      contentType: record.video.contentType,
      eventBinding: {
        status: record.video.eventBinding.status,
        eventSourceId: record.video.eventBinding.eventSourceId,
        basis: record.video.eventBinding.basis,
      },
      canonicalUrl: record.video.canonicalUrl,
      fallbackUrl: record.video.fallbackUrl,
      uploaderName: record.video.uploaderName,
      uploaderProvenance: record.video.uploaderProvenance,
      durationSeconds: record.video.durationSeconds,
      startSeconds: record.video.startSeconds,
      endSeconds: record.video.endSeconds,
      segments: record.video.segments.map((segment) => ({
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
        observation: segment.observation,
      })),
    },
    general: {
      whatHappened: record.general.whatHappened,
      whatIsVisible: record.general.whatIsVisible,
      whatVideoCannotProve: record.general.whatVideoCannotProve,
      confirmedUpdate: record.general.confirmedUpdate,
    },
    professional: {
      mechanismAnalysis: record.professional.mechanismAnalysis,
      clinicalLimitations: record.professional.clinicalLimitations,
      differentialContext: record.professional.differentialContext,
      treatmentAndRtpMeaning: record.professional.treatmentAndRtpMeaning,
      claims: record.professional.claims.map((claim) => ({
        id: claim.id,
        field: claim.field,
        text: claim.text,
        evidenceIds: [...claim.evidenceIds],
      })),
      evidenceIds: [...record.professional.evidenceIds],
      rtpCourseKey: record.professional.rtpCourseKey,
    },
    sources: record.sources.map((source) => ({
      id: source.id,
      type: source.type,
      title: source.title,
      publisher: source.publisher,
      independenceGroup: source.independenceGroup,
      originReportId: source.originReportId,
      url: source.url,
      publishedAt: source.publishedAt,
      supports: [...source.supports],
    })),
  };
}

export function computeCaseContentDigest(record: InjuryCase): string {
  return sha256Hex(canonicalJson(caseClinicalPayload(record)));
}

/**
 * Identity payload plus embed state, caption state, and source-provenance
 * status/basis/policy/identity digest. Excludes verifier identity/date/notes,
 * embed/caption checked dates, and public-rights reviewer fields.
 */
export function computeVideoSourceDigest(record: InjuryCase): string {
  const provenance = record.video.sourceProvenanceVerification;
  return sha256Hex(
    canonicalJson({
      identity: videoIdentityPayload(record),
      embedStatus: record.video.embedStatus,
      captionStatus: record.video.captionStatus,
      provenance: {
        status: provenance.status,
        basis: provenance.basis,
        policyVersion: provenance.verifiedPolicyVersion,
        identityDigest: provenance.reviewedVideoIdentityDigest,
      },
    }),
  );
}

export const publicVideoRightsDecisionSchema = z.strictObject({
  schemaVersion: z.literal(1),
  decisionType: z.literal("video-public-rights"),
  decisionStatus: z.literal("cleared"),
  caseId: z.string().min(1),
  videoSourceDigest: z.string().regex(SHA256_RE),
  publicRightsPolicyVersion: z.string().min(1),
  termsCheckedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  decisionBasis: z.string().min(1),
  notes: z.string().min(1).nullable(),
  reviewedBy: z.string().min(1),
  reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
});
export type PublicVideoRightsDecision = z.infer<
  typeof publicVideoRightsDecisionSchema
>;

export class PublicRightsDecisionError extends Error {}

/**
 * Reparses and revalidates a durable rights-decision artifact against the
 * current case/video/policy, then returns its canonical byte digest. The
 * public selector and release gate reload the artifact every time;
 * record-local reviewer fields alone never clear rights.
 */
export function computePublicRightsDecisionDigest(
  record: InjuryCase,
  decision: PublicVideoRightsDecision,
): string {
  const parsed = publicVideoRightsDecisionSchema.safeParse(decision);
  if (!parsed.success) {
    throw new PublicRightsDecisionError(
      "public rights decision artifact has an invalid shape",
    );
  }
  if (parsed.data.caseId !== record.id) {
    throw new PublicRightsDecisionError(
      `rights decision targets ${parsed.data.caseId}, not ${record.id}`,
    );
  }
  const currentVideoSourceDigest = computeVideoSourceDigest(record);
  if (parsed.data.videoSourceDigest !== currentVideoSourceDigest) {
    throw new PublicRightsDecisionError(
      "rights decision does not match the current canonical video-source payload",
    );
  }
  if (
    parsed.data.publicRightsPolicyVersion !==
    CURRENT_PUBLIC_RIGHTS_POLICY_VERSION
  ) {
    throw new PublicRightsDecisionError(
      "rights decision was made under a superseded public-rights policy version",
    );
  }
  return sha256Hex(canonicalJson(parsed.data));
}
