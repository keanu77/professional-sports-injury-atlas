# Decision 18 research handoff — Markelle Fultz ACL (2021)

## Retained delta summary

All rows are `changeType=added`, `correctionBasis=null`, `evidenceUse=opened-original-page`, `searchSnippetUsedAsEvidence=false`, and remain `pending-owner-signoff`. Decision 17 baseline bytes and stable IDs remain unchanged.

| itemId                                 | kind      | factDate     | atomic proposition / proposed attributed statement                                                                    | source metadata                                                                                                                                                                                                                                                                                                     | first governed round |
| -------------------------------------- | --------- | ------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `markelle-fultz-acl-2021-surgery-02`   | surgery   | `2021-01-20` | Orlando Sentinel 的 Roy Parry 報導，Markelle Fultz 的左膝前十字韌帶修復手術由 Neal ElAttrache 醫師執行。              | “Magic guard Markelle Fultz undergoes knee surgery”; Orlando Sentinel / Roy Parry; published `2021-01-21`; accessed `2026-08-15`; web-article; `mainstream-media-report`; legacy URL redirects to canonical/final `https://www.orlandosentinel.com/2021/01/21/magic-guard-markelle-fultz-undergoes-knee-surgery/`   | surgery R2           |
| `markelle-fultz-acl-2021-treatment-02` | treatment | `2021-01-12` | Orlando Magic 的 Dan Savage 官方報導，Markelle Fultz 於 2021 年 1 月 12 日依復健指引進行例行上肢訓練。                | “Markelle Fultz Remains Faithful to the Grind”; Orlando Magic / Dan Savage; published `2021-01-12`; accessed `2026-08-15`; web-article; `team-or-league-official`; `https://www.nba.com/magic/orlando-magic-markelle-fultz-faithful-to-the-grind-rehab-acl-left-knee-injury-story-20210112`                         | treatment R2         |
| `markelle-fultz-acl-2021-treatment-03` | treatment | `2021-11-26` | Orlando Magic 的 Dan Savage 官方報導，Markelle Fultz 於 2021 年 11 月 26 日已與 Lakeland Magic 的 G League 隊伍練習。 | “Markelle Fultz and Jonathan Isaac Continue to Make Progress in Their Rehab”; Orlando Magic / Dan Savage; published `2021-11-27`; accessed `2026-08-15`; web-article; `team-or-league-official`; `https://www.nba.com/magic/orlando-magic-markelle-fultz-jonathan-isaac-injury-update-rehab-process-story-20211126` | treatment R2         |

Projected count change: treatment `1 → 3`, surgery `1 → 2`, injection `0 → 0`, actual-return `1 → 1`; total `3 → 6`. Projected tiers: `team-or-league-official=4`, `mainstream-media-report=2`, `unverified-report=0`. `actual-return=1`.

## Policy and audit boundary

- Case/search context: athlete `Markelle Fultz`; team-at-event `Orlando Magic`; injury term `ACL`; season `2020-21`; cutoff `2026-08-15`.
- Research session UTC bound: `2026-08-15T12:56:29Z`–`2026-08-15T13:45:30Z`. Each governed round below carries the actual search-call interval.
- Every one of the 24 scaffold queries was executed. Every governed supplemental query contains athlete, exact team-at-event, ACL, season/year, and a declared timepoint term. Within each audit unit, exact strings and `(sourceChannel,timepoint,coveredTermConcepts)` tuples are unique.
- Search snippets were discovery only. Every retained fact was checked on its opened original page. NBA URLs are literal text and must produce zero navigation sink in the product.
- Treatment re-review applied the nba-v10 hard boundary: only an actually reported action and supported date remain. Outcome, duration, prognosis, return timing, clearance status, and duplicate/included details from one same-day progression proposition were removed.
- This handoff does not invent digests or `angleId`; the authorized generator derives them.

## Baseline revalidation

| baseline item                              | disposition and opened-original boundary                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markelle-fultz-acl-2021-surgery-01`       | Retained byte-for-byte. Bleacher Report / Rob Goldberg, “Magic's Markelle Fultz Undergoes Successful Surgery on Knee Injury,” `2021-01-20`, `https://bleacherreport.com/articles/2927630-magics-markelle-fultz-undergoes-successful-surgery-on-knee-injury`, was freshly reopened on `2026-08-15`; historical item access date remains `2026-08-14`.                                                                                         |
| `markelle-fultz-acl-2021-treatment-01`     | Retained byte-for-byte. Orlando Magic / Dan Savage, “Markelle Fultz Practices with Orlando Magic in L.A., Continues to Make Progress in Rehab,” `2021-12-10`, `https://www.nba.com/magic/orlando-magic-markelle-fultz-injury-update-practice-team-los-angeles-20211210`, was freshly reopened and directly records team practice. Its 5-on-5/3-on-3/shooting details are included in that same baseline practice proposition, not new items. |
| `markelle-fultz-acl-2021-actual-return-01` | Retained byte-for-byte. Orlando Magic / Josh Cohen, “Markelle Fultz Makes Highly Anticipated Return; Magic Roll Past Pacers,” `2022-02-28`, `https://www.nba.com/magic/news/markelle-fultz-makes-highly-anticipated-return-magic-roll-past-pacers-20220228`, was freshly reopened and records occurred participation.                                                                                                                        |
| injection empty baseline                   | Revalidated empty; no opened original reported injection, shot, PRP, platelet-rich plasma, cortisone/corticosteroid, or needling for this episode.                                                                                                                                                                                                                                                                                           |

## Preliminary discovery log — excluded from governed round numbering

These earlier short strings were actually searched, but they lack one or more research-v2 context fields. They are discovery-only and contribute no formal coverage, terminal zero, or delta:

- Surgery P-S1 (`13:00:20Z`–`13:02:05Z`): `Markelle Fultz ACL surgery surgeon doctor January 20 2021 Orlando Sentinel`; `Markelle Fultz ACL operation surgeon name January 2021`; `Markelle Fultz surgery operating physician January 2021 Orlando Magic`. Becker’s opened page named Neal ElAttrache but attributed the fact upstream to Orlando Sentinel.
- Surgery P-S2 (`13:02:06Z`–`13:42:00Z`): the short Neal ElAttrache/Sentinel/team/ESPN/HSS follow-ups recorded during upstream resolution. Direct HTTP followed the Sentinel legacy 301 to a 200 canonical original exposing title, Roy Parry, publication timestamp, canonical URL, ACL-repair description, and the body sentence naming Neal ElAttrache.
- Treatment P-T1 (`13:02:06Z`–`13:03:12Z`): `Markelle Fultz ACL rehab upper body workout January 2021 Orlando Magic`; `site:nba.com/magic Markelle Fultz ACL rehab guidelines upper body workouts`; `Markelle Fultz ACL recovery January 2021 team official rehabilitation`.
- Treatment P-T2/P-T3 (`13:24:28Z`–`13:27:42Z`): the prior short Jan/Nov/Dec practice, physical-therapy, full-practice, and clearance searches. They were not counted as terminal rounds; compliant replacements are governed R3 and R4 below.

## Governed formal round ledger

All initial plan-slot rows use the scaffold’s full, code-point-sorted concept set for that kind. `verificationChannel=web-open-original-page`, `timepointApplicability=applicable`, `notApplicableReason=null`, and `searchSnippetUsedAsEvidence=false` throughout.

### Surgery

**R1 — `2026-08-15T12:56:29Z`–`2026-08-15T12:57:48Z` — `qualifiedFactDeltas=[]`.**

- plan-surgery-1 / team / injury-time: `Markelle Fultz Orlando Magic ACL 2020-21 injury operated procedure reconstruction repair surgeon doctor operating physician surgery underwent official team newsroom` — injury/team material, no new operative detail.
- plan-surgery-2 / NBA news / operation-announcement: `Markelle Fultz Orlando Magic ACL 2020-21 surgery operated procedure reconstruction repair surgeon doctor operating physician surgery underwent site:nba.com/news official announcement` — diagnosis/return material only.
- plan-surgery-3 / NBA injury reports / rehabilitation-progression: `Markelle Fultz Orlando Magic ACL 2020-21 rehab operated procedure reconstruction repair surgeon doctor operating physician surgery underwent site:official.nba.com injury report` — status only.
- plan-surgery-4 / NBA game / actual-return: `return 2020-21 ACL Orlando Magic Markelle Fultz operated procedure reconstruction repair surgeon doctor operating physician surgery underwent site:nba.com/game box score` — no operative detail.

The official 2022-23 Orlando Magic media guide was inspected in memory but exposed no exact publication date for item evidence; it is contextual corroboration only.

**R2 — `2026-08-15T12:57:49Z`–`2026-08-15T13:43:47Z` — `qualifiedFactDeltas=[surgery-02 added]`.**

- plan-surgery-5 / formal statement / injury-time: `injury 2020-21 ACL Orlando Magic Markelle Fultz operated procedure reconstruction repair surgeon doctor operating physician surgery underwent press conference official statement` — no distinct detail.
- plan-surgery-6 / mainstream / operation-announcement: `surgery 2020-21 ACL Orlando Magic Markelle Fultz operated procedure reconstruction repair surgeon doctor operating physician surgery underwent Associated Press ESPN Reuters original report` — freshly reopened unchanged Bleacher Report baseline.

- `fultz-surgery-r3-q1`; named-mainstream-original-page / operation-announcement; concepts `['repair','surgeon-name-branch']`; named-person `Neal ElAttrache`; exact query: `Markelle Fultz Orlando Magic ACL 2020-21 surgery repair surgeon Neal ElAttrache Orlando Sentinel original report` — followed the upstream original and retained its surgeon fact. Becker became corroboration only.

**R3 — `2026-08-15T13:43:52Z`–`2026-08-15T13:43:54Z` — `qualifiedFactDeltas=[]`.**

- `fultz-surgery-r4-q1`; team-official-site-newsroom / operation-announcement; concepts `['repair','surgeon-name-branch']`; named-person `Neal ElAttrache`; exact query: `Markelle Fultz Orlando Magic ACL 2020-21 surgery repair surgeon Neal ElAttrache official team newsroom` — no new procedure/date/name; team pages repeated diagnosis, practice, or return.

**R4 — `2026-08-15T13:43:58Z`–`2026-08-15T13:44:01Z` — `qualifiedFactDeltas=[]`; terminal pair R3+R4.**

- `fultz-surgery-r5-q1`; press-conference-formal-statement / rehabilitation-progression; concepts `['surgeon-name-branch']`; named-person `Neal ElAttrache`; exact query: `rehabilitation 2020-21 Orlando Magic Markelle Fultz ACL Neal ElAttrache surgeon press conference formal statement` — repeated rehab pages, no new surgical fact.

Named-surgeon branch: `named-surgeon-found`; Neal ElAttrache first retained R2 and searched again in later R3/R4. The final two rounds use distinct query/angle tuples.

### Treatment

**R1 — `2026-08-15T12:58:41Z`–`2026-08-15T12:59:43Z` — `qualifiedFactDeltas=[]`.**

- plan-treatment-1 / team / injury-time: `Markelle Fultz Orlando Magic ACL 2020-21 injury cleared management program progression recovery rehab treatment official team newsroom` — freshly reopened the Dec 10 baseline and found the Nov candidate, but no delta is assigned until the compliant focused query later in R2.
- plan-treatment-2 / NBA news / operation-announcement: `Markelle Fultz Orlando Magic ACL 2020-21 surgery cleared management program progression recovery rehab treatment site:nba.com/news official announcement` — no new concrete action.

**R2 — `2026-08-15T12:59:44Z`–`2026-08-15T13:44:47Z` — `qualifiedFactDeltas=[treatment-02 added, treatment-03 added]`.**

- plan-treatment-3 / NBA injury reports / rehabilitation-progression: `Markelle Fultz Orlando Magic ACL 2020-21 rehab cleared management program progression recovery rehab treatment site:official.nba.com injury report` — status only.
- plan-treatment-4 / NBA game / actual-return: `return 2020-21 ACL Orlando Magic Markelle Fultz cleared management program progression recovery rehab treatment site:nba.com/game box score` — return record, not new treatment.
- plan-treatment-5 / formal statement / injury-time: `injury 2020-21 ACL Orlando Magic Markelle Fultz cleared management program progression recovery rehab treatment press conference official statement` — repeated team updates.
- plan-treatment-6 / mainstream / operation-announcement: `surgery 2020-21 ACL Orlando Magic Markelle Fultz cleared management program progression recovery rehab treatment Associated Press ESPN Reuters original report` — no new action.

| queryId                 | channel / timepoint / concepts                                                       | exact query                                                                                                                                                   | opened-original result                                                                                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fultz-treatment-r3-q1` | team-official-site-newsroom / injury-time / `['treatment']`                          | `Markelle Fultz Orlando Magic ACL 2020-21 injury treatment upper-body workout rehabilitation guidelines official team newsroom January 12 2021`               | opened Jan 12 team original; retained only the dated routine upper-body action as `treatment-02`; future surgery and motivational/outcome text rejected.                                                                                                           |
| `fultz-treatment-r3-q2` | team-official-site-newsroom / rehabilitation-progression / `['progression','rehab']` | `Orlando Magic 2020-21 ACL Markelle Fultz rehabilitation progression Lakeland Magic practice two-on-two conditioning official team newsroom November 26 2021` | opened Nov update; retained only Lakeland G League practice as `treatment-03`. Orlando court work, same-session two-on-two, contact/up-and-down, and conditioning are included details of this one same-day progression proposition and do not create extra items. |

The Dec 10 source’s 5-on-5, 3-on-3, and shooting drills are included in unchanged baseline `treatment-01` (“participated in team practice”) and are not counted again.

**R3 — `2026-08-15T13:45:19Z`–`2026-08-15T13:45:21Z` — `qualifiedFactDeltas=[]`.**

- `fultz-treatment-r4-q1`; named-mainstream-original-page / rehabilitation-progression / `['management']`: `Markelle Fultz Orlando Magic ACL 2020-21 rehabilitation management named mainstream original page concrete exercise December 2021` — repeated Nov/Dec practice facts.
- `fultz-treatment-r4-q2`; nba-official-news-announcements / actual-return / `['cleared']`: `return 2022 Orlando Magic Markelle Fultz ACL 2020-21 cleared NBA official news treatment training action` — clearance and return records only; no new intervention.

**R4 — `2026-08-15T13:45:29Z`–`2026-08-15T13:45:30Z` — `qualifiedFactDeltas=[]`; terminal pair R3+R4.**

- `fultz-treatment-r5-q1`; press-conference-formal-statement / rehabilitation-progression / `['program']`: `Markelle Fultz Orlando Magic ACL 2020-21 rehabilitation program press conference formal statement January 2022 concrete drills` — repeated Nov/Dec practice; no new dated atomic action.
- `fultz-treatment-r5-q2`; nba-official-injury-reports / injury-time / `['recovery']`: `injury 2021 Orlando Magic Markelle Fultz ACL 2020-21 recovery official NBA injury report treatment action` — out/recovery status only.

R2 reset the counter; R3 and R4 are consecutive governed zero-delta rounds with different query/angle tuples.

### Injection

Concept set in all scaffold queries: `['corticosteroid','cortisone','injection','needling','platelet-rich-plasma','prp','shot']`.

**R1 — `2026-08-15T13:03:13Z`–`2026-08-15T13:04:03Z` — `qualifiedFactDeltas=[]`.**

- plan-injection-1 / team / injury-time: `Markelle Fultz Orlando Magic ACL 2020-21 injury corticosteroid cortisone injection needling platelet-rich plasma PRP shot official team newsroom`
- plan-injection-2 / NBA news / operation-announcement: `Markelle Fultz Orlando Magic ACL 2020-21 surgery corticosteroid cortisone injection needling platelet-rich plasma PRP shot site:nba.com/news official announcement`
- plan-injection-3 / NBA injury reports / rehabilitation-progression: `Markelle Fultz Orlando Magic ACL 2020-21 rehab corticosteroid cortisone injection needling platelet-rich plasma PRP shot site:official.nba.com injury report`
- plan-injection-4 / NBA game / actual-return: `return 2020-21 ACL Orlando Magic Markelle Fultz corticosteroid cortisone injection needling platelet-rich plasma PRP shot site:nba.com/game box score`

**R2 — `2026-08-15T13:04:04Z`–`2026-08-15T13:04:58Z` — `qualifiedFactDeltas=[]`; terminal pair R1+R2.**

- plan-injection-5 / formal statement / injury-time: `injury 2020-21 ACL Orlando Magic Markelle Fultz corticosteroid cortisone injection needling platelet-rich plasma PRP shot press conference official statement`
- plan-injection-6 / mainstream / operation-announcement: `surgery 2020-21 ACL Orlando Magic Markelle Fultz corticosteroid cortisone injection needling platelet-rich plasma PRP shot Associated Press ESPN Reuters original report`

Results were unrelated “shot” uses, surgery/rehab pages without an injection, or no candidate. Empty is only the complete checked boundary, never proof of non-occurrence.

### Actual return

Concept set in all scaffold queries: `['activated','cleared-to-play','debut','first-game-back','return','returned']`.

**R1 — `2026-08-15T13:04:59Z`–`2026-08-15T13:05:50Z` — `qualifiedFactDeltas=[]`.**

- plan-actual-return-1 / team / injury-time: `Markelle Fultz Orlando Magic ACL 2020-21 injury activated cleared to play debut first game back return returned official team newsroom` — freshly reopened official baseline participation page.
- plan-actual-return-2 / NBA news / operation-announcement: `Markelle Fultz Orlando Magic ACL 2020-21 surgery activated cleared to play debut first game back return returned site:nba.com/news official announcement` — league story corroborated the same Feb 28 fact.

**R2 — `2026-08-15T13:05:51Z`–`2026-08-15T13:07:08Z` — `qualifiedFactDeltas=[]`; terminal pair R1+R2.**

- plan-actual-return-3 / NBA injury reports / rehabilitation-progression: `Markelle Fultz Orlando Magic ACL 2020-21 rehab activated cleared to play debut first game back return returned site:official.nba.com injury report`
- plan-actual-return-4 / NBA participation / actual-return: `return 2020-21 ACL Orlando Magic Markelle Fultz activated cleared to play debut first game back return returned site:nba.com/game box score`
- plan-actual-return-5 / formal statement / injury-time: `injury 2020-21 ACL Orlando Magic Markelle Fultz activated cleared to play debut first game back return returned press conference official statement`
- plan-actual-return-6 / mainstream / operation-announcement: `surgery 2020-21 ACL Orlando Magic Markelle Fultz activated cleared to play debut first game back return returned Associated Press ESPN Reuters original report`

Official sources repeat the same occurred Feb 28 participation. Pre-return announcements and mainstream planned-return reporting cannot create another actual-return item.

## Excluded and corroborative boundaries

- The Nov 27 team page’s Orlando on-court work, two-on-two drill, contact/up-and-down, and conditioning descriptions belong to the same same-day progression proposition as Lakeland practice and were not split into multiple novelty items.
- Dec 10 five-on-five, three-on-three, and shooting details are contained by the unchanged baseline team-practice item. Feb 26 generalized retrospective strength/conditioning language supplies no distinct dated action and was not retained.
- Orlando Sentinel direct HTTP resolved the legacy redirect; no material access candidate remains. Becker’s page is corroboration only because it expressly cites the stronger opened Sentinel original.
- The Orlando media-guide PDF had no exact publication date for item evidence. Injury reports are status only. Generic recovery duration, efficacy/outcome, prognosis, planned return, unrelated shoulder/toe material, Reddit/Wikipedia, and search snippets support no item.
