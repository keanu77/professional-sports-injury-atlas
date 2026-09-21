# Catalog UX implementation plan

> **For agentic workers:** Use subagent-driven-development for an isolated presentation task and separate specification/quality review. Root owns discovery integration, tests and release.

**Goal:** Apply the approved UI audit improvements while keeping social-follow links at the front.

**Architecture:** Reuse existing admitted video groups, extract shared filter markup/styles, extend the existing discovery controller with composable filters and pagination, and use it in homepage and static type routes. Keep all cards in static output; progressively enhance with JavaScript.

**Tech Stack:** Astro, TypeScript, Vitest, Playwright, installed Node 24. No dependency changes. Retain existing workspace and feature branch per user preference.

## Scope and authority

- Execution role: `catalog-ux`; execution scope ID: `catalog-ux-and-homepage-release`; required closed scope IDs: `external-account-mutation`, `hosting-configuration-mutation`, `indexing`, `medical-content-authoring`, `medical-review-decision`.

The user's exact authorization is 「社群追蹤入口一樣在前面，其他依你的建議去修改」. This approves the previous live-audit recommendations except moving social links. It authorizes implementation, tests and updating the existing site. No repeat design approval is required. Completion evidence is stored separately so bound documents remain immutable.

## Task 1: Presentation (isolated implementer)

- [ ] Update `ObservationCard.astro`, `CaseCard.astro`, `VideoTypeTags.astro`, `VideoTypeNav.astro`, and video detail segment labels. Name-first titles use one font; metadata stays source-backed; no clinical-data edits.
- [ ] Replace the false CTA with `<a href={`/videos/${clip.slug}/`}>查看影片與解析 →</a>` and retain legacy content descriptions where needed for honest existing labels.
- [ ] Use 14px tags and minimum 44px touch targets; explain category count overlap; rename playback start and label outbound segment destinations. Run scoped formatting and relevant tests.

## Task 2: Discovery and layout (root)

- [ ] Extract shared controls/styles; put the homepage search immediately after the social-follow/introduction and before the existing category panels. Make mobile category buttons a 2×2 grid. Preserve desktop and no-JS category links.
- [ ] Use `videosBySport` and `videosByBodyPart` to bind card membership rather than infer anatomy from free text. Apply conjunction of keyword/type/sport/body filters before `selected.slice(0, visibleLimit)` where the initial limit is 24. Provide matching/display counts, load-more and filter-return controls.
- [ ] Persist `q`, `type`, `sport`, `body`, `mode` in URL; initialize and restore through validated options. Input uses replaceState; explicit filters use pushState. Restore popular state through the existing async selector; discard stale responses. Reset page size on changed filters, preserve accessible focus on load-more completion.
- [ ] Reuse discovery on all eight type routes, keeping route membership fixed and static cards present. Collapse alternate-category navigation into an accessible details element.

## Task 3: Verification and independent review

- [ ] Add browser assertions for front social links/search order, mobile selectors, 24/48 pagination, full-catalog search, share/history, compounded filters, category narrowing, clickable CTA and consent. Update old visibility assertions to new pagination semantics while retaining full static coverage checks.
- [ ] Run `npm run check`, `npm run content:check`, `npm run test:unit`, `npm run plan:verify` using pinned Node 24. Run Desktop Chrome/Pixel 7 browser regression against the public artifact and targeted 320/390px checks.
- [ ] Obtain separate spec review then quality review of final code; resolve actual findings before release.

## Task 4: Release

- [ ] Keep original source, clinical and playback release gates; update only the approved rendering input digest. Commit reviewed code, run `npm run release:public`, test the exact build, push and deploy to existing Pages project.
- [ ] Verify production HTML hashes and browser filters, then record source commit, deployment, tests and limitations under `docs/reviews/2026-09-21-catalog-ux/` and update handoff. No new analytics claims or medical approvals.

Self-review: all nine audit themes including typography/touch targets are assigned; the explicit social-front exception is preserved; no medical or external-account scope is reopened.
