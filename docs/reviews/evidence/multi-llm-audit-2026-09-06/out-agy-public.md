### AGY-1 [P0] 殘留篩選與搜尋表單（違背固定決策）
- **HTML路徑**：`/injuries/achilles-rupture/index.html`、`/injuries/acl/index.html`、`/injuries/ankle-sprain/index.html`、`/leagues/nba/index.html`
- **定位原文**：`<section>` 內「篩選案例 進階複合篩選需要 JavaScript；... 球員或球隊關鍵字 ... 重設全部篩選」
- **實算數量**：共 4 個頁面存在該表單；各頁對應案例實際僅 0 至 7 筆。
- **問題及影響**：違反「不要搜尋/篩選表單」決策。少量案例卻呈現大量下拉與輸入框，大幅推擠行動端版面，干擾民眾快速閱讀受傷與回場重點。
- **最小改善方案**：移除上述 4 頁的篩選表單區塊，保留靜態案例列表與下方衛教段落。
- **Confidence**：1.0

---

### AGY-2 [P0] 內部工程代碼與審查術語外洩至公開介面
- **HTML路徑**：7 筆 `/cases/*/index.html`、`/index.html`、`/leagues/nba/index.html`、3 筆 `/injuries/*/index.html`
- **定位原文**：
  1. 案例頁：「可見機轉標籤（觀察分類，非診斷）：unclear」
  2. 案例頁來源欄：「（video-original）」、「（diagnosis-first-party）」、「（event-context）」、「（teaching-evidence）」
  3. 列表頁：「已審查案例： 4 筆 （4 reviewed cases）」、「（0 reviewed cases）」、「（7 reviewed cases）」
- **實算數量**：全部 7 筆案例頁均外洩英文代碼 `unclear` 與 4 種後台來源 enum 標籤；共 5 頁混入英文括號審查計數。
- **問題及影響**：民眾無法理解資料庫代碼含意，降低衛教專業信任度。
- **最小改善方案**：將 `unclear` 顯示為「機轉不明」；移除或轉譯來源標籤為「原始影片」、「官方發布」等普羅用語；刪除列表頁的英文審查計數。
- **Confidence**：1.0

---

### AGY-3 [P1] 假性或未驗證傷情紀錄混入正式案例
- **HTML路徑**：`/cases/jayson-tatum-achilles-rupture-2025/index.html`、`/cases/tyrese-haliburton-achilles-rupture-2025/index.html`
- **定位原文**：
  1. Tatum：「Jayson Tatum｜阿基里斯腱斷裂 2025-05-12... 距受傷 298 天 ... 2026-03-06 有出賽紀錄」
  2. Haliburton：「Tyrese Haliburton｜阿基里斯腱斷裂 2025-06-22...」
- **實算數量**：2 筆案例。
- **問題及影響**：【待查】此兩筆傷情與復出賽程疑似測試模擬資料。一般民眾若信以為真，會對阿基里斯腱斷裂的發生情境與回場時間產生錯誤認知。
- **最小改善方案**：標註【待查】；未完成歷史事實確認前，抽換為真實公開案例，或於頁面顯著加註「測試範例資料，非真實醫療紀錄」。
- **Confidence**：0.95

---

### AGY-4 [P1] 傷種導覽與收錄影片數量矛盾（ACL 空置、觀察影片未入目錄）
- **HTML路徑**：`/index.html`、`/injuries/acl/index.html`、`/videos/carolina-marin-indonesia-2019/index.html`
- **定位原文**：
  1. `/index.html`：「14 支影片 · 點選後播放」但下方又寫「更多傷害與案例 目前共 7 筆」
  2. `/injuries/acl/index.html`：「已審查 0 筆案例... 目前沒有已審查的案例」
  3. Carolina Marín 頁：「膝部 · 受傷動作觀察」
- **實算數量**：全站實有 14 支影片（7 筆案例頁 + 7 筆觀察影片）；傷種專頁僅涵蓋 7 筆 NBA 案例；前十字韌帶專頁為 0 筆。
- **問題及影響**：首頁「14 支影片」與「目前共 7 筆」數字衝突；民眾進入 ACL 傷種頁面卻找不到任何內容，而站內既有的 Marín 膝部影片未建立連結。
- **最小改善方案**：首頁文案澄清為「NBA 案例 7 筆、受傷動作觀察 7 筆」；將 Marín 影片引導至 ACL 專頁作為參考觀察，避免出現空白無內容頁。
- **Confidence**：0.95

---

### AGY-5 [P1] 醫學名詞與出賽文字易生誤解
- **HTML路徑**：`/cases/lamelo-ball-ankle-sprain-2023/index.html`、`/cases/kyrie-irving-ankle-sprain-2021/index.html`
- **定位原文**：
  1. Ball 2023：分類為「踝關節扭傷」，但外部確認診斷記載「Right ankle strain.」
  2. Irving 2021：回場紀錄記載「目前沒有可確認日期的傷後出賽紀錄，不推估回場日。」；影片來源標題載為「Game 3」，下方診斷載為「Game 4」。
- **實算數量**：2 筆案例。
- **問題及影響**：醫學上 Strain（肌肉/肌腱拉傷）與 Sprain（韌帶扭傷）不同，混用未說明易混淆民眾；Irving 宣稱無回場紀錄，易使民眾誤判該傷勢導致選手無法重返賽場。
- **最小改善方案**：Ball 頁面補充肌腱拉傷與韌帶扭傷之分類差異說明；Irving 頁面更正為「未收錄出賽紀錄」並修正影片標題 Game 3 媒體誤植註記。
- **Confidence**：0.90

---

### AGY-6 [P2] 照片授權名錄與站內實際案例嚴重脫鉤
- **HTML路徑**：`/credits-notices/index.html`
- **定位原文**：「目前使用的照片授權 共 21 筆；案例封面旁的連結會直接指向對應項目。」
- **實算數量**：列表宣稱 21 筆，列出 Anthony Edwards、Brandon Clarke、CJ McCollum 等至少 9 位站內無對應案例之球員。
- **問題及影響**：民眾查閱授權清單時發現大量站內未收錄球員，點擊「案例封面旁連結」無法對應，造成資訊混亂。
- **最小改善方案**：過濾授權清單，僅保留站內已發布之 7 位 NBA 球員照片紀錄，其餘移至內部預備清單。
- **Confidence**：0.95

---

### AGY-7 [P2] 素人動作觀察影片之背景來源缺乏標記
- **HTML路徑**：`/videos/ankle-inversion-observation/index.html`、`/videos/volleyball-pov-135/index.html`
- **定位原文**：「Siwon Kim · 觀看原始影片 ↗」「事件來源 Siwon Kim：Inversion Ankle Sprain」「選手身分、賽事與回場紀錄未確認；僅供動作觀察。」
- **實算數量**：2 支影片。
- **問題及影響**：未標明上傳年份與運動屬性，回場說明僅標註未確認，對一般想了解日常運動防護的民眾缺少具體衛教連結。
- **最小改善方案**：補註影片公開年份與情境標籤（如：球友休閒運動），並於回場段落補充「一般球友無防護員時的漸進回場評估原則」。
- **Confidence**：0.85
