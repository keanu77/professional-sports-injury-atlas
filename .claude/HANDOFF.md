# Current handoff — 2026-09-06 Decision 23

使用者確認九支候選、字幕非必要及事件核對後加入，回覆「可以」。本次已完成並發布，沒有待確認項目。

## 正式狀態

- https://sports-injury-atlas.pages.dev/
- 公開影片由5增至14：7既有核准案例（新增Tatum、Haliburton）＋7動作觀察影片，涵蓋籃球、網球、田徑、體操、羽球、CrossFit、排球。
- 來源commit `9fa63393469ec67db9fbccdb772da0a3574e10ce`；Pages Production/main `7c0c00fc-32bb-4483-b25f-919027742b2a`。
- 正式驗證2026-09-06T02:12:15.884Z：28個HTML/JSON/robots回應雜湊匹配；15個首頁/案例/觀察頁手機桌面Axe與播放前零第三方請求通過；新增9支全部實播通過，包含時間碼。
- 單元1305、四瀏覽器256通過；Astro check 0 errors/0 warnings、16既有hints。320/390/1440篩選、搜尋、無JS內容驗證通過。無新依賴、無新環境變數。

## 實作與核准邊界

- `src/data/videos/expansion.v1.json` 與 `src/lib/videos/expansion.ts`：獨立D23授權，兩個原病例canonical digest＋七個observation clips。沒有新醫療簽核，不改原始26病例、D18/D20追蹤或既有三份衛教核准。
- 字幕例外只適用此次核准URL與 `ATLAS_PUBLIC_LAUNCH=decision-21` 公開協定；未解除provider/embed/region/clinical驗證。
- 新頁 `/videos/[slug]/` 明示動作觀察，不根據標題判定骨折/韌帶/分級。Zverev/Marín有來源支持個人正式復賽日期，其餘不虛構回場天數。
- 影片起点：Zverev1340、Redmond15、Strug0、Marín35、Foucher35、POV215、腳踝片0秒。無影片截圖或遠端縮圖進公開網站。

## 發布與重驗

- Node `/Users/ethanstudio/.local/share/mise/installs/node/24.14.0/bin`。
- `npm run release:public` 必須clean Git、inputTreeDigest、原病例/醫療/provenance/D20與D23證據通過，才建24頁/7案例/7觀察。
- `npm run deploy:public` 重跑release後更新既有Pages專案。未建立Git remote或push。
- D23證據為 `docs/reviews/evidence/decision-23/playback.preview.v1.json`，須7天內在本專案HTTPS網域實播。兩支Olympics在localhost不能播、HTTPS能播，不能以本機失敗推斷正式失效。
- `node scripts/public-launch/verify-expansion-playback.mjs <origin> <output> [slug]` 可驗9支或單支；正式版9支全部通過。POV預覽首輪緩衝逾時，獨立重測通過，保留first-attempt紀錄。
- `node scripts/public-launch/verify-browser.mjs <origin>` 比對root receipt與正式bytes/無障礙。root dist為正式產物。
- 完整說明 `docs/reviews/2026-09-06-decision-23-video-expansion.md`。

## 下一步

無更多已授權待辦。若使用者再要求擴充，沿用實播、事件核對、診斷與回場來源分明的標準；需要新增醫療主張時另外核對，不能借用D21衛教簽核。

Docs-only後續commit不改網站輸入，不需只為commit ID而重新發布。舊D21/D22交接保留於Git歷史e4d145d。暫存隔離副本 `/tmp/atlas23-checkout`，14324為本機預覽；舊4321參考未更動。
