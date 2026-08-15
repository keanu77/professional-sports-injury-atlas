# Decision 18 Phase 4 — 腳踝扭傷窮盡式後續消息查核

日期：2026-08-15

狀態：腳踝批次研究完成；48/48 audit units 達到連續兩輪零新增停止條件；所有後續消息均為 `pending-owner-signoff`

## 權限、執行環境與邊界

- 執行 Node.js `v24.14.0`；研究 cutoff/access date 為 `2026-08-15`。
- 綁定起點 commit `a41ec03`，並以前置 ACL receipt 為本批次 lineage；P0 baseline SHA-256 為 `fa541c8a2c1fd476e41f0820fc40440f6d16fb2b1990cd14dc25053fef32c992`。
- Decision 18 plan / authorization bytes 維持 SHA-256 `e088f891838fdb9e05e554309af35f50ae9ab4b9b4b9db357918f8db6b818c04` / `f618de27bc7e556072371bab8f2ec3eadef88f829af7e1349c997060201ac452`。
- 本批次只包含 12 個腳踝扭傷案例、其 v2 研究 ledger、實際有 byte 變化的 7 個 sidecar、研究證據、此報告與 receipt；ACL completed paths 維持其 receipt 綁定 bytes，沒有 Achilles 輸出。
- `hosting-service-mutation` 關閉；本批次不執行 `private:manifest`、`private:verify`、`launchctl` 或 served smoke，不修改 repository `dist`、private manifest、served receipt，也不重載私有服務。

## 批次總覽

- 基準 12 條，查核後 22 條，淨新增 10、修正 0；沒有 blocked-invalid 內容進入合格集合。
- 最終 kind 分布：`treatment=11`、`surgery=0`、`injection=0`、`actual-return=11`。
- 最終 tier 分布：`team-or-league-official=16`、`mainstream-media-report=6`、`unverified-report=0`。
- 124 個 rounds、312 個 governed queries、23 個 candidates、10 個 `qualifiedFactDeltas[]`。Query result codes 為 `no-candidate=291`、`rejected-with-reason=1`、`retained-existing=12`、`retained-new=8`；LaMelo Ball 2023 與 2025 的各一個 retained-new query 分別直接支撐兩個原子事實，因此 retained-new query 數與新增 item 數不同。
- Source-channel query 分布：`team-official-site-newsroom=57`、`nba-official-news-announcements=53`、`nba-official-injury-reports=50`、`nba-official-game-participation=51`、`press-conference-formal-statement=49`、`named-mainstream-original-page=52`。
- 288 個 exact scaffold queries 全數實際執行，另有 24 個完整案例脈絡的 governed supplemental queries。每個 audit unit 都覆蓋 6/6 必要來源管道、4 個必要時間點及該類完整同義詞族；任何 discovery-only 短查詢都不計入 coverage 或停止條件。
- 搜尋結果與摘要只用於定位；所有 retained 或 revalidated facts 都開啟原始頁，`searchSnippetUsedAsEvidence=false`。

## 逐案條目、來源與空白分布

欄位順序：kind 為 `treatment / surgery / injection / actual-return`；tier 為 `team-or-league-official / mainstream-media-report / unverified-report`。

| 案例 slug                           | 條目數（前 → 後） | kind（前 → 後）       | 最終 tier | `actual-return` | 仍空類別                            |
| ----------------------------------- | ----------------: | --------------------- | --------- | --------------: | ----------------------------------- |
| `anfernee-simons-ankle-sprain-2023` |             0 → 1 | 0→0 / 0→0 / 0→0 / 0→1 | 1 / 0 / 0 |               1 | treatment / surgery / injection     |
| `anthony-edwards-ankle-sprain-2023` |             1 → 2 | 1→1 / 0→0 / 0→0 / 0→1 | 1 / 1 / 0 |               1 | surgery / injection                 |
| `anthony-edwards-ankle-sprain-2025` |             1 → 1 | 0→0 / 0→0 / 0→0 / 1→1 | 1 / 0 / 0 |               1 | treatment / surgery / injection     |
| `cj-mccollum-ankle-sprain-2020`     |             0 → 1 | 0→0 / 0→0 / 0→0 / 0→1 | 1 / 0 / 0 |               1 | treatment / surgery / injection     |
| `ja-morant-ankle-sprain-2020`       |             2 → 2 | 1→1 / 0→0 / 0→0 / 1→1 | 1 / 1 / 0 |               1 | surgery / injection                 |
| `kevin-durant-ankle-sprain-2024`    |             1 → 2 | 0→1 / 0→0 / 0→0 / 1→1 | 1 / 1 / 0 |               1 | surgery / injection                 |
| `kyrie-irving-ankle-sprain-2021`    |             1 → 2 | 1→2 / 0→0 / 0→0 / 0→0 | 2 / 0 / 0 |               0 | surgery / injection / actual-return |
| `lamelo-ball-ankle-sprain-2022`     |             1 → 1 | 0→0 / 0→0 / 0→0 / 1→1 | 1 / 0 / 0 |               1 | treatment / surgery / injection     |
| `lamelo-ball-ankle-sprain-2023`     |             0 → 3 | 0→2 / 0→0 / 0→0 / 0→1 | 1 / 2 / 0 |               1 | surgery / injection                 |
| `lamelo-ball-ankle-sprain-2025`     |             1 → 3 | 0→2 / 0→0 / 0→0 / 1→1 | 3 / 0 / 0 |               1 | surgery / injection                 |
| `lebron-james-ankle-sprain-2021`    |             2 → 2 | 1→1 / 0→0 / 0→0 / 1→1 | 2 / 0 / 0 |               1 | surgery / injection                 |
| `trae-young-ankle-sprain-2021`      |             2 → 2 | 1→1 / 0→0 / 0→0 / 1→1 | 1 / 1 / 0 |               1 | surgery / injection                 |

11 條 `actual-return` 全由球隊或聯盟官方、已發生且不晚於 cutoff 的參賽紀錄支撐；主流媒體或 `unverified-report` 支撐數為 0。`kyrie-irving-ankle-sprain-2021` 的 `actual-return` 保持空白，因查核邊界內沒有把已發生官方參賽紀錄直接連回本次腳踝事件的合格原始頁。

## 48 個 audit units、輪次與停止證明

「終止輪」欄列出首次滿足 complete coverage 後、最後兩個不同角度且連續零 `qualifiedFactDeltas[]` 的 round numbers；若較早 round 有 delta，計數已於新增後重置。每個 unit 的 channel coverage 都是 6/6。

| 案例 slug                           | 類別            | 條目（前 → 後） | rounds | queries | channels | 終止輪  | added | corrected |
| ----------------------------------- | --------------- | --------------: | -----: | ------: | -------: | ------- | ----: | --------: |
| `anfernee-simons-ankle-sprain-2023` | `treatment`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `anfernee-simons-ankle-sprain-2023` | `surgery`       |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `anfernee-simons-ankle-sprain-2023` | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `anfernee-simons-ankle-sprain-2023` | `actual-return` |           0 → 1 |      4 |       9 |      6/6 | R3 / R4 |     1 |         0 |
| `anthony-edwards-ankle-sprain-2023` | `treatment`     |           1 → 1 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `anthony-edwards-ankle-sprain-2023` | `surgery`       |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `anthony-edwards-ankle-sprain-2023` | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `anthony-edwards-ankle-sprain-2023` | `actual-return` |           0 → 1 |      4 |       9 |      6/6 | R3 / R4 |     1 |         0 |
| `anthony-edwards-ankle-sprain-2025` | `treatment`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `anthony-edwards-ankle-sprain-2025` | `surgery`       |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `anthony-edwards-ankle-sprain-2025` | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `anthony-edwards-ankle-sprain-2025` | `actual-return` |           1 → 1 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `cj-mccollum-ankle-sprain-2020`     | `treatment`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `cj-mccollum-ankle-sprain-2020`     | `surgery`       |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `cj-mccollum-ankle-sprain-2020`     | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `cj-mccollum-ankle-sprain-2020`     | `actual-return` |           0 → 1 |      4 |       8 |      6/6 | R3 / R4 |     1 |         0 |
| `ja-morant-ankle-sprain-2020`       | `treatment`     |           1 → 1 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `ja-morant-ankle-sprain-2020`       | `surgery`       |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `ja-morant-ankle-sprain-2020`       | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `ja-morant-ankle-sprain-2020`       | `actual-return` |           1 → 1 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `kevin-durant-ankle-sprain-2024`    | `treatment`     |           0 → 1 |      4 |      11 |      6/6 | R3 / R4 |     1 |         0 |
| `kevin-durant-ankle-sprain-2024`    | `surgery`       |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `kevin-durant-ankle-sprain-2024`    | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `kevin-durant-ankle-sprain-2024`    | `actual-return` |           1 → 1 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `kyrie-irving-ankle-sprain-2021`    | `treatment`     |           1 → 2 |      3 |       8 |      6/6 | R2 / R3 |     1 |         0 |
| `kyrie-irving-ankle-sprain-2021`    | `surgery`       |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `kyrie-irving-ankle-sprain-2021`    | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `kyrie-irving-ankle-sprain-2021`    | `actual-return` |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `lamelo-ball-ankle-sprain-2022`     | `treatment`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `lamelo-ball-ankle-sprain-2022`     | `surgery`       |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `lamelo-ball-ankle-sprain-2022`     | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `lamelo-ball-ankle-sprain-2022`     | `actual-return` |           1 → 1 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `lamelo-ball-ankle-sprain-2023`     | `treatment`     |           0 → 2 |      4 |       9 |      6/6 | R3 / R4 |     2 |         0 |
| `lamelo-ball-ankle-sprain-2023`     | `surgery`       |           0 → 0 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `lamelo-ball-ankle-sprain-2023`     | `injection`     |           0 → 0 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `lamelo-ball-ankle-sprain-2023`     | `actual-return` |           0 → 1 |      4 |       9 |      6/6 | R3 / R4 |     1 |         0 |
| `lamelo-ball-ankle-sprain-2025`     | `treatment`     |           0 → 2 |      4 |       9 |      6/6 | R3 / R4 |     2 |         0 |
| `lamelo-ball-ankle-sprain-2025`     | `surgery`       |           0 → 0 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `lamelo-ball-ankle-sprain-2025`     | `injection`     |           0 → 0 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `lamelo-ball-ankle-sprain-2025`     | `actual-return` |           1 → 1 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `lebron-james-ankle-sprain-2021`    | `treatment`     |           1 → 1 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `lebron-james-ankle-sprain-2021`    | `surgery`       |           0 → 0 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `lebron-james-ankle-sprain-2021`    | `injection`     |           0 → 0 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `lebron-james-ankle-sprain-2021`    | `actual-return` |           1 → 1 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `trae-young-ankle-sprain-2021`      | `treatment`     |           1 → 1 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `trae-young-ankle-sprain-2021`      | `surgery`       |           0 → 0 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `trae-young-ankle-sprain-2021`      | `injection`     |           0 → 0 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `trae-young-ankle-sprain-2021`      | `actual-return` |           1 → 1 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |

## 保留、拒絕與空白邊界

- `anfernee-simons-ankle-sprain-2023`、`anthony-edwards-ankle-sprain-2023` 與 `cj-mccollum-ankle-sprain-2020` 各新增一筆 NBA 官方 scorer report 所證明的已發生參賽；只陳述日期、上場時間與得分，不推論復健時長、預後或可套用的回場日。
- `kevin-durant-ankle-sprain-2024` 新增 2024-12-11 參與約 90% 球隊訓練的具名主流媒體事實；預計出賽、可能的 minutes monitoring 與預後均未保留。
- `kyrie-irving-ankle-sprain-2021` 新增 NBA.com 原始頁明載的保護靴與拐杖使用；未推論嚴重度、使用原因、療效或時長。沒有合格、事件相連的官方已發生回場來源，所以回場仍空白。
- `lamelo-ball-ankle-sprain-2023` 新增 Charlotte Observer 原始頁所載的每日治療、活動與冰敷、開始個人活動，以及 NBA 官方實際回場；未從脫離護具推論 clearance 或完整復健方案。
- `lamelo-ball-ankle-sprain-2025` 新增 Hornets PR 原始聲明所載的持續治療與進展至場上活動；2025-03-28 的右腳踝 impingement 手術因側別、診斷與事件皆不相同，以唯一一個 `rejected-with-reason` candidate 排除，沒有進入 sidecar。
- Anthony Edwards 2025、Ja Morant、LaMelo Ball 2022、LeBron James 與 Trae Young 沒有新增；其 Decision 17 原始頁都已重開，重複命題、預測、不同事件與非介入狀態均未另立 item。
- 12/12 腳踝案例的 `surgery` 與 `injection` 均保持空白。各 ledger 都實際查過完整 surgery 與 `injection / shot / PRP / platelet-rich plasma / cortisone / corticosteroid / needling` 角度，最後兩輪沒有合格事實，也沒有 material unresolved access failure。
- 共 29 個空 audit units；每一個都有 ledger 內的 `emptyResultReason`、round boundary 與逐 query 結果。空白只描述本次查核邊界，不代表事件必然沒有發生，也不用典型療程、搜尋摘要或其他案例填補。

## 來源、呈現與待簽核狀態

- 22/22 items 各自攜帶 URL、標題、發布者／帳號、發布日期、access date、tier 與 tier basis。三級來源標籤保持可見；本批次沒有 `unverified-report`，也沒有把任何來源視覺升級。
- 區塊聲明維持「以下內容是第三方報導的整理，不是本站醫師的診斷、評估或建議。」；所有既有及新增 items 都維持 `pending-owner-signoff`，沒有 owner 或醫師 approval。
- nba.com 與其官方 scorer-report citations 維持不可點擊的 literal text；不得形成 anchor、JSON-LD、inline script 或其他 navigation sink。非 NBA HTTPS citation 才可連到已開啟的原始頁。
- 30/30 clinical freeze 與 21 張封面都不變；Decision 17 歷史 ledgers、v10 source policy、既有 approved clinical-core lineage、ACL completed receipt bytes 及 review-set v1/v2 都不變。

## 提交前驗證狀態

- 腳踝 canonical generator `--check`：12 ledgers、48/48 terminal units、0 issues、0 byte drift；12 個 sidecar 中 7 個有 byte 變化。
- 第一次整批 canonical validation 為 47/48：CJ McCollum 的新增回場 change 把 plan slot 誤寫在 `queryId`，因此 delta 找不到原始頁 candidate。修成 `planSlotId` 後完整重跑為 48/48、0 issues；這個失敗沒有被略過或降級。
- `npx tsc --noEmit`：exit 0；Astro diagnostics：280 files、0 errors、0 warnings、16 hints。
- Decision 18 protected-boundary contract：7/7；`source-policy:v10:check`、clinical freeze 30/30、photo registry v8 與 brand verify 均通過。
- 研究測試先因 fixture 讀取已前進的 live ankle sidecar 而為 92/94；將 fixture 改為從 Decision 17 facts 重建其歷史 sidecar 並以獨立測試 commit `34f07b8` 固定後，為 93/94。剩餘一項是 receipt 尚未進入 Git history時的預期 fail-closed：transitional loader 仍依 ACL-only committed chain 讀 Decision 17，因此不接受 10 個未有 receipt 的新增 evidence IDs；receipt 提交後必須重跑並以 post-commit 結果為準。
- 兩個不適用的命令曾被直接呼叫並如設計失敗：`decision18:baseline:check` 是 44-item P0 快照產生器，不是批次後驗證器，會拒絕目前已授權前進的 74-item live sidecar corpus；`decision18:professional-safety` 缺少 Phase 6 的 temporary review-build `--root` 時會拒絕執行。Phase 4 以 protected-boundary contract 驗證凍結，完整 professional DOM safety 留待 Phase 6 的 `mktemp -d` build。
- 本報告只記錄腳踝 batch 的研究與提交前檢查。完整 unit、coverage、Playwright、review build、BY-SA、DOM/NBA sink 與其他 Phase 6 驗收數字將在三批全部完成後的最終報告列出。
