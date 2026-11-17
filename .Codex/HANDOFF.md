# HANDOFF - 2026-11-18 Asia/Taipei

## 目前進度

使用者核准「醫療教學為主、兼顧一般民眾」的網站品質計劃後，已完成工程候選版與審閱工具。全部 14 工作包已有實作／清單，但全量影片與來源審閱、教材具名核可、真實讀者測試、正式發布仍未完成，不能宣稱 100 分。

- Branch：`feat/site-quality-20261118`。
- 已完整驗證的應用 commit：`70444a51a4827dffd0def7a16839176d2494acc5`；之後只提交本輪審閱及交接文件，最終文件 commit 用 `git log -1` 取得。
- 主實作：`41d5266`；之後修正 preview CLI、投稿焦點、公開／審閱測試分流與 CLS。五筆近期事件更新 `a283d30` 已包含。
- 持久化實作目錄：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury/output/site-quality-20261118/implementation`。交付時以本機 branch/worktree 保存，請先確認路徑、HEAD 與乾淨狀態。
- 原工作目錄仍為 `feat/repo-launch-20261020` / `f735ecb`；三份既有 dirty/untracked 檔案未改動。不要在原目錄 checkout/reset/clean。
- 詳細交付與剩餘驗收：`docs/reviews/2026-11-18-site-quality/implementation-report.md`。

## 已驗證

Node 24.14.0；type 440 files / 0 errors / 0 warnings / 17 hints；unit 120 files / 1,732 passed；public desktop/mobile E2E 204 passed / 30 review-only skipped / 0 failed；review player 34 passed。投稿焦點另在四種瀏覽器 8/8 通過。

公開預覽 274 頁含全部 200 影片詳情及 Curry 候選頁，noindex、無播放統計、明示不可發布。review build 45 頁。Lighthouse 手機 5/5 通過：a11y 全 100，LCP 1,054–2,479 ms，CLS 0.0002–0.056；首頁 LCP 接近門檻，沒有 field INP/CWV 證據。

876 個 URL 巡檢：732 可讀、144 indeterminate（110 access-denied / 15 challenge / 19 timeout），0 直接證實失效。這份報告來自早期 dirty 候選，不是當前 production 或播放證據。保留原 provenance，不改寫。

Curry 2025 腿後肌、2026 髕股疼痛、2026-11 腹斜肌分為三事件。NBA on ESPN 候選 `OYLixb3d7gA` 經原生 Chrome 原平台觀察片長 210 秒、0/26/35/72 秒進度及英文自動字幕；未完整觀看、未驗本站嵌入、字幕準確性或地區。仍是 research-only。

2026-11-18 正式 `/version.json` 讀得 `9d6f38a4159ec69715e8e185cc1c363b1430bf49`。沒有 push、merge、production deploy、真實投稿或測試 email。

## 下一個 Session 的前 3 步

1. **核對候選與開啟預覽**：在上述實作目錄執行 `git status --short --branch`、`git log -3 --oneline`、`curl -fsS http://127.0.0.1:4325/version.json`。預覽應回傳應用 commit `70444a51a4827dffd0def7a16839176d2494acc5`；文件 commit 可以較新。若未運行，使用下面啟動指令。讀 `implementation-report.md` 及 `learning-review.md` 的 20 份草稿。
2. **完成具體審閱項目**：先確認使用者已指定的醫療審閱者（本輪已詢問但尚無回答，不能代簽）。執行 `npm run quality:prepare`，按 `content-review.md` 的 CSV 逐筆填責任人／日期／來源語意與媒體證據；優先 20 份教材及 Curry。讀 `research/candidates/2026-11-18-stephen-curry.json` 後實看候選全段並記錄，不把原平台部分播放當成本站核可。
3. **補齊發布證據後才發布**：依 `current-playback.md` 在獲准的 owned HTTPS 預覽收集全部 N 筆實播，核對版本及資料摘要，沿既有發布流程綁定。執行 `node --import tsx scripts/public-launch/check-release.ts` 與 `npm audit --audit-level=high`；兩者目前均有真實未解阻擋，不得改舊核可摘要或豁免安全 gate。新版依賴若已有修補，查官方 advisory/registry 後再升級與驗證。

## 未解條件

- `docs/reviews/current-playback.v1.json` 保持 pending；0 份本輪 owned HTTPS 全目錄實播核可。舊核可不自動適用新輸入。
- 20 教材是 editorial-draft / clinicalApproval=pending，正式 public 不顯示；研究預覽不等於公開收錄。全量來源工作台 2,540 列，其中 986 有明示引用、1,554 未配對，包含標題與限制，不是 1,554 個醫學錯誤。200 份責任人／到期日未指派。
- 依賴已更新 Astro 7.4.12 / Vite 8.3.6 / Vitest+coverage 4.1.12 / fast-uri 3.1.9，解除 10 distinct advisories。npm audit 仍為 16 high dependency entries，全部關聯 picomatch GHSA-fc5q-39xc-vjpf；當時最新 4.0.7 尚無修補。不要接受不相容的自動降版或宣稱安全檢查通過。
- 真實目標讀者／讀屏驗收、正式環境效能與送信閉環未執行。

## 本機預覽與檔案

在實作目錄執行（Node 路徑確實存在）：

```sh
export PATH="/Users/ethanstudio/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_PUBLIC_PREVIEW=1 node node_modules/.bin/astro preview --background --host 127.0.0.1 --port 4325
```

首頁 `http://127.0.0.1:4325/`；Curry `/review-candidates/stephen-curry/`；20 教材表連結直接跳到問題。停止預覽使用 `node node_modules/.bin/astro preview stop`。不要把 `artifacts/public-preview/` 搬到正式環境。

- `output/site-quality-validation/`：unit/type/E2E/Lighthouse、來源健康、依賴前後報告、production version、原目錄保全雜湊、工作台 CSV。各報告 source SHA/dirty 狀態各自保留。
- `artifacts/lighthouse-public-preview.json`：已驗證 70444a5 的最終實驗室報告。
- `docs/reviews/2026-11-18-site-quality/`：教材、來源、播放、監控、投稿與交付文件。
- `docs/plans/2026-11-18-site-quality-100-plan.md`：原核准驗收條件。

不需要 DB migration 或新秘密。依賴與 build artifact 已保存到實作目錄；新建 checkout 可用 `npm ci`。`tsx` CLI 受沙箱 IPC 限制時改用 `node --import tsx`；server/socket 必須使用允許的執行方式，不能修改產品檢查。Astro 7.4 供測試的 foreground preview 使用 `--ignore-lock`，是程序生命週期旗標，不是略過安全 gate。
