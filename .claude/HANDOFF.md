# HANDOFF — 2026-09-13：150 例已驗證，推送／上線已獲授權

## 目前狀態

- 正確專案：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury`，branch `main`。
- 網站來源提交：`4d7ec5972968f488532dbd291fde7d4fe348a535`。後續僅整理驗證／交接文件；網站輸入摘要為 `7b54f81e8836faf0e13300b7585eb2a4bf163451f6315984df99c9f690910a97`。
- 本機預覽：`http://127.0.0.1:14334/`，來源 `/private/tmp/atlas-150-review-a01ctdij/dist`。其 195 頁 HTML 與來源提交正式 build 完全一致。
- 尚未 push 或正式部署。最後已確認的正式部署是 120 例／熱門前 10 名，Pages `1cf3b175-a434-475e-8819-7fd7510fd70e`，網站來源 `3cbb26c`；正式域名 `https://injury.sportsmedicine.tw/`。

## 已完成

- 150 例（7 核心 +143 觀察頁）；新增 30 例、93 個時間軸節點及 111 筆來源引用，涵蓋 14 種運動。
- 兩支 Godwin／Tua 原候選影片禁止內嵌，已替換為同事件解說片，揭示第三方推測及混用過往事件畫面的限制。所有新影片 30/30 已有本站 HTTPS 預覽的原生播放成功證據。
- 修正 3 例新聞／照片影片的來源限制；卡片與分頁共用影片類型標籤。獨立唯讀複查無剩餘問題。
- 1,490 單元測試、36 瀏覽器整合測試、300 組手機／桌面版面檢查、Astro check、格式及 `release:public` 通過。3 個 review-only 測試依原設計跳過。
- 本機熱門前 10 名、切回全部 150 例，在 390px／1280px 通過。
- 發布包：195 頁、4,494 站內連結、489 個檔案。證據入口：`docs/reviews/2026-09-13-recent-150/README.md`、`validation.json`、`release-prepared.json`、`prepared-dist.json`。

## 發布授權

使用者已於本輪明確回覆「授權推送跟更新」，同意此 150 例版本（含驗證／交接文件）推送至 `keanu77/professional-sports-injury-atlas` 私有儲存庫，並部署到 Cloudflare Pages `sports-injury-atlas`／`https://injury.sportsmedicine.tw/`。先前自動審查因概括授權不足而拒絕推送的條件已由此明確授權解除；不必再次詢問。

## 下一步

1. 讀本文件與 `release-prepared.json`，執行 `git status --short --branch`、`git log -3 --oneline`；保留已完成驗證，不重做研究或付費多模型稽核。
2. 依已取得的具體授權，推送既有私有 `origin/main`，核對遠端 SHA；使用 `mise exec node@24.14.0 -- npm run release:public` 重新確認時效性後部署既有 `sports-injury-atlas` 正式 main。
3. 以 `/private/tmp/atlas150-verify-live.mjs` 比對全部 195 頁（參數 root、origin、deployment URL、source commit、output），抽驗兩替代影片及熱門 10／全部 150。更新 `release.json`、`live.json`、本文件並提交推送文件。

## 邊界與環境

- Node 精確使用 24.14.0；需本機 socket 的測試及 Chrome 在允許的執行環境執行。
- 既有核心個案核准、權利政策與未知回場日期保留。本批不是新的臨床或權利簽核。
- 無 migration、依賴或環境變數變更；未送出表單或測試信。
- 原交接存於 `docs/handoffs/2026-09-13-before-150.md`；200 例僅曾評估，沒有啟動下一批。
