# Decision 22 — 主站風格與新增影片討論稿

使用者要求參考 https://sportsmedicine.tw/ 的字體與版型，重新調整已上線的影片圖鑑。工作途中追加要求：增加影片，不限運動類型、等級或項目，以可內嵌為主，先條列討論確認。

## 已實作視覺範圍

以正式主站 computed styles 與本機 sportsmedicine-tw/src/styles/global.css 交叉核對：中文採 PingFang TC / Microsoft JhengHei / Noto Sans CJK TC 黑體，英文 Barlow Condensed / Fraunces / Inter；16px 本文、1.8 行高、深藍標題、天空藍重點、珊瑚 CTA、藍與暖色淡漸層、80rem 外框、16px 圓角卡片。

首頁提供直接跳至影片的 CTA；卡片播放圖示只顯示在符合現行內嵌條件的案例。調整篩選列、播放器圓角、衛教卡片、頁尾與手機導覽。未改醫療文字、案例事實、來源、核准紀錄或目前五案例的公開選取。

## 新增影片候選：尚未核准加入

九支影片已於 2026-09-06 09:47 台灣時間，從正式網站 origin 的瀏覽器內暫時建立 YouTube privacy-enhanced iframe 測試；未將 iframe 發布到網站。每支影片均實際播放超過一秒、paused=false、readyState=4。完整證據見 evidence/decision-22/candidate-playback.v1.json。

| 候選                            | 運動／內容方向                                   | 來源                | 連結                                        |
| ------------------------------- | ------------------------------------------------ | ------------------- | ------------------------------------------- |
| Alexander Zverev，2022 法網     | 網球；側移時踝部受傷                             | Roland-Garros       | https://www.youtube.com/watch?v=7tpaxZTTi2w |
| Derek Redmond，1992 奧運        | 田徑；衝刺時大腿後側受傷                         | Olympic Games       | https://www.youtube.com/watch?v=t2G8KVzTwfw |
| Kerri Strug，1996 奧運          | 體操；跳馬落地與踝部受傷                         | Olympic Games       | https://www.youtube.com/watch?v=Bwa5Bf656As |
| Carolina Marín，2019 印尼大師賽 | 羽球；落地膝部受傷                               | BWF TV              | https://www.youtube.com/watch?v=nfpXC98FLuE |
| Julie Foucher                   | CrossFit；跳箱受傷片段，事件／診斷來源待完成核對 | Andreas Bjerregaard | https://www.youtube.com/watch?v=4y-1D7jTW_4 |
| Volleyball POV Episode 135      | 排球；球友受傷紀錄，等級與正式診斷待核對         | DTvolleyball        | https://www.youtube.com/watch?v=tEHP_6GA6ZA |
| Inversion Ankle Sprain          | 腳踝翻轉片段；運動項目、等級與事件待核對         | Siwon Kim           | https://www.youtube.com/watch?v=qwuEydc9qXQ |
| Jayson Tatum，2025              | 籃球；原庫已有案例，尚未公開                     | NBA on ESPN         | https://www.youtube.com/watch?v=xSUKd03LJwE |
| Tyrese Haliburton，2025         | 籃球；原庫已有案例，尚未公開                     | ESPN                | https://www.youtube.com/watch?v=azQpbyDBktk |

八支播放器顯示未提供字幕；Marín 的字幕按鈕可用，尚未測試字幕內容。舊公開 gate 要求字幕 available，因此本次只提出取消字幕硬門檻的建議，未改 gate 或擅自加入這些影片。

可內嵌播放僅代表這次實測通過，不代表畫面內診斷、事件、等級、回場日期或影片重製授權已確認。DTvolleyball 標題中的 BROKE 不視為骨折診斷。沒有具名診斷來源時建議標示可見受傷動作／部位；個人回場日期未確認就不推估。經典帶傷完成比賽片段用來討論停賽判斷，不作為鼓勵忍痛續賽的建議。

## 待使用者確認

建議先納入上述通過內嵌測試的候選（補齊事件來源後），字幕非必要，再以相同規則持續找不同運動與賽事等級的影片。新的 injury guide 或醫療敘述須另外核對，不能承接既有三份衛教的核准。

## 視覺改版已發布

- 正式網址：https://sports-injury-atlas.pages.dev/
- 版本：`89567d95f07187fa332ff0c8f06f902788652a9f`。
- Cloudflare Production：`3e4efb20-c900-4b40-850d-9d94118db76e`。
- 四瀏覽器 256 項通過；單元原 1299 項通過，1 個 token 名稱規則衝突修正後，相關 46 項全部通過。Astro check：0 errors / 0 warnings，16 既有 hints。
- 首頁 Lighthouse LCP 980ms、Accessibility 1.00；案例頁 LCP 1654ms、Accessibility 0.96，皆達原門檻。
- 深色模式 320 / 390 / 1440px：Axe 無違規、無水平溢出。
- 正式網站 19 個 HTML / JSON / robots 回應 SHA-256 與產物一致；390px 與 1440px 的首頁及五案例均通過 Axe 與點擊前零第三方請求；無 JavaScript 可讀。
- 五支既有公開影片在更新後正式網站實播通過，字幕可開啟。
- 最終正式驗證：2026-09-06T01:51:56.879Z（台灣 09:51）。

新增九支仍僅為候選。尚待使用者確認，以及各片段的事件／受傷時間點定位；不把上述播放測試當作完整事件或醫療內容的審核。
