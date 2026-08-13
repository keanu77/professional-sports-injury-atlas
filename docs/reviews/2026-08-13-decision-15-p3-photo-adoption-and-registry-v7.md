# Decision 15 Phase 3 photo adoption and registry v7

- Checked: 2026-08-14
- Runtime: Node `v24.14.0`
- Input commit: `0afad8d4759ca49c93a2c4932454df6f3564c2da`
- Scope: `decision-15-photo-first-covers-only`
- Result: **14 frozen photos adopted; 21 photos / 0 SVG fallbacks / 21
  athletes / 26 cases**
- Release state: private review only; public release, deployment, indexing,
  external-account mutation, remote-repository mutation, and hosting
  reconfiguration remain closed

Phase 3 adopted exactly the 14 candidates frozen as
`qualified-from-frozen-evidence` in Phase 1. Phase 2's search queue was empty,
so no supplemental candidate was substituted. The seven photos already current
in registry v6 remain byte- and selection-identical. Registry v7 is an
append-only full successor; registries v1 through v6 were not rewritten.

## Frozen bindings and lineage

| Binding                     | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Authorized Decision 15 plan | `c437934088648ac2b31fbc65b5fe32726d201fad9b361c4c658afc46fe4ec86d` |
| Owner authorization JSON    | `e1354757fb25e6a3a72f2d7e69b04951044ae459b3033ab7529dc57add0aa97a` |
| Phase 0 baseline evidence   | `60b6b2d5498d577f1774e5a02f8b0eb033d64f0ec1fe7f3b52d5a54070c60e11` |
| Phase 1 adjudication        | `d2693d9dbba52d647cbad7759c86ab9891a21e4ac5e06d42b96032744606c26e` |
| Phase 2 zero-search result  | `888414d0894b9dfb608063788671d25d74fe5524d2a84876d6081cb914f28498` |
| nba-v8 Markdown             | `20a9209bd523604efe3251f6ef159e6432fa9280951ea16d630ee02cc347557d` |
| nba-v8 canonical JSON       | `30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e` |
| Registry v6 predecessor     | `16851aaa3d1dd223f20f102ef543f104a23ee61335a796f4b70cbe75d76d5cf0` |
| Registry v7 successor       | `77a146729b95802fbe978bc8a4360ed54929121936a04454afe49998ea93b0c4` |

Registry v7 binds the exact registry v6 predecessor, both exact nba-v8 files,
and the exact Phase 1 and Phase 2 evidence. Its deterministic generator
reproduces the committed bytes. Every current selection is a local
`commons-photo`; there is no current SVG selection and no unreviewed fallback
substitution.

## Original-binary adoption

The adoption script pins Node `v24.14.0`, accepts only exact HTTPS Commons
original-file URLs, rejects thumbnail redirects, downloads serially with the
owner-specified descriptive User-Agent, waits five seconds between downloads,
uses 60/120/240-second 429 backoff for at most five retries, and gives each
transfer 600 seconds. Existing destinations are never overwritten.

Eleven already-present Decision 15 originals were validated in place and were
not downloaded again. The missing Thomas Bryant, Trae Young, and Tyrese
Haliburton originals each returned HTTP 200 and were then checked before atomic
installation. All 14 local files independently match the frozen MediaWiki
SHA-1, exact byte length, MIME, dimensions, complete JPEG framing, and the
recorded local SHA-256:

| Athlete           | Fixed Commons revision | Local original                                         |     Bytes / dimensions | MediaWiki SHA-1                            | Local SHA-256                                                      |
| ----------------- | ---------------------- | ------------------------------------------------------ | ---------------------: | ------------------------------------------ | ------------------------------------------------------------------ |
| Anfernee Simons   | `827612495`            | `src/assets/players/decision-15/anfernee-simons.jpg`   |  1,365,032 / 2563x3070 | `ebad62aead18a3f41498c2760e7100303605e5c3` | `2c651d636a979b4e838c28817e56ce56917d7b216fc6e59603075654a067fd7e` |
| Anthony Edwards   | `1253738497`           | `src/assets/players/decision-15/anthony-edwards.jpg`   |  4,531,034 / 3333x5000 | `51b1d4498043862a969fad316724115ee834b918` | `bc9cabfae1125da0d4520397260c72909473e536b0e027aa447c78576ea82455` |
| Brandon Clarke    | `1244619086`           | `src/assets/players/decision-15/brandon-clarke.jpg`    |  3,872,559 / 1892x3000 | `c5c5429b5f70bae7a354622a7cdd32a253775556` | `b864f9073782b2556d93a593d44bd36498234a68f692fe6b5fcfb3bbffab1c3f` |
| Danny Green       | `1088225177`           | `src/assets/players/decision-15/danny-green.jpg`       |       74,488 / 640x480 | `d1286f2fa1a02eb229f5a095f364a450e6d2cb7b` | `c9752a7cd9604e24126076812b3ba67883ac694857a196c3f6c893ced735f112` |
| Dejounte Murray   | `1199576196`           | `src/assets/players/decision-15/dejounte-murray.jpg`   |  1,583,907 / 2602x1870 | `1c0d39ee222223567aeb4e19a80bf8150210be19` | `01cd99a39fad8138a6eae8084b4c91f2e01cc82c8f677d1d71bd8afdb78da798` |
| Ja Morant         | `981268435`            | `src/assets/players/decision-15/ja-morant.jpg`         |  1,842,653 / 4796x3197 | `2295ea14f7883f33de3fefc9a425052e194cb21c` | `29f451b2c9b61ed00ac3cbf5208b61438108faab6a626e749b82c0a622671b56` |
| Joe Ingles        | `877365146`            | `src/assets/players/decision-15/joe-ingles.jpg`        |  1,090,689 / 1453x2334 | `ea5ad8bffa1b0fba6805d7725ae90c4688966864` | `9cf8ccdc7221deede6df154ecb1201534165c86f35a49a4330afa0e4f034b44a` |
| LaMelo Ball       | `1130229739`           | `src/assets/players/decision-15/lamelo-ball.jpg`       |  7,261,079 / 2415x3242 | `c46d8d44ae566670b012801f4874d81520e4e81c` | `611c8be59bbb4c671753ccc7a33ccf8de57c3d28d26f1bf8f58aab454541fc7f` |
| Markelle Fultz    | `1130452222`           | `src/assets/players/decision-15/markelle-fultz.jpg`    |  5,387,248 / 2600x3899 | `0d1c39b3e7a0f60dcac7afecef7c8eea19888bac` | `a159eaad7777cd6825ec2db2ac959dcdf526aa241d71c58d2c62a2ff78a3a73f` |
| Moritz Wagner     | `967382118`            | `src/assets/players/decision-15/moritz-wagner.jpg`     |    494,333 / 1071x1145 | `707f1a01f2ea6a642f8fc97d49d7092de16c487d` | `bcfe61a1b69129db077900592b8113ef282a12a0558707ba92e38d5e6dc58373` |
| Ricky Rubio       | `1179110385`           | `src/assets/players/decision-15/ricky-rubio.jpg`       |  2,144,172 / 3072x4608 | `e9bd49908fe9e5945d0aa16f9dd2d816340a75fd` | `5e1245b16c4ba4e8d95100c40eeb360e6318a6716106bef1f62bf9667a101709` |
| Thomas Bryant     | `957946914`            | `src/assets/players/decision-15/thomas-bryant.jpg`     |  1,345,351 / 2612x3919 | `d2f87cf6324edfc9039ccc1e6e4994577bacc7f7` | `b651bb59f1caa3dfe67ff81ab524610002b8c677f710206111d58b5d6c9d589b` |
| Trae Young        | `1148485505`           | `src/assets/players/decision-15/trae-young.jpg`        | 39,619,306 / 6351x5504 | `193bb8a75e73f878359d136f0769205a4a8693ba` | `b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0` |
| Tyrese Haliburton | `1202611768`           | `src/assets/players/decision-15/tyrese-haliburton.jpg` |  6,113,037 / 2063x3169 | `45d283ff520c757dc5eeb4993aa24b3ca91a7b13` | `8a307fe26217d5c951d8647367207cb6c383a83ea96b1c6361e969ab1c914270` |

## Exact rights, attribution, notices, and crop treatment

All local files are unmodified source originals. Rendering uses only an
ordinary responsive rendition plus a disclosed CSS `object-fit: cover` crop.
Every row is subject-safe at both 5:2 and 16:9. “None supplied” below means the
fixed source did not supply a separate title or per-file notice; it is not an
omission of a supplied condition.

| Athlete           | Exact status / displayed credit                                                                                                        | Supplied title or per-file notices                                                                                              | Source alteration and site focal point                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Anfernee Simons   | CC BY-SA 4.0 — Frenchieinportland                                                                                                      | None supplied                                                                                                                   | Commons CropTool derivative; CSS crop at `50% 13%`            |
| Anthony Edwards   | CC BY-SA 4.0 — Bryan Berlin / WikiPortraits                                                                                            | `Personality rights warning`                                                                                                    | No source crop declared; CSS crop at `50% 13%`                |
| Brandon Clarke    | CC BY 2.0 — Erik Drost                                                                                                                 | None supplied                                                                                                                   | Commons cropped/extracted derivative; CSS crop at `50% 5%`    |
| Danny Green       | CC BY 2.0 — Des Runyan                                                                                                                 | Title `P1010646.JPG`                                                                                                            | No source crop declared; CSS crop at `50% 45%`                |
| Dejounte Murray   | **Public domain, `PD-USGov-Military-Navy`** — `U.S. Navy photo by Mass Communication Specialist 2nd Class Shayla D. Hamilton/Released` | Title `Dejounte Murray Tours the METC`; notice `/Released`                                                                      | No source crop declared; CSS crop at `72% 45%`                |
| Ja Morant         | CC BY 2.0 — Katie Dugan / Gamecock Central                                                                                             | Title `Ja Morant`                                                                                                               | No source crop declared; CSS crop at `45% 40%`                |
| Joe Ingles        | CC BY-SA 4.0 — Frenchieinportland                                                                                                      | None supplied                                                                                                                   | Commons crop derivative; CSS crop at `50% 8%`                 |
| LaMelo Ball       | CC BY 2.0 — Erik Drost                                                                                                                 | Title `LaMelo Ball`; copyright `Erik Drost`                                                                                     | Commons CropTool derivative; CSS crop at `50% 4%`             |
| Markelle Fultz    | CC BY-SA 2.0 — Mogami Kariya                                                                                                           | Title `Markelle Fultz`                                                                                                          | No source crop declared; CSS crop at `50% 12%`                |
| Moritz Wagner     | CC BY-SA 4.0 — Sandro Halank, Wikimedia Commons                                                                                        | Title `Basketball-Länderspiel: Deutschland gegen Kanada`; copyright `Sandro Halank, CC BY-SA 4.0`; `Personality rights warning` | No source crop declared; CSS crop at `50% 10%`                |
| Ricky Rubio       | CC BY 2.0 — Joe Bielawa                                                                                                                | Title `Lynx.DSC_0676.5:20:12`                                                                                                   | No source crop declared; CSS crop at `42% 16%`                |
| Thomas Bryant     | CC BY-SA 4.0 — TonyTheTiger                                                                                                            | None supplied                                                                                                                   | No source crop declared; CSS crop at `67% 0%`                 |
| Trae Young        | CC BY 2.0 — Erik Drost                                                                                                                 | Title `Trae Young`; copyright `Erik Drost`                                                                                      | Commons extraction/CropTool derivative; CSS crop at `50% 35%` |
| Tyrese Haliburton | CC BY-SA 4.0 — Chensiyuan                                                                                                              | None supplied                                                                                                                   | Commons extraction/CropTool derivative; CSS crop at `50% 8%`  |

Murray has `license: null`. Registry and reader presentation retain the exact
`PD-USGov-Military-Navy` marker, DVIDS source link, Navy credit, title, and
`/Released` notice. No CC0 label, Creative Commons license, license version, or
Adapter's License is invented for that work.

The seven new ShareAlike works—Anfernee Simons, Anthony Edwards, Joe Ingles,
Markelle Fultz, Moritz Wagner, Thomas Bryant, and Tyrese Haliburton—are
`placement-rendition-only`. Their crop-only Adapter's License is the same
version as the source work: BY-SA 2.0 for Fultz and BY-SA 4.0 for the other six.
They are forbidden inputs to case-card, infographic, OG, social, and equivalent
baked compositions. The mechanical brand guard covers all 12 current BY-SA
photos and reports no composed use.

## Different-injury-event proof

| Athlete           | Governed case(s)                                                             | Source event proven different from governed injury event(s)                 |
| ----------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Anfernee Simons   | `CASE-NBAANKLE-2023-004`                                                     | 2019-12-04 Kings–Blazers pregame/warm-up vs 2023-02-14 injury               |
| Anthony Edwards   | `CASE-NBAANKLE-2023-001`, `CASE-NBAANKLE-2025-001`                           | 2026-07-07 Argentina–Egypt appearance vs 2023-03-17 and 2025-04-03 injuries |
| Brandon Clarke    | `CASE-NBAACHILLES-2023-010`                                                  | 2022-01-04 Memphis–Cleveland game vs 2023-03-03 injury                      |
| Danny Green       | `CASE-NBAACL-2022-017`                                                       | 2009-03-08 Senior Day vs 2022-05-12 injury                                  |
| Dejounte Murray   | `CASE-NBAACHILLES-2025-014`                                                  | 2019-02-27/28 METC visit vs 2025-01-31 injury                               |
| Ja Morant         | `CASE-NBAANKLE-2020-001`                                                     | 2019-07-28 source metadata vs 2020-12-28 injury                             |
| Joe Ingles        | `CASE-NBAACL-2022-016`                                                       | 2018-10-07 Utah–Portland preseason vs 2022-01-30 injury                     |
| LaMelo Ball       | `CASE-NBAANKLE-2022-001`, `CASE-NBAANKLE-2023-008`, `CASE-NBAANKLE-2025-002` | 2022-02-20 All-Star Game vs 2022-11-16, 2023-11-26, and 2025-01-27 injuries |
| Markelle Fultz    | `CASE-NBAACL-2021-009`                                                       | 2019-12-03 Wizards–Magic game vs 2021-01-06 injury                          |
| Moritz Wagner     | `CASE-NBAACL-2024-023`                                                       | 2023-08-09 Germany–Canada preparation match vs 2024-12-21 injury            |
| Ricky Rubio       | `CASE-NBAACL-2021-015`                                                       | 2012-05-20 Lynx game vs 2021-12-28 injury                                   |
| Thomas Bryant     | `CASE-NBAACL-2021-010`                                                       | 2015-03-29 closed practice vs 2021-01-09 injury                             |
| Trae Young        | `CASE-NBAANKLE-2021-001`                                                     | 2022-02-19 All-Star Weekend vs 2021-04-21 injury                            |
| Tyrese Haliburton | `CASE-NBAACHILLES-2025-017`                                                  | 2025-03-28 Pacers–Wizards game vs 2025-06-22 injury                         |

## Seven protected current photos

The complete selection subtrees compare canonically equal between v6 and v7,
and their exact local asset digests remain:

| Athlete        | Local asset SHA-256                                                |
| -------------- | ------------------------------------------------------------------ |
| CJ McCollum    | `5688298371c4ec218dae6f5131685f4ab511fab6d0797685146953235c8c7e45` |
| Damian Lillard | `ba8a0f23d721519e4796c89513f21a9e3c1d4fafe39f84a0192244162bb3abcf` |
| Dwight Powell  | `d1cab51c99f25b380d05d14bd5fe4f826b51042d4c007a7d105a7240265cd211` |
| Jayson Tatum   | `0adddc2e2918f307434e18e79c96ed7bf2e852122bea0adc0c38203584d7cb78` |
| Kevin Durant   | `6f18766d49193c6858d607ae26551ba6c4422eebefb535ca2805ccd8b54e956d` |
| Kyrie Irving   | `4f631559835221f8276ef7b1ee09b4435a5003ad9a50614bb0c72673dec745b6` |
| LeBron James   | `8f5550b3acc78302a465a84b9e78f62d466e484fbfec1e3c1054e9123457680c` |

Their source, attribution, notice, crop, caption, and case projections are
unchanged. The prior 14 Decision 13 SVGs remain present as exact rollback
assets and are referenced by each new selection's supersession record, but no
SVG is current in the v7 projection.

## Reader presentation and non-clearance

The resolver consumes only registry v7 and local Decision 13/14/15 image
assets. Every rendered photo has an adjacent link to its central credit row.
The central page exposes the fixed Commons revision, exact CC terms or exact PD
status/source, displayed credit, supplied title/notices, alteration disclosure,
factual different-event caption, and applicable crop-only Adapter's License.
There are no runtime Commons/Flickr thumbnails.

The owner's three accepted unresolved risks remain named and are not converted
into clearance:

1. 持證攝影記者授權自始無效的風險（Flickr-washing）
2. 封閉練習場地規範風險
3. 授權人身分無法追溯的風險

CC and public-domain facts address copyright only. They do not establish
photographer identity or licensing authority and do not create personality,
portrait, publicity, privacy, endorsement, venue, league, team, contract,
medical, legal-use, or public-release clearance.

## Phase 3 validation

All Phase 3 checks ran under Node `v24.14.0`:

- The adoption script validated **14/14** exact originals, including fixed
  MediaWiki SHA-1, local SHA-256, bytes, dimensions, MIME, and JPEG framing.
- Registry v7 deterministic check passed at
  `77a146729b95802fbe978bc8a4360ed54929121936a04454afe49998ea93b0c4`.
- Player-photo verification passed: **21 photos / 0 SVG / 26 cases**.
- Registry v7 contract subset passed: **7/7** tests.
- Decision 15 contract subset passed: **69/69** tests.
- Source policy v8 reproduced exact digest
  `30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e`.
- Clinical freeze passed: **30/30** files, aggregate
  `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.
- Full unit, type, Astro, formatting, Playwright, brand/BY-SA, governance, and
  whitespace results are recorded in the Phase 4 final-validation report.

No clinical file, historical policy/registry/evidence byte, bound plan,
authorization JSON, indexing setting, public artifact, remote repository, or
external account changed in Phase 3. Nothing was pushed, deployed, indexed, or
publicly released.
