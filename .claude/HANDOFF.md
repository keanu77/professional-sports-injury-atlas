# 最新交接 — Decision 39（2026-09-07）

## 目前狀態

Decision 37 的 15 項建議均已由 Codex 完成本機實作與驗證。Atlas 工作分支 `feat/decision-39-top-tier`，最新功能 commit `8387d34`；主站依賴分支 `fix/decision-39-contact-verification`，最新 commit `d2533c9`。兩個 worktree 都已通過完整 release gate，正式 push／Cloudflare 部署進行中。

## 已完成

- 手機分類、卡片 metadata、民眾導讀、回場里程碑、觸控目標、相關影片、分類 hash 返回、字幕／聲音說明、favicon／OG／VideoObject／sitemap、導覽文字全部完成。
- 空投稿前後端拒絕；D1 共享播放防重 migration 已套用 preview 與 production。
- CSP 移除 `script-src 'unsafe-inline'`；主站 Turnstile 精確綁定四組合法 hostname/action，400 與 503 分流，日誌不含投稿內容、token、IP 或上游正文。
- 逐筆 `checkedAt` 與每週來源健康工作流程完成。實掃 101 影片／287 來源：YouTube oEmbed 101／101；2 個確認 404、15 個無法判定；無 YouTube API key，嵌入權限檢查誠實標為 skipped。
- 依賴高風險公告修補完成，Atlas `npm audit --audit-level=high` 為 0。
- 使用者追加的預設夜間模式、可持久切換，以及主站六個追蹤入口已完成，正進行最後瀏覽器驗收。

## 驗證基準

- Atlas：1457／1457 unit、16／16 Decision 39 browser、12／12 contribution E2E；Astro 0 error／0 warning；public release 101 bindings、145 pages、3,323 local links。
- 主站：30／30 Turnstile 目標測試、1590／1590 full tests、380 pages；369／369 搜尋探索無錯誤；路徑連續性 unresolved=0。
- 最新 public input digest：`5d44498932844e71d7ef156bdd59783f90b337e1bf18b71c9f0b340ef7116e60`。
- D1 preview `atlas-playback-preview` 與 production `atlas-playback-production` 均已套用 `0003_play_guards.sql`。

## 待完成

1. push 主站 main，等 Cloudflare Git 部署並驗證 `data-action=main-contact` 與無效驗證不寄信的 400 路徑。
2. push Atlas main，執行 manual Pages public deploy；核對自訂網域、新頁面邊界、CSP 與 `/preferences-init.js`。
3. 把部署 ID／URL 補回本交接與 Decision 39 報告，再 commit/push。
4. 最後詢問使用者是否允許送出 1 封真人投稿測試信。沒有明確允許前不得寄送；mock 或 4xx 測試不算實際收件。

## 文件

完整對照與驗證：`docs/reviews/2026-09-07-decision-39-top-tier-implementation.md`。Decision 37 原稽核及 evidence 保持不變。
