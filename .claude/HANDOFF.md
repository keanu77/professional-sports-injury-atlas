# HANDOFF - 2026-11-20 Asia/Taipei

## 接手位置與版本

本檔是目前交接入口；`.Codex/HANDOFF.md` 指向本檔。請在下列工作樹繼續，勿在原 checkout 或舊暫存 clone 修改應用：

```sh
cd "/Users/ethanstudio/Documents/Vibe coding/professional-sports injury/output/site-quality-20261118/implementation"
export PATH="/Users/ethanstudio/.local/share/mise/installs/node/24.14.0/bin:$PATH"
```

- 分支：`feat/site-quality-20261118`。
- 本輪開始時本機及遠端 HEAD：`23b4effb13f40557b324d8e90a2a1f18778f5dfd`，部署證據文件提交。工作樹原為乾淨；本次只有交接文件與封存。使用者已要求 commit and push；接手時以 `git log -1`、`git status` 與 `git ls-remote origin refs/heads/feat/site-quality-20261118` 核對提交及遠端狀態。
- 正式站：<https://injury.sportsmedicine.tw/>。本輪重新 GET `/version.json`，仍為 `efd5aa5aca4b6754b1ca4a6440b2aed20d7a67ad`；較新的純文件 HEAD 不代表正式程式落後。
- 遠端 main 本輪讀得 `4bfef220e2f2e525717f6aeb4eede751983f8bc8`。沒有合併 main；工作分支 push 不能當作 main CI 或每日排程已啟用。
- 原 checkout `/Users/ethanstudio/Documents/Vibe coding/professional-sports injury` 留在 `feat/repo-launch-20261020`／`f735ecb`，原 `.claude/HANDOFF.md` 及兩份未追蹤文件的 hash 本輪確認未變。保留這些既有修改，不 reset／clean。

## 已完成及證據範圍

- 已上線 **203 支影片**，包含 Curry 三個已由使用者審核的事件；7 個核心案例、196 個觀察影片。正式成品 276 HTML 頁、15,269 個站內連結、841 個檔案摘要。
- 2026-11-19 部署為 Cloudflare Pages `sports-injury-atlas`，部署識別 `9a38af65-df01-4d12-83d8-df61b0f4e4d8`。平台、正式站版本及抽查 JS 摘要當時一致。回復目標是前一部署 `28c920c4-d58e-409d-94f9-3d3100400383`／`9d6f38a4159ec69715e8e185cc1c363b1430bf49`，執行回復前需再核對及取得適用確認。
- 部署驗證紀錄：`docs/reviews/2026-11-19-release/deployment.json`、`verification.json`。原始 log、桌機1440px／手機390px截圖在 `output/release-20261119/`。
- 當時 Chromium 驗證：203 張卡片、柯瑞搜尋3筆、三個事件頁與縮圖、同意播放前 iframe 為0、無橫向溢出／page error、投稿頁200。API及正式 D1 綁定、3個 migration、5表與7索引也核對通過，資料庫查詢零寫入。
- 測試版本分開看：完整 1,790 unit 通過於 `f0d2cd5`；最後 Curry 分類格式修復 `179ce7e` 的20項相關測試通過；453檔型別檢查0 errors／0 warnings、17 hints。最終 `efd5aa5` 的203個事件／分類綁定與 production artifact 檢查通過。
- 本輪 handoff 只重新核對 Git、正式站版本、本地防護與現有待辦紀錄；沒有重跑上述完整測試、API／D1或影片播放驗收。

## 發布例外已使用，不能重用

使用者對「接受 picomatch 本地防護，但官方 audit 仍未通過；暫緩全數影片本次實播」回答「允許」，只適用上次203支版本。本次部署已使用該授權；`scripts/public-launch/release-authorization.ts:165` 會因 `deployment.json` 已存在而拒絕重用。不要刪掉消耗紀錄或延長期限。

`docs/reviews/2026-11-19-release/authorization.json` 綁定候選、程式、catalog／lock／原核可摘要與24小時期限。原 `src/data/public-launch.v1.json`、`docs/reviews/current-playback.v1.json` 及 Curry 原始媒體證據沒有改寫為新核可或播放成功。

一般 `security:check`、`release:public`、`release:legacy` 的門檻保留。不要把曾部署成功解讀成「零漏洞」「100分」或所有影片已驗收。依使用者最新共用規則，後續推送／開PR、發布／部署或刪除需有適用的確認；不推送 main、不 force push。既有單次發布例外不授權未來發布。

## 未完成工作

1. **上游安全修補**：最近一次完整 audit 在上次發布仍有16個 high 依賴項目，來自同一 picomatch `GHSA-fc5q-39xc-vjpf`。本輪未重查上游是否已釋出修補，不把舊結果當最新 registry 狀態。本地4.0.7與巢狀2.3.2防護本輪檢查通過，狀態為 `locally-contained-not-upstream-fixed`。正常 `npm ci` 自動套用；`--ignore-scripts` 安裝後須明確 apply。會停用重複 extglob 並限制已測 regex 路徑，不能保證任意不可信 regex 安全。程式與已知 hash：`scripts/security/picomatch-containment.mjs`、同名JSON；說明 `docs/reviews/2026-11-18-followup/picomatch-containment.md`。
2. **全數實播**：`docs/reviews/current-playback.v1.json` 本輪仍為 pending、receiptFiles空；`scripts/public-launch/current-playback.ts:180` 會拒絕發布。依 `docs/reviews/2026-11-18-site-quality/current-playback.md` 收集真正播放進度、版本與必要字幕證據，不能用HTTP／metadata或原平台部分播放代替。
3. **真人讀者測試**：`docs/reviews/2026-11-18-followup/reader-testing/results.json` 仍0人、`acceptancePassed=false`。計畫為4位醫師／治療師、4位學生、4位民眾。使用同目錄README、reader-test.html、round-template.json；先導不得代替正式名額，不能填合成結果或未授權外寄邀請。
4. **核心片段與醫療審閱**：A01/T03 尚待 Curry 膝部990秒、Medina499秒、Tony Hawk3362秒長片的已檢視核心時間窗；不能把片長或預設起點當完成。另20份教材仍待專業審閱。Curry三事件的既有審核不需要重問，但不能擴大為其他內容核可。
5. **來源語意**：既有8事件32條已建立支持紀錄，其中Curry發布資訊1條僅官方影片索引metadata，不是逐字稿或全片驗證；其餘2,541條不算完成。工作台與證據分別在 `output/site-quality-validation/content-review.json`、`docs/reviews/2026-11-18-followup/semantic-review.json`。醫療核可與AI編輯紀錄保持區別，變更引用或文字後需重驗digest。

## 下一個 session 前3步

1. **重新核對版本與防護**：在上方工作樹執行下列命令。預期仍辨識本地修補，並確認正式版本是否有其他人更新；若發現未提交修改，先核對來源，不為通過建置而丟棄。

   ```sh
   git status --short --branch
   git log -6 --oneline
   curl -fsS https://injury.sportsmedicine.tw/version.json
   npm run security:containment:check
   ```

2. **重查安全狀態並選擇相容修補**：執行 `npm run security:check` 並讀 `artifacts/dependency-security/summary.json`，查官方 advisory／npm版本。若已有修補，同時處理 root與巢狀副本，驗證既有隔離案例及專案相容性後再移除本地限制；若尚無修補，保留失敗紀錄，不套用已消耗例外。正式變更前先讀最近共同AGENTS規則。

3. **列出實播工作清單與安排讀者**：先讀 current-playback.md及reader-testing/README.md，執行下列不會播放或送出資料的命令。接著在版本一致的正式站／已獲授權預覽收集真實播放與讀者紀錄，使用新的日期目錄保留歷史證據。實際缺少的真人安排由醫師提供，未安排就維持待完成。

   ```sh
   mkdir -p output/handoff-20261120
   node scripts/public-launch/verify-expansion-playback.mjs --inventory > output/handoff-20261120/playback-inventory.json
   npm run quality:semantic-check
   npm run quality:readers
   ```

   實播前先將確認過的文件整理成乾淨提交並重新核對線上SHA；若正式站仍是 `efd5aa5aca4b6754b1ca4a6440b2aed20d7a67ad`，播放指令應指定 `--source-commit efd5aa5aca4b6754b1ca4a6440b2aed20d7a67ad`，避免把較新的純文件HEAD誤當正式程式版本。推送與再部署另依適用確認處理。

## 其他接手注意事項

- 本次提交範圍限兩個HANDOFF及兩份封存，已取得使用者 commit and push 指示；提交與遠端狀態依上方 Git 命令核對。本次沒有部署或資料庫變更，避免混入原checkout的既有工作。
- 目前沒有新增 migration或runtime secret需求。正式部署的詳細環境證據在verification.json；不要輸出任何憑證或帳號資訊。
- 未驗證：全片播放／字幕正確性、真正手機／VoiceOver、負載及投稿實際寄送。不要為驗證而送出真實投稿或有效播放事件。
- 不使用 Zeabur。醫師定稿一字不改；醫療敘述保留不確定性，骨壓力性損傷一律用「骨壓力性損傷（BSI）」。
- 舊交接全文已封存：`docs/handoffs/2026-11-20-before-closeout-codex.md`、`docs/handoffs/2026-11-20-before-closeout-claude.md`。其中未部署、舊SHA與當時授權文字皆為歷史，不覆蓋本檔目前狀態。
