# Decision 17 Phase 5 final validation and owner closeout

- Date: 2026-08-15
- Owner: 吳易澄醫師
- Runtime: Node `v24.14.0`
- Authorized scope: `decision-17-case-filter-and-followup-notes-only`
- Plan SHA-256:
  `845f2b6b694ace14fc65cf086c7fce95985acfb4d0f562dfaaab1f357e84078e`
- Authorization SHA-256:
  `cdb2b5838d66d50c74ac82346c06a4c1096d52422fa767e6b64d2f22c9ba8080`
- Status: **CLOSED UNDER THE OWNER'S EXPLICIT DISPOSITION — the Decision 17
  artifact chain and complete private smoke are complete; the Lighthouse gate
  remains FAIL / NOT ACHIEVED and is expressly non-blocking for this private
  closeout**
- Release state: no publication, deployment, indexing, external-account,
  hosting-configuration, or remote-repository mutation; no push

## Truthful outcome

This report does not claim a Lighthouse pass. The six-route Lighthouse gate
failed on the Anthony Edwards 2023 case page three consecutive times. The
owner has expressly directed that the exact failure remain recorded and that
it not block the Decision 17 private-review closeout for the reasons below.
No threshold, measurement method, route set, or result was changed or selected
to manufacture a pass.

The repository command `npm run private:verify` was deliberately **not run**.
Its unrelated existing failure is recorded in
`docs/reviews/2026-08-14-decision-16-p3-final-validation.md` and transferred to
a separately governed Decision. This report is not a `private:verify` pass and
does not use the historical served receipt as current evidence.

## Governance and immutable inputs

| Input                                   | Result                                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Required starting HEAD                  | clean `7cf143ce529ce889de53176b76bffd42585498f8`                                                               |
| Required Node                           | `v24.14.0` from `/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin/node`                              |
| Bound plan                              | byte-identical; SHA-256 `845f2b6b694ace14fc65cf086c7fce95985acfb4d0f562dfaaab1f357e84078e`                     |
| Authorization JSON                      | byte-identical; SHA-256 `cdb2b5838d66d50c74ac82346c06a4c1096d52422fa767e6b64d2f22c9ba8080`                     |
| Owner-decision ledger after append      | `../.claude/g2-owner-decisions.md`; SHA-256 `736a50534c286d55968d61ed400a6ab7bc111cc51e0ad8828d3e72ab29df9441` |
| Indexing state                          | `allowIndexing=false`; site status `medical-review`                                                            |
| Medical-review authority for new drafts | `medicalReviewDecisionAuthorized=false`; closed scope retained                                                 |

The Decision 17 protected-baseline checker passed with evidence digest
`f33ec875b74869b2d735684ef2f4d089815e81192f1d11df6d62b9c9b45489b4`.
The 30-file clinical freeze—26 case-v1 records, three injury overviews, and one
quarterly update—is **30/30 byte-identical**, aggregate SHA-256
`bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`.
All 21 current cover files are **21/21 byte-identical**, with cover ledger
SHA-256 `625b47f92ad0e4706872e92ea7c7fd92e25c4dfd21dd219feb59154571db15dd`.
Player-photo registry v8 remains SHA-256
`908ccc9c1d9aeee56c907a476701c8875914af5090614c36271a76447057084a`;
the CC BY-SA composition firewall remains active.

## Lighthouse — FAIL / NOT ACHIEVED

The unchanged repository gate measures these six routes:

1. `/`
2. `/injuries/acl/`
3. `/injuries/ankle-sprain/`
4. `/injuries/achilles-rupture/`
5. `/cases/anthony-edwards-ankle-sprain-2023/`
6. `/review/fixtures/latest-update/`

Only `/cases/anthony-edwards-ankle-sprain-2023/` failed. Its three consecutive
formal runs were:

| Formal run |       LCP | Accessibility | Result   |
| ---------: | --------: | ------------: | -------- |
|          1 | `3005 ms` |        `1.00` | **FAIL** |
|          2 | `3004 ms` |        `1.00` | **FAIL** |
|          3 | `3004 ms` |        `1.00` | **FAIL** |

The third-run artifact records the other five routes as passed: `/` at
`1955 ms`, ACL at `2331 ms`, ankle sprain at `1655 ms`, Achilles rupture at
`1655 ms`, and the latest-update fixture at `1806 ms`; every route's
accessibility score was `1.00`.

There is an important threshold distinction that this report does not hide.
The unchanged repository source and `artifacts/lighthouse-review.json` both
define the formal gate as accessibility `>= 0.95` and LCP `<= 2500 ms`.
Therefore the three formal results exceeded the repository budget by
`505 ms`, `504 ms`, and `504 ms`; the formal gate is unambiguously unmet.
The owner's current disposition separately uses `3000 ms` as the practical
private-review reference, against which the values are `4–5 ms` higher. That
practical comparison is the owner's risk rationale; it does not redefine the
repository gate as 3000 ms and does not turn any run into a pass.

The owner decided that this failure does not block the closeout because:

- the page references only optimized renditions of approximately
  `0.21–0.57 MB`, not the approximately `4.32 MB` oversized source original;
  the image pipeline is functioning normally;
- Kyrie Irving's approximately `7.50 MB` and LaMelo Ball's approximately
  `6.92 MB` source originals are larger, while the owner's independent checks
  found those pages passed;
- a same-page, same-Lighthouse-settings single-route diagnostic measured
  `2256 ms` LCP with `0 ms` TBT. It is diagnostic evidence only and does not
  replace the six-route gate;
- the formal run measures six routes while the same machine also serves the
  site, so the repeated approximately-three-second reading is consistent with
  the observed local contention condition rather than a missing rendition;
- this is a one-reviewer private site over Tailscale. Approximately 3 seconds
  does not impair its review purpose, and public release remains closed.

The append-only owner disposition is recorded in
`../.claude/g2-owner-decisions.md`. The Lighthouse status remains **FAIL / NOT
ACHIEVED** after that decision.

## Decision A — video-source filter and zero NBA navigation sinks

The added tenth non-classic filter dimension is `videoSource`, shown as
“影片來源”. Its complete 26-case partition is:

| Controlled category       |  Cases |
| ------------------------- | -----: |
| `youtube-embed`           |      7 |
| `nba-plain-text-citation` |     18 |
| `external-link`           |      1 |
| **Total**                 | **26** |

The sole `external-link` case is Anthony Edwards 2023. The three case-index
shards contain 26 rows with the exact `7/18/1` partition and contain **zero**
`nba.com` strings; the shards contain only the controlled source token, never
a source URL.

A memory-only Parse5 scan of all 42 built HTML pages used the repository's
formal sink scanner, including normalization of escaped `/` forms. The actual
results were:

| NBA deep-link sink                                                | Actual count |
| ----------------------------------------------------------------- | -----------: |
| HTML attributes (`href`, `src`, and other URL-bearing attributes) |        **0** |
| JSON-LD URLs                                                      |        **0** |
| Inline/general script sinks                                       |        **0** |
| Redirect artifacts                                                |        **0** |
| Redirect sinks                                                    |        **0** |
| Case-index shards containing `nba.com`                            |        **0** |

This is not evidence that the citations disappeared. The exact citation
checker found `69` source rows and `18` NBA video-source citations with
`issues=[]`; NBA URLs remain visible as literal text. They are not anchors,
iframes, metadata targets, script targets, redirects, or JSON shard URLs.

## Decision B-1 — layered-note presentation

The presentation actually removed these reader-facing subitems:

- “發生了什麼” (`general.whatHappened`);
- “畫面看得到什麼” (`general.whatIsVisible`);
- the reader-layer “已確認的後續更新” (`general.confirmedUpdate`);
- YouTube timelines and non-YouTube “影片段落觀察”;
- the `LayeredNotes` default slot, `CaseTimeline.astro`, timestamp/seek client
  wiring, and the component-lab timeline fixture.

It retained:

- the reader layer's sole item, **“畫面不能證明什麼”**, sourced from the
  existing `whatVideoCannotProve` value;
- all four professional-layer items: mechanism analysis, clinical limits,
  differential context, and treatment/return implications;
- both emphasis controls and both layers in the DOM, with the controls only
  changing presentation emphasis.

The built-DOM verifier passed across 26 real cases and one fixture:

```text
Decision 17 B-1 DOM OK — 26 real cases + 1 fixture; reader=1 item, professional=4 items, timelines=0
```

“畫面不能證明什麼” is therefore present as the only reader item in **27/27**
checked DOMs. The 26 protected case JSON files were not edited: all 26 still
retain non-empty `whatHappened`, `whatIsVisible`, `confirmedUpdate`,
`whatVideoCannotProve`, video segments, and the four professional fields.
B-1 was a presentation change, not deletion or rewriting of approved clinical
source bytes.

## Decision B-2 — pending follow-up drafts

The governed corpus contains 26 sidecars and **44** atomic items. Aggregate
kind counts are treatment `16`, surgery `13`, injection `0`, and
`actual-return` **15**. Aggregate source-tier counts are official `29`,
mainstream media `14`, and unverified report `1`.

The required per-case item and three-tier distribution is:

| Case sidecar                              |  Items | Official | Mainstream | Unverified |
| ----------------------------------------- | -----: | -------: | ---------: | ---------: |
| `anfernee-simons-ankle-sprain-2023`       |      0 |        0 |          0 |          0 |
| `anthony-edwards-ankle-sprain-2023`       |      1 |        0 |          1 |          0 |
| `anthony-edwards-ankle-sprain-2025`       |      1 |        1 |          0 |          0 |
| `brandon-clarke-achilles-rupture-2023`    |      3 |        1 |          2 |          0 |
| `cj-mccollum-ankle-sprain-2020`           |      0 |        0 |          0 |          0 |
| `damian-lillard-achilles-rupture-2025`    |      1 |        1 |          0 |          0 |
| `danny-green-acl-2022`                    |      2 |        0 |          2 |          0 |
| `dejounte-murray-achilles-rupture-2025`   |      2 |        1 |          1 |          0 |
| `dwight-powell-achilles-rupture-2020`     |      2 |        2 |          0 |          0 |
| `ja-morant-ankle-sprain-2020`             |      2 |        1 |          1 |          0 |
| `jayson-tatum-achilles-rupture-2025`      |      3 |        3 |          0 |          0 |
| `joe-ingles-acl-2022`                     |      2 |        2 |          0 |          0 |
| `kevin-durant-achilles-rupture-2019`      |      3 |        3 |          0 |          0 |
| `kevin-durant-ankle-sprain-2024`          |      1 |        1 |          0 |          0 |
| `kyrie-irving-acl-2025`                   |      2 |        2 |          0 |          0 |
| `kyrie-irving-ankle-sprain-2021`          |      1 |        1 |          0 |          0 |
| `lamelo-ball-ankle-sprain-2022`           |      1 |        1 |          0 |          0 |
| `lamelo-ball-ankle-sprain-2023`           |      0 |        0 |          0 |          0 |
| `lamelo-ball-ankle-sprain-2025`           |      1 |        1 |          0 |          0 |
| `lebron-james-ankle-sprain-2021`          |      2 |        2 |          0 |          0 |
| `markelle-fultz-acl-2021`                 |      3 |        2 |          1 |          0 |
| `moritz-wagner-acl-2024`                  |      3 |        2 |          0 |          1 |
| `ricky-rubio-acl-2021`                    |      3 |        1 |          2 |          0 |
| `thomas-bryant-acl-2021`                  |      1 |        0 |          1 |          0 |
| `trae-young-ankle-sprain-2021`            |      2 |        1 |          1 |          0 |
| `tyrese-haliburton-achilles-rupture-2025` |      2 |        0 |          2 |          0 |
| **Total**                                 | **44** |   **29** |     **14** |      **1** |

Exactly **3** cases are completely blank: Anfernee Simons 2023, CJ McCollum
2020, and LaMelo Ball 2023. Their explicit empty states remain non-inferential;
no typical treatment or return was invented to fill them.

All **15/15** `actual-return` items use official sources and contain an actual
participation date; none is a projection. All **44/44** atomic items have
`review.status=pending-owner-signoff` and matching reviewed payload digests.
All **26/26** review-set v2 case bindings are also
`pending-owner-signoff`. The rendered block visibly marks the material “待醫師
簽核” and states that it is third-party reporting, not the site's physician
diagnosis, assessment, or advice.

The B-2 built-DOM result was:

```text
Decision 17 B-2 DOM OK — cases=26 items=44 emptyCases=3 tiers={"mainstream-media-report":14,"team-or-league-official":29,"unverified-report":1} nbaFollowUpCitations=41 nbaNavigationSinks=0
```

`review-set.v2` records `medicalReviewDecisionAuthorized=false`; the Decision
17 authorization keeps `medical-review-decision` closed, and no
`review/medical-review-decision.v1.json` exists. Existing approved clinical
cores remain separately bound to their historical owner reviews; none of the
44 new items is presented as approved.

## Decision C — collapsed digests remain in server DOM

The implementation uses a native `<details>` without an `open` attribute and
a direct `<summary>審查識別與 digest</summary>`. Record ID, case-content digest,
rendered-set digest, and pending-follow-up digest are server-rendered
descendants; digest fields are complete readonly inputs and do not require
JavaScript injection.

The verifier parsed the built server HTML with Parse5, independently
recomputed the case, review-set, and follow-up values, compared each literal
value, checked readonly inputs, unique IDs, and matching labels, and required
the disclosure to be closed by default. Actual result:

```text
Decision 17 C DOM OK — realCases=26 fixtureCases=1 cases=27 disclosures=27 inputs=81 open=0
```

Thus all **27/27** disclosures are collapsed by default while all values remain
in the DOM and copyable after native disclosure opening.

## Ordered artifact chain

The final review set was already committed at starting HEAD `7cf143c`. This
closeout then ran:

```text
npm run private:manifest
```

with exit 0 and output:

```text
private:manifest files=915 digest=45be696caa0e7127ed70066db895285f1d0c300ebfcea0e4f50d097f638cc5d5
```

Only `review/private-dist-manifest.v1.json` changed. It was committed alone as
`a79b709a48c691f6d17d6793bd737fc256b65883` with subject
`chore(review): refresh Decision 17 private manifest`. The canonical manifest:

- binds build commit `7cf143ce529ce889de53176b76bffd42585498f8`;
- has SHA-256
  `45be696caa0e7127ed70066db895285f1d0c300ebfcea0e4f50d097f638cc5d5`;
- contains 915 files / 915 unique request paths totaling 142,518,527 bytes;
- binds review-set v2 digest
  `0962e04a3bc6a844518829ea462454384dbc6232198779bce0a303b211892b55`;
- binds renderer-tree digest
  `eba61fedccb2ddc6ef11842e071aa72622f3178bbb7b449f5dcfffa14f1fc08d`.

### Service reload attempts

This report does not hide the startup attempts:

1. The first `kickstart` was mistakenly invoked after manifest generation but
   before the required manifest-only commit. The fail-closed gateway rejected
   the dirty source state with `artifact-invalid`; `launchctl` showed exit `1`
   and neither Tailscale nor loopback had a listener.
2. After the isolated manifest commit, the second `kickstart` brought up the
   exact Tailscale listener and returned 401 without credentials, but
   `launchctl list` still retained the prior exit value `1`; that observation
   did not satisfy the owner's required final second-column value.
3. The third and final allowed attempt cleanly stopped the healthy process and
   started the current snapshot. It reached the required final state before
   smoke. No fourth attempt was made.

The final post-smoke observation was:

```text
66322  0  tw.sportsmedicine.atlas.private-review.v1
node 66323 ... TCP 100.114.3.93:8140 (LISTEN)
```

`curl http://127.0.0.1:8140/` returned `000`; no loopback listener exists.
No launchd definition, credential, port, Tailscale identity, or hosting
configuration was changed.

## Complete private smoke

Smoke used a read-only, memory-only inline Node process—not
`private:verify`. It read the mode-0600 local credential into process memory,
never placed the password in argv, environment variables, or output, and
derived the complete path list from the committed manifest. It used one
keep-alive socket (`maxSockets=1`) and performed a real streamed GET for each
path. Authorized bodies were hashed while streaming; no response body,
receipt, or other evidence file was written.

Actual result:

| Scenario                                             | Actual result |
| ---------------------------------------------------- | ------------: |
| Manifest paths / unique paths                        |   `915 / 915` |
| Credentialed GETs returning 200                      |   **915/915** |
| Credentialed body length + SHA-256 matching manifest |   **915/915** |
| Credentialed bytes streamed                          | `142,518,527` |
| Credential-free GETs returning 401                   |   **915/915** |
| Credential-free responses with zero body bytes       |   **915/915** |
| Total actual HTTP GETs                               |     **1,830** |

The smoke completed in `204,963 ms`. Manifest content distribution was 42
HTML pages, five JSON files, 867 other assets, and one `robots.txt`. Final
`launchctl list | grep private-review` retained second column `0` after all
1,830 requests.

## Integrated validation recorded before the Lighthouse stop

The same authorized Decision 17 work sequence completed the following final
integrated gates on 2026-08-14 before the three formal Lighthouse failures.
These figures are taken from the original command/session output; they were
not rerun during this closeout and are kept distinct from today's live smoke:

| Gate                         | Recorded final result                                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest + coverage            | **68/68** test files and **1,180/1,180** tests passed; global statements `88.02% (5577/6336)`, branches `84.38% (4701/5571)`, functions `94.39% (893/946)`, lines `88.47% (5366/6065)` |
| TypeScript / Astro / content | `tsc --noEmit` passed; Astro checked 260 files with **0 errors**, **0 warnings**, and 16 hints; content check passed with 26 cases, three overviews, and one update                    |
| Review build                 | 42 pages built; 822 optimized images                                                                                                                                                   |
| Final Playwright + axe run   | **244/244 passed** across Chromium, Firefox, WebKit, and mobile Chromium, including WCAG A/AA light/manual-dark checks                                                                 |
| Formatting at that state     | Prettier and `git diff --check` passed                                                                                                                                                 |

Earlier red runs in that work sequence are not concealed: the first coverage
run missed the scoped coverage threshold, the first artifact run found 28
YouTube-embed issues, and the first full E2E run was 240 passed / 4 failed on
one cross-project strict-locator defect. Those defects were corrected and the
full final runs above passed. None of those results changes the subsequent
Lighthouse failure recorded in this report.

## Focused validation executed for closeout

| Command / check                                     | Actual result                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run plan:verify`                               | passed; 30 bound documents                                                          |
| `npm run plan:assert-authorized -- <D17 plan>`      | authorized exact role/scope/decision                                                |
| `npm run decision13:clinical-freeze`                | **30/30 files byte-identical**; aggregate `bb02fb61…0e73`                           |
| `npm run decision17:baseline:check`                 | passed; protected evidence digest `f33ec875…489b4`                                  |
| `npm run decision17:contract:check`                 | **1 file, 7/7 tests passed**                                                        |
| `npm run decision17:b1:check`                       | 26 real + 1 fixture; reader 1, professional 4, timelines 0                          |
| `npm run decision17:follow-ups:check`               | 26 cases, 44 items, 3 empty; tiers 14/29/1; kinds 15/0/13/16 in canonical key order |
| `npm run decision17:follow-ups:dom`                 | 26 cases, 44 items, 3 empty; 41 NBA citations; 0 navigation sinks                   |
| `npm run decision17:digests:dom`                    | 27 cases/disclosures; 81 inputs; `open=0`                                           |
| `npm run verify:review-artifact`                    | 42 pages, 26 case pages, 915 files; noindex/static artifact checks passed           |
| Memory-only NBA sink scan                           | attributes 0, JSON-LD 0, scripts 0, redirects 0, shard hits 0                       |
| Complete memory-only live smoke                     | 915/915 HTTP 200 and 915/915 HTTP 401                                               |
| `launchctl list \| grep private-review` after smoke | second column `0`                                                                   |
| `npm run format:check`                              | passed                                                                              |
| `npm run private:verify`                            | **NOT RUN by explicit owner instruction**                                           |

A post-documentation spot invocation initially inherited the login shell's
Node `v22.23.1` instead of the required injected PATH. The baseline checker
exited `1` immediately with its runtime guard, before performing the check or
changing a file. With the required absolute PATH restored, Node reported
`v24.14.0` and the baseline, clinical-freeze, plan-binding, Decision 17
contract, and formatting checks all passed again. This execution-precondition
failure is recorded here and is not represented as a gate pass.

## Closed scopes and final statement

- The 21 cover files were not changed.
- All 30 clinical-freeze files are byte-identical. Apart from the separately
  governed B-2 sidecars, no medical content was changed.
- Every B-2 item remains pending owner signoff; no medical-review decision was
  created or implied.
- `allowIndexing=false`, review noindex controls, and private access remain in
  force.
- Plan and authorization JSON bytes are unchanged.
- The historical `review/served-review-receipt.v1.json` remains unchanged at
  SHA-256 `7a6cc42cbd63a29130e51db891051dddc35b73a886cf65bfaaf5ff9538a5e2e0`;
  it is not Decision 17 evidence.
- No publication, deployment, indexing, external-account action, remote
  mutation, or push occurred.

**Decision 17 is closed under the owner's explicit disposition. The complete
private artifact smoke passed, but the Lighthouse gate did not pass and is
still recorded as FAIL / NOT ACHIEVED. The pending follow-up drafts are not
medically approved, and no public release has occurred.**
