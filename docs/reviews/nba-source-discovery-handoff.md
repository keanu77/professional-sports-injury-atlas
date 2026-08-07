# NBA source discovery to case-authoring handoff — 2026-08-08

Status: Task 5 is frozen, registered, validated, and committed. This Task 6
record transfers source-curation evidence only. It does not authorize case or
medical authoring, medical approval, public release, rights clearance, hosting,
deployment, remote creation, push, or indexing.

## Repository and authority snapshot

- Branch: `main`.
- Task 5 commit: `e26d24c6288c73df8733f0aaf9e60177c778e965`
  (`research: freeze NBA authoring manifest`).
- The worktree was clean immediately before this handoff file was created.
- Manifest ID: `NBA-SOURCE-2026-08-06-001`; batch type `launch`; period
  `2026-08-06`; source policy `nba-v2`; cutoff `2016-08-06`.
- The exact `reviewedBy` value copied from the durable source-review decision is
  `吳易澄醫師`; `reviewedAt` is `2026-08-07T15:31:19Z`. This is source review,
  not medical-content approval.
- Candidate-set digest:
  `c217953f242492a1e84291e40c592a5fa4824edcde0434733bccb41622add8e5`.

## Frozen artifacts and byte digests

Every digest below is SHA-256 over the exact committed file bytes.

<!-- prettier-ignore -->
| Artifact | Path | SHA-256 |
| --- | --- | --- |
| Canonical authoring manifest | `research/source-manifests/NBA-SOURCE-2026-08-06-001.v1.json` | `8beedf3fcc0c7c498bf08ffb2fbc671759e7a61ed4e04f09afab579b6a86eb4d` |
| Durable source-review decision | `research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json` | `cd40d39d8c3463c0bb2cbdb1125a613cf1100d341bb8c6f4d59456462875ad0c` |
| Post-append source-manifest registry | `research/source-manifest-registry.v1.json` | `0e1b0279eabc5c0dccee52cf498242242acd3c38801056b4a213369bb4b3fc30` |
| ACL candidate ledger | `research/candidates/acl.csv` | `4fe56848a411796a11438c9149c7a233d26c184ada47b1dbf4bcf1d0516036a4` |
| Ankle-sprain candidate ledger | `research/candidates/ankle-sprain.csv` | `a0d7155ad168396e218d8079e698dfc2938f5b19f1f1924defd8df673232c15a` |
| Achilles-rupture candidate ledger | `research/candidates/achilles-rupture.csv` | `9dfda35317485f40bd5bf8798da30f3cf3f639111b1e332ff5b3e39bede909ad` |
| Live-verification artifact | `research/verification/nba-source-verification.v1.json` | `aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0` |
| Strict root-source audit | `research/reviews/root-source-audit.v1.json` | `15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76` |
| Machine-readable source policy | `research/source-policy/source-policy.v2.json` | `6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07` |
| Human-readable source policy | `research/source-policy/nba.v2.md` | `b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570` |

The registry entry binds the manifest and decision paths/digests above. Its
`previousRegistryBytesDigest` is
`eaf741c591ae9eb798b55a703ddadfeec7c803b91b3199272a7ccd39e56160c1`,
the SHA-256 of the exact prior canonical bytes
`{"entries":[],"schemaVersion":1}` with no trailing newline. The registry
entry has `supersedes=[]`.

## Exact manifest composition

<!-- prettier-ignore -->
| Measure | ACL | Ankle sprain | Achilles rupture | Total |
| --- | ---: | ---: | ---: | ---: |
| Source-verified manifest entries | 7 | 12 | 7 | 26 |

- Recent: 26.
- Classic: 0.
- Embed status `verified`: 1.
- Embed status `external-link-only`: 25.
- The decision and manifest both bind `classicProposalCandidateIds=[]`.
- The complete ledgers contain 69 rows. The 43 rows outside the manifest are
  enumerated below: 42 `needs-source` and one `excluded`.

## URLs requiring a future recheck

The frozen verification artifact contains 104 result slots: diagnosis source,
event source, video, and video channel for each of the 26 manifest candidates.
All 104 were recorded as `reachable` with HTTP 200 at the artifact-level
`checkedAt` value `2026-08-07T15:10:13Z`. Event and video URLs are equal for
each candidate, so the table collapses those two slots. There are 52 unique
URLs across the artifact. All 104 results have
`metadataComparison=not-obtained`; the one applicable YouTube API observation
has `youtubeApiStatus=not-obtained`. The table preserves the exact four-slot
mapping per candidate: diagnosis source 1, event, video (the repeated
event/video cell), and channel. No live recheck was performed for this handoff.

Reachability is a dated observation, not a permanent guarantee, embed/right
clearance, medical approval, or publication authorization. A later authorized
authoring/review cycle must recheck every URL from its original page before
relying on it; it must preserve any drift or unavailability rather than repair
it by inference.

<!-- prettier-ignore -->
| Candidate ID | Diagnosis source 1 | Event/video source | Video channel |
| --- | --- | --- | --- |
| `CAND-NBA-ACL-2021-009` | <https://www.nba.com/magic/news/magic-sweep-mini-series-against-cavs-lose-markelle-fultz-torn-acl-20210106> | <https://www.nba.com/watch/video/markelle-fultz-goes-down-with-leg-injury> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACL-2021-010` | <https://www.nba.com/wizards/thomas-bryant-injury-update-1-10-21> | <https://www.nba.com/watch/video/thomas-bryant-leaves-with-leg-injury> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACL-2021-015` | <https://www.nba.com/cavaliers/releases/rubio-status-update-211229> | <https://www.nba.com/watch/video/20211228rubioinjury> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACL-2022-016` | <https://www.nba.com/jazz/news/joe-ingles-injury-update> | <https://www.nba.com/watch/video/20220130joeinglesinjury> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACL-2022-017` | <https://www.nba.com/news/76ers-guard-danny-green-exits-game-6-with-left-knee-injury> | <https://www.nba.com/watch/video/danny-green-leaves-the-game-due-to-injury> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACL-2024-023` | <https://www.nba.com/magic/news/orlando-magic-center-moe-wagner-suffers-torn-acl-injury-update-20241222> | <https://www.nba.com/watch/video/moritz-wagner-left-knee-injury-heat-magic-dec-21> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACL-2025-021` | <https://www.nba.com/news/kyrie-irving-knee-injury-mavericks-kings> | <https://www.nba.com/watch/video/kyrie-irving-left-knee-sprain-injury-kings-mavericks-march-3> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ANKLE-2020-002` | <https://www.nba.com/news/cj-mccollum-exits-left-ankle-sprain> | <https://www.nba.com/watch/video/cj-mccollum-exits-after-an-ankle-injury> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ANKLE-2020-001` | <https://www.nba.com/news/ja-morant-out-3-5-weeks-with-grade-2-ankle-sprain> | <https://www.nba.com/watch/video/morant-injures-ankle-exits-in-wheelchair> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ANKLE-2021-003` | <https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return> | <https://www.nba.com/news/lebron-james-leaves-lakers-game-with-right-ankle-injury-will-not-return> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ANKLE-2021-001` | <https://www.nba.com/news/report-trae-youngs-ankle-injury-not-considered-serious> | <https://www.nba.com/watch/video/traeinjuryvsknicks> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ANKLE-2021-002` | <https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain> | <https://www.nba.com/news/kyrie-irving-exits-game-4-with-right-ankle-sprain> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ANKLE-2022-001` | <https://www.nba.com/news/lamelo-ball-reinjures-ankle-after-stepping-on-fans-foot> | <https://www.nba.com/watch/video/lamelo-ball-leaves-game-with-left-ankle-injury> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ANKLE-2023-004` | <https://www.nba.com/news/blazers-anfernee-simons-injury-update> | <https://www.nba.com/watch/video/anfernee-simons-leaves-the-game-due-to-injury> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ANKLE-2023-001` | <https://www.nba.com/news/anthony-edwards-sprains-right-ankle-exits-early-vs-bulls> | <https://www.youtube.com/watch?v=V9mtX4mE8wQ> | <https://www.youtube.com/@espn> |
| `CAND-NBA-ANKLE-2023-008` | <https://www.nba.com/news/hornets-lamelo-ball-out-right-ankle-strain> | <https://www.nba.com/watch/video/lamelo-ball-leaves-the-game-with-a-right-leg-injury> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ANKLE-2024-001` | <https://www.nba.com/suns/news/12-05-2024-suns-vs-pelicans-game-preview> | <https://www.nba.com/watch/video/kevin-durant-left-ankle-sprain-injury-suns-spurs-dec-3> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ANKLE-2025-002` | <https://www.nba.com/news/hornets-lamelo-ball-injury-update> | <https://www.nba.com/watch/video/lamelo-ball-left-ankle-sprain-injury-lakers-hornets-jan-27> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ANKLE-2025-001` | <https://www.nba.com/news/nightly-pulse-nba-news-highlights-from-april-3> | <https://www.nba.com/watch/video/anthony-edwards-ankle-injury-scare-heads-to-locker-room> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACHILLES-2019-005` | <https://www.nba.com/news/warriors-durant-achilles-injury-update> | <https://www.nba.com/watch/video/kevin-durant-leaves-game-5-with-injury> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACHILLES-2020-008` | <https://www.nba.com/news/dwight-powell-has-surgery-achilles> | <https://www.nba.com/watch/video/dwight-powell-injury> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACHILLES-2023-010` | <https://www.nba.com/grizzlies/news/memphis-grizzlies-medical-update-030423> | <https://www.nba.com/watch/video/brandon-clarke-leaves-the-game-due-to-injury> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACHILLES-2025-014` | <https://www.nba.com/news/pelicans-murray-injury> | <https://www.nba.com/watch/video/dejounte-murray-right-leg-injury-pelicans-celtics-jan-31> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACHILLES-2025-015` | <https://www.nba.com/bucks/news/medical-update-on-damian-lillard-3> | <https://www.nba.com/watch/video/damian-lillard-lower-left-leg-injury-exits-1st-quarter-game-4-pacers> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACHILLES-2025-016` | <https://www.nba.com/celtics/news/press-release-20250513-jayson-tatum-injury-update> | <https://www.nba.com/watch/video/jayson-tatum-right-lower-leg-injury-celtics-knicks-game-4> | <https://www.nba.com/watch/featured> |
| `CAND-NBA-ACHILLES-2025-017` | <https://www.nba.com/pacers/news/indiana-pacers-medical-update-tyrese-haliburton-250623> | <https://www.nba.com/watch/video/tyrese-haliburton-right-leg-injury-pacers-thunder-game-7-2025-nba-finals> | <https://www.nba.com/watch/featured> |

## All 43 non-manifest candidate rows

These values are transcribed from the exact three committed CSVs. In
particular, every `needs-source` row has an empty `exclusion_reason` field. The
handoff records that empty string as-is and does not invent or promote a more
specific reason from contextual discovery notes.

### ACL — 16 `needs-source`

<!-- prettier-ignore -->
| Candidate ID | Exact `discovery_status` | Exact `exclusion_reason` |
| --- | --- | --- |
| `CAND-NBA-ACL-2012-001` | `needs-source` | empty string |
| `CAND-NBA-ACL-2017-002` | `needs-source` | empty string |
| `CAND-NBA-ACL-2017-003` | `needs-source` | empty string |
| `CAND-NBA-ACL-2018-004` | `needs-source` | empty string |
| `CAND-NBA-ACL-2018-005` | `needs-source` | empty string |
| `CAND-NBA-ACL-2019-006` | `needs-source` | empty string |
| `CAND-NBA-ACL-2020-007` | `needs-source` | empty string |
| `CAND-NBA-ACL-2020-008` | `needs-source` | empty string |
| `CAND-NBA-ACL-2021-011` | `needs-source` | empty string |
| `CAND-NBA-ACL-2021-012` | `needs-source` | empty string |
| `CAND-NBA-ACL-2021-013` | `needs-source` | empty string |
| `CAND-NBA-ACL-2021-014` | `needs-source` | empty string |
| `CAND-NBA-ACL-2023-018` | `needs-source` | empty string |
| `CAND-NBA-ACL-2021-019` | `needs-source` | empty string |
| `CAND-NBA-ACL-2024-020` | `needs-source` | empty string |
| `CAND-NBA-ACL-2026-022` | `needs-source` | empty string |

### Ankle sprain — 15 `needs-source`, one `excluded`

<!-- prettier-ignore -->
| Candidate ID | Exact `discovery_status` | Exact `exclusion_reason` |
| --- | --- | --- |
| `CAND-NBA-ANKLE-2025-003` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2023-002` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2023-003` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2022-002` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2013-001` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2017-001` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2023-005` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2021-004` | `excluded` | Follow-up MRI reported a right-foot bone bruise, so this is not retained as a confirmed ankle-sprain case. |
| `CAND-NBA-ANKLE-2017-002` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2023-006` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2026-001` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2025-004` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2022-003` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2023-007` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2022-004` | `needs-source` | empty string |
| `CAND-NBA-ANKLE-2000-001` | `needs-source` | empty string |

### Achilles rupture — 11 `needs-source`

<!-- prettier-ignore -->
| Candidate ID | Exact `discovery_status` | Exact `exclusion_reason` |
| --- | --- | --- |
| `CAND-NBA-ACHILLES-2013-001` | `needs-source` | empty string |
| `CAND-NBA-ACHILLES-2017-002` | `needs-source` | empty string |
| `CAND-NBA-ACHILLES-2018-003` | `needs-source` | empty string |
| `CAND-NBA-ACHILLES-2019-004` | `needs-source` | empty string |
| `CAND-NBA-ACHILLES-2019-006` | `needs-source` | empty string |
| `CAND-NBA-ACHILLES-2019-007` | `needs-source` | empty string |
| `CAND-NBA-ACHILLES-2020-009` | `needs-source` | empty string |
| `CAND-NBA-ACHILLES-2024-011` | `needs-source` | empty string |
| `CAND-NBA-ACHILLES-2024-012` | `needs-source` | empty string |
| `CAND-NBA-ACHILLES-2024-013` | `needs-source` | empty string |
| `CAND-NBA-ACHILLES-2015-018` | `needs-source` | empty string |

## Verification date and no-download confirmation

- Live-verification artifact date: `2026-08-07`; exact `checkedAt`:
  `2026-08-07T15:10:13Z`.
- The frozen `nba-v2` policy has `downloadAllowed=false`,
  `downloadIntoRepository=false`, `reproductionOrReuploadAllowed=false`, and
  `screenshotCaptureOrStorage=false`.
- The three discovery logs and the strict root audit record that no video,
  audio, screenshot, thumbnail, transcript, article body, or other source media
  was downloaded, captured, copied, stored, or reuploaded. Only bounded factual
  metadata, short paraphrases, URLs, and verification outcomes were retained.
- This handoff preparation used local frozen files only. It made no web request,
  opened no player, downloaded no media, and changed no source artifact.

## Task 5 checks — executed results

The following read-only Task 5 revalidation was executed on `main` at commit
`e26d24c` under Node `24.14.0` during handoff preparation. These are completed
results, not Task 6 projections.

```text
mise exec node@24.14.0 -- npm run research:check-manifest
  exit 0
  research:check-manifest OK manifest=NBA-SOURCE-2026-08-06-001 entries=26 digest=8beedf3fcc0c7c498bf08ffb2fbc671759e7a61ed4e04f09afab579b6a86eb4d

mise exec node@24.14.0 -- npm run research:registry:check
  exit 0
  research:registry:check OK entries=1 digest=0e1b0279eabc5c0dccee52cf498242242acd3c38801056b4a213369bb4b3fc30

mise exec node@24.14.0 -- npm run research:digest
  exit 0
  8beedf3fcc0c7c498bf08ffb2fbc671759e7a61ed4e04f09afab579b6a86eb4d

mise exec node@24.14.0 -- npm run test:unit -- tests/unit/research-manifest.test.ts tests/unit/source-manifest-registry.test.ts tests/unit/research-manifest-transaction.test.ts
  exit 0
  Test Files 3 passed (3); Tests 69 passed (69)
```

The generator and live verifier were deliberately not rerun after the durable
decision. Only read-only checkers and tests were used here.

## Task 6 bounded gate — executed results

All final commands below ran under Node `24.14.0`. The date-stamped controlled
plan was initially drafted before binding; the first attempted `npm run verify`
stopped immediately at its first fail-closed gate with
`controlled document ...nba-injury-case-authoring.md exists but is not bound`.
No later verify step ran in that attempt. The plan bytes were then finalized,
machine-checked against all 26 manifest entries, bound exactly as
`not-authorized`, and the complete Task 6 gate was restarted from `npm ci`.

The resulting authoring-plan authority is:

- Path: `docs/superpowers/plans/2026-08-08-nba-injury-case-authoring.md`.
- SHA-256: `19194fbd3b2660e6ab9831b8b75724038d8f419796600cfa7c62d0b006ed60ef`.
- Role/scope: `nba-injury-case-authoring` /
  `nba-medical-content-authoring-only`.
- Closed scopes: `deployment`, `private-hosting`, `public-release`.
- Binding status: `not-authorized`; decision path and digest are both `null`.
- Post-bind `docs/decisions/plan-binding.v1.json` SHA-256:
  `2a66a1b2825c077fa81906aa471df41b19dd8569343e723d8561d1df7ba681e4`.
- `plan:verify` exited 0 with 11 bound documents. A separate
  `plan:assert-authorized` check exited 1 with the expected `not authorized`
  result; the enclosing negative assertion exited 0.

<!-- prettier-ignore -->
| Final command under Node 24.14.0 | Actual result |
| --- | --- |
| `mise exec node@24.14.0 -- npm ci` | exit 0; 439 packages installed; audit found 0 vulnerabilities |
| `mise exec node@24.14.0 -- npm run research:check` | exit 0; 69 ledger rows; source-ready audit queue 26; ACL/ankle/Achilles source-verified counts 7/12/7 |
| `mise exec node@24.14.0 -- npm run research:check-verification` | exit 0; candidates 26; URL-kind checks 104 |
| `mise exec node@24.14.0 -- npm run research:check-manifest` | exit 0; entries 26; digest `8beedf3fcc0c7c498bf08ffb2fbc671759e7a61ed4e04f09afab579b6a86eb4d` |
| `mise exec node@24.14.0 -- npm run research:registry:check` | exit 0; entries 1; digest `0e1b0279eabc5c0dccee52cf498242242acd3c38801056b4a213369bb4b3fc30` |
| `mise exec node@24.14.0 -- npm run research:digest` | exit 0; digest `8beedf3fcc0c7c498bf08ffb2fbc671759e7a61ed4e04f09afab579b6a86eb4d` |
| `mise exec node@24.14.0 -- npm run verify` | exit 0; complete aggregate gate passed |

The final aggregate verify result included:

- plan binding and repository formatting passed;
- Astro diagnostics: 0 errors, 0 warnings, and one non-failing existing hint;
- `content:check`: 0 cases, 0 overviews, 0 updates, the legitimate
  pre-authoring state;
- 35 unit-test files and 616 tests passed; statement coverage 85.96%;
- review build produced 11 pages;
- 152 Playwright tests passed across the configured browser/device projects;
- all six Lighthouse routes passed (accessibility 0.98–1.00, LCP
  1503–1505 ms);
- brand verification passed; and
- review-artifact verification passed for 11 pages with zero case pages,
  noindex on every page, and no sitemap, analytics, iframe, or preconnect.

Public release was then tested separately:

```bash
set +e
mise exec node@24.14.0 -- npm run release:public
public_release_exit=$?
set -e
test "$public_release_exit" -ne 0
```

`release:public` exited 1 with 21 closed-gate issues and the final negative
assertion exited 0. The unchanged failures include 0 public cases against the
10-per-injury/30-total floors, missing medical/public-rights/review-set/hosting
evidence, `siteStatus=medical-review`, `allowIndexing=false`, and indexing
authorization `not-requested`. No public build, hosting action, or indexing
change followed. The mutable live verifier and manifest generator were not
rerun.

## Explicit stop boundary

The manifest's `approved-for-authoring` status means only that its frozen source
curation may be handed to a later, separately authorized case-authoring plan.
It does not mean medically reviewed, medically approved, publicly licensed,
publicly releasable, privately hosted, deployed, or safe to index.

At this stop point:

- no case JSON, injury overview, baseline update, review-set content, clinical
  analysis, diagnosis interpretation, prognosis, or return-to-play advice has
  been authored;
- no medical-review status or medical approval has been granted;
- no remote was created and nothing was pushed;
- no hosting, deployment, DNS, public-release, or indexing action was taken;
- public release, private hosting, deployment, and indexing remain closed; and
- future work must start only from the registry-resolved manifest and a real,
  hash-bound case-authoring plan whose execution status remains
  `not-authorized` until a later owner decision.
