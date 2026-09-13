# HANDOFF - 2026-09-13 10:29（台灣時間）

## 目前狀態

- 專案：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury`；`main`；私有遠端 `keanu77/professional-sports-injury-atlas`。
- 最新本機／遠端提交均為 `71c04dc98fd925d7a9cfb61e50c7afc23cdbb7da`（搜尋發布證據與交接文件）。交接開始時工作目錄乾淨。
- 正式站：`https://injury.sportsmedicine.tw/`；150 例（7 核心 +143 觀察頁）、精選 10 支、本站熱門前 10 名，首頁搜尋已上線。
- 實際網站來源：`3448c91b07d4767669615149c009088de99c98a8`；搜尋功能提交 `ebe6d11406ebafb48f95f1317fd19b3cd69c5339`。後續文件提交不改網站內容。
- Cloudflare Pages `sports-injury-atlas` production/main：`044c5edc-1255-4217-8b77-a53fff85da6e`，`https://044c5edc.sports-injury-atlas.pages.dev`。
- 2026-09-13 10:29 再次唯讀核對首頁：HTTP 200、搜尋標記存在，SHA-256 `40839c844f694e5212af6849778cbfcbfdba76e42c6a1bd522b46cb211db4248` 與既有正式發布證據一致。
- 本次 handoff 只更新本文件及封存前版，保持未提交；沒有再次推送或部署。沒有待完成的功能／發布工作。

## 9/12–9/13 已完成

- 個案由 101 → 120 → 150，共新增 49 例；補入受傷機轉摘要、三個動作／事件步驟、一般受力說明、證據限制、後續時間軸與對應來源。
- 改善回場里程碑的文字、來源查閱、手機閱讀順序與縮圖按鈕配置；首頁／分類／個案頁一致標示受傷動作、傷後處理及新聞／解說類型。
- 本站熱門依近 30 天實際播放次數，限定前 10 名。精選由 6 增至 10，新增 Kobe Bryant、Mohamed Salah、Dominic Thiem、Anthony Richardson。
- 搜尋姓名、傷勢、運動、賽事及已有日期；英文忽略大小寫、重音與全形差異，多個空格分隔條件皆須符合。
- 搜尋隨全部／精選／熱門範圍切換並保留查詢；提供結果數、零結果提示、清除／Escape、「改查全部影片」。熱門只查原前 10 名、保留原名次。
- 搜尋支援中文輸入法、延遲排行回應及 API 錯誤處理；關鍵字不送出或儲存。停用 JavaScript 仍可瀏覽全部影片。未提供中文譯名／暱稱詞典或拼字容錯。
- 使用者要求的兩天新增功能條列摘要已在對話交付。

## 已完成的驗證

- 搜尋發布時：Node 24.14.0；Astro 0 errors／0 warnings、1,493 單元測試、66 瀏覽器整合測試通過；3 項 review-only 測試依原設計跳過。
- 正式發布 gate 通過；195/195 HTML（含 150/150 個案頁）與建置相符；489 成品檔與測試副本一致。
- 正式站 Chrome 320px／150% 字級、390／768／1280px 深淺色、搜尋與精選／熱門操作、縮圖載入通過，無水平溢出或 Axe 違規。整合測試另涵蓋手機 Chrome 與 WebKit。
- 五支核心播放／字幕控制及七支 Decision 23 既有影片的播放證據已更新，新舊紀錄保留；沒有新增臨床、字幕品質或權利簽核。
- 上述完整測試是搜尋發布時的紀錄，本次 handoff 未重跑。此次新增驗證限遠端提交、正式首頁雜湊、文件格式與 Git 差異。

## 下一個 Session 的前 3 步

1. 執行 `git status --short --branch`、`git log -3 --oneline`，辨識本次未提交的交接文件；保留任何使用者後續變更。
2. 讀 `docs/reviews/2026-09-13-video-search/release.json:1`、`validation.json:1` 與本文件，確認已發布來源及測試範圍。
3. 先確認使用者的新需求再動工。目前無更多任務；若要發布新變更，依下列既有流程完成該次驗證，不因 `/resume` 自動重新部署。

## 下次發布注意事項

- 固定 Node 24.14.0：`mise exec node@24.14.0 -- npm run release:public`。發布 gate 要求乾淨已提交狀態與正確輸入摘要。
- 網站輸入摘要：`ae9090880d608a9ad8df89a4b6051d391bca510bbc50c5c44644b318d25bbe65`；不能用更新摘要代替核准或真實驗證。
- 所有批次播放證據都有七日效期。Decision 27、28、30、31、32、34 的首筆將分別於 9/13 台灣時間 11:46、15:21、16:57、17:39、18:19、19:34 到期；需依每筆 `checkedAt` 評估。這是下次發布的檢查條件，不是網站目前故障。
- 發布前必須依序確認：建置成功 → 成品與測試版本逐檔一致 → 搜尋標記存在 → 才執行部署。先前提早上傳舊成品的事件已處理完成，見 `docs/reviews/2026-09-13-video-search/release-retry.json:1`。
- 沿用既有私有儲存庫與正式站目的地的推送／更新授權；本次 handoff 不執行推送或部署。沒有新增環境變數、依賴或 migration，未送出表單或測試信。
- 隔離預覽先前為 `http://127.0.0.1:14337/`，來源 `/private/tmp/atlas-search-review-anfds_x2/dist`；本次未重查服務是否仍在執行。瀏覽器測試必須同步設定 baseURL 與 `ATLAS_E2E_PORT`，勿使用或停止不明的既有服務。
- 前一已驗證部署：`f0cd3f0d-691a-4c75-a2b7-d3c4ece93157`（精選 10 支、未有搜尋）。

## 關鍵檔案

- `src/pages/index.astro:139`：首頁搜尋表單與影片卡片索引。
- `src/scripts/video-discovery.ts:63`：搜尋、精選／熱門切換、結果狀態及延遲回應處理。
- `src/lib/videos/search.ts:2`、`src/lib/videos/search-index.ts:14`：比對規則與建置時的公開資料索引。
- `src/data/videos/discovery.v1.json:1`：精選順序；`scripts/public-launch/check-release.ts:114` 與 `:210`：播放證據效期檢查。
- `docs/reviews/2026-09-13-video-search/README.md:1`：搜尋驗證、實際發布與例外處理紀錄。
- `docs/reviews/2026-09-13-curated-10/README.md:1`、`docs/reviews/2026-09-13-recent-150/README.md:1`：精選與 150 例發布紀錄。
- 前版交接封存：`docs/handoffs/2026-09-13-before-session-handoff.md:1`。
