# Decision 32 homepage introduction and totals Pass 2

Independent read-only static review of the three requested files and relevant selection/grouping helpers. No browser screenshots or runtime tests executed by this reviewer.

**Result: no blocking findings.**

| Check | Evidence | Result / confidence |
|---|---|---|
| Totals match displayed videos | `src/pages/index.astro:18`–23 uses permitted cases filtered by `hasPublicEmbed` plus `observationClips()`. The same `featured` and `clips` arrays render cards at lines 79 and 91. | Accepted, 0.99 |
| Removed / unselected videos excluded | `src/lib/videos/expansion.ts:227`–235 filters the two removed slugs before `observationClips()` returns its active list at 257. `src/lib/patient/featured.ts:7` rejects non-public or region-restricted embeds. Jeter research is absent from active batch 32. | Accepted, 0.99 |
| Counts represent nonempty categories | `videosByBodyPart` and `videosBySport` both filter `count > 0`; homepage `bodyParts.length` / `sports.length` use the exact arrays passed into both navigation components at lines 69 and 71. Empty taxonomy entries are not counted. | Accepted, 0.99 |
| Updates follow data and build | Numbers are derived in Astro frontmatter and rendered in HTML `dl` elements, not hardcoded counts or client-only DOM updates. A subsequent build recomputes totals from the selected data. | Accepted, 0.99 |
| Homepage introduction stays observational | `src/pages/index.astro:40`–41 describes visible event types and browsing purpose, without inferring a diagnosis or claiming an individual recovery timeline. Existing note at line 100 still separates player records from personal recovery. | Accepted, 0.98 |
| Semantic accessible presentation | One `dl` with three `dt`/`dd` pairs at lines 43–64; numbers are visible text and each has a unit. No image-only figures or hidden-only labels. | Accepted, 0.98 |
| Narrow layout has no obvious static overflow defect | Lines 146–176 use `repeat(3, minmax(0, 1fr))`, clamped number text, and wrapping flex units; no fixed pixel minimum widths or nowrap. Actual 320px/large-font visual check remains required by root; static review cannot establish rendered fit. | No static defect found, 0.90 |
| Production and JS-disabled verification | `verify-browser.mjs:294` compares all three displayed totals with receipt membership and still compares rendered cards; the JavaScript-disabled context also checks the video total at lines 350–355. Thus SSR count errors and production membership drift are observable. | Accepted, 0.99 |
| Existing review-mode E2E preserved | `e2e/patient-experience.spec.ts:8` retains the known five-card review fixture assertion; new lines 9–11 additionally compare its displayed total with visible cards. The production verifier separately covers expanded counts. | Accepted, 0.98 |

Rejected false positives: “five-card E2E proves production should have five videos” (confidence 0.0; this test targets the existing review fixture), “the counts need client JavaScript to stay current” (confidence 0.0; this is an Astro static site and data changes take effect on rebuild).

Current code does not claim real-time remote availability. Existing playback verification remains necessary before release; these totals count selected site entries.

## Reviewed file hashes

- `src/pages/index.astro`: `7212827d3b732c74662188deafd1c42e6606b8c2b1e7db0d8bc599404797a9ab`
- `scripts/public-launch/verify-browser.mjs`: `07d420c71581fb4c9dc9afbc00c39c3d25efde786b897d63f45cf7ecaf216430`
- `e2e/patient-experience.spec.ts`: `09acb0d5a5f20504c8a75f7d6933c31bb65fbd56db780722ddc9befce0622146`
