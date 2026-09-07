# 最新交接 — Decision 39（2026-09-07）

## 目前狀態

Decision 37 的 15 項建議、預設夜間模式與六個追蹤入口均已由 Codex 完成、推送及正式部署。Atlas 正式功能來源 `1ba51be7cbc4d19abba5db047ac2e538965d8719`；主站依賴來源 `d2533c9239b5987f4ede70143c6b8d3902586c51`。

## 已完成

- 手機分類、卡片 metadata、民眾導讀、回場里程碑、觸控目標、相關影片、分類 hash 返回、字幕／聲音說明、favicon／OG／VideoObject／sitemap、導覽文字全部完成。
- 空投稿前後端拒絕；D1 共享播放防重 migration 已套用 preview 與 production。
- CSP 移除 `script-src 'unsafe-inline'`；主站 Turnstile 精確綁定四組合法 hostname/action，400 與 503 分流，日誌不含投稿內容、token、IP 或上游正文。
- 逐筆 `checkedAt` 與每週來源健康工作流程完成。實掃 101 影片／287 來源：YouTube oEmbed 101／101；2 個確認 404、15 個無法判定；無 YouTube API key，嵌入權限檢查誠實標為 skipped。
- 依賴高風險公告修補完成，Atlas `npm audit --audit-level=high` 為 0。
- 使用者追加的預設夜間模式、可持久切換，以及主站六個追蹤入口已上線。

## 驗證基準

- Atlas：1457／1457 unit、16／16 Decision 39 browser、12／12 contribution E2E；Astro 0 error／0 warning；public release 101 bindings、145 pages、3,323 local links。
- 新增功能：37／37 Chromium 整合驗收；44／44 跨 Chromium、Firefox、WebKit 與行動 Chromium 版型／無障礙驗收。
- 主站：30／30 Turnstile 目標測試、1590／1590 full tests、380 pages；369／369 搜尋探索無錯誤；路徑連續性 unresolved=0。
- 最新 public input digest：`5d44498932844e71d7ef156bdd59783f90b337e1bf18b71c9f0b340ef7116e60`。
- D1 preview `atlas-playback-preview` 與 production `atlas-playback-production` 均已套用 `0003_play_guards.sql`。
- D1 最終複查兩個環境皆 `No migrations to apply`。

## 正式部署

- Atlas deployment：`https://1f9f8b91.sports-injury-atlas.pages.dev/`；自訂網域 `https://injury.sportsmedicine.tw/` 與部署首頁 SHA-256 相同，夜間預設、六個追蹤入口、無 inline script CSP 與偏好腳本均實測。
- 主站 deployment：`https://4ca9fa52.sportsmedicine-tw.pages.dev/`；自訂網域 contact 與 deployment HTML SHA-256 相同，`data-action="main-contact"` 已實測。無效 token 回 400 且沒有寄信。

## 尚待使用者批准的唯一驗收

送出 1 封真人投稿測試信，確認 Resend 到實際收件匣的完整鏈路。這會占用一次投稿額度並寄出一封信；沒有明確允許前不得執行。mock、4xx 或程式測試均不能宣稱實際收件。

## 文件

完整對照與驗證：`docs/reviews/2026-09-07-decision-39-top-tier-implementation.md`。Decision 37 原稽核及 evidence 保持不變。
