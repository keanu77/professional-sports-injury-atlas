# 內容、字幕與複查工作台（T04／T05／T11）

這是把待辦轉成可逐項審閱的資料工具，不會修改公開資料、臨床核可、字幕狀態或發布門檻。

```sh
PATH=/Users/ethanstudio/.local/share/mise/installs/node/24.14.0/bin:$PATH \
  node --import tsx scripts/prepare-quality-review.ts
```

以 `loadPublicVideoInventory()` 取得目前公開目錄，配對精確 slug／影片網址與事件資料，輸出至 `output/site-quality-validation/`：

| 檔案                          | 用途                                                                 |
| ----------------------------- | -------------------------------------------------------------------- |
| `content-review.json`         | 完整待審工作台，含現行文字、來源、日期、影片metadata、觀看範圍與缺口 |
| `content-review.csv`          | 每事件一列，可分配醫療編輯／媒體審查工作                             |
| `content-review-claims.csv`   | 逐條原文、原有引用索引、來源ID／網址、內容digest及待審狀態           |
| `content-review-sources.csv`  | 公開來源去重、用途及影響事件；本工具未連線驗證來源                   |
| `content-review-coverage.csv` | 部位×運動×片型矩陣；片型重疊，格數不得當影片總數                     |
| `content-review-summary.json` | 可重算計數與輸入版本／dirty狀態                                      |

2026-11-18 執行結果：200 影片、2,540 條敘述、876 個不同公開參考URL、204個覆蓋格。986條敘述保留原有逐條引用，1,554條尚無此種映射。敘述列包括診斷、回場、context、機轉標題／摘要／steps／解釋／限制／研究、時間軸及明確回場里程碑，故「未連結」數量不等於無來源的醫學主張數，更不等於已證實錯誤。

影片metadata維持 available 14／unavailable 14／not-verified 172；全部當期字幕、必要聲音／視覺資訊與實播仍待人工查核。179支沒有已整理觀看範圍；38個既有片段尚無結束時間。原有core影片契約與片型分段分開標示，沒有把片長自動當成已審閱的教學結束點。

110事件列入優先工作佇列，理由僅依台灣日期的近兩年事件、回場日期未解析、語音導向片型或長片，**不代表正在受傷或尚未回場**。所有病程仍為`unclassified`；200筆的實際承接者與下次複查日都是null／unassigned。

深入教學工作台直接讀取已驗證的 `videoLearning.entries`，依原順序綁定目前 20 份草稿，選片與每個槽位都標示 `draft-selected-review-pending`。生成摘要為待選 0、已選草稿 20、待審 20；這只表示草稿已選定，不代表已完成語意、影片或臨床審閱。`createQualityReviewQueue()` 的可選 `flagshipSlugs` 必須恰好有 20 個唯一且存在當前公開目錄的 slug；完全未提供時才保留 20 個空槽及 `pending-selection-and-review`。空陣列、數量不符、重複、目錄外影片、槽位錯序或核可狀態都會被 schema 拒絕。

200筆2026-10-19播放紀錄只在原影片URL與頁面路徑精確相符時列為`historical-only`。原core核可亦只列`historical-original-core-only`，不延伸至當期報導或新主張。現有`checkedAt`原樣保留為內容整理日期，沒有冒充逐條重讀日期。

## 審閱綁定與使用方式

1. 醫療編輯先從事件CSV分配責任及期限，再按原文與來源核對主張；未連結的敘述需人工建立正確歸因，工具不猜索引。
2. 媒體審查者按影片URL實際檢查字幕、必要視覺資訊、核心時間窗與播放。來源HTTP可讀或舊播放紀錄都不能代填當期狀態。
3. 來源ID是精確URL的SHA-256。每條digest綁定原文、日期脈絡、影片URL、欄位與有序來源資料；更換原句、事件日期、影片或來源，舊receipt即失效。
4. 待審schema只接受`pending-current-semantic-review`及`medicalApproval:false`。不能把輸出的狀態改成approved當成核可。
5. `validateSemanticReviewReceipt()`要求呼叫端明確提供允許的reviewer ID、當前claim與證據內容，核對其hash、時間及綁定；沒有來源連結的主張不能寫supported。receipt仍固定`medicalApproval:false`與`publicationApproval:false`，且不修改原工作台狀態。
6. 此驗證器只能確認紀錄的一致性，不驗證真人身分／資格或醫學結論。實際醫療及發布核可仍使用既有治理流程。本工具不提供自動匯入核可。

CSV已處理引號、換行及試算表公式前綴；原始字串保留於JSON。輸入不完整／影片錯配／未知引用索引／越界片段會失敗，不靜默略過。資料修改或新增影片後重新產生；數量沒有固定為200。產物會覆寫同名輸出，實際分派與審閱結果應保存於獨立紀錄，不能只填在生成的CSV或JSON。

## 已測與待驗

`tests/unit/quality-review.test.ts` 的 30 項測試與 `tests/unit/video-learning.test.ts` 的 6 項測試共 36 項通過。涵蓋第201筆、20份草稿的數量／唯一性／目錄與槽位綁定、精確引用與日期、歷史／當期分離、草稿冒充核可、未允許reviewer、錯誤證據hash、內容／影片／來源變更使receipt失效，以及CSV安全處理。日誌為`output/site-quality-validation/content-review-unit.log`及`content-review-generation.log`。

此次產物記錄`sourceDirty:true`，是整合中的工作台快照，不能當成乾淨提交的發布證據。當期已完成語意審閱0、人工媒體查核0、新增醫療核可0；仍需真人承接全部待審項目。沒有下載字幕、連線來源、外寄或修改醫學資料。
