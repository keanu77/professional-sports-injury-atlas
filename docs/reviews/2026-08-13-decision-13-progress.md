# Decision 13 execution progress

Date: 2026-08-13

Status: clean governance pause at the Phase 3 named owner/legal gate

## Completed work

- Governance binding is complete and positively verifies the immutable Decision 13 plan and owner authorization.
- Phase 0 is complete: cover contracts, risk taxonomy, baseline, and clinical freeze were committed.
- Phase 1 is complete: source candidates and upstream evidence were frozen without forcing questionable licenses.
- Phase 2 is complete: all 19 current `game-action-high-risk` covers were superseded. The current registry v5 contains five verified Commons photos and 16 original SVG fallbacks across 21 athletes and all 26 cases; current high-risk count is zero.
- Two append-only Phase 2 corrections are complete: the v6/v5 policy-lineage correction and the Playwright expectation correction. Historical policy/registry bytes remain unchanged.
- Phase 3 before-state inventory and evidence capture are committed. Machine coverage is 41 desktop routes, 41 mobile routes, eight no-JavaScript route/viewport observations, 274 definitions, 1,273 logical occurrences, 44 visibility deltas, and six runtime notice states. Two independent read-only audits found zero integrity or regression failures.

## Current gate and required owner input

Phase 3 acceptance is not complete, and Phase 4 has not started. The plan requires a named owner/legal reviewer to approve the medical-notice row and minimum visible content before implementation. The pending schema is recorded in:

- `docs/reviews/2026-08-13-decision-13-p3-notice-inventory-and-necessity.md`
- `docs/reviews/evidence/decision-13/notices-before/notice-inventory.v1.json`

The disposition must be tied to product-byte input commit `d625989de94969ecb9c248038fb00e0890f1f51b` unless the owner authorizes a later impact review. It must provide the named reviewer/capacity and UTC timestamp, exact approved Traditional Chinese compact notice, minimum visible clauses, placement, disposition of the three existing strings, route-class treatment, and the reviewer's applicability/treatment conclusions for Physicians Act Articles 11 and 25 plus any additional authority or explicit none.

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

## Validation checkpoint

All listed passing commands used the pinned Node `v24.14.0` runtime.

| Gate                                                                           | Result                                                                                      |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `npm run plan:verify`                                                          | passed; 22 bound documents                                                                  |
| `npm run plan:decision:verify -- --decision … --plan …`                        | passed; decision SHA-256 `2f956058412d5244554b310dfc866f2805ac623f6f999e6fdd958117c1d25aad` |
| `npm run plan:assert-authorized -- <Decision 13 plan>`                         | positive pass                                                                               |
| `npm run test:coverage`                                                        | passed; 917/917                                                                             |
| `npm run test:e2e`                                                             | passed; 196/196 across Chromium, Firefox, WebKit, and mobile Chromium                       |
| `npm run format:check`                                                         | passed                                                                                      |
| `npm exec -- tsc --noEmit`                                                     | passed                                                                                      |
| `npm run check`                                                                | passed; 0 errors, 0 warnings, 15 hints                                                      |
| content/research/manifest/registry checks                                      | passed                                                                                      |
| source-policy v6, player-photo v5/v4, asset, brand, and clinical-freeze checks | passed                                                                                      |
| `npm run build:review`                                                         | passed; 41 pages, 355 optimized image outputs                                               |
| Phase 3 generator after the build                                              | passed; evidence hashes reproduced exactly                                                  |

Phase 3 evidence digests:

- inventory: `2766e7e7ede0329a260ca77a22f257252414b6c0e8b3b45cf06f39dd44eb6589`
- manifest: `3fb5715be1d75e23730919dd5d7e3564ad66d7bbb2402fe04e9c924b118755e2`
- runtime: `e457ea29db8d0743418d6e348f374cae320156306365039b6de503b826f3144c`
- governed clinical aggregate: `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73` (30/30 files)

## Not started and closed scopes

- Phase 4 notice consolidation is not started.
- Phase 5 review-set/private-manifest artifact chain is not started.
- The private review service was not restarted and private authenticated/unauthenticated smoke was not run because the artifact chain is prohibited before the Phase 3 gate is released.
- Nothing was pushed, deployed, indexed, or publicly released.
- No external account, hosting configuration, credential, listener, or external service was mutated.
- No medical content or medical-review decision was authored or inferred.
- The plan, authorization JSON, plan binding, and all previously bound documents remain byte-identical.

## Resume sequence

1. Obtain and record the complete named owner/legal disposition above without editing any bound artifact or approved clinical content.
2. Re-run the Phase 3 gate and commit the disposition/evidence conventionally.
3. Only after the gate reports Phase 3 accepted and Phase 4 unblocked, implement Phase 4 exactly from the approved matrix.
4. Complete Phase 5 in the mandated review-set commit → review build → private-manifest commit → exact existing-service restart → authenticated/unauthenticated smoke order.
