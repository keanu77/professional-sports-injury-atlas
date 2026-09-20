# Four nerve videos: implementation and verification

Business date: 2026-09-21 Asia/Tokyo. Source/content check date: 2026-09-20 UTC (the execution clock was still September 20 UTC). Dates are not advance-dated to satisfy validation.

## Implemented

- Jaylon Smith, 2016: NFL Films documentary with incident replay, selected start 235 seconds. Peroneal nerve is named by the Cowboys; 2017-09-10 is NFL regular-season debut, not a nerve-healing date.
- Zack Kelly, 2023: MLB's 44-second incident clip. Only MLB's exact provided Streamable embed is admitted. May surgery is described as ulnar nerve transposition revision; official sources disagree on the exact operative day, so the timeline uses the month.
- Ryan Crouser, 2024: CITIUS MAG athlete interview, not injury footage. March elbow/ulnar nerve issue remains distinct from subsequent pectoral injury. No invented exact onset or return date.
- Rob Horne, 2018: Northampton Saints athlete interview. Brachial plexus avulsion has a separate category; retirement is not a completed return to sport.

Catalog totals: 151 observation pages + 7 core cases = 158 videos; YouTube-only playback statistics allowlist = 157 IDs. MLB does not emit YouTube playback events. Three local YouTube covers have recorded hashes; MLB uses a text facade without copied imagery.

## Checks actually run

- Test-first focused additions were initially RED; final focused run: 13 files / 115 tests passed.
- Full Vitest suite under Node 24.14.0 after the privacy correction: 1508 passed, 3 failed. All three failures are the existing Decision 18 dirty-worktree guard, reporting both the pre-existing `.claude/HANDOFF.md` and this implementation's uncommitted paths. This is NOT an all-green suite.
- `npm run check`: exit 0, 0 errors, 0 warnings, 16 existing hints.
- `npm run content:check`: blocked by the same dirty-worktree guard.
- `ATLAS_PUBLIC_LAUNCH=decision-21 npm run build:review`: blocked by the same guard while generating review routes. No complete static artifact was produced.
- Local Astro dev HTTP/HTML smoke: homepage, four cases, two nerve-category pages, and elbow category all returned HTTP 200. Homepage exposed 158 catalog cards; none of the eight responses contained an eager iframe. This does not verify client-side interaction or remote playback.
- New `e2e/nerve-four.spec.ts` covers source/timeline rendering, search, category counts, accessibility and consent-gated fixed MLB iframe. It is not yet executed against a completed static artifact. Its intercepted Streamable response is explicitly an integration fixture, never playback evidence.
- Independent specification/source review: passed after correcting the MLB E2E button selector. Code-quality review found one minor missing Streamable privacy disclosure; fixed with a RED/GREEN regression test and re-reviewed successfully. No unresolved review findings. The privacy page also passed local HTTP/HTML smoke.

## Release status and remaining work

Not committed, pushed, merged, or deployed. User-owned `.claude/HANDOFF.md` was not changed by this implementation. No new playback-proof JSON was created.

The connected browser became unavailable; discovery returned no available browser. Original-page checks from the prior research turn are not substituted for current owned-preview playback evidence. The seven-day owned-HTTPS playback release requirements remain unchanged, and a new optional proof-file loader fails closed while the new evidence file is absent.

To finish: resolve how to preserve/commit the user's existing HANDOFF change, commit reviewed implementation on the requested current branch, rerun the full suite and build, run E2E, restore browser connectivity, capture real owned-HTTPS preview playback, and follow the existing artifact preparation/release/deploy gates. Do not bypass dirty-tree, medical-content, input-digest, or playback checks.
