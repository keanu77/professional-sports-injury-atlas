# Decision 18 research notes — Joe Ingles ACL 2022

- Audit cutoff/access date: `2026-08-15`.
- Research session: `2026-08-15T13:19:37Z`–`2026-08-15T13:46:41Z` (UTC, second-level round timestamps).
- All 24 exact scaffold queries were issued. Later short searches were preliminary discovery only; they are preserved below but are not eligible for the governed ledger because they omit one or more required athlete/team-at-event/injury/season/timepoint terms.
- Governed supplemental rounds were then actually re-run with the complete search context `Joe Ingles` + `Utah Jazz` + `ACL` + `2021-22`, a declared timepoint term, an explicit source channel, and a unique `(channel, timepoint, concept subset)` angle.
- Search results and snippets were discovery only. Every retained or revalidated fact was checked on an original page by web open and/or direct HTTPS retrieval. `searchSnippetUsedAsEvidence=false` throughout.
- This is an evidence handoff, not the canonical v2 ledger. Every proposed Decision 18 item remains `pending-owner-signoff`.

## Retained delta summary

1. `joe-ingles-acl-2022-surgery-d18-01`
   - Kind / fact date / first governed appearance: `surgery` / `2022-02-23` / surgery R1.
   - Atomic proposition: the official release identifies Dr. Brian Cole as the surgeon for Ingles's left-knee ACL operation.
   - Canonical/final URL: `https://www.nba.com/news/joe-ingles-undergoes-successful-knee-surgery-to-repair-torn-acl`
   - Title: `Joe Ingles undergoes successful knee surgery to repair torn ACL`
   - Publisher/account: `NBA.com` / `Official release`
   - Published/accessed: `2022-02-24` / `2026-08-15`
   - Medium/tier: `press-release` / `team-or-league-official`. The source context also names Midwest Orthopaedics at Rush in Munster, Indiana, but that facility/location is not bundled into a second operation fact.

2. `joe-ingles-acl-2022-treatment-d18-01`
   - Kind / fact date / first governed appearance: `treatment` / `2022-12-17` / treatment R2.
   - Atomic proposition: ESPN reported that Ingles completed his final 5-on-5 workout on 2022-12-17.
   - Canonical/final URL: `https://www.espn.com/nba/story/_/id/35273380/bucks-joe-ingles-make-return-acl-injury-monday`
   - Title: `Bucks' Joe Ingles to make return from ACL injury Monday`
   - Publisher/account: `ESPN` / `Adrian Wojnarowski`
   - Published/accessed: `2022-12-17` (`2022-12-17T21:55:00Z` in original JSON-LD) / `2026-08-15`
   - Medium/tier: `web-article` / `mainstream-media-report`.
   - Scope: “successfully” and “last hurdle” outcome framing is not carried into the fact.

3. `joe-ingles-acl-2022-treatment-d18-02`
   - Kind / fact date / first governed appearance: `treatment` / `null` / treatment R2.
   - Atomic proposition: ESPN reported that Ingles took part in practices with the Bucks' G League affiliate during his return-to-play work.
   - Source metadata: same ESPN original, author, publication/access dates, medium, and tier as `joe-ingles-acl-2022-treatment-d18-01`; the canonical projection must repeat the complete citation.
   - Scope: only the actual practices are retained; no clearance, duration, prognosis, or return timing is inferred.

4. `joe-ingles-acl-2022-treatment-d18-03`
   - Kind / fact date / first governed appearance: `treatment` / `null` / treatment R2.
   - Atomic proposition: in a Trail Blazers-published Q&A, Ingles said Portland had arranged his physical therapy so that he could remain in Utah for rehabilitation.
   - Canonical/final URL: `https://www.nba.com/blazers/forwardcenter/joe-ingles-discusses-trade-playing-lillard-and-what-he-feels-he-owes-trail-blazers`
   - Title: `Joe Ingles Discusses The Trade, Playing With Lillard And What He Feels He Owes The Trail Blazers`
   - Publisher/account: `Portland Trail Blazers` / `Casey Holdahl`
   - Published/accessed: `2022-03-09` / `2026-08-15`
   - Medium/tier: `web-article` / `team-or-league-official`.
   - Atomicity: the item is the single linked action “Portland arranged PT in support of his Utah-based rehab”; it is not split into duplicate PT and location items.

5. `joe-ingles-acl-2022-treatment-d18-04`
   - Kind / fact date / first governed appearance: `treatment` / `null` / treatment R2.
   - Atomic proposition: the Utah Jazz reported that Ingles had begun knee pre-rehabilitation exercises at the team's practice facility with Erik Phillips.
   - Canonical/final URL: `https://www.nba.com/jazz/news/im-very-confident-joe-ingles-knows-hell-be-back-court`
   - Title: `“I’m Very Confident" | Joe Ingles Knows He'll Be Back On The Court`
   - Publisher/account: `Utah Jazz` / `Ryan Kostecka`
   - Published/accessed: `2022-02-04` (`2022-02-04T19:16:00Z` in original JSON-LD) / `2026-08-15`
   - Medium/tier: `web-article` / `team-or-league-official`.

## Exact initial scaffold queries actually issued

### surgery

1. `Joe Ingles Utah Jazz ACL 2021-22 injury operated procedure reconstruction repair surgeon doctor operating physician surgery underwent official team newsroom`
2. `Joe Ingles Utah Jazz ACL 2021-22 surgery operated procedure reconstruction repair surgeon doctor operating physician surgery underwent site:nba.com/news official announcement`
3. `Joe Ingles Utah Jazz ACL 2021-22 rehab operated procedure reconstruction repair surgeon doctor operating physician surgery underwent site:official.nba.com injury report`
4. `return 2021-22 ACL Utah Jazz Joe Ingles operated procedure reconstruction repair surgeon doctor operating physician surgery underwent site:nba.com/game box score`
5. `injury 2021-22 ACL Utah Jazz Joe Ingles operated procedure reconstruction repair surgeon doctor operating physician surgery underwent press conference official statement`
6. `surgery 2021-22 ACL Utah Jazz Joe Ingles operated procedure reconstruction repair surgeon doctor operating physician surgery underwent Associated Press ESPN Reuters original report`

### treatment

1. `Joe Ingles Utah Jazz ACL 2021-22 injury cleared management program progression recovery rehab treatment official team newsroom`
2. `Joe Ingles Utah Jazz ACL 2021-22 surgery cleared management program progression recovery rehab treatment site:nba.com/news official announcement`
3. `Joe Ingles Utah Jazz ACL 2021-22 rehab cleared management program progression recovery rehab treatment site:official.nba.com injury report`
4. `return 2021-22 ACL Utah Jazz Joe Ingles cleared management program progression recovery rehab treatment site:nba.com/game box score`
5. `injury 2021-22 ACL Utah Jazz Joe Ingles cleared management program progression recovery rehab treatment press conference official statement`
6. `surgery 2021-22 ACL Utah Jazz Joe Ingles cleared management program progression recovery rehab treatment Associated Press ESPN Reuters original report`

### injection

1. `Joe Ingles Utah Jazz ACL 2021-22 injury corticosteroid cortisone injection needling platelet-rich plasma PRP shot official team newsroom`
2. `Joe Ingles Utah Jazz ACL 2021-22 surgery corticosteroid cortisone injection needling platelet-rich plasma PRP shot site:nba.com/news official announcement`
3. `Joe Ingles Utah Jazz ACL 2021-22 rehab corticosteroid cortisone injection needling platelet-rich plasma PRP shot site:official.nba.com injury report`
4. `return 2021-22 ACL Utah Jazz Joe Ingles corticosteroid cortisone injection needling platelet-rich plasma PRP shot site:nba.com/game box score`
5. `injury 2021-22 ACL Utah Jazz Joe Ingles corticosteroid cortisone injection needling platelet-rich plasma PRP shot press conference official statement`
6. `surgery 2021-22 ACL Utah Jazz Joe Ingles corticosteroid cortisone injection needling platelet-rich plasma PRP shot Associated Press ESPN Reuters original report`

### actual-return

1. `Joe Ingles Utah Jazz ACL 2021-22 injury activated cleared to play debut first game back return returned official team newsroom`
2. `Joe Ingles Utah Jazz ACL 2021-22 surgery activated cleared to play debut first game back return returned site:nba.com/news official announcement`
3. `Joe Ingles Utah Jazz ACL 2021-22 rehab activated cleared to play debut first game back return returned site:official.nba.com injury report`
4. `return 2021-22 ACL Utah Jazz Joe Ingles activated cleared to play debut first game back return returned site:nba.com/game box score`
5. `injury 2021-22 ACL Utah Jazz Joe Ingles activated cleared to play debut first game back return returned press conference official statement`
6. `surgery 2021-22 ACL Utah Jazz Joe Ingles activated cleared to play debut first game back return returned Associated Press ESPN Reuters original report`

## Preliminary discovery query log — not eligible for formal ledger

These exact strings located leads, but none may be serialized as a governed round query because each lacks at least one required case-context or declared-timepoint term. Their snippets were never evidence.

### Named-surgeon discovery

- `JI-SX-01`: `"Joe Ingles" "Dr. Brian Cole" ACL reconstruction Midwest Orthopaedics at Rush 2022`
- `JI-SX-02`: `site:midwestortho.com Joe Ingles Brian Cole ACL 2022`
- `JI-SX-03`: `site:rushortho.com Joe Ingles Brian Cole surgery 2022`
- `JI-SX-04`: `site:nba.com "Joe Ingles" "Brian Cole" reconstruction`
- `JI-SX-05`: `"Joe Ingles" "Brian Cole" ACL reconstruction Munster Indiana February 23 2022 surgeon official`
- `JI-SX-06`: `site:nba.com/jazz "Joe Ingles" surgeon "Brian Cole" surgery`

### Treatment discovery

- `JI-TX-01`: `site:nba.com/bucks/news "Joe Ingles" rehab cleared practice November December 2022 ACL`
- `JI-TX-02`: `site:nba.com/bucks "Joe Ingles" "full practice" ACL recovery`
- `JI-TX-03`: `site:nba.com/bucks "Joe Ingles" rehab recovery return December 2022`
- `JI-TX-04`: `Joe Ingles ACL rehab progression cleared practice December 2022 Associated Press ESPN original`
- `JI-TX-05`: `site:nba.com/bucks Joe Ingles 5-on-5 workout December 2022 G League practice`
- `JI-TX-06`: `site:nba.com/bucks/news Joe Ingles Wisconsin Herd rehab practice December 2022`
- `JI-TX-07`: `site:gleague.nba.com Joe Ingles practice ACL December 2022`
- `JI-TX-08`: `site:nba.com/news Joe Ingles G League affiliate final 5-on-5 workout ACL`
- `JI-TX-09`: `site:nba.com/blazers Joe Ingles surgery rehab progression "two weeks post" 2022`
- `JI-TX-10`: `site:nba.com/bucks Joe Ingles ACL rehabilitation press conference December 2022 transcript`
- `JI-TX-11`: `Joe Ingles ACL rehabilitation workout December 2022 Reuters Associated Press original`
- `JI-TX-12`: `site:nba.com/news Joe Ingles ACL cleared return-to-play progression December 2022`
- `JI-TX-13`: `site:nba.com/blazers Joe Ingles rehab update ACL May June 2022 Portland physical therapy`
- `JI-TX-14`: `site:nba.com/bucks Joe Ingles media day rehab September 2022 ACL transcript`
- `JI-TX-15`: `site:nba.com/bucks Joe Ingles practice rehabilitation November 2022 official`
- `JI-TX-16`: `site:official.nba.com injury report Joe Ingles ACL surgery December 2022 Milwaukee`
- `JI-TX-17`: `Joe Ingles ACL rehab return December 2022 Associated Press original treatment progression`
- `JI-TX-18`: `site:nba.com/bucks/news Joe Ingles return rehab workout December 2022`
- `JI-TX-19`: `site:nba.com/blazers/news Joe Ingles ACL physical therapy rehab 2022`
- `JI-TX-20`: `site:nba.com/game Joe Ingles first game back rehabilitation 2022 official box score`
- `JI-TX-21`: `"Joe Ingles" "Brian Cole" ACL reconstruction Munster Indiana February 23 2022 surgeon official`
- `JI-TX-22`: `site:nba.com/jazz "Joe Ingles" surgeon "Brian Cole" surgery`
- `JI-TX-23`: `"Joe Ingles" "range of motion" ACL rehabilitation February 2022 original`
- `JI-TX-24`: `site:nba.com/blazers "Joe Ingles" "range of motion" rehab`
- `JI-TX-25`: `Joe Ingles ACL rehabilitation physical therapy Utah March 2022 interview range of motion original`
- `JI-TX-26`: `site:nba.com/blazers Joe Ingles rehabilitation Utah physical therapy March 2022 official interview`
- `JI-TX-27`: `site:nba.com/jazz Joe Ingles ACL pre-rehabilitation knee exercises Erik Phillips February 2022`
- `JI-TX-28`: `Joe Ingles pre-rehab knee exercises February 2022 Ryan Kostecka original`
- `JI-TX-29`: `Joe Ingles ACL rehab program progress cleared November 2022 Bucks original press conference`
- `JI-TX-30`: `site:nba.com/bucks Joe Ingles rehab program G League 5-on-5 December 2022 original`

### Actual-return discovery

- `JI-ARX-01`: `site:nba.com/game Joe Ingles Dec 19 2022 Bucks Pelicans 0022200457 box score`
- `JI-ARX-02`: `site:nba.com/bucks/game/0022200457 Joe Ingles Dec 19 2022`
- `JI-ARX-03`: `site:nba.com "Joe Ingles made season debut" "Dec. 19, 2022"`
- `JI-ARX-04`: `site:nba.com/bucks Joe Ingles returned December 19 2022 official`

## Governed formal supplemental queries actually issued

| Query ID                                | Exact query                                                                                                                                   | Declared channel / timepoint / sorted concepts                                                                        | Original-page result                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `joe-surgery-formal-zero-1`             | `Joe Ingles Utah Jazz ACL 2021-22 surgery procedure surgeon Brian Cole Munster Indiana named mainstream original`                             | `named-mainstream-original-page` / `operation-announcement` / `[procedure, surgeon-name-branch]`; name `[Brian Cole]` | Same surgeon/procedure proposition or downstream repetition; no new surgery fact.                                                |
| `joe-surgery-formal-zero-2`             | `Joe Ingles Utah Jazz ACL 2021-22 rehabilitation Portland Trail Blazers operated underwent Brian Cole official team newsroom`                 | `team-official-site-newsroom` / `rehabilitation-progression` / `[operated, underwent]`; name `[Brian Cole]`           | Same official surgery proposition; no new procedure, date, person, or location fact.                                             |
| `joe-treatment-formal-delta-mainstream` | `Joe Ingles Utah Jazz ACL 2021-22 rehabilitation progression Milwaukee Bucks final 5-on-5 G League practice ESPN Adrian Wojnarowski original` | `named-mainstream-original-page` / `rehabilitation-progression` / `[progression, rehab]`                              | Direct HTTPS reopened the ESPN original; retained completed 5-on-5 and actual G League practices as two non-duplicative actions. |
| `joe-treatment-formal-delta-portland`   | `Joe Ingles Utah Jazz ACL 2021-22 surgery treatment management Portland Trail Blazers physical therapy rehab Utah official Q&A`               | `team-official-site-newsroom` / `operation-announcement` / `[management, treatment]`                                  | Direct HTTPS reopened the official Q&A; retained Portland's completed PT arrangement supporting rehab in Utah.                   |
| `joe-treatment-formal-delta-jazz`       | `Joe Ingles Utah Jazz ACL 2021-22 injury pre-rehab knee exercises Erik Phillips official team newsroom`                                       | `team-official-site-newsroom` / `injury-time` / `[rehab]`                                                             | Direct HTTPS reopened the Jazz original; retained actual pre-rehab knee exercises with Erik Phillips.                            |
| `joe-treatment-formal-zero-1`           | `Joe Ingles Utah Jazz ACL 2021-22 rehabilitation recovery management Milwaukee Bucks site:official.nba.com injury report`                     | `nba-official-injury-reports` / `rehabilitation-progression` / `[management, recovery]`                               | Status material added no distinct performed treatment action.                                                                    |
| `joe-treatment-formal-zero-2`           | `Joe Ingles Utah Jazz ACL 2021-22 return Milwaukee Bucks cleared progression press conference official statement December 2022`               | `press-conference-formal-statement` / `actual-return` / `[cleared, progression]`                                      | No new source-explicit performed treatment action; return timing and clearance implications were excluded.                       |

## Governed round ledger and stopping proof

| Category      | Round (UTC)                  | Governed queries                             | Open-original result and checked boundary                                                                                                                                              | `qualifiedFactDeltas[]`                                                                                                                                                                                                                                                        |
| ------------- | ---------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| surgery       | R1 (`13:19:37Z`–`13:22:24Z`) | scaffold slots 1–6                           | Reopened the exact D17 official release, retained the baseline unchanged, and added only the source-explicit surgeon identity, Brian Cole.                                             | `[{itemId: joe-ingles-acl-2022-surgery-d18-01, changeType: added}]`                                                                                                                                                                                                            |
| surgery       | R2 (`13:45:44Z`–`13:45:46Z`) | `joe-surgery-formal-zero-1`                  | Name-derived mainstream/original formulation returned the same proposition or no qualifying original.                                                                                  | `[]`                                                                                                                                                                                                                                                                           |
| surgery       | R3 (`13:45:49Z`–`13:45:51Z`) | `joe-surgery-formal-zero-2`                  | Different team/newsroom and rehab-timepoint name formulation returned the same proposition or no candidate.                                                                            | `[]`                                                                                                                                                                                                                                                                           |
| treatment     | R1 (`13:19:48Z`–`13:19:56Z`) | scaffold slots 1–6                           | Complete broad matrix produced no retained payload; snippets were not evidence.                                                                                                        | `[]`                                                                                                                                                                                                                                                                           |
| treatment     | R2 (`13:45:56Z`–`13:46:19Z`) | three `joe-treatment-formal-delta-*` queries | Reopened ESPN, Portland, and Utah originals by direct HTTPS. Four distinct performed actions survived the hard nba-v10 threshold.                                                      | `[{itemId: joe-ingles-acl-2022-treatment-d18-01, changeType: added}, {itemId: joe-ingles-acl-2022-treatment-d18-02, changeType: added}, {itemId: joe-ingles-acl-2022-treatment-d18-03, changeType: added}, {itemId: joe-ingles-acl-2022-treatment-d18-04, changeType: added}]` |
| treatment     | R3 (`13:46:29Z`–`13:46:35Z`) | `joe-treatment-formal-zero-1`                | No additional source-explicit performed intervention/action survived.                                                                                                                  | `[]`                                                                                                                                                                                                                                                                           |
| treatment     | R4 (`13:46:39Z`–`13:46:41Z`) | `joe-treatment-formal-zero-2`                | No additional source-explicit performed intervention/action survived.                                                                                                                  | `[]`                                                                                                                                                                                                                                                                           |
| injection     | R1 (`13:19:59Z`–`13:20:01Z`) | scaffold slots 1–4                           | No Joe Ingles event candidate documented injection, shot, PRP, platelet-rich plasma, cortisone, corticosteroid, or needling.                                                           | `[]`                                                                                                                                                                                                                                                                           |
| injection     | R2 (`13:20:05Z`–`13:20:07Z`) | scaffold slots 5–6                           | No qualifying original-page candidate and no material unresolved access failure.                                                                                                       | `[]`                                                                                                                                                                                                                                                                           |
| actual-return | R1 (`13:20:05Z`–`13:20:07Z`) | scaffold slots 1–2                           | No new occurred-return event; target or scheduled-return language was ineligible.                                                                                                      | `[]`                                                                                                                                                                                                                                                                           |
| actual-return | R2 (`13:20:11Z`–`13:40:00Z`) | scaffold slots 3–6                           | Reopened the exact D17 canonical Bucks URL, followed its 307 to the exact D17 final URL, and checked the official NBA game equivalent. The 2022-12-19 baseline was retained unchanged. | `[]`                                                                                                                                                                                                                                                                           |

Each audit unit uses every scaffold plan slot exactly once. The complete scaffold matrix supplies all six source channels, all four timepoints, and the full category synonym set. Surgery R1's delta is followed by the two distinct governed name-branch zero rounds R2/R3. Treatment R2's final deltas are followed by the distinct governed zero rounds R3/R4. Injection and actual-return each end with two distinct zero-delta rounds. No preliminary query is counted toward formal coverage or exhaustion.

## Opened source inventory and baseline revalidation

### D17 baselines reopened and retained unchanged

- `joe-ingles-acl-2022-surgery-01` — `https://www.nba.com/news/joe-ingles-undergoes-successful-knee-surgery-to-repair-torn-acl`; `Joe Ingles undergoes successful knee surgery to repair torn ACL`; NBA.com / Official release; published `2022-02-24`; freshly accessed `2026-08-15`; `team-or-league-official`. The body says ACL reconstruction and names Brian Cole; D17's supported surgery proposition and source identity were not rewritten.
- `joe-ingles-acl-2022-actual-return-01` — canonical `https://www.nba.com/bucks/game/0022200457`, exact final `https://www.nba.com/bucks/game/0022200457-bucks-vs-pelicans-new-orleans-la-12-19-2022`; `Milwaukee Bucks vs New Orleans Pelicans Dec 19, 2022 Game Details`; Milwaukee Bucks; event/publication date `2022-12-19`; freshly accessed `2026-08-15`; `team-or-league-official`. Direct HTTPS returned `307` to the exact D17 final URL and `200` there. The official game-ID equivalent `https://www.nba.com/game/MIL-vs-NOP-0022200457` records the same participation.

### Additional opened originals and dispositions

- `https://www.espn.com/nba/story/_/id/35273380/bucks-joe-ingles-make-return-acl-injury-monday` — retained-new source for completed 5-on-5 and actual G League practices. Direct HTTPS resolved the browser/JS rendering limitation.
- `https://www.nba.com/blazers/forwardcenter/joe-ingles-discusses-trade-playing-lillard-and-what-he-feels-he-owes-trail-blazers` — retained-new official Q&A for the already-arranged PT supporting Utah-based rehab.
- `https://www.nba.com/jazz/news/im-very-confident-joe-ingles-knows-hell-be-back-court` — retained-new official source for performed pre-rehab knee exercises; direct HTTPS exposed the original article payload.
- `https://abcnews.com/Sports/sources-utah-jazz-forward-joe-ingles-lost-season/story?id=82585403` and `https://www.deseret.com/2022/2/23/22948463/joe-ingles-undergoes-successful-surgery-to-repair-acl-portland-trail-blazers-utah-jazz/` — opened, but the range-of-motion-before-surgery material is a future criterion, not a completed intervention; rejected.
- `https://www.nba.com/blazers/news/2022/2/23/joe-ingles-undergoes-succesful-knee-surgery` — official corroboration for the D17 release and Brian Cole detail.
- `https://www.nba.com/jazz/news/joe-ingles-injury-update` — diagnosis/future-surgery update only; no additional performed controlled fact.
- NBA injury-report PDFs recording `Left Knee; ACL Surgery` were corroborative status records only.

## Hard-threshold rejections, name branch, and empty boundary

- Deleted from the retained set: ESPN's “nearly 10 months” rehabilitation duration; the Portland Q&A's general “progressing more each day” outcome; and the report that surgery would wait for regained range of motion. Duration, outcome/general progress, and a future criterion are not source-explicit completed treatment actions under nba-v10.
- The official release's future “will begin rehabilitation” statement, projected recovery, future Portland travel/rehab, scheduled or targeted return, general ACL timelines, prognosis, and clearance implications were not retained.
- The Q&A statement that surgery found nothing unexpected was not a distinct procedure/finding item and would duplicate the supported reconstruction event.
- Search snippets, Reddit reposts, generic medical pages, and fan speculation were never evidence. All material original-page rendering limitations were resolved by direct HTTPS.
- No qualifying injection fact survived. Empty means only that none was found within the checked Jazz/Blazers/Bucks newsrooms, NBA announcements, available injury reports and game pages, formal statements/interviews, named-mainstream originals, and injury/operation/rehab/return timepoints.
- Proposed final counts: surgery `1 → 2`, treatment `0 → 4`, injection `0 → 0`, actual-return `1 → 1`. Across seven retained items: official `5`, mainstream `2`, unverified `0`; actual-return count `1`.
