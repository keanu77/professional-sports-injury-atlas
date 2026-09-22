# HANDOFF - 2026-09-22 A2 首頁發布完成

## 目前狀態

**使用者指定的「A2 首頁配置＋手機適配＋搜尋區精簡」已完成並上線。沒有未完成的開發或部署。**

- 正式站：https://injury.sportsmedicine.tw/
- 網站來源提交：`710a721e469da411f927c415685fbb14e0029490`。
- Cloudflare Pages `sports-injury-atlas`，部署：https://d5c27656.sports-injury-atlas.pages.dev
- 專案與 branch 維持原工作目錄、`feat/aaron-judge-rib`；來源已推送至 origin/main，後續收尾文件提交不改變成品。
- 使用者要求「社群追蹤入口一樣在前面」仍然適用。

## 這輪完成

- 首頁採用 A2 青藍水光爆發多運動圖；桌機右側完整人物構圖，手機局部圖、深色文字背景。深淺色均可使用，標示 AI 情境圖。
- 「收錄影片」統計、「開始找影片」及「看受傷瞬間」入口。
- 桌機搜尋／類型／運動／部位一列；手機後兩者收合於「更多篩選」。已選條件可直接移除、網址與返回操作還原、移除與跨尺寸保留可見焦點。
- 保留 200 支不同事件、8 類多標籤、30 運動、14 部位與每批 24 支；IME、熱門競態保護、no-JS 全部靜態卡片及原有內容均保留。
- 只發布選定 A2。原稿 `output/imagegen/2026-09-22-hero-options/`、候選 D2/E2/F2 與原型 `output/design/` 留本機，`/output/` 已忽略。
- 資產例外綁定 A2 的精確路徑＋SHA-256，保留生成提示／核准紀錄；未放寬其他圖片、來源或臨床檢查。

## 驗證證據

完整索引：`docs/reviews/2026-09-22-home-hero/README.md`。

- Astro 397 檔、0 errors／0 warnings、16 既有 hints。
- 單元 1,545 項／105 檔通過；最終桌機 Chrome／Pixel 7 E2E 188 通過、2 review-only 略過。
- content、45 文件綁定、變更格式、原有發布門檻通過。規格及品質審查完成。
- 公開成品 628 檔、273 HTML、14,431 站內連結。正式站 **273 HTML＋352 公開資源，625／625 雜湊相同**；三個 Cloudflare 設定檔不是公開資源，其預期 404 記錄單列在 live.json。
- 正式 390px 搜尋 y≈665，0 橫向溢出，初始24支、A2已載入、0預先iframe。分享網址還原 Brees＋專業解說＋美式足球＋軀幹唯一結果；移除部位後焦點回到可見「更多篩選」。
- 320px／150% 與 1024px／150%、深淺色及圖說位置通過。未測 PageSpeed 分數，不宣稱 SEO 排名提升。
- 本次沒有重新逐秒看完200支影片；原有來源、臨床核准及七日播放門檻保留。

## 下次前兩步

1. `git status --short --branch`、`git log -3 --oneline`、`git ls-remote origin refs/heads/main` 核對本機與遠端；保留使用者後續修改。
2. 讀本輪 README、release.json 與新需求，僅處理使用者新指示。不要因 resume 重做選片、分類、重簽核准或部署。

## 關鍵檔案

- `src/pages/index.astro`：主視覺、統計與入口。
- `src/assets/hero/a-v2-fluid-burst.png`、`provenance.json`：A2 與生成來源。
- `src/components/atlas/VideoDiscovery.astro`、`src/scripts/video-discovery.ts`：首頁／8類型頁共用篩選。
- `scripts/verify-brand-assets.ts`、`tests/unit/brand-assets.test.ts`：A2精確檔案准入與拒絕測試。
- `e2e/home-hero.spec.ts`、`catalog-ux.spec.ts`：主視覺、篩選／焦點／字級回歸。
- `docs/superpowers/specs/2026-09-22-home-hero-discovery-design.md`、對應 plans 文件及 authorization：核准範圍。綁定文件不可改寫；收尾紀錄另存。
- 原始較早交接 `docs/handoffs/2026-09-22.md` 與 Git 歷史僅供追溯，不視為待辦。

## 環境提醒

- 固定 Node v24.14.0：`/private/tmp/atlas-judge-node.3pGBJs/node-v24.14.0-darwin-arm64/bin/node`。直接呼叫此 binary；npm 子程序曾意外使用系統 v26，造成嚴格版本測試失敗。
- Node 正式站驗證使用 `--use-env-proxy`。本機 socket 測試與瀏覽器可能需要沙箱外權限。
- 原有發布器與內容檢查要求乾淨已提交工作樹；不要降低門檻。此次來源輸入摘要 `b289d15d6170dba398a048d074e363706eded86773c10c900819283a500c5337`。
- Git push 若遭 HTTP transport 問題，既有單次參數：`git -c http.version=HTTP/1.1 -c http.postBuffer=67108864 push origin HEAD:main`。
- 本輪臨時預覽 ports14339／14340 已清理，瀏覽器恢復尺寸；正式首頁分頁保留供查看。無 migration、環境變數或其他待部署步驟。
