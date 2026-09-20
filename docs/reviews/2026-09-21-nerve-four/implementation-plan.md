# Named nerve and brachial plexus videos

Editorial implementation plan, not a platform-authority document. Stored with this batch's review records to preserve the existing bound authority-document ledger.

## Goal

Implement the four selected cases following the user's instruction「請你開始新增影片到網站」on the current branch, preserving existing changes. Prior decisions: no year restriction; prioritize injury footage, then athlete interviews; accept a separate brachial plexus category.

## Architecture and approved presentation

Use the existing observation catalog and attributed-event updates, not the clinically approved core-case ledger. Add Jaylon Smith (2016, peroneal nerve), Zack Kelly (2023, ulnar nerve), Ryan Crouser (2024, ulnar nerve), and Rob Horne (2018, brachial plexus). Keep nerve injury and plexus injury as distinct browse groups. Smith/Kelly have incident footage; Crouser/Horne are interviews. Do not infer diagnoses from images, invent exact onset/recovery dates, or equate sporting participation with nerve healing.

Retain YouTube for the three selected interviews/documentaries. For Kelly use only the exact MLB-provided Streamable embed with an original MLB link, a local text facade, click-to-load consent, and no fabricated YouTube ID, thumbnail, or playback telemetry. Keep the current seven-day owned-preview playback release requirement; source-page playback alone is insufficient for release.

Tech stack: Astro, TypeScript, Zod, Vitest, existing Playwright tests.

## Tasks

1. Provider integration (test first): extend observation metadata narrowly; add allowlisted MLB embed presentation and an athlete-interview label. Update card/detail rendering, thumbnails/verification, and YouTube-only analytics/health handling. Preserve all existing provider behavior. Tests reject arbitrary URLs and ensure no external iframe before consent.
2. Data and discovery (test first): add `src/data/videos/nerve-four.v1.json` and `event-nerve-four.v1.json`; wire into `expansion.ts` and `event-updates.ts`; add resource notes, elbow browsing, two nerve topic routes and homepage access. Tests check exact four selections, named nerves, distinct plexus category, search, date/source binding, uniqueness, and updated counts.
3. Verify and review: focused tests, full unit tests, Astro check, content check, public-mode review build, and scoped browser tests. Independently review specification then code quality. Record any release blocker truthfully; do not alter user-owned `.claude/HANDOFF.md`, fabricate playback evidence, or bypass clean-tree/approval checks.

## Commands

- `npx vitest run tests/unit/nerve-four.test.ts tests/unit/observation-provider.test.ts` (first RED, then GREEN)
- `npm run test:unit`
- `npm run check`
- `npm run content:check`
- `ATLAS_PUBLIC_LAUNCH=decision-21 npm run build:review`
- `ATLAS_PUBLIC_LAUNCH=decision-21 npx playwright test e2e/nerve-four.spec.ts`

## Completion status

Data, discovery and provider integration implemented. Focused tests passed; full unit suite has three dirty-worktree governance failures, and full build is blocked by the same guard. No production deployment or new owned-preview playback evidence. See `docs/reviews/2026-09-21-nerve-four/implementation-status.md` for precise verification boundaries and remaining work.
