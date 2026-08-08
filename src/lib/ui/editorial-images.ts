import type { ImageMetadata } from "astro";

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

/** Hero/card-friendly resolver that returns both the selected asset and 1-based variant. */
export function caseImageFor(
  injuryCode: string,
  recordId: string,
): { image: ImageMetadata; variant: number } {
  const variant = editorialCaseVariant(recordId);
  return {
    image: caseImages[requireEditorialInjuryCode(injuryCode)][variant],
    variant: variant + 1,
  };
}

export const overviewImageFor = injuryOverviewEditorialImage;

/** Injury feature cards deliberately crop the first governed case cover. */
export function featureImageFor(injuryCode: string): ImageMetadata {
  return caseImages[requireEditorialInjuryCode(injuryCode)][0];
}
