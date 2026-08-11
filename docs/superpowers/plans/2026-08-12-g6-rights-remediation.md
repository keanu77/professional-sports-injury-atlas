# G6 Rights Review — Decision 11 Append-only Remediation Plan

> Status: NOT AUTHORIZED. Decision 11 authorizes the six bounded remediation outcomes, but this repository still requires a strict `PlanExecutionDecisionV1` bound to this plan's exact final path and SHA-256 before product, research, review, or generated-artifact bytes may change. Before that decision is bound, only this plan and its append-only `not-authorized` plan binding may be committed.

**Goal:** Repair the six rights-review defects in strict P0 → P1 → P2 order, keep the public release paused and indexing disabled, preserve all approved clinical wording, and fail closed for any video bytes whose medical-review digest becomes stale until the owner re-reviews the final bytes.

**Architecture:** Add one narrowly governed rights-remediation layer. P0 first resolves the Taiwan-unplayable Anthony Edwards embed and proves that no CC BY-SA player photo is baked into an OG or other composed raster. P1 then corrects current video-channel facts through immutable source-correction records and replaces the one-size-fits-all photo attribution model with license-version-aware records and display. P2 changes NBA.com deep links to non-clickable citations at presentation time and classifies every governed photo by event context and rights risk without removing photos. Any source/video identity change follows the existing append-only correction-manifest workflow. Any case clinical digest change invalidates the old approval and is frozen for named owner re-review; this plan does not manufacture or infer that approval.

**Tech stack:** Node.js 24.14.0, TypeScript, canonical JSON, SHA-256, Astro 7, Vitest, Playwright/axe, local Git, official-source web verification, and existing review/private-artifact generators.

## Scope and authority

- Execution role: `g6-rights-remediation`; execution scope ID: `decision-11-g6-rights-remediation-only`; required closed scope IDs: `deployment`, `external-account-mutation`, `hosting-service-mutation`, `indexing`, `medical-content-authoring`, `medical-review-decision`, `public-release`, `remote-repository-mutation`.
- Owner authority is Decision 11 in `/Users/ethanai/co-work/online_sportsinjury/.claude/g2-owner-decisions.md`, attributed to 吳易澄醫師 at `2026-08-11T17:20:32Z`. At planning time that complete authority file is SHA-256 `c4f960706cc5866bb8fb02c3c9f424746f42f616d49ed44a7b90bf542edd9f12`.
- The reviewed findings are `/Users/ethanai/co-work/online_sportsinjury/.claude/g6-rights-review.md`, planning-time SHA-256 `ff3dec7a41aeb464486a1418fc9d372f6b2b39fbda876ee589d26498f2be53c7`. The report remains `BLOCKED`; this plan repairs only Decision 11's six enumerated defects and does not reinterpret the report as public clearance.
- User-supplied external test evidence fixes `V9mtX4mE8wQ` as `availableCountries=60` without `TW` and `playabilityStatus=UNPLAYABLE`. Search may adopt a replacement only when the original official page proves the same Anthony Edwards 2023-03-17 event and a current Taiwan check proves playable/embed-eligible. Otherwise the case must degrade to a clearly labelled external link. Downloading, re-hosting, mirroring, proxying, or adopting a third-party repost is forbidden.
- Permitted content-adjacent mutations are limited to video/source provenance fields required by P0/P1, the two affected cases' workflow/review invalidation fields if their digests change, their exact dependent quarterly digest pointers, governed photo-rights metadata/display, NBA-link presentation, rights audit artifacts/checkers/tests, and regenerated local review artifacts. All general/professional clinical strings, diagnoses, mechanisms, observations, treatment/RTP prose, overview prose, and unrelated cases remain byte-identical.
- `allowIndexing` remains false. No push, public deployment, public release, external account, hosting service/listener/credential/served-receipt, remote, DNS, or indexing mutation is permitted.

## Frozen starting state

- Branch `main`, clean baseline commit `c5e83e6b54d3526c922d2c318ad4aced98cd3821`, tracking the existing private backup remote. This plan does not authorize any fetch, pull, push, remote change, or hosting operation.
- `.node-version` is `24.14.0`; the ambient shell resolves Node 22. Every command must prepend `$(mise where node@24.14.0)/bin`, assert `node --version` is exactly `v24.14.0`, and begin from a clean worktree.
- The existing source-manifest registry, all prior immutable source manifests/review decisions, the 26 case records, review set, private-dist manifest, and served-review receipt are frozen inputs. New source facts are represented only by a new correction batch and registry append; no prior immutable artifact is edited.
- Current public release remains held and `allowIndexing=false`. A successful local build or review artifact must not change either state.

## Task 0: Require exact authorization before execution

From a clean worktree, require the repository decision and exact binding:

```bash
ATLAS_NODE_BIN="$(mise where node@24.14.0)/bin"
export PATH="$ATLAS_NODE_BIN:$PATH"
ATLAS_RIGHTS_PLAN="docs/superpowers/plans/2026-08-12-g6-rights-remediation.md"
ATLAS_RIGHTS_DECISION="docs/decisions/2026-08-12-g6-rights-remediation-authorization.v1.json"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain)"
npm run plan:decision:verify -- --decision "$ATLAS_RIGHTS_DECISION" --plan "$ATLAS_RIGHTS_PLAN"
npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_RIGHTS_PLAN"
```

Any Node mismatch, dirty tree, absent/stale decision, plan-binding failure, or failed authorization assertion stops product work.

## P0 — Immediate playback and irreversible ShareAlike risk

### P0-1: Anthony Edwards 2023 Taiwan playback

1. Search official/rightsholder sources for the exact 2023-03-17 Minnesota Timberwolves at Chicago Bulls ankle-injury event. Preserve query, canonical URL, publisher/channel identity, event match, verification time, and rejected candidates. Do not infer equivalence from title snippets.
2. For each official candidate, verify the original page and current player/API evidence. Adoption requires `TW` in `availableCountries`, playable status, embed eligibility, official/rightsholder provenance, and the exact event. If no candidate clears every condition, keep `V9mtX4mE8wQ` only as an external-link fallback and ensure no iframe/facade is rendered for Taiwan readers.
3. If the adopted video identity or immutable source facts change, create one canonical correction review set, source-review decision, correction manifest, and append-only registry entry that supersedes exactly the current Anthony Edwards entry. Rebind only `src/content/cases/anthony-edwards-ankle-sprain-2023.json`; preserve all clinical strings and source claims.
4. If the case clinical digest changes, set the case and review to the existing fail-closed in-review state with no fabricated reviewer/digest, update only the matching Q3 current digest pointers, and place the final bytes in the regenerated review set for owner re-review. Do not copy forward the old approval digest or create a medical-review decision.
5. Add regression coverage for the Taiwan block, chosen replacement/fallback, no pre-click request, and correct public/review presentation. Record the exact live evidence and selection rationale in a dated review artifact.

### P0-2: OG/composite image audit

1. Inventory every tracked raster/SVG, every build-time image transform, every social/OG metadata reference, every card/hero renderer, and every script/package capable of raster composition. Inspect both source generators and built review output; do not infer safety from filenames.
2. Trace every `src/assets/players/*` import and generated rendition. Prove whether each output remains an ordinary resized/cropped rendition of the licensed photo or combines it with site-owned text, layout, icons, or other artwork into one file.
3. If any composed artifact contains a CC BY-SA photo, replace that input with site-owned artwork or a verified BY/CC0 alternative without changing clinical text. If no such artifact exists, record the negative result with paths, commands, hashes/dimensions, and an explicit statement that no OG generator or composed case-card raster exists.
4. Add a fail-closed automated check that rejects player-photo paths as inputs to any OG/social/composite raster generator and rejects an OG/composed output that is sourced from the player-photo registry. Keep ordinary HTML/CSS placement and Astro photo renditions distinguishable from baked site-design composites.

After P0 focused and full applicable gates pass, commit P0 with conventional commits. Regenerate and commit the review set/private manifest when their governed digests or rendered bytes change. Confirm a clean worktree before starting P1.

## P1 — Attribution completeness and current video facts

### P1-3: License-specific attribution for 21 photos

1. Reopen all 21 current Wikimedia Commons description pages. Record the current permalink, work title when supplied, photographer/author, precise license/version, copyright notice when supplied, disclaimer/notice retention facts, verification date, and alteration/crop state. Preserve unknown facts as `null`; never invent a notice.
2. Partition records explicitly into CC BY, CC BY-SA, and CC0 buckets. A single attribution template must not flatten their obligations.
3. For each cropped CC BY-SA record, add an explicit compatible Adapter's License name and link. For 2.0 records, visibly render the supplied work title. For 4.0 records, retain/render supplied copyright and disclaimer notices or explicitly record that the source page supplied none.
4. Extend the strict registry contract, checker, UI attribution, and unit/e2e tests. Reject missing title-on-2.0, missing 4.0 notice-retention state, any SA crop without a linked adapter license, or an adapter license on incompatible records.

### P1-4: Correct ESPN channel identity

1. Correct current facts for `V9mtX4mE8wQ` and `RDDGpqOvSdg` from `NBA on ESPN` to uploader/channel `ESPN` (`@espn`). Prior immutable manifests/review sets remain unchanged; represent corrections through the new correction batch and current case bindings.
2. Rebind exactly the affected current cases, preserve all clinical strings, recompute video/source and case digests, and update only dependent Q3 digest pointers.
3. Any changed case approval is invalidated to in-review pending the owner's named re-review. Do not reuse Decision 4/5/8 timestamps or approval digests for bytes the owner has not yet reviewed.

After P1 focused and full applicable gates pass, commit P1 with conventional commits, refresh governed local review artifacts as required, and confirm a clean worktree before P2.

## P2 — NBA citation presentation and photo source-risk classification

### P2-5: NBA.com deep links become plain-text citations

1. Preserve evidence data and canonical URL text, but render every NBA.com deep URL as a non-clickable citation containing publisher, title, date, and literal URL. Do not redirect these citations to ESPN and do not alter clinical prose.
2. Apply the same centralized predicate to source lists, external-video fallbacks, cards, metadata, no-JS fallbacks, and any other rendered path. Team/homepage links may remain clickable only if explicitly allowed and tested; fail closed for all other `nba.com` paths.
3. Build the complete review output and mechanically prove that no anchor/iframe/schema/redirect points to an NBA.com deep path while the expected literal citation text remains visible.

### P2-6: Classify the 21 photo sources

1. Using the current Commons description/image context, classify every governed photo as either `game-action-high-risk` or `non-event-low-risk` (media day, public event, fan context, or preseason warm-up). Record a concise evidence basis, current verification date, and source-page permalink.
2. This task is classification and marking only. Do not replace, delete, or newly approve a photo based on the category; actual removal is reserved for a later owner decision.
3. Extend schema/checkers/tests so all 21 records have exactly one supported category and UI/internal review output makes the classification auditable without implying that low risk means cleared.

After P2 focused and full applicable gates pass, commit P2 with conventional commits and refresh any governed local review artifacts.

## Validation and artifact refresh

At each priority boundary run focused tests first, then the applicable complete local gate under Node 24.14.0. The final tree must pass at least:

```bash
npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_RIGHTS_PLAN"
npm run format:check
npm run check
npm run content:check
npm run research:check
npm run research:check-manifest
npm run research:registry:check
npm run player-photos:verify
npm run brand:verify
npm run test:coverage
npm run build:review
npm run test:e2e
npm run test:lighthouse
npm run verify:review-artifact
git diff --check
```

If product/supporting-data/renderer bytes change, follow the existing clean-commit sequence: commit the bounded priority work; generate and verify `review/review-set.v1.json` from that clean commit and commit it separately; build review output, generate/verify `review/private-dist-manifest.v1.json`, and commit it separately. Never regenerate `review/served-review-receipt.v1.json` because hosting is neither reloaded nor probed.

## Completion conditions

- P0, P1, and P2 each reach green applicable gates and conventional local commits in that order.
- Anthony Edwards 2023 cannot render the known Taiwan-blocked iframe; a replacement, if any, is official, exact-event, and currently verified for Taiwan.
- No OG/social/card/infographic raster combines a CC BY-SA player photo with site-owned design, and an automated guard prevents such a path.
- All 21 photo records are license-bucketed with version-appropriate attribution and are separately risk-classified; every cropped SA record carries a linked Adapter's License.
- Current channel identity for the two named ESPN uploads is correct through append-only source correction.
- NBA.com deep URLs are present only as non-clickable citation text in rendered review output.
- Every changed clinical digest is fail-closed pending owner re-review; no approved clinical wording changes, no owner identity is fabricated, and no new medical-review/public-rights/publication decision is created.
- Final worktree is clean. No push, deployment, hosting/service/account mutation, indexing, public release, or served-receipt change occurs.

## Current planning-cycle bind and stop

This is the only executable write before the strict decision exists:

```bash
ATLAS_NODE_BIN="$(mise where node@24.14.0)/bin"
export PATH="$ATLAS_NODE_BIN:$PATH"
ATLAS_RIGHTS_PLAN="docs/superpowers/plans/2026-08-12-g6-rights-remediation.md"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain --untracked-files=no)"
test "$(git status --porcelain --untracked-files=all)" = "?? $ATLAS_RIGHTS_PLAN"
npm run plan:bind -- "$ATLAS_RIGHTS_PLAN" --status not-authorized --role g6-rights-remediation --scope decision-11-g6-rights-remediation-only --closed-scopes deployment,external-account-mutation,hosting-service-mutation,indexing,medical-content-authoring,medical-review-decision,public-release,remote-repository-mutation
npm run plan:verify
```

Capture a negative `plan:assert-authorized` result, commit exactly this plan and `docs/decisions/plan-binding.v1.json` with a conventional documentation commit, and return to a clean worktree. Then create the strict exact-digest authorization artifact from Decision 11, bind it through `plan:bind --status authorized`, verify/assert again, commit that decision plus binding, and only then begin P0.
