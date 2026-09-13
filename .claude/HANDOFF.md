# HANDOFF - 2026-09-13 12:33（台灣時間）

## 目前狀態

- 專案：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury`；`main`；遠端 `keanu77/professional-sports-injury-atlas` 仍為私有。
- 首頁六個追蹤連結已發布：桌機位於標題區右上方，手機位於標題上方。首頁與頁尾共用相同目的地／圖示；點擊範圍至少 44 × 44px。
- 實際網站來源／已推送提交：`6e685ea026bdcd9a1cd1f0dbcd579882906adfea`。後續文件提交不改網站內容；目前 HEAD 請以 `git log` 核對。
- 正式站：`https://injury.sportsmedicine.tw/`；150 例（7 核心 +143 觀察頁）、精選 10 支、本站熱門前 10 名、首頁姓名／關鍵字搜尋。
- Cloudflare Pages `sports-injury-atlas` production/main：`601eab27-5b43-46af-878c-d2ed7b9fdcfb`，`https://601eab27.sports-injury-atlas.pages.dev`。
- 正式首頁 SHA-256：`68830c9c72ddd41f5bfb8fb4e7bbb484adf598878ae6d6f1b170c127a0df0f62`。195/195 HTML 與已驗證成品一致；首頁六個圖示、搜尋與精選皆確認生效。
- 本次需求完成，沒有待發布的功能。沿用使用者「授權推送跟更新」與首頁位置要求，沒有重新申請發布許可。

## 本次驗證

- Node 24.14.0；Astro 0 errors／0 warnings（16 個既有 hints）；1,493 單元測試；Chrome／手機 Chrome／WebKit 共 75 項整合測試全數通過。
- 原工作目錄有前次未提交 handoff，故使用乾淨隔離副本驗證。正式發布時副本切換至確切來源提交，重新通過 `release:public`，489 個成品逐檔匹配測試版才推送、部署。
- 本機 320px（150% 字級）、390／768／1280px 深淺色無水平溢出與 Axe 違規；六個圖示、44px 點擊範圍、鍵盤順序、停用 JavaScript 通過。
- 正式站另核對 320px（150%）、390／1280px 的圖示位置、150 支影片、Kobe 搜尋及精選 10 支；所有 HTML 含 7 核心案例與 143 觀察頁完全相符。
- Decision 27 五支既有影片的七日播放證據已更新，保留新舊實際播放紀錄；未新增醫療、字幕品質或素材權利簽核。
- 既有排版測試的 RSS 期待與未公開 Edwards 2023 路徑過時，改為原有個人網站與公開 Durant 頁，檢查正常 200／304 回應；沒有移除斷點幾何檢查。

## 之前已完成

- 9/12–9/13：101 →120 →150 例，機轉與後續紀錄整理、一般民眾版閱讀、分類／手機導覽、近 30 天實際播放熱門前 10 名、精選 6 →10，以及姓名／關鍵字搜尋。
- 搜尋隨全部／精選／熱門切換保留查詢，支援中文輸入法、延遲排行回應、清除／Escape、零結果與 API 錯誤；關鍵字不送出或儲存。沒有中文別名詞典或拼字容錯。
- 已另建乾淨 MIT 公開範本 `keanu77/sports-injury-atlas-starter`，來源 `22de8f38a84f0b24b45e5263e1bf19090b357b0f`。原專案仍私人；公開範本僅使用虛構示例。
- GitHub 個人首頁 `keanu77/keanu77` 在既有「運動傷害影片圖鑑」列的來源欄放入「公開範本（MIT）」；來源提交 `64d0ec5ae32903d320bb97202a3e999247022ba9`。不要另加獨立 starter 區塊。

## 下一個 Session

1. 先核對 `git status --short --branch`、`git log -3 --oneline` 與遠端；本文件不能代替 Git 真實狀態。
2. 讀 `docs/reviews/2026-09-13-home-follow/release.json`、`validation.json`，確認本次來源與正式部署。
3. 等使用者的新需求；不要因續接而重新部署已完成內容。

## 下次發布注意事項

- 固定 Node 24.14.0。`mise exec node@24.14.0 -- npm run release:public` 要求乾淨已提交狀態與正確輸入摘要。
- 輸入摘要：`72763dfefe1b97e0ce443556de511a97ec7710a57c0331498f7399952c77f7c6`；更新摘要不能取代核准或真實驗證。
- 播放證據均有七日效期：Decision 27 已於 9/13 12:21 更新；Decision 28、30、31、32、34 的既有證據將分別從 9/13 15:21、16:57、17:39、18:19、19:34 起到期，依每筆 checkedAt 核對。不是網站目前故障。
- 順序固定：建置成功 → 成品與測試版逐檔一致 → 新功能標記存在 → 推送核對 → 部署。不得因建置失敗而上傳舊 dist。先前搜尋發布曾發生舊成品事件，已完成處理，見搜尋 release-retry 記錄。
- 本次隔離副本 `/private/tmp/atlas-home-follow-review-01t4w7g_`；14339 預覽已停止。本機原 repo 的 dist 曾被失敗建置部分更新，請不要直接部署它。無新增依賴、環境變數或 migration，未送出表單或訊息。
- 前一部署：`044c5edc-1255-4217-8b77-a53fff85da6e`（搜尋版）。

## 關鍵檔案

- `src/components/layout/FollowLinks.astro`：共用六個追蹤連結、圖示、首頁尺寸與排列。
- `src/pages/index.astro`：首頁標題區追蹤連結、搜尋與影片卡片；`src/components/layout/SiteFooter.astro`：共用頁尾入口。
- `src/scripts/video-discovery.ts`、`src/lib/videos/search.ts`、`search-index.ts`：搜尋與範圍互動；`src/data/videos/discovery.v1.json`：精選順序。
- `docs/reviews/2026-09-13-home-follow/README.md`：本次驗證、畫面與正式發布證據。
- `docs/reviews/2026-09-13-video-search/README.md`、`2026-09-13-curated-10/README.md`、`2026-09-13-recent-150/README.md`：前次功能發布紀錄。
- 交接封存：`docs/handoffs/2026-09-13-before-home-follow.md` 與 `2026-09-13-before-session-handoff.md`。
