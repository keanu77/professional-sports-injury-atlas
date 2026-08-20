# HANDOFF - 2026-08-20 (atlas 工作線)

> 這份 handoff **只涵蓋 atlas**（本 repo）。sportsmedicine.tw 有自己的 session 與
> 自己的 `.claude/HANDOFF.md`，兩邊不要互相覆蓋。之前 atlas 的交接被塞在
> sportsmedicine 的 HANDOFF 當「工作線 B」，結果 2026-08-16 被另一個 session 覆寫掉，
> 所以改放這裡。

## 進度

Decision 15–19 完成，**Decision 20 未完成**，Decision 21 尚未開始。

- 最後 commit：`167eea1` fix(governance): judge completed-receipt immutability by net content at HEAD
- Branch `main`，worktree 乾淨，未提交變更：**無**
- Test：**1278/1278 通過**（75 檔）｜ `tsc --noEmit`：**exit 0**
- 私有站：`http://100.114.3.93:8140/`（`atlas-reviewer`），launchd PID 66390 狀態 `0`
- 站上服務的是 **Decision 19 的產物**，內容與 repo 一致

## 本次 Session 完成

- [x] **D15** 封面全面改用實拍照：7 張 → **21 張照片 / 0 SVG**（owner 決定「全放」，
      只要有明示 CC 或 PD 標示即採用）
- [x] **D16** Trae Young 封面 39.6 MB → 2.4 MB 衍生版 + dist 大小上限機械閘門。
      **部分完成**：verifier 條件未達成（見 Blocker 1）
- [x] **D17** 影片來源篩選、雙層筆記精簡、後續消息欄位、digest 收摺。
      **首次開啟 `medical-content-authoring`**
- [x] **D18** 移除一般讀者筆記層 + 後續消息窮盡查核：**44 → 148 條**
      （官方 63 / 主流媒體 81 / 未證實 4；treatment 96 / surgery 28 / injection 0 /
      actual-return 24，全部官方來源）。0 個空案例
- [x] **D19** 產物鏈刷新，私有站 smoke **915/915 全 200 + 915/915 全 401、0 不符**
- [x] 修好 D18 遺留的 loader 遷移缺口（`df47271`）
- [x] 修好治理檢查造成的產物鏈死鎖（`167eea1`）

## 當前狀態：Decision 20 卡在哪

D20 目標是把 148 條從 `pending-owner-signoff` 翻成已核准。**owner 已於 2026-08-16 口頭核准全部 148 條**（含 4 條未證實報導），並決定**頁面不顯示核准徽章**，只記在稽核軌跡。

已完成：
- plan 登記 `19a0129`、授權 `53b2d8a`（SHA `a080f0dd…cc94`）
- 契約已加 `owner-approved` 狀態 `d5ede8b`（目前沒有資料在用）

**失敗並已還原**：`e419534` 把核准寫進 sidecar → 撞上 D18 批次 receipt 的不可竄改保證
（`decision18-batch-completed-digest-drift`），已由 `3102ffd` 還原。

**根本原因**：D20 的 plan 有設計缺陷——核准直接編輯 sidecar，但那些檔案被 D18 receipt 凍結，
而 receipt schema `decisionId: z.literal("decision-18")` 硬綁 D18，沒有後繼 receipt 機制。

**Owner 已裁定的修法**：發接手 receipt + **核准改放獨立 ledger**（不碰凍結路徑，
以後簽核不必重發 receipt）。

## 下一個 Session 的前 3 步（可執行格式）

1. **覆核 `167eea1` 這個治理改動** — 讀
   `src/lib/cases/decision-18-follow-up-corpus.ts` 的 `laterCommitsTouchingPaths`
   與 `scripts/generate-decision-18-follow-up-batch-receipt.ts` 約 490 行。
   判定從 `git log commit..HEAD -- paths`（有沒有 commit 碰過）改成
   `git diff --name-only commit HEAD -- paths`（HEAD 有沒有淨差異）。
   這是為了解除 `e419534` + `3102ffd` 造成的死鎖而改的，**由 Claude 而非 codex 所做，
   需要獨立覆核**。若判定不妥，替代方案是建後繼 receipt 層。

2. **設計並實作核准 ledger** — 新增一份不在任何 receipt `allowedPaths` 內的
   核准帳（鍵：item id + `itemPayloadDigest`），讓 loader 在渲染時比對。
   「改內容即失效」的性質**不需另建機制**：`follow-up-loader.ts:424` 已強制
   `reviewedPayloadDigest === computeFollowUpItemPayloadDigest(item)`，
   而 `followUpItemPayload` 明確 `Omit<…, "itemPayloadDigest" | "review">`
   （見 `src/lib/cases/follow-up-digest.ts:8`），所以 review 欄位不影響 payload digest。

3. **完成 D20 剩餘階段** — 渲染層拿掉 `FollowUpReports.astro:53` 的 pending-only 分支
   與 `:124` 的「新增後續消息：待醫師簽核」標題；**不加核准徽章**；
   `ReviewDigestDisclosure.astro:65` 的「待醫師簽核」字樣一併處理。
   然後跑產物鏈與驗證文件。

## 已知 Blocker / Bug

1. **`private:verify` 無法通過** @ `scripts/private-hosting/verify-private-review.ts`
   - 與圖片大小無關（先前誤判過一次）
   - 第一層：預設 `--credential-source tty`，headless 必回 `credential-invalid`
   - 第二層：加 `-- --credential-source local-file` 後變成
     `transport-failed path=/_astro/cj-mccollum.ngownTQ1_2isaYs.jpg
      scenario=credential-removed-new-client`
   - 該路徑單獨用 curl 無憑證新連線是 401／45ms 正常
   - **線索**：完整一輪 smoke 實測 216 秒，超過 `COMPLETE_RUN_TIMEOUT_MS = 180_000`
   - D16 已將此項移交專責 Decision，D19 與 D18 都未執行它

2. **D16 與 D17 各有一個未達成條件由 owner 決定跨過**
   - D16：verifier 條件（見上）
   - D17：Lighthouse Anthony Edwards 頁 LCP 3004–3005ms 對門檻 3000ms，
     其餘五路由通過、該頁 a11y 1.00。單頁診斷量到 2256ms，正式 gate 是六路由連跑
   - 兩者都如實記在收尾文件，**先例已開，之後要謹慎**

3. **D18 沒有自己的收尾驗證文件** — 它是被 codex 額度切斷的（累計 4,184,107 tokens），
   內容工作完整且已提交，但收尾紀錄未補

## 關鍵檔案

- `docs/decisions/plan-binding.v1.json` — 治理綁定總帳（目前 34 份文件）
- `docs/superpowers/plans/2026-08-16-decision-20-follow-up-owner-approval.md` — D20 plan（**byte 不可改**）
- `docs/reviews/2026-08-16-decision-19-p4-final-validation.md` — D19 收尾，含 915/915 smoke 實績
- `docs/reviews/2026-08-14-decision-16-p3-final-validation.md` — verifier 移交紀錄
- `src/lib/cases/decision-18-transitional-follow-up-loader.ts` — v1/v2 過渡解析（808 行測試）
- `src/lib/contracts/decision-18-follow-up-batch.ts:193` — `decisionId: z.literal("decision-18")`
- `src/content/follow-ups/*.json` — 26 個 sidecar，148 條，**受 D18 receipt 凍結**
- `research/follow-ups/decision-18/batches/*.receipt.v1.json` — 三份批次 receipt

## 環境 / 部署注意事項

- **Node 必須是 `/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin/node`**，
  不要用 codex runtime 那顆（已升 24.19.0）
- **`ssh mac-mini-lan` 已失效**（2026-08-20 實測主機名稱解析失敗，mini 改走公網
  直連 `111.248.221.6`）。改用 `ssh mac-mini`（走 Tailscale）
- **產物鏈順序**：`review-set:generate` → commit → `build:review` → `private:manifest`
  → commit → `launchctl kickstart -k gui/501/tw.sportsmedicine.atlas.private-review.v1`
  ⚠️ kickstart 必須在 manifest 單獨 commit **之後**，否則 fail-closed gateway
  以 `artifact-invalid` 拒絕
- **未提交檔案會被當 dirty path 擋下**（`decision18-batch-dirty-path-outside-allowlist`），
  改完要先 commit 才跑得動產物鏈
- **不要從 git 歷史移除任何 blob**，會破壞以 commit SHA 為基礎的整套治理綁定
- Migration：**無**｜新增環境變數：**無**｜未完成的部署步驟：**無**
- 發布、indexing、deployment、remote push 全部維持關閉；G6 公開發布仍擱置
