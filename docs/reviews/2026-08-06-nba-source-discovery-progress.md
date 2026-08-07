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
- [x] Task 2 — three candidate ledgers and discovery; completed after original-
      page Browser verification and external-lead gap intake
- [ ] Task 3 — offline bounded verifier/checker toolchain implemented and
      tested; owner-directed live execution and canonical artifact remain
      intentionally deferred
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

### Task 2 resume — 2026-08-07 stopped

- The Node, clean-worktree, and plan-authorization preconditions all passed.
- Three new correct target-URL Browser checks each returned
  `No browser is available`; the intervening troubleshooting check returned an
  empty backend list.
- The renewed stop is recorded in
  `docs/reviews/2026-08-07-nba-task-2-browser-verification-blocker.md`.
- No research agent was started, no candidate row was added, and all three
  ledgers remain exact-header-only.

### Task 2 resume — 2026-08-07 Browser available

- The bundled runtime was again placed first on `PATH`; `node --version`
  returned `v24.14.0`. The worktree was clean before execution and the exact
  plan authorization assertion exited `0`.
- The Browser target-URL path selected the Codex in-app Browser and opened
  `https://www.nba.com/news/nuggets-pj-dozier-suffers-torn-acl-in-left-knee`.
  The live page exposed the matching NBA.com article title, publisher context,
  event description, and publication date, so the Browser precondition passed.
- Three mutually exclusive researchers are opening original event, diagnosis,
  video, channel, privacy-enhanced embed, and caption surfaces for ACL,
  ankle-sprain, and Achilles candidates. Search snippets are leads only; failed
  original-video provenance or availability remains `needs-source` or
  `excluded`.
- While the three discovery paths were browsing, the root executor wrote the
  Task 3 pure mocked verifier tests. The intended red run failed because the
  verifier module did not exist; the bounded verifier/checker implementation
  was subsequently completed and expanded to 27 mocked tests.
- The live verifier has not run and no verification artifact has been
  published. It remains sequenced after complete Task 2 ledgers.

### Task 2 external-lead intake — 2026-08-07

- The owner-provided files under `.claude/external-leads/` were treated as a
  lead queue only. A ledger identity diff found 18 valid missing events: four
  ACL, thirteen ankle-sprain (including one diagnosis conflict), and one
  Achilles event.
- Every missing event was checked one-by-one on an opened original page in the
  in-app Browser. Date-only gaps were corroborated on opened NBA schedule or
  game pages. Search snippets and the external JSON itself were not accepted as
  evidence.
- Seventeen events were retained as `needs-source`; none had a supplied and
  Browser-verified original in-game event video. Trae Young's 2021-06-27 lead
  was retained as an `excluded` audit row with `diagnosis_status=conflicted`
  because the follow-up report visibly recorded the Hawks' MRI diagnosis as a
  right-foot bone bruise rather than a confirmed ankle sprain.
- Explicit non-game/wrong-injury exclusions were not appended: Dejounte Murray
  (Achilles rather than ACL), Fred VanVleet (offseason workout), Jamir Watkins
  (Summer League), Klay Thompson (offseason workout), and John Wall (fall at
  home).
- Final Task 2 counts are ACL 22 (21 recent, 1 classic, 4 `source-ready`, 18
  `needs-source`), ankle-sprain 28 (26 recent, 2 classic, 7 `source-ready`, 20
  `needs-source`, 1 `excluded`), and Achilles 18 (16 recent, 2 classic, all 18
  `needs-source`). Reviewed fields remain blank.
- The seven existing ankle `source-ready` rows now use the Browser-opened
  original event-video page for both video and event-source identity; the
  next-day diagnosis articles remain in diagnosis-source fields with their
  actual dates.
- `npm run research:check` exited `0` and printed an 11-candidate source-ready
  audit queue. No media, transcript, screenshot, thumbnail, or article body was
  downloaded or stored.

### Task 3 offline toolchain — 2026-08-07

- Added the bounded verification library, live verifier CLI, read-only exact-
  bijection checker, and mocked unit suite. The toolchain uses default
  concurrency 2 (hard maximum 3), a 15-second per-attempt deadline, and one
  combined maximum-three-attempt budget across page reachability and optional
  YouTube API corroboration.
- Requests use deterministic identification, manual bounded redirects, public-
  HTTPS lexical safeguards, canonical-URL drift detection, body cancellation,
  retry classification, and separate removed/temporary/mismatch outcomes. Page
  or article bodies are never serialized.
- When `YOUTUBE_API_KEY` is absent, the result is explicitly `not-obtained`
  without an embeddability inference or API request. When present, only the
  official `videos.list` endpoint with `snippet,contentDetails,status` is used;
  the key is never printed or serialized.
- Any existing root audit is strict-shape and accepted-set validated before the
  first request. The mutation CLI validates in memory, writes a bounded temp
  file, rereads and validates those exact bytes, then atomically replaces only
  `research/verification/nba-source-verification.v1.json`. A failed run retains
  the prior artifact.
- The checker is read-only and enforces exact accepted URL/source-kind/
  publisher/title/uploader/event identity coverage, freshness, root-audit
  binding, workflow-free accepted-set projection, policy and review-set
  digests, and durable decision identity for any `source-verified` row.
- The 27-test suite includes real mocked redirect handling, hard timeout even
  when fetch ignores abort, 404/410, exhausted retry, DNS classification,
  unsafe URL rejection, content mismatch, canonical drift, YouTube API states,
  independent artifact/result staleness, exact root-audit binding, review-set
  byte drift, and temp-directory script publication/read-only behavior. It
  makes no external request and leaves no repository verification artifact.
- Green: the scoped 27-test run and `npx tsc --noEmit`. The owner explicitly
  directed this execution to stop after the Task 3 toolchain, so
  `npm run research:verify-links` was not run and the canonical verification
  artifact was not created.

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
