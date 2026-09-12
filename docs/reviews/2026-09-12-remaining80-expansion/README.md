# 剩餘 80 例：受傷機轉與後續發展

承接 Tatum 與前兩批 20 例，本批補入其餘 80 例。全站 101 例均有機轉重點、三個事件步驟、一般受力解釋、證據限制及附來源的後續時間軸。本批新增 224 個時間軸節點；仍屬本機編輯草稿，沒有新的臨床簽核或正式發布。

[逐例內容與來源對應](case-review.json)、[全站進度](progress.json)、[本批開始前的 80 例資料](baseline.json)可供覆核。較早批次的文件保留當時快照。

## 整理原則

- 每例依既有個案事件及已歸因公開報導撰寫，沒有把同傷種的一般機轉套成個人的實測結果。動作步驟描述事件與可能受力，不量測角度、張力或精確斷裂時點。
- 原本的 slug、影片網址、受傷日、首次回場欄位全部保留。日期不足時使用年份／月份，沒有把退役、同場帶傷續賽或列入名單補成首次康復日。
- 診斷與一般解釋分別保留來源。一般醫學資料採 AAOS、CDC、HSS、MedlinePlus，以及尺側伸腕肌腱的原始研究；未把研究的治療方式寫成選手實際課表。
- 本批影像敘事主要沿用既有策展片段的觀察記錄，沒有重新逐格觀看全部 80 段影片。Haliburton 的既有短片主要是協助離場，故收斂為事件與一般推蹬功能的解釋，不補寫未看清的加速或踩地動作。
- `checkedAt: 2026-09-12` 表示本次編輯與來源對應查核日期，不表示每位選手的完整職涯或最新狀態都追蹤到當天。時間軸以所列報導及已核得出賽節點為範圍。
- 延用前階段已建立的診斷、賽事與回場資料。本輪另查讀多個官方／具名報導及一般醫學來源；沒有把每個既有連結都標成重新取得全文。直接頁面空殼、失敗或只有索引可讀者，不能等同完整原始病歷驗證。

## 重要證據邊界

| 情境                 | 本批處理                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 未知首次回場         | Redmond、Strug、Foucher、Livingston、Andrade、Eaton 保留未知，不補造離場天數。                                    |
| 已退休或尚未正式復出 | Bolt、劉翔與 Haliburton 各依其公開後續整理，不用退休或回歸展望代替實際回場。                                      |
| 同場繼續比賽         | Strug、LaVine、Smith、Morton、羽生等，明確區分帶傷活動與康復。                                                    |
| 不同傷勢             | Thompson 左膝與右 Achilles、Vonn 訓練再傷、Sergachev 先前傷勢、Granderson 前臂與手部、Harper 膝／拇指／手肘分開。 |
| 組織尚未確認         | Ronaldo、Ibrahimović、Oxlade-Chamberlain、Pedroia 保留公開用語，不擅自寫成 ACL 撕裂。                             |
| 膝傷不等於 ACL       | Oladipo 股四頭肌腱、Díaz／Fowler／Mattek-Sands 髕腱、McDavid PCL、Machado MPFL 各自說明。                         |
| 頭傷的區分           | 腦震盪、顱骨／顏面骨折、頸椎骨折、血腫與傷口分開；Happ、羽生等未確認的腦震盪不予新增。                            |
| 不同回場層級         | U23、選拔、閉門友誼賽、小聯盟復健、春訓、季前賽、一隊／頂級聯盟分開；指定打擊與吊環也保留角色限制。               |

本輪來源補查的例子：Redmond 本人回顧、Strug 本人年表、CrossFit 成績、Vonn 三次官方更新、FIDAL Tamberi 傷勢／手術／回歸、板球協會 Smith 延遲症狀、Liverpool Elliott 隊醫說明、Van Vleuten 本人回顧、WTA Mattek-Sands、MLB Díaz／Hudson／Machado、FISI Goggia、FIS Shiffrin／Kilde 等。

CrossFit 的 Medium 原文直接開啟失敗，但搜尋索引可讀到 2015 Central Regional 跳箱受傷段落。FIDAL Tamberi 部分頁面也由可讀索引補核。多個 NBA 球隊歷史頁只回傳空殼，既有診斷資料保留歸因，本輪新增段落另搭配可讀報導；NBA 網域依既有政策維持純文字來源。

## 驗證

本批驗證完成，詳見 [驗證紀錄](validation.json)及 [101 頁 Chrome 結果](layout-results.json)。

- 3 檔相關單元測試共 59 項通過；Astro check 為 0 errors、0 warnings，保留 16 個既有 hints。
- 隔離乾淨快照通過內容檢查與 review build，建置 172 頁。原工作目錄的既有 D18 範圍檢查未停用。
- 全部 101 個案 × 390px／1280px，共 202 組 Chrome 檢查通過：無水平溢位、重複 ID、失效引用目標或頁面 JavaScript 錯誤；來源、三個步驟與時間軸數量相符。NBA 可點擊外連為 0。
- 逐頁比對回場天數；日期未知時沒有顯示天數。人工檢查 Haliburton 桌面機轉、Foucher 年份時間軸、Machado 手機時間軸及 Shiffrin 手機機轉。
- 與上一批已驗證快照相比，恰好 80 筆 event entries 改變。其餘 23 筆既有記錄與所有批次中繼資料不變；這 23 筆包含先前已完成的 21 頁及另外 2 筆資料記錄。
- 主工作目錄的產品／測試檔案 SHA-256 與建置快照相符。隔離快照提交是 `51e19127aeefd66fa68293825e9ff2ebfeaa51d3`，不代表主分支已提交。

本機預覽：`http://127.0.0.1:14328/`，來自 `/private/tmp/atlas-all101-review-raase_m_/dist`。例如 `/videos/manny-machado-2013-knee/`、`/videos/julie-foucher-box-jump-2015/`、`/cases/tyrese-haliburton-achilles-rupture-2025/`。

沒有更動凍結的臨床個案、權利或核准台帳，也沒有執行 commit、push、正式發布或對外寄送。
