# Decision 17 Phase 0 baseline and regression contract

- Date: 2026-08-14
- Authorized start: `02a43bbe9c880bcdb48596c912c81fe8a3a8f3ca`
- Runtime: Node `v24.14.0`
- Scope: `decision-17-case-filter-and-followup-notes-only`
- Status: Phase 0 complete; no product, content, policy, artifact, or service
  mutation

The clean-worktree preflight passed before the first write. The strict Decision
17 decision verifier, 30-document plan-binding verifier, and positive
authorization assertion all passed. The bound plan and authorization JSON were
not rebound or edited.

## Immutable governance and content

| Input                      | SHA-256                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| Decision 17 plan           | `845f2b6b694ace14fc65cf086c7fce95985acfb4d0f562dfaaab1f357e84078e` |
| Owner authorization JSON   | `cdb2b5838d66d50c74ac82346c06a4c1096d52422fa767e6b64d2f22c9ba8080` |
| Phase 0 canonical baseline | `f33ec875b74869b2d735684ef2f4d089815e81192f1d11df6d62b9c9b45489b4` |

The canonical ledger is
`docs/reviews/evidence/decision-17/p0/authorized-start-baseline.v1.json`. It
contains all 26 case byte hashes, clinical-core digests, exact reviewer fields,
legacy confirmed-update source identities, the complete 30-file clinical
freeze, all 21 current cover byte rows, registry v1-v8 and policy v1-v9
bindings, protected UI/tooling hashes, noindex state, and the historical review
artifacts. No follow-up sidecar directory or JSON file existed at the
authorized start.

| Protected set                  |                                                             Actual |
| ------------------------------ | -----------------------------------------------------------------: |
| Case v1 files                  |                                               26/26 byte-identical |
| Approved clinical-core lineage |                                                        26/26 exact |
| Complete clinical freeze       |                                               30/30 byte-identical |
| Clinical aggregate             | `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73` |
| Current cover files            |                                               21/21 byte-identical |
| Cover path/SHA ledger          | `625b47f92ad0e4706872e92ea7c7fd92e25c4dfd21dd219feb59154571db15dd` |
| Player-photo registry v8       | `908ccc9c1d9aeee56c907a476701c8875914af5090614c36271a76447057084a` |

All 26 case reviews remain `approved` by `吳易澄醫師`, qualification
`復健科專科醫師`, and every `reviewedContentDigest` equals the unchanged
`computeCaseContentDigest()` result.

## Frozen video-source partition

The exhaustive baseline derivation reproduced the plan's exact partition:

- `youtube-embed`: 7
- `nba-plain-text-citation`: 18
- `external-link`: 1 (`anthony-edwards-ankle-sprain-2023`)

The complete named membership is in the canonical ledger. NBA host detection
has precedence over generic external-link status. Unknown provider/host/status
combinations fail closed.

## Rights, private state, and Decision 16 evidence

`npm run brand:verify` passed with the ShareAlike composition scanner active.
The site remains `siteStatus=medical-review` and `allowIndexing=false`.
Read-only observation showed the existing launchd label with exit-status column
`0` and one listener on `100.114.3.93:8140`; no service action occurred.

The Decision 16 partial-completion evidence remains byte-identical at
`3a043231c575aa8c204bb0ab4664962fbbc1b36148b8a3ca9fea90ccd750194e`.
Decision 17 did not invoke or repair `private:verify`: the recorded default TTY
outcome remains `credential-invalid`, and the local-file outcome remains
`transport-failed`. The committed historical artifacts at this baseline are:

| Artifact                  | SHA-256 / count                                                    |
| ------------------------- | ------------------------------------------------------------------ |
| `review-set.v1.json`      | `99f637a0f2195614ff84b9afbdafb236039efcadb4eb7510e66af43f855f58da` |
| private manifest          | `6e236ae2ced75a1df030ca1c7c8008dbc67c24a48c9ac8769b862ca7e9d6ca03` |
| private manifest paths    | 918                                                                |
| historical served receipt | `7a6cc42cbd63a29130e51db891051dddc35b73a886cf65bfaaf5ff9538a5e2e0` |

## Regression contract and validation

The pure Decision 17 contract rejects changed clinical bytes or aggregate,
review identity/digest drift, changed cover bytes/selection ledger/registry,
7/18/1 membership drift, a disabled CC BY-SA firewall, any NBA navigation
sink, missing digest DOM values, and any new unauthorized medical approval
state.

All commands below used Node `v24.14.0`:

| Gate                         | Result                                          |
| ---------------------------- | ----------------------------------------------- |
| `decision17:baseline:check`  | passed; exact `f33ec875…489b4`                  |
| `decision17:contract:check`  | passed; 1 file, 7/7 tests                       |
| `decision13:clinical-freeze` | passed; 30/30                                   |
| `player-photos:v8:check`     | passed; exact registry digest                   |
| `source-policy:v9:check`     | passed; exact policy digest                     |
| `brand:verify`               | passed; ShareAlike composition isolation active |
| `tsc --noEmit`               | passed                                          |
| `git diff --check`           | passed                                          |

Phase 0 changes only the D17 baseline generator/ledger, pure regression
contract/tests, package command wiring, and this report. It does not change a
case, clinical statement, cover, registry, source policy, review set, private
manifest, receipt, `dist`, service, credential, listener, index state, remote
repository, or either immutable governance file.
