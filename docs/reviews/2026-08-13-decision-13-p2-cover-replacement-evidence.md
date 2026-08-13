# Decision 13 Phase 2 Cover Replacement Evidence

Date: 2026-08-13

Phase input commit: `2cb47faa4af07bf43990c7ca79c3c909225789a6`

Execution scope: `decision-13-named-covers-and-notice-consolidation-only`

## Result

The current named-cover projection now contains exactly 21 athlete selections covering all 26 case IDs once: five locally stored Commons photos and 16 site-owned original SVG fallbacks. All five photos are classified `non-event-low-risk` for occasion while retaining a separate photographer/provenance-risk classification. All 16 non-photo selections are classified `original-svg-fallback`. The current `game-action-high-risk` count is zero.

The machine-readable build proof is [`evidence/decision-13/p2/current-cover-evidence.v1.json`](evidence/decision-13/p2/current-cover-evidence.v1.json). It binds the Phase 0 baseline, the v4 registry, every local input, every current generated output with dimensions, all 26 rendered case routes, the prohibited-byte negative audit, the complete current-render consumer trace, the executed composite guard and its controlled fixtures, and the built SVG-isolation audit. Its final SHA-256 is recorded after the last regeneration below.

This result is an internal source-risk reduction and rights-obligation record. `non-event-low-risk` is not copyright, personality-rights, medical, or public-release clearance.

## Immutable lineage and successor projection

The current resolver consumes `player-photo-registry.v4.json`; v1-v3 remain byte-identical historical records and are not rewritten or treated as the current projection.

| Artifact                        | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `player-photo-registry.v1.json` | `770a7e6d7f13ecd0dda17a629b13f179357b9c64ebc268404a5640ad9aa08eec` |
| `player-photo-registry.v2.json` | `0fa9a14660d798b32586047eaec1a0fc14912ca8710aaccc83963ac4f9dc28d0` |
| `player-photo-registry.v3.json` | `d91e97aa34e347375dd5ca14cf961208ae4b2c43cc8a90a01bea49f1172a3c05` |
| `player-photo-registry.v4.json` | `ef7149b57ab5d08a328a0a7ed88177fc4d6a35af998bcfd95a0ec318bcf345b5` |
| `nba.v3.md`                     | `7dc98d1146ffe701a312694512bfe513f27d3edb8ecaeeb2f933a92f9fb32ca2` |
| `nba.v4.md`                     | `929ac5f125db222d8eb6e98a3a52b1778ebd28c743884c945ab917619ebd5994` |
| `nba.v5.md`                     | `a59111d915caeb7f1e8f730492e826be63ff95fb5b1feeb1576eeb75a95e6aae` |
| `source-policy.v5.json`         | `5f38066ce0ef0c10f0494856f90114dc403c068986b4c323cbb2ef3ebbda56ac` |

`npm run player-photos:v4:check` regenerates the canonical projection and compares exact bytes. `npm run player-photos:verify` requires v4 to exist, binds every predecessor and policy digest, validates local bytes/dimensions and SVG fragment namespaces, and fails closed rather than falling back to v3 if the current registry is missing.

## Before/after selection ledger

The before hashes come from the Phase 0 baseline, SHA-256 `4e812d6b03c897a335769b7ef9657cc64810bebfad0ce3546e72a2d8daba647c`. The after hashes are the exact current local inputs. The resolver does not read a v1-v3 selection or import from the historical asset directory. Dwight Powell is the one deliberately revalidated selection whose adopted Decision 13 copy has bytes identical to its prior low-risk source; none of the 19 prohibited high-risk source bytes is reused.

| Athlete           | Before risk             | Before local SHA-256                                               | Current kind            | Current local SHA-256                                              | Cases |
| ----------------- | ----------------------- | ------------------------------------------------------------------ | ----------------------- | ------------------------------------------------------------------ | ----: |
| Anfernee Simons   | `game-action-high-risk` | `2c651d636a979b4e838c28817e56ce56917d7b216fc6e59603075654a067fd7e` | `original-svg-fallback` | `2cccee620a61d139cf45df54248cf3eb730ca25a97c78950550143ea517062da` |     1 |
| Anthony Edwards   | `game-action-high-risk` | `7a3f5a1164f51a05172a49385cee845f4b0deb9150dbc83a5b9905316689c650` | `original-svg-fallback` | `8b939edf0eab3be601e558c3187e411ad7569448e3ddeda8ad443aa6a2999272` |     2 |
| Brandon Clarke    | `game-action-high-risk` | `735ece4e9d1007910f96d02dbab9e5ac0724ba551b4c574ccc234b4bc9454324` | `original-svg-fallback` | `c621544de4a32fb0ad92ac3d611e77db913ab8292c08410e26db0cf1a4d111e0` |     1 |
| CJ McCollum       | `game-action-high-risk` | `81732b5f1bb005d6da0e779068318e77175511f3b11b570f3ac9cdf7f17412cd` | `commons-photo`         | `5688298371c4ec218dae6f5131685f4ab511fab6d0797685146953235c8c7e45` |     1 |
| Damian Lillard    | `game-action-high-risk` | `bdfa8f6be1c15225d7a7cc1c43c6af8c314dd4d84a4cad8b33ec0bda2d049686` | `original-svg-fallback` | `a82bcb6e92ef03798745e8cb9f3458abe6cb37657d6111343a3a72e3cd89d226` |     1 |
| Danny Green       | `game-action-high-risk` | `ccd450f0da10209a86a866b0d407b5714671e6e6366eed91c1719c75f23128e2` | `original-svg-fallback` | `ed6804a361a5cdc0006151e3538b91aed2f39977b7882e889493e103f7ed2416` |     1 |
| Dejounte Murray   | `game-action-high-risk` | `a0a9133906a442f2d9d6d8c18019318cd3399a465c23d824afa3104820552fa4` | `original-svg-fallback` | `6ad3d68a744d8373ef7a8e0fd82a96c5405f43aba971e203fd82b81d8102004c` |     1 |
| Dwight Powell     | `non-event-low-risk`    | `d1cab51c99f25b380d05d14bd5fe4f826b51042d4c007a7d105a7240265cd211` | `commons-photo`         | `d1cab51c99f25b380d05d14bd5fe4f826b51042d4c007a7d105a7240265cd211` |     1 |
| Ja Morant         | `game-action-high-risk` | `3445fc842474f72d2b8444b3f8c394af404e7ce549ec84b49a7a17606652c53d` | `original-svg-fallback` | `b4b26eecf67ab52ed32b32a703e7482be2dfff3653ad55eba5175bdbb4bbd3d9` |     1 |
| Jayson Tatum      | `game-action-high-risk` | `5df6e08f45d04ac27c1d9254f2bd77602eb878236be9df50d62198a759252af9` | `original-svg-fallback` | `793a0aeb4f815a5e2c03340613e8646e92d8aacb4290164ffea2abe701280ade` |     1 |
| Joe Ingles        | `game-action-high-risk` | `9cf8ccdc7221deede6df154ecb1201534165c86f35a49a4330afa0e4f034b44a` | `original-svg-fallback` | `bd132701afb690e79f02e9378a8d5a7db4ab8b29de31a234f5d9f2d2ed53a40a` |     1 |
| Kevin Durant      | `game-action-high-risk` | `4a91618fbf28b0b86dff3539a07aa0d2490127e104e478d30caedc881bd4f2d0` | `commons-photo`         | `6f18766d49193c6858d607ae26551ba6c4422eebefb535ca2805ccd8b54e956d` |     2 |
| Kyrie Irving      | `game-action-high-risk` | `2e03d8ba85b8eadc758e10737c2f9a857ca17e49ca9fe492e307f87baebf5b7c` | `commons-photo`         | `4f631559835221f8276ef7b1ee09b4435a5003ad9a50614bb0c72673dec745b6` |     2 |
| LaMelo Ball       | `game-action-high-risk` | `611c8be59bbb4c671753ccc7a33ccf8de57c3d28d26f1bf8f58aab454541fc7f` | `original-svg-fallback` | `cb564f0969076e33f6071f6aa22797ff8a1bcca270da2363ce0cf03352e1d505` |     3 |
| LeBron James      | `game-action-high-risk` | `938c5f531ad11722b58e59bc30b105bf9e24ee5e178eca89678340f4406fbb7a` | `commons-photo`         | `8f5550b3acc78302a465a84b9e78f62d466e484fbfec1e3c1054e9123457680c` |     1 |
| Markelle Fultz    | `game-action-high-risk` | `a159eaad7777cd6825ec2db2ac959dcdf526aa241d71c58d2c62a2ff78a3a73f` | `original-svg-fallback` | `882ddf275717f24be9a0e56b7af868beb7e6217365cbc435c4dd7fc1c6dc0b42` |     1 |
| Moritz Wagner     | `game-action-high-risk` | `bcfe61a1b69129db077900592b8113ef282a12a0558707ba92e38d5e6dc58373` | `original-svg-fallback` | `c8d8f3f6caeb9490e9862ac12dc0bb5a4ab34e710b79e0431a7cfc1bbf5956fc` |     1 |
| Ricky Rubio       | `game-action-high-risk` | `b4fe802e7643c3f3f0081a6d6d39872a2a895c3f1de160c2eb659ca7d67cb84c` | `original-svg-fallback` | `46befffc187be9a1df332ff8001945a1a1b5bb6b7be21285435fec1190402043` |     1 |
| Thomas Bryant     | `game-action-high-risk` | `dd4c0ed901c7300fb32c3b212991615688d42b4084674974660906ad64d5537f` | `original-svg-fallback` | `4f8639171dadb0aed4f28a0d3cdd66679f1cfcc7f9e19339c40fb5e1ec0b047a` |     1 |
| Trae Young        | `non-event-low-risk`    | `b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0` | `original-svg-fallback` | `0944f448409207ae27f056b8e2c95c5586ad443ab7760ebbaf87498a95e4a3c3` |     1 |
| Tyrese Haliburton | `game-action-high-risk` | `8a307fe26217d5c951d8647367207cb6c383a83ea96b1c6361e969ab1c914270` | `original-svg-fallback` | `aed4fd61b43f986a65b84e968221f397078c1b31ccac52e0fb46bfd877cf6bfb` |     1 |

## Accepted photo adoption and reclassification

The download script uses the frozen Commons original URLs and refuses a byte mismatch. The v4 registry binds each photo's dimensions, exact Commons revision, upstream/original evidence, identity, photographer, uploader, title state, exact license/version, notice state, alteration disclosure, crop checks, and supersession reason.

| Athlete       | Dimensions / bytes    | Occasion                                                        | Photographer risk                   | License bucket            |
| ------------- | --------------------- | --------------------------------------------------------------- | ----------------------------------- | ------------------------- |
| CJ McCollum   | 1138×1513 / 1,287,680 | `verified-media-day`                                            | `credentialed-media-residual-risk`  | CC BY-SA 4.0 / `cc-by-sa` |
| Dwight Powell | 2192×2827 / 2,398,388 | `documented-preseason-tune-up-warm-up-outside-live-competition` | `credentialed-media-residual-risk`  | CC BY-SA 4.0 / `cc-by-sa` |
| Kevin Durant  | 2141×2496 / 2,322,054 | `public-event-or-fan-interaction`                               | `credentialed-media-residual-risk`  | CC BY-SA 4.0 / `cc-by-sa` |
| Kyrie Irving  | 6000×4000 / 7,867,079 | `public-event-or-fan-interaction`                               | `independent-public-event-low-risk` | CC BY 2.0 / `cc-by`       |
| LeBron James  | 2003×2504 / 2,550,116 | `public-event-or-fan-interaction`                               | `independent-public-event-low-risk` | CC BY 3.0 / `cc-by`       |

The renderer branches on the license bucket instead of flattening all licenses into one template. BY-SA entries retain a linked compatible Adapter's License for their crop/presentation treatment; BY entries receive no ShareAlike language. Captions identify the actual non-event setting and explicitly state that the image is not from the case's injury event.

Both 5:2 and 16:9 focal crops were rendered and visually checked for all five photos. That check changed Dwight Powell's vertical focal position to the top edge so the 5:2 cover retains his complete face. The final registry and build evidence bind the corrected focal value.

## Original SVG fallbacks

All 16 fallbacks are unique 1600×900 site-owned abstract illustrations. Structured validation rejects script, style, text, third-party fonts, `image`, `use`, links, `foreignObject`, external URLs, and embedded raster data. It also requires every SVG definition ID to use its asset slug namespace and every local fragment reference to resolve; the final set has 32 globally unique definition IDs. A contact-sheet review of all 16 confirmed that they contain abstract line/shape artwork, no player likeness, and no team or league marks. Their SHA-256 values are recorded in the before/after ledger and the machine evidence.

The renderer emits each fallback as an accessible local Astro `<Image>` whose `src` is a built `/_astro/*.svg` asset and whose CSS uses `object-fit: cover`. This isolates definition IDs even when the same cover appears in a hero, facade, and related card, and gives 5:2 heroes and 16:9 cards a true cover crop instead of letterboxing. The exact caption is `本站原創抽象運動醫學封面；非球員照片，亦非本案例受傷當下影像`. No third-party or remote fetch is required.

## Current build and historical-byte negative audit

`npm run build:review` produced 41 pages and 355 image outputs/transforms. The governed current selections account for 193 outputs: 161 ordinary photo renditions plus 32 byte-identical local SVG copies emitted through the import and `<Image>` paths. Every output record carries its format, width, height, byte length, and SHA-256. All 26 named case routes resolve to the v4 selection and render either a local `<picture>` source or a local SVG `<img>`.

The built-DOM isolation audit traversed all 41 HTML files and found 138 local fallback instances, zero inline fallback SVGs, and zero invalid/nonlocal fallback sources. A headless Chromium check at 1440×1100 verified the 10 fallback cards on `/leagues/nba/` had distinct intended artwork, no duplicate SVG IDs in the page DOM, 1600×900 natural dimensions, and computed `object-fit: cover`. The Anfernee Simons 5:2 hero filled its 768-pixel-wide media box with no letterbox. Matched screenshots were used only for local visual inspection and were not retained as repository evidence because DOM and hashes are the reproducible proof.

The Phase 0 review build contained 669 outputs from the full historical selection set. The Phase 2 evidence isolated the 19 prohibited high-risk records and compared current review-build bytes against their 19 local source hashes and 604 generated-output hashes:

- prohibited high-risk source-byte intersections in current `dist`: 0;
- prohibited high-risk output-byte intersections in current `dist`: 0;
- current named routes retaining a v3/high-risk source reference: 0;
- current `game-action-high-risk` selections: 0;
- remote image requests required for a current named cover: 0.

## Composite and generator audit

The three current BY-SA inputs are CJ McCollum, Dwight Powell, and Kevin Durant. Their permitted flow is ordinary HTML/CSS placement and ordinary Astro resize/format renditions only. No current BY-SA path is wired into a site-owned OG, social, card, infographic, or other baked composition.

`npm run brand:verify` inventories tracked raster/SVG inputs, metadata, consumer code, composition-capable APIs, package dependencies, scripts, and generated provenance. The Phase 2 evidence executes this guard, records zero issues, and binds the guard and test SHA-256 values rather than hard-coding a composition conclusion. It also records the 10-file current-render consumer trace and proves zero v1-v3 registry or historical-asset references in that trace. Its controlled negative fixtures verify rejection of:

- a historical registry/photo/glob reference from current render code;
- a v4 registry consumer followed by `canvas.drawImage`;
- player-photo composition code and social metadata wiring;
- a new player-photo production consumer;
- a composite-like tracked raster;
- a composite generator script or dependency.

The corresponding fail-closed issue classes include `brand-current-cover-historical-reference`, `brand-sharealike-composite-code`, `brand-sharealike-social-meta`, `brand-sharealike-composite-asset`, `brand-sharealike-composite-script`, and `brand-sharealike-composite-dependency`.

## Clinical and governance freeze

`npm run decision13:clinical-freeze` rehashed the exact 30 approved clinical JSON inputs: 26 cases, three injury overviews, and the 2026 Q3 update. It passed 30/30 with unchanged aggregate SHA-256 `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`. Phase 2 changes only asset, registry, resolver, renderer, guard, test, and evidence bytes; no approved clinical string changed.

The bound Decision 13 plan and authorization artifacts remain immutable. `allowIndexing=false`; no public release, deployment, indexing, external-account mutation, hosting-service mutation, medical-content authoring, medical-review decision, remote-repository mutation, or push occurred.

## Verification

All commands used Node `v24.14.0` from the owner-pinned mise installation.

| Command                                             | Result                                                      |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `npm run player-photos:v4:check`                    | passed; canonical SHA-256 `ef7149b5…bcf345b5`               |
| `npm run player-photos:verify`                      | passed; 5 photos + 16 SVGs / 26 cases                       |
| focused v4/photo/brand/resolver/contrast Vitest set | passed; 110/110                                             |
| `npm run test:unit`                                 | passed; 909/909                                             |
| `npm exec -- tsc --noEmit`                          | passed                                                      |
| `npm run build:review`                              | passed; 41 pages / 355 image outputs/transforms             |
| Phase 2 evidence generator                          | passed; 26 routes / zero prohibited high-risk intersections |
| 5:2 and 16:9 photo crop review                      | passed after the Dwight focal correction                    |
| 16-SVG structured and visual review                 | passed                                                      |

Final machine-evidence SHA-256: `dfa5b85efe6a3ee17a25874dc85e38dd4a1c11cd8df97aae3c0cedd8788f0dd9`.

Phase 2 does not create a publication clearance or authorize any of the eight closed scopes. Notice consolidation has not begun; Phase 3 starts only from the clean Phase 2 commit.
