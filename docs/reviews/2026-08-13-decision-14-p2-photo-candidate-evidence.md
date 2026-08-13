# Decision 14 Phase 2 photo candidate evidence

- Date checked: 2026-08-13
- Scope: `decision-14-lowrisk-photographer-covers-only`
- Input commit: `282854b7b7dd990a2cfb268562094d032b60b198`
- Checker: `decision-14-photo-review`
- Release state: private medical review; deployment, indexing, and public
  release remain closed
- Frozen outcome: **2 v6-qualified non-game public-event photos and 14 exact
  Decision 13 SVG fallbacks**

This report freezes exactly one outcome for each of the 16 authorized SVG
slots. It adopts or downloads no repository asset. The five current Commons
covers are not candidates and remain unchanged. The two accepted candidates
use the inherited `nba-v6` non-game branch; the `nba-v7` named-photographer
event exception admits **zero** photos because its frozen allowlist is empty.

## Frozen inputs and method

The following immutable inputs were re-opened rather than replaced:

| Input                                                                                                      | SHA-256                                                            |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Decision 13 candidate ledger, `docs/reviews/2026-08-13-decision-13-p1-photo-candidate-evidence.md`         | `823be69338a4fdc6029750ac8003c84e0ebd4837106b6237e5082e20c6e50e1d` |
| Decision 14 fixed-query snapshot, `docs/reviews/evidence/decision-14/p1/commons-fixed-query-leads.v1.json` | `2690dfad9670db50c28674fdce2d3d17f2770c8ea684e33489b666f2c697ae1f` |
| Decision 14 allowlist report, `docs/reviews/2026-08-13-decision-14-p1-photographer-allowlist-evidence.md`  | `593919e471180fe3cb9845236f4758b1ccfd305b599fbe59b4f841060637f18e` |
| `nba-v7` Markdown                                                                                          | `61ed88f92d80b77cd2c1410d03305215eedbb391356c073fb19fac944dea2fd1` |
| `nba-v7` canonical JSON                                                                                    | `d1062c1ffa045397d13489319534acbfe24653615df5ce83aac40e40539a8b15` |
| Registry v5                                                                                                | `26129455fe5b9297c44ac91c3be1fc1678a928cf77bd12d00695614fe5df3985` |

All six frozen query strings were applied to every target athlete, for 96
instantiated queries. The Commons namespace-6 population contains 486 rows:

```text
Commons API namespace 6: intitle:"<athlete>"
site:commons.wikimedia.org/wiki/File "<athlete>" "media day"
site:commons.wikimedia.org/wiki/File "<athlete>" "press conference"
site:commons.wikimedia.org/wiki/File "<athlete>" (parade OR award OR fan OR "public event")
site:commons.wikimedia.org/wiki/File "<athlete>" (preseason OR warm-up OR warmup)
site:flickr.com/photos "<athlete>" ("media day" OR parade OR "public event" OR game OR warm-up)
```

| Athlete         | Rows | Athlete           | Rows |
| --------------- | ---: | ----------------- | ---: |
| Anfernee Simons |    3 | Joe Ingles        |    3 |
| Anthony Edwards |   25 | LaMelo Ball       |   45 |
| Brandon Clarke  |    2 | Markelle Fultz    |   14 |
| Damian Lillard  |   52 | Moritz Wagner     |   13 |
| Danny Green     |   96 | Ricky Rubio       |   78 |
| Dejounte Murray |    5 | Thomas Bryant     |   23 |
| Ja Morant       |   29 | Trae Young        |   58 |
| Jayson Tatum    |   32 | Tyrese Haliburton |    8 |

For each plausible candidate the current Commons description, fixed page
revision, original binary facts, credited maker, uploader relationship,
license version and link, title supply state, notice state, alteration state,
and factual occasion were checked. Imported works additionally required an
available photographer-owned upstream original. Search snippets, filenames,
categories, uploader labels, and API license labels alone did not prove any
gate. A new photographer found after v7 was frozen was recorded as
out-of-cycle and could not change v7.

The closed decision expression was:

```text
(complete inherited-v6 non-game candidate, with no event-photo record)
OR
(complete finite v7 event candidate joined to one exact frozen allowlist entry)
```

Unknown, `other`, unresolved, closed-practice, ambiguous credentialed-court,
and every unmatched event candidate fail closed. No minimum photo count was
used.

## Frozen 16-slot outcome

| Athlete           | Frozen outcome     | Branch or first fatal reason                                                                                         |
| ----------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Anfernee Simons   | keep exact SVG     | Regular-season pregame/warm-up; v7 event join has no allowlist entry.                                                |
| Anthony Edwards   | keep exact SVG     | FIFA match media context is `other`/event context; `other` is always ineligible and v7 allowlist is empty.           |
| Brandon Clarke    | keep exact SVG     | Regular-season live game action; v7 allowlist is empty.                                                              |
| Damian Lillard    | adopt frozen photo | Inherited v6 `public-event-or-fan-interaction`; public festival stage, not live play, pregame, or warm-up.           |
| Danny Green       | keep exact SVG     | Senior Day pixels do not distinguish ceremony from credentialed court/pregame context.                               |
| Dejounte Murray   | keep exact SVG     | Public visit occasion passes, but US-government public domain is not CC0 and is outside the allowed license buckets. |
| Ja Morant         | keep exact SVG     | No candidate proves an allowed v6 occasion; strongest off-play image also has unresolved account-to-maker authority. |
| Jayson Tatum      | adopt frozen photo | Inherited v6 `public-event-or-fan-interaction`; fan-facing stage interview, not court, game, pregame, or warm-up.    |
| Joe Ingles        | keep exact SVG     | Live preseason competition; v7 allowlist is empty.                                                                   |
| LaMelo Ball       | keep exact SVG     | All-Star game action and other live competition; v7 allowlist is empty.                                              |
| Markelle Fultz    | keep exact SVG     | Regular-season/All-American game action; v7 allowlist is empty, and the strongest NBA upstream is now unavailable.   |
| Moritz Wagner     | keep exact SVG     | Live preparation-match action or regular-season college pregame; v7 allowlist is empty.                              |
| Ricky Rubio       | keep exact SVG     | Lynx-game candidate is ambiguous credentialed-court context; the 2018 direct-own file has no occasion evidence.      |
| Thomas Bryant     | keep exact SVG     | Closed practice is always ineligible; alternatives are game action with an empty allowlist.                          |
| Trae Young        | keep exact SVG     | “All-Star Weekend” plus court pixels remains ambiguous credentialed-court context.                                   |
| Tyrese Haliburton | keep exact SVG     | Regular-season game action; v7 allowlist is empty.                                                                   |

Every row is final for this cycle: there are no unresolved current selections.
The two photo rows are frozen for Phase 3 adoption only; the other fourteen
rows preserve the complete current v5 selection and exact current SVG bytes.

## Accepted candidate A — Damian Lillard

- Athlete/case mapping: Damian Lillard,
  `CASE-NBAACHILLES-2025-015`; the 2014 source event is different from the
  governed 2025 injury event.
- Commons description:
  `https://commons.wikimedia.org/wiki/File:20140814_World_Basketball_Festival_Damian_Lillard_and_Kyle_Korver.JPG`.
- Fixed revision:
  `https://commons.wikimedia.org/w/index.php?title=File%3A20140814%20World%20Basketball%20Festival%20Damian%20Lillard%20and%20Kyle%20Korver.JPG&oldid=1195923850`,
  revision `1195923850`, `2026-04-12T04:32:09Z`.
- Original file: `20140814 World Basketball Festival Damian Lillard and Kyle
Korver.JPG`; queryless original URL
  `https://upload.wikimedia.org/wikipedia/commons/c/c3/20140814_World_Basketball_Festival_Damian_Lillard_and_Kyle_Korver.JPG`;
  JPEG `3456x5184`, 5,414,375 bytes, MediaWiki SHA-1
  `621fef1b2f486c9aff580cb1308895d9543cb381`.
- Identity and chain: the description names Damian Lillard, Kyle Korver, and
  host Steve Bardo. Credited maker and original Commons uploader are both
  `TonyTheTiger`; the file declares direct own work, so no third-party
  uploader inference or separate upstream original is used.
- Exact license: `CC BY-SA 4.0`, bucket `cc-by-sa`,
  `https://creativecommons.org/licenses/by-sa/4.0`.
- Title and notices: no distinct supplied work title beyond filename/ObjectName
  (`not-supplied`); no separate supplied copyright, disclaimer, or other
  per-file notice; no personality restriction recorded.
- Alteration: no Commons crop is declared. Phase 3 must retain the unmodified
  original, disclose the CSS presentation crop, and link a compatible
  `CC BY-SA 4.0` Adapter's License limited to the crop contribution. The asset
  is forbidden from site-composed case cards, social/OG images,
  infographics, or other baked designs.
- Occasion: the fixed description places the three people on the 2014 World
  Basketball Festival public stage at Chicago's 63rd Street Beach. The pixels
  show a hosted stage segment, not possession, defense, live competition,
  pregame, or warm-up. Frozen token:
  `public-event-or-fan-interaction`; photographer risk:
  `independent-public-event-low-risk`.
- Factual caption: `Damian Lillard 於 2014 年芝加哥 63rd Street Beach 世界籃球節公開舞台；非本案例受傷當下影像`.
- Focal validation: provisional focal position `x=28%, y=35%`; the athlete's
  head and upper body remain safe at both `5:2` and `16:9`. Phase 3 must repeat
  this check against the downloaded original bytes.
- Branch: inherited v6 non-game branch with the event-photo record absent.
  TonyTheTiger's v7 allowlist rejection is therefore not treated as a pass or
  bypass of the stricter event exception.

## Accepted candidate B — Jayson Tatum

- Athlete/case mapping: Jayson Tatum, `CASE-NBAACHILLES-2025-016`; the 2018
  source event is different from the governed 2025 injury event.
- Commons description:
  `https://commons.wikimedia.org/wiki/File:2018_NBA_All-Star_Weekend_-_Jayson_Tatum.jpg`.
- Fixed revision:
  `https://commons.wikimedia.org/w/index.php?title=File%3A2018%20NBA%20All-Star%20Weekend%20-%20Jayson%20Tatum.jpg&oldid=756925233`,
  revision `756925233`, `2023-05-01T03:06:22Z`.
- Original file: `2018 NBA All-Star Weekend - Jayson Tatum.jpg`; queryless
  original URL
  `https://upload.wikimedia.org/wikipedia/commons/5/58/2018_NBA_All-Star_Weekend_-_Jayson_Tatum.jpg`;
  JPEG `2188x1680`, 447,666 bytes, MediaWiki SHA-1
  `a2887e74d5d3568ef209a2cc2a4b8d90740e0779`.
- Identity and chain: the description names Jayson Tatum and an interview at
  2018 NBA All-Star Weekend. Credited maker is `Amin Eshaiker`; the author link
  and original binary uploader are the same `Amineshaker` Commons account and
  the file declares direct own work. No imported upstream is asserted.
- Exact license: `CC BY-SA 4.0`, bucket `cc-by-sa`,
  `https://creativecommons.org/licenses/by-sa/4.0`.
- Title and notices: no distinct supplied work title beyond filename/ObjectName
  (`not-supplied`); no separate supplied copyright, disclaimer, or other
  per-file notice.
- Alteration: the source expressly discloses color-balance, saturation,
  brightness, and contrast editing in ArcSoft Photostudio 5.5. Phase 3 must
  retain that disclosure, disclose the CSS presentation crop, and link a
  compatible `CC BY-SA 4.0` Adapter's License limited to the crop contribution.
  The photo is barred from every baked site composition.
- Occasion: the source pixels show Tatum seated with a microphone on a lit,
  fan-facing stage while the audience photographs him. They show no court,
  official game uniform, play, pregame, or warm-up. Frozen token:
  `public-event-or-fan-interaction`; photographer risk:
  `independent-public-event-low-risk`.
- Factual caption: `Jayson Tatum 於 2018 NBA 全明星週末公開訪談舞台；非本案例受傷當下影像`.
- Focal validation: provisional focal position `x=30%, y=35%`; Tatum remains
  visible with public-stage context at `5:2` and `16:9`. Phase 3 must repeat
  this check against the downloaded original bytes.
- Branch: inherited v6 non-game branch with the event-photo record absent.
  Amin Eshaiker's failure to meet the separate multi-year v7 allowlist floor
  is neither concealed nor converted into an event-exception pass.

## Rejection ledger

The following entries record the strongest candidate or the first fatal gate;
weaker same-athlete files inherit no approval from them.

| Athlete           | Principal fixed evidence                                                                                                                                      | First fatal gate                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anfernee Simons   | `File:AnferneeSimons (cropped).jpg`, oldid `827612495`; direct own, CC BY-SA 4.0                                                                              | Fixed source says 2019-12-04 Kings–Blazers regular-season pregame/warm-up; not v6 non-game and no v7 allowlist join.                                                                                                    |
| Anthony Edwards   | `File:Anthony Edwards Argentina v Egypt 7 July 2026-069.jpg`, oldid `1253738497` at `2026-07-29T14:37:54Z`; Bryan Berlin/Berlination direct own, CC BY-SA 4.0 | FIFA World Cup match media/WikiPortraits context is frozen as `other`, always ineligible; alternative event reading also fails the empty allowlist. Bryan Berlin is out-of-cycle and below the frozen three-year floor. |
| Brandon Clarke    | `File:Brandon Clarke (51814063744) (cropped).jpg`, oldid `1244619086`; Erik Drost upstream, CC BY 2.0                                                         | 2022-01-04 Memphis–Cleveland live action; event branch cannot join the empty allowlist.                                                                                                                                 |
| Danny Green       | `File:Danny Green dance Senior Day.jpg`, oldid `1088225177`; Des Runyan Flickr original, CC BY 2.0                                                            | “Senior Day” and center-court pixels do not establish award ceremony independently of credentialed game/pregame context.                                                                                                |
| Dejounte Murray   | `File:Dejounte Murray Tours the METC (5148235).jpg`, oldid `1199576196`; US Navy/DVIDS source                                                                 | The public visit occasion passes, but `PD-USGov-Military-Navy`/government public domain is not CC0.                                                                                                                     |
| Ja Morant         | `File:Ja Morant.jpg`, oldid `981268435`; Gamecock Central Flickr source, CC BY 2.0                                                                            | No allowed v6 occasion is supplied; the off-play gym pixels remain ambiguous and the Katie Dugan credit is not resolved to the source account's licensing authority.                                                    |
| Joe Ingles        | `File:Joe Ingles Utah (cropped).jpg`, oldid `877365146`; parent oldid `882038848`, direct own, CC BY-SA 4.0                                                   | Description fixes live 2018-10-07 Utah–Portland preseason competition; empty allowlist.                                                                                                                                 |
| LaMelo Ball       | `File:LaMelo Ball (cropped).jpg`, oldid `1130229739`; Erik Drost original, CC BY 2.0                                                                          | Description fixes 2022 NBA All-Star Game action; empty allowlist.                                                                                                                                                       |
| Markelle Fultz    | `File:Markelle Fultz (50639078246).jpg`, oldid `1130452222`; CC BY-SA 2.0                                                                                     | 2019-12-03 Wizards–Magic game action fails the empty allowlist; the linked photographer-owned Flickr original now returns 404.                                                                                          |
| Moritz Wagner     | `...Sandro Halank–145.jpg`, oldid `967382118`; direct own, CC BY-SA 4.0                                                                                       | Germany–Canada preparation-match live action; empty allowlist. Alternate oldid `959470878` is regular-season college pregame.                                                                                           |
| Ricky Rubio       | `File:Ricky Rubio at Lynx game.jpg`, oldid `1179110385`; Joe Bielawa original, CC BY 2.0                                                                      | Only game/court context is established, so occasion is `ambiguous-credentialed-court-context`. Direct-own July 2018 alternate oldid `647352659` supplies no occasion.                                                   |
| Thomas Bryant     | `File:20150329 MCDAAG closed practice Thomas Bryant (1).JPG`, oldid `957946914`; direct own, CC BY-SA 4.0                                                     | `closed-practice` is always ineligible. Regular-season alternate oldid `1171979953` also fails the empty allowlist.                                                                                                     |
| Trae Young        | `File:Trae Young (2022 All-Star Weekend) (cropped).jpg`, oldid `1148485505`; Erik Drost original, CC BY 2.0                                                   | All-Star Weekend plus court/warm-up pixels remains `ambiguous-credentialed-court-context`; it is not relabeled as a public event.                                                                                       |
| Tyrese Haliburton | `File:1 tyrese haliburton 2025 (cropped 2).jpg`, oldid `1202611768`; parent oldid `1231557610`, direct own Chensiyuan, CC BY-SA 4.0                           | 2025-03-28 Pacers–Wizards regular-season court action; empty allowlist.                                                                                                                                                 |

## License, allowlist, and composition partition

| Admission path        | CC BY | CC BY-SA | CC0 | Total |
| --------------------- | ----: | -------: | --: | ----: |
| Inherited v6 non-game |     0 |        2 |   0 |     2 |
| v7 allowlisted event  |     0 |        0 |   0 |     0 |
| Frozen SVG fallback   |     — |        — |   — |    14 |

The final v7 allowlist has zero entries. No event candidate therefore has an
allowlist photographer ID, matched self-published account, expected history
license token, or residual-risk event record to join. Those fields are not
invented. Both accepted works instead have a complete direct-own Commons chain
and an allowed v6 non-game occasion. Each remains separately classified as
`independent-public-event-low-risk`; “low risk” is not “no risk.”

Both accepted candidates are CC BY-SA 4.0. Phase 3 may use only ordinary
HTML/CSS placement and responsive rendition, with a linked same-version
Adapter's License for the presentation crop. Neither may enter a composed
case card, infographic, OG/social image, or other baked output.

## Five-cover and closed-scope negative proof

Phase 2 changed no policy, registry, asset, product, review set, manifest, or
service bytes. The exact Phase 0 protected-cover baseline remains:

- five Commons selections / seven cases;
- selection aggregate SHA-256
  `881875776129f58b4fe0f9970ab86ca3737b0e6818f2398b67967dd3c5cd54c5`;
- protected asset-ledger SHA-256
  `ab166509cde24c87be86105dfd13abad97125da52f1646064c16840ac26217c7`;
- baseline evidence SHA-256
  `78dd25e332f5b32773761d6d178a9d24f96ab098f27345336d98dda14356ad8d`.

CJ McCollum, Dwight Powell, Kevin Durant, Kyrie Irving, and LeBron James were
not searched for replacement, re-adjudicated, downloaded, or rewritten. The
16 target baseline remains 16 SVG selections / 19 cases until Phase 3.

No push, deployment, indexing, public release, external-account mutation,
hosting mutation, clinical-content change, or medical-review decision
occurred. The 30-file clinical freeze remains an input and no clinical file is
part of this evidence-only phase.

## Residual-risk and non-clearance boundary

For clarity, the frozen Decision 14 statement remains:

> Decision 14 accepts a bounded credentialed-access residual risk; no
> copyright, personality-rights, or public-release approval is created.

No photo in this phase is admitted through that event-risk exception, so no
candidate is falsely assigned `credentialed-access-residual-risk`. The two v6
public-event candidates retain the existing non-clearance rule: low-risk
source classification is not copyright clearance, personality-rights
clearance, legal-use approval, medical approval, or public-release approval.

## Phase boundary

This commit freezes candidate evidence only. Phase 3 may download and adopt
exactly the two accepted originals above, verify their local bytes and crops,
advance the registry append-only from v5, and retain the other fourteen exact
SVG selections. Any different candidate, newly discovered photographer, or
changed factual gate requires a later governed successor rather than an edit
to this report or nba-v7.
