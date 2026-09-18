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

使用者新增目標「完成這個影片跟介紹上線」後，已推送 GitHub main 並完成正式部署。正式案例：https://injury.sportsmedicine.tw/videos/aaron-judge-2026-rib/ 。

HTTPS 測試頁：https://895a4d88.sports-injury-atlas.pages.dev/videos/aaron-judge-2026-rib/ 。Cloudflare Pages 預覽分支 `judge-rib-preview`，來源提交 `caf556723f6b4d7f4434465f97a8f5fcf2d399f8`。正式部署為 `4b8d4357-dd07-4de3-bca2-49a328af7a91`，來源提交 `1bea30a48237eb43cd5717f39d091d1914eece0a`。前一正式部署 `601eab27-5b43-46af-878c-d2ed7b9fdcfb` 保留作為回復基準。

## 本輪發布準備（2026-09-18）

- GitHub、Cloudflare 登入有效；遠端 main 為 `f28bac88b435de34052aa30eacd7647b88654515`，沒有其他新提交。
- Node 24.14.0 再次執行 Astro check：0 errors、0 warnings、16 個既有 hints。97 個單元測試檔案、1,496 項測試通過。
- `content:check`、`brand:verify`、`plan:verify` 通過。無依賴版本、環境變數、資料庫 migration 變更。
- 公開模式建置成功，`check-artifact.ts` 驗證 196 頁、7 個核心個案、144 個觀察頁及 4,517 個站內連結，不含內部 review routes、noindex 或預載第三方 iframe。
- 公開建置再次通過桌機／手機 26 項整合測試；2 項 review-only 測試按原條件略過。
- 新影片在上述 HTTPS 測試頁成功播放；`playback.preview.json` 記錄媒體時間由 0 進至 1.016583 秒、paused=false、readyState=4。這不是本機證據替代物。
- 更新 83 支既有影片的真實播放證據。原紀錄保存為 `playback.previous-*.json`，本輪結果為 `playback.refresh-*.json`；未修改歷史 checkedAt 偽裝新驗證。
- 初始重驗工具另選中兩個早已撤下的 observation slug，回報 Unknown video slug；它們不在目前公開片單，沒有重新發布，也沒有變更撤片政策。

## 已解除的發布阻擋

既有 Samir Aït Saïd 案例 `/videos/samir-ait-said-2016-leg/` 的 Olympic Games 影片 `Bt7EHTIivuA` 在兩次自動測試皆因播放器失敗而銷毀 iframe（保留初次與 `playback.samir-retry.json`）。人工瀏覽器亦確認本站顯示播放失敗；原 YouTube 頁明確顯示「使用 VPN 或 Proxy 時無法播放」，並說明該頻道的區域限制。

使用者回覆「我會關閉 VPN／Proxy，請再驗證」後，於 2026-09-18T14:47:31.510Z 重驗成功。`playback.samir-after-vpn.json` 記錄從 58 秒指定片段正常播放至 59.012551 秒，paused=false、readyState=4；Decision 34 對應證據已更新。未由代理更動系統網路設定、未繞過 YouTube 限制、未放寬七日播放證據發布閘門、未撤下或更換舊影片。

## 正式發布驗證

- `npm run release:public` 完整通過：151 個事件綁定、全部公開影片七日播放證據、原有臨床與患者說明核准、輸入摘要和公開成品檢查均保留。
- 491 個發布檔案的有序路徑／SHA-256 清單與已測試成品完全一致，清單摘要為 `d72261010bf5c22a0ad123595973f2296e24fc0b6bef5d43f80b59ca2e6fb412`。
- GitHub main 推送後以 `ls-remote` 確認 `1bea30a48237eb43cd5717f39d091d1914eece0a`；Cloudflare production/main 顯示相同來源提交。
- 正式域名 196/196 HTML 的 SHA-256 與建置一致，包含首頁、新案例與所有既有案例；摘要與關鍵頁證據見 `live.json`。
- 正式網域新影片成功播放，見 `playback.production.json`；另以 Edge 人工操作確認 275.001 秒影片正常播放至 16.559213 秒、paused=false、readyState=4。
- 正式首頁顯示 151 支；搜尋「Judge 肋骨」只找到新案例，且連結可開啟。醫學說明、來源、歷史年份區分與時間軸均已隨相同成品上線。
- 依 deploy／verify-deploy 流程以唯讀方式交叉檢查既有 API 與環境。`/api/popular` 回傳 200 與有效統計，並非缺 D1 的 503 降級；播放及貢獻 API 的 GET／OPTIONS 405 符合原有同源 POST-only 設計，無新增 OAuth、env 或 migration。
- D1 production 的遠端 migration 清單回報 `No migrations to apply`。額外 `sqlite_master` schema/index 逐項查詢遭 Cloudflare API 7403 拒絕，因此未宣稱完成直接結構稽核；本次無資料庫程式或 migration 變更，runtime 查詢已正常通過。
- 沒有送出貢獻表單或測試郵件，沒有調整平台環境變數、資料庫 schema、VPN 或權限。後續文件提交不改網站輸入，無須再次部署。
