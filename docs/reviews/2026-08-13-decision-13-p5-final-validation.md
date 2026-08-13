# Decision 13 Phase 5 final validation

Date: 2026-08-13

Status: **Decision 13 complete; private review refreshed; no public release**

## Final source and immutable inputs

Every Phase 5 command used the pinned Node `v24.14.0` runtime. The integrated
source/evidence commit was
`8df17fab514c9cacce2475f3999df17d4147e98c`. It was clean before the artifact
cycle began.

The Decision 13 resumption preflight had first confirmed Node `v24.14.0`, a
clean worktree, and exact starting `HEAD`
`0f8598a84d46e1ddf2c432f7fd1253f4bf96f4aa` before recording the owner/legal
disposition.

The immutable governance inputs remain byte-identical:

| Input                       | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Decision 13 plan            | `fa51499b7c64c4c8c9f3b06b5307e003c183db28bf226fe14b8a3c01b951b5d4` |
| Owner authorization         | `2f956058412d5244554b310dfc866f2805ac623f6f999e6fdd958117c1d25aad` |
| Plan binding                | `71fadfee254c3cf1cbede3e754cbc17b3923c04c3a4d75aed7232a1c99bcd306` |
| Governed clinical aggregate | `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73` |

The clinical freeze passed for all 30 governed files. No case, injury-overview,
quarterly-update, diagnosis, observation, management, or return-to-play byte
changed. `src/data/site-governance.v1.json` still has
`allowIndexing=false`. The current player-photo registry has zero
`game-action-high-risk` selections: all 26 cases resolve through 21 current
athlete selections consisting of five verified Commons photos and 16 original
SVG fallbacks.

## Integrated validation

| Gate                                                                   | Result                                                                                         |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run plan:verify`                                                  | passed; 22 bound documents                                                                     |
| `npm run plan:decision:verify -- --decision … --plan …`                | passed; authorization digest matched                                                           |
| `npm run plan:assert-authorized -- <Decision 13 plan>`                 | positive pass                                                                                  |
| `npm run format:check`                                                 | passed                                                                                         |
| `npm exec -- tsc --noEmit`                                             | passed                                                                                         |
| `npm run check`                                                        | passed; 0 errors, 0 warnings, 15 hints                                                         |
| content, research, research-manifest, and research-registry checks     | passed                                                                                         |
| source-policy v6 and player-photo registry v5 checks                   | passed                                                                                         |
| player-photo asset, brand-consumer, and 30-file clinical-freeze checks | passed                                                                                         |
| `npm run test:coverage`                                                | passed; 53 files and 929/929 tests                                                             |
| Coverage                                                               | statements 87.21%, branches 82.29%, functions 93.62%, lines 87.63%                             |
| `npm run test:e2e`                                                     | passed; 216/216 across Chromium, Firefox, WebKit, and mobile Chromium                          |
| `git diff --check`                                                     | passed                                                                                         |
| Phase 4 after-evidence gate                                            | accepted; 42 routes, both viewports, no-JavaScript, runtime, central fields, and source ledger |
| `npm run build:review` and `npm run verify:review-artifact`            | passed; 42 pages, 355 optimized image outputs, 451 manifest files, and all noindex guards      |

The source-policy v6 digest was
`1e27041de184b7b6397b2cfdde225706b40696f1d4456757193baa340f4cc93c`;
the player-photo registry v5 digest was
`26129455fe5b9297c44ac91c3be1fc1678a928cf77bd12d00695614fe5df3985`.
After the private smoke, the final docs-only gate re-ran `plan:verify`,
`plan:decision:verify`, `plan:assert-authorized`, Prettier, the 30-file clinical
freeze, player-photo registry/assets, immutable SHA-256 assertions,
`allowIndexing=false`, and `git diff --check`; all passed before this evidence
commit.

## Ordered artifact chain

The required sequence was executed without rebuilding between the manifest
commit and service restart:

1. From clean source commit `8df17fa`, `npm run review-set:generate` changed
   only `review/review-set.v1.json`. The file binds content commit `8df17fa`, 26
   cases, three overviews, and the current quarterly update. Its SHA-256 is
   `101cefa9d19638f8b81edc7bc094f3c6a51c83cc48738e25fa7b5c37748b0c4d`,
   renderer-tree digest is
   `1d61d8e3118509e357496f2e0eafe0db496228ce364af3cb9e47c347ea792004`,
   and supporting-data digest is
   `54d2953c8b9426d54285a5352c195e50e479a1d57af7916c6afb704820b32c9e`.
2. The review set alone was committed as
   `cfb23acf70be6a14d803fc79348d5822dfd89946`, with subject
   `chore(review): refresh Decision 13 review set`.
3. From clean commit `cfb23ac`, `npm run build:review` produced 42 pages and
   355 optimized image outputs. `npm run verify:review-artifact` passed; the
   built `review-set.json` was byte-identical to the committed review set, and
   the artifact contained no sitemap, analytics, iframe, preconnect, non-local
   image, or indexable route.
4. `npm run private:manifest` changed only
   `review/private-dist-manifest.v1.json`. All 451 named files independently
   matched their lengths and SHA-256 values. The manifest binds build commit
   `cfb23ac`, review-set digest and response digest
   `101cefa9d19638f8b81edc7bc094f3c6a51c83cc48738e25fa7b5c37748b0c4d`,
   renderer digest
   `1d61d8e3118509e357496f2e0eafe0db496228ce364af3cb9e47c347ea792004`,
   and header-policy digest
   `bebeb04e1f2aad8020d20a25af30eb37b92fd0e70ad122acad2560cb6fab34b0`.
   Its own SHA-256 is
   `b63608ca9a54c77c0ffb6d4ab2b40bdf6897c4228a79cc8deb506b90212d7c01`.
5. The private manifest alone was committed as
   `5ec23dd02811ef5ec9661b7e893e46fc6b0c1033`, with subject
   `chore(review): refresh Decision 13 private manifest`.
6. Only after that clean commit, `npm run private:service -- restart` invoked
   the existing service's exact
   `/bin/launchctl kickstart -k gui/501/tw.sportsmedicine.atlas.private-review.v1`
   path once. No `render`, `load`, `unload`, alternate listener, or credential
   provisioning command was run.

## Existing-service identity and restart

| Property      | Before restart                              | After restart       |
| ------------- | ------------------------------------------- | ------------------- |
| launchd label | `tw.sportsmedicine.atlas.private-review.v1` | unchanged           |
| launchd state | running                                     | running             |
| launchd runs  | 9                                           | 10                  |
| wrapper PID   | 57895                                       | 71225               |
| listener PID  | 57897                                       | 71237               |
| listener      | `100.114.3.93:8140`                         | `100.114.3.93:8140` |
| executable    | pinned Node 24.14.0 path                    | unchanged           |

The listener is bound only to the existing Tailscale address, not
`127.0.0.1`. The launchd plist remained mode `0600`, owner uid 501, one hard
link, 1,643 bytes, and SHA-256
`fe3ba9f506255f1243e8977eaa93fa14e4158aa6e5016a793a16ad3dc5ea5f45`.
The access handoff remained mode `0600`, owner uid 501, one hard link, and 140
bytes. The existing Keychain credential remained present; no credential value
was placed in argv, environment variables, logs, or this report.

Configuration digests were unchanged:

- private-hosting contract:
  `937fe2d223271153b3337b4930fd4f0e980c3cf8bce77ca1e9228c3487f218c3`
- HTTP header policy:
  `bebeb04e1f2aad8020d20a25af30eb37b92fd0e70ad122acad2560cb6fab34b0`
- launchd template:
  `71d5a3307bcedfeb722554c5c5f3312b83277155f7c524376dea13e9e194aa57`
- private server:
  `b7e693336b83f1de091cee316187921a339b3df94e950f98c10731fc662b7c51`
- service manager:
  `d1313d8205ca6fd7d2f5f4e2b9e1fe9b916527c63a0887d76d6898dfbd5fad3f`

## Authenticated and unauthenticated smoke

All smoke traffic used `http://100.114.3.93:8140`; no check used
`127.0.0.1`.

- The unauthenticated root returned `401`, an empty body, and remote endpoint
  `100.114.3.93:8140`. It returned the exact private/no-store, pragma, vary,
  nosniff, noindex/nofollow/noarchive/nosnippet/noimageindex, and Basic realm
  headers, with no forbidden header.
- An in-process credential reader constructed authorization only in memory.
  Nine representative authenticated responses matched their private-manifest
  bytes exactly: root, Kevin Durant case, Anfernee Simons case, Achilles
  overview, quarterly update, credits/notices, source policy, review set, and
  robots. Result: `9/9`.
- Four representative unauthenticated routes returned `401` with empty bodies:
  root, Kevin Durant case, credits/notices, and review set. Result: `4/4`.
- Body assertions proved the exact compact and footer notice counts, the five
  central credit rows, Kevin Durant and LeBron James `not-supplied` title text,
  asset-specific anchors, the visible YouTube connection statement, the
  corrected source-policy paragraph, and exact robots bytes.
- The served review-set SHA-256 was
  `101cefa9d19638f8b81edc7bc094f3c6a51c83cc48738e25fa7b5c37748b0c4d`;
  the private manifest SHA-256 was
  `b63608ca9a54c77c0ffb6d4ab2b40bdf6897c4228a79cc8deb506b90212d7c01`.

One supplementary, non-gating stress attempt targeted an exhaustive matrix over
all 451 files and five unauthenticated client permutations, with the receipt
writer replaced by a no-op. It exceeded its transport deadline late in the
`credential-removed-new-client` permutation, so it is not reported as a pass.
This was outside the plan-required representative smoke above and changed no
state. Post-attempt checks reconfirmed the credential, access-file identity,
listener, and service state. The historical served receipt was not regenerated:
its worktree and `HEAD` SHA-256 both remain
`7a6cc42cbd63a29130e51db891051dddc35b73a886cf65bfaaf5ff9538a5e2e0`.

## Notice and evidence completion

Phase 3 was accepted and Phase 4 unblocked after the named disposition was
recorded. Phase 4 then passed its complete after-evidence gate:

- all 30 clinical consumption routes show the approved compact sentence inside
  both initial viewports;
- all 42 routes have one canonical footer sentence, with both old footer
  families absent;
- 46/46 adjacent asset links resolve to 5/5 complete central rows;
- both `not-supplied` work-title states and all three BY-SA Adapter's License
  rows are visible;
- all 10 YouTube connection disclosures are visible at 390px;
- no clipping, deep-link/sticky-header overlap, or completed third-party request
  was observed.

The after inventory, evidence manifest, and before/after comparison digests are
respectively
`b00f2a323196643ce6681b56d752d7cc48429b5dc5371b063ad5235a23b452db`,
`e0cef616598c6cb8ff12320196374cc564005094d16927078eeed684a31ffb31`,
and `f8c9be4ff05383b8a3d794b59842c7f12e394b5ed0e7e5196c8ef08ed6846221`.

## Closed scopes and final outcome

All eight closed scopes remain closed: `deployment`,
`external-account-mutation`, `hosting-service-mutation`, `indexing`,
`medical-content-authoring`, `medical-review-decision`, `public-release`, and
`remote-repository-mutation`.

Nothing was pushed, deployed, indexed, or publicly released. No external
account, hosting configuration, credential, listener address, or service
identity was changed. Apart from the plan-required one-time restart, only the
already-authorized reviewed bytes advanced on the existing private service.
Phase 5 is accepted and Decision 13 is complete.
