先讀 `AUDIT_CONTEXT.md` 與指定頁面/元件，只做唯讀稽核，不改檔、不跑建置。接著讀首頁、詳情頁、導覽與病患導引相關檔，對齊目前公開路徑與歷史審核行為。# 產品 UX／資訊架構稽核（公開版）

範圍：目前公開行為（`ATLAS_BUILD_MODE=public`、`ATLAS_PUBLIC_LAUNCH=decision-21`）。審查版 26 筆、傷種總覽／回場課程摺疊、工作流程徽章為刻意差異，不當成公開缺陷。不建議恢復搜尋列、頂欄傷種或球員肖像。未核對線上渲染。本範圍無已確認 P0。

**公開數量（可重算）**  
`public-launch.v1.json` 案例 5 + `expansion.v1.json` 案例 2 = 7 筆已核准案例；clips 7。首頁 `videoCount` = 7+7 = **14**。7 筆傷種：踝扭傷 4、阿基里斯腱 3、ACL **0**。`index.astro` 以 `permitted.some` 過濾傷種卡，故首頁只會出現 **2** 張傷種卡。`e2e/patient-experience.spec.ts` 預期首頁 5 張、`atlas-navigation.spec.ts` 預期 26 筆／ACL 7 筆，屬舊公開或審查建置，不能證明今日公開畫面。

---

## P1 重要

### UX-P1-01 14 支影片混成一格，未標「已確認案例」vs「觀察片段」
- **位置：** `src/pages/index.astro:37-58`；`ObservationCard.astro:10-16`；`expansion.ts:1`
- **後果：** 讀者把「Inversion Ankle Sprain」「BROKE His Ankle」與已確認 NBA 案例當成同一證據層。觀察卡僅「受傷動作觀察 →」，首頁引言也不分流。
- **證據：** 同一 `ol.video-grid` 先 7 張 `CaseCard` 再 7 張 `ObservationCard`；expansion 註明觀察片不宣稱醫療核准。
- **最小修：** 兩段標題分開（例如「已確認診斷的案例影片」「動作觀察，非診斷」）；觀察卡加一句非診斷。不要加搜尋。
- **信心：** 0.95

### UX-P1-02 案例頁預設路徑沒有「影片裡發生什麼」
- **位置：** `cases/[slug].astro:124-152,153-181`；對照 `videos/[slug].astro:66-67`
- **後果：** 看完案例影片先接到該傷種通用「先做這幾件事」，本場可見過程鎖在「深入了解這次受傷」。7 筆公開案例的 `observedMechanismTags` 皆為 `unclear`，展開後仍是代碼而非白話。
- **證據：** 預設 DOM：影片 → `PatientGuide` → `ActualReturn` → 摺疊專業筆記。觀察頁才有「受傷當下看什麼」。
- **最小修：** 影片下加 1–3 句公開觀察（對齊觀察頁）；機轉改 `labelZh`（「機轉不明」）。勿把專業四段預設展開。
- **信心：** 0.93

### UX-P1-03 觀察頁「當下怎麼做」全站同一套扭傷文案，且沒有一般 vs 實際回場
- **位置：** `videos/[slug].astro:67-85`；`expansion.v1.json`（膝／大腿後側／阿基里斯腱 vs 腳踝）
- **後果：** 膝傷、阿基里斯腱、腿後側都連 NHS 扭傷拉傷頁，且只有一段「後續回場」，沒有案例頁那種「一般人參考」對照「這位選手紀錄」。
- **證據：** 七頁同一段停止運動＋NHS sprains；案例頁才有 `PatientGuide` 03 與 `ActualReturn`。
- **最小修：** 依 `bodyPart` 連到對應已核准衛教（或傷種頁錨點）；有日期者套 `ActualReturn` 語氣，無日期維持不推估。不寫治療處方。
- **信心：** 0.97

### UX-P1-04 去掉頂欄傷種後，身體連結幾乎找不到；頁尾 ACL 是空列表
- **位置：** `SiteHeader.astro:39-48`（僅「首頁」，符合決策）；`index.astro:60-80`（傷種在 `<details>`）；`SiteFooter.astro:16-18`；`injuries/[injury].astro:95-144,146`
- **後果：** 首屏看不到三個傷種入口。案例 eyebrow／觀察頁都不連 `/injuries/{code}/`。頁尾「前十字韌帶損傷」進 ACL 頁：篩選器＋「目前沒有已審查的案例」，衛教在列表下方。ACL 衛教幾乎只靠頁尾。
- **證據：** 公開 ACL=0；首頁傷種卡被 filter 掉；footer 仍寫死三連。
- **最小修：** 影片格後以內文連到傷種（不要加回頂欄）；案例／觀察頁傷種或部位可點。ACL 公開頁先衛教、拿掉空列表／篩選，或頁尾改連衛教錨點。
- **信心：** 0.96

### UX-P1-05 公開傷種／聯盟列表仍是審查用搜尋篩選
- **位置：** `injuries/[injury].astro:103-105`；`CaseFilters.astro:56-157`；`leagues/[league].astro:55-59`
- **後果：** 決策是 14 支影片不設搜尋。公開踝 4／腱 3／ACL 0 仍出現「球員或球隊關鍵字」與年份、球季、運動、聯盟、機轉、影片來源、診斷確認、經典案例。一般讀者會以為館藏很大，篩完變空白。
- **證據：** 首頁無 search/combobox；傷種頁一律掛完整 form（workflow 僅 review）。
- **最小修：** 公開模式不渲染 `CaseFilters`。不把搜尋加回首頁。
- **信心：** 0.95

### UX-P1-06 公開文案殘留審查用語與英文
- **位置：** `index.astro:77-79`；`InjuryCard.astro:41-44`；`injuries/[injury].astro:77,95-100,118`；`cases/[slug].astro:231`；`leagues/[league].astro:49,56`
- **後果：** 「已審查」「reviewed cases」像內部看板。首頁「14 支影片」對「目前共 7 筆」未說明 7 是案例、不是影片數。
- **最小修：** 改「教學案例 N 則」；刪英文；summary 寫清 7 則案例＋7 則觀察。
- **信心：** 0.99

### UX-P1-07 與主站 `/content/` 的品牌關係幾乎只存在首頁
- **位置：** `index.astro:28-31`（全站唯一 `sportsmedicine.tw/content/`）；`SiteHeader.astro:16-21`；`SiteFooter.astro:36-49`；各頁 `<title>`
- **後果：** 從影片／案例深鏈進來的人看不到「分享資訊」；站名在「運動傷害影片圖鑑」與「職業運動傷害影片圖鑑」間切換。頁尾無主站連回。
- **證據：** grep 僅首頁 breadcrumb；header 英文 `SPORTS MEDICINE · VIDEO ATLAS` 不連主站。
- **最小修：** header 或 footer 固定「分享資訊」外連；title/copyright 統一公開名。不改主站 repo。
- **信心：** 0.94

---

## P2 改進

### UX-P2-01 同格卡片資訊密度與控件不一致
`CaseCard.astro:64-98,208-221` vs `ObservationCard.astro:10-55`。案例卡：傷種 pill、聯盟／球季／日期／對戰、「觀看影片與回場重點」、播放鈕 2.75rem。觀察卡：賽事、姓名、「受傷動作觀察 →」，無部位／時長／回場，播放鈕 3rem。讀者難以掃讀 14 張。**最小修：** 觀察卡補部位＋一條 CTA；案例 compact 可收對戰細節。不改封面策略（YouTube 縮圖維持）。信心 0.90

### UX-P2-02 機轉標籤輸出代碼
`cases/[slug].astro:174-177` 直接 `join` `unclear`，未用 `MECHANISMS.labelZh`「機轉不明」。信心 0.92

### UX-P2-03 同一傷種兩個俗名
分類／頁尾「踝關節扭傷」（`injuries.ts:6`、`SiteFooter.astro:17`）；衛教 JSON「腳踝扭傷」（`ankle-sprain.json:4`）；觀察片「腳踝」。**最小修：** 對外只留一個。信心 0.95

### UX-P2-04 主導覽與 logo 重複
`SiteHeader.astro:17-48` + `layout.css:69-77`：行動「選單」只展開「首頁」，logo 已回 `/`。桌面也並排兩個首頁。**最小修：** 公開可拿掉單項 nav／hamburger，或把選單改放頁尾政策／傷種（仍不要加回頂欄傷種）。信心 0.88

### UX-P2-05 孤兒 `/leagues/nba/`
7 筆皆 NBA，公開會生聯盟列表（含篩選），chrome 無連出。**最小修：** 公開不產聯盟列表，或只留無篩選靜態頁。信心 0.86

### UX-P2-06 次要公開頁語氣與區塊順序
- 相關標題「（最多 3 筆）」是實作細節（`cases/[slug].astro:227`）
- 觀察頁 `MedicalNotice` 在文末，案例／傷種在頂（`videos/[slug].astro:105`）
- 頁尾「來源與證據政策」是審查治理口吻（`source-policy.astro:17-25`）
- `credits-notices.astro:14-21` 仍以球員照片授權開場；公開封面已是 YouTube 縮圖（該頁 L25-26 有寫）

**最小修：** 刪「最多 3 筆」；觀察頁 notice 上移；政策頁加一句給一般讀者。勿恢復肖像。信心 0.84

---

## 主觀選項（非缺陷）

案例頁「一般人參考」在「球員實際紀錄」之前，符合先通用後個例；若要強調對照，可把實際回場緊貼影片，衛教範圍當第二塊。專業筆記預設摺疊符合「短衛教」。3 欄網格、header 字級／深色，屬版式選擇。D25 只覆蓋 light／標準字；390px + 1.5 字級是否擠壓 **待核**。

## 待核

- 現況 `sportsmedicine.tw/content/` 導覽是否真叫「分享資訊」
- 公開 `FollowUpReports` 在 `pendingFollowUpForBuildMode` 回傳 null 時是否仍佔摺疊區塊
- 今日 HTTPS 播放（舊 D21/D23 實測不延伸）
