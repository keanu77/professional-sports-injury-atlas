# 2026-09-08 文章串聯與傷後經過補充

依使用者「請補吧」執行前一輪稽核中可查證的補充。

- 94 個動作觀察頁全部有明確資源對應：66 頁有 1–3 篇文章、28 頁尚無合適配對，顯示原因與主題總覽。加上原有 7 個 cases，合計 73 頁有文章（此前 11 頁），28 頁為總覽（此前 2 頁），無資源區塊 0 頁（此前 88 頁）。
- 「有文章」不等於有完整的傷種專文：9 頁提供肌腱韌帶恢復期營養背景、4 頁提供自行車事故概覽，均明示範圍；王建民頁的腓骨肌腱文只涵蓋合併傷，不替代 Lisfranc 專文。
- ACL 術後文、慢性踝不穩、肩脫位神經文章加上適用範圍，不暗示選手接受特定療程或有額外診斷。不用肌腱炎代替肌腱斷裂，不用 SLAP 代替未確認分型的肩盂唇傷。
- 19 篇文章與 1 個主題總覽，共 20 個網址已在本次 HTTP 實測全部回 200。原有 cases 文章不變。
- Kobe 增補 4 月修補手術及 11 月恢復籃球活動；Rodgers 增補手術及行走、傳球／力量進展；Mead 增補手術復健及 8 月團隊訓練。三筆更新各自 checkedAt=2026-09-07（UTC，本地為 09-08），其餘查核日不偽造更新。
- 事件及首次回場日期、原有醫療簽核內容、來源政策與照片授權均未變更。未把 10 個空白回場日期強填，也未把資料庫頁面缺少刊登日期視為可猜填。

## 新增來源

- Kobe：[CBS 術後報導](https://www.cbsnews.com/losangeles/news/bryant-recovering-after-successful-surgery-to-repair-torn-achilles-tendon/)；[湖人恢復活動許可](https://www.nba.com/lakers/news/131118_bryant)。公開索引內容確認手術與許可里程碑，非新增首次回場證明。
- Rodgers：[Jets 術後復健報導](https://www.newyorkjets.com/news/aaron-rodgers-achilles-injury-recovery)。已讀原文，保持行走／傳球、力量訓練與正式復賽之區別。
- Mead：[Arsenal Step by Step](https://www.arsenal.com/stepbystep)；原有 [8 月 29 日訓練紀錄](https://www.arsenal.com/news/gallery-mead-back-first-training-session)。官方搜尋索引提供手術前後、訓練紀錄；直接抓取正文受限，不推定手術日期或術式。

## 驗證

10 項資源／事件資料測試通過。Astro 檢查 0 errors、0 warnings、16 hints。發布檢查通過：145 頁、7 cases、3,323 站內連結。101 頁皆有資源與後續區塊；73 頁有文章、28 頁總覽。Chromium 390px／1280px 各抽查四頁，8 個場景皆無水平溢位且連結數符合 1–3 篇。

Cloudflare deployment：https://58aaa1d4.sports-injury-atlas.pages.dev ，來源提交 `32d74e0`。自訂網域 101/101 分頁均 HTTP 200，HTML SHA-256 與本機本次建置完全相符，結果見 live.json。

[逐頁對應](article-mapping.csv) · [文章網址檢查](article-link-check.json)
