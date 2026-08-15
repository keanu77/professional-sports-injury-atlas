# Tyrese Haliburton — Decision 18 Achilles research notes

Cutoff / access date: 2026-08-15  
Operator: `codex-root-achilles-group-c`

## 查核範圍

- 四個類別均逐字執行 scaffold 的六個查詢槽位，涵蓋球隊新聞室、NBA 新聞／公告、官方傷病報告、NBA 比賽參與、正式聲明與具名主流媒體原始頁。
- 每次新增事實後重新計算停止條件；`treatment` 與 `surgery` 均在最後一筆 delta 後完成兩輪不同角度的零新增查核，`injection` 與 `actual-return` 也各以兩輪零新增結束。
- 搜尋摘要只用於定位。retained、revalidated 或 rejected candidates 都以直接開啟的原始頁判斷。

## 原始頁與決定

- 重開 Decision 17 的 Associated Press／NBA.com 手術與復健原始頁；既有手術日期、保護靴與復健事實保持不變。
- 開啟 KSL.com 刊載的 Associated Press 原始報導，保留 Martin O'Malley 醫師在 Hospital for Special Surgery 執行右阿基里斯腱修復手術；之後以醫師姓名執行兩個零新增分支。
- 開啟 2025-08-23 Associated Press／NBA.com 原始頁，保留復健期間已在重量訓練室訓練的具體行動。
- 開啟 2026-04-14 Associated Press／NBA.com API 原始頁，保留報導明載前一週已恢復五對五訓練；未自行指定來源沒有明載的精確發生日，也沒有把訓練推論為獲准出賽。
- 截止日前未找到由球隊或聯盟官方參與來源支撐、已發生且具日期的實際回場；`actual-return` 保持空白。

## 拒絕與空白邊界

- 2026-04-14 AP 原始頁提及的 Botox 注射明確用於帶狀皰疹造成的神經痛，不是本案阿基里斯腱傷勢；以 wrong-condition candidate 記錄並排除。
- 未來賽季說法、一般 recovery／clearance 狀態、預測、典型療程、不可開啟頁及搜尋摘要均不作 item 證據。
- `injection` 與 `actual-return` 空白都只陳述完整查核後的證據邊界，不代表相關事件未曾發生。
