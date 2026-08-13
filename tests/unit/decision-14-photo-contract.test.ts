import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import {
  DECISION_14_ALLOWLIST_FLOORS,
  DECISION_14_ALWAYS_INELIGIBLE_OCCASIONS,
  DECISION_14_CONDITIONAL_EVENT_OCCASIONS,
  DECISION_14_EVENT_GENERIC_CAPTION,
  DECISION_14_NON_CLEARANCE_STATEMENT,
  DECISION_14_OWNER_RECORD_HEADING,
  DECISION_14_OWNER_RECORD_PATH,
  DECISION_14_PROTECTED_ATHLETES,
  DECISION_14_RESIDUAL_RISK_TOKEN,
  DECISION_14_REVIEW_DATE,
  DECISION_14_TARGET_ATHLETES,
  DECISION_14_WASHING_SIGNAL_IDS,
  containsAffirmativeClearanceClaim,
  decideDecision14PhotoEligibility,
  validateDecision14AllowlistRecord,
  validateDecision14PromotionAthlete,
  validateDecision14ProtectedCovers,
  validateDecision14TargetRoster,
  type Decision14AllowlistRecord,
  type Decision14EligibilityInput,
  type Decision14EventPhotoRecord,
} from "../../src/lib/contracts/decision-14-photo-contract";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ALLOWLIST_EVIDENCE_BYTES =
  "# Frozen Decision 14 photographer evidence\n\nBounded residual risk remains.\n";

const registry = JSON.parse(
  readFileSync(
    join(ROOT, "src/assets/players/player-photo-registry.v5.json"),
    "utf8",
  ),
) as {
  selections: Array<{
    athleteName: string;
    coverKind: "commons-photo" | "original-svg-fallback";
    localFile: { path: string; sha256: string };
  }>;
};

function issueCodes(issues: Array<{ code: string }>): string[] {
  return issues.map((entry) => entry.code);
}

function validWashingCheck() {
  return {
    basis:
      "Original-account files in the deterministic date-stratified sample are consistent.",
    checkedAt: DECISION_14_REVIEW_DATE,
    checkedBy: "decision-14-photo-review",
    originalWorkIdsOrUrls: [
      "https://www.flickr.com/photos/example-photographer/original-1",
    ],
    sampleRule:
      "Every fifth original-account sports work after sorting by capture date and stable ID.",
    status: "pass" as const,
  };
}

function validAllowlistRecord(): Decision14AllowlistRecord {
  return {
    accountControlType: "verified-individual-owned-flickr",
    canonicalPublicName: "Example Photographer",
    checkedAt: DECISION_14_REVIEW_DATE,
    checkedBy: "decision-14-photo-review",
    creditedMakerIdentity: {
      canonicalName: "Example Photographer",
      evidenceUrls: ["https://example.test/about"],
      relationship: "same-individual-verified",
    },
    disputeSearch: {
      checkedAt: DECISION_14_REVIEW_DATE,
      checkedBy: "decision-14-photo-review",
      findings: "none-located",
      limitation:
        "Bounded public-web negative search; it cannot prove that no dispute exists.",
      method:
        "Run the fixed named authorship, license, removal, and takedown query set and inspect the returned source pages.",
      queries: ["Example Photographer copyright dispute"],
      searchedUrls: ["https://www.flickr.com/photos/example-photographer/"],
    },
    evidenceParagraph:
      "The verified individual account, dated originals, exact-license sample, reuse chain, and five washing-signal checks meet every Decision 14 floor while residual risk remains.",
    evidencePath:
      "docs/reviews/2026-08-13-decision-14-p1-photographer-allowlist-evidence.md",
    evidenceSha256: sha256Hex(ALLOWLIST_EVIDENCE_BYTES),
    expectedLicenseToken: "cc-by-2.0",
    firstDatedSportsWork: {
      date: "2018-01-01",
      id: "first",
      url: "https://www.flickr.com/photos/example-photographer/first",
    },
    latestDatedSportsWork: {
      date: "2026-01-01",
      id: "latest",
      url: "https://www.flickr.com/photos/example-photographer/latest",
    },
    licenseHistory: {
      dateStratified: true,
      deterministicCollectionMethod:
        "Enumerate the verified account sports corpus by stable account ID and ascending capture date.",
      deviationReasons: [],
      enumeratedWorkIdsOrUrls: Array.from(
        { length: 50 },
        (_, index) => `work-${index + 1}`,
      ),
      licenseIndependentSampling: true,
      matchingWorkCount: 30,
      observedWorkCount: 50,
      sampledWorks: Array.from({ length: 30 }, (_, index) => ({
        exactLicenseToken: "cc-by-2.0",
        licenseEvidenceUrl: `https://www.flickr.com/photos/example-photographer/work-${index + 1}`,
        publishedAt:
          index < 10
            ? `2018-01-${String(index + 1).padStart(2, "0")}`
            : index < 20
              ? `2022-01-${String(index - 9).padStart(2, "0")}`
              : `2026-01-${String(index - 19).padStart(2, "0")}`,
        workIdOrUrl: `work-${index + 1}`,
      })),
      unexplainedDeviationCount: 0,
    },
    photographerId: "example-photographer",
    reuseChain: {
      commonsOrWikipediaPageCount: 1,
      commonsOrWikipediaPageUrls: [
        "https://commons.wikimedia.org/wiki/File:Example.jpg",
      ],
      earliestRevisionAt: "2020-01-01T00:00:00.000Z",
      fixedRevisions: [
        {
          permalink:
            "https://commons.wikimedia.org/w/index.php?title=File:Example.jpg&oldid=1",
          timestamp: "2020-01-01T00:00:00.000Z",
        },
        {
          permalink:
            "https://commons.wikimedia.org/w/index.php?title=File:Example.jpg&oldid=2",
          timestamp: "2026-01-01T00:00:00.000Z",
        },
      ],
      latestRevisionAt: "2026-01-01T00:00:00.000Z",
      revisionCount: 2,
      spanMonths: 72,
    },
    selfPublicationProof: {
      evidenceUrls: [
        "https://www.flickr.com/photos/example-photographer/original-1",
      ],
      status: "verified",
    },
    verifiedAccounts: [
      {
        accountId: "12345@N00",
        accountUrl: "https://www.flickr.com/photos/example-photographer/",
        canonicalOriginalUrlPrefixes: [
          "https://www.flickr.com/photos/example-photographer/",
        ],
        controlledByCanonicalPublicName: true,
        platform: "flickr",
      },
    ],
    washingChecks: Object.fromEntries(
      DECISION_14_WASHING_SIGNAL_IDS.map((signal) => [
        signal,
        validWashingCheck(),
      ]),
    ) as Decision14AllowlistRecord["washingChecks"],
  };
}

function validEventPhoto(): Decision14EventPhotoRecord {
  return {
    allowlistEvidencePath:
      "docs/reviews/2026-08-13-decision-14-p1-photographer-allowlist-evidence.md",
    allowlistEvidenceSha256: sha256Hex(ALLOWLIST_EVIDENCE_BYTES),
    allowlistPhotographerId: "example-photographer",
    athleteName: "LaMelo Ball",
    candidateLicenseMatchesExpected: true,
    candidateLicenseToken: "cc-by-2.0",
    creditedMakerCanonicalName: "Example Photographer",
    eventCompetitionEvidence: "2022 NBA All-Star Game",
    eventDateEvidence: "2022-02-20",
    eventOccasion: "all-star-game-action",
    eventOpponentEvidence: "Team Durant versus Team LeBron",
    expectedLicenseToken: "cc-by-2.0",
    injuryEventRelationship: "different-event-verified",
    matchedSelfPublishedAccountId: "12345@N00",
    nonClearanceStatement: DECISION_14_NON_CLEARANCE_STATEMENT,
    originalSelfUploadUrl:
      "https://www.flickr.com/photos/example-photographer/original-1",
    originalUploaderAccountId: "12345@N00",
    ownerRecordHeading: DECISION_14_OWNER_RECORD_HEADING,
    ownerRecordPath: DECISION_14_OWNER_RECORD_PATH,
    perFileChecksComplete: true,
    residualRiskToken: DECISION_14_RESIDUAL_RISK_TOKEN,
    selfPublishedOriginalVerified: true,
  };
}

function eventInput(
  eventPhoto = validEventPhoto(),
  allowlistRecord: Decision14AllowlistRecord | null = validAllowlistRecord(),
  allowlistEvidenceBytes: string | null = ALLOWLIST_EVIDENCE_BYTES,
): Decision14EligibilityInput {
  return {
    allowlistEvidenceBytes,
    allowlistRecord,
    athleteName: eventPhoto.athleteName,
    eventPhoto,
    v6QualifiedNonEvent: false,
  };
}

describe("Decision 14 Phase 0 closed-world roster", () => {
  it("matches exactly the 16 current SVG slots and protects exactly five current photos", () => {
    const svgNames = registry.selections
      .filter((selection) => selection.coverKind === "original-svg-fallback")
      .map((selection) => selection.athleteName);
    const photoNames = registry.selections
      .filter((selection) => selection.coverKind === "commons-photo")
      .map((selection) => selection.athleteName);

    expect(validateDecision14TargetRoster(svgNames)).toEqual([]);
    expect([...svgNames].sort()).toEqual(
      [...DECISION_14_TARGET_ATHLETES].sort(),
    );
    expect([...photoNames].sort()).toEqual(
      [...DECISION_14_PROTECTED_ATHLETES].sort(),
    );
  });

  it.each(
    [
      DECISION_14_TARGET_ATHLETES.slice(1),
      [...DECISION_14_TARGET_ATHLETES, "CJ McCollum"],
      [...DECISION_14_TARGET_ATHLETES, DECISION_14_TARGET_ATHLETES[0]],
    ].map((names) => [names] as const),
  )(
    "rejects missing, extra, or duplicate discovery/adoption rosters",
    (names) => {
      expect(issueCodes(validateDecision14TargetRoster(names))).toContain(
        "decision14-target-roster",
      );
    },
  );

  it("rejects promotion outside the fixed 16", () => {
    expect(validateDecision14PromotionAthlete("Anfernee Simons")).toEqual([]);
    expect(
      issueCodes(validateDecision14PromotionAthlete("CJ McCollum")),
    ).toContain("decision14-outside-target-promotion");
  });

  it("binds all five complete v5 subtrees and their exact local bytes", () => {
    const actual = registry.selections
      .filter((selection) => selection.coverKind === "commons-photo")
      .map((selection) => ({
        athleteName: selection.athleteName,
        localAssetSha256: sha256Hex(
          readFileSync(join(ROOT, selection.localFile.path)),
        ),
        selectionSha256: sha256Hex(canonicalJson(selection)),
      }));
    expect(validateDecision14ProtectedCovers(actual)).toEqual([]);

    const subtreeDrift = structuredClone(actual);
    subtreeDrift[0]!.selectionSha256 = "0".repeat(64);
    expect(
      issueCodes(validateDecision14ProtectedCovers(subtreeDrift)),
    ).toContain("decision14-protected-cover-drift");

    const byteDrift = structuredClone(actual);
    byteDrift[1]!.localAssetSha256 = sha256Hex(
      Buffer.concat([
        readFileSync(
          join(
            ROOT,
            registry.selections.find(
              (selection) =>
                selection.athleteName === byteDrift[1]!.athleteName,
            )!.localFile.path,
          ),
        ),
        Buffer.from([0]),
      ]),
    );
    expect(issueCodes(validateDecision14ProtectedCovers(byteDrift))).toContain(
      "decision14-protected-cover-drift",
    );
  });
});

describe("Decision 14 allowlist floors", () => {
  it("accepts a complete name-independent fixture and freezes every numeric floor", () => {
    expect(validateDecision14AllowlistRecord(validAllowlistRecord())).toEqual(
      [],
    );
    expect(DECISION_14_ALLOWLIST_FLOORS).toEqual({
      minimumHistoryYears: 3,
      minimumReuseMonths: 24,
      minimumSampleSize: 30,
      minimumSelfPublishedSportsWorks: 50,
      requiredLicenseMatchRate: 1,
      toleratedUnexplainedDeviations: 0,
    });
  });

  it.each([
    [
      "history",
      (row: Decision14AllowlistRecord) => {
        row.latestDatedSportsWork.date = "2020-12-31";
      },
      "decision14-allowlist-history-floor",
    ],
    [
      "corpus",
      (row: Decision14AllowlistRecord) => {
        row.licenseHistory.observedWorkCount = 49;
      },
      "decision14-allowlist-license-history-floor",
    ],
    [
      "sample",
      (row: Decision14AllowlistRecord) => {
        row.licenseHistory.sampledWorks = row.licenseHistory.sampledWorks.slice(
          0,
          29,
        );
      },
      "decision14-allowlist-license-history-floor",
    ],
    [
      "deviation",
      (row: Decision14AllowlistRecord) => {
        row.licenseHistory.unexplainedDeviationCount = 1;
      },
      "decision14-allowlist-license-history-floor",
    ],
    [
      "reuse",
      (row: Decision14AllowlistRecord) => {
        row.reuseChain.spanMonths = 23;
      },
      "decision14-allowlist-reuse-floor",
    ],
  ] as const)("rejects a missed %s floor", (_label, mutate, expectedCode) => {
    const row = validAllowlistRecord();
    mutate(row);
    expect(issueCodes(validateDecision14AllowlistRecord(row))).toContain(
      expectedCode,
    );
  });

  it.each([
    [
      "self-reported corpus count without the enumerated corpus",
      (row: Decision14AllowlistRecord) => {
        row.licenseHistory.enumeratedWorkIdsOrUrls.pop();
      },
      "decision14-allowlist-license-history-floor",
    ],
    [
      "third-party self-publication URL",
      (row: Decision14AllowlistRecord) => {
        row.selfPublicationProof.evidenceUrls = [
          "https://commons.wikimedia.org/wiki/File:Third-party-import.jpg",
        ];
      },
      "decision14-allowlist-self-publication",
    ],
    [
      "unbound account host",
      (row: Decision14AllowlistRecord) => {
        row.verifiedAccounts[0]!.accountUrl =
          "https://example.test/photos/example-photographer/";
      },
      "decision14-allowlist-account-control",
    ],
    [
      "same-host cross-account original prefix",
      (row: Decision14AllowlistRecord) => {
        row.verifiedAccounts[0]!.canonicalOriginalUrlPrefixes = [
          "https://www.flickr.com/photos/another-photographer/",
        ];
      },
      "decision14-allowlist-account-control",
    ],
    [
      "claimed reuse count without fixed revisions",
      (row: Decision14AllowlistRecord) => {
        row.reuseChain.fixedRevisions.pop();
      },
      "decision14-allowlist-reuse-floor",
    ],
    [
      "missing dispute-search method",
      (row: Decision14AllowlistRecord) => {
        row.disputeSearch.method = "";
      },
      "decision14-allowlist-dispute-search",
    ],
    [
      "third-party-only washing evidence",
      (row: Decision14AllowlistRecord) => {
        row.washingChecks["exif-series-consistency"].originalWorkIdsOrUrls = [
          "https://example.test/repost.jpg",
        ];
      },
      "decision14-allowlist-washing-signal",
    ],
  ] as const)("rejects %s", (_label, mutate, expectedCode) => {
    const row = validAllowlistRecord();
    mutate(row);
    expect(issueCodes(validateDecision14AllowlistRecord(row))).toContain(
      expectedCode,
    );
  });

  it("rejects a shared/brand maker ambiguity and third-party-only publication", () => {
    const maker = validAllowlistRecord();
    maker.creditedMakerIdentity.canonicalName = "Shared Brand";
    expect(issueCodes(validateDecision14AllowlistRecord(maker))).toContain(
      "decision14-allowlist-maker-identity",
    );

    const publication = validAllowlistRecord();
    publication.selfPublicationProof.status = "verified";
    publication.selfPublicationProof.evidenceUrls = [];
    expect(
      issueCodes(validateDecision14AllowlistRecord(publication)),
    ).toContain("decision14-allowlist-self-publication");
  });

  it.each(DECISION_14_WASHING_SIGNAL_IDS)(
    "rejects a failed or unresolved %s washing signal",
    (signal) => {
      const failed = validAllowlistRecord();
      failed.washingChecks[signal].status = "fail";
      expect(issueCodes(validateDecision14AllowlistRecord(failed))).toContain(
        "decision14-allowlist-washing-signal",
      );

      const unresolved = validAllowlistRecord();
      unresolved.washingChecks[signal].status = "unresolved";
      expect(
        issueCodes(validateDecision14AllowlistRecord(unresolved)),
      ).toContain("decision14-allowlist-washing-signal");
    },
  );

  it("rejects stale, missing, or affirmative-clearance evidence", () => {
    const stale = validAllowlistRecord();
    (stale as unknown as { checkedAt: string }).checkedAt = "2026-08-12";
    expect(issueCodes(validateDecision14AllowlistRecord(stale))).toContain(
      "decision14-allowlist-evidence-binding",
    );

    const missing = validAllowlistRecord();
    missing.evidenceSha256 = "";
    expect(issueCodes(validateDecision14AllowlistRecord(missing))).toContain(
      "decision14-allowlist-evidence-binding",
    );

    const clearance = validAllowlistRecord();
    clearance.evidenceParagraph = "The account is fully rights-cleared.";
    expect(issueCodes(validateDecision14AllowlistRecord(clearance))).toContain(
      "decision14-allowlist-evidence-binding",
    );
  });
});

describe("Decision 14 conditional event decision table", () => {
  it("keeps exactly six formerly ineligible v6 event tokens as conditional tokens", () => {
    const v6 = JSON.parse(
      readFileSync(
        join(ROOT, "research/source-policy/source-policy.v6.json"),
        "utf8",
      ),
    ) as { playerStaticPhotoRules: { ineligibleOccasions: string[] } };
    expect(DECISION_14_CONDITIONAL_EVENT_OCCASIONS).toEqual([
      "all-star-game-action",
      "international-competition-action",
      "live-preseason-competition",
      "postseason-action",
      "regular-season-action",
      "regular-season-pregame-or-warm-up",
    ]);
    expect(DECISION_14_ALWAYS_INELIGIBLE_OCCASIONS).toEqual([
      "ambiguous-credentialed-court-context",
      "closed-practice",
      "other",
      "unknown",
      "unresolved",
    ]);
    expect(
      v6.playerStaticPhotoRules.ineligibleOccasions.filter(
        (occasion) => occasion !== "ambiguous-credentialed-court-context",
      ),
    ).toEqual(DECISION_14_CONDITIONAL_EVENT_OCCASIONS);
    expect(v6.playerStaticPhotoRules.ineligibleOccasions).toContain(
      "ambiguous-credentialed-court-context",
    );
    expect(DECISION_14_EVENT_GENERIC_CAPTION).toBe(
      "賽事場合資料照片；非本案例受傷當下影像",
    );
  });

  it("accepts the two and only two complete branches", () => {
    expect(
      decideDecision14PhotoEligibility({
        allowlistEvidenceBytes: null,
        allowlistRecord: null,
        athleteName: "Anfernee Simons",
        eventPhoto: null,
        v6QualifiedNonEvent: true,
      }),
    ).toEqual({
      outcome: "eligible-photo",
      reasons: ["v6-qualified-non-event"],
    });
    expect(decideDecision14PhotoEligibility(eventInput())).toEqual({
      outcome: "eligible-photo",
      reasons: ["qualified-decision14-event-photo"],
    });
  });

  it.each([
    ["selfPublishedOriginalVerified", false, "self-publication-unverified"],
    ["perFileChecksComplete", false, "per-file-checks-incomplete"],
    ["candidateLicenseMatchesExpected", false, "license-token-mismatch"],
  ] as const)(
    "rejects event input when %s is false",
    (key, value, expectedReason) => {
      const event = validEventPhoto();
      event[key] = value;
      expect(
        decideDecision14PhotoEligibility(eventInput(event)).reasons,
      ).toContain(expectedReason);
    },
  );

  it("derives allowlist, account, maker, and evidence joins instead of trusting assertions", () => {
    expect(
      decideDecision14PhotoEligibility(
        eventInput(validEventPhoto(), null, ALLOWLIST_EVIDENCE_BYTES),
      ).reasons,
    ).toContain("photographer-not-allowlisted");

    const account = validEventPhoto();
    account.matchedSelfPublishedAccountId = "other-account";
    expect(
      decideDecision14PhotoEligibility(eventInput(account)).reasons,
    ).toContain("allowlist-account-mismatch");

    const original = validEventPhoto();
    original.originalSelfUploadUrl =
      "https://www.flickr.com/photos/another-account/original-1";
    expect(
      decideDecision14PhotoEligibility(eventInput(original)).reasons,
    ).toContain("original-self-upload-account-mismatch");

    const boundary = validEventPhoto();
    boundary.originalSelfUploadUrl =
      "https://www.flickr.com/photos/example-photographer-copy/original-1";
    expect(
      decideDecision14PhotoEligibility(eventInput(boundary)).reasons,
    ).toContain("original-self-upload-account-mismatch");

    const uploader = validEventPhoto();
    uploader.originalUploaderAccountId = "commons-importer";
    expect(
      decideDecision14PhotoEligibility(eventInput(uploader)).reasons,
    ).toContain("original-uploader-account-mismatch");

    const maker = validEventPhoto();
    maker.creditedMakerCanonicalName = "Shared Brand";
    expect(
      decideDecision14PhotoEligibility(eventInput(maker)).reasons,
    ).toContain("credited-maker-mismatch");

    expect(
      decideDecision14PhotoEligibility(
        eventInput(
          validEventPhoto(),
          validAllowlistRecord(),
          `${ALLOWLIST_EVIDENCE_BYTES}drift`,
        ),
      ).reasons,
    ).toContain("allowlist-evidence-digest-mismatch");

    const invalidAllowlist = validAllowlistRecord();
    invalidAllowlist.licenseHistory.observedWorkCount = 49;
    expect(
      decideDecision14PhotoEligibility(
        eventInput(
          validEventPhoto(),
          invalidAllowlist,
          ALLOWLIST_EVIDENCE_BYTES,
        ),
      ).reasons,
    ).toContain("photographer-not-allowlisted");
  });

  it.each(DECISION_14_ALWAYS_INELIGIBLE_OCCASIONS)(
    "rejects always-ineligible occasion %s",
    (occasion) => {
      const event = validEventPhoto();
      event.eventOccasion = occasion;
      expect(
        decideDecision14PhotoEligibility(eventInput(event)).reasons,
      ).toContain("occasion-ineligible");
    },
  );

  it("rejects license history mismatch, absent risk/citation, and same or unresolved injury event", () => {
    const license = validEventPhoto();
    license.candidateLicenseToken = "cc-by-4.0";
    expect(
      decideDecision14PhotoEligibility(eventInput(license)).reasons,
    ).toContain("license-token-mismatch");

    const risk = validEventPhoto();
    risk.residualRiskToken = "no-risk";
    expect(
      decideDecision14PhotoEligibility(eventInput(risk)).reasons,
    ).toContain("residual-risk-token-missing");

    const citation = validEventPhoto();
    citation.ownerRecordHeading = "Decision 13";
    expect(
      decideDecision14PhotoEligibility(eventInput(citation)).reasons,
    ).toContain("owner-record-reference-missing");

    for (const relationship of ["same-event", "unresolved"] as const) {
      const event = validEventPhoto();
      event.injuryEventRelationship = relationship;
      expect(
        decideDecision14PhotoEligibility(eventInput(event)).reasons,
      ).toContain("injury-event-relationship-ineligible");
    }
  });

  it.each(DECISION_14_CONDITIONAL_EVENT_OCCASIONS)(
    "accepts complete event evidence for the conditional occasion %s",
    (occasion) => {
      const event = validEventPhoto();
      event.eventOccasion = occasion;
      expect(decideDecision14PhotoEligibility(eventInput(event))).toEqual({
        outcome: "eligible-photo",
        reasons: ["qualified-decision14-event-photo"],
      });
    },
  );

  it.each([
    [
      "invalid original URL",
      (event: Decision14EventPhotoRecord) => {
        event.originalSelfUploadUrl = "http://example.test/original";
      },
      "original-self-upload-url-invalid",
    ],
    [
      "missing matched account ID",
      (event: Decision14EventPhotoRecord) => {
        event.matchedSelfPublishedAccountId = "";
      },
      "self-published-account-missing",
    ],
    [
      "incomplete event identity",
      (event: Decision14EventPhotoRecord) => {
        event.eventOpponentEvidence = "";
      },
      "event-identity-incomplete",
    ],
    [
      "invalid allowlist evidence digest",
      (event: Decision14EventPhotoRecord) => {
        event.allowlistEvidenceSha256 = "not-a-digest";
      },
      "allowlist-evidence-binding-invalid",
    ],
    [
      "unsupported exact license token",
      (event: Decision14EventPhotoRecord) => {
        event.expectedLicenseToken = "proprietary";
        event.candidateLicenseToken = "proprietary";
      },
      "license-token-mismatch",
    ],
  ] as const)("rejects %s", (_label, mutate, expectedReason) => {
    const event = validEventPhoto();
    mutate(event);
    expect(
      decideDecision14PhotoEligibility(eventInput(event)).reasons,
    ).toContain(expectedReason);
  });

  it("rejects an outside athlete and ambiguous branch instead of widening scope", () => {
    expect(
      decideDecision14PhotoEligibility({
        allowlistEvidenceBytes: null,
        allowlistRecord: null,
        athleteName: "CJ McCollum",
        eventPhoto: null,
        v6QualifiedNonEvent: true,
      }),
    ).toEqual({
      outcome: "retain-current-svg",
      reasons: ["outside-fixed-target-roster"],
    });
    expect(
      decideDecision14PhotoEligibility({
        allowlistEvidenceBytes: ALLOWLIST_EVIDENCE_BYTES,
        allowlistRecord: validAllowlistRecord(),
        athleteName: "LaMelo Ball",
        eventPhoto: validEventPhoto(),
        v6QualifiedNonEvent: true,
      }).reasons,
    ).toContain("occasion-branch-ambiguous");
  });

  it.each([
    "risk-free",
    "fully rights-cleared",
    "legal for public use",
    "licensed-for-public-use",
    "public-release-approved",
    "public-release clearance",
    "無風險",
    "已完全清權",
    "合法公開使用",
    "已獲 public-release clearance",
  ])("rejects affirmative clearance wording: %s", (claim) => {
    expect(containsAffirmativeClearanceClaim(claim)).toBe(true);
    const event = validEventPhoto();
    event.nonClearanceStatement = claim;
    expect(
      decideDecision14PhotoEligibility(eventInput(event)).reasons,
    ).toContain("non-clearance-statement-invalid");
  });

  it("keeps the exact bounded residual-risk facts distinct from clearance", () => {
    expect(DECISION_14_RESIDUAL_RISK_TOKEN).toBe(
      "credentialed-access-residual-risk",
    );
    expect(DECISION_14_OWNER_RECORD_PATH).toBe(
      "../.claude/g2-owner-decisions.md",
    );
    expect(
      containsAffirmativeClearanceClaim(DECISION_14_NON_CLEARANCE_STATEMENT),
    ).toBe(false);
  });
});
