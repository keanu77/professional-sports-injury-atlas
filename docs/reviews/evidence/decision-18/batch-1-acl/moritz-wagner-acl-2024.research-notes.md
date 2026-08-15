# Decision 18 research notes — Moritz Wagner ACL 2024

## Retained delta summary

None. After applying nba-v10's intervention-only rule, every Decision 18 candidate was rejected or corroborative; all four audit units have `qualifiedFactDeltas=[]`.

- Audit cutoff/access date: `2026-08-15`.
- Research session (UTC, to seconds): `2026-08-15T13:17:28Z`–`2026-08-15T13:34:29Z`. The long final surgery-round interval includes the later official-social/date-gap check; it is not an extra trailing round.
- Actual execution order within each category is the numbered round order below. Initial rounds used scaffold slots 1–2, then 3–4, then 5–6. Search was performed through web search; every retained fact used an opened original page (browser-rendered page or direct HTTPS response/embedded article JSON). Search snippets were leads only: `searchSnippetUsedAsEvidence=false` throughout.
- These notes are an evidence handoff, not the canonical v2 ledger.

## Exact initial scaffold queries actually issued

### surgery

1. `Moritz Wagner Orlando Magic ACL 2024-25 injury operated procedure reconstruction repair surgeon doctor operating physician surgery underwent official team newsroom`
2. `Moritz Wagner Orlando Magic ACL 2024-25 surgery operated procedure reconstruction repair surgeon doctor operating physician surgery underwent site:nba.com/news official announcement`
3. `Moritz Wagner Orlando Magic ACL 2024-25 rehab operated procedure reconstruction repair surgeon doctor operating physician surgery underwent site:official.nba.com injury report`
4. `return 2024-25 ACL Orlando Magic Moritz Wagner operated procedure reconstruction repair surgeon doctor operating physician surgery underwent site:nba.com/game box score`
5. `injury 2024-25 ACL Orlando Magic Moritz Wagner operated procedure reconstruction repair surgeon doctor operating physician surgery underwent press conference official statement`
6. `surgery 2024-25 ACL Orlando Magic Moritz Wagner operated procedure reconstruction repair surgeon doctor operating physician surgery underwent Associated Press ESPN Reuters original report`

### treatment

1. `Moritz Wagner Orlando Magic ACL 2024-25 injury cleared management program progression recovery rehab treatment official team newsroom`
2. `Moritz Wagner Orlando Magic ACL 2024-25 surgery cleared management program progression recovery rehab treatment site:nba.com/news official announcement`
3. `Moritz Wagner Orlando Magic ACL 2024-25 rehab cleared management program progression recovery rehab treatment site:official.nba.com injury report`
4. `return 2024-25 ACL Orlando Magic Moritz Wagner cleared management program progression recovery rehab treatment site:nba.com/game box score`
5. `injury 2024-25 ACL Orlando Magic Moritz Wagner cleared management program progression recovery rehab treatment press conference official statement`
6. `surgery 2024-25 ACL Orlando Magic Moritz Wagner cleared management program progression recovery rehab treatment Associated Press ESPN Reuters original report`

### injection

1. `Moritz Wagner Orlando Magic ACL 2024-25 injury corticosteroid cortisone injection needling platelet-rich plasma PRP shot official team newsroom`
2. `Moritz Wagner Orlando Magic ACL 2024-25 surgery corticosteroid cortisone injection needling platelet-rich plasma PRP shot site:nba.com/news official announcement`
3. `Moritz Wagner Orlando Magic ACL 2024-25 rehab corticosteroid cortisone injection needling platelet-rich plasma PRP shot site:official.nba.com injury report`
4. `return 2024-25 ACL Orlando Magic Moritz Wagner corticosteroid cortisone injection needling platelet-rich plasma PRP shot site:nba.com/game box score`
5. `injury 2024-25 ACL Orlando Magic Moritz Wagner corticosteroid cortisone injection needling platelet-rich plasma PRP shot press conference official statement`
6. `surgery 2024-25 ACL Orlando Magic Moritz Wagner corticosteroid cortisone injection needling platelet-rich plasma PRP shot Associated Press ESPN Reuters original report`

### actual-return

1. `Moritz Wagner Orlando Magic ACL 2024-25 injury activated cleared to play debut first game back return returned official team newsroom`
2. `Moritz Wagner Orlando Magic ACL 2024-25 surgery activated cleared to play debut first game back return returned site:nba.com/news official announcement`
3. `Moritz Wagner Orlando Magic ACL 2024-25 rehab activated cleared to play debut first game back return returned site:official.nba.com injury report`
4. `return 2024-25 ACL Orlando Magic Moritz Wagner activated cleared to play debut first game back return returned site:nba.com/game box score`
5. `injury 2024-25 ACL Orlando Magic Moritz Wagner activated cleared to play debut first game back return returned press conference official statement`
6. `surgery 2024-25 ACL Orlando Magic Moritz Wagner activated cleared to play debut first game back return returned Associated Press ESPN Reuters original report`

## Actual round ledger and stopping proof

| Category      | Round (UTC interval)         | Exact queries / channels / timepoints                                                                                                                                 | Open-original result and boundary                                                                                                                                                                                                                                                                                                 | `qualifiedFactDeltas[]` |
| ------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| surgery       | R1 (`13:17:28Z`–`13:17:45Z`) | slots 1–2; team newsroom/injury-time, NBA news/operation-announcement                                                                                                 | Opened the Magic 2024-12-22 release. It only says Wagner **will undergo** surgery. Rejected: no actually performed intervention/date was reported.                                                                                                                                                                                | `[]`                    |
| surgery       | R2 (`13:17:46Z`–`13:18:02Z`) | slots 3–4; NBA injury reports/rehab, NBA game/actual-return                                                                                                           | Return-game and injury-report material did not state an operation date, type, or surgeon.                                                                                                                                                                                                                                         | `[]`                    |
| surgery       | R3 (`13:18:03Z`–`13:34:29Z`) | slots 5–6; formal statement/injury-time, named mainstream/operation-announcement; final official-social/date-gap verification was completed before closing this round | Reopened the D17 Magic on SI original page and retained it unchanged. Broad exact follow-up for an apparent Magic social phrase did not yield an identifiable, substantively openable original Magic post. No official source established `2025-01-08`; therefore the existing completion/date claim remains `unverified-report`. | `[]`                    |
| treatment     | R1 (`13:18:12Z`–`13:18:29Z`) | slots 1–2; team newsroom/injury-time, NBA news/operation-announcement                                                                                                 | Opened the Magic exit-interview page. Rejected: “going really well / feeling very good” is an outcome/status statement, not an actually reported treatment intervention.                                                                                                                                                          | `[]`                    |
| treatment     | R2 (`13:18:30Z`–`13:18:47Z`) | slots 3–4; NBA injury reports/rehab, NBA game/actual-return                                                                                                           | Reopened D17 Josh Cohen page and official game/injury-report records. “Months of rehab” baseline retained unchanged; other pages corroborated the same return/recovery context.                                                                                                                                                   | `[]`                    |
| treatment     | R3 (`13:18:48Z`–`13:19:03Z`) | slots 5–6; formal statement/injury-time, named mainstream/operation-announcement                                                                                      | No further distinct treatment, program, management, clearance, or progression fact on an opened eligible original page.                                                                                                                                                                                                           | `[]`                    |
| injection     | R1 (`13:19:04Z`–`13:19:18Z`) | slots 1–2; team newsroom/injury-time, NBA news/operation-announcement                                                                                                 | No candidate specific to Wagner's ACL event.                                                                                                                                                                                                                                                                                      | `[]`                    |
| injection     | R2 (`13:19:19Z`–`13:19:34Z`) | slots 3–4; NBA injury reports/rehab, NBA game/actual-return                                                                                                           | No candidate; generic ACL injection material and unrelated-player results were excluded.                                                                                                                                                                                                                                          | `[]`                    |
| injection     | R3 (`13:19:35Z`–`13:19:50Z`) | slots 5–6; formal statement/injury-time, named mainstream/operation-announcement                                                                                      | No candidate on an eligible original page. Empty does not prove no injection occurred.                                                                                                                                                                                                                                            | `[]`                    |
| actual-return | R1 (`13:19:51Z`–`13:20:06Z`) | slots 1–2; team newsroom/injury-time, NBA news/operation-announcement                                                                                                 | Reopened the D17 Josh Cohen team page; baseline return item retained unchanged.                                                                                                                                                                                                                                                   | `[]`                    |
| actual-return | R2 (`13:20:07Z`–`13:20:22Z`) | slots 3–4; NBA injury reports/rehab, NBA game/actual-return                                                                                                           | Opened NBA injury report and game/box-score originals; they corroborate participation on 2026-01-11 but create no duplicate item.                                                                                                                                                                                                 | `[]`                    |
| actual-return | R3 (`13:20:23Z`–`13:20:41Z`) | slots 5–6; formal statement/injury-time, named mainstream/operation-announcement                                                                                      | No distinct official occurred-return event. D17 item remains supported by the team page; event date is before cutoff.                                                                                                                                                                                                             | `[]`                    |

Every category covers all required channels, all four timepoints, and its full synonym family through the six exact scaffold queries. All rounds are zero-delta; R2/R3 are the differing terminal pair for every category. No material candidate remains unresolved.

## Opened source inventory and rejected Decision 18 candidates

1. Future surgery plan — rejected under nba-v10's intervention-only rule.
   - Candidate statement: Orlando Magic's official 2024-12-22 release stated that Moritz Wagner **would undergo surgery** after the torn left ACL. It does not say surgery happened, give its type/date, or name a surgeon.
   - URL: `https://www.nba.com/magic/news/orlando-magic-center-moe-wagner-suffers-torn-acl-injury-update-20241222`
   - Title: `Orlando Magic Center Moe Wagner Suffers Torn ACL`
   - Publisher/account: Orlando Magic / Official Release
   - Published: `2024-12-22`; accessed: `2026-08-15`
   - Candidate tier: `team-or-league-official`; disposition: `rejected-with-reason`; no item ID and no delta.

2. General recovery status — rejected under nba-v10's intervention-only rule.
   - Candidate statement: On 2025-05-01, the Magic reported Wagner saying his ACL recovery was going very well and that he felt very good. This describes perceived outcome/status, not a treatment intervention.
   - URL: `https://www.nba.com/magic/news/orlando-magic-exit-interviews-notable-quotable-jeff-weltman-jamahl-mosley-paolo-banchero-franz-wagner-20250501`
   - Title: `Orlando Magic Exit Interviews' Notable and Quotable`
   - Publisher/account: Orlando Magic / Dan Savage
   - Published: `2025-05-01`; accessed: `2026-08-15`
   - Candidate tier: `team-or-league-official`; disposition: `rejected-with-reason`; no item ID and no delta.

### D17 baselines reopened and retained unchanged

- `moritz-wagner-acl-2024-surgery-01` — opened `https://www.si.com/nba/magic/onsi/news/latest-health-injury-updates-on-orlando-magic-jalen-suggs-moritz-moe-wagner`, `Latest Updates on Magic's Jalen Suggs and Moe Wagner`, Magic on SI / Mason Williams, published `2025-01-09`, accessed `2026-08-15`. The page attributes successful left-ACL repair on `2025-01-08` to an unnamed league source. Keep exactly `unverified-report`; no official opened page supplied that date, so there is no tier promotion or source correction.
- `moritz-wagner-acl-2024-treatment-01` and `moritz-wagner-acl-2024-actual-return-01` — opened `https://www.nba.com/magic/news/orlando-magic-overpower-new-orleans-pelicans-down-the-stretch-to-win-in-moe-wagners-return-20250111`, `Orlando Magic Overpower New Orleans Pelicans Down the Stretch to Win in Moe Wagner’s Return`, Orlando Magic / Josh Cohen, published `2026-01-11`, accessed `2026-08-15`, `team-or-league-official`. Original JSON-LD, `/2026/01/` asset path, game ID `0022500548`, and game record all establish 2026-01-11. The stale-looking URL suffix `20250111` does **not** override the content metadata and is not a payload correction.
- Corroboration only: NBA game/box score `https://www.nba.com/game/nop-vs-orl-0022500548` and `Injury Report: 01/11/26 07:15 AM`, NBA, report date `2026-01-11`, `https://ak-static.cms.nba.com/referee/injury/Injury-Report_2026-01-11_07_15AM.pdf`. The report listed him probable for left-knee injury recovery; the game record confirms participation. No duplicate fact was created.

## Rejections, name branch, and empty boundary

- The Magic 2024-12-22 wording is future tense. It cannot confirm completed surgery or the SI-reported `2025-01-08` date. An apparent official-social lead was not returned as an identifiable original URL by the exact follow-up searches; no social snippet, repost, or memory of the phrase was used as evidence.
- nba-v10 permits treatment/surgery/injection items only for the intervention and date actually reported and forbids interpreting outcome, rehabilitation duration, prognosis, or return timing. That rule is why both otherwise well-sourced D18 candidates above are zero-delta rejections.
- No opened qualified source named an operating surgeon or treating physician for the surgery. Consequently there was no genuine surgeon-name value from which to derive a name query; generic `surgeon / doctor / operating physician` searches were completed.
- Reddit/social speculation and generic ACL treatment/injection pages were rejected as unrelated or ineligible. No injection fact survived. Boundary checked: Magic newsroom, NBA news, NBA injury reports, NBA game/box score, formal/press material, and named mainstream originals at injury, operation, rehab, and return timepoints.
- Final category counts: surgery `1 → 1`, treatment `1 → 1`, injection `0 → 0`, actual-return `1 → 1`; retained tier distribution remains official `2`, mainstream `0`, unverified `1`; actual-return count `1`.
