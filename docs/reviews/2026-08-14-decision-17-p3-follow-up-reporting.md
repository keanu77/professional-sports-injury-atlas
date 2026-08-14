# Decision 17 Phase 3 — 後續消息草稿、來源稽核與 review-set v2

日期：2026-08-14  
狀態：Phase 3 完成；所有新增醫療內容仍為 `pending-owner-signoff`，未執行醫療簽核

## 邊界與 lineage

- 26 個既有案例與其他 4 個臨床凍結檔均未修改；`npm run decision13:clinical-freeze` 為 30/30，aggregate SHA-256 `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`。
- 26 個既有 `review.status=approved`、具名 reviewer、qualification、timestamp 與 clinical-core digest 均維持原值。新增 sidecar digest 是獨立 pending lineage，沒有 reviewer identity、approval decision 或 owner 簽名。
- Decision 17 plan/auth bytes 維持 SHA-256 `845f2b6b694ace14fc65cf086c7fce95985acfb4d0f562dfaaab1f357e84078e` / `cdb2b5838d66d50c74ac82346c06a4c1096d52422fa767e6b64d2f22c9ba8080`。
- 歷史 `review/review-set.v1.json` 維持 SHA-256 `99f637a0f2195614ff84b9afbdafb236039efcadb4eb7510e66af43f855f58da`；Phase 3 沒有提前生成 v2 artifact。

## 原頁來源稽核

- 三批共 44/44 retained facts 均由開啟的原始頁複核：batch 1 為 21、batch 2 為 7、batch 3 為 16；search snippet 使用數為 0。
- 稽核後實質修正包括：1 條匿名 league source 降為 `unverified-report`；1 條刪除來源未載明的膝部側別；1 條不再把發布日當事件日；2 個 404 球隊頁 URL 改為實際官方頁；另校正原頁標題、署名、publisher、日期與兩段超出原文的 treatment 描述。
- 15/15 `actual-return` 均由球隊／聯盟官方參賽紀錄支撐，`factDate` 非空且不晚於 2026-08-14。主流媒體或 `unverified-report` 支撐 actual-return 的數量為 0。
- 沒有從診斷、缺席名單或其他 item 推論手術、注射、復健時長、預後或回場日期。查無逐條來源的 category 保持空陣列。

## 26 案逐案結果

欄位順序：`treatment / surgery / injection / actual-return`；tier 順序：`team-or-league-official / mainstream-media-report / unverified-report`。

| 案例 slug                               | 新增條數 | 四類分布      | tier 分布 |
| --------------------------------------- | -------: | ------------- | --------- |
| anfernee-simons-ankle-sprain-2023       |        0 | 0 / 0 / 0 / 0 | 0 / 0 / 0 |
| anthony-edwards-ankle-sprain-2023       |        1 | 1 / 0 / 0 / 0 | 0 / 1 / 0 |
| anthony-edwards-ankle-sprain-2025       |        1 | 0 / 0 / 0 / 1 | 1 / 0 / 0 |
| brandon-clarke-achilles-rupture-2023    |        3 | 1 / 1 / 0 / 1 | 1 / 2 / 0 |
| cj-mccollum-ankle-sprain-2020           |        0 | 0 / 0 / 0 / 0 | 0 / 0 / 0 |
| damian-lillard-achilles-rupture-2025    |        1 | 0 / 1 / 0 / 0 | 1 / 0 / 0 |
| danny-green-acl-2022                    |        2 | 1 / 1 / 0 / 0 | 0 / 2 / 0 |
| dejounte-murray-achilles-rupture-2025   |        2 | 1 / 0 / 0 / 1 | 1 / 1 / 0 |
| dwight-powell-achilles-rupture-2020     |        2 | 1 / 1 / 0 / 0 | 2 / 0 / 0 |
| ja-morant-ankle-sprain-2020             |        2 | 1 / 0 / 0 / 1 | 1 / 1 / 0 |
| jayson-tatum-achilles-rupture-2025      |        3 | 1 / 1 / 0 / 1 | 3 / 0 / 0 |
| joe-ingles-acl-2022                     |        2 | 0 / 1 / 0 / 1 | 2 / 0 / 0 |
| kevin-durant-achilles-rupture-2019      |        3 | 1 / 1 / 0 / 1 | 3 / 0 / 0 |
| kevin-durant-ankle-sprain-2024          |        1 | 0 / 0 / 0 / 1 | 1 / 0 / 0 |
| kyrie-irving-acl-2025                   |        2 | 1 / 1 / 0 / 0 | 2 / 0 / 0 |
| kyrie-irving-ankle-sprain-2021          |        1 | 1 / 0 / 0 / 0 | 1 / 0 / 0 |
| lamelo-ball-ankle-sprain-2022           |        1 | 0 / 0 / 0 / 1 | 1 / 0 / 0 |
| lamelo-ball-ankle-sprain-2023           |        0 | 0 / 0 / 0 / 0 | 0 / 0 / 0 |
| lamelo-ball-ankle-sprain-2025           |        1 | 0 / 0 / 0 / 1 | 1 / 0 / 0 |
| lebron-james-ankle-sprain-2021          |        2 | 1 / 0 / 0 / 1 | 2 / 0 / 0 |
| markelle-fultz-acl-2021                 |        3 | 1 / 1 / 0 / 1 | 2 / 1 / 0 |
| moritz-wagner-acl-2024                  |        3 | 1 / 1 / 0 / 1 | 2 / 0 / 1 |
| ricky-rubio-acl-2021                    |        3 | 1 / 1 / 0 / 1 | 1 / 2 / 0 |
| thomas-bryant-acl-2021                  |        1 | 0 / 1 / 0 / 0 | 0 / 1 / 0 |
| trae-young-ankle-sprain-2021            |        2 | 1 / 0 / 0 / 1 | 1 / 1 / 0 |
| tyrese-haliburton-achilles-rupture-2025 |        2 | 1 / 1 / 0 / 0 | 0 / 2 / 0 |

總計：44 條；`treatment=16`、`surgery=13`、`injection=0`、`actual-return=15`；官方 29、主流 14、未證實 1。完全沒有新增 item 的 3 案為 Anfernee Simons 2023、CJ McCollum 2020、LaMelo Ball 2023。

## UI 與連結邊界

- 26/26 review case pages顯示固定區塊聲明「以下內容是第三方報導的整理，不是本站醫師的診斷、評估或建議。」、獨立 approved-core lineage、四類 category、每條來源與可見 tier、`待醫師簽核`，以及每個空 category 的明確空狀態。
- 唯一 `unverified-report` 在畫面上明示「不可視為已確認」，沒有官方／已確認樣式提升。
- `actual-return` 顯示 retrospective-only 文案，明示不是治療時長、預後、建議或可套用的回場時間表。
- 建置 DOM 驗證：26 cases、44 items、3 empty cases、41 NBA follow-up citations；HTML attribute、JSON-LD、inline script 的 NBA navigation sinks 均為 0。NBA URL 只以 literal text 出現；非 NBA HTTPS citation 維持直接原始來源連結。
- Public projection 由 `pendingFollowUpForBuildMode()` fail closed；pending sidecar 只在 review mode 載入與渲染。

## review-set v2 與 closed scopes

- Active path 是 `review/review-set.v2.json`；generator、route、private manifest/server/manager、release gate/check 全部使用 strict v2 parser/path，沒有 v1 fallback。
- v2 每案分別綁 approved clinical-core identity 與 pending follow-up sidecar/draft digest/state。
- `approvedCoreContentAuthoritySnapshotDigest` 保留既有 core authority；完整 `contentAuthoritySnapshotDigest` 另將 exact Decision 17 plan/auth path、SHA、role、execution scope、`medical-content-authoring` opened scope與七個 closed scopes納入 canonical projection。
- Generator 在寫入前重讀 plan、authorization 與 plan-binding active pair；private manifest 再重載 26 sidecars 並逐案比對 path/digest/pending/nba-v10。
- `medical-review-decision.v1` 對 v2 回報 `medical-decision-review-set-version`；release gate同時回報 `public-release` closed。沒有建立或套用任何醫療 decision。

## 驗證實績

- `npm run decision17:follow-ups:generate` / `:check`：26 cases、44 items、3 empty cases；29 / 14 / 1 tier；16 / 13 / 0 / 15 kinds。
- `npm run decision17:follow-ups:dom`：26 cases、44 items、41 NBA citations、NBA sinks 0。
- B-2 focused Vitest：36/36；v2/private/release combined focused Vitest：124/124；其後完整 `npm run test:unit`：67 files、1167/1167 tests。
- Follow-up Playwright：desktop Chromium + mobile Chromium 共 6/6。
- `npx tsc --noEmit`：exit 0。
- `npm run check`：257 files，0 errors、0 warnings、16 hints。
- `npm run format:check` 與 `git diff --check`：exit 0。
- `npm run decision17:baseline:check`：`f33ec875b74869b2d735684ef2f4d089815e81192f1d11df6d62b9c9b45489b4`。
- `source-policy:v6–v10:check`、`player-photos:v8:check`、`brand:verify` 均通過；v10 JSON digest `9203384e5d8b551834e3de5c17a3cc2bff60f8e27416a3074897db861df9a4b3`；ShareAlike composite firewall 維持啟用。

本 phase 未生成/提交 `review/review-set.v2.json`、未生成 private manifest、未執行 kickstart、未修改 deployment/indexing/外部帳號/remote repository。
