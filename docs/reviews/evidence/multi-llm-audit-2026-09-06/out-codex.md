依 `AUDIT_CONTEXT.md`，以下針對指定 PUBLIC 設定的原始碼；未執行建置、瀏覽器測試或線上播放。未確認 P0 blocker。歷史審查照片、字幕核准例外不列為缺失；既有測試不代表今日播放可用。

1. **A11Y-PERF-001｜P1｜播放器就緒後的錯誤不會觸發備援**
   
   **位置：** [src/scripts/video-player.ts:41](/private/tmp/atlas-audit-20260906/source/src/scripts/video-player.ts:41)  
   **證據／後果：** `onReady` 先完成 Promise；後續 `onError` 僅呼叫同一 Promise 的 `reject`，不再有效。因此若就緒後發生播放錯誤，本站仍保持 `ready`，不顯示失敗提示，也不恢復重試按鈕。原始連結仍在，但使用者缺少引導。  
   **最小修正：** 將持續性的播放錯誤處理獨立於初始化 Promise，直接更新失敗狀態與備援介面；補測 `onReady → onError`。**信心：1.00。**

2. **A11Y-PERF-002｜P1｜公開案例播放按鈕的焦點框遭裁切**
   
   **位置：** [src/components/cases/CaseVideo.astro:360](/private/tmp/atlas-audit-20260906/source/src/components/cases/CaseVideo.astro:360)、[VideoThumbnail.astro:30](/private/tmp/atlas-audit-20260906/source/src/components/cases/VideoThumbnail.astro:30)  
   **證據／後果：** 按鈕以 `position:absolute; inset:0` 鋪滿縮圖，焦點框使用正值 `outline-offset` 向外繪製；父容器卻設定 `overflow:hidden`。公開路徑確實經 `CaseCover` 使用此縮圖，因此鍵盤使用者聚焦播放按鈕時，看不到預期的外框。  
   **最小修正：** 改為內縮焦點框，或在按鈕內部標籤繪製焦點樣式。**信心：0.98。**

3. **A11Y-PERF-003｜P2｜載入與失敗狀態缺少輔助科技通知**
   
   **位置：** [src/scripts/video-player.ts:68](/private/tmp/atlas-audit-20260906/source/src/scripts/video-player.ts:68)、[CaseVideo.astro:177](/private/tmp/atlas-audit-20260906/source/src/components/cases/CaseVideo.astro:177)、[src/pages/videos/[slug].astro:45](/private/tmp/atlas-audit-20260906/source/src/pages/videos/[slug].astro:45)  
   **證據／後果：** 載入只更新 `data-video-state`；失敗只解除段落的 `hidden` 並將焦點移回原按鈕。沒有 live region、狀態角色或按鈕與錯誤訊息的描述關聯，讀屏使用者可能只聽到原按鈕名稱，不知道等待或失敗原因。  
   **最小修正：** 提供持續存在的狀態區，更新載入／失敗文字，並把錯誤說明關聯到重試控制。**信心：0.99。**

4. **A11Y-PERF-004｜P2｜外部備援連結遺失起播時間**
   
   **位置：** [src/pages/videos/[slug].astro:50](/private/tmp/atlas-audit-20260906/source/src/pages/videos/[slug].astro:50)、[src/scripts/video-player.ts:96](/private/tmp/atlas-audit-20260906/source/src/scripts/video-player.ts:96)  
   **證據／後果：** 站內播放器加入 `startSeconds`，備援連結卻直接使用不含時間的 `clip.videoUrl`。例如 Zverev 的資料設定 `startSeconds:1340`，外部連結沒有此參數；改用原始平台後，讀者須重新尋找受傷片段。  
   **最小修正：** 備援觀看連結加入相同起播時間；來源引註可保留 canonical URL。**信心：1.00。**

5. **A11Y-PERF-005｜P2｜JavaScript 不可用時仍顯示可操作的播放按鈕**
   
   **位置：** [src/pages/videos/[slug].astro:39](/private/tmp/atlas-audit-20260906/source/src/pages/videos/[slug].astro:39)、[src/components/cases/CaseVideo.astro:170](/private/tmp/atlas-audit-20260906/source/src/components/cases/CaseVideo.astro:170)  
   **證據／後果：** 播放按鈕由靜態 HTML 直接提供，功能完全依賴事件綁定；没有初始化成功才啟用的機制。停用 JavaScript 或模組載入失敗時，讀者仍能聚焦、按下按鈕，卻沒有反應。下方原始連結仍可使用。  
   **最小修正：** 預設提供外部觀看入口，成功綁定後才顯示／啟用站內播放按鈕。**信心：1.00。**

6. **A11Y-PERF-006｜P2｜縮圖沒有依顯示尺寸提供影像候選**
   
   **位置：** [src/components/cases/VideoThumbnail.astro:18](/private/tmp/atlas-audit-20260906/source/src/components/cases/VideoThumbnail.astro:18)  
   **證據／後果：** 同一元件用於卡片與詳情，固定輸出 `480×360`，沒有 `widths`、`sizes` 或響應式 layout 設定；CSS 卻讓影像填滿容器。寬版詳情會放大既有影像，小尺寸卡片也無法選擇較小候選。實際模糊程度與傳輸差額未量測。  
   **最小修正：** 依卡片／詳情設定響應式候選與 `sizes`；較大候選須來自足夠解析度的本機原始封面，避免單純放大。**信心：0.97。**

7. **A11Y-PERF-007｜P2｜未使用的中文字型仍保留於公開資產及共用 CSS**
   
   **位置：** [src/styles/global.css:8](/private/tmp/atlas-audit-20260906/source/src/styles/global.css:8)、[src/styles/tokens.css:57](/private/tmp/atlas-audit-20260906/source/src/styles/tokens.css:57)、[astro.config.mjs:11](/private/tmp/atlas-audit-20260906/source/astro.config.mjs:11)  
   **證據／後果：** `Noto Serif TC` 字型名稱只出現在 `@font-face` 宣告，目前字型堆疊均未引用；共用 CSS 又設定內嵌。這留下重複的無效宣告與公開資產負擔，**不能據此宣稱首屏下載了這些字型**。  
   **量化推導：** 對 `public/fonts/*.woff2` 執行 `len(Path(...).read_bytes())`，得到 `161880 + 163176 + 49584 + 50064 = 424704 bytes`。  
   **最小修正：** 移除未使用宣告及公開輸出中的對應字型。**信心：0.99。**

8. **A11Y-PERF-008｜P2 候選，待驗證｜窄螢幕放大字級可能裁切播放文字**
   
   **位置：** [src/pages/videos/[slug].astro:141](/private/tmp/atlas-audit-20260906/source/src/pages/videos/[slug].astro:141)、[VideoThumbnail.astro:30](/private/tmp/atlas-audit-20260906/source/src/components/cases/VideoThumbnail.astro:30)  
   **證據／可能後果：** 按鈕絕對定位在固定比例、隱藏溢位的容器內；字級與 padding 隨 `rem` 增長，容器高度則受螢幕寬度限制。文字換行後可能超出上緣，影響辨識與操作。  
   **驗證／最小修正：** 在 320px、站內最大字級下檢查實際文字和焦點邊界，涵蓋明暗主題；若確認裁切，窄版改將按鈕置於封面下方正常排版。既有首頁溢位測試未涵蓋此組合。**信心：0.75。**