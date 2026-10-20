# 開源 onboarding 與社群參與改善報告

日期：2026-10-21。基線：`291c8f95fd63502918570b532d8dea50a20b15c0`；工作分支：`docs/open-source-growth`。這是 repository 改善與本機驗證紀錄，不是正式網站部署、臨床審閱或推廣成效證明。

## 評估與原始狀態

計畫方向適合，但不需要重寫網站。基線已具備中英文 README、實際操作 GIF、MIT 程式碼授權與獨立內容權利說明、CONTRIBUTING、SECURITY、Bug／Feature／Content 三種 Issue 表單、PR 模板與 contributor CI。README 已準確區分 7 個核心案例與 193 個觀察頁；不應重新包裝成 200 份同等級臨床案例。

主要缺口是 Fork 作者沒有可獨立建置的純示範入口、文件回報缺少專用模板、開源參與與成效定義不夠具體，以及社群文案尚未按受眾分開。GitHub 初查沒有既有 Issues；About 與 11 個 topics 已存在。初查 Stars／Forks 都是 0，只是當時快照，不代表後續成果。Private vulnerability reporting API 回傳 enabled=true，現有 SECURITY.md 說明符合設定。

原主目錄位於舊 launch 分支且有未提交交班檔。本次從最新 `origin/main` 建立隔離 worktree，沒有覆寫原交班或切換原工作區分支。

## 各 Phase 實作

| Phase | 已完成                                                                                                    | 保留的人工作業與限制                                                 |
| ----- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1     | 中英文 README 增加角色入口、Fork Guide 連結與自然的 Star/Fork 引導；提供 About/topics 建議                | 未新增數量徽章或擴張醫療宣稱；About/topics 留待人工套用              |
| 2     | 英文為主、附中文重點的 Fork Guide；獨立 Astro 虛構示範；品牌／內容替換方式；模式、授權、Cloudflare 與 FAQ | 完整醫療內容 Fork 不是一鍵模板；帳號級 Fork 與 Cloudflare 上傳未執行 |
| 3     | 文件改善 Issue 表單；改善 CONTRIBUTING、PR checklist；labels 建議及 5 個範圍明確的 Issue 草稿             | 未建立公開 Issues、套用 labels 或指派工作，先讓維護者選擇優先順序    |
| 4     | Facebook 中文、LinkedIn 英文、開發者介紹英文與發布 checklist；檢查既有分享圖及線上 metadata               | 沒有外部發文、上傳 GitHub social preview 或修改正式站 SEO            |
| 5     | 本機 CI 對應檢查、示範邊界測試、完整 clone 實測與隱私友善的成效追蹤指南；CI 加入 demo check/build         | PR 檢查不代表 public release 或 production 已驗證                    |

## README 前後差異

| 項目               | 原先                                 | 本次                                         |
| ------------------ | ------------------------------------ | -------------------------------------------- |
| 核心價值、操作展示 | 已有具體使用情境與實際 GIF           | 保留，避免重複宣傳                           |
| 適合誰與下一步     | 散見使用情境與開發段落               | 增加醫療教學、開源貢獻、建立 Fork 三個入口   |
| Quick Start        | 指向原專案 review 開發               | 明確命名為參與原專案，另提供純虛構 demo 路徑 |
| Star／Fork         | 有自然 Star 邀請，沒有完整 Fork 指引 | 增加指南與權利界線，不以指標為貢獻目的       |
| 醫療／授權／數量   | 已有日期、200／7／193 區分及限制     | 原樣保留，兩種語言一致                       |

## 修改與新增檔案

修改 8 檔：

- `README.md`、`README.en.md`
- `CONTRIBUTING.md`、`LICENSE-SCOPE.md`
- `docs/development.md`
- `.github/pull_request_template.md`、`.github/workflows/ci.yml`
- `package.json`：只增加 4 個 demo 指令；無新增套件、版本或 lockfile 變更

新增 19 檔：

- `.github/ISSUE_TEMPLATE/documentation.yml`
- `docs/fork-guide.md`、`docs/github-discovery.md`、`docs/open-source-growth-report.md`
- `docs/community/initial-issues.md`、`docs/community/labels.md`、`docs/community/measurement.md`
- `docs/promotion/facebook-zh.md`、`docs/promotion/linkedin-en.md`、`docs/promotion/github-introduction-en.md`、`docs/promotion/release-checklist.md`
- `examples/fork-demo/astro.config.mjs`、`examples/fork-demo/tsconfig.json`、`examples/fork-demo/verify.mjs`
- `examples/fork-demo/src/demo.json`、`examples/fork-demo/src/pages/index.astro`
- `examples/fork-demo/public/robots.txt`、`examples/fork-demo/public/_headers`
- `tests/unit/fork-demo.test.ts`

本次無依賴版本、lockfile、secret 或 runtime env 變更；以 `preflight` 的型別、build、tests、依賴、env、Git 範圍逐項核對。

原站 `src/`、`public/`、`functions/`、`scripts/`、`migrations/`、醫療資料、`review/`、`research/`、歷史決策與審閱紀錄、既有部署設定均無 diff。MIT 新增範圍僅為本次原創、無臨床內容的虛構示範文字，未擴張到原站編輯資料或第三方素材。

## Fork Guide 實測

使用 macOS、Node 24.14.0、npm 11.9.0。以 `git clone --no-local` 從本機 repository 的已提交分支建立完整歷史 clone，新增 upstream remote 與測試分支，再執行全新 `npm ci`，安裝 433 個套件。沒有複製 `node_modules`、帳密或環境檔；demo 不讀取隨 Git 原始碼保留的上游 Wrangler bindings。這驗證 Git clone 後的操作，不等於操作 GitHub 帳號上的 Fork 按鈕。

- `demo:check`：2 檔，0 errors／warnings／hints。
- `demo:build`：1 頁，僅 3 個產物：`index.html`、`robots.txt`、`_headers`；外部資源為 0。
- `demo:dev`：localhost HTTP 200；1280px／390px Chrome 兩種寬度均無水平溢出、page errors、外部請求或 Axe 違規，截圖已查看。
- README 的原專案 `dev` 與 `preview`：最終乾淨 commit 上均 HTTP 200 且含 noindex；所有 4 個測試服務已使用 Astro stop 指令關閉。
- 客製化：替換 siteName、owner 與一筆虛構標題後，demo type check／build 再次通過；`demo:preview` HTTP 200，三個新值與 noindex 均在產物中。Cloudflare live upload 與 HTTP header delivery 不列為本機通過項目。

第一次 dev 啟動重現 Astro 7.2.8 的背景啟動路徑問題：CLI 先切換 cwd，仍傳入相對 `--root`，使子程序再次套用路徑並逾時。已將 demo dev／preview 改成先 `cd examples/fork-demo` 再啟動 Astro，沒有改依賴或停用檢查。此修正已用相同 clone 重驗 dev 與 preview 啟動。

## 品質驗證

以下完整檢查最初在乾淨的 `8bb3322` 執行；之後僅修正 demo dev／preview 的啟動目錄並補本文，最終結果依 PR 最新 commit 的 CI 檢查為準。

| 檢查                                       | 實際結果                                                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `npm run plan:verify`                      | 通過，45 個 bound documents                                                                                                      |
| `npm run check`                            | 通過，412 檔，0 errors／0 warnings，16 個既有 hints                                                                              |
| `npm run content:check`                    | 通過，26 cases、3 overviews、1 update                                                                                            |
| `npm run test:unit`                        | 通過，109 檔、1,612 tests；包含新增 8 個 demo 產物邊界案例                                                                       |
| `npm run build:review`                     | 通過，45 頁                                                                                                                      |
| `npm run brand:verify`                     | 通過，既有素材 provenance 檢查                                                                                                   |
| `npm run verify:review-artifact`           | 通過，45 頁／26 case pages／962 檔；noindex 與禁止外部嵌入等規則保持                                                             |
| `npm run demo:check`、`npm run demo:build` | 通過；CI 也新增這兩項                                                                                                            |
| 文件 links                                 | 17 份文件、78 個本機連結通過；13 個外部網址回傳 200（Issue chooser 會轉登入）；另 1 個草稿 main 分支新文件連結明確留待合併後驗證 |

失敗與限制保留如下：初次 sandbox unit run 為 1,591 pass／13 fail，其中 10 項因本機 socket 被 EPERM 阻擋，另 3 項因工作樹未提交。允許 socket 後為 1,601 pass／3 fail；3 項仍是既有 dirty-tree 保護。提交獨立分支後，1,612 全數通過。初次 review build 也被相同 dirty-tree 保護拒絕；乾淨 commit 重跑通過，沒有降低門檻。初次瀏覽器驗證有 server 尚未可連線及 Axe context 建立方式錯誤，修正測試流程後通過。

變更檔案的 Prettier 格式檢查、`git diff --check`、中英文 README 共同數字／入口連結一致性，以及 README／Fork Guide／development 中的 npm 指令存在性均通過。

沒有執行 public release/deploy、全站 E2E/Lighthouse、原影片播放、來源健康全面重查或正式站投稿。這些不屬於本次文件與隔離示範的通過宣稱。靜態 artifact 檢查不證明 Cloudflare 的 HTTP headers、登入保護或後端服務生效。

## SEO 與素材檢查

唯讀檢查正式首頁與首頁實際連結的 `/videos/kobe-bryant-2013-achilles/`。兩頁及分享圖回傳 200，canonical、description、Open Graph、`summary_large_image`、圖片尺寸與 alt 均存在。首頁分享圖為 1380×542；詳細頁為 1200×630。robots 與 sitemap 回傳 200。正式 `/version.json` 仍為基線 `291c8f9…`，本次沒有部署。

初次測試使用錯誤的 `/cases/…` 路徑得到 404；已由實際首頁連結更正為 `/videos/…`，沒有把它誤報為網站死鏈。詳細頁圖片未帶瀏覽器 User-Agent 的請求曾被 403 拒絕，使用一般瀏覽器 User-Agent 後為 200。這些 HTTP 結果不等於 Facebook／LinkedIn 分享快取已刷新。

既有 `docs/media/social-preview-1280x640.png` 已目視查看，包含站內畫面與插畫。沒有加入新照片，也沒有宣告既有素材可由 Fork 任意再授權。GitHub Settings 中的 social preview 是否已套用，本次未驗證。

## Issues、文章與追蹤

[5 個 Issue 草稿](community/initial-issues.md) 各含 Problem、Expected outcome、Implementation scope、Acceptance criteria、labels 與難度：

1. onboarding 文件的 deterministic link／fragment CI 檢查。
2. Fork Guide 完整繁體中文版本。
3. 隔離的本機 Cloudflare Functions／D1 操作指南。
4. WSL Ubuntu first-run 驗證。
5. 使用明確 allowlist 的 code-only starter export 設計。

這些是有已知缺口與交付條件的建議，不是已建立的公開 Issues；沒有製造假 Issue、PR 或互動數。完整文章：[Facebook 中文](promotion/facebook-zh.md)、[LinkedIn 英文](promotion/linkedin-en.md)、[開發者介紹英文](promotion/github-introduction-en.md)。均待人工發布。

[成效追蹤指南](community/measurement.md) 定義 Stars、Forks、外部唯一貢獻者、社群 Issues、已合併 PR 與合法可取得的網站彙總資料。區分維護者／bot／外部貢獻，不新增識別碼、追蹤服務或個資蒐集；沒有數據時填 not available。

## 未完成與下一步

1. 人工審查 PR 與最新 CI，再決定是否合併。本次不自行合併。
2. 人工選擇 Issues、套用必要 labels 與 About 建議，確認 GitHub social preview。
3. 合併後再檢查 default-branch Fork Guide 公開連結，按平台規則發布草稿。草稿中的 main 分支新文件連結在合併前不視為已上線。
4. Cloudflare demo 上傳、完整醫療 Fork 的權利／審閱建立、Windows／WSL、Firefox／WebKit 尚未驗證，原因與範圍已明列於指南。
5. 若之後部署原站，`package.json` 變動會改變 release input digest，必須取得新發布證據；不能沿用舊 receipt 或改寫既有醫療核可。
