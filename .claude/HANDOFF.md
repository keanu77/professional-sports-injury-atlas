# HANDOFF — 2026-09-08（台灣時間）

## 目前狀態

本階段已完成，使用者要求交接。沒有進行中的實作任務；不要自動擴充內容或重跑付費模型。

- 正確專案：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury`，不是 mini-backup。
- Branch：`main`。交接整理前工作目錄乾淨；最新已推送提交 `c67c9269af94242a8d0caaaf0426d2b0178401d8`。
- 功能來源：`32d74e0`；`c67c926` 為部署驗證與文件紀錄。本交接文件另作文件提交。
- 正式站：https://injury.sportsmedicine.tw/
- Cloudflare Pages：https://58aaa1d4.sports-injury-atlas.pages.dev/ ，project `sports-injury-atlas`。
- 本輪已驗證正式域名 101/101 影片分頁 HTTP 200，HTML SHA-256 與本次本機建置完全一致；不是只有部署成功訊息。

## 本次完成

- 依 multi-llm-audit 用 Grok／agy 分工稽核全部 101 頁；主 agent 重算數量、剔除錯誤推論，未追加重複模型呼叫。
- 補齊 94 個 videos 的資源區塊，加上 7 個 cases：73 頁有 1–3 篇主站文章、28 頁有主題總覽及缺少合適專文說明，無缺少資源區塊的頁面。
- 73 頁不等於 73 頁都有完整傷種專文：9 頁為恢復期營養背景、4 頁為自行車事故概覽；合併傷勢文章都有適用說明，王建民頁不將腓骨肌腱文當作 Lisfranc 專文。
- Kobe、Aaron Rodgers、Beth Mead 補手術／復健里程碑與來源。只更新這三筆 checkedAt（UTC 2026-09-07，本地 09-08）。首次回場日期、既有簽核內容、授權及來源政策不變。
- 前一階段寄信已確認實際收件成功（`78bd93a`），不要被歷史交接中的「待驗收」誤導。未授權新測試信，不要再提交表單或消耗投稿額度。
- 首頁分享預覽使用使用者指定截圖，資產 `public/social/injury-atlas-home-20260907.png`，提交 `5644d96`／`daaae0d`。

## 驗證

- `npm run check` 通過：0 errors、0 warnings、16 hints。
- 文章對應與事件資料 10 項單元測試通過。
- `npm run release:public` 通過：145 頁、7 cases、3,323 站內連結。
- 19 篇文章與 1 個總覽的網址實測全部 200。
- Chromium 390px／1280px 各檢查四個代表頁：8 情境皆無水平溢位、資源 1–3 項；未播放影片或送出表單。
- 全量正式站比對證據：`docs/reviews/2026-09-08-content-enrichment/live.json`。

## 下一個 Session 的前 3 步

1. **執行 `git status --short` 與 `git log -5 --oneline`** — 確認正確目錄及後續是否有人修改；不要重置使用者變更。
2. **讀取 `docs/reviews/2026-09-08-content-enrichment/README.md`** — 區分已發布内容與仍無專文的限制；必要時查看同目錄 `article-mapping.csv`。
3. **先依使用者的新任務決定是否處理剩餘資料** — 目前無更多已排定任務。若要補 28 頁專文，先比對主站現有文章全文；若要補首次回場，先找賽事原始證據，不以年份或已知某次出賽推算首次日期。

## 已知限制（非部署阻礙）

- 28 頁尚未找到合適主站專文，不能用相近傷名硬套；補寫新的醫療文章是另一項工作。
- 10 筆首次回場日期未知／不適用，保持原說明；Julie Foucher 的精確事件日期也未核清。
- 初次稽核 287 筆來源引用中 49 筆無刊登日期，包含資料庫型來源；本輪未全面補齊，也未重新逐一查核所有來源。
- 部分球隊網站直接抓取受限，新增來源的查證方式見補充報告；不得把 HTTP 200 當成全文驗證。

## 關鍵檔案

- `src/data/videos/observation-resources.v1.json:1` — 94 頁文章對應與範圍說明。
- `src/lib/videos/observation-guidance.ts:1` — 資源資料驗證與讀取。
- `src/pages/videos/[slug].astro:1` — 一般人參考區塊。
- `src/data/videos/event-batch-30.v1.json:1`、`event-batch-31.v1.json:1` — 本輪三位選手的後續資訊。
- `docs/reviews/2026-09-08-content-audit/README.md:1` — 修改前稽核，數量屬歷史基準。
- `docs/reviews/2026-09-08-content-enrichment/README.md:1` — 本輪已發布成果與驗證。
- `docs/handoffs/2026-09-08-pre-closeout.md:1` — 歷史交接歸檔，部分早期狀態已被後段更新取代。

## 發布注意事項

沒有待執行 migration、環境變數或部署步驟。本輪交接文件提交不需要重部署。

公開發布會要求乾淨且已提交的工作目錄，以及 `src/data/public-launch.v1.json` 的 inputTreeDigest 與當前輸入一致；使用 `scripts/public-launch/input-tree.ts` 計算，不能停用驗證。既有臨床簽核與來源紀錄必須保留，不得藉刷新輸入摘要偽造新醫療簽核。
