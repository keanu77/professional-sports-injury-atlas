# Decision 14 Phase 3 cover adoption evidence

- Date checked: 2026-08-13
- Input commit: `eb81355228dd0605637864590ce397a8d47b5bf9`
- Scope: `decision-14-lowrisk-photographer-covers-only`
- Checker: `decision-14-photo-review`
- Result: **2 frozen photos adopted, 14 exact SVG selections retained**
- Current projection: **7 Commons photos / 14 original SVG fallbacks / 21
  athletes / 26 cases**
- Release state: private review only; push, deployment, indexing, public
  release, external-account mutation, hosting-configuration mutation, and
  clinical authoring/review remain closed

This phase downloaded only the two Phase 2 accepted originals, created the
append-only registry v6 successor, promoted the existing resolver and central
credit surface, and verified rendered behavior. Neither accepted work uses the
nba-v7 named-photographer event exception: both remain on the inherited nba-v6
`public-event-or-fan-interaction` branch. The frozen v7 allowlist is empty, so
zero event photos were admitted and no owner-risk field was synthesized.

## Frozen bindings and lineage

| Binding                 | SHA-256                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| Authorized plan         | `b6ee3bc4d0d2ad724014ac255cdb1b6ee76bb55aaa517e678601b931c95b7668` |
| Authorization JSON      | `0f92bf156976b111e1f6615985342cb5ee35adebd2b4773478316f0d71bf169b` |
| Registry v5 predecessor | `26129455fe5b9297c44ac91c3be1fc1678a928cf77bd12d00695614fe5df3985` |
| Registry v6 successor   | `16851aaa3d1dd223f20f102ef543f104a23ee61335a796f4b70cbe75d76d5cf0` |
| nba-v7 Markdown         | `61ed88f92d80b77cd2c1410d03305215eedbb391356c073fb19fac944dea2fd1` |
| nba-v7 canonical JSON   | `d1062c1ffa045397d13489319534acbfe24653615df5ce83aac40e40539a8b15` |

Registry v6 binds the exact v5 predecessor and exact final v7 pair. Its
same-version digest is frozen in the contract. The verifier also projects the
complete v6 selection set through the existing full v4 per-photo validator,
while separately enforcing the exact two-athlete delta, current-SVG lineage,
v7 empty-event-allowlist state, local bytes, five protected selections, and
21-athlete/26-case partition. Historical registries v1 through v5 are
unchanged.

## Adopted local originals

| Athlete        | Fixed Commons revision               | Local original                                      | Verified binary facts                                                                                                                                        | Crop check                                        |
| -------------- | ------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Damian Lillard | `1195923850`, `2026-04-12T04:32:09Z` | `src/assets/players/decision-14/damian-lillard.jpg` | 5,414,375 bytes; SHA-256 `ba8a0f23d721519e4796c89513f21a9e3c1d4fafe39f84a0192244162bb3abcf`; raw JPEG `5184x3456`, EXIF orientation 8, displayed `3456x5184` | focal `28% 35%`; subject safe at `5:2` and `16:9` |
| Jayson Tatum   | `756925233`, `2023-05-01T03:06:22Z`  | `src/assets/players/decision-14/jayson-tatum.jpg`   | 447,666 bytes; SHA-256 `0adddc2e2918f307434e18e79c96ed7bf2e852122bea0adc0c38203584d7cb78`; JPEG `2188x1680`, orientation 1                                   | focal `30% 35%`; subject safe at `5:2` and `16:9` |

The governed adoption script uses the exact queryless HTTPS originals, a
temporary file and atomic move, then fails closed on SHA-256, byte length, raw
dimensions, and EXIF orientation. The ordinary local Wikimedia edge returned
HTTP 429 during adoption; the successful run retained the same TLS hostname
and URL while routing to Wikimedia's `208.80.154.240` edge with curl
`--resolve`. No thumbnail, transformed rendition, or substitute work was
used.

Both works are exact `CC BY-SA 4.0`. Each row retains the same linked
`CC BY-SA 4.0` Adapter's License for the site's CSS crop contribution. Damian's
local original is otherwise unmodified. Jayson's row preserves the source's
ArcSoft Photostudio 5.5 color-balance, saturation, brightness, and contrast
edit disclosure. Both are ordinary HTML/CSS responsive placements only.

## Exact 16-slot before/after proof

Selection hashes are SHA-256 over canonical selection JSON. `Identical` means
the complete v5 selection subtree is byte-semantically unchanged in v6.

| Athlete           | v5 kind → v6 kind | v5 selection SHA-256                                               | v6 selection SHA-256                                               | Result / reason                                                                            |
| ----------------- | ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Anfernee Simons   | SVG → SVG         | `1990e076b9c5885e83e1f59e92548adeb5b3da3dc0bc2afb3120f2e413d28e37` | `1990e076b9c5885e83e1f59e92548adeb5b3da3dc0bc2afb3120f2e413d28e37` | Identical; regular-season pregame/warm-up cannot join the empty v7 allowlist.              |
| Anthony Edwards   | SVG → SVG         | `da5c84ffcee8e97e8543cfd5eed7280254fc9e00de34e5874ffb55820c9f3ee5` | `da5c84ffcee8e97e8543cfd5eed7280254fc9e00de34e5874ffb55820c9f3ee5` | Identical; FIFA context is `other`/event and Bryan Berlin is out of cycle.                 |
| Brandon Clarke    | SVG → SVG         | `8f6a00fc57c8b821defdd9d29bf4aebeeb9cf84d29fc1c808d8c9461310d43f8` | `8f6a00fc57c8b821defdd9d29bf4aebeeb9cf84d29fc1c808d8c9461310d43f8` | Identical; live regular-season action and empty allowlist.                                 |
| Damian Lillard    | SVG → photo       | `1f6760b9884906862d35942ecc29b165b50b33b6a5d92c169d8ad5e921101a1b` | `4b470fb0e459a0d74c096b2b163f58f6387eddf83bd8a98dcb173db539fa33db` | Adopted through inherited v6 public-event branch.                                          |
| Danny Green       | SVG → SVG         | `fa61f948249aa1bc3c6e6a0c1b1eb0538fc9b2a7c5ed3bc1a75e0c3548027194` | `fa61f948249aa1bc3c6e6a0c1b1eb0538fc9b2a7c5ed3bc1a75e0c3548027194` | Identical; Senior Day pixels do not disambiguate ceremony from credentialed court/pregame. |
| Dejounte Murray   | SVG → SVG         | `19b215ce48ed94183c11e0b63016e9bced9206a36b1801354432874e90059185` | `19b215ce48ed94183c11e0b63016e9bced9206a36b1801354432874e90059185` | Identical; government public domain is not CC0.                                            |
| Ja Morant         | SVG → SVG         | `8c935ce4b740663259dce6e3afb9f1dbd63088ec666eba5fa4343551de65bce1` | `8c935ce4b740663259dce6e3afb9f1dbd63088ec666eba5fa4343551de65bce1` | Identical; occasion and maker/account authority remain unresolved.                         |
| Jayson Tatum      | SVG → photo       | `d92bf4fa964e126e89e18ea2b13b9abab86d13d984705d485db4ab292d8a3c0f` | `3aace364ec8f80ba89c90b13a093a74f4994aaf4014f173ace357c7162bd3eba` | Adopted through inherited v6 public-event branch.                                          |
| Joe Ingles        | SVG → SVG         | `d11dac8a40b654a6f0af5bcc76f5c69b9e9fb1f6106c1c2fd68c6719c1b05e41` | `d11dac8a40b654a6f0af5bcc76f5c69b9e9fb1f6106c1c2fd68c6719c1b05e41` | Identical; live preseason competition and empty allowlist.                                 |
| LaMelo Ball       | SVG → SVG         | `66b69780acff6507d7fe968fd3eab287999c485771d02936d6c5c58e17c75c0a` | `66b69780acff6507d7fe968fd3eab287999c485771d02936d6c5c58e17c75c0a` | Identical; All-Star/live action and empty allowlist.                                       |
| Markelle Fultz    | SVG → SVG         | `1542939b048c2809dfa8df3a7f2e665368717bce1896cc69fbb73e9dc81c42fe` | `1542939b048c2809dfa8df3a7f2e665368717bce1896cc69fbb73e9dc81c42fe` | Identical; game action, empty allowlist, and strongest upstream unavailable.               |
| Moritz Wagner     | SVG → SVG         | `e0104aca9f4fdf59af46beb09b6ef42400ab99b3bda52e1a09bb54cffecbe0aa` | `e0104aca9f4fdf59af46beb09b6ef42400ab99b3bda52e1a09bb54cffecbe0aa` | Identical; live preparation match or regular-season pregame and empty allowlist.           |
| Ricky Rubio       | SVG → SVG         | `297bc1807f3e58dd37e94a0e9f8fe015104e2e57f06e85686905a240bed0a16c` | `297bc1807f3e58dd37e94a0e9f8fe015104e2e57f06e85686905a240bed0a16c` | Identical; credentialed-court context or missing occasion evidence.                        |
| Thomas Bryant     | SVG → SVG         | `f63e572cb488f3518fa03ee42eb5c52699e01f80ba6e63fae8f3cc4f6d24667d` | `f63e572cb488f3518fa03ee42eb5c52699e01f80ba6e63fae8f3cc4f6d24667d` | Identical; closed practice or game action.                                                 |
| Trae Young        | SVG → SVG         | `828e8831cc7466b9cfd467f981abf5f4541d6ebf540cadd7fbeee1946cd22ffd` | `828e8831cc7466b9cfd467f981abf5f4541d6ebf540cadd7fbeee1946cd22ffd` | Identical; ambiguous All-Star court context.                                               |
| Tyrese Haliburton | SVG → SVG         | `2a84acc987bd2e8d50a1a1b74e47469c4c190e398e2e02b602a20d9ed2e690ef` | `2a84acc987bd2e8d50a1a1b74e47469c4c190e398e2e02b602a20d9ed2e690ef` | Identical; regular-season action and empty allowlist.                                      |

The two new supersession records point to the exact v5 SVGs:

- Damian Lillard:
  `src/assets/players/decision-13/damian-lillard.svg`, SHA-256
  `a82bcb6e92ef03798745e8cb9f3458abe6cb37657d6111343a3a72e3cd89d226`.
- Jayson Tatum:
  `src/assets/players/decision-13/jayson-tatum.svg`, SHA-256
  `793a0aeb4f815a5e2c03340613e8646e92d8aacb4290164ffea2abe701280ade`.

Both rollback SVG files remain locally governed through the exact v5 binding.

## Five protected covers

All five complete selection subtrees compare equal between v5 and v6, and
their asset digests remain exact:

| Athlete       | Selection SHA-256 in v5 and v6                                     | Asset SHA-256                                                      |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| CJ McCollum   | `d373185dcef5842cd687236173805e21b32de1c65fc502aa00d44c4642ccdeec` | `5688298371c4ec218dae6f5131685f4ab511fab6d0797685146953235c8c7e45` |
| Dwight Powell | `5c824ed878a6bd974c5f40f4870b5b52c9856f5aefa26e12aa76edd5a59b3732` | `d1cab51c99f25b380d05d14bd5fe4f826b51042d4c007a7d105a7240265cd211` |
| Kevin Durant  | `5b2090e72be38fe535dd2547f424d6b3195883f44b8fa3a520d48fea8450583d` | `6f18766d49193c6858d607ae26551ba6c4422eebefb535ca2805ccd8b54e956d` |
| Kyrie Irving  | `6855ed64229a83f84ee124d3fbddb471da8077dab860a1fe40f0f2c0ed5e4475` | `4f631559835221f8276ef7b1ee09b4435a5003ad9a50614bb0c72673dec745b6` |
| LeBron James  | `81303b22c82f6f7705098f4e7c0805967e194e03003c01761d98ded71382b880` | `8f5550b3acc78302a465a84b9e78f62d466e484fbfec1e3c1054e9123457680c` |

Their factual captions and all rights/source facts are untouched.

## Captions, credits, and risk separation

- Damian caption: `Damian Lillard 於 2014 年芝加哥 63rd Street Beach
世界籃球節公開舞台；非本案例受傷當下影像`; central anchor
  `photo-credit-1195923850`.
- Jayson caption: `Jayson Tatum 於 2018 NBA
全明星週末公開訪談舞台；非本案例受傷當下影像`; central anchor
  `photo-credit-756925233`.
- Both central rows expose photographer, title `not-supplied`, exact
  `CC BY-SA 4.0`, fixed revision, alteration disclosure, three
  `not-supplied` notice states, same-person uploader relationship, factual
  occasion, and non-clearance statement.
- Both have `sourceRiskClassification=non-event-low-risk` and separately
  `photographerRiskEvidence=independent-public-event-low-risk`.
- Neither row contains `eventPhoto`, `credentialed-access-residual-risk`, the
  Decision 14 owner path, or owner heading. Those fields remain mandatory only
  for an actual v7 conditional-event selection; this cycle has none.
- Reader-facing global copy now describes the conditional non-event/event
  policy accurately. The Decision 13 single medical disclaimer and adjacent
  link to the central credits route remain intact; no duplicate global medical
  or owner-risk statement was introduced.

## Render, composition, clinical, and closed-scope proof

- Resolver and credits consume only registry v6. Astro eagerly imports exact
  local `decision-13` and `decision-14` assets; runtime remote image requests
  remain zero.
- Rendered case distribution is 9 photo-backed case covers and 17 SVG-backed
  case covers. Both new covers retain descriptive alt text, factual captions,
  central anchors, responsive AVIF/WebP renditions, keyboard/no-JavaScript
  access, and Axe-clean markup.
- `brand:verify` found no ShareAlike composition, new unreviewed consumer,
  player-photo social/OG metadata, remote thumbnail, logo, or endorsement
  claim. The two BY-SA originals are absent from every baked design output.
- Decision 13 clinical freeze: `30/30`, digest
  `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.
  `git diff --name-only -- src/content/cases src/content/injuries
src/content/updates` returned empty.
- No push, deployment, indexing, public release, external-account change,
  service/configuration change, or clinical-content/review action occurred.

## Phase 3 validation results

All commands ran under Node `v24.14.0`:

- `npm run test:unit`: **55 files, 1031/1031 tests passed**.
- `npm run test:e2e`: **224/224 Playwright checks passed** across Chromium,
  Firefox, WebKit, and JavaScript-disabled coverage.
- `npm exec -- tsc --noEmit`: passed.
- `npm run check`: Astro diagnostics passed with 0 errors and 0 warnings.
- `npm run content:check`: 26 cases, 3 overviews, 1 update; passed.
- `npm run player-photos:v6:check`: exact digest passed.
- `npm run player-photos:verify`: 7/14 and 26-case projection passed.
- `npm run source-policy:v7:check`: exact v7 digest passed.
- `npm run brand:verify`: provenance and BY-SA isolation passed.
- `npm run decision13:clinical-freeze`: 30/30 passed.
- `npm run plan:verify`, `plan:decision:verify`, and positive
  `plan:assert-authorized`: passed.
- `npm run format:check` and `git diff --check`: passed.

Phase 4 must start from the clean commit containing this bounded source,
registry, asset, UI, test, and evidence change.
