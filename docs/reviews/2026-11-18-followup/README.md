# 來源、讀者測試與安全後續

日期：2026-11-18（Asia/Taipei）。工作分支 `feat/site-quality-20261118`。維持 203 支影片，未部署。

## 已完成的來源語意工作

第一批對 8 個事件的 32 條指定時間軸／摘要核對來源：30 條支持、2 條無法核對。後續已補官方來源並限縮敘述，目前這 32 條均有對應支持，其中 Curry 訪談發布日期／主題一條僅依官方影片的索引文字資料，不代表核對訪談內容。當前引用涉及 28 個 URL：27 個曾讀到相應正文、1 個官方影片 metadata。這不是全站 2,573 條敘述的完整審閱，也不代表新醫療核可或完整媒體審閱。

`semantic-review.json` 保存逐條原文、日期脈絡、來源 URL、定位與簡短審閱筆記；`semantic-review.csv` 供快速檢視。reviewer 明示 `codex-source-assistant`，不冒充具名臨床審查者。evidenceSha256 綁定我們的審閱筆記，**不是外部全文 hash**。舊三條需更正紀錄單獨保留，不用新內容覆蓋舊證據。

- Haliburton：原文字將術前球隊公告歸因成完成手術。已讀球隊公告及 AP 後續，分開「安排」與「完成」，修正 injury、時間軸及引用；退場敘述亦補對應 AP 引用。不是否定確實已手術。[球隊公告](https://www.nba.com/pacers/news/indiana-pacers-medical-update-tyrese-haliburton-250623)、[AP 後續](https://www.ksl.com/article/51334269)。
- Curry 腿後肌：NBA 正文談休賽至少一週，原本一週複評依賴內嵌公告。本次補上能直接讀取、明載複評的 CBS 報導與逐條引用；沒有改變使用者已審核的事件事實。[CBS 報導](https://www.cbsnews.com/sanfrancisco/news/warriors-timberwolves-stephen-curry-reportedly-out-game-2-hamstring-strain/)。
- Watkins 的 ESPN 引用重試仍遇驗證頁；改以 USC 官方賽後報導支持 timeline[0]，文字限於首節受傷、未再上場，並明示此報導未指定側別／韌帶。其他診斷仍保留原歸因，不擴張官方公告內容。Curry 訪談的官方 YouTube 索引含發布者、2026-04-04 日期及可能回場的主題，足以核對這一條發布事件；直接開啟仍遇 cache miss，未取得逐字稿或全片證據。兩筆原 unverifiable 紀錄留在 `previous-unverifiable.json`，新方法與限制留在各自 receipt。[USC 賽後報導](https://usctrojans.com/news/2025/3/24/womens-basketball-no-1-seed-usc-womens-basketball-scores-sweet-sixteen-spot-with-96-59-win-over-bulldogs)、[勇士訪談](https://www.youtube.com/watch?v=iGY5kwMIS2g)。
- Chloe 的月份／未知起始日、Medina 的月份回場、Brignone 的比賽成績與後續手術、Curry 三次事件皆保持原有精度與區分。

驗證命令會先從當前目錄重建工作台，再核對 receipt；更改文字、日期、影片或引用後會拒絕舊紀錄：

```sh
node --import tsx scripts/check-semantic-review.ts
```

原工作台保留待醫療審閱狀態，本次 AI 編輯語意紀錄另外保存，未將 203 頁全改成 reviewed，也未刷新所有 checkedAt。

## 讀者測試

[開啟離線紀錄表](reader-testing/reader-test.html)，或讀 [主持人手冊](reader-testing/README.md)。已具備九個操作任務、12 人三組配置、匿名紀錄、成功／誤讀判準及重測規則。真實受測者仍為 0，驗收未通過。長訪談核心時間窗缺口已具體記為 A01，未捏造時間碼。

新增 `npm run quality:readers` 離線彙整，保留缺測分母、核對原始紀錄摘要、拒絕混合版本，分開先導／自填／主持人觀察；先導的重大誤讀仍阻擋驗收。影片頁新增全長與文字閱讀入口，五分鐘以上影片明示有無已標記片段；沒有因此將 A01 或實播改記通過。

## 安全

詳見 [安全紀錄](security.md)。新增本機發布阻擋及每日稽核 workflow；仍有單一上游 picomatch advisory，未宣稱修好。排程尚未合併啟用。所有 production、臨床核可、全 N 播放與讀者條件保持原門檻。

## 工程驗證

完整單元測試 1,755 項、桌機／手機回歸 86 項通過。最後僅更新兩筆事件日期後，57 項相關單測、14 項受影響頁面回歸及 445 檔型別檢查通過。最終預覽 277 頁／203 影片、來源綁定驗證通過；本機 HTTP 實際確認更正文字。逐檢查版本與限制見 `validation.json`。安全稽核仍為預期的阻擋結果，不算通過。

## 發布要求處理

依使用者「commit and push 部署」指示，已推送 `feat/site-quality-20261118`，遠端核對 `bed2ed2` 一致；本段文件的後續提交另以 Git 記錄為準。重新執行正式發布前檢查，仍由安全稽核（單一 picomatch advisory，16 high 依賴項目）及 pending 實播紀錄阻擋。官方 advisory 仍無已修補版本。沒有上傳 Cloudflare、合併 main 或把不可部署的預覽當正式成品；正式站版本仍為 `9d6f38a`。詳見 [本次發布紀錄](release-attempt.json)。工作分支 push 不會觸發僅適用 PR／main 的 CI，也不會啟用尚未合併的每日排程。
