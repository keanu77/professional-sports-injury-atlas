# NBA Embed Batch 2 — Decision 8 Append-only Correction Plan

> Status: NOT AUTHORIZED. Decision 8 authorizes this bounded plan-and-binding cycle and supplies the substantive owner re-review for the four prescribed final case records, but the repository still requires a strict external `PlanExecutionDecisionV1` bound to this plan's exact final path and SHA-256 before any correction is executed. This cycle may add only this plan and its append-only `not-authorized` binding, commit those two files locally, print the plan digest, and stop.

**Goal:** Replace the four specified NBA.com primary-video links with the owner-approved YouTube identities, preserve each NBA.com page as event evidence, reissue medical approval only for the four resulting case bytes, and refresh the local review artifact without changing any clinical wording.

**Architecture:** Freeze a new immutable embed-review set and source-review decision, generate a four-entry correction manifest, and append it to the source-manifest registry without changing either earlier batch. Rebind exactly four case records to the correction entries, update only their video/source-video fields and owner-approved review digest, add the three new portrait identities to UI-only presentation metadata, bind the correction authority into the review-set authority projection, and regenerate the review set/build/private manifest through clean local commits. Reuse the recorded Taiwan Playwright evidence; do not repeat remote playback or caption testing.

**Tech stack:** Node.js 24.14.0, TypeScript, canonical JSON, SHA-256, Astro 7, Vitest, Playwright/axe for local UI tests only, Lighthouse, and local Git.

## Scope and authority

- Execution role: `nba-embed-batch2-correction`; execution scope ID: `decision-8-nba-embed-batch2-correction-only`; required closed scope IDs: `deployment`, `external-account-mutation`, `hosting-service-mutation`, `indexing`, `public-release`, `remote-repository-mutation`.
- Owner authority is Decision 8 in `/Users/ethanai/co-work/online_sportsinjury/.claude/g2-owner-decisions.md`, attributed to 吳易澄醫師 at `2026-08-10T11:36:08Z`. At planning time the complete authority file is SHA-256 `21da32cf7f4cb90e81b8e2f6cd754d357f1e2d94c2a67f3cedb3d5069e214774`.
- Browser evidence is `docs/reviews/2026-08-10-nba-embed-batch2-playwright-stop.md`, SHA-256 `9b35c30764c984ca71522c9191274ebcd2e555a49a82c8f5eb0de39d3592b0f4`. Its exact recorded playback, caption, orientation, and selection results are reusable evidence under Decision 8; execution must not browse or replay the remote videos merely to reproduce that test.
- `/Users/ethanai/co-work/online_sportsinjury/.claude/external-leads/embed-hunt-round2.json`, planning-time SHA-256 `9f743a5eeb7e669a3038287ee55608136f11fb2d3d44b608daf53442a2db8dd5`, may supply already-recorded title, uploader, channel, publication-date, and duration leads only. The repository Playwright record and Decision 8 control acceptance and caption state.
- The only permitted case-record mutations are the four exact `sourceManifestBinding` objects, their primary `video` facts, their `video-original` source facts, bounded numeric segment windows, and `review.reviewedAt`/`review.reviewedContentDigest`. The only permitted quarterly-record mutations are the matching four `addedCases[].currentClinicalDigest`/`currentVideoSourceDigest` pairs and `audit.updatedAt`. All clinical strings, event/diagnosis/teaching sources, event binding, public-rights state, case status, reviewer identity/qualification, quarterly prose/status/review fields, overviews, taxonomy, and the other 22 case files remain unchanged.
- Reviewer fields for the four corrected final bytes are exactly `吳易澄醫師`, `復健科專科醫師`, and `2026-08-10T11:36:08Z`. The digest is recomputed only after each final case payload is complete. No author, engineer, or automated check is substituted for this owner approval.
- `allowIndexing` remains false. This plan permits local correction artifacts, case/UI/test changes, local builds, `review/review-set.v1.json`, and `review/private-dist-manifest.v1.json`; it does not permit a push, remote creation, hosting credential/service/listener/receipt mutation, deployment, public release, indexing, or any external account change.

## Frozen starting state

- Branch `main`, clean content baseline `610f420515f01f8e84f49ed24395c9f5774cdc40`, with no configured Git remote.
- `.node-version` is `24.14.0`. The ambient shell may resolve Node 22, so every command must prepend `$(mise where node@24.14.0)/bin` and assert `node --version` is exactly `v24.14.0` before use.
- Source policy `nba-v2` remains the clinical/video policy: JSON digest `6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07`, Markdown digest `b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570`. The later `nba-v3` static-photo annex and governed Commons assets remain unchanged.
- Current registry bytes are SHA-256 `d34caee309f0f13d6403c9bcb3f85c781fd6ad4661cdfb54e881542683d65d32`. The launch manifest `NBA-SOURCE-2026-08-06-001` and first correction `NBA-SOURCE-2026-08-08-001`, their decisions, review sets, entries, and registry prefix are immutable.
- Current canonical review-set bytes are SHA-256 `11ee64ea407ba3a17d67d0d1a66f58988e48c90667dddc4045b8235049859656`; current private-dist-manifest bytes are SHA-256 `15d2c01b487d3d1c568ac328e7c3a915768162a6ac75fe53f4abc5028f09e099`. Review mode currently has 4/26 click-to-load embeds.

## Exact correction set

| Case / candidate | Superseded launch entry digest | Approved primary | Caption | Presentation |
| --- | --- | --- | --- | --- |
| `CASE-NBAANKLE-2023-004` / `CAND-NBA-ANKLE-2023-004` — Anfernee Simons | `41c20c51b043257c9a516c7197e000343e26328dea5a161f0083da3b21b3c0c9` | `https://www.youtube.com/watch?v=8TIJGIRP634` — NBA on ESPN | `available` | landscape |
| `CASE-NBAACHILLES-2025-016` / `CAND-NBA-ACHILLES-2025-016` — Jayson Tatum | `d9b0468b2b683bed03141a48b8d839fd751d923eb49ca6a98afca713174bc171` | `https://www.youtube.com/watch?v=xSUKd03LJwE` — NBA on ESPN | `unavailable` | portrait 9:16 |
| `CASE-NBAANKLE-2025-002` / `CAND-NBA-ANKLE-2025-002` — LaMelo Ball | `5318b193e5a43baa31fc29c82c47d6ff392cc9e07c0badfde951e577b51f22a8` | `https://www.youtube.com/watch?v=zZdndTqOexc` — NBA on ESPN | `available` | portrait |
| `CASE-NBAACHILLES-2025-017` / `CAND-NBA-ACHILLES-2025-017` — Tyrese Haliburton | `9341384e98fde6234074002d29eb97f0ca990f8899890ad4dcfecaf9f4ee0c56` | `https://www.youtube.com/watch?v=azQpbyDBktk` — ESPN | `unavailable` | portrait 9:16 |

The four old `reviewedContentDigest` values are respectively `0958fd8fe550da13460c3cbe80fc7ff5783cc7d9b3188785174bba6314633988`, `0d040d5f56f23ecb88ca75e0d83f70317e21aeb7a340c24f55c4597251dec953`, `b3389d4d64cd4be54c8f1ee333049da667a9d9f3ca7f59e4bbebeda66e4b4227`, and `c6aee02cae3858f932185cf9135ccb689d0b3fecfd7449a5390ff3914bddee6f`. Each must change to the digest of its corrected final payload; none may be copied forward.

`JNoDsgkZUbc` is a verified but rejected Haliburton alternate. It remains non-primary because Decision 8 selects `azQpbyDBktk` as closer to the injury moment.

## Task 0: Require the external execution decision

No correction byte may change until a separate external process creates and binds this exact decision:

```bash
ATLAS_NODE_BIN="$(mise where node@24.14.0)/bin"
export PATH="$ATLAS_NODE_BIN:$PATH"
ATLAS_CORRECTION_PLAN="docs/superpowers/plans/2026-08-10-nba-embed-batch2-correction.md"
ATLAS_CORRECTION_DECISION="docs/decisions/2026-08-10-nba-embed-batch2-correction-authorization.v1.json"
ATLAS_CONTENT_BASE="610f420515f01f8e84f49ed24395c9f5774cdc40"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain)"
test -f "$ATLAS_CORRECTION_DECISION"
npm run plan:decision:verify -- --decision "$ATLAS_CORRECTION_DECISION" --plan "$ATLAS_CORRECTION_PLAN"
npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_CORRECTION_PLAN"
git diff --exit-code "$ATLAS_CONTENT_BASE" -- src research review scripts tests package.json package-lock.json
```

The strict decision must match the final plan path/hash, role, execution scope, and all six closed scopes. A missing decision, stale digest, dirty tree, changed protected baseline, or failed authorization assertion stops execution. Decision 8 does not justify hand-editing the binding or skipping this gate.

## Task 1: Freeze the second correction batch append-only

1. Create `research/reviews/embed-enrichment/NBA-EMBED-2026-08-10-001-review-set.v1.json`. It contains exactly the four accepted corrections above, the one non-selected Haliburton alternate, exact links back to the immutable launch entries, and the Playwright result timestamps/basis from the frozen stop record. It records that no media, thumbnail, transcript, caption text, audio, or video was copied.
2. Bind the review snapshot with an `ownerDecision` using reviewer `吳易澄醫師` and `2026-08-10T11:36:08Z`. As in the first batch, `reviewedReviewSetDigest` is the SHA-256 of the exact `awaiting-owner-review` snapshot with `ownerDecision: null`; a checker must reconstruct those bytes and reject drift.
3. Add canonical `research/reviews/source-batches/NBA-SOURCE-2026-08-10-001-source-review-decision.v1.json`, bound to that reviewed snapshot, `nba-v2`, the four exact candidates, no classic exceptions, and the Decision 8 reviewer/timestamp. Do not create or alter the plan-execution authorization JSON in this task.
4. Generate immutable correction manifest `research/source-manifests/NBA-SOURCE-2026-08-10-001.v1.json`: `batchType=correction`, `period=2026-08-10`, two ankle entries, two Achilles entries, four recent/total entries, four verified embeds, zero external-only entries, and four exact one-to-one `supersedes` references to `NBA-SOURCE-2026-08-06-001`.
5. Append one registry entry whose `previousRegistryBytesDigest` matches the exact pre-append registry bytes. Preserve every existing registry byte as the canonical prefix and validate all referenced artifacts. Never rewrite the launch or 2026-08-08 correction bytes.
6. Add a strict batch-2 generator/checker or a data-driven extension that accepts both caption outcomes without weakening the first-batch contract. Tests must reject wrong candidate/video/uploader, unavailable-vs-available drift, wrong owner/time, stale supersedes references, duplicate identities, noncanonical YouTube URLs, an altered event source, reordered/rewritten prior registry entries, and selection of the Haliburton alternate.
7. Update `scripts/check-case-authoring-coverage.ts` and its tests to recognize exactly these four new active correction entries. Extend `tests/unit/real-content-authoring.test.ts` with the exact candidate-to-manifest mapping; do not replace the existing three-entry correction allowlist with a broad exception.

## Task 2: Rebind and reapprove four cases, then refresh dependent Q3 pointers

1. Modify only:
   - `src/content/cases/anfernee-simons-ankle-sprain-2023.json`
   - `src/content/cases/jayson-tatum-achilles-rupture-2025.json`
   - `src/content/cases/lamelo-ball-ankle-sprain-2025.json`
   - `src/content/cases/tyrese-haliburton-achilles-rupture-2025.json`
2. Rebind each `sourceManifestBinding` to its exact `NBA-SOURCE-2026-08-10-001` entry, manifest digest, source-review-decision digest, and unchanged `nba-v2` policy version.
3. Set the primary video to the approved canonical YouTube watch URL, verified embed/caption state, recorded uploader/provenance/date/duration, fresh video-identity digest, and bounded segment times. Keep every segment observation string byte-identical. Set `video.fallbackUrl` equal to the new canonical YouTube URL as required by the case contract; preserve the current NBA.com page only in the `event-context` source record, byte-for-byte.
4. Change the `video-original` source record only as required to describe the approved YouTube primary. Leave diagnosis, event, and teaching source records unchanged. Keep `video.publicRightsReview` exactly `not-requested`; Decision 8 is not a public-rights or public-release approval.
5. Add a deterministic clinical-projection guard against baseline commit `610f420515f01f8e84f49ed24395c9f5774cdc40`. It may exclude only the allowlisted source-binding/video/source-video/numeric-window/review-digest fields above and must prove every other scalar and array element in the four cases is unchanged. Separately prove the other 22 case files and all three overviews are byte-identical to baseline.
6. With each final payload complete, compute `computeCaseContentDigest()`, keep `review.status=approved`, and set only `review.reviewedAt` and `review.reviewedContentDigest` to the Decision 8 reissue. Require the stored digest to equal recomputation and to differ from the four frozen old values.
7. Refresh only those four entries in `src/content/updates/2026-q3.json`: `currentClinicalDigest` equals the final `computeCaseContentDigest()` and the legacy-named `currentVideoSourceDigest` equals `computeVideoIdentityDigest()`. Update `audit.updatedAt` to the Decision 8 timestamp, keep the update at `status=medical-review` / `review.status=in-review`, and prove every other update byte is unchanged under an exact allowlist. Do not create a global medical-review decision, approve the update, or modify an overview; those actions exceed Decision 8.

## Task 3: Bind correction authority and preserve player behavior

1. Extend `CONTENT_AUTHORITY_PLAN_ROLES` so an authorized `nba-embed-batch2-correction` plan and its exact execution-decision digest enter `contentAuthoritySnapshotDigest`. Add regressions proving the not-authorized plan does not change the snapshot, the authorized correction does, and hosting/photo/public/unrelated roles remain excluded.
2. Register `xSUKd03LJwE`, `zZdndTqOexc`, and `azQpbyDBktk` as portrait in `src/lib/video/facade.ts`; keep `8TIJGIRP634` landscape. Test every governed portrait ID and an unknown-ID landscape fallback.
3. Preserve the existing privacy-enhanced click-to-load implementation: no autoplay, no remote thumbnail, no YouTube request before a real click, canonical timestamp links, usable no-JavaScript fallback, keyboard focus, 44 px targets, and no stretched portrait iframe.
4. Review mode must render 8/26 click-to-load cases. In the public presentation resolver, Simons and LaMelo remain eligible on caption state, while Tatum and Haliburton deterministically degrade to labeled external links because `captionStatus=unavailable`. Do not loosen the caption rule or represent this as public-release clearance.
5. Expand `e2e/video-player.spec.ts` from the current four-entry `GOVERNED_YOUTUBE_CASES` to all eight corrected YouTube cases. Replace stale “all four”/“both Shorts” assumptions with exact assertions for eight governed cases, five portrait videos, the three new portrait IDs, Simons as landscape, the two new public caption fallbacks, click-to-load behavior, and zero pre-click requests.
6. Keep all governed Commons player-photo assets, provenance, attribution, focal positions, and fallbacks unchanged. The video correction must not regress their responsive rendering or create a pre-click third-party image request.

## Task 4: Validate the exact correction and noindex boundary

Run focused tests first, then the complete local gate under Node 24.14.0. At minimum:

```bash
npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_CORRECTION_PLAN"
npm run research:check
npm run research:check-embed-batch2-correction
npm run research:check-manifest
npm run research:registry:check
npm run format:check
npm run check
npm run content:check
npm run test:coverage
npm run build:review
npm run test:e2e
npm run test:lighthouse
npm run player-photos:verify
npm run brand:verify
npm run verify:review-artifact
git diff --check
```

The new package script `research:check-embed-batch2-correction` must be added as the strict exact-byte checker for the review set, source decision, correction manifest, and registry append. The gate must prove exact four-entry supersession, correct case/source/update cross-validation, current medical digests, 8/26 review-mode embed presentation, public caption fallback for exactly the two new unavailable-caption videos, portrait layout, zero pre-click third-party requests, and unchanged `allowIndexing=false`/robots/noindex behavior. The recorded remote Playwright playback/caption check is cited, not rerun. Do not run a deployment, hosting probe/reload, indexing mutation, or public-release success path.

## Task 5: Commit content and refresh local review artifacts

1. Commit the correction review/decision/manifest/registry, four case updates, four dependent Q3 digest-pair updates, authority projection, portrait metadata, checkers, and tests as one clean conventional content commit. Stage nothing outside this scope.
2. From that clean content commit, run `npm run review-set:generate`. Verify the four case clinical digests, referenced source batch set, content-authority snapshot, supporting-data digest, renderer digest, current-update digest, and content commit refresh; prove the other 22 case digests and all overview digests remain unchanged. Commit only `review/review-set.v1.json` in a separate `chore(review): ...` commit.
3. From the clean review-set commit, run `npm run build:review`, `npm run verify:review-artifact`, and `npm run private:manifest`. Verify the rebuilt `dist` and private manifest exactly cover the refreshed review set, remain noindex, and expose 8/26 click-to-load cases. Commit only `review/private-dist-manifest.v1.json` in a separate `chore(review): ...` commit.
4. Do not regenerate `review/served-review-receipt.v1.json`: no hosting service is reloaded or probed, so that receipt must continue to describe the currently served older artifact. Do not create a remote or push any commit.
5. Rerun applicable gates against the final tree, require `git status --porcelain` to be empty, and report the correction manifest/registry/review-set/private-manifest digests, the four new case digests, review/private embed counts, unchanged 22-case proof, final local commit, and retained noindex/hosting/remote boundaries.

## Completion conditions

- The immutable registry prefix is preserved and exactly one four-entry `NBA-SOURCE-2026-08-10-001` correction is appended.
- The four cases use the owner-selected YouTube identities in review mode; their NBA.com pages remain byte-identical event evidence, their YouTube fallback URLs equal their canonical URLs, their clinical wording is byte-identical under the guarded projection, and only their final content digests are reissued by the named physician.
- The other 22 cases, all overviews, all non-allowlisted Q3 fields, source-policy bytes, earlier source batches/decisions, photo assets, public-rights state, indexing state, served receipt, hosting service, remotes, and external accounts remain unchanged.
- Review mode reaches 8/26 click-to-load cases; Tatum and Haliburton remain public-mode external links while captions are unavailable; all portrait and privacy tests pass.
- All required local checks pass, the review set/build/private manifest are refreshed through clean local commits, and no push, remote creation, deployment, hosting mutation, public release, or indexing occurs.

## Current planning-cycle bind and stop

This section is the only executable work before the external `PlanExecutionDecisionV1` exists:

```bash
ATLAS_NODE_BIN="$(mise where node@24.14.0)/bin"
export PATH="$ATLAS_NODE_BIN:$PATH"
ATLAS_CORRECTION_PLAN="docs/superpowers/plans/2026-08-10-nba-embed-batch2-correction.md"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain --untracked-files=no)"
test "$(git status --porcelain --untracked-files=all)" = "?? $ATLAS_CORRECTION_PLAN"
npm run plan:bind -- "$ATLAS_CORRECTION_PLAN" --status not-authorized --role nba-embed-batch2-correction --scope decision-8-nba-embed-batch2-correction-only --closed-scopes deployment,external-account-mutation,hosting-service-mutation,indexing,public-release,remote-repository-mutation
npm run plan:verify
```

Capture a separate negative `plan:assert-authorized` check and require it to fail. Then stage exactly this plan and `docs/decisions/plan-binding.v1.json`, make one local conventional documentation commit, confirm the worktree is clean, print this plan's SHA-256, and stop. The authorization JSON is created only by the external follow-up cycle.
