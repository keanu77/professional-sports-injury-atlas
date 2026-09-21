# Professional Sports Injury Atlas

目前公開站：https://injury.sportsmedicine.tw/ 。2026-09-21 已完成 200 個不同傷害事件（7 核心＋193 觀察頁）、30 種運動、14 個部位；發布與驗證紀錄見 [200 例 release.json](docs/reviews/2026-09-21-catalog-200/release.json)。下方初始 bootstrap／review-only 說明保留為歷史，不代表目前尚未取得公開發布授權。

獨立的職業運動傷害影片圖鑑（injury-first、NBA 內容先行、多運動可擴充）。本 repository 由
2026-08-06 G0 bootstrap decision 授權建立，目前僅包含平台底座：strict 資料契約、逐案例
digest、fail-closed 發布治理、review-only build 與虛構測試 fixtures。

- 尚無真實 NBA 案例、醫療內容、hosting 或公開發布授權。
- Review build 一律 noindex；`npm run release:public` 在未取得公開授權前按設計失敗。
- 受控規格與計畫snapshot見 `docs/superpowers/`；授權綁定見 `docs/decisions/plan-binding.v1.json`。

## 開發環境

- Node 24.14.0（見 `.node-version`；不得以其他版本產生 lockfile）
- `npm ci && npm run verify`

`npm run verify` 依序執行 plan binding、Prettier、Astro/content checks、單元測試與覆蓋率、review build、四瀏覽器 Playwright＋Axe、本機 Lighthouse（Accessibility ≥ 0.95、LCP ≤ 2500ms）、品牌資產政策與 review artifact 驗證。`npm run release:public` 必須另行單獨執行並以非零結束，證明公開閘門 fail-closed。

## 文件

- `docs/architecture.md` — 選擇器邊界、digest 體系、build modes、RTP 唯讀匯入、noindex ≠ 私人。
- `docs/content-contract.md` — 全部受控 enum、診斷／經典案例／權利／時間軸規則與來源證據區分。
- `docs/operations/quarterly-curation-runbook.md` — 季度策展固定順序、影片失效替換與診斷衝突回滾。
- `docs/reviews/` — 平台驗證證據與 execution log。
