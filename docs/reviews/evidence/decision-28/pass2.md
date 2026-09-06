# Decision 28 independent Pass 2

Checked 2026-09-06. Read-only public-source verification of the Codex candidate report; video playback/visual identity is a separate main-agent gate. No repository files edited.

## Codex candidates

| Claim | Verdict / confidence | Verified evidence |
| --- | --- | --- |
| Aaron Rodgers injured 2023-09-11, left Achilles tear | accepted / high | NFL injury report describes MRI and coach confirmation after Monday's Bills game. Injury is explicitly left Achilles, not inferred from video. |
| Rodgers first actual NFL return 2024-09-09 vs 49ers | accepted / high | Jets September 10 postgame report confirms actual Monday-night return and passing touchdown. August 22 report says he did not play the first two preseason games and would sit the finale; September game report confirms actual return rather than merely the plan. |
| Rodgers interval 364 days | accepted / high | Independently computed with Python datetime date subtraction, 2023-09-11 to 2024-09-09. Date difference is not a full recovery standard. |
| Ronald Acuña Jr. injured 2021-07-10, right ACL tear | accepted / high | MLB report dated July 11 explicitly attributes diagnosis to Braves statement after Saturday game; right-field pursuit and awkward landing precede impact with wall. Avoid calling wall impact the medically proven cause. |
| Acuña first rehab game 2022-04-19 | accepted / high | Gwinnett April 19 postgame report expressly says first rehab game, actual 1-for-3 with double against Jacksonville. This is a real Triple-A league game, not simulated training. |
| Acuña MLB return 2022-04-28 | accepted / high | MLB April 29 postgame article describes Thursday game against Cubs. MLB return differs from first minor-league rehab appearance. |
| Acuña interval 283 days to rehab, 292 days to MLB | accepted / high | Independently computed from 2021-07-10. Do not label April 28 first formal competition of any level because the April 19 MiLB game already has an official result. |

### Verified source URLs and publication dates

1. Rodgers diagnosis, publication **2023-09-12**: https://www.nfl.com/news/jets-qb-aaron-rodgers-suffered-torn-achilles-will-miss-remainder-of-season . Main page rendered the timestamp dynamically, but official AMP https://amp.nfl.com/news/jets-qb-aaron-rodgers-suffered-torn-achilles-will-miss-remainder-of-season exposes Published Sep 12, 2023 11:05 AM; Updated same date 04:01 PM.
2. Rodgers actual return, publication **2024-09-10** 02:15 AM: https://www.newyorkjets.com/news/jets-49ers-game-recap-aaron-rodgers-week-1-2024 . Event date is September 9.
3. Rodgers preseason arrangement, publication **2024-08-22** 11:16 AM: https://www.newyorkjets.com/news/jets-will-not-play-aaron-rodgers-starters-vs-giants-preseason . Do not attribute no preseason appearance solely to medical incapacity: the coach explains preparation considerations.
4. Acuña diagnosis, publication **2021-07-11**: https://www.mlb.com/news/ronald-acuna-jr-injured . Event date July 10.
5. Acuña actual rehab game, publication **2022-04-19**: https://www.milb.com/gwinnett/news/acuna-doubles-in-return-but-stripers-lose-2-0-in-jacksonville . Event date same day.
6. Acuña actual MLB return, publication **2022-04-29**: https://www.mlb.com/news/ronald-acuna-jr-returns-from-knee-injury . Event date April 28.

### Concise safe public copy

- Rodgers: 左阿基里斯腱斷裂；2024-09-09 對 49ers 重返 NFL 正式比賽。日期差不等於每位同類傷勢選手的恢復時間。
- Acuña: 右膝前十字韌帶撕裂。2022-04-19 先在 3A 出賽復健，4 月 28 日重返 MLB；兩種回場日期分開記錄。

Grok candidates pending as of this initial report. No video ID, starting second or embedding availability is validated by this fact-check.

## Added scope: Tua Tagovailoa 2024

- **accepted / high**: concussion during Bills–Dolphins game **2024-09-12**, subsequently ruled out. NFL confirms diagnosis; Bills official September 12 recap explicitly records concussion exit in third quarter. No severity grade or long-term prognosis inferred from the footage.
- **accepted / high**: first actual return **2024-10-27** against Arizona. Dolphins October 25 preview calls this first return since September 12; October 27 postgame confirms actual participation after four-game absence. Interval **45 days**, computed independently; not a general concussion recovery recommendation.
- NFL injury source: https://www.nfl.com/news/dolphins-qb-tua-tagovailoa-leaves-thursday-s-game-vs-bills-with-concussion ; publication date unresolved in dynamic page, keep null.
- Bills injury/event source: https://www.buffalobills.com/news/bills-31-dolphins-10-final-score-stats-to-know-game-highlights ; **published 2024-09-12 11:50 PM**.
- Dolphins first-return preview: https://www.miamidolphins.com/news/top-quotes-20241027 ; **published 2024-10-25 12:21 PM**, despite URL containing October 27.
- Dolphins actual-return evidence: https://www.miamidolphins.com/news/game-recap-20241027 ; **published 2024-10-27 08:14 PM**.
- Safe copy: NFL 報導確認腦震盪並退出當場比賽；2024-10-27 對 Cardinals 正式復出。這是本次事件的實際回場紀錄，不以影片推估嚴重程度。

## Added scope: Lindsey Vonn 2013

- **accepted / high**: injury **2013-02-05**, Schladming World Championships super-G; U.S. Ski Team medical director Kyle Wilkens reported right ACL/MCL tears and lateral tibial plateau fracture. Exact diagnoses are source-attributed, not visual inference.
- **accepted / high**: first World Cup/race return **2013-12-06**, Lake Louise downhill, actual 40th place. Official same-day recap and Vonn quote identify first race since February. Interval **304 days**, independently computed.
- **accepted / high**: intervening reinjury occurred **2013-11-19** in downhill training at Copper Mountain. **November 20 is the announcement date**, not injury date. Official update says partial right ACL tear; avoid merging this into a simple uninterrupted recovery from February.
- Injury source: https://www.usskiandsnowboard.org/news/vonn-crashes-world-super-g ; **published 2013-02-05**. Production host works; no need to cite dev host.
- Actual return source: https://www.usskiandsnowboard.org/news/vonn-returns-world-cup-tour ; **published 2013-12-06**.
- Reinjury source: https://www.usskiandsnowboard.org/news/lindsey-vonn-injury-update ; **published 2013-11-20**; body says Tuesday fall, corroborated by athlete biography explicitly November 19 https://www.lindseyvonn.com/about-lindsey/ (publication unknown).
- Optional surgery source if claiming treatment: https://www.usskiandsnowboard.org/news/optimistic-outlook-lindsey-vonn ; **published 2013-02-10**, confirms actual surgery that day. Do not repeat the source's optimistic predictions as completed outcomes.
- Safe copy: 美國滑雪隊確認右膝前十字與內側副韌帶撕裂，合併外側脛骨平台骨折。2013-12-06 在 Lake Louise 重返世界盃；期間 11 月曾訓練再傷，回場日期不等同一路無波折的康復。

Main-agent status: Rodgers not being added because of confirmed embedding restriction; this does not invalidate the independently verified event facts. Vonn alternative video and Acuña passed main-agent playback checks, which are not independently repeated here.

## Grok additions: Antoine Dupont 2023

- **accepted / high**: injured **2023-09-21** vs Namibia, maxillozygomatic fracture of right face; surgery occurred before disciplinary review. World Rugby's primary disciplinary decision records the match date, Dupont's own evidence and France team doctor Philippe Turblin's medical statements. Avoid substituting generic jaw fracture for the more precise attributed diagnosis, and do not label this as concussion solely from head contact.
- **accepted / high**: first return **2023-10-15** vs South Africa, interval **24 days** independently calculated. World Rugby October 13 lineup explicitly identifies return after injury; South Africa Rugby's October 15 postgame confirms actual return.
- **unresolved / exclude from copy**: exact surgery time September 22 around 23:00 was not independently established here. The primary document confirms surgery without safely binding its relative 'last night' statement to a calendar day. No need for this detail.
- Grok FFR injury and postgame URLs returned no body in this tool; that is retrieval uncertainty, not proof the pages do not exist. Use the directly verified replacements below.

Verified sources:

1. World Rugby medical evidence and match date: https://resources.worldrugby-rims.pulselive.com/worldrugby/document/2023/09/27/c960a19f-e04d-4a7c-88ea-540524fd06e8/230927-RWC23-Disciplinary-Decision-Johan-Deysel-Namibia-.pdf . **Document signed 2023-09-27** (hearing September 26); publication timestamp not separately known, so publishedAt null is safest. Pages 1 and 3 support date and injury/surgery. Do not repeat the quoted treatment timelines as public advice.
2. World Rugby return lineup: https://www.rugbyworldcup.com/news/877678/france-announce-squad-to-play-south-africa ; **published 2023-10-13**.
3. Actual return postgame: https://springboks.rugby/news-features/articles/2023/10/15/boks-victorious-in-paris-thriller ; **published 2023-10-15**.

Safe copy: World Rugby 文件引述隊醫及本人證言，確認右側顏面骨折並已接受手術。2023-10-15 在世界盃八強對南非復出；這是顏面骨折事件，不從碰撞畫面另推定腦震盪。

## Grok additions: Aksel Lund Svindal 2016

- **accepted / high**: injury **2016-01-23** at Kitzbühel downhill, right ACL tear. Dagbladet's original reporting directly attributes confirmation to Norwegian skiing official Claus Ryste and explicitly describes right anterior cruciate ligament tear after MRI.
- **accepted / high**: return **2016-12-02**, Val d'Isère World Cup super-G, actual second place. FIS official athlete results show January 23 DNF followed by December 2 second place; same-day SRF race report calls it comeback and includes his immediate reaction. Interval **314 days** independently calculated. A Swedish radio search result says 313; **reject 313** as ordinary date difference (2016 is leap year).
- Grok's FIS PDF and CNN URLs were not retrievable; do not cite them as individually checked. The alternative FIS database and original named-source reporting below were retrieved.
- **unresolved / omit**: same-day completed surgery not proven by the initial Dagbladet article, which anticipates surgery Saturday night. Do not turn a plan into completed treatment; generic injury-only copy avoids this.

Verified sources:

1. Injury and directly named federation official: https://www.dagbladet.no/sport/aksel-lund-svindal-rev-av-korsbandet-i-skrekk-krasjen/60549683 ; **published 2016-01-23 17:50**, subsequently updated 2016-10-11. Use original publication date, not update.
2. FIS actual result history: https://www.fis-ski.com/DB/general/athlete-biography.html?categorycode=WC&competitorid=59877&position=&sectorcode=AL&type=result ; **publishedAt null** (live result database).
3. Return race and athlete reaction: https://www.srf.ch/sport/ski-alpin/weltcup-maenner/weltcup-maenner-rueckkehrer-svindal-ueberstrahlt-alle-ausser-jansrud ; **published 2016-12-02 12:21**.

Safe copy: 挪威滑雪隊主管向媒體確認右膝前十字韌帶撕裂。2016-12-02 於 Val d'Isère 世界盃超大曲道復出，取得第 2 名；這是選手個人出賽紀錄。

## Grok Vonn minor correction

The report's '2013-09 return to snow training' confuses publication month with event date: official https://www.usskiandsnowboard.org/news/vonn-successfully-returns-snow was published **2013-09-02**, but identifies actual return to snow as **2013-08-31**. If training dates are not displayed, no public copy change is necessary. Initial Grok ussatoday.com spelling was not verified; prefer the verified U.S. Ski & Snowboard sources already listed.

## Concussion replacement: Sidney Crosby 2017

- **accepted / high**: event **2017-05-01**, confirmed concussion; NHL report explicitly attributes diagnosis to coach Mike Sullivan.
- **accepted / high**: actual return **2017-05-06**, Game 5 against Capitals; NHL postgame reports actual play after missing Game 4. Interval **5 days**, not a recommended minimum for others.
- Diagnosis source https://www.nhl.com/news/sidney-crosby-has-concussion-out-game-4-for-penguins-289221268 ; **published 2017-05-02**.
- Actual return source https://www.nhl.com/news/sidney-crosby-returns-penguins-fail-to-eliminate-capitals-289315778 ; **published 2017-05-07**, describing previous day's game. Do not reuse its historical 2017 league protocol as current public medical guidance.
- Main agent reports Tua candidate blocked for embedding and excluded; retained Tua fact-check remains valid but does not authorize display.

## Brief head-injury public guidance source check

**Accepted with one wording refinement.** CDC conditions immediate removal and medical assessment on suspected concussion or symptoms after impact. Refine the universal opening to explicitly include this condition:

> 頭部碰撞後若疑似腦震盪，立即停止運動並接受醫療評估。疑似腦震盪不得當天回場，後續回場由醫療人員評估。昏迷、叫不醒、抽搐或新出現手腳無力，立即叫救護車。

- CDC https://www.cdc.gov/heads-up/response/index.html supports removal, no same-day participation, healthcare clearance and healthcare-led return decision. Page displays **2025-09-15**.
- NHS https://www.nhs.uk/conditions/head-injury-and-concussion/ supports emergency ambulance for persisting unconsciousness, inability to stay awake, seizure, and new weakness/numbness after head injury. **2025-05-29 is last reviewed**, not a verified publication date. Label it reviewedAt or use publishedAt null; do not claim it is publication.
- This intentionally short emergency list is not exhaustive; do not add text claiming it lists every danger sign. No exact recovery duration is inferred from Crosby's individual outcome.

## Final implemented JSON read-only sign-off

Read `src/data/videos/event-additions.v1.json` and `src/data/videos/curation.v1.json` in full after the final five candidates were implemented. **No factual/source/date corrections required.**

- Acuña, Vonn, Dupont, Svindal and Crosby injury/return wording agrees with the independently retrieved evidence above; publication dates and nullable live-database/document dates are correctly separated.
- Acuña `returnDate` is April 19 rehab competition, with April 28 MLB return separately stated. Vonn's intervening reinjury and Crosby's non-generalizable five-day record remain visible. Dupont is not incorrectly classified as confirmed concussion.
- Script verified all five slugs have matching video URLs/IDs, injury dates, return dates and source URLs across both files, and exactly the two requested removed slugs are in curation.
- Main agent is responsible for actual iframe/visual playback validation and the final 22-item rendered count; this pass validates the supplied final five-entry source layer and curation records.
- No repository files changed by this audit.
