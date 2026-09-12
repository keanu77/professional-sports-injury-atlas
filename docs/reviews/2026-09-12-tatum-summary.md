# Tatum 個案重點摘要

依使用者提供的 ChatGPT 回覆，重新開啟 NBA、BU 與 PubMed 來源查核後，補入受傷機轉與後續時間軸。內容位於 `src/data/videos/event-updates.v1.json` 的 Tatum entry；沒有修改既有 case、follow-up sidecar、臨床簽核或發布核准資料。

- 機轉：以 BU 受訪治療師的影片分析為出處，說明後踏步、踝背屈與推蹬張力；註明非當事人醫療團隊，不能據此認定疲勞或既存肌腱病變。
- 研究：2026 年研究共 27 例，其中 17 例可逐格分析；不將群體角度數字套用在 Tatum。2026 年卷期文章於 2025-12-26 先行上線，兩個年份分開標示。
- 後續：7 個時間點，包含受傷、手術、場上訓練、一小時訓練、五對五訓練、2026-03-06 正式復出、2026-05-02 左膝僵硬缺陣。訓練報導日期已在標題註明，避免誤作首次完成該訓練的日期。
- 聚焦復出過程，省略原稿的完整賽事流水帳、未重查的整季平均數據、疲勞致傷與手術技術推測。
- 保留首次回場日期及傷後 298 天的計算；說明參賽與恢復原有表現不同。

驗證：

- 正式站 sitemap 實測：7 個 `/cases/`、94 個 `/videos/`，共 101 個案例頁，與本機公開選擇器一致。
- `npm run check`：0 errors、0 warnings、16 個既有 hints。
- 相關 3 個測試檔：57 項通過；新增來源索引與時間軸日期的反例檢查。
- 修改檔 Prettier 與 `git diff --check` 通過。
- 原工作目錄的內容檢查／review build 被 D18 的未提交檔案 allowlist 擋下，並非內容驗證通過。以 `/private/tmp/atlas-tatum-review-4cuvu_bd` 的已提交隔離快照執行 `node --import tsx scripts/check-content.ts` 與 `npm run build:review`，兩者通過，產生 45 個 review 頁面。原工作目錄的修改保留未提交。
- 本機 Chrome 1280px／390px：無水平溢位、無頁面錯誤、無重複 ID；3 個機轉步驟、7 個里程碑、10 筆來源；全部引用目標存在。沿用 NBA 純文字來源政策，沒有新增 NBA 可點擊外連。
- 人工檢視桌面／手機機轉區與手機時間軸截圖；瀏覽器驗證只載入本機資源，未測試影片播放。

本機預覽：`http://127.0.0.1:14325/cases/jayson-tatum-achilles-rupture-2025/`。本次沒有執行 production release 或部署，公開站尚未套用這份摘要。
