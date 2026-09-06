# Decision 31 棒球／冰球來源對抗驗證

範圍：9 個全新事件，僅寫 /tmp/atlas31/baseball-hockey。公開事件與公開 URL 研究；未把私有程式碼交給外部 CLI。

## 外部模型執行

- Skill preflight 已確認 codex、grok、agy、ollama 四個執行檔均存在；沙盒 localhost Ollama probe 無回覆。本維度只執行 Codex。
- Codex argv: codex --search exec --sandbox read-only --skip-git-repo-check <public prompt>；stdin DEVNULL；cwd隔離目錄。
- codex-status.json: exitCode 0；elapsedSeconds 215.098；stdout非空，stderr包含實際web search紀錄。
- Codex 報告日期與自行查核的9組事件一致。不同上傳來源不算新增事件；主agent9支選定影片均已有實播證据。
- 剔除/修正：Codex無法找到Hoskins YouTube，瀏覽器另找到MLB Games可播放片；Díaz官網賽報發布日應3/12而非3/11。
- 深化：Hudson官方手術診斷、McDavid後續披露追加；未將對手惡意/醫療建議從模型推論入稿。

## 逐筆證據

### edwin-diaz-2023-patellar-tendon

事件 2023-03-15；採用回場 2024-03-11。3 月 5 日先參加小聯盟隊內模擬賽；此處回場日期採之後對其他球隊的春訓賽。

- [MLB：Díaz 右膝髕腱傷勢與手術](https://www.mlb.com/news/edwin-diaz-knee-surgery)：`complete patellar tendon tear in his right knee`。injury and surgery; Wednesday night = 2023-03-15; article date 2023-03-17。

- [MLB：Díaz 春訓實際復出賽報](https://www.mlb.com/news/edwin-diaz-strikes-out-side-in-spring-debut)：`Monday night's 1-0 loss to the Marlins`。actual appearance 2024-03-11; publication 2024-03-12。

- [Sports Illustrated：先前隊內模擬賽紀錄](https://www.si.com/mlb/mets/onsi/news/new-york-mets-closer-edwin-diaz-set-to-return-on-monday-joe9)：`Diaz pitched in two simulated minor league games in the backfields`。retrospective previous Tuesday 2024-03-05; distinguish intrasquad simulation from scheduled March11 game。

### rhys-hoskins-2023-acl

事件 2023-03-23；採用回場 2024-03-01。回場日期採 MLB 官方春訓逐場出賽紀錄，並非 3 月底例行賽開幕。

- [MLB：Hoskins 左膝 ACL 傷勢公告](https://www.mlb.com/news/rhys-hoskins-suffers-left-knee-injury)：`tore the ACL in his left knee`。injury on 2023-03-23, article date same day。

- [MLB：2024 年 3 月 1 日春訓出賽紀錄](https://www.mlb.com/gameday/padres-vs-brewers/2024/03/01/748155/final/box)：`Padres 3, Brewers 4 Final Score (03/01/2024)`。actual game corroborated by MLB API; gamePk748155。

- [MLB 官方資料：Hoskins 2024 春訓逐場紀錄](https://statsapi.mlb.com/api/v1/people/656555/stats?stats=gameLog&group=hitting&season=2024&gameType=S)：`"date":"2024-03-01","gameType":"S","gamesPlayed":1`。structured MLB API first chronological split; 3 PA, DH, 0-2 with walk. Not a verbatim contiguous prose quote.。

### tim-hudson-2013-ankle

事件 2013-07-24；採用回場 2014-03-02。這是傷後首次春訓比賽，與之後的大聯盟例行賽復出分開。

- [MLB：Hudson 骨折後春訓首度登板](https://www.mlb.com/news/pitcher-tim-hudson-strong-in-first-cactus-league-start-for-giants/c-68600942)：`In his first competitive activity as a Giant, Hudson threw two hitless innings Sunday`。actual spring debut 2014-03-02; article shows March2,2014; ankle event July24。

- [MLB：Hudson 右踝骨折手術紀錄](https://www.mlb.com/news/hudson-undergoes-surgery-for-fractured-ankle/c-54853176)：`repair his deltoid ligament and fractured fibula in his right ankle`。MLB surgery report 2013-07-26; injury previous Wednesday 2013-07-24, fracture/dislocation。

### buster-posey-2011-ankle

事件 2011-05-25；採用回場 2012-03-09。回場日期採春訓出賽；報導發布於翌日，並非比賽當天。

- [MLB：Posey 生涯傷勢紀錄](https://www.mlb.com/player/buster-posey-457763)：`torn ligaments in his ankle, fractured fibula in his lower left leg`。2011 bio entry supports left fibula and ankle ligaments; injured night before May26。

- [NBC Sports：Posey 傷後首場春訓賽報](https://www.nbcsports.com/mlb/news/buster-posey-catches-two-innings-in-first-game-since-collision-last-may)：`Posey caught two innings yesterday in his Cactus League debut against the Reds`。publication March10, actual match March9; photo caption explicitly March9,2012。

### kendrys-morales-2010-ankle

事件 2010-05-29；採用回場 2012-03-16。該場熱身賽允許安打後換代跑；3 月 22 日的大聯盟春訓並非首次比賽。

- [CBS Sports：Morales 傷後首場小聯盟熱身賽](https://www.cbssports.com/mlb/news/kendrys-morales-plays-in-a-minor-league-game/)：`For the first time since suffering a broken ankle`。web.run full article lines667-684 supports March16,2012 debut, left ankle May29,2010; HTTP406 is access restriction not dead source。

- [Los Angeles Times：3 月 22 日大聯盟春訓紀錄](https://www.latimes.com/sports/la-xpm-2012-mar-22-la-sp-sn-angels-kendrys-morales-has-two-hits-in-in-angels-win-20120322-story.html)：`singled twice in three at-bats`。actual March22 big-league exhibition, later than March16 minor exhibitions。

### steven-stamkos-2013-tibia

事件 2013-11-11；採用回場 2014-03-06。日期採 NHL 生涯紀錄的首次復出賽，不以恢復滑冰訓練代替比賽。

- [NHL：Stamkos 受傷與首次復出日期](https://www.nhl.com/news/steven-stamkos-career-timeline-with-lightning-281087120)：`March 6, 2014: In Stamkos' first game back from his broken leg`。also Nov11,2013 right tibia; official timeline publication June30,2016。

- [Sports Illustrated：Stamkos 復出對軍刀賽報](https://www.si.com/nhl/2014/03/07/steven-stamkos-returns-to-lightning-as-captain)：`first game action for Stamkos since he broke his right shin in Boston on Nov. 11`。actual Buffalo return; date independently verified NHL timeline; source publication left null。

### connor-mcdavid-2019-pcl

事件 2019-04-06；採用回場 2019-09-24。採實際季前賽出賽日期；官方賽報於 9 月 25 日發布。

- [NHL：McDavid 左膝傷勢公告](https://www.nhl.com/news/edmonton-oilers-connor-mcdavid-to-begin-rehabilitation-for-leg-injury-306715866)：`a small PCL ligament tear in his left knee`。2019-04-13 initial announcement; no prediction promoted as actual recovery。

- [NHL：McDavid 傷後首次季前賽紀錄](https://www.nhl.com/news/arizona-coyotes-edmonton-oilers-preseason-game-recap-309439706)：`held without a point in his preseason debut`。actual Tuesday Sept24,2019; published Sept25; 20:38 ice time confirms participation。

- [NHL：McDavid 傷勢後續披露](https://www.nhl.com/news/connor-mcdavid-declined-surgey-to-play-this-season-314292808)：`multiple tears in the knee and a broken tibia`。NHL later disclosure January26,2020; injury April6,2019。

### mikhail-sergachev-2024-leg

事件 2024-02-07；採用回場 2024-04-27。這次骨折與先前缺席 17 場的下肢傷勢不同；回場當晚已有實際出賽紀錄。

- [閃電：Sergachev 骨折手術公告](https://www.nhl.com/lightning/news/tampa-bay-lightning-defenseman-mikhail-sergachev-has-successful-surgery)：`fractures to both the tibia and fibula in his left leg`。official announcement Feb8; injury Wednesday Feb7,2024。

- [NHL：Sergachev 骨折後首次復出賽報](https://www.nhl.com/news/mikhail-sergachev-return-from-broken-leg-boosts-lightning)：`Defenseman has assist in 1st game back`。actual April27,2024 playoff return, article April28; prior17 missed games relates separate injury。

- [NHL：4 月 27 日 Sergachev 助攻影片紀錄](https://www.nhl.com/video/topic/top-plays/fla-tbl-hagel-scores-goal-against-sergei-bobrovsky-6351902134112)：`In his Game 4 return, Mikhail Sergachev feeds it to Brandon Hagel`。official video has April27,2024 date; supports completed participation。

### max-pacioretty-2011-concussion

事件 2011-03-08；採用回場 2011-09-21。這次包含頸椎骨折，不能把其休賽時間當成所有腦震盪的恢復時程。

- [TVA：球隊確認 Pacioretty 腦震盪與頸椎傷勢](https://www.tvanouvelles.ca/2011/03/09/vertebre-fracturee-pour-pacioretty)：`une sérieuse commotion cérébrale et d'une fracture à la quatrième vertèbre cervicale`。TVA web.run opened lines85-96; March9 report on previous Tuesday March8; curl redirect loop is access limitation。

- [NBC Sports：Pacioretty 傷後首次季前賽](https://www.nbcsports.com/nhl/news/max-pacioretty-plays-for-first-time-since-zdeno-chara-hit)：`Pacioretty suited up tonight for the Canadiens`。September21,2011 preseason vsBuffalo; actual participation and neck fracture/concussion explicitly reported。

## 整合注意

- clips.json 的 startSeconds/observation 是保守初稿，主agent需要依實際画面定稿。duration為實際player值取ceil；來源來源標題/author取實播metadata。
- 顯示分類沿用現有小腿／阿基里斯腱，但Stamkos、Sergachev文案明確寫骨折，沒有誤稱阿基里斯腱斷裂。
- 所有returnDate為實際出賽；Morales熱身可換代跑應保留context；Díaz模擬賽另標。
- 委派影片未驗播放的限制由主agent原生iframe實播補足；來源内容不以HTTP200單獨驗證。
