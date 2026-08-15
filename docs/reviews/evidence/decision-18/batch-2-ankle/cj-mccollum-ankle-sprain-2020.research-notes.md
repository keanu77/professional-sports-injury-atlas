# Decision 18 Group A research notes — CJ McCollum ankle sprain 2020

- Audit cutoff/access date: `2026-08-15`; session: `2026-08-15T14:25:05Z`–`2026-08-15T14:28:48Z` UTC.
- All 24 exact scaffold queries were issued once: slots 1–3 in R1 and slots 4–6 in R2 for each controlled kind. D17 was revalidated as empty in all four kinds.
- No source named a treating clinician, surgeon, or operating physician; the generic no-name branch applies.
- Proposed count change: surgery `0 → 0`, treatment `0 → 0`, injection `0 → 0`, actual-return `0 → 1`. Final tier distribution: official `1`, mainstream `0`, unverified `0`.

## Retained delta

- `cj-mccollum-ankle-sprain-2020-actual-return-d18-01` — actual-return R2 (`plan-actual-return-4`), fact date `2020-01-26`.
- NBA's official scorer report records that McCollum played `35:42` and scored `28` points for Portland. This is only an occurred participation fact, not a forecast or a reusable return interval.
- Source title: `NATIONAL BASKETBALL ASSOCIATION OFFICIAL SCORER'S REPORT — FINAL BOX — Indiana Pacers at Portland Trail Blazers`.
- Publisher/account: `NBA Organization` / `null`; published/accessed: `2020-01-26` / `2026-08-15`; medium/tier: `game-or-participation-record` / `team-or-league-official`.
- NBA URL, intentionally non-clickable: `https://statsdmz.nba.com/pdfs/20200126/20200126_INDPOR_book.pdf`
- The exact original PDF was directly retrieved and its FINAL BOX, date, venue, and McCollum row were verified. Search-result text and the sparse NBA game shell were not treated as the item evidence.

## Governed rounds and stopping proof

| Kind          | Rounds (UTC)                                                                                   | Result / `qualifiedFactDeltas[]`                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| surgery       | R1 `14:25:05–14:25:26`; R2 `14:25:26–14:25:50`                                                 | `[]`, `[]`; no event-matched operation/procedure or named operator.                                                                                                 |
| treatment     | R1 `14:25:05–14:25:26`; R2 `14:25:26–14:25:50`                                                 | `[]`, `[]`; an ESPN lead only said generic “treatment” and the original was robot-blocked, so it could not support a source-explicit intervention and was rejected. |
| injection     | R1 `14:25:05–14:25:26`; R2 `14:25:26–14:25:50`                                                 | `[]`, `[]`; no qualifying injection-family fact.                                                                                                                    |
| actual-return | R1 `14:25:05–14:25:26`; R2 `14:25:26–14:25:50`; R3 `14:28:13–14:28:38`; R4 `14:28:41–14:28:48` | `[]`, one added item, `[]`, `[]`; R3 and R4 are the two distinct consecutive post-delta zero rounds.                                                                |

The two post-delta queries were context-complete and used unique angle tuples:

- R3: `CJ McCollum Portland Trail Blazers ankle injury ankle sprain 2019-20 actual return activated official team newsroom January 2020` — `team-official-site-newsroom` / `actual-return` / `[activated]`; no new occurred participation proposition.
- R4: `CJ McCollum Portland Trail Blazers ankle injury ankle sprain 2019-20 rehabilitation progression first game back NBA official news announcement January 2020` — `nba-official-news-announcements` / `rehabilitation-progression` / `[first-game-back]`; no new fact.

Different-season foot injuries and knee rehabilitation pages were rejected as different event identities. Empty means only that no qualifying individually citable fact survived this boundary. Search snippets were discovery only, and every proposed new item remains `pending-owner-signoff`.
