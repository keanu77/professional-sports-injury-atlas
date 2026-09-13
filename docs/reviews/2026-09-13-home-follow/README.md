# 首頁追蹤連結 — 2026-09-13

依使用者提供的六個圖示，在首頁標題區加入衛教部落格、Facebook、Instagram、GitHub、LINE 與個人網站。桌機靠右，手機位於標題上方。首頁與頁尾共用 `FollowLinks.astro`，每個點擊範圍至少 44 × 44px；保留原連結、新分頁與可及名稱。

## 驗證

- Node 24.14.0；型別檢查 0 errors／0 warnings；1,493 單元測試通過。
- Chrome、手機 Chrome、WebKit 共 75 項整合測試通過，涵蓋排版、無障礙、分類導覽與搜尋。
- 320px（150% 字級）、390、768、1280px 深淺色均無水平溢出或 Axe 違規；六個連結與頁尾相符、鍵盤順序正確；停用 JavaScript 仍可使用。
- 乾淨隔離副本完成正式發布 gate 與 195 頁建置；489 個測試成品雜湊見 `tested-artifact.json`。發布須再次通過建置並逐檔相符。
- 既有 Decision 27 五支播放證據已過期，使用既有正式 HTTPS 頁面重新驗證實際播放及時間進度；新舊紀錄均保留。沒有新增醫療或素材權利簽核。
- 既有測試曾錯誤期待 RSS 與未公開的 Edwards 2023 路徑；已同步為原有個人網站及可公開的 Durant 案例，並接受正常 200／304 回應。沒有移除幾何斷點檢查。

詳細紀錄：`validation.json`、`ui.local.json`；視覺檢視：`1280-dark.png`、`390-dark.png`、`320-light.png`。正式部署及線上核對結果於完成後記錄於 `release.json`。
