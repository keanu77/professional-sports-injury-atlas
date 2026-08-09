# Atlas Commons Player Photo Covers — Decision 7 Implementation Plan

> Status: NOT AUTHORIZED. Decision 7 and the accompanying photo directive authorize this bounded planning and not-authorized binding cycle, but repository execution still requires a strict `PlanExecutionDecisionV1` bound to this plan's exact final path and SHA-256. No source-policy, asset, renderer, test, review-set, or private-manifest byte may change until that decision is separately supplied, validated, bound, and accepted by `plan:assert-authorized`.

**Goal:** Replace the 26 case-cover uses of generated injury-theme imagery with audited Wikimedia Commons player court photographs where an allowed free license and safe provenance are available, while preserving the existing injury-theme image as the fail-closed fallback.

**Architecture:** Keep all 26 clinical case JSON files and medical-review fields byte-identical. Append immutable `nba-v3` source-policy bytes containing a Decision 7 static-photo annex while retaining `nba-v2` as the clinical/video authority for the existing cases. Store the selected local JPEGs plus canonical provenance in a separate governed player-photo asset registry, resolve photos from immutable case identity, and render every use through Astro's local AVIF/WebP responsive pipeline with visible attribution. Bind the asset and provenance bytes into the renderer-tree digest, then refresh the canonical review set, review build, and private dist manifest without deploying or reconfiguring the private service.

**Tech stack:** Node.js 24.14.0, Astro 7 static image pipeline, TypeScript, Vitest, Playwright/axe, Lighthouse, Wikimedia REST/MediaWiki APIs, canonical JSON, SHA-256, and local Git only.

## Scope and authority

- Execution role: `atlas-commons-player-photo-covers`; execution scope ID: `decision-7-commons-player-photo-covers-only`; required closed scope IDs: `deployment`, `external-account-mutation`, `hosting-service-mutation`, `indexing`, `medical-content-authoring`, `medical-review-decision`, `public-release`, `remote-repository-mutation`.
- Owner direction is Decision 7 in `/Users/ethanai/co-work/online_sportsinjury/.claude/g2-owner-decisions.md`, attributed to 吳易澄醫師 at `2026-08-09T09:49:09Z`. At planning time its bytes are SHA-256 `798dda190ca3acb755aa461a0b88247e30422b05053edc1a5fbec582b5ba3e1c`.
- The exact execution directive is `/Users/ethanai/co-work/online_sportsinjury/.claude/photo-directive.md`, planning-time SHA-256 `d60bd1e16f2ca2c44f69bb3c8f23da2d6104e653eed53ab52b4c3abf6d7e33fa`.
- Allowed licenses are exactly CC BY, CC BY-SA, CC0, and Public Domain. Fair use, all-rights-reserved, CC-ND, CC-NC, unknown licenses, official league/team headshots, Getty/AP/USA Today or equivalent commercial news-agency photographs, screenshots, thumbnails, and any footage-derived still remain prohibited regardless of apparent availability.
- Every displayed player photo must visibly identify the photographer, link the exact license name to its terms, link the Commons description page, and state that it is a general player court photograph rather than the injury-event image. Every CC BY-SA presentation crop must say `改作自原作`.
- If any candidate fails identity, provenance, license, visual, or technical verification, all cases for that athlete keep the existing injury-theme cover. No lower-quality or less-certain substitute is permitted.
- This plan may download only the accepted static JPEGs into `src/assets/players/`, modify local policies/checkers/UI/tests, create local build output, update `review/review-set.v1.json` and `review/private-dist-manifest.v1.json`, and make local conventional commits. It may not change `src/content/cases/*.json`, injury overviews, quarterly updates, any medical-review field/decision, `allowIndexing`, hosting credentials/account/service/listener, served receipt, remote Git state, or external accounts.

## Frozen starting state

- Repository branch `main`, clean HEAD `15ba56daacdf81bd088484b85f731b9be7f28e8a`.
- Runtime file `.node-version` is `24.14.0`; execution must prefix the installed mise Node 24.14.0 binary and require `node --version` to equal `v24.14.0`.
- Current canonical review-set digest is `e52fa514c611e27d90c45746f1d6a6cad36645d818191f5f2fc1194d0c1f323d`; current private-dist-manifest digest is `83b8e6270b9829b1f524ca2fbe315070e929add6822b25423b564385c5d193a0`.
- `npm run content:check` reports exactly 26 cases, three overviews, and one update. Those content bytes remain immutable in this scope.
- Existing source-policy `nba-v1` and `nba-v2` bytes remain immutable. Existing cases, source manifests, source-review decisions, registry entries, and medical approvals stay bound to `nba-v2`; this visual-only policy append must not relabel them as `nba-v3`.

## Audited player-photo set

The execution verifier must re-read the Commons description metadata and visually check identity before download. The planned set is:

| Athlete | Commons filename | License | Photographer |
| --- | --- | --- | --- |
| Anfernee Simons | `AnferneeSimons_(cropped).jpg` | CC BY-SA 4.0 | Frenchieinportland |
| Anthony Edwards | `Anthony_Edwards_Kentavious_Caldwell-Pope_(51734745028)_(cropped).jpg` | CC BY-SA 2.0 | All-Pro Reels |
| Brandon Clarke | `Brandon_Clarke_in_2020.jpg` | CC BY-SA 2.0 | Mogami Kariya |
| CJ McCollum | `CJ_McCollum_(51915243981)_(cropped).jpg` | CC BY 2.0 | Erik Drost |
| Damian Lillard | `Damian_Lillard_(2021)_(cropped).jpg` | CC BY 2.0 | Erik Drost |
| Danny Green | `Danny_Green_2023_Cleveland_Cavaliers_vs._New_York_Knicks.jpg` | CC BY 2.0 | Erik Drost |
| Dejounte Murray | `Dejounte_Murray_2022.jpg` | CC BY 2.0 | Erik Drost |
| Dwight Powell | `2023-08-09_Deutschland_gegen_Kanada_(Basketball-Länderspiel)_by_Sandro_Halank–021.jpg` | CC BY-SA 4.0 | Sandro Halank, Wikimedia Commons |
| Ja Morant | `Ja_Morant_2021.jpg` | CC BY-SA 2.0 | All-Pro Reels |
| Jayson Tatum | `Celtics_at_Wizards_2024-12-044_(cropped_2).jpg` | CC BY-SA 4.0 | Hameltion |
| Joe Ingles | `Joe_Ingles_Utah_(cropped).jpg` | CC BY-SA 4.0 | Frenchieinportland |
| Kevin Durant | `Kevin_Durant,_Paris_2024_(cropped).jpg` | CC BY-SA 4.0 | Clément Bardot |
| Kyrie Irving | `Kyrie_Irving_(51830909437)_(cropped).jpg` | CC BY 2.0 | Erik Drost |
| LaMelo Ball | `LaMelo_Ball_(cropped).jpg` | CC BY 2.0 | Erik Drost |
| LeBron James | `LeBron_James_(51959977144)_(cropped2).jpg` | CC BY 2.0 | Erik Drost |
| Markelle Fultz | `Markelle_Fultz_(50639078246).jpg` | CC BY-SA 2.0 | Mogami Kariya |
| Moritz Wagner | `2023-08-09_Deutschland_gegen_Kanada_(Basketball-Länderspiel)_by_Sandro_Halank–145.jpg` | CC BY-SA 4.0 | Sandro Halank, Wikimedia Commons |
| Ricky Rubio | `Ricky_Rubio_(51657225617)_(cropped).jpg` | CC BY 2.0 | Erik Drost |
| Thomas Bryant | `Thomas_Bryant_WSH_Wizards_2022.jpg` | CC BY-SA 2.0 | Joe Glorioso |
| Trae Young | `Trae_Young_(2022_All-Star_Weekend)_(cropped).jpg` | CC BY 2.0 | Erik Drost |
| Tyrese Haliburton | `1_tyrese_haliburton_2025_(cropped_2).jpg` | CC BY-SA 4.0 | Chensiyuan |

Three upstream suggestions are frozen as explicit negative cases and must never enter the asset registry:

1. `Anthony_Edwards_Argentina_v_Egypt_7_July_2026-069_(cropped).jpg` depicts the namesake footballer at the 2026 FIFA World Cup, not the NBA player.
2. `Dwight_Powell.jpg` is a 480×480 Dallas Mavericks official photo-shoot image; CC0 does not override the official-headshot prohibition.
3. `2025_C.J._McCollum_(cropped).jpg` is a posed Washington Wizards media-day portrait and is excluded as an official headshot.

## Task 0: Require exact execution authorization

Before any implementation byte changes:

```bash
ATLAS_NODE_BIN="$(mise where node@24.14.0)/bin"
export PATH="$ATLAS_NODE_BIN:$PATH"
ATLAS_PHOTO_PLAN="docs/superpowers/plans/2026-08-09-atlas-commons-player-photo-covers.md"
ATLAS_PHOTO_DECISION="docs/decisions/2026-08-09-atlas-commons-player-photo-covers-authorization.v1.json"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain)"
test -f "$ATLAS_PHOTO_DECISION"
npm run plan:decision:verify -- --decision "$ATLAS_PHOTO_DECISION" --plan "$ATLAS_PHOTO_PLAN"
npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_PHOTO_PLAN"
```

Any missing/mismatched decision, plan digest, scope, closed scope, dirty tree, or wrong runtime stops execution.

## Task 1: Append and validate the static-photo source policy

1. Add immutable `research/source-policy/source-policy.v3.json` and `research/source-policy/nba.v3.md`. They inherit the complete `nba-v2` clinical/video rules unchanged and add a narrowly scoped Decision 7 player-static-photo annex.
2. Keep source-event video/audio/screenshots/thumbnails/footage downloads and reproduction prohibited. The annex alone permits local storage of Wikimedia Commons JPEG photographs when the license is CC BY, CC BY-SA, CC0, or Public Domain and every identity/provenance/attribution field passes.
3. Make version-change rules scope-specific: later clinical/video changes still require the complete link-verifier, root-audit, candidate-set, named review-decision, and manifest cycle; later photo-annex changes require a new policy version, complete photo-license/provenance verification, renderer review-set refresh, and private-dist-manifest refresh.
4. Extend exact version-to-bytes tests without changing the `nba-v1` or `nba-v2` expected digests. Add fail-closed regression tests for CC-NC, CC-ND, fair use, all-rights-reserved, unknown license, wrong athlete, official headshot, news agency, screenshot, thumbnail, and footage-derived input.
5. Do not change the clinical/video `CURRENT_SOURCE_POLICY_VERSION`, the frozen source manifests, or any case source binding.

## Task 2: Create a hash-bound player-photo registry and local assets

1. Add a strict canonical provenance manifest under `src/assets/players/` with one record per accepted athlete. Each record includes athlete identity, exact applicable case IDs, local path, original filename, Commons download URL, Commons description page, photographer, exact license name and URL, original dimensions, local byte dimensions/hash, download date `2026-08-09`, alteration/crop disclosure, identity evidence, and the exact `nba-v3` JSON/Markdown digests.
2. Add a verifier that rejects duplicate athletes/cases/paths, uncovered or multiply covered cases, unknown cases, missing or extra local images, path traversal, non-JPEG bytes, dimension/hash drift, unapproved license tokens/URLs, non-Commons source/download hosts, missing visible-attribution data, forbidden source classifications, and the three explicit negative files above.
3. Download only the reverified accepted JPEG bytes into `src/assets/players/`. Use local filenames that are stable and safe for the Astro pipeline; retain the exact upstream filename separately in provenance.
4. Visually inspect each original and the actual 5:2 and 16:9 UI crops. Store a validated focal position per photo so no rendered crop cuts through the player's face. If a crop cannot be made safely, keep the injury-theme fallback for that athlete.
5. Evolve the brand-asset verifier from its current AI-only raster exception to two exact governed inventories: the existing immutable generated injury-theme assets and the new Commons player-photo registry. Arbitrary image files, logos, remote image URLs, authored raw `<img>` tags, and trademark/endorsement claims remain rejected.

## Task 3: Render licensed photos with complete visible attribution

1. Evolve the case-image resolver into a discriminated result: licensed player photo when a verified case mapping exists, otherwise the current stable injury-theme image. The resolver exposes safe focal position and attribution metadata but never reads mutable remote state at render time.
2. Keep the case clinical JSON schema and bytes unchanged. Resolve by immutable case ID and verify that the registered athlete matches the rendered record athlete.
3. Route case hero, case cards, related cards, and video facades through the same governed cover component. Hero uses eager/high-priority AVIF/WebP responsive output and the existing preload; cards and facades remain lazy. The source JPEG is never served as a remote URL.
4. Add a compact attribution treatment integrated into the figure design. Each licensed photo use visibly shows photographer, linked exact license, linked Commons source page, `球員球場資料照片；非本案例受傷當下影像`, and `改作自原作` for CC BY-SA crop presentations.
5. Do not place attribution links inside an existing case/video overlay link or button. Preserve valid interactive nesting, keyboard focus, 44px targets, privacy-preserving pre-click video behavior, no third-party requests, and useful no-JavaScript output.
6. Fallback covers retain their current injury-theme semantics and must not claim to depict the player.

## Task 4: Bind visual bytes into the review artifact

1. Extend `isRendererTreePath()` so tracked files under the governed player-photo asset directory, including the provenance manifest, enter `rendererTreeDigest`. Add tests proving any photo/provenance byte change invalidates an existing renderer digest and that clinical/authority exclusions remain unchanged.
2. Add unit and browser assertions for exact 26-case photo resolution, deduplicated 21-player asset coverage, allowed-license links, author/Commons visibility, non-event wording, CC BY-SA alteration wording, fallback behavior, responsive AVIF/WebP/srcset, hero preload/eager behavior, card/facade lazy behavior, face-safe focal styling, valid link nesting, and zero pre-click third-party image/video requests.
3. Preserve Lighthouse accessibility at or above 0.95 and all existing contrast, layout, reduced-motion, keyboard, no-JavaScript, robots, noindex, and artifact identity contracts.
4. Prove `git diff -- src/content/cases src/content/injuries src/content/updates` is empty and no medical-review or indexing field changed.

## Task 5: Full green cycle and append-only artifact refresh

Run focused failures first, implement the minimum fix, and rerun until green. The final pre-commit gate under Node 24.14.0 includes at least:

```bash
npm run plan:verify
npm run format:check
npm run check
npm run content:check
npm run test:coverage
npm run build:review
npm run test:e2e
npm run test:lighthouse
npm run brand:verify
npm run verify:review-artifact
git diff --check
```

Then follow the existing clean-commit artifact sequence:

1. Commit policy/assets/UI/tests locally with a conventional `feat(media): ...` commit.
2. From that clean source commit, run `npm run review-set:generate`; verify clinical digests and all content bytes are unchanged while the renderer digest/content commit refresh. Commit only the regenerated review set with `chore(review): ...`.
3. From the clean review-set commit, run `npm run build:review`, `npm run verify:review-artifact`, and `npm run private:manifest`. Verify the manifest exact-covers the rebuilt dist, matches the new review-set response and renderer digest, preserves review noindex/robots/header contracts, and contains no remote player-image fetches. Commit only the regenerated private manifest with `chore(review): ...`.
4. Rerun the complete successful gate against the final tree where applicable and leave `git status --porcelain` empty.

The existing served-review receipt is intentionally not regenerated: this scope does not reload, expose, probe, or mutate the hosting service. Public release remains expected to fail closed and is not run as a success gate.

## Completion conditions

- Every one of the 26 cases either uses the correct verified Commons photo for its athlete or retains the governed injury-theme fallback; no case uses a prohibited or ambiguous image.
- Every licensed use has complete visible attribution and unambiguous non-event wording.
- `nba-v1`/`nba-v2`, clinical case bytes, review fields, source manifests/decisions, indexing state, hosting state, and remote state remain unchanged.
- All focused and full tests pass, accessibility remains at least 0.95, the review set/build/private manifest are refreshed through clean commits, and the final worktree is clean.
- No remote is created, no push occurs, no external or hosting account/service changes, no deployment, no public release, and no indexing.
