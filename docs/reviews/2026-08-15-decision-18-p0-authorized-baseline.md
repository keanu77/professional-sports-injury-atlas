# Decision 18 Phase 0 — Authorized baseline and professional-safety gate

Date: 2026-08-15

State: complete locally; no medical-review, hosting, release, or indexing
decision was made

## Authorized start

- Clean starting commit:
  `a41ec0372a189734d4827e4f01db25234f71dad0`.
- Node: `v24.14.0` from the owner-specified mise installation.
- Bound plan SHA-256:
  `e088f891838fdb9e05e554309af35f50ae9ab4b9b4b9db357918f8db6b818c04`.
- Authorization SHA-256:
  `f618de27bc7e556072371bab8f2ec3eadef88f829af7e1349c997060201ac452`.
- `plan:decision:verify`, `plan:verify` (32 documents), and
  `plan:assert-authorized` all passed with the exact Decision 18 role, scope,
  and seven closed scopes.

The canonical baseline is
`docs/reviews/evidence/decision-18/p0/authorized-start-baseline.v1.json`, SHA-256
`fa541c8a2c1fd476e41f0820fc40440f6d16fb2b1990cd14dc25053fef32c992`.

## Frozen inputs and starting counts

| Boundary                 | Result                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clinical freeze          | 30/30 byte-identical; 26 cases, three injury overviews, one quarterly update; aggregate `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73` |
| Current covers           | 21/21 byte-identical; ordered asset ledger `625b47f92ad0e4706872e92ea7c7fd92e25c4dfd21dd219feb59154571db15dd`                                              |
| Player-photo registry v8 | `908ccc9c1d9aeee56c907a476701c8875914af5090614c36271a76447057084a`                                                                                         |
| NBA v10 Markdown / JSON  | `34e05ef2b6c1f7fbfbafe9dbf5ae469394bcd3a7c6dc49b07f0468a566a5604c` / `9203384e5d8b551834e3de5c17a3cc2bff60f8e27416a3074897db861df9a4b3`                    |
| Decision 17 research     | 26 canonical ledgers, 104 category units, 104 one-query boundaries                                                                                         |
| Decision 17 sidecars     | 26 canonical sidecars, 44 pending items                                                                                                                    |
| Item kinds               | treatment 16; surgery 13; injection 0; actual-return 15                                                                                                    |
| Source tiers             | team/league official 29; mainstream media 14; unverified 1                                                                                                 |
| Review set v2            | `0962e04a3bc6a844518829ea462454384dbc6232198779bce0a303b211892b55`                                                                                         |
| Private manifest         | `45be696caa0e7127ed70066db895285f1d0c300ebfcea0e4f50d097f638cc5d5`                                                                                         |
| Served receipt           | `7a6cc42cbd63a29130e51db891051dddc35b73a886cf65bfaaf5ff9538a5e2e0`                                                                                         |
| Indexing                 | `allowIndexing=false`; site status `medical-review`                                                                                                        |

The new pure regression contract rejects drift in the authorized start,
clinical bytes and owner review lineage, covers and registry, NBA v10,
historical Decision 17 ledgers, review-set v2, private manifest, served
receipt, noindex state, CC BY-SA firewall, NBA navigation-sink state, pending
review state, and closed-scope mutation inventory. Seven focused negative and
positive tests passed.

## 26/26 professional-safety result

A review build was generated only at `/tmp/atlas-d18-p0.OqpKLl`; it produced
42 HTML pages and did not write repository `dist`.

The source-to-render checker passed all 26 real case pages:

- ACL: 7/7 say the video cannot replace clinical diagnosis.
- Ankle sprain: 12/12 say the image cannot distinguish the relevant injury
  and still require symptoms, palpation, weight-bearing ability, and an
  appropriate examination.
- Achilles rupture: 7/7 require clinical assessment, appropriate imaging
  when needed, and say video cannot establish rupture details.
- 26/26 render exactly one complete professional section containing the
  heading `臨床限制` and the source-equal non-empty
  `professional.clinicalLimitations` paragraph.
- 26/26 clinical-limitation claims bind valid `teaching-evidence` sources.

The existing follow-up DOM audit also passed against that temporary build:
26 cases, 44 pending items, three empty cases, 41 NBA follow-up citations,
and zero NBA navigation sinks.

## Validation and scope record

Passed commands:

- Decision 18 authorization, binding, and positive execution assertion;
- Decision 18 baseline generation and independent `--check`;
- Decision 18 professional-safety source/DOM check;
- Decision 18 regression contract: 1 file, 7/7 tests;
- Decision 17 follow-up generator check and built-DOM check;
- clinical freeze 30/30, player-photo v8, source-policy v10, brand/CC BY-SA,
  TypeScript `--noEmit`, scoped Prettier, and `git diff --check`.

Two preliminary command mistakes were not concealed: one shell invocation
omitted the required PATH and was rejected under Node 22 before validation;
the corrected command used Node 24.14.0. The historical Decision 17 baseline
checker also rejected the intentionally newer active plan-binding bytes, so a
Decision 18 baseline was added instead of weakening or rewriting Decision 17
history. A direct Prettier invocation on `.prettierignore` reported that the
ignore file has no parser; the supported changed source files subsequently
passed Prettier.

No case, injury overview, quarterly update, cover, registry, NBA policy,
Decision 17 ledger, follow-up sidecar, review artifact, repository `dist`,
private manifest, served receipt, service, deployment, remote repository,
medical-review decision, public-release state, or indexing state changed.
`private:manifest`, `private:verify`, `launchctl`, and served smoke were not
run because `hosting-service-mutation` is closed.
