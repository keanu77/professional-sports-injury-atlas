# Atlas Private Hosting and Review — G4 Implementation Plan

> Status: NOT AUTHORIZED. Decision 6 authorizes drafting and registering this exact-date G4 plan, but it does not replace the repository's strict `PlanExecutionDecisionV1` byte binding. This cycle may only add this plan, bind it append-only as `not-authorized`, commit those two files, and stop. It must not start, stop, replace, expose, test, or reconfigure any hosting service.

**Goal:** Produce an access-controlled private review deployment on the existing Mac mini and Tailscale tailnet, prove that every file in the canonical review artifact is denied without application credentials and served byte-for-byte with credentials, and persist a strict private-dist manifest plus served-review receipt without opening G5, public release, or indexing.

**Architecture:** Build the review-only Astro output at a clean, digest-bound commit. A Node 24 application gateway replaces the legacy unauthenticated port-8140 server and binds only the mini's Tailscale IPv4 address. Tailscale is the encrypted network boundary; HTTP Basic authentication backed by a salted scrypt verifier in the local macOS Keychain is a separate application authorization layer. The gateway loads only files named by the canonical private-dist manifest, verifies all bytes before listening, authenticates before route resolution, disables shared/browser caching, and serves no fallback content. A live verifier exercises the same complete path set without and with credentials and writes only canonical hashes and metadata to the served-review receipt.

**Tech stack:** Node.js 24.14.0, Astro review build, TypeScript, Vitest, Node `http`/`crypto`, macOS Keychain and `launchd`, the already-authenticated Tailscale client, canonical JSON, SHA-256, and local `curl`/Node HTTP probes. No cloud provider, external IdP, remote repository, or external account mutation is part of this plan.

## Scope and authority

- Execution role: `atlas-private-hosting-and-review`; execution scope ID: `g4-local-mini-tailscale-private-hosting-only`; required closed scope IDs: `external-account-mutation`, `indexing`, `medical-content-authoring`, `medical-review-decision`, `public-release`, `remote-repository-mutation`.
- The only deployment this plan can later perform is a private, local process on the existing mini, reachable only through the mini's existing Tailscale address and protected by the application authentication gateway defined below. Cloud deployment, public exposure, DNS, Tailscale account/ACL changes, GitHub/Cloudflare changes, remote creation, push, and PR creation remain closed.
- This plan does not create or apply `review/medical-review-decision.v1.json`, does not change clinical prose or review decisions, does not promote `siteStatus`, and does not set `allowIndexing=true`. G5 durable medical/private-release authorization and G6 public/indexing authorization require later decisions.
- Decision 6 in `/Users/ethanai/co-work/online_sportsinjury/.claude/g2-owner-decisions.md` records owner intent from 吳易澄醫師 at `2026-08-08T12:51:01Z`. The source file SHA-256 at planning time is `34f37b73a5010a7066c30a25053608f22120e13dc465607f7bb3c1d54ba561ba`. Because it is external Markdown rather than strict repository decision JSON, it authorizes this planning/binding cycle only; it is not executable plan authorization.
- A later external authority must create `docs/decisions/2026-08-08-atlas-private-hosting-and-review-authorization.v1.json` with the exact final plan path/hash, role, scope, sorted closed scopes, named authorizer, UTC time, and `executionStatus: "authorized"`; validate it; bind it; commit it; and return to a clean worktree before Task 0 may run.
- The intended reviewer for this private environment is 吳易澄醫師, consistent with Decisions 4 and 5. Possession of an HTTP credential is access evidence only and must never be treated as medical-review identity or a medical decision.

## Draft-time real environment and frozen inputs

- Repository HEAD before this planning commit: `706a73ffef4c6f20f770396e4a1644c41c74482d` on `main`; worktree clean.
- Required runtime: `.node-version` is exactly `24.14.0`; the mini already has `mise` Node `24.14.0`. The login shell's default Node is not acceptable.
- Existing Tailscale node at planning time: DNS name `mac-mini.tailbc16e9.ts.net`, IPv4 `100.114.3.93`, client `1.98.5`. Execution must re-resolve the local node and require the same mini identity and Tailscale online state. A changed node/address or need to log in, edit ACLs, change account settings, enable Serve, or enable Funnel is a stop condition.
- The G4 origin is the tailnet-only listener at `http://100.114.3.93:8140`. Runtime probes may use the raw origin in memory, but tracked artifacts and receipts retain only its SHA-256 hash.
- Existing Tailscale Serve/Funnel configuration is unrelated and outside scope. This plan uses a direct Tailscale-IP bind and must not issue any `tailscale serve`, `tailscale funnel`, `tailscale up`, login, ACL, DNS, or account mutation command. Before/after status digests must match, and no existing handler may proxy the Atlas artifact or port `8140`.
- The current canonical review-set file is `review/review-set.v1.json`, SHA-256 `c78acbba7c0b53c6af7a50fcb1a9f433dcb6ca5537b1b341ea6f5c9629ffd61e`. It contains 26 cases, three injury overviews, and update `2026-q3`; its `contentCommit` is `ce932b45bfa939187efa31f275a87c452e8c46c1`, `contentAuthoritySnapshotDigest` is `0468b041af3a1988297a20cfe62dead98c8a6e1dabf2ffb93683b43f9f346b8e`, `rendererTreeDigest` is `4f6d99df31a8a4d7cda465aa020309f3713a8ae3d0d29912a10dec47539110b9`, and `supportingDataDigest` is `2b3417d5428b6b8f6e00be8edc146d469a7bfb59e376599482e74668fd423c4a`.
- The current tracked renderer-tree digest is `452d0b2b48dfb7f30e05ad872b18f61f0456389c499a8e63b4fa0600148934f9`, so the current review set is stale after later UI work. It cannot be paired with the current `dist` or a new receipt. After every selector/hosting/checker change is complete, execution must generate a new canonical review set at a clean commit, preserving the exact case/overview/update clinical digest projection while updating the content commit and renderer digest.
- All 26 real cases are approved and have matching `nba-v2` source binding/provenance fields, but `CURRENT_SOURCE_POLICY_VERSION` is still `source-policy-v1`. The present `selectMedicallyApprovedCases()` therefore returns 0 and reports 26 provenance-policy failures. This is a real fail-closed defect; it must be repaired with tests, not bypassed or hidden in the hosting verifier.
- At planning time, port `8140` is occupied by a legacy `python3 -m http.server 8140 --directory dist --bind 0.0.0.0` process. Unauthenticated loopback/Tailscale requests return Atlas bytes with no required HTTP `X-Robots-Tag`. This is not access control and is a hard G4 blocker. Its PID is volatile and must never be hard-coded.
- `review/private-dist-manifest.v1.json`, `review/served-review-receipt.v1.json`, and `review/medical-review-decision.v1.json` do not exist. The first two are G4 outputs; the third is expressly outside this plan.
- Draft-time `dist` contains 61 files, but final path count must be generated from the authorized clean build and must never be hard-coded. The manifest must exact-cover every built file, including all HTML/JSON/JS/CSS/fonts/images and `robots.txt`, not merely a hand-picked page sample.

## Fixed access-control design

1. The gateway binds exactly the current `tailscale ip -4` address on TCP `8140`. It must refuse wildcard, loopback, LAN, IPv6-wildcard, or address-fallback binding. `lsof` must show a single listener on the exact Tailscale IPv4 address.
2. Tailscale supplies network reachability and WireGuard transport encryption only. The application gateway independently requires HTTP Basic credentials on every `GET` and `HEAD`, before path decoding, filesystem lookup, redirects, index resolution, or response caching.
3. The username is the fixed non-clinical access label `atlas-reviewer`. The password is a high-entropy secret shown once through `/dev/tty`; it is never written to the repository, environment files, command arguments, receipts, logs, or shell history. Only a salted scrypt verifier is stored in the local user's macOS Keychain under service `tw.sportsmedicine.atlas.private-review.auth-v1` and account `atlas-reviewer`. Comparison uses `timingSafeEqual`; Keychain, verifier, or entropy failure prevents the server from listening.
4. Missing, malformed, or incorrect authorization always returns the same empty `401` response with a generic `WWW-Authenticate: Basic realm="Private review", charset="UTF-8"`. Authentication happens before route resolution so the response cannot reveal whether a path, case, shard, review set, or asset exists.
5. Every response class, including `200`, `401`, `404`, and `405`, receives the exact review `X-Robots-Tag`, `Cache-Control: private, no-store, max-age=0`, `Pragma: no-cache`, `Vary: Authorization`, `X-Content-Type-Options: nosniff`, and the versioned security-header contract. The server sends no `Set-Cookie`, `ETag`, `Last-Modified`, compression, directory listing, redirect, or framework `Server` banner.
6. After successful authentication, only canonical request paths present in the private-dist manifest are served. Directory-index aliases are generated into the manifest explicitly. Unknown, traversal, percent-encoded traversal, dotfile, symlink, alternate-slash, unsupported-method, and fallback requests fail closed.
7. Before listening, the gateway reads every manifest-named file, rejects missing/extra/symlinked files, verifies decoded byte length/hash/content type/identity contract, and holds the verified bytes as the immutable served set. A changed file cannot be served under an old manifest.
8. The local deployment ID is derived from a canonical tuple of build commit, review-set digest, private-dist-manifest digest, gateway configuration digest, and exact listener identity. The receipt stores only its SHA-256 hash. Raw origin, raw deployment ID, credential material, response bodies, HTML, media, and screenshots are forbidden in tracked evidence.
9. Rollback is fail closed: unload the authenticated gateway and leave port `8140` closed. It must never restart the legacy unauthenticated Python server.

## Canonical G4 evidence contracts

### Private dist manifest

`review/private-dist-manifest.v1.json` remains an out-of-tree governance artifact and must not be copied into `dist`. Tighten the existing V1 contract before its first production instance. Its canonical, duplicate-key-rejected bytes must contain:

- top-level build mode, exact build commit, review-set digest and response SHA-256, renderer-tree digest, header-policy digest, generated-at UTC time, and a strictly sorted `files` array;
- for every `dist` file exactly once: build path, canonical request path, decoded SHA-256, decoded byte length, exact content type, data-bearing flag, identity kind, sorted page/record IDs and relevant digest or complete shard IDs, HTML robots-meta contract, HTTP-header contract ID, and `robots.txt` exact-body contract where applicable;
- complete home, every injury/case/league/update route, `/review/review-set.json`, case-index manifest, every case-index shard, about/source-policy/review pages, client modules, styles, fonts/images, and robots coverage derived from the build rather than a maintained allowlist;
- exact equality among local `review/review-set.v1.json`, built `dist/review/review-set.json`, the manifest's review-set entry, and the top-level response digest.

Every HTML route receives one machine-readable artifact identity from the route's real page/record ID. JSON identity is parsed from the actual payload. Asset identity is its canonical request path plus decoded digest. A login page, deny body, fallback HTML, wrong shard, or correct review-set JSON paired with one changed case HTML page must fail validation.

### Served review receipt

`review/served-review-receipt.v1.json` is generated only after the real tailnet origin passes the complete live matrix. Tighten the existing V1 receipt before its first production instance. Its canonical bytes must include:

- private-dist-manifest digest, review-set response SHA-256, private-origin hash, local deployment-ID hash, exact request/auth/body-comparison methods, verified-by identity copied from the exact plan-execution decision, and UTC check time;
- literal complete manifest path count, authorized check count, unauthorized scenario/path count, and zero byte, metadata, identity, header, access, redirect, cache, and leak mismatches;
- sorted authorized per-path metadata: request path/method, `200`, no redirect, content type, decoded length/hash, identity/shard result, robots/noindex/header results, and proof that the body was not a login/deny/fallback document;
- sorted unauthorized metadata for each manifest path under cold missing-auth, repeated warm missing-auth, malformed auth, wrong auth, and credential-removed/new-client scenarios: manual redirect mode, exact `401`, empty/generic body digest, no cookies, no cache bypass, required headers, and false leak flags for Atlas identity, review-set bytes/digest, card summaries, workflow status, and deployment identity;
- canonical digests over both metadata sets so a removed, duplicated, reordered, or edited observation fails validation.

The receipt may retain response hashes and lengths, but never raw URL, raw deployment ID, credentials, Authorization values, bodies, HTML, video/media bytes, screenshots, browser storage, or network archives.

## Task 0: Require the exact external authorization and clean preflight

**Read/verify only:**

- `docs/decisions/2026-08-08-atlas-private-hosting-and-review-authorization.v1.json`
- `docs/decisions/plan-binding.v1.json`
- this plan and the execution index
- current Tailscale/local listener state

Run only after the external decision JSON and its authorization-binding commit exist:

```bash
ATLAS_NODE_BIN="$(mise where node@24.14.0)/bin"
export PATH="$ATLAS_NODE_BIN:$PATH"
ATLAS_HOSTING_PLAN="docs/superpowers/plans/2026-08-08-atlas-private-hosting-and-review.md"
ATLAS_HOSTING_DECISION="docs/decisions/2026-08-08-atlas-private-hosting-and-review-authorization.v1.json"

test "$(node --version)" = "v24.14.0"
test -z "$(git status --porcelain)"
test -f "$ATLAS_HOSTING_DECISION"
npm run plan:decision:verify -- --decision "$ATLAS_HOSTING_DECISION" --plan "$ATLAS_HOSTING_PLAN"
npm run plan:verify
npm run plan:assert-authorized -- "$ATLAS_HOSTING_PLAN"
test "$(tailscale ip -4)" = "100.114.3.93"
```

Then read the local Tailscale self record and require the same mini identity, online state, and no Atlas port in Serve/Funnel. Hash the full pre-state locally for later equality; do not persist its raw unrelated configuration. Resolve the single current `8140` listener with `lsof`, inspect its executable, complete command, cwd, bind address, and served directory, but do not stop it until Task 6. Any decision mismatch, dirty tree, wrong Node, changed mini/address, unavailable Tailscale, account prompt, ambiguous listener, or unrelated service ownership stops execution.

## Task 1: Align policy selection and content-authority semantics (red → green)

**Files:**

- Modify: `src/lib/contracts/site-governance.ts`
- Modify: `src/lib/cases/review-validation.ts`
- Modify if needed for one canonical constant: `src/lib/research/candidate-manifest.ts`
- Modify: `src/lib/governance/release-gate.ts`
- Modify: `scripts/generate-review-set.ts`
- Modify: `tests/unit/case-selectors.test.ts`
- Modify: `tests/unit/real-content-authoring.test.ts`
- Modify: `tests/unit/release-gate.test.ts`
- Modify: `tests/unit/review-set.test.ts`
- Modify only synthetic policy fixtures; do not edit real source manifests, decisions, registry entries, cases, overviews, updates, or their clinical review fields.

1. First add failures proving that the 26 real registry-bound records are `nba-v2`/`nba-v2`, yet the current medically-approved selector returns zero; an `nba-v2` record with current identity digest must be admitted after the fix, while `source-policy-v1`, `nba-v1`, unknown, mismatched binding/provenance, stale identity digest, and inactive/superseded source binding remain rejected.
2. Promote the single production current source-policy authority to `nba-v2`. `hasCurrentProvenanceVerification()` must require all three values to agree: the canonical current policy, `record.sourceManifestBinding.sourcePolicyVersion`, and `record.video.sourceProvenanceVerification.verifiedPolicyVersion`, plus the current video-identity digest. Do not implement an `nba-v2 OR source-policy-v1` alias and do not rewrite frozen `nba-v2` source bytes.
3. Keep active registry/source-decision validation as an independent mandatory gate for the complete selected set. The policy correction must not bypass `validateCaseSourceBinding()`, diagnosis confirmation, medical digest matching, public-rights decisions, publication decisions, or indexing gates.
4. Assert the real medically-approved projection is exactly 26 cases with ACL/ankle/Achilles counts `7/12/7`. Assert the public selector remains zero because public-rights decisions are not authorized. The unchanged G5/G6 floors of `10/10/10` and 30 total remain unsatisfied; G4 may host the 26-case review set but must not report G5/private-release or public readiness.
5. Fix `currentContentAuthoritySnapshotDigest()` to parse execution roles and include only specification, controller, platform foundation, source-discovery plans that produced referenced batches, and the active authoring plan. An appended/authorized G4 or G6 operational plan must not alter the completed clinical authority snapshot or create a review-set authorization cycle. Add temporary-binding regressions proving G4/G6 authorized and any not-authorized plan leave the digest unchanged, while a permitted source/authoring authority change does change it.

Run:

```bash
npm run test:unit -- tests/unit/case-selectors.test.ts tests/unit/real-content-authoring.test.ts tests/unit/release-gate.test.ts tests/unit/review-set.test.ts tests/unit/plan-binding.test.ts
npm run content:check
```

Expected: exact `nba-v2` currentness is fail closed, the real selected counts are `7/12/7`, public selection is still empty, and operational plan authorization does not change the content-authority digest.

## Task 2: Make private-manifest and served-receipt contracts G4-complete (red → green)

**Files:**

- Modify: `src/lib/governance/artifact-manifest.ts`
- Modify: `src/lib/governance/served-artifact-receipt.ts`
- Modify: `src/lib/governance/medical-review-decision.ts`
- Modify: `src/lib/governance/release-gate.ts`
- Modify: `ops/http-header-policy.v1.json`
- Modify: `tests/unit/artifact-manifest.test.ts`
- Modify: `tests/unit/review-set.test.ts`
- Modify: `tests/unit/release-gate.test.ts`
- Modify: `tests/unit/indexing-policy.test.ts`

1. Write strict-schema failures for every required manifest/receipt field above, duplicate/unsorted paths, build/request alias collisions, missing/extra `dist` files, noncanonical bytes, wrong review-set response, wrong identity/shard IDs, stale header-policy digest, nonzero mismatch counts, partial unauthorized matrices, redirect following, cookies, cacheable responses, leak flags, and raw URL/deployment/credential/body fields.
2. Tighten the V1 schemas atomically because no production private manifest or receipt exists yet. Preserve one shared byte-comparison validator for later medical-decision/public-gate consumption; do not accept a legacy short receipt as G4-complete.
3. Make `validateMedicalReviewDecisionArtifacts()` and the release gate require the expanded private manifest and receipt, full authorized and unauthorized coverage, zero mismatches, and exact review-set response bytes. Retain the regression where changing one case HTML page while keeping the review-set JSON correct fails.
4. Expand the versioned header policy to the fixed noindex/cache/security contract. Static HTML robots meta and `robots.txt` remain independently checked; HTTP headers are not marked verified until Task 7 live requests pass.

Run:

```bash
npm run test:unit -- tests/unit/artifact-manifest.test.ts tests/unit/review-set.test.ts tests/unit/release-gate.test.ts tests/unit/indexing-policy.test.ts
```

## Task 3: Generate a complete private-dist manifest from the real build

**Files:**

- Create: `scripts/private-hosting/generate-private-dist-manifest.ts`
- Create: `tests/unit/private-dist-manifest.test.ts`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: data-bearing page routes under `src/pages/**` only as needed to emit one canonical machine-readable identity
- Modify: `package.json`

1. Add a failing temp-`dist` suite for complete walk/coverage, content-type mapping, directory-index request aliases, HTML/JSON identity extraction, shard ID coverage, assets, review-set exact bytes, robots/meta/header contracts, symlinks, traversal, collisions, extra files, and deterministic canonical output.
2. Add `npm run private:manifest` to walk the actual `dist`, validate every file, and write only `review/private-dist-manifest.v1.json`. It must refuse a dirty source commit, a non-review build, missing/stale review set, renderer-digest mismatch, or any output not exact-covered.
3. Add a stable artifact-identity meta value to each HTML route from its real route/page/record identity. Never place credentials, reviewer secrets, raw private origin, or deployment identity in HTML.
4. Derive all path and count data from `dist`. No current 61-file count or route sample becomes an assertion.

Run on a temporary fixture first:

```bash
npm run test:unit -- tests/unit/private-dist-manifest.test.ts
```

Do not generate the production manifest until Task 5 freezes the final review build.

## Task 4: Implement the mini/Tailscale authentication gateway (red → green)

**Files:**

- Create: `ops/private-hosting.v1.json`
- Create: `ops/launchd/tw.sportsmedicine.atlas.private-review.plist.template`
- Create: `scripts/private-hosting/provision-review-credential.ts`
- Create: `scripts/private-hosting/serve-private-review.ts`
- Create: `scripts/private-hosting/manage-private-review-service.ts`
- Create: `tests/unit/private-auth-server.test.ts`
- Modify: `.gitignore` only if a narrowly named local state/output path is required
- Modify: `package.json`

1. Start with integration failures for missing Keychain verifier, wrong Node, wildcard/loopback/LAN bind, auth checked after route lookup, malformed/wrong/missing Basic auth, timing-safe verifier use, unsupported methods, unknown/traversal/symlink/fallback paths, manifest/file drift, extra files, stale review set, wrong response types, cache/cookie/compression headers, and sanitized logs.
2. Implement Keychain provisioning through `/dev/tty`. Store only the versioned scrypt verifier under the fixed service/account names; a secret must never cross a command-line argument or tracked file. Re-provisioning requires explicit confirmation and invalidates any running credential session.
3. Implement the manifest-allowlisted Node gateway with the fixed design above. It must fully verify and load the immutable artifact before binding, and fail closed on any credential/config/artifact/Tailscale mismatch.
4. Render the user LaunchAgent into an untracked local state directory with exact absolute paths and the Node 24.14.0 binary. The repository template contains no personal absolute path or secret. Management commands must target only the exact versioned launchd label.
5. Add `private:credential`, `private:serve`, and `private:service` scripts. Unit/integration tests use temp ports and temp key stores; they do not touch the real Keychain, launchd, Tailscale, or port `8140`.

Run:

```bash
npm run test:unit -- tests/unit/private-auth-server.test.ts tests/unit/artifact-manifest.test.ts
```

## Task 5: Implement the complete live verifier and receipt writer (red → green)

**Files:**

- Create: `scripts/private-hosting/verify-private-review.ts`
- Create: `tests/unit/private-host-verifier.test.ts`
- Modify: `package.json`

1. Add failures for every omitted path/scenario, unexpected `200/3xx/403/404`, redirect following, wrong content type/length/hash/identity/shard, login/deny/fallback HTML, missing header/meta/robots policy, cookies, cache reuse, body leak, second unauthenticated origin, altered one-page HTML with unchanged review-set JSON, raw sensitive receipt fields, and noncanonical receipt bytes.
2. Implement `npm run private:verify` using Node HTTP requests with `Accept-Encoding: identity` and manual redirects. Prompt for the raw password through `/dev/tty`; keep it only in memory and redact all thrown errors. Use fresh clients for cold/no-cookie scenarios and repeat requests for warm/credential-removal scenarios.
3. The unauthorized matrix covers every manifest request path under all fixed scenarios. The authorized pass covers the identical complete path set and compares decoded bytes/metadata/identity against the local manifest. `/review/review-set.json` receives a separate exact comparison with canonical local review-set bytes.
4. Probe loopback, current LAN addresses, wildcard-listener state, the legacy direct origin, and Tailscale Serve/Funnel status to prove no second unauthenticated route serves the same artifact. Do not probe public Internet services or mutate any network/account configuration.
5. Write the receipt only after zero mismatches. On any failure, remove no evidence, write no success receipt, keep the service fail closed, and report the exact path/scenario without bodies or credentials.

Run only against temp servers in this task:

```bash
npm run test:unit -- tests/unit/private-host-verifier.test.ts tests/unit/private-auth-server.test.ts tests/unit/artifact-manifest.test.ts
```

## Task 6: Freeze final bytes, cut over the legacy listener, and start the private service

All implementation changes from Tasks 1–5 must first pass formatting, checks, unit tests, and review build, then be committed conventionally. Re-run Task 0 and require a clean worktree.

1. Generate a new canonical review set at that clean implementation commit. Compare its sorted 26 case clinical digests, three overview digests, update ID/digest, source-batch bindings, content-authority digest, and supporting-data digest with the frozen baseline. Only the expected clean content commit and renderer-tree consequences may differ. Any clinical/source/update drift stops; do not bless it as hosting work.
2. Commit the regenerated `review/review-set.v1.json` alone, return clean, build the review artifact, and run the static verifier. Generate the production private-dist manifest from that exact clean build. Commit the canonical manifest alone, rebuild, and prove byte-for-byte that the manifest remains exact.
3. Resolve the current `8140` listener again. Require exactly one process whose executable, command, cwd, served directory, and wildcard bind match the previously inspected legacy Atlas Python server. If zero, multiple, changed, or ambiguous, stop for owner direction. Never trust or terminate a saved PID.
4. Send `TERM` only to that exact resolved process, wait briefly, and require port `8140` closed. Do not use recursive/process-name-wide kill commands and do not restart the legacy server on any later failure.
5. Provision the local credential interactively, install/load the exact LaunchAgent, and start the authenticated gateway. Require `lsof` to show exactly one listener on `100.114.3.93:8140`, with no `0.0.0.0`, `127.0.0.1`, IPv6 wildcard, or LAN listener. Require the pre/post Tailscale Serve/Funnel status digests to match and no handler for Atlas/8140.
6. Before writing a receipt, make one manual no-credential request and require generic `401`; make one interactive authorized request and require the expected homepage identity. These are safety checks, not the complete G4 proof.

If any post-cutover check fails, unload the new exact LaunchAgent and leave the port closed. Rollback never means restoring `python -m http.server`.

## Task 7: Produce the real served-review receipt and pass G4

Run the live verifier against the in-memory private origin and the final private-dist manifest. It must complete every unauthorized and authorized request in one bounded run and write `review/served-review-receipt.v1.json` only on zero mismatches.

Then run:

```bash
npm run private:verify
npm run test:unit -- tests/unit/artifact-manifest.test.ts tests/unit/private-dist-manifest.test.ts tests/unit/private-auth-server.test.ts tests/unit/private-host-verifier.test.ts tests/unit/review-set.test.ts tests/unit/release-gate.test.ts tests/unit/indexing-policy.test.ts tests/unit/case-selectors.test.ts tests/unit/real-content-authoring.test.ts
npm run format:check
npm run check
npm run content:check
npm run build:review
npm run verify:review-artifact
npm run test:e2e
npm run brand:verify
```

Re-run `private:verify` after the final build. If it changes any served byte, the manifest and first receipt are stale; regenerate/redeploy/reverify rather than editing the receipt. Commit only the validated canonical receipt and any mechanically required nonclinical binding update, then return to a clean worktree.

Run the public negative gate separately:

```bash
set +e
npm run release:public
public_release_exit=$?
set -e
test "$public_release_exit" -ne 0
```

Expected: the final assertion exits 0 because public rights, 30-case/10-per-injury floors, public URLs/policies, site-publication decision, deploy instruction, and indexing authorization remain absent. Never weaken this gate to make the private build green.

## G4 completion evidence and stop point

G4 is complete only when all of the following are simultaneously true:

- exact authorized plan/decision binding, Node 24.14.0, and clean-commit provenance are recorded;
- the legacy wildcard server is gone, one authenticated gateway listens only on the mini's exact Tailscale IPv4 address, unrelated Tailscale/account/Serve/Funnel state is unchanged, and rollback is closed-port only;
- the final review set is current for the exact renderer/supporting-data/authority state and preserves all 26 case, three overview, and `2026-q3` clinical digest bindings;
- exact current `nba-v2` selection yields 26 medically approved records (`7/12/7`), active source bindings validate, public selection remains empty, and no case/source/review bytes were relabeled or bypassed;
- the canonical private-dist manifest exact-covers every built file and binds path, decoded bytes, type, identity, review set, noindex, headers, and robots;
- every unauthenticated cold/warm/malformed/wrong/credential-removed request to the complete path set is genuinely denied without leaks or cache bypass, and every authenticated request to the identical path set returns the exact expected status/type/identity/decoded bytes/headers;
- the strict served-review receipt binds the manifest, review-set response, hashed origin/deployment identity, complete counts, zero mismatches, verifier, and UTC time without retaining secrets or bodies;
- local static/unit/E2E gates pass and the public release gate still fails for the expected closed conditions;
- no remote, push, PR, cloud/DNS/account mutation, public exposure, indexing, clinical edit, formal medical decision, or G5/G6 state transition occurred.

At that point leave the authenticated private service available for the named reviewer and stop. Report only "G4 access-controlled private staging complete" with manifest/receipt/review-set digests and hashed origin/deployment identity. Do not create/apply the formal medical-review decision, do not call the deployment public, and do not proceed to G5 or G6 until the required external decision arrives.

## Current planning-cycle bind and stop

This section is the only executable work in the current cycle. After this document is final, bind it append-only as not authorized:

```bash
ATLAS_NODE_BIN="$(mise where node@24.14.0)/bin"
export PATH="$ATLAS_NODE_BIN:$PATH"
ATLAS_HOSTING_PLAN="docs/superpowers/plans/2026-08-08-atlas-private-hosting-and-review.md"

test "$(node --version)" = "v24.14.0"
npm run plan:bind -- "$ATLAS_HOSTING_PLAN" --status not-authorized --role atlas-private-hosting-and-review --scope g4-local-mini-tailscale-private-hosting-only --closed-scopes external-account-mutation,indexing,medical-content-authoring,medical-review-decision,public-release,remote-repository-mutation
npm run plan:verify
```

Verify `plan:assert-authorized` fails in a separately captured negative check, stage only this plan plus `docs/decisions/plan-binding.v1.json`, make one conventional documentation commit, confirm the worktree is clean, print this plan's SHA-256, and stop. Authorization binding belongs to the later external `PlanExecutionDecisionV1` cycle.
