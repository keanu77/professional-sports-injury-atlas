ATLAS37_START
ATLAS37_END

### 檢查報告

**1. 缺陷 P1-01：來源文件標題拼寫錯誤（ACL 衛教指南）**
*   **File/Slug**: `src/data/patient-guides/acl.json`
*   **原文證據**: 第 33 行 `"title": "Anterior Crutiate Ligament (ACL) Reconstruction or Repair"`
*   **缺陷說明**: 英文單字 "Crutiate" 拼寫錯誤，正確應為 "Cruciate" (Anterior Cruciate Ligament)。雖然這是引用外部來源標題，但作為衛教內容展示，拼寫錯誤會降低專業信賴度，且可能導致搜尋引擎無法正確索引該關鍵詞。
*   **具體文案修法**: 將標題改為 `"Anterior Cruciate Ligament (ACL) Reconstruction or Repair"`。若必須保留原始來源錯誤，建議在 UI 層級做註記或修正，但首選修正拼寫。

**2. 缺陷 P2-02：首頁標題與描述用詞一致性建議（回場 vs 恢復）**
*   **File/Slug**: `src/pages/index.astro`
*   **原文證據**: 
    *   第 31 行 `title="運動傷害影片圖鑑｜看懂受傷，了解回場"`
    *   第 32 行 `description="從運動受傷影片，了解當下怎麼做、何時就醫與回場時間。"`
    *   第 45 行 `...了解受傷當下的處理重點與選手實際回場紀錄。`
*   **缺陷說明**: 標題使用「回場」，這通常隱含「返回比賽/運動」之意。然而，數據中大量區分「復健賽」、「季前賽」與「例行賽/正式比賽」。雖然底部 `home-note` (第 160 行) 有Disclaimer，但首頁主標容易讓一般大眾誤以為所有「回場紀錄」都代表完全恢復至受傷前表現或可立即進行高強度比賽。建議用詞更精確，或強化「參考」屬性。
*   **具體文案修法**: 
    *   標題可改為 `運動傷害影片圖鑑｜看懂受傷，參考復健與回場` 或 `...了解受傷與恢復歷程`。
    *   描述可改為 `...了解當下處理、就醫時機與實際回場/復健紀錄。`
    *   第 45 行 可明確化：`...了解受傷當下處理重點與選手實際「回場/復健」紀錄（不等於個人恢復時間）。`

**3. 缺陷 P2-03：特定事件日期敘事與「首次回場」定義的潛在混淆（John Tavares 腦震盪）**
*   **File/Slug**: `src/data/videos/event-batch-30.v1.json` (slug: `john-tavares-2021-concussion`)
*   **原文證據**:
    *   `returnDate`: "2021-09-25"
    *   `returnSummary`: "2021-09-25 先於季前賽對加拿大人出賽；10 月 13 日回到 NHL 例行賽。"
    *   `context`: "回場日期採最早實際季前賽，不等同例行賽復出或建議休息天數。"
*   **缺陷說明**: 該筆資料明確區分了「季前賽回場」與「例行賽復出」。然而，若前端顯示邏輯僅顯示 `returnDate` 和 `returnSummary` 的第一部分，使用者可能僅看到 9 月 25 日。對於一般大眾，「季前賽」的強度與風險遠低於「例行賽」。需確認前端組件（如 `CaseCard` 或 `EventFollowUp`）是否會完整渲染 `context` 或 `returnSummary` 的全貌，避免資訊被截斷導致誤解為「腦震盪 4 個月即可回場（例行賽）」。
*   **具體文案修法**: 確保前端 UI 在顯示 Tavares 案例時，必須同時呈現「季前賽」與「例行賽」兩個日期，或在 `returnSummary` 中更強調「例行賽復出」的重要性。目前文案本身邏輯正確，但需警惕顯示層級的截斷。若無法確保 UI 完整顯示，建議將 `returnSummary` 調整為：`"2021-09-25 於季前賽出賽（非例行賽）；2021-10-13 正式回到 NHL 例行賽。"` 以減少誤讀風險。

**4. 缺陷 P2-04：腦震盪案例的「回場」定義風險（Sidney Crosby）**
*   **File/Slug**: `src/data/videos/event-batch-30.v1.json` (slug: `sidney-crosby-concussion-2017`)
*   **原文證據**:
    *   `eventDate`: "2017-05-01"
    *   `returnDate`: "2017-05-06"
    *   `context`: "這是 2017 年的個人出賽紀錄，不是腦震盪休息五天就能回場的規則；須由醫療人員評估。"
*   **缺陷說明**: 5 天的間隔極短，極易引發大眾誤解「腦震盪只需休息 5 天」。雖然 `context` 有警告，但若 UI 僅展示 `returnDate` 與簡短 `returnSummary`，此風險極高。腦震盪的恢復標準已隨醫學進步（如 CDC HEADS UP 協議）大幅更新，2017 年的快速回場不代表現行醫囑。
*   **具體文案修法**: 在 `context` 中增加對照現行標準的提示，例如：`"注意：此為 2017 年舊例，現今腦震盪回場標準更為嚴格，須依最新醫療協議（如 CDC HEADS UP）由醫師逐項評估，絕不可僅憑天數決定。"`

**5. 缺陷 P2-05：復健賽與歸隊/正式賽的區分標示不足（Klay Thompson / Devin Booker 等）**
*   **File/Slug**: `src/data/videos/event-batch-30.v1.json` (slug: `klay-thompson-2019-acl`)
*   **原文證據**:
    *   `returnDate`: "2022-01-09"
    *   `returnSummary`: "2022-01-09 對騎士重返 NBA 比賽。"
    *   `context`: "期間另於 2020-11-18 右側阿基里斯腱斷裂，缺賽跨越兩次不同傷害。"
*   **缺陷說明**: Thompson 案例複雜，涉及 ACL 和 Achilles 兩次傷勢。`returnDate` 指的是 ACL 後的回場，但 `context` 提到中間還有 Achilles 傷。使用者若只看 `returnDate` 和 `returnSummary`，可能忽略中間的二次傷害，導致對「ACL 恢復時間」的計算錯誤（因為 2019-06 到 2022-01 是跨兩次傷的）。
*   **具體文案修法**: 在 `returnSummary` 中明確註記「此為右膝 ACL 恢復後的回場，但中間曾發生左阿基里斯腱斷裂，故總缺賽時間包含兩次傷勢」。或在前端 UI 中增加「複合傷勢」標籤。

**6. 缺陷 P3-06：一般性動作觀察影片的誤讀風險（Volleyball POV / Ankle Inversion）**
*   **File/Slug**: `src/data/videos/event-updates.v1.json` (slugs: `volleyball-pov-135`, `ankle-inversion-observation`)
*   **原文證據**:
    *   `injury`: "未找到可核對的選手身分與醫療公告，不能從標題或畫面確認診斷。"
    *   `context`: "保留為動作觀察影片；不推估傷勢等級、受傷日期或恢復天數。"
*   **缺陷說明**: 這些影片被標記為無診斷依據，但前端 `ObservationCard` 或 `CaseCard` 若統一套用相同的視覺樣式，使用者可能誤以為這些也包含具體的醫療建議或回場時間。
*   **具體文案修法**: 在前端 UI 上，針對 `returnDate: null` 且 `injury` 包含 "未找到可核對..." 的項目，顯示顯著的「僅為動作觀察，無醫療診斷」標籤，並隱藏或置灰所有關於「回場時間」的 UI 元素，避免與具名選手案例混淆。

**7. 待核項目：外部連結有效性與內容一致性**
*   **File/Slug**: 所有 `event-*.json` 與 `patient-guides/*.json` 中的 `sources.url`
*   **說明**: 資料中包含大量外部連結（NBA.com, NHL.com, NHS, BBC 等）。部分連結可能為動態頁面或已過期（如 2012-2015 年的舊新聞）。雖然無法在此環境測試連結有效性，但建議建立定期連結檢查機制。特別是 `event-batch-34.v1.json` 中的 `chien-ming-wang-2008-foot` 引用的 `lonestarball.com` 部落格，其穩定性低於官方來源。
*   **建議**: 對於非官方或可能過期的連結，確保 `sources` 中至少有至少一個官方或權威媒體（如 MLB.com, World Athletics）作為備援。目前 `chien-ming-wang` 同時有 MLB 官方連結，風險較低。

**8. 用詞檢查：「復健賽」vs「歸隊」vs「正式比賽」**
*   **發現**: 資料中對「復健賽」（Rehab Assignment / Spring Training Game）、「季前賽」（Preseason）、「正式比賽/例行賽」（Regular Season / Official Match）的區分非常清晰，且多在 `context` 欄位中說明。
*   **風險點**: `PatientGuide.astro` 中的 `returnRanges` 提供的是「參考範圍」（如 ACL 9-12 個月），而 `event-*.json` 提供的是「個別選手紀錄」。前端需確保使用者能理解「一般參考範圍」與「特定球星紀錄」的差異，避免以球星紀錄為標準。
*   **建議文案修法**: 在 `PatientGuide.astro` 的 `readiness` 或 `guide-note` 中，增加一句：`"以下時間範圍為一般醫學參考，實際回場時間因個人體質、傷勢嚴重度與復健進度而異，不可直接套用名將紀錄。"`

**9. 日期敘述一致性**
*   **發現**: 所有 JSON 檔案的 `checkedAt` 均為 "2026-09-06"。
*   **確認**: 日期格式一致，無矛盾。`event-batch-30.v1.json` 中的 `cristiano-ronaldo-2016` 事件日期 2016-07-10 與回場 2016-09-10，時間軸合理。`liu-xiang-2012-achilles` 正確標記 `returnDate: null` 並說明退役。

**10. 一般人誤解風險：「帶傷回場」vs「完全康復」**
*   **File/Slug**: `src/data/videos/event-batch-34.v1.json` (slug: `shohei-ohtani-world-series-2024`)
*   **原文證據**: `context`: "這是打者出賽，不是投手復出；之後仍接受肩部手術，兩天後出賽不代表肩傷已痊癒。"
*   **評估**: 文案已明確警示。但需確認前端 UI 是否會將 `returnDate` (2024-10-28) 標示為「康復」。建議 UI 標示為「帶傷出賽」或「臨時回場」，而非單純的「回場」。

**總結**
主要缺陷集中在：
1.  **P1**: ACL 指南來源標題拼寫錯誤。
2.  **P2**: 首頁標題/描述需更精確區分「回場/復健」，避免誤導為完全恢復。
3.  **P2**: 腦震盪短時間回場案例（Crosby, Tavares）需強化「舊例」與「現行標準」的對比警示，防止大眾誤以為腦震盪可快速回場。
4.  **P2**: 複合傷勢（Thompson）或帶傷回場（Ohtani）案例，需在 UI 層面更強調「非完全康復」或「中間另有傷勢」。

所有發現均基於提供之材料，無捏造規範。