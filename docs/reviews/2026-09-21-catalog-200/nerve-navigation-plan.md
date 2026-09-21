# Unified nerve navigation implementation plan

> For agentic workers: use subagent-driven-development, TDD and independent specification then quality review. This is an editorial UI adjustment, not a change to the bound authority ledger.

**Goal:** Place a single「神經損傷」entry inside「依受傷部位看影片」and remove the standalone homepage nerve-topic section.

**Authorization:** User:「神經損傷的影片放在『依受傷部位看影片』區域就好」and「『周邊神經損傷』『神經叢損傷』兩個可合併為一個神經損傷」.

**Architecture:** Merge discovery, not diagnoses. Add `/nerve-injuries/` listing the union of named-nerve clips once, retaining the existing anatomical locations and typed nerve metadata. Keep existing subtype URLs and case pages functional, with their return links updated to the combined navigation. The nerve entry is a supplemental link, not a new anatomical body part; homepage totals stay unchanged.

**Tech Stack:** Astro, TypeScript, Vitest, existing ObservationCard/MedicalNotice/BodyPartNav. Node 24.14.0.

**Workspace:** Current `feat/aaron-judge-rib` branch as explicitly requested; preserve existing work. No push/deploy, no playback evidence or release approval changes.

## Task 1: combined discovery and regression coverage

Files: `src/lib/videos/nerve-categories.ts`, `src/components/atlas/BodyPartNav.astro`, `src/pages/index.astro`, `src/pages/body-parts/[part].astro`, new `src/pages/nerve-injuries/[...index].astro`, existing `src/pages/nerve-injuries/[category].astro`; tests under `tests/unit/` and `e2e/nerve-four.spec.ts`.

- [ ] Add failing tests for a single combined group containing the four named-nerve clips exactly once, no unrelated clips, empty-input handling and preservation of the three-plus-one diagnostic subgroups. Use real catalog fixtures.

```ts
expect(nerveInjuryGroup(nerveFour.clips).count).toBe(4);
expect(nerveInjuryGroup([]).count).toBe(0);
expect(videosByNerveCategory(nerveFour.clips).map(g => g.count)).toEqual([3, 1]);
```

- [ ] Test that the homepage standalone section is absent, the shared body-part nav includes exactly one supplementary nerve link when its count is positive, and the new combined page renders the accepted clips with no eager embed.
- [ ] Run the new focused Vitest file and confirm failure from missing behavior before implementing.
- [ ] Implement a pure group helper filtering only recognized nerve category codes. Count the selected clips; do not add a diagnosis or duplicate records.

```ts
export function nerveInjuryGroup(clips: readonly ObservationClip[]) {
  const selected = clips.filter(clip =>
    NERVE_CATEGORIES.some(category => category.code === clip.nerveCategory));
  return { label: "神經損傷", clips: selected, count: selected.length };
}
```

- [ ] Extend BodyPartNav with optional `nerveCount` and `nerveCurrent` props (default 0/false) and render the supplemental item only when positive, reusing the existing pill styles and aria-current pattern.

```astro
{nerveCount > 0 && <li><a href="/nerve-injuries/" aria-current={nerveCurrent ? "page" : undefined}>神經損傷<span>{nerveCount} 支影片</span></a></li>}
```

- [ ] Pass counts computed from `observationClips()` on homepage and body-part pages. Remove standalone homepage section, imports and unused styles; do not change the body-part registry or overall counts.
- [ ] Add a combined page using the same launch gating and body-part navigation as anatomical pages, ObservationCard for every union member and MedicalNotice. State that grouping is for browsing and nerve/plexus diagnoses remain distinct. Preserve subtype URLs and change their back link to `/nerve-injuries/`; preserve case anatomy and medical copy.
- [ ] Use a rest route with `getStaticPaths()` returning `[{ params: { index: undefined }, props: ... }]` only when launch is enabled, otherwise `[]`. This generates exactly `/nerve-injuries/` without leaking an empty disabled-launch index or changing Astro configuration.
- [ ] Add E2E assertions for the homepage single entry, click-through to four cards, absence of standalone heading, body-part navigation consistency and intact subtype routes. No external video playback claims.
- [ ] Update the exact navigation assertion in `scripts/public-launch/verify-browser.mjs` to expect the supplemental nerve link when the release receipt contains the named-nerve clips. Preserve strict full-link equality; do not silently ignore extra links. No approval, evidence, or release-gate weakening is included.
- [ ] Re-run focused tests, existing nerve tests, Astro check and changed-file formatting. Run full unit tests and a local review build with `ATLAS_PUBLIC_LAUNCH=decision-21`. Review output must never be deployed publicly.
- [ ] Independently review specification compliance, then code quality, addressing all material findings.

## Verification commands

Use Node from `/private/tmp/atlas-judge-node.3pGBJs/node-v24.14.0-darwin-arm64/bin` prepended to PATH.

```sh
npm run test:unit -- tests/unit/nerve-navigation.test.ts tests/unit/nerve-four.test.ts
npm run check
npm run content:check
npm run plan:verify
npm run test:unit
ATLAS_PUBLIC_LAUNCH=decision-21 npm run build:review
```

Review generated HTML for one `/nerve-injuries/` link within homepage body-part nav, no nerve-topic section, four unique combined cards, preserved subtype routes, unchanged homepage counts and zero initial iframes. Static HTML checks are not browser interaction or actual embedded playback verification.

## Self-review

The request is only navigation consolidation. No new candidate videos, clinical claims, authorizations, player/network settings, public releases or body-part taxonomy changes are included. Diagnostic metadata remains separate; old URLs continue working.
