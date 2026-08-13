/**
 * Generate the complete Decision 13 Phase 3 before-state notice inventory.
 *
 * The collector is deliberately local-only: it serves the already-built
 * review artifact on 127.0.0.1, aborts every non-local request, and records
 * semantic DOM snapshots rather than screenshots of third-party imagery.
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer, type Server } from "node:http";
import { basename, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Browser, type Page } from "@playwright/test";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import {
  DECISION_13_CLINICAL_FREEZE,
  DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256,
  verifyDecision13ClinicalFreeze,
} from "./verify-decision-13-clinical-freeze";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distRoot = resolve(root, "dist");
const evidenceRoot = resolve(
  root,
  "docs/reviews/evidence/decision-13/notices-before",
);
const inputCommit = "d625989de94969ecb9c248038fb00e0890f1f51b";
const expectedNodeVersion = "v24.14.0";
const expectedDistAggregateSha256 =
  "cd8c82377f4e7658522fa268319cc2b4a9789201e0e828940ea7fce157646171";
const checkedDate = "2026-08-13";
const desktop = { id: "desktop-1440x900", width: 1440, height: 900 } as const;
const mobile = { id: "mobile-390x844", width: 390, height: 844 } as const;

type NecessityClass =
  | "license-required"
  | "medical-legal-review-required"
  | "evidence-or-policy-required"
  | "redundant-or-editorial";

interface SourceBinding {
  component: string;
  lineEnd: number;
  lineStart: number;
  path: string;
}

interface NoticeRule {
  availability: "all-builds" | "review-only";
  familyId: string;
  frozenClinicalContent?: boolean;
  necessityClass: NecessityClass;
  note: string;
  ownerLegalDisposition?: "pending";
  routePattern?: string;
  selector: string;
  sourceBindings: SourceBinding[];
  survivingCanonicalLocation?: string | null;
}

interface NetworkAudit {
  attemptedExternalUrls: string[];
  blockedExternalUrls: string[];
  completedExternalUrls: string[];
  failedExternalUrls: string[];
}

interface NetworkSummary {
  attemptedExternalRequestCount: number;
  attemptedExternalUrls: string[];
  blockedExternalRequestCount: number;
  blockedExternalUrls: string[];
  completedExternalRequestCount: number;
  completedExternalUrls: string[];
  failedExternalRequestCount: number;
  failedExternalUrls: string[];
  unaccountedExternalRequestCount: number;
  unaccountedExternalUrls: string[];
}

const source = (
  path: string,
  component: string,
  lineStart: number,
  lineEnd: number,
): SourceBinding => ({ component, lineEnd, lineStart, path });

const RULES: NoticeRule[] = [
  {
    availability: "review-only",
    familyId: "review-robots-meta",
    necessityClass: "evidence-or-policy-required",
    note: "Fail-closed review indexing control; nonvisual metadata sink.",
    selector: 'meta[name="robots"]',
    sourceBindings: [
      source("src/layouts/BaseLayout.astro", "BaseLayout", 124, 124),
      source("src/lib/governance/build-mode.ts", "robotsMetaContent", 23, 31),
    ],
  },
  {
    availability: "review-only",
    familyId: "review-artifact-identity-meta",
    necessityClass: "evidence-or-policy-required",
    note: "Per-route review-artifact identity; nonvisual metadata sink.",
    selector: 'meta[name="atlas-artifact-identity-v1"]',
    sourceBindings: [
      source("src/layouts/BaseLayout.astro", "BaseLayout", 125, 129),
    ],
  },
  {
    availability: "all-builds",
    familyId: "page-description-meta",
    necessityClass: "redundant-or-editorial",
    note: "Route-authored description metadata; inventoried so consolidation cannot silently change it.",
    selector: 'meta[name="description"]',
    sourceBindings: [
      source("src/layouts/BaseLayout.astro", "BaseLayout", 131, 135),
    ],
    survivingCanonicalLocation:
      'same-route:meta[name="description"] (retained; no deletion proposed)',
  },
  {
    availability: "review-only",
    familyId: "review-banner",
    necessityClass: "evidence-or-policy-required",
    note: "Private-review status and no-redistribution/no-index warning.",
    selector: ".review-banner",
    sourceBindings: [
      source(
        "src/components/layout/ReviewBanner.astro",
        "ReviewBanner",
        17,
        20,
      ),
    ],
  },
  {
    availability: "all-builds",
    familyId: "footer-independent-site",
    necessityClass: "evidence-or-policy-required",
    note: "Independent-site and non-affiliation statement.",
    selector: ".footer-disclosure > p:nth-of-type(1)",
    sourceBindings: [
      source("src/components/layout/SiteFooter.astro", "SiteFooter", 33, 37),
    ],
  },
  {
    availability: "all-builds",
    familyId: "footer-source-rights-posture",
    necessityClass: "evidence-or-policy-required",
    note: "Source-link and rights-review boundary statement.",
    selector: ".footer-disclosure > p:nth-of-type(2)",
    sourceBindings: [
      source("src/components/layout/SiteFooter.astro", "SiteFooter", 38, 40),
    ],
  },
  {
    availability: "all-builds",
    familyId: "footer-site-copyright",
    necessityClass: "evidence-or-policy-required",
    note: "Site copyright line; no deletion is proposed in Phase 3.",
    selector: ".site-footer-legal .footer-legal-inner > div > p:nth-of-type(1)",
    sourceBindings: [
      source("src/components/layout/SiteFooter.astro", "SiteFooter", 46, 47),
    ],
  },
  {
    availability: "all-builds",
    familyId: "footer-medical-short",
    necessityClass: "medical-legal-review-required",
    note: "First of two adjacent footer medical-purpose statements.",
    ownerLegalDisposition: "pending",
    selector: ".site-footer-legal .footer-legal-inner > div > p:nth-of-type(2)",
    sourceBindings: [
      source("src/components/layout/SiteFooter.astro", "SiteFooter", 48, 48),
    ],
  },
  {
    availability: "all-builds",
    familyId: "footer-medical-long",
    necessityClass: "medical-legal-review-required",
    note: "Second of two adjacent footer medical-purpose statements.",
    ownerLegalDisposition: "pending",
    selector: ".site-footer-legal .footer-legal-inner > p",
    sourceBindings: [
      source("src/components/layout/SiteFooter.astro", "SiteFooter", 50, 50),
    ],
  },
  {
    availability: "all-builds",
    familyId: "licensed-photo-attribution",
    necessityClass: "license-required",
    note: "Compound sink: exact CC fields are license-required; non-event/risk fields are policy-required and are split in attributionSegments.",
    selector: ".case-cover-attribution[data-license-bucket]",
    sourceBindings: [
      source("src/components/cases/CaseCover.astro", "CaseCover", 145, 344),
      source(
        "src/assets/players/player-photo-registry.v5.json",
        "PlayerPhotoRegistryV5",
        1,
        1,
      ),
    ],
  },
  {
    availability: "all-builds",
    familyId: "original-svg-cover-clarification",
    necessityClass: "evidence-or-policy-required",
    note: "Original-artwork and non-event clarification adjacent to each SVG cover.",
    selector: "[data-original-svg-label]",
    sourceBindings: [
      source("src/components/cases/CaseCover.astro", "CaseCover", 345, 348),
    ],
  },
  {
    availability: "all-builds",
    familyId: "case-diagnosis-confirmation",
    frozenClinicalContent: true,
    necessityClass: "evidence-or-policy-required",
    note: "External-source diagnosis status; frozen clinical bytes are excluded from notice editing.",
    selector: ".case-confirmation[data-confirmation-status]",
    sourceBindings: [
      source("src/pages/cases/[slug].astro", "CaseDetail", 111, 120),
      source(
        "src/pages/review/fixtures/[fixture].astro",
        "ReviewFixture",
        121,
        129,
      ),
    ],
  },
  {
    availability: "all-builds",
    familyId: "case-card-diagnosis-confirmation",
    necessityClass: "evidence-or-policy-required",
    note: "Card-level external-source diagnosis status, distinct from workflow state.",
    selector: ".case-card-confirmation[data-confirmation-status]",
    sourceBindings: [
      source("src/components/atlas/CaseCard.astro", "CaseCard", 57, 65),
    ],
  },
  {
    availability: "all-builds",
    familyId: "observed-mechanism-not-diagnosis",
    frozenClinicalContent: true,
    necessityClass: "evidence-or-policy-required",
    note: "Observation/diagnosis boundary; values are controlled clinical content.",
    selector: ".mechanism-tags",
    sourceBindings: [
      source("src/pages/cases/[slug].astro", "CaseDetail", 133, 137),
      source(
        "src/pages/review/fixtures/[fixture].astro",
        "ReviewFixture",
        139,
        143,
      ),
    ],
  },
  {
    availability: "review-only",
    familyId: "review-workflow-state",
    necessityClass: "evidence-or-policy-required",
    note: "Internal workflow state explicitly distinguished from diagnosis.",
    selector: "[data-review-badge]",
    sourceBindings: [
      source("src/components/cases/ReviewBadge.astro", "ReviewBadge", 19, 21),
    ],
  },
  {
    availability: "all-builds",
    familyId: "layer-switch-explainer",
    necessityClass: "redundant-or-editorial",
    note: "Candidate for consolidation only if the same fact survives accessibly.",
    selector: ".layer-switch-note",
    sourceBindings: [
      source("src/components/cases/LayeredNotes.astro", "LayeredNotes", 50, 52),
    ],
    survivingCanonicalLocation: "/about/#layers-heading",
  },
  {
    availability: "all-builds",
    familyId: "video-caption-status",
    necessityClass: "evidence-or-policy-required",
    note: "Accessibility status for the underlying video source.",
    selector: "[data-caption-status]",
    sourceBindings: [
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 282, 287),
    ],
  },
  {
    availability: "all-builds",
    familyId: "video-caption-warning",
    necessityClass: "evidence-or-policy-required",
    note: "Caption-dependent embed degradation warning.",
    selector: "[data-caption-warning]",
    sourceBindings: [
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 288, 293),
    ],
  },
  {
    availability: "all-builds",
    familyId: "video-region-warning",
    necessityClass: "evidence-or-policy-required",
    note: "Taiwan playback restriction and no-embed warning.",
    selector: "[data-video-region-warning]",
    sourceBindings: [
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 295, 301),
    ],
  },
  {
    availability: "review-only",
    familyId: "video-review-state",
    necessityClass: "evidence-or-policy-required",
    note: "Review-only machine state rendered as text.",
    selector: "[data-review-state]",
    sourceBindings: [
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 303, 309),
    ],
  },
  {
    availability: "all-builds",
    familyId: "video-load-failure",
    necessityClass: "evidence-or-policy-required",
    note: "Initially hidden; becomes visible only after a controlled player-load failure.",
    selector: "[data-video-failure]",
    sourceBindings: [
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 173, 175),
      source("src/scripts/video-player.ts", "setupEmbed", 82, 92),
    ],
  },
  {
    availability: "all-builds",
    familyId: "video-unavailable",
    necessityClass: "evidence-or-policy-required",
    note: "Unavailable-source fallback notice.",
    selector: "[data-video-unavailable-notice]",
    sourceBindings: [
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 326, 331),
    ],
  },
  {
    availability: "all-builds",
    familyId: "video-region-fallback",
    necessityClass: "evidence-or-policy-required",
    note: "Adjacent fallback copy at the region-restricted consumption point.",
    selector: "[data-video-region-fallback] > p",
    sourceBindings: [
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 239, 244),
    ],
  },
  {
    availability: "all-builds",
    familyId: "video-privacy-connection-notice",
    necessityClass: "evidence-or-policy-required",
    note: "Discloses that YouTube is contacted only after activation; currently CSS-hidden at narrow mobile widths.",
    selector: "[data-video-load] .video-load-copy > small",
    sourceBindings: [
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 165, 168),
    ],
  },
  {
    availability: "all-builds",
    familyId: "video-plain-citation-facade",
    necessityClass: "evidence-or-policy-required",
    note: "Explains why an NBA source is a non-clickable citation.",
    selector: "[data-video-source-citation-facade]",
    sourceBindings: [
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 210, 232),
    ],
  },
  {
    availability: "all-builds",
    familyId: "video-source-link",
    necessityClass: "evidence-or-policy-required",
    note: "Explicit external-source action retained next to the video panel.",
    selector: "[data-video-source-link]",
    sourceBindings: [
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 192, 205),
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 245, 252),
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 314, 323),
    ],
  },
  {
    availability: "all-builds",
    familyId: "external-source-citation",
    necessityClass: "evidence-or-policy-required",
    note: "Per-source citation; clickable and NBA plain-text policies remain distinct.",
    selector: "[data-source-citation]",
    sourceBindings: [
      source(
        "src/components/citations/ExternalSourceCitation.astro",
        "ExternalSourceCitation",
        23,
        56,
      ),
    ],
  },
  {
    availability: "review-only",
    familyId: "review-fixture-marker",
    necessityClass: "evidence-or-policy-required",
    note: "Marks data-bearing review fixtures as fictional and review-only.",
    selector: "[data-review-only-marker]",
    sourceBindings: [
      source(
        "src/pages/review/fixtures/[fixture].astro",
        "ReviewFixture",
        107,
        109,
      ),
      source("src/data/review-fixtures.ts", "REVIEW_FIXTURE_NOTICE", 22, 27),
    ],
  },
  {
    availability: "review-only",
    familyId: "review-digest-panel",
    necessityClass: "evidence-or-policy-required",
    note: "Review identifiers and digests; review-only governance evidence.",
    selector: "[data-review-digests]",
    sourceBindings: [
      source("src/pages/cases/[slug].astro", "CaseDetail", 217, 250),
      source("src/pages/updates/[quarter].astro", "QuarterlyUpdate", 128, 142),
      source(
        "src/pages/review/fixtures/[fixture].astro",
        "ReviewFixture",
        214,
        325,
      ),
    ],
  },
  {
    availability: "all-builds",
    familyId: "home-observation-diagnosis-boundary",
    necessityClass: "evidence-or-policy-required",
    note: "Homepage teaching-purpose and diagnosis-source boundary.",
    routePattern: "^/$",
    selector: ".home-intro",
    sourceBindings: [source("src/pages/index.astro", "Home", 74, 77)],
  },
  {
    availability: "all-builds",
    familyId: "about-medical-purpose",
    necessityClass: "medical-legal-review-required",
    note: "Longer About-page medical-purpose statement; final treatment requires named review.",
    ownerLegalDisposition: "pending",
    routePattern: "^/about/$",
    selector: "main > p",
    sourceBindings: [source("src/pages/about.astro", "About", 14, 18)],
  },
  {
    availability: "all-builds",
    familyId: "about-policy-section",
    necessityClass: "evidence-or-policy-required",
    note: "About-page explanation sections, including the noindex/access-control distinction.",
    routePattern: "^/about/$",
    selector: "main > section",
    sourceBindings: [source("src/pages/about.astro", "About", 20, 47)],
  },
  {
    availability: "all-builds",
    familyId: "source-policy-section",
    necessityClass: "evidence-or-policy-required",
    note: "Canonical reader-facing source-policy section; photo section is stale versus v6/v5 and must not be treated as current authority.",
    routePattern: "^/source-policy/$",
    selector: "main > section",
    sourceBindings: [
      source("src/pages/source-policy.astro", "SourcePolicy", 16, 76),
    ],
  },
  {
    availability: "all-builds",
    familyId: "injury-page-scope",
    necessityClass: "redundant-or-editorial",
    note: "Per-injury page scope/count explainer; no removal is proposed before canonical mapping.",
    routePattern: "^/injuries/[^/]+/$",
    selector: "[data-injury-scope]",
    sourceBindings: [
      source("src/pages/injuries/[injury].astro", "InjuryRoute", 95, 98),
    ],
    survivingCanonicalLocation:
      "same-route:[data-injury-scope] (retained; no deletion proposed)",
  },
  {
    availability: "review-only",
    familyId: "component-lab-fictional-marker",
    necessityClass: "evidence-or-policy-required",
    note: "Marks the component lab as fictional and review-only.",
    routePattern: "^/review/component-lab/$",
    selector: "main > p",
    sourceBindings: [
      source("src/pages/review/[lab].astro", "ComponentLab", 68, 72),
    ],
  },
];

const NO_JS_RULE: NoticeRule = {
  availability: "all-builds",
  familyId: "filter-no-javascript-degradation",
  necessityClass: "evidence-or-policy-required",
  note: "Server-rendered no-JavaScript degradation notice.",
  selector: "noscript .filters-noscript",
  sourceBindings: [
    source("src/components/atlas/CaseFilters.astro", "CaseFilters", 44, 49),
  ],
};

const RUNTIME_RULES: NoticeRule[] = [
  {
    availability: "all-builds",
    familyId: "runtime-filter-success",
    necessityClass: "evidence-or-policy-required",
    note: "Live-region result count after a successful filter interaction.",
    routePattern: "^/leagues/nba/$",
    selector: "[data-filter-status]",
    sourceBindings: [
      source("src/scripts/case-filters.ts", "applyFromForm", 374, 391),
    ],
  },
  {
    availability: "all-builds",
    familyId: "runtime-filter-more-initial",
    necessityClass: "evidence-or-policy-required",
    note: "Initial progressive-result count on the filter More control.",
    routePattern: "^/leagues/nba/$",
    selector: "[data-filter-more]",
    sourceBindings: [
      source("src/scripts/case-filters.ts", "renderResults", 339, 366),
    ],
  },
  {
    availability: "all-builds",
    familyId: "runtime-filter-more-after-activation",
    necessityClass: "evidence-or-policy-required",
    note: "Progressive-result count after one More activation.",
    routePattern: "^/leagues/nba/$",
    selector: "[data-filter-more]",
    sourceBindings: [
      source("src/scripts/case-filters.ts", "renderResults", 339, 366),
    ],
  },
  {
    availability: "all-builds",
    familyId: "runtime-filter-reset",
    necessityClass: "evidence-or-policy-required",
    note: "Live-region confirmation after resetting filters.",
    routePattern: "^/leagues/nba/$",
    selector: "[data-filter-status]",
    sourceBindings: [
      source("src/scripts/case-filters.ts", "resetFilters", 394, 405),
    ],
  },
  {
    availability: "all-builds",
    familyId: "runtime-filter-index-failure",
    necessityClass: "evidence-or-policy-required",
    note: "Live-region fallback after a controlled local manifest failure.",
    routePattern: "^/leagues/nba/$",
    selector: "[data-filter-status]",
    sourceBindings: [
      source("src/scripts/case-filters.ts", "applyFromForm", 374, 391),
    ],
  },
  {
    availability: "all-builds",
    familyId: "runtime-video-load-failure",
    necessityClass: "evidence-or-policy-required",
    note: "Visible player-load fallback after every external request is blocked.",
    routePattern: "^/cases/anfernee-simons-ankle-sprain-2023/$",
    selector: "[data-video-failure]",
    sourceBindings: [
      source("src/components/cases/CaseVideo.astro", "CaseVideo", 173, 175),
      source("src/scripts/video-player.ts", "setupEmbed", 82, 92),
    ],
  },
];

const EXPECTED_NO_JAVASCRIPT_STATIC_CASE_COUNTS: Readonly<
  Record<string, number>
> = {
  "/injuries/achilles-rupture/": 7,
  "/injuries/acl/": 7,
  "/injuries/ankle-sprain/": 12,
  "/leagues/nba/": 12,
};

const CLINICAL_EXCLUSIONS = [
  {
    expectedCount: 26,
    familyId: "general-notes-frozen-clinical",
    routePattern: "^/cases/[^/]+/$",
    selector: '.notes-layer[data-layer="general"]',
    sourceBindings: [
      source("src/components/cases/LayeredNotes.astro", "LayeredNotes", 54, 64),
      source("src/content/cases/*.json", "ApprovedCaseContent", 1, 1),
    ],
  },
  {
    expectedCount: 26,
    familyId: "professional-notes-frozen-clinical",
    routePattern: "^/cases/[^/]+/$",
    selector: '.notes-layer[data-layer="professional"]',
    sourceBindings: [
      source("src/components/cases/LayeredNotes.astro", "LayeredNotes", 68, 78),
      source("src/content/cases/*.json", "ApprovedCaseContent", 1, 1),
    ],
  },
  {
    expectedCount: 3,
    familyId: "injury-overview-frozen-clinical",
    routePattern: "^/injuries/[^/]+/$",
    selector: "[data-injury-overview]",
    sourceBindings: [
      source(
        "src/components/injuries/InjuryOverview.astro",
        "InjuryOverview",
        46,
        74,
      ),
      source("src/content/injuries/*.json", "ApprovedInjuryOverview", 1, 1),
    ],
  },
  {
    expectedCount: 1,
    familyId: "quarterly-update-frozen-content",
    routePattern: "^/updates/[^/]+/$",
    selector: '[data-atlas-view="quarterly-update"]',
    sourceBindings: [
      source("src/pages/updates/[quarter].astro", "QuarterlyUpdate", 60, 143),
      source("src/content/updates/*.json", "QuarterlyUpdateContent", 1, 1),
    ],
  },
] as const;

const EXPECTED_COUNTS: Readonly<Record<string, number>> = {
  "about-medical-purpose": 1,
  "about-policy-section": 3,
  "case-card-diagnosis-confirmation": 136,
  "case-diagnosis-confirmation": 27,
  "component-lab-fictional-marker": 1,
  "external-source-citation": 136,
  "footer-independent-site": 41,
  "footer-medical-long": 41,
  "footer-medical-short": 41,
  "footer-site-copyright": 41,
  "footer-source-rights-posture": 41,
  "home-observation-diagnosis-boundary": 1,
  "injury-page-scope": 3,
  "layer-switch-explainer": 27,
  "licensed-photo-attribution": 46,
  "observed-mechanism-not-diagnosis": 27,
  "original-svg-cover-clarification": 138,
  "page-description-meta": 41,
  "review-artifact-identity-meta": 41,
  "review-banner": 41,
  "review-digest-panel": 29,
  "review-fixture-marker": 4,
  "review-robots-meta": 41,
  "review-workflow-state": 163,
  "source-policy-section": 6,
  "video-caption-status": 33,
  "video-caption-warning": 27,
  "video-load-failure": 10,
  "video-plain-citation-facade": 20,
  "video-privacy-connection-notice": 10,
  "video-region-fallback": 1,
  "video-region-warning": 1,
  "video-review-state": 31,
  "video-source-link": 12,
  "video-unavailable": 1,
};

interface RegistryNotice {
  status: string;
  text?: string | null;
  url?: string | null;
}

interface RegistrySelection {
  athleteName: string;
  license?: { name: string; token: string; url: string };
  nonEventCaption: string;
  occasionEvidence?: { basis: string; checkedAt: string };
  photographerIdentity?: { name: string };
  rightsAttribution?: {
    adapterLicense: { name: string; token?: string; url: string } | null;
    alterationState: { disclosure: string };
    copyrightNotice: RegistryNotice;
    disclaimerNotice: RegistryNotice;
    licenseBucket: string;
    otherPerFileNotice: RegistryNotice;
    workTitle: {
      evidence?: string;
      evidenceUrl?: string;
      status: string;
      text: string | null;
    };
  };
  sourceRevision?: { id: number; permalink: string };
}

interface CurrentRegistry {
  selections: RegistrySelection[];
}

interface EvidenceBox {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface SemanticNode {
  accessibleName: string | null;
  ariaLabel: string | null;
  ariaLabelledby: string | null;
  className: string;
  id: string;
  role: string | null;
  tagName: string;
}

interface LandmarkNode extends SemanticNode {
  landmarkRole: string;
}

interface SnapshotElement {
  ancestorClippingPaths: string[];
  ariaHidden: string | null;
  attributes: Record<string, string>;
  bbox: EvidenceBox;
  contextAttributes: Record<string, string>;
  cssVisible: boolean;
  domPath: string;
  familyId: string;
  hiddenAttribute: boolean;
  horizontalClipping: boolean;
  inMain: boolean;
  inViewport: boolean;
  index: number;
  landmark: LandmarkNode | null;
  links: Array<{
    href: string;
    rel: string;
    text: string;
  }>;
  nearestSemanticContainer: SemanticNode | null;
  normalizedText: string;
  normalizedTextSha256: string;
  outerHtml: string;
  outerHtmlSha256: string;
  rawText: string;
  selector: string;
  tagName: string;
  verticalClipping: boolean;
  viewportIntersection: EvidenceBox | null;
  visibilityBlockers: string[];
}

interface RouteSnapshot {
  document: {
    bodyScrollWidth: number;
    canonicalCount: number;
    htmlScrollWidth: number;
    jsonLdCount: number;
    pageHorizontalOverflow: boolean;
    title: string;
  };
  degradationState?: NoJavaScriptState;
  elements: SnapshotElement[];
  javascriptEnabled: boolean;
  route: string;
  routeClass: string;
  viewport: { height: number; id: string; width: number };
}

interface NoJavaScriptState {
  controls: {
    enabledControlCount: number;
    filterReadyAttribute: string | null;
    formControlCount: number;
    formVisible: boolean;
    resetButtonVisible: boolean;
    runtimeOperational: false;
  };
  dynamicResults: {
    hiddenAttribute: boolean;
    resultCount: number;
    visible: boolean;
  };
  notice: {
    count: number;
    visible: boolean;
  };
  staticListing: {
    caseCardCount: number;
    hiddenAttribute: boolean;
    paginationLinkCount: number;
    visible: boolean;
  };
  status: {
    normalizedText: string;
    visible: boolean;
  };
}

interface RuntimeViewportCapture {
  network: NetworkSummary;
  route: string;
  states: Array<Record<string, unknown>>;
  viewport: { height: number; id: string; width: number };
}

function digest(input: string | Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

function normalizeText(value: string): string {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim();
}

function walk(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function routeForHtml(path: string): string {
  const rel = relative(distRoot, path).split(sep).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -10)}`;
  return `/${rel}`;
}

function routeKey(route: string): string {
  if (route === "/") return "root";
  return route.replace(/^\//u, "").replace(/\/$/u, "").replaceAll("/", "__");
}

function routeClass(route: string): string {
  if (route === "/") return "home";
  if (route === "/about/") return "about";
  if (route === "/source-policy/") return "source-policy";
  if (route.startsWith("/cases/")) return "case-detail";
  if (route.startsWith("/injuries/")) return "injury-listing-overview";
  if (route.startsWith("/leagues/")) return "league-listing";
  if (route.startsWith("/updates/")) return "quarterly-update";
  if (route === "/review/component-lab/") return "review-component-lab";
  if (route.startsWith("/review/fixtures/")) return "review-fixture";
  return "other";
}

function writeCanonical(path: string, value: unknown): void {
  mkdirSync(resolve(path, ".."), { recursive: true });
  const undefinedPath = findUndefined(value);
  if (undefinedPath !== null) {
    throw new Error(`undefined evidence value at ${undefinedPath} for ${path}`);
  }
  writeFileSync(path, `${canonicalJson(value)}\n`, "utf8");
}

function findUndefined(
  value: unknown,
  path = "$",
  seen = new WeakSet<object>(),
): string | null {
  if (value === undefined) return path;
  if (value === null || typeof value !== "object") return null;
  if (seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      const found = findUndefined(entry, `${path}[${index}]`, seen);
      if (found !== null) return found;
    }
    return null;
  }
  for (const key of Object.keys(value as Record<string, unknown>)) {
    const found = findUndefined(
      (value as Record<string, unknown>)[key],
      `${path}.${key}`,
      seen,
    );
    if (found !== null) return found;
  }
  return null;
}

function contentType(path: string): string {
  const extension = extname(path).toLowerCase();
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".js") return "text/javascript; charset=utf-8";
  if (extension === ".json") return "application/json; charset=utf-8";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".avif") return "image/avif";
  if (extension === ".woff2") return "font/woff2";
  if (extension === ".txt") return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

async function startServer(): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const server: Server = createServer((request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const decoded = decodeURIComponent(url.pathname);
      const rel = decoded.replace(/^\/+/, "");
      let candidate = resolve(distRoot, rel);
      if (decoded.endsWith("/")) candidate = resolve(candidate, "index.html");
      if (
        !candidate.startsWith(`${distRoot}${sep}`) &&
        candidate !== distRoot
      ) {
        response.writeHead(400).end("bad request");
        return;
      }
      if (!statSync(candidate, { throwIfNoEntry: false })?.isFile()) {
        response.writeHead(404).end("not found");
        return;
      }
      response.setHeader("Content-Type", contentType(candidate));
      response.setHeader(
        "X-Robots-Tag",
        "noindex, nofollow, noarchive, nosnippet, noimageindex",
      );
      response.writeHead(200);
      if (request.method === "HEAD") response.end();
      else response.end(readFileSync(candidate));
    } catch {
      response.writeHead(500).end("server error");
    }
  });
  await new Promise<void>((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolvePromise());
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("local evidence server did not expose a TCP port");
  }
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolvePromise, reject) => {
        server.close((error) =>
          error === undefined ? resolvePromise() : reject(error),
        );
      }),
  };
}

function activeRulesForRoute(route: string): NoticeRule[] {
  return RULES.filter(
    (rule) =>
      rule.routePattern === undefined ||
      new RegExp(rule.routePattern, "u").test(route),
  );
}

async function installLocalOnlyGuard(
  page: Page,
  baseUrl: string,
  audit: NetworkAudit,
  coordinateControlledVideoRequests = false,
): Promise<void> {
  // tsx/esbuild names nested callbacks with a tiny `__name` helper. Browser
  // evaluation receives the callback source without that module helper, so
  // provide the semantics-preserving identity implementation in-page.
  await page.addInitScript({
    content: "globalThis.__name = (target) => target;",
  });
  const localOrigin = new URL(baseUrl).origin;
  const evidenceUrl = (url: string): string =>
    url
      .replaceAll(baseUrl, "{LOCAL_ORIGIN}")
      .replaceAll(
        encodeURIComponent(baseUrl),
        encodeURIComponent("{LOCAL_ORIGIN}"),
      );
  page.on("request", (request) => {
    const url = request.url();
    if (new URL(url).origin !== localOrigin) {
      audit.attemptedExternalUrls.push(evidenceUrl(url));
    }
  });
  page.on("requestfinished", (request) => {
    const url = request.url();
    if (new URL(url).origin !== localOrigin) {
      audit.completedExternalUrls.push(evidenceUrl(url));
    }
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (new URL(url).origin !== localOrigin) {
      audit.failedExternalUrls.push(evidenceUrl(url));
    }
  });
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (new URL(url).origin === localOrigin) await route.continue();
    else {
      if (
        coordinateControlledVideoRequests &&
        url === "https://www.youtube.com/iframe_api"
      ) {
        const deadline = Date.now() + 2_000;
        while (
          !audit.blockedExternalUrls.some((attempt) =>
            attempt.startsWith("https://www.youtube-nocookie.com/embed/"),
          ) &&
          Date.now() < deadline
        ) {
          await new Promise((resolvePromise) => setTimeout(resolvePromise, 10));
        }
      }
      audit.blockedExternalUrls.push(evidenceUrl(url));
      await route.abort("blockedbyclient");
    }
  });
}

function createNetworkAudit(): NetworkAudit {
  return {
    attemptedExternalUrls: [],
    blockedExternalUrls: [],
    completedExternalUrls: [],
    failedExternalUrls: [],
  };
}

function summarizeNetwork(audit: NetworkAudit): NetworkSummary {
  const unique = (values: string[]): string[] => [...new Set(values)].sort();
  const attempted = unique(audit.attemptedExternalUrls);
  const accounted = new Set([
    ...audit.blockedExternalUrls,
    ...audit.completedExternalUrls,
    ...audit.failedExternalUrls,
  ]);
  const unaccounted = attempted.filter((url) => !accounted.has(url));
  return {
    attemptedExternalRequestCount: audit.attemptedExternalUrls.length,
    attemptedExternalUrls: attempted,
    blockedExternalRequestCount: audit.blockedExternalUrls.length,
    blockedExternalUrls: unique(audit.blockedExternalUrls),
    completedExternalRequestCount: audit.completedExternalUrls.length,
    completedExternalUrls: unique(audit.completedExternalUrls),
    failedExternalRequestCount: audit.failedExternalUrls.length,
    failedExternalUrls: unique(audit.failedExternalUrls),
    unaccountedExternalRequestCount: unaccounted.length,
    unaccountedExternalUrls: unaccounted,
  };
}

function assertNoCompletedExternalRequests(
  audit: NetworkAudit,
  scope: string,
): void {
  if (audit.completedExternalUrls.length !== 0) {
    throw new Error(
      `${scope} completed external requests: ${[
        ...new Set(audit.completedExternalUrls),
      ].join(", ")}`,
    );
  }
  const summary = summarizeNetwork(audit);
  if (summary.unaccountedExternalRequestCount !== 0) {
    throw new Error(
      `${scope} has unaccounted external requests: ${summary.unaccountedExternalUrls.join(", ")}`,
    );
  }
}

async function snapshotPage(
  page: Page,
  route: string,
  viewport: { id: string; width: number; height: number },
  rules: NoticeRule[],
  javascriptEnabled: boolean,
): Promise<RouteSnapshot> {
  const payload = await page.evaluate(
    async ({ selectedRules, viewportValue }) => {
      const normalize = (value: string): string =>
        value.normalize("NFC").replace(/\s+/gu, " ").trim();
      const sha256 = async (value: string): Promise<string> => {
        const bytes = new TextEncoder().encode(value);
        const hash = await crypto.subtle.digest("SHA-256", bytes);
        return [...new Uint8Array(hash)]
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");
      };
      const attrs = (element: Element): Record<string, string> =>
        Object.fromEntries(
          [...element.attributes]
            .map((attribute) => [attribute.name, attribute.value] as const)
            .sort(([a], [b]) => a.localeCompare(b)),
        );
      const pathFor = (element: Element): string => {
        const parts: string[] = [];
        let current: Element | null = element;
        while (current !== null && current !== document.documentElement) {
          const tag = current.tagName.toLowerCase();
          const siblings = current.parentElement
            ? [...current.parentElement.children].filter(
                (candidate) => candidate.tagName === current!.tagName,
              )
            : [];
          const index = siblings.indexOf(current) + 1;
          parts.unshift(`${tag}:nth-of-type(${index})`);
          current = current.parentElement;
        }
        return `html > ${parts.join(" > ")}`;
      };
      const accessibleNameFor = (element: Element): string | null => {
        const ariaLabel = normalize(element.getAttribute("aria-label") ?? "");
        if (ariaLabel !== "") return ariaLabel;
        const labelledby = (element.getAttribute("aria-labelledby") ?? "")
          .split(/\s+/u)
          .filter(Boolean)
          .map((id) => document.getElementById(id))
          .filter((candidate): candidate is HTMLElement => candidate !== null)
          .map((candidate) => normalize(candidate.textContent ?? ""))
          .filter(Boolean)
          .join(" ");
        return labelledby === "" ? null : labelledby;
      };
      const semanticNode = (element: Element) => ({
        accessibleName: accessibleNameFor(element),
        ariaLabel: element.getAttribute("aria-label"),
        ariaLabelledby: element.getAttribute("aria-labelledby"),
        className: element.getAttribute("class") ?? "",
        id: element.id,
        role: element.getAttribute("role"),
        tagName: element.tagName.toLowerCase(),
      });
      const nearestSemanticContainerFor = (element: Element) => {
        const container = element.closest(
          "main,footer,header,nav,aside,article,section,figure,form,[role]",
        );
        return container === null ? null : semanticNode(container);
      };
      const landmarkRoleFor = (element: Element): string | null => {
        const explicitRole = element.getAttribute("role");
        if (
          explicitRole !== null &&
          [
            "banner",
            "complementary",
            "contentinfo",
            "form",
            "main",
            "navigation",
            "region",
            "search",
          ].includes(explicitRole)
        ) {
          if (
            (explicitRole === "form" || explicitRole === "region") &&
            accessibleNameFor(element) === null
          ) {
            return null;
          }
          return explicitRole;
        }
        const tagName = element.tagName.toLowerCase();
        if (tagName === "main") return "main";
        if (tagName === "nav") return "navigation";
        if (tagName === "aside") return "complementary";
        if (tagName === "search") return "search";
        if (
          (tagName === "header" || tagName === "footer") &&
          element.closest("article,aside,main,nav,section") === null
        ) {
          return tagName === "header" ? "banner" : "contentinfo";
        }
        if (
          (tagName === "form" || tagName === "section") &&
          accessibleNameFor(element) !== null
        ) {
          return tagName === "form" ? "form" : "region";
        }
        return null;
      };
      const landmarkFor = (element: Element) => {
        let current: Element | null = element;
        while (current !== null) {
          const landmarkRole = landmarkRoleFor(current);
          if (landmarkRole !== null) {
            return { ...semanticNode(current), landmarkRole };
          }
          current = current.parentElement;
        }
        return null;
      };
      const visibilityFor = (element: Element) => {
        const box = element.getBoundingClientRect();
        const visibilityBlockers: string[] = [];
        let current: Element | null = element;
        while (current !== null) {
          const style = getComputedStyle(current);
          const currentPath = pathFor(current);
          if (current.hasAttribute("hidden")) {
            visibilityBlockers.push(`${currentPath}:hidden`);
          }
          if (current.getAttribute("aria-hidden") === "true") {
            visibilityBlockers.push(`${currentPath}:aria-hidden`);
          }
          if (current instanceof HTMLElement && current.inert) {
            visibilityBlockers.push(`${currentPath}:inert`);
          }
          if (style.display === "none") {
            visibilityBlockers.push(`${currentPath}:display-none`);
          }
          if (
            style.visibility === "hidden" ||
            style.visibility === "collapse"
          ) {
            visibilityBlockers.push(
              `${currentPath}:visibility-${style.visibility}`,
            );
          }
          if (Number.parseFloat(style.opacity || "1") <= 0) {
            visibilityBlockers.push(`${currentPath}:opacity-zero`);
          }
          if (style.contentVisibility === "hidden") {
            visibilityBlockers.push(`${currentPath}:content-visibility-hidden`);
          }
          current = current.parentElement;
        }
        if (box.width <= 0 || box.height <= 0) {
          visibilityBlockers.push(`${pathFor(element)}:zero-area`);
        }
        const cssVisible = visibilityBlockers.length === 0;
        let ancestorLeft = Number.NEGATIVE_INFINITY;
        let ancestorRight = Number.POSITIVE_INFINITY;
        let ancestorTop = Number.NEGATIVE_INFINITY;
        let ancestorBottom = Number.POSITIVE_INFINITY;
        const ancestorClippingPaths: string[] = [];
        current = element.parentElement;
        while (current !== null && current !== document.documentElement) {
          const style = getComputedStyle(current);
          const ancestorBox = current.getBoundingClientRect();
          const clipsX = style.overflowX !== "visible";
          const clipsY = style.overflowY !== "visible";
          const hasClipPath = style.clipPath !== "none";
          if (clipsX) {
            ancestorLeft = Math.max(ancestorLeft, ancestorBox.left);
            ancestorRight = Math.min(ancestorRight, ancestorBox.right);
          }
          if (clipsY) {
            ancestorTop = Math.max(ancestorTop, ancestorBox.top);
            ancestorBottom = Math.min(ancestorBottom, ancestorBox.bottom);
          }
          if (
            hasClipPath ||
            (clipsX &&
              (box.left < ancestorBox.left - 0.5 ||
                box.right > ancestorBox.right + 0.5)) ||
            (clipsY &&
              (box.top < ancestorBox.top - 0.5 ||
                box.bottom > ancestorBox.bottom + 0.5))
          ) {
            ancestorClippingPaths.push(pathFor(current));
          }
          current = current.parentElement;
        }
        const intersectionLeft = Math.max(0, ancestorLeft, box.left);
        const intersectionRight = Math.min(
          viewportValue.width,
          ancestorRight,
          box.right,
        );
        const intersectionTop = Math.max(0, ancestorTop, box.top);
        const intersectionBottom = Math.min(
          viewportValue.height,
          ancestorBottom,
          box.bottom,
        );
        const viewportIntersection =
          cssVisible &&
          intersectionRight > intersectionLeft &&
          intersectionBottom > intersectionTop
            ? {
                height: Number(
                  (intersectionBottom - intersectionTop).toFixed(3),
                ),
                width: Number(
                  (intersectionRight - intersectionLeft).toFixed(3),
                ),
                x: Number(intersectionLeft.toFixed(3)),
                y: Number(intersectionTop.toFixed(3)),
              }
            : null;
        return {
          ancestorClippingPaths: [...new Set(ancestorClippingPaths)],
          box,
          cssVisible,
          horizontalClipping:
            cssVisible &&
            (box.left < -0.5 ||
              box.right > viewportValue.width + 0.5 ||
              box.left < ancestorLeft - 0.5 ||
              box.right > ancestorRight + 0.5),
          inViewport: viewportIntersection !== null,
          verticalClipping:
            cssVisible &&
            (box.top < ancestorTop - 0.5 || box.bottom > ancestorBottom + 0.5),
          viewportIntersection,
          visibilityBlockers: [...new Set(visibilityBlockers)],
        };
      };
      const contextAttrs = (element: Element): Record<string, string> => {
        const context = element.closest(
          "[data-case-cover],[data-case-thumb],[data-case-card],[data-atlas-view],[data-video-scope],[data-injury-overview]",
        );
        return context === null ? {} : attrs(context);
      };
      const values: Array<Record<string, unknown>> = [];
      for (const rule of selectedRules) {
        const elements = [...document.querySelectorAll(rule.selector)];
        for (const [index, element] of elements.entries()) {
          const rawText =
            element instanceof HTMLMetaElement
              ? element.content
              : (element.textContent ?? "");
          const normalizedText = normalize(rawText);
          const outerHtml = element.outerHTML;
          const visibility = visibilityFor(element);
          const box = visibility.box;
          values.push({
            ancestorClippingPaths: visibility.ancestorClippingPaths,
            ariaHidden: element.getAttribute("aria-hidden"),
            attributes: attrs(element),
            bbox: {
              height: Number(box.height.toFixed(3)),
              width: Number(box.width.toFixed(3)),
              x: Number(box.x.toFixed(3)),
              y: Number(box.y.toFixed(3)),
            },
            contextAttributes: contextAttrs(element),
            cssVisible: visibility.cssVisible,
            domPath: pathFor(element),
            familyId: rule.familyId,
            hiddenAttribute: element.hasAttribute("hidden"),
            horizontalClipping: visibility.horizontalClipping,
            inMain: element.closest("main") !== null,
            inViewport: visibility.inViewport,
            index,
            landmark: landmarkFor(element),
            links: [
              ...(element.matches("a[href]") ? [element] : []),
              ...element.querySelectorAll("a[href]"),
            ].map((anchor) => {
              const absoluteUrl = new URL((anchor as HTMLAnchorElement).href);
              return {
                href:
                  absoluteUrl.origin === location.origin
                    ? `${absoluteUrl.pathname}${absoluteUrl.search}${absoluteUrl.hash}`
                    : absoluteUrl.href,
                rel: anchor.getAttribute("rel") ?? "",
                text: normalize(anchor.textContent ?? ""),
              };
            }),
            nearestSemanticContainer: nearestSemanticContainerFor(element),
            normalizedText,
            normalizedTextSha256: await sha256(normalizedText),
            outerHtml,
            outerHtmlSha256: await sha256(outerHtml),
            rawText,
            selector: rule.selector,
            tagName: element.tagName.toLowerCase(),
            verticalClipping: visibility.verticalClipping,
            viewportIntersection: visibility.viewportIntersection,
            visibilityBlockers: visibility.visibilityBlockers,
          });
        }
      }
      return {
        document: {
          bodyScrollWidth: document.body.scrollWidth,
          canonicalCount: document.querySelectorAll('link[rel="canonical"]')
            .length,
          htmlScrollWidth: document.documentElement.scrollWidth,
          jsonLdCount: document.querySelectorAll(
            'script[type="application/ld+json"]',
          ).length,
          pageHorizontalOverflow:
            document.documentElement.scrollWidth > viewportValue.width + 1,
          title: document.title,
        },
        elements: values,
      };
    },
    {
      selectedRules: rules.map((rule) => ({
        familyId: rule.familyId,
        selector: rule.selector,
      })),
      viewportValue: viewport,
    },
  );
  return {
    ...payload,
    javascriptEnabled,
    route,
    routeClass: routeClass(route),
    viewport,
  } as unknown as RouteSnapshot;
}

async function gotoLocal(
  page: Page,
  baseUrl: string,
  route: string,
): Promise<void> {
  const response = await page.goto(`${baseUrl}${route}`, {
    waitUntil: "load",
  });
  if (response === null || !response.ok()) {
    throw new Error(
      `failed to load ${route}: ${response?.status() ?? "no response"}`,
    );
  }
  await page.evaluate("document.fonts.ready");
}

async function captureViewport(
  browser: Browser,
  baseUrl: string,
  routes: string[],
  viewport: { id: string; width: number; height: number },
): Promise<{ network: NetworkSummary; snapshots: RouteSnapshot[] }> {
  const audit = createNetworkAudit();
  const context = await browser.newContext({
    javaScriptEnabled: true,
    serviceWorkers: "block",
    viewport: { height: viewport.height, width: viewport.width },
  });
  const page = await context.newPage();
  await installLocalOnlyGuard(page, baseUrl, audit);
  const snapshots: RouteSnapshot[] = [];
  for (const route of routes) {
    await gotoLocal(page, baseUrl, route);
    const snapshot = await snapshotPage(
      page,
      route,
      viewport,
      activeRulesForRoute(route),
      true,
    );
    if (snapshot.document.pageHorizontalOverflow) {
      throw new Error(`horizontal overflow at ${viewport.id} ${route}`);
    }
    snapshots.push(snapshot);
    writeCanonical(
      resolve(evidenceRoot, "dom", viewport.id, `${routeKey(route)}.json`),
      snapshot,
    );
  }
  assertNoCompletedExternalRequests(audit, viewport.id);
  await context.close();
  return { network: summarizeNetwork(audit), snapshots };
}

async function captureNoJavaScript(
  browser: Browser,
  baseUrl: string,
  routes: string[],
  viewport: { id: string; width: number; height: number },
): Promise<{ network: NetworkSummary; snapshots: RouteSnapshot[] }> {
  const audit = createNetworkAudit();
  const context = await browser.newContext({
    javaScriptEnabled: false,
    serviceWorkers: "block",
    viewport: { height: viewport.height, width: viewport.width },
  });
  const page = await context.newPage();
  await installLocalOnlyGuard(page, baseUrl, audit);
  const snapshots: RouteSnapshot[] = [];
  for (const route of routes) {
    await gotoLocal(page, baseUrl, route);
    const captured = await snapshotPage(
      page,
      route,
      { ...viewport, id: `${viewport.id}-javascript-disabled` },
      [NO_JS_RULE],
      false,
    );
    const degradationState = await page.evaluate((): NoJavaScriptState => {
      const rendered = (element: Element | null): boolean => {
        if (element === null) return false;
        let current: Element | null = element;
        while (current !== null) {
          const style = getComputedStyle(current);
          if (
            current.hasAttribute("hidden") ||
            current.getAttribute("aria-hidden") === "true" ||
            (current instanceof HTMLElement && current.inert) ||
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.visibility === "collapse" ||
            Number.parseFloat(style.opacity || "1") <= 0
          ) {
            return false;
          }
          current = current.parentElement;
        }
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      };
      const block = document.querySelector<HTMLElement>("[data-case-filters]");
      const form =
        document.querySelector<HTMLFormElement>("[data-filter-form]");
      const reset = document.querySelector<HTMLElement>("[data-filter-reset]");
      const notice = document.querySelector<HTMLElement>(".filters-noscript");
      const staticListing = document.querySelector<HTMLElement>(
        "[data-static-listing]",
      );
      const dynamicResults = document.querySelector<HTMLElement>(
        "[data-filter-results]",
      );
      const status = document.querySelector<HTMLElement>(
        "[data-filter-status]",
      );
      const controls =
        form === null
          ? []
          : [
              ...form.querySelectorAll<
                HTMLInputElement | HTMLSelectElement | HTMLButtonElement
              >("input,select,button"),
            ];
      return {
        controls: {
          enabledControlCount: controls.filter((control) => !control.disabled)
            .length,
          filterReadyAttribute:
            block?.getAttribute("data-filters-ready") ?? null,
          formControlCount: controls.length,
          formVisible: rendered(form),
          resetButtonVisible: rendered(reset),
          runtimeOperational: false,
        },
        dynamicResults: {
          hiddenAttribute: dynamicResults?.hasAttribute("hidden") ?? false,
          resultCount:
            dynamicResults?.querySelectorAll(":scope > li").length ?? 0,
          visible: rendered(dynamicResults),
        },
        notice: {
          count: document.querySelectorAll(".filters-noscript").length,
          visible: rendered(notice),
        },
        staticListing: {
          caseCardCount:
            staticListing?.querySelectorAll("[data-case-card]").length ?? 0,
          hiddenAttribute: staticListing?.hasAttribute("hidden") ?? false,
          paginationLinkCount:
            staticListing?.querySelectorAll('a[href*="/page/"]').length ?? 0,
          visible: rendered(staticListing),
        },
        status: {
          normalizedText: (status?.textContent ?? "")
            .normalize("NFC")
            .replace(/\s+/gu, " ")
            .trim(),
          visible: rendered(status),
        },
      };
    });
    const snapshot: RouteSnapshot = { ...captured, degradationState };
    if (
      snapshot.elements.length !== 1 ||
      snapshot.elements[0]?.cssVisible !== true ||
      snapshot.elements[0]?.inMain !== true ||
      snapshot.elements[0]?.inViewport !== true ||
      snapshot.document.pageHorizontalOverflow ||
      !degradationState.notice.visible ||
      degradationState.notice.count !== 1 ||
      !degradationState.staticListing.visible ||
      degradationState.staticListing.hiddenAttribute ||
      degradationState.staticListing.caseCardCount !==
        EXPECTED_NO_JAVASCRIPT_STATIC_CASE_COUNTS[route] ||
      degradationState.dynamicResults.visible ||
      !degradationState.dynamicResults.hiddenAttribute ||
      degradationState.dynamicResults.resultCount !== 0 ||
      degradationState.status.visible ||
      degradationState.status.normalizedText !== "" ||
      !degradationState.controls.formVisible ||
      !degradationState.controls.resetButtonVisible ||
      degradationState.controls.filterReadyAttribute !== null ||
      degradationState.controls.formControlCount === 0 ||
      degradationState.controls.enabledControlCount !==
        degradationState.controls.formControlCount
    ) {
      throw new Error(
        `no-JavaScript degradation contract failed at ${viewport.id} ${route}`,
      );
    }
    snapshots.push(snapshot);
    writeCanonical(
      resolve(
        evidenceRoot,
        "dom",
        "javascript-disabled",
        viewport.id,
        `${routeKey(route)}.json`,
      ),
      snapshot,
    );
  }
  assertNoCompletedExternalRequests(audit, `${viewport.id} no-JavaScript`);
  await context.close();
  return { network: summarizeNetwork(audit), snapshots };
}

const runtimeStructureRule = (
  familyId: string,
  selector: string,
): NoticeRule => ({
  availability: "all-builds",
  familyId,
  necessityClass: "evidence-or-policy-required",
  note: "Runtime structure observation only.",
  selector,
  sourceBindings: [],
});

const FILTER_RUNTIME_STRUCTURE_RULES = [
  runtimeStructureRule("structure-filter-block", "[data-case-filters]"),
  runtimeStructureRule("structure-filter-form", "[data-filter-form]"),
  runtimeStructureRule("structure-filter-reset", "[data-filter-reset]"),
  runtimeStructureRule("structure-filter-status", "[data-filter-status]"),
  runtimeStructureRule("structure-filter-results", "[data-filter-results]"),
  runtimeStructureRule("structure-filter-more", "[data-filter-more]"),
  runtimeStructureRule("structure-static-listing", "[data-static-listing]"),
] as const;

const VIDEO_RUNTIME_STRUCTURE_RULES = [
  runtimeStructureRule("structure-video-root", "[data-video-embed]"),
  runtimeStructureRule("structure-video-facade", "[data-video-facade]"),
  runtimeStructureRule("structure-video-load", "[data-video-load]"),
  runtimeStructureRule("structure-video-failure", "[data-video-failure]"),
  runtimeStructureRule("structure-video-iframe", "[data-video-stage] iframe"),
  runtimeStructureRule(
    "structure-video-source-link",
    "[data-video-source-link]",
  ),
  runtimeStructureRule(
    "structure-video-timeline-link",
    "[data-video-timeline] a[data-timecode]",
  ),
] as const;

async function captureRuntimeState(
  page: Page,
  route: string,
  viewport: { id: string; width: number; height: number },
  stateId: string,
  noticeRules: NoticeRule[],
  structureRules: readonly NoticeRule[],
  kind: "filter" | "video",
): Promise<Record<string, unknown>> {
  await page.evaluate("document.fonts.ready");
  const snapshot = await snapshotPage(
    page,
    route,
    viewport,
    [...noticeRules, ...structureRules],
    true,
  );
  const noticeFamilies = new Set(noticeRules.map((rule) => rule.familyId));
  const notices = snapshot.elements.filter((element) =>
    noticeFamilies.has(element.familyId),
  );
  const structures = snapshot.elements.filter(
    (element) => !noticeFamilies.has(element.familyId),
  );
  const metrics = await page.evaluate((runtimeKind) => {
    if (runtimeKind === "filter") {
      const staticListing = document.querySelector<HTMLElement>(
        "[data-static-listing]",
      );
      const dynamicResults = document.querySelector<HTMLElement>(
        "[data-filter-results]",
      );
      const status = document.querySelector<HTMLElement>(
        "[data-filter-status]",
      );
      return {
        dynamicResultCount:
          dynamicResults?.querySelectorAll(":scope > li.filter-result")
            .length ?? 0,
        dynamicResultsHiddenAttribute:
          dynamicResults?.hasAttribute("hidden") ?? false,
        filterReadyAttribute:
          document
            .querySelector("[data-case-filters]")
            ?.getAttribute("data-filters-ready") ?? null,
        historyPathAndSearch: `${location.pathname}${location.search}`,
        moreButtonCount: document.querySelectorAll("[data-filter-more]").length,
        staticCaseCardCount:
          staticListing?.querySelectorAll("[data-case-card]").length ?? 0,
        staticListingHiddenAttribute:
          staticListing?.hasAttribute("hidden") ?? false,
        statusText: (status?.textContent ?? "")
          .normalize("NFC")
          .replace(/\s+/gu, " ")
          .trim(),
      };
    }
    const root = document.querySelector<HTMLElement>("[data-video-embed]");
    return {
      facadeHiddenAttribute:
        document.querySelector("[data-video-facade]")?.hasAttribute("hidden") ??
        false,
      failureHiddenAttribute:
        document
          .querySelector("[data-video-failure]")
          ?.hasAttribute("hidden") ?? false,
      focusedElementIsLoadButton:
        document.activeElement?.matches("[data-video-load]") ?? false,
      iframeCount: document.querySelectorAll("[data-video-stage] iframe")
        .length,
      sourceLinkCount: document.querySelectorAll("[data-video-source-link]")
        .length,
      timelineLinkCount: document.querySelectorAll(
        "[data-video-timeline] a[data-timecode]",
      ).length,
      videoState: root?.getAttribute("data-video-state") ?? null,
    };
  }, kind);
  return {
    document: snapshot.document,
    kind,
    metrics,
    notices,
    route,
    stateId,
    structures,
    viewport,
  };
}

function runtimeState(
  capture: RuntimeViewportCapture,
  stateId: string,
): Record<string, unknown> {
  const state = capture.states.find(
    (candidate) => candidate.stateId === stateId,
  );
  if (state === undefined) {
    throw new Error(`missing ${capture.viewport.id} runtime state ${stateId}`);
  }
  return state;
}

function stateElements(
  state: Record<string, unknown>,
  field: "notices" | "structures",
): SnapshotElement[] {
  return state[field] as SnapshotElement[];
}

function stateMetric(state: Record<string, unknown>, key: string): unknown {
  return (state.metrics as Record<string, unknown>)[key];
}

function oneStateElement(
  state: Record<string, unknown>,
  field: "notices" | "structures",
  familyId: string,
): SnapshotElement {
  const matches = stateElements(state, field).filter(
    (element) => element.familyId === familyId,
  );
  if (matches.length !== 1) {
    throw new Error(
      `${String(state.stateId)} expected one ${familyId}, got ${matches.length}`,
    );
  }
  return matches[0]!;
}

function assertRuntimeViewport(capture: RuntimeViewportCapture): void {
  const initial = runtimeState(capture, "filter-initial");
  const success = runtimeState(capture, "filter-success");
  const more = runtimeState(capture, "filter-more-after-one-activation");
  const reset = runtimeState(capture, "filter-reset");
  const failure = runtimeState(capture, "filter-index-failure");
  const videoInitial = runtimeState(capture, "video-before-activation");
  const videoFailure = runtimeState(capture, "video-player-controlled-failure");
  const structure = (state: Record<string, unknown>, familyId: string) =>
    oneStateElement(state, "structures", familyId);
  const notice = (state: Record<string, unknown>, familyId: string) =>
    oneStateElement(state, "notices", familyId);

  if (
    !structure(initial, "structure-static-listing").cssVisible ||
    structure(initial, "structure-filter-results").cssVisible ||
    structure(initial, "structure-filter-status").cssVisible ||
    stateMetric(initial, "staticCaseCardCount") !== 12 ||
    stateMetric(initial, "dynamicResultCount") !== 0 ||
    stateMetric(initial, "filterReadyAttribute") !== "true"
  ) {
    throw new Error(`${capture.viewport.id} filter initial-state drift`);
  }
  if (
    notice(success, "runtime-filter-success").normalizedText !==
      "符合條件的案例共 26 筆。" ||
    !notice(success, "runtime-filter-success").cssVisible ||
    structure(success, "structure-static-listing").cssVisible ||
    !structure(success, "structure-filter-results").cssVisible ||
    stateMetric(success, "dynamicResultCount") !== 12 ||
    stateMetric(success, "staticListingHiddenAttribute") !== true ||
    notice(success, "runtime-filter-more-initial").normalizedText !==
      "顯示更多結果（已顯示 12／26 筆）"
  ) {
    throw new Error(`${capture.viewport.id} filter success-state drift`);
  }
  if (
    notice(more, "runtime-filter-more-after-activation").normalizedText !==
      "顯示更多結果（已顯示 24／26 筆）" ||
    stateMetric(more, "dynamicResultCount") !== 24 ||
    stateMetric(more, "staticListingHiddenAttribute") !== true
  ) {
    throw new Error(`${capture.viewport.id} filter More-state drift`);
  }
  if (
    notice(reset, "runtime-filter-reset").normalizedText !==
      "已重設全部篩選；顯示完整靜態列表。" ||
    !structure(reset, "structure-static-listing").cssVisible ||
    structure(reset, "structure-filter-results").cssVisible ||
    stateMetric(reset, "dynamicResultCount") !== 0 ||
    stateMetric(reset, "staticListingHiddenAttribute") !== false
  ) {
    throw new Error(`${capture.viewport.id} filter reset-state drift`);
  }
  if (
    notice(failure, "runtime-filter-index-failure").normalizedText !==
      "篩選索引載入失敗；下方靜態列表與分頁仍完整可用。" ||
    !structure(failure, "structure-static-listing").cssVisible ||
    structure(failure, "structure-filter-results").cssVisible ||
    stateMetric(failure, "dynamicResultCount") !== 0 ||
    stateMetric(failure, "staticListingHiddenAttribute") !== false
  ) {
    throw new Error(`${capture.viewport.id} filter failure-state drift`);
  }
  if (
    stateMetric(videoInitial, "videoState") !== "idle" ||
    stateMetric(videoInitial, "iframeCount") !== 0 ||
    structure(videoInitial, "structure-video-facade").cssVisible !== true ||
    structure(videoInitial, "structure-video-failure").cssVisible !== false ||
    stateMetric(videoInitial, "sourceLinkCount") !== 1 ||
    stateMetric(videoInitial, "timelineLinkCount") !== 1
  ) {
    throw new Error(`${capture.viewport.id} video initial-state drift`);
  }
  if (
    notice(videoFailure, "runtime-video-load-failure").normalizedText !==
      "站內播放器載入失敗，請改用下方原始連結；時間軸連結會直接開啟原始平台。" ||
    !notice(videoFailure, "runtime-video-load-failure").cssVisible ||
    stateMetric(videoFailure, "videoState") !== "failed" ||
    stateMetric(videoFailure, "iframeCount") !== 0 ||
    stateMetric(videoFailure, "facadeHiddenAttribute") !== false ||
    stateMetric(videoFailure, "failureHiddenAttribute") !== false ||
    stateMetric(videoFailure, "focusedElementIsLoadButton") !== true ||
    stateMetric(videoFailure, "sourceLinkCount") !== 1 ||
    stateMetric(videoFailure, "timelineLinkCount") !== 1 ||
    structure(videoFailure, "structure-video-facade").cssVisible !== true ||
    structure(videoFailure, "structure-video-source-link").links.length !== 1 ||
    stateElements(videoFailure, "structures").filter(
      (element) => element.familyId === "structure-video-timeline-link",
    ).length !== 1
  ) {
    throw new Error(`${capture.viewport.id} video failure-state drift`);
  }
  if (
    capture.network.completedExternalRequestCount !== 0 ||
    capture.network.blockedExternalRequestCount !== 2 ||
    canonicalJson(capture.network.blockedExternalUrls) !==
      canonicalJson([
        "https://www.youtube-nocookie.com/embed/8TIJGIRP634?enablejsapi=1&origin=%7BLOCAL_ORIGIN%7D",
        "https://www.youtube.com/iframe_api",
      ])
  ) {
    throw new Error(`${capture.viewport.id} runtime network policy drift`);
  }
}

async function captureRuntimeStates(
  browser: Browser,
  baseUrl: string,
  viewport: { id: string; width: number; height: number },
): Promise<RuntimeViewportCapture> {
  const context = await browser.newContext({
    javaScriptEnabled: true,
    serviceWorkers: "block",
    viewport: { height: viewport.height, width: viewport.width },
  });
  const audit = createNetworkAudit();
  const states: Array<Record<string, unknown>> = [];
  const filterRoute = "/leagues/nba/";
  const page = await context.newPage();
  await installLocalOnlyGuard(page, baseUrl, audit);
  await gotoLocal(page, baseUrl, filterRoute);
  states.push(
    await captureRuntimeState(
      page,
      filterRoute,
      viewport,
      "filter-initial",
      [],
      FILTER_RUNTIME_STRUCTURE_RULES,
      "filter",
    ),
  );
  await page.locator('select[name="league"]').selectOption("nba");
  await page
    .locator("[data-filter-status]")
    .filter({ hasText: "符合條件的案例共" })
    .waitFor();
  states.push(
    await captureRuntimeState(
      page,
      filterRoute,
      viewport,
      "filter-success",
      [RUNTIME_RULES[0]!, RUNTIME_RULES[1]!],
      FILTER_RUNTIME_STRUCTURE_RULES,
      "filter",
    ),
  );
  await page.locator("[data-filter-more]").click();
  states.push(
    await captureRuntimeState(
      page,
      filterRoute,
      viewport,
      "filter-more-after-one-activation",
      [RUNTIME_RULES[2]!],
      FILTER_RUNTIME_STRUCTURE_RULES,
      "filter",
    ),
  );
  await page.locator("[data-filter-reset]").click();
  states.push(
    await captureRuntimeState(
      page,
      filterRoute,
      viewport,
      "filter-reset",
      [RUNTIME_RULES[3]!],
      FILTER_RUNTIME_STRUCTURE_RULES,
      "filter",
    ),
  );

  const failurePage = await context.newPage();
  await installLocalOnlyGuard(failurePage, baseUrl, audit);
  await failurePage.route("**/case-index/manifest.json", async (route) => {
    await route.fulfill({ body: "controlled failure", status: 503 });
  });
  await gotoLocal(failurePage, baseUrl, filterRoute);
  await failurePage.locator('input[name="keyword"]').fill("controlled-failure");
  await failurePage
    .locator("[data-filter-status]")
    .filter({ hasText: "篩選索引載入失敗" })
    .waitFor();
  states.push(
    await captureRuntimeState(
      failurePage,
      filterRoute,
      viewport,
      "filter-index-failure",
      [RUNTIME_RULES[4]!],
      FILTER_RUNTIME_STRUCTURE_RULES,
      "filter",
    ),
  );

  const videoRoute = "/cases/anfernee-simons-ankle-sprain-2023/";
  const videoPage = await context.newPage();
  await installLocalOnlyGuard(videoPage, baseUrl, audit, true);
  await gotoLocal(videoPage, baseUrl, videoRoute);
  states.push(
    await captureRuntimeState(
      videoPage,
      videoRoute,
      viewport,
      "video-before-activation",
      [],
      VIDEO_RUNTIME_STRUCTURE_RULES,
      "video",
    ),
  );
  await videoPage.locator("[data-video-load]").click();
  await videoPage
    .locator('[data-video-state="failed"] [data-video-failure]')
    .waitFor({ state: "visible", timeout: 12_000 });
  states.push(
    await captureRuntimeState(
      videoPage,
      videoRoute,
      viewport,
      "video-player-controlled-failure",
      [RUNTIME_RULES[5]!],
      VIDEO_RUNTIME_STRUCTURE_RULES,
      "video",
    ),
  );

  assertNoCompletedExternalRequests(audit, `${viewport.id} runtime`);
  await context.close();
  const capture: RuntimeViewportCapture = {
    network: summarizeNetwork(audit),
    route: "multiple-controlled-local-routes",
    states,
    viewport,
  };
  assertRuntimeViewport(capture);
  return capture;
}

function assertCounts(snapshots: RouteSnapshot[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const snapshot of snapshots) {
    for (const element of snapshot.elements) {
      counts[element.familyId] = (counts[element.familyId] ?? 0) + 1;
    }
  }
  for (const [familyId, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (counts[familyId] !== expected) {
      throw new Error(
        `notice count drift for ${familyId}: expected ${expected}, got ${counts[familyId] ?? 0}`,
      );
    }
  }
  const unexpected = Object.keys(counts).filter(
    (familyId) => EXPECTED_COUNTS[familyId] === undefined,
  );
  if (unexpected.length !== 0) {
    throw new Error(`unbound notice families: ${unexpected.join(", ")}`);
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function assertNoticeTextShapeParity(
  desktopSnapshots: RouteSnapshot[],
  mobileSnapshots: RouteSnapshot[],
): void {
  const byRoute = new Map(
    mobileSnapshots.map((snapshot) => [snapshot.route, snapshot]),
  );
  for (const desktopSnapshot of desktopSnapshots) {
    const mobileSnapshot = byRoute.get(desktopSnapshot.route);
    if (mobileSnapshot === undefined) {
      throw new Error(`missing mobile snapshot for ${desktopSnapshot.route}`);
    }
    const shape = (snapshot: RouteSnapshot): string[] =>
      snapshot.elements.map(
        (element) =>
          `${element.familyId}\t${element.index}\t${element.normalizedTextSha256}`,
      );
    if (
      canonicalJson(shape(desktopSnapshot)) !==
      canonicalJson(shape(mobileSnapshot))
    ) {
      throw new Error(
        `desktop/mobile notice DOM drift at ${desktopSnapshot.route}`,
      );
    }
  }
}

function viewportVisibilityDeltas(
  desktopSnapshots: RouteSnapshot[],
  mobileSnapshots: RouteSnapshot[],
): Array<Record<string, unknown>> {
  const mobileByRoute = new Map(
    mobileSnapshots.map((snapshot) => [snapshot.route, snapshot]),
  );
  const deltas: Array<Record<string, unknown>> = [];
  for (const desktopSnapshot of desktopSnapshots) {
    const mobileSnapshot = mobileByRoute.get(desktopSnapshot.route);
    if (mobileSnapshot === undefined) continue;
    for (const [index, desktopElement] of desktopSnapshot.elements.entries()) {
      const mobileElement = mobileSnapshot.elements[index];
      if (
        mobileElement === undefined ||
        desktopElement.familyId !== mobileElement.familyId ||
        desktopElement.normalizedTextSha256 !==
          mobileElement.normalizedTextSha256
      ) {
        throw new Error(
          `cannot compare viewport visibility at ${desktopSnapshot.route} index ${index}`,
        );
      }
      const desktopState = {
        cssVisible: desktopElement.cssVisible,
        horizontalClipping: desktopElement.horizontalClipping,
        inViewport: desktopElement.inViewport,
        verticalClipping: desktopElement.verticalClipping,
      };
      const mobileState = {
        cssVisible: mobileElement.cssVisible,
        horizontalClipping: mobileElement.horizontalClipping,
        inViewport: mobileElement.inViewport,
        verticalClipping: mobileElement.verticalClipping,
      };
      if (canonicalJson(desktopState) !== canonicalJson(mobileState)) {
        deltas.push({
          desktop: desktopState,
          familyId: desktopElement.familyId,
          index: desktopElement.index,
          mobile: mobileState,
          route: desktopSnapshot.route,
        });
      }
    }
  }
  return deltas;
}

function definitionId(familyId: string, textHash: string): string {
  return `${familyId}:${textHash.slice(0, 16)}`;
}

function attributionSegments(
  element: SnapshotElement,
  registryByRevision: Map<string, RegistrySelection>,
): unknown[] | undefined {
  if (element.familyId !== "licensed-photo-attribution") return undefined;
  const revisionId = element.attributes["data-source-revision-id"];
  const selection =
    revisionId === undefined ? undefined : registryByRevision.get(revisionId);
  const facts = selection?.rightsAttribution;
  if (
    selection === undefined ||
    facts === undefined ||
    selection.license === undefined ||
    selection.occasionEvidence === undefined ||
    selection.photographerIdentity === undefined ||
    selection.sourceRevision === undefined
  ) {
    throw new Error(
      `missing registry attribution for revision ${revisionId ?? "unknown"}`,
    );
  }
  const isBySaCrop = facts.licenseBucket === "cc-by-sa";
  if (isBySaCrop !== (facts.adapterLicense !== null)) {
    throw new Error(
      `Adapter's License applicability drift for ${selection.athleteName}`,
    );
  }
  const suppliedTitle = facts.workTitle.status === "supplied";
  const suppliedCopyright = facts.copyrightNotice.status === "supplied";
  const suppliedDisclaimer = facts.disclaimerNotice.status === "supplied";
  const suppliedOtherNotice = facts.otherPerFileNotice.status === "supplied";
  return [
    {
      appliesWhen: "every governed licensed-photo use",
      currentlyApplies: true,
      fieldId: "creator",
      necessityClass: "license-required",
      obligationBasis: "CC attribution: identify the creator.",
      value: selection.photographerIdentity.name,
    },
    {
      appliesWhen: "every governed licensed-photo use",
      currentlyApplies: true,
      fieldId: "license",
      necessityClass: "license-required",
      obligationBasis:
        "CC attribution: identify and link the exact license/version.",
      value: {
        license: selection.license,
        licenseBucket: facts.licenseBucket,
      },
    },
    {
      appliesWhen: "every governed licensed-photo use",
      currentlyApplies: true,
      fieldId: "source",
      necessityClass: "license-required",
      obligationBasis:
        "CC attribution: retain a URI or hyperlink to the licensed material.",
      value: selection.sourceRevision,
    },
    {
      appliesWhen: "the local asset is resized/cropped/adapted",
      currentlyApplies: true,
      fieldId: "change-indication",
      necessityClass: "license-required",
      obligationBasis:
        "CC attribution: indicate modifications to the licensed material.",
      value: facts.alterationState.disclosure,
    },
    {
      appliesWhen: "upstream supplies a work title",
      currentlyApplies: suppliedTitle,
      fieldId: "supplied-work-title",
      necessityClass: "license-required",
      obligationBasis:
        "Conditionally retained CC attribution field when supplied upstream.",
      value: suppliedTitle ? facts.workTitle : null,
    },
    {
      appliesWhen: "upstream supplies no distinct work title",
      currentlyApplies: !suppliedTitle,
      fieldId: "not-supplied-title-state",
      necessityClass: "evidence-or-policy-required",
      obligationBasis:
        "Decision 13 provenance evidence; not itself a CC-required statement.",
      value: !suppliedTitle ? facts.workTitle : null,
    },
    {
      appliesWhen: "upstream supplies a copyright notice",
      currentlyApplies: suppliedCopyright,
      fieldId: "supplied-copyright-notice",
      necessityClass: "license-required",
      obligationBasis: "Retain-if-supplied CC notice field.",
      value: facts.copyrightNotice,
    },
    {
      appliesWhen: "upstream supplies a disclaimer notice",
      currentlyApplies: suppliedDisclaimer,
      fieldId: "supplied-disclaimer-notice",
      necessityClass: "license-required",
      obligationBasis: "Retain-if-supplied CC notice field.",
      value: facts.disclaimerNotice,
    },
    {
      appliesWhen:
        "the source record supplies a personality or other per-file warning",
      currentlyApplies: suppliedOtherNotice,
      fieldId: "source-personality-or-other-warning",
      necessityClass: "evidence-or-policy-required",
      obligationBasis:
        "Source/provenance policy; not classified as a CC attribution term.",
      value: facts.otherPerFileNotice,
    },
    {
      appliesWhen: "a CC BY-SA governed photo is cropped/adapted",
      currentlyApplies: isBySaCrop,
      fieldId: "adapter-license",
      necessityClass: "license-required",
      obligationBasis:
        "ShareAlike Adapter's License disclosure, only for BY-SA crops.",
      value: isBySaCrop ? facts.adapterLicense : null,
    },
    {
      appliesWhen: "every governed named-cover presentation",
      currentlyApplies: true,
      fieldId: "non-event-occasion-and-risk-clarification",
      necessityClass: "evidence-or-policy-required",
      obligationBasis:
        "Decision 13 occasion/provenance boundary; not copyright clearance.",
      value: {
        nonEventCaption: selection.nonEventCaption,
        occasionEvidence: selection.occasionEvidence,
        sourceRiskNoClearance: "此分類不代表著作權、肖像權或公開使用已獲放行。",
      },
    },
  ];
}

function consumptionPointCriterion(familyId: string): string {
  if (
    familyId === "review-robots-meta" ||
    familyId === "review-artifact-identity-meta" ||
    familyId === "page-description-meta"
  ) {
    return "nonvisual-metadata";
  }
  if (
    familyId === "footer-medical-short" ||
    familyId === "footer-medical-long" ||
    familyId === "about-medical-purpose"
  ) {
    return "clinical-main-content";
  }
  if (familyId.startsWith("footer-")) return "designated-footer";
  if (familyId === "review-banner") return "review-boundary";
  if (familyId === "video-load-failure") return "runtime-failure-state";
  if (familyId.startsWith("runtime-filter-")) {
    return familyId.includes("more")
      ? "runtime-filter-control"
      : "runtime-filter-live-region";
  }
  if (familyId === "runtime-video-load-failure") {
    return "runtime-video-fallback";
  }
  return "adjacent-main-content";
}

function visibleAtConsumptionPoint(element: SnapshotElement): boolean {
  const criterion = consumptionPointCriterion(element.familyId);
  if (criterion === "nonvisual-metadata") return false;
  if (criterion === "clinical-main-content") {
    return element.cssVisible && element.inMain;
  }
  if (criterion === "designated-footer") {
    return element.cssVisible && element.landmark?.tagName === "footer";
  }
  if (criterion === "review-boundary") {
    return element.cssVisible && element.inViewport;
  }
  if (criterion === "runtime-failure-state") return false;
  return element.cssVisible && element.inMain;
}

function viewportObservation(
  element: SnapshotElement,
  viewport: { id: string; width: number; height: number },
  javascriptEnabled: boolean,
): Record<string, unknown> {
  const criterion = consumptionPointCriterion(element.familyId);
  return {
    ancestorClippingPaths: element.ancestorClippingPaths,
    bbox: element.bbox,
    consumptionPointCriterion: criterion,
    consumptionPointCriterionSatisfied: visibleAtConsumptionPoint(element),
    cssVisible: element.cssVisible,
    horizontalClipping: element.horizontalClipping,
    inMain: element.inMain,
    inViewport: element.inViewport,
    javascriptEnabled,
    landmark: element.landmark,
    nearestSemanticContainer: element.nearestSemanticContainer,
    verticalClipping: element.verticalClipping,
    viewport,
    viewportIntersection: element.viewportIntersection,
    visibilityBlockers: element.visibilityBlockers,
  };
}

function pairedElement(
  snapshots: RouteSnapshot[],
  route: string,
  expected: SnapshotElement,
): { element: SnapshotElement; snapshot: RouteSnapshot } {
  const snapshot = snapshots.find((candidate) => candidate.route === route);
  if (snapshot === undefined) {
    throw new Error(`missing paired snapshot for ${route}`);
  }
  const element = snapshot.elements.find(
    (candidate) =>
      candidate.familyId === expected.familyId &&
      candidate.index === expected.index &&
      candidate.normalizedTextSha256 === expected.normalizedTextSha256,
  );
  if (element === undefined) {
    throw new Error(
      `missing paired ${expected.familyId}:${expected.index} at ${route}`,
    );
  }
  return { element, snapshot };
}

function collectClinicalExclusions(
  snapshots: RouteSnapshot[],
): Array<Record<string, unknown>> {
  // The browser snapshots intentionally keep notice sinks separate. Read the
  // exact built HTML here only to bind the frozen component/route coverage;
  // Phase 2's clinical-freeze aggregate remains the byte authority.
  const rows: Array<Record<string, unknown>> = [];
  for (const exclusion of CLINICAL_EXCLUSIONS) {
    let count = 0;
    const routes: string[] = [];
    for (const snapshot of snapshots) {
      if (!new RegExp(exclusion.routePattern).test(snapshot.route)) continue;
      const htmlPath =
        snapshot.route === "/"
          ? resolve(distRoot, "index.html")
          : resolve(distRoot, snapshot.route.slice(1), "index.html");
      const html = readFileSync(htmlPath, "utf8");
      const marker =
        exclusion.familyId === "general-notes-frozen-clinical"
          ? 'class="notes-layer" data-layer="general"'
          : exclusion.familyId === "professional-notes-frozen-clinical"
            ? 'class="notes-layer" data-layer="professional"'
            : exclusion.familyId === "injury-overview-frozen-clinical"
              ? "data-injury-overview="
              : 'data-atlas-view="quarterly-update"';
      const matches = html.split(marker).length - 1;
      if (matches > 0) {
        count += matches;
        routes.push(snapshot.route);
      }
    }
    if (count !== exclusion.expectedCount) {
      throw new Error(
        `approved clinical exclusion count drift for ${exclusion.familyId}: expected ${exclusion.expectedCount}, got ${count}`,
      );
    }
    rows.push({
      count,
      familyId: exclusion.familyId,
      governedClinicalStringsImmutable: true,
      noticeConsolidationDisposition: "excluded-frozen-content",
      presentationShellEditable: true,
      routePattern: exclusion.routePattern,
      routes,
      selector: exclusion.selector,
      sourceBindings: exclusion.sourceBindings,
    });
  }
  return rows;
}

async function main(): Promise<void> {
  if (process.version !== expectedNodeVersion) {
    throw new Error(`expected ${expectedNodeVersion}, got ${process.version}`);
  }
  verifyDecision13ClinicalFreeze();
  execFileSync("git", ["merge-base", "--is-ancestor", inputCommit, "HEAD"], {
    cwd: root,
    stdio: "ignore",
  });
  execFileSync(
    "git",
    [
      "diff",
      "--quiet",
      inputCommit,
      "--",
      "src",
      "public",
      "astro.config.mjs",
      "package.json",
      "package-lock.json",
    ],
    { cwd: root, stdio: "ignore" },
  );
  const distFiles = walk(distRoot).sort();
  const htmlFiles = distFiles.filter((path) => basename(path) === "index.html");
  const routes = htmlFiles.map(routeForHtml).sort();
  if (routes.length !== 41 || new Set(routes).size !== routes.length) {
    throw new Error(
      `expected 41 unique review HTML routes, got ${routes.length}`,
    );
  }
  const buildFiles = distFiles.map((path) => {
    const bytes = readFileSync(path);
    return {
      byteLength: bytes.byteLength,
      path: relative(distRoot, path).split(sep).join("/"),
      sha256: sha256Hex(bytes),
    };
  });
  const buildLedger = buildFiles
    .map((file) => `${file.path}\t${file.sha256}`)
    .join("\n");
  const distAggregateSha256 = digest(buildLedger);
  if (distAggregateSha256 !== expectedDistAggregateSha256) {
    throw new Error(
      `pre-Phase-3 review dist aggregate drift: expected ${expectedDistAggregateSha256}, got ${distAggregateSha256}`,
    );
  }

  const registry = parseStrictJson(
    readFileSync(
      resolve(root, "src/assets/players/player-photo-registry.v5.json"),
      "utf8",
    ),
  ) as CurrentRegistry;
  const registryByRevision = new Map(
    registry.selections.flatMap((selection) =>
      selection.sourceRevision === undefined
        ? []
        : [[String(selection.sourceRevision.id), selection] as const],
    ),
  );

  rmSync(evidenceRoot, { force: true, recursive: true });
  mkdirSync(evidenceRoot, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const desktopCapture = await captureViewport(
      browser,
      server.baseUrl,
      routes,
      desktop,
    );
    const mobileCapture = await captureViewport(
      browser,
      server.baseUrl,
      routes,
      mobile,
    );
    if (
      desktopCapture.network.blockedExternalRequestCount !== 0 ||
      desktopCapture.network.completedExternalRequestCount !== 0 ||
      mobileCapture.network.blockedExternalRequestCount !== 0 ||
      mobileCapture.network.completedExternalRequestCount !== 0
    ) {
      throw new Error("initial notice capture attempted a third-party request");
    }
    const desktopCounts = assertCounts(desktopCapture.snapshots);
    const mobileCounts = assertCounts(mobileCapture.snapshots);
    if (canonicalJson(desktopCounts) !== canonicalJson(mobileCounts)) {
      throw new Error("desktop/mobile family counts differ");
    }
    assertNoticeTextShapeParity(
      desktopCapture.snapshots,
      mobileCapture.snapshots,
    );
    const visibilityDeltas = viewportVisibilityDeltas(
      desktopCapture.snapshots,
      mobileCapture.snapshots,
    );

    const noJsRoutes = [
      "/injuries/achilles-rupture/",
      "/injuries/acl/",
      "/injuries/ankle-sprain/",
      "/leagues/nba/",
    ];
    const noJsDesktopCapture = await captureNoJavaScript(
      browser,
      server.baseUrl,
      noJsRoutes,
      desktop,
    );
    const noJsMobileCapture = await captureNoJavaScript(
      browser,
      server.baseUrl,
      noJsRoutes,
      mobile,
    );
    if (
      noJsDesktopCapture.network.blockedExternalRequestCount !== 0 ||
      noJsDesktopCapture.network.completedExternalRequestCount !== 0 ||
      noJsMobileCapture.network.blockedExternalRequestCount !== 0 ||
      noJsMobileCapture.network.completedExternalRequestCount !== 0
    ) {
      throw new Error("no-JavaScript capture attempted a third-party request");
    }
    assertNoticeTextShapeParity(
      noJsDesktopCapture.snapshots,
      noJsMobileCapture.snapshots,
    );

    const runtimeDesktop = await captureRuntimeStates(
      browser,
      server.baseUrl,
      desktop,
    );
    const runtimeMobile = await captureRuntimeStates(
      browser,
      server.baseUrl,
      mobile,
    );
    const runtimeStates = {
      controlledExternalRequests:
        "All non-local requests are intercepted before network completion; blocked attempts exercise the player fallback only.",
      logicalNoticeStateCount: RUNTIME_RULES.length,
      schemaVersion: 1,
      serviceWorkers: "blocked",
      sourceBindings: [
        source("src/scripts/case-filters.ts", "caseFiltersRuntime", 339, 405),
        source("src/scripts/video-player.ts", "videoPlayerFailure", 82, 92),
      ],
      viewportCaptures: [runtimeDesktop, runtimeMobile],
    };
    writeCanonical(
      resolve(evidenceRoot, "runtime", "runtime-states.v1.json"),
      runtimeStates,
    );

    const occurrences: Array<Record<string, unknown>> = [];
    const definitions = new Map<string, Record<string, unknown>>();
    const rulesByFamily = new Map(RULES.map((rule) => [rule.familyId, rule]));
    rulesByFamily.set(NO_JS_RULE.familyId, NO_JS_RULE);
    for (const rule of RUNTIME_RULES) {
      rulesByFamily.set(rule.familyId, rule);
    }

    const ensureDefinition = (
      element: SnapshotElement,
      rule: NoticeRule,
    ): string => {
      const id = definitionId(element.familyId, element.normalizedTextSha256);
      if (!definitions.has(id)) {
        definitions.set(id, {
          attributionSegments:
            attributionSegments(element, registryByRevision) ?? null,
          availability: rule.availability,
          clinicalGovernance:
            rule.frozenClinicalContent === true
              ? {
                  governedOnlyOnRoutePattern: "^/cases/[^/]+/$",
                  presentationShellEditable: true,
                  reviewFixtureOccurrencesGoverned: false,
                }
              : null,
          definitionId: id,
          exactNormalizedText: element.normalizedText,
          familyId: element.familyId,
          necessityClass: rule.necessityClass,
          note: rule.note,
          normalizedTextSha256: element.normalizedTextSha256,
          ownerLegalDisposition: rule.ownerLegalDisposition ?? null,
          selector: rule.selector,
          sourceBindings: rule.sourceBindings,
          survivingCanonicalLocation: rule.survivingCanonicalLocation ?? null,
        });
      }
      return id;
    };

    const addOccurrence = (
      route: string,
      routeClassValue: string,
      element: SnapshotElement,
      rule: NoticeRule,
      renderedSink: string,
      occurrenceId: string,
      observations: Array<Record<string, unknown>>,
      stateId: string | null,
    ): void => {
      const id = ensureDefinition(element, rule);
      const governedClinicalContent =
        rule.frozenClinicalContent === true &&
        /^\/cases\/[^/]+\/$/u.test(route);
      occurrences.push({
        ancestorClippingPaths: element.ancestorClippingPaths,
        attributes: element.attributes,
        bbox: element.bbox,
        buildMode: "review",
        consumptionPointCriterion: consumptionPointCriterion(element.familyId),
        consumptionPointCriterionSatisfied: visibleAtConsumptionPoint(element),
        contextAttributes: element.contextAttributes,
        cssVisible: element.cssVisible,
        definitionId: id,
        domPath: element.domPath,
        familyId: element.familyId,
        governedClinicalContent,
        hiddenAttribute: element.hiddenAttribute,
        horizontalClipping: element.horizontalClipping,
        inMain: element.inMain,
        inViewport: element.inViewport,
        landmark: element.landmark,
        links: element.links,
        nearestSemanticContainer: element.nearestSemanticContainer,
        occurrenceId,
        outerHtmlSha256: element.outerHtmlSha256,
        renderedSink,
        reviewFixtureNonGoverned:
          rule.frozenClinicalContent === true && route.startsWith("/review/"),
        route,
        routeClass: routeClassValue,
        selector: element.selector,
        stateId,
        verticalClipping: element.verticalClipping,
        viewportIntersection: element.viewportIntersection,
        viewportObservations: observations,
        visibilityBlockers: element.visibilityBlockers,
      });
    };

    for (const snapshot of desktopCapture.snapshots) {
      for (const element of snapshot.elements) {
        const rule = rulesByFamily.get(element.familyId);
        if (rule === undefined)
          throw new Error(`no rule for ${element.familyId}`);
        const mobilePair = pairedElement(
          mobileCapture.snapshots,
          snapshot.route,
          element,
        );
        addOccurrence(
          snapshot.route,
          snapshot.routeClass,
          element,
          rule,
          "review-html-initial",
          `${routeKey(snapshot.route)}:${element.familyId}:${element.index}`,
          [
            viewportObservation(element, snapshot.viewport, true),
            viewportObservation(
              mobilePair.element,
              mobilePair.snapshot.viewport,
              true,
            ),
          ],
          null,
        );
      }
    }
    for (const snapshot of noJsDesktopCapture.snapshots) {
      for (const element of snapshot.elements) {
        const mobilePair = pairedElement(
          noJsMobileCapture.snapshots,
          snapshot.route,
          element,
        );
        addOccurrence(
          snapshot.route,
          snapshot.routeClass,
          element,
          NO_JS_RULE,
          "review-html-javascript-disabled",
          `${routeKey(snapshot.route)}:${element.familyId}:${element.index}`,
          [
            viewportObservation(element, snapshot.viewport, false),
            viewportObservation(
              mobilePair.element,
              mobilePair.snapshot.viewport,
              false,
            ),
          ],
          "javascript-disabled",
        );
      }
    }
    for (const desktopState of runtimeDesktop.states) {
      const stateId = String(desktopState.stateId);
      const mobileState = runtimeMobile.states.find(
        (candidate) => candidate.stateId === stateId,
      );
      if (mobileState === undefined) {
        throw new Error(`missing mobile runtime state ${stateId}`);
      }
      for (const element of stateElements(desktopState, "notices")) {
        const rule = rulesByFamily.get(element.familyId);
        if (rule === undefined) {
          throw new Error(`no runtime rule for ${element.familyId}`);
        }
        const mobileMatches = stateElements(mobileState, "notices").filter(
          (candidate) =>
            candidate.familyId === element.familyId &&
            candidate.index === element.index &&
            candidate.normalizedTextSha256 === element.normalizedTextSha256,
        );
        if (mobileMatches.length !== 1) {
          throw new Error(
            `runtime viewport pairing failed for ${stateId} ${element.familyId}`,
          );
        }
        const route = String(desktopState.route);
        addOccurrence(
          route,
          routeClass(route),
          element,
          rule,
          "review-runtime-controlled-state",
          `runtime:${routeKey(route)}:${stateId}:${element.familyId}:${element.index}`,
          [
            viewportObservation(element, runtimeDesktop.viewport, true),
            viewportObservation(
              mobileMatches[0]!,
              runtimeMobile.viewport,
              true,
            ),
          ],
          stateId,
        );
      }
    }
    const occurrenceIds = occurrences.map((row) => String(row.occurrenceId));
    if (new Set(occurrenceIds).size !== occurrenceIds.length) {
      throw new Error("duplicate notice occurrence IDs");
    }
    for (const [id, definition] of definitions) {
      const matchingOccurrences = occurrences.filter(
        (occurrence) => occurrence.definitionId === id,
      );
      const uniqueObjects = (
        values: Array<Record<string, unknown>>,
      ): Array<Record<string, unknown>> =>
        [
          ...new Map(
            values.map((value) => [canonicalJson(value), value]),
          ).values(),
        ].sort((a, b) => canonicalJson(a).localeCompare(canonicalJson(b)));
      const linkTargets = uniqueObjects(
        matchingOccurrences.flatMap(
          (occurrence) => occurrence.links as Array<Record<string, unknown>>,
        ),
      );
      const landmarks = uniqueObjects(
        matchingOccurrences
          .map(
            (occurrence) =>
              occurrence.landmark as Record<string, unknown> | null,
          )
          .filter(
            (landmark): landmark is Record<string, unknown> =>
              landmark !== null,
          ),
      );
      const nearestSemanticContainers = uniqueObjects(
        matchingOccurrences
          .map(
            (occurrence) =>
              occurrence.nearestSemanticContainer as Record<
                string,
                unknown
              > | null,
          )
          .filter(
            (container): container is Record<string, unknown> =>
              container !== null,
          ),
      );
      const observations = matchingOccurrences.flatMap(
        (occurrence) =>
          occurrence.viewportObservations as Array<Record<string, unknown>>,
      );
      const observationGroups = new Map<
        string,
        Array<Record<string, unknown>>
      >();
      for (const observation of observations) {
        const viewport = observation.viewport as Record<string, unknown>;
        const key = `${String(viewport.id)}:${String(observation.javascriptEnabled)}`;
        const values = observationGroups.get(key) ?? [];
        values.push(observation);
        observationGroups.set(key, values);
      }
      const viewportBehavior = [...observationGroups.values()]
        .map((elements) => {
          const viewport = elements[0]!.viewport as Record<string, unknown>;
          return {
            consumptionPointCriterionSatisfiedCount: elements.filter(
              (element) => element.consumptionPointCriterionSatisfied === true,
            ).length,
            cssVisibleCount: elements.filter(
              (element) => element.cssVisible === true,
            ).length,
            horizontalClippingCount: elements.filter(
              (element) => element.horizontalClipping === true,
            ).length,
            inViewportCount: elements.filter(
              (element) => element.inViewport === true,
            ).length,
            javascriptEnabled: elements[0]!.javascriptEnabled,
            totalCount: elements.length,
            verticalClippingCount: elements.filter(
              (element) => element.verticalClipping === true,
            ).length,
            viewport,
          };
        })
        .sort((a, b) =>
          canonicalJson(a.viewport).localeCompare(canonicalJson(b.viewport)),
        );
      Object.assign(definition, {
        buildModes: ["review"],
        consumptionPointCriterion: consumptionPointCriterion(
          String(definition.familyId),
        ),
        desktopCriterionSatisfiedLogicalOccurrenceCount:
          matchingOccurrences.filter(
            (occurrence) =>
              occurrence.consumptionPointCriterionSatisfied === true,
          ).length,
        governedClinicalOccurrenceCount: matchingOccurrences.filter(
          (occurrence) => occurrence.governedClinicalContent === true,
        ).length,
        landmarks,
        linkTargets,
        nearestSemanticContainers,
        nonGovernedReviewFixtureOccurrenceCount: matchingOccurrences.filter(
          (occurrence) => occurrence.reviewFixtureNonGoverned === true,
        ).length,
        occurrenceCount: matchingOccurrences.length,
        viewportObservationCount: observations.length,
        renderedSinks: [
          ...new Set(
            matchingOccurrences.map((occurrence) =>
              String(occurrence.renderedSink),
            ),
          ),
        ].sort(),
        routeSet: [
          ...new Set(
            matchingOccurrences.map((occurrence) => String(occurrence.route)),
          ),
        ].sort(),
        viewportBehavior,
      });
    }
    const unmappedRedundantDefinitions = [...definitions.values()].filter(
      (definition) =>
        definition.necessityClass === "redundant-or-editorial" &&
        definition.survivingCanonicalLocation === null,
    );
    if (unmappedRedundantDefinitions.length !== 0) {
      throw new Error(
        `redundant definitions without a surviving canonical location: ${unmappedRedundantDefinitions
          .map((definition) => definition.definitionId)
          .join(", ")}`,
      );
    }

    const routeInventory = routes.map((route) => {
      const path =
        route === "/"
          ? resolve(distRoot, "index.html")
          : resolve(distRoot, route.slice(1), "index.html");
      const bytes = readFileSync(path);
      return {
        buildMode: "review",
        byteLength: bytes.byteLength,
        htmlSha256: sha256Hex(bytes),
        route,
        routeClass: routeClass(route),
        routeVisibility: route.startsWith("/review/")
          ? "review-only"
          : "public-content-template",
      };
    });

    const inventory = {
      authorities: {
        creativeCommons: [
          {
            checkedAt: checkedDate,
            scope: "CC BY 2.0 attribution and notice-retention obligations",
            url: "https://creativecommons.org/licenses/by/2.0/legalcode.en",
          },
          {
            checkedAt: checkedDate,
            scope:
              "CC BY 3.0 attribution, change-marking, and notice-retention obligations",
            url: "https://creativecommons.org/licenses/by/3.0/legalcode.en",
          },
          {
            checkedAt: checkedDate,
            scope:
              "CC BY-SA 4.0 attribution, notices, change indication, and ShareAlike obligations",
            url: "https://creativecommons.org/licenses/by-sa/4.0/legalcode.en",
          },
        ],
        physiciansAct: {
          actAmendedDate: "2022-06-22",
          article11Url:
            "https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=L0020001&flno=11",
          article25NormalizedText:
            "醫師有下列情事之一者，由醫師公會或主管機關移付懲戒：一、業務上重大或重複發生過失行為。二、利用業務機會之犯罪行為，經判刑確定。三、非屬醫療必要之過度用藥或治療行為。四、執行業務違背醫學倫理。五、前四款及第二十八條之四各款以外之業務上不正當行為。",
          article25NormalizedTextSha256: digest(
            "醫師有下列情事之一者，由醫師公會或主管機關移付懲戒：一、業務上重大或重複發生過失行為。二、利用業務機會之犯罪行為，經判刑確定。三、非屬醫療必要之過度用藥或治療行為。四、執行業務違背醫學倫理。五、前四款及第二十八條之四各款以外之業務上不正當行為。",
          ),
          article25Url:
            "https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=L0020001&flno=25",
          checkedAt: checkedDate,
          databaseCompilationCutoff: "2026-08-07",
          engineeringObservation:
            "Article 25 enumerates physician disciplinary-referral grounds. It does not prescribe a website disclaimer, exact wording, placement, or legal sufficiency; applicability remains pending named owner/legal review.",
          fullActUrl:
            "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=L0020001",
          htmlResponseFingerprintInvariant: false,
          htmlResponseFingerprintNote:
            "The official MOJ HTML contains dynamic counters and is intentionally not byte/hash-bound; the normalized Article 25 text above is the machine-bound authority excerpt.",
        },
        wcag: {
          checkedAt: checkedDate,
          scope: "WCAG 2.2 SC 1.2.2 prerecorded captions",
          url: "https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html",
        },
      },
      build: {
        aggregateFileLedgerSha256: distAggregateSha256,
        buildFileCount: buildFiles.length,
        buildFiles,
        canonicalLinkCount: desktopCapture.snapshots.reduce(
          (sum, snapshot) => sum + snapshot.document.canonicalCount,
          0,
        ),
        htmlByteLength: routeInventory.reduce(
          (sum, route) => sum + route.byteLength,
          0,
        ),
        htmlRouteCount: routes.length,
        jsonLdCount: desktopCapture.snapshots.reduce(
          (sum, snapshot) => sum + snapshot.document.jsonLdCount,
          0,
        ),
        mode: "review",
        nodeVersion: process.version,
        phaseInputCommit: inputCommit,
        requiredPhase2AggregateFileLedgerSha256: expectedDistAggregateSha256,
      },
      clinicalContentBoundary: {
        governedFrozenInputs: {
          aggregateSha256: DECISION_13_CLINICAL_FREEZE_AGGREGATE_SHA256,
          caseRecordCount: DECISION_13_CLINICAL_FREEZE.filter(([path]) =>
            path.startsWith("src/content/cases/"),
          ).length,
          injuryRecordCount: DECISION_13_CLINICAL_FREEZE.filter(([path]) =>
            path.startsWith("src/content/injuries/"),
          ).length,
          ledger: DECISION_13_CLINICAL_FREEZE.map(([path, sha256]) => ({
            path,
            sha256,
          })),
          quarterlyUpdateRecordCount: DECISION_13_CLINICAL_FREEZE.filter(
            ([path]) => path.startsWith("src/content/updates/"),
          ).length,
          totalRecordCount: DECISION_13_CLINICAL_FREEZE.length,
        },
        presentationBoundary: {
          clinicalStringsImmutable: true,
          presentationShellEditable: true,
          statement:
            "The 30 governed JSON inputs are byte-frozen; Astro component and route shells are presentation code and are not described as immutable.",
        },
        renderedGovernedClinicalCoverage: collectClinicalExclusions(
          desktopCapture.snapshots,
        ),
        reviewFixtures: {
          governedClinicalContent: false,
          routeCount: routes.filter((route) =>
            route.startsWith("/review/fixtures/"),
          ).length,
          routes: routes.filter((route) =>
            route.startsWith("/review/fixtures/"),
          ),
          statement:
            "Review fixtures are fictional/non-governed and are never counted as approved clinical inputs.",
        },
      },
      coverage: {
        desktopCounts,
        desktopRoutes: desktopCapture.snapshots.length,
        javascriptDisabledLogicalNoticeCount:
          noJsDesktopCapture.snapshots.reduce(
            (sum, snapshot) => sum + snapshot.elements.length,
            0,
          ),
        javascriptDisabledRouteViewportObservationCount:
          noJsDesktopCapture.snapshots.length +
          noJsMobileCapture.snapshots.length,
        javascriptDisabledRoutes: noJsDesktopCapture.snapshots.map(
          (snapshot) => snapshot.route,
        ),
        mobileCounts,
        mobileRoutes: mobileCapture.snapshots.length,
        noticeTextShapeParity: true,
        noticeDefinitionCount: definitions.size,
        noticeOccurrenceCount: occurrences.length,
        oneToOneOccurrenceMapping: true,
        runtimeLogicalNoticeCount: RUNTIME_RULES.length,
        staticInitialLogicalNoticeCount: desktopCapture.snapshots.reduce(
          (sum, snapshot) => sum + snapshot.elements.length,
          0,
        ),
        thirdPartyCompletedRequestsAcrossAllCaptures: 0,
        viewportVisibilityDeltaCount: visibilityDeltas.length,
      },
      definitions: [...definitions.values()].sort((a, b) =>
        String(a.definitionId).localeCompare(String(b.definitionId)),
      ),
      dispositionGate: {
        implementationAuthorized: false,
        medicalRow: "pending-named-owner-legal-confirmation",
        minimumVisibleContent: "pending-named-owner-legal-confirmation",
        phase3AcceptanceComplete: false,
        phase4Blocked: true,
      },
      extractionContract: {
        clinicalExclusions: CLINICAL_EXCLUSIONS,
        consumptionPointCriterion:
          "Family-specific criterion recorded on every logical occurrence and viewport observation; CSS visibility in a footer is not treated as clinical consumption-point visibility.",
        hashRule:
          "NFC, collapse consecutive whitespace to one space, trim, SHA-256 UTF-8",
        landmarkRule:
          "Only native/explicit ARIA landmark roles are reported as landmark; article/figure and unnamed section are separately reported as nearestSemanticContainer.",
        noJavaScriptRule: NO_JS_RULE,
        rules: RULES,
        runtimeRules: RUNTIME_RULES,
        semanticDomSnapshot:
          "Each route/viewport JSON stores exact matched outerHTML, text/hash, normalized internal links, DOM path, true landmark, nearest semantic container, ancestor-aware visibility, bounding box, viewport intersection, and ancestor/viewport clipping state.",
        serverBinding:
          "127.0.0.1 with an OS-assigned ephemeral port; the origin is normalized out of evidence links and is not an evidence invariant.",
        serviceWorkers: "blocked",
      },
      networkEvidence: {
        initialDesktop: desktopCapture.network,
        initialMobile: mobileCapture.network,
        noJavaScriptDesktop: noJsDesktopCapture.network,
        noJavaScriptMobile: noJsMobileCapture.network,
        runtimeDesktop: runtimeDesktop.network,
        runtimeMobile: runtimeMobile.network,
      },
      occurrences: occurrences.sort((a, b) =>
        String(a.occurrenceId).localeCompare(String(b.occurrenceId)),
      ),
      ownerLegalDisposition: {
        confirmedAtUtc: null,
        confirmedBy: null,
        exactZhHantText: null,
        existingStringDisposition: {
          aboutStatement: "pending",
          footerLong: "pending",
          footerShort: "pending",
        },
        legalAuthorityRelationship: {
          additionalAuthorities: "pending",
          physiciansActArticle11: "pending",
          physiciansActArticle25: "pending",
        },
        minimumVisibleClauses: null,
        placement: null,
        reviewedCommitSha: inputCommit,
        routeClassDisposition: {
          about: "pending",
          caseDetail26: "pending",
          home: "pending",
          injuryOverview3: "pending",
          leagueListings: "pending",
          quarterlyUpdate: "pending",
          reviewFixtures: "pending",
        },
        status: "pending",
      },
      policyGaps: [
        {
          disposition: "must-correct-in-phase4-after-gate",
          path: "src/pages/source-policy.astro",
          summary:
            "Lines 52-57 still describe only Commons static court photos, generic public-domain material, and an injury-theme fallback; v6/v5 instead govern qualified non-event CC photos and original SVG fallbacks.",
        },
        {
          disposition: "must-surface-in-central-credits",
          path: "src/components/cases/CaseCover.astro",
          summary:
            "Kevin Durant and LeBron James have registry workTitle.status=not-supplied, but the current inline renderer does not visibly state that status for their license versions.",
        },
        {
          disposition: "owner-legal-decision-required",
          path: "src/components/layout/SiteFooter.astro",
          summary:
            "Two adjacent medical-purpose strings repeat on every route and remain footer-only at clinical consumption routes.",
        },
        {
          disposition: "must-preserve-visible-disclosure",
          path: "src/components/cases/CaseVideo.astro",
          summary:
            "The YouTube connection notice is present but CSS-hidden at the 390px mobile viewport.",
        },
      ],
      routeInventory,
      schemaVersion: 1,
      scopeId: "decision-13-notices-before",
      viewportVisibilityDeltas: visibilityDeltas,
    };
    writeCanonical(
      resolve(evidenceRoot, "notice-inventory.v1.json"),
      inventory,
    );

    const evidenceFiles = walk(evidenceRoot)
      .filter((path) => basename(path) !== "evidence-manifest.v1.json")
      .sort()
      .map((path) => {
        const bytes = readFileSync(path);
        return {
          byteLength: bytes.byteLength,
          path: relative(root, path).split(sep).join("/"),
          sha256: sha256Hex(bytes),
        };
      });
    const manifest = {
      evidenceFiles,
      evidenceRoot: relative(root, evidenceRoot).split(sep).join("/"),
      phaseInputCommit: inputCommit,
      schemaVersion: 1,
      scopeId: "decision-13-notices-before-manifest",
    };
    writeCanonical(
      resolve(evidenceRoot, "evidence-manifest.v1.json"),
      manifest,
    );

    process.stdout.write(
      [
        `Decision 13 notice-before evidence: ${routes.length} routes`,
        `desktop/mobile occurrence count: ${Object.values(desktopCounts).reduce((a, b) => a + b, 0)}`,
        `no-JavaScript route/viewport observations: ${noJsDesktopCapture.snapshots.length + noJsMobileCapture.snapshots.length}`,
        `runtime logical notices: ${RUNTIME_RULES.length}`,
        `definitions: ${definitions.size}`,
        `manifest files: ${evidenceFiles.length}`,
      ].join("\n") + "\n",
    );
  } finally {
    await browser.close();
    await server.close();
  }
}

await main();
