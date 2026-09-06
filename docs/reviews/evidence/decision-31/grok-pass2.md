# Grok CLI independent review (Decision 31 other sports)

Actual execution: `grok -p` via subprocess argv in isolated `/tmp/atlas31/other-sports`, public research prompt only; no repository content submitted. Exit 0, elapsed 593.48 seconds. Full prompt, raw stdout, stderr and status preserved. `grok-findings.json` extracts the complete 12-row JSON returned by the CLI. This is a candidate-discovery report, not a playback or publication approval.

## Findings accepted only after direct source checks

The independent source review in `source-verification.md` and browser extracts governs our supplied content. Mattek-Sands (2018-03-21), Rodgers (2024-09-09), Fofana (2022-03-17 confirmed competitive appearance), and Bellerin (2019-09-20 U23) match our verified dates. Andrade's injury date is 2019-06-07; Grok's exact 2020-03-12 qualification date requires separate evidence because our original sources established March 2020 competition but did not conclusively pin its first session. Do not copy model forecast numbers or competition scores into the site.

## Corrections and rejected claims

- Samir Ait Said: Grok labels 2017-09-16 Paris international qualification the earliest return. The directly opened 2017-08-19 Le Parisien interview establishes first official routines at the prior day's INSEP domestic selection. Our data uses 2017-08-18 and labels the later international return separately. Main may exclude this event due lack of dynamic injury footage in tested videos.
- Harvey Elliott: Grok labels 2022-02-06 FA Cup the earliest return. Liverpool's own 2022-01-30 article confirms the prior Saturday's Wrexham friendly. Our data correctly uses 2022-01-29, explicitly a closed-door friendly.
- Playback: Grok uses oEmbed plus descriptions/comments. This cannot verify that an iframe plays, or that a moving injury sequence exists. Main's native iframe tests override it. The original Rodgers ID, Burrow and Dak IDs failed Main's embedding tests; Rodgers uses the verified alternative, Burrow and Dak are excluded.
- Zverev: already present in the original 52-event collection; reject as an addition despite Grok proposing it.
- Fofana: model prose suggested a possible earlier training game without a verifiable exact source/date. Independent searches did not establish it. No invented early return is added; March 17 is a documented competitive return.
- Bellerin: omit Grok's unsupported 255-day figure (inconsistent with the verified January 19 to September 20 dates). Exact dates and U23 context suffice.
- Murray and Nick Chubb: preserve as future discovery leads only. Their proposed footage, diagnosis, and first return have not completed this round's own full playback/source workflow. Do not count them as accepted additions.

## Delivered files

`selected-clips.json` and `selected-events.json` contain the original nine-candidate selection, including Samir. `thiem-clip.json` and `thiem-event.json` are a fully sourced replacement when Main excludes Samir for footage. `final-candidate-clips.json` and `final-candidate-events.json` replace Samir with Thiem for convenience. Main owns the final selection, iframe playback, scene observation, video duration, body-part taxonomy and integration. All metadata in these scratch files remains subject to those final checks.
