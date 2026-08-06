# 季度策展 Runbook

每季更新依固定順序執行，不得跳步或並行合併步驟。每一步的產出都是下一步的輸入；任一步失敗即停在該步，不得為了進度放寬 schema、來源、醫療、權利或發布門檻。

## 固定順序

1. **Discover** — 依當期授權的 source-discovery plan 搜尋候選事件，逐列寫入 `research/candidates/**`（researcher 專屬路徑）。只記來源事實，不寫醫療內容。
2. **Deduplicate** — 對照 registry 的 active source-entry set：候選 ID、事件識別（球員／日期／對手／賽事）與 canonical video URL 全域唯一；與既有案例重複者剔除，correction 才能重用被 superseded 的身分。
3. **Source verification** — 每個納入來源由 root 全量重查：live 開啟原頁、記錄 accessedAt、確認 publisher／independence group；打不開只能標 `not-obtained`，不得猜測。
4. **Video verification** — 確認主影片為官方／權利方上傳的 `in-game-injury-event`、host 在 provider registry 允許清單內、時間窗與 caption 狀態實測；不下載、不剪輯、不截圖。
5. **Diagnosis verification** — 確認 first-party 診斷來源（或符合經典案例例外的雙獨立 secondary），記入 confirmationStatus；來源互相矛盾即 `conflicted`，不得進入核准。
6. **Write two layers** — 撰寫一般讀者與專業兩層筆記；professional 內容全部以原子 claims 綁 `teaching-evidence` 來源，欄位文字必須恰好等於 claim 串接。
7. **Validate** — `npm run content:check`＋`npm run test:unit`；跨欄位、跨案例與 registry append 驗證全綠。
8. **Digest** — 產生 clinical／video-source digest 與 review set（`npm run review-set:generate`）；任何後續內容改動都會使 digest 過期並要求重審。
9. **Named medical review** — 具名醫療審查者對 served review build 逐案審查，產出 durable medical-review decision；agent 不得代填姓名或自簽核准。
10. **Private QA** — 在存取控制實測通過的私人部署上驗證 served artifact（manifest／receipt 完整比對）；noindex 不等於私人。
11. **Separately decide release** — 公開發布是獨立決定：`SitePublicationDecisionV1`、per-case rights decisions、course link 授權與索引授權齊備後，才由 release 計畫 append 新的 release record。

## 影片失效替換程序

1. 例行或 external:verify 發現 embed／URL 失效時，先把案例 `video.embedStatus` 記為 `unavailable`（含查核時間），案例退出公開計數但保留 audit 資料。
2. 若找到同一事件的替代官方來源，走 correction batch：新 entry 帶 exact `supersedes`，案例重綁、digest 重算、醫療重審後才回到核准狀態。
3. 若無替代來源，該案例在當期更新的 `unavailableCases` 列出（含兩組前後 digest、`detectedAt`、`previousEmbedStatus` 與 action），不得從歷史 release 移除。

## 診斷衝突回滾程序

1. 新來源與既有 confirmed 診斷矛盾時，立刻把 `injury.confirmationStatus` 改為 `conflicted`；案例即刻不再符合核准／公開選擇。
2. 記錄兩造來源與時間，回到步驟 3–5 重新查核；只有具名醫療審查者可在重審後恢復 `confirmed` 並重新簽署 digest。
3. 若該案例曾出現在上一次 release，當期更新必須把它列入 `updatedCases`（診斷更正）或 `retiredCases`，並在 confirmedUpdate 欄位以外部來源說明更正；歷史 release snapshot 不改寫。
