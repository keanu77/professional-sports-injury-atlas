import type { ImageMetadata } from "astro";

import playerPhotoRegistryJson from "../../assets/players/player-photo-registry.v7.json";
import {
  isDecision15PhotoSelectionV7,
  type PlayerPhotoRegistryV7,
  type PlayerPhotoSelectionV7,
} from "../contracts/player-photo-registry-v7";

import achillesCase01 from "../../assets/heroes/achilles-rupture-case-01.png";
import achillesCase02 from "../../assets/heroes/achilles-rupture-case-02.png";
import achillesCase03 from "../../assets/heroes/achilles-rupture-case-03.png";
import achillesCase04 from "../../assets/heroes/achilles-rupture-case-04.png";
import achillesOverview from "../../assets/heroes/achilles-rupture-overview.png";
import aclCase01 from "../../assets/heroes/acl-case-01.png";
import aclCase02 from "../../assets/heroes/acl-case-02.png";
import aclCase03 from "../../assets/heroes/acl-case-03.png";
import aclCase04 from "../../assets/heroes/acl-case-04.png";
import aclOverview from "../../assets/heroes/acl-overview.png";
import ankleCase01 from "../../assets/heroes/ankle-sprain-case-01.png";
import ankleCase02 from "../../assets/heroes/ankle-sprain-case-02.png";
import ankleCase03 from "../../assets/heroes/ankle-sprain-case-03.png";
import ankleCase04 from "../../assets/heroes/ankle-sprain-case-04.png";
import ankleOverview from "../../assets/heroes/ankle-sprain-overview.png";
import homeAtlas from "../../assets/heroes/home-atlas.png";

export const EDITORIAL_INJURY_CODES = [
  "acl",
  "ankle-sprain",
  "achilles-rupture",
] as const;

export type EditorialInjuryCode = (typeof EDITORIAL_INJURY_CODES)[number];

type CaseImageSet = readonly [
  ImageMetadata,
  ImageMetadata,
  ImageMetadata,
  ImageMetadata,
];

const caseImages: Record<EditorialInjuryCode, CaseImageSet> = {
  acl: [aclCase01, aclCase02, aclCase03, aclCase04],
  "ankle-sprain": [ankleCase01, ankleCase02, ankleCase03, ankleCase04],
  "achilles-rupture": [
    achillesCase01,
    achillesCase02,
    achillesCase03,
    achillesCase04,
  ],
};

const overviewImages: Record<EditorialInjuryCode, ImageMetadata> = {
  acl: aclOverview,
  "ankle-sprain": ankleOverview,
  "achilles-rupture": achillesOverview,
};

type NamedCoverImage = ImageMetadata;

const playerPhotoModules = import.meta.glob<{ default: NamedCoverImage }>(
  [
    "../../assets/players/decision-13/*.{jpg,jpeg,png}",
    "../../assets/players/decision-14/*.{jpg,jpeg,png}",
    "../../assets/players/decision-15/*.{jpg,jpeg,png}",
  ],
  { eager: true },
);

export const playerPhotoRegistry =
  playerPhotoRegistryJson as PlayerPhotoRegistryV7;

interface RegisteredPlayerCover {
  asset: PlayerPhotoSelectionV7;
  image: NamedCoverImage;
}

const registeredCoverByCaseId = new Map<string, RegisteredPlayerCover>();
for (const asset of playerPhotoRegistry.selections) {
  const importPath = asset.localFile.path.replace(/^src\//u, "../../");
  const image = playerPhotoModules[importPath]?.default;
  if (image === undefined) {
    throw new Error(
      `Named-cover registry asset is not importable through Astro: ${asset.localFile.path}`,
    );
  }
  for (const caseId of asset.caseIds) {
    if (registeredCoverByCaseId.has(caseId)) {
      throw new Error(`Duplicate named-cover case mapping: ${caseId}`);
    }
    registeredCoverByCaseId.set(caseId, { asset, image });
  }
}

export const homeEditorialImage = homeAtlas;

export function isEditorialInjuryCode(
  injuryCode: string,
): injuryCode is EditorialInjuryCode {
  return EDITORIAL_INJURY_CODES.some((code) => code === injuryCode);
}

function requireEditorialInjuryCode(injuryCode: string): EditorialInjuryCode {
  if (!isEditorialInjuryCode(injuryCode)) {
    throw new Error(`No governed editorial image set for ${injuryCode}`);
  }
  return injuryCode;
}

/** Stable FNV-1a hash: the same immutable record identity always selects the same image. */
export function editorialCaseVariant(recordId: string): 0 | 1 | 2 | 3 {
  let hash = 0x811c9dc5;
  for (let index = 0; index < recordId.length; index += 1) {
    hash ^= recordId.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return ((hash >>> 0) % 4) as 0 | 1 | 2 | 3;
}

export function caseEditorialImage(
  injuryCode: string,
  recordId: string,
): ImageMetadata {
  const code = requireEditorialInjuryCode(injuryCode);
  return caseImages[code][editorialCaseVariant(recordId)];
}

export function injuryOverviewEditorialImage(
  injuryCode: string,
): ImageMetadata {
  return overviewImages[requireEditorialInjuryCode(injuryCode)];
}

export interface LicensedPlayerPhotoSelection {
  kind: "licensed-player-photo";
  image: ImageMetadata;
  variant: null;
  athleteName: string;
  focalPosition: PlayerPhotoSelectionV7["focalPosition"];
  nonEventCaption: PlayerPhotoSelectionV7["nonEventCaption"];
  attribution: {
    alterationDisclosure: string;
    commonsDescriptionUrl: string;
    license: PlayerPhotoSelectionV7["license"];
    nonClearanceStatement: string;
    policyVersion: "nba-v7" | "nba-v8";
    photographer: string;
    rightsAttribution: PlayerPhotoSelectionV7["rightsAttribution"];
    sourceRevision: PlayerPhotoSelectionV7["sourceRevision"];
    sourceRiskCategory: "non-event-low-risk" | null;
    usePolicyMode:
      | "legacy-v7-placement"
      | "ordinary-attributed-placement"
      | "placement-rendition-only"
      | "public-domain-placement";
  };
}

export interface InjuryThemeImageSelection {
  kind: "injury-theme";
  image: ImageMetadata;
  variant: number;
  focalPosition: { xPercent: 50; yPercent: 50 };
}

export type CaseImageSelection =
  LicensedPlayerPhotoSelection | InjuryThemeImageSelection;

/**
 * Resolves an immutable case ID to its governed local named cover. Unknown
 * fixture IDs retain the stable injury-theme fallback. A registered case must
 * supply the matching rendered athlete identity or rendering fails closed.
 */
export function caseImageFor(
  injuryCode: string,
  recordId: string,
  athleteName?: string,
): CaseImageSelection {
  const code = requireEditorialInjuryCode(injuryCode);
  const registered = registeredCoverByCaseId.get(recordId);
  if (registered !== undefined) {
    if (athleteName !== registered.asset.athleteName) {
      throw new Error(
        `Named-cover athlete mismatch for ${recordId}: expected ${registered.asset.athleteName}, received ${athleteName ?? "missing athlete"}`,
      );
    }
    let nonClearanceStatement: string;
    let policyVersion: "nba-v7" | "nba-v8";
    let sourceRiskCategory: "non-event-low-risk" | null;
    let usePolicyMode: LicensedPlayerPhotoSelection["attribution"]["usePolicyMode"];
    if (isDecision15PhotoSelectionV7(registered.asset)) {
      nonClearanceStatement =
        registered.asset.decision15Evidence.nonClearanceStatement;
      policyVersion = "nba-v8";
      sourceRiskCategory = null;
      usePolicyMode = registered.asset.usePolicy.mode;
    } else {
      nonClearanceStatement =
        registered.asset.sourceRiskClassification.nonClearanceStatement;
      policyVersion = "nba-v7";
      sourceRiskCategory = registered.asset.sourceRiskClassification.category;
      usePolicyMode = "legacy-v7-placement";
    }
    return {
      kind: "licensed-player-photo",
      image: registered.image as ImageMetadata,
      variant: null,
      athleteName: registered.asset.athleteName,
      focalPosition: registered.asset.focalPosition,
      nonEventCaption: registered.asset.nonEventCaption,
      attribution: {
        alterationDisclosure:
          registered.asset.rightsAttribution.alterationState.disclosure,
        commonsDescriptionUrl: registered.asset.commonsDescriptionUrl,
        license: registered.asset.license,
        nonClearanceStatement,
        policyVersion,
        photographer: registered.asset.photographerIdentity.name,
        rightsAttribution: registered.asset.rightsAttribution,
        sourceRevision: registered.asset.sourceRevision,
        sourceRiskCategory,
        usePolicyMode,
      },
    };
  }
  const variant = editorialCaseVariant(recordId);
  return {
    kind: "injury-theme",
    image: caseImages[code][variant],
    variant: variant + 1,
    focalPosition: { xPercent: 50, yPercent: 50 },
  };
}

export const overviewImageFor = injuryOverviewEditorialImage;

/** Injury feature cards deliberately crop the first governed case cover. */
export function featureImageFor(injuryCode: string): ImageMetadata {
  return caseImages[requireEditorialInjuryCode(injuryCode)][0];
}
