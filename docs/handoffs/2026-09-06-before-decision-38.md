# 最新交接 — Decision 36（2026-09-06 21:25 台灣時間）

## 正式狀態

https://injury.sportsmedicine.tw/。來源 ee5683c6426c21401bfd44e957640649a75d1a3a 已 commit/push；Production/main 部署 f4e330ba-e41f-4f84-8813-4ded4b197bf7，乾淨提交。root dist 為正式產物；收尾 docs 另提交，不需再部署。仍為 101 影片、11 部位、15 運動，棒球 30。

## 本輪兩項要求均已實作／部署

1. 防灌信：每 IP 每台灣日 10 次，全站每日最多 50 次保留中的寄信額度，相同內容跨 IP 在 600 秒內不重寄。原按鈕 busy lock、Turnstile、isolate/IP 3/min 與主站 KV 限流保留。台灣午夜重置日額度；超限回 429 + Retry-After，UI 顯示 IP／全站／重複原因且保留輸入，資料庫失效回 503 停止寄信。公開影片 URL 仍選填，修正 URL 必填。
2. 七個含「03 / 一般人參考」的公開 /cases/ 頁加入主站 1–2 篇相關文章（共 5 個公開網址），位於該區塊下方。ACL 1 篇、踝扭傷 2 篇、阿基里斯斷裂 2 篇。其他 /videos/ 動作觀察頁沒有此 03 元件，本輪沒有新增該元件或改其醫療內容。來源映射獨立 src/data/patient-related-articles.v1.json，不改原 patient-guides 凍結內容／核准。

## 限流實作與必要部署資訊

src/lib/video/contribution-limits.ts：單一 SQL INSERT 檢查 IP/global/duplicate，D1 transaction batch 內原子保留額度並判斷原因，跨 Workers／分頁共享，不是記憶體額度。functions/api/contributions.ts 使用既有 PLAYBACK_DB binding。

migrations/0002_contribution_limits.sql 已各套用 atlas-playback-preview 與 atlas-playback-production，新增 contribution_guard_key、contribution_attempts 與索引；未改 play_events。不要重建 key 或清正式 quota，否則 IP／去重可能失效。key 由 SQL randomblob 初始產生，只在伺服器記憶體供 HMAC，不輸出。日變 IP HMAC、內容 HMAC、時間／日、狀態／隨機 ID 留在獨立表，不保存明碼 IP 或表單全文；超過 48h 的紀錄在下次 reserve 清除。隱私說明已更新。

reserve 在上游寄信前執行。上游確認 4xx（408 除外）在寄信前被拒，標記 rejected 釋放 global／duplicate 但仍占 IP 額度；其他錯誤、逾時、格式不明及中途停止保留 pending／uncertain，避免可能已寄出卻重寄。settle 寫入失敗保留 pending；確認上游成功仍可回成功。這是最多 50 個可能寄送的保守上限，服務異常時可寄的封數會更少；限制僅涵蓋本圖鑑 relay，不涵蓋主站其他聯絡表單或整個 Gmail。

## 驗證

- 86 檔 1,403 單元通過；Astro 0 errors／0 warnings，16 既有 hints；變更格式通過。
- 四瀏覽器 32 項表單驗證通過，含四種限額／服務錯誤文字、保留內容、不顯示成功。
- 獨立唯讀 reviewer 信心 0.94，無阻擋問題；自行重跑 54 項相關單元，指出 E2E 缺口已補、需先 migration 已完成。
- 真實預覽 D1：70 個不同 IP 併發恰 50 放行；同 IP 20 個恰 10；相同內容 20 個恰 1。finally 清除本次測試紀錄，零殘留。
- 真實預覽 Pages API：預填 50 個測試額度後，POST 回 429/site-daily，在寄信前拒絕，清除測試紀錄。第一次 Python HTTP 用戶端遇非 JSON 回應，改 Node fetch 後通過；不是改 API 邏輯。未寄信。
- 五篇主站文章 HTTP 200／H1 相符；首次 web fetch cache miss，Node 直接讀取成功。最終映射已逐一按傷害核對。
- release:public 145 HTML、2,322 內部連結、384 產物；root 與預覽逐檔相同。
- 正式 9 個修改頁面（7 case、contribute、privacy）hash 相符，兩尺寸共 18 組 Axe／無溢位／相關文章位置與數量通過。正式 schema 唯讀確認兩表與 1 key，attempts=0，沒有正式測試列或播放事件。

## 尚未完成的舊收信驗證

目前仍沿用 https://sportsmedicine.tw/api/contact 的既有 CONTACT_RECIPIENT_EMAIL／Turnstile／Resend，主站 repo／secret 未改。使用者先前詢問收件信箱，本機值已回覆；正式 secret 不能讀回，因此不能宣稱實際收件地址已確認。沒有發出測試信，也沒有收件匣證據。先前詢問允許一封測試信尚無直接答覆；本輪「可以」承接的是三項限流，非實際寄信授權。

若後續要驗證收件：由使用者同意並在真人瀏覽器完成 Turnstile，送一封明確標記測試的資料，確認頁面及 inbox。不要繞過安全驗證、換測試 key 或將正式 quota 填滿做壓力測試。

## 下一步與文件

已指定的本輪兩項功能沒有剩餘工作。後續可依使用者回覆完成一封實際收件驗證；無更多已指定任務。
報告 docs/reviews/2026-09-06-decision-36-contribution-limits-and-related-articles.md；證據 evidence/decision-36。上一份交接 docs/handoffs/2026-09-06-before-decision-36.md。/tmp/atlas36/ 有驗證工具；隔離 checkout /tmp/atlas35-checkout，E2E 14336；原 4321 未改。Node24.14.0／Wrangler4.129.0。
