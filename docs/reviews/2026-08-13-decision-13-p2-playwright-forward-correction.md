# Decision 13 Phase 2 Playwright forward correction

Date: 2026-08-13

Phase 2 product input commit: `d625989de94969ecb9c248038fb00e0890f1f51b`

Execution scope: `decision-13-named-covers-and-notice-consolidation-only`

## Reason for the correction

The first complete Playwright run after the append-only photo-policy correction exposed six stale test cases. Across Chromium, Firefox, WebKit, and mobile Chromium, those six cases produced 24 failures and 172 passes because they still required the historical 21-photo/game-action projection and its generic court-photo wording. The rendered site already used the governed current registry v5 projection: five Commons photos and 16 original SVG fallbacks across 21 athletes and 26 cases.

The failures were therefore obsolete test expectations, not a product fallback to rejected media. No failing assertion identified a remote image request, a current high-risk cover, a missing current cover, or a clinical-content change.

## Bounded test correction

Only these browser-test files changed:

- `e2e/player-photos.spec.ts`
- `e2e/video-player.spec.ts`

Both now read `src/assets/players/player-photo-registry.v5.json` and verify the exact current projection instead of embedding the superseded registry assumptions. The checks cover:

- exactly 21 athlete selections and 26 case mappings;
- athlete partition: five Commons photos and 16 original SVG fallbacks;
- case partition: seven photo cases and 19 SVG-fallback cases;
- exact per-selection cover kind, athlete, focal point, caption, alt text, source revision, risk class, license bucket, and ShareAlike treatment;
- local SVG rendering, exact fallback label, and absence of Creative Commons attribution on site-owned fallbacks;
- hero preload/eager behavior, facade lazy behavior, interaction boundaries, and zero pre-click third-party requests for both photo and SVG paths;
- current CC BY 2.0, CC BY 3.0, and CC BY-SA 4.0 examples rather than removed historical-photo examples.

## Verification

All commands used Node `v24.14.0`.

| Command                                                                                     | Result                                   |
| ------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `npx playwright test e2e/player-photos.spec.ts e2e/video-player.spec.ts --project=chromium` | passed, 17/17                            |
| `npm run test:e2e`                                                                          | passed, 196/196 across all four projects |
| `npm run format:check`                                                                      | passed                                   |
| `npm exec -- tsc --noEmit`                                                                  | passed                                   |
| `git diff --check`                                                                          | passed                                   |

The immediately preceding complete unit/coverage run also passed 917/917. This correction changes no product source, registry, policy, asset, approved clinical content, bound plan, authorization decision, or plan binding. It performs no push, deployment, indexing, external-account mutation, hosting mutation, medical-content authorship, medical-review decision, or public release.
