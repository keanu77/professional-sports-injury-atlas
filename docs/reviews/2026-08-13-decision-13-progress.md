# Decision 13 execution progress

Date: 2026-08-13

Status: Phase 4 accepted; Phase 5 unblocked

## Completed work

- Governance binding is complete and positively verifies the immutable Decision 13 plan and owner authorization.
- Phase 0 is complete: cover contracts, risk taxonomy, baseline, and clinical freeze were committed.
- Phase 1 is complete: source candidates and upstream evidence were frozen without forcing questionable licenses.
- Phase 2 is complete: all 19 current `game-action-high-risk` covers were superseded. The current registry v5 contains five verified Commons photos and 16 original SVG fallbacks across 21 athletes and all 26 cases; current high-risk count is zero.
- Two append-only Phase 2 corrections are complete: the v6/v5 policy-lineage correction and the Playwright expectation correction. Historical policy/registry bytes remain unchanged.
- Phase 3 before-state inventory and evidence capture are committed. Machine coverage is 41 desktop routes, 41 mobile routes, eight no-JavaScript route/viewport observations, 274 definitions, 1,273 logical occurrences, 44 visibility deltas, and six runtime notice states. Two independent read-only audits found zero integrity or regression failures.
- Phase 4 is complete. The exact disposition matrix is implemented across 30 clinical consumption routes and all 42 footers; the canonical credits/notices route contains five registry-derived rows and 46 adjacent deep links. Complete desktop/mobile DOM, no-JavaScript, runtime, central-field, masked-screenshot, and before/after evidence is recorded under `docs/reviews/evidence/decision-13/notices-after/`.
- All four frozen Phase 3 gaps are closed: source-policy wording is current, Kevin Durant and LeBron James visibly retain `not-supplied` title state, the duplicated footer sentences are consolidated, and all 10 YouTube connection disclosures are visible at 390px.

## Phase 3 gate release

吳易澄醫師（本站 owner、執業復健科醫師）於 `2026-08-13T10:28:18Z` 提供完整具名 disposition，綁定 product-byte input commit `d625989de94969ecb9c248038fb00e0890f1f51b`。Disposition 已依既有 schema 逐欄記錄於：

- `docs/reviews/2026-08-13-decision-13-p3-notice-inventory-and-necessity.md`
- `docs/reviews/evidence/decision-13/notices-before/notice-inventory.v1.json`

重跑 fail-closed Phase 3 generator後明確回報 `Phase 3 accepted` 與 `Phase 4 unblocked`。核定的全站唯一精簡醫療聲明為：「本站為教學用途的衛教內容，不構成醫療建議，也無法取代醫師診察。症狀持續或惡化請就醫。」四個 minimum visible clauses、placement、三個 existing-string dispositions、所有 route-class treatments、醫師法第 11/25 條及醫療法第 85/86 條 treatment 均已完整記錄。

This is a bounded notice-treatment decision. It is not authority to write or revise approved case, injury-overview, quarterly-update, diagnosis, observation, management, or return-to-play prose, and it does not open the closed `medical-review-decision` scope generally.

## Commits in this execution

| Commit    | Result                                                                          |
| --------- | ------------------------------------------------------------------------------- |
| `36a80b3` | `docs(governance): authorize Decision 13 named-covers and notice-consolidation` |
| `3fcebcb` | `feat(governance): freeze Decision 13 cover contracts`                          |
| `d70f44a` | `docs(review): freeze Decision 13 photo candidates`                             |
| `2cb47fa` | `docs(review): correct Dwight source digest`                                    |
| `7fe414f` | `feat(media): replace Decision 13 named covers`                                 |
| `d625989` | `fix(governance): correct Decision 13 photo policy lineage`                     |
| `2398deb` | `test(e2e): align Decision 13 cover checks with v5`                             |
| `27db19c` | `docs(review): inventory Decision 13 notices`                                   |
| `fd8bbe2` | `docs(review): accept Decision 13 notice disposition`                           |
| `6b21554` | `feat(notices): consolidate Decision 13 notices`                                |
| `443e482` | `fix(review): bind Decision 13 footer evidence selector`                        |
| `da8f1e8` | `fix(review): verify visible missing-notice copy`                               |
| `4936357` | `fix(review): capture every mobile YouTube disclosure`                          |

## Validation checkpoint

All listed passing commands used the pinned Node `v24.14.0` runtime.

| Gate                                                                           | Result                                                                                                                |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `npm run plan:verify`                                                          | passed; 22 bound documents                                                                                            |
| `npm run plan:decision:verify -- --decision … --plan …`                        | passed; decision SHA-256 `2f956058412d5244554b310dfc866f2805ac623f6f999e6fdd958117c1d25aad`                           |
| `npm run plan:assert-authorized -- <Decision 13 plan>`                         | positive pass                                                                                                         |
| `npm run test:coverage`                                                        | passed; 917/917                                                                                                       |
| `npm run test:e2e`                                                             | passed; 196/196 across Chromium, Firefox, WebKit, and mobile Chromium                                                 |
| `npm run format:check`                                                         | passed                                                                                                                |
| `npm exec -- tsc --noEmit`                                                     | passed                                                                                                                |
| `npm run check`                                                                | passed; 0 errors, 0 warnings, 15 hints                                                                                |
| content/research/manifest/registry checks                                      | passed                                                                                                                |
| source-policy v6, player-photo v5/v4, asset, brand, and clinical-freeze checks | passed                                                                                                                |
| `npm run build:review`                                                         | passed; 41 pages, 355 optimized image outputs                                                                         |
| Phase 3 generator after the build                                              | passed three consecutive times; `Phase 3 accepted`; `Phase 4 unblocked`                                               |
| Phase 4 after-evidence collector                                               | passed; 42 routes, 30/30 compact notices at both viewports, 10/10 mobile YouTube disclosures, 46/46 links to 5/5 rows |
| Phase 4 exact review build                                                     | passed; 42 pages, 451 build files, noindex artifact checks passed                                                     |

Phase 3 evidence digests:

- inventory: `b9e203b9320155712a9cc6222ec74264e3702513613277b649715caa585ffcd0`
- manifest: `b466192bafbd4e8c31772bb03ba4a621d06e599a3c191ba7b618776294da0a2c`
- runtime: `e457ea29db8d0743418d6e348f374cae320156306365039b6de503b826f3144c`
- governed clinical aggregate: `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73` (30/30 files)

## Remaining work and closed scopes

- Phase 5 review-set/private-manifest artifact chain is not started.
- The private review service has not been restarted and private authenticated/unauthenticated smoke has not run; those actions remain ordered after the Phase 5 review-set/build/private-manifest commits.
- Nothing was pushed, deployed, indexed, or publicly released.
- No external account, hosting configuration, credential, listener, or external service was mutated.
- No medical content or medical-review decision was authored or inferred.
- The plan, authorization JSON, plan binding, and all previously bound documents remain byte-identical.

## Resume sequence

1. Complete: record the complete named owner/legal disposition without editing any bound artifact or approved clinical content.
2. Complete: re-run the Phase 3 gate; it reports Phase 3 accepted and Phase 4 unblocked.
3. Complete: Phase 4 implements the approved matrix and its after-evidence gate reports `Phase 4 after-evidence accepted`.
4. Next: complete Phase 5 in the mandated review-set commit → review build → private-manifest commit → exact existing-service restart → authenticated/unauthenticated smoke order.
