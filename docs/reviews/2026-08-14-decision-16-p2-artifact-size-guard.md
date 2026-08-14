# Decision 16 Phase 2 — private-review artifact size guard

Date: 2026-08-14
Scope: `decision-16-trae-young-rendition-only`
Runtime: Node `v24.14.0`
Phase 1 parent: `bdaf478` (`feat(assets): add Trae Young governed rendition`)

## Outcome

The private-review artifact now has one shared, fail-closed per-file ceiling:

```ts
export const PRIVATE_REVIEW_MAX_FILE_BYTES = 32 * 1024 * 1024;
```

The inclusive boundary is 33,554,432 bytes. A regular file of exactly that
size is accepted; 33,554,433 bytes is rejected. The shared constant is defined
in `src/lib/governance/private-review-limits.ts` and directly imported by all
four required consumers:

1. `scripts/verify-review-artifact.ts`
2. `src/lib/governance/artifact-manifest.ts`
3. `scripts/private-hosting/generate-private-dist-manifest.ts`
4. `scripts/private-hosting/verify-private-review.ts`

No timeout or byte ceiling was raised. The live request timeout remains 8,000
ms, the complete-run timeout remains 180,000 ms, and the transport body limit
remains exactly 33,554,432 bytes.

## Built-artifact guard

`verify:review-artifact` scans every entry under `dist` with `lstat`, admits
only real directories and regular files, and reports every oversized file with
stable code `review-artifact-file-size-limit`. Each issue carries its
`dist/...` path, observed bytes, and the configured limit. Offenders are sorted
by code-point path order and there is no extension allowlist or Trae-specific
exception.

The scan records `dev`, `ino`, `size`, `mtimeNs`, and `ctimeNs` for every file,
the `dist` root, and every parent directory. HTML, redirects, and `robots.txt`
are read through `O_NOFOLLOW`, an opened-fd identity check, a fixed-size buffer,
and a one-byte growth probe. The CLI performs a final full-tree scan, reapplies
the size guard, and compares every file and directory identity. Same-size
atomic replacement, parent replacement, post-scan growth, symlinks, sockets,
and other non-regular entries therefore fail closed.

The exact standard CLI logic is exported as a return-code runner. A sparse
temporary artifact tree containing oversized nested Trae-like JPEG, HTML,
redirect, and robots files returns exit code 1. The checker source has a test
denylist for `child_process`, HTTP(S), net/TLS, and `fetch`, proving this static
gate has no service-request capability. The guard remains on the ordinary
`npm run verify` path through the unchanged `verify:review-artifact` script.

## Manifest and promotion boundaries

The artifact-file schema requires `byteLength` to be an integer from 0 through
33,554,432. Missing, fractional, unsafe, negative, and 33,554,433-byte
declarations fail schema validation. A hand-edited canonical manifest with an
oversized declaration parses fail-closed.

The manifest builder checks the measured byte length before hashing. The
private-manifest walker uses bigint metadata and rejects an oversized regular
file before snapshot reading. The stable reader rechecks the pre-open and
opened-fd sizes, reads only the opened size into a bounded buffer, probes one
additional byte, and retains the prior final-path, parent-directory, traversal,
symlink, non-regular-file, and identity checks.

The previously committed Decision 15 private manifest still declares the
39,619,306-byte source artifact. It is therefore intentionally invalid under
the new schema and fails before network inspection, credential reads, writes,
or requests. Phase 3 must replace it through the authorized artifact chain;
it was not edited in this phase.

## Mechanical boundary fixtures

The committed unit/integration fixtures use generated buffers and temporary
sparse files, not a repository binary. They prove:

- exactly 32 MiB accepted and 32 MiB + 1 rejected;
- multiple offenders all reported in stable order;
- nested Trae-like JPEG rejected without a name exception;
- ordinary HTML, WOFF2, JavaScript, and image sizes accepted;
- oversized HTML, redirects, and robots files excluded before body reads;
- symlink and Unix-socket entries rejected;
- same-size atomic regular-file replacement rejected;
- a non-text asset growing to 32 MiB + 1 after the first scan produces both
  the required size issue and snapshot-change failure;
- exact-size sparse private-manifest input accepted and +1 rejected before
  snapshot reading;
- live transport accepts an exact configured 32 MiB cap, rejects a cap of +1
  before the HTTP request, accepts an actual 64 KiB body at its requested
  boundary, and rejects an actual 64 KiB + 1 response through the unchanged
  sanitized `transport-failed` path.

## Validation results

All commands below ran with the explicit Node 24.14.0 PATH.

- Final focused size/noindex integration: 5 files, 96/96 tests passed.
- Full unit suite: 60 files, 1,123/1,123 tests passed.
- Protected photo/BY-SA integration: 8 files, 172/172 tests passed.
- `tsc --noEmit`: pass.
- Full Prettier check: pass.
- `git diff --check`: pass.
- `verify:review-artifact`: exit 0; 918 regular files, 42 HTML pages, 26 case
  pages, 33,554,432-byte limit, 18 NBA video sources, and 69 NBA source rows.
- Existing ignored `dist` read-only ledger at this phase boundary: zero files
  over 32 MiB; largest file 7,867,079 bytes
  (`dist/_astro/kyrie-irving.Cvh4vveH.jpg`). This is not the final artifact
  chain; Phase 2 performed no build.
- `source-policy:v8:check`: pass;
  `30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e`.
- `source-policy:v9:check`: pass;
  `0ac3fecc04e12b88134ce97d11fbe1c742af1f21664a9c80eaf0d76ab7cfcfba`.
- `decision16:rendition:check`: pass; 2400×2080, 2,390,278 bytes, q95,
  SHA-256
  `0c7a77e45d05648b8e52e6db692086e240e883639e8a8617f36d44f70061fcaf`.
- Registry v7 and v8 regeneration: pass; v8 digest
  `908ccc9c1d9aeee56c907a476701c8875914af5090614c36271a76447057084a`.
- `player-photos:verify`: pass; 21 current photos, 0 SVG fallbacks, 26 cases.
- `brand:verify`: pass; provenance and CC BY-SA composition firewall intact.
- Clinical freeze: 30/30 byte-identical; aggregate SHA-256
  `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.
- Authorization assertion: pass. Plan binding: 28 documents, pass.

The plan and authorization bytes remain unchanged:

- plan SHA-256:
  `963b27387c4d3232ef5e3aa7a892907e3594231ca8bd09ffec00d45a4ee8d4db`
- authorization SHA-256:
  `c995301f5490705abf5dc91ce47e5ab72fef9a43bf3257d5d677ba27bb529ab8`

All player assets, registries, policies, UI/content sources, and all 30 clinical
files are byte-identical to the clean Phase 1 boundary.

## Correction and negative-check record

The first sparse-fixture test run failed because `truncateSync` was called
before its temporary file was created. It was corrected once and passed. The
first adversarial review then found unbounded follow-up reads for oversized
redirect/robots files and insufficient CLI-exit evidence. Those were corrected;
the first rerun exposed only an incorrect expected code-point order in the
test and passed after the expectation was fixed. A second adversarial review
reproduced a same-size atomic-replacement race. Scan identity binding and the
final full-tree rescan closed it. The final independent closure audit reported
no remaining Phase 2 code blocker.

An audit also ran `decision16:baseline:check` and observed its expected exit 1:
that command freezes the authorized-start worktree and original oversized
`dist`, so it is intentionally a Phase 0-only drift detector after authorized
Phase 1/2 changes. The plan does not require it post-Phase 0. Neither its
generator nor its frozen evidence was changed to manufacture a pass.

No final review build, review-set generation, private-manifest generation,
receipt write, kickstart, service request, publishing, deployment, indexing,
external-account mutation, remote-repository mutation, or push occurred in
Phase 2.

## Source hashes at closure

- shared limit:
  `7065d9c1d118e4706c1491fb875660feb617848197b989432ce9a6a3afb2dd49`
- built-artifact verifier:
  `fde1fc9ed64f78b6a0c2a0ea22c870f77a447b7a7b75a30b5e70252e2c1cd64d`
- artifact schema:
  `10b114629c440d60c08fb6a7d8e15fb509e0e684e1f381edfa78e92af3c00c15`
- private-manifest generator:
  `6f52c1212e642b34380658f38afa4164e1b2992003d161fb9bfb29a6d4d44d02`
- live verifier:
  `e059bdb62331ed995b09f1bd9e2a76ffeb2cdc24ccbdbb6cbd9587b3666d1fc8`
