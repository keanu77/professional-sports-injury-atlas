# Decision 20 independent approval ledger

The 2026-08-20 handoff records the owner's correction to the original D20
implementation: adopt the completed D18 receipts, and record approval in a
separate ledger. The original SHA-bound plan and authorization are unchanged.
This implements that recorded correction without rewriting any frozen fact.

## Independent review of 167eea1

The net-content check is appropriate for verifying the currently built artifact.
An exact revert restores the original bytes; rejecting all future builds merely
because a reverted commit exists makes recovery impossible. The original and
reverting commits remain in history for audit. This check does not prove that
no historical intermediate state ever differed.

The gate still checks current file digests, regular non-symlink files, receipt
predecessors, a unique reachable introduction, the introducing commit's allowed
paths, and worktree changes. A real Git regression now exercises initial
acceptance, committed alteration rejection, exact revert acceptance, and dirty
alteration rejection. Both caller diagnostics now describe net differences
accurately. No frozen receipt is regenerated or its allowed paths expanded.

## Approval projection

- `review/follow-up-approvals/decision-20.adoption.v1.json` pins the three existing
  D18 receipts and names the separate ledger. It does not bind the ledger's bytes
  into the old receipts or grant permission to rewrite research artifacts.
- `review/follow-up-approvals/decision-20.ledger.v1.json` records the previously
  approved 148 `(caseId, itemId, reviewedPayloadDigest)` tuples. Approval date is
  the recorded owner decision date, 2026-08-16, not today's implementation date.
- The review loader first runs all D18 provenance checks, then verifies exact
  D20 plan/authorization bytes and active binding, strict canonical review files,
  predecessor digests, unique ledger entries, and their inherited payloads.
- Only the in-memory `review` field changes. The effective follow-up aggregate
  digest includes the approval metadata and is propagated to the review set,
  private artifact generator, HTML disclosure and verification paths.
- Missing or stale item matches cannot inherit approval; the pure projection
  falls back to pending. Invalid corpus or authority artifacts return zero
  entries and fail the build. This decision only approves the frozen 148 items;
  it cannot approve a future revised fact merely by changing its ledger digest.
- Approved reports have no review badge. Pending fixtures still demonstrate the
  pending state. Source tiers and third-party attribution remain unchanged.

## Restored portability

Studio uses `/Users/ethanstudio` and a path containing spaces. A test now uses
`fileURLToPath` instead of the URL pathname. The historical external lead package
was copied read-only from mini to the migration evidence directory. Its SHA-256
is `9f743a5eeb7e669a3038287ee55608136f11fb2d3d44b608daf53442a2db8dd5`,
identical to the original hardcoded evidence binding. The checker retains the
original logical path and digest, using the archived bytes only when that local
path is absent. No historical source evidence or binding was reconstructed.

The initial baseline was 1272/1278: four failures from the absent old-account
file and two from URL-encoded spaces. Sandboxed local socket failures were
separately identified and the suite was rerun with local test sockets enabled.
Final validation is recorded separately after the clean-commit checks.
