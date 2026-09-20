# 200 例擴充進度

使用者已核准設計：「核准，照此實作（建議）」。編輯基線與配額見 README.md；本記錄不代表 200 例已完成。

## 已實作

- 未填 footageKind 的觀察頁／卡片改顯示「傷害相關影片（片型待核）」。
- 對應 HTML 資料屬性使用 unknown，不再暗示 injury-motion。
- 明確的 injury-motion、aftermath、news-analysis、athlete-interview 四類文案保留。
- 沒有把 113 個缺值記錄批次改成任何已查核片型，沒有移除王建民或修改既有病例。
- 新增 6 項標籤／renderer contract 回歸測試，並在既有 E2E 加入缺值的 Shohei 2024 例。
- 完成首批 14 候選研究 packet；8 個 YouTube metadata 查核為 7 個 200、1 個 401。均沒有本站實播證據，留在 docs/reviews，不匯入首頁、搜尋或影片數量。

## 驗證紀錄

- 原始可見標籤測試 RED：1/5 失敗；修正後 5/5 通過。
- machine-readable fallback 回歸 RED：1/6 失敗；修正後 6/6 通過。
- 獨立規格審查及程式品質審查通過，含 card/detail machine-readable scope extension。審查只涵蓋標籤修正，不是整個 200 例核准。
- Node 24.14.0 `npm run check`：0 errors、0 warnings、16 個既有 hints。先前誤用不存在的 @astrojs/check bin 路徑失敗，已改用專案 npm script，未安裝或改動依賴。
- 實作者嘗試 E2E 時，review build 在測試開始前被 dirty-worktree 門檻擋住；E2E 沒有通過紀錄。source-string assertions 不等於瀏覽器 DOM 驗證。
- 後續完整檢查結果在執行後補列；目前沒有公開發布。

## 外部阻擋與完成界線

瀏覽器原有 binding 回報 unavailable，官方故障排除列出可用瀏覽器為空。只讀檢查確認 Edge 正在執行、擴充功能已安裝啟用、native-host manifest 正確。已詢問是否允許開啟 Edge 空白視窗重試；未擅自修改設定、重裝、替換瀏覽器或透過其他工具繞過連線。

正式站仍以先前實查的 154 例為基線，本機既有 158 例。本次新事件加入數為 0；距 200 尚需通過 42 個新事件及既有 4 例的发布驗證。沒有建立假的播放證據、放寬七日門檻、改写核准雜湊、推送或部署。
