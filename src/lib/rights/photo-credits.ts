import registryJson from "../../assets/players/player-photo-registry.v5.json";
import type {
  PlayerPhotoCommonsSelectionV5,
  PlayerPhotoRegistryV5,
  PlayerPhotoSelectionV5,
} from "../contracts/player-photo-registry-v5";

export const ASSET_CREDITS_ROUTE = "/credits-notices/" as const;

const registry = registryJson as unknown as PlayerPhotoRegistryV5;

function isCommonsPhoto(
  selection: PlayerPhotoSelectionV5,
): selection is PlayerPhotoCommonsSelectionV5 {
  return selection.coverKind === "commons-photo";
}

export function assetCreditAnchor(sourceRevisionId: number): string {
  if (!Number.isSafeInteger(sourceRevisionId) || sourceRevisionId <= 0) {
    throw new Error(`invalid Commons source revision ID ${sourceRevisionId}`);
  }
  return `photo-credit-${sourceRevisionId}`;
}

export function assetCreditHref(sourceRevisionId: number): string {
  return `${ASSET_CREDITS_ROUTE}#${assetCreditAnchor(sourceRevisionId)}`;
}

export interface PhotoCreditPresentation {
  anchorId: string;
  bucketLabel: string;
  creatorLabel: "創作者" | "攝影";
  selection: PlayerPhotoCommonsSelectionV5;
  workTitleText: string | null;
}

/**
 * Normalizes a governed Commons selection for both the central renderer and
 * unit tests. The adapter-license rules fail closed so BY, BY-SA, and CC0 can
 * never silently share the wrong attribution template.
 */
export function photoCreditPresentation(
  selection: PlayerPhotoCommonsSelectionV5,
): PhotoCreditPresentation {
  const bucket = selection.rightsAttribution.licenseBucket;
  const adapterLicense = selection.rightsAttribution.adapterLicense;
  if (bucket === "cc-by-sa" && adapterLicense === null) {
    throw new Error(
      `CC BY-SA photo ${selection.athleteName} is missing its Adapter's License`,
    );
  }
  if (bucket !== "cc-by-sa" && adapterLicense !== null) {
    throw new Error(
      `${bucket} photo ${selection.athleteName} must not declare an Adapter's License`,
    );
  }

  const workTitle = selection.rightsAttribution.workTitle;
  if (
    (workTitle.status === "supplied" && workTitle.text === null) ||
    (workTitle.status === "not-supplied" && workTitle.text !== null)
  ) {
    throw new Error(
      `inconsistent work-title state for ${selection.athleteName}`,
    );
  }

  const bucketLabels = {
    "cc-by": "姓名標示（CC BY）",
    "cc-by-sa": "姓名標示—相同方式分享（CC BY-SA）",
    cc0: "公眾領域貢獻（CC0）",
  } as const;

  return {
    anchorId: assetCreditAnchor(selection.sourceRevision.id),
    bucketLabel: bucketLabels[bucket],
    creatorLabel: bucket === "cc0" ? "創作者" : "攝影",
    selection,
    workTitleText: workTitle.text,
  };
}

export const currentPhotoCredits = registry.selections
  .filter(isCommonsPhoto)
  .map(photoCreditPresentation);
