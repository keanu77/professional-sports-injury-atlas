/**
 * Review-only, in-memory fixture records for the data-bearing fixture routes.
 * Every athlete, team, uploader, reviewer, and source name is visibly
 * fictional (虛構球員甲 / Fictional Player Alpha style); no real player,
 * team, diagnosis, media ID, medical assertion, or live request exists here.
 * The NBA-host entry is an external-link-only fixture whose URL is never
 * requested by any test or reader flow. These records are accepted only by
 * the review-fixture adapters below; the public selectors reject them because
 * public rights remain not-requested.
 */

import {
  computeCaseContentDigest,
  computeVideoIdentityDigest,
  computeVideoSourceDigest,
} from "../lib/cases/digest";
import { sha256Hex } from "../lib/cases/canonical-json";
import type { InjuryCase } from "../lib/contracts/case";
import type { InjuryOverview } from "../lib/contracts/injury-overview";
import type { QuarterlyUpdate } from "../lib/contracts/update";
import { CURRENT_SOURCE_POLICY_VERSION } from "../lib/contracts/site-governance";
import type { BuildMode } from "../lib/governance/build-mode";

export const REVIEW_FIXTURE_NOTICE =
  "本頁僅存在於 review 建置：全部內容為明顯虛構的示範資料（虛構球員甲、虛構球隊等），" +
  "不含任何真實球員、球隊、診斷或媒體 ID。";

/** Deterministic, clearly derived fictional binding digests. */
const fictionalDigest = (seed: string): string =>
  sha256Hex(`fictional-review-fixture:${seed}`);

/** Binds the provenance and approved-review digests to the current payload. */
function finalizeFixtureCase(record: InjuryCase): InjuryCase {
  record.video.sourceProvenanceVerification.reviewedVideoIdentityDigest =
    computeVideoIdentityDigest(record);
  if (record.review.status === "approved") {
    record.review.reviewedContentDigest = computeCaseContentDigest(record);
  }
  return record;
}

/**
 * Approved classic fixture: 虛構球員甲 (Fictional Player Alpha), a fictional
 * pre-cutoff ACL event with a fictional 11-character YouTube-form video ID.
 */
export const reviewFixtureClassicCase: InjuryCase = finalizeFixtureCase({
  schemaVersion: 1,
  id: "CASE-FIC-2014-901",
  slug: "fictional-player-alpha-acl-2014",
  status: "approved",
  sourceManifestBinding: {
    candidateId: "FIC-REVIEW-CAND-901",
    manifestId: "FICTIONAL-REVIEW-FIXTURE-BATCH-001",
    manifestDigest: fictionalDigest("manifest-901"),
    entryDigest: fictionalDigest("entry-901"),
    sourceReviewDecisionDigest: fictionalDigest("decision-901"),
    sourcePolicyVersion: CURRENT_SOURCE_POLICY_VERSION,
  },
  sport: { code: "basketball" },
  league: { code: "nba" },
  competition: { code: "nba-regular-season" },
  athlete: { name: "虛構球員甲（Fictional Player Alpha）" },
  teamAtEvent: { name: "虛構河港狐狸隊（Fictional Riverport Foxes）" },
  season: "2013-14",
  eventDate: "2014-03-02",
  opponent: { name: "虛構山脊貓頭鷹隊（Fictional Summit Owls）" },
  injury: {
    code: "acl",
    confirmedDiagnosis:
      "左膝前十字韌帶撕裂（虛構示範診斷 / fictional demonstration diagnosis）",
    confirmationStatus: "confirmed",
  },
  observedMechanismTags: ["non-contact-cut"],
  isClassic: true,
  classicReason:
    "虛構教學示範：非接觸切入變向的可見受傷模式，轉播畫面清楚，常被虛構教材引用。",
  classicProposedBy: "虛構策展人（Fictional Curator）",
  classicExceptionApprovedBy: "虛構審查醫師（Dr. Fictional Reviewer）",
  video: {
    provider: "youtube",
    contentType: "in-game-injury-event",
    eventBinding: {
      status: "verified",
      eventSourceId: "src-fic-901-event",
      checkedBy: "虛構查核員（Fictional Verifier）",
      checkedAt: "2026-08-02T00:00:00Z",
      basis: "虛構聯盟比賽紀錄確認球員、日期、對手與賽事，但不做任何診斷判斷。",
    },
    canonicalUrl: "https://www.youtube.com/watch?v=fIcTiOnAl01",
    uploaderName: "虛構聯盟典藏頻道（Fictional League Archive）",
    uploaderProvenance: "official-league-channel",
    embedStatus: "verified",
    embedCheckedAt: "2026-08-02T00:00:00Z",
    durationSeconds: 128,
    startSeconds: 12,
    endSeconds: 58,
    fallbackUrl: "https://www.youtube.com/watch?v=fIcTiOnAl01",
    sourceProvenanceVerification: {
      status: "verified",
      verifiedBy: "虛構查核員（Fictional Verifier）",
      verifiedAt: "2026-08-02T00:00:00Z",
      basis: "虛構聯盟官方典藏上傳，與虛構賽事脈絡來源相符。",
      notes: null,
      verifiedPolicyVersion: CURRENT_SOURCE_POLICY_VERSION,
      reviewedVideoIdentityDigest: fictionalDigest("placeholder"),
    },
    captionStatus: "not-verified",
    captionCheckedAt: "2026-08-02T00:00:00Z",
    publicRightsReview: {
      status: "not-requested",
      reviewedBy: null,
      reviewedAt: null,
      reviewedVideoDigest: null,
      policyVersion: null,
      termsCheckedAt: null,
      decisionBasis: null,
      notes: null,
      decisionPath: null,
      decisionDigest: null,
    },
    segments: [
      {
        startSeconds: 15,
        endSeconds: 30,
        observation: "虛構觀察：非接觸切入變向後急停，膝關節向內塌陷。",
      },
      {
        startSeconds: 40,
        endSeconds: 52,
        observation: "虛構觀察：球員受扶協助離場的轉播畫面。",
      },
    ],
  },
  general: {
    whatHappened:
      "在一場虛構例行賽中，虛構球員甲在快攻中急停變向，未與任何人接觸即倒地。",
    whatIsVisible:
      "畫面可見的是非接觸切入模式：急減速與變向時，支撐腳上方的膝關節向內塌陷。",
    whatVideoCannotProve:
      "影片無法證明韌帶撕裂、合併半月板損傷或嚴重度；這些需要臨床檢查與影像學檢查。",
    confirmedUpdate:
      "虛構球團其後在官方醫療聲明中確認左膝前十字韌帶撕裂（虛構示範）。",
  },
  professional: {
    mechanismAnalysis:
      "虛構分析：球員急減速並切入變向，膝關節在沒有外力接觸下向內塌陷。\n\n" +
      "膝關節接近伸直位的非接觸切入，是文獻中討論前十字韌帶受傷時經典的可見負荷模式。",
    clinicalLimitations:
      "影片觀察無法確認前十字韌帶撕裂，也無法分級任何合併損傷。",
    differentialContext:
      "半月板損傷與側副韌帶受累無法僅憑影片排除，需要影像學檢查。",
    treatmentAndRtpMeaning:
      "已發表的前十字韌帶恢復與回場討論強調以條件式進階為準，而非固定日期。",
    claims: [
      {
        id: "claim-fic-901-01",
        field: "professional.mechanismAnalysis",
        text: "虛構分析：球員急減速並切入變向，膝關節在沒有外力接觸下向內塌陷。",
        evidenceIds: ["src-fic-901-teach-a"],
      },
      {
        id: "claim-fic-901-02",
        field: "professional.mechanismAnalysis",
        text: "膝關節接近伸直位的非接觸切入，是文獻中討論前十字韌帶受傷時經典的可見負荷模式。",
        evidenceIds: ["src-fic-901-teach-a"],
      },
      {
        id: "claim-fic-901-03",
        field: "professional.clinicalLimitations",
        text: "影片觀察無法確認前十字韌帶撕裂，也無法分級任何合併損傷。",
        evidenceIds: ["src-fic-901-teach-b"],
      },
      {
        id: "claim-fic-901-04",
        field: "professional.differentialContext",
        text: "半月板損傷與側副韌帶受累無法僅憑影片排除，需要影像學檢查。",
        evidenceIds: ["src-fic-901-teach-b"],
      },
      {
        id: "claim-fic-901-05",
        field: "professional.treatmentAndRtpMeaning",
        text: "已發表的前十字韌帶恢復與回場討論強調以條件式進階為準，而非固定日期。",
        evidenceIds: ["src-fic-901-teach-a", "src-fic-901-teach-b"],
      },
    ],
    evidenceIds: ["src-fic-901-teach-a", "src-fic-901-teach-b"],
    rtpCourseKey: "acl-primary-reconstruction",
  },
  sources: [
    {
      id: "src-fic-901-video",
      type: "video-original",
      title: "虛構賽事轉播片段（Fictional archival broadcast clip）",
      publisher: "虛構聯盟典藏（Fictional League Archive）",
      independenceGroup: "fictional-league-archive",
      originReportId: null,
      url: "https://www.youtube.com/watch?v=fIcTiOnAl01",
      publishedAt: "2014-03-03",
      accessedAt: "2026-08-01",
      supports: [
        "general.whatHappened",
        "general.whatIsVisible",
        "video.segmentObservation",
      ],
    },
    {
      id: "src-fic-901-first-party",
      type: "diagnosis-first-party",
      title: "虛構球團官方醫療聲明（Fictional club medical statement）",
      publisher: "虛構河港狐狸隊公關部（Fictional Foxes Communications）",
      independenceGroup: "fictional-riverport-foxes",
      originReportId: null,
      url: "https://club.fictional-foxes.example/medical-statement-901",
      publishedAt: "2014-03-04",
      accessedAt: "2026-08-01",
      supports: ["injury.confirmedDiagnosis", "general.confirmedUpdate"],
    },
    {
      id: "src-fic-901-event",
      type: "event-context",
      title: "虛構聯盟比賽紀錄（Fictional league game log）",
      publisher: "虛構聯盟資料庫（Fictional League Data）",
      independenceGroup: "fictional-league-data",
      originReportId: null,
      url: "https://data.fictional-league.example/games/fic-2014-03-02",
      publishedAt: "2014-03-02",
      accessedAt: "2026-08-01",
      supports: ["general.whatHappened"],
    },
    {
      id: "src-fic-901-teach-a",
      type: "teaching-evidence",
      title:
        "虛構文獻回顧：非接觸性前十字韌帶受傷機轉（Fictional mechanisms review）",
      publisher: "虛構運動醫學期刊（Fictional Journal of Sports Medicine）",
      independenceGroup: "fictional-journal",
      originReportId: null,
      url: "https://journal.fictional-sports-medicine.example/acl-mechanisms",
      publishedAt: "2024-02-01",
      accessedAt: "2026-08-01",
      supports: [
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
      ],
    },
    {
      id: "src-fic-901-teach-b",
      type: "teaching-evidence",
      title:
        "虛構共識聲明：膝韌帶復健與回場（Fictional rehabilitation consensus）",
      publisher: "虛構膝關節研究聯盟（Fictional Knee Research Collaborative）",
      independenceGroup: "fictional-knee-collaborative",
      originReportId: null,
      url: "https://consensus.fictional-knee-group.example/acl-consensus",
      publishedAt: "2023-09-10",
      accessedAt: "2026-08-01",
      supports: [
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
      ],
    },
  ],
  review: {
    status: "approved",
    reviewerName: "虛構審查醫師（Dr. Fictional Reviewer）",
    reviewerQualification:
      "虛構運動醫學專科醫師（Fictional Sports Medicine Physician）",
    reviewedAt: "2026-08-05T00:00:00Z",
    reviewedContentDigest: fictionalDigest("placeholder"),
  },
  audit: {
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-05T00:00:00Z",
    sourceRecordId: "FIC-REVIEW-CAND-901",
  },
});

/**
 * Never-requested NBA-host external-link fixture: 虛構球員乙 (Fictional
 * Player Beta). The registered non-YouTube provider renders external-link-only
 * UI, and nothing ever requests this fictional URL.
 */
export const reviewFixtureExternalLinkCase: InjuryCase = finalizeFixtureCase({
  schemaVersion: 1,
  id: "CASE-FIC-2026-902",
  slug: "fictional-player-beta-ankle-sprain-2026",
  status: "medical-review",
  sourceManifestBinding: {
    candidateId: "FIC-REVIEW-CAND-902",
    manifestId: "FICTIONAL-REVIEW-FIXTURE-BATCH-001",
    manifestDigest: fictionalDigest("manifest-902"),
    entryDigest: fictionalDigest("entry-902"),
    sourceReviewDecisionDigest: fictionalDigest("decision-902"),
    sourcePolicyVersion: CURRENT_SOURCE_POLICY_VERSION,
  },
  sport: { code: "basketball" },
  league: { code: "nba" },
  competition: { code: "nba-regular-season" },
  athlete: { name: "虛構球員乙（Fictional Player Beta）" },
  teamAtEvent: { name: "虛構都會彗星隊（Fictional Metro Comets）" },
  season: "2025-26",
  eventDate: "2026-01-20",
  opponent: { name: "虛構海灣鷗隊（Fictional Harbor Gulls）" },
  injury: {
    code: "ankle-sprain",
    confirmedDiagnosis:
      "右外側踝關節扭傷（虛構示範診斷 / fictional demonstration diagnosis）",
    confirmationStatus: "confirmed",
  },
  observedMechanismTags: ["inversion-landing", "stepped-on-foot"],
  isClassic: false,
  classicReason: null,
  classicProposedBy: null,
  classicExceptionApprovedBy: null,
  video: {
    provider: "nba",
    contentType: "in-game-injury-event",
    eventBinding: {
      status: "verified",
      eventSourceId: "src-fic-902-event",
      checkedBy: "虛構查核員（Fictional Verifier）",
      checkedAt: "2026-08-02T00:00:00Z",
      basis: "虛構聯盟比賽紀錄確認球員、日期、對手與賽事，但不做任何診斷判斷。",
    },
    canonicalUrl: "https://www.nba.com/watch/fictional-demo-clip-beta",
    uploaderName: "虛構官方轉播單位（Fictional Broadcast Unit）",
    uploaderProvenance: "official-league-platform",
    embedStatus: "external-link-only",
    embedCheckedAt: "2026-08-02T00:00:00Z",
    durationSeconds: 95,
    startSeconds: 8,
    endSeconds: 40,
    fallbackUrl: "https://www.nba.com/watch/fictional-demo-clip-beta",
    sourceProvenanceVerification: {
      status: "verified",
      verifiedBy: "虛構查核員（Fictional Verifier）",
      verifiedAt: "2026-08-02T00:00:00Z",
      basis: "虛構官方平台頁面，與虛構賽事脈絡來源相符。",
      notes: null,
      verifiedPolicyVersion: CURRENT_SOURCE_POLICY_VERSION,
      reviewedVideoIdentityDigest: fictionalDigest("placeholder"),
    },
    captionStatus: "not-verified",
    captionCheckedAt: "2026-08-02T00:00:00Z",
    publicRightsReview: {
      status: "not-requested",
      reviewedBy: null,
      reviewedAt: null,
      reviewedVideoDigest: null,
      policyVersion: null,
      termsCheckedAt: null,
      decisionBasis: null,
      notes: null,
      decisionPath: null,
      decisionDigest: null,
    },
    segments: [
      {
        startSeconds: 10,
        endSeconds: 22,
        observation: "虛構觀察：落地時踩到對手腳部，足部內翻。",
      },
    ],
  },
  general: {
    whatHappened:
      "在一場虛構例行賽中，虛構球員乙搶籃板落地時踩到對手腳部，右踝內翻。",
    whatIsVisible: "畫面可見的是內翻落地模式：足部落在他人腳上後向內翻轉。",
    whatVideoCannotProve:
      "影片無法證明韌帶損傷分級、是否骨折或高位踝扭傷；需要臨床檢查與影像學檢查。",
    confirmedUpdate:
      "虛構球團其後在傷情報告中確認右外側踝關節扭傷（虛構示範）。",
  },
  professional: {
    mechanismAnalysis:
      "虛構分析：落地接觸他人足部造成的內翻，是文獻中討論外側踝扭傷時常見的可見模式。",
    clinicalLimitations: "影片觀察無法確認受累韌帶或分級，也無法排除骨折。",
    differentialContext:
      "高位踝扭傷與骨軟骨損傷無法僅憑影片排除，需要臨床檢查與影像學檢查。",
    treatmentAndRtpMeaning:
      "已發表的踝扭傷回場討論強調以症狀與功能為準的漸進式決策，而非固定日期。",
    claims: [
      {
        id: "claim-fic-902-01",
        field: "professional.mechanismAnalysis",
        text: "虛構分析：落地接觸他人足部造成的內翻，是文獻中討論外側踝扭傷時常見的可見模式。",
        evidenceIds: ["src-fic-902-teach-a"],
      },
      {
        id: "claim-fic-902-02",
        field: "professional.clinicalLimitations",
        text: "影片觀察無法確認受累韌帶或分級，也無法排除骨折。",
        evidenceIds: ["src-fic-902-teach-a"],
      },
      {
        id: "claim-fic-902-03",
        field: "professional.differentialContext",
        text: "高位踝扭傷與骨軟骨損傷無法僅憑影片排除，需要臨床檢查與影像學檢查。",
        evidenceIds: ["src-fic-902-teach-a"],
      },
      {
        id: "claim-fic-902-04",
        field: "professional.treatmentAndRtpMeaning",
        text: "已發表的踝扭傷回場討論強調以症狀與功能為準的漸進式決策，而非固定日期。",
        evidenceIds: ["src-fic-902-teach-a"],
      },
    ],
    evidenceIds: ["src-fic-902-teach-a"],
    rtpCourseKey: "ankle-lateral-nonoperative",
  },
  sources: [
    {
      id: "src-fic-902-video",
      type: "video-original",
      title: "虛構官方平台片段（Fictional official platform clip）",
      publisher: "虛構官方轉播單位（Fictional Broadcast Unit）",
      independenceGroup: "fictional-broadcast-unit",
      originReportId: null,
      url: "https://www.nba.com/watch/fictional-demo-clip-beta",
      publishedAt: "2026-01-21",
      accessedAt: "2026-08-01",
      supports: [
        "general.whatHappened",
        "general.whatIsVisible",
        "video.segmentObservation",
      ],
    },
    {
      id: "src-fic-902-first-party",
      type: "diagnosis-first-party",
      title: "虛構球團傷情報告（Fictional club injury report）",
      publisher: "虛構都會彗星隊公關部（Fictional Comets Communications）",
      independenceGroup: "fictional-metro-comets",
      originReportId: null,
      url: "https://club.fictional-comets.example/injury-report-902",
      publishedAt: "2026-01-22",
      accessedAt: "2026-08-01",
      supports: ["injury.confirmedDiagnosis", "general.confirmedUpdate"],
    },
    {
      id: "src-fic-902-event",
      type: "event-context",
      title: "虛構聯盟比賽紀錄（Fictional league game log）",
      publisher: "虛構聯盟資料庫（Fictional League Data）",
      independenceGroup: "fictional-league-data",
      originReportId: null,
      url: "https://data.fictional-league.example/games/fic-2026-01-20",
      publishedAt: "2026-01-20",
      accessedAt: "2026-08-01",
      supports: ["general.whatHappened"],
    },
    {
      id: "src-fic-902-teach-a",
      type: "teaching-evidence",
      title: "虛構臨床指引：外側踝扭傷評估與回場（Fictional ankle guideline）",
      publisher: "虛構物理治療學會（Fictional Physiotherapy Society）",
      independenceGroup: "fictional-physio-society",
      originReportId: null,
      url: "https://guideline.fictional-physio.example/ankle-sprain",
      publishedAt: "2024-05-01",
      accessedAt: "2026-08-01",
      supports: [
        "professional.mechanismAnalysis",
        "professional.clinicalLimitations",
        "professional.differentialContext",
        "professional.treatmentAndRtpMeaning",
      ],
    },
  ],
  review: {
    status: "in-review",
    reviewerName: null,
    reviewerQualification: null,
    reviewedAt: null,
    reviewedContentDigest: null,
  },
  audit: {
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-05T00:00:00Z",
    sourceRecordId: "FIC-REVIEW-CAND-902",
  },
});

export const reviewFixtureCases: InjuryCase[] = [
  reviewFixtureClassicCase,
  reviewFixtureExternalLinkCase,
];

/** Fictional ankle-sprain teaching overview in medical review. */
export const reviewFixtureOverview: InjuryOverview = {
  schemaVersion: 1,
  injuryCode: "ankle-sprain",
  status: "medical-review",
  titleZh: "踝關節扭傷（虛構教學示範）",
  summaryZh:
    "以公開影片觀察為基礎的踝關節扭傷教學總覽；本頁全部為虛構示範內容。",
  scope:
    "本虛構總覽涵蓋職業籃球比賽影片中可見的外側踝關節扭傷，僅供觀察教學示範。",
  basicAnatomyAndDefinition:
    "外側踝韌帶群穩定踝關節、對抗內翻；外側踝扭傷是這些韌帶的拉伸或撕裂（虛構教學文字）。",
  commonObservedMechanisms:
    "常見的非診斷性可見模式包括內翻落地、踩到他人腳部與接觸後落地（虛構教學文字）。",
  whatVideoCannotProve:
    "影片無法證明韌帶分級、骨折或高位踝扭傷；診斷必須依靠臨床檢查與影像學檢查。",
  diagnosisContext:
    "診斷依靠臨床檢查並在需要時輔以影像學檢查，而不是影片外觀（虛構教學文字）。",
  treatmentContext:
    "治療為個別化決策，通常強調在臨床監測下的早期保護性負重（虛構教學文字）。",
  rtpContext:
    "回場決策使用高層次的漸進功能標準；本總覽不重製任何特定復健課程內容。",
  claims: [
    {
      id: "ov-fic-claim-01",
      field: "scope",
      text: "本虛構總覽涵蓋職業籃球比賽影片中可見的外側踝關節扭傷，僅供觀察教學示範。",
      evidenceIds: ["ov-fic-src-a"],
    },
    {
      id: "ov-fic-claim-02",
      field: "basicAnatomyAndDefinition",
      text: "外側踝韌帶群穩定踝關節、對抗內翻；外側踝扭傷是這些韌帶的拉伸或撕裂（虛構教學文字）。",
      evidenceIds: ["ov-fic-src-a"],
    },
    {
      id: "ov-fic-claim-03",
      field: "commonObservedMechanisms",
      text: "常見的非診斷性可見模式包括內翻落地、踩到他人腳部與接觸後落地（虛構教學文字）。",
      evidenceIds: ["ov-fic-src-a", "ov-fic-src-b"],
    },
    {
      id: "ov-fic-claim-04",
      field: "whatVideoCannotProve",
      text: "影片無法證明韌帶分級、骨折或高位踝扭傷；診斷必須依靠臨床檢查與影像學檢查。",
      evidenceIds: ["ov-fic-src-b"],
    },
    {
      id: "ov-fic-claim-05",
      field: "diagnosisContext",
      text: "診斷依靠臨床檢查並在需要時輔以影像學檢查，而不是影片外觀（虛構教學文字）。",
      evidenceIds: ["ov-fic-src-a"],
    },
    {
      id: "ov-fic-claim-06",
      field: "treatmentContext",
      text: "治療為個別化決策，通常強調在臨床監測下的早期保護性負重（虛構教學文字）。",
      evidenceIds: ["ov-fic-src-b"],
    },
    {
      id: "ov-fic-claim-07",
      field: "rtpContext",
      text: "回場決策使用高層次的漸進功能標準；本總覽不重製任何特定復健課程內容。",
      evidenceIds: ["ov-fic-src-b"],
    },
  ],
  evidenceIds: ["ov-fic-src-a", "ov-fic-src-b"],
  sources: [
    {
      id: "ov-fic-src-a",
      type: "teaching-evidence",
      title: "虛構文獻回顧：外側踝扭傷解剖與機轉（Fictional anatomy review）",
      publisher: "虛構運動醫學期刊（Fictional Journal of Sports Medicine）",
      independenceGroup: "fictional-journal",
      originReportId: null,
      url: "https://journal.fictional-sports-medicine.example/ankle-overview",
      publishedAt: "2024-05-01",
      accessedAt: "2026-08-01",
      supports: [
        "scope",
        "basicAnatomyAndDefinition",
        "commonObservedMechanisms",
        "whatVideoCannotProve",
        "diagnosisContext",
        "treatmentContext",
        "rtpContext",
      ],
    },
    {
      id: "ov-fic-src-b",
      type: "teaching-evidence",
      title: "虛構共識聲明：踝扭傷處置（Fictional ankle management consensus）",
      publisher: "虛構物理治療學會（Fictional Physiotherapy Society）",
      independenceGroup: "fictional-physio-society",
      originReportId: null,
      url: "https://society.fictional-physio.example/ankle-management",
      publishedAt: "2023-11-15",
      accessedAt: "2026-08-01",
      supports: [
        "scope",
        "basicAnatomyAndDefinition",
        "commonObservedMechanisms",
        "whatVideoCannotProve",
        "diagnosisContext",
        "treatmentContext",
        "rtpContext",
      ],
    },
  ],
  review: {
    status: "in-review",
    reviewerName: null,
    reviewerQualification: null,
    reviewedAt: null,
    reviewedContentDigest: null,
  },
  audit: {
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-05T00:00:00Z",
  },
};

/** Fictional baseline quarterly update listing the two fixture cases. */
export const reviewFixtureUpdate: QuarterlyUpdate = {
  schemaVersion: 1,
  id: "2026-q3",
  period: {
    year: 2026,
    quarter: 3,
    startDate: "2026-07-01",
    endDate: "2026-09-30",
  },
  status: "draft",
  summary: "虛構基準季度更新：收錄兩筆虛構示範案例（虛構球員甲與虛構球員乙）。",
  publishedAt: null,
  addedCases: [
    {
      caseId: reviewFixtureClassicCase.id,
      currentClinicalDigest: computeCaseContentDigest(reviewFixtureClassicCase),
      currentVideoSourceDigest: computeVideoSourceDigest(
        reviewFixtureClassicCase,
      ),
    },
    {
      caseId: reviewFixtureExternalLinkCase.id,
      currentClinicalDigest: computeCaseContentDigest(
        reviewFixtureExternalLinkCase,
      ),
      currentVideoSourceDigest: computeVideoSourceDigest(
        reviewFixtureExternalLinkCase,
      ),
    },
  ],
  updatedCases: [],
  retiredCases: [],
  unavailableCases: [],
  review: {
    status: "not-requested",
    reviewerName: null,
    reviewerQualification: null,
    reviewedAt: null,
    reviewedContentDigest: null,
  },
  audit: {
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-05T00:00:00Z",
  },
};

/**
 * Review-fixture adapter: the only reader of these records. Public mode gets
 * an empty list, and the public selectors independently reject every fixture
 * because public rights are not requested.
 */
export function selectReviewFixtureCases(mode: BuildMode): InjuryCase[] {
  return mode === "review" ? reviewFixtureCases : [];
}
