# Catalog 200 integration validation

Implementation base: `4c8c8ad918adb446f12bf161af248db26ef192f8` on `feat/aaron-judge-rib`. Local checks recorded on 2026-09-21. This record covers implementation and local validation; it does not assert deployment, release approval, or owned HTTPS playback for the new 42 clips.

The single batch adds the 42 clips and 42 event updates from the checkpointed [selected cases](selected-cases.json). Totals are 193 observations, seven existing core cases, 200 event updates, 199 YouTube IDs plus the existing MLB video, 30 populated sport groups, and 14 populated anatomical groups. The nerve collection remains four cases.

The [baseline captured before integration](baseline-before-integration.json) contains the previous 151 observations and 158 event entries at the implementation base. Its content SHA-256 is `ed1d8b04a6926597623595be2ef8f604756c0d3f12791a235d021dc64ba6f0cc`; tests compare those original records in full after excluding the 42 new slugs. No clinical core records or existing observation/event batches changed.

Implementation details relevant to review:

- The production catalog schema uses the independent literal metadata snapshot in the approved integration plan. It binds the 42 selected slugs to exact video IDs, canonical URLs, publishers, titles, starts, durations, footage kinds, event years and event dates. The year mutation test uses the syntactically valid but incorrect string `"2024"`.
- The plan's core-slug expression assumed the original launch ledger had a `slug` property. That ledger stores case IDs instead. The guard explicitly reserves the five existing core slugs, while retaining the existing two expansion-core slugs and all previous observation slugs and IDs.
- Discovery's existing exhaustive inventory test requires all published slugs to be present. The batch therefore appends Nathan's `fall`, Tim Sylvia's `collision`, and 40 explicit `unclear` entries. These preserve the approved fallback meaning and do not assign new inferred injury mechanisms or curated ranks. All previous discovery entries remain semantically identical.
- The 42 resource entries reuse the existing registry. Its original global `checkedAt` of `2026-09-12` is preserved because those linked resources were not all rechecked in this integration. New event-source dates remain in the new event batch.
- All 42 JPEGs were copied from `/private/tmp/atlas-catalog200-thumbnails/` after checking the provided receipt's exact official URL, byte count, JPEG signature, and SHA-256. The manifest and thumbnail validator now cover exactly 199 selected YouTube IDs.
- The release change only loads the optional new batch proof file and adds it to the existing evidence lookup. All existing origin, route, exact URL, seven-day freshness, playback advancement, ready state, paused state, and selected-start checks remain. No new batch playback proof was created.

Validation performed:

| Check                                                                                      | Result                                                                                                                                  |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| New `catalog-200.test.ts` before production integration                                    | 6 expected failures because catalog-200 was not yet implemented; recorded in `/private/tmp/atlas-catalog200-unit-red.log`               |
| First integrated focused run                                                               | Existing discovery inventory detected the missing 40 explicit `unclear` entries; corrected the inventory without changing the assertion |
| Final focused catalog, taxonomy, discovery, search, thumbnails and prior-batch regressions | 14 files, 101 tests passed                                                                                                              |
| Existing event-update binding/date/source tests                                            | 1 file, 9 tests passed                                                                                                                  |
| Astro check with warning threshold                                                         | 386 files; 0 errors, 0 warnings, 16 existing hints                                                                                      |
| Scoped Prettier and `git diff --check`                                                     | Passed                                                                                                                                  |
| Temporary E2E configuration syntax                                                         | Passed `node --check`                                                                                                                   |

The focused unit command used Node `24.14.0` at `/private/tmp/atlas-judge-node.3pGBJs/node-v24.14.0-darwin-arm64/bin/node`:

```sh
node node_modules/vitest/vitest.mjs run tests/unit/catalog-200.test.ts tests/unit/video-sports.test.ts tests/unit/decision-39-observation-discovery.test.ts tests/unit/nerve-navigation.test.ts tests/unit/video-thumbnails.test.ts tests/unit/video-expansion.test.ts tests/unit/nerve-four.test.ts tests/unit/rib-fracture-three.test.ts tests/unit/decision-39-ux.test.ts tests/unit/video-discovery.test.ts tests/unit/public-video-health.test.ts tests/unit/recent-150.test.ts tests/unit/recent-120.test.ts tests/unit/video-search.test.ts
node node_modules/vitest/vitest.mjs run tests/unit/event-updates.test.ts
node node_modules/astro/bin/astro.mjs check --minimumFailingSeverity warning
```

Independent SPEC and then QUALITY reviews passed. SPEC independently rejected 378 valid-looking metadata mutations, confirmed all previous observation/event records, and matched the 42 selected thumbnails to their actual hashes. QUALITY independently verified the exact public inventory and zero review-mode observation exposure. The root rebound only the candidate input-tree digest to `282f2e3f0fed443e210cf5393e0e038fb2cedad2f23b3205e4ce9264f804a857`; QUALITY recalculated the same digest and confirmed all other approval fields remain unchanged.

Remaining verification belongs to the main process after a clean checkpoint: full unit/content/plan checks, isolated public build and artifact inspection, desktop/mobile E2E, and actual owned HTTPS playback of the new 42 videos. The attempted E2E RED command never produced a test result because its tool approval wait was interrupted; the main process accepted the completed unit RED and took over all preview/browser execution.

The prepared local regression configuration is `/private/tmp/atlas-catalog200-e2e.config.mjs`. It uses installed Chrome with Desktop Chrome and Pixel 7 projects, two workers, no retries, and no server/build hook. The main process must serve its inspected public artifact at the selected port before running:

```sh
ATLAS_PUBLIC_LAUNCH=decision-21 ATLAS_E2E_PORT=14323 node node_modules/@playwright/test/cli.js test --config=/private/tmp/atlas-catalog200-e2e.config.mjs
```

The new E2E spec covers all 42 detail routes, exact footage labels/video IDs/starts, working citation anchors, absence of invented return-day counts, and absence of pre-consent iframe or provider requests. It checks 200 unique searchable events and three distinct Rafael Nadal events. Six representative routes cover Nogueira's long name, three new sports, and both new anatomy groups with Axe at each project's viewport and overflow checks at the project viewport plus 320 and 390 pixels. These local checks cannot substitute for actual owned HTTPS provider playback.

The public artifact inspection after checkpoint `111b6df` exposed a missing contract: 35 new entries had no mechanism block, while the existing artifact gate requires a sourced mechanism on every public detail page. The main process explicitly authorized completing this same reviewed content structure in both the selected-case document and the production event batch; the artifact gate was kept unchanged.

The correction adds only those 35 missing `mechanism` fields from the auditor's `/private/tmp/atlas-catalog200-missing-mechanisms.json`. All 35 summaries reuse existing timeline text and source indexes. Thirty-one explanations reuse existing timeline text and indexes; the other four reuse existing observation text with the selected original-video source. The original seven mechanism objects and every other field in both JSON files remain deeply identical to `111b6df`. The comparison record is `/private/tmp/atlas-catalog200-mechanism-preservation.json`; removing only the 35 added fields restores each baseline semantic hash exactly.

The new catalog-200 event schema now requires both mechanism and timeline at load time. The shared input schema and all previous batches retain their prior behavior. E2E assertions require a visible mechanism block bound to each of the 42 slugs, at least two mechanism citations, and working citation targets. No source lookup, playback-proof creation, input-binding update, deployment, or privileged E2E execution was performed for this correction.

Correction validation on 2026-09-21:

- RED: one new presence assertion listed the exact 35 missing slugs. Two removal tests also demonstrated that the previous optional batch schema incorrectly accepted missing mechanism or timeline. The existing six catalog tests continued to pass. Logs: `/private/tmp/atlas-catalog200-mechanism-red.log` and `/private/tmp/atlas-catalog200-mechanism-schema-red.log`.
- GREEN: 49 tests across `catalog-200`, `event-updates`, `nerve-four`, `video-discovery`, and `video-expansion` passed, including both required-field removal tests. Log: `/private/tmp/atlas-catalog200-mechanism-green.log`.
- Fresh Astro check: 386 files, 0 errors, 0 warnings, 16 existing hints.
- Scoped Prettier and `git diff --check` passed. The main process owns the following clean checkpoint, renewed artifact inspection, desktop/Pixel 7 E2E, and owned HTTPS playback.

Final main-process validation is recorded in [final-validation.json](final-validation.json). The clean public candidate now has 608 hash-verified files, 265 HTML pages, 200 distinct events and 6,669 valid local links. Full unit tests passed 1,533/1,533; desktop Chrome and Pixel 7 passed 156 tests, with two review-only skips. All 42 new clips actually played on the owned HTTPS candidate; [playback.preview.json](playback.preview.json) retains real before/after state and duration checks. The Node 24 E2E JSON import gained its required `with { type: "json" }` attribute and passed independent review. The six standalone no-JavaScript tests initially used port 4321; setting the temporary configuration to the running port 14338 made all six pass, without changing assertions.
