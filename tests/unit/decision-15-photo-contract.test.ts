import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import {
  DECISION_15_ALLOWED_BY_SA_USE_KINDS,
  DECISION_15_FORBIDDEN_BY_SA_USE_KINDS,
  DECISION_15_NON_CLEARANCE_STATEMENT,
  DECISION_15_POLICY_BINDING,
  DECISION_15_PROTECTED_ATHLETES,
  DECISION_15_REGISTRY_V6_BINDING,
  DECISION_15_REMOVED_GATE_IDS,
  DECISION_15_RETAINED_GATE_IDS,
  DECISION_15_SUPPORTED_CC_LICENSES,
  DECISION_15_TARGET_ATHLETES,
  decideDecision15BySaUse,
  decideDecision15PhotoEligibility,
  validateDecision15ActiveEligibilityGateIds,
  validateDecision15PromotionAthlete,
  validateDecision15ProtectedCovers,
  validateDecision15RightsMarker,
  validateDecision15TargetRoster,
  type Decision15AdapterLicense,
  type Decision15EligibilityInput,
  type Decision15FlickrObservation,
  type Decision15PhotoCandidate,
  type Decision15RecordedFact,
  type Decision15RightsMarker,
} from "../../src/lib/contracts/decision-15-photo-contract";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ORIGINAL_BYTES = Buffer.from(
  "Decision 15 exact original fixture bytes",
  "utf8",
);
const COMMONS_PERMALINK =
  "https://commons.wikimedia.org/w/index.php?title=File%3ABrandon_Clarke.jpg&oldid=1244619086";

function issueCodes(issues: Array<{ code: string }>): string[] {
  return issues.map((entry) => entry.code);
}

function fact(
  sourceUrl: string,
  text: string | null = null,
): Decision15RecordedFact {
  return text === null
    ? { sourceUrl, status: "not-supplied", text: null }
    : { sourceUrl, status: "supplied", text };
}

function ccMarker(workPageUrl = COMMONS_PERMALINK): Decision15RightsMarker {
  return {
    alterationDisclosure:
      "Source crop recorded; local original uses a CSS presentation crop.",
    attributionCondition: "license-conditions-apply",
    copyrightNotice: fact(workPageUrl),
    displayedCredit: fact(workPageUrl, "Erik Drost"),
    disclaimerNotice: fact(workPageUrl),
    fulfillment: {
      alterationDisclosed: true,
      copyrightNoticeVisibleWhenSupplied: true,
      creditVisibleWhenSupplied: true,
      disclaimerNoticeVisibleWhenSupplied: true,
      fixedSourceEvidenceVisible: true,
      otherNoticeVisibleWhenSupplied: true,
      termsOrStatusLinkVisible: true,
      titleVisibleWhenSupplied: true,
    },
    licenseName: "CC BY 2.0",
    licenseVersion: "2.0",
    markerAppliesToExactWork: true,
    markerKind: "creative-commons-license",
    markerStatus: "explicit",
    otherNotice: fact(workPageUrl),
    rightsBucket: "cc-by",
    rightsLinkOrStatementSource: "https://creativecommons.org/licenses/by/2.0",
    statement: null,
    token: "cc-by-2.0",
    workPageUrl,
    workTitle: fact(workPageUrl, "Brandon Clarke"),
  };
}

function setMarkerWorkPage(
  marker: Decision15RightsMarker,
  workPageUrl: string,
): void {
  marker.workPageUrl = workPageUrl;
  for (const value of [
    marker.copyrightNotice,
    marker.displayedCredit,
    marker.disclaimerNotice,
    marker.otherNotice,
    marker.workTitle,
  ]) {
    value.sourceUrl = workPageUrl;
  }
}

function validCandidate(): Decision15PhotoCandidate {
  return {
    athleteName: "Brandon Clarke",
    caseIds: ["CASE-NBAACHILLES-2023-010"],
    crop: {
      adapterLicense: null,
      checkedAt: "2026-08-13",
      checkedBy: "decision-15-photo-review",
      focalPosition: { xPercent: 50, yPercent: 30 },
      localFileIsUnmodifiedOriginal: true,
      presentation: "css-object-fit-cover-crop",
      ratios: [
        { aspectRatio: "5:2", subjectSafe: true },
        { aspectRatio: "16:9", subjectSafe: true },
      ],
    },
    depictedAthleteName: "Brandon Clarke",
    identityEvidence:
      "The fixed Commons revision identifies Brandon Clarke in the image.",
    injuryEventRelationships: [
      {
        caseId: "CASE-NBAACHILLES-2023-010",
        evidence:
          "The 2022-01-04 source event predates and differs from the 2023-03-03 governed injury event.",
        status: "different-from-governed-injury-event-verified",
      },
    ],
    lineage: {
      policy: DECISION_15_POLICY_BINDING,
      predecessorRegistry: DECISION_15_REGISTRY_V6_BINDING,
    },
    nonClearanceStatement: DECISION_15_NON_CLEARANCE_STATEMENT,
    nonInjuryCaption: "球員資料照片；非本案例受傷當下影像",
    originalBinary: {
      downloadDate: "2026-08-13",
      localFile: {
        byteLength: ORIGINAL_BYTES.byteLength,
        height: 3000,
        mimeType: "image/jpeg",
        path: "src/assets/players/decision-15/brandon-clarke.jpg",
        sha256: sha256Hex(ORIGINAL_BYTES),
        width: 1892,
      },
      original: {
        byteLength: ORIGINAL_BYTES.byteLength,
        filenameOrPlatformAssetId: "Brandon_Clarke.jpg",
        height: 3000,
        mimeType: "image/jpeg",
        retrievalIdentity:
          "https://upload.wikimedia.org/wikipedia/commons/5/58/Brandon_Clarke.jpg",
        width: 1892,
      },
      retrievalKind: "original-binary",
    },
    removedGateObservations: {
      accountControl: "not-established",
      ambiguousCredentialedCourtContext: "yes",
      disputeSearch: "not-performed",
      licensingAuthority: "not-established",
      namedPhotographerAllowlist: "no-match",
      occasion: "closed-practice",
      photographerIdentity: "not-verified",
      selfPublication: "not-established",
      washingSignals: "unresolved",
    },
    rightsMarker: ccMarker(),
    sourceEvidence: {
      checkedAt: "2026-08-13",
      checkedBy: "decision-15-photo-review",
      descriptionUrl:
        "https://commons.wikimedia.org/wiki/File:Brandon_Clarke.jpg",
      originalFileUrl:
        "https://upload.wikimedia.org/wikipedia/commons/5/58/Brandon_Clarke.jpg",
      platform: "wikimedia-commons",
      revisionId: 1244619086,
      revisionPermalink: COMMONS_PERMALINK,
      revisionTimestamp: "2026-07-07T04:40:33Z",
    },
    supersession: {
      previousLocalFilePath:
        "src/assets/players/decision-13/brandon-clarke.svg",
      previousLocalFileSha256: "c".repeat(64),
      reason: "replaces-current-svg-after-v8-qualification",
    },
  };
}

function validCommonsInput(): Decision15EligibilityInput {
  return {
    candidate: validCandidate(),
    expectedCaseIds: ["CASE-NBAACHILLES-2023-010"],
    localAssetBytes: ORIGINAL_BYTES,
  };
}

function validPdNavyInput(): Decision15EligibilityInput {
  const input = validCommonsInput();
  const candidate = input.candidate;
  const permalink =
    "https://commons.wikimedia.org/w/index.php?title=File%3ADejounte_Murray_Tours_the_METC.jpg&oldid=1199576196";
  candidate.athleteName = "Dejounte Murray";
  candidate.depictedAthleteName = "Dejounte Murray";
  candidate.caseIds = ["CASE-NBAACHILLES-2025-014"];
  candidate.injuryEventRelationships = [
    {
      caseId: "CASE-NBAACHILLES-2025-014",
      evidence:
        "The February 2019 METC tour differs from the 2025-01-31 governed injury.",
      status: "different-from-governed-injury-event-verified",
    },
  ];
  input.expectedCaseIds = ["CASE-NBAACHILLES-2025-014"];
  setMarkerWorkPage(candidate.rightsMarker, permalink);
  Object.assign(candidate.rightsMarker, {
    attributionCondition: null,
    licenseName: null,
    licenseVersion: null,
    markerKind: "united-states-government-work-statement",
    rightsBucket: "public-domain",
    rightsLinkOrStatementSource:
      "https://www.dvidshub.net/image/5148235/dejounte-murray-tours-metc",
    statement:
      "This image is a work of a U.S. Navy sailor made as part of official duties.",
    token: "PD-USGov-Military-Navy",
  });
  candidate.rightsMarker.displayedCredit = fact(
    permalink,
    "U.S. Navy photo by Mass Communication Specialist 2nd Class Shayla D. Hamilton/Released",
  );
  candidate.rightsMarker.workTitle = fact(
    permalink,
    "Dejounte Murray Tours the METC",
  );
  if (candidate.sourceEvidence.platform !== "wikimedia-commons") {
    throw new Error("fixture");
  }
  Object.assign(candidate.sourceEvidence, {
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Dejounte_Murray_Tours_the_METC.jpg",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/7/79/Dejounte_Murray_Tours_the_METC.jpg",
    revisionId: 1199576196,
    revisionPermalink: permalink,
    revisionTimestamp: "2026-04-18T14:52:21Z",
  });
  candidate.originalBinary.original.retrievalIdentity =
    candidate.sourceEvidence.originalFileUrl;
  candidate.originalBinary.localFile.path =
    "src/assets/players/decision-15/dejounte-murray.jpg";
  return input;
}

function validFlickrInput(): Decision15EligibilityInput {
  const input = validCommonsInput();
  const pageUrl = "https://www.flickr.com/photos/example/51814063744/";
  const observation: Decision15FlickrObservation = {
    displayedCreditTitleAndNoticesRecorded: true,
    displayedRightsLinkOrStatementSource:
      "https://creativecommons.org/licenses/by/2.0",
    displayedRightsMarker: "cc-by-2.0",
    observedAt: "2026-08-13T12:00:00Z",
    observedBy: "decision-15-photo-review",
    originalRetrievalIdentity:
      "https://live.staticflickr.com/example/51814063744_original.jpg",
    pageUrl,
    photoId: "51814063744",
  };
  const evidenceBytes = canonicalJson(observation);
  setMarkerWorkPage(input.candidate.rightsMarker, pageUrl);
  input.candidate.sourceEvidence = {
    evidenceRecordPath:
      "docs/reviews/evidence/decision-15/flickr-brandon-clarke.v1.json",
    evidenceRecordSha256: sha256Hex(evidenceBytes),
    frozenObservation: observation,
    frozenObservationClaimedAsSourceNativeRevision: false,
    platform: "flickr",
  };
  input.candidate.originalBinary.original.retrievalIdentity =
    observation.originalRetrievalIdentity;
  input.flickrEvidenceRecordBytes = evidenceBytes;
  return input;
}

function bySaAdapter(version: "2.0" | "3.0" | "4.0" = "4.0") {
  return {
    name: `CC BY-SA ${version}`,
    scope: "crop-contribution-only",
    token: `cc-by-sa-${version}`,
    url: `https://creativecommons.org/licenses/by-sa/${version}`,
  } as Decision15AdapterLicense;
}

describe("Decision 15 closed-world baseline", () => {
  it("freezes exactly 14 targets and rejects promotion of all seven protected photos", () => {
    expect(validateDecision15TargetRoster(DECISION_15_TARGET_ATHLETES)).toEqual(
      [],
    );
    expect(DECISION_15_TARGET_ATHLETES).toHaveLength(14);
    expect(DECISION_15_PROTECTED_ATHLETES).toHaveLength(7);
    expect(validateDecision15PromotionAthlete("Anfernee Simons")).toEqual([]);
    for (const athlete of DECISION_15_PROTECTED_ATHLETES) {
      expect(issueCodes(validateDecision15PromotionAthlete(athlete))).toContain(
        "decision15-outside-target-promotion",
      );
    }
  });

  it("rejects missing, extra, and duplicate target rosters", () => {
    for (const roster of [
      DECISION_15_TARGET_ATHLETES.slice(1),
      [...DECISION_15_TARGET_ATHLETES, "Damian Lillard"],
      [...DECISION_15_TARGET_ATHLETES, DECISION_15_TARGET_ATHLETES[0]],
    ]) {
      expect(issueCodes(validateDecision15TargetRoster(roster))).toContain(
        "decision15-target-roster",
      );
    }
  });

  it("derives and binds all seven exact v6 selection and asset hashes", () => {
    const registry = JSON.parse(
      readFileSync(
        join(ROOT, "src/assets/players/player-photo-registry.v6.json"),
        "utf8",
      ),
    ) as {
      selections: Array<{
        athleteName: string;
        coverKind: string;
        localFile: { path: string };
      }>;
    };
    const derived = registry.selections
      .filter((selection) => selection.coverKind === "commons-photo")
      .map((selection) => ({
        athleteName: selection.athleteName,
        localAssetSha256: sha256Hex(
          readFileSync(join(ROOT, selection.localFile.path)),
        ),
        selectionSha256: sha256Hex(canonicalJson(selection)),
      }));
    expect(validateDecision15ProtectedCovers(derived)).toEqual([]);

    derived[0]!.selectionSha256 = "0".repeat(64);
    expect(issueCodes(validateDecision15ProtectedCovers(derived))).toContain(
      "decision15-protected-cover-drift",
    );
  });
});

describe("Decision 15 retained eligibility gates", () => {
  it("accepts a complete Commons CC candidate despite every removed-gate observation", () => {
    expect(decideDecision15PhotoEligibility(validCommonsInput())).toEqual({
      issues: [],
      outcome: "eligible-photo",
      reasons: ["all-retained-nba-v8-gates-pass"],
    });
  });

  it.each(DECISION_15_SUPPORTED_CC_LICENSES)(
    "accepts the exact $token rights tuple",
    (license) => {
      const marker = ccMarker();
      Object.assign(marker, {
        licenseName: license.name,
        licenseVersion: license.version,
        rightsBucket: license.bucket,
        rightsLinkOrStatementSource: license.url,
        token: license.token,
      });
      expect(validateDecision15RightsMarker(marker)).toEqual([]);
    },
  );

  it("accepts PD-USGov-Military-Navy in the distinct public-domain bucket", () => {
    const result = decideDecision15PhotoEligibility(validPdNavyInput());
    expect(result.outcome).toBe("eligible-photo");
    expect(result.issues).toEqual([]);
  });

  it.each([
    ["All Rights Reserved", "all-rights-reserved", null, null],
    ["missing marker", "missing", null, null],
    [
      "CC BY-NC",
      "explicit",
      "cc-by-nc-2.0",
      "https://creativecommons.org/licenses/by-nc/2.0/",
    ],
    [
      "CC BY-ND",
      "explicit",
      "cc-by-nd-4.0",
      "https://creativecommons.org/licenses/by-nd/4.0/",
    ],
  ] as const)("rejects %s", (_label, status, token, url) => {
    const input = validCommonsInput();
    input.candidate.rightsMarker.markerStatus = status;
    input.candidate.rightsMarker.token = token;
    input.candidate.rightsMarker.rightsLinkOrStatementSource = url;
    expect(decideDecision15PhotoEligibility(input).outcome).toBe(
      "retain-current-svg",
    );
  });

  it("rejects a marker belonging to the wrong work", () => {
    const input = validCommonsInput();
    input.candidate.rightsMarker.markerAppliesToExactWork = false;
    expect(decideDecision15PhotoEligibility(input).reasons).toContain(
      "decision15-explicit-rights-marker",
    );

    const sourceMismatch = validCommonsInput();
    sourceMismatch.candidate.rightsMarker.workPageUrl =
      "https://commons.wikimedia.org/w/index.php?title=File%3AOther.jpg&oldid=1";
    expect(decideDecision15PhotoEligibility(sourceMismatch).reasons).toContain(
      "decision15-rights-source-work-mismatch",
    );
  });

  it("requires an exact Commons oldid permalink and original-file identity", () => {
    const input = validCommonsInput();
    if (input.candidate.sourceEvidence.platform !== "wikimedia-commons") {
      throw new Error("fixture");
    }
    input.candidate.sourceEvidence.revisionId = 7;
    expect(decideDecision15PhotoEligibility(input).reasons).toContain(
      "decision15-commons-fixed-evidence",
    );

    const thumbnail = validCommonsInput();
    thumbnail.candidate.originalBinary.retrievalKind = "thumbnail";
    expect(decideDecision15PhotoEligibility(thumbnail).reasons).toContain(
      "decision15-original-binary-facts",
    );
  });

  it("accepts canonical Flickr evidence and rejects native-revision claims or byte drift", () => {
    expect(decideDecision15PhotoEligibility(validFlickrInput()).issues).toEqual(
      [],
    );

    const nativeClaim = validFlickrInput();
    if (nativeClaim.candidate.sourceEvidence.platform !== "flickr") {
      throw new Error("fixture");
    }
    (
      nativeClaim.candidate.sourceEvidence as unknown as {
        frozenObservationClaimedAsSourceNativeRevision: boolean;
      }
    ).frozenObservationClaimedAsSourceNativeRevision = true;
    expect(decideDecision15PhotoEligibility(nativeClaim).reasons).toContain(
      "decision15-flickr-fixed-evidence",
    );

    const drift = validFlickrInput();
    drift.flickrEvidenceRecordBytes += "\n";
    expect(decideDecision15PhotoEligibility(drift).reasons).toContain(
      "decision15-flickr-evidence-bytes",
    );
  });

  it("rejects local-byte drift, wrong athlete/case mapping, and missing non-clearance", () => {
    const bytes = validCommonsInput();
    bytes.localAssetBytes = Buffer.concat([ORIGINAL_BYTES, Buffer.from([0])]);
    expect(decideDecision15PhotoEligibility(bytes).reasons).toContain(
      "decision15-local-original-binary",
    );

    const mapping = validCommonsInput();
    mapping.candidate.depictedAthleteName = "Ja Morant";
    expect(decideDecision15PhotoEligibility(mapping).reasons).toContain(
      "decision15-athlete-case-mapping",
    );

    const clearance = validCommonsInput();
    clearance.candidate.nonClearanceStatement = "rights-cleared";
    expect(decideDecision15PhotoEligibility(clearance).reasons).toContain(
      "decision15-non-clearance",
    );
  });

  it.each(["same-governed-injury-event", "unresolved"] as const)(
    "rejects a %s injury relationship",
    (status) => {
      const input = validCommonsInput();
      input.candidate.injuryEventRelationships[0]!.status = status;
      expect(decideDecision15PhotoEligibility(input).reasons).toContain(
        "decision15-different-injury-event",
      );
    },
  );

  it("does not activate removed gates and mechanically rejects reintroducing one", () => {
    expect(
      validateDecision15ActiveEligibilityGateIds(DECISION_15_RETAINED_GATE_IDS),
    ).toEqual([]);
    expect(
      issueCodes(
        validateDecision15ActiveEligibilityGateIds(
          DECISION_15_REMOVED_GATE_IDS,
        ),
      ),
    ).toEqual(
      Array.from(
        { length: DECISION_15_REMOVED_GATE_IDS.length },
        () => "decision15-removed-gate-active",
      ),
    );
  });
});

describe("Decision 15 CC BY-SA composition firewall", () => {
  const base = {
    adapterLicense: bySaAdapter(),
    bakedOutput: false,
    licenseName: "CC BY-SA 4.0",
    licenseToken: "cc-by-sa-4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    siteComposed: false,
  } as const;

  it.each(DECISION_15_ALLOWED_BY_SA_USE_KINDS)(
    "allows %s with a same-version crop-only Adapter's License",
    (useKind) => {
      expect(decideDecision15BySaUse({ ...base, useKind })).toEqual({
        allowed: true,
        reasons: [],
      });
    },
  );

  it.each(DECISION_15_FORBIDDEN_BY_SA_USE_KINDS)(
    "rejects baked/composed %s use",
    (useKind) => {
      const result = decideDecision15BySaUse({
        ...base,
        bakedOutput: true,
        siteComposed: true,
        useKind,
      });
      expect(result.allowed).toBe(false);
      expect(result.reasons).toContain(
        "cc-by-sa-site-composed-or-baked-output-forbidden",
      );
    },
  );

  it("rejects an equivalent baked name, a wrong version, and an unscoped Adapter's License", () => {
    expect(
      decideDecision15BySaUse({
        ...base,
        useKind: "player-hero-baked-design",
      }).reasons,
    ).toContain("cc-by-sa-site-composed-or-baked-output-forbidden");

    expect(
      decideDecision15BySaUse({
        ...base,
        adapterLicense: bySaAdapter("3.0"),
        useKind: "ordinary-html-css-placement",
      }).reasons,
    ).toContain("adapter-license-not-same-version-crop-only");

    expect(
      decideDecision15BySaUse({
        ...base,
        adapterLicense: {
          ...bySaAdapter(),
          scope: "unscoped-document",
        },
        useKind: "ordinary-responsive-rendition",
      }).reasons,
    ).toContain("adapter-license-not-same-version-crop-only");
  });
});
