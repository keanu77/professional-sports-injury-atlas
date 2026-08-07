/**
 * Deterministic authoring helper for the authorized G3 NBA launch batch.
 *
 * This script is deliberately write-free: it emits an apply_patch payload so
 * content creation still happens through the repository's reviewed patch path.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  CASE_AUTHORING_PLAN_PATH,
  extractCaseAuthoringCoverage,
  type CaseAuthoringCoverageV1,
} from "./check-case-authoring-coverage";
import { computeVideoIdentityDigest } from "../src/lib/cases/digest";
import type { InjuryCase } from "../src/lib/contracts/case";

type InjuryCode = "acl" | "ankle-sprain" | "achilles-rupture";

const CHECKED_AT = "2026-08-08T02:30:00Z";
const ACCESSED_AT = "2026-08-08";

const VIDEO_DURATION_SECONDS: Record<string, number> = {
  "case-acl-01": 34,
  "case-acl-02": 27,
  "case-acl-03": 87,
  "case-acl-04": 78,
  "case-acl-05": 45,
  "case-acl-06": 147,
  "case-acl-07": 295,
  "case-ankle-01": 40,
  "case-ankle-02": 53,
  // The legacy article embeds NBA asset 1310916. Its current international
  // player returns no duration; keep this entry out of generated output until
  // the original-platform duration is independently recovered.
  "case-ankle-03": 0,
  "case-ankle-04": 44,
  "case-ankle-05": 59,
  "case-ankle-06": 36,
  "case-ankle-07": 81,
  "case-ankle-08": 93,
  "case-ankle-09": 28,
  "case-ankle-10": 64,
  "case-ankle-11": 38,
  "case-ankle-12": 81,
  "case-achilles-01": 78,
  "case-achilles-02": 41,
  "case-achilles-03": 56,
  "case-achilles-04": 42,
  "case-achilles-05": 74,
  "case-achilles-06": 91,
  "case-achilles-07": 100,
};

const VISIBLE_OBSERVATIONS: Record<string, string> = {
  "case-acl-01":
    "片段呈現 Markelle Fultz 切入籃下後倒地，隨後由隊友協助離場；僅記錄可見事件序列。",
  "case-acl-02":
    "片段呈現 Thomas Bryant 落地後停止動作並離場；畫面不足以判定組織受傷型態。",
  "case-acl-03":
    "片段呈現 Ricky Rubio 在第四節末段膝部不適後停止比賽；僅記錄可見經過。",
  "case-acl-04": "片段呈現 Joe Ingles 左膝事件與離場過程；畫面本身不提供診斷。",
  "case-acl-05":
    "片段呈現 Danny Green 在比賽回合後左膝不適並退出比賽；僅記錄可見結果。",
  "case-acl-06":
    "片段呈現 Moritz Wagner 在第一節末段左膝事件後離場；不由畫面推定病理。",
  "case-acl-07":
    "片段呈現 Kyrie Irving 在第一節左膝事件後停止比賽並離場；不由畫面推定嚴重度。",
  "case-ankle-01":
    "片段呈現 CJ McCollum 在腳踝事件後退出比賽；畫面本身不提供分級。",
  "case-ankle-02":
    "片段呈現 Ja Morant 左腳踝事件後停止比賽並由輪椅離場；僅描述可見經過。",
  "case-ankle-04":
    "片段呈現 Trae Young 腳踝事件後倒地並由他人協助離場；不由畫面判定分級。",
  "case-ankle-05":
    "NBA 文章內嵌片與官方 Watch 資產 568084 一致；片段呈現 Kyrie Irving 腳踝事件後離場。",
  "case-ankle-06":
    "片段呈現 LaMelo Ball 在第四節末段左腳踝事件後停止比賽；僅記錄可見序列。",
  "case-ankle-07":
    "片段呈現 Anfernee Simons 在第三節末段腳踝事件後離場；畫面不足以判定分級。",
  "case-ankle-08":
    "ESPN 原頁目前受地區限制；保留完整 93 秒時間窗供人工重開，不從不可播放畫面新增機轉判讀。",
  "case-ankle-09":
    "片段呈現 LaMelo Ball 右腳踝事件後停止比賽；僅記錄可見事件序列。",
  "case-ankle-10":
    "片段呈現 Kevin Durant 在第二節末段左腳踝事件後停止比賽；不由畫面判定分級。",
  "case-ankle-11":
    "片段呈現 LaMelo Ball 投進三分球後倒退移動、踩到他人腳部並停止比賽。",
  "case-ankle-12":
    "片段呈現 Anthony Edwards 踩到場邊人員腳部後落地不穩並前往休息室。",
  "case-achilles-01":
    "片段呈現 Kevin Durant 在比賽回合中右下肢事件後停止比賽並離場；不由畫面確認診斷。",
  "case-achilles-02":
    "片段呈現 Dwight Powell 朝籃框移動時出現非接觸下肢事件並停止比賽。",
  "case-achilles-03":
    "片段呈現 Brandon Clarke 在比賽回合後停止動作並離場；僅記錄可見經過。",
  "case-achilles-04":
    "片段呈現 Dejounte Murray 在第一節右小腿事件後停止比賽；不由畫面推定病理。",
  "case-achilles-05":
    "片段呈現 Damian Lillard 在第一節左小腿事件後停止比賽並離場。",
  "case-achilles-06":
    "片段呈現 Jayson Tatum 在第四節出現非接觸右小腿事件後停止比賽。",
  "case-achilles-07":
    "片段呈現 Tyrese Haliburton 在總冠軍賽第七戰第一節右下肢事件後由他人協助離場。",
};

const TEACHING: Record<
  InjuryCode,
  {
    claims: Array<{
      field:
        | "professional.mechanismAnalysis"
        | "professional.clinicalLimitations"
        | "professional.differentialContext"
        | "professional.treatmentAndRtpMeaning";
      text: string;
      evidence: number[];
    }>;
    sources: Array<{
      title: string;
      publisher: string;
      independenceGroup: string;
      url: string;
      publishedAt: string;
      supports: Array<
        | "professional.mechanismAnalysis"
        | "professional.clinicalLimitations"
        | "professional.differentialContext"
        | "professional.treatmentAndRtpMeaning"
      >;
    }>;
  }
> = {
  acl: {
    claims: [
      {
        field: "professional.mechanismAnalysis",
        text: "單一比賽剪輯只能描述接觸、落地、減速或變向等可見線索；不能由倒地方式反推 ACL 斷裂、側別或嚴重度。",
        evidence: [0],
      },
      {
        field: "professional.clinicalLimitations",
        text: "ACL 損傷的判定須整合病史、理學檢查與適當影像；影片不能取代臨床診斷。",
        evidence: [0],
      },
      {
        field: "professional.differentialContext",
        text: "急性膝傷可能同時涉及半月板、軟骨或其他韌帶；本案例只採用具名來源明載的診斷，不從影片增列合併傷。",
        evidence: [0],
      },
      {
        field: "professional.treatmentAndRtpMeaning",
        text: "治療與回場須依個別病況決定；若進入 ACL 重建術後復健，進階應結合症狀、功能與客觀里程碑，而非套用固定回場日期。",
        evidence: [0, 1],
      },
    ],
    sources: [
      {
        title:
          "Management of Anterior Cruciate Ligament Injuries: Evidence-Based Clinical Practice Guideline",
        publisher: "American Academy of Orthopaedic Surgeons",
        independenceGroup: "aaos",
        url: "https://new.aaos.org/globalassets/quality-and-practice-resources/anterior-cruciate-ligament-injuries/aclcpg.pdf",
        publishedAt: "2022-08-22",
        supports: [
          "professional.mechanismAnalysis",
          "professional.clinicalLimitations",
          "professional.differentialContext",
          "professional.treatmentAndRtpMeaning",
        ],
      },
      {
        title:
          "Aspetar clinical practice guideline on rehabilitation after anterior cruciate ligament reconstruction",
        publisher: "British Journal of Sports Medicine",
        independenceGroup: "british-journal-of-sports-medicine",
        url: "https://bjsm.bmj.com/content/57/9/500",
        publishedAt: "2023-02-02",
        supports: ["professional.treatmentAndRtpMeaning"],
      },
    ],
  },
  "ankle-sprain": {
    claims: [
      {
        field: "professional.mechanismAnalysis",
        text: "影片可描述踩到他人腳部、落地或足部翻轉等外觀；若角度或接觸點不清楚，應標示機轉不明。",
        evidence: [0],
      },
      {
        field: "professional.clinicalLimitations",
        text: "畫面不能分辨韌帶分級、骨折或高位踝損傷，仍須以症狀、觸診、負重能力與適當檢查評估。",
        evidence: [0],
      },
      {
        field: "professional.differentialContext",
        text: "急性腳踝事件的鑑別不只外側韌帶扭傷；若臨床疑慮存在，還需排除骨折、脛腓聯合與其他周邊組織損傷。",
        evidence: [0],
      },
      {
        field: "professional.treatmentAndRtpMeaning",
        text: "處置與回場應依疼痛、活動度、力量、平衡、信心與運動任務逐項評估，不能由新聞時程或影片單獨決定。",
        evidence: [0],
      },
    ],
    sources: [
      {
        title:
          "Ankle Stability and Movement Coordination Impairments: Lateral Ankle Ligament Sprains Revision 2021",
        publisher: "Journal of Orthopaedic & Sports Physical Therapy",
        independenceGroup: "journal-of-orthopaedic-sports-physical-therapy",
        url: "https://pubmed.ncbi.nlm.nih.gov/33789434/",
        publishedAt: "2021-04-01",
        supports: [
          "professional.mechanismAnalysis",
          "professional.clinicalLimitations",
          "professional.differentialContext",
          "professional.treatmentAndRtpMeaning",
        ],
      },
    ],
  },
  "achilles-rupture": {
    claims: [
      {
        field: "professional.mechanismAnalysis",
        text: "影片可描述蹬地、加速、減速或非接觸下肢事件等外觀，但不能僅憑動作確認 Achilles tendon rupture。",
        evidence: [0],
      },
      {
        field: "professional.clinicalLimitations",
        text: "Achilles tendon rupture 的判定需要臨床評估，必要時搭配超音波等影像；影片不能確認斷裂位置、間隙或完整性。",
        evidence: [0],
      },
      {
        field: "professional.differentialContext",
        text: "急性小腿後側事件尚需與其他肌腱、肌肉或踝部病灶區分；本案例只採用具名來源明載的診斷。",
        evidence: [0],
      },
      {
        field: "professional.treatmentAndRtpMeaning",
        text: "急性 Achilles tendon rupture 可有手術或非手術路徑；選擇與功能復健、進階及回場都應個別化，不能套用單一時程。",
        evidence: [0],
      },
    ],
    sources: [
      {
        title: "Position Statement: Management of Acute Achilles Ruptures",
        publisher: "American Orthopaedic Foot & Ankle Society",
        independenceGroup: "aofas",
        url: "https://www.aofas.org/docs/default-source/research-and-policy/position-statements/positionstatement_acuteachillesruptures_nov2024.pdf",
        publishedAt: "2024-11-19",
        supports: [
          "professional.mechanismAnalysis",
          "professional.clinicalLimitations",
          "professional.differentialContext",
          "professional.treatmentAndRtpMeaning",
        ],
      },
    ],
  },
};

function loadCoverage(): {
  coverage: CaseAuthoringCoverageV1;
  manifestEntries: Map<string, any>;
} {
  const planText = readFileSync(resolve(CASE_AUTHORING_PLAN_PATH), "utf8");
  const parsed = extractCaseAuthoringCoverage(planText);
  if (parsed.coverage === null || parsed.issues.length > 0) {
    throw new Error(
      `invalid authoring coverage: ${JSON.stringify(parsed.issues)}`,
    );
  }
  const manifest = JSON.parse(
    readFileSync(resolve(parsed.coverage.sourceBinding.manifestPath), "utf8"),
  ) as { entries: any[] };
  return {
    coverage: parsed.coverage,
    manifestEntries: new Map(
      manifest.entries.map((entry) => [entry.candidateId, entry]),
    ),
  };
}

function sourcePrefix(task: typeof loadCoverage extends never ? never : any) {
  return task.plannedSourceMappings.teachingEvidenceIdPrefix as string;
}

function buildCase(
  task: CaseAuthoringCoverageV1["cases"][number],
  manifestEntry: any,
  coverage: CaseAuthoringCoverageV1,
): InjuryCase {
  const durationSeconds = VIDEO_DURATION_SECONDS[task.taskId];
  if (!Number.isInteger(durationSeconds) || durationSeconds < 1) {
    throw new Error(
      `${task.taskId} has no verified original-platform duration; refusing to fabricate content`,
    );
  }
  const teaching = TEACHING[task.injuryCode as InjuryCode];
  const teachingSources = teaching.sources.map((source, index) => ({
    id: `${sourcePrefix(task)}${String(index + 1).padStart(2, "0")}`,
    type: "teaching-evidence" as const,
    ...source,
    originReportId: null,
    accessedAt: ACCESSED_AT,
  }));
  const claims = teaching.claims.map((claim, index) => ({
    id: `claim-${task.slug}-${String(index + 1).padStart(2, "0")}`,
    field: claim.field,
    text: claim.text,
    evidenceIds: claim.evidence.map(
      (sourceIndex) => teachingSources[sourceIndex]!.id,
    ),
  }));
  const fieldText = (field: (typeof claims)[number]["field"]): string =>
    claims
      .filter((claim) => claim.field === field)
      .map((claim) => claim.text)
      .join("\n\n");
  const mapped = task.plannedSourceMappings;
  const sources = [
    mapped.videoOriginal.plannedCaseSource,
    ...mapped.diagnosis.map((entry) => entry.plannedCaseSource),
    mapped.eventContext.plannedCaseSource,
    ...teachingSources,
  ];
  const observation =
    VISIBLE_OBSERVATIONS[task.taskId] ??
    `片段呈現 ${manifestEntry.athleteDisplayName} 的比賽事件與離場過程；僅記錄可見事件序列。`;
  const record: InjuryCase = {
    schemaVersion: 1,
    id: task.caseId,
    slug: task.slug,
    status: "medical-review",
    sourceManifestBinding: {
      candidateId: task.candidateId,
      manifestId: coverage.sourceBinding.manifestId,
      manifestDigest: coverage.sourceBinding.manifestDigest,
      entryDigest: task.entryDigest,
      sourceReviewDecisionDigest:
        coverage.sourceBinding.sourceReviewDecisionDigest,
      sourcePolicyVersion: coverage.sourceBinding.sourcePolicyVersion,
    },
    sport: { code: "basketball" },
    league: { code: "nba" },
    competition: { code: manifestEntry.competition },
    athlete: { name: manifestEntry.athleteDisplayName },
    teamAtEvent: { name: manifestEntry.teamAtEvent },
    season: manifestEntry.season,
    eventDate: manifestEntry.eventDate,
    opponent: { name: manifestEntry.opponent },
    injury: {
      code: manifestEntry.injuryCode,
      confirmedDiagnosis: manifestEntry.diagnosisClaim,
      confirmationStatus: "confirmed",
    },
    observedMechanismTags: ["unclear"],
    isClassic: false,
    classicReason: null,
    classicProposedBy: null,
    classicExceptionApprovedBy: null,
    video: {
      provider: manifestEntry.video.provider,
      contentType: manifestEntry.video.contentType,
      eventBinding: {
        status: "verified",
        eventSourceId: mapped.eventContext.plannedCaseSource.id,
        checkedBy: "Codex G3 authoring audit",
        checkedAt: CHECKED_AT,
        basis: manifestEntry.eventBinding.basis,
      },
      canonicalUrl: manifestEntry.video.canonicalUrl,
      uploaderName: manifestEntry.video.uploaderName,
      uploaderProvenance: manifestEntry.video.uploaderProvenance,
      embedStatus: manifestEntry.video.embedStatus,
      embedCheckedAt: manifestEntry.video.embedCheckedAt,
      durationSeconds,
      startSeconds: 0,
      endSeconds: durationSeconds,
      fallbackUrl: manifestEntry.video.canonicalUrl,
      sourceProvenanceVerification: {
        status: "verified",
        verifiedBy: manifestEntry.video.provenanceCheckedBy,
        verifiedAt: manifestEntry.video.provenanceCheckedAt,
        basis: manifestEntry.video.provenanceBasis,
        notes:
          manifestEntry.video.provider === "youtube"
            ? "原頁在目前地區顯示不可播放；不下載媒體，保留同一原始網址作人工覆核。"
            : "NBA 原頁播放器未提供可用字幕控制；以同一 canonical URL 作外連 fallback。",
        verifiedPolicyVersion: coverage.sourceBinding.sourcePolicyVersion,
        reviewedVideoIdentityDigest: "0".repeat(64),
      },
      captionStatus: manifestEntry.video.captionStatus,
      captionCheckedAt: manifestEntry.video.captionCheckedAt,
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
          startSeconds: 0,
          endSeconds: durationSeconds,
          observation,
        },
      ],
    },
    general: {
      whatHappened: `${manifestEntry.athleteDisplayName} 於 ${manifestEntry.eventDate} 代表 ${manifestEntry.teamAtEvent} 對 ${manifestEntry.opponent} 出賽；原始事件頁與診斷來源已分開記錄。`,
      whatIsVisible: observation,
      whatVideoCannotProve:
        "這段影片不能單獨證明診斷、分級、側別以外的合併傷、影像結果、治療方式、預後或回場日期。",
      confirmedUpdate: `${mapped.diagnosis[0]!.plannedCaseSource.publisher} 的具名來源明載診斷：${manifestEntry.diagnosisClaim}`,
    },
    professional: {
      mechanismAnalysis: fieldText("professional.mechanismAnalysis"),
      clinicalLimitations: fieldText("professional.clinicalLimitations"),
      differentialContext: fieldText("professional.differentialContext"),
      treatmentAndRtpMeaning: fieldText("professional.treatmentAndRtpMeaning"),
      claims,
      evidenceIds: [
        ...new Set(claims.flatMap((claim) => claim.evidenceIds)),
      ].sort(),
      rtpCourseKey: null,
    },
    sources,
    review: {
      status: "in-review",
      reviewerName: null,
      reviewerQualification: null,
      reviewedAt: null,
      reviewedContentDigest: null,
    },
    audit: {
      createdAt: CHECKED_AT,
      updatedAt: CHECKED_AT,
      sourceRecordId: task.candidateId,
    },
  };
  record.video.sourceProvenanceVerification.reviewedVideoIdentityDigest =
    computeVideoIdentityDigest(record);
  return record;
}

function patchForFile(path: string, value: unknown): string {
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  return `*** Add File: ${path}\n${bytes
    .split("\n")
    .slice(0, -1)
    .map((line) => `+${line}`)
    .join("\n")}\n`;
}

const group = process.argv[2];
if (!group || !["acl", "ankle-sprain", "achilles-rupture"].includes(group)) {
  throw new Error(
    "usage: tsx scripts/generate-authorized-nba-content.ts <acl|ankle-sprain|achilles-rupture>",
  );
}

const { coverage, manifestEntries } = loadCoverage();
const selected = coverage.cases.filter((entry) => entry.injuryCode === group);
const patches = selected.map((task) => {
  const manifestEntry = manifestEntries.get(task.candidateId);
  if (!manifestEntry)
    throw new Error(`missing manifest entry ${task.candidateId}`);
  return patchForFile(task.path, buildCase(task, manifestEntry, coverage));
});
process.stdout.write(`*** Begin Patch\n${patches.join("")}*** End Patch\n`);
