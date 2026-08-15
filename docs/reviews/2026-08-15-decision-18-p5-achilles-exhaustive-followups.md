# Decision 18 Phase 5 — 阿基里斯腱斷裂窮盡式後續消息查核

日期：2026-08-15

狀態：阿基里斯批次研究完成；28/28 audit units 達到連續兩輪零新增停止條件；所有後續消息均為 `pending-owner-signoff`

## 權限、執行環境與邊界

- 執行 Node.js `v24.14.0`；研究 cutoff/access date 為 `2026-08-15`。
- 綁定起點 commit `a41ec03`；P0 baseline SHA-256 為 `fa541c8a2c1fd476e41f0820fc40440f6d16fb2b1990cd14dc25053fef32c992`。
- Decision 18 plan / authorization bytes 維持 SHA-256 `e088f891838fdb9e05e554309af35f50ae9ab4b9b4b9db357918f8db6b818c04` / `f618de27bc7e556072371bab8f2ec3eadef88f829af7e1349c997060201ac452`。
- 本批次只包含 7 個阿基里斯腱斷裂案例、其 v2 research ledger、sidecar、研究證據、此報告與 receipt。ACL 與腳踝 completed paths 仍由既有 receipt 綁定，未被改動。
- `hosting-service-mutation` 關閉；本批次未執行 `private:manifest`、`private:verify`、`launchctl` 或 served smoke，未修改 repository `dist`、private manifest、served receipt，也未重載私有服務。

## 批次總覽

- 基準 16 條，查核後 90 條，淨新增 74、修正 0；沒有 blocked-invalid 內容進入合格集合。
- 最終 kind 分布：`treatment=66`、`surgery=17`、`injection=0`、`actual-return=7`。
- 最終 tier 分布：`team-or-league-official=29`、`mainstream-media-report=60`、`unverified-report=1`。唯一 `unverified-report` 保持原級、畫面可辨識且 `pending-owner-signoff`，沒有視覺升級。
- 98 個 rounds、251 個 governed queries、92 個 candidates、74 個 `qualifiedFactDeltas[]`。Query result codes：`no-candidate=190`、`rejected-with-reason=2`、`retained-existing=16`、`retained-new=43`；一個 retained-new query 可支撐同頁內多個各自具來源的原子事實，因此 query 數小於新增 item 數。
- Source-channel query 分布：`team-official-site-newsroom=54`、`nba-official-news-announcements=33`、`nba-official-injury-reports=32`、`nba-official-game-participation=32`、`press-conference-formal-statement=37`、`named-mainstream-original-page=63`。
- 168 個 exact scaffold queries 全數執行，另有 83 個完整案例脈絡的 governed supplemental queries。每個 audit unit 都覆蓋 6/6 必要來源管道、4 個必要時間點及該類完整同義詞族。
- 搜尋摘要只用於定位；所有 retained 或 revalidated facts 都開啟原始頁，`searchSnippetUsedAsEvidence=false`。

## 逐案條目、來源與空白分布

欄位順序：kind 為 `treatment / surgery / injection / actual-return`；tier 為 `team-or-league-official / mainstream-media-report / unverified-report`。

| 案例 slug                                 | 條目數（前 → 後） | kind（前 → 後）        | 最終 tier   | `actual-return` | 仍空類別                  |
| ----------------------------------------- | ----------------: | ---------------------- | ----------- | --------------: | ------------------------- |
| `brandon-clarke-achilles-rupture-2023`    |             3 → 4 | 1→1 / 1→2 / 0→0 / 1→1  | 1 / 2 / 1   |               1 | injection                 |
| `damian-lillard-achilles-rupture-2025`    |             1 → 5 | 0→1 / 1→3 / 0→0 / 0→1  | 4 / 1 / 0   |               1 | injection                 |
| `dejounte-murray-achilles-rupture-2025`   |             2 → 6 | 1→4 / 0→1 / 0→0 / 1→1  | 1 / 5 / 0   |               1 | injection                 |
| `dwight-powell-achilles-rupture-2020`     |            2 → 28 | 1→23 / 1→4 / 0→0 / 0→1 | 9 / 19 / 0  |               1 | injection                 |
| `jayson-tatum-achilles-rupture-2025`      |            3 → 34 | 1→30 / 1→3 / 0→0 / 1→1 | 10 / 24 / 0 |               1 | injection                 |
| `kevin-durant-achilles-rupture-2019`      |             3 → 8 | 1→4 / 1→2 / 0→0 / 1→2  | 4 / 4 / 0   |               2 | injection                 |
| `tyrese-haliburton-achilles-rupture-2025` |             2 → 5 | 1→3 / 1→2 / 0→0 / 0→0  | 0 / 5 / 0   |               0 | injection / actual-return |

7 條 `actual-return` 全由球隊或聯盟官方、已發生且不晚於 cutoff 的參賽紀錄支撐；主流媒體或 `unverified-report` 支撐數為 0。Tyrese Haliburton 的回場類別保持空白：查核截止日前沒有合格的已發生官方參賽紀錄，預測、復健動作與 clearance 都未被替代使用。

## 28 個 audit units、輪次與停止證明

「終止輪」是 complete coverage 後、最新 delta 之後首次出現的兩個不同角度、連續零 `qualifiedFactDeltas[]` rounds。每個 unit 的 channel coverage 都是 6/6。

| 案例 slug                                 | 類別            | 條目（前 → 後） | rounds | queries | channels | 終止輪   | added | corrected |
| ----------------------------------------- | --------------- | --------------: | -----: | ------: | -------: | -------- | ----: | --------: |
| `brandon-clarke-achilles-rupture-2023`    | `treatment`     |           1 → 1 |      2 |       6 |      6/6 | R1 / R2  |     0 |         0 |
| `brandon-clarke-achilles-rupture-2023`    | `surgery`       |           1 → 2 |      4 |       9 |      6/6 | R3 / R4  |     1 |         0 |
| `brandon-clarke-achilles-rupture-2023`    | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2  |     0 |         0 |
| `brandon-clarke-achilles-rupture-2023`    | `actual-return` |           1 → 1 |      2 |       6 |      6/6 | R1 / R2  |     0 |         0 |
| `damian-lillard-achilles-rupture-2025`    | `treatment`     |           0 → 1 |      4 |       9 |      6/6 | R3 / R4  |     1 |         0 |
| `damian-lillard-achilles-rupture-2025`    | `surgery`       |           1 → 3 |      3 |       9 |      6/6 | R2 / R3  |     2 |         0 |
| `damian-lillard-achilles-rupture-2025`    | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2  |     0 |         0 |
| `damian-lillard-achilles-rupture-2025`    | `actual-return` |           0 → 1 |      4 |       9 |      6/6 | R3 / R4  |     1 |         0 |
| `dejounte-murray-achilles-rupture-2025`   | `treatment`     |           1 → 4 |      4 |      11 |      6/6 | R3 / R4  |     3 |         0 |
| `dejounte-murray-achilles-rupture-2025`   | `surgery`       |           0 → 1 |      4 |       9 |      6/6 | R3 / R4  |     1 |         0 |
| `dejounte-murray-achilles-rupture-2025`   | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2  |     0 |         0 |
| `dejounte-murray-achilles-rupture-2025`   | `actual-return` |           1 → 1 |      2 |       6 |      6/6 | R1 / R2  |     0 |         0 |
| `dwight-powell-achilles-rupture-2020`     | `treatment`     |          1 → 23 |      6 |      18 |      6/6 | R5 / R6  |    22 |         0 |
| `dwight-powell-achilles-rupture-2020`     | `surgery`       |           1 → 4 |      5 |      11 |      6/6 | R4 / R5  |     3 |         0 |
| `dwight-powell-achilles-rupture-2020`     | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2  |     0 |         0 |
| `dwight-powell-achilles-rupture-2020`     | `actual-return` |           0 → 1 |      4 |      10 |      6/6 | R3 / R4  |     1 |         0 |
| `jayson-tatum-achilles-rupture-2025`      | `treatment`     |          1 → 30 |     10 |      31 |      6/6 | R9 / R10 |    29 |         0 |
| `jayson-tatum-achilles-rupture-2025`      | `surgery`       |           1 → 3 |      6 |      12 |      6/6 | R5 / R6  |     2 |         0 |
| `jayson-tatum-achilles-rupture-2025`      | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2  |     0 |         0 |
| `jayson-tatum-achilles-rupture-2025`      | `actual-return` |           1 → 1 |      2 |       6 |      6/6 | R1 / R2  |     0 |         0 |
| `kevin-durant-achilles-rupture-2019`      | `treatment`     |           1 → 4 |      4 |       8 |      6/6 | R3 / R4  |     3 |         0 |
| `kevin-durant-achilles-rupture-2019`      | `surgery`       |           1 → 2 |      4 |       8 |      6/6 | R3 / R4  |     1 |         0 |
| `kevin-durant-achilles-rupture-2019`      | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2  |     0 |         0 |
| `kevin-durant-achilles-rupture-2019`      | `actual-return` |           1 → 2 |      4 |       8 |      6/6 | R3 / R4  |     1 |         0 |
| `tyrese-haliburton-achilles-rupture-2025` | `treatment`     |           1 → 3 |      5 |       9 |      6/6 | R4 / R5  |     2 |         0 |
| `tyrese-haliburton-achilles-rupture-2025` | `surgery`       |           1 → 2 |      3 |       8 |      6/6 | R2 / R3  |     1 |         0 |
| `tyrese-haliburton-achilles-rupture-2025` | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2  |     0 |         0 |
| `tyrese-haliburton-achilles-rupture-2025` | `actual-return` |           0 → 0 |      2 |       6 |      6/6 | R1 / R2  |     0 |         0 |

## 保留、拒絕與空白邊界

- Brandon Clarke 新增一筆明確標示 `unverified-report` 的具名執刀醫師報導；它沒有被升級為官方確認，仍待 owner 簽核。其實際回場仍只由官方參賽紀錄支撐。
- Damian Lillard 新增已明載的治療、兩筆手術細節與官方已發生回場；未把預測、一般術式資料或復健時程推論成個案事實。
- Dejounte Murray 新增三筆具體復健行動及一筆手術事實；既有實際回場由官方來源維持，沒有從訓練或 clearance 另造回場。
- Dwight Powell 的深查把原本合併的一筆居家復健拆成逐動作原子事實，並加入官方 PARS Technique、約 30 分鐘手術、早期固定／重量室、居家器材、跑跳、投籃、移動與 live-work 進展。Peter Patton 的泛稱場上工作只作較具體早晚投籃的佐證；低強度 live work、模擬 pickup 與「若可上場」假設都不算 actual-return。
- Jayson Tatum 的相對星期沒有轉成日期；SpeedBridge 推測、一般第二人稱復健說明、未來 conditioning、預後與回場預測均排除。Maine／Boston 練習、五對五與場上 drills 都只列 treatment；actual-return 仍只使用 2026-03-06 官方已發生參賽。
- Kevin Durant 的每類別查核已從 Decision 17 單次深度擴成完整多輪：新增具體治療、手術及官方季前賽參賽；沒有從復健片段推論療程或預後。
- Tyrese Haliburton 新增具名主流媒體明載的治療與手術事實；injection 與 actual-return 保持空白。未到截止日的預測或尚未發生的回歸不保留。
- 7/7 案例的 injection 均保持空白；Tyrese Haliburton 的 actual-return 亦空白，共 8 個空 audit units。每個空單元都有 `emptyResultReason`、完整 query boundary 與連續兩輪零新增證明；空白只描述查核邊界。

## 來源、呈現與待簽核狀態

- 90/90 items 各自攜帶 URL、標題、發布者／帳號、發布日期、access date、tier 與 tier basis。三級來源標籤保持可見，`unverified-report` 不得視覺上升級。
- 區塊聲明維持「以下內容是第三方報導的整理，不是本站醫師的診斷、評估或建議。」；既有與新增 items 全部維持 `pending-owner-signoff`，沒有 owner 或醫師 approval。
- nba.com 與其官方 scorer-report citations 維持不可點擊 literal text；沒有 anchor、JSON-LD、inline script 或其他 navigation sink。非 NBA HTTPS citation 才可連到已開啟原始頁。
- 30/30 clinical freeze 與 21 張封面不變；Decision 17 歷史 ledgers、v10 source policy、既有 approved clinical-core lineage、ACL／腳踝 completed receipt bytes 及 review-set v1/v2 都不變。

## 提交前驗證狀態

- `decision18:batch:resume`：7 partial records、28/28 terminal units、0 incomplete findings、0 issues。
- `decision18:batch:cases -- --batch achilles --check`：7 ledgers、0 issues、0 byte drift；7 個 sidecar 均有新增內容。
- 深查後第一輪 resume 曾如實失敗：新增 query metadata 有未排序 term sets、重複 canonical angles、缺少 context term，以及舊 terminal pair 後續輪等 69 個 issue。逐項修正並重跑後為 28/28、0 issue；沒有忽略或降級驗證。
- receipt 指令第一次因漏給必要的 `--generated-at` 參數而以 usage error 結束；這不是內容驗證通過。補上參數後才可產生並檢查正式 receipt。
- 初版 receipt 產生後，提交前唯讀交叉檢查發現兩份 notes 將 v1 research record 的 `qualifiedFactChanges[]` 誤寫成 `qualifiedFactDeltas[]`，且 Tatum 一筆來源署名省略職稱；修正 notes 後直接覆寫 receipt 的嘗試依 fail-closed 規則失敗。舊的未提交 receipt 隨後刪除並以相同產生器重新建立，沒有繞過檢查或手改 receipt。
- 本報告記錄阿基里斯 batch 的研究與提交前檢查。完整 unit、coverage、Playwright、temporary review build、BY-SA、DOM/NBA sink 與其他 Phase 6 驗收數字將在三批都已提交後的最終報告列出。
