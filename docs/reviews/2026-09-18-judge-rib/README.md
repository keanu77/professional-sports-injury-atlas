# Aaron Judge 肋骨傷勢案例

已新增 `/videos/aaron-judge-2026-rib/`，全站目錄為 151 支影片、144 個觀察頁。沿用既有案例版型，與 2023 年腳趾案例分開；收錄 CBS Sports 2026 年新聞解說、MLB 官方說明影片連結、第一肋骨研究、復原時間軸與胸部受傷警訊。

## 來源與編輯判斷

- 主影片：https://www.youtube.com/watch?v=-M5v2OSrnEY 。YouTube oEmbed 確認 CBS Sports 身分，瀏覽器確認長度 275.001 秒；縮圖為該片官方 `hqdefault.jpg`，SHA-256 收錄於縮圖來源清單。
- 傷勢與複查：https://www.mlb.com/press-release/update-on-of-aaron-judge 。4–6 週是重新影像評估時程，不是復賽承諾。
- 可能起點：https://www.mlb.com/news/aaron-judge-discusses-fractured-rib-move-to-injured-list 。4 月 26 日屬回溯描述，因此標記 `eventDateCertainty: reported`，不計算確定傷後天數。
- 實際回場：https://www-cdn.abcnews.com/Sports/wireStory/aaron-judge-returns-yankees-after-99-day-absence-136284464 。AP 2026-09-08 報導支持當日先發出賽。
- 機轉與研究限制：PubMed PMID 26657823（揮棒相關兩例）及 PMID 30015636（外傷性第一肋骨 14 例病例系列）。研究不是 Judge 病歷，不推定其個人治療或骨折型態。
- 一般處理：https://www.nhs.uk/conditions/broken-or-bruised-ribs/ 。保留胸痛加劇、呼吸困難與咳血的急診警訊。
- 2019 年 MLB 飛撲影片及 2020 年報導標為歷史背景，不當作 2026 年畫面。字幕品質未逐句查核，保留 `not-verified`。

## 驗證結果

- Node 24.14.0：使用官方 darwin-arm64 暫存版本，下載 SHA-256 與官方 SHASUMS 相符，未更換系統 Node。
- 97 個單元測試檔案、1,496 項測試全部通過。
- Astro check 成功；無 errors／warnings，保留既有 TypeScript hints。
- `content:check`、`brand:verify`、縮圖來源／位元組驗證通過。
- `plan:verify` 通過：36 份既有綁定規格。新增編輯設計及工作紀錄放在本資料夾，沒有更換受控平台規格。
- 啟用案例目錄的 review build 成功，共 223 頁；這是本機審查建置，包含既有 review routes，不是可直接上線的公開建置。
- Chrome 桌機與 Pixel 7 模擬共 26 項整合測試通過；2 項既有測試因 `ATLAS_PUBLIC_LAUNCH` 條件跳過。涵蓋所有 144 個觀察頁、分類路徑、Axe、新頁的日期限制、搜尋、精選與無 JavaScript 情境。
- 另以 Edge 實際開啟新頁：390px 與 1280px 無水平溢出；YouTube 點擊載入後能播放，媒體時間由 21.445271 秒進至 44.488634 秒，`paused=false`、`readyState=4`。
- 本次變更檔案通過 Prettier。全庫 `format:check` 另發現 169 個既有歷史檔案排版問題，未擴大改動歷史查核成品。

## 交付狀態

本機功能分支 `feat/aaron-judge-rib`。預覽：`http://127.0.0.1:14318/videos/aaron-judge-2026-rib/`。未推送 GitHub、未部署正式站；本機播放紀錄不充當既有發布流程要求的自有 HTTPS 網域播放證據。
