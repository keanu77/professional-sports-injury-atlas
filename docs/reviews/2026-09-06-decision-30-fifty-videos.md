# Decision 30 — 52 支影片與運動分類

使用者將總數目標提高為「50 個以上」，授權不限運動項目搜尋與加入可內嵌影片。本批新增 30 支，公開總數由 22 提升為 52（7 原病例、45 動作觀察影片），每支有不同的 YouTube ID。首頁移除「更多傷害與案例」整區，新增 13 種運動分類，保留 6 種部位分類、主站視覺與 YouTube 預設縮圖。

## 本批收錄

籃球：Klay Thompson、Kobe Bryant、Cameron Brink、Derrick Rose、DeMarcus Cousins、Kristaps Porzingis、Gordon Hayward、Jamal Murray、Dejounte Murray、Kawhi Leonard、Paul George、Zach LaVine、Shaun Livingston、Victor Oladipo。

足球：Neymar、Alex Oxlade-Chamberlain、David Beckham、Cristiano Ronaldo、Vivianne Miedema、Laurent Koscielny、André Gomes、Beth Mead、Leah Williamson、Zlatan Ibrahimovic。

其他：Gianmarco Tamberi（田徑）、John Tavares（冰球）、George North（橄欖球）、Steve Smith（板球）、Mark Cavendish（自行車）、Serena Williams（網球）。

全站運動分類：籃球 23、棒球 2、板球 1、足球 11、網球 2、羽球 1、田徑 3、體操 1、冰球 2、橄欖球 2、高山滑雪 2、自行車 1、CrossFit 1。

## 搜尋與實際画面查核

實際執行可連網 Codex（345.8 秒）與 Grok（371 秒）；兩者 exit 0，僅提供公開資料提示。AGY 前輪自身 headless 工具受限，本輪未重跑，也未計入完成模型；Qwen 未跑。外部模型只提供線索，來源及影片畫面另由獨立 Pass 2 核對。

以 Chrome 在自有 HTTPS origin 原生 youtube-nocookie iframe 點擊播放、確認時間前進與可用影格，再 seek/目視比賽畫面。未下載或重新上傳影片，未代理或規避禁止嵌入。

重要替換：

- LaVine 原候選 `Hziaz6j34hQ`及 c05d1Rgv7m4 是第四節再上場；改用 g4CkpVi5Iqk，7–8 秒第三節 7:21–7:20 的最初受傷動作，與 NBA 報導相符。
- Cousins 的 ESPN 訪談片 NExQ6KDBXEw 未核到動態事故；改用 LZTOTwvfli0，10 秒起播，跳過前段宣傳。
- Gomes 的醫師講評片 O4tcS9YZDvw 未核到動態事故；改用 8_d9ITG6Rmk。最終觀察文僅描述比賽畫面，移除先前講評片的描述。
- Neymar 改採 TyC Sports 的 YfynOcvpQfY，開頭直接呈現事件；不採較長的個人精華剪輯。
- Porzingis 33 秒、Tavares 92 秒、North 119 秒、Kobe 33 秒、Tamberi 10 秒、Koscielny 40 秒與 Smith 150 秒起播。
- Nadal 及數支 NBC 自行車／滑雪候選實播未通過，未加入公開數量。

## 事件與回場

30 筆新增觀察與公開來源摘要分別存在 batch-30.v1.json、event-batch-30.v1.json。原始病例、D18/D20/D21 核准及歷史批次資料未改，沒有把搜尋結果當成醫療簽核。

Tamberi 首返 2017-06-14；Cavendish 首返 2023-10-08，均修正模型較晚的錯誤日期。Tavares 與多位 NBA 球員區分季前賽／例行賽，Oxlade、Koscielny 區分 U23／一隊；Smith 2019-08-29 已出賽投球，8 月 30 日才打擊；Serena 首返為 Eastbourne 女雙。Klay 缺賽期間另有阿基里斯腱傷，不能把 941 天理解為單次 ACL 復健。Neymar 兩場相隔 370 天。

Livingston 尚未核清傷後所有比賽的首次日期，returnDate 保留 null，只呈現已查得的 2008-10-29 NBA 例行賽出賽，沒有顯示推估天數。Ronaldo、Ibrahimovic、Oxlade 未擅自細分一手來源未確認的組織診斷。

純賽事表／官方 PDF 不把比賽日冒充發布日，publishedAt 已留空。共用日期標籤改為「再次出賽」，避免把季前賽標成正式賽。字幕未經文字驗證者為 not-verified，頁面說明以播放器提供為準。

非頭部處理補上不得自行扳正，以及明顯變形、深傷口／露骨、麻木或末端冰冷變色時立即叫救護車，參考 NHS。頭頸部維持 CDC/NHS 的疑似腦震盪停賽、不得當天回場及警訊說明。

## 程式 Pass 2 與驗證

已修正不同 YouTube 網址形式可重複計數的漏洞，改以解析後的 videoId 去重，並加入 www／無 www／youtu.be 變異測試。新增 sports receipt 的路由及恰好一次影片覆蓋檢查，浏览器驗證含運動分類、無 JS 往返及 D30 頭傷頁。

所有批次目前同為 2026-09-06 查核；loader 明確拒絕混用不同查核日，避免新批日期被默默忽略。日後跨日新增需先導入逐筆查核日期，不能重標舊資料。

Astro check：0 errors、0 warnings、16 既有 hints。全單元 1,320 項：首輪 1,307 通過、13 個本機 socket 測試被 sandbox EPERM 阻擋；僅將相關三檔於允許本機 socket 的環境重跑，51/51 通過，涵蓋原 13 個失敗。四瀏覽器導覽／播放器／民眾頁面 88/88 通過。

變更程式與資料全部通過 Prettier 及 diff whitespace check。全庫 format:check 仍有 47 份既有歷史報告／證據格式警告，本輪未重寫歷史證據。首次在未提交 root 建置被既有 D18 dirty-tree guard 阻擋，改於乾淨隔離副本正常建置；未放寬 guard。

預覽部署：6bb1bd96.sports-injury-atlas.pages.dev。81 HTML、7 病例、45 觀察片、6 部位分類、13 運動分類、1,156 內部連結，artifact 驗證通過。預覽後僅精簡 Gomes 觀察文，影片 ID／起播時間與播放器不變；正式發布將另驗所有檔案雜湊。

最終正式部署、全站瀏覽器及 30 支實播結果見下方「正式完成」。證據目錄：docs/reviews/evidence/decision-30/。

預覽 30 支新增影片首次全部實播成功。全站瀏覽器第一轮在 WNBA 來源觸發舊測試的 `href*=nba.com` 子字串誤判，已改精確 hostname／子網域比對，保留 WNBA 正常來源連結並重跑；沒有放寬 NBA 真正網域的呈現政策。

## 正式完成

來源 `d3a003fd1f8baedd8b4f77b6ee64ab397133a27d` 已推送；Production/main `21d81956-cfef-4d02-b7e9-6f0d3e79063b`，正式 https://sports-injury-atlas.pages.dev/。

30 支新增影片於正式網址第一次全部實播成功，ID／起播时间符合清單，沒有失敗或重試。原 22 支保留本日此前正式實播證據。

2026-09-06T09:12:54.442Z，正式 85 回應（81 HTML 及 JSON／robots）雜湊與來源產物全部吻合；72 頁 × 320／390／1440 三種尺寸共 216 組通過。來源展開、運動／部位分類集合與數量、縮圖、Axe、無水平溢位、零點擊前第三方請求、無 JavaScript 導覽及已刪除影片最終 404 均通過。首頁手機與桌面截圖亦已人工檢視。

正式 root dist 與 receipt 保留；所有本輪使用者要求已完成。收尾證據與交接另行提交，不需重部署。
