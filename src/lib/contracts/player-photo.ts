export const PLAYER_PHOTO_REGISTRY_PATH =
  "src/assets/players/player-photo-registry.v3.json" as const;
export const PREVIOUS_PLAYER_PHOTO_REGISTRY_PATH =
  "src/assets/players/player-photo-registry.v2.json" as const;
export const HISTORICAL_PLAYER_PHOTO_REGISTRY_V1_PATH =
  "src/assets/players/player-photo-registry.v1.json" as const;
export const PLAYER_PHOTO_SCOPE_ID =
  "decision-7-commons-player-photo-covers-only" as const;
export const PLAYER_PHOTO_SOURCE_CLASSIFICATION =
  "wikimedia-commons-player-basketball-court-photo" as const;
export const PLAYER_PHOTO_NON_EVENT_CAPTION =
  "球員球場資料照片；非本案例受傷當下影像" as const;
export const PLAYER_PHOTO_POLICY_VERSION = "nba-v4" as const;
export const PLAYER_PHOTO_POLICY_JSON_PATH =
  "research/source-policy/source-policy.v4.json" as const;
export const PLAYER_PHOTO_POLICY_MARKDOWN_PATH =
  "research/source-policy/nba.v4.md" as const;
export const PLAYER_PHOTO_SOURCE_RISK_CHECKED_AT = "2026-08-12" as const;
export const PLAYER_PHOTO_SOURCE_RISK_DISCLAIMER =
  "Source-context classification only; this is not rights clearance or publication approval." as const;

export type PlayerPhotoSourceRiskCategory =
  "game-action-high-risk" | "non-event-low-risk";

export type PlayerPhotoLicenseBucket = "cc-by" | "cc-by-sa" | "cc0";

export interface PlayerPhotoLicense {
  name: string;
  token: string;
  url: string;
}

export interface PlayerPhotoNotice {
  status: "not-supplied" | "supplied";
  text: string | null;
  url: string | null;
}

export interface PlayerPhotoRightsAttribution {
  adapterLicense: PlayerPhotoLicense | null;
  alterationState: {
    commonsFileStatus: "cropped" | "no-crop-declared";
    evidence: string;
    sitePresentation: "css-object-fit-cover-crop";
  };
  copyrightNotice: PlayerPhotoNotice;
  disclaimerNotice: PlayerPhotoNotice;
  licenseBucket: PlayerPhotoLicenseBucket;
  otherPerFileNotice: PlayerPhotoNotice;
  sourceRevision: {
    checkedAt: string;
    id: number;
    permalink: string;
    timestamp: string;
    title: string;
  };
  workTitle: {
    evidence: string;
    evidenceUrl: string;
    status: "not-supplied" | "supplied";
    text: string | null;
  };
}

export interface PlayerPhotoPolicyBinding {
  sourcePolicyVersion: typeof PLAYER_PHOTO_POLICY_VERSION;
  jsonPath: typeof PLAYER_PHOTO_POLICY_JSON_PATH;
  jsonSha256: string;
  markdownPath: typeof PLAYER_PHOTO_POLICY_MARKDOWN_PATH;
  markdownSha256: string;
}

export interface PlayerPhotoAssetRecordV2 {
  alterationDisclosure: string;
  athleteName: string;
  caseIds: string[];
  commonsDescriptionUrl: string;
  commonsDownloadUrl: string;
  commonsRestrictions: string[];
  cropValidation: {
    checkedAt: string;
    checkedBy: string;
    ratios: Array<{
      aspectRatio: "5:2" | "16:9";
      faceSafe: true;
    }>;
  };
  downloadDate: string;
  focalPosition: {
    xPercent: number;
    yPercent: number;
  };
  identityEvidence: {
    basis: string;
    checkedAt: string;
    checkedBy: string;
    status: "verified";
    url: string;
  };
  license: PlayerPhotoLicense;
  localFile: {
    byteLength: number;
    height: number;
    mimeType: "image/jpeg";
    path: string;
    sha256: string;
    width: number;
  };
  nonEventCaption: typeof PLAYER_PHOTO_NON_EVENT_CAPTION;
  originalFile: {
    filename: string;
    height: number;
    mediaInfoSha1: string;
    mimeType: "image/jpeg";
    width: number;
  };
  photographer: string;
  rightsAttribution: PlayerPhotoRightsAttribution;
  sourceClassification: typeof PLAYER_PHOTO_SOURCE_CLASSIFICATION;
  sourcePolicyBinding: PlayerPhotoPolicyBinding;
}

/**
 * Decision 11 source-context audit only. Neither category grants permission,
 * rights clearance, or publication approval.
 */
export interface PlayerPhotoSourceRiskClassification {
  basis: string;
  category: PlayerPhotoSourceRiskCategory;
  checkedAt: typeof PLAYER_PHOTO_SOURCE_RISK_CHECKED_AT;
  sourceRevisionPermalink: string;
}

export interface PlayerPhotoAssetRecord extends PlayerPhotoAssetRecordV2 {
  sourceRiskClassification: PlayerPhotoSourceRiskClassification;
}

export interface PlayerPhotoFallbackRecord {
  athleteName: string;
  caseIds: string[];
  reason: "no-qualified-commons-photo";
}

export interface PlayerPhotoRegistryV2 {
  assets: PlayerPhotoAssetRecordV2[];
  fallbacks: PlayerPhotoFallbackRecord[];
  previousRegistryBinding: {
    path: typeof HISTORICAL_PLAYER_PHOTO_REGISTRY_V1_PATH;
    schemaVersion: 1;
    sha256: string;
  };
  schemaVersion: 2;
  scopeId: typeof PLAYER_PHOTO_SCOPE_ID;
}

export interface PlayerPhotoRegistryV3 {
  assets: PlayerPhotoAssetRecord[];
  fallbacks: PlayerPhotoFallbackRecord[];
  previousRegistryBinding: {
    path: typeof PREVIOUS_PLAYER_PHOTO_REGISTRY_PATH;
    schemaVersion: 2;
    sha256: string;
  };
  schemaVersion: 3;
  scopeId: typeof PLAYER_PHOTO_SCOPE_ID;
}
