# Decision 18 research notes — LaMelo Ball ankle sprain 2025

- Audit cutoff/access date: `2026-08-15`.
- Case boundary: Charlotte Hornets, 2024-25 season, left ankle sprain sustained on `2025-01-27`.
- All 24 exact scaffold queries were issued. Retained facts were checked on original team-controlled pages/posts; snippets and reposts were not evidence.
- The governed record contains 13 rounds and 27 queries. Every scaffold slot appears exactly once, and each category ends with two consecutive zero-qualified-fact rounds after its final delta.
- Every generated item remains `pending-owner-signoff`.

## Qualified deltas and retained baseline

1. `lamelo-ball-ankle-sprain-2025-treatment-d18-01`
   - Charlotte Hornets PR stated on `2025-02-04` that Ball continued to undergo treatment for the left ankle sprain.
   - Original: `https://twitter.com/HornetsPR/status/1886897854590886208`; `Charlotte Hornets PR (@HornetsPR) on X`; Charlotte Hornets / Charlotte Hornets PR; opened `2026-08-15` and text independently resolved through the platform oEmbed response.
   - Tier: `team-or-league-official`. The item does not infer the treatment modality.

2. `lamelo-ball-ankle-sprain-2025-treatment-d18-02`
   - The same official post stated that Ball had progressed to on-court activity.
   - This is a distinct atomic performed-progression fact. It does not imply full clearance, contact work, a prognosis, or a return date.

3. Existing `lamelo-ball-ankle-sprain-2025-actual-return-01` was freshly reopened and retained byte-for-byte as a Decision 17 identity.
   - Source: `Hornets End Homestand In Dramatic Fashion`; Charlotte Hornets / Matt Rochinski; `2025-02-07`.
   - URL: `https://www.nba.com/hornets/news/hornets-end-homestand-in-dramatic-fashion`
   - This team-controlled occurred-participation report remains the sole actual-return item.

## Round and stopping proof

| Category      | Rounds | Governed result sequence                                             | Final count |
| ------------- | -----: | -------------------------------------------------------------------- | ----------: |
| treatment     |      4 | six-slot initial zero → two added official facts → zero → zero       |     `0 → 2` |
| surgery       |      3 | wrong-episode candidate rejected with reason; no delta → zero → zero |     `0 → 0` |
| injection     |      3 | zero → zero → zero                                                   |     `0 → 0` |
| actual-return |      3 | retained existing official fact; zero deltas → zero → zero           |     `1 → 1` |

The treatment post-delta searches separately checked Hornets newsroom recovery/program language and NBA announcement/injury-report management, progression, and clearance language. Exact queries, channels, timepoints, concepts, outcomes, checked boundaries, and `qualifiedFactChanges[]` are in the adjacent canonical record.

## Episode isolation and empty boundaries

- The Hornets' `2025-03-28` surgery announcement concerns a **right** ankle impingement and a right wrist procedure. This case is the January **left** ankle sprain. The opened official candidate is explicitly rejected as a different side, diagnosis, and episode.
- No surgery, procedure, repair, reconstruction, or named operating/treating medical person was found for this left-ankle-sprain episode.
- No injection, shot, PRP, platelet-rich plasma, cortisone, corticosteroid, or needling fact survived the original-page boundary.
- Re-evaluation schedules and return expectations were not converted into performed treatment, prognosis, or return facts.
- Empty means no qualifying fact was found inside the recorded boundary, not that the event could not have happened.

Final retained distribution: official `3`, mainstream `0`, unverified `0`; actual-return `1`.
