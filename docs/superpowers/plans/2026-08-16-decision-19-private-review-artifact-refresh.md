# Decision 19 Private Review Artifact Refresh Plan

> Status: NOT AUTHORIZED. Owner Decision 19, communicated by 吳易澄醫師 on
> 2026-08-16, authorizes refreshing the private review artifact chain so the
> authenticated private review host serves the already-committed Decision 18
> content. Repository execution still requires a strict
> `PlanExecutionDecisionV1` bound to this plan's exact final path and SHA-256.
> This plan authors no medical content, changes no case facts, and makes no
> medical-review decision.

**Goal:** Regenerate the frozen review set, rebuild the review artifact,
regenerate the private manifest, and reload the private review service so the
private host serves the Decision 18 corpus (148 pending follow-up items across
26 cases and the single professional notes layer). Nothing about the content
itself changes.

**Why this plan exists separately:** Decision 18 closed
`hosting-service-mutation`, so its phases could not run `private:manifest`,
`launchctl`, or any served verification. Decision 18 committed its content and
research work but deliberately left the served artifact stale. This plan opens
exactly that one scope and nothing else.

## Scope and authority

- Execution role: `decision-19-private-review-artifact-refresh`; execution scope ID: `decision-19-private-review-artifact-refresh-only`; required closed scope IDs: `deployment`, `external-account-mutation`, `indexing`, `medical-content-authoring`, `medical-review-decision`, `public-release`, `remote-repository-mutation`.

`hosting-service-mutation` is the only scope opened relative to Decision 18,
and it is opened solely for the artifact chain and the single private-review
service reload described in Phase 3. It does not authorize changing the
listener, port, Tailscale binding, credential, or launchd configuration.

## Non-goals

- No case content, follow-up item, source, tier, or review status may change.
  Every follow-up item stays `pending-owner-signoff`.
- No cover image, registry, or source policy change.
- No clinical content change: the 30-file clinical freeze must remain
  byte-identical with aggregate
  `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.
- No public release, deployment, indexing, remote push, or external account
  mutation.
- `private:verify` is a known pre-existing failure unrelated to this plan
  (default `--credential-source tty` plus an unresolved `transport-failed`);
  Decision 16 transferred it to a dedicated future decision. This plan neither
  fixes nor depends on it.

## Preconditions

1. Node is exactly `v24.14.0` from the mise install path.
2. Worktree is clean and `npm run plan:assert-authorized` passes positively for
   this plan.
3. `npx vitest run` passes fully and `npx tsc --noEmit` exits 0 before any
   artifact regeneration.
4. All three Decision 18 batch receipts (`acl`, `ankle`, `achilles`) are
   present and the transitional corpus loader reports zero issues.

## Phase 0 — Frozen preconditions

Record the starting HEAD, the clinical freeze aggregate, the follow-up
composition (26 cases, 148 items, tiers 63/81/4, kinds 96/28/0/24), and the
currently served manifest digest. Commit nothing.

## Phase 1 — Review set

Run `npm run review-set:generate`, then commit the regenerated review set
alone. The review set must be regenerated before the review build, because the
build embeds it.

## Phase 2 — Review build and manifest

1. Run `npm run build:review`.
2. Run `npm run private:manifest`.
3. Commit the regenerated private manifest alone.

The manifest commit must be its own commit and must land before any service
reload; a dirty source state makes the fail-closed gateway reject the reload
with `artifact-invalid`.

## Phase 3 — Service reload and served verification

1. Run `launchctl kickstart -k gui/501/tw.sportsmedicine.atlas.private-review.v1`
   exactly once.
2. Confirm `launchctl list | grep private-review` shows second column `0`.
3. Run a read-only served smoke over every committed manifest path: every
   credentialed GET must return 200 with body length and SHA-256 matching the
   manifest, and every credential-free GET must return 401 with an empty body.
   The credential must be read into process memory only and must never appear
   in argv, environment, or output. No receipt or response body is written.
4. The service binds the Tailscale interface only, so the smoke must target
   `100.114.3.93:8140`; `127.0.0.1:8140` is expected to return `000`.

## Phase 4 — Validation record

Produce `docs/reviews/2026-08-16-decision-19-p4-final-validation.md` recording:

- the exact commits produced by Phases 1 and 2;
- the served smoke result as actual counts, not claims;
- the clinical freeze result and follow-up composition, proving the content is
  unchanged relative to Phase 0;
- confirmation that every follow-up item remains `pending-owner-signoff`;
- confirmation that nba.com citations remain non-navigable with zero link
  sinks;
- an explicit statement that `private:verify` was not run and why.

Any failed gate must be recorded as failed. A Lighthouse regression limited to
a single route and a margin of a few milliseconds is recorded as not achieved
and does not block closure, consistent with the Decision 17 owner decision.

## Rollback

Every phase is an isolated commit, so rollback is `git revert` of the Phase 1
and Phase 2 commits followed by one further `launchctl kickstart`. The served
artifact returns to the pre-Decision-19 manifest. No content, credential, or
service configuration is touched, so no other rollback is required.
