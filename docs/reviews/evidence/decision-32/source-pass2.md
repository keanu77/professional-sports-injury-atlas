# Decision 32 independent source Pass 2

最終八例均接受：七例有來源支持確切首次回場日期；Eaton 保留 null。逐篇獨立開啟原始報導，而非僅依賴研究者或 CLI 回覆。

| 選手 | 受傷日 | 首次實際回場 | 天數 | 層級 | 信心 |
|---|---|---|---:|---|---:|
| kyle-schwarber-2016-knee | 2016-04-07 | 2016-10-22 | 198 | Arizona Fall League DH | 0.98 |
| bryce-harper-2017-knee | 2017-08-12 | 2017-09-26 | 45 | MLB regular season | 0.98 |
| dustin-fowler-2017-patellar-tendon | 2017-06-29 | 2018-02-25 | 241 | Cactus League spring training | 0.98 |
| chris-bassitt-2021-face | 2021-08-17 | 2021-09-23 | 37 | MLB regular season | 0.98 |
| alex-cobb-2013-concussion | 2013-06-15 | 2013-07-23 | 38 | Class A Charlotte rehabilitation game | 0.97 |
| giancarlo-stanton-2014-face | 2014-09-11 | 2015-03-05 | 175 | Grapefruit League spring training | 0.98 |
| charlie-morton-2021-fibula | 2021-10-26 | 2022-03-27 | 152 | Grapefruit League spring training | 0.98 |
| adam-eaton-2017-knee | 2017-04-28 | 未確認確切日期 | 不計算 | earlier Minor League backfield games, exact first date unconfirmed | 0.99 |

Cobb：直接 HTTP 200 讀取 [2013-07-23 即時賽報](https://www.mlb.com/news/worth-noting/c-54499874)，可補強回場來源。38 天只代表兩球的復健賽登板，不能描述為完成正常先發負荷。

Stanton、Morton 官方 StatsAPI 已獨立連線取回，首筆春訓出賽分別是 2015-03-05（game 429750）、2022-03-27（game 706816），與賽報一致。Harper 小腿拉傷由九月復出報導支持；Fowler、Bassitt、Morton 正確區分刊登日與發生日。Schwarber 為秋季聯盟指定打擊，不代表恢復外野守備。

Eaton 四個原始來源均已独立讀取：五月十日報導明載四月二十八日受傷、左膝 ACL／半月板及左踝；四月三十日載高位踝扭傷。三月十一日已完成數場小聯盟後場比賽，三月十七日只是之後的 Grapefruit League debut，因此 returnDate 與相隔天數必須為 null。

Jeter 日期研究仍有效，但主 agent 的影片檢查淘汰候選來源，列入 excludedResearch，不計入最終八例。

不接受「頭部撞擊等同腦震盪」、「首次回場代表完全恢復」、「應統一採大聯盟例行賽日期」等推論（信心 < 0.7，排除）。

本審查未執行影片播放或網站 runtime 測試；由主 agent 完成。
