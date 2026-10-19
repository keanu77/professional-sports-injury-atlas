# HANDOFF - 2026-10-20 · Repository launch preparation

## 目前任務與授權

使用者同意依 `repo-launch` skill 整理 repository，選擇自有程式碼採 MIT，並確認「沒有」可公開提及的實際使用場合與人數。不要寫使用人數、教學成效或虛構臨床故事。第三方影音與醫療編輯內容另有授權範圍。

先前 Playwright 與網站部署已獲授權並完成。使用者於本輪回覆「我改公開了」；已由 GitHub API 與無登入 HTTP 確認 Public。PR 尚未合併、release 尚未發布，勿把可見性變更當成合併或 release 完成。

## GitHub 與交付

- 分支：`feat/repo-launch-20261020`，來源 main `7adff42`。
- Draft PR：<https://github.com/keanu77/professional-sports-injury-atlas/pull/3>。
- Draft release：`v0.1.0`，<https://github.com/keanu77/professional-sports-injury-atlas/releases/tag/untagged-40d54e1d9fcdd1439985>，target 為 launch 分支；發布前需改到實際合併提交。
- 最後實作／素材與驗證提交：`12e2eba`；本交接另以文件提交保存。沒有未完成的程式修改。
- Repository 現為 Public；介紹、homepage 與 11 個 topics 已更新，私人漏洞回報已啟用。main 仍未包含新版 README 與 MIT 文件，需先完成 PR #3 合併。
- Release 的 5 個附件皆已上傳，遠端大小與 SHA-256 均與本機一致。
- `docs/launch/verification-2026-10-20.md`：可公開的驗證範圍與待辦。
- `docs/launch/2026-10-20-圖鑑分享草稿.md`：FB 與 X 草稿，未發布。
- `docs/media/`：約 26 秒完整 MP4、13 秒短版、3.54 MB GIF、1280×640 PNG（212 KB）、manifest。

## 已完成與驗證

雙語 README、MIT LICENSE、LICENSE-SCOPE、第三方與字型授權、CONTRIBUTING、SECURITY、issue/PR templates、Ubuntu 24.04/Node 24.14.0 CI、CHANGELOG 與 release 草稿。

乾淨 Ubuntu 首測發現 Linux 分享圖無法可靠載入既有 WOFF2。`src/lib/social/render.ts` 與 `render-worker.ts` 已改用 `fonts-noto-cjk` 的原生 TTC 與明確缺字型錯誤；macOS 保留既有字型。修正沒有更動醫療文案或公開發布門檻。

- 完整候選 `0e8b401`：Ubuntu 型別 0 errors / 0 warnings / 16 hints；108 檔、1,577 項單元通過；review build 45 頁；review artifact 通過。
- fresh npm ci 9 秒；首次含圖片轉檔 build 179 秒；最後快取 build 約 8 秒。README dev 指令已啟動，首頁 HTTP 200。
- macOS 型別與六項分享圖測試通過；Ubuntu 中文 PNG 已實際檢視。
- 候選之後只有素材、文件與交接變更；已比對 production input paths 與 `0e8b401` 無差異。
- Chrome live 錄影：Acuna 搜尋、事件來源、返回搜尋條件通過，無 page errors，POST 全部攔截，未播放原始影片。
- 388 個歷史 commits 的 Gitleaks 掃描有 3 個測試 fixture 字串；逐項確認不是正式憑證，沒有新增 scanner finding。不能把模式掃描說成完整隱私／授權保證。
- 紀錄在 ignored `output/repo-launch-20261020/` 與 `/private/tmp/injury-launch-linux/`。不要將帳務錯誤細節或完整掃描資料推到公開文件。

## 當前阻礙與下一步

1. **讀取 PR #3 最新 CI 結果**。先前 Private 時的失敗發生在任何 step 執行前，不能當成 Public 之後的狀態。公開後已重跑 `39297603918`，本次文件提交也會觸發新檢查；以 `gh pr view 3 --json statusCheckRollup,headRefOid` 讀取最新結果，不以本機通過宣稱 GitHub CI 綠燈。
2. **CI 綠燈後請使用者審閱並合併 PR**。repo-launch skill `/Users/ethanstudio/.claude/skills/repo-launch/SKILL.md` 明確要求使用者自行合併 PR。Public 已由使用者完成，不再詢問是否要公開；私人漏洞回報已啟用，不需重複設定。
3. **合併後更新並發布 release**。將 draft v0.1.0 target 改到實際合併 SHA，CHANGELOG 改成實際發布日期。依 skill，Social preview 與社群發文由使用者手動完成；圖片在 `docs/media/social-preview-1280x640.png`，GitHub Settings → General → Social preview。

本輪沒有 GitHub Pages 設定；Cloudflare 正式網站就是 Live Demo。不要將含研究與審計資料的 `docs/` 當 Pages 輸出目錄。

## 正式網站狀態與未變更的門檻

前一輪 UX 部署已完成：main / production `7adff42ee523cbbf5fa5eb641a169be1ac427c53`；Cloudflare deployment `a5302076-7b2c-423a-9517-e7be7f7cc1c6`。證據在 `output/deploy-20261020/release-result.json`。公開站仍是 <https://injury.sportsmedicine.tw/>。

前輪 200 支影片真實播放、5 支必要字幕、273 HTML、828 public files 比對的結果在 `docs/reviews/2026-10-20-ux-release/`。本次僅做錄影流程，沒有重新宣稱 200 支播放測試。

本輪 Linux 修正會改變 production inputTreeDigest。沒有替新程式碼更新舊 approval、沒有 redeploy；後續若需部署，仍須正常收集並綁定新發布證據，不能只抄新 digest 讓 gate 通過。無 DB migration。

原始 A hero 保持 `src/assets/hero/a-all-sport-burst-r2.png`，SHA-256 `3ef27311614a5df79b2731d3ec3f9576c09a3275de53250ee2a0c8be94318cc2`。不改回會命中舊 immutable CDN 的舊檔名。

## 隔離環境

OrbStack VM `injury-launch-20261020` 已停止並保留，2 CPU / 4 GB，Ubuntu 24.04 ARM64。只掛載 `/private/tmp/injury-launch-linux` 至 `/mnt/launch`，未掛載使用者 home。不要未經同意刪除 VM。驗證 repo 位於 VM `/home/ethanstudio/atlas-launch/repo`。

精確 staging，禁止 `git add -A`。不重複詢問已批准的 MIT、無使用人數與 Playwright 授權。
