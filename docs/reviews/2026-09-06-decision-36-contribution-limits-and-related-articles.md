# Decision 36 — 防灌信限制與個案延伸閱讀

使用者同意增加 IP 每日 10 次、相同內容 10 分鐘不重寄、全站每日 50 封上限；另要求各個案「03 / 一般人參考」加入主站 1–3 篇相關文章。兩項已部署 https://injury.sportsmedicine.tw/，來源 ee5683c6426c21401bfd44e957640649a75d1a3a，Production/main f4e330ba-e41f-4f84-8813-4ded4b197bf7。

## 行為

新增共享 D1 保留額度，單一 INSERT 原子檢查三項限制，D1 batch 交易內判斷原因；每日以台灣午夜為界。寄信之前預留，已成功／結果不明／程序中斷的請求持續占用上限，避免併發或網路重試多寄。確認上游寄信前 4xx 拒絕（408 除外）釋放 global／duplicate，但失敗驗證仍占 IP 次數。DB、key、IP 缺失或 DB 失效回 503，不放行寄信；quota 已滿回 429 與 Retry-After。此上限僅約束影片圖鑑寄信路徑，不是所有主站聯絡信或使用者整個信箱。

資料使用既有 preview／production 獨立 PLAYBACK_DB 內的 contribution_* 表，未改動 play_events。每日 IP HMAC 與內容 HMAC 防重複，表內不存明碼 IP 或表單全文；紀錄超過 48h 後於後續 reserve 清除。私有 key 僅供 HMAC，不輸出或存入版控；migration 初始 seed，重跑不重建。兩個遠端 DB 的 0002 migration 皆已套用。隱私頁與表單簡短限制說明同步更新。

判斷寄信結果不明時會保留額度，故實際可寄封數可能少於 50。沒有承諾 exactly-once delivery、沒有隊列；重複回報不假裝送達。UI 保留輸入並區分 IP／全站／重複／暫停送出，成功狀態仍要求上游 ok:true。公開影片 URL 繼續選填。

## 相關文章

PatientGuide.astro 的 03 區塊新增「延伸閱讀｜吳易澄醫師的相關文章」。獨立映射 patient-related-articles.v1.json：ACL 1 篇（術後復健評估），踝扭傷 2 篇（急性外側扭傷、慢性踝不穩），阿基里斯腱斷裂 2 篇（成因／術後訓練、手術／保守選擇）。五個原始主站網址皆 HTTP 200、H1 相符，draft:false；未修改主站文章。七個公開 /cases/ 皆有 1–2 篇，位於 03 內；其他 /videos/ 動作觀察頁原無此區塊，本輪不新增該醫療元件。保留原 patient guides 凍結 bytes 與簽核，僅更新 inputTreeDigest。

## 驗證

86 檔 1,403 單元、Astro 0 errors／0 warnings（16 hints）、格式、四瀏覽器 32 E2E 皆通過。獨立 reviewer 唯讀查核無阻擋缺陷（confidence 0.94），重跑 54 相關單元；其要求補齊的四種 UI 狀態測試已加入，migration 順序已遵循。

真實預覽 D1 併發：70 unique IP 入場 50、20 same IP 入場 10、20 duplicate 入場 1。全數使用 synthetic key／ID，finally 清除，零殘留。真實 preview Pages API 預填 50 額度後回 429/site-daily，證明部署 binding／key／HMAC／SQL／handler 接線有效且在寄信前拒絕。第一次 urllib 收到非 JSON 回應，Node fetch 重查通過，沒有修改限流邏輯。

發布檢查通過 145 HTML、2,322 內部連結、384 產物；root 和 preview files 一致。正式 7 個案＋表單＋隱私 9 頁 hash 相符，390/1440 共 18 組 Axe、無溢位、文章位置／內容／篇數通過，截圖人工檢視。正式 DB 僅唯讀查 schema／count，兩表與 1 key 存在、attempts=0；沒有灌正式資料或寫入播放紀錄。

## 保留限制

沒有實際寄信或收件匣確認；原先 Turnstile 人工驗證及收件 secret 無法讀回的限制仍在，不能把 mock 成功／quota 拒絕測試當成 end-to-end email delivery 通過。本輪 user approval 是限流功能，不是寄測試信。主站已綁 RATE_LIMIT_KV，但該上游 KV 配額與 relay 出口仍可能限制實際吞吐量。

主要依據：[Cloudflare D1 batch 交易語意](https://developers.cloudflare.com/d1/worker-api/d1-database/)。證據目錄 evidence/decision-36/：remote-caps、preview-api-cap、production、deployment、articles-verified 及 logs。
