# Decision 18 Group A research notes — Anthony Edwards ankle sprain 2025

- Audit cutoff/access date: `2026-08-15`; session: `2026-08-15T14:23:52Z`–`2026-08-15T14:24:46Z` UTC.
- All 24 exact scaffold queries were issued once, slots 1–3 in R1 and slots 4–6 in R2 for surgery, treatment, injection, and actual-return. Each unit therefore ends with two distinct consecutive zero-delta rounds.
- The D17 actual-return baseline was freshly reopened and retained byte-for-byte: `follow-up-anthony-edwards-ankle-sprain-2025-actual-return-01`, fact/publication date `2025-04-03`, historical access date `2026-08-14`, title `Nightly Pulse: NBA News & Highlights from April 3`, publisher `NBA.com Staff`.
- NBA URL, intentionally non-clickable: `https://www.nba.com/news/nightly-pulse-nba-news-highlights-from-april-3`
- The opened original still states that Edwards started the second half and finished the game after the ankle sprain. A second opened NBA/AP story repeated that same participation proposition and was not split into a duplicate item.
- No new qualified fact was retained. Proposed count change: surgery `0 → 0`, treatment `0 → 0`, injection `0 → 0`, actual-return `1 → 1`. Final tier distribution: official `1`, mainstream `0`, unverified `0`.

## Governed rounds and stopping proof

| Kind          | R1 (UTC)            | R2 (UTC)            | Result / checked boundary                                                                        |
| ------------- | ------------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| surgery       | `14:23:52–14:24:26` | `14:24:26–14:24:46` | `[]`, `[]`; no event-matched operation/procedure or named operator.                              |
| treatment     | `14:23:52–14:24:26` | `14:24:26–14:24:46` | `[]`, `[]`; locker-room/help/return language and generic recovery status were not interventions. |
| injection     | `14:23:52–14:24:26` | `14:24:26–14:24:46` | `[]`, `[]`; no event-matched injection-family fact.                                              |
| actual-return | `14:23:52–14:24:26` | `14:24:26–14:24:46` | `[]`, `[]`; D17 baseline revalidated, while the NBA/AP duplicate added no atomic novelty.        |

Searches that surfaced Edwards's other ankle events, including later playoff or different-season injuries, were rejected as different case identities. Search snippets were never evidence, no source named a treating clinician or surgeon, and no inference filled an empty kind. There are no Decision 18 deltas for this case; the existing D17 item retains its existing `pending-owner-signoff` state and bytes.
