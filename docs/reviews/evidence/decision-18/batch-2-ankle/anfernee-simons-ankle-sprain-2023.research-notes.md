# Decision 18 Group A research notes — Anfernee Simons ankle sprain 2023

- Audit cutoff/access date: `2026-08-15`; session: `2026-08-15T14:19:42Z`–`2026-08-15T14:22:48Z` UTC.
- All 24 exact `initialQueryPlan` strings in the case scaffold were issued once: slots 1–3 in R1 and slots 4–6 in R2 for each of surgery, treatment, injection, and actual-return. Search snippets were discovery only.
- D17 baseline was revalidated as empty in all four kinds; no D17 payload or date was changed. No treating clinician, surgeon, or operating physician was named, so the generic no-name branch is the only truthful branch.
- Proposed count change: surgery `0 → 0`, treatment `0 → 0`, injection `0 → 0`, actual-return `0 → 1`. Final tier distribution: official `1`, mainstream `0`, unverified `0`.

## Retained delta

- `anfernee-simons-ankle-sprain-2023-actual-return-d18-01` — actual-return R2, fact date `2023-03-10`.
- NBA's official scorer report records that Simons played `29:18` and scored `34` points for Portland. This is only an occurred participation fact; it does not state or imply a rehabilitation duration, prognosis, or reusable return date.
- Source title: `NATIONAL BASKETBALL ASSOCIATION OFFICIAL SCORER'S REPORT — FINAL BOX — Portland Trail Blazers at Philadelphia 76ers`.
- Publisher/account: `NBA Organization` / `null`; published/accessed: `2023-03-10` / `2026-08-15`; medium/tier: `game-or-participation-record` / `team-or-league-official`.
- NBA URL, intentionally non-clickable: `https://statsdmz.nba.com/pdfs/20230310/20230310_PORPHI_book.pdf`
- The original PDF was directly retrieved and text-extracted after the matching NBA game page was opened; the retained row, date, venue, and FINAL BOX header were all verified. A search snippet was not used as evidence.

## Governed rounds and stopping proof

| Kind          | Rounds (UTC)                                                                                   | Result / `qualifiedFactDeltas[]`                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| surgery       | R1 `14:19:42–14:20:04`; R2 `14:20:09–14:20:32`                                                 | `[]`, `[]`; no source-explicit operation, procedure, reconstruction/repair, or named operator.         |
| treatment     | R1 `14:19:42–14:20:04`; R2 `14:20:09–14:20:32`                                                 | `[]`, `[]`; diagnosis, MRI, absence, and re-evaluation language were not treatment interventions.      |
| injection     | R1 `14:19:42–14:20:04`; R2 `14:20:09–14:20:32`                                                 | `[]`, `[]`; no injection, shot, PRP, platelet-rich plasma, cortisone/corticosteroid, or needling fact. |
| actual-return | R1 `14:19:42–14:20:04`; R2 `14:20:09–14:22:35`; R3 `14:22:37–14:22:41`; R4 `14:22:44–14:22:48` | `[]`, one added item, `[]`, `[]`; R3 and R4 are the two distinct consecutive post-delta zero rounds.   |

Formal supplemental queries were context-complete and used unique angle tuples:

- R2: `Anfernee Simons Portland Trail Blazers ankle injury ankle sprain 2022-23 actual return returned March 10 2023 Philadelphia 76ers NBA official game participation` — `nba-official-game-participation` / `actual-return` / `[return, returned]`; retained the official occurred-participation record in the same round as scaffold slots 4–6.
- R3: `Anfernee Simons Portland Trail Blazers ankle injury ankle sprain 2022-23 actual return activated official team newsroom March 2023` — `team-official-site-newsroom` / `actual-return` / `[activated]`; no new atomic fact.
- R4: `Anfernee Simons Portland Trail Blazers ankle injury ankle sprain 2022-23 rehabilitation progression first game back NBA official news announcement March 2023` — `nba-official-news-announcements` / `rehabilitation-progression` / `[first-game-back]`; no new atomic fact.

The remaining kinds stop at two consecutive zero-delta scaffold rounds. Empty means only that no qualifying individually citable record survived the stated channels, timepoints, and original-page boundary. Every proposed new item remains `pending-owner-signoff`.
