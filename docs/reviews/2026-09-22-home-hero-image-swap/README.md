# 首頁圖片替換與圖說移除

已依使用者後續指定，將 A2 改成附圖 `a-all-sport-burst.png`，移除「AI 合成情境圖 · 非實際賽事畫面」及其樣式。桌機／手機配置、社群入口與搜尋行為保留。原始圖片提示與檔案校驗值保存在內部 provenance，先前 A2 選定與圖說需求由本次直接指示取代，詳 authorization.md。

來源提交 `ac38ad98a60279f9bc9598c789cd9b0c9d1aa895`；正式站 https://injury.sportsmedicine.tw/ ，部署 https://af901f14.sports-injury-atlas.pages.dev 。

驗證：Astro 0 errors／0 warnings、16 既有 hints；29 項圖片資產單元測試、16 項桌機 Chrome／Pixel 7 相關 E2E 通過，含 320px／150% 字級、深淺色、搜尋與分享還原。45 文件綁定及原有發布／成品門檻通過。

正式站 273 HTML 與相較上一版新增的 10 個圖片衍生資源，共 283／283 SHA-256 一致。390px 實際載入指定圖片、原圖說不存在、無橫向溢出、搜尋 y≈641。這輪沒有重跑無關的完整 200 影片測試，舊完整回歸紀錄仍在上一版審查目錄。

證據：release.json、live.json、browser-live.json、desktop.png、mobile.png。只涉及首頁主視覺，不修改影片分類或醫療內容。已停止本次預覽伺服器並恢復瀏覽器尺寸。
