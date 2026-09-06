# D34 Baseball A research

2026-09-06; seven selected candidates, source and playback checks are separate.

- Actual external Codex CLI: gpt-5.5, `--search exec --sandbox read-only --skip-git-repo-check`, stdin `/dev/null`, public scratch cwd. Raw/stderr/status in this folder. Finished with exit 1 after 479 seconds: model context window exhausted before final output (codex-raw.md is empty). codex-stderr.log preserves actual web searches, source reads, and YouTube metadata checks. This is a partially executed research pass, NOT a completed external-model audit; independent agent verification completed separately.
- Independent pass here: opened original MLB articles via web tool; all 20 selected source URLs subsequently returned HTTP 200, SHA256 and checkedAt stored in source-http-proof.json. Native playback and visual inspection owned by root, evidence in `/tmp/atlas34/main/probes*.json`.
- Exact YouTube titles/publishers verified using public oEmbed. Runtime lengths taken from actual root iframe playback, rounded down. Betts FOX video rejected after visual review (stock photos/anchor only); replaced with ESPN MLB wglRV7rAQ2Q, actual pitch impact, 70 seconds, verified by root probes6.json.

| Selection         | Event      | First competition                        | Main verification issue                                                                                                                                                     |
| ----------------- | ---------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mitch Haniger     | 2017-07-29 | 2017-08-12, AAA Tacoma rehab             | Team release explicitly records rehab start; MLB return 8/19 is later. Concussion is source-confirmed, not inferred.                                                        |
| Justin Turner     | 2023-03-06 | 2023-03-20, spring exhibition vs Pirates | 3/12 light practice is not competition. Avoid equating clean scans alone with ruling out concussion; draft only reports lacerations/no fracture.                            |
| Kevin Pillar      | 2021-05-17 | 2021-05-31, MLB vs Arizona               | Original June1 report describes prior Monday. Explicitly no rehab assignment. Entered as defensive replacement before batting.                                              |
| Bryce Harper      | 2022-06-25 | 2022-08-23, AAA Lehigh Valley rehab      | Aug24 publication describes Tuesday first rehab; distinct from concurrent elbow UCL injury and MLB return.                                                                  |
| Mookie Betts      | 2024-06-16 | 2024-08-12, MLB vs Milwaukee             | Aug13 publication describes Monday. Explicitly no minor-league rehab. ESPN actual-action video replaces rejected FOX still-image report.                                    |
| Chase Headley     | 2014-09-11 | 2014-09-15, MLB vs Tampa Bay             | Official game log saved in headley-game-log.json has no appearances 9/12–14. Sep12 clearance is not a played game. SI attributes stitches/no fracture to manager statement. |
| Curtis Granderson | 2013-05-24 | 2013-07-25, high-A Tampa rehab           | Injury is fifth metacarpal of LEFT hand, not proximal forearm. Separate Feb2013 right-forearm injury. July26 article describes Thursday rehab debut.                        |

All selected events use `ball-impact` situation. Hand injuries require a separate 手部 group; do not map fingers/metacarpals to wrist.

## Alternate research

- Aroldis Chapman: 9H2RpDnWrNc (Blayne Moody, original spectator footage, 58 sec), injury 2014-03-19. Confirmed return 2014-05-01 Class A Dayton rehab, MLB actual-game source: https://www.mlb.com/news/cincinnati-reds-aroldis-chapman-clocked-at-101-mph-in-first-rehab-outing/c-74007788 . Earliest event report references fractures near nose/left eye with surgery. Actual embed/visual not yet requested because seven preferred candidates available.
- Jason Heyward: s2xLeKQSBxk (MLBGlobal13, 170 sec) returned oEmbed401, do not select. Other candidates hhKEWX0PFpA (Harold Hub, 85 sec), N0Zng1tTRB0 (Michael Someck, 42 sec), or official MLB daily recap 5RCDFxcIKn4. Injury 2013-08-21 jaw fracture/surgery, actual return 2013-09-20 MLB vs Cubs. https://www.mlb.com/news/braves-outfielder-jason-heyward-has-broken-jaw-after-being-hit-by-pitch/c-57784612 ; https://www.mlb.com/news/jason-heyward-returns-from-dl-starts-in-center-field-for-braves/c-61183798 . Earlier instructional-league possibility was only a plan and never occurred before comeback.
- Judge2018 and Desmond2017 were deprioritized because direct correct-event clips were difficult to locate. Never substitute other-year injuries under these dates.

## Final verification

- All seven selected clips have native iframe playback confirmed by root. Harper starts at 8 seconds so the pitch event at ~12 seconds is reached promptly.
- Independent reviewer baseball34_b verified our seven events and first return dates: `/tmp/atlas34/baseball-b/pass2-a.json`, all passed.
- Independent review of baseball34_b seven entries is recorded in `pass2-b.json`; all seven return dates checked against original competition evidence. Machado completed-surgery source supplied to author as a source improvement.
- External Codex was genuinely invoked and researched public sources, but context exhaustion prevented a final report. Do not claim this run passed a full multi-model audit.
