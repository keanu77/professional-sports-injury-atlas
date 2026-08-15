# Decision 18 Phase 3 — ACL 窮盡式後續消息查核

日期：2026-08-15

狀態：ACL 批次研究完成；28/28 audit units 達到連續兩輪零新增停止條件；所有後續消息均為 `pending-owner-signoff`

## 權限、執行環境與邊界

- 執行 Node.js `v24.14.0`；研究 cutoff/access date 為 `2026-08-15`。
- 綁定起點 commit `a41ec03`，並以 Phase 0–2 的三個既有提交作為本批次前置；P0 baseline SHA-256 為 `fa541c8a2c1fd476e41f0820fc40440f6d16fb2b1990cd14dc25053fef32c992`。
- Decision 18 plan / authorization bytes 維持 SHA-256 `e088f891838fdb9e05e554309af35f50ae9ab4b9b4b9db357918f8db6b818c04` / `f618de27bc7e556072371bab8f2ec3eadef88f829af7e1349c997060201ac452`。
- 本批次只包含 7 個 ACL 案例、其 v2 研究 ledger、實際有 byte 變化的 sidecar、研究證據、此報告與 receipt。沒有 ankle 或 Achilles 案例。
- `hosting-service-mutation` 關閉；本批次不執行 `private:manifest`、`private:verify`、`launchctl` 或 served smoke，不修改 repository `dist`、private manifest、served receipt，也不重載私有服務。

## 批次總覽

- 基準 16 條，查核後 36 條，淨新增 20、修正 0；沒有 blocked-invalid 內容進入合格集合。
- 最終 kind 分布：`treatment=19`、`surgery=11`、`injection=0`、`actual-return=6`。
- 最終 tier 分布：`team-or-league-official=18`、`mainstream-media-report=15`、`unverified-report=3`。
- 85 個 rounds、214 個 governed queries、43 個 candidates、20 個 `qualifiedFactDeltas[]`。Query result codes 為 `no-candidate=173`、`rejected-with-reason=7`、`retained-existing=16`、`retained-new=18`；兩個 retained-new queries 各支撐超過一個原子事實，所以 retained-new query 數與新增 item 數不同。
- Source-channel query 分布：`team-official-site-newsroom=40`、`nba-official-news-announcements=31`、`nba-official-injury-reports=32`、`nba-official-game-participation=31`、`press-conference-formal-statement=35`、`named-mainstream-original-page=45`。
- 168 個 exact scaffold queries 全數實際執行，另有 46 個完整案例脈絡的 governed supplemental queries。每個 audit unit 都覆蓋 6/6 必要來源管道、4 個必要時間點及該類完整同義詞族；任何 discovery-only 短查詢都不計入 coverage 或停止條件。
- 搜尋結果與摘要只用於定位；所有 retained 或 revalidated facts 都開啟原始頁，`searchSnippetUsedAsEvidence=false`。

## 逐案條目與來源分布

欄位順序：kind 為 `treatment / surgery / injection / actual-return`；tier 為 `team-or-league-official / mainstream-media-report / unverified-report`。

| 案例 slug                 | 條目數（前 → 後） | kind（前 → 後）       | 最終 tier | `actual-return` |
| ------------------------- | ----------------: | --------------------- | --------- | --------------: |
| `danny-green-acl-2022`    |             2 → 4 | 1→2 / 1→1 / 0→0 / 0→1 | 1 / 3 / 0 |               1 |
| `joe-ingles-acl-2022`     |             2 → 7 | 0→4 / 1→2 / 0→0 / 1→1 | 5 / 2 / 0 |               1 |
| `kyrie-irving-acl-2025`   |             2 → 7 | 1→4 / 1→3 / 0→0 / 0→0 | 4 / 2 / 1 |               0 |
| `markelle-fultz-acl-2021` |             3 → 6 | 1→3 / 1→2 / 0→0 / 1→1 | 4 / 2 / 0 |               1 |
| `moritz-wagner-acl-2024`  |             3 → 3 | 1→1 / 1→1 / 0→0 / 1→1 | 2 / 0 / 1 |               1 |
| `ricky-rubio-acl-2021`    |             3 → 6 | 1→4 / 1→1 / 0→0 / 1→1 | 1 / 4 / 1 |               1 |
| `thomas-bryant-acl-2021`  |             1 → 3 | 0→1 / 1→1 / 0→0 / 0→1 | 1 / 2 / 0 |               1 |

6 條 `actual-return` 全由球隊或聯盟官方、已發生且不晚於 cutoff 的參賽紀錄支撐；主流媒體或 `unverified-report` 支撐數為 0。`kyrie-irving-acl-2025` 的 `actual-return` 保持空白，因 cutoff 前沒有合格的已發生官方回場紀錄。

## 28 個 audit units、輪次與停止證明

「終止輪」欄列出最後兩個不同角度、連續零 `qualifiedFactDeltas[]` 的 round IDs；若較早 round 有 delta，計數已於新增後重置。每個 unit 的 channel coverage 都是 6/6。

| 案例 slug                 | 類別            | 條目（前 → 後） | rounds | queries | channels | 終止輪  | added | corrected |
| ------------------------- | --------------- | --------------: | -----: | ------: | -------: | ------- | ----: | --------: |
| `danny-green-acl-2022`    | `treatment`     |           1 → 2 |      4 |       9 |      6/6 | R3 / R4 |     1 |         0 |
| `danny-green-acl-2022`    | `surgery`       |           1 → 1 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `danny-green-acl-2022`    | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `danny-green-acl-2022`    | `actual-return` |           0 → 1 |      4 |       9 |      6/6 | R3 / R4 |     1 |         0 |
| `joe-ingles-acl-2022`     | `treatment`     |           0 → 4 |      4 |      11 |      6/6 | R3 / R4 |     4 |         0 |
| `joe-ingles-acl-2022`     | `surgery`       |           1 → 2 |      3 |       8 |      6/6 | R2 / R3 |     1 |         0 |
| `joe-ingles-acl-2022`     | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `joe-ingles-acl-2022`     | `actual-return` |           1 → 1 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `kyrie-irving-acl-2025`   | `treatment`     |           1 → 4 |      4 |      15 |      6/6 | R3 / R4 |     3 |         0 |
| `kyrie-irving-acl-2025`   | `surgery`       |           1 → 3 |      3 |       7 |      6/6 | R2 / R3 |     2 |         0 |
| `kyrie-irving-acl-2025`   | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `kyrie-irving-acl-2025`   | `actual-return` |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `markelle-fultz-acl-2021` | `treatment`     |           1 → 3 |      4 |      12 |      6/6 | R3 / R4 |     2 |         0 |
| `markelle-fultz-acl-2021` | `surgery`       |           1 → 2 |      4 |       9 |      6/6 | R3 / R4 |     1 |         0 |
| `markelle-fultz-acl-2021` | `injection`     |           0 → 0 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `markelle-fultz-acl-2021` | `actual-return` |           1 → 1 |      2 |       6 |      6/6 | R1 / R2 |     0 |         0 |
| `moritz-wagner-acl-2024`  | `treatment`     |           1 → 1 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `moritz-wagner-acl-2024`  | `surgery`       |           1 → 1 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `moritz-wagner-acl-2024`  | `injection`     |           0 → 0 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `moritz-wagner-acl-2024`  | `actual-return` |           1 → 1 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `ricky-rubio-acl-2021`    | `treatment`     |           1 → 4 |      5 |      12 |      6/6 | R4 / R5 |     3 |         0 |
| `ricky-rubio-acl-2021`    | `surgery`       |           1 → 1 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `ricky-rubio-acl-2021`    | `injection`     |           0 → 0 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `ricky-rubio-acl-2021`    | `actual-return` |           1 → 1 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `thomas-bryant-acl-2021`  | `treatment`     |           0 → 1 |      3 |      11 |      6/6 | R2 / R3 |     1 |         0 |
| `thomas-bryant-acl-2021`  | `surgery`       |           1 → 1 |      3 |       8 |      6/6 | R2 / R3 |     0 |         0 |
| `thomas-bryant-acl-2021`  | `injection`     |           0 → 0 |      3 |       6 |      6/6 | R2 / R3 |     0 |         0 |
| `thomas-bryant-acl-2021`  | `actual-return` |           0 → 1 |      4 |       7 |      6/6 | R3 / R4 |     1 |         0 |

## 保留、拒絕與空白邊界

- `danny-green-acl-2022` 新增已執行的 5 對 5 訓練及官方實際回場；未推論 clearance、復健時長、預後或回場日期。
- `joe-ingles-acl-2022` 新增具名 surgeon Brian Cole、賽前復健動作、5 對 5、G League 練習及在 Utah 安排的物理治療；只保留來源明載的已發生活動。
- `kyrie-irving-acl-2025` 新增 ACL repair 內容、Riley Williams、球場與重量訓練，以及一條維持 `unverified-report` 的非接觸訓練消息；未找到 cutoff 前合格的已發生回場。
- `markelle-fultz-acl-2021` 新增 Neal ElAttrache、上肢訓練及 Lakeland G League 練習。
- `moritz-wagner-acl-2024` 沒有新增；未執行的未來手術計畫與泛稱「恢復良好」均被拒絕。
- `ricky-rubio-acl-2021` 新增 G League scrimmage、明載的 5 對 5醫療許可（仍為 `unverified-report`）及 ESPN 明載的回場後 minutes limit；沒有把上場分鐘自行解讀成 management。
- `thomas-bryant-acl-2021` 新增術後醫師明載的 no-walk restriction 及官方實際回場；沒有把《Washington Post》列出的 11 分鐘自行推論成分段或分鐘限制，也沒有把 treating physicians William Postma、Daniel Medina 推論為 surgeon。
- 7/7 ACL 案例的 `injection` 均保持空白。各 ledger 都實際查過 `injection / shot / PRP / platelet-rich plasma / cortisone / corticosteroid / needling` 的完整角度，最後兩輪沒有合格事實，也沒有 material unresolved access failure。
- 其他唯一空類別是 `kyrie-irving-acl-2025` 的 `actual-return`。所有空白都有 ledger 內的 `emptyResultReason`、round boundary 與逐 query 結果，不用搜尋摘要或未發生計畫填補。
- 未載明的手術、注射、醫師角色、復健時長、預後、clearance 或回場日期一律不推論。7 個 `rejected-with-reason` candidates 均保留拒絕理由，但沒有進入 sidecar。

## 來源、呈現與待簽核狀態

- 36/36 items 各自攜帶 URL、標題、發布者／帳號、發布日期、access date、tier 與 tier basis。三級來源標籤保持可見；3 條 `unverified-report` 不會視覺升級為官方或已確認。
- 區塊聲明維持「以下內容是第三方報導的整理，不是本站醫師的診斷、評估或建議。」；所有既有及新增 items 都維持 `pending-owner-signoff`，沒有 owner 或醫師 approval。
- nba.com citations 維持不可點擊的 literal text；不得形成 anchor、JSON-LD、inline script 或其他 navigation sink。非 NBA HTTPS citation 才可連到已開啟的原始頁。
- 30/30 clinical freeze 與 21 張封面都不變；Decision 17 歷史 ledgers、v10 source policy 及既有 approved clinical-core lineage 不變。

## 提交前驗證狀態

- ACL canonical generator `--check`：7 ledgers、28/28 terminal units、0 issues、0 byte drift。
- `npx tsc --noEmit`：exit 0；Astro diagnostics：280 files、0 errors、0 warnings、16 hints。
- Decision 18 batch contract：7/7；`source-policy:v10:check`、clinical freeze 30/30、photo registry v8、brand verify、研究 notes Prettier 與 `git diff --check` 均通過。
- 在 receipt 尚未進入 Git history 的提交前狀態，`decision18:research-v2:check` 如設計 fail closed：94 項中 88 通過、6 失敗；transitional loader 暫時仍讀 Decision 17，因而回報 20 個尚未匹配的新增 evidence IDs。這不是驗收通過紀錄；receipt 提交後必須重跑並以 post-commit 結果為準。
- 本報告只記錄 ACL batch 的研究與提交前檢查。完整 unit、coverage、Playwright、review build、BY-SA、DOM/NBA sink 與其他 Phase 6 驗收數字將在三批全部完成後的最終報告列出。
