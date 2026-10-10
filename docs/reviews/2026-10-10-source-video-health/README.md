# Source and video health repair — 2026-10-10

Base: `cc0b2feb0aac30747b7ed334ea722fb402dedbbb` (`main`, reconfirmed during
this session). Implementation: `7c409d6`. Work was performed in an independent
Mac Studio checkout; the original project was left untouched. This is a draft
PR repair, with no merge, production deployment, account changes or new tokens.

## Source results

The October 5 workflow reported eight source 404s, not eight unplayable videos.
A fresh October 10 baseline found **17** source 404 responses among 793 unique
URLs. We reviewed the live responses before changing references.

- **12 dead references repaired:** 11 substitutions and one consolidation
  into an existing original AP report. Seven Liverpool articles moved to the
  club's official legacy host; Arsenal's own reports replace the dead Wolves
  Bellerín report and Mead fixture URL; WTA's same article ID uses its current
  slug; an accessible AP syndication preserves the Judge return report; the
  original AP report already supports Nishikori's retained facts.
- **Four original Carolina Marín references retained:** the federation returned
  404 to the default client but 200 with the monitor's honest descriptive
  User-Agent. Their article text was reviewed. These are retrieval fixes, not
  four substituted references.
- **One unresolved 404 retained:** Liverpool's
  [Harvey Elliott friendly goal/assists report](https://www.liverpoolfc.com/news/watch-harvey-elliotts-goal-and-assists-friendly).
  An equivalent live primary replacement could not be confirmed. No timeline
  claim was fabricated or silently removed.

At `2026-10-10T14:14:34.500Z`, the repaired monitor checked **792** unique URLs:

| Result                              | Count |
| ----------------------------------- | ----: |
| Available HTTP response             |   665 |
| Confirmed 404                       |     1 |
| Access denied                       |    93 |
| Access challenge                    |    19 |
| Timeout after bounded retries       |    11 |
| Network error after bounded retries |     3 |

Thus **126 are indeterminate**, including 112 blocked/challenged responses.
All 12 repair targets and the four retained federation URLs returned 200 in
this run. See [source-repairs.json](source-repairs.json) for the reviewed
fact support and [local-health-summary.json](local-health-summary.json) for
every unavailable/indeterminate URL and its diagnostics.

The old monitor reported only 42 indeterminate URLs in the fresh baseline.
The new client receives 403 for 80 URLs that admitted the default client
(76 NBA/WNBA-family URLs, three L'Équipe and one USGA). A direct comparison
confirmed NBA returns 200 for the default client and 403 for the identified
monitor. We retain the blocking status. The change in count is not evidence
that these articles vanished; it is not corrected by disguising the client.
Bounded body reads also expose timeouts that the old header-only source check
did not measure. Results vary by network, location and publisher policy.

No event dates, diagnoses, treatment or return-to-play details changed.
Nishikori's redundant source #4 was removed and its two `[1,4]` bindings
consolidated to `[1]`; the AP source remains. Historical review snapshots and
clinical/playback/release approvals were not rewritten.

## Video coverage

- 199 YouTube public oEmbed responses contain valid metadata and matching
  iframe markup.
- The remaining video is MLB; its canonical page returned 200. This is page
  availability evidence, not YouTube metadata or embed verification.
- API embed capability checks completed: **0**. The 199 YouTube checks lack
  an existing authorized API key; the MLB provider does not support this API
  check. The artifact records all 200 as not checked, with separate reasons.
- Actual playback tests: **0**. No claim is made that all videos play or are
  embeddable. Public metadata and markup do not establish those facts.

The repository secret listing was empty and the local environment did not
provide `YOUTUBE_API_KEY`. No value was printed, token created, or account
permission changed. A future owner-authorized key can be configured through
GitHub's secret UI, followed by a workflow rerun; do not paste a key in chat.

## Monitor changes

Schema v2 distinguishes `not-found`, `gone`, access denials/challenges, rate
limits, server errors, timeout, network failure and malformed/oversized JSON.
It records redacted final URLs and attempt counts; timeouts and concurrency
limits include response-body consumption. Only transient failures receive one
retry. The public oEmbed iframe check requires the expected YouTube host and
video ID. API results require the matching item and a boolean embed flag.

Exit codes are 0 for completed implemented checks, 1 for confirmed failures,
and 2 for incomplete verification. A missing key remains incomplete rather
than passing. The current health result is intentionally **failed** because
one confirmed 404 remains. The workflow uploads diagnostics on failure and
runs on PRs as well as the existing manual/weekly schedule. It uses the
repository's required Node 24.14.0 and retains failing validation gates.

See the [operations guide](../../operations/source-video-health.md).

## Validation

Local validation used Node **24.14.0** on Mac Studio. Node 24.19.0 satisfies
package engines but is rejected by two existing exact-version image contracts;
the final suite and workflow use 24.14.0.

| Check                                     | Result                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Plan binding                              | Pass, 45 documents                                                                                      |
| Astro check                               | Pass, 397 files, 0 errors/warnings, 16 existing hints                                                   |
| Content check                             | Pass                                                                                                    |
| Full unit suite                           | **1,571 passed**, 105 files                                                                             |
| Health and catalog regression subset      | **41 passed**                                                                                           |
| Coverage gate                             | Fails existing 90% case-library thresholds; main has identical values                                   |
| Review build                              | Pass, 45 pages                                                                                          |
| Brand and review artifact                 | Pass                                                                                                    |
| Full E2E, four browsers                   | 316 passed, 24 failed, 380 skipped; pristine main has identical counts and failure list                 |
| Lighthouse                                | Existing homepage identity assertion fails before measurement; no score claimed                         |
| Full formatting                           | 164 historical files fail; all are unchanged from main                                                  |
| Changed-file formatting / diff whitespace | Pass                                                                                                    |
| Public release precondition               | Fails as expected: changed inputs are not covered by old release evidence; approvals were not rewritten |

An independent pristine-main checkout reproduced the coverage values:
lines **89.71%**, statements **88.93%**, branches **83.5%**. Its 1,545 unit
tests passed; the repair adds 26 health tests. E2E failures concern existing
navigation counts, homepage selectors, patient text and photo-policy text.
Review-mode skips are retained. This maintenance does not claim the full
`npm run verify` gate is green and does not broaden scope into unrelated UI,
coverage or historical-document cleanup.

Independent read-only QA passed the 32 health tests, four additional API
error/redaction scenarios and the 41-test health/catalog subset. It verified
377 untouched historical records remain byte-equivalent after the expected
citation transformation and 16 affected records preserve all non-citation
fields. Arsenal/AP syndication text was confirmed by the primary agent's local
HTTP retrieval; the independent web reader was blocked for those hosts.

## Remaining decisions

1. Keep the draft blocked on the unresolved Elliott source until a suitable
   primary replacement is available or an editor decides how to handle that
   claim. The 126 indeterminate sources require access-aware review, not mass
   deletion or an unavailable label.
2. Separately authorize use/configuration of an approved YouTube API key if
   API embed coverage is required; actual playback needs its own browser and
   region-aware verification, including MLB.
3. Track the existing formatting, coverage, E2E and Lighthouse failures
   separately. Do not lower thresholds or rewrite historical approvals.
4. Review and refresh production release evidence only through the established
   authorized release process. This PR does not authorize merge or deployment.
