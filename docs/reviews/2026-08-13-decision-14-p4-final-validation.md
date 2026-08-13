# Decision 14 Phase 4 final validation

- Date checked: 2026-08-13
- Runtime: Node `v24.14.0`
- Scope: `decision-14-lowrisk-photographer-covers-only`
- Status: **Phase 0–4 complete; private review refreshed; no public release**

Decision 14 reassessed exactly the 16 current Decision 13 SVG slots. Two
evidence-qualified public-stage photos were adopted, and the other 14 athletes
retain their exact SVG selections. The resulting current projection is seven
Commons photos and 14 original SVG fallbacks across 21 athletes and 26 cases.
The five pre-existing Commons selections are unchanged.

The named-photographer allowlist is empty. Neither adopted photo relies on the
nba-v7 conditional event exception: both use the inherited nba-v6
`public-event-or-fan-interaction` branch. Consequently, this cycle has zero
allowlisted event photos and no applicable `credentialed-access-residual-risk`
row. No owner-risk field was invented or converted into a clearance claim.

## Governance and phase commits

The immutable inputs and final successor bindings are:

| Input or successor                   | SHA-256                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| Authorized Decision 14 plan          | `b6ee3bc4d0d2ad724014ac255cdb1b6ee76bb55aaa517e678601b931c95b7668` |
| Owner authorization JSON             | `0f92bf156976b111e1f6615985342cb5ee35adebd2b4773478316f0d71bf169b` |
| Authorized plan binding              | `3a2ffe797a0b1bac5f4e8d876a97170cafb93deda022dd3806fd8542fcf47b5f` |
| Owner Decision 14 record             | `155bca740213992bd71e2b30612a4ffcb6a58c0dec47ebddb12ac7b44d6ac827` |
| nba-v6 JSON predecessor              | `1e27041de184b7b6397b2cfdde225706b40696f1d4456757193baa340f4cc93c` |
| nba-v6 Markdown predecessor          | `b9a469344ff5061546619ea0ecbb5b7320965af40cde254d4939cf2e8835b0c1` |
| nba-v7 JSON successor                | `d1062c1ffa045397d13489319534acbfe24653615df5ce83aac40e40539a8b15` |
| nba-v7 Markdown successor            | `61ed88f92d80b77cd2c1410d03305215eedbb391356c073fb19fac944dea2fd1` |
| Player-photo registry v5 predecessor | `26129455fe5b9297c44ac91c3be1fc1678a928cf77bd12d00695614fe5df3985` |
| Player-photo registry v6 successor   | `16851aaa3d1dd223f20f102ef543f104a23ee61335a796f4b70cbe75d76d5cf0` |

The authorization JSON remained byte-identical throughout. `plan:verify`
validated all 24 bound documents, `plan:decision:verify` reproduced the exact
authorization digest, and `plan:assert-authorized` passed positively.
Execution began only after the preflight verified exact starting `HEAD`
`e1fa7a9`, Node `v24.14.0`, and a clean worktree. The governance-authorization
commit contains only the pre-supplied authorization JSON and
`docs/decisions/plan-binding.v1.json`.

The completed bounded commits are:

| Phase                    | Commit                                     | Subject                                                                |
| ------------------------ | ------------------------------------------ | ---------------------------------------------------------------------- |
| Governance binding       | `788b5cee297492db7b76db390fddfe64a5d37589` | `docs(governance): authorize Decision 14 low-risk photographer covers` |
| Phase 0                  | `fec02fa32d2b86e9124aa11c98b51fccea5c121c` | `feat(governance): freeze Decision 14 phase 0 contract`                |
| Phase 1 evidence         | `52b0608a36960bcc09d7ef8ec7b60816267f7b9e` | `docs(review): freeze Decision 14 photographer evidence`               |
| Phase 1 policy           | `282854b7b7dd990a2cfb268562094d032b60b198` | `feat(governance): freeze Decision 14 source policy v7`                |
| Phase 2                  | `eb81355228dd0605637864590ce397a8d47b5bf9` | `docs(review): freeze Decision 14 photo candidates`                    |
| Phase 3                  | `259ff2ca98f687d856b8a9000a3499477782e315` | `feat(covers): adopt Decision 14 qualified photos`                     |
| Phase 4 review set       | `90e909997e12edae21f119506c456c1da6b0fcf1` | `chore(review): refresh Decision 14 review set`                        |
| Phase 4 private manifest | `22e9cc9c658b88e972422799649fd703ae17e3fc` | `chore(review): refresh Decision 14 private manifest`                  |

Each completed phase was committed with a clean worktree before the next phase
or artifact step began.

## Exact 16-athlete outcome

| Athlete           | Final result       | Evidence-based reason                                                                                                                                            |
| ----------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anfernee Simons   | Exact SVG retained | Available work is regular-season pregame/warm-up, and the v7 allowlist is empty.                                                                                 |
| Anthony Edwards   | Exact SVG retained | FIFA context is `other`/event; Bryan Berlin was outside the frozen research cycle.                                                                               |
| Brandon Clarke    | Exact SVG retained | Candidate depicts live regular-season action, with no eligible allowlisted photographer.                                                                         |
| Damian Lillard    | **Photo adopted**  | Fixed Commons revision `1195923850` depicts the 2014 Chicago 63rd Street Beach World Basketball Festival public stage, not a game, practice, or pregame context. |
| Danny Green       | Exact SVG retained | Senior Day pixels do not resolve ceremony versus credentialed court/pregame context.                                                                             |
| Dejounte Murray   | Exact SVG retained | The candidate's government public-domain basis is not the plan-required CC0 permission bucket.                                                                   |
| Ja Morant         | Exact SVG retained | Occasion and maker/account authority remain unresolved.                                                                                                          |
| Jayson Tatum      | **Photo adopted**  | Fixed Commons revision `756925233` depicts a public interview stage at 2018 NBA All-Star Weekend, not live competition.                                          |
| Joe Ingles        | Exact SVG retained | Candidate depicts live preseason competition, and the v7 allowlist is empty.                                                                                     |
| LaMelo Ball       | Exact SVG retained | Candidate is All-Star/live action, with no eligible allowlisted photographer.                                                                                    |
| Markelle Fultz    | Exact SVG retained | Candidate is game action; the allowlist is empty and the strongest upstream was unavailable.                                                                     |
| Moritz Wagner     | Exact SVG retained | Evidence indicates a live preparation match or regular-season pregame context.                                                                                   |
| Ricky Rubio       | Exact SVG retained | Credentialed-court context or the required occasion evidence remains unresolved.                                                                                 |
| Thomas Bryant     | Exact SVG retained | Candidates are closed practice or game action.                                                                                                                   |
| Trae Young        | Exact SVG retained | All-Star court context remains ambiguous.                                                                                                                        |
| Tyrese Haliburton | Exact SVG retained | Candidate depicts regular-season action, and the v7 allowlist is empty.                                                                                          |

The 14 retained selections have the same complete canonical selection hashes
and exact SVG bytes in registry v5 and v6. The full per-athlete selection
hashes and upstream acceptance/rejection records are frozen in the Phase 2 and
Phase 3 evidence reports.

## Allowlist, adopted works, and rights result

Phase 1 applied the required identity, photographer-owned upload, long-term
license/reuse, and anti-washing tests. No reviewed photographer passed all four
requirements, so the final named allowlist has **0 entries**. The exclusion
evidence is frozen in
`docs/reviews/2026-08-13-decision-14-p1-photographer-allowlist-evidence.md`,
SHA-256
`593919e471180fe3cb9845236f4758b1ccfd305b599fbe59b4f841060637f18e`.
Because nobody is allowlisted, there is no person for whom an allowlist
evidence paragraph can truthfully be asserted.

Both adopted works independently passed athlete identity, original-source,
fixed-revision, uploader/photographer relationship, title-state, exact
license/version/link, notice-state, alteration, Adapter's License, local-byte,
crop, occasion, and risk checks:

| Athlete        | Local original                                      | SHA-256                                                            | License and treatment                                                                                           |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Damian Lillard | `src/assets/players/decision-14/damian-lillard.jpg` | `ba8a0f23d721519e4796c89513f21a9e3c1d4fafe39f84a0192244162bb3abcf` | Exact CC BY-SA 4.0; same-version Adapter's License; unmodified original plus CSS presentation crop              |
| Jayson Tatum   | `src/assets/players/decision-14/jayson-tatum.jpg`   | `0adddc2e2918f307434e18e79c96ed7bf2e852122bea0adc0c38203584d7cb78` | Exact CC BY-SA 4.0; same-version Adapter's License; upstream ArcSoft edits disclosed plus CSS presentation crop |

Both use `sourceRiskClassification=non-event-low-risk` and
`photographerRiskEvidence=independent-public-event-low-risk`, with the explicit
non-clearance boundary preserved. Neither work is baked into a site-composed
output. `brand:verify` found no ShareAlike composite, remote thumbnail, logo,
social/OG reuse, or endorsement claim. Decision 13's unified medical notice,
adjacent asset-credit link, central credit rows, and Adapter's License display
remain the only notice architecture.

## Integrated validation

All gates ran under Node `v24.14.0`. The complete source gates ran from the
clean Phase 3 source commit before the ordered artifact cycle; the applicable
governance, successor, immutable, content, and artifact gates were re-run after
private smoke.

| Gate                        | Result                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Unit and coverage           | Passed: 55 files, **1031/1031** tests; statements 87.52%, branches 83.23%, functions 93.84%, lines 88.02%        |
| Decision 14 contract subset | Passed: **91/91** tests                                                                                          |
| Playwright                  | Passed: **224/224** across Chromium, Firefox, WebKit, and JavaScript-disabled coverage                           |
| TypeScript                  | `tsc --noEmit` passed                                                                                            |
| Astro diagnostics           | Passed: 0 errors, 0 warnings, 16 non-failing hints                                                               |
| Formatting                  | Prettier check passed                                                                                            |
| Content                     | Passed: 26 cases, 3 injury overviews, 1 quarterly update                                                         |
| Research candidates         | Passed: 69 candidates and 26 source-verified audit records                                                       |
| Candidate manifest          | Passed: 26 entries, digest `8beedf3fcc0c7c498bf08ffb2fbc671759e7a61ed4e04f09afab579b6a86eb4d`                    |
| Source-manifest registry    | Passed: 3 entries, digest `3326ec1aba88b264ef53ed1253a1b0a8abc38a6e7a246a9f642061da8a260d7a`                     |
| Source policy v7            | Passed: `d1062c1ffa045397d13489319534acbfe24653615df5ce83aac40e40539a8b15`                                       |
| Player-photo registry v6    | Passed: `16851aaa3d1dd223f20f102ef543f104a23ee61335a796f4b70cbe75d76d5cf0`                                       |
| Photo assets                | Passed: 7 Commons photos, 14 original SVGs, 26-case coverage                                                     |
| Brand and BY-SA isolation   | Passed                                                                                                           |
| Clinical freeze             | Passed: 30/30 files, aggregate `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`                |
| Review artifact             | Passed: 42 pages, 26 case pages; no sitemap, analytics, iframe, preconnect, non-local images, or indexable route |
| Git whitespace/worktree     | `git diff --check` passed; clean at each artifact boundary                                                       |

The two append-only successor command pairs both ran:
`npm run source-policy:v7:generate` followed by
`npm run source-policy:v7:check`, and
`npm run player-photos:v6:generate` followed by
`npm run player-photos:v6:check`. Each check re-derived the exact committed
digest shown above; no historical policy or registry file was rewritten.

Lighthouse passed all six required routes with accessibility score `1.00`:

| Route                                       |     LCP |
| ------------------------------------------- | ------: |
| `/`                                         | 1505 ms |
| `/injuries/acl/`                            | 1505 ms |
| `/injuries/ankle-sprain/`                   | 1730 ms |
| `/injuries/achilles-rupture/`               | 1654 ms |
| `/cases/anthony-edwards-ankle-sprain-2023/` | 1503 ms |
| `/review/fixtures/latest-update/`           | 1803 ms |

## Ordered artifact chain

The required artifact and private-service sequence completed in this order,
without a rebuild between the committed private manifest and restart:

1. From clean source commit `259ff2c`, `review-set:generate` changed only
   `review/review-set.v1.json`. Clinical bytes remained frozen. The review set
   binds content commit `259ff2ca98f687d856b8a9000a3499477782e315`, 26
   cases, three overviews, and one update.
2. The review set alone was committed as `90e9099`. Its SHA-256 is
   `edad6e10575d848deb0cf79d784dce558ebff6ba96c061f257b05ea694e47051`;
   renderer-tree digest is
   `71049aa4fdc2952efa0b263ba9ba1e4cde08cfbc968f4797c39bfa2cbb6e553b`,
   supporting-data digest is
   `54d2953c8b9426d54285a5352c195e50e479a1d57af7916c6afb704820b32c9e`,
   and content-authority digest is
   `400cc376e95c000ecc70a594f81129f6b9857bd5bb122d4d9e2d9d18baeba48b`.
3. From clean commit `90e9099`, `build:review` and
   `verify:review-artifact` passed for 42 pages and 413 optimized image
   outputs. Every page retained the exact review noindex meta contract. The
   Phase 4 Playwright checks also verified the registry-selected new photos,
   retained photos, retained SVGs, and their central credit anchors on the
   applicable routes.
4. `private:manifest` changed only
   `review/private-dist-manifest.v1.json`. All **511/511** dist paths matched
   the manifest exactly, and every listed byte length and SHA-256 was
   independently rechecked. This exact ledger includes the rendered source
   policy, both new photo rendition families, all retained-cover outputs, and
   their credit pages; the review-set, renderer, HTTP-policy, and source-asset
   checks therefore bind the reviewed bytes rather than an untracked
   substitute. The sorted file ledger digest is
   `4bf9d6ee19e507131a7a009377ad06eeb5a3febff5b1b1ed08f19fe3ba32b8ed`.
5. The private manifest alone was committed as `22e9cc9`. It binds build
   commit `90e909997e12edae21f119506c456c1da6b0fcf1`, review-set and response
   digest `edad6e10575d848deb0cf79d784dce558ebff6ba96c061f257b05ea694e47051`,
   renderer digest
   `71049aa4fdc2952efa0b263ba9ba1e4cde08cfbc968f4797c39bfa2cbb6e553b`,
   and header-policy digest
   `bebeb04e1f2aad8020d20a25af30eb37b92fd0e70ad122acad2560cb6fab34b0`.
   Its SHA-256 is
   `5f7df51aadb784cb290f3b870577b6fcd934707a25bae8b99386a2489e850339`.
6. Only after that clean commit, the existing LaunchAgent was restarted once
   with exactly
   `launchctl kickstart -k gui/501/tw.sportsmedicine.atlas.private-review.v1`,
   as required by the turn-specific owner instruction. No render, load,
   unload, credential provisioning, alternate listener, or configuration
   command was run.
7. Authenticated and unauthenticated representative smoke then passed against
   only `http://100.114.3.93:8140`.

## Existing-service identity

| Property      | Before restart                              | After restart |
| ------------- | ------------------------------------------- | ------------- |
| launchd label | `tw.sportsmedicine.atlas.private-review.v1` | unchanged     |
| state         | running                                     | running       |
| launchd runs  | 10                                          | 11            |
| wrapper PID   | 71225                                       | 73208         |
| listener PID  | 71237                                       | 73212         |
| listener      | `100.114.3.93:8140`                         | unchanged     |
| executable    | pinned Node 24.14.0 path                    | unchanged     |

The pre/post launchd observation hashes are respectively
`66c235cd13e02463bb093b63530d81ad63fbe08c3518422ebf1d632d3a7f65f7`
and
`a3332d6d4eb350b8524deabc37928b8a91f5511a4d5d2c4a8653c11dd2be759f`.
The corresponding listener observation hashes are
`2679c47f1229dc73d27bbb663f9a550942b3d7b232896cb4367fde8a5c02ad77`
and
`d60ba88a344eacbbd1725c2d391a0b63c711db71b6776c907d27f52b2761b7e9`.
Both listener observations contain one TCP4 listener at the exact Tailscale
address and no loopback, LAN, wildcard, IPv6, or alternate listener.

The rendered plist remained the same inode, uid 501, gid 20, mode `0600`, one
hard link, and 1,643 bytes; its SHA-256 remains
`fe3ba9f506255f1243e8977eaa93fa14e4158aa6e5016a793a16ad3dc5ea5f45`.
The access handoff likewise remained the same inode, uid 501, gid 20, mode
`0600`, one hard link, and 140 bytes. The configured Keychain item remained
present; its existence check did not use `-w` and did not read the Keychain
secret. The smoke reader loaded the existing handoff credential only into
process memory, formed the authorization header only in memory, and placed no
credential value in argv, environment variables, output, logs, or evidence.

The private-hosting contract, HTTP header policy, launchd template, server, and
service-manager digests remain respectively:

- `937fe2d223271153b3337b4930fd4f0e980c3cf8bce77ca1e9228c3487f218c3`
- `bebeb04e1f2aad8020d20a25af30eb37b92fd0e70ad122acad2560cb6fab34b0`
- `71d5a3307bcedfeb722554c5c5f3312b83277155f7c524376dea13e9e194aa57`
- `b7e693336b83f1de091cee316187921a339b3df94e950f98c10731fc662b7c51`
- `d1313d8205ca6fd7d2f5f4e2b9e1fe9b916527c63a0887d76d6898dfbd5fad3f`

## Authenticated and unauthenticated smoke

Authenticated smoke passed **7/7**. Every response returned 200 and matched
the committed private manifest's exact body bytes, length, SHA-256, content
type, identity marker, noindex meta where applicable, and private header
contract. The new-photo cases also exposed their exact central credit anchors;
the retained-SVG case exposed the original-SVG markers.

| Role and path                                                        |  Bytes | SHA-256                                                            |
| -------------------------------------------------------------------- | -----: | ------------------------------------------------------------------ |
| Retained photo — `/cases/kevin-durant-achilles-rupture-2019/`        | 59,952 | `83874ffa6b1fee54308eaddafa7d85a6d338c9c6fca87fed91e6d935b2968b43` |
| New non-event photo — `/cases/damian-lillard-achilles-rupture-2025/` | 58,486 | `597a575516037e203f601a3bb4931cd649755538ae85a586bc9ff2f0ce0423e5` |
| New non-event photo — `/cases/jayson-tatum-achilles-rupture-2025/`   | 58,716 | `1c4b3fc6a4f75a3e7a24875988b625183f90b49666eb2a764d627289168c0078` |
| Retained SVG — `/cases/anfernee-simons-ankle-sprain-2023/`           | 55,126 | `aa2959bc9be49ecf583f30d099af7bf0444456e287351b166ed9a225f338a543` |
| Credits — `/credits-notices/`                                        | 48,808 | `b1d0d8ae24b62e58a14f32d03212b1e82780e9fef37e0ccbd198bc50027c32f8` |
| Policy — `/source-policy/`                                           | 20,957 | `5c880ee574dafaf6d82139cad5867b0ae7a0ddd869fa95ddc9b36c94115921e6` |
| Review set — `/review/review-set.json`                               | 14,671 | `edad6e10575d848deb0cf79d784dce558ebff6ba96c061f257b05ea694e47051` |

There is no qualified new event photo in this cycle, so the plan's
new-event-photo category has no applicable instance. The two newly adopted
inherited-v6 non-event photos were smoked instead; no event or residual-risk
metadata was fabricated.

The same seven routes passed unauthenticated smoke **7/7**: each returned 401,
an empty body, content length zero, the exact Basic realm, and the private
no-store/nosniff/noindex header contract, with no redirect, content type,
cookie, forbidden cache header, review bytes, or identity leak. No request used
`127.0.0.1`.

The historical served receipt was deliberately not regenerated. Its worktree
and `HEAD` bytes both remain SHA-256
`7a6cc42cbd63a29130e51db891051dddc35b73a886cf65bfaaf5ff9538a5e2e0`.

## Immutable and closed-scope negative proof

- All 30 clinical files remain byte-identical; no case, overview, update,
  diagnosis, observation, management, or return-to-play text changed.
- Source-policy versions v1–v6 and player-photo registries v1–v5 compare
  byte-identically with the authorized starting history. Registry v1–v5
  digests remain
  `770a7e6d7f13ecd0dda17a629b13f179357b9c64ebc268404a5640ad9aa08eec`,
  `0fa9a14660d798b32586047eaec1a0fc14912ca8710aaccc83963ac4f9dc28d0`,
  `d91e97aa34e347375dd5ca14cf961208ae4b2c43cc8a90a01bea49f1172a3c05`,
  `ef7149b57ab5d08a328a0a7ed88177fc4d6a35af998bcfd95a0ec318bcf345b5`,
  and
  `26129455fe5b9297c44ac91c3be1fc1678a928cf77bd12d00695614fe5df3985`
  respectively.
- The complete v5/v6 selection subtrees and asset bytes for CJ McCollum,
  Dwight Powell, Kevin Durant, Kyrie Irving, and LeBron James are identical.
  Their asset SHA-256 values remain
  `5688298371c4ec218dae6f5131685f4ab511fab6d0797685146953235c8c7e45`,
  `d1cab51c99f25b380d05d14bd5fe4f826b51042d4c007a7d105a7240265cd211`,
  `6f18766d49193c6858d607ae26551ba6c4422eebefb535ca2805ccd8b54e956d`,
  `4f631559835221f8276ef7b1ee09b4435a5003ad9a50614bb0c72673dec745b6`,
  and
  `8f5550b3acc78302a465a84b9e78f62d466e484fbfec1e3c1054e9123457680c`
  respectively.
- `src/data/site-governance.v1.json` remains `allowIndexing=false`; all 42
  built pages have the review noindex contract, and no sitemap exists.
- The Decision 13 single medical disclaimer and central credits architecture
  did not regress. No BY-SA asset appears in a baked composition.
- All eight closed scopes remain closed: `deployment`,
  `external-account-mutation`, `hosting-service-mutation`, `indexing`,
  `medical-content-authoring`, `medical-review-decision`, `public-release`, and
  `remote-repository-mutation`.

Nothing was pushed, deployed, indexed, or publicly released. No external
account, credential, listener address, DNS state, hosting configuration,
medical content, or medical-review state was changed. Apart from the exact
one-time existing-service restart required for the committed reviewed bytes,
only the authorized local source, evidence, and private artifact chain
advanced. Decision 14 Phase 0–4 is complete.
