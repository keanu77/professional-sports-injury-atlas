export const PLAYER_PHOTO_REGISTRY_PATH =
  "src/assets/players/player-photo-registry.v2.json" as const;
export const PREVIOUS_PLAYER_PHOTO_REGISTRY_PATH =
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

export interface PlayerPhotoAssetRecord {
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

export interface PlayerPhotoFallbackRecord {
  athleteName: string;
  caseIds: string[];
  reason: "no-qualified-commons-photo";
}

export interface PlayerPhotoRegistryV2 {
  assets: PlayerPhotoAssetRecord[];
  fallbacks: PlayerPhotoFallbackRecord[];
  previousRegistryBinding: {
    path: typeof PREVIOUS_PLAYER_PHOTO_REGISTRY_PATH;
    schemaVersion: 1;
    sha256: string;
  };
  schemaVersion: 2;
  scopeId: typeof PLAYER_PHOTO_SCOPE_ID;
}
