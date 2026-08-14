/** Review-only presentation constants for Decision 17 pending follow-ups. */

import type {
  CaseFollowUp,
  FollowUpKind,
  FollowUpSourceTier,
} from "../contracts/case-follow-up";
import type { BuildMode } from "../governance/build-mode";

export const FOLLOW_UP_BLOCK_ATTRIBUTION =
  "以下內容是第三方報導的整理，不是本站醫師的診斷、評估或建議。" as const;

export const FOLLOW_UP_EMPTY_COPY =
  "查無符合本政策且可逐條引用的紀錄；未據此推定未曾發生。" as const;

export const ACTUAL_RETURN_RETROSPECTIVE_COPY =
  "實際回場紀錄只描述已發生的參賽事實，不是治療時長、預後、建議或可套用的回場時間表。" as const;

export const FOLLOW_UP_KIND_LABELS: Readonly<Record<FollowUpKind, string>> = {
  treatment: "治療",
  surgery: "手術",
  injection: "注射",
  "actual-return": "實際回場",
};

export const FOLLOW_UP_SOURCE_TIER_LABELS: Readonly<
  Record<FollowUpSourceTier, string>
> = {
  "team-or-league-official": "球隊／聯盟官方公告（team-or-league-official）",
  "mainstream-media-report": "主流媒體報導（mainstream-media-report）",
  "unverified-report": "未證實報導（unverified-report；不可視為已確認）",
};

/** Pending sidecars are never projected into public output. */
export function pendingFollowUpForBuildMode(
  mode: BuildMode,
  followUp: CaseFollowUp,
): CaseFollowUp | null {
  return mode === "review" ? followUp : null;
}
