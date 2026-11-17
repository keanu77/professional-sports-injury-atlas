# HANDOFF - 2026-11-18 Asia/Taipei

## 目前狀態

使用者確認「三個事件已審核，請繼續完成」。Curry 三個事件已各綁定一支不同影片並加入候選目錄，**200 → 203 支**（7 core、196 observation；202 YouTube、1 MLB）。不要再次把這三個事件列為尚待使用者內容確認，也不要把這次審核擴大到另外 20 份教材、影片全段或本站 HTTPS 實播。

- 工作目錄：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury/output/site-quality-20261118/implementation`。
- 分支：`feat/site-quality-20261118`；最新應用 commit：`d9cf054e45ca12c29131b253c8d6b35a28a3dc88`。後續只有報告／交接提交，最終文件 SHA 用 `git log -1`。
- 本輪主提交：`abe924a` 新增三事件；`92ea590` 納入 CI；`629dc97` 補分類／延伸閱讀；`d9cf054` 引用日期型別守衛。
- 本機預覽運行於 `http://127.0.0.1:4325/`，應用版本 d9cf054；277 頁／203 影片。搜尋 `Curry`、`柯瑞`、`柯里`、`庫里` 皆能找到三個獨立事件。
- 原始工作目錄仍為 `feat/repo-launch-20261020` / `f735ecb`；原三份 dirty/untracked 檔案 SHA-256 皆保持原樣。勿 reset/clean/checkout 原目錄。

## 本輪已驗證

- unit：121 files / 1,745 passed，source d9cf054。
- type：442 files / 0 errors / 0 warnings / 17 hints，檢查的工作檔位元組已原樣提交至 d9cf054。
- public desktop/mobile：224 passed / 30 review-only skipped / 0 failed / 0 flaky，source 629dc97。
- 最後一次只改審閱頁日期守衛與標題後，重新建置並測 Curry、搜尋、教材／審閱頁：14 passed / 0 skipped，source d9cf054。
- content：26 cases / 3 overviews / 1 update；plan：45 documents；brand 原始封面 provenance、變更檔格式、npm ls 皆通過。依賴、環境變數、服務與 DB migration 未改。
- 實際 HTTP：首頁 203 cards、三個 Curry 頁面 200/noindex、版本 d9cf054。
- 2026-11-18 07:22 Taipei 正式 `/version.json` 仍為 `9d6f38a4159ec69715e8e185cc1c363b1430bf49`。本輪沒有 push、merge、production deploy 或真實投稿。

## 審閱及實播證據

`docs/reviews/2026-11-18-curry-integration/` 包含完整 README、`event-content-approval.json`（使用者原句／三事件內容／雜湊）、`metadata.json`（原平台標題與上傳者／封面）、`media.json`（部分播放及限制）、`validation.json`（逐檢查版本）。

- 腿後肌：NBA on ESPN `OYLixb3d7gA`，210 秒；同日既有原平台 0/26/35/72 秒證據，本輪重核 metadata。未知回場日保留 null。
- 膝部：Golden State Warriors `iGY5kwMIS2g`，990 秒；本輪觀察 4/11/13 秒、英文自動字幕選單。4 月 4 日是訪談，4 月 5 日實際出賽；起始受傷日仍未知，不計復原天數。
- 腹斜肌：Brian Sutterer MD `xKsiGQbv2XU`，551 秒；本輪觀察 3/19/22 秒與英文自動字幕；截圖影片區沒有可辨識動作，因此僅列第三方專業解說，不宣稱受傷機轉畫面已審。兩週複查不是回場日。

三支已暫停；使用者切換 Chrome 視窗後停止 UI 操作，未再操控使用者新頁面。原平台部分播放不等於影片全段、字幕正確性、未登入／地區或本站內嵌通過。

## 下一個 Session 的前 3 步

1. **核對候選狀態**：在上述工作目錄執行 `git status --short --branch`、`git log -5 --oneline`、`curl -fsS http://127.0.0.1:4325/version.json`。讀 `docs/reviews/2026-11-18-curry-integration/README.md`；不要在 `/private/tmp` 的舊 clone 繼續修改，該 clone 仍停在較早版本。
2. **收集實際媒體證據**：依 `docs/reviews/2026-11-18-site-quality/current-playback.md` 在獲准的 owned HTTPS 預覽收集目前全部 N=203 的當期實播，另逐段核對必要字幕及觀看範圍。三事件內容的使用者確認已存在，無需重問；不能代填實播或把 source-platform 證據搬成 owned HTTPS。
3. **完成其他發布條件**：讀原 100 分計劃與 `learning-review.md` 完成其餘 20 教材具名審閱／讀者測試，重查依賴 advisory，執行 `node --import tsx scripts/public-launch/check-release.ts`。目前仍因 current playback registry pending 被拒；不要改舊 approval digest 或降安全門檻讓它通過。

## 較早工作及限制

前輪工程報告 `docs/reviews/2026-11-18-site-quality/implementation-report.md` 已加註歷史範圍。前輪的 876 URL 巡檢為 732 可讀、144 indeterminate，不是新版本或影片實播證據；Lighthouse 5/5、review player 34/34 也都是前輪量測，本輪未重做 field CWV。

先前依賴稽核剩 16 high dependency entries，皆關聯 picomatch GHSA-fc5q-39xc-vjpf，當時 4.0.7 尚無修補；本輪未重查新發布版本，不宣稱仍為最新。不得採用不相容的自動降版。

`output/site-quality-validation/curry-*` 保存本輪日誌；`curry-content-review.log` 與 CSV 為 203 筆工作清單。工作台一般主張／媒體審閱欄位不取代本輪三事件的精確使用者確認，核對 scope 時須同讀 approval JSON。

## 啟動／停止預覽

```sh
export PATH="/Users/ethanstudio/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_PUBLIC_PREVIEW=1 node node_modules/.bin/astro preview --background --host 127.0.0.1 --port 4325
```

停止：`node node_modules/.bin/astro preview stop`。測試用 foreground 加 `--ignore-lock`；此旗標只處理程序生命週期。`artifacts/public-preview/` 明示不可發布，不能直接當正式 artifact。沒有新秘密、環境變數或 DB migration。
