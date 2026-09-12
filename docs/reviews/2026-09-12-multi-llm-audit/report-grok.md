我先以唯讀方式核對本目錄內的來源、個案文字與發布邊界，不改檔、不派子代理、也不做外部查證。接著會讀審查紀錄與 120 份公開報告，只回報有材料支持的問題。接著讀審查紀錄、NBA 連結政策與個案來源元件，並確認 120 例目錄怎麼對上公開報告。審查紀錄已出現回場日期與側別待確認的落差；接下來會對照完整來源研究與全部公開 event JSON。公開報告已對上約 122 筆 slug，接著會找出 2 筆非公開排除項，並讀取事件報告的結構與來源欄位。事件 JSON 的來源編號看起來是 1-based；我會核對渲染邏輯、兩筆排除項，以及新增 19 例的完整文字。Klay Thompson 的 slug 寫 ACL、來源卻出現阿基里斯腱，這類既有混淆要先核對；接著會掃同選手多次傷害與回場標籤。這是來源／內容一致性、研究不確定性與授權／發布邊界的唯讀稽核。未改檔、未部署、未派子代理、未對目錄外檔案或任何憑證／環境設定取值，也沒有對來源網址做網路查證。NBA.com 依 `src/lib/rights/nba-link-policy.ts` 維持不可點擊文字；此處不建議改成可點連結。臨床批准與公開報導整理不同：本報告不把內容檢查、單元測試或 `sourceFulltextVerified` 當成醫學認證。

公開集合對得上：`event-*.json` 共 122 筆 slug，其中 `volleyball-pov-135`、`ankle-inversion-observation` 由 `src/data/videos/curation.v1.json` 第 6 行與 `src/lib/videos/expansion.ts` 第 307 行自公開觀察清單與公開 event 合併結果排除。其餘 120 筆均有 `mechanism`。NBA 來源在 `EventFollowUp.astro` 第 94–102 行走純文字，未發現本輪把它做成可點外連。

未發現 P0。下列僅列有材料支持的問題。

---

## 本輪新增（19 例與本輪寫入的機轉／時間軸）

### NEW-01｜P1｜「公開診斷」把未臨床簽核的整理寫成確定診斷
- **檔案：** `src/data/videos/event-recent-120.v1.json` 第 10、84、169、254、344、424、504、578、668、753、832、912、992、1066、1135、1204、1279、1353、1422 行（19 例 `injury` 皆以「公開診斷：」起句）；`docs/reviews/2026-09-12-recent-120/README.md` 第 5 行；`docs/reviews/2026-09-12-recent-120/case-review.json` 第 7 行與各例 `clinicalApproval: false`
- **重現：** 觀察頁 `EventFollowUp.astro` 第 23–24 行直接輸出 `update.injury`。同頁第 84–87 行只標「依公開報導整理」。審查紀錄寫明這 19 例「未新增個別臨床簽核」。
- **使用者影響：** 讀者可能把球團／媒體整理讀成本站已完成臨床批准的診斷。
- **建議：** 改成「公開報導記載／球團公告」等不暗示本站認證的用語；頁首與傷勢欄維持觀察頁身分。
- **待核實：** 無（屬用詞與簽核旗標的內部不一致）。

### NEW-02｜P1｜`gavi-acl-2023` 來源標題 348 天 vs URL slug 248 天
- **檔案／slug：** `src/data/videos/event-recent-120.v1.json` 第 361–362 行；頁面 context 第 347 行
- **重現：** 標題寫 `Gavi returns after 348 days out`，URL 為 `.../gavi-returns-after-248-days-out`。context 只解釋「348 天是從上一次俱樂部比賽起算，不是從 2023-11-19 受傷日起算」，沒有處理標題與 URL 數字不同。
- **使用者影響：** 來源列表會同時出現兩個互相矛盾的天數。
- **建議：** 標題改與實際頁面標題一致；若原文標題確為 248，則刪掉自填的 348。
- **待核實：** 巴塞隆納該頁實際標題是 348 還是 248。本次未開啟該 URL。

### NEW-03｜P1｜`kristaps-porzingis-retinaculum-2024` 把 Game 5 寫成 2024-06-17，研究 claims 沒有該日
- **檔案／slug：** `src/data/videos/event-recent-120.v1.json` 第 1206–1207、1256–1259 行；`docs/reviews/2026-09-12-recent-120/source-research.json` 第 1238–1241 行（claims 只寫「先前總冠軍賽 Game 5 曾再上場」，無 6/17）；`docs/reviews/2026-09-12-recent-120/README.md` 第 11 行
- **重現：** 時間軸把「手術前帶傷參加第五戰」釘在 `2024-06-17`，引用來源 `[2]`（2024-06-27 手術稿）。研究檔對該來源的已摘 claims 沒有比賽日。
- **使用者影響：** 術前帶傷出賽與術後 11/25 回場已分開，這點清楚；但 6/17 可能是日曆推算，不是所列來源寫出的日期。
- **建議：** 有原文日期才保留；否則改成「Game 5（手術前，日期以賽事紀錄另核）」。
- **待核實：** `https://www.nba.com/news/celtics-kristaps-porzingis-offseason-surgery` 是否寫明 Game 5 日期。本次未取原文。

### NEW-04｜P1｜同頁把「與小腿拉傷無關」寫成球隊明確說明，研究 claims 未記載
- **檔案／slug：** `src/data/videos/event-recent-120.v1.json` 第 1234–1235 行（`sourceIndexes: [4, 1]`）；`docs/reviews/2026-09-12-recent-120/source-research.json` 第 1230–1231 行 claims 僅有支持帶／脛後肌腱診斷
- **重現：** 機轉摘要：「球隊也明確說明與先前的小腿拉傷無關」。來源 `[1]` 是 NBA Game 3 稿，`[4]` 是醫師解說影片。研究 claims 沒有這句球隊說明。
- **使用者影響：** 讀者會以為球團已切割四月右小腿拉傷；若原文沒寫，即超出已提供證據。
- **建議：** 改為本站編輯區分（勿寫成球隊聲明），或補上確實寫出該句的來源。
- **待核實：** NBA 該稿與醫師影片是否有此句。

### NEW-05｜P1｜`aidan-hutchinson-leg-2024` 正式回場日期超出研究檔已核 claims
- **檔案／slug：** `src/data/videos/event-recent-120.v1.json` 第 255–257、332–336、285–294 行；`src/data/videos/recent-120.v1.json` 第 121–122、143–149 行；`docs/reviews/2026-09-12-recent-120/source-research.json` 第 277、337–338 行（`returnDate: null`，「後續實際回場待補」）
- **重現：** 公開頁把 `2025-09-07` 對 Packers 寫成「重返 NFL 例行賽」，引用 `[6]` 賽前「can't wait to see Hutchinson return」（2025-09-02）與 `[7]` 標題為紅區表現的賽後稿。研究檔在補這兩則之前，正式回場仍標未完成。
- **使用者影響：** 「距受傷 N 天」與「正式賽」里程碑會綁在可能尚未被全文核實的比賽日。
- **建議：** 若 FOUR DOWNS 全文未寫他上場，回場日改回「訓練許可／待核實」；賽前預告不得單獨當正式回場。
- **待核實：** 2025-09-07 那篇 Lions 稿是否記載 Hutchinson 出賽。本次未取原文。

### NEW-06｜P1｜研究檔對 19 例一律 `sourceFulltextVerified: true`，多筆 notes 仍寫摘要／timeout／待全文
- **檔案：** `docs/reviews/2026-09-12-recent-120/source-research.json`
  - `eder-militao-acl-2024` 第 772、779 行（open timeout，卻標全文已核）
  - `ronald-acuna-acl-2024` 第 1090、1097 行（待全文）
  - `kristaps-porzingis-retinaculum-2024` 第 1218、1225 行（待全文）
  - `joel-embiid-meniscus-2024` 第 1290、1297 行（待全文）
  - `connor-bedard-jaw-2024` 第 1361、1368 行（初始診斷與復出全文待補）
- **重現：** 同一物件 `verified: true` 且 `sourceFulltextVerified: true`，notes 卻寫還沒讀全文。公開頁仍輸出「公開診斷：…」。
- **使用者影響：** 診斷確定性被寫得比研究過程更高。
- **建議：** 旗標與 notes 對齊；未讀全文者公開頁改「報導摘述／待全文」。
- **待核實：** 後來是否另開過全文而 notes 未改。本次沒有外部全文。

### NEW-07｜P2｜`kristaps-porzingis-retinaculum-2024` 解剖說明綁到賽事新聞，不是醫學來源
- **檔案／slug：** `src/data/videos/event-recent-120.v1.json` 第 1242–1245 行（explanation `sourceIndexes: [1]`）；該例來源清單第 1210–1228 行沒有 AAOS／同等解剖來源
- **重現：** 解釋「支持帶…把肌腱維持在正常滑行路徑」引用的是 Game 3 缺陣新聞。
- **使用者影響：** 一般解剖被讀成該則 NBA 稿的內容。
- **建議：** 補醫學來源，或把這段標成未引用原文的一般說明。
- **待核實：** 該 NBA 稿是否含支持帶解剖。

### NEW-08｜P2｜`aidan-hutchinson-leg-2024` 脛腓骨骨折被放在「小腿／阿基里斯腱」
- **檔案／slug：** `src/data/videos/recent-120.v1.json` 第 118 行；對照 `event-recent-120.v1.json` 第 254、299 行（診斷與機轉已寫這不是阿基里斯腱）
- **重現：** 觀察頁標題為 `{bodyPart} · 受傷動作觀察`（`src/pages/videos/[slug].astro` 第 49–50 行），此例會顯示「小腿／阿基里斯腱」。
- **使用者影響：** 分類與頁首暗示肌腱斷裂；內文已澄清，但導覽仍可能把骨折和肌腱傷放在同一桶。
- **建議：** 若分類只能合用小腿桶，頁首不要帶「阿基里斯腱」字樣。
- **待核實：** 無。

### NEW-09｜P2｜`nick-chubb-knee-2023` 時間軸停在「ACL 手術仍在後續計畫」，回場時未交代第二次手術
- **檔案／slug：** `src/data/videos/event-recent-120.v1.json` 第 66–76 行；`docs/reviews/2026-09-12-recent-120/source-research.json` 第 16、31–32 行
- **重現：** 研究 notes／claims 寫 9/29 先修內側結構，ACL 另次處理。公開時間軸在回場前沒有 ACL 手術節點，也沒有「未核得第二次手術日」。
- **使用者影響：** 讀者可能以為回場時 ACL 仍未處理，或以為只有一次手術。
- **建議：** 補第二次手術（有來源才寫），或明示「所列來源未核得 ACL 手術日」。
- **待核實：** Browns 回場稿是否記載 ACL 手術已完成。

### NEW-10｜P2｜`novak-djokovic-meniscus-2024` 影片被標畫面未明，步驟仍寫「滑步」
- **檔案／slug：** `docs/reviews/2026-09-12-recent-120/README.md` 第 8 行；`docs/reviews/2026-09-12-recent-120/case-review.json` 第 215 行；`src/data/videos/event-recent-120.v1.json` 第 1168–1170 行
- **重現：** 審查寫 Tennis Channel「以照片和新聞為主…畫面未明」。機轉步驟仍寫「移動、滑步時膝部症狀加劇」。限制段有說不能把單次滑動當成全部原因，但步驟已把滑步寫進事件序列。
- **使用者影響：** 讀者可能以為本站已從該片看到滑步致傷。
- **建議：** 步驟改回「比賽中症狀加劇」，滑步僅在有來源支持時保留。
- **待核實：** 法網稿或該片是否描述滑步。

### NEW-11｜P2｜術後回場列被 UI 固定句寫成「再次出賽」
- **檔案／slug：** `src/components/cases/EventFollowUp.astro` 第 40–44 行；`kristaps-porzingis-retinaculum-2024` 在 `src/lib/videos/event-updates.ts` 第 279 行被標「術後出賽」，同檔第 1205–1207、1256–1271 行已分開 Game 5 與 11/25
- **重現：** 徽章可顯示「術後出賽」，日期列仍是「受傷 → 再次出賽」。
- **使用者影響：** 可能把 11/25 讀成傷後第一次再上場，即使 context 已寫 Game 5。
- **建議：** 日期列跟里程碑用同一套用詞。
- **待核實：** 無。

---

## 已存在（本輪 19 例之前的 101 例來源／時間軸）

### OLD-01｜P1｜`anfernee-simons-ankle-sprain-2023` 來源標題寫 3/1 再傷，URL 卻是拓荒者對老鷹
- **檔案／slug：** `src/data/videos/event-updates.v1.json` 第 27–29 行
- **重現：** 標題「NBA：3 月 1 日再傷後的賽事報導」，URL `.../por-vs-atl-0022200947`，`publishedAt: 2023-03-03`。3/1 回場／再傷在時間軸用的是鵜鶘戰 PDF 與 ClutchPoints（第 93–97 行，`sourceIndexes: [2, 8]`）。此則仍出現在來源清單；NBA URL 依政策以純文字顯示。
- **使用者影響：** 來源列表把老鷹戰說成 3/1 再傷報導。
- **建議：** 改標題或換成本場再傷的來源；未使用的錯誤綁定不要留在清單。
- **待核實：** 該老鷹頁是否其實在回顧 3/1 再傷。本次未取原文。

### OLD-02｜P1｜`kristaps-porzingis-acl-2018` 來源標題寫 MRI 確認，URL slug 是對暴龍系列稿
- **檔案／slug：** `src/data/videos/event-batch-30.v1.json` 第 855–857 行
- **重現：** 標題「尼克：MRI確認Porzingis左膝傷勢」，URL `.../knicks-battle-raptors-series-locked-one-apiece`。時間軸受傷／手術實際引用的是第 860–862 行那則手術稿。
- **使用者影響：** 來源清單把系列戰報導標成 MRI 公告。
- **建議：** 換成真正的 MRI／傷勢頁，或改正標題。
- **待核實：** 該暴龍系列頁是否內含 MRI 段落。本次未取原文。

### OLD-03｜P2｜既有 80 例機轉／時間軸批次自承未重看片、未重讀全部全文
- **檔案：** `docs/reviews/2026-09-12-remaining80-expansion/README.md` 第 12–14、31 行
- **重現：** 紀錄寫「沒有重新逐格觀看全部 80 段影片」「沒有把每個既有連結都標成重新取得全文」「多個 NBA 球隊歷史頁只回傳空殼」。這批的 `checkedAt: 2026-09-12` 被寫進對應 event 檔。
- **使用者影響：** 這 80 頁的步驟與部分診斷歸因，確定性低於「已核對影片與全文」的讀法。
- **建議：** 公開頁的查核日期旁加「未重讀全文／未重看片」邊界；空殼 NBA 頁不要當新診斷依據。
- **待核實：** 哪些具體 URL 仍是空殼。本次未請求那些頁。

### OLD-04｜P2｜`klay-thompson-2019-acl` 把跨兩次傷害的缺賽顯示成單一「距受傷 N 天」
- **檔案／slug：** `src/data/videos/event-batch-30.v1.json` 第 10–12、51、61–71 行；`src/components/cases/EventFollowUp.astro` 第 27–36 行用 `eventDate`→`returnDate` 算天數
- **重現：** 內文已寫 2019 左膝 ACL 與 2020 右阿基里斯腱是兩件事，不能當單一 ACL 恢復時間。UI 仍從 2019-06-13 算到 2022-01-09。
- **使用者影響：** 大字天數可能蓋過限制段。
- **建議：** 此例不顯示單一恢復天數，或改為「跨兩次傷害的缺賽區間」。
- **待核實：** 無。

### OLD-05｜P2｜`mitch-haniger-2017-face` 的 3A 復健賽日引用 MLB 啟動稿
- **檔案／slug：** `src/data/videos/event-batch-34.v1.json` 第 21–23、72–75 行
- **重現：** 2017-08-12「3A 復健賽回場」`sourceIndexes: [2]`，該則 `publishedAt` 為 2017-08-19，標題是啟動傷兵／歸隊。
- **使用者影響：** 若該稿沒寫 8/12 Tacoma 出賽，復健賽日就超出所列來源。
- **建議：** 補 3A 賽報，或把 8/12 改為未核實。
- **待核實：** 8/19 稿是否記載 8/12 復健賽。

---

## 本輪有材料、但未寫成問題的邊界

- **側別：** 新增例中 Hutchinson／Musiala／Vingegaard／Van Aert／Bedard 的研究檔標「所引公告未註明側別」；公開 `injury` 大多未杜撰側別。Brignone 研究寫勿自行加 ACL，公開頁未加。
- **同選手多傷：** Acuña 2021 右膝／2024 左膝、Marín 2019／2024、Porziņģis 2018 ACL／2024 支持帶、Militão 文案區分 2023 左膝與 2024 右膝、LaMelo 2023 右踝／2025 左踝，公開文字有分開。
- **回場層級：** Burrow 季前賽、Porziņģis 術後 vs Game 5、Marín 退役不當回場、Haliburton 展望不當復賽，文案有分開。
- **NBA 連結政策：** 觀察頁來源清單對 `nba.com` 走純文字。不建議改成可點。
- **2 筆非公開排除：** `volleyball-pov-135`、`ankle-inversion-observation` 仍留在 `event-updates.v1.json` 第 960–989 行，但公開 clip／event 合併已過濾。

沒有對任何來源做外部查證；凡涉及原文是否真寫某句、某日、某場出賽，一律標待核實，不用模型記憶宣稱來源錯誤。
