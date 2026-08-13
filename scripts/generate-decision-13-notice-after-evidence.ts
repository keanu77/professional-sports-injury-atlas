/**
 * Generate the complete Decision 13 Phase 4 after-state notice inventory.
 *
 * The collector is deliberately local-only: it serves the already-built
 * review artifact on 127.0.0.1, aborts every non-local request, and records
 * semantic DOM snapshots plus a small set of masked screenshots. It must run
 * from the exact clean Phase 4 source commit supplied with
 * `--expected-commit <sha>` or `ATLAS_D13_PHASE4_COMMIT=<sha>`; it never
 * infers or blesses the commit it is meant to evidence.
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
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
  "docs/reviews/evidence/decision-13/notices-after",
);
let collectorOwnsEvidenceRoot = false;
const reviewedProductByteCommit = "d625989de94969ecb9c248038fb00e0890f1f51b";
const beforeInventoryPath = resolve(
  root,
  "docs/reviews/evidence/decision-13/notices-before/notice-inventory.v1.json",
);
const expectedBeforeInventorySha256 =
  "b9e203b9320155712a9cc6222ec74264e3702513613277b649715caa585ffcd0";
const expectedNodeVersion = "v24.14.0";
const checkedDate = "2026-08-13";
const desktop = { id: "desktop-1440x900", width: 1440, height: 900 } as const;
const mobile = { id: "mobile-390x844", width: 390, height: 844 } as const;
const canonicalMedicalNotice =
  "本站為教學用途的衛教內容，不構成醫療建議，也無法取代醫師診察。症狀持續或惡化請就醫。";
const centralCreditsRoute = "/credits-notices/";
const centralMedicalNoticeHref = "/credits-notices/#medical-notice";
const expectedRouteCount = 42;
const expectedCompactNoticeCount = 30;
const expectedAssetCreditLinkCount = 46;
const expectedCentralCreditRowCount = 5;
const expectedYoutubeConnectionNoticeCount = 10;
const ownerLegalDisposition = {
  confirmedAtUtc: "2026-08-13T10:28:18Z",
  confirmedBy: "吳易澄醫師（本站 owner、執業復健科醫師，具名核定）",
  exactZhHantText:
    "本站為教學用途的衛教內容，不構成醫療建議，也無法取代醫師診察。症狀持續或惡化請就醫。",
  existingStringDisposition: {
    aboutStatement: "preserve（About 主文說明保留原字，不改）",
    footerLong:
      "canonicalize——刪除，與 footerShort 合併為核定文字單一句（消除 41 路由的相鄰重複）",
    footerShort: "replace——由核定文字取代",
  },
  legalAuthorityRelationship: {
    additionalAuthorities:
      "醫療法第 85、86 條（醫療廣告規範）列為備註——本站為非商業教學衛教內容，不涉醫療業務招徠；此外無其他適用法源。",
    physiciansActArticle11:
      "本站不對個人提供診療，不直接適用；其親自診察原則支持本站不做遠距個別診斷之立場。",
    physiciansActArticle25:
      "適用為風險脈絡。本站維持教學觀察定位，不對未親自診察之個人作診斷或處置建議；醫療聲明於內容消費點可見，明示教學用途與不取代醫師診察。",
  },
  minimumVisibleClauses: [
    "教學用途",
    "不構成醫療建議",
    "無法取代醫師診察",
    "症狀持續或惡化請就醫",
  ],
  placement:
    "消費點＋footer——\n26 個案例頁、3 個傷種總覽、季度更新頁：臨床內容開頭放單行 compact notice\n（初始 viewport 內可見，桌機與 390px 手機皆然）；\n全站 footer 保留核定文字單一句；\n完整授權與說明集中到 central credits/notices 專頁，內容頁以一行連結指過去。",
  reviewedCommitSha: reviewedProductByteCommit,
  routeClassDisposition: {
    about: "保留主文說明＋footer 核定句；不另加消費點聲明",
    caseDetail26: "消費點 compact notice＋footer 核定句",
    home: "footer 核定句即可，不加消費點聲明",
    injuryOverview3: "同案例頁處理",
    leagueListings: "footer 核定句即可，不加消費點聲明",
    quarterlyUpdate: "同案例頁處理",
    reviewFixtures: "維持 fixture 現狀，不納入（非核准臨床內容）",
  },
  status: "confirmed",
} as const;

function assertOwnerLegalDisposition(): void {
  if (
    ownerLegalDisposition.reviewedCommitSha !== reviewedProductByteCommit ||
    ownerLegalDisposition.exactZhHantText !== canonicalMedicalNotice
  ) {
    throw new Error("owner/legal disposition reviewed commit drift");
  }
  if (
    !ownerLegalDisposition.minimumVisibleClauses.every((clause) =>
      ownerLegalDisposition.exactZhHantText.includes(clause),
    )
  ) {
    throw new Error(
      "owner/legal disposition minimum visible clause is absent from exact text",
    );
  }
  const serialized = canonicalJson(ownerLegalDisposition);
  if (serialized.includes("null") || serialized.includes('"pending"')) {
    throw new Error("owner/legal disposition is incomplete");
  }
}

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
  ownerLegalDisposition?: "confirmed";
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
    selector: "[data-footer-site-copyright]",
    sourceBindings: [
      source("src/components/layout/SiteFooter.astro", "SiteFooter", 46, 47),
    ],
  },
  {
    availability: "all-builds",
    familyId: "footer-medical-canonical",
    necessityClass: "medical-legal-review-required",
    note: "The single owner-approved canonical medical notice in every route footer.",
    ownerLegalDisposition: "confirmed",
    selector: '[data-medical-notice="footer"]',
    sourceBindings: [],
  },
  {
    availability: "all-builds",
    familyId: "compact-medical-canonical",
    necessityClass: "medical-legal-review-required",
    note: "The owner-approved compact notice at each governed clinical consumption point.",
    ownerLegalDisposition: "confirmed",
    selector: '[data-medical-notice="compact"]',
    sourceBindings: [],
  },
  {
    availability: "all-builds",
    familyId: "compact-central-notices-link",
    necessityClass: "evidence-or-policy-required",
    note: "One-line governed-clinical consumption-point pointer to the canonical credits/notices route.",
    selector:
      '[data-medical-notice-block="compact"] [data-central-notices-link]',
    sourceBindings: [],
  },
  {
    availability: "all-builds",
    familyId: "footer-central-notices-link",
    necessityClass: "evidence-or-policy-required",
    note: "Footer pointer to the canonical credits/notices route.",
    selector:
      '[data-medical-notice-block="footer"] [data-central-notices-link]',
    sourceBindings: [],
  },
  {
    availability: "all-builds",
    familyId: "asset-credit-deep-link",
    necessityClass: "license-required",
    note: "Concise attribution line adjacent to each licensed photo use and deep-linked to its exact central row.",
    selector: "[data-asset-credit-link]",
    sourceBindings: [],
  },
  {
    availability: "all-builds",
    familyId: "central-asset-credit-row",
    necessityClass: "license-required",
    note: "Registry-derived complete attribution and policy facts for one licensed asset.",
    routePattern: "^/credits-notices/$",
    selector: "[data-asset-credit-row][id]",
    sourceBindings: [],
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
    ownerLegalDisposition: "confirmed",
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
  "asset-credit-deep-link": 46,
  "case-card-diagnosis-confirmation": 136,
  "case-diagnosis-confirmation": 27,
  "central-asset-credit-row": 5,
  "compact-central-notices-link": 30,
  "compact-medical-canonical": 30,
  "component-lab-fictional-marker": 1,
  "external-source-citation": 136,
  "footer-independent-site": 42,
  "footer-central-notices-link": 42,
  "footer-medical-canonical": 42,
  "footer-site-copyright": 42,
  "footer-source-rights-posture": 42,
  "home-observation-diagnosis-boundary": 1,
  "injury-page-scope": 3,
  "layer-switch-explainer": 27,
  "observed-mechanism-not-diagnosis": 27,
  "original-svg-cover-clarification": 138,
  "page-description-meta": 42,
  "review-artifact-identity-meta": 42,
  "review-banner": 42,
  "review-digest-panel": 29,
  "review-fixture-marker": 4,
  "review-robots-meta": 42,
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
  uploaderIdentity?: {
    name: string;
    relationshipToPhotographer: string;
  };
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
  if (route === centralCreditsRoute) return "credits-notices";
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
  if (element.familyId !== "central-asset-credit-row") return undefined;
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
    familyId === "compact-medical-canonical" ||
    familyId === "compact-central-notices-link" ||
    familyId === "about-medical-purpose"
  ) {
    return "clinical-main-content";
  }
  if (
    familyId === "footer-medical-canonical" ||
    familyId === "footer-central-notices-link"
  ) {
    return "designated-footer";
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

type JsonRecord = Record<string, unknown>;

function gitText(args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function parseExpectedPhase4Commit(
  argv: readonly string[] = process.argv.slice(2),
): string {
  let cliValue: string | null = null;
  if (argv.length !== 0) {
    if (argv.length !== 2 || argv[0] !== "--expected-commit") {
      throw new Error(
        "usage: generate-decision-13-notice-after-evidence.ts --expected-commit <40-hex-sha>",
      );
    }
    cliValue = argv[1] ?? null;
  }
  const environmentValue = process.env.ATLAS_D13_PHASE4_COMMIT?.trim() || null;
  if (
    cliValue !== null &&
    environmentValue !== null &&
    cliValue !== environmentValue
  ) {
    throw new Error("--expected-commit and ATLAS_D13_PHASE4_COMMIT disagree");
  }
  const expected = cliValue ?? environmentValue;
  if (expected === null || !/^[0-9a-f]{40}$/u.test(expected)) {
    throw new Error(
      "an explicit 40-hex Phase 4 commit is required via --expected-commit or ATLAS_D13_PHASE4_COMMIT",
    );
  }
  return expected;
}

function assertCleanExpectedSourceCommit(expectedCommit: string): void {
  if (gitText(["rev-parse", "HEAD"]) !== expectedCommit) {
    throw new Error(
      "HEAD does not equal the explicitly expected Phase 4 commit",
    );
  }
  if (gitText(["status", "--porcelain=v1", "--untracked-files=all"]) !== "") {
    throw new Error(
      "after-evidence collection requires a clean Phase 4 source commit",
    );
  }
  execFileSync(
    "git",
    ["merge-base", "--is-ancestor", reviewedProductByteCommit, expectedCommit],
    { cwd: root, stdio: "ignore" },
  );
}

function trackedSourceLedger(): {
  aggregateSha256: string;
  files: Array<{ byteLength: number; path: string; sha256: string }>;
} {
  const paths = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean)
    .sort();
  const files = paths.map((path) => {
    const bytes = readFileSync(resolve(root, path));
    return { byteLength: bytes.byteLength, path, sha256: sha256Hex(bytes) };
  });
  return {
    aggregateSha256: digest(
      files
        .map((file) => `${file.path}\t${file.byteLength}\t${file.sha256}`)
        .join("\n"),
    ),
    files,
  };
}

function readFrozenBeforeInventory(): JsonRecord {
  const bytes = readFileSync(beforeInventoryPath);
  const measured = sha256Hex(bytes);
  if (measured !== expectedBeforeInventorySha256) {
    throw new Error(
      `frozen before inventory drift: expected ${expectedBeforeInventorySha256}, got ${measured}`,
    );
  }
  const parsed = parseStrictJson(bytes.toString("utf8"));
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    (parsed as JsonRecord).schemaVersion !== 1 ||
    (parsed as JsonRecord).scopeId !== "decision-13-notices-before"
  ) {
    throw new Error("frozen before inventory contract is invalid");
  }
  return parsed as JsonRecord;
}

function isGovernedClinicalRoute(route: string): boolean {
  return (
    /^\/cases\/[^/]+\/$/u.test(route) ||
    /^\/injuries\/(?:achilles-rupture|acl|ankle-sprain)\/$/u.test(route) ||
    route === "/updates/2026-q3/"
  );
}

function elementsFor(
  snapshot: RouteSnapshot,
  familyId: string,
): SnapshotElement[] {
  return snapshot.elements.filter((element) => element.familyId === familyId);
}

function fullyInsideViewport(
  element: SnapshotElement,
  viewport: { width: number; height: number },
): boolean {
  const tolerance = 0.5;
  return (
    element.cssVisible &&
    !element.hiddenAttribute &&
    !element.horizontalClipping &&
    !element.verticalClipping &&
    element.ancestorClippingPaths.length === 0 &&
    element.bbox.width > 0 &&
    element.bbox.height > 0 &&
    element.bbox.x >= -tolerance &&
    element.bbox.y >= -tolerance &&
    element.bbox.x + element.bbox.width <= viewport.width + tolerance &&
    element.bbox.y + element.bbox.height <= viewport.height + tolerance &&
    element.viewportIntersection !== null &&
    Math.abs(element.viewportIntersection.width - element.bbox.width) <=
      tolerance &&
    Math.abs(element.viewportIntersection.height - element.bbox.height) <=
      tolerance
  );
}

function assertLinkTarget(element: SnapshotElement, href: string): void {
  if (
    element.links.length !== 1 ||
    element.links[0]?.href !== href ||
    element.cssVisible !== true ||
    element.horizontalClipping ||
    element.verticalClipping
  ) {
    throw new Error(
      `${element.familyId} does not expose exactly one visible ${href} link`,
    );
  }
}

interface StaticAfterContract {
  aboutMain: { exactNormalizedText: string; normalizedTextSha256: string };
  compactNoticeCount: number;
  footerNoticeCount: number;
  sourcePolicyPhotoSection: {
    normalizedTextSha256: string;
    beforeNormalizedTextSha256: string;
  };
}

function assertStaticAfterContract(
  desktopSnapshots: RouteSnapshot[],
  mobileSnapshots: RouteSnapshot[],
  beforeInventory: JsonRecord,
): StaticAfterContract {
  const mobileByRoute = new Map(
    mobileSnapshots.map((snapshot) => [snapshot.route, snapshot]),
  );
  const expectedNoticeHash = digest(normalizeText(canonicalMedicalNotice));
  let compactNoticeCount = 0;
  let footerNoticeCount = 0;
  for (const desktopSnapshot of desktopSnapshots) {
    const mobileSnapshot = mobileByRoute.get(desktopSnapshot.route);
    if (mobileSnapshot === undefined) {
      throw new Error(`missing mobile route ${desktopSnapshot.route}`);
    }
    for (const snapshot of [desktopSnapshot, mobileSnapshot]) {
      if (snapshot.document.pageHorizontalOverflow) {
        throw new Error(
          `page overflow at ${snapshot.viewport.id} ${snapshot.route}`,
        );
      }
      for (const element of snapshot.elements) {
        if (
          element.cssVisible &&
          (element.horizontalClipping ||
            element.verticalClipping ||
            element.ancestorClippingPaths.length !== 0)
        ) {
          throw new Error(
            `visible evidence clipping at ${snapshot.viewport.id} ${snapshot.route} ${element.familyId}:${element.index}`,
          );
        }
      }
    }

    const desktopCompact = elementsFor(
      desktopSnapshot,
      "compact-medical-canonical",
    );
    const mobileCompact = elementsFor(
      mobileSnapshot,
      "compact-medical-canonical",
    );
    const shouldHaveCompact = isGovernedClinicalRoute(desktopSnapshot.route);
    if (
      desktopCompact.length !== (shouldHaveCompact ? 1 : 0) ||
      mobileCompact.length !== (shouldHaveCompact ? 1 : 0)
    ) {
      throw new Error(
        `compact notice route disposition failed at ${desktopSnapshot.route}`,
      );
    }
    if (shouldHaveCompact) {
      for (const [element, viewport] of [
        [desktopCompact[0]!, desktopSnapshot.viewport],
        [mobileCompact[0]!, mobileSnapshot.viewport],
      ] as const) {
        if (
          element.normalizedText !== canonicalMedicalNotice ||
          element.normalizedTextSha256 !== expectedNoticeHash ||
          !element.inMain ||
          !fullyInsideViewport(element, viewport)
        ) {
          throw new Error(
            `compact notice is not exact and fully in the initial viewport at ${viewport.id} ${desktopSnapshot.route}`,
          );
        }
      }
      compactNoticeCount += 1;
    }

    const desktopFooter = elementsFor(
      desktopSnapshot,
      "footer-medical-canonical",
    );
    const mobileFooter = elementsFor(
      mobileSnapshot,
      "footer-medical-canonical",
    );
    if (desktopFooter.length !== 1 || mobileFooter.length !== 1) {
      throw new Error(
        `canonical footer count failed at ${desktopSnapshot.route}`,
      );
    }
    for (const element of [desktopFooter[0]!, mobileFooter[0]!]) {
      if (
        element.normalizedText !== canonicalMedicalNotice ||
        element.normalizedTextSha256 !== expectedNoticeHash ||
        element.cssVisible !== true ||
        element.landmark?.tagName !== "footer"
      ) {
        throw new Error(`canonical footer drift at ${desktopSnapshot.route}`);
      }
    }
    footerNoticeCount += 1;

    const compactLinks = elementsFor(
      desktopSnapshot,
      "compact-central-notices-link",
    );
    const footerLinks = elementsFor(
      desktopSnapshot,
      "footer-central-notices-link",
    );
    if (
      compactLinks.length !== (shouldHaveCompact ? 1 : 0) ||
      footerLinks.length !== 1
    ) {
      throw new Error(
        `central-notices pointer route disposition failed at ${desktopSnapshot.route}`,
      );
    }
    for (const element of [...compactLinks, ...footerLinks]) {
      assertLinkTarget(element, centralMedicalNoticeHref);
    }
  }
  if (
    compactNoticeCount !== expectedCompactNoticeCount ||
    footerNoticeCount !== expectedRouteCount
  ) {
    throw new Error(
      `medical architecture counts failed: compact=${compactNoticeCount}, footer=${footerNoticeCount}`,
    );
  }

  const definitions = beforeInventory.definitions as JsonRecord[];
  const beforeAbout = definitions.filter(
    (definition) => definition.familyId === "about-medical-purpose",
  );
  if (beforeAbout.length !== 1) {
    throw new Error("frozen before About definition is not singular");
  }
  const afterAbout = desktopSnapshots
    .flatMap((snapshot) => snapshot.elements)
    .filter((element) => element.familyId === "about-medical-purpose");
  if (
    afterAbout.length !== 1 ||
    afterAbout[0]!.normalizedText !== beforeAbout[0]!.exactNormalizedText ||
    afterAbout[0]!.normalizedTextSha256 !== beforeAbout[0]!.normalizedTextSha256
  ) {
    throw new Error(
      "About main statement changed from the frozen before state",
    );
  }

  const beforePhotoDefinitions = definitions.filter(
    (definition) =>
      definition.familyId === "source-policy-section" &&
      String(definition.exactNormalizedText).startsWith("球員資料照片"),
  );
  const sourcePolicy = desktopSnapshots.find(
    (snapshot) => snapshot.route === "/source-policy/",
  );
  const afterPhotoSections =
    sourcePolicy?.elements.filter(
      (element) =>
        element.familyId === "source-policy-section" &&
        element.attributes["aria-labelledby"] === "photo-heading",
    ) ?? [];
  if (beforePhotoDefinitions.length !== 1 || afterPhotoSections.length !== 1) {
    throw new Error("source-policy photo section cannot be paired");
  }
  const afterPhoto = afterPhotoSections[0]!;
  if (
    afterPhoto.normalizedTextSha256 ===
      beforePhotoDefinitions[0]!.normalizedTextSha256 ||
    !afterPhoto.normalizedText.includes("非賽事") ||
    !afterPhoto.normalizedText.includes("原創 SVG") ||
    !afterPhoto.links.some(
      (link) =>
        link.href === centralCreditsRoute ||
        link.href.startsWith(`${centralCreditsRoute}#`),
    )
  ) {
    throw new Error(
      "source-policy photo section does not express the Phase 4 non-event/SVG/central-notices policy",
    );
  }

  return {
    aboutMain: {
      exactNormalizedText: afterAbout[0]!.normalizedText,
      normalizedTextSha256: afterAbout[0]!.normalizedTextSha256,
    },
    compactNoticeCount,
    footerNoticeCount,
    sourcePolicyPhotoSection: {
      beforeNormalizedTextSha256: String(
        beforePhotoDefinitions[0]!.normalizedTextSha256,
      ),
      normalizedTextSha256: afterPhoto.normalizedTextSha256,
    },
  };
}

interface CentralFieldEvidence {
  attributes: Record<string, string>;
  count: number;
  links: Array<{ href: string; text: string }>;
  normalizedText: string;
  visible: boolean;
}

interface CentralRowEvidence {
  attributes: Record<string, string>;
  fields: Record<string, CentralFieldEvidence>;
  id: string;
  normalizedText: string;
  visible: boolean;
}

interface CentralCreditsEvidence {
  network: NetworkSummary;
  route: typeof centralCreditsRoute;
  rows: CentralRowEvidence[];
}

const CENTRAL_FIELD_IDS = [
  "creator",
  "work-title",
  "license",
  "source",
  "alteration",
  "uploader",
  "copyright-notice",
  "disclaimer-notice",
  "other-notice",
  "adapter-license",
  "occasion-risk",
] as const;

async function captureCentralCredits(
  browser: Browser,
  baseUrl: string,
): Promise<CentralCreditsEvidence> {
  const context = await browser.newContext({
    javaScriptEnabled: true,
    serviceWorkers: "block",
    viewport: { height: desktop.height, width: desktop.width },
  });
  const audit = createNetworkAudit();
  const page = await context.newPage();
  await installLocalOnlyGuard(page, baseUrl, audit);
  await gotoLocal(page, baseUrl, centralCreditsRoute);
  const rows = await page.evaluate((fieldIds) => {
    const normalize = (value: string): string =>
      value.normalize("NFC").replace(/\s+/gu, " ").trim();
    const attrs = (element: Element): Record<string, string> =>
      Object.fromEntries(
        [...element.attributes]
          .map((attribute) => [attribute.name, attribute.value] as const)
          .sort(([left], [right]) => left.localeCompare(right)),
      );
    const visible = (element: Element): boolean => {
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
    return [...document.querySelectorAll("[data-asset-credit-row][id]")].map(
      (row) => {
        const fields = Object.fromEntries(
          fieldIds.map((fieldId) => {
            const matches = [
              ...row.querySelectorAll(`[data-credit-field="${fieldId}"]`),
            ];
            const element = matches[0] ?? null;
            return [
              fieldId,
              {
                attributes: element === null ? {} : attrs(element),
                count: matches.length,
                links:
                  element === null
                    ? []
                    : [
                        ...(element.matches("a[href]") ? [element] : []),
                        ...element.querySelectorAll("a[href]"),
                      ].map((anchor) => ({
                        href: (anchor as HTMLAnchorElement).href,
                        text: normalize(anchor.textContent ?? ""),
                      })),
                normalizedText:
                  element === null ? "" : normalize(element.textContent ?? ""),
                visible: element === null ? false : visible(element),
              },
            ];
          }),
        );
        return {
          attributes: attrs(row),
          fields,
          id: row.id,
          normalizedText: normalize(row.textContent ?? ""),
          visible: visible(row),
        };
      },
    );
  }, CENTRAL_FIELD_IDS);
  assertNoCompletedExternalRequests(audit, "central credits capture");
  await context.close();
  return {
    network: summarizeNetwork(audit),
    route: centralCreditsRoute,
    rows: rows as CentralRowEvidence[],
  };
}

function requireCentralField(
  row: CentralRowEvidence,
  fieldId: (typeof CENTRAL_FIELD_IDS)[number],
): CentralFieldEvidence {
  const field = row.fields[fieldId];
  if (field === undefined || field.count !== 1 || !field.visible) {
    throw new Error(`${row.id} requires one visible ${fieldId} field`);
  }
  return field;
}

function canonicalExternalUrl(value: string): string {
  return new URL(value).href;
}

function fieldHasExactLink(field: CentralFieldEvidence, url: string): boolean {
  const expected = canonicalExternalUrl(url);
  return field.links.some((link) => link.href === expected);
}

function assertNoticeField(
  row: CentralRowEvidence,
  fieldId: "copyright-notice" | "disclaimer-notice" | "other-notice",
  notice: RegistryNotice,
): void {
  const field = requireCentralField(row, fieldId);
  if (field.attributes["data-notice-status"] !== notice.status) {
    throw new Error(`${row.id} ${fieldId} status drift`);
  }
  if (notice.status === "supplied") {
    if (
      notice.text === null ||
      notice.text === undefined ||
      !field.normalizedText.includes(notice.text) ||
      (notice.url !== null &&
        notice.url !== undefined &&
        !fieldHasExactLink(field, notice.url))
    ) {
      throw new Error(`${row.id} ${fieldId} supplied notice is incomplete`);
    }
  } else if (!field.normalizedText.includes("目前來源未另行提供")) {
    throw new Error(`${row.id} ${fieldId} must visibly preserve not-supplied`);
  }
}

function validateCentralCredits(
  evidence: CentralCreditsEvidence,
  registry: CurrentRegistry,
): {
  adapterRowCount: number;
  rowIds: string[];
  titleNotSuppliedRowCount: number;
} {
  const selections = registry.selections.filter(
    (selection) =>
      selection.sourceRevision !== undefined &&
      selection.rightsAttribution !== undefined &&
      selection.license !== undefined &&
      selection.photographerIdentity !== undefined &&
      selection.occasionEvidence !== undefined,
  );
  if (
    selections.length !== expectedCentralCreditRowCount ||
    evidence.rows.length !== expectedCentralCreditRowCount
  ) {
    throw new Error(
      `central credit row count drift: registry=${selections.length}, DOM=${evidence.rows.length}`,
    );
  }
  const rowsByRevision = new Map(
    evidence.rows.map((row) => [
      row.attributes["data-source-revision-id"],
      row,
    ]),
  );
  if (
    rowsByRevision.size !== evidence.rows.length ||
    new Set(evidence.rows.map((row) => row.id)).size !== evidence.rows.length
  ) {
    throw new Error("central credit row IDs/revision bindings are not unique");
  }
  let titleNotSuppliedRowCount = 0;
  let adapterRowCount = 0;
  for (const selection of selections) {
    const revision = selection.sourceRevision!;
    const facts = selection.rightsAttribution!;
    const row = rowsByRevision.get(String(revision.id));
    if (
      row === undefined ||
      !row.visible ||
      row.attributes["data-athlete-name"] !== selection.athleteName ||
      row.attributes["data-license-bucket"] !== facts.licenseBucket
    ) {
      throw new Error(
        `central row binding missing for ${selection.athleteName} revision ${revision.id}`,
      );
    }
    const creator = requireCentralField(row, "creator");
    if (
      !creator.normalizedText.includes(selection.photographerIdentity!.name)
    ) {
      throw new Error(`${row.id} creator is incomplete`);
    }

    const workTitle = requireCentralField(row, "work-title");
    if (
      workTitle.attributes["data-work-title-status"] !== facts.workTitle.status
    ) {
      throw new Error(`${row.id} work-title status drift`);
    }
    if (facts.workTitle.status === "supplied") {
      if (
        facts.workTitle.text === null ||
        !workTitle.normalizedText.includes(facts.workTitle.text)
      ) {
        throw new Error(`${row.id} supplied work title is incomplete`);
      }
    } else {
      titleNotSuppliedRowCount += 1;
      if (
        facts.workTitle.text !== null ||
        !workTitle.normalizedText.includes("未提供")
      ) {
        throw new Error(`${row.id} invents or hides a not-supplied title`);
      }
    }
    if (
      facts.workTitle.evidenceUrl === undefined ||
      !fieldHasExactLink(workTitle, facts.workTitle.evidenceUrl)
    ) {
      throw new Error(`${row.id} work-title evidence link is incomplete`);
    }

    const license = requireCentralField(row, "license");
    if (
      !license.normalizedText.includes(selection.license!.name) ||
      !fieldHasExactLink(license, selection.license!.url)
    ) {
      throw new Error(`${row.id} exact license/version is incomplete`);
    }
    const sourceField = requireCentralField(row, "source");
    if (!fieldHasExactLink(sourceField, revision.permalink)) {
      throw new Error(`${row.id} fixed Commons revision is incomplete`);
    }
    const alteration = requireCentralField(row, "alteration");
    if (!alteration.normalizedText.includes(facts.alterationState.disclosure)) {
      throw new Error(`${row.id} alteration disclosure is incomplete`);
    }
    const uploader = requireCentralField(row, "uploader");
    if (
      selection.uploaderIdentity === undefined ||
      !uploader.normalizedText.includes(selection.uploaderIdentity.name) ||
      !uploader.normalizedText.includes(
        selection.uploaderIdentity.relationshipToPhotographer,
      )
    ) {
      throw new Error(`${row.id} uploader provenance is incomplete`);
    }
    assertNoticeField(row, "copyright-notice", facts.copyrightNotice);
    assertNoticeField(row, "disclaimer-notice", facts.disclaimerNotice);
    assertNoticeField(row, "other-notice", facts.otherPerFileNotice);

    const adapter = row.fields["adapter-license"];
    if (facts.adapterLicense === null) {
      if (adapter === undefined || adapter.count !== 0) {
        throw new Error(`${row.id} has an inapplicable Adapter's License`);
      }
    } else {
      adapterRowCount += 1;
      const requiredAdapter = requireCentralField(row, "adapter-license");
      if (
        !requiredAdapter.normalizedText.includes(facts.adapterLicense.name) ||
        !fieldHasExactLink(requiredAdapter, facts.adapterLicense.url)
      ) {
        throw new Error(`${row.id} Adapter's License is incomplete`);
      }
    }

    const occasionRisk = requireCentralField(row, "occasion-risk");
    if (
      !occasionRisk.normalizedText.includes(selection.nonEventCaption) ||
      !occasionRisk.normalizedText.includes(
        selection.occasionEvidence!.basis,
      ) ||
      !occasionRisk.normalizedText.includes(
        selection.occasionEvidence!.checkedAt,
      ) ||
      !occasionRisk.normalizedText.includes(
        "此分類不代表著作權、肖像權或公開使用已獲放行。",
      )
    ) {
      throw new Error(`${row.id} occasion/risk evidence is incomplete`);
    }
  }
  if (titleNotSuppliedRowCount !== 2 || adapterRowCount !== 3) {
    throw new Error(
      `central title/adapter totals drift: not-supplied=${titleNotSuppliedRowCount}, adapter=${adapterRowCount}`,
    );
  }
  return {
    adapterRowCount,
    rowIds: evidence.rows.map((row) => row.id).sort(),
    titleNotSuppliedRowCount,
  };
}

function validateAssetCreditDeepLinks(
  snapshots: RouteSnapshot[],
  centralRowIds: readonly string[],
): {
  linkCount: number;
  routeCount: number;
  targetIds: string[];
} {
  const rowIds = new Set(centralRowIds);
  const links = snapshots.flatMap((snapshot) =>
    elementsFor(snapshot, "asset-credit-deep-link").map((element) => ({
      element,
      route: snapshot.route,
    })),
  );
  if (links.length !== expectedAssetCreditLinkCount) {
    throw new Error(
      `expected ${expectedAssetCreditLinkCount} adjacent asset-credit links, got ${links.length}`,
    );
  }
  const targetIds = new Set<string>();
  for (const { element, route } of links) {
    if (
      element.tagName !== "a" ||
      !element.inMain ||
      !element.cssVisible ||
      element.horizontalClipping ||
      element.verticalClipping ||
      (element.contextAttributes["data-case-cover"] === undefined &&
        element.contextAttributes["data-case-thumb"] === undefined) ||
      element.links.length !== 1
    ) {
      throw new Error(`asset-credit link is not adjacent/visible at ${route}`);
    }
    const href = element.links[0]!.href;
    if (!href.startsWith(`${centralCreditsRoute}#`)) {
      throw new Error(`asset-credit link is not a deep link at ${route}`);
    }
    const targetId = decodeURIComponent(href.slice(href.indexOf("#") + 1));
    if (!rowIds.has(targetId)) {
      throw new Error(`asset-credit link target ${targetId} does not resolve`);
    }
    targetIds.add(targetId);
  }
  if (
    targetIds.size !== expectedCentralCreditRowCount ||
    [...rowIds].some((id) => !targetIds.has(id))
  ) {
    throw new Error("the 46 adjacent links do not cover all five central rows");
  }
  return {
    linkCount: links.length,
    routeCount: new Set(links.map((link) => link.route)).size,
    targetIds: [...targetIds].sort(),
  };
}

interface MobileYoutubeVisibilityRow {
  bbox: EvidenceBox;
  cssVisible: boolean;
  fullyInsideViewportAfterScroll: boolean;
  index: number;
  normalizedText: string;
  route: string;
}

async function captureMobileYoutubeVisibility(
  browser: Browser,
  baseUrl: string,
  routes: readonly string[],
): Promise<{ network: NetworkSummary; rows: MobileYoutubeVisibilityRow[] }> {
  const context = await browser.newContext({
    javaScriptEnabled: true,
    serviceWorkers: "block",
    viewport: { height: mobile.height, width: mobile.width },
  });
  const audit = createNetworkAudit();
  const page = await context.newPage();
  await installLocalOnlyGuard(page, baseUrl, audit);
  const rows: MobileYoutubeVisibilityRow[] = [];
  for (const route of routes) {
    await gotoLocal(page, baseUrl, route);
    const locator = page.locator("[data-video-load] .video-load-copy > small");
    const count = await locator.count();
    for (let index = 0; index < count; index += 1) {
      const disclosure = locator.nth(index);
      await disclosure.scrollIntoViewIfNeeded();
      const row = await disclosure.evaluate((element) => {
        const normalize = (value: string): string =>
          value.normalize("NFC").replace(/\s+/gu, " ").trim();
        let cssVisible = true;
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
            cssVisible = false;
          }
          current = current.parentElement;
        }
        const box = element.getBoundingClientRect();
        const tolerance = 0.5;
        return {
          bbox: {
            height: Number(box.height.toFixed(3)),
            width: Number(box.width.toFixed(3)),
            x: Number(box.x.toFixed(3)),
            y: Number(box.y.toFixed(3)),
          },
          cssVisible,
          fullyInsideViewportAfterScroll:
            cssVisible &&
            box.width > 0 &&
            box.height > 0 &&
            box.left >= -tolerance &&
            box.top >= -tolerance &&
            box.right <= innerWidth + tolerance &&
            box.bottom <= innerHeight + tolerance,
          normalizedText: normalize(element.textContent ?? ""),
        };
      });
      rows.push({ ...row, index, route });
    }
  }
  assertNoCompletedExternalRequests(audit, "mobile YouTube visibility");
  await context.close();
  if (
    rows.length !== expectedYoutubeConnectionNoticeCount ||
    rows.some(
      (row) =>
        !row.cssVisible ||
        !row.fullyInsideViewportAfterScroll ||
        row.normalizedText !== "點擊後才會連線至 YouTube",
    )
  ) {
    throw new Error(
      `mobile YouTube connection disclosure failed: ${rows.filter((row) => row.cssVisible && row.fullyInsideViewportAfterScroll).length}/${expectedYoutubeConnectionNoticeCount}`,
    );
  }
  return { network: summarizeNetwork(audit), rows };
}

async function captureMaskedScreenshots(
  browser: Browser,
  baseUrl: string,
): Promise<{
  network: NetworkSummary;
  screenshots: Array<{
    byteLength: number;
    id: string;
    path: string;
    route: string;
    sha256: string;
    viewport: string;
  }>;
}> {
  const audit = createNetworkAudit();
  const specs = [
    {
      id: "desktop-case-photo",
      locator: null,
      route: "/cases/kevin-durant-achilles-rupture-2019/",
      viewport: desktop,
    },
    {
      id: "desktop-case-svg",
      locator: null,
      route: "/cases/anthony-edwards-ankle-sprain-2023/",
      viewport: desktop,
    },
    {
      id: "desktop-injury",
      locator: null,
      route: "/injuries/achilles-rupture/",
      viewport: desktop,
    },
    {
      id: "desktop-quarterly",
      locator: null,
      route: "/updates/2026-q3/",
      viewport: desktop,
    },
    {
      id: "mobile-390-case-photo",
      locator: null,
      route: "/cases/kevin-durant-achilles-rupture-2019/",
      viewport: mobile,
    },
    {
      id: "mobile-390-case-svg",
      locator: null,
      route: "/cases/anthony-edwards-ankle-sprain-2023/",
      viewport: mobile,
    },
    {
      id: "mobile-390-injury",
      locator: null,
      route: "/injuries/achilles-rupture/",
      viewport: mobile,
    },
    {
      id: "mobile-390-quarterly",
      locator: null,
      route: "/updates/2026-q3/",
      viewport: mobile,
    },
    {
      id: "central-credits-desktop",
      locator: "main",
      route: centralCreditsRoute,
      viewport: desktop,
    },
    {
      id: "youtube-disclosure-mobile",
      locator: "[data-video-load] .video-load-label",
      route: "/cases/anfernee-simons-ankle-sprain-2023/",
      viewport: mobile,
    },
  ] as const;
  const screenshots: Array<{
    byteLength: number;
    id: string;
    path: string;
    route: string;
    sha256: string;
    viewport: string;
  }> = [];
  for (const spec of specs) {
    const context = await browser.newContext({
      javaScriptEnabled: true,
      serviceWorkers: "block",
      viewport: { height: spec.viewport.height, width: spec.viewport.width },
    });
    const page = await context.newPage();
    await installLocalOnlyGuard(page, baseUrl, audit);
    await gotoLocal(page, baseUrl, spec.route);
    const relativePath = `screenshots/${spec.id}.png`;
    const path = resolve(evidenceRoot, relativePath);
    mkdirSync(resolve(path, ".."), { recursive: true });
    const mask = [
      page.locator(
        "img,picture,video,iframe,[data-cover-illustration],[data-case-cover] .case-cover-media,[data-case-thumb] .case-cover-media",
      ),
    ];
    if (spec.locator === null) {
      await page.screenshot({
        animations: "disabled",
        mask,
        maskColor: "#222222",
        path,
      });
    } else {
      const target = page.locator(spec.locator);
      if ((await target.count()) !== 1) {
        throw new Error(
          `masked screenshot target ${spec.locator} is not singular at ${spec.route}`,
        );
      }
      await target.scrollIntoViewIfNeeded();
      await target.screenshot({
        animations: "disabled",
        mask,
        maskColor: "#222222",
        path,
      });
    }
    const bytes = readFileSync(path);
    screenshots.push({
      byteLength: bytes.byteLength,
      id: spec.id,
      path: relative(root, path).split(sep).join("/"),
      route: spec.route,
      sha256: sha256Hex(bytes),
      viewport: spec.viewport.id,
    });
    await context.close();
  }
  assertNoCompletedExternalRequests(audit, "masked screenshots");
  return { network: summarizeNetwork(audit), screenshots };
}

async function main(): Promise<void> {
  if (process.version !== expectedNodeVersion) {
    throw new Error(`expected ${expectedNodeVersion}, got ${process.version}`);
  }
  const phase4Commit = parseExpectedPhase4Commit();
  assertOwnerLegalDisposition();
  verifyDecision13ClinicalFreeze();
  assertCleanExpectedSourceCommit(phase4Commit);
  const beforeInventory = readFrozenBeforeInventory();
  const sourceLedgerBefore = trackedSourceLedger();
  if (!existsSync(distRoot) || !statSync(distRoot).isDirectory()) {
    throw new Error(
      "dist/ is missing; build the exact Phase 4 review artifact first",
    );
  }
  const distFiles = walk(distRoot).sort();
  const htmlFiles = distFiles.filter((path) => basename(path) === "index.html");
  const routes = htmlFiles.map(routeForHtml).sort();
  if (
    routes.length !== expectedRouteCount ||
    new Set(routes).size !== routes.length ||
    !routes.includes(centralCreditsRoute)
  ) {
    throw new Error(
      `expected ${expectedRouteCount} unique review HTML routes including ${centralCreditsRoute}, got ${routes.length}`,
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
    .map((file) => `${file.path}\t${file.byteLength}\t${file.sha256}`)
    .join("\n");
  const distAggregateSha256 = digest(buildLedger);

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

  if (existsSync(evidenceRoot)) {
    throw new Error(
      `refusing to overwrite existing after evidence at ${relative(root, evidenceRoot)}`,
    );
  }
  mkdirSync(evidenceRoot, { recursive: true });
  collectorOwnsEvidenceRoot = true;
  writeCanonical(resolve(evidenceRoot, "source", "source-ledger.v1.json"), {
    aggregateSha256: sourceLedgerBefore.aggregateSha256,
    expectedCommit: phase4Commit,
    files: sourceLedgerBefore.files,
    schemaVersion: 1,
    scopeId: "decision-13-notices-after-source-ledger",
  });
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
    const staticAfterContract = assertStaticAfterContract(
      desktopCapture.snapshots,
      mobileCapture.snapshots,
      beforeInventory,
    );
    const centralCredits = await captureCentralCredits(browser, server.baseUrl);
    const centralCreditsValidation = validateCentralCredits(
      centralCredits,
      registry,
    );
    const assetCreditLinks = validateAssetCreditDeepLinks(
      desktopCapture.snapshots,
      centralCreditsValidation.rowIds,
    );
    writeCanonical(
      resolve(evidenceRoot, "central", "central-credits.v1.json"),
      {
        ...centralCredits,
        validation: centralCreditsValidation,
      },
    );
    const mobileYoutubeVisibility = await captureMobileYoutubeVisibility(
      browser,
      server.baseUrl,
      routes,
    );
    writeCanonical(
      resolve(evidenceRoot, "runtime", "mobile-youtube-visibility.v1.json"),
      {
        ...mobileYoutubeVisibility,
        expectedVisibleCount: expectedYoutubeConnectionNoticeCount,
        schemaVersion: 1,
        scopeId: "decision-13-mobile-youtube-connection-after",
      },
    );
    const maskedScreenshots = await captureMaskedScreenshots(
      browser,
      server.baseUrl,
    );
    writeCanonical(
      resolve(evidenceRoot, "screenshots", "masked-screenshots.v1.json"),
      {
        ...maskedScreenshots,
        masking:
          "All image, picture, video, iframe, and cover-illustration surfaces are masked; screenshots evidence layout/notice placement, not media content.",
        schemaVersion: 1,
        scopeId: "decision-13-notices-after-masked-screenshots",
      },
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
      noJsDesktopCapture.snapshots.length +
        noJsMobileCapture.snapshots.length !==
      8
    ) {
      throw new Error(
        "the after collector must retain exactly 8 no-JavaScript route/viewport observations",
      );
    }
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
    if (
      RUNTIME_RULES.length !== 6 ||
      runtimeDesktop.states.length !== 7 ||
      runtimeMobile.states.length !== 7
    ) {
      throw new Error(
        "runtime evidence must retain six logical notice states across the seven controlled snapshots per viewport",
      );
    }
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

    verifyDecision13ClinicalFreeze();
    const sourceLedgerAfter = trackedSourceLedger();
    if (
      gitText(["rev-parse", "HEAD"]) !== phase4Commit ||
      canonicalJson(sourceLedgerAfter) !== canonicalJson(sourceLedgerBefore)
    ) {
      throw new Error("tracked Phase 4 source state changed during capture");
    }
    execFileSync("git", ["diff", "--quiet", "HEAD", "--"], {
      cwd: root,
      stdio: "ignore",
    });
    execFileSync("git", ["diff", "--cached", "--quiet", "HEAD", "--"], {
      cwd: root,
      stdio: "ignore",
    });
    const finalDistFiles = walk(distRoot)
      .sort()
      .map((path) => {
        const bytes = readFileSync(path);
        return {
          byteLength: bytes.byteLength,
          path: relative(distRoot, path).split(sep).join("/"),
          sha256: sha256Hex(bytes),
        };
      });
    if (canonicalJson(finalDistFiles) !== canonicalJson(buildFiles)) {
      throw new Error("review dist changed during after-evidence capture");
    }

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
            "Article 25 enumerates physician disciplinary-referral grounds. The named owner/legal disposition treats it as risk context and approves the exact site notice architecture recorded here; this collector makes no independent legal conclusion.",
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
        phase4SourceCommit: phase4Commit,
        sourceLedgerAggregateSha256: sourceLedgerBefore.aggregateSha256,
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
        runtimeViewportStateSnapshotCount:
          runtimeDesktop.states.length + runtimeMobile.states.length,
        maskedScreenshotCount: maskedScreenshots.screenshots.length,
        phase4Assertions: {
          aboutMainPreserved: true,
          adjacentAssetCreditLinkCount: assetCreditLinks.linkCount,
          centralAdapterLicenseRowCount:
            centralCreditsValidation.adapterRowCount,
          centralCreditRowCount: centralCredits.rows.length,
          centralTitleNotSuppliedRowCount:
            centralCreditsValidation.titleNotSuppliedRowCount,
          compactNoticeCount: staticAfterContract.compactNoticeCount,
          compactNoticesFullyInsideBothInitialViewports: true,
          disallowedCompactNoticeCount: 0,
          footerCanonicalNoticeCount: staticAfterContract.footerNoticeCount,
          mobileYoutubeConnectionVisibleCount:
            mobileYoutubeVisibility.rows.length,
          sourcePolicyGapResolved: true,
          visibleClippingCount: 0,
        },
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
        implementationAuthorized: true,
        medicalRow: "accepted-named-owner-legal-disposition",
        minimumVisibleContent: "accepted-named-owner-legal-disposition",
        phase3AcceptanceComplete: true,
        phase4Blocked: false,
        phase4EvidenceAccepted: true,
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
        sourceBinding:
          "The caller must name the exact clean Phase 4 HEAD. A complete Git-tracked SHA-256/byte-length ledger is recorded and remeasured after capture; the dist byte ledger is likewise measured before and after.",
        serverBinding:
          "127.0.0.1 with an OS-assigned ephemeral port; the origin is normalized out of evidence links and is not an evidence invariant.",
        serviceWorkers: "blocked",
      },
      networkEvidence: {
        centralCredits: centralCredits.network,
        initialDesktop: desktopCapture.network,
        initialMobile: mobileCapture.network,
        maskedScreenshots: maskedScreenshots.network,
        mobileYoutubeVisibility: mobileYoutubeVisibility.network,
        noJavaScriptDesktop: noJsDesktopCapture.network,
        noJavaScriptMobile: noJsMobileCapture.network,
        runtimeDesktop: runtimeDesktop.network,
        runtimeMobile: runtimeMobile.network,
      },
      occurrences: occurrences.sort((a, b) =>
        String(a.occurrenceId).localeCompare(String(b.occurrenceId)),
      ),
      ownerLegalDisposition,
      resolvedPolicyGaps: [
        {
          disposition: "resolved-and-machine-verified",
          path: "src/pages/source-policy.astro",
          summary:
            "The photo section changed from the frozen before hash and visibly states the governed non-game setting, original SVG fallback, and central credits/notices route.",
        },
        {
          disposition: "resolved-and-machine-verified",
          path: "src/pages/credits-notices.astro",
          summary:
            "All five registry-backed central rows are complete; Kevin Durant and LeBron James visibly preserve workTitle.status=not-supplied without an invented title, and all three BY-SA rows retain the Adapter's License.",
        },
        {
          disposition: "resolved-and-machine-verified",
          path: "src/components/layout/SiteFooter.astro",
          summary:
            "Exactly one canonical owner-approved sentence appears in each of 42 footers, while exactly 30 governed clinical routes also expose it at the initial consumption viewport.",
        },
        {
          disposition: "resolved-and-machine-verified",
          path: "src/components/cases/CaseVideo.astro",
          summary:
            "All ten YouTube connection notices are CSS-visible and fully within the 390px viewport after scrolling to their consumption control.",
        },
      ],
      routeInventory,
      schemaVersion: 1,
      scopeId: "decision-13-notices-after",
      viewportVisibilityDeltas: visibilityDeltas,
    };
    writeCanonical(
      resolve(evidenceRoot, "notice-inventory.v1.json"),
      inventory,
    );

    const beforeCoverage = beforeInventory.coverage as JsonRecord;
    const beforeDesktopCounts = beforeCoverage.desktopCounts as Record<
      string,
      number
    >;
    const familyIds = [
      ...new Set([
        ...Object.keys(beforeDesktopCounts),
        ...Object.keys(desktopCounts),
      ]),
    ].sort();
    const familyCountChanges = familyIds.map((familyId) => ({
      after: desktopCounts[familyId] ?? 0,
      before: beforeDesktopCounts[familyId] ?? 0,
      delta:
        (desktopCounts[familyId] ?? 0) - (beforeDesktopCounts[familyId] ?? 0),
      familyId,
    }));
    const beforeRoutes = beforeInventory.routeInventory as Array<{
      byteLength: number;
      htmlSha256: string;
      route: string;
      routeClass: string;
    }>;
    const beforeRouteSet = new Set(beforeRoutes.map((route) => route.route));
    const afterRouteSet = new Set(routeInventory.map((route) => route.route));
    const addedRoutes = routes.filter((route) => !beforeRouteSet.has(route));
    const removedRoutes = [...beforeRouteSet]
      .filter((route) => !afterRouteSet.has(route))
      .sort();
    if (
      canonicalJson(addedRoutes) !== canonicalJson([centralCreditsRoute]) ||
      removedRoutes.length !== 0
    ) {
      throw new Error(
        `unexpected route delta: added=${addedRoutes.join(",")}, removed=${removedRoutes.join(",")}`,
      );
    }
    const beforeByRoute = new Map(
      beforeRoutes.map((route) => [route.route, route]),
    );
    const routeChanges = routeInventory.map((afterRoute) => {
      const beforeRoute = beforeByRoute.get(afterRoute.route);
      return {
        after: {
          byteLength: afterRoute.byteLength,
          htmlSha256: afterRoute.htmlSha256,
          routeClass: afterRoute.routeClass,
        },
        before:
          beforeRoute === undefined
            ? null
            : {
                byteLength: beforeRoute.byteLength,
                htmlSha256: beforeRoute.htmlSha256,
                routeClass: beforeRoute.routeClass,
              },
        changed:
          beforeRoute === undefined ||
          beforeRoute.htmlSha256 !== afterRoute.htmlSha256,
        route: afterRoute.route,
      };
    });
    const beforeYoutubeDefinitions = (
      beforeInventory.definitions as JsonRecord[]
    ).filter(
      (definition) => definition.familyId === "video-privacy-connection-notice",
    );
    const beforeMobileYoutubeVisible = beforeYoutubeDefinitions.reduce(
      (sum, definition) =>
        sum +
        ((definition.viewportBehavior as JsonRecord[] | undefined) ?? [])
          .filter((behavior) => {
            const viewport = behavior.viewport as JsonRecord;
            return (
              viewport.id === mobile.id && behavior.javascriptEnabled === true
            );
          })
          .reduce(
            (viewportSum, behavior) =>
              viewportSum + Number(behavior.cssVisibleCount),
            0,
          ),
      0,
    );
    const afterInventoryBytes = readFileSync(
      resolve(evidenceRoot, "notice-inventory.v1.json"),
    );
    const comparison = {
      assertions: {
        aboutMainExactHashPreserved: true,
        adjacentDeepLinksResolveToFiveRows:
          assetCreditLinks.linkCount === expectedAssetCreditLinkCount &&
          assetCreditLinks.targetIds.length === expectedCentralCreditRowCount,
        centralFieldsComplete: true,
        clinicalFreeze30Of30: true,
        compactNoticeAllowedRouteCount: expectedCompactNoticeCount,
        compactNoticeDisallowedRouteCount: 0,
        compactNoticesFullyInsideBothInitialViewports: true,
        footerCanonicalExactCount: expectedRouteCount,
        initialThirdPartyCompletedRequestCount: 0,
        mobileYoutubeConnectionVisibleAfter:
          mobileYoutubeVisibility.rows.length,
        mobileYoutubeConnectionVisibleBefore: beforeMobileYoutubeVisible,
        noVisibleOverflowOrClipping: true,
      },
      before: {
        inventoryPath: relative(root, beforeInventoryPath).split(sep).join("/"),
        inventorySha256: expectedBeforeInventorySha256,
        occurrenceCount: beforeCoverage.noticeOccurrenceCount,
        routeCount: (beforeInventory.routeInventory as unknown[]).length,
        sourceCommit: (beforeInventory.build as JsonRecord).phaseInputCommit,
      },
      after: {
        inventoryPath: relative(
          root,
          resolve(evidenceRoot, "notice-inventory.v1.json"),
        )
          .split(sep)
          .join("/"),
        inventorySha256: sha256Hex(afterInventoryBytes),
        occurrenceCount: occurrences.length,
        routeCount: routeInventory.length,
        sourceCommit: phase4Commit,
      },
      familyCountChanges,
      routeDelta: { addedRoutes, removedRoutes, routeChanges },
      schemaVersion: 1,
      scopeId: "decision-13-notices-before-after-comparison",
    };
    writeCanonical(resolve(evidenceRoot, "comparison.v1.json"), comparison);

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
      phaseInputCommit: phase4Commit,
      schemaVersion: 1,
      scopeId: "decision-13-notices-after-manifest",
    };
    writeCanonical(
      resolve(evidenceRoot, "evidence-manifest.v1.json"),
      manifest,
    );

    process.stdout.write(
      [
        `Decision 13 notice-after evidence: ${routes.length} routes`,
        `desktop/mobile occurrence count: ${Object.values(desktopCounts).reduce((a, b) => a + b, 0)}`,
        `no-JavaScript route/viewport observations: ${noJsDesktopCapture.snapshots.length + noJsMobileCapture.snapshots.length}`,
        `runtime logical notices: ${RUNTIME_RULES.length}`,
        `definitions: ${definitions.size}`,
        `manifest files: ${evidenceFiles.length}`,
        `compact notices fully visible: ${staticAfterContract.compactNoticeCount}/30 at both viewports`,
        `mobile YouTube disclosures visible: ${mobileYoutubeVisibility.rows.length}/10`,
        `asset credit deep-links: ${assetCreditLinks.linkCount}/46 -> ${assetCreditLinks.targetIds.length}/5 rows`,
        "Phase 4 after-evidence accepted",
      ].join("\n") + "\n",
    );
  } finally {
    await browser.close();
    await server.close();
  }
}

try {
  await main();
} catch (error) {
  if (collectorOwnsEvidenceRoot && existsSync(evidenceRoot)) {
    rmSync(evidenceRoot, { force: true, recursive: true });
  }
  throw error;
}
