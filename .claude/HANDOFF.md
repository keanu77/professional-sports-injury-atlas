# HANDOFF — 2026-09-13：精選由 6 個增加至 10 個，已上線

## 目前狀態

- 專案：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury`，`main`；私有遠端 `keanu77/professional-sports-injury-atlas`。
- 正式站：`https://injury.sportsmedicine.tw/`，共 150 例（7 核心 +143 觀察頁）；精選 10 個，本站熱門前 10 名。
- 本次網站來源／已核對推送：`39db166a1bdf33d99ad1cd0dd0d3d851081d0594`。後續只有發布證據及交接文件，不需再次部署。
- Cloudflare Pages `sports-injury-atlas` production/main：`f0cd3f0d-691a-4c75-a2b7-d3c4ece93157`，`https://f0cd3f0d.sports-injury-atlas.pages.dev`。
- 網站輸入摘要：`da6d7f9123abb1cba2aa285535035cf8fc977635930f22356630aa0ffd05b68e`。

## 本輪完成

- 使用者最後指定精選總數 10 個，覆蓋先前 20 個提議。原有 Acuña、Zverev、Marín、Bassitt、Dupont、Vonn 六個保留。
- 新增順序 7–10：Kobe Bryant、Mohamed Salah、Dominic Thiem、Anthony Richardson；共 8 種運動、6 類身體部位。
- Tatum 先列候選，但抽看現有短片以傷後處理為主，因此選 Kobe 的切入／重播；Tatum 個案內容保留。
- 修改僅限精選排序資料、實際輸入摘要與相應測試；沒有改來源影片、傷勢、回場日期或既有情境分類。
- 10 支入選片重新通過正式域名原生播放；四個新增候選有指定秒數截圖檢視。並非全部影片重新逐格醫療審查。
- 1,490 單元測試、39 瀏覽器整合測試、Astro check、5 個變更檔格式與正式發布檢查通過；3 個 review-only 測試依原設計跳過。
- 正式 195/195 HTML 與建置相符，489 成品檔案與測試副本一致；390／768／1280px 的精選 10、熱門 10、全部 150 切換通過。
- 證據：`docs/reviews/2026-09-13-curated-10/README.md`、`selection.json`、`validation.json`、`release.json`、`live.json`、`ui.production.json`。

## 接續與邊界

- 本輪完成。下次先核對 `git status --short --branch`、`git log -3 --oneline` 與正式部署；不要把歷史測試中的 5 個當作當前精選數。
- 沿用使用者已授權的推送／更新，目的地仍為上述私人儲存庫與正式站；不公開儲存庫來源。
- 精選是編輯安排，不是新的臨床或權利簽核；原生播放證據具有時間與環境限制。
- Node 精確使用 24.14.0；下次發布仍須依 gate 檢查核心播放／字幕證據的 7 日有效期。
- 隔離預覽 `http://127.0.0.1:14336/`，來源 `/private/tmp/atlas-curated10-review-1ftufb24/dist`。14335 原有服務未動；瀏覽器測試需同步設定 baseURL 和 `ATLAS_E2E_PORT=14336`。
- 前一可回復部署：`463f01a7-0bec-4128-b12f-10ec8bcc7faf`（150 例／精選 6）；前次交接存於 `docs/handoffs/2026-09-13-before-curated-10.md`。
- 無依賴、環境變數或 migration 變更；未送出表單或測試信。沒有啟動 200 例擴充。
