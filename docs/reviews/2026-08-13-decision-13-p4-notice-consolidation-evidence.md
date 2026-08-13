# Decision 13 Phase 4 notice consolidation evidence

Date: 2026-08-13

Status: **Phase 4 accepted; Phase 5 unblocked**

## Bound input

The implementation and after-state evidence are bound to clean Phase 4 source
commit `493635722d269e91f763c2a9f511e95426e97cd9`. The named disposition recorded
in Phase 3 remains the sole authority for notice treatment. The immutable plan,
authorization, plan binding, and all 30 governed clinical JSON files were not
edited.

The one product-copy source for the approved notice is:

> 本站為教學用途的衛教內容，不構成醫療建議，也無法取代醫師診察。症狀持續或惡化請就醫。

## Final presentation architecture

- The 26 case routes, three injury overviews, and one quarterly update each
  render one compact notice as the first child of the clinical container. Its
  complete sentence and all four minimum clauses are initially visible at
  `1440×900` and `390×844`.
- Every one of the 42 review-build routes renders exactly one canonical footer
  sentence. The former short and long footer strings are absent. About keeps
  its original main-content statement byte-for-byte and receives no compact
  notice. Home, league listings, and review fixtures receive no compact notice.
- `/credits-notices/` is the canonical no-JavaScript-compatible explanation and
  asset-credit route. Compact and footer blocks link to its medical anchor.
- Five registry-derived photo rows use stable revision anchors. Forty-six
  adjacent photo-use links resolve to those five rows. Each row exposes creator,
  work-title status, exact linked license/version, fixed Commons revision,
  alteration, uploader provenance, per-file notice states, occasion/risk facts,
  and an Adapter's License for each of the three BY-SA crops.
- CC BY, CC BY-SA, and CC0 have distinct fail-closed presentation tests. Kevin
  Durant and LeBron James visibly retain `workTitle.status=not-supplied` without
  an invented title.
- Medical and asset fragment targets use an eight-rem scroll margin. Browser and
  no-JavaScript tests compare the target top with the sticky-header bottom so a
  deep-linked heading cannot be hidden under the header.

## Frozen Phase 3 gaps

| Gap                                                       | Phase 4 resolution                                                                                                   |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Reader-facing source-policy paragraph was stale           | It now describes governed non-event CC photos, exact central credits, risk non-clearance, and original SVG fallback. |
| Kevin Durant and LeBron James title state was suppressed  | Both central rows visibly say the source did not supply a title and retain their structured state/evidence links.    |
| Two adjacent footer medical strings repeated on 41 routes | Both old families fell from 41 to zero; one exact canonical footer family appears once on all 42 current routes.     |
| YouTube connection disclosure was hidden at 390px         | All ten occurrences are CSS-visible and fully in the 390px viewport after targeted scroll, before activation.        |

## Before/after DOM and screenshot proof

The frozen before inventory is
`docs/reviews/evidence/decision-13/notices-before/notice-inventory.v1.json`,
SHA-256 `b9e203b9320155712a9cc6222ec74264e3702513613277b649715caa585ffcd0`.
The exact matched representative before DOM and masked screenshots are under
`docs/reviews/evidence/decision-13/notices-comparison/before/` and bind accepted
Phase 3 commit `fd8bbe20e72e6bb67d797d68c156d899e4dfda35`.

The complete after corpus is under
`docs/reviews/evidence/decision-13/notices-after/`. It contains semantic DOM for
all 42 routes at both viewports, eight no-JavaScript route/viewport observations,
14 runtime state snapshots representing six logical runtime notices, ten masked
screenshots, the central-credit field ledger, mobile YouTube geometry, a source
ledger, and the machine comparison. All non-local requests were prohibited and
zero third-party request completed.

| Measure                                   | Before | After |
| ----------------------------------------- | -----: | ----: |
| Routes per viewport                       |     41 |    42 |
| Notice definitions                        |    274 |   279 |
| Logical occurrences                       |  1,273 | 1,347 |
| Old short footer sentence                 |     41 |     0 |
| Old long footer sentence                  |     41 |     0 |
| Canonical footer sentence                 |      0 |    42 |
| Compact clinical notice                   |      0 |    30 |
| Adjacent asset-credit deep links          |      0 |    46 |
| Central asset rows                        |      0 |     5 |
| Mobile-visible YouTube connection notices |      0 |    10 |

Every family reduction has a surviving canonical replacement in
`comparison.v1.json`; no route was removed. The only added route is
`/credits-notices/`. About main content retained its exact hash. There is no
visible clipping or page-level horizontal overflow, and the 30 compact notices
are fully inside both initial viewports.

Evidence digests:

- after inventory:
  `b00f2a323196643ce6681b56d752d7cc48429b5dc5371b063ad5235a23b452db`
- after manifest:
  `e0cef616598c6cb8ff12320196374cc564005094d16927078eeed684a31ffb31`
- before/after comparison:
  `f8c9be4ff05383b8a3d794b59842c7f12e394b5ed0e7e5196c8ef08ed6846221`
- source-ledger file:
  `5f4900f071def1de833ef522efc2d03fa44c59836314231645a8d633e029040f`
- source-ledger aggregate:
  `44d06d05c1efe9d1cace488da21fce8741c518277b456ffa43a9369ec9670298`
- exact review-build aggregate:
  `ed0c4be4139138b6688347b07ce87feeee962ee8fbd8f413e7020a10aa951a64`

All 109 files named by the after manifest independently passed byte-length and
SHA-256 verification. The manifest itself is the 110th file in the tree.

## Accessibility and integrity

- Focused Playwright checks passed across Chromium, Firefox, WebKit, and mobile
  Chromium. They cover the 30-route placement matrix, both initial viewports,
  central deep links, no-JavaScript rendering, the complete credits route, Axe
  WCAG A/AA, and the 390px disclosure.
- Contrast guards include the new compact notice and central-credit surfaces.
- The exact review build produced 42 pages and passed the noindex/no-sitemap/
  no-analytics/no-iframe/no-preconnect/non-local-image artifact checks.
- Clinical freeze: 30/30 files, aggregate
  `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.
- The independent read-only audit's sole blocking finding, sticky-header overlap
  at deep-link targets, was fixed and covered in both JavaScript and
  no-JavaScript browser tests. Its two non-blocking hardening observations were
  also closed: all three license buckets now have direct assertions, and the
  obsolete footer selector was removed.

## Fail-closed evidence generation

Three pre-acceptance collector runs stopped without retaining a partial after
tree: an ambiguous footer selector, an overly narrow missing-notice text check,
and failure to enumerate both component-lab disclosures. Each issue was limited
to evidence collection, corrected in a conventional source commit, and followed
by a clean rebuild. The accepted run is bound to `4936357`; it reports
`Phase 4 after-evidence accepted`.

## Scope boundary

No content was pushed, deployed, indexed, or publicly released. No external
account, hosting configuration, credential, listener, or external service was
mutated. The eight closed scopes remain closed: `deployment`,
`external-account-mutation`, `hosting-service-mutation`, `indexing`,
`medical-content-authoring`, `medical-review-decision`, `public-release`, and
`remote-repository-mutation`.
