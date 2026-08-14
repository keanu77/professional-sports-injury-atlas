import type { ImageMetadata } from "astro";

import playerPhotoRegistryJson from "../../assets/players/player-photo-registry.v8.json";
import {
  isDecision16RenditionSelectionV8,
  type PlayerPhotoRegistryV8,
  type PlayerPhotoSelectionV8,
} from "../contracts/player-photo-registry-v8";
import { isDecision15PhotoSelectionV7 } from "../contracts/player-photo-registry-v7";

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
import cjMcCollumCover from "../../assets/players/decision-13/cj-mccollum.jpg";
import dwightPowellCover from "../../assets/players/decision-13/dwight-powell.jpg";
import kevinDurantCover from "../../assets/players/decision-13/kevin-durant.jpg";
import kyrieIrvingCover from "../../assets/players/decision-13/kyrie-irving.jpg";
import leBronJamesCover from "../../assets/players/decision-13/lebron-james.jpg";
import damianLillardCover from "../../assets/players/decision-14/damian-lillard.jpg";
import jaysonTatumCover from "../../assets/players/decision-14/jayson-tatum.jpg";
import anferneeSimonsCover from "../../assets/players/decision-15/anfernee-simons.jpg";
import anthonyEdwardsCover from "../../assets/players/decision-15/anthony-edwards.jpg";
import brandonClarkeCover from "../../assets/players/decision-15/brandon-clarke.jpg";
import dannyGreenCover from "../../assets/players/decision-15/danny-green.jpg";
import dejounteMurrayCover from "../../assets/players/decision-15/dejounte-murray.jpg";
import jaMorantCover from "../../assets/players/decision-15/ja-morant.jpg";
import joeInglesCover from "../../assets/players/decision-15/joe-ingles.jpg";
import lameloBallCover from "../../assets/players/decision-15/lamelo-ball.jpg";
import markelleFultzCover from "../../assets/players/decision-15/markelle-fultz.jpg";
import moritzWagnerCover from "../../assets/players/decision-15/moritz-wagner.jpg";
import rickyRubioCover from "../../assets/players/decision-15/ricky-rubio.jpg";
import thomasBryantCover from "../../assets/players/decision-15/thomas-bryant.jpg";
import tyreseHaliburtonCover from "../../assets/players/decision-15/tyrese-haliburton.jpg";
import traeYoungCover from "../../assets/players/decision-16/trae-young.jpg";

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

/** Exact current-cover projection: historical Trae originals are evidence, not build inputs. */
export const currentPlayerPhotoAssetProjection: Readonly<
  Record<string, NamedCoverImage>
> = Object.freeze({
  "src/assets/players/decision-13/cj-mccollum.jpg": cjMcCollumCover,
  "src/assets/players/decision-13/dwight-powell.jpg": dwightPowellCover,
  "src/assets/players/decision-13/kevin-durant.jpg": kevinDurantCover,
  "src/assets/players/decision-13/kyrie-irving.jpg": kyrieIrvingCover,
  "src/assets/players/decision-13/lebron-james.jpg": leBronJamesCover,
  "src/assets/players/decision-14/damian-lillard.jpg": damianLillardCover,
  "src/assets/players/decision-14/jayson-tatum.jpg": jaysonTatumCover,
  "src/assets/players/decision-15/anfernee-simons.jpg": anferneeSimonsCover,
  "src/assets/players/decision-15/anthony-edwards.jpg": anthonyEdwardsCover,
  "src/assets/players/decision-15/brandon-clarke.jpg": brandonClarkeCover,
  "src/assets/players/decision-15/danny-green.jpg": dannyGreenCover,
  "src/assets/players/decision-15/dejounte-murray.jpg": dejounteMurrayCover,
  "src/assets/players/decision-15/ja-morant.jpg": jaMorantCover,
  "src/assets/players/decision-15/joe-ingles.jpg": joeInglesCover,
  "src/assets/players/decision-15/lamelo-ball.jpg": lameloBallCover,
  "src/assets/players/decision-15/markelle-fultz.jpg": markelleFultzCover,
  "src/assets/players/decision-15/moritz-wagner.jpg": moritzWagnerCover,
  "src/assets/players/decision-15/ricky-rubio.jpg": rickyRubioCover,
  "src/assets/players/decision-15/thomas-bryant.jpg": thomasBryantCover,
  "src/assets/players/decision-15/tyrese-haliburton.jpg": tyreseHaliburtonCover,
  "src/assets/players/decision-16/trae-young.jpg": traeYoungCover,
});

export const playerPhotoRegistry =
  playerPhotoRegistryJson as PlayerPhotoRegistryV8;

interface RegisteredPlayerCover {
  asset: PlayerPhotoSelectionV8;
  image: NamedCoverImage;
}

const registeredCoverByCaseId = new Map<string, RegisteredPlayerCover>();
for (const asset of playerPhotoRegistry.selections) {
  const image = currentPlayerPhotoAssetProjection[asset.localFile.path];
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
  focalPosition: PlayerPhotoSelectionV8["focalPosition"];
  nonEventCaption: PlayerPhotoSelectionV8["nonEventCaption"];
  attribution: {
    commonsDescriptionUrl: string;
    license: PlayerPhotoSelectionV8["license"];
    localRenditionChangeDisclosure: string | null;
    nonClearanceStatement: string;
    policyVersion: "nba-v7" | "nba-v8" | "nba-v9";
    photographer: string;
    rightsAttribution: PlayerPhotoSelectionV8["rightsAttribution"];
    sourceRevision: PlayerPhotoSelectionV8["sourceRevision"];
    sourceRiskCategory: "non-event-low-risk" | null;
    upstreamAlterationDisclosure: string;
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
    let localRenditionChangeDisclosure: string | null = null;
    let nonClearanceStatement: string;
    let policyVersion: "nba-v7" | "nba-v8" | "nba-v9";
    let sourceRiskCategory: "non-event-low-risk" | null;
    let usePolicyMode: LicensedPlayerPhotoSelection["attribution"]["usePolicyMode"];
    if (isDecision16RenditionSelectionV8(registered.asset)) {
      localRenditionChangeDisclosure =
        registered.asset.decision16Rendition.localRendition.changeDisclosure;
      nonClearanceStatement =
        registered.asset.decision16Rendition.nonClearanceStatement;
      policyVersion = "nba-v9";
      sourceRiskCategory = null;
      usePolicyMode = registered.asset.usePolicy.mode;
    } else if (isDecision15PhotoSelectionV7(registered.asset)) {
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
        commonsDescriptionUrl: registered.asset.commonsDescriptionUrl,
        license: registered.asset.license,
        localRenditionChangeDisclosure,
        nonClearanceStatement,
        policyVersion,
        photographer: registered.asset.photographerIdentity.name,
        rightsAttribution: registered.asset.rightsAttribution,
        sourceRevision: registered.asset.sourceRevision,
        sourceRiskCategory,
        upstreamAlterationDisclosure:
          registered.asset.rightsAttribution.alterationState.disclosure,
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
