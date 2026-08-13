# Decision 13 photo-policy forward correction

Date: 2026-08-13  
Status: implemented and locally verified; no release, deployment, indexing, hosting, external-account, or remote-repository action authorized or performed

## Reason for the append-only correction

The Phase 3 audit found three mutually inconsistent fields in immutable `nba-v5`:

1. `2025_C.J._McCollum_(cropped).jpg` remained in `explicitNegativeFiles` as an `official-media-day-portrait`, while the frozen Decision 13 registry v4 selected that exact file after the required identity, occasion, provenance, license, notice, byte, and crop checks.
2. `non-basketball-court` remained prohibited even though the same policy admitted verified media day, public-event/fan-interaction, press-conference, award-ceremony, and documented non-live warm-up occasions.
3. The inherited generic caption `球員球場資料照片；非本案例受傷當下影像` asserted a court setting that is false for accepted public-event photographs.

The immutable `nba-v5`, registry v4, and their bound evidence were not edited. The correction advances the source policy to `nba-v6` and the current player-photo registry to v5.

## Corrective artifacts

- `research/source-policy/nba.v6.md`
  - removes only the three contradictions above;
  - retains all identity, fixed-revision, upstream-source, exact-license, occasion, photographer/uploader, residual-risk, notice, local-byte, crop, fallback, attribution, and composition requirements;
  - keeps CC BY-SA material out of site-composed OG, social, case-card, infographic, and other baked design images;
  - does not represent occasion or photographer-risk review as rights clearance or public-release approval.
- `research/source-policy/source-policy.v6.json`
  - binds the exact immutable `nba-v5` JSON and Markdown bytes;
  - removes `2025_C.J._McCollum_(cropped).jpg` from the explicit-negative list;
  - removes `non-basketball-court` from prohibited classifications;
  - sets the generic non-event caption to `非賽事場合資料照片；非本案例受傷當下影像`.
- `src/assets/players/player-photo-registry.v5.json`
  - binds the exact immutable registry v4 bytes and the exact `nba-v6` pair;
  - preserves all 21 athlete selections, 26 case mappings, per-asset facts, and local-file bindings byte-for-byte within the `selections` subtree.
- The current resolver, player-photo verifier, and ShareAlike/brand guard now consume or enforce registry v5. Registry v4 and older versions remain validated historical inputs.

## Frozen and successor digests

| Artifact                                           | SHA-256                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `research/source-policy/source-policy.v5.json`     | `5f38066ce0ef0c10f0494856f90114dc403c068986b4c323cbb2ef3ebbda56ac` |
| `research/source-policy/nba.v5.md`                 | `a59111d915caeb7f1e8f730492e826be63ff95fb5b1feeb1576eeb75a95e6aae` |
| `src/assets/players/player-photo-registry.v4.json` | `ef7149b57ab5d08a328a0a7ed88177fc4d6a35af998bcfd95a0ec318bcf345b5` |
| `research/source-policy/source-policy.v6.json`     | `1e27041de184b7b6397b2cfdde225706b40696f1d4456757193baa340f4cc93c` |
| `research/source-policy/nba.v6.md`                 | `b9a469344ff5061546619ea0ecbb5b7320965af40cde254d4939cf2e8835b0c1` |
| `src/assets/players/player-photo-registry.v5.json` | `26129455fe5b9297c44ac91c3be1fc1678a928cf77bd12d00695614fe5df3985` |

The canonical selections subtree is identical between registry v4 and v5 (`SHA-256 600c355012367cb54f6b7547cb05e91cb94e47b9ebc31945aa66cfc6e89e093b`): 21 athletes, 26 cases, 5 Commons photographs, and 16 original SVG fallbacks.

## Verification evidence

Node was pinned to `v24.14.0`. All commands below exited 0:

```text
npm run source-policy:v6:check
  nba-v6 source policy OK — 1e27041de184b7b6397b2cfdde225706b40696f1d4456757193baa340f4cc93c

npm run player-photos:v5:check
  player-photo registry v5 OK — 26129455fe5b9297c44ac91c3be1fc1678a928cf77bd12d00695614fe5df3985

npx vitest run tests/unit/research-source-policy.test.ts tests/unit/player-photo-registry-v5-contract.test.ts tests/unit/player-photo-assets.test.ts tests/unit/brand-assets.test.ts
  Test Files 4 passed (4)
  Tests 87 passed (87)

npm run test:unit
  Test Files 51 passed (51)
  Tests 917 passed (917)

npm run player-photos:verify
  player-photo assets OK — current registry v5 selects 5 Commons photos and 16 original SVG fallbacks covering 26 cases; frozen v4 and earlier registries remain historical-only

npm run brand:verify
  brand:verify OK — generated and licensed rasters are provenance-listed; no arbitrary images, logos, remote thumbnails, ShareAlike composites, or endorsement claims

npx tsc --noEmit
  exit 0
```

The new contract tests fail closed on predecessor drift, selection drift, same-version drift, policy-byte drift, a current filename restored to the explicit-negative list, restoration of the obsolete court prohibition, and drift back to the inaccurate generic court caption.

## Remaining governed cycle

This forward correction changes no selected image, mapping, clinical content, diagnosis, or approved clinical prose. It supplies no legal or medical-review disposition. The inherited workflow still requires the later renderer review-set refresh and private-dist manifest refresh before any separately authorized release; all Decision 13 closed scopes remain closed.
