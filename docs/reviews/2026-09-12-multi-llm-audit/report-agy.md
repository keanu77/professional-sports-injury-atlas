作為運動傷害衛教網站的唯讀稽核者，本次審查嚴格基於注入之程式碼與 4 筆代表性資料進行分析（涵蓋 120 頁架構：7 個臨床個案頁 + 113 個觀察頁，含本輪 19 例新增）。

本次稽核不觸碰環境設定、不變更任何檔案、不建議繞過既有「NBA 引用不可點擊純文字」政策，亦明確將「系統/程式檢查通過」與「臨床醫學認證」嚴格切分，僅聚焦於**資訊架構（IA）、可讀性（Readability）、鍵盤與無障礙可及性（Keyboard/Accessibility）、手機版閱讀（Mobile UX）**四個維度。

以下將問題嚴格區分為**「本輪新增問題」**與**「已存在問題」**逐項列出。

---

## 一、本輪新增問題（New Issues）

### `NEW-A11Y-01` [P1] 行內引用觸控熱區嚴重不足且錨點目標缺乏鍵盤焦點管理
- **檔案與行號**：
  - `src/components/cases/ReportSourceRefs.astro`: 第 9–30 行
  - `src/components/cases/EventFollowUp.astro`: 第 92–108 行
- **涉及代表 Slug**：`gavi-acl-2023`、`carolina-marin-acl-2024`、`kristaps-porzingis-retinaculum-2024`
- **重現依據**：
  1. 在 `ReportSourceRefs.astro` 中，樣式定義 `a { display: inline-block; padding: 0.15rem 0.25rem; font-size: 0.85rem; }`。以代表資料 `gavi-acl-2023` 的 `sourceIndexes: [4, 1]` 為例，渲染出緊鄰的 `[4]` 與 `[1]` 兩個連結。計算實際外觀寬高僅約 18px–20px × 18px。
  2. 在 `EventFollowUp.astro` 第 93 行，目標元素為 `<li id={`event-source-${update.slug}-${index + 1}`}>`，未設定 `tabindex="-1"`。
  3. 依據 NBA 引用政策（如 Porziņģis 案例），來源項為純文字 `<span>` 而非 `<a>`。
- **使用者影響**：
  - **手機版觸控障礙**：觸控面積遠低於 WCAG 2.5.8 規範的最低 24×24 CSS px（及 2.5.5 建議的 44×44 px）。手指點擊 `[4]` 時極易誤觸相鄰的 `[1]` 或點擊落空。
  - **鍵盤與螢幕閱讀器障礙**：鍵盤使用者在內文按下 Enter 觸發跳轉後，瀏覽器僅捲動畫面，但目標 `<li>` 本身不可聚焦；對於純文字來源項目（無內部 `<a>`），按 Tab 鍵焦點會殘留在原段落或直接跳至下一可聚焦元素，無法依序朗讀或瀏覽該條來源；且缺乏「返回內文引用處」機制。
- **建議修法**：
  1. 在 `ReportSourceRefs.astro` 中擴大點擊區域：利用虛擬偽元素擴展觸控邊界（如 `a::after { content: ""; position: absolute; inset: -8px -4px; }` 並設置相對定位）或加大 `padding` 與間距（`gap`）。
  2. 在 `EventFollowUp.astro` 的 `<li id="...">` 補上 `tabindex="-1"`，使錨點跳轉時可直接透過腳本或原生行為獲取程式焦點；並確保目標獲得焦點時有清楚但不突兀的視覺輪廓（`:focus:not(:focus-visible)`）。
- **待核實處**：
  - 需確認各主流行動瀏覽器（iOS Safari / Chrome Android）在連續兩個緊鄰擴展偽元素時的點擊命中判定優先級。

---

### `NEW-IA-01` [P1] 觀察頁全面套用單欄展開樣式，導致影片核心文字重點遭深度臨床時間軸嚴重下壓
- **檔案與行號**：
  - `src/pages/videos/[slug].astro`: 第 53–58 行、第 114–143 行、第 336–344 行
- **涉及代表 Slug**：全部 120 頁（包含本輪 19 例與既有 101 例公開頁）
- **重現依據**：
  1. `videos/[slug].astro` 第 56 行設置 `class:list={["clip-layout", { "clip-layout-expanded": eventUpdate?.mechanism }]}`。
  2. 本輪為全部 120 例補充了機轉與時間軸，因此所有觀察頁的 `eventUpdate?.mechanism` 均為真，全面觸發 `.clip-layout-expanded`。
  3. 第 336–341 行樣式將原本桌面版雙欄布局（`grid-template-columns: 1.2fr 1fr; gap: 2rem;`）強制改寫為單欄（`grid-template-columns: minmax(0, 1fr); gap: 0;`）。
  4. 觀察 DOM 順序：`.clip-player` 播放器下方緊接著插入 `<EventMechanism>`（含重點、步驟列表、原理、限制）與 `<EventFollowUp>`（含傷勢、出賽天數、里程碑、受傷後發展時間軸、來源列表），最後才是 `data-video-text-highlights`（「影片文字重點」）。
- **使用者影響**：
  - **資訊層級倒置（IA Inversion）**：觀察頁的初衷是「影片圖鑑：看懂受傷動作與片段重點」。使用者在看完或點擊上方影片後，最直接需要的是「從幾分幾秒開始看、動作提示與字幕狀態」（即 `data-video-text-highlights`）。在此架構下，影片文字重點被擠壓到數屏滾動距離之外（排在機轉診斷、多節點時間軸及來源折疊盒之後），嚴重干擾觀片體驗。
  - 桌面寬螢幕空間浪費，強制將所有長文與影片垂直堆疊，使頁面垂直高度激增。
- **建議修法**：
  1. 調整 `videos/[slug].astro` 的區塊排版順序：將 `data-video-text-highlights` 移至 `EventMechanism` 之前，緊隨播放器下方，先解釋「畫面看什麼」，再開展「醫學機轉與後續發展」。
  2. 檢討 `.clip-layout-expanded` 規則，在寬螢幕下（如 `@media (min-width: 64rem)`）維持左側播放器/精簡重點、右側機轉與時間軸的雙欄對照結構。
- **待核實處**：
  - 需核實原設計者是否刻意希望加強機轉可讀性而暫時採用單欄，但目前順序在觀察頁面明顯損害影片輔助閱讀體驗。

---

### `NEW-IA-02` [P1] 觀察頁面存在重複且結構不一致的雙重來源折疊區塊
- **檔案與行號**：
  - `src/pages/videos/[slug].astro`: 第 118 行（引入 `EventFollowUp.astro:79–111`）與第 254–279 行（`<details class="clip-references">`）
- **涉及代表 Slug**：全部 113 個觀察頁（例如 `gavi-acl-2023`、`novak-djokovic-meniscus-2024`）
- **重現依據**：
  1. `EventFollowUp.astro` 第 79–111 行渲染了預設展開的 `<details open>`，標題為「查看機轉、傷勢與回場來源」，內含 `update.sources`（編號 `li[id]`）。
  2. 在同一頁面底部（`videos/[slug].astro` 第 254 行），又渲染了另一個 `<details class="clip-references">`，標題為「事件來源」，內含原始影片連結與 `clip.sources`。
- **使用者影響**：
  - 同一頁面出現兩個功能高度重疊、各自表列外部來源的折疊盒，且格式一個帶編號/查核日、另一個不帶編號，造成資訊混亂與認知負擔，使用者無法理解兩處來源清單的授權與查核差異。
- **建議修法**：
  - 整合觀察頁來源展示邏輯：若已載入富含查核日期與錨點 ID 的 `EventFollowUp` 來源清單，應將 `clip.sources` 統一整合或在頁尾移除重複的 `clip-references`。
- **待核實處**：
  - 需核對 `clip.sources` 與 `update.sources` 是否存在極少數歷史未同步條目，整合時須確保無外部引用遺漏。

---

### `NEW-READ-01` [P2] 未回場、退役或賽季報銷案例在 `EventFollowUp` 固定顯示「傷後多久再出賽？」假設性標題
- **檔案與行號**：
  - `src/components/cases/EventFollowUp.astro`: 第 23–38 行
- **涉及代表 Slug**：`carolina-marin-acl-2024`
- **重現依據**：
  1. `carolina-marin-acl-2024` 之 `returnDate: null`，`returnSummary: "2026-03-26 宣布結束職業生涯；本頁沒有列出傷後正式回場日期。"`。
  2. `EventFollowUp.astro` 第 25 行固定輸出 `<h3>傷後多久再出賽？</h3>`。
  3. 第 27 行因 `days === null`，條件式不渲染天數里程碑，直接在 `<h3>傷後多久再出賽？</h3>` 正下方輸出退役說明段落。
- **使用者影響**：
  - **閱讀語意矛盾與誤導**：副標題預設了選手「已經回場出賽」，讀者快速掃描時會誤以為該案例有回場紀錄，細讀內文才發現是「宣布退役、未正式回場」，違反衛教資訊傳遞的精確性與真實性原則。
- **建議修法**：
  - 標題應依據狀態條件式調整，例如當 `days === null` 或回場狀態為退役/未回場時，標題動態顯示為 `<h3>傷後出賽與生涯後續</h3>` 或 `<h3>後續出賽狀況</h3>`。
- **待核實處**：
  - 120 例中除 Marín 之外，是否有其他賽季報銷（Out for Season）或仍在復健中的案例存在相同標題不匹配情況。

---

## 二、已存在問題（Pre-existing Issues）

### `PRE-READ-01` [P2] 臨床個案頁與展開觀察頁在寬螢幕下段落未受行寬限制，產生過長行寬閱讀疲勞
- **檔案與行號**：
  - `src/styles/global.css`: 第 129–137 行
  - `src/pages/cases/[slug].astro`: 第 176–182 行
  - `src/components/cases/EventMechanism.astro`: 第 56–64 行
  - `src/components/cases/EventFollowUp.astro`: 第 114–121 行
- **涉及代表 Slug**：7 個臨床個案頁（如 `cases/[slug]`）及全域桌面端排版
- **重現依據**：
  1. `global.css` 第 129–137 行僅對 `main > p:not([class])`、`main > section > p:not([class])`、`main > article > p:not([class])` 等特定層級設置 `max-inline-size: 42rem`。
  2. 在 `cases/[slug].astro` 中，`<EventMechanism>` 與 `<EventFollowUp>` 作為獨立組件直接置於 `<article>` 內部，其內部的 `<p>` 帶有 class 或位於組件自身樣式作用域內，且父容器 `.event-mechanism` / `.event-follow-up` 設置 `min-width: 0;` 但無 `max-width` 限制。
- **使用者影響**：
  - 在大於 1200px 的桌面螢幕上，機轉說明文字（`mechanism.summary.text`、`mechanism.explanation.text`）單行寬度會直接延展超過 60rem–70rem（每行超過 70–80 個繁體中文字），大幅超出人眼舒適掃描行長（35–45 字），造成嚴重的跳行與視覺疲勞。
- **建議修法**：
  - 在 `EventMechanism.astro` 與 `EventFollowUp.astro` 的容器樣式中明確規範 `max-inline-size: min(100%, 48rem);`，確保大螢幕下的閱讀行寬受到保護。
- **待核實處**：
  - 無。純 CSS 寬度繼承機制明確。

---

### `PRE-MOB-01` [P2] 極窄行動螢幕（<= 25rem / 400px）下播放器載入按鈕絕對定位遮蔽受傷預覽畫面
- **檔案與行號**：
  - `src/pages/videos/[slug].astro`: 第 479–492 行
- **涉及代表 Slug**：所有含 YouTube Facade 播放器之頁面（如 `videos/[slug]`）
- **重現依據**：
  1. 在 `@media (max-width: 25rem)` 媒體查詢下，`.clip-facade button` 被設為：
     ```css
     position: absolute;
     bottom: 0.75rem;
     left: 50%;
     transform: translateX(-50%);
     width: max-content;
     max-width: calc(100% - 1rem);
     font-size: 0.85rem;
     ```
  2. 該按鈕內部包含主標題文字「載入 YouTube 播放器」以及 `<small>點擊後才會連線至 YouTube</small>`，加上 `padding: 1rem`，按鈕總高度達 65px–70px。
  3. 在 320px–360px 螢幕上，16:9 比例之縮圖容器高度僅約 160px–180px。
- **使用者影響**：
  - 高度達 70px 的按鈕懸浮在縮圖底部，直接遮擋了縮圖畫面近 45% 的可視面積。使用者在點擊載入播放器前，難以透過封面預覽圖看清受傷肢體與關鍵動作畫面。
- **建議修法**：
  - 在小螢幕下避免將按鈕絕對定位疊加於縮圖之上；改為維持在縮圖正下方流動排列（Block flow），或將按鈕樣式精簡為半透明緊湊型圖示/文字條。
- **待核實處**：
  - 需確認按鈕上的 `hidden` 屬性在腳本未執行時的降級行為，確保在無 JS 環境下不產生排版破裂。

---

### `PRE-A11Y-01` [P2] 來源清單位於 `<details>` 折疊盒內，若使用者手動收合後點擊行內錨點將產生導覽失效（跨瀏覽器相容性風險）
- **檔案與行號**：
  - `src/components/cases/EventFollowUp.astro`: 第 79–111 行
- **涉及代表 Slug**：全域使用 `ReportSourceRefs` 之頁面
- **重現依據**：
  1. 來源列表置於 `<details open={Boolean(update.mechanism || update.timeline)}>` 之中。
  2. 雖然 SSR 初始為 `open`，但若使用者在手機上為節省螢幕空間手動點擊 `<summary>` 將其收合，隨後在上方機轉或時間軸段落中點擊 `[1]` 或 `[4]` 錨點連結。
- **使用者影響**：
  - **（推測）**：在不支援原生 HTML 隱藏元素搜尋與自動展開（如缺乏 `beforematch` 事件支援之舊版 Safari 或特定非 Chromium 瀏覽器環境）下，錨點無法自動觸發 `<details>` 展開，頁面雖可能產生跳轉或無反應，但目標條目完全隱藏，造成使用者困惑。
- **建議修法**：
  - 增添輕量客戶端監聽機制（或確認外層 details 狀態），當偵測到 hashchange 目標位於收合的 details 內部時，主動設置 `details.open = true`；或評估來源清單是否應作為正式結構常駐展示而不使用折疊標籤。
- **待核實處**：
  - 本項標註為**推測**：現代桌面版 Chrome/Edge 原生支援 target 自動展開，但在不同行動裝置 WebKit / Gecko 核心版本中的行為一致性尚待確認。

---

## 三、總結建議處理優先順序

| 優先級 | 項目編號 | 類型 | 核心障礙摘要 |
| :--- | :--- | :--- | :--- |
| **P1** | `NEW-A11Y-01` | 本輪新增 | 行內引用 `[1]` 觸控熱區小於 24px 易誤觸；目標 `li` 缺乏焦點承接。 |
| **P1** | `NEW-IA-01` | 本輪新增 | 觀察頁因展開樣式導致核心「影片文字重點」遭深度臨床時間軸下擠。 |
| **P1** | `NEW-IA-02` | 本輪新增 | 觀察頁面存在重複的雙重來源折疊盒，資訊架構冗餘。 |
| **P2** | `NEW-READ-01` | 本輪新增 | 退役/未回場案例在 `EventFollowUp` 出現預設回場之矛盾標題。 |
| **P2** | `PRE-READ-01` | 已存在 | 寬螢幕下長篇機轉與時間軸無 max-width 限制，每行字數過長。 |
| **P2** | `PRE-MOB-01` | 已存在 | 小螢幕（<= 25rem）載入按鈕絕對定位遮擋近半影片預覽圖。 |
| **P2** | `PRE-A11Y-01` | 已存在 | 來源手動收合後，錨點跳轉觸發展開的瀏覽器相容性（推測）。 |
