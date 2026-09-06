# Decision 21 — 民眾版與公開上線

## 本次授權與審閱

使用者要求盡快公開上線，核准 Cloudflare Pages 獨立站計畫；以舊版 http://127.0.0.1:4321/ 作為參考。後續要求「我要以能內嵌入的為主，運動傷害、運動類別、等級這些不限」。本次收到「預覽內容可以，請繼續」，回覆的是三份新衛教文字與 14322 預覽的集中審閱請求。

三份 patient guides 以各自原審閱文字 digest 記錄吳易澄於 2026-09-06 的確認，沒有改寫 26 筆歷史案例的臨床簽核或 148 項 D20 追蹤事實。

## 新公開流程與歷史邊界

舊 D17 review-set v2 仍禁止 public release；medical decision v1 仍不接受 v2。保留歷史合約與負面測試，`release:legacy` 保留原發布檢查。未將新版偽裝成歷史 v1，也未捏造 mini 私有主機的簽核 receipt。

Decision 21 使用獨立的 `src/data/public-launch.v1.json`：綁定這次預覽確認、審閱稿、完整渲染／資料／資產輸入樹及五筆完整案例 digest。公開選取只有在明確選擇 `ATLAS_PUBLIC_LAUNCH=decision-21` 時使用此決定；其他流程沿用歷史權利 gate。

公開版限定五筆目前來源允許內嵌且字幕可用的案例。這是來源平台原生播放器使用範圍，沒有宣稱取得影片重製或其他著作權授權。來源控制、TW 地區限制、字幕、既有臨床核准、來源 provenance、D20 官方出賽事實全部仍須通過；影片無法播放時保留原始連結。

民眾衛教由獨立 approved digest 控制；公開傷種頁只提供這份已確認內容，歷史未核准的長版總覽與課程待審狀態保留在本機 review。公開頁不含審閱路徑、內部 digest 或季度草稿。

## 可重跑的發布

`npm run release:public`：

1. 要求乾淨已提交 Git 樹、審閱稿與輸入 digest 相符。
2. 原 content check（含原來源與 D18/D20 完成紀錄）通過。
3. 每筆公開案例原臨床核准及完整資料 digest 相符；患者指南核准有效。
4. 逐筆 Chrome 真實播放／字幕證据存在，且距發布檢查不超過七天。
5. Astro public build，再驗證確切案例集合、站內連結、robots、無審閱資訊及點擊前無外部素材載入。
6. 寫入 Cloudflare 安全與快取 headers，產生逐檔 SHA-256 的公開產物 receipt。

`npm run deploy:public` 在以上流程成功後 direct upload 到 `sports-injury-atlas`，不需要建立 Git remote。

## 已執行驗證

本次回歸測試：單元 1300 項、四瀏覽器 256 項通過。Astro check 為 0 errors / 0 warnings（16 既有 hints）。字型效能修正後另驗證相關單元 50 項通過；最終正式產物首頁 Lighthouse LCP 1804ms、阿基里斯腱頁 1503ms，兩者 Accessibility 1.00。

Chrome 真實串流五筆均已播放且字幕控制開啟，證據在 `docs/reviews/evidence/decision-21/playback.chrome.v1.json`。四瀏覽器 UI 測試使用受控播放器，不能冒充跨瀏覽器真實遠端串流結果。

## 主機與本機

Cloudflare Pages `sports-injury-atlas` 已建立，公開網址 https://sports-injury-atlas.pages.dev；正式環境已部署並完成驗證。

原工作目錄是唯一交付來源。`/tmp/atlas-d21-checkout` 為完整歷史的乾淨驗證副本；14322 預覽服務其 dist。4321 舊版本未停止或覆寫。Node 使用 mise 的 24.14.0。

## 正式上線紀錄

- 正式網址：https://sports-injury-atlas.pages.dev/
- 部署識別：`0ed8d605-cc9a-4a51-9c21-2c05e054be91`，Production / main。
- 發布程式提交：`bce372132459ad2af5c658c26a36bbbb04b05f79`；主要功能提交 `40eb138`。
- 公開產物：15 HTML 頁面、5 案例、296 個有效站內連結，254 個檔案含 `_headers`。
- 正式環境逐檔核對 19 個 HTML / JSON / robots 回應 SHA-256 與本機產物一致。未開放審閱路徑；錯誤網址回傳 404。
- 390px 手機與 1440px 桌面各測首頁與五案例，Axe 無違規、無水平溢出；載入影片前沒有第三方請求。無 JavaScript 仍可閱讀。
- 五支影片均在正式 HTTPS 網址經 Chrome 實播，時間增加、非暫停、readyState=4；字幕均切換為開啟。
- 最後線上驗證：2026-09-06 09:07:44 台灣時間。
- 證據：本目錄下 `evidence/decision-21/{artifact.production,browser.production,playback.production,lighthouse.final}.v1.json`。

既有長版總覽、未納入首發的案例及完整審閱資料保留在本機；未建立 Git remote 或 push。日後新增公開案例或改動衛教需更新各自內容核准，並重新完成公開建置／實播檢查。
