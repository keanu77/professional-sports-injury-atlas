# 第一批 14 個候選：來源與影片預檢

日期：2026-09-21（日本）；影片 metadata 實際查詢時間：2026-09-20 23:49 UTC。日期差來自時區，不預填未來查核日期。

這是研究名單，不是已新增的案例。已對照既有 158 頁；14 個姓名均未在既有名單中找到，但發布前仍須以事件、年份和原片人工去重。

## 結果

- 14 個研究候選：8 個找到 YouTube URL，4 個只有其他平台影片／原始影片頁，2 個尚無可確認的原片網址。
- 8 個 YouTube URL 本次 metadata 預檢：7 個 HTTP 200、1 個 HTTP 401。HTTP 200 不代表可實際播放或版權／地域條件已通過；401 原因未確定，也不能直接宣稱下架。
- 本站嵌入實播通過：0。新增到 production catalog：0。
- 既有四個神經案例仍在本機，尚未發布。其三個 YouTube ID 本次 oEmbed 均 HTTP 200；MLB 與全部四例的本站實播未重驗。

| 候選事件                   | 教學缺口                   | 查核進度／主要限制                                                  |
| -------------------------- | -------------------------- | ------------------------------------------------------------------- |
| Adam Peaty，2022           | 游泳選手的陸上訓練足部骨折 | 本人影片與協會公告已找到；不能寫成泳池動作傷害                      |
| Greg Louganis，1988        | 跳水、頭部撞擊             | Olympics 官方回顧；需定位受傷片段，不鼓勵帶腦震盪續賽               |
| Kerri Walsh Jennings，2015 | 沙灘排球、右肩脫臼         | 主辦方影片及原始報導；不混入另一次肩傷                              |
| Janja Garnbret，2024       | 攀登、手指卡住後疼痛       | 官方賽事回放與本人談話；沒有骨折／滑車斷裂診斷                      |
| Rafael Nadal，2022         | 網球、腹肌傷害             | Wimbledon 本人退賽記者會；不混同當年肋骨及足傷                      |
| Jordyn Poulter，2022       | 室內排球、膝部多韌帶傷     | 本人訪談；與 2021 東京踝傷不同，列次優先                            |
| Shauna Coxsey，2015        | 攀登、手指傷後訓練         | 原創紀錄片已找到；缺受傷起因及具體傷勢來源，暫緩                    |
| Michelle Jenneke，2024     | 跨欄、腿後肌腱             | 傷勢有官方佐證；NBC YouTube metadata 401，已記 Eurosport 同事件備選 |
| Beiwen Zhang，2021         | 羽球、阿基里斯腱           | 協會公告及 NBC 原片頁；目前沒有支援的 YouTube 版本                  |
| Macris Carneiro，2021      | 室內排球、踝傷             | Globo 原始報導中定位到 clip 9725772；不把抓到 MP4 網址當作嵌入授權  |
| Tom Aspinall，2022         | MMA、膝傷後復健            | UFC 本人訪談；原生播放器尚非本站支援，ACL 程度不補猜                |
| Jon Jones，2023            | MMA 訓練、胸肌             | UFC 引用原始 X 公告；需可支援原片及片段核對                         |
| Lena Klingler，2024        | 室內手球、訓練傷           | IHF 原始訪談；尚無影片，不錯標沙灘手球受傷                          |
| Jim Gottfridsson，2023     | 手球、左掌骨骨折           | IHF 傷勢來源；Viaplay 影片線索尚未定位原片 URL                      |

詳細傷勢範圍、來源與影片連結見 [first-batch-candidates.json](first-batch-candidates.json)；本次影片資料查詢結果見 [metadata-probe.json](metadata-probe.json)。所有 proposedFootageKind 都是待觀看確認的研究分類，不得直接複製成「已驗證受傷瞬間」。

## 保留與排除

- Sarah Sjöström，2021 肘骨折：排除。World Aquatics 描述日常冰面滑倒，並非已確定運動／訓練受傷。即使有本人訪談，也不能用來填補游泳機轉。
- Andranik Karapetyan，2016 舉重肘傷：保留研究線索，官方 PDF 與權利人影片仍需補核。
- Paula Badosa，2023 脊椎疲勞性骨折：WTA 原始傷勢公告已找到，適合過度使用主題；尚未配到明確談這次傷勢的可用原始影片。

## 下一個發布前檢查

優先對 Peaty、Louganis、Walsh Jennings、Garnbret、Nadal 核對影片內容、時長和同事件片段。來源與 metadata 均不足以推測這些值。若觀看後無受傷瞬間，準確改標本人訪談／回顧或替換原片，不為了 14 例配額偽造資料。

先完成既有四例的 owned-HTTPS playback，再整合新片。現有工具連線回報無可用瀏覽器；Edge 本身執行中、擴充功能啟用、native-host manifest 檢查正確。不重裝或更改網路，不以測試 mock 代替實播。等待使用者同意開啟指定 Edge 空白視窗重試連線。
