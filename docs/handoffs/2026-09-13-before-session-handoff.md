# HANDOFF — 2026-09-13：球員與關鍵字搜尋已上線

## 目前狀態

- 專案：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury`，`main`；私有遠端 `keanu77/professional-sports-injury-atlas`。
- 正式站：`https://injury.sportsmedicine.tw/`，150 例（7 核心 +143 觀察頁）；精選 10 支、本站熱門前 10 名。
- 搜尋功能提交：`ebe6d11406ebafb48f95f1317fd19b3cd69c5339`；補齊既有播放證據後，實際部署／已核對推送來源：`3448c91b07d4767669615149c009088de99c98a8`。
- Cloudflare Pages `sports-injury-atlas` production/main：`044c5edc-1255-4217-8b77-a53fff85da6e`，`https://044c5edc.sports-injury-atlas.pages.dev`。
- 網站輸入摘要：`ae9090880d608a9ad8df89a4b6051d391bca510bbc50c5c44644b318d25bbe65`。後續文件提交不改變網站成品，不需再次部署。

## 本輪完成

- 首頁即時搜尋姓名、傷勢、運動、賽事及已有日期；多個空格分隔條件皆須符合，英文忽略大小寫、重音與全形差異。
- 搜尋範圍隨全部／精選／熱門切換，保留查詢；顯示結果數、零結果提示、清除／Escape，以及「改查全部影片」。熱門保留原名次，只查前 10 名。
- 中文輸入法、過時排行回應、API 錯誤、無 JavaScript 備援皆有測試。搜尋字串不寫入 URL、儲存空間或 API；沒有新後端或依賴。
- 精選 10 支名單維持前次發布；150 例原有影片 URL、臨床／來源內容與起播秒數沒有修改。沒有新增中文譯名／暱稱詞典或模糊搜尋。
- Node 24.14.0；1,493 單元測試、66 瀏覽器整合測試、Astro check、變更檔格式、正式發布 gate 通過；3 項 review-only 測試依原設計跳過。
- 正式 195/195 HTML（含 150/150 個案頁）與建置相符；489 成品檔與測試副本一致。正式 320px／150% 字級、390／768／1280px 深淺色、搜尋與精選／熱門操作通過，無水平溢出或 Axe 違規。
- 五支核心播放／字幕控制與七支 Decision 23 既有影片的播放證據因七日效期而更新；新舊紀錄保留。這不是新的臨床、字幕品質或權利簽核。
- 發布時曾提早上傳與前版完全相同的舊成品（`613b5723`）；已以正確搜尋版取代並完整核對。原因及強制建置／成品比對條件記於 `release-retry.json`。
- 證據：`docs/reviews/2026-09-13-video-search/README.md`、`validation.json`、`release.json`、`live.json`、`ui.production.json`。

## 接續與邊界

- 本輪完成。下次先核對 Git 狀態、最近提交與正式部署。沿用已授權的推送／更新目的地；不公開儲存庫來源。
- 下次發布須重新評估所有影片證據的七日效期：Decision 27 等後續批次仍是 2026-09-06 的原證據，將於 09-13 各原驗證時段到期。勿只檢查五支核心影片。
- 隔離預覽 `http://127.0.0.1:14337/`，來源 `/private/tmp/atlas-search-review-anfds_x2/dist`；測試同步設定 baseURL 與 `ATLAS_E2E_PORT=14337`。其他原有服務未動。
- 前一已驗證部署：`f0cd3f0d-691a-4c75-a2b7-d3c4ece93157`（精選 10 支、未有搜尋）。前次交接存於 `docs/handoffs/2026-09-13-before-video-search.md`。
- 無依賴、環境變數、migration 變更；未送出表單或測試信。沒有啟動 200 例擴充。
