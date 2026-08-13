# Decision 13 P0 governance baseline

- Date: 2026-08-13
- Scope: `decision-13-named-covers-and-notice-consolidation-only`
- Release state: private medical review; public release and indexing remain closed
- Authority: 吳易澄醫師, `2026-08-13T03:43:23Z`
- Authorized-start commit: `36a80b3cd41c837d68554c71085b385de1e38c40`
- Plan: `docs/superpowers/plans/2026-08-13-decision-13-named-covers-and-notice-consolidation.md`
- Decision: `docs/decisions/2026-08-13-decision-13-named-covers-and-notice-consolidation-authorization.v1.json`

This phase freezes the inputs and creates append-only contracts. It does not adopt a replacement photo, promote registry v4, alter a current cover, consolidate a notice, make a medical or legal review decision, or establish public-use clearance. `non-event-low-risk` remains context triage only.

## Authorization preflight

The pinned runtime was `/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin/node`, reporting `v24.14.0`. The governance transition is commit `36a80b3` and contains only the owner-supplied decision plus `plan-binding.v1.json`.

| Input                    | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| Decision 13 plan         | `fa51499b7c64c4c8c9f3b06b5307e003c183db28bf226fe14b8a3c01b951b5d4` |
| Owner authorization JSON | `2f956058412d5244554b310dfc866f2805ac623f6f999e6fdd958117c1d25aad` |
| Authorized plan binding  | `71fadfee254c3cf1cbede3e754cbc17b3923c04c3a4d75aed7232a1c99bcd306` |

The following preflight passed before any phase work:

```text
npm run plan:decision:verify -- --decision <decision> --plan <plan>
npm run plan:bind -- <plan> --status authorized --decision <decision>
npm run plan:verify
npm run plan:decision:verify -- --decision <decision> --plan <plan>
npm run plan:assert-authorized -- <plan>
```

Measured results were 22 bound documents, decision digest `2f956058…aad`, and a positive authorization assertion for the exact Decision 13 role and scope.

## Immutable lineage

The following predecessors were measured from the authorized-start tree and are not modified by Decision 13:

| Lineage input                                      | SHA-256                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `research/source-policy/nba.v1.md`                 | `f983c682d3504902ff9ae8a57cbd414e4855de2abbb3b6f2855d3532df8fed46` |
| `research/source-policy/source-policy.v1.json`     | `a588b68f3468bec8d24cda9005435ecb0177cc74dbaff7d14f793ec45dcdd280` |
| `research/source-policy/nba.v2.md`                 | `b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570` |
| `research/source-policy/source-policy.v2.json`     | `6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07` |
| `research/source-policy/nba.v3.md`                 | `7dc98d1146ffe701a312694512bfe513f27d3edb8ecaeeb2f933a92f9fb32ca2` |
| `research/source-policy/source-policy.v3.json`     | `284a88792f281564799eeae6b62646b855072725824ef21f3cea4204a3d14270` |
| `research/source-policy/nba.v4.md`                 | `929ac5f125db222d8eb6e98a3a52b1778ebd28c743884c945ab917619ebd5994` |
| `research/source-policy/source-policy.v4.json`     | `3320fe2051fc091aa055d5cdd8bcdacf24073c3964cac3d1a982666a2aafbf68` |
| `src/assets/players/player-photo-registry.v1.json` | `770a7e6d7f13ecd0dda17a629b13f179357b9c64ebc268404a5640ad9aa08eec` |
| `src/assets/players/player-photo-registry.v2.json` | `0fa9a14660d798b32586047eaec1a0fc14912ca8710aaccc83963ac4f9dc28d0` |
| `src/assets/players/player-photo-registry.v3.json` | `d91e97aa34e347375dd5ca14cf961208ae4b2c43cc8a90a01bea49f1172a3c05` |
| Decision 11 P2 evidence                            | `e1dde1d529f573bea9252c7067a8ce6a3af61daf3d52b827c4d08cebc9147259` |

Registry v4 is therefore a successor projection, not a literal rewrite of owner-frozen v1. Its contract binds v1, v2, and v3 individually and rejects any changed predecessor bytes.

## Clinical byte freeze

The immutable clinical set is exactly 30 JSON files: 26 approved cases, three injury overviews, and `src/content/updates/2026-q3.json`. `scripts/verify-decision-13-clinical-freeze.ts` contains the exact sorted path/SHA-256 map and rejects a changed byte, a removed file, or an added clinical input.

- Case files: 26
- Injury overviews: 3
- Quarterly updates: 1
- Aggregate over the exact sorted `sha256  path\n` records: `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`
- Review-set clinical projection at start: 26 cases, three overviews, one current update
- Review-set content-authority snapshot: `400cc376e95c000ecc70a594f81129f6b9857bd5bb122d4d9e2d9d18baeba48b`

`npm run decision13:clinical-freeze` passed `30/30`. This byte freeze is the before/after oracle for Phases 2, 4, and 5; moving or consolidating a presentation-layer notice never authorizes editing these inputs.

## Authorized-start current-cover inputs and outputs

An authorized-start review build at commit `36a80b3` produced 41 pages and 831 total image transforms. The governed player subset is 21 local inputs and 669 generated outputs. Every individual output path, byte length, format, and SHA-256 is frozen in `docs/reviews/evidence/decision-13/p0/current-cover-baseline.v1.json`.

- Supporting inventory SHA-256: `4e812d6b03c897a335769b7ef9657cc64810bebfad0ce3546e72a2d8daba647c`
- Source aggregate SHA-256: `53603e925defe480d4a4ab737539f149f2f0934dfb0ab4900b41a47391c49130`
- Built-output aggregate SHA-256: `3cd156f32d9213ae1f36f213694c1e406b856130388cf997b9a7af8c8f3d491f`

| Athlete           | Cases | Start class             | Local input SHA-256                                                | Built outputs |
| ----------------- | ----: | ----------------------- | ------------------------------------------------------------------ | ------------: |
| Anfernee Simons   |     1 | `game-action-high-risk` | `2c651d636a979b4e838c28817e56ce56917d7b216fc6e59603075654a067fd7e` |            31 |
| Anthony Edwards   |     2 | `game-action-high-risk` | `7a3f5a1164f51a05172a49385cee845f4b0deb9150dbc83a5b9905316689c650` |            31 |
| Brandon Clarke    |     1 | `game-action-high-risk` | `735ece4e9d1007910f96d02dbab9e5ac0724ba551b4c574ccc234b4bc9454324` |            34 |
| CJ McCollum       |     1 | `game-action-high-risk` | `81732b5f1bb005d6da0e779068318e77175511f3b11b570f3ac9cdf7f17412cd` |            31 |
| Damian Lillard    |     1 | `game-action-high-risk` | `bdfa8f6be1c15225d7a7cc1c43c6af8c314dd4d84a4cad8b33ec0bda2d049686` |            31 |
| Danny Green       |     1 | `game-action-high-risk` | `ccd450f0da10209a86a866b0d407b5714671e6e6366eed91c1719c75f23128e2` |            31 |
| Dejounte Murray   |     1 | `game-action-high-risk` | `a0a9133906a442f2d9d6d8c18019318cd3399a465c23d824afa3104820552fa4` |            34 |
| Dwight Powell     |     1 | `non-event-low-risk`    | `d1cab51c99f25b380d05d14bd5fe4f826b51042d4c007a7d105a7240265cd211` |            34 |
| Ja Morant         |     1 | `game-action-high-risk` | `3445fc842474f72d2b8444b3f8c394af404e7ce549ec84b49a7a17606652c53d` |            31 |
| Jayson Tatum      |     1 | `game-action-high-risk` | `5df6e08f45d04ac27c1d9254f2bd77602eb878236be9df50d62198a759252af9` |            31 |
| Joe Ingles        |     1 | `game-action-high-risk` | `9cf8ccdc7221deede6df154ecb1201534165c86f35a49a4330afa0e4f034b44a` |            31 |
| Kevin Durant      |     2 | `game-action-high-risk` | `4a91618fbf28b0b86dff3539a07aa0d2490127e104e478d30caedc881bd4f2d0` |            31 |
| Kyrie Irving      |     2 | `game-action-high-risk` | `2e03d8ba85b8eadc758e10737c2f9a857ca17e49ca9fe492e307f87baebf5b7c` |            34 |
| LaMelo Ball       |     3 | `game-action-high-risk` | `611c8be59bbb4c671753ccc7a33ccf8de57c3d28d26f1bf8f58aab454541fc7f` |            31 |
| LeBron James      |     1 | `game-action-high-risk` | `938c5f531ad11722b58e59bc30b105bf9e24ee5e178eca89678340f4406fbb7a` |            31 |
| Markelle Fultz    |     1 | `game-action-high-risk` | `a159eaad7777cd6825ec2db2ac959dcdf526aa241d71c58d2c62a2ff78a3a73f` |            34 |
| Moritz Wagner     |     1 | `game-action-high-risk` | `bcfe61a1b69129db077900592b8113ef282a12a0558707ba92e38d5e6dc58373` |            31 |
| Ricky Rubio       |     1 | `game-action-high-risk` | `b4fe802e7643c3f3f0081a6d6d39872a2a895c3f1de160c2eb659ca7d67cb84c` |            31 |
| Thomas Bryant     |     1 | `game-action-high-risk` | `dd4c0ed901c7300fb32c3b212991615688d42b4084674974660906ad64d5537f` |            31 |
| Trae Young        |     1 | `non-event-low-risk`    | `b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0` |            31 |
| Tyrese Haliburton |     1 | `game-action-high-risk` | `8a307fe26217d5c951d8647367207cb6c383a83ea96b1c6361e969ab1c914270` |            34 |

The required start partition is therefore exactly 19 high-risk photos and two non-event-low-risk photos across 21 athletes and 26 case routes. Neither of the two lower-risk records is grandfathered; both must be independently revalidated in Phase 1.

## Review, indexing, and private-service baseline

| Frozen operational input               | SHA-256 / value                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/data/site-governance.v1.json`     | `8aebcdf9bc4b00f26b183eb2dd828904ab83a4ff607c9579ab3054bd0d1ee7d5`; `allowIndexing=false` |
| `review/review-set.v1.json`            | `1e24466feda4c806fbbfce13ca698adb6b202a788db32f1641b1ada860e7f9e1`                        |
| `review/private-dist-manifest.v1.json` | `0e7a8556b07712a86a173f06cdfc35a3d07d9a5633629694cea136873dd7fdb4`                        |
| `review/served-review-receipt.v1.json` | `7a6cc42cbd63a29130e51db891051dddc35b73a886cf65bfaaf5ff9538a5e2e0`                        |
| `ops/private-hosting.v1.json`          | `937fe2d223271153b3337b4930fd4f0e980c3cf8bce77ca1e9228c3487f218c3`                        |
| `ops/http-header-policy.v1.json`       | `bebeb04e1f2aad8020d20a25af30eb37b92fd0e70ad122acad2560cb6fab34b0`                        |
| launchd template                       | `71d5a3307bcedfeb722554c5c5f3312b83277155f7c524376dea13e9e194aa57`                        |
| rendered mode-0600 plist               | `fe3ba9f506255f1243e8977eaa93fa14e4158aa6e5016a793a16ad3dc5ea5f45`                        |

The existing service identity was `gui/501/tw.sportsmedicine.atlas.private-review.v1`, state `running`, launch count `9`, launchd PID `57895`, with a Node listener at `100.114.3.93:8140`. Tailscale reported DNS name `mac-mini-m5.tailbc16e9.ts.net`, backend `Running`, and the configured keychain service/account lookup succeeded. No secret bytes were read or recorded. Phase 0 did not render, load, unload, restart, reprovision, or reconfigure the service.

## Append-only policy and registry contracts

The new immutable `nba-v5` pair inherits compatible `nba-v4` requirements and changes only the Decision 13 player-cover annex:

| Successor                                      | SHA-256                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `research/source-policy/nba.v5.md`             | `a59111d915caeb7f1e8f730492e826be63ff95fb5b1feeb1576eeb75a95e6aae` |
| `research/source-policy/source-policy.v5.json` | `5f38066ce0ef0c10f0494856f90114dc403c068986b4c323cbb2ef3ebbda56ac` |

The v5 annex admits only evidence-backed `verified-media-day`, `press-conference`, `public-event-or-fan-interaction`, `award-ceremony`, or `documented-preseason-tune-up-warm-up-outside-live-competition`. It keeps regular-season pregame/warm-up, live preseason competition, regular-season/play-in/postseason action, international competition action, All-Star game action, and ambiguous credentialed-court context ineligible.

Occasion is independent of the photographer/provenance categories `independent-public-event-low-risk`, `credentialed-media-residual-risk`, and `unresolved-reject`. The first two may enter a candidate record only with a verified author/license chain; `unresolved-reject` is never current-cover eligible.

The pure registry-v4 contract in `src/lib/contracts/player-photo-registry-v4.ts` is intentionally present before the Phase 2 projection. It can express either a local verified Commons photo or a site-owned SVG fallback without assigning a CC license to the latter. It binds all three predecessor registries, the exact v5 policy pair, 21 athlete-to-26-case mappings, local bytes/dimensions, revision and upstream evidence, photographer and uploader identities, exact license bucket and notice states, Adapter's License, occasion/provenance risk, current status, and the exact superseded v3 path/hash/reason.

Negative fixtures prove rejection of:

- changed predecessor bytes or same-version registry drift;
- a high-risk current cover;
- missing or unverified identity, occasion, or photographer evidence;
- unsupported license/version, bucket mismatch, or invalid Adapter's License;
- missing title or notice-retention state;
- a remote current-cover path;
- an SVG containing a raster, link/fetch, script, text/font, style, use, or foreign object;
- a superseded path/hash/reason that does not match the same athlete in frozen v3; and
- a fixed Commons revision whose title/oldid does not bind the selected description page.

Registry v4 itself is not generated or promoted in Phase 0. Candidate evidence is frozen in Phase 1, and actual selection/local-byte promotion remains Phase 2 work.

## Validation

All commands used the pinned Node `v24.14.0` runtime.

| Command                                                                                                                 | Result                           |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `npm run plan:verify`                                                                                                   | passed; 22 bound documents       |
| `npm run plan:assert-authorized -- <Decision 13 plan>`                                                                  | passed positively                |
| `npm run build:review` at authorized start                                                                              | passed; 41 pages, 831 transforms |
| `npm run decision13:clinical-freeze`                                                                                    | passed; 30/30 files              |
| `npm run decision13:cover-baseline`                                                                                     | passed; 21 inputs, 669 outputs   |
| `npm exec -- vitest run tests/unit/research-source-policy.test.ts tests/unit/player-photo-registry-v4-contract.test.ts` | passed; 38/38 tests              |
| `npm run test:unit`                                                                                                     | passed; 906/906 tests            |
| `npm exec -- tsc --noEmit`                                                                                              | passed                           |
| `npm run player-photos:verify`                                                                                          | passed; 21 photos, 26 cases      |
| focused Prettier checks                                                                                                 | passed                           |
| `npm run format:check`                                                                                                  | passed                           |
| `git diff --check`                                                                                                      | passed                           |

The successor generator also passes `--check`, making same-version policy drift detectable. The full integrated unit, Playwright, Astro, artifact, and private-smoke gates remain scheduled for Phase 5 after the source and presentation work is complete.

## Interpretation and closed-scope assertions

- Occasion classification and photographer/provenance risk are independent facts. Neither is copyright authority, personality-rights clearance, legal approval, medical approval, or public-release authorization.
- A Commons or Flickr uploader name alone never proves photographer identity or licensing authority.
- Unknown title, notice, and upstream facts remain explicit; they are never invented.
- A failed photo slot resolves to a site-owned original SVG contract, not to a high-risk historical photo.
- CC BY-SA remains eligible only for ordinary local HTML/CSS placement and responsive renditions, never as an input to a baked site-composed OG, social, card, or infographic image.
- The eight closed scopes remained closed: no deployment, external-account mutation, hosting-service mutation, indexing, medical-content authoring, medical-review decision, public release, or remote-repository mutation occurred.
- Nothing was pushed, deployed, indexed, or publicly released.
