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

本機功能分支 `feat/aaron-judge-rib`。使用者新增目標「完成這個影片跟介紹上線」後，已準備公開成品並部署至 HTTPS 測試分支；尚未推送 GitHub 主分支、尚未切換正式站。

HTTPS 測試頁：https://895a4d88.sports-injury-atlas.pages.dev/videos/aaron-judge-2026-rib/ 。Cloudflare Pages 預覽分支 `judge-rib-preview`，來源提交 `caf556723f6b4d7f4434465f97a8f5fcf2d399f8`。正式站仍為部署 `601eab27-5b43-46af-878c-d2ed7b9fdcfb`。

## 本輪發布準備（2026-09-18）

- GitHub、Cloudflare 登入有效；遠端 main 為 `f28bac88b435de34052aa30eacd7647b88654515`，沒有其他新提交。
- Node 24.14.0 再次執行 Astro check：0 errors、0 warnings、16 個既有 hints。97 個單元測試檔案、1,496 項測試通過。
- `content:check`、`brand:verify`、`plan:verify` 通過。無依賴版本、環境變數、資料庫 migration 變更。
- 公開模式建置成功，`check-artifact.ts` 驗證 196 頁、7 個核心個案、144 個觀察頁及 4,517 個站內連結，不含內部 review routes、noindex 或預載第三方 iframe。
- 公開建置再次通過桌機／手機 26 項整合測試；2 項 review-only 測試按原條件略過。
- 新影片在上述 HTTPS 測試頁成功播放；`playback.preview.json` 記錄媒體時間由 0 進至 1.016583 秒、paused=false、readyState=4。這不是本機證據替代物。
- 更新 83 支既有影片的真實播放證據。原紀錄保存為 `playback.previous-*.json`，本輪結果為 `playback.refresh-*.json`；未修改歷史 checkedAt 偽裝新驗證。
- 初始重驗工具另選中兩個早已撤下的 observation slug，回報 Unknown video slug；它們不在目前公開片單，沒有重新發布，也沒有變更撤片政策。

## 尚待解除的發布阻擋

既有 Samir Aït Saïd 案例 `/videos/samir-ait-said-2016-leg/` 的 Olympic Games 影片 `Bt7EHTIivuA` 在兩次自動測試皆因播放器失敗而銷毀 iframe（保留初次與 `playback.samir-retry.json`）。人工瀏覽器亦確認本站顯示播放失敗；原 YouTube 頁明確顯示「使用 VPN 或 Proxy 時無法播放」，並說明該頻道的區域限制。

未更動 VPN／Proxy 系統設定、未繞過 YouTube 地區限制、未放寬七日播放證據發布閘門、未擅自撤下或更換這支舊影片。已請使用者暫停 VPN／Proxy 後告知，以便重新實測。Decision 34 中該片仍保留原過期紀錄，不能宣告正式發布完成。

恢復後：只需重驗 Samir 並保存成功證據 → 乾淨提交 → `npm run release:public` → 核對成品與測試版內容 → 推送核對 → 部署 main → 正式域名內容、搜尋及新片播放驗證。不要直接把目前測試版當作已通過完整 release gate 的正式版。
