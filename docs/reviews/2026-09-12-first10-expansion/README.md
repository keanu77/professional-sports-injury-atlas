# 第一批 10 例：機轉摘要與後續發展

承接 100 例可行性盤點，完成 10 個代表個案的本機內容。加上先前 Tatum，目前為 11 / 101；其餘 90 例尚未擴寫。這是公開資料的編輯整理，不代表新的臨床簽核或正式發布。

每例包含個別撰寫的機轉摘要、三個動作／事件重點、力學解釋、證據限制及有引用的時間軸。本批共 39 個里程碑。日期保留來源精度，Paul George 的 2014 年 10 月／12 月訓練及 Zverev 的 2022 年 9 月骨水腫不補造日期。

完整段落、時間軸與來源編號對應見 [case-review.json](case-review.json)。內容仍位在各個既有 `event-*.v1.json` entry，沒有修改凍結 case、follow-up、臨床或發布核准 ledger。

| 個案             | 敘事重點                           | 後續區分                            |
| ---------------- | ---------------------------------- | ----------------------------------- |
| Kevin Durant     | 變向、推蹬負荷；個人受力屬推論     | 2019 手術、2020 季前賽／正式賽      |
| Kobe Bryant      | 切入時跌倒；MRI 才確認肌腱斷裂     | 手術、籃球活動許可、正式賽          |
| Derrick Rose     | 收步到起跳的負荷，不指定斷裂幀     | ACL 手術、季前賽、另側半月板事件    |
| Jamal Murray     | 切入承重到失衡                     | 手術、季前賽／例行賽                |
| Beth Mead        | 追球轉向，不臆測性別或場地致傷     | 診斷、訓練、正式比賽                |
| Aaron Rodgers    | 接觸性擒抱，不套用 NBA 非接觸結論  | 手術、行走傳球、2024 正式賽         |
| Alexander Zverev | 翻踝與外側韌帶                     | 手術、骨水腫延遲、United Cup        |
| Paul George      | 落地碰撞籃架、小腿骨折             | 術後、投籃、扣籃、正式賽            |
| Sidney Crosby    | 頭部碰撞與腦功能，不能從畫面判康復 | 診斷、缺賽、實際復賽；五天不是規則  |
| 王建民           | 中足 Lisfranc 傷勢，不概括為踝扭傷 | 保護靴／拐杖、2009 春訓；不混入肩傷 |

## 查核方法與保留限制

- 2026-09-12 重新查閱球隊、聯盟、AAOS、CDC、PubMed 與原始賽事報導；新增段落各自附來源索引。`checkedAt` 指這次編輯查核日，不表示所有歷史連結均可即時播放，也不表示傷後近況持續更新至當天。
- 重新取得 9 例 YouTube 畫面；其中 Durant 取得的是片頭，跳到後段時播放器報錯，故機轉依 NBA 報導與群體研究，不聲稱本次完成逐格分析。Zverev 指定片段亦報錯，採 ATP 2023-05-29 動作回顧。其餘畫面只支持動作與失衡／離場觀察，不當作醫療影像。
- 部分 NBA／ATP 頁面直接開啟受限，但搜尋索引有球隊原文，依可讀段落核對。Arsenal 診斷及比賽頁仍回應 403；保留舊來源，訓練用 Arsenal 可讀索引，正式復賽新增 UEFA 回顧交叉核對。CBS 的 Kobe 術後報導與 SFGATE/AP 王建民春訓報導已用瀏覽器讀到正文。
- Murray 的 2022-10-03／10-19 出賽以 NBA 官方記錄 PDF 再核對；原始來源的日期、比賽日期及預告的日期分開處理。
- 保留 NBA 網域以純文字列示來源的既有政策。未新增或下載至網站任何轉播影片、圖片，也未改動影片／影像授權台帳。

## 驗證

- `npm run check`：0 errors、0 warnings，16 個既有 hints；`npx tsc --noEmit` 通過。
- 93 個單元測試檔、1,473 項全部取得通過結果。初跑有 3 檔因沙盒無法 listen、2 檔因舊影像合約要求 Node 24.14.0 未通過；分別在允許本機 socket、指定既有 Node 24.14.0 後補跑通過。沒有修改或略過測試條件。
- 乾淨隔離快照通過 `node --import tsx scripts/check-content.ts`；`ATLAS_PUBLIC_LAUNCH=decision-21 npm run build:review` 產生 172 個 review 頁面，包含 94 個影片頁。這是 review build，未執行 production release。
- 11 個已擴寫頁面 × 390px／1280px，共 22 組 Chrome 檢查全部通過：無水平溢位、無重複 ID、無失效的內頁引用、無 JavaScript 錯誤、NBA 可點擊外連為 0，來源與時間軸數量符合資料。
- 截圖檢查找出既有手機影片按鈕缺少定位容器，已補上 `.clip-facade { position: relative; }`；重建後 22 組檢查再通過，新增按鈕必須位於影片容器內的檢查。人工再看手機 Mead 機轉、George 月份時間軸與桌面 Durant／Rodgers 機轉。
- 最終隔離快照：`3f43572b3583628c6ec779d42320c8adc2222e0a`，位置 `/private/tmp/atlas-first10-review-kj3oi4ga`。12 個程式／資料／測試修改檔與主工作目錄 SHA-256 相符，見 [validation.json](validation.json)。
- 僅 11 個 event entries 有修改（包含前一階段 Tatum），事件 slug、影片、受傷日與首次回場日全部保持原值。

[版面檢查結果](layout-results.json)與[其餘 100 例進度表](progress.json)可供續作。本機預覽在 `http://127.0.0.1:14326/`；例如 `/videos/beth-mead-2022/`、`/cases/kevin-durant-achilles-rupture-2019/`。原工作目錄保留未提交修改，未推送、未部署。
