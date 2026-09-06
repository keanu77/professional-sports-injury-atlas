# Decision 32 投手與打擊來源複核

研究限定公開資料，外部 Grok 僅收到運動員姓名、事件日期與來源查找指令；沒有私有網站、憑證或本機專案檔。實際 CLI exit0，300.861秒；見 grok-status.json、grok-output.txt 與 grok-pass2.md。

## 四筆主要候選

|選手|事件|最早實際回場|間隔|核對重點|
|---|---|---|---|---|
|Chris Bassitt|2021-08-17|2021-09-23 MLB 對水手|37天|球團確認右臉顴骨區骨折，勿把球擊臉部自動標成腦震盪；先前僅牛棚與模擬賽。|
|Alex Cobb|2013-06-15|2013-07-23 Class A Charlotte 復健賽|38天|僅投兩球因手指水泡退場仍是實際出賽；8月15日是之後的MLB復出。|
|Giancarlo Stanton|2014-09-11|2015-03-05 春訓對紅雀|175天|2月28日為隊內模擬賽；3月3日大學交流賽明確未出場；春訓逐場紀錄與CBS/AP實際賽報一致。|
|Charlie Morton|2021-10-26|2022-03-27 春訓對光芒|152天|之前僅BP與模擬賽；MLB春訓實際賽報與gameLog一致，非4月8日例行賽；傷勢文章更新於10月28日不能當事件日期。|

完整來源標题與URL在 events-draft.json；所有15篇研究來源 HTTP 200 與publication metadata保存在sources-fetch.json。舊MLB文章頁面日期用正文核對，非假填schema沒有的datePublished。官方原始春訓紀錄另存 morton-spring-gamelog.json 與 stanton-spring-gamelog.json。

## 入選前仍需主 agent 驗證

- 四支影片的實際 native iframe 播放、moving footage、時碼與片長；draft durationSeconds=null 明確表示尚未量測，禁止原樣入站。
- 影片觀察文字依實際影片畫面最後調整，不從影片推定診斷。
- 頭頸分類只Cobb使用已確認腦震盪診斷；另兩筆臉部骨折不推論腦震盪。
- Cobb 最早復健回場可能被少數賽事資料省略（僅兩球無出局），用MLB當代報導及官方生涯文字交叉確認。

## 兩筆備選

Bryce Harper 2022 左拇指骨折：8月23日AAA復健首戰、來源齊全，但NewYorkPost片段須確認不是照片報導，且需手指分類。Aroldis Chapman 2014：5月1日Dayton復健首戰有官方賽報；可找到影片多為觀眾拍攝，不優先使用。見alternates.json。

Pass 2 補充：加入7月23日當日MLB賽報 worth-noting/c-54499874，獨立讀取HTTP200與正文確認first rehab／two pitches／right index blister，已加入兩份draft來源。
