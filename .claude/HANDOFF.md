# Current handoff — 2026-09-06 multi-llm-audit

使用者要求以multi-llm-audit重新檢視全網站。本輪稽核已完成：Codex8項、Grok13項、Antigravity公開內容7項，共28條原始論點，經獨立Pass 2與正式瀏覽器逐條採用／降級／排除。未修改網站程式、未重新部署。

報告：`docs/reviews/2026-09-06-multi-llm-audit.md`；證據與Pass2矩陣：`docs/reviews/evidence/multi-llm-audit-2026-09-06/`。3項P1：ready後播放器錯誤未備援、320px最大字級播放文字裁11.625px、案例播放焦點外框裁切。P2包括5個外部起點遺失、無JS／读屏狀態、既有general.whatIsVisible未顯示、4頁舊篩選、審查語氣、回場缺資料表述、主站返回、21照片歷史名錄語氣與LaMelo2023初報／後續診斷脈絡。

14支影片今日均實播；Kyrie字幕首測逾時、單支重試開啟成功。24頁320px深色字級1.5，加6個手機桌面關鍵頁組合，共30組Axe無錯誤及整頁無水平溢位；人工另找到元件裁字與焦點問題，不能把Axe當全面無障礙通過。

Antigravity私有code傳送被auto-review拒絕，改成公開HTML文字注入完成，未變更任何CLI權限。Qwen可用但因skill的白天GPU窗口未跑。模型「Tatum/Haliburton是假資料」「ACL頁全空」「把未知膝部觀察歸ACL」等已排除。

下一步僅為報告中的待確認實作建議；先做3項P1及播放相關P2。既有主站配色、YouTube預設封面、首頁無搜尋及頁內分類不變。本次audit報告與證據尚未commit/push，先前網站修改已在main與origin/main同步至3b97e16。正式部署仍是下方D25。

---

# Decision 25 — 現行正式部署

已完成並發布使用者要求：14支影片的卡片、主播放器、相關影片卡片改用各自YouTube預設封面；右上角傷害分類移除，首頁下方分類入口保留。人物照片與署名段落不再出現在公開影片卡片。搜尋移除與D24內容頁版型保留。

正式 https://sports-injury-atlas.pages.dev/；來源 `3e8cc75ed026d6a026ed2c07865adc3b0c4ac0be`；Production/main `07b8ac9a-0fd4-4fe7-aceb-f907b0cc635c`。2026-09-06T02:55:54.277Z正式驗證28回應hash、15頁手機/桌面Axe、縮圖解碼、導覽、無JS與零預先第三方請求通過。單元37項、相關四瀏覽器12項通過；Astro check無錯誤/警告。root dist為正式版本。

D25使用者明確指定YouTube圖片，取代先前不採縮圖的顯示限制。`src/assets/videos/provenance.json` 保存14個預設封面來源、ID與SHA256；`scripts/verify-video-thumbnails.ts` 檢查精確範圍。縮圖由本站提供；播放前仍無第三方請求。原病例、醫療核准、影片URL/時間碼及歷史審查照片不變。歷史review模式保留照片，公開模式才用D25封面。

詳見 `docs/reviews/2026-09-06-decision-25-video-covers.md`。無待辦，未修改主站專案。交接文件commit不需另行部署。發布協定仍見下方D23；公開瀏覽驗證涵蓋縮圖與分類。Node網路首次連線若逾時，可用 `node --network-family-autoselection-attempt-timeout=2000 scripts/public-launch/verify-browser.mjs https://sports-injury-atlas.pages.dev` 重試。

---

# Decision 24 — 內容頁設計

已完成使用者要求：依主站 /content/ 的淡藍標題區、麵包屑與卡片列表調整首頁；移除搜尋、傷害/運動篩選、先看影片標題說明及對應JS/CSS。14支影片直接顯示，影片/醫療/核准/播放器未改。主站內容頁未修改，使用者自行安排入口。

正式 https://sports-injury-atlas.pages.dev/；來源 `33cd45934b989eca7cf6f95ebfd72c6de039d8f0`；Production/main `30504fef-e3c2-4c79-bebf-8e49a9be21f8`。2026-09-06T02:45:43.594Z驗證28回應hash、15頁手機桌面Axe、無JS與零預先第三方請求通過。相關四瀏覽器12項通過；type check無錯誤/警告。root dist是正式版本。

首頁已沒有搜尋，後續驗證不要再執行D23的臨時搜尋腳本；現有 `scripts/public-launch/verify-browser.mjs` 已改檢查14卡片直接顯示、無searchbox/combobox、無先看影片h2。發布協定與影片實播工具仍見下方D23。無更多已授權待辦。

詳見 `docs/reviews/2026-09-06-decision-24-content-layout.md`。交接文件commit不需另行部署。

---

# Decision 23 — 既有影片與發布協定參考

使用者確認九支候選、字幕非必要及事件核對後加入，回覆「可以」。本次已完成並發布，沒有待確認項目。

## 正式狀態

- https://sports-injury-atlas.pages.dev/
- 公開影片由5增至14：7既有核准案例（新增Tatum、Haliburton）＋7動作觀察影片，涵蓋籃球、網球、田徑、體操、羽球、CrossFit、排球。
- 來源commit `9fa63393469ec67db9fbccdb772da0a3574e10ce`；Pages Production/main `7c0c00fc-32bb-4483-b25f-919027742b2a`。
- 正式驗證2026-09-06T02:12:15.884Z：28個HTML/JSON/robots回應雜湊匹配；15個首頁/案例/觀察頁手機桌面Axe與播放前零第三方請求通過；新增9支全部實播通過，包含時間碼。
- 單元1305、四瀏覽器256通過；Astro check 0 errors/0 warnings、16既有hints。320/390/1440篩選、搜尋、無JS內容驗證通過。無新依賴、無新環境變數。

## 實作與核准邊界

- `src/data/videos/expansion.v1.json` 與 `src/lib/videos/expansion.ts`：獨立D23授權，兩個原病例canonical digest＋七個observation clips。沒有新醫療簽核，不改原始26病例、D18/D20追蹤或既有三份衛教核准。
- 字幕例外只適用此次核准URL與 `ATLAS_PUBLIC_LAUNCH=decision-21` 公開協定；未解除provider/embed/region/clinical驗證。
- 新頁 `/videos/[slug]/` 明示動作觀察，不根據標題判定骨折/韌帶/分級。Zverev/Marín有來源支持個人正式復賽日期，其餘不虛構回場天數。
- 影片起点：Zverev1340、Redmond15、Strug0、Marín35、Foucher35、POV215、腳踝片0秒。無影片截圖或遠端縮圖進公開網站。

## 發布與重驗

- Node `/Users/ethanstudio/.local/share/mise/installs/node/24.14.0/bin`。
- `npm run release:public` 必須clean Git、inputTreeDigest、原病例/醫療/provenance/D20與D23證據通過，才建24頁/7案例/7觀察。
- `npm run deploy:public` 重跑release後更新既有Pages專案。未建立Git remote或push。
- D23證據為 `docs/reviews/evidence/decision-23/playback.preview.v1.json`，須7天內在本專案HTTPS網域實播。兩支Olympics在localhost不能播、HTTPS能播，不能以本機失敗推斷正式失效。
- `node scripts/public-launch/verify-expansion-playback.mjs <origin> <output> [slug]` 可驗9支或單支；正式版9支全部通過。POV預覽首輪緩衝逾時，獨立重測通過，保留first-attempt紀錄。
- `node scripts/public-launch/verify-browser.mjs <origin>` 比對root receipt與正式bytes/無障礙。root dist為正式產物。
- 完整說明 `docs/reviews/2026-09-06-decision-23-video-expansion.md`。

## 下一步

無更多已授權待辦。若使用者再要求擴充，沿用實播、事件核對、診斷與回場來源分明的標準；需要新增醫療主張時另外核對，不能借用D21衛教簽核。

Docs-only後續commit不改網站輸入，不需只為commit ID而重新發布。舊D21/D22交接保留於Git歷史e4d145d。暫存隔離副本 `/tmp/atlas23-checkout`，14324為本機預覽；舊4321參考未更動。
