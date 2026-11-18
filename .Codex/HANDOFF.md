# HANDOFF - 2026-11-18 Asia/Taipei

## 目前可執行狀態

最新要求：「請部署」。部署授權已收到；在 clean `ab3f048` 實際重跑發布檢查，仍被 audit／current-playback 擋下，**尚未上傳 Cloudflare**。已透過問答提出只適用本次 203 支版本的一次性例外（接受 picomatch 本地防護、暫緩全數本次實播），截至此筆交接尚無答覆，不能把 pending 寫成通過。

### 本次部署準備：ab3f048

- `release:public` exit 1，單一 picomatch advisory 的 16 high 傳遞影響；本地兩份 parser 防護檢查通過。獨立 `check-release.ts` exit 1：current playback registry pending。沒有改動這些門檻或歷史核可。
- 唯讀檢查後續 assertions：7 個核心案例的內容／影片核可綁定通過，病人指南與原審閱文件 digest 相符，content／brand 無錯誤，203 事件綁定齊全。最初診斷未設定 public launch mode，兩個 expansion case 顯示 false；補上與正式 checker 相同的 `ATLAS_PUBLIC_LAUNCH=decision-21` 後全部通過，不是核可變更。
- 發布 input digest 尚未重新綁定；需要在例外決策後建立可追溯的新發布紀錄，不能為消除錯誤而冒改歷史臨床核可。`ab3f048` 相對已完整驗證的 `5860800` 僅四份文件變更，既有 1,780 unit／230 public E2E 通過證據仍限於前述應用版本。
- Cloudflare CLI 4.125.0 與 Pages 讀取權限已確認；project `sports-injury-atlas`，正式部署 `28c920c4-d58e-409d-94f9-3d3100400383`，source `9d6f38a`，正式站 GET version 同為 `9d6f38a4159ec69715e8e185cc1c363b1430bf49`。回復版本已記錄，未執行 upload／rollback／merge。
- 相對正式版，wrangler 設定與 migrations 未變；`.env.example` 新增的都是本機測試用途註解，Functions diff 移除暫時的上游診斷 log，沒有新增 runtime secret 要求。Wrangler 初次因 sandbox 無法寫全域 log，改用已查證的 `WRANGLER_LOG_PATH` 寫入任務 output；並非登入或網站故障。
- 完整證據在 `output/deploy-request-20261118/{readiness,remaining-checks,cloudflare-production}.json` 與 `release.log`。原 checkout 未修改。若使用者同意本次例外，僅按明示範圍建立發布紀錄、保留 audit 失敗與實播 pending、完成正式 artifact 檢查後部署並驗證線上 SHA；不要把例外擴大為永久放行或新的醫療核可。

### 最新安全處理：5860800

- 最新應用 `5860800724dc5d947c0f2ed447200f4c7566dd21`，分支 `feat/site-quality-20261118`。文件提交與遠端 SHA 以 `git log -1`／`git ls-remote` 為準；既有 commit/push 授權持續有效。
- `scripts/security/picomatch-containment.mjs` 覆蓋 root 4.0.7、anymatch nested 2.3.2：拒絕解析後的 `+(...)`／`*(...)`，並在 parser／fastpaths 強制 `regex:false`，封住本次實際重現的重複 regex 路徑。包含良性重複 extglob 也會被拒絕；這不是所有 regex／任意不可信 pattern 安全保證。
- `postinstall` 自動套用；正常 dev/type/test/build/release 與 Astro 設定／預覽 build entry 核對防護。所有副本的版本、lock integrity、原始／修補後 parser hash 都必須已知，遺漏或未知副本拒絕執行；CLI check 失敗作廢舊成功報告。完整 audit 未豁免。沒有換依賴版本；lock 只新增 root `hasInstallScript:true`。
- 實際乾淨 `npm ci` 重裝 434 套件，兩份副本自動套用成功。原版相同 `+(*a)` 測例超過 1.5 秒；最終版隔離程序在 29／26 ms 明確拒絕（含啟動時間，非效能 benchmark）。
- 獨立 Pass 2 發現的原生 regex timeout、舊成功報告、只依賴 npm prehooks、註解過度承諾皆已處理。352 隔離案例 0 timeout，490 API 拒絕／14 良性相容案例通過；最終兩處註解改動後，審查者重新驗證官方 tarball → patch → installed byte 一致、執行邏輯與已測矩陣相同。有限範圍與 hash 詳見 `docs/reviews/2026-11-18-followup/security-repair-validation.json`。
- clean 5860800：124 unit files／1,780 passed；450 檔 type 0 errors／0 warnings／17 hints；公開預覽九組 E2E suites（桌機＋mobile Chromium）230 passed、30 skipped、0 failed，跳過項為不在公開成品中的既有 component lab／兩個 case fixtures。277 頁／203 影片預覽建置成功，deployable=false；不代表真人手機或完整影片播放驗收。
- `release:public` 仍在完整 audit exit 1：單一 GHSA 傳遞影響的 16 high。獨立 `check-release.ts` 也因 current-playback pending exit 1。重新 GET 正式站仍為 `9d6f38a4159ec69715e8e185cc1c363b1430bf49`。未上傳、未合併 main，feature push 不等於 CI／排程已啟用。
- 詳細說明 `docs/reviews/2026-11-18-followup/picomatch-containment.md`；原始 logs／tarballs／前後測例在 `output/security-repair-20261118/`。原 checkout 三檔 hash 再次核對未變。初次 dirty build 被既有 provenance 擋下，提交同位元組後建置成功，未放寬門檻。

### 前輪優化：7bfcfa0（歷史）

- 最新應用 `7bfcfa02fd28ec573aff36602f7a3b144cd5ca03`：長影片全長／片段狀態／文字入口、兩條來源待查補強、離線讀者測試彙整。分支 `feat/site-quality-20261118`；其後文件提交與遠端以 `git log -1`／`git ls-remote` 為準，既有 commit/push 授權持續有效。
- 乾淨版本 123 unit files／1,769 passed；桌機＋mobile Chromium 36 passed／0 skipped；448 檔 type 0 errors／0 warnings／17 hints；content 26 cases／3 overviews／1 update、plan 45、變更檔格式通過。`docs/reviews/2026-11-18-followup/optimization-validation.json` 保存本輪版本與範圍；logs、截圖在 `output/optimization-20261118/`。
- 預覽 `http://127.0.0.1:4325/` 實際 GET 為 7bfcfa0；277 頁／203 影片／noindex／deployable=false。已目視桌機1440px、手機390px截圖；自動測試另含320px與axe。這不是實際手機／VoiceOver／影片播放驗收。
- Watkins timeline[0] 改引 USC 3/24 官方賽後報導，限於首節受傷、未再上場，明示此報導沒有側別／韌帶名稱。只有這筆事件 checkedAt 前進；與先前兩筆合計三筆引用維護，保留 before/after。ESPN 仍遇驗證頁。
- Curry timeline[0] 僅以索引中的官方 YouTube 發布者／日期／主題核對；直接 open cache miss，沒有全片或字幕核可。這批 32 條現在 supported=32，其中一條僅 publisher metadata。原兩筆 unverifiable 完整留 `previous-unverifiable.json`。其他 2,541 條不是已完成；未把工作台狀態升為醫療審閱。
- `npm run quality:readers` 讀空名冊，輸出 0 位／successRate=null／acceptancePassed=false；加 `--require-acceptance` exit 1。主持人操作見 reader-testing/README.md。工具保留缺測分母、區分自填／先導、核對 session digest、時限與答案；先導重大誤讀也阻擋。獨立審查發現並驗證修正兩個問題：pilot 誤讀被排除、輸出 symlink/hardlink 可能覆寫輸入。14 項讀者工具測試由獨立審查者重跑通過。
- 實際 `release:public` 於 clean 7bfcfa0 仍被 picomatch 16 high 阻擋；官方 patched versions None。獨立 `check-release.ts` 仍因 current-playback pending exit 1；真人仍0、A01/T03核心時間窗未解、20教材待專業審閱。正式站重讀仍9d6f38a，沒有上傳。
- 初次 dirty build／3個provenance tests，以及沙箱 socket／tsx IPC 失敗已留log；提交同位元組並允許本機測試連線後完整通過，沒有放寬發布門檻。無新增依賴／lock變更／env／migration；原checkout三檔hash再次確認未變。

### 前輪發布要求：commit and push 部署

- 使用者已授權 commit、push、部署。`feat/site-quality-20261118` 已推送；同次 `git ls-remote` 核對遠端與本機均為 `bed2ed21a432227d96c8ee86e441259385b9b54b`，後續本筆交接提交以 `git log -1`／遠端查詢為準。沒有合併 main。
- 2026-11-18 15:09 UTC 重跑 `npm run release:public`，在安全檢查 exit 1：16 high，單一 picomatch GHSA-fc5q-39xc-vjpf 傳遞影響；官方 advisory 仍列 patched versions None。另獨立執行 `check-release.ts`，因 current playback registry pending 而 exit 1。
- 正式部署未執行、沒有上傳 preview artifact。同期正式站 `/version.json` 仍為 `9d6f38a4159ec69715e8e185cc1c363b1430bf49`。
- 這是發布前檢查失敗，不是要求使用者再次授權。先解決上游修補與目前 N=203 實播證據，再重跑完整發布流程；不要跳過檢查。
- 本次紀錄見 `docs/reviews/2026-11-18-followup/release-attempt.json`；本機 logs 在 `output/deploy-20261118/`。原 checkout 三個檔案 hash 再次確認未變。

- 工作目錄：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury/output/site-quality-20261118/implementation`。
- 分支 `feat/site-quality-20261118`；最新應用 `88cc73191a99bd866c48be76187320f65d2a5f58`，前一主要實作 `fd2cb3069279fc417a8670e2b061cb8f69510c9e`。其後僅文件交接，文件 SHA 請查 `git log -1`。
- 本機預覽 `http://127.0.0.1:4325/` 已實際 GET 確認 source 88cc731；277 頁、203 支影片、noindex、deployable=false。
- 原 checkout `feat/repo-launch-20261020` / f735ecb 不動；原三份 dirty/untracked 檔案對 `output/site-quality-validation/original-worktree-preservation.json` 的 hash 皆未變。不要在舊 `/private/tmp/injury-update-20261118` clone 繼續編輯。
- 使用者已核准 Curry 三個事件內容，維持 200 → 203（7 core、196 observation；202 YouTube、1 MLB）。勿重問，也勿延伸為另外 20 教材或全片實播核可。

## 前輪紀錄（以下數字為歷史，最新見上方 5860800）

`docs/reviews/2026-11-18-followup/README.md`、`validation.json` 為本輪索引與逐版本驗證證據。

### 來源語意

- 8 事件／32 條指定時間軸及摘要：30 supported、2 unverifiable。涉及 28 引用 URL，其中 26 讀到正文、ESPN 遇驗證頁、1 支 YouTube 訪談未在本批重讀。不是全站 2,573 條完成；當前公開引用總數 884。
- `semantic-review.json` 保存 claim 全文、context、digest、來源及短筆記；evidenceSha256 是**筆記的 hash**，不是外部原文 hash。reviewer 明示 AI assistant，medicalApproval/publicationApproval 均 false。
- Haliburton：區分球隊術前安排與 AP 術後完成報導，修正 injury／timeline／引用。Curry 腿後肌補 CBS 明確一週複評引用；已核准事件事實不變。`content-corrections.json` 綁 before/after，舊三條 needs-correction 保留，原歷史核可快照未改。
- 只有上述兩個實際修改事件的 checkedAt 更新 2026-11-18，其他事件不刷新。
- 重新驗證：`npm run quality:semantic-check`，先由當前資料重建工作台，再拒絕過期 receipt；已納入 CI。一般工作台仍是待審欄位，不自動把這批 AI 編輯紀錄升成臨床核可。

### 讀者測試

- `docs/reviews/2026-11-18-followup/reader-testing/reader-test.html` 可直接開啟；九任務、匿名 JSON 下載、不外傳、不儲存 localStorage；主持人手冊與 CSV 模板在同目錄。
- 正式計劃 4 醫師／治療師 + 4 學生 + 4 民眾；各主要任務 ≥90%，重大誤讀修正後重測。owner-pilot 另記，不能代替 12 人。
- **真實受測者仍 0 人**。已非同步問「由你先試做，還是直接安排醫療學習者與民眾」，截至交接沒有回答。不要憑空填結果，不代寄邀請。
- 表單工程測試證明九任務、未填結果阻擋、JSON 可下載、320px overflow=0、HTTP requests=0；合成資料留 output，未混入 results.json。
- A01：Curry 膝部 990 秒、Medina 499 秒、Tony Hawk 3362 秒皆無已審閱核心時間窗。T03 不能達標，需實看後整理，不能把全片長度當核心片段。跨裝置／VoiceOver 與必要字幕仍待真人核對。

### 安全

- 2026-11-18 官方 npm registry latest picomatch 4.0.7；GHSA-fc5q-39xc-vjpf 無 patched version。audit 16 high 是同一 advisory 傳遞影響；root 4.0.7 與 nested 2.3.2 均可在隔離程序重現。
- 依全域 AGENTS 安全 Pass2 要求，獨立 agent 完整檢查可達性與新閘門。未找到公開使用者輸入進 glob 的路徑；這不是證明所有部署版本安全。見 `security.md`。
- 發現並修補本機 release 沒有 audit 的缺口。`security:check` 使用 full lockfile + dev/optional/peer，高／重大、無效報告、網路／程序失敗都 fail-closed。`release:public`、`release:legacy` 都先檢查，`deploy:public` 繼承。每筆 severity 與 metadata 逐級重算；兩個 Pass2 缺口已修正並由獨立 agent 確認。
- `.github/workflows/dependency-security.yml` 每日 01:23 UTC，限制查詢時間，失敗也保存 artifact；**已 push 工作分支，未合併 default branch，所以排程未啟用**。既有 CI 僅在 PR／main push／手動 dispatch 觸發，這次 feature push 不等於 CI 通過。
- 實際 `npm run release:public` 已在 security:check exit 1 停止。`artifacts/dependency-security/` 已由本次 clean bed2ed2 的 audit＋lock hash 更新；此前 fd2cb30 證據在 validation.json／followup logs。原始 registry/tree 在 `output/site-quality-validation/security-followup/`。

## 驗證範圍

- fd2cb30：122 unit files／1,755 passed；桌機＋mobile Chromium 公開 UI 86 passed／0 skipped／0 failed／0 flaky。content 26 cases／3 overviews／1 update、plan 45、brand 通過。
- 88cc731：日期修正相同位元組 57 related unit passed；重新預覽建置及受影響頁 E2E 14 passed／0 skipped；type 445 files／0 errors／0 warnings／17 hints；32 receipts 當前綁定通過。
- 實際 HTTP 首頁 203 cards、更正 Haliburton 文字、Curry CBS 引用、投稿頁皆 200/noindex；log `followup-delivery.json`。
- 初次 dirty provenance 測試／build 失敗已留 log；依原規則 clean commit 後通過，沒有放寬門檻。所有 `followup-*` logs 在 `output/site-quality-validation/`。
- 無依賴版本／secret／環境變數／DB／服務變更。沒有真實投稿、外寄、merge 或正式部署；工作分支已依最新指示 push。

## 下一個 session 前 3 步

1. **核對工作版本與防護**：在上述 durable worktree 執行 `git status --short --branch`、`git log -4 --oneline`、`npm run security:containment:check`。讀 security-repair-validation.json；一般 `npm ci` 會自動套用，若使用 `--ignore-scripts` 必須明確 `npm run security:containment:apply`。來源工作另讀 optimization-validation.json，跑 `npm run quality:semantic-check`。不要把舊整站 0 語意完成欄位誤解為沒有獨立編輯 receipt。
2. **接續來源與真人任務**：兩條舊 unverifiable 已補強，勿重做；按 `output/site-quality-validation/content-review.json` 選其他高風險 claims，逐條保存引用與時間。讀者開始前實看 A01 的長訪談並整理核心時間窗；複製 round-template.json、填固定commit及真實已安排匿名名冊，按手冊彙整，不能代填真人結果或重問 Curry 核可。
3. **上游與發布條件**：`npm run security:check` 並查官方 advisory。本地防護不解除 audit；有官方修補則同時處理所有 nested 副本，重跑隔離及相容性測試，再移除 containment manifest／postinstall／入口檢查。未知版本被拒絕是預期，不要刪檢查來放行。另依 `docs/reviews/2026-11-18-site-quality/current-playback.md` 補全 N=203 owned HTTPS 實播及其餘 20 教材具名審閱。單元／來源文字通過不替代這些條件。

## 既有 Curry 影片證據與啟動

`docs/reviews/2026-11-18-curry-integration/` 是三事件使用者核准／metadata／部分播放證據。腿後肌 OYLixb3d7gA 210秒，膝部 iGY5kwMIS2g 990秒，腹斜肌 xKsiGQbv2XU 551秒。原平台部分播放不等於 full video／caption accuracy／本站 HTTPS。此前使用者切走 Chrome 後停止操作，本輪未操作其 Chrome。

```sh
export PATH="/Users/ethanstudio/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_PUBLIC_PREVIEW=1 node node_modules/.bin/astro preview --background --host 127.0.0.1 --port 4325
```

停止：`node node_modules/.bin/astro preview stop`；E2E foreground 用 `--ignore-lock`。本次發布要求已重新讀取正式站 version.json，仍為 9d6f38a；這只證明版本，未延伸為新的 HTTP 全站／Lighthouse／playback 驗證。前輪證據維持歷史範圍。
