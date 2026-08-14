# Decision 16 Phase 0 baseline and governed-rendition contract

- Date: 2026-08-14
- Scope: `decision-16-trae-young-rendition-only`
- Authorized-start commit: `518b8a5ea64a769cd39750f17433472a2381cd59`
- Authoritative runtime: Node `v24.14.0`
- Status: Phase 0 baseline, `nba-v9`, and pure rendition contract complete
- Release state: private medical review; publication, deployment, indexing,
  hosting-service mutation, external-account mutation, medical mutation, and
  remote-repository mutation remain closed

Phase 0 freezes the exact Decision 16 authorized start, the sole oversized
review artifact, all 21 current cover selections/assets, and all 30 clinical
files. It adds an append-only policy successor and a pure dual-fact contract.
It does not generate or alter an image, promote a registry, change a current
cover, build an artifact, run the live private verifier, write a receipt, or
touch the private service.

## Authorization and immutable governance

The clean-worktree preflight passed before any write. The decision verifier,
28-document binding verifier, and positive authorization assertion all passed
with the exact owner-supplied role and scope.

| Input                      | SHA-256                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| Decision 16 plan           | `963b27387c4d3232ef5e3aa7a892907e3594231ca8bd09ffec00d45a4ee8d4db` |
| Owner authorization JSON   | `c995301f5490705abf5dc91ce47e5ab72fef9a43bf3257d5d677ba27bb529ab8` |
| Plan-binding registry      | `3c7308467aa5d19a81dc81bd2ba1559ffb49fe4cb4d045a66583e649401ddf31` |
| Canonical Phase 0 baseline | `ab1a6a836b8f06bc575f9f54b48515d2c9d3cbb327cb205e238262b7dd10a829` |

Neither the plan nor authorization JSON was rebound or edited. Policy v1–v8,
registry v1–v7, the Decision 15 evidence, and all governance inputs named by
the machine baseline remain byte-identical.

## Canonical authorized-start baseline

The complete machine-readable snapshot is
`docs/reviews/evidence/decision-16/p0/authorized-start-baseline.v1.json`. It
contains every one of the 918 sorted `dist` size/hash rows, all 21 current
selection subtrees, every selected source asset, all 30 clinical path/hash
rows, policy v1–v8, registry v1–v7, the review artifacts, noindex state,
service identity, and the verifier/artifact-chain code bindings.

| Frozen set                            | Count | Aggregate SHA-256                                                  |
| ------------------------------------- | ----: | ------------------------------------------------------------------ |
| Current cover assets                  |    21 | `12808fc996e40a19ef8e43745eb7548f94117042b90d6e2962814fe1d96a6c4f` |
| Current selection subtrees            |    21 | `ae68eb9c5ae1127eafee083893dc70231cde343037d0b12844162acdfa9fe629` |
| Protected non-Trae assets             |    20 | `9bbf6751bf16975d990757827839b1376aca8e2b3cc9fc63995f667d9cc0628f` |
| Protected non-Trae selection subtrees |    20 | `f222cf629755cc3e079f356ada2c1f46a8cd1fe34c516bcfac4da9ad66aed507` |
| Clinical inputs                       |    30 | `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73` |

The clinical partition is 26 approved cases, three injury overviews, and one
quarterly update. `npm run decision13:clinical-freeze` passed 30/30.

The exact private/noindex state remains `siteStatus=medical-review` and
`allowIndexing=false`; `src/data/site-governance.v1.json` remains
`8aebcdf9bc4b00f26b183eb2dd828904ab83a4ff607c9579ab3054bd0d1ee7d5`.
Read-only observation found launchd PID 28514 with exit-status column `0` and
one listener PID 28515 at `100.114.3.93:8140`. No service action occurred.

## Oversized-artifact ledger and frozen failure cause

The current `dist` and committed manifest were compared one-for-one: 918
regular files, 179,366,684 total bytes, no missing/extra path, no byte/hash
mismatch, and no symlink or special file. The build-path-sorted size ledger
SHA-256 is
`8fa3a1a5d8a58a9587b3441d540574699555b915de615fd1c7be9a2fd509def3`.

Exactly one path is greater than the unchanged 33,554,432-byte ceiling:

| Build path                       |      Bytes | SHA-256                                                            | Excess bytes |
| -------------------------------- | ---------: | ------------------------------------------------------------------ | -----------: |
| `_astro/trae-young.jGOFOMcP.jpg` | 39,619,306 | `b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0` |    6,064,874 |

The largest below-limit path is
`_astro/kyrie-irving.Cvh4vveH.jpg` at 7,867,079 bytes. All other 917 paths are
at or below the ceiling.

The exact persisted Decision 15 failure token is only `transport-failed`.
Phase 0 does not invent absent stderr and did not rerun the live verifier. The
static causal proof binds all of these facts:

1. `MAX_RESPONSE_BYTES` was `32 * 1024 * 1024`.
2. Request context clamped each body to
   `Math.min(MAX_RESPONSE_BYTES, Math.max(file.byteLength + 1, 64 * 1024))`.
3. The committed manifest declared the sole 39,619,306-byte offender.
4. The transport destroys a response when accumulated bytes are strictly
   greater than `request.maxBodyBytes` and sanitizes the error to
   `transport-failed`.

The frozen code SHA-256 values are `a6e1b4a70547621f187b0e32cf9e417f35e8180222217539dbd32f88a5cf6e37`
for the live verifier, `44b29461e5d7a705350999ce4ea0c8dcad77321c9d9ff2bd81e9a13edda6d07e`
for the review-artifact checker,
`831b8a004c367cbde3a97ef061e2f48bf8835af2c613b9552365f255e6b908fe`
for the private-manifest generator, and
`f0445fbbcdc8d49646900c11a2cd57a4fd5ac452482283bc1f444eaaac13737a`
for the manifest contract.

## Append-only `nba-v9`

| Policy file                                    | SHA-256                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `research/source-policy/nba.v9.md`             | `03f6a61ee6ef958cae2ae9b918d7b6a115ff0d346f63202efce8780744fbadf2` |
| `research/source-policy/source-policy.v9.json` | `0ac3fecc04e12b88134ce97d11fbe1c742af1f21664a9c80eaf0d76ab7cfcfba` |

The generator binds the exact v8 Markdown and canonical JSON. All v8 root
fields and all existing photo rules remain canonical-equal. In particular,
the accepted licenses/platforms, attribution and notice rules, injury-event
gate, non-clearance interpretation, residual risks, closed scopes, and CC
BY-SA composition firewall are unchanged.

The general `cropRules.storedJpegModificationAllowed` remains `false`. The
only semantic delta is `governedLocalRenditionRules`, a named Trae Young
exception that requires two separate records:

- the immutable 6351×5504, 39,619,306-byte Decision 15 source original with
  its exact URLs, oldid, timestamp, MediaWiki SHA-1, repository SHA-256, and
  upstream alteration disclosure; and
- a distinct `src/assets/players/decision-16/trae-young.jpg` rendition with
  its own hash/dimensions/bytes, exact source binding, tool/options, quality
  choice, no-crop/full-frame state, metadata/color/orientation treatment,
  creation facts, and human-visible change disclosure.

The source and rendition fact sets cannot populate or replace one another.

## Decision 16 pure contract

The contract fixes the upstream/source tuple without changing it: CC BY 2.0,
token `cc-by-2.0`, terms URL, work title `Trae Young`, displayed credit and
copyright notice `Erik Drost`, fixed Commons revision, oldid `1148485505`,
MediaWiki SHA-1 `193bb8a75e73f878359d136f0769205a4a8693ba`, and no
Adapter's License.

It separately requires a complete JPEG at 2400×2080 and at most 5,000,000
bytes, derived from the exact source SHA-256 through Sharp 0.35.3, with a
deterministic highest-passing-quality ladder. Negative fixtures reject
source/rendition swapping, missing attribution or change disclosure, wrong
hashes/dimensions/license bucket, an invented Adapter's License, crop/tool or
quality drift, incomplete/oversized JPEGs, policy/scope drift, source deletion,
and false clearance.

## Phase 0 validation

All authoritative results below used Node `v24.14.0`:

| Gate                                           | Actual result                                     |
| ---------------------------------------------- | ------------------------------------------------- |
| `source-policy:v9:check`                       | passed; exact `0ac3fecc…fcfba`                    |
| `decision16:baseline:check`                    | passed; exact `ab1a6a83…0a829`                    |
| Decision 16 plus source-policy tests           | passed, 2 files, 50/50 tests                      |
| Existing Decision 15 contract plus brand tests | passed, 2 files, 51/51 tests                      |
| `brand:verify`                                 | passed; BY-SA composition isolation active        |
| Clinical freeze                                | passed, 30/30 files, exact aggregate              |
| `tsc --noEmit`                                 | passed, exit 0                                    |
| Full Prettier check                            | passed                                            |
| Plan binding/authorization                     | passed, 28 bound documents and positive assertion |
| `git diff --check`                             | passed                                            |

The first brand run correctly rejected the new pure contract until it was
added to the rights-audited, non-rendering consumer set. The first full format
check also identified the new baseline script. Both were corrected once; the
final runs above passed without weakening either guard. A standalone focused
Prettier invocation also reported that `.prettierignore` has no parser; it did
format the intended TypeScript file, and the authoritative full repository
format check then passed.

One early, read-only package/metadata probe (and parallel read-only
reconnaissance) resolved the mise shim to Node `v22.23.1`. It made no write,
did not use the forbidden Codex 24.19.0 runtime, and all affected observations
were discarded and rerun under the required explicit Node `v24.14.0` path.
Every generator, test, formatter, TypeScript check, and other state-relevant
command used Node `v24.14.0`.

## Closed-scope and mutation statement

Phase 0 changed only the bounded v9 policy/generator, Decision 16 pure
contract/tests, canonical baseline/evidence, package command wiring,
Prettier-ignore entries for canonical JSON, and the existing brand guard's
pure-contract audit list. It did not change policy v1–v8, registry v1–v7, any
image, any of the 30 clinical files, review set, private manifest, served
receipt, `dist`, credentials, listener, launchd configuration/state, Tailscale,
publication, deployment, indexing, external accounts, remote repository, or
medical-review state. No build, private request, kickstart, or push occurred.
