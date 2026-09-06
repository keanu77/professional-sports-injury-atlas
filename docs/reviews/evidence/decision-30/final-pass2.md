# D30 最終文字與日期綁定 Pass 2

唯讀核對兩個 JSON、全部 30 筆原始 facts、籃球與足球來源包。所有 eventDate / returnDate / returnSummary（影片端 returnText）跨層一致，來源集合一致。排除主線正替換的 Cousins、Gomes ID；其餘影片 URL 綁定一致。重新讀取 LaVine、Livingston、George、Dejounte Murray、Koscielny、Miedema、Williamson 的關鍵原始來源與 NBA 紀錄，未發現傷勢或實際出賽日期的新增矛盾。

## 具體需修正項目

### P2：純比賽紀錄的日期被當成 publishedAt（confidence 0.93）

`event-batch-30.v1.json` 以下 4 個來源明示的是比賽日，未提供文章／檔案發布日；建議 publishedAt 改 null，保留事件與復出日期：

- Jamal Murray 的 https://statsdmz.nba.com/pdfs/20221003/20221003_OKCDEN.pdf ：PDF 日期位在 FINAL BOX 與場館旁，為比賽日。
- Jamal Murray 的 https://statsdmz.nba.com/pdfs/20221019/20221019_DENUTA.pdf ：同樣為比賽紀錄日期。
- Kawhi Leonard 的 https://statsdmz.nba.com/pdfs/20221020/20221020_LACLAL.pdf ：同樣為比賽紀錄日期。
- Livingston 的 https://www.nba.com/game/mia-vs-nyk-0020800007/box-score ：頁首 Wednesday, October 29th, 2008 為比賽日；不能證明該新版 box-score URL 的發布日期。

此項不質疑出賽真實性，也不改 returnDate。Hayward、LaVine 的 game 頁若來源僅採 box score 而沒有明列日期的賽報，亦應同樣保留 publishedAt:null；本輪網頁解析不足，不將此延伸項目列為已證實錯誤。

## 已反證並排除的疑慮

- LaVine 第三節受傷、第四節曾再上場，有 NBA 2017-02-05 原文支持。灰狼 3 月回憶文的事件日筆誤未流入本筆。
- Livingston returnDate 為 null，summary 清楚寫已知 2008-10-29 出賽紀錄，context 明示不計首次回场天數，沒有把它冒稱首次。
- Koscielny、Oxlade 採 U23；Tavares 與多名 NBA 選手採季前賽；Serena 採女雙；各 summary 的賽事層級均明確。
- Klay 保留中途另一侧 Achilles 事件，沒有把整段缺賽誤稱單次 ACL 的恢復期。Ronaldo、Ibrahimovic、Oxlade 未擅加特定韌帶診斷。
- 日期減法中 Neymar 370、Oladipo 371 天正確；其餘 27 個非 null 區間亦可正常计算。

## 逐筆日曆減法

| slug | eventDate | returnDate | days |
|---|---|---|---|
| klay-thompson-2019-acl | 2019-06-13 | 2022-01-09 | 941 |
| kobe-bryant-2013-achilles | 2013-04-12 | 2013-12-08 | 240 |
| gianmarco-tamberi-2016-ankle | 2016-07-15 | 2017-06-14 | 334 |
| john-tavares-2021-concussion | 2021-05-20 | 2021-09-25 | 128 |
| neymar-2023-acl | 2023-10-17 | 2024-10-21 | 370 |
| cameron-brink-2024-acl | 2024-06-18 | 2025-07-29 | 406 |
| steve-smith-2019-concussion | 2019-08-17 | 2019-08-29 | 12 |
| george-north-2015-concussion | 2015-03-27 | 2015-08-29 | 155 |
| mark-cavendish-2023-clavicle | 2023-07-08 | 2023-10-08 | 92 |
| derrick-rose-acl-2012 | 2012-04-28 | 2013-10-05 | 525 |
| demarcus-cousins-achilles-2018 | 2018-01-26 | 2019-01-18 | 357 |
| kristaps-porzingis-acl-2018 | 2018-02-06 | 2019-10-09 | 610 |
| gordon-hayward-ankle-fracture-2017 | 2017-10-17 | 2018-09-28 | 346 |
| jamal-murray-acl-2021 | 2021-04-12 | 2022-10-03 | 539 |
| dejounte-murray-acl-2018 | 2018-10-07 | 2019-10-05 | 363 |
| kawhi-leonard-acl-2021 | 2021-06-14 | 2022-10-03 | 476 |
| paul-george-leg-fracture-2014 | 2014-08-01 | 2015-04-05 | 247 |
| zach-lavine-acl-2017 | 2017-02-03 | 2018-01-13 | 344 |
| shaun-livingston-knee-2007 | 2007-02-26 | null | not computed |
| alex-oxlade-chamberlain-2018 | 2018-04-24 | 2019-03-08 | 318 |
| david-beckham-2010 | 2010-03-14 | 2010-09-11 | 181 |
| cristiano-ronaldo-2016 | 2016-07-10 | 2016-09-10 | 62 |
| vivianne-miedema-2022 | 2022-12-15 | 2023-10-22 | 311 |
| laurent-koscielny-2018 | 2018-05-03 | 2018-11-26 | 207 |
| andre-gomes-2019 | 2019-11-03 | 2020-02-23 | 112 |
| beth-mead-2022 | 2022-11-19 | 2023-10-15 | 330 |
| leah-williamson-2023 | 2023-04-19 | 2024-01-24 | 280 |
| zlatan-ibrahimovic-2017-knee | 2017-04-20 | 2017-11-18 | 212 |
| victor-oladipo-2019-quadriceps | 2019-01-23 | 2020-01-29 | 371 |
| serena-williams-2021-hamstring | 2021-06-29 | 2022-06-21 | 357 |
