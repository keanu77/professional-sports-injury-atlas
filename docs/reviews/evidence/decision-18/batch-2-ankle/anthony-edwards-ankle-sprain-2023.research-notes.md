# Decision 18 Group A research notes — Anthony Edwards ankle sprain 2023

- Audit cutoff/access date: `2026-08-15`; session: `2026-08-15T14:20:50Z`–`2026-08-15T14:22:28Z` UTC.
- All 24 exact `initialQueryPlan` strings in the case scaffold were issued once: slots 1–3 in R1 and slots 4–6 in R2 for each controlled kind. Search snippets were discovery only.
- The sole D17 treatment baseline was freshly reopened and retained byte-for-byte: `follow-up-anthony-edwards-ankle-sprain-2023-treatment-01`, NBC Sports / Kurt Helin, fact and publication date `2023-03-18`, historical access date `2026-08-14`. The page still reports the protective boot. A later report that he had exited the boot is status/change language, not a second intervention.
- No named treating clinician, surgeon, or operating physician was found; the generic no-name branch applies.
- Proposed count change: surgery `0 → 0`, treatment `1 → 1`, injection `0 → 0`, actual-return `0 → 1`. Final tier distribution: official `1`, mainstream `1`, unverified `0`.

## Retained delta

- `anthony-edwards-ankle-sprain-2023-actual-return-d18-01` — actual-return R2, fact date `2023-03-26`.
- NBA's official scorer report records that Edwards played `34:39` and scored `13` points for Minnesota. This is only an occurred participation fact and does not supply a prognosis or fixed return interval.
- Source title: `NATIONAL BASKETBALL ASSOCIATION OFFICIAL SCORER'S REPORT — FINAL BOX — Minnesota Timberwolves at Golden State Warriors`.
- Publisher/account: `NBA Organization` / `null`; published/accessed: `2023-03-26` / `2026-08-15`; medium/tier: `game-or-participation-record` / `team-or-league-official`.
- NBA URL, intentionally non-clickable: `https://statsdmz.nba.com/pdfs/20230326/20230326_MINGSW_book.pdf`
- The exact original PDF was directly retrieved and its FINAL BOX, date, venue, and Edwards row were verified. The NBA game result was discovery/corroboration only; no snippet was evidence.

## Governed rounds and stopping proof

| Kind          | Rounds (UTC)                                                                                   | Result / `qualifiedFactDeltas[]`                                                             |
| ------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| surgery       | R1 `14:20:50–14:21:19`; R2 `14:21:24–14:22:06`                                                 | `[]`, `[]`; no source-explicit operation or named operator.                                  |
| treatment     | R1 `14:20:50–14:21:19`; R2 `14:21:24–14:22:06`                                                 | `[]`, `[]`; D17 boot item revalidated, with no new intervention/action.                      |
| injection     | R1 `14:20:50–14:21:19`; R2 `14:21:24–14:22:06`                                                 | `[]`, `[]`; no qualifying injection-family fact.                                             |
| actual-return | R1 `14:20:50–14:21:19`; R2 `14:21:24–14:22:14`; R3 `14:22:18–14:22:21`; R4 `14:22:24–14:22:28` | `[]`, one added item, `[]`, `[]`; R3 and R4 are distinct consecutive post-delta zero rounds. |

Formal supplemental queries were context-complete and used unique angle tuples:

- R2: `Anthony Edwards Minnesota Timberwolves ankle injury ankle sprain 2022-23 actual return returned March 26 2023 Golden State Warriors NBA official game participation` — `nba-official-game-participation` / `actual-return` / `[return, returned]`; retained the official occurred-participation record in the same round as scaffold slots 4–6.
- R3: `Anthony Edwards Minnesota Timberwolves ankle injury ankle sprain 2022-23 actual return activated official team newsroom March 2023` — `team-official-site-newsroom` / `actual-return` / `[activated]`; no new atomic fact.
- R4: `Anthony Edwards Minnesota Timberwolves ankle injury ankle sprain 2022-23 rehabilitation progression first game back NBA official news announcement March 2023` — `nba-official-news-announcements` / `rehabilitation-progression` / `[first-game-back]`; no new atomic fact.

The other three kinds terminate after two zero-delta rounds. Empty means no qualifying item was found within the audited boundary, not that no treatment, surgery, or injection occurred. Every proposed new item remains `pending-owner-signoff`.
