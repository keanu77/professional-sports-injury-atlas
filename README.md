# Professional Sports Injury Atlas

獨立的職業運動傷害影片圖鑑（injury-first、NBA 內容先行、多運動可擴充）。本 repository 由
2026-08-06 G0 bootstrap decision 授權建立，目前僅包含平台底座：strict 資料契約、逐案例
digest、fail-closed 發布治理、review-only build 與虛構測試 fixtures。

- 尚無真實 NBA 案例、醫療內容、hosting 或公開發布授權。
- Review build 一律 noindex；`npm run release:public` 在未取得公開授權前按設計失敗。
- 受控規格與計畫snapshot見 `docs/superpowers/`；授權綁定見 `docs/decisions/plan-binding.v1.json`。

## 開發環境

- Node 24.14.0（見 `.node-version`；不得以其他版本產生 lockfile）
- `npm ci && npm run verify`

詳細架構與資料契約文件於 Task 9 補齊（`docs/architecture.md`、`docs/content-contract.md`）。
