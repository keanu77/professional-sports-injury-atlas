# Decision 26 — 部位分類與稽核修正

使用者授權：「修正」及「在首頁請加上一個受傷部位的影片分類，方便點選進去選擇影片」。

首頁新增四個可直接連結的部位分類：腳踝 8 支、小腿與阿基里斯腱 4 支、膝蓋 1 支、大腿後側 1 支；各有獨立頁面，支援無 JavaScript 與目前分類提示。14 支影片各出現於一個部位，觀察影片只依已有部位標記，不推論診斷。首頁維持所有影片直接展示、YouTube 預設縮圖及無搜尋。

稽核 P1 三項已修正：ready 後 onError 回復備援與重試，舊播放器事件不能破壞新播放器；觀察影片按鈕改自然排版以免手機大字裁切；案例播放鍵焦點框移入可見範圍。播放相關 P2：無 JS 隱藏無作用的播放鍵、原始連結仍可用，新增讀屏狀態，5 支非零起點外部連結保留時間碼。

閱讀相關 P2：顯示既有 whatIsVisible、公開傷種／聯盟頁移除篩選、ACL 頁先顯示衛教、來源與機轉改中文顯示、缺回場資料改為本站未收錄、全站加入主站返回連結、歷史照片授權收進可展開區塊並澄清非現行封面。原病例、來源核准與醫療簽核內容沒有變動。

LaMelo 2023 後續診斷來源更新已形成 `2026-09-06-lamelo-source-update-draft.md`，待具名醫療複核後走核准綁定。低優先未使用 Noto 字型清理未納入本輪。

## 驗證

- Astro check：311 files，0 errors、0 warnings，16 既有 hints。
- Playwright：Chromium、Firefox、WebKit、mobile Chromium 68 項通過；新增 late error / retry / stale event 測試與無 JS 隱藏按鈕斷言。
- 乾淨驗證副本 release：28 頁、7 案例、7 觀察、4 部位分類、441 本機連結；來源與核准 release gate 通過。
- 公開瀏覽：32 個 HTML/JSON/robots 回應 hash 一致；19 頁 × 320（150% 字級）、390、1440 三組 = 57 頁面組合，Axe WCAG 零違規、全頁無水平溢位、播放前零第三方請求、縮圖解碼正常、分類完整覆蓋、無 JS 導覽可用。
- 人工問題回歸：28 頁 320px 深色大字無水平溢位；7 支觀察影片播放文字邊界與外部時間碼正確；焦點框 -4px、late error 重試、ACL 衛教排序與無 JS 連結通過。已目視首頁手機截圖。
- 無新套件、無新環境變數、無資料庫／migration；既有 ATLAS_BUILD_MODE 由 build 指令提供。Git 變更無密鑰，public gate 檢查無 private metadata 或缺失資產。

## 正式部署

正式 https://sports-injury-atlas.pages.dev/；Production/main `be2b7389-679f-47d8-85eb-3d5844e5c8cb`，來源 `ba2530166c281f89ab622009373bf765adb12712`。

2026-09-06T03:24:44.432Z 正式驗證：32 回應 hash 與來源一致，19 頁 × 3 尺寸的 57 組 Axe、無溢位、縮圖、分類與零預先第三方請求檢查全部通過；無 JS 可操作分类。

14 支正式實播全部成功；5 支指定非零起點皆正確。原五支字幕片的 LaMelo 2025 首測字幕控制逾時，實播已成功；單支重試實播與字幕開啟均成功。保留 first-attempt 與 retry，未抹除首次失敗。證據：`evidence/decision-26/`。
