# Decision 18 Phase 1 — Single professional-note view

Date: 2026-08-15

State: complete locally; no medical-review, hosting, release, indexing, or
owner-signoff decision was made

## Decision A result

The case-detail route and review fixture now render one static
`ProfessionalNotes` component whose only prop is the existing professional
record. It renders the existing four rows in their original order:
`機轉分析（觀察性）`, `臨床限制`, `鑑別脈絡`, and `治療與回場意涵`.

The following reader-layer and switch machinery was removed rather than left
as a one-button or hidden compatibility layer:

- the general-reader section and `一般讀者筆記` heading;
- `whatVideoCannotProve` prop wiring on both the real route and fixture;
- both switch buttons, help copy, `aria-pressed`, `aria-controls`, emphasis
  state, switch-only styling, and every `data-layer-*` attribute;
- `LayeredNotes.astro`, `src/scripts/layered-notes.ts`, its unit test, and the
  obsolete Decision 17 B-1 DOM verifier; and
- old dual-layer wording in active page metadata, About copy, tests, and
  runtime comments.

All 26 case JSON files remain byte-identical, including their now non-rendered
reader field. Their professional text and digest inputs were not rewritten.

## Clinical-limitations precondition and retained safety

The pre-edit and post-build checks both passed all 26 real cases:

- ACL: 7/7 explicitly say video cannot replace clinical diagnosis.
- Ankle sprain: 12/12 say images cannot distinguish the relevant injury and
  require symptoms, palpation, weight-bearing ability, and an appropriate
  examination.
- Achilles rupture: 7/7 require clinical assessment (and appropriate imaging
  when needed) and say video cannot establish rupture details.
- 26/26 have the `臨床限制` heading, a non-empty source-equal
  `professional.clinicalLimitations` paragraph, and a valid
  `teaching-evidence` binding.
- The other three professional rows are also source-equal on all 26 pages.

The source/DOM verifier covered the 26 real pages plus the fictional fixture:
27 professional views, zero reader layers, zero switches, zero legacy
`data-layer-*` attributes, and zero obsolete note-switch tokens in built
JavaScript/CSS.

## Validation

A review build was generated only at `/tmp/atlas-d18-p1.FzyL3d`; it produced
42 HTML pages and did not write repository `dist`.

Passed checks:

- Vitest: 68 files, 1,184 tests;
- focused Playwright across Chromium, Firefox, WebKit, and mobile Chromium:
  48/48 scenarios, covering all 26 cases plus the fixture, no-JavaScript,
  axe, and 320 px reflow;
- Astro diagnostics: 0 errors, 0 warnings, 16 informational hints across 261
  files;
- TypeScript `--noEmit`, content validation, Decision 18 baseline and
  regression contract, clinical freeze 30/30, photo/cover v8, NBA source
  policy v10, brand/CC BY-SA, scoped Prettier, and `git diff --check`;
- follow-up DOM: 26 cases, 44 pending items, three empty cases, tier counts
  14 mainstream / 29 official / 1 unverified, 41 NBA citations, and zero NBA
  navigation sinks; and
- manual desktop (1440 px) and mobile (320 px) screenshots of the fixture:
  one complete professional panel, no orphan control or empty layer, and no
  horizontal clipping observed.

One preliminary full-unit run exposed only the intentional About-copy byte
pin; the assertion was updated to the new authorized copy, after which the
complete 1,184-test run passed. This was not concealed or treated as a medical
content refresh.

The active-runtime scan (excluding byte-frozen historical evidence generators)
found zero instances of `LayeredNotes`, the removed client script,
`data-layer-*`, emphasis state, or the removed reader heading.

## Closed scopes

The Decision 18 plan and authorization hashes, 30 clinical files, 21 covers,
registry, v1-v10 policy, Decision 17 research and sidecars, review artifacts,
private manifest, and served receipt remain exact. Repository `dist`, the
private service, deployment state, and indexing state were not changed.
`private:manifest`, `private:verify`, `launchctl`, and served smoke were not run
because `hosting-service-mutation` is closed.
