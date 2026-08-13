/**
 * Decision 15's pure, fail-closed player-photo eligibility contract.
 *
 * The contract intentionally does not inspect occasion, photographer identity,
 * account control, self-publication, licensing authority, washing signals, or
 * dispute-search results. Those Decision 14 gates are historical facts under
 * nba-v8, not active eligibility inputs.
 */

import {
  canonicalJson,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
  type ValidationIssue,
} from "./canonical";

export const DECISION_15_SCOPE_ID =
  "decision-15-photo-first-covers-only" as const;
export const DECISION_15_REVIEW_DATE = "2026-08-13" as const;

export const DECISION_15_TARGET_ATHLETES = [
  "Anfernee Simons",
  "Anthony Edwards",
  "Brandon Clarke",
  "Danny Green",
  "Dejounte Murray",
  "Ja Morant",
  "Joe Ingles",
  "LaMelo Ball",
  "Markelle Fultz",
  "Moritz Wagner",
  "Ricky Rubio",
  "Thomas Bryant",
  "Trae Young",
  "Tyrese Haliburton",
] as const;

export const DECISION_15_PROTECTED_ATHLETES = [
  "CJ McCollum",
  "Damian Lillard",
  "Dwight Powell",
  "Jayson Tatum",
  "Kevin Durant",
  "Kyrie Irving",
  "LeBron James",
] as const;

/** Canonical v6 selection-subtree and actual local-byte digests. */
export const DECISION_15_PROTECTED_COVER_BINDINGS = [
  {
    athleteName: "CJ McCollum",
    localAssetSha256:
      "5688298371c4ec218dae6f5131685f4ab511fab6d0797685146953235c8c7e45",
    selectionSha256:
      "d373185dcef5842cd687236173805e21b32de1c65fc502aa00d44c4642ccdeec",
  },
  {
    athleteName: "Damian Lillard",
    localAssetSha256:
      "ba8a0f23d721519e4796c89513f21a9e3c1d4fafe39f84a0192244162bb3abcf",
    selectionSha256:
      "4b470fb0e459a0d74c096b2b163f58f6387eddf83bd8a98dcb173db539fa33db",
  },
  {
    athleteName: "Dwight Powell",
    localAssetSha256:
      "d1cab51c99f25b380d05d14bd5fe4f826b51042d4c007a7d105a7240265cd211",
    selectionSha256:
      "5c824ed878a6bd974c5f40f4870b5b52c9856f5aefa26e12aa76edd5a59b3732",
  },
  {
    athleteName: "Jayson Tatum",
    localAssetSha256:
      "0adddc2e2918f307434e18e79c96ed7bf2e852122bea0adc0c38203584d7cb78",
    selectionSha256:
      "3aace364ec8f80ba89c90b13a093a74f4994aaf4014f173ace357c7162bd3eba",
  },
  {
    athleteName: "Kevin Durant",
    localAssetSha256:
      "6f18766d49193c6858d607ae26551ba6c4422eebefb535ca2805ccd8b54e956d",
    selectionSha256:
      "5b2090e72be38fe535dd2547f424d6b3195883f44b8fa3a520d48fea8450583d",
  },
  {
    athleteName: "Kyrie Irving",
    localAssetSha256:
      "4f631559835221f8276ef7b1ee09b4435a5003ad9a50614bb0c72673dec745b6",
    selectionSha256:
      "6855ed64229a83f84ee124d3fbddb471da8077dab860a1fe40f0f2c0ed5e4475",
  },
  {
    athleteName: "LeBron James",
    localAssetSha256:
      "8f5550b3acc78302a465a84b9e78f62d466e484fbfec1e3c1054e9123457680c",
    selectionSha256:
      "81303b22c82f6f7705098f4e7c0805967e194e03003c01761d98ded71382b880",
  },
] as const;

export const DECISION_15_REMOVED_GATE_IDS = [
  "occasion-eligibility-restriction",
  "named-photographer-allowlist",
  "photographer-identity-proof",
  "account-control-proof",
  "photographer-owned-self-publication",
  "licensing-authority-verification",
  "washing-signal-detection",
  "dispute-search",
  "ambiguous-credentialed-court-automatic-rejection",
] as const;

export const DECISION_15_RETAINED_GATE_IDS = [
  "exact-athlete-and-case-mapping",
  "explicit-supported-cc-or-public-domain-marker",
  "exact-license-version-link-and-obligations-for-cc",
  "exact-public-domain-status-statement-and-source",
  "fixed-source-observation",
  "original-binary-facts",
  "different-from-governed-injury-event",
  "personality-rights-non-clearance",
  "cc-by-sa-site-composition-firewall",
  "closed-execution-scopes",
] as const;

export const DECISION_15_NON_CLEARANCE_STATEMENT =
  "Creative Commons and public-domain status address copyright only; no personality, portrait, publicity, privacy, endorsement, venue, league, team, contract, medical, legal-use, or public-release clearance is created." as const;

export const DECISION_15_POLICY_BINDING = Object.freeze({
  jsonPath: "research/source-policy/source-policy.v8.json",
  jsonSha256:
    "30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e",
  markdownPath: "research/source-policy/nba.v8.md",
  markdownSha256:
    "20a9209bd523604efe3251f6ef159e6432fa9280951ea16d630ee02cc347557d",
  sourcePolicyVersion: "nba-v8",
});

export const DECISION_15_REGISTRY_V6_BINDING = Object.freeze({
  path: "src/assets/players/player-photo-registry.v6.json",
  schemaVersion: 6,
  sha256: "16851aaa3d1dd223f20f102ef543f104a23ee61335a796f4b70cbe75d76d5cf0",
});

export const DECISION_15_SUPPORTED_CC_LICENSES = [
  {
    bucket: "cc-by",
    name: "CC BY 2.0",
    token: "cc-by-2.0",
    url: "https://creativecommons.org/licenses/by/2.0",
    version: "2.0",
  },
  {
    bucket: "cc-by",
    name: "CC BY 3.0",
    token: "cc-by-3.0",
    url: "https://creativecommons.org/licenses/by/3.0",
    version: "3.0",
  },
  {
    bucket: "cc-by",
    name: "CC BY 4.0",
    token: "cc-by-4.0",
    url: "https://creativecommons.org/licenses/by/4.0",
    version: "4.0",
  },
  {
    bucket: "cc-by-sa",
    name: "CC BY-SA 2.0",
    token: "cc-by-sa-2.0",
    url: "https://creativecommons.org/licenses/by-sa/2.0",
    version: "2.0",
  },
  {
    bucket: "cc-by-sa",
    name: "CC BY-SA 3.0",
    token: "cc-by-sa-3.0",
    url: "https://creativecommons.org/licenses/by-sa/3.0",
    version: "3.0",
  },
  {
    bucket: "cc-by-sa",
    name: "CC BY-SA 4.0",
    token: "cc-by-sa-4.0",
    url: "https://creativecommons.org/licenses/by-sa/4.0",
    version: "4.0",
  },
  {
    bucket: "cc0",
    name: "CC0 1.0",
    token: "cc0-1.0",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
    version: "1.0",
  },
] as const;

export const DECISION_15_PUBLIC_DOMAIN_MARKER_KINDS = [
  "creative-commons-public-domain-mark-1.0",
  "platform-public-domain-statement",
  "united-states-government-work-statement",
] as const;

export const DECISION_15_ALLOWED_BY_SA_USE_KINDS = [
  "ordinary-html-css-placement",
  "ordinary-responsive-rendition",
] as const;

export const DECISION_15_FORBIDDEN_BY_SA_USE_KINDS = [
  "case-card",
  "infographic",
  "og-image",
  "social-image",
  "equivalent-baked-composition",
] as const;

export type Decision15TargetAthlete =
  (typeof DECISION_15_TARGET_ATHLETES)[number];
export type Decision15CcLicense =
  (typeof DECISION_15_SUPPORTED_CC_LICENSES)[number];
export type Decision15RightsBucket =
  Decision15CcLicense["bucket"] | "public-domain";
export type Decision15PublicDomainMarkerKind =
  (typeof DECISION_15_PUBLIC_DOMAIN_MARKER_KINDS)[number];
export type Decision15RemovedGateId =
  (typeof DECISION_15_REMOVED_GATE_IDS)[number];

export interface Decision15RecordedFact {
  sourceUrl: string;
  status: "not-supplied" | "supplied";
  text: string | null;
}

export interface Decision15AttributionFulfillment {
  alterationDisclosed: boolean;
  copyrightNoticeVisibleWhenSupplied: boolean;
  creditVisibleWhenSupplied: boolean;
  disclaimerNoticeVisibleWhenSupplied: boolean;
  fixedSourceEvidenceVisible: boolean;
  otherNoticeVisibleWhenSupplied: boolean;
  termsOrStatusLinkVisible: boolean;
  titleVisibleWhenSupplied: boolean;
}

export interface Decision15RightsMarker {
  alterationDisclosure: string;
  attributionCondition: string | null;
  copyrightNotice: Decision15RecordedFact;
  displayedCredit: Decision15RecordedFact;
  disclaimerNotice: Decision15RecordedFact;
  fulfillment: Decision15AttributionFulfillment;
  licenseName: string | null;
  licenseVersion: string | null;
  markerAppliesToExactWork: boolean;
  markerKind: "creative-commons-license" | Decision15PublicDomainMarkerKind;
  markerStatus:
    "all-rights-reserved" | "ambiguous" | "explicit" | "missing" | "unknown";
  otherNotice: Decision15RecordedFact;
  rightsBucket: Decision15RightsBucket | null;
  rightsLinkOrStatementSource: string | null;
  statement: string | null;
  token: string | null;
  workPageUrl: string;
  workTitle: Decision15RecordedFact;
}

export interface Decision15CommonsSourceEvidence {
  checkedAt: string;
  checkedBy: string;
  descriptionUrl: string;
  originalFileUrl: string;
  platform: "wikimedia-commons";
  revisionId: number;
  revisionPermalink: string;
  revisionTimestamp: string;
}

export interface Decision15FlickrObservation {
  displayedCreditTitleAndNoticesRecorded: true;
  displayedRightsMarker: string;
  displayedRightsLinkOrStatementSource: string;
  observedAt: string;
  observedBy: string;
  originalRetrievalIdentity: string;
  pageUrl: string;
  photoId: string;
}

export interface Decision15FlickrSourceEvidence {
  evidenceRecordPath: string;
  evidenceRecordSha256: string;
  frozenObservation: Decision15FlickrObservation;
  frozenObservationClaimedAsSourceNativeRevision: false;
  platform: "flickr";
}

export type Decision15SourceEvidence =
  Decision15CommonsSourceEvidence | Decision15FlickrSourceEvidence;

export interface Decision15OriginalBinaryFacts {
  downloadDate: string;
  localFile: {
    byteLength: number;
    height: number;
    mimeType: "image/jpeg" | "image/png";
    path: string;
    sha256: string;
    width: number;
  };
  original: {
    byteLength: number;
    filenameOrPlatformAssetId: string;
    height: number;
    mimeType: "image/jpeg" | "image/png";
    retrievalIdentity: string;
    width: number;
  };
  retrievalKind: "original-binary" | "screenshot" | "thumbnail";
}

export interface Decision15AdapterLicense {
  name: string;
  scope: "crop-contribution-only" | "unscoped-document";
  token: string;
  url: string;
}

export interface Decision15CropFacts {
  adapterLicense: Decision15AdapterLicense | null;
  checkedAt: string;
  checkedBy: string;
  focalPosition: { xPercent: number; yPercent: number };
  localFileIsUnmodifiedOriginal: true;
  presentation: "css-object-fit-cover-crop";
  ratios: Array<{
    aspectRatio: "16:9" | "5:2";
    subjectSafe: boolean;
  }>;
}

export interface Decision15InjuryEventRelationship {
  caseId: string;
  evidence: string;
  status:
    | "different-from-governed-injury-event-verified"
    | "same-governed-injury-event"
    | "unresolved";
}

/**
 * These observations are retained as factual metadata only. No field in this
 * object is read by the eligibility decision.
 */
export interface Decision15RemovedGateObservations {
  accountControl: string;
  ambiguousCredentialedCourtContext: string;
  disputeSearch: string;
  licensingAuthority: string;
  namedPhotographerAllowlist: string;
  occasion: string;
  photographerIdentity: string;
  selfPublication: string;
  washingSignals: string;
}

export interface Decision15PhotoCandidate {
  athleteName: string;
  caseIds: string[];
  crop: Decision15CropFacts;
  depictedAthleteName: string;
  identityEvidence: string;
  injuryEventRelationships: Decision15InjuryEventRelationship[];
  lineage: {
    policy: typeof DECISION_15_POLICY_BINDING;
    predecessorRegistry: typeof DECISION_15_REGISTRY_V6_BINDING;
  };
  nonClearanceStatement: string;
  nonInjuryCaption: string;
  originalBinary: Decision15OriginalBinaryFacts;
  removedGateObservations?: Decision15RemovedGateObservations;
  rightsMarker: Decision15RightsMarker;
  sourceEvidence: Decision15SourceEvidence;
  supersession: {
    previousLocalFilePath: string;
    previousLocalFileSha256: string;
    reason: string;
  };
}

export interface Decision15EligibilityInput {
  candidate: Decision15PhotoCandidate;
  expectedCaseIds: readonly string[];
  flickrEvidenceRecordBytes?: string;
  localAssetBytes: Uint8Array;
}

export interface Decision15EligibilityResult {
  issues: ValidationIssue[];
  outcome: "eligible-photo" | "retain-current-svg";
  reasons: string[];
}

export interface Decision15BySaUseInput {
  adapterLicense: Decision15AdapterLicense | null;
  bakedOutput: boolean;
  licenseName: string;
  licenseToken: string;
  licenseUrl: string;
  siteComposed: boolean;
  useKind: string;
}

export interface Decision15BySaUseResult {
  allowed: boolean;
  reasons: string[];
}

const SHA256_RE = /^[a-f0-9]{64}$/u;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/u;
const UTC_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u;
const EVIDENCE_PATH_RE =
  /^docs\/reviews\/evidence\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*\.json$/u;
const LOCAL_PHOTO_PATH_RE =
  /^src\/assets\/players\/decision-15\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png)$/u;
const PD_US_GOV_RE = /^PD-USGov(?:-.+)?$/u;
const NON_INJURY_CAPTION_RE =
  /(?:非本案例受傷當下影像|does not depict (?:the )?(?:governed )?(?:case(?:'s)? )?injury (?:event|moment))/iu;
const BAKED_USE_RE =
  /(?:case[- ]?card|infographic|og|open[- ]?graph|social|compos(?:e|ed|ite|ition)|baked)/iu;

const ccLicenseByToken = new Map<string, Decision15CcLicense>(
  DECISION_15_SUPPORTED_CC_LICENSES.map((license) => [license.token, license]),
);

function contractIssue(
  code: string,
  path: string,
  message: string,
): ValidationIssue {
  return { code, message, path };
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim() === value && value !== "";
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function validIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function validUtcTimestamp(value: string): boolean {
  if (!UTC_TIMESTAMP_RE.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.valueOf());
}

function httpsUrl(
  value: unknown,
  expectedHosts?: readonly string[],
): URL | null {
  if (!nonEmpty(value)) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      return null;
    }
    if (
      expectedHosts !== undefined &&
      !expectedHosts.includes(parsed.hostname)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function allUnique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function exactSortedSet(
  actual: readonly string[],
  expected: readonly string[],
): boolean {
  const sortedActual = [...actual].sort(compareCodePoints);
  const sortedExpected = [...expected].sort(compareCodePoints);
  return (
    allUnique(actual) &&
    sortedActual.length === sortedExpected.length &&
    sortedActual.every((value, index) => value === sortedExpected[index])
  );
}

function exactObject(value: unknown, expected: unknown): boolean {
  return canonicalJson(value) === canonicalJson(expected);
}

function validateRecordedFact(
  fact: Decision15RecordedFact,
  path: string,
  requireSupplied: boolean,
): ValidationIssue[] {
  const valid =
    httpsUrl(fact.sourceUrl) !== null &&
    (fact.status === "supplied"
      ? nonEmpty(fact.text)
      : fact.status === "not-supplied" && fact.text === null) &&
    (!requireSupplied || fact.status === "supplied");
  return valid
    ? []
    : [
        contractIssue(
          "decision15-rights-fact",
          path,
          "the displayed fact must have an exact supplied/not-supplied state and source",
        ),
      ];
}

/** Requires an exactly-once pass across only the 14 Decision 15 SVG slots. */
export function validateDecision15TargetRoster(
  athleteNames: readonly string[],
): ValidationIssue[] {
  return exactSortedSet(athleteNames, DECISION_15_TARGET_ATHLETES)
    ? []
    : [
        contractIssue(
          "decision15-target-roster",
          "athleteNames",
          "Decision 15 discovery and promotion must contain exactly the 14 current SVG athletes once each",
        ),
      ];
}

export function validateDecision15PromotionAthlete(
  athleteName: string,
): ValidationIssue[] {
  return (DECISION_15_TARGET_ATHLETES as readonly string[]).includes(
    athleteName,
  )
    ? []
    : [
        contractIssue(
          "decision15-outside-target-promotion",
          "athleteName",
          "only one of the 14 current Decision 15 SVG slots may be promoted",
        ),
      ];
}

/**
 * Verifies complete v6 subtrees and actual asset-byte digests for all seven
 * protected selections. Callers derive both digests from the frozen v6 input.
 */
export function validateDecision15ProtectedCovers(
  actual: ReadonlyArray<{
    athleteName: string;
    localAssetSha256: string;
    selectionSha256: string;
  }>,
): ValidationIssue[] {
  if (
    !exactSortedSet(
      actual.map((row) => row.athleteName),
      DECISION_15_PROTECTED_ATHLETES,
    )
  ) {
    return [
      contractIssue(
        "decision15-protected-roster",
        "protectedCovers",
        "all seven protected v6 photo selections must appear exactly once",
      ),
    ];
  }
  const expected = new Map<
    string,
    (typeof DECISION_15_PROTECTED_COVER_BINDINGS)[number]
  >(DECISION_15_PROTECTED_COVER_BINDINGS.map((row) => [row.athleteName, row]));
  return actual.flatMap((row, index) => {
    const baseline = expected.get(row.athleteName);
    return baseline !== undefined &&
      row.localAssetSha256 === baseline.localAssetSha256 &&
      row.selectionSha256 === baseline.selectionSha256
      ? []
      : [
          contractIssue(
            "decision15-protected-cover-drift",
            `protectedCovers[${index}]`,
            "protected v6 selection subtree and local asset bytes must remain identical",
          ),
        ];
  });
}

/** A removed Decision 14 gate cannot be reintroduced as an active v8 gate. */
export function validateDecision15ActiveEligibilityGateIds(
  activeGateIds: readonly string[],
): ValidationIssue[] {
  const removed = new Set<string>(DECISION_15_REMOVED_GATE_IDS);
  return activeGateIds.flatMap((gateId, index) =>
    removed.has(gateId)
      ? [
          contractIssue(
            "decision15-removed-gate-active",
            `activeGateIds[${index}]`,
            `${gateId} was abolished by nba-v8 and cannot reject a candidate`,
          ),
        ]
      : [],
  );
}

export function validateDecision15RightsMarker(
  marker: Decision15RightsMarker,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sourcePage = httpsUrl(marker.workPageUrl, [
    "commons.wikimedia.org",
    "flickr.com",
    "www.flickr.com",
  ]);
  if (
    marker.markerStatus !== "explicit" ||
    marker.markerAppliesToExactWork !== true ||
    sourcePage === null
  ) {
    issues.push(
      contractIssue(
        "decision15-explicit-rights-marker",
        "rightsMarker",
        "the exact Commons/Flickr work page must display an explicit supported marker",
      ),
    );
  }

  issues.push(
    ...validateRecordedFact(
      marker.displayedCredit,
      "rightsMarker.displayedCredit",
      marker.markerKind === "creative-commons-license",
    ),
    ...validateRecordedFact(marker.workTitle, "rightsMarker.workTitle", false),
    ...validateRecordedFact(
      marker.copyrightNotice,
      "rightsMarker.copyrightNotice",
      false,
    ),
    ...validateRecordedFact(
      marker.disclaimerNotice,
      "rightsMarker.disclaimerNotice",
      false,
    ),
    ...validateRecordedFact(
      marker.otherNotice,
      "rightsMarker.otherNotice",
      false,
    ),
  );

  const facts = [
    marker.displayedCredit,
    marker.workTitle,
    marker.copyrightNotice,
    marker.disclaimerNotice,
    marker.otherNotice,
  ];
  if (!facts.every((fact) => fact.sourceUrl === marker.workPageUrl)) {
    issues.push(
      contractIssue(
        "decision15-rights-fact-work",
        "rightsMarker",
        "credit, title, and notice states must be tied to the exact marked work page",
      ),
    );
  }
  if (!nonEmpty(marker.alterationDisclosure)) {
    issues.push(
      contractIssue(
        "decision15-alteration-disclosure",
        "rightsMarker.alterationDisclosure",
        "source and presentation alteration state must be disclosed",
      ),
    );
  }

  const suppliedVisibility = [
    [marker.displayedCredit, marker.fulfillment.creditVisibleWhenSupplied],
    [marker.workTitle, marker.fulfillment.titleVisibleWhenSupplied],
    [
      marker.copyrightNotice,
      marker.fulfillment.copyrightNoticeVisibleWhenSupplied,
    ],
    [
      marker.disclaimerNotice,
      marker.fulfillment.disclaimerNoticeVisibleWhenSupplied,
    ],
    [marker.otherNotice, marker.fulfillment.otherNoticeVisibleWhenSupplied],
  ] as const;
  if (
    suppliedVisibility.some(
      ([fact, visible]) => fact.status === "supplied" && visible !== true,
    ) ||
    marker.fulfillment.alterationDisclosed !== true ||
    marker.fulfillment.fixedSourceEvidenceVisible !== true ||
    marker.fulfillment.termsOrStatusLinkVisible !== true
  ) {
    issues.push(
      contractIssue(
        "decision15-attribution-fulfillment",
        "rightsMarker.fulfillment",
        "every applicable credit, title, notice, link, alteration, and fixed-source obligation must be fulfilled",
      ),
    );
  }

  if (marker.markerKind === "creative-commons-license") {
    const expected =
      marker.token === null ? undefined : ccLicenseByToken.get(marker.token);
    if (
      expected === undefined ||
      marker.licenseName !== expected.name ||
      marker.licenseVersion !== expected.version ||
      marker.rightsLinkOrStatementSource !== expected.url ||
      marker.rightsBucket !== expected.bucket ||
      marker.statement !== null ||
      marker.attributionCondition !== "license-conditions-apply"
    ) {
      issues.push(
        contractIssue(
          "decision15-supported-cc-marker",
          "rightsMarker",
          "CC markers must match an exact supported token/name/version/terms-link/bucket tuple; NC and ND are unsupported",
        ),
      );
    }
  } else {
    const acceptedKind = (
      DECISION_15_PUBLIC_DOMAIN_MARKER_KINDS as readonly string[]
    ).includes(marker.markerKind);
    const validToken =
      marker.markerKind === "united-states-government-work-statement"
        ? marker.token !== null && PD_US_GOV_RE.test(marker.token)
        : marker.markerKind === "creative-commons-public-domain-mark-1.0"
          ? marker.token === "PDM-1.0"
          : nonEmpty(marker.token);
    if (
      !acceptedKind ||
      !validToken ||
      marker.rightsBucket !== "public-domain" ||
      marker.licenseName !== null ||
      marker.licenseVersion !== null ||
      marker.attributionCondition !== null ||
      !nonEmpty(marker.statement) ||
      httpsUrl(marker.rightsLinkOrStatementSource) === null
    ) {
      issues.push(
        contractIssue(
          "decision15-public-domain-marker",
          "rightsMarker",
          "public-domain markers require an exact PD/US-government statement and source without an invented CC license or attribution condition",
        ),
      );
    }
  }
  return issues;
}

function validateCommonsEvidence(
  source: Decision15CommonsSourceEvidence,
  marker: Decision15RightsMarker,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const description = httpsUrl(source.descriptionUrl, [
    "commons.wikimedia.org",
  ]);
  const permalink = httpsUrl(source.revisionPermalink, [
    "commons.wikimedia.org",
  ]);
  const original = httpsUrl(source.originalFileUrl, ["upload.wikimedia.org"]);
  if (
    description === null ||
    !description.pathname.startsWith("/wiki/File:") ||
    permalink === null ||
    permalink.pathname !== "/w/index.php" ||
    permalink.searchParams.get("oldid") !== String(source.revisionId) ||
    !positiveInteger(source.revisionId) ||
    !validUtcTimestamp(source.revisionTimestamp) ||
    original === null ||
    !nonEmpty(source.checkedBy) ||
    !validIsoDate(source.checkedAt)
  ) {
    issues.push(
      contractIssue(
        "decision15-commons-fixed-evidence",
        "sourceEvidence",
        "Commons evidence requires the exact description URL, oldid permalink, timestamp, checker, and original-file URL",
      ),
    );
  }
  if (marker.workPageUrl !== source.revisionPermalink) {
    issues.push(
      contractIssue(
        "decision15-rights-source-work-mismatch",
        "rightsMarker.workPageUrl",
        "the displayed marker must be observed on the same fixed Commons work revision",
      ),
    );
  }
  return issues;
}

function validateFlickrEvidence(
  source: Decision15FlickrSourceEvidence,
  marker: Decision15RightsMarker,
  evidenceRecordBytes: string | undefined,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const observation = source.frozenObservation;
  const page = httpsUrl(observation.pageUrl, ["flickr.com", "www.flickr.com"]);
  const pathSegments = page?.pathname.split("/").filter(Boolean) ?? [];
  if (
    !EVIDENCE_PATH_RE.test(source.evidenceRecordPath) ||
    !SHA256_RE.test(source.evidenceRecordSha256) ||
    source.frozenObservationClaimedAsSourceNativeRevision !== false ||
    page === null ||
    pathSegments[0] !== "photos" ||
    pathSegments[2] !== observation.photoId ||
    !nonEmpty(observation.photoId) ||
    !validUtcTimestamp(observation.observedAt) ||
    !nonEmpty(observation.observedBy) ||
    observation.displayedCreditTitleAndNoticesRecorded !== true ||
    !nonEmpty(observation.originalRetrievalIdentity)
  ) {
    issues.push(
      contractIssue(
        "decision15-flickr-fixed-evidence",
        "sourceEvidence",
        "Flickr requires a canonical frozen observation and must not claim a source-native immutable revision",
      ),
    );
  }
  if (
    marker.workPageUrl !== observation.pageUrl ||
    marker.token !== observation.displayedRightsMarker ||
    marker.rightsLinkOrStatementSource !==
      observation.displayedRightsLinkOrStatementSource
  ) {
    issues.push(
      contractIssue(
        "decision15-rights-source-work-mismatch",
        "sourceEvidence.frozenObservation",
        "the frozen Flickr observation must match the exact work and rights facts",
      ),
    );
  }
  if (evidenceRecordBytes === undefined) {
    issues.push(
      contractIssue(
        "decision15-flickr-evidence-bytes",
        "flickrEvidenceRecordBytes",
        "the exact frozen Flickr evidence-record bytes are required",
      ),
    );
  } else {
    let canonical = false;
    try {
      const parsed = parseStrictJson(evidenceRecordBytes);
      canonical =
        canonicalJson(parsed) === evidenceRecordBytes &&
        exactObject(parsed, observation);
    } catch {
      canonical = false;
    }
    if (
      !canonical ||
      sha256Hex(evidenceRecordBytes) !== source.evidenceRecordSha256
    ) {
      issues.push(
        contractIssue(
          "decision15-flickr-evidence-bytes",
          "flickrEvidenceRecordBytes",
          "Flickr observation bytes must be strict canonical JSON, match the record fields, and match their SHA-256",
        ),
      );
    }
  }
  return issues;
}

export function validateDecision15SourceEvidence(
  source: Decision15SourceEvidence,
  marker: Decision15RightsMarker,
  flickrEvidenceRecordBytes?: string,
): ValidationIssue[] {
  return source.platform === "wikimedia-commons"
    ? validateCommonsEvidence(source, marker)
    : validateFlickrEvidence(source, marker, flickrEvidenceRecordBytes);
}

export function validateDecision15OriginalBinary(
  binary: Decision15OriginalBinaryFacts,
  source: Decision15SourceEvidence,
  localAssetBytes: Uint8Array,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { localFile, original } = binary;
  const expectedRetrievalIdentity =
    source.platform === "wikimedia-commons"
      ? source.originalFileUrl
      : source.frozenObservation.originalRetrievalIdentity;
  if (
    binary.retrievalKind !== "original-binary" ||
    !validIsoDate(binary.downloadDate) ||
    !nonEmpty(original.filenameOrPlatformAssetId) ||
    !positiveInteger(original.byteLength) ||
    !positiveInteger(original.width) ||
    !positiveInteger(original.height) ||
    original.retrievalIdentity !== expectedRetrievalIdentity ||
    (source.platform === "wikimedia-commons" &&
      httpsUrl(original.retrievalIdentity, ["upload.wikimedia.org"]) === null)
  ) {
    issues.push(
      contractIssue(
        "decision15-original-binary-facts",
        "originalBinary.original",
        "an exact original binary identity, MIME, dimensions, byte length, and download date are required; screenshots and thumbnails fail",
      ),
    );
  }
  if (
    !LOCAL_PHOTO_PATH_RE.test(localFile.path) ||
    !positiveInteger(localFile.byteLength) ||
    !positiveInteger(localFile.width) ||
    !positiveInteger(localFile.height) ||
    !SHA256_RE.test(localFile.sha256) ||
    localFile.byteLength !== original.byteLength ||
    localFile.width !== original.width ||
    localFile.height !== original.height ||
    localFile.mimeType !== original.mimeType ||
    localAssetBytes.byteLength !== localFile.byteLength ||
    sha256Hex(localAssetBytes) !== localFile.sha256
  ) {
    issues.push(
      contractIssue(
        "decision15-local-original-binary",
        "originalBinary.localFile",
        "the Decision 15 local asset must be the exact recorded original bytes with matching MIME and dimensions",
      ),
    );
  }
  return issues;
}

function validateAdapterLicense(
  marker: Decision15RightsMarker,
  adapter: Decision15AdapterLicense | null,
  path: string,
): ValidationIssue[] {
  if (marker.rightsBucket !== "cc-by-sa") {
    return adapter === null
      ? []
      : [
          contractIssue(
            "decision15-adapter-license",
            path,
            "only a CC BY-SA crop declares an Adapter's License",
          ),
        ];
  }
  const expected =
    marker.token === null ? undefined : ccLicenseByToken.get(marker.token);
  return expected !== undefined &&
    adapter?.name === expected.name &&
    adapter.token === expected.token &&
    adapter.url === expected.url &&
    adapter.scope === "crop-contribution-only"
    ? []
    : [
        contractIssue(
          "decision15-adapter-license",
          path,
          "a BY-SA CSS crop requires the same exact license version, limited to the crop contribution",
        ),
      ];
}

function validateCropFacts(
  crop: Decision15CropFacts,
  marker: Decision15RightsMarker,
): ValidationIssue[] {
  const issues = validateAdapterLicense(
    marker,
    crop.adapterLicense,
    "crop.adapterLicense",
  );
  const ratios = crop.ratios.map((row) => row.aspectRatio);
  if (
    crop.presentation !== "css-object-fit-cover-crop" ||
    crop.localFileIsUnmodifiedOriginal !== true ||
    !validIsoDate(crop.checkedAt) ||
    !nonEmpty(crop.checkedBy) ||
    !Number.isFinite(crop.focalPosition.xPercent) ||
    !Number.isFinite(crop.focalPosition.yPercent) ||
    crop.focalPosition.xPercent < 0 ||
    crop.focalPosition.xPercent > 100 ||
    crop.focalPosition.yPercent < 0 ||
    crop.focalPosition.yPercent > 100 ||
    !exactSortedSet(ratios, ["5:2", "16:9"]) ||
    crop.ratios.some((row) => row.subjectSafe !== true)
  ) {
    issues.push(
      contractIssue(
        "decision15-crop-focal-facts",
        "crop",
        "the unmodified local original needs a focal point and passing 5:2 and 16:9 CSS-crop checks",
      ),
    );
  }
  return issues;
}

function validateMappingAndInjury(
  candidate: Decision15PhotoCandidate,
  expectedCaseIds: readonly string[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (
    !(DECISION_15_TARGET_ATHLETES as readonly string[]).includes(
      candidate.athleteName,
    ) ||
    candidate.depictedAthleteName !== candidate.athleteName ||
    !nonEmpty(candidate.identityEvidence) ||
    !exactSortedSet(candidate.caseIds, expectedCaseIds)
  ) {
    issues.push(
      contractIssue(
        "decision15-athlete-case-mapping",
        "candidate",
        "the depicted athlete and exact governed case mapping must match one of the 14 target slots",
      ),
    );
  }
  const relationshipCases = candidate.injuryEventRelationships.map(
    (row) => row.caseId,
  );
  if (
    !exactSortedSet(relationshipCases, expectedCaseIds) ||
    candidate.injuryEventRelationships.some(
      (row) =>
        row.status !== "different-from-governed-injury-event-verified" ||
        !nonEmpty(row.evidence),
    )
  ) {
    issues.push(
      contractIssue(
        "decision15-different-injury-event",
        "injuryEventRelationships",
        "every governed case must be verified as a different event; same or unresolved relationships fail closed",
      ),
    );
  }
  return issues;
}

function validateLineageAndNonClearance(
  candidate: Decision15PhotoCandidate,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (
    !exactObject(candidate.lineage.policy, DECISION_15_POLICY_BINDING) ||
    !exactObject(
      candidate.lineage.predecessorRegistry,
      DECISION_15_REGISTRY_V6_BINDING,
    )
  ) {
    issues.push(
      contractIssue(
        "decision15-lineage",
        "lineage",
        "the selection must bind the exact nba-v8 pair and registry v6 bytes",
      ),
    );
  }
  if (
    candidate.nonClearanceStatement !== DECISION_15_NON_CLEARANCE_STATEMENT ||
    !NON_INJURY_CAPTION_RE.test(candidate.nonInjuryCaption)
  ) {
    issues.push(
      contractIssue(
        "decision15-non-clearance",
        "nonClearanceStatement",
        "the copyright-only/personality-rights non-clearance and non-injury caption must remain explicit",
      ),
    );
  }
  if (
    !nonEmpty(candidate.supersession.previousLocalFilePath) ||
    !SHA256_RE.test(candidate.supersession.previousLocalFileSha256) ||
    !nonEmpty(candidate.supersession.reason)
  ) {
    issues.push(
      contractIssue(
        "decision15-supersession",
        "supersession",
        "the exact prior local selection and supersession reason are required",
      ),
    );
  }
  return issues;
}

export function decideDecision15PhotoEligibility(
  input: Decision15EligibilityInput,
): Decision15EligibilityResult {
  const { candidate } = input;
  const issues = [
    ...validateMappingAndInjury(candidate, input.expectedCaseIds),
    ...validateDecision15RightsMarker(candidate.rightsMarker),
    ...validateDecision15SourceEvidence(
      candidate.sourceEvidence,
      candidate.rightsMarker,
      input.flickrEvidenceRecordBytes,
    ),
    ...validateDecision15OriginalBinary(
      candidate.originalBinary,
      candidate.sourceEvidence,
      input.localAssetBytes,
    ),
    ...validateCropFacts(candidate.crop, candidate.rightsMarker),
    ...validateLineageAndNonClearance(candidate),
  ];
  return {
    issues,
    outcome: issues.length === 0 ? "eligible-photo" : "retain-current-svg",
    reasons:
      issues.length === 0
        ? ["all-retained-nba-v8-gates-pass"]
        : [...new Set(issues.map((entry) => entry.code))],
  };
}

/**
 * Pure BY-SA composition firewall. Unknown uses fail closed. Ordinary local
 * placement and responsive rendition are allowed only with a same-version,
 * crop-contribution-only Adapter's License.
 */
export function decideDecision15BySaUse(
  input: Decision15BySaUseInput,
): Decision15BySaUseResult {
  const expected = ccLicenseByToken.get(input.licenseToken);
  const reasons: string[] = [];
  if (
    expected?.bucket !== "cc-by-sa" ||
    input.licenseName !== expected.name ||
    input.licenseUrl !== expected.url
  ) {
    reasons.push("unsupported-or-inconsistent-by-sa-license");
  }
  if (
    expected === undefined ||
    input.adapterLicense?.name !== expected.name ||
    input.adapterLicense.token !== expected.token ||
    input.adapterLicense.url !== expected.url ||
    input.adapterLicense.scope !== "crop-contribution-only"
  ) {
    reasons.push("adapter-license-not-same-version-crop-only");
  }
  const ordinary = (
    DECISION_15_ALLOWED_BY_SA_USE_KINDS as readonly string[]
  ).includes(input.useKind);
  const explicitlyForbidden = (
    DECISION_15_FORBIDDEN_BY_SA_USE_KINDS as readonly string[]
  ).includes(input.useKind);
  if (
    !ordinary ||
    explicitlyForbidden ||
    input.siteComposed ||
    input.bakedOutput ||
    BAKED_USE_RE.test(input.useKind)
  ) {
    reasons.push(
      explicitlyForbidden ||
        input.siteComposed ||
        input.bakedOutput ||
        BAKED_USE_RE.test(input.useKind)
        ? "cc-by-sa-site-composed-or-baked-output-forbidden"
        : "unclassified-by-sa-use-fails-closed",
    );
  }
  return { allowed: reasons.length === 0, reasons: [...new Set(reasons)] };
}
