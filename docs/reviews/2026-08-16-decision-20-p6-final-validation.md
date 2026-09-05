# Decision 20 local validation — private host refresh pending

Validated on 2026-09-06. **Decision 20 is not complete on the served host.**
The independent ledger, presentation, local artifact chain and local verification
are complete; transfer to mini was rejected by automatic approval review before
any upload. No private-service reload or served smoke occurred this session.

## Result

All 148 previously approved follow-up items now render with their effective
`owner-approved` review metadata. There is no approval badge and no pending
marker on any of the 26 real case pages. The third-party attribution statement
is unchanged on all 26 pages. Unverified reports retain their visible
`unverified-report` tier and the statement that they are not confirmed.

The owner approval remains dated 2026-08-16. This session records the earlier
owner decision; it does not represent a new medical review on 2026-09-06.

| Composition          | Count |
| -------------------- | ----: |
| Cases                |    26 |
| Follow-up items      |   148 |
| Team/league official |    63 |
| Mainstream media     |    81 |
| Unverified reports   |     4 |
| Treatment            |    96 |
| Surgery              |    28 |
| Injection            |     0 |
| Actual return        |    24 |

No fact, wording, source, date, tier or order changed. All clinical content,
26 frozen sidecars, D18 research and receipts, and the original D20 plan and
authorization remain byte-identical to `7913428`. The new review ledger and
adoption receipt are outside every D18 receipt allowlist.

## Commits

| Commit    | Purpose                                                                       |
| --------- | ----------------------------------------------------------------------------- |
| `970f858` | Restore exact historical evidence on Studio; decode spaced file paths         |
| `abd0b55` | Independently verify net-content receipt checks using real Git history        |
| `1368281` | Add strict approval ledger projection and regression tests                    |
| `d87ae51` | Record the 148 approved payloads and adopt existing D18 receipts              |
| `8be420d` | Render effective review state and propagate its digest through consumers      |
| `c3798f8` | Preserve canonical evidence formatting; fix silent CLI guard on spaced paths  |
| `607fe0b` | Initial refreshed review set, superseded below after E2E configuration repair |
| `cdc4a5c` | Prevent E2E reuse of unrelated preview servers; support an isolated port      |
| `309a599` | Final review-set-only commit                                                  |
| `44c25e6` | Final private-manifest-only commit                                            |

## Validation

| Check                       | Actual result                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------- |
| Node                        | `v24.14.0` on Studio                                                                    |
| D20 authorization           | Exact bound active plan/decision accepted                                               |
| Plan binding                | 36 documents verified                                                                   |
| TypeScript                  | `tsc --noEmit` exit 0                                                                   |
| Full unit suite             | **1,289/1,289**, 76 files                                                               |
| Four-browser Playwright/Axe | **244/244**, Chromium, Firefox, WebKit, mobile Chromium                                 |
| Prettier                    | All matched files pass                                                                  |
| Content validation          | 26 cases, 3 overviews, 1 update; pass                                                   |
| Clinical freeze             | **30/30**, aggregate `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73` |
| Follow-up DOM               | 26 cases, 148 items, exact three-tier composition, 0 empty cases                        |
| Real-page approval DOM      | 148 approved metadata entries, **0 pending markers**, 26 exact attribution blocks       |
| Digest disclosure DOM       | 27 cases including fixture, 27 disclosures, 81 inputs, all initially closed             |
| Build                       | 42 pages, 822 optimized images                                                          |
| Review artifact             | 915 files; noindex, size guard, no sitemap/analytics/iframe/preconnect/nonlocal images  |
| Private runtime snapshot    | All **915** entries accepted by `loadPrivateReviewSnapshot` without opening a socket    |
| Public release gate         | Expected nonzero result: 24 closed-gate issues; no public build/release performed       |
| Served verification         | **Not run**; upload blocked before service mutation                                     |

The two pending fictional reports remain pending intentionally. They are not
part of the 148 real reports and exercise the future pending presentation.

Final review-set digest:
`c5eec4aacd9e0a293aae3644948378c26c94fa86bcc207b8a1c7db11749629bc`.

Final private-manifest digest:
`203cde6974e7f42239fc7fa481c4eef481a3a5187b4209d4dc0f553b6f2d56c6`.

Machine-readable evidence:
`docs/reviews/evidence/decision-20/final/local-validation.v1.json`.

## Failures resolved without changing medical evidence

- Initial unrestricted baseline: 1272/1278; four failures depended on a file in
  the old mini account, two treated spaces in the Studio path as `%20`. The
  original evidence still existed on mini and was copied read-only with its
  exact pinned hash. The archived fallback retains the original logical binding.
- Sandbox-only local socket failures disappeared when tests ran with local test
  sockets permitted. These were not application failures.
- Full formatting initially reported 31 old files. Canonical D18 receipts and
  research JSON are now excluded consistently with the existing canonical-file
  policy, preserving their frozen bytes. The old D19 validation record is also
  preserved; the handoff was formatted.
- The clinical-freeze CLI previously compared an encoded file URL to a raw
  pathname and silently did nothing in a path with spaces. `pathToFileURL` fixes
  that entrypoint and the actual 30-file check now runs.
- Initial E2E reported 152 failures/92 passes: missing Firefox/WebKit and reuse of
  an already-running old atlas on port 4321. Installed the locked browser
  versions, disabled unknown-server reuse, and reran all tests with
  `ATLAS_E2E_PORT=14321`. The existing 4321 process was not stopped or modified.

## Private host and remaining step

Read-only checks confirmed mini's Tailscale address is still `100.114.3.93` and
its clean checkout is still at `7913428`:
`/Users/ethanai/co-work/online_sportsinjury/professional-sports-injury-atlas`.
Node 24.14.0 remains installed. The launchd job has no running PID and reports
`LastExitStatus=256`; its recent log ends in `artifact-invalid`. This is a
pre-existing service state, not a successful D19 site observed this session.

Prepared locally, not transmitted:

- `/tmp/atlas-d20-20260906.bundle` — local Git history through the manifest commit.
- `/tmp/atlas-d20-dist-20260906.tar.gz` — approximately 134 MiB of private review output.
- `/tmp/atlas-d20-served-smoke.mjs` — memory-only credential handling; exact 200/body
  hash and 401/empty-body checks for every path, plus the 148-item served boundary.

Automatic approval review rejected `scp` of these three files to `mac-mini:/tmp/`.
Its stated reason: the current conversation lacks trusted user authorization
specifying the private medical/review payload and destination. It prohibited
bypassing the rejection. **No upload occurred.** Explicit user approval for this
payload/destination is needed before resuming transfer and the service reload.

After approval: recheck mini identity, clean checkout and ancestry; transfer the
bundle/output; fast-forward from the local bundle without creating a Git remote;
retain the old dist as a rollback copy and install the new one; verify the full
snapshot on mini; perform the already-planned one service reload; run the
read-only, memory-only 915-path served smoke. Record real results here.

`private:verify` was not run, consistent with D20's explicit deferral of its
known timeout/credential workflow issue. Lighthouse was not run and no new
performance claim is made. Decision 18 still lacks its historical closing
record; Decision 21 has not been started. Public release, indexing, Git remote
creation and push remain closed.
