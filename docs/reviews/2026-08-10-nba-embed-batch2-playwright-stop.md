# NBA embed batch 2 — Playwright browser review and stop record

- Date: 2026-08-10
- Browser region: local Taiwan egress (`Asia/Taipei`, `zh-TW`)
- Runtime: Node 24.14.0; Playwright 1.62.1; headful Chromium
- Scope: `youtube-nocookie.com` playback and caption-control verification only

## Preconditions

- The worktree was clean before verification.
- `npm run plan:verify` passed.
- `npm run plan:assert-authorized -- docs/superpowers/plans/2026-08-08-nba-injury-case-authoring.md` passed under Node 24.14.0.
- The external lead package supplied `playerMicroformatRenderer.availableCountries`, oEmbed uploader, and upload-date findings. Those findings were treated as leads; they did not substitute for browser playback or caption evidence.

## Method

A one-time Playwright script served an ephemeral localhost wrapper and loaded each exact privacy-enhanced URL in an iframe with a real localhost Referer. It required all of the following before a video could pass:

1. no playback before user interaction;
2. the player API's current video ID matched the requested ID;
3. a real pointer action started the target video and its current time advanced by at least one second outside an ad;
4. the captions/subtitles control was visible and enabled, and its `aria-pressed` state could be toggled and returned to enabled;
5. no player error was visible.

No screenshot, trace, recording, thumbnail, transcript, caption text, video, or audio was captured or stored. Each failure was retried once at low concurrency. The temporary script was removed after the run.

## Results

| Candidate                                                  | Video         | Playback evidence                                                                                                          | Caption evidence                                                                          | Result                                                |
| ---------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `CAND-NBA-ANKLE-2023-004` — Anfernee Simons                | `8TIJGIRP634` | PASS at `2026-08-10T10:55:07Z`; target ID matched; no autoplay; 85.521 s; 640×360; advanced 0.158147 → 1.187259 s          | PASS; visible control toggled `true → false → true`                                       | Eligible for a future source correction; not applied  |
| `CAND-NBA-ACHILLES-2025-016` — Jayson Tatum                | `xSUKd03LJwE` | PASS at `2026-08-10T10:56:27Z`; target ID matched; 21.181 s; 576×1024 portrait; readyState 4; playing at 2.163778 s        | FAIL; visible control was disabled and labeled `No captions are available for this video` | Keep external-link-only                               |
| `CAND-NBA-ANKLE-2025-002` — LaMelo Ball                    | `zZdndTqOexc` | PASS at `2026-08-10T10:57:32Z`; target ID matched; no autoplay; 46.221 s; 360×640 portrait; advanced 0.042585 → 1.072445 s | PASS; visible control toggled `true → false → true`                                       | Eligible for a future source correction; not applied  |
| `CAND-NBA-ACHILLES-2025-017` — Tyrese Haliburton primary   | `azQpbyDBktk` | PASS at `2026-08-10T10:58:41Z`; target ID matched; 51.561 s; 360×640 portrait; readyState 4; playing at 2.087709 s         | FAIL; visible control was disabled and labeled `No captions are available for this video` | Keep external-link-only                               |
| `CAND-NBA-ACHILLES-2025-017` — Tyrese Haliburton alternate | `JNoDsgkZUbc` | PASS at `2026-08-10T11:00:23Z`; target ID matched; 29.721 s; 360×640 portrait; readyState 4; playing at 2.285163 s         | FAIL; visible control was disabled and labeled `No captions are available for this video` | Rejected as primary; keep the case external-link-only |

The browser evidence supports two, not four, possible upgrades. The current site remains at 4/26 embedded cases. If the two passing source corrections later clear every governance and review gate, the expected count would become 6/26.

The native dimensions also show that `zZdndTqOexc` is portrait. Any later implementation must add portrait handling for both that video and Tatum's `xSUKd03LJwE`; neither may be stretched.

## Stop conditions

No ledger, verification artifact, root audit, correction manifest, registry entry, case JSON, review set, review build, or private-dist manifest was changed.

The run stops here for three independent fail-closed reasons:

1. Tatum and both Haliburton choices lack an enabled caption control. The current player contract does not allow an in-site public embed when captions are unavailable.
2. The active source-discovery and authoring plans freeze the completed launch artifacts and require later corrections to use a separately authorized, append-only correction plan. The external lead document is not a bound repository plan and cannot satisfy `plan:assert-authorized`.
3. Simons and LaMelo are already medically approved. Replacing their primary video changes `computeCaseContentDigest()` because the digest covers source binding, provider, canonical/fallback URLs, uploader, duration/window/segments, and video-original source facts. Leaving `review.reviewedContentDigest` untouched would make both approvals stale and prevents a valid refreshed review set or private-dist manifest. Updating that field is explicitly outside this task's boundary.

Continuing requires a new repository-bound correction plan and decision, then an exact owner-reviewed correction snapshot. Applying the two passing videos through the review build also requires explicit authority to resolve the affected medical-review digests; it must not be inferred from source playability.
