# HANDOFF - 2026-09-22 19:13 JST

## 進度

**目前任務全部完成並上線，無待辦開發或部署。** 最新設計採使用者附的原始 A 圖 `a-all-sport-burst.png`；已刪除「AI 合成情境圖 · 非實際賽事畫面」及圖說樣式。不要恢復先前 A2 圖或圖說。

- 最新發布證據 commit：`021970d2ce517d5ec006ed749104fae56ea72de9` — `docs: record verified homepage image replacement`；其後為交接文件提交，最新 HEAD 請以 `git log -1` 核對。
- 正式網站來源 commit：`ac38ad98a60279f9bc9598c789cd9b0c9d1aa895`；之後只補驗證文件。
- 整理交接前已核對 origin/main 與本機 HEAD 同為 `021970d2ce517d5ec006ed749104fae56ea72de9`。
- 使用者既定要求：「社群追蹤入口一樣在前面」。維持目前最前方入口。

## 本次 Session 完成

- [x] 首頁多運動主視覺、手機適配與搜尋區精簡（起始提交 `4fc85b0`，完整版本 `710a721`）。
- [x] 依後續指示換成附圖原始 A，並移除圖說（`ac38ad9`）；圖片來源紀錄與精確 SHA-256 准入規則同步更新。
- [x] 桌機／手機驗證、發布及正式資源核對完成，證據提交 `021970d`。
- [x] 保留 200 支不同事件、8 類多標籤、30 種運動、14 個部位、每批 24 支；搜尋／類型／運動／部位、網址／歷史、IME、熱門資料競態保護與 no-JS 靜態卡片均保留。

## 當前狀態

- 專案：`/Users/ethanwu/Documents/Vibe coding/claude/Professional sports injury atlas`。
- Branch：`feat/aaron-judge-rib`；沿用現有工作目錄，不另建 worktree。
- 寫入交接前工作樹乾淨；本次文件提交範圍僅 `.claude/HANDOFF.md`，使用者後續明確要求 commit and push。下次以 Git status 與 origin/main 核對同步狀態；本次未重新 build 或 deploy。
- Build／Test：最近發布版本通過；**本次 handoff 沒有重跑測試或線上全面驗證**，下列結果來自已提交的發布證據。
- 最新換圖版本：Astro 397 檔，0 errors／0 warnings／16 既有 hints；29 項圖片資產單元測試、16 項 Chrome／Pixel 7 相關 E2E 通過，無失敗／略過。45 份文件綁定、原有發布與成品檢查通過。
- 正式驗證於 `2026-09-22T07:40:24.920Z`：273 HTML＋10 新圖片衍生資源，共 283／283 SHA-256 相同；390px 指定圖片載入、圖說不存在、無橫向溢出、初始24支、搜尋 y≈641。
- 前一版完整 UI 回歸：1,545 項單元、188 項 E2E 通過，2 項 review-only 略過；這是換圖前的完整回歸，**不能說成換圖後重新跑了全部**。
- 本次檢查 ports 14339／14340 無監聽程序；沒有待清理的已知本機預覽。

## 下一個 Session 的前 2 步

1. **執行** `git status --short --branch`、`git log -3 --oneline`、`git ls-remote origin refs/heads/main` — 核對實際進度，保留本次交接檔與使用者後續修改。
2. **讀取** `docs/reviews/2026-09-22-home-hero-image-swap/README.md:1`、`release.json:1` 與使用者新需求 — 只處理新指示，不重做已完成的選圖、分類或部署。

**無更多任務。** 不因 resume 自行重跑建置、重新簽署醫療核准或重部署。原 A2 規格與舊交接屬於歷史紀錄；本次直接指示優先，見 `authorization.md:1`。

## 已知 Blocker／限制

- 無阻擋交付的已知 bug。沒有 migration、環境變數或部署步驟待補。
- 不把本次 UI／換圖驗證說成重新逐秒觀看全部200支影片；來源、醫療資料與原有七日播放門檻未變更。
- 未量測 PageSpeed 分數或 SEO 排名；不宣稱此類提升。
- 歷史完整成品包含3個 Cloudflare 部署設定檔；它們不是公開網址，不應要求 `/_headers`、`/_redirects`、`/_routes.json` 回傳200。一般公開資源及HTML仍需正確核對。

## 關鍵檔案

- `src/pages/index.astro:3`、`:55` — 目前圖片 import 與響應式 Picture；圖說已移除。
- `src/assets/hero/a-all-sport-burst.png` — 選定圖片；`src/assets/hero/provenance.json:1` — 生成來源與使用者新指示。
- `scripts/verify-brand-assets.ts:46` — 只允許目前圖片精確路徑與雜湊。
- `src/components/atlas/VideoDiscovery.astro:52`、`src/scripts/video-discovery.ts:67` — 首頁／8類型頁共用搜尋與手機篩選。
- `e2e/home-hero.spec.ts:11`、`e2e/catalog-ux.spec.ts:1` — 圖片、字級、篩選與分享回歸。
- `docs/reviews/2026-09-22-home-hero-image-swap/README.md:1`、`authorization.md:1`、`release.json:1`、`live.json:1`、`browser-live.json:1` — 最新核准與正式驗證證據。
- `docs/reviews/2026-09-22-home-hero/README.md:1` — 前一版完整 UI 檢查，僅供追溯。
- `output/imagegen/2026-09-22-hero-options/` — 本機原圖與 A2／D2／E2／F2 候選；`/output/` 被 Git 忽略，未選圖片不發布。

## 環境／部署注意事項

- 正式站：https://injury.sportsmedicine.tw/ 。既有 Cloudflare Pages：`sports-injury-atlas`。
- 最新部署：https://af901f14.sports-injury-atlas.pages.dev 。
- 目前輸入摘要：`87e20443a95c2da836ee88ecb27308bb852ae02507066a5436f211e2fc4b5e1b`。
- 圖片 SHA-256：`3ef27311614a5df79b2731d3ec3f9576c09a3275de53250ee2a0c8be94318cc2`。
- 固定 Node v24.14.0：`/private/tmp/atlas-judge-node.3pGBJs/node-v24.14.0-darwin-arm64/bin/node`；下次先確認此暫存執行檔仍存在。直接呼叫 binary，避免 npm 子程序意外使用系統 v26。
- 發布器與內容檢查要求乾淨且已提交的工作樹。維持既有門檻，不能只改摘要替代來源／臨床／播放證據。
- Node 正式站唯讀驗證使用 `--use-env-proxy`；本機 socket／Chrome 測試可能需要沙箱外權限。
- Git push 的既有 transport workaround：`git -c http.version=HTTP/1.1 -c http.postBuffer=67108864 push origin HEAD:main`；不需更改全域設定。
- 歷史交接可查 Git `021970d` 與 `docs/handoffs/2026-09-22.md:1`；歷史任務不是現有待辦。
