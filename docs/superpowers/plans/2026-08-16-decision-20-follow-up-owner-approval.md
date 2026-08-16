# Decision 20 Follow-up Owner Approval Plan

> Status: NOT AUTHORIZED. Owner Decision 20, communicated by 吳易澄醫師 on
> 2026-08-16, records that the owner reviewed all 148 Decision 18 follow-up
> items on the private review host and approves every one of them, including
> the four `unverified-report` items. Repository execution still requires a
> strict `PlanExecutionDecisionV1` bound to this plan's exact final path and
> SHA-256.

**Goal:** Introduce an owner-approved review state, move all 148 follow-up
items into it, remove the pending-signoff presentation, and refresh the private
review artifact so the host serves the approved state. No follow-up fact,
source, tier, date, or wording changes.

## Scope and authority

- Execution role: `decision-20-follow-up-owner-approval`; execution scope ID: `decision-20-follow-up-owner-approval-only`; required closed scope IDs: `deployment`, `external-account-mutation`, `indexing`, `medical-content-authoring`, `public-release`, `remote-repository-mutation`.

`medical-review-decision` is opened because this plan records the owner's
medical review outcome. `hosting-service-mutation` is opened only for the
artifact chain and one private-review service reload. `medical-content-authoring`
stays closed: no new medical content may be written, and no existing statement,
source, tier, or date may be edited.

## Owner's recorded decision

The owner reviewed the served Decision 18 corpus and approves all 148 items:
63 `team-or-league-official`, 81 `mainstream-media-report`, and 4
`unverified-report`, across 96 treatment, 28 surgery, 0 injection, and 24
actual-return items in 26 cases.

Approval means the owner confirms each item is a faithful attributed summary of
its cited third-party source. **It does not convert any item into the owner's
own diagnosis, assessment, or recommendation**, and it does not promote an
`unverified-report` item to a confirmed fact.

## Design constraints

1. **Approval binds to content.** The approved state must carry the exact
   `reviewedPayloadDigest` it was approved against. If an item's payload digest
   later changes, that item must fail closed back to pending rather than
   remaining approved. A one-way stamp that survives content edits is not
   acceptable.
2. **The block-level attribution statement is unchanged.** The rendered block
   must continue to state that the material is a compilation of third-party
   reporting and is not the site physician's diagnosis, assessment, or
   recommendation. This is a Taiwan Physicians Act Article 25(4) control and is
   independent of review status.
3. **Source-tier labels stay visible and unchanged.** Approval must not
   visually promote `unverified-report`.
4. **No approval badge is rendered.** Per the owner's decision, the page drops
   the pending-signoff wording and presents the items plainly. The approval fact
   lives in the data and the governance record only, so that named-athlete
   medical statements do not appear to carry a visible physician endorsement.
5. No item text, source, tier, factDate, or ordering changes.

## Phase 0 — Frozen preconditions

Record HEAD, the clinical freeze aggregate, the 148-item composition, and the
current served manifest digest. Confirm a clean worktree, a positive
`plan:assert-authorized`, `npx tsc --noEmit` exit 0, and a fully passing
`npx vitest run`. Commit nothing.

## Phase 1 — Contract

Extend the follow-up review contract with an owner-approved state that carries
the approving decision reference and the exact approved payload digest, and
that fails closed when the digest no longer matches the item. Keep the pending
state valid so a future item can still start pending. Commit the contract and
its tests alone.

## Phase 2 — Data

Move all 148 items to the approved state, each bound to its own current payload
digest. No other field changes. Commit alone.

## Phase 3 — Presentation

Remove the pending-signoff heading, the pending digest disclosure wording, and
any pending-only branch that would now reject approved items. Render no
approval badge. Verify by DOM check that the attribution statement and all
three tier labels remain present. Commit alone.

## Phase 4 — Verification

`npx tsc --noEmit`, the full unit suite, Playwright, Prettier, the clinical
freeze, the review-artifact check, and a DOM check proving zero remaining
pending-signoff markers and an unchanged attribution statement.

## Phase 5 — Artifact chain and served verification

```
1. npm run review-set:generate   then commit alone
2. npm run build:review
3. npm run private:manifest      then commit alone
4. launchctl kickstart -k gui/501/tw.sportsmedicine.atlas.private-review.v1
```

The kickstart must follow the manifest-only commit; a dirty source state makes
the gateway reject the reload with `artifact-invalid`. Then run a read-only,
memory-only served smoke over every manifest path: credentialed GETs must
return 200 with matching length and SHA-256, credential-free GETs must return
401 with an empty body. Target `100.114.3.93:8140`; `127.0.0.1:8140` is
expected to return `000`.

## Phase 6 — Validation record

Produce `docs/reviews/2026-08-16-decision-20-p6-final-validation.md` recording
the per-phase commits, the approved-item count by tier and kind, proof that no
item text or source changed, proof that the attribution statement and tier
labels survive, the served smoke counts, and any gate that failed. Record
`private:verify` as not run and why.

## Rollback

Each phase is an isolated commit. Reverting Phases 1 to 3 restores the pending
state; re-running Phase 5 restores the served artifact. No content is edited in
any phase, so no content rollback is required.
