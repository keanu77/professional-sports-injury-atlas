# Achilles rupture candidate discovery log

Status: Task 2 discovery checkpoint completed on 2026-08-07; source-ready review and later human gates remain separate tasks.

## Scope and current counts

- 18 distinct NBA candidate events researched: 16 recent and two classic curation candidates.
- All rows are conservatively checkpointed as `needs-source`; only rows that complete diagnosis, original-video provenance, channel, embed/external-link, and caption checks will be promoted to `source-ready`.
- No candidate is reviewed, published, licensed, or source-verified at this stage.

## Search families used

- Athlete name plus Achilles, opponent, and event date.
- Team medical update or official release queries on NBA/team domains.
- NBA Watch event-video queries using athlete, opponent, round, and game number.
- YouTube event-video queries restricted by athlete/date and checked against the uploader's original channel.
- NBA game and team event-context pages.

## Source families opened so far

- Official NBA and team pages: `official.nba.com`, `nba.com/news`, and NBA team news/medical-release routes.
- Original video platforms: NBA Watch and YouTube.
- Uploader/channel checks: NBA Watch hub and ESPN's canonical YouTube channel.
- Privacy-enhanced embed check: `youtube-nocookie.com` with `autoplay=0`.

## Candidate curation and gaps

- Recent candidates cover events from Rudy Gay (2017) through Tyrese Haliburton (2025).
- Kobe Bryant (2013) and Wesley Matthews (2015) are retained as classic candidates. Both remain proposals pending the later named human gate, and accepted original event videos remain unresolved.
- The recurring unresolved gap is an accepted original in-game injury-event video. Fan uploads, reposts, analysis packages, interviews, compilations, and full-game recap packages are not accepted substitutes.
- Chris Clemons also lacks an opened first-party page that explicitly confirms the rupture; a later injury report mentioning Achilles surgery is not being treated as equivalent confirmation.
- Candidate identities are unique by athlete and event date; no duplicate event rows were retained.

## Audit handling

- Search snippets were used only to discover candidate URLs and were not recorded as evidence.
- Actual source pages are being opened in the in-app browser before any metadata is retained.
- No video, audio, thumbnail, screenshot, transcript, article body, or other source media was downloaded or stored.
- Reviewed fields remain blank, and no commit will be created by the researcher.

## External leads intake — 2026-08-07

The external Achilles JSON was treated only as a lead queue. Comparing event identity against the existing ledger left one valid missing event. Its original pages were opened in the Browser before any metadata was retained; JSON fields and search summaries were not used as evidence.

| Candidate                                                            | Browser-opened evidence                                                                                                                                                                      | Intake decision and remaining gap                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wesley Matthews, 2015-03-05 vs Dallas (`CAND-NBA-ACHILLES-2015-018`) | ESPN, `https://www.espn.com/nba/story/_/id/12430843/wesley-matthews-portland-trail-blazers-injures-left-foot`; game page, `https://www.basketball-reference.com/boxscores/201503050POR.html` | ESPN's visible document title explicitly states an Achilles rupture, and the opened game page confirms date and matchup. Retained as a proposed `needs-source` classic; the article body/publication metadata, side, first-party diagnosis, and original event video remain unresolved rather than inferred. |

Two explicit lead-file exclusions were not appended: Klay Thompson's 2020 rupture occurred during an offseason workout, and John Wall's 2021 rupture followed a fall at home. Neither is an in-game NBA event. No original event video was supplied or verified for Wesley Matthews, and no media was downloaded or stored during this intake.

## Current status

- Total candidates: 18
- Recent candidates: 16
- Classic candidates: 2
- Source-ready: 7
- Needs-source: 11
- Source-verified: 0
- Excluded ledger rows: 0 (the two non-game leads were not appended)
- Reviewed fields: intentionally blank

## Source-ready follow-up — 2026-08-07

The following seven rows now pass the frozen source-ready contract. For every row, the NBA Watch event page and the first-party diagnosis page were opened in the Browser. The event page identifies the full athlete, carries the event date as its visible publication date, and shows the exact in-game injury event. NBA is recorded as `external-link-only`; no caption/subtitle control was observable. Claims remain narrow diagnosis paraphrases.

| Candidate                     | Original event page                                                                                        | First-party diagnosis page                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Kevin Durant, 2019-06-10      | `https://www.nba.com/watch/video/kevin-durant-leaves-game-5-with-injury`                                   | `https://www.nba.com/news/warriors-durant-achilles-injury-update`                        |
| Dwight Powell, 2020-01-21     | `https://www.nba.com/watch/video/dwight-powell-injury`                                                     | `https://www.nba.com/news/dwight-powell-has-surgery-achilles`                            |
| Brandon Clarke, 2023-03-03    | `https://www.nba.com/watch/video/brandon-clarke-leaves-the-game-due-to-injury`                             | `https://www.nba.com/grizzlies/news/memphis-grizzlies-medical-update-030423`             |
| Dejounte Murray, 2025-01-31   | `https://www.nba.com/watch/video/dejounte-murray-right-leg-injury-pelicans-celtics-jan-31`                 | `https://www.nba.com/news/pelicans-murray-injury`                                        |
| Damian Lillard, 2025-04-27    | `https://www.nba.com/watch/video/damian-lillard-lower-left-leg-injury-exits-1st-quarter-game-4-pacers`     | `https://www.nba.com/bucks/news/medical-update-on-damian-lillard-3`                      |
| Jayson Tatum, 2025-05-12      | `https://www.nba.com/watch/video/jayson-tatum-right-lower-leg-injury-celtics-knicks-game-4`                | `https://www.nba.com/celtics/news/press-release-20250513-jayson-tatum-injury-update`     |
| Tyrese Haliburton, 2025-06-22 | `https://www.nba.com/watch/video/tyrese-haliburton-right-leg-injury-pacers-thunder-game-7-2025-nba-finals` | `https://www.nba.com/pacers/news/indiana-pacers-medical-update-tyrese-haliburton-250623` |

The remaining strongest leads were not promoted. NBA Watch pages for Wesley Matthews, Klay Thompson, and Jamal Murray display the day after the local event date and their titles do not contain the date; other candidates resolve only to fan/repost footage, official analysis/rehabilitation packages, or no accepted original event video. The ESPN Australia Donte DiVincenzo event short was opened and verified as broadcaster footage, but its visible publication date is 2026-04-26 while the event was 2026-04-25 and its title contains no event date. Those gaps are preserved rather than rewriting source metadata or weakening the immutable policy.

## NBA v2 video-lead verification — 2026-08-07

The wider NBA v2 primary-video date window resolves the date eligibility of Wesley Matthews' next-day Watch upload, but it does not change the separate event-source rule. The opened Portland Trail Blazers release explicitly confirms a ruptured left Achilles and the Watch page shows the event, so those verified fields are now retained in the ledger. The row remains `needs-source` because the event source is dated 2015-03-06 for the 2015-03-05 event and its exact title contains no event date.

The other supplied leads did not qualify: DeMarcus Cousins is a SportsCenter impact discussion rather than the primary event, and the James Wiseman ESPN video is unavailable in the Browser's region. NBA.com's Videos search was run for James Wiseman, Isaiah Jackson, Dru Smith, Rodney Hood, David Nwaba, Chris Clemons, DeMarcus Cousins, J.J. Barea, Rudy Gay, Kobe Bryant, and Wesley Matthews. Most returned no matching event or only unrelated, analysis, interview, rehabilitation, or status footage. The same-day J.J. Barea Watch page was opened, but its stored title is only “Barea Injured” and therefore does not satisfy the full-athlete identity rule.

The proposed Donte DiVincenzo row was not added. The verified ESPN Australia clip identifies Game 4, while the opened Timberwolves diagnosis says the injury occurred in Game 3; that is an unresolved event-identity conflict, not a date-window issue.

The validated count therefore remains **7 source-ready and 11 needs-source**. No reviewer fields were populated, no media or transcript was stored, and no policy threshold was lowered.
