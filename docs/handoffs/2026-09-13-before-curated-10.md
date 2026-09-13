# HANDOFF — 2026-09-13：150 例已推送並正式上線

## 目前狀態

- 專案：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury`，branch `main`；私有遠端 `keanu77/professional-sports-injury-atlas`。
- 正式站：`https://injury.sportsmedicine.tw/`，150 例（7 核心 +143 觀察頁），本站熱門只顯示前 10 名。
- 功能來源提交：`4d7ec5972968f488532dbd291fde7d4fe348a535`；實際部署提交：`75f2d005d64f484fbcb15d466164be3d5a793213`，已推送並核對遠端 SHA。後續僅提交發布證據／本交接文件，不需再次部署。
- Cloudflare Pages：`sports-injury-atlas`，production/main；部署 `463f01a7-0bec-4128-b12f-10ec8bcc7faf`，`https://463f01a7.sports-injury-atlas.pages.dev`。
- 網站輸入摘要：`7b54f81e8836faf0e13300b7585eb2a4bf163451f6315984df99c9f690910a97`。

## 本輪完成與驗證

- 新增 30 例、93 個時間軸節點與 111 筆來源引用，涵蓋 14 種運動。
- Godwin／Tua 原影片禁止內嵌，換為同事件解說影片，標明第三方推測及過往畫面限制；新增影片 30/30 在本站 HTTPS 預覽原生播放成功，兩支替代影片在正式站再次通過。
- 修正 3 例新聞／照片影片的來源限制；卡片與分頁共用影片類型標籤。獨立唯讀複查無剩餘問題。
- 1,490 單元測試、36 瀏覽器整合測試、300 組手機／桌面版面檢查、Astro check、變更檔案格式及正式發布檢查通過。3 個 review-only 測試依原設計跳過。
- 正式站 195/195 頁 HTML 與本次建置 SHA-256 相同，含全部 150 例；489 個成品檔案與已驗證發布包相同，建置核對 4,494 個站內連結。
- 正式首頁在 390px／1280px 顯示熱門 10 名、切回全部 150 例，無溢出；撤片頁／舊資產轉址及唯讀 API 正常。
- 證據入口：`docs/reviews/2026-09-13-recent-150/README.md`；發布與線上證據：`release.json`、`live.json`、`production-artifact.json`。

## 授權與邊界

- 使用者已明確回覆「授權推送跟更新」，本次私有儲存庫推送與正式發布已依授權完成。先前概括授權不足的推送審查拒絕已解決，不需再詢問。
- 既有核心個案核准、權利政策與未知回場日期保留；本批不是新的臨床或權利簽核。影片來源日後仍可能改變內嵌限制。
- 無 migration、依賴或環境變數變更；未送出投稿表單或測試信。
- 前一個可回復正式版本：`1cf3b175-a434-475e-8819-7fd7510fd70e`，網站來源 `3cbb26cf61268ffd60064f886c0868c54c24bba2`（120 例／熱門前 10）。

## 下次接續

- 本輪已完成，沒有待執行的發布工作。開始新任務時先核對 `git status --short --branch`、`git log -3 --oneline` 與線上部署，文件不能取代即時 Git 狀態。
- Node 精確使用 24.14.0；需本機 socket 的測試及 Chrome 在允許的執行環境執行。原生播放證據具有時效性，下次發布依既有 gate 判定是否需重驗。
- 本機預覽 `http://127.0.0.1:14334/` 來自 `/private/tmp/atlas-150-review-a01ctdij/dist`，屬暫存環境，不作為長期部署來源。
- 原交接存於 `docs/handoffs/2026-09-13-before-150.md`；200 例僅曾評估，沒有啟動下一批。
