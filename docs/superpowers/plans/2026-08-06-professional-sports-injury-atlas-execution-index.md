# Professional Sports Injury Atlas Execution Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依使用者在 G0 確認的最新規格 digest，以可回退、可稽核的階段完成 NBA 傷害影片圖鑑私人首版，同時把本機架構、案例來源查核、醫療審查、私人部署與公開索引保持為五個獨立決策。

**Architecture:** 本文件是 execution controller。先取得 repository bootstrap 授權，再完成獨立 Astro 平台與 fail-closed 治理；平台契約固定後才研究 NBA 候選案例；候選 manifest 經人工來源審閱後，另寫一份含真實案例 ID、檔名與來源的 case-authoring plan。私人 hosting、具名醫療審查與公開發布各自需要新的授權，不由任何成功 build 自動推定。

**Tech Stack:** Codex multi-agent、Git local repository、Node.js 24 LTS、Astro static output、TypeScript、Zod、Vitest、Playwright、axe-core、JSON／CSV research artifacts、SHA-256 canonical digest。

---

## 受控文件與執行順序

產品方向已核准，但紅隊釐清版尚未確認；G0 仍封閉的規格：

- `docs/superpowers/specs/2026-08-06-professional-sports-injury-video-atlas-design.md`

已撰寫但必須逐份取得 durable authorization 才可執行的計畫：

1. `docs/superpowers/plans/2026-08-06-professional-sports-injury-atlas-platform-foundation.md`
2. `docs/superpowers/plans/2026-08-06-nba-injury-case-source-discovery.md`

Before G0, these parent-workspace files are the authority. Platform bootstrap copies the confirmed spec, this controller and both active plans byte-for-byte into the new atlas Git repository and records their SHA-256 binding plus per-plan execution-authorization state. After that commit, the atlas-repository copies are the execution authority; the non-Git parent snapshot is not edited during implementation. Every later plan is added through the append-only binding workflow as `not-authorized`; a separate user decision file and binding update are required before that plan can run.

必須在後續閘門才建立的計畫：

3. 建立當日命名的 `nba-injury-case-authoring` plan
4. 建立當日命名的 `atlas-private-hosting-and-review` plan
5. 建立當日命名的 `atlas-public-release` plan

後續計畫必須在相應 gate 以真實日期建立，不得預先以空白案例、猜測網址、假審查者或假 hosting 帳號建立。

## 已固定的產品決策

- 獨立網站，專案預定放在目前工作區的 `professional-sports-injury-atlas/`。
- 多運動資料底座，首版內容只納入 NBA。
- 第一層導覽為 ACL、腳踝扭傷、阿基里斯腱斷裂三個傷種。
- 三個傷種各有一份 evidence-linked 教學總覽，不複製完整 RTP 處方。
- 每傷種至少 10 個通過所有閘門的案例，全站至少 30 個，合格案例不設上限。
- 事件以 2016-08-06 之後的近十年為主；更早案例只可作具理由與具名核准者的經典例外。
- 只使用可辨識的官方／球隊／轉播商／權利方公開原始影片；正式嵌入或外部原始連結，不下載、不重製、不截圖。
- 首版主影片只接受同一球員／日期／比賽的 in-game injury event；訪談、回顧、訓練、熱身、復健或 compilation 不得充當主影片。
- 影片畫面只記錄可觀察內容；傷種分類必須由外部正式診斷來源確認。
- 每案保存一般重點、專業分析、限制、時間碼、來源與逐案例審查 digest。
- 預設 review build 強制 noindex；真正私人環境另需 hosting 層 access control。
- 公開 build 在未具備公開網址、政策網址、課程網址、30 案、醫療核准與索引授權前必須 fail closed。
- MLB、足球、CMS、帳號、付費、自動發布與公開部署不在本輪。

## 全域不可越過的邊界

- 目前工作區不是 Git repository。未取得明確授權前，不執行 `git init`、不建立遠端、不 push、不開 PR。
- 不修改既有七門 RTP 課程的 `course/`、`schemas/`、`tools/rtp_catalog/` 或 `artifacts/rtp/`；只做唯讀驗證與受控匯入。
- 不把 agent、內容負責人或醫療審查者的名稱自行填入核准欄位。
- 不把 `medical-review` 自動改成 `approved`，不把 `allowIndexing` 改成 `true`，不建立假 `indexingAuthorization`。
- 不登入或變更 GitHub、Cloudflare、Railway、DNS、YouTube、NBA 或其他外部帳號。
- 不把 noindex 宣稱為 access control；沒有實際未授權請求測試，不得稱為私人部署完成。
- Atlas 的每個新 execution shell 先把 task-specific `ATLAS_NODE_BIN` 設為 Codex bundled Node 24.14.0 path、prefix 到 PATH，並驗證 `node --version`，避免誤用目前 shell 的 Node 26。
- 來源搜尋結果摘要不能當證據；每個納入來源都必須開啟原頁並保存 canonical URL、publisher 與存取日期。
- 預期失敗的公開 release gate 必須單獨執行並驗證非零；不得把它串入成功命令後誤報為失敗 build。

## Gate matrix

| Gate | 可以開始的工作 | 通過條件 | 通過後仍未授權 |
|---|---|---|---|
| G0 Repository/platform authorization | 唯讀盤點、計畫 | 使用者確認最新規格 digest，並明確授權 local Git bootstrap 與 platform-foundation plan | NBA 來源研究、真實內容、remote、push、hosting |
| G1 Platform | 本機 Astro 架構、測試 fixture | platform plan 全部正向檢查通過；public gate 按設計失敗 | 真實案例、部署 |
| G2 Sources | NBA 候選研究 | 先取得 source-discovery 獨立授權；後續三傷種各至少 10 個 source-verified manifest entry 且人工來源審閱完成 | 醫療文案、approved 狀態 |
| G3 Authoring | 逐案與傷種教學內容 | 先核准綁定的真實 case-authoring plan；後續逐案／總覽通過資料檢查，建立當期真實 QuarterlyUpdate 與 review-set manifest | 醫療核准、私人部署 |
| G4 Private staging | 存取控制的審查環境 | 先核准 hosting-specific plan；access-control、完整 private-dist manifest/served-review-artifact receipt、review-set bytes、noindex、headers、robots 與完整授權／未授權路徑測試通過 | 醫療核准、公開、索引 |
| G5 Medical/private release | 具名醫療審查與私人版本 | 綁定 review-set、private-dist manifest、served-review receipt、private URL/deployment 的 durable decision；ACL／ankle／Achilles 各至少 10 案、三個 overview 與 current update 均具 matching approved digest，且私人 QA 完整 | 公開、索引 |
| G6 Public release | 另行公開計畫 | 30 案、權利、政策、課程 URL、strict site-publication decision、完整 public artifact/served receipt 與 public gate 全部通過 | 無；仍需明確 deploy 指令 |

## Specification coverage matrix

| Specification area | Implementation owner |
|---|---|
| Injury-first, dual-audience UI and routes | Platform Tasks 5–7 |
| Three evidence-linked injury teaching overviews | Platform Tasks 1–2 and 7 + later authoring/medical review |
| NBA-only launch; 3 injuries; 10 each / 30 total | Discovery Tasks 2–5 + public release gate |
| Near-ten-year cases and classic exceptions | Discovery policy/manifest + later case authoring |
| Multi-sport-ready taxonomy without empty pages | Platform Tasks 1 and 7 |
| Per-case JSON, claim linkage, digest and review invalidation | Platform Tasks 1–2 |
| Official diagnosis hierarchy and video provenance | Discovery Tasks 1–5 |
| Public-rights clearance separate from source provenance | Platform Tasks 1–4 + later public-release plan |
| Click-to-load video, timecodes and failure fallback | Platform Task 6 |
| Search, compound filters and no-JS fallback | Platform Task 7 |
| RTP course scope mapping and no guessed URL | Platform Task 3 |
| Quarterly curation and unavailable/conflicted rollback | Platform Task 9 + later case-authoring plan |
| Immutable quarterly/public release history | Platform Tasks 1–4 + later public-release plan |
| Served-build medical review binding | Platform Tasks 4 and 7 + later hosting/review plan |
| Append-only plan authority and separate execution grants | Platform Task 0 + each later gate decision |
| Private access/noindex and separate public authorization | Index Tasks 5–6 + Platform Task 4 |
| Unit, browser, accessibility, privacy and negative release tests | Platform Tasks 1–9 |
| No MLB/football content, CMS, accounts, download or deployment | Global boundaries and Gate matrix |

### Task 0: 建立執行紀錄並取得 repository／platform 授權

**Files:**

- Read: `docs/superpowers/specs/2026-08-06-professional-sports-injury-video-atlas-design.md`
- Create after authorization: `docs/decisions/2026-08-06-atlas-bootstrap.md`
- Create after project bootstrap: `professional-sports-injury-atlas/docs/reviews/2026-08-06-atlas-execution-log.md`

- [ ] **Step 1: 記錄現況，不改檔案系統結構**

Run from the current workspace root:

```bash
pwd
git rev-parse --show-toplevel
test ! -e professional-sports-injury-atlas
```

Expected before execution authorization: `pwd` 是目前 RTP workspace；`git rev-parse` 非零；atlas 子目錄不存在。

- [ ] **Step 2: 暫停並取得一個明確答案**

使用者需核准或拒絕以下完整範圍：

```text
確認當下顯示的規格 SHA-256 與紅隊釐清摘要；
允許在 professional-sports-injury-atlas/ 建立獨立 local Git repository，預設分支 main；
允許執行綁定版 platform-foundation plan，只建立本機架構、虛構 fixtures 與失敗封閉治理；
本階段不做 NBA 真實來源研究、不撰寫真實醫療內容、不建立 remote、不 push、不部署、不改 DNS。
```

沒有肯定答覆時，G0 保持未通過，後續 implementation plan 不得開始。

- [ ] **Step 3: 寫入 bootstrap decision**

核准後先從 workspace root 執行 `mkdir -p docs/decisions docs/reviews`，再由主代理使用 `apply_patch` 建立 decision 文件。它必須使用 Platform Task 0 的同一 anchored contract，且每個 recognized key prefix 恰好出現一次：`decisionSchemaVersion: 1`、`redTeamSpecStatus: confirmed`、`g0ExecutionStatus: authorized`、`authorizedScope: local-git-and-platform-foundation-only`、非空白 `authorizedBy`、UTC `authorizedAt`、`sourceDiscoveryExecutionStatus`／`medicalAuthoringExecutionStatus`／`hostingExecutionStatus`／`publicReleaseExecutionStatus`／`deploymentExecutionStatus` 全為 `not-authorized`，並保存當下重新計算的 `specSha256`、`executionIndexSha256` 與 `platformPlanSha256`。不得用自由文字中的「核准」代替 machine fields；Platform Task 0 會重新計算三份文件 bytes 並拒絕重複鍵、矛盾狀態、空白 identity 或 hash mismatch。

- [ ] **Step 4: 建立 execution log 與 ownership 表**

這份 log 建立在 atlas repository 內；若 project 尚未完成 bootstrap，先保留 decision，不先建立散落於 parent 的 execution log。

至少包含：

| Path | Owner | 其他 agents |
|---|---|---|
| `src/lib/contracts/**`、`src/content.config.ts` | platform-contract owner | read-only |
| `src/components/**`、`src/pages/**`、`src/styles/**` | platform-ui owner | read-only |
| `scripts/**`、`tests/**`、`e2e/**` | platform-verification owner | read-only |
| `research/candidates/**` | assigned injury researcher | other researchers read-only |
| `research/source-manifests/**`、`research/reviews/source-batches/**` | root integration only | immutable after append; no direct edit |
| `research/source-manifest-registry.v1.json` | root integration only | append-only via validated generator |
| `src/content/cases/**` | later case-authoring owners | unavailable before G2 |

每個 agent handoff 必須回報 exact files、commands、results、expected failures、未解風險及 no-deploy confirmation。

### Task 1: 執行平台底座計畫

**Plan:** `2026-08-06-professional-sports-injury-atlas-platform-foundation.md`

- [ ] **Step 1: 逐 task 使用 TDD 建立本機獨立站**

先跑失敗測試，再作最小實作，再跑同一測試轉綠。平台只使用 tests fixtures，不加入真實球員、診斷或影片。

- [ ] **Step 2: 驗證 RTP read-only import 邊界**

匯入器只能讀 parent workspace 的 catalog／manifest，驗證 exact-byte SHA-256 後輸出 atlas 自己的 generated summary。它不可寫回 parent workspace，也不可把 RTP 教學影片當 NBA 案例。

- [ ] **Step 3: Gate G1**

From the atlas project root:

```bash
npm ci
npm run rtp:import
npm run verify
```

Expected: all commands exit `0`；`verify` 包含 plan binding、format、Astro/content checks、coverage、review build、Playwright/axe、本機 Lighthouse 與 artifact policy；review artifact 沒有 YouTube iframe、analytics 或 sitemap，所有 HTML 具一致 noindex meta。

Run the public negative gate separately:

```bash
set +e
npm run release:public
public_release_exit=$?
set -e
test "$public_release_exit" -ne 0
```

Expected: final `test` exit `0`，因尚無 30 個核准案例、公開 URL、課程 URL 與索引授權而 fail closed。

### Task 2: 執行 NBA 候選來源查核計畫

**Plan:** `2026-08-06-nba-injury-case-source-discovery.md`

- [ ] **Step 1: 暫停並取得 source-discovery 授權**

先呈現已綁定的 source-discovery plan digest、實際會瀏覽並寫入的研究範圍、三傷種各至少 15 個候選的工作量，以及不撰寫醫療內容／不公開的邊界。只有使用者核准這一階段後，才以 `apply_patch` 建立符合 strict `PlanExecutionDecisionV1` 的 date-stamped JSON decision；它必須匹配 role `nba-injury-case-source-discovery`、scope `nba-source-discovery-only`、當前 plan path/hash，以及仍封閉的 medical authoring/hosting/public/deployment scopes。將 decision 與 plan 授權狀態加入 binding，並執行：

```bash
ATLAS_SOURCE_DECISION="docs/decisions/$(date +%F)-nba-source-discovery-authorization.v1.json"
test -f "$ATLAS_SOURCE_DECISION"
npm run plan:decision:verify -- --decision "$ATLAS_SOURCE_DECISION" --plan docs/superpowers/plans/2026-08-06-nba-injury-case-source-discovery.md
npm run plan:bind -- docs/superpowers/plans/2026-08-06-nba-injury-case-source-discovery.md --status authorized --decision "$ATLAS_SOURCE_DECISION"
npm run plan:verify
npm run plan:assert-authorized -- docs/superpowers/plans/2026-08-06-nba-injury-case-source-discovery.md
```

Expected: both exit `0`. 沒有這個獨立授權時結束任務，不啟動網路研究。

- [ ] **Step 2: 平行研究，路徑互斥**

最多三個 agents 分別只編輯：

- `research/candidates/acl.csv`
- `research/candidates/ankle-sprain.csv`
- `research/candidates/achilles-rupture.csv`

研究 agents 不編寫一般／專業醫療內容，不更動 schema，不產生 approved manifest。

- [ ] **Step 3: Root 逐列開啟並全量重查來源**

Root 驗證 publisher、原始 URL、事件去重、診斷確認規則、影片 provenance、embed 狀態、日期與經典例外。任何 search snippet、二手剪輯、來源不明影片或僅憑畫面推論的列都退回。

- [ ] **Step 4: 由具名內容負責人完成人工來源審閱**

沒有與候選集合 digest 及 `manifestId=NBA-SOURCE-2026-08-06-001` 綁定的 `research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json` 時，manifest generation 必須失敗；agent 不得代填姓名。這是來源審閱，不是醫療核准。

- [ ] **Step 5: Gate G2**

```bash
npm run research:check
npm run research:check-verification
npm run research:manifest
npm run research:check-manifest
npm run research:registry:check
```

Expected: 全部 exit `0`；immutable launch manifest `research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json` 每傷種至少 10 筆、總數至少 30 筆，所有 entry 為 `source-verified`，registry 從 canonical empty bytes 恰好 append 一筆並重算通過，但沒有任何 `medicalReview.status=approved`。

`research:verify-links` 是會更新 `checkedAt` 與 artifact bytes 的 mutation step。Root 最後一次修改 CSV／audit 後，必須依序重跑 live verifier、只讀 `research:check-verification` exact-bijection check、candidate-set digest，再交付具名來源審閱。G2 決定後只執行 read-only checker；若需要重新做 live check 或改動任何 bound input，舊 decision 立即 stale，必須完整重跑 freeze loop 並再次取得具名來源審閱，不能在 manifest generation 前偷跑一次。

這個 G2 是首發批次門檻。之後每三個月另寫並授權新的 source-discovery plan，以唯一 batch ID append `quarterly` edition；該 batch 可只有少量、單一傷種或零新增，不能重跑首發 10／30 門檻，也不得重複 active candidate/event/video identity。事實更正使用 `correction` edition：每個 prior entry 最多被 supersede 一次且恰有一個 replacement；舊 binding 隨即退出 current active set，受影響案例必須重綁並重新醫審，或以 matching update 退役／標記 unavailable，才能產生下一個 approved/public build。舊 manifest、decision、registry prefix 與已發布歷史快照不得改寫。站級 selector 仍對目前核准全庫執行各傷種 10 案／總數 30 案門檻。

### Task 3: 以真實 manifest 撰寫 case-authoring plan

**Files:**

- Read: `research/source-manifest-registry.v1.json`
- Read: the registry-resolved `research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json` and its immutable source-review decision
- Create: a date-stamped `nba-injury-case-authoring` plan after manifest approval

- [ ] **Step 1: 驗證 manifest 已固定**

```bash
npm run research:check-manifest
npm run research:registry:check
npm run research:digest
```

Expected: validators exit `0`；digest command 輸出 launch manifest 的 64 字元小寫 SHA-256，registry checker 同時證明 batch path/decision/digests 與 append prefix。將 manifest ID/path/digest、decision digest、registry entry 與 registry digest 寫入後續計畫 header。

- [ ] **Step 2: 重新啟用 writing-plans skill**

後續計畫必須展開每個真實 candidate ID、case slug、case JSON 路徑、事件／診斷／影片來源 URL、需要撰寫的段落、時間碼驗證、測試與審查順序；不得以「其餘案例同理」或空白模板代替。專業層主張另需在實作當時開啟具體、最新的原始研究／指引，為每個 atomic claim 列出真實 `teaching-evidence` 來源與 supports path；不得由候選案例的新聞或影片代替醫療證據。同一計畫必須另列 ACL、腳踝扭傷、Achilles 三份 `src/content/injuries/*.json` 傷種教學總覽任務，使用 claim-level evidence 且不複製完整 RTP 處方。計畫也必須建立實作當時所屬季度的第一份 `src/content/updates/YYYY-qN.json`，以真實案例 ID 與 digest 建立首版基準，不可使用假 update fixture 代替營運記錄。

- [ ] **Step 3: 對 manifest 與 case plan 做一對一 coverage test**

計畫附一份 machine-readable checklist，證明 registry-resolved launch batch 的每個 manifest entry 恰好有一個 authoring task，沒有遺漏或重複；三個傷種總覽與當期 baseline update 也各有且只有一個具體 task。後續 append 未被此計畫引用的 quarterly batch 不得改變這份 coverage 或既有案例 digest。

- [ ] **Step 4: 綁定計畫，然後另行取得 authoring 授權**

建立 plan 後立即以 `plan:bind` 加入 `not-authorized` entry 並與 plan 同一 commit；plan 必須宣告 stable role、execution scope ID 與 required closed scopes。先向使用者呈現 plan digest、實際案例數、傷種總覽、教學證據研究與不部署邊界。只有使用者明確核准這份真實 plan，才建立匹配其 role/path/hash/scope 的 strict `PlanExecutionDecisionV1`、驗證、綁定並將該 plan 標為 authorized。

```bash
ATLAS_AUTHORING_PLAN="$(npm run --silent plan:resolve -- nba-injury-case-authoring)"
ATLAS_AUTHORING_DECISION="docs/decisions/$(date +%F)-nba-injury-case-authoring-authorization.v1.json"
test -f "$ATLAS_AUTHORING_PLAN"
test -f "$ATLAS_AUTHORING_DECISION"
npm run plan:decision:verify -- --decision "$ATLAS_AUTHORING_DECISION" --plan "$ATLAS_AUTHORING_PLAN"
npm run plan:bind -- "$ATLAS_AUTHORING_PLAN" --status authorized --decision "$ATLAS_AUTHORING_DECISION"
npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_AUTHORING_PLAN"
```

### Task 4: 執行逐案例 authoring 與內部 QA

**Plan:** Gate G2 後建立的 `nba-injury-case-authoring` plan。

- [ ] **Step 1: 依傷種分派互斥 case paths**

執行任何 authoring 前，先對 Step 4 的 `$ATLAS_AUTHORING_PLAN` 執行 `npm run plan:verify` 與 `npm run plan:assert-authorized -- "$ATLAS_AUTHORING_PLAN"`；任一失敗立即停止。

每個 agent 只能編輯後續 case-authoring plan 明列並分配給它的實際 case JSON 路徑。共用 schema、digest、selectors 與 UI 已在 G1 freeze，case agents 不得自行放寬。

- [ ] **Step 2: 每案執行 red → green**

每加入一案先讓 schema／source／digest fixture 測試因缺資料失敗，填入已查核資料後再轉綠。影片觀察、外部已確認診斷與專業證據必須分開。

- [ ] **Step 3: 產生逐案例 digest，不代填核准**

案例停在 `medical-review`；產生的 digest 送交具名醫療審查者。agent 不把 reviewer、reviewedAt 或 approved digest 自行填滿。

- [ ] **Step 4: Gate G3**

正向 content／build／E2E 全綠；對每個真實 case、league、injury overview、update route 及首頁 latest-update 連結做具名 assertion；第一份真實 QuarterlyUpdate 通過 baseline snapshot、case/video digest pair 與 update digest 檢查，三個傷種總覽通過 evidence/digest 檢查，但全部仍停在待醫療審查狀態。從固定的 clean content commit 產生真實 canonical review-set manifest，其中含案例與 frozen source-entry binding、傷種總覽、update、只涵蓋 spec/controller/platform/source/active-authoring 的 stable content-authority snapshot digest，以及 renderer/supporting-data tree digest；後續 hosting/public binding 不會使它失效。workflow/reviewer/status 欄位不參與臨床 digest，所以應用審查決定不會形成循環，但任何 UI 代碼、來源綁定或醫療內容變更都會失效；public release gate 應因醫療核准、hosting 與索引授權缺失而非零。

### Task 5: 另寫私人 hosting 與醫療審查計畫

- [ ] **Step 1: 取得 hosting 與角色決策**

至少需明確決定：私人 hosting 平台、帳號 owner、access-control 管理者、允許的 reviewer 身分、具名醫療審查者與三門課程 URL 狀態。

- [ ] **Step 2: 建立 deployment-specific plan**

計畫必須使用所選平台的真實設定檔、access-control 方法、secret naming、preview URL 驗證、rollback、served review-set byte verification，以及授權／未授權請求測試。沒有平台決策，不建立泛用的假部署步驟。新 plan 先以 stable role/scope/closed scopes 和 `not-authorized` 綁定；使用者另行核准該 plan digest 與真實 hosting 變更範圍後，才建立 strict `PlanExecutionDecisionV1`，依序通過 `plan:decision:verify`、更新 binding 與 `plan:assert-authorized`。

- [ ] **Step 3: 先通過 Gate G4，再開始醫療審查**

在任何醫療內容審查前，先由本機 review build 產生去重、排序的 canonical private-dist manifest，逐一列出所有 data-bearing HTML/JSON/JS/CSS/必要靜態資產路徑、decoded byte SHA-256、長度、預期 content-type、atlas page/record identity 與 noindex/header contract；範圍包含首頁、每個 injury、case、league、latest update、`/review/review-set.json`、case-index manifest 與每個 index shard，不得手寫抽樣清單。

先以「不跟隨 redirect」的未登入請求逐一驗證完整 manifest：每個資料路徑都必須回 `401/403` 或核准的 IdP redirect，且 response 不含 atlas identity、review bytes、card summary 或 workflow status；先後使用 cold/warm cache 及去除 cookie 的請求，證明 CDN/browser cache 不會繞過存取控制。再以授權 reviewer 身分驗證同一完整檔案集：使用逐路徑 decoded response byte equality，或涵蓋完全相同路徑／bytes 的平台 cryptographic deployment checksum，再逐路徑確認 `200`、content-type、identity、shard IDs、noindex/header，不是 login page、deny-all 或 fallback HTML。`/review/review-set.json` 另須與本機 canonical manifest bytes 完全相同。結果寫成不含 credential/raw HTML/media 的 strict served-review-artifact receipt，綁 private-dist manifest digest、review-set response SHA-256、private URL hash、provider deployment-ID hash、方法、完整 path count、zero mismatches、驗證者與 UTC 時間。只改一頁 HTML 而保留正確 review-set JSON 也必須失敗。只有 access matrix 與整份 artifact receipt 都通過，才把 URL 交給指定醫療審查者。

- [ ] **Step 4: 完成 Gate G5**

醫療審查者在受控環境逐案核對 UI 顯示的 ID/full digest，並審查三個 injury overview 與 current update。審查結果寫入 durable `medical-review-decision.v1.json`，綁定 review-set digest、private-dist manifest digest、served-review-artifact receipt digest、review-set response SHA-256、private URL hash、provider deployment-ID hash與每個明示決定；agent 不代填。Validator 通過後才能應用 workflow approval。若任一 case/overview 被退件、排除或修改，或 baseline update 因最終納入集合而改變，舊 decision 不得部分套用；必須重新產生 review set、部署受控版、驗證完整 served artifact 並取得新決定，直到有一個完整 matching set。主代理再以 `selectMedicallyApprovedCases()`（不要求尚未授權的 public rights/indexing）重算 ACL、腳踝、Achilles 各至少 10 案與總數至少 30 案，並確認三個 injury overview 都有 matching approved digest。當期 QuarterlyUpdate 必須與這個最終完整 set 一致，由具名醫療審查者核准 matching update-review digest；不可沿用 G3 的待審基準。對真實、已驗證授權存取與 atlas page identity 的私人 URL，hosting-specific 計畫使用不會寫入報告的認證方式，對首頁、三個傷種頁、至少一個代表性核准 case 與 latest update 重跑 mobile Lighthouse，每頁 Accessibility 至少 `0.95`、LCP 不高於 `2500ms`。只留存 URL hash、時間、工具版本與數值摘要；不留存 credential、實頁截圖、HTML 或 network archive。任一傷種因審查退件不足 10 案，就回 G2/G3 補充，不降低標準。通過後只能稱為私人首版，不代表公開。

### Task 6: 公開決策保持封閉

- [ ] **Step 1: 保留預設負向 gate**

在使用者另行說明「允許公開」與「允許搜尋索引」之前：

```bash
set +e
npm run release:public
public_release_exit=$?
set -e
test "$public_release_exit" -ne 0
```

Expected: final `test` exit `0`。

- [ ] **Step 2: 僅在另行授權後建立 public-release plan**

該計畫需重新驗證 NBA／平台條款、所有影片可用性、政策頁、公開 URL、三門課核准網址、30 案門檻、每案 clinical/video/public-rights digest、durable review-set/medical-decision、三個 approved injury-overview digests、current approved update/`publishedAt`/route/home link、reviewed-content commit、public renderer/source-tree digest、從前次 finalized release commit 讀出的 exact history prefix 與 candidate transition、套用 publication decision 後的 exact clean build commit、涵蓋每個 sorted `dist` path/bytes 的 artifact manifest/digest，以及逐路徑 byte equality或涵蓋同一完整檔案集的平台 checksum、served-artifact receipt/public URL hash、站級 indexing authorization、sitemap、analytics 決策與 rollback。任一 served byte/identity 不符都不得 append release history。Public plan 先以 stable role/scope/closed scopes 和 `not-authorized` 加入 authority binding；使用者核准該 plan digest 的 strict `PlanExecutionDecisionV1` 只允許執行發布準備。等 exact candidate site digest 與 public URL hash 都存在後，還必須另取得同時明示 `allowPublic=true`、`allowIndexing=true` 且綁該 digest/URL 的 strict `SitePublicationDecisionV1`。兩者皆不等於真實 deployment 指令；每次 deploy 仍需第三次明確指令，不得由本 execution index 直接部署。

## 完成定義

這份 execution index 只有在以下結果都留下 exact evidence 時才完成：

- platform foundation 與 source discovery 兩份計畫已按順序執行。
- 不可變 launch manifest／source-review decision／append-only registry entry 與後續 case-authoring plan 已一對一對應；未引用的季度 batch 不會改寫既有綁定。
- ACL、腳踝扭傷、阿基里斯腱斷裂各至少 10 個、總數至少 30 個案例經具名醫療審查，且每個 reviewed digest 與目前內容一致。
- ACL、腳踝扭傷、Achilles 三個傷種教學總覽都有 claim-level evidence 與 matching approved digest，且未複製完整 RTP 處方。
- `currentUpdateId` 指向的首版真實 QuarterlyUpdate 已與最終核准案例 ID/clinical-video digest pairs 對應，並具有 matching approved update-review digest。
- 私人 hosting 的 access-control 與 noindex 防護已在真實 URL 驗證：未授權請求被拒絕；授權 reviewer 對完整 private-dist manifest 的所有資料路徑取得正確 status/content-type/identity/bytes/headers，served-review-artifact receipt 為 zero mismatches，且 review-set bytes 與本機完全相同。
- 具名 medical-review decision 綁定 review-set digest、private-dist manifest digest、served-review-artifact receipt digest、review-set response hash、private URL hash、provider deployment-ID hash與案例／傷種總覽／update 決定。
- 真實私人 URL 的首頁、三個傷種頁、代表性 case 與 latest update 均有 mobile Lighthouse 證據：Accessibility 至少 `0.95`、LCP 不高於 `2500ms`。
- public release gate 在未取得公開授權前持續 fail closed。
- 沒有下載、保存、重製或重新上傳任何比賽影片。
- 沒有 remote、push、部署、DNS 或索引變更超出當時明確授權。
