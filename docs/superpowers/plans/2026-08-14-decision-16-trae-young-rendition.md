# Decision 16 Trae Young Rendition Plan

> Status: NOT AUTHORIZED. The owner's 2026-08-14 instruction authorizes only
> this plan-drafting and `not-authorized` registration cycle. Repository
> execution requires a later owner-supplied strict `PlanExecutionDecisionV1`
> bound to this plan's exact final path and SHA-256. This cycle may add this
> plan, append its `not-authorized` plan-binding entry, and make one local
> registration commit. It may not create or bind an authorization JSON,
> execute Task 0 or any phase, create or modify a policy, contract, test,
> image, registry, review artifact, receipt, service, or `dist`, or mutate a
> closed scope.

**Goal:** Replace the 39,619,306-byte Trae Young cover delivered by the review
artifact with a governed, visually acceptable local JPEG rendition whose
longest edge is 2,400 px and whose stored bytes are at most 5,000,000. Preserve
the exact upstream Commons original facts and attribution, keep all other 20
cover assets and all 30 clinical files byte-identical, add a fail-closed 32 MiB
artifact-size guard, and restore the repository's actual `npm run
private:verify` command to a passing result.

**Architecture:** Keep the immutable Decision 15 original at
`src/assets/players/decision-15/trae-young.jpg` and add the rendition at a new
Decision 16 path; do not rewrite commit `86271c0` or historical bytes. Add an
append-only `nba-v9` policy pair because `nba-v8` expressly forbids stored JPEG
modification, then promote an append-only player-photo registry v8 that keeps
the upstream original and local rendition as distinct fact sets. Centralize
the unchanged 32 MiB private-response/file ceiling and enforce it while
verifying a built review artifact, before live private verification. Finish
the existing ordered review-set/build/manifest chain, perform exactly one
authorized private-review kickstart, and require the repository verifier—not
an ad hoc replacement—to pass.

**Tech stack:** Node.js 24.14.0 selected from the required mise installation,
TypeScript, canonical JSON, SHA-256, SHA-1 only for the frozen MediaWiki source
identity, Astro 7 and its locked image stack, Vitest, Playwright/axe,
Lighthouse, local Git, existing review/private-artifact tooling, launchd, and
the already configured private Tailscale review service.

## Scope and authority

- Execution role: `decision-16-trae-young-rendition`; execution scope ID: `decision-16-trae-young-rendition-only`; required closed scope IDs: `deployment`, `external-account-mutation`, `hosting-service-mutation`, `indexing`, `medical-content-authoring`, `medical-review-decision`, `public-release`, `remote-repository-mutation`.
- Decision 16 fixes the intended result but is not execution authority. The
  owner will separately supply the strict authorization JSON. An agent must
  not draft, infer, backfill, or bind it.
- After exact authorization, permitted repository mutations are limited to an
  append-only `nba-v9` policy pair and generator/checker, Decision 16
  contract/baseline/evidence, one new Trae Young rendition, append-only
  player-photo registry v8 and its minimum resolver/presentation changes, the
  artifact-size guard, aligned tests, the ordered private artifact chain, and
  conventional local commits.
- All other 20 cover source assets are protected byte-for-byte. The 30
  clinical files—26 cases, three injury overviews, and one quarterly
  update—are protected byte-for-byte with aggregate SHA-256
  `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.
- Publication, deployment, indexing, hosting configuration/service mutation,
  external accounts, remote repository mutation, push, and medical-content or
  medical-review changes remain closed. The owner has separately enumerated
  exactly one final private-artifact reload action:
  `launchctl kickstart -k gui/501/tw.sportsmedicine.atlas.private-review.v1`
  after the new private manifest is committed. This narrow action does not
  authorize any `hosting-service-mutation`. If Task 0 governance classifies
  the exact kickstart itself as that closed scope, stop for corrected owner
  authority rather than execute it.
- Read-only local/service diagnostics and the final authenticated verifier are
  checks, not authority to alter service configuration, credentials,
  listener, port, launchd definition/load state, Tailscale identity, or
  exposure. `allowIndexing=false` and all private/noindex controls remain
  mandatory.

## Verified license and provenance premise

Proceeding past planning is conditioned on the following facts remaining
exactly true. Registry v7 and the Decision 15 frozen evidence independently
agree; if an authorized executor finds contrary source evidence, execution
stops before changing any asset or registry.

- The exact work is
  `Trae Young (2022 All-Star Weekend) (cropped).jpg`, Commons oldid
  `1148485505`, licensed **CC BY 2.0**, token `cc-by-2.0`, terms
  `https://creativecommons.org/licenses/by/2.0`, with displayed maker, credit,
  and supplied copyright notice `Erik Drost`.
- The rights bucket is `cc-by`, not `cc-by-sa`; the existing Adapter's License
  field is `null`. Creating the local rendition therefore requires precise
  attribution and an indication of changes, but does not make this CC BY work
  subject to a ShareAlike Adapter's License or BY-SA composition restrictions.
  The site-wide BY-SA firewall remains active for every BY-SA work.
- The immutable Commons description URL, original-file URL, oldid permalink,
  and revision timestamp remain upstream facts. The upstream binary remains a
  6351×5504 JPEG of 39,619,306 bytes with MediaWiki SHA-1
  `193bb8a75e73f878359d136f0769205a4a8693ba`.
- The Decision 15 local original remains
  `src/assets/players/decision-15/trae-young.jpg`, SHA-256
  `b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0`.
  It is retained unchanged as a reproducible source and historical fact; it is
  not shipped by the current-cover resolver after registry v8 promotion.
- These facts are frozen at
  `docs/reviews/2026-08-13-decision-15-p1-frozen-candidate-readjudication.md`
  row 13, the Phase 3 report's original-binary and rights tables, and the Trae
  Young selection in `src/assets/players/player-photo-registry.v7.json`.

This plan does not reinterpret CC BY 2.0 as rights clearance. The existing
personality/portrait/publicity/privacy/endorsement/venue/league/team/contract,
medical, legal-use, and public-release non-clearance statement remains intact.

## Why `nba-v9` is required

The adoption threshold does not change, but the current storage contract does:

- `nba-v8` records alteration state and distinguishes an ordinary responsive
  runtime rendition from a baked composition, but its machine-readable
  `cropRules.storedJpegModificationAllowed` is `false`.
- The Decision 15 contract requires the repository local file to equal the
  upstream original in MIME type, dimensions, and byte length, verifies the
  local SHA-256 against those bytes, and requires
  `localFileIsUnmodifiedOriginal=true`.
- `nba-v8` is immutable and its version-change rules require a new source
  policy version for a player-static-photo annex change.

Therefore `nba-v8` does **not** already authorize a stored local derivative;
its general alteration disclosure is insufficient to override those exact
negative fields. Decision 16 needs append-only `nba-v9`, narrowly extending
the provenance model to distinguish an immutable upstream/source-original
record from a governed local rendition record. `nba-v9` must inherit every v8
eligibility, attribution, notice, injury-event, non-clearance, residual-risk,
and CC BY-SA composition rule unchanged. It must not broaden accepted
licenses, source platforms, candidates, athletes, use kinds, or release scope.

## Non-goals

- No authorization artifact or authorization binding in this planning cycle.
  No Task 0, Phase 0–3 command, asset generation, test/build, private request,
  or service action now.
- No in-place edit of `nba-v1`–`nba-v8`, player-photo registry v1–v7, Decision
  15 frozen evidence, or the Decision 15 original JPEG.
- No deletion of the 39.6 MB object from the worktree for history-size reasons,
  no Git history rewrite, filter operation, force push, or attempt to remove
  the blob already present in commit `86271c0`.
- No increase to `MAX_RESPONSE_BYTES`, the complete-run timeout, request
  timeout, or another verifier limit as a substitute for reducing the shipped
  bytes.
- No change to any of the other 20 cover assets, their source/provenance facts,
  exact licenses, displayed credits, notices, focal points, or case mappings.
- No modification of any clinical content, medical-review decision,
  publication/indexing state, public artifact, deployment, DNS, Cloudflare,
  credentials, listener, port, Tailscale configuration, external account,
  remote repository, or push.
- No weakening, deletion, bypass, or test-only exclusion of the CC BY-SA
  composition firewall. Trae Young is CC BY, but all existing BY-SA checks
  must continue to pass.

## Frozen planning baseline

- Planning began from clean `main` commit
  `e2f327948ac31368b3221ef1318ef2e150cf4743`. An authorized executor records
  the later clean starting commit and stops on unexplained relevant drift.
- Every Node/npm command must prepend
  `/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin` to `PATH` and
  prove `node --version` is exactly `v24.14.0`. Codex runtime Node 24.19.0 is
  forbidden.
- Immutable `nba-v8` Markdown SHA-256 is
  `20a9209bd523604efe3251f6ef159e6432fa9280951ea16d630ee02cc347557d`;
  its canonical JSON SHA-256 is
  `30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e`.
- Player-photo registry v7 SHA-256 is
  `77a146729b95802fbe978bc8a4360ed54929121936a04454afe49998ea93b0c4`.
  It selects 21 photos for 21 athletes and 26 cases.
- Decision 15 final-validation SHA-256 is
  `500cb250833d72230c6fee3e4021474c62eabd3d4245191e0f8a40e6f07bd85f`.
  It truthfully records that the repository's `private:verify` failed with the
  frozen token `transport-failed`; it did not claim a pass. The record does
  not preserve complete stderr, so no fuller string is represented as frozen
  output. Its separate in-memory read-only smoke covered 918/918 authenticated
  HTTP 200 and 918/918 unauthenticated HTTP 401 responses.
- `scripts/private-hosting/verify-private-review.ts` sets
  `MAX_RESPONSE_BYTES = 32 * 1024 * 1024` (33,554,432 bytes). The committed
  private manifest, SHA-256
  `53f2a5b8bb75bd155a334708148ff2a89814f6132fffb76daf19d97a4bc8ca56`,
  has exactly one file above that limit:
  `/_astro/trae-young.jGOFOMcP.jpg`, 39,619,306 bytes, SHA-256 equal to the
  Decision 15 original. It exceeds the ceiling by 6,064,874 bytes. The other
  917 manifest paths are not above 32 MiB.
- The cause is one pass-through asset, not route-count accumulation. This plan
  preserves the 32 MiB ceiling and fixes the shipped asset.

## Task 0 — Require exact authorization before execution

From a clean worktree, require the owner-supplied strict decision and exact
binding before any phase below:

```bash
export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_D16_PLAN="docs/superpowers/plans/2026-08-14-decision-16-trae-young-rendition.md"
ATLAS_D16_DECISION="docs/decisions/2026-08-14-decision-16-trae-young-rendition-authorization.v1.json"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain --untracked-files=all)"
npm run plan:decision:verify -- --decision "$ATLAS_D16_DECISION" --plan "$ATLAS_D16_PLAN"
npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_D16_PLAN"
```

Any runtime mismatch, dirty tree, missing/stale decision, owner/role/scope/
closed-scope mismatch, plan digest mismatch, failed binding, or failed
authorization assertion stops execution. Conversation text and this plan's
`not-authorized` binding are not substitutes. Task 0 does not run during the
current cycle.

## Phase 0 — Freeze the baseline and implement the rendition contract

1. Record the authorized starting commit. Re-hash policy v1–v8, registry
   v1–v7, all 21 current selection subtrees and source assets, the 30 clinical
   files, D15 evidence, review set, private manifest, served receipt, noindex
   state, service identity, and relevant verifier/artifact-check code. Stop on
   unexplained drift.
2. Derive a sorted current `dist` regular-file size ledger without changing
   `dist`. Freeze every path greater than 32 MiB and confirm the list contains
   exactly `_astro/trae-young.jGOFOMcP.jpg` at 39,619,306 bytes. Bind the ledger
   to the current private manifest and record the largest below-limit files.
3. Do not re-run the live verifier in Phase 0. Freeze the only persisted exact
   D15 failure token, `transport-failed`, without inventing absent stderr. Bind
   it to a static causal proof: the committed manifest's sole 39,619,306-byte
   entry, the 33,554,432-byte constant, the request-body clamp, and the
   transport's sanitized oversize failure path. Use a pure/temp-fixture test if
   executable reproduction is needed; it must make no request and write no
   receipt. If those facts do not reproduce the stated cause, stop and
   reassess.
4. Add immutable `nba-v9` Markdown/canonical JSON successors and a deterministic
   generator/check. Bind both exact v8 digests. Preserve every v8 adoption gate
   and closed scope while allowing one governed stored local rendition model
   with separately named upstream/source-original and local-rendition facts.
5. Define the v9 rendition contract: exact source path/hash/MIME/dimensions/
   bytes and MediaWiki identity; exact rendition path/hash/MIME/dimensions/
   bytes; transformation tool/version/options; aspect-ratio/no-crop state;
   color/orientation/metadata treatment; creation date/actor; and a human-
   visible indication of changes. The schema must make it impossible to claim
   that the upstream original had the rendition's dimensions, bytes, or hash.
6. Implement a Decision 16 contract and tests that accept Trae Young only when
   the v7 source license remains exact CC BY 2.0 with `Erik Drost`, the
   Adapter's License remains inapplicable, the source identity is exact, the
   rendition derives from those source bytes, and attribution/change
   disclosure is complete. Negative fixtures cover source/rendition field
   swapping, missing attribution, missing change disclosure, wrong hash,
   wrong dimensions, wrong license bucket, and an invented Adapter's License.
7. Preserve the existing CC BY-SA firewall byte-for-behavior and positive/
   negative fixtures. `nba-v9` must still reject BY-SA inputs to OG/social/
   case-card/infographic/equivalent baked composition and retain same-version
   crop-only Adapter's License rules where they actually apply.
8. Commit only the bounded v9 policy/contract/baseline/evidence work. No image,
   registry, current-cover resolver, review artifact, `dist`, receipt, or
   service mutation occurs in Phase 0. Require a clean worktree before Phase 1.

### Phase 0 acceptance and evidence

- `docs/reviews/2026-08-14-decision-16-p0-baseline-and-contract.md` records all
  exact digests, the one-file oversized ledger, the exact frozen D15 failure
  token and static causal proof, 20-cover and 30-clinical freezes, v9/v8
  lineage, and closed-scope negatives. It does not claim that fuller stderr was
  frozen or that the live command was rerun.
- The v9 generator reproduces canonical bytes. Tests prove that its only
  semantic policy delta is the dual-fact governed-local-rendition model; no
  adoption, rights, injury, BY-SA, non-clearance, or release gate changes.
- `nba-v1`–`nba-v8`, registry v1–v7, every image, the 30 clinical files,
  review/private artifacts, receipt, and `dist` remain unchanged. A
  conventional local Phase 0 commit exists and the worktree is clean.

## Phase 1 — Generate the rendition and promote registry v8

1. Read only the committed Decision 15 original as input. Never overwrite,
   delete, relocate, or re-download it. Generate
   `src/assets/players/decision-16/trae-young.jpg` through a repository script
   using the lockfile's exact image-tool version and deterministic options.
2. Preserve displayed orientation and full-frame aspect ratio; do not crop or
   enlarge. Set the longest edge to exactly 2,400 px (expected decoded output
   2400×2080 if the frozen source orientation is confirmed). Use a declared
   quality ladder and select the highest-quality deterministic JPEG at or
   below 5,000,000 bytes. Stop if source dimensions/orientation differ or no
   candidate meets the bound; do not silently choose another geometry.
3. Inventory source and output metadata/color behavior. Preserve supplied
   copyright/creator/rights information where embedded, and freeze every
   unavoidable profile, metadata, orientation, resizing, and re-encoding
   change. The public disclosure must state at minimum that the 6351×5504
   Commons original was downscaled and JPEG-re-encoded to the exact new
   dimensions; it must also state any other material change.
4. Verify complete JPEG framing, MIME, decoded dimensions, aspect ratio,
   byte length, SHA-256, derivation from the exact source SHA-256, and focal
   safety at 5:2 and 16:9. Perform side-by-side visual QA of the full frame and
   both presentation crops at representative desktop/mobile densities; stop
   on visible face/detail damage, color shift, rotation, or crop regression.
5. Generate player-photo registry v8 as a full append-only successor binding
   exact registry v7 and `nba-v9`. Preserve all v7 upstream Commons facts,
   including URL, oldid, revision time, MediaWiki SHA-1, 6351×5504, and
   39,619,306 bytes, plus the existing upstream disclosure `Commons extraction
   and CropTool derivative; unmodified local original with site CSS
   presentation crop.` Add a distinct rendition record with its new path,
   dimensions, bytes, SHA-256, source binding, transformation facts, and exact
   downscale/JPEG-re-encode disclosure; never merge the two disclosures or
   rewrite the upstream statement as a rendition fact.
6. Preserve the other 20 selection subtrees and all other 20 local cover
   assets byte-for-byte. Keep their original v8 eligibility lineage rather
   than rewriting historical selection evidence merely because registry v8
   adds the Decision 16 rendition policy at registry/Trae scope.
7. Move only the current Trae resolver/credit projection to registry v8 and
   the Decision 16 asset. Keep exact CC BY 2.0 name/version/terms, work title
   `Trae Young`, displayed credit and copyright `Erik Drost`, fixed source
   link, non-injury caption, non-clearance statement, and the new change
   disclosure visible. Do not add an Adapter's License.
8. Replace the current eager whole-directory import in
   `src/lib/ui/editorial-images.ts` with an exact current-asset projection (or
   an equivalently narrow negative exclusion): include the Decision 16
   rendition and exclude both historical 39.6 MB Trae originals while keeping
   every other current registry asset importable. Prove no current import or
   emitted-asset input points at either old Trae original after promotion.
   Preserve both solely as historical/source evidence. Run the new v9, D16,
   registry v8, photo-asset, credit, brand/BY-SA, focal, and clinical-freeze
   tests, then commit the bounded Phase 1 work from a clean boundary.

### Phase 1 acceptance and evidence

- `docs/reviews/2026-08-14-decision-16-p1-rendition-and-registry-v8.md`
  records exact source and rendition facts, toolchain/options, quality
  selection, visual QA, attribution/change disclosure, v8 registry lineage,
  and negative proof for the original output path.
- The new rendition has longest edge 2,400 px, is no more than 5,000,000 bytes,
  passes complete-JPEG and focal/visual checks, and binds the exact Decision 15
  source SHA-256. The original remains byte-identical.
- Registry v8 regenerates byte-for-byte. All upstream facts remain labeled as
  upstream/source-original facts, the rendition facts are separate, and the
  other 20 selections/assets plus all 30 clinical files are unchanged.
- Exact attribution and change indication render correctly; all BY-SA
  firewall tests still pass. A conventional local Phase 1 commit exists and
  the worktree is clean.

## Phase 2 — Add the fail-closed artifact-size regression guard

1. Define one shared constant for the private-review per-file ceiling at
   exactly `32 * 1024 * 1024` bytes. Import that same constant in all four
   consumers: the live private verifier, built-artifact checker,
   artifact-manifest schema/validator, and private-manifest generator. Do not
   raise any timeout or byte ceiling.
2. Extend the review-artifact verification path to inspect every regular file
   under `dist`, not only images or manifest entries. A file strictly greater
   than 33,554,432 bytes must produce a stable issue code containing its
   repository-relative build path, observed bytes, and configured limit, and
   must make `npm run verify:review-artifact` exit nonzero.
3. Apply the same limit in the artifact-manifest schema/validator and while
   generating/verifying the private-dist manifest, so an oversized file or a
   hand-edited oversized declaration cannot be promoted to the artifact chain
   even if a caller skips the higher-level verifier. Reject before reading an
   oversized file fully into memory. Symlinks, non-regular files, traversal,
   unsafe integers, and missing size facts continue to fail closed.
4. Add pure boundary fixtures: 32 MiB is accepted; 32 MiB + 1 byte is rejected;
   multiple offenders are sorted and all reported; a nested Trae-like JPEG is
   rejected; ordinary HTML/font/JS/image files remain accepted. Tests must not
   require committing a giant fixture.
5. Add an integration assertion using a temporary artifact tree: an oversized
   synthetic asset fails before any service request. Do not place the fixture
   in repository `dist` or commit a giant binary. Keep the guard in the
   standard `npm run verify` path through `verify:review-artifact`.
6. Re-run private-host verifier unit tests to prove the existing transport
   ceiling and sanitized error contract are unchanged. Re-run BY-SA, registry,
   20-cover, clinical, noindex, and plan-binding guards. Commit only bounded
   guard/tests/evidence; do not build the final artifact or mutate a service in
   this phase.

### Phase 2 acceptance and evidence

- `docs/reviews/2026-08-14-decision-16-p2-artifact-size-guard.md` records the
  shared constant, boundary fixtures, failure message contract, standard-suite
  integration, and unchanged live verifier limits.
- The oversized fixture fails mechanically at 32 MiB + 1; boundary and normal
  fixtures pass. No test bypass, extension allowlist, or Trae-specific filename
  exception exists.
- Source policies/registries/assets/clinical files from the clean Phase 1
  boundary remain unchanged. A conventional local Phase 2 commit exists and
  the worktree is clean.

## Phase 3 — Integrated validation, artifact chain, and private smoke

1. From the clean Phase 2 source commit, run the complete unit/coverage,
   TypeScript/Astro, formatting, content, Playwright/axe, Lighthouse, source-
   policy v8/v9, Decision 15/16, registry v7/v8, photo/credit/focal, brand/
   BY-SA, clinical-freeze, noindex, plan-binding, and Git whitespace suites.
   Record exact commands, exit codes, counts, and stricter totals.
2. Run `npm run build:review` and `npm run verify:review-artifact`. Require a
   sorted size ledger showing zero `dist` files greater than 32 MiB, every
   emitted Trae rendition at no more than 5,000,000 bytes, no emitted file with
   the Decision 15 source SHA-256, and byte equality for all other 20 cover
   outputs against the frozen comparable baseline.
3. Follow the artifact chain in order. From the clean source commit, run
   `npm run review-set:generate`, prove only `review/review-set.v1.json`
   changed, and commit it alone. Rebuild/verify from that clean commit, run
   `npm run private:manifest`, prove only
   `review/private-dist-manifest.v1.json` changed, and commit it alone. Re-run
   the size guard against both disk and manifest.
4. Confirm the new artifact preserves all expected routes and private/noindex
   controls. The current baseline is 918 manifest paths; any count difference
   must be completely enumerated and justified before continuing. Route count
   alone is never used to waive byte/header/identity checks.
5. Only after the new manifest commit and clean-tree checks, invoke exactly
   once:

   ```bash
   launchctl kickstart -k gui/501/tw.sportsmedicine.atlas.private-review.v1
   ```

   No earlier or additional restart/reload/kickstart, load/unload,
   reconfiguration, reprovisioning, credential/listener/port/Tailscale change,
   or alternate service action is permitted.
6. Run the actual repository command
   `npm run private:verify -- --credential-source local-file` and require exit
   0. It must verify every committed manifest path with authenticated HTTP 200,
   every required unauthenticated scenario with HTTP 401 and no byte leak,
   exact content bytes/types/private headers/identity, listener/service
   identity, and then atomically write the governed served-review receipt.
   An ad hoc in-memory verifier, partial sample, or manual curl cannot replace
   this core acceptance gate.
7. Prove only `review/served-review-receipt.v1.json` changed as a result of the
   passing verifier and commit it separately. Add the final docs-only evidence,
   recording receipt/manifest/review-set/artifact/source commits and digests,
   then finish with a clean worktree and no push.

### Phase 3 acceptance and evidence

- `docs/reviews/2026-08-14-decision-16-p3-final-validation.md` records full
  test totals, the zero-offender dist/manifest ledgers, source/rendition facts,
  attribution/change disclosure, other-20 and clinical equality, BY-SA
  firewall, noindex, artifact-chain commits, the single kickstart, and every
  closed-scope negative.
- The current Trae cover delivered by the private artifact is the governed
  rendition; the 39,619,306-byte original is absent from `dist` and remains
  unchanged in source/history. No `dist` file exceeds 32 MiB.
- `npm run private:verify -- --credential-source local-file` actually passes
  with exit 0 and a governed receipt covering the complete manifest. This is
  mandatory; the phase is incomplete if the repository command fails.
- No publication, deployment, indexing, public artifact, service/configuration
  mutation beyond the one kickstart, medical edit, external-account change,
  remote-repository mutation, or push occurs.

## Completion conditions

- The exact CC BY 2.0 / `Erik Drost` premise remains true, exact attribution
  and change disclosure are visible, and no ShareAlike Adapter's License is
  invented for Trae Young.
- `nba-v9` changes only stored-rendition provenance and binds exact v8 bytes.
  Registry v8 changes only the governed Trae current asset/facts plus necessary
  root lineage, while preserving upstream facts without conflating them with
  rendition facts.
- The Decision 16 JPEG is 2400×2080 when the frozen orientation is confirmed,
  no more than 5,000,000 bytes, visually acceptable, and reproducibly derived
  from the exact Decision 15 original. The original remains unchanged.
- All other 20 cover source and comparable output bytes are identical. All 30
  clinical files retain the frozen aggregate SHA-256.
- The mechanical guard rejects every `dist` regular file greater than 32 MiB,
  is exercised by boundary/integration tests, and remains on the standard
  verification path. The live verifier ceiling/timeouts are not raised.
- The final review artifact and manifest contain no file over 32 MiB and do
  not contain the 39,619,306-byte source original.
- The full validation/artifact chain passes under Node 24.14.0, exactly one
  final private-review kickstart occurs, and repository `private:verify`
  passes in fact.
- Every closed release/service/account/medical/remote scope remains closed,
  `allowIndexing=false`, and no push occurs.

## Risks and controls

- **Upstream/rendition fact conflation:** Keep separately named typed records
  and negative fixtures. Never attach rendition dimensions, bytes, or hash to
  the Commons URL/oldid/MediaWiki SHA-1.
- **Lossy-quality regression:** Use the highest-quality candidate under the
  deterministic byte cap and require full-frame plus 5:2/16:9 visual QA. A
  byte target cannot override subject/detail/color acceptance.
- **Incomplete CC BY change indication:** Preserve exact title, credit,
  copyright notice, terms link, fixed source, and explicit resize/re-encode
  disclosure in registry and rendered credits.
- **Accidental historical breakage:** Add the rendition at a new path and
  promote an append-only registry. Never overwrite D15 bytes or edit v7/v8.
- **Hidden oversized output:** Scan every regular file from disk and the
  private manifest with one shared ceiling; test boundary and nested cases.
- **Treating a verifier-limit increase as a fix:** Freeze the 32 MiB constant
  and timeout behavior in tests. Stop if the smaller artifact still exposes a
  different transport defect.
- **Other-cover or clinical collateral:** Compare all 20 protected source/
  selection/output records and the 30-file clinical aggregate at every phase.
- **ShareAlike regression:** Keep all existing composition-path detection and
  same-version Adapter's License tests active even though the changed work is
  CC BY.
- **Stale service artifact:** Bind the ordered source/review-set/manifest
  commits, perform the one kickstart only after the manifest commit, and let
  repository `private:verify` prove exact served bytes before recording pass.

## Rollback

- Roll forward with corrective commits or use `git revert`; never reset
  destructively, edit immutable policy/registry/evidence in place, rewrite
  history, or force push.
- A rendition defect is corrected through a new asset path and registry v9
  successor. Do not overwrite the Decision 16 rendition after it is frozen and
  do not return the 39.6 MB source to shipped output merely to restore a page.
- A v9 policy defect requires append-only `nba-v10`; a registry v8 defect
  requires registry v9. Historical v8/v7 bytes and their bindings remain.
- A size-guard defect is corrected without raising the 32 MiB ceiling or
  bypassing the standard suite. Rebuild dependent artifacts from a clean
  corrective source commit.
- Service restart/reload beyond the single authorized kickstart, publication,
  deployment, indexing, remote/account mutation, medical changes, and push
  remain closed during rollback and require separate authority.

## Current planning-cycle bind and stop

The present task performs only plan drafting and `not-authorized`
registration:

```bash
export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"
ATLAS_D16_PLAN="docs/superpowers/plans/2026-08-14-decision-16-trae-young-rendition.md"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain --untracked-files=no)"
test "$(git status --porcelain --untracked-files=all)" = "?? $ATLAS_D16_PLAN"
git diff --check
npm run plan:bind -- "$ATLAS_D16_PLAN" \
  --status not-authorized \
  --role decision-16-trae-young-rendition \
  --scope decision-16-trae-young-rendition-only \
  --closed-scopes deployment,external-account-mutation,hosting-service-mutation,indexing,medical-content-authoring,medical-review-decision,public-release,remote-repository-mutation
npm run plan:verify
git diff --check
ATLAS_D16_SHA="$(/usr/bin/shasum -a 256 "$ATLAS_D16_PLAN" | /usr/bin/cut -d ' ' -f 1)"
test "$(jq -r --arg path "$ATLAS_D16_PLAN" '.documents[] | select(.path == $path) | .sha256' docs/decisions/plan-binding.v1.json)" = "$ATLAS_D16_SHA"
```

Require the separate negative `npm run plan:assert-authorized --
"$ATLAS_D16_PLAN"` result to fail specifically because status is
`not-authorized`. Compute the plan's raw-byte SHA-256, verify it equals the new
binding entry, stage only this plan and
`docs/decisions/plan-binding.v1.json`, and make one local commit named
`docs(governance): register Decision 16 Trae Young rendition plan`. Then stop.
Do not create the authorization JSON or execute Task 0 or Phase 0–3.
