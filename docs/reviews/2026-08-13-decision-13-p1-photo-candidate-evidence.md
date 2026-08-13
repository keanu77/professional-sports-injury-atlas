# Decision 13 P1 photo candidate evidence

- Date: 2026-08-13
- Research completed: 2026-08-13T06:23:59Z
- Scope: `decision-13-named-covers-and-notice-consolidation-only`
- Input commit: `3fcebcb20319483e06a41c0ec25eea7575220e78`
- Release state: private medical review; public release and indexing remain closed

This report freezes the Phase 1 discovery decision for all 21 governed athlete
cover slots. It adopts no asset and changes no current cover. A low-risk
occasion is only source-context triage: it is not copyright authority,
personality-rights clearance, legal approval, medical approval, or permission
to publish.

## Method and fail-closed rules

The search used the Commons file namespace and public web discovery with these
literal query patterns, substituting each of the 21 athlete names:

```text
Commons API namespace 6: intitle:"<athlete>"
site:commons.wikimedia.org/wiki/File "<athlete>" "media day"
site:commons.wikimedia.org/wiki/File "<athlete>" "press conference"
site:commons.wikimedia.org/wiki/File "<athlete>" (parade OR award OR fan OR public event)
site:commons.wikimedia.org/wiki/File "<athlete>" (preseason OR warm-up OR warmup)
site:flickr.com/photos "<athlete>" (media day OR parade OR public event)
```

The exact athlete substitutions were Anfernee Simons, Anthony Edwards,
Brandon Clarke, CJ McCollum, Damian Lillard, Danny Green, Dejounte Murray,
Dwight Powell, Ja Morant, Jayson Tatum, Joe Ingles, Kevin Durant, Kyrie Irving,
LaMelo Ball, LeBron James, Markelle Fultz, Moritz Wagner, Ricky Rubio, Thomas
Bryant, Trae Young, and Tyrese Haliburton. Candidate file pages were opened at
their fixed revision. Imported candidates were checked against their upstream
Flickr page; direct-own-work candidates were checked against the file history
and author record. Search snippets, filenames, categories, and license labels
alone were not treated as evidence.

The eligibility conjunction was: verified athlete identity, an allowed v5
occasion, a resolved photographer/uploader relationship, a supported exact
CC license bucket, retained notice facts, and usable local original bytes. A
single failed term forces `original-svg-fallback`. Public Domain Mark and
United States government public-domain claims are not CC0 and therefore do not
enter the allowed bucket set. Official team or league portraits, commercial
agency material, game action, regular-season pregame, live preseason play, and
ambiguous credentialed-court material remain rejected.

## Frozen 21-slot outcome

| Athlete           | Start class             | Frozen outcome                | Occasion                                                        | Photographer/provenance risk        |
| ----------------- | ----------------------- | ----------------------------- | --------------------------------------------------------------- | ----------------------------------- |
| Anfernee Simons   | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |
| Anthony Edwards   | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |
| Brandon Clarke    | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |
| CJ McCollum       | `game-action-high-risk` | eligible CC photo             | `verified-media-day`                                            | `credentialed-media-residual-risk`  |
| Damian Lillard    | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |
| Danny Green       | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |
| Dejounte Murray   | `game-action-high-risk` | `original-svg-fallback`       | no supported-license candidate                                  | `unresolved-reject`                 |
| Dwight Powell     | `non-event-low-risk`    | revalidated eligible CC photo | `documented-preseason-tune-up-warm-up-outside-live-competition` | `credentialed-media-residual-risk`  |
| Ja Morant         | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |
| Jayson Tatum      | `game-action-high-risk` | `original-svg-fallback`       | no supported-license candidate                                  | `unresolved-reject`                 |
| Joe Ingles        | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |
| Kevin Durant      | `game-action-high-risk` | eligible CC photo             | `public-event-or-fan-interaction`                               | `credentialed-media-residual-risk`  |
| Kyrie Irving      | `game-action-high-risk` | eligible CC photo             | `public-event-or-fan-interaction`                               | `independent-public-event-low-risk` |
| LaMelo Ball       | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |
| LeBron James      | `game-action-high-risk` | eligible CC photo             | `public-event-or-fan-interaction`                               | `independent-public-event-low-risk` |
| Markelle Fultz    | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |
| Moritz Wagner     | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |
| Ricky Rubio       | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |
| Thomas Bryant     | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |
| Trae Young        | `non-event-low-risk`    | `original-svg-fallback`       | ambiguous credentialed-court context                            | `unresolved-reject`                 |
| Tyrese Haliburton | `game-action-high-risk` | `original-svg-fallback`       | no eligible candidate                                           | `unresolved-reject`                 |

Frozen partition: five eligible photos and 16 original SVG fallbacks. All 19
starting high-risk slots have a replacement outcome; neither starting
lower-risk record was grandfathered. Dwight Powell is revalidated and Trae
Young is replaced by an SVG because the newer evidence review cannot establish
an allowed occasion beyond ambiguous All-Star credentialed-court context.

## Accepted candidate ledger

### CJ McCollum — CC BY-SA 4.0

- Commons description:
  `https://commons.wikimedia.org/wiki/File:2025_C.J._McCollum_(cropped).jpg`
- Fixed revision:
  `https://commons.wikimedia.org/w/index.php?title=File%3A2025_C.J._McCollum_%28cropped%29.jpg&oldid=1130690368`
  (`1130690368`, `2025-12-14T01:22:53Z`)
- Commons original:
  `https://upload.wikimedia.org/wikipedia/commons/7/73/2025_C.J._McCollum_%28cropped%29.jpg`
  (`1138x1513`, 1,287,680 bytes, MediaWiki SHA-1
  `09c77cd7b3bd43256863642635bfd2c9a941dea5`; parent original
  `3440x4300`)
- Upstream original: `https://www.flickr.com/photos/10457902@N08/54840990136/`
  (HTTP 200 at verification; supplied title `JG9_0113`; owner All-Pro Reels;
  capture date 2025-09-29; exact CC BY-SA 4.0).
- Creator/uploader: All-Pro Reels / Commons uploader Ooligan. The upstream
  description identifies Joe Glorioso / All-Pro Reels and the Washington
  Wizards 2025-26 media day; the All-Pro Reels author page
  (`https://allproreels.com/about-us/`) identifies Joe Glorioso and Rob Banez
  as its founders. This resolves the named brand chain but remains a
  credentialed-media residual risk.
- License bucket: `cc-by-sa`; exact license and Adapter's License:
  `https://creativecommons.org/licenses/by-sa/4.0`.
- Notice state: title supplied; creator supplied; no separate copyright,
  disclaimer, or other per-file notice supplied. Commons made a crop and the
  site will disclose its presentation crop. The crop remains under linked CC
  BY-SA 4.0.
- Occasion finding: `verified-media-day`. The upstream description expressly
  identifies the team media-day session rather than a game, practice, or
  pregame court.

### Kevin Durant — CC BY-SA 4.0

- Commons description:
  `https://commons.wikimedia.org/wiki/File:Kevin_Durant_and_Frances_Tiafoe_(2023_DC_Open)_01_(cropped).jpg`
- Fixed revision:
  `https://commons.wikimedia.org/w/index.php?title=File%3AKevin_Durant_and_Frances_Tiafoe_%282023_DC_Open%29_01_%28cropped%29.jpg&oldid=1235995897`
  (`1235995897`, `2026-06-22T05:11:15Z`)
- Commons original:
  `https://upload.wikimedia.org/wikipedia/commons/2/23/Kevin_Durant_and_Frances_Tiafoe_%282023_DC_Open%29_01_%28cropped%29.jpg`
  (`2141x2496`, 2,322,054 bytes, MediaWiki SHA-1
  `57c28f193a1ac0691aa6dbd52f31a20e3b3b3b20`).
- Parent source:
  `https://commons.wikimedia.org/wiki/File:Kevin_Durant_and_Frances_Tiafoe_(2023_DC_Open)_01.jpg`;
  fixed parent revision `1136034235` at `2025-12-24T15:47:36Z`, direct own
  work by Hameltion, original `6000x4000`.
- Creator/uploader: Hameltion / Hameltion. The parent is direct own work, so no
  third-party uploader-to-photographer inference is required.
- Work title: `not-supplied`; the filename/ObjectName is not treated as a
  distinct supplied title.
- License bucket: `cc-by-sa`; exact license and Adapter's License:
  `https://creativecommons.org/licenses/by-sa/4.0`.
- Notice state: creator supplied; no separate copyright, disclaimer, or other
  per-file notice supplied. Commons made the documented crop and the site will
  disclose its presentation crop; the crop remains under linked CC BY-SA 4.0.
- Occasion finding: `public-event-or-fan-interaction`. The description records
  Durant being interviewed on court with Frances Tiafoe after Tiafoe's tennis
  match at the 2023 DC Open; it is a public tennis-event interview, not Durant
  basketball action. Risk remains `credentialed-media-residual-risk`.

### Kyrie Irving — CC BY 2.0

- Commons description:
  `https://commons.wikimedia.org/wiki/File:Kyrie_Irving_during_the_2016_NBA_Champions_victory_parade.jpg`
- Fixed revision:
  `https://commons.wikimedia.org/w/index.php?title=File%3AKyrie_Irving_during_the_2016_NBA_Champions_victory_parade.jpg&oldid=1126274545`
  (`1126274545`, `2025-12-05T22:23:19Z`)
- Commons original:
  `https://upload.wikimedia.org/wikipedia/commons/6/6b/Kyrie_Irving_during_the_2016_NBA_Champions_victory_parade.jpg`
  (`6000x4000`, 7,867,079 bytes, MediaWiki SHA-1
  `3da1425d3b223e7a48162e09059540cd364e6b3d`).
- Upstream original: `https://www.flickr.com/photos/edrost88/27235940294/`
  (HTTP 200 at verification; supplied title `Kyrie Irving`; owner EDrost88 / Erik
  Drost; exact CC BY 2.0). Commons records a matching Flickr review.
- Creator/uploader: Erik Drost / Pofka.
- License bucket: `cc-by`; exact license:
  `https://creativecommons.org/licenses/by/2.0`. No Adapter's License or
  ShareAlike statement applies.
- Notice state: title and creator supplied; no separate copyright, disclaimer,
  or other per-file notice supplied. No Commons crop is claimed; the site will
  disclose only its presentation crop.
- Occasion finding: `public-event-or-fan-interaction`, the 2016 NBA champions'
  public victory parade rather than game play. The independent named
  photographer and verified upstream license chain support
  `independent-public-event-low-risk`.

### LeBron James — CC BY 3.0

- Commons description:
  `https://commons.wikimedia.org/wiki/File:Lebron_James_NYC_2010_Shankbone.jpg`
- Fixed revision:
  `https://commons.wikimedia.org/w/index.php?title=File%3ALebron_James_NYC_2010_Shankbone.jpg&oldid=1012365035`
  (`1012365035`, `2025-03-21T22:50:50Z`)
- Commons original:
  `https://upload.wikimedia.org/wikipedia/commons/8/80/Lebron_James_NYC_2010_Shankbone.jpg`
  (`2003x2504`, 2,550,116 bytes, MediaWiki SHA-1
  `b77754f613df25c79d60bd6667eb0073aefd5661`).
- Creator/uploader: David Shankbone / David Shankbone; direct own work. The
  author's supplemental blog was unavailable at verification and is not used
  to establish the chain.
- Work title: `not-supplied`; the filename/ObjectName is not treated as a
  distinct supplied title.
- License bucket: `cc-by`; exact license:
  `https://creativecommons.org/licenses/by/3.0`. No Adapter's License or
  ShareAlike statement applies.
- Notice state: creator supplied; no separate copyright or disclaimer notice;
  retain the Commons personality-rights warning as an other per-file notice.
  The site will disclose its presentation crop.
- Occasion finding: `public-event-or-fan-interaction`. The description places
  James in New York discussing _More Than a Game_ on 2009-09-22, a public
  appearance rather than basketball action. Direct own work by an identified
  photographer supports `independent-public-event-low-risk`.

### Dwight Powell — CC BY-SA 4.0, revalidated keep

- Commons description:
  `https://commons.wikimedia.org/wiki/File:2023-08-09_Deutschland_gegen_Kanada_(Basketball-L%C3%A4nderspiel)_by_Sandro_Halank%E2%80%93021.jpg`
- Fixed revision:
  `https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93021.jpg&oldid=967381398`
  (`967381398`, `2024-12-07T23:52:52Z`)
- Commons original:
  `https://upload.wikimedia.org/wikipedia/commons/8/8b/2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93021.jpg`
  (`2192x2827`, 2,398,388 bytes, MediaWiki SHA-1
  `9fc679a8eb0d1555068fdc77d5bdcbed074235e2`).
- Creator/uploader: Sandro Halank / Sandro Halank; self-photographed.
- Supplied title: `Basketball-Länderspiel: Deutschland gegen Kanada`.
- License bucket: `cc-by-sa`; exact license and Adapter's License:
  `https://creativecommons.org/licenses/by-sa/4.0`.
- Notice state: retain the supplied copyright notice “Sandro Halank,
  Wikimedia Commons, CC BY-SA 4.0” and the personality-rights warning; no
  separate disclaimer is supplied. The site will disclose its presentation
  crop under linked CC BY-SA 4.0.
- Occasion finding:
  `documented-preseason-tune-up-warm-up-outside-live-competition`. The file
  documents the Germany-Canada preparation match while the governed pixels
  depict Powell in warm-up clothing, without live possession or defensive
  action. The sports-event credentialed context remains
  `credentialed-media-residual-risk`.

## License partition and retained obligations

| Bucket   | Frozen candidates                                          | Required Phase 2 treatment                                                                                                                                       |
| -------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CC BY    | Kyrie Irving (2.0), LeBron James (3.0)                     | Retain creator, supplied-title state, exact version/link, fixed source, change disclosure, and per-file notices; no ShareAlike language.                         |
| CC BY-SA | CJ McCollum (4.0), Kevin Durant (4.0), Dwight Powell (4.0) | Retain the same facts plus linked compatible Adapter's License for each Commons/site crop; ordinary HTML/rendition use only, never a site-owned composite input. |
| CC0      | none                                                       | No candidate was reclassified from Public Domain Mark or a government public-domain statement.                                                                   |

## Rejection and SVG fallback ledger

| Athlete           | Principal candidate evidence opened                                                                                                                                                                                                | Rejection basis and frozen fallback reason                                                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anfernee Simons   | `File:AnferneeSimons (cropped).jpg`, fixed revision `827612495`; additional title search returned only the same Portland/Sacramento set and a 2021 Cleveland/Portland file.                                                        | The fixed source identifies a 2019-12-04 regular-season Kings-Blazers pregame warm-up. Regular-season pregame remains ineligible; no evidence-backed public non-event was found.                                                 |
| Anthony Edwards   | Current `File:Anthony Edwards Kentavious Caldwell-Pope (51734745028) (cropped).jpg`, fixed revision `1258083226`; Georgia files; a same-name Air Force Museum result.                                                              | Current and Georgia candidates are game action. The museum result is the actor Anthony Edwards, not the governed athlete. No identity-verified eligible non-event candidate remained.                                            |
| Brandon Clarke    | `File:Brandon Clarke in 2020.jpg`, fixed revision `1214520256`, plus `File:Brandon Clarke (51814063744) (cropped).jpg`.                                                                                                            | Both available athlete files are arena/game-context material; warm-up clothing does not remove the credentialed regular-season context.                                                                                          |
| Damian Lillard    | Current game file fixed revision `1164388372`; `File:Damian Lillard with fans.jpg`; related Flickr/game files.                                                                                                                     | The current and numbered files are NBA game context. The fan image lacks evidence separating the encounter from game-day/credentialed access and did not clear occasion provenance.                                              |
| Danny Green       | Current postseason file fixed revision `1223550468`; `File:Danny Green 2019 crop.jpg`; Senior Day/court results.                                                                                                                   | The current file is postseason court context. Other basketball-player results did not establish a qualifying public non-event independently of game-day or court access. Same-name boxing results are not the athlete.           |
| Dejounte Murray   | Current All-Star file fixed revision `912383643`; `File:Dejounte Murray Tours the METC (5148235).jpg`, revision `1199576196`.                                                                                                      | The All-Star candidate is game context. The METC visit has a qualifying public-visit occasion but is marked United States government/Public Domain Mark rather than CC0, outside the authorized BY/BY-SA/CC0 buckets.            |
| Ja Morant         | Current game file fixed revision `1092053012`; Commons title search returned game and All-Star files.                                                                                                                              | Every identity-matched candidate found was game, regular-season arena, or All-Star context. No qualifying non-event remained.                                                                                                    |
| Jayson Tatum      | Current game file fixed revision `1086996816`; McDonald's All-American game files; White House visit material.                                                                                                                     | Basketball files are game action. White House material is United States government public-domain material, not CC0; the authorized bucket set cannot adopt it.                                                                   |
| Joe Ingles        | Current Utah-Portland file fixed revision `877365146`; `File:Joe Ingles.jpg`; uncropped Utah file.                                                                                                                                 | The current and uncropped files are live preseason/game-bound. The small fan image does not establish an eligible occasion or a complete upstream author/license chain.                                                          |
| LaMelo Ball       | `File:LaMelo Ball (cropped).jpg`, fixed revision `1130229739` at `2025-12-13T07:33:56Z`; Flickr `https://www.flickr.com/photos/edrost88/51916059508/`, title `LaMelo Ball`, CC BY 2.0.                                             | The source expressly depicts 2022 NBA All-Star Game action. A Commons title/category search (46 results assessed) produced no eligible alternative.                                                                              |
| Markelle Fultz    | `File:Markelle Fultz (50639078246).jpg`, fixed revision `1130452222` at `2025-12-13T16:58:30Z`, CC BY-SA 2.0; upstream Flickr now HTTP 404.                                                                                        | The description identifies Wizards-Magic NBA game action, and the upstream chain is no longer independently inspectable. Either defect rejects the candidate.                                                                    |
| Moritz Wagner     | Current `...Halank–145.jpg`, fixed revision `967382118` at `2024-12-07T23:55:17Z`, CC BY-SA 4.0; `File:20170301 NW-UM Moe Wagner pregame.jpg`, fixed revision `959470878`, CC BY-SA 4.0.                                           | The first depicts live tune-up competition. The second is regular-season college pregame, not a documented preseason/tune-up warm-up.                                                                                            |
| Ricky Rubio       | `File:Ricky Rubio at Lynx game.jpg`, fixed revision `1179110385` at `2026-03-10T22:18:53Z`; Flickr `https://www.flickr.com/photos/joebielawa/7236915114/`, CC BY 2.0; `File:Ricky Rubio-jul 2018.jpg`, fixed revision `647352659`. | “At Lynx game” leaves a credentialed/game-court occasion ambiguous. The 2018 file supplies no occasion evidence. Neither clears the allowed occasion test.                                                                       |
| Thomas Bryant     | `File:20150329 MCDAAG closed practice Thomas Bryant (1).JPG`, fixed revision `957946914` at `2024-11-16T22:55:13Z`, CC BY-SA 4.0; current game file fixed revision `1171979953`.                                                   | A closed practice is not one of the authorized public non-event contexts; the current file is regular-season arena context.                                                                                                      |
| Trae Young        | `File:Trae Young (2022 All-Star Weekend) (cropped).jpg`, fixed revision `1148485505` at `2026-01-16T19:13:29Z`; Flickr `https://www.flickr.com/photos/edrost88/51915140944/`, title `Trae Young`, CC BY 2.0.                       | Revalidation does not treat “All-Star Weekend” alone as public-event proof. The governed pixels and source evidence leave credentialed court/warm-up context ambiguous, so the prior lower-risk label is superseded fail-closed. |
| Tyrese Haliburton | `File:1 tyrese haliburton 2025 (cropped 2).jpg`, fixed revision `1202611768` at `2026-04-24T03:36:57Z`, CC BY-SA 4.0.                                                                                                              | The source explicitly identifies the 2025-03-28 Pacers-Wizards NBA game and depicts official-uniform court action; category searches yielded only game material.                                                                 |

Additional photo-looking results were not promoted when identity, occasion,
author/uploader authority, or the original license chain could not all be
reproduced. In particular, agency photos, official headshots, unavailable
upstreams, ambiguous court access, and unsupported public-domain labels were
not “close enough” substitutes.

## Phase boundary and closed scopes

Phase 1 freezes evidence only. No accepted original has yet been downloaded to
the repository, no SVG has yet been authored, no registry successor has been
generated, and the current resolver/build remains on v3. Phase 2 must use
exactly these five photo records or their safer SVG fallback; it may not revive
any rejected candidate without a new frozen evidence revision.

All five photos still carry copyright, publicity/personality, provenance, and
context residual risk. “Eligible” here means only that the record satisfies the
authorized internal pipeline criteria. It is not public-use clearance and does
not change the rights-review or release hold.

The eight closed scopes remained closed: no deployment, external-account
mutation, hosting-service mutation, indexing, medical-content authoring,
medical-review decision, public release, or remote-repository mutation
occurred. Nothing was pushed, deployed, indexed, or publicly released.
