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

## 投稿實信驗收（已授權，待真人驗證）

使用者已於 2026-09-07 明確授權 1 封測試信。自動化瀏覽器停在 Turnstile 真人驗證，未提交、未寄信；使用者回報反覆驗證失敗。已開啟一般預設瀏覽器的正式投稿頁供重試，尚未確認一般瀏覽器結果，不能宣稱寄送或收件成功。不要使用測試金鑰或跳過驗證完成正式驗收。

## 頁尾追蹤圖示（2026-09-07 追加）

依使用者截圖改為圓形 SVG 圖示，移除 RSS、加入 https://sportsmedicine.tw/ 個人網站（地球圖示）；保留部落格、Facebook、Instagram、GitHub、LINE。功能提交 `4efd324`、發布摘要 `dac351a`。Astro 0 error／0 warning；正式產物 145 頁、3323 站內連結通過；390px／1280px 深淺色瀏覽器檢查六個 SVG、48px 觸控尺寸與無水平溢位通過。

## 文件

完整對照與驗證：`docs/reviews/2026-09-07-decision-39-top-tier-implementation.md`。Decision 37 原稽核及 evidence 保持不變。

## 寄信設定重新部署（2026-09-07 21:51 台灣時間）

使用者確認已更新主站 Cloudflare 的寄信 secrets。以最新主站提交 `992973d7e5c9744dec4234f718aae014865d7de5` 重試部署，保留同期新增文章；本次先前建立的舊提交排隊部署已刪除，未上線。

- 正式部署 `fcacacab-0c07-45cd-9b44-66c5f1df9037`，21:51:26 成功；canonical deployment 已核對吻合。
- 新部署包含 `RESEND_API_KEY`、`CONTACT_FROM_EMAIL`、`CONTACT_RECIPIENT_EMAIL`，秘密值未讀取或記錄。
- Node fetch 實測 sportsmedicine.tw/contact/ 與 fcacacab.sportsmedicine-tw.pages.dev/contact/ 均 200，HTML SHA-256 相同，main-contact action 存在。Python urllib 被 403，未据此判定網站故障。
- D1 最近兩筆投稿時間 21:09:59、21:22:37，皆 uncertain，均早於本次設定部署。沒有新部署後的寄送成功證據。
- 下一步須由一般瀏覽器完成真人驗證並送出一次新測試，再核對 D1 sent、Resend 投遞與實際收件；不得宣稱寄信已修復。

## 投稿 502 根因修正（2026-09-07 22:11）

- 實測 Worker 拋 TypeError：Cloudflare 不支援 fetch redirect=error；改為 manual 並維持所有 3xx 拒絕，轉送入口使用同一主站 sportsmedicine-tw.pages.dev/api/contact。
- 前端明確處理 HTML gateway error，保留輸入，不再一律誤稱連線中斷。
- 69 項投稿／限額單元測試、13 項 Chromium 投稿 E2E 通過；正式產物 145 頁與 3323 連結通過。
- 最新功能提交 0e9ab8c；部署 https://a48bd4dc.sports-injury-atlas.pages.dev 。該部署正式 API 無效碼測試於約 1.6 秒回 400 verification-invalid，主站驗證可達；尚無有效碼寄信／收件成功證據。
- injury.sportsmedicine.tw 相同診斷回 429 ip-daily：真人 3 筆與我建立的診斷占滿每日 10 筆。不可繞過限額。
- 曾暫時記錄遮蔽 URL/長字串的 TypeError message 以定位根因；最終版本移除 message，只記錄 upstream HTTP status 或 error name。
- 自動審核拒絕刪除以下六筆確定由助手建立的無效碼診斷，要求使用者明確同意；尚未執行。只可在明確批准後清理，保留 21:09:59、21:22:37、21:56:40 三筆真人投稿：
  ecde5593-97ff-4588-a87b-50377215dcf8 (21:58:12), 1f9e8163-93ab-470b-a7c5-d903cd0003c7 (22:00:22), e3ca5cc4-e7c1-425d-9e8d-08a65e4331de (22:03:29), d560b1cd-47d5-4dd6-8dd6-088934dcfc84 (22:05:18), acca6c0a-c1d1-4846-8e4f-4edf3e300d26 (22:06:42), 0bdbcf09-3f22-46aa-ac79-c04fb5f77c0a (22:08:08)。
- 未獲清理批准時，額度於台灣午夜自然恢復；下一步一般瀏覽器有效真人驗證實信測試。

## 診斷額度清理完成（2026-09-07）

使用者明確回覆「可以清除」後，已依上一節列出的六個 UUID 且 state=uncertain 精準刪除助手診斷紀錄。D1 回報 changes=6。清理後剩 4 筆：21:09:59、21:22:37、21:56:40 三筆真人投稿（uncertain）完整保留，22:10:17 無效碼驗收（rejected）保留。每日 10 筆限制未修改，恢復至少 6 筆可用額度。下一步由一般瀏覽器送出一次有效真人驗證的測試，再核對寄送與收件；尚未宣稱寄信成功。
