# HANDOFF - 2026-11-18 Asia/Taipei

## 目前工作

使用者要求搜尋近兩年運動傷害影片／資料並更新，後續指定 Curry。已更新 5 個既有事件的後續報導，另整理 Curry 3 個獨立事件與 3 個影片候選。沒有推送、合併或正式部署。

- 更新工作目錄：`/private/tmp/injury-update-20261118`。
- 分支：`content/recent-injury-updates-20261118`，基底 main `4bfef220e2f2e525717f6aeb4eede751983f8bc8`。
- 資料提交：`a283d30`；既有並行測試修正：`24792c7`。之後文件提交見 `git log -3 --oneline`。
- 原工作目錄保留 `feat/repo-launch-20261020`、`f735ecb` 與原有兩份未提交交班資料，沒有在舊分支開發。

## 更新範圍

Haliburton、Watkins、Chloe Kim、Medina、Brignone：7 個資料檔、9 個新增來源網址，目錄仍為 200 筆。保留未知日期及來源精度；臨床診斷／機轉文字、醫療審閱簽章、原主影片、歷史 review snapshots 與 release input digest 未更動。

Curry 尚未加入目錄：研究資料分為 2025 左腿後肌、2026 右髕股疼痛（4 月 5 日復出）、2026 年 11 月 11 日右腹斜肌傷。兩週後重新評估不是回場日。NBA 原影片頁可讀；兩個 YouTube 頁面讀取失敗，瀏覽器工具回報 browser access host unavailable，播放未驗證，候選維持 research-only。

## 已實測

- Node 24.14.0、完整 Git 歷史、乾淨提交。
- Plan binding：45 documents；type check：0 errors／0 warnings。
- Content contract：26 cases、3 overviews、1 update，通過。
- 完整單元測試：109 files／1,619 tests 通過。
- Review build：45 pages；品牌資產與 review artifact：962 files 通過。
- 產物 Haliburton 頁包含 2026-10-21 復出與 10 月 28 日另一部位傷勢。
- 完整測試初次出現既有競態：重試影片可能已被前批計入。24792c7 僅修正測試樣本，產品統計程式未改；之後全套通過。
- 未做新影片實播、全站 E2E、HTTP hosting header、正式站版本比對或部署。

日誌：`output/recent-update-validation/`。正式發布仍需新的 input digest 綁定、播放及必要審閱證據；不能只改舊授權值讓 gate 通過。

## 接續步驟

1. 執行 `git status --short --branch`、`git log -3 --oneline`；讀 `docs/reviews/2026-11-18-recent-updates/README.md` 及 `changes.json` 查看逐筆更新。
2. 如繼續 Curry 收錄，讀 `research/candidates/2026-11-18-stephen-curry.json`，在可用瀏覽器驗證候選影片、上傳者、片長／時間窗與播放，再依新批次流程加入目錄。
3. 若使用者要求上線，先核對遠端 main 與正式 `/version.json`，按既有發布檢查取得當前證據；臨床簽核不得代填。無更多已確定的程式修正待辦。

不需要 DB migration 或新環境變數。只 stage 本次具名檔案，保留原工作目錄變更。
