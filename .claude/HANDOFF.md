# HANDOFF - 2026-09-19 07:14（Asia/Tokyo）

## 進度

- 使用者目標「完成這個影片跟介紹上線」已完成；goal 狀態為 complete。
- 正式案例：https://injury.sportsmedicine.tw/videos/aaron-judge-2026-rib/ 。
- 全站 151 例（7 核心 +144 觀察頁）；精選 10 支、本站熱門前 10 名。沒有待發布功能。
- 最新提交：`2ef8124faefaa8978f700df4501966ac5cdd17e7`（`docs: record verified Judge rib production release`）。本次 handoff 已以 `git ls-remote origin refs/heads/main` 確認遠端 main 相同。
- 網站實際來源提交：`1bea30a48237eb43cd5717f39d091d1914eece0a`；其後 `2ef8124` 僅更新文件，不改網站輸入。

## 本次 Session 完成

- [x] 從既有 GitHub 專案建立本工作目錄，新增 Aaron Judge 肋骨獨立案例（`be3a299`）。
- [x] 加入 CBS Sports 影片、MLB／AP 來源、研究解說、復原時間軸、胸部傷害警訊；接入搜尋、分類、縮圖來源與播放統計白名單。
- [x] 影片為新聞解說，不是確定受傷瞬間。2019／2020 歷史背景、2023 腳趾與 2026 肋骨案例分開；4–6 週是影像複查，不是復賽承諾。回溯的可能起點標為 reported，不計算確定復原天數。
- [x] 更新過期的實際播放證據，保留先前與失敗紀錄（`b4edf63`、`1bea30a`）；原有核准及七日門檻未放寬。
- [x] 通過正式發布檢查，推送 GitHub main、部署 Cloudflare production，再核對正式 HTML、播放及搜尋（`2ef8124` 記錄結果）。
- [x] 使用者反映搜尋找不到：實際頁面為關鍵字 `aaron`、範圍「本站熱門前 10 名」。切換「改查全部影片」後顯示 3 筆（Rodgers、Judge 腳趾、Judge 肋骨）；使用者已回覆「有找到了」。只切換瀏覽器篩選，沒有修改搜尋程式或再次部署。

## 當前狀態

- 專案根：`/Users/ethanwu/Documents/Vibe coding/claude/Professional sports injury atlas`。
- Branch：`feat/aaron-judge-rib`；成果已推送至 origin/main，本機未切回 main。
- 產生 handoff 前工作樹乾淨；本次唯一新增未提交變更是 `.claude/HANDOFF.md`。此次只寫交接，未 commit、push 或 deploy。
- 發布前驗證：Node 24.14.0；Astro 0 errors／0 warnings、16 個既有 hints；97 檔／1,496 單元測試通過；桌機 Chrome＋Pixel 7 共 26 項整合測試通過，2 項 review-only 測試依條件略過。
- `content:check`、`brand:verify`、`plan:verify`、縮圖驗證、`release:public` 通過；上述為本次發布時紀錄，handoff 未重新執行整套測試。
- 正式成品 491 檔與測試版完全一致；正式站 196/196 HTML SHA-256 與成品一致。新片在正式域名實際播放成功，搜尋 `Judge 肋骨` 找到唯一新案例。
- 本機預覽 `127.0.0.1:14318` 仍在監聽（本次 lsof 核對 PID 11344）；這是易變狀態，下次先核對，不憑 PID 直接終止程序。

## 下一個 Session 的前 2 步

1. **執行** `git status --short --branch`、`git log -3 --oneline`、`git ls-remote origin refs/heads/main` — 確認真實工作樹與遠端；保留尚未提交的交接檔。
2. **讀取** `docs/reviews/2026-09-18-judge-rib/release.json:1`、`README.md:50`、`live.json:1` — 取得已發布版本、驗證範圍與限制。

**無更多任務。** 等待使用者新需求；不要因 resume 而重新部署、重新選片、重開已完成目標或擅自改成全域搜尋。若再反映搜尋找不到，先核對實際關鍵字與範圍，不先猜快取或改程式。

## 已知限制／已解除問題

- 沒有阻擋本次交付的 bug。搜尋目前會限制在所選「全部／精選／熱門」範圍，這是既有設計；`src/scripts/video-discovery.ts:104` 初始預設 all，`:152` 顯示範圍，`:260` 支援改查全部。使用者沒有要求變更此行為。
- Olympics 的 Samir Aït Saïd 影片 `Bt7EHTIivuA` 曾明確顯示 VPN／Proxy 限制。使用者處理網路後重驗成功；見 `docs/reviews/2026-09-18-judge-rib/playback.samir-after-vpn.json:1`。代理未更改系統網路設定，也沒有撤片或偽造證據。
- 全庫 `format:check` 有 169 個既有歷史檔案格式問題；本次變更檔案格式通過。不要批次重寫凍結證據。
- D1 production 的 migration 清單回覆 No migrations to apply，正式 `/api/popular` 為 200 且非降級。額外 sqlite_master schema/index 查詢遭 Cloudflare API 7403 拒絕，未宣稱完整結構稽核；本次無 DB 程式或 migration 變更。
- 影片播放證據只代表查核時環境，YouTube 之後仍可能變更限制。字幕品質保留 not-verified，沒有新增臨床或權利簽核。

## 關鍵檔案

- `src/data/videos/judge-rib.v1.json:1`、`event-judge-rib.v1.json:1` — 新片與逐項來源／時間軸。
- `src/lib/videos/expansion.ts:408` — 新批次 schema 與片單整合；`event-updates.ts:279` — reported 日期不計算 returnDays。
- `src/pages/videos/[slug].astro:185` — 此案例專用的胸部傷害一般處理警訊。
- `src/lib/videos/search-index.ts:42`、`src/scripts/video-discovery.ts:104` — 搜尋資料與範圍；`e2e/judge-rib.spec.ts:41` — Judge 兩案例搜尋回歸測試。
- `docs/reviews/2026-09-18-judge-rib/README.md:1`、`release.json:1`、`live.json:1`、`playback.production.json:1` — 發布及驗證證據。
- `scripts/public-launch/check-release.ts:28`、`check-artifact.ts:1` — 乾淨工作樹、輸入摘要、播放及公開成品門檻。

## 環境／部署注意事項

- Cloudflare Pages：`sports-injury-atlas`，production/main 部署 `4b8d4357-dd07-4de3-bca2-49a328af7a91`；https://4b8d4357.sports-injury-atlas.pages.dev 。
- 上一良好部署：`601eab27-5b43-46af-878c-d2ed7b9fdcfb`。回復操作需依當時問題與使用者授權決定。
- 已發布輸入摘要：`1044c4c4acb7d30d27059991e9974550c686b74c0b9e616449fe1bf002805240`；改摘要不能替代真實播放驗證或核准。
- 固定 Node 24.14.0。本次暫存執行檔仍存在：`/private/tmp/atlas-judge-node.3pGBJs/node-v24.14.0-darwin-arm64/bin/node`。不可假設系統 Node 或下次暫存目錄仍相同。
- `/private/tmp/atlas-judge.e2e.config.mjs` 為本次測試設定，使用既有 Google Chrome；暫存檔非永久依賴。
- 下次有新發布需求時，先妥善保存／提交工作樹，再以正確 Node 執行 `npm run release:public`。播放證據有七日效期，依各 checkedAt 判斷，不是假裝網站故障，也不能只改日期。
- 發布順序：成功公開建置 → 成品與已測試版一致 → 新功能存在 → 推送核對 → 部署 → 正式網域驗證。禁止把 review build 或失敗建置殘留 dist 直接上傳。
- 需補環境變數：無。需跑 migration：無。未完成部署步驟：無。沒有送出貢獻表單或測試郵件。
