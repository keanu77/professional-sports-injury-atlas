# HANDOFF - 2026-10-20

## 部署進行中

使用者已在 2026-10-20 明確授權「請部署」。本輪正在整理具名提交及 Cloudflare 預覽；正式發布仍需通過既有七日播放證據門檻。200 支影片的紀錄均已過期；已詢問是否明確允許既有 Playwright 自動化驗證，尚待回覆。不要重問部署授權。

Cloudflare production 基線仍為 `af901f14-2faf-4a6e-bd0f-30072e4fe2f4`，來源 `ac38ad9`；可作回復基線。官方產物檢查已在相同程式的暫存副本通過：273 頁、7 核心案例、15,112 本機連結。輸入摘要重新計算後綁定現有程式，未變更臨床、來源或播放門檻。

下列為上一輪完成時的紀錄；「未要求部署」等敘述由本節的新授權取代。

## 目前狀態

使用者在全站審查後授權「請根據你的建議幫我優化」。主要 UI/UX 實作及有界驗證已完成，保留在原工作樹，尚未 commit/push/deploy。不要再把本輪描述成僅審查或尚未授權實作。

- cwd：`/Users/ethanstudio/Documents/Vibe coding/professional-sports injury`
- branch：`feat/aaron-judge-rib`
- HEAD：`3be60d27729f6a4f64260ac40590b123a5e46d98`；本輪已從 `cc0b2fe` fast-forward 至先前核對的 `origin/main` 安全修補。
- 實作記錄：`docs/reviews/2026-10-19-ux-implementation/README.md`、`verification.json`、`source-manifest.json`。
- 先前未提交查核／審查文件保留：`docs/reviews/2026-10-19-live-sync/`、`docs/reviews/2026-10-19-ux-audit/`。
- 原專案 index 為空；未推送任何候選提交。Git branch 相對其舊 tracking branch 顯示 ahead 42，不能視為本輪新增 42 次提交。

## 已實作

1. 共用分類搜尋：body-parts、sports、situations、video-types 路由使用 VideoDiscovery，保留 URL／IME／24 筆分批與 no-JS 完整卡片。
2. 共用卡片：`src/styles/catalog-card.css` 統一核心／觀察卡；CTA 改真實連結，播放對比與輕量 hover；已移除 ObservationCard 舊衝突樣式。
3. 首頁收緊 hero／統計，分類採底線選取；保留原始 A 圖與前方社群；首頁首列表圖片不再 high priority。
4. 詳頁新增 DetailNavigation／DetailContents／DetailCategories／RelatedVideos；返回清單保留條件，長文桌面側欄與 sticky header 錨點 offset；來源 details 自動展開。
5. related-videos helper 綜合同部位／同運動／已知情境並列理由；跨公開核心／觀察影片推薦，排除自身與重複影片。
6. video-player 失敗僅在焦點仍在 stage 內時移回重試；可見載入狀態；preferences 字級上下限 disabled 語意與 live 百分比提示。
7. `src/lib/social/` + `src/pages/social/[kind]/[slug].png.ts` 產生公開詳頁文字 PNG；BaseLayout 使用相符 metadata。沒有新增套件、照片合成或品牌規則例外。首頁指定 PNG 不變。
8. 傷種總覽說明與部位庫入口、非 launch 分類連結 gate、舊 E2E 契約修正。

## 驗證與預覽

- `npm run check`：411 files，0 errors / 0 warnings / 16 既有 hints。
- 完整 unit：108 files / 1,577 tests 通過；最終 targeted 4 files / 74 tests 通過。
- public build：273 HTML、200 詳頁、200 PNG；review build：45 HTML、0 詳頁 PNG。
- 內容／品牌／依賴／格式檢查通過；public 全頁相對連結、資源、錨點、初始 iframe/inline script、OG 檔案尺寸檢查無問題。review 正常頁面通過，6 個虛構 fixture 連結另列。
- 原生 Chrome 已實測搜尋 Acuna→詳頁→原條件返回、Tyrese 真實 CTA、來源展開、87.5%／150% 字級回饋；深／淺色及相關卡片排版實看。
- Chrome iPhone 16 模擬確定為 393×852，手機篩選／URL 狀態與 Aaron Judge 長文錨點實測。未做完整裝置矩陣、Safari／VoiceOver、慢網路故障、E2E、Lighthouse 或全 200 支重播。
- 預覽 `http://127.0.0.1:4323/` 是靜態 public 成品，沒有 Cloudflare Functions 熱門 API；本機排行失敗是預期限制。
- 預覽 process 為 `python3 -m http.server 4323 --bind 127.0.0.1 --directory /private/tmp/injury-ux-validation-20261019/dist`。

來源 gate 要求乾淨 Git 歷史，因此驗證在獨立 clone `/private/tmp/injury-ux-validation-20261019` 進行；候選 commit `d5ffbe5ab182aa6e987f8113e40780a61920e92e`，43 個程式／測試檔與原工作樹相符。候選只在 /tmp，沒有推送，也沒有改原專案提交。原工作樹直接 build 仍會因 dirty-tree guard 拒絕，不能繞過或寫假摘要。

完整測試／build 使用 `/Users/ethanstudio/.local/share/mise/installs/node/24.14.0/bin`；一般 shell 是 24.19.0，符合 package engine 但歷史圖片測試要求精確 24.14.0。sandbox 的 socket EPERM 需在允許本機 socket 的環境執行單元測試。暫存 clone 使用實體 node_modules，不可用 symlink 造成 dirty path。

## 正式站與發布界線

- 此輪沒有修改線上站。之前 2026-10-19 實查 production `af901f14-2faf-4a6e-bd0f-30072e4fe2f4`，來源 `ac38ad9`；273 HTML + 10 hero 資源共 283 雜湊與 9/22 發布完全一致。
- 正式站 200 支影片；本機 main 安全修補與本輪 UX 均尚未發布。歷史 150 支記憶不能作為目前數量。
- `release:public` / `deploy:public` 未執行；來源／臨床／權利／輸入摘要與七日播放證據門檻未放寬。不得把 engineering build 當 release approval。
- 目前未要求 commit、push 或 deploy。若後續要求發布，先完成既有 gate，再部署及比對 live SHA；不要拿 PR 舊描述或未執行 E2E 當通過證據。

## 下一個 Session 的前 3 步

1. **執行** `git status --short --branch` 並讀 `docs/reviews/2026-10-19-ux-implementation/verification.json`，確認程式與 43 檔 source manifest 是否仍一致，保留先前審查文件。
2. **依使用者後續要求檢視** `http://127.0.0.1:4323/`；若服務已停止，在暫存 clone 重啟上述靜態預覽。補測 E2E／Safari／VoiceOver 與播放器慢網路焦點，不要重問已授權 UX 實作。
3. **僅在使用者要求提交／發布時執行** 精確檔案 staging 與現有 release gate；更新輸入綁定／播放證據後再部署，並重新核對正式成品。不得 `git add -A`。

## 保留決定與後續量測

- 原始 A hero：`src/assets/hero/a-all-sport-burst.png`，SHA-256 `3ef27311614a5df79b2731d3ec3f9576c09a3275de53250ee2a0c8be94318cc2`；不恢復舊圖說。
- 沒有新增醫療結論或 re-author 現有來源重點。
- DOM 虛擬化／分頁、critical CSS、熱門 API 快取、閱讀進度動態留待量測；沒有宣稱 CWV／SEO 提升。
- 不同詳頁分享圖已做，最近收錄排序尚需真實 addedAt；不要拿事件年份充當新增時間。
