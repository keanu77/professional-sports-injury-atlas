# Decision 15 Photo-First Covers Plan

> Status: NOT AUTHORIZED. Owner Decision 15, communicated by 吳易澄醫師 on
> 2026-08-13 after Decision 14 closeout, authorizes only this policy-drafting
> and plan-registration cycle. Repository execution still requires a strict
> owner-supplied `PlanExecutionDecisionV1` bound to this plan's exact final
> path and SHA-256. This cycle may add the immutable `nba-v8` Markdown and
> canonical JSON pair, add this plan, add the one-line canonical-JSON
> formatter exclusion needed to preserve the v8 JSON bytes, append this plan's
> `not-authorized` binding, and make one local registration commit. It may not
> create or bind an authorization JSON, execute Task 0 or any phase, change a
> player-photo or source-manifest registry, download or adopt an asset,
> regenerate a cover, change product/test/review-artifact/service bytes, touch
> `dist`, or mutate any closed scope.

**Goal:** Make player photos the preferred cover for all 21 current athlete
slots. Re-adjudicate the 14 Decision 14 SVG outcomes under `nba-v8`, admitting
any exact Commons/Flickr work with an explicit supported CC or public-domain
marker that clears every retained gate. Keep an original SVG only when no such
candidate exists after reusing the frozen Decision 14 evidence first and, only
where necessary, completing a bounded supplemental search.

**Architecture:** Treat `nba-v8` as an immutable full-snapshot successor to
`nba-v7`. Remove occasion, allowlist, identity, self-publication, licensing-
authority, washing-signal, dispute-search, and ambiguous-court rejection gates
from active eligibility, while retaining explicit rights markers, exact CC
versions/links/attribution, a distinct PD/US-government bucket, fixed source
observations, original-binary facts, different-injury-event verification,
personality-rights non-clearance, and the existing CC BY-SA site-composition
firewall. Re-open the frozen Decision 14 P2 ledger before doing new discovery;
then advance the player-photo registry append-only from v6 to v7 and regenerate
only the authorized cover projection. Preserve the 21-athlete/26-case mapping,
the seven current photos, the clinical freeze, and all closed release/service
boundaries.

**Tech stack:** Node.js 24.14.0 selected through the required mise installation,
TypeScript, canonical JSON, SHA-256, Astro 7, Vitest, Playwright/axe, local Git,
Wikimedia Commons fixed revisions, frozen Flickr evidence records, exact
Creative Commons license versions, public-domain/US-government source
statements, and the existing review/private-artifact tooling.

## Scope and authority

- Execution role: `decision-15-photo-first-covers`; execution scope ID: `decision-15-photo-first-covers-only`; required closed scope IDs: `deployment`, `external-account-mutation`, `hosting-service-mutation`, `indexing`, `medical-content-authoring`, `medical-review-decision`, `public-release`, `remote-repository-mutation`.
- Decision 15 fixes the policy outcome but is not execution authority. The
  later strict decision must identify 吳易澄醫師, carry an exact UTC decision
  time, repeat this role/scope/closed-scope set, and bind this plan's exact
  path and final SHA-256. The owner will supply that JSON separately; an agent
  must not draft, infer, or backfill it.
- Decision 11 remains controlling for the release boundary: G6 is paused,
  `allowIndexing=false`, and there is no push, public deployment, indexing,
  hosting-service mutation, external-account mutation, or remote-repository
  mutation. Decision 11 P0-2's CC BY-SA composite-image guard is a retained
  non-waivable control.
- Decision 14 is the product baseline: seven current Commons photos and 14
  original SVG fallbacks cover 21 athletes and 26 cases. The seven current
  photos—CJ McCollum, Dwight Powell, Kevin Durant, Kyrie Irving, LeBron James,
  Damian Lillard, and Jayson Tatum—are protected non-regression inputs, not
  replacement-search targets.
- The reassessment set is exactly the 14 current SVG athletes: Anfernee Simons,
  Anthony Edwards, Brandon Clarke, Danny Green, Dejounte Murray, Ja Morant, Joe
  Ingles, LaMelo Ball, Markelle Fultz, Moritz Wagner, Ricky Rubio, Thomas
  Bryant, Trae Young, and Tyrese Haliburton.
- Only after exact authorization, permitted local mutations are bounded to
  Decision 15 contract/checker/evidence files, candidate evidence for the
  fixed 14-athlete set, original local photo assets for accepted candidates,
  player-photo registry v7, the minimum resolver/credit/policy-presentation
  changes required for those selections, aligned tests, review-set/private-
  manifest artifacts, and conventional local commits.
- Medical content, medical-review decisions, publication, deployment,
  indexing, hosting-service changes, external accounts, and remote repository
  operations remain closed during every phase and rollback. Authorization to
  change covers is not authority to cross any of those boundaries.
- `nba-v8` is created and frozen in this planning cycle because the owner
  expressly requested the policy artifact. Future Phase 0 verifies and
  implements its contract without editing either v8 file. Any policy defect
  requires a separately governed append-only `nba-v9` successor.

## Owner's named residual-risk acceptance

吳易澄醫師在被明確告知後，具名接受以下三項殘餘風險：

1. **持證攝影記者授權自始無效的風險（Flickr-washing）**：持證記者與聯盟或媒體有契約，
   若無權授權，其標示的 CC 授權自始無效，下游使用者不因善意而免責
2. **封閉練習場地規範風險**：封閉練習照片可能違反球隊或場地的拍攝規範
3. **授權人身分無法追溯的風險**：帳號持有者未必是拍攝者，連授權人是誰都無法主張

This is informed acceptance of unresolved residual risk. It is not a finding
that any marker was validly applied, that the account or credited person owned
the work or had licensing authority, or that downstream good faith provides a
defense. It does not create copyright, personality/portrait-rights, venue,
contractual, medical, legal-use, or public-release clearance.

The exact three risks above must appear in `nba-v8`, the machine-readable v8
contract, Phase 1/2 candidate evidence, registry v7's governed policy
reference, and Phase 4 final validation. Evidence and presentation must never
replace them with `low-risk`, `no-risk`, `rights-cleared`,
`licensed-for-public-use`, `public-release-approved`, or an equivalent
affirmative claim.

## Policy delta: removed and retained gates

Decision 15 abolishes these active v7 rejection mechanisms:

- every occasion restriction, including game action, pregame, warm-up,
  All-Star, postseason, preseason, international competition, closed
  practice, `other`, unknown/unresolved occasion, and
  `ambiguous-credentialed-court-context`;
- the named-photographer allowlist and its empty-join behavior;
- photographer/uploader identity, account-control, uploader-to-maker,
  photographer-owned self-publication, and upstream-owned-original proof;
- licensing-authority verification;
- washing-signal/EXIF/series/account-pattern checks and dispute searches; and
- automatic rejection merely because a credentialed-court context is
  ambiguous.

The following gates remain mandatory and fail closed:

1. The exact work page on Commons or Flickr must display an affirmative,
   supported CC or PD/US-government marker. All Rights Reserved, no marker,
   unknown/ambiguous marker, or a marker not tied to the exact work is
   ineligible. Existing unsupported CC NC/ND families are not added by this
   decision.
2. For CC works, record the exact license name, version, terms link, displayed
   credited name, supplied-title state, alteration, and every supplied notice;
   fulfill all applicable attribution conditions. CC0 1.0 remains its own
   exact dedication record.
3. Public Domain Mark, explicit public-domain statements, and explicit United
   States government-work statements belong to a distinct allowed
   `public-domain` bucket. Agency-specific `PD-USGov-*` markers, including
   `PD-USGov-Military-Navy`, are accepted. Do not invent a license version or
   attribution condition for PD; preserve displayed source/credit/notice facts.
4. Freeze a platform-appropriate source observation and original binary facts.
   Commons requires its exact fixed oldid/permalink/timestamp. A direct Flickr
   source requires a canonical evidence record with exact photo/page/rights/
   credit/original-retrieval facts and its own SHA-256; that record is not
   misrepresented as a Flickr-native immutable revision.
5. Verify that the image is different from the governed injury event. Same or
   unresolved injury-event relationships remain ineligible.
6. Retain exact local original byte length, MIME type, dimensions, SHA-256,
   source retrieval identity, crop/focal facts, source-policy digests, case
   mapping, and supersession record.
7. Keep CC BY-SA out of every site-composed OG image, social image, case card,
   infographic, and equivalent baked design. Preserve the same-version
   Adapter's License limited to any crop contribution and the distinction
   between ordinary HTML/CSS placement/rendition and composition.
8. Keep the personality/portrait-rights non-clearance statement. CC addresses
   copyright and PD addresses copyright status; neither supplies personality,
   publicity, privacy, endorsement, venue, league, team, or contract rights.
9. Keep all medical, review, release, deployment, indexing, service, account,
   and remote scopes closed.

Displayed maker/uploader/account/occasion strings may be retained as factual
metadata and for attribution, but must not be upgraded into verified identity,
ownership, account control, authority, or clearance. A removed gate may not be
reintroduced under a new field name or as discretionary reviewer rationale.

## Non-goals

- No authorization JSON, authorization binding, Task 0, Phase 0–4 work, web
  research, candidate re-adjudication, download, registry promotion, cover
  generation, product change, review build, smoke request, or service action in
  this planning/registration cycle.
- No edit to `nba-v1` through `nba-v7`, player-photo registry v1 through v6,
  Decision 14 evidence, any current image/SVG, clinical content, review set,
  private manifest, `dist`, or a bound decision/plan. All successors are
  append-only.
- No replacement search or metadata rewrite for the seven current photo
  selections. They remain protected while the 14 current SVG slots are
  re-adjudicated.
- No assumption that every frozen P2 lead will ultimately pass. Photo-first is
  a priority and coverage goal, not permission to waive an explicit marker,
  exact obligation, fixed evidence, original-binary, athlete, or different-
  injury-event gate.
- No attempt to prove, disprove, or rehabilitate photographer identity,
  self-publication, account control, licensing authority, washing signals, or
  dispute history. Those inquiries are no longer eligibility work.
- No rewriting a game, warm-up, closed-practice, or ambiguous-court photo as a
  non-event image. Occasion is not a gate, so laundering the factual record is
  unnecessary and forbidden.
- No site-composed use of CC BY-SA media, even if a candidate is otherwise
  eligible. No removal of title, credit, exact link, notice, alteration,
  Adapter's License, or non-clearance facts to simplify layout.
- No medical-content edits, medical-review decision, publication, deployment,
  indexing, DNS, Cloudflare, credentials, listener, service restart/reload,
  external account, remote repository, push, or public release.

## Frozen starting state

- Planning-time branch is `main` at clean commit
  `d393dcf90b9fc19339247e810bbaf865557a0625`. An executor records the later
  clean authorized starting commit and stops on unexplained relevant drift.
- Immutable `nba-v7` Markdown SHA-256 is
  `61ed88f92d80b77cd2c1410d03305215eedbb391356c073fb19fac944dea2fd1`;
  immutable v7 canonical-JSON SHA-256 is
  `d1062c1ffa045397d13489319534acbfe24653615df5ce83aac40e40539a8b15`.
- Planning-cycle `nba-v8` Markdown SHA-256 is
  `20a9209bd523604efe3251f6ef159e6432fa9280951ea16d630ee02cc347557d`;
  v8 canonical-JSON SHA-256 is
  `30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e`.
  The JSON binds both exact v7 predecessor digests and the exact v8 Markdown
  digest. Neither v8 file may change after this plan is bound.
- Current player-photo registry v6 SHA-256 is
  `16851aaa3d1dd223f20f102ef543f104a23ee61335a796f4b70cbe75d76d5cf0`.
  It projects seven Commons photos and 14 original SVGs across 21 athletes and
  26 cases. Registry v7 must bind the exact v6 bytes and exact v8 policy pair.
- Decision 14 P2 candidate evidence is frozen at
  `docs/reviews/2026-08-13-decision-14-p2-photo-candidate-evidence.md`, SHA-256
  `b5a1f207323125170c96a03f63f8643694d70fad4f01e42dd33d1ec1f73fd00b`.
  It is the mandatory first Phase 1 input, not a suggestion or disposable lead
  list.
- Decision 14 final validation SHA-256 is
  `201b65a1ef37684def56e0d98cd184fa489c4a363e26e4d41cefcd8063ab5f19`.
  Its minimum validation baseline is 1031/1031 unit tests, 224/224 Playwright
  checks, and 42 private-review pages.
- The 30-file clinical freeze aggregate is
  `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.
  All 26 cases, three injury overviews, the quarterly update, and their
  medical-review decisions remain immutable inputs.
- `allowIndexing=false`. Existing private-service identity, authentication,
  listener, configuration, credentials, and historical served-review receipt
  are frozen operational inputs and are not restart/reload authority.
- Every Node/npm command must first prepend
  `/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin` to `PATH` and
  prove `node --version` is exactly `v24.14.0`; Codex runtime Node 24.19.0 is
  not allowed.

## Task 0 — Require exact authorization before execution

From a clean worktree, require the owner-supplied strict decision and exact
binding before any phase below:

```bash
export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_D15_PLAN="docs/superpowers/plans/2026-08-13-decision-15-photo-first-covers.md"
ATLAS_D15_DECISION="docs/decisions/2026-08-13-decision-15-photo-first-covers-authorization.v1.json"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain)"
npm run plan:decision:verify -- --decision "$ATLAS_D15_DECISION" --plan "$ATLAS_D15_PLAN"
npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_D15_PLAN"
```

Any runtime mismatch, dirty tree, missing or stale decision, owner/role/scope/
closed-scope mismatch, plan digest mismatch, failed binding, or failed
authorization assertion stops execution. A later commit, conversation, owner
record, or policy file is not a substitute for the strict artifact. Task 0
does not run during the current planning cycle.

## Phase 0 — Freeze baselines and implement the v8 contract

1. Record the authorized starting commit and remeasure policy v1–v8, registry
   v1–v6, the complete 21 current selection subtrees, all current local asset
   bytes, the 30 clinical files, review set, private manifest, noindex state,
   current credit rows, and frozen service identity. Stop on unexplained drift.
2. Verify that v7 matches the two predecessor digests above; that v8 is strict,
   canonical JSON; that it binds the exact v7 pair and v8 Markdown; and that
   all root clinical/video/privacy fields are unchanged. Treat the committed
   v8 pair as immutable input. A needed textual/schema correction requires v9.
3. Implement a Decision 15 contract and source-policy generator/checker that
   re-derive the exact committed v8 JSON. Assert the removed-v7-gate set and
   reject any active empty-allowlist join, occasion allow/deny list,
   photographer-identity/self-publication/authority requirement, washing
   check, dispute search, or ambiguous-court automatic rejection.
4. Encode the retained rights-marker table. Accept only the existing supported
   exact CC tokens plus the distinct Public Domain Mark/platform PD/US-
   government status bucket. Require exact work-page markers and reject All
   Rights Reserved, missing, unknown, inconsistent, NC/ND, or wrong-work
   markers. Add a positive `PD-USGov-Military-Navy` fixture so the Decision 14
   Dejounte technical defect cannot recur.
5. Encode platform-specific fixed evidence. Commons requires exact oldid,
   permalink, timestamp, description URL, and original URL. Flickr requires a
   canonical frozen observation path/digest with photo ID, exact page, observed
   rights/credit/title/notices, checked-at/by facts, and original retrieval
   identity. A Flickr evidence snapshot must not claim to be a native revision.
6. Encode original-binary, title/notice, attribution, alteration, focal/crop,
   exact athlete/case mapping, different-injury-event, personality-rights
   non-clearance, and registry/policy lineage gates. Same or unresolved injury
   relationships and thumbnail/screenshot-only inputs fail closed.
7. Preserve the existing BY-SA mechanical firewall byte-for-behavior. Add
   fixtures for ordinary HTML/CSS placement and responsive rendition, allowed;
   and OG/social/case-card/infographic/equivalent baked composition, rejected.
   Assert same-version Adapter's License and crop-only scope.
8. Freeze seven current-photo and 14 current-SVG baselines separately. Negative
   guards prevent discovery/promotion from selecting outside the 14 targets or
   mutating any field/byte of the seven current photo selections.
9. Record all closed scopes and verify Phase 0 changes no registry, asset,
   cover, clinical file, review artifact, `dist`, or service state. Commit only
   the bounded Phase 0 contract/checker/tests/evidence and require a clean tree
   before Phase 1.

### Phase 0 acceptance and evidence

- `docs/reviews/2026-08-13-decision-15-p0-governance-and-v8-contract.md`
  records exact commits/digests, lineage, 21/26 mapping, seven/14 partition,
  field contracts, positive/negative fixtures, residual-risk text,
  personality-rights boundary, BY-SA firewall, clinical freeze, noindex, and
  closed-scope negatives.
- The v8 generator/check reproduces
  `30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e`;
  both v8 files and every historical policy/registry file are unchanged.
- A conventional local Phase 0 commit exists and the worktree is clean. No
  candidate has been re-adjudicated or adopted.

## Phase 1 — Re-open the frozen Decision 14 P2 candidate ledger

Phase 1 starts from the frozen ledger; it does not repeat broad discovery. The
ledger already records each target's strongest candidate and first fatal v7
reason:

| Athlete | Frozen principal evidence | Displayed rights | v8 re-adjudication focus |
| --- | --- | --- | --- |
| Anfernee Simons | `AnferneeSimons (cropped).jpg`, oldid `827612495` | CC BY-SA 4.0 | Pregame/warm-up no longer rejects; check retained gates. |
| Anthony Edwards | `Anthony Edwards Argentina v Egypt 7 July 2026-069.jpg`, oldid `1253738497` | CC BY-SA 4.0 | `other`/match context and photographer history no longer reject. |
| Brandon Clarke | `Brandon Clarke (51814063744) (cropped).jpg`, oldid `1244619086` | CC BY 2.0 | Live action and empty allowlist no longer reject. |
| Danny Green | `Danny Green dance Senior Day.jpg`, oldid `1088225177` | CC BY 2.0 | Ambiguous court/pregame context no longer rejects. |
| Dejounte Murray | `Dejounte Murray Tours the METC (5148235).jpg`, oldid `1199576196` | `PD-USGov-Military-Navy` | Apply the new PD bucket; do not invent CC0. |
| Ja Morant | `Ja Morant.jpg`, oldid `981268435` | CC BY 2.0 | Occasion and account-to-maker authority no longer reject. |
| Joe Ingles | `Joe Ingles Utah (cropped).jpg`, oldid `877365146` | CC BY-SA 4.0 | Live preseason no longer rejects; keep BY-SA firewall. |
| LaMelo Ball | `LaMelo Ball (cropped).jpg`, oldid `1130229739` | CC BY 2.0 | All-Star action and empty allowlist no longer reject. |
| Markelle Fultz | `Markelle Fultz (50639078246).jpg`, oldid `1130452222` | CC BY-SA 2.0 | Game context/upstream 404 no longer prove authority; fixed source and binary facts still must pass. |
| Moritz Wagner | Sandro Halank candidate oldid `967382118` | CC BY-SA 4.0 | Match/pregame context and allowlist no longer reject. |
| Ricky Rubio | `Ricky Rubio at Lynx game.jpg`, oldid `1179110385` | CC BY 2.0 | Ambiguous/missing occasion no longer rejects. |
| Thomas Bryant | `20150329 MCDAAG closed practice Thomas Bryant (1).JPG`, oldid `957946914` | CC BY-SA 4.0 | Closed practice no longer rejects; retain named venue risk. |
| Trae Young | `Trae Young (2022 All-Star Weekend) (cropped).jpg`, oldid `1148485505` | CC BY 2.0 | Ambiguous All-Star court context no longer rejects. |
| Tyrese Haliburton | `1 tyrese haliburton 2025 (cropped 2).jpg`, oldid `1202611768` | CC BY-SA 4.0 | Regular-season action and empty allowlist no longer reject. |

1. Copy no conclusion mechanically. For each row, reopen the frozen fixed
   evidence and apply only the v8 retained gates: exact athlete/case mapping,
   exact displayed rights marker, all applicable exact rights/attribution/
   notice facts, fixed source observation, original-binary facts, and
   different-from-governed-injury-event evidence.
2. Treat each first fatal v7 reason explicitly. Mark it `removed-by-v8` only if
   it is one of the enumerated occasion/allowlist/identity/self-publication/
   authority/washing/dispute/ambiguous-court gates. Do not recreate it as a
   discretionary risk score. Preserve truthful source/occasion strings without
   making them eligibility conditions.
3. For Dejounte Murray, record the exact `PD-USGov-Military-Navy` statement,
   source/link, fixed revision, original binary facts, credit/notices, athlete,
   and injury relationship. Record `rightsBucket=public-domain`; do not call it
   CC0 or invent a license version.
4. For Markelle Fultz and any imported Flickr chain whose upstream page is now
   unavailable, do not use the 404 as authority rejection. The work still
   fails if frozen Commons facts cannot establish the exact displayed marker,
   fixed source revision, or original binary identity required by v8.
5. Freeze an independent result for all 14 slots: `qualified-from-frozen-
   evidence` or `needs-supplemental-search`, with every retained field either
   complete or a precise remaining fatal gate. Phase 1 performs no broad new
   query, repository download, adoption, registry update, or cover generation.
6. Partition accepted CC BY, CC BY-SA, CC0, and PD candidates. Predeclare every
   BY-SA work as placement/rendition-only and mechanically barred from baked
   design inputs.
7. Preserve the seven current photo subtrees/assets and the 30 clinical files
   byte-for-byte. Commit only Phase 1 evidence and require a clean tree before
   Phase 2.

### Phase 1 acceptance and evidence

- `docs/reviews/2026-08-13-decision-15-p1-frozen-candidate-readjudication.md`
  binds the P2 ledger digest, contains exactly 14 adjudication rows, identifies
  every removed v7 gate and every retained-gate result, repeats the three named
  residual risks, and freezes the Phase 2 queue.
- No athlete enters the Phase 2 queue merely because the reviewer dislikes an
  occasion or cannot prove identity/authority. Only absence/failure of a
  retained v8 fact is a valid reason.
- No registry, asset, cover, product, review artifact, `dist`, service, clinical
  file, or closed scope changes. A conventional local evidence commit exists
  and the worktree is clean.

## Phase 2 — Supplemental search only for athletes with no v8 candidate

1. Derive the exact search roster from Phase 1's frozen
   `needs-supplemental-search` rows. If the roster is empty, freeze a zero-row
   Phase 2 result and do not browse. Never search a qualified athlete for a
   preferred replacement or broader aesthetic choice.
2. Predeclare a finite Commons/Flickr query matrix for only that roster and
   capture the complete returned lead population before adjudication. Search
   for athlete identity and explicit supported CC/PD markers; do not spend
   time proving removed photographer/occasion/authority gates.
3. Open the exact work page for every plausible lead. A snippet, filename,
   category, API label, copied description, or third-party page is not the
   marker gate. Record All Rights Reserved, missing/unknown/inconsistent,
   unsupported NC/ND, and wrong-work markers as exact fatal results.
4. For Commons, freeze exact oldid/permalink/timestamp and original-file facts.
   For direct Flickr, freeze the required canonical observation record and
   digest without claiming a platform-native immutable revision. Capture no
   screenshot/thumbnail as the original work.
5. Verify athlete/case identity and a relationship different from the governed
   injury event. A same/unresolved relationship stays SVG even though occasion
   itself is unrestricted.
6. Freeze one selected qualified candidate per searched athlete, or a complete
   no-qualifying-candidate outcome. Separate BY-SA works for the composition
   firewall. Do not download into the repository, promote a registry, or
   regenerate covers in this phase.
7. Commit only bounded Phase 2 query/candidate evidence and require a clean
   tree before adoption.

### Phase 2 acceptance and evidence

- `docs/reviews/2026-08-13-decision-15-p2-supplemental-photo-search.md` binds the
  Phase 1 queue, exact query set, complete lead population, per-work retained-
  gate results, chosen candidate or SVG outcome, rights bucket partition, and
  the exact three owner-accepted risks.
- Every searched athlete had no qualifying Phase 1 candidate; every unsearched
  athlete already had one. No identity/authority/occasion gate reappears.
- No registry, asset, cover, product, review artifact, `dist`, service, clinical
  file, or closed-scope mutation occurs. A conventional local evidence commit
  exists and the worktree is clean.

## Phase 3 — Adopt candidates, promote registry v7, and regenerate covers

1. Accept exactly the frozen Phase 1/2 selections. Download each exact original
   binary to a Decision 15 asset path; reject redirects to thumbnails,
   mismatched asset IDs, MIME/dimension drift, or bytes inconsistent with the
   frozen retrieval identity. Record local byte length, dimensions, and SHA-256.
2. Recheck 5:2 and 16:9 focal safety against local originals. Preserve source
   alteration facts and disclose CSS presentation crops. Do not create a
   stored derivative unless separately supported by the exact license and v8
   contract.
3. Generate player-photo registry v7 as a full append-only successor binding
   exact registry v6 and the exact v8 pair. Preserve all 21 athlete/26 case
   mappings, seven protected photo subtrees/assets, and any remaining SVG
   subtree/bytes. Never rewrite registry v1–v6.
4. Each photo selection records source platform/page, fixed evidence, original
   binary identity, exact rights bucket/marker/link, displayed credit/title/
   notices, alteration, local bytes, crop/focal facts, different-injury-event
   evidence, policy hashes, and supersession. PD fields must not contain an
   invented CC license; displayed identity/authority facts remain non-verified.
5. Update the central credits/notices presentation using Decision 13's compact
   architecture. The adjacent image-credit link, exact versioned CC terms or
   exact PD status/source, title/notice/alteration facts, factual different-
   injury-event caption, and personality-rights non-clearance remain available
   without duplicating or changing clinical warnings.
6. Regenerate the 21-cover projection. Prefer a photo for every slot with a
   frozen qualified candidate; retain an exact SVG only for the frozen
   no-candidate outcome. Do not substitute an unreviewed asset to reach a count.
7. Run the existing and new registry/photo/brand guards. Prove CC BY-SA media
   is absent from OG/social/case-card/infographic/equivalent baked designs and
   that ordinary cover placement/rendition carries its same-version crop-only
   Adapter's License.
8. Verify seven protected photos, clinical files, noindex, review/service inputs,
   and all historical policy/registry/evidence bytes are unchanged. Commit the
   bounded source adoption and require a clean tree before artifact generation.

### Phase 3 acceptance and evidence

- `docs/reviews/2026-08-13-decision-15-p3-photo-adoption-and-registry-v7.md`
  records every final selection, source/local digest, license or PD treatment,
  attribution/notice/crop facts, injury relationship, final photo/SVG count,
  registry lineage, protected-cover equality, and BY-SA negative proof.
- Registry v7 re-generates byte-for-byte, binds exact v6/v8 digests, and covers
  exactly 21 athletes and 26 cases. Every SVG is supported by a frozen
  no-qualifying-candidate result.
- Unit subsets and policy/registry/photo/brand checks pass under Node 24.14.0.
  A conventional local Phase 3 commit exists and the worktree is clean.

## Phase 4 — Integrated validation, artifact chain, and private-site smoke

1. From the clean Phase 3 source commit, run the complete unit/coverage,
   Playwright/axe, TypeScript, Astro, formatting, content, source-policy,
   candidate, registry, player-photo, brand/BY-SA, clinical-freeze, noindex,
   plan-binding, and Git whitespace suites. Preserve or explain stricter totals
   above the Decision 14 baseline.
2. Generate the review set from the clean source commit, prove only the expected
   review-set file changed, and commit it separately. Build and verify the
   private review artifact locally; artifact creation is not publication or
   deployment and may not alter public/indexing state.
3. Generate and verify the private manifest from the exact artifact and clean
   review-set commit, prove only the expected manifest changed, and commit it
   separately. Re-run policy, registry, clinical, protected-cover, BY-SA,
   noindex, and closed-scope guards after the artifact chain.
4. Perform only read-only authenticated and unauthenticated requests against
   the already-running private service if it already exposes the exact new
   artifact without a process or configuration mutation. Verify auth boundary,
   route count, content commit/manifest, local image loading, credits/notices,
   no remote thumbnails, no sitemap/analytics/indexability, and representative
   photo/SVG routes.
5. Do not restart, reload, load/unload, reconfigure, reprovision, or replace the
   service; do not change credentials, listener, port, Tailscale identity,
   launchd state, exposure, or historical receipt. If exact-new-artifact smoke
   cannot be performed without such a hosting-service mutation, stop and record
   the blocked smoke instead of crossing the closed scope. Separate owner
   authority would be required.
6. Run Lighthouse on the required representative routes when it can be done
   locally without service mutation. Finish with docs-only final evidence, a
   clean worktree, and no push.

### Phase 4 acceptance and evidence

- `docs/reviews/2026-08-13-decision-15-p4-final-validation.md` records test
  totals, exact commands/results, final cover partition, policy/registry/
  artifact digests, seven-cover and clinical equality, license/PD counts,
  BY-SA firewall, residual-risk assertions, noindex, and all closed-scope
  negatives.
- The ordered review-set/build/verify/private-manifest chain is reproducible
  and bound to clean commits. There is no public artifact, deployment, push,
  indexing, account mutation, or medical change.
- Private smoke either proves the exact new artifact through read-only requests
  with zero service mutation or is explicitly blocked pending separate
  authority. A blocked restart/reload preserves the closed scope, but exact-
  new-artifact private smoke remains incomplete and the final report must not
  claim that it passed; separate authority is required.

## Completion conditions

- The frozen Decision 14 ledger was adjudicated before any supplemental search,
  and only athletes with no retained-gate-qualified frozen candidate were
  searched anew.
- All 21 slots prefer photos; each of the 14 target slots either uses a fully
  qualified explicit CC/PD photo or retains its exact SVG because no such
  candidate was found. The seven current photos remain byte/fact identical.
- No candidate was rejected for occasion, allowlist membership, identity,
  account control, self-publication, licensing-authority uncertainty, washing
  signals, dispute-search outcome, or ambiguous court context.
- Every photo has an exact work-page rights marker, applicable exact CC
  version/link/attribution or exact PD/US-government facts, fixed source
  evidence, original binary facts, athlete/case identity, different-injury-
  event proof, title/notices/alteration, local bytes, and crop/focal record.
- The exact three owner-accepted residual risks remain named and are never
  converted into clearance. Personality/portrait rights remain explicitly
  outside CC/PD.
- CC BY-SA never enters a baked site composition. Adapter's License and
  ordinary placement/rendition rules pass mechanically for every BY-SA work.
- Registry v7 binds exact v6 and exact v8 policy bytes; every historical policy,
  registry, evidence, protected photo, clinical, and bound-governance byte is
  unchanged.
- The full validation/artifact chain passes under Node 24.14.0. No medical-
  content/review decision, publication, deployment, indexing, hosting-service,
  account, remote-repository, or push mutation occurs.

## Risks and controls

- **持證攝影記者授權自始無效的風險（Flickr-washing）:** Preserve the owner's
  exact acceptance. The displayed CC marker may have been ineffective from the
  start, and good faith does not immunize downstream use. Never describe v8 as
  validating authority.
- **封閉練習場地規範風險:** Occasion cannot reject the photo, but evidence and
  final validation retain the named venue-rule risk and make no venue/contract
  clearance claim.
- **授權人身分無法追溯的風險:** Record only the maker/uploader/account strings
  displayed by the source. Do not infer the account holder is the photographer
  or that a licensor can be identified.
- **Missing marker mistaken for invalid authority:** These are different. A
  missing/unknown/All Rights Reserved marker fails because no permission can be
  invoked; an explicit supported marker passes that gate even when authority
  may be invalid under the accepted residual risk.
- **PD modeled as CC:** Keep `public-domain` separate from CC0 and require the
  exact statement/source. Positive-test `PD-USGov-Military-Navy`; reject an
  invented CC version or attribution condition.
- **Flickr traceability gap:** Bind an immutable repository evidence record to
  the live page observation and original retrieval identity. Do not call it a
  source-native revision or allow a thumbnail/screenshot to stand for the
  original binary.
- **Same injury-event image:** Occasion freedom does not waive the distinct
  injury-event gate. Same/unresolved relationships retain the exact SVG.
- **ShareAlike expansion:** More BY-SA photos increase the importance of the
  existing firewall. Keep composition negatives mechanical and fail closed on
  every new baked-output path.
- **Policy/registry drift:** Re-derive canonical bytes and bind exact predecessor
  hashes. A correction uses v9/registry v8, never an in-place edit.
- **Artifact/service boundary:** Local artifact generation is not authority to
  publish or mutate hosting. Read-only smoke only; stop if a restart/reload is
  necessary.

## Rollback

- Roll forward with corrective commits or use `git revert`; never destructively
  reset, rewrite immutable files/history, or push. Preserve the evidence chain.
- If a selected marker disappears, a work becomes disputed, the original bytes
  cannot be reproduced, or the injury relationship changes, move that athlete
  forward to the exact prior SVG in a new registry successor. Do not substitute
  an unreviewed photo.
- A policy correction requires `nba-v9`; a registry correction requires a new
  append-only registry version. Never edit v8, registry v7, or frozen Phase 1/2
  evidence in place.
- A credit/caption regression rolls forward to the complete Decision 13/15
  notice architecture without dropping exact license/PD, alteration, residual-
  risk, injury-event, or personality-rights facts.
- Regenerate dependent local artifacts from a clean corrective commit. Service
  restart/reload, publication, deployment, indexing, remote/account mutation,
  and medical changes remain closed during rollback and require separate
  authority where applicable.

## Current planning-cycle bind and stop

The present task performs only v8 policy drafting and not-authorized plan
registration:

```bash
export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_D15_PLAN="docs/superpowers/plans/2026-08-13-decision-15-photo-first-covers.md"

test "$(node --version)" = "v24.14.0"
git diff --check
npm run plan:bind -- "$ATLAS_D15_PLAN" \
  --status not-authorized \
  --role decision-15-photo-first-covers \
  --scope decision-15-photo-first-covers-only \
  --closed-scopes deployment,external-account-mutation,hosting-service-mutation,indexing,medical-content-authoring,medical-review-decision,public-release,remote-repository-mutation
npm run plan:verify
```

Require the separate negative `plan:assert-authorized` result, stage only
`.prettierignore`, the v8 Markdown/JSON pair, this plan, and
`docs/decisions/plan-binding.v1.json`, commit them once with
`docs(governance): register Decision 15 photo-first covers plan`, print the
plan/policy SHA-256 values and commit hash, and stop. The owner supplies the
later strict authorization JSON. This cycle must remain `not-authorized` and
must not execute Task 0 or Phase 0–4.
