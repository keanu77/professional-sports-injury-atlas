# 精選影片重新評估：6 個增加至 10 個

依使用者最後指示採總數 10 個。保留原有 6 個，新增 Kobe Bryant、Mohamed Salah、Dominic Thiem、Anthony Richardson；共 8 種運動、6 類身體部位。精選是編輯安排，不是觀看次數排名。

| 順序 | 影片 | 決定與理由 |
| --- | --- | --- |
| 1 | [Ronald Acuña Jr.](https://injury.sportsmedicine.tw/videos/ronald-acuna-miami-2021/) | 保留：外野跳起與落地的事件順序清楚，能搭配復健賽與大聯盟回場的差別。 |
| 2 | [Alexander Zverev](https://injury.sportsmedicine.tw/videos/zverev-roland-garros-2022/) | 保留：側移回球與腳踝支撐的觀察入口，具賽事主辦及實際回場來源。 |
| 3 | [Carolina Marín](https://injury.sportsmedicine.tw/videos/carolina-marin-indonesia-2019/) | 保留：補足羽球跳躍落地情境，保留協會與實際復賽資料。 |
| 4 | [Chris Bassitt](https://injury.sportsmedicine.tw/videos/chris-bassitt-2021-face/) | 保留：呈現球體撞擊及場上處理，有 MLB 傷勢及再登板紀錄。 |
| 5 | [Antoine Dupont](https://injury.sportsmedicine.tw/videos/antoine-dupont-world-cup-2023/) | 保留：短片含近身接觸重播，臉部傷勢採具名來源，避免僅憑撞頭畫面診斷腦震盪。 |
| 6 | [Lindsey Vonn](https://injury.sportsmedicine.tw/videos/lindsey-vonn-schladming-2013/) | 保留：補足高速滑雪摔落，來源保留手術、訓練再傷與正式回場的不同階段。 |
| 7 | [Kobe Bryant](https://injury.sportsmedicine.tw/videos/kobe-bryant-2013-achilles/) | 新增：切入與後續跌倒／重播可辨識，補入籃球與阿基里斯腱情境；頁面已有醫療團隊、手術及實際回場來源。 |
| 8 | [Mohamed Salah](https://injury.sportsmedicine.tw/videos/mohamed-salah-final-2018/) | 新增：爭球、手臂接觸與倒地片段可觀察，補入足球肩傷；傷勢維持球隊公布的範圍。 |
| 9 | [Dominic Thiem](https://injury.sportsmedicine.tw/videos/dominic-thiem-2021-wrist/) | 新增：Tennis TV 片段由指定秒數進入正拍擊球後停止動作，補足揮拍與手腕情境。 |
| 10 | [Anthony Richardson](https://injury.sportsmedicine.tw/videos/anthony-richardson-2023-shoulder/) | 新增：慢動作重播補入美式足球擒抱與肩部著地；診斷與手術採球隊公告，保留解說者非主治醫師的限制。 |

Tatum 曾列為候選，但其現有短片的抽看畫面以傷後處理為主，因此改選 Kobe。大谷翔平與 Alcaraz 仍適合一般目錄，本輪優先減少相似運動／部位的重複；Bolt 的既有資料未列傷後正式復賽日期。

## 查核範圍

- 全部 10 支在正式域名原生播放器重新播放成功，核對影片 ID、起始秒數及媒體時間前進。此次選片不更換來源影片。
- 新候選以指定起始點後 +2、+7、+13 秒取樣；截圖用於編輯選片，沒有逐格診斷或新的醫療簽核。Tatum 初始候選的成功播放另存，沒有混入最終 10 支名單。
- 新增選片的來源查核包含 Liverpool、Colts、NBA 官方來源及奧地利網協／US Open 的公開資料；部分 NBA 和奧地利網協頁面只取得索引／標題，沒有宣稱重新擷取全部全文。來源逐筆網址及取捨見 `selection.json`。
- 既有傷勢、回場資料、臨床核准、影片權利與情境分類保留。
- 結構檢查曾因測試漏傳影片網址／日期而失敗，已修正測試以驗證完整事件綁定。隔離副本最初的依賴符號連結被視為未追蹤檔，已在該副本忽略依賴路徑後重驗；沒有改動來源或簽核檢查。

驗證結果見 `validation.json`：1,490 單元測試、39 瀏覽器測試通過；3 個 review-only 測試依原設計跳過。390／768／1280px 的精選／全部切換與無溢出檢查通過，正式發布檢查建置 195 頁。已部署至 [正式站](https://injury.sportsmedicine.tw/)，來源 `39db166a1bdf33d99ad1cd0dd0d3d851081d0594`、Pages `f0cd3f0d-691a-4c75-a2b7-d3c4ece93157`。正式站 195/195 頁與建置相同；三尺寸下精選 10、熱門 10、全部 150 切換通過。發布證據見 `release.json`、`live.json`、`ui.production.json`。
