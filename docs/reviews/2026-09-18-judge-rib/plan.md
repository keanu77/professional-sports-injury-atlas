# Aaron Judge Rib Case Implementation Plan

**Goal:** Add the requested independently sourced rib-injury observation page.

**Architecture:** Reuse the current observation page and add a dated clip/event batch. Keep reported onset dates distinct from confirmed dates when showing return intervals.

**Tech Stack:** Astro, TypeScript, JSON, Vitest, existing YouTube player.

- [x] Add `src/data/videos/judge-rib.v1.json` and `event-judge-rib.v1.json` with one matched event, dated citations, and research limitations.
- [x] Register the batch in `expansion.ts`, `event-updates.ts`, `public-video-ids.ts`, and thumbnail validation; add the original YouTube cover and its SHA-256 provenance.
- [x] Add discovery and related-reading entries; provide rib-specific care on the new page, citing NHS.
- [x] Suppress inferred recovery intervals for reported onset dates, preserving confirmed-date behavior.
- [x] Update catalog-size assertions to 151 videos / 144 observations. Test duplicate rejection, event binding, date uncertainty, and search coverage.
- [x] Run Prettier on changed files, Astro check, content check, unit suite, thumbnail/brand verification, and a local build with observation pages enabled.
- [x] Inspect the local page and search, verify actual YouTube playback, and record results and deployment status.
