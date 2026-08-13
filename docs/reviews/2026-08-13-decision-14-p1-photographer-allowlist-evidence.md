# Decision 14 Phase 1 photographer allowlist evidence

- Date checked: 2026-08-13
- Scope: `decision-14-lowrisk-photographer-covers-only`
- Input commit: `fec02fa32d2b86e9124aa11c98b51fccea5c121c`
- Checker: `decision-14-photo-review`
- Release state: private medical review; public release and indexing remain closed
- Result: **the named photographer allowlist is empty**

This report freezes the evidence-first Phase 1 result. No candidate is adopted,
no image is downloaded, and no current cover changes here. A rejected or
unresolved result is not an allegation against a photographer: it means only
that the unusually strict, conjunctive Decision 14 record could not truthfully
mark every required field as passed. No unresolved field was waived.

## Governing test and owner risk boundary

An allowlist record needs all of the following at once: a verified individual
and controlled Flickr or Commons account; photographer-owned self-publication;
at least three complete years and 50 reproducibly enumerated self-published
sports works; a license-independent, date-stratified deterministic sample of at
least 30 with 100% one exact CC token and zero unexplained deviations; a fixed
Commons/Wikipedia reuse chain spanning at least 24 months with no located
authorship, license, removal, or takedown dispute under the bounded search; and
separate passes for all five washing checks. `FAIL` or `UNRESOLVED` on any term
forces rejection. `NT` below means not tested after an earlier fatal result; it
is never a pass.

Owner 吳易澄醫師 separately accepted the bounded credentialed-access risk in
`../.claude/g2-owner-decisions.md`, heading
`Decision 14 — 放寬為具名低風險攝影者的賽場封面照`. That acceptance would
require every adopted allowlisted event photo to retain
`credentialed-access-residual-risk`; it is not copyright, personality-rights,
legal-use, medical, public-release, or zero-risk clearance. Because this phase
produced no allowlist entry, the acceptance does not make any event candidate
eligible.

## Complete fixed-query discovery

All six predeclared strings were instantiated for each of the exact 16 target
athletes before the allowlist was frozen:

```text
Commons API namespace 6: intitle:"<athlete>"
site:commons.wikimedia.org/wiki/File "<athlete>" "media day"
site:commons.wikimedia.org/wiki/File "<athlete>" "press conference"
site:commons.wikimedia.org/wiki/File "<athlete>" (parade OR award OR fan OR "public event")
site:commons.wikimedia.org/wiki/File "<athlete>" (preseason OR warm-up OR warmup)
site:flickr.com/photos "<athlete>" ("media day" OR parade OR "public event" OR game OR warm-up)
```

The canonical lead snapshot records all 96 instantiated strings and all 486
current Commons namespace-6 `intitle` results. The fixed web queries were used
to inspect candidates whose Commons titles omit or concatenate the player name,
including `File:AnferneeSimons (cropped).jpg` (oldid `827612495`) and Moritz
Wagner in Sandro Halank's preparation-match file (oldid `967382118`). Decision
13's complete rejection ledger was also reopened as prior evidence. No search
result was treated as proof of identity, authorship, license, or occasion.

| Athlete           | Captured Commons rows |
| ----------------- | --------------------: |
| Anfernee Simons   |                     3 |
| Anthony Edwards   |                    25 |
| Brandon Clarke    |                     2 |
| Damian Lillard    |                    52 |
| Danny Green       |                    96 |
| Dejounte Murray   |                     5 |
| Ja Morant         |                    29 |
| Jayson Tatum      |                    32 |
| Joe Ingles        |                     3 |
| LaMelo Ball       |                    45 |
| Markelle Fultz    |                    14 |
| Moritz Wagner     |                    13 |
| Ricky Rubio       |                    78 |
| Thomas Bryant     |                    23 |
| Trae Young        |                    58 |
| Tyrese Haliburton |                     8 |

The 486 rows resolve to 37 canonical athlete-connected creator/account groups
plus 115 clear namesake/lexical-collision rows. Christopher Johnson and the
`globalite` handle are one person/account and are not double-counted. Sandro
Halank is the one additional
connected maker found through the fixed web queries because the relevant file
title does not contain “Moritz Wagner.” Three internal false joins were also
removed: Erik Drost file pageid `40006117` joins the football names Joe Thomas
and Armonty Bryant rather than basketball player Thomas Bryant; TonyTheTiger
pageid `39567527` has a title/description identity conflict; and FIRST TEAM
pageid `188639318` is a Zaccharie Risacher interview that only mentions Trae
Young.

The snapshot deliberately keeps image-upload time under
`commonsCurrentOriginal.timestamp` and independently retrieves the current page
revision's user/time under `fixedRevision.user` and
`fixedRevision.timestamp`. The capture was regenerated after detecting that
those two clocks cannot be interchanged.

### Frozen machine evidence

| Evidence                                                                           | SHA-256                                                            | Role                                                              |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `docs/reviews/evidence/decision-14/p1/commons-fixed-query-leads.v1.json`           | `2690dfad9670db50c28674fdce2d3d17f2770c8ea684e33489b666f2c697ae1f` | 16/16 fixed-query lead population, fixed revisions, source facts  |
| `docs/reviews/evidence/decision-14/p1/erik-drost-original-account-sample.v1.json`  | `acdc696c9809d9c464b7ba67f5ffc82c513a116558abb3bce12143f0343f0c77` | license-blind target-connected original-account sample            |
| `docs/reviews/evidence/decision-14/p1/sandro-halank-direct-commons-sample.v1.json` | `afd975e7186ea38ac3f16c127411987dc33e773d59ed08c35c6ed273ffb35b4a` | license-blind direct-upload strata and exact-license observations |

## Final allowlist

There are **zero entries**. Consequently policy v7 must contain an empty named
allowlist and preserve v6's non-event rule for every photographer. This is an
evidence-supported result; Decision 14 sets no minimum replacement count.

## Full-gate reviews

### Erik Drost — rejected: located licensing/removal and washing signal

Flickr profile `https://www.flickr.com/people/edrost88/` binds real/display
name Erik Drost, username `EDrost88`, path alias `edrost88`, NSID
`62091376@N03`, and account creation `2011-04-24T09:34:27Z`; independent
`https://www.clevescene.com/arts/35-cleveland-photographers-you-should-be-following-on-instagram-38344544/`
and
`https://clevelandmagazine.com/articles/3-northeast-ohio-photographers-share-why-cleveland-is-their-muse/`
profiles corroborate the public person and handle. A license-blind account
search corpus used three exact Flickr
Search URLs, owner `62091376@N03`, tag `football`, ascending capture time, and
fixed 2015/2018/2022 bounds. It retained the first server-ordered 25 results per
stratum (75 unique works; reported stratum totals 1490/1467/1725), then selected
ten per year by the lowest SHA-256 of
`decision14-erik-drost-flickr-direct-sports-sample-v1\n<year>\n<ID>` before
reading licenses. All 75 originals bound the same account/person and exact CC
BY 2.0; all 30 sampled originals were CC BY 2.0 and their photographer-owned
main, `/meta/`, and `/sizes/` endpoints returned successfully. The frozen
target-connected diagnostic independently enumerates 187 unique exact
`/photos/edrost88/<numeric-id>/` originals and also yields a license-independent
30/30 CC BY 2.0 sample.

The reuse floor passes: Flickr work
`https://www.flickr.com/photos/edrost88/51402833505/`, Commons source oldid
`682745826`, crop oldid `682745872`, and English Wikipedia Baker Mayfield
adoption oldid `1104628298` through checked oldid `1368821287` evidence 47
complete months of use. Four series checks pass on photographer-hosted
evidence: D7200/D500/Z9 EXIF families, coherent native-resolution families,
plausible Cleveland/Mentor time-location clusters, and monotonic neighboring
image-number/time sequences.

The account still must be rejected. Fixed Commons deletion discussion
`https://commons.wikimedia.org/w/index.php?title=Commons%3ADeletion_requests%2FBenedictus_XVI_by_Erik_Drost_in_flixkr&oldid=291662567`
(raw SHA-256
`e54c782f171b7499ecb2aa06c796040053a624917998355fa4b0619b065cb609`)
lists ten CC-licensed Drost Flickr works and closes “Deleted: per nomination”
because the principal subject was video made by others. All ten upstream IDs
(`5986710001`, `5986710399`, `5986710609`, `5986710681`, `5986710755`,
`5986711083`, `5987267902`, `5987269300`, `5987269562`, `5987269974`)
remain on the account with current CC BY 2.0. This is a located removal/license
dispute and an account-compilation/repost washing signal. A second deletion
discussion, oldid `340109636`, concerns only low quality/redundancy and is not a
rights finding. A supplemental fixed FlickreviewR chain for Flickr
`19623426264` shows CC BY 2.0 at Commons oldid `262945829` but the current
Flickr page is All Rights Reserved; it is recorded as later relicensing, not
hidden or used in the license-blind sample.

The primary direct-search ledger is frozen here in returned server order so
the stated corpus and hash sample can be recomputed without relying on a future
search result order:

- 2015 (25): `16531847934`, `16534114673`, `16534121613`, `16534124483`,
  `16534129443`, `16946845377`, `16946861227`, `16966437168`, `16966475358`,
  `16966728480`, `16966765390`, `16968063439`, `16968099969`, `16968103019`,
  `16968122979`, `17128300456`, `17128337146`, `17128340116`, `17152677612`,
  `17152697172`, `17153589691`, `17153595031`, `17153602511`, `17153625281`,
  `17154225335`.
- 2018 (25): `24690706247`, `25687690058`, `27781497499`, `27781509149`,
  `38662025645`, `38662031955`, `39528613612`, `39528619752`, `39528627672`,
  `39528753182`, `39528772072`, `39528785212`, `39528796822`, `39528864742`,
  `39528887352`, `39557852391`, `39558161721`, `39558172441`, `39558179511`,
  `39558187931`, `39558226391`, `39558292041`, `39558297681`, `39558303911`,
  `39558347641`.
- 2022 (25): `51830996092`, `51831937526`, `51831940516`, `51913477177`,
  `51913481132`, `51913482012`, `51914442901`, `51914536098`, `51914538508`,
  `51914545816`, `51914624768`, `51914636943`, `51914763069`, `51914764844`,
  `51914765459`, `51914766964`, `51914991755`, `51914999320`, `51915028805`,
  `51915145040`, `51915162700`, `51915189690`, `51915190795`, `51915223900`,
  `51915230330`.
- Hash-selected 2015 sample: `16966437168`, `17128337146`, `16946845377`,
  `16966475358`, `17128300456`, `16968063439`, `16946861227`, `17153625281`,
  `16534121613`, `17153595031`.
- Hash-selected 2018 sample: `39528864742`, `39528772072`, `39558187931`,
  `39558292041`, `39558161721`, `39558303911`, `39558297681`, `38662025645`,
  `39558347641`, `39528796822`.
- Hash-selected 2022 sample: `51831937526`, `51914624768`, `51914538508`,
  `51914766964`, `51914991755`, `51914636943`, `51831940516`, `51915162700`,
  `51830996092`, `51914763069`.

For every ledger ID the evidence URL is
`https://www.flickr.com/photos/edrost88/<ID>/`; the sampled metadata and native
size endpoints append `/meta/?lang=en-us` and `/sizes/?lang=en-us`. The exact
searches were:

- `https://www.flickr.com/search/?user_id=62091376%40N03&tags=football&sort=date-taken-asc&min_taken_date=2015-01-01&max_taken_date=2015-12-31`
- `https://www.flickr.com/search/?user_id=62091376%40N03&tags=football&sort=date-taken-asc&min_taken_date=2018-01-01&max_taken_date=2018-12-31`
- `https://www.flickr.com/search/?user_id=62091376%40N03&tags=football&sort=date-taken-asc&min_taken_date=2022-01-01&max_taken_date=2022-12-31`

| Gate                                       | Result | Reproducible basis                                                               |
| ------------------------------------------ | ------ | -------------------------------------------------------------------------------- |
| Individual identity/account control        | PASS   | NSID `62091376@N03`, exact handle/name profile and independent profiles          |
| Photographer-owned self-publication        | PASS   | 75/75 exact owner/path joins; Commons importers not used as identity evidence    |
| >=3 years / >=50 sports works              | PASS   | 2015-04-14 through 2022-02-18; 75-work primary ledger                            |
| Deterministic >=30 exact-token sample      | PASS   | 30/30 `cc-by-2.0`, zero deviations                                               |
| Fixed reuse >=24 months                    | PASS   | Baker Mayfield Commons/enwiki chain, 47 complete months                          |
| Bounded dispute/removal search             | FAIL   | Pope-video deletion oldid `291662567` is located                                 |
| EXIF / resolution / time-location / series | PASS   | four separately checked photographer-hosted series signals                       |
| Compilation/repost behavior                | FAIL   | ten account works removed because the principal content was video made by others |
| Final                                      | REJECT | Any dispute or washing failure is fatal; no owner waiver exists                  |

### Sandro Halank — rejected: exact-license history mismatch

Commons userid `5397149` (registered 2015-11-07) and global id `44364963`
bind the named account; fixed Commons user oldid `1184734575` and Meta oldid
`27195030` corroborate the same public identity. The relevant Moritz Wagner
candidate is direct self-photographed work, fixed oldid `967382118`, CC BY-SA
4.0. The predeclared capture opened exact `Special:ListFiles` account strata at
2016, 2022, and 2025 year-end offsets, retained the first 50 sports-lexicon
matches per listing, and chose ten evenly spaced positions per stratum without
using license. The 30 observed tokens are 10 `cc-by-sa-3.0` and 20
`cc-by-sa-4.0`; no single exact token can reach 30/30. The evidence capture also
honestly retains one false-positive 2016 title, Georg Pazderski, because the
original regex matched the “ski” suffix. This reduces the plainly sports
sample to 29 and is an independent sample-quality failure; it was not repaired
after looking at outcomes.

A reuse diagnostic passes: Commons pageid `122647358`, initial oldid
`686613121` on 2022-09-04 and checked oldid `1145207848`, plus English
Wikipedia Jan Behrendt use from oldid `1108481921` through `1290682439`, spans
more than 32 months. Unrelated removals involving packaging/freedom-of-panorama
mean a blanket accountwide “none located” claim was not made. Washing checks
were not completed after the fatal exact-license mismatch.

| Gate                                  | Result | Reproducible basis                                                          |
| ------------------------------------- | ------ | --------------------------------------------------------------------------- |
| Individual identity/account control   | PASS   | exact Commons/global IDs and fixed self-identification pages                |
| Photographer-owned self-publication   | PASS   | direct account uploads marked self-photographed                             |
| >=3 years / >=50 sports works         | PASS   | 2016–2025 strata; 129 plainly sports rows even after false-positive removal |
| Deterministic >=30 exact-token sample | FAIL   | 10 BY-SA 3.0 plus 20 BY-SA 4.0; only 29 plainly sports rows                 |
| Fixed reuse >=24 months               | PASS   | Commons/enwiki diagnostic exceeds 32 months                                 |
| Dispute and five washing checks       | NT     | stopped after fatal history/sample result                                   |
| Final                                 | REJECT | historical version migration cannot be waived                               |

### Chensiyuan — rejected: exact-license history mismatch

Commons account `Chensiyuan`, userid `89808`, registered
`2006-11-27T07:05:48Z`, global id `20089`, and fixed Commons user oldid
`162602435` link to the long-lived English Wikipedia account (userid `292299`,
checked oldid `1368945643`). Direct-own sports file
`File:Washington wizards toronto raptors.JPG`, pageid `1897689`, fixed oldid
`1128004770`, carries exact CC BY-SA 3.0. The direct-own Danny Green candidate
(oldid `827695982`) and Tyrese Haliburton candidate (oldid `1231557610`) carry
CC BY-SA 4.0. Therefore the same account's sports/candidate history cannot
match one expected exact token. A diagnostic all-upload scan saw 33 BY-SA 3.0,
136 BY-SA 4.0, and one CC0 sports-like row, but it was not a predeclared blind
sample and is not presented as one. Downstream gates stopped after the fatal
history finding.

| Gate                                | Result     | Reproducible basis                                     |
| ----------------------------------- | ---------- | ------------------------------------------------------ |
| Stable individual account           | PASS       | exact Commons/global/enwiki account chain              |
| Photographer-owned self-publication | PASS       | fixed direct-own uploads by same account               |
| >=3 years                           | PASS       | direct sports works from 2007 through 2025             |
| >=50 / deterministic sample         | UNRESOLVED | no admissible predeclared 50/30 ledger was frozen      |
| One exact historical license token  | FAIL       | direct sports history contains BY-SA 3.0 and BY-SA 4.0 |
| Reuse/dispute/five washing checks   | NT         | stopped after fatal exact-token result                 |
| Final                               | REJECT     | historical mismatch is independently fatal             |

### TonyTheTiger — rejected: exact-license history mismatch

The fixed lead corpus contains 57 direct Commons own-work sports rows for six
target athletes from 2014 through 2017. Three 2014 Ricky Rubio rows (pageids
`30541865`, `30541866`, `30541867`) carry CC BY-SA 3.0; 54 later rows carry CC
BY-SA 4.0. Representative direct-own fixed revisions are oldid `1178701454`
for the earliest Ricky row and oldid `959484249` for the latest Trae row. The
public name Antonio Vernon can be corroborated from the account's older own
work, but a deterministic one-token historical record cannot truthfully cover
the frozen body. Closed-practice pages `39828673` and `39828680` would also be
per-file ineligible regardless of allowlist status. Downstream reuse, dispute,
and washing work stopped after the fatal exact-version finding.

| Gate                                | Result     | Reproducible basis                             |
| ----------------------------------- | ---------- | ---------------------------------------------- |
| Individual identity/account control | PASS       | named direct Commons account corroboration     |
| Photographer-owned self-publication | PASS       | 57 direct own-work athlete-connected rows      |
| >=3 years / >=50 sports works       | PASS       | 2014-01-01 through 2017-03-29; 57 rows         |
| Deterministic 30-work sample        | UNRESOLVED | not frozen after visible historical mismatch   |
| One exact historical license token  | FAIL       | 3 BY-SA 3.0 plus 54 BY-SA 4.0                  |
| Reuse/dispute/five washing checks   | NT         | stopped after fatal exact-token result         |
| Final                               | REJECT     | same-account version mismatch cannot be waived |

### Frenchieinportland — rejected: individual identity unresolved

Eight direct Commons own-work leads connect Anfernee Simons, Damian Lillard,
Joe Ingles, and Ricky Rubio, but the exact Commons user page does not exist.
English Wikipedia user pageid `56721051`, oldid `1147589004`, contains only
userboxes and supplies no real/public maker identity. “Own work” and matching
uploader strings establish an account assertion, not the independent
individual-account control required by Decision 14. `S. Plaine`/Commons user
`Buff` is a different account and was not merged.

| Gate                                 | Result | Reproducible basis                                             |
| ------------------------------------ | ------ | -------------------------------------------------------------- |
| Individual identity/account control  | FAIL   | unbound pseudonym; missing Commons user page; no public name   |
| Account-level direct upload          | PASS   | exact Commons own-work uploads                                 |
| Required individual self-publication | FAIL   | account assertion cannot bind an independently verified person |
| Numeric/reuse/dispute/washing gates  | NT     | stopped after fatal identity result                            |
| Final                                | REJECT | uploader-to-photographer inference remains prohibited          |

### Joe Bielawa — rejected: deterministic license mismatch

Flickr NSID `88596146@N00`, aliases `/people/joebielawa/` and
`/photos/joebielawa/`, username/real name Joe Bielawa, and a first-person
`https://joebielawa.com/2012/06/` post linking the exact Flickr sports albums
support individual control and self-publication. Three unfiltered account-owned
sports albums enumerate 774 unique originals: 62 Twins/Oakland works, 666
Minnesota Lynx/Phoenix Mercury works, and 46 2015 Twins home-opener works,
spanning 2009-09-12 through 2015-04-13. The license-blind sample preserved each
album order and selected ten indices
`floor((i + 0.5) * N / 10)`. All ten 2009 and all ten 2012 rows are CC BY 2.0;
all ten 2015 rows are All Rights Reserved. Thus only 20/30 match the candidate
token, with ten deviations. A fixed Commons reuse diagnostic for Flickr
`7236915114` spans oldid `366532176` through crop oldid `1204069506` (79
complete months). The five washing checks were not completed after the fatal
license result; Flickr denied the candidate EXIF endpoint, so an EXIF pass
could not in any event be inferred.

The frozen 30 IDs are: 2009 `3913902155`, `3914677628`, `3913884757`,
`3913846243`, `3914615742`, `3914579330`, `3914563684`, `3913743009`,
`3913727717`, `3913678997`; 2012 `7467784330`, `7467850656`, `7467917646`,
`7467983242`, `7468041352`, `7468303356`, `7468369816`, `7468432178`,
`7468652906`, `7468725732`; and 2015 `17114609816`, `16954364459`,
`17139913961`, `16520382803`, `16952773838`, `16933151807`, `17140550405`,
`17139912391`, `17114607126`, `17140549545`. Each evidence URL is
`https://www.flickr.com/photos/joebielawa/<ID>/`.

| Gate                                  | Result | Reproducible basis                                            |
| ------------------------------------- | ------ | ------------------------------------------------------------- |
| Individual identity/account control   | PASS   | NSID/name fields plus independent exact-album blog            |
| Photographer-owned self-publication   | PASS   | exact account-owned originals                                 |
| >=3 years / >=50 sports works         | PASS   | 774 works, 2009-09-12 through 2015-04-13                      |
| Deterministic >=30 exact-token sample | FAIL   | 20 CC BY 2.0, 10 All Rights Reserved                          |
| Fixed reuse >=24 months               | PASS   | Commons crop chain spans 79 complete months                   |
| Dispute search                        | PASS   | none located under bounded named queries; not zero-risk proof |
| Five washing checks                   | NT     | stopped after fatal exact-token result                        |
| Final                                 | REJECT | 66.7% cannot meet the 100% floor                              |

## Connected-maker rejection ledger

The matrix below covers every other athlete-connected creator/account group.
`Identity` includes independent individual/account control; `Own` is an
allowed photographer-owned Flickr or direct-own Commons original; `History`
combines the 3-year/50-work/30-work exact-token floors; `Reuse` is the fixed
24-month chain; `D/W` is the bounded dispute plus five washing checks. Once an
earlier field is fatal, later expensive fields are `NT`.

|   # | Creator/account                    |  Identity  | Own  | History | Reuse | D/W | Disposition                                                                                                                 |
| --: | ---------------------------------- | :--------: | :--: | :-----: | :---: | :-: | --------------------------------------------------------------------------------------------------------------------------- |
|   1 | All-Pro Reels / Joe Glorioso       |    FAIL    |  NT  |   NT    |  NT   | NT  | Multi-person brand account cannot bind 24 brand credits and one Joe credit to one individual owner/maker.                   |
|   2 | CCS Pictures                       |    FAIL    |  NT  |   NT    |  NT   | NT  | Flickr `125545173@N06` is a multi-maker brand account with no candidate individual maker binding.                           |
|   3 | Gamecock Central / Katie Dugan     |    FAIL    |  NT  |   NT    |  NT   | NT  | Institutional account `100058519@N05` is not Katie Dugan's verified individual-owned account.                               |
|   4 | OSU Athletics / Courtney Bay       |    FAIL    |  NT  |   NT    |  NT   | NT  | Institutional account `51076693@N06` is not Courtney Bay's verified individual-owned account.                               |
|   5 | Fox Life Visuals / John L Fox V    | UNRESOLVED |  NT  |   NT    |  NT   | NT  | Social name clues do not independently bind the credited pseudonym, exact Commons account, work, and individual controller. |
|   6 | Boston Celtics                     |    FAIL    | FAIL |   NT    |  NT   | NT  | Organizational YouTube source and video-frame derivative, not photographer-owned original.                                  |
|   7 | FCBQ                               |    FAIL    | FAIL |   NT    |  NT   | NT  | Institutional Flickr plus Public Domain Mark rather than an exact eligible CC token.                                        |
|   8 | FIRST TEAM                         |    FAIL    | FAIL |   NT    |  NT   | NT  | Shared YouTube channel and Risacher interview, not a Trae photographic original.                                            |
|   9 | The White House                    |    FAIL    | FAIL |   NT    |  NT   | NT  | Institutional source; any ceremony image would need inherited v6 review, not the D14 event branch.                          |
|  10 | Marc Pendleton / Dayton Daily News | UNRESOLVED | FAIL |   NT    |  NT   | NT  | Twitter/newsroom chain is outside the allowed photographer-owned Flickr/direct Commons hosts.                               |
|  11 | Zack Samberg                       | UNRESOLVED | FAIL |   NT    |  NT   | NT  | Website/Twitter/VRTS and third-party Commons upload do not establish allowed self-publication.                              |
|  12 | Airman 1st Class Thomas Spangler   |    PASS    | FAIL |   NT    |  NT   | NT  | USAF institutional publication, not photographer-owned Flickr/direct Commons self-publication.                              |
|  13 | Shayla D. Hamilton                 |    PASS    | FAIL |   NT    |  NT   | NT  | Navy/DVIDS institutional publication; Commons importer is not maker authority.                                              |
|  14 | Amin Eshaiker / Amineshaker        |    FAIL    |  NT  |   NT    |  NT   | NT  | Missing/redlink account page supplies no independent maker/account-control binding; lead is also an interview.              |
|  15 | Bryan Berlin / Berlination         |    PASS    | PASS |  FAIL   |  NT   | NT  | First direct account upload is 2024-08-21, less than two years before review and below the 3-year floor.                    |
|  16 | Francesco1988                      |    FAIL    | FAIL |   NT    |  NT   | NT  | Autographed shirt is not the athlete; maker account is a redlink and uploader differs.                                      |
|  17 | Me (Io)                            |    FAIL    | FAIL |   NT    |  NT   | NT  | Unnamed maker, different uploader, no independently verified original chain.                                                |
|  18 | nikk_la / Lpdrew derivative        | UNRESOLVED | FAIL |   NT    |  NT   | NT  | A derivative cannot substitute for independent review of the nikk_la original account.                                      |
|  19 | Alexander Jonesi                   |    PASS    | PASS |  FAIL   |  NT   | NT  | Direct sports portfolios mix ARR and BY-SA 2.0; independent 30-row sports sample is 30/30 ARR.                              |
|  20 | Christopher Johnson / globalite    |    PASS    | PASS |  FAIL   |  NT   | NT  | Current candidate is ARR while Commons records BY-SA 2.0; a blind multi-year sample is only 10/30 BY-SA.                    |
|  21 | Clément Bardot                     |    PASS    | PASS |  FAIL   |  NT   | NT  | Exhaustive 477-upload account scan plus own galleries yield only 16 reproducible sports works, below 50.                    |
|  22 | Des Runyan                         |    PASS    | PASS |  FAIL   |  NT   | NT  | First 100 works in a 389-work account sports album split 50 BY 2.0 / 50 ARR.                                                |
|  23 | Fanacsp                            |    FAIL    | PASS |   NT    |  NT   | NT  | Direct Commons pseudonym/redlink is not an independently verified individual identity.                                      |
|  24 | Geoff Livingston                   |    PASS    | PASS |  FAIL   |  NT   | NT  | 153 works span >5 years, but blind sample is only 15/30 BY-SA 2.0 and includes BY-ND/BY-NC-SA/ARR.                          |
|  25 | Graham Hodges                      |    PASS    | PASS |  FAIL   |  NT   | NT  | 599 works span three strata, but blind sample is 0/30 BY 2.0 and 30/30 ARR.                                                 |
|  26 | James Schumacher                   |    PASS    | PASS |  FAIL   |  NT   | NT  | Strict reproducible sports metadata ledger finds one work/date, below the 50-work and 3-year floors.                        |
|  27 | Keith Allison                      |    PASS    | FAIL |  FAIL   |  NT   | NT  | Danny originals are unavailable; Tatum originals now ARR; current corpus is <3 years and sample 0/30 BY-SA.                 |
|  28 | Mark Tegethoff                     |    PASS    | PASS |  FAIL   |  NT   | NT  | Connected original is now ARR while fixed Commons records BY 2.0; candidate exact-token gate fails.                         |
|  29 | Mikalan Moiso                      |    PASS    | PASS |  FAIL   |  NT   | NT  | Original is now ARR vs Commons BY-SA 2.0, and reproducible sports work spans only 2010–2012.                                |
|  30 | Mogami Kariya                      |    PASS    | FAIL |  FAIL   |  NT   | NT  | Connected original is 404; current sports albums also visibly mix BY-SA 2.0, BY-SA 4.0, and ARR.                            |
|  31 | nikk_la                            |    FAIL    |  NT  |   NT    |  NT   | NT  | Pseudonymous account is not independently bound to a named individual.                                                      |
|  32 | Patrickpedia                       |    FAIL    | PASS |   NT    |  NT   | NT  | Direct Commons pseudonym is not bound to a verified named individual; occasion also lacks exact facts.                      |

### Evidence paragraphs for the ledger

Each numbered paragraph corresponds to the matrix row and records the first
decisive evidence; a later `NT` field is not silently treated as favorable.

1. **All-Pro Reels / Joe Glorioso.** Twenty-five rows span eight athletes and
   the exact Flickr people ID `10457902@N08`; 24 credit the brand while only
   pageid `116109125` names Joe Glorioso “via All Pro Reels.” The brand's public
   materials identify more than one founder, so an individual maker/account
   join fails the shared-account rule. The canonical profile is
   `https://www.flickr.com/people/joeglo/`; representative Joe-labeled original
   `https://www.flickr.com/photos/joeglo/51847435367/` cannot relabel the other
   brand-only works or make the LLC account individually owned.
2. **CCS Pictures.** Anthony Edwards pageid `99995360`, oldid `886011313`,
   points to Flickr `125545173@N06` credited only as CCS Pictures. No individual
   maker is supplied; the brand cannot be allowlisted as a person.
3. **Gamecock Central / Katie Dugan.** Pageid `88765836`, oldid `878769159`, credits institutional
   Flickr account `100058519@N05` while its description says “Photo by Katie
   Dugan.” Neither the account label nor Commons importer proves that Katie
   controls the original account.
4. **OSU Athletics / Courtney Bay.** Tyrese pageid `86240120`, oldid
   `1128893216`, credits Courtney Bay/OSU Athletics but points to institutional
   Flickr `51076693@N06`; this is exactly the shared-account ambiguity the
   contract forbids.
5. **Fox Life Visuals / John L Fox V.** LaMelo pageid `89982755`, oldid
   `732713909`, uses Commons account `Foxlifevisuals` (local userid `9212571`,
   global id `62484888`) and a now-DNS-dead website/VRTS chain. Current X and
   Instagram profiles plausibly name John L Fox V/John Fox, but no independent
   evidence securely binds that person as controller of the exact Commons
   account and credited work. Identity/control remains unresolved and thus
   rejects fail closed; it is not described as disproved.
6. **Boston Celtics.** Jayson pageid `125756061`, oldid `1000391571`, is a PNG
   derived from an organizational YouTube video, not a photographer-owned
   self-published original.
7. **FCBQ.** Ricky pageid `177213380`, oldid `1193721630`, comes from
   institutional Flickr `76111143@N02` and uses Public Domain Mark, which is
   neither a named photographer account nor an eligible exact CC history.
8. **FIRST TEAM.** Pageid `188639318`, oldid `1255367008`, is an organization
   channel's WebM of a Risacher interview and merely mentions Trae; it is not a
   Trae cover candidate or photographer-owned still.
9. **The White House.** Jayson pageid `155561554`, oldid `1092265584`, is an
   institutional public-domain source. A Commons uploader cannot convert it
   into individual self-publication.
10. **Marc Pendleton / Dayton Daily News.** LaMelo pageid `89977600`, oldid
    `915849024`, points to Twitter/newsroom material; the plan permits only the
    verified maker's own Flickr or direct-own Commons original.
11. **Zack Samberg.** LaMelo pageid `90969231`, oldid `657991939`, has
    website/Twitter/VRTS support but no allowed photographer-owned Flickr or
    direct-own Commons origin in the frozen chain.
12. **Thomas Spangler.** Damian pageid `36487353`, oldid `1185084725`, is a
    USAF institutional publication. Naming the airman does not establish an
    allowed self-published original account.
13. **Shayla D. Hamilton.** Dejounte pageid `77281430`, oldid `1199576196`, is
    Navy/DVIDS institutional publication. It cannot satisfy individual
    photographer-owned self-publication.
14. **Amin Eshaiker.** Direct Commons pageid `75970420`, oldid `756925233`, is
    labeled own work, but `User:Amineshaker` is missing/redlink and no
    independent evidence binds the account to named individual Amin Eshaiker.
    Identity fails before numeric gates; the depicted interview is also not one
    of the six event-action tokens.
15. **Bryan Berlin.** Direct Commons pageid `195580135`, oldid `1253738497`,
    is own work at a FIFA World Cup, but it portrays basketball player Anthony
    Edwards as a spectator rather than the subject of basketball international
    competition, so occasion is `other`. Independently, the named account's
    first direct upload is 2024-08-21 and registration is 2024-08-04; at the
    2026-08-13 review it cannot possibly meet three full years.
16. **Francesco1988.** Ricky pageid `12736608`, oldid `1111426767`, depicts an
    autographed shirt rather than the athlete, and the author redlink differs
    from the Commons uploader.
17. **Me (Io).** Joe Ingles pageid `12858442`, oldid `1135974121`, supplies no
    named public maker or upstream and has a different uploader; no identity or
    authority inference is allowed.
18. **nikk_la / Lpdrew derivative.** Damian pageid `24133776`, oldid
    `1164388405`, explicitly labels nikk_la as source and Lpdrew as derivative
    maker. The derivative is not original-account evidence.
19. **Alexander Jonesi.** Flickr NSID `126056148@N03`, alias
    `alexanderjonesi`, and real-name field bind the individual. Thomas original
    `33291719892` and Trae original `49368963397` are on that account. Its named
    Sports, Football, and Big Ten portfolios visibly mix ARR and BY-SA 2.0. An
    independent direct-Flickr sports corpus used fixed 2014/2017/2019 strata,
    retained the first 25 results each without reading license, and selected
    ten per year by salted stable-ID hash; all 30 sampled pages are ARR, not the
    candidate's expected BY-SA 2.0. The exact sample IDs are 2014
    `14434964350`, `14618413431`, `14434962160`, `14598606486`, `14435218207`,
    `14435013368`, `14619531524`, `14618350901`, `14619472394`, `14434969540`;
    2017 `32242164895`, `32093474972`, `31866452000`, `32093466042`,
    `32093515012`, `31465524113`, `32093513692`, `32242130635`, `32237188676`,
    `31432008013`; 2019 `39743683743`, `39743608903`, `46655953282`,
    `46655894712`, `45983881064`, `45793299055`, `45983955314`, `39743617563`,
    `32833660868`, `45983930274`, all under
    `https://www.flickr.com/photos/alexanderjonesi/<ID>/`.
20. **Christopher Johnson / globalite.** Flickr `42774464@N03`, handle
    `globalite`, and the linked Globalite Magazine biography bind Christopher
    Johnson as the individual. Ricky original `6234968162` is on that account
    but is currently All Rights Reserved while Commons oldid `1252467863`
    records BY-SA 2.0. Three account-owned sports albums enumerate 763 works
    across 2010–2014; a license-blind 10-per-year sample returns 20 ARR and only
    ten BY-SA 2.0. Identity and volume pass, but candidate and history tokens
    fail.
21. **Clément Bardot.** The registered named Commons user page, observed oldid
    `1189369929`, states a long own-photo history. Direct-own Jayson pageid
    `156167357`, oldid `1094142584`, is BY-SA 4.0. An exhaustive
    `allimages&aiuser=Clément+Bardot` query returned all 477 uploads without
    continuation, while the account's own sports galleries identify only four
    2015 PSG files and twelve 2024 Olympic basketball files. The reproducible
    sports corpus is therefore 16, below the non-waivable 50-work floor.
22. **Des Runyan.** Flickr `8705669@N04`/`blackwatersailing` binds real name Des
    Runyan and directly hosts Danny original `3340236466` under BY 2.0. The
    named Blackwater Yacht Racing Association sports album
    `72157600319235253` contains 389 works. Deterministic enumeration of its
    first four 25-row pages, without license filtering, returns exactly 50 BY
    2.0 and 50 ARR. One exact expected token with zero deviations is therefore
    impossible.
23. **Fanacsp.** Ricky pageid `19693490`, oldid `1145520390`, is direct Commons
    own work but its author is only a redlink pseudonym, so independent
    individual identity fails.
24. **Geoff Livingston.** Flickr `9397412@N06`/`geoliv` binds his real name and
    professional site; candidate `8416050966` is direct BY-SA 2.0. Four
    sports-titled albums enumerate 153 works from 2009-04-27 through
    2014-10-04. A license-blind 30-work sample yields only 15 BY-SA 2.0, with
    ten BY-ND, four BY-NC-SA, and one ARR. History therefore fails despite
    passing identity, self-publication, time, and volume.
25. **Graham Hodges.** Flickr `103675253@N04` names Graham Hodges and directly
    hosts candidate `41217485071` under BY 2.0. Three event albums enumerate
    599 works in 2018, 2022, and 2026, but the license-blind 30-row sample is
    30/30 ARR and 0/30 the expected BY 2.0. This is fatal.
26. **James Schumacher.** Flickr `56204113@N06`/`jamesindigital` and his linked
    photography site bind the individual and directly host candidate
    `23680791964` under BY 2.0. A complete 594-work account/18-album scan using
    an explicit sports metadata lexicon produces only that one qualifying
    sports work/date. It cannot establish 50 works or three years.
27. **Keith Allison.** Flickr `27003603@N00`/`keithallison` and Commons credits
    support the named maker, but Danny originals `4116134601` and `4116902784`
    are unavailable; Tatum originals `41379784661` and `40666256774` are now
    ARR despite historical Commons BY-SA records. A current corpus spans only
    2017–2019 and its blind 30-row sample is 0/30 expected BY-SA.
28. **Mark Tegethoff.** Flickr `19682872@N00` binds real name Mark Tegethoff and
    directly hosts Ricky original `6687853435`, but the live original is now
    All Rights Reserved while fixed Commons oldid `1142492464` records CC BY
    2.0. Candidate exact-token/current-status mismatch is fatal; no claim about
    the rest of the account's history is needed.
29. **Mikalan Moiso.** Flickr `60067333@N02` binds real name Mikalan Moiso and
    directly hosts Damian original `7616184432`, but it is currently ARR while
    Commons oldid `1164388477` records BY-SA 2.0. The account's reproducible
    sports albums are additionally confined to 2010–2012, below three full
    years. Either failure rejects it.
30. **Mogami Kariya.** Flickr `188082384@N02` binds real name Mogami Kariya, but
    Brandon source `50641519957` now returns 404 through both alias and NSID
    paths, so current original self-publication/license cannot be verified.
    Current sports albums also visibly include BY-SA 2.0, BY-SA 4.0, and ARR;
    this is corroboration, not a substitute for the earlier unavailable-source
    failure.
31. **nikk_la.** Flickr `18246749@N08` has an empty real-name field and only
    the pseudonymous handle. Damian original `8373912423` remains on that
    account under BY 2.0, but account placement cannot supply the missing
    independently verified named individual.
32. **Patrickpedia.** Ricky pageid `91074057`, oldid `647352659`, is direct
    Commons own work, but the pseudonymous account lacks independent named
    identity and the file supplies no exact eligible event facts.

## Clear namesake and lexical exclusions

These 115 `intitle` rows were excluded before photographer allowlist research
because they do not depict the governed athlete. Their creators are therefore
not connected photographers and no uploader inference was made:

- Anthony Edwards: 12 rows about actor Anthony Edwards, Navy/Air Force
  personnel with the same name, or the 19th-century firm Anthony, Edwards & Co.
  Representative pageids: `113374262`, `45797625`, `130971740`, `8219881`,
  `8240951`, `8199882`, `66358827`.
- Danny Green: 88 rows about the Australian boxer, cricketer, footballer,
  vocalist, or yacht participant. This includes 68 Eva Rinaldi boxer rows and
  15 NAPARAZZI cricket rows; representative pageids `31988209` and
  `114820735`. NAPARAZZI Flickr `28990363@N05` is also an unbound mark with
  empty real-name/bio fields, so even a true athlete join would fail individual
  identity, but no such join was found here.
- Moritz Wagner: 12 maps, portraits, and books concerning the 1813–1887
  naturalist/geographer; representative pageids `121249546`, `95671013`,
  `9727458`, `161018446`, `57553838`, `88689660`, `12698506`.
- Thomas Bryant: three portraits of surgeon Thomas Bryant or Alfred Thomas
  Bryant; representative pageids `35860526` and `141545659`.

## Search and dispute method

For a maker that reached those gates, review used exact public name, account
ID/NSID, and handle searches combined with `copyright`, `license`, `removal`,
`takedown`, `DMCA`, and `authorship`; Commons deletion-request searches; exact
file histories; photographer-owned original pages; and fixed
Commons/Wikipedia revisions. “None located” is bounded negative evidence only,
never proof of no dispute or no risk. The checker did not use Commons uploader
identity, copied license labels, filenames, categories, or snippets to fill an
unknown maker field.

## Phase acceptance and closed scopes

- The complete 16-player query population was frozen before policy v7.
- Every connected account has a written disposition and gate matrix; only
  all-pass records could enter the allowlist, and there are none.
- No v6 policy byte, historical registry byte, current selection, local image,
  clinical file, notice, or credit row changed in this phase.
- The five current Commons covers remain out of research and adoption scope.
- No candidate was adopted or downloaded. Phase 2 must still adjudicate exactly
  16 outcomes; a v6-qualified non-event candidate may remain eligible, but no
  event photo can join an empty allowlist.
- `deployment`, `external-account-mutation`, `hosting-service-mutation`,
  `indexing`, `medical-content-authoring`, `medical-review-decision`,
  `public-release`, and `remote-repository-mutation` stayed closed. Nothing was
  pushed, deployed, published, indexed, or medically changed.
