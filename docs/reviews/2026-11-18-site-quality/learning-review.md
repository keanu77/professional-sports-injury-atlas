# 20 份教學草稿審閱表

日期：2026-11-18（Asia/Taipei）。使用者定位：醫療教學為主、兼顧一般民眾。

**全部狀態：editorial-draft；clinicalApproval=pending。** 這次交付是依既有頁面文字準備可審閱教材，沒有宣稱重新看過 20 支影片、讀過外部原文、取得醫療審閱或完成讀者測試。七個 core 的既有核可不延伸到新增問題與答案。

資料：`src/data/video-learning.v1.json`；契約：`src/lib/videos/learning.ts`；元件：`src/components/cases/VideoLearning.astro`。

每份包含一項目標、兩個觀察／核對問題、兩題可展開的自我檢核、一個比較案例。答案依據保留原欄位全文；mechanism.summary 另保留原 sourceIndexes 及對應 URL。這是精確綁定，不是新一輪內容支持性查核。

## 顯示及修改規則

- 正式 public build 一律不回傳草稿，即使 caller 傳 `showDrafts=true`；只顯示不新增個案主張的「如何閱讀本頁」通用提問。
- review 或明確 `ATLAS_PUBLIC_PREVIEW=1` 的預覽，仍須 `showDrafts=true` 才展示草稿；畫面明示待專業審閱、待影片實看與待學習者驗收。
- `learningFor` 綁定 exact slug/videoUrl；比較案例亦綁定 URL。欄位文字或其來源 URL 改變時，`validateLearningBindings` 拒絕沿用舊草稿，需重新核對。
- schema 只接受 pending，不提供自動升級為 approved 的操作。後續公開個案教材須另設具名、明確範圍及版本的核可流程。
- 每筆最後均需人工填寫審閱者、日期、決定及理由；下表未填欄位不等於通過。

## 逐筆審閱

| 案例                                       | 學習目標                                                 | 已綁定依據欄位                                               | 比較案例                                  | 待審                                                 | 審閱者／日期／決定  |
| ------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------- | ---------------------------------------------------- | ------------------- |
| `tyrese-haliburton-achilles-rupture-2025`  | 區分短片可提供的資訊、正式回場與後續另一部位的傷害。     | `mechanism.summary`、`mechanism.limitation`、`returnSummary` | `kevin-durant-achilles-rupture-2019`      | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `jayson-tatum-achilles-rupture-2025`       | 辨識第三方專業分析的來源與推論範圍。                     | `mechanism.summary`、`mechanism.limitation`                  | `tyrese-haliburton-achilles-rupture-2025` | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `lamelo-ball-ankle-sprain-2025`            | 將本次左踝事件與其他年份傷害分開閱讀。                   | `mechanism.summary`、`mechanism.limitation`                  | `lamelo-ball-ankle-sprain-2023`           | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `lamelo-ball-ankle-sprain-2023`            | 辨識初始報導、後續檢查更新與其他年份資料的邊界。         | `mechanism.summary`、`mechanism.limitation`                  | `lamelo-ball-ankle-sprain-2025`           | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `anfernee-simons-ankle-sprain-2023`        | 區分可見的事件過程與需要醫療來源的組織診斷。             | `mechanism.summary`、`mechanism.limitation`                  | `kyrie-irving-ankle-sprain-2021`          | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `kyrie-irving-ankle-sprain-2021`           | 在影片標題與資料不一致時，以具體事件及來源核對。         | `mechanism.summary`、`mechanism.limitation`                  | `anfernee-simons-ankle-sprain-2023`       | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `kevin-durant-achilles-rupture-2019`       | 避免將既往不適、受傷動作與因果關係混在一起。             | `mechanism.summary`、`mechanism.limitation`                  | `jayson-tatum-achilles-rupture-2025`      | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `juju-watkins-2025-knee`                   | 分清具名報導、學校公告與已完成的出賽紀錄。               | `mechanism.summary`、`mechanism.limitation`、`returnSummary` | `ronald-acuna-acl-2024`                   | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `drew-brees-2020-rib`                      | 辨識不同賽事的傷害及教育性解說的適用範圍。               | `mechanism.summary`、`mechanism.limitation`、`returnSummary` | `aaron-judge-2026-rib`                    | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `chloe-kim-2026-shoulder`                  | 保留不同日期的精確度，避免捏造受傷到回場的日數。         | `mechanism.summary`、`mechanism.limitation`、`returnSummary` | `shohei-ohtani-world-series-2024`         | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `gabriel-medina-2025-pectoral-tendon`      | 區分本人訪談能提供的敘述、傷害分級與出賽日期精度。       | `mechanism.summary`、`mechanism.limitation`、`returnSummary` | `chloe-kim-2026-shoulder`                 | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `federica-brignone-leg-2025`               | 將競賽成績與不同時間點的後續醫療資訊分開。               | `mechanism.summary`、`mechanism.limitation`、`returnSummary` | `tony-hawk-2022-femur`                    | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `zoey-clark-2023-disc-nerve`               | 區分本人敘述、未取得的檢查報告及神經分類限制。           | `mechanism.summary`、`mechanism.limitation`、`returnSummary` | `sally-fitzgibbons-2015-eardrum`          | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `tiger-woods-2008-tibial-stress-fractures` | 理解比賽片段無法直接顯示疲勞性傷害形成的時間。           | `mechanism.summary`、`mechanism.limitation`                  | `aaron-judge-2026-rib`                    | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `sally-fitzgibbons-2015-eardrum`           | 避免由包紮與續賽經驗補出未公開診斷或一般建議。           | `mechanism.summary`、`mechanism.limitation`                  | `zoey-clark-2023-disc-nerve`              | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `nikola-karabatic-2020-acl`                | 辨識復健片型的學習範圍，避免回推受傷機轉或直接套用訓練。 | `mechanism.summary`、`mechanism.limitation`                  | `juju-watkins-2025-knee`                  | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `tony-hawk-2022-femur`                     | 從對談整理已提供的資訊，保留側別及骨折型態未知。         | `mechanism.summary`、`mechanism.limitation`                  | `federica-brignone-leg-2025`              | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `ronald-acuna-acl-2024`                    | 以事件日期及左右側維持多次受傷的正確對應。               | `mechanism.summary`、`mechanism.limitation`                  | `juju-watkins-2025-knee`                  | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `shohei-ohtani-world-series-2024`          | 分開看待帶傷打擊、季後肩部手術及另一側投球恢復。         | `mechanism.summary`、`mechanism.limitation`                  | `chloe-kim-2026-shoulder`                 | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |
| `aaron-judge-2026-rib`                     | 核對影音年份與本人回溯說法，避免把背景畫面當成新傷。     | `mechanism.summary`、`mechanism.limitation`、`returnSummary` | `drew-brees-2020-rib`                     | 來源語意、問答準確性、片型與可見範圍、比較案例適切性 | 未填／未填／pending |

## 每筆人工驗收

1. 逐題對照來源原文，確認答案與限制沒有擴張既有敘述、因果或側別。
2. 實看對應影片與教學段落，確認觀察問題可執行；無法看清或只有訪談時，不補寫視覺事實。
3. 核對同一選手的事件年份、側別、受傷／公告／出賽日期精度與後續新傷。
4. 評估比較問題是否聚焦資料判讀，避免把不同部位或不同傷害當成同一診斷。
5. 以目標讀者試做問題，檢查能否說出可見、報導、推論與未知；不以新增題數當成學習成效。
6. 核可時記錄 exact 版本與範圍。未核可內容繼續只在預覽顯示，不靠修改字串狀態取得公開資格。

## 自動驗證範圍

`tests/unit/video-learning.test.ts` 驗證數量與唯一性、20筆比較對應、雙重預覽限制、資料來源文字／URL漂移、缺少答案依據、假核可與錯誤影片綁定。此測試不證明醫學內容正確、影片實播成功或教學效果。
