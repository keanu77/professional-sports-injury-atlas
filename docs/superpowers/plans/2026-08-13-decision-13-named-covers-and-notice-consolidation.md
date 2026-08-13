# Decision 13 Named Covers and Notice Consolidation Plan

> Status: NOT AUTHORIZED. Owner Decision 13, communicated by 吳易澄醫師 on 2026-08-13, authorizes the two bounded outcomes and this planning/registration cycle. Repository execution still requires a strict `PlanExecutionDecisionV1` bound to this plan's exact final path and SHA-256. The durable owner-decision log currently ends at Decision 12, so this plan and its append-only `not-authorized` binding are the only writes allowed in the present cycle; no policy, registry, asset, product, test, review-artifact, or service byte may change yet.

**Goal:** Keep every named athlete/case route while replacing all 19 current `game-action-high-risk` player covers with verified non-event CC photos or original SVG fallbacks, and consolidate site-wide notices into a legally complete but visually restrained system without changing any approved clinical wording.

**Architecture:** Evolve the immutable photo policy and registry through append-only successor versions, separating occasion classification, photographer/provenance risk, exact license obligations, and current-cover selection. Preserve ordinary HTML/CSS use of eligible photos while mechanically excluding every CC BY-SA photo from site-composed OG, card, infographic, or social raster inputs. In parallel, inventory each notice sink and move reusable obligations into a canonical credits/notices route plus one compact medical-notice component at clinical consumption points. Bind all changes into the existing review-set and private-manifest chain, then restart only the already-authorized local private review service.

**Tech stack:** Node.js 24.14.0 from the owner-pinned mise installation, TypeScript, canonical JSON, SHA-256, Astro 7, Vitest, Playwright/axe, local Git, Wikimedia Commons fixed revisions and original-source evidence, exact Creative Commons license versions, and the existing review/private-artifact tooling.

## Scope and authority

- Execution role: `decision-13-named-covers-and-notice-consolidation`; execution scope ID: `decision-13-named-covers-and-notice-consolidation-only`; required closed scope IDs: `deployment`, `external-account-mutation`, `hosting-service-mutation`, `indexing`, `medical-content-authoring`, `medical-review-decision`, `public-release`, `remote-repository-mutation`.
- Outcome authority is the owner's Decision 13 instruction dated 2026-08-13. The strict execution decision must identify 吳易澄醫師, supply an exact UTC decision time, repeat this role/scope/closed-scope set, and bind this plan's final SHA-256. Neither free text nor the unamended owner-decision log substitutes for that artifact.
- Decision 11 remains controlling for boundaries: G6 stays paused, `allowIndexing=false`, approved clinical wording is immutable, and no push, public deployment, indexing, external-account change, or hosting reconfiguration is permitted. Decision 11 P0-2's CC BY-SA composite-image guard is carried forward unchanged.
- Workstream A covers the 21 currently governed athlete photos: replace the 19 high-risk current covers identified by `docs/reviews/2026-08-12-g6-rights-p2-evidence.md`; revalidate the two existing non-event records rather than assuming they are cleared; regenerate every dependent named cover; and retain a named route even when its only compliant cover is site-owned SVG artwork.
- Workstream B covers every user-visible or review-mode statement-like element: medical disclaimers, photo/CC attribution, source citations, educational-use language, rights/provenance warnings, review/noindex banners, and any duplicate explanatory copy discovered by the complete route audit.
- Permitted future local mutations, only after exact authorization, are the narrowly necessary source-policy successor, photo-registry successor, accepted local photo originals or site-owned SVG fallbacks, cover and notice renderers, a dedicated credits/notices route, checkers, tests, dated `docs/reviews/` evidence, review-set, review build, private manifest, conventional local commits, and one exact restart of the existing authenticated private review service.
- The service restart is a bounded artifact reload, not permission to render or change launchd configuration, provision credentials, change the listener/port/Tailscale identity, load an alternate service, mutate a hosting account, or regenerate the historical served-review receipt. If repository governance classifies even that exact restart as the closed `hosting-service-mutation` scope, execution stops for a corrected owner decision instead of weakening the boundary.

## Non-goals

- No G6 clearance, publication, deployment, indexing, DNS, Cloudflare, external-account, remote, push, or release work.
- No medical-content authoring, medical-review decision, change to approved case/overview/update prose, diagnosis, mechanism, treatment, return-to-play guidance, or case/video/source identity.
- No claim that a CC label, Commons availability, non-event setting, public appearance, or `non-event-low-risk` classification alone proves copyright authority, personality-rights clearance, or public-release readiness.
- No use of official league/team headshots, commercial agency/newswire photos, game footage, screenshots, thumbnails, fair-use/NC/ND/unknown material, ambiguous identities, or uncertain provenance. Decision 13 permits eligible media-day and other non-event contexts; it does not silently waive the remaining media red lines.
- No site redesign beyond notice density, hierarchy, component consolidation, and the cover changes required by Decision 13.
- No rewriting of immutable `nba-v3`, `nba-v4`, or `player-photo-registry.v1/v2/v3` bytes merely to make a successor appear historical.

## Frozen starting state and governance migration

- Planning-time branch is `main` at clean commit `f4c625af3f5a8398588ee79596d328178889c28d`. The governance-only plan commit will advance HEAD; the executor must record the later clean authorized starting commit and stop on unexplained product/policy drift.
- The P2 evidence SHA-256 is `e1dde1d529f573bea9252c7067a8ce6a3af61daf3d52b827c4d08cebc9147259`. It partitions 21 current assets into 19 `game-action-high-risk` and two `non-event-low-risk` records (Dwight Powell and Trae Young). Low risk remains context triage, not clearance.
- Historical registry v1 is frozen at `770a7e6d7f13ecd0dda17a629b13f179357b9c64ebc268404a5640ad9aa08eec`; v2 at `0fa9a14660d798b32586047eaec1a0fc14912ca8710aaccc83963ac4f9dc28d0`; current v3 at `d91e97aa34e347375dd5ca14cf961208ae4b2c43cc8a90a01bea49f1172a3c05`. V3 is the current projection and carries the P2 risk object.
- Decision 13's instruction to update `player-photo-registry.v1.json` is implemented as updating the governed player-photo registry lineage and its current projection through the next schema version (v4 at this baseline), while keeping the historical v1 path and digest intact. If the owner instead intends literal v1 byte mutation, the executor must stop and obtain explicit invariant-migration authority covering every v1/v2/v3 lineage assertion, bound evidence digest, and checker; it may not silently rewrite history.
- Immutable `nba-v3` has Markdown digest `7dc98d1146ffe701a312694512bfe513f27d3edb8ecaeeb2f933a92f9fb32ca2`; immutable attribution addendum `nba-v4` has digest `929ac5f125db222d8eb6e98a3a52b1778ebd28c743884c945ab917619ebd5994`. Because `nba-v3` prohibits official media-day/photo-shoot portraits while Decision 13 newly permits qualified non-event media-day material, execution must create the next policy version rather than edit either predecessor. The successor may admit independently licensed non-event media-day/editorial photographs, but official team/league headshots and the other red lines remain rejected unless a later owner decision explicitly says otherwise.
- All 26 governed cases, three injury overviews, the current quarterly update, their medical-review approvals, and their approved clinical strings are frozen inputs. Before product work, hash them and create a byte-for-byte after-check.
- Runtime is exactly `/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin/node`; every npm command must use `export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"` and assert `node --version` is `v24.14.0`.
- The public release remains held and `allowIndexing=false`. Existing review authentication, listener, credentials, Tailscale identity, launchd label/configuration, and served-review receipt are frozen operational inputs.

## Task 0: Require exact authorization before execution

From a clean worktree, require the repository decision and exact binding before any phase below:

```bash
export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_D13_PLAN="docs/superpowers/plans/2026-08-13-decision-13-named-covers-and-notice-consolidation.md"
ATLAS_D13_DECISION="docs/decisions/2026-08-13-decision-13-named-covers-and-notice-consolidation-authorization.v1.json"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain)"
npm run plan:decision:verify -- --decision "$ATLAS_D13_DECISION" --plan "$ATLAS_D13_PLAN"
npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_D13_PLAN"
```

Any runtime mismatch, dirty tree, missing or stale strict decision, owner/scope mismatch, plan digest mismatch, failed binding, or failed authorization assertion stops execution. A new relevant upstream commit requires a recorded impact review; it is not permission to rebase the plan's meaning informally.

## Phase 0 — Freeze baselines and add append-only governance contracts

1. Record the authorized starting commit, exact hashes for the policy/registry lineage, all current cover inputs and outputs, all approved clinical inputs, `allowIndexing`, review/private manifests, and the existing service configuration identity. Record the 19/2 P2 partition as the required starting set.
2. Create the next immutable photo-policy pair (v5 at the planning baseline), inheriting all compatible v3/v4 requirements while explicitly defining Decision 13's accepted non-event contexts: verified media day, press conference, public event/fan interaction, award ceremony, and documented preseason/tune-up warm-up outside live competition. Regular-season pregame, live preseason competition, game/postseason/international/All-Star action, and ambiguous credentialed-court context remain high risk and ineligible.
3. Define occasion classification separately from photographer/provenance risk. At minimum distinguish a verified individual photographer at a public non-event (`independent-public-event-low-risk`), a credentialed media photojournalist with a verified license chain (`credentialed-media-residual-risk`), and unresolved/washed provenance (`unresolved-reject`). Never infer photographer authority from the Commons or Flickr uploader name alone.
4. Add a successor registry contract that binds all predecessor bytes and can express exact athlete/case mappings, fixed Commons revision, upstream/original URL, exact supplied work title or `not-supplied`, photographer and uploader identities, exact license/version/link, BY/BY-SA/CC0 bucket, notice-retention state, alteration, Adapter's License when required, occasion evidence, photographer-risk evidence, local bytes/dimensions/hash, crop checks, current-cover status, supersession reason, and original-SVG fallback provenance.
5. Preserve the v4 `rightsAttribution` semantics. BY, BY-SA, and CC0 remain separate templates; unknown values remain explicit rather than invented. Every cropped/presentation-cropped BY-SA work declares a linked, version-compatible Adapter's License; BY and CC0 never receive ShareAlike language.
6. Add contract tests that reject predecessor drift, same-version drift, a high-risk current cover, missing occasion or photographer evidence, an unsupported license, a bucket/license mismatch, missing title/notice state, an invalid Adapter's License, a remote image fetch, or an SVG containing embedded/linked third-party raster content.

### Phase 0 acceptance and evidence

- The exact predecessor digests remain unchanged, the new policy/registry schemas validate, the frozen clinical-byte inventory is complete, and the contract can represent both accepted photos and original SVG fallbacks without pretending an SVG has a CC license.
- `docs/reviews/2026-08-13-decision-13-p0-governance-baseline.md` records commands, hashes, 19/2 roster, policy deltas, registry-lineage resolution, clinical freeze, and the non-clearance interpretation boundary.
- Commit Phase 0 conventionally and require a clean worktree before candidate discovery.

## Phase 1 — Workstream A candidate discovery, occasion triage, and freeze

1. Search replacements for exactly these 19 high-risk athletes: Anfernee Simons, Anthony Edwards, Brandon Clarke, CJ McCollum, Damian Lillard, Danny Green, Dejounte Murray, Ja Morant, Jayson Tatum, Joe Ingles, Kevin Durant, Kyrie Irving, LaMelo Ball, LeBron James, Markelle Fultz, Moritz Wagner, Ricky Rubio, Thomas Bryant, and Tyrese Haliburton. Reopen and revalidate the existing Dwight Powell and Trae Young sources under the same rules.
2. Open every original Commons page and fixed revision; when imported from Flickr or another upstream source, open that original page too. Preserve search queries, rejected candidates, original URL, Commons description/download URLs, exact revision, supplied work title, photographer, uploader, exact license/version/terms URL, original dimensions, and verification time. Search snippets, filenames, API labels, and copied Commons templates are never sufficient on their own.
3. Classify the occasion during discovery, before download or adoption. Accept only evidence-backed non-event contexts. A warm-up is acceptable only when evidence establishes a preseason/tune-up non-live context; regular-season pregame and actual preseason game action remain ineligible.
4. Independently classify photographer/provenance risk. An identifiable individual photographer documenting a public non-event is the lower-risk pattern. A credentialed media photojournalist may proceed only when the original license chain is verified and the residual risk stays explicit in the internal record/report. An unresolved author/uploader relationship, suspicious Flickr-to-Commons laundering path, commercial-agency origin, or ambiguous authority is rejected.
5. Partition viable candidates into CC BY, CC BY-SA, and CC0 before templating. Verify each exact version and all title, attribution, change, notice, and ShareAlike obligations. Do not treat Public Domain Mark as CC0 or flatten different versions into one generic CC record.
6. Prefer a compliant photo, but do not lower any threshold for coverage. When no candidate clears identity, occasion, author/provenance, license, and technical checks, freeze an `original-svg-fallback` decision for that athlete. Never retain the high-risk image as a fallback.
7. Use a Playwright/browser script patterned after `scripts/manual-youtube-embed-check.mjs` when interactive page state is needed. Save factual metadata and DOM evidence; do not copy article bodies or create screenshots of third-party source pages unless essential and rights-safe.

### Phase 1 acceptance and evidence

- All 19 replacement slots end in exactly one frozen outcome: a complete eligible-photo candidate or an original-SVG fallback. Dwight Powell and Trae Young each have a renewed keep/replace/fallback result; there are no unresolved current-cover decisions.
- Every accepted candidate has exact versioned license facts, title state, photographer and uploader evidence, original URL, fixed Commons revision, occasion category, photographer-risk category, and bucket-specific obligations. Every rejection and SVG fallback has a concise reason.
- `docs/reviews/2026-08-13-decision-13-p1-photo-candidate-evidence.md` contains the candidate/rejection ledger, BY/BY-SA/CC0 partitions, author-risk assessment, 21-slot outcome table, and explicit statement that low risk is not public-use clearance.
- Commit only the frozen discovery/governance evidence and require a clean worktree before asset adoption.

## Phase 2 — Workstream A asset replacement, registry promotion, and cover regeneration

1. Download only each accepted Commons original covered by the frozen record, verify its bytes/dimensions/hash, and store it locally through the governed asset pipeline. Create site-owned SVG fallbacks for every failed slot; SVGs must contain no external fetch, embedded raster, copied team/league logo, player likeness, or third-party font/artwork.
2. Promote the 21 current-cover selections through the append-only registry successor. Preserve the full historical record and supersession reason for each replaced high-risk asset. Make the current resolver consume only the successor projection; do not alter historical v1/v2/v3 bytes.
3. Regenerate every affected named case cover and responsive rendition. Photo captions must remain accurate non-event descriptions and must never imply that the image depicts the injury event. SVG fallbacks must be labelled as original illustrative covers, not athlete photographs.
4. Rerun source-risk classification after adoption. Every current photo must be `non-event-low-risk` for occasion, with its independent photographer-risk flag retained; every non-photo cover must be `original-svg-fallback`. The count of current `game-action-high-risk` covers must be zero.
5. Repeat Decision 11 P0-2 mechanically: inventory all tracked raster/SVG inputs, build transforms, OG/social metadata, cards, heroes, infographic paths, and composition-capable scripts/packages; trace every governed player-photo import into source and built review output; distinguish ordinary resize/crop from a baked site-owned composition.
6. Reject every CC BY-SA photo as an input to OG, social, case-card, infographic, or other site-composed image generation. If a composed image is required, use site-owned SVG/artwork or a separately verified BY/CC0 input whose obligations are met. Ordinary HTML/CSS placement and ordinary Astro renditions remain distinct from baked composites.
7. Add a fail-closed guard over generator inputs and output provenance. A negative audit must still report paths, commands, hashes/dimensions, and why each ordinary rendition is not a composition.

### Phase 2 acceptance and evidence

- Zero current cover references or generated current-cover outputs use any of the 19 high-risk originals. All named routes retain a valid cover, and no network request is needed to render it.
- The successor registry covers all 26 cases exactly once through 21 athletes, preserves predecessor digests, passes license/identity/occasion/author/crop/local-byte checks, and uses license-specific attribution rather than a shared template.
- No BY-SA photo is baked into any site-owned composite, and the automated guard fails on controlled forbidden fixtures.
- `docs/reviews/2026-08-13-decision-13-p2-cover-replacement-evidence.md` records before/after asset hashes, 21 final selections, risk reclassification, cover-output checks, composite audit, SVG originality checks, and unchanged clinical-byte proof.
- Commit Phase 2 conventionally and require a clean worktree before notice inventory.

## Phase 3 — Workstream B complete notice inventory and necessity matrix

1. Generate a route inventory from the current review build and trace every statement-like source/component into every rendered sink, including shared layout, home/index/overview/case pages, image captions, source lists, video panels, footer, review-only banner, no-JavaScript state, metadata/structured data, and responsive variants.
2. For each unique notice and occurrence, record exact text/hash, source path and line/component, route set, DOM selector/landmark, build mode, viewport behavior, repetition count, link targets, and whether it remains visible at the relevant content-consumption point.
3. Classify necessity with a documented basis rather than aesthetic preference:
   - `license-required`: exact CC author/title/license/source/change/notice/Adapter's License obligations, which may be provided in a reasonable medium-appropriate manner but may not disappear;
   - `medical-legal-review-required`: medical disclaimer language and placement related to Taiwan Physicians Act §25, using the current official statute text and named owner/legal review rather than an engineer's inference;
   - `evidence-or-policy-required`: source citations, non-event image clarification, accessibility limitations, review/noindex warning, and other governance controls;
   - `redundant-or-editorial`: duplicated explanations with no independent required fact, eligible for merging or removal only after its facts are mapped to a canonical surviving location.
4. Treat an `educational use` statement as a purpose description, not as a substitute for copyright permission or medical compliance. Determine whether it belongs once in the medical notice, once on the central page, or both based on the necessity matrix.
5. Capture the pre-change comparison set at fixed routes and desktop/mobile viewports. DOM snapshots are mandatory; representative screenshots are optional and should mask third-party imagery when it is not needed to evaluate notice layout.
6. Obtain named owner/legal confirmation of the medical row and the proposed minimum visible content before implementation. This confirms notice treatment only; it is not a new medical-content review decision and cannot modify approved clinical prose.

### Phase 3 acceptance and evidence

- Every rendered notice occurrence maps one-to-one to an inventory row and a necessity class; no legal/license-required field is proposed for deletion, and every redundant string maps to a surviving canonical location.
- The before-state evidence is reproducible by route, viewport, selector, and commit. The inventory distinguishes public-content notices from review-only/noindex governance banners.
- `docs/reviews/2026-08-13-decision-13-p3-notice-inventory-and-necessity.md` contains the complete matrix, primary authority references, owner/legal disposition fields, duplication analysis, route/DOM counts, and links to the before evidence under `docs/reviews/evidence/decision-13/notices-before/`.
- Commit the inventory/evidence conventionally; do not begin consolidation while a required row or owner/legal disposition is unresolved.

## Phase 4 — Workstream B consolidated presentation and before/after proof

1. Implement one canonical credits/notices route with stable deep anchors. Generate photo-credit rows from the current registry so each retains photographer, supplied title state, exact linked license/version, fixed Commons source, alteration disclosure, required notices, and linked Adapter's License for every BY-SA crop. BY, BY-SA, and CC0 remain visibly and semantically distinct.
2. At each photo use, retain one concise, adjacent, accessible line linking directly to that asset's credits anchor. The central route may carry the full attribution in a reasonable manner, but a generic footer link with no asset relationship is insufficient. No-JavaScript output must preserve the link and complete credits route.
3. Implement one canonical compact medical-notice component. Keep it visibly present once at each clinical content-consumption point; do not hide it only in a footer, modal, tooltip, hover state, or closed control. Remove repeated copies only after DOM tests prove the canonical instance remains visible and complete.
4. Consolidate educational-purpose and other explanatory wording according to the approved necessity matrix. Preserve source citations and provenance facts, but use consistent hierarchy, disclosure controls, or dedicated sections when permitted; do not relabel evidence as a legal disclaimer or delete citations merely to reduce page height.
5. Keep review-only/noindex status clear in the private build without leaking repetitive internal governance prose into every content block. Preserve `allowIndexing=false`, robots/meta/header behavior, and all existing authentication boundaries.
6. Freeze and compare approved clinical files and digests before and after. UI components may move notice copy, but no case, overview, quarterly-update, diagnosis, observation, management, or return-to-play string may change.
7. Capture the same routes/viewports/selectors as Phase 3 after the change. Test visual density, keyboard/focus order, landmarks, contrast, screen-reader names, deep-link destinations, JS-disabled behavior, and required-field completeness. Explain every reduced notice count or height by its canonical replacement.

### Phase 4 acceptance and evidence

- All legally or policy-required content remains present and discoverable; CC details resolve to the correct asset-specific anchor, and the compact medical notice is visible exactly where the approved matrix requires it without repeated stacking.
- Before/after DOM evidence covers the complete route set. Representative screenshots show reduced clutter at matched dimensions without clipping, overlap, inaccessible disclosure, or missing attribution; mobile and desktop both pass.
- All approved clinical bytes and digests remain identical, all three CC buckets pass their own template tests, and axe/keyboard/JS-disabled checks pass.
- `docs/reviews/2026-08-13-decision-13-p4-notice-consolidation-evidence.md` records the final architecture, copy-location ledger, required-field proof, clinical freeze comparison, DOM/screenshot deltas, and accessibility results, with after evidence under `docs/reviews/evidence/decision-13/notices-after/`.
- Commit Phase 4 conventionally and require a clean worktree before the final artifact cycle.

## Phase 5 — Integrated validation, artifact chain, and private service refresh

Run every command with the pinned runtime. Focused checks run within each phase; the final source commit must pass the complete applicable gate:

```bash
export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"
test "$(node --version)" = "v24.14.0"

npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_D13_PLAN"
npm run format:check
npm exec -- tsc --noEmit
npm run check
npm run content:check
npm run research:check
npm run research:check-manifest
npm run research:registry:check
npm run player-photos:verify
npm run brand:verify
npm run test:coverage
npm run test:e2e
git diff --check
```

The current baseline is 891 unit tests and 196 Playwright checks. The final result must be at least `891/891` and `196/196`; if Decision 13 adds test cases, report the higher `N/N` totals rather than deleting or coalescing tests to preserve the old numbers. Prettier, explicit `tsc --noEmit`, Astro checks, plan binding, photo/policy/registry gates, and all accessibility/browser assertions must be green.

After the bounded source/policy/registry/UI/test/evidence commit is clean, execute the artifact chain in this order:

1. Run `npm run review-set:generate`, verify the clinical/content freeze and refreshed renderer/supporting-data bindings, and commit only `review/review-set.v1.json`.
2. From that clean review-set commit, run `npm run build:review` and `npm run verify:review-artifact`; prove all routes remain noindex and the before/after DOM assertions match the built bytes.
3. Run `npm run private:manifest`, verify exact coverage and review-set/renderer binding, and commit only `review/private-dist-manifest.v1.json` before any service action.
4. Record the existing service configuration/listener/credential identity without changing it, then run exactly `npm run private:service -- restart`. Do not run `render`, `load`, `unload`, or credential provisioning. If restart fails, leave the service fail-closed and do not start an alternate listener.
5. Run read-only authenticated and unauthenticated smoke checks against the existing private endpoint: the new review-set/private-manifest digests and representative cover/notice DOM must be served to the authorized path, while the unauthorized path remains denied. Do not regenerate `review/served-review-receipt.v1.json`.
6. Re-run `npm run plan:verify`, confirm the plan remains exactly authorized, confirm all closed scopes and `allowIndexing=false`, and finish with a clean worktree after committing the final evidence report.

### Phase 5 acceptance and evidence

- The exact sequence `review-set:generate → review-set commit → build:review → private:manifest → private-manifest commit → existing-service restart` is evidenced with commit IDs and artifact digests.
- Unit, Playwright, Prettier, `tsc --noEmit`, Astro, content/research/photo/brand, review-artifact, noindex, plan-binding, and private authenticated/unauthenticated checks all pass under Node 24.14.0.
- The existing service identity and access boundary are unchanged; only the reviewed artifact bytes advance. No historical served receipt is rewritten.
- `docs/reviews/2026-08-13-decision-13-p5-final-validation.md` records test totals, command results, commits/digests, service pre/post identity, smoke evidence, clinical-byte equality, zero current game-action covers, notice completeness, and every closed-scope negative assertion.

## Completion conditions

- All 19 original high-risk current covers are superseded by verified non-event CC photos or original SVG fallbacks; the two prior low-risk photos are independently revalidated; all 26 named cases retain a valid current cover; and current game-action cover count is zero.
- Every accepted photo binds exact title state, photographer/uploader evidence, original URL, fixed Commons revision, exact license/version, license bucket, alteration and notice facts, occasion evidence, photographer-risk evidence, and compatible Adapter's License where required.
- CC BY-SA material is absent from every site-composed OG/card/social/infographic image, with a fail-closed mechanical guard. No rejected high-risk image is retained as a fallback.
- The complete notice inventory has no uncategorized sink. Required CC and medical content survives in the approved compact architecture, source/evidence facts remain available, redundant duplication is removed only with a canonical replacement, and before/after DOM or screenshot evidence is complete.
- Approved clinical content is byte-identical. No medical-review/public-release decision is created or inferred, `allowIndexing=false`, and all eight closed scopes remain closed.
- The pinned runtime gates, at least 891/891 unit and 196/196 Playwright checks, Prettier, `tsc --noEmit`, plan binding, review build, private manifest, exact existing-service restart, and authenticated/unauthenticated private smoke tests pass. Final worktree is clean and nothing is pushed.

## Risks and controls

- **Flickr washing or false author identity:** preserve upstream and Commons evidence separately, classify photographer/uploader relationships, reject unresolved chains, and prefer SVG over inference.
- **Non-event classification mistaken for clearance:** keep occasion and photographer risk as separate fields plus a fixed non-clearance warning; require all license, identity, personality, and provenance checks independently.
- **Policy/history corruption:** create immutable successors and bind predecessor hashes. Literal v1 or nba-v3/v4 edits are a hard stop without explicit invariant-migration authority.
- **ShareAlike scope expansion:** retain linked Adapter's License for the crop itself, prohibit BY-SA inputs to composed images, and mechanically distinguish ordinary page placement from baked design artifacts.
- **Legal content hidden by visual simplification:** inventory first, require owner/legal disposition, keep asset-specific credit links and a visible medical component, and fail tests when required facts or consumption-point visibility disappear.
- **Clinical approval drift:** hash all approved clinical inputs and reject any byte/digest delta; notice work never edits case/overview/update prose.
- **Artifact/service mismatch:** use clean commits and the mandated review-set/build/manifest sequence, restart only after manifest commit, compare exact digests, and fail closed rather than launch an alternate server.
- **Evidence reproduces risky media:** prefer DOM and hash evidence; mask imagery in layout screenshots unless the image itself is necessary to prove the cover replacement.

## Rollback

- Roll back by forward corrective or `git revert` commits; never use destructive reset, rewrite immutable policy/registry history, or push. Preserve the evidence trail and regenerate dependent artifacts from a clean rollback commit.
- A rejected or later-challenged replacement photo rolls forward immediately to the last qualified non-event photo or, preferably when doubt remains, its site-owned SVG fallback. Rollback must never restore any of the 19 game-action high-risk covers.
- A notice regression rolls back presentation/layout to the last complete canonical notice implementation while retaining every required license, medical, source, and review-boundary fact. Do not solve a layout problem by deleting a required statement or by changing approved clinical prose.
- After any rollback source commit, repeat `review-set:generate → commit → build:review → private:manifest → manifest commit → exact existing-service restart` and the full validation/smoke gate. If the authenticated service cannot safely restart, leave it unavailable/fail-closed; never revive an unauthenticated legacy listener.
- Public release, indexing, deployment, remote/push, account, DNS, credential, listener, and hosting-configuration scopes remain closed throughout rollback.

## Current planning-cycle bind and stop

The present task performs only this plan registration:

```bash
export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_D13_PLAN="docs/superpowers/plans/2026-08-13-decision-13-named-covers-and-notice-consolidation.md"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain --untracked-files=no)"
test "$(git status --porcelain --untracked-files=all)" = "?? $ATLAS_D13_PLAN"
npm run plan:bind -- "$ATLAS_D13_PLAN" --status not-authorized --role decision-13-named-covers-and-notice-consolidation --scope decision-13-named-covers-and-notice-consolidation-only --closed-scopes deployment,external-account-mutation,hosting-service-mutation,indexing,medical-content-authoring,medical-review-decision,public-release,remote-repository-mutation
npm run plan:verify
```

Require a separate negative `plan:assert-authorized` result, stage exactly this plan plus `docs/decisions/plan-binding.v1.json`, commit with `docs(governance): register Decision 13 named-covers and notice-consolidation plan`, print this plan's SHA-256 and phase summary, and stop. The owner supplies the later strict authorization JSON; this planning cycle must not create it or execute any phase above.
