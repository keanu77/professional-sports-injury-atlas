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
- Source-ready: 0
- Needs-source: 18
- Source-verified: 0
- Excluded ledger rows: 0 (the two non-game leads were not appended)
- Reviewed fields: intentionally blank
