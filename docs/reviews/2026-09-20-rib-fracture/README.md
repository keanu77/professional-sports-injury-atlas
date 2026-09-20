# Rib fracture three-case review — 2026-09-20

## Scope and evidence

Adds Fernando Alonso (2016), Drew Brees (2020), and Tua Tagovailoa (2021) as observation pages, with three selected videos. Source URLs and claim-level indices are in `src/data/videos/event-rib-fracture-three.v1.json`.

The main agent independently opened the primary F1, Saints, Dolphins and NFL sources and general NHS/MedlinePlus guidance. A user-approved GPT-5.6 Sol agent performed read-only source verification and reviewed the final data. Model agreement is not a clinical source.

- Alonso: distinguish the March 20 accident, March 31 diagnosis disclosure, April 15 clearance and April 17 actual race return.
- Brees: distinguish November 8 and November 15 injuries, December 19 activation and December 20 actual return. Do not attribute every fracture to one tackle or display a single recovery-day count.
- Tua: distinguish the early video/negative initial X-ray from subsequent coach-confirmed fractures, and October 16 activation from October 17 return. Keep the 2021 rib event separate from the 2024 concussion.
- General rib guidance is not an individual treatment plan or return-to-play clearance. Serious trauma and worsening respiratory symptoms require urgent assessment.

## Playback and assets

The approved browser interface observed all three YouTube watch pages playing on September 20. These are watch-page checks, **not owned-HTTPS embedded-player release proof**:

| Video ID    | Observed playing time                                                         | Observed duration (seconds) |
| ----------- | ----------------------------------------------------------------------------- | --------------------------- |
| x45fLUTHCuk | approximately 00:02 before reaching the end                                   | 68.261                      |
| _jrPqJow81Q | 14.488, then 38.902122 (paused false, readyState 4 at the latter observation) | 453.581                     |
| JckTrmIPRK8 | 10.13 before reaching the end                                                 | 250.621                     |

Only the three default thumbnail JPEGs were downloaded; exact URLs and SHA-256 hashes are recorded in the thumbnail provenance manifest. No complete video was downloaded.

The release checker accepts a new `playback.preview.json` only when present and valid under the existing ownership, HTTPS, recency and actual playback rules. No such proof is fabricated from these watch-page checks.

## Verification log

- TDD: the initial five integration tests failed on absent cases/inventory before implementation, then passed after integration. A sixth negative schema test was added.
- Astro check: 0 errors, 0 warnings, 16 existing-code hints.
- Initial full unit run: 1498/1502 passed. One computed inventory assertion needed the new batch; three corpus tests rejected uncommitted paths. The inventory assertion was corrected. Content check and review build also require a clean corpus checkout.
- The user's pre-existing `.claude/HANDOFF.md` is untouched and excluded from implementation commits. Its SHA-256 at validation preparation: `d3653a425c13a348e413dbc6f1bcfd53970b144ace4b0b077568386ed99d8e75`.
- Clean validation checkout of implementation commit `e4a75e6` at `/private/tmp/atlas-rib-validation.xCE9Wd`: 98 unit test files / 1502 tests passed; content check and brand/asset provenance check passed; review build generated 227 pages. The clean copy is for validation only; implementation remains on the user's selected branch.
- Desktop Chrome and Pixel 7: 36 regression checks passed (new cases, search, Judge, observation pages); the two review-only noindex checks were skipped in that launch-enabled invocation and then explicitly run without the launch flag, both passed. Total: 38 executed checks passed across the two invocations.
- Manual local UI check at `http://127.0.0.1:14319`: all three pages rendered their source-linked information and click-to-load controls. Brees and Tua embedded players loaded; actual embedded playback advancement was not verified. Alonso's embedded player failed to load on two attempts and correctly offered retry/original-video fallback. The cause is not established, and this is not proof of production unavailability or a passing playback gate.
- Remaining release requirement: verify actual embedded playback of all three on an owned HTTPS preview, investigate Alonso's failure if reproduced, then satisfy existing release gates. No preview upload, production deployment, push, or merge was performed.

## HTTPS preview and release diagnosis — subsequent continuation

The user requested continuation. A fresh validation run passed all 1502 unit tests, Astro check (0 errors, 0 warnings, 16 existing hints), content and brand checks. Dependencies, environment bindings and database migrations are unchanged. The existing loopback URL in the original approval contract is historical; the public artifact check confirms no loopback URLs or internal review pages leak into the built HTML.

The rendering input digest was updated in commit `8532566` without changing clinical approval, original approval timestamps, or playback requirements. Public-mode artifact checks passed: 200 pages, 7 core cases, 147 observation pages and 4632 local links. Desktop/mobile public-artifact regression: 36 passed, 2 review-only assertions skipped as intended.

An independent preview was deployed from that commit:

- Immutable deployment: https://7679b6b3.sports-injury-atlas.pages.dev
- Preview branch: `rib-fracture-preview`
- Alonso page: https://7679b6b3.sports-injury-atlas.pages.dev/videos/fernando-alonso-2016-rib/
- Production was not changed; previous good production remains deployment `4b8d4357-dd07-4de3-bca2-49a328af7a91` from `1bea30a`.

### Confirmed Alonso blocker

The browser reproduced the embedded-player failure on the owned HTTPS preview. The original YouTube watch page still played. Opening YouTube's own Share → Embed preview displayed a copyright-owner restriction naming Formula One Management: playback on this website or application is prohibited, and the viewer must watch on YouTube. Thus the selected `x45fLUTHCuk` cannot be treated as a verified native embed in the current environment. The restriction was observed through the official visible player UI, not inferred from an oEmbed result or a generic app error.

No player restriction was bypassed, no substitute video was chosen, and no successful embedded-playback proof was created. Selecting a different Alonso video or changing that case to an external-link presentation requires a user decision and corresponding explicit validation/policy updates.

### Other remaining release checks

The fresh release check also failed on expired seven-day playback evidence for `CASE-NBAANKLE-2023-004`; additional historical batches contain expired evidence. These records must be genuinely reverified before release, not timestamp-refreshed. Brees and Tua still need their owned-HTTPS actual-playback evidence. Production deployment and GitHub push remain pending; the pre-existing `.claude/HANDOFF.md` remains untouched.
