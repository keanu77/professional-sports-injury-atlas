# 首頁球員與關鍵字搜尋

首頁的 150 支影片新增即時搜尋，可查姓名、傷勢、運動、賽事與資料中已有的日期。空格分開的條件必須全部符合；英文不分大小寫，忽略重音與全形差異。例：`大谷 棒球`、`Kobe achilles`、`前十字韌帶`。

搜尋沿用「全部影片／精選影片／本站熱門」範圍。切換選單保留關鍵字；提供結果數、清除搜尋、Escape 清除及「改查全部影片」。熱門搜尋只篩選既有前 10 名並保留原名次，不把第 11 名遞補進來。API 錯誤與沒有符合結果分開呈現；延遲回應不能覆寫較新的選單狀態。

索引由首頁已准入的公開資料建立。關鍵字只用於瀏覽器內篩選，不寫入 URL、儲存空間或 API；沒有新依賴。搜尋框有可存取標籤與即時結果通知，支援中文輸入法；停用 JavaScript 時隱藏搜尋操作並保留全部影片連結。姓名只查資料已有名稱，未新增中文譯名／暱稱詞典，也不提供拼字容錯。

## 驗證紀錄

- 固定使用 Node 24.14.0；於乾淨隔離副本執行既有正式發布 gate。
- `validation.json`：型別、格式、完整單元測試、Chrome／手機 Chrome／WebKit 整合測試與正式成品檢查結果。
- `ui.local.json` 與對應圖片：320px／150% 字級，以及 390／768／1280px；深淺色、中文／英文／傷勢搜尋、範圍切換、清除、隱私與無障礙檢查。
- 既有 patient-experience 測試仍使用舊版 24 天與舊展開標題，已依目前正式頁的 15 天首次出賽、3 月 10 日再次復出及現有標題修正；沒有變更個案醫療內容。
- 精選的手機 Axe 檢查會將影片區捲至既有錨點，避免自動捲動後鄰近分類連結只露出一部分、被固定頁首遮到。沒有停用 Axe 規則。獨立畫面檢查最初未使用 Axe 要求的 browser context，修正測試程式後完成。

## 核心播放證據更新

發布 gate 的五個核心影片證據滿七天，因此在搜尋功能發布前，以正式域名 `https://injury.sportsmedicine.tw` 的原生播放器重新檢查相同影片，全部成功播放、時間前進、readyState 4，字幕按鈕可切至開啟。原始與新證據分別保留於 `core-playback.previous.json`、`core-playback.refresh.json`，並更新 gate 使用的 `docs/reviews/evidence/decision-21/playback.chrome.v1.json`。

隔離建置完成後，Decision 23 的七支仍在站上影片也跨過七日期限；已以先前正式部署 `https://f0cd3f0d.sports-injury-atlas.pages.dev` 重新通過原生播放。新舊證據為 `expansion-playback.refresh.json` 與 `expansion-playback.previous.json`；兩筆已撤片歷史證據維持不變。

這只是既有影片當時的播放／字幕控制可用性檢查，不是新增醫療、字幕翻譯品質或權利簽核。本次沒有修改影片 URL、起播時間、精選名單或臨床資料。

## 發布

沿用使用者本對話「授權推送跟更新」，目的地仍是既有私有儲存庫 `keanu77/professional-sports-injury-atlas` 與 Cloudflare Pages `sports-injury-atlas` 的正式站。已部署並核對 `3448c91b07d4767669615149c009088de99c98a8`，正式部署 ID `044c5edc-1255-4217-8b77-a53fff85da6e`。`release.json`、`live.json`、`ui.production.json` 及 `production-artifact.json` 記錄版本與線上核對：195/195 HTML、150/150 個案頁與本次建置一致；489 成品檔案與測試副本一致。1,493 單元測試與 66 瀏覽器整合測試通過，3 項 review-only 檢查依原設計跳過。

發布期間一次程序提早上傳舊成品，線上首頁仍與前版 SHA-256 一致；已完成後續正確部署與全站核對，經過與防止再次發生的檢查條件保留於 `release-retry.json`。
