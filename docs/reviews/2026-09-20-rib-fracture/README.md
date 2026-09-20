# Rib fracture three-case review — 2026-09-20

## Scope and evidence

Adds Fernando Alonso (2016), Drew Brees (2020), and Tua Tagovailoa (2021) as observation pages, with three selected videos. Source URLs and claim-level indices are in `src/data/videos/event-rib-fracture-three.v1.json`.

The main agent independently opened the primary F1, Saints, Dolphins and NFL sources and general NHS/MedlinePlus guidance. A user-approved GPT-5.6 Sol agent performed read-only source verification and reviewed the final data. Model agreement is not a clinical source.

- Alonso: distinguish the March 20 accident, March 31 diagnosis disclosure, April 15 clearance and April 17 actual race return.
- Brees: distinguish November 8 and November 15 injuries, December 19 activation and December 20 actual return. Do not attribute every fracture to one tackle or display a single recovery-day count.
- Tua: distinguish the early video/negative initial X-ray from subsequent coach-confirmed fractures, and October 16 activation from October 17 return. Keep the 2021 rib event separate from the 2024 concussion.
- General rib guidance is not an individual treatment plan or return-to-play clearance. Serious trauma and worsening respiratory symptoms require urgent assessment.

## Playback and assets

The approved browser interface observed all three YouTube watch pages playing on September 20. These are watch-page checks, **not owned-HTTPS embedded-player release proof**:

| Video ID    | Observed playing time                                                         | Observed duration (seconds) |
| ----------- | ----------------------------------------------------------------------------- | --------------------------- |
| x45fLUTHCuk | approximately 00:02 before reaching the end                                   | 68.261                      |
| _jrPqJow81Q | 14.488, then 38.902122 (paused false, readyState 4 at the latter observation) | 453.581                     |
| JckTrmIPRK8 | 10.13 before reaching the end                                                 | 250.621                     |

Only the three default thumbnail JPEGs were downloaded; exact URLs and SHA-256 hashes are recorded in the thumbnail provenance manifest. No complete video was downloaded.

The release checker accepts a new `playback.preview.json` only when present and valid under the existing ownership, HTTPS, recency and actual playback rules. No such proof is fabricated from these watch-page checks.

## Verification log

- TDD: the initial five integration tests failed on absent cases/inventory before implementation, then passed after integration. A sixth negative schema test was added.
- Astro check: 0 errors, 0 warnings, 16 existing-code hints.
- Initial full unit run: 1498/1502 passed. One computed inventory assertion needed the new batch; three corpus tests rejected uncommitted paths. The inventory assertion was corrected. Content check and review build also require a clean corpus checkout.
- The user's pre-existing `.claude/HANDOFF.md` is untouched and excluded from implementation commits. Its SHA-256 at validation preparation: `d3653a425c13a348e413dbc6f1bcfd53970b144ace4b0b077568386ed99d8e75`.
- Clean validation and browser regression results will be recorded after completion. No production deployment is claimed.
