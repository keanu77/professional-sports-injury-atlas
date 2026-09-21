# Video Content Classification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development for implementation and separate spec / quality reviews. Steps use checkbox syntax for tracking.

**Goal:** Analyze the 200 existing videos and let visitors browse their actual content types from the homepage, combining type with search and all / curated / popular modes.

**Architecture:** An independent registry binds positive content labels to exact event slugs and video URLs. Shared helpers provide labels and category groups to homepage, cards, detail pages and static type routes. The existing discovery controller combines its search / ranking state with one optional content type; no video, clinical approval, or popularity API replacement.

**Tech Stack:** Astro 7, TypeScript, native browser DOM, Vitest, Playwright. Use the already installed pinned Node 24. No dependencies or migrations.

User approved the written spec on 2026-09-21. Keep the existing `feat/aaron-judge-rib` branch in this workspace per prior user direction; no new worktree. Root owns editorial data / release; one implementer owns feature code, then independent spec and quality review. No second execution approval is needed.

## Scope and authority

- Execution role: `video-type-classification`; execution scope ID: `video-type-classification-and-homepage-release`; required closed scope IDs: `external-account-mutation`, `hosting-configuration-mutation`, `indexing`, `medical-content-authoring`, `medical-review-decision`.

The user's exact approval is 「採用多標籤分類並照草案實作（建議）」, in response to the linked design. This opens the specified content-type registry, homepage/category implementation, tests and release through the existing deployment. It does not reopen clinical approvals, change source videos, or authorize unrelated hosting/account changes. The binding timestamps record this authorization in the repository; completion evidence is kept separately in `docs/reviews/2026-09-21-video-types/` so the bound plan remains immutable.

## Task 1: Content analysis and immutable video binding (root)

Files: `docs/reviews/2026-09-21-video-types/`, new `src/data/video-content-types.v1.json`.

- [x] Snapshot all 200 distinct event / original-video bindings from source `54af38c`.
- [x] Read all 200 existing observations and match prior visual records by exact video URL / ID. Exclude clinical-only records that do not identify the video.
- [ ] Resolve the 12 documented content ambiguities using original players or traceable prior visual evidence; record positive labels without inferring a precise tissue injury time. Reuse supported prior observations and clearly identify their original dates.
- [ ] Publish the registry with this exact shared input contract:

```ts
interface VideoContentEntry {
  slug: string;
  videoUrl: string;
  tags: string[];
  reviewedAt: string;
  evidenceRefs: string[];
  reviewNote: string;
  speakerRole?: string;
  segments?: { startSeconds: number; typeIds: string[]; note: string }[];
}
// JSON root: { schemaVersion: 1, entries: VideoContentEntry[] }
```

The allowed IDs are `injury-moment`, `immediate-aftermath`, `post-event-interview`, `news-report`, `expert-analysis`, `rehab-return`, `documentary-retrospective`, `match-record-commentary`. Chinese labels and boundaries are in the approved spec. Every final entry needs at least one supported tag and review evidence. Unknown additional types are omitted and limitations stay explicit. Do not infer content from title, HTTP status, thumbnails or media advancement.

## Task 2: Shared registry, browsing and discovery (implementer)

Create: `src/lib/videos/content-types.ts`, `src/components/atlas/VideoTypeNav.astro`, `src/components/atlas/VideoTypeTags.astro`, `src/pages/video-types/[type].astro` and focused tests.

Modify: `src/pages/index.astro`, `src/components/atlas/CaseCard.astro`, `src/components/atlas/ObservationCard.astro`, `src/pages/cases/[slug].astro` (or actual case route), `src/pages/videos/[slug].astro`, `src/scripts/video-discovery.ts`, `src/scripts/home-categories.ts`, relevant styles and tests. Follow the existing sport / situation route patterns.

- [ ] Read current group helpers, cards, routes and discovery tests. Write meaningful failing tests for exact binding, multitag grouping, count deduplication and stale registry rejection.

```ts
expect(contentTypesFor('drew-brees-2020-rib', 'https://www.youtube.com/watch?v=_jrPqJow81Q').map(t => t.id))
  .toEqual(expect.arrayContaining(['injury-moment', 'expert-analysis']));
expect(contentTypesFor('drew-brees-2020-rib', 'https://www.youtube.com/watch?v=wrong')).toEqual([]);
```

- [ ] Implement strict typed loading, canonical category metadata, `contentTypesFor(slug, videoUrl)` and group / count helpers consistent with existing sport helpers. The JSON registry is root-owned; do not change editorial tags to satisfy tests.
- [ ] Add eight static `/video-types/<type>/` category pages with core and observation cards, exact unique counts, existing consent behavior and readable no-JS output. Include routes in the existing public artifact route / link contract if necessary; do not relax route assertions.
- [ ] Add homepage type navigation and `data-content-types` on discovery list items. Show available type labels on both card kinds and detail pages. Detail pages show only known segment links / times from `segments`, retaining the current embed-consent boundary. Do not expose internal evidence filenames in the visitor flow.
- [ ] Update introductory text so 200 injury-related videos are not all described as injury instants. Keep editorial / clinical provenance distinct.
- [ ] Add optional type selection to discovery state and URL query `type`; combine it with the existing search query, all / curated / popular ordering and stale-fetch guards. Clear type and search independently; preserve top-10 overall rank labels when filtering popularity.

```ts
const selected = ordered.filter(card =>
  (!selectedType || card.dataset.contentTypes?.split(' ').includes(selectedType)) &&
  matchesVideoSearch(searchText.get(card)!, terms)
);
```

- [ ] Remove the hard-coded three-panel assumption in home categories by validating button / panel correspondence. Add `#video-types` reveal support; desktop, mobile, keyboard and no-JS behavior remain usable.
- [ ] Exercise real behavior: a mixed Brees clip is discoverable under both types, exactly once in either result; query + type + curated / popular compose; empty results are explained; late popular responses cannot change active mode or type. Include browser history / share URL behavior, invalid type and reset behavior.

Run focused tests with the installed Node 24 binary:

```sh
PATH=/private/tmp/atlas-judge-node.3pGBJs/node-v24.14.0-darwin-arm64/bin:$PATH npm run test:unit -- tests/unit/video-content-types.test.ts tests/unit/video-discovery.test.ts tests/unit/home-categories.test.ts
```

Use actual existing test filenames if discovery / categories tests differ. Expected: new behavior passes and existing privacy / ranking cases retain their assertions. No speculative broad refactor.

## Task 3: Independent spec then quality review

- [ ] Fresh spec reviewer reads actual changes against the approved design, verifies eight categories / 200 bindings / mixed-film behavior / static routes / search combinations / privacy. Fix and re-review discrepancies before quality review.
- [ ] Fresh quality reviewer checks typing, DOM state, escaping, data imports, asynchronous behavior, route permissions and meaningful regression coverage. Fix findings and re-review.
- [ ] Root independently checks the final editorial table and representative original-video segments. Generated counts are derived from final data, never manually asserted as fully watched counts.

## Task 4: Verification and release (root)

- [ ] Run changed-file Prettier, `npm run check`, `npm run content:check`, `npm run plan:verify` and all unit tests once integrated. Run the appropriate public build / artifact contract with the existing source, approval, clean-tree and seven-day playback gates intact.
- [ ] Use Desktop Chrome and Pixel 7 E2E plus targeted 320px / 390px, keyboard, no-JS and pre-consent no-iframe tests. Verify homepage and each of the eight static category pages and representative mixed clips. Any remaining blocking failure must be fixed before release.
- [ ] Rebind only allowed rendering-input digests according to the existing release workflow. Do not alter clinical approvals or legacy batch snapshots. Root handles commits and deployment using the existing Pages project / branch.
- [ ] Deploy the reviewed public artifact and verify actual production homepage, category counts / routes, 200 unique events, search / type composition and consent. Use actual HTTP / browser evidence; do not label local success as production success.
- [ ] Save final analysis, validation, deployment and production verification records in `docs/reviews/2026-09-21-video-types/`; report results and any real content-review limitation in Traditional Chinese.

Self-review: all approved design requirements are assigned above; implementation choices use the existing repository patterns and the root-owned data contract. The pending items describe concrete work and validation, not additional approval gates.
