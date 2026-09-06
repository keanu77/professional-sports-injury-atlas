# Decision 31 independent Pass 2

Final source review covers 18 selected events. Each injury/return statement was checked against actual source text or official structured game records, not prior-agent summaries. Confidence is reviewer judgment, not a calibrated probability.

| Event | Return | Calendar days | Confidence |
|---|---|---:|---:|
| edwin-diaz-2023-patellar-tendon | 2024-03-11 | 362 | 0.96 |
| rhys-hoskins-2023-acl | 2024-03-01 | 344 | 0.98 |
| tim-hudson-2013-ankle | 2014-03-02 | 221 | 0.97 |
| buster-posey-2011-ankle | 2012-03-09 | 289 | 0.98 |
| kendrys-morales-2010-ankle | 2012-03-16 | 657 | 0.97 |
| steven-stamkos-2013-tibia | 2014-03-06 | 115 | 0.98 |
| connor-mcdavid-2019-pcl | 2019-09-24 | 171 | 0.98 |
| mikhail-sergachev-2024-leg | 2024-04-27 | 80 | 0.98 |
| max-pacioretty-2011-concussion | 2011-09-21 | 197 | 0.96 |
| bethanie-mattek-sands-2017-knee | 2018-03-21 | 258 | 0.97 |
| aaron-rodgers-2023-achilles | 2024-09-09 | 364 | 0.97 |
| harvey-elliott-2021-ankle | 2022-01-29 | 139 | 0.97 |
| wesley-fofana-2021-leg | 2022-03-17 | 225 | 0.96 |
| hector-bellerin-2019-knee | 2019-09-20 | 244 | 0.94 |
| annemiek-van-vleuten-2016-concussion | 2016-09-06 | 30 | 0.98 |
| rebeca-andrade-2019-knee | unknown | not calculated | 0.93 |
| juan-martin-del-potro-2018-knee | 2019-02-19 | 131 | 0.98 |
| dominic-thiem-2021-wrist | 2022-03-29 | 280 | 0.97 |

All 18 clip/event slug, URL, eventDate, returnDate, summary and source-URL bindings agree. All 17 numeric date intervals independently recomputed in Python. Andrade remains null and no day count is inferred.

Confirmed corrections: Hoskins source publication March24; Mattek/Rodgers remove unsupported extra context; Andrade uses directly readable Globo medical statement. Hudson and McDavid expanded injuries were independently reread in newly added official source articles. Samir is excluded from final matrix; source research remains scratch only.

Return levels remain explicit: simulated activity is excluded for Diaz; spring/preseason, minor-league exhibition, closed-door friendly, U23 and Challenger appearances remain labeled. These calendar intervals are descriptive, not treatment advice.

No new code blocker found in eight inspected source/test diffs (including wrist mapping and distinct American-football category). Build, runtime tests, thumbnail inspection and native iframe playback remain main-agent responsibility. See code-review.md for inspected paths.

Exact source URLs and short supporting extracts: source-matrix.json. Final reviewed JSON hashes are recorded there; subsequent timing-only edits require binding recheck, not medical re-review.
