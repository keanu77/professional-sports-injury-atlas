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
- 完整單元測試：101 files / 1,517 tests 通過（Node 24.14.0）。執行中有 Node SQLite experimental warning，不是測試失敗。
- content:check 通過；plan:verify 通過（36 bound documents）；本次全部變更檔案 Prettier 通過。未重新執行全庫 format:check，也沒有重排既有歷史證據。
- `ATLAS_PUBLIC_LAUNCH=decision-21 npm run build:review` 通過，產生 234 頁。**此為 review-mode 成品，含未核准核心審查路由；禁止上傳為公開 preview 或 production。** 沒有將它稱為 234 個合格案例。
- 產出 HTML 解析查核：5 種片型範例的首頁卡片與案例頁標籤／資料屬性一致；113 個缺值卡片標為 unknown；14 個研究候選沒有進入首頁或案例路由；抽查頁沒有預載 iframe。這是靜態 DOM 查核，不是瀏覽器互動或影片播放。
- 第一個本機 checkpoint：`bed228b`；當次提交後工作樹乾淨。沒有推送。

## 外部阻擋與完成界線

### 後續追加：合併神經導覽

使用者指定將「周邊神經損傷」「神經叢損傷」合併為「神經損傷」，放在「依受傷部位看影片」。已在本機完成：移除首頁獨立專題、新增 `/nerve-injuries/` 四例合併頁，保留原始診斷資料、解剖部位與舊 subtype 網址。沒有新增病例或重複計數。

本機提交 `6ce0c2b`：完整單元測試 102 files / 1,523 tests 通過；Astro check、內容檢查、計畫綁定與本次程式格式檢查通過；review build 235 頁。靜態 DOM 確認單一入口、4 個不同案例、12 個部位頁導覽一致，首頁仍為 12 個解剖部位／158 支影片／17 種運動。獨立規格與品質審查通過。細節見 nerve-navigation-plan.md。尚未推送、部署或完成瀏覽器實播；不將靜態檢查視為 E2E。

### 既有瀏覽器阻擋紀錄（本次未重試）

瀏覽器原有 binding 回報 unavailable，官方故障排除列出可用瀏覽器為空。只讀檢查確認 Edge 正在執行、擴充功能已安裝啟用、native-host manifest 正確。使用者核准「可以，開啟並重試（建議）」後，官方 `open-chrome-window.js --browser edge` 成功開啟 Default profile 的 about:blank 新視窗。等待後以同一 runtime 選取 Edge 仍回報 `Browser is not available: edge`。

未擅自修改設定、重裝、替換瀏覽器或透過其他工具繞過連線。官方故障排除下一步是由使用者在 ChatGPT 外掛介面重新安裝 Browser 外掛，不是再重裝 Edge；真正的工具連線恢復前不能完成實播及發布。

2026-09-20T23:54:34Z 重查正式首頁 HTTP 200，仍為 154 個不同 cases/videos 路由，未出現本次中性片型文案。本機既有公開候選 catalog 為 158 例。本次新事件加入數為 0；距 200 尚需通過 42 個新事件及既有 4 例的發布驗證。沒有建立假的播放證據、放寬七日門檻、改寫核准雜湊、推送或部署。

後續必須在合適的 public-mode 自有 HTTPS 候選成品上完成實播、正常核准／輸入雜湊與成品發布檢查，再執行正式部署。当前標籤修正改變渲染輸入，舊公開核准綁定不能視作已涵蓋本次成品。
