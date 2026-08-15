# Decision 18 Professional Notes and Exhaustive Follow-ups Plan

> Status: NOT AUTHORIZED. The owner's 2026-08-15 instruction authorizes only
> this plan-drafting and `not-authorized` registration cycle. Repository
> execution requires a later owner-supplied strict `PlanExecutionDecisionV1`
> bound to this plan's exact final path and SHA-256. This cycle may add this
> plan, append its `not-authorized` plan-binding entry, and make one local
> registration commit. It may not create or bind an authorization JSON,
> execute Task 0 or any phase, remove either rendered note layer, research a
> follow-up, change a policy/schema/test/page/component/script/content record,
> generate a review artifact, touch `dist`, or mutate a closed scope.

**Goal:** Remove the general-reader case-note layer and all now-meaningless
layer-switch machinery so each case presents one complete professional-note
view; then replace Decision 17's one-query-per-category follow-up audit with
an auditable exhaustive search across every one of the 26 cases and all four
fact categories. A category is complete only after two consecutive valid
rounds produce no new qualifying fact. Preserve the existing approved
clinical-core lineage, keep every existing and new follow-up item pending
owner signoff, retain all `nba-v10` evidence and presentation controls, and
keep the site private and non-indexable.

**Architecture:** Treat the note change as presentation-only: keep the 26
case records and their approved professional text byte-identical, replace the
dual-layer component with one professional-notes component, and delete the
toggle script and every `data-layer-*` hook. Treat exhaustive follow-up work
as a new versioned research-audit contract rather than a relaxation of the
source policy. Preserve the Decision 17 v1 research ledgers as historical
evidence, write Decision 18 `case-follow-up-research.v2` ledgers with
round-by-round query/result provenance, and continue to bind atomic content
items to the exact immutable `nba-v10` source policy. Execute the research in
three ordered injury-specific batches, each with its own machine-verifiable
receipt, bounded paths, and local commit. Only after all three batch receipts
pass may the active pending review set advance append-only to v3 and local
integration validation run.

**Tech stack:** Node.js 24.14.0 selected from the required mise installation,
TypeScript, Astro 7, strict Zod contracts, canonical JSON, SHA-256, Vitest,
Playwright/axe, Parse5 DOM checks, temporary-directory review builds, and
local Git. Web research during a later authorized execution must open original
pages; search-result snippets are discovery leads only.

## Scope and authority

- Execution role: `decision-18-professional-notes-and-exhaustive-followups`; execution scope ID: `decision-18-professional-notes-and-exhaustive-followups-only`; required closed scope IDs: `deployment`, `external-account-mutation`, `hosting-service-mutation`, `indexing`, `medical-review-decision`, `public-release`, `remote-repository-mutation`.
- Decision 18 fixes the intended result but is not execution authority. The
  owner will separately supply the strict authorization JSON. An agent must
  not draft, infer, backfill, or bind that decision.
- `medical-content-authoring` is deliberately absent from the closed-scope
  list, continuing Decision 17's narrow precedent. It permits only the
  evidence-faithful addition or correction of pending third-party follow-up
  items in the four controlled categories after exhaustive audit. It does not
  authorize diagnosis, prognosis, prescriptive advice, general teaching,
  injury-overview, quarterly-update, or approved clinical-core changes.
- `medical-review-decision` remains closed. All 44 existing follow-up items
  and every added or updated item remain exactly `pending-owner-signoff`.
  Codex may not reuse the owner's identity, create a review timestamp or
  approval digest, apply a medical decision, or render any pending item as
  approved.
- Decision A is presentation-only. It may stop rendering
  `general.whatVideoCannotProve`, but it may not delete or rewrite that field,
  any professional note, any case byte, or any existing clinical digest.
- Permitted future repository mutations are limited to the single-note
  presentation and its tests; a strict Decision 18 research-v2 audit contract,
  batch tooling and receipts; the 26 Decision 18 audit ledgers; evidence-
  faithful pending sidecar updates; the minimum append-only review-set-v3
  lineage needed to bind Decision 18 authority and audit digests; local review
  evidence; and conventional local commits.
- Deployment, external-account mutation, hosting-service mutation, indexing,
  public release, remote-repository mutation, push, and medical-review
  decisions remain closed in every phase and rollback. `allowIndexing=false`
  and the current private/noindex controls remain mandatory.
- Because `hosting-service-mutation` is closed, no future Decision 18 phase may
  run `launchctl`, `private:manifest`, `private:verify`, change `dist`, reload
  the private service, change its listener/credential/Tailscale state, or
  alter the existing private-manifest/served-receipt bytes. Review builds must
  target a fresh temporary directory outside the served repository `dist`.

## Verified safety precondition for removing the reader layer

The planning-cycle read-only check at clean
`85a00e7c2ec21af023315dc32c2c84a4e9c7d692` found no exception:

- all 26 case pages have exactly one professional layer containing the heading
  “臨床限制” and a non-empty paragraph equal to the corresponding immutable
  `professional.clinicalLimitations` value;
- the seven ACL cases state that video cannot replace clinical diagnosis;
- the 12 ankle cases state that the image cannot distinguish the relevant
  injury and that symptoms, palpation, weight-bearing ability, and appropriate
  examination are still required;
- the seven Achilles cases require clinical assessment, with appropriate
  imaging when needed, and state that video cannot establish rupture details;
- every clinical-limitations claim retains its teaching-evidence binding.

This planning observation is not reusable as execution evidence. Phase 0 must
repeat a source-to-render, 26/26 machine check at the later authorized start.
If even one case lacks the heading, non-empty source-equal professional text,
the video/diagnosis limitation meaning, or its evidence binding, stop before
Decision A or B and report the exact slug. Do not compensate by copying the
reader text into the professional layer or changing medical content.

## Source-policy decision: keep immutable `nba-v10`; do not create `nba-v11`

Decision 18 changes research completeness and auditability, not source
eligibility, source tiers, atomic attribution, pending-review state,
actual-return evidence, NBA presentation, or any other evidence standard.
Therefore no new NBA source-policy version is required or permitted by this
plan.

Keep these exact policy bytes immutable:

- `research/source-policy/nba.v10.md` — SHA-256
  `34e05ef2b6c1f7fbfbafe9dbf5ae469394bcd3a7c6dc49b07f0468a566a5604c`;
- `research/source-policy/source-policy.v10.json` — SHA-256
  `9203384e5d8b551834e3de5c17a3cc2bff60f8e27416a3074897db861df9a4b3`.

`nba-v10` remains the item-level evidence/attribution contract and explicitly
does not create execution authorization. The later exact Decision 18
authorization governs repository execution; the new research-v2 contract
binds that authority and adds a stricter, independently testable completeness
layer without retagging item payloads. This avoids meaningless digest churn
across the 44 pending items whose source eligibility has not changed.
V10's Decision-17-specific execution narrative remains immutable historical
context and is not reused as Decision 18 authority; the later D18 decision is
validated and recorded separately in every v2 audit and review-set v3.

If execution discovers that the owner-requested outcome actually requires a
new source tier, a changed eligibility threshold, a weaker publication-date
rule, a different `actual-return` source rule, a changed NBA link rule, or an
edit to either v10 byte stream, stop. That would require an append-only
`nba-v11` and corrected exact authority; it must not be absorbed into this
plan.

## Evidence controls inherited unchanged from `nba-v10`

Every retained, added, or updated atomic follow-up item must continue to meet
all of these rules:

1. It carries its own canonical HTTPS source, title, publisher/account,
   publication date, access date, and source tier. One paragraph-level source
   list cannot support several facts.
2. The visible tier is exactly `team-or-league-official`,
   `mainstream-media-report`, or `unverified-report`; the last is visibly
   “未證實報導” and can never be promoted visually or semantically to
   confirmed.
3. Every rendered follow-up block visibly states exactly:

   > 以下內容是第三方報導的整理，不是本站醫師的診斷、評估或建議。

4. `actual-return` is retrospective only, uses a team/league official
   participation source, has an occurred non-future date, and can never be
   supported by `unverified-report`.
5. No item may infer an unstated operation, injection, rehabilitation length,
   prognosis, outcome, or return date.
6. A search-result snippet is never evidence. A retained fact requires the
   opened original page and exact source metadata.
7. If no qualifying fact survives the exhaustive protocol, the category stays
   empty and records why and how far the search went. Empty never proves the
   event did not occur.
8. An `nba.com` or subdomain citation remains visible literal text with zero
   anchor, redirect, iframe, metadata/JSON-LD URL, script target, client-side
   reconstruction, or other navigation sink.

## Machine-verifiable exhaustive-audit contract

### Unit of work and qualifying novelty

The atomic audit unit is one `(caseSlug, factKind)` pair. There are exactly 26
cases and four fact kinds—`treatment`, `surgery`, `injection`, and
`actual-return`—for 104 independently terminal units.

A **qualifying fact** is an atomic fact that satisfies `nba-v10` from one
opened original page. A **new qualifying fact** adds a new atomic item to the
cumulative retained payload set. Fact identity is the case, fact kind,
supported atomic proposition/detail, and supported fact date—not the number
of pages that repeat it. A second source for the same proposition/date is
recorded as corroboration and does not create a duplicate sidecar item or a
new fact. If a stronger source replaces the item's cited source, or its date or
wording is corrected without changing the underlying proposition, that is a
**changed qualifying payload** on the stable item ID. A materially different
supported detail/date is a new fact with a new ID. Added and corrected deltas
both reset the no-new counter. A duplicate result, search snippet,
syndication of the same original report, reopened unchanged source, rejected
candidate, or unsourced speculation does not count as new or changed.
The fresh round/open timestamp is audit metadata, not item novelty: reopening
an unchanged baseline source does not rewrite its historical item
`source.accessedAt` merely to manufacture a payload delta. A genuine source-
metadata correction is recorded explicitly, changes the payload digest while
remaining pending, and resets the zero-new counter.

Each audit unit stores the exact starting set derived from Decision 17 and a
canonical `qualifiedSetBeforeSha256` and `qualifiedSetAfterSha256` for every
round. `qualifiedFactDeltas[]` contains the item ID, `changeType` (`added` or
`corrected`), null-or-prior payload SHA-256, and new payload SHA-256. Added IDs
must be unique and first retained in that round. A corrected stable ID is
allowed only for the same atomic fact's supported wording/source metadata; a
materially different fact needs a new ID. The delta list must equal the
canonical set mutation, and `newQualifiedFactIds` is a derived projection of
its `added` rows. When `qualifiedFactDeltas=[]`, the two set digests must be
equal. Existing Decision 17 facts that remain eligible are reopened and
recorded as revalidated baseline facts; they are not falsely counted as new
discoveries.

### Required round record

`case-follow-up-research.v2` records, for every round:

- a contiguous positive `roundNumber`, UTC start/completion timestamps, and
  operator/tool channel;
- a `queries[]` record for every issued query containing a unique `queryId`,
  exact query string, controlled source channel, timepoint angle, covered term
  concepts, verification channel, and result code;
- original pages/candidates linked back to exactly one `queryId`, with
  final/canonical URL, title, publisher/account, publication/access dates, and
  disposition;
- one result code per query and candidate: retained-new, retained-existing/
  corroboration, retained-changed, rejected-with-reason, no-candidate, or
  unresolved-access;
- `qualifiedFactDeltas`, derived added/corrected counts and new-fact IDs, and
  the before/after cumulative-set digests;
- rejection or not-found reasons, including the exact checked boundary; and
- `searchSnippetUsedAsEvidence=false` for every retained fact.

Each batch receipt fixes `generatedAt` to a verifier-checked UTC timestamp no
later than the verifier's current time and derives `auditCutoffDate` as that
timestamp's UTC calendar date; an independently supplied or future cutoff is
invalid. For D18 v2 facts,
`source.publishedAt <= source.accessedAt <= calendarDate(round.completedAt) <= audit cutoff`
must hold. A nullable `factDate` is permitted only where v10 already allows it;
when present it must be no later than source access and the audit cutoff.
`actual-return` still requires a non-null occurred, non-future date. Legacy
D17 validation retains its historical 2026-08-14 cutoff; the transitional
loader may not apply that stale default to a completed D18 batch or allow a
future date relative to its recorded audit.

Each query stores a controlled `angleId` derived canonically from
`sourceChannel`, `timepoint`, and the normalized sorted
`coveredTermConcepts` set. Neither the exact query string nor `angleId` may
repeat within an audit unit. Each round must use a materially different angle
from the preceding round. An unresolved network,
authentication, robots, rendering, or original-page access failure for a
material candidate that could yield a qualifying fact makes the round
non-terminal: it cannot count as a zero-new round and must be retried,
resolved through an accessible original/official equivalent, or reported as
a blocker. An obviously irrelevant or exact-duplicate blocked result may be
rejected with its reason and identity; it is not silently ignored.

### Mandatory angle and synonym coverage before terminal status

Before an audit unit can be terminal, its completed round ledger must show
attempts across all of these source channels, whether or not they produced a
candidate:

- the relevant team's official site and newsroom;
- NBA league official news, announcements, game/participation records, and
  available injury reports;
- team or player press conferences and formal statements;
- named mainstream-media original pages, never search-result summaries; and
- the relevant chronological views: injury-time reporting, operation
  announcement, rehabilitation/progression reporting, and actual-return
  announcement or participation record. A timepoint that logically cannot
  apply still needs an explicit `not-applicable` rationale, not silent
  omission.

The category query ledger must also cover all of its term family:

| Fact kind       | Required English terms or equivalent inflections/phrases |
| --------------- | --------------------------------------------------------- |
| `surgery`       | surgery, procedure, operated, underwent, repair, reconstruction, surgeon/operating-physician name branch |
| `treatment`     | treatment, rehab, recovery, program, management, cleared, progression |
| `injection`     | injection, shot, PRP, platelet-rich plasma, cortisone, corticosteroid, needling |
| `actual-return` | return, returned, debut, first game back, activated, cleared to play |

Terms may be grouped into queries, but the ledger and checker must prove that
every required concept was actually attempted. If an opened page names a
surgeon or treating physician, later surgery rounds must include a query using
that name. If no name is found, the audit must record that fact and still use
the generic surgeon/doctor/operating-physician branch. Athlete name, injury,
team, season/year, and applicable timepoint terms must be combined in multiple
ways rather than repeating one quoted phrase.

### Exact stopping algorithm

For each `(caseSlug, factKind)` pair, process completed rounds in round-number
order with `consecutiveNoNew = 0`:

```text
if round is invalid or has an unresolved material candidate:
    the audit unit is not terminal
else if qualifiedFactDeltas.length > 0:
    consecutiveNoNew = 0
else:
    consecutiveNoNew += 1
```

The unit is `exhausted` only when all mandatory channel/timepoint/term coverage
has passed and the **last two completed valid rounds** both have empty
`qualifiedFactDeltas` arrays, equal before/after set digests, and different
query/angle tuples. The checker derives this result; a hand-written
`exhausted=true` flag is insufficient. It rejects fewer than two terminal
zero rounds, an added/corrected delta in either of the last two rounds,
duplicated angles, unresolved material-candidate access, missing coverage,
mismatched set deltas, or any trailing round after the first valid terminal
pair. Discovery of a new or corrected qualifying payload resets the counter,
so two fresh zero-new rounds are required afterward.

Only when all four audit units for a case are exhausted may that case's
Decision 18 research ledger be projected into its sidecar. Only when all cases
in a batch meet that rule may the batch receipt and commit be created.

### Injection-specific zero result

Zero qualifying injection items is an allowed factual outcome, not a target.
Every injection audit must still cover the complete injection term family,
all required source channels and applicable timepoints, and end with two valid
zero-new rounds. Its report must distinguish official silence, mainstream
speculation rejected under v10, inaccessible original pages, and genuine
qualifying records. An inaccessible material candidate that could yield a
qualifying injection fact prevents terminal status until resolved or reported
as a blocker; an irrelevant/duplicate blocked result follows the general
rejection rule. A speculative report may be recorded/rejected or retained
only at the exact v10 tier, never upgraded.

## Injury batches and immutable membership

The exhaustive work runs in this exact order. No case can move between batches.

### Batch 1 — ACL (7)

- `danny-green-acl-2022`
- `joe-ingles-acl-2022`
- `kyrie-irving-acl-2025`
- `markelle-fultz-acl-2021`
- `moritz-wagner-acl-2024`
- `ricky-rubio-acl-2021`
- `thomas-bryant-acl-2021`

### Batch 2 — ankle sprain (12)

- `anfernee-simons-ankle-sprain-2023`
- `anthony-edwards-ankle-sprain-2023`
- `anthony-edwards-ankle-sprain-2025`
- `cj-mccollum-ankle-sprain-2020`
- `ja-morant-ankle-sprain-2020`
- `kevin-durant-ankle-sprain-2024`
- `kyrie-irving-ankle-sprain-2021`
- `lamelo-ball-ankle-sprain-2022`
- `lamelo-ball-ankle-sprain-2023`
- `lamelo-ball-ankle-sprain-2025`
- `lebron-james-ankle-sprain-2021`
- `trae-young-ankle-sprain-2021`

### Batch 3 — Achilles rupture (7)

- `brandon-clarke-achilles-rupture-2023`
- `damian-lillard-achilles-rupture-2025`
- `dejounte-murray-achilles-rupture-2025`
- `dwight-powell-achilles-rupture-2020`
- `jayson-tatum-achilles-rupture-2025`
- `kevin-durant-achilles-rupture-2019`
- `tyrese-haliburton-achilles-rupture-2025`

## Batch completion and deterministic resume rule

Each batch has one canonical receipt under
`research/follow-ups/decision-18/batches/`, one review report, exact ledger and
sidecar SHA-256 lists, an allowed-path inventory, the preceding batch-receipt
digest when applicable, and one conventional local batch commit. A batch is
complete only if all of the following are true:

1. Its receipt names exactly the frozen 7/12/7 membership and no other case.
2. Every member has all four audit units; each checker-derived terminal state
   has the last two valid rounds at zero added/corrected deltas and complete
   required angle and synonym coverage.
3. Every retained fact has one opened original source and exact v10 metadata;
   every sidecar is an exact projection of the cumulative retained set.
4. All existing, retained, added, and changed items are
   `pending-owner-signoff` with matching payload/review digests. No reviewer
   identity or approval data exists.
5. The batch verifier, v10 checker, NBA zero-sink checker, clinical/cover
   freezes, and batch path allowlist pass; the receipt/report hashes match.
6. The receipt-introducing conventional commit is reachable from `HEAD`, only
   the allowed batch paths changed in that commit, and the worktree is clean.

On every fresh or resumed run, validate Task 0 and then scan receipts strictly
in ACL → ankle → Achilles order. Re-hash completed batches read-only; do not
research or rewrite them. Resume at the first batch with an absent receipt. An
invalid existing receipt is not resumable evidence: stop for an explicit
successor correction. A later receipt without every earlier valid receipt is
a non-contiguous state and also stops execution.

If execution stops inside an uncommitted batch, a resume may continue only
when every dirty/untracked path is inside that batch's declared working-path
allowlist and every existing partial ledger parses. Within that batch, resume
at the lexicographically first `(caseSlug, factKind)` lacking the derived
terminal two-zero condition; completed audit units are revalidated but not
repeated. Any unexplained dirty path, edited completed-batch path, digest drift,
or ambiguous partial round stops execution. A completed batch is never
silently amended by a later batch; a discovered defect requires an explicit
corrective receipt/commit under exact authority.

## Content, approval, and audit lineage

- Preserve every file under `research/follow-ups/decision-17/` byte-for-byte
  as the truthful shallow historical audit. Decision 18 writes separate v2
  ledgers under `research/follow-ups/decision-18/cases/`.
- A Decision 18 v2 ledger binds the exact case ID, unchanged clinical digest,
  exact v10 bytes, later exact Decision 18 plan/authorization bytes, its
  Decision 17 baseline facts, every round, cumulative fact set, and terminal
  result.
- Continue using `case-follow-up.v1` sidecars and `nba-v10` item bindings
  because the item schema and evidence rules do not change. Update only the
  batch's seven/twelve/seven sidecars from exhausted v2 ledgers. Unchanged item
  payloads keep their digest; a changed or new payload gets a new digest and
  remains pending.
- The 44 existing items are inputs, not approvals. Each is reopened and either
  retained with exact support or corrected while pending. Decision 18 does not
  silently delete one of the 44. If an existing item cannot still satisfy
  v10, mark the audit unit blocked and stop for owner direction rather than
  preserving unsupported content or treating deletion as implicitly
  authorized. A correction never rewrites history in the Decision 17 ledger.
- Advance the active review-set contract append-only to
  `review/review-set.v3.json` only after all three batches pass. Preserve v1
  and v2 bytes. V3 keeps the unchanged approved-core identity separate from
  pending follow-ups, binds both the historical Decision 17 and current
  Decision 18 authoring authorities, and records each case's Decision 18 audit
  path/digest and batch receipt. `medicalReviewDecisionAuthorized=false`
  remains explicit.
- The current medical-review-decision parser and public release gate must fail
  closed on v3 pending content. No decision schema, editor signature flow, or
  owner signoff is created in Decision 18.

## Non-goals

- No authorization JSON/binding, Task 0, phase command, web research, policy,
  schema, UI, source, sidecar, review-set, build, or service mutation in the
  current planning cycle.
- No edit to any of the 26 case v1 records, three injury overviews, quarterly
  update, existing owner-review identity, clinical-core digest algorithm, or
  teaching-evidence record. The non-rendered reader text remains historical
  approved input.
- No reader-layer replacement, shortened safety copy, one-button switch,
  empty hidden layer, compatibility `data-layer-*` marker, or orphan toggle
  JavaScript.
- No inference from typical treatment, absence from a roster, video imagery,
  an injury label, another case, or another item's source.
- No use of search snippets, AI summaries, cached result excerpts, or an
  unopenable original page as item evidence.
- No change to source tiers, v10 policy bytes, item source-policy bindings,
  NBA citation presentation, or public/review projection rules.
- No approval/rejection of any of the 44 existing or later items and no reuse
  of 吳易澄醫師's historical approval over new follow-up content.
- No change to any of the 21 current cover files, player-photo registry,
  credit/provenance fact, focal point, rendition, or CC BY-SA composition
  firewall.
- No repository `dist`, private manifest, served receipt, private-service
  request/reload, deployment, hosting/account setting, indexing, public
  release, remote mutation, or push.

## Frozen planning baseline

- Planning began from a clean `main` at
  `85a00e7c2ec21af023315dc32c2c84a4e9c7d692`, the Decision 17 closeout commit.
  A later authorized executor records its exact clean starting commit and
  stops on unexplained relevant drift.
- Every Node/npm command prepends
  `/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin` to `PATH` and
  proves `node --version` is exactly `v24.14.0`.
- There are exactly 26 case files: ACL 7, ankle 12, Achilles 7. The planning
  safety check found professional clinical limitations in 26/26 with no
  exception.
- Decision 17 research has exactly 26 ledgers × four categories = 104 audit
  units. Every one has exactly one `queryBoundaries` entry: 104 total queries
  and 44 retained facts. This is the shallow boundary Decision 18 replaces.
- The current sidecars contain 44 pending items: treatment 16, surgery 13,
  injection 0, and actual-return 15. Source tiers are official 29, mainstream
  14, and unverified 1. All 44 items and all 26 review-set follow-up bindings
  are pending owner signoff.
- The 30-file clinical freeze (26 cases, three injury overviews, one quarterly
  update) remains 30/30 with aggregate SHA-256
  `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.
- All 21 current cover files remain protected with ordered ledger aggregate
  SHA-256
  `625b47f92ad0e4706872e92ea7c7fd92e25c4dfd21dd219feb59154571db15dd`;
  player-photo registry v8 remains SHA-256
  `908ccc9c1d9aeee56c907a476701c8875914af5090614c36271a76447057084a`.
- Active `review/review-set.v2.json` has SHA-256
  `0962e04a3bc6a844518829ea462454384dbc6232198779bce0a303b211892b55`.
  The existing private manifest has SHA-256
  `45be696caa0e7127ed70066db895285f1d0c300ebfcea0e4f50d097f638cc5d5`
  and is a frozen service artifact, not a Decision 18 mutation target.
- `allowIndexing=false`; no Decision 18 medical-review decision exists or is
  authorized.

## Task 0 — Require exact owner authorization before execution

From a clean worktree, require the later owner-supplied strict decision and
exact active binding before Phase 0:

```bash
export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_D18_PLAN="docs/superpowers/plans/2026-08-15-decision-18-professional-notes-and-exhaustive-followups.md"
ATLAS_D18_DECISION="docs/decisions/2026-08-15-decision-18-professional-notes-and-exhaustive-followups-authorization.v1.json"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain --untracked-files=all)"
npm run plan:decision:verify -- \
  --decision "$ATLAS_D18_DECISION" \
  --plan "$ATLAS_D18_PLAN"
npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_D18_PLAN"
```

The decision must bind this exact plan digest, role, scope, and seven closed
scopes, with `medical-content-authoring` deliberately open only for the
bounded pending follow-up work. Any runtime mismatch, dirty tree, absent or
stale decision, plan digest mismatch, role/scope/closed-scope mismatch, or
non-authorized binding stops execution. Conversation text, this plan, the
owner's substantive choices, and a `not-authorized` entry are not substitutes.
Task 0 does not run in the current cycle.

## Phase 0 — Freeze the authorized baseline and repeat the safety gate

1. Record the clean authorized starting commit, exact D18 plan/decision
   digests, Node path/version, plan-binding state, and all frozen baseline
   hashes/counts above.
2. Recompute the 30-file clinical freeze, 21-cover ledger, registry v8, v10
   pair, Decision 17 ledgers/sidecars, active review set, private manifest,
   noindex state, and the 104-one-query/44-item baseline. Stop on unexplained
   drift.
3. Parse all 26 case sources and later-rendered pages. Require one complete
   professional section per case, the “臨床限制” heading, source-equal non-empty
   text with explicit video/clinical-diagnosis limitation meaning, and valid
   teaching evidence. Stop on the first failing slug before editing.
4. Add a Decision 18 protected-boundary contract. It fails on any case/overview/
   update/cover/registry/v10/D17-ledger/private-artifact byte change, owner-
   review change, indexing opening, NBA sink, medical approval, or closed-scope
   mutation.
5. Commit only the baseline ledger, regression contract, tests, and Phase 0
   report. Require a clean worktree before Phase 1.

### Phase 0 acceptance and evidence

- All planning counts/hashes either match or a precise drift report stops the
  phase; no baseline is silently refreshed.
- The professional limitation precondition passes 26/26 from source through
  DOM and evidence binding.
- No UI, policy, research ledger, sidecar, review artifact, `dist`, or service
  state changes. A conventional local Phase 0 commit exists and the worktree
  is clean.

## Phase 1 — Remove the general-reader layer and switch machinery (Decision A)

1. Replace `LayeredNotes.astro` with a single-purpose professional-notes
   component whose props contain only the professional record. Render exactly
   the four existing professional headings/texts, unchanged and in the same
   order.
2. Remove the general-reader section, “一般讀者筆記” heading,
   `whatVideoCannotProve` prop wiring, two-button switch, switch help copy,
   `aria-pressed`/`aria-controls`, emphasis state, all `data-layer-*`
   attributes, and switch-only styling. Do not leave a one-button control,
   hidden/empty compatibility layer, or inaccessible orphan target.
3. Delete the layered-note client script and its obsolete unit test; remove
   every import/bundle reference. Rename remaining CSS/classes and page copy so
   the case route, homepage metadata, about page, and review fixture say
   “專業筆記”, not “雙層筆記”.
4. Update the real case route and fictional review fixture. Keep all 26 case
   JSON bytes—including the now non-rendered reader field—and the professional
   content/digest calculation unchanged.
5. Replace the Decision 17 B-1 DOM assertions with Decision 18 assertions over
   26 real pages plus the fixture: exactly one professional view, all four
   source-equal rows, no general-reader DOM, no toggle/control, no
   `data-layer-*` attribute, no old script token in built JavaScript, and no
   empty layer.
6. Run keyboard, no-JavaScript, axe, mobile/desktop reflow, and visual checks.
   Use a fresh temporary build output outside repository `dist`.
7. Commit only the bounded component/page-copy/script/test/evidence change.
   Require the 30 clinical and 21 cover bytes, v10, follow-ups, review artifacts,
   closed scopes, and worktree cleanliness to remain exact.

### Phase 1 acceptance and evidence

- Every case and fixture shows one complete professional-note view and no
  general-reader layer or layer-switch remnant.
- “臨床限制” remains present and source-equal in 26/26; the other three
  professional sections remain unchanged.
- Search of active runtime source, current tests/verifiers, and temporary built
  assets finds zero `data-layer-*`, `initLayeredNotes`, “一般讀者筆記”, one-
  button switch, or empty-layer state. Historical Decision 13 evidence
  generators/docs are excluded from this runtime assertion and remain
  byte-frozen rather than rewritten to erase history.
- A conventional local Decision A commit exists; all protected medical,
  cover, policy, follow-up, private-service, and closed-scope inputs are
  unchanged; the worktree is clean.

## Phase 2 — Add the exhaustive research-v2 and batch contracts

1. Add `case-follow-up-research.v2` as an append-only research schema. Keep v1
   parsing only for immutable Decision 17 historical ledgers. V2 implements
   the complete round, coverage, set-delta, terminal, original-page, and D18
   authority bindings specified above.
2. Add pure validators that derive terminal status; do not trust stored totals
   or booleans. Negative fixtures cover one zero round, zero/new, new/zero,
   duplicate angle/query, missing synonym/channel/timepoint, unresolved access,
   snippet evidence, set-digest mismatch, undeclared fact, trailing round, and
   an injection empty result without complete search coverage.
3. Add a transitional corpus loader: a case with no completed D18 batch still
   resolves its exact D17 v1 ledger/sidecar; a case in a valid completed batch
   must resolve one D18 v2 ledger and matching updated sidecar. No arbitrary
   fallback, mixed case-level provenance, or partial completed receipt is
   allowed.
4. Add batch-specific generator/checker commands, canonical receipts, exact
   membership, path allowlists, ordered receipt dependencies, and progress/
   resume reporting. A generator may write only the active batch paths and
   must refuse a completed earlier-batch path.
5. Keep `case-follow-up.v1` and item/digest semantics unchanged. Prove updated
   sidecars remain exact projections of retained v2 facts, retain v10
   bindings, and cannot contain reviewer identity or an approved state.
   Replace the D17-only default cutoff in transitional validation with the
   exact per-batch D18 audit cutoff while preserving the historical D17 path.
6. Run `source-policy:v10:check` and byte comparisons for v1–v10. Add a
   negative test proving that an attempted v10 edit or a source-rule change
   fails and requires out-of-scope policy-version work.
7. Commit only schema/tooling/tests/fixtures and the Phase 2 contract report.
   Do not perform player research or modify a real research ledger/sidecar.

### Phase 2 acceptance and evidence

- Synthetic fixtures mechanically prove the two-consecutive-zero algorithm,
  reset-on-added-or-corrected behavior, coverage matrix, original-page rule,
  and resume ordering.
- Existing 26 v1 ledgers and 44 sidecar items still validate unchanged.
- V10 regenerates/checks byte-for-byte and no `nba-v11` exists.
- A conventional local Phase 2 contract commit exists; no real medical draft,
  review artifact, site build, service action, or closed-scope change occurs.

## Phase 3 — Exhaustive Batch 1: ACL 7

1. Require valid Phase 0–2 commits, no batch receipt, and the exact seven ACL
   slugs. On a resumed partial batch, apply the dirty-path/first-nonterminal-
   unit rule above.
2. For every ACL case and each of four categories, reopen eligible Decision 17
   sources, perform and record materially distinct query rounds, cover every
   mandatory source/timepoint/synonym angle, and continue until the derived
   two-zero terminal condition passes.
3. Retain only opened-original-page v10 facts. Derive all seven sidecar
   projections from exact cumulative facts, write only sidecars whose bytes
   actually change, preserve unchanged payload digests where possible, and
   mark every retained/new/changed item pending.
4. Generate the ACL receipt and review report with per-case/category rounds,
   terminal-round IDs, query/channel counts, retained/new/corrected and
   blocked-invalid deltas from the 44-item baseline, rejection/not-found
   reasons, and injection findings.
5. Run the ACL batch verifier, full transitional corpus validation, source
   attribution/tier/actual-return/NBA-sink tests, clinical/cover/v10 freezes,
   formatter/type/unit checks relevant to the batch, and `git diff --check`.
6. Commit only ACL v2 ledgers, any byte-changed ACL sidecars, the receipt that
   binds all seven sidecar hashes, ACL report, and strictly necessary batch-
   generated evidence in one conventional local commit. The worktree must be
   clean before Phase 4.

### Phase 3 acceptance and evidence

- Exactly 7 cases × 4 categories = 28 ACL audit units pass all coverage and
  terminal rules.
- The ACL receipt is canonical, hash-complete, and introduced by the isolated
  ACL batch commit; no ankle/Achilles or completed predecessor path changed.
- Every ACL item is individually sourced/tiered and pending; every empty
  category, especially injection, has a truthful exhaustive boundary.

## Phase 4 — Exhaustive Batch 2: ankle sprain 12

1. Revalidate the ACL receipt/commit read-only, require no Achilles receipt,
   and select exactly the 12 frozen ankle slugs. Refuse to edit ACL outputs.
2. Apply the identical four-category exhaustive protocol, required query
   families, original-page rule, set-delta logic, and two-zero terminal
   algorithm to all 12 cases.
3. Derive all 12 ankle sidecar projections from their terminal v2 ledgers and
   write only byte-changed ankle sidecars. Preserve or regenerate pending
   payload digests exactly; never infer content to fill the currently empty
   Anfernee Simons, CJ McCollum, or LaMelo Ball 2023 cases.
4. Generate the ankle receipt/report with complete queries, channels,
   timepoints, results, deltas, empty reasons, and injection analysis.
5. Run the ankle batch verifier, transitional corpus checks across ACL plus
   ankle, evidence/pending/actual-return/NBA checks, protected freezes, and
   path allowlist.
6. Commit only ankle v2 ledgers, any byte-changed ankle sidecars, the receipt
   that binds all 12 sidecar hashes, ankle report, and bounded evidence in one
   conventional local commit. Require a clean worktree before Phase 5.

### Phase 4 acceptance and evidence

- Exactly 12 × 4 = 48 ankle audit units pass; ACL remains byte-identical to its
  completed receipt.
- The valid ankle receipt binds the ACL receipt digest and is introduced by an
  isolated ankle batch commit.
- All updated content is item-sourced and pending; no empty category is filled
  by a typical treatment or inferred return.

## Phase 5 — Exhaustive Batch 3: Achilles rupture 7

1. Revalidate ACL and ankle receipts/commits read-only and select exactly the
   seven frozen Achilles slugs. Refuse any earlier-batch mutation.
2. Apply the identical exhaustive protocol to 28 Achilles audit units. The
   Kevin Durant 2019 audit must explicitly demonstrate expansion beyond its
   four Decision 17 queries and test surgery date/physician, official team
   announcement, rehabilitation progression, and actual return through the
   required source and timepoint angles.
3. Derive all seven Achilles sidecar projections from terminal v2 ledgers and
   write only byte-changed Achilles sidecars. Keep every old/new/corrected item
   pending and every actual-return item strictly official and retrospective.
4. Generate the Achilles receipt/report, including full injection-term
   coverage even if the corpus still yields zero qualifying injections.
5. Run the Achilles verifier, complete 26-case D18 corpus check, all evidence/
   pending/actual-return/NBA/protected-boundary checks, and path allowlist.
6. Commit only Achilles v2 ledgers, any byte-changed Achilles sidecars, the
   receipt that binds all seven sidecar hashes, Achilles report, and bounded
   evidence in one conventional local commit. Require a clean worktree before
   Phase 6.

### Phase 5 acceptance and evidence

- Exactly 7 × 4 = 28 Achilles audit units pass; all 104 units across 26 cases
  are now terminal with two consecutive valid zero-new rounds.
- ACL and ankle outputs remain byte-identical to their receipts. The Achilles
  receipt binds both predecessors and is introduced by its isolated commit.
- The report states the actual corpus counts and why injection entries remain
  empty or which qualifying original pages changed that result; it never
  treats zero as proof of non-occurrence.

## Phase 6 — Bind pending lineage and validate locally without hosting mutation

1. From the clean three-batch state, verify all receipts, 26 v2 ledgers, 104
   terminal units, complete v10 fact projections, and exact batch commit/path
   isolation. Refuse integration if any receipt or completed-batch byte drifts.
2. Add the minimum review-set-v3 contract/tooling described above. Preserve
   `review-set.v1.json` and `review-set.v2.json` bytes; migrate the active
   route/tool readers to v3 with no fallback after all 26 D18 audits exist.
3. Make any source/tooling migration commit first. From that clean commit,
   generate canonical `review/review-set.v3.json`, prove it separately binds
   approved core, pending follow-up digest, v10, D18 audit digest/receipt, D17
   authoring history, and exact D18 authority, then commit the governed v3
   artifact alone.
4. Build review mode only into a fresh `mktemp -d` output and validate all 26
   case routes, the fixture, review-set route, and static assets there. Never
   write repository `dist` or invoke the private service/toolchain.
5. Verify Decision A's single professional view; all item-level source/tier/
   date/pending states; the exact block disclaimer; explicit empty states;
   actual-return retrospection; zero NBA navigation sinks; no public pending
   projection; noindex; accessibility; mobile/desktop layout; and digest
   lineage.
6. Run the complete unit/coverage, TypeScript/Astro, formatting, content,
   plan-binding, v1–v10 policy, research-v2, batch, clinical/cover/photo,
   CC BY-SA, route, Playwright/axe, and Git whitespace suites that do not
   mutate closed service state. Record exact commands, exit codes, counts, and
   temporary build path disposition.
7. Add a final Decision 18 local-validation report. State plainly that no
   private-manifest refresh, service reload, served smoke, deployment,
   medical-review decision, or owner signoff occurred and that all follow-ups
   remain pending.

### Phase 6 acceptance and evidence

- The complete corpus has 26 v2 ledgers, 104 exhausted audit units, three
  ordered valid batch receipts, and actual post-audit item/tier/kind counts.
- Review-set v3 preserves approved-core lineage and separately binds every
  pending follow-up plus D17/D18 authoring and D18 audit provenance. V1/v2 are
  unchanged and medical-review/public gates fail closed.
- Temporary built DOM satisfies A and B at desktop/mobile with zero NBA sinks;
  repository `dist`, private manifest/receipt, and running service remain
  untouched.
- The final source tree is clean, no closed scope was crossed, and no push
  occurred.

## Completion conditions

- The general-reader layer, toggle/buttons, help text, `data-layer-*`
  attributes, emphasis JS, switch CSS, and related obsolete assertions are
  absent; no one-button switch or empty layer remains.
- Each real case renders exactly one professional-note view with all four
  unchanged source-equal sections, including “臨床限制”. All 26 case files and
  the complete 30-file clinical freeze remain byte-identical.
- Every one of the 104 case/category audits has complete required
  channel/timepoint/synonym coverage and ends in two consecutive valid,
  materially different zero-new rounds after the last added/corrected delta.
- Every retained fact has one opened original page and its own source/title/
  publisher/date/tier. Search snippets support zero items; unsupported
  categories remain explicitly empty and non-inferential.
- Every existing, added, or updated follow-up item is
  `pending-owner-signoff`; visible tier labels and the third-party attribution
  remain exact, and `unverified-report` is never promoted.
- Every `actual-return` fact is official, retrospective, and non-future. No
  unstated surgery, rehabilitation length, prognosis, or return date is
  inferred.
- NBA citations remain literal text with zero navigation sink. `nba-v10` and
  all earlier policy bytes remain immutable; no `nba-v11` is created.
- ACL, ankle, and Achilles results each have an isolated valid commit/receipt,
  with deterministic sequential resume behavior.
- All 21 covers and the registry remain exact. Review-set v3 retains separate
  approved-core and pending-follow-up lineage. Indexing, service, public,
  remote, deployment, and medical-review scopes remain closed.

## Risks and controls

- **Reader safety text disappears:** The 26/26 professional limitation gate
  must pass before UI work and after every phase; one failure stops rather
  than copying or inventing replacement text.
- **One-button or ghost-layer UI:** Delete the full switch behavior and scan
  HTML/bundles for every old control/attribute/script token.
- **False exhaustion:** Derive terminal state from round deltas and coverage;
  never trust prose, a boolean, or a fixed query count.
- **Zero-round gaming:** Require distinct query/angle tuples, complete
  channel/timepoint/term coverage, equal cumulative digests, and no unresolved
  original-page access.
- **New fact resets ignored:** The checker resets the counter on every non-empty
  delta and rejects terminal claims without two later zero rounds.
- **Duplicate reports inflate novelty:** Define novelty from canonical atomic
  fact identity, record corroboration separately, use explicit corrected-
  payload deltas, and reject syndication as a second fact when it adds no
  supported proposition/detail/date.
- **More searching lowers standards:** Keep v10 byte-bound at research and
  item validation, preserve original-page/publication-date rules, and fail
  any proposed policy change out of scope.
- **Injection speculation becomes fact:** Exhaust the complete vocabulary but
  preserve exact source tier and atomic evidence. Zero remains acceptable;
  rumor is never upgraded.
- **Approval laundering:** Keep old clinical approval, D17/D18 authoring
  authorities, research audit, item payload, and pending review as separate
  digests in review-set v3.
- **Batch work is lost or overwritten:** Canonical per-batch receipts, strict
  membership/path allowlists, ordered commits, first-absent-batch resume, and
  invalid-receipt stop make completed batches immutable inputs.
- **Live private site changes accidentally:** Build only outside repository
  `dist`; freeze private manifest/receipt and prohibit service commands.
- **NBA deep-link regression:** Reuse the central fail-closed renderer and scan
  attributes, JSON-LD, scripts, redirect artifacts, and client reconstruction.
- **Cover/clinical collateral:** Re-hash the 30 clinical and 21 cover inputs in
  every batch and final validation.

## Rollback

- Roll forward with corrective commits or use `git revert`; never reset
  destructively, rewrite history, force push, or edit a bound plan/decision,
  completed receipt, historical D17 ledger, or review artifact in place.
- A presentation defect may be reverted without touching any case, follow-up,
  cover, or policy byte. Restoring a two-layer switch is not an implicit
  fallback; it requires owner direction.
- A batch defect stops later batches. Create an explicit successor corrective
  receipt and commit under exact authority, then revalidate downstream receipt
  dependencies. Never silently change a completed batch.
- A research correction changes the relevant v2 ledger/item/audit digests and
  remains pending. It never rewrites the D17 ledger or approved clinical core.
- If an actual source-policy rule must change, stop for a separately planned
  append-only `nba-v11`; do not edit v10.
- Review-set-v3 corrections are append-only/roll-forward; v1/v2 remain
  historical. Any service handoff, reload, private manifest, served receipt,
  medical decision, public/indexing action, or remote operation requires
  separate exact authority.

## Current planning-cycle bind and stop

The present task performs only plan drafting and `not-authorized`
registration:

```bash
export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_D18_PLAN="docs/superpowers/plans/2026-08-15-decision-18-professional-notes-and-exhaustive-followups.md"

test "$(node --version)" = "v24.14.0"
test "$(git rev-parse HEAD)" = "85a00e7c2ec21af023315dc32c2c84a4e9c7d692"
test -z "$(git status --porcelain --untracked-files=no)"
test "$(git status --porcelain --untracked-files=all)" = "?? $ATLAS_D18_PLAN"
npx prettier --check "$ATLAS_D18_PLAN"
git diff --check
npm run plan:bind -- "$ATLAS_D18_PLAN" \
  --status not-authorized \
  --role decision-18-professional-notes-and-exhaustive-followups \
  --scope decision-18-professional-notes-and-exhaustive-followups-only \
  --closed-scopes deployment,external-account-mutation,hosting-service-mutation,indexing,medical-review-decision,public-release,remote-repository-mutation
npm run plan:verify
git diff --check
ATLAS_D18_SHA="$(/usr/bin/shasum -a 256 "$ATLAS_D18_PLAN" | /usr/bin/cut -d ' ' -f 1)"
test "$(jq -r --arg path "$ATLAS_D18_PLAN" '.documents[] | select(.path == $path) | .sha256' docs/decisions/plan-binding.v1.json)" = "$ATLAS_D18_SHA"
```

Require the separate negative `npm run plan:assert-authorized --
"$ATLAS_D18_PLAN"` result to fail specifically because status is
`not-authorized`. Compute the plan's raw-byte SHA-256, verify it equals the new
binding entry, stage only this plan and
`docs/decisions/plan-binding.v1.json`, and make one local commit named
`docs(governance): register Decision 18 professional notes and exhaustive follow-ups plan`.
Then stop. Do not create the authorization JSON, execute Task 0 or Phase 0–6,
open a research source, alter any page/content/policy/test/schema/artifact, or
perform any service, remote, review, release, deployment, or indexing action.
