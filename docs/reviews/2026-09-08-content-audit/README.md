# 個案分頁內容稽核 — 2026-09-08

範圍：正式站全部 101 個影片詳細頁（7 cases、94 videos）。基準 commit `daaae0da4bca056a8a92f90e4b12fdd5e819dd5e`。本次只稽核與產出清單，未修改網站內容或部署。

## 方法與結果

- 主 agent：逐頁比對本機 dist 與線上 HTML，檢查一般人參考／延伸閱讀區塊、傷勢與後續區塊、資料欄位、來源數量及回場日期狀態。全站頁面的資源連結與傷勢後續區塊存在性比對無差異。
- Grok：只看 101 頁精簡文章關聯材料與主站候選篇名；agy：只看 101 頁精簡傷勢與回場資料。兩路均完成且 exit 0；主 agent 逐項反查採納項目，未把模型輸出當成已查證事實。
- 101 個頁面及現有 6 個不重複主站資源網址，合計 107 個網址均 HTTP 200。6 個資源為 5 篇特定文章及 1 個主題總覽；此為可達性檢查，不等於全文醫學內容背書。
- 11 頁有特定文章（10.9%）；2 頁僅主題總覽；88 頁完全沒有區塊內主站資源連結。全站頁首／頁尾的主站連結不算個案相關文章。
- 101 頁都有傷勢、回場摘要、背景說明及至少一項來源。10 頁 returnDate 空白，1 頁 eventDate 空白；空白均不能直接認定為錯誤。
- 287 筆來源引用中，49 筆未填 publishedAt（包含重複引用），但全部 101 筆事件都有 checkedAt，值為 2026-09-06。刊登日期缺漏不等於來源失效。

[101 頁逐頁清單](page-checklist.csv)包含現有文章網址、傷勢、事件日期、回場日期、後續摘要、背景、查核日與來源數，可直接作為下一輪補充工作表。

## 已確認的改善項目

| 優先度 | 問題與證據 | 建議處理 |
|---|---|---|
| P1 | 90/101 頁未連到特定文章：88 無連結、2 僅總覽。7 個 cases 全有文章；94 個 videos 只有 4 頁有文章、2 頁總覽、88 頁缺漏。`src/lib/videos/observation-guidance.ts:34` 僅有 6 個 slug 對應；`src/pages/videos/[slug].astro:198` 只在資源非空時顯示。 | 在一般人參考統一呈現每頁 1–3 篇相關主站文章。先依傷種建立共用候選，再以個案覆寫；有合併傷勢時分別檢查。沒有合適專文則誠實標示，保留總覽作補充但不計入專文覆蓋率。 |
| P2 | 部分事件有受傷與回場，但缺少中間治療經過。已逐筆確認例：Kobe Bryant 2013、Aaron Rodgers 2023、Beth Mead 2022 的 injury / returnSummary / context 未交代治療或復健過程。 | 優先補嚴重傷勢的「已公開治療方式、復健里程碑、再次出賽與後續限制」各一短句，附對應來源；未公開就寫未公開。不可從傷名推定手術方式。此為三頁確認例，不將關鍵字掃描結果冒充全站缺漏數。 |
| P2 | 10 頁未填回場日期，但原因不同。Hanyu、Livingston、Eaton、Andrade 已有後續賽事紀錄，仍未核實首次回場；另有退役、未核得正式復賽等狀態。 | 保留首次回場日期為空；日後可分開記錄「首次回場」「已知後續出賽」「訓練／熱身賽」「退役」。不得把已知某次賽事強填成首次回場，也不要把傷後當天繼續比賽當成康復。 |
| P2 | 49 筆來源引用缺少刊登日期；Julie Foucher 事件日期未核清。 | 分批補可查的日期與證據；資料庫型官方成績頁可維持無刊登日期並保留查核日。日期只精確到年／月時另存精度，不能編出某一天。 |

本次未確認 P0 問題；這不代表已完成所有來源的醫學正確性驗證。

## 第一批文章補連候選

以下數量已用目前事件資料與文章連結反查，屬對應候選，不是新增醫療判定：

- 阿基里斯腱斷裂 6 頁：Rodgers、Beckham、Cousins、Bryant、Koscielny、劉翔。主站已有斷裂成因與術後訓練文章，可優先補連；Julie Foucher 的斷裂程度未在本站確認，不直接併入。
- 前十字韌帶相關 19 頁：Eaton、Svindal、Mead、Brink、Dejounte Murray、Rose、Bellerin、Jamal Murray、Leonard、Thompson、Porzingis、Schwarber、Williamson、Fultz、Neymar、Andrade、Hoskins、Miedema、LaVine。可選 ACL 衛教文章；若使用重建術後評估文，需標清適用情境，不能推定每位都接受同一手術。
- 踝部骨折／合併韌帶傷 6 頁：Gomes、Posey、Hayward、Elliott、Morales、Hudson。可評估腳踝骨折文章；不能延伸套用到脛骨／腓骨骨幹骨折。
- 顏面傷害兩頁 Bassitt、Dupont 目前只有總覽。其他頭頸、腦震盪、足部等也需逐頁找確實相關文章；本次候選篇名清單不是整個個人網站的完整內容盤點，不能據此宣稱主站沒有專文。

已閱讀部分 ACL 重建、阿基里斯腱斷裂、踝骨折與慢性踝不穩文章內容核對主題。完整候選文章配對與全文適用性確認應在補連階段完成，不能僅按篇名自動上線。

## 模型建議的採納與剔除

原始輸出保留於 [Grok](out-grok.md)、[agy](out-agy.md)，以下結論優先於原始輸出。

| 模型項目 | 主 agent 結論 |
|---|---|
| Grok 1–4：總覽／缺連、6 阿基里斯、19 ACL、6 踝部骨折 | 採納覆蓋缺口，數量及每頁無文章已重算；細部診斷採現有事件原文，不擴大成全部完全斷裂。 |
| Grok 5：內外踝／高位踝、急性與慢性混用 | 採納作配對規則；不認定現有 CAI 延伸閱讀本身錯誤。CAI 可作後續不穩衛教，需避免暗示選手已有慢性不穩。 |
| Grok 6–7：髕腱斷裂不能套肌腱炎，肩盂唇不一定是 SLAP | 採納避免錯配原則；全部新增候選仍待逐篇審讀，不直接放入。 |
| Grok 8：「無對應文章」或「診斷不足就維持空」 | 不採其全站無文結論：輸入僅篩選後的篇名。不應用未確認診斷硬配疾病文，但可找合適的症狀／部位／就醫衛教，不能一律放棄連結。 |
| agy 1、3：把 Hanyu 11/28、Livingston 10/29 強填首次回場 | 剔除；目前文字已區分已知賽事與未核實首次回場。可另存已知里程碑，但不能提升證據強度。 |
| agy 2：以 Julie slug 的 2015 補 eventDate | 剔除；年份不是有效的精確事件日期，slug 不是日期證據。 |
| agy 4、5：Eaton／Andrade 需註記日期不確定 | 現文已有說明，不算新缺陷；保留為後續查證清單。 |
| agy 6：Haliburton 狀態可能需更新 | 未提供新證據，不列為已過期或錯誤；既有查核日距本次僅兩日。 |
| agy 7：Redmond 來源不足 | 一筆官方來源不自動等於不可信；如要補更完整歷程，可再找原始資料，不能憑模型推斷。 |

## 回場日期待釐清／不適用清單

| 頁面 | 目前公開說明 |
|---|---|
| [Tyrese Haliburton｜阿基里斯腱斷裂](https://injury.sportsmedicine.tw/cases/tyrese-haliburton-achilles-rupture-2025/) | 截至本次查核，未核得傷後正式復賽日期。 |
| [Adam Eaton](https://injury.sportsmedicine.tw/videos/adam-eaton-2017-knee/) | 2018-03-17 重返大聯盟春訓；此前已參加小聯盟熱身賽，最早日期未確認。 |
| [Derek Redmond](https://injury.sportsmedicine.tw/videos/derek-redmond-barcelona-1992/) | 未核得傷後第一場正式比賽的日期。 |
| [Julie Foucher](https://injury.sportsmedicine.tw/videos/julie-foucher-box-jump-2015/) | 已查到傷後參賽成績，但首次復賽日期仍未確認。 |
| [Kerri Strug](https://injury.sportsmedicine.tw/videos/kerri-strug-atlanta-1996/) | 未核得傷後首次正式復賽日期。 |
| [劉翔 Liu Xiang](https://injury.sportsmedicine.tw/videos/liu-xiang-2012-achilles/) | 此後未再參賽，2015-04-07 宣布退役。 |
| [Rebeca Andrade](https://injury.sportsmedicine.tw/videos/rebeca-andrade-2019-knee/) | 2020 年 3 月已在 Baku 世界盃資格賽回歸；精確首次出賽日期尚未確認。 |
| [Shaun Livingston](https://injury.sportsmedicine.tw/videos/shaun-livingston-knee-2007/) | 2008-10-29已有代表熱火出賽的NBA例行賽紀錄；首次回場日尚未核清。 |
| [Usain Bolt](https://injury.sportsmedicine.tw/videos/usain-bolt-london-2017/) | 這是田徑生涯最後一戰；不填田徑回場天數。 |
| [羽生結弦 Yuzuru Hanyu](https://injury.sportsmedicine.tw/videos/yuzuru-hanyu-2014-collision/) | 當天曾繼續自由滑；11 月 28 日再參加 NHK 盃。 |

## 來源抽查與限制

本次為全站完整性稽核，加重點來源抽查，未重新逐一閱讀全部 287 筆引用、逐場查核所有首次回場日期，也未測試影片播放或更動熱門統計。

- [CrossFit 官方 Julie Foucher 成績](https://games.crossfit.com/athlete/46243)：確認有 2016 Open／Regional 及 2017 Regional 團體成績，支持本站「傷後有參賽、首次日期未核清」的保守敘述；不支持從成績年份推導精確首次回場日期。
- [快艇 Livingston 傷勢公告](https://www.nba.com/clippers/news/livingston_update_070227.html)：本次抓取僅取得頁面標題，無法據此新增或重新確認診斷細節，標為未完成來源正文複核。
- [NBC Hanyu 報導](https://www.nbcsports.com/olympics/news/yuzuru-hanyu-collision-cup-of-china-injury-figure-skating)：可存取；不以此事件報導證明首次回場日期，未改動現有診斷敘述。

## 成本控制與後續順序

兩次外部模型呼叫：Grok 輸入 22,123 字元、agy 21,383 字元，未重跑；實際 token 用量未由這兩個 CLI 回報，不虛報 token。未追加第三個外部模型，也未讓兩路重複掃全 repo。量化檢查以本機腳本及 HTTP／HTML 完成。

建議先補相關文章對應與其適用標籤，再補已確認缺少治療歷程的個案，最後分批處理首次回場與來源日期。驗收時重跑 101 頁清單，分開報告「有專文」「僅總覽」「無適合專文」；首次回場仍不確定者保留空值。
