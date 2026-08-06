# NBA source discovery execution progress — 2026-08-06

This record tracks execution of the exact-byte authorized plan
`docs/superpowers/plans/2026-08-06-nba-injury-case-source-discovery.md`.
The bound plan remains byte-identical to SHA-256
`2de0b633d778f115007aa2682fb48b7592242c36fad688228aa0ebb664a07f20`.
Its inline step checkboxes cannot be edited without invalidating both the plan
binding and its durable authorization decision, so equivalent progress
checkboxes are maintained here.

## Preconditions

- [x] Bundled runtime placed first on `PATH`; `node --version` returned
      `v24.14.0`.
- [x] `git status --short` returned no output before execution.
- [x] `npm run plan:assert-authorized -- docs/superpowers/plans/2026-08-06-nba-injury-case-source-discovery.md`
      exited `0` for role `nba-injury-case-source-discovery` and scope
      `nba-source-discovery-only`.

## Task progress

- [x] Task 0 — strict research parsing and validation; committed as
      `667e7465a7fb424eb991e71bcfee5a96b0c59287`
- [x] Task 1 — frozen NBA source policy; committed by the local
      `docs: freeze NBA source policy` commit
- [ ] Task 2 — three candidate ledgers and discovery; stopped at the Browser
      verification blocker recorded in
      `docs/reviews/2026-08-06-nba-task-2-browser-verification-blocker.md`
- [ ] Task 3 — bounded live link and video metadata verification
- [ ] Task 4 — root audit and final review-set freeze
- [ ] Named content-owner source review received
- [ ] Task 5 — canonical authoring manifest
- [ ] Task 6 — case-authoring handoff

## Boundaries

- No remote, push, pull request, deployment, DNS change, account login, or
  external-account mutation.
- `course/`, `schemas/`, `tools/rtp_catalog/`, and `artifacts/rtp/` remain
  read-only.
- No media, screenshots, thumbnails, transcripts, or article bodies are stored.
- No person is inferred or inserted as a source reviewer, medical reviewer, or
  approver.
- Medical authoring, private hosting, public release, deployment, and indexing
  remain outside this execution scope.

## Verification log

### Task 0

- Expected red: `npm run test:unit -- tests/unit/research-candidates.test.ts`
  exited `1` because the research modules did not yet exist.
- Pinned dependency: `csv-parse` is exact version `7.0.2` in both
  `package.json` and `package-lock.json`. The first install encountered an
  existing root-owned user cache; retry with a task-specific cache under
  `/private/tmp` succeeded without changing cache permissions.
- Green: the exact unit command exited `0` with 28 tests passing, including a
  regression that preserves nullable syndicated-origin identifiers.
- Green: `npx tsc --noEmit`, scoped `prettier --check`, `git diff --check`, and
  a fresh plan authorization assertion each exited `0`.
- Expected pre-ledger CLI state: `research:check` is implemented but is not run
  as a positive gate until Task 2 creates the three required ledgers.

### Task 1

- Expected red: `npm run test:unit -- tests/unit/research-source-policy.test.ts`
  produced 14 failures and 1 pass because the policy JSON did not yet exist;
  the failures were the intended `ENOENT` contract-test state.
- The seven fixed official reference pages were each opened at their original
  URL on `2026-08-06`. The policy stores each canonical URL observation,
  publisher, and access date; search-result summaries were not accepted as
  evidence.
- Frozen Markdown SHA-256:
  `f983c682d3504902ff9ae8a57cbd414e4855de2abbb3b6f2855d3532df8fed46`.
- Frozen canonical JSON SHA-256:
  `a588b68f3468bec8d24cda9005435ecb0177cc74dbaff7d14f793ec45dcdd280`.
  The JSON declares the exact Markdown digest and is compact canonical JSON
  without a trailing newline. The narrow `.prettierignore` entry prevents a
  repository-wide formatting check from rewriting those frozen bytes.
- Green: the exact Task 1 unit command exited `0` with 17 tests passing. The
  combined Task 0 and Task 1 run exited `0` with 45 tests passing.
- Green: `npm run format:check`, `npx tsc --noEmit`, `npm run plan:verify`,
  `git diff --check`, and a final read-only policy audit each passed.
- No media was downloaded, copied, reproduced, or captured. No remote,
  external account, protected path, medical-review field, indexing field, or
  named reviewer/approver identity was changed.

### Task 2 — stopped

- Created the three exact-header-only candidate ledgers with `apply_patch`.
- Expected red: `npm run research:check` exited `1`; all ledgers parsed with
  zero rows and the only issues were the three expected `candidate-count-zero`
  diagnostics.
- The correct target-URL Browser availability check then failed three
  consecutive times with `No browser is available`; troubleshooting reported
  an empty browser list. No candidate row or discovery log was written.
- Execution stopped without replacing the required manual privacy-enhanced
  embed and caption checks with search summaries, HTTP extraction, oEmbed, or
  API metadata.

## Resolved execution blocker

The first Task 0 staging attempt in the prior execution environment failed
before changing the Git index:

```text
fatal: Unable to create '/Users/ethanai/co-work/online_sportsinjury/professional-sports-injury-atlas/.git/index.lock': Operation not permitted
```

That prior filesystem policy exposed `.git` read-only. The executor did not move
or replace `.git`, create an alternate repository, forge a commit, weaken a
check, or proceed to Task 1.

The repository owner subsequently created the required local conventional
commit `667e7465a7fb424eb991e71bcfee5a96b0c59287` with subject
`feat: validate NBA research candidates`. This execution resumed with `.git`
write access, a clean worktree, Node `v24.14.0`, and a fresh successful plan
authorization assertion.
