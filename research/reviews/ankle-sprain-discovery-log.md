# Ankle-sprain discovery log

## Scope and checkpoint

- Authorized scope: NBA source discovery only under `nba-v1`; no case authoring, medical review, publication, deployment, or indexing.
- Checkpoint time: 2026-08-07T10:08:25Z.
- Candidate rows at this checkpoint: 28 total; 26 recent and 2 proposed classics; 7 `source-ready`, 20 `needs-source`, and 1 `excluded`; 0 `source-verified`.
- Researcher ceiling was respected: review fields remain blank and no content-owner identity was invented.
- The preflight authorization assertion passed for role `nba-injury-case-source-discovery` and scope `nba-source-discovery-only`.

## Search and domain log

Searches were used only to find leads; snippets were never treated as source evidence. Query families included:

- NBA ankle sprain athlete/game/date queries for Anthony Edwards, LaMelo Ball, Trae Young, Ja Morant, CJ McCollum, LeBron James, Kyrie Irving, Dejounte Murray, Anfernee Simons, D'Angelo Russell, Scoot Henderson, and Kobe Bryant.
- `site:nba.com/news`, `site:nba.com/watch/video`, `site:official.nba.com`, and official team-page variants.
- Original provider/channel checks on NBA Watch and ESPN's verified YouTube channel.
- Classic searches for Kobe Bryant's 2013 Lakers-Hawks landing event and the NBA Official officiating page.

Source families opened or searched: NBA.com News, NBA.com Watch, NBA Official, Charlotte Hornets team pages, ESPN's original YouTube video and channel, and the privacy-enhanced YouTube player.

## Opened source-ready pages

Every page used by a `source-ready` row was opened at its original URL in the in-app browser. Canonical URLs, visible titles, publishers, publication dates, and access date were recorded.

### Anthony Edwards — 2025-04-03

- Diagnosis/event: <https://www.nba.com/news/nightly-pulse-nba-news-highlights-from-april-3>
- Video: <https://www.nba.com/watch/video/anthony-edwards-ankle-injury-scare-heads-to-locker-room>
- Channel: <https://www.nba.com/watch/featured>

### LaMelo Ball — 2025-01-27

- Diagnosis: <https://www.nba.com/news/hornets-lamelo-ball-injury-update>
- Event: <https://www.nba.com/news/hornets-lamelo-ball-ankle-injury>
- Video: <https://www.nba.com/watch/video/lamelo-ball-left-ankle-sprain-injury-lakers-hornets-jan-27>
- Channel: <https://www.nba.com/watch/featured>

### Anthony Edwards — 2023-03-17

- Diagnosis/event: <https://www.nba.com/news/anthony-edwards-sprains-right-ankle-exits-early-vs-bulls>
- Original video: <https://www.youtube.com/watch?v=V9mtX4mE8wQ>
- Original channel: <https://www.youtube.com/@espn>
- Privacy-enhanced manual check: `https://www.youtube-nocookie.com/embed/V9mtX4mE8wQ?autoplay=0`; player was present, paused, and at time zero.

### LaMelo Ball — 2022-11-16

- Diagnosis/event: <https://www.nba.com/news/lamelo-ball-reinjures-ankle-after-stepping-on-fans-foot>
- Video: <https://www.nba.com/watch/video/lamelo-ball-leaves-game-with-left-ankle-injury>
- Channel: <https://www.nba.com/watch/featured>

### Trae Young — 2021-04-21

- Diagnosis: <https://www.nba.com/news/report-trae-youngs-ankle-injury-not-considered-serious>
- Event: <https://www.nba.com/news/trae-young-helped-off-court-after-an-apparent-ankle-injury>
- Video: <https://www.nba.com/watch/video/traeinjuryvsknicks>
- Channel: <https://www.nba.com/watch/featured>

### Ja Morant — 2020-12-28

- Diagnosis: <https://www.nba.com/news/ja-morant-out-3-5-weeks-with-grade-2-ankle-sprain>
- Event: <https://www.nba.com/news/ja-morant-exits-vs-nets-with-ankle-injury>
- Video: <https://www.nba.com/watch/video/morant-injures-ankle-exits-in-wheelchair>
- Channel: <https://www.nba.com/watch/featured>

### CJ McCollum — 2020-01-17

- Diagnosis/event: <https://www.nba.com/news/cj-mccollum-exits-left-ankle-sprain>
- Video: <https://www.nba.com/watch/video/cj-mccollum-exits-after-an-ankle-injury>
- Channel: <https://www.nba.com/watch/featured>

## Verification outcomes

- NBA Watch originals were treated as `external-link-only`, never as verified embeds.
- On the NBA Watch originals promoted to `source-ready`, the in-page video control was opened and no caption/subtitle control or text track was observable; `caption_status=unavailable` records that accessibility limitation.
- The ESPN original displayed its captions control as unavailable. Its privacy-enhanced YouTube embed was manually opened with autoplay disabled and remained paused at time zero.
- NBA Watch and ESPN channel pages were opened to verify league or broadcaster/rightsholder provenance.
- First-party diagnosis claims are deliberately narrow paraphrases of the target ankle-sprain category; grade, prognosis, imaging, and return time were not carried into `diagnosis_claim`.
- For each `source-ready` row, the event-source fields identify the same Browser-opened original event-video page as the video fields. Diagnosis articles keep their exact visible metadata in the diagnosis-source fields. This records the event page's actual event-date publication metadata without rewriting next-day article dates.

## Needs-source and unresolved leads

The following recent leads remain `needs-source`; only core event identity was checkpointed and no search snippet was promoted into source metadata:

- Anthony Edwards — 2025-05-08, Timberwolves vs. Warriors, playoffs: NBA diagnosis/event page found; accepted original in-game event upload still unresolved.
- Scoot Henderson — 2023-11-01, Trail Blazers at Pistons: team/league diagnosis lead found; accepted original event upload unresolved.
- D'Angelo Russell — 2023-02-23, Lakers vs. Warriors: league diagnosis lead found; accepted original event upload unresolved.
- Anfernee Simons — 2023-02-14, Trail Blazers vs. Wizards: official diagnosis lead found; accepted original event upload unresolved.
- Dejounte Murray — 2022-12-07, Hawks at Knicks: direct NBA Watch lead exists but search indicated possible content unavailability; original page outcome still requires a row-level decision.
- Kyrie Irving — 2021-06-13, Nets at Bucks, playoffs: league diagnosis/event lead found; accepted original event upload unresolved.
- LeBron James — 2021-03-20, Lakers vs. Hawks: league diagnosis/event page found; accepted original event upload unresolved.

## External leads intake — 2026-08-07

The external JSON was used only to locate possible missing events. Each retained URL and event date below was checked on an opened original page in the Browser; search summaries and JSON assertions were not treated as evidence. None of the external leads supplied a verified original event video, so no intake row was promoted to `source-ready`.

| Candidate                                                              | Browser-opened evidence                                                                                                                                                                                                                              | Intake decision and remaining gap                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kawhi Leonard, 2017-05-14 at Golden State (`CAND-NBA-ANKLE-2017-001`)  | NBA.com, `https://www.nba.com/news/san-antonio-spurs-kawhi-leonard-out-rest-game-1-ankle-injury`; Yahoo Sports, `https://sports.yahoo.com/kawhi-leonard-sprains-ankle-will-not-return-game-1-western-conference-finals-212824381.html`               | The NBA page identifies the Game 1 injury and the Yahoo page visibly states a left ankle sprain on 2017-05-14. Retained `needs-source`; original event video unresolved.                                                                                        |
| Jimmy Butler, 2023-04-30 at New York (`CAND-NBA-ANKLE-2023-005`)       | CBS Sports, `https://www.cbssports.com/nba/news/jimmy-butler-injury-update-heat-star-out-for-game-2-vs-knicks-due-to-ankle-sprain/`                                                                                                                  | The opened article body identifies the right ankle sprain in Miami's Game 1 win on April 30. Retained `needs-source`; no original event video or complete visible publication metadata was verified.                                                            |
| Trae Young, 2021-06-27 at Milwaukee (`CAND-NBA-ANKLE-2021-004`)        | Fox News initial report, `https://www.foxnews.com/sports/hawk-trae-young-injures-ankle-ref-foot`; CBS Sports follow-up, `https://www.cbssports.com/nba/news/hawks-trae-young-sprains-ankle-after-stepping-on-referees-foot-in-game-3-loss-to-bucks/` | The opened initial report described an ankle sprain, but the opened follow-up visibly reported the Hawks' MRI diagnosis as a right-foot bone bruise. Recorded `diagnosis_status=conflicted` and `excluded`; it is not counted as a confirmed ankle-sprain case. |
| Stephen Curry, 2017-12-04 at New Orleans (`CAND-NBA-ANKLE-2017-002`)   | ESPN, `https://www.espn.com/nba/story/_/id/21670701/golden-state-warriors-guard-steph-curry-leaves-monday-night-win-sprained-right-ankle`; NBA schedule, `https://www.nba.com/games?date=2017-12-04`                                                 | ESPN's visible document title explicitly states a right ankle sprain; the NBA schedule confirms the date and matchup. Retained `needs-source`; original event video unresolved.                                                                                 |
| Luka Doncic, 2023-01-26 at Phoenix (`CAND-NBA-ANKLE-2023-006`)         | ESPN, `https://www.espn.com/nba/story/_/id/35535016/mavericks-star-luka-doncic-exits-game-vs-suns-ankle-injury`; game page, `https://www.basketball-reference.com/boxscores/202301260PHO.html`                                                       | ESPN's visible document title states an ankle sprain; the game page confirms date and matchup. Retained `needs-source`; side and original event video remain unresolved.                                                                                        |
| Jalen Brunson, 2026-01-14 at Sacramento (`CAND-NBA-ANKLE-2026-001`)    | ESPN, `https://www.espn.com/nba/story/_/id/47616400/knicks-jalen-brunson-sprains-right-ankle-ruled-half`; game page, `https://www.basketball-reference.com/boxscores/202601140SAC.html`                                                              | ESPN's visible title explicitly states a right ankle sprain; the game page confirms date and matchup. Retained `needs-source`; original event video unresolved.                                                                                                 |
| Kevin Durant, 2024-12-03 vs San Antonio (`CAND-NBA-ANKLE-2024-001`)    | ESPN, `https://www.espn.com/nba/story/_/id/42766975/suns-lose-kevin-durant-ankle-sprain-vs-spurs`; game page, `https://www.basketball-reference.com/boxscores/202412030PHO.html`                                                                     | ESPN's visible title explicitly states a left ankle sprain; the game page confirms date and matchup. Retained `needs-source`; original event video unresolved.                                                                                                  |
| Ja Morant, 2025-04-15 at Golden State (`CAND-NBA-ANKLE-2025-004`)      | ESPN, `https://www.espn.com/nba/story/_/id/44742404/ja-morant-plays-ankle-sprain-grizzlies-lock-8-seed`; NBA schedule, `https://www.nba.com/games?date=2025-04-15`                                                                                   | ESPN's visible title states an ankle sprain and the NBA Play-In schedule resolves the lead's previously inferred date. Retained `needs-source`; side and original event video unresolved.                                                                       |
| Anthony Davis, 2022-02-16 vs Utah (`CAND-NBA-ANKLE-2022-003`)          | ESPN, `https://www.espn.com/nba/story/_/id/33308443/anthony-davis-exits-los-angeles-lakers-game-vs-utah-jazz-injury`; NBA schedule, `https://www.nba.com/games?date=2022-02-16`                                                                      | The opened ESPN title identifies an ankle injury, not an explicit sprain; the schedule confirms date and matchup. Retained `needs-source` with `diagnosis_status=unconfirmed`; explicit sprain diagnosis and original event video unresolved.                   |
| Jayson Tatum, 2023-05-29 vs Miami (`CAND-NBA-ANKLE-2023-007`)          | ESPN, `https://www.espn.com/nba/story/_/id/37758399/jayson-tatum-hampered-ankle-injury-celtics-fail-make-history-game-7-loss-heat`; game page, `https://www.basketball-reference.com/boxscores/202305290BOS.html`                                    | The opened ESPN title identifies an ankle injury, not an explicit sprain; the game page confirms Game 7 date and matchup. Retained `needs-source` with `diagnosis_status=unconfirmed`; explicit sprain diagnosis and original event video unresolved.           |
| Scottie Barnes, 2022-04-16 at Philadelphia (`CAND-NBA-ANKLE-2022-004`) | NBA.com, `https://www.nba.com/news/toronto-raptors-rookie-scottie-barnes-exits-game-1-with-sprained-ankle`; NBA schedule, `https://www.nba.com/games?date=2022-04-16`                                                                                | The opened NBA page explicitly states a left ankle sprain and the schedule confirms Game 1 date. Retained `needs-source`; original event video unresolved.                                                                                                      |
| LaMelo Ball, 2023-11-26 at Orlando (`CAND-NBA-ANKLE-2023-008`)         | ESPN, `https://www.espn.com/nba/story/_/id/39000473/hornets-lamelo-ball-miss-multiple-weeks-right-ankle-sprain`; NBA schedule, `https://www.nba.com/games?date=2023-11-26`                                                                           | ESPN's visible title explicitly states an ankle sprain and the NBA schedule resolves the lead's previously inferred date. Retained `needs-source`; original event video unresolved.                                                                             |
| Kobe Bryant, 2000-06-09 vs Indiana (`CAND-NBA-ANKLE-2000-001`)         | ESPN archive, `https://www.espn.com/nba/playoffs00/s/2000/0609/576489.html`; game page, `https://www.basketball-reference.com/boxscores/200006090LAL.html`                                                                                           | The opened archive body explicitly states a left ankle sprain in NBA Finals Game 2; the game page resolves the lead's missing date. Retained as a proposed `needs-source` classic; original event video and first-party diagnosis remain unresolved.            |

## Classic and duplicate decisions

- Kobe Bryant — 2013-03-13 is retained only as a proposed classic. NBA Official's original event page was opened. Its legacy video URL redirected to the general NBA Watch page, so a usable canonical event video and first-party diagnosis audit remain unresolved. The row is not self-approved.
- Kobe Bryant — 2000-06-09 is retained as a second proposed classic after the opened ESPN archive and game page established the Finals Game 2 event and date. It remains `needs-source` and is not self-approved.
- A 2021 CJ McCollum Hawks article was initially encountered but was not paired with the 2020 Mavericks video. The dedicated 2020 Mavericks article is used, avoiding a cross-event duplicate/identity error.
- No athlete/date/injury duplicate was retained in this checkpoint.

## Media-handling record

No video, audio, screenshot, thumbnail, transcript, article body, clip, or copyrighted media was downloaded, copied, recorded, stored, or reuploaded. Only short factual paraphrases, page titles, publishers, dates, canonical URLs, provenance outcomes, and accessibility/embed outcomes are stored.

## Current status

- Total candidates: 28
- Recent candidates: 26
- Classic candidates: 2
- Source-ready: 7
- Needs-source: 20
- Excluded: 1
- Source-verified: 0
- Reviewed fields: intentionally blank
