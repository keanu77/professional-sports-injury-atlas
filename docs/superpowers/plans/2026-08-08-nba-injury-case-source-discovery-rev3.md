# NBA Injury Case Source Discovery — G2 Classic-Presence Revision Plan

> This append-only revision supersedes rev2 only for the remaining mechanical G2 manifest and authoring-handoff work. Completed discovery, live verification, root audit, named source review, and the authorized 7-per-injury / 26-total G2 count floor remain immutable inputs.

## Scope and authority

- Execution role: `nba-injury-case-source-discovery`; execution scope ID: `nba-source-discovery-only`; required closed scope IDs: `medical-content-authoring`, `private-hosting`, `public-release`, `deployment`.
- Owner decision evidence: 吳易澄醫師, `2026-08-07T16:31:45Z`, Decision 3 in parent-workspace `.claude/g2-owner-decisions.md`, exact current file bytes SHA-256 `087471636cfc040e7847a310bdafa019bced3e8f5c08df33e537dd7d444e5673`.
- This revision changes only the G2 launch classic-presence floor for manifest `NBA-SOURCE-2026-08-06-001` from 1 to 0.
- The authorized G2 count floor remains 7 per injury and 26 total. Recent entries must still outnumber classic entries, and every source, decision, digest, verification, audit, uniqueness, registry, durability, and non-medical condition remains unchanged.
- Other launch, quarterly, and correction batches receive no classic-presence exception from this revision. G4, G5, G6, public-release, medical-review, rights, hosting, deployment, and indexing gates remain unchanged.
- Classic cases may enter only through a later separately frozen and approved batch. This revision does not retrofit Kobe Bryant 2013, Derrick Rose 2012, Wesley Matthews 2015, or any other unverified classic into the frozen set.
- Do not rerun the live link verifier after the named source-review decision. All post-decision source checks are read-only.

## Frozen inputs

- Source-review commit: `3c512c9` (`research: record candidate source review`).
- G2 count-floor revision commit: `5c4be9c` (`feat(research): revise G2 launch thresholds`).
- Manifest ID: `NBA-SOURCE-2026-08-06-001`; batch type: `launch`; period: `2026-08-06`.
- Candidate-set digest: `c217953f242492a1e84291e40c592a5fa4824edcde0434733bccb41622add8e5`.
- Source-review decision path: `research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json`.
- Source-review decision digest: `cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c`.
- Source policy: `nba-v2`; JSON digest `6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07`; Markdown digest `b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570`.
- Source-verified counts: ACL 7, ankle sprain 12, Achilles rupture 7; total 26; recent 26; classic 0.
- The source-review decision's `classicProposalCandidateIds` is exactly `[]`.

## Task A: Implement the exact-batch classic-presence override

**Files:**

- Modify: `src/lib/research/candidate-manifest.ts`
- Modify: `tests/unit/research-manifest.test.ts`

1. Write failing tests proving:
   - exact launch manifest `NBA-SOURCE-2026-08-06-001` passes with zero classic entries;
   - another launch manifest with zero classic entries still fails at the default floor of one;
   - recent entries must still outnumber classic entries;
   - the existing 7-per-injury and 26-total G2 floors remain enforced;
   - quarterly and correction batches do not inherit launch composition gates.
2. Define the default launch classic floor and the exact manifest-ID override once in `candidate-manifest.ts`. The future generator and read-only checker must consume that shared validator; they must not copy or generalize the exception.
3. Keep public-release constants/tests and every G4/G5/G6 condition unchanged.
4. Run the focused manifest tests, public release-gate tests, plan binding verification, formatting, and `git diff --check` before a conventional commit.

## Task B: Complete Task 5 canonical authoring manifest

Implement the canonical manifest contract, deterministic generator, read-only checker/digest, append-only registry transaction, crash recovery, concurrency/durability protections, and exhaustive tests specified by Task 5 of the superseded 2026-08-06 plan, using the frozen `nba-v2` inputs and the shared rev2/rev3 G2 validators.

The canonical manifest contains only source-verified curation facts and source/audit/decision provenance. It must contain no medical review, medical authoring, general clinical analysis, public-rights approval, public-release status, or indexing authorization.

If the existing platform-era registry artifact contract cannot validate the richer Task 5 manifest, evolve it narrowly so both the immutable legacy fixture contract and the canonical registered research manifest remain fail-closed. Do not delete legacy coverage or weaken registry prefix, digest, identity, traversal, supersession, concurrency, recovery, or durability checks.

Run all Task 5 focused tests and commands, verify exact counts and zero classic entries for this manifest, then commit with `research: freeze NBA authoring manifest`.

## Task C: Complete Task 6 case-authoring handoff

Only after Task 5 is generated, registered, validated, and committed:

1. Create `docs/reviews/nba-source-discovery-handoff.md` with the exact durable evidence required by Task 6.
2. Run the full bounded gate under Node 24.14.0, including `npm ci`, research checkers, manifest/registry digest checks, `npm run verify`, and a separately expected-failing `npm run release:public` assertion.
3. Create an exact date-stamped `nba-injury-case-authoring` implementation plan from the registry-resolved manifest. Enumerate every real case path and source record plus the three overview, baseline, review-set, authoring/review, and test tasks, but create no case JSON and write no medical content.
4. Bind that new plan with role `nba-injury-case-authoring`, scope `nba-medical-content-authoring-only`, closed scopes `private-hosting`, `public-release`, and `deployment`, and status `not-authorized`.
5. Verify binding, commit with `docs: plan NBA case authoring`, and stop.

## Completion and stop conditions

- Task A completes only when the zero-classic exception is exact-batch scoped, other G2/public gates remain green and unchanged, the rev3 authorization chain is valid, and the work is committed.
- Task B completes only with a canonical, registered, validated launch manifest and a clean Task 5 commit.
- Task C completes only with a durable handoff and a real, hash-bound, explicitly unauthorized case-authoring plan.
- Stop at Task 6 completion or any need for new authority. Do not create a remote, push, author medical content, host, deploy, change DNS, release publicly, or enable indexing.
