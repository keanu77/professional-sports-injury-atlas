# 120 個案多模型稽核與主 agent 複核

使用者先授權101個案，後明確同意「稽核全部120個案」。隔離副本不含 .git、環境變數、憑證或 node_modules；Codex、Grok、agy 已完成，Qwen在本機執行。input-manifest.json固定的是修正前副本；模型沒有看過本輪複核後的修改，修正由主 agent 查來源、量測與測試驗證。

| 執行器 | 實際範圍 | 限制 |
|---|---|---|
| Codex CLI (gpt-5.5) | 副本程式／資料關聯、測試、發布阻擋條件 | 唯讀，未跑build |
| Grok CLI | 全部120公開報告及研究紀錄／來源索引一致性 | 未自行開啟來源全文；每項由root另核 |
| agy CLI | 共享頁面元件與4筆代表個案（74KB注入） | 架構涵蓋120頁，不是逐頁臨床查核 |
| Qwen qwen3.8:27b-mlx | 全部120案例文字（105259輸入tokens） | 本機無外部查證；多筆模型推論經root排除 |

4個程序exit 0僅代表報告完成，不是醫學認證。未變動7個核心個案臨床簽核、病人指引或權利核准台帳；新19例均為公開報導教學觀察。既有80例未於本輪逐一重新取得全部全文或重看整片，公開整理日期已明確說明。

## Pass 2 每項裁決

| 模型／ID | 裁決 | 信心 | 核對結果 |
|---|---|---|---|
| codex / NEW-01 | fixed | 1.00 | 已完成 owned HTTPS preview 的19/19原生播放，補入release gate所需proof；Acuña初次逾時後單例重測成功，保留初測原檔。 |
| codex / NEW-02 | fixed | 1.00 | 113個觀察事件未見現存重複；新增normalized name+eventDate唯一檢查及不同videoId仍同事件的負測試。 |
| codex / EXISTING-01 | fixed | 1.00 | 實際公開artifact包含2張已排除個案封面。移至不發布的docs封存、公開provenance改120筆，artifact拒絕排除ID資產，舊精確封面網址轉向移除說明。 |
| grok / NEW-01 | wording-improved | 0.95 | 公開診斷不等於本站臨床批准，原頁已有公開報導界線；仍改成公開報導記載以減少誤讀。未新增clinicalApproval。 |
| grok / NEW-02 | rejected | 1.00 | 實際巴塞隆納頁title為348天，URL slug為248是官網差異。從11/19受傷到10/20回場為336天，原context已區分上次俱樂部出賽日期；不改正確title。 |
| grok / NEW-03 | fixed | 1.00 | 新增2024-06-17官方Game5報導至Porzingis來源5，將6/17時間軸直接綁定；日期獲全文確認。 |
| grok / NEW-04 | fixed | 1.00 | 6/27手術稿明列與先前小腿拉傷無關，機轉摘要新增來源2；原索引1、4不足以精確定位此敘述。 |
| grok / NEW-05 | documentation-synced | 1.00 | 9/7 Lions FOUR DOWNS的PASS RUSH段落明述Hutchinson回歸及場上被夾防，搭配9/2賽前稿；原研究draft尚未更新，不刪已核實的正式回場。 |
| grok / NEW-06 | fixed | 1.00 | 研究檔保留初始紀錄並同步最後全文查核證據；逐來源分個案報導、一般醫學背景、影片，未有本次全文紀錄者明列不宣称已核。 |
| grok / NEW-07 | fixed | 1.00 | Porzingis一般支持帶功能改引Iowa Orthopaedic Journal / PMC1888604；病例診斷仍引NBA公告，未推定手術術式。 |
| grok / NEW-08 | fixed | 1.00 | 小腿分類含阿基里斯腱是既有分類桶；觀察頁頁首改顯示小腿，避免Hutchinson骨折頁標題被誤認為肌腱傷。分類計數不變。 |
| grok / NEW-09 | fixed | 1.00 | 補2023-11-14 Browns第二次ACL手術原始公告及時間軸節點，與9/29第一次手術分開。 |
| grok / NEW-10 | fixed | 0.95 | Djokovic步驟收斂為比賽中膝部症狀加劇；新聞與照片不能当作完整滑步動作的觀看證據。 |
| grok / NEW-11 | fixed | 1.00 | 日期列使用同一return milestone，Porzingis顯示術後出賽。 |
| grok / OLD-01 | wording-improved | 0.95 | 3/1再傷後的3/3報導並非日期邏輯錯誤；標題改為3/3拓荒者對老鷹賽事頁以直述來源。事件日期與timeline來源不變。 |
| grok / OLD-02 | fixed | 1.00 | 2018 Porzingis錯綁暴龍系列頁，替換為NBA左膝ACL傷勢公告；event與clip兩處同步，未將URL標成不存在的MRI稿。 |
| grok / OLD-03 | fixed | 1.00 | 既有80例未於本輪重看全部影片／重讀全部全文；checkedAt公開用詞改內容整理日期並明述此界線，沒有把整理紀錄當完整近況或臨床認證。 |
| grok / OLD-04 | fixed | 1.00 | Klay回場日期正確，間隔確实跨2019 ACL和2020 Achilles；大字標籤及標題改跨兩次傷害，避免讀作單一ACL恢復時間。 |
| grok / OLD-05 | rejected | 1.00 | 8/19水手公告全文明列8/12開始Tacoma復健賽。後發新聞可記載較早歷史里程碑，保留原日期及來源。 |
| agy / NEW-A11Y-01 | partially-fixed | 1.00 | Chrome量測最小引用熱區24.42×29.25 CSS px，不是18–20×18，故不採P1尺寸結論。目標li補tabindex=-1改善鍵盤焦點。 |
| agy / NEW-IA-01 | fixed | 1.00 | 受影響是113觀察頁，非120頁。Gavi390px重點原top3025.88，機轉top632.75，確實順序不佳；重點移至機轉前並保留可讀單欄。 |
| agy / NEW-IA-02 | fixed | 1.00 | 113觀察頁均有兩來源區；URL去重後只有5頁各保留1筆不同補充來源，不刪獨有引用。 |
| agy / NEW-READ-01 | fixed | 1.00 | 無returnDate的固定回場問句改後續出賽狀況。 |
| agy / PRE-READ-01 | partially-fixed | 1.00 | 觀察頁原已max832px；7個臨床頁才可能達1232px。機轉／後續元件統一max52rem置中，沒有宣稱全部120頁原先超寬。 |
| agy / PRE-MOB-01 | fixed | 1.00 | 320px觀察頁按鈕高72、封面151.88，遮蔽47.4%；390px為37.6%。<=400px改normal-flow使按鈕不覆蓋縮圖。 |
| agy / PRE-A11Y-01 | not-reproduced | 0.40 | 12組Chrome在來源details手動關閉後按引用Enter都自動展開且target可見；不採未測的跨瀏覽器故障推論。Safari實機未測，記錄為驗證範圍限制。 |
| qwen / 1-Klay | partially-fixed | 1.00 | 不採模型誤寫2021年11月Achilles及回場日需改的推論；實際2020年11月，2022-01-09回場無誤。採納顯示跨兩次傷害間隔的可讀性修正。 |
| qwen / 2-Brignone | rejected | 1.00 | 7/29 FISI公告明確回顧4/3第一次手術；7/29是另次關節鏡鬆解，不是原文把兩次混為一談。拒絕模型要求自行新增ORIF術式。 |
| qwen / 3-Machado | rejected | 1.00 | MLB 2013-10-14原文明列MPFL重建，現有術式不是無來源推測。 |
| qwen / 4-Ronaldo | rejected | 0.30 | 模型僅猜可能有後來MRI確認MCL，未提供來源；保留未明診斷邊界，不補臆測。 |
| qwen / 5-Djokovic | wording-improved | 0.95 | 6/4是法網公布MRI結果／退賽日，文字沒有宣稱當日才做MRI；標題改公布膝傷並退出法網以更精確。 |
| qwen / withdrawn-Cousins | rejected | 0.30 | 非接觸依已引事件報導及可見畫面，原限制未把疲勞說成原因；模型自行撤回，無需改成假接觸。 |
| qwen / withdrawn-McDavid | rejected | 0.20 | 翌年報導揭露前一年PCL伤势不構成時間矛盾；模型自行撤回，不改正確歷史順序。 |

數量、熱區、行寬與遮蔽率以實際DOM/日期計算複核。低於0.70的模型推論不採為已證實缺陷。已確認的問題均已修正；最終建置／測試與正式站對照另見 validation.json、release.json。另完成3組WebKit來源鍵盤測試，全部展開／可見／取得焦點；iOS/Safari實機未測。

## 重新開啟的主要原文

- [Gavi官網標題](https://www.fcbarcelona.com/en/football/first-team/news/4152481/gavi-returns-after-248-days-out)
- [Porzingis Game5](https://www.nba.com/news/kristaps-porzingis-status-game-5-nba-finals)
- [Porzingis手術](https://www.nba.com/news/celtics-kristaps-porzingis-offseason-surgery)
- [Hutchinson賽後報導](https://www.detroitlions.com/news/four-downs-red-zone-performance-played-a-big-role-in-lions-loss-to-packers)
- [Chubb第二次手術](https://www.clevelandbrowns.com/news/browns-announce-nick-chubb-underwent-second-successful-surgery)
- [支持帶解剖背景](https://pmc.ncbi.nlm.nih.gov/articles/PMC1888604/)
- [Porzingis2018傷勢](https://www.nba.com/news/new-york-knicks-kristaps-porzingis-leaves-game-injury)
- [Haniger官方公告](https://www.mlb.com/press-release/mariners-activate-of-mitch-haniger-from-the-10-day-disabled-list-recal-249407070)
- [Machado手術原文](https://www.mlb.com/news/machado-has-surgery-could-miss-six-months/c-62949116)
- [Brignone兩次手術](https://www.fisi.org/perfettamente-riuscita-lartroscopia-a-cui-e-stata-sottoposta-federica-brignone-domani-riprendera-il-percorso-riabilitativo/)

## 最終驗證

1,482項單元測試（94檔）、Astro 0 errors/0 warnings、內容與公開artifact檢查通過。120頁×390/1280px共240組DOM檢查通過，Chrome／手機Chrome／WebKit端對端33通過，3個review-only測試在public模式跳過。19支新增影片均於owned HTTPS預覽原生播放成功。132筆原有凍結文件格式警告保留，34個此次source/test檔格式檢查通過。詳細數據與限制見validation.json。
