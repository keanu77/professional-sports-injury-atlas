# Decision 17 Phase 2 — Layered-notes presentation cleanup

Date: 2026-08-14

Scope: Decision B-1 only

State: implemented and locally verified; no medical-review decision was made

## Result

The reader layer now renders exactly one safety item: the heading
`畫面不能證明什麼` followed by the case's unchanged
`general.whatVideoCannotProve` text. The professional layer still renders all
four existing sections and their unchanged text. Both layers remain in server
HTML and the two native buttons change emphasis only.

Removed from the case and review-fixture presentation:

- reader rows backed by `general.whatHappened` and `general.whatIsVisible`;
- the reader row backed by `general.confirmedUpdate` (Phase 3 owns its governed
  legacy-diagnosis projection);
- YouTube timeline and non-YouTube segment-observation branches;
- `LayeredNotes`' obsolete default slot, `CaseTimeline.astro`, timestamp/seek
  client wiring, and the component-lab timeline fixture.

Retained unchanged as protected, non-rendered inputs:

- all 26 case JSON files, including `whatHappened`, `whatIsVisible`,
  `confirmedUpdate`, and `video.segments`;
- all four professional-note fields;
- the existing clinical-core digest calculation and every named owner-review
  field.

The enhancement now wires a block only when it contains exactly one
`general` button, one `professional` button, one matching target for each, and
exact `aria-controls` relationships. Invalid or obsolete structures remain
unwired. A valid click/Enter/Space activation updates exactly one
`aria-pressed=true` value and `data-emphasis`; it does not hide content or move
focus.

## Rendered-DOM evidence

A review build was generated outside the repository at
`/tmp/atlas-d17-b1-review` and produced 42 pages. The deterministic B-1 scanner
parsed all 26 real case pages plus the case-detail fixture and verified:

- 27/27 reader layers have one `h4`, one non-empty paragraph, and no duplicate
  reader content;
- the 26 real paragraphs exactly equal each case JSON's existing
  `whatVideoCannotProve` string;
- 27/27 professional layers retain four expected headings and four non-empty
  paragraphs;
- 27/27 layered-note blocks retain exactly two correctly controlled buttons;
- timeline/segment DOM count is 0, including the component lab;
- built JavaScript contains neither `data-video-timeline` nor `setupTimeline`.

Playwright repeated the behavior in Chromium, Firefox, WebKit, and mobile
Chromium. The focused three-spec run passed 104/104 tests, including all 26
real case routes, the fixture, no-JavaScript readability, keyboard behavior,
stable focus, axe checks, 200% reflow, click-to-load success/failure, and NBA
plain-text citation behavior.

## Protected-boundary and tool results

| Check                           | Result                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Required Node                   | `v24.14.0`                                                                                          |
| `npx tsc --noEmit`              | pass                                                                                                |
| Astro diagnostics               | 0 errors, 0 warnings, 16 pre-existing hints across 241 files                                        |
| Full Prettier check             | pass                                                                                                |
| Focused Vitest                  | 3 files, 23/23 tests passed                                                                         |
| Focused Playwright              | 104/104 passed across 4 projects                                                                    |
| Review build                    | 42 pages; pass                                                                                      |
| B-1 built-DOM scanner           | 26 real cases + 1 fixture; reader 1 item, professional 4 items, timelines 0                         |
| Clinical freeze                 | 30/30 byte-identical; aggregate `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`  |
| Decision 17 protected baseline  | pass; committed evidence SHA-256 `f33ec875b74869b2d735684ef2f4d089815e81192f1d11df6d62b9c9b45489b4` |
| Decision 17 regression contract | 7/7 passed                                                                                          |
| Player-photo registry v8        | pass; SHA-256 `908ccc9c1d9aeee56c907a476701c8875914af5090614c36271a76447057084a`                    |
| Current 21-cover ledger         | byte-identical; aggregate `625b47f92ad0e4706872e92ea7c7fd92e25c4dfd21dd219feb59154571db15dd`        |
| CC BY-SA composition firewall   | `brand:verify` passed                                                                               |
| Bound plan SHA-256              | unchanged: `845f2b6b694ace14fc65cf086c7fce95985acfb4d0f562dfaaab1f357e84078e`                       |
| Authorization SHA-256           | unchanged: `cdb2b5838d66d50c74ac82346c06a4c1096d52422fa767e6b64d2f22c9ba8080`                       |

## Validation history

The first protected-baseline check failed because the Phase 0 collector still
attempted to read the now-authorized deleted `CaseTimeline.astro`, even though
that presentation file had already been excluded from the immutable comparison
projection. The collector was narrowed to read only the immutable governance
subset during later-phase checks; the committed Phase 0 evidence was not
rewritten and then passed with its original SHA-256.

An initial focused browser run reported four failures because legacy tests
searched all bundled source text for the `youtube-nocookie` constant. After the
timeline removal changed bundling, that string could be present without a DOM
URL or network request. The assertions were corrected to inspect actual
`src`/`href` attributes plus the intercepted network log; the complete
four-project run then passed 104/104.

The first full Prettier check identified the canonical one-line Phase 0 JSON
evidence. That generated evidence is hash-bound and must not be reformatted;
the Decision 17 evidence directory was added to `.prettierignore`. Its bytes
and SHA-256 remained unchanged, and the full formatter check then passed.

No case record, injury overview, quarterly update, cover, v1–v9 policy,
review artifact, digest algorithm, plan, authorization, service, deployment,
indexing setting, external account, or remote repository was changed.
