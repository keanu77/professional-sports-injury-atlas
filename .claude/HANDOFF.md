# HANDOFF — 2026-09-13（150 例發布收尾）

- 專案：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury`，branch `main`，既有遠端為私有專案。
- 使用者已要求擴充到 150 例，並在本輪確認繼續完成播放驗證、測試、提交、推送及正式發布；不要重問同一授權。
- 150 例（7 核心 +143 觀察頁）、新增 30 例與 93 時間軸節點已整合。首頁熱門維持前 10 名；切回全部為 150。
- 原 Godwin／Tua 影片禁止內嵌，已替換同事件解說片並通過原生播放；30/30 新影片的成功證據見 `docs/reviews/2026-09-13-recent-150/playback.preview.json`。
- 已修正新聞／照片影片的來源限制，以及首頁／分類／相關影片卡片的影片類型標籤。獨立唯讀複查無剩餘問題；不是新臨床認證。
- 最終 1,490 單元測試、36 瀏覽器整合測試、Astro check 及 public release gate 通過；公開建置 195 頁。完整細節見同目錄 `validation.json`。
- 本交接段落寫入時正在完成正式發布收尾；完成後必須以 `release.json`、`live.json` 與本文件更新確認，不能把預覽當正式上線。

## 下一步

1. 確認 150 頁 × 2 尺寸的 300 組最終版面檢查通過，記錄 `validation.json`。
2. 提交並推送本次具名變更，從乾淨主工作目錄跑 `mise exec node@24.14.0 -- npm run release:public`，部署既有 `sports-injury-atlas` 正式 main。
3. 比對正式站所有 195 頁的 HTML SHA-256，抽驗替代影片及熱門 10／全部 150；更新發布紀錄並提交文件。

## 限制與環境

- Node 使用 `mise exec node@24.14.0 -- …`；全庫部分測試有精確版本要求。需本機 socket 的測試及 Chrome 在允許的執行環境跑。
- 保留既有臨床核准、來源、權利與未知回場日期；本批沒有新的臨床或權利簽核。
- 無 migration、依賴或環境變數變更。不要再寄測試信或提交投稿。
- 歷史交接存於 `docs/handoffs/2026-09-13-before-150.md`。200 例只曾作維護規模評估，尚未啟動下一批。
