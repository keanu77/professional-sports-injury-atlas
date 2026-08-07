# NBA Injury Case Source Discovery — G2 Threshold Revision Plan

> This append-only revision supersedes the 2026-08-06 source-discovery plan for the remaining mechanical G2 manifest and authoring-handoff work. Completed discovery, live verification, root audit, and named source review remain immutable inputs.

## Scope and authority

- Execution role: `nba-injury-case-source-discovery`; execution scope ID: `nba-source-discovery-only`; required closed scope IDs: `medical-content-authoring`, `private-hosting`, `public-release`, `deployment`.
- Owner decision evidence: 吳易澄醫師, `2026-08-07T15:31:19Z`, exact parent-workspace bytes SHA-256 `e780b31a7024a471ae787cf8bbd3f8436c2850eea4a82b25027201ec5da5af88` from `.claude/g2-owner-decisions.md`.
- This revision changes only the launch G2 manifest/authoring-handoff count floor from 10 per injury and 30 total to 7 per injury and 26 total.
- The public/G5/G6 corpus floor remains 10 per injury and 30 total. No public-release selector, medical-review rule, rights rule, hosting rule, indexing rule, or deployment rule may change under this plan.
- The owner decision confirms `classicProposalCandidateIds=[]`, but does not explicitly change the separate launch requirement for at least one classic case. That gate remains fail-closed and requires a later explicit authorization before a zero-classic launch manifest may be generated.
- Do not rerun the live link verifier after the named source-review decision. All post-decision source checks are read-only.

## Frozen inputs

- Source-review commit: `3c512c9` (`research: record candidate source review`).
- Manifest ID: `NBA-SOURCE-2026-08-06-001`.
- Candidate-set digest: `c217953f242492a1e84291e40c592a5fa4824edcde0434733bccb41622add8e5`.
- Source-review decision path: `research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json`.
- Source-review decision digest: `cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c`.
- Source policy: `nba-v2`; JSON digest `6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07`; Markdown digest `b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570`.
- Source-verified counts: ACL 7, ankle sprain 12, Achilles rupture 7; total 26; recent 26; classic 0.

## Task A: Implement the authorized count-floor change

**Files:**

- Create: `src/lib/research/candidate-manifest.ts`
- Create: `tests/unit/research-manifest.test.ts`

1. Write failing tests that make the launch-only floor explicit:
   - 7 / 12 / 7 and total 26 passes;
   - one injury at 6 fails even when total is 26;
   - total 25 fails even when all three injuries meet 7;
   - totals above the floor pass;
   - quarterly and correction batches do not inherit the launch floor.
2. Define one shared pair of G2 constants in `candidate-manifest.ts`: 7 per injury and 26 total. The future generator and read-only checker must consume these constants rather than copy literals.
3. Keep the existing public-release 10 / 30 constants and their tests unchanged.
4. Run the new manifest unit test, the public release-gate unit test, plan binding verification, and `git diff --check`.

## Task B: Resume canonical manifest work only after the classic gate

The remaining Task 5 implementation still consists of the canonical manifest contract, deterministic generator, read-only checker/digest, append-only registry transaction, crash recovery, and exhaustive tests listed in the superseded plan. It must use the frozen `nba-v2` inputs above and the Task A count constants.

Before generating or registering `research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json`, re-evaluate the launch classic-presence gate. The frozen set contains zero classic entries. Without a new explicit owner decision changing that gate, stop and report this exact blocker; do not weaken or delete the classic test and do not create a partial authority manifest.

If a later decision authorizes a zero-classic G2 launch, create and bind another append-only plan revision before continuing Task 5. G5/G6 and public-release requirements remain unchanged.

## Task C: Case-authoring handoff after a valid Task 5 manifest

Only after Task 5 generates, validates, commits, and registers a canonical manifest may Task 6 create:

- `docs/reviews/nba-source-discovery-handoff.md`;
- an exact date-stamped `nba-injury-case-authoring` plan enumerating every registered entry, three injury overviews, the current-quarter baseline update, review-set work, and tests;
- a `not-authorized` binding for that new authoring plan.

Task 6 must not create case JSON, injury teaching content, medical claims, hosting configuration, a remote, a push, a deployment, or indexing authorization.

## Completion and stop conditions

- Task A is complete when 7 / 26 is implemented once, its tests and unchanged public 10 / 30 tests pass, the plan binding is green, and the work is committed.
- Task B completes only with a canonical, registered, validated launch manifest. Task C completes only with a durable handoff and an unauthorized, hash-bound authoring plan.
- Stop immediately at the retained classic-presence gate or any later request for medical authoring, hosting, public release, deployment, remote creation, push, or indexing authority.
