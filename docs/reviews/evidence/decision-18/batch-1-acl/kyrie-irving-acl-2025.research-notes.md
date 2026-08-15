# Decision 18 research handoff — Kyrie Irving ACL (2025)

## Retained delta summary

All rows are `changeType=added`, `correctionBasis=null`, `evidenceUse=opened-original-page`, `searchSnippetUsedAsEvidence=false`, and remain `pending-owner-signoff`. Decision 17 baseline bytes and stable IDs remain unchanged.

| itemId                               | kind      | factDate     | atomic proposition / proposed attributed statement                                                                                | source metadata                                                                                                                                                                                                                                                                                                                                         | first governed round |
| ------------------------------------ | --------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `kyrie-irving-acl-2025-surgery-02`   | surgery   | `2025-03-26` | Dallas Mavericks 的 Dwain Price 官方報導，Kyrie Irving 於 2025 年 3 月 26 日接受手術修復左膝撕裂的前十字韌帶。                    | “Kyrie Irving undergoes successful left knee surgery”; Dallas Mavericks / Dwain Price; published `2025-03-26`; accessed `2026-08-15`; press-release; `team-or-league-official`; `https://www.nba.com/mavs/irvinghassuccessfulkneesurgery`                                                                                                               | surgery R1           |
| `kyrie-irving-acl-2025-surgery-03`   | surgery   | `2025-03-26` | Dallas Mavericks 的 Dwain Price 官方報導，Kyrie Irving 的左膝前十字韌帶修復手術由 Riley J. Williams 醫師執行。                    | same independently cited opened Dallas Mavericks original as preceding row; `team-or-league-official`                                                                                                                                                                                                                                                   | surgery R1           |
| `kyrie-irving-acl-2025-treatment-02` | treatment | `2025-08-31` | Sports Illustrated 的 Madison Williams 報導，Kyrie Irving 於 2025 年 8 月 31 日在籃球場上練習。                                   | “Kyrie Irving Takes Big Step in ACL Recovery in Latest Video”; Sports Illustrated / Madison Williams; published `2025-08-31`; accessed `2026-08-15`; web-article; `mainstream-media-report`; `https://www.si.com/nba/kyrie-irving-big-step-acl-recovery-video`                                                                                          | treatment R2         |
| `kyrie-irving-acl-2025-treatment-03` | treatment | `2025-10-22` | Sports Illustrated On SI 的 Austin Veazey 引述獨行俠賽事轉播團隊報導，Kyrie Irving 於 2025 年 10 月 22 日已與球隊進行非接觸訓練。 | “Mavericks' brutal offense may force them to make risky Kyrie Irving decision”; Sports Illustrated On SI / Austin Veazey; published `2025-10-23`; accessed `2026-08-15`; web-article; `unverified-report`（二手轉述，絕不視覺升級）; `https://www.si.com/nba/mavericks/onsi/news/dallas-mavericks-brutal-offense-may-force-risky-kyrie-irving-decision` | treatment R2         |
| `kyrie-irving-acl-2025-treatment-04` | treatment | `2026-05-29` | The Dallas Morning News 的 Mike Curtis 報導，Kyrie Irving 表示自己於 2026 年 5 月 29 日持續進行重量訓練室訓練。                   | “Kyrie Irving nearing full recovery from ACL tear, Mavericks star says”; The Dallas Morning News / Mike Curtis; published `2026-05-30`; accessed `2026-08-15`; web-article; `mainstream-media-report`; `https://www.dallasnews.com/sports/mavericks/article/kyrie-irving-acl-injury-update-mavs-22283771.php`                                           | treatment R2         |

Projected count change: treatment `1 → 4`, surgery `1 → 3`, injection `0 → 0`, actual-return `0 → 0`; total `2 → 7`. Projected tiers: `team-or-league-official=4`, `mainstream-media-report=2`, `unverified-report=1`. `actual-return=0`.

## Policy and audit boundary

- Case/search context: athlete `Kyrie Irving`; team-at-event `Dallas Mavericks`; injury term `ACL`; season `2024-25`; cutoff `2026-08-15`.
- Research session UTC bound: `2026-08-15T12:48:00Z`–`2026-08-15T13:44:34Z`. Each governed round below carries the actual search-call interval.
- Every one of the 24 scaffold queries was executed. Every governed supplemental query contains athlete, exact team-at-event, ACL, season/year, and a declared timepoint term. Within each audit unit, exact query strings and `(sourceChannel,timepoint,coveredTermConcepts)` tuples are unique.
- Search snippets were discovery only. Every retained fact was checked on its opened original page. NBA URLs are literal text and must produce zero navigation sink in the product.
- Treatment re-review applied the nba-v10 hard boundary: only an actually reported action and supported date remain. Outcome, duration, prognosis, return timing, clearance status, vague workload, and duplicate/included descriptions of the same training phase were removed.
- This handoff does not invent digests or `angleId`; the authorized generator derives them.

## Baseline revalidation

| baseline item                        | disposition and opened-original boundary                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kyrie-irving-acl-2025-surgery-01`   | Retained byte-for-byte. Dallas Mavericks / Dwain Price original above was freshly reopened on `2026-08-15`; its historical item `source.accessedAt=2026-08-14` is not rewritten.                                                                                                                                            |
| `kyrie-irving-acl-2025-treatment-01` | Retained byte-for-byte. Dallas Mavericks, “Kyrie Irving will Miss Remainder of 2025-26 Season to Continue ACL Recovery,” `2026-02-18`, `https://www.nba.com/mavs/news/kyrie-irving-to-miss-remainder-of-2025-26-season-as-he-continues-acl-recovery`, was freshly reopened and directly supports supervised rehabilitation. |
| injection empty baseline             | Revalidated empty; no opened original reported injection, shot, PRP, platelet-rich plasma, cortisone/corticosteroid, or needling for this episode.                                                                                                                                                                          |
| actual-return empty baseline         | Revalidated empty; no official occurred-participation source by the cutoff. The team’s `2026-02-18` announcement is not an actual return fact.                                                                                                                                                                              |

## Preliminary discovery log — excluded from governed round numbering

The following earlier short strings were actually searched and led to candidate discovery, but they lack one or more research-v2 context fields. They are retained only as a transparent discovery log and contribute no formal coverage, terminal zero, or delta:

- Surgery P-S1 (`13:04:00Z`–`13:05:20Z`): `Kyrie Irving Riley J Williams ACL surgery Hospital for Special Surgery March 2025`; `site:hss.edu Kyrie Irving Riley Williams ACL 2025`; `Kyrie Irving ACL reconstruction surgeon Riley Williams interview rehabilitation`.
- Treatment P-T1 (`13:05:21Z`–`13:10:05Z`): `Kyrie Irving ACL rehab May 2025 doctors trainers Dallas Morning News`; `Kyrie Irving ACL recovery training camp not cleared September 2025 Dallas Morning News`; `Kyrie Irving ACL individual workouts Phil Handy November 2025 Dallas Morning News`; `Kyrie Irving ACL healing up great gym August 26 2025 Grant Afseth`.
- Treatment P-T2 (`13:10:06Z`–`13:14:12Z`): `Kyrie Irving ACL recovery basketball court video August 31 2025 Sports Illustrated`; `Kyrie Irving ACL recovery May 2026 court weight room Dallas Morning News`; `site:nba.com/mavs Kyrie Irving ACL recovery rehab November 2025`; `Kyrie Irving ACL rehabilitation 2026 ESPN Associated Press original`.
- Treatment P-T3 (`13:33:45Z`–`13:35:12Z`): `Kyrie Irving ACL rehabilitation October 2025 Dallas Mavericks official workout progression`; `Kyrie Irving ACL rehab individual workouts Phil Handy November 2025 original report`; `site:official.nba.com Kyrie Irving left ACL injury recovery January 2026`; `Kyrie Irving ACL recovery on-court weight-room June 2026 ESPN Associated Press`.
- Treatment P-T4 (`13:35:13Z`–`13:36:42Z`): `"doing a lot of the non-contact stuff with us" Kyrie Irving Jason Kidd`; `"looks incredible" "shooting, passing, running" Kyrie Irving ACL`; `Kyrie Irving non-contact shooting passing running Jason Kidd NBA TV October 2025`; `site:nba.com Kyrie Irving non-contact shooting passing running ACL October 2025`.
- Treatment P-T5/P-T6 (`13:36:43Z`–`13:40:30Z`): the prior short non-contact/practice follow-ups. They were not counted as terminal rounds; compliant replacements are governed R3 and R4 below.

## Governed formal round ledger

All initial plan-slot rows use the scaffold’s full, code-point-sorted concept set for that kind. `verificationChannel=web-open-original-page`, `timepointApplicability=applicable`, `notApplicableReason=null`, and `searchSnippetUsedAsEvidence=false` throughout.

### Surgery

**R1 — `2026-08-15T12:48:00Z`–`2026-08-15T12:49:32Z` — `qualifiedFactDeltas=[surgery-02 added, surgery-03 added]`.**

| query          | channel / timepoint                                      | exact query                                                                                                                                                                               | result                                                                          |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| plan-surgery-1 | team-official-site-newsroom / injury-time                | `Kyrie Irving Dallas Mavericks ACL 2024-25 injury operated procedure reconstruction repair surgeon doctor operating physician surgery underwent official team newsroom`                   | Opened team original; retained ACL-repair and Riley J. Williams facts.          |
| plan-surgery-2 | nba-official-news-announcements / operation-announcement | `Kyrie Irving Dallas Mavericks ACL 2024-25 surgery operated procedure reconstruction repair surgeon doctor operating physician surgery underwent site:nba.com/news official announcement` | Freshly reopened unchanged baseline source; league page otherwise corroborated. |
| plan-surgery-3 | nba-official-injury-reports / rehabilitation-progression | `Kyrie Irving Dallas Mavericks ACL 2024-25 rehab operated procedure reconstruction repair surgeon doctor operating physician surgery underwent site:official.nba.com injury report`       | Status only; no new operative fact.                                             |
| plan-surgery-4 | nba-official-game-participation / actual-return          | `return 2024-25 ACL Dallas Mavericks Kyrie Irving operated procedure reconstruction repair surgeon doctor operating physician surgery underwent site:nba.com/game box score`              | No new operative fact.                                                          |

**R2 — `2026-08-15T12:49:33Z`–`2026-08-15T12:50:25Z` — `qualifiedFactDeltas=[]`.**

- plan-surgery-5, press-conference-formal-statement / injury-time: `injury 2024-25 ACL Dallas Mavericks Kyrie Irving operated procedure reconstruction repair surgeon doctor operating physician surgery underwent press conference official statement` — no distinct operative fact.
- plan-surgery-6, named-mainstream-original-page / operation-announcement: `surgery 2024-25 ACL Dallas Mavericks Kyrie Irving operated procedure reconstruction repair surgeon doctor operating physician surgery underwent Associated Press ESPN Reuters original report` — ESPN repeated the same repair/surgeon proposition.

**R3 — `2026-08-15T13:43:37Z`–`2026-08-15T13:43:39Z` — `qualifiedFactDeltas=[]`; terminal pair R2+R3.**

- `kyrie-surgery-r3-q1`; named-mainstream-original-page / rehabilitation-progression; concepts `['surgeon-name-branch']`; named-person `Riley J. Williams`; exact query: `Kyrie Irving Dallas Mavericks ACL 2024-25 rehabilitation Riley J. Williams surgeon` — results repeated the already retained team/ESPN surgeon fact; no new procedure, date, or medical person.

Named-surgeon branch: `named-surgeon-found`; Riley J. Williams first retained R1 and searched again later in R3.

### Treatment

**R1 — `2026-08-15T12:50:26Z`–`2026-08-15T12:51:20Z` — `qualifiedFactDeltas=[]`.**

- plan-treatment-1, team-official-site-newsroom / injury-time: `Kyrie Irving Dallas Mavericks ACL 2024-25 injury cleared management program progression recovery rehab treatment official team newsroom` — freshly reopened `treatment-01`; “on schedule” language rejected.
- plan-treatment-2, nba-official-news-announcements / operation-announcement: `Kyrie Irving Dallas Mavericks ACL 2024-25 surgery cleared management program progression recovery rehab treatment site:nba.com/news official announcement` — no concrete new action.

**R2 — `2026-08-15T12:51:21Z`–`2026-08-15T13:44:14Z` — `qualifiedFactDeltas=[treatment-02 added, treatment-03 added, treatment-04 added]`.**

- plan-treatment-3, nba-official-injury-reports / rehabilitation-progression: `Kyrie Irving Dallas Mavericks ACL 2024-25 rehab cleared management program progression recovery rehab treatment site:official.nba.com injury report` — status only; later right-ACL rows conflict with the governed left-knee case and were rejected.
- plan-treatment-4, nba-official-game-participation / actual-return: `return 2024-25 ACL Dallas Mavericks Kyrie Irving cleared management program progression recovery rehab treatment site:nba.com/game box score` — no treatment action or participation.
- plan-treatment-5, press-conference-formal-statement / injury-time: `injury 2024-25 ACL Dallas Mavericks Kyrie Irving cleared management program progression recovery rehab treatment press conference official statement` — vague outcome/timing only.
- plan-treatment-6, named-mainstream-original-page / operation-announcement: `surgery 2024-25 ACL Dallas Mavericks Kyrie Irving cleared management program progression recovery rehab treatment Associated Press ESPN Reuters original report` — “recovery process started” is not a concrete intervention.

| queryId                 | channel / timepoint / concepts                                                  | exact query                                                                                                                             | opened-original result                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kyrie-treatment-r3-q1` | named-mainstream-original-page / rehabilitation-progression / `['rehab']`       | `Kyrie Irving Dallas Mavericks ACL 2024-25 rehabilitation rehab individual workout Phil Handy November 1 2025 Dallas Morning News`      | DMN individual-workout description rejected as the same on-court/non-contact training stage represented more specifically below; no novelty.                           |
| `kyrie-treatment-r3-q2` | named-mainstream-original-page / rehabilitation-progression / `['recovery']`    | `Dallas Mavericks 2024-25 ACL Kyrie Irving recovery rehabilitation practice basketball court August 31 2025 Sports Illustrated`         | retained `treatment-02`; excluded all outcome/timeline copy.                                                                                                           |
| `kyrie-treatment-r3-q3` | named-mainstream-original-page / rehabilitation-progression / `['treatment']`   | `Kyrie Irving Dallas Mavericks ACL 2024-25 rehabilitation treatment weight room May 29 2026 Dallas Morning News`                        | retained only weight-room action as `treatment-04`; “almost 100%” and return implications rejected.                                                                    |
| `kyrie-treatment-r3-q4` | named-mainstream-original-page / rehabilitation-progression / `['program']`     | `Dallas Mavericks 2024-25 ACL Kyrie Irving rehabilitation program light on-court workouts October 2025 Christian Clark The Athletic`    | The Athletic/NBA full-text original opened; light-court description rejected as included/corroborative of the same on-court stage, and projected return copy rejected. |
| `kyrie-treatment-r3-q5` | named-mainstream-original-page / rehabilitation-progression / `['progression']` | `Kyrie Irving Dallas Mavericks ACL 2024-25 rehabilitation progression non-contact team drills shooting passing running October 22 2025` | retained the single non-contact-team-training proposition as `treatment-03`, only at `unverified-report`.                                                              |

**R3 — `2026-08-15T13:44:26Z`–`2026-08-15T13:44:28Z` — `qualifiedFactDeltas=[]`.**

- `kyrie-treatment-r4-q1`; team-official-site-newsroom / rehabilitation-progression / `['management']`: `Kyrie Irving Dallas Mavericks ACL 2024-25 rehabilitation management official team newsroom December 2025 concrete workout` — official pages offered status, surgery, or the existing supervised-rehab baseline only.
- `kyrie-treatment-r4-q2`; nba-official-news-announcements / actual-return / `['cleared']`: `return 2025 Dallas Mavericks Kyrie Irving ACL 2024-25 cleared NBA official news announcement training activity` — return/clearance projections and duplicate surgery only.

**R4 — `2026-08-15T13:44:32Z`–`2026-08-15T13:44:34Z` — `qualifiedFactDeltas=[]`; terminal pair R3+R4.**

- `kyrie-treatment-r5-q1`; press-conference-formal-statement / rehabilitation-progression / `['program']`: `Kyrie Irving Dallas Mavericks ACL 2024-25 rehabilitation program press conference formal statement January 2026 workout` — baseline supervision, outcomes, and timing only.
- `kyrie-treatment-r5-q2`; named-mainstream-original-page / injury-time / `['recovery']`: `injury 2024-25 Dallas Mavericks Kyrie Irving ACL recovery named mainstream original report specific training exercises` — repeated already opened sources; no new dated action.

The two final rounds use different query/angle tuples. R2 reset the counter; R3 and R4 are consecutive governed zero-delta rounds.

### Injection

Concept set in all scaffold queries: `['corticosteroid','cortisone','injection','needling','platelet-rich-plasma','prp','shot']`.

**R1 — `2026-08-15T12:52:39Z`–`2026-08-15T12:53:34Z` — `qualifiedFactDeltas=[]`.**

- plan-injection-1 / team / injury-time: `Kyrie Irving Dallas Mavericks ACL 2024-25 injury corticosteroid cortisone injection needling platelet-rich plasma PRP shot official team newsroom`
- plan-injection-2 / NBA news / operation-announcement: `Kyrie Irving Dallas Mavericks ACL 2024-25 surgery corticosteroid cortisone injection needling platelet-rich plasma PRP shot site:nba.com/news official announcement`
- plan-injection-3 / NBA injury reports / rehabilitation-progression: `Kyrie Irving Dallas Mavericks ACL 2024-25 rehab corticosteroid cortisone injection needling platelet-rich plasma PRP shot site:official.nba.com injury report`
- plan-injection-4 / NBA game / actual-return: `return 2024-25 ACL Dallas Mavericks Kyrie Irving corticosteroid cortisone injection needling platelet-rich plasma PRP shot site:nba.com/game box score`

**R2 — `2026-08-15T12:53:35Z`–`2026-08-15T12:54:20Z` — `qualifiedFactDeltas=[]`; terminal pair R1+R2.**

- plan-injection-5 / formal statement / injury-time: `injury 2024-25 ACL Dallas Mavericks Kyrie Irving corticosteroid cortisone injection needling platelet-rich plasma PRP shot press conference official statement`
- plan-injection-6 / mainstream / operation-announcement: `surgery 2024-25 ACL Dallas Mavericks Kyrie Irving corticosteroid cortisone injection needling platelet-rich plasma PRP shot Associated Press ESPN Reuters original report`

All results were unrelated “shot” uses, surgery/rehab pages without an injection, or no candidate. Empty is only the complete checked boundary, never proof of non-occurrence.

### Actual return

Concept set in all scaffold queries: `['activated','cleared-to-play','debut','first-game-back','return','returned']`.

**R1 — `2026-08-15T12:54:21Z`–`2026-08-15T12:55:12Z` — `qualifiedFactDeltas=[]`.**

- plan-actual-return-1 / team / injury-time: `Kyrie Irving Dallas Mavericks ACL 2024-25 injury activated cleared to play debut first game back return returned official team newsroom`
- plan-actual-return-2 / NBA news / operation-announcement: `Kyrie Irving Dallas Mavericks ACL 2024-25 surgery activated cleared to play debut first game back return returned site:nba.com/news official announcement`

**R2 — `2026-08-15T12:55:13Z`–`2026-08-15T12:56:28Z` — `qualifiedFactDeltas=[]`; terminal pair R1+R2.**

- plan-actual-return-3 / NBA injury reports / rehabilitation-progression: `Kyrie Irving Dallas Mavericks ACL 2024-25 rehab activated cleared to play debut first game back return returned site:official.nba.com injury report`
- plan-actual-return-4 / NBA participation / actual-return: `return 2024-25 ACL Dallas Mavericks Kyrie Irving activated cleared to play debut first game back return returned site:nba.com/game box score`
- plan-actual-return-5 / formal statement / injury-time: `injury 2024-25 ACL Dallas Mavericks Kyrie Irving activated cleared to play debut first game back return returned press conference official statement`
- plan-actual-return-6 / mainstream / operation-announcement: `surgery 2024-25 ACL Dallas Mavericks Kyrie Irving activated cleared to play debut first game back return returned Associated Press ESPN Reuters original report`

No official source documented occurred participation by the cutoff. Predictions, hoped-for dates, clearance language without participation, and `unverified-report` material support zero actual-return items.

## Excluded and corroborative boundaries

- Removed after nba-v10 re-review: May 14 generic rehab-video wording; September 29 `not cleared` status; August 26 vague “doing a little bit more” gym workload. None is a concrete atomic intervention/action.
- DMN’s November 1 individual workout and The Athletic’s month-long light-court description were opened but not separately counted because they repeat/include the same on-court/non-contact training stage; one source paragraph or nearby date cannot be split to inflate novelty.
- Official “on/ahead of schedule,” “doing great,” `almost 100%`, generic rehabilitation duration, all prognosis, and every prospective return statement were rejected.
- NBA injury-report status is not treatment; right-ACL/right-knee rows conflict with the official left-knee record and cannot change the governed case.
- Associated Press injury coverage, team status pages, ESPN, and NBA News pages corroborated retained facts but added no atomic action. Fan/Reddit text, search snippets, generic ACL timelines, and inaccessible/metadata-only video pages support no item.
