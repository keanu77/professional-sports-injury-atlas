# 來源、讀者測試與安全後續

日期：2026-11-18（Asia/Taipei）。工作分支 `feat/site-quality-20261118`。維持 203 支影片，未部署。

## 已完成的來源語意工作

對 8 個事件的 32 條指定時間軸／摘要逐條讀來源：30 條支持、2 條本次無法核對。引用涉及 28 個 URL：26 個讀到相應正文、1 個 ESPN 驗證頁、1 個 YouTube 訪談未在本批重讀。這不是全站 2,573 條敘述的完整審閱，也不代表新醫療核可或完整媒體審閱。

`semantic-review.json` 保存逐條原文、日期脈絡、來源 URL、定位與簡短審閱筆記；`semantic-review.csv` 供快速檢視。reviewer 明示 `codex-source-assistant`，不冒充具名臨床審查者。evidenceSha256 綁定我們的審閱筆記，**不是外部全文 hash**。舊三條需更正紀錄單獨保留，不用新內容覆蓋舊證據。

- Haliburton：原文字將術前球隊公告歸因成完成手術。已讀球隊公告及 AP 後續，分開「安排」與「完成」，修正 injury、時間軸及引用；退場敘述亦補對應 AP 引用。不是否定確實已手術。[球隊公告](https://www.nba.com/pacers/news/indiana-pacers-medical-update-tyrese-haliburton-250623)、[AP 後續](https://www.ksl.com/article/51334269)。
- Curry 腿後肌：NBA 正文談休賽至少一週，原本一週複評依賴內嵌公告。本次補上能直接讀取、明載複評的 CBS 報導與逐條引用；沒有改變使用者已審核的事件事實。[CBS 報導](https://www.cbsnews.com/sanfrancisco/news/warriors-timberwolves-stephen-curry-reportedly-out-game-2-hamstring-strain/)。
- Watkins 受傷當下的 ESPN 引用遇驗證頁，記 unverifiable；USC 三份官方休賽／復賽報導已核對。Curry 回場前訪談那條本輪未重讀影音，亦保留 unverifiable；原本部分播放證據仍在原紀錄，不延伸為全片核可。
- Chloe 的月份／未知起始日、Medina 的月份回場、Brignone 的比賽成績與後續手術、Curry 三次事件皆保持原有精度與區分。

驗證命令會先從當前目錄重建工作台，再核對 receipt；更改文字、日期、影片或引用後會拒絕舊紀錄：

```sh
node --import tsx scripts/check-semantic-review.ts
```

原工作台保留待醫療審閱狀態，本次 AI 編輯語意紀錄另外保存，未將 203 頁全改成 reviewed，也未刷新所有 checkedAt。

## 讀者測試

[開啟離線紀錄表](reader-testing/reader-test.html)，或讀 [主持人手冊](reader-testing/README.md)。已具備九個操作任務、12 人三組配置、匿名紀錄、成功／誤讀判準及重測規則。真實受測者仍為 0，驗收未通過。長訪談核心時間窗缺口已具體記為 A01，未捏造時間碼。

## 安全

詳見 [安全紀錄](security.md)。新增本機發布阻擋及每日稽核 workflow；仍有單一上游 picomatch advisory，未宣稱修好。排程尚未合併啟用。所有 production、臨床核可、全 N 播放與讀者條件保持原門檻。
