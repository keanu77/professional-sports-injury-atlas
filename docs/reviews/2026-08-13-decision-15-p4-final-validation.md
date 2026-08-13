# Decision 15 Phase 4 final validation

- Date checked: 2026-08-14
- Runtime: Node `v24.14.0`
- Scope: `decision-15-photo-first-covers-only`
- Status: **Phases 0–4 complete; private review refreshed; no public release**
- Final projection: **21 photos / 0 SVG fallbacks / 21 athletes / 26 cases**

Decision 15 re-adjudicated the 14 Decision 14 SVG slots under `nba-v8` before
performing any supplemental search. All 14 frozen candidates carried an
explicit supported CC or public-domain marker, passed the unchanged
different-injury-event gate, and became current photos. Phase 2 therefore had
an empty search queue. The seven photos already current in registry v6 remain
byte- and selection-identical.

The starting partition was seven photos and 14 SVG fallbacks. The final
partition is 21 photos and zero SVG fallbacks. Consequently, there is no
retained SVG and no SVG-retention reason to report; the frozen
`no-explicit-cc-or-pd-candidate` outcome set is empty.

## Governance, lineage, and phase commits

The authorization and plan remained byte-identical. The final governance
checks validated 26 bound documents, reproduced the exact authorization
digest, and positively asserted the Decision 15 plan's authorized role and
scope.

| Input or successor          | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Authorized Decision 15 plan | `c437934088648ac2b31fbc65b5fe32726d201fad9b361c4c658afc46fe4ec86d` |
| Owner authorization JSON    | `e1354757fb25e6a3a72f2d7e69b04951044ae459b3033ab7529dc57add0aa97a` |
| Plan-binding registry       | `caca757512554bedbc214d181d4e42fae3aff27cc5122e8754ea317a37c7357e` |
| Phase 0 baseline evidence   | `60b6b2d5498d577f1774e5a02f8b0eb033d64f0ec1fe7f3b52d5a54070c60e11` |
| Phase 1 adjudication        | `d2693d9dbba52d647cbad7759c86ab9891a21e4ac5e06d42b96032744606c26e` |
| Phase 2 zero-search result  | `888414d0894b9dfb608063788671d25d74fe5524d2a84876d6081cb914f28498` |
| Phase 3 adoption report     | `2a94173eb72134d0d27e4ea353d5e4b585adc137964ead0ffcab2c8831cd5407` |
| nba-v8 Markdown             | `20a9209bd523604efe3251f6ef159e6432fa9280951ea16d630ee02cc347557d` |
| nba-v8 canonical JSON       | `30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e` |
| Registry v6 predecessor     | `16851aaa3d1dd223f20f102ef543f104a23ee61335a796f4b70cbe75d76d5cf0` |
| Registry v7 successor       | `77a146729b95802fbe978bc8a4360ed54929121936a04454afe49998ea93b0c4` |

The completed bounded commits before this docs-only closeout are:

| Phase                    | Commit                                     | Subject                                                      |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------ |
| Governance authorization | `a184f55e6ed42dbdd7e14214f22761127927365c` | `docs(governance): authorize Decision 15 photo-first covers` |
| Phase 0                  | `811efbc625c2faa89879536044036cca1c63bba6` | `feat(governance): freeze Decision 15 phase 0 contract`      |
| Phase 1                  | `3a49507ae16f52a8113eee06322ac6319bca869b` | `docs(review): readjudicate Decision 15 frozen candidates`   |
| Phase 2                  | `0afad8d4759ca49c93a2c4932454df6f3564c2da` | `docs(review): freeze Decision 15 empty search queue`        |
| Phase 3                  | `86271c0d8681d74ad9fa5999ba241e86e798d9dc` | `feat(covers): adopt Decision 15 photo-first covers`         |
| Phase 4 review set       | `f76852fe74eab0c11841714797ecba63fe90047f` | `chore(review): refresh Decision 15 review set`              |
| Phase 4 private manifest | `9ee2ce4507046ae035b2441de2b2aeeaeba8bb94` | `chore(review): refresh Decision 15 private manifest`        |

## Final 21-slot result

| Athlete slot      | Lineage                | Final result                            |
| ----------------- | ---------------------- | --------------------------------------- |
| Anfernee Simons   | Decision 15 target     | Photo adopted                           |
| Anthony Edwards   | Decision 15 target     | Photo adopted                           |
| Brandon Clarke    | Decision 15 target     | Photo adopted                           |
| CJ McCollum       | Protected v6 selection | Current photo retained byte-identically |
| Damian Lillard    | Protected v6 selection | Current photo retained byte-identically |
| Danny Green       | Decision 15 target     | Photo adopted                           |
| Dejounte Murray   | Decision 15 target     | Photo adopted                           |
| Dwight Powell     | Protected v6 selection | Current photo retained byte-identically |
| Ja Morant         | Decision 15 target     | Photo adopted                           |
| Jayson Tatum      | Protected v6 selection | Current photo retained byte-identically |
| Joe Ingles        | Decision 15 target     | Photo adopted                           |
| Kevin Durant      | Protected v6 selection | Current photo retained byte-identically |
| Kyrie Irving      | Protected v6 selection | Current photo retained byte-identically |
| LaMelo Ball       | Decision 15 target     | Photo adopted                           |
| LeBron James      | Protected v6 selection | Current photo retained byte-identically |
| Markelle Fultz    | Decision 15 target     | Photo adopted                           |
| Moritz Wagner     | Decision 15 target     | Photo adopted                           |
| Ricky Rubio       | Decision 15 target     | Photo adopted                           |
| Thomas Bryant     | Decision 15 target     | Photo adopted                           |
| Trae Young        | Decision 15 target     | Photo adopted                           |
| Tyrese Haliburton | Decision 15 target     | Photo adopted                           |

All 21 slots are local Commons photos. The prior 14 SVGs remain available only
as exact rollback assets and are referenced by the v7 supersession records;
none is current.

## New-photo rights and source-displayed credit

The term “source-displayed credit” below records the exact attribution string
shown by the fixed evidence. It does not elevate an uploader or account name
into a verified photographer identity or licensing authority.

| Athlete           | Exact rights bucket/version              | Source-displayed credit                                                                  |
| ----------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Anfernee Simons   | CC BY-SA 4.0                             | Frenchieinportland                                                                       |
| Anthony Edwards   | CC BY-SA 4.0                             | Bryan Berlin / WikiPortraits                                                             |
| Brandon Clarke    | CC BY 2.0                                | Erik Drost                                                                               |
| Danny Green       | CC BY 2.0                                | Des Runyan                                                                               |
| Dejounte Murray   | Public domain — `PD-USGov-Military-Navy` | `U.S. Navy photo by Mass Communication Specialist 2nd Class Shayla D. Hamilton/Released` |
| Ja Morant         | CC BY 2.0                                | Katie Dugan / Gamecock Central                                                           |
| Joe Ingles        | CC BY-SA 4.0                             | Frenchieinportland                                                                       |
| LaMelo Ball       | CC BY 2.0                                | Erik Drost                                                                               |
| Markelle Fultz    | CC BY-SA 2.0                             | Mogami Kariya                                                                            |
| Moritz Wagner     | CC BY-SA 4.0                             | Sandro Halank, Wikimedia Commons                                                         |
| Ricky Rubio       | CC BY 2.0                                | Joe Bielawa                                                                              |
| Thomas Bryant     | CC BY-SA 4.0                             | TonyTheTiger                                                                             |
| Trae Young        | CC BY 2.0                                | Erik Drost                                                                               |
| Tyrese Haliburton | CC BY-SA 4.0                             | Chensiyuan                                                                               |

The new 14-photo rights partition is six CC BY, seven CC BY-SA, and one
public-domain work. Exact versions are six CC BY 2.0, six CC BY-SA 4.0, one CC
BY-SA 2.0, and one `PD-USGov-Military-Navy`. Across all 21 current photos the
partition is eight CC BY, 12 CC BY-SA, and one public-domain work.

Murray remains modeled separately from Creative Commons: top-level and nested
license fields are `null`, every Adapter's License field is `null`, the exact
`PD-USGov-Military-Navy` token and DVIDS source are retained, and the Navy
credit and `/Released` notice are displayed. The registry does not call the
work CC0 or invent a license version.

## Binary, event, attribution, and ShareAlike gates

All 14 Decision 15 source originals passed exact fixed-revision, MediaWiki
SHA-1, local SHA-256, byte-length, MIME, dimensions, and complete-JPEG checks.
All 14 passed the unchanged different-injury-event gate, focal safety at 5:2
and 16:9, fixed-evidence display, exact terms/status link, per-file title/notice
supply-state recording, and displayed-credit fulfillment. The complete
per-file facts are frozen in the Phase 3 report.

Eleven already-present originals were validated in place and were not
downloaded again. With the owner-specified descriptive User-Agent, serial
requests, five-second spacing, and 600-second transfer limit, the three missing
originals each returned HTTP 200 on the first attempt and then matched the
frozen evidence exactly:

| Athlete           |      Bytes | MediaWiki SHA-1                            | Local SHA-256                                                      |
| ----------------- | ---------: | ------------------------------------------ | ------------------------------------------------------------------ |
| Thomas Bryant     |  1,345,351 | `d2f87cf6324edfc9039ccc1e6e4994577bacc7f7` | `b651bb59f1caa3dfe67ff81ab524610002b8c677f710206111d58b5d6c9d589b` |
| Trae Young        | 39,619,306 | `193bb8a75e73f878359d136f0769205a4a8693ba` | `b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0` |
| Tyrese Haliburton |  6,113,037 | `45d283ff520c757dc5eeb4993aa24b3ca91a7b13` | `8a307fe26217d5c951d8647367207cb6c383a83ea96b1c6361e969ab1c914270` |

The seven new ShareAlike works—Anfernee Simons, Anthony Edwards, Joe Ingles,
Markelle Fultz, Moritz Wagner, Thomas Bryant, and Tyrese Haliburton—are
`placement-rendition-only`. Fultz carries a crop-only CC BY-SA 2.0 Adapter's
License; the other six carry crop-only CC BY-SA 4.0. The mechanical firewall
covers all 12 current BY-SA photos and passed with no input to baked OG/social
images, case-card composites, infographics, or equivalent site compositions.

The seven protected v6 selection subtrees and their local asset bytes compare
equal in v7. The clinical freeze separately passed 30/30 byte-identical files,
aggregate
`bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.

The three owner-accepted residual risks remain explicit and are not converted
into clearance:

1. 持證攝影記者授權自始無效的風險（Flickr-washing）
2. 封閉練習場地規範風險
3. 授權人身分無法追溯的風險

CC and public-domain facts address copyright only. They do not establish
photographer identity or licensing authority and do not create personality,
portrait, publicity, privacy, endorsement, venue, league, team, contract,
medical, legal-use, or public-release clearance.

## Integrated validation

All final gates ran under Node `v24.14.0`. The complete build-producing suites
ran from the clean Phase 3 source commit before the ordered artifact chain.
Only non-building, read-only checks ran after the private manifest commit.

The exact validation command set, excluding the separately documented artifact
and service sequence, was:

```sh
npm run test:coverage
npm run test:unit
npm run test:e2e
npx tsc --noEmit
npm run check
npm run format:check
npm run content:check
npm run decision15:contract:check
npx vitest run tests/unit/player-photo-registry-v7-contract.test.ts
npm run research:check
npm run research:verify-links
npm run research:check-verification
npm run research:check-manifest
npm run research:digest
npm run research:registry:check
npm run research:check-embed-enrichment
npm run research:check-embed-correction
npm run research:check-embed-batch2-correction
npm run source-policy:v8:check
npm run player-photos:v7:check
npm run player-photos:verify
npm run brand:verify
npm run decision13:clinical-freeze
npm run plan:verify
npm run plan:decision:verify -- --decision docs/decisions/2026-08-13-decision-15-photo-first-covers-authorization.v1.json --plan docs/superpowers/plans/2026-08-13-decision-15-photo-first-covers.md
npm run plan:assert-authorized -- docs/superpowers/plans/2026-08-13-decision-15-photo-first-covers.md
npm run verify:review-artifact
npm run test:lighthouse
git diff --check
git status --short
```

The result of each command is recorded in the table below. The private smoke
used a non-persisted inline Node program that called the repository's
`readFixedLocalCredential()` helper, constructed Basic auth only in memory,
and checked every manifest entry; its exact result counts and response
contracts are recorded in the private-service section.

| Gate                         | Actual result                                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit suite                   | Passed: 57 files, **1,074/1,074** tests                                                                                                                                                                      |
| Coverage suite               | Passed: 57 files, **1,074/1,074** tests; statements **87.56% (5,022/5,735)**, branches **83.72% (4,258/5,086)**, functions **94.01% (817/869)**, lines **88.07% (4,832/5,486)**                              |
| Decision 15 contract         | Passed: 2 files, **69/69** tests                                                                                                                                                                             |
| Registry v7 contract         | Passed: 1 file, **8/8** tests                                                                                                                                                                                |
| Playwright                   | Passed: **224/224** across Chromium, Firefox, WebKit, and mobile Chromium, including JavaScript-disabled readability and Axe checks                                                                          |
| TypeScript                   | `tsc --noEmit` passed with exit 0                                                                                                                                                                            |
| Astro diagnostics            | Passed: **225 files, 0 errors, 0 warnings, 16 non-failing hints**                                                                                                                                            |
| Formatting                   | Final Prettier check passed                                                                                                                                                                                  |
| Content                      | Passed: **26 cases, 3 injury overviews, 1 quarterly update**                                                                                                                                                 |
| Research candidate inventory | Passed: **69 candidates** (23 ACL, 28 ankle, 18 Achilles) and **26** source-verified audit records                                                                                                           |
| Candidate link verification  | Passed: **26 candidates, 104 URLs**                                                                                                                                                                          |
| Candidate manifest           | Passed: **26 entries**, digest `8beedf3fcc0c7c498bf08ffb2fbc671759e7a61ed4e04f09afab579b6a86eb4d`                                                                                                            |
| Source-manifest registry     | Passed: **3 entries**, digest `3326ec1aba88b264ef53ed1253a1b0a8abc38a6e7a246a9f642061da8a260d7a`                                                                                                             |
| Embed enrichment             | Passed: **3 accepted / 13 rejected**; reviewed digest `282f8f545bc74d38142d3a177287b6c7a82e7e8759451ea967f7b5f2435cd8aa`; refrozen digest `9971d3161b72f19c7d19bb504cd65d226e2d3a54c65ecd9a2d81e10fff388a3e` |
| Embed correction             | Passed: **3 entries**, digest `4a25692e27115b6ec16818a64dd6e85778360e4f00e2b3f6a288b4ca5f0ed0bc`                                                                                                             |
| Embed batch 2                | Passed: **4 entries**; manifest digest `bd1121d29e6ffda0122d920b6588e378dd2a1d011fa602689ccefa60c2bf86ff`                                                                                                    |
| Source policy v8             | Passed: `30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e`                                                                                                                                   |
| Player-photo registry v7     | Passed: `77a146729b95802fbe978bc8a4360ed54929121936a04454afe49998ea93b0c4`                                                                                                                                   |
| Photo assets                 | Passed: **21 photos / 0 SVG / 26 cases**                                                                                                                                                                     |
| Brand and BY-SA isolation    | Passed: no arbitrary images, logos, remote thumbnails, ShareAlike composites, or endorsement claims                                                                                                          |
| Clinical freeze              | Passed: **30/30** files; aggregate `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`                                                                                                        |
| Governance                   | Passed: **26** plan bindings; exact decision digest; positive authorization assertion                                                                                                                        |
| Review artifact              | Passed: **42 pages / 26 case pages**; no sitemap, analytics, iframe, preconnect, non-local image, or indexable page                                                                                          |
| Git boundaries               | `git diff --check` passed; worktree clean at every required artifact boundary                                                                                                                                |

The committed Phase 3 report says the registry v7 subset was 7/7. That line
under-counted the final test file by one. The final stricter run above is the
authoritative total: eight tests exist and **8/8 passed**. The earlier report
was not rewritten, so the correction remains auditable here.

Lighthouse passed all six required routes with accessibility score `1.00` and
LCP below the 2,500 ms threshold:

| Route                                       | Accessibility |      LCP |
| ------------------------------------------- | ------------: | -------: |
| `/`                                         |          1.00 |   756 ms |
| `/injuries/acl/`                            |          1.00 | 1,584 ms |
| `/injuries/ankle-sprain/`                   |          1.00 | 1,655 ms |
| `/injuries/achilles-rupture/`               |          1.00 | 1,655 ms |
| `/cases/anthony-edwards-ankle-sprain-2023/` |          1.00 | 2,106 ms |
| `/review/fixtures/latest-update/`           |          1.00 | 1,806 ms |

## Ordered artifact chain

The required chain completed in the exact order below. No build occurred after
the private-manifest commit.

1. From clean Phase 3 commit `86271c0`, `npm run review-set:generate` changed
   only `review/review-set.v1.json`.
2. The review set alone was committed as `f76852f`.
3. From that clean commit, `npm run build:review` rebuilt the review artifact;
   `npm run verify:review-artifact` passed.
4. `npm run private:manifest` changed only
   `review/private-dist-manifest.v1.json`.
5. The private manifest alone was committed as `9ee2ce4`.
6. The turn-specific owner instruction then authorized exactly one invocation:

   ```sh
   launchctl kickstart -k gui/501/tw.sportsmedicine.atlas.private-review.v1
   ```

The review set has SHA-256
`2b582cac314c88bfaac4a1fadbc5ef89ae9a94ebe36e98e1c1ffbe6992b6249e`
and binds Phase 3 content commit `86271c0d8681d74ad9fa5999ba241e86e798d9dc`,
26 cases, three overviews, one update, and three source batches. Its renderer,
supporting-data, and content-authority digests are respectively:

- `dfe6dbff72ee9035b9530ca4b8615f40cfe2be861708f121b2ef5ac05be563ef`
- `54d2953c8b9426d54285a5352c195e50e479a1d57af7916c6afb704820b32c9e`
- `400cc376e95c000ecc70a594f81129f6b9857bd5bb122d4d9e2d9d18baeba48b`

The review artifact contains 918 manifest paths totaling 179,366,684 bytes:
42 HTML pages, including 26 case pages; 854 image files; four JavaScript
files; 12 fonts; five JSON files; and one text file. The build logged 822
optimized image outputs. Every page carries noindex, and the artifact contains
no sitemap, analytics, iframe, preconnect, or non-local image.

The private manifest has SHA-256
`53f2a5b8bb75bd155a334708148ff2a89814f6132fffb76daf19d97a4bc8ca56`,
binds build commit `f76852fe74eab0c11841714797ecba63fe90047f`, repeats the
review-set digest as its response SHA-256, and binds header-policy digest
`bebeb04e1f2aad8020d20a25af30eb37b92fd0e70ad122acad2560cb6fab34b0`.
The sorted `SHA-256 + two spaces + buildPath + LF` file-ledger digest is
`c1e7e445a2e29d8c0cf24832c8d5dc1f595067cfc251085ea28cb1e8ef85c639`.

## Private service and exact-artifact smoke

The existing service was changed only by the single explicitly requested
kickstart. No launchd configuration, credential, listener, port, Tailscale
identity, exposure policy, provisioning, load/unload state, or historical
receipt was changed. This was a local private-review restart, not publication
or deployment.

The final listener audit found one TCP4 listener, PID 28515, at exactly
`100.114.3.93:8140`; there is no loopback, wildcard, LAN, IPv6, or alternate
listener. `launchctl list` reported wrapper PID 28514 and second column `0` for
`tw.sportsmedicine.atlas.private-review.v1`.

The complete read-only smoke loaded the existing credential only into process
memory and tested every committed manifest request path:

| Scenario                       | Actual result                                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authenticated                  | **918/918 HTTP 200**; exact bytes, total 179,366,684; exact per-file SHA-256, length, content type, identity, and private headers; zero mismatches |
| Unauthenticated                | **918/918 HTTP 401**; empty body, exact Basic realm/private headers, no redirect or review-byte leak; zero mismatches                              |
| Tailscale unauthenticated root | HTTP **401**                                                                                                                                       |
| `127.0.0.1:8140`               | HTTP **000**, as required                                                                                                                          |
| launchd exit-status column     | **0**                                                                                                                                              |

The served review-set response SHA-256 was
`2b582cac314c88bfaac4a1fadbc5ef89ae9a94ebe36e98e1c1ffbe6992b6249e`,
matching the committed review set and manifest. The historical served receipt
was deliberately not regenerated and remains byte-identical at
`7a6cc42cbd63a29130e51db891051dddc35b73a886cf65bfaaf5ff9538a5e2e0`.

## Transparently recorded intermediate failures

The final acceptance results above pass. The following intermediate or
non-applicable commands did fail and are not represented as passes:

- In the prior continuation, Wikimedia returned HTTP 429 and work stopped
  under the then-applicable three-failure rule. In this continuation, the
  descriptive User-Agent and paced serial requests produced HTTP 200 for all
  three missing originals without a retry or binary mismatch.
- The first full unit run exposed four stale `color-contrast` assertions that
  still expected SVG/old rights fields. They were updated once to the current
  photo and normalized-credit behavior; the final full run passed 1,074/1,074.
- The first formatting check identified three changed files. One formatting
  pass corrected them; the final Prettier check passed.
- The repository's legacy `private:verify` command failed with
  `transport-failed`: its fixed 180-second total budget and 32 MiB response
  ceiling do not accommodate 918 paths plus the 39.6 MB Trae Young original.
  That command did **not** pass, was not retried indefinitely, and did not
  update the historical receipt. The separate complete read-only in-memory
  smoke described above tested all 918 authenticated and all 918
  unauthenticated paths successfully.
- `decision15:baseline:check` was mistakenly invoked after adoption and failed
  because it is a Phase 0 pre-adoption freeze that intentionally requires the
  original UI bytes. It passed in Phase 0 and is not a post-adoption gate; the
  mistaken invocation made no state change.
- The first two final governance invocations omitted their required plan and
  decision arguments and printed usage. Both were immediately rerun with the
  exact authorized paths and passed.
- Several ad hoc read-only diagnostic snippets initially used an incorrect
  path or had shell/JavaScript construction or type errors. Their corrected
  forms produced the reported values; none changed repository, artifact, or
  service state.

No issue reached three failed repair attempts.

## Immutable and closed-scope negative proof

- All 30 clinical files remain byte-identical. No case, overview, update,
  diagnosis, observation, management, or return-to-play byte changed.
- The bound plan, owner authorization, historical source policies, registries
  v1–v6, Phase 0/1/2 evidence, and seven protected photo assets remain
  unchanged. Registry v7 is append-only.
- `src/data/site-governance.v1.json` remains byte-identical at
  `8aebcdf9bc4b00f26b183eb2dd828904ab83a4ff607c9579ab3054bd0d1ee7d5`
  with `allowIndexing=false`; all 42 built pages retain noindex.
- No public build, publication, deployment, indexing, external-account
  mutation, remote-repository mutation, push, credential change, listener
  change, or hosting configuration change occurred.
- The only process action was the one exact private-review kickstart explicitly
  required by the owner for this continuation. No external account or remote
  repository was contacted for mutation.

Decision 15 is complete for private review. It does not authorize a public
release and does not convert copyright permission into personality, venue,
contract, endorsement, or licensing-authority clearance.
