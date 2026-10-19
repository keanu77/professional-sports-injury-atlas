# HANDOFF - 2026-10-20

## 最新授權與版本

使用者已授權「請部署」及「允許，使用 Playwright 完成驗證與部署」。不要再詢問部署或 Playwright 授權。

- 專案：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury`
- 發布分支：`feat/atlas-ux-20261020`；基線 main `3be60d2`。
- 實作提交 `822c2bc`；瀏覽器查核修正 `b4fecdd`。下一次提交綁定本輪播放與測試證據。
- `6f6a5e9` 已推 main 並部署 `0236233f`，後續確認首頁五個 AVIF 同名網址命中舊 CDN bytes。部署憑證無 Cache Purge 權限，因此將原始 A hero 以相同 SHA-256 改名 `a-all-sport-burst-r2.png`，產生新的衍生圖網址後再次部署。
- 本檔於最後部署前寫入；最終部署與 live 比對結果位於 `output/deploy-20261020/release-result.json`。讀到本檔後先讀該檔及 Cloudflare 最新 Production，不可將中間部署當作最新狀態。

## 已完成的變更

共用分類搜尋、24 筆漸進載入與 no-JS 200 筆、共用卡片與真實 CTA、分類返回條件、長文目錄與來源展開、相關影片與理由、播放器錯誤焦點、字級上下限提示、200 張個別分享圖、首頁間距與舊傷種入口。原始 A hero 與社群位置保留，沒有新增臨床結論。

本輪 E2E 修正：取消篩選按鈕前景／背景過渡以避免主題切換低對比；返回導覽移出 clinical article，醫療提醒重新維持首子元素。測試更新為目前已發布的內容／歷史照片展示，以及新字級與狀態欄位的精確定位。

## 驗證證據

- `docs/reviews/2026-10-20-ux-release/verification.json`、`playback.all.json`、`source-manifest.json`。
- 型別 411 檔：0 errors、0 warnings、16 既有 hints。
- 完整單元 108 檔／1,577 項通過；須使用 Node 24.14.0，且 provenance 測試要求乾淨提交。
- 公開版桌面／手機 E2E：210 通過、2 個非 launch review 測試略過。
- Review：176 首輪通過，2 個手機播放器逾時單獨重跑通過；210 個 public-only 按設計略過。
- 200 支影片全部真實播放通過；5 支必要字幕全部可開啟。影片未替換，觀看統計 POST 被攔截，不污染正式數據。
- 官方產物檢查：273 頁、7 核心／193 觀察、200 PNG、15,112 本機連結。
- 沒有宣稱 Safari／Firefox／VoiceOver 或 Lighthouse 通過。
- 舊實作記錄 `docs/reviews/2026-10-19-ux-implementation/` 是上一輪快照；以本輪 release 來源 manifest 為最後版本。

## 部署與恢復

- 候選播放預覽：`https://700109c4.sports-injury-atlas.pages.dev`（822c2bc），alias `atlas-ux-20261020`。
- 正式目標：`https://injury.sportsmedicine.tw/`，Cloudflare Pages 專案 `sports-injury-atlas`、branch `main`。
- 原正式基線／回復點：`af901f14-2faf-4a6e-bd0f-30072e4fe2f4`（來源 `ac38ad9`）。最終 production 以 release-result.json 和 Cloudflare 重查為準。
- `release:public` 仍要求乾淨提交、新 inputTreeDigest、原始來源／臨床綁定、七日內真實播放。沒有放寬任何門檻。
- 既有設定及 D1 migrations 本輪未變更；不得不必要地重跑 migration。
- Astro 7 preview 會背景常駐並讓啟動命令結束，Playwright 需使用已啟動的已知服務或適當 reuseExistingServer。不要把啟動命令結束當服務故障。
- 保留隔離驗證副本 `/private/tmp/injury-ux-validation-20261019`；本機預覽服務／埠先查是否仍存在，不猜測。

## 後續界線

原始 A hero SHA-256 `3ef27311614a5df79b2731d3ec3f9576c09a3275de53250ee2a0c8be94318cc2`；不恢復舊圖說。DOM 虛擬化、critical CSS、熱門 API 快取及最近收錄排序仍待真實量測／addedAt 資料。沒有宣稱 CWV／SEO 成效提升。精確 staging，禁止 git add -A。
