# Decision 17 Phase 4 — review digest disclosure

- Date: 2026-08-14
- Scope: Decision C only
- State: implementation and pre-artifact verification complete; final built-DOM
  scan remains ordered after the review-set v2 commit in Phase 5

## Result

The review-only case identity block is now one native `<details>` element with
a direct `<summary>` named `審查識別與 digest` and no `open` attribute. It
remains in the same page position: follow-up reporting, sources, digest
disclosure, then related cases. No client script or hydration controls the
disclosure.

The closed disclosure still contains literal server-rendered values for the
record ID and three independently labelled readonly text inputs:

- approved case-content digest;
- rendered review-set digest;
- pending follow-up draft digest, visibly labelled `待醫師簽核` and carrying
  `data-review-status="pending-owner-signoff"`.

The existing real-route calls remain exactly
`computeCaseContentDigest(record)` and
`computeRenderedSetDigest(permitted)`. The pending digest is passed separately
from the validated follow-up sidecar; it was removed from the follow-up report
presentation rather than duplicated. No digest algorithm, approved-core
lineage, pending review state, case content, or review identity changed.

The summary keeps the browser's native disclosure marker with
`display: list-item`, a minimum 44 px target, visible focus styling, and no
JavaScript dependency. Each input has a scope-derived unique ID and exactly
one matching `label[for]`; its full 64-hex value is neither masked nor
truncated in the DOM.

## Verification

| Check                                              | Actual result                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Required runtime                                   | Node `v24.14.0`                                                                    |
| Phase C static Vitest                              | 1 file, 4/4 passed                                                                 |
| Focused component/follow-up Vitest                 | 2 files, 14/14 passed                                                              |
| TypeScript                                         | `npx tsc --noEmit`, exit 0                                                         |
| Astro diagnostics                                  | 260 files, 0 errors, 0 warnings, 16 pre-existing hints                             |
| Desktop/mobile native disclosure and 320 px reflow | Chromium + mobile Chromium, 4/4 passed                                             |
| JavaScript-disabled native disclosure              | Chromium, 1/1 passed                                                               |
| Accessibility                                      | axe checks passed open and at 320 px; summary target at least 44 px                |
| Copy/select and state                              | three values identical before open, after Enter/open/select, and after Space/close |
| Horizontal overflow                                | document and main each at most 1 px while the disclosure is open                   |

The deterministic built-DOM verifier
`scripts/verify-decision-17-c-digests.ts` is ready to inspect all 26 real case
pages plus the case-detail fixture. It requires one closed native disclosure
per page, exact record IDs, exact recomputed case/rendered-set/follow-up
digests, 81 readonly inputs inside the disclosures, unique IDs, and matching
labels. It has deliberately not been run against `dist` in this phase: the
authorized artifact sequence forbids the final review build before generation
and commit of `review/review-set.v2.json`. Phase 5 will record its actual
built-artifact result after that ordered build.

The first protected-baseline check reported `decision17-digest-dom` because
its source scan still required `data-record-id` to remain literally in the
case route after Phase C moved the complete block into the new server-rendered
component. The collector now checks the route and that component together;
it continues to require all four protected value tokens and does not alter the
committed Phase 0 evidence. The corrected check then passed with the original
evidence digest.

The desktop/mobile checks reused the already-running local Astro development
server on `127.0.0.1:4322`; no review artifact, private manifest, private-review
service action, or external service was created or changed.

## Protected boundaries

This phase does not modify case JSON, clinical prose, follow-up sidecars,
source policy, review-set artifacts, digest functions, covers, player-photo
registries, deployment/indexing configuration, plan/authorization bytes,
external accounts, or remote repositories. It makes no medical-review
decision and assigns no reviewer identity to pending content.
