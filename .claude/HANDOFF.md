# 最新交接 — Decision 35（2026-09-06）

## 現況

正式 https://injury.sportsmedicine.tw/ 已啟用；Pages domain、驗證、TLS 狀態 active。CNAME 由使用者新增，先前 522／pending 已解決，不要再要求新增 DNS。主站首頁及 /content/ 的 HTTP 200 與內容 hash 和本輪前相同。

正式部署 3593ae04-0722-42cc-ae18-367d7b933b12，來源 d42d5163986d306b312de3336382b561591100c0，main，乾淨提交；已 commit/push。root dist 是最終正式產物。收尾證據／文件另提交，不需重部署。仍為 101 支影片、11 部位、15 運動，其中棒球 30 支。

## 最新補充（21:06 台灣時間）

使用者要求公開影片網址選填，已同步移除前端必填、切換時更新 required，backend 接受省略／空白影片 URL，有填仍驗格式，信內顯示「未提供」。資料修正頁面 URL 仍必填。36 項相關單元、四瀏覽器 16 項、Astro 0 errors／0 warnings、release:public 通過；正式 /contribute/ hash 相符，留白與分類切換以攔截 API 的瀏覽器測試確認，未寄真實郵件。收件設定未變更；本機主站收件地址已告知使用者，正式 CONTACT_RECIPIENT_EMAIL 為不可讀回 secret，不能用本機值保證正式收件地址。

證據 docs/reviews/evidence/decision-35/optional-url/。以下完整站點回歸紀錄屬前一版，這次小改只重跑相關驗證。

## 本輪功能

右上角新增「製作者／運動醫學科 吳易澄醫師」連回 https://sportsmedicine.tw/；新增「提供影片／資料修正」至 /contribute/。無訪客姓名／信箱；公開影片網址或需要修正的頁面、說明、最多 3 筆來源。從任何頁面進入，選資料修正時自動帶入原頁網址。成功顯示感謝，失敗保留內容並可重試；不會自動改網站內容。

POST /api/contributions 使用固定第一方 https://sportsmedicine.tw/api/contact，由既有主站 Turnstile／Resend／CONTACT_RECIPIENT_EMAIL 處理寄送。未新增寄信 secret，未更動主站程式或設定。no-reply@injury.sportsmedicine.tw 僅為上游必填 email 的系統 placeholder，信內清楚標註沒有訪客回覆信箱。不得把本機主站 .env 的 RESEND placeholder 用在 production。

API 同源、方法、JSON、12 KB body、URL／說明／來源驗證、honeypot，每 isolate/IP 3 次／分鐘；只傳文字、不抓使用者 URL。上游回 ok:true 才回成功。既有主站有選用 KV 3/min、10/hr 限流，跨站 relay 可能共用上游出口 IP，非全域可靠寄信佇列。可能較早遇到 429；未宣稱保證送達或高流量容量。

public/_routes.json 已加入 /api/contributions。CSP 加入 Turnstile script/frame；安全驗證只在表單頁載入。320px 的窄表單使用 compact widget；其餘 flexible。隱私頁新增實際資料流說明。

## 驗證與限制

最終 85 檔 1,380 單元通過，Astro 0 errors／0 warnings（16 既有 hints），格式通過。四瀏覽器頁首／表單 52 項通過；最後提示／尺寸修正再跑表單 12 項通過。release:public：145 HTML、2,322 內部連結、384 產物，原醫療來源凍結／核准不改，只重綁 inputTreeDigest。D35 新 canonical 用獨立 public-domain.v1.json，不改原 D21 醫療 origin。

最終正式 149 回應 hash／canonical 全符，5 頁 × 2 尺寸 Axe／無溢位／入口與表單外觀通過；Turnstile 在這些自動測試中 mock。正式 API GET 405、跨來源 403、缺修正說明 400；以上不寄信。王建民在新網域 native playback 成功，DNT + 攔截 /api/plays，0 transmitted test posts，保留真實熱門資料。

實際 Turnstile widget 已在新網域顯示，但自動 Chrome 未取得 token，畫面要求人工勾選；診斷也觀察到 challenge 子請求 ERR_ADDRESS_UNREACHABLE。沒有繞過或使用測試 key 替代。成功／失敗寄信介面與 backend 單元使用 mock；尚未實際寄信，未確認主站收件匣收到通知。已透過 async 詢問使用者是否同意寄一封「影片圖鑑功能測試」，本輪尚未收到答覆。不要把上線／mock 通過當成端到端寄信已驗證。

## 下一步

1. 使用者同意測試後，開 https://injury.sportsmedicine.tw/contribute/，由真人完成 Turnstile，送一筆清楚標記測試的資料；只送一封，不改安全驗證。
2. 確認頁面成功狀態與使用者實際收信；失敗則依 /api/contributions 狀態及主站 /api/contact 診斷，不記錄 token 或個人內容。未經授權不要更動另一個主站 repo／secret。
3. 更新 docs/reviews/2026-09-06-decision-35-custom-domain.md 的收信驗證結果。無更多已指定功能待實作。

## 文件

報告 docs/reviews/2026-09-06-decision-35-custom-domain.md；證據 docs/reviews/evidence/decision-35/。先前交接完整存 docs/handoffs/2026-09-06-before-decision-35-contributions.md。Node24.14.0；Wrangler4.129.0。原 4321 預覽未改，隔離 E2E 使用 14336。/tmp/atlas35/ 有本輪驗證工具，token 僅由 Wrangler 已有設定於記憶體讀取。
