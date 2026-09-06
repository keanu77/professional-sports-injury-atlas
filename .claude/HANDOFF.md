# 最新交接 — Decision 38（2026-09-06）

## 正式狀態

https://injury.sportsmedicine.tw/ 已更新。功能來源 a8fbc50ee9332d192c4dda204710383d933c0443 已 commit/push；正式部署 https://4151f2a7.sports-injury-atlas.pages.dev，root dist 為這次正式產物。仍為 101 影片、11 部位、15 種運動、棒球 30。

## 最新要求已完成

使用者指定「『熱門』次數1小時統計一次」。播放開始仍即時記錄，熱門以整點之前的 30 天資料排名，當小時新播放下整點納入。SQL 區間 `[hourStart - 30 days, hourStart)`，所有訪客相同截止；HTTP max-age 至下一個整點。GET 按固定区間計算，沒有新增排程或聲稱每小時僅一個 SQL。持續停留不自動刷新；重新點「本站熱門」讀更新。

清理舊播放紀錄也以相同區間為準，避免新寫入把當小時榜單所需紀錄刪除。首頁熱門提示與隱私說明已同步。未更動投稿、醫療內容或 D37 其他改善建議；public-launch rendering input digest 依此次功能指示刷新，原醫療核准不變。

## 驗證

- 2 檔 28 相關單元通過，使用實際 SQLite，含整點、跨台灣午夜、新播放延至下一小時、30 天窗及清理不改當小時排行。
- Astro 0 errors／0 warnings、16 既有 hints；格式與 release:public 通過（145 HTML、2,322 內部連結）。
- 預覽和正式各驗證 API generatedAt 整點、max-age 至下整點，首頁／privacy 共 2 HTML hash 相符，390／1440px 熱門提示與僅名次顯示正確。
- 正式驗證 generatedAt=2026-09-06T14:00:00.000Z（台灣22:00）。沒有正式測試播放、寄信或資料庫結構變更。

## D37 稽核

多模型稽核已交付，commit 36814f1。報告 docs/reviews/2026-09-06-decision-37-full-site-audit.md 與 evidence/decision-37。只提出建議，不代表全部獲准實作；D38 僅變更每小時熱門。P1 包括手機選片、卡片欄位、民眾導讀、里程碑標籤、小觸控連結、空投稿、防造播放及 dev/build 依賴修補。沒有已證 P0。其餘待使用者選擇。

## 保留的營運限制

D36 投稿每日10/IP、全站50、600秒去重與Turnstile依舊。真人驗證後一封測試信的實際收件驗收尚未獲明確指示，沒有寄信；不可把先前 mock 成功當信箱實收。詳見 docs/handoffs/2026-09-06-before-decision-38.md。

## 文件

本輪報告 docs/reviews/2026-09-06-decision-38-hourly-popularity.md；證據 docs/reviews/evidence/decision-38。/tmp/atlas38/ 保存測試／建置／部署工具紀錄。原4321預覽未動；node_modules與機密設定未改。
