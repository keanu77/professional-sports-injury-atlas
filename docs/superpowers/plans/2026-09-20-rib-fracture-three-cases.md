# Rib Fracture Three Cases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add three independently sourced observation pages for Alonso 2016, Brees 2020 and Tua 2021.

**Architecture:** Reuse the observation clip/event loaders and existing page components. A bounded three-case batch owns its data; existing discovery, public IDs and thumbnail registries admit those exact IDs. Add one automobile-racing category and share existing rib safety guidance without changing search scope or curated ranks.

**Tech Stack:** Astro 7, TypeScript, Zod, Vitest, Playwright, Node 24.14.

---

Execution choice is already approved: main agent implements in the current feature branch, Sol verifies sources read-only. The user explicitly chose the current project branch over a worktree. Preserve `.claude/HANDOFF.md`; do not stage it. No additional plan approval is needed.

## Task 1: Evidence and red tests

**Files:** create `tests/unit/rib-fracture-three.test.ts`, `e2e/rib-fracture-three.spec.ts`; create `docs/reviews/2026-09-20-rib-fracture/README.md` for verified findings.

- [x] Sol opens original F1/NFL/team sources and identifies injury and actual return milestones. Main independently opens cited sources and NHS guidance; do not use model agreement as evidence.
- [x] Add table-driven integration tests using existing exports before adding data:

```ts
const selections = [
  ["fernando-alonso-2016-rib", "x45fLUTHCuk", "injury-motion", "automobile-racing"],
  ["drew-brees-2020-rib", "_jrPqJow81Q", "news-analysis", "american-football"],
  ["tua-tagovailoa-2021-rib", "JckTrmIPRK8", "news-analysis", "american-football"],
] as const;
it.each(selections)("integrates %s", (slug, id, kind, sport) => {
  const clip = allObservationClips.find(c => c.slug === slug);
  expect(clip).toBeDefined();
  expect(clip!.videoId).toBe(id);
  expect(clip!.footageKind).toBe(kind);
  expect(publicVideoIds.has(id)).toBe(true);
  expect(observationVideoSearchText(clip!)).toContain("rib fracture");
  expect(observationCategoryLinks(clip!).map(x => x.href)).toContain(`/sports/${sport}/`);
});
```

- [x] Add assertions for exactly 147 observation clips / 154 events, Tua's two distinct events, nonempty source-indexed timelines, and Brees's uncertain onset not yielding recovery days. Add a negative schema test for wrong/reused IDs and invalid segment starts after the new export exists.
- [x] Run `npm run test:unit -- tests/unit/rib-fracture-three.test.ts`; require expected assertion failures for absent cases, not syntax/import errors.
- [x] E2E uses `/videos/<slug>/`, `[data-footage-kind]`, `[data-video-embed]`, `[data-recovery-timeline]`, `[data-rib-injury-care]`; searches each name plus `rib fracture` and tests Tua's rib/concussion separation. Do not load remote iframe until user activation.

## Task 2: Minimal data integration

**Create:** `src/data/videos/rib-fracture-three.v1.json`, `src/data/videos/event-rib-fracture-three.v1.json`.
**Modify:** `src/lib/videos/expansion.ts`, `event-updates.ts`, `public-video-ids.ts`, `sports.ts`; `src/data/videos/discovery.v1.json`, `observation-resources.v1.json`; `src/pages/videos/[slug].astro`.

- [x] Build the three clip records with the existing `observationClipSchema` fields: exact slug/ID, athlete, Chinese sport/event/body part, Chinese observation containing `rib fracture`, explicit footage kind, sourced event/return dates, canonical URL, publisher/title, unverified caption flag, observed duration/start and source URLs. The decision is `rib-fracture-three-2026-09-20`; authorization quote is `規格確認，開始實作`.
- [x] Event records use the same exact slug/URL/eventDate binding; include sourced mechanism summary, ordered steps, independently sourced general explanation, individual limitations, chronological milestones and indexed sources. Brees uses `eventDateCertainty: "reported"` when a selected match date cannot establish onset of every fracture. Never fill unverified dates with estimates.
- [x] Import `ribFractureData` in expansion; define strict three-entry batch schema, reject IDs/slugs/event keys already used, validate canonical ID and start less than duration; export `ribFractureThree` and append its clips once to `allObservationClips`.
- [x] Parse the event batch with `eventUpdateEntryInputSchema`, length 3 and exact decision; append to `normalizeEventUpdateBatches` so existing full source/date validation applies.
- [x] Add the batch to the shared public ID input. Add `{ code: "automobile-racing", label: "賽車" }` to `SPORTS`.
- [x] Add explicit discovery entries without `curatedRank`. Use collision for observed accident/contact footage; early analyses may remain unclear when no exact mechanism is supportable.
- [x] Add each resource entry with `resources: ["overview"]` and a note that general resources do not determine individual return time.
- [x] Extend the rib-guidance branch to include the three admitted slugs; keep the Judge-specific first-rib caveat for Judge, and show a general individualized-care caveat for the new traumatic cases.
- [x] Re-run focused unit tests and existing Judge tests; require all pass.

## Task 3: Covers, inventory and playback

**Modify:** `scripts/verify-video-thumbnails.ts`, `src/assets/videos/provenance.json`, `tests/unit/video-thumbnails.test.ts`, inventory-count tests, `scripts/public-launch/check-release.ts`.
**Create:** three exact YouTube default JPEG covers and actual playback evidence under `docs/reviews/2026-09-20-rib-fracture/`.

- [x] Fetch only each selected video's `https://i.ytimg.com/vi/<id>/hqdefault.jpg`; record SHA-256, capture time and exact path. Do not download complete videos.
- [x] Add the batch to thumbnail expected inventory and test fixtures. Adjust current inventory assertions from 144 to 147 and 151 to 154 only where assertions represent current live input counts, not historical evidence.
- [x] Add an optional new proof-file input to the release checker; missing proof remains fail-closed for the three new videos. Keep origin, age, time advancement and playing-state requirements unchanged.
- [x] Use the approved Browser interface for real player checks; collect duration and observed state. oEmbed alone is insufficient. Record failures without replacing clips or changing restrictions.

## Task 4: Verification and handoff

- [x] Use `PATH=/private/tmp/atlas-judge-node.3pGBJs/node-v24.14.0-darwin-arm64/bin:$PATH` only after confirming Node reports v24.14.0.
- [x] Run Prettier on changed files only, `npm run check`, `npm run content:check`, `npm run test:unit`, and `npm run brand:verify`; report pre-existing warnings separately.
- [x] Build with `ATLAS_PUBLIC_LAUNCH=decision-21 npm run build:review` to include admitted observation pages without claiming a production release.
- [x] Run the new E2E suite plus Judge/search/observation suites on the built artifact in desktop Chrome and Pixel 7. Require 154 discoverable cards and 147 observation pages; new sport route must exist.
- [x] Record fresh outcomes and limitations, review diff for unintended edits and preserved handoff, then commit scoped implementation files only. No push/deploy is implied by a test build; production still requires the existing owned-HTTPS playback and release checks.
- [x] Report local completion separately from production status; if release gates require further authority or an external action, state the exact remaining requirement instead of claiming online completion.

## Plan self-review

All spec requirements map to tasks above: sourced content and uncertainty (1–2), search/category integration (2), assets and playback (3), desktop/mobile regression and honest release status (4). Existing clinical approval ledgers and historical source records remain untouched. Sol is a read-only research reviewer, not an implementation delegate.

## Execution outcome

Implementation and local checks completed on the selected branch. All 1502 unit tests passed in a clean validation clone, with content/brand checks and a 227-page review build. Desktop/mobile regression checks passed (36 launch-enabled checks plus 2 separately executed noindex checks). See `docs/reviews/2026-09-20-rib-fracture/README.md` for playback limitations: Alonso failed local embedding twice, and owned-HTTPS playback proof remains pending for all three. No push, merge or deploy was performed; this is not release approval.
