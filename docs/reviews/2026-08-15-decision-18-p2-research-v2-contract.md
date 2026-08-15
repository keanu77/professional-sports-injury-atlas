# Decision 18 Phase 2 — Exhaustive research-v2 and batch contracts

Date: 2026-08-15

State: contract/tooling complete locally; no player research, follow-up item,
review artifact, build output, or hosting state was created in this phase

## Research-v2 contract

`case-follow-up-research.v2` is an append-only research-audit schema. It binds
each ledger to the exact governed case, clinical digest, immutable Decision 17
ledger and Phase 0 sidecar bytes, `nba-v10`, and the exact Decision 18 plan and
authorization. The validator derives state by replay; there is no trusted
hand-written `exhausted` boolean.

For each of the 104 `(caseSlug, factKind)` units, replay now verifies:

- contiguous, chronologically monotonic rounds and unique query, angle,
  candidate, item, evidence, and atomic-fact identities;
- exact before/after qualified-set digests and one-to-one opened-page
  candidate bindings for every added or corrected delta;
- reset after either added or corrected payload, complete mandatory channel,
  timepoint, and synonym coverage, and two final distinct zero-delta rounds;
- case-derived athlete, team-at-event, injury, season/year, and applicable
  timepoint terms in every issued query, with at least two materially distinct
  context formulations;
- search snippets never used as evidence, material unresolved access blocking
  terminal state, and local baseline revalidation unable to create a new or
  changed fact;
- exact Decision 17 baseline reopening without rewriting historical access
  dates, and source-identity-preserving retained-existing records. A baseline
  fact counts as reopened only through a web/browser/direct opened-original-
  page candidate whose access date is strictly newer than the Decision 17
  record; local data cannot satisfy this gate or a terminal round;
- a surgeon-name branch derived from opened surgery candidates, followed by a
  later name query when a medical person is actually found; and
- strict retrospective, official, non-future `actual-return` facts.

Negative tests cover one-zero, zero/new, new/zero, reset after additions and
corrections, duplicate query/angle/candidate IDs, cosmetic context variants,
missing synonyms/channels/timepoints, false not-applicable coverage,
candidate/result/delta mismatch, inaccessible material pages, snippet use,
set-digest drift, undeclared facts, trailing rounds, invalid injection-zero
claims, surgeon-branch fabrication, local-baseline misuse, and date/source
violations.

## Reproducible authoring and transition

The active-batch case generator has three fail-closed modes:

- `--init --audit-cutoff YYYY-MM-DD` creates only per-case, nonterminal
  research scaffolds. Each scaffold contains six source-channel query slots
  per fact kind, all required terms, all four chronology angles, two context
  formulations, explicit immutable baseline identities, and zero claimed
  results, candidates, deltas, or terminal rounds. Re-running initialization
  preserves valid partial records byte-for-byte.
- `--write` replays completed canonical per-case research records into v2
  ledgers and exact pending `case-follow-up.v1` sidecar projections. It writes
  only the first active batch's governed outputs and writes a sidecar only
  when its bytes change.
- `--check` regenerates the same artifacts in memory and rejects missing or
  drifting output bytes.

The transitional corpus loader remains exactly on Decision 17 for cases whose
batch has no valid receipt. A completed receipt switches the whole batch to
v2 atomically and supplies its own audit cutoff. Invalid, partial, or
noncontiguous receipt state returns no corpus rather than falling back or
mixing provenance. The loader first hashes the Phase 0 baseline itself against
`fa541c8a2c1fd476e41f0820fc40440f6d16fb2b1990cd14dc25053fef32c992`,
then uses its original sidecar and Decision 17 bindings; current mutable
sidecar bytes cannot masquerade as the starting baseline.

Receipt schema validity alone cannot trigger that transition. The production
adapter rehashes the receipt itself and every bound ledger, sidecar, report,
and evidence file; checks predecessor receipt bytes; permits dirt only inside
the exactly next active batch while rejecting completed-batch and out-of-scope
dirt; and proves the unique conventional receipt-introducing commit,
changed-path allowlist, reachability, and absence of later mutations. The Git
inspection surface is injectable for isolated tests, but the byte and
provenance validation itself cannot be disabled.

The case route, content checker, and existing follow-up DOM/digest verifiers
now consume this transitional loader. With no batch receipt present, all 26
cases still resolve their exact Decision 17 v1 ledger/sidecar and historical
2026-08-14 cutoff.

## Ordered batch and Git provenance controls

The contract fixes ACL 7 → ankle 12 → Achilles 7 membership and order,
working-path allowlists, receipt/report/evidence locations, and predecessor
receipt digests. The status/resume command rejects a later receipt after a
gap, invalid P0 bytes, ambiguous partial ledgers, completed-batch drift, or any
dirty path outside the first absent batch; it reports the lexicographically
first nonterminal case/kind.

Resume derives each of the four unit states directly from the editable
per-case research record, its immutable P0/D17 inputs, and the same replay
validator. It therefore preserves and reports a case with three terminal
units and selects its actual fourth unit, rather than hiding partial progress
until a whole-case ledger exists. Malformed or unsafe partial records are
ambiguous and block.

The receipt command only binds an already-terminal active batch. It validates
all v2 ledgers, exact sidecar projections, report/evidence bytes, v10 and
authority bytes, P0 case/D17/sidecar bindings, item/evidence uniqueness, and
generated-time/cutoff ordering before atomically creating an absent receipt.
Completed checks require a clean worktree and prove that each receipt has one
reachable conventional introducing commit, that the commit contains all
required and only allowed paths, and that no later commit touched a completed
batch path. All three receipts remain independently checkable after the chain
is complete.

## Phase 2 validation

Passed before the Phase 2 commit:

- focused research-v2, transition, batch, authoring, receipt, and consumer
  suite: 7 files, 94/94 tests;
- complete unit suite: 75 files, 1,278/1,278 tests;
- TypeScript `--noEmit`;
- Astro diagnostics: 0 errors, 0 warnings, 16 informational hints across 280
  files;
- content validation against the unchanged 26-case Decision 17 corpus;
- Decision 18 Phase 0 exact baseline check;
- canonical source-policy regeneration/checks for v6 through v10, with
  unchanged v10 Markdown and JSON hashes and no v11 artifact;
- clinical freeze 30/30, player-photo registry v8, and brand/CC BY-SA checks;
- plan binding (32 documents) and positive Decision 18 authorization;
- scoped Prettier and `git diff --check`.

The initial clean status correctly selected ACL as the first active batch.
An intentional resume check while Phase 2 files were still uncommitted rejected
all 25 tooling/report paths as outside the ACL working allowlist; this confirms
that Phase 2 must be committed and the tree clean before research begins.

No real Decision 18 ledger, case research record, follow-up sidecar, batch
receipt, or review-set-v3 artifact was created. No repository `dist`, private
manifest, served receipt, service, deployment, remote repository,
medical-review decision, owner-signoff state, public-release state, or
indexing state changed. `private:manifest`, `private:verify`, `launchctl`, and
served smoke were not run because `hosting-service-mutation` is closed.
