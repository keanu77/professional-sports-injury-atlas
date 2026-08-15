# Decision 18 research notes — LaMelo Ball ankle sprain 2023

- Audit cutoff/access date: `2026-08-15`.
- Case boundary: Charlotte Hornets, 2023-24 season, right ankle sprain sustained on `2023-11-26`.
- All 24 exact scaffold queries were issued across the six governed source channels and four timepoints. Search results and snippets were discovery only; retained facts were verified on opened original pages.
- The governed record contains 14 rounds and 30 queries. Every scaffold slot appears exactly once. Each category ends with two consecutive zero-qualified-fact rounds after its final delta.
- This is a research handoff. Every generated item remains `pending-owner-signoff`.

## Qualified deltas

1. `lamelo-ball-ankle-sprain-2023-treatment-d18-01`
   - The Charlotte Observer reporter Roderick Boone directly quoted Ball saying he was doing treatment every day, including ankle movement and icing.
   - Source: `Hornets’ LaMelo Ball speaks for first time since injury, details if he will use ankle braces`; The Charlotte Observer / Roderick Boone; published `2023-12-10`; opened `2026-08-15`.
   - URL: `https://www.charlotteobserver.com/sports/charlotte-hornets/article282569418.html`
   - Tier: `mainstream-media-report`. The statement does not infer an undisclosed protocol, prognosis, or duration.

2. `lamelo-ball-ankle-sprain-2023-treatment-d18-02`
   - The same opened original reports that Ball had shed his walking boot and arm crutch and had started individual activities.
   - Source and tier are identical to item 1. This is kept as a separate atomic performed-activity fact; no clearance or activity intensity is inferred.

3. `lamelo-ball-ankle-sprain-2023-actual-return-d18-01`
   - The NBA official game record shows Ball participated for Charlotte at San Antonio on `2024-01-12`.
   - Source: `Charlotte Hornets vs San Antonio Spurs Jan 12, 2024 Game Summary | NBA.com`; NBA Organization; published/fact date `2024-01-12`; opened `2026-08-15`.
   - URL: `https://www.nba.com/game/cha-vs-sas-0022300541`
   - Tier: `team-or-league-official`. The occurred, non-future official participation record alone supports actual-return; the AP return story is not used as the supporting item source.

## Round and stopping proof

| Category      | Rounds | Governed result sequence                                                | Final count |
| ------------- | -----: | ----------------------------------------------------------------------- | ----------: |
| treatment     |      4 | six-slot initial zero → two added facts → zero → zero                   |     `0 → 2` |
| surgery       |      3 | two slots zero → two slots zero → two slots zero                        |     `0 → 0` |
| injection     |      3 | two slots zero → two slots zero → two slots zero                        |     `0 → 0` |
| actual-return |      4 | six-slot initial zero → one official occurred-return fact → zero → zero |     `0 → 1` |

The treatment supplemental formulations separately checked the Boone report, the Hornets newsroom recovery/program angle, and NBA announcement/injury-report management and clearance angles. The actual-return supplemental formulations separately checked the official NBA game record, Hornets first-game-back language, and NBA activated/cleared-to-play language. The exact query strings, channel, timepoint, concept subset, result, checked boundary, and `qualifiedFactChanges[]` are serialized in the adjacent research record.

## Episode isolation and empty boundaries

- The March 2023 right-ankle fracture surgery belongs to an earlier fracture episode and was not attached to this November 2023 sprain.
- Later right-ankle problems and the March 2025 impingement procedure are different episodes and were not attached to this case.
- No qualifying injection fact was found after checking injection, shot, PRP, platelet-rich plasma, cortisone, corticosteroid, and needling formulations.
- No qualifying surgery fact or named surgeon/treating physician was found for this sprain after checking surgery, procedure, operated, underwent, repair, reconstruction, and generic surgeon-name formulations.
- Empty means only that no qualifying fact survived the recorded boundary; it does not claim that an intervention never occurred.

Final retained distribution: official `1`, mainstream `2`, unverified `0`; actual-return `1`.
