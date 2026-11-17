# Public media inventory and operational evidence

Implemented for T02/T03/T11 on the site-quality branch. These changes do not grant clinical approval, verify current playback, or prove that a source supports a medical statement.

## One current inventory

`scripts/lib/public-video-inventory.ts` loads the same approved core bindings and observation catalog used by public pages. `src/lib/videos/public-inventory.ts` combines event references, supplemental clip references, core citations, applicable safety sources, and further-reading articles per public page. It rejects missing event/video bindings and duplicate slugs or video URLs. The inventory count is dynamic.

The first local check produced 200 videos and 876 distinct source URLs, compared with 801 URLs in event reports alone. The new manifest includes page paths and reference roles. Global footer/social/navigation links are outside this clinical/media source inventory. A source being included is not semantic validation.

```sh
node --import tsx scripts/monitor-public-videos.ts --inventory
node scripts/public-launch/verify-expansion-playback.mjs --inventory
```

Both commands only write/list the worklist; they do not contact publishers or launch a browser. `assertPublicReferenceCoverage` is available to compare any rendered reference list with its page-specific monitor input. Focused tests cover previously omitted supplemental links, static safety links, new core citations, and a deliberately missing new source. Rendered-artifact checks remain an integration responsibility.

## HTTP health and persistent triage

```sh
node --import tsx scripts/monitor-public-videos.ts artifacts/public-video-health.v2.json
```

The source monitor retains separate HTTP, oEmbed markup and API capability results. HTTP 403/429/timeouts remain indeterminate. Actual playback is always `not-performed` in this artifact. The provenance identifies checkout SHA, dirty state, catalog digest, target origin and deployment SHA. If `/version.json` cannot be read, the deployment remains unknown. A dirty checkout cannot be reported as the same revision as production.

The CLI saves `public-video-health-ledger.v1.json` next to the health report. By default it reads that file on the next run; `--previous-ledger PATH` can supply a prior export. Entries retain first observation, first problem, last confirmed availability, status/reason streak, owner, due date, recovery and affected slugs. Unassigned owners stay `null`. Removed references are retired without claiming they recovered.

Default operational deadlines are three **calendar** days for confirmed failure and seven for indeterminate evidence. These are queue deadlines, not promises that publishers or staff will resolve a case. Editors assign actual owners and may adjust recorded due dates in their operational copy. Repeated unchanged checks do not emit a new change; restoration and changed conditions do.

The health workflow restores the latest retained ledger from the same branch and workflow, then uploads the next ledger even when HTTP verification is degraded. It uses read-only GitHub Actions artifact APIs and 90-day retention; the next run preserves cumulative entries. Missing/expired history is visible as `new-baseline`, never silent continuity. This is not indefinite archival storage. Access failure restoring an existing artifact fails the step rather than silently resetting the ledger. The workflow itself has not been dispatched by this implementation.

API contract: [GitHub Actions artifacts](https://docs.github.com/en/rest/actions/artifacts).

## Current playback receipts

The common playback runner now obtains every current entry from the shared inventory, including the later nerve/catalog batches and the governed MLB player. It keeps click-to-load checks, exact embed/video/timecode checks, actual time progression and required caption activation. It intercepts only the site's play-count POST to avoid polluting public popularity; media requests are unmodified. It saves after each attempt. `--resume` only reuses unambiguous, clean, same-origin/revision/catalog receipts within seven days. Historical refresh scripts and receipts remain untouched.

```sh
node scripts/public-launch/verify-expansion-playback.mjs OWNED_HTTPS_PREVIEW artifacts/playback-current.json --resume
```

This command requires the real browser/media environment. `--catalog-200`, `--nerve-four` and existing batch filters, or a single slug, can restrict a worklist. A receipt records the version actually read from the target; unknown or different versions do not satisfy the new selector.

`selectCurrentPlaybackEvidence(receipts, expectation, now)` in `src/lib/video/playback-evidence.ts` is a pure release helper. The expectation contains `videoUrl`, `path`, `origin`, `startSeconds`, `sourceCommit`, `catalogDigest`, and `captionRequired`. It requires exact bindings, clean source and target revision equality, an owned HTTPS origin, a current timestamp, time progression and any required CC proof. A newer failed matching attempt supersedes older success; conflicting receipts at the same timestamp fail. It does not rewrite or implicitly approve historic content. It is now wired into release through `scripts/public-launch/current-playback.ts`; see [the current playback procedure](current-playback.md). The initial authoritative registry is pending and blocks release until current evidence is complete.

## Local validation

- Focused unit tests cover source inventory, healthy/404/403/429/restored/retired ledger states, provenance mismatch and playback evidence rejection.
- Both inventory-only CLIs executed successfully with 200 entries, including MLB.
- Astro diagnostics at this stage: 426 files, zero errors/warnings, 17 existing hints.
- No full live HTTP sweep, browser playback, scheduled workflow dispatch, external notification, or clinical review is claimed here.
