# G6 rights remediation — P2 evidence

Date: 2026-08-12
Scope: Decision 11 P2-5 and P2-6 only
Release state: held; `allowIndexing=false`

Together with the completed P0 and P1 evidence, this P2 evidence addresses the
six bounded Decision 11 remediation defects. It does not clear the BLOCKED
rights review, authorize publication, or classify any photo as licensed for
public use.

## P2-5 — NBA.com plain-text citations

### Complete sink audit

The 26 governed case records retain 106 NBA.com URL tokens as evidence: 18
`video.canonicalUrl` values, 18 matching `fallbackUrl` values, 69
`sources[].url` rows, and one already-plain URL inside Joe Ingles's unrendered
event-binding basis. No case, source-manifest, review-decision, or approved
clinical byte was changed.

Before remediation, the review artifact exposed 89 navigable NBA.com URL
attributes: 18 real video-facade anchors, 69 real source-list anchors, and two
fictional review fixture/lab anchors. The audit found no other current NBA URL
sink in iframe creation, JSON-LD/schema, OG or other metadata, redirects,
cards, case-index JSON, review-set JSON, or no-JavaScript output.

The presentation layer now has one fail-closed external-reference policy. It
matches `nba.com` and every subdomain without matching spoofed suffixes, emits
no NBA anchor even for a homepage unless a later review explicitly allowlists
it, and also refuses to make malformed, credential-bearing, protocol-relative,
or non-HTTPS values clickable. Source lists and video states share the same
centralized predicate, while source-list and video citations share one citation
renderer. Each NBA citation keeps publisher, supplied title, publication date,
and the literal canonical URL visible, but has no anchor.

The built-output gate parses every HTML attribute, JSON-LD string value
(including slash escapes), and inline script; review and public artifact
verification also scan redirect artifacts. The complete review build proves:

- 18 governed NBA canonical video sources have a complete non-clickable video
  citation;
- all 69 governed NBA source rows have a complete non-clickable source
  citation;
- zero HTML attributes, iframes, JSON-LD values, inline scripts, or redirect
  artifacts point to any non-allowlisted NBA.com URL; and
- the known Taiwan-restricted ESPN/YouTube fallback remains a real ESPN source
  link and is not mistaken for an NBA citation.

## P2-6 — photo source-risk classification

### Method and interpretation boundary

All 21 current Commons description revisions and the corresponding local
photos were inspected for event context. The classification is deliberately
binary and conservative: a regular-season, postseason, international,
All-Star-game, or ambiguous credentialed court context is
`game-action-high-risk`; only evidence-backed media-day, public-event,
fan-interaction, or documented preseason/tune-up warm-up context outside live
action is `non-event-low-risk`. Regular-season pregame and live preseason
competition remain high risk.

The low-risk label is relative source-context triage only. It does not validate
the uploader's authority, cure copyright or personality-rights risk, approve a
photo, or authorize public use. No image was replaced, removed, newly approved,
downloaded, or re-hosted in P2.

| Athlete           | Category                | Concise evidence basis                                                                                                                               | Fixed Commons revision                                                                                                                                                                     |
| ----------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Anfernee Simons   | `game-action-high-risk` | 2019-12-04 regular-season Kings–Blazers pregame court warm-up; not a preseason event.                                                                | [827612495](https://commons.wikimedia.org/w/index.php?title=File%3AAnferneeSimons_%28cropped%29.jpg&oldid=827612495)                                                                       |
| Anthony Edwards   | `game-action-high-risk` | 2021-12-01 Wizards–Timberwolves; formal uniform and on-court running action.                                                                         | [1258083226](https://commons.wikimedia.org/w/index.php?title=File%3AAnthony_Edwards_Kentavious_Caldwell-Pope_%2851734745028%29_%28cropped%29.jpg&oldid=1258083226)                         |
| Brandon Clarke    | `game-action-high-risk` | 2020-02-09 regular-season arena context; warm-up top does not remove credentialed game context.                                                      | [1214520256](https://commons.wikimedia.org/w/index.php?title=File%3ABrandon_Clarke_in_2020.jpg&oldid=1214520256)                                                                           |
| CJ McCollum       | `game-action-high-risk` | 2022 All-Star Weekend; formal uniform and visible jump-shot action.                                                                                  | [1183315853](https://commons.wikimedia.org/w/index.php?title=File%3ACJ_McCollum_%2851915243981%29_%28cropped%29.jpg&oldid=1183315853)                                                      |
| Damian Lillard    | `game-action-high-risk` | 2021-11-03 Trail Blazers at Cavaliers; formal uniform and game-court context.                                                                        | [1164388372](https://commons.wikimedia.org/w/index.php?title=File%3ADamian_Lillard_%282021%29_%28cropped%29.jpg&oldid=1164388372)                                                          |
| Danny Green       | `game-action-high-risk` | 2023-04-26 Knicks at Cavaliers postseason court context in formal uniform.                                                                           | [1223550468](https://commons.wikimedia.org/w/index.php?title=File%3ADanny_Green_2023_Cleveland_Cavaliers_vs._New_York_Knicks.jpg&oldid=1223550468)                                         |
| Dejounte Murray   | `game-action-high-risk` | 2022 NBA All-Star game context in formal uniform on court.                                                                                           | [912383643](https://commons.wikimedia.org/w/index.php?title=File%3ADejounte_Murray_2022.jpg&oldid=912383643)                                                                               |
| Dwight Powell     | `non-event-low-risk`    | Germany–Canada World Cup tune-up/exhibition; pregame warm-up layer and no visible possession or defensive action.                                    | [967381398](https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93021.jpg&oldid=967381398) |
| Ja Morant         | `game-action-high-risk` | 2021-11-05 Wizards–Grizzlies regular-season court context in formal uniform.                                                                         | [1092053012](https://commons.wikimedia.org/w/index.php?title=File%3AJa_Morant_2021.jpg&oldid=1092053012)                                                                                   |
| Jayson Tatum      | `game-action-high-risk` | 2024-12-15 Celtics–Wizards game context in formal uniform.                                                                                           | [1086996816](https://commons.wikimedia.org/w/index.php?title=File%3ACeltics_at_Wizards_2024-12-044_%28cropped_2%29.jpg&oldid=1086996816)                                                   |
| Joe Ingles        | `game-action-high-risk` | 2018-10-07 Utah–Portland preseason game; official game uniform and another on-court player, with no evidence establishing warm-up/non-event context. | [877365146](https://commons.wikimedia.org/w/index.php?title=File%3AJoe_Ingles_Utah_%28cropped%29.jpg&oldid=877365146)                                                                      |
| Kevin Durant      | `game-action-high-risk` | Paris 2024 Olympic/USA Basketball court context; not a listed non-event setting.                                                                     | [1222154671](https://commons.wikimedia.org/w/index.php?title=File%3AKevin_Durant%2C_Paris_2024_%28cropped%29.jpg&oldid=1222154671)                                                         |
| Kyrie Irving      | `game-action-high-risk` | 2022-01-17 Nets at Cavaliers regular-season court context, holding a ball in team warm-up gear.                                                      | [1196336722](https://commons.wikimedia.org/w/index.php?title=File%3AKyrie_Irving_%2851830909437%29_%28cropped%29.jpg&oldid=1196336722)                                                     |
| LaMelo Ball       | `game-action-high-risk` | 2022 NBA All-Star Game; formal uniform and visible dribbling action.                                                                                 | [1130229739](https://commons.wikimedia.org/w/index.php?title=File%3ALaMelo_Ball_%28cropped%29.jpg&oldid=1130229739)                                                                        |
| LeBron James      | `game-action-high-risk` | 2022-03-21 Lakers at Cavaliers; formal uniform and possession on the game court.                                                                     | [1251946740](https://commons.wikimedia.org/w/index.php?title=File%3ALeBron_James_%2851959977144%29_%28cropped2%29.jpg&oldid=1251946740)                                                    |
| Markelle Fultz    | `game-action-high-risk` | 2019-12-03 Wizards–Magic; formal uniform and active game-court context.                                                                              | [1130452222](https://commons.wikimedia.org/w/index.php?title=File%3AMarkelle_Fultz_%2850639078246%29.jpg&oldid=1130452222)                                                                 |
| Moritz Wagner     | `game-action-high-risk` | Germany–Canada preparation match with recorded score; formal uniform during the actual game.                                                         | [967382118](https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93145.jpg&oldid=967382118) |
| Ricky Rubio       | `game-action-high-risk` | 2021-11-03 regular-season pregame court context; not preseason, despite warm-up clothing.                                                            | [1079717911](https://commons.wikimedia.org/w/index.php?title=File%3ARicky_Rubio_%2851657225617%29_%28cropped%29.jpg&oldid=1079717911)                                                      |
| Thomas Bryant     | `game-action-high-risk` | 2022-01-25 Clippers at Wizards regular-season arena context in team warm-up gear.                                                                    | [1171979953](https://commons.wikimedia.org/w/index.php?title=File%3AThomas_Bryant_WSH_Wizards_2022.jpg&oldid=1171979953)                                                                   |
| Trae Young        | `non-event-low-risk`    | 2022 All-Star Weekend public-event context in an activity/warm-up vest, with no visible game action.                                                 | [1148485505](https://commons.wikimedia.org/w/index.php?title=File%3ATrae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg&oldid=1148485505)                                             |
| Tyrese Haliburton | `game-action-high-risk` | 2025-03-28 Pacers at Washington; formal uniform and arena game context.                                                                              | [1202611768](https://commons.wikimedia.org/w/index.php?title=File%3A1_tyrese_haliburton_2025_%28cropped_2%29.jpg&oldid=1202611768)                                                         |

Partition: 19 `game-action-high-risk`; 2 `non-event-low-risk`.

## Append-only implementation and owner-review impact

- Historical registry v1 remains byte-identical at SHA-256
  `770a7e6d7f13ecd0dda17a629b13f179357b9c64ebc268404a5640ad9aa08eec`.
- Historical registry v2 remains byte-identical at SHA-256
  `0fa9a14660d798b32586047eaec1a0fc14912ca8710aaccc83963ac4f9dc28d0`.
- Registry v3 binds the exact v2 bytes and adds only the four-field
  `sourceRiskClassification` object to each governed asset. Its final SHA-256
  is
  `d91e97aa34e347375dd5ca14cf961208ae4b2c43cc8a90a01bea49f1172a3c05`.
- The checker rejects v1/v2 byte drift, any v2→v3 projection change outside
  the new classification object, unsupported/missing categories, count drift,
  missing evidence/date/permalink, a permalink different from the exact
  attribution revision, a missing fixed non-clearance disclaimer, or a
  controlled set of explicit affirmative-clearance claims.
- The UI exposes the category, basis, verification date, and non-clearance
  warning alongside the existing fixed Commons revision attribution.

P2 changes renderer and policy copy, an append-only registry and generator,
fail-closed policy/checker tooling, tests, formatting exclusions for canonical
JSON, and governed local review artifacts only. It does not change
`src/content/cases/*.json`, any source manifest, source-review decision,
quarterly update, approved clinical string, case clinical digest, or
video/source digest. P2 creates no medical-review or public-release decision;
the BLOCKED/public-held state persists, and a future G6 clearance still requires
a new owner decision after artifact re-review and rights re-review. Because
renderer/site bytes and the governed review artifact change, the review-set and
private-dist-manifest are refreshed through the clean-commit cycle and returned
to the owner for artifact re-review.

## Validation

- Runtime: Node `v24.14.0`.
- Governance: the Decision 11 remediation plan passes
  `plan:assert-authorized`.
- Photo/source controls: `player-photos:verify`, `brand:verify`,
  `research:check`, `research:check-manifest`, and
  `research:registry:check` pass.
- Product checks: `check`, `content:check`, formatting, and
  `git diff --check` pass.
- Coverage run: 49 files and 891 tests pass; statement coverage is 87.28%.
- Review build: 41 pages and 831 image transforms; artifact verification covers
  26 case pages, 18 NBA video citations, and 69 one-to-one NBA source rows.
- Browser run: 196/196 Playwright checks pass across Chromium, Firefox, WebKit,
  and mobile Chromium.
- Lighthouse: 6/6 routes pass with accessibility score 1.00; maximum observed
  LCP is 1,955 ms.
- Release boundary: no push, deployment, indexing, external-account action,
  hosting-service action, or served-review receipt mutation was performed.
