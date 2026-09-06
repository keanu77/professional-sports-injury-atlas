# Football research pack — 2026-09-06

Accepted candidate facts: `football-facts.json` (8 entries). Research only; this is not clinical approval or an embed pass. Root owns playback/footage acceptance.

| Athlete | Exact YouTube watch URL | Uploader | Note |
|---|---|---|---|
| Alex Oxlade-Chamberlain | https://www.youtube.com/watch?v=rPYOGKhlzag | WRC10 | Root confirmed playback. |
| David Beckham | https://www.youtube.com/watch?v=cgOemKqIzEE | Mark Sickmiller | Root confirmed playback. |
| Cristiano Ronaldo | https://www.youtube.com/watch?v=wgPxm0RKJAk | Adventures | Root confirmed playback; tissue diagnosis unconfirmed. |
| Vivianne Miedema | https://www.youtube.com/watch?v=YXpvkHw2BP8 | FootFem | Root confirmed playback. |
| Laurent Koscielny | https://www.youtube.com/watch?v=4--y5nQdVE0 | Arsenal | Official documentary; root confirmed playback; inspect opening injury sequence. |
| André Gomes | https://www.youtube.com/watch?v=O4tcS9YZDvw | Brian Sutterer MD | Root confirmed playback; diagnosis independently sourced to Everton, not treating-doctor claim. |
| Beth Mead | https://www.youtube.com/watch?v=Kxz1vhDq94Y | FootFem | Root probing; alternate KwQ4tF8V4FE, Only One United Channel. |
| Leah Williamson | https://www.youtube.com/watch?v=TygjH39bmfU | FootFem | Root probing; alternate D5wraTiH9no, ESPN UK. |

## Boundaries for integration

- `returnDate` is earliest sourced formal competition: Oxlade U23 2019-03-08 before first-team Premier League 2019-04-26; Koscielny U23 2018-11-26 before first-team Europa League 2018-12-13. Do not relabel these as first-team returns.
- Beckham played a closed scrimmage before MLS return 2010-09-11. The JSON uses formal MLS competition date.
- Ronaldo: UEFA confirms injury exit and first appearance on 2016-09-10. No verified primary source confirms precise tissue diagnosis; keep it unknown. Do not infer MCL from video.
- Miedema: actual return is 2023-10-22. Arsenal January 2024 interview contains a conflicting December-return reference; do not use that sentence for the date. Australian federation and NOS corroborate October match.
- Mead: official Arsenal match report confirms 87th-minute actual entry on 2023-10-15; August training is not return to competition.
- Williamson: FA explicitly says Arsenal return January 24. Do not use January 21 found in some derivative texts or confuse international recall with match appearance.
- Injury-event-day evidence for Miedema/Williamson/Gomes includes named news reports. Diagnoses derive from club/federation sources except Ronaldo, whose precise diagnosis remains unknown. Goal's Miedema event report wrongly says early second half; do not reuse its mechanism/minute claim.
- No observation text was authored; no inference of diagnosis from footage. Publication timestamps absent from retrieved source are null.

## Backups, only if needed

- Héctor Bellerín: Pzul0WT-LJs (duonhuyen.official). Arsenal confirms left ACL rupture: https://www.arsenal.com/news/bellerin-is-mature-and-can-come-back-stronger-a2i6B9m9arqB . Event 2019-01-19 Chelsea. U23 return 2019-09-20, https://www.wolves.co.uk/news/under-21/20190920-perry-earns-dramatic-late-draw/ and Arsenal official https://www.youtube.com/watch?v=2_tq2hieKVI ; first team 2019-09-24 League Cup vs Forest: https://www.arsenal.com/fixtures/match-report/fixtures/match/24092019-nottingham-forest-carabao-cup-men-h-10286 .
- Harvey Elliott: ZrJ_d7oyhN8 (Brian Sutterer MD), alternate 9lkliXhVZ8E (lfchouse). Event 2021-09-12 Leeds. Club confirms left ankle fracture-dislocation: https://www.liverpoolfc.com/news/first-team/443363-harvey-elliott-undergoes-successful-ankle-surgery (2021-09-14). First-team formal return 2022-02-06 FA Cup Cardiff: https://www.liverpoolfc.com/news/diaz-debuts-and-elliott-scores-reds-beat-cardiff-fa-cup?amp=1 . Earlier training/scrimmage dates not fully researched.
- Wesley Fofana: UxS0YVftoWs (ARK HD SPORTS & GAMING). Event 2021-08-04 preseason friendly Villarreal. Club fibula fracture announcement https://www.lcfc.com/media-article/Rodgers-Confirms-Fofana-Fibula-Fracture (2021-08-05). Return 2022-03-17 Conference League Rennes: https://www.lcfc.com/media-article/Special-Fofana-Goal-Sends-City-Into-UECL-Quarter-Finals .
- Van Dijk: 2fIhePfNjO0 (NBC Sports) FAILED embed; exclude. No further alternatives researched per root direction.
