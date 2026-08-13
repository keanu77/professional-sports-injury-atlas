# Decision 14 Phase 0 governance and v7 contract

- Date: 2026-08-13
- Scope: `decision-14-lowrisk-photographer-covers-only`
- Status: Phase 0 contract frozen; Phase 1 allowlist research is the next gate
- Release state: private medical review; public release and indexing remain closed
- Authority: 吳易澄醫師, `2026-08-13T12:53:37Z`
- Authorized-start commit: `788b5cee297492db7b76db390fddfe64a5d37589`

Phase 0 freezes the Decision 13 product and operational baseline and defines a
name-independent, fail-closed contract before any photographer is reviewed. It
does not name or allowlist a photographer, search for or adopt a candidate,
download an image, create `nba-v7`, create a player-photo registry successor,
change a current cover, or make a public-use clearance finding.

## Authorization and immutable governance inputs

Every Node/npm command used the pinned
`/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin/node`, which
reported `v24.14.0`. The authorization commit contains only the owner-supplied
strict decision and the plan binding.

| Input                    | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| Decision 14 plan         | `b6ee3bc4d0d2ad724014ac255cdb1b6ee76bb55aaa517e678601b931c95b7668` |
| Owner authorization JSON | `0f92bf156976b111e1f6615985342cb5ee35adebd2b4773478316f0d71bf169b` |
| Authorized plan binding  | `3a2ffe797a0b1bac5f4e8d876a97170cafb93deda022dd3806fd8542fcf47b5f` |

The authorization preflight positively passed:

```text
npm run plan:verify
npm run plan:decision:verify -- --decision docs/decisions/2026-08-13-decision-14-lowrisk-photographer-covers-authorization.v1.json --plan docs/superpowers/plans/2026-08-13-decision-14-lowrisk-photographer-covers.md
npm run plan:assert-authorized -- docs/superpowers/plans/2026-08-13-decision-14-lowrisk-photographer-covers.md
```

Measured results were 24 bound documents, exact decision digest
`0f92bf15…169b`, and a positive authorization assertion for role
`decision-14-lowrisk-photographer-covers`, scope
`decision-14-lowrisk-photographer-covers-only`, and the eight unchanged closed
scopes.

## Immutable policy and registry lineage

Decision 14 may only append successors. The following historical files were
measured from the authorized-start tree and remain byte-identical:

| Immutable input                                    | SHA-256                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `research/source-policy/nba.v1.md`                 | `f983c682d3504902ff9ae8a57cbd414e4855de2abbb3b6f2855d3532df8fed46` |
| `research/source-policy/source-policy.v1.json`     | `a588b68f3468bec8d24cda9005435ecb0177cc74dbaff7d14f793ec45dcdd280` |
| `research/source-policy/nba.v2.md`                 | `b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570` |
| `research/source-policy/source-policy.v2.json`     | `6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07` |
| `research/source-policy/nba.v3.md`                 | `7dc98d1146ffe701a312694512bfe513f27d3edb8ecaeeb2f933a92f9fb32ca2` |
| `research/source-policy/source-policy.v3.json`     | `284a88792f281564799eeae6b62646b855072725824ef21f3cea4204a3d14270` |
| `research/source-policy/nba.v4.md`                 | `929ac5f125db222d8eb6e98a3a52b1778ebd28c743884c945ab917619ebd5994` |
| `research/source-policy/source-policy.v4.json`     | `3320fe2051fc091aa055d5cdd8bcdacf24073c3964cac3d1a982666a2aafbf68` |
| `research/source-policy/nba.v5.md`                 | `a59111d915caeb7f1e8f730492e826be63ff95fb5b1feeb1576eeb75a95e6aae` |
| `research/source-policy/source-policy.v5.json`     | `5f38066ce0ef0c10f0494856f90114dc403c068986b4c323cbb2ef3ebbda56ac` |
| `research/source-policy/nba.v6.md`                 | `b9a469344ff5061546619ea0ecbb5b7320965af40cde254d4939cf2e8835b0c1` |
| `research/source-policy/source-policy.v6.json`     | `1e27041de184b7b6397b2cfdde225706b40696f1d4456757193baa340f4cc93c` |
| `src/assets/players/player-photo-registry.v1.json` | `770a7e6d7f13ecd0dda17a629b13f179357b9c64ebc268404a5640ad9aa08eec` |
| `src/assets/players/player-photo-registry.v2.json` | `0fa9a14660d798b32586047eaec1a0fc14912ca8710aaccc83963ac4f9dc28d0` |
| `src/assets/players/player-photo-registry.v3.json` | `d91e97aa34e347375dd5ca14cf961208ae4b2c43cc8a90a01bea49f1172a3c05` |
| `src/assets/players/player-photo-registry.v4.json` | `ef7149b57ab5d08a328a0a7ed88177fc4d6a35af998bcfd95a0ec318bcf345b5` |
| `src/assets/players/player-photo-registry.v5.json` | `26129455fe5b9297c44ac91c3be1fc1678a928cf77bd12d00695614fe5df3985` |
| Decision 13 Phase 1 evidence                       | `823be69338a4fdc6029750ac8003c84e0ebd4837106b6237e5082e20c6e50e1d` |

The eventual `nba-v7` pair must bind the exact v6 JSON and Markdown bytes
above. The eventual registry successor must bind the exact v5 registry bytes.
Same-version edits and any changed predecessor digest fail closed.

The baseline generator additionally runs `git diff --quiet` against authorized
start `788b5cee…` over every policy, registry, selection asset, clinical file,
review artifact, notice/credit source, service source, and governed input that
it reads. A descendant commit or dirty worktree may contain new Phase 0 files,
but any changed baseline path aborts instead of being mislabeled as the
authorized-start tree.

## Current 21-athlete / 26-case cover baseline

Selection SHA-256 values below are computed over each complete canonical JSON
selection subtree; asset SHA-256 values are computed over the local file bytes.
This makes field drift independently visible from local-byte drift.

| Athlete           | Cases                                                                        | v5 cover | Local asset SHA-256                                                | Selection SHA-256                                                  |
| ----------------- | ---------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Anfernee Simons   | `CASE-NBAANKLE-2023-004`                                                     | SVG      | `2cccee620a61d139cf45df54248cf3eb730ca25a97c78950550143ea517062da` | `1990e076b9c5885e83e1f59e92548adeb5b3da3dc0bc2afb3120f2e413d28e37` |
| Anthony Edwards   | `CASE-NBAANKLE-2023-001`, `CASE-NBAANKLE-2025-001`                           | SVG      | `8b939edf0eab3be601e558c3187e411ad7569448e3ddeda8ad443aa6a2999272` | `da5c84ffcee8e97e8543cfd5eed7280254fc9e00de34e5874ffb55820c9f3ee5` |
| Brandon Clarke    | `CASE-NBAACHILLES-2023-010`                                                  | SVG      | `c621544de4a32fb0ad92ac3d611e77db913ab8292c08410e26db0cf1a4d111e0` | `8f6a00fc57c8b821defdd9d29bf4aebeeb9cf84d29fc1c808d8c9461310d43f8` |
| CJ McCollum       | `CASE-NBAANKLE-2020-002`                                                     | Commons  | `5688298371c4ec218dae6f5131685f4ab511fab6d0797685146953235c8c7e45` | `d373185dcef5842cd687236173805e21b32de1c65fc502aa00d44c4642ccdeec` |
| Damian Lillard    | `CASE-NBAACHILLES-2025-015`                                                  | SVG      | `a82bcb6e92ef03798745e8cb9f3458abe6cb37657d6111343a3a72e3cd89d226` | `1f6760b9884906862d35942ecc29b165b50b33b6a5d92c169d8ad5e921101a1b` |
| Danny Green       | `CASE-NBAACL-2022-017`                                                       | SVG      | `ed6804a361a5cdc0006151e3538b91aed2f39977b7882e889493e103f7ed2416` | `fa61f948249aa1bc3c6e6a0c1b1eb0538fc9b2a7c5ed3bc1a75e0c3548027194` |
| Dejounte Murray   | `CASE-NBAACHILLES-2025-014`                                                  | SVG      | `6ad3d68a744d8373ef7a8e0fd82a96c5405f43aba971e203fd82b81d8102004c` | `19b215ce48ed94183c11e0b63016e9bced9206a36b1801354432874e90059185` |
| Dwight Powell     | `CASE-NBAACHILLES-2020-008`                                                  | Commons  | `d1cab51c99f25b380d05d14bd5fe4f826b51042d4c007a7d105a7240265cd211` | `5c824ed878a6bd974c5f40f4870b5b52c9856f5aefa26e12aa76edd5a59b3732` |
| Ja Morant         | `CASE-NBAANKLE-2020-001`                                                     | SVG      | `b4b26eecf67ab52ed32b32a703e7482be2dfff3653ad55eba5175bdbb4bbd3d9` | `8c935ce4b740663259dce6e3afb9f1dbd63088ec666eba5fa4343551de65bce1` |
| Jayson Tatum      | `CASE-NBAACHILLES-2025-016`                                                  | SVG      | `793a0aeb4f815a5e2c03340613e8646e92d8aacb4290164ffea2abe701280ade` | `d92bf4fa964e126e89e18ea2b13b9abab86d13d984705d485db4ab292d8a3c0f` |
| Joe Ingles        | `CASE-NBAACL-2022-016`                                                       | SVG      | `bd132701afb690e79f02e9378a8d5a7db4ab8b29de31a234f5d9f2d2ed53a40a` | `d11dac8a40b654a6f0af5bcc76f5c69b9e9fb1f6106c1c2fd68c6719c1b05e41` |
| Kevin Durant      | `CASE-NBAACHILLES-2019-005`, `CASE-NBAANKLE-2024-001`                        | Commons  | `6f18766d49193c6858d607ae26551ba6c4422eebefb535ca2805ccd8b54e956d` | `5b2090e72be38fe535dd2547f424d6b3195883f44b8fa3a520d48fea8450583d` |
| Kyrie Irving      | `CASE-NBAACL-2025-021`, `CASE-NBAANKLE-2021-002`                             | Commons  | `4f631559835221f8276ef7b1ee09b4435a5003ad9a50614bb0c72673dec745b6` | `6855ed64229a83f84ee124d3fbddb471da8077dab860a1fe40f0f2c0ed5e4475` |
| LaMelo Ball       | `CASE-NBAANKLE-2022-001`, `CASE-NBAANKLE-2023-008`, `CASE-NBAANKLE-2025-002` | SVG      | `cb564f0969076e33f6071f6aa22797ff8a1bcca270da2363ce0cf03352e1d505` | `66b69780acff6507d7fe968fd3eab287999c485771d02936d6c5c58e17c75c0a` |
| LeBron James      | `CASE-NBAANKLE-2021-003`                                                     | Commons  | `8f5550b3acc78302a465a84b9e78f62d466e484fbfec1e3c1054e9123457680c` | `81303b22c82f6f7705098f4e7c0805967e194e03003c01761d98ded71382b880` |
| Markelle Fultz    | `CASE-NBAACL-2021-009`                                                       | SVG      | `882ddf275717f24be9a0e56b7af868beb7e6217365cbc435c4dd7fc1c6dc0b42` | `1542939b048c2809dfa8df3a7f2e665368717bce1896cc69fbb73e9dc81c42fe` |
| Moritz Wagner     | `CASE-NBAACL-2024-023`                                                       | SVG      | `c8d8f3f6caeb9490e9862ac12dc0bb5a4ab34e710b79e0431a7cfc1bbf5956fc` | `e0104aca9f4fdf59af46beb09b6ef42400ab99b3bda52e1a09bb54cffecbe0aa` |
| Ricky Rubio       | `CASE-NBAACL-2021-015`                                                       | SVG      | `46befffc187be9a1df332ff8001945a1a1b5bb6b7be21285435fec1190402043` | `297bc1807f3e58dd37e94a0e9f8fe015104e2e57f06e85686905a240bed0a16c` |
| Thomas Bryant     | `CASE-NBAACL-2021-010`                                                       | SVG      | `4f8639171dadb0aed4f28a0d3cdd66679f1cfcc7f9e19339c40fb5e1ec0b047a` | `f63e572cb488f3518fa03ee42eb5c52699e01f80ba6e63fae8f3cc4f6d24667d` |
| Trae Young        | `CASE-NBAANKLE-2021-001`                                                     | SVG      | `0944f448409207ae27f056b8e2c95c5586ad443ab7760ebbaf87498a95e4a3c3` | `828e8831cc7466b9cfd467f981abf5f4541d6ebf540cadd7fbeee1946cd22ffd` |
| Tyrese Haliburton | `CASE-NBAACHILLES-2025-017`                                                  | SVG      | `aed4fd61b43f986a65b84e968221f397078c1b31ccac52e0fb46bfd877cf6bfb` | `2a84acc987bd2e8d50a1a1b74e47469c4c190e398e2e02b602a20d9ed2e690ef` |

The canonical machine snapshot is
`docs/reviews/evidence/decision-14/p0/current-cover-baseline.v1.json`, SHA-256
`78dd25e332f5b32773761d6d178a9d24f96ab098f27345336d98dda14356ad8d`.
It embeds each complete selection and all 30 clinical path/digest pairs, binds
21 exact governed repository artifacts including the notice/credit and private
service sources, verifies every one of the 451 private-manifest files against
`dist`, and records these partition aggregates:

| Frozen partition         | Selections / cases | Canonical selection aggregate                                      | Asset-ledger aggregate                                             |
| ------------------------ | -----------------: | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| All current covers       |            21 / 26 | `600c355012367cb54f6b7547cb05e91cb94e47b9ebc31945aa66cfc6e89e093b` | `cf87e6b083bd08d579271e71cfc774b79549a68ffb4daa9d7613e2e3667c940f` |
| Protected Commons covers |              5 / 7 | `881875776129f58b4fe0f9970ab86ca3737b0e6818f2398b67967dd3c5cd54c5` | `ab166509cde24c87be86105dfd13abad97125da52f1646064c16840ac26217c7` |
| Target SVG covers        |            16 / 19 | `060b3086aa433b8eea353c6123a7a1974c2b791488d84c4bec064fb091a7adb5` | `cf23bf786332e8a28faae09a771d293e6bdb4d6bd8bd6997ba62b265eb19e234` |

The selection aggregates use SHA-256 over canonical JSON. Asset-ledger
aggregates use SHA-256 over registry-order `<sha256>  <path>\n` records.

### Fixed target and protected partitions

The only discovery, adjudication, or promotion targets are these exact 16
current SVG slots:

1. Anfernee Simons
2. Anthony Edwards
3. Brandon Clarke
4. Damian Lillard
5. Danny Green
6. Dejounte Murray
7. Ja Morant
8. Jayson Tatum
9. Joe Ingles
10. LaMelo Ball
11. Markelle Fultz
12. Moritz Wagner
13. Ricky Rubio
14. Thomas Bryant
15. Trae Young
16. Tyrese Haliburton

The complete v5 selection subtrees and local bytes for these five current
Commons covers are protected and out of scope: CJ McCollum, Dwight Powell,
Kevin Durant, Kyrie Irving, and LeBron James. A missing, extra, duplicate, or
outside-roster discovery/adoption set fails. Any field or byte change to a
protected cover fails independently.

There is no minimum replacement count. A target without one fully qualified
photo retains its exact current SVG.

## Clinical, notice, review, and operational baseline

The Decision 13 clinical freeze remains the byte oracle: exactly 26 case JSON
files, three injury-overview JSON files, and the current quarterly update, with
aggregate SHA-256
`bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.
Decision 14 does not authorize a change to any of those 30 files.

| Frozen input                           | SHA-256 / value                                                                                                                                                                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `review/review-set.v1.json`            | `101cefa9d19638f8b81edc7bc094f3c6a51c83cc48738e25fa7b5c37748b0c4d`; 26 cases, three overviews, one current update; content-authority digest `400cc376e95c000ecc70a594f81129f6b9857bd5bb122d4d9e2d9d18baeba48b`                      |
| `review/private-dist-manifest.v1.json` | `b63608ca9a54c77c0ffb6d4ab2b40bdf6897c4228a79cc8deb506b90212d7c01`; review mode, 451 files, build commit `cfb23acf70be6a14d803fc79348d5822dfd89946`, dist ledger `48c7f5beb490edce5b88e3fd186ee15b44a19ef0e6a38ee4d3454b2cc2168353` |
| `review/served-review-receipt.v1.json` | `7a6cc42cbd63a29130e51db891051dddc35b73a886cf65bfaaf5ff9538a5e2e0`; historical receipt retained unchanged                                                                                                                           |
| `src/data/site-governance.v1.json`     | `8aebcdf9bc4b00f26b183eb2dd828904ab83a4ff607c9579ab3054bd0d1ee7d5`; `allowIndexing=false`                                                                                                                                           |
| `ops/private-hosting.v1.json`          | `937fe2d223271153b3337b4930fd4f0e980c3cf8bce77ca1e9228c3487f218c3`                                                                                                                                                                  |
| `ops/http-header-policy.v1.json`       | `bebeb04e1f2aad8020d20a25af30eb37b92fd0e70ad122acad2560cb6fab34b0`                                                                                                                                                                  |
| launchd template                       | `71d5a3307bcedfeb722554c5c5f3312b83277155f7c524376dea13e9e194aa57`                                                                                                                                                                  |
| rendered mode-0600 launchd plist       | `fe3ba9f506255f1243e8977eaa93fa14e4158aa6e5016a793a16ad3dc5ea5f45`                                                                                                                                                                  |
| private server source                  | `b7e693336b83f1de091cee316187921a339b3df94e950f98c10731fc662b7c51`                                                                                                                                                                  |
| private service manager source         | `d1313d8205ca6fd7d2f5f4e2b9e1fe9b916527c63a0887d76d6898dfbd5fad3f`                                                                                                                                                                  |
| private service verifier source        | `a6e1b4a70547621f187b0e32cf9e417f35e8180222217539dbd32f88a5cf6e37`                                                                                                                                                                  |

The review set remains bound to content commit
`8df17fab514c9cacce2475f3999df17d4147e98c`, renderer-tree digest
`1d61d8e3118509e357496f2e0eafe0db496228ce364af3cb9e47c347ea792004`,
and supporting-data digest
`54d2953c8b9426d54285a5352c195e50e479a1d57af7916c6afb704820b32c9e`.
The historical served receipt remains unchanged at check time
`2026-08-08T16:13:16Z`; it records authentication method
`http-basic-scrypt-keychain-v1`, 61 authenticated checks, 305 unauthenticated
checks across five scenarios, and 61 manifest paths. It is a frozen input, not
a claim that Phase 0 refreshed or re-smoked the service.

The indexing baseline is exactly `siteStatus=medical-review`,
`allowIndexing=false`, and `indexingAuthorization.status=not-requested`.

The Decision 13 notice consolidation and central credits architecture are also
frozen inputs. `/credits-notices/` remains the single complete asset-credit
route, with one stable row per current Commons revision, adjacent deep links,
exact license/title/notice/alteration fields, and compatible crop-only
Adapter's Licenses for BY-SA. The current source digests are:

| Notice/credit input                        | SHA-256                                                            |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `src/pages/credits-notices.astro`          | `0d05a51ac045696d533ed71f89eeb127200c6dcad2b7d691ee4a34bfc8c4a5e1` |
| `src/components/credits/PhotoCredit.astro` | `85638d5e895c1b8a0c57a592657648d2e0b7aaccacc41e4d8613eefdd05dac1a` |
| `src/components/cases/CaseCover.astro`     | `620e5ab781e7c0dee58313487a96d2ed5d33255126c265da161a92bcb83b851c` |
| `src/lib/rights/photo-credits.ts`          | `c06efaac3b5079433daf12e6ca8c2b253208d6d1d69fb84a25d115309a876420` |
| `src/lib/ui/editorial-images.ts`           | `6ad6ec7056281cc7cd62379d51f00bc034baa50dd63d475852f09b349603cb8e` |
| current built `/credits-notices/`          | `05c366a2c0358ae0b6456af7b1fc5ead83f453c695f7e78e7644245dc4a10236` |

The bound Decision 13 central-credit evidence is
`a209df05eb3f7403c6089710378de4e0ad9748152b0f35a49ee07a5b268ff46f`;
the complete notice inventory is
`b00f2a323196643ce6681b56d752d7cc48429b5dc5371b063ad5235a23b452db`.
The frozen architecture has 42 routes, 30 compact clinical notices, 42
canonical footer notices, 46 adjacent asset-credit links, five central credit
rows, three Adapter's License rows, and two explicit `not-supplied` title rows.

The read-only service observation is frozen separately at
`docs/reviews/evidence/decision-14/p0/private-service-observation.v1.json`,
SHA-256
`0e370404ebee16f7d81aef90b26f9689866d25509c16f0357efeca77d3adad3a`.
It records the exact bounded commands and SHA-256 of the `launchctl`, `lsof`,
and projected Tailscale outputs, plus a metadata-only Keychain existence check
that did not use `-w`. At `2026-08-13T13:27:09Z`, the existing service remained
`gui/501/tw.sportsmedicine.atlas.private-review.v1`, state `running`, run count
10, wrapper PID 71225, with Node listener PID 71237 at
`100.114.3.93:8140`. The rendered plist remained uid 501, mode `0600`, one hard
link, and 1,643 bytes. The frozen bind identity also records
`mac-mini-m5.tailbc16e9.ts.net`, Tailscale backend `Running`, and the existing
Keychain service/account identifiers without recording a secret. Phase 0 did
not restart, render, load, unload, reconfigure, or reprovision the service and
did not read credential bytes.

## Pre-research Decision 14 contract

`src/lib/contracts/decision-14-photo-contract.ts` is deliberately
name-independent. It is not `nba-v7`; it fixes the closed-world roster,
evidence shapes, numeric floors, controlled tokens, and pure decision logic
before Phase 1 evaluates any real photographer.

### Conditional decision table

Eligibility is exactly:

```text
(v6-qualified non-event photo)
OR
(factual conditional event occasion
 AND fixed-16 target athlete
 AND named photographer allowlist match
 AND exact verified self-published account match
 AND credited individual maker match
 AND verified self-published original
 AND complete per-file checks
 AND candidate license equals the allowlist expected license token
 AND different governed injury event verified by date/opponent/competition
 AND credentialed-access-residual-risk
 AND exact Decision 14 owner-record citation
 AND fixed non-clearance statement
 AND immutable allowlist-evidence binding)
```

| Input state                                                            | Result                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------- |
| Complete v6-qualified non-event branch and no conflicting event branch | `eligible-photo`                                  |
| Complete Decision 14 allowlisted-event branch                          | `eligible-photo`                                  |
| Both branches asserted at once                                         | retain current SVG; ambiguous branch              |
| Missing/mismatched/unresolved event conjunct                           | retain current SVG with a finite rejection reason |
| Athlete outside the fixed 16                                           | retain current SVG; outside-scope promotion       |

The six and only six conditional event occasions are:

- `all-star-game-action`
- `international-competition-action`
- `live-preseason-competition`
- `postseason-action`
- `regular-season-action`
- `regular-season-pregame-or-warm-up`

They remain v6-ineligible by default. They become eligible only through the
complete named-allowlist event branch. `ambiguous-credentialed-court-context`,
`closed-practice`, `other`, `unknown`, and `unresolved` always fail. Adding a
token or weakening a gate requires a later owner decision and policy
successor.

### Allowlist schema and floors

Each machine-verifiable allowlist record requires:

- stable slug `photographerId`, canonical public name, and the credited maker
  independently bound to that same individual;
- one or more unique, verified, individual-owned Commons/Flickr account IDs
  and platform-valid HTTPS URLs plus canonical original-URL prefixes, with an
  explicit account-control type;
- first and latest dated self-published sports works, verified self-publication
  URLs, and at least three full years between them;
- `expectedLicenseToken`; deterministic corpus method; at least 50 observed
  self-published sports works backed by an exactly counted, unique enumerated
  work-ID/URL ledger; an at-least-30-work license-independent, date-stratified
  deterministic sample drawn from that ledger, with a date, exact token, and
  license-evidence URL for every sampled work across at least three years; 100%
  exact-token sample matches; deviation reasons; and zero unexplained
  deviations;
- at least one fixed-revision Commons/Wikipedia reuse chain spanning at least
  24 months, with exactly counted page URLs and fixed revision
  permalink/timestamp pairs; the validator derives earliest/latest timestamps
  and complete-month span rather than trusting the claimed count;
- a dated, named, bounded authorship/license/removal/takedown dispute search,
  its method, queries, inspected URLs, result `none-located`, and an explicit
  limitation that negative search does not prove zero risk;
- named checker/date, a substantive evidence paragraph, governed Markdown
  evidence path, and exact evidence SHA-256; and
- all five separately recorded washing checks below, each with pass/fail/
  unresolved status, basis, photographer-owned original IDs/URLs, checker,
  date, and deterministic sample rule.

The five required washing-signal checks are:

- `account-compilation-or-repost-behavior`
- `capture-time-and-location-plausibility`
- `exif-series-consistency`
- `native-resolution-patterns`
- `neighboring-event-sequence-continuity`

Every required check must be `pass`. A failed or unresolved check prevents
allowlisting. Commons thumbnails and third-party derivatives cannot establish
EXIF or native-resolution consistency. A shared/brand account that cannot bind
the credited individual, an uploader-only chain, vague quantities, stale or
missing evidence, a deterministic-sample change, or an unexplained license
deviation fails closed.

### Per-event-photo schema

Beyond every inherited v6 provenance, attribution, notice, download, crop,
SVG, and composite-use control, each event-photo record requires:

- target athlete and allowlist photographer ID;
- matched self-published account ID, original uploader account ID, and original
  self-upload HTTPS URL;
- exact account and credited-maker joins to the allowlist;
- expected and candidate exact license tokens plus an affirmative match result;
- one finite event-occasion token, event date, opponent, and competition
  evidence;
- `injuryEventRelationship=different-event-verified`; same-event and
  unresolved relationships are ineligible;
- complete per-file checks and verified self-publication;
- allowlist evidence path and SHA-256;
- exact residual-risk token and owner-record path/heading; and
- the fixed non-clearance statement.

The inherited per-file facts still include athlete/case identity, Commons
description and original URL, fixed revision ID/permalink/timestamp/title,
exact license name/version/link and bucket, supplied/not-supplied work-title
state, uploader and upstream-original chain, copyright/disclaimer/other-notice
states, local byte length/hash/dimensions/path, focal position, crop review,
alteration, compatible same-version crop-only Adapter's License for BY-SA, and
supersession. BY-SA remains forbidden as an input to a site-composed OG,
social, case-card, infographic, or other baked design image.

The decision function receives the complete allowlist record and frozen
Markdown evidence bytes. It validates every allowlist floor, hashes the actual
evidence bytes, and derives photographer ID, credited-maker, original uploader,
account URL-prefix, evidence path/digest, and exact-license joins. No
`photographerAllowlisted` or account/maker-match Boolean can self-authorize an
event photo.

## Residual-risk and non-clearance semantics

Every adopted allowlisted event photo must use the exact distinct token:

```text
credentialed-access-residual-risk
```

It must cite exact path `../.claude/g2-owner-decisions.md` and heading
`Decision 14 — 放寬為具名低風險攝影者的賽場封面照`. The factual occasion
stays in a separate field. The event generic sentence is
`賽事場合資料照片；非本案例受傷當下影像`, followed by an asset-specific
truthful occasion caption. A v6 non-event photo retains
`非賽事場合資料照片；非本案例受傷當下影像`.

The fixed event-photo non-clearance statement is:

> Decision 14 accepts a bounded credentialed-access residual risk; no
> copyright, personality-rights, or public-release approval is created.

The complete external owner-record file is frozen in the Phase 0 baseline at
SHA-256
`155bca740213992bd71e2b30612a4ffcb6a58c0dec47ebddb12ac7b44d6ac827`;
later evidence must use the exact path and heading above rather than a loose
reference to an unbound owner statement.

This is an owner acceptance of bounded residual risk, not a finding of no risk
or public-use clearance. The contract rejects affirmative variants including
`risk-free`, `fully rights-cleared`, `legal for public use`,
`public-release clearance`, `無風險`, `已完全清權`, `合法公開使用`, and
`已獲 public-release clearance`.

## Fail-closed negative fixtures

The Phase 0 contract tests exercise the real v5 roster and local bytes plus
name-independent controlled fixtures. Explicit negative fixtures reject:

- a missing, extra, duplicate, or outside-target discovery/adoption roster;
- promotion of any of the five protected athletes or any other outside name;
- any complete-subtree or local-byte drift in the five protected covers;
- a history shorter than three years, fewer than 50 observed works, fewer than
  30 sampled works, one unexplained deviation, or a reuse chain shorter than 24
  months;
- a claimed corpus count without the enumerated ledger, a sample outside that
  ledger, mismatched fixed-revision counts/timestamps, or a missing dispute
  search method/URL set;
- unresolved maker/account control, shared-brand ambiguity, or third-party-only
  publication;
- a non-Flickr/Commons account host, an original URL or uploader outside the
  matched account, same-host cross-account prefixes, account-path prefix
  boundary collisions, third-party-only washing evidence, and each failed or
  unresolved washing-signal category;
- stale/missing evidence, missing governed digest, or affirmative-clearance
  evidence wording, including changed evidence bytes behind an unchanged
  claimed digest;
- an unlisted photographer, allowlist-account mismatch, credited-maker
  mismatch, missing self-publication, or incomplete per-file checks;
- expected/candidate license-token mismatch;
- every always-ineligible occasion;
- same or unresolved governed injury-event relationship;
- missing/changed residual-risk token, owner citation, or non-clearance
  statement; and
- simultaneous non-event and event branches, which is treated as ambiguity and
  never as broader admission.

The same pure validator has direct controlled fail-closed fixtures for an
invalid original-self-upload URL, absent matched account ID, incomplete event
identity, unsupported exact license token, and malformed allowlist-evidence
path/digest. Every one of the six conditional occasion tokens also has a
positive fixture whose other conjuncts are complete.

## Deferred append-only v7 delta

No `nba-v7` file exists in Phase 0. This is intentional. Phase 1 must first run
the complete fixed-query discovery over all 16 targets, freeze the reviewed
photographer population, and commit
`docs/reviews/2026-08-13-decision-14-p1-photographer-allowlist-evidence.md`.
Only then may the append-only v7 generator bind that exact evidence digest and
the exact v6 pair.

The authorized v7 delta is limited to:

- a distinct verified-allowlisted-photographer event source classification;
- the exact two-branch decision table above;
- the six conditional event tokens without removing or globally redefining
  v6's default ineligible occasions;
- the named allowlist records that actually pass every predeclared floor;
- the exact per-event-photo residual-risk, owner-reference, occasion,
  different-event, and non-clearance fields; and
- append-only version/change controls requiring a later successor for a new
  photographer, removed photographer, new occasion, weaker floor, or any
  same-version change.

All compatible v6 clinical, video, privacy, license, attribution, notice,
download, local-asset, SVG, crop, and composition rules remain inherited. Phase
0 creates neither the final named allowlist nor a policy digest that would
prematurely freeze it.

## Validation

All reported commands use Node `v24.14.0`.

| Gate                                             | Result                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| Authorization preflight                          | passed; 24 bound documents and positive Decision 14 assertion                     |
| Immutable policy v1-v6 and registry v1-v5 hashes | passed; exact digests above                                                       |
| Existing Decision 13 clinical freeze             | passed; 30/30 files                                                               |
| `npm run decision14:baseline:check`              | passed; baseline `78dd25e3…56ad8d`, 21 selections, 26 cases, 451 exact dist files |
| `npm run decision13:clinical-freeze`             | passed; 30/30 files, aggregate `bb02fb61…a2e73`                                   |
| `npm run decision14:contract:check`              | passed; 61/61                                                                     |
| `npm run test:unit`                              | passed; 990/990 across 54 files                                                   |
| `npm exec -- tsc --noEmit`                       | passed                                                                            |
| focused Prettier check                           | passed                                                                            |
| `git diff --check`                               | passed                                                                            |

The Decision 13 minimum non-regression baseline remains 929/929 unit tests and
216/216 Playwright checks. Full integrated unit, Playwright, Astro, content,
photo, brand, review-build, artifact, manifest, and authenticated/
unauthenticated private-smoke gates remain scheduled after implementation; no
Phase 0 result represents final product validation.

## Closed-scope assertions

All eight closed scopes remained closed during Phase 0:
`deployment`, `external-account-mutation`, `hosting-service-mutation`,
`indexing`, `medical-content-authoring`, `medical-review-decision`,
`public-release`, and `remote-repository-mutation`.

Nothing was pushed, deployed, indexed, or publicly released. No external
account, clinical byte, current cover, historical policy/registry, bound
document, review artifact, hosting configuration, credential, listener, or
service identity was changed. Phase 0 performed no photographer research,
source-page adjudication, candidate adoption, image download, service restart,
or remote mutation.
