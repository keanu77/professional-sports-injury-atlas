# Catalog 200: first-batch implementation plan

> For agentic workers: use subagent-driven-development for isolated implementation and two-stage review. Keep this editorial plan under docs/reviews, following the rib and nerve batches; do not modify the platform's bound authority-document ledger.

**Goal:** Extend the existing 158-event local catalog toward 200, adding only sourced, distinct non-Taiwan events with accurately classified footage and passing the existing playback release requirements.

**Architecture:** Preserve observation pages and the seven core clinical cases. Research candidates remain outside production imports until metadata and footage can be verified. Reuse existing sports, anatomical browsing, source timelines, consent-gated embeds, and release contracts. First fix the approved missing-footage fallback; do not redesign the site.

**Tech stack:** Astro, TypeScript, existing Zod schemas, Vitest, browser-client, Node 24.14.0.

**Workspace:** User explicitly requested the current project branch, preserving existing changes; no worktree is created. Local commits may checkpoint reviewed work; no push or deployment before release gates pass.

## Task 1: truthful fallback label

Files: modify `src/lib/videos/observation-card.ts`; create `tests/unit/observation-footage-label.test.ts`.

- [ ] Add a failing test for undefined footage metadata:

```ts
import { describe, expect, it } from "vitest";
import { observationFootageLabel } from "../../src/lib/videos/observation-card";

describe("observation footage labels", () => {
  it("does not infer injury footage from missing metadata", () => {
    expect(observationFootageLabel({})).toBe("傷害相關影片（片型待核）");
  });
  it.each([
    ["injury-motion", "受傷動作觀察"],
    ["aftermath", "受傷後處理與續賽"],
    ["news-analysis", "傷勢新聞與說明"],
    ["athlete-interview", "選手訪談與傷勢說明"],
  ] as const)("keeps the verified %s label", (footageKind, label) => {
    expect(observationFootageLabel({ footageKind })).toBe(label);
  });
});
```

- [ ] Run `node node_modules/vitest/vitest.mjs run tests/unit/observation-footage-label.test.ts` under Node 24.14.0; confirm exactly the missing-value assertion fails.
- [ ] Replace the final ternary fallback with:

```ts
      : clip.footageKind === "aftermath"
        ? "受傷後處理與續賽"
        : clip.footageKind === "injury-motion"
          ? "受傷動作觀察"
          : "傷害相關影片（片型待核）";
```

- [ ] Repeat the focused test, then existing observation/nerve/rib tests. No bulk rewriting of the 113 unknown classifications.
- [ ] Independent specification review, then independent code-quality review; fix material findings.

## Task 2: first-batch research packet

Files: research records in `docs/reviews/2026-09-21-catalog-200/` only. Do not import them in `src` or count them on the homepage.

- [ ] Research up to 14 first-batch events from absent or sparse sports and upper-limb/overuse injuries. Check against `catalog-audit.json` and local event data for duplication. At least one exact first-party injury source and a rights-holder/original-interview video lead per publishable candidate. Candidates without both remain pending or rejected.
- [ ] Each research record must preserve athlete/event identity, sport, country/source provenance, injury wording supported by the source, exact source/video URL, actual verification level, missing checks and reason for prioritization. No invented dates, duration, timecodes, grade, recovery interval or playback.
- [ ] Exclude Taiwanese athletes and Taiwan-origin videos from new candidates. Gym-training injuries must be labeled training, not claimed to be sport-specific competition mechanisms. Different years and chronic/pre-existing issues stay separate.
- [ ] Verify source text through primary pages and video metadata where accessible. Search snippets and oEmbed success cannot become playback evidence. Preserve failures and alternatives.

## Task 3: playback and integration dependency

- [ ] Recheck existing browser binding. If disconnected, use documented read-only troubleshooting. An empty browser list blocks real playback; do not fabricate evidence or automate the browser through forbidden fallback tools.
- [ ] Verify the existing four nerve videos first on owned HTTPS preview. Preserve the existing seven-day evidence window and exact clip identity/origin checks.
- [ ] Only after candidate footage/timecodes/duration and sources are verified, define the exact first-batch selections and author a test-first data-integration subplan with complete selected data. This is a research dependency, not permission to fill production data with placeholders.
- [ ] Integrate only accepted selections into a dedicated observation batch and event-update batch, sports/categories, search, playback ID allowlist and release evidence loader. Add no empty sports categories. Test uniqueness, source binding, explicit footage type, category/search routing and consent boundaries.
- [ ] Run fresh full unit tests, Astro check, content check, build and targeted desktop/mobile integration tests. Record all failures, including pre-existing issues; do not weaken governance checks.
- [ ] Release only after genuine owned-HTTPS playback, source/approval/input-digest checks and artifact checks pass. Then verify live count/routes/search. Continue the next two batches with the same acceptance process until 200 qualified events, or report the precise external blocker and actual count.

## Dependency review

The editorial design is approved. Actual first-batch video selection is not yet complete, so coding 42 case records now would invent verification. Browser availability must be verified before any playback claims. Research and the small truthful-label correction can proceed independently of that external dependency. The detailed integration subplan is written after those inputs exist; no placeholder production code is authorized by this plan.

## Execution checkpoint

- [x] Task 1 visible-label RED/GREEN and both independent reviews completed. Review also identified card/detail machine-readable defaults; these were narrowly corrected to unknown with a failing regression first, then passing tests and repeat spec/quality reviews. Added a missing-type example to existing observation-page E2E.
- [x] Task 2 initial 14-event research packet and eight YouTube metadata probes saved outside production imports; none are approved for publication.
- [x] Full unit tests (1,517), Astro check, content check, plan binding, changed-file formatting and review-mode build passed. Static DOM confirms neutral labels and exclusion of candidate routes. Browser E2E not completed.
- [ ] Task 3 existing-four real playback remains blocked. Edge window was opened with user approval, but runtime selection still fails; no playback evidence, approval rebind, public-mode release or deployment performed.
- [ ] Batch 1 data integration and subsequent batches remain pending source/footage verification. First-batch 14 is a research count, not an accepted-event count.
