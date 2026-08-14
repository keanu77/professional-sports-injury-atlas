import registryJson from "../../assets/players/player-photo-registry.v8.json";
import {
  isDecision15PhotoSelectionV7,
  type PlayerPhotoDecision15SelectionV7,
  type PlayerPhotoNoticeV7,
  type PlayerPhotoSelectionV7,
} from "../contracts/player-photo-registry-v7";
import {
  isDecision16RenditionSelectionV8,
  type PlayerPhotoDecision16SelectionV8,
  type PlayerPhotoRegistryV8,
  type PlayerPhotoSelectionV8,
} from "../contracts/player-photo-registry-v8";

export const ASSET_CREDITS_ROUTE = "/credits-notices/" as const;

const registry = registryJson as unknown as PlayerPhotoRegistryV8;

export function assetCreditAnchor(sourceRevisionId: number): string {
  if (!Number.isSafeInteger(sourceRevisionId) || sourceRevisionId <= 0) {
    throw new Error(`invalid Commons source revision ID ${sourceRevisionId}`);
  }
  return `photo-credit-${sourceRevisionId}`;
}

export function assetCreditHref(sourceRevisionId: number): string {
  return `${ASSET_CREDITS_ROUTE}#${assetCreditAnchor(sourceRevisionId)}`;
}

export interface PhotoCreditNoticePresentation {
  sourceUrl: string | null;
  status: "not-supplied" | "supplied";
  text: string | null;
}

export interface PhotoCreditPresentation {
  anchorId: string;
  bucketLabel: string;
  creatorLabel: "署名";
  creditText: string;
  injuryRelationshipEvidence: string[];
  license: {
    isPublicDomain: boolean;
    name: string;
    token: string;
    url: string;
  };
  localRenditionChangeDisclosure: string | null;
  nonClearanceStatement: string;
  notices: {
    copyright: PhotoCreditNoticePresentation;
    disclaimer: PhotoCreditNoticePresentation;
    other: PhotoCreditNoticePresentation;
  };
  policyVersion: "nba-v7" | "nba-v8" | "nba-v9";
  selection: PlayerPhotoSelectionV8;
  sourceRiskCategory: "non-event-low-risk" | null;
  uploaderText: string | null;
  upstreamAlterationDisclosure: string;
  workTitleEvidenceUrl: string;
  workTitleText: string | null;
}

function legacyNotice(
  notice: Exclude<
    PlayerPhotoSelectionV7,
    { decision15Evidence: unknown }
  >["rightsAttribution"][
    "copyrightNotice" | "disclaimerNotice" | "otherPerFileNotice"],
): PhotoCreditNoticePresentation {
  return {
    sourceUrl: notice.url,
    status: notice.status,
    text: notice.text,
  };
}

function decision15Notice(
  notice: PlayerPhotoNoticeV7,
): PhotoCreditNoticePresentation {
  return {
    sourceUrl: notice.sourceUrl,
    status: notice.status,
    text: notice.text,
  };
}

type Decision15CompatibleSelection =
  PlayerPhotoDecision15SelectionV7 | PlayerPhotoDecision16SelectionV8;

function decision15CompatiblePresentation(
  selection: Decision15CompatibleSelection,
  decisionLabel: "Decision 15" | "Decision 16",
  policyVersion: "nba-v8" | "nba-v9",
  localRenditionChangeDisclosure: string | null,
): PhotoCreditPresentation {
  const bucket = selection.rightsAttribution.licenseBucket;
  const workTitle = selection.rightsAttribution.workTitle;
  if (
    (workTitle.status === "supplied" && workTitle.text === null) ||
    (workTitle.status === "not-supplied" && workTitle.text !== null)
  ) {
    throw new Error(
      `inconsistent work-title state for ${selection.athleteName}`,
    );
  }
  const marker = selection.decision15Evidence.rightsMarker;
  const displayedCredit = marker.displayedCredit;
  if (displayedCredit.status !== "supplied" || displayedCredit.text === null) {
    throw new Error(
      `${decisionLabel} photo ${selection.athleteName} is missing its displayed credit`,
    );
  }
  if (marker.rightsBucket === "public-domain") {
    if (
      selection.license !== null ||
      marker.token === null ||
      marker.statement === null ||
      marker.rightsLinkOrStatementSource === null ||
      marker.licenseName !== null ||
      marker.licenseVersion !== null
    ) {
      throw new Error(
        `public-domain photo ${selection.athleteName} must retain an exact status marker without CC fields`,
      );
    }
  } else if (
    selection.license === null ||
    marker.token === null ||
    marker.licenseName === null ||
    marker.rightsLinkOrStatementSource === null
  ) {
    throw new Error(
      `CC photo ${selection.athleteName} is missing exact license facts`,
    );
  }

  return {
    anchorId: assetCreditAnchor(selection.sourceRevision.id),
    bucketLabel:
      bucket === "cc-by"
        ? "姓名標示（CC BY）"
        : bucket === "cc-by-sa"
          ? "姓名標示—相同方式分享（CC BY-SA）"
          : "公有領域（美國政府作品標示）",
    creatorLabel: "署名",
    creditText: displayedCredit.text,
    injuryRelationshipEvidence:
      selection.decision15Evidence.injuryEventRelationships.map(
        ({ evidence }) => evidence,
      ),
    license: {
      isPublicDomain: bucket === "public-domain",
      name:
        bucket === "public-domain"
          ? marker.statement!
          : selection.license!.name!,
      token: marker.token!,
      url: marker.rightsLinkOrStatementSource!,
    },
    localRenditionChangeDisclosure,
    nonClearanceStatement: selection.decision15Evidence.nonClearanceStatement,
    notices: {
      copyright: decision15Notice(selection.rightsAttribution.copyrightNotice),
      disclaimer: decision15Notice(
        selection.rightsAttribution.disclaimerNotice,
      ),
      other: decision15Notice(selection.rightsAttribution.otherPerFileNotice),
    },
    policyVersion,
    selection,
    sourceRiskCategory: null,
    uploaderText: null,
    upstreamAlterationDisclosure:
      selection.rightsAttribution.alterationState.disclosure,
    workTitleEvidenceUrl: workTitle.sourceUrl,
    workTitleText: workTitle.text,
  };
}

/**
 * Normalizes protected legacy, Decision 15, and Decision 16 selections for one
 * central, no-JavaScript attribution surface. Public domain is deliberately
 * separate from CC0 and never receives a fabricated license name or version.
 */
export function photoCreditPresentation(
  selection: PlayerPhotoSelectionV8,
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

  if (isDecision16RenditionSelectionV8(selection)) {
    return decision15CompatiblePresentation(
      selection,
      "Decision 16",
      "nba-v9",
      selection.decision16Rendition.localRendition.changeDisclosure,
    );
  }
  if (isDecision15PhotoSelectionV7(selection)) {
    return decision15CompatiblePresentation(
      selection,
      "Decision 15",
      "nba-v8",
      null,
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
  const legacyBucket = selection.rightsAttribution.licenseBucket;
  const bucketLabels = {
    "cc-by": "姓名標示（CC BY）",
    "cc-by-sa": "姓名標示—相同方式分享（CC BY-SA）",
    cc0: "公眾領域貢獻（CC0）",
  } as const;

  return {
    anchorId: assetCreditAnchor(selection.sourceRevision.id),
    bucketLabel: bucketLabels[legacyBucket],
    creatorLabel: "署名",
    creditText: selection.photographerIdentity.name,
    injuryRelationshipEvidence: [selection.occasionEvidence.basis],
    license: {
      isPublicDomain: false,
      name: selection.license.name,
      token: selection.license.token,
      url: selection.license.url,
    },
    localRenditionChangeDisclosure: null,
    nonClearanceStatement:
      selection.sourceRiskClassification.nonClearanceStatement,
    notices: {
      copyright: legacyNotice(selection.rightsAttribution.copyrightNotice),
      disclaimer: legacyNotice(selection.rightsAttribution.disclaimerNotice),
      other: legacyNotice(selection.rightsAttribution.otherPerFileNotice),
    },
    policyVersion: "nba-v7",
    selection,
    sourceRiskCategory: selection.sourceRiskClassification.category,
    uploaderText: `${selection.uploaderIdentity.name}；${selection.uploaderIdentity.relationshipToPhotographer}`,
    upstreamAlterationDisclosure:
      selection.rightsAttribution.alterationState.disclosure,
    workTitleEvidenceUrl: workTitle.evidenceUrl,
    workTitleText: workTitle.text,
  };
}

export const currentPhotoCredits = registry.selections.map(
  photoCreditPresentation,
);
