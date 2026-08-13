# Decision 15 Phase 0 governance and v8 contract

- Date: 2026-08-14
- Scope: `decision-15-photo-first-covers-only`
- Status: Phase 0 contract and authorized-start baseline frozen
- Release state: private medical review; publication, deployment, indexing,
  hosting-service mutation, external-account mutation, and remote-repository
  mutation remain closed
- Authorized-start commit: `a184f55e6ed42dbdd7e14214f22761127927365c`
- Runtime: Node `v24.14.0`

Phase 0 verifies the owner-supplied Decision 15 authorization, freezes the
current 21-athlete/26-case cover projection, and implements a fail-closed
machine contract for the already committed immutable `nba-v8` policy. It does
not re-adjudicate or download a candidate, change a registry or current cover,
touch a clinical file, regenerate a review artifact, or mutate the private
service.

## Authorization and immutable governance inputs

The full Task 0 preflight passed from a clean worktree:

```text
node --version
v24.14.0

npm run plan:decision:verify -- --decision docs/decisions/2026-08-13-decision-15-photo-first-covers-authorization.v1.json --plan docs/superpowers/plans/2026-08-13-decision-15-photo-first-covers.md
e1354757fb25e6a3a72f2d7e69b04951044ae459b3033ab7529dc57add0aa97a

npm run plan:verify
plan binding verified: 26 bound documents

npm run plan:assert-authorized -- docs/superpowers/plans/2026-08-13-decision-15-photo-first-covers.md
positive authorization assertion for decision-15-photo-first-covers
```

| Input                    | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| Decision 15 plan         | `c437934088648ac2b31fbc65b5fe32726d201fad9b361c4c658afc46fe4ec86d` |
| Owner authorization JSON | `e1354757fb25e6a3a72f2d7e69b04951044ae459b3033ab7529dc57add0aa97a` |
| Authorized plan binding  | `caca757512554bedbc214d181d4e42fae3aff27cc5122e8754ea317a37c7357e` |

The plan and authorization JSON are immutable inputs. Phase 0 did not run
`plan:bind` and did not edit either file.

## Policy lineage and byte re-derivation

The machine baseline records exact Markdown/JSON digests for policy v1 through
v8. The controlling pair is:

| Policy input                                   | SHA-256                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `research/source-policy/nba.v7.md`             | `61ed88f92d80b77cd2c1410d03305215eedbb391356c073fb19fac944dea2fd1` |
| `research/source-policy/source-policy.v7.json` | `d1062c1ffa045397d13489319534acbfe24653615df5ce83aac40e40539a8b15` |
| `research/source-policy/nba.v8.md`             | `20a9209bd523604efe3251f6ef159e6432fa9280951ea16d630ee02cc347557d` |
| `research/source-policy/source-policy.v8.json` | `30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e` |

`scripts/research/generate-source-policy-v8.ts` starts from the exact v7 pair,
checks the immutable v8 Markdown and the frozen Decision 14 P2 ledger, applies
the explicit v8 delta, emits strict canonical JSON, and refuses any output
other than the already committed v8 digest. It changes neither policy file.
All root clinical/video/privacy fields compare equal between v7 and v8.

## Current cover and artifact baseline

The canonical machine snapshot is
`docs/reviews/evidence/decision-15/p0/current-cover-baseline.v1.json`, SHA-256
`60b6b2d5498d577f1774e5a02f8b0eb033d64f0ec1fe7f3b52d5a54070c60e11`.
It binds every current selection subtree and local asset, all policy versions,
registry v1 through v6, all 30 clinical files, review set, private manifest,
historical served receipt, noindex governance, notice/credit sources, and the
frozen service observation.

| Frozen partition         | Selections / cases | Selection aggregate                                                | Asset ledger                                                       |
| ------------------------ | -----------------: | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| All covers               |            21 / 26 | `0db111ee037d6a3f9907952fe7fdb31e860ffbd51b35286f5036b25ef4beca32` | `88fd6e1be6bee49ab525df8b1472f272322411a4795c12d3c87ac0427ee32cfd` |
| Protected current photos |              7 / 9 | complete subtrees embedded in baseline                             | `9c7807607077ef462adb34d129880ca36798b6aab44d2f91c5ef19ab351b8ce5` |
| Decision 15 target SVGs  |            14 / 17 | complete subtrees embedded in baseline                             | `02554c2cfe3f4a6d39459391206dae96bd2a8e88a8ebcac6bd5bc809c3fba6bb` |

The protected seven are CJ McCollum, Damian Lillard, Dwight Powell, Jayson
Tatum, Kevin Durant, Kyrie Irving, and LeBron James. The exact 14 targets are
Anfernee Simons, Anthony Edwards, Brandon Clarke, Danny Green, Dejounte Murray,
Ja Morant, Joe Ingles, LaMelo Ball, Markelle Fultz, Moritz Wagner, Ricky Rubio,
Thomas Bryant, Trae Young, and Tyrese Haliburton. Discovery or promotion
outside that set fails.

Registry v6 remains byte-identical at
`16851aaa3d1dd223f20f102ef543f104a23ee61335a796f4b70cbe75d76d5cf0`.
The review set remains `edad6e10575d848deb0cf79d784dce558ebff6ba96c061f257b05ea694e47051`;
the private manifest remains
`5f7df51aadb784cb290f3b870577b6fcd934707a25bae8b99386a2489e850339`
with 511 files; and the historical served receipt remains
`7a6cc42cbd63a29130e51db891051dddc35b73a886cf65bfaaf5ff9538a5e2e0`.
`allowIndexing=false` remains unchanged.

## Decision 15 field contract

The contract uses exactly these retained eligibility gates:

1. exact athlete and governed case mapping;
2. an affirmative supported CC marker or explicit PD/US-government marker on
   the exact Commons/Flickr work page;
3. exact CC name, version, terms link, displayed credit, supplied-title state,
   alteration, and all supplied notices, or an exact separate PD status/source
   record without an invented license;
4. platform-appropriate fixed source evidence and original-binary identity;
5. a verified different relationship from every governed injury event;
6. local byte length, MIME, dimensions, SHA-256, focal position, and 5:2/16:9
   subject safety before adoption;
7. personality/portrait-rights non-clearance; and
8. the CC BY-SA site-composition firewall and all closed scopes.

Supported CC tokens remain CC BY 2.0/3.0/4.0, CC BY-SA 2.0/3.0/4.0, and CC0
1.0. `PD-USGov-Military-Navy` is a positive `public-domain` fixture. All
Rights Reserved, missing/unknown/inconsistent/wrong-work markers, NC/ND,
thumbnail/screenshot-only input, and same or unresolved injury relationships
fail closed.

Commons evidence requires an exact description URL, fixed oldid/permalink,
revision timestamp, and original-file URL. Flickr evidence requires a
canonical repository observation with photo ID, page, checked-at/by, displayed
rights/credit/title/notices, original-retrieval identity, path, and SHA-256;
it must not be called a Flickr-native immutable revision.

## Removed v7 gates

The v8 contract contains no active named-photographer allowlist join, occasion
allow/deny gate, identity/account-control/self-publication/licensing-authority
requirement, washing-signal check, dispute search, or ambiguous-court automatic
rejection. Occasion and displayed maker/uploader/account strings may be
retained as facts, never promoted into ownership, authority, or clearance.

The exact three accepted residual risks remain:

1. **持證攝影記者授權自始無效的風險（Flickr-washing）**：持證記者與聯盟或媒體有契約，若無權授權，其標示的 CC 授權自始無效，下游使用者不因善意而免責
2. **封閉練習場地規範風險**：封閉練習照片可能違反球隊或場地的拍攝規範
3. **授權人身分無法追溯的風險**：帳號持有者未必是拍攝者，連授權人是誰都無法主張

These are accepted residual risks, not a finding of valid authority or a
copyright, personality/portrait-rights, venue, contractual, medical, legal-use,
or public-release clearance.

## CC BY-SA composition firewall

Ordinary local HTML/CSS placement and responsive rendition are allowed.
For a crop, the Adapter's License must be the same CC BY-SA version and is
limited to the crop contribution. CC BY-SA pixels are rejected from every
site-composed or baked OG image, social image, case card, infographic, and
equivalent composite output. The pre-existing mechanical brand checker remains
the product guard; the Decision 15 pure contract adds positive placement and
responsive fixtures and negative composition fixtures.

## Validation and closed scopes

All listed commands used Node `v24.14.0`:

| Gate                                             | Phase 0 result                            |
| ------------------------------------------------ | ----------------------------------------- |
| `source-policy:v8:check`                         | passed; exact `30a27633…318e`             |
| `decision15:baseline:check`                      | passed; exact `60b6b2d5…0e11`             |
| Decision 15 contract/source-policy focused tests | passed                                    |
| Clinical freeze                                  | passed, 30/30; aggregate `bb02fb61…a2e73` |
| TypeScript and focused Prettier                  | passed                                    |
| `git diff --check`                               | passed                                    |

No policy, registry, candidate, cover, clinical file, review artifact, `dist`,
credential, listener, service, or closed-scope state changed in Phase 0. There
was no search, download, adoption, build, smoke request, service action,
publication, deployment, indexing, external-account mutation, remote mutation,
or push.
