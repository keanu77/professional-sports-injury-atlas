# Decision 14 Low-Risk Photographer Covers Plan

> Status: NOT AUTHORIZED. Owner Decision 14, communicated by 吳易澄醫師 on
> 2026-08-13, selects the bounded policy outcome and authorizes this
> planning/registration cycle only. Repository execution still requires a
> strict `PlanExecutionDecisionV1` bound to this plan's exact final path and
> SHA-256. This cycle may add this plan, append its `not-authorized` binding,
> and append the Decision 14 owner record; it may not execute any phase, create
> an authorization JSON, or change policy, registry, asset, product, test,
> review-artifact, or service bytes.

**Goal:** Reassess only the 16 current original-SVG athlete covers and replace
as many as actually qualify with real Creative Commons photographs, including
game or event photographs only when the work was self-published by a named,
evidence-backed low-risk photographer on the Decision 14 allowlist. Keep the
SVG whenever no candidate clears every gate, and leave the five current
Commons covers untouched.

**Architecture:** Create `nba-v7` as an immutable, append-only successor to
`nba-v6`, adding a conditional event-photo exception rather than deleting the
Decision 13 non-event rule. Freeze a named photographer allowlist from written
identity, self-publication, long-term license-history, and anti-washing
evidence; then apply the existing per-file identity, fixed-revision, exact
license, notice, crop, and local-byte checks independently. Advance the photo
registry through an append-only successor that keeps occasion and
photographer risk separate and requires every allowlisted event photo to carry
`credentialed-access-residual-risk` plus the Decision 14 owner-acceptance
reference. Reuse the Decision 13 credits/notices architecture and complete the
existing private-review artifact chain without changing clinical content.

**Tech stack:** Node.js 24.14.0 selected through mise, TypeScript, canonical
JSON, SHA-256, Astro 7, Vitest, Playwright/axe, local Git, Wikimedia Commons
fixed revisions, photographer-owned Flickr or direct-own-work Commons source
pages, exact Creative Commons license versions, and the existing
review/private-artifact tooling.

## Scope and authority

- Execution role: `decision-14-lowrisk-photographer-covers`; execution scope ID: `decision-14-lowrisk-photographer-covers-only`; required closed scope IDs: `deployment`, `external-account-mutation`, `hosting-service-mutation`, `indexing`, `medical-content-authoring`, `medical-review-decision`, `public-release`, `remote-repository-mutation`.
- Outcome authority is owner Decision 14 dated 2026-08-13. The later strict
  execution decision must identify 吳易澄醫師, provide an exact UTC decision
  time, repeat this role/scope/closed-scope set, and bind this plan's final
  SHA-256. The dated owner log and this plan do not substitute for that strict
  artifact.
- Decision 11 remains controlling for the release boundary: G6 is paused,
  `allowIndexing=false`, and no push, public deployment, indexing,
  external-account change, hosting reconfiguration, or remote-repository
  mutation is permitted. Decision 11 P0-2's CC BY-SA composite-image guard
  remains unchanged.
- Decision 13 is the frozen product baseline: five verified Commons photos and
  16 original SVG fallbacks serve all 21 athletes and 26 cases. Its unified
  medical disclaimer, compact notice treatment, adjacent asset-credit links,
  central credits/notices route, license-specific templates, and noindex/private
  review behavior are a non-regression floor.
- The only athlete selection records eligible for reassessment are the 16
  current `original-svg-fallback` records named in the frozen baseline below.
  The five current Commons selections, their local asset bytes, factual
  captions, attribution rows, and registry facts are out of scope and must
  remain byte-identical.
- After exact authorization, permitted local mutations are limited to the
  `nba-v7` policy pair, allowlist and candidate evidence, a player-photo
  registry successor, accepted local photo originals for the fixed 16-player
  set, the minimum resolver/credits/policy presentation changes needed for
  factual event-photo support, aligned checkers and tests, dated
  `docs/reviews/` evidence, review-set/private-manifest refreshes, conventional
  local commits, and one exact restart of the existing authenticated private
  review service.
- The service restart is only an artifact reload. It does not authorize
  changing launchd configuration, credentials, listener, port, Tailscale
  identity, network exposure, hosting account, or the historical served-review
  receipt. If repository governance classifies the exact restart as the closed
  `hosting-service-mutation` scope, execution stops for corrected authority.

## Owner residual-risk acceptance

吳易澄醫師知情並接受：持證攝影記者的商業授權能力可能受採訪證、場館、
聯盟或賽事條款限制。即使攝影者身分、自有帳號自行發布與長期一致的
Creative Commons 授權歷史都已驗證，賽場／賽事場合照片仍有無法
完全排除的授權鏈風險（G6 權利複審第 3 點）。

This is an informed acceptance of a bounded residual risk, not a finding that
the photographer has unrestricted commercial licensing authority. It is not
copyright or personality-rights clearance and does not authorize public
release. Consequently:

- every current event/game photo admitted through the named allowlist must use
  the exact photographer-risk token `credentialed-access-residual-risk`;
- its registry record and evidence report must cite `Decision 14`, preserve the
  acceptance statement or a stable governed reference to the exact
  `../.claude/g2-owner-decisions.md` Decision 14 heading, and keep the factual
  occasion classification in a separate field; and
- policy, registry, internal-evidence, and any presentation-copy validators
  must reject `no-risk`,
  `rights-cleared`, `licensed-for-public-use`, `public-release-approved`, or
  equivalent affirmative-clearance claims. Allowlisting never waives the
  per-file verification gates.

The token and full owner acceptance are mandatory internal governance facts;
Decision 14 does not require adding the full acceptance statement to every
public-facing cover. User-visible pages retain Decision 13's compact
non-clearance architecture unless a separate necessity review requires more.

## Non-goals

- No phase execution, source search, download, policy v7, registry successor,
  cover generation, test change, artifact refresh, or service action during
  this planning cycle.
- No reassessment, replacement, metadata rewrite, re-download, re-crop, or
  attribution rewrite for the five current Commons covers: CJ McCollum, Dwight
  Powell, Kevin Durant, Kyrie Irving, and LeBron James.
- No replacement-count target or requirement to reduce the SVG count by a
  particular number. A failed or unresolved candidate leaves the exact current
  SVG in place; coverage never justifies lowering a gate.
- No blanket admission of game/event photos. A non-allowlisted photographer
  remains subject to Decision 13's non-event occasion restriction, and an
  allowlisted name does not make every purported work by that person eligible.
- No uploader-to-photographer inference. A Commons importer, Flickr uploader
  label, filename, category, search snippet, or copied license template alone
  cannot establish authorship or authority.
- No newly admitted official team/league headshot, commercial agency or
  newswire material, footage-derived frame, screenshot, thumbnail, fair-use,
  all-rights-reserved, NC, ND, unknown-license, unresolved-provenance, or
  wrong-athlete material. Public Domain Mark and government public-domain
  statements remain distinct from CC0.
- No rollback of Decision 13 notice consolidation, no general redesign, and no
  change to approved case, overview, quarterly-update, diagnosis, mechanism,
  management, observation, or return-to-play text.
- No edit to any historical source-policy version, player-photo registry
  version, bound plan, bound decision, review decision, or other SHA-bound
  document. Successors and new evidence are append-only.
- No G6 clearance, medical-review decision, publication, deployment, indexing,
  DNS, Cloudflare, external-account, remote, push, or release work.

## Frozen starting state

- Planning-time branch is `main` at clean commit
  `4f34a0ae77d8d424498f5642fa0c847bc610af76`. An executor must record the
  later clean authorized starting commit and stop on unexplained relevant
  drift.
- Immutable `nba-v6` has Markdown SHA-256
  `b9a469344ff5061546619ea0ecbb5b7320965af40cde254d4939cf2e8835b0c1`
  and JSON SHA-256
  `1e27041de184b7b6397b2cfdde225706b40696f1d4456757193baa340f4cc93c`.
  `nba-v7` must bind these exact predecessor bytes; v1 through v6 remain
  unchanged and same-version drift fails closed.
- Registry v1 is frozen at
  `770a7e6d7f13ecd0dda17a629b13f179357b9c64ebc268404a5640ad9aa08eec`,
  v2 at
  `0fa9a14660d798b32586047eaec1a0fc14912ca8710aaccc83963ac4f9dc28d0`,
  v3 at
  `d91e97aa34e347375dd5ca14cf961208ae4b2c43cc8a90a01bea49f1172a3c05`,
  v4 at
  `ef7149b57ab5d08a328a0a7ed88177fc4d6a35af998bcfd95a0ec318bcf345b5`,
  and current v5 at
  `26129455fe5b9297c44ac91c3be1fc1678a928cf77bd12d00695614fe5df3985`.
  A successor must bind the exact v5 bytes and preserve all 21-athlete/26-case
  mapping facts.
- Decision 13 P1 evidence is frozen at
  `823be69338a4fdc6029750ac8003c84e0ebd4837106b6237e5082e20c6e50e1d`.
  It records the prior candidate/rejection reasons and the five/16 partition;
  its rejected event photos are leads for new review, not pre-approved inputs.
- The fixed 16-player target set is: Anfernee Simons, Anthony Edwards, Brandon
  Clarke, Damian Lillard, Danny Green, Dejounte Murray, Ja Morant, Jayson
  Tatum, Joe Ingles, LaMelo Ball, Markelle Fultz, Moritz Wagner, Ricky Rubio,
  Thomas Bryant, Trae Young, and Tyrese Haliburton.
- The frozen five-player non-target set is: CJ McCollum, Dwight Powell, Kevin
  Durant, Kyrie Irving, and LeBron James. Phase 0 must capture and later compare
  their complete v5 selection subtrees and local bytes, not merely their
  filenames.
- All 26 governed cases, three injury overviews, the current quarterly update,
  their medical-review approvals, and all already bound governance documents
  are frozen inputs. The current 30-file clinical freeze must remain
  byte-identical.
- The Decision 13 final baseline passed 929/929 unit tests and 216/216
  Playwright checks, served 42 review routes, used one compact medical notice
  at clinical consumption points, and generated five complete central photo
  credit rows. These are minimum non-regression baselines, not fixed totals.
- Every Node/npm command uses mise's Node 24.14.0 and must prove
  `node --version` is `v24.14.0`. The public release remains held,
  `allowIndexing=false`, and the existing private service identity,
  authentication, listener, credentials, and served-review receipt are frozen
  operational inputs.

## Task 0 — Require exact authorization before execution

From a clean worktree, require the strict decision and exact binding before any
phase below:

```bash
ATLAS_D14_PLAN="docs/superpowers/plans/2026-08-13-decision-14-lowrisk-photographer-covers.md"
ATLAS_D14_DECISION="docs/decisions/2026-08-13-decision-14-lowrisk-photographer-covers-authorization.v1.json"

test "$(mise exec node@24.14.0 -- node --version)" = "v24.14.0"
test -z "$(git status --porcelain)"
mise exec node@24.14.0 -- npm run plan:decision:verify -- --decision "$ATLAS_D14_DECISION" --plan "$ATLAS_D14_PLAN"
mise exec node@24.14.0 -- npm run plan:verify
mise exec node@24.14.0 -- npm run plan:assert-authorized -- "$ATLAS_D14_PLAN"
```

Any runtime mismatch, dirty tree, missing or stale strict decision, owner/scope
mismatch, plan digest mismatch, failed binding, or failed authorization
assertion stops execution. A later relevant commit requires a recorded impact
review; it is not permission to reinterpret this plan or edit its bound bytes.

## Phase 0 — Freeze baselines and the v7 contract

1. Record the authorized starting commit and exact hashes for policy v1-v6,
   registry v1-v5, all 21 current selections and local assets, the 30 clinical
   files, review-set/private-manifest inputs, `allowIndexing`, the current
   credits/notices output, and the existing private-service identity.
2. Freeze the 16 target selections and five non-target selections separately.
   Specify negative guards proving that discovery, promotion, and generation
   cannot select an athlete outside the fixed 16 or alter any field/byte of the
   five current Commons covers.
3. Specify `nba-v7` as an append-only successor that inherits every compatible
   v6 clinical, video, privacy, license, attribution, notice, download, SVG,
   crop, and composite-use control. Keep all v6 ineligible-occasion tokens as
   the default rule; add a conditional named-allowlist event exception rather
   than deleting or globally redefining them.
4. Define a distinct source classification for a verified allowlisted
   photographer's game/event photo. Eligibility is exactly:
   `(v6-qualified non-event photo) OR (factual event occasion AND photographer
   allowlist match AND verified self-published original AND complete per-file
   checks AND credentialed-access-residual-risk marker)`. Every other result
   fails closed to the current SVG.
5. Before reviewing any name, encode these minimum floors: at least three years
   between the first and latest verified self-published sports work; at least
   50 self-published sports works in the reproducibly enumerated corpus; a
   license-independent, date-stratified deterministic sample of at least 30
   works with 100% matching exact CC tokens and zero unexplained deviations;
   and at least one Commons/Wikipedia reuse chain evidenced by fixed revisions
   spanning 24 months without a located authorship/license/takedown dispute.
   Define exactly six conditional event-occasion tokens:
   `all-star-game-action`, `international-competition-action`,
   `live-preseason-competition`, `postseason-action`,
   `regular-season-action`, and `regular-season-pregame-or-warm-up`.
   Unknown, `other`, unresolved, closed-practice, and
   `ambiguous-credentialed-court-context` values always fail. A weaker floor or
   new occasion token requires a later owner decision and policy successor,
   not an ad hoc reviewer disposition.
6. Define the machine-verifiable allowlist record. Each named entry must have a
   stable `photographerId`, canonical public name, verified long-lived account
   IDs/URLs, `accountControlType`, the candidate's credited maker identity,
   first/last dated sports-photography evidence, self-publication proof,
   `expectedLicenseToken`, observed/matching/deviation work counts and reasons,
   the deterministic collection/sample method, long-term Commons/Wikipedia
   reuse page/revision counts, dispute/takedown-search method and date,
   per-signal washing checks, named checker/date, a written evidence paragraph,
   and an immutable evidence path/digest. Vague claims such as “many works” or
   “long history” fail, as does a shared/brand account that cannot bind the
   candidate to the credited individual maker.
7. Define washing checks as separately recorded pass/fail/unresolved findings
   for EXIF-series consistency, native resolution patterns, capture time and
   location plausibility, neighboring-event sequence continuity, and account
   behavior inconsistent with compilations or repost collections. Every
   finding carries its basis, photographer-owned original work IDs/URLs,
   checked-at/by values, and the deterministic sample rule; Commons thumbnails
   and third-party derivatives cannot establish EXIF or native-resolution
   consistency. Any failed or unresolved required finding prevents
   allowlisting.
8. Define per-event-photo fields beyond the existing v6 provenance set:
   allowlist photographer ID, matched self-published account ID, original
   self-upload URL, finite factual event-occasion token, event date/opponent/
   competition evidence, relationship to the governed injury event,
   allowlist-evidence reference, `expectedLicenseToken`, candidate-license
   match result, `credentialed-access-residual-risk`, the exact owner-record
   path/heading reference, and the fixed non-clearance statement. Preserve
   exact title state, fixed Commons revision, exact license/version/link,
   notices, a same-version compatible Adapter's License limited to the crop
   contribution, alteration, athlete/case identity, local bytes, dimensions,
   focal position, and supersession separately. A candidate license differing
   from the verified historical token, or an unresolved injury-event
   relationship, fails closed; this plan does not authorize exceptions.
9. Preserve v6's generic non-event sentence for non-event photos. Define a
   truthful event-photo sentence such as
   `賽事場合資料照片；非本案例受傷當下影像`, plus an asset-specific
   occasion caption. A candidate from the same governed injury event is
   ineligible under this plan; candidate-vs-injury date/opponent/competition
   must prove a different event before the sentence may be used.

### Phase 0 acceptance and evidence

- All predecessor, five non-target cover, clinical, notice-architecture, and
  service baselines are complete; no historical byte has changed.
- The conditional decision table, allowlist schema, per-photo residual-risk
  fields, target-set guard, and negative fixtures are fully specified before
  any photographer is named or any candidate is adopted.
- `docs/reviews/2026-08-13-decision-14-p0-governance-and-v7-contract.md`
  records commands, hashes, rosters, v7 delta, field contract, non-clearance
  semantics, clinical freeze, and all closed-scope assertions.
- Commit only the Phase 0 governance/contract evidence and require a clean
  worktree before allowlist research.

## Phase 1 — Research and freeze the named photographer allowlist

1. First run the complete fixed-query lead discovery across all 16 target
   athletes without adopting any candidate. Freeze every plausible candidate,
   connected photographer/account, query, and exclusion so the allowlist
   research population is complete before policy v7 is written. A
   photographer is not added merely because another work passed Decision 13 or
   because the account is well known.
2. Verify identity and long-term consistency through a real name or stable
   public account, corroborating account ownership and multiple years of dated
   sports-photography work. Record canonical account IDs so similar display
   names cannot be merged automatically.
3. Require the original work to have been posted through the photographer's
   verified own Flickr account or as direct own work through the
   photographer's verified Commons account. A third-party Commons crop/import
   may only point back to that independently verified self-published original;
   the importer's identity never proves the photographer's identity or
   licensing authority.
4. Apply the predeclared numeric thresholds and deterministic collection/sample
   rule. Verify a multi-year body using `expectedLicenseToken`, observed,
   matching, and deviation counts, earliest/latest dates, and long-term reuse
   through fixed Commons/Wikipedia revisions. An unexplained license deviation
   rejects the entry. Search and record known removal, authorship, license, or
   takedown disputes. A negative search is bounded negative evidence, never
   proof of zero risk.
5. Run every washing-signal check from Phase 0 against account series and
   candidate-adjacent works. Reject a compilation/repost pattern, unexplained
   EXIF or resolution discontinuity, implausible place/time sequence, or any
   unresolved self-publication relationship.
6. Produce one named evidence paragraph and one complete pass/fail matrix per
   reviewed photographer. Only entries with every required criterion passed
   enter the allowlist; rejected and unresolved names remain in a rejection
   ledger with concise reasons.
7. Freeze and commit
   `docs/reviews/2026-08-13-decision-14-p1-photographer-allowlist-evidence.md`
   before creating policy v7. Then create immutable `nba.v7.md` and
   `source-policy.v7.json`, bind the exact v6 pair and exact allowlist-evidence
   digest, encode the named entries and conditional exception, and add
   fail-closed policy/checker tests.
8. Negative tests must reject an unlisted photographer, account-ID mismatch,
   unresolved individual maker behind a shared/brand account, third-party-only
   upload, missed numeric threshold, deterministic-sample drift, historical or
   candidate license-token mismatch, absent/stale evidence, unresolved washing
   signal or injury-event relationship, unknown/other/ambiguous/closed-practice
   occasion, same-version policy drift, broad event-photo admission, missing
   owner-record citation, or affirmative-clearance wording.

### Phase 1 acceptance and evidence

- Every allowlist entry has independently reproducible evidence for identity,
  years-long sports-photography continuity, self-publication, consistent CC
  history/long-term reuse, and absence of an observed washing signal under the
  documented method. No unresolved required field is waived.
- The final v7 pair binds the exact v6 bytes and the already-frozen Phase 1
  evidence; non-allowlisted photographers still follow Decision 13's non-event
  limit, and all absolute media red lines remain enforced.
- The Phase 1 evidence includes the named allowlist, rejected-name ledger,
  exact source URLs/revisions, search methods/dates, per-person evidence
  paragraphs, checker identity, and the owner residual-risk boundary.
- Commit the evidence first and the policy/checker contract second; require a
  clean worktree before per-athlete candidate discovery.

## Phase 2 — Rehunt and freeze candidates for exactly 16 SVG covers

1. Search exactly the fixed 16-player roster. Use the Decision 13 rejection
   ledger and Phase 1 lead ledger as prior evidence, reopen potentially
   eligible sources, and adjudicate additional works from the already-frozen
   named photographer population without touching the five current Commons
   selections. A genuinely new photographer discovered after v7 is frozen is
   recorded as out-of-cycle and requires a later policy successor; v7 is never
   edited in place.
2. A non-event candidate may proceed under the unchanged v6/Decision 13
   criteria even when its photographer is not on the event allowlist. A game
   or event candidate may proceed only when its photographer and original
   self-published account match a final Phase 1 allowlist entry exactly.
3. Open the current Commons description and fixed revision for every candidate.
   Open the photographer-owned upstream original when the Commons file is an
   import or derivative. Search snippets, filenames, categories, API license
   labels, and Commons/Flickr uploader names alone are never evidence.
4. Verify each photo independently: athlete and case mapping, original URL,
   fixed Commons revision ID/permalink/timestamp, original filename and
   dimensions, exact supplied title or `not-supplied`, photographer and
   uploader identities/relationship, exact license/version/link and bucket,
   copyright/disclaimer/other notices, alteration, a linked same-version
   compatible Adapter's License limited to the crop contribution for BY-SA
   crops, focal position, and factual occasion. The candidate's exact license
   token must match the allowlist history token.
5. Record occasion and photographer risk separately. An accepted allowlisted
   event photo always retains one finite v7 game/pregame/warm-up/All-Star/
   postseason/international event token and separately records
   `credentialed-access-residual-risk` with the Decision 14 reference. It is
   never relabeled `non-event-low-risk` merely to pass an old checker;
   unknown, other, ambiguous credentialed context, and closed practice remain
   rejected even for an allowlisted photographer.
6. Preserve the BY/BY-SA/CC0 partition. Public Domain Mark, government
   public-domain statements, unavailable upstreams, unsupported license
   migration, or an unresolved author/upload chain are not repaired by an
   allowlist match.
7. Freeze each target slot to exactly one outcome: a fully eligible photo or
   keep the exact current Decision 13 SVG. Do not download/adopt a candidate in
   this phase, do not invent a replacement, and do not impose a minimum photo
   count.

### Phase 2 acceptance and evidence

- All 16 target athletes have one frozen outcome and no unresolved current
  selection. The five non-target selection subtrees and local assets still
  match the v5 baseline exactly.
- Every accepted event candidate binds a named allowlist entry, verified
  self-published original, complete per-file facts, factual occasion, exact
  residual-risk token, and Decision 14 owner reference. Every rejection or
  retained SVG has a reproducible reason.
- `docs/reviews/2026-08-13-decision-14-p2-photo-candidate-evidence.md`
  records queries, candidate/rejection ledger, fixed revisions, exact-license
  partitions, 16-slot outcome table, allowlist joins, five-cover negative
  guard, and the explicit non-clearance statement.
- Commit only the frozen candidate/governance evidence and require a clean
  worktree before asset adoption.

## Phase 3 — Adopt photos, advance the registry, and regenerate covers

1. Download only the frozen accepted Commons originals, verify source and
   local byte length/dimensions/hash, and store them locally through the
   governed asset pipeline. No runtime remote image request is permitted.
2. Generate `player-photo-registry.v6.json` as the append-only successor at
   this frozen baseline, binding exact registry v5 bytes and the final v7
   policy digests. Preserve all historical registry files. For each
   replacement, point lineage to the exact current SVG path/hash and state the
   allowlisted-photo supersession reason; retained SVG records preserve their
   exact current selection facts.
3. Keep all five current Commons selection records and asset bytes identical.
   The successor must continue to map all 26 cases exactly once through 21
   athletes while changing only eligible records from the fixed 16-player set.
4. Promote the current resolver, photo contract, policy presentation, and
   credit generator to the successor. New credit rows use the existing central
   credits/notices route, adjacent asset links, and license-specific templates;
   they retain title state, photographer, exact license/revision/source,
   alterations, notices, and Adapter's License without reintroducing duplicate
   site-wide statements.
5. Replace Decision 13's global claim that every current photo is non-event
   with accurate conditional wording while preserving its single-disclaimer
   architecture and all five existing factual captions. Each new event photo
   displays its truthful occasion sentence and never implies injury-event
   footage, endorsement, or clearance.
6. Rerun source-risk classification. Every allowlisted event selection must
   expose its factual occasion separately from
   `credentialed-access-residual-risk` and the owner reference. Every retained
   SVG remains `original-svg-fallback`; no SVG receives an invented CC license.
7. Repeat the complete composition audit and fail-closed guard. A CC BY-SA
   photo cannot enter any site-composed OG, social, case-card, infographic, or
   other baked design image. Ordinary HTML/CSS placement and ordinary
   responsive renditions remain distinct and still require full attribution.
8. Add unit, contract, renderer, DOM, accessibility, and E2E cases for v7,
   allowlist joins, target/five-cover guards, event captions, credits,
   internal residual-risk retention/non-clearance wording, BY-SA isolation,
   local assets, and retained SVGs. Do not add a repeated public owner-risk
   statement unless a separate necessity review requires it. Freeze and
   compare all 30 clinical files before and after.

### Phase 3 acceptance and evidence

- The final real-photo count may be any evidence-supported value from five to
  21. Every newly adopted photo passed both the allowlist/event gate when
  applicable and the complete per-file gate; every other target retains its
  exact SVG. Nothing was forced to meet a count.
- Registry lineage, 21-athlete/26-case coverage, five-cover immutability,
  local-byte verification, factual captions, risk separation, exact credits,
  SVG originality, and BY-SA non-composition checks all pass.
- Decision 13's unified medical notice and credits architecture remain intact,
  all approved clinical bytes are identical, and no public-release or
  medical-review state is created.
- `docs/reviews/2026-08-13-decision-14-p3-cover-adoption-evidence.md`
  records before/after selections and hashes, adopted/rejected counts, registry
  lineage, policy bindings, risk results, credit rows, cover outputs,
  composite audit, clinical equality, and five-cover negative proof.
- Commit the bounded source/policy/registry/UI/test/evidence change
  conventionally and require a clean worktree before the artifact cycle.

## Phase 4 — Integrated validation, artifact chain, and private smoke

Run all applicable gates under mise Node 24.14.0 from the clean Phase 3 source
commit:

```bash
test "$(mise exec node@24.14.0 -- node --version)" = "v24.14.0"
mise exec node@24.14.0 -- npm run plan:verify
mise exec node@24.14.0 -- npm run plan:assert-authorized -- "$ATLAS_D14_PLAN"
mise exec node@24.14.0 -- npm run format:check
mise exec node@24.14.0 -- npm exec -- tsc --noEmit
mise exec node@24.14.0 -- npm run check
mise exec node@24.14.0 -- npm run content:check
mise exec node@24.14.0 -- npm run research:check
mise exec node@24.14.0 -- npm run research:check-manifest
mise exec node@24.14.0 -- npm run research:registry:check
mise exec node@24.14.0 -- npm run player-photos:verify
mise exec node@24.14.0 -- npm run brand:verify
mise exec node@24.14.0 -- npm run test:coverage
mise exec node@24.14.0 -- npm run test:e2e
mise exec node@24.14.0 -- npm run test:lighthouse
git diff --check
```

Add and run the exact v7 policy and registry successor generation/check commands
introduced by the authorized implementation. The minimum result is 929/929
unit tests and 216/216 Playwright checks; added tests raise the reported `N/N`
totals and may not be removed or coalesced merely to preserve the baseline.

After all source checks pass, execute the artifact chain in this exact order:

1. Run `npm run review-set:generate`, prove only the expected renderer/supporting
   bindings change and clinical bytes remain frozen, then commit only
   `review/review-set.v1.json`.
2. From that clean review-set commit, run `npm run build:review` and
   `npm run verify:review-artifact`; verify all routes remain noindex and the
   new/retained covers and credit anchors match the committed registry.
3. Run `npm run private:manifest`, verify exact file coverage and review-set,
   renderer, policy, and asset bindings, then commit only
   `review/private-dist-manifest.v1.json`.
4. Record the unchanged service configuration/listener/credential identity,
   then run exactly `npm run private:service -- restart`. Do not render, load,
   unload, reprovision credentials, change configuration, or start an alternate
   listener. A failure remains fail-closed.
5. Run read-only authenticated smoke against representative retained-photo,
   new-event-photo, retained-SVG, credits, source-policy, and review-set routes;
   run unauthenticated smoke proving those paths remain denied. Match served
   bytes to the private manifest and do not regenerate the historical served
   receipt.
6. Re-run plan/policy/registry/clinical/five-cover/noindex negative guards and
   finish with a clean docs-only evidence commit. Nothing is pushed.

### Phase 4 acceptance and evidence

- Unit, E2E, Lighthouse, TypeScript, Astro, formatting, content, research,
  policy, registry, photo, brand, clinical-freeze, review-artifact, noindex,
  plan-binding, and authenticated/unauthenticated private checks pass under
  Node 24.14.0.
- The exact sequence `review-set:generate → review-set commit →
  build:review/verify → private:manifest → private-manifest commit →
  existing-service restart → authenticated/unauthenticated smoke` is
  evidenced with commits and digests.
- The existing service identity and access boundary are unchanged; only the
  reviewed artifact bytes advance. The historical served receipt remains
  byte-identical.
- `docs/reviews/2026-08-13-decision-14-p4-final-validation.md` records test
  totals, command results, final allowlist and cover counts, policy/registry/
  artifact digests, five-cover and clinical equality, service pre/post
  identity, smoke evidence, residual-risk assertions, and all closed-scope
  negatives.

## Completion conditions

- Exactly the 16 Decision 13 SVG slots were reassessed. Each either uses a
  fully qualified real photo or retains its exact SVG; the five existing
  Commons covers and their registry/asset facts are unchanged.
- Every named allowlist entry has complete written and machine-verifiable
  identity, self-publication, long-term license/reuse, and anti-washing
  evidence. Non-allowlisted event photos remain rejected.
- Every accepted photo independently satisfies exact athlete identity, original
  source, fixed Commons revision, title state, photographer/uploader chain,
  exact license/version/bucket/link, notice, alteration, Adapter's License,
  crop, local-byte, occasion, and risk requirements.
- Every allowlisted event photo records its factual occasion separately from
  `credentialed-access-residual-risk`, cites Decision 14, and contains no
  zero-risk, rights-cleared, or public-release claim.
- `nba-v7` and the registry successor bind exact predecessors; all historical
  policy, registry, bound-document, clinical, and five-cover bytes remain
  unchanged. The 21-athlete/26-case projection is complete.
- CC BY-SA material is absent from every site-composed output, new credit rows
  use the Decision 13 central architecture, and the unified medical notice,
  accessibility, no-JavaScript, noindex, and private-authentication behaviors
  do not regress.
- The complete validation and ordered artifact chain pass under mise Node
  24.14.0. No push, deployment, indexing, public release, external-account,
  hosting-configuration, medical-content, medical-review, or remote mutation
  occurs.

## Risks and controls

- **Credentialed-access licensing limits:** the owner knowingly accepts that
  credential or venue terms may constrain a photographer's commercial
  licensing authority even after identity and CC-history verification. Keep
  the exact residual-risk token and Decision 14 citation; never convert the
  acceptance into clearance.
- **Flickr/Commons washing or false identity:** require stable account IDs,
  photographer-owned original publication, cross-year identity evidence, and
  series-level EXIF/resolution/place/time/account checks. Reject third-party-only
  chains and unresolved findings.
- **Absence-of-dispute overclaim:** document the exact search scope and date.
  “No dispute found” is bounded negative evidence, not proof that no dispute or
  credential restriction exists.
- **Allowlist scope creep:** an allowlist entry is person/account-specific, not
  a platform, organization, blanket collection, or transferable clearance.
  Every work still passes the full photo gate and must depict one of the fixed
  16 athletes.
- **Occasion laundering:** preserve the actual event category independently;
  never relabel game action or credentialed warm-up as non-event to satisfy a
  legacy invariant.
- **Policy or lineage corruption:** bind exact predecessor hashes, reject
  same-version drift, and stop on any historical byte change. A changed
  allowlist requires a new policy successor, not an edit to v7.
- **Five-cover or clinical drift:** compare complete registry subtrees, local
  bytes, and all 30 clinical files before/after. Any unexplained delta blocks
  promotion and artifact generation.
- **ShareAlike scope expansion:** retain linked compatible Adapter's Licenses,
  prohibit BY-SA from baked designs, and mechanically distinguish ordinary
  placement/rendition from composition.
- **Notice regression:** adapt factual global photo wording without duplicating
  or removing the Decision 13 unified medical disclaimer, adjacent credit
  relationship, central row details, endorsement warning, or non-clearance
  boundary.
- **Artifact/service mismatch:** use clean commits and the mandated sequence,
  restart only after the manifest commit, verify exact served bytes, and fail
  closed rather than launch or expose another service.

## Rollback

- Roll back with forward corrective commits or `git revert`; never use a
  destructive reset, rewrite immutable history, or push. Preserve evidence and
  regenerate dependent artifacts from a clean rollback commit.
- If a new photo or photographer becomes disputed, immediately move every
  affected current selection forward to its exact Decision 13 SVG fallback.
  Do not substitute another unreviewed photo and do not alter any of the five
  frozen Commons selections.
- If an allowlist entry must be removed, create the next immutable policy
  successor and a registry successor referencing the rollback evidence. Never
  edit v7 or the frozen allowlist report in place.
- A credit/caption regression rolls forward to the last complete Decision 13
  notice architecture while retaining all required license, occasion, owner
  residual-risk, and non-clearance facts. Do not solve layout problems by
  deleting required content or changing clinical prose.
- After any rollback source commit, repeat `review-set:generate → commit →
  build:review/verify → private:manifest → manifest commit → exact existing
  service restart → authenticated/unauthenticated smoke`. If restart cannot
  complete safely, leave the service unavailable and fail-closed.
- Public release, indexing, deployment, push/remote, account, DNS, credential,
  listener, and hosting-configuration scopes remain closed throughout
  rollback.

## Current planning-cycle bind and stop

The present task performs only plan/owner-record registration:

```bash
ATLAS_D14_PLAN="docs/superpowers/plans/2026-08-13-decision-14-lowrisk-photographer-covers.md"

test "$(mise exec node@24.14.0 -- node --version)" = "v24.14.0"
test -z "$(git status --porcelain --untracked-files=no)"
test "$(git status --porcelain --untracked-files=all)" = "?? $ATLAS_D14_PLAN"
mise exec node@24.14.0 -- npm run plan:bind -- "$ATLAS_D14_PLAN" --status not-authorized --role decision-14-lowrisk-photographer-covers --scope decision-14-lowrisk-photographer-covers-only --closed-scopes deployment,external-account-mutation,hosting-service-mutation,indexing,medical-content-authoring,medical-review-decision,public-release,remote-repository-mutation
mise exec node@24.14.0 -- npm run plan:verify
```

Require a separate negative `plan:assert-authorized` result, stage exactly this
plan plus `docs/decisions/plan-binding.v1.json`, commit with
`docs(governance): register Decision 14 low-risk photographer covers plan`,
print this plan's SHA-256 and the Phase 0-4 summary to stdout, and stop. The
owner supplies the later strict authorization JSON; this cycle must not create
it or execute any phase above.
