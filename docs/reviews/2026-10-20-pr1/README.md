# PR #1 follow-up — 2026-10-20

PR #1 is reconciled with main `167f29b` (merged PR #3). Implementation `11aaf8f` resolves the workflow conflict and uses the existing Contributor checks workflow for deterministic validation. It preserves the 13 citation repairs, the distinct-inode fixture, main's metadata race guard and its in-place-edit regression test.

## Current verification

[verification.json](./verification.json) records the checked commit, local results, source-diff scope, fresh HTTP diagnostics and hash of the full local health artifact.

- Node 24.14.0; 1,604 tests in 108 files pass.
- Type check: 411 files, 0 errors, 0 warnings, 16 hints.
- Plan/content/brand checks pass. Review build: 45 pages. Review artifact: 26 case pages, 962 files; validation passes.
- Changed code/workflows pass Prettier. `git diff --check` passes.
- Ten changed data files contain 34 source/citation-index differences and no other changes. All 13 superseded URLs are absent from active video JSON. Clinical narrative, dates, timeline text and video identities are unchanged.
- The [PR checks tab](https://github.com/keanu77/professional-sports-injury-atlas/pull/1/checks) is authoritative for final-head GitHub CI; local success is not substituted for its result.

## Fresh external-health result

Full run: `2026-10-19T18:24:35.189Z` (October 20 in Taipei), with the documented monitor identity and no API key supplied.

| Evidence                                           | Result           |
| -------------------------------------------------- | ---------------- |
| Source URLs                                        | 792 unique       |
| Available                                          | 660              |
| Confirmed unavailable                              | 0                |
| Indeterminate                                      | 132              |
| YouTube public metadata and matching iframe markup | 199/199          |
| MLB canonical page                                 | 1/1 available    |
| API embed flags                                    | Not checked      |
| Actual playback                                    | Not performed    |
| Monitor status / exit                              | `degraded` / `2` |

The 132 indeterminate sources include 92 access-denied responses, 18 challenges, 13 timeouts, 5 network errors, 3 server errors and 1 other HTTP error. They are not counted as available or silently discarded.

Eleven of the 13 repair destinations returned HTTP 200. Both Arsenal match reports remained indeterminate: the full run returned HTTP 500 for Mead and timed out for Bellerín; a separate concurrency-1 follow-up at `2026-10-19T18:25:22.459Z` returned HTTP 500 for both after the normal transient retry. Their October 10 editorial/HTTP evidence remains historical, not a claim of current availability. A server error does not justify inventing a replacement citation. Keep the original publisher links and recheck them later.

No article claims were changed or freshly approved here. The earlier editorial review, including Elliott's closed-door milestone and Nishikori's AP citation-index repair, is retained under `../2026-10-10-source-video-health/`.

## CI boundary and retained limitations

The duplicate broad `checks` job added by the original PR is removed in favor of main's existing `Contributor checks`. Plan, content and brand checks are added there alongside the full unit suite, type check, build and artifact validation. The live monitor remains weekly/manual, matching main's operational workflow; schema-v2 artifact upload runs even after failure. Exit codes and health classification are unchanged. There is no `continue-on-error` or success coercion.

The October 10 coverage/formatting baseline findings are not claimed as fixed. This follow-up does not lower coverage thresholds, reformat historical evidence, or claim a successful `npm run verify`, E2E or Lighthouse run. Those broader checks remain available separately; PR checks verify contribution correctness, not production release approval.

No merge, production deployment, API-key creation or approval rewrite was performed. Source changes still require the normal fresh release evidence before deployment.
