# Decision 17 Phase 1 video-source filter evidence

- Date: 2026-08-14
- Runtime: Node `v24.14.0`
- Scope: Decision A only
- Status: complete; no case, clinical prose, cover, policy, review artifact,
  committed `dist`, or service mutation

## Filter contract and UI

The review UI now exposes ten non-classic dimensions plus the existing classic
checkbox. The new `videoSource` select carries exactly these controlled values
and visible labels:

| Token                     | Visible label      | Actual cases |
| ------------------------- | ------------------ | -----------: |
| `youtube-embed`           | 站內 YouTube 嵌入  |            7 |
| `nba-plain-text-citation` | NBA 官網純文字引註 |           18 |
| `external-link`           | 外部連結           |            1 |

NBA host detection precedes generic `external-link-only` handling. The sole
external-link case is `anthony-edwards-ankle-sprain-2023`, whose governed
provider is YouTube but whose embed status is external-link-only. Unknown
providers, mismatched provider/host facts, and unclassified statuses throw.

The token is included in review/public minimal index entries, pure compound
matching, empty-state detection, form read/prefill, deterministic query
parse/serialization, and reset. No canonical URL, publisher, citation HTML, or
other source fact was added to a shard. The private-manifest exact-key and
controlled-token validator was extended with the same one field.

## Exact real membership

`youtube-embed` contains Anfernee Simons 2023, Jayson Tatum 2025, Kevin Durant
Achilles 2019, Kyrie Irving ankle 2021, LaMelo Ball 2023, LaMelo Ball 2025,
and Tyrese Haliburton 2025. `external-link` contains only Anthony Edwards 2023. The remaining 18 named cases are `nba-plain-text-citation`; their exact
membership remains bound in the Phase 0 canonical ledger and the real-content
unit test.

## NBA zero-link artifact scan

A review build was generated only under the disposable path
`/tmp/atlas-d17-a-02a43bb/dist` and removed after inspection. It did not touch
the repository `dist`. The scanner parsed every generated HTML node and
checked all attributes, scripts, and JSON-LD, then separately parsed every
case-index shard.

| Check                                        | Actual |
| -------------------------------------------- | -----: |
| Generated HTML pages parsed                  |     42 |
| Case-index shards parsed                     |      3 |
| Case-index rows                              |     26 |
| NBA navigation/metadata/script sinks         |      0 |
| Shards containing `nba.com`                  |      0 |
| Rows carrying only `nba-plain-text-citation` |     18 |

Existing case citations continue through the central NBA-safe renderer, so
the full URL remains visible as literal text while no anchor, iframe,
redirect, metadata target, JSON-LD URL, or script target is generated.

## Validation

| Gate                                        | Result                                         |
| ------------------------------------------- | ---------------------------------------------- |
| Filter/index/private-manifest focused tests | 9 files, 132/132 tests passed                  |
| `tsc --noEmit`                              | passed                                         |
| Astro diagnostics                           | 0 errors, 0 warnings; 16 pre-existing hints    |
| Protected D17 baseline                      | passed; exact historical ledger digest         |
| Clinical freeze                             | 30/30 byte-identical                           |
| Player-photo registry v8                    | exact digest passed                            |
| `brand:verify`                              | passed; ShareAlike composition firewall active |
| `git diff --check`                          | passed                                         |

The Phase 0 checker was narrowed to compare its historical ledger against only
the genuinely immutable projection. This prevents expected A/B/C source-code
changes from being mislabeled as clinical or cover drift while continuing to
fail on case/core/review, cover, policy v1-v9, registry v1-v8, noindex, plan,
authorization, and clinical-digest changes.
